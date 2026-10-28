import { ArrowLeft, CreditCard, IndianRupee, Printer, Truck, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { PURITIES } from '@goldshop/shared';
import { LotusMark } from '../components/AboutLegacy';
import { Seo } from '../components/Seo';
import { EmptyState, Img } from '../components/ui/misc';
import { useSettings } from '../lib/hooks';
import { guestOrderToken } from '../lib/storage';
import { amountInWords, cn, formatDate, formatGrams, inr } from '../lib/utils';
import { useOrder } from '../lib/orders';

/** Small gold corner flourish for the receipt's frame. */
function Corner({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('absolute size-6 text-gold', className)} fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M1 23V9a8 8 0 0 1 8-8h14" />
      <path d="M5 23V11a6 6 0 0 1 6-6h12" opacity=".5" />
    </svg>
  );
}

function PartyHeading({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 font-display text-[1rem] font-semibold uppercase tracking-[0.08em] text-gold-deep">
      {icon}
      {children}
    </h2>
  );
}

/**
 * Printable invoice. It is titled a "Tax invoice" only when the store has a GSTIN configured;
 * otherwise it is an order receipt. Tax figures are derived from the GST-inclusive order total.
 */
export default function Invoice() {
  const { orderNumber } = useParams();
  const [sp] = useSearchParams();
  const token = sp.get('token') ?? (orderNumber ? guestOrderToken(orderNumber) : undefined);
  const { data: o, isLoading, error } = useOrder(orderNumber, token);
  const { data: s } = useSettings();

  if (isLoading || !s) return <div className="p-10 text-sm text-muted">Loading invoice…</div>;
  if (error || !o || !o.invoiceNumber) {
    return (
      <div className="p-10">
        <EmptyState title="Invoice not available" action={<Link to="/track-order" className="underline">Find your order</Link>}>
          The invoice is issued once an order is confirmed.
        </EmptyState>
      </div>
    );
  }

  // Prefer the seller details captured when the order was placed; fall back to current settings for older orders.
  const seller = o.seller ?? {
    name: s.store.name,
    legalName: s.store.legalName ?? '',
    gstin: s.store.gstin ?? '',
    phone: s.store.phone ?? '',
    email: s.store.email ?? '',
    hsnCode: '7113',
    address: { line2: '', ...(s.store.address ?? { line1: '', city: '', state: '', pincode: '' }) },
  };
  const isTax = Boolean(seller.gstin);
  const a = seller.address?.line1 ? seller.address : undefined;
  const rate = o.pricing.gstRateBps / 100;
  const intra = o.pricing.igst === 0;
  const ship = o.shippingAddress;
  const meta: [string, string][] = [
    ['Invoice no.', o.invoiceNumber],
    ['Date', formatDate(o.statusHistory.find((h) => h.status === 'confirmed')?.at ?? o.createdAt)],
    ['Order no.', o.orderNumber],
    ['Place of supply', ship.state],
  ];
  const th = 'whitespace-nowrap px-3 py-3 font-semibold';
  const td = 'whitespace-nowrap px-3 py-3.5 align-top tabular';

  return (
    <div className="min-h-dvh bg-ivory py-6 [-webkit-print-color-adjust:exact] [print-color-adjust:exact] print:bg-white print:py-0">
      <Seo title={`Invoice ${o.invoiceNumber}`} noindex />
      <div className="no-print mx-auto mb-5 flex max-w-5xl items-center justify-between px-4">
        <Link to={`/orders/${o.orderNumber}${token ? `?token=${encodeURIComponent(token)}` : ''}`} className="inline-flex items-center gap-2 text-[0.9375rem] text-maroon hover:underline">
          <ArrowLeft className="size-4" aria-hidden /> Back to order
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-11 items-center gap-2.5 rounded-lg bg-maroon px-5 text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-ivory shadow-[0_10px_20px_-12px_rgba(63,18,21,.9)] hover:bg-maroon-2"
        >
          <Printer className="size-4.5" aria-hidden /> Print / Save PDF
        </button>
      </div>

      <article className="relative mx-auto max-w-5xl rounded-md border border-gold/70 bg-paper px-5 py-7 text-[13px] leading-relaxed text-ink shadow-[0_30px_60px_-40px_rgba(63,18,21,.5)] sm:px-10 sm:py-9 print:max-w-none print:shadow-none">
        <span aria-hidden className="pointer-events-none absolute inset-1.5 rounded-sm border border-gold/25" />
        <Corner className="left-1 top-1" />
        <Corner className="right-1 top-1 rotate-90" />
        <Corner className="bottom-1 right-1 rotate-180" />
        <Corner className="bottom-1 left-1 -rotate-90" />

        <header className="relative grid gap-6 border-b border-gold/60 pb-6 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex flex-col items-center text-center sm:border-r sm:border-gold/50 sm:pr-8">
            {s.brand.logo ? (
              <Img image={s.brand.logo} priority sizes="320px" width={960} alt={seller.name} className="h-28 w-auto" />
            ) : (
              <>
            <LotusMark className="w-14 text-gold" />
            <p className="mt-2 whitespace-nowrap font-display text-[clamp(1.5rem,1rem+2vw,2.5rem)] font-semibold uppercase leading-none tracking-[0.24em] [margin-right:-0.24em]">{seller.name}</p>
            {s.store.tagline && (
              <p className="mt-3 flex items-center gap-3 text-[0.6875rem] uppercase tracking-[0.12em] text-gold-deep">
                <span aria-hidden className="h-px w-10 bg-gold/60" />
                {s.store.tagline}
                <span aria-hidden className="h-px w-10 bg-gold/60" />
              </p>
            )}
              </>
            )}
            {/* The seller's legal details belong on every invoice. */}
            <div className="mt-3 text-[11px] leading-snug text-muted">
              {seller.legalName && seller.legalName !== seller.name && <p className="font-semibold text-ink-2">{seller.legalName}</p>}
              {a && (
                <p>
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.pincode}
                </p>
              )}
              <p>{[seller.phone && `Phone ${seller.phone}`, seller.email].filter(Boolean).join(' · ')}</p>
              {isTax && <p className="font-semibold text-ink">GSTIN {seller.gstin}</p>}
            </div>
          </div>
          <div className="sm:min-w-[19rem]">
            <h1 className="text-center font-display text-[clamp(1.75rem,1.2rem+1.6vw,2.5rem)] font-semibold uppercase tracking-[0.12em] text-maroon sm:text-right">{isTax ? 'Tax invoice' : 'Order receipt'}</h1>
            <span aria-hidden className="mx-auto mt-2 flex w-48 items-center gap-1 sm:mr-0">
              <span className="h-px flex-1 bg-gold/60" />
              <span className="size-1.5 rotate-45 bg-gold" />
              <span className="h-px flex-1 bg-gold/60" />
            </span>
            <dl className="mt-3 grid grid-cols-[auto_auto] justify-center gap-x-3 gap-y-0.5 text-[0.9375rem] sm:justify-end">
              {meta.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-right font-display italic text-ink-2">{k} :</dt>
                  <dd className="text-maroon">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </header>

        <section className="relative grid gap-6 border-b border-gold/40 py-5 sm:grid-cols-2">
          <div>
            <PartyHeading icon={<UserRound className="size-4.5" strokeWidth={2} aria-hidden />}>Billed to</PartyHeading>
            <p className="mt-1.5 font-display text-[1.25rem] font-semibold text-maroon">{o.customer.name}</p>
            <p className="text-[0.875rem] text-ink-2">{o.customer.email}</p>
            <p className="text-[0.875rem] text-ink-2">{o.customer.phone}</p>
            {o.gstin && <p className="font-semibold">GSTIN: {o.gstin}</p>}
          </div>
          <div className="sm:border-l sm:border-gold/40 sm:pl-8">
            <PartyHeading icon={<Truck className="size-4.5" strokeWidth={2} aria-hidden />}>Shipped to</PartyHeading>
            <p className="mt-1.5 font-display text-[1.25rem] font-semibold text-maroon">{ship.fullName}</p>
            <p className="text-[0.875rem] text-ink-2">
              {ship.line1}
              {ship.line2 ? `, ${ship.line2}` : ''}, {ship.city}, {ship.state} {ship.pincode}
            </p>
          </div>
        </section>

        <div className="relative mt-5 overflow-x-auto rounded-md border border-gold/40">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <thead>
              <tr className="bg-maroon text-[11px] uppercase tracking-[0.08em] text-ivory">
                <th className={th}>#</th>
                <th className={th}>Item</th>
                <th className={th}>HSN</th>
                <th className={cn(th, 'text-right')}>Net wt</th>
                <th className={cn(th, 'text-right')}>Rate/g</th>
                <th className={cn(th, 'text-right')}>Metal value</th>
                <th className={cn(th, 'text-right')}>Making</th>
                <th className={cn(th, 'text-right')}>Stones</th>
                <th className={cn(th, 'text-right')}>Qty</th>
                <th className={cn(th, 'text-right')}>Amount*</th>
              </tr>
            </thead>
            <tbody>
              {o.items.map((i, idx) => (
                <tr key={idx} className="border-t border-gold/25 bg-white/60 first:border-t-0">
                  <td className={td}>{idx + 1}</td>
                  <td className={cn(td, 'whitespace-normal font-sans')}>
                    <span className="font-display text-[1rem] font-semibold text-maroon">{i.name}</span>
                    {i.variantLabel && !/^standard$/i.test(i.variantLabel) ? <span className="text-ink-2"> ({i.variantLabel})</span> : null}
                    <span className="block text-[11px] text-muted">
                      {i.purity ? `${PURITIES[i.purity].name} · ` : ''}SKU {i.sku}
                    </span>
                  </td>
                  <td className={td}>{seller.hsnCode || '7113'}</td>
                  <td className={cn(td, 'text-right')}>{formatGrams(i.netWeightMg) || '—'}</td>
                  <td className={cn(td, 'text-right')}>{i.breakdown.ratePerGram ? inr(i.breakdown.ratePerGram) : '—'}</td>
                  <td className={cn(td, 'text-right')}>{i.breakdown.metalValue ? inr(i.breakdown.metalValue) : '—'}</td>
                  <td className={cn(td, 'text-right')}>{i.breakdown.making ? inr(i.breakdown.making - i.breakdown.makingDiscount) : '—'}</td>
                  <td className={cn(td, 'text-right')}>{i.breakdown.stone ? inr(i.breakdown.stone) : '—'}</td>
                  <td className={cn(td, 'text-right')}>{i.qty}</td>
                  <td className={cn(td, 'text-right text-[0.9375rem] font-bold text-maroon')}>{inr(i.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="relative mt-1.5 text-[11px] text-muted">* Per-unit values exclude GST; line amounts include GST.</p>

        <section className="relative mt-5 grid gap-6 border-t border-gold/40 pt-5 sm:grid-cols-[minmax(0,1fr)_19rem] sm:gap-10">
          <div className="space-y-5">
            <div className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full border border-gold/70 text-gold-deep">
                <IndianRupee className="size-4.5" aria-hidden />
              </span>
              <div>
                <p className="font-display text-[1rem] font-semibold text-gold-deep">Amount in words</p>
                <p className="font-display text-[1.0625rem] text-maroon">{amountInWords(o.pricing.total)}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full border border-gold/70 text-gold-deep">
                <CreditCard className="size-4.5" aria-hidden />
              </span>
              <div>
                <p className="font-display text-[1rem] font-semibold text-gold-deep">Payment</p>
                <p className="text-[0.9375rem] text-ink-2">
                  {o.payment.method === 'cod' ? 'Cash on delivery' : 'Online (Razorpay)'} · {o.payment.status === 'paid' ? 'Paid' : 'Payment pending'}
                  {o.payment.reference ? ` · Ref ${o.payment.reference}` : ''}
                </p>
              </div>
            </div>
          </div>
          <dl className="space-y-1 text-[0.9375rem] tabular sm:border-l sm:border-gold/40 sm:pl-8">
            <div className="flex justify-between"><dt>Items total</dt><dd>{inr(o.pricing.subtotal)}</dd></div>
            {o.pricing.discount > 0 && <div className="flex justify-between"><dt>Discount</dt><dd>− {inr(o.pricing.discount)}</dd></div>}
            {o.pricing.shipping > 0 && <div className="flex justify-between"><dt>Delivery</dt><dd>{inr(o.pricing.shipping)}</dd></div>}
            {o.pricing.codFee > 0 && <div className="flex justify-between"><dt>COD fee</dt><dd>{inr(o.pricing.codFee)}</dd></div>}
            <div className="flex justify-between"><dt>Taxable value</dt><dd>{inr(o.pricing.taxableValue)}</dd></div>
            {intra ? (
              <>
                <div className="flex justify-between"><dt>CGST @ {rate / 2}%</dt><dd>{inr(o.pricing.cgst)}</dd></div>
                <div className="flex justify-between"><dt>SGST @ {rate / 2}%</dt><dd>{inr(o.pricing.sgst)}</dd></div>
              </>
            ) : (
              <div className="flex justify-between"><dt>IGST @ {rate}%</dt><dd>{inr(o.pricing.igst)}</dd></div>
            )}
            <div className="mt-1 flex items-baseline justify-between border-t-2 border-gold/70 pt-2 font-display text-[1.75rem] font-bold text-maroon">
              <dt>Total</dt>
              <dd>{inr(o.pricing.total)}</dd>
            </div>
          </dl>
        </section>

        <footer className="relative mt-8 text-center text-[12px] italic text-ink-2">
          <span aria-hidden className="flex items-center gap-3">
            <span className="h-px flex-1 bg-gold/50" />
            <LotusMark className="w-8 text-gold" />
            <span className="h-px flex-1 bg-gold/50" />
          </span>
          <p className="mt-2 font-display text-[0.9375rem]">This is a computer-generated {isTax ? 'invoice' : 'receipt'} and does not require a signature.</p>
          {!isTax && <p className="font-display text-[0.9375rem]">A GST tax invoice is issued once the store’s GSTIN is configured.</p>}
        </footer>
      </article>
    </div>
  );
}
