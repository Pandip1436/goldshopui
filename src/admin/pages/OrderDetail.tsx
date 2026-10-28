import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, FileText, History, MapPin, Package, RefreshCw, StickyNote, Truck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { ORDER_STATUS_LABELS, PURITIES, formatIndianMobile, type OrderDTO, type OrderStatus } from '@goldshop/shared';
import { Field } from '../../components/ui/Form';
import { Img, Skeleton } from '../../components/ui/misc';
import { api, errorMessage } from '../../lib/api';
import { useMe } from '../../lib/hooks';
import { formatDateTime, formatGrams, inr } from '../../lib/utils';
import { can } from '../lib';
import { Alert, Button, ButtonLink, Card, FormError, Modal, MoneyInput, OrderStatusBadge, PageHeader, PaymentBadge, Textarea, adminInput } from '../ui';

type AdminOrder = OrderDTO & {
  id: string;
  userId?: string;
  adminNotes: string;
  zoneName: string;
  reservationExpiresAt?: string;
  allowedTransitions: OrderStatus[];
  payments: { id: string; amount: number; status: string; method: string; source: string; createdAt: string; refunds: { refundId: string; amount: number; status: string }[]; errorDescription?: string }[];
  gatewayConfigured: boolean;
};

export default function OrderDetail() {
  const { orderNumber } = useParams();
  const { user } = useMe();
  const qc = useQueryClient();
  const key = ['admin', 'order', orderNumber];
  const { data: o, isLoading } = useQuery({ queryKey: key, queryFn: () => api<AdminOrder>(`/admin/orders/${orderNumber}`) });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  };

  const [target, setTarget] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState('');
  const [notify, setNotify] = useState(true);
  const [restock, setRestock] = useState(true);
  const transition = useMutation({
    mutationFn: () => api(`/admin/orders/${orderNumber}/status`, { method: 'PATCH', body: { status: target, note, notify, restock } }),
    onSuccess: () => {
      toast.success(`Order marked ${ORDER_STATUS_LABELS[target!].toLowerCase()}`);
      setTarget(null);
      setNote('');
      refresh();
    },
  });

  const [ship, setShip] = useState<{ carrier: string; trackingNumber: string; trackingUrl: string } | null>(null);
  const saveShip = useMutation({
    mutationFn: () => api(`/admin/orders/${orderNumber}/shipment`, { method: 'PATCH', body: ship }),
    onSuccess: () => {
      toast.success('Shipment details saved');
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const markPaid = useMutation({
    mutationFn: () => api(`/admin/orders/${orderNumber}/mark-paid`, { method: 'POST' }),
    onSuccess: () => { toast.success('Cash payment recorded'); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const [notes, setNotes] = useState<string | null>(null);
  const saveNotes = useMutation({
    mutationFn: () => api(`/admin/orders/${orderNumber}/notes`, { method: 'PATCH', body: { adminNotes: notes ?? '' } }),
    onSuccess: () => { toast.success('Notes saved'); refresh(); },
  });
  const [refundOpen, setRefundOpen] = useState(false);
  const [refund, setRefund] = useState({ amount: 0, reason: '' });
  const doRefund = useMutation({
    mutationFn: () => api(`/admin/orders/${orderNumber}/refund`, { body: refund }),
    onSuccess: () => { toast.success('Refund recorded'); setRefundOpen(false); refresh(); },
  });

  if (isLoading || !o) return <Skeleton className="h-96 w-full rounded-2xl" />;
  const shipment = ship ?? { carrier: o.shipment?.carrier ?? '', trackingNumber: o.shipment?.trackingNumber ?? '', trackingUrl: o.shipment?.trackingUrl ?? '' };
  const writable = can(user?.role, 'orders:write');
  const refundable = (o.payment.status === 'paid' || o.payment.status === 'partially_refunded') && can(user?.role, 'orders:refund');
  const a = o.shippingAddress;

  return (
    <div>
      <PageHeader
        back={{ to: '/admin/orders', label: 'Orders' }}
        title={`Order ${o.orderNumber}`}
        description={<span className="inline-flex flex-wrap items-center gap-2">Placed {formatDateTime(o.createdAt)} <OrderStatusBadge status={o.status} /> <PaymentBadge status={o.payment.status} method={o.payment.method} /></span>}
        actions={o.invoiceNumber && <ButtonLink to={`/orders/${o.orderNumber}/invoice`} target="_blank" variant="secondary" icon={<FileText className="size-4" aria-hidden />}>Invoice {o.invoiceNumber}</ButtonLink>}
      />

      {o.status === 'payment_review' && <Alert tone="danger" className="mb-6">This order needs attention: see the latest note in the history. Confirm it (if stock is available) or cancel and refund.</Alert>}
      {o.status === 'pending_payment' && o.reservationExpiresAt && (
        <Alert tone="warn" className="mb-6">Waiting for online payment. Stock is held until {formatDateTime(o.reservationExpiresAt)}; after that the order is cancelled automatically (we check with Razorpay first).</Alert>
      )}

      <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-3">
        <div className="space-y-5 lg:space-y-6 xl:col-span-2">
          {writable && o.allowedTransitions.length > 0 && (
            <Card icon={RefreshCw} title="Update status">
              <div className="flex flex-wrap gap-2">
                {o.allowedTransitions.map((s) => (
                  <Button key={s} size="sm" variant={s === 'cancelled' || s === 'returned' ? 'danger' : 'primary'} onClick={() => setTarget(s)}>
                    Mark {ORDER_STATUS_LABELS[s].toLowerCase()}
                  </Button>
                ))}
              </div>
            </Card>
          )}

          <Card icon={Package} title={`Items (${o.items.reduce((s, i) => s + i.qty, 0)})`} padded={false}>
            <ul className="divide-y divide-hairline border-t border-hairline">
              {o.items.map((i) => (
                <li key={i.sku} className="flex gap-4 px-5 py-4">
                  <span className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-canvas"><Img image={i.image} sizes="64px" width={480} className="size-full object-cover" /></span>
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="flex justify-between gap-3">
                      <Link to={`/admin/products/${i.productId}`} className="font-semibold text-ink hover:text-wine">{i.name}</Link>
                      <span className="font-semibold text-ink tabular">{inr(i.lineTotal)}</span>
                    </div>
                    <p className="text-xs text-muted">SKU {i.sku}{i.variantLabel ? ` · ${i.variantLabel}` : ''} · Qty {i.qty} × {inr(i.unitPrice)}</p>
                    {i.breakdown.mode === 'weight' && (
                      <p className="mt-1 text-xs text-muted">
                        {i.purity ? PURITIES[i.purity].label : ''} · {formatGrams(i.netWeightMg)} @ {inr(i.breakdown.ratePerGram ?? 0)}/g = {inr(i.breakdown.metalValue)} · making {inr(i.breakdown.making - i.breakdown.makingDiscount)}{i.breakdown.stone ? ` · stones ${inr(i.breakdown.stone)}` : ''} · GST {inr(i.breakdown.gst)}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 rounded-b-2xl border-t border-hairline bg-cream-2 px-5 py-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular">{inr(o.pricing.subtotal)}</dd></div>
              {o.pricing.discount > 0 && <div className="flex justify-between"><dt className="text-muted">Discount {o.coupon?.code}</dt><dd className="tabular">− {inr(o.pricing.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Shipping ({o.zoneName || '—'})</dt><dd className="tabular">{inr(o.pricing.shipping)}</dd></div>
              {o.pricing.codFee > 0 && <div className="flex justify-between"><dt className="text-muted">COD fee</dt><dd className="tabular">{inr(o.pricing.codFee)}</dd></div>}
              <div className="flex justify-between border-t border-hairline pt-2 text-base font-semibold text-ink"><dt>Total</dt><dd className="tabular">{inr(o.pricing.total)}</dd></div>
              <div className="flex justify-between text-xs text-muted"><dt>Taxable value / GST</dt><dd className="tabular">{inr(o.pricing.taxableValue)} / {inr(o.pricing.gstAmount)} ({o.pricing.igst ? 'IGST' : 'CGST + SGST'})</dd></div>
            </dl>
          </Card>

          <Card icon={Truck} title="Shipment">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Courier"><input className={adminInput} value={shipment.carrier} onChange={(e) => setShip({ ...shipment, carrier: e.target.value })} placeholder="e.g. BlueDart" disabled={!writable} /></Field>
              <Field label="Tracking number"><input className={adminInput} value={shipment.trackingNumber} onChange={(e) => setShip({ ...shipment, trackingNumber: e.target.value })} disabled={!writable} /></Field>
              <Field label="Tracking link" optional><input className={adminInput} value={shipment.trackingUrl} onChange={(e) => setShip({ ...shipment, trackingUrl: e.target.value })} placeholder="https://" disabled={!writable} /></Field>
            </div>
            {writable && <Button size="sm" className="mt-4" loading={saveShip.isPending} onClick={() => saveShip.mutate()} disabled={!ship}>Save shipment</Button>}
            <p className="mt-2 text-xs text-muted">Add tracking before marking the order shipped so the customer’s email includes it.</p>
          </Card>

          <Card icon={History} title="History">
            <ol className="space-y-3 border-l border-hairline pl-5">
              {[...o.statusHistory].reverse().map((h, i) => (
                <li key={i} className="relative text-sm">
                  <span className="absolute -left-[1.45rem] top-1.5 size-2 rounded-full bg-gold ring-4 ring-cream" />
                  <span className="font-semibold text-ink">{ORDER_STATUS_LABELS[h.status]}</span> <span className="text-muted">· {formatDateTime(h.at)}</span>
                  {h.note && <p className="text-xs text-muted">{h.note}</p>}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-5 lg:space-y-6">
          <Card icon={UserRound} title="Customer">
            <p className="font-semibold text-ink">{o.customer.name}</p>
            <p className="text-sm"><a href={`mailto:${o.customer.email}`} className="break-all text-ink-2 underline decoration-ink/25 underline-offset-2 hover:text-wine">{o.customer.email}</a></p>
            <p className="text-sm"><a href={`tel:+91${o.customer.phone}`} className="text-ink-2 underline decoration-ink/25 underline-offset-2 hover:text-wine">{formatIndianMobile(o.customer.phone)}</a></p>
            {o.userId ? <Link to={`/admin/customers/${o.userId}`} className="mt-2 inline-block text-xs font-semibold text-wine underline underline-offset-4">Customer profile</Link> : <p className="mt-2 text-xs text-muted">Guest checkout</p>}
            {o.gstin && <p className="mt-2 text-xs">GSTIN: <span className="font-semibold">{o.gstin}</span></p>}
            {o.notes && <p className="mt-3 rounded-lg border-l-2 border-gold bg-cream-2 px-3 py-2 text-xs">Customer note: {o.notes}</p>}
          </Card>
          <Card icon={MapPin} title="Ship to">
            <address className="text-sm not-italic leading-relaxed">
              {a.fullName} · {a.phone}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.landmark ? <>Near {a.landmark}<br /></> : null}{a.city}, {a.state} {a.pincode}
            </address>
          </Card>
          <Card icon={CreditCard} title="Payment">
            <p className="text-sm">{o.payment.method === 'cod' ? 'Cash on delivery' : 'Razorpay'} · <span className="font-semibold">{o.payment.status}</span></p>
            {o.payment.reference && <p className="text-xs text-muted">Payment ID {o.payment.reference}</p>}
            {o.payments.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-xs">
                {o.payments.map((p) => (
                  <li key={p.id} className="border-t border-hairline pt-1.5">
                    {p.id} · {inr(p.amount)} · {p.status}{p.method ? ` · ${p.method}` : ''} <span className="text-muted">({p.source})</span>
                    {p.errorDescription && <span className="block text-danger">{p.errorDescription}</span>}
                    {p.refunds.map((r) => <span key={r.refundId} className="block text-muted">Refund {r.refundId}: {inr(r.amount)} ({r.status})</span>)}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {writable && o.payment.method === 'cod' && o.payment.status === 'pending' && o.status !== 'cancelled' && (
                <Button size="sm" variant="secondary" loading={markPaid.isPending} onClick={() => markPaid.mutate()}>Record cash received</Button>
              )}
              {refundable && <Button size="sm" variant="danger" onClick={() => { setRefund({ amount: o.pricing.total, reason: '' }); setRefundOpen(true); }}>Refund…</Button>}
            </div>
          </Card>
          <Card icon={StickyNote} title="Internal notes">
            <Textarea rows={4} value={notes ?? o.adminNotes} onChange={(e) => setNotes(e.target.value)} placeholder="Only visible to staff" aria-label="Internal notes" disabled={!writable} />
            {writable && <Button size="sm" className="mt-3" variant="secondary" disabled={notes === null} loading={saveNotes.isPending} onClick={() => saveNotes.mutate()}>Save notes</Button>}
          </Card>
        </div>
      </div>

      <Modal
        open={target !== null}
        onOpenChange={(v) => !v && setTarget(null)}
        title={target ? `Mark order ${ORDER_STATUS_LABELS[target].toLowerCase()}?` : ''}
        description={target === 'cancelled' ? 'Reserved stock will be returned to inventory. Paid orders must be refunded separately.' : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTarget(null)}>Cancel</Button>
            <Button variant={target === 'cancelled' || target === 'returned' ? 'danger' : 'primary'} loading={transition.isPending} onClick={() => transition.mutate()}>Confirm</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormError>{transition.isError ? errorMessage(transition.error) : null}</FormError>
          <Field label="Note" optional hint="Shown in the order history.">
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          {['shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'].includes(target ?? '') && (
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="accent-ink" /> Email the customer</label>
          )}
          {target === 'returned' && (
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} className="accent-ink" /> Return items to stock</label>
          )}
        </div>
      </Modal>

      <Modal
        open={refundOpen}
        onOpenChange={setRefundOpen}
        title="Refund payment"
        description={o.payment.method === 'razorpay' ? 'The refund is sent through Razorpay to the customer’s original payment method.' : 'For cash orders this only records a refund you have made yourself.'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRefundOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={doRefund.isPending} onClick={() => doRefund.mutate()}>Refund {inr(refund.amount)}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormError>{doRefund.isError ? errorMessage(doRefund.error) : null}</FormError>
          <Field label="Amount"><MoneyInput value={refund.amount} onChange={(v) => setRefund((r) => ({ ...r, amount: v }))} /></Field>
          <Field label="Reason" optional><input className={adminInput} value={refund.reason} onChange={(e) => setRefund((r) => ({ ...r, reason: e.target.value }))} /></Field>
        </div>
      </Modal>
    </div>
  );
}
