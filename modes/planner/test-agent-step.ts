import { executePlannerStep } from "./agent-step-executor.js";
import type { PlanStep } from "./types.js";

const step: PlanStep = {
  id: "read-package",
  description:
    "Read package.json and report each script name and command. Do not create, modify, or delete any files.",
  dependencies: [],
  status: "pending",
};

async function main() {
  const result = await executePlannerStep(
    step,
    "Read package.json and summarize its scripts. Do not create, modify, or delete any files.",
    [],
  );

  console.log("\n\nAgent step result:");
  console.log(result);
}

main().catch((error) => {
  console.error("Agent step test failed:", error);
  process.exitCode = 1;
});