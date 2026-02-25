import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle2, Clock, AlertCircle, Plus, Calendar, Phone, Mail, MessageSquare, Users, Video } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Reminder {
  id: string;
  lead_id: string;
  title: string | null;
  note: string | null;
  reminder_date: string;
  reminder_time: string | null;
  type: string;
  priority: string;
  status: string;
  created_at: string;
  leads?: { name: string; phone: string | null; email: string | null } | null;
}

const typeIcons: Record<string, React.ReactNode> = {
  call: <Phone className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  whatsapp: <MessageSquare className="w-4 h-4" />,
  follow_up: <Users className="w-4 h-4" />,
  meeting: <Video className="w-4 h-4" />,
};

const priorityColors: Record<string, string> = {
  high: "bg-destructive/15 text-destructive",
  medium: "bg-warning/15 text-warning-foreground",
  low: "bg-muted text-muted-foreground",
};

export default function Reminders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filter, setFilter] = useState<"all" | "today" | "upcoming" | "overdue">("today");
  const [leads, setLeads] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    lead_id: "",
    title: "",
    note: "",
    reminder_date: format(new Date(), "yyyy-MM-dd"),
    reminder_time: "10:00",
    type: "call",
    priority: "medium",
  });

  useEffect(() => {
    if (user) {
      loadReminders();
      loadLeads();
    }
  }, [user, filter]);

  const loadLeads = async () => {
    const { data } = await supabase.from("leads").select("id, name").order("name");
    setLeads(data || []);
  };

  const loadReminders = async () => {
    let query = supabase
      .from("reminders")
      .select("*, leads(name, phone, email)")
      .eq("status", "pending")
      .order("reminder_date");

    const today = new Date().toISOString().split("T")[0];
    if (filter === "today") query = query.eq("reminder_date", today);
    else if (filter === "overdue") query = query.lt("reminder_date", today);
    else if (filter === "upcoming") query = query.gt("reminder_date", today);

    const { data } = await query;
    setReminders((data as Reminder[]) || []);
  };

  const complete = async (id: string) => {
    await supabase.from("reminders").update({ status: "completed" as any }).eq("id", id);
    toast.success("Reminder completed ✅");
    loadReminders();
  };

  const createReminder = async () => {
    if (!form.lead_id || !form.reminder_date) {
      toast.error("Please select a lead and date");
      return;
    }
    const { error } = await supabase.from("reminders").insert({
      user_id: user!.id,
      lead_id: form.lead_id,
      title: form.title || null,
      note: form.note || null,
      reminder_date: form.reminder_date,
      reminder_time: form.reminder_time || null,
      type: form.type as any,
      priority: form.priority,
    } as any);
    if (error) {
      toast.error("Failed to create reminder");
      return;
    }
    toast.success("Reminder created! 🔔");
    setDialogOpen(false);
    setForm({ lead_id: "", title: "", note: "", reminder_date: format(new Date(), "yyyy-MM-dd"), reminder_time: "10:00", type: "call", priority: "medium" });
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reminders</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> New Reminder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Reminder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Lead *</Label>
                <Select value={form.lead_id} onValueChange={(v) => setForm({ ...form, lead_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select lead" /></SelectTrigger>
                  <SelectContent>
                    {leads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Call Rahul" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date *</Label>
                  <Input type="date" value={form.reminder_date} onChange={(e) => setForm({ ...form, reminder_date: e.target.value })} />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input type="time" value={form.reminder_time} onChange={(e) => setForm({ ...form, reminder_time: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">📞 Call</SelectItem>
                      <SelectItem value="email">📧 Email</SelectItem>
                      <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                      <SelectItem value="follow_up">👥 Follow-up</SelectItem>
                      <SelectItem value="meeting">🎥 Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">🔴 High</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="low">🟢 Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Extra info..." />
              </div>
              <Button onClick={createReminder} className="w-full">Create Reminder</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => navigate(`/leads/${r.lead_id}`)}>
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    {typeIcons[r.type] || <Clock className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{r.title || lead?.name || "Reminder"}</p>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">{r.type.replace("_", " ")}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${priorityColors[r.priority] || ""}`}>
                        {r.priority}
                      </span>
                      {isOverdue && <span className="text-xs bg-destructive/15 text-destructive px-2 py-0.5 rounded-full">Overdue</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{lead?.name}{r.note ? ` — ${r.note}` : ""}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {r.reminder_date}
                      </span>
                      {r.reminder_time && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {r.reminder_time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-success flex-shrink-0" onClick={() => complete(r.id)}>
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
