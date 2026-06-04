import Link from "next/link";
import { ArrowRight, Crosshair, LineChart, ShieldCheck, Sparkle } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-charcoal text-offwhite">
      <div className="pointer-events-none absolute inset-0 bg-grid bg-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-electric/10 blur-[160px]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-white/[0.03]">
            <Crosshair className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <span className="text-sm font-medium tracking-tight">
            Trade Vision<span className="text-zinc-500">.ai</span>
          </span>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/sign-in"
            className="text-zinc-400 transition hover:text-offwhite"
          >
            Entrar
          </Link>
          <Link
            href="/sign-up"
            className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-offwhite transition hover:bg-white/[0.08]"
          >
            Criar conta
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-24 pt-20 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
          <Sparkle className="h-3 w-3 text-amber-500" />
          Análise institucional movida por Claude Vision
        </div>

        <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-7xl">
          Análise institucional
          <br />
          <span className="shimmer-text">em segundos.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-pretty text-base text-zinc-400 md:text-lg">
          Envie um print do gráfico. Receba estrutura, POIs, plano de trade com
          entrada, stop, alvo e R:R — no padrão de mesa proprietária.
        </p>

        <div className="mt-10 flex items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className="group inline-flex items-center gap-2 rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-medium text-charcoal transition hover:bg-emerald-400"
          >
            Começar agora
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="#features"
            className="rounded-md border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[0.06]"
          >
            Ver capacidades
          </Link>
        </div>

        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-4 text-left">
          {[
            { k: "TF", v: "M1 → 1W" },
            { k: "Latência", v: "< 8s" },
            { k: "Modos", v: "Clássico · SMC" },
          ].map((m) => (
            <div
              key={m.k}
              className="glass rounded-lg p-4"
            >
              <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                {m.k}
              </div>
              <div className="num mt-1 text-lg text-offwhite">{m.v}</div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="features"
        className="relative z-10 mx-auto grid max-w-5xl gap-4 px-6 pb-32 md:grid-cols-3"
      >
        {[
          {
            icon: LineChart,
            title: "Modo Clássico",
            body: "Tendência, suportes/resistências e padrões de candles, lidos com a frieza de um analista sênior.",
          },
          {
            icon: Crosshair,
            title: "Modo SMC",
            body: "BOS/CHoCH, Order Blocks, FVG e zonas de liquidez. A leitura institucional que move o preço.",
          },
          {
            icon: ShieldCheck,
            title: "Quality Gate",
            body: "Se o gráfico não é legível, a IA recusa. Sem entradas inventadas. Sem ruído.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="glass rounded-xl p-5 transition hover:border-white/15"
          >
            <Icon className="h-4 w-4 text-emerald-500" />
            <h3 className="mt-4 text-sm font-medium text-offwhite">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">{body}</p>
          </div>
        ))}
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} Trade Vision. Apenas conteúdo educacional.
        Não constitui recomendação de investimento.
      </footer>
    </main>
  );
}
