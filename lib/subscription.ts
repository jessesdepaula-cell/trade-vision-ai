import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "inactive"
  | "past_due"
  | "canceled";

export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.emailAddresses[0]?.emailAddress ?? `${clerkUser.id}@no-email.local`;

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    create: {
      clerkId: userId,
      email,
      name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" "),
      subscriptionStatus: "trialing",
      currentPeriodEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias grátis
    },
    update: { email },
  });

  return user;
}

export async function requireActiveSubscription() {
  const user = await getOrCreateUser();
  if (!user) return { ok: false as const, reason: "unauthenticated" as const };

  let status = user.subscriptionStatus as SubscriptionStatus;

  // Se o trial expirou, atualiza para inativo no banco
  if (status === "trialing" && user.currentPeriodEnd && user.currentPeriodEnd < new Date()) {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionStatus: "inactive" },
    });
    return { ok: false as const, reason: "inactive" as const, user: updated };
  }

  const active = status === "active" || status === "trialing";
  if (!active) return { ok: false as const, reason: "inactive" as const, user };

  return { ok: true as const, user };
}
