/**
 * Appelée une fois par jour par le cron Vercel (vercel.json).
 * Une simple lecture du graphe (R5) : limite la mise en pause de Neo4j Aura Free après 72 h d'inactivité.
 */
export async function GET() {
  const api = process.env.VITE_API_URL?.trim().replace(/\/$/, "");
  if (!api) return Response.json({ ok: false, detail: "VITE_API_URL absente" }, { status: 500 });
  try {
    const res = await fetch(`${api}/api/graph/competences`, { signal: AbortSignal.timeout(20000) });
    return Response.json({ ok: res.ok, status: res.status }, { status: res.ok ? 200 : 502 });
  } catch {
    return Response.json({ ok: false, detail: "API injoignable" }, { status: 502 });
  }
}
