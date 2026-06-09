import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Cron diário (3h da manhã): mantém apenas 1 sinal NO_SETUP mais recente
 * por (userId, symbol, timeframe, mode). NO_SETUP sem candleData útil
 * vira lixo rapidamente — esse housekeeping mantém o banco enxuto.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await prisma.$executeRawUnsafe(`
    WITH ranked AS (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY "userId", "symbol", "timeframe", "mode"
               ORDER BY "scannedAt" DESC
             ) AS rn
        FROM "Signal"
       WHERE "hasSetup" = false
    )
    DELETE FROM "Signal"
     WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
  `);

  return NextResponse.json({ ok: true, deleted });
}
