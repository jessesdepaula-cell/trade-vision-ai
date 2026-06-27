import Link from "next/link";
import { ArrowRight, Check, Sparkles, Shield, Target, Zap, TrendingUp, HelpCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#070709] text-zinc-300 selection:bg-emerald-500/30 selection:text-emerald-300 relative overflow-hidden">
      {/* Glow de Fundo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] bg-gradient-to-b from-emerald-950/20 to-transparent blur-[120px] pointer-events-none z-0" />

      {/* Header Fixo Simples */}
      <header className="relative z-10 mx-auto max-w-6xl flex items-center justify-between px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md border border-emerald-500/20 bg-emerald-500/5">
            <Target className="h-4 w-4 text-emerald-500" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-offwhite">Trade Vision<span className="text-zinc-500">.ai</span></span>
        </div>
        <nav className="flex items-center gap-4 text-xs">
          <Link
            href="/sign-in"
            className="text-zinc-400 hover:text-zinc-200 transition"
          >
            Entrar
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-offwhite transition hover:bg-white/[0.08]"
          >
            Área de Membros
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pt-20 pb-16 text-center">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.03] px-3.5 py-1.5 text-xs text-emerald-400 font-medium tracking-wide">
          <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
          Mapeamento Técnico de Alta Precisão
        </div>
        <h1 className="text-balance text-4xl font-extrabold tracking-tight text-offwhite sm:text-7xl">
          Opere como as Instituições. <br />
          <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
            Sem achismos.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-zinc-400 sm:text-lg">
          Pare de ser o stop dos grandes bancos. O Trade Vision AI traduz gráficos complexos em planos de trade claros com Entrada, Stop Loss e Alvos objetivos no padrão de mesas proprietárias.
        </p>

        {/* Botões do Hero */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-sm font-bold text-charcoal shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-400 hover:shadow-emerald-500/20 focus:outline-none"
          >
            Começar Teste de 3 Dias Grátis
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#pricing"
            className="text-xs text-zinc-400 hover:text-zinc-200 transition py-4 px-6 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] w-full sm:w-auto"
          >
            Conhecer o Plano Único
          </a>
        </div>

        <div className="mt-5 flex items-center justify-center gap-6 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1">🔒 Processamento Seguro (Asaas)</span>
          <span className="flex items-center gap-1">⚡ 3 Dias de Acesso Grátis</span>
          <span className="flex items-center gap-1">📅 Cancele a Qualquer Momento</span>
        </div>
      </section>

      {/* A Cilada do Varejo vs Realidade Institucional */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-20 border-t border-white/5">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-[#0a0a0c] p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-rose-400 flex items-center gap-2">
              ⚠️ A Armadilha dos Indicadores Clássicos
            </h3>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              Robôs e indicadores convencionais reagem com atraso. Eles dizem para você comprar no topo e vender no fundo porque analisam apenas médias passadas. Os grandes investidores (Smart Money) utilizam essas zonas de stop do varejo como liquidez para suas próprias operações.
            </p>
            <ul className="mt-5 space-y-2.5 text-xs text-zinc-500">
              <li className="flex items-center gap-2">❌ Entradas atrasadas que causam ansiedade</li>
              <li className="flex items-center gap-2">❌ Rompimentos falsos que acionam seu stop loss</li>
              <li className="flex items-center gap-2">❌ Sem clareza de onde as ordens reais estão</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-emerald-500/10 bg-[#090b0a] p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-20 w-20 bg-emerald-500/[0.02] blur-xl" />
            <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
              🛡️ A Vantagem de Operar com Estrutura
            </h3>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              O Trade Vision AI analisa o gráfico através de visão computacional para rastrear o fluxo institucional. Nós mapeamos Fair Value Gaps (desequilíbrio de ofertas), Order Blocks ativos (onde o preço tende a reagir) e confirmamos a quebra de estrutura (BOS/CHoCH).
            </p>
            <ul className="mt-5 space-y-2.5 text-xs text-emerald-500/80">
              <li className="flex items-center gap-2">✔ Identificação precisa de regiões de oferta e demanda</li>
              <li className="flex items-center gap-2">✔ Alvos progressivos baseados na próxima liquidez</li>
              <li className="flex items-center gap-2">✔ Operações com Risco/Retorno matematicamente lucrativas</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Principais Recursos */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-20 border-t border-white/5">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-offwhite">
          Recursos projetados para Traders Profissionais
        </h2>
        <p className="text-center text-sm text-zinc-400 mt-2 max-w-md mx-auto">
          Deixe a tecnologia pesada conosco e foque apenas no que importa: executar seu plano.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Target className="h-5 w-5 text-emerald-400" />}
            title="Mapeamento por Imagem"
            description="Tire print de qualquer gráfico (TradingView, MT5, Corretora) e envie. Nossa IA gera a marcação técnica exata em instantes."
          />
          <FeatureCard
            icon={<Zap className="h-5 w-5 text-emerald-400" />}
            title="SMC e Price Action Integrado"
            description="Mapeie blocos de ordens, quebras estruturais (BOS/CHoCH) e suportes/resistências clássicas no mesmo gráfico."
          />
          <FeatureCard
            icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
            title="Radar de Varredura Automática"
            description="Seus ativos em watchlist são varridos constantemente por nossos servidores em múltiplos timeframes sem latência."
          />
          <FeatureCard
            icon={<Shield className="h-5 w-5 text-emerald-400" />}
            title="Alvos e Stops Técnicos"
            description="Acabe com as dúvidas de saída de trade. Receba preços exatos de entrada, stop de proteção e 3 alvos progressivos."
          />
          <FeatureCard
            icon={<Check className="h-5 w-5 text-emerald-400" />}
            title="Auditor de Assertividade"
            description="O sistema calcula automaticamente a taxa de acerto histórica de cada sinal e setup de forma 100% transparente."
          />
          <FeatureCard
            icon={<ArrowRight className="h-5 w-5 text-emerald-400" />}
            title="Exportação de Relatórios"
            description="Baixe todo seu diário de trades e histórico de sinais em planilhas CSV para auditar seus resultados quando quiser."
          />
        </div>
      </section>

      {/* Preço e Assinatura */}
      <section id="pricing" className="relative z-10 mx-auto max-w-3xl px-6 py-20 border-t border-white/5 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-offwhite">Domine o mercado sem gastar uma fortuna</h2>
        <p className="mt-3 text-sm text-zinc-400 max-w-md mx-auto">
          Um único stop evitado por conta de uma análise correta já paga a mensalidade da plataforma por meses.
        </p>

        <div className="mt-10 mx-auto max-w-sm rounded-3xl border border-emerald-500/20 bg-[#0a0c0b] p-8 shadow-2xl relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/[0.03] blur-2xl pointer-events-none" />

          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Acesso Profissional</span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
              3 Dias Grátis
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="num text-5xl font-extrabold text-offwhite tracking-tight">R$ 47,90</span>
            <span className="text-sm text-zinc-500">/mês</span>
          </div>

          <p className="mt-3 text-xs text-zinc-400 leading-relaxed">
            Cadastre-se hoje. O teste é 100% gratuito pelos primeiros 3 dias e você pode cancelar online com apenas um clique.
          </p>

          <div className="mt-6 border-t border-white/5 pt-6 space-y-3.5">
            {[
              "Leitura computacional ilimitada de prints",
              "Sinais ao vivo e radar em tempo real",
              "Configuração de ativos na watchlist",
              "Gestão de risco com alvo e stop de R:R calculado",
              "Relatório completo de taxas de assertividade",
              "Cancelamento simplificado e imediato",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-300">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <Link
            href="/sign-up"
            className="mt-8 w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-charcoal shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 hover:shadow-emerald-500/35 focus:outline-none"
          >
            Iniciar meu Teste Grátis
            <ArrowRight className="h-4 w-4" />
          </Link>

          <p className="mt-3 text-center text-[10px] text-zinc-500">
            Assinatura processada de forma segura via Asaas (Pix ou Cartão).
          </p>
        </div>
      </section>

      {/* FAQ rápido */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-20 border-t border-white/5">
        <h2 className="text-center text-xl font-bold tracking-tight text-offwhite flex items-center justify-center gap-2">
          <HelpCircle className="h-5 w-5 text-emerald-400" />
          Dúvidas Frequentes
        </h2>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold text-offwhite">O que acontece ao final dos 3 dias de teste?</h4>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Se você gostar da plataforma e decidir continuar, o Asaas processará a primeira mensalidade de R$ 47,90 automaticamente. Se decidir cancelar antes do final do terceiro dia, nenhuma cobrança será efetuada.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-offwhite">Eu preciso instalar algum robô ou indicador?</h4>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Não. O Trade Vision AI roda 100% em nuvem e através do seu navegador. Basta abrir o site, enviar as fotos ou configurar sua watchlist para receber os sinais.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-offwhite">Qual a assertividade média dos setups?</h4>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              A assertividade varia conforme a volatilidade do mercado, mas nosso auditor calcula e exibe em tempo real o histórico detalhado para que você tenha total clareza matemática da performance.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-offwhite">Posso usar em contas de mesas proprietárias?</h4>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Com certeza. As marcações técnicas de Entrada, Stop Loss e Alvos progressivos são geradas especificamente dentro das regras de risco conservadoras recomendadas por mesas proprietárias de Forex e Cripto.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-10 text-center text-xs text-zinc-500">
        <p>© 2026 Trade Vision. Todos os direitos reservados.</p>
        <p className="mt-1.5 text-[10px] text-zinc-600 max-w-lg mx-auto leading-relaxed">
          O Trade Vision AI fornece ferramentas de análise de padrões técnicos. Todo conteúdo disponibilizado tem caráter exclusivamente educacional. Não realizamos recomendações de investimentos ou promessas de lucros.
        </p>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 hover:border-white/10 transition">
      <div className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.02]">
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-semibold text-offwhite">{title}</h3>
      <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}

