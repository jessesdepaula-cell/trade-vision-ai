export const DEFAULT_WATCHLIST: Array<{
  symbol: string;
  timeframe: string;
  mode: "SMC" | "CLASSICO";
}> = [
  { symbol: "BTCUSD", timeframe: "M15", mode: "SMC" },
  { symbol: "BTCUSD", timeframe: "M15", mode: "CLASSICO" },
  { symbol: "EURUSD", timeframe: "M15", mode: "SMC" },
  { symbol: "EURUSD", timeframe: "M15", mode: "CLASSICO" },
  { symbol: "GBPUSD", timeframe: "M15", mode: "SMC" },
  { symbol: "USDJPY", timeframe: "M15", mode: "SMC" },
];
