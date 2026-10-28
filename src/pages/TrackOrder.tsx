import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Check, ClipboardList, Clock, Headset, Lightbulb, Search, Truck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ORDER_PROGRESS, ORDER_STATUS_LABELS, type ImageRef, type OrderStatus } from '@goldshop/shared';
import { LotusMark } from '../components/AboutLegacy';
import { FadeHero } from '../components/FadeHero';
import { Seo } from '../components/Seo';
import { Field, FormError, Input } from '../components/ui/Form';
import { PageFade } from '../components/ui/Motion';
import { Img } from '../components/ui/misc';
import { api, errorMessage } from '../lib/api';
import { useSettings } from '../lib/hooks';
import { guestOrders } from '../lib/storage';
import { cn, formatDateTime, inr } from '../lib/utils';

interface Tracked {
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; at: string; note?: string }[];
  shipment?: { carrier?: string; trackingNumber?: string; trackingUrl?: string };
  items: { name: string; variantLabel: string; qty: number; image?: ImageRef; slug: string }[];
  total: number;
  city: string;
}

/** What each stage means, in the order shown on the page. */
const STAGE_TEXT: Partial<Record<OrderStatus, string>> = {
  confirmed: 'We’ve received your order.',
  processing: 'Your jewellery is being prepared and checked.',
  shipped: 'Your order is with the courier.',
  out_for_delivery: 'It’s out for delivery with the courier.',
  delivered: 'Your order has been delivered.',
};

/** A gold hairline with a small lotus in the middle, used as a section divider. */
function LotusRule({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('flex items-center gap-2 text-gold', className)}>
      <span className="h-px flex-1 bg-gold/50" />
      <LotusMark className="w-8" />
      <span className="h-px flex-1 bg-gold/50" />
    </span>
  );
}

const card = 'rounded-xl border border-gold/40 bg-paper shadow-[0_24px_50px_-40px_rgba(63,18,21,.5)]';
const label = 'flex items-center gap-2.5 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-gold-deep';

