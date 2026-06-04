"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw, Trash2 } from "lucide-react";
import { deleteMt5Account, rotateMt5Token } from "@/app/actions/mt5";

export function Mt5AccountCard({
  account,
}: {
  account: {
    id: string;
    label: string | null;
    apiToken: string;
    createdAt: Date;
    lastSeenAt: Date | null;
  };
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(account.apiToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const online =
    account.lastSeenAt &&
    Date.now() - new Date(account.lastSeenAt).getTime() < 60_000;

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-offwhite">
              {account.label ?? "Conta MT5"}
            </span>
            <span
              className={
                online
                  ? "inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/[0.08] px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-300"
                  : "inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] uppercase tracking-widest text-zinc-400"
              }
            >
              <span
                className={
                  online
                    ? "h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"
                    : "h-1.5 w-1.5 rounded-full bg-zinc-500"
                }
              />
              {online ? "EA online" : "EA offline"}
            </span>
          </div>
          <p className="num mt-1 text-[11px] text-zinc-500">
            Conectada {new Date(account.createdAt).toLocaleDateString("pt-BR")}
            {account.lastSeenAt && (
              <>
                {" "}· Último ping{" "}
                {new Date(account.lastSeenAt).toLocaleTimeString("pt-BR")}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <form action={rotateMt5Token}>
            <input type="hidden" name="id" value={account.id} />
            <button
              type="submit"
              className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 hover:bg-white/[0.04] hover:text-offwhite"
              title="Gerar novo token"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </form>
          <form
            action={async (fd) => {
              if (confirm("Remover esta conta MT5?")) await deleteMt5Account(fd);
            }}
          >
            <input type="hidden" name="id" value={account.id} />
            <button className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 hover:text-rose-400">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">API token</p>
        <div className="mt-1.5 flex items-center gap-2 rounded-md border border-white/10 bg-charcoal-900 px-3 py-2">
          <code className="num flex-1 truncate text-[11px] text-emerald-300">
            {account.apiToken}
          </code>
          <button
            onClick={copy}
            className="grid h-6 w-6 place-items-center rounded text-zinc-400 hover:text-offwhite"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-zinc-500">
          Cole este token no parâmetro <span className="num text-zinc-300">ApiToken</span> do EA TradeVisionBridge.mq5.
        </p>
      </div>
    </div>
  );
}
