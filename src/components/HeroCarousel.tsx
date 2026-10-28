import { useReducedMotion } from 'framer-motion';
import { ArrowRight, BadgeIndianRupee, Crown, Gem, Pause, Play, RefreshCw, Sparkles, Truck, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import type { BannerDTO } from '@goldshop/shared';
import { cn } from '../lib/utils';
import { Img, Skeleton } from './ui/misc';

const ADVANCE_MS = 6500;

/** Each trust point gets an icon that fits its words; anything else gets a sparkle. */
const POINT_ICONS: [RegExp, LucideIcon][] = [
  [/hallmark|bis\b|purity|certif/i, Gem],
  [/generation|trust|legacy|heritage/i, Crown],
  [/price|rate|making|gst|charge/i, BadgeIndianRupee],
  [/deliver|ship/i, Truck],
  [/return|exchange/i, RefreshCw],
];
const pointIcon = (text: string) => POINT_ICONS.find(([re]) => re.test(text))?.[1] ?? Sparkles;

/** "*word*" in a banner title is set in gold italic. */
function emphasize(text: string): ReactNode[] {
  return text.split(/(\*[^*]+\*)/).map((part, i) =>
    part.startsWith('*') && part.endsWith('*') ? (
      <em key={i} className="bg-gradient-to-r from-gold-deep via-gold to-gold-deep bg-clip-text pr-1 font-semibold italic text-transparent">
        {part.slice(1, -1)}
      </em>
    ) : (
      part
    ),
  );
}

/**
 * The homepage hero: every active banner as a full-width slide, one at a time.
 * It moves on by itself (pausing under the pointer, while focused or touched, and when the tab is
 * hidden), loops seamlessly using copies on either side, follows a swipe, moves on when a slide is
 * clicked (anywhere but its links), and has dots and a pause button. For anyone who prefers reduced
 * motion it never moves on its own or animates.
 */
export function HeroCarousel({ banners, loading }: { banners: BannerDTO[]; loading: boolean }) {
  const reduce = useReducedMotion();
  const n = banners.length;
  const looped = n > 1;
  const slides = looped ? [...banners, ...banners, ...banners] : banners;
  const [pos, setPos] = useState(looped ? n : 0);
  const [smooth, setSmooth] = useState(true);
  const [held, setHeld] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  // Set when a pointer-up ends a swipe, so the click that follows doesn't move on a second time.
  const swiped = useRef(false);
  const current = n ? ((pos % n) + n) % n : 0;

  const go = (d: number) => {
    setSmooth(true);
    setPos((p) => p + d);
  };
  const goTo = (i: number) => {
    setSmooth(true);
    setPos((looped ? n : 0) + i);
  };

  // After landing on a copy, jump (unanimated) to the same slide in the middle set.
  const onSettled = () => {
    if (!looped) return;
    if (pos < n || pos >= 2 * n) {
      setSmooth(false);
      setPos(n + current);
    }
  };
  useEffect(() => {
    if (smooth) return;
    let id = requestAnimationFrame(() => (id = requestAnimationFrame(() => setSmooth(true))));
    return () => cancelAnimationFrame(id);
  }, [smooth]);

  useEffect(() => {
    if (!looped || reduce || held || stopped) return;
    const t = setInterval(() => {
      if (!document.hidden) go(1);
    }, ADVANCE_MS);
    return () => clearInterval(t);
  }, [looped, reduce, held, stopped]);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!looped || e.button !== 0) return;
    swiped.current = false;
    start.current = { x: e.clientX, y: e.clientY };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    if (drag === null && Math.abs(dx) < 8) return;
    if (drag === null && Math.abs(e.clientY - s.y) > Math.abs(dx)) {
      start.current = null; // a vertical scroll, not a swipe
      return;
    }
    setDrag(dx);
  };
  const onUp = () => {
    if (drag !== null) {
      swiped.current = true;
      if (drag < -60) go(1);
      else if (drag > 60) go(-1);
    }
    start.current = null;
    setDrag(null);
  };
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    if (!looped || (e.target as Element).closest('a, button')) return;
    go(1);
  };

  if (loading) {
    return (
      <section aria-label="Featured" className="bg-ivory pb-4">
        <Skeleton className="h-[34rem] w-full rounded-none md:h-[27rem] lg:h-[29rem]" />
      </section>
    );
  }
  if (n === 0) return null;

  const offset = `calc((100% - var(--w)) / 2 - ${pos} * (var(--w) + var(--gap)) + ${drag ?? 0}px)`;
  const animating = smooth && drag === null && !reduce;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="relative overflow-hidden bg-ivory pb-3 [--gap:0px] [--w:100%]"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setHeld(false)}
    >
      <div
        className={cn(
          'flex touch-pan-y select-none [&_img]:[-webkit-user-drag:none]',
          looped && 'cursor-pointer',
          animating && 'transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]',
          drag !== null && 'cursor-grabbing',
        )}
        style={{ transform: `translateX(${offset})`, gap: 'var(--gap)' } as CSSProperties}
        onTransitionEnd={(e) => e.target === e.currentTarget && onSettled()}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClick={onClick}
        aria-live={held || stopped || reduce ? 'polite' : 'off'}
      >
        {slides.map((b, k) => {
          const active = k === pos;
          const original = !looped || (k >= n && k < 2 * n);
          return <Slide key={`${k}-${b.id}`} b={b} active={active} hidden={!original} lead={original && k % n === 0} label={`${(k % n) + 1} of ${n}`} />;
        })}
      </div>

      {looped && (
        <>
          <div className="mt-4 flex items-center justify-center gap-3">
            <div role="group" aria-label="Choose a slide" className="flex items-center gap-1">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Slide ${i + 1}: ${b.title.replace(/\*/g, '')}`}
                  aria-current={i === current || undefined}
                  className="grid size-6 place-items-center"
                >
                  <span className={cn('block h-2 rounded-full transition-all duration-300', i === current ? 'w-6 bg-maroon' : 'w-2 bg-line-strong hover:bg-gold')} />
                </button>
              ))}
            </div>
            {!reduce && (
              <button
                type="button"
                onClick={() => setStopped((v) => !v)}
                className="grid size-7 place-items-center rounded-full text-ink-2 transition-colors hover:bg-sand hover:text-ink"
                aria-label={stopped ? 'Play slideshow' : 'Pause slideshow'}
              >
                {stopped ? <Play className="size-3.5" fill="currentColor" /> : <Pause className="size-3.5" fill="currentColor" />}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function Slide({ b, active, hidden, lead, label }: { b: BannerDTO; active: boolean; hidden: boolean; lead: boolean; label: string }) {
  const textRight = b.align === 'right';
  const alt = b.image?.alt || b.title.replace(/\*/g, '');
  const Title = lead ? 'h1' : 'h2';
  const script = b.script ?? [];
  const btn = 'inline-flex h-12 items-center justify-center gap-2.5 rounded-md px-6 text-[0.875rem] font-semibold transition-[filter,background-color,color]';

  return (
    <div
      role={hidden ? undefined : 'group'}
      aria-roledescription={hidden ? undefined : 'slide'}
      aria-label={hidden ? undefined : label}
      aria-hidden={hidden || undefined}
      inert={!active}
      className={cn(
        'relative flex flex-none flex-col overflow-hidden bg-paper md:block',
      )}
      style={{ width: 'var(--w)' }}
    >
      {/* phones: the photo on top */}
      <div className="relative aspect-[16/11] overflow-hidden md:hidden">
        <Img image={b.mobileImage ?? b.image} priority={lead} sizes="90vw" width={960} className="size-full object-cover" alt={alt} />
        {script.length > 0 && (
          <p aria-hidden className="absolute bottom-3 right-4 text-right font-display text-[1.25rem] font-medium italic leading-[1.1] text-ivory [text-shadow:0_2px_12px_rgba(30,18,12,.85)]">
            {script.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </p>
        )}
      </div>

      {/* wider screens: the photo fills one side and fades into the copy */}
      <div
        className={cn(
          'absolute inset-y-0 hidden w-[62%] md:block',
          textRight ? 'left-0 [mask-image:linear-gradient(to_left,transparent,black_30%)]' : 'right-0 [mask-image:linear-gradient(to_right,transparent,black_30%)]',
        )}
      >
        <Img image={b.image} priority={lead} sizes="(min-width: 1024px) 55vw, 62vw" width={1600} className="size-full object-cover" alt={alt} />
        {script.length > 0 && <div aria-hidden className={cn('absolute inset-y-0 w-1/2 from-[#1d0f0a]/55 to-transparent', textRight ? 'left-0 bg-gradient-to-r' : 'right-0 bg-gradient-to-l')} />}
      </div>
      {script.length > 0 && (
        <div aria-hidden className={cn('absolute top-1/2 hidden -translate-y-1/2 flex-col items-center md:flex', textRight ? 'left-24 lg:left-[max(7.5rem,calc((100%-86rem)/2+3rem))]' : 'right-24 lg:right-[max(7.5rem,calc((100%-86rem)/2+3rem))]')}>
          <p className="text-center font-display text-[clamp(1.5rem,0.9rem+1.2vw,2.375rem)] font-medium italic leading-[1.12] text-ivory [text-shadow:0_2px_16px_rgba(30,18,12,.7)]">
            {script.map((l, i) => (
              <span key={l} className={cn('block', i % 2 === 1 && 'pl-[0.7em]')}>
                {l}
              </span>
            ))}
          </p>
          <span className="mt-3 flex items-center gap-2 text-gold-soft">
            <span className="h-px w-10 bg-current opacity-70" />
            <span className="size-2 rotate-45 border border-current" />
            <span className="h-px w-10 bg-current opacity-70" />
          </span>
        </div>
      )}

      <div
        className={cn(
          'relative flex flex-1 flex-col justify-center p-6 sm:p-8 md:min-h-[25rem] md:w-[52%] md:py-12 lg:min-h-[27rem] xl:min-h-[29rem]',
          textRight ? 'md:ml-auto md:pr-24 lg:pr-[max(7rem,calc((100%-86rem)/2+2.5rem))]' : 'md:pl-24 lg:pl-[max(7rem,calc((100%-86rem)/2+2.5rem))]',
        )}
      >
        {b.eyebrow && <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.24em] text-gold-deep">{b.eyebrow}</p>}
        <Title className="mt-3 font-display text-[clamp(2.25rem,1.5rem+2.6vw,4rem)] font-semibold leading-[1.02] tracking-[-0.01em] text-maroon">{emphasize(b.title)}</Title>
        {b.subtitle && <p className="mt-4 max-w-[32rem] text-[1rem] leading-relaxed text-ink-2 md:text-[1.0625rem]">{b.subtitle}</p>}
        <div className="cta-row mt-6">
          <Link to={b.ctaHref || '/shop'} className={cn(btn, 'bg-gradient-to-b from-maroon-2 to-maroon text-ivory shadow-[0_12px_24px_-14px_rgba(63,18,21,.95)] hover:brightness-110')}>
            {b.ctaLabel || 'Explore collection'} <ArrowRight className="size-4" aria-hidden />
          </Link>
          {b.secondaryLabel && b.secondaryHref && (
            <Link to={b.secondaryHref} className={cn(btn, 'border border-maroon/50 text-maroon hover:bg-maroon hover:text-ivory')}>
              {b.secondaryLabel}
            </Link>
          )}
        </div>
        {b.points && b.points.length > 0 && (
          <ul className="mt-6 grid max-w-[30rem] grid-cols-3 gap-2 sm:mt-7 xl:flex xl:max-w-[34rem] xl:gap-0">
            {b.points.map((p, i) => {
              const Icon = pointIcon(p);
              return (
                <li
                  key={p}
                  className={cn(
                    'flex flex-col items-center gap-1.5 text-center text-[0.75rem] leading-snug text-ink-2 xl:min-w-0 xl:flex-1 xl:flex-row xl:gap-2.5 xl:px-4 xl:text-left xl:text-[0.8125rem] xl:first:pl-0',
                    i > 0 && 'xl:border-l xl:border-line-strong/50',
                  )}
                >
                  <Icon className="size-7 shrink-0 text-gold" strokeWidth={1.2} aria-hidden />
                  {p}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
