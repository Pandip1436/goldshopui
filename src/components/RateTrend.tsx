import { useQuery } from '@tanstack/react-query';
import { ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, Info, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { PURITIES, type GoldRateHistoryDTO, type PurityKey } from '@goldshop/shared';
import { api } from '../lib/api';
import { useGoldRates } from '../lib/hooks';
import { cn, formatDate, formatDateTime, inr, rateFreshness } from '../lib/utils';
import { Modal } from './ui/Sheet';
import { Img, Skeleton } from './ui/misc';

const RANGES = [
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 365, label: '1 year' },
];
/** Rate changes listed before "View full history". */
const SHOWN = 5;

interface Change {
  t: number;
  at: string;
  v: number;
}

/** The rate's changes within the period: each one holds until the next (a step, not a slope). */
function changesFor(history: GoldRateHistoryDTO, k: PurityKey): Change[] {
  const since = Date.parse(history.since);
  const out: Change[] = [];
  for (const p of history.points) {
    const v = p.rates[k];
    if (!v || out.at(-1)?.v === v) continue;
    out.push({ t: Math.max(Date.parse(p.at), since), at: p.at, v });
  }
  return out;
}

/** Three round rupee values spanning the range (rates are in paise). */
function ticks(lo: number, hi: number): number[] {
  const span = (hi - lo) / 100;
  const raw = span / 3;
  const mag = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  const step = ([1, 2, 5, 10].find((s) => s * mag >= raw) ?? 10) * mag * 100;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push(v);
  return out;
}

const pct = (from: number, to: number) => `${Math.abs(((to - from) / from) * 100).toFixed(2)}%`;

