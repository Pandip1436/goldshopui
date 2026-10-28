import { AnimatePresence, m } from 'framer-motion';
import { ArrowRight, ChevronRight, Coins, FileText, Gem, Hammer, Headset, Quote, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { PURITIES, whatsappLink, type BannerDTO, type HomeDTO, type PublicSettings } from '@goldshop/shared';
import { AboutLegacy, LotusMark } from '../components/AboutLegacy';
import { CategoryGlyph } from '../components/CategoryGlyph';
import { ABOUT_ICONS, PROMISE_ICONS } from '../components/aboutIcons';
import { HeroCarousel } from '../components/HeroCarousel';
import { CategoryCircles, PromoTiles, TrustRow } from '../components/HomeTop';
import { Seo } from '../components/Seo';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { ProductRail } from '../components/product/ProductCard';
import { ButtonLink } from '../components/ui/Button';
import { Reveal } from '../components/ui/Motion';
import { Img, Ornament, SectionHeading, Skeleton, Stars } from '../components/ui/misc';
import { useHome, useSettings } from '../lib/hooks';
import { cn, formatDate, inr, rateFreshness } from '../lib/utils';

const ease = [0.22, 1, 0.36, 1] as const;

/** Before any banner is set up, the hero still says what the store is about. */
const FALLBACK_BANNER: BannerDTO = {
  id: 'fallback',
  title: 'Gold, crafted to be worn and *priced in the open*',
  subtitle: 'Every piece shows its gold weight, today’s rate, making charge and GST — so you always know exactly what you are paying for.',
  ctaLabel: 'Shop jewellery',
  ctaHref: '/shop',
  theme: 'light',
  align: 'left',
  layout: 'full',
};

export default function Home() {
  const { data: home, isLoading } = useHome();
  const { data: settings } = useSettings();
  return (
    <>
      <Seo path="/" />
      <HeroCarousel banners={home && home.banners.length === 0 ? [FALLBACK_BANNER] : (home?.banners ?? [])} loading={isLoading} />
      {settings &&
        (settings.homePage.trust.length > 0 ? <TrustRow items={settings.homePage.trust} /> : settings.benefits.length > 0 && <Benefits items={settings.benefits} />)}
      <CategoryCircles home={home} loading={isLoading} />
      {settings && settings.homePage.promos.length > 0 && <PromoTiles settings={settings} />}
      <Categories home={home} loading={isLoading} />
      <Collections home={home} />
      <ProductTabs home={home} loading={isLoading} />
      {settings && <PricingBand settings={settings} />}
      {settings?.about ? (
        <AboutLegacy about={settings.about} stats={settings.stats} storeName={settings.store.name} />
      ) : (
        <Story settings={settings} home={home} />
      )}
      {settings?.savingsPlan.enabled && <SavingsPlan plan={settings.savingsPlan} image={settings.homePage.savingsImage} />}
      {home && home.testimonials.length > 0 && <Testimonials items={home.testimonials} />}
      {home && home.posts.length > 0 && <Journal posts={home.posts} />}
      <FinalCta settings={settings} />
    </>
  );
}

/* ----------------------------------------------------------------- benefits */

function Benefits({ items }: { items: PublicSettings['benefits'] }) {
  return (
    <section aria-label="Why shop with us" className="relative overflow-hidden border-y border-line bg-paper">
      <div className="container-page grid py-2 sm:grid-cols-2 lg:grid-cols-4">
        {items.slice(0, 4).map((b, idx) => {
          const Icon = PROMISE_ICONS[b.icon ?? ''] ?? Sparkles;
          return (
            <Reveal key={b.title} delay={idx * 0.06} className={cn('flex items-center gap-4 py-5 sm:px-5 lg:py-8', idx > 0 && 'max-sm:border-t max-sm:border-line lg:border-l lg:border-line')}>
              <span className="grid size-16 shrink-0 place-items-center rounded-full border border-gold/50 bg-ivory text-gold-deep shadow-[0_8px_18px_-14px_rgba(122,87,22,.7)]">
                <Icon className="size-7" strokeWidth={1.2} aria-hidden />
              </span>
              <div>
                <h3 className="font-display text-[1.3125rem] font-semibold leading-tight text-maroon">{b.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{b.text}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- categories */

const pad2 = (n: number) => String(n).padStart(2, '0');
const pieces = (n = 0) => `${n} ${n === 1 ? 'piece' : 'pieces'}`;

/**
 * "Find your piece": categories as a list with line icons and real counts on a deep maroon field,
 * beside a framed photograph that follows the hovered or focused category.
 */
function Categories({ home, loading }: { home?: HomeDTO; loading: boolean }) {
  const cats = (home?.categories ?? []).filter((c) => (c.productCount ?? 0) > 0).slice(0, 6);
  const [active, setActive] = useState(0);
  if (!loading && cats.length === 0) return null;
  const current = cats[active] ?? cats[0];
  const corner = 'absolute size-5 border-gold-soft/80';

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#3a1013] via-[#2a0d0f] to-[#1e0a0b] text-ivory" aria-labelledby="cat-title">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:repeating-linear-gradient(135deg,#d9b872_0_1px,transparent_1px_16px)]" />
      <LotusMark className="pointer-events-none absolute -bottom-12 -left-10 w-64 text-gold-soft opacity-[0.12]" />

      <div className="container-page relative grid gap-12 py-20 md:py-24 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col lg:col-span-6 xl:col-span-5">
          <Reveal>
            <p className="flex items-center gap-4 text-[0.75rem] font-semibold uppercase tracking-[0.3em] text-gold-soft">
              <span aria-hidden className="flex items-center text-gold-soft">
                <span className="h-px w-6 bg-current" />
                <span className="size-2 rotate-45 bg-current" />
              </span>
              Shop by form
            </p>
            <h2 id="cat-title" className="mt-4 font-display text-[clamp(2.75rem,2rem+2.6vw,4.5rem)] font-medium leading-[1.02]">
              Find your <em className="italic text-gold-soft">piece</em>
            </h2>
            <p className="mt-4 max-w-md text-[1rem] leading-relaxed text-ivory/80">
              From everyday studs to wedding harams — explore by form. Every piece shows its gold weight and a full price breakdown.
            </p>
          </Reveal>

          <ul className="mt-9 border-t border-gold-soft/25">
            {loading
              ? Array.from({ length: 5 }, (_, i) => (
                  <li key={i} className="border-b border-gold-soft/20 py-5">
                    <Skeleton className="h-9 w-2/3 opacity-10" />
                  </li>
                ))
              : cats.map((c, idx) => {
                  const on = idx === active;
                  return (
                    <li key={c.id} className="border-b border-gold-soft/20">
                      <Link
                        to={`/shop/${c.slug}`}
                        onMouseEnter={() => setActive(idx)}
                        onFocus={() => setActive(idx)}
                        className={cn('group flex items-center gap-4 px-3 py-4 transition-colors duration-300 sm:gap-6 sm:px-5', on ? 'bg-ivory/[0.06]' : 'hover:bg-ivory/[0.03]')}
                      >
                        <span className="relative size-14 shrink-0 overflow-hidden rounded-md lg:hidden">
                          <Img image={c.image} sizes="56px" width={480} className="size-full object-cover" />
                        </span>
                        <CategoryGlyph slug={c.slug} className="hidden size-9 shrink-0 text-gold-soft lg:block" />
                        <span className="min-w-0 flex-1">
                          <span className={cn('block font-display text-[1.75rem] font-medium leading-tight transition-colors sm:text-[2rem]', on ? 'text-ivory' : 'text-ivory/85')}>{c.name}</span>
                          <span className="mt-0.5 block text-2xs font-semibold uppercase tracking-[0.2em] text-ivory/60 sm:hidden">{pieces(c.productCount)}</span>
                        </span>
                        <span className="hidden text-2xs font-semibold uppercase tracking-[0.2em] text-ivory/70 sm:block">{pieces(c.productCount)}</span>
                        <ChevronRight aria-hidden className={cn('size-5 shrink-0 text-gold-soft transition-transform duration-300', on && 'translate-x-1')} strokeWidth={1.6} />
                      </Link>
                    </li>
                  );
                })}
          </ul>

          <Link
            to="/shop"
            className="mt-8 inline-flex items-center gap-3 self-start text-[0.8125rem] font-semibold uppercase tracking-[0.2em] text-gold-soft underline decoration-gold-soft/60 underline-offset-[8px] hover:text-ivory"
          >
            View all jewellery <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        {/* framed preview — desktop only */}
        <div className="relative hidden lg:col-span-6 lg:block xl:col-span-7">
          <div className="relative h-full min-h-[36rem] border border-gold-soft/60 p-2.5">
            <span aria-hidden className={cn(corner, 'left-1 top-1 border-l border-t')} />
            <span aria-hidden className={cn(corner, 'right-1 top-1 border-r border-t')} />
            <span aria-hidden className={cn(corner, 'bottom-1 left-1 border-b border-l')} />
            <span aria-hidden className={cn(corner, 'bottom-1 right-1 border-b border-r')} />
            <div className="relative h-full overflow-hidden">
              {cats.map((c, idx) => (
                <div
                  key={c.id}
                  aria-hidden={idx !== active}
                  className={cn(
                    'absolute inset-0 transition-all duration-[1100ms] ease-[var(--ease-lux)]',
                    idx === active ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0',
                  )}
                >
                  <Img image={c.image} sizes="(min-width: 1280px) 50vw, 48vw" width={1600} className="size-full object-cover" />
                </div>
              ))}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#1e0a0b]/90 via-[#1e0a0b]/30 via-45% to-transparent" />
              <div aria-hidden className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#1e0a0b]/50 to-transparent" />

              {current && (
                <>
                  <p className="absolute right-7 top-6 text-sm text-ivory/80 tabular">
                    <span className="text-gold-soft">{pad2(active + 1)}</span> / {pad2(cats.length)}
                  </p>
                  <AnimatePresence mode="wait">
                    <m.div
                      key={current.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.5, ease }}
                      className="absolute inset-x-0 bottom-0 p-9 xl:p-11"
                    >
                      <p className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-gold-soft">{current.name}</p>
                      <p className="mt-2 font-display text-[3rem] font-medium leading-tight">{current.name}</p>
                      {current.description && <p className="mt-1 max-w-md text-[0.9375rem] leading-relaxed text-ivory/85">{current.description}</p>}
                      <Link
                        to={`/shop/${current.slug}`}
                        className="mt-6 inline-flex h-12 items-center gap-3 bg-gradient-to-b from-[#ecd08f] to-[#c9a052] px-6 text-[0.8125rem] font-bold uppercase tracking-[0.18em] text-maroon transition-[filter] hover:brightness-105"
                      >
                        Explore {current.name.toLowerCase()} <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    </m.div>
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- collections */

function Collections({ home }: { home?: HomeDTO }) {
  const cols = (home?.collections ?? []).filter((c) => c.banner || c.image).slice(0, 3);
  if (cols.length === 0) return null;
  return (
    <section className="relative overflow-hidden bg-ivory py-16 md:py-20" aria-labelledby="col-title">
      <LotusMark className="pointer-events-none absolute -left-12 top-4 w-48 text-gold opacity-[0.1]" />
      <div className="container-page relative">
        <div className="grid items-end gap-4 md:grid-cols-[1fr_auto_1fr]">
          <span className="hidden md:block" />
          <div className="text-center">
            <span aria-hidden className="mx-auto flex w-60 items-center gap-2 text-gold">
              <span className="h-px flex-1 bg-gold/50" />
              <LotusMark className="w-7" />
              <span className="h-px flex-1 bg-gold/50" />
            </span>
            <p className="mt-2 text-[0.75rem] font-semibold uppercase tracking-[0.28em] text-gold-deep">Collections</p>
            <h2 id="col-title" className="mt-2 font-display text-[clamp(2.25rem,1.7rem+2vw,3.25rem)] font-medium leading-tight text-maroon">
              Edited for the way you <em className="italic text-gold-deep">wear gold</em>
            </h2>
            <p className="mt-2 text-[0.9375rem] text-ink-2">From everyday essentials to wedding heirlooms — pieces grouped by occasion and by craft.</p>
          </div>
          <Link to="/collections" className="inline-flex items-center gap-2 justify-self-center text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep hover:text-maroon md:justify-self-end">
            View all collections <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        <div className={cn('mt-10 grid gap-4 lg:gap-5', cols.length === 3 ? 'lg:grid-cols-[1.45fr_1fr_1fr]' : cols.length === 2 ? 'md:grid-cols-2' : '')}>
          {cols.map((c, idx) => {
            const dark = idx === 0;
            return (
              <Reveal key={c.id} delay={idx * 0.08}>
                <Link
                  to={`/collections/${c.slug}`}
                  className={cn('group relative block h-full min-h-[17rem] overflow-hidden rounded-md md:min-h-[19rem]', dark ? 'bg-[#2b1310] text-ivory' : 'bg-paper text-ink')}
                >
                  <span aria-hidden className={cn('absolute inset-y-0 right-0 [mask-image:linear-gradient(to_right,transparent,black_40%)]', dark ? 'w-[52%] sm:w-[68%]' : 'w-[48%] sm:w-[62%]')}>
                    <Img
                      image={c.banner ?? c.image}
                      sizes="(min-width: 1024px) 30vw, 100vw"
                      width={1600}
                      className="size-full object-cover transition-transform duration-[1400ms] ease-[var(--ease-lux)] group-hover:scale-[1.05]"
                    />
                  </span>
                  <span className="relative flex h-full max-w-[60%] flex-col justify-center p-6 md:p-7">
                    <span className={cn('flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.2em]', dark ? 'text-gold-soft' : 'text-gold-deep')}>
                      <span aria-hidden className="h-px w-5 bg-current" />
                      {c.eyebrow || 'Collection'}
                    </span>
                    <span className={cn('mt-3 font-display text-[2.125rem] font-medium leading-[1.05]', !dark && 'text-maroon')}>{c.name}</span>
                    {c.tagline && <span className={cn('mt-3 text-[0.9375rem] leading-snug', dark ? 'text-ivory/85' : 'text-ink-2')}>{c.tagline}</span>}
                    <span
                      className={cn(
                        'mt-5 inline-flex h-10 items-center gap-2.5 self-start border px-5 text-[0.75rem] font-bold uppercase tracking-[0.16em] transition-colors',
                        dark ? 'border-ivory/70 group-hover:bg-ivory group-hover:text-maroon' : 'border-maroon/60 text-maroon group-hover:bg-maroon group-hover:text-ivory',
                      )}
                    >
                      Explore <ArrowRight className="size-3.5" aria-hidden />
                    </span>
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- product tabs */

function ProductTabs({ home, loading }: { home?: HomeDTO; loading: boolean }) {
  const tabs = [
    // Bestsellers only appear once there are real sales to base them on.
    { key: 'bestsellers', label: 'Bestsellers', items: home?.bestsellers ?? [], href: '/shop?sort=popular' },
    { key: 'new', label: 'New arrivals', items: home?.newArrivals ?? [], href: '/shop?sort=newest' },
    { key: 'featured', label: 'Our picks', items: home?.featured ?? [], href: '/shop' },
  ].filter((t) => loading || t.items.length > 0);
  // Opens on New arrivals (the first tab with pieces when there are none).
  const [active, setActive] = useState<string>('new');
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  if (!current) return null;
  return (
    <section className="py-20 md:py-28" aria-labelledby="pt-title">
      <div className="container-page">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-3">The edit</p>
            <h2 id="pt-title" className="display-md">
              Pieces to know
            </h2>
          </div>
          <div role="tablist" aria-label="Product lists" className="flex gap-6 border-b border-line">
            {tabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={t.key === current.key}
                onClick={() => setActive(t.key)}
                className={cn(
                  '-mb-px border-b-2 pb-3 text-xs font-semibold uppercase tracking-[0.16em] transition-colors',
                  t.key === current.key ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div role="tabpanel">
          <ProductRail products={current.items.slice(0, 8)} loading={loading} />
        </div>
        <div className="mt-10 text-center">
          <ButtonLink to={current.href} variant="secondary">
            View all
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- transparent pricing */

function PricingBand({ settings }: { settings: PublicSettings }) {
  const keys = settings.displayRates;
  const fresh = rateFreshness(settings.goldRates.updatedAt);
  const photo = settings.homePage.pricingImage;
  const parts = [
    { label: 'Gold value', note: 'Net weight × the gold rate', icon: Coins },
    { label: 'Making charges', note: 'Craftsmanship and design work', icon: Hammer },
    { label: 'Stones & extras', note: 'Stones, beads and special finishes', icon: Gem },
    { label: 'GST', note: `${settings.gstRateBps / 100}% as per government rates`, icon: FileText },
  ];
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#3a1013] via-[#2a0d0f] to-[#1e0a0b] text-ivory" aria-labelledby="price-title">
      {photo && (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[22%] [mask-image:linear-gradient(to_right,transparent,black_50%)] 2xl:block">
          <Img image={photo} sizes="22vw" width={960} className="size-full object-cover" />
        </div>
      )}
      <div className="container-page relative grid gap-10 py-16 md:py-20 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.5fr)_minmax(0,0.85fr)] xl:items-center xl:gap-8 2xl:pr-[18%]">
        <div>
          <p className="flex items-center gap-3 text-[0.75rem] font-semibold uppercase tracking-[0.28em] text-gold-soft">
            <span aria-hidden className="h-px w-5 bg-current" />
            Priced in the open
          </p>
          <h2 id="price-title" className="mt-4 font-display text-[clamp(2.25rem,1.7rem+2vw,3.25rem)] font-medium leading-[1.08]">
            Know exactly what you’re <em className="italic text-gold-soft">paying for</em>
          </h2>
          <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-ivory/80">
            Every price on this site is built from four parts and updated whenever the gold rate changes. Open any piece to see its full breakdown.
          </p>
          <Link
            to="/journal/how-our-prices-are-calculated"
            // Full width on phones, like the site's other main buttons there.
            className="mt-7 flex h-12 w-full items-center justify-center gap-3 border border-gold-soft/70 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft transition-colors hover:bg-gold-soft hover:text-maroon sm:inline-flex sm:h-11 sm:w-auto"
          >
            How our pricing works <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        <ol className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 sm:gap-0">
          {parts.map((p, idx) => (
            <li key={p.label} className={cn('relative flex flex-col items-center px-3 text-center sm:items-start sm:text-left', idx > 0 && 'sm:border-l sm:border-gold-soft/25')}>
              <span className="grid size-14 place-items-center rounded-full border border-gold-soft/60 text-gold-soft sm:self-center">
                <p.icon className="size-6" strokeWidth={1.3} aria-hidden />
              </span>
              <span className="mt-4 font-display text-[1.75rem] font-medium leading-none text-gold-soft">{String(idx + 1).padStart(2, '0')}</span>
              <span className="mt-2 text-[0.9375rem] font-semibold">{p.label}</span>
              <span className="mt-0.5 text-xs leading-snug text-ivory/70">{p.note}</span>
            </li>
          ))}
        </ol>

        {keys.length > 0 && (
          <div className="rounded-md border border-gold-soft/60 bg-[#1e0a0b]/70 p-6 shadow-[0_24px_50px_-30px_rgba(0,0,0,.9)] backdrop-blur-sm">
            <div className="flex items-baseline justify-between gap-4 border-b border-gold-soft/25 pb-3">
              <h3 className="font-display text-[1.5rem] font-medium">{fresh.today ? 'Today’s gold rate' : 'Gold rate'}</h3>
              <span className="text-xs text-ivory/70">per gram</span>
            </div>
            <dl className="divide-y divide-gold-soft/15">
              {keys.map((k) => (
                <div key={k} className="flex items-baseline justify-between py-3">
                  <dt className="text-sm text-ivory/85">
                    {PURITIES[k].label} ({PURITIES[k].fineness})
                  </dt>
                  <dd className="font-display text-[1.5rem] font-semibold tabular text-gold-soft">{inr(settings.goldRates[k]!)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 border-t border-gold-soft/25 pt-3 text-xs leading-relaxed text-ivory/75">
              {fresh.label}. Making charges and {settings.gstRateBps / 100}% GST are added per piece; the price is locked when you order.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- story */

function Story({ settings, home }: { settings?: PublicSettings; home?: HomeDTO }) {
  const img = home?.collections.find((c) => c.slug === 'wedding-and-festive')?.image ?? home?.collections[1]?.image;
  return (
    <section className="py-20 md:py-28" aria-labelledby="story-title">
      <div className="container-page grid items-center gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <div className="relative mx-auto max-w-md">
            <div className="arch aspect-[4/5] overflow-hidden bg-sand">
              <Img image={img} sizes="(min-width: 1024px) 36vw, 90vw" className="size-full object-cover" />
            </div>
            <Ornament className="mt-6 justify-center" />
          </div>
        </Reveal>
        <Reveal delay={0.1} className="lg:col-span-6 lg:col-start-7">
          <p className="eyebrow">Our story</p>
          <h2 id="story-title" className="display-lg mt-4">
            Made to be <em className="italic text-gold-deep">worn</em>, not kept for best
          </h2>
          <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-ink-2">
            {settings?.store.description ||
              'Good gold should feel like part of you. We make pieces light enough for every day and fine enough for every occasion — and we show you exactly how each one is priced.'}
          </p>
          <div className="cta-row mt-8">
            <ButtonLink to="/about" variant="secondary">
              Read our story
            </ButtonLink>
            <ButtonLink to="/contact" variant="ghost">
              Visit or contact us
            </ButtonLink>
          </div>
          {settings && settings.stats.length > 0 && (
            <dl className="mt-12 grid grid-cols-2 gap-6 border-t border-line pt-8 sm:grid-cols-3">
              {settings.stats.map((s) => (
                <div key={s.label}>
                  <dt className="text-xs text-muted">{s.label}</dt>
                  <dd className="font-display text-3xl font-semibold text-ink">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- savings plan */

function SavingsPlan({ plan, image }: { plan: PublicSettings['savingsPlan']; image?: PublicSettings['homePage']['savingsImage'] }) {
  return (
    <section className="relative overflow-hidden bg-ivory" aria-labelledby="plan-title">
      {image && (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 hidden w-[30%] [mask-image:linear-gradient(to_left,transparent,black_45%)] lg:block">
          <Img image={image} sizes="30vw" width={960} className="size-full object-cover" />
        </div>
      )}
      <LotusMark className="pointer-events-none absolute -right-10 -top-6 w-44 text-gold opacity-[0.1]" />
      <div className={cn('container-page relative grid gap-10 py-16 md:py-20 lg:items-center', plan.features.length > 0 && 'lg:grid-cols-[minmax(0,1fr)_17rem]', image && 'lg:pl-[24%]')}>
        <Reveal className="text-center">
          <span aria-hidden className="mx-auto flex w-60 items-center gap-2 text-gold">
            <span className="h-px flex-1 bg-gold/50" />
            <LotusMark className="w-7" />
            <span className="h-px flex-1 bg-gold/50" />
          </span>
          <p className="mt-2 text-[0.75rem] font-semibold uppercase tracking-[0.28em] text-gold-deep">Gold savings plan</p>
          <h2 id="plan-title" className="mx-auto mt-3 max-w-2xl font-display text-[clamp(2rem,1.5rem+1.8vw,3rem)] font-medium leading-[1.12] text-maroon">
            Save a little each month towards something you’ll keep <em className="italic text-gold-deep">for life</em>
          </h2>
          {plan.summary && <p className="mx-auto mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-ink-2">{plan.summary}</p>}
          <Link
            to="/gold-savings-plan"
            className="mt-7 inline-flex h-12 items-center gap-3 bg-gradient-to-b from-maroon-2 to-maroon px-7 text-[0.8125rem] font-bold uppercase tracking-[0.18em] text-ivory shadow-[0_12px_24px_-14px_rgba(63,18,21,.9)] transition-[filter] hover:brightness-110"
          >
            Discover the plan <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Reveal>
        {plan.features.length > 0 && (
          // Below lg the heading above is centred, so the points sit centred under it (an icon over each title);
          // from lg they become a list beside it.
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-7 lg:block lg:space-y-5 lg:border-l lg:border-line lg:pl-8">
            {plan.features.map((f) => {
              const Icon = ABOUT_ICONS[f.icon ?? ''] ?? Sparkles;
              return (
                <li key={f.title} className="flex w-[calc(50%-0.5rem)] flex-col items-center gap-3 text-center sm:w-[calc(25%-0.75rem)] lg:w-auto lg:flex-row lg:gap-4 lg:text-left">
                  <span className="grid size-14 shrink-0 place-items-center rounded-full border border-gold/50 bg-paper text-gold-deep">
                    <Icon className="size-6" strokeWidth={1.3} aria-hidden />
                  </span>
                  <span className="text-[0.9375rem] leading-snug text-ink-2">
                    <span className="block font-medium text-ink">{f.title}</span>
                    {f.text && <span className="block text-sm">{f.text}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- testimonials */

function Testimonials({ items }: { items: HomeDTO['testimonials'] }) {
  return (
    <section className="py-20 md:py-28" aria-labelledby="t-title">
      <div className="container-page">
        <SectionHeading id="t-title" eyebrow="In their words" title="From our customers" align="center" />
        <div className="grid gap-6 md:grid-cols-3">
          {items.slice(0, 3).map((t, idx) => (
            <Reveal key={t.id} delay={idx * 0.08} className="flex flex-col border border-line bg-paper p-7">
              <Quote className="size-6 text-gold" strokeWidth={1.2} aria-hidden />
              <blockquote className="mt-4 flex-1 font-display text-xl leading-snug text-ink">“{t.quote}”</blockquote>
              <figcaption className="mt-6 text-sm">
                {t.rating && <Stars value={t.rating} size={12} className="mb-2" />}
                <span className="font-semibold">{t.name}</span>
                {t.location && <span className="text-muted"> · {t.location}</span>}
                {t.source && <span className="block text-xs text-subtle">via {t.source}</span>}
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ journal */

function Journal({ posts }: { posts: HomeDTO['posts'] }) {
  return (
    <section className="border-t border-line py-20 md:py-28" aria-labelledby="j-title">
      <div className="container-page">
        <SectionHeading
          id="j-title"
          eyebrow="Journal"
          title="Know your gold"
          description="Short, honest guides to purity, hallmarks, pricing and care."
          action={
            <Link to="/journal" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] underline decoration-gold underline-offset-[6px]">
              All articles <ArrowRight className="size-3.5" />
            </Link>
          }
        />
        <div className="grid gap-8 md:grid-cols-3">
          {posts.map((p, idx) => (
            <Reveal key={p.id} delay={idx * 0.08}>
              <Link to={`/journal/${p.slug}`} className="group block">
                <div className="aspect-[3/2] overflow-hidden bg-sand">
                  <Img image={p.cover} sizes="(min-width: 768px) 30vw, 100vw" className="size-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
                </div>
                <p className="mt-4 text-xs text-muted">
                  {formatDate(p.publishedAt)} · {p.readingMinutes} min read
                </p>
                <h3 className="mt-1.5 font-display text-2xl font-semibold leading-tight text-ink group-hover:text-gold-deep">{p.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{p.excerpt}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- final CTA */

function FinalCta({ settings }: { settings?: PublicSettings }) {
  const wa = settings?.store.whatsapp;
  // Labels stay on one line on phones: tighter padding and tracking there, and the arrows only from sm.
  const primary =
    'inline-flex h-13 items-center gap-2.5 whitespace-nowrap bg-gradient-to-b from-maroon-2 to-maroon px-5 text-[0.8125rem] font-bold uppercase tracking-[0.12em] text-ivory shadow-[0_12px_24px_-14px_rgba(63,18,21,.9)] transition-[filter] hover:brightness-110 sm:gap-3 sm:px-7 sm:tracking-[0.16em]';
  const arrow = 'hidden size-4 sm:block';
  return (
    <section className="container-page pt-12" aria-labelledby="cta-title">
      <Reveal className="relative grid items-center gap-8 overflow-hidden rounded-md border border-gold/50 bg-paper px-6 py-10 sm:px-10 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-8">
        <LotusMark className="pointer-events-none absolute -bottom-8 -right-6 w-40 text-gold opacity-[0.1]" />
        <span className="hidden size-20 place-items-center rounded-full border border-gold/50 bg-gold-pale/30 text-gold-deep md:grid">
          <Headset className="size-9" strokeWidth={1.2} aria-hidden />
        </span>
        <div>
          <h2 id="cta-title" className="font-display text-[clamp(1.875rem,1.5rem+1.4vw,2.5rem)] font-medium leading-tight text-ink">
            Not sure which piece? <em className="italic text-gold-deep">Ask us.</em>
          </h2>
          <p className="mt-2 max-w-xl text-[0.9375rem] text-ink-2">
            Tell us the occasion and your budget. We’ll suggest pieces, share more photos, and explain every rupee of the price.
          </p>
        </div>
        <div className="cta-row relative">
          {wa ? (
            <a href={whatsappLink(wa, 'Hello! Could you help me choose a piece?')} target="_blank" rel="noreferrer" className={primary}>
              <WhatsAppIcon className="size-5" /> Chat on WhatsApp <ArrowRight className={arrow} aria-hidden />
            </a>
          ) : (
            <Link to="/contact" className={primary}>
              Contact us <ArrowRight className={arrow} aria-hidden />
            </Link>
          )}
          <Link
            to="/shop"
            className="inline-flex h-13 items-center gap-2.5 whitespace-nowrap border border-maroon/60 px-5 text-[0.8125rem] font-bold uppercase tracking-[0.12em] text-maroon transition-colors hover:bg-maroon hover:text-ivory sm:gap-3 sm:px-7 sm:tracking-[0.16em]"
          >
            Browse all <ArrowRight className={arrow} aria-hidden />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
