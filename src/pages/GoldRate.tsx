import { ArrowDown, ArrowRight, ArrowUp, BadgeCheck, Calculator, ChartNoAxesColumnIncreasing, Clock, Info, RefreshCw, ShoppingCart } from 'lucide-react';
import { useId, useState } from 'react';
import { Link } from 'react-router';
import { PURITIES, PURITY_KEYS, type GoldRatesDTO, type PurityKey } from '@goldshop/shared';
import { GoldRule } from '../components/AboutLegacy';
import { ABOUT_ICONS } from '../components/aboutIcons';
import { RateTrend } from '../components/RateTrend';
import { Seo } from '../components/Seo';
import { Dropdown } from '../components/ui/Dropdown';
import { ButtonLink } from '../components/ui/Button';
import { PageFade, Reveal } from '../components/ui/Motion';
import { EmptyState, Img, Skeleton } from '../components/ui/misc';
import { useGoldRates, useProducts } from '../lib/hooks';
import { cn, formatDateTime, inr, rateFreshness } from '../lib/utils';

const isGold = (k: PurityKey) => PURITIES[k].metal === 'gold';
/** "999" → "99.9%". */
const purePct = (k: PurityKey) => `${(Number(PURITIES[k].fineness) / 10).toFixed(1)}%`;

/** Metal value in paise for a weight in grams, rounded to the rupee as the product prices are. */
function metalValue(grams: number, ratePerGram: number): number {
  const mg = Math.round(grams * 1000);
  return Math.round((mg * ratePerGram) / 1000 / 100) * 100;
}

function parseGrams(v: string): number | null {
  if (!/^\d{0,5}(\.\d{0,3})?$/.test(v.trim())) return null;
  const g = Number.parseFloat(v);
  return g > 0 && g <= 10_000 ? g : null;
}

