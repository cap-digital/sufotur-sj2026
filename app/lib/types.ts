export type Platform = "Meta" | "Youtube" | "Kwai";

export interface Row {
  data: string; // ISO date
  campanha: string;
  grupo: string;
  criativo: string;
  idade: string;
  genero: string;
  thumbnail: string;
  plataforma: Platform;
  estrategia: string;
  // métricas numéricas
  impressoes: number;
  cliques: number;
  engajamento: number;
  alcance: number;
  visualizacoes: number;
  v25: number;
  v50: number;
  v75: number;
  v100: number;
  investimento: number;
  ctr: number; // derivada (%)
}

export type MetricKey =
  | "investimento"
  | "impressoes"
  | "alcance"
  | "cliques"
  | "ctr"
  | "engajamento"
  | "visualizacoes";

export interface MetricDef {
  key: MetricKey;
  label: string;
  kind: "currency" | "int" | "percent";
}

export const METRICS: MetricDef[] = [
  { key: "investimento", label: "Investimento", kind: "currency" },
  { key: "impressoes", label: "Impressões", kind: "int" },
  { key: "alcance", label: "Alcance", kind: "int" },
  { key: "cliques", label: "Cliques", kind: "int" },
  { key: "ctr", label: "CTR", kind: "percent" },
  { key: "engajamento", label: "Engajamento", kind: "int" },
  { key: "visualizacoes", label: "Visualizações", kind: "int" },
];

export const PLATFORM_COLORS: Record<Platform, string> = {
  Meta: "#3FA9C9", // azul/teal Bahia
  Youtube: "#E12B2B", // vermelho Bahia
  Kwai: "#E8862B", // laranja Bahia
};

// Paleta Governo da Bahia para gráficos
export const BAHIA_PALETTE = [
  "#3FA9C9", // azul
  "#8BC53F", // verde
  "#E8862B", // laranja
  "#E6308A", // magenta
  "#E12B2B", // vermelho
  "#F2C230", // amarelo
  "#5B6770", // cinza
];
