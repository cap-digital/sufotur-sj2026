"use client";

import React, { useMemo, useState } from "react";
import { shortDate, sumRows } from "../lib/data";
import { GOALS, Goal, CAMPAIGN_END } from "../lib/goals";
import { MetricKey, PLATFORM_COLORS, Platform, Row } from "../lib/types";
import { formatCurrency, formatInt, formatPercent } from "../lib/format";
import { ButtonGroup, Card, EmptyState, Hero, SectionTitle, Select } from "../components/ui";

function dayOffset(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}

function fmtMetric(v: number, key: MetricKey): string {
  if (key === "investimento") return formatCurrency(v);
  if (key === "ctr") return formatPercent(v);
  return formatInt(v);
}

export function Goals({ rows }: { rows: Row[] }) {
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [estrategia, setEstrategia] = useState<string>("all");

  // metas visíveis conforme filtros
  const visibleGoals = useMemo(() => {
    return GOALS.filter(
      (g) =>
        (platform === "all" || g.plataforma === platform) &&
        (estrategia === "all" || g.estrategia === estrategia)
    );
  }, [platform, estrategia]);

  const strategyOptions = useMemo(() => {
    const scope = platform === "all" ? GOALS : GOALS.filter((g) => g.plataforma === platform);
    return Array.from(new Set(scope.map((g) => g.estrategia)));
  }, [platform]);

  // computa realizado para cada meta
  const computed = useMemo(() => {
    return visibleGoals.map((g) => {
      const matched = rows.filter((r) => r.plataforma === g.plataforma && r.estrategia === g.estrategia);
      const t = sumRows(matched);
      const realizedInvest = t.investimento;
      const realizedMetric = t[g.metricKey];
      const cappedInvest = Math.min(realizedInvest, g.investimento);
      const investPct = g.investimento > 0 ? Math.min((realizedInvest / g.investimento) * 100, 100) : 0;
      const metricPct = g.metricGoal > 0 ? (realizedMetric / g.metricGoal) * 100 : 0;
      return { g, realizedInvest, cappedInvest, investPct, realizedMetric, metricPct };
    });
  }, [visibleGoals, rows]);

  const totals = useMemo(() => {
    const goalInvest = computed.reduce((s, c) => s + c.g.investimento, 0);
    const realInvest = computed.reduce((s, c) => s + c.cappedInvest, 0);
    return { goalInvest, realInvest, pct: goalInvest > 0 ? (realInvest / goalInvest) * 100 : 0 };
  }, [computed]);

  // ----- Projeção de execução: previsão de entrega ao fim da campanha -----
  // Para cada meta visível: ritmo médio diário observado e onde a entrega deve
  // chegar até CAMPAIGN_END mantendo esse ritmo (projeção linear).
  const projections = useMemo<ProjItem[]>(() => {
    return computed.map((c) => {
      const g = c.g;
      const dates = Array.from(
        new Set(rows.filter((r) => r.plataforma === g.plataforma && r.estrategia === g.estrategia && r.data).map((r) => r.data.slice(0, 10)))
      ).sort();
      if (dates.length === 0) return { c, hasData: false };
      const first = dates[0];
      const last = dates[dates.length - 1];
      const daysActive = Math.max(1, dayOffset(first, last) + 1);
      const daysRemaining = Math.max(0, dayOffset(last, CAMPAIGN_END));
      const realizedPct = c.metricPct;
      const pacePerDay = realizedPct / daysActive; // pontos de % por dia
      const projectedPct = realizedPct + pacePerDay * daysRemaining;
      return { c, hasData: true, realizedPct, projectedPct, pacePerDay, daysRemaining, lastDate: last, willHit: projectedPct >= 100 };
    });
  }, [computed, rows]);

  // escala comum das barras (deixa espaço acima de 100% quando alguém ultrapassa)
  const projScaleMax = useMemo(() => {
    const maxProj = Math.max(100, ...projections.filter((p): p is ProjReady => p.hasData).map((p) => p.projectedPct));
    return Math.min(200, Math.max(120, Math.ceil(maxProj / 10) * 10));
  }, [projections]);

  const hasProjData = projections.some((p) => p.hasData);

  return (
    <div>
      <SectionTitle sub="Acompanhamento das metas contratadas por plataforma e estratégia" accent="#8BC53F">
        Metas
      </SectionTitle>

      {/* filtros */}
      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-white p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-semibold text-[var(--muted)] sm:inline">Plataforma</span>
          <ButtonGroup<Platform | "all">
            value={platform}
            onChange={(v) => {
              setPlatform(v);
              setEstrategia("all");
            }}
            options={[
              { label: "Todas", value: "all", color: "#1a1d21" },
              { label: "Meta", value: "Meta", color: "#3FA9C9" },
              { label: "Kwai", value: "Kwai", color: "#E8862B" },
            ]}
          />
        </div>
        <Select
          label="Estratégia"
          value={estrategia}
          onChange={setEstrategia}
          options={[{ label: "Todas", value: "all" }, ...strategyOptions.map((e) => ({ label: e, value: e }))]}
        />
      </div>

      {/* HERO — visão geral das metas */}
      <Hero
        gradient="from-[#9fd24f] via-[#79b22f] to-[#4e8a1e]"
        kpis={[
          { label: "Investimento contratado", value: formatCurrency(totals.goalInvest), sub: `${computed.length} meta(s)` },
          { label: "Investimento realizado", value: formatCurrency(totals.realInvest) },
          { label: "Execução do orçamento", value: formatPercent(totals.pct) },
          { label: "Metas ativas", value: formatInt(computed.length) },
        ]}
      />

      {/* cards de meta */}
      {computed.length === 0 ? (
        <EmptyState message="Nenhuma meta para os filtros selecionados." />
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {computed.map((c) => (
            <GoalCard key={`${c.g.plataforma}-${c.g.estrategia}`} c={c} />
          ))}
        </div>
      )}

      {/* Projeção de execução — previsão de entrega por estratégia */}
      <Card
        title="Projeção de execução"
        subtitle={`Onde cada estratégia está hoje (barra cheia) e onde deve chegar até ${shortDate(CAMPAIGN_END)} mantendo o ritmo atual (faixa clara). A marca vertical é a meta.`}
        className="mt-4"
        action={
          hasProjData && (
            <span className="rounded-full bg-[var(--bg)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">
              {projections.filter((p) => p.hasData && p.willHit).length}/{projections.filter((p) => p.hasData).length} no ritmo da meta
            </span>
          )
        }
      >
        {hasProjData ? (
          <div className="space-y-5">
            {projections.map((p) =>
              p.hasData ? <ProjectionRow key={`${p.c.g.plataforma}-${p.c.g.estrategia}`} p={p} scaleMax={projScaleMax} /> : null
            )}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-[#8BC53F]" />realizado hoje</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-[#8BC53F]/30" />projeção até {shortDate(CAMPAIGN_END)}</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-3 w-0.5 bg-[var(--ink)]/50" />meta (100%)</span>
              <span>Projeção linear pelo ritmo médio diário observado.</span>
            </div>
          </div>
        ) : (
          <EmptyState message="Sem dados para projetar ainda." />
        )}
      </Card>
    </div>
  );
}

/* ---------- Projeção: tipos + linha (bullet de previsão) ---------- */
type ProjReady = {
  c: { g: Goal; realizedMetric: number; metricPct: number };
  hasData: true;
  realizedPct: number;
  projectedPct: number;
  pacePerDay: number;
  daysRemaining: number;
  lastDate: string;
  willHit: boolean;
};
type ProjItem = ProjReady | { c: { g: Goal }; hasData: false };

function ProjectionRow({ p, scaleMax }: { p: ProjReady; scaleMax: number }) {
  const color = PLATFORM_COLORS[p.c.g.plataforma];
  const realizedW = Math.min(100, (p.realizedPct / scaleMax) * 100);
  const projW = Math.min(100, (p.projectedPct / scaleMax) * 100);
  const targetLeft = (100 / scaleMax) * 100;
  const statusColor = p.willHit ? "#16a34a" : "#d97706";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--ink)]">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
          <span className="truncate">{p.c.g.plataforma} · {p.c.g.estrategia}</span>
        </span>
        <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: `${statusColor}1a`, color: statusColor }}>
          {p.willHit ? "Tende a bater" : "Abaixo do ritmo"} · {formatPercent(p.projectedPct)}
        </span>
      </div>

      {/* bullet: faixa de projeção (clara) + realizado (cheio) + marca da meta */}
      <div className="relative h-4 w-full rounded-full bg-gray-100">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${projW}%`, background: `${color}40` }} aria-hidden />
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${realizedW}%`, background: color }} aria-hidden />
        <div className="absolute inset-y-[-3px] w-0.5 rounded bg-[var(--ink)]/55" style={{ left: `${targetLeft}%` }} aria-hidden />
      </div>

      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[var(--muted)]">
        <span>Realizado <strong className="tabular-nums text-[var(--ink)]">{formatPercent(p.realizedPct)}</strong></span>
        <span>Ritmo <strong className="tabular-nums text-[var(--ink)]">{formatPercent(p.pacePerDay)}/dia</strong></span>
        <span>Faltam <strong className="tabular-nums text-[var(--ink)]">{p.daysRemaining}</strong> dia{p.daysRemaining === 1 ? "" : "s"}</span>
        <span className="text-[var(--muted)]">{p.c.g.metricLabel}</span>
      </div>
    </div>
  );
}

