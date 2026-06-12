"use client";

import React, { useMemo, useState } from "react";
import { derived, groupBy, resolveThumb, Totals } from "../lib/data";
import { MetricKey, PLATFORM_COLORS, Platform, Row } from "../lib/types";
import { formatCurrency, formatInt, formatNumber, formatPercent } from "../lib/format";
import { AnalysisBox, BigStat, ButtonGroup, Card, EmptyState, Insight, SectionTitle, Select } from "../components/ui";
import { Column, DataTable } from "../components/DataTable";

interface CreativeAgg {
  id: string;
  criativo: string;
  plataforma: Platform;
  estrategia: string;
  thumbnail: string;
  formatos: number; // grupos de anúncio
  anuncios: number; // veiculações (linhas) com impressões
  totals: Totals;
}

const SORT_METRICS: { key: MetricKey; label: string }[] = [
  { key: "impressoes", label: "Impressões" },
  { key: "cliques", label: "Cliques" },
  { key: "investimento", label: "Investimento" },
  { key: "ctr", label: "CTR" },
  { key: "engajamento", label: "Engajamento" },
  { key: "visualizacoes", label: "Visualizações" },
  { key: "alcance", label: "Alcance" },
];

function fmtMetric(v: number, key: MetricKey): string {
  if (key === "investimento") return formatCurrency(v, false);
  if (key === "ctr") return formatPercent(v);
  return formatInt(v);
}

function aggregate(rows: Row[]): CreativeAgg[] {
  return groupBy(rows, (r) => `${r.plataforma}__${r.criativo}`).map((g) => {
    const first = g.rows.find((r) => r.thumbnail) ?? g.rows[0];
    return {
      id: g.key,
      criativo: first.criativo,
      plataforma: first.plataforma,
      estrategia: first.estrategia,
      thumbnail: first.thumbnail,
      formatos: new Set(g.rows.map((r) => r.grupo).filter(Boolean)).size || 1,
      anuncios: g.rows.filter((r) => r.impressoes > 0).length,
      totals: g.totals,
    };
  });
}

