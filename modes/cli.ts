import { intro, outro, text } from "@clack/prompts";
import { askAI, type Message } from "../ai/chat.js";

export async function startCLI() {
  intro("xInamulClaw CLI");

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