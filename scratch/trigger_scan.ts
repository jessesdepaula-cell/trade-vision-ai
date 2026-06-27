import { scanAllActiveForUser } from "../lib/scan/orchestrator";

async function main() {
  const userId = "cmpztrhmh0000i9041xb1s9ia";
  console.log(`Iniciando escaneamento para o usuário: ${userId}`);
  const results = await scanAllActiveForUser(userId);
  console.log("Resultados:", JSON.stringify(results, null, 2));
}

main().catch(console.error);
