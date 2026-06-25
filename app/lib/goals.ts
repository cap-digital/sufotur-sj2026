import { MetricKey, Platform, Row } from "./types";

// Encerramento da campanha São João 2026 — campanha finalizada nesta data.
// Linhas posteriores (sincronizações parciais) são descartadas no carregamento.
export const CAMPAIGN_END = "2026-06-24";

export interface Goal {
  plataforma: Platform;
  estrategia: string;
  investimento: number; // valor contratado
  metricKey: MetricKey; // métrica de entrega contratada
  metricLabel: string;
  metricGoal: number; // meta da métrica de entrega
}

// Metas contratadas por plataforma + estratégia (Campanha São João 2026)
export const GOALS: Goal[] = [
  {
    plataforma: "Meta",
    estrategia: "Alcance",
    investimento: 130000,
    metricKey: "impressoes",
    metricLabel: "Impressões",
    metricGoal: 11818182,
  },
  {
    plataforma: "Meta",
    estrategia: "Engajamento",
    investimento: 45000,
    metricKey: "engajamento",
    metricLabel: "Engajamento",
    metricGoal: 50000,
  },
  {
    plataforma: "Kwai",
    estrategia: "Alcance",
    investimento: 75000,
    metricKey: "impressoes",
    metricLabel: "Impressões",
    metricGoal: 3750000,
  },
];

export const TOTAL_INVESTMENT_GOAL = GOALS.reduce((s, g) => s + g.investimento, 0);

/**
 * Investimento realizado com cada (plataforma × estratégia) contratada limitado
 * ao valor contratado (verba aplicada). Recebe linhas já filtradas pela página,
 * então respeita automaticamente os filtros ativos (teto total 250.000; Meta
 * 175.000 — Alcance 130.000 / Engajamento 45.000; Kwai 75.000). Estratégias sem
 * contrato passam sem teto.
 */
export function cappedInvestmentTotal(rows: Row[]): number {
  const spent: Record<string, number> = {};
  for (const r of rows) {
    const k = `${r.plataforma}__${r.estrategia}`;
    spent[k] = (spent[k] ?? 0) + r.investimento;
  }
  return Object.keys(spent).reduce((total, k) => {
    const [plat, estr] = k.split("__");
    const goal = GOALS.find((g) => g.plataforma === plat && g.estrategia === estr);
    const v = spent[k];
    return total + (goal ? Math.min(v, goal.investimento) : v);
  }, 0);
}
