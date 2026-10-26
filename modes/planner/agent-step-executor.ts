
import { confirm, isCancel } from "@clack/prompts";
import type { JSONValue, ToolModelMessage } from "ai";
import { continueAgent, runAgent } from "../agent/agent.js";
import type { ActionLog } from "../agent/types.js";
import type { ToolExecutor } from "../agent/tool-executor.js";
import type { PlanStep } from "./types.js";

type ShellExecutionResult = ReturnType<
  ToolExecutor["executeApprovedShell"]
>;

function createToolResultMessage(
  toolCallId: string,
  toolName: string,
  output: string | JSONValue,
  outputType: "text" | "json",
): ToolModelMessage {
  return {
    role: "tool",
    content: [
      {
        type: "tool-result",
        toolCallId,
        toolName,
        output:
          outputType === "text"
            ? { type: "text", value: String(output) }
            : { type: "json", value: output },
      },
    ],
  };
}

function createActionResult(
  action: ActionLog,
  shellResult?: ShellExecutionResult,
): ToolModelMessage | undefined {
  const toolCallId = action.details.toolCallId;

  if (!toolCallId) {
    return undefined;
  }

  switch (action.type) {
    case "tool_execute":
      if (!shellResult) return undefined;

      return createToolResultMessage(
        shellResult.toolCallId,
        "execute_shell",
        {
          command: shellResult.command,
          stdout: shellResult.stdout,
          stderr: shellResult.stderr,
          exitCode: shellResult.exitCode,
          ...(shellResult.error && { error: shellResult.error }),
          toolCallId: shellResult.toolCallId,
        },
        "json",
      );

    case "file_create":
      return createToolResultMessage(
        toolCallId,
        "create_file",
        {
          success: true,
          path: action.path,
          message: `File created successfully: ${action.path}`,
        },
        "json",
      );

    case "file_modify":
      return createToolResultMessage(
        toolCallId,
        "modify_file",
        {
          success: true,
          path: action.path,
          message: `File modified successfully: ${action.path}`,
        },
        "json",
      );

    case "file_delete":
      return createToolResultMessage(
        toolCallId,
        "delete_file",
        {
          success: true,
          path: action.path,
          message: `File deleted successfully: ${action.path}`,
        },
        "json",
      );

    case "folder_create":
      return createToolResultMessage(
        toolCallId,
        "create_folder",
        {
          success: true,
          path: action.path,
          message: `Folder created successfully: ${action.path}`,
        },
        "json",
      );

    case "code_analysis":
      return createToolResultMessage(
        toolCallId,
        action.details.toolName ?? "read_file",
        action.details.after ?? "",
        "text",
      );

    default:
      return undefined;
  }
}

