import { NextRequest, NextResponse } from "next/server";

// Kwai não expõe um endpoint de thumbnail derivável da URL (como o YouTube faz
// com img.youtube.com/vi/<id>). A imagem só existe na meta tag og:image da
// página, que precisa ser lida no servidor (o browser é bloqueado por CORS).
// Esta rota resolve a og:image e redireciona para ela, com cache no edge.

const ALLOWED_HOSTS = [
  "kwai.com",
  "www.kwai.com",
  "k.kwai.com",
  "kwai-video.com",
  "m.kwai.com",
];

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

function isAllowed(url: URL): boolean {
  return ALLOWED_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
}

function extractOgImage(html: string): string | null {
  const m =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  return m ? m[1] : null;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("u");
  if (!raw) return NextResponse.json({ error: "missing ?u" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
  if (!isAllowed(target)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 400 });
  }

  try {
    const res = await fetch(target.toString(), {
      // Kwai (Nuxt SSR) só renderiza a og:image quando recebe headers de
      // browser completos (Accept + Accept-Language); com Accept simples ele
      // devolve uma variante sem as meta tags.
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      return NextResponse.json({ error: `upstream ${res.status}` }, { status: 502 });
    }
    const html = await res.text();
    const img = extractOgImage(html);
    if (!img) {
      return NextResponse.json({ error: "og:image not found" }, { status: 404 });
    }
    return NextResponse.redirect(img, {
      status: 302,
      headers: {
        // Cacheia no edge da Vercel por 1 dia (a imagem do criativo não muda).
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }
}
