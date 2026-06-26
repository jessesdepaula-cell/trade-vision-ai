import { prisma } from "@/lib/prisma";

export type ModeStats = {
  mode: "SMC" | "CLASSICO";
  total: number;
  wins: number;
  losses: number;
  breakeven: number;
  open: number;
  winRate: number;
  rTotal: number;
  avgR: number;
  expectancy: number;
  symbols: { symbol: string; count: number }[];
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
  symbols: [],
};

export async function getModeStats(
  userId: string,
): Promise<{ smc: ModeStats; classico: ModeStats }> {
  const signals = await prisma.signal.findMany({
    where: { userId, hasSetup: true },
    select: { mode: true, status: true, rMultiple: true, symbol: true },
  });

  function statusToOutcome(s: string): "WIN" | "LOSS" | "BREAKEVEN" | "OPEN" {
    if (s === "WIN") return "WIN";
    if (s === "LOSS") return "LOSS";
    if (s === "PENDING" || s === "FILLED") return "OPEN";
    return "BREAKEVEN";
  }

  function calc(mode: "SMC" | "CLASSICO"): ModeStats {
    const subset = signals
      .filter((s) => s.mode === mode)
      .map((s) => ({ symbol: s.symbol, outcome: statusToOutcome(s.status), rMultiple: s.rMultiple }));
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
    const winsR = closed
      .filter((t) => t.outcome === "WIN")
      .reduce((s, t) => s + (t.rMultiple ?? 0), 0);
    const lossR = closed
      .filter((t) => t.outcome === "LOSS")
      .reduce((s, t) => s + (t.rMultiple ?? 0), 0);
    const avgWin = wins > 0 ? winsR / wins : 0;
    const avgLoss = losses > 0 ? Math.abs(lossR / losses) : 0;
    const winP = denom > 0 ? wins / denom : 0;
    const lossP = denom > 0 ? losses / denom : 0;
    const expectancy = winP * avgWin - lossP * avgLoss;

    // Agrupa e conta os trades fechados por símbolo/ativo
    const symbolCounts: Record<string, number> = {};
    for (const t of closed) {
      symbolCounts[t.symbol] = (symbolCounts[t.symbol] || 0) + 1;
    }
    const symbolsList = Object.entries(symbolCounts)
      .map(([symbol, count]) => ({ symbol, count }))
      .sort((a, b) => b.count - a.count);

    return { mode, total, wins, losses, breakeven, open, winRate, rTotal, avgR, expectancy, symbols: symbolsList };
  }

  return {
    smc: { ...EMPTY, ...calc("SMC") },
    classico: { ...EMPTY, ...calc("CLASSICO") },
  };
}

export function classifyAccuracy(
  winRate: number,
  sample: number,
): { label: string; tone: "emerald" | "amber" | "rose" | "muted"; hint: string } {
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
