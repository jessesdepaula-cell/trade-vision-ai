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

  const accounts = await prisma.mT5Account.findMany({
    where: { userId: user.id },
    select: { id: true },
  });
  const accIds = accounts.map((a) => a.id);
  if (accIds.length === 0) {
    return new NextResponse("scannedAt,nenhum sinal\n", {
      headers: { "Content-Type": "text/csv; charset=utf-8" },
    });
  }

  const signals = await prisma.signal.findMany({
    where: { accountId: { in: accIds } },
    orderBy: { scannedAt: "desc" },
    take: 5000,
  });

  const headers = [
    "scannedAt",
    "symbol",
    "timeframe",
    "mode",
    "hasSetup",
    "direction",
    "probability",
    "confidence",
    "tipoSetup",
    "entryPrice",
    "stopPrice",
    "target1",
    "target2",
    "target3",
    "recommendedTarget",
    "riskReward",
    "status",
    "exitPrice",
    "rMultiple",
    "filledAt",
    "closedAt",
  ];

  const rows = signals.map((s) => [
    s.scannedAt.toISOString(),
    s.symbol,
    s.timeframe,
    s.mode,
    s.hasSetup,
    s.direction ?? "",
    s.probability ?? "",
    s.confidence ?? "",
    s.tipoSetup ?? "",
    s.entryPrice ?? "",
    s.stopPrice ?? "",
    s.target1 ?? "",
    s.target2 ?? "",
    s.target3 ?? "",
    s.recommendedTarget ?? "",
    s.riskReward ?? "",
    s.status,
    s.exitPrice ?? "",
    s.rMultiple ?? "",
    s.filledAt?.toISOString() ?? "",
    s.closedAt?.toISOString() ?? "",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
  const filename = `sinais-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
