import { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { Node, Edge, Connection, useNodesState, useEdgesState, addEdge, NodeDragHandler } from "reactflow";
import { message } from "antd";
import { StageData, StageRow, EdgeConfig, ConnectionData, getDefaultTrigger, Task } from "../types";
import { DEFAULT_DRAFT_STAGES, DEFAULT_WON_STAGES, LAYOUT, DEFAULT_TASKS } from "../constants";
import {
  FullWorkflowSchema,
  WorkflowStage,
  WorkflowTask,
  WorkflowPhase,
  createStage as apiCreateStage,
  updateStage as apiUpdateStage,
  deleteStage as apiDeleteStage,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  deleteTransitionsByStage,
  isSupabaseConfigured,
  saveDraftData,
  loadDraftData,
  clearDraftData,
  DraftData,
} from "../../../../lib/workflowSchemas";
import { getDealCountByStageId, getDealsByStageId } from "../../../../data/dealStageUtils";
import { Deal } from "../../../../data/mockDeals";

interface PendingInsert {
  afterStageId: string;
  phaseId: string; // Changed from row to phaseId for dynamic phases
  row?: StageRow; // Keep for backward compatibility
  position?: "start" | "end" | "after" | "above" | "below"; // Where to insert
}

// Dynamic phase info
interface DynamicPhase {
  id: string;
  name: string;
  displayName: string;
  color: string;
  icon: string;
  sortOrder: number;
  stages: StageData[];
}

interface UseFlowDiagramProps {
  schema?: FullWorkflowSchema | null;
  schemaId?: string | null;
}

interface UseFlowDiagramReturn {
  // State
  draftStages: StageData[];
  wonStages: StageData[];
  dynamicPhases: DynamicPhase[]; // All phases from schema
  getPhaseById: (phaseId: string) => DynamicPhase | null; // Helper to get phase info
  nodeState: Node[];
  edgeState: Edge[];
  selectedEdge: EdgeConfig | null;
  selectedStage: StageData | null;
  selectedPhase: DynamicPhase | null;
  sidebarOpen: boolean;
  stageSidebarOpen: boolean;
  phaseSidebarOpen: boolean;
  pendingInsert: PendingInsert | null;
  loading: boolean;
  
  // Save state (for auto-save and publish)
  hasUnsavedChanges: boolean; // Unsaved since last auto-save
  hasDraftChanges: boolean; // Draft differs from production (enables Publish)
  isSaving: boolean;
  lastSaved: Date | null;
  requestPublish: () => {
    hasChanges: boolean;
    deletedStages: { id: string; name: string }[];
    addedStages: string[];
    currentStages: StageData[];
  };
  publishLayout: (stageMappings?: Record<string, string>) => Promise<void>;

  // Node/Edge handlers
  onNodesChange: ReturnType<typeof useNodesState>[2];
  onEdgesChange: ReturnType<typeof useEdgesState>[2];
  onConnect: (connection: Connection) => void;
  onReconnect: (oldEdge: Edge, newConnection: Connection) => void;
  onConnectStart: (event: any, params: { nodeId: string | null; handleId: string | null }) => void;
  onConnectEnd: (event: any) => void;

  // Drag reorder handlers
  onNodeDragStart: NodeDragHandler;
  onNodeDrag: NodeDragHandler;
  onNodeDragStop: NodeDragHandler;

  // Phase management
  addPhase: (phase: { name: string; displayName: string; color: string }) => void;
  updatePhase: (phaseId: string, updates: Partial<DynamicPhase>) => void;
  deletePhase: (phaseId: string) => void;

  // Stage management
  addStage: (stage: StageData, position: string) => void;
  moveStage: (row: StageRow, stageId: string, direction: "up" | "down") => void;
  deleteStage: (row: StageRow, stageId: string) => void;
  clearPendingInsert: () => void;

  // Edge management
  handleEdgeClick: (data: ConnectionData) => void;
  saveEdge: (edge: EdgeConfig) => void;
  deleteEdge: (edgeId: string) => void;
  closeSidebar: () => void;

  // Stage management UI
  closeStageSlider: () => void;
  closePhaseSlider: () => void;
  saveStage: (updatedStage: StageData) => void;
  openStage: (stageId: string) => void; // Open stage sidebar by ID

  // Task management
  tasksByStage: Record<string, Task[]>;
  addTask: (stageId: string, task: Task) => void;
  updateTask: (stageId: string, task: Task) => void;
  deleteTask: (stageId: string, taskId: string) => void;
  reorderTasks: (stageId: string, tasks: Task[]) => void;
  moveTask: (taskId: string, fromStageId: string, toStageId: string) => void;
  allStages: StageData[];

  // Deal management
  getDealsByStage: (stageId: string) => Deal[];
  getDealCount: (stageId: string) => number;

  // Layout
  autoOrganize: () => void;
  setNodes: ReturnType<typeof useNodesState>[1];
}

// LocalStorage keys for persistence (fallback when Supabase not connected)
const STORAGE_KEYS = {
  DRAFT_STAGES: "flow-diagram-draft-stages",
  WON_STAGES: "flow-diagram-won-stages",
  TASKS: "flow-diagram-tasks",
  EDGE_CONFIGS: "flow-diagram-edge-configs",
};

// Load from localStorage with fallback to defaults
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
  }
  return defaultValue;
};

// Save to localStorage
const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
  }
};

// Convert Supabase stage to internal StageData format
const toStageData = (stage: WorkflowStage, phase: WorkflowPhase, taskCount: number): StageData => ({
  id: stage.id,
  label: stage.display_name,
  icon: stage.icon,
  color: stage.color || phase.color,
  row: phase.phase_type === "lost" ? "draft" : (phase.phase_type === "won" ? "won" : "draft"),
  taskCount,
  isEnd: stage.is_end,
});

// Convert Supabase task to internal Task format
const toInternalTask = (task: WorkflowTask): Task => ({
  id: task.id,
  title: task.title,
  description: task.description,
  assignedTo: task.assigned_roles,
  isRequired: task.is_required,
  estimatedTime: task.estimated_minutes, // Keep as number
  requiresApproval: task.requires_approval,
  approvalFrom: task.approval_roles,
  aiBotApprovers: task.ai_bot_approvers as Task["aiBotApprovers"],
});

