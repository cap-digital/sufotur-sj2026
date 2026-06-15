import { MetricKey, Platform, Row } from "./types";
import { toNumber } from "./format";

const ENDPOINT = "https://cqrpbiepyeypbkizwacu.supabase.co/functions/v1/SufoturSJ2026";
const KEY = "sb_publishable_YN9YKLw6sludrgf9T2i_1g_Dcm8dIiK";

const VALID_PLATFORMS: Platform[] = ["Meta", "Youtube", "Kwai"];

interface RawRow {
  [k: string]: string | number;
}

function normalize(raw: RawRow): Row | null {
  const plataforma = String(raw["Plataforma"] ?? "").trim() as Platform;
  // Filtra linhas-lixo (ex: "Meta"() ) e plataformas inválidas
  if (!VALID_PLATFORMS.includes(plataforma)) return null;
  if (!raw["Nome Campanha"]) return null;

  const impressoes = toNumber(raw["Impressões"]);
  const cliques = toNumber(raw["Cliques"]);
  const ctr = impressoes > 0 ? (cliques / impressoes) * 100 : 0;

  return {
    data: String(raw["Data"] ?? ""),
    campanha: String(raw["Nome Campanha"] ?? "").trim(),
    grupo: String(raw["Grupo Anúncio"] ?? "").trim(),
    criativo: String(raw["Nome Criativo"] ?? "").trim() || "(sem nome)",
    idade: normAge(String(raw["Idade"] ?? "").trim()),
    genero: normGender(String(raw["Gênero"] ?? "").trim()),
    thumbnail: String(raw["ThumbnailURL"] ?? "").trim(),
    plataforma,
    estrategia: String(raw["Estratégia "] ?? raw["Estratégia"] ?? "").trim() || "—",
    impressoes,
    cliques,
    engajamento: toNumber(raw["Engajamento"]),
    alcance: toNumber(raw["Alcance"]),
    visualizacoes: toNumber(raw["Visualizações"]),
    v25: toNumber(raw["Visualização 25%"]),
    v50: toNumber(raw["Visualização 50%"]),
    v75: toNumber(raw["Visualização 75%"]),
    v100: toNumber(raw["Visualização 100%"]),
    investimento: toNumber(raw["Investimento"]),
    ctr,
  };
}

function normAge(a: string): string {
  if (!a || a.toLowerCase() === "unknown") return "N/D";
  return a;
}

function normGender(g: string): string {
  const l = g.toLowerCase();
  if (l === "female" || l === "feminino") return "Feminino";
  if (l === "male" || l === "masculino") return "Masculino";
  if (!l || l === "unknown") return "Não informado";
  return g;
}

export async function fetchData(): Promise<{ rows: Row[]; timestamp: string }> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      apikey: KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "Functions" }),
  });
  if (!res.ok) throw new Error(`Erro ${res.status} ao carregar dados`);
  const json = await res.json();
  const list: RawRow[] = json.consolidado ?? [];
  return {
    rows: list.map(normalize).filter((r): r is Row => r !== null),
    timestamp: typeof json.timestamp === "string" ? json.timestamp : "",
  };
}

export async function fetchRows(): Promise<Row[]> {
  return (await fetchData()).rows;
}

// ---------- Agregações ----------

export interface Totals {
  investimento: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  engajamento: number;
  visualizacoes: number;
  v25: number;
  v50: number;
  v75: number;
  v100: number;
  ctr: number; // derivada
  registros: number;
}

export function sumRows(rows: Row[]): Totals {
  const t: Totals = {
    investimento: 0, impressoes: 0, alcance: 0, cliques: 0, engajamento: 0,
    visualizacoes: 0, v25: 0, v50: 0, v75: 0, v100: 0, ctr: 0, registros: rows.length,
  };
  for (const r of rows) {
    t.investimento += r.investimento;
    t.impressoes += r.impressoes;
    t.alcance += r.alcance;
    t.cliques += r.cliques;
    t.engajamento += r.engajamento;
    t.visualizacoes += r.visualizacoes;
    t.v25 += r.v25;
    t.v50 += r.v50;
    t.v75 += r.v75;
    t.v100 += r.v100;
  }
  t.ctr = t.impressoes > 0 ? (t.cliques / t.impressoes) * 100 : 0;
  return t;
}

export function metricValue(t: Totals, key: MetricKey): number {
  return t[key];
}

/** Agrupa linhas por uma chave e soma as métricas */
export function groupBy<K extends string>(
  rows: Row[],
  keyFn: (r: Row) => K
): { key: K; rows: Row[]; totals: Totals }[] {
  const map = new Map<K, Row[]>();
  for (const r of rows) {
    const k = keyFn(r);
    const arr = map.get(k);
    if (arr) arr.push(r);
    else map.set(k, [r]);
  }
  return Array.from(map.entries()).map(([key, rs]) => ({
    key,
    rows: rs,
    totals: sumRows(rs),
  }));
}

// ---------- Tempo / dia da semana ----------

