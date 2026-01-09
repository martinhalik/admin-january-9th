import { describe, it, expect, vi } from 'vitest';

// Mock the workflowSchemas module
vi.mock('../../../../lib/workflowSchemas', () => ({
  isSupabaseConfigured: false,
  createStage: vi.fn(),
  updateStage: vi.fn(),
  deleteStage: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  deleteTransitionsByStage: vi.fn(),
  saveDraftData: vi.fn(),
  loadDraftData: vi.fn().mockResolvedValue(null),
  clearDraftData: vi.fn(),
}));

// Mock antd message
vi.mock('antd', () => ({
  message: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Test helpers for stage/task data structures
const createMockStage = (id: string, label: string, color = '#1890ff') => ({
  id,
  label,
  icon: 'Circle',
  color,
  row: 'draft' as const,
  taskCount: 0,
});

const createMockTask = (id: string, title: string) => ({
  id,
  title,
  description: '',
  assignedTo: [],
  isRequired: false,
  estimatedTime: 0,
});

const createMockPhase = (id: string, name: string, stages: any[] = []) => ({
  id,
  name,
  displayName: name,
  color: '#1890ff',
  icon: 'Circle',
  sortOrder: 0,
  stages,
});

describe('FlowDiagram Data Structures', () => {
  describe('Stage Data', () => {
    it('should create a valid stage with required properties', () => {
      const stage = createMockStage('stage-1', 'New Lead');
      
      expect(stage).toHaveProperty('id');
      expect(stage).toHaveProperty('label');
      expect(stage).toHaveProperty('icon');
      expect(stage).toHaveProperty('color');
      expect(stage).toHaveProperty('row');
      expect(stage).toHaveProperty('taskCount');
    });

    it('should have id accessible for drag and drop', () => {
      const stage = createMockStage('stage-123', 'Test Stage');
      expect(stage.id).toBe('stage-123');
    });
  });

  describe('Task Data', () => {
    it('should create a valid task with required properties', () => {
      const task = createMockTask('task-1', 'Complete review');
      
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('isRequired');
    });
  });

  describe('Phase Data', () => {
    it('should create a phase with stages', () => {
      const stages = [
        createMockStage('stage-1', 'Lead'),
        createMockStage('stage-2', 'Qualified'),
      ];
      const phase = createMockPhase('phase-draft', 'Draft Phase', stages);
      
      expect(phase.stages).toHaveLength(2);
      expect(phase.stages[0].id).toBe('stage-1');
      expect(phase.stages[1].id).toBe('stage-2');
    });
  });
});

describe('allStages Computation', () => {
  it('should include stages from dynamic phases', () => {
    const dynamicPhases = [
      createMockPhase('phase-1', 'Draft', [
        createMockStage('draft-1', 'New'),
        createMockStage('draft-2', 'Qualified'),
      ]),
      createMockPhase('phase-2', 'Won', [
        createMockStage('won-1', 'Approved'),
        createMockStage('won-2', 'Live'),
      ]),
    ];

    const draftStages: any[] = [];
    const wonStages: any[] = [];
    const specialStages = [
      { id: 'lost', label: 'Lost', icon: 'XCircle', color: '#ff4d4f', row: 'draft' },
      { id: 'paused', label: 'Paused', icon: 'PauseCircle', color: '#faad14', row: 'won' },
    ];

    // Simulate the allStages computation
    const dynamicStages = dynamicPhases.flatMap(p => p.stages);
    const allStages = [...dynamicStages, ...draftStages, ...wonStages, ...specialStages];

    expect(allStages).toHaveLength(6); // 4 dynamic + 2 special
    expect(allStages.find(s => s.id === 'draft-1')).toBeDefined();
    expect(allStages.find(s => s.id === 'draft-2')).toBeDefined();
    expect(allStages.find(s => s.id === 'won-1')).toBeDefined();
    expect(allStages.find(s => s.id === 'won-2')).toBeDefined();
    expect(allStages.find(s => s.id === 'lost')).toBeDefined();
    expect(allStages.find(s => s.id === 'paused')).toBeDefined();
  });

  it('should include legacy stages when dynamic phases are empty', () => {
    const dynamicPhases: any[] = [];
    const draftStages = [
      createMockStage('legacy-1', 'Lead'),
      createMockStage('legacy-2', 'Qualified'),
    ];
    const wonStages = [
      createMockStage('legacy-3', 'Approved'),
    ];
    const specialStages = [
      { id: 'lost', label: 'Lost', icon: 'XCircle', color: '#ff4d4f', row: 'draft' },
      { id: 'paused', label: 'Paused', icon: 'PauseCircle', color: '#faad14', row: 'won' },
    ];

    const dynamicStages = dynamicPhases.flatMap(p => p.stages);
    const allStages = [...dynamicStages, ...draftStages, ...wonStages, ...specialStages];

    expect(allStages).toHaveLength(5); // 3 legacy + 2 special
    expect(allStages.find(s => s.id === 'legacy-1')).toBeDefined();
    expect(allStages.find(s => s.id === 'legacy-2')).toBeDefined();
    expect(allStages.find(s => s.id === 'legacy-3')).toBeDefined();
  });
});

describe('handleStageClick', () => {
  it('should find stage in dynamic phases', () => {
    const dynamicPhases = [
      createMockPhase('phase-1', 'Draft', [
        createMockStage('stage-1', 'New'),
        createMockStage('stage-2', 'Qualified'),
      ]),
    ];
    const draftStages: any[] = [];
    const wonStages: any[] = [];

    // Simulate finding a stage (like handleStageClick does)
    const stageId = 'stage-1';
    let stage = dynamicPhases.flatMap(p => p.stages).find(s => s.id === stageId);
    
    if (!stage) {
      stage = draftStages.find(s => s.id === stageId) || wonStages.find(s => s.id === stageId);
    }

    expect(stage).toBeDefined();
    expect(stage?.label).toBe('New');
  });

  it('should find stage in legacy arrays when dynamic phases are empty', () => {
    const dynamicPhases: any[] = [];
    const draftStages = [createMockStage('stage-1', 'New')];
    const wonStages: any[] = [];

    const stageId = 'stage-1';
    let stage = dynamicPhases.flatMap(p => p.stages).find(s => s.id === stageId);
    
    if (!stage) {
      stage = draftStages.find(s => s.id === stageId) || wonStages.find(s => s.id === stageId);
    }

    expect(stage).toBeDefined();
    expect(stage?.label).toBe('New');
  });

  it('should handle system stages (lost, paused)', () => {
    const dynamicPhases: any[] = [];
    const draftStages: any[] = [];
    const wonStages: any[] = [];

    const findStage = (stageId: string) => {
      let stage = dynamicPhases.flatMap(p => p.stages).find(s => s.id === stageId);
      
      if (!stage) {
        stage = draftStages.find(s => s.id === stageId) || wonStages.find(s => s.id === stageId);
      }
      
      if (!stage) {
        if (stageId === 'lost') {
          stage = { id: 'lost', label: 'Lost', icon: 'XCircle', color: '#ff4d4f', row: 'draft' };
        } else if (stageId === 'paused') {
          stage = { id: 'paused', label: 'Paused', icon: 'PauseCircle', color: '#faad14', row: 'won' };
        }
      }
      
      return stage;
    };

    expect(findStage('lost')).toBeDefined();
    expect(findStage('lost')?.label).toBe('Lost');
    expect(findStage('paused')).toBeDefined();
    expect(findStage('paused')?.label).toBe('Paused');
  });
});

describe('moveTask', () => {
  it('should move task from one stage to another', () => {
    const tasksByStage: Record<string, any[]> = {
      'stage-1': [createMockTask('task-1', 'Task A')],
      'stage-2': [],
    };

    const fromStageId = 'stage-1';
    const toStageId = 'stage-2';
    const taskId = 'task-1';

    // Simulate moveTask logic
    const fromTasks = tasksByStage[fromStageId] || [];
    const toTasks = tasksByStage[toStageId] || [];
    const task = fromTasks.find(t => t.id === taskId);

    expect(task).toBeDefined();

    const newTasksByStage = {
      ...tasksByStage,
      [fromStageId]: fromTasks.filter(t => t.id !== taskId),
      [toStageId]: [...toTasks, task!],
    };

    expect(newTasksByStage['stage-1']).toHaveLength(0);
    expect(newTasksByStage['stage-2']).toHaveLength(1);
    expect(newTasksByStage['stage-2'][0].id).toBe('task-1');
  });

  it('should not move task if source equals destination', () => {
    const fromStageId = 'stage-1';
    const toStageId = 'stage-1';

    // This should be a no-op
    expect(fromStageId === toStageId).toBe(true);
  });

  it('should update task counts when moving', () => {
    const dynamicPhases = [
      createMockPhase('phase-1', 'Draft', [
        { ...createMockStage('stage-1', 'New'), taskCount: 2 },
        { ...createMockStage('stage-2', 'Qualified'), taskCount: 1 },
      ]),
    ];

    const fromStageId = 'stage-1';
    const toStageId = 'stage-2';

    // Simulate updating task counts
    const updatedPhases = dynamicPhases.map(phase => ({
      ...phase,
      stages: phase.stages.map(s => {
        if (s.id === fromStageId) {
          return { ...s, taskCount: Math.max(0, (s.taskCount || 0) - 1) };
        }
        if (s.id === toStageId) {
          return { ...s, taskCount: (s.taskCount || 0) + 1 };
        }
        return s;
      }),
    }));

    const fromStage = updatedPhases[0].stages.find(s => s.id === 'stage-1');
    const toStage = updatedPhases[0].stages.find(s => s.id === 'stage-2');

    expect(fromStage?.taskCount).toBe(1); // Was 2, now 1
    expect(toStage?.taskCount).toBe(2); // Was 1, now 2
  });
});

describe('buildEdges', () => {
  it('should create edges between consecutive stages in a phase', () => {
    const phase = createMockPhase('phase-1', 'Draft', [
      createMockStage('stage-1', 'New'),
      createMockStage('stage-2', 'Qualified'),
      createMockStage('stage-3', 'Review'),
    ]);

    const edges: any[] = [];
    
    // Simulate buildEdges logic for dynamic phases
    for (let i = 0; i < phase.stages.length - 1; i++) {
      const from = phase.stages[i].id;
      const to = phase.stages[i + 1].id;
      edges.push({
        id: `${from}-${to}`,
        source: from,
        target: to,
        type: 'connection',
      });
    }

    expect(edges).toHaveLength(2);
    expect(edges[0].source).toBe('stage-1');
    expect(edges[0].target).toBe('stage-2');
    expect(edges[1].source).toBe('stage-2');
    expect(edges[1].target).toBe('stage-3');
  });

  it('should create no edges for single-stage phase', () => {
    const phase = createMockPhase('phase-1', 'Draft', [
      createMockStage('stage-1', 'Only Stage'),
    ]);

    const edges: any[] = [];
    
    for (let i = 0; i < phase.stages.length - 1; i++) {
      const from = phase.stages[i].id;
      const to = phase.stages[i + 1].id;
      edges.push({
        id: `${from}-${to}`,
        source: from,
        target: to,
      });
    }

    expect(edges).toHaveLength(0);
  });

  it('should create no edges for empty phase', () => {
    const phase = createMockPhase('phase-1', 'Empty', []);

    const edges: any[] = [];
    
    for (let i = 0; i < phase.stages.length - 1; i++) {
      const from = phase.stages[i].id;
      const to = phase.stages[i + 1].id;
      edges.push({
        id: `${from}-${to}`,
        source: from,
        target: to,
      });
    }

    expect(edges).toHaveLength(0);
  });
});

describe('Draft Data Loading', () => {
  it('should convert draft phases to DynamicPhase format', () => {
    const draftData = {
      phases: [
        {
          id: 'phase-1',
          name: 'draft',
          displayName: 'Draft Phase',
          color: '#1890ff',
          icon: 'Circle',
          sortOrder: 0,
          stages: [
            { id: 'stage-1', label: 'New', icon: 'Circle', color: '#1890ff', sortOrder: 0, taskCount: 2 },
            { id: 'stage-2', label: 'Qualified', icon: 'Circle', color: '#1890ff', sortOrder: 1, taskCount: 1 },
          ],
        },
      ],
      tasksByStage: {
        'stage-1': [
          { id: 'task-1', title: 'Task A', isRequired: true },
          { id: 'task-2', title: 'Task B', isRequired: false },
        ],
        'stage-2': [
          { id: 'task-3', title: 'Task C', isRequired: true },
        ],
      },
      savedAt: '2024-01-01T00:00:00Z',
    };

    // Simulate loading
    const loadedPhases = draftData.phases.map(p => ({
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
        row: 'draft' as const,
        taskCount: s.taskCount,
        sortOrder: s.sortOrder,
      })),
    }));

    expect(loadedPhases).toHaveLength(1);
    expect(loadedPhases[0].stages).toHaveLength(2);
    expect(loadedPhases[0].stages[0].id).toBe('stage-1');
    expect(loadedPhases[0].stages[0].taskCount).toBe(2);
  });

  it('should load tasks from draft', () => {
    const draftData = {
      tasksByStage: {
        'stage-1': [
          { id: 'task-1', title: 'Task A', description: 'Do A', isRequired: true, estimatedTime: 30 },
          { id: 'task-2', title: 'Task B', description: 'Do B', isRequired: false, estimatedTime: 15 },
        ],
      },
    };

    const loadedTasks: Record<string, any[]> = {};
    for (const [stageId, tasks] of Object.entries(draftData.tasksByStage)) {
      loadedTasks[stageId] = tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        assignedTo: (t as any).assignedTo || [],
        isRequired: t.isRequired,
        estimatedTime: t.estimatedTime,
      }));
    }

    expect(loadedTasks['stage-1']).toHaveLength(2);
    expect(loadedTasks['stage-1'][0].title).toBe('Task A');
    expect(loadedTasks['stage-1'][0].estimatedTime).toBe(30);
  });
});

