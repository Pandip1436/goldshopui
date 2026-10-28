import { ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { useCart, useCartActions, useSettings } from '../../lib/hooks';
import { useUI } from '../../lib/ui';
import { formatGrams, inr, purityLabel } from '../../lib/utils';
import { ButtonLink } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { Alert, EmptyState, Img, QuantityStepper } from '../ui/misc';

export function CartDrawer() {
  const { cartOpen, setCartOpen } = useUI();
  const { data: cart, isLoading } = useCart();
  const { data: settings } = useSettings();
  const { setQty, remove } = useCartActions();
  const close = () => setCartOpen(false);
  const lines = cart?.lines ?? [];
  const freeAbove = settings?.shipping.freeAbove;

  return (
    <Sheet
      open={cartOpen}
      onOpenChange={setCartOpen}
      title="Your bag"
      description={cart && cart.itemCount > 0 ? `${cart.itemCount} ${cart.itemCount === 1 ? 'piece' : 'pieces'}` : undefined}
      footer={
        lines.length > 0 && cart ? (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Subtotal (incl. GST)</span>
              <span className="text-lg font-semibold tabular">{inr(cart.subtotal)}</span>
            </div>
            {freeAbove ? (
              <p className="text-xs text-muted">
                {cart.subtotal >= freeAbove ? 'Your order qualifies for free delivery.' : `Free delivery on orders above ${inr(freeAbove)}.`} Delivery is confirmed by PIN code at checkout.
              </p>
            ) : (
              <p className="text-xs text-muted">Delivery charges, if any, are shown at checkout.</p>
            )}
            <ButtonLink to="/checkout" block size="lg" onClick={close} className={cart.issues.length ? 'pointer-events-none opacity-50' : ''}>
              Checkout
            </ButtonLink>
            <Link to="/cart" onClick={close} className="block text-center text-xs font-semibold uppercase tracking-[0.14em] text-ink-2 underline underline-offset-4">
              View bag
            </Link>
          </div>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="p-6 text-sm text-muted">Loading your bag…</div>
      ) : lines.length === 0 ? (
        <EmptyState
          title="Your bag is empty"
          icon={<ShoppingBag className="size-7" strokeWidth={1.5} />}
          action={
            <ButtonLink to="/shop" onClick={close}>
              Explore jewellery
            </ButtonLink>
          }
        >
          Pieces you add will appear here, priced at today’s gold rate.
        </EmptyState>
      ) : (
        <div className="px-5 py-4">
          {cart!.issues.map((i) => (
            <Alert key={i} tone="warn" className="mb-3">
              {i}
            </Alert>
          ))}
          <ul className="divide-y divide-line">
            {lines.map((l) => (
              <li key={l.id} className="flex gap-4 py-4">
                <Link to={`/product/${l.slug}`} onClick={close} className="h-24 w-20 shrink-0 overflow-hidden bg-sand">
                  <Img image={l.image} sizes="80px" width={480} className="size-full object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <Link to={`/product/${l.slug}`} onClick={close} className="font-semibold leading-snug text-ink hover:underline">
                      {l.name}
                    </Link>
                    <span className="shrink-0 font-semibold tabular">{l.unavailable ? '—' : inr(l.lineTotal)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {[purityLabel(l.purity), formatGrams(l.netWeightMg), l.variantLabel].filter(Boolean).join(' · ')}
                  </p>
                  {l.issue && <p className={`mt-1 text-xs font-medium ${l.unavailable ? 'text-danger' : 'text-warn'}`}>{l.issue}</p>}
                  <div className="mt-3 flex items-center justify-between">
                    {l.unavailable ? (
                      <span />
                    ) : (
                      <QuantityStepper size="sm" value={l.qty} max={l.maxQty} onChange={(qty) => setQty.mutate({ lineId: l.id, qty })} disabled={setQty.isPending} />
                    )}
                    <button type="button" onClick={() => remove.mutate(l.id)} className="inline-flex items-center gap-1 text-xs text-muted hover:text-danger" aria-label={`Remove ${l.name}`}>
                      <Trash2 className="size-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Sheet>
  );
}
