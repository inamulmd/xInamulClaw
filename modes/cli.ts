import { confirm, intro, isCancel, outro, text } from "@clack/prompts";
import { askAI, type Message } from "../ai/chat.js";
import { runAgent } from "./agent/agent.js";

export async function startCLI() {
  intro("xInamulClaw CLI");

    const mode = await text({
    message: "Choose your mode (chat/agent)",
    placeholder: "chat",
  });

  if (mode === "agent") {
    const prompt = await text({
      message: "What should the agent do?",
      placeholder: "Describe your task...",
    });

    if (typeof prompt === "string") {
     const { result, tracker, executor } = await runAgent(prompt);

      for await (const chunk of result.textStream) {
        process.stdout.write(chunk);
      }


      console.log("\n");

      const pendingActions = tracker.getPendingMutations();

      if (pendingActions.length > 0) {
        console.log("\nPending actions:");

        console.log("\nPending actions:");

          for (const action of pendingActions) {
            console.log(`- Type: ${action.type}`);
            console.log(`  Path: ${action.path}`);

            if (action.details.command) {
              console.log(`  Command: ${action.details.command}`);
            }
          }

        const approved = await confirm({
          message: "Do you approve these changes?",
        });

        if (isCancel(approved) || !approved) {
          for (const action of pendingActions) {
            tracker.updateStatus(action.id, "rejected", false);
          }

          console.log("Changes rejected.");
        } else {
          for (const action of pendingActions) {
            tracker.updateStatus(action.id, "approved", true);
          }

          const { errors } = executor.applyApprovedFromTracker();

          if (errors.length > 0) {
            console.error("Some actions failed:", errors);
          } else {
            console.log("Approved actions applied successfully.");
          }
        }
      } else {
        console.log("No pending actions.");
      }
    }

    outro("Agent session finished.");
    return;
  }

  const messages: Message[] = [];

  while (true) {
    const input = await text({
      message: "You:",
      placeholder: "Type your message...",
    });

    if (typeof input !== "string") {
      break;
    }

    if (input.toLowerCase() === "exit") {
      break;
    }

    messages.push({
      role: "user",
      content: input,
    });

    console.log("\nAI:\n");

    try {
      const result = await askAI(messages);

let response = "";

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
    response += chunk;
  }

  if (!response) {
    const finalResult = await result.text;
    response = finalResult;
  }

      messages.push({
        role: "assistant",
        content: response,
      });

      console.log("\n");
    } catch (error) {
      console.error("\nSomething went wrong:", error);
    }
  }

  outro("Goodbye from xInamulClaw!");
}