
import { Markup, Telegraf } from "telegraf";
import { env } from "../config/env.js";
import { Planner } from "./planner/planner.js";
import type { ActionLog } from "./agent/types.js";

const activePlans = new Map<
  string,
  { planner: Planner; chatId: number; running: boolean }
>();

const pendingApprovals = new Map<
  string,
  (approved: boolean) => void
>();

let approvalCounter = 0;

function isOwner(userId?: number): boolean {
  return Boolean(
    env.telegramAllowedUserId &&
    userId !== undefined &&
    String(userId) === env.telegramAllowedUserId,
  );
}

function requestActionApproval(
  bot: Telegraf,
  chatId: number,
  actions: ActionLog[],
): Promise<boolean> {
  const requestId =
    `a${Date.now().toString(36)}${(++approvalCounter).toString(36)}`;

  const description = actions
    .map(
      (action, index) =>
        `${index + 1}. ${action.type}\n` +
        `Path: ${action.path}` +
        (action.details.command
          ? `\nCommand: ${action.details.command}`
          : ""),
    )
    .join("\n\n");

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      pendingApprovals.delete(requestId);
      resolve(false);
      void bot.telegram.sendMessage(
        chatId,
        "Approval expired. The pending actions were rejected.",
      );
    }, 5 * 60 * 1000);

    pendingApprovals.set(requestId, (approved) => {
      clearTimeout(timeout);
      resolve(approved);
    });

    void bot.telegram
      .sendMessage(
        chatId,
        `The Agent requests approval for these actions:\n\n${description}`,
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "✅ Approve actions",
              `action:approve:${requestId}`,
            ),
            Markup.button.callback(
              "❌ Reject actions",
              `action:reject:${requestId}`,
            ),
          ],
        ]),
      )
      .catch((error) => {
        clearTimeout(timeout);
        pendingApprovals.delete(requestId);
        console.error("Could not send Telegram approval request:", error);
        resolve(false);
      });
  });
}

