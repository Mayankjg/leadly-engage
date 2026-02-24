import { useAuth } from "@/hooks/useAuth";

export default function CRMSettings() {
  const { user } = useAuth();

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-semibold">Account</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-mono text-xs">{user?.id?.slice(0, 8)}...</span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-semibold">Automation Settings</h3>
        <p className="text-sm text-muted-foreground">
          WhatsApp and Email automations require API integrations (WhatsApp Business API, SMTP).
          Contact your admin to configure these integrations.
        </p>
      </div>
    </div>
  );
}
