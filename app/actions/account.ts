"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function deleteAccountAction() {
  const { userId } = await auth();
  if (!userId) throw new Error("Não autenticado");

  // Apaga User → cascades em analyses, trades, mt5Accounts (com Signal/Watchlist/Tick/Order).
  await prisma.user
    .deleteMany({ where: { clerkId: userId } })
    .catch(() => null);

  redirect("/");
}
