import { useId, useLayoutEffect, useRef, useState } from 'react';
import { inr } from '../lib/utils';
import { compactINR } from './lib';

export interface BarDatum {
  label: string;
  /** Short label for the x-axis. */
  tick: string;
  value: number;
  secondary?: string;
}

/**
 * Single-series column chart (inline SVG). Thin gold columns with a rounded data end anchored to a
 * single baseline, hairline gridlines and a hover tooltip per column. With `table` it shows the
 * same figures as a table, so the values never depend on reading the chart; the caller owns that
 * toggle so it can sit in the card's header.
 */
export function BarChart({ data, title, height = 230, table, periodLabel = 'Date' }: { data: BarDatum[]; title: string; height?: number; table?: boolean; periodLabel?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  // Draw at the box's real width so labels stay 11px on a phone instead of shrinking with the SVG.
  const box = useRef<HTMLElement>(null);
  const [W, setW] = useState(760);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [table]);
  const max = Math.max(...data.map((d) => d.value), 0);
  const niceMax = niceCeil(max || 1);
  const ticks = [0, niceMax / 2, niceMax];
  const padL = 48;
  const padB = 26;
  const plotW = W - padL - 8;
  const plotH = height - padB - 10;
  const band = plotW / Math.max(1, data.length);
  const barW = Math.min(16, Math.max(3, band * 0.6));
  const y = (v: number) => 10 + plotH - (v / niceMax) * plotH;
  // Room for one date label every ~60px.
  const tickEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(plotW / 60))));

  if (max === 0) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-field bg-canvas/60 px-4 text-center text-sm text-muted" style={{ height }}>
        No confirmed sales in this period yet.
      </div>
    );
  }
  if (table) {
    return (
      <div className="max-h-72 overflow-y-auto" style={{ minHeight: height }}>
        <table className="w-full text-sm">
          <caption className="sr-only">{title}</caption>
          <thead className="sticky top-0 bg-white">
            <tr className="text-left text-[0.8125rem] text-muted">
              <th className="py-2 font-semibold">{periodLabel}</th>
              <th className="py-2 text-right font-semibold">Revenue</th>
              <th className="py-2 text-right font-semibold">Orders</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {data.map((d) => (
              <tr key={d.label}>
                <td className="py-2 text-ink-2">{d.label}</td>
                <td className="py-2 text-right tabular">{inr(d.value)}</td>
                <td className="py-2 text-right tabular text-muted">{d.secondary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <figure ref={box} className="relative">
      <svg viewBox={`0 0 ${W} ${height}`} className="h-auto w-full" role="img" aria-label={`${title}. Use “Show table” for exact values.`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - 8} y1={y(t)} y2={y(t)} stroke="var(--color-hairline)" strokeWidth={1} />
            <text x={padL - 10} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-[var(--color-muted)] text-[11px]">
              {compactINR(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = padL + i * band + (band - barW) / 2;
          const h = Math.max(0, y(0) - y(d.value));
          const r = Math.min(3, h, barW / 2);
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {/* generous invisible hit target */}
              <rect x={padL + i * band} y={10} width={band} height={plotH} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${y(0)} V${y(d.value) + r} Q${x},${y(d.value)} ${x + r},${y(d.value)} H${x + barW - r} Q${x + barW},${y(d.value)} ${x + barW},${y(d.value) + r} V${y(0)} Z`}
                  fill="#c99a4b"
                  opacity={hover === null || hover === i ? 1 : 0.4}
                />
              )}
              {i % tickEvery === 0 && (
                <text x={padL + i * band + band / 2} y={height - 6} textAnchor="middle" className="fill-[var(--color-muted)] text-[11px]">
                  {d.tick}
                </text>
              )}
            </g>
          );
        })}
        <line x1={padL} x2={W - 8} y1={y(0)} y2={y(0)} stroke="var(--color-field)" strokeWidth={1} />
      </svg>
      {hover !== null && data[hover] && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-hairline bg-white px-3 py-2 text-xs shadow-[0_12px_30px_-12px_rgba(30,24,19,.3)]"
          style={{ left: `${Math.min(88, Math.max(12, ((padL + hover * band + band / 2) / W) * 100))}%` }}
          role="status"
        >
          <p className="font-semibold text-ink">{data[hover].label}</p>
          <p className="tabular text-ink-2">{inr(data[hover].value)}</p>
          {data[hover].secondary && <p className="text-muted">{data[hover].secondary}</p>}
        </div>
      )}
    </figure>
  );
}

const SPARK = {
  up: '#2f9a5b',
  down: '#d96c6c',
  flat: '#b9b1a5',
};

/** A tiny trend line with a soft fill, for stat cards. Decorative: the card states the figures. */
export function Sparkline({ values, trend, className }: { values: number[]; trend: 'up' | 'down' | 'flat'; className?: string }) {
  // useId's punctuation isn't safe inside url(#…), so keep only plain characters.
  const id = `spark${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const W = 100;
  const H = 32;
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pts = values.map((v, i) => [values.length > 1 ? (i / (values.length - 1)) * W : W / 2, H - 3 - ((v - min) / span) * (H - 6)] as const);
  // A gentle curve through the points (Catmull-Rom converted to cubic Béziers).
  const line = pts
    .map(([x, y], i) => {
      if (i === 0) return `M${x},${y}`;
      const [x0, y0] = pts[i - 2] ?? pts[i - 1];
      const [x1, y1] = pts[i - 1];
      const [x3, y3] = pts[i + 1] ?? [x, y];
      return `C${x1 + (x - x0) / 6},${y1 + (y - y0) / 6} ${x - (x3 - x1) / 6},${y - (y3 - y1) / 6} ${x},${y}`;
    })
    .join(' ');
  const color = SPARK[trend];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${W},${H} L0,${H} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.6} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
    </svg>
  );
}

function niceCeil(v: number): number {
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / exp;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * exp;
}
