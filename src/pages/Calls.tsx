import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Phone, PhoneOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Calls() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    if (user) loadLeads();
  }, [user]);

  const loadLeads = async () => {
    const { data } = await supabase.from("leads").select("*").not("phone", "is", null).order("created_at", { ascending: false });
    setLeads(data || []);
  };

  const handleCall = async (lead: any) => {
    window.open(`tel:${lead.phone}`);
    await supabase.from("activities").insert({
      user_id: user!.id,
      lead_id: lead.id,
      type: "call",
      description: `Called ${lead.name} at ${lead.phone}`,
    });
    toast.success(`Call logged for ${lead.name}`);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calls</h1>
        <p className="text-muted-foreground text-sm">Click-to-call your leads</p>
      </div>

      <div className="space-y-2">
        {leads.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
            No leads with phone numbers yet
          </div>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{lead.name}</p>
                <p className="text-sm text-muted-foreground">{lead.phone}</p>
                {lead.interest && <p className="text-xs text-muted-foreground">{lead.interest}</p>}
              </div>
              <Button onClick={() => handleCall(lead)} className="gap-2">
                <Phone className="w-4 h-4" /> Call
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