export default function TrackOrder() {
  const [sp] = useSearchParams();
  const { data: s } = useSettings();
  const [orderNumber, setOrderNumber] = useState(sp.get('order') ?? '');
  const [contact, setContact] = useState('');
  const track = useMutation({ mutationFn: () => api<Tracked>('/orders/track', { body: { orderNumber, contact } }) });
  const t = track.data;
  const recent = guestOrders();
  const idx = t ? ORDER_PROGRESS.indexOf(t.status) : -1;

  return (
    <PageFade>
      <Seo title="Track your order" path="/track-order" />
      <FadeHero
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Track order' }]}
        eyebrow="Order tracking"
        title={
          <>
            Track your <em className="font-medium italic text-gold-deep">order</em>
          </>
        }
        subtitle="Enter your order number and the email or mobile number you used at checkout."
        image={s?.helpPage.image}
      />

      <div className="container-page grid gap-8 pb-16 pt-10 md:pb-24 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <div className="relative">
            <span aria-hidden className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 bg-ivory px-2 text-gold">
              <LotusMark className="w-9" />
            </span>
            <form
              className={cn(card, 'grid gap-5 p-6 sm:grid-cols-2 md:p-8')}
              onSubmit={(e) => {
                e.preventDefault();
                track.mutate();
              }}
            >
              <Field
                label={
                  <span className={label}>
                    <ClipboardList className="size-5" strokeWidth={1.4} aria-hidden /> Order number
                  </span>
                }
              >
                <Input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. PN261017-AU82"
                  required
                  autoCapitalize="characters"
                  className="h-14 !rounded-md bg-white"
                />
              </Field>
              <Field
                label={
                  <span className={label}>
                    <UserRound className="size-5" strokeWidth={1.4} aria-hidden /> Email or mobile
                  </span>
                }
              >
                <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Enter your email or mobile number" required autoComplete="email" className="h-14 !rounded-md bg-white" />
              </Field>
              <button
                type="submit"
                disabled={track.isPending}
                className="flex h-14 items-center justify-center gap-3 rounded-md bg-gradient-to-b from-maroon-2 to-maroon text-[0.875rem] font-bold uppercase tracking-[0.2em] text-ivory shadow-[0_14px_28px_-16px_rgba(63,18,21,.95)] transition-[filter] hover:brightness-110 disabled:opacity-70 sm:col-span-2"
              >
                <Search className="size-5" strokeWidth={1.8} aria-hidden />
                {track.isPending ? 'Looking up…' : 'Track order'}
              </button>
              <div className="sm:col-span-2 empty:hidden">
                <FormError>{track.isError ? errorMessage(track.error) : null}</FormError>
              </div>
            </form>
          </div>

          {t && (
            <section className={cn(card, 'mt-8 p-6 md:p-8')} aria-live="polite">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-display text-[2rem] font-semibold leading-tight text-maroon">{ORDER_STATUS_LABELS[t.status]}</h2>
                <p className="text-sm text-muted">
                  {t.orderNumber} · {inr(t.total)} · to {t.city}
                </p>
              </div>
              {idx >= 0 && (
                <ol className="mt-8 grid grid-cols-5">
                  {ORDER_PROGRESS.map((st, i) => (
                    <li key={st} className="relative flex flex-col items-center text-center">
                      {i > 0 && <span aria-hidden className={cn('absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2', i <= idx ? 'bg-gold' : 'bg-gold/25')} />}
                      <span className={cn('relative grid size-7 place-items-center rounded-full', i <= idx ? 'bg-gradient-to-b from-[#d9b872] to-[#a57a2c] text-white' : 'border-2 border-gold/50 bg-paper')}>
                        {i <= idx && <Check className="size-4" strokeWidth={2.5} />}
                      </span>
                      <span className={cn('mt-2 text-[0.6875rem] leading-tight sm:text-xs', i === idx ? 'font-bold text-ink' : 'text-ink-2')}>{ORDER_STATUS_LABELS[st]}</span>
                    </li>
                  ))}
                </ol>
              )}
              {t.shipment?.trackingNumber && (
                <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <Truck className="size-5 text-gold" strokeWidth={1.4} aria-hidden />
                  {t.shipment.carrier} · {t.shipment.trackingNumber}
                  {t.shipment.trackingUrl && (
                    <a className="font-semibold text-gold-deep underline underline-offset-4" href={t.shipment.trackingUrl} target="_blank" rel="noreferrer">
                      Track with the courier
                    </a>
                  )}
                </p>
              )}
              <ul className="mt-6 space-y-3">
                {t.items.map((i, k) => (
                  <li key={k} className="flex items-center gap-3 text-[0.9375rem]">
                    <span className="size-14 shrink-0 overflow-hidden rounded-md bg-sand">
                      <Img image={i.image} sizes="56px" width={480} className="size-full object-cover" />
                    </span>
                    <span>
                      <span className="font-display text-[1.125rem] font-semibold text-ink">{i.name}</span>
                      <span className="text-muted">
                        {i.variantLabel && !/^standard$/i.test(i.variantLabel) ? ` · ${i.variantLabel}` : ''} · Qty {i.qty}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <ol className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
                {[...t.statusHistory].reverse().map((h, k) => (
                  <li key={k}>
                    <span className="font-semibold">{ORDER_STATUS_LABELS[h.status]}</span> <span className="text-muted">· {formatDateTime(h.at)}</span>
                    {h.note && <span className="block text-xs text-muted">{h.note}</span>}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {recent.length > 0 && !t && (
            <div className="mt-10">
              <LotusRule />
              <h2 className="mt-6 flex items-center gap-3 font-display text-[1.625rem] font-semibold text-ink">
                <Clock className="size-7 text-gold" strokeWidth={1.4} aria-hidden /> Orders placed on this device
              </h2>
              <ul className="mt-3 space-y-2 pl-10">
                {recent.map((o) => (
                  <li key={o.orderNumber}>
                    <Link
                      to={`/orders/${o.orderNumber}?token=${encodeURIComponent(o.token)}`}
                      className="inline-flex items-center gap-2 text-[1.0625rem] text-gold-deep underline decoration-gold/60 underline-offset-4 hover:text-maroon"
                    >
                      {o.orderNumber} <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="space-y-5 lg:col-span-5">
          <div className={cn(card, 'relative overflow-hidden p-6')}>
            <LotusMark className="pointer-events-none absolute -bottom-6 -right-6 w-28 text-gold opacity-[0.12]" />
            <p className={label}>
              <Lightbulb className="size-5" strokeWidth={1.4} aria-hidden /> Where to find your order number
            </p>
            <p className="relative mt-3 pl-7 text-[0.9375rem] leading-relaxed text-ink-2">
              It’s shown on the confirmation page right after checkout, in the order emails we send you, and in your account under My Orders. Signed in?{' '}
              <Link to="/account" className="inline-flex items-center gap-1 font-semibold text-ink underline decoration-gold underline-offset-4">
                See all your orders <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </p>
          </div>
          <div className={cn(card, 'relative overflow-hidden p-6')}>
            <LotusMark className="pointer-events-none absolute -bottom-8 -right-8 w-40 text-gold opacity-[0.12]" />
            <p className={label}>
              <Truck className="size-5" strokeWidth={1.4} aria-hidden /> How your order moves
            </p>
            <ol className="relative mt-5">
              {ORDER_PROGRESS.map((st, i) => (
                <li key={st} className="relative flex gap-4 pb-5 last:pb-0">
                  {i < ORDER_PROGRESS.length - 1 && <span aria-hidden className="absolute left-[0.9375rem] top-8 h-[calc(100%-2rem)] border-l border-dashed border-gold/60" />}
                  <span
                    className={cn(
                      'relative grid size-[1.875rem] shrink-0 place-items-center rounded-full text-sm font-semibold',
                      i === 0 ? 'bg-gradient-to-b from-[#d9b872] to-[#a57a2c] text-white' : 'border-2 border-gold/60 bg-paper text-gold-deep',
                    )}
                  >
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-display text-[1.1875rem] font-semibold leading-tight text-ink">{ORDER_STATUS_LABELS[st]}</span>
                    <span className="block text-sm text-ink-2">{STAGE_TEXT[st]}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <p className="flex items-center gap-3 text-[0.9375rem] text-ink-2">
            <Headset className="size-6 shrink-0 text-gold" strokeWidth={1.4} aria-hidden />
            <span>
              Something not right?{' '}
              <Link to="/contact" className="font-semibold text-ink underline decoration-gold underline-offset-4">
                Contact us
              </Link>{' '}
              with your order number and we’ll help.
            </span>
          </p>
        </aside>
      </div>
    </PageFade>
  );
}
