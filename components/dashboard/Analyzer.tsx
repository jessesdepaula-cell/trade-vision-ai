"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  CheckCircle2,
  Crosshair,
  Image as ImageIcon,
  Loader2,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "CLASSICO" | "SMC";

type Analysis = {
  status: "VALIDO" | "INVALIDO";
  modo_aplicado?: Mode;
  validacao?: {
    ativo_identificado?: string;
    timeframe_identificado?: string;
    qualidade_imagem?: "ALTA" | "MEDIA" | "BAIXA";
  };
  mensagem_erro?: string;
  analise?: {
    estrutura_ou_tendencia?: string;
    ponto_entrada?: string;
    stop_loss?: string;
    take_profit?: string;
    risco_retorno_estimado?: string;
    confianca_ia?: string;
    justificativa?: string;
  };
};

const LOADING_STAGES = [
  "Carregando imagem…",
  "Verificando qualidade do gráfico…",
  "Mapeando estrutura de mercado…",
  "Identificando POIs e liquidez…",
  "Montando plano de trade…",
];

export function Analyzer() {
  const [mode, setMode] = useState<Mode>("SMC");
  const [imageData, setImageData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const readFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Arquivo precisa ser uma imagem (PNG, JPG ou WEBP).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Imagem grande demais (máx 8 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result as string);
      setFileName(file.name);
      setError(null);
      setResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) readFile(file);
    },
    [readFile],
  );

  async function analyze() {
    if (!imageData || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setStage(0);

    const ticker = setInterval(() => {
      setStage((s) => (s + 1) % LOADING_STAGES.length);
    }, 1400);

    try {
      const r = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData, mode }),
      });
      const data = (await r.json()) as Analysis & { error?: string };
      if (!r.ok && data?.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na requisição.");
    } finally {
      clearInterval(ticker);
      setLoading(false);
    }
  }

  const checklist = useMemo(() => {
    const v = result?.validacao;
    return [
      { label: "Nome do ativo visível", ok: !!v?.ativo_identificado },
      { label: "Timeframe legível", ok: !!v?.timeframe_identificado },
      {
        label: "Qualidade adequada",
        ok: v?.qualidade_imagem === "ALTA" || v?.qualidade_imagem === "MEDIA",
      },
    ];
  }, [result]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-4">
        <Checklist items={checklist} hasResult={!!result} />

        <div className="glass rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-zinc-500">
              Modo de análise
            </span>
          </div>
          <ModeToggle mode={mode} onChange={setMode} />
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={cn(
            "relative grid min-h-[280px] place-items-center overflow-hidden rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 transition",
            dragActive && "border-emerald-500/50 bg-emerald-500/[0.04]",
          )}
        >
          {imageData ? (
            <div className="relative w-full">
              <Image
                src={imageData}
                alt={fileName ?? "gráfico"}
                width={1200}
                height={700}
                className="mx-auto max-h-[360px] w-auto rounded-md border border-white/10 object-contain"
                unoptimized
              />
              <button
                onClick={() => {
                  setImageData(null);
                  setFileName(null);
                  setResult(null);
                }}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-charcoal/70 text-zinc-300 hover:bg-charcoal"
                aria-label="Remover imagem"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {fileName && (
                <p className="num mt-3 truncate text-center text-xs text-zinc-500">
                  {fileName}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-md border border-white/10 bg-white/[0.03]">
                <ImageIcon className="h-4 w-4 text-zinc-400" />
              </div>
              <p className="mt-4 text-sm text-zinc-300">
                Arraste o print do gráfico aqui
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                ou clique para selecionar — PNG, JPG, WEBP (máx 8 MB)
              </p>
              <button
                onClick={() => inputRef.current?.click()}
                className="mt-5 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-offwhite hover:bg-white/[0.08]"
              >
                <Upload className="h-3.5 w-3.5" />
                Selecionar arquivo
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) readFile(f);
                }}
              />
            </div>
          )}
        </div>

        <button
          onClick={analyze}
          disabled={!imageData || loading}
          className={cn(
            "group inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition",
            !imageData || loading
              ? "cursor-not-allowed bg-white/[0.04] text-zinc-500"
              : "bg-emerald-500 text-charcoal hover:bg-emerald-400",
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="shimmer-text">{LOADING_STAGES[stage]}</span>
            </>
          ) : (
            <>
              <Crosshair className="h-4 w-4" />
              Analisar com IA
            </>
          )}
        </button>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/[0.06] p-3 text-xs text-amber-200">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div>
        <ResultPanel result={result} loading={loading} />
      </div>
    </div>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-1">
      {(["CLASSICO", "SMC"] as Mode[]).map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={cn(
              "rounded-md px-3 py-2 text-xs font-medium uppercase tracking-widest transition",
              active
                ? "bg-emerald-500/[0.12] text-emerald-300 shadow-terminal"
                : "text-zinc-400 hover:text-offwhite",
            )}
          >
            {m === "CLASSICO" ? "Clássico" : "SMC"}
          </button>
        );
      })}
    </div>
  );
}

