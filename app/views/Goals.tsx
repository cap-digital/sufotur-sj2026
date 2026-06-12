"use client";

import React, { useMemo, useState } from "react";
import { shortDate, sumRows } from "../lib/data";
import { GOALS, Goal } from "../lib/goals";
import { MetricKey, PLATFORM_COLORS, Platform, Row } from "../lib/types";
import { formatCurrency, formatInt, formatPercent } from "../lib/format";
import { ProjectionChart, ProjPoint } from "../components/charts";
import { ButtonGroup, Card, EmptyState, KpiCard, SectionTitle, Select } from "../components/ui";

const CAMPAIGN_END = "2026-06-30"; // encerramento previsto da campanha

function dayOffset(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}
function addDays(date: string, k: number): string {
  return new Date(Date.parse(date + "T00:00:00Z") + k * 86400000).toISOString().slice(0, 10);
}

function fmtMetric(v: number, key: MetricKey): string {
  if (key === "investimento") return formatCurrency(v);
  if (key === "ctr") return formatPercent(v);
  return formatInt(v);
}

export function Goals({ rows }: { rows: Row[] }) {
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [estrategia, setEstrategia] = useState<string>("all");
  const [projGoalKey, setProjGoalKey] = useState<string>(`${GOALS[0].plataforma}|${GOALS[0].estrategia}`);

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
      // Investimento: travado em 100% (nem % nem valor passam do contratado)
      const cappedInvest = Math.min(realizedInvest, g.investimento);
      const investPct = g.investimento > 0 ? Math.min((realizedInvest / g.investimento) * 100, 100) : 0;
      const metricPct = g.metricGoal > 0 ? (realizedMetric / g.metricGoal) * 100 : 0;
      return { g, realizedInvest, cappedInvest, investPct, realizedMetric, metricPct };
    });
  }, [visibleGoals, rows]);

  // totais (investimento travado)
  const totals = useMemo(() => {
    const goalInvest = computed.reduce((s, c) => s + c.g.investimento, 0);
    const realInvest = computed.reduce((s, c) => s + c.cappedInvest, 0);
    return { goalInvest, realInvest, pct: goalInvest > 0 ? (realInvest / goalInvest) * 100 : 0 };
  }, [computed]);

  // ----- Projeção: investimento + entrega da estratégia escolhida nos botões -----
  const selectedGoal = useMemo(
    () => GOALS.find((g) => `${g.plataforma}|${g.estrategia}` === projGoalKey) ?? GOALS[0],
    [projGoalKey]
  );

  const projection = useMemo<{ data: ProjPoint[]; willHit: boolean } | null>(() => {
    const g = selectedGoal;
    const gRows = rows.filter((r) => r.plataforma === g.plataforma && r.estrategia === g.estrategia && r.data);
    const dates = Array.from(new Set(gRows.map((r) => r.data.slice(0, 10)))).sort();
    if (dates.length === 0) return null;

    const series = dates.map((date) => {
      const tt = sumRows(gRows.filter((r) => r.data.slice(0, 10) <= date));
      return {
        date,
        invest: g.investimento > 0 ? Math.min(100, (tt.investimento / g.investimento) * 100) : 0,
        metric: g.metricGoal > 0 ? (tt[g.metricKey] / g.metricGoal) * 100 : 0,
      };
    });

    const first = series[0];
    const last = series[series.length - 1];
    const span = Math.max(1, dayOffset(first.date, last.date));
    const slopeI = (last.invest - first.invest) / span;
    const slopeM = (last.metric - first.metric) / span;

    const data: ProjPoint[] = series.map((p, i) => ({
      name: shortDate(p.date),
      invest: +p.invest.toFixed(2),
      metric: +p.metric.toFixed(2),
      investProj: i === series.length - 1 ? +p.invest.toFixed(2) : null,
      metricProj: i === series.length - 1 ? +p.metric.toFixed(2) : null,
    }));

    const totalDays = dayOffset(last.date, CAMPAIGN_END);
    let endInvest = last.invest;
    let endMetric = last.metric;
    for (let k = 2; k <= totalDays; k += 2) {
      endInvest = Math.min(100, last.invest + slopeI * k);
      endMetric = Math.max(0, last.metric + slopeM * k);
      data.push({ name: shortDate(addDays(last.date, k)), invest: null, metric: null, investProj: +endInvest.toFixed(2), metricProj: +endMetric.toFixed(2) });
    }
    return { data, willHit: endMetric >= 100 };
  }, [selectedGoal, rows]);

  return (
    <div>
      <SectionTitle sub="Acompanhamento das metas contratadas por plataforma e estratégia">
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
              { label: "YouTube", value: "Youtube", color: "#E12B2B" },
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

      {/* resumo */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="Investimento contratado" value={formatCurrency(totals.goalInvest)} accent="#5B6770" hint={`${computed.length} meta(s)`} />
        <KpiCard label="Investimento realizado" value={formatCurrency(totals.realInvest)} accent="#8BC53F" hint="Travado no contratado" />
        <KpiCard label="Execução do orçamento" value={formatPercent(totals.pct)} accent="#3FA9C9" />
      </div>

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

      {/* Projeção de execução (embaixo de tudo) */}
      <Card
        title="Projeção de execução"
        subtitle={`Investimento e entrega da estratégia escolhida como % da meta — tracejado projeta a tendência até ${shortDate(CAMPAIGN_END)}`}
        className="mt-4"
        action={
          projection && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${projection.willHit ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {projection.willHit ? "No ritmo de bater a meta" : "Abaixo do ritmo ideal"}
            </span>
          )
        }
      >
        <div className="mb-4">
          <ButtonGroup<string>
            value={projGoalKey}
            onChange={setProjGoalKey}
            options={GOALS.map((g) => ({
              label: `${g.plataforma === "Youtube" ? "YouTube" : g.plataforma} · ${g.estrategia}`,
              value: `${g.plataforma}|${g.estrategia}`,
              color: PLATFORM_COLORS[g.plataforma],
            }))}
          />
        </div>
        {projection ? (
          <>
            <ProjectionChart
              data={projection.data}
              series={[
                { key: "invest", label: "Investimento", color: "#3FA9C9" },
                { key: "metric", label: `Entrega · ${selectedGoal.metricLabel}`, color: "#8BC53F" },
              ]}
              height={340}
            />
            <p className="mt-2 text-xs text-[var(--muted)]">
              A linha contínua mostra o realizado acumulado de <strong>{selectedGoal.plataforma === "Youtube" ? "YouTube" : selectedGoal.plataforma} · {selectedGoal.estrategia}</strong>; a tracejada projeta o ritmo atual. O investimento é travado em 100%.
            </p>
          </>
        ) : (
          <EmptyState message="Sem dados para projetar esta estratégia ainda." />
        )}
      </Card>
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
            {c.g.plataforma === "Youtube" ? "YouTube" : c.g.plataforma}
          </span>
          <h3 className="text-base font-bold text-[var(--ink)]">{c.g.estrategia}</h3>
        </div>
      </div>

      {/* Investimento (travado em 100%) */}
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
