import { MessageCircle, Mail, Bell, Phone, CheckCircle2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const automations = [
  {
    title: "WhatsApp Auto-Message",
    description: "Automatically send WhatsApp welcome message when a new lead is added",
    icon: MessageCircle,
    status: "active",
    color: "bg-success/10 text-success",
    template: `Hi {name} 👋\nThank you for contacting ABC Company.\nOur team will contact you shortly.`,
  },
  {
    title: "Email Welcome",
    description: "Send welcome email with interest details to every new lead",
    icon: Mail,
    status: "active",
    color: "bg-info/10 text-info",
    template: `Hello {name},\n\nThank you for your interest in {interest}.\nOur expert will call you soon.\n\nRegards,\nABC Company`,
  },
  {
    title: "Auto Reminders",
    description: "Create follow-up reminders at Day 1, Day 3, and Day 7 automatically",
    icon: Bell,
    status: "active",
    color: "bg-warning/10 text-warning",
    template: "Day 1 → Call\nDay 3 → Follow-up\nDay 7 → Final Follow-up",
  },
  {
    title: "Auto Dialer",
    description: "Automatically call leads and connect to salesperson (requires Twilio API)",
    icon: Phone,
    status: "coming_soon",
    color: "bg-muted text-muted-foreground",
    template: "Connect → Record → Save Duration → Next Reminder",
  },
];

export default function Automations() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automations</h1>
          <p className="text-muted-foreground text-sm">Manage your automated workflows</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {automations.map((auto) => (
          <div key={auto.title} className="glass-card rounded-xl p-5 space-y-4 animate-slide-up">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${auto.color}`}>
                  <auto.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{auto.title}</h3>
                  <p className="text-xs text-muted-foreground">{auto.description}</p>
                </div>
              </div>
              {auto.status === "active" ? (
                <span className="flex items-center gap-1 text-xs text-success font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Coming Soon</span>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Template</p>
              <pre className="text-xs whitespace-pre-wrap font-mono">{auto.template}</pre>
            </div>

            <Button variant="outline" size="sm" className="gap-2" disabled={auto.status !== "active"}>
              <Settings className="w-3.5 h-3.5" /> Configure
            </Button>
          </div>
        ))}
      </div>

      {/* Flow Diagram */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">Automation Flow</h3>
        <div className="flex items-center justify-center gap-3 flex-wrap text-xs">
          {["Lead Added", "→", "WhatsApp Sent", "→", "Email Sent", "→", "Reminders Created", "→", "Follow-up Calls"].map(
            (step, i) =>
              step === "→" ? (
                <span key={i} className="text-muted-foreground text-lg">→</span>
              ) : (
                <div key={i} className="bg-primary/10 text-primary px-3 py-2 rounded-lg font-medium">
                  {step}
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
}
