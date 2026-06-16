import { NextResponse } from "next/server";

// O dashboard busca os dados da Edge Function do Supabase. Fazer esse fetch
// direto do browser depende de o resolver DNS do cliente conseguir resolver
// o host *.supabase.co — em algumas redes/ISPs isso falha e o browser devolve
// "Failed to fetch". Ao buscar pelo servidor (mesma origem para o browser), o
// cliente só precisa resolver o próprio domínio do app, e a chave deixa de ser
// exposta no bundle.

const ENDPOINT =
  "https://cqrpbiepyeypbkizwacu.supabase.co/functions/v1/SufoturSJ2026";
const KEY = "sb_publishable_YN9YKLw6sludrgf9T2i_1g_Dcm8dIiK";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        apikey: KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Functions" }),
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `upstream ${res.status}` },
        { status: 502 }
      );
    }
    const json = await res.json();
    return NextResponse.json(json, {
      headers: {
        // Cache curto no edge da Vercel: alivia carga sem deixar os dados velhos.
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }
}