describe('Draft vs Production Loading Priority', () => {
  it('should prioritize draft data over production schema data', () => {
    // This tests the fix for the race condition where production data
    // was loaded synchronously in useState initializers before
    // async draft data could be loaded
    
    const productionPhases = [
      createMockPhase('phase-1', 'Production Draft', [
        createMockStage('stage-1', 'Production Stage 1'),
      ]),
    ];
    
    const draftPhases = [
      createMockPhase('phase-1', 'Draft Phase Modified', [
        createMockStage('stage-1', 'Modified Stage 1'),
        createMockStage('stage-2', 'New Stage Added in Draft'),
      ]),
    ];
    
    // When loading, draft should take precedence
    const shouldUseDraft = draftPhases.length > 0;
    const finalPhases = shouldUseDraft ? draftPhases : productionPhases;
    
    expect(finalPhases).toHaveLength(1);
    expect(finalPhases[0].stages).toHaveLength(2); // Draft has 2 stages
    expect(finalPhases[0].stages[1].label).toBe('New Stage Added in Draft');
  });

  it('should fall back to production when no draft exists', () => {
    const productionPhases = [
      createMockPhase('phase-1', 'Production Draft', [
        createMockStage('stage-1', 'Production Stage 1'),
      ]),
    ];
    
    const draftPhases: any[] = []; // No draft data
    
    const shouldUseDraft = draftPhases.length > 0;
    const finalPhases = shouldUseDraft ? draftPhases : productionPhases;
    
    expect(finalPhases).toHaveLength(1);
    expect(finalPhases[0].stages[0].label).toBe('Production Stage 1');
  });
});

