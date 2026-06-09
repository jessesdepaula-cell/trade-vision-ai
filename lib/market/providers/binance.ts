import type { Candle, Quote, Timeframe } from "../types";

const TF_TO_BINANCE: Record<Timeframe, string> = {
  M5: "5m",
  M15: "15m",
  M30: "30m",
  H1: "1h",
  H4: "4h",
  D1: "1d",
};

const BASE = "https://api.binance.com";

export async function binanceCandles(
  binanceSymbol: string,
  tf: Timeframe,
  limit = 500,
): Promise<Candle[]> {
  const interval = TF_TO_BINANCE[tf];
  const url = `${BASE}/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${Math.min(
    limit,
    1000,
  )}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Binance candles ${res.status}`);
  const raw = (await res.json()) as Array<
    [number, string, string, string, string, string, number, ...unknown[]]
  >;
  return raw.map((k) => ({
    t: Math.floor(k[0] / 1000),
    o: parseFloat(k[1]),
    h: parseFloat(k[2]),
    l: parseFloat(k[3]),
    c: parseFloat(k[4]),
    v: parseFloat(k[5]),
  }));
}

export async function binanceQuote(binanceSymbol: string): Promise<Quote> {
  const url = `${BASE}/api/v3/ticker/bookTicker?symbol=${binanceSymbol}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Binance quote ${res.status}`);
  const j = (await res.json()) as {
    symbol: string;
    bidPrice: string;
    askPrice: string;
  };
  const bid = parseFloat(j.bidPrice);
  const ask = parseFloat(j.askPrice);
  return {
    symbol: j.symbol,
    bid,
    ask,
    spread: ask - bid,
    ts: Math.floor(Date.now() / 1000),
  };
}
