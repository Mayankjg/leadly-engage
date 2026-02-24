import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Reminders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "today" | "upcoming" | "overdue">("today");

  useEffect(() => {
    if (user) loadReminders();
  }, [user, filter]);

  const loadReminders = async () => {
    let query = supabase.from("reminders").select("*, leads(name, phone, email)").eq("status", "pending").order("reminder_date");

    const today = new Date().toISOString().split("T")[0];
    if (filter === "today") query = query.eq("reminder_date", today);
    else if (filter === "overdue") query = query.lt("reminder_date", today);
    else if (filter === "upcoming") query = query.gt("reminder_date", today);

    const { data } = await query;
    setReminders(data || []);
  };

  const complete = async (id: string) => {
    await supabase.from("reminders").update({ status: "completed" as any }).eq("id", id);
    toast.success("Reminder completed ✅");
    loadReminders();
  };

  const tabs = [
    { key: "today", label: "Today", icon: Clock },
    { key: "overdue", label: "Overdue", icon: AlertCircle },
    { key: "upcoming", label: "Upcoming", icon: Clock },
    { key: "all", label: "All", icon: Clock },
  ] as const;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold">Reminders</h1>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <Button
            key={t.key}
            variant={filter === t.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(t.key)}
            className="gap-2"
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {reminders.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
            No {filter} reminders 🎉
          </div>
        ) : (
          reminders.map((r) => {
            const lead = r.leads;
            const isOverdue = r.reminder_date < new Date().toISOString().split("T")[0];
            return (
              <div
                key={r.id}
                className={`glass-card rounded-xl p-4 flex items-center justify-between gap-4 ${isOverdue ? "border-destructive/30" : ""}`}
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => navigate(`/leads/${r.lead_id}`)}
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{lead?.name || "Unknown"}</p>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">{r.type.replace("_", " ")}</span>
                    {isOverdue && <span className="text-xs bg-destructive/15 text-destructive px-2 py-0.5 rounded-full">Overdue</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{r.note}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.reminder_date}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-success" onClick={() => complete(r.id)}>
                  <CheckCircle2 className="w-5 h-5" />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
