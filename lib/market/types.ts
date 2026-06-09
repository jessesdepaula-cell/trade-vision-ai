export type Timeframe = "M5" | "M15" | "M30" | "H1" | "H4" | "D1";

export type Candle = {
  t: number; // unix seconds (close time or open time, consistent across providers)
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
};

export type Quote = {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  ts: number; // unix seconds
};