function Checklist({
  items,
  hasResult,
}: {
  items: { label: string; ok: boolean }[];
  hasResult: boolean;
}) {
  return (
    <div className="glass flex flex-wrap items-center gap-3 rounded-xl p-3 text-xs">
      {items.map((it) => (
        <div
          key={it.label}
          className={cn(
            "flex items-center gap-1.5 rounded-md border px-2 py-1",
            hasResult && it.ok
              ? "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300"
              : hasResult
                ? "border-amber-500/30 bg-amber-500/[0.06] text-amber-300"
                : "border-white/10 text-zinc-400",
          )}
        >
          <CheckCircle2 className="h-3 w-3" />
          {it.label}
        </div>
      ))}
    </div>
  );
}

function ResultPanel({
  result,
  loading,
}: {
  result: Analysis | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="glass grid min-h-[420px] place-items-center rounded-xl p-6 text-center">
        <div>
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-emerald-500" />
          <p className="mt-4 text-sm shimmer-text">Processando análise institucional…</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="glass grid min-h-[420px] place-items-center rounded-xl p-6 text-center text-sm text-zinc-500">
        <div>
          <Crosshair className="mx-auto h-5 w-5 text-zinc-600" />
          <p className="mt-3">Envie um gráfico e clique em <span className="text-zinc-300">Analisar com IA</span>.</p>
          <p className="mt-1 text-xs">O resultado aparece aqui.</p>
        </div>
      </div>
    );
  }

  if (result.status === "INVALIDO") {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-6">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs uppercase tracking-widest">Imagem inválida</span>
        </div>
        <p className="mt-3 text-sm text-amber-100">
          {result.mensagem_erro ?? "Não foi possível ler o gráfico."}
        </p>
        <p className="mt-4 text-xs text-amber-300/80">
          Reenvie um print incluindo nome do ativo, timeframe, escala de preços e ~30 velas.
        </p>
      </div>
    );
  }

  const a = result.analise ?? {};
  const v = result.validacao ?? {};

  return (
    <div className="space-y-4">
      <header className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Ativo</p>
          <p className="num text-base text-offwhite">
            {v.ativo_identificado ?? "—"}{" "}
            <span className="text-zinc-500">· {v.timeframe_identificado ?? "—"}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill>{result.modo_aplicado === "SMC" ? "SMC" : "Clássico"}</Pill>
          {v.qualidade_imagem && <Pill tone="muted">QUALIDADE · {v.qualidade_imagem}</Pill>}
          {a.confianca_ia && (
            <Pill tone="emerald">CONFIANÇA · {a.confianca_ia}</Pill>
          )}
        </div>
      </header>

      <div className="glass rounded-xl p-4">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
          {result.modo_aplicado === "SMC" ? "Estrutura" : "Tendência"}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-offwhite">
          {a.estrutura_ou_tendencia ?? "—"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <PriceCard
          icon={<Target className="h-3.5 w-3.5" />}
          label="Entrada"
          value={a.ponto_entrada}
          tone="emerald"
        />
        <PriceCard
          icon={<TrendingDown className="h-3.5 w-3.5" />}
          label="Stop Loss"
          value={a.stop_loss}
          tone="rose"
        />
        <PriceCard
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Take Profit"
          value={a.take_profit}
          tone="emerald"
        />
        <PriceCard
          icon={<Crosshair className="h-3.5 w-3.5" />}
          label="Risco / Retorno"
          value={a.risco_retorno_estimado}
          tone="amber"
        />
      </div>

      <div className="glass rounded-xl p-4">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
          Justificativa
        </p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-200">
          {a.justificativa ?? "—"}
        </p>
      </div>

      <p className="text-center text-[10px] text-zinc-600">
        Conteúdo educacional. Não constitui recomendação de investimento.
      </p>
    </div>
  );
}

function Pill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "emerald" | "muted";
}) {
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-widest",
        tone === "emerald" &&
          "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300",
        tone === "muted" && "border-white/10 bg-white/[0.03] text-zinc-400",
        tone === "default" && "border-white/10 bg-white/[0.04] text-zinc-200",
      )}
    >
      {children}
    </span>
  );
}

function PriceCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  tone: "emerald" | "rose" | "amber";
}) {
  const toneClasses = {
    emerald: "text-emerald-400",
    rose: "text-rose-400",
    amber: "text-amber-400",
  }[tone];

  return (
    <div className="glass rounded-xl p-4">
      <div className={cn("flex items-center gap-1.5 text-[10px] uppercase tracking-widest", toneClasses)}>
        {icon}
        {label}
      </div>
      <p className="num mt-2 text-lg font-medium text-offwhite">{value ?? "—"}</p>
    </div>
  );
}
