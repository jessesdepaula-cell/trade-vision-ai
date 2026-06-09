import { prisma } from "@/lib/prisma";
import { scanWithAI, type Candle } from "@/lib/aiScan";
import { evaluateOpenSignalsAgainstCandles } from "@/lib/signalTracker";
import { getCandles } from "@/lib/market/router";
import { findSymbol } from "@/lib/market/symbols";
import type { Timeframe } from "@/lib/market/types";

const HTF_FOR: Record<Timeframe, Timeframe> = {
  M5: "H1",
  M15: "H1",
  M30: "H4",
  H1: "H4",
  H4: "D1",
  D1: "D1",
};

type ScanWatchInput = {
  userId: string;
  watchlistId: string | null;
  symbol: string;
  timeframe: string;
  mode: "SMC" | "CLASSICO";
};

export type ScanWatchResult = {
  ok: true;
  signalId: string;
  hasSetup: boolean;
  direction: string | null;
  entry: number | null;
  stop: number | null;
  target: number | null;
  tracked: { filled: number; won: number; lost: number };
};

export type ScanWatchError = { ok: false; error: string };

const VALID_TFS: Timeframe[] = ["M5", "M15", "M30", "H1", "H4", "D1"];

function asTimeframe(tf: string): Timeframe {
  return VALID_TFS.includes(tf as Timeframe) ? (tf as Timeframe) : "M15";
}

export async function scanWatchlistItem(
  input: ScanWatchInput,
): Promise<ScanWatchResult | ScanWatchError> {
  const spec = findSymbol(input.symbol);
  if (!spec) {
    return { ok: false, error: `Símbolo não suportado: ${input.symbol}` };
  }

  const tf = asTimeframe(input.timeframe);
  const htf = HTF_FOR[tf];

  let candles: Candle[];
  let htfCandles: Candle[] = [];
  try {
    candles = (await getCandles(spec.symbol, tf, 500)) as Candle[];
  } catch (e) {
    return {
      ok: false,
      error: `Falha ao obter candles ${spec.symbol} ${tf}: ${
        e instanceof Error ? e.message : "erro"
      }`,
    };
  }
  if (candles.length < 20) {
    return { ok: false, error: "Dados insuficientes (menos de 20 velas)" };
  }
  try {
    htfCandles = (await getCandles(spec.symbol, htf, 200)) as Candle[];
  } catch {
    htfCandles = [];
  }

  // Avalia sinais já abertos contra novas velas
  let tracked = { filled: 0, won: 0, lost: 0 };
  try {
    tracked = await evaluateOpenSignalsAgainstCandles(
      input.userId,
      spec.symbol,
      candles,
    );
  } catch {
    // não interrompe
  }

  // IA
  let result;
  let aiError: string | null = null;
  try {
    result = await scanWithAI({
      symbol: spec.symbol,
      timeframe: tf,
      mode: input.mode,
      candles,
      htfCandles,
    });
  } catch (e) {
    aiError = e instanceof Error ? e.message : "erro IA";
    result = {
      hasSetup: false,
      justification: `⚠️ Candles atualizados, mas a análise da IA falhou: ${aiError}.`,
    };
  }

  const num = (v: unknown): number | null =>
    typeof v === "number" && isFinite(v) ? v : null;

  const signal = await prisma.signal.create({
    data: {
      userId: input.userId,
      symbol: spec.symbol,
      timeframe: tf,
      mode: input.mode,
      hasSetup: !!result.hasSetup,
      direction: result.direction ?? null,
      probability:
        typeof result.probability === "number"
          ? Math.max(0, Math.min(100, Math.round(result.probability)))
          : null,
      confidence: result.confidence ?? null,
      entryPrice: num(result.entryPrice),
      entryZoneLow: num(result.entryZoneLow),
      entryZoneHigh: num(result.entryZoneHigh),
      stopPrice: num(result.stopPrice),
      target1: num(result.target1),
      target2: num(result.target2),
      target3: num(result.target3),
      recommendedTarget:
        result.recommendedTarget && [1, 2, 3].includes(result.recommendedTarget)
          ? result.recommendedTarget
          : null,
      riskReward: result.riskReward ?? null,
      structure: result.structure ?? null,
      justification: result.justification ?? null,
      tipoSetup: result.tipo_setup ?? null,
      checklistSmc:
        input.mode === "SMC" && result.checklist_smc
          ? (result.checklist_smc as object)
          : undefined,
      checklistClassico:
        input.mode === "CLASSICO" && result.checklist_classico
          ? (result.checklist_classico as object)
          : undefined,
      status: result.hasSetup ? "PENDING" : "NO_SETUP",
      candleData: candles.slice(-3000) as object,
    },
  });

  if (input.watchlistId) {
    await prisma.watchlist
      .updateMany({
        where: { id: input.watchlistId, userId: input.userId },
        data: { lastScanAt: new Date() },
      })
      .catch(() => null);
  }

  return {
    ok: true,
    signalId: signal.id,
    hasSetup: signal.hasSetup,
    direction: signal.direction,
    entry: signal.entryPrice,
    stop: signal.stopPrice,
    target: signal.target1,
    tracked,
  };
}

export async function scanAllActiveForUser(userId: string) {
  const watchlist = await prisma.watchlist.findMany({
    where: { userId, active: true },
    orderBy: { createdAt: "asc" },
  });
  const results: Array<{
    watchlistId: string;
    symbol: string;
    timeframe: string;
    mode: string;
    ok: boolean;
    error?: string;
  }> = [];
  for (const w of watchlist) {
    const r = await scanWatchlistItem({
      userId,
      watchlistId: w.id,
      symbol: w.symbol,
      timeframe: w.timeframe,
      mode: w.mode as "SMC" | "CLASSICO",
    });
    results.push({
      watchlistId: w.id,
      symbol: w.symbol,
      timeframe: w.timeframe,
      mode: w.mode,
      ok: r.ok,
      error: r.ok ? undefined : r.error,
    });
  }
  return results;
}
