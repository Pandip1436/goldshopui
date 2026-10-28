import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Boxes,
  ChartColumnIncreasing,
  Coins,
  Download,
  Gem,
  IndianRupee,
  Layers,
  MapPin,
  PackageCheck,
  PackageOpen,
  Percent,
  Receipt,
  Repeat,
  ShoppingBag,
  Truck,
  UserPlus,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router';
import { PURITIES, formatIndianMobile, type ImageRef, type PurityKey } from '@goldshop/shared';
import { Img, Skeleton } from '../../components/ui/misc';
import { api } from '../../lib/api';
import { formatDate, formatGrams, inr } from '../../lib/utils';
import { BarChart } from '../Chart';
import { DateRangePicker } from '../DatePicker';
import { isDay, presets, todayIST } from '../dates';
import { AdminSelect, Badge, ButtonAnchor, Card, DataTable, LinkTabs, PageHeader, StatTile } from '../ui';

export default function Reports() {
  return (
    <Routes>
      <Route index element={<Navigate to="sales" replace />} />
      <Route path="sales" element={<SalesReport />} />
      <Route path="products" element={<ProductReport />} />
      <Route path="customers" element={<CustomerReport />} />
    </Routes>
  );
}

/* ------------------------------------------------------------------ shared range */

const REPORT_PRESETS = presets('last7', 'last30', 'last90', 'thisMonth', 'lastMonth', 'last12');
const DEFAULT_PRESET = 'last30';

/**
 * The report period lives in the URL (a preset name, or "custom" with from/to), so it survives
 * reloads and carries across the three reports.
 */
function useRange() {
  const [sp, setSp] = useSearchParams();
  const custom = sp.get('range') === 'custom' && isDay(sp.get('from')) && isDay(sp.get('to'));
  const preset = REPORT_PRESETS.find((p) => p.key === (sp.get('range') ?? DEFAULT_PRESET)) ?? REPORT_PRESETS.find((p) => p.key === DEFAULT_PRESET)!;
  const { from, to } = custom ? { from: sp.get('from')!, to: sp.get('to')! } : preset.range();
  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setSp(next, { replace: true });
  };
  return { sp, from, to, set };
}

function ReportTabs() {
  const { pathname, search } = useLocation();
  const current = pathname.split('/').pop() ?? 'sales';
  return (
    <LinkTabs
      value={current}
      options={[
        { value: 'sales', label: 'Sales', to: `/admin/reports/sales${search}` },
        { value: 'products', label: 'Products', to: `/admin/reports/products${search}` },
        { value: 'customers', label: 'Customers', to: `/admin/reports/customers${search}` },
      ]}
    />
  );
}

function RangeBar({ extra }: { extra?: ReactNode }) {
  const { from, to, set } = useRange();
  return (
    <div className="mb-5 flex flex-wrap items-end gap-3">
      <div className="w-full sm:w-[22rem]">
        <p className="mb-1.5 text-[0.8125rem] font-semibold text-ink-2">Period</p>
        <DateRangePicker
          from={from}
          to={to}
          presets={REPORT_PRESETS}
          max={todayIST()}
          aria-label="Report period"
          onChange={(r) => set(r.preset ? { range: r.preset === DEFAULT_PRESET ? '' : r.preset, from: '', to: '' } : { range: 'custom', from: r.from, to: r.to })}
        />
      </div>
      {extra}
    </div>
  );
}

const csvButton = (from: string, to: string) => (
  <ButtonAnchor href={`/api/admin/reports/orders.csv?from=${from}&to=${to}`} variant="secondary" icon={<Download className="size-4" aria-hidden />}>
    Orders CSV (GST columns)
  </ButtonAnchor>
);

/** A thin bar showing a row's share of the total. */
function Share({ value, total }: { value: number; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-canvas" aria-hidden>
        <span className="block h-full rounded-full bg-[#c99a4b]" style={{ width: `${pct}%` }} />
      </span>
      <span className="w-9 text-xs text-muted tabular">{pct}%</span>
    </span>
  );
}

