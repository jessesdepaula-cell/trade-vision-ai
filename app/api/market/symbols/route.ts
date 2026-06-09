import { NextResponse } from "next/server";
import { SUPPORTED_SYMBOLS } from "@/lib/market/symbols";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    items: SUPPORTED_SYMBOLS.map((s) => ({
      symbol: s.symbol,
      label: s.label,
      assetClass: s.assetClass,
    })),
  });
}
