import { useMutation, useQueryClient } from '@tanstack/react-query';
import { m } from 'framer-motion';
import { ArrowRight, Check, CircleAlert, Clock, FileText, MapPin, Phone, ShoppingBag, Truck, XCircle } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import {
  ORDER_PROGRESS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  whatsappLink,
  type OrderDTO,
  type OrderStatus,
  type RazorpayCheckoutPayload,
} from '@goldshop/shared';
import { LotusMark } from '../components/AboutLegacy';
import { Seo } from '../components/Seo';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { Button, ButtonLink } from '../components/ui/Button';
import { Modal } from '../components/ui/Sheet';
import { Alert, EmptyState, Img, Skeleton } from '../components/ui/misc';
import { api, errorMessage } from '../lib/api';
import { useSettings } from '../lib/hooks';
import { openRazorpay } from '../lib/razorpay';
import { useOrder } from '../lib/orders';
import { guestOrderToken } from '../lib/storage';
import { cn, formatDate, formatDateTime, formatGrams, inr, purityLabel } from '../lib/utils';

/** What each step in the history means, when the team didn't add a note of their own. */
function historyText(status: OrderStatus, order: OrderDTO): string {
  switch (status) {
    case 'pending_payment':
      return 'Order placed. Waiting for payment.';
    case 'payment_review':
      return 'Payment received and being checked.';
    case 'confirmed':
      return order.payment.method === 'cod' ? `Order confirmed. Cash on delivery: please keep ${inr(order.pricing.total)} ready.` : 'Order confirmed.';
    case 'processing':
      return 'Your order is being prepared.';
    case 'shipped':
      return order.shipment?.carrier ? `Handed to ${order.shipment.carrier}.` : 'Handed to the courier.';
    case 'out_for_delivery':
      return 'Out with the courier for delivery.';
    case 'delivered':
      return 'Delivered.';
    case 'cancelled':
      return 'Order cancelled.';
    case 'returned':
      return 'Order returned.';
  }
}

function SectionTitle({ id, children, count }: { id: string; children: ReactNode; count?: number }) {
  return (
    <h2 id={id} className="flex items-center gap-4 font-display text-[1.875rem] font-semibold text-ink">
      <span className="shrink-0">
        {children}
        {count !== undefined && <span className="ml-2 font-sans text-base font-normal text-muted">({count})</span>}
      </span>
      <span aria-hidden className="h-px flex-1 bg-gold/40" />
    </h2>
  );
}