export function RateTrend({ purity, onClose }: { purity: PurityKey | null; onClose: () => void }) {
  const [days, setDays] = useState(90);
  const [all, setAll] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['gold-rate-history', days],
    queryFn: () => api<GoldRateHistoryDTO>('/gold-rates/history', { query: { days } }),
    enabled: purity !== null,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
  const { data: rates } = useGoldRates();
  const changes = data && purity ? changesFor(data, purity) : [];
  const name = purity ? PURITIES[purity].name : '';
  const current = purity ? rates?.rates[purity] : undefined;
  const fresh = rateFreshness(rates?.updatedAt);
  const picture = purity ? (rates?.page.purityImages?.[purity] ?? rates?.page.purityImages?.gold24) : undefined;
  const newestFirst = [...changes].reverse();
  const listed = all ? newestFirst : newestFirst.slice(0, SHOWN);

  return (
    <Modal
      open={purity !== null}
      onOpenChange={(v) => {
        if (!v) {
          setAll(false);
          onClose();
        }
      }}
      title={
        <>
          <span className="text-maroon">{name}</span> <span className="text-gold-deep">— Rate Trend</span>
        </>
      }
      description="Rates set by our store, per gram of metal"
      wide
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Period" className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              aria-pressed={days === r.days}
              className={cn(
                'h-10 rounded-full border px-5 text-[0.875rem] font-medium transition-colors',
                days === r.days ? 'border-maroon bg-gradient-to-b from-maroon-2 to-maroon text-ivory shadow-[0_8px_16px_-10px_rgba(63,18,21,.9)]' : 'border-line-strong/60 bg-paper text-ink-2 hover:border-gold hover:text-ink',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        {current && (
          <div className="flex items-center gap-1">
            {picture && (
              <Img
                image={picture}
                alt=""
                sizes="120px"
                width={480}
                className="hidden h-16 w-24 object-contain mix-blend-multiply [mask-image:radial-gradient(closest-side,black_70%,transparent)] sm:block"
              />
            )}
            <div className="rounded-lg border border-gold/30 bg-gold-pale/25 px-3.5 py-2">
              <p className="flex items-center gap-1.5 text-xs font-medium text-ink-2">
                {fresh.today && <span aria-hidden className="size-2 rounded-full bg-success" />}
                {fresh.today ? 'Live rate' : 'Current rate'}
              </p>
              <p className="font-display text-[1.375rem] font-semibold leading-tight text-maroon tabular">
                {inr(current)} <span className="font-sans text-xs font-normal text-ink-2">/ gram</span>
              </p>
              {rates?.updatedAt && <p className="text-[0.6875rem] text-muted">Updated {formatDateTime(rates.updatedAt)}</p>}
            </div>
          </div>
        )}
      </div>

      {isLoading && !data ? (
        <Skeleton className="mt-5 h-60 w-full rounded-xl" />
      ) : !data || changes.length === 0 ? (
        <p className="mt-5 rounded-xl bg-sand/50 px-4 py-6 text-center text-sm text-ink-2">No {name.toLowerCase()} rate was published in this period.</p>
      ) : (
        <>
          <Chart changes={changes} name={name} />
          <Summary changes={changes} />

          <div className="mt-6 flex items-center justify-between gap-4">
            <h3 className="text-[0.8125rem] font-bold uppercase tracking-[0.16em] text-maroon">Rate changes</h3>
            {newestFirst.length > SHOWN && (
              <button type="button" onClick={() => setAll((v) => !v)} className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-maroon hover:text-gold-deep" aria-expanded={all}>
                {all ? 'Show recent changes' : 'View full history'} <ArrowRight className={cn('size-4 transition-transform', all && '-rotate-90')} aria-hidden />
              </button>
            )}
          </div>
          <ul className="mt-2.5 divide-y divide-line/70 rounded-xl border border-line/70 bg-paper">
            {listed.map((c, i) => {
              const prev = newestFirst[i + 1];
              return (
                <li key={c.at} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 text-sm">
                  <span className="flex w-full min-w-0 items-center gap-2.5 text-ink-2 sm:w-auto sm:flex-1">
                    <CalendarDays className="size-4 shrink-0 text-gold-deep" strokeWidth={1.6} aria-hidden />
                    {formatDateTime(c.at)}
                  </span>
                  <span className="flex-1 pl-[1.625rem] font-semibold text-ink tabular sm:flex-none sm:pl-0">
                    {inr(c.v)} <span className="font-normal text-muted">/ gram</span>
                  </span>
                  <ChangePill now={c.v} prev={prev?.v} only={changes.length === 1} />
                </li>
              );
            })}
          </ul>
        </>
      )}
      <p className="mt-4 flex gap-2 text-xs leading-relaxed text-subtle">
        <Info className="mt-px size-4 shrink-0 text-gold" strokeWidth={1.6} aria-hidden />
        Metal value only, before making charges and GST. The price of a piece is locked at the rate in force when you order.
      </p>
    </Modal>
  );
}

/** How a listed rate compares with the one before it. */
function ChangePill({ now, prev, only }: { now: number; prev?: number; only: boolean }) {
  const pill = 'inline-flex min-w-[6.5rem] items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold tabular';
  if (prev === undefined)
    return (
      <span className={cn(pill, 'bg-sand text-ink-2')}>
        <Minus className="size-3.5" aria-hidden />
        {only ? 'No change' : 'Opening rate'}
      </span>
    );
  const up = now > prev;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn(pill, up ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')}>
      <Arrow className="size-3.5" aria-hidden />
      <span className="sr-only">{up ? 'Up' : 'Down'}</span>
      {up ? '+' : '−'}
      {inr(Math.abs(now - prev))}
    </span>
  );
}

/** One line on what the period shows — only what the recorded rates say. */
function Summary({ changes }: { changes: Change[] }) {
  const first = changes[0];
  const last = changes.at(-1)!;
  const diff = last.v - first.v;
  const Icon = changes.length === 1 || diff === 0 ? Minus : diff > 0 ? TrendingUp : TrendingDown;
  return (
    <div className="mt-4 flex items-center gap-3.5 rounded-xl border border-gold/20 bg-gold-pale/25 px-4 py-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-paper text-gold-deep shadow-[0_6px_14px_-10px_rgba(122,87,22,.8)]">
        <Icon className="size-5" strokeWidth={1.8} aria-hidden />
      </span>
      {changes.length === 1 ? (
        <p className="text-[0.9375rem] leading-snug text-ink">
          One rate in this period: <strong className="font-semibold">{inr(first.v)}</strong> per gram since {formatDate(first.at)}.
          <span className="block text-[0.8125rem] text-muted">The trend fills in each time we update our rate.</span>
        </p>
      ) : (
        <p className="text-[0.9375rem] leading-snug text-ink">
          From <strong className="font-semibold">{inr(first.v)}</strong> to <strong className="font-semibold">{inr(last.v)}</strong> per gram over this period.
          <span className="block text-[0.8125rem] text-muted">
            {diff === 0 ? 'Back where it started' : `${diff > 0 ? 'Up' : 'Down'} ${inr(Math.abs(diff))} (${pct(first.v, last.v)})`} · {changes.length - 1} {changes.length === 2 ? 'change' : 'changes'}
          </span>
        </p>
      )}
    </div>
  );
}

/** A step line of the rate over the period, with a crosshair that reads the rate on any day. */
function Chart({ changes, name }: { changes: Change[]; name: string }) {
  const box = useRef<HTMLDivElement>(null);
  const fillId = useId();
  const [w, setW] = useState(600);
  const [hover, setHover] = useState<{ t: number; v: number } | null>(null);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const h = 250;
  const m = { t: 46, r: 22, b: 30, l: 66 };
  const now = Date.now();
  // The axis starts where the record does (at least two days back), not at an empty start of the period.
  const since = Math.min(changes[0].t, now - 2 * 24 * 60 * 60 * 1000);
  const vals = changes.map((c) => c.v);
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  const pad = lo === hi ? lo * 0.03 : (hi - lo) * 0.2;
  lo -= pad;
  hi += pad;
  const x = (t: number) => m.l + ((t - since) / (now - since)) * (w - m.l - m.r);
  const y = (v: number) => m.t + (1 - (v - lo) / (hi - lo)) * (h - m.t - m.b);
  const first = changes[0];
  const last = changes.at(-1)!;

  let line = `M${x(first.t)},${y(first.v)}`;
  for (const c of changes.slice(1)) line += ` H${x(c.t)} V${y(c.v)}`;
  line += ` H${x(now)}`;
  const area = `${line} V${h - m.b} H${x(first.t)} Z`;
  const rateAt = (t: number) => [...changes].reverse().find((c) => c.t <= t) ?? first;
  const n = w >= 480 ? 4 : 3;
  const xTicks = Array.from({ length: n }, (_, i) => since + ((now - since) * i) / (n - 1));
  // the current rate, in a maroon tag above the end of the line
  const tag = inr(last.v);
  const tagW = tag.length * 7.6 + 22;
  const endX = x(now);
  const endY = y(last.v);

  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const t = since + ((e.clientX - r.left) / r.width) * (now - since);
    const at = Math.min(now, Math.max(first.t, t));
    setHover({ t: at, v: rateAt(at).v });
  };
  // Arrow keys step through the changes, so the readout works without a pointer.
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const i = hover ? changes.findIndex((c) => c.t === hover.t) : -1;
    const next = changes[Math.min(changes.length - 1, Math.max(0, i === -1 ? changes.length - 1 : i + (e.key === 'ArrowRight' ? 1 : -1)))];
    setHover({ t: next.t, v: next.v });
  };

  return (
    <div
      ref={box}
      className="relative mt-5 rounded-xl border border-line/70 bg-paper outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
      tabIndex={0}
      onKeyDown={onKey}
      onBlur={() => setHover(null)}
      aria-label={`${name} rate trend chart. Use the left and right arrow keys to read each change.`}
    >
      <svg width={w} height={h} className="block max-w-full" role="img" aria-label={`${name}: ${inr(first.v)} on ${formatDate(first.at)}, ${inr(last.v)} now`}>
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-gold)" stopOpacity={0.32} />
            <stop offset="1" stopColor="var(--color-gold)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {ticks(lo, hi).map((v) => (
          <g key={v}>
            <line x1={m.l} x2={w - m.r} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeWidth={1} />
            <text x={m.l - 10} y={y(v)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular">
              {inr(v)}
            </text>
          </g>
        ))}
        {xTicks.map((t, i) => (
          <text key={t} x={x(t)} y={h - 8} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} className="fill-muted text-[11px]">
            {i === n - 1 ? 'Today' : new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </text>
        ))}
        <path d={area} fill={`url(#${CSS.escape(fillId)})`} />
        <path d={line} fill="none" stroke="var(--color-gold)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {changes.map((c) => (
          <circle key={c.at} cx={x(c.t)} cy={y(c.v)} r={4} fill="var(--color-gold)" stroke="var(--color-paper)" strokeWidth={2} />
        ))}
        <circle cx={endX} cy={endY} r={5.5} fill="var(--color-gold-deep)" stroke="var(--color-paper)" strokeWidth={2} />
        <g aria-hidden>
          <rect x={Math.min(endX - tagW / 2, w - tagW - 4)} y={endY - 36} width={tagW} height={24} rx={6} fill="var(--color-maroon)" />
          <path d={`M${endX - 5},${endY - 12.5} L${endX},${endY - 7} L${endX + 5},${endY - 12.5} Z`} fill="var(--color-maroon)" />
          <text x={Math.min(endX - tagW / 2, w - tagW - 4) + tagW / 2} y={endY - 24} dy="0.34em" textAnchor="middle" className="fill-ivory text-[12px] font-semibold tabular">
            {tag}
          </text>
        </g>
        {hover && (
          <>
            <line x1={x(hover.t)} x2={x(hover.t)} y1={m.t} y2={h - m.b} stroke="var(--color-ink-2)" strokeWidth={1} />
            <circle cx={x(hover.t)} cy={y(hover.v)} r={5} fill="var(--color-gold)" stroke="var(--color-paper)" strokeWidth={2} />
          </>
        )}
        <rect x={m.l} y={m.t} width={Math.max(0, w - m.l - m.r)} height={h - m.t - m.b} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
      </svg>
      {hover && (
        <div
          className="pointer-events-none absolute top-2 rounded-lg border border-line bg-white px-3 py-2 text-left shadow-lg"
          style={{ left: Math.min(Math.max(x(hover.t) - 70, 8), w - 148), width: 140 }}
        >
          <p className="text-[0.9375rem] font-semibold text-ink tabular">{inr(hover.v)}</p>
          <p className="text-xs text-muted">{new Date(hover.t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      )}
    </div>
  );
}
