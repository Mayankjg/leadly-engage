import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Phone, Mail, MessageSquare, Users, Video } from "lucide-react";

const typeEmojis: Record<string, string> = {
  call: "📞",
  email: "📧",
  whatsapp: "💬",
  follow_up: "👥",
  meeting: "🎥",
};

export function useReminderNotifier() {
  const { user } = useAuth();
  const checkedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const checkDueReminders = async () => {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM

      const { data: dueReminders } = await supabase
        .from("reminders")
        .select("*, leads(name)")
        .eq("status", "pending")
        .eq("notified", false)
        .eq("reminder_date", today)
        .lte("reminder_time", currentTime);

      if (!dueReminders || dueReminders.length === 0) return;

      for (const r of dueReminders) {
        if (checkedIds.current.has(r.id)) continue;
        checkedIds.current.add(r.id);

        const leadName = (r.leads as any)?.name || "Unknown";
        const typeLabel = (r.type || "follow_up").replace("_", " ");
        const emoji = typeEmojis[r.type] || "🔔";

        // Show popup toast
        toast(`${emoji} ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} Reminder`, {
          description: `${leadName}${r.title ? " — " + r.title : ""}${r.note ? "\n" + r.note : ""}`,
          duration: 10000,
          action: {
            label: "View Lead",
            onClick: () => {
              window.location.href = `/leads/${r.lead_id}`;
            },
          },
        });

        // Insert notification record
        await supabase.from("notifications").insert({
          user_id: user.id,
          title: `${emoji} ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} Reminder Due`,
          message: `${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} with ${leadName}${r.title ? " — " + r.title : ""}`,
          type: "reminder_due",
          related_reminder_id: r.id,
          related_lead_id: r.lead_id,
        } as any);

        // Mark as notified
        await supabase
          .from("reminders")
          .update({ notified: true } as any)
          .eq("id", r.id);
      }
    };

    // Check immediately and then every 30 seconds
    checkDueReminders();
    const interval = setInterval(checkDueReminders, 30000);

    return () => clearInterval(interval);
  }, [user]);
}
