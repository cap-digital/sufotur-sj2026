"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BAHIA_PALETTE } from "../lib/types";
import { formatCurrency, formatDecimal, formatInt, formatNumber, formatPercent } from "../lib/format";

type Fmt = "int" | "currency" | "compact" | "percent";

function fmt(v: number, kind: Fmt): string {
  if (kind === "currency") return formatCurrency(v, true);
  if (kind === "compact") return formatNumber(v);
  if (kind === "percent") return formatDecimal(v) + "%";
  return formatInt(v);
}

function fmtFull(v: number, kind: Fmt): string {
  if (kind === "currency") return formatCurrency(v);
  if (kind === "percent") return formatDecimal(v) + "%";
  return formatInt(v);
}

const axisStyle = { fontSize: 11, fill: "#6b7280" };

interface TipPayload {
  value?: number;
  name?: string | number;
  color?: string;
  payload?: { fill?: string };
}
interface TipProps {
  active?: boolean;
  payload?: TipPayload[];
  label?: string | number;
}

function ChartTooltip({ kind }: { kind: Fmt }) {
  function Content({ active, payload, label }: TipProps) {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs shadow-md">
        {label !== undefined && <p className="mb-1 font-semibold text-[var(--ink)]">{label}</p>}
        {payload.map((p, i) => (
          <p key={i} className="flex items-center gap-2 text-[var(--muted)]">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: p.color || p.payload?.fill }}
            />
            <span>{p.name}:</span>
            <span className="font-semibold text-[var(--ink)]">{fmtFull(p.value ?? 0, kind)}</span>
          </p>
        ))}
      </div>
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Content as any;
}

export interface BarDatum {
  name: string;
  value: number;
  color?: string;
}

