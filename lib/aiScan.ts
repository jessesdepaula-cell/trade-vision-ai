import OpenAI from "openai";
import { smcSystemPrompt } from "./smcManual";

export type Candle = { t: number; o: number; h: number; l: number; c: number; v?: number };

export type SmcChecklist = {
  vies_HTF_a_favor?: boolean;
  liquidez_identificada?: boolean;
  sweep_corpo_fecha_dentro?: boolean;
  displacement_com_FVG?: boolean;
  ChoCh_confirmado_fechamento?: boolean;
  OB_em_zona_correta?: boolean;
};

export type ScanResult = {
  hasSetup: boolean;
  tipo_setup?: "Spring" | "Upthrust" | "Nenhum";
  direction?: "COMPRA_FORTE" | "COMPRA_FRACA" | "VENDA_FORTE" | "VENDA_FRACA" | "NEUTRO";
  probability?: number;
  confidence?: "ALTA" | "MEDIA" | "BAIXA";
  checklist_smc?: SmcChecklist;
  structure?: string;
  entryPrice?: number;
  entryZoneLow?: number;
  entryZoneHigh?: number;
  stopPrice?: number;
  target1?: number;
  target2?: number;
  target3?: number;
  recommendedTarget?: number;
  riskReward?: string;
  justification?: string;
};

function candlesToText(candles: Candle[]): string {
  return candles
    .map((c) => {
      const d = new Date(c.t * 1000).toISOString().slice(0, 16).replace("T", " ");
      return `${d} O:${c.o} H:${c.h} L:${c.l} C:${c.c}`;
    })
    .join("\n");
}

const SMC_PROMPT = smcSystemPrompt({ withImage: false, jsonShape: "scan" });

function systemPrompt(mode: "SMC" | "CLASSICO") {
  if (mode === "SMC") return SMC_PROMPT;
  return `Você é um Analista Financeiro Institucional de Elite. Analise os dados de OHLC fornecidos e identifique se há um SETUP DE TRADE OPERACIONAL AGORA. Retorne APENAS JSON, sem markdown.

MODO: CLÁSSICO — foque em Tendência, Suportes/Resistências, Padrões de candles/gráficos.

QUANDO RETORNAR "hasSetup": false:
- Mercado em consolidação sem POI claro
- Sem confluência mínima de sinais
- Em meio a movimento exaustivo sem pullback
- Estrutura ambígua

QUANDO RETORNAR "hasSetup": true:
- Há um plano operacional CLARO agora, com entrada/stop/alvo bem definidos
- Pelo menos 2 confluências

PREÇOS: Use sempre valores NUMÉRICOS exatos lidos das velas (não estimativas).

REGRAS:
- Seja conciso. Justificativa em 2-3 frases máximo.
- Sem emojis, sem markdown, sem **.
- Probabilidade entre 0-100 (inteiro).
- recommendedTarget: 1, 2 ou 3.

FORMATO JSON OBRIGATÓRIO:
{
  "hasSetup": true | false,
  "direction": "COMPRA_FORTE" | "COMPRA_FRACA" | "VENDA_FORTE" | "VENDA_FRACA" | "NEUTRO",
  "probability": 0-100,
  "confidence": "ALTA" | "MEDIA" | "BAIXA",
  "structure": "string (1-2 frases)",
  "entryPrice": number,
  "entryZoneLow": number,
  "entryZoneHigh": number,
  "stopPrice": number,
  "target1": number,
  "target2": number,
  "target3": number,
  "recommendedTarget": 1 | 2 | 3,
  "riskReward": "string ex: 1:2.3",
  "justification": "string (2-3 frases)"
}`;
}

// modelo default: usa gpt-4o para SMC (manual exige rigor), gpt-4o-mini para clássico (mais barato)
function pickModel(mode: "SMC" | "CLASSICO"): string {
  if (mode === "SMC") {
    return process.env.OPENAI_SCAN_MODEL_SMC ?? process.env.OPENAI_SCAN_MODEL ?? "gpt-4o";
  }
  return process.env.OPENAI_SCAN_MODEL ?? "gpt-4o-mini";
}

export async function scanWithAI(input: {
  symbol: string;
  timeframe: string;
  mode: "SMC" | "CLASSICO";
  candles: Candle[];
}): Promise<ScanResult> {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY ausente");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = pickModel(input.mode);

  const userText = `Símbolo: ${input.symbol}
Timeframe: ${input.timeframe}
Últimas ${input.candles.length} velas (mais recentes ao final):
${candlesToText(input.candles)}

Há um SETUP CLARO operacional AGORA? Retorne o JSON conforme especificado.`;

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.1,
    max_tokens: 1200,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt(input.mode) },
      { role: "user", content: userText },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw);
    return parsed as ScanResult;
  } catch {
    return { hasSetup: false };
  }
}
