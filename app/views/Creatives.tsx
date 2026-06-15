"use client";

import React, { useMemo, useState } from "react";
import { derived, groupBy, resolveThumb, sumRows, Totals } from "../lib/data";
import { MetricKey, PLATFORM_COLORS, Platform, Row } from "../lib/types";
import { formatCurrency, formatInt, formatNumber, formatPercent } from "../lib/format";
import { ButtonGroup, Card, EmptyState, SectionTitle, Select } from "../components/ui";
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

  // escopo (responde ao filtro de plataforma)
  const scopeRows = useMemo(() => (platform === "all" ? rows : rows.filter((r) => r.plataforma === platform)), [rows, platform]);
  const scopeCreatives = useMemo(() => aggregate(scopeRows), [scopeRows]);
  const t = useMemo(() => sumRows(scopeRows), [scopeRows]);
  const dv = useMemo(() => derived(t), [t]);
  const campaigns = useMemo(() => new Set(scopeRows.map((r) => r.campanha).filter(Boolean)).size, [scopeRows]);

  // cards: prioridade filtro de botão > exclui métrica base = 0 > ordena
  const cards = useMemo(() => {
    return scopeCreatives.filter((c) => (c.totals[sortMetric] ?? 0) > 0).sort((a, b) => (b.totals[sortMetric] ?? 0) - (a.totals[sortMetric] ?? 0));
  }, [scopeCreatives, sortMetric]);

  // melhores por custo e taxa (com volume mínimo p/ ser justo)
  const best = useMemo(() => {
    const elig = scopeCreatives.filter((c) => c.totals.impressoes >= 1000);
    const byCTR = [...elig].sort((a, b) => b.totals.ctr - a.totals.ctr)[0];
    const byCPC = [...elig].map((c) => ({ c, v: derived(c.totals).cpc })).filter((x) => x.v > 0).sort((a, b) => a.v - b.v)[0];
    const byCPE = [...elig].map((c) => ({ c, v: derived(c.totals).cpe })).filter((x) => x.v > 0).sort((a, b) => a.v - b.v)[0];
    return { byCTR, byCPC, byCPE };
  }, [scopeCreatives]);

  // tabela (todos os criativos do escopo)
  const tableCols: Column<CreativeAgg>[] = [
    { key: "criativo", header: "Criativo", sortValue: (r) => r.criativo, render: (r) => (
      <div className="max-w-[220px]"><p className="truncate font-medium">{r.criativo}</p><p className="text-xs text-[var(--muted)]">{r.estrategia}</p></div>
    ) },
    { key: "plat", header: "Plataforma", sortValue: (r) => r.plataforma, render: (r) => (
      <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: PLATFORM_COLORS[r.plataforma] }} />{r.plataforma}</span>
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
      <SectionTitle sub="Desempenho por peça criativa — imagens, formatos e métricas" accent="#E6308A">Criativos</SectionTitle>

      {/* filtros */}
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-semibold text-[var(--muted)] sm:inline">Plataforma</span>
          <ButtonGroup<Platform | "all">
            value={platform}
            onChange={setPlatform}
            options={[
              { label: "Todas", value: "all", color: "#1a1d21" },
              { label: "Meta", value: "Meta", color: "#3FA9C9" },
              { label: "Kwai", value: "Kwai", color: "#E8862B" },
            ]}
          />
        </div>
        <Select label="Ordenar por" value={sortMetric} onChange={(v) => setSortMetric(v as MetricKey)} options={SORT_METRICS.map((m) => ({ label: m.label, value: m.key }))} />
      </div>

      {/* HERO — visão geral dos criativos */}
      <Hero
        kpis={[
          { label: "Investimento", value: formatCurrency(t.investimento) },
          { label: "Impressões", value: formatNumber(t.impressoes), sub: formatInt(t.impressoes) },
          { label: "Cliques", value: formatNumber(t.cliques), sub: formatInt(t.cliques) },
          { label: "Engajamento", value: formatNumber(t.engajamento), sub: formatInt(t.engajamento) },
        ]}
      />

      {/* KPIs secundários */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniKpi label="Criativos únicos" value={formatInt(scopeCreatives.length)} hint="ativos" accent="#E6308A" />
        <MiniKpi label="Campanhas" value={formatInt(campaigns)} hint="no período" accent="#3FA9C9" />
        <MiniKpi label="CPM" value={dv.cpm ? formatCurrency(dv.cpm) : "—"} hint="custo / mil impr." accent="#8BC53F" />
        <MiniKpi label="CTR" value={formatPercent(t.ctr)} hint="média" accent="#E8862B" />
      </div>

      {/* Cards de destaque por eficiência */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {best.byCTR && best.byCTR.totals.ctr > 0 && (
          <Highlight
            label="Melhor CTR"
            accent="#3FA9C9"
            name={best.byCTR.criativo}
            value={formatPercent(best.byCTR.totals.ctr)}
            sub={`${formatInt(best.byCTR.totals.cliques)} cliques em ${formatInt(best.byCTR.totals.impressoes)} impressões`}
            icon="click"
            platform={platform === "all" ? best.byCTR.plataforma : undefined}
          />
        )}
        {best.byCPC && (
          <Highlight
            label="Menor custo por clique"
            accent="#E8862B"
            name={best.byCPC.c.criativo}
            value={formatCurrency(best.byCPC.v)}
            sub={`${formatInt(best.byCPC.c.totals.cliques)} cliques · ${formatCurrency(best.byCPC.c.totals.investimento)} investidos`}
            icon="user"
            platform={platform === "all" ? best.byCPC.c.plataforma : undefined}
          />
        )}
        {best.byCPE && (
          <Highlight
            label="Menor custo por engajamento"
            accent="#E6308A"
            name={best.byCPE.c.criativo}
            value={formatCurrency(best.byCPE.v)}
            sub={`${formatInt(best.byCPE.c.totals.engajamento)} engajamentos · ${formatCurrency(best.byCPE.c.totals.investimento)} investidos`}
            icon="heart"
            platform={platform === "all" ? best.byCPE.c.plataforma : undefined}
          />
        )}
        {!best.byCTR && !best.byCPC && !best.byCPE && (
          <div className="lg:col-span-3"><EmptyState message="Volume insuficiente para ranquear eficiência ainda (≥ 1.000 impressões)." /></div>
        )}
      </div>

      {/* Galeria de criativos */}
      <div className="mt-5 overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-[#2b88a8] via-[#247a98] to-[#1d6580] px-5 py-4 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold">Galeria de Criativos</h3>
            <p className="text-xs text-white/70">
              {cards.length} criativo{cards.length === 1 ? "" : "s"} · ordenados por {SORT_METRICS.find((m) => m.key === sortMetric)?.label}
            </p>
          </div>
          <Select label="Ordenar por" value={sortMetric} onChange={(v) => setSortMetric(v as MetricKey)} options={SORT_METRICS.map((m) => ({ label: m.label, value: m.key }))} />
        </div>

        <div className="mt-4">
          {cards.length === 0 ? (
            <EmptyState message="Nenhum criativo com a métrica selecionada." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cards.map((c) => <CreativeCard key={c.id} c={c} sortMetric={sortMetric} />)}
            </div>
          )}
        </div>
      </div>

      {/* tabela embaixo de tudo */}
      <Card title="Tabela de criativos" subtitle="Plataforma e métricas — ordenável e paginada" className="mt-6 rounded-2xl">
        <DataTable rows={scopeCreatives.filter((c) => c.totals.impressoes > 0)} columns={tableCols} initialSortKey="imp" pageSize={10} />
      </Card>
    </div>
  );
}