/** Barras verticais com rótulos de dados sempre visíveis */
export function VerticalBars({
  data,
  kind = "compact",
  height = 280,
  color = "#3FA9C9",
}: {
  data: BarDatum[];
  kind?: Fmt;
  height?: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 24, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f2" />
        <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} interval={0} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v, "compact")} width={44} />
        <Tooltip content={ChartTooltip({ kind })} cursor={{ fill: "#00000008" }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={64} name="Valor" isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? color} />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            formatter={(v: number) => fmt(v, kind)}
            style={{ fontSize: 11, fontWeight: 700, fill: "#1a1d21" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Barras horizontais (bom para rankings) com rótulos */
export function HorizontalBars({
  data,
  kind = "compact",
  height = 320,
  color = "#3FA9C9",
}: {
  data: BarDatum[];
  kind?: Fmt;
  height?: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef0f2" />
        <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v, "compact")} />
        <YAxis type="category" dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} width={120} />
        <Tooltip content={ChartTooltip({ kind })} cursor={{ fill: "#00000008" }} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28} name="Valor" isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? color} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v: number) => fmt(v, kind)}
            style={{ fontSize: 11, fontWeight: 700, fill: "#1a1d21" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Donut com rótulos percentuais e legenda */
export function DonutChart({
  data,
  kind = "compact",
  height = 280,
}: {
  data: BarDatum[];
  kind?: Fmt;
  height?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius="52%"
          outerRadius="80%"
          paddingAngle={2}
          isAnimationActive={false}
          label={({ value }: { value: number }) =>
            `${((value / total) * 100).toFixed(1).replace(".", ",")}%`
          }
          labelLine={false}
          style={{ fontSize: 11, fontWeight: 700 }}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? BAHIA_PALETTE[i % BAHIA_PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip content={ChartTooltip({ kind })} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value) => <span style={{ color: "#374151" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Série temporal (linha) com rótulos */
export function TimeSeries({
  data,
  series,
  height = 300,
}: {
  data: Record<string, number | string>[];
  series: { key: string; label: string; color: string; kind: Fmt }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 24, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f2" />
        <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v, "compact")} width={44} />
        <Tooltip content={ChartTooltip({ kind: series[0]?.kind ?? "int" })} />
        <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2.5}
            dot={{ r: 3, fill: s.color }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          >
            <LabelList
              dataKey={s.key}
              position="top"
              formatter={(v: number) => fmt(v, "compact")}
              style={{ fontSize: 10, fontWeight: 700, fill: s.color }}
            />
          </Line>
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export type ChartKind = Fmt;

// ---------- Sparkline (SVG leve para KPIs) ----------
export function Sparkline({
  values,
  color = "#3FA9C9",
  width = 96,
  height = 30,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (!values.length) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : width;
  const pts = values.map((v, i) => {
    const x = values.length === 1 ? width / 2 : i * stepX;
    const y = height - 3 - ((v - min) / range) * (height - 6);
    return [x, y];
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `0,${height} ${line} ${width},${height}`;
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polygon points={area} fill={color} opacity={0.12} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={2.4} fill={color} />
    </svg>
  );
}

// ---------- Barras empilhadas ----------
export interface StackKey {
  key: string;
  label: string;
  color: string;
}
export function StackedBars({
  data,
  keys,
  kind = "compact",
  height = 300,
  layout = "horizontal",
}: {
  data: Record<string, number | string>[];
  keys: StackKey[];
  kind?: Fmt;
  height?: number;
  layout?: "horizontal" | "vertical";
}) {
  const vertical = layout === "vertical";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} margin={{ top: 16, right: vertical ? 48 : 8, left: vertical ? 8 : 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f2" vertical={vertical} horizontal={!vertical} />
        {vertical ? (
          <>
            <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v, "compact")} />
            <YAxis type="category" dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} width={110} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} interval={0} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v, "compact")} width={44} />
          </>
        )}
        <Tooltip content={ChartTooltip({ kind })} cursor={{ fill: "#00000008" }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
        {keys.map((k, i) => (
          <Bar key={k.key} dataKey={k.key} name={k.label} stackId="s" fill={k.color} maxBarSize={48} isAnimationActive={false} radius={i === keys.length - 1 ? (vertical ? [0, 5, 5, 0] : [5, 5, 0, 0]) : undefined}>
            <LabelList
              dataKey={k.key}
              position="center"
              formatter={(v: number) => (v > 0 ? fmt(v, kind) : "")}
              style={{ fontSize: 10, fontWeight: 700, fill: "#ffffff" }}
            />
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------- Barras agrupadas ----------
export function GroupedBars({
  data,
  keys,
  kind = "compact",
  height = 300,
}: {
  data: Record<string, number | string>[];
  keys: StackKey[];
  kind?: Fmt;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 22, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f2" />
        <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} interval={0} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v, "compact")} width={44} />
        <Tooltip content={ChartTooltip({ kind })} cursor={{ fill: "#00000008" }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
        {keys.map((k) => (
          <Bar key={k.key} dataKey={k.key} name={k.label} fill={k.color} maxBarSize={40} radius={[5, 5, 0, 0]} isAnimationActive={false}>
            <LabelList dataKey={k.key} position="top" formatter={(v: number) => (v ? fmt(v, kind) : "")} style={{ fontSize: 10, fontWeight: 700, fill: "#1a1d21" }} />
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------- Radar comparativo (valores normalizados 0-100 por eixo) ----------
export function RadarCompare({
  axes,
  series,
  height = 320,
}: {
  axes: string[];
  series: { name: string; color: string; values: number[] }[];
  height?: number;
}) {
  // normaliza cada eixo para 0-100 pelo máximo entre as séries
  const maxPerAxis = axes.map((_, ai) => Math.max(1, ...series.map((s) => s.values[ai] ?? 0)));
  const data = axes.map((ax, ai) => {
    const row: Record<string, number | string> = { axis: ax };
    series.forEach((s) => {
      row[s.name] = Math.round(((s.values[ai] ?? 0) / maxPerAxis[ai]) * 100);
    });
    return row;
  });
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: "#374151" }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "#9ca3af" }} tickFormatter={(v) => `${v}%`} />
        {series.map((s) => (
          <Radar key={s.name} name={s.name} dataKey={s.name} stroke={s.color} fill={s.color} fillOpacity={0.18} strokeWidth={2} isAnimationActive={false} />
        ))}
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Tooltip content={ChartTooltip({ kind: "percent" })} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ---------- Gráfico de projeção (realizado sólido + projeção tracejada) ----------
export interface ProjPoint {
  name: string;
  [k: string]: number | string | null;
}
export function ProjectionChart({
  data,
  series,
  height = 320,
}: {
  data: ProjPoint[];
  // para cada série: chave do realizado (key) e da projeção (key+"Proj")
  series: { key: string; label: string; color: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 20, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f2" />
        <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={42} domain={[0, "auto"]} />
        <Tooltip content={ChartTooltip({ kind: "percent" })} />
        <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
        <ReferenceLine y={100} stroke="#16a34a" strokeDasharray="4 4" label={{ value: "Meta 100%", position: "insideTopRight", fontSize: 10, fill: "#16a34a" }} />
        {series.map((s) => [
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2.5} dot={{ r: 3, fill: s.color }} isAnimationActive={false} connectNulls />,
          <Line key={s.key + "Proj"} type="monotone" dataKey={s.key + "Proj"} name={`${s.label} (projeção)`} stroke={s.color} strokeWidth={2} strokeDasharray="6 5" dot={false} isAnimationActive={false} connectNulls legendType="none" />,
        ])}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ---------- Mapa de calor ----------
export function Heatmap({
  rows,
  cols,
  getValue,
  color = "#3FA9C9",
  format,
}: {
  rows: string[];
  cols: string[];
  getValue: (row: string, col: string) => number;
  color?: string;
  format: (v: number) => string;
}) {
  const cells = rows.flatMap((r) => cols.map((c) => getValue(r, c)));
  const max = Math.max(1, ...cells);
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[420px] border-separate" style={{ borderSpacing: 3 }}>
        <thead>
          <tr>
            <th className="w-20" />
            {cols.map((c) => (
              <th key={c} className="px-1 pb-1 text-center text-[11px] font-semibold text-[var(--muted)]">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <td className="pr-2 text-right text-[11px] font-semibold text-[var(--muted)] whitespace-nowrap">{r}</td>
              {cols.map((c) => {
                const v = getValue(r, c);
                const intensity = v / max;
                const dark = intensity > 0.55;
                return (
                  <td key={c} className="p-0">
                    <div
                      className="flex h-10 items-center justify-center rounded-md text-[11px] font-bold transition"
                      style={{
                        background: v ? withAlpha(color, 0.12 + intensity * 0.88) : "#f3f4f6",
                        color: v ? (dark ? "#fff" : "#1a1d21") : "#cbd0d6",
                      }}
                      title={`${r} · ${c}: ${format(v)}`}
                    >
                      {v ? format(v) : "–"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Funil (formato de funil de verdade) ----------
export interface FunnelStage {
  name: string;
  value: number;
  color?: string;
}
export function FunnelChart({
  data,
  format,
}: {
  data: FunnelStage[];
  format: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const minW = 16; // largura mínima p/ legibilidade quando há quedas bruscas
  const widths = data.map((d) => Math.max(minW, (d.value / max) * 100));
  const palette = ["#3FA9C9", "#8BC53F", "#E8862B", "#E6308A", "#E12B2B"];
  const top = data[0]?.value || 1;

  const colorOf = (d: FunnelStage, i: number) => d.color ?? palette[i % palette.length];

  return (
    <div>
      <div className="flex flex-col py-1">
        {data.map((d, i) => {
          const topW = widths[i];
          const botW = i < data.length - 1 ? widths[i + 1] : Math.max(minW * 0.7, topW * 0.6);
          const lt = (100 - topW) / 2;
          const rt = 100 - lt;
          const lb = (100 - botW) / 2;
          const rb = 100 - lb;
          const clip = `polygon(${lt}% 0, ${rt}% 0, ${rb}% 100%, ${lb}% 100%)`;
          const color = colorOf(d, i);
          const conv = i === 0 ? 100 : (d.value / top) * 100;
          const stepConv = i === 0 ? 100 : (d.value / (data[i - 1].value || 1)) * 100;
          return (
            <div key={i} className="flex items-stretch" style={{ height: 72 }}>
              {/* trapézio (formato de funil) — apenas o valor dentro */}
              <div className="relative flex-1">
                <div className="absolute inset-0" style={{ background: color, clipPath: clip }} />
                <div className="absolute inset-0 flex items-center justify-center text-center text-white">
                  <span className="text-lg font-extrabold leading-tight drop-shadow-sm">{format(d.value)}</span>
                </div>
              </div>
              {/* % para fora, como legenda */}
              <div className="flex w-24 shrink-0 flex-col justify-center border-l border-[var(--border)] pl-3">
                <span className="text-sm font-bold tabular-nums" style={{ color }}>
                  {i === 0 ? "100%" : formatPercent(conv)}
                </span>
                <span className="text-[10px] text-[var(--muted)]">
                  {i === 0 ? "do topo" : `${formatPercent(stepConv)} da etapa`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* legenda de cores com os nomes das etapas */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 border-t border-[var(--border)] pt-3">
        {data.map((d, i) => (
          <span key={i} className="flex items-center gap-1.5 text-xs">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colorOf(d, i) }} />
            <span className="font-medium text-[var(--ink)]">{d.name}</span>
            <span className="text-[var(--muted)]">· {format(d.value)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function withAlpha(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}
