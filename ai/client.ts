import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "../config/env.js";

export const openrouter = createOpenRouter({
  apiKey: env.openRouterApiKey,
});