export default function GoldRate() {
  // Re-checks every minute, so "auto refresh" is literally true.
  const { data, isLoading } = useGoldRates({ live: true });
  const keys = PURITY_KEYS.filter((k) => data?.rates[k]);
  const fresh = rateFreshness(data?.updatedAt);
  const [trend, setTrend] = useState<PurityKey | null>(null);
  // Only link to purities that actually have pieces, so no button leads to an empty page.
  const { data: catalog } = useProducts({ limit: 1 });
  const stocked = keys.filter((k) => catalog?.facets.purities.some((f) => f.key === k && f.count > 0));
  const highlights = data?.page.highlights ?? [];
  // four cards sit in one row (narrower photo); five or six wrap into rows of three
  const four = keys.length === 4;
  const image = data?.page.image;

  return (
    <PageFade>
      <Seo
        title={fresh.today ? 'Today’s gold rate' : 'Gold rate'}
        description="Our current gold rates per gram, used to price every weight-based piece, with the rate trend and a calculator for the metal value of your gold."
        path="/gold-rate"
      />

      <section aria-labelledby="rate-title" className="relative overflow-hidden bg-ivory">
        {image && (
          <>
            <div
              aria-hidden
              className={cn(
                'absolute inset-y-0 right-0 hidden [mask-image:linear-gradient(to_right,transparent,black_24%)] xl:block',
                four ? 'w-[27%]' : 'w-[31%]',
              )}
            >
              <Img image={image} priority sizes="30vw" width={1600} className="size-full object-cover object-[70%_center]" />
            </div>
            {data?.page.script && data.page.script.length > 0 && (
              <p
                className={cn(
                  'absolute top-8 hidden -rotate-6 font-display text-[clamp(1.75rem,1rem+1.2vw,2.5rem)] font-medium italic leading-[1.02] text-maroon [text-shadow:0_1px_14px_rgba(255,248,236,.95)] xl:block',
                  four ? 'left-[71%]' : 'left-[67.5%]',
                )}
              >
                {data.page.script.map((l, i) => (
                  <span key={`${i}-${l}`} className={cn('block', i % 2 === 1 && 'pl-[0.6em]')}>
                    {l}
                  </span>
                ))}
                <GoldRule className="mt-2 w-20" />
              </p>
            )}
          </>
        )}

        <div className={cn('container-page relative pb-10 pt-10 md:pt-12', image && (four ? 'xl:pr-[28%]' : 'xl:pr-[32%]'))}>
          <div className="text-center">
            <p className="text-[0.9375rem] font-medium uppercase tracking-[0.42em] text-ink-2 md:text-lg">{fresh.today ? 'Today’s' : 'Our current'}</p>
            <h1 id="rate-title" className="mt-1 font-display text-[clamp(3.25rem,1.9rem+4.6vw,6.25rem)] font-semibold leading-[0.95] tracking-[-0.01em]">
              <span className="bg-gradient-to-b from-[#d9b061] via-gold to-gold-deep bg-clip-text pr-1 text-transparent">Gold</span>{' '}
              <span className="text-maroon">Rates</span>
            </h1>
            <p className="mt-4 text-[0.75rem] font-medium uppercase tracking-[0.22em] text-ink-2 sm:text-[0.8125rem] sm:tracking-[0.28em]">
              {fresh.today ? 'Live rates' : 'Rates set by our store'} <span aria-hidden>•</span> Transparent pricing <span aria-hidden>•</span> Trusted always
            </p>

            {isLoading ? (
              <Skeleton className="mx-auto mt-6 h-12 w-80 rounded-xl" />
            ) : (
              data?.updatedAt && (
                <p className="mx-auto mt-6 inline-flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-xl border border-line/80 bg-paper px-5 py-3 text-[0.9375rem] text-ink-2 shadow-[0_12px_30px_-24px_rgba(63,18,21,.5)] sm:divide-x sm:divide-line-strong/50">
                  <span className="flex items-center gap-2.5 sm:pr-1">
                    <Clock className="size-[1.125rem] text-gold-deep" strokeWidth={1.6} aria-hidden />
                    Last updated: {formatDateTime(data.updatedAt)}
                  </span>
                  {fresh.today ? (
                    <span className="flex items-center gap-2.5 font-medium text-success sm:pl-5">
                      <RefreshCw className="size-[1.125rem]" strokeWidth={1.8} aria-hidden />
                      Live rates (auto refresh)
                    </span>
                  ) : (
                    <span className="flex items-center gap-2.5 font-medium text-warn sm:pl-5">
                      <span aria-hidden className="size-2 rounded-full bg-warn" />
                      Not updated today
                    </span>
                  )}
                </p>
              )
            )}
          </div>

          {isLoading ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-96 rounded-2xl" />
              ))}
            </div>
          ) : !data || keys.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-line/70 bg-paper py-6">
              <EmptyState title="Rates not published yet" action={<ButtonLink to="/contact">Contact us</ButtonLink>}>
                Please contact us for our current rate.
              </EmptyState>
            </div>
          ) : (
            <Reveal>
              <ul
                className={cn(
                  'mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 min-[480px]:grid-cols-2',
                  four ? 'lg:grid-cols-4' : keys.length >= 3 ? 'lg:grid-cols-3' : '',
                )}
              >
                {keys.map((k) => (
                  <RateCard key={k} k={k} data={data} compact={four} onTrend={() => setTrend(k)} />
                ))}
              </ul>
            </Reveal>
          )}
        </div>

        {highlights.length > 0 && (
          <div className="container-page relative pb-12">
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-y-4 rounded-2xl border border-line/70 bg-paper/95 px-3 py-5 shadow-[0_24px_50px_-40px_rgba(63,18,21,.5)] backdrop-blur-sm min-[360px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 xl:py-6">
              {highlights.map((h) => {
                const Icon = ABOUT_ICONS[h.icon ?? ''] ?? BadgeCheck;
                return (
                  <li key={h.title} className="flex items-center gap-3 px-2 sm:px-3 xl:[&+&]:border-l xl:[&+&]:border-line-strong/40">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gold-pale/45 text-gold-deep">
                      <Icon className="size-6" strokeWidth={1.3} aria-hidden />
                    </span>
                    <span className="min-w-0 text-[0.875rem] leading-snug text-ink">
                      {h.title}
                      {h.text && <span className="block text-xs text-muted">{h.text}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {data && keys.length > 0 && (
        <section aria-label="Gold value calculator" className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 py-14 md:py-20 lg:grid-cols-12 lg:gap-6">
          <Reveal className="lg:col-span-7">
            <div className="h-full rounded-2xl border border-line/70 bg-paper p-6 shadow-[0_30px_60px_-45px_rgba(63,18,21,.45)] md:p-8">
              <h2 className="flex items-center gap-4 font-display text-[2rem] font-medium leading-tight text-ink">
                How we set these rates
                <GoldRule className="w-16" />
              </h2>
              <ul className="mt-5 space-y-3 text-[0.9375rem] leading-relaxed text-ink-2">
                <li className="flex gap-3">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0 text-gold-deep" strokeWidth={1.5} aria-hidden />
                  Our store sets the rate per gram for each purity. Every weight-based piece on this site is priced from it, with the making charge and GST
                  shown separately.
                </li>
                <li className="flex gap-3">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0 text-gold-deep" strokeWidth={1.5} aria-hidden />
                  Rates are for the metal only and may differ from other published rates. 8 grams make one sovereign (pavan).
                </li>
                <li className="flex gap-3">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0 text-gold-deep" strokeWidth={1.5} aria-hidden />
                  The price of a piece is locked at the rate in force when you place your order.
                  {data.previous && ' The change on each card compares with the rate we were using 24 hours ago.'}
                </li>
              </ul>
              {stocked.length > 0 && (
                <div className="mt-8 border-t border-line/70 pt-6">
                  <p className="flex items-center gap-3 text-[0.8125rem] font-bold uppercase tracking-[0.2em] text-maroon">
                    <ShoppingCart className="size-5 text-gold" strokeWidth={1.4} aria-hidden />
                    Shop by purity
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-3">
                    {stocked.map((k) => (
                      <li key={k}>
                        <Link
                          to={`/shop?purity=${k}`}
                          className="group inline-flex h-11 items-center gap-3 rounded-md border border-line-strong/60 bg-ivory px-5 text-[0.9375rem] text-ink transition-colors hover:border-gold hover:bg-gold-pale/30"
                        >
                          {PURITIES[k].label} Jewellery
                          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Reveal>
          <Reveal delay={0.08} className="lg:col-span-5">
            <ValueCalculator rates={data.rates} keys={keys} fresh={fresh.today} />
          </Reveal>
        </section>
      )}

      <RateTrend purity={trend} onClose={() => setTrend(null)} />
    </PageFade>
  );
}

/* ---------------------------------------------------------- rate cards */

function Coin({ k, className }: { k: PurityKey; className?: string }) {
  const gold = isGold(k);
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-28 shrink-0 place-items-center rounded-full font-display text-[2rem] font-semibold shadow-[inset_0_0_0_3px_rgba(255,255,255,.35),inset_0_-6px_12px_rgba(0,0,0,.12),0_14px_24px_-12px_rgba(63,18,21,.45)] ring-1',
        gold
          ? 'bg-[radial-gradient(circle_at_35%_30%,#fbe7a8,#e2b453_55%,#b0802a)] text-maroon/85 ring-gold/50'
          : 'bg-[radial-gradient(circle_at_35%_30%,#ffffff,#d7d7d7_55%,#a9a9a9)] text-ink-2 ring-black/15',
        className,
      )}
    >
      {gold ? PURITIES[k].label : PURITIES[k].fineness}
    </span>
  );
}

/** The change from the rate in force 24 hours ago — shown only when that history exists. */
function Change({ now, then }: { now: number; then?: number }) {
  if (!then) return null;
  const diff = now - then;
  if (diff === 0) return <p className="mt-2 text-sm text-muted">No change in 24 hours</p>;
  const up = diff > 0;
  const sign = up ? '+' : '−';
  const Arrow = up ? ArrowUp : ArrowDown;
  return (
    <p
      className={cn('mt-2 inline-flex items-center gap-2 text-[1.0625rem] font-semibold tabular', up ? 'text-success' : 'text-danger')}
      title="Change from the rate 24 hours ago"
    >
      <span aria-hidden className={cn('grid size-6 place-items-center rounded-full', up ? 'bg-success/12' : 'bg-danger/12')}>
        <Arrow className="size-3.5" strokeWidth={2.4} />
      </span>
      <span className="sr-only">{up ? 'Up' : 'Down'} in 24 hours:</span>
      {sign}
      {inr(Math.abs(diff))}
      <span className="font-medium">
        ({sign}
        {Math.abs((diff / then) * 100).toFixed(2)}%)
      </span>
    </p>
  );
}

function RateCard({ k, data, compact, onTrend }: { k: PurityKey; data: GoldRatesDTO; compact: boolean; onTrend: () => void }) {
  const rate = data.rates[k]!;
  const photo = data.page.purityImages?.[k];
  return (
    <li className="flex flex-col rounded-2xl border border-gold/35 bg-[#fffcf7] px-5 pb-5 pt-6 text-center shadow-[0_24px_50px_-36px_rgba(63,18,21,.5)]">
      <h2 className="text-[0.9375rem] font-bold uppercase tracking-[0.2em] text-maroon">{isGold(k) ? PURITIES[k].name : PURITIES[k].label}</h2>
      <p className="mt-1 text-sm tracking-[0.04em] text-ink-2">
        {purePct(k)} pure {isGold(k) ? 'gold' : 'silver'}
      </p>
      <div className="mt-4 flex h-24 items-center justify-center sm:h-32">
        {photo ? (
          // edges fade into the card, so the photo's own background never shows as a box
          <Img
            image={photo}
            alt=""
            sizes="240px"
            width={480}
            className="size-full object-contain mix-blend-multiply [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent),linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)]"
          />
        ) : (
          <Coin k={k} />
        )}
      </div>
      <p className="mt-4 font-display leading-none text-ink">
        <span className={cn('font-semibold tabular', compact ? 'text-[2.125rem] 2xl:text-[2.5rem]' : 'text-[2.5rem]')}>{inr(rate)}</span>
        <span className="ml-1.5 text-[1.25rem] text-ink-2">/ gram</span>
      </p>
      <Change now={rate} then={data.previous?.[k]} />
      <p className="mt-2 text-xs text-muted tabular">
        8 g {inr(rate * 8)} · 10 g {inr(rate * 10)}
      </p>
      <div className="mt-auto pt-5">
        <button
          type="button"
          onClick={onTrend}
          className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-lg bg-gold-pale/45 text-[0.9375rem] font-medium text-ink transition-colors hover:bg-gold-pale/75"
          aria-label={`Rate trend for ${PURITIES[k].name}`}
        >
          <ChartNoAxesColumnIncreasing className="size-5 text-gold-deep" strokeWidth={1.8} aria-hidden />
          Rate trend
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}

/* ---------------------------------------------------------- calculator */

function ValueCalculator({ rates, keys, fresh }: { rates: GoldRatesDTO['rates']; keys: PurityKey[]; fresh: boolean }) {
  const id = useId();
  const initial: PurityKey = keys.includes('gold22') ? 'gold22' : keys[0];
  const [grams, setGrams] = useState('10');
  const [purity, setPurity] = useState<PurityKey>(initial);
  const [shown, setShown] = useState({ grams: 10, purity: initial });
  const [error, setError] = useState('');
  // A purity can disappear if the store stops selling it while the page is open.
  const shownPurity = rates[shown.purity] ? shown.purity : initial;
  const rate = rates[shownPurity] ?? 0;
  const parsed = parseGrams(grams);
  const stale = parsed !== shown.grams || purity !== shownPurity;

  return (
    <form
      className="rounded-2xl bg-maroon p-6 text-ivory shadow-[0_40px_70px_-40px_rgba(63,18,21,.75)] md:p-7"
      onSubmit={(e) => {
        e.preventDefault();
        if (parsed === null) {
          setError('Enter a weight between 0.001 and 10,000 grams.');
          return;
        }
        setError('');
        setShown({ grams: parsed, purity });
      }}
      noValidate
    >
      <h2 className="flex items-center gap-3 font-display text-[1.5rem] font-semibold leading-tight xl:text-[1.75rem]">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold-soft/15 text-gold-soft ring-1 ring-gold-soft/40">
          <Calculator className="size-5" strokeWidth={1.5} aria-hidden />
        </span>
        Gold Value Calculator
      </h2>
      <p className="mt-2 text-sm text-ivory/75">Calculate the value of your gold based on {fresh ? 'today’s live rate' : 'our current rate'}.</p>

      <label htmlFor={`${id}-w`} className="mt-6 block text-sm font-semibold">
        Weight (grams)
      </label>
      <div className="mt-2 flex h-12 overflow-hidden rounded-lg bg-paper text-ink focus-within:ring-2 focus-within:ring-gold-soft">
        <input
          id={`${id}-w`}
          value={grams}
          onChange={(e) => {
            setGrams(e.target.value.replace(/[^0-9.]/g, ''));
            setError('');
          }}
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          className="min-w-0 flex-1 bg-transparent px-4 text-base tabular outline-none"
        />
        <span aria-hidden className="grid w-12 place-items-center border-l border-line bg-sand/60 text-ink-2">
          g
        </span>
      </div>
      {error && (
        <p id={`${id}-err`} className="mt-2 text-sm text-gold-pale">
          {error}
        </p>
      )}

      <label htmlFor={`${id}-p`} className="mt-5 block text-sm font-semibold">
        Purity
      </label>
      <div className="mt-2">
        <Dropdown
          id={`${id}-p`}
          value={purity}
          onChange={(v) => setPurity(v as PurityKey)}
          tone="paper"
          options={keys.map((k) => ({
            value: k,
            label: isGold(k) ? `${PURITIES[k].name} (${PURITIES[k].fineness})` : PURITIES[k].name,
            hint: `${inr(rates[k]!)} per gram`,
          }))}
        />
      </div>

      <div className="mt-6 rounded-xl bg-ivory p-5 text-ink">
        <div aria-live="polite">
          <p className="text-sm text-gold-deep">Estimated metal value</p>
          <p className={cn('mt-1 font-display text-[2.75rem] font-semibold leading-none tabular text-maroon transition-opacity', stale && 'opacity-40')}>
            {inr(metalValue(shown.grams, rate))}
          </p>
          <p className="mt-2 text-xs text-muted">
            {stale
              ? 'Press “Calculate Now” to update.'
              : `${shown.grams.toLocaleString('en-IN', { maximumFractionDigits: 3 })} g of ${PURITIES[shownPurity].label} at ${inr(rate)}/g`}
          </p>
        </div>
        <p className="mt-3 flex gap-2 text-[0.8125rem] leading-snug text-ink-2">
          <Info className="mt-px size-4 shrink-0 text-gold" strokeWidth={1.6} aria-hidden />
          Value of the metal only, before making charges and GST.
        </p>
        <button
          type="submit"
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#ecd08f] via-[#d9b872] to-[#c39a4a] font-semibold text-maroon shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_8px_20px_-10px_rgba(122,87,22,.8)] transition-[filter] hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
        >
          Calculate Now
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </form>
  );
}
