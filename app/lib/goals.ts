import { MetricKey, Platform } from "./types";

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
