import { select } from "@clack/prompts";
import { startCLI } from "../modes/cli.js";
import { startTelegramBot } from "../modes/telegram.js";

export async function runWakeup () {
  console.log("\n🚀 xInamulClaw is waking up...\n");

  const mode = await select({
    message: "Which mode do you want to use?",
    options: [
      {
        value: "cli",
        label: "CLI",
      },
      {
        value: "telegram",
        label: "Telegram",
      },
      {
        value: "exit",
        label: "Exit",
      },
    ],
  });

  if (mode === "cli") {
    await startCLI();
  }

  if (mode === "telegram") {
    await startTelegramBot();
  }

  if (mode === "exit") {
    console.log("Goodbye!");
  }
}