import { ChevronDown, Info, Tag, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { CartDTO } from '@goldshop/shared';
import { ApiError, errorMessage } from '../../lib/api';
import { useCartActions, useSettings } from '../../lib/hooks';
import { cn, inr } from '../../lib/utils';

/** "Have a coupon code?" as a row that opens into the code field; an applied code shows its effect. */
export function CouponForm({ cart }: { cart: CartDTO }) {
  const { applyCoupon, removeCoupon } = useCartActions();
  const [code, setCode] = useState('');
  const [open, setOpen] = useState(false);
  const err = applyCoupon.error;

  if (cart.coupon) {
    return (
      <div className={cn('flex items-start justify-between gap-3 rounded-md border px-3.5 py-3 text-sm', cart.coupon.valid ? 'border-success/30 bg-success-bg' : 'border-warn/30 bg-warn-bg')}>
        <div>
          <p className="flex items-center gap-2 font-semibold">
            <Tag className="size-4" aria-hidden /> {cart.coupon.code}
          </p>
          <p className="mt-0.5 text-xs text-ink-2">{cart.coupon.valid ? cart.coupon.description : cart.coupon.message}</p>
          {cart.coupon.valid && cart.coupon.message && <p className="mt-0.5 text-xs text-muted">{cart.coupon.message}</p>}
        </div>
        <button type="button" onClick={() => removeCoupon.mutate()} className="grid size-7 place-items-center rounded-full hover:bg-ivory" aria-label="Remove coupon">
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-y border-line">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 py-3.5 text-left text-[0.9375rem] font-medium text-maroon">
        <span className="flex items-center gap-2.5">
          <Tag className="size-4.5 text-ink-2" strokeWidth={1.6} aria-hidden /> Have a coupon code?
        </span>
        <ChevronDown className={cn('size-4.5 text-ink-2 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <form
          className="pb-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim().length >= 3) applyCoupon.mutate(code.trim(), { onSuccess: () => setCode('') });
          }}
        >
          <label htmlFor="coupon" className="sr-only">
            Coupon code
          </label>
          <div className="flex gap-2">
            <input
              id="coupon"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              autoCapitalize="characters"
              autoComplete="off"
              className="h-11 min-w-0 flex-1 rounded-md border border-line-strong/70 bg-white px-3 text-sm uppercase tracking-wider focus:border-ink focus:outline-none"
              aria-invalid={Boolean(err) || undefined}
              aria-describedby={err ? 'coupon-err' : undefined}
            />
            <button type="submit" disabled={applyCoupon.isPending || code.trim().length < 3} className="h-11 rounded-md bg-maroon px-5 text-xs font-bold uppercase tracking-[0.14em] text-ivory disabled:opacity-50">
              Apply
            </button>
          </div>
          {err && (
            <p id="coupon-err" role="alert" className="mt-1.5 text-xs text-danger">
              {err instanceof ApiError ? err.message : errorMessage(err)}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

/**
 * Subtotal, discount, delivery and the GST-inclusive total. `delivery` replaces the computed
 * delivery line (the bag page has no PIN code yet).
 */
type DeliveryLine = { value: ReactNode; free?: boolean; note?: string };

export function Totals({ cart, delivery }: { cart: CartDTO; delivery?: DeliveryLine }) {
  const { data: s } = useSettings();
  const gst = ((s?.gstRateBps ?? 300) / 100).toLocaleString('en-IN');
  const row = 'flex items-baseline justify-between gap-4 py-1.5 text-[0.9375rem]';
  const items = cart.lines.reduce((n, l) => n + (l.unavailable ? 0 : l.qty), 0);
  const quoted: DeliveryLine = cart.shipping
    ? cart.shipping.serviceable
      ? { value: cart.shipping.amount ? inr(cart.shipping.amount) : 'Free', free: !cart.shipping.amount }
      : { value: '—' }
    : { value: <span className="text-xs text-muted">Enter PIN code</span> };
  const d: DeliveryLine = delivery ?? quoted;
  return (
    <dl>
      <div className={row}>
        <dt className="text-ink-2">
          Subtotal ({items} {items === 1 ? 'item' : 'items'})
        </dt>
        <dd className="tabular text-ink">{inr(cart.subtotal)}</dd>
      </div>
      {cart.discount > 0 && (
        <div className={row}>
          <dt className="text-ink-2">Discount{cart.coupon?.code ? ` (${cart.coupon.code})` : ''}</dt>
          <dd className="tabular text-success">− {inr(cart.discount)}</dd>
        </div>
      )}
      <div className={row}>
        <dt className="flex items-center gap-1.5 text-ink-2">
          Delivery
          {d.note && (
            <span title={d.note} className="text-muted">
              <Info className="size-3.5" aria-hidden />
              <span className="sr-only">{d.note}</span>
            </span>
          )}
        </dt>
        <dd className={cn('tabular', d.free ? 'font-semibold text-success' : 'text-ink')}>{d.value}</dd>
      </div>
      {cart.codFee > 0 && (
        <div className={row}>
          <dt className="text-ink-2">Cash on delivery fee</dt>
          <dd className="tabular">{inr(cart.codFee)}</dd>
        </div>
      )}
      <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-line pt-4">
        <dt className="font-display text-[1.5rem] font-semibold text-ink">Total</dt>
        <dd className="font-display text-[2rem] font-bold leading-none text-maroon tabular">{inr(cart.total)}</dd>
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-4 text-xs">
        <span className="text-gold-deep">(Inclusive of all taxes)</span>
        <span className="text-muted">
          Includes {gst}% GST ({inr(cart.gstIncluded)})
        </span>
      </div>
    </dl>
  );
}
