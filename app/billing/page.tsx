import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function BillingPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-charcoal p-6">
      <div className="glass mx-auto w-full max-w-md rounded-xl p-8">
        <div className="flex items-center gap-2 text-amber-500">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs uppercase tracking-widest">Assinatura inativa</span>
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Acesso à mesa de análise
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Trade Vision Pro — análises ilimitadas, modo SMC, histórico e exportação.
        </p>

        <div className="mt-6 flex items-baseline gap-2">
          <span className="num text-4xl font-semibold">R$ 97</span>
          <span className="text-sm text-zinc-500">/mês</span>
        </div>

        <form action="/api/billing/checkout" method="POST" className="mt-6">
          <button
            type="submit"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-medium text-charcoal transition hover:bg-emerald-400"
          >
            Assinar agora
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </button>
        </form>

        <Link
          href="/"
          className="mt-4 block text-center text-xs text-zinc-500 hover:text-zinc-300"
        >
          Voltar para a home
        </Link>
      </div>
    </main>
  );
}
