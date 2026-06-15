"use client";

import React from "react";

export interface NavItem {
  route: string;
  label: string;
  icon: React.ReactNode;
  color?: string;
}

export const NAV: NavItem[] = [
  { route: "overview", label: "Visão Geral", icon: <IconGrid />, color: "#3FA9C9" },
  { route: "meta", label: "Meta", icon: <IconDot />, color: "#3FA9C9" },
  { route: "kwai", label: "Kwai", icon: <IconDot />, color: "#E8862B" },
  { route: "criativos", label: "Criativos", icon: <IconImage />, color: "#E6308A" },
  { route: "metas", label: "Metas", icon: <IconTarget />, color: "#8BC53F" },
];

export function Sidebar({
  route,
  navigate,
  open,
  onClose,
  collapsed,
  onToggleCollapse,
  updatedAt,
  onLogout,
}: {
  route: string;
  navigate: (r: string) => void;
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  updatedAt?: string;
  onLogout?: () => void;
}) {
  return (
    <>
      {/* overlay mobile */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} aria-hidden />}

      <aside
        className={`fixed inset-y-3 left-3 z-40 flex flex-col rounded-2xl bg-white text-[var(--ink)] shadow-2xl ring-1 ring-black/5 transition-all duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-[120%]"
        } ${collapsed ? "w-[72px]" : "w-60"}`}
      >
        {/* faixa de cores Bahia no topo da sidebar */}
        <div className="flex h-1.5 w-full shrink-0 overflow-hidden rounded-t-2xl">
          {["#8BC53F", "#3FA9C9", "#E8862B", "#E6308A", "#E12B2B", "#F2C230"].map((c) => (
            <span key={c} className="flex-1" style={{ background: c }} />
          ))}
        </div>

        {/* botão de colapsar (desktop) */}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expandir menu" : "Colapsar menu"}
          className="absolute -right-3 top-8 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--ink)] shadow-md transition hover:bg-gray-50 lg:flex"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* header (logo leva à página inicial) */}
        <button
          onClick={() => {
            navigate("");
            onClose();
          }}
          title="Página inicial"
          className={`flex items-center gap-3 border-b border-[var(--border)] px-4 py-4 text-left transition hover:bg-gray-50 ${collapsed ? "justify-center px-0" : ""}`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/logosufotur.png" alt="SUFOTUR" className="h-7 w-7 object-contain" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-bold text-[var(--ink)]">SUFOTUR</p>
              <p className="text-[11px] text-[var(--muted)]">São João 2026</p>
            </div>
          )}
        </button>

        {/* nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const active = route === item.route;
            return (
              <button
                key={item.route}
                title={item.label}
                onClick={() => {
                  navigate(item.route);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  collapsed ? "justify-center px-0" : ""
                } ${active ? "font-semibold" : "text-[var(--muted)] hover:bg-gray-50 hover:text-[var(--ink)]"}`}
                style={active ? { background: `${item.color}1a`, color: item.color } : undefined}
              >
                <span style={{ color: active ? item.color : "currentColor" }}>{item.icon}</span>
                {!collapsed && item.label}
              </button>
            );
          })}
        </nav>

        {/* sair */}
        <button
          onClick={onLogout}
          title="Sair"
          className={`flex items-center gap-3 border-t border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--muted)] transition last:rounded-b-2xl hover:bg-red-50 hover:text-red-600 ${collapsed ? "justify-center px-0" : ""}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          {!collapsed && "Sair"}
        </button>

        {!collapsed && (
          <div className="border-t border-[var(--border)] px-5 py-4 text-[11px] text-[var(--muted)]">
            {updatedAt && (
              <p className="mb-2 flex items-center gap-1.5 text-[var(--ink)]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#8BC53F]" />
                Atualizado em {formatUpdatedAt(updatedAt)}
              </p>
            )}
            <p>Superintendência de</p>
            <p>Fomento ao Turismo</p>
            <p className="mt-2 text-[var(--muted)]/70">Governo da Bahia</p>
          </div>
        )}
      </aside>
    </>
  );
}

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconDot() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5" /></svg>
  );
}
function IconImage() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" />
    </svg>
  );
}
