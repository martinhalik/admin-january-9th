import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import {
  WorkflowSchema,
  WorkflowPhase,
  WorkflowStage,
  WorkflowTask,
  FullWorkflowSchema,
  getWorkflowSchemas,
  getFullWorkflowSchema,
  createWorkflowSchema,
  updateWorkflowSchema,
  duplicateWorkflowSchema,
  deleteWorkflowSchema,
  isSupabaseConfigured,
} from "../../../../lib/workflowSchemas";
import { StageData, Task, StageRow } from "../types";

interface UseWorkflowSchemaReturn {
  // State
  schemas: WorkflowSchema[];
  currentSchema: FullWorkflowSchema | null;
  currentSchemaId: string | null;
  loading: boolean;
  saving: boolean;
  isConnected: boolean;

  // Schema management
  loadSchemas: () => Promise<void>;
  selectSchema: (schemaId: string) => Promise<void>;
  createNewSchema: (name: string, settings?: Partial<WorkflowSchema>) => Promise<WorkflowSchema>;
  duplicateSchema: (schemaId: string, newName: string) => Promise<void>;
  updateSchemaSettings: (schemaId: string, settings: Partial<WorkflowSchema>) => Promise<void>;
  deleteSchema: (schemaId: string) => Promise<void>;
  setSchemaActive: (schemaId: string, isActive: boolean) => Promise<void>;

  // Convert to/from internal format
  toInternalFormat: () => { draftStages: StageData[]; wonStages: StageData[]; tasksByStage: Record<string, Task[]> };
  
  // Save current diagram state to Supabase
  saveCurrentState: (
    draftStages: StageData[],
    wonStages: StageData[],
    tasksByStage: Record<string, Task[]>
  ) => Promise<void>;
}

// Convert Supabase stage to internal StageData format
const toStageData = (stage: WorkflowStage, phase: WorkflowPhase): StageData => ({
  id: stage.id,
  label: stage.display_name,
  icon: stage.icon,
  color: stage.color || phase.color,
  row: phase.phase_type === "lost" ? "draft" : (phase.phase_type as StageRow),
  taskCount: 0, // Will be populated from tasks
  isEnd: stage.is_end,
});

// Convert Supabase task to internal Task format
const toInternalTask = (task: WorkflowTask): Task => ({
  id: task.id,
  title: task.title,
  description: task.description ?? undefined,
  // Human assignment
  assignedTo: task.assigned_roles ?? undefined,
  isRequired: task.is_required,
  estimatedTime: task.estimated_minutes ?? undefined,
  requiresApproval: task.requires_approval ?? undefined,
  approvalFrom: task.approval_roles ?? undefined,
  aiBotApprovers: (task.ai_bot_approvers as any) ?? undefined,
  // Bot assignment
  assignedBot: task.assigned_bot as any ?? undefined,
  botApprovalMode: task.bot_approval_mode as any ?? undefined,
  botEscalationRole: task.bot_escalation_role ?? undefined,
  botReviewRole: task.bot_review_role ?? undefined,
});

