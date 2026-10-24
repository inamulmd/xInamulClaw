import type {
  Plan,
  PlanStatus,
  PlanStep,
  PlanStepStatus,
} from "./types.js";

export class PlanManager {
  private plans = new Map<string, Plan>();

  createPlan(goal: string, steps: Omit<PlanStep, "status">[]): Plan {
    const now = new Date();

    const plan: Plan = {
      id: `plan_${Date.now()}`,
      goal,
      status: "pending",
      steps: steps.map((step) => ({
        ...step,
        status: "pending",
      })),
      createdAt: now,
      updatedAt: now,
    };

    this.plans.set(plan.id, plan);
    return plan;
  }

  getPlan(planId: string): Plan | undefined {
    return this.plans.get(planId);
  }

  updatePlanStatus(planId: string, status: PlanStatus): void {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    plan.status = status;
    plan.updatedAt = new Date();
  }

  updateStepStatus(
    planId: string,
    stepId: string,
    status: PlanStepStatus,
    result?: string,
    error?: string,
  ): void {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    const step = plan.steps.find((item) => item.id === stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    step.status = status;

    if (result !== undefined) {
      step.result = result;
    }

    if (error !== undefined) {
      step.error = error;
    }

    plan.updatedAt = new Date();
  }

  getPlans(): Plan[] {
    return [...this.plans.values()];
  }

    getReadySteps(planId: string): PlanStep[] {
    const plan = this.plans.get(planId);

    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    return plan.steps.filter((step) => {
      if (step.status !== "pending") {
        return false;
      }

      return step.dependencies.every((dependencyId) => {
        const dependency = plan.steps.find(
          (item) => item.id === dependencyId,
        );

        return dependency?.status === "completed";
      });
    });
  }
}
