import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

export function StatCard({ title, value, change, changeType = "neutral", icon: Icon, iconColor }: StatCardProps) {
  return (
    <div className="glass-card rounded-xl p-5 animate-slide-up stat-glow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1 animate-count">{value}</p>
          {change && (
            <p
              className={`text-xs font-medium mt-1 ${
                changeType === "positive"
                  ? "text-success"
                  : changeType === "negative"
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {change}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${iconColor || "bg-primary/10 text-primary"}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
