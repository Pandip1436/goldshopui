import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  ClipboardList,
  Eye,
  EyeOff,
  Gift,
  Heart,
  House,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Package,
  PackageCheck,
  PackageOpen,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trash2,
  Truck,
  UserRound,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import {
  INDIAN_STATES,
  savedAddressSchema,
  type CartDTO,
  type MyOrdersResponse,
  type OrderGroup,
  type OrderStatus,
  type OrderSummaryDTO,
  type SavedAddressDTO,
  type SessionUser,
} from '@goldshop/shared';
import type { z } from 'zod';
import { LotusMark } from '../components/AboutLegacy';
import { Seo } from '../components/Seo';
import { Button, ButtonLink } from '../components/ui/Button';
import { Dropdown } from '../components/ui/Dropdown';
import { Checkbox, Field, FormError, Input } from '../components/ui/Form';
import { FormDropdown } from '../components/ui/FormDropdown';
import { PageFade } from '../components/ui/Motion';
import { Modal } from '../components/ui/Sheet';
import { Breadcrumbs, EmptyState, Img, Skeleton } from '../components/ui/misc';
import { ApiError, api, errorMessage } from '../lib/api';
import { qk, useDebounced, useMe, useSettings, useWishlist } from '../lib/hooks';
import { useUI } from '../lib/ui';
import { cn, formatDate, formatGrams, inr, purityLabel } from '../lib/utils';

