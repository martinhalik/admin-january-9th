import { StageData, StateData, AIBot, Task } from "./types";

// Icon options for stage creation
export const STAGE_ICONS = [
  "Search",
  "ClipboardCheck",
  "FileText",
  "MessageSquare",
  "ThumbsUp",
  "Calendar",
  "PlayCircle",
  "PauseCircle",
  "CheckCircle",
  "XCircle",
  "Send",
  "Eye",
  "Edit",
  "Target",
  "Star",
  "Flag",
  "Bookmark",
  "Clock",
  "Users",
  "Building",
  "Phone",
  "Mail",
  "FileCheck",
  "Shield",
  "Award",
  "Briefcase",
  "UserCheck",
  "AlertCircle",
  "Package",
];

// Role shortcuts for display
export const ROLE_SHORTCUTS: Record<string, string> = {
  "Business Development Representative (BD)": "BD",
  "Divisional Sales Manager (DSM)": "DSM",
  "Market Manager (MM)": "MM",
  "Merchant Development (MD)": "MD",
  "Content Operation Staff": "Content Ops",
  "Content Operation Manager": "Content Ops Mgr",
  Admin: "Admin",
};

export const getRoleShortcut = (fullRole: string): string => {
  return ROLE_SHORTCUTS[fullRole] || fullRole;
};

// AI Bot information
export const AI_BOTS: Record<AIBot, { icon: string; name: string; color: string }> = {
  // Research Bots
  "merchant-potential-researcher": { 
    icon: "Target", 
    name: "Merchant Potential Researcher", 
    color: "#1890ff" 
  },
  "market-competition-researcher": { 
    icon: "TrendingUp", 
    name: "Market Competition Researcher", 
    color: "#13c2c2" 
  },
  "merchant-researcher": { 
    icon: "Search", 
    name: "Merchant Researcher", 
    color: "#2f54eb" 
  },
  
  // Strategy & Review Bots
  "sales-strategist": { 
    icon: "Lightbulb", 
    name: "Sales Strategist Bot", 
    color: "#722ed1" 
  },
  "content-reviewer": { 
    icon: "FileText", 
    name: "Content Reviewer Bot", 
    color: "#eb2f96" 
  },
  "deal-quality-checker": { 
    icon: "CheckCircle", 
    name: "Deal Quality Checker", 
    color: "#52c41a" 
  },
  
  // Compliance & Approval Bots
  "license-checker": { 
    icon: "Shield", 
    name: "License Checker Bot", 
    color: "#faad14" 
  },
  "content-approval": { 
    icon: "FileCheck", 
    name: "Content Approval Bot", 
    color: "#fa541c" 
  },
  "quality-assurance": { 
    icon: "Zap", 
    name: "Quality Assurance Bot", 
    color: "#a0d911" 
  },
};

// Default stage configurations - synced with campaign-stage-management-schema.sql
export const DEFAULT_DRAFT_STAGES: StageData[] = [
  { id: "prospecting", label: "Prospecting", icon: "Search", color: "#1890ff", row: "draft", taskCount: 2 },
  { id: "pre_qualification", label: "Pre-qualification", icon: "ClipboardCheck", color: "#1890ff", row: "draft", taskCount: 1 },
  { id: "presentation", label: "Presentation", icon: "FileText", color: "#1890ff", row: "draft", taskCount: 3 },
  { id: "appointment", label: "Appointment", icon: "Calendar", color: "#1890ff", row: "draft", taskCount: 1 },
  { id: "proposal", label: "Proposal", icon: "FileText", color: "#1890ff", row: "draft", taskCount: 1 },
  { id: "needs_assessment", label: "Needs Assessment", icon: "UserCheck", color: "#1890ff", row: "draft", taskCount: 1 },
  { id: "contract_sent", label: "Contract Sent", icon: "FileText", color: "#1890ff", row: "draft", taskCount: 2 },
  { id: "negotiation", label: "Negotiation", icon: "MessageSquare", color: "#1890ff", row: "draft", taskCount: 2 },
  { id: "contract_signed", label: "Contract Signed", icon: "FileCheck", color: "#1890ff", row: "draft", taskCount: 1 },
  { id: "approved", label: "Approved", icon: "CheckCircle", color: "#1890ff", row: "draft", taskCount: 2 },
];

export const DEFAULT_WON_STAGES: StageData[] = [
  { id: "scheduled", label: "Scheduled", icon: "Calendar", color: "#52c41a", row: "won", taskCount: 2 },
  { id: "live", label: "Live", icon: "PlayCircle", color: "#52c41a", row: "won", taskCount: 2 },
  { id: "paused", label: "Paused", icon: "PauseCircle", color: "#faad14", row: "won", taskCount: 0 },
  { id: "sold_out", label: "Sold Out", icon: "Package", color: "#722ed1", row: "won", taskCount: 0 },
  { id: "ended", label: "Ended", icon: "CheckCircle", color: "#52c41a", row: "won", isEnd: true, taskCount: 1 },
];

