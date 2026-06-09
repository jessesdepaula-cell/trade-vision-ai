export type AssetClass = "crypto" | "forex";

export type SymbolSpec = {
  symbol: string;        // canonical used internally (ex: BTCUSD, EURUSD)
  label: string;
  assetClass: AssetClass;
  binance?: string;      // BTCUSDT
  twelvedata?: string;   // EUR/USD
};

export const SUPPORTED_SYMBOLS: SymbolSpec[] = [
  {
    symbol: "BTCUSD",
    label: "Bitcoin",
    assetClass: "crypto",
    binance: "BTCUSDT",
  },
  {
    symbol: "EURUSD",
    label: "Euro / Dólar",
    assetClass: "forex",
    twelvedata: "EUR/USD",
  },
  {
    symbol: "GBPUSD",
    label: "Libra / Dólar",
    assetClass: "forex",
    twelvedata: "GBP/USD",
  },
  {
    symbol: "USDJPY",
    label: "Dólar / Iene",
    assetClass: "forex",
    twelvedata: "USD/JPY",
  },
  {
    symbol: "USDCHF",
    label: "Dólar / Franco",
    assetClass: "forex",
    twelvedata: "USD/CHF",
  },
];

export function findSymbol(symbol: string): SymbolSpec | undefined {
  const sym = symbol.toUpperCase().trim();
  return SUPPORTED_SYMBOLS.find((s) => s.symbol === sym);
}

export function isSupported(symbol: string): boolean {
  return !!findSymbol(symbol);
}