export function Creatives({ rows }: { rows: Row[] }) {
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [sortMetric, setSortMetric] = useState<MetricKey>("impressoes");

  // big numbers globais (respondem ao filtro de plataforma)
  const scopeRows = useMemo(() => (platform === "all" ? rows : rows.filter((r) => r.plataforma === platform)), [rows, platform]);
  const scopeCreatives = useMemo(() => aggregate(scopeRows), [scopeRows]);
  const totals = useMemo(() => scopeCreatives.reduce((a, c) => ({
    inv: a.inv + c.totals.investimento,
    imp: a.imp + c.totals.impressoes,
    clk: a.clk + c.totals.cliques,
  }), { inv: 0, imp: 0, clk: 0 }), [scopeCreatives]);
  const platformsCount = new Set(scopeRows.map((r) => r.plataforma)).size;

  // cards: prioridade filtro de botão > exclui métrica base = 0 > ordena
  const cards = useMemo(() => {
    return scopeCreatives.filter((c) => (c.totals[sortMetric] ?? 0) > 0).sort((a, b) => (b.totals[sortMetric] ?? 0) - (a.totals[sortMetric] ?? 0));
  }, [scopeCreatives, sortMetric]);

  // melhores por custo e taxa (com volume mínimo p/ ser justo)
  const best = useMemo(() => {
    const elig = scopeCreatives.filter((c) => c.totals.impressoes >= 1000);
    const byCPM = [...elig].map((c) => ({ c, v: derived(c.totals).cpm })).filter((x) => x.v > 0).sort((a, b) => a.v - b.v)[0];
    const byCPC = [...elig].map((c) => ({ c, v: derived(c.totals).cpc })).filter((x) => x.v > 0).sort((a, b) => a.v - b.v)[0];
    const byCTR = [...elig].sort((a, b) => b.totals.ctr - a.totals.ctr)[0];
    const byCPV = [...scopeCreatives.filter((c) => c.totals.visualizacoes >= 100)].map((c) => ({ c, v: derived(c.totals).cpv })).filter((x) => x.v > 0).sort((a, b) => a.v - b.v)[0];
    return { byCPM, byCPC, byCTR, byCPV };
  }, [scopeCreatives]);

  // tabela (todos os criativos do escopo)
  const tableCols: Column<CreativeAgg>[] = [
    { key: "criativo", header: "Criativo", sortValue: (r) => r.criativo, render: (r) => (
      <div className="max-w-[220px]"><p className="truncate font-medium">{r.criativo}</p><p className="text-xs text-[var(--muted)]">{r.estrategia}</p></div>
    ) },
    { key: "plat", header: "Plataforma", sortValue: (r) => r.plataforma, render: (r) => (
      <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: PLATFORM_COLORS[r.plataforma] }} />{r.plataforma === "Youtube" ? "YouTube" : r.plataforma}</span>
    ) },
    { key: "inv", header: "Investimento", align: "right", sortValue: (r) => r.totals.investimento, render: (r) => dash(r.totals.investimento, formatCurrency) },
    { key: "imp", header: "Impressões", align: "right", sortValue: (r) => r.totals.impressoes, render: (r) => dash(r.totals.impressoes, formatInt) },
    { key: "clk", header: "Cliques", align: "right", sortValue: (r) => r.totals.cliques, render: (r) => dash(r.totals.cliques, formatInt) },
    { key: "ctr", header: "CTR", align: "right", sortValue: (r) => r.totals.ctr, render: (r) => dash(r.totals.ctr, (v) => formatPercent(v)) },
    { key: "cpm", header: "CPM", align: "right", sortValue: (r) => derived(r.totals).cpm, render: (r) => dash(derived(r.totals).cpm, (v) => formatCurrency(v)) },
    { key: "vis", header: "Visualizações", align: "right", sortValue: (r) => r.totals.visualizacoes, render: (r) => dash(r.totals.visualizacoes, formatInt) },
  ];

  return (
    <div>
      <SectionTitle sub="Desempenho por peça criativa — imagens, formatos e métricas">Criativos</SectionTitle>

      {/* filtros */}
      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-semibold text-[var(--muted)] sm:inline">Plataforma</span>
          <ButtonGroup<Platform | "all">
            value={platform}
            onChange={setPlatform}
            options={[
              { label: "Todas", value: "all", color: "#1a1d21" },
              { label: "Meta", value: "Meta", color: "#3FA9C9" },
              { label: "YouTube", value: "Youtube", color: "#E12B2B" },
              { label: "Kwai", value: "Kwai", color: "#E8862B" },
            ]}
          />
        </div>
        <Select label="Ordenar por" value={sortMetric} onChange={(v) => setSortMetric(v as MetricKey)} options={SORT_METRICS.map((m) => ({ label: m.label, value: m.key }))} />
      </div>

      {/* big numbers / anúncios rodando */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <BigStat label="Criativos" value={formatInt(scopeCreatives.length)} accent="#E6308A" sub={`em ${platformsCount} plataforma(s)`} />
        <BigStat label="Investimento" value={formatCurrency(totals.inv)} accent="#3FA9C9" />
        <BigStat label="Impressões" value={formatNumber(totals.imp)} accent="#8BC53F" sub={formatInt(totals.imp)} />
        <BigStat label="Cliques" value={formatNumber(totals.clk)} accent="#E8862B" sub={formatInt(totals.clk)} />
      </div>

      {/* análise de melhores por custo e taxa */}
      <AnalysisBox title="Destaques por custo e taxa" accent="#8BC53F" className="mt-4">
        <p className="text-xs text-[var(--muted)]">Entre criativos com volume relevante (≥ 1.000 impressões).</p>
        <div className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {best.byCPM && <Insight label={<>Menor CPM <span className="text-[var(--muted)]">· {trunc(best.byCPM.c.criativo)}</span></>} value={formatCurrency(best.byCPM.v)} color="#16a34a" />}
          {best.byCTR && best.byCTR.totals.ctr > 0 && <Insight label={<>Maior CTR <span className="text-[var(--muted)]">· {trunc(best.byCTR.criativo)}</span></>} value={formatPercent(best.byCTR.totals.ctr)} color="#16a34a" />}
          {best.byCPC && <Insight label={<>Menor CPC <span className="text-[var(--muted)]">· {trunc(best.byCPC.c.criativo)}</span></>} value={formatCurrency(best.byCPC.v)} color="#16a34a" />}
          {best.byCPV && <Insight label={<>Menor CPV <span className="text-[var(--muted)]">· {trunc(best.byCPV.c.criativo)}</span></>} value={formatCurrency(best.byCPV.v)} color="#16a34a" />}
        </div>
        {!best.byCPM && !best.byCTR && <p className="text-sm text-[var(--muted)]">Volume insuficiente para ranquear eficiência ainda.</p>}
      </AnalysisBox>

      {/* cards de criativos */}
      <div className="mt-6">
        {cards.length === 0 ? (
          <EmptyState message="Nenhum criativo com a métrica selecionada." />
        ) : (
          <>
            <p className="mb-3 text-xs text-[var(--muted)]">
              {cards.length} criativo{cards.length > 1 ? "s" : ""} · ordenados por <strong>{SORT_METRICS.find((m) => m.key === sortMetric)?.label}</strong>
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cards.map((c) => <CreativeCard key={c.id} c={c} sortMetric={sortMetric} />)}
            </div>
          </>
        )}
      </div>

      {/* tabela embaixo de tudo */}
      <Card title="Tabela de criativos" subtitle="Plataforma e métricas — ordenável e paginada" className="mt-6">
        <DataTable rows={scopeCreatives.filter((c) => c.totals.impressoes > 0)} columns={tableCols} initialSortKey="imp" pageSize={10} />
      </Card>
    </div>
  );
}