export const useFlowDiagram = (props?: UseFlowDiagramProps): UseFlowDiagramReturn => {
  const { schema, schemaId } = props || {};
  const useSupabase = isSupabaseConfigured && !!schema && !!schemaId;
  // Start loading if Supabase is configured (waiting for schema to load)
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured && !schema);

  // Convert schema data to internal format
  const schemaToInternalFormat = useCallback(() => {
    if (!schema) return null;

    const { phases, stages, tasks } = schema;

    // Count tasks per stage
    const taskCountByStage: Record<string, number> = {};
    for (const task of tasks) {
      taskCountByStage[task.stage_id] = (taskCountByStage[task.stage_id] || 0) + 1;
    }

    // Build ALL phases dynamically
    const allPhases: DynamicPhase[] = phases
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(phase => ({
        id: phase.id,
        name: phase.name,
        displayName: phase.display_name,
        color: phase.color,
        icon: phase.icon,
        sortOrder: phase.sort_order,
        stages: stages
          .filter(s => s.phase_id === phase.id)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(s => toStageData(s, phase, taskCountByStage[s.id] || 0)),
      }));

    // For backward compatibility, also extract draft/won stages
    const draftPhase = phases.find(p => p.phase_type === "standard" || p.name === "draft");
    const wonPhase = phases.find(p => p.phase_type === "won");
    const lostPhase = phases.find(p => p.phase_type === "lost");

    const draftStages: StageData[] = draftPhase
      ? stages
          .filter(s => s.phase_id === draftPhase.id)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(s => toStageData(s, draftPhase, taskCountByStage[s.id] || 0))
      : [];

    const wonStages: StageData[] = wonPhase
      ? stages
          .filter(s => s.phase_id === wonPhase.id)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(s => toStageData(s, wonPhase, taskCountByStage[s.id] || 0))
      : [];

    // Build tasks by stage
    const tasksByStage: Record<string, Task[]> = {};
    for (const task of tasks) {
      if (!tasksByStage[task.stage_id]) {
        tasksByStage[task.stage_id] = [];
      }
      tasksByStage[task.stage_id].push(toInternalTask(task));
    }

    // Extract phase info for frame rendering (backward compat)
    const phaseInfo = {
      draft: draftPhase ? {
        id: draftPhase.id,
        name: draftPhase.name,
        displayName: draftPhase.display_name,
        color: draftPhase.color,
        type: draftPhase.phase_type,
      } : null,
      won: wonPhase ? {
        id: wonPhase.id,
        name: wonPhase.name,
        displayName: wonPhase.display_name,
        color: wonPhase.color,
        type: wonPhase.phase_type,
      } : null,
      lost: lostPhase ? {
        id: lostPhase.id,
        name: lostPhase.name,
        displayName: lostPhase.display_name,
        color: lostPhase.color,
        type: lostPhase.phase_type,
      } : null,
    };

    return { draftStages, wonStages, tasksByStage, phaseInfo, allPhases };
  }, [schema]);

  // Stage state - when Supabase is configured, ALWAYS start empty and wait for draft/schema to load
  // This prevents the race condition where production data overwrites draft data
  const [draftStages, setDraftStages] = useState<StageData[]>(() => {
    // When Supabase is configured, start empty - useEffect will load draft or schema data
    if (isSupabaseConfigured) {
      return [];
    }
    // Only use localStorage if Supabase is NOT configured
    return loadFromStorage(STORAGE_KEYS.DRAFT_STAGES, DEFAULT_DRAFT_STAGES);
  });
  
  const [wonStages, setWonStages] = useState<StageData[]>(() => {
    if (isSupabaseConfigured) {
      return [];
    }
    return loadFromStorage(STORAGE_KEYS.WON_STAGES, DEFAULT_WON_STAGES);
  });

  // Task state - keyed by stage ID
  const [tasksByStage, setTasksByStage] = useState<Record<string, Task[]>>(() => {
    if (isSupabaseConfigured) {
      return {};
    }
    return loadFromStorage(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
  });

  // Phase info from schema (for frame labels/colors) - backward compat
  const [phaseInfo, setPhaseInfo] = useState<{
    draft: { id: string; name: string; displayName: string; color: string; type: string } | null;
    won: { id: string; name: string; displayName: string; color: string; type: string } | null;
    lost: { id: string; name: string; displayName: string; color: string; type: string } | null;
  }>({
    draft: { id: "draft", name: "draft", displayName: "Draft Phase", color: "#1890ff", type: "standard" },
    won: { id: "won", name: "won", displayName: "Won Phase", color: "#52c41a", type: "won" },
    lost: { id: "lost", name: "lost", displayName: "Lost", color: "#ff4d4f", type: "lost" },
  });

  // Dynamic phases - the new flexible model (always start empty when using Supabase)
  const [dynamicPhases, setDynamicPhases] = useState<DynamicPhase[]>([]);

  // Save state tracking (for auto-save and publish)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Unsaved since last auto-save
  const [hasDraftChanges, setHasDraftChanges] = useState(false); // Draft differs from production (enables Publish)
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<boolean>(false);

  // Mark changes as unsaved (defined early so it can be used by node/edge change handlers)
  const markUnsaved = useCallback(() => {
    setHasUnsavedChanges(true);
    setHasDraftChanges(true); // Draft now differs from production
    pendingSaveRef.current = true;
  }, []);

  // Saved node positions from draft (to restore after loading)
  const savedNodePositionsRef = useRef<Record<string, { x: number; y: number }> | null>(null);

  // Clean up old localStorage data when using Supabase (one-time migration)
  useEffect(() => {
    if (isSupabaseConfigured) {
      // Clear old Kanban/Flow localStorage data to prevent confusion
      const oldKeys = [
        STORAGE_KEYS.DRAFT_STAGES,
        STORAGE_KEYS.WON_STAGES,
        STORAGE_KEYS.TASKS,
        STORAGE_KEYS.EDGE_CONFIGS,
        // Also clear any old Kanban keys that might exist
        "kanban-stages",
        "kanban-tasks",
        "campaign-stages",
      ];
      let cleared = false;
      oldKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          cleared = true;
        }
      });
      if (cleared) {
      }
    }
  }, []); // Run once on mount

  // Update state when schema changes - load draft data if available
  useEffect(() => {
    const loadSchemaData = async () => {
      if (schema && schemaId) {
        
        // Try to load draft data first
        try {
          const draftData = await loadDraftData(schemaId);
          
          if (draftData && draftData.phases && draftData.phases.length > 0) {
            
            // Convert draft phases to DynamicPhase format
            const loadedPhases: DynamicPhase[] = draftData.phases.map(p => ({
              id: p.id,
              name: p.name,
              displayName: p.displayName,
              color: p.color,
              icon: p.icon,
              sortOrder: p.sortOrder,
              stages: p.stages.map(s => ({
                id: s.id,
                label: s.label,
                icon: s.icon,
                color: s.color,
                row: "draft" as StageRow, // Default
                taskCount: s.taskCount,
                sortOrder: s.sortOrder,
              })),
            }));
            
            setDynamicPhases(loadedPhases);
            
            // Load tasks from draft
            if (draftData.tasksByStage) {
              const loadedTasks: Record<string, Task[]> = {};
              for (const [stageId, tasks] of Object.entries(draftData.tasksByStage)) {
                loadedTasks[stageId] = tasks.map(t => ({
                  id: t.id,
                  title: t.title,
                  description: t.description,
                  // Human assignment
                  assignedTo: t.assignedTo,
                  isRequired: t.isRequired,
                  estimatedTime: t.estimatedTime,
                  requiresApproval: t.requiresApproval,
                  approvalFrom: t.approvalFrom,
                  // Bot assignment
                  assignedBot: t.assignedBot as any,
                  botApprovalMode: t.botApprovalMode,
                  botEscalationRole: t.botEscalationRole,
                  botReviewRole: t.botReviewRole,
                }));
              }
              setTasksByStage(loadedTasks);
            }
            
            // Store node positions to apply after nodes are built
            if (draftData.nodePositions) {
              savedNodePositionsRef.current = draftData.nodePositions;
            }
            
            // Store edges to apply after edges are built
            if (draftData.edges && draftData.edges.length > 0) {
              savedEdgesRef.current = draftData.edges.map(e => ({
                id: e.id,
                source: e.source,
                target: e.target,
                sourceHandle: e.sourceHandle,
                targetHandle: e.targetHandle,
                type: "connection",
                data: {
                  id: e.id,
                  sourceId: e.source,
                  targetId: e.target,
                  transitionType: e.transitionType || "manual",
                  trigger: e.trigger || "any-time",
                } as ConnectionData,
              }));
            }
            
            // Mark that we have a draft loaded
            // hasUnsavedChanges = false (draft is saved)
            // hasDraftChanges = true (draft differs from production, enable Publish)
            setLastSaved(new Date(draftData.savedAt));
            setHasUnsavedChanges(false);
            setHasDraftChanges(true); // There's an unpublished draft!
            
            setLoading(false);
            return; // Don't load from production
          }
        } catch (error) {
        }
        
        // No draft - load from production (schema data)
        const data = schemaToInternalFormat();
        if (data) {
          setDraftStages(data.draftStages);
          setWonStages(data.wonStages);
          setTasksByStage(data.tasksByStage);
          if (data.phaseInfo) {
            setPhaseInfo(data.phaseInfo);
          }
          if (data.allPhases) {
            setDynamicPhases(data.allPhases);
          }
        }
        setLoading(false);
      } else if (!isSupabaseConfigured) {
        setLoading(false);
      }
    };
    
    loadSchemaData();
  }, [schema, schemaId, schemaToInternalFormat]);

  // Persist to localStorage only when NOT using Supabase
  useEffect(() => {
    if (!useSupabase) {
      saveToStorage(STORAGE_KEYS.DRAFT_STAGES, draftStages);
    }
  }, [draftStages, useSupabase]);

  useEffect(() => {
    if (!useSupabase) {
      saveToStorage(STORAGE_KEYS.WON_STAGES, wonStages);
    }
  }, [wonStages, useSupabase]);

  useEffect(() => {
    if (!useSupabase) {
      saveToStorage(STORAGE_KEYS.TASKS, tasksByStage);
    }
  }, [tasksByStage, useSupabase]);

  // UI state
  const [selectedEdge, setSelectedEdge] = useState<EdgeConfig | null>(null);
  const [selectedStage, setSelectedStage] = useState<StageData | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<DynamicPhase | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stageSidebarOpen, setStageSidebarOpen] = useState(false);
  const [phaseSidebarOpen, setPhaseSidebarOpen] = useState(false);
  const [pendingInsert, setPendingInsert] = useState<PendingInsert | null>(null);

  // Track connection start for "drag to nowhere" deletion
  const [connectingFrom, setConnectingFrom] = useState<{
    nodeId: string | null;
    handleId: string | null;
  } | null>(null);

  // Track dragging for reorder
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const draggingNodeId = useRef<string | null>(null);
  const originalIndex = useRef<number>(-1);

  // Handle stage click for editing (defined early so buildNodes can use it)
  // Toggle behavior: clicking same stage again closes the sidebar
  const handleStageClick = useCallback((stageData: any) => {
    
    // If clicking the same stage that's already open, close the sidebar
    if (selectedStage?.id === stageData.id && stageSidebarOpen) {
      setStageSidebarOpen(false);
      setSelectedStage(null);
      return;
    }

    // Find the full stage data - check dynamic phases first (for new schema-based layout)
    let stage = dynamicPhases.flatMap(p => p.stages).find(s => s.id === stageData.id);
    
    // Then check legacy draft/won stages
    if (!stage) {
      stage = draftStages.find(s => s.id === stageData.id) || 
              wonStages.find(s => s.id === stageData.id);
    }
    
    // Handle system stages
    if (!stage) {
      if (stageData.id === "lost") {
        stage = { id: "lost", label: "Lost", icon: "XCircle", color: "#ff4d4f", row: "draft" as const };
      } else if (stageData.id === "paused") {
        stage = { id: "paused", label: "Paused", icon: "PauseCircle", color: "#faad14", row: "won" as const };
      }
    }
    
    
    if (stage) {
      setSelectedStage(stage as StageData);
      setStageSidebarOpen(true);
    } else {
    }
  }, [dynamicPhases, draftStages, wonStages, selectedStage, stageSidebarOpen]);

  const closeStageSlider = useCallback(() => {
    setStageSidebarOpen(false);
    setSelectedStage(null);
  }, []);

  // Handle phase click for editing
  const handlePhaseClick = useCallback((phaseId: string) => {
    // If clicking the same phase that's already open, close the sidebar
    if (selectedPhase?.id === phaseId && phaseSidebarOpen) {
      setPhaseSidebarOpen(false);
      setSelectedPhase(null);
      return;
    }

    const phase = dynamicPhases.find(p => p.id === phaseId);
    
    if (phase) {
      setSelectedPhase(phase);
      setPhaseSidebarOpen(true);
    }
  }, [dynamicPhases, selectedPhase, phaseSidebarOpen]);

  const closePhaseSlider = useCallback(() => {
    setPhaseSidebarOpen(false);
    setSelectedPhase(null);
  }, []);

  // Open stage sidebar by ID
  const openStage = useCallback((stageId: string) => {
    // Check dynamic phases first
    let stage = dynamicPhases.flatMap(p => p.stages).find(s => s.id === stageId);
    
    // Then legacy stages
    if (!stage) {
      stage = draftStages.find(s => s.id === stageId) || 
              wonStages.find(s => s.id === stageId);
    }
    
    // Handle system stages
    if (!stage) {
      if (stageId === "lost") {
        stage = { id: "lost", label: "Lost", icon: "XCircle", color: "#ff4d4f", row: "draft" as const };
      } else if (stageId === "paused") {
        stage = { id: "paused", label: "Paused", icon: "PauseCircle", color: "#faad14", row: "won" as const };
      }
    }
    
    if (stage) {
      setSelectedStage(stage as StageData);
      setStageSidebarOpen(true);
    }
  }, [dynamicPhases, draftStages, wonStages]);

  // Callbacks for adding stages at start/end of phases (legacy)
  const handleAddFirstDraft = useCallback(() => {
    setPendingInsert({ afterStageId: "", row: "draft", phaseId: "", position: "start" });
  }, []);

  const handleAddFirstWon = useCallback(() => {
    setPendingInsert({ afterStageId: "", row: "won", phaseId: "", position: "start" });
  }, []);

  // Callbacks for adding stages relative to a specific stage (legacy)
  const createStageAddHandlers = useCallback((stageId: string, row: StageRow, index: number, _totalStages: number) => {
    return {
      onAddLeft: () => {
        // Insert before this stage
        if (index > 0) {
          const stages = row === "draft" ? draftStages : wonStages;
          const prevStageId = stages[index - 1].id;
          setPendingInsert({ afterStageId: prevStageId, row, phaseId: "", position: "after" });
        } else {
          // First stage - add at start
          setPendingInsert({ afterStageId: "", row, phaseId: "", position: "start" });
        }
      },
      onAddRight: () => {
        // Insert after this stage
        setPendingInsert({ afterStageId: stageId, row, phaseId: "", position: "after" });
      },
      onAddAbove: () => {
        setPendingInsert({ afterStageId: stageId, row, phaseId: "", position: "above" });
      },
      onAddBelow: () => {
        setPendingInsert({ afterStageId: stageId, row, phaseId: "", position: "below" });
      },
    };
  }, [draftStages, wonStages]);

  // Callbacks for adding stages in dynamic phase system
  const createStageAddHandlersForPhase = useCallback((stageId: string, phaseId: string, index: number, _totalStages: number) => {
    const phase = dynamicPhases.find(p => p.id === phaseId);
    return {
      onAddLeft: () => {
        if (index > 0 && phase) {
          const prevStageId = phase.stages[index - 1].id;
          setPendingInsert({ afterStageId: prevStageId, phaseId, position: "after" });
        } else {
          setPendingInsert({ afterStageId: "", phaseId, position: "start" });
        }
      },
      onAddRight: () => {
        setPendingInsert({ afterStageId: stageId, phaseId, position: "after" });
      },
      onAddAbove: () => {
        setPendingInsert({ afterStageId: stageId, phaseId, position: "above" });
      },
      onAddBelow: () => {
        setPendingInsert({ afterStageId: stageId, phaseId, position: "below" });
      },
    };
  }, [dynamicPhases]);

  // Build nodes from stages
  const buildNodes = useCallback((): Node[] => {
    const nodes: Node[] = [];
    const { X_SPACING } = LAYOUT;
    const FRAME_PADDING = 45; // Left/right padding (symmetric)
    const FRAME_TOP_PADDING = 50; // Top padding
    const FRAME_BOTTOM_PADDING = 50; // Bottom padding (same as top for symmetry)
    const NODE_HEIGHT = 65;
    const MIN_FRAME_WIDTH = 200;
    const PHASE_VERTICAL_SPACING = 200; // Space between phase rows
    const PHASE_HORIZONTAL_SPACING = 50; // Space between phases in same row

    // If using dynamic phases from schema, render them
    if (dynamicPhases.length > 0) {
      
      // Layout algorithm: arrange phases in a smart grid
      // - Phases are laid out left-to-right, top-to-bottom
      // - Each row can have multiple phases
      // - Max 3 phases per row for readability
      const PHASES_PER_ROW = 3;
      
      let currentX = 50;
      let currentY = 100;
      let rowMaxHeight = 0;
      let phasesInCurrentRow = 0;

      dynamicPhases.forEach((phase) => {
        // Calculate frame dimensions with symmetric padding
        // Formula: left padding (45) + spacing between stages + stage width (160) + right padding (45)
        const stageCount = Math.max(1, phase.stages.length);
        
        // Calculate width needed for stages
        const stagesWidth = FRAME_PADDING * 2 + Math.max(0, stageCount - 1) * X_SPACING + 160;
        
        // Calculate width needed for phase name (approx 8px per character + icon + padding)
        const phaseNameWidth = FRAME_PADDING * 2 + 20 + (phase.displayName.length * 8) + 24;
        
        // Use the larger of the two to ensure everything fits
        const frameWidth = Math.max(
          MIN_FRAME_WIDTH,
          stagesWidth,
          phaseNameWidth
        );
        const frameHeight = NODE_HEIGHT + FRAME_TOP_PADDING + FRAME_BOTTOM_PADDING;

        // Check if we need to wrap to next row
        if (phasesInCurrentRow >= PHASES_PER_ROW) {
          currentX = 50;
          currentY += rowMaxHeight + PHASE_VERTICAL_SPACING;
          rowMaxHeight = 0;
          phasesInCurrentRow = 0;
        }

        // Create handler for adding first stage to this phase
        const handleAddFirstStageToPhase = () => {
          setPendingInsert({
            afterStageId: "",
            phaseId: phase.id,
            position: "start",
          });
        };

        // Create phase frame node with connection handles
        nodes.push({
          id: `frame-${phase.id}`,
          type: "phaseFrame",
          position: { x: currentX - FRAME_PADDING, y: currentY - FRAME_TOP_PADDING },
          data: {
            label: phase.displayName,
            color: phase.color,
            width: frameWidth,
            height: frameHeight,
            phaseId: phase.id,
            isEmpty: phase.stages.length === 0,
            onAddFirstStage: handleAddFirstStageToPhase,
            onClick: () => handlePhaseClick(phase.id),
            // Enable connection handles on all sides for flexible phase-to-phase connections
            hasRightHandle: true,
            hasBottomHandle: true,
            hasLeftHandle: true,
            hasTopHandle: true,
          },
          draggable: true,
          selectable: true,
          connectable: true, // Enable connections
          zIndex: 0,
        });

        // Create stage nodes as children of this phase
        phase.stages.forEach((stage, stageIndex) => {
          const addHandlers = createStageAddHandlersForPhase(stage.id, phase.id, stageIndex, phase.stages.length);
          
          nodes.push({
            id: stage.id,
            type: "flowStage",
            position: { x: FRAME_PADDING + stageIndex * X_SPACING, y: FRAME_TOP_PADDING },
            parentNode: `frame-${phase.id}`,
            data: {
              ...stage,
              color: phase.color, // Always use phase color, not individual stage color
              phaseId: phase.id,
              onClick: handleStageClick,
              ...addHandlers,
            },
            zIndex: 1,
            draggable: true,
          });
        });

        // Update position tracking
        currentX += frameWidth + PHASE_HORIZONTAL_SPACING;
        rowMaxHeight = Math.max(rowMaxHeight, frameHeight);
        phasesInCurrentRow++;
      });

      return nodes;
    }

    // Fallback to legacy draft/won/lost layout if no dynamic phases
    const { ROW_1_Y, ROW_2_Y, STATE_OFFSET_X } = LAYOUT;

    // Use phase info from schema (or defaults)
    const draftPhaseInfo = phaseInfo.draft || { displayName: "Draft Phase", color: "#1890ff" };
    const wonPhaseInfo = phaseInfo.won || { displayName: "Won Phase", color: "#52c41a" };
    const lostPhaseInfo = phaseInfo.lost || { displayName: "Lost", color: "#ff4d4f" };

    // Calculate draft frame width (stages vs phase name)
    const draftStagesWidth = FRAME_PADDING * 2 + Math.max(0, draftStages.length - 1) * X_SPACING + 160;
    const draftNameWidth = FRAME_PADDING * 2 + 20 + (draftPhaseInfo.displayName.length * 8) + 24;
    const draftFrameWidth = Math.max(MIN_FRAME_WIDTH, draftStagesWidth, draftNameWidth);
    
    // Calculate won frame width (stages vs phase name)
    const mainWonCount = wonStages.filter(s => s.id !== "paused").length;
    const wonStagesWidth = FRAME_PADDING * 2 + Math.max(0, mainWonCount - 1) * X_SPACING + 160;
    const wonNameWidth = FRAME_PADDING * 2 + 20 + (wonPhaseInfo.displayName.length * 8) + 24;
    const wonFrameWidth = Math.max(MIN_FRAME_WIDTH, wonStagesWidth, wonNameWidth);
    const wonFrameHeight = NODE_HEIGHT + FRAME_TOP_PADDING + FRAME_BOTTOM_PADDING + 180;
    const lostFrameX = 50 + draftStages.length * X_SPACING + STATE_OFFSET_X;

    nodes.push({
      id: "frame-draft",
      type: "phaseFrame",
      position: { x: 50 - FRAME_PADDING, y: ROW_1_Y - FRAME_TOP_PADDING },
      data: {
        label: draftPhaseInfo.displayName,
        color: draftPhaseInfo.color,
        width: draftFrameWidth,
        height: NODE_HEIGHT + FRAME_TOP_PADDING + FRAME_BOTTOM_PADDING,
        isEmpty: draftStages.length === 0,
        onAddFirstStage: handleAddFirstDraft,
        hasRightHandle: true,
        hasBottomHandle: true,
        hasLeftHandle: true,
        hasTopHandle: true,
      },
      draggable: true,
      selectable: true,
      connectable: true,
      zIndex: 0,
    });

    nodes.push({
      id: "frame-lost",
      type: "phaseFrame",
      position: { x: lostFrameX - FRAME_PADDING, y: ROW_1_Y - FRAME_TOP_PADDING },
      data: {
        label: lostPhaseInfo.displayName,
        color: lostPhaseInfo.color,
        width: 180,
        height: NODE_HEIGHT + FRAME_TOP_PADDING + FRAME_BOTTOM_PADDING,
        hasRightHandle: true,
        hasBottomHandle: true,
        hasLeftHandle: true,
        hasTopHandle: true,
      },
      draggable: true,
      selectable: true,
      connectable: true,
      zIndex: 0,
    });

    nodes.push({
      id: "frame-won",
      type: "phaseFrame",
      position: { x: 50 - FRAME_PADDING, y: ROW_2_Y - FRAME_TOP_PADDING },
      data: {
        label: wonPhaseInfo.displayName,
        color: wonPhaseInfo.color,
        width: wonFrameWidth,
        height: wonFrameHeight,
        isEmpty: wonStages.length === 0,
        onAddFirstStage: handleAddFirstWon,
        hasRightHandle: true,
        hasBottomHandle: true,
        hasLeftHandle: true,
        hasTopHandle: true,
      },
      draggable: true,
      selectable: true,
      connectable: true,
      zIndex: 0,
    });

    draftStages.forEach((stage, index) => {
      const addHandlers = createStageAddHandlers(stage.id, "draft", index, draftStages.length);
      nodes.push({
        id: stage.id,
        type: "flowStage",
        position: { x: FRAME_PADDING + index * X_SPACING, y: FRAME_TOP_PADDING },
        parentNode: "frame-draft",
        data: { ...stage, onClick: handleStageClick, ...addHandlers },
        zIndex: 1,
        draggable: true,
      });
    });

    nodes.push({
      id: "lost",
      type: "flowStage",
      position: { x: 20, y: FRAME_TOP_PADDING },
      parentNode: "frame-lost",
      data: {
        id: "lost",
        label: "Lost",
        icon: "XCircle",
        color: "#ff4d4f",
        row: "draft",
        isSystem: true,
        taskCount: 0,
        onClick: handleStageClick,
      },
      zIndex: 1,
      draggable: true,
    });

    const mainWonStages = wonStages.filter(s => s.id !== "paused");
    mainWonStages.forEach((stage, index) => {
      const addHandlers = createStageAddHandlers(stage.id, "won", index, mainWonStages.length);
      nodes.push({
        id: stage.id,
        type: "flowStage",
        position: { x: FRAME_PADDING + index * X_SPACING, y: FRAME_TOP_PADDING },
        parentNode: "frame-won",
        data: { ...stage, onClick: handleStageClick, ...addHandlers },
        zIndex: 1,
        draggable: true,
      });
    });

    const liveIndex = mainWonStages.findIndex(s => s.id === "live");
    const pausedX = liveIndex !== -1 ? FRAME_PADDING + liveIndex * X_SPACING : FRAME_PADDING + 2 * X_SPACING;
    
    nodes.push({
      id: "paused",
      type: "flowStage",
      position: { x: pausedX, y: FRAME_TOP_PADDING + 120 },
      parentNode: "frame-won",
      data: {
        id: "paused",
        label: "Paused",
        icon: "PauseCircle",
        color: "#faad14",
        row: "won",
        isSystem: true,
        taskCount: 0,
        onClick: handleStageClick,
      },
      zIndex: 1,
      draggable: true,
    });

    return nodes;
  }, [dynamicPhases, draftStages, wonStages, phaseInfo, handleStageClick, handlePhaseClick, createStageAddHandlers, createStageAddHandlersForPhase, handleAddFirstDraft, handleAddFirstWon]);

  // Handle edge click for configuration
  const handleEdgeClick = useCallback((data: ConnectionData) => {
    setSelectedEdge({
      id: data.id,
      source: data.sourceId,
      target: data.targetId,
      transitionType: data.transitionType || "manual",
      transitionTrigger: data.trigger || "any-time",
    });
    setSidebarOpen(true);
  }, []);

  // Handle insert stage from connection "+" button
  const handleInsertStage = useCallback(
    (afterStageId: string, _beforeStageId: string) => {
      // First check dynamic phases
      for (const phase of dynamicPhases) {
        if (phase.stages.some(s => s.id === afterStageId)) {
          setPendingInsert({ afterStageId, phaseId: phase.id, position: "after" });
          return;
        }
      }
      // Fallback to legacy row detection
      const isDraft = draftStages.some((s) => s.id === afterStageId);
      const row: StageRow = isDraft ? "draft" : "won";
      setPendingInsert({ afterStageId, row, phaseId: "" });
    },
    [dynamicPhases, draftStages]
  );

  const clearPendingInsert = useCallback(() => {
    setPendingInsert(null);
  }, []);

  // Saved edges from draft (to restore after loading)
  const savedEdgesRef = useRef<Edge[] | null>(null);

  // Build edges from stages
  const buildEdges = useCallback((): Edge[] => {
    // If we have saved edges from draft, use those
    if (savedEdgesRef.current) {
      const edges = savedEdgesRef.current.map(e => ({
        ...e,
        data: {
          ...e.data,
          onEdgeClick: handleEdgeClick,
          onInsertStage: handleInsertStage,
        },
      }));
      savedEdgesRef.current = null; // Clear after use
      return edges;
    }

    const edges: Edge[] = [];

    // If using dynamic phases, build edges within each phase
    if (dynamicPhases.length > 0) {
      
      // 1. Create edges between consecutive stages WITHIN each phase
      dynamicPhases.forEach(phase => {
        for (let i = 0; i < phase.stages.length - 1; i++) {
          const from = phase.stages[i].id;
          const to = phase.stages[i + 1].id;
          edges.push({
            id: `${from}-${to}`,
            source: from,
            target: to,
            type: "connection",
            data: {
              id: `${from}-${to}`,
              sourceId: from,
              targetId: to,
              transitionType: "manual",
              trigger: "any-time",
              onEdgeClick: handleEdgeClick,
              onInsertStage: handleInsertStage,
            } as ConnectionData,
          });
        }
      });
      
      // 2. Create phase-to-phase connections (frame to frame)
      // Default sequential flow: connect each phase frame to the next one
      for (let i = 0; i < dynamicPhases.length - 1; i++) {
        const currentPhase = dynamicPhases[i];
        const nextPhase = dynamicPhases[i + 1];
        
        const frameEdgeId = `phase-${currentPhase.id}-${nextPhase.id}`;
        edges.push({
          id: frameEdgeId,
          source: `frame-${currentPhase.id}`,
          target: `frame-${nextPhase.id}`,
          type: "connection",
          animated: true, // Make phase connections animated to distinguish them
          style: { 
            stroke: currentPhase.color, // Use source phase color
            strokeWidth: 4, // Bolder line for phase connections
          },
          data: {
            id: frameEdgeId,
            sourceId: `frame-${currentPhase.id}`,
            targetId: `frame-${nextPhase.id}`,
            transitionType: "manual",
            trigger: "any-time",
            onEdgeClick: handleEdgeClick,
            isPhaseConnection: true, // Flag to identify phase-level connections
          } as ConnectionData,
        });
      }
      
      return edges;
    }

    // Legacy: Draft row connections
    for (let i = 0; i < draftStages.length - 1; i++) {
      const from = draftStages[i].id;
      const to = draftStages[i + 1].id;
      const type = i === 0 ? "manual" : "approval";
      edges.push({
        id: `${from}-${to}`,
        source: from,
        target: to,
        type: "connection",
        data: {
          id: `${from}-${to}`,
          sourceId: from,
          targetId: to,
          transitionType: type,
          trigger: getDefaultTrigger(type),
          onEdgeClick: handleEdgeClick,
          onInsertStage: handleInsertStage,
        } as ConnectionData,
      });
    }

    // Phase-to-Phase: Draft → Lost (blue arrow)
    edges.push({
      id: "phase-draft-lost",
      source: "frame-draft",
      target: "frame-lost",
      sourceHandle: "phase-right",
      targetHandle: "phase-left",
      type: "phaseEdge",
      data: {
        sourcePhase: "Draft",
        targetPhase: "Lost",
        color: "#1890ff",
      },
    });

    // Won row connections (main flow: Approved → Scheduled → Live → Ended)
    const mainWonStages = wonStages.filter(s => s.id !== "paused");
    for (let i = 0; i < mainWonStages.length - 1; i++) {
      const from = mainWonStages[i].id;
      const to = mainWonStages[i + 1].id;
      edges.push({
        id: `${from}-${to}`,
        source: from,
        target: to,
        type: "connection",
        data: {
          id: `${from}-${to}`,
          sourceId: from,
          targetId: to,
          transitionType: "auto",
          trigger: "all-tasks",
          onEdgeClick: handleEdgeClick,
          onInsertStage: handleInsertStage,
        } as ConnectionData,
      });
    }

    // Live ↔ Paused bidirectional
    edges.push({
      id: "live-paused",
      source: "live",
      target: "paused",
      sourceHandle: "bottom",
      targetHandle: "top",
      type: "connection",
      data: {
        id: "live-paused",
        sourceId: "live",
        targetId: "paused",
        transitionType: "manual",
        trigger: "any-time",
        onEdgeClick: handleEdgeClick,
      } as ConnectionData,
    });

    edges.push({
      id: "paused-live",
      source: "paused",
      target: "live",
      sourceHandle: "top",
      targetHandle: "bottom",
      type: "connection",
      data: {
        id: "paused-live",
        sourceId: "paused",
        targetId: "live",
        transitionType: "manual",
        trigger: "any-time",
        onEdgeClick: handleEdgeClick,
      } as ConnectionData,
    });

    // Phase-to-Phase: Draft → Won (blue arrow going down)
    edges.push({
      id: "phase-draft-won",
      source: "frame-draft",
      target: "frame-won",
      sourceHandle: "phase-bottom",
      targetHandle: "phase-top",
      type: "phaseEdge",
      data: {
        sourcePhase: "Draft",
        targetPhase: "Won",
        color: "#1890ff",
      },
    });

    return edges;
  }, [dynamicPhases, draftStages, wonStages, handleEdgeClick, handleInsertStage]);

  const initialNodes = useMemo(() => buildNodes(), [buildNodes]);
  const initialEdges = useMemo(() => buildEdges(), [buildEdges]);

  const [nodeState, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edgeState, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);

  // Wrap onNodesChange to detect position changes and trigger auto-save
  const onNodesChange = useCallback((changes: any[]) => {
    onNodesChangeInternal(changes);
    
    // Check if any position changes occurred (dragging nodes/frames)
    // But ignore "select" and "reset" type changes
    const hasPositionChange = changes.some(
      (change: any) => 
        change.type === 'position' && 
        change.dragging === false &&
        !change.fromReact // Ignore programmatic position changes from React Flow internals
    );
    
    if (hasPositionChange) {
      markUnsaved();
    }
    
    // Don't mark as unsaved for add/remove - we handle that explicitly in addStage/deleteStage
    // This prevents spurious "unsaved" when nodes are rebuilt (which causes remove+add internally)
  }, [onNodesChangeInternal, markUnsaved]);

  // Wrap onEdgesChange similarly
  const onEdgesChange = useCallback((changes: any[]) => {
    onEdgesChangeInternal(changes);
    
    // Check if edges were added/removed
    const hasEdgeChange = changes.some(
      (change: any) => change.type === 'add' || change.type === 'remove'
    );
    
    if (hasEdgeChange) {
      markUnsaved();
    }
  }, [onEdgesChangeInternal, markUnsaved]);

  // Update when stages change
  useEffect(() => {
    // Apply saved node positions from draft if available (one-time on load)
    if (savedNodePositionsRef.current) {
      let nodes = buildNodes();
      nodes = nodes.map(node => {
        const savedPos = savedNodePositionsRef.current?.[node.id];
        if (savedPos) {
          return { ...node, position: savedPos };
        }
        return node;
      });
      // Clear after applying once
      savedNodePositionsRef.current = null;
      setNodes(nodes);
      setEdges(buildEdges());
    } else {
      // Preserve existing frame positions (don't reset them when stages change)
      setNodes(currentNodes => {
        const newNodes = buildNodes();
        
        // Create a map of existing frame positions
        const existingFramePositions = new Map<string, { x: number; y: number }>();
        currentNodes.forEach(node => {
          if (node.id.startsWith("frame-")) {
            existingFramePositions.set(node.id, { x: node.position.x, y: node.position.y });
          }
        });
        
        // Apply existing positions to new nodes to preserve user's manual positioning
        return newNodes.map(node => {
          if (node.id.startsWith("frame-")) {
            const existingPos = existingFramePositions.get(node.id);
            if (existingPos) {
              return { ...node, position: existingPos };
            }
          }
          return node;
        });
      });
      
      setEdges(buildEdges());
    }
  }, [draftStages, wonStages, dynamicPhases, buildNodes, buildEdges, setNodes, setEdges]);

  // Handle new connection - ENFORCES SINGLE CONNECTION PER SOURCE HANDLE
  const onConnect = useCallback(
    (params: Connection) => {
      const { source, sourceHandle, target } = params;

      if (!source || !target) return;

      // Detect if this is a phase-to-phase connection
      const isPhaseConnection = source.startsWith("frame-") && target.startsWith("frame-");

      // Get source phase color if it's a phase connection
      let phaseColor: string | undefined;
      if (isPhaseConnection) {
        const phaseId = source.replace("frame-", "");
        const sourcePhase = dynamicPhases.find(p => p.id === phaseId);
        phaseColor = sourcePhase?.color;
      }

      // Check if there's already an edge from this source handle
      const existingEdge = edgeState.find(
        (e) =>
          e.source === source &&
          (sourceHandle ? e.sourceHandle === sourceHandle : !e.sourceHandle)
      );

      if (existingEdge) {
        // Remove existing edge first (single connection per source handle)
        setEdges((eds) => eds.filter((e) => e.id !== existingEdge.id));
        message.info("Previous connection replaced");
      }

      const edgeId = `${source}-${target}${sourceHandle ? `-${sourceHandle}` : ""}`;
      const newEdge: Edge = {
        ...params,
        id: edgeId,
        type: "connection",
        animated: isPhaseConnection, // Animate phase-to-phase connections
        style: isPhaseConnection 
          ? { stroke: phaseColor, strokeWidth: 4 } // Use phase color and bolder stroke
          : undefined,
        data: {
          id: edgeId,
          sourceId: source,
          targetId: target,
          transitionType: "manual",
          trigger: "any-time",
          onEdgeClick: handleEdgeClick,
          isPhaseConnection, // Flag for phase-level connections
        } as ConnectionData,
      } as Edge;

      setEdges((eds) => addEdge(newEdge, eds));
      message.success(isPhaseConnection ? "Phase connection created!" : "Connection created!");
      markUnsaved();
      setConnectingFrom(null);
    },
    [edgeState, setEdges, handleEdgeClick, markUnsaved, dynamicPhases]
  );

  // Track connection start
  const onConnectStart = useCallback(
    (_event: any, params: { nodeId: string | null; handleId: string | null }) => {
      setConnectingFrom(params);
    },
    []
  );

  // Handle connection end - DELETE if dragged to nowhere
  const onConnectEnd = useCallback(
    (event: any) => {
      if (!connectingFrom?.nodeId) {
        setConnectingFrom(null);
        return;
      }

      // Check if dropped on a valid target (node handle)
      const targetElement = event.target as HTMLElement;
      const isDroppedOnHandle = targetElement.classList.contains("react-flow__handle");

      if (!isDroppedOnHandle) {
        // Dragged to nowhere - delete existing connection from this handle
        const existingEdge = edgeState.find(
          (e) =>
            e.source === connectingFrom.nodeId &&
            (connectingFrom.handleId
              ? e.sourceHandle === connectingFrom.handleId
              : !e.sourceHandle)
        );

        if (existingEdge) {
          setEdges((eds) => eds.filter((e) => e.id !== existingEdge.id));
          message.success("Connection deleted");
          markUnsaved();
        }
      }

      setConnectingFrom(null);
    },
    [connectingFrom, edgeState, setEdges]
  );

  // Handle edge reconnection (dragging connection to different target)
  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      const { source, sourceHandle, target } = newConnection;

      if (!source || !target) return;

      // Detect if this is a phase-to-phase connection
      const isPhaseConnection = source.startsWith("frame-") && target.startsWith("frame-");

      // Get source phase color if it's a phase connection
      let phaseColor: string | undefined;
      if (isPhaseConnection) {
        const phaseId = source.replace("frame-", "");
        const sourcePhase = dynamicPhases.find(p => p.id === phaseId);
        phaseColor = sourcePhase?.color;
      }

      // Check if there's already an edge from this source handle (excluding the one being moved)
      const existingEdge = edgeState.find(
        (e) =>
          e.id !== oldEdge.id &&
          e.source === source &&
          (sourceHandle ? e.sourceHandle === sourceHandle : !e.sourceHandle)
      );

      if (existingEdge) {
        // Remove existing edge first (single connection per source handle)
        setEdges((eds) => eds.filter((e) => e.id !== existingEdge.id));
        message.info("Previous connection replaced");
      }

      // Update the edge with new target while preserving transition settings
      const edgeId = `${source}-${target}${sourceHandle ? `-${sourceHandle}` : ""}`;
      const updatedEdge: Edge = {
        ...oldEdge,
        ...newConnection,
        id: edgeId,
        animated: isPhaseConnection,
        style: isPhaseConnection 
          ? { stroke: phaseColor, strokeWidth: 4 }
          : oldEdge.style,
        data: {
          ...oldEdge.data,
          id: edgeId,
          sourceId: source,
          targetId: target,
          isPhaseConnection,
        } as ConnectionData,
      } as Edge;

      // Remove old edge and add updated one
      setEdges((eds) => {
        const filtered = eds.filter((e) => e.id !== oldEdge.id);
        return addEdge(updatedEdge, filtered);
      });

      message.success("Connection moved!");
      markUnsaved();
    },
    [edgeState, dynamicPhases, setEdges, markUnsaved]
  );

  // Phase management
  const addPhase = useCallback((phase: { name: string; displayName: string; color: string }) => {
    const newPhase: DynamicPhase = {
      id: `phase-${Date.now()}`,
      name: phase.name,
      displayName: phase.displayName,
      color: phase.color,
      icon: "Circle",
      sortOrder: dynamicPhases.length,
      stages: [],
    };
    
    setDynamicPhases(prev => [...prev, newPhase]);
    markUnsaved();
    message.success(`Phase "${phase.displayName}" created in draft!`);
  }, [dynamicPhases.length, markUnsaved]);

  const updatePhase = useCallback((phaseId: string, updates: Partial<DynamicPhase>) => {
    setDynamicPhases(prev => prev.map(p => 
      p.id === phaseId ? { ...p, ...updates } : p
    ));
    markUnsaved();
  }, [markUnsaved]);

  const deletePhase = useCallback((phaseId: string) => {
    const phase = dynamicPhases.find(p => p.id === phaseId);
    if (!phase) return;
    
    if (phase.stages.length > 0) {
      message.error("Cannot delete phase with stages");
      return;
    }
    
    setDynamicPhases(prev => prev.filter(p => p.id !== phaseId));
    markUnsaved();
    message.success("Phase deleted");
  }, [dynamicPhases, markUnsaved]);

  // Stage management
  const addStage = useCallback(
    async (stage: StageData & { phaseId?: string }, position: string) => {
      // Determine target phase - use explicit phaseId or fallback to row
      const targetPhaseId = stage.phaseId || (stage.row === "draft" 
        ? schema?.phases.find(p => p.phase_type === "standard" || p.name === "draft")?.id 
        : schema?.phases.find(p => p.phase_type === "won")?.id);

      // For dynamic phases, update the dynamicPhases state
      if (targetPhaseId && dynamicPhases.length > 0) {
        const phaseIndex = dynamicPhases.findIndex(p => p.id === targetPhaseId);
        if (phaseIndex !== -1) {
          const updatedPhases = [...dynamicPhases];
          const phase = { ...updatedPhases[phaseIndex] };
          const stages = [...phase.stages];
          
          let sortOrder = 0;
          if (position === "start") {
            sortOrder = 0;
            stages.unshift(stage);
          } else if (position === "end") {
            sortOrder = stages.length;
            stages.push(stage);
          } else {
            // Insert after specific stage
            const afterIndex = stages.findIndex((s) => s.id === position);
            if (afterIndex !== -1) {
              sortOrder = afterIndex + 1;
              stages.splice(afterIndex + 1, 0, stage);
            } else {
              sortOrder = stages.length;
              stages.push(stage);
            }
          }
          
          phase.stages = stages;
          updatedPhases[phaseIndex] = phase;
          setDynamicPhases(updatedPhases);

          // Save to Supabase
          if (useSupabase && schemaId) {
            try {
              await apiCreateStage({
                schema_id: schemaId,
                phase_id: targetPhaseId,
                name: stage.label.toLowerCase().replace(/\s+/g, "-"),
                display_name: stage.label,
                icon: stage.icon,
                color: stage.color,
                sort_order: sortOrder,
                is_start: position === "start",
                is_end: false,
              });
              message.success("Stage created!");
              markUnsaved();
            } catch (error) {
              console.error("Failed to save stage to Supabase:", error);
              message.error("Failed to save stage");
            }
          }
          return;
        }
      }

      // Fallback to legacy draft/won handling
      const stages = stage.row === "draft" ? [...draftStages] : [...wonStages];
      const setStages = stage.row === "draft" ? setDraftStages : setWonStages;

      let sortOrder = 0;
      if (position === "start") {
        sortOrder = 0;
        setStages([stage, ...stages]);
      } else if (position === "end") {
        if (stage.row === "won") {
          const endedIndex = stages.findIndex((s) => s.isEnd);
          if (endedIndex !== -1) {
            sortOrder = endedIndex;
            stages.splice(endedIndex, 0, stage);
            setStages(stages);
          } else {
            sortOrder = stages.length;
            setStages([...stages, stage]);
          }
        } else {
          sortOrder = stages.length;
          setStages([...stages, stage]);
        }
      } else {
        const afterIndex = stages.findIndex((s) => s.id === position);
        if (afterIndex !== -1) {
          sortOrder = afterIndex + 1;
          stages.splice(afterIndex + 1, 0, stage);
          setStages(stages);
        } else {
          sortOrder = stages.length;
          setStages([...stages, stage]);
        }
      }

      // Save to Supabase if connected (legacy)
      if (useSupabase && schema && targetPhaseId) {
        try {
          await apiCreateStage({
            schema_id: schemaId!,
            phase_id: targetPhaseId,
            name: stage.label.toLowerCase().replace(/\s+/g, "-"),
            display_name: stage.label,
            icon: stage.icon,
            color: stage.color,
            sort_order: sortOrder,
            is_start: position === "start",
            is_end: false,
          });
          message.success("Stage created!");
          markUnsaved();
        } catch (error) {
          console.error("Failed to save stage to Supabase:", error);
          message.error("Failed to save stage");
        }
      }
    },
    [draftStages, wonStages, dynamicPhases, useSupabase, schema, schemaId, markUnsaved]
  );

  const moveStage = useCallback(
    (row: StageRow, stageId: string, direction: "up" | "down") => {
      const stages = row === "draft" ? [...draftStages] : [...wonStages];
      const setStages = row === "draft" ? setDraftStages : setWonStages;
      const index = stages.findIndex((s) => s.id === stageId);

      if (index === -1 || stages[index].isEnd) return;

      if (direction === "up" && index > 0) {
        [stages[index - 1], stages[index]] = [stages[index], stages[index - 1]];
        setStages(stages);
      } else if (direction === "down" && index < stages.length - 1) {
        if (stages[index + 1].isEnd) return;
        [stages[index], stages[index + 1]] = [stages[index + 1], stages[index]];
        setStages(stages);
      }
    },
    [draftStages, wonStages]
  );

  const deleteStage = useCallback(
    async (row: StageRow, stageId: string) => {
      
      // First, try to find the stage in dynamic phases
      let stageFound = false;
      let stageName = "";
      
      // Check dynamic phases
      for (const phase of dynamicPhases) {
        const stage = phase.stages.find(s => s.id === stageId);
        if (stage) {
          stageFound = true;
          stageName = stage.label;
          
          // Remove stage from this phase (DRAFT operation - no restrictions)
          setDynamicPhases(prevPhases => prevPhases.map(p => 
            p.id === phase.id 
              ? { ...p, stages: p.stages.filter(s => s.id !== stageId) }
              : p
          ));
          break;
        }
      }
      
      // If not in dynamic phases, check legacy stages
      if (!stageFound) {
        const stages = row === "draft" ? draftStages : wonStages;
        const stage = stages.find((s) => s.id === stageId);

        if (stage) {
          stageFound = true;
          stageName = stage.label;

          if (row === "draft") {
            setDraftStages(draftStages.filter((s) => s.id !== stageId));
          } else {
            setWonStages(wonStages.filter((s) => s.id !== stageId));
          }
        }
      }
      
      if (!stageFound) {
        message.error("Stage not found");
        console.error("[deleteStage] Stage not found:", stageId);
        return;
      }
      
      // Remove all edges connected to this stage
      setEdges((eds) => eds.filter((e) => e.source !== stageId && e.target !== stageId));

      // NOTE: We don't delete from Supabase production tables yet
      // Deletion happens in draft only - actual deletion is during publish
      // The publish flow will require mapping deleted stages to new ones

      message.success(`"${stageName}" deleted from draft. Map to new stage before publishing.`);
      markUnsaved();
    },
    [dynamicPhases, draftStages, wonStages, setEdges, markUnsaved, setDynamicPhases]
  );

  // Move stage to a different phase (for drag-and-drop between phases)
  const moveStageToPhase = useCallback(
    async (stageId: string, targetPhaseId: string) => {
      
      // Find the stage in current data
      let stage: StageData | undefined;
      let sourcePhaseId: string | null = null;
      
      // Check dynamic phases first
      for (const phase of dynamicPhases) {
        const found = phase.stages.find(s => s.id === stageId);
        if (found) {
          stage = found;
          sourcePhaseId = phase.id;
          break;
        }
      }
      
      // Fallback to legacy stages
      if (!stage) {
        stage = draftStages.find(s => s.id === stageId) || wonStages.find(s => s.id === stageId);
      }
      
      if (!stage) {
        console.error("[moveStageToPhase] Stage not found:", stageId);
        return;
      }
      
      if (sourcePhaseId === targetPhaseId) {
        return;
      }
      
      // Get target phase info
      const targetPhase = dynamicPhases.find(p => p.id === targetPhaseId);
      if (!targetPhase) {
        console.error("[moveStageToPhase] Target phase not found:", targetPhaseId);
        return;
      }
      
      // Remove all connections involving this stage (break connections)
      setEdges(eds => eds.filter(e => e.source !== stageId && e.target !== stageId));
      
      // Update dynamic phases state
      setDynamicPhases(prev => {
        const updated = prev.map(phase => {
          if (phase.id === sourcePhaseId) {
            // Remove from source
            return { ...phase, stages: phase.stages.filter(s => s.id !== stageId) };
          }
          if (phase.id === targetPhaseId) {
            // Add to target at the end
            const updatedStage = { ...stage!, row: "draft" as StageRow }; // Row doesn't matter for dynamic
            return { ...phase, stages: [...phase.stages, updatedStage] };
          }
          return phase;
        });
        return updated;
      });
      
      // Update Supabase if connected
      if (useSupabase && schemaId) {
        try {
          // Update stage's phase_id
          await apiUpdateStage(stageId, {
            phase_id: targetPhaseId,
            sort_order: targetPhase.stages.length, // Add at end
          });
          
          // Delete all transitions involving this stage
          await deleteTransitionsByStage(schemaId, stageId);
          
          message.success(`Stage moved to ${targetPhase.displayName}. Connections have been removed.`);
        } catch (error) {
          console.error("[moveStageToPhase] Failed to update in Supabase:", error);
          message.error("Failed to move stage");
        }
      } else {
        message.success(`Stage moved to ${targetPhase.displayName}. Connections have been removed.`);
      }
    },
    [dynamicPhases, draftStages, wonStages, edgeState, setEdges, useSupabase, schemaId]
  );

  // Edge management
  const saveEdge = useCallback(
    (edge: EdgeConfig) => {
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edge.id
            ? {
                ...e,
                data: {
                  ...e.data,
                  transitionType: edge.transitionType,
                  trigger: edge.transitionTrigger,
                  onEdgeClick: handleEdgeClick,
                },
              }
            : e
        )
      );
      setSidebarOpen(false);
      setSelectedEdge(null);
      message.success("Configuration saved!");
      markUnsaved();
    },
    [setEdges, handleEdgeClick, markUnsaved]
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      setSidebarOpen(false);
      setSelectedEdge(null);
      message.success("Connection deleted!");
      markUnsaved();
    },
    [setEdges, markUnsaved]
  );

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    setSelectedEdge(null);
  }, []);

  // Drag reorder handlers - work with relative positions inside parent frames
  const onNodeDragStart: NodeDragHandler = useCallback((_event, node) => {
    // Only allow reordering of flow stages (not frames or special nodes)
    if (node.type !== "flowStage") return;
    // Don't track special nodes
    if (node.id === "lost" || node.id === "paused") return;

    draggingNodeId.current = node.id;
    dragStartPos.current = { x: node.position.x, y: node.position.y };

    // Find which row and index
    const draftIdx = draftStages.findIndex((s) => s.id === node.id);
    const wonIdx = wonStages.filter(s => s.id !== "paused").findIndex((s) => s.id === node.id);
    originalIndex.current = draftIdx !== -1 ? draftIdx : wonIdx;
  }, [draftStages, wonStages]);

  const onNodeDrag: NodeDragHandler = useCallback(
    (_event, node) => {
      if (!draggingNodeId.current || node.type !== "flowStage") return;
      // Don't reorder special nodes
      if (node.id === "lost" || node.id === "paused") return;

      const { X_SPACING } = LAYOUT;
      const FRAME_PADDING = 30;
      const nodeId = node.id;

      // First, check if this belongs to a dynamic phase
      const parentFrameId = node.parentNode;
      if (parentFrameId && parentFrameId.startsWith("frame-")) {
        const phaseId = parentFrameId.replace("frame-", "");
        const phaseIndex = dynamicPhases.findIndex(p => p.id === phaseId);
        
        if (phaseIndex !== -1) {
          const phase = dynamicPhases[phaseIndex];
          const nodeIndex = phase.stages.findIndex(s => s.id === nodeId);
          
          if (nodeIndex !== -1) {
            // Don't allow moving "ended" stage
            if (phase.stages[nodeIndex].isEnd) return;

            // Calculate which position the node is closest to (relative to frame)
            const targetIndex = Math.round((node.position.x - FRAME_PADDING) / X_SPACING);
            const clampedIndex = Math.max(0, Math.min(targetIndex, phase.stages.length - 1));

            // Don't swap with "ended" stage
            if (phase.stages[clampedIndex]?.isEnd) return;

            // If target position is different, swap
            if (clampedIndex !== nodeIndex && clampedIndex >= 0 && clampedIndex < phase.stages.length) {
              setDynamicPhases(prev => {
                const newPhases = [...prev];
                const newStages = [...newPhases[phaseIndex].stages];
                [newStages[nodeIndex], newStages[clampedIndex]] = [newStages[clampedIndex], newStages[nodeIndex]];
                newPhases[phaseIndex] = { ...newPhases[phaseIndex], stages: newStages };
                return newPhases;
              });
              markUnsaved(); // Trigger auto-save when reordering
            }
            return; // Handled by dynamic phases
          }
        }
      }

      // Legacy: Determine which phase based on parent
      const isDraftPhase = node.parentNode === "frame-draft";
      const stages = isDraftPhase ? draftStages : wonStages.filter(s => s.id !== "paused");
      const setStages = isDraftPhase ? setDraftStages : setWonStages;

      // Check if node belongs to this row
      const nodeIndex = stages.findIndex((s) => s.id === nodeId);
      if (nodeIndex === -1) return;

      // Don't allow moving "ended" stage
      if (stages[nodeIndex].isEnd) return;

      // Calculate which position the node is closest to (relative to frame)
      const targetIndex = Math.round((node.position.x - FRAME_PADDING) / X_SPACING);
      const clampedIndex = Math.max(0, Math.min(targetIndex, stages.length - 1));

      // Don't swap with "ended" stage
      if (stages[clampedIndex]?.isEnd) return;

      // If target position is different, swap
      if (clampedIndex !== nodeIndex && clampedIndex >= 0 && clampedIndex < stages.length) {
        const newStages = [...stages];
        [newStages[nodeIndex], newStages[clampedIndex]] = [newStages[clampedIndex], newStages[nodeIndex]];
        setStages(newStages);
      }
    },
    [draftStages, wonStages, dynamicPhases]
  );

  const onNodeDragStop: NodeDragHandler = useCallback(
    (_event, node) => {
      // Allow free positioning for Paused and Lost (no snap)
      if (node.id === "paused" || node.id === "lost") {
        draggingNodeId.current = null;
        return;
      }

      if (!draggingNodeId.current) return;

      const { X_SPACING } = LAYOUT;
      const FRAME_PADDING = 45;
      const FRAME_TOP_PADDING = 50;

      // Get current nodes from state
      const currentNodes = nodeState;

      // Check if node was dropped on a different phase frame
      // Get the node's current absolute position
      const draggedNode = currentNodes.find(n => n.id === node.id);
      const originalParent = draggedNode?.parentNode;
      
      // Find all phase frames
      const frameNodes = currentNodes.filter(n => n.id.startsWith("frame-"));
      
      // Calculate absolute position of dragged node
      const parentFrame = frameNodes.find(f => f.id === originalParent);
      const absX = (parentFrame?.position.x || 0) + node.position.x;
      const absY = (parentFrame?.position.y || 0) + node.position.y;
      
      // Check if dropped over a different frame
      for (const frame of frameNodes) {
        if (frame.id === originalParent) continue; // Skip current parent
        
        const frameWidth = frame.data?.width || 300;
        const frameHeight = frame.data?.height || 200;
        
        // Check if absolute position is within this frame's bounds
        if (
          absX >= frame.position.x &&
          absX <= frame.position.x + frameWidth &&
          absY >= frame.position.y &&
          absY <= frame.position.y + frameHeight
        ) {
          // Node dropped on different phase - move it!
          const targetPhaseId = frame.data?.phaseId || frame.id.replace("frame-", "");
          
          // Call the move function
          moveStageToPhase(node.id, targetPhaseId);
          
          // Reset refs
          draggingNodeId.current = null;
          dragStartPos.current = null;
          originalIndex.current = -1;
          return;
        }
      }

      // No cross-phase drop - snap stages back to grid positions (relative to parent)
      const mainWonStages = wonStages.filter(s => s.id !== "paused");

      setNodes((nds) =>
        nds.map((n) => {
          // Skip frames
          if (n.id.startsWith("frame-")) return n;
          
          // Don't snap Paused - let user position it freely
          if (n.id === "paused") return n;
          // Don't snap Lost - centered in its frame
          if (n.id === "lost") return { ...n, position: { x: 20, y: FRAME_TOP_PADDING } };

          // For dynamic phases, find stage position
          for (const phase of dynamicPhases) {
            const idx = phase.stages.findIndex(s => s.id === n.id);
            if (idx !== -1) {
              return { ...n, position: { x: FRAME_PADDING + idx * X_SPACING, y: FRAME_TOP_PADDING } };
            }
          }

          // Legacy handling
          const draftIdx = draftStages.findIndex((s) => s.id === n.id);
          const wonIdx = mainWonStages.findIndex((s) => s.id === n.id);

          if (draftIdx !== -1) {
            return { ...n, position: { x: FRAME_PADDING + draftIdx * X_SPACING, y: FRAME_TOP_PADDING } };
          }
          if (wonIdx !== -1) {
            return { ...n, position: { x: FRAME_PADDING + wonIdx * X_SPACING, y: FRAME_TOP_PADDING } };
          }
          return n;
        })
      );

      // Reset refs
      draggingNodeId.current = null;
      dragStartPos.current = null;
      originalIndex.current = -1;
    },
    [nodeState, draftStages, wonStages, dynamicPhases, setNodes, moveStageToPhase]
  );

  // Auto organize layout
  const autoOrganize = useCallback(() => {
    const { X_SPACING, ROW_1_Y, ROW_2_Y, STATE_OFFSET_X } = LAYOUT;
    const FRAME_PADDING = 45;
    const FRAME_TOP_PADDING = 50;
    const NODE_HEIGHT = 65;
    const mainWonStages = wonStages.filter(s => s.id !== "paused");
    const lostFrameX = 50 + draftStages.length * X_SPACING + STATE_OFFSET_X;
    const liveIndex = mainWonStages.findIndex(s => s.id === "live");
    // Paused position relative to parent frame
    const pausedRelativeX = liveIndex !== -1 ? FRAME_PADDING + liveIndex * X_SPACING : FRAME_PADDING + 2 * X_SPACING;

    // Calculate frame dimensions with symmetric padding (account for phase name length)
    const MIN_FRAME_WIDTH = 200;
    
    // Get phase display names from schema phases
    const draftPhaseName = schema?.phases?.find(p => p.phase_type === 'standard')?.display_name || "Draft Phase";
    const wonPhaseName = schema?.phases?.find(p => p.phase_type === 'won')?.display_name || "Won Phase";
    
    // Draft frame - ensure it fits both stages and phase name
    const draftStagesWidth = FRAME_PADDING * 2 + Math.max(0, draftStages.length - 1) * X_SPACING + 160;
    const draftNameWidth = FRAME_PADDING * 2 + 20 + (draftPhaseName.length * 8) + 24;
    const draftFrameWidth = Math.max(MIN_FRAME_WIDTH, draftStagesWidth, draftNameWidth);
    
    // Won frame - ensure it fits both stages and phase name
    const wonStagesWidth = FRAME_PADDING * 2 + Math.max(0, mainWonStages.length - 1) * X_SPACING + 160;
    const wonNameWidth = FRAME_PADDING * 2 + 20 + (wonPhaseName.length * 8) + 24;
    const wonFrameWidth = Math.max(MIN_FRAME_WIDTH, wonStagesWidth, wonNameWidth);
    
    const wonFrameHeight = NODE_HEIGHT + FRAME_TOP_PADDING + FRAME_PADDING + 180;

    const newNodes = nodeState.map((node) => {
      // Reposition frames
      if (node.id === "frame-draft") {
        return {
          ...node,
          position: { x: 50 - FRAME_PADDING, y: ROW_1_Y - FRAME_TOP_PADDING },
          data: { ...node.data, width: draftFrameWidth, height: NODE_HEIGHT + FRAME_TOP_PADDING + FRAME_PADDING },
        };
      }
      if (node.id === "frame-lost") {
        return {
          ...node,
          position: { x: lostFrameX - FRAME_PADDING, y: ROW_1_Y - FRAME_TOP_PADDING },
          data: { ...node.data, width: 180, height: NODE_HEIGHT + FRAME_TOP_PADDING + FRAME_PADDING },
        };
      }
      if (node.id === "frame-won") {
        return {
          ...node,
          position: { x: 50 - FRAME_PADDING, y: ROW_2_Y - FRAME_TOP_PADDING },
          data: { ...node.data, width: wonFrameWidth, height: wonFrameHeight },
        };
      }

      // Child nodes - positions relative to parent frame (below label)
      const draftIndex = draftStages.findIndex((s) => s.id === node.id);
      const wonIndex = mainWonStages.findIndex((s) => s.id === node.id);

      if (draftIndex !== -1) {
        return { ...node, position: { x: FRAME_PADDING + draftIndex * X_SPACING, y: FRAME_TOP_PADDING } };
      }
      if (wonIndex !== -1) {
        return { ...node, position: { x: FRAME_PADDING + wonIndex * X_SPACING, y: FRAME_TOP_PADDING } };
      }
      if (node.id === "lost") {
        return { ...node, position: { x: 20, y: FRAME_TOP_PADDING } };
      }
      if (node.id === "paused") {
        return { ...node, position: { x: pausedRelativeX, y: FRAME_TOP_PADDING + 120 } };
      }
      return node;
    });

    setNodes(newNodes);
    message.success("Layout organized!");
    markUnsaved();
  }, [nodeState, draftStages, wonStages, setNodes, markUnsaved, schema]);

  // Save stage changes
  const saveStage = useCallback(async (updatedStage: StageData) => {
    
    // First, try to update in dynamic phases
    let stageFoundInDynamicPhases = false;
    setDynamicPhases(prevPhases => {
      const newPhases = prevPhases.map(phase => {
        const stageIndex = phase.stages.findIndex(s => s.id === updatedStage.id);
        if (stageIndex !== -1) {
          stageFoundInDynamicPhases = true;
          const newStages = [...phase.stages];
          newStages[stageIndex] = updatedStage;
          return { ...phase, stages: newStages };
        }
        return phase;
      });
      return newPhases;
    });
    
    // If not in dynamic phases, update legacy stages
    if (!stageFoundInDynamicPhases) {
      if (updatedStage.row === "draft") {
        setDraftStages(prev => 
          prev.map(s => s.id === updatedStage.id ? updatedStage : s)
        );
      } else {
        setWonStages(prev => 
          prev.map(s => s.id === updatedStage.id ? updatedStage : s)
        );
      }
    }
    
    // Also update the node data
    setNodes(prev => 
      prev.map(n => {
        if (n.id === updatedStage.id) {
          return {
            ...n,
            data: {
              ...n.data,
              label: updatedStage.label,
              icon: updatedStage.icon,
              color: updatedStage.color,
            }
          };
        }
        return n;
      })
    );

    // Save to Supabase if connected
    if (useSupabase) {
      try {
        await apiUpdateStage(updatedStage.id, {
          display_name: updatedStage.label,
          icon: updatedStage.icon,
          color: updatedStage.color,
        });
      } catch (error) {
        console.error("Failed to update stage in Supabase:", error);
        message.error("Failed to save stage to database");
        return;
      }
    }

    message.success("Stage updated!");
    markUnsaved();
  }, [setNodes, useSupabase, markUnsaved, setDynamicPhases]);

  // Task management functions
  const addTask = useCallback(async (stageId: string, task: Task) => {
    let finalTask = task;


    // Save to Supabase first if connected - get server-generated ID
    if (useSupabase && schemaId) {
      try {
        const taskCount = tasksByStage[stageId]?.length || 0;
        const taskData = {
          schema_id: schemaId,
          stage_id: stageId,
          title: task.title,
          description: task.description,
          is_required: task.isRequired ?? true,
          // Human assignment
          assigned_roles: task.assignedTo,
          requires_approval: task.requiresApproval ?? false,
          approval_roles: task.approvalFrom,
          ai_bot_approvers: task.aiBotApprovers,
          // Bot assignment
          assigned_bot: task.assignedBot,
          bot_approval_mode: task.botApprovalMode,
          bot_escalation_role: task.botEscalationRole,
          bot_review_role: task.botReviewRole,
          // Common
          estimated_minutes: task.estimatedTime,
          sort_order: taskCount,
        };
        
        const createdTask = await apiCreateTask(taskData);
        
        // Use server-generated ID
        finalTask = {
          ...task,
          id: createdTask.id,
        };
      } catch (error: any) {
        console.error("Failed to create task in Supabase:", error);
        console.error("[FlowDiagram] Error details:", {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
        });
        message.error(`Failed to save task: ${error?.message || "Unknown error"}`);
        return;
      }
    } else {
    }

    // Add to local state with the final ID
    setTasksByStage(prev => ({
      ...prev,
      [stageId]: [...(prev[stageId] || []), finalTask]
    }));
    // Update task count on stage node
    setNodes(prev => prev.map(n => {
      if (n.id === stageId) {
        const currentCount = n.data.taskCount || 0;
        return { ...n, data: { ...n.data, taskCount: currentCount + 1 } };
      }
      return n;
    }));
    // Also update stage data in dynamic phases
    setDynamicPhases(prev => prev.map(phase => ({
      ...phase,
      stages: phase.stages.map(s => 
        s.id === stageId ? { ...s, taskCount: (s.taskCount || 0) + 1 } : s
      )
    })));
    
    // Update legacy stage data
    if (draftStages.find(s => s.id === stageId)) {
      setDraftStages(prev => prev.map(s => 
        s.id === stageId ? { ...s, taskCount: (s.taskCount || 0) + 1 } : s
      ));
    } else {
      setWonStages(prev => prev.map(s => 
        s.id === stageId ? { ...s, taskCount: (s.taskCount || 0) + 1 } : s
      ));
    }

    message.success("Task added!");
    markUnsaved();
  }, [setNodes, draftStages, useSupabase, schemaId, tasksByStage, markUnsaved]);

  const updateTask = useCallback(async (stageId: string, task: Task) => {
    setTasksByStage(prev => ({
      ...prev,
      [stageId]: (prev[stageId] || []).map(t => t.id === task.id ? task : t)
    }));

    // Save to Supabase if connected
    if (useSupabase) {
      try {
        await apiUpdateTask(task.id, {
          title: task.title,
          description: task.description,
          is_required: task.isRequired ?? true,
          // Human assignment
          assigned_roles: task.assignedTo,
          requires_approval: task.requiresApproval ?? false,
          approval_roles: task.approvalFrom,
          ai_bot_approvers: task.aiBotApprovers,
          // Bot assignment
          assigned_bot: task.assignedBot,
          bot_approval_mode: task.botApprovalMode,
          bot_escalation_role: task.botEscalationRole,
          bot_review_role: task.botReviewRole,
          // Common
          estimated_minutes: task.estimatedTime,
        });
      } catch (error) {
        console.error("Failed to update task in Supabase:", error);
        message.error("Failed to save task to database");
        return;
      }
    }

    // Don't show message for auto-save
  }, [useSupabase]);

  const deleteTask = useCallback(async (stageId: string, taskId: string) => {
    setTasksByStage(prev => ({
      ...prev,
      [stageId]: (prev[stageId] || []).filter(t => t.id !== taskId)
    }));
    // Update task count on stage node
    setNodes(prev => prev.map(n => {
      if (n.id === stageId) {
        const currentCount = n.data.taskCount || 0;
        return { ...n, data: { ...n.data, taskCount: Math.max(0, currentCount - 1) } };
      }
      return n;
    }));
    // Also update stage data in dynamic phases
    setDynamicPhases(prev => prev.map(phase => ({
      ...phase,
      stages: phase.stages.map(s => 
        s.id === stageId ? { ...s, taskCount: Math.max(0, (s.taskCount || 0) - 1) } : s
      )
    })));
    
    // Update legacy stage data
    if (draftStages.find(s => s.id === stageId)) {
      setDraftStages(prev => prev.map(s => 
        s.id === stageId ? { ...s, taskCount: Math.max(0, (s.taskCount || 0) - 1) } : s
      ));
    } else {
      setWonStages(prev => prev.map(s => 
        s.id === stageId ? { ...s, taskCount: Math.max(0, (s.taskCount || 0) - 1) } : s
      ));
    }

    // Delete from Supabase if connected
    if (useSupabase) {
      try {
        await apiDeleteTask(taskId);
      } catch (error) {
        console.error("Failed to delete task from Supabase:", error);
        message.error("Failed to delete task from database");
        return;
      }
    }

    message.success("Task deleted!");
    markUnsaved();
  }, [setNodes, draftStages, useSupabase, markUnsaved]);

  const reorderTasks = useCallback((stageId: string, tasks: Task[]) => {
    setTasksByStage(prev => ({
      ...prev,
      [stageId]: tasks
    }));
  }, []);

  // Move task between stages
  const moveTask = useCallback((taskId: string, fromStageId: string, toStageId: string) => {
    if (fromStageId === toStageId) return;
    
    setTasksByStage(prev => {
      const fromTasks = prev[fromStageId] || [];
      const toTasks = prev[toStageId] || [];
      const task = fromTasks.find(t => t.id === taskId);
      
      if (!task) return prev;
      
      return {
        ...prev,
        [fromStageId]: fromTasks.filter(t => t.id !== taskId),
        [toStageId]: [...toTasks, task]
      };
    });
    
    // Update task counts on stage nodes
    setNodes(prev => prev.map(n => {
      if (n.id === fromStageId) {
        const currentCount = n.data.taskCount || 0;
        return { ...n, data: { ...n.data, taskCount: Math.max(0, currentCount - 1) } };
      }
      if (n.id === toStageId) {
        const currentCount = n.data.taskCount || 0;
        return { ...n, data: { ...n.data, taskCount: currentCount + 1 } };
      }
      return n;
    }));
    
    // Update stage data task counts helper
    const updateStageCount = (stages: StageData[], stageId: string, delta: number) =>
      stages.map(s => s.id === stageId ? { ...s, taskCount: Math.max(0, (s.taskCount || 0) + delta) } : s);
    
    // Update dynamic phases task counts
    setDynamicPhases(prev => prev.map(phase => ({
      ...phase,
      stages: phase.stages.map(s => {
        if (s.id === fromStageId) {
          return { ...s, taskCount: Math.max(0, (s.taskCount || 0) - 1) };
        }
        if (s.id === toStageId) {
          return { ...s, taskCount: (s.taskCount || 0) + 1 };
        }
        return s;
      })
    })));
    
    // Update legacy draft/won stages task counts
    if (draftStages.find(s => s.id === fromStageId)) {
      setDraftStages(prev => updateStageCount(prev, fromStageId, -1));
    } else {
      setWonStages(prev => updateStageCount(prev, fromStageId, -1));
    }
    
    if (draftStages.find(s => s.id === toStageId)) {
      setDraftStages(prev => updateStageCount(prev, toStageId, 1));
    } else {
      setWonStages(prev => updateStageCount(prev, toStageId, 1));
    }
    
    message.success("Task moved!");
    markUnsaved();
  }, [setNodes, draftStages, markUnsaved]);

  // All stages combined for stage selection
  const allStages = useMemo((): StageData[] => {
    const specialStages: StageData[] = [
      { id: "lost", label: "Lost", icon: "XCircle", color: "#ff4d4f", row: "draft" },
      { id: "paused", label: "Paused", icon: "PauseCircle", color: "#faad14", row: "won" },
    ];
    
    // Include stages from dynamic phases
    const dynamicStages = dynamicPhases.flatMap(p => p.stages);
    
    return [...dynamicStages, ...draftStages, ...wonStages, ...specialStages];
  }, [dynamicPhases, draftStages, wonStages]);

  // Helper to get phase info by ID
  const getPhaseById = useCallback((phaseId: string) => {
    return dynamicPhases.find(p => p.id === phaseId) || null;
  }, [dynamicPhases]);

  // Auto-save draft to Supabase (doesn't affect production tables)
  const saveDraft = useCallback(async () => {
    if (!schemaId || !useSupabase) {
      return;
    }
    
    setIsSaving(true);
    try {
      // Extract node positions for phase frames
      const nodePositions: Record<string, { x: number; y: number }> = {};
      nodeState.forEach(node => {
        if (node.id.startsWith("frame-") || node.type === "flowStage") {
          nodePositions[node.id] = { x: node.position.x, y: node.position.y };
        }
      });

      // Build draft data structure
      const draftData: DraftData = {
        phases: dynamicPhases.map(p => ({
          id: p.id,
          name: p.name,
          displayName: p.displayName,
          color: p.color,
          icon: p.icon,
          sortOrder: p.sortOrder,
          stages: p.stages.map(s => ({
            id: s.id,
            label: s.label,
            icon: s.icon,
            color: s.color,
            sortOrder: s.sortOrder || 0,
            taskCount: s.taskCount,
          })),
        })),
        tasksByStage: Object.fromEntries(
          Object.entries(tasksByStage).map(([stageId, tasks]) => [
            stageId,
            tasks.map(t => ({
              id: t.id,
              title: t.title,
              description: t.description,
              // Human assignment
              assignedTo: t.assignedTo,
              isRequired: t.isRequired,
              estimatedTime: t.estimatedTime,
              requiresApproval: t.requiresApproval,
              approvalFrom: t.approvalFrom,
              // Bot assignment
              assignedBot: t.assignedBot,
              botApprovalMode: t.botApprovalMode,
              botEscalationRole: t.botEscalationRole,
              botReviewRole: t.botReviewRole,
            })),
          ])
        ),
        // Save edges with their configuration
        edges: edgeState.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          transitionType: e.data?.transitionType,
          trigger: e.data?.trigger,
        })),
        nodePositions, // Include positions for restoring layout
        savedAt: new Date().toISOString(),
      };
      
      await saveDraftData(schemaId, draftData);
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false); // Clear unsaved flag after successful save
      pendingSaveRef.current = false;
    } catch (error) {
      console.error("[saveDraft] Failed to save draft:", error);
      message.error("Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  }, [schemaId, useSupabase, dynamicPhases, tasksByStage, nodeState]);

  // Debounced auto-save to Supabase draft (triggers after 2 seconds of inactivity)
  useEffect(() => {
    if (hasUnsavedChanges && pendingSaveRef.current && useSupabase) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set new timeout for auto-save draft
      saveTimeoutRef.current = setTimeout(() => {
        saveDraft();
      }, 2000); // 2 second debounce
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, saveDraft, useSupabase]);

  // Get deleted/added/modified stages for migration
  const getChangedStages = useCallback(() => {
    if (!schema) return { added: [], deleted: [], modified: [] };
    
    const originalStageIds = new Set(schema.stages.map(s => s.id));
    const currentStageIds = new Set([
      ...dynamicPhases.flatMap(p => p.stages.map(s => s.id)),
      ...draftStages.map(s => s.id),
      ...wonStages.map(s => s.id),
    ].filter(id => !id.startsWith("stage-"))); // Exclude temp IDs
    
    const added = [...currentStageIds].filter(id => !originalStageIds.has(id));
    const deleted = [...originalStageIds].filter(id => !currentStageIds.has(id));
    const modified: string[] = []; // TODO: Track modified stages
    
    return { added, deleted, modified };
  }, [schema, dynamicPhases, draftStages, wonStages]);

  // Request publish - returns data needed for migration sidebar
  // Parent component should show the migration sidebar when this is called
  const requestPublish = useCallback(() => {
    const changes = getChangedStages();
    return {
      hasChanges: changes.added.length > 0 || changes.deleted.length > 0 || changes.modified.length > 0,
      deletedStages: changes.deleted.map(id => {
        const stage = schema?.stages.find(s => s.id === id);
        return stage ? { id, name: stage.display_name } : { id, name: "Unknown" };
      }),
      addedStages: changes.added,
      currentStages: [
        ...dynamicPhases.flatMap(p => p.stages),
        ...draftStages,
        ...wonStages,
      ],
    };
  }, [getChangedStages, schema, dynamicPhases, draftStages, wonStages]);

  // Actually publish after migration mapping is confirmed
  const publishLayout = useCallback(async (stageMappings?: Record<string, string>) => {
    if (!useSupabase || !schemaId) {
      return;
    }

    setIsSaving(true);
    try {
      
      // Import createPhase for new phases
      const { createPhase } = await import("../../../../lib/workflowSchemas");
      
      // First, create any new phases in production (those with temp IDs)
      const phaseIdMapping: Record<string, string> = {}; // Maps temp phase IDs to real ones
      for (const phase of dynamicPhases) {
        if (phase.id.startsWith("phase-")) {
          // This is a new phase - create it in production
          const newPhase = await createPhase({
            schema_id: schemaId,
            name: phase.name,
            display_name: phase.displayName,
            color: phase.color,
            icon: phase.icon,
            phase_type: "standard",
            sort_order: phase.sortOrder,
          });
          phaseIdMapping[phase.id] = newPhase.id;
        }
      }
      
      // Save each phase's stages with their sort_order to production tables
      const stageIdMapping: Record<string, string> = {}; // Maps temp stage IDs to real ones
      for (const phase of dynamicPhases) {
        const actualPhaseId = phaseIdMapping[phase.id] || phase.id;
        
        for (let i = 0; i < phase.stages.length; i++) {
          const stage = phase.stages[i];
          if (stage.id.startsWith("stage-")) {
            // New stage - create it in production
            const newStage = await apiCreateStage({
              schema_id: schemaId,
              phase_id: actualPhaseId,
              name: stage.label.toLowerCase().replace(/\s+/g, "-"),
              display_name: stage.label,
              icon: stage.icon || "Circle",
              color: phase.color,
              sort_order: i,
              is_start: false,
              is_end: false,
            });
            stageIdMapping[stage.id] = newStage.id;
            
            // Create tasks for this new stage
            const stageTasks = tasksByStage[stage.id] || [];
            for (let taskIdx = 0; taskIdx < stageTasks.length; taskIdx++) {
              const task = stageTasks[taskIdx];
              await apiCreateTask({
                schema_id: schemaId,
                stage_id: newStage.id,
                title: task.title,
                description: task.description,
                assigned_roles: task.assignedTo,
                is_required: task.isRequired ?? false,
                estimated_minutes: task.estimatedTime,
                requires_approval: task.requiresApproval ?? false,
                approval_roles: task.approvalFrom,
                assigned_bot: task.assignedBot,
                bot_approval_mode: task.botApprovalMode,
                bot_escalation_role: task.botEscalationRole,
                bot_review_role: task.botReviewRole,
                sort_order: taskIdx,
              });
            }
            if (stageTasks.length > 0) {
            }
          } else {
            // Existing stage - just update sort order
            await apiUpdateStage(stage.id, { sort_order: i });
          }
        }
      }

      // Save legacy draft/won stages order
      for (let i = 0; i < draftStages.length; i++) {
        const stage = draftStages[i];
        if (stage.id && !stage.id.startsWith("stage-")) {
          await apiUpdateStage(stage.id, { sort_order: i });
        }
      }
      for (let i = 0; i < wonStages.length; i++) {
        const stage = wonStages[i];
        if (stage.id && !stage.id.startsWith("stage-")) {
          await apiUpdateStage(stage.id, { sort_order: i });
        }
      }

      // Apply stage mappings to existing deals if stageMappings provided
      // This updates deals that reference deleted stages to point to mapped stages
      if (stageMappings && Object.keys(stageMappings).length > 0) {
        const { applyStageMappings, deleteStagesAfterMigration } = await import("../../../../lib/workflowSchemas");
        
        // Migrate deals from deleted stages to new stages
        await applyStageMappings(schemaId, stageMappings);
        
        // Delete the old stages from production after migration
        const deletedStageIds = Object.keys(stageMappings);
        await deleteStagesAfterMigration(deletedStageIds);
        
        message.success(`Migrated deals from ${deletedStageIds.length} deleted stage(s)`);
      }

      // Clear draft data from Supabase
      await clearDraftData(schemaId);
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setHasDraftChanges(false); // Draft is now published, no more differences
      pendingSaveRef.current = false;
      
      const migratedCount = stageMappings ? Object.keys(stageMappings).length : 0;
      const successMsg = migratedCount > 0 
        ? `Workflow published! ${migratedCount} stage(s) migrated.`
        : "Workflow published successfully!";
      message.success(successMsg);
    } catch (error) {
      console.error("[publishLayout] Failed to publish layout:", error);
      message.error("Failed to publish workflow");
    } finally {
      setIsSaving(false);
    }
  }, [useSupabase, schemaId, dynamicPhases, draftStages, wonStages]);

  // Note: We no longer need useEffects to mark unsaved on phase/stage changes.
  // The onNodesChange and onEdgesChange wrappers handle position changes,
  // and individual operations (addStage, deleteStage, etc.) call markUnsaved directly.
  const initialLoadRef = useRef(true);
  useEffect(() => {
    // Just track that initial load is complete
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
    }
  }, []);

  return {
    draftStages,
    wonStages,
    dynamicPhases,
    getPhaseById,
    nodeState,
    edgeState,
    selectedEdge,
    selectedStage,
    selectedPhase,
    sidebarOpen,
    stageSidebarOpen,
    phaseSidebarOpen,
    pendingInsert,
    loading,
    // Save state
    hasUnsavedChanges,
    hasDraftChanges, // Draft differs from production (enables Publish button)
    isSaving,
    lastSaved,
    requestPublish,
    publishLayout,
    // Node/Edge handlers
    onNodesChange,
    onEdgesChange,
    onConnect,
    onReconnect,
    onConnectStart,
    onConnectEnd,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    addPhase,
    updatePhase,
    deletePhase,
    addStage,
    moveStage,
    deleteStage,
    clearPendingInsert,
    handleEdgeClick,
    saveEdge,
    deleteEdge,
    closeSidebar,
    closeStageSlider,
    closePhaseSlider,
    saveStage,
    openStage,
    tasksByStage,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    moveTask,
    allStages,
    // Deal functions
    getDealsByStage: getDealsByStageId,
    getDealCount: getDealCountByStageId,
    autoOrganize,
    setNodes,
  };
};

