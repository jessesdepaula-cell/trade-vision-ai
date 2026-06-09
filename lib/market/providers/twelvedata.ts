import type { Candle, Quote, Timeframe } from "../types";

const TF_TO_TWELVE: Record<Timeframe, string> = {
  M5: "5min",
  M15: "15min",
  M30: "30min",
  H1: "1h",
  H4: "4h",
  D1: "1day",
};

const BASE = "https://api.twelvedata.com";

function key(): string {
  const k = process.env.TWELVEDATA_API_KEY;
  if (!k) throw new Error("TWELVEDATA_API_KEY ausente");
  return k;
}

export async function twelveCandles(
  twelveSymbol: string,
  tf: Timeframe,
  outputsize = 500,
): Promise<Candle[]> {
  const url = `${BASE}/time_series?symbol=${encodeURIComponent(
    twelveSymbol,
  )}&interval=${TF_TO_TWELVE[tf]}&outputsize=${Math.min(
    outputsize,
    5000,
  )}&apikey=${key()}&format=JSON&order=ASC`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Twelve Data candles ${res.status}`);
  const j = (await res.json()) as
    | {
        status?: string;
        code?: number;
        message?: string;
        values?: Array<{
          datetime: string;
          open: string;
          high: string;
          low: string;
          close: string;
        }>;
      }
    | undefined;

  if (!j || j.status === "error" || !Array.isArray(j.values)) {
    throw new Error(`Twelve Data: ${j?.message ?? "resposta inválida"}`);
  }

  return j.values.map((v) => ({
    t: Math.floor(new Date(v.datetime.replace(" ", "T") + "Z").getTime() / 1000),
    o: parseFloat(v.open),
    h: parseFloat(v.high),
    l: parseFloat(v.low),
    c: parseFloat(v.close),
  }));
}

export async function twelveQuote(twelveSymbol: string): Promise<Quote> {
  const url = `${BASE}/quote?symbol=${encodeURIComponent(
    twelveSymbol,
  )}&apikey=${key()}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Twelve Data quote ${res.status}`);
  const j = (await res.json()) as {
    status?: string;
    message?: string;
    symbol?: string;
    close?: string;
    bid?: string;
    ask?: string;
    timestamp?: number;
  };
  if (j.status === "error") {
    throw new Error(`Twelve Data quote: ${j.message ?? "erro"}`);
  }
  // Free tier sem bid/ask separados em forex — usa close como mid e estima spread
  const mid = parseFloat(j.close ?? "0");
  const bid = j.bid ? parseFloat(j.bid) : mid;
  const ask = j.ask ? parseFloat(j.ask) : mid;
  return {
    symbol: j.symbol ?? twelveSymbol,
    bid,
    ask,
    spread: Math.max(ask - bid, 0),
    ts: j.timestamp ?? Math.floor(Date.now() / 1000),
  };
}