export async function startTelegramBot(): Promise<void> {
  const token = env.telegramBotToken;

  if (!token) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is missing. Add it to your .env file.",
    );
  }

  const bot = new Telegraf(token);

  bot.start(async (ctx) => {
    await ctx.reply(
      "Welcome to xInamulClaw!\n\n" +
        "/start - Start the bot\n" +
        "/help - Show commands\n" +
        "/ping - Check the bot\n" +
        "/id - Show your Telegram user ID\n" +
        "/plan <goal> - Generate and run a plan",
    );
  });

  bot.help(async (ctx) => {
    await ctx.reply(
      "xInamulClaw commands:\n\n" +
        "/start - Start the bot\n" +
        "/help - Show commands\n" +
        "/ping - Check the bot\n" +
        "/id - Show your Telegram user ID\n" +
        "/plan <goal> - Generate and run a plan",
    );
  });

  bot.command("ping", async (ctx) => {
    await ctx.reply("Pong! xInamulClaw is online.");
  });

  bot.command("id", async (ctx) => {
    if (
      env.telegramAllowedUserId &&
      !isOwner(ctx.from?.id)
    ) {
      await ctx.reply("Access denied.");
      return;
    }

    await ctx.reply(`Your Telegram user ID is: ${ctx.from.id}`);
  });

  bot.command("plan", async (ctx) => {
    if (!isOwner(ctx.from?.id)) {
      await ctx.reply(
        "Access denied. Configure TELEGRAM_ALLOWED_USER_ID in .env.",
      );
      return;
    }

    const messageText =
      ctx.message && "text" in ctx.message ? ctx.message.text : "";

    const goal = messageText
      .replace(/^\/plan(?:@\w+)?\s*/i, "")
      .trim();

    if (!goal) {
      await ctx.reply(
        "Usage:\n/plan Read package.json and summarize its scripts",
      );
      return;
    }

    const statusMessage = await ctx.reply("Generating your plan...");

    try {
      const planner = new Planner();
      const plan = await planner.createPlan(goal);

      activePlans.set(plan.id, {
        planner,
        chatId: ctx.chat.id,
        running: false,
      });

      const stepsText = plan.steps
        .map(
          (step) =>
            `${step.id}: ${step.description}\n` +
            `Dependencies: ${step.dependencies.join(", ") || "None"}`,
        )
        .join("\n\n");

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMessage.message_id,
        undefined,
        (
          `Goal: ${goal}\n\n` +
          `Generated plan:\n\n${stepsText}\n\n` +
          "Approve this plan to begin execution."
        ).slice(0, 3900),
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "✅ Approve plan",
                  callback_data: `plan:approve:${plan.id}`,
                },
                {
                  text: "❌ Reject plan",
                  callback_data: `plan:reject:${plan.id}`,
                },
              ],
            ],
          },
        },
      );
    } catch (error) {
      await ctx.reply(
        `Could not generate the plan: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  });

  bot.action(/^plan:(approve|reject):(plan_\d+)$/, async (ctx) => {
    if (!isOwner(ctx.from?.id)) {
      await ctx.answerCbQuery("Access denied.");
      return;
    }

    const decision = ctx.match[1];
    const planId = ctx.match[2];

    if (!decision || !planId) {
    await ctx.answerCbQuery("Invalid callback data.");
    return;
    }

    
    const entry = activePlans.get(planId);

    if (!entry) {
      await ctx.answerCbQuery("This plan is no longer available.");
      return;
    }

    if (entry.running) {
      await ctx.answerCbQuery("This plan is already running.");
      return;
    }

    await ctx.answerCbQuery();

    if (decision === "reject") {
      activePlans.delete(planId);
      await ctx.editMessageText("Plan rejected. No steps were executed.");
      return;
    }

   entry.running = true;

    await ctx.answerCbQuery("Plan approved.");

    await ctx.editMessageText(
      "Plan approved. Execution started. I'll send you the results.",
    );

    // Run execution without blocking Telegram's callback handler.
    void (async () => {
      try {
        const completedPlan = await entry.planner.runPlan(
          planId,
          (actions) =>
            requestActionApproval(bot, entry.chatId, actions),
        );

       console.log(
          `\n[Telegram Planner] Plan ${planId} finished: ${completedPlan.status}`,
           );

        for (const step of completedPlan.steps) {
          console.log(
            `[Telegram Planner] ${step.id}: ${step.status} — ${step.description}`,
          );
         }  

        const summary = completedPlan.steps
          .map((step) => {
            const icon =
              step.status === "completed"
                ? "✅"
                : step.status === "failed"
                  ? "❌"
                  : "⏭️";

            return `${icon} ${step.id}: ${step.status}\n${step.description}`;
          })
          .join("\n\n");

        await bot.telegram.sendMessage(
          entry.chatId,
          `Planner finished: ${completedPlan.status}\n\n${summary}`.slice(
            0,
            3900,
          ),
        );
      } catch (error) {
        try {
          await bot.telegram.sendMessage(
            entry.chatId,
            `Planner execution failed:\n${
              error instanceof Error ? error.message : String(error)
            }`.slice(0, 3900),
          );
        } catch (sendError) {
          console.error("Could not send Planner failure message:", sendError);
        }
      } finally {
        activePlans.delete(planId);
      }
    })().catch((error) => {
      console.error("Unexpected Planner background error:", error);
    });

   
  });

 bot.action(/^action:(approve|reject):(a[a-z0-9]+)$/, async (ctx) => {
  if (!isOwner(ctx.from?.id)) {
    await ctx.answerCbQuery("Access denied.");
    return;
  }

  const decision = ctx.match[1];
  const requestId = ctx.match[2];

  if (!decision || !requestId) {
    await ctx.answerCbQuery("Invalid callback data.");
    return;
  }

  const resolveApproval = pendingApprovals.get(requestId);

  if (!resolveApproval) {
    await ctx.answerCbQuery("This approval has expired.");
    return;
  }

  // Acknowledge Telegram's callback before resuming execution.
  try {
    await ctx.answerCbQuery(
      decision === "approve" ? "Actions approved." : "Actions rejected.",
    );
  } catch (error) {
    console.warn("Could not acknowledge Telegram callback:", error);
  }

  pendingApprovals.delete(requestId);
  resolveApproval(decision === "approve");
});

  bot.catch((error) => {
    console.error("Telegram bot error:", error);
  });

  await bot.launch();
  console.log("xInamulClaw Telegram bot is running.");

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}
