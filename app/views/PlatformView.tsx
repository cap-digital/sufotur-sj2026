"use client";

import React, { useMemo, useState } from "react";
import { dailyTotals, dailyValues, dateBounds, derived, groupBy, shortDate, sumRows } from "../lib/data";
import { PLATFORM_COLORS, Platform, Row } from "../lib/types";
import { formatCurrency, formatDecimal, formatInt, formatNumber, formatPercent } from "../lib/format";
import { applyFilters, DEFAULT_FILTERS, FilterBar, FilterState } from "../components/Filters";
import { BarDatum, DonutChart, FunnelChart, GroupedBars, HorizontalBars, TimeSeries, VerticalBars } from "../components/charts";
import { AnalysisBox, ButtonGroup, Card, EmptyState, Hero, Insight, SectionTitle, Select, StatCard } from "../components/ui";
import { Column, DataTable } from "../components/DataTable";

type DemoMetric = "impressoes" | "cliques" | "engajamento";
const DEMO_METRICS: { key: DemoMetric; label: string }[] = [
  { key: "impressoes", label: "Impressões" },
  { key: "cliques", label: "Cliques" },
  { key: "engajamento", label: "Engajamento" },
];

function genderColor(g: string) {
  if (g === "Feminino") return "#E6308A";
  if (g === "Masculino") return "#3FA9C9";
  return "#5B6770";
}
function ageOrder(a: string) {
  if (a.startsWith(">")) return 999;
  const m = a.match(/\d+/);
  return m ? parseInt(m[0]) : 1000;
}
function dash(v: number, f: (n: number) => string) {
  return v ? f(v) : "-";
}

