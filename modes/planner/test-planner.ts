
import { PlanManager } from "./plan-manager.js";

const manager = new PlanManager();

const plan = manager.createPlan("Test dependencies", [
  { id: "step_1", description: "First step", dependencies: [] },
  { id: "step_2", description: "Second step", dependencies: ["step_1"] },
  { id: "step_3", description: "Third step", dependencies: ["step_2"] },
]);

console.log(
  "Initially ready:",
  manager.getReadySteps(plan.id).map((step) => step.id),
);

manager.updateStepStatus(plan.id, "step_1", "completed");

console.log(
  "After step_1 completes:",
  manager.getReadySteps(plan.id).map((step) => step.id),
);

manager.updateStepStatus(plan.id, "step_2", "completed");

console.log(
  "After step_2 completes:",
  manager.getReadySteps(plan.id).map((step) => step.id),
);
