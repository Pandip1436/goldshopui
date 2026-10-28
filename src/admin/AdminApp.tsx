import * as Dialog from '@radix-ui/react-dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Box,
  Boxes,
  ChartColumnIncreasing,
  ChevronDown,
  Coins,
  CreditCard,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  ListTree,
  LogOut,
  Menu as MenuIcon,
  MessageSquareText,
  Package,
  PackageCheck,
  PanelsTopLeft,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Tag,
  TriangleAlert,
  User,
  UserCog,
  UsersRound,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import type { SessionUser } from '@goldshop/shared';
import { Seo } from '../components/Seo';
import { Wordmark } from '../components/Logo';
import { EmptyState, Img, Spinner } from '../components/ui/misc';
import { api } from '../lib/api';
import { useMe, useSettings } from '../lib/hooks';
import { cn } from '../lib/utils';
import { CommandPalette, type PaletteLink } from './CommandPalette';
import { can, type Permission } from './lib';
import { ButtonLink, Menu, MenuItem, MenuSeparator } from './ui';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Products = lazy(() => import('./pages/Products'));
const ProductEdit = lazy(() => import('./pages/ProductEdit'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Catalog = lazy(() => import('./pages/Catalog'));
const Customers = lazy(() => import('./pages/Customers'));
const Marketing = lazy(() => import('./pages/Marketing'));
const Content = lazy(() => import('./pages/Content'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Enquiries = lazy(() => import('./pages/Enquiries'));
const Reports = lazy(() => import('./pages/Reports'));
const GoldRates = lazy(() => import('./pages/GoldRates'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const Staff = lazy(() => import('./pages/Staff'));

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  perm: Permission;
  badge?: number;
  /** Highlight for every path under this prefix (defaults to `to`). */
  match?: string;
  end?: boolean;
}

interface Pending {
  toFulfil: number;
  ratesStale: boolean;
  pending: { enquiries: number; reviews: number; paymentReview: number };
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

const roleLabel = (role: SessionUser['role']) => role.charAt(0).toUpperCase() + role.slice(1);

export default function AdminApp() {
  const { user, isLoading } = useMe();
  const { data: settings } = useSettings();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawer, setDrawer] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const [palette, setPalette] = useState(false);
  const { data: dash } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api<Pending>('/admin/dashboard'),
    enabled: Boolean(user && user.role !== 'customer'),
    staleTime: 60_000,
  });

  // Ctrl/⌘ K opens search from anywhere in the admin.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // On short screens the nav scrolls; keep the current page's item in view.
  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' });
  }, [location.pathname, user]);

  // A route change from the drawer closes it.
  const [lastPath, setLastPath] = useState(location.pathname);
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname);
    setDrawer(false);
  }

  if (isLoading) return <div className="grid min-h-dvh place-items-center bg-canvas"><Spinner className="size-6 text-gold" /></div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (user.role === 'customer') {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas">
        <EmptyState title="No admin access" action={<ButtonLink to="/">Back to the store</ButtonLink>}>
          This account doesn’t have access to the store dashboard.
        </EmptyState>
      </div>
    );
  }

  const allGroups: { title: string; items: NavItem[] }[] = [
    {
      title: '',
      items: [
        { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard:read', end: true },
        { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, perm: 'orders:read', badge: (dash?.toFulfil ?? 0) + (dash?.pending.paymentReview ?? 0) },
        { to: '/admin/customers', label: 'Customers', icon: Users, perm: 'customers:read' },
        { to: '/admin/enquiries', label: 'Enquiries', icon: MessageSquareText, perm: 'enquiries:write', badge: dash?.pending.enquiries },
        { to: '/admin/marketing', label: 'Coupons', icon: Tag, perm: 'coupons:write' },
      ],
    },
    {
      title: 'Catalogue',
      items: [
        { to: '/admin/gold-rates', label: 'Gold rates', icon: Coins, perm: 'rates:write' },
        { to: '/admin/products', label: 'Products', icon: Box, perm: 'catalog:write' },
        { to: '/admin/inventory', label: 'Inventory', icon: Boxes, perm: 'inventory:write' },
        { to: '/admin/catalog', label: 'Categories & collections', icon: ListTree, perm: 'catalog:write' },
        { to: '/admin/reviews', label: 'Reviews', icon: Star, perm: 'reviews:write', badge: dash?.pending.reviews },
      ],
    },
    {
      title: 'Reports',
      items: [
        { to: '/admin/reports/sales', label: 'Sales report', icon: ChartColumnIncreasing, perm: 'reports:read' },
        { to: '/admin/reports/products', label: 'Product report', icon: PackageCheck, perm: 'reports:read' },
        { to: '/admin/reports/customers', label: 'Customer report', icon: UsersRound, perm: 'reports:read' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { to: '/admin/content/banners', match: '/admin/content', label: 'Website content', icon: PanelsTopLeft, perm: 'content:write' },
        { to: '/admin/settings', label: 'Website settings', icon: Settings, perm: 'settings:write' },
        { to: '/admin/staff', label: 'Admin users', icon: UserCog, perm: 'staff:write' },
      ],
    },
  ];
  const groups = allGroups.map((g) => ({ ...g, items: g.items.filter((i) => can(user.role, i.perm)) })).filter((g) => g.items.length > 0);

  const isActive = (i: NavItem) => {
    const p = location.pathname.replace(/\/$/, '');
    if (i.end) return p === i.to;
    const base = i.match ?? i.to;
    return p === base || p.startsWith(`${base}/`);
  };

  const notifications = [
    dash?.ratesStale && can(user.role, 'rates:write') && { icon: TriangleAlert, tone: 'danger', text: 'Gold rates haven’t been updated in the last 24 hours', to: '/admin/gold-rates' },
    (dash?.pending.paymentReview ?? 0) > 0 && { icon: CreditCard, tone: 'danger', text: `${dash!.pending.paymentReview} order(s) need payment review`, to: '/admin/orders?status=payment_review' },
    (dash?.toFulfil ?? 0) > 0 && { icon: Package, tone: 'gold', text: `${dash!.toFulfil} order(s) to prepare and ship`, to: '/admin/orders?status=open' },
    (dash?.pending.enquiries ?? 0) > 0 && { icon: Inbox, tone: 'gold', text: `${dash!.pending.enquiries} new enquiry(ies)`, to: '/admin/enquiries' },
    (dash?.pending.reviews ?? 0) > 0 && { icon: Star, tone: 'gold', text: `${dash!.pending.reviews} review(s) awaiting approval`, to: '/admin/reviews' },
  ].filter(Boolean) as { icon: LucideIcon; tone: 'danger' | 'gold'; text: string; to: string }[];

  const signOut = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    qc.clear();
    navigate('/login?next=/admin');
  };

  const storeName = settings?.store.name ?? '';
  const logo = settings?.brand.logo;
  const mark = settings?.brand.mark;

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link to="/admin" className="block border-b border-hairline px-6 py-4 text-center" aria-label={`${storeName || 'Store'} admin — dashboard`}>
        {logo ? (
          <Img image={logo} priority sizes="208px" width={480} alt="" className="mx-auto h-[4.5rem] w-auto object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-wine">
            <Wordmark name={storeName} compact />
            {settings?.store.tagline && <span className="text-[0.5625rem] font-semibold uppercase tracking-[0.22em] text-gold-deep">{settings.store.tagline}</span>}
          </span>
        )}
      </Link>

      <nav ref={navRef} aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((g) => (
          <div key={g.title || 'main'} className={g.title ? 'mt-5' : ''}>
            {g.title && <p className="mb-1.5 px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">{g.title}</p>}
            <ul className="space-y-0.5">
              {g.items.map((i) => {
                const on = isActive(i);
                return (
                  <li key={i.to}>
                    <Link
                      to={i.to}
                      aria-current={on ? 'page' : undefined}
                      className={cn(
                        'flex h-10 items-center gap-3.5 rounded-lg px-3 text-[0.9375rem] transition-colors',
                        on ? 'bg-wine font-semibold text-white shadow-[0_6px_16px_-8px_rgba(95,10,29,.7)]' : 'text-ink-2 hover:bg-canvas hover:text-ink',
                      )}
                    >
                      <i.icon className={cn('size-5 shrink-0', on ? 'text-white' : 'text-ink-2')} strokeWidth={1.6} aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{i.label}</span>
                      {i.badge ? (
                        <span className={cn('grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[0.6875rem] font-bold tabular', on ? 'bg-white text-wine' : 'bg-gold text-white')}>
                          {i.badge}
                          <span className="sr-only"> waiting</span>
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-3 border-t border-hairline px-4 py-4">
        <Avatar name={user.name} className="size-11 text-[0.9375rem]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9375rem] font-semibold text-ink">{user.name}</p>
          <p className="text-[0.8125rem] text-muted">{roleLabel(user.role)}</p>
        </div>
        <button type="button" onClick={signOut} className="grid size-9 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-canvas hover:text-wine" aria-label="Sign out">
          <LogOut className="size-5" strokeWidth={1.6} />
        </button>
      </div>
    </div>
  );

  const paletteLinks: PaletteLink[] = groups.flatMap((g) => g.items.map((i) => ({ to: i.to, label: i.label, icon: i.icon, group: g.title || 'Overview' })));

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <Seo title="Admin" noindex />

      <aside className="sticky top-0 hidden h-dvh border-r border-hairline bg-white lg:block">{sidebar}</aside>

      <Dialog.Root open={drawer} onOpenChange={setDrawer}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[17.5rem] max-w-[85vw] bg-white shadow-2xl outline-none data-[state=open]:animate-[drawer-in_260ms_cubic-bezier(.22,1,.36,1)] lg:hidden" aria-describedby={undefined}>
            <Dialog.Title className="sr-only">Admin menu</Dialog.Title>
            <Dialog.Close className="absolute right-2 top-2 z-10 grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-canvas" aria-label="Close menu">
              <X className="size-5" />
            </Dialog.Close>
            {sidebar}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-hairline bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
          <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:h-[4.375rem] lg:px-8">
            <button type="button" onClick={() => setDrawer(true)} className="grid size-10 place-items-center rounded-lg text-ink-2 hover:bg-canvas lg:hidden" aria-label="Open admin menu">
              <MenuIcon className="size-5.5" strokeWidth={1.6} />
            </button>
            <Link to="/admin" className="flex shrink-0 items-center lg:hidden" aria-label="Dashboard">
              {mark ? <Img image={mark} priority sizes="64px" width={480} alt="" className="h-8 w-auto" /> : <Wordmark name={storeName} compact className="text-wine" />}
            </Link>

            <button
              type="button"
              onClick={() => setPalette(true)}
              className="group hidden h-11 w-full max-w-[32rem] items-center gap-3 rounded-xl border border-field bg-white pl-3.5 pr-2 text-left text-sm text-subtle transition-colors hover:border-line-strong md:flex"
            >
              <Search className="size-[1.125rem] shrink-0 text-ink-2" strokeWidth={1.7} aria-hidden />
              <span className="flex-1 truncate">Search orders, customers, products…</span>
              <span aria-hidden className="flex gap-1">
                <kbd className="rounded-md border border-field bg-white px-1.5 py-0.5 font-sans text-[0.75rem] font-medium text-ink-2">Ctrl</kbd>
                <kbd className="rounded-md border border-field bg-white px-1.5 py-0.5 font-sans text-[0.75rem] font-medium text-ink-2">K</kbd>
              </span>
            </button>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <button type="button" onClick={() => setPalette(true)} className="grid size-10 place-items-center rounded-lg text-ink-2 hover:bg-canvas md:hidden" aria-label="Search">
                <Search className="size-5" strokeWidth={1.6} />
              </button>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="mr-2 hidden h-10 items-center gap-2 rounded-lg border border-gold-soft px-4 text-sm font-semibold text-wine transition-colors hover:border-gold hover:bg-cream-2 sm:inline-flex"
              >
                Visit Website <ExternalLink className="size-4" strokeWidth={1.8} aria-hidden />
              </a>

              <Menu
                label={notifications.length ? `Notifications, ${notifications.length} need attention` : 'Notifications'}
                triggerClassName="relative grid size-10 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-canvas"
                panelClassName="w-[20rem]"
                trigger={
                  <>
                    <Bell className="size-[1.375rem]" strokeWidth={1.6} aria-hidden />
                    {notifications.length > 0 && (
                      <span aria-hidden className="absolute right-1 top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-alert px-1 text-[0.625rem] font-bold text-white ring-2 ring-white">
                        {notifications.length}
                      </span>
                    )}
                  </>
                }
              >
                <p className="px-3 pb-1.5 pt-2 font-display text-lg font-semibold text-ink">Notifications</p>
                {notifications.length === 0 ? (
                  <p className="px-3 pb-3 text-sm text-muted">You’re all caught up.</p>
                ) : (
                  notifications.map((n) => (
                    <MenuItem key={n.to} to={n.to}>
                      <span className="flex items-start gap-3">
                        <span className={cn('mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg', n.tone === 'danger' ? 'bg-danger-bg text-danger' : 'bg-cream text-gold-deep')}>
                          <n.icon className="size-4" strokeWidth={1.8} aria-hidden />
                        </span>
                        <span className="leading-snug">{n.text}</span>
                      </span>
                    </MenuItem>
                  ))
                )}
              </Menu>

              <Menu
                label="Account menu"
                triggerClassName="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-1 transition-colors hover:bg-canvas sm:pr-2"
                trigger={
                  <>
                    <Avatar name={user.name} className="size-10 text-sm" />
                    <span className="hidden text-left leading-tight sm:block">
                      <span className="block max-w-[9rem] truncate text-[0.9375rem] font-semibold text-ink">{user.name.split(' ')[0]}</span>
                      <span className="block text-[0.8125rem] text-muted">{roleLabel(user.role)}</span>
                    </span>
                    <ChevronDown className="hidden size-4 text-ink-2 sm:block" aria-hidden />
                  </>
                }
              >
                <div className="px-3 pb-2 pt-1.5">
                  <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
                <MenuSeparator />
                <MenuItem href="/" newTab icon={ExternalLink}>Visit website</MenuItem>
                <MenuItem to="/account" icon={User}>My account</MenuItem>
                {can(user.role, 'settings:write') && <MenuItem to="/admin/settings" icon={Settings}>Website settings</MenuItem>}
                <MenuSeparator />
                <MenuItem onSelect={signOut} icon={LogOut} danger>Sign out</MenuItem>
              </Menu>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[96rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<div className="py-24 text-center"><Spinner className="mx-auto size-6 text-gold" /></div>}>
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:orderNumber" element={<OrderDetail />} />
              <Route path="products" element={<Products />} />
              <Route path="products/:id" element={<ProductEdit />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="customers/*" element={<Customers />} />
              <Route path="marketing" element={<Marketing />} />
              <Route path="content" element={<Navigate to="/admin/content/banners" replace />} />
              <Route path="content/:kind" element={<Content />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="enquiries" element={<Enquiries />} />
              <Route path="reports/*" element={<Reports />} />
              <Route path="gold-rates" element={<GoldRates />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="staff" element={<Staff />} />
              <Route path="*" element={<EmptyState title="Page not found" />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      <CommandPalette
        open={palette}
        onOpenChange={setPalette}
        links={paletteLinks}
        scopes={{ orders: can(user.role, 'orders:read'), customers: can(user.role, 'customers:read'), products: can(user.role, 'catalog:write') }}
      />
    </div>
  );
}

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span aria-hidden className={cn('grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#e2bd78] to-[#c4954a] font-display font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.35)]', className)}>
      {initials(name) || '·'}
    </span>
  );
}
