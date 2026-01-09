// Flow Diagram Types

export type TransitionType = "auto" | "manual" | "approval";
export type TransitionTrigger = "all-tasks" | "required-tasks" | "any-time";
export type AIBot = 
  | "merchant-potential-researcher"
  | "market-competition-researcher" 
  | "merchant-researcher"
  | "sales-strategist"
  | "content-reviewer"
  | "deal-quality-checker"
  | "license-checker"
  | "content-approval"
  | "quality-assurance";
export type StageRow = "draft" | "won";
export type BotApprovalMode = "turbo" | "normal" | "manual";

// Task interface for stage tasks
export interface Task {
  id: string;
  title: string;
  assignedTo?: string[];  // Human roles assigned to this task
  assignedBot?: AIBot;    // AI bot assigned to this task (mutually exclusive with assignedTo)
  isRequired: boolean;
  description?: string;
  estimatedTime?: number; // in minutes (stored as number, displayed with "m" suffix)
  
  // Human approval workflow (when assigned to human)
  requiresApproval?: boolean;
  approvalFrom?: string[];
  aiBotApprovers?: AIBot[];
  
  // Bot workflow configuration (when assigned to bot)
  botApprovalMode?: BotApprovalMode;  // turbo | normal | manual
  botEscalationRole?: string;         // Required: who handles escalated cases
  botReviewRole?: string;             // Optional: who reviews bot's completed work
}

export interface StageData {
  id: string;
  label: string;
  icon: string;
  color: string;
  row: StageRow;
  isEnd?: boolean;
  taskCount?: number; // Number of tasks in this stage
  sortOrder?: number; // Order within the phase
}

export interface StateData {
  id: string;
  label: string;
  icon: string;
  color: string;
  isNegative: boolean;
}

export interface EdgeConfig {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  transitionType: TransitionType;
  transitionTrigger: TransitionTrigger;
  approvalRoles?: string[];
  aiBotApprovers?: AIBot[];
}

export interface ConnectionData {
  id: string;
  sourceId: string;
  targetId: string;
  transitionType: TransitionType;
  trigger: TransitionTrigger;
  approvers?: string;
  bots?: string;
  onEdgeClick?: (data: ConnectionData) => void;
  onInsertStage?: (afterStageId: string, beforeStageId: string) => void;
  isPhaseConnection?: boolean; // True if this is a phase-to-phase connection
}

// Validation: which triggers are valid for each transition type
export const VALID_TRIGGERS: Record<TransitionType, TransitionTrigger[]> = {
  auto: ["all-tasks", "required-tasks"], // Auto CANNOT be "anytime"
  manual: ["all-tasks", "required-tasks", "any-time"],
  approval: ["all-tasks", "required-tasks"], // Approval needs task completion
};

// Get default trigger for a transition type
export const getDefaultTrigger = (type: TransitionType): TransitionTrigger => {
  if (type === "auto") return "all-tasks";
  if (type === "approval") return "required-tasks";
  return "any-time";
};

// Validate if a trigger is valid for a transition type
export const isValidTrigger = (
  type: TransitionType,
  trigger: TransitionTrigger
): boolean => {
  return VALID_TRIGGERS[type].includes(trigger);
};

