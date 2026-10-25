import { executePlannerStep } from "./agent-step-executor.js";
import type { PlanStep } from "./types.js";

const goal =
  "Create a file named planner-approval-test.txt containing exactly: Planner approval continuation works. Do not modify any other file.";

const step: PlanStep = {
  id: "approval-test",
  description:
    "Create planner-approval-test.txt with the exact content requested in the original goal.",
  dependencies: [],
  status: "pending",
};

async function main() {
  const result = await executePlannerStep(step, goal, []);

  console.log("\nFinal result:");
  console.log(result);
}

main().catch((error) => {
  console.error("Approval continuation test failed:", error);
  process.exitCode = 1;
});