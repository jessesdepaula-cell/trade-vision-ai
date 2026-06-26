import { type ModeStats, classifyAccuracy } from "@/lib/modeStats";
import { cn } from "@/lib/utils";

export function ModeAccuracyMeter({
  smc,
  classico,
  show = "both",
}: {
  smc: ModeStats;
  classico: ModeStats;
  show?: "both" | "smc" | "classico";
}) {
  if (show === "smc") {
    return (
      <div className="grid gap-3">
        <AccuracyCard stats={smc} accent="emerald" />
      </div>
    );
  }
  if (show === "classico") {
    return (
      <div className="grid gap-3">
        <AccuracyCard stats={classico} accent="amber" />
      </div>
    );
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <AccuracyCard stats={smc} accent="emerald" />
      <AccuracyCard stats={classico} accent="amber" />
    </div>
  );
}

function AccuracyCard({
  stats,
  accent,
}: {
  stats: ModeStats;
  accent: "emerald" | "amber";
}) {
  const label = stats.mode === "SMC" ? "SMC" : "Clássico";
  const cls = classifyAccuracy(stats.winRate, stats.wins + stats.losses);
  const accentClass = accent === "emerald" ? "text-emerald-300" : "text-amber-300";
  const accentBorder = accent === "emerald" ? "border-emerald-500/30" : "border-amber-500/30";
  const accentBg = accent === "emerald" ? "bg-emerald-500/[0.06]" : "bg-amber-500/[0.06]";

  return (
    <div className={cn("relative overflow-hidden rounded-xl border p-5", accentBorder, accentBg)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Assertividade</p>
          <p className={cn("mt-0.5 text-lg font-semibold tracking-tight", accentClass)}>{label}</p>
        </div>
        <ClassBadge cls={cls} />
      </div>

      <div className="mt-4 flex items-center gap-5">
        <Gauge value={stats.winRate} hasSample={stats.wins + stats.losses >= 10} />
        <div className="flex-1 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Trades fechados</span>
            <span className="num text-zinc-200">{stats.total}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Ganhos</span>
            <span className="num text-emerald-400">{stats.wins}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Perdas</span>
            <span className="num text-rose-400">{stats.losses}</span>
          </div>
          <div className="flex items-center justify-between border-t border-white/5 pt-2">
            <span className="text-zinc-500">R acumulado</span>
            <span
              className={cn(
                "num font-medium",
                stats.rTotal > 0
                  ? "text-emerald-400"
                  : stats.rTotal < 0
                    ? "text-rose-400"
                    : "text-zinc-300",
              )}
            >
              {stats.rTotal > 0 ? "+" : ""}
              {stats.rTotal.toFixed(2)}R
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Expectativa</span>
            <span
              className={cn(
                "num font-medium",
                stats.expectancy > 0
                  ? "text-emerald-400"
                  : stats.expectancy < 0
                    ? "text-rose-400"
                    : "text-zinc-300",
              )}
            >
              {stats.expectancy > 0 ? "+" : ""}
              {stats.expectancy.toFixed(2)}R/trade
            </span>
          </div>
        </div>
      </div>

      {stats.symbols && stats.symbols.length > 0 && (
        <div className="mt-4 border-t border-white/5 pt-3">
          <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">
            Ativos operados ({stats.symbols.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {stats.symbols.map((item) => (
              <span
                key={item.symbol}
                className="num inline-flex items-center gap-1 rounded bg-white/[0.03] border border-white/5 px-2 py-0.5 text-[10px] text-zinc-300 font-medium"
              >
                <span>{item.symbol}</span>
                <span className="text-zinc-500 text-[9px]">({item.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 text-[10px] text-zinc-500">{cls.hint}</p>
    </div>
  );
}

function ClassBadge({ cls }: { cls: ReturnType<typeof classifyAccuracy> }) {
  const tone = cls.tone;
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-1 text-[10px] uppercase tracking-widest",
        tone === "emerald" && "border-emerald-500/40 bg-emerald-500/[0.10] text-emerald-300",
        tone === "amber" && "border-amber-500/40 bg-amber-500/[0.10] text-amber-300",
        tone === "rose" && "border-rose-500/40 bg-rose-500/[0.10] text-rose-300",
        tone === "muted" && "border-white/10 bg-white/[0.03] text-zinc-400",
      )}
    >
      {cls.label}
    </span>
  );
}

function Gauge({ value, hasSample }: { value: number; hasSample: boolean }) {
  // Semicírculo: arc de 180° a 0°
  const W = 160;
  const H = 100;
  const cx = W / 2;
  const cy = H - 12;
  const r = 56;
  const stroke = 12;

  const v = Math.max(0, Math.min(100, value));
  const angleDeg = 180 - (v / 100) * 180; // 0% = 180° (esquerda), 100% = 0° (direita)
  const angleRad = (angleDeg * Math.PI) / 180;
  const tipX = cx + r * Math.cos(angleRad);
  const tipY = cy - r * Math.sin(angleRad);
  const startX = cx - r;
  const startY = cy;
  const endX = cx + r;
  const endY = cy;

  // Fill arc path
  const fillArc = describeArc(cx, cy, r, 180, angleDeg);
  // Background arc full
  const bgArc = `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;

  const color = hasSample
    ? v >= 65
      ? "#10B981"
      : v >= 55
        ? "#34D399"
        : v >= 50
          ? "#F59E0B"
          : v >= 40
            ? "#FB923C"
            : "#F43F5E"
    : "#52525B";

  // Marcas em 50%
  const mark50 = polar(cx, cy, r + 2, 90);
  const mark50Inner = polar(cx, cy, r - stroke - 2, 90);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-[100px] w-[160px] shrink-0">
      {/* fundo */}
      <path d={bgArc} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" strokeLinecap="round" />
      {/* fill */}
      {v > 0 && (
        <path d={fillArc} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" />
      )}
      {/* marca 50% */}
      <line
        x1={mark50Inner.x}
        y1={mark50Inner.y}
        x2={mark50.x}
        y2={mark50.y}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1"
      />
      {/* ponteiro */}
      <line
        x1={cx}
        y1={cy}
        x2={tipX}
        y2={tipY}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="3.5" fill="#0A0A0A" stroke={color} strokeWidth="1.5" />
      {/* valor central */}
      <text
        x={cx}
        y={cy - 18}
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fontFamily="JetBrains Mono, monospace"
        fill={hasSample ? "#F5F5F7" : "rgba(244,244,247,0.5)"}
      >
        {hasSample ? `${v.toFixed(0)}%` : "—"}
      </text>
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fontSize="8"
        fontFamily="JetBrains Mono, monospace"
        fill="rgba(244,244,247,0.4)"
        letterSpacing="1.2"
      >
        WIN RATE
      </text>
      {/* labels 0 / 50 / 100 */}
      <text x={4} y={H - 2} fontSize="8" fill="rgba(244,244,247,0.35)" fontFamily="JetBrains Mono, monospace">
        0
      </text>
      <text x={cx - 5} y={6} fontSize="8" fill="rgba(244,244,247,0.35)" fontFamily="JetBrains Mono, monospace">
        50
      </text>
      <text x={W - 18} y={H - 2} fontSize="8" fill="rgba(244,244,247,0.35)" fontFamily="JetBrains Mono, monospace">
        100
      </text>
    </svg>
  );
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  const largeArc = startDeg - endDeg <= 180 ? 0 : 1;
  // sweep flag 1 = anti-horário em SVG (mas com nossa convenção é horário)
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}
