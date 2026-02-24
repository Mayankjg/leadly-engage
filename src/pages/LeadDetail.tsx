import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Phone, Mail, MessageCircle, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["new", "contacted", "qualified", "proposal", "won", "lost"];

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<any>(null);
  const [reminders, setReminders] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (id) loadLead();
  }, [id]);

  const loadLead = async () => {
    const [leadRes, remRes, actRes] = await Promise.all([
      supabase.from("leads").select("*").eq("id", id).single(),
      supabase.from("reminders").select("*").eq("lead_id", id).order("reminder_date"),
      supabase.from("activities").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
    ]);
    setLead(leadRes.data);
    setReminders(remRes.data || []);
    setActivities(actRes.data || []);
  };

  const updateStatus = async (status: string) => {
    await supabase.from("leads").update({ status: status as any }).eq("id", id);
    toast.success(`Status updated to ${status}`);
    loadLead();
  };

  const completeReminder = async (remId: string) => {
    await supabase.from("reminders").update({ status: "completed" as any }).eq("id", remId);
    toast.success("Reminder completed");
    loadLead();
  };

  const logActivity = async (type: string, description: string) => {
    if (!lead) return;
    await supabase.from("activities").insert({
      user_id: lead.user_id,
      lead_id: lead.id,
      type,
      description,
    });
    toast.success("Activity logged");
    loadLead();
  };

  if (!lead) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate("/leads")} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Leads
      </Button>

      {/* Header */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">{lead.name}</h1>
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              {lead.email && <span>{lead.email}</span>}
              {lead.phone && <span>{lead.phone}</span>}
            </div>
            <div className="flex gap-2 mt-3">
              <LeadStatusBadge status={lead.status} />
              <span className="text-xs bg-muted px-2.5 py-0.5 rounded-full capitalize">{lead.source}</span>
            </div>
            {lead.interest && <p className="mt-3 text-sm"><strong>Interest:</strong> {lead.interest}</p>}
            {lead.notes && <p className="mt-1 text-sm text-muted-foreground">{lead.notes}</p>}
          </div>
          <div className="flex gap-2">
            <Select value={lead.status} onValueChange={updateStatus}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          {lead.phone && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => { window.open(`tel:${lead.phone}`); logActivity("call", `Called ${lead.name}`); }}>
              <Phone className="w-3.5 h-3.5" /> Call
            </Button>
          )}
          {lead.email && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => { window.open(`mailto:${lead.email}`); logActivity("email", `Emailed ${lead.name}`); }}>
              <Mail className="w-3.5 h-3.5" /> Email
            </Button>
          )}
          {lead.phone && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => { window.open(`https://wa.me/${lead.phone}`); logActivity("whatsapp", `WhatsApp message to ${lead.name}`); }}>
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Reminders */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-warning" /> Reminders
          </h3>
          <div className="space-y-2">
            {reminders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reminders</p>
            ) : (
              reminders.map((r) => (
                <div key={r.id} className={`flex items-center justify-between p-3 rounded-lg border ${r.status === "completed" ? "bg-muted/50 opacity-60" : "bg-card"}`}>
                  <div>
                    <p className="text-sm font-medium capitalize">{r.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{r.reminder_date} · {r.note}</p>
                  </div>
                  {r.status !== "completed" && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => completeReminder(r.id)}>
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3">Activity Timeline</h3>
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activities yet</p>
            ) : (
              activities.map((a) => (
                <div key={a.id} className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium capitalize">{a.type}</p>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
