import "dotenv/config";

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  throw new Error(
    "OPENROUTER_API_KEY is missing. Add it to your .env file."
  );
}

export const env = {
  openRouterApiKey: apiKey,
};