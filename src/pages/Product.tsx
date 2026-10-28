import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Coins,
  Cog,
  Crown,
  Gem,
  Headset,
  Heart,
  Lock,
  MessageCircle,
  ReceiptIndianRupee,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Truck,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { forwardRef, useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router';
import { PURITIES, whatsappLink, type ProductCardDTO, type ProductDetailDTO, type VariantDTO } from '@goldshop/shared';
import { LotusMark } from '../components/AboutLegacy';
import { Markdown } from '../components/Markdown';
import { Seo } from '../components/Seo';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { Gallery } from '../components/product/Gallery';
import { PincodeCheck } from '../components/product/PincodeCheck';
import { PriceBreakdownTable } from '../components/product/PriceBreakdown';
import { ProductRail } from '../components/product/ProductCard';
import { Reviews } from '../components/product/Reviews';
import { Button, ButtonLink } from '../components/ui/Button';
import { Field, FormError, Input, Textarea } from '../components/ui/Form';
import { PageFade } from '../components/ui/Motion';
import { Modal } from '../components/ui/Sheet';
import { Alert, Breadcrumbs, EmptyState, Img, Price, SectionHeading, Skeleton, Stars } from '../components/ui/misc';
import { api, errorMessage } from '../lib/api';
import { useCartActions, useProduct, useProductsByIds, useSettings, useWishlist } from '../lib/hooks';
import { recentlyViewed } from '../lib/localStore';
import { useUI } from '../lib/ui';
import { cn, formatGrams, inr, purityLabel, rateFreshness } from '../lib/utils';

export default function ProductPage() {
  const { slug } = useParams();
  const { data: p, isLoading, error } = useProduct(slug);

  if (isLoading) return <ProductSkeleton />;
  if (error || !p) {
    return (
      <div className="container-page py-16">
        <Seo title="Piece not found" noindex />
        <EmptyState title="We couldn’t find that piece" action={<ButtonLink to="/shop">Browse jewellery</ButtonLink>}>
          It may have sold out or been moved. Take a look at what’s available now.
        </EmptyState>
      </div>
    );
  }
  return <ProductView key={p.id} p={p} />;
}

/** Works out which variant matches the chosen option values. */
function useVariantSelection(p: ProductDetailDTO) {
  const firstAvailable = p.variants.find((v) => v.inStock) ?? p.variants[0];
  const [selected, setSelected] = useState<Record<string, string>>(() => ({ ...(firstAvailable?.attributes ?? {}) }));
  const optionNames = p.optionNames.length ? p.optionNames : p.variants.length > 1 ? ['Option'] : [];
  const valueOf = (v: VariantDTO, name: string) => (name === 'Option' ? v.label : v.attributes[name] ?? '');
  const variant =
    p.variants.length === 1
      ? p.variants[0]
      : p.variants.find((v) => optionNames.every((n) => valueOf(v, n) === (n === 'Option' ? selected.Option ?? firstAvailable?.label : selected[n]))) ?? firstAvailable;
  const options = optionNames.map((name) => ({
    name,
    values: [...new Set(p.variants.map((v) => valueOf(v, name)).filter(Boolean))],
  }));
  const isAvailable = (name: string, value: string) =>
    p.variants.some((v) => valueOf(v, name) === value && v.inStock && optionNames.filter((n) => n !== name).every((n) => !selected[n] || valueOf(v, n) === selected[n]));
  const current: Record<string, string> = { ...selected, Option: selected.Option ?? firstAvailable?.label ?? '' };
  /** The variant a given option value would select, keeping the other current choices. */
  const variantFor = (name: string, value: string) =>
    p.variants.find((v) => valueOf(v, name) === value && optionNames.every((n) => n === name || valueOf(v, n) === current[n])) ??
    p.variants.find((v) => valueOf(v, name) === value);
  return { variant, options, selected: current, setSelected, isAvailable, variantFor };
}

function ProductView({ p }: { p: ProductDetailDTO }) {
  const navigate = useNavigate();
  const { add } = useCartActions();
  const { data: settings } = useSettings();
  const { setChatTopic } = useUI();
  const { variant, options, selected, setSelected, isAvailable, variantFor } = useVariantSelection(p);
  const [tab, setTab] = useState<TabKey>('details');
  const tabsRef = useRef<HTMLDivElement>(null);
  const showTab = (t: TabKey) => {
    setTab(t);
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const [enquiry, setEnquiry] = useState(false);
  const buyRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    recentlyViewed.add(p.id);
    setChatTopic(p.name);
    return () => setChatTopic(null);
  }, [p.id, p.name, setChatTopic]);

  // Show the mobile purchase bar once the main buttons have scrolled above the viewport.
  // (A scroll check rather than IntersectionObserver: a fast jump past the buttons never
  // "intersects", so an observer would miss it.)
  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const el = buyRef.current;
      if (el) setShowSticky(el.getBoundingClientRect().bottom < 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    check();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const fresh = rateFreshness(p.goldRatesUpdatedAt);
  const canBuy = Boolean(variant && variant.inStock && variant.price.total > 0);
  const crumbs = [{ label: 'Home', to: '/' }, ...p.categoryPath.map((c) => ({ label: c.name, to: `/shop/${c.slug}` })), { label: p.name }];

  const addToBag = (buyNow = false) => {
    if (!variant) return;
    add.mutate(
      { productId: p.id, variantId: variant.id, qty: 1, silent: buyNow },
      { onSuccess: () => buyNow && navigate('/checkout') },
    );
  };

  const specs = [
    ...(p.purity ? [{ label: 'Metal', value: `${PURITIES[p.purity].name} (${PURITIES[p.purity].fineness})` }] : []),
    ...(variant?.netWeightMg ? [{ label: 'Net metal weight', value: formatGrams(variant.netWeightMg) }] : []),
    ...(variant?.grossWeightMg && variant.grossWeightMg !== variant.netWeightMg ? [{ label: 'Gross weight', value: formatGrams(variant.grossWeightMg) }] : []),
    ...p.specs.filter((s) => s.label !== 'Metal'),
    ...(variant?.sku ? [{ label: 'SKU', value: variant.sku }] : []),
  ];

  const purity = p.purity ? PURITIES[p.purity] : null;
  const stock = !variant
    ? null
    : !variant.inStock
      ? { label: 'Sold out', note: 'Ask us to make it', tone: 'text-danger' }
      : variant.lowStock
        ? { label: `Only ${variant.lowStock} left`, note: 'Ready to ship', tone: 'text-warn' }
        : { label: 'In stock', note: 'Ready to ship', tone: 'text-success' };
  const wa = settings?.store.whatsapp;
  const waLink = (opening: string) =>
    whatsappLink(wa!, `Hello! ${opening} "${p.name}"${variant?.label && p.variants.length > 1 ? ` (${variant.label})` : ''}: ${window.location.href}`);
  const ratePerGram = p.pricingMode === 'weight' ? variant?.price.ratePerGram : undefined;
  const sizeHelp = 'text-xs text-muted underline underline-offset-4 hover:text-ink';

  const wl = useWishlist();
  const saved = wl.has(p.id);
  const gstRate = ((settings?.gstRateBps ?? 300) / 100).toLocaleString('en-IN');
  const collection = p.collections[0];
  const badge = p.badges?.includes('bestseller') ? 'Bestseller' : p.badges?.includes('new') ? 'New arrival' : undefined;
  const price = variant?.price;
  const keyFacts: { icon: LucideIcon; label: string; value: string }[] = [
    ...(purity ? [{ icon: Gem, label: 'Purity', value: purity.label }] : []),
    ...(variant?.netWeightMg ? [{ icon: Scale, label: 'Net weight', value: formatGrams(variant.netWeightMg) }] : []),
    ...(price && price.mode === 'weight' ? [{ icon: Cog, label: 'Making charges', value: inr(price.making - price.makingDiscount) }] : []),
    ...(price && price.mode === 'fixed' ? [{ icon: Tag, label: 'Before GST', value: inr(price.taxable) }] : []),
    ...(price ? [{ icon: ReceiptIndianRupee, label: `GST (${gstRate}%)`, value: inr(price.gst) }] : []),
  ];

  // Promises shown under the buttons, each only when it holds for this piece.
  const hallmark = p.specs.find((s) => /hallmark|huid/i.test(s.label));
  const hallmarked = hallmark && !/no hallmark|not hallmark|^no\b|none|demo/i.test(hallmark.value);
  const freeAbove = settings?.shipping.freeAbove;
  const shipping =
    freeAbove === 0 || (freeAbove && price && price.total >= freeAbove)
      ? { title: 'Free shipping', text: settings?.shipping.nationwide ? 'Across India' : 'On this piece' }
      : freeAbove
        ? { title: `Free shipping over ${inr(freeAbove)}`, text: settings?.shipping.nationwide ? 'Across India' : 'Check your PIN code' }
        : null;
  const trust: { icon: LucideIcon; title: string; text: string }[] = [
    ...(hallmarked ? [{ icon: ShieldCheck, title: 'BIS hallmarked', text: hallmark.value }] : [{ icon: Lock, title: 'Price locked', text: 'When you order' }]),
    ...(shipping ? [{ icon: Truck, title: shipping.title, text: shipping.text }] : []),
    ...(settings?.store.whatsapp || settings?.store.phone ? [{ icon: Headset, title: 'Talk to us', text: 'Before or after you buy' }] : []),
  ];

  return (
    <PageFade>
      <Seo title={p.seo?.title ?? p.name} description={p.seo?.description ?? p.shortDescription} path={`/product/${p.slug}`} image={p.images[0] ? `/uploads/${p.images[0].key}-1600.webp` : undefined} />

      <div className="relative">
        <LotusMark className="pointer-events-none absolute -left-16 top-[28rem] hidden w-72 text-gold opacity-[0.08] lg:block" />

        <div className="container-page pb-5 pt-5 md:pb-6 md:pt-7">
          <Breadcrumbs items={crumbs} className="text-[0.8125rem]" />
        </div>

        <div className="container-page grid gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-14">
          {/* the gallery stays in view while the details scroll past it */}
          <div className="-mx-4 sm:mx-0 lg:col-span-6">
            <div className="lg:sticky lg:top-20">
              <Gallery images={p.images} name={p.name} badge={badge} />
            </div>
          </div>

          <div className="lg:col-span-6 lg:pt-1">
            {(collection || p.categoryPath.length > 0) && (
              <Link
                to={collection ? `/collections/${collection.slug}` : `/shop/${p.categoryPath[p.categoryPath.length - 1].slug}`}
                className="inline-flex rounded-full border border-gold/60 bg-gold-pale/30 px-3.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-2 transition-colors hover:border-gold hover:text-ink"
              >
                {collection ? `${collection.name} collection` : p.categoryPath[p.categoryPath.length - 1].name}
              </Link>
            )}
            <h1 className="mt-4 font-display text-[clamp(2.5rem,1.8rem+2.4vw,3.75rem)] font-semibold leading-[1.04] text-maroon">{p.name}</h1>
            <span aria-hidden className="mt-4 flex max-w-md items-center gap-2 text-gold">
              <span className="h-px flex-1 bg-gold/50" />
              <LotusMark className="w-8" />
              <span className="h-px flex-1 bg-gold/50" />
            </span>
            {p.ratingCount > 0 && (
              <a href="#reviews-title" className="mt-4 inline-flex items-center gap-2 text-xs text-muted hover:text-ink">
                <Stars value={p.ratingAvg} size={13} /> {p.ratingAvg.toFixed(1)} · {p.ratingCount} {p.ratingCount === 1 ? 'review' : 'reviews'}
              </a>
            )}
            {p.shortDescription && <p className="mt-4 max-w-lg text-[1.0625rem] leading-relaxed text-ink-2">{p.shortDescription}</p>}

            {/* price, beside the rate it was worked out from */}
            <div className="mt-6 grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <Price paise={variant?.price.total ?? 0} compareAt={variant?.compareAtPrice} className="font-display text-[2.75rem] font-semibold leading-none text-maroon" />
                <p className="mt-2 text-[0.9375rem] text-ink-2">Inclusive of all taxes</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  {stock && <span className={cn('font-semibold', stock.tone)}>{stock.label}</span>}
                  {stock && <span className="text-muted">{stock.note}</span>}
                  {p.makingDiscountPercent > 0 && (
                    <span className="rounded-full bg-success-bg px-2 py-0.5 font-semibold text-success">{p.makingDiscountPercent}% off making</span>
                  )}
                </p>
              </div>
              {ratePerGram && (
                <Link to="/gold-rate" className="group flex items-center gap-4 rounded-xl border border-gold/40 bg-gradient-to-br from-gold-pale/50 to-paper px-5 py-4 shadow-[0_14px_30px_-24px_rgba(122,87,22,.8)]">
                  <Coins className="size-10 shrink-0 text-gold" strokeWidth={1.2} aria-hidden />
                  <span>
                    <span className="block text-[0.9375rem] text-ink-2">Gold rate ({purityLabel(p.purity)})</span>
                    <span className="block font-display text-[1.625rem] font-semibold leading-tight text-maroon">{inr(ratePerGram)} / g</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-2">
                      <span aria-hidden className={cn('size-1.5 rounded-full', fresh.today ? 'bg-success' : 'bg-warn')} />
                      <span className="underline underline-offset-2 group-hover:text-ink">{fresh.label}</span>
                      <ArrowRight className="size-3" aria-hidden />
                    </span>
                  </span>
                </Link>
              )}
            </div>

            {/* key facts */}
            {keyFacts.length > 0 && (
              <dl className="mt-6 grid grid-cols-2 rounded-xl border border-gold/40 bg-paper shadow-[0_14px_30px_-26px_rgba(63,18,21,.5)] sm:grid-flow-col sm:auto-cols-fr sm:grid-cols-none">
                {keyFacts.map((f, i) => (
                  <div key={f.label} className={cn('flex flex-col items-center px-2 py-4 text-center', i > 0 && 'sm:border-l sm:border-line', i % 2 === 1 && 'border-l border-line', i > 1 && 'border-t border-line sm:border-t-0')}>
                    <f.icon className="size-7 text-gold" strokeWidth={1.2} aria-hidden />
                    <dt className="mt-1.5 text-[0.8125rem] text-ink-2">{f.label}</dt>
                    <dd className="font-display text-[1.25rem] font-semibold leading-tight text-ink">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {price && (
              <button type="button" onClick={() => showTab('breakdown')} className="mt-2 text-xs font-semibold text-ink underline decoration-gold underline-offset-4 hover:text-gold-deep">
                See the full price breakdown
              </button>
            )}

            {/* options */}
            {options.map((opt) => (
              <fieldset key={opt.name} className="mt-6">
                <legend className="mb-3 w-full">
                  <span className="flex items-baseline justify-between gap-4">
                    <span className="text-[0.8125rem] font-semibold text-ink">
                      {opt.name === 'Option' ? 'Choose' : opt.name}: <span className="font-normal text-muted">{selected[opt.name]}</span>
                    </span>
                    {opt.name.toLowerCase() === 'size' &&
                      (wa ? (
                        <a href={waLink('Could you help me choose a size for')} target="_blank" rel="noreferrer" className={sizeHelp}>
                          Not sure of your size?
                        </a>
                      ) : (
                        <button type="button" onClick={() => setEnquiry(true)} className={sizeHelp}>
                          Not sure of your size?
                        </button>
                      ))}
                  </span>
                </legend>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {opt.values.map((val) => {
                    const active = selected[opt.name] === val;
                    const available = isAvailable(opt.name, val);
                    const v = options.length === 1 ? variantFor(opt.name, val) : undefined;
                    const descId = `opt-${opt.name}-${val}`.replace(/[^a-z0-9-]/gi, '-');
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSelected((s) => ({ ...s, [opt.name]: val }))}
                        aria-pressed={active}
                        // The value is the button's name; weight and price describe it.
                        aria-label={available ? val : `${val} (sold out)`}
                        aria-describedby={v && v.price.total > 0 ? descId : undefined}
                        className={cn(
                          'flex min-h-14 flex-col items-center justify-center rounded-md border px-2 py-2 text-center transition-colors duration-300',
                          active ? 'border-maroon bg-maroon text-ivory' : 'border-line-strong/70 bg-paper text-ink hover:border-maroon',
                          !available && !active && 'opacity-55',
                        )}
                      >
                        <span className={cn('text-sm font-semibold', !available && 'line-through decoration-1')}>{val}</span>
                        {v && v.price.total > 0 && (
                          <span id={descId} className={cn('mt-0.5 text-2xs tabular', active ? 'text-ivory/75' : 'text-muted')}>
                            {v.netWeightMg ? `${formatGrams(v.netWeightMg)} · ` : ''}
                            {inr(v.price.total)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}

            {/* purchase */}
            <div ref={buyRef} className="mt-6 space-y-3">
              {canBuy ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => addToBag(false)}
                    disabled={add.isPending}
                    className="flex h-14 items-center justify-center gap-2.5 rounded-md bg-gradient-to-b from-maroon-2 to-maroon text-[0.875rem] font-bold uppercase tracking-[0.1em] text-ivory shadow-[0_12px_24px_-14px_rgba(63,18,21,.95)] transition-[filter] hover:brightness-110 disabled:opacity-70"
                  >
                    <ShoppingBag className="size-5" strokeWidth={1.6} aria-hidden />
                    {add.isPending && !add.variables?.silent ? 'Adding…' : 'Add to bag'}
                  </button>
                  <button
                    type="button"
                    onClick={() => addToBag(true)}
                    disabled={add.isPending}
                    className="flex h-14 items-center justify-center gap-2.5 rounded-md border-2 border-maroon text-[0.875rem] font-bold uppercase tracking-[0.1em] text-maroon transition-colors hover:bg-maroon hover:text-ivory disabled:opacity-70"
                  >
                    <Zap className="size-5" strokeWidth={1.6} aria-hidden />
                    {add.isPending && add.variables?.silent ? 'One moment…' : 'Buy now'}
                  </button>
                </div>
              ) : (
                <>
                  <Alert tone="neutral">
                    {variant && variant.price.total === 0
                      ? 'This piece is priced on request.'
                      : 'This piece is sold out right now. We often make pieces again to order — ask us and we’ll let you know.'}
                  </Alert>
                  <button
                    type="button"
                    onClick={() => setEnquiry(true)}
                    className="flex h-14 w-full items-center justify-center gap-2.5 rounded-md bg-maroon text-[0.875rem] font-bold uppercase tracking-[0.1em] text-ivory hover:bg-maroon-2"
                  >
                    Ask about this piece
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => wl.toggle(p.id, p.name)}
                aria-pressed={saved}
                aria-label={saved ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`}
                className="flex h-13 w-full items-center justify-center gap-2.5 rounded-md border border-maroon/60 bg-paper text-[0.875rem] font-bold uppercase tracking-[0.1em] text-maroon transition-colors hover:border-maroon"
              >
                <Heart className={cn('size-5', saved && 'fill-maroon')} strokeWidth={1.6} aria-hidden />
                {saved ? 'Saved to wishlist' : 'Add to wishlist'}
              </button>
            </div>

            {trust.length > 0 && (
              <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-0">
                {trust.map((t, i) => (
                  <li key={t.title} className={cn('flex items-center gap-3 sm:justify-center sm:px-3', i > 0 && 'sm:border-l sm:border-line')}>
                    <t.icon className="size-8 shrink-0 text-gold" strokeWidth={1.3} aria-hidden />
                    <span className="min-w-0 text-[0.8125rem] leading-snug text-ink-2">
                      <span className="block font-medium text-ink">{t.title}</span>
                      <span className="block">{t.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <HelpCard whatsappHref={wa ? waLink('I’m interested in') : undefined} onEnquire={() => setEnquiry(true)} />

            <div className="mt-5">
              <PincodeCheck />
            </div>
          </div>
        </div>

        <ProductTabs
          ref={tabsRef}
          tab={tab}
          onTab={setTab}
          product={p}
          price={price}
          specs={specs}
          returnDays={settings?.returnWindowDays}
          shippingNote={settings?.shipping.note}
        />
      </div>

      <div className="container-page mt-20 space-y-20 md:mt-28 md:space-y-28">
        <Related slug={p.slug} />
        <RecentlyViewed exclude={p.id} />
        <Reviews slug={p.slug} />
      </div>

      {/* Mobile sticky purchase bar. Rendered on <body>: inside PageFade's slide-in transform a fixed
          element pins to the sliding page rather than the screen, so it jumped about while the page faded in. */}
      {createPortal(
      <div
        inert={!showSticky}
        className={cn(
          'no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-16px_32px_-24px_rgba(30,24,19,.45)] backdrop-blur transition-transform duration-300 lg:hidden',
          showSticky ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="flex items-center gap-3">
          <div className="h-12 w-10 shrink-0 overflow-hidden rounded bg-sand">
            <Img image={p.images[0]} sizes="40px" width={480} className="size-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-semibold leading-tight text-ink">{p.name}</p>
            <p className="truncate text-xs text-muted">
              <Price paise={variant?.price.total ?? 0} className="font-semibold text-ink" />
              {p.variants.length > 1 && variant ? ` · ${variant.label}` : ''}
            </p>
          </div>
          {canBuy ? (
            <Button loading={add.isPending} onClick={() => addToBag(false)} className="!rounded-md !bg-maroon">
              Add to bag
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setEnquiry(true)}>
              Enquire
            </Button>
          )}
        </div>
      </div>,
        document.body,
      )}

      <ProductEnquiry open={enquiry} onOpenChange={setEnquiry} product={p} />
    </PageFade>
  );
}

/** "Have a question?" bar: opens WhatsApp when the store has a number, otherwise the enquiry form. */
function HelpCard({ whatsappHref, onEnquire }: { whatsappHref?: string; onEnquire: () => void }) {
  const card = 'group mt-5 flex w-full items-center gap-4 rounded-full border border-line bg-gradient-to-r from-[#eef5ec] to-paper px-3 py-2.5 text-left shadow-[0_10px_24px_-18px_rgba(31,92,63,.6)] transition-colors hover:border-[#25a35a]/50';
  const body = (
    <>
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-full text-white', whatsappHref ? 'bg-[#25a35a]' : 'bg-maroon')}>
        {whatsappHref ? <WhatsAppIcon className="size-5.5" /> : <MessageCircle className="size-5" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1 text-[0.9375rem] font-medium text-ink">
        {whatsappHref ? 'Have a question? Chat with us on WhatsApp' : 'Have a question? Send us a message'}
        <span className="block text-xs font-normal text-muted">More photos, a video or sizing help.</span>
      </span>
      <ArrowRight className="mr-2 size-4 shrink-0 text-ink-2 transition-transform group-hover:translate-x-1" aria-hidden />
    </>
  );
  return whatsappHref ? (
    <a href={whatsappHref} target="_blank" rel="noreferrer" className={card}>
      {body}
    </a>
  ) : (
    <button type="button" onClick={onEnquire} className={card}>
      {body}
    </button>
  );
}

/* --------------------------------------------------------------- tabs */

type TabKey = 'details' | 'breakdown' | 'specs' | 'delivery' | 'returns' | 'care';

/** Icons for the "about this piece" highlights, matched on the spec's label. */
const SPEC_ICONS: [RegExp, LucideIcon][] = [
  [/stone|gem|pearl|diamond/i, Gem],
  [/finish|enamel|polish|meenakari/i, Sparkles],
  [/craft|work|making|design|style/i, Crown],
];
const MEASURE = /metal|hallmark|huid|closure|length|width|height|size|weight|sku/i;

const ProductTabs = forwardRef<
  HTMLDivElement,
  {
    tab: TabKey;
    onTab: (t: TabKey) => void;
    product: ProductDetailDTO;
    price?: VariantDTO['price'];
    specs: { label: string; value: string }[];
    returnDays?: number;
    shippingNote?: string;
  }
>(function ProductTabs({ tab, onTab, product: p, price, specs, returnDays, shippingNote }, ref) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'details', label: 'Product details' },
    ...(price ? [{ key: 'breakdown' as const, label: 'Price breakdown' }] : []),
    { key: 'specs', label: 'Specifications' },
    { key: 'delivery', label: 'Delivery' },
    { key: 'returns', label: 'Returns & exchange' },
    { key: 'care', label: 'Care instructions' },
  ];
  const highlights = p.specs.filter((s) => !MEASURE.test(s.label)).slice(0, 3);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex((t) => t.key === tab);
    const next = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : -1;
    if (next < 0) return;
    e.preventDefault();
    onTab(tabs[next].key);
    document.getElementById(`tab-${tabs[next].key}`)?.focus();
  };
  const link = 'font-semibold text-ink underline decoration-gold underline-offset-4 hover:text-gold-deep';

  return (
    <section ref={ref} aria-label="About this piece" className="container-page mt-14 scroll-mt-24 md:mt-20">
      <div role="tablist" aria-label="Product information" onKeyDown={onKey} className="-mx-4 flex overflow-x-auto border-b border-gold/50 px-4 scrollbar-none sm:mx-0 sm:px-0">
        {tabs.map((t) => {
          const on = t.key === tab;
          return (
            <button
              key={t.key}
              id={`tab-${t.key}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`panel-${t.key}`}
              tabIndex={on ? 0 : -1}
              onClick={() => onTab(t.key)}
              className={cn(
                'relative shrink-0 whitespace-nowrap px-5 pb-3 pt-2 font-display text-[1.1875rem] transition-colors sm:px-7',
                on ? 'font-semibold text-maroon' : 'text-ink-2 hover:text-ink',
              )}
            >
              {t.label}
              {on && <span aria-hidden className="absolute inset-x-4 -bottom-px h-0.5 bg-maroon" />}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        tabIndex={0}
        className="rounded-b-xl border border-t-0 border-gold/30 bg-paper px-5 py-7 text-[0.9375rem] leading-relaxed text-ink-2 shadow-[0_24px_50px_-44px_rgba(63,18,21,.6)] sm:px-8"
      >
        {tab === 'details' && (
          <div className={cn('grid gap-8', highlights.length > 0 && 'lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]')}>
            <div>
              <h2 className="font-display text-[1.75rem] font-semibold text-maroon">About this piece</h2>
              <span aria-hidden className="mt-1.5 flex w-64 items-center gap-2 text-gold">
                <span className="h-px flex-1 bg-gold/50" />
                <LotusMark className="w-6" />
                <span className="h-px flex-[3] bg-gold/50" />
              </span>
              <div className="mt-4">
                {p.description ? <Markdown source={p.description} className="!text-[0.9375rem] !leading-relaxed" /> : <p>{p.shortDescription}</p>}
              </div>
            </div>
            {highlights.length > 0 && (
              <ul className={cn('grid gap-4 lg:border-l lg:border-line lg:pl-8', highlights.length === 3 ? 'sm:grid-cols-3' : highlights.length === 2 ? 'sm:grid-cols-2' : '')}>
                {highlights.map((h, i) => {
                  const Icon = SPEC_ICONS.find(([rx]) => rx.test(h.label) || rx.test(h.value))?.[1] ?? Star;
                  return (
                    <li key={h.label} className={cn('flex flex-col items-center px-2 text-center', i > 0 && 'sm:border-l sm:border-line')}>
                      <Icon className="size-9 text-gold" strokeWidth={1.2} aria-hidden />
                      <span className="mt-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-gold-deep">{h.label}</span>
                      <span className="mt-1 text-[0.9375rem] text-ink">{h.value}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {tab === 'breakdown' && price && (
          <div className="max-w-2xl">
            <PriceBreakdownTable price={price} making={p.making} />
            <p className="mt-4 text-xs text-muted">
              The price follows the gold rate and is locked when you place your order.{' '}
              <Link to="/journal/how-our-prices-are-calculated" className={link}>
                How we calculate prices
              </Link>
            </p>
          </div>
        )}

        {tab === 'specs' && (
          <dl className="max-w-2xl divide-y divide-line">
            {specs.map((s) => (
              <div key={s.label} className="grid grid-cols-[10rem_1fr] gap-4 py-2.5">
                <dt className="text-muted">{s.label}</dt>
                <dd className="text-ink">{s.value}</dd>
              </div>
            ))}
            <p className="pt-4 text-xs text-muted">
              Helpful guides:{' '}
              <Link to="/journal/choosing-gold-purity-24k-22k-18k" className={link}>
                choosing 24K, 22K or 18K
              </Link>
              {' · '}
              <Link to="/journal/how-to-read-a-bis-hallmark-and-huid" className={link}>
                reading a BIS hallmark
              </Link>
            </p>
          </dl>
        )}

        {tab === 'delivery' && (
          <div className="max-w-2xl space-y-3">
            <p>Use the PIN code check on this page for an estimated delivery date and whether cash on delivery is available.</p>
            {shippingNote && <p>{shippingNote}</p>}
            <p>
              Every order is packed securely and sent with tracking. Read our{' '}
              <Link to="/policies/shipping-policy" className={link}>
                shipping policy
              </Link>
              .
            </p>
          </div>
        )}

        {tab === 'returns' && (
          <div className="max-w-2xl space-y-3">
            <p>
              {returnDays
                ? `You can ask to return this piece within ${returnDays} days of delivery, subject to our returns policy.`
                : 'Returns and exchanges are handled under our returns policy.'}
            </p>
            <p>
              <Link to="/policies/returns-and-refunds" className={link}>
                Returns & refunds policy
              </Link>
              {' · '}
              <Link to="/policies/cancellation-policy" className={link}>
                Cancellations
              </Link>
            </p>
          </div>
        )}

        {tab === 'care' && (
          <div className="max-w-2xl space-y-3">
            <p>Put jewellery on after perfume and lotion, and take it off before bathing, swimming or exercise.</p>
            <p>Store each piece separately in a soft pouch. Clean plain gold gently with mild soap and lukewarm water; wipe enamel, kundan and pearls with a soft dry cloth only.</p>
            <p>
              <Link to="/journal/caring-for-gold-jewellery" className={link}>
                Read our care guide
              </Link>
            </p>
          </div>
        )}
      </div>
    </section>
  );
});

function Related({ slug }: { slug: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['related', slug],
    queryFn: () => api<ProductCardDTO[]>(`/products/${slug}/related`),
    staleTime: 60_000,
  });
  if (!isLoading && !data?.length) return null;
  return (
    <section aria-labelledby="related-title">
      <SectionHeading id="related-title" eyebrow="You may also like" title="Pieces that pair well" />
      <ProductRail products={data?.slice(0, 4)} loading={isLoading} />
    </section>
  );
}

function RecentlyViewed({ exclude }: { exclude: string }) {
  const ids = recentlyViewed.useIds().filter((id) => id !== exclude).slice(0, 4);
  const { data } = useProductsByIds(ids);
  if (!ids.length || !data?.length) return null;
  return (
    <section aria-labelledby="recent-title">
      <SectionHeading id="recent-title" eyebrow="Recently viewed" title="Still thinking about these?" />
      <ProductRail products={data} />
    </section>
  );
}

function ProductEnquiry({ open, onOpenChange, product }: { open: boolean; onOpenChange: (v: boolean) => void; product: ProductDetailDTO }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const send = useMutation({
    mutationFn: () =>
      api<{ message: string }>('/enquiries', {
        body: { type: 'product', productId: product.id, ...form, message: form.message || `I'd like to know about availability of ${product.name}.`, website: '' },
      }),
  });
  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const err = send.error as { fields?: Record<string, string> } | null;
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Ask about this piece" description={product.name}>
      {send.isSuccess ? (
        <Alert tone="success">{send.data.message}</Alert>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            send.mutate();
          }}
        >
          <Field label="Your name" error={err?.fields?.name}>
            <Input value={form.name} onChange={set('name')} autoComplete="name" required />
          </Field>
          <Field label="Mobile number" error={err?.fields?.phone} hint="We’ll call or WhatsApp you.">
            <Input value={form.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" />
          </Field>
          <Field label="Email" optional error={err?.fields?.email}>
            <Input value={form.email} onChange={set('email')} type="email" autoComplete="email" />
          </Field>
          <Field label="Message" optional>
            <Textarea value={form.message} onChange={set('message')} rows={3} placeholder="Size, occasion, or any questions" />
          </Field>
          <FormError>{send.isError ? errorMessage(send.error) : null}</FormError>
          <Button type="submit" block loading={send.isPending}>
            Send enquiry
          </Button>
        </form>
      )}
    </Modal>
  );
}

function ProductSkeleton() {
  return (
    <div className="container-page grid gap-10 py-10 lg:grid-cols-12">
      <Skeleton className="aspect-[4/5] w-full lg:col-span-7" />
      <div className="space-y-4 lg:col-span-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

