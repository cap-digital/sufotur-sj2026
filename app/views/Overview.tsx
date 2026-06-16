"use client";

import React, { useMemo, useState } from "react";
import {
  dailyTotals,
  dateBounds,
  derived,
  groupBy,
  pivotByDay,
  shortDate,
  sumRows,
  weekdayIndex,
  weekdayMatrix,
  WEEKDAYS,
} from "../lib/data";
import { BAHIA_PALETTE, MetricKey, PLATFORM_COLORS, Platform, Row } from "../lib/types";
import { formatCurrency, formatDecimal, formatInt, formatNumber, formatPercent } from "../lib/format";
import { applyFilters, DEFAULT_FILTERS, FilterBar, FilterState } from "../components/Filters";
import {
  DonutChart,
  GroupedBars,
  Heatmap,
  HorizontalBars,
  TimeSeries,
} from "../components/charts";
import { AnalysisBox, ButtonGroup, Card, Hero, Insight, SectionTitle, Select } from "../components/ui";
import { Column, DataTable } from "../components/DataTable";

type AddMetric = "impressoes" | "cliques" | "investimento" | "engajamento" | "visualizacoes" | "alcance";
const ADD_METRICS: { key: AddMetric; label: string }[] = [
  { key: "impressoes", label: "Impressões" },
  { key: "cliques", label: "Cliques" },
  { key: "investimento", label: "Investimento" },
  { key: "alcance", label: "Alcance" },
  { key: "engajamento", label: "Engajamento" },
  { key: "visualizacoes", label: "Visualizações" },
];
const isMoney = (k: string) => k === "investimento";
const chartKindOf = (k: string) => (isMoney(k) ? "currency" : "compact");
const heatFmt = (k: string) => (isMoney(k) ? (v: number) => formatCurrency(v, true) : formatNumber);

