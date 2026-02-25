-- Add notified column to track which reminders have already shown popup
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS notified boolean NOT NULL DEFAULT false;

-- Update notify_new_lead to include better message
CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, related_lead_id)
  VALUES (
    NEW.user_id,
    '🆕 New Lead Added',
    'New lead "' || NEW.name || '" added from ' || NEW.source || '. Follow up soon!',
    'lead_created',
    NEW.id
  );
  RETURN NEW;
END;
$function$;

-- Update notify_reminder_completed for better message with type
CREATE OR REPLACE FUNCTION public.notify_reminder_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'completed' THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_reminder_id, related_lead_id)
    VALUES (
      NEW.user_id,
      '✅ Reminder Completed',
      INITCAP(REPLACE(NEW.type::text, '_', ' ')) || ' reminder "' || COALESCE(NEW.title, NEW.note, 'Untitled') || '" completed',
      'reminder_completed',
      NEW.id,
      NEW.lead_id
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Recreate triggers
DROP TRIGGER IF EXISTS on_lead_created ON public.leads;
CREATE TRIGGER on_lead_created
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_lead();

DROP TRIGGER IF EXISTS on_reminder_completed ON public.reminders;
CREATE TRIGGER on_reminder_completed
  AFTER UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.notify_reminder_completed();