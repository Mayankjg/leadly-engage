import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import { NotificationBell } from "@/components/NotificationBell";
import { Phone, Mail, MessageSquare, User, IndianRupee } from "lucide-react";

const PIPELINE_STAGES = [
  { key: "new", label: "New Lead", color: "hsl(200,80%,50%)", description: "Fresh leads from forms, ads, WhatsApp" },
  { key: "contacted", label: "Contacted", color: "hsl(38,92%,55%)", description: "Salesperson has reached out" },
  { key: "interested", label: "Interested", color: "hsl(170,60%,45%)", description: "Customer showed interest" },
  { key: "follow_up", label: "Follow-Up", color: "hsl(280,60%,55%)", description: "Awaiting customer decision" },
  { key: "proposal", label: "Proposal Sent", color: "hsl(200,80%,40%)", description: "Quotation/Proposal sent" },
  { key: "proposal_sent", label: "Proposal Sent (v2)", color: "hsl(210,70%,50%)", description: "Proposal delivered" },
  { key: "negotiation", label: "Negotiation", color: "hsl(30,80%,50%)", description: "Price discussion ongoing" },
  { key: "won", label: "Won", color: "hsl(152,60%,42%)", description: "Deal closed, payment done" },
  { key: "lost", label: "Lost", color: "hsl(0,72%,55%)", description: "Customer not interested" },
] as const;

// Simplified: only show main stages (skip duplicates)
const VISIBLE_STAGES = PIPELINE_STAGES.filter(s => s.key !== "proposal_sent");

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  source: string;
  interest: string | null;
  value: number | null;
  created_at: string;
};

export default function Pipeline() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadLeads();
  }, [user]);

  const loadLeads = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    setLeads(data || []);
    setLoading(false);
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
    setDraggingId(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    setDraggingId(null);

    if (!leadId) return;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus as any, updated_at: new Date().toISOString() })
      .eq("id", leadId);

    if (error) {
      // Revert on error
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: lead.status } : l))
      );
    }
  };

  const getLeadsByStatus = (status: string) =>
    leads.filter((l) => l.status === status);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-muted-foreground">Loading pipeline...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales Pipeline</h1>
          <p className="text-muted-foreground text-sm">
            Drag & drop leads between stages • {leads.length} total leads
          </p>
        </div>
        <NotificationBell />
      </div>

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 180px)" }}>
        {VISIBLE_STAGES.map((stage) => {
          const stageLeads = getLeadsByStatus(stage.key);
          return (
            <div
              key={stage.key}
              className="flex-shrink-0 w-[260px] flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key)}
            >
              {/* Column Header */}
              <div
                className="rounded-t-xl px-3 py-2.5 flex items-center justify-between"
                style={{ backgroundColor: stage.color + "18", borderBottom: `2px solid ${stage.color}` }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-sm font-semibold" style={{ color: stage.color }}>
                    {stage.label}
                  </span>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: stage.color + "20", color: stage.color }}
                >
                  {stageLeads.length}
                </span>
              </div>

              {/* Column Body */}
              <div className="flex-1 bg-muted/30 rounded-b-xl p-2 space-y-2 min-h-[200px] border border-border/50 border-t-0">
                {stageLeads.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-8 italic">
                    Drop leads here
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onDragEnd={() => setDraggingId(null)}
                      onClick={() => navigate(`/leads/${lead.id}`)}
                      className={`glass-card rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 ${
                        draggingId === lead.id ? "opacity-50 scale-95" : ""
                      }`}
                    >
                      {/* Lead Name */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-semibold truncate">{lead.name}</span>
                      </div>

                      {/* Interest */}
                      {lead.interest && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {lead.interest}
                        </p>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {lead.phone.slice(-4)}
                          </span>
                        )}
                        {lead.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                          </span>
                        )}
                        {lead.value && lead.value > 0 && (
                          <span className="flex items-center gap-0.5 font-medium text-success">
                            <IndianRupee className="w-3 h-3" />
                            {lead.value.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Source Badge */}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {lead.source}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
