import { CRMSidebar } from "./CRMSidebar";
import { Outlet } from "react-router-dom";

export function CRMLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <CRMSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
