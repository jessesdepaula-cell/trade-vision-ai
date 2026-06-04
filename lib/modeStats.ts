import { prisma } from "@/lib/prisma";

export type ModeStats = {
  mode: "SMC" | "CLASSICO";
  total: number;       // trades fechados (WIN+LOSS+BREAKEVEN)
  wins: number;
  losses: number;
  breakeven: number;
  open: number;
  winRate: number;     // 0-100 (apenas WIN/LOSS, ignora BREAKEVEN)
  rTotal: number;
  avgR: number;
  expectancy: number;  // R esperado por trade
};

const EMPTY: Omit<ModeStats, "mode"> = {
  total: 0,
  wins: 0,
  losses: 0,
  breakeven: 0,
  open: 0,
  winRate: 0,
  rTotal: 0,
  avgR: 0,
  expectancy: 0,
};

export async function getModeStats(userId: string): Promise<{ smc: ModeStats; classico: ModeStats }> {
  const trades = await prisma.trade.findMany({
    where: { userId },
    select: { mode: true, outcome: true, rMultiple: true },
  });

  function calc(mode: "SMC" | "CLASSICO"): ModeStats {
    const subset = trades.filter((t) => t.mode === mode);
    const wins = subset.filter((t) => t.outcome === "WIN").length;
    const losses = subset.filter((t) => t.outcome === "LOSS").length;
    const breakeven = subset.filter((t) => t.outcome === "BREAKEVEN").length;
    const open = subset.filter((t) => t.outcome === "OPEN").length;
    const total = wins + losses + breakeven;
    const denom = wins + losses;
    const winRate = denom > 0 ? (wins / denom) * 100 : 0;
    const closed = subset.filter((t) => t.outcome !== "OPEN");
    const rTotal = closed.reduce((s, t) => s + (t.rMultiple ?? 0), 0);
    const avgR = total > 0 ? rTotal / total : 0;
    // expectancy = winRate*avgWin - lossRate*avgLoss
    const winsR = closed.filter((t) => t.outcome === "WIN").reduce((s, t) => s + (t.rMultiple ?? 0), 0);
    const lossR = closed.filter((t) => t.outcome === "LOSS").reduce((s, t) => s + (t.rMultiple ?? 0), 0);
    const avgWin = wins > 0 ? winsR / wins : 0;
    const avgLoss = losses > 0 ? Math.abs(lossR / losses) : 0;
    const winP = denom > 0 ? wins / denom : 0;
    const lossP = denom > 0 ? losses / denom : 0;
    const expectancy = winP * avgWin - lossP * avgLoss;
    return { mode, total, wins, losses, breakeven, open, winRate, rTotal, avgR, expectancy };
  }

  return {
    smc: { ...EMPTY, ...calc("SMC") },
    classico: { ...EMPTY, ...calc("CLASSICO") },
  };
}

export function classifyAccuracy(winRate: number, sample: number): {
  label: string;
  tone: "emerald" | "amber" | "rose" | "muted";
  hint: string;
} {
  if (sample < 10) {
    return {
      label: "Amostra insuficiente",
      tone: "muted",
      hint: `Precisa de ao menos 10 trades fechados (${sample} até agora)`,
    };
  }
  if (winRate >= 65) return { label: "Excepcional", tone: "emerald", hint: "Performance institucional" };
  if (winRate >= 55) return { label: "Forte", tone: "emerald", hint: "Acima da média" };
  if (winRate >= 50) return { label: "Equilibrado", tone: "amber", hint: "Lucratividade depende de R:R" };
  if (winRate >= 40) return { label: "Atenção", tone: "amber", hint: "Revisar critérios de entrada" };
  return { label: "Crítico", tone: "rose", hint: "Performance abaixo do mínimo aceitável" };
}
