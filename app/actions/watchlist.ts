"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateUser } from "@/lib/subscription";
import { prisma } from "@/lib/prisma";
import { DEFAULT_WATCHLIST } from "@/lib/watchlistDefaults";
import { isSupported } from "@/lib/market/symbols";

export async function seedWatchlist(userId: string) {
  for (const w of DEFAULT_WATCHLIST) {
    await prisma.watchlist.upsert({
      where: {
        userId_symbol_timeframe_mode: {
          userId,
          symbol: w.symbol,
          timeframe: w.timeframe,
          mode: w.mode,
        },
      },
      create: { userId, ...w, active: true },
      update: {},
    });
  }
}

export async function addWatch(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Não autenticado");
  const symbol = String(formData.get("symbol") ?? "").toUpperCase().trim();
  const timeframe = String(formData.get("timeframe") ?? "M15");
  const mode = String(formData.get("mode") ?? "SMC") as "SMC" | "CLASSICO";

  if (!symbol) return;
  if (!isSupported(symbol)) {
    throw new Error(
      `Símbolo "${symbol}" não está na lista suportada. Use BTCUSD, EURUSD, GBPUSD, USDJPY ou USDCHF.`,
    );
  }

  await prisma.watchlist.upsert({
    where: {
      userId_symbol_timeframe_mode: { userId: user.id, symbol, timeframe, mode },
    },
    create: { userId: user.id, symbol, timeframe, mode, active: true },
    update: { active: true },
  });

  revalidatePath("/dashboard/watchlist");
  revalidatePath("/dashboard/sinais");
}

export async function toggleWatch(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Não autenticado");
  const id = String(formData.get("id"));
  const w = await prisma.watchlist.findUnique({ where: { id } });
  if (!w || w.userId !== user.id) return;
  await prisma.watchlist.update({ where: { id }, data: { active: !w.active } });
  revalidatePath("/dashboard/watchlist");
  revalidatePath("/dashboard/sinais");
}

export async function removeWatch(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Não autenticado");
  const id = String(formData.get("id"));
  const w = await prisma.watchlist.findUnique({ where: { id } });
  if (!w || w.userId !== user.id) return;
  await prisma.watchlist.delete({ where: { id } });
  revalidatePath("/dashboard/watchlist");
  revalidatePath("/dashboard/sinais");
}