export const DEFAULT_STATES: StateData[] = [
  { id: "paused", label: "Paused", icon: "PauseCircle", color: "#faad14", isNegative: false },
  { id: "closed_lost", label: "Lost", icon: "XCircle", color: "#ff4d4f", isNegative: true },
];

// Default tasks per stage - synced with campaign-stage-management-schema.sql
export const DEFAULT_TASKS: Record<string, Task[]> = {
  prospecting: [
    { id: "task-1", title: "Research merchant background", isRequired: true, assignedTo: ["Business Development Representative (BD)"] },
    { id: "task-2", title: "Make initial contact", isRequired: true, assignedTo: ["Business Development Representative (BD)"] },
  ],
  pre_qualification: [
    { id: "task-3", title: "Get manager approval", isRequired: true, requiresApproval: true, approvalFrom: ["Divisional Sales Manager (DSM)"], assignedTo: ["Divisional Sales Manager (DSM)"] },
  ],
  presentation: [
    { id: "task-4", title: "Create deal content", isRequired: true, assignedTo: ["Business Development Representative (BD)"], estimatedTime: 60 },
    { id: "task-5", title: "Upload deal images", isRequired: false, assignedTo: ["Business Development Representative (BD)"] },
    { id: "task-6", title: "Configure pricing options", isRequired: true, assignedTo: ["Business Development Representative (BD)"] },
  ],
  appointment: [
    { id: "task-7", title: "Configure booking settings", isRequired: true, assignedTo: ["Business Development Representative (BD)"] },
  ],
  proposal: [
    { id: "task-8", title: "Create and review proposal", isRequired: true, assignedTo: ["Business Development Representative (BD)"] },
  ],
  needs_assessment: [
    { id: "task-9", title: "Assess merchant requirements", isRequired: true, assignedTo: ["Business Development Representative (BD)"] },
  ],
  contract_sent: [
    { id: "task-10", title: "Send contract to merchant", isRequired: true, assignedTo: ["Business Development Representative (BD)"] },
    { id: "task-11", title: "Follow up on contract", isRequired: false, assignedTo: ["Business Development Representative (BD)"] },
  ],
  negotiation: [
    { id: "task-12", title: "Negotiate terms and pricing", isRequired: true, assignedTo: ["Business Development Representative (BD)", "Divisional Sales Manager (DSM)"] },
    { id: "task-13", title: "Review legal requirements", isRequired: false },
  ],
  contract_signed: [
    { id: "task-14", title: "Collect signed contracts", isRequired: true, assignedTo: ["Business Development Representative (BD)"] },
  ],
  approved: [
    { id: "task-15", title: "Final content review", isRequired: true, requiresApproval: true, approvalFrom: ["Market Manager (MM)"], assignedTo: ["Market Manager (MM)"] },
    { id: "task-16", title: "Schedule launch date", isRequired: true, assignedTo: ["Business Development Representative (BD)"] },
  ],
  scheduled: [
    { id: "task-17", title: "Notify merchant of launch", isRequired: true, assignedTo: ["Business Development Representative (BD)"] },
    { id: "task-18", title: "Confirm inventory ready", isRequired: true, assignedTo: ["Business Development Representative (BD)"] },
  ],
  live: [
    { id: "task-19", title: "Monitor deal performance", isRequired: false, assignedTo: ["Market Manager (MM)"] },
    { id: "task-20", title: "Check in with merchant", isRequired: false, assignedTo: ["Business Development Representative (BD)"] },
  ],
  paused: [],
  sold_out: [],
  ended: [
    { id: "task-21", title: "Generate final report", isRequired: true },
  ],
  lost: [],
};

// Available roles for task assignment
export const AVAILABLE_ROLES = [
  { label: "Sales", options: [
    { value: "Business Development Representative (BD)", label: "Business Development (BD)" },
    { value: "Divisional Sales Manager (DSM)", label: "Divisional Sales Manager (DSM)" },
    { value: "Market Manager (MM)", label: "Market Manager (MM)" },
    { value: "Merchant Development (MD)", label: "Merchant Development (MD)" },
  ]},
  { label: "Operations", options: [
    { value: "Content Operation Staff", label: "Content Operation Staff" },
    { value: "Content Operation Manager", label: "Content Operation Manager" },
  ]},
  { label: "Admin", options: [
    { value: "Admin", label: "Admin" },
  ]},
];

// Layout constants
export const LAYOUT = {
  X_SPACING: 260,
  ROW_1_Y: 80,  // Draft row
  ROW_2_Y: 320, // Won row (increased for more space between phases)
  STATE_OFFSET_X: 120, // More horizontal space between phases
  STATE_OFFSET_Y: 20,
};

// Colors
export const COLORS = {
  DRAFT: "#1890ff",
  WON: "#52c41a",
  AUTO: "#52c41a",
  MANUAL: "#1890ff",
  APPROVAL: "#fa8c16",
  LOST: "#ff4d4f",
  PAUSED: "#faad14",
};

