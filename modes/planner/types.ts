
export type PlanStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

export type PlanStepStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "skipped";

export interface PlanStep {
  id: string;
  description: string;
  status: PlanStepStatus;
  dependencies: string[];
  result?: string;
  error?: string;
}

export interface Plan {
  id: string;
  goal: string;
  status: PlanStatus;
  steps: PlanStep[];
  createdAt: Date;
  updatedAt: Date;
}
