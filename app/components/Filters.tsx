"use client";

import React, { useMemo } from "react";
import { Platform, Row } from "../lib/types";
import { shiftDate } from "../lib/data";
import { ButtonGroup, Select } from "./ui";

export interface FilterState {
  plataforma: Platform | "all";
  estrategia: string; // "all" ou nome
  from?: string; // yyyy-mm-dd (inclusive)
  to?: string; // yyyy-mm-dd (inclusive)
}

export const DEFAULT_FILTERS: FilterState = {
  plataforma: "all",
  estrategia: "all",
};

export function applyFilters(rows: Row[], f: FilterState): Row[] {
  return rows.filter((r) => {
    if (f.plataforma !== "all" && r.plataforma !== f.plataforma) return false;
    if (f.estrategia !== "all" && r.estrategia !== f.estrategia) return false;
    const day = r.data.slice(0, 10);
    if (f.from && day < f.from) return false;
    if (f.to && day > f.to) return false;
    return true;
  });
}

export function FilterBar({
  rows,
  filters,
  onChange,
  lockPlatform = false,
  period,
}: {
  rows: Row[];
  filters: FilterState;
  onChange: (f: FilterState) => void;
  lockPlatform?: boolean;
  period?: { min: string; max: string };
}) {
  // Estratégias disponíveis dado o filtro de plataforma
  const estrategias = useMemo(() => {
    const scope = filters.plataforma === "all" ? rows : rows.filter((r) => r.plataforma === filters.plataforma);
    return Array.from(new Set(scope.map((r) => r.estrategia))).sort();
  }, [rows, filters.plataforma]);

  const activePreset = useMemo(() => {
    if (!period) return "tudo";
    if (!filters.from && !filters.to) return "tudo";
    const max = period.max;
    if (filters.from === filters.to && filters.from === shiftDate(max, -1)) return "ontem";
    if (filters.to === max && filters.from === maxShift(period, 6)) return "7d";
    if (filters.to === max && filters.from === maxShift(period, 14)) return "15d";
    return "custom";
  }, [period, filters.from, filters.to]);

  function setPreset(p: string) {
    if (!period) return;
    const max = period.max;
    if (p === "tudo") onChange({ ...filters, from: undefined, to: undefined });
    else if (p === "ontem") {
      const y = shiftDate(max, -1);
      onChange({ ...filters, from: clamp(y, period), to: clamp(y, period) });
    } else if (p === "7d") onChange({ ...filters, from: maxShift(period, 6), to: max });
    else if (p === "15d") onChange({ ...filters, from: maxShift(period, 14), to: max });
  }

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm ring-1 ring-black/5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
      {period && (
        <>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-semibold text-[var(--muted)] sm:inline">Período</span>
            <ButtonGroup<string>
              value={activePreset === "custom" ? "" : activePreset}
              onChange={setPreset}
              options={[
                { label: "Tudo", value: "tudo", color: "#1a1d21" },
                { label: "Ontem", value: "ontem", color: "#1a1d21" },
                { label: "7 dias", value: "7d", color: "#1a1d21" },
                { label: "15 dias", value: "15d", color: "#1a1d21" },
              ]}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <DateInput label="De" value={filters.from ?? period.min} min={period.min} max={filters.to ?? period.max} onChange={(v) => onChange({ ...filters, from: v })} />
            <DateInput label="Até" value={filters.to ?? period.max} min={filters.from ?? period.min} max={period.max} onChange={(v) => onChange({ ...filters, to: v })} />
          </div>
        </>
      )}

      {!lockPlatform && (
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-semibold text-[var(--muted)] sm:inline">Plataforma</span>
          <ButtonGroup<Platform | "all">
            value={filters.plataforma}
            onChange={(v) => onChange({ ...filters, plataforma: v, estrategia: "all" })}
            options={[
              { label: "Todas", value: "all", color: "#1a1d21" },
              { label: "Meta", value: "Meta", color: "#3FA9C9" },
              { label: "Kwai", value: "Kwai", color: "#E8862B" },
            ]}
          />
        </div>
      )}

      <Select
        label="Estratégia"
        value={filters.estrategia}
        onChange={(v) => onChange({ ...filters, estrategia: v })}
        options={[{ label: "Todas", value: "all" }, ...estrategias.map((e) => ({ label: e, value: e }))]}
      />

      <button
        onClick={() => onChange({ ...DEFAULT_FILTERS, plataforma: lockPlatform ? filters.plataforma : "all" })}
        className="text-xs font-semibold text-[#3FA9C9] hover:underline sm:ml-auto"
      >
        Limpar filtros
      </button>
    </div>
  );
}

function DateInput({ label, value, min, max, onChange }: { label: string; value: string; min: string; max: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-1.5">
      <span>{label}</span>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink)] outline-none focus:border-[#3FA9C9]"
      />
    </label>
  );
}

function maxShift(period: { min: string; max: string }, days: number): string {
  return clamp(shiftDate(period.max, -days), period);
}
function clamp(d: string, period: { min: string; max: string }): string {
  if (d < period.min) return period.min;
  if (d > period.max) return period.max;
  return d;
}
