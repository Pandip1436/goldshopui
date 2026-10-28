import { ArrowRight, BadgeCheck, ChartNoAxesColumnIncreasing, PiggyBank } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { PURITIES, type HomeDTO, type PublicSettings } from '@goldshop/shared';
import { cn, inr, rateFreshness } from '../lib/utils';
import { ABOUT_ICONS } from './aboutIcons';
import { Reveal } from './ui/Motion';
import { Img, Skeleton } from './ui/misc';

/** The row of short trust points under the hero (Settings → Homepage). */
export function TrustRow({ items }: { items: PublicSettings['homePage']['trust'] }) {
  return (
    <section aria-label="Why shop with us" className="bg-ivory">
      <ul className="container-page grid grid-cols-2 gap-y-4 py-6 sm:grid-cols-3 xl:grid-cols-6 xl:py-7">
        {items.map((t) => {
          const Icon = ABOUT_ICONS[t.icon ?? ''] ?? BadgeCheck;
          return (
            <li key={t.title} className="flex items-center gap-3 px-2 sm:px-4 xl:justify-center xl:[&+&]:border-l xl:[&+&]:border-line-strong/45">
              <span className="grid size-12 shrink-0 place-items-center rounded-full border border-gold/40 bg-paper text-gold-deep shadow-[0_8px_18px_-14px_rgba(122,87,22,.7)] sm:size-14">
                <Icon className="size-6 sm:size-7" strokeWidth={1.3} aria-hidden />
              </span>
              <span className="min-w-0 text-[0.875rem] leading-snug text-ink sm:text-[0.9375rem]">{t.title}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Categories as a row of round photos. When they don't all fit, the row scrolls sideways
 * (with snap) and arrows appear; when they fit, it simply sits centred.
 */
export function CategoryCircles({ home, loading }: { home?: HomeDTO; loading: boolean }) {
  // The store's own choice (Settings → Homepage), or else every category with pieces.
  const cats =
    home?.circles ??
    (home?.categories ?? []).filter((c) => (c.productCount ?? 0) > 0).map((c) => ({ label: c.name, href: `/shop/${c.slug}`, image: c.image }));
  const row = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const check = () => setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
    check();
    el.addEventListener('scroll', check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', check);
      ro.disconnect();
    };
  }, [cats.length, loading]);

  if (!loading && cats.length === 0) return null;
  // No arrow buttons: below lg the row is swiped, with a soft fade on any side that has more;
  // from lg (mouse screens) a row that doesn't fit wraps onto a second centred line instead.
  const fade = 'pointer-events-none absolute inset-y-0 z-10 w-12 from-ivory to-transparent lg:hidden';

  return (
    <section aria-labelledby="circles-title" className="bg-ivory pb-8">
      <h2 id="circles-title" className="sr-only">
        Shop by category
      </h2>
      <div className="container-page relative">
        {!edges.start && <span aria-hidden className={cn(fade, 'left-0 bg-gradient-to-r')} />}
        <ul
          ref={row}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 pt-1 scrollbar-none sm:gap-7 lg:flex-wrap lg:justify-center lg:gap-y-6 lg:overflow-visible [&>li]:snap-start [&>li:first-child]:ms-auto [&>li:last-child]:me-auto lg:[&>li:first-child]:ms-0 lg:[&>li:last-child]:me-0"
        >
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <li key={i} className="flex w-24 shrink-0 flex-col items-center gap-3 sm:w-32">
                  <Skeleton className="size-24 rounded-full sm:size-32" />
                  <Skeleton className="h-4 w-16" />
                </li>
              ))
            : cats.map((c) => (
                <li key={c.href + c.label} className="shrink-0">
                  <Link to={c.href} className="group flex w-24 flex-col items-center gap-3 text-center sm:w-32">
                    <span className="block size-24 overflow-hidden rounded-full border-2 border-paper bg-sand shadow-[0_0_0_1px_rgba(165,122,44,.35),0_14px_28px_-18px_rgba(63,18,21,.6)] transition-shadow duration-300 group-hover:shadow-[0_0_0_2px_rgba(165,122,44,.8),0_18px_32px_-18px_rgba(63,18,21,.7)] sm:size-32">
                      <Img image={c.image} sizes="128px" width={480} className="size-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </span>
                    <span className="text-[0.875rem] font-medium leading-snug text-ink transition-colors group-hover:text-gold-deep sm:text-[0.9375rem]">{c.label}</span>
                  </Link>
                </li>
              ))}
        </ul>
        {!edges.end && <span aria-hidden className={cn(fade, 'right-0 bg-gradient-to-l')} />}
      </div>
    </section>
  );
}

/**
 * Up to three tiles (Settings → Homepage), maroon–cream–maroon. A tile that links to /gold-rate
 * shows the current 22K rate, and only says "today's" or "live" when the rate was set today.
 */
export function PromoTiles({ settings }: { settings: PublicSettings }) {
  const tiles = settings.homePage.promos;
  const fresh = rateFreshness(settings.goldRates.updatedAt);
  const rateKey = settings.goldRates.gold22 ? 'gold22' : settings.displayRates.find((k) => settings.goldRates[k]);
  // Words that are only true on a day the rate was updated.
  const honest = (text: string) => (fresh.today ? text : text.replace(/today[’']s\s+/i, '').replace(/\blive\s+/i, '').replace(/^\w/, (c) => c.toUpperCase()));

  return (
    <section aria-label="Explore" className="bg-ivory pb-12 md:pb-16">
      <ul className={cn('container-page grid grid-cols-[minmax(0,1fr)] gap-4 md:gap-5', tiles.length >= 3 ? 'lg:grid-cols-3' : tiles.length === 2 ? 'md:grid-cols-2' : '')}>
        {tiles.map((t, i) => {
          const dark = i !== 1;
          const isRate = t.href === '/gold-rate';
          const isSavings = t.href.startsWith('/gold-savings-plan');
          const photoLeft = i === 0;
          return (
            <li key={`${i}-${t.title}`}>
              <Reveal delay={i * 0.06} className="h-full">
                <Link
                  to={t.href}
                  className={cn(
                    'group relative flex h-full min-h-[11.5rem] overflow-hidden rounded-2xl shadow-[0_24px_50px_-36px_rgba(63,18,21,.6)] sm:min-h-[13rem]',
                    dark ? 'bg-gradient-to-br from-maroon-2 to-maroon text-ivory' : 'border border-gold/30 bg-[linear-gradient(135deg,#fdf7ec,#f3e6cc)] text-ink',
                    photoLeft && 'flex-row-reverse',
                  )}
                >
                  {t.image && (
                    <div
                      aria-hidden
                      className={cn(
                        'absolute inset-y-0 w-[52%]',
                        photoLeft ? 'left-0 [mask-image:linear-gradient(to_left,transparent,black_35%)]' : 'right-0 [mask-image:linear-gradient(to_right,transparent,black_35%)]',
                      )}
                    >
                      <Img image={t.image} sizes="(min-width: 1024px) 16vw, 50vw" width={960} className="size-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
                    </div>
                  )}
                  <div className={cn('relative flex w-[62%] flex-col justify-center gap-1.5 p-6 sm:p-7', photoLeft && 'items-start')}>
                    {isRate && <ChartNoAxesColumnIncreasing className="mb-1 size-8 text-gold-deep" strokeWidth={1.6} aria-hidden />}
                    {isSavings && <PiggyBank className={cn('mb-1 size-9', dark ? 'text-gold-soft' : 'text-gold-deep')} strokeWidth={1.4} aria-hidden />}
                    <h3 className={cn('font-display text-[1.75rem] font-semibold leading-[1.05] sm:text-[2rem]', dark ? 'text-ivory' : 'text-maroon')}>{isRate ? honest(t.title) : t.title}</h3>
                    {isRate && rateKey && (
                      <p className="text-[0.9375rem] font-semibold text-ink tabular">
                        {PURITIES[rateKey].label} {inr(settings.goldRates[rateKey]!)}/g
                      </p>
                    )}
                    {t.text && <p className={cn('max-w-[16rem] text-[0.875rem] leading-snug', dark ? 'text-ivory/80' : 'text-ink-2')}>{t.text}</p>}
                    <span
                      className={cn(
                        'mt-3 inline-flex h-10 w-max items-center gap-2 rounded-md px-4 text-[0.8125rem] font-semibold transition-colors',
                        dark ? 'border border-ivory/60 text-ivory group-hover:bg-ivory group-hover:text-maroon' : 'bg-gradient-to-b from-maroon-2 to-maroon text-ivory group-hover:brightness-110',
                      )}
                    >
                      {isRate ? honest(t.ctaLabel) : t.ctaLabel} <ArrowRight className="size-4" aria-hidden />
                    </span>
                  </div>
                </Link>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