function Thumb({ image }: { image?: ImageRef }) {
  return (
    <span className="size-10 shrink-0 overflow-hidden rounded-lg bg-canvas">
      <Img image={image} sizes="40px" width={480} className="size-full object-cover" />
    </span>
  );
}

const loadingBlock = (
  <div className="space-y-5">
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
    <Skeleton className="h-80 rounded-2xl" />
  </div>
);

/* ------------------------------------------------------------------ sales */

interface SalesData {
  from: string;
  to: string;
  group: 'day' | 'month';
  totals: { revenue: number; orders: number; discount: number; shipping: number; gst: number; refunded: number; units: number; aov: number };
  series: { period: string; revenue: number; orders: number }[];
  byPayment: { method: string; revenue: number; orders: number }[];
  topProducts: { productId: string; name: string; units: number; revenue: number }[];
  byCategory: { name: string; revenue: number; units: number }[];
}

function SalesReport() {
  const { sp, from, to, set } = useRange();
  const group = sp.get('group') === 'month' ? 'month' : 'day';
  const [table, setTable] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'report', 'sales', from, to, group],
    queryFn: () => api<SalesData>('/admin/reports/sales', { query: { from, to, group } }),
  });
  const label = (p: string) =>
    group === 'month'
      ? new Date(`${p}-01T00:00:00+05:30`).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
      : new Date(`${p}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  return (
    <div>
      <PageHeader title="Sales report" description="Confirmed sales only. Amounts include GST." actions={csvButton(from, to)} />
      <ReportTabs />
      <RangeBar
        extra={
          <label className="block w-full text-[0.8125rem] font-semibold text-ink-2 sm:w-36">
            Group by
            <AdminSelect
              className="mt-1.5"
              value={group}
              onChange={(v) => set({ group: v === 'day' ? '' : v })}
              aria-label="Group by"
              options={[
                { value: 'day', label: 'Day' },
                { value: 'month', label: 'Month' },
              ]}
            />
          </label>
        }
      />
      {error && <p className="mb-4 text-sm text-danger">{(error as Error).message}</p>}
      {isLoading || !data ? (
        loadingBlock
      ) : (
        <div className="space-y-5 lg:space-y-6">
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
            <StatTile icon={IndianRupee} label="Revenue" value={inr(data.totals.revenue)} />
            <StatTile icon={ShoppingBag} label="Orders" value={String(data.totals.orders)} />
            <StatTile icon={Receipt} label="Average order" value={inr(data.totals.aov)} />
            <StatTile icon={Gem} label="Pieces sold" value={String(data.totals.units)} />
            <StatTile icon={Coins} label="GST collected" value={inr(data.totals.gst)} />
            <StatTile icon={Percent} label="Discounts given" value={inr(data.totals.discount)} />
            <StatTile icon={Truck} label="Shipping charged" value={inr(data.totals.shipping)} />
            <StatTile icon={Wallet} label="Refunded" value={inr(data.totals.refunded)} />
          </div>
          <Card
            icon={ChartColumnIncreasing}
            title={`Revenue by ${group}`}
            actions={
              <button
                type="button"
                onClick={() => setTable((t) => !t)}
                className="inline-flex h-10 items-center gap-1 rounded-lg border border-field px-3 text-[0.8125rem] font-semibold text-ink-2 underline decoration-ink/25 underline-offset-4 hover:border-line-strong hover:text-ink"
              >
                {table ? 'Show chart' : 'Show table'} <ArrowRight className="size-3.5" aria-hidden />
              </button>
            }
          >
            <BarChart
              title={`Revenue by ${group}`}
              table={table}
              periodLabel={group === 'month' ? 'Month' : 'Date'}
              data={data.series.map((s) => ({ label: label(s.period), tick: label(s.period), value: s.revenue, secondary: `${s.orders} orders` }))}
            />
          </Card>
          <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-2">
            <Card icon={PackageCheck} title="Top products" padded={false}>
              <div className="px-5 pb-4">
                <DataTable
                  bare
                  minWidth="26rem"
                  rows={data.topProducts}
                  rowKey={(r) => r.productId}
                  empty="No sales in this period."
                  columns={[
                    { key: 'n', header: 'Product', cell: (r) => <Link to={`/admin/products/${r.productId}`} className="font-medium text-ink hover:text-wine">{r.name}</Link> },
                    { key: 'u', header: 'Pieces', cell: (r) => r.units },
                    { key: 'r', header: 'Revenue', className: 'text-right', cell: (r) => <span className="font-semibold text-ink tabular">{inr(r.revenue)}</span> },
                  ]}
                />
              </div>
            </Card>
            <div className="space-y-5 lg:space-y-6">
              <Card icon={Layers} title="By category" padded={false}>
                <div className="px-5 pb-4">
                  <DataTable
                    bare
                    minWidth="24rem"
                    rows={data.byCategory}
                    rowKey={(r) => r.name}
                    empty="No sales in this period."
                    columns={[
                      { key: 'n', header: 'Category', cell: (r) => <span className="font-medium text-ink">{r.name}</span> },
                      { key: 's', header: 'Share', cell: (r) => <Share value={r.revenue} total={data.totals.revenue} /> },
                      { key: 'r', header: 'Revenue', className: 'text-right', cell: (r) => <span className="tabular">{inr(r.revenue)}</span> },
                    ]}
                  />
                </div>
              </Card>
              <Card icon={Wallet} title="By payment method" padded={false}>
                <div className="px-5 pb-4">
                  <DataTable
                    bare
                    minWidth="24rem"
                    rows={data.byPayment}
                    rowKey={(r) => r.method}
                    empty="No sales in this period."
                    columns={[
                      { key: 'm', header: 'Method', cell: (r) => <span className="font-medium text-ink">{r.method === 'cod' ? 'Cash on delivery' : 'Online (Razorpay)'}</span> },
                      { key: 'o', header: 'Orders', cell: (r) => r.orders },
                      { key: 'r', header: 'Revenue', className: 'text-right', cell: (r) => <span className="tabular">{inr(r.revenue)}</span> },
                    ]}
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ products */

interface ProductData {
  totals: { units: number; revenue: number; productsSold: number; avgPrice: number; live: number; soldOut: number; lowStock: number };
  topProducts: { productId: string; name: string; image?: ImageRef; units: number; orders: number; revenue: number }[];
  byPurity: { purity: PurityKey | 'other'; units: number; revenue: number; weightMg: number }[];
  byCategory: { name: string; revenue: number; units: number }[];
  unsold: { productId: string; name: string; image?: ImageRef; stock: number; listedAt: string }[];
}

function ProductReport() {
  const { from, to } = useRange();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'report', 'products', from, to],
    queryFn: () => api<ProductData>('/admin/reports/products', { query: { from, to } }),
  });
  return (
    <div>
      <PageHeader title="Product report" description="What sold, in which purities and categories, and what didn’t. Confirmed sales only." actions={csvButton(from, to)} />
      <ReportTabs />
      <RangeBar />
      {error && <p className="mb-4 text-sm text-danger">{(error as Error).message}</p>}
      {isLoading || !data ? (
        loadingBlock
      ) : (
        <div className="space-y-5 lg:space-y-6">
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
            <StatTile icon={IndianRupee} label="Product revenue" value={inr(data.totals.revenue)} />
            <StatTile icon={Gem} label="Pieces sold" value={String(data.totals.units)} sub={`${data.totals.productsSold} different products`} />
            <StatTile icon={Receipt} label="Average piece price" value={inr(data.totals.avgPrice)} />
            <StatTile icon={Boxes} label="Live products" value={String(data.totals.live)} sub={`${data.totals.lowStock} low · ${data.totals.soldOut} sold out`} />
          </div>

          <Card icon={PackageCheck} title="Best sellers" padded={false}>
            <div className="px-5 pb-4">
              <DataTable
                bare
                minWidth="36rem"
                rows={data.topProducts}
                rowKey={(r) => r.productId}
                empty="No sales in this period."
                columns={[
                  {
                    key: 'n',
                    header: 'Product',
                    cell: (r) => (
                      <Link to={`/admin/products/${r.productId}`} className="flex items-center gap-3 font-medium text-ink hover:text-wine">
                        <Thumb image={r.image} />
                        <span className="min-w-0 truncate">{r.name}</span>
                      </Link>
                    ),
                  },
                  { key: 'o', header: 'Orders', cell: (r) => r.orders },
                  { key: 'u', header: 'Pieces', cell: (r) => r.units },
                  { key: 's', header: 'Share', cell: (r) => <Share value={r.revenue} total={data.totals.revenue} /> },
                  { key: 'r', header: 'Revenue', className: 'text-right', cell: (r) => <span className="font-semibold text-ink tabular">{inr(r.revenue)}</span> },
                ]}
              />
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-2">
            <Card icon={Coins} title="By purity" padded={false}>
              <div className="px-5 pb-4">
                <DataTable
                  bare
                  minWidth="26rem"
                  rows={data.byPurity}
                  rowKey={(r) => r.purity}
                  empty="No sales in this period."
                  columns={[
                    { key: 'p', header: 'Purity', cell: (r) => <span className="font-medium text-ink">{r.purity === 'other' ? 'Other / not set' : PURITIES[r.purity].name}</span> },
                    { key: 'u', header: 'Pieces', cell: (r) => r.units },
                    { key: 'w', header: 'Net weight', cell: (r) => formatGrams(r.weightMg) || '—' },
                    { key: 'r', header: 'Revenue', className: 'text-right', cell: (r) => <span className="tabular">{inr(r.revenue)}</span> },
                  ]}
                />
              </div>
            </Card>
            <Card icon={Layers} title="By category" padded={false}>
              <div className="px-5 pb-4">
                <DataTable
                  bare
                  minWidth="24rem"
                  rows={data.byCategory}
                  rowKey={(r) => r.name}
                  empty="No sales in this period."
                  columns={[
                    { key: 'n', header: 'Category', cell: (r) => <span className="font-medium text-ink">{r.name}</span> },
                    { key: 'u', header: 'Pieces', cell: (r) => r.units },
                    { key: 's', header: 'Share', cell: (r) => <Share value={r.revenue} total={data.totals.revenue} /> },
                    { key: 'r', header: 'Revenue', className: 'text-right', cell: (r) => <span className="tabular">{inr(r.revenue)}</span> },
                  ]}
                />
              </div>
            </Card>
          </div>

          <Card icon={PackageOpen} title="Not sold in this period" padded={false}>
            <p className="-mt-2 px-5 pb-3 text-[0.8125rem] text-muted">Live pieces with no confirmed sale in the period, longest-listed first: candidates for a feature, a photo refresh or a rethink.</p>
            <div className="px-5 pb-4">
              <DataTable
                bare
                minWidth="30rem"
                rows={data.unsold}
                rowKey={(r) => r.productId}
                empty="Every live product sold at least once. 🎉"
                columns={[
                  {
                    key: 'n',
                    header: 'Product',
                    cell: (r) => (
                      <Link to={`/admin/products/${r.productId}`} className="flex items-center gap-3 font-medium text-ink hover:text-wine">
                        <Thumb image={r.image} />
                        <span className="min-w-0 truncate">{r.name}</span>
                      </Link>
                    ),
                  },
                  { key: 'l', header: 'Listed', cell: (r) => <span className="text-muted">{formatDate(r.listedAt)}</span> },
                  { key: 's', header: 'In stock', className: 'text-right', cell: (r) => (r.stock > 0 ? r.stock : <Badge tone="danger">Sold out</Badge>) },
                ]}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ customers */

interface CustomerData {
  totals: {
    customers: number;
    newCustomers: number;
    returningCustomers: number;
    repeatInPeriod: number;
    signups: number;
    registered: number;
    guests: number;
    revenue: number;
    orders: number;
    avgSpend: number;
  };
  topCustomers: { email: string; name: string; phone?: string; userId?: string; orders: number; revenue: number; lastOrderAt: string; returning: boolean }[];
  byState: { state: string; orders: number; revenue: number; customers: number }[];
}

function CustomerReport() {
  const { from, to } = useRange();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'report', 'customers', from, to],
    queryFn: () => api<CustomerData>('/admin/reports/customers', { query: { from, to } }),
  });
  return (
    <div>
      <PageHeader title="Customer report" description="Who bought, how often and from where. Guests are counted by email. Confirmed sales only." actions={csvButton(from, to)} />
      <ReportTabs />
      <RangeBar />
      {error && <p className="mb-4 text-sm text-danger">{(error as Error).message}</p>}
      {isLoading || !data ? (
        loadingBlock
      ) : (
        <div className="space-y-5 lg:space-y-6">
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
            <StatTile icon={Users} label="Customers who bought" value={String(data.totals.customers)} sub={`${data.totals.registered} with an account · ${data.totals.guests} guests`} />
            <StatTile icon={UserPlus} label="First-time buyers" value={String(data.totals.newCustomers)} sub={`${data.totals.signups} new sign-ups in the period`} />
            <StatTile icon={Repeat} label="Returning buyers" value={String(data.totals.returningCustomers)} sub={`${data.totals.repeatInPeriod} ordered more than once`} />
            <StatTile icon={Wallet} label="Average spend" value={inr(data.totals.avgSpend)} sub={`${data.totals.orders} orders · ${inr(data.totals.revenue)}`} />
          </div>

          <Card icon={UsersRound} title="Top customers" padded={false}>
            <div className="px-5 pb-4">
              <DataTable
                bare
                minWidth="40rem"
                rows={data.topCustomers}
                rowKey={(r) => r.email}
                empty="No sales in this period."
                columns={[
                  {
                    key: 'n',
                    header: 'Customer',
                    cell: (r) => (
                      <span className="block min-w-0">
                        {r.userId ? (
                          <Link to={`/admin/customers/${r.userId}`} className="font-medium text-ink hover:text-wine">{r.name}</Link>
                        ) : (
                          <Link to={`/admin/orders?q=${encodeURIComponent(r.email)}`} className="font-medium text-ink hover:text-wine">{r.name}</Link>
                        )}
                        <span className="block truncate text-xs text-muted">{r.email}{r.phone ? ` · ${formatIndianMobile(r.phone)}` : ''}</span>
                      </span>
                    ),
                  },
                  { key: 't', header: 'Type', cell: (r) => <span className="flex flex-wrap gap-1.5">{r.returning ? <Badge tone="gold">Returning</Badge> : <Badge tone="success">New</Badge>}{!r.userId && <Badge>Guest</Badge>}</span> },
                  { key: 'o', header: 'Orders', cell: (r) => r.orders },
                  { key: 'l', header: 'Last order', cell: (r) => <span className="whitespace-nowrap text-muted">{formatDate(r.lastOrderAt)}</span> },
                  { key: 'r', header: 'Spent', className: 'text-right', cell: (r) => <span className="font-semibold text-ink tabular">{inr(r.revenue)}</span> },
                ]}
              />
            </div>
          </Card>

          <Card icon={MapPin} title="Where orders go" padded={false}>
            <div className="px-5 pb-4">
              <DataTable
                bare
                minWidth="30rem"
                rows={data.byState}
                rowKey={(r) => r.state}
                empty="No sales in this period."
                columns={[
                  { key: 's', header: 'State', cell: (r) => <span className="font-medium text-ink">{r.state}</span> },
                  { key: 'c', header: 'Customers', cell: (r) => r.customers },
                  { key: 'o', header: 'Orders', cell: (r) => r.orders },
                  { key: 'h', header: 'Share', cell: (r) => <Share value={r.revenue} total={data.totals.revenue} /> },
                  { key: 'r', header: 'Revenue', className: 'text-right', cell: (r) => <span className="tabular">{inr(r.revenue)}</span> },
                ]}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
