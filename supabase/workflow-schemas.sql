-- ============================================
-- WORKFLOW SCHEMAS - Multi-tenant Stage Management
-- ============================================
-- Supports multiple workflow configurations based on:
-- Account, Deal Type (PDS), Owner, Team

-- ============================================
-- 1. MAIN SCHEMA TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS workflow_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Assignment criteria (nullable = applies to all)
  account_type TEXT,           -- e.g., 'enterprise', 'smb', 'local'
  deal_type TEXT,              -- e.g., 'pds', 'standard', 'custom'
  team TEXT,                   -- e.g., 'us-sales', 'eu-sales', 'enterprise-team'
  division TEXT,               -- e.g., 'local', 'national', 'goods'
  
  -- Settings
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_shared_externally BOOLEAN DEFAULT FALSE,  -- For partners like Onlane
  
  -- Priority for rule matching (higher = checked first)
  priority INTEGER DEFAULT 0,
  
  -- Draft data (auto-saved changes before publishing)
  -- Contains JSONB with phases, stages, tasks that haven't been published yet
  draft_data JSONB,
  
  -- Metadata
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster schema lookups
CREATE INDEX IF NOT EXISTS idx_workflow_schemas_lookup 
ON workflow_schemas(account_type, deal_type, team, division, is_active);

-- ============================================
-- 2. PHASES (Draft, Won, Lost, Custom)
-- ============================================

CREATE TABLE IF NOT EXISTS workflow_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id UUID NOT NULL REFERENCES workflow_schemas(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,           -- Internal name: 'draft', 'won', 'lost'
  display_name TEXT NOT NULL,   -- UI name: 'Draft Phase', 'Won Phase'
  color TEXT NOT NULL DEFAULT '#1890ff',
  icon TEXT DEFAULT 'Folder',
  
  -- Phase type for special handling
  phase_type TEXT NOT NULL DEFAULT 'standard' CHECK (phase_type IN ('standard', 'won', 'lost')),
  
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(schema_id, name)
);

-- ============================================
-- 3. STAGES (within phases)
-- ============================================

CREATE TABLE IF NOT EXISTS workflow_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id UUID NOT NULL REFERENCES workflow_schemas(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES workflow_phases(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  icon TEXT DEFAULT 'Circle',
  color TEXT,  -- NULL = inherit from phase
  
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Special flags
  is_start BOOLEAN DEFAULT FALSE,   -- First stage in phase
  is_end BOOLEAN DEFAULT FALSE,     -- Final stage (e.g., "Ended")
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(schema_id, phase_id, name)
);

-- ============================================
-- 4. TASKS (within stages)
-- ============================================

CREATE TABLE IF NOT EXISTS workflow_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id UUID NOT NULL REFERENCES workflow_schemas(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES workflow_stages(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Task settings
  is_required BOOLEAN DEFAULT TRUE,
  assigned_roles TEXT[],          -- Human roles that can complete this task
  estimated_minutes INTEGER,
  
  -- Bot assignment (mutually exclusive with assigned_roles)
  assigned_bot TEXT,              -- AI bot assigned to this task
  bot_approval_mode TEXT CHECK (bot_approval_mode IN ('turbo', 'normal', 'manual')),
  bot_escalation_role TEXT,       -- Who handles escalated cases
  bot_review_role TEXT,           -- Who reviews bot's completed work
  
  -- Human approval settings
  requires_approval BOOLEAN DEFAULT FALSE,
  approval_roles TEXT[],          -- Human roles that can approve
  ai_bot_approvers TEXT[],        -- AI bots: 'license-checker', 'content-approval', 'qa-bot'
  
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. TRANSITIONS (connections between stages)
-- ============================================

CREATE TABLE IF NOT EXISTS workflow_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id UUID NOT NULL REFERENCES workflow_schemas(id) ON DELETE CASCADE,
  
  from_stage_id UUID NOT NULL REFERENCES workflow_stages(id) ON DELETE CASCADE,
  to_stage_id UUID NOT NULL REFERENCES workflow_stages(id) ON DELETE CASCADE,
  
  -- Transition settings
  transition_type TEXT NOT NULL DEFAULT 'manual' CHECK (transition_type IN ('auto', 'manual', 'approval')),
  trigger_condition TEXT DEFAULT 'required-tasks' CHECK (trigger_condition IN ('all-tasks', 'required-tasks', 'any-time')),
  
  -- For approval type
  approval_roles TEXT[],
  ai_bot_approvers TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One transition per source stage (can be relaxed if needed)
  UNIQUE(schema_id, from_stage_id)
);

-- ============================================
-- 6. SCHEMA ACCESS (for external sharing)
-- ============================================

CREATE TABLE IF NOT EXISTS workflow_schema_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id UUID NOT NULL REFERENCES workflow_schemas(id) ON DELETE CASCADE,
  
  -- Who has access
  access_type TEXT NOT NULL CHECK (access_type IN ('user', 'team', 'partner', 'public')),
  access_value TEXT NOT NULL,     -- user_id, team_name, partner_name
  
  -- Permission level
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(schema_id, access_type, access_value)
);

-- ============================================
-- 7. HELPER FUNCTION: Find matching schema
-- ============================================

CREATE OR REPLACE FUNCTION find_workflow_schema(
  p_account_type TEXT DEFAULT NULL,
  p_deal_type TEXT DEFAULT NULL,
  p_team TEXT DEFAULT NULL,
  p_division TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_schema_id UUID;
BEGIN
  -- Find best matching schema by priority
  -- More specific matches (more non-null criteria) are preferred
  SELECT id INTO v_schema_id
  FROM workflow_schemas
  WHERE is_active = TRUE
    AND (account_type IS NULL OR account_type = p_account_type)
    AND (deal_type IS NULL OR deal_type = p_deal_type)
    AND (team IS NULL OR team = p_team)
    AND (division IS NULL OR division = p_division)
  ORDER BY 
    priority DESC,
    -- Prefer more specific matches
    (CASE WHEN account_type IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN deal_type IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN team IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN division IS NOT NULL THEN 1 ELSE 0 END) DESC
  LIMIT 1;
  
  -- Fall back to default if no match
  IF v_schema_id IS NULL THEN
    SELECT id INTO v_schema_id
    FROM workflow_schemas
    WHERE is_default = TRUE AND is_active = TRUE
    LIMIT 1;
  END IF;
  
  RETURN v_schema_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. SEED DEFAULT SCHEMA
-- ============================================

-- Insert default schema
INSERT INTO workflow_schemas (id, name, description, is_default, priority)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Workflow',
  'Standard campaign workflow for all deals',
  TRUE,
  0
) ON CONFLICT DO NOTHING;

-- Insert default phases
INSERT INTO workflow_phases (id, schema_id, name, display_name, color, phase_type, sort_order)
VALUES 
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'draft', 'Draft Phase', '#1890ff', 'standard', 0),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'won', 'Won Phase', '#52c41a', 'won', 1),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'lost', 'Lost', '#ff4d4f', 'lost', 2)
ON CONFLICT DO NOTHING;

