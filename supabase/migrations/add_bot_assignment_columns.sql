-- Migration: Add bot assignment and configuration columns to workflow_tasks
-- Date: 2024-12-03

-- Add new columns for bot assignment
ALTER TABLE workflow_tasks 
  ADD COLUMN IF NOT EXISTS assigned_bot TEXT,  -- Bot ID (mutually exclusive with assigned_roles)
  ADD COLUMN IF NOT EXISTS bot_approval_mode TEXT CHECK (bot_approval_mode IN ('turbo', 'normal', 'manual')),  -- Bot approval mode
  ADD COLUMN IF NOT EXISTS bot_escalation_role TEXT,  -- Who handles escalated cases
  ADD COLUMN IF NOT EXISTS bot_review_role TEXT;  -- Who reviews bot's completed work

-- Add comment to explain the columns
COMMENT ON COLUMN workflow_tasks.assigned_bot IS 'AI bot assigned to this task (mutually exclusive with assigned_roles)';
COMMENT ON COLUMN workflow_tasks.bot_approval_mode IS 'Bot approval mode: turbo (fully automated), normal (escalate uncertain), manual (always require approval)';
COMMENT ON COLUMN workflow_tasks.bot_escalation_role IS 'Role that receives escalated cases when bot is uncertain';
COMMENT ON COLUMN workflow_tasks.bot_review_role IS 'Optional role that reviews bot completed work periodically';














