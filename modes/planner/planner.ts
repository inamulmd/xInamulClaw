
import { generatePlan } from "./plan-generator.js";
import { PlanManager } from "./plan-manager.js";
import type { Plan, PlanStep } from "./types.js";

import { executePlannerStep } from "./agent-step-executor.js";

import type { ActionLog } from "../agent/types.js";

export class Planner {
  private manager = new PlanManager();

  async createPlan(goal: string): Promise<Plan> {
    const generated = await generatePlan(goal);

    return this.manager.createPlan(
      `${generated.title}: ${goal.trim()}`,
      generated.steps.map((step) => ({
        id: step.id,
        description: step.description,
        dependencies: step.dependencies,
      })),
    );
  }


  createPlanFromSteps(
    goal: string,
    steps: Omit<PlanStep, "status">[],
  ): Plan {
    return this.manager.createPlan(goal, steps);
  }



  getPlan(planId: string): Plan | undefined {
    return this.manager.getPlan(planId);
  }

  getPlans(): Plan[] {
    return this.manager.getPlans();
  }

   



   async runPlan(
      planId: string,
     approvalHandler?: (actions: ActionLog[]) => Promise<boolean>,): Promise<Plan> {
      const plan = this.manager.getPlan(planId);

      if (!plan) {
        throw new Error(`Plan not found: ${planId}`);
      }

      return this.executePlan(
        planId,
        (step, completedSteps) =>
          executePlannerStep(
            step,
            plan.goal,
            completedSteps,
            approvalHandler,
          ),
      );
}

  async executePlan(
    planId: string,
    executeStep: ( step: PlanStep,
    completedSteps: PlanStep[],) => Promise<string>,
  ): Promise<Plan> {
    const initialPlan = this.manager.getPlan(planId);

    if (!initialPlan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    this.manager.updatePlanStatus(planId, "in_progress");

    while (true) {
      const plan = this.manager.getPlan(planId)!;

      if (plan.steps.every((step) => step.status === "completed")) {
        this.manager.updatePlanStatus(planId, "completed");
        return this.manager.getPlan(planId)!;
      }

      const readySteps = this.manager.getReadySteps(planId);

      if (readySteps.length === 0) {
        for (const step of plan.steps) {
          if (step.status === "pending") {
            this.manager.updateStepStatus(
              planId,
              step.id,
              "skipped",
              undefined,
              "Step skipped because its dependencies could not be completed.",
            );
          }
        }

        this.manager.updatePlanStatus(planId, "failed");
        return this.manager.getPlan(planId)!;
      }

      for (const step of readySteps) {
        this.manager.updateStepStatus(planId, step.id, "in_progress");

        try {

          const completedSteps = this.manager
          .getPlan(planId)!
          .steps.filter((item) => item.status === "completed");

          const result = await executeStep(step, completedSteps);
         

          this.manager.updateStepStatus(
            planId,
            step.id,
            "completed",
            result,
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);

          this.manager.updateStepStatus(
            planId,
            step.id,
            "failed",
            undefined,
            message,
          );

          const currentPlan = this.manager.getPlan(planId)!;

          for (const pendingStep of currentPlan.steps) {
            if (pendingStep.status === "pending") {
              this.manager.updateStepStatus(
                planId,
                pendingStep.id,
                "skipped",
                undefined,
                "Step skipped because an earlier step failed.",
              );
            }
          }

          this.manager.updatePlanStatus(planId, "failed");
          return this.manager.getPlan(planId)!;
        }
      }
    }
  }
}
