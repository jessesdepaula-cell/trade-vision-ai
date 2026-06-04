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
      subscriptionStatus: process.env.STRIPE_MOCK === "true" ? "active" : "inactive",
    },
    update: { email },
  });

  return user;
}

export async function requireActiveSubscription() {
  const user = await getOrCreateUser();
  if (!user) return { ok: false as const, reason: "unauthenticated" as const };

  const status = user.subscriptionStatus as SubscriptionStatus;
  const active = status === "active" || status === "trialing";
  if (!active) return { ok: false as const, reason: "inactive" as const, user };

  return { ok: true as const, user };
}
