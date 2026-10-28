import { useQuery } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  ChartColumnIncreasing,
  ChartNoAxesCombined,
  CircleCheck,
  CircleDashed,
  Copy,
  CreditCard,
  EllipsisVertical,
  ExternalLink,
  Inbox,
  Package,
  PackageOpen,
  PlugZap,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Star,
  TriangleAlert,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { PURITIES, type ImageRef, type OrderStatus, type OrderSummaryDTO } from '@goldshop/shared';
import { LotusMark } from '../../components/AboutLegacy';
import { Img, Skeleton } from '../../components/ui/misc';
import { api } from '../../lib/api';
import { useGoldRates, useMe, useSettings } from '../../lib/hooks';
import { cn, formatDateTime, inr } from '../../lib/utils';
import bangles from '../assets/dashboard-bangles.webp';
import { BarChart, Sparkline } from '../Chart';
import { can } from '../lib';
import { AdminSelect, ArrowLink, Badge, ButtonLink, Card, DataTable, IconTile, Menu, MenuItem, OrderStatusBadge, cardClass } from '../ui';

interface Totals {
  revenue: number;
  orders: number;
}

interface DashboardData {
  today: Totals;
  yesterday: Totals;
  last7: Totals;
  prev7: Totals;
  last30: Totals;
  prev30: Totals;
  series: { date: string; revenue: number; orders: number }[];
  statusCounts: Partial<Record<OrderStatus, number>>;
  toFulfil: number;
  oldestOpenAt: string | null;
  lowStock: { productId: string; name: string; sku: string; label: string; stock: number }[];
  topProducts: { productId: string; name: string; image?: ImageRef; units: number; revenue: number }[];
  recentOrders: (OrderSummaryDTO & { customerName: string; invoiceNumber?: string })[];
  pending: { enquiries: number; reviews: number; paymentReview: number };
  goldRatesUpdatedAt: string | null;
  ratesStale: boolean;
  integrations: { razorpay: boolean; razorpayWebhook: boolean; email: boolean; cod: boolean };
}

/** Percentage change, or null when there was nothing to compare against. */
function change(now: number, before: number): number | null {
  if (before === 0) return now === 0 ? 0 : null;
  return ((now - before) / before) * 100;
}

function Delta({ pct, digits = 0 }: { pct: number | null; digits?: number }) {
  if (pct === null) {
    return (
      <Badge tone="success">
        <ArrowUp className="size-3" strokeWidth={2.4} aria-hidden /> New
      </Badge>
    );
  }
  const rounded = Number(pct.toFixed(digits));
  const tone = rounded > 0 ? 'success' : rounded < 0 ? 'danger' : 'neutral';
  const Icon = rounded > 0 ? ArrowUp : rounded < 0 ? ArrowDown : null;
  return (
    <Badge tone={tone}>
      {Icon && <Icon className="size-3" strokeWidth={2.4} aria-hidden />}
      <span className="sr-only">{rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'no change,'}</span>
      {Math.abs(rounded).toFixed(digits)}%
    </Badge>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  pill,
  compare,
  spark,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  pill: ReactNode;
  compare: string;
  spark?: { values: number[]; trend: 'up' | 'down' | 'flat' };
}) {
  return (
    <div className={cn(cardClass, 'flex flex-col p-5')}>
      <div className="flex gap-4">
        <IconTile icon={icon} />
        <div className="min-w-0">
          <p className="text-sm text-ink-2">{label}</p>
          <p className="mt-0.5 font-display text-[2rem] font-semibold leading-tight text-ink tabular">{value}</p>
          <p className="mt-0.5 text-[0.8125rem] text-muted">{sub}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2.5">
        {pill}
        <span className="min-w-0 flex-1 text-xs leading-tight text-muted">{compare}</span>
        {spark && <Sparkline values={spark.values} trend={spark.trend} className="h-8 w-16 shrink-0" />}
      </div>
    </div>
  );
}

