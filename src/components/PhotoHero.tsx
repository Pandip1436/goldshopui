import type { CSSProperties, ReactNode } from 'react';
import type { ImageRef } from '@goldshop/shared';
import { cn } from '../lib/utils';
import { GoldRule, LotusMark } from './AboutLegacy';
import { Img } from './ui/misc';

// The photo's left edge: a sweeping curve, in the photo box's own 0–1 coordinates.
const CURVE = 'M0.24,0 C0.15,0.28 0.12,0.7 0,1';

/** A short gold hairline capped with a diamond, as on either side of the journal eyebrow. */
function DiamondRule({ flip }: { flip?: boolean }) {
  return (
    <span aria-hidden className={cn('flex items-center text-gold', flip && 'flex-row-reverse')}>
      <span className="size-1.5 rotate-45 bg-current" />
      <span className="h-px w-6 bg-current opacity-70" />
    </span>
  );
}

/**
 * A page banner: copy on the left and, from laptops up, a photograph filling the right whose
 * curved, gold-edged side sweeps into the page, with optional script words over it. On phones the
 * photo follows the copy as a rounded panel.
 */
export function PhotoHero({
  id,
  eyebrow,
  eyebrowStyle = 'rule',
  title,
  children,
  image,
  script = [],
  scriptAlign = 'right',
  ornament,
  fadeBottom,
  imageClassName,
  contentClassName,
}: {
  /** Id of the page heading, also used to name the curve. */
  id: string;
  eyebrow: string;
  eyebrowStyle?: 'rule' | 'diamonds';
  title: ReactNode;
  /** Shown under the heading. */
  children?: ReactNode;
  image?: ImageRef;
  script?: string[];
  scriptAlign?: 'right' | 'center';
  /** A small gold rule under the script words. */
  ornament?: boolean;
  /** Fade the photo's bottom edge, for pages whose content overlaps it. */
  fadeBottom?: boolean;
  imageClassName?: string;
  contentClassName?: string;
}) {
  const clip = `${id}-curve`;

  return (
    <section aria-labelledby={id} className="relative overflow-hidden bg-ivory">
      <LotusMark className="pointer-events-none absolute -left-14 bottom-6 w-72 text-gold opacity-[0.07]" />

      <div className={cn('container-page relative z-10 pb-10 pt-10 md:pt-14', contentClassName)}>
        <div className="lg:max-w-[52%]">
          {eyebrowStyle === 'rule' ? (
            <p className="flex items-center gap-3">
              <span aria-hidden className="h-px w-10 bg-gold" />
              <span className="text-[0.75rem] font-semibold uppercase tracking-[0.3em] text-ink">{eyebrow}</span>
              <GoldRule className="w-12" />
            </p>
          ) : (
            <p className="flex items-center gap-3">
              <DiamondRule />
              <span className="text-[0.75rem] font-semibold uppercase tracking-[0.3em] text-ink">{eyebrow}</span>
              <DiamondRule flip />
            </p>
          )}
          <h1 id={id} className="mt-5 font-display text-[clamp(2.5rem,1.4rem+3.1vw,4.125rem)] font-semibold leading-[1.04] tracking-[-0.01em] text-maroon">
            {title}
          </h1>
          {children}
        </div>
      </div>

      {image && (
        <div className="relative px-4 pb-10 sm:px-6 lg:absolute lg:inset-y-0 lg:right-0 lg:w-[54%] lg:p-0">
          <div className="relative h-52 overflow-hidden rounded-2xl sm:h-64 lg:h-full lg:rounded-none">
            {/* the curve is applied from laptops up; the variable names this hero's own clip path */}
            <div className="absolute inset-0 lg:[clip-path:var(--hero-clip)]" style={{ '--hero-clip': `url(#${clip})` } as CSSProperties}>
              <Img image={image} priority sizes="(min-width: 1024px) 54vw, 100vw" width={1600} className={cn('size-full object-cover', imageClassName)} />
              {script.length > 0 && <div aria-hidden className="absolute inset-0 bg-gradient-to-l from-ink/70 via-ink/25 via-40% to-transparent" />}
              {fadeBottom && <div aria-hidden className="absolute inset-x-0 bottom-0 hidden h-16 bg-gradient-to-t from-ivory/80 to-transparent lg:block" />}
            </div>
            {script.length > 0 && (
              <div
                aria-hidden
                className={cn(
                  'absolute right-5 top-1/2 flex -translate-y-1/2 flex-col lg:right-[max(2.5rem,calc((100vw-90rem)/2+2.5rem))]',
                  scriptAlign === 'center' ? 'items-center text-center' : 'items-end text-right',
                )}
              >
                <p className="font-display text-[clamp(1.25rem,0.85rem+1.1vw,2rem)] font-medium italic leading-[1.2] text-gold-soft [text-shadow:0_2px_14px_rgba(30,24,19,.6)]">
                  {script.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </p>
                {ornament && (
                  <span className="mt-3 flex items-center gap-2 text-gold-soft">
                    <span className="h-px w-7 bg-current opacity-60" />
                    <span className="size-1.5 rotate-45 border border-current" />
                    <span className="h-px w-7 bg-current opacity-60" />
                  </span>
                )}
              </div>
            )}
          </div>
          <svg aria-hidden viewBox="0 0 1 1" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 hidden size-full overflow-visible lg:block">
            <defs>
              <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f1e2bd" />
                <stop offset="0.5" stopColor="#d9b872" />
                <stop offset="1" stopColor="#a57a2c" />
              </linearGradient>
            </defs>
            <path d={CURVE} fill="none" stroke="#fcf9f3" strokeOpacity="0.7" strokeWidth="9" vectorEffect="non-scaling-stroke" />
            <path d={CURVE} fill="none" stroke={`url(#${id}-edge)`} strokeWidth="3.5" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      )}
      <svg aria-hidden width="0" height="0" className="absolute">
        <clipPath id={clip} clipPathUnits="objectBoundingBox">
          <path d={`${CURVE} L1,1 L1,0 Z`} />
        </clipPath>
      </svg>
    </section>
  );
}