export function PlatformView({ rows, platform }: { rows: Row[]; platform: Platform }) {
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS, plataforma: platform });
  const [demoMetric, setDemoMetric] = useState<DemoMetric>("impressoes");
  const [genderMetric, setGenderMetric] = useState<DemoMetric>("impressoes");
  const color = PLATFORM_COLORS[platform];

  const platformRows = useMemo(() => rows.filter((r) => r.plataforma === platform), [rows, platform]);
  const bounds = useMemo(() => dateBounds(platformRows) ?? undefined, [platformRows]);
  const data = useMemo(() => applyFilters(platformRows, { ...filters, plataforma: platform }), [platformRows, filters, platform]);
  const t = useMemo(() => sumRows(data), [data]);
  const dv = useMemo(() => derived(t), [t]);

  const byStrategy = useMemo(
    () => groupBy(data, (r) => r.estrategia).sort((a, b) => b.totals.investimento - a.totals.investimento),
    [data]
  );

  const ages = useMemo(
    () => Array.from(new Set(data.map((r) => r.idade).filter((a) => a && a !== "N/D"))).sort((a, b) => ageOrder(a) - ageOrder(b)),
    [data]
  );
  const genders = useMemo(
    () => Array.from(new Set(data.map((r) => r.genero).filter((g) => g && g !== "Não informado"))).sort(),
    [data]
  );

  const byAge: BarDatum[] = useMemo(
    () => ages.map((a) => ({ name: a, value: sumRows(data.filter((r) => r.idade === a))[demoMetric] })).filter((x) => x.value > 0),
    [ages, data, demoMetric]
  );
  const byGender: BarDatum[] = useMemo(
    () => genders.map((g) => ({ name: g, value: sumRows(data.filter((r) => r.genero === g))[genderMetric], color: genderColor(g) })).filter((x) => x.value > 0),
    [genders, data, genderMetric]
  );

  // comparativo de estratégias (Alcance × Engajamento) — barras agrupadas, não etário
  const stratCompare = useMemo(
    () =>
      byStrategy.map((g) => ({ name: g.key, impressoes: g.totals.impressoes, cliques: g.totals.cliques, engajamento: g.totals.engajamento })),
    [byStrategy]
  );

  // funil de visualização de vídeo (contagens por quartil)
  const funnel = useMemo(
    () =>
      [
        { name: "Assistiram 25%", value: t.v25 },
        { name: "Assistiram 50%", value: t.v50 },
        { name: "Assistiram 75%", value: t.v75 },
        { name: "Assistiram 100%", value: t.v100 },
      ].filter((s, _i, arr) => arr.some((x) => x.value > 0)),
    [t]
  );

  // evolução diária
  const daily = useMemo(
    () => dailyTotals(data).map((d) => ({ name: shortDate(d.date), impressoes: d.totals.impressoes, cliques: d.totals.cliques, engajamento: d.totals.engajamento })),
    [data]
  );

  const insights = useMemo(() => {
    const topAge = [...byAge].sort((a, b) => b.value - a.value)[0];
    const totGender = byGender.reduce((s, x) => s + x.value, 0) || 1;
    const topGender = [...byGender].sort((a, b) => b.value - a.value)[0];
    const bestStrat = [...byStrategy].filter((g) => g.totals.impressoes > 0).sort((a, b) => b.totals.ctr - a.totals.ctr)[0];
    return { topAge, topGender, topGenderShare: topGender ? (topGender.value / totGender) * 100 : 0, bestStrat };
  }, [byAge, byGender, byStrategy]);

  const creativeRows = useMemo(
    () =>
      groupBy(data, (r) => `${r.criativo}__${r.estrategia}`)
        .map((g) => ({ criativo: g.rows[0].criativo, estrategia: g.rows[0].estrategia, totals: g.totals }))
        .filter((g) => g.totals.impressoes > 0)
        .sort((a, b) => b.totals.impressoes - a.totals.impressoes),
    [data]
  );

  const cols: Column<(typeof creativeRows)[number]>[] = [
    { key: "criativo", header: "Criativo", sortValue: (r) => r.criativo, render: (r) => (
      <div className="max-w-[220px]"><p className="truncate font-medium">{r.criativo}</p><p className="text-xs text-[var(--muted)]">{r.estrategia}</p></div>
    ) },
    { key: "inv", header: "Investimento", align: "right", sortValue: (r) => r.totals.investimento, render: (r) => dash(r.totals.investimento, formatCurrency) },
    { key: "imp", header: "Impressões", align: "right", sortValue: (r) => r.totals.impressoes, render: (r) => dash(r.totals.impressoes, formatInt) },
    { key: "clk", header: "Cliques", align: "right", sortValue: (r) => r.totals.cliques, render: (r) => dash(r.totals.cliques, formatInt) },
    { key: "ctr", header: "CTR", align: "right", sortValue: (r) => r.totals.ctr, render: (r) => dash(r.totals.ctr, (v) => formatPercent(v)) },
    { key: "cpm", header: "CPM", align: "right", sortValue: (r) => derived(r.totals).cpm, render: (r) => dash(derived(r.totals).cpm, (v) => formatCurrency(v)) },
    { key: "eng", header: "Engajamento", align: "right", sortValue: (r) => r.totals.engajamento, render: (r) => dash(r.totals.engajamento, formatInt) },
  ];

  return (
    <div>
      <SectionTitle sub="Performance detalhada — Meta" accent={color}>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: color }} />Meta</span>
      </SectionTitle>

      <FilterBar rows={platformRows} filters={{ ...filters, plataforma: platform }} onChange={setFilters} lockPlatform period={bounds} />

      {data.length === 0 ? (
        <EmptyState message="Nenhum dado para os filtros selecionados." />
      ) : (
        <>
          {/* HERO — visão geral da plataforma */}
          <Hero
            kpis={[
              { label: "Investimento", value: formatCurrency(t.investimento) },
              { label: "Impressões", value: formatNumber(t.impressoes), sub: formatInt(t.impressoes) },
              { label: "Cliques", value: formatNumber(t.cliques), sub: formatInt(t.cliques) },
              { label: "Engajamento", value: formatNumber(t.engajamento), sub: formatInt(t.engajamento) },
            ]}
          />

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Investimento" value={formatCurrency(t.investimento)} accent={color}
              subs={[{ label: "CPM", value: dv.cpm ? formatCurrency(dv.cpm) : "—" }, { label: "CPC", value: dv.cpc ? formatCurrency(dv.cpc) : "—" }]} />
            <StatCard label="Impressões" value={formatNumber(t.impressoes)} accent={color} spark={dailyValues(data, "impressoes")}
              subs={[{ label: "Alcance", value: t.alcance ? formatNumber(t.alcance) : "—" }, { label: "Frequência", value: t.alcance ? formatDecimal(t.impressoes / t.alcance) : "—" }]} />
            <StatCard label="Cliques" value={formatNumber(t.cliques)} accent={color} spark={dailyValues(data, "cliques")}
              subs={[{ label: "CTR", value: formatPercent(t.ctr) }, { label: "CPC", value: dv.cpc ? formatCurrency(dv.cpc) : "—" }]} />
            <StatCard label="Engajamento" value={formatNumber(t.engajamento)} accent={color} spark={dailyValues(data, "engajamento")}
              subs={[{ label: "Taxa eng.", value: formatPercent(dv.engRate) }, { label: "CPE", value: dv.cpe ? formatCurrency(dv.cpe) : "—" }]} />
          </div>

          {/* Linha 1 — grande: comparativo de estratégias (não etário) */}
          <Card title="Estratégias em comparação" subtitle="Volume por estratégia — Alcance × Engajamento" className="mt-5">
            <GroupedBars
              data={stratCompare}
              keys={[
                { key: "impressoes", label: "Impressões", color: "#3FA9C9" },
                { key: "cliques", label: "Cliques", color: "#E8862B" },
                { key: "engajamento", label: "Engajamento", color: "#8BC53F" },
              ]}
              kind="compact"
              height={300}
            />
          </Card>

          {/* Linha 2 — 50/50: investimento + gênero */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Investimento por estratégia">
              {byStrategy.some((g) => g.totals.investimento > 0) ? (
                <DonutChart data={byStrategy.filter((g) => g.totals.investimento > 0).map((g) => ({ name: g.key, value: g.totals.investimento }))} kind="currency" />
              ) : (
                <EmptyState message="Sem investimento." />
              )}
            </Card>
            <Card
              title="Por gênero"
              subtitle="Selecione a métrica"
              action={<Select value={genderMetric} onChange={(v) => setGenderMetric(v as DemoMetric)} options={DEMO_METRICS.map((m) => ({ label: m.label, value: m.key }))} />}
            >
              {byGender.length ? <HorizontalBars data={byGender} kind="compact" height={240} /> : <EmptyState message="Sem dados de gênero." />}
            </Card>
          </div>

          {/* Linha 3 — 60/40: faixa etária dinâmica + insights */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[6fr_4fr]">
            <Card
              title="Público por faixa etária"
              subtitle="Selecione a métrica"
              action={<ButtonGroup<DemoMetric> value={demoMetric} onChange={setDemoMetric} options={DEMO_METRICS.map((m) => ({ label: m.label, value: m.key, color }))} />}
            >
              {byAge.length ? <VerticalBars data={byAge} kind="compact" color={color} height={300} /> : <EmptyState message="Sem dados demográficos." />}
            </Card>
            <AnalysisBox title="Leitura rápida" accent={color}>
              {insights.topAge && <Insight label="Faixa que mais converte" value={`${insights.topAge.name} · ${formatNumber(insights.topAge.value)}`} color={color} />}
              {insights.topGender && <Insight label="Gênero dominante" value={`${insights.topGender.name} · ${formatPercent(insights.topGenderShare)}`} color={genderColor(insights.topGender.name)} />}
              {insights.bestStrat && <Insight label="Melhor CTR (estratégia)" value={`${insights.bestStrat.key} · ${formatPercent(insights.bestStrat.totals.ctr)}`} />}
              <Insight label="CPC médio" value={dv.cpc ? formatCurrency(dv.cpc) : "—"} />
              <Insight label="Taxa de engajamento" value={formatPercent(dv.engRate)} />
              <p className="border-t border-[var(--border)] pt-2.5 text-xs text-[var(--muted)]">{byStrategy.length} estratégia(s) · {creativeRows.length} criativo(s) ativos.</p>
            </AnalysisBox>
          </div>

          {/* Linha 4 — 60/40: funil de verdade + evolução */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[4fr_6fr]">
            {funnel.length > 0 && (
              <Card title="Funil de visualização de vídeo" subtitle="Retenção por quartil assistido">
                <FunnelChart data={funnel} format={formatNumber} />
              </Card>
            )}
            <Card title="Evolução diária" subtitle="Impressões, cliques e engajamento por dia">
              <TimeSeries data={daily} series={[
                { key: "impressoes", label: "Impressões", color: "#3FA9C9", kind: "int" },
                { key: "cliques", label: "Cliques", color: "#E8862B", kind: "int" },
                { key: "engajamento", label: "Engajamento", color: "#8BC53F", kind: "int" },
              ]} height={300} />
            </Card>
          </div>

          {/* Tabela criativos */}
          <Card title="Criativos da plataforma" subtitle="Ordenável e paginado" className="mt-4">
            <DataTable rows={creativeRows} columns={cols} initialSortKey="imp" pageSize={8} />
          </Card>
        </>
      )}
    </div>
  );
}
