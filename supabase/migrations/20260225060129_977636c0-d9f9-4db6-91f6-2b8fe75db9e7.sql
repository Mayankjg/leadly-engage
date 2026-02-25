
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  related_lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  related_reminder_id UUID REFERENCES public.reminders(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Add priority and reminder_time to reminders
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS reminder_time TIME;
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS title TEXT;

-- Create trigger function to auto-create notification when lead is created
CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, related_lead_id)
  VALUES (
    NEW.user_id,
    'New Lead Added',
    'New lead "' || NEW.name || '" added from ' || NEW.source,
    'lead_created',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_lead_created
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_lead();

-- Create trigger for reminder due notifications (when reminder status changes)
CREATE OR REPLACE FUNCTION public.notify_reminder_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'completed' THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_reminder_id, related_lead_id)
    VALUES (
      NEW.user_id,
      'Reminder Completed',
      'Reminder "' || COALESCE(NEW.title, NEW.note, 'Untitled') || '" completed',
      'reminder_completed',
      NEW.id,
      NEW.lead_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_reminder_completed
AFTER UPDATE ON public.reminders
FOR EACH ROW
EXECUTE FUNCTION public.notify_reminder_completed();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
