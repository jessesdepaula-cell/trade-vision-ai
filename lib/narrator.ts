/**
 * NARRADOR DE SINAIS (IA opcional, best-effort, barato/grátis).
 *
 * O sinal em si é calculado pelo motor determinístico (smcSignal). O narrador
 * NÃO recalcula nem inventa números — apenas escreve, em PT-BR, a explicação do
 * plano JÁ pronto para o assinante ler. Se a IA falhar, estourar limite (429) ou
 * não houver chave, retorna null e o chamador mantém o texto gerado pelo código.
 *
 * Provider:
 *  - Por padrão usa getAIClient() (Gemini free tier / OpenAI).
 *  - Pode apontar para outro provider OpenAI-compatible (ex: Groq grátis) sem
 *    mexer no scan, via env NARRATOR_API_KEY / NARRATOR_BASE_URL / NARRATOR_MODEL.
 *  - Desliga totalmente com NARRATOR_DISABLED=1.
 */
import OpenAI from "openai";
import { getAIClient } from "./ai";
import type { ScanResult } from "./aiScan";

function resolveNarratorClient(userKeys?: {
  geminiApiKey?: string | null;
  openaiApiKey?: string | null;
}): { openai: OpenAI; model: string } | null {
  // 1. Provider dedicado do narrador (ex: Groq) — separado do scan.
  const dedicatedKey = process.env.NARRATOR_API_KEY;
  if (dedicatedKey) {
    return {
      openai: new OpenAI({
        apiKey: dedicatedKey,
        baseURL: process.env.NARRATOR_BASE_URL || undefined,
      }),
      model: process.env.NARRATOR_MODEL || "llama-3.1-8b-instant",
    };
  }

  // 2. Reaproveita o client do scan (Gemini/OpenAI). Usa o MESMO modelo do scan
  //    por padrão (conhecido-bom na chave do usuário); NARRATOR_MODEL sobrescreve
  //    (ex: gemini-2.0-flash, sem "thinking", quando disponível na conta).
  try {
    const { openai, model, isGemini } = getAIClient(userKeys);
    // sem nenhuma chave real utilizável -> não tenta (fallback pro template)
    const hasGemini = !!(process.env.GEMINI_API_KEY || userKeys?.geminiApiKey);
    const hasOpenAI = !!(process.env.OPENAI_API_KEY || userKeys?.openaiApiKey);
    if (!isGemini && !hasOpenAI) return null;
    if (isGemini && !hasGemini) return null;
    const narratorModel = process.env.NARRATOR_MODEL ?? model;
    return { openai, model: narratorModel };
  } catch {
    return null;
  }
}

const DIRECTION_LABEL: Record<string, string> = {
  COMPRA_FORTE: "COMPRA (forte)",
  COMPRA_FRACA: "COMPRA (moderada)",
  VENDA_FORTE: "VENDA (forte)",
  VENDA_FRACA: "VENDA (moderada)",
  NEUTRO: "NEUTRO",
};

/** Gera a explicação em PT-BR de um sinal já calculado. Retorna null em qualquer falha. */
export async function narrateSignal(input: {
  symbol: string;
  timeframe: string;
  mode: "SMC" | "CLASSICO";
  result: ScanResult;
  userKeys?: { geminiApiKey?: string | null; openaiApiKey?: string | null };
}): Promise<string | null> {
  if (process.env.NARRATOR_DISABLED === "1") return null;
  const r = input.result;
  if (!r.hasSetup) return null;

  const client = resolveNarratorClient(input.userKeys);
  if (!client) return null;

  const checklist = r.checklist_smc ?? r.checklist_classico ?? {};
  const confluencias = Object.entries(checklist)
    .filter(([, v]) => v === true)
    .map(([k]) => k)
    .join(", ");

  const fatos = {
    ativo: input.symbol,
    timeframe: input.timeframe,
    modo: input.mode,
    direcao: DIRECTION_LABEL[r.direction ?? "NEUTRO"] ?? r.direction,
    probabilidade: r.probability,
    confianca: r.confidence,
    entrada: r.entryPrice,
    zona_entrada: [r.entryZoneLow, r.entryZoneHigh],
    stop: r.stopPrice,
    alvos: [r.target1, r.target2, r.target3],
    risco_retorno: r.riskReward,
    tipo_setup: r.tipo_setup,
    confluencias_confirmadas: confluencias,
    estrutura: r.structure,
  };

  const system =
    "Você é um trader profissional que explica, em português do Brasil, um sinal de trade JÁ CALCULADO para um assinante. " +
    "REGRAS: não recalcule nem invente números; use apenas os dados fornecidos. Escreva 2 a 3 frases, tom direto e profissional, " +
    "explicando o racional: por que a direção, onde entrar, onde é o stop e o alvo, e cite as confluências confirmadas. " +
    "Sem markdown, sem asteriscos, sem emojis, sem títulos. Apenas o parágrafo.";

  try {
    const completion = await withTimeout(
      client.openai.chat.completions.create(
        {
          model: client.model,
          temperature: 0.4,
          // folga p/ modelos de raciocínio (gemini-2.5-flash gasta tokens "pensando"
          // antes do texto); narração é curta, mas o teto precisa caber o thinking
          // inteiro + o parágrafo, senão o texto sai cortado no meio.
          max_tokens: 2500,
          messages: [
            { role: "system", content: system },
            { role: "user", content: `Dados do sinal (JSON):\n${JSON.stringify(fatos)}\n\nEscreva a explicação.` },
          ],
        },
        { timeout: 8000, maxRetries: 0 },
      ),
    );
    const text = completion?.choices?.[0]?.message?.content?.trim();
    if (!text) return null;
    // remove eventuais cercas/aspas
    return text.replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/i, "").replace(/^"|"$/g, "").trim();
  } catch (e) {
    console.warn(`[narrator] falhou para ${input.symbol}/${input.mode}: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

/** Corta a espera em no máximo 9s, para não segurar o scan se a IA travar. */
function withTimeout<T>(p: Promise<T>): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("narrator timeout")), 9000)),
  ]);
}