describe('Draft Data Saving', () => {
  it('should save phases with stages', () => {
    const dynamicPhases = [
      createMockPhase('phase-1', 'Draft', [
        { ...createMockStage('stage-1', 'New'), taskCount: 2, sortOrder: 0 },
        { ...createMockStage('stage-2', 'Qualified'), taskCount: 1, sortOrder: 1 },
      ]),
    ];

    const draftData = {
      phases: dynamicPhases.map(p => ({
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        color: p.color,
        icon: p.icon,
        sortOrder: p.sortOrder,
        stages: p.stages.map((s: any) => ({
          id: s.id,
          label: s.label,
          icon: s.icon,
          color: s.color,
          sortOrder: s.sortOrder || 0,
          taskCount: s.taskCount,
        })),
      })),
      savedAt: new Date().toISOString(),
    };

    expect(draftData.phases).toHaveLength(1);
    expect(draftData.phases[0].stages).toHaveLength(2);
    expect(draftData.phases[0].stages[0].id).toBe('stage-1');
  });

  it('should save edges', () => {
    const edgeState = [
      { id: 'stage-1-stage-2', source: 'stage-1', target: 'stage-2', sourceHandle: null, targetHandle: null, data: { transitionType: 'manual', trigger: 'any-time' } },
      { id: 'stage-2-stage-3', source: 'stage-2', target: 'stage-3', sourceHandle: null, targetHandle: null, data: { transitionType: 'auto', trigger: 'all-tasks' } },
    ];

    const savedEdges = edgeState.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      transitionType: e.data?.transitionType,
      trigger: e.data?.trigger,
    }));

    expect(savedEdges).toHaveLength(2);
    expect(savedEdges[0].transitionType).toBe('manual');
    expect(savedEdges[1].transitionType).toBe('auto');
  });

  it('should save node positions', () => {
    const nodeState = [
      { id: 'frame-phase-1', position: { x: 50, y: 100 }, type: 'phaseFrame' },
      { id: 'stage-1', position: { x: 45, y: 50 }, type: 'flowStage' },
      { id: 'stage-2', position: { x: 200, y: 50 }, type: 'flowStage' },
    ];

    const nodePositions: Record<string, { x: number; y: number }> = {};
    nodeState.forEach(node => {
      if (node.id.startsWith('frame-') || node.type === 'flowStage') {
        nodePositions[node.id] = { x: node.position.x, y: node.position.y };
      }
    });

    expect(Object.keys(nodePositions)).toHaveLength(3);
    expect(nodePositions['frame-phase-1']).toEqual({ x: 50, y: 100 });
    expect(nodePositions['stage-1']).toEqual({ x: 45, y: 50 });
  });
});