function GoalCard({
  c,
}: {
  c: {
    g: Goal;
    realizedInvest: number;
    cappedInvest: number;
    investPct: number;
    realizedMetric: number;
    metricPct: number;
  };
}) {
  const color = PLATFORM_COLORS[c.g.plataforma];
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            {c.g.plataforma}
          </span>
          <h3 className="text-base font-bold text-[var(--ink)]">{c.g.estrategia}</h3>
        </div>
      </div>

      {/* Investimento realizado vs contratado */}
      <Progress
        label="Investimento"
        valueText={`${formatCurrency(c.cappedInvest)} / ${formatCurrency(c.g.investimento)}`}
        pct={c.investPct}
        displayPct={c.investPct}
        color={color}
      />

      {/* Métrica de entrega (pode passar de 100%) */}
      <div className="mt-4">
        <Progress
          label={c.g.metricLabel}
          valueText={`${fmtMetric(c.realizedMetric, c.g.metricKey)} / ${fmtMetric(c.g.metricGoal, c.g.metricKey)}`}
          pct={Math.min(c.metricPct, 100)}
          displayPct={c.metricPct}
          color="#8BC53F"
          allowOver
        />
      </div>
    </Card>
  );
}

function Progress({
  label,
  valueText,
  pct,
  displayPct,
  color,
  allowOver = false,
}: {
  label: string;
  valueText: string;
  pct: number; // largura da barra (0-100)
  displayPct: number; // % exibida (pode > 100 se allowOver)
  color: string;
  allowOver?: boolean;
}) {
  const reached = displayPct >= 100;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-[var(--ink)]">{label}</span>
        <span className="text-sm font-bold" style={{ color: reached ? "#16a34a" : color }}>
          {formatPercent(displayPct)}
          {reached && allowOver && " ✓"}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(pct, 1.5)}%`, background: reached ? "#16a34a" : color }}
        />
      </div>
      <p className="mt-1 text-xs text-[var(--muted)]">{valueText}</p>
    </div>
  );
}