export async function executePlannerStep(
  step: PlanStep,
  planGoal: string,
  completedSteps: PlanStep[],
  approvalHandler?: (actions: ActionLog[]) => Promise<boolean>,
): Promise<string> {
  console.log(`\nExecuting step: ${step.description}`);

  const {
    result,
    tracker,
    executor,
    messages,
    getStreamError,
  } = await runAgent(
    `Original user goal and constraints:
${planGoal}

Previously completed steps:
${
  completedSteps.length
    ? completedSteps
        .map(
          (previousStep) =>
            `- ${previousStep.id}: ${previousStep.description}\n` +
            `  Result: ${(previousStep.result ?? "No result recorded").slice(0, 1200)}`,
        )
        .join("\n")
    : "None yet."
}

Current Planner step:
${step.description}

Complete only the current step. Use previous results when relevant.
Follow every restriction in the original user goal.`,
  );

  const output: string[] = [];
  const addedToolCallIds = new Set<string>();

  let currentResult = result;
  let getCurrentStreamError: () => unknown = getStreamError;

  while (true) {
    for await (const chunk of currentResult.textStream) {
      process.stdout.write(chunk);
      output.push(chunk);
    }

    const streamError = getCurrentStreamError();

    if (streamError !== undefined) {
      const message =
        streamError instanceof Error
          ? streamError.message
          : String(streamError);

      throw new Error(
        `Agent failed during step "${step.id}": ${message}`,
      );
    }

    const responseMessages = await currentResult.responseMessages;

    for (const message of responseMessages) {
      if (message.role === "assistant") {
        messages.push(message);
      }
    }

    const pendingActions = tracker.getPendingMutations();

const requestedCreateMatch = planGoal.match(
  /\bfile\s+(?:named|called)\s+[`'"]?([^\s`'"]+)/i,
);



const requestedCreateName = requestedCreateMatch?.[1]
  ?.replace(/[.,;:]+$/, "")
  .toLowerCase();  

const explicitlyForbidsAllFiles =
  /\b(?:do not|don't|never)\b[^.\n]{0,100}\b(?:any|all)\s+(?:project\s+)?files?\b/i.test(
    planGoal,
  );

const mentionsFileChangeRestriction =
  /\b(?:do not|don't|never|without)\b[\s\S]*\b(?:modif\w*|creat\w*|writ\w*|delet\w*|edit\w*|chang\w*)\b[\s\S]*\bfiles?\b/i.test(
    planGoal,
  );

if (
  (explicitlyForbidsAllFiles || mentionsFileChangeRestriction) &&
  pendingActions.length > 0
) {
  const disallowedActions = pendingActions.filter((action) => {
    if (explicitlyForbidsAllFiles || !requestedCreateName) {
      return true;
    }

    const fileName = action.path
      .replace(/\\/g, "/")
      .split("/")
      .pop()
      ?.toLowerCase();

    return (
      action.type !== "file_create" ||
      fileName !== requestedCreateName
    );
  });

  if (disallowedActions.length > 0) {
    for (const action of pendingActions) {
      tracker.updateStatus(action.id, "rejected", false);
    }

    throw new Error(
      "Pending actions rejected because they violate the original file-change restrictions.",
    );
  }
}

    if (pendingActions.length === 0) {
      return output.join("");
    }

    console.log("\n\nActions requiring approval:");

    for (const action of pendingActions) {
      console.log(`- Type: ${action.type}`);
      console.log(`  Path: ${action.path}`);

      if (action.details.command) {
        console.log(`  Command: ${action.details.command}`);
      }
    }

    const approved = approvalHandler
      ? await approvalHandler(pendingActions)
      : await confirm({
          message: "Approve these actions for this Planner step?",
      });

    if (isCancel(approved) || !approved) {
      for (const action of pendingActions) {
        tracker.updateStatus(action.id, "rejected", false);
      }

      throw new Error("User rejected the pending actions.");
    }

    for (const action of pendingActions) {
      tracker.updateStatus(action.id, "approved", true);
    }

    const executionErrors: string[] = [];
    const shellResults = new Map<string, ShellExecutionResult>();

    for (const action of pendingActions) {
      if (action.type !== "tool_execute") {
        continue;
      }

      try {
        const shellResult = executor.executeApprovedShell(action.id);
        shellResults.set(action.id, shellResult);

        console.log("\nShell result:");
        console.log("Command:", shellResult.command);
        console.log("Exit code:", shellResult.exitCode);
        console.log("Output:", shellResult.stdout);
        console.log("Error:", shellResult.stderr);

        if (shellResult.error || shellResult.exitCode !== 0) {
          executionErrors.push(
            shellResult.error ??
              `Shell command failed with exit code ${shellResult.exitCode}: ${shellResult.command}`,
          );
        }
      } catch (error) {
        executionErrors.push(
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    const { errors } = executor.applyApprovedFromTracker();
    executionErrors.push(...errors);

    if (executionErrors.length > 0) {
      throw new Error(executionErrors.join("\n"));
    }

    for (const action of tracker.getActions()) {
      if (action.status !== "executed") {
        continue;
      }

      const toolCallId = action.details.toolCallId;

      if (!toolCallId || addedToolCallIds.has(toolCallId)) {
        continue;
      }

      const toolMessage = createActionResult(
        action,
        shellResults.get(action.id),
      );

      if (toolMessage) {
        messages.push(toolMessage);
        addedToolCallIds.add(toolCallId);
      }
    }

    console.log("\nApproved actions applied successfully.");

    const continuation = await continueAgent(messages, executor);

    currentResult = continuation;
    getCurrentStreamError = continuation.getStreamError;
  }
}
