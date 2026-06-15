"use client";

import React, { useMemo, useState } from "react";
import { dailyTotals, dailyValues, dateBounds, derived, groupBy, shortDate, sumRows } from "../lib/data";
import { BAHIA_PALETTE, Row } from "../lib/types";
import { formatCurrency, formatInt, formatNumber, formatPercent } from "../lib/format";
import { DonutChart, HorizontalBars, TimeSeries, VerticalBars } from "../components/charts";
import { AnalysisBox, ButtonGroup, Card, EmptyState, Insight, SectionTitle, StatCard } from "../components/ui";
import { Column, DataTable } from "../components/DataTable";
import { applyFilters, DEFAULT_FILTERS, FilterBar, FilterState } from "../components/Filters";

const YT = "#E12B2B";

function shortLabel(s: string): string {
  if (/shorts/i.test(s)) return "Shorts";
  if (/in stream/i.test(s)) return "In Stream";
  if (/alcance/i.test(s)) return "Alcance";
  return s;
}

type CompMetric = "impressoes" | "visualizacoes" | "cliques" | "engajamento";
const COMP_METRICS: { key: CompMetric; label: string }[] = [
  { key: "impressoes", label: "Impressões" },
  { key: "visualizacoes", label: "Visualizações" },
  { key: "cliques", label: "Cliques" },
  { key: "engajamento", label: "Engajamento" },
];

function dash(v: number, f: (n: number) => string) {
  return v ? f(v) : "-";
}