export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Índice 0-6 (Dom-Sáb) a partir da parte de data ISO, sem viés de fuso */
export function weekdayIndex(iso: string): number {
  if (!iso) return -1;
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return -1;
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** dd/mm a partir de ISO */
export function shortDate(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split("-");
  return d && m ? `${d}/${m}` : iso;
}

/** Limites (min/max) de data (yyyy-mm-dd) presentes nas linhas */
export function dateBounds(rows: Row[]): { min: string; max: string } | null {
  const days = rows.map((r) => r.data.slice(0, 10)).filter(Boolean).sort();
  if (days.length === 0) return null;
  return { min: days[0], max: days[days.length - 1] };
}

/** Soma k dias a uma data yyyy-mm-dd */
export function shiftDate(date: string, k: number): string {
  return new Date(Date.parse(date + "T00:00:00Z") + k * 86400000).toISOString().slice(0, 10);
}

/** Série diária ordenada com totais por dia */
export function dailyTotals(rows: Row[]): { date: string; totals: Totals }[] {
  return groupBy(rows.filter((r) => r.data), (r) => r.data.slice(0, 10))
    .map((g) => ({ date: g.key, totals: g.totals }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Valores diários de uma métrica (para sparklines) */
export function dailyValues(rows: Row[], key: keyof Totals): number[] {
  return dailyTotals(rows).map((d) => d.totals[key] as number);
}

/** Pivota por dia (linhas) × categoria (colunas) somando uma métrica — p/ barras empilhadas/agrupadas */
export function pivotByDay(
  rows: Row[],
  catFn: (r: Row) => string,
  key: keyof Totals
): { data: Record<string, number | string>[]; cats: string[] } {
  const cats = Array.from(new Set(rows.map(catFn))).sort();
  const days = dailyTotals(rows);
  const data = days.map((d) => {
    const dayRows = rows.filter((r) => r.data.slice(0, 10) === d.date);
    const row: Record<string, number | string> = { name: shortDate(d.date) };
    for (const c of cats) {
      row[c] = sumRows(dayRows.filter((r) => catFn(r) === c))[key] as number;
    }
    return row;
  });
  return { data, cats };
}

/** Matriz categoria × dia-da-semana com soma de métrica — para heatmap */
export function weekdayMatrix(
  rows: Row[],
  rowFn: (r: Row) => string,
  key: keyof Totals
): { get: (rowKey: string, weekday: string) => number } {
  const map = new Map<string, number>();
  for (const r of rows) {
    const wd = weekdayIndex(r.data);
    if (wd < 0) continue;
    const k = `${rowFn(r)}__${WEEKDAYS[wd]}`;
    map.set(k, (map.get(k) ?? 0) + (r[keyToRowKey(key)] as number));
  }
  return { get: (rk, wd) => map.get(`${rk}__${wd}`) ?? 0 };
}

// mapeia chave de Totals para a chave equivalente em Row (mesmos nomes na prática)
function keyToRowKey(key: keyof Totals): keyof Row {
  return key as unknown as keyof Row;
}

// ---------- Métricas derivadas de custo/taxa ----------

export interface Derived {
  cpm: number; // custo por mil impressões
  cpc: number; // custo por clique
  cpv: number; // custo por visualização
  cpe: number; // custo por engajamento
  cpa: number; // custo por mil de alcance
  engRate: number; // taxa de engajamento (%)
  vtr: number; // view-through rate (%) sobre impressões
}

export function derived(t: Totals): Derived {
  return {
    cpm: t.impressoes ? (t.investimento / t.impressoes) * 1000 : 0,
    cpc: t.cliques ? t.investimento / t.cliques : 0,
    cpv: t.visualizacoes ? t.investimento / t.visualizacoes : 0,
    cpe: t.engajamento ? t.investimento / t.engajamento : 0,
    cpa: t.alcance ? (t.investimento / t.alcance) * 1000 : 0,
    engRate: t.impressoes ? (t.engajamento / t.impressoes) * 100 : 0,
    vtr: t.impressoes ? (t.visualizacoes / t.impressoes) * 100 : 0,
  };
}

// ---------- Resolução de thumbnails ----------

/** Converte URLs (fbcdn, youtube, drive) em uma imagem exibível */
export function resolveThumb(url: string): string | null {
  if (!url) return null;
  // YouTube
  const yt = url.match(/(?:youtu\.be\/|shorts\/|live\/|embed\/|v=)([\w-]{6,})/);
  if (yt) return `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`;
  // Google Drive
  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive) return `https://drive.google.com/thumbnail?id=${drive[1]}&sz=w600`;
  // Kwai não tem thumbnail derivável da URL; a imagem está na og:image da
  // página, resolvida no servidor por /api/kwai-thumb.
  if (/(?:^|\.)kwai(?:-video)?\.com\//.test(url)) {
    return `/api/kwai-thumb?u=${encodeURIComponent(url)}`;
  }
  // Imagem direta
  if (/^https?:\/\//.test(url)) return url;
  return null;
}
