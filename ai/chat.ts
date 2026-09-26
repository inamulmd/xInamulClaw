import { streamText } from "ai";
import { openrouter } from "./client.js";

export async function askAI(message: string) {
  const result = streamText({
    model: openrouter("openrouter/free"),
    prompt: message,
  });

  return result;
}