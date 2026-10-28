import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Lock, LockKeyhole, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, Trash2, Truck, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import type { CartLineDTO, ProductCardDTO } from '@goldshop/shared';
import { FadeHero } from '../components/FadeHero';
import { Seo } from '../components/Seo';
import { CouponForm, Totals } from '../components/cart/Summary';
import { ProductRail } from '../components/product/ProductCard';
import { Suggestions } from '../components/product/Suggestions';
import { ButtonLink } from '../components/ui/Button';
import { PageFade } from '../components/ui/Motion';
import { Alert, EmptyState, Img, SectionHeading, Skeleton } from '../components/ui/misc';
import { api } from '../lib/api';
import { useCart, useCartActions, useMe, useSettings } from '../lib/hooks';
import { cn, formatGrams, inr, purityLabel } from '../lib/utils';

const isStandard = (label: string) => !label || /^(standard|default|one size)$/i.test(label);

function Line({ line: l }: { line: CartLineDTO }) {
  const { setQty, remove } = useCartActions();
  const meta = [l.purity ? `${purityLabel(l.purity)} Gold` : '', formatGrams(l.netWeightMg)].filter(Boolean);
  const step = 'grid size-11 place-items-center text-ink transition-colors hover:bg-sand disabled:opacity-30 disabled:hover:bg-transparent';
  return (
    <li className="flex gap-3 rounded-md border border-line bg-paper p-3 shadow-[0_14px_30px_-28px_rgba(63,18,21,.55)] sm:gap-6 sm:p-4">
      <Link to={`/product/${l.slug}`} className="size-24 shrink-0 overflow-hidden rounded-sm bg-sand sm:h-36 sm:w-48">
        <Img image={l.image} sizes="192px" width={480} className="size-full object-cover" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <Link to={`/product/${l.slug}`} className="font-display text-[1.25rem] font-semibold leading-snug text-ink hover:text-gold-deep sm:text-[1.5rem]">
              {l.name}
            </Link>
            <p className="mt-1 flex flex-wrap items-center gap-x-2.5 text-[0.9375rem] text-ink-2">
              {meta.map((m, i) => (
                <span key={m} className="flex items-center gap-2.5">
                  {i > 0 && <span aria-hidden className="h-3.5 w-px bg-line-strong" />}
                  {m}
                </span>
              ))}
            </p>
            {!isStandard(l.variantLabel) && <p className="text-[0.8125rem] text-muted">{l.variantLabel}</p>}
            {!l.unavailable && l.qty > 1 && <p className="text-[0.8125rem] text-muted tabular">{inr(l.unitPrice)} each</p>}
          </div>
          <p className="shrink-0 font-display text-[1.375rem] font-semibold text-ink tabular sm:text-[1.5rem]">{l.unavailable ? '—' : inr(l.lineTotal)}</p>
        </div>
        {l.issue && <p className={cn('mt-2 text-xs font-medium', l.unavailable ? 'text-danger' : 'text-warn')}>{l.issue}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-3">
          {l.unavailable ? (
            <span />
          ) : (
            <div role="group" aria-label="Quantity" className="flex items-center rounded-sm border border-line-strong/70 bg-white">
              <button type="button" className={step} onClick={() => setQty.mutate({ lineId: l.id, qty: l.qty - 1 })} disabled={l.qty <= 1 || setQty.isPending} aria-label="Decrease quantity">
                <Minus className="size-4" />
              </button>
              <span className="w-9 text-center text-base font-medium tabular" aria-live="polite">
                {l.qty}
              </span>
              <button type="button" className={step} onClick={() => setQty.mutate({ lineId: l.id, qty: l.qty + 1 })} disabled={l.qty >= l.maxQty || setQty.isPending} aria-label="Increase quantity">
                <Plus className="size-4" />
              </button>
            </div>
          )}
          <button type="button" onClick={() => remove.mutate(l.id)} className="inline-flex items-center gap-2 text-[0.9375rem] text-gold-deep transition-colors hover:text-danger">
            <Trash2 className="size-4.5" strokeWidth={1.5} aria-hidden /> Remove
          </button>
        </div>
      </div>
    </li>
  );
}

export default function CartPage() {
  const { data: cart, isLoading } = useCart();
  const { data: settings } = useSettings();
  const { user } = useMe();
  const firstSlug = cart?.lines.find((l) => !l.unavailable)?.slug;
  const { data: suggestions } = useQuery({
    queryKey: ['related', firstSlug],
    queryFn: () => api<ProductCardDTO[]>(`/products/${firstSlug}/related`),
    enabled: Boolean(firstSlug),
    staleTime: 60_000,
  });
  const inCart = new Set(cart?.lines.map((l) => l.productId));
  const crossSell = suggestions?.filter((p) => !inCart.has(p.id)).slice(0, 4);
  const pieces = cart?.lines.reduce((n, l) => n + l.qty, 0) ?? 0;

  // Delivery depends on the PIN code, entered at checkout; say only what's already certain.
  const freeAbove = settings?.shipping.freeAbove;
  const delivery =
    cart && (freeAbove === 0 || (freeAbove && cart.subtotal >= freeAbove))
      ? { value: 'Free', free: true, note: 'Free delivery on this order, subject to your PIN code.' }
      : { value: <span className="text-sm text-muted">At checkout</span>, note: freeAbove ? `Free delivery on orders above ${inr(freeAbove)}.` : 'Delivery for your PIN code is shown at checkout.' };
  const blocked = Boolean(cart?.issues.length);
  const guestOk = settings?.guestCheckout !== false;
  const trust: { icon: LucideIcon; title: string; text: string; to?: string }[] = [
    { icon: Lock, title: 'Price locked at order', text: 'At the gold rate when you order' },
    { icon: ShieldCheck, title: 'Secure checkout', text: settings?.payments.razorpay ? 'Card details never reach us' : 'Pay when it arrives' },
    { icon: Truck, title: 'Tracked delivery', text: settings?.shipping.nationwide ? 'Across India' : 'To your door' },
    { icon: PackageCheck, title: settings?.returnWindowDays ? `${settings.returnWindowDays}-day returns` : 'Returns', text: 'See our returns policy', to: '/policies/returns-and-refunds' },
  ];

  return (
    <PageFade>
      <Seo title="Your bag" noindex />
      <FadeHero
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Bag' }]}
        eyebrow="Shopping bag"
        title="Your bag"
        subtitle={
          pieces > 0
            ? `${pieces} ${pieces === 1 ? 'piece' : 'pieces'} · Prices follow today’s gold rate until you place your order, then they’re locked.`
            : 'Pieces you add will appear here, priced at today’s gold rate.'
        }
        image={settings?.accountPage.image}
      />

      <div className="container-page py-10 md:py-12">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : !cart || cart.lines.length === 0 ? (
          <>
            <EmptyState
              title="Your bag is empty"
              icon={<ShoppingBag className="size-6" strokeWidth={1.5} />}
              className="py-8"
              action={
                <>
                  <ButtonLink to="/shop">Explore jewellery</ButtonLink>
                  <ButtonLink to="/wishlist" variant="secondary">
                    View wishlist
                  </ButtonLink>
                </>
              }
            >
              Browse new arrivals below, or pick up where you left off in your wishlist.
            </EmptyState>
            <Suggestions className="mt-12" />
          </>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-12 lg:gap-8">
            <section className="lg:col-span-7 xl:col-span-8" aria-label="Items">
              {cart.issues.map((i) => (
                <Alert key={i} tone="warn" className="mb-4">
                  {i}
                </Alert>
              ))}
              <ul className="space-y-3">
                {cart.lines.map((l) => (
                  <Line key={l.id} line={l} />
                ))}
              </ul>
              <Link to="/shop" className="mt-6 inline-flex items-center gap-2.5 text-[0.8125rem] font-semibold uppercase tracking-[0.18em] text-ink underline decoration-gold underline-offset-[8px] hover:text-gold-deep">
                <ArrowLeft className="size-4" aria-hidden /> Continue shopping
              </Link>
            </section>

            <aside className="lg:col-span-5 xl:col-span-4" aria-label="Order summary">
              <div className="rounded-md border border-line bg-paper p-6 shadow-[0_24px_50px_-40px_rgba(63,18,21,.55)] lg:sticky lg:top-20 lg:p-7">
                <h2 className="font-display text-[1.875rem] font-semibold text-ink">Summary</h2>
                <div className="mt-4">
                  <CouponForm cart={cart} />
                </div>
                <div className="mt-4">
                  <Totals cart={cart} delivery={delivery} />
                </div>

                <Link
                  to={!user && !guestOk ? '/login?next=/checkout' : '/checkout'}
                  aria-disabled={blocked || undefined}
                  className={cn(
                    'mt-6 flex h-14 items-center justify-center gap-3 rounded-sm bg-gradient-to-b from-maroon-2 to-maroon text-[0.875rem] font-bold uppercase tracking-[0.16em] text-ivory shadow-[0_12px_24px_-14px_rgba(63,18,21,.95)] transition-[filter] hover:brightness-110',
                    blocked && 'pointer-events-none opacity-50',
                  )}
                >
                  <LockKeyhole className="size-5" strokeWidth={1.6} aria-hidden /> Proceed to checkout <ArrowRight className="size-4" aria-hidden />
                </Link>
                {!user && (
                  <>
                    <span aria-hidden className="my-3 flex items-center gap-3 text-xs text-muted">
                      <span className="h-px flex-1 bg-line" />
                      OR
                      <span className="h-px flex-1 bg-line" />
                    </span>
                    <Link
                      to="/login?next=/checkout"
                      className="flex h-12 items-center justify-center gap-2 rounded-sm border border-maroon/60 text-[0.9375rem] font-medium text-maroon transition-colors hover:bg-maroon hover:text-ivory"
                    >
                      Sign in for a faster checkout <ArrowRight className="size-4" aria-hidden />
                    </Link>
                    {guestOk && <p className="mt-2 text-center text-xs text-muted">No account needed — you can check out as a guest.</p>}
                  </>
                )}

                <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-line pt-5">
                  {trust.map((t, i) => (
                    <li key={t.title} className={cn('flex gap-3', i % 2 === 1 && 'border-l border-line pl-4')}>
                      <t.icon className="mt-0.5 size-7 shrink-0 text-gold" strokeWidth={1.2} aria-hidden />
                      <span className="min-w-0 text-[0.8125rem] leading-snug">
                        <span className="block font-medium text-ink">{t.title}</span>
                        {t.to ? (
                          <Link to={t.to} className="text-muted underline underline-offset-2 hover:text-ink">
                            {t.text}
                          </Link>
                        ) : (
                          <span className="text-muted">{t.text}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        )}

        {crossSell && crossSell.length > 0 && (
          <section className="mt-24" aria-labelledby="xs-title">
            <SectionHeading id="xs-title" eyebrow="Complete the look" title="You might also like" />
            <ProductRail products={crossSell} />
          </section>
        )}
      </div>
    </PageFade>
  );
}
