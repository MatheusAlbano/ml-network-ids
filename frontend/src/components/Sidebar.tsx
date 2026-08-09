import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldAlert,
  History,
  BarChart3,
  UploadCloud,
  Settings,
  Radar,
} from "lucide-react";
import type { NavItem } from "../types/nav";

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Predição", path: "/predict", icon: ShieldAlert },
  { label: "Histórico", path: "/history", icon: History },
  { label: "Estatísticas", path: "/statistics", icon: BarChart3 },
  { label: "Upload CSV", path: "/batch", icon: UploadCloud },
  { label: "Configurações", path: "/settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-surface border-r border-border flex flex-col">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <Radar className="text-primary" size={24} />
        <div>
          <h1 className="text-sm font-bold text-gray-100 leading-tight">
            ML Network IDS
          </h1>
          <p className="text-xs text-gray-500">Detecção de Intrusão</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-400 hover:bg-surface-hover hover:text-gray-200"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-border">
        <p className="text-xs text-gray-600">TCC — UNIFAJ · 2026</p>
      </div>
    </aside>
  );
}