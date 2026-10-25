import assert from "node:assert/strict";
import { Planner } from "./planner.js";

async function main() {
  // Test 1: All steps complete successfully.
  const successPlanner = new Planner();

  const successPlan = successPlanner.createPlanFromSteps(
    "Test successful execution",
    [
      { id: "step_1", description: "First step", dependencies: [] },
      {
        id: "step_2",
        description: "Second step",
        dependencies: ["step_1"],
      },
    ],
  );

  const completedPlan = await successPlanner.executePlan(
    successPlan.id,
    async (step) => `Completed ${step.id}`,
  );

  assert.equal(completedPlan.status, "completed");
  assert.ok(
    completedPlan.steps.every((step) => step.status === "completed"),
  );

  console.log("Success test passed.");

  // Test 2: A failed step prevents dependent steps from executing.
  const failurePlanner = new Planner();

  const failurePlan = failurePlanner.createPlanFromSteps(
    "Test failed execution",
    [
      { id: "step_1", description: "First step", dependencies: [] },
      {
        id: "step_2",
        description: "Failing step",
        dependencies: ["step_1"],
      },
      {
        id: "step_3",
        description: "Dependent step",
        dependencies: ["step_2"],
      },
    ],
  );

  const failedPlan = await failurePlanner.executePlan(
    failurePlan.id,
    async (step) => {
      if (step.id === "step_2") {
        throw new Error("Simulated failure");
      }

      return `Completed ${step.id}`;
    },
  );

  assert.equal(failedPlan.status, "failed");
  assert.equal(failedPlan.steps[0]!.status, "completed");
  assert.equal(failedPlan.steps[1]!.status, "failed");
  assert.equal(failedPlan.steps[2]!.status, "skipped");

  console.log("Failure test passed.");
  console.log("All Planner execution tests passed.");
}

main().catch((error) => {
  console.error("Planner execution test failed:", error);
  process.exitCode = 1;
});