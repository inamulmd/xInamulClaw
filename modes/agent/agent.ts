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


export async function runAgent( prompt: string,
  workspacePath: string = process.cwd(),) {
  const tracker = new ActionTracker();

   const messages: ModelMessage[] = [
    {
      role: "user",
      content: prompt,
    },
  ];
  const config =  defaultAgentConfig(workspacePath);
  const executor = new ToolExecutor(tracker, config);
  const tools = createAgentTools(executor);

  let streamError: unknown;
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
- The environment is Windows. The execute_shell tool runs Windows Command Prompt (cmd.exe), not Bash or Linux.
- Never use Unix commands such as pwd, ls, cat, touch, or mkdir -p.
- Prefer read_file and list_files tools for inspecting files instead of shell commands.
- When shell commands are necessary, use Windows-compatible syntax such as cd, dir, type, and mkdir.
- Never claim a command succeeded unless its actual result confirms success.
`,
    messages,
    tools,
    stopWhen: stepCountIs(10),

    onError: ({ error }) => {
    streamError = error;
  },
  });

  return { result, tracker, executor,messages, getStreamError: () => streamError,};
}

export async function continueAgent(
  messages: ModelMessage[],
  executor: ToolExecutor,
) {
  const tools = createAgentTools(executor);
  let streamError: unknown;

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
  - After receiving a tool result, use its actual output.
  - Never claim a change has been applied unless it actually has.
  - If you cannot complete the task, explain what remains incomplete.
  - Explain your work clearly.
  - The environment is Windows. The execute_shell tool runs Windows Command Prompt (cmd.exe), not Bash or Linux.
  - Never use Unix commands such as pwd, ls, cat, touch, or mkdir -p.
  - Prefer read_file and list_files tools for inspecting files instead of shell commands.
  - When shell commands are necessary, use Windows-compatible syntax such as cd, dir, type, and mkdir.
  - Never claim a command succeeded unless its actual result confirms success.
    `,

      messages,
      tools,
      stopWhen: stepCountIs(10),
      onError: ({ error }) => {
        streamError = error;
      },
    });

    return Object.assign(result, {
      getStreamError: () => streamError,
    });
}
