import { intro, outro, text } from "@clack/prompts";
import { askAI } from "../ai/chat.js";

export async function startCLI() {
  intro("xInamulClaw CLI");

  const message = await text({
    message: "What do you want to ask?",
    placeholder: "Type your message...",
  });

  if (typeof message !== "string") {
    outro("Goodbye!");
    return;
  }

  console.log("\nAI:\n");

  try {
    const result = await askAI(message);

    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }

    console.log("\n");
  } catch (error) {
    console.error("\nSomething went wrong:", error);
  }

  outro("xInamulClaw finished.");
}