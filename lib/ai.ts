import OpenAI from "openai";

export function getAIClient() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  if (geminiApiKey) {
    return {
      openai: new OpenAI({
        apiKey: geminiApiKey,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      }),
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      isGemini: true,
    };
  }

  return {
    openai: new OpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? "",
    }),
    model: process.env.OPENAI_MODEL ?? "gpt-4o",
    isGemini: false,
  };
}
