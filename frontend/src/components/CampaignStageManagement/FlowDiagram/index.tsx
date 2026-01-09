import React, { useState, useEffect, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, Space, Typography, Button, Divider, Tag, Tooltip, message, Spin } from "antd";
import { Zap, User, CheckCircle, Plus, LayoutGrid, Database, Settings, Upload, Check, Loader2, Box, Link as LinkIcon, ListTodo, Layers } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";

import SidebarLayout from "../../SidebarLayout";
import GoogleWorkspaceSidebar, { TabConfig } from "../../GoogleWorkspaceSidebar";
import { nodeTypes } from "./nodes";
import { edgeTypes } from "./edges";
import { ManageStagesModal } from "./modals";
import { ConnectionSidebar, StageSidebar, TaskSidebar, SchemaSettingsSidebar, AddStageSidebar, AddPhaseSidebar, PhaseSidebar, PublishMigrationSidebar } from "./sidebars";
import { Task } from "./types";
import { useFlowDiagram, useWorkflowSchema } from "./hooks";
import { StageRow } from "./types";

const { Text } = Typography;

// Primary sidebar type - only one can be open at a time
type PrimarySidebarType = "stage" | "connection" | "schema" | null;

// Sidebar tabs configuration
const SIDEBAR_TABS: TabConfig[] = [
  { icon: Layers, label: "Phase", value: "phase", tooltip: "Phase Settings" },
  { icon: Box, label: "Stage", value: "stage", tooltip: "Stage Details" },
  { icon: LinkIcon, label: "Connection", value: "connection", tooltip: "Connection Settings" },
  { icon: ListTodo, label: "Tasks", value: "tasks", tooltip: "Tasks" },
];


