import { CRMSidebar } from "./CRMSidebar";
import { Outlet } from "react-router-dom";
import { useReminderNotifier } from "@/hooks/useReminderNotifier";

export function CRMLayout() {
  useReminderNotifier();
  return (
    <div className="flex min-h-screen w-full bg-background">
      <CRMSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
