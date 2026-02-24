import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Phone, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const SOURCES = ["manual", "website", "facebook", "whatsapp", "excel", "api"];
const STATUSES = ["new", "contacted", "qualified", "proposal", "won", "lost"];

export default function Leads() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", interest: "", source: "manual" as string, notes: "" });

  useEffect(() => {
    if (user) loadLeads();
  }, [user]);

  const loadLeads = async () => {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setLeads(data || []);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");

    const { error } = await supabase.from("leads").insert({
      ...form,
      user_id: user!.id,
      source: form.source as any,
    });

    if (error) return toast.error(error.message);
    toast.success("Lead added! Reminders auto-created ✅");
    setForm({ name: "", email: "", phone: "", interest: "", source: "manual", notes: "" });
    setOpen(false);
    loadLeads();
  };

  const filtered = leads.filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.phone || "").includes(search);
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground text-sm">{leads.length} total leads</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Lead</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rahul Sharma" required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="rahul@gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Interest</Label>
                <Input value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} placeholder="Website Development" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes..." />
              </div>
              <Button type="submit" className="w-full">Add Lead</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads..." className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contact</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Interest</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Source</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No leads found</td></tr>
              ) : (
                filtered.map((lead) => (
                  <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => navigate(`/leads/${lead.id}`)}>
                    <td className="py-3 px-4 font-medium">{lead.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      <div className="space-y-0.5">
                        {lead.email && <div className="text-xs">{lead.email}</div>}
                        {lead.phone && <div className="text-xs">{lead.phone}</div>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{lead.interest || "—"}</td>
                    <td className="py-3 px-4 capitalize text-muted-foreground">{lead.source}</td>
                    <td className="py-3 px-4"><LeadStatusBadge status={lead.status} /></td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        {lead.phone && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(`tel:${lead.phone}`)}>
                            <Phone className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {lead.email && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(`mailto:${lead.email}`)}>
                            <Mail className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {lead.phone && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(`https://wa.me/${lead.phone}`)}>
                            <MessageCircle className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
