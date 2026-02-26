
-- Add new pipeline stages to lead_status enum
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'interested' AFTER 'contacted';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'follow_up' AFTER 'interested';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'proposal_sent' AFTER 'proposal';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'negotiation' AFTER 'proposal_sent';
