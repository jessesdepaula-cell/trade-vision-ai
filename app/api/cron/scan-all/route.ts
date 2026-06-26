import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scanAllActiveForUser } from "@/lib/scan/orchestrator";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Vercel Cron: configurado em vercel.json para rodar a cada 15 min.
// Usa header `Authorization: Bearer ${CRON_SECRET}` (Vercel injeta automaticamente).
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: {
      subscriptionStatus: { in: ["active", "trialing"] },
      watchlist: { some: { active: true } },
    },
    select: { id: true },
  });

  const summary: Array<{
    userId: string;
    scanned: number;
    failed: number;
    details: any;
  }> = [];

  for (const u of users) {
    try {
      const results = await scanAllActiveForUser(u.id);
      summary.push({
        userId: u.id,
        scanned: results.filter((r) => r.ok).length,
        failed: results.filter((r) => !r.ok).length,
        details: results,
      });
    } catch (e) {
      summary.push({
        userId: u.id,
        scanned: 0,
        failed: -1,
        details: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({ ok: true, users: users.length, summary });
}
