
import { generateObject } from "ai";
import { z } from "zod";
import { openrouter } from "../../ai/client.js";

const planSchema = z.object({
  title: z.string().describe("Short title for the plan"),
  steps: z
    .array(
      z.object({
        id: z.string().describe("Unique step ID, such as step_1"),
        description: z.string().describe("One actionable task"),
        dependencies: z
          .array(z.string())
          .describe("IDs of prerequisite steps, or an empty array"),
      }),
    )
    .min(1)
    .max(12)
    .describe("Ordered steps needed to achieve the goal"),
});

export type GeneratedPlan = z.infer<typeof planSchema>;

export async function generatePlan(goal: string): Promise<GeneratedPlan> {
  const normalizedGoal = goal.trim();

  if (!normalizedGoal) {
    throw new Error("The plan goal cannot be empty.");
  }

  const { object } = await generateObject({
    model: openrouter("openrouter/free"),
    schema: planSchema,
    prompt: `
Create a practical, ordered plan for this goal:

${normalizedGoal}

Rules:
- Produce between 1 and 12 actionable steps.
- Each step must describe one clear task.
- Give every step a unique ID.
- Use dependencies only when a step genuinely requires another step first.
- Every dependency must reference an existing step ID.
- Do not execute commands or claim any work has been completed.
- Keep the plan focused on the user's goal.
`,
  });


  const usedIds = new Set<string>();
  const originalToNormalized = new Map<string, string>();

  const steps = object.steps.map((step, index) => {
    const originalId = step.id.trim() || `step_${index + 1}`;
    let uniqueId = originalId;
    let suffix = 2;

    while (usedIds.has(uniqueId)) {
      uniqueId = `${originalId}_${suffix}`;
      suffix++;
    }

    usedIds.add(uniqueId);

    if (!originalToNormalized.has(originalId)) {
      originalToNormalized.set(originalId, uniqueId);
    }

    return {
      ...step,
      id: uniqueId,
    };
  });

  const normalizedPlan = {
    ...object,
    steps: steps.map((step, index) => ({
      ...step,
      dependencies: step.dependencies.map(
        (dependency) => originalToNormalized.get(dependency) ?? dependency,
      ),
    })),
  };

  const validIds = new Set(normalizedPlan.steps.map((step) => step.id));

  for (const step of normalizedPlan.steps) {
    for (const dependency of step.dependencies) {
      if (!validIds.has(dependency)) {
        throw new Error(
          `Step "${step.id}" references unknown dependency "${dependency}".`,
        );
      }

      if (dependency === step.id) {
        throw new Error(`Step "${step.id}" cannot depend on itself.`);
      }
    }
  }

 
  const dependenciesById = new Map(
    normalizedPlan.steps.map((step) => [step.id, step.dependencies]),
  );

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(stepId: string): void {
    if (visiting.has(stepId)) {
      throw new Error(
        `Circular dependency detected involving step "${stepId}".`,
      );
    }

    if (visited.has(stepId)) {
      return;
    }

    visiting.add(stepId);

    for (const dependency of dependenciesById.get(stepId) ?? []) {
      visit(dependency);
    }

    visiting.delete(stepId);
    visited.add(stepId);
  }

  for (const step of normalizedPlan.steps) {
    visit(step.id);
  }

  return normalizedPlan;


}