export const useWorkflowSchema = (): UseWorkflowSchemaReturn => {
  const [schemas, setSchemas] = useState<WorkflowSchema[]>([]);
  const [currentSchema, setCurrentSchema] = useState<FullWorkflowSchema | null>(null);
  const [currentSchemaId, setCurrentSchemaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isConnected = isSupabaseConfigured;

  // Load all schemas
  const loadSchemas = useCallback(async () => {
    if (!isConnected) return;

    try {
      setLoading(true);
      const data = await getWorkflowSchemas();
      setSchemas(data);

      // Auto-select default if none selected
      if (!currentSchemaId && data.length > 0) {
        const defaultSchema = data.find((s) => s.is_default) || data[0];
        await selectSchema(defaultSchema.id);
      }
    } catch (error) {
      console.error("Failed to load schemas:", error);
      message.error("Failed to load workflow schemas");
    } finally {
      setLoading(false);
    }
  }, [isConnected, currentSchemaId]);

  // Select and load a specific schema
  const selectSchema = useCallback(async (schemaId: string) => {
    if (!isConnected) return;

    try {
      setLoading(true);
      const fullSchema = await getFullWorkflowSchema(schemaId);
      if (fullSchema) {
        setCurrentSchema(fullSchema);
        setCurrentSchemaId(schemaId);
      } else {
      }
    } catch (error) {
      console.error("Failed to load schema:", error);
      message.error("Failed to load workflow schema");
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  // Create a new schema
  const createNewSchema = useCallback(async (
    name: string,
    settings?: Partial<WorkflowSchema>
  ): Promise<WorkflowSchema> => {
    if (!isConnected) throw new Error("Not connected to Supabase");

    try {
      setSaving(true);
      const newSchema = await createWorkflowSchema({
        name,
        description: settings?.description || "",
        account_type: settings?.account_type || null,
        deal_type: settings?.deal_type || null,
        team: settings?.team || null,
        division: settings?.division || null,
        is_default: false,
        is_active: true,
        is_shared_externally: settings?.is_shared_externally || false,
        priority: settings?.priority || 0,
      });

      await loadSchemas();
      message.success("Schema created!");
      return newSchema;
    } catch (error) {
      console.error("Failed to create schema:", error);
      message.error("Failed to create schema");
      throw error;
    } finally {
      setSaving(false);
    }
  }, [isConnected, loadSchemas]);

  // Duplicate an existing schema
  const duplicateSchemaFn = useCallback(async (schemaId: string, newName: string) => {
    if (!isConnected) return;

    try {
      setSaving(true);
      const newSchema = await duplicateWorkflowSchema(schemaId, newName);
      await loadSchemas();
      await selectSchema(newSchema.id);
      message.success("Schema duplicated!");
    } catch (error) {
      console.error("Failed to duplicate schema:", error);
      message.error("Failed to duplicate schema");
    } finally {
      setSaving(false);
    }
  }, [isConnected, loadSchemas, selectSchema]);

  // Update schema settings
  const updateSchemaSettings = useCallback(async (
    schemaId: string,
    settings: Partial<WorkflowSchema>
  ) => {
    if (!isConnected) return;

    try {
      setSaving(true);
      await updateWorkflowSchema(schemaId, settings);
      await loadSchemas();
      
      // Reload current schema if it was updated
      if (schemaId === currentSchemaId) {
        await selectSchema(schemaId);
      }
      
      message.success("Schema updated!");
    } catch (error) {
      console.error("Failed to update schema:", error);
      message.error("Failed to update schema");
    } finally {
      setSaving(false);
    }
  }, [isConnected, loadSchemas, currentSchemaId, selectSchema]);

  // Delete a schema
  const deleteSchemaFn = useCallback(async (schemaId: string) => {
    if (!isConnected) return;

    try {
      setSaving(true);
      await deleteWorkflowSchema(schemaId);
      await loadSchemas();
      
      // If deleted current schema, select another
      if (schemaId === currentSchemaId) {
        const remaining = schemas.filter(s => s.id !== schemaId);
        if (remaining.length > 0) {
          await selectSchema(remaining[0].id);
        } else {
          setCurrentSchema(null);
          setCurrentSchemaId(null);
        }
      }
      
      message.success("Schema deleted!");
    } catch (error) {
      console.error("Failed to delete schema:", error);
      message.error("Failed to delete schema");
    } finally {
      setSaving(false);
    }
  }, [isConnected, loadSchemas, currentSchemaId, schemas, selectSchema]);

  // Set schema active/inactive
  const setSchemaActive = useCallback(async (schemaId: string, isActive: boolean) => {
    await updateSchemaSettings(schemaId, { is_active: isActive });
  }, [updateSchemaSettings]);

  // Convert current schema to internal format
  const toInternalFormat = useCallback(() => {
    if (!currentSchema) {
      return { draftStages: [], wonStages: [], tasksByStage: {} };
    }

    const { phases, stages, tasks } = currentSchema;

    const draftPhase = phases.find(p => p.phase_type === "standard" || p.name === "draft");
    const wonPhase = phases.find(p => p.phase_type === "won");
    const lostPhase = phases.find(p => p.phase_type === "lost");

    const draftStages: StageData[] = stages
      .filter(s => s.phase_id === draftPhase?.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(s => toStageData(s, draftPhase!));

    const wonStages: StageData[] = stages
      .filter(s => s.phase_id === wonPhase?.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(s => toStageData(s, wonPhase!));

    // Build tasks by stage
    const tasksByStage: Record<string, Task[]> = {};
    for (const task of tasks) {
      if (!tasksByStage[task.stage_id]) {
        tasksByStage[task.stage_id] = [];
      }
      tasksByStage[task.stage_id].push(toInternalTask(task));
    }

    // Update task counts on stages
    for (const stage of draftStages) {
      stage.taskCount = tasksByStage[stage.id]?.length || 0;
    }
    for (const stage of wonStages) {
      stage.taskCount = tasksByStage[stage.id]?.length || 0;
    }

    return { draftStages, wonStages, tasksByStage };
  }, [currentSchema]);

  // Save current diagram state to Supabase
  const saveCurrentState = useCallback(async (
    draftStages: StageData[],
    wonStages: StageData[],
    tasksByStage: Record<string, Task[]>
  ) => {
    if (!isConnected || !currentSchema) return;

    // For now, we'll save individual changes through the API
    // This is a placeholder for batch save functionality
    setSaving(true);
    try {
      // The individual CRUD operations in useFlowDiagram will handle saves
      message.success("Changes saved!");
    } finally {
      setSaving(false);
    }
  }, [isConnected, currentSchema]);

  // Load schemas on mount
  useEffect(() => {
    if (isConnected) {
      loadSchemas();
    }
  }, [isConnected]);

  return {
    schemas,
    currentSchema,
    currentSchemaId,
    loading,
    saving,
    isConnected,
    loadSchemas,
    selectSchema,
    createNewSchema,
    duplicateSchema: duplicateSchemaFn,
    updateSchemaSettings,
    deleteSchema: deleteSchemaFn,
    setSchemaActive,
    toInternalFormat,
    saveCurrentState,
  };
};

