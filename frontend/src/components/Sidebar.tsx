import { useEffect, useState } from "react";

import { NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  ShieldAlert,
  History,
  BarChart3,
  UploadCloud,
  Settings,
  Radar,
  ShieldCheck,
  LogOut,
  UserCircle,
  Menu,
  X,
} from "lucide-react";

import type { NavItem } from "../types/nav";

import { getMe } from "../services/auth";

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Predição", path: "/predict", icon: ShieldAlert },
  { label: "Histórico", path: "/history", icon: History },
  { label: "Estatísticas", path: "/statistics", icon: BarChart3 },
  { label: "Upload CSV", path: "/batch", icon: UploadCloud },
  { label: "Configurações", path: "/settings", icon: Settings },
  { label: "Minha conta", path: "/account", icon: UserCircle },
];

export function Sidebar() {
  const [isAdmin, setIsAdmin] = useState(false);

  const [username, setUsername] = useState("");

  const [showLogoutConfirm, setShowLogoutConfirm] =
    useState(false);

  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getMe();

        setIsAdmin(user.role === "admin");

        setUsername(user.username);
      } catch {
        setIsAdmin(false);

        setUsername("");
      }
    }

    loadUser();
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");

    setShowLogoutConfirm(false);

    setShowMobileMenu(false);

    navigate("/login");
  }

  function closeMobileMenu() {
    setShowMobileMenu(false);
  }

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center border-b border-border bg-surface px-3 md:hidden">
        <button
          type="button"
          onClick={() => setShowMobileMenu(true)}
          className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-surface-hover hover:text-gray-200"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>

        <div className="ml-2 flex min-w-0 items-center gap-2">
          <Radar
            className="shrink-0 text-primary"
            size={21}
          />

          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold leading-tight text-gray-100">
              ML Network IDS
            </h1>

            <p className="truncate text-[10px] text-gray-500">
              Detecção de Intrusão
            </p>
          </div>
        </div>

        {username && (
          <div className="ml-auto shrink-0 text-right">
            <p className="text-xs text-gray-300">
              Olá,{" "}
              <span className="font-semibold text-gray-100">
                {username}
              </span>
            </p>
          </div>
        )}
      </div>

      {showMobileMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 md:static md:translate-x-0 ${
          showMobileMenu
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-2">
            <Radar
              className="text-primary"
              size={24}
            />

            <div>
              <h1 className="text-sm font-bold leading-tight text-gray-100">
                ML Network IDS
              </h1>

              <p className="text-xs text-gray-500">
                Detecção de Intrusão
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeMobileMenu}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-surface-hover hover:text-gray-200 md:hidden"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map(
            ({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/"}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-400 hover:bg-surface-hover hover:text-gray-200"
                  }`
                }
              >
                <Icon size={18} />

                {label}
              </NavLink>
            )
          )}

          {isAdmin && (
            <>
              <div className="my-4 border-t border-border" />

              <NavLink
                to="/users"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-400 hover:bg-surface-hover hover:text-gray-200"
                  }`
                }
              >
                <ShieldCheck size={18} />

                Área do Administrador
              </NavLink>
            </>
          )}
        </nav>

        <div className="border-t border-border px-3 py-3">
            <p className="px-3 pt-3 text-xs text-gray-600">
            TCC — UNIFAJ · 2026
          </p>
        </div>
      </aside>
    </>
  );
}