export default function OrderPage() {
  const { orderNumber } = useParams();
  const [sp] = useSearchParams();
  const token = sp.get('token') ?? (orderNumber ? guestOrderToken(orderNumber) : undefined);
  const placed = sp.get('placed') === '1';
  const { data: order, isLoading, error } = useOrder(orderNumber, token, placed);
  const { data: settings } = useSettings();
  const qc = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const pay = useMutation({
    mutationFn: async () => {
      const payload = await api<RazorpayCheckoutPayload>(`/orders/${orderNumber}/pay`, { body: { token } });
      const result = await openRazorpay(payload, { onFailed: (msg) => toast.error(msg) });
      if (!result) return null;
      return api<OrderDTO>('/payments/razorpay/verify', { body: { orderNumber, token, ...result } });
    },
    onSuccess: (o) => o && qc.setQueryData(['order', orderNumber, token], o),
    onError: (e) => toast.error(errorMessage(e)),
  });
  const cancel = useMutation({
    mutationFn: () => api<OrderDTO>(`/orders/${orderNumber}/cancel`, { body: { token } }),
    onSuccess: (o) => {
      qc.setQueryData(['order', orderNumber, token], o);
      setConfirmCancel(false);
      toast.success('Your order has been cancelled.');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (isLoading) {
    return (
      <div className="container-page max-w-4xl py-16">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }
  if (error || !order) {
    return (
      <div className="container-page py-16">
        <Seo title="Order" noindex />
        <EmptyState title="We couldn’t open this order" action={<ButtonLink to="/track-order">Track an order</ButtonLink>}>
          Use the link from your confirmation email, sign in to your account, or track it with your order number and email.
        </EmptyState>
      </div>
    );
  }

  const awaitingPayment = order.status === 'pending_payment';
  const cancelled = order.status === 'cancelled' || order.status === 'returned';
  const progressIndex = ORDER_PROGRESS.indexOf(order.status);
  const firstName = order.customer.name.split(' ')[0];
  const invoiceHref = `/orders/${order.orderNumber}/invoice${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  const history = [...order.statusHistory].reverse();
  const card = 'rounded-xl border border-line/70 bg-paper shadow-[0_18px_40px_-34px_rgba(63,18,21,.5)]';
  const a = order.shippingAddress;
  const heroImage = settings?.accountPage.image;

  return (
    <div className="relative overflow-hidden">
      <Seo title={`Order ${order.orderNumber}`} noindex />
      {heroImage && (
        <div aria-hidden className="absolute right-0 top-0 hidden h-[26rem] w-[40%] [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,black_55%),linear-gradient(to_top,transparent,black_45%)] lg:block">
          <Img image={heroImage} priority sizes="40vw" width={1600} className="size-full object-cover" />
        </div>
      )}
      <LotusMark className="pointer-events-none absolute -left-12 top-24 w-72 text-gold opacity-[0.08]" />

      <div className="container-page relative max-w-6xl pb-16 pt-10 md:pb-24 md:pt-12">
        <m.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
          <div
            className={cn(
              'mx-auto mb-5 grid size-16 place-items-center rounded-full',
              cancelled ? 'bg-sand text-muted' : awaitingPayment ? 'bg-warn-bg text-warn' : 'bg-success-bg text-success',
            )}
          >
            {cancelled ? <XCircle className="size-8" strokeWidth={1.5} /> : awaitingPayment ? <Clock className="size-8" strokeWidth={1.5} /> : <Check className="size-8" strokeWidth={2} />}
          </div>
          <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.22em] text-gold-deep">Order #{order.orderNumber}</p>
          <h1 className="mt-2 font-display text-[clamp(2.5rem,1.8rem+2.6vw,4.25rem)] font-semibold leading-[1.05] text-maroon">
            {order.status === 'returned'
              ? 'This order was returned'
              : order.status === 'cancelled'
                ? 'This order was cancelled'
                : awaitingPayment
                  ? 'Almost there'
                  : placed
                    ? `Thank you, ${firstName}`
                    : ORDER_STATUS_LABELS[order.status]}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[1rem] text-ink-2">
            {awaitingPayment
              ? 'Your order is reserved, but we haven’t received payment yet. Complete the payment to confirm it.'
              : cancelled
                ? 'If you paid online, any refund goes back to your original payment method.'
                : order.payment.method === 'cod' && order.payment.status !== 'paid'
                  ? `We’ve confirmed your order. Please keep ${inr(order.pricing.total)} ready to pay on delivery.`
                  : order.payment.status === 'paid'
                    ? `Payment received. A confirmation has been sent to ${order.customer.email}.`
                    : 'We’ll keep you updated as your order moves along.'}
          </p>
          {awaitingPayment && order.canPay && (
            <Button size="lg" className="mt-6" loading={pay.isPending} onClick={() => pay.mutate()}>
              Complete payment · {inr(order.pricing.total)}
            </Button>
          )}
          {awaitingPayment && !order.canPay && (
            <Alert tone="warn" className="mx-auto mt-6 max-w-lg">
              If money was deducted, your payment will be confirmed automatically within a few minutes. Otherwise this reservation will lapse.
            </Alert>
          )}
        </m.header>

        {!cancelled && !awaitingPayment && progressIndex >= 0 && (
          <ol className="mx-auto mt-10 grid max-w-3xl grid-cols-5" aria-label="Order progress">
            {ORDER_PROGRESS.map((s, i) => {
              const done = i <= progressIndex;
              return (
                <li key={s} className="relative flex flex-col items-center text-center" aria-current={i === progressIndex ? 'step' : undefined}>
                  {i > 0 && <span aria-hidden className={cn('absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2', done ? 'bg-gold' : 'bg-gold/30')} />}
                  <span
                    className={cn(
                      'relative grid size-7 place-items-center rounded-full',
                      done ? 'bg-gradient-to-b from-[#d9b872] to-[#a57a2c] text-white' : 'border-2 border-gold/60 bg-ivory',
                    )}
                  >
                    {done && <Check className="size-4" strokeWidth={2.5} />}
                  </span>
                  <span className={cn('mt-2 text-[0.6875rem] leading-tight sm:text-[0.8125rem]', i === progressIndex ? 'font-bold text-ink' : done ? 'text-ink' : 'text-muted')}>
                    {ORDER_STATUS_LABELS[s]}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        {order.shipment?.trackingNumber && (
          <div className={cn(card, 'mx-auto mt-8 flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 p-5 text-sm')}>
            <Truck className="size-6 shrink-0 text-gold" strokeWidth={1.4} aria-hidden />
            <p className="flex-1 font-semibold text-ink">
              Shipped with {order.shipment.carrier || 'our courier'} · Tracking number {order.shipment.trackingNumber}
            </p>
            {order.shipment.trackingUrl && (
              <a href={order.shipment.trackingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-gold-deep underline underline-offset-4">
                Track with the courier <ArrowRight className="size-4" aria-hidden />
              </a>
            )}
          </div>
        )}

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-12 lg:col-span-7 xl:col-span-8">
            <section aria-labelledby="items-title">
              <SectionTitle id="items-title" count={order.items.length}>
                Items
              </SectionTitle>
              <ul className="mt-5 space-y-3">
                {order.items.map((i) => (
                  <li key={`${i.sku}-${i.productId}`} className={cn(card, 'flex gap-4 p-3.5 sm:gap-5 sm:p-4')}>
                    <Link to={`/product/${i.slug}`} className="h-24 w-28 shrink-0 overflow-hidden rounded-lg bg-sand sm:h-28 sm:w-40">
                      <Img image={i.image} sizes="160px" width={480} className="size-full object-cover" />
                    </Link>
                    <div className="min-w-0 flex-1 py-0.5">
                      <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                        <Link to={`/product/${i.slug}`} className="font-display text-[1.25rem] font-semibold leading-snug text-ink hover:text-gold-deep sm:text-[1.375rem]">
                          {i.name}
                        </Link>
                        <p className="shrink-0 text-[1.0625rem] font-bold text-ink tabular">{inr(i.lineTotal)}</p>
                      </div>
                      <p className="mt-1 text-[0.8125rem] text-muted">SKU: {i.sku}</p>
                      <p className="text-[0.8125rem] text-muted">Ordered on {formatDate(order.createdAt)}</p>
                      <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[0.8125rem] text-ink-2">
                        {[purityLabel(i.purity), formatGrams(i.netWeightMg), i.variantLabel && !/^standard$/i.test(i.variantLabel) ? i.variantLabel : '', `Qty: ${i.qty}`]
                          .filter(Boolean)
                          .map((t, idx) => (
                            <span key={t} className="flex items-center gap-2">
                              {idx > 0 && <span aria-hidden className="size-1 rounded-full bg-subtle/60" />}
                              {t}
                            </span>
                          ))}
                      </p>
                      {i.breakdown.mode === 'weight' && i.breakdown.ratePerGram && (
                        <p className="mt-1 text-xs text-subtle">
                          Priced at {inr(i.breakdown.ratePerGram)}/g on {formatDate(order.createdAt)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="history-title">
              <SectionTitle id="history-title">History</SectionTitle>
              <ol className="mt-6">
                {history.map((h, idx) => (
                  <li key={idx} className="relative flex gap-4 pb-7 last:pb-0">
                    {idx < history.length - 1 && <span aria-hidden className="absolute left-[0.8125rem] top-7 h-[calc(100%-1.75rem)] w-px bg-gold/50" />}
                    <span
                      className={cn(
                        'relative mt-0.5 grid size-[1.625rem] shrink-0 place-items-center rounded-full',
                        idx === 0 ? 'bg-gradient-to-b from-[#d9b872] to-[#a57a2c] text-white' : 'border-2 border-gold/60 bg-ivory',
                      )}
                    >
                      {idx === 0 && <Check className="size-3.5" strokeWidth={2.5} aria-hidden />}
                    </span>
                    <div>
                      <p className="font-display text-[1.25rem] font-semibold leading-tight text-ink">{ORDER_STATUS_LABELS[h.status]}</p>
                      <p className="mt-0.5 text-[0.8125rem] text-muted">{formatDateTime(h.at)}</p>
                      <p className="mt-1 text-[0.9375rem] text-ink-2">{h.note || historyText(h.status, order)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="space-y-5 lg:col-span-5 xl:col-span-4" aria-label="Order details">
            <section aria-labelledby="summary-title" className={card}>
              <h2 id="summary-title" className="border-b border-line/70 px-6 py-4 font-display text-[1.5rem] font-semibold text-ink">
                Order summary
              </h2>
              <div className="px-6 py-5">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular">{inr(order.pricing.subtotal)}</dd></div>
                  {order.pricing.discount > 0 && (
                    <div className="flex justify-between"><dt className="text-muted">Discount{order.coupon ? ` (${order.coupon.code})` : ''}</dt><dd className="tabular text-success">− {inr(order.pricing.discount)}</dd></div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted">Delivery</dt>
                    <dd className={cn('tabular', !order.pricing.shipping && 'font-semibold text-success')}>{order.pricing.shipping ? inr(order.pricing.shipping) : 'Free'}</dd>
                  </div>
                  {order.pricing.codFee > 0 && <div className="flex justify-between"><dt className="text-muted">COD fee</dt><dd className="tabular">{inr(order.pricing.codFee)}</dd></div>}
                  <div className="flex items-baseline justify-between border-t border-line pt-3">
                    <dt className="font-display text-[1.25rem] font-semibold">Total</dt>
                    <dd className="font-display text-[1.75rem] font-bold text-maroon tabular">{inr(order.pricing.total)}</dd>
                  </div>
                  <p className="text-right text-xs text-muted">Inclusive of {inr(order.pricing.gstAmount)} GST</p>
                </dl>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
                  <span className="text-muted">Payment method</span>
                  <span className="flex items-center gap-2 whitespace-nowrap text-right">
                    {order.payment.method === 'cod' ? 'Cash on delivery' : 'Online'}
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.1em]',
                        order.payment.status === 'paid' ? 'bg-success-bg text-success' : order.payment.status === 'pending' ? 'bg-warn-bg text-warn' : 'bg-sand text-ink-2',
                      )}
                    >
                      {PAYMENT_STATUS_LABELS[order.payment.status]}
                    </span>
                  </span>
                </div>
                {order.invoiceNumber && !cancelled && (
                  <Link to={invoiceHref} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink underline decoration-gold underline-offset-4">
                    <FileText className="size-4 text-gold-deep" aria-hidden /> View & print invoice <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                )}
              </div>
            </section>

            <section aria-labelledby="ship-title" className={cn(card, 'p-6')}>
              <h2 id="ship-title" className="flex items-center gap-3 font-display text-[1.5rem] font-semibold text-ink">
                <MapPin className="size-5 text-gold-deep" strokeWidth={1.6} aria-hidden /> Delivering to
              </h2>
              <address className="mt-3 pl-8 text-[0.9375rem] not-italic leading-relaxed text-ink-2">
                <span className="font-semibold text-ink">{a.fullName}</span>
                <br />
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ''}
                <br />
                {a.landmark && (
                  <>
                    Near {a.landmark}
                    <br />
                  </>
                )}
                {a.city}, {a.state} {a.pincode}
                <br />
                India
                <span className="mt-2 flex items-center gap-2">
                  <Phone className="size-4 text-gold" strokeWidth={1.6} aria-hidden /> {a.phone}
                </span>
              </address>
            </section>

            <div className="space-y-3 px-1 text-[0.9375rem]">
              {settings?.store.whatsapp && (
                <a
                  href={whatsappLink(settings.store.whatsapp, `Hello! I have a question about my order ${order.orderNumber}.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 font-medium text-ink underline decoration-gold/60 underline-offset-4"
                >
                  <WhatsAppIcon className="size-5 text-[#25a35a]" /> Questions? Message us on WhatsApp <ArrowRight className="size-4" aria-hidden />
                </a>
              )}
              {order.canCancel && (
                <button type="button" onClick={() => setConfirmCancel(true)} className="flex items-center gap-3 text-muted underline underline-offset-4 hover:text-danger">
                  <CircleAlert className="size-5" aria-hidden /> Cancel this order
                </button>
              )}
              <Link to="/shop" className="flex items-center gap-3 font-medium text-ink underline decoration-gold/60 underline-offset-4">
                <ShoppingBag className="size-5 text-gold-deep" strokeWidth={1.5} aria-hidden /> Continue shopping <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <Modal
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this order?"
        description="The pieces will be released and can be bought by someone else."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmCancel(false)}>
              Keep order
            </Button>
            <Button variant="danger" loading={cancel.isPending} onClick={() => cancel.mutate()}>
              Yes, cancel
            </Button>
          </>
        }
      />
    </div>
  );
}
