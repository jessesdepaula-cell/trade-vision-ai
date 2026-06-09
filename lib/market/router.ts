import { findSymbol, type SymbolSpec } from "./symbols";
import type { Candle, Quote, Timeframe } from "./types";
import { binanceCandles, binanceQuote } from "./providers/binance";
import { twelveCandles, twelveQuote } from "./providers/twelvedata";

type CacheEntry<T> = { value: T; expiresAt: number };
const memCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const e = memCache.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    memCache.delete(key);
    return null;
  }
  return e.value as T;
}

function setCached<T>(key: string, value: T, ttlMs: number) {
  memCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function specOrThrow(symbol: string): SymbolSpec {
  const s = findSymbol(symbol);
  if (!s) throw new Error(`Símbolo não suportado: ${symbol}`);
  return s;
}

const CANDLES_TTL: Record<Timeframe, number> = {
  M5: 30_000,
  M15: 60_000,
  M30: 120_000,
  H1: 300_000,
  H4: 600_000,
  D1: 1_800_000,
};

export async function getCandles(
  symbol: string,
  tf: Timeframe,
  limit = 500,
): Promise<Candle[]> {
  const spec = specOrThrow(symbol);
  const cacheKey = `c:${spec.symbol}:${tf}:${limit}`;
  const cached = getCached<Candle[]>(cacheKey);
  if (cached) return cached;

  let candles: Candle[];
  if (spec.assetClass === "crypto" && spec.binance) {
    candles = await binanceCandles(spec.binance, tf, limit);
  } else if (spec.assetClass === "forex" && spec.twelvedata) {
    candles = await twelveCandles(spec.twelvedata, tf, limit);
  } else {
    throw new Error(`Sem provider para ${symbol}`);
  }

  setCached(cacheKey, candles, CANDLES_TTL[tf]);
  return candles;
}

export async function getQuote(symbol: string): Promise<Quote> {
  const spec = specOrThrow(symbol);
  const cacheKey = `q:${spec.symbol}`;
  const cached = getCached<Quote>(cacheKey);
  if (cached) return cached;

  let q: Quote;
  if (spec.assetClass === "crypto" && spec.binance) {
    q = await binanceQuote(spec.binance);
  } else if (spec.assetClass === "forex" && spec.twelvedata) {
    q = await twelveQuote(spec.twelvedata);
  } else {
    throw new Error(`Sem provider para ${symbol}`);
  }

  // mantém símbolo canônico (não o do provider)
  q.symbol = spec.symbol;
  setCached(cacheKey, q, spec.assetClass === "crypto" ? 5_000 : 30_000);
  return q;
}