const TABS = [
  { key: 'orders', label: 'Orders', icon: Package, title: 'My Orders', intro: 'Track, view and manage all your jewellery orders in one place.' },
  { key: 'addresses', label: 'Addresses', icon: MapPin, title: 'My Addresses', intro: 'Delivery addresses saved for a quicker checkout.' },
  { key: 'profile', label: 'Profile', icon: UserRound, title: 'My Profile', intro: 'Your details, password and email preferences.' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

export default function Account() {
  const { user, isLoading } = useMe();
  const { data: s } = useSettings();
  const wl = useWishlist();
  const [sp, setSp] = useSearchParams();
  const tab = TABS.find((t) => t.key === sp.get('tab')) ?? TABS[0];
  const qc = useQueryClient();
  const navigate = useNavigate();

  if (isLoading) return <div className="container-page py-16"><Skeleton className="h-64 w-full" /></div>;
  if (!user) return <Navigate to="/login?next=/account" replace />;

  const go = (key: TabKey) => setSp({ tab: key });
  const signOut = async () => {
    await api('/auth/logout', { method: 'POST' });
    qc.clear();
    navigate('/');
  };
  const item = 'flex shrink-0 items-center gap-3.5 rounded-lg px-4 py-2.5 text-left text-[0.9375rem] transition-colors lg:py-3';
  const idle = 'border border-line text-ink-2 hover:bg-sand/70 hover:text-ink lg:border-transparent';

  return (
    <PageFade>
      <Seo title="My account" noindex />
      <div className="relative overflow-hidden">
        {s?.accountPage.image && (
          <div
            aria-hidden
            className="absolute right-0 top-0 hidden h-[19rem] w-[50%] [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,black_40%),linear-gradient(to_top,transparent,black_40%)] lg:block"
          >
            <Img image={s.accountPage.image} priority sizes="50vw" width={1600} className="size-full object-cover" />
          </div>
        )}

        <div className="container-page relative grid grid-cols-[minmax(0,1fr)] gap-8 pb-16 pt-6 md:pb-24 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:gap-10 lg:pt-8 xl:grid-cols-[19.5rem_minmax(0,1fr)]">
          {/* ------------------------------------------------------------ sidebar */}
          <aside className="min-w-0 space-y-5">
            <div className="rounded-2xl border border-line/80 bg-paper p-4 shadow-[0_24px_50px_-40px_rgba(63,18,21,.55)] sm:p-5">
              <div className="flex items-center gap-4 lg:block">
                <div className="flex items-start justify-between">
                  <span aria-hidden className="grid size-14 place-items-center rounded-full bg-gradient-to-b from-[#c9a052] to-[#a57a2c] font-display text-[1.75rem] font-semibold text-white">
                    {user.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={() => go('profile')}
                    aria-label="Edit your details"
                    className="hidden size-9 place-items-center rounded-md border border-line-strong/60 text-ink-2 transition-colors hover:border-gold hover:text-gold-deep lg:grid"
                  >
                    <Pencil className="size-4" strokeWidth={1.6} />
                  </button>
                </div>
                <div className="min-w-0 lg:mt-4">
                  <h2 className="min-w-0">
                    <span className="block text-sm font-normal text-ink-2">Hello,</span>{' '}
                    <span className="block truncate font-display text-[1.625rem] font-semibold leading-tight text-ink lg:text-[1.875rem]">{user.name.split(' ')[0]}</span>
                  </h2>
                  <p className="truncate text-sm text-muted">{user.email}</p>
                </div>
              </div>

              <nav aria-label="Account" className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:-mx-5 sm:px-5 lg:mx-0 lg:mt-5 lg:block lg:space-y-1 lg:overflow-visible lg:px-0 lg:pb-0">
                {TABS.map((t) => {
                  const on = tab.key === t.key;
                  return (
                    <button key={t.key} type="button" onClick={() => go(t.key)} aria-current={on ? 'page' : undefined} className={cn(item, 'lg:w-full', on ? 'bg-maroon text-ivory shadow-[0_10px_20px_-14px_rgba(63,18,21,.9)]' : idle)}>
                      <t.icon className={cn('size-5', on ? 'text-gold-soft' : 'text-gold-deep')} strokeWidth={1.5} aria-hidden />
                      <span className="flex-1">{t.label}</span>
                      <ChevronRight className={cn('hidden size-4 lg:block', on ? 'text-ivory' : 'text-subtle')} aria-hidden />
                    </button>
                  );
                })}
                <Link to="/wishlist" className={cn(item, idle)}>
                  <Heart className="size-5 text-gold-deep" strokeWidth={1.5} aria-hidden />
                  <span className="flex-1">Wishlist</span>
                  {wl.ids.length > 0 && (
                    <span className="grid min-w-6 place-items-center rounded-full bg-maroon px-1.5 text-xs font-bold leading-6 text-ivory">
                      {wl.ids.length}
                    </span>
                  )}
                </Link>
                {user.role !== 'customer' && (
                  <Link to="/admin" className={cn(item, idle)}>
                    <ShieldCheck className="size-5 text-gold-deep" strokeWidth={1.5} aria-hidden />
                    <span className="flex-1">Store admin</span>
                  </Link>
                )}
                <span aria-hidden className="mx-4 my-3 hidden h-px bg-line lg:block" />
                <button type="button" onClick={signOut} className={cn(item, idle, 'lg:w-full')}>
                  <LogOut className="size-5 text-gold-deep" strokeWidth={1.5} aria-hidden />
                  <span className="flex-1">Sign out</span>
                </button>
              </nav>
            </div>
            <NewPiecesCard user={user} />
          </aside>

          {/* -------------------------------------------------------------- main */}
          <div className="min-w-0">
            <header className="lg:min-h-[8.5rem]">
              <Breadcrumbs
                items={[{ label: 'Home', to: '/' }, { label: 'My Account', to: '/account' }, { label: tab.title }]}
                className="mb-4 text-[0.8125rem]"
              />
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.28em] text-gold-deep">My account</p>
              <h1 className="mt-2 font-display text-[clamp(2.25rem,1.6rem+2.2vw,3.5rem)] font-semibold leading-[1.05] text-ink">{tab.title}</h1>
              <p className="mt-2 text-[1rem] text-ink-2">{tab.intro}</p>
            </header>
            <div className="mt-6">
              {tab.key === 'orders' && <Orders />}
              {tab.key === 'addresses' && <Addresses />}
              {tab.key === 'profile' && <Profile user={user} />}
            </div>
          </div>
        </div>
      </div>
    </PageFade>
  );
}

/**
 * Sidebar card about new pieces. It only asks for what the customer hasn't already given: email
 * permission first, then simply points to the newest pieces.
 */
function NewPiecesCard({ user }: { user: SessionUser }) {
  const qc = useQueryClient();
  const optIn = useMutation({
    mutationFn: () => api('/account/profile', { method: 'PATCH', body: { name: user.name, phone: user.phone ?? '', marketingConsent: true } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me });
      toast.success('Done — we’ll email you about new arrivals. You can turn this off in your profile.');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const btn = 'mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-gradient-to-b from-[#ecd08f] to-[#c39a4a] px-4 text-sm font-semibold text-maroon transition-[filter] hover:brightness-105 disabled:opacity-60';
  return (
    <div className="relative hidden overflow-hidden rounded-2xl bg-gradient-to-br from-maroon-2 to-maroon p-6 text-ivory shadow-[0_30px_60px_-40px_rgba(63,18,21,.9)] lg:block">
      <LotusMark className="pointer-events-none absolute -bottom-8 -right-6 w-40 text-gold-soft opacity-20" />
      <Gift className="pointer-events-none absolute right-5 top-5 size-16 text-gold-soft/80" strokeWidth={0.9} aria-hidden />
      <p className="relative max-w-[12rem] font-display text-[1.5rem] font-semibold leading-tight">{user.marketingConsent ? 'New pieces, first' : 'Hear about new pieces first'}</p>
      <p className="relative mt-2 max-w-[13rem] text-sm leading-relaxed text-ivory/80">
        {user.marketingConsent ? 'See what’s just arrived, priced at today’s gold rate.' : 'Get an occasional email when new collections arrive. Unsubscribe any time.'}
      </p>
      {user.marketingConsent ? (
        <Link to="/shop?sort=newest" className={cn(btn, 'relative')}>
          Explore new arrivals <ArrowRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <button type="button" onClick={() => optIn.mutate()} disabled={optIn.isPending} className={cn(btn, 'relative')}>
          {optIn.isPending ? 'Saving…' : 'Email me'} <ArrowRight className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- orders */

const GROUPS: { key: 'all' | OrderGroup; label: string }[] = [
  { key: 'all', label: 'All orders' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const SORTS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'amount_desc', label: 'Highest amount' },
  { key: 'amount_asc', label: 'Lowest amount' },
];

function Orders() {
  const [group, setGroup] = useState<'all' | OrderGroup>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const q = useDebounced(query.trim(), 300);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['my-orders', group, q, sort, page],
    queryFn: () => api<MyOrdersResponse>('/account/orders', { query: { status: group === 'all' ? undefined : group, q: q || undefined, sort, page } }),
    placeholderData: (prev) => prev,
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data?.counts.all) {
    return (
      <EmptyState title="No orders yet" action={<ButtonLink to="/shop">Start shopping</ButtonLink>}>
        Your orders will appear here.
      </EmptyState>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-2.5 rounded-xl border border-line/70 bg-paper/90 p-2.5 backdrop-blur-sm 2xl:flex-row 2xl:items-center">
        <div role="tablist" aria-label="Order status" className="-mx-2.5 flex gap-2 overflow-x-auto px-2.5 scrollbar-none 2xl:mx-0 2xl:min-w-0 2xl:flex-1 2xl:px-0">
          {GROUPS.map((g) => {
            const on = group === g.key;
            return (
              <button
                key={g.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setGroup(g.key);
                  setPage(1);
                }}
                className={cn(
                  'h-10 shrink-0 whitespace-nowrap rounded-md border px-3.5 text-[0.875rem] transition-colors',
                  on ? 'border-maroon bg-maroon font-semibold text-ivory' : 'border-line bg-paper text-ink-2 hover:border-gold hover:text-ink',
                )}
              >
                {g.label} ({data.counts[g.key]})
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1 2xl:w-48 2xl:flex-none">
            <span className="sr-only">Search orders</span>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search orders…"
              className="h-10 w-full rounded-md border border-line bg-white pl-3.5 pr-9 text-sm focus:border-ink focus:outline-none"
            />
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          </label>
          <div className="shrink-0">
            <Dropdown
              aria-label="Sort orders"
              size="sm"
              className="min-w-[10.5rem]"
              value={sort}
              onChange={(v) => {
                setSort(v);
                setPage(1);
              }}
              options={SORTS.map((o) => ({ value: o.key, label: o.label }))}
            />
          </div>
        </div>
      </div>

      {data.items.length === 0 ? (
        <p className="py-14 text-center text-sm text-muted">No orders match. Try another status or search.</p>
      ) : (
        <ul className={cn('mt-4 space-y-4 transition-opacity', isFetching && 'opacity-60')}>
          {data.items.map((o) => (
            <OrderCard key={o.orderNumber} order={o} />
          ))}
        </ul>
      )}

      {data.pages > 1 && (
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Newer
          </Button>
          <Button variant="secondary" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
            Older
          </Button>
        </div>
      )}
    </div>
  );
}

const dayMonth = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
const short = (iso?: string) => (iso ? dayMonth.format(new Date(iso)) : '');

const PILL: Record<OrderStatus, { label: string; cls: string }> = {
  pending_payment: { label: 'Awaiting payment', cls: 'bg-warn-bg text-warn' },
  payment_review: { label: 'Payment review', cls: 'bg-warn-bg text-warn' },
  confirmed: { label: 'Confirmed', cls: 'bg-gold-pale/70 text-gold-deep' },
  processing: { label: 'Processing', cls: 'bg-gold-pale/70 text-gold-deep' },
  shipped: { label: 'In transit', cls: 'bg-gold-pale/70 text-gold-deep' },
  out_for_delivery: { label: 'Out for delivery', cls: 'bg-gold-pale/70 text-gold-deep' },
  delivered: { label: 'Delivered', cls: 'bg-success-bg text-success' },
  cancelled: { label: 'Cancelled', cls: 'bg-sand text-ink-2' },
  returned: { label: 'Returned', cls: 'bg-sand text-ink-2' },
};

/** How far along the four customer-facing stages an order is. */
const REACHED: Partial<Record<OrderStatus, number>> = {
  pending_payment: 0,
  payment_review: 0,
  confirmed: 0,
  processing: 1,
  shipped: 2,
  out_for_delivery: 2,
  delivered: 3,
};

const STEPS: { key: 'placed' | 'processing' | 'shipped' | 'delivered'; label: string; icon: LucideIcon }[] = [
  { key: 'placed', label: 'Order placed', icon: ClipboardList },
  { key: 'processing', label: 'Processing', icon: PackageOpen },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: PackageCheck },
];

function Progress({ order: o }: { order: OrderSummaryDTO }) {
  const reached = REACHED[o.status];
  if (reached === undefined) {
    const at = o.status === 'returned' ? o.progress?.returned : o.progress?.cancelled;
    return (
      <p className="flex items-center gap-2.5 text-sm text-ink-2">
        <XCircle className="size-5 text-muted" strokeWidth={1.5} aria-hidden />
        {o.status === 'returned' ? 'Returned' : 'Cancelled'}
        {at ? ` on ${formatDate(at)}` : ''}
      </p>
    );
  }
  const done = o.status === 'delivered';
  return (
    <ol className="grid grid-cols-4" aria-label="Order progress">
      {STEPS.map((step, i) => {
        const state = i < reached || (done && i === reached) ? 'done' : i === reached ? 'current' : 'todo';
        const at = o.progress?.[step.key];
        return (
          <li key={step.key} className="relative flex flex-col items-center text-center" aria-current={state === 'current' ? 'step' : undefined}>
            {i > 0 && <span aria-hidden className={cn('absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2', i <= reached ? 'bg-gold' : 'bg-line-strong/60')} />}
            <span
              className={cn(
                'relative grid size-8 place-items-center rounded-full',
                state === 'done' && 'bg-gradient-to-b from-[#d9b872] to-[#a57a2c] text-white',
                state === 'current' && 'bg-maroon text-ivory ring-4 ring-gold-pale',
                state === 'todo' && 'border border-line-strong bg-paper text-subtle',
              )}
            >
              {state === 'done' ? <Check className="size-4" strokeWidth={2.5} aria-hidden /> : <step.icon className="size-4" strokeWidth={1.6} aria-hidden />}
            </span>
            <span className={cn('mt-1.5 text-[0.6875rem] leading-tight', state === 'todo' ? 'text-muted' : 'font-medium text-ink')}>{step.label}</span>
            <span className="text-[0.625rem] text-muted">{state === 'todo' ? '—' : short(at)}</span>
          </li>
        );
      })}
    </ol>
  );
}

function OrderCard({ order: o }: { order: OrderSummaryDTO }) {
  const qc = useQueryClient();
  const { openCart } = useUI();
  const item = o.firstItem;
  const href = `/orders/${o.orderNumber}`;
  const size = item?.variantLabel && !/^(standard|default|one size)$/i.test(item.variantLabel) ? item.variantLabel : undefined;
  const meta = [purityLabel(item?.purity), formatGrams(item?.netWeightMg), size].filter(Boolean);
  const pill = PILL[o.status];

  // Adds what was bought back to the bag; the bag prices it at today's rate and checks stock.
  const buyAgain = useMutation({
    mutationFn: async () => {
      let cart: CartDTO | undefined;
      const failed: string[] = [];
      for (const l of o.lines ?? []) {
        try {
          cart = (await api<{ cart: CartDTO }>('/cart/items', { body: { productId: l.productId, variantId: l.variantId, qty: Math.min(l.qty, 10) } })).cart;
        } catch (e) {
          failed.push(errorMessage(e));
        }
      }
      return { cart, failed };
    },
    onSuccess: ({ cart, failed }) => {
      if (cart) {
        qc.setQueryData(qk.cart, cart);
        qc.invalidateQueries({ queryKey: [...qk.cart, 'quote'] });
        openCart();
      }
      if (failed.length) toast.error(cart ? `Some pieces couldn’t be added: ${failed[0]}` : failed[0]);
    },
  });

  const primary = 'inline-flex h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-maroon px-4 text-sm font-semibold text-ivory transition-colors hover:bg-maroon-2 disabled:opacity-70';
  const secondary = 'inline-flex h-11 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-maroon/40 px-4 text-sm font-semibold text-maroon transition-colors hover:border-maroon hover:bg-maroon/5';
  let action;
  if (o.status === 'shipped' || o.status === 'out_for_delivery' || o.status === 'confirmed' || o.status === 'processing' || o.status === 'payment_review') {
    action = o.trackingUrl ? (
      <a href={o.trackingUrl} target="_blank" rel="noreferrer" className={primary}>
        Track order <ArrowRight className="size-4" aria-hidden />
      </a>
    ) : (
      <Link to={href} className={primary}>
        Track order <ArrowRight className="size-4" aria-hidden />
      </Link>
    );
  } else if (o.status === 'pending_payment') {
    action = (
      <Link to={href} className={primary}>
        Complete payment <ArrowRight className="size-4" aria-hidden />
      </Link>
    );
  } else {
    action = (
      <button type="button" onClick={() => buyAgain.mutate()} disabled={buyAgain.isPending || !o.lines?.length} className={primary}>
        <ShoppingBag className="size-4" strokeWidth={1.7} aria-hidden />
        {buyAgain.isPending ? 'Adding…' : 'Buy again'}
      </button>
    );
  }

  return (
    <li className="grid gap-5 rounded-xl border border-line/70 bg-paper p-4 shadow-[0_18px_40px_-34px_rgba(63,18,21,.5)] sm:p-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] xl:items-center 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)_auto]">
      <div className="flex min-w-0 gap-4">
        <Link to={href} tabIndex={-1} aria-hidden className="size-20 shrink-0 overflow-hidden rounded-lg bg-sand sm:size-24">
          <Img image={item?.image} sizes="96px" width={480} className="size-full object-cover" />
        </Link>
        <div className="min-w-0 py-0.5">
          <Link to={href} className="inline-flex flex-wrap items-center gap-x-1 text-[0.9375rem] font-semibold text-ink hover:text-gold-deep">
            Order #{o.orderNumber} <ChevronRight className="size-4" aria-hidden />
          </Link>
          <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
          <p className="mt-2 truncate font-display text-[1.1875rem] font-semibold leading-snug text-ink">
            {item?.name}
            {o.itemCount > 1 && <span className="font-sans text-sm font-normal text-muted"> + {o.itemCount - 1} more</span>}
          </p>
          {meta.length > 0 && (
            <p className="flex flex-wrap items-center gap-x-2 text-[0.8125rem] text-muted">
              {meta.map((m, i) => (
                <span key={m} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden className="size-1 rounded-full bg-subtle/60" />}
                  {m}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      <Progress order={o} />

      <div className="xl:col-span-2 2xl:col-span-1 2xl:w-64">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[1.25rem] font-bold text-ink tabular">{inr(o.total)}</span>
          <span className={cn('rounded-md px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.12em]', pill.cls)}>{pill.label}</span>
        </div>
        <div className="mt-3 flex gap-2.5">
          {action}
          <Link to={href} className={secondary}>
            View details
          </Link>
        </div>
      </div>
    </li>
  );
}

type AddressForm = z.input<typeof savedAddressSchema>;

const ADDRESS_ICONS: Record<string, LucideIcon> = { home: House, office: Building2, work: Building2 };

function Addresses() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['addresses'], queryFn: () => api<SavedAddressDTO[]>('/account/addresses') });
  const [editing, setEditing] = useState<SavedAddressDTO | 'new' | null>(null);
  const del = useMutation({
    mutationFn: (id: string) => api<SavedAddressDTO[]>(`/account/addresses/${id}`, { method: 'DELETE' }),
    onSuccess: (list) => {
      qc.setQueryData(['addresses'], list);
      toast.success('Address deleted');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const makeDefault = useMutation({
    mutationFn: (a: SavedAddressDTO) =>
      api<SavedAddressDTO[]>(`/account/addresses/${a.id}`, {
        method: 'PATCH',
        body: { label: a.label, fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2 ?? '', landmark: a.landmark ?? '', city: a.city, state: a.state, pincode: a.pincode, isDefault: true },
      }),
    onSuccess: (list) => {
      qc.setQueryData(['addresses'], list);
      toast.success('Default address updated');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
  const action = 'inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[0.8125rem] font-medium transition-colors';
  const full = (data?.length ?? 0) >= 10;

  return (
    <div className="space-y-4">
      {data?.map((a) => {
        const Icon = ADDRESS_ICONS[a.label.trim().toLowerCase()] ?? MapPin;
        return (
          <article key={a.id} className="rounded-xl border border-line/70 bg-paper p-5 shadow-[0_18px_40px_-34px_rgba(63,18,21,.5)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-3 font-display text-[1.375rem] font-semibold text-ink">
                <Icon className="size-6 text-gold-deep" strokeWidth={1.4} aria-hidden />
                {a.label}
                {a.isDefault && <span className="rounded-md bg-gradient-to-b from-[#d9b872] to-[#b8893a] px-2 py-0.5 font-sans text-[0.625rem] font-bold uppercase tracking-[0.12em] text-white">Default</span>}
              </h2>
              <div className="flex flex-wrap items-center gap-1">
                {!a.isDefault && (
                  <button type="button" onClick={() => makeDefault.mutate(a)} disabled={makeDefault.isPending} className={cn(action, 'text-gold-deep hover:bg-gold-pale/40')}>
                    <Star className="size-4" strokeWidth={1.6} aria-hidden /> Set as default
                  </button>
                )}
                <button type="button" onClick={() => setEditing(a)} className={cn(action, 'text-ink hover:bg-sand')} aria-label={`Edit ${a.label} address`}>
                  <Pencil className="size-4" strokeWidth={1.6} aria-hidden /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => window.confirm(`Delete the ${a.label} address?`) && del.mutate(a.id)}
                  className={cn(action, 'text-danger hover:bg-danger-bg')}
                  aria-label={`Delete ${a.label} address`}
                >
                  <Trash2 className="size-4" strokeWidth={1.6} aria-hidden /> Delete
                </button>
              </div>
            </div>
            <dl className="mt-4 space-y-2.5 pl-1 text-[0.9375rem] text-ink-2">
              <div className="flex gap-3.5">
                <dt className="sr-only">Name</dt>
                <UserRound className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.6} aria-hidden />
                <dd>{a.fullName}</dd>
              </div>
              <div className="flex gap-3.5">
                <dt className="sr-only">Address</dt>
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.6} aria-hidden />
                <dd className="leading-relaxed">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ''}
                  {a.landmark ? <><br />Near {a.landmark}</> : null}
                  <br />
                  {a.city}, {a.state} {a.pincode}
                  <br />
                  India
                </dd>
              </div>
              <div className="flex gap-3.5">
                <dt className="sr-only">Phone</dt>
                <Phone className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.6} aria-hidden />
                <dd>{a.phone}</dd>
              </div>
            </dl>
          </article>
        );
      })}

      <button
        type="button"
        onClick={() => setEditing('new')}
        disabled={full}
        className="flex w-full flex-col items-center rounded-xl border-2 border-dashed border-gold/50 bg-paper/60 px-6 py-8 text-center transition-colors hover:border-gold hover:bg-gold-pale/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="grid size-11 place-items-center rounded-full border-2 border-gold text-gold-deep">
          <Plus className="size-5" strokeWidth={1.8} aria-hidden />
        </span>
        <span className="mt-3 font-display text-[1.375rem] font-semibold text-ink">Add a new address</span>
        <span className="mt-0.5 text-sm text-muted">{full ? 'You can save up to 10 addresses.' : 'Save addresses for home, office or family.'}</span>
      </button>
      {editing && <AddressEditor address={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

const STATE_OPTIONS = INDIAN_STATES.map((s) => ({ value: s, label: s }));

function AddressEditor({ address, onClose }: { address: SavedAddressDTO | null; onClose: () => void }) {
  const qc = useQueryClient();
  const form = useForm<AddressForm>({
    resolver: zodResolver(savedAddressSchema),
    defaultValues: address
      ? { ...address, line2: address.line2 ?? '', landmark: address.landmark ?? '', state: address.state as AddressForm['state'] }
      : { label: 'Home', fullName: '', phone: '', line1: '', line2: '', landmark: '', city: '', state: undefined as never, pincode: '', isDefault: false },
  });
  const save = useMutation({
    mutationFn: (v: AddressForm) =>
      address ? api<SavedAddressDTO[]>(`/account/addresses/${address.id}`, { method: 'PATCH', body: v }) : api<SavedAddressDTO[]>('/account/addresses', { body: v }),
    onSuccess: (list) => {
      qc.setQueryData(['addresses'], list);
      onClose();
    },
  });
  const e = form.formState.errors;
  return (
    <Modal open onOpenChange={(v) => !v && onClose()} title={address ? 'Edit address' : 'New address'} wide>
      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="grid gap-4 sm:grid-cols-6" noValidate>
        <Field label="Label" className="sm:col-span-2"><Input {...form.register('label')} placeholder="Home, Office…" /></Field>
        <Field label="Recipient name" error={e.fullName?.message} className="sm:col-span-4"><Input {...form.register('fullName')} autoComplete="name" /></Field>
        <Field label="Mobile" error={e.phone?.message} className="sm:col-span-3"><Input {...form.register('phone')} inputMode="tel" /></Field>
        <Field label="PIN code" error={e.pincode?.message} className="sm:col-span-3"><Input {...form.register('pincode')} inputMode="numeric" maxLength={6} /></Field>
        <Field label="House / flat, building, street" error={e.line1?.message} className="sm:col-span-6"><Input {...form.register('line1')} /></Field>
        <Field label="Area / locality" optional className="sm:col-span-3"><Input {...form.register('line2')} /></Field>
        <Field label="Landmark" optional className="sm:col-span-3"><Input {...form.register('landmark')} /></Field>
        <Field label="City" error={e.city?.message} className="sm:col-span-3"><Input {...form.register('city')} /></Field>
        <Field label="State" error={e.state?.message} className="sm:col-span-3">
          <FormDropdown control={form.control} name="state" autoComplete="address-level1" placeholder="Choose a state" options={STATE_OPTIONS} />
        </Field>
        <Checkbox label="Make this my default address" className="sm:col-span-6" {...form.register('isDefault')} />
        <div className="sm:col-span-6"><FormError>{save.isError ? errorMessage(save.error) : null}</FormError></div>
        <div className="flex justify-end gap-3 sm:col-span-6">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={save.isPending}>Save address</Button>
        </div>
      </form>
    </Modal>
  );
}

/** A mobile number field with a fixed +91 prefix; Field's label and error links reach the input itself. */
function IndianMobileInput({ value, onChange, ...rest }: { value: string; onChange: (v: string) => void; id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) {
  return (
    <div className="flex">
      <span aria-hidden className="grid shrink-0 place-items-center rounded-l-md border border-r-0 border-line-strong/70 bg-sand/50 px-3.5 text-[0.9375rem] text-ink-2">
        +91
      </span>
      <Input {...rest} value={value} onChange={(e) => onChange(e.target.value)} inputMode="tel" autoComplete="tel-national" placeholder="10-digit number" className="!rounded-l-none !rounded-r-md bg-white" />
    </div>
  );
}

function PasswordInput({ value, onChange, autoComplete, placeholder, ...rest }: { value: string; onChange: (v: string) => void; autoComplete: string; placeholder: string; id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input {...rest} type={shown ? 'text' : 'password'} autoComplete={autoComplete} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="!rounded-md bg-white pr-11" />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? 'Hide password' : 'Show password'}
        aria-pressed={shown}
        className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-ink-2 hover:text-ink"
      >
        {shown ? <EyeOff className="size-4.5" strokeWidth={1.6} /> : <Eye className="size-4.5" strokeWidth={1.6} />}
      </button>
    </div>
  );
}

function ProfileSection({ icon: Icon, title, intro, children }: { icon: LucideIcon; title: string; intro: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line/70 bg-paper p-5 shadow-[0_18px_40px_-34px_rgba(63,18,21,.5)] sm:p-6">
      <div className="flex gap-4">
        <Icon className="size-8 shrink-0 text-gold" strokeWidth={1.2} aria-hidden />
        <div>
          <h2 className="font-display text-[1.375rem] font-semibold leading-tight text-ink">{title}</h2>
          <p className="text-sm text-muted">{intro}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/**
 * Details, email permission and an optional password change, saved together. The password only
 * changes when its fields are filled in.
 */
function Profile({ user }: { user: SessionUser }) {
  const qc = useQueryClient();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState((user.phone ?? '').replace(/^\+?91[\s-]?/, ''));
  const [consent, setConsent] = useState(user.marketingConsent);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const changingPassword = Boolean(pw.currentPassword || pw.newPassword || pw.confirm);

  const save = useMutation({
    mutationFn: async () => {
      await api('/account/profile', { method: 'PATCH', body: { name, phone, marketingConsent: consent } });
      if (changingPassword) await api('/account/password', { method: 'PATCH', body: { currentPassword: pw.currentPassword, newPassword: pw.newPassword } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me });
      toast.success(changingPassword ? 'Saved. Your password is changed and other devices have been signed out.' : 'Your details are saved');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: (e) => {
      setErrors(e instanceof ApiError ? e.fields ?? {} : {});
      // Details may have saved before a password problem; refresh what's shown.
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });

  const submit = () => {
    const next: Record<string, string> = {};
    if (changingPassword) {
      if (!pw.currentPassword) next.currentPassword = 'Enter your current password';
      if (pw.newPassword.length < 8) next.newPassword = 'Use at least 8 characters';
      if (pw.confirm !== pw.newPassword) next.confirm = 'The two new passwords don’t match';
    }
    setErrors(next);
    if (!Object.keys(next).length) save.mutate();
  };
  const box = '!rounded-md bg-white';

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
    >
      <ProfileSection icon={UserRound} title="Your details" intro="Keep your information up to date.">
        <div className="grid gap-4">
          <Field label="Full name" required error={errors.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={box} aria-required />
          </Field>
          <Field label="Email address" hint="Contact us to change your email.">
            <Input value={user.email} disabled className={box} />
          </Field>
          <Field label="Mobile number" optional error={errors.phone}>
            <IndianMobileInput value={phone} onChange={setPhone} />
          </Field>
        </div>
      </ProfileSection>

      <ProfileSection icon={Mail} title="Email preferences" intro="Choose what we may email you about.">
        <Checkbox
          label="Email me about new arrivals and collections"
          description="Order and account emails are always sent. You can change this any time."
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
      </ProfileSection>

      <ProfileSection icon={LockKeyhole} title="Password" intro="Leave these empty to keep your current password.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Current password" error={errors.currentPassword}>
            <PasswordInput value={pw.currentPassword} onChange={(v) => setPw((p) => ({ ...p, currentPassword: v }))} autoComplete="current-password" placeholder="Enter current password" />
          </Field>
          <Field label="New password" hint="At least 8 characters." error={errors.newPassword}>
            <PasswordInput value={pw.newPassword} onChange={(v) => setPw((p) => ({ ...p, newPassword: v }))} autoComplete="new-password" placeholder="Enter new password" />
          </Field>
          <Field label="Confirm new password" error={errors.confirm} className="sm:col-span-2">
            <PasswordInput value={pw.confirm} onChange={(v) => setPw((p) => ({ ...p, confirm: v }))} autoComplete="new-password" placeholder="Confirm new password" />
          </Field>
        </div>
      </ProfileSection>

      <FormError>{save.isError && !Object.keys(errors).length ? errorMessage(save.error) : null}</FormError>
      <button
        type="submit"
        disabled={save.isPending}
        className="flex h-14 w-full items-center justify-center gap-3 rounded-md bg-gradient-to-b from-maroon-2 to-maroon text-[0.8125rem] font-bold uppercase tracking-[0.16em] text-ivory shadow-[0_12px_26px_-14px_rgba(63,18,21,.9)] transition-[filter] hover:brightness-110 disabled:opacity-70"
      >
        <LockKeyhole className="size-4.5" strokeWidth={1.6} aria-hidden />
        {save.isPending ? 'Saving…' : 'Save changes'}
        <ArrowRight className="size-4" aria-hidden />
      </button>
    </form>
  );
}