const FlowDiagram: React.FC = () => {
  // React Flow instance for programmatic control
  const reactFlowInstance = useReactFlow();
  
  // Schema management hook
  const {
    schemas,
    currentSchema,
    currentSchemaId,
    loading: schemaLoading,
    saving: schemaSaving,
    isConnected,
    selectSchema,
    createNewSchema,
    duplicateSchema,
    updateSchemaSettings,
    deleteSchema,
    setSchemaActive,
  } = useWorkflowSchema();
  
  // Unified sidebar state using Google Workspace pattern
  const [activeSidebarTab, setActiveSidebarTab] = useState<string | null>(null);
  
  // Primary sidebar state - Stage, Connection, OR Schema (only one at a time)
  const [primarySidebar, setPrimarySidebar] = useState<PrimarySidebarType>(null);
  
  // Add Stage Sidebar state
  const [addStageSidebarOpen, setAddStageSidebarOpen] = useState(false);
  const [addStageRow, setAddStageRow] = useState<StageRow>("draft");
  const [addStagePhaseId, setAddStagePhaseId] = useState<string | null>(null); // Dynamic phase ID
  const [insertAfterStage, setInsertAfterStage] = useState<string | null>(null);
  const [insertPosition, setInsertPosition] = useState<"start" | "end" | "after" | "above" | "below">("end");
  
  // Add Phase Sidebar state
  const [addPhaseSidebarOpen, setAddPhaseSidebarOpen] = useState(false);
  
  // Publish Migration Sidebar state
  const [publishSidebarOpen, setPublishSidebarOpen] = useState(false);
  const [publishData, setPublishData] = useState<{
    deletedStages: { id: string; name: string }[];
    currentStages: any[];
  } | null>(null);
  
  // Modal state (only for confirmations)
  const [manageModalOpen, setManageModalOpen] = useState(false);
  
  // Secondary sidebar - Task details (can be open with primary)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskSidebarOpen, setTaskSidebarOpen] = useState(false);
  const [isTaskCreateMode, setIsTaskCreateMode] = useState(false); // True when adding new task
  // Keep track of task's stage context even when stage sidebar closes
  const [taskStageContext, setTaskStageContext] = useState<{ id: string; label: string; color: string } | null>(null);

  // Drag and drop state for moving tasks between stages
  const [draggingTask, setDraggingTask] = useState<{ task: Task; fromStageId: string } | null>(null);
  
  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Hook for all flow diagram logic - pass schema for Supabase sync
  const {
    draftStages,
    wonStages,
    getPhaseById,
    nodeState,
    edgeState,
    selectedEdge,
    selectedStage,
    selectedPhase,
    sidebarOpen: connectionSidebarRequested,
    stageSidebarOpen: stageSidebarRequested,
    phaseSidebarOpen: phaseSidebarRequested,
    pendingInsert,
    loading: diagramLoading, // Loading state for diagram data
    // Save state
    hasUnsavedChanges,
    hasDraftChanges,
    isSaving,
    lastSaved,
    requestPublish,
    publishLayout,
    // Handlers
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
    saveEdge,
    deleteEdge,
    closeSidebar: closeConnectionInHook,
    closeStageSlider: closeStageInHook,
    closePhaseSlider: closePhaseInHook,
    saveStage,
    openStage,
    tasksByStage,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    allStages,
    autoOrganize,
  } = useFlowDiagram({ schema: currentSchema, schemaId: currentSchemaId });

  // Sync hook sidebar requests with our unified primary sidebar state
  useEffect(() => {
    if (stageSidebarRequested && selectedStage) {
      setPrimarySidebar("stage");
    } else if (!stageSidebarRequested && primarySidebar === "stage") {
      // Close stage sidebar when hook requests it closed (e.g., clicking stage again)
      setPrimarySidebar(null);
    }
  }, [stageSidebarRequested, selectedStage, primarySidebar]);

  // Sync hook requests with unified sidebar tabs
  useEffect(() => {
    if (phaseSidebarRequested && selectedPhase) {
      setActiveSidebarTab("phase");
    } else if (stageSidebarRequested && selectedStage) {
      setActiveSidebarTab("stage");
    } else if (connectionSidebarRequested && selectedEdge) {
      setActiveSidebarTab("connection");
    }
  }, [phaseSidebarRequested, stageSidebarRequested, connectionSidebarRequested, selectedPhase, selectedStage, selectedEdge]);

  // Sync connection sidebar with hook state
  useEffect(() => {
    if (connectionSidebarRequested && selectedEdge) {
      setPrimarySidebar("connection");
    } else if (!connectionSidebarRequested && primarySidebar === "connection") {
      // Close connection sidebar when hook requests it closed
      setPrimarySidebar(null);
    }
  }, [connectionSidebarRequested, selectedEdge, primarySidebar]);

  // Close primary sidebar helper - only closes the specific sidebar, doesn't close phase sidebar
  const closePrimarySidebar = useCallback(() => {
    setPrimarySidebar(null);
    closeConnectionInHook();
    closeStageInHook();
    // Note: Phase sidebar is independent and not closed here
  }, [closeConnectionInHook, closeStageInHook]);

  // Open schema settings (closes stage/connection sidebars but not phase sidebar)
  const openSchemaSettings = useCallback(() => {
    closeConnectionInHook();
    closeStageInHook();
    setPrimarySidebar("schema");
    // Note: Phase sidebar remains open
  }, [closeConnectionInHook, closeStageInHook]);

  // Open sidebar when "+" is clicked on a connection or add buttons
  useEffect(() => {
    if (pendingInsert) {
      setAddStageRow(pendingInsert.row || "draft");
      setAddStagePhaseId(pendingInsert.phaseId || null);
      setInsertPosition(pendingInsert.position || "end");
      setInsertAfterStage(pendingInsert.afterStageId || null);
      setAddStageSidebarOpen(true);
      // Don't close phase sidebar - it can stay open while adding stages
      // Close stage/connection sidebars
      if (primarySidebar === "stage" || primarySidebar === "connection") {
        setPrimarySidebar(null);
      }
    }
  }, [pendingInsert, primarySidebar]);

  const handleCloseAddStageSidebar = () => {
    setAddStageSidebarOpen(false);
    setInsertAfterStage(null);
    setAddStagePhaseId(null);
    setInsertPosition("end");
    clearPendingInsert();
  };

  // Sidebar width - same for both, easily extendable
  const SIDEBAR_WIDTH = 420;

  // Calculate total sidebar width for layout adjustment
  const totalSidebarWidth = (() => {
    let width = 0;
    
    // Add Stage sidebar
    if (addStageSidebarOpen) width += SIDEBAR_WIDTH;
    
    // Add Phase sidebar
    if (addPhaseSidebarOpen) width += SIDEBAR_WIDTH;
    
    // Primary sidebar (stage, connection, or schema settings)
    if (primarySidebar !== null) width += SIDEBAR_WIDTH;
    
    // Secondary sidebar (task details)
    if (taskSidebarOpen) width += SIDEBAR_WIDTH;
    
    return width;
  })();

  // Handle drag start from sidebar
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const stageId = event.active.data.current?.stageId as string;
    const tasks = tasksByStage[stageId] || [];
    const task = tasks.find(t => t.id === taskId);
    if (task && stageId) {
      setDraggingTask({ task, fromStageId: stageId });
    }
  }, [tasksByStage]);

  // Handle drop on stage node
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && draggingTask) {
      const targetStageId = over.id as string;
      // Only move if dropped on a different stage
      if (targetStageId !== draggingTask.fromStageId && allStages.some(s => s.id === targetStageId)) {
        moveTask(active.id as string, draggingTask.fromStageId, targetStageId);
        const targetStage = allStages.find(s => s.id === targetStageId);
        message.success(`Task moved to ${targetStage?.label || "stage"}`);
      }
    }
    setDraggingTask(null);
  }, [draggingTask, allStages, moveTask]);

  // Check if still loading (schema OR diagram data)
  const isLoading = schemaLoading || diagramLoading || (isConnected && !currentSchema);

  // Auto-fit view when diagram finishes loading
  useEffect(() => {
    if (!isLoading && nodeState.length > 0) {
      // Small delay to ensure nodes are rendered
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
      }, 100);
    }
  }, [isLoading, nodeState.length, reactFlowInstance]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SidebarLayout sidebarOpen={primarySidebar !== null || taskSidebarOpen || addStageSidebarOpen || addPhaseSidebarOpen} sidebarWidth={totalSidebarWidth}>
        <div
          style={{
            width: "100%",
            height: "calc(100vh - 180px)",
            minHeight: 500,
            background: "#fafafa",
          }}
        >
        {/* SVG Markers for arrows */}
        <svg style={{ position: "absolute", width: 0, height: 0 }}>
          <defs>
            {/* Transition type arrows */}
            <marker
              id="arrow-auto"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#52c41a" />
            </marker>
            <marker
              id="arrow-manual"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#1890ff" />
            </marker>
            <marker
              id="arrow-approval"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#fa8c16" />
            </marker>
            {/* Phase transition arrows (larger) */}
            <marker
              id="arrow-phase-blue"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#1890ff" />
            </marker>
            <marker
              id="arrow-phase-green"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#52c41a" />
            </marker>
            <marker
              id="arrow-phase-red"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff4d4f" />
            </marker>
          </defs>
        </svg>

        <ReactFlow
          nodes={isLoading ? [] : nodeState}
          edges={isLoading ? [] : edgeState}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: "connection" }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.5}
          nodesDraggable
          nodesConnectable
          connectOnClick={false}
          reconnectRadius={20}
        >
          <Background gap={20} />
          {!isLoading && <Controls />}
          {!isLoading && <MiniMap nodeStrokeWidth={3} zoomable pannable />}
          
          {/* Loading indicator */}
          {isLoading && (
            <Panel position="top-left" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
              <div style={{ textAlign: "center" }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">Loading workflow schema...</Text>
                </div>
              </div>
            </Panel>
          )}

          {/* Toolbar - only show when loaded */}
          {!isLoading && (
            <Panel position="top-left">
              <Card size="small">
                <Space split={<Divider type="vertical" />}>
                  {/* Current Schema Display */}
                  <Space>
                    {isConnected ? (
                      <>
                        {/* Green dot for active schema */}
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: currentSchema?.is_active ? "#52c41a" : "#d9d9d9",
                            flexShrink: 0,
                          }}
                        />
                        <Text style={{ maxWidth: 150 }} ellipsis>
                          {currentSchema?.name || "Loading..."}
                        </Text>
                      </>
                    ) : (
                      <Tooltip title="Connect Supabase to enable multiple workflow schemas">
                        <Tag color="orange" icon={<Database size={12} />}>
                          Local Mode
                        </Tag>
                      </Tooltip>
                    )}
                    <Tooltip title="Schema Settings">
                      <Button
                        size="small"
                        type="text"
                        icon={<Settings size={14} />}
                        onClick={openSchemaSettings}
                        disabled={!isConnected}
                      />
                    </Tooltip>
                  </Space>
                  
                  <Space>
                    <Button icon={<LayoutGrid size={14} />} onClick={autoOrganize}>
                      Organize
                    </Button>
                    <Button icon={<Plus size={14} />} onClick={() => setAddPhaseSidebarOpen(true)}>
                      Add Phase
                    </Button>
                  </Space>

                  {/* Save Status & Publish */}
                  <Space>
                    {isSaving ? (
                      <Tag color="blue" icon={<Loader2 size={12} className="animate-spin" />}>
                        Saving...
                      </Tag>
                    ) : hasUnsavedChanges ? (
                      <Tag color="orange">Unsaved changes</Tag>
                    ) : hasDraftChanges ? (
                      <Tooltip title={lastSaved ? `Draft saved: ${lastSaved.toLocaleTimeString()}` : "Draft differs from production"}>
                        <Tag color="cyan" icon={<Check size={12} />}>
                          Draft
                        </Tag>
                      </Tooltip>
                    ) : lastSaved ? (
                      <Tooltip title={`Published: ${lastSaved.toLocaleTimeString()}`}>
                        <Tag color="green" icon={<Check size={12} />}>
                          Published
                        </Tag>
                      </Tooltip>
                    ) : null}
                    <Button 
                      type="primary" 
                      icon={<Upload size={14} />}
                      onClick={() => {
                        const data = requestPublish();
                        setPublishData({
                          deletedStages: data.deletedStages,
                          currentStages: data.currentStages,
                        });
                        setPublishSidebarOpen(true);
                      }}
                      disabled={!hasDraftChanges || isSaving}
                    >
                      Publish
                    </Button>
                  </Space>
                </Space>
              </Card>
            </Panel>
          )}

          {/* Legend - only show when loaded */}
          {!isLoading && (
            <Panel position="bottom-right">
              <Card size="small" style={{ minWidth: 160 }}>
                <Space direction="vertical" size={4}>
                  <Text strong style={{ fontSize: 11 }}>
                    Transitions
                  </Text>
                  <Space size={6}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: "2px solid #52c41a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Zap size={8} style={{ color: "#52c41a" }} />
                    </div>
                    <Text style={{ fontSize: 11 }}>Auto</Text>
                  </Space>
                  <Space size={6}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: "2px solid #fa8c16",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CheckCircle size={8} style={{ color: "#fa8c16" }} />
                    </div>
                    <Text style={{ fontSize: 11 }}>Approval</Text>
                  </Space>
                  <Space size={6}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: "2px solid #1890ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <User size={8} style={{ color: "#1890ff" }} />
                    </div>
                    <Text style={{ fontSize: 11 }}>Manual</Text>
                  </Space>
                <Divider style={{ margin: "8px 0" }} />
                <Text type="secondary" style={{ fontSize: 10 }}>
                  Hover stage → + to add
                </Text>
                </Space>
              </Card>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Sidebars & Modals */}
      
      {/* Primary Sidebar: Connection Details */}
      <ConnectionSidebar
        open={primarySidebar === "connection"}
        edge={selectedEdge}
        rightOffset={taskSidebarOpen ? SIDEBAR_WIDTH : 0}
        onClose={closePrimarySidebar}
        onSave={(edge) => {
          saveEdge(edge);
          // Don't auto-close - keep sidebar open for further edits
        }}
        onDelete={(edgeId) => {
          deleteEdge(edgeId);
          closePrimarySidebar();
        }}
      />

      {/* Add Stage Sidebar */}
      <AddStageSidebar
        open={addStageSidebarOpen}
        row={addStageRow}
        phaseId={addStagePhaseId || undefined}
        phaseName={addStagePhaseId ? getPhaseById(addStagePhaseId)?.displayName : undefined}
        phaseColor={addStagePhaseId ? getPhaseById(addStagePhaseId)?.color : undefined}
        stages={
          addStagePhaseId 
            ? getPhaseById(addStagePhaseId)?.stages || []
            : addStageRow === "draft" ? draftStages : wonStages
        }
        defaultPosition={insertAfterStage || undefined}
        position={insertPosition}
        onClose={handleCloseAddStageSidebar}
        onSave={(stage, position) => {
          addStage(stage, position);
          handleCloseAddStageSidebar();
        }}
        width={SIDEBAR_WIDTH}
      />

      {/* Add Phase Sidebar */}
      <AddPhaseSidebar
        open={addPhaseSidebarOpen}
        onClose={() => setAddPhaseSidebarOpen(false)}
        onSave={(phase) => {
          addPhase(phase);
          setAddPhaseSidebarOpen(false);
        }}
        width={SIDEBAR_WIDTH}
      />

      {/* Phase Details Sidebar */}
      <PhaseSidebar
        open={phaseSidebarRequested}
        phase={selectedPhase}
        onClose={closePhaseInHook}
        onSave={(phase) => {
          updatePhase(phase.id, phase);
        }}
        onDelete={(phaseId) => {
          deletePhase(phaseId);
          closePhaseInHook();
        }}
        width={SIDEBAR_WIDTH}
      />

      {/* Publish Migration Sidebar */}
      <PublishMigrationSidebar
        open={publishSidebarOpen}
        deletedStages={publishData?.deletedStages || []}
        currentStages={publishData?.currentStages || []}
        onClose={() => setPublishSidebarOpen(false)}
        onPublish={async (mappings) => {
          await publishLayout(mappings);
          setPublishSidebarOpen(false);
          // Reload the schema to get real IDs from production
          if (currentSchemaId) {
            await selectSchema(currentSchemaId);
          }
        }}
        width={SIDEBAR_WIDTH}
      />

      <ManageStagesModal
        open={manageModalOpen}
        draftStages={draftStages}
        wonStages={wonStages}
        onCancel={() => setManageModalOpen(false)}
        onMoveStage={moveStage}
        onDeleteStage={deleteStage}
      />

      {/* Primary Sidebar: Stage Details */}
      <StageSidebar
        open={primarySidebar === "stage"}
        stage={selectedStage}
        tasks={selectedStage ? (tasksByStage[selectedStage.id] || []) : []}
        allStages={allStages}
        selectedTaskId={taskSidebarOpen ? selectedTask?.id : null}
        rightOffset={taskSidebarOpen ? SIDEBAR_WIDTH : 0}
        onClose={() => {
          closePrimarySidebar();
          // Don't close task sidebar - keep it independent like browser tabs
        }}
        onTaskClose={() => {
          setTaskSidebarOpen(false);
          setSelectedTask(null);
        }}
        onSave={(updatedStage) => {
          saveStage(updatedStage);
          // Update task context if it's the same stage
          if (taskStageContext?.id === updatedStage.id) {
            setTaskStageContext({
              id: updatedStage.id,
              label: updatedStage.label,
              color: updatedStage.color,
            });
          }
          // Don't auto-close - keep sidebar open for further edits
        }}
        onDelete={(stageId) => {
          const stage = draftStages.find(s => s.id === stageId);
          if (stage) {
            deleteStage("draft", stageId);
          } else {
            deleteStage("won", stageId);
          }
          // Close task sidebar if its stage was deleted
          if (taskStageContext?.id === stageId) {
            setTaskSidebarOpen(false);
            setSelectedTask(null);
            setTaskStageContext(null);
          }
          closePrimarySidebar();
        }}
        onAddTask={(task) => {
          if (selectedStage) {
            addTask(selectedStage.id, task);
          }
        }}
        onUpdateTask={(task) => {
          if (selectedStage) {
            updateTask(selectedStage.id, task);
          }
        }}
        onDeleteTask={(taskId) => {
          if (selectedStage) {
            deleteTask(selectedStage.id, taskId);
          }
          // Close task sidebar if the deleted task was open
          if (selectedTask?.id === taskId) {
            setTaskSidebarOpen(false);
            setSelectedTask(null);
          }
        }}
        onMoveTask={(taskId, toStageId) => {
          if (selectedStage) {
            moveTask(taskId, selectedStage.id, toStageId);
          }
        }}
        onTaskClick={(task) => {
          setSelectedTask(task);
          setIsTaskCreateMode(false);
          setTaskSidebarOpen(true);
          // Store stage context for when stage sidebar closes
          if (selectedStage) {
            setTaskStageContext({
              id: selectedStage.id,
              label: selectedStage.label,
              color: selectedStage.color,
            });
          }
        }}
        onAddTaskClick={() => {
          setSelectedTask(null);
          setIsTaskCreateMode(true);
          setTaskSidebarOpen(true);
          // Store stage context for when stage sidebar closes
          if (selectedStage) {
            setTaskStageContext({
              id: selectedStage.id,
              label: selectedStage.label,
              color: selectedStage.color,
            });
          }
        }}
        width={SIDEBAR_WIDTH}
      />

      {/* Independent task sidebar - stays open even if stage sidebar closes */}
      <TaskSidebar
        open={taskSidebarOpen}
        task={selectedTask}
        stageColor={taskStageContext?.color || selectedStage?.color || "#1890ff"}
        stageName={taskStageContext?.label || selectedStage?.label || ""}
        isCreateMode={isTaskCreateMode}
        onClose={() => {
          setTaskSidebarOpen(false);
          setSelectedTask(null);
          setIsTaskCreateMode(false);
          // Keep taskStageContext in case user reopens
        }}
        onCreate={(task) => {
          const stageId = taskStageContext?.id || selectedStage?.id;
          if (stageId) {
            addTask(stageId, task);
          }
          setTaskSidebarOpen(false);
          setIsTaskCreateMode(false);
        }}
        onSave={(task) => {
          const stageId = taskStageContext?.id || selectedStage?.id;
          if (stageId) {
            updateTask(stageId, task);
          }
          setTaskSidebarOpen(false);
          setSelectedTask(null);
        }}
        onDelete={(taskId) => {
          const stageId = taskStageContext?.id || selectedStage?.id;
          if (stageId) {
            deleteTask(stageId, taskId);
          }
          setTaskSidebarOpen(false);
          setSelectedTask(null);
        }}
        onOpenStage={taskStageContext ? () => {
          openStage(taskStageContext.id);
        } : undefined}
      />

      {/* Primary Sidebar: Schema Settings */}
      <SchemaSettingsSidebar
        open={primarySidebar === "schema"}
        schemas={schemas}
        currentSchemaId={currentSchemaId}
        loading={schemaLoading}
        saving={schemaSaving}
        rightOffset={taskSidebarOpen ? SIDEBAR_WIDTH : 0}
        onClose={closePrimarySidebar}
        onSelectSchema={selectSchema}
        onCreateSchema={async (name, settings) => {
          await createNewSchema(name, settings);
        }}
        onDuplicateSchema={duplicateSchema}
        onUpdateSchema={updateSchemaSettings}
        onDeleteSchema={deleteSchema}
        onSetActive={setSchemaActive}
      />
    </SidebarLayout>

    {/* Drag Overlay - shows compact task preview while dragging */}
    <DragOverlay dropAnimation={null}>
      {draggingTask ? (
        <div
          style={{
            padding: "8px 14px",
            background: "#fff",
            border: `2px solid ${selectedStage?.color || "#1890ff"}`,
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            maxWidth: 280,
            pointerEvents: "none",
          }}
        >
          <Typography.Text strong style={{ fontSize: 13 }}>
            {draggingTask.task.title}
          </Typography.Text>
        </div>
      ) : null}
    </DragOverlay>
  </DndContext>
  );
};

// Wrap with ReactFlowProvider
const FlowDiagramView: React.FC = () => (
  <ReactFlowProvider>
    <FlowDiagram />
  </ReactFlowProvider>
);

export default FlowDiagramView;