-- Insert default stages for Draft phase
INSERT INTO workflow_stages (id, schema_id, phase_id, name, display_name, icon, sort_order, is_start)
VALUES 
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', 'prospecting', 'Prospecting', 'Search', 0, TRUE),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', 'qualification', 'Qualification', 'ClipboardCheck', 1, FALSE),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', 'presentation', 'Presentation', 'FileText', 2, FALSE),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', 'negotiation', 'Negotiation', 'MessageSquare', 3, FALSE)
ON CONFLICT DO NOTHING;

-- Insert default stages for Won phase
INSERT INTO workflow_stages (id, schema_id, phase_id, name, display_name, icon, sort_order, is_start, is_end)
VALUES 
  ('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', 'approved', 'Approved', 'ThumbsUp', 0, TRUE, FALSE),
  ('00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', 'scheduled', 'Scheduled', 'Calendar', 1, FALSE, FALSE),
  ('00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', 'live', 'Live', 'PlayCircle', 2, FALSE, FALSE),
  ('00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', 'paused', 'Paused', 'PauseCircle', 3, FALSE, FALSE),
  ('00000000-0000-0000-0002-000000000009', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', 'ended', 'Ended', 'CheckCircle', 4, FALSE, TRUE)
ON CONFLICT DO NOTHING;

-- Insert Lost stage
INSERT INTO workflow_stages (id, schema_id, phase_id, name, display_name, icon, sort_order)
VALUES 
  ('00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000003', 'lost', 'Lost', 'XCircle', 0)
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. ROW LEVEL SECURITY (optional)
-- ============================================

-- Enable RLS
ALTER TABLE workflow_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_schema_access ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active schemas (adjust as needed)
CREATE POLICY "Read active schemas" ON workflow_schemas
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Read phases" ON workflow_phases
  FOR SELECT USING (TRUE);

CREATE POLICY "Read stages" ON workflow_stages
  FOR SELECT USING (TRUE);

CREATE POLICY "Read tasks" ON workflow_tasks
  FOR SELECT USING (TRUE);

CREATE POLICY "Read transitions" ON workflow_transitions
  FOR SELECT USING (TRUE);

-- For development: Allow all operations (tighten for production)
CREATE POLICY "Allow all for dev" ON workflow_schemas FOR ALL USING (TRUE);
CREATE POLICY "Allow all for dev" ON workflow_phases FOR ALL USING (TRUE);
CREATE POLICY "Allow all for dev" ON workflow_stages FOR ALL USING (TRUE);
CREATE POLICY "Allow all for dev" ON workflow_tasks FOR ALL USING (TRUE);
CREATE POLICY "Allow all for dev" ON workflow_transitions FOR ALL USING (TRUE);
CREATE POLICY "Allow all for dev" ON workflow_schema_access FOR ALL USING (TRUE);

-- ============================================
-- 10. UPDATED_AT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workflow_schemas_updated_at
  BEFORE UPDATE ON workflow_schemas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_workflow_phases_updated_at
  BEFORE UPDATE ON workflow_phases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_workflow_stages_updated_at
  BEFORE UPDATE ON workflow_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_workflow_tasks_updated_at
  BEFORE UPDATE ON workflow_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_workflow_transitions_updated_at
  BEFORE UPDATE ON workflow_transitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

