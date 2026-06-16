"use client";

import React, { useMemo, useState } from "react";
import { dailyTotals, dateBounds, derived, groupBy, shortDate, sumRows } from "../lib/data";
import { Row } from "../lib/types";
import { formatCurrency, formatInt, formatNumber, formatPercent } from "../lib/format";
import { applyFilters, DEFAULT_FILTERS, FilterBar, FilterState } from "../components/Filters";
import { BarDatum, DonutChart, FunnelChart, HorizontalBars, TimeSeries, VerticalBars } from "../components/charts";
import { AnalysisBox, Card, EmptyState, Hero, Insight, SectionTitle, Select } from "../components/ui";
import { Column, DataTable } from "../components/DataTable";

const KW = "#E8862B";

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

type AgeMetric = "impressoes" | "cliques" | "visualizacoes";
const AGE_METRICS: { key: AgeMetric; label: string }[] = [
  { key: "impressoes", label: "Impressões" },
  { key: "cliques", label: "Cliques" },
  { key: "visualizacoes", label: "Visualizações" },
];

export function KwaiView({ rows }: { rows: Row[] }) {
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS, plataforma: "Kwai" });
  const [ageMetric, setAgeMetric] = useState<AgeMetric>("impressoes");

  const kwRows = useMemo(() => rows.filter((r) => r.plataforma === "Kwai"), [rows]);
  const bounds = useMemo(() => dateBounds(kwRows) ?? undefined, [kwRows]);
  const data = useMemo(() => applyFilters(kwRows, { ...filters, plataforma: "Kwai" }), [kwRows, filters]);
  const t = useMemo(() => sumRows(data), [data]);
  const dv = useMemo(() => derived(t), [t]);

  // evolução diária
  const daily = useMemo(
    () => dailyTotals(data).map((d) => ({ name: shortDate(d.date), impressoes: d.totals.impressoes, visualizacoes: d.totals.visualizacoes, cliques: d.totals.cliques })),
    [data]
  );

  // funil de conversão: impressões -> visualizações -> cliques
  const funnel: BarDatum[] = [
    { name: "Impressões", value: t.impressoes, color: "#3FA9C9" },
    { name: "Visualizações", value: t.visualizacoes, color: "#8BC53F" },
    { name: "Cliques", value: t.cliques, color: KW },
  ].filter((x) => x.value > 0);

  // gênero
  const byGender: BarDatum[] = useMemo(() => {
    const gs = Array.from(new Set(data.map((r) => r.genero).filter((g) => g && g !== "Não informado")));
    return gs.map((g) => ({ name: g, value: sumRows(data.filter((r) => r.genero === g)).impressoes, color: genderColor(g) })).filter((x) => x.value > 0);
  }, [data]);

  // faixa etária
  const byAge: BarDatum[] = useMemo(() => {
    const ages = Array.from(new Set(data.map((r) => r.idade).filter((a) => a && a !== "N/D"))).sort((a, b) => ageOrder(a) - ageOrder(b));
    return ages.map((a) => ({ name: a, value: sumRows(data.filter((r) => r.idade === a))[ageMetric] })).filter((x) => x.value > 0);
  }, [data, ageMetric]);

  // criativos
  const creativeRows = useMemo(
    () =>
      groupBy(data, (r) => r.criativo)
        .map((g) => ({ criativo: g.rows[0].criativo, totals: g.totals }))
        .filter((g) => g.totals.impressoes > 0)
        .sort((a, b) => b.totals.impressoes - a.totals.impressoes),
    [data]
  );
  const topCreatives: BarDatum[] = creativeRows.slice(0, 6).map((c) => ({ name: c.criativo.replace(/^\[.*?\]\s*/, "").slice(0, 18), value: c.totals.impressoes }));

  // insights
  const insights = useMemo(() => {
    const topAge = [...byAge].sort((a, b) => b.value - a.value)[0];
    const totG = byGender.reduce((s, x) => s + x.value, 0) || 1;
    const topGender = [...byGender].sort((a, b) => b.value - a.value)[0];
    const bestCreative = creativeRows[0];
    return { topAge, topGender, topGenderShare: topGender ? (topGender.value / totG) * 100 : 0, bestCreative };
  }, [byAge, byGender, creativeRows]);

  const cols: Column<(typeof creativeRows)[number]>[] = [
    { key: "criativo", header: "Criativo", sortValue: (r) => r.criativo, render: (r) => <span className="font-medium">{r.criativo}</span> },
    { key: "inv", header: "Investimento", align: "right", sortValue: (r) => r.totals.investimento, render: (r) => dash(r.totals.investimento, formatCurrency) },
    { key: "imp", header: "Impressões", align: "right", sortValue: (r) => r.totals.impressoes, render: (r) => dash(r.totals.impressoes, formatInt) },
    { key: "vis", header: "Visualizações", align: "right", sortValue: (r) => r.totals.visualizacoes, render: (r) => dash(r.totals.visualizacoes, formatInt) },
    { key: "clk", header: "Cliques", align: "right", sortValue: (r) => r.totals.cliques, render: (r) => dash(r.totals.cliques, formatInt) },
    { key: "ctr", header: "CTR", align: "right", sortValue: (r) => r.totals.ctr, render: (r) => dash(r.totals.ctr, (v) => formatPercent(v)) },
    { key: "cpm", header: "CPM", align: "right", sortValue: (r) => derived(r.totals).cpm, render: (r) => dash(derived(r.totals).cpm, (v) => formatCurrency(v)) },
  ];

  return (
    <div>
      <SectionTitle sub="Performance detalhada — Kwai" accent={KW}>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: KW }} />Kwai</span>
      </SectionTitle>

      <FilterBar rows={kwRows} filters={{ ...filters, plataforma: "Kwai" }} onChange={setFilters} lockPlatform period={bounds} />

      {data.length === 0 ? (
        <EmptyState message="Nenhum dado para os filtros selecionados." />
      ) : (
        <>
          {/* HERO — visão geral da plataforma (KPIs + custos/taxas) */}
          <Hero
            gradient="from-[#f0992f] via-[#e8862b] to-[#c25e16]"
            kpis={[
              { label: "Investimento", value: formatCurrency(t.investimento) },
              { label: "Impressões", value: formatNumber(t.impressoes), sub: formatInt(t.impressoes) },
              { label: "Cliques", value: formatNumber(t.cliques), sub: formatInt(t.cliques) },
              { label: "Visualizações", value: formatNumber(t.visualizacoes), sub: formatInt(t.visualizacoes) },
            ]}
            secondary={[
              { label: "CPM", value: dv.cpm ? formatCurrency(dv.cpm) : "—" },
              { label: "CPC", value: dv.cpc ? formatCurrency(dv.cpc) : "—" },
              { label: "CPV", value: dv.cpv ? formatCurrency(dv.cpv) : "—" },
              { label: "CTR", value: formatPercent(t.ctr) },
              { label: "VTR", value: formatPercent(dv.vtr) },
            ]}
          />

          {/* Linha 1 — grande: evolução diária */}
          <Card title="Evolução diária" subtitle="Impressões, visualizações e cliques por dia" className="mt-5">
            <TimeSeries data={daily} series={[
              { key: "impressoes", label: "Impressões", color: "#3FA9C9", kind: "int" },
              { key: "visualizacoes", label: "Visualizações", color: "#8BC53F", kind: "int" },
              { key: "cliques", label: "Cliques", color: KW, kind: "int" },
            ]} height={320} />
          </Card>

          {/* Linha 2 — 50/50: funil + gênero */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Funil de conversão" subtitle="Impressões → Visualizações → Cliques">
              {funnel.length ? <FunnelChart data={funnel} format={formatNumber} /> : <EmptyState message="Sem dados." />}
            </Card>
            <Card title="Distribuição por gênero" subtitle="Participação nas impressões">
              {byGender.length ? <DonutChart data={byGender} kind="compact" /> : <EmptyState message="Sem dados de gênero." />}
            </Card>
          </div>

          {/* Linha 3 — 60/40: top criativos + análise */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[6fr_4fr]">
            <Card title="Top criativos por impressões" subtitle="Ranking das peças veiculadas">
              {topCreatives.length ? <HorizontalBars data={topCreatives} kind="compact" color={KW} height={300} /> : <EmptyState message="Sem criativos." />}
            </Card>
            <AnalysisBox title="Leitura rápida" accent={KW}>
              {insights.bestCreative && <Insight label="Criativo de maior alcance" value={formatNumber(insights.bestCreative.totals.impressoes)} color={KW} />}
              {insights.topAge && <Insight label="Faixa que mais converte" value={`${insights.topAge.name} · ${formatNumber(insights.topAge.value)}`} />}
              {insights.topGender && <Insight label="Gênero dominante" value={`${insights.topGender.name} · ${formatPercent(insights.topGenderShare)}`} color={genderColor(insights.topGender.name)} />}
              <Insight label="CPV" value={dv.cpv ? formatCurrency(dv.cpv) : "—"} />
              <Insight label="VTR (views/impr.)" value={formatPercent(dv.vtr)} />
              <p className="border-t border-[var(--border)] pt-2.5 text-xs text-[var(--muted)]">{creativeRows.length} criativo(s) ativos na estratégia de Alcance.</p>
            </AnalysisBox>
          </div>

          {/* Linha 4 — faixa etária (único recorte demográfico em destaque) */}
          {byAge.length > 0 && (
            <Card
              title="Público por faixa etária"
              subtitle="Selecione a métrica"
              className="mt-4"
              action={<Select value={ageMetric} onChange={(v) => setAgeMetric(v as AgeMetric)} options={AGE_METRICS.map((m) => ({ label: m.label, value: m.key }))} />}
            >
              <VerticalBars data={byAge} kind="compact" color={KW} />
            </Card>
          )}

          {/* Tabela */}
          <Card title="Criativos da plataforma" subtitle="Ordenável e paginado" className="mt-4">
            <DataTable rows={creativeRows} columns={cols} initialSortKey="imp" pageSize={8} />
          </Card>
        </>
      )}
    </div>
  );
}
