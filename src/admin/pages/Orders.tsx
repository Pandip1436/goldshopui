import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import type { OrderStatus, PaymentStatus } from '@goldshop/shared';
import { api } from '../../lib/api';
import { useMe } from '../../lib/hooks';
import { formatDateTime, inr } from '../../lib/utils';
import { can, toDateInput } from '../lib';
import { DateRangePicker } from '../DatePicker';
import { presets, todayIST } from '../dates';
import { AdminSelect, ButtonAnchor, DataTable, FilterTabs, OrderStatusBadge, PageHeader, Pager, PaymentBadge, SearchField } from '../ui';

interface Row {
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  customer: { name: string; email: string; phone: string };
  city?: string;
  total: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  itemCount: number;
  firstItem?: string;
}

const ORDER_PRESETS = presets('today', 'yesterday', 'last7', 'last30', 'thisMonth', 'lastMonth');

const TABS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'To fulfil' },
  { value: 'pending_payment', label: 'Awaiting payment' },
  { value: 'payment_review', label: 'Payment review' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function Orders() {
  const { user } = useMe();
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const status = sp.get('status') ?? '';
  const page = Number(sp.get('page') ?? 1);
  const [q, setQ] = useState(sp.get('q') ?? '');
  const from = sp.get('from') ?? '';
  const to = sp.get('to') ?? '';
  const payment = sp.get('payment') ?? '';

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', status, page, sp.get('q'), from, to, payment],
    queryFn: () => api<{ items: Row[]; page: number; pages: number; total: number; statusCounts: Record<string, number> }>('/admin/orders', { query: { status, page, q: sp.get('q') ?? '', from, to, payment } }),
    placeholderData: keepPreviousData,
  });
  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in patch)) next.delete('page');
    setSp(next);
  };
  const counts = data?.statusCounts ?? {};
  const openCount = (counts.confirmed ?? 0) + (counts.processing ?? 0) + (counts.payment_review ?? 0);

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Every order placed on the website. Click an order to update its status, shipment or payment."
        actions={
          can(user?.role, 'reports:read') && (
            <ButtonAnchor
              variant="secondary"
              icon={<Download className="size-4" aria-hidden />}
              href={`/api/admin/reports/orders.csv?from=${from || toDateInput(new Date(Date.now() - 29 * 86400_000))}&to=${to || toDateInput(new Date())}${status ? `&status=${status}` : ''}`}
            >
              Export CSV
            </ButtonAnchor>
          )
        }
      />
      <FilterTabs
        value={status}
        onChange={(v) => set({ status: v })}
        options={TABS.map((t) => ({ ...t, count: t.value === 'open' ? openCount : t.value ? counts[t.value] : undefined }))}
      />
      <div className="mb-4 grid grid-cols-2 gap-3 md:flex md:flex-wrap">
        <SearchField className="col-span-2 md:min-w-[16rem] md:flex-1" value={q} onChange={setQ} onSubmit={() => set({ q })} placeholder="Order number, email, mobile or name" label="Search orders" />
        <DateRangePicker
          className="col-span-2 md:w-80"
          from={from}
          to={to}
          onChange={(r) => set({ from: r.from, to: r.to })}
          presets={ORDER_PRESETS}
          clearable
          max={todayIST()}
          aria-label="Order date"
        />
        <AdminSelect
          className="col-span-2 md:w-48"
          value={payment}
          onChange={(v) => set({ payment: v })}
          aria-label="Payment method"
          options={[
            { value: '', label: 'All payments' },
            { value: 'razorpay', label: 'Online' },
            { value: 'cod', label: 'Cash on delivery' },
          ]}
        />
      </div>
      <DataTable
        rows={data?.items}
        loading={isLoading}
        rowKey={(r) => r.orderNumber}
        onRowClick={(r) => navigate(`/admin/orders/${r.orderNumber}`)}
        empty="No orders match these filters."
        columns={[
          { key: 'n', header: 'Order', cell: (r) => <span className="whitespace-nowrap font-semibold text-ink">{r.orderNumber}</span> },
          { key: 'd', header: 'Placed', cell: (r) => <span className="whitespace-nowrap text-muted">{formatDateTime(r.createdAt)}</span> },
          {
            key: 'c',
            header: 'Customer',
            cell: (r) => (
              <span>
                <span className="text-ink">{r.customer.name}</span>
                <span className="block text-xs text-muted">{r.city} · {r.customer.phone}</span>
              </span>
            ),
          },
          { key: 'i', header: 'Items', cell: (r) => <span className="text-muted">{r.firstItem}{r.itemCount > 1 ? ` +${r.itemCount - 1}` : ''}</span> },
          { key: 's', header: 'Status', cell: (r) => <OrderStatusBadge status={r.status} /> },
          { key: 'p', header: 'Payment', cell: (r) => <PaymentBadge status={r.paymentStatus} method={r.paymentMethod} /> },
          { key: 't', header: 'Total', className: 'text-right', cell: (r) => <span className="font-semibold tabular">{inr(r.total)}</span> },
        ]}
      />
      {data && <Pager page={data.page} pages={data.pages} total={data.total} onPage={(p) => set({ page: String(p) })} />}
    </div>
  );
}
