import { supabase, isSupabaseConfigured } from './supabase';

// Types
export interface WorkflowSchema {
  id: string;
  name: string;
  description?: string;
  account_type?: string;
  deal_type?: string;
  team?: string;
  division?: string;
  is_default: boolean;
  is_active: boolean;
  is_shared_externally: boolean;
  priority: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowPhase {
  id: string;
  schema_id: string;
  name: string;
  display_name: string;
  color: string;
  icon: string;
  phase_type: 'standard' | 'won' | 'lost';
  sort_order: number;
}

export interface WorkflowStage {
  id: string;
  schema_id: string;
  phase_id: string;
  name: string;
  display_name: string;
  icon: string;
  color?: string;
  sort_order: number;
  is_start: boolean;
  is_end: boolean;
}

export interface WorkflowTask {
  id: string;
  schema_id: string;
  stage_id: string;
  title: string;
  description?: string;
  is_required: boolean;
  // Human assignment
  assigned_roles?: string[];  // Multiple roles can be assigned to a task
  estimated_minutes?: number;
  requires_approval: boolean;
  approval_roles?: string[];
  ai_bot_approvers?: string[];
  // Bot assignment (mutually exclusive with assigned_roles)
  assigned_bot?: string;
  bot_approval_mode?: 'turbo' | 'normal' | 'manual';
  bot_escalation_role?: string;
  bot_review_role?: string;
  sort_order: number;
}

export interface WorkflowTransition {
  id: string;
  schema_id: string;
  from_stage_id: string;
  to_stage_id: string;
  transition_type: 'auto' | 'manual' | 'approval';
  trigger_condition: 'all-tasks' | 'required-tasks' | 'any-time';
  approval_roles?: string[];
  ai_bot_approvers?: string[];
}

// Full schema with all related data
export interface FullWorkflowSchema extends WorkflowSchema {
  phases: WorkflowPhase[];
  stages: WorkflowStage[];
  tasks: WorkflowTask[];
  transitions: WorkflowTransition[];
}

// ============================================
// API Functions
// ============================================

/**
 * Get all workflow schemas (for schema selector)
 */
export async function getWorkflowSchemas(): Promise<WorkflowSchema[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('workflow_schemas')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (error) {
    console.error('Error fetching workflow schemas:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a full workflow schema with all related data
 */
export async function getFullWorkflowSchema(schemaId: string): Promise<FullWorkflowSchema | null> {
  if (!supabase) {
    return null;
  }

  // Fetch schema
  const { data: schema, error: schemaError } = await supabase
    .from('workflow_schemas')
    .select('*')
    .eq('id', schemaId)
    .single();

  if (schemaError || !schema) {
    console.error('Error fetching schema:', schemaError);
    return null;
  }

  // Fetch phases
  const { data: phases } = await supabase
    .from('workflow_phases')
    .select('*')
    .eq('schema_id', schemaId)
    .order('sort_order');

  // Fetch stages
  const { data: stages } = await supabase
    .from('workflow_stages')
    .select('*')
    .eq('schema_id', schemaId)
    .order('sort_order');

  // Fetch tasks
  const { data: tasks } = await supabase
    .from('workflow_tasks')
    .select('*')
    .eq('schema_id', schemaId)
    .order('sort_order');

  // Fetch transitions
  const { data: transitions } = await supabase
    .from('workflow_transitions')
    .select('*')
    .eq('schema_id', schemaId);

  return {
    ...schema,
    phases: phases || [],
    stages: stages || [],
    tasks: tasks || [],
    transitions: transitions || [],
  };
}

/**
 * Get default workflow schema
 */
export async function getDefaultWorkflowSchema(): Promise<FullWorkflowSchema | null> {
  if (!supabase) {
    return null;
  }

  const { data: schema } = await supabase
    .from('workflow_schemas')
    .select('id')
    .eq('is_default', true)
    .eq('is_active', true)
    .single();

  if (!schema) {
    // Get first active schema
    const { data: firstSchema } = await supabase
      .from('workflow_schemas')
      .select('id')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(1)
      .single();

    if (firstSchema) {
      return getFullWorkflowSchema(firstSchema.id);
    }
    return null;
  }

  return getFullWorkflowSchema(schema.id);
}

/**
 * Create a new workflow schema
 */
export async function createWorkflowSchema(
  schema: Omit<WorkflowSchema, 'id' | 'created_at' | 'updated_at'>
): Promise<WorkflowSchema> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('workflow_schemas')
    .insert(schema)
    .select()
    .single();

  if (error) {
    console.error('Error creating schema:', error);
    throw error;
  }

  return data;
}

/**
 * Duplicate an existing schema
 */
export async function duplicateWorkflowSchema(
  sourceSchemaId: string,
  newName: string
): Promise<FullWorkflowSchema> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // Get the source schema
  const source = await getFullWorkflowSchema(sourceSchemaId);
  if (!source) {
    throw new Error('Source schema not found');
  }

  // Create new schema
  const { data: newSchema, error: schemaError } = await supabase
    .from('workflow_schemas')
    .insert({
      name: newName,
      description: `Copy of ${source.name}`,
      is_default: false,
      is_active: true,
      priority: 0,
    })
    .select()
    .single();

  if (schemaError || !newSchema) {
    throw schemaError || new Error('Failed to create schema');
  }

  // Map old IDs to new IDs
  const phaseIdMap: Record<string, string> = {};
  const stageIdMap: Record<string, string> = {};

  // Copy phases
  for (const phase of source.phases) {
    const { data: newPhase } = await supabase
      .from('workflow_phases')
      .insert({
        schema_id: newSchema.id,
        name: phase.name,
        display_name: phase.display_name,
        color: phase.color,
        icon: phase.icon,
        phase_type: phase.phase_type,
        sort_order: phase.sort_order,
      })
      .select()
      .single();

    if (newPhase) {
      phaseIdMap[phase.id] = newPhase.id;
    }
  }

  // Copy stages
  for (const stage of source.stages) {
    const newPhaseId = phaseIdMap[stage.phase_id];
    if (!newPhaseId) continue;

    const { data: newStage } = await supabase
      .from('workflow_stages')
      .insert({
        schema_id: newSchema.id,
        phase_id: newPhaseId,
        name: stage.name,
        display_name: stage.display_name,
        icon: stage.icon,
        color: stage.color,
        sort_order: stage.sort_order,
        is_start: stage.is_start,
        is_end: stage.is_end,
      })
      .select()
      .single();

    if (newStage) {
      stageIdMap[stage.id] = newStage.id;
    }
  }

  // Copy tasks
  for (const task of source.tasks) {
    const newStageId = stageIdMap[task.stage_id];
    if (!newStageId) continue;

    await supabase.from('workflow_tasks').insert({
      schema_id: newSchema.id,
      stage_id: newStageId,
      title: task.title,
      description: task.description,
      is_required: task.is_required,
      assigned_roles: task.assigned_roles,
      estimated_minutes: task.estimated_minutes,
      requires_approval: task.requires_approval,
      approval_roles: task.approval_roles,
      ai_bot_approvers: task.ai_bot_approvers,
      sort_order: task.sort_order,
    });
  }

  // Copy transitions
  for (const transition of source.transitions) {
    const newFromId = stageIdMap[transition.from_stage_id];
    const newToId = stageIdMap[transition.to_stage_id];
    if (!newFromId || !newToId) continue;

    await supabase.from('workflow_transitions').insert({
      schema_id: newSchema.id,
      from_stage_id: newFromId,
      to_stage_id: newToId,
      transition_type: transition.transition_type,
      trigger_condition: transition.trigger_condition,
      approval_roles: transition.approval_roles,
      ai_bot_approvers: transition.ai_bot_approvers,
    });
  }

  // Return the full new schema
  return getFullWorkflowSchema(newSchema.id) as Promise<FullWorkflowSchema>;
}

/**
 * Update a workflow schema
 */
export async function updateWorkflowSchema(
  schemaId: string,
  updates: Partial<WorkflowSchema>
): Promise<WorkflowSchema> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('workflow_schemas')
    .update(updates)
    .eq('id', schemaId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Delete a workflow schema
 */
export async function deleteWorkflowSchema(schemaId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('workflow_schemas')
    .delete()
    .eq('id', schemaId);

  if (error) {
    throw error;
  }
}

// ============================================
// Phase CRUD
// ============================================

export async function createPhase(phase: Omit<WorkflowPhase, 'id'>): Promise<WorkflowPhase> {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('workflow_phases')
    .insert(phase)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePhase(phaseId: string, updates: Partial<WorkflowPhase>): Promise<WorkflowPhase> {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('workflow_phases')
    .update(updates)
    .eq('id', phaseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePhase(phaseId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('workflow_phases')
    .delete()
    .eq('id', phaseId);

  if (error) throw error;
}

// ============================================
// Stage/Task/Transition CRUD
// ============================================

export async function createStage(stage: Omit<WorkflowStage, 'id'>): Promise<WorkflowStage> {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('workflow_stages')
    .insert(stage)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateStage(stageId: string, updates: Partial<WorkflowStage>): Promise<WorkflowStage> {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('workflow_stages')
    .update(updates)
    .eq('id', stageId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteStage(stageId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('workflow_stages')
    .delete()
    .eq('id', stageId);

  if (error) throw error;
}

export async function createTask(task: Omit<WorkflowTask, 'id'>): Promise<WorkflowTask> {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('workflow_tasks')
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(taskId: string, updates: Partial<WorkflowTask>): Promise<WorkflowTask> {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('workflow_tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(taskId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('workflow_tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}

export async function upsertTransition(transition: Omit<WorkflowTransition, 'id'>): Promise<WorkflowTransition> {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('workflow_transitions')
    .upsert(transition, { onConflict: 'schema_id,from_stage_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTransition(transitionId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('workflow_transitions')
    .delete()
    .eq('id', transitionId);

  if (error) throw error;
}

// Delete all transitions involving a specific stage (used when moving stage between phases)
export async function deleteTransitionsByStage(schemaId: string, stageId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  
  // Delete transitions where this stage is the source
  const { error: sourceError } = await supabase
    .from('workflow_transitions')
    .delete()
    .eq('schema_id', schemaId)
    .eq('from_stage_id', stageId);

  if (sourceError) throw sourceError;

  // Delete transitions where this stage is the target
  const { error: targetError } = await supabase
    .from('workflow_transitions')
    .delete()
    .eq('schema_id', schemaId)
    .eq('to_stage_id', stageId);

  if (targetError) throw targetError;
}

// ============================================
// DRAFT DATA MANAGEMENT
// ============================================
// Draft data is stored as JSONB in workflow_schemas.draft_data
// This allows auto-save without affecting the production schema

export interface DraftData {
  phases: Array<{
    id: string;
    name: string;
    displayName: string;
    color: string;
    icon: string;
    sortOrder: number;
    stages: Array<{
      id: string;
      label: string;
      icon: string;
      color: string;
      sortOrder: number;
      taskCount?: number;
    }>;
  }>;
  tasksByStage: Record<string, Array<{
    id: string;
    title: string;
    description?: string;
    // Human assignment
    assignedTo?: string[];
    isRequired: boolean;
    estimatedTime?: number;
    requiresApproval?: boolean;
    approvalFrom?: string[];
    // Bot assignment
    assignedBot?: string;
    botApprovalMode?: 'turbo' | 'normal' | 'manual';
    botEscalationRole?: string;
    botReviewRole?: string;
  }>>;
  // Edges/connections between stages
  edges?: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    transitionType?: string;
    trigger?: string;
  }>;
  // Node positions for restoring layout (phase frames and stages)
  nodePositions?: Record<string, { x: number; y: number }>;
  savedAt: string;
}

// Save draft data to Supabase (auto-save)
export async function saveDraftData(schemaId: string, draftData: DraftData): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('workflow_schemas')
    .update({ 
      draft_data: draftData,
      updated_at: new Date().toISOString()
    })
    .eq('id', schemaId);

  if (error) {
    console.error('Error saving draft data:', error);
    throw error;
  }
}

// Load draft data from Supabase
export async function loadDraftData(schemaId: string): Promise<DraftData | null> {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('workflow_schemas')
    .select('draft_data')
    .eq('id', schemaId)
    .single();

  if (error) {
    console.error('Error loading draft data:', error);
    return null;
  }

  return data?.draft_data as DraftData | null;
}

// Clear draft data (after publishing)
export async function clearDraftData(schemaId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('workflow_schemas')
    .update({ draft_data: null })
    .eq('id', schemaId);

  if (error) {
    console.error('Error clearing draft data:', error);
    throw error;
  }
}

// Check if schema has unsaved draft changes
export async function hasDraftChanges(schemaId: string): Promise<boolean> {
  if (!supabase) return false;
  
  const { data } = await supabase
    .from('workflow_schemas')
    .select('draft_data')
    .eq('id', schemaId)
    .single();

  return data?.draft_data != null;
}

// Apply stage mappings to deals (for publishing workflow changes)
export async function applyStageMappings(
  schemaId: string,
  stageMappings: Record<string, string>
): Promise<void> {
  if (!isSupabaseConfigured) {
    return;
  }


  // For each deleted stage -> new stage mapping
  for (const [deletedStageId, newStageId] of Object.entries(stageMappings)) {
    // NOTE: In your current setup, deals use stage LABELS not IDs
    // So we need to get the stage display names first
    
    const { data: deletedStage } = await supabase
      .from('workflow_stages')
      .select('display_name')
      .eq('id', deletedStageId)
      .single();
    
    const { data: newStage } = await supabase
      .from('workflow_stages')
      .select('display_name')
      .eq('id', newStageId)
      .single();

    if (!deletedStage || !newStage) {
      continue;
    }


    // Update all deals in the deleted stage to the new stage
    // This assumes you have a 'deals' table with a 'stage' column (storing the label)
    // If your schema is different, adjust accordingly
    const { error } = await supabase
      .from('deals')
      .update({ stage: newStage.display_name })
      .eq('stage', deletedStage.display_name);

    if (error) {
      console.error("[applyStageMappings] Failed to migrate deals:", error);
      throw new Error(`Failed to migrate deals from ${deletedStage.display_name} to ${newStage.display_name}`);
    }
  }

}

// Delete stages that were removed in the draft (called after migration)
export async function deleteStagesAfterMigration(
  stageIds: string[]
): Promise<void> {
  if (!isSupabaseConfigured) {
    return;
  }


  for (const stageId of stageIds) {
    // Delete all transitions for this stage
    await supabase
      .from('workflow_transitions')
      .delete()
      .or(`source_stage_id.eq.${stageId},target_stage_id.eq.${stageId}`);

    // Delete all tasks for this stage
    await supabase
      .from('workflow_tasks')
      .delete()
      .eq('stage_id', stageId);

    // Delete the stage itself
    const { error } = await supabase
      .from('workflow_stages')
      .delete()
      .eq('id', stageId);

    if (error) {
      console.error("[deleteStagesAfterMigration] Failed to delete stage:", stageId, error);
      throw new Error(`Failed to delete stage ${stageId}`);
    }
  }

}

// Check if Supabase is ready
export { isSupabaseConfigured };

