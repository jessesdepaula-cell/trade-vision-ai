"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChartCandle = {
  t?: number; // unix seconds
  o: number;
  h: number;
  l: number;
  c: number;
};

type ViewState = {
  visibleCount: number;
  offset: number; // candles from right end
  yZoom: number; // multiplier on auto-fit range (1 = fit)
  yPan: number; // vertical pan in % of range
};

type DragMode = "pan" | "zoomY" | "zoomX" | null;

const W = 1000;
const H = 360;
const padL = 12;
const padR = 80;
const padT = 16;
const padB = 28;
const innerW = W - padL - padR;
const innerH = H - padT - padB;

export function SignalChart({
  candles,
  symbol,
  isBuy,
  entry,
  stop,
  target,
  targets,
  recommendedTarget,
  status,
  exitPrice,
  rMultiple,
  scannedAt,
}: {
  candles: ChartCandle[];
  symbol: string;
  isBuy: boolean;
  entry: number | null;
  stop: number | null;
  target: number | null;
  targets?: (number | null)[];
  recommendedTarget?: number | null;
  status: string;
  exitPrice?: number | null;
  rMultiple?: number | null;
  scannedAt: string;
}) {
  const dec = useMemo(() => decimals(symbol), [symbol]);
  const initialVisible = Math.min(candles.length, 80);
  const [view, setView] = useState<ViewState>({
    visibleCount: initialVisible,
    offset: 0,
    yZoom: 1,
    yPan: 0,
  });
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    startView: ViewState;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // visible slice
  const visible = useMemo(() => {
    const total = candles.length;
    if (total === 0) return [];
    const vc = Math.max(10, Math.min(total, view.visibleCount));
    const off = Math.max(0, Math.min(total - vc, view.offset));
    return candles.slice(total - vc - off, total - off);
  }, [candles, view.visibleCount, view.offset]);

  // y range (auto-fit then scale by zoom + pan)
  const { yMin, yMax } = useMemo(() => {
    if (visible.length === 0) return { yMin: 0, yMax: 1 };
    const vals = visible.flatMap((c) => [c.h, c.l]);
    [entry, stop, exitPrice].forEach((v) => {
      if (typeof v === "number") vals.push(v);
    });
    targets?.forEach((v) => {
      if (typeof v === "number") vals.push(v);
    });
    const autoMin = Math.min(...vals);
    const autoMax = Math.max(...vals);
    const pad = Math.max((autoMax - autoMin) * 0.05, autoMax * 0.00005);
    const baseMin = autoMin - pad;
    const baseMax = autoMax + pad;
    const center = (baseMin + baseMax) / 2;
    const half = (baseMax - baseMin) / 2 / Math.max(0.2, view.yZoom);
    const panAmount = (baseMax - baseMin) * view.yPan;
    return { yMin: center - half + panAmount, yMax: center + half + panAmount };
  }, [visible, entry, stop, exitPrice, targets, view.yZoom, view.yPan]);

  const range = Math.max(0.0000001, yMax - yMin);
  const candleW = innerW / Math.max(1, visible.length);
  const xOf = (i: number) => padL + i * candleW + candleW / 2;
  const yOf = (v: number) => padT + ((yMax - v) / range) * innerH;

  // --- mouse / drag handlers ---
  function clientToSvg(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    };
  }

  function detectZone(x: number, y: number): "yScale" | "xScale" | "plot" {
    if (x > W - padR) return "yScale";
    if (y > H - padB) return "xScale";
    return "plot";
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    const { x, y } = clientToSvg(e.clientX, e.clientY);
    const zone = detectZone(x, y);
    let mode: DragMode = "pan";
    if (zone === "yScale") mode = "zoomY";
    else if (zone === "xScale") mode = "zoomX";
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startView: { ...view },
    };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const { x, y } = clientToSvg(e.clientX, e.clientY);
    setCursor({ x, y });
    const drag = dragRef.current;
    if (!drag || !drag.mode) return;
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const dxPx = e.clientX - drag.startX;
    const dyPx = e.clientY - drag.startY;
    if (drag.mode === "pan") {
      const dxPct = dxPx / rect.width;
      const candleDelta = Math.round(dxPct * drag.startView.visibleCount);
      const maxOffset = Math.max(0, candles.length - drag.startView.visibleCount);
      const newOffset = Math.max(
        0,
        Math.min(maxOffset, drag.startView.offset + candleDelta),
      );
      setView((v) => ({ ...v, offset: newOffset }));
    } else if (drag.mode === "zoomY") {
      const dyPct = dyPx / rect.height;
      const newZoom = Math.max(0.3, Math.min(5, drag.startView.yZoom * (1 - dyPct * 2)));
      setView((v) => ({ ...v, yZoom: newZoom }));
    } else if (drag.mode === "zoomX") {
      const dxPct = dxPx / rect.width;
      // arrastar pra direita = zoom out (mais velas), esquerda = zoom in
      const factor = 1 + dxPct * 2;
      const newCount = Math.max(
        15,
        Math.min(candles.length, Math.round(drag.startView.visibleCount / factor)),
      );
      setView((v) => ({ ...v, visibleCount: newCount }));
    }
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    dragRef.current = null;
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {}
  }

  function onWheel(e: React.WheelEvent<SVGSVGElement>) {
    e.preventDefault();
    const { x, y } = clientToSvg(e.clientX, e.clientY);
    const zone = detectZone(x, y);
    if (zone === "yScale") {
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      setView((v) => ({ ...v, yZoom: Math.max(0.3, Math.min(5, v.yZoom * factor)) }));
    } else {
      // zoom X
      const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
      setView((v) => {
        const newCount = Math.max(
          15,
          Math.min(candles.length, Math.round(v.visibleCount * factor)),
        );
        return { ...v, visibleCount: newCount };
      });
    }
  }

  function reset() {
    setView({ visibleCount: initialVisible, offset: 0, yZoom: 1, yPan: 0 });
  }

  // global pointermove guard pra parar drag se solta fora
  useEffect(() => {
    function onUp() {
      dragRef.current = null;
    }
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, []);

  const isZoomedOrPanned =
    view.visibleCount !== initialVisible ||
    view.offset !== 0 ||
    Math.abs(view.yZoom - 1) > 0.01 ||
    Math.abs(view.yPan) > 0.01;

  if (candles.length === 0) {
    return (
      <div className="grid h-[200px] place-items-center rounded-md border border-white/5 bg-white/[0.01] text-xs text-zinc-500">
        Sem dados de velas
      </div>
    );
  }

  // Y ticks
  const yTicks = niceTicks(yMin, yMax, 5);

  // X labels — 5 timestamps espaçados
  const xLabels: { x: number; label: string }[] = [];
  if (visible.length > 0 && visible[0].t) {
    const steps = Math.min(5, visible.length);
    for (let i = 0; i < steps; i++) {
      const idx = Math.floor((i * (visible.length - 1)) / Math.max(1, steps - 1));
      const c = visible[idx];
      if (c.t) {
        const d = new Date(c.t * 1000);
        xLabels.push({
          x: xOf(idx),
          label: `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
        });
      }
    }
  }

  // fill/close markers
  const fillIdxFull = findFillIndex(candles, entry, isBuy);
  const closeIdxFull =
    fillIdxFull !== null && (status === "WIN" || status === "LOSS")
      ? findCloseIndex(candles, isBuy, stop, target, fillIdxFull)
      : null;
  const visibleStart = candles.length - visible.length - view.offset;
  const fillIdxInView =
    fillIdxFull !== null && fillIdxFull >= visibleStart && fillIdxFull < visibleStart + visible.length
      ? fillIdxFull - visibleStart
      : null;
  const closeIdxInView =
    closeIdxFull !== null && closeIdxFull >= visibleStart && closeIdxFull < visibleStart + visible.length
      ? closeIdxFull - visibleStart
      : null;

  // crosshair price at cursor
  const cursorPrice = cursor ? yMax - ((cursor.y - padT) / innerH) * range : null;
  const cursorIdx = cursor
    ? Math.max(0, Math.min(visible.length - 1, Math.floor((cursor.x - padL) / candleW)))
    : null;
  const cursorCandle = cursorIdx !== null ? visible[cursorIdx] : null;

  // cursor style
  const cursorStyle = (() => {
    if (!cursor) return "default";
    const zone = detectZone(cursor.x, cursor.y);
    if (dragRef.current?.mode === "pan") return "grabbing";
    if (zone === "yScale") return "ns-resize";
    if (zone === "xScale") return "ew-resize";
    return "grab";
  })();

  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.015]">
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-500">
        <span className="flex items-center gap-2">
          <span className="num text-zinc-300">{symbol}</span>
          <span className="text-zinc-600">·</span>
          <span>{visible.length} de {candles.length} velas</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="hidden items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[9px] tracking-widest sm:inline-flex">
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            Não repinta · {new Date(scannedAt).toLocaleTimeString("pt-BR")}
          </span>
          <span className="hidden text-[9px] text-zinc-600 lg:inline">
            Arraste · roda do mouse · arraste o eixo
          </span>
          {isZoomedOrPanned && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-zinc-300 hover:bg-white/[0.08]"
              title="Resetar visualização"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="block h-[360px] w-full select-none touch-none"
        style={{ cursor: cursorStyle }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => setCursor(null)}
        onWheel={onWheel}
        onDoubleClick={reset}
      >
        {/* Grade horizontal */}
        {yTicks.map((v) => (
          <g key={v}>
            <line
              x1={padL}
              y1={yOf(v)}
              x2={W - padR}
              y2={yOf(v)}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
            <text
              x={W - padR + 6}
              y={yOf(v) + 3}
              fontSize="9"
              fill="rgba(244,244,247,0.4)"
              fontFamily="JetBrains Mono, monospace"
            >
              {v.toFixed(dec)}
            </text>
          </g>
        ))}

        {/* Zonas de interação visualizadas (sutil) */}
        <rect
          x={W - padR}
          y={padT}
          width={padR}
          height={innerH}
          fill="rgba(255,255,255,0.005)"
        />
        <rect
          x={padL}
          y={H - padB}
          width={innerW}
          height={padB}
          fill="rgba(255,255,255,0.005)"
        />

        {/* Linhas entrada/stop/alvos */}
        {entry !== null && (
          <PriceLine y={yOf(entry)} price={entry} label="ENTRADA" color="#10B981" dec={dec} solid />
        )}
        {stop !== null && (
          <PriceLine y={yOf(stop)} price={stop} label="STOP" color="#F43F5E" dec={dec} solid />
        )}
        {targets && targets.length > 0
          ? targets.map((tv, i) => {
              if (typeof tv !== "number") return null;
              const isRec = (recommendedTarget ?? 1) === i + 1;
              return (
                <PriceLine
                  key={i}
                  y={yOf(tv)}
                  price={tv}
                  label={`ALVO ${i + 1}${isRec ? " ★" : ""}`}
                  color={isRec ? "#10B981" : "#F59E0B"}
                  dec={dec}
                  solid={false}
                />
              );
            })
          : target !== null && (
              <PriceLine
                y={yOf(target)}
                price={target}
                label="ALVO ★"
                color="#10B981"
                dec={dec}
                solid={false}
              />
            )}

        {typeof exitPrice === "number" && (
          <PriceLine
            y={yOf(exitPrice)}
            price={exitPrice}
            label={status === "WIN" ? "SAÍDA ✓" : "SAÍDA ✗"}
            color={status === "WIN" ? "#34D399" : "#FB7185"}
            dec={dec}
            solid
            thick
          />
        )}

        {/* Velas */}
        {visible.map((c, i) => {
          const cx = xOf(i);
          const isUp = c.c >= c.o;
          const color = isUp ? "#10B981" : "#F43F5E";
          const yH = yOf(c.h);
          const yL = yOf(c.l);
          const yO = yOf(c.o);
          const yC = yOf(c.c);
          const bodyTop = Math.min(yO, yC);
          const bodyH = Math.max(1, Math.abs(yC - yO));
          const w = Math.max(1, candleW * 0.65);
          return (
            <g key={i}>
              <line x1={cx} y1={yH} x2={cx} y2={yL} stroke={color} strokeWidth="1" opacity="0.9" />
              <rect x={cx - w / 2} y={bodyTop} width={w} height={bodyH} fill={color} opacity="0.92" />
            </g>
          );
        })}

        {/* Marcador FILL */}
        {fillIdxInView !== null && entry !== null && (
          <g>
            <circle cx={xOf(fillIdxInView)} cy={yOf(entry)} r="6" fill="#0A0A0A" stroke="#10B981" strokeWidth="2" />
            <circle cx={xOf(fillIdxInView)} cy={yOf(entry)} r="2.5" fill="#10B981" />
          </g>
        )}

        {/* Marcador FECHAMENTO */}
        {closeIdxInView !== null && typeof exitPrice === "number" && (
          <g>
            <circle
              cx={xOf(closeIdxInView)}
              cy={yOf(exitPrice)}
              r="8"
              fill={status === "WIN" ? "#34D399" : "#FB7185"}
              opacity="0.94"
            />
            <text
              x={xOf(closeIdxInView)}
              y={yOf(exitPrice) + 4}
              fontSize="12"
              fontWeight="700"
              textAnchor="middle"
              fill="#0A0A0A"
              fontFamily="JetBrains Mono, monospace"
            >
              {status === "WIN" ? "✓" : "✗"}
            </text>
          </g>
        )}

        {/* Crosshair */}
        {cursor && (
          <g pointerEvents="none">
            <line x1={cursor.x} y1={padT} x2={cursor.x} y2={H - padB} stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="2 3" />
            <line x1={padL} y1={cursor.y} x2={W - padR} y2={cursor.y} stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="2 3" />
            {/* preço no eixo Y */}
            {cursorPrice !== null && (
              <g>
                <rect x={W - padR + 4} y={cursor.y - 9} width="72" height="18" rx="3" fill="#0A0A0A" stroke="rgba(255,255,255,0.3)" />
                <text
                  x={W - padR + 40}
                  y={cursor.y + 4}
                  fontSize="10"
                  textAnchor="middle"
                  fill="#F5F5F7"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {cursorPrice.toFixed(dec)}
                </text>
              </g>
            )}
            {/* time no eixo X */}
            {cursorCandle?.t && (
              <g>
                <rect x={cursor.x - 52} y={H - padB + 2} width="104" height="18" rx="3" fill="#0A0A0A" stroke="rgba(255,255,255,0.3)" />
                <text
                  x={cursor.x}
                  y={H - padB + 14}
                  fontSize="10"
                  textAnchor="middle"
                  fill="#F5F5F7"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {fmtTimestamp(cursorCandle.t)}
                </text>
              </g>
            )}
          </g>
        )}

        {/* X labels */}
        {xLabels.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={H - 8}
            fontSize="9"
            textAnchor="middle"
            fill="rgba(244,244,247,0.4)"
            fontFamily="JetBrains Mono, monospace"
          >
            {l.label}
          </text>
        ))}

        {/* Badge de status no canto */}
        {(status === "WIN" || status === "LOSS") && (
          <g pointerEvents="none">
            <rect
              x={padL + 8}
              y={padT + 8}
              width="138"
              height="32"
              rx="6"
              fill={status === "WIN" ? "rgba(16,185,129,0.20)" : "rgba(244,63,94,0.20)"}
              stroke={status === "WIN" ? "rgba(16,185,129,0.6)" : "rgba(244,63,94,0.6)"}
            />
            <text
              x={padL + 18}
              y={padT + 28}
              fontSize="12"
              fontWeight="700"
              fill={status === "WIN" ? "#34D399" : "#FB7185"}
              fontFamily="JetBrains Mono, monospace"
            >
              {status === "WIN" ? "GANHO" : "PERDA"}{" "}
              {typeof rMultiple === "number"
                ? `${rMultiple > 0 ? "+" : ""}${rMultiple.toFixed(2)}R`
                : ""}
            </text>
          </g>
        )}

        {(status === "PENDING" || status === "FILLED") && (
          <g pointerEvents="none">
            <rect
              x={padL + 8}
              y={padT + 8}
              width="160"
              height="26"
              rx="5"
              fill={status === "FILLED" ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)"}
              stroke={status === "FILLED" ? "rgba(245,158,11,0.5)" : "rgba(255,255,255,0.15)"}
            />
            <text
              x={padL + 18}
              y={padT + 25}
              fontSize="10"
              fontWeight="600"
              fill={status === "FILLED" ? "#FBBF24" : "rgba(244,244,247,0.7)"}
              fontFamily="JetBrains Mono, monospace"
            >
              {status === "FILLED" ? "● EM EXECUÇÃO" : "○ AGUARDANDO ENTRADA"}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

function PriceLine({
  y,
  price,
  label,
  color,
  dec,
  solid,
  thick,
}: {
  y: number;
  price: number;
  label: string;
  color: string;
  dec: number;
  solid: boolean;
  thick?: boolean;
}) {
  return (
    <g pointerEvents="none">
      <line
        x1={padL}
        y1={y}
        x2={W - padR}
        y2={y}
        stroke={color}
        strokeWidth={thick ? "1.5" : "1"}
        strokeDasharray={solid ? undefined : "4 4"}
        opacity={solid ? 0.85 : 0.7}
      />
      <rect x={W - padR + 4} y={y - 8} width="72" height="16" rx="3" fill={color} opacity="0.92" />
      <text
        x={W - padR + 22}
        y={y + 4}
        fontSize="9"
        fontWeight="700"
        fill="#0A0A0A"
        fontFamily="JetBrains Mono, monospace"
      >
        {label}
      </text>
      <text
        x={padL + 6}
        y={y - 3}
        fontSize="9"
        fill={color}
        fontFamily="JetBrains Mono, monospace"
      >
        {price.toFixed(dec)}
      </text>
    </g>
  );
}

function findFillIndex(
  candles: ChartCandle[],
  entry: number | null,
  isBuy: boolean,
): number | null {
  if (entry === null) return null;
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    if (c.l <= entry && c.h >= entry) return i;
  }
  return null;
}

function findCloseIndex(
  candles: ChartCandle[],
  isBuy: boolean,
  stop: number | null,
  target: number | null,
  fillIdx: number | null,
): number | null {
  if (fillIdx === null) return null;
  for (let i = fillIdx + 1; i < candles.length; i++) {
    const c = candles[i];
    if (isBuy) {
      if (stop !== null && c.l <= stop) return i;
      if (target !== null && c.h >= target) return i;
    } else {
      if (stop !== null && c.h >= stop) return i;
      if (target !== null && c.l <= target) return i;
    }
  }
  return null;
}

function decimals(symbol: string): number {
  if (symbol.includes("XAU") || symbol.includes("GOLD")) return 2;
  if (symbol.includes("JPY")) return 3;
  return 5;
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function fmtTimestamp(t: number): string {
  const d = new Date(t * 1000);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function niceTicks(min: number, max: number, count: number): number[] {
  const range = max - min;
  if (range === 0) return [min];
  const rough = range / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  const step = norm < 1.5 ? mag : norm < 3 ? 2 * mag : norm < 7 ? 5 * mag : 10 * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.0001; v += step) ticks.push(v);
  return ticks;
}
