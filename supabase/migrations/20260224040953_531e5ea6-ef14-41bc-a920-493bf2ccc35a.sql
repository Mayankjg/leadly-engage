
-- Lead sources enum
CREATE TYPE public.lead_source AS ENUM ('manual', 'website', 'facebook', 'whatsapp', 'excel', 'api');

-- Lead status enum
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost');

-- Reminder type enum
CREATE TYPE public.reminder_type AS ENUM ('call', 'email', 'whatsapp', 'follow_up', 'meeting');

-- Reminder status enum
CREATE TYPE public.reminder_status AS ENUM ('pending', 'completed', 'skipped');

-- Leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  interest TEXT,
  source lead_source NOT NULL DEFAULT 'manual',
  status lead_status NOT NULL DEFAULT 'new',
  value NUMERIC DEFAULT 0,
  notes TEXT,
  whatsapp_sent BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reminders table
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  reminder_date DATE NOT NULL,
  type reminder_type NOT NULL DEFAULT 'call',
  status reminder_status NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activities table (call logs, emails sent, etc.)
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
CREATE POLICY "Users can view own leads" ON public.leads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON public.leads FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own leads" ON public.leads FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for reminders
CREATE POLICY "Users can view own reminders" ON public.reminders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reminders" ON public.reminders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminders" ON public.reminders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reminders" ON public.reminders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for activities
CREATE POLICY "Users can view own activities" ON public.activities FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activities" ON public.activities FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for leads
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;

-- Auto-create reminders trigger
CREATE OR REPLACE FUNCTION public.auto_create_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Day 1 follow-up
  INSERT INTO public.reminders (user_id, lead_id, reminder_date, type, note)
  VALUES (NEW.user_id, NEW.id, (NEW.created_at::date + INTERVAL '1 day')::date, 'call', 'Day 1 follow-up call');
  
  -- Day 3 follow-up
  INSERT INTO public.reminders (user_id, lead_id, reminder_date, type, note)
  VALUES (NEW.user_id, NEW.id, (NEW.created_at::date + INTERVAL '3 days')::date, 'follow_up', 'Day 3 follow-up');
  
  -- Day 7 final follow-up
  INSERT INTO public.reminders (user_id, lead_id, reminder_date, type, note)
  VALUES (NEW.user_id, NEW.id, (NEW.created_at::date + INTERVAL '7 days')::date, 'follow_up', 'Final follow-up');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_lead_created_create_reminders
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_reminders();