export function Overview({ rows }: { rows: Row[] }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [stackMetric, setStackMetric] = useState<AddMetric>("impressoes");
  const [rankMetric, setRankMetric] = useState<MetricKey>("impressoes");
  const [heatMetric, setHeatMetric] = useState<AddMetric>("impressoes");

  const bounds = useMemo(() => dateBounds(rows) ?? undefined, [rows]);
  const data = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const t = useMemo(() => sumRows(data), [data]);
  const d = useMemo(() => derived(t), [t]);

  const byPlatform = useMemo(
    () => groupBy(data, (r) => r.plataforma).sort((a, b) => b.totals.investimento - a.totals.investimento),
    [data]
  );
  const byStrategy = useMemo(() => groupBy(data, (r) => `${r.plataforma} · ${r.estrategia}`), [data]);
  const platforms = useMemo(() => byPlatform.map((g) => g.key as Platform), [byPlatform]);

  // big: empilhado por dia × plataforma
  const stack = useMemo(() => pivotByDay(data, (r) => r.plataforma, stackMetric), [data, stackMetric]);
  const stackKeys = stack.cats.map((c) => ({ key: c, label: c, color: PLATFORM_COLORS[c as Platform] ?? "#888" }));

  // donut investimento
  const investDonut = byPlatform
    .filter((g) => g.totals.investimento > 0)
    .map((g) => ({ name: g.key, value: g.totals.investimento, color: PLATFORM_COLORS[g.key as Platform] }));

  // ranking estratégias (dinâmico)
  const rank = byStrategy
    .map((g, i) => ({ name: g.key, value: g.totals[rankMetric], color: BAHIA_PALETTE[i % BAHIA_PALETTE.length] }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // heatmap plataforma × dia da semana
  const matrix = useMemo(() => weekdayMatrix(data, (r) => r.plataforma, heatMetric), [data, heatMetric]);
  const activeWeekdays = useMemo(() => {
    const set = new Set<string>();
    for (const r of data) {
      const wd = weekdayIndex(r.data);
      if (wd >= 0) set.add(WEEKDAYS[wd]);
    }
    return WEEKDAYS.filter((w) => set.has(w));
  }, [data]);

  // série diária consolidada (impressões, engajamento, visualizações)
  const timeData = useMemo(
    () => dailyTotals(data).map((dd) => ({ name: shortDate(dd.date), impressoes: dd.totals.impressoes, engajamento: dd.totals.engajamento, visualizacoes: dd.totals.visualizacoes })),
    [data]
  );

  // insights
  const insights = useMemo(() => {
    const withImp = byPlatform.filter((g) => g.totals.impressoes > 0);
    const bestCTR = [...withImp].sort((a, b) => b.totals.ctr - a.totals.ctr)[0];
    const bestCPM = [...withImp].map((g) => ({ g, cpm: derived(g.totals).cpm })).sort((a, b) => a.cpm - b.cpm)[0];
    const topReach = [...byPlatform].sort((a, b) => b.totals.alcance - a.totals.alcance)[0];
    const topStrategy = [...byStrategy].sort((a, b) => b.totals.investimento - a.totals.investimento)[0];
    return { bestCTR, bestCPM, topReach, topStrategy };
  }, [byPlatform, byStrategy]);

  const tableCols: Column<(typeof byPlatform)[number]>[] = [
    { key: "plat", header: "Plataforma", sortValue: (r) => r.key, render: (r) => (
      <span className="inline-flex items-center gap-2 font-semibold">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: PLATFORM_COLORS[r.key as Platform] }} />{r.key}
      </span>
    ) },
    { key: "inv", header: "Investimento", align: "right", sortValue: (r) => r.totals.investimento, render: (r) => formatCurrency(r.totals.investimento) },
    { key: "imp", header: "Impressões", align: "right", sortValue: (r) => r.totals.impressoes, render: (r) => dash(r.totals.impressoes, formatInt) },
    { key: "alc", header: "Alcance", align: "right", sortValue: (r) => r.totals.alcance, render: (r) => dash(r.totals.alcance, formatInt) },
    { key: "clk", header: "Cliques", align: "right", sortValue: (r) => r.totals.cliques, render: (r) => dash(r.totals.cliques, formatInt) },
    { key: "ctr", header: "CTR", align: "right", sortValue: (r) => r.totals.ctr, render: (r) => dash(r.totals.ctr, (v) => formatPercent(v)) },
    { key: "cpm", header: "CPM", align: "right", sortValue: (r) => derived(r.totals).cpm, render: (r) => dash(derived(r.totals).cpm, (v) => formatCurrency(v)) },
    { key: "eng", header: "Engajamento", align: "right", sortValue: (r) => r.totals.engajamento, render: (r) => dash(r.totals.engajamento, formatInt) },
  ];

  return (
    <div>
      <SectionTitle sub="Consolidado das campanhas de mídia — São João 2026">Visão Geral</SectionTitle>
      <FilterBar rows={rows} filters={filters} onChange={setFilters} period={bounds} lockPlatform />

      {/* HERO — visão geral consolidada (KPIs + custos/taxas) */}
      <Hero
        kpis={[
          { label: "Investimento", value: formatCurrency(t.investimento) },
          { label: "Impressões", value: formatNumber(t.impressoes), sub: formatInt(t.impressoes) },
          { label: "Cliques", value: formatNumber(t.cliques), sub: formatInt(t.cliques) },
          { label: "Visualizações", value: formatNumber(t.visualizacoes), sub: formatInt(t.visualizacoes) },
        ]}
        secondary={[
          { label: "Alcance", value: t.alcance ? formatNumber(t.alcance) : "—" },
          { label: "Frequência", value: t.alcance ? formatDecimal(t.impressoes / t.alcance) : "—" },
          { label: "CPM", value: d.cpm ? formatCurrency(d.cpm) : "—" },
          { label: "CPC", value: d.cpc ? formatCurrency(d.cpc) : "—" },
          { label: "CTR", value: formatPercent(t.ctr) },
          { label: "VTR", value: formatPercent(d.vtr) },
        ]}
      />

      {/* Linha 1 — componente grande: linha por dia × plataforma */}
      <Card
        title="Evolução diária por plataforma"
        subtitle="Gráfico de linha — escolha a métrica"
        className="mt-5"
        action={<ButtonGroup<AddMetric> value={stackMetric} onChange={setStackMetric} options={ADD_METRICS.map((m) => ({ label: m.label, value: m.key, color: "#1a1d21" }))} />}
      >
        <TimeSeries
          data={stack.data}
          series={stackKeys.map((k) => ({ key: k.key, label: k.label, color: k.color, kind: stackMetric === "investimento" ? "currency" : "int" }))}
          height={320}
        />
      </Card>

      {/* Linha 2 — 50/50: donut + ranking horizontal dinâmico */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Investimento por plataforma" subtitle="Distribuição do investimento">
          <DonutChart data={investDonut} kind="currency" />
        </Card>
        <Card
          title="Ranking por estratégia"
          subtitle="Top estratégias na métrica escolhida"
          action={<Select value={rankMetric} onChange={(v) => setRankMetric(v as MetricKey)} options={[...ADD_METRICS, { key: "ctr" as AddMetric, label: "CTR" }].map((m) => ({ label: m.label, value: m.key }))} />}
        >
          <HorizontalBars data={rank} kind={rankMetric === "ctr" ? "percent" : chartKindOf(rankMetric)} />
        </Card>
      </div>

      {/* Linha 3 — 60/40: heatmap + insights */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[6fr_4fr]">
        <Card
          title="Mapa de calor · plataforma × dia da semana"
          subtitle="Intensidade da métrica por dia"
          action={<Select value={heatMetric} onChange={(v) => setHeatMetric(v as AddMetric)} options={ADD_METRICS.map((m) => ({ label: m.label, value: m.key }))} />}
        >
          {activeWeekdays.length ? (
            <Heatmap rows={platforms} cols={activeWeekdays} getValue={(r, c) => matrix.get(r, c)} format={heatFmt(heatMetric)} color="#3FA9C9" />
          ) : (
            <p className="py-8 text-center text-sm text-[var(--muted)]">Sem dados por dia.</p>
          )}
        </Card>
        <AnalysisBox title="Leitura rápida" accent="#8BC53F">
          {insights.bestCTR && (
            <Insight label="Melhor CTR" value={`${insights.bestCTR.key} · ${formatPercent(insights.bestCTR.totals.ctr)}`} color={PLATFORM_COLORS[insights.bestCTR.key as Platform]} />
          )}
          {insights.bestCPM && (
            <Insight label="Menor CPM (mais eficiente)" value={`${insights.bestCPM.g.key} · ${formatCurrency(insights.bestCPM.cpm)}`} color={PLATFORM_COLORS[insights.bestCPM.g.key as Platform]} />
          )}
          {insights.topReach && insights.topReach.totals.alcance > 0 && (
            <Insight label="Maior alcance" value={`${insights.topReach.key} · ${formatNumber(insights.topReach.totals.alcance)}`} color={PLATFORM_COLORS[insights.topReach.key as Platform]} />
          )}
          {insights.topStrategy && (
            <Insight label="Estratégia com maior verba" value={`${insights.topStrategy.key}`} />
          )}
          <p className="border-t border-[var(--border)] pt-2.5 text-xs text-[var(--muted)]">
            CPC médio {d.cpc ? formatCurrency(d.cpc) : "—"} · {byStrategy.length} estratégias ativas em {platforms.length} plataformas.
          </p>
        </AnalysisBox>
      </div>

      {/* Linha 4 — barras verticais por dia */}
      <Card title="Volume diário" subtitle="Impressões, engajamento e visualizações por dia" className="mt-4">
        <GroupedBars data={timeData} keys={[
          { key: "impressoes", label: "Impressões", color: "#3FA9C9" },
          { key: "engajamento", label: "Engajamento", color: "#E12B2B" },
          { key: "visualizacoes", label: "Visualizações", color: "#8BC53F" },
        ]} kind="compact" height={300} />
      </Card>

      {/* Tabela */}
      <Card title="Resumo por plataforma" className="mt-4">
        <DataTable rows={byPlatform} columns={tableCols} initialSortKey="inv" pageSize={5} />
      </Card>
    </div>
  );
}

function dash(v: number, f: (n: number) => string) {
  return v ? f(v) : "-";
}