/* ---------- HERO ---------- */
function Hero({ kpis }: { kpis: { label: string; value: string; sub?: string }[] }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2b88a8] via-[#247a98] to-[#1d6580] p-6 text-white shadow-lg ring-1 ring-black/5 sm:p-7">
      {/* brilhos festivos */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle,#F2C230,transparent 70%)" }} aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle,#E6308A,transparent 70%)" }} aria-hidden />

      <div className="relative flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5M4 19h16M8 16v-5M13 16V8M18 16v-9" /></svg>
        </span>
        <h2 className="text-sm font-bold uppercase tracking-wide">Visão Geral — Criativos</h2>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label}>
            <span className="mb-1.5 block h-1 w-8 rounded-full bg-white/30" aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/65">{k.label}</p>
            <p className="mt-1 text-2xl font-extrabold leading-none tabular-nums sm:text-3xl">{k.value}</p>
            {k.sub && <p className="mt-1 text-[11px] text-white/55 tabular-nums">{k.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- KPI secundário ---------- */
function MiniKpi({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm ring-1 ring-black/5">
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} aria-hidden />
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-[var(--ink)]">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

/* ---------- Card de destaque ---------- */
function Highlight({
  label, accent, name, value, sub, icon, platform,
}: {
  label: string; accent: string; name: string; value: string; sub: string; icon: "click" | "user" | "heart"; platform?: Platform;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${accent}1f`, color: accent }} aria-hidden>
          <HighlightIcon icon={icon} />
        </span>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{label}</span>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--bg)] px-3 py-2">
        {platform && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: PLATFORM_COLORS[platform] }} />}
        <span className="truncate text-sm font-semibold text-[var(--ink)]" title={name}>{name}</span>
      </div>

      <p className="mt-3 text-3xl font-extrabold tabular-nums" style={{ color: accent }}>{value}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{sub}</p>
    </div>
  );
}

function HighlightIcon({ icon }: { icon: "click" | "user" | "heart" }) {
  if (icon === "user")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.3 3.6-5.5 8-5.5s8 2.2 8 5.5" /></svg>
    );
  if (icon === "heart")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20Z" /></svg>
    );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l4 13 2.3-5.2L16.5 8.5 5 3Z" /><path d="M13 13l5 5" /></svg>
  );
}

/* ---------- Card de criativo (galeria) ---------- */
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
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg">
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
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-[#eaf6fb] via-[#fdeef3] to-[#fff7e8]">
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resolved} alt={name} loading="lazy" referrerPolicy="no-referrer" onError={() => setError(true)} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#3FA9C9" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>
          <span className="line-clamp-2 text-xs text-[var(--muted)]">{name}</span>
        </div>
      )}
      <span className="absolute left-2 top-2 rounded-lg px-2 py-0.5 text-[11px] font-bold text-white shadow" style={{ background: color }}>{platform}</span>
      <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">{formatos} formato{formatos > 1 ? "s" : ""}</span>
    </div>
  );
}

function dash(v: number, f: (n: number) => string) {
  return v ? f(v) : "-";
}