function CreativeCard({ c, sortMetric }: { c: CreativeAgg; sortMetric: MetricKey }) {
  const color = PLATFORM_COLORS[c.plataforma];
  const highlight = SORT_METRICS.find((m) => m.key === sortMetric)!;
  const baseMetrics: { key: MetricKey; label: string }[] = [
    { key: "investimento", label: "Investimento" },
    { key: "impressoes", label: "Impressões" },
    { key: "cliques", label: "Cliques" },
    { key: "ctr", label: "CTR" },
  ];
  const metrics = [
    { key: highlight.key, label: highlight.label, hi: true },
    ...baseMetrics.filter((m) => m.key !== highlight.key).slice(0, 3).map((m) => ({ ...m, hi: false })),
  ];
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm transition hover:shadow-md">
      <Thumb url={c.thumbnail} platform={c.plataforma} formatos={c.formatos} color={color} name={c.criativo} />
      <div className="flex flex-1 flex-col p-4">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color }}>{c.estrategia}</span>
        <h3 className="mt-0.5 line-clamp-2 text-sm font-bold text-[var(--ink)]" title={c.criativo}>{c.criativo}</h3>
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3">
          {metrics.map((m) => (
            <div key={m.key}>
              <p className="text-[11px] text-[var(--muted)]">{m.label}</p>
              <p className={`font-bold ${m.hi ? "text-base" : "text-sm text-[var(--ink)]"}`} style={m.hi ? { color } : undefined}>
                {c.totals[m.key] ? fmtMetric(c.totals[m.key], m.key) : "-"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Thumb({ url, platform, formatos, color, name }: { url: string; platform: Platform; formatos: number; color: string; name: string }) {
  const [error, setError] = useState(false);
  const resolved = resolveThumb(url);
  const showImg = resolved && !error;
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-[#23272e] to-[#15181c]">
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resolved} alt={name} loading="lazy" referrerPolicy="no-referrer" onError={() => setError(true)} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ffffff66" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>
          <span className="line-clamp-2 text-xs text-white/60">{name}</span>
        </div>
      )}
      <span className="absolute left-2 top-2 rounded-md px-2 py-0.5 text-[11px] font-bold text-white shadow" style={{ background: color }}>{platform === "Youtube" ? "YouTube" : platform}</span>
      <span className="absolute right-2 top-2 rounded-full bg-black/75 px-2.5 py-0.5 text-[11px] font-semibold text-white">{formatos} formato{formatos > 1 ? "s" : ""}</span>
    </div>
  );
}

function trunc(s: string, n = 22) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
function dash(v: number, f: (n: number) => string) {
  return v ? f(v) : "-";
}