/** Stacked gold bars, drawn to sit with the lucide icons. */
function GoldBarsIcon({ className, strokeWidth = 1.6 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" className={className} aria-hidden>
      <path d="M2.5 20.5 4 15.5h6.5l1.5 5Z" />
      <path d="M12 20.5l1.5-5H20l1.5 5Z" />
      <path d="M7.25 15.5l1.5-5h6.5l1.5 5" />
      <path d="M17.5 4.5v3M16 6h3" />
    </svg>
  );
}

const trendOf = (pct: number | null): 'up' | 'down' | 'flat' => (pct === null || pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat');

function waitingFor(iso: string): string {
  const hours = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (hours < 1) return 'under 1h';
  if (hours < 24) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDay = (iso: string) => `${iso.slice(8, 10)} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).toUpperCase();

export default function Dashboard() {
  const { user } = useMe();
  const { data: settings } = useSettings();
  const rates = useGoldRates();
  const navigate = useNavigate();
  const [range, setRange] = useState('30');
  const [table, setTable] = useState(false);
  const { data: d, isLoading, refetch, isFetching } = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: () => api<DashboardData>('/admin/dashboard'), refetchInterval: 120_000 });

  if (isLoading || !d) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-12 w-72 rounded-lg" />
        <Skeleton className="h-28 rounded-2xl" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const role = user?.role;

  const attention = [
    d.ratesStale && can(role, 'rates:write') && { icon: TriangleAlert, danger: true, text: <><strong className="font-semibold text-ink">Gold rates</strong> haven’t been updated in the last 24 hours.</>, to: '/admin/gold-rates', cta: 'Update rates' },
    d.pending.paymentReview > 0 && { icon: CreditCard, danger: true, text: `${d.pending.paymentReview} order(s) need payment review.`, to: '/admin/orders?status=payment_review', cta: 'Review payments' },
    d.toFulfil > 0 && { icon: Package, text: `${d.toFulfil} order(s) to prepare and ship.`, to: '/admin/orders?status=open', cta: 'Open orders' },
    d.pending.enquiries > 0 && { icon: Inbox, text: `${d.pending.enquiries} new enquiry(ies) waiting for a reply.`, to: '/admin/enquiries', cta: 'View enquiries' },
    d.pending.reviews > 0 && { icon: Star, text: `${d.pending.reviews} review(s) awaiting approval.`, to: '/admin/reviews', cta: 'Moderate' },
  ].filter(Boolean) as { icon: LucideIcon; danger?: boolean; text: ReactNode; to: string; cta: string }[];

  const vsToday = change(d.today.revenue, d.yesterday.revenue);
  const vs7 = change(d.last7.revenue, d.prev7.revenue);
  const vs30 = change(d.last30.revenue, d.prev30.revenue);
  const daily = d.series.map((s) => s.revenue);
  const confirmed = d.statusCounts.confirmed ?? 0;
  const processing = d.statusCounts.processing ?? 0;
  const oldestDays = d.oldestOpenAt ? (Date.now() - new Date(d.oldestOpenAt).getTime()) / 86_400_000 : 0;

  const days = Number(range);
  const chart = d.series.slice(-days).map((s) => ({ label: fmtDay(s.date), tick: fmtDay(s.date), value: s.revenue, secondary: `${s.orders} orders` }));

  const shownRates = (settings?.displayRates ?? []).filter((k) => rates.data?.rates[k]);
  const rateAt = rates.data?.updatedAt ?? d.goldRatesUpdatedAt;

  const integrations = [
    { label: 'Online payments (Razorpay)', ok: d.integrations.razorpay, hint: 'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET' },
    { label: 'Payment webhook', ok: d.integrations.razorpayWebhook, hint: 'Set RAZORPAY_WEBHOOK_SECRET and add the webhook in Razorpay' },
    { label: 'Order emails (SMTP)', ok: d.integrations.email, hint: 'Set SMTP_HOST and MAIL_FROM' },
    { label: 'Cash on delivery', ok: d.integrations.cod, hint: 'Enable in Settings → Checkout' },
  ];

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="relative">
        <img
          src={bangles}
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 hidden h-[9.5rem] w-auto select-none [mask-image:linear-gradient(to_right,transparent,#000_38%)] xl:block"
        />
        <div className="relative">
          <h1 className="font-display text-[2.125rem] font-semibold leading-tight text-ink md:text-[2.75rem]">
            Good {greeting}, {user?.name.split(' ')[0]} <span aria-hidden className="inline-block origin-[70%_70%] text-[0.8em]">👋</span>
          </h1>
          <p className="mt-1 text-[0.9375rem] text-muted md:text-base">Here’s what’s happening with your store today.</p>
        </div>
      </div>

      {/* ------------------------------------------------------------ needs attention */}
      <section aria-labelledby="attention" className="relative z-10 overflow-hidden rounded-2xl border border-[#f0e2c8] bg-cream-2 shadow-[0_1px_2px_rgba(30,24,19,.04)]">
        <div className="flex">
          <div className="hidden w-[6.5rem] shrink-0 place-items-center bg-cream sm:grid">
            <ChartNoAxesCombined className="size-10 text-gold" strokeWidth={1.5} aria-hidden />
          </div>
          <div className="min-w-0 flex-1 px-5 py-4 sm:px-6 lg:pr-56">
            <h2 id="attention" className="font-display text-[1.375rem] font-semibold text-ink">
              {attention.length ? 'Needs attention' : 'All caught up'}
            </h2>
            {attention.length === 0 ? (
              <p className="mt-1.5 flex items-center gap-2.5 text-[0.9375rem] text-ink-2">
                <CircleCheck className="size-4.5 shrink-0 text-success" aria-hidden /> Nothing needs your attention right now.
              </p>
            ) : (
              <ul className="mt-2 space-y-2.5">
                {attention.map((a) => (
                  <li key={a.to} className="flex flex-wrap items-center gap-x-6 gap-y-1">
                    <span className="flex min-w-0 flex-1 basis-60 items-start gap-2.5 text-[0.9375rem] leading-snug text-ink-2">
                      <a.icon className={cn('mt-0.5 size-4.5 shrink-0', a.danger ? 'text-alert' : 'text-wine')} strokeWidth={1.9} aria-hidden />
                      <span>{a.text}</span>
                    </span>
                    <ArrowLink to={a.to} className="ml-7 sm:ml-0">{a.cta}</ArrowLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <LotusMark className="pointer-events-none absolute -bottom-6 right-2 hidden w-52 text-gold opacity-25 lg:block" />
      </section>

      {/* ------------------------------------------------------------ stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5 2xl:grid-cols-4">
        <StatCard
          icon={ShoppingBag}
          label="Today"
          value={inr(d.today.revenue)}
          sub={`${d.today.orders} orders`}
          pill={<Delta pct={vsToday} />}
          compare="vs yesterday"
          spark={{ values: daily.slice(-7), trend: trendOf(vsToday) }}
        />
        <StatCard
          icon={ChartColumnIncreasing}
          label="Last 7 days"
          value={inr(d.last7.revenue)}
          sub={`${d.last7.orders} orders`}
          pill={<Delta pct={vs7} />}
          compare="vs previous 7 days"
          spark={{ values: daily.slice(-14), trend: trendOf(vs7) }}
        />
        <StatCard
          icon={CalendarDays}
          label="Last 30 days"
          value={inr(d.last30.revenue)}
          sub={`${d.last30.orders} orders · avg ${d.last30.orders ? inr(Math.round(d.last30.revenue / d.last30.orders / 100) * 100) : '—'}`}
          pill={<Delta pct={vs30} />}
          compare="vs previous 30 days"
          spark={{ values: daily.slice(-30), trend: trendOf(vs30) }}
        />
        <StatCard
          icon={Truck}
          label="To fulfil"
          value={String(d.toFulfil)}
          sub={`${confirmed} confirmed · ${processing} being prepared`}
          pill={
            d.oldestOpenAt ? (
              <Badge tone={oldestDays >= 2 ? 'warn' : 'neutral'}>{waitingFor(d.oldestOpenAt)}</Badge>
            ) : (
              <Badge tone="success"><CircleCheck className="size-3" strokeWidth={2.4} aria-hidden /> Clear</Badge>
            )
          }
          compare={d.oldestOpenAt ? 'oldest order waiting' : 'nothing waiting to ship'}
        />
      </div>

      {/* ------------------------------------------------------------ revenue + gold rates */}
      <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,23rem)]">
        <Card
          icon={ChartColumnIncreasing}
          title={`Revenue, last ${days} days`}
          actions={
            <>
              <AdminSelect
                value={range}
                onChange={setRange}
                aria-label="Chart period"
                className="w-36"
                options={[
                  { value: '7', label: 'Last 7 days' },
                  { value: '30', label: 'Last 30 days' },
                  { value: '90', label: 'Last 90 days' },
                ]}
              />
              <button
                type="button"
                onClick={() => setTable((t) => !t)}
                className="inline-flex h-10 items-center gap-1 rounded-lg border border-field px-3 text-[0.8125rem] font-semibold text-ink-2 underline decoration-ink/25 underline-offset-4 transition-colors hover:border-line-strong hover:text-ink"
              >
                {table ? 'Show chart' : 'Show table'} <ArrowRight className="size-3.5" aria-hidden />
              </button>
            </>
          }
        >
          <BarChart title={`Revenue, last ${days} days`} data={chart} table={table} />
          <p className="mt-2 text-xs text-muted">Confirmed orders only (not unpaid or cancelled). Days are IST.</p>
        </Card>

        <Card
          icon={GoldBarsIcon}
          title="Gold rates"
          actions={can(role, 'rates:write') && <ButtonLink to="/admin/gold-rates" variant="secondary" size="sm">Update</ButtonLink>}
        >
          {shownRates.length === 0 ? (
            <p className="py-6 text-sm text-muted">No rates set yet.</p>
          ) : (
            <dl className="divide-y divide-hairline">
              {shownRates.map((k) => {
                const now = rates.data!.rates[k]!;
                const before = rates.data?.previous?.[k];
                return (
                  <div key={k} className="grid grid-cols-[minmax(0,1fr)_auto_4.5rem] items-center gap-3 py-3">
                    <dt className="truncate text-[0.9375rem] text-ink-2">{PURITIES[k].name}</dt>
                    <dd className="text-[0.9375rem] font-semibold text-ink tabular">{inr(now)}/g</dd>
                    <dd className="text-right">{before ? <Delta pct={change(now, before)} digits={1} /> : <span className="text-xs text-subtle" title="Shown once there is a day of rate history">—</span>}</dd>
                  </div>
                );
              })}
            </dl>
          )}
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-hairline pt-3">
            <p className={cn('text-[0.8125rem]', d.ratesStale ? 'font-semibold text-warn' : 'text-muted')}>
              {rateAt ? `Last updated: ${formatDateTime(rateAt)}` : 'Not set yet'}
            </p>
            <button
              type="button"
              onClick={() => {
                void rates.refetch();
                void refetch();
              }}
              className="grid size-8 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-canvas hover:text-wine"
              aria-label="Refresh rates"
            >
              <RefreshCw className={cn('size-4', (rates.isFetching || isFetching) && 'animate-spin')} aria-hidden />
            </button>
          </div>
          {rates.data && !rates.data.previous && <p className="mt-1 text-xs text-subtle">Day-on-day change appears once there is a day of rate history.</p>}
        </Card>
      </div>

      {/* ------------------------------------------------------------ recent orders + top products */}
      <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,23rem)]">
        <Card icon={Receipt} title="Recent orders" actions={<ArrowLink to="/admin/orders">View all</ArrowLink>} padded={false}>
          <div className="px-5 pb-4">
            <DataTable
              bare
              minWidth="38rem"
              rows={d.recentOrders}
              rowKey={(o) => o.orderNumber}
              onRowClick={(o) => navigate(`/admin/orders/${o.orderNumber}`)}
              empty="No orders yet."
              columns={[
                { key: 'n', header: '#', cell: (o) => <span className="whitespace-nowrap font-semibold text-ink">{o.orderNumber}</span> },
                { key: 'c', header: 'Customer', cell: (o) => <span className="block max-w-[12rem] truncate">{o.customerName}</span> },
                { key: 'i', header: 'Items', cell: (o) => `${o.itemCount} item${o.itemCount === 1 ? '' : 's'}` },
                { key: 't', header: 'Amount', cell: (o) => <span className="font-medium text-ink tabular">{inr(o.total)}</span> },
                { key: 's', header: 'Status', cell: (o) => <OrderStatusBadge status={o.status} /> },
                {
                  key: 'd',
                  header: 'Date',
                  cell: (o) => (
                    <span className="whitespace-nowrap leading-snug">
                      {fmtDate(o.createdAt)}
                      <span className="block text-xs text-muted">{fmtTime(o.createdAt)}</span>
                    </span>
                  ),
                },
                {
                  key: 'a',
                  header: <span className="sr-only">Actions</span>,
                  className: 'w-px pr-2 text-right',
                  cell: (o) => (
                    <Menu
                      label={`Actions for order ${o.orderNumber}`}
                      triggerClassName="grid size-8 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-canvas hover:text-ink"
                      trigger={<EllipsisVertical className="size-4.5" aria-hidden />}
                    >
                      <MenuItem to={`/admin/orders/${o.orderNumber}`} icon={Receipt}>View order</MenuItem>
                      {o.invoiceNumber && <MenuItem to={`/orders/${o.orderNumber}/invoice`} newTab icon={ExternalLink}>Invoice {o.invoiceNumber}</MenuItem>}
                      <MenuItem
                        icon={Copy}
                        onSelect={() => {
                          void navigator.clipboard?.writeText(o.orderNumber).then(() => toast.success('Order number copied'));
                        }}
                      >
                        Copy order number
                      </MenuItem>
                    </Menu>
                  ),
                },
              ]}
            />
          </div>
        </Card>

        <Card
          title={
            <>
              Top products <span className="font-sans text-[0.8125rem] font-normal text-muted">(last 30 days)</span>
            </>
          }
          actions={<ArrowLink to={can(role, 'reports:read') ? '/admin/reports/products' : '/admin/products'}>View all</ArrowLink>}
        >
          {d.topProducts.length === 0 ? (
            <p className="py-6 text-sm text-muted">No sales in the last 30 days yet.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {d.topProducts.map((p) => (
                <li key={p.productId}>
                  <Link to={`/admin/products/${p.productId}`} className="group flex items-center gap-3.5 py-2.5">
                    <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-canvas">
                      <Img image={p.image} sizes="48px" width={480} className="size-full object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.9375rem] font-medium text-ink group-hover:text-wine">{p.name}</span>
                      <span className="block text-[0.8125rem] text-muted">{p.units} sold</span>
                    </span>
                    <span className="font-semibold text-ink tabular">{inr(p.revenue)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ------------------------------------------------------------ stock + setup */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <Card icon={PackageOpen} title="Low stock" actions={<ArrowLink to="/admin/inventory?filter=low">Inventory</ArrowLink>}>
          {d.lowStock.length === 0 ? (
            <p className="flex items-center gap-2 py-2 text-sm text-muted">
              <CircleCheck className="size-4 text-success" aria-hidden /> Everything is well stocked.
            </p>
          ) : (
            <ul className="divide-y divide-hairline text-sm">
              {d.lowStock.map((l) => (
                <li key={l.sku} className="flex items-center justify-between gap-3 py-2.5">
                  <Link to={`/admin/products/${l.productId}`} className="min-w-0 truncate text-ink-2 hover:text-wine">
                    {l.name}
                    {l.label !== 'Standard' ? ` · ${l.label}` : ''}
                  </Link>
                  <Badge tone={l.stock === 0 ? 'danger' : 'warn'}>{l.stock === 0 ? 'Sold out' : `${l.stock} left`}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card icon={PlugZap} title="Store setup">
          <ul className="space-y-3 text-sm">
            {integrations.map((i) => (
              <li key={i.label} className="flex items-start gap-2.5">
                {i.ok ? <CircleCheck className="mt-0.5 size-4.5 shrink-0 text-success" aria-hidden /> : <CircleDashed className="mt-0.5 size-4.5 shrink-0 text-subtle" aria-hidden />}
                <span>
                  <span className="font-semibold text-ink">{i.label}</span>
                  <span className="block text-xs text-muted">{i.ok ? 'Configured' : `Not configured — ${i.hint}`}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
