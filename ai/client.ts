import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "../config/env.js";

export const openrouter = createOpenRouter({
  apiKey: env.openRouterApiKey,
});


// import { createOpenAI } from "@ai-sdk/openai";
// import { env } from "../config/env.js";

// export const groq = createOpenAI({
//   apiKey: env.groqApiKey,
//   baseURL: "https://api.groq.com/openai/v1",
// });