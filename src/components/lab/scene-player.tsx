import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { LatexText } from "@/components/latex-text";
import { DEFAULT_VIEW, safeCompile, type Scene, type Shape, type View } from "@/lib/scene";

// Monochrome palette — StartEdu is strictly black & white.
const PALETTE = [
  "var(--foreground)",
  "#a3a3a3",
  "#525252",
  "#d4d4d4",
  "#737373",
  "#e5e5e5",
];

type Props = { scene: Scene };

/** Animated, video-like player for a generated visual scene. */
export function ScenePlayer({ scene }: Props) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speak, setSpeak] = useState(false);
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);

  const steps = scene.steps ?? [];
  const step = steps[Math.min(i, steps.length - 1)];
  const dur = Math.min(20, Math.max(4, step?.duration ?? 4 + (step?.narration?.length ?? 0) / 45));

  useEffect(() => {
    setProgress(0);
    if (!playing || !step) return;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / (dur * 1000));
      setProgress(p);
      if (p >= 1) {
        if (i < steps.length - 1) setI((v) => v + 1);
        else setPlaying(false);
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [i, playing, dur, steps.length, step]);

  useEffect(() => {
    if (!speak || !step?.narration || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(step.narration.replace(/\$[^$]*\$/g, " "));
    u.lang = "uz-UZ";
    u.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    return () => window.speechSynthesis.cancel();
  }, [i, speak, step?.narration]);

  useEffect(() => {
    setI(0);
    setPlaying(true);
  }, [scene]);

  if (!step) return null;
  const view = step.view ?? DEFAULT_VIEW;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{scene.title}</div>
          <div className="text-xs text-muted-foreground">
            {i + 1}/{steps.length} — {step.title}
          </div>
        </div>
        <button
          onClick={() => setSpeak((v) => !v)}
          title="Ovozli izoh"
          className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary"
        >
          {speak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
      </div>

      <div className="relative bg-card">
        <svg key={i} viewBox="0 0 640 400" className="block h-auto w-full">
          <SceneCanvas shapes={step.shapes ?? []} view={view} />
        </svg>
        <div className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-full bg-border">
          <div className="h-full bg-foreground transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        {step.latex && (
          <div className="rounded-xl bg-secondary/50 px-3 py-2 text-center text-sm">
            <LatexText>{step.latex}</LatexText>
          </div>
        )}
        <p className="text-sm leading-relaxed text-muted-foreground">
          <LatexText>{step.narration}</LatexText>
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setI((v) => Math.max(0, v - 1))}
            className="rounded-lg border border-border p-2 hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPlaying((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "To'xtatish" : "Davom etish"}
          </button>
          <button
            onClick={() => setI((v) => Math.min(steps.length - 1, v + 1))}
            className="rounded-lg border border-border p-2 hover:bg-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setI(0);
              setPlaying(true);
            }}
            className="ml-auto rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary"
            title="Boshidan"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {steps.map((s, k) => (
            <button
              key={k}
              onClick={() => {
                setI(k);
                setPlaying(false);
              }}
              className={`h-1.5 flex-1 min-w-6 rounded-full ${k <= i ? "bg-brand" : "bg-border"}`}
              title={s.title}
            />
          ))}
        </div>
        {scene.answer && (
          <div className="rounded-xl border border-brand/30 bg-brand/5 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Javob: </span>
            <LatexText>{scene.answer}</LatexText>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- drawing ---------------------------- */

function SceneCanvas({ shapes, view }: { shapes: Shape[]; view: View }) {
  const W = 640;
  const H = 400;
  const pad = 28;
  const v = normalizeView(view);
  // Keep equal units on both axes so circles stay circles and angles stay true.
  const target = (W - 2 * pad) / (H - 2 * pad);
  let { xmin, xmax, ymin, ymax } = v;
  const wx = xmax - xmin;
  const wy = ymax - ymin;
  if (wx / wy < target) {
    const grow = (wy * target - wx) / 2;
    xmin -= grow;
    xmax += grow;
  } else {
    const grow = (wx / target - wy) / 2;
    ymin -= grow;
    ymax += grow;
  }
  const sx = (x: number) => pad + ((x - xmin) / (xmax - xmin)) * (W - 2 * pad);
  const sy = (y: number) => H - pad - ((y - ymin) / (ymax - ymin)) * (H - 2 * pad);

  return (
    <g>
      <style>{`
        .anim { animation: labIn .55s ease-out both; }
        .draw { stroke-dasharray: 2000; animation: labDraw 1.1s ease-out both; }
        @keyframes labIn { from { opacity:0; transform: translateY(6px) } to { opacity:1; transform:none } }
        @keyframes labDraw { from { stroke-dashoffset: 2000 } to { stroke-dashoffset: 0 } }
      `}</style>
      {shapes.map((s, idx) => (
        <g key={idx} className="anim" style={{ animationDelay: `${idx * 0.22}s` }}>
          {renderShape(s, { sx, sy, xmin, xmax, ymin, ymax, W, H, pad })}
        </g>
      ))}
    </g>
  );
}

type Ctx = {
  sx: (x: number) => number;
  sy: (y: number) => number;
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
  W: number;
  H: number;
  pad: number;
};

function normalizeView(v: View): View {
  const out = { ...DEFAULT_VIEW, ...v };
  if (!(out.xmax > out.xmin)) {
    out.xmin = -10;
    out.xmax = 10;
  }
  if (!(out.ymax > out.ymin)) {
    out.ymin = -10;
    out.ymax = 10;
  }
  return out;
}

function renderShape(s: Shape, c: Ctx) {
  const stroke = "currentColor";
  switch (s.kind) {
    case "grid": {
      const lines = [];
      for (let x = Math.ceil(c.xmin); x <= c.xmax; x++)
        lines.push(<line key={`gx${x}`} x1={c.sx(x)} y1={c.sy(c.ymin)} x2={c.sx(x)} y2={c.sy(c.ymax)} />);
      for (let y = Math.ceil(c.ymin); y <= c.ymax; y++)
        lines.push(<line key={`gy${y}`} x1={c.sx(c.xmin)} y1={c.sy(y)} x2={c.sx(c.xmax)} y2={c.sy(y)} />);
      return (
        <g className="text-border" stroke="currentColor" strokeWidth={0.5} opacity={0.6}>
          {lines}
        </g>
      );
    }
    case "axes": {
      const y0 = c.sy(Math.min(Math.max(0, c.ymin), c.ymax));
      const x0 = c.sx(Math.min(Math.max(0, c.xmin), c.xmax));
      const ticks = [];
      for (let x = Math.ceil(c.xmin); x <= c.xmax; x++) {
        if (x === 0) continue;
        ticks.push(<line key={`tx${x}`} x1={c.sx(x)} y1={y0 - 3} x2={c.sx(x)} y2={y0 + 3} />);
      }
      for (let y = Math.ceil(c.ymin); y <= c.ymax; y++) {
        if (y === 0) continue;
        ticks.push(<line key={`ty${y}`} x1={x0 - 3} y1={c.sy(y)} x2={x0 + 3} y2={c.sy(y)} />);
      }
      return (
        <g className="text-muted-foreground" stroke="currentColor" strokeWidth={1.2}>
          <line x1={c.sx(c.xmin)} y1={y0} x2={c.sx(c.xmax)} y2={y0} />
          <line x1={x0} y1={c.sy(c.ymin)} x2={x0} y2={c.sy(c.ymax)} />
          {ticks}
          <text x={c.sx(c.xmax) - 6} y={y0 - 8} fontSize={11} fill="currentColor" stroke="none">
            {s.xlabel ?? "x"}
          </text>
          <text x={x0 + 8} y={c.sy(c.ymax) + 10} fontSize={11} fill="currentColor" stroke="none">
            {s.ylabel ?? "y"}
          </text>
        </g>
      );
    }
    case "func": {
      const f = safeCompile(s.expr);
      if (!f) return null;
      const from = s.from ?? c.xmin;
      const to = s.to ?? c.xmax;
      const N = 360;
      let d = "";
      let open = false;
      for (let k = 0; k <= N; k++) {
        const x = from + ((to - from) * k) / N;
        const y = f(x);
        if (!Number.isFinite(y) || y < c.ymin - 50 || y > c.ymax + 50) {
          open = false;
          continue;
        }
        d += `${open ? "L" : "M"}${c.sx(x).toFixed(1)} ${c.sy(y).toFixed(1)} `;
        open = true;
      }
      const color = s.color ?? PALETTE[0];
      return (
        <g>
          <path
            className="draw"
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={2.4}
            strokeDasharray={s.dashed ? "6 5" : undefined}
          />
          {s.label && (
            <text x={c.sx(to) - 60} y={c.sy(f(to)) - 8} fontSize={12} fill={color}>
              {s.label}
            </text>
          )}
        </g>
      );
    }
    case "point":
      return (
        <g>
          <circle cx={c.sx(s.x)} cy={c.sy(s.y)} r={5} fill={s.color ?? PALETTE[1]} />
          {s.label && (
            <text x={c.sx(s.x) + 8} y={c.sy(s.y) - 8} fontSize={12} fill="currentColor" className="text-foreground">
              {s.label}
            </text>
          )}
        </g>
      );
    case "segment":
      return (
        <g>
          <line
            className="draw"
            x1={c.sx(s.x1)}
            y1={c.sy(s.y1)}
            x2={c.sx(s.x2)}
            y2={c.sy(s.y2)}
            stroke={s.color ?? PALETTE[2]}
            strokeWidth={2.2}
            strokeDasharray={s.dashed ? "6 5" : undefined}
          />
          {s.label && (
            <text
              x={(c.sx(s.x1) + c.sx(s.x2)) / 2 + 6}
              y={(c.sy(s.y1) + c.sy(s.y2)) / 2 - 6}
              fontSize={12}
              className="text-foreground"
              fill="currentColor"
            >
              {s.label}
            </text>
          )}
        </g>
      );
    case "arrow": {
      const color = s.color ?? PALETTE[4];
      const id = `ah${Math.round(s.x2 * 100)}${Math.round(s.y2 * 100)}`;
      return (
        <g>
          <defs>
            <marker id={id} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 z" fill={color} />
            </marker>
          </defs>
          <line
            x1={c.sx(s.x1)}
            y1={c.sy(s.y1)}
            x2={c.sx(s.x2)}
            y2={c.sy(s.y2)}
            stroke={color}
            strokeWidth={2}
            markerEnd={`url(#${id})`}
          />
          {s.label && (
            <text x={c.sx(s.x2) + 6} y={c.sy(s.y2) - 6} fontSize={12} fill={color}>
              {s.label}
            </text>
          )}
        </g>
      );
    }
    case "polygon": {
      const pts = (s.points ?? []).map(([x, y]) => `${c.sx(x)},${c.sy(y)}`).join(" ");
      const color = s.color ?? PALETTE[5];
      return (
        <g>
          <polygon
            points={pts}
            fill={s.fill === false ? "none" : `${color}22`}
            stroke={color}
            strokeWidth={2.2}
            className="draw"
          />
          {s.label && s.points?.[0] && (
            <text x={c.sx(s.points[0][0]) + 6} y={c.sy(s.points[0][1]) - 6} fontSize={12} fill={color}>
              {s.label}
            </text>
          )}
        </g>
      );
    }
    case "circle": {
      const color = s.color ?? PALETTE[4];
      const rx = Math.abs(c.sx(s.cx + s.r) - c.sx(s.cx));
      const ry = Math.abs(c.sy(s.cy + s.r) - c.sy(s.cy));
      return (
        <g>
          <ellipse
            cx={c.sx(s.cx)}
            cy={c.sy(s.cy)}
            rx={rx}
            ry={ry}
            fill={s.fill ? `${color}22` : "none"}
            stroke={color}
            strokeWidth={2.2}
          />
          {s.label && (
            <text x={c.sx(s.cx) + 6} y={c.sy(s.cy) - ry - 6} fontSize={12} fill={color}>
              {s.label}
            </text>
          )}
        </g>
      );
    }
    case "label":
      return (
        <text
          x={c.sx(s.x)}
          y={c.sy(s.y)}
          fontSize={13}
          fill="currentColor"
          className="text-foreground"
          fontWeight={600}
        >
          {s.text}
        </text>
      );
    case "numberline": {
      const min = s.min ?? -10;
      const max = s.max ?? 10;
      const step = s.step && s.step > 0 ? s.step : 1;
      const y = c.H / 2;
      const X = (v: number) => c.pad + ((v - min) / (max - min || 1)) * (c.W - 2 * c.pad);
      const ticks = [];
      for (let v = min; v <= max + 1e-9; v += step) {
        ticks.push(
          <g key={`n${v}`}>
            <line x1={X(v)} y1={y - 6} x2={X(v)} y2={y + 6} stroke="currentColor" strokeWidth={1} />
            <text x={X(v)} y={y + 24} fontSize={11} textAnchor="middle" fill="currentColor">
              {Math.round(v * 100) / 100}
            </text>
          </g>,
        );
      }
      return (
        <g className="text-muted-foreground">
          <line x1={c.pad} y1={y} x2={c.W - c.pad} y2={y} stroke="currentColor" strokeWidth={1.6} />
          {ticks}
          {s.interval && (
            <g>
              <line
                x1={X(s.interval.from)}
                y1={y}
                x2={X(s.interval.to)}
                y2={y}
                stroke={PALETTE[1]}
                strokeWidth={6}
                opacity={0.55}
                className="draw"
              />
              <circle
                cx={X(s.interval.from)}
                cy={y}
                r={6}
                fill={s.interval.openFrom ? "var(--color-card, #fff)" : PALETTE[1]}
                stroke={PALETTE[1]}
                strokeWidth={2}
              />
              <circle
                cx={X(s.interval.to)}
                cy={y}
                r={6}
                fill={s.interval.openTo ? "var(--color-card, #fff)" : PALETTE[1]}
                stroke={PALETTE[1]}
                strokeWidth={2}
              />
            </g>
          )}
          {(s.marks ?? []).map((m, k) => (
            <g key={k}>
              <circle
                cx={X(m.x)}
                cy={y}
                r={6}
                fill={m.open ? "var(--color-card, #fff)" : PALETTE[3]}
                stroke={PALETTE[3]}
                strokeWidth={2}
              />
              {m.label && (
                <text x={X(m.x)} y={y - 14} fontSize={12} textAnchor="middle" fill={PALETTE[3]}>
                  {m.label}
                </text>
              )}
            </g>
          ))}
        </g>
      );
    }
    case "bars": {
      const items = s.items ?? [];
      const max = Math.max(1, ...items.map((it) => Math.abs(it.value)));
      const bw = (c.W - 2 * c.pad) / Math.max(1, items.length);
      return (
        <g>
          {items.map((it, k) => {
            const h = (Math.abs(it.value) / max) * (c.H - 3 * c.pad);
            return (
              <g key={k}>
                <rect
                  x={c.pad + k * bw + bw * 0.18}
                  y={c.H - c.pad - h}
                  width={bw * 0.64}
                  height={h}
                  rx={6}
                  fill={s.color ?? PALETTE[0]}
                  opacity={0.85}
                />
                <text
                  x={c.pad + k * bw + bw / 2}
                  y={c.H - c.pad + 14}
                  fontSize={11}
                  textAnchor="middle"
                  fill="currentColor"
                  className="text-muted-foreground"
                >
                  {it.label}
                </text>
                <text
                  x={c.pad + k * bw + bw / 2}
                  y={c.H - c.pad - h - 6}
                  fontSize={11}
                  textAnchor="middle"
                  fill="currentColor"
                  className="text-foreground"
                >
                  {it.value}
                </text>
              </g>
            );
          })}
        </g>
      );
    }
    case "pie": {
      const items = (s.items ?? []).filter((it) => it.value > 0);
      const total = items.reduce((a, b) => a + b.value, 0) || 1;
      const cx = c.W / 2;
      const cy = c.H / 2;
      const r = Math.min(c.W, c.H) / 2 - 40;
      let a0 = -Math.PI / 2;
      return (
        <g>
          {items.map((it, k) => {
            const a1 = a0 + (it.value / total) * Math.PI * 2;
            const large = a1 - a0 > Math.PI ? 1 : 0;
            const d = `M${cx} ${cy} L${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A${r} ${r} 0 ${large} 1 ${
              cx + r * Math.cos(a1)
            } ${cy + r * Math.sin(a1)} Z`;
            const mid = (a0 + a1) / 2;
            a0 = a1;
            return (
              <g key={k}>
                <path d={d} fill={PALETTE[k % PALETTE.length]} opacity={0.85} stroke="var(--color-card)" strokeWidth={2} />
                <text
                  x={cx + r * 0.65 * Math.cos(mid)}
                  y={cy + r * 0.65 * Math.sin(mid)}
                  fontSize={12}
                  textAnchor="middle"
                  fill="var(--background)"
                >
                  {it.label}
                </text>
              </g>
            );
          })}
        </g>
      );
    }
    case "fractionbar": {
      const parts = Math.max(1, Math.min(24, s.parts ?? 1));
      const filled = Math.max(0, Math.min(parts, s.filled ?? 0));
      const w = (c.W - 2 * c.pad) / parts;
      const y = c.H / 2 - 30;
      return (
        <g>
          {Array.from({ length: parts }).map((_, k) => (
            <rect
              key={k}
              x={c.pad + k * w}
              y={y}
              width={w - 2}
              height={60}
              rx={4}
              fill={k < filled ? PALETTE[0] : "transparent"}
              stroke="currentColor"
              className="text-border"
              strokeWidth={1.4}
              opacity={k < filled ? 0.85 : 1}
            />
          ))}
          <text
            x={c.W / 2}
            y={y + 96}
            fontSize={13}
            textAnchor="middle"
            fill="currentColor"
            className="text-foreground"
          >
            {s.label ?? `${filled}/${parts}`}
          </text>
        </g>
      );
    }
    default:
      return <g stroke={stroke} />;
  }
}

export function useSceneMemo(scene: Scene | null) {
  return useMemo(() => scene, [scene]);
}
