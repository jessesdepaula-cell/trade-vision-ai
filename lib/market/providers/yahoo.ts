import type { Candle, Quote, Timeframe } from "../types";

const TF_TO_YAHOO: Record<Timeframe, string> = {
  M5: "5m",
  M15: "15m",
  M30: "30m",
  H1: "1h",
  H4: "4h",
  D1: "1d",
};

// Mapeamento de símbolos internos para os símbolos do Yahoo Finance
const SYMBOL_MAP: Record<string, string> = {
  EURUSD: "EURUSD=X",
  GBPUSD: "GBPUSD=X",
  USDJPY: "USDJPY=X",
  USDCHF: "USDCHF=X",
  XAUUSD: "GC=F", // Contrato futuro de ouro na COMEX
};

function rangeForLimit(tf: Timeframe, limit: number): string {
  if (tf === "M5") {
    return limit <= 100 ? "1d" : "5d";
  }
  if (tf === "M15" || tf === "M30") {
    return limit <= 100 ? "5d" : "1mo";
  }
  if (tf === "H1") {
    return limit <= 100 ? "1mo" : "3mo";
  }
  if (tf === "H4") {
    return limit <= 100 ? "3mo" : "6mo";
  }
  if (tf === "D1") {
    return limit <= 100 ? "1y" : "max";
  }
  return "1mo";
}

export async function yahooCandles(
  symbol: string,
  tf: Timeframe,
  limit = 500,
): Promise<Candle[]> {
  const yahooSymbol = SYMBOL_MAP[symbol.toUpperCase().replace("/", "")] ?? `${symbol}=X`;
  const range = rangeForLimit(tf, limit);
  const interval = TF_TO_YAHOO[tf] ?? "15m";
  
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    yahooSymbol,
  )}?interval=${interval}&range=${range}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Yahoo Finance candles HTTP ${res.status}`);
  }

  const j = (await res.json()) as {
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: {
          quote?: Array<{
            open?: (number | null)[];
            high?: (number | null)[];
            low?: (number | null)[];
            close?: (number | null)[];
            volume?: (number | null)[];
          }>;
        };
      }>;
      error?: {
        code?: string;
        description?: string;
      };
    };
  };

  if (j.chart?.error) {
    throw new Error(`Yahoo Finance Error: ${j.chart.error.description ?? "desconhecido"}`);
  }

  const result = j.chart?.result?.[0];
  const timestamp = result?.timestamp;
  const quote = result?.indicators?.quote?.[0];

  if (!result || !timestamp || !quote) {
    throw new Error("Yahoo Finance: estrutura de resposta inválida");
  }

  const candles: Candle[] = [];
  for (let i = 0; i < timestamp.length; i++) {
    const t = timestamp[i];
    const o = quote.open?.[i];
    const h = quote.high?.[i];
    const l = quote.low?.[i];
    const c = quote.close?.[i];
    const v = quote.volume?.[i];

    if (
      t === undefined ||
      o === null ||
      h === null ||
      l === null ||
      c === null ||
      o === undefined ||
      h === undefined ||
      l === undefined ||
      c === undefined
    ) {
      continue;
    }

    candles.push({
      t,
      o: Number(o),
      h: Number(h),
      l: Number(l),
      c: Number(c),
      v: v !== null && v !== undefined ? Number(v) : undefined,
    });
  }

  // Se retornou mais candles do que o limite solicitado, pega os últimos
  if (candles.length > limit) {
    return candles.slice(-limit);
  }

  return candles;
}

export async function yahooQuote(symbol: string): Promise<Quote> {
  const yahooSymbol = SYMBOL_MAP[symbol.toUpperCase().replace("/", "")] ?? `${symbol}=X`;
  
  // Usamos o endpoint de chart de 1 dia para pegar o regularMarketPrice mais recente sem precisar de autenticação
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    yahooSymbol,
  )}?interval=1m&range=1d`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Yahoo Finance quote HTTP ${res.status}`);
  }

  const j = (await res.json()) as {
    chart?: {
      result?: Array<{
        meta?: {
          regularMarketPrice?: number;
          symbol?: string;
        };
      }>;
      error?: {
        description?: string;
      };
    };
  };

  if (j.chart?.error) {
    throw new Error(`Yahoo Finance Quote Error: ${j.chart.error.description ?? "desconhecido"}`);
  }

  const meta = j.chart?.result?.[0]?.meta;
  const mid = meta?.regularMarketPrice ?? 0;

  if (mid === 0) {
    throw new Error("Yahoo Finance Quote: preço regular de mercado indisponível");
  }

  return {
    symbol: symbol.toUpperCase(),
    bid: mid,
    ask: mid,
    spread: 0,
    ts: Math.floor(Date.now() / 1000),
  };
}
