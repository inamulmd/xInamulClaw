// import { streamText, stepCountIs } from "ai";
import { streamText, stepCountIs, type ModelMessage } from "ai";
import { openrouter } from "../../ai/client.js";
import { createAgentTools } from "./agent-tools.js";
import { ActionTracker } from "./action-tracker.js";
import { ToolExecutor } from "./tool-executor.js";
import { defaultAgentConfig } from "./types.js";

// streamText: Streams the model's response.
// stepCountIs: Limits the number of tool-use steps.
// openrouter: Connects to your configured AI model.
// createAgentTools: Provides the tools the agent can use.
// ActionTracker: Tracks file changes and other actions.
// ToolExecutor: Executes or stages operations.
// defaultAgentConfig: Provides the default workspace and permissions.


export async function runAgent(prompt: string) {
  const tracker = new ActionTracker();

   const messages: ModelMessage[] = [
    {
      role: "user",
      content: prompt,
    },
  ];
  const config = defaultAgentConfig();
  const executor = new ToolExecutor(tracker, config);
  const tools = createAgentTools(executor);

  const result = streamText({
    model: openrouter("openrouter/free"),
    system: `
You are xInamulClaw, an AI coding agent.

You can inspect a project, understand its structure,
and propose code changes using the available tools.

Rules:
- Understand the user's request before taking action.
- Read relevant files before modifying them.
- Use the available tools when necessary.
- File changes are staged and require user approval.
- Never claim a change has been applied unless it actually has.
- Explain your work clearly.
`,
    messages,
    tools,
    stopWhen: stepCountIs(10),
  });

  return { result, tracker, executor,messages};
}


export async function continueAgent(
      messages: ModelMessage[],
      executor: ToolExecutor,
    ) {
      const tools = createAgentTools(executor);

      return streamText({
        model: openrouter("openrouter/free"),
        system: `
    You are xInamulClaw, an AI coding agent.

    You can inspect a project, understand its structure,
    and propose code changes using the available tools.

    // Rules:
    // - Understand the user's request before taking action.
    // - Read relevant files before modifying them.
    // - Use the available tools when necessary.
    // - File changes are staged and require user approval.
    // - Never claim a change has been applied unless it actually has.
    // - Explain your work clearly.
    
      Rules:
      - Understand the user's request before taking action.
      - Read relevant files before modifying them.
      - Use the available tools when necessary.
      - File changes are staged and require user approval.
      - After receiving a shell result, use its actual output when continuing the task.
      - If the user requested a file to be created, modified, or deleted, you MUST call the corresponding file tool. Do not merely describe or claim the operation.
      - Never claim a change has been applied unless it actually has.
      - If you cannot complete the task, clearly explain what remains incomplete.
      - Explain your work clearly.

    `,
        messages,
        tools,
        stopWhen: stepCountIs(10),
      });
}
