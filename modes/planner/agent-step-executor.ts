import { confirm, isCancel } from "@clack/prompts";
import { runAgent } from "../agent/agent.js";
import type { PlanStep } from "./types.js";

export async function executePlannerStep(
  step: PlanStep,
): Promise<string> {
  console.log(`\nExecuting step: ${step.description}`);

  const { result, tracker, executor } = await runAgent(
    `Complete this Planner task:\n${step.description}`,
  );

  const output: string[] = [];

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
    output.push(chunk);
  }

  const pendingActions = tracker.getPendingMutations();

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

  const approved = await confirm({
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

  for (const action of pendingActions) {
    if (action.type !== "tool_execute") {
      continue;
    }

    try {
      const shellResult = executor.executeApprovedShell(action.id);

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

  console.log("\nApproved actions applied successfully.");

  return `${output.join("")}\nApproved actions applied successfully.`;
}