import { prisma } from "@/lib/prisma";

type Candle = { t: number; o: number; h: number; l: number; c: number };

/**
 * Fallback de fechamento por velas: para cada sinal aberto (PENDING ou FILLED)
 * do mesmo símbolo, varre as candles fornecidas e:
 * - PENDING: se uma vela tocou no entryPrice → marca FILLED no horário da vela
 * - FILLED: se uma vela tocou stop ou alvo recomendado → marca WIN/LOSS e cria Trade
 *
 * Chamado pelo orquestrador de scan a cada scan, garantindo fechamento mesmo
 * sem stream de ticks em tempo real.
 */
export async function evaluateOpenSignalsAgainstCandles(
  userId: string,
  symbol: string,
  candles: Candle[],
) {
  if (candles.length === 0) return { filled: 0, won: 0, lost: 0 };

  const sym = symbol.toUpperCase();
  const openSignals = await prisma.signal.findMany({
    where: {
      userId,
      status: { in: ["PENDING", "FILLED"] },
      symbol: sym,
      hasSetup: true,
    },
  });

  let filled = 0;
  let won = 0;
  let lost = 0;

  for (const s of openSignals) {
    const isBuy = s.direction === "COMPRA_FORTE" || s.direction === "COMPRA_FRACA";
    const isSell = s.direction === "VENDA_FORTE" || s.direction === "VENDA_FRACA";
    if (!isBuy && !isSell) continue;

    let status: "PENDING" | "FILLED" = s.status as "PENDING" | "FILLED";
    let filledAt: Date | null = s.filledAt;
    const scannedSec = Math.floor(new Date(s.scannedAt).getTime() / 1000);

    const tgts = [s.target1, s.target2, s.target3].filter((x): x is number => x !== null);
    const recIdx = (s.recommendedTarget ?? 1) - 1;
    const targetPrice = tgts[recIdx] ?? tgts[0];

    const relevant = candles.filter((c) => c.t >= scannedSec);
    if (relevant.length === 0) continue;

    let outcome: "WIN" | "LOSS" | null = null;
    let exitPrice: number | null = null;
    let closeAt: Date | null = null;

    for (const c of relevant) {
      if (status === "PENDING" && s.entryPrice !== null) {
        if (c.l <= s.entryPrice && c.h >= s.entryPrice) {
          status = "FILLED";
          filledAt = new Date(c.t * 1000);
        }
      }

      if (status === "FILLED" && s.stopPrice !== null) {
        if (isBuy) {
          if (c.l <= s.stopPrice) {
            outcome = "LOSS";
            exitPrice = s.stopPrice;
            closeAt = new Date(c.t * 1000);
            break;
          }
          if (targetPrice !== undefined && c.h >= targetPrice) {
            outcome = "WIN";
            exitPrice = targetPrice;
            closeAt = new Date(c.t * 1000);
            break;
          }
        } else if (isSell) {
          if (c.h >= s.stopPrice) {
            outcome = "LOSS";
            exitPrice = s.stopPrice;
            closeAt = new Date(c.t * 1000);
            break;
          }
          if (targetPrice !== undefined && c.l <= targetPrice) {
            outcome = "WIN";
            exitPrice = targetPrice;
            closeAt = new Date(c.t * 1000);
            break;
          }
        }
      }
    }

    if (status === "FILLED" && s.status === "PENDING" && !outcome) {
      await prisma.signal.update({
        where: { id: s.id },
        data: { status: "FILLED", filledAt: filledAt ?? new Date() },
      });
      filled++;
    }

    if (outcome && exitPrice !== null && s.entryPrice !== null && s.stopPrice !== null) {
      const risk = Math.abs(s.entryPrice - s.stopPrice);
      let r: number | null = null;
      if (risk > 0) {
        const reward = isBuy ? exitPrice - s.entryPrice : s.entryPrice - exitPrice;
        r = Number((reward / risk).toFixed(2));
      }

      await prisma.signal.update({
        where: { id: s.id },
        data: {
          status: outcome,
          filledAt: filledAt ?? s.filledAt ?? new Date(),
          closedAt: closeAt ?? new Date(),
          exitPrice,
          rMultiple: r,
        },
      });

      if (!s.tradeCreated) {
        await prisma.trade.create({
          data: {
            userId,
            signalId: s.id,
            asset: s.symbol,
            timeframe: s.timeframe,
            mode: s.mode,
            direction: isBuy ? "BUY" : "SELL",
            entryPrice: s.entryPrice,
            stopPrice: s.stopPrice,
            targetPrice: targetPrice ?? null,
            exitPrice,
            outcome,
            rMultiple: r,
            openedAt: filledAt ?? s.filledAt ?? s.scannedAt,
            closedAt: closeAt ?? new Date(),
            notes: `Sinal automático ${s.mode} · ${s.symbol} ${s.timeframe} (auto-close por velas)`,
          },
        });
        await prisma.signal.update({
          where: { id: s.id },
          data: { tradeCreated: true },
        });
      }
      if (outcome === "WIN") won++;
      else lost++;
    }
  }

  return { filled, won, lost };
}
