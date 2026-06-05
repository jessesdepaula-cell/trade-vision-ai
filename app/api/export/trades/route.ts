import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/subscription";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const trades = await prisma.trade.findMany({
    where: { userId: user.id },
    orderBy: { openedAt: "desc" },
  });

  const headers = [
    "openedAt",
    "closedAt",
    "asset",
    "timeframe",
    "mode",
    "direction",
    "outcome",
    "entryPrice",
    "stopPrice",
    "targetPrice",
    "exitPrice",
    "rMultiple",
    "pnlAmount",
    "notes",
  ];

  const rows = trades.map((t) => [
    t.openedAt.toISOString(),
    t.closedAt?.toISOString() ?? "",
    t.asset,
    t.timeframe ?? "",
    t.mode,
    t.direction,
    t.outcome,
    t.entryPrice,
    t.stopPrice,
    t.targetPrice ?? "",
    t.exitPrice ?? "",
    t.rMultiple ?? "",
    t.pnlAmount ?? "",
    t.notes ?? "",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
  const filename = `trades-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
