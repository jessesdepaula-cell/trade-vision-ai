import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// EA chama: POST /api/mt5/confirm?token=tvai_xxx
// Body: { orderId, mt5Ticket?, error? }
export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "token obrigatório" }, { status: 401 });
  }
  const account = await prisma.mT5Account.findUnique({ where: { apiToken: token } });
  if (!account) {
    return NextResponse.json({ error: "token inválido" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "body inválido" }, { status: 400 });
  }
  const { orderId, mt5Ticket, error } = body as {
    orderId?: string;
    mt5Ticket?: number;
    error?: string;
  };
  if (!orderId) {
    return NextResponse.json({ error: "orderId obrigatório" }, { status: 400 });
  }

  const order = await prisma.mT5Order.findFirst({
    where: { id: orderId, accountId: account.id },
  });
  if (!order) return NextResponse.json({ error: "ordem não encontrada" }, { status: 404 });

  if (error) {
    await prisma.mT5Order.update({
      where: { id: orderId },
      data: { status: "REJECTED", errorMsg: String(error).slice(0, 500) },
    });
  } else {
    await prisma.mT5Order.update({
      where: { id: orderId },
      data: {
        status: "FILLED",
        mt5Ticket: mt5Ticket ? BigInt(mt5Ticket) : null,
        filledAt: new Date(),
      },
    });
  }

  return NextResponse.json({ ok: true });
}
