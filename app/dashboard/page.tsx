import { Analyzer } from "@/components/dashboard/Analyzer";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Mesa de análise</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Faça upload de um gráfico nítido. Selecione o modo. A leitura institucional
          aparece em segundos.
        </p>
      </div>
      <Analyzer />
    </div>
  );
}
