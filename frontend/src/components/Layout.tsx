import { Outlet } from "react-router-dom";

import { Sidebar } from "./Sidebar";

export function Layout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="min-w-0 flex-1 overflow-y-auto pt-16 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}