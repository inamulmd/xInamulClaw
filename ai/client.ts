import "dotenv/config";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  throw new Error("OPENROUTER_API_KEY is missing");
}

export const openrouter = createOpenRouter({
  apiKey,
});