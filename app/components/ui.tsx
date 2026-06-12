"use client";

import React from "react";
import { MetricDef } from "../lib/types";
import { formatCurrency, formatInt, formatNumber, formatPercent } from "../lib/format";
import { Sparkline } from "./charts";

export function formatMetric(value: number, kind: MetricDef["kind"], compact = false): string {
  if (kind === "currency") return formatCurrency(value, compact);
  if (kind === "percent") return formatPercent(value);
  return compact ? formatNumber(value) : formatInt(value);
}

export function Card({
  children,
  className = "",
  title,
  subtitle,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-white shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5">
          <div>
            {title && <h3 className="text-sm font-semibold text-[var(--ink)]">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-[var(--muted)]">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  accent = "#3FA9C9",
  icon,
  dense = false,
  spark,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
  icon?: React.ReactNode;
  dense?: boolean;
  spark?: number[];
}) {
  const showSpark = spark && spark.length > 1;
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <span
        className="absolute left-0 top-0 h-full w-1"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="flex items-center justify-between">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
        {icon}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p
          className={`font-bold leading-tight tabular-nums text-[var(--ink)] ${
            dense ? "text-lg sm:text-xl" : "text-2xl sm:text-[1.7rem]"
          }`}
        >
          {value}
        </p>
        {showSpark && (
          <div className="shrink-0 pb-0.5">
            <Sparkline values={spark!} color={accent} width={dense ? 60 : 84} height={26} />
          </div>
        )}
      </div>
      {hint && <p className="mt-1 truncate text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

/** Card de KPI agrupado: número principal + custos/taxas relacionados dentro */
export function StatCard({
  label,
  value,
  accent = "#3FA9C9",
  spark,
  subs = [],
}: {
  label: string;
  value: string;
  accent?: string;
  spark?: number[];
  subs?: { label: string; value: string }[];
}) {
  const showSpark = spark && spark.length > 1;
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <span className="absolute left-0 top-0 h-full w-1" style={{ background: accent }} aria-hidden />
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-2xl font-bold leading-tight tabular-nums text-[var(--ink)] sm:text-[1.6rem]">{value}</p>
        {showSpark && (
          <div className="shrink-0 pb-0.5">
            <Sparkline values={spark!} color={accent} width={70} height={26} />
          </div>
        )}
      </div>
      {subs.length > 0 && (
        <div className="mt-3 flex gap-4 border-t border-[var(--border)] pt-2.5">
          {subs.map((s) => (
            <div key={s.label} className="min-w-0">
              <p className="truncate text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">{s.label}</p>
              <p className="truncate text-sm font-bold tabular-nums text-[var(--ink)]">{s.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Badge({
  children,
  color = "#5B6770",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: `${color}1a`, color }}
    >
      {children}
    </span>
  );
}

export function ButtonGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T; color?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? "text-white shadow-sm"
                : "bg-white text-[var(--muted)] hover:bg-gray-50 border border-[var(--border)]"
            }`}
            style={active ? { background: o.color ?? "#1a1d21" } : undefined}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Select<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
      {label && <span className="whitespace-nowrap">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink)] outline-none focus:border-[#3FA9C9]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-[var(--ink)] sm:text-xl">{children}</h2>
      {sub && <p className="mt-0.5 text-sm text-[var(--muted)]">{sub}</p>}
    </div>
  );
}

/** Caixa de análise descritiva (insights de texto) */
export function AnalysisBox({
  title,
  accent = "#3FA9C9",
  children,
  className = "",
}: {
  title: string;
  accent?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5 ${className}`}
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div className="mb-3 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.2">
          <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z" />
        </svg>
        <h3 className="text-sm font-bold text-[var(--ink)]">{title}</h3>
      </div>
      <div className="space-y-2.5 text-sm text-[var(--ink)]">{children}</div>
    </div>
  );
}

/** Linha de insight: rótulo + valor destacado */
export function Insight({
  label,
  value,
  color = "#1a1d21",
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="text-right font-bold tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

/** Número grande de destaque (cabeçalho de páginas) */
export function BigStat({
  label,
  value,
  sub,
  accent = "#3FA9C9",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5">
      <span className="absolute left-0 top-0 h-full w-1" style={{ background: accent }} aria-hidden />
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-3xl font-extrabold leading-none tabular-nums text-[var(--ink)] sm:text-4xl">
        {value}
      </p>
      {sub && <p className="mt-1.5 text-xs text-[var(--muted)]">{sub}</p>}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-white text-sm text-[var(--muted)]">
      {message}
    </div>
  );
}