export function YoutubeView({ rows }: { rows: Row[] }) {
  const [compMetric, setCompMetric] = useState<CompMetric>("visualizacoes");
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS, plataforma: "Youtube" });

  const ytRows = useMemo(() => rows.filter((r) => r.plataforma === "Youtube"), [rows]);
  const bounds = useMemo(() => dateBounds(ytRows) ?? undefined, [ytRows]);
  const data = useMemo(() => applyFilters(ytRows, { ...filters, plataforma: "Youtube" }), [ytRows, filters]);
  const t = useMemo(() => sumRows(data), [data]);
  const dv = useMemo(() => derived(t), [t]);

  const strategies = useMemo(
    () =>
      groupBy(data, (r) => r.estrategia)
        .map((g, i) => ({ key: g.key, short: shortLabel(g.key), totals: g.totals, d: derived(g.totals), color: BAHIA_PALETTE[i % BAHIA_PALETTE.length] }))
        .sort((a, b) => b.totals.investimento - a.totals.investimento),
    [data]
  );

  const investDonut = strategies.filter((s) => s.totals.investimento > 0).map((s) => ({ name: s.short, value: s.totals.investimento, color: s.color }));

  // comparativo por métrica — valores EXATOS (rótulos), escala real (grandes ficam grandes)
  const compBars = strategies.map((s) => ({ name: s.short, value: s.totals[compMetric], color: s.color }));

  // VTR por estratégia (eficiência de visualização)
  const vtrBars = strategies.map((s) => ({ name: s.short, value: s.d.vtr, color: s.color })).filter((x) => x.value > 0);

  // evolução diária: investimento, impressões e visualizações
  const daily = useMemo(
    () => dailyTotals(data).map((d) => ({ name: shortDate(d.date), investimento: d.totals.investimento, impressoes: d.totals.impressoes, visualizacoes: d.totals.visualizacoes })),
    [data]
  );

  const insights = useMemo(() => {
    const withImp = strategies.filter((s) => s.totals.impressoes > 0);
    const bestVTR = [...withImp].sort((a, b) => b.d.vtr - a.d.vtr)[0];
    const bestCPV = [...strategies.filter((s) => s.totals.visualizacoes > 0)].sort((a, b) => a.d.cpv - b.d.cpv)[0];
    const bestCTR = [...withImp].sort((a, b) => b.totals.ctr - a.totals.ctr)[0];
    const topVol = [...strategies].sort((a, b) => b.totals.visualizacoes - a.totals.visualizacoes)[0];
    const cheapestCPM = [...withImp].sort((a, b) => a.d.cpm - b.d.cpm)[0];
    return { bestVTR, bestCPV, bestCTR, topVol, cheapestCPM };
  }, [strategies]);

  const cols: Column<(typeof strategies)[number]>[] = [
    { key: "estr", header: "Estratégia", sortValue: (r) => r.key, render: (r) => <span className="font-semibold">{r.key}</span> },
    { key: "inv", header: "Investimento", align: "right", sortValue: (r) => r.totals.investimento, render: (r) => dash(r.totals.investimento, formatCurrency) },
    { key: "imp", header: "Impressões", align: "right", sortValue: (r) => r.totals.impressoes, render: (r) => dash(r.totals.impressoes, formatInt) },
    { key: "vis", header: "Visualizações", align: "right", sortValue: (r) => r.totals.visualizacoes, render: (r) => dash(r.totals.visualizacoes, formatInt) },
    { key: "vtr", header: "VTR", align: "right", sortValue: (r) => r.d.vtr, render: (r) => dash(r.d.vtr, (v) => formatPercent(v)) },
    { key: "ctr", header: "CTR", align: "right", sortValue: (r) => r.totals.ctr, render: (r) => dash(r.totals.ctr, (v) => formatPercent(v)) },
    { key: "cpv", header: "CPV", align: "right", sortValue: (r) => r.d.cpv, render: (r) => dash(r.d.cpv, (v) => formatCurrency(v)) },
    { key: "cpm", header: "CPM", align: "right", sortValue: (r) => r.d.cpm, render: (r) => dash(r.d.cpm, (v) => formatCurrency(v)) },
  ];

  if (ytRows.length === 0) return <EmptyState message="Sem dados de YouTube." />;

  const compLabel = COMP_METRICS.find((m) => m.key === compMetric)?.label ?? "";

  return (
    <div>
      <SectionTitle sub="Análise comparativa das estratégias — YouTube" accent={YT}>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: YT }} />YouTube</span>
      </SectionTitle>

      <FilterBar rows={ytRows} filters={{ ...filters, plataforma: "Youtube" }} onChange={setFilters} lockPlatform period={bounds} />

      {data.length === 0 ? (
        <EmptyState message="Nenhum dado para os filtros selecionados." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Investimento" value={formatCurrency(t.investimento)} accent={YT} spark={dailyValues(data, "investimento")}
              subs={[{ label: "CPV", value: dv.cpv ? formatCurrency(dv.cpv) : "—" }, { label: "CPC", value: dv.cpc ? formatCurrency(dv.cpc) : "—" }]} />
            <StatCard label="Impressões" value={formatNumber(t.impressoes)} accent={YT} spark={dailyValues(data, "impressoes")}
              subs={[{ label: "CPM", value: dv.cpm ? formatCurrency(dv.cpm) : "—" }]} />
            <StatCard label="Cliques" value={formatNumber(t.cliques)} accent={YT}
              subs={[{ label: "CTR", value: formatPercent(t.ctr) }, { label: "CPC", value: dv.cpc ? formatCurrency(dv.cpc) : "—" }]} />
            <StatCard label="Visualizações" value={formatNumber(t.visualizacoes)} accent={YT} spark={dailyValues(data, "visualizacoes")}
              subs={[{ label: "VTR", value: formatPercent(dv.vtr) }, { label: "CPV", value: dv.cpv ? formatCurrency(dv.cpv) : "—" }]} />
          </div>

          {/* Linha 1 — 60/40: comparativo com valores exatos + análise (preenche o espaço) */}
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[6fr_4fr]">
            <Card
              title={`${compLabel} por estratégia`}
              subtitle="Valores reais — barras maiores = mais volume"
              action={<ButtonGroup<CompMetric> value={compMetric} onChange={setCompMetric} options={COMP_METRICS.map((m) => ({ label: m.label, value: m.key, color: YT }))} />}
            >
              {compBars.some((b) => b.value > 0) ? <VerticalBars data={compBars} kind="int" height={300} /> : <EmptyState message="Sem dados para esta métrica." />}
            </Card>
            <AnalysisBox title="Comparativo de eficiência" accent={YT}>
              {insights.topVol && insights.topVol.totals.visualizacoes > 0 && <Insight label="Mais visualizações" value={`${insights.topVol.short} · ${formatNumber(insights.topVol.totals.visualizacoes)}`} color={YT} />}
              {insights.bestVTR && <Insight label="Melhor VTR" value={`${insights.bestVTR.short} · ${formatPercent(insights.bestVTR.d.vtr)}`} />}
              {insights.bestCPV && <Insight label="Menor CPV" value={`${insights.bestCPV.short} · ${formatCurrency(insights.bestCPV.d.cpv)}`} />}
              {insights.cheapestCPM && <Insight label="Menor CPM" value={`${insights.cheapestCPM.short} · ${formatCurrency(insights.cheapestCPM.d.cpm)}`} />}
              {insights.bestCTR && <Insight label="Melhor CTR" value={`${insights.bestCTR.short} · ${formatPercent(insights.bestCTR.totals.ctr)}`} />}
              <p className="border-t border-[var(--border)] pt-2.5 text-xs leading-relaxed text-[var(--muted)]">
                Alcance entrega volume de impressões; <strong>Shorts</strong> e <strong>In Stream</strong> são focadas em visualização — compare CPV e VTR para escolher onde investir.
              </p>
            </AnalysisBox>
          </div>

          {/* Linha 2 — 50/50: investimento + VTR por estratégia */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Investimento por estratégia">
              {investDonut.length ? <DonutChart data={investDonut} kind="currency" /> : <EmptyState message="Sem investimento." />}
            </Card>
            <Card title="Taxa de visualização (VTR) por estratégia" subtitle="Visualizações sobre impressões">
              {vtrBars.length ? <HorizontalBars data={vtrBars} kind="percent" color={YT} height={260} /> : <EmptyState message="Sem dados de VTR." />}
            </Card>
          </div>

          {/* Linha 3 — evolução diária (3 linhas) */}
          <Card title="Evolução diária" subtitle="Investimento, impressões e visualizações por dia" className="mt-4">
            <TimeSeries
              data={daily}
              series={[
                { key: "impressoes", label: "Impressões", color: "#3FA9C9", kind: "int" },
                { key: "visualizacoes", label: "Visualizações", color: "#8BC53F", kind: "int" },
                { key: "investimento", label: "Investimento", color: "#E12B2B", kind: "currency" },
              ]}
              height={300}
            />
          </Card>

          {/* Tabela comparativa */}
          <Card title="Comparativo por estratégia" subtitle="Métricas de volume, custo e eficiência" className="mt-4">
            <DataTable rows={strategies} columns={cols} initialSortKey="inv" pageSize={10} />
          </Card>
        </>
      )}
    </div>
  );
}
