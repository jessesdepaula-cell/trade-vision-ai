import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// EA chama: GET /api/mt5/poll?token=tvai_xxx
// Retorna ordens PENDING, marca como SENT e devolve para o EA executar.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "token obrigatório" }, { status: 401 });
  }

  const account = await prisma.mT5Account.findUnique({
    where: { apiToken: token },
  });
  if (!account) {
    return NextResponse.json({ error: "token inválido" }, { status: 401 });
  }

  // marca last seen
  await prisma.mT5Account.update({
    where: { id: account.id },
    data: { lastSeenAt: new Date() },
  });

  // pega pendentes (até 10)
  const pending = await prisma.mT5Order.findMany({
    where: { accountId: account.id, status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  if (pending.length === 0) {
    return NextResponse.json({ orders: [] });
  }

  // marca como SENT (lock otimista)
  const ids = pending.map((p) => p.id);
  await prisma.mT5Order.updateMany({
    where: { id: { in: ids }, status: "PENDING" },
    data: { status: "SENT", pickedAt: new Date() },
  });

  return NextResponse.json({
    orders: pending.map((o) => ({
      id: o.id,
      symbol: o.symbol,
      side: o.side,
      volume: o.volume,
      entryType: o.entryType,
      entryPrice: o.entryPrice,
      stopLoss: o.stopLoss,
      takeProfit: o.takeProfit,
      comment: o.comment,
    })),
  });
}
