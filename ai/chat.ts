import { streamText, tool ,stepCountIs} from "ai";
import { openrouter } from "./client.js";
import { calculator } from "../tools/calculator.js";
import { z } from "zod";
import { readProjectFile } from "../tools/read-file.js";
import { listProjectFiles } from "../tools/list-files.js";
import { writeProjectFile } from "../tools/write-file.js";

export type Message = {
  role: "user" | "assistant";
  content: string;

};

export async function askAI(messages: Message[]) {
  return streamText({
    model: openrouter("openrouter/free"),

     stopWhen: stepCountIs(5),

    system: `
You are xInamulClaw, an AI agent.

You can use tools when necessary.

Rules:
- Give direct and useful answers.
- Keep normal answers short.
- Use the calculator tool when mathematical calculation is required.
- Do not manually calculate complicated arithmetic when the calculator tool can do it.
`,

    messages,

    tools: {
      calculator: tool({
        description: "Calculate a mathematical expression.",

        inputSchema: z.object({
          expression: z
            .string()
            .describe("A mathematical expression such as 25 * 40"),
        }),

        execute: async ({ expression }) => {
          return calculator(expression);
        },
      }),
    readFile: tool({
        description:
          "Read a file from the current project so you can inspect its contents.",

        inputSchema: z.object({
          filePath: z
            .string()
            .describe("Path of the file to read, such as package.json or ai/chat.ts"),
        }),

        execute: async ({ filePath }) => {
          return readProjectFile(filePath);
        },
      }),

    listFiles: tool({
      description:
        "List all files in the current project so you can understand its structure.",

      inputSchema: z.object({
        directory: z
          .string()
          .optional()
          .describe("Directory to scan. Use '.' for the current project."),
      }),

      execute: async ({ directory }) => {
        return listProjectFiles(directory ?? ".");
      },
    }),
    
    writeFile: tool({
      description:
        "Write content to a file in the current project. Use this only when the user explicitly asks you to create or modify a file.",

      inputSchema: z.object({
        filePath: z
          .string()
          .describe("Path of the file to write, such as example.txt"),

        content: z
          .string()
          .describe("The complete content that should be written to the file"),
      }),

      execute: async ({ filePath, content }) => {
        await writeProjectFile(filePath, content);

        return `Successfully wrote file: ${filePath}`;
      },
    }),

    },
  });
}