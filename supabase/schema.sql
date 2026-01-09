-- Supabase Schema for Deals Database
-- Run this in your Supabase SQL Editor

-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  merchant TEXT NOT NULL,
  city TEXT NOT NULL,
  division TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  
  -- Campaign stages
  campaign_stage TEXT NOT NULL CHECK (campaign_stage IN ('draft', 'won', 'lost')),
  status TEXT NOT NULL,
  won_sub_stage TEXT CHECK (won_sub_stage IN ('scheduled', 'live', 'paused', 'sold_out', 'ended')),
  draft_sub_stage TEXT CHECK (draft_sub_stage IN ('prospecting', 'pre_qualification', 'presentation', 'appointment', 'proposal', 'needs_assessment', 'contract_sent', 'negotiation', 'contract_signed', 'approved')),
  lost_sub_stage TEXT CHECK (lost_sub_stage IN ('closed_lost')),
  
  -- AI Pre-qualification metadata (stored as JSONB for flexibility)
  ai_review_result JSONB,
  escalation_reason TEXT,
  
  -- Performance metrics
  revenue DECIMAL(12, 2) DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0,
  margin DECIMAL(5, 2) DEFAULT 0,
  
  -- Deal details
  deal_start DATE,
  deal_end DATE,
  quality TEXT CHECK (quality IN ('Ace', 'Good', 'Fair')),
  image_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_deals_campaign_stage ON deals(campaign_stage);
CREATE INDEX idx_deals_division ON deals(division);
CREATE INDEX idx_deals_category ON deals(category);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_quality ON deals(quality);
CREATE INDEX idx_deals_merchant ON deals(merchant);
CREATE INDEX idx_deals_revenue ON deals(revenue);
CREATE INDEX idx_deals_purchases ON deals(purchases);

-- Create full text search index
CREATE INDEX idx_deals_search ON deals USING gin(to_tsvector('english', title || ' ' || merchant || ' ' || location));

-- Enable Row Level Security (optional - adjust based on your needs)
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth setup)
CREATE POLICY "Allow all operations" ON deals
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for active deals
CREATE OR REPLACE VIEW active_deals AS
SELECT * FROM deals
WHERE campaign_stage IN ('draft', 'won')
ORDER BY created_at DESC;

-- Create view for performance summary
CREATE OR REPLACE VIEW deals_performance_summary AS
SELECT 
  division,
  category,
  campaign_stage,
  COUNT(*) as total_deals,
  SUM(revenue) as total_revenue,
  SUM(purchases) as total_purchases,
  SUM(views) as total_views,
  AVG(conversion_rate) as avg_conversion_rate,
  AVG(margin) as avg_margin
FROM deals
GROUP BY division, category, campaign_stage;

