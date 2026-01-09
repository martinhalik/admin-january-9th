-- Campaign Stage Management Schema
-- This schema supports configuration of campaign stages, substages, and auto-triggering tasks

-- ============================================
-- 1. CAMPAIGN STAGE CONFIGURATION
-- ============================================

-- Main campaign stages configuration table
CREATE TABLE IF NOT EXISTS campaign_stage_config (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (name IN ('draft', 'won', 'lost')),
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign substages configuration table
CREATE TABLE IF NOT EXISTS campaign_substage_config (
  id TEXT PRIMARY KEY,
  stage_id TEXT NOT NULL REFERENCES campaign_stage_config(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Workflow settings
  can_advance_to_next BOOLEAN DEFAULT TRUE,
  can_skip BOOLEAN DEFAULT FALSE,
  requires_approval BOOLEAN DEFAULT FALSE,
  estimated_duration_days INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(stage_id, name)
);

-- ============================================
-- 2. TASK TEMPLATES (Auto-triggering)
-- ============================================

CREATE TABLE IF NOT EXISTS task_templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Task categorization
  category TEXT CHECK (category IN ('approval', 'content', 'setup', 'review', 'notification', 'integration', 'other')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  
  -- Auto-trigger conditions
  trigger_stage_id TEXT REFERENCES campaign_stage_config(id) ON DELETE CASCADE,
  trigger_substage_id TEXT REFERENCES campaign_substage_config(id) ON DELETE CASCADE,
  trigger_on_enter BOOLEAN DEFAULT TRUE,  -- Trigger when entering stage
  trigger_on_exit BOOLEAN DEFAULT FALSE,   -- Trigger when exiting stage
  
  -- Task settings
  is_required BOOLEAN DEFAULT FALSE,
  auto_assign_to_role TEXT, -- e.g., 'sales_rep', 'manager', 'admin', 'merchant'
  estimated_time_minutes INTEGER,
  due_after_hours INTEGER, -- Hours after trigger to set as due
  
  -- Task template content
  checklist_items JSONB, -- Array of checklist items
  form_fields JSONB,     -- Dynamic form fields if needed
  
  -- Status and ordering
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. DEAL TASKS (Auto-generated from templates)
-- ============================================

CREATE TABLE IF NOT EXISTS deal_tasks (
  id TEXT PRIMARY KEY,
  deal_id TEXT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  template_id TEXT REFERENCES task_templates(id) ON DELETE SET NULL,
  
  -- Task details (copied from template, can be customized)
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('approval', 'content', 'setup', 'review', 'notification', 'integration', 'other')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  
  -- Assignment
  assigned_to_user_id TEXT, -- Future: Reference to users table
  assigned_to_role TEXT,
  
  -- Status tracking
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'blocked')) DEFAULT 'pending',
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Timing
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Task data
  checklist_items JSONB, -- Array of {id, text, completed}
  form_data JSONB,       -- Collected form data
  notes TEXT,
  
  -- Metadata
  triggered_by_stage TEXT,
  triggered_by_substage TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. TASK DEPENDENCIES
-- ============================================

CREATE TABLE IF NOT EXISTS task_dependencies (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES deal_tasks(id) ON DELETE CASCADE,
  depends_on_task_id TEXT NOT NULL REFERENCES deal_tasks(id) ON DELETE CASCADE,
  dependency_type TEXT CHECK (dependency_type IN ('blocking', 'suggested')) DEFAULT 'blocking',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(task_id, depends_on_task_id)
);

-- ============================================
-- 5. TASK ACTIVITY LOG
-- ============================================

CREATE TABLE IF NOT EXISTS task_activity_log (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES deal_tasks(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- e.g., 'created', 'assigned', 'started', 'completed', 'commented'
  actor_id TEXT, -- User who performed the action
  actor_name TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Stage config indexes
CREATE INDEX idx_campaign_stage_config_active ON campaign_stage_config(is_active);
CREATE INDEX idx_campaign_substage_config_stage ON campaign_substage_config(stage_id);
CREATE INDEX idx_campaign_substage_config_active ON campaign_substage_config(is_active);

-- Task template indexes
CREATE INDEX idx_task_templates_stage ON task_templates(trigger_stage_id);
CREATE INDEX idx_task_templates_substage ON task_templates(trigger_substage_id);
CREATE INDEX idx_task_templates_active ON task_templates(is_active);
CREATE INDEX idx_task_templates_category ON task_templates(category);

-- Deal task indexes
CREATE INDEX idx_deal_tasks_deal ON deal_tasks(deal_id);
CREATE INDEX idx_deal_tasks_template ON deal_tasks(template_id);
CREATE INDEX idx_deal_tasks_status ON deal_tasks(status);
CREATE INDEX idx_deal_tasks_assigned_role ON deal_tasks(assigned_to_role);
CREATE INDEX idx_deal_tasks_due ON deal_tasks(due_at);
CREATE INDEX idx_deal_tasks_priority ON deal_tasks(priority);

-- Task dependency indexes
CREATE INDEX idx_task_dependencies_task ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

-- Activity log indexes
CREATE INDEX idx_task_activity_log_task ON task_activity_log(task_id);
CREATE INDEX idx_task_activity_log_created ON task_activity_log(created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp for campaign_stage_config
CREATE TRIGGER update_campaign_stage_config_updated_at 
  BEFORE UPDATE ON campaign_stage_config
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at timestamp for campaign_substage_config
CREATE TRIGGER update_campaign_substage_config_updated_at 
  BEFORE UPDATE ON campaign_substage_config
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at timestamp for task_templates
CREATE TRIGGER update_task_templates_updated_at 
  BEFORE UPDATE ON task_templates
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at timestamp for deal_tasks
CREATE TRIGGER update_deal_tasks_updated_at 
  BEFORE UPDATE ON deal_tasks
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES (Row Level Security)
-- ============================================

-- Enable RLS
ALTER TABLE campaign_stage_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_substage_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity_log ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust based on auth requirements)
CREATE POLICY "Allow all operations on campaign_stage_config" ON campaign_stage_config
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on campaign_substage_config" ON campaign_substage_config
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on task_templates" ON task_templates
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on deal_tasks" ON deal_tasks
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on task_dependencies" ON task_dependencies
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on task_activity_log" ON task_activity_log
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- VIEWS
-- ============================================

-- View: Active task templates with stage/substage info
CREATE OR REPLACE VIEW active_task_templates AS
SELECT 
  tt.*,
  cs.display_name as stage_display_name,
  css.display_name as substage_display_name
FROM task_templates tt
LEFT JOIN campaign_stage_config cs ON tt.trigger_stage_id = cs.id
LEFT JOIN campaign_substage_config css ON tt.trigger_substage_id = css.id
WHERE tt.is_active = TRUE
ORDER BY tt.sort_order;

-- View: Deal tasks with template and deal info
CREATE OR REPLACE VIEW deal_tasks_detailed AS
SELECT 
  dt.*,
  d.title as deal_title,
  d.merchant as merchant_name,
  tt.title as template_title
FROM deal_tasks dt
JOIN deals d ON dt.deal_id = d.id
LEFT JOIN task_templates tt ON dt.template_id = tt.id
ORDER BY dt.due_at ASC NULLS LAST;

-- View: Task summary by deal
CREATE OR REPLACE VIEW deal_task_summary AS
SELECT 
  deal_id,
  COUNT(*) as total_tasks,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
  COUNT(*) FILTER (WHERE status = 'blocked') as blocked_tasks,
  COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_tasks,
  COUNT(*) FILTER (WHERE due_at < NOW() AND status NOT IN ('completed', 'cancelled')) as overdue_tasks,
  AVG(completion_percentage) as avg_completion_percentage
FROM deal_tasks
GROUP BY deal_id;

-- ============================================
-- SEED DATA (Default Configuration)
-- ============================================

-- Insert default main stages
INSERT INTO campaign_stage_config (id, name, display_name, description, icon, color, sort_order) VALUES
  ('stage-draft', 'draft', 'Draft', 'Deal in development and negotiation', 'FileText', '#1890ff', 1),
  ('stage-won', 'won', 'Won', 'Deal closed successfully and active', 'CheckCircle', '#52c41a', 2),
  ('stage-lost', 'lost', 'Lost', 'Deal closed unsuccessfully', 'XCircle', '#ff4d4f', 3)
ON CONFLICT (name) DO NOTHING;

-- Insert draft substages
INSERT INTO campaign_substage_config (id, stage_id, name, display_name, description, icon, sort_order, estimated_duration_days) VALUES
  ('substage-draft-prospecting', 'stage-draft', 'prospecting', 'Prospecting', 'Identifying and researching potential merchant leads', 'Search', 1, 3),
  ('substage-draft-prequal', 'stage-draft', 'pre_qualification', 'Pre-qualification', 'Internal approval from manager before proceeding', 'ClipboardCheck', 2, 1),
  ('substage-draft-presentation', 'stage-draft', 'presentation', 'Presentation', 'Initial deal setup and content creation', 'FileText', 3, 2),
  ('substage-draft-appointment', 'stage-draft', 'appointment', 'Appointment', 'Configure booking and appointment settings', 'Calendar', 4, 1),
  ('substage-draft-proposal', 'stage-draft', 'proposal', 'Proposal', 'Create and review deal proposal', 'FileText', 5, 2),
  ('substage-draft-needs', 'stage-draft', 'needs_assessment', 'Needs Assessment', 'Assess merchant requirements and expectations', 'UserCheck', 6, 2),
  ('substage-draft-contract-sent', 'stage-draft', 'contract_sent', 'Contract Sent', 'Contract sent to merchant for review', 'FileText', 7, 3),
  ('substage-draft-negotiation', 'stage-draft', 'negotiation', 'Negotiation', 'Terms and pricing negotiation in progress', 'AlertCircle', 8, 5),
  ('substage-draft-contract-signed', 'stage-draft', 'contract_signed', 'Contract Signed', 'Contract finalized by merchant', 'FileCheck', 9, 1),
  ('substage-draft-approved', 'stage-draft', 'approved', 'Approved', 'Deal approved and ready to schedule', 'CheckCircle', 10, 1)
ON CONFLICT (stage_id, name) DO NOTHING;

-- Insert won substages
INSERT INTO campaign_substage_config (id, stage_id, name, display_name, description, icon, sort_order, estimated_duration_days) VALUES
  ('substage-won-scheduled', 'stage-won', 'scheduled', 'Scheduled', 'Deal scheduled for launch', 'Calendar', 1, NULL),
  ('substage-won-live', 'stage-won', 'live', 'Live', 'Deal is active and taking orders', 'PlayCircle', 2, NULL),
  ('substage-won-paused', 'stage-won', 'paused', 'Paused', 'Deal temporarily paused', 'PauseCircle', 3, NULL),
  ('substage-won-soldout', 'stage-won', 'sold_out', 'Sold Out', 'All inventory sold', 'Package', 4, NULL),
  ('substage-won-ended', 'stage-won', 'ended', 'Ended', 'Deal campaign completed', 'CheckCircle', 5, NULL)
ON CONFLICT (stage_id, name) DO NOTHING;

-- Insert lost substage
INSERT INTO campaign_substage_config (id, stage_id, name, display_name, description, icon, sort_order) VALUES
  ('substage-lost-archived', 'stage-lost', 'closed_lost', 'Archived', 'Deal closed as lost', 'XCircle', 1)
ON CONFLICT (stage_id, name) DO NOTHING;

-- ============================================
-- SAMPLE TASK TEMPLATES
-- ============================================

-- Draft Stage: Prospecting tasks
INSERT INTO task_templates (id, title, description, category, priority, trigger_stage_id, trigger_substage_id, trigger_on_enter, is_required, auto_assign_to_role, due_after_hours, sort_order) VALUES
  ('task-tpl-research', 'Research Merchant Background', 'Research the merchant''s business, competitive landscape, and market position', 'setup', 'high', 'stage-draft', 'substage-draft-prospecting', TRUE, TRUE, 'sales_rep', 24, 1),
  ('task-tpl-initial-contact', 'Make Initial Contact', 'Reach out to merchant to introduce partnership opportunity', 'setup', 'high', 'stage-draft', 'substage-draft-prospecting', TRUE, TRUE, 'sales_rep', 48, 2)
ON CONFLICT (id) DO NOTHING;

-- Draft Stage: Pre-qualification tasks
INSERT INTO task_templates (id, title, description, category, priority, trigger_stage_id, trigger_substage_id, trigger_on_enter, is_required, auto_assign_to_role, due_after_hours, sort_order) VALUES
  ('task-tpl-manager-approval', 'Get Manager Approval', 'Submit deal for manager review and approval', 'approval', 'urgent', 'stage-draft', 'substage-draft-prequal', TRUE, TRUE, 'manager', 24, 1)
ON CONFLICT (id) DO NOTHING;

-- Draft Stage: Presentation tasks
INSERT INTO task_templates (id, title, description, category, priority, trigger_stage_id, trigger_substage_id, trigger_on_enter, is_required, auto_assign_to_role, due_after_hours, sort_order) VALUES
  ('task-tpl-create-content', 'Create Deal Content', 'Write compelling deal title, description, and highlights', 'content', 'high', 'stage-draft', 'substage-draft-presentation', TRUE, TRUE, 'sales_rep', 48, 1),
  ('task-tpl-upload-images', 'Upload Deal Images', 'Add high-quality images showcasing the merchant and offer', 'content', 'medium', 'stage-draft', 'substage-draft-presentation', TRUE, FALSE, 'sales_rep', 72, 2),
  ('task-tpl-set-pricing', 'Configure Pricing Options', 'Set up pricing tiers and value calculations', 'setup', 'high', 'stage-draft', 'substage-draft-presentation', TRUE, TRUE, 'sales_rep', 48, 3)
ON CONFLICT (id) DO NOTHING;

-- Draft Stage: Contract Sent tasks
INSERT INTO task_templates (id, title, description, category, priority, trigger_stage_id, trigger_substage_id, trigger_on_enter, is_required, auto_assign_to_role, due_after_hours, sort_order) VALUES
  ('task-tpl-send-contract', 'Send Contract to Merchant', 'Email contract and partnership agreement to merchant', 'setup', 'high', 'stage-draft', 'substage-draft-contract-sent', TRUE, TRUE, 'sales_rep', 8, 1),
  ('task-tpl-followup-contract', 'Follow Up on Contract', 'Check in with merchant about contract review', 'setup', 'medium', 'stage-draft', 'substage-draft-contract-sent', TRUE, FALSE, 'sales_rep', 120, 2)
ON CONFLICT (id) DO NOTHING;

-- Draft Stage: Approved tasks
INSERT INTO task_templates (id, title, description, category, priority, trigger_stage_id, trigger_substage_id, trigger_on_enter, is_required, auto_assign_to_role, due_after_hours, sort_order) VALUES
  ('task-tpl-final-review', 'Final Content Review', 'Review all deal content for accuracy and quality', 'review', 'high', 'stage-draft', 'substage-draft-approved', TRUE, TRUE, 'manager', 24, 1),
  ('task-tpl-schedule-launch', 'Schedule Launch Date', 'Coordinate with merchant to set deal launch date', 'setup', 'high', 'stage-draft', 'substage-draft-approved', TRUE, TRUE, 'sales_rep', 48, 2)
ON CONFLICT (id) DO NOTHING;

-- Won Stage: Scheduled tasks
INSERT INTO task_templates (id, title, description, category, priority, trigger_stage_id, trigger_substage_id, trigger_on_enter, is_required, auto_assign_to_role, due_after_hours, sort_order) VALUES
  ('task-tpl-notify-merchant', 'Notify Merchant of Launch', 'Send merchant confirmation and launch details', 'notification', 'high', 'stage-won', 'substage-won-scheduled', TRUE, TRUE, 'sales_rep', 24, 1),
  ('task-tpl-prepare-inventory', 'Confirm Inventory Ready', 'Ensure merchant has sufficient inventory for launch', 'setup', 'high', 'stage-won', 'substage-won-scheduled', TRUE, TRUE, 'sales_rep', 72, 2)
ON CONFLICT (id) DO NOTHING;

-- Won Stage: Live tasks
INSERT INTO task_templates (id, title, description, category, priority, trigger_stage_id, trigger_substage_id, trigger_on_enter, is_required, auto_assign_to_role, due_after_hours, sort_order) VALUES
  ('task-tpl-monitor-performance', 'Monitor Deal Performance', 'Track sales, views, and conversion metrics', 'review', 'medium', 'stage-won', 'substage-won-live', TRUE, FALSE, 'sales_rep', 24, 1),
  ('task-tpl-check-merchant', 'Check in with Merchant', 'Ensure merchant is handling redemptions smoothly', 'review', 'medium', 'stage-won', 'substage-won-live', TRUE, FALSE, 'sales_rep', 168, 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically create tasks when a deal enters a stage
CREATE OR REPLACE FUNCTION auto_create_tasks_on_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  template RECORD;
  new_task_id TEXT;
BEGIN
  -- Check if stage or substage changed
  IF (TG_OP = 'UPDATE' AND (
    NEW.campaign_stage != OLD.campaign_stage OR 
    NEW.draft_sub_stage != OLD.draft_sub_stage OR
    NEW.won_sub_stage != OLD.won_sub_stage
  )) OR TG_OP = 'INSERT' THEN
    
    -- Find matching task templates for the new stage/substage
    FOR template IN 
      SELECT * FROM task_templates tt
      WHERE tt.is_active = TRUE
        AND tt.trigger_on_enter = TRUE
        AND (
          -- Match on main stage only
          (tt.trigger_stage_id = 'stage-' || NEW.campaign_stage AND tt.trigger_substage_id IS NULL)
          OR
          -- Match on substage
          (NEW.campaign_stage = 'draft' AND tt.trigger_substage_id = 'substage-draft-' || NEW.draft_sub_stage)
          OR
          (NEW.campaign_stage = 'won' AND tt.trigger_substage_id = 'substage-won-' || NEW.won_sub_stage)
        )
    LOOP
      -- Generate new task ID
      new_task_id := 'task-' || NEW.id || '-' || template.id || '-' || extract(epoch from now())::text;
      
      -- Create task from template
      INSERT INTO deal_tasks (
        id,
        deal_id,
        template_id,
        title,
        description,
        category,
        priority,
        assigned_to_role,
        due_at,
        checklist_items,
        triggered_by_stage,
        triggered_by_substage
      ) VALUES (
        new_task_id,
        NEW.id,
        template.id,
        template.title,
        template.description,
        template.category,
        template.priority,
        template.auto_assign_to_role,
        CASE 
          WHEN template.due_after_hours IS NOT NULL 
          THEN NOW() + (template.due_after_hours || ' hours')::INTERVAL
          ELSE NULL
        END,
        template.checklist_items,
        NEW.campaign_stage,
        COALESCE(NEW.draft_sub_stage, NEW.won_sub_stage, NEW.lost_sub_stage)
      );
      
      -- Log task creation
      INSERT INTO task_activity_log (
        id,
        task_id,
        action,
        actor_name,
        details
      ) VALUES (
        'activity-' || new_task_id || '-created',
        new_task_id,
        'created',
        'System',
        jsonb_build_object('trigger', 'stage_change', 'template_id', template.id)
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create tasks on deal stage changes
CREATE TRIGGER trigger_auto_create_tasks
  AFTER INSERT OR UPDATE OF campaign_stage, draft_sub_stage, won_sub_stage, lost_sub_stage
  ON deals
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_tasks_on_stage_change();

-- Function to get next substage in sequence
CREATE OR REPLACE FUNCTION get_next_substage(current_stage_id TEXT, current_substage_id TEXT)
RETURNS TABLE (next_substage_id TEXT, next_substage_name TEXT, next_substage_display_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT id, name, display_name
  FROM campaign_substage_config
  WHERE stage_id = current_stage_id
    AND sort_order > (
      SELECT sort_order FROM campaign_substage_config WHERE id = current_substage_id
    )
  ORDER BY sort_order ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
















