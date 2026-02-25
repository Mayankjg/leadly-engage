import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/StatCard";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import { Users, TrendingUp, Phone, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

const PIE_COLORS = [
  "hsl(200,80%,50%)",
  "hsl(38,92%,55%)",
  "hsl(280,60%,55%)",
  "hsl(200,80%,40%)",
  "hsl(152,60%,42%)",
  "hsl(0,72%,55%)",
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, won: 0, remindersToday: 0, activities: 0 });
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    const [leadsRes, remindersRes, activitiesRes] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("reminders").select("*").eq("reminder_date", new Date().toISOString().split("T")[0]).eq("status", "pending"),
      supabase.from("activities").select("id"),
    ]);

    const leads = leadsRes.data || [];
    const todayReminders = remindersRes.data || [];
    const activities = activitiesRes.data || [];

    setStats({
      total: leads.length,
      won: leads.filter((l) => l.status === "won").length,
      remindersToday: todayReminders.length,
      activities: activities.length,
    });

    setRecentLeads(leads.slice(0, 5));

    // Status distribution
    const statusCounts: Record<string, number> = {};
    leads.forEach((l) => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });
    setStatusData(
      Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
    );

    // Monthly data (last 6 months mock based on leads)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    setMonthlyData(
      months.map((m, i) => ({
        name: m,
        leads: Math.max(1, Math.floor(leads.length * (0.3 + Math.random() * 0.7) / (i + 1))),
        conversions: Math.max(0, Math.floor(leads.length * 0.15 * Math.random())),
      }))
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back! Here's your CRM overview.</p>
        </div>
        <NotificationBell />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Leads" value={stats.total} change="+12% this month" changeType="positive" icon={Users} />
        <StatCard title="Won Deals" value={stats.won} change="+5% this month" changeType="positive" icon={TrendingUp} iconColor="bg-success/10 text-success" />
        <StatCard title="Today's Reminders" value={stats.remindersToday} icon={Bell} iconColor="bg-warning/10 text-warning" />
        <StatCard title="Activities" value={stats.activities} icon={Phone} iconColor="bg-info/10 text-info" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Lead Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(200,80%,50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(200,80%,50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(220,10%,50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220,10%,50%)" />
              <Tooltip />
              <Area type="monotone" dataKey="leads" stroke="hsl(200,80%,50%)" fill="url(#leadGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="conversions" stroke="hsl(152,60%,42%)" fill="hsl(152,60%,42%)" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Lead Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Recent Leads</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate("/leads")}>
            View all
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-muted-foreground">Name</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Email</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Interest</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Source</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No leads yet. Add your first lead!
                  </td>
                </tr>
              ) : (
                recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/leads/${lead.id}`)}>
                    <td className="py-3 font-medium">{lead.name}</td>
                    <td className="py-3 text-muted-foreground">{lead.email || "—"}</td>
                    <td className="py-3 text-muted-foreground">{lead.interest || "—"}</td>
                    <td className="py-3 capitalize text-muted-foreground">{lead.source}</td>
                    <td className="py-3"><LeadStatusBadge status={lead.status} /></td>
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
