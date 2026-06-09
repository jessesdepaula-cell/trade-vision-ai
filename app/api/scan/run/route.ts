import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/subscription";
import { scanAllActiveForUser, scanWatchlistItem } from "@/lib/scan/orchestrator";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/scan/run
// Body opcional: { watchlistId } → scan apenas desse item
// Sem body → scan de toda a watchlist ativa do usuário
export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { watchlistId?: string }
    | null;

  if (body?.watchlistId) {
    const { prisma } = await import("@/lib/prisma");
    const w = await prisma.watchlist.findFirst({
      where: { id: body.watchlistId, userId: user.id },
    });
    if (!w) {
      return NextResponse.json({ error: "Watchlist não encontrada" }, { status: 404 });
    }
    const r = await scanWatchlistItem({
      userId: user.id,
      watchlistId: w.id,
      symbol: w.symbol,
      timeframe: w.timeframe,
      mode: w.mode as "SMC" | "CLASSICO",
    });
    return NextResponse.json(r, { status: r.ok ? 200 : 502 });
  }

  const results = await scanAllActiveForUser(user.id);
  return NextResponse.json({ ok: true, results });
}
