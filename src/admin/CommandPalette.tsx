import * as Dialog from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import { CornerDownLeft, Package, Search, ShoppingBag, User, type LucideIcon } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { formatIndianMobile, type ImageRef, type OrderStatus } from '@goldshop/shared';
import { Img, Spinner } from '../components/ui/misc';
import { api } from '../lib/api';
import { useDebounced } from '../lib/hooks';
import { cn, formatDate, inr } from '../lib/utils';
import { OrderStatusBadge } from './ui';

export interface PaletteLink {
  to: string;
  label: string;
  icon: LucideIcon;
  group: string;
}

interface Result {
  id: string;
  to: string;
  group: string;
  icon?: LucideIcon;
  image?: ImageRef;
  title: ReactNode;
  meta?: ReactNode;
  aside?: ReactNode;
}

type Paged<T> = { items: T[] };

/**
 * Admin-wide search (Ctrl/⌘ K): jumps to any admin page and finds orders, customers and products
 * through the same list endpoints the pages use, so permissions apply as usual.
 */
export function CommandPalette({
  open,
  onOpenChange,
  links,
  scopes,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  links: PaletteLink[];
  scopes: { orders: boolean; customers: boolean; products: boolean };
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const term = useDebounced(q.trim(), 250);
  const searching = term.length >= 2;
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  const orders = useQuery({
    queryKey: ['admin', 'palette', 'orders', term],
    queryFn: () =>
      api<Paged<{ orderNumber: string; createdAt: string; status: OrderStatus; customer: { name: string }; total: number }>>('/admin/orders', { query: { q: term, limit: 5 } }),
    enabled: open && searching && scopes.orders,
    staleTime: 30_000,
  });
  const customers = useQuery({
    queryKey: ['admin', 'palette', 'customers', term],
    queryFn: () => api<Paged<{ id: string; name: string; email: string; phone?: string; orderCount: number }>>('/admin/customers', { query: { q: term, limit: 5 } }),
    enabled: open && searching && scopes.customers,
    staleTime: 30_000,
  });
  const products = useQuery({
    queryKey: ['admin', 'palette', 'products', term],
    queryFn: () => api<Paged<{ id: string; name: string; sku: string; image?: ImageRef; minPrice: number; totalStock: number }>>('/admin/products', { query: { q: term, limit: 5 } }),
    enabled: open && searching && scopes.products,
    staleTime: 30_000,
  });
  const loading = searching && (orders.isFetching || customers.isFetching || products.isFetching);

  const results = useMemo<Result[]>(() => {
    const needle = q.trim().toLowerCase();
    const pages = links
      .filter((l) => !needle || l.label.toLowerCase().includes(needle) || l.group.toLowerCase().includes(needle))
      .slice(0, needle ? 6 : 8)
      .map<Result>((l) => ({ id: `page:${l.to}`, to: l.to, group: 'Go to', icon: l.icon, title: l.label, meta: l.group }));
    if (!searching) return pages;
    return [
      ...(orders.data?.items ?? []).map<Result>((o) => ({
        id: `order:${o.orderNumber}`,
        to: `/admin/orders/${o.orderNumber}`,
        group: 'Orders',
        icon: ShoppingBag,
        title: <>#{o.orderNumber} · {o.customer.name}</>,
        meta: `${formatDate(o.createdAt)} · ${inr(o.total)}`,
        aside: <OrderStatusBadge status={o.status} />,
      })),
      ...(customers.data?.items ?? []).map<Result>((c) => ({
        id: `customer:${c.id}`,
        to: `/admin/customers/${c.id}`,
        group: 'Customers',
        icon: User,
        title: c.name,
        meta: [c.email, c.phone ? formatIndianMobile(c.phone) : '', `${c.orderCount} orders`].filter(Boolean).join(' · '),
      })),
      ...(products.data?.items ?? []).map<Result>((p) => ({
        id: `product:${p.id}`,
        to: `/admin/products/${p.id}`,
        group: 'Products',
        icon: Package,
        image: p.image,
        title: p.name,
        meta: `${p.sku}${p.minPrice ? ` · ${inr(p.minPrice)}` : ''} · ${p.totalStock} in stock`,
      })),
      ...pages,
    ];
  }, [q, links, searching, orders.data, customers.data, products.data]);

  // Keep the highlighted row valid as results change.
  const current = Math.min(active, Math.max(0, results.length - 1));

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${current}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [current]);

  const go = (r?: Result) => {
    if (!r) return;
    onOpenChange(false);
    navigate(r.to);
  };

  const groups = results.reduce<{ name: string; items: { r: Result; i: number }[] }[]>((acc, r, i) => {
    const g = acc.find((x) => x.name === r.group);
    if (g) g.items.push({ r, i });
    else acc.push({ name: r.group, items: [{ r, i }] });
    return acc;
  }, []);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setQ('');
          setActive(0);
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/35 backdrop-blur-[2px] data-[state=open]:animate-[dropdown-in_120ms_ease-out]" />
        <Dialog.Content
          className="fixed inset-x-3 top-[8vh] z-50 mx-auto flex max-h-[80dvh] max-w-2xl flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-[0_30px_80px_-24px_rgba(30,24,19,.45)] outline-none data-[state=open]:animate-[dropdown-in_160ms_ease-out]"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Search the admin</Dialog.Title>
          <div className="flex items-center gap-3 border-b border-hairline px-4">
            {loading ? <Spinner className="size-5 shrink-0 text-gold" /> : <Search className="size-5 shrink-0 text-muted" aria-hidden />}
            <input
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActive((current + 1) % Math.max(1, results.length));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActive((current - 1 + results.length) % Math.max(1, results.length));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  go(results[current]);
                }
              }}
              placeholder="Search orders, customers, products…"
              className="h-14 min-w-0 flex-1 bg-transparent text-[0.9375rem] text-ink placeholder:text-subtle focus:outline-none"
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={results[current] ? `${listId}-${current}` : undefined}
              aria-label="Search orders, customers, products and pages"
            />
            <kbd className="hidden rounded-md border border-field px-1.5 py-0.5 text-[0.6875rem] font-semibold text-muted sm:block">Esc</kbd>
          </div>

          <div ref={listRef} id={listId} role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-y-auto p-2">
            {groups.map((g) => (
              <div key={g.name} role="group" aria-label={g.name} className="mb-1">
                <p className="px-3 pb-1 pt-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-subtle">{g.name}</p>
                {g.items.map(({ r, i }) => (
                  <div
                    key={r.id}
                    id={`${listId}-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={i === current}
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(r)}
                    className={cn('flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5', i === current ? 'bg-cream-2 ring-1 ring-gold-soft/60' : '')}
                  >
                    {r.image ? (
                      <span className="size-9 shrink-0 overflow-hidden rounded-lg bg-canvas">
                        <Img image={r.image} sizes="36px" width={480} className="size-full object-cover" />
                      </span>
                    ) : r.icon ? (
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-cream text-gold">
                        <r.icon className="size-4" strokeWidth={1.7} aria-hidden />
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{r.title}</span>
                      {r.meta && <span className="block truncate text-xs text-muted">{r.meta}</span>}
                    </span>
                    {r.aside}
                    {i === current && <CornerDownLeft className="hidden size-4 shrink-0 text-muted sm:block" aria-hidden />}
                  </div>
                ))}
              </div>
            ))}
            {results.length === 0 && (
              <p className="px-3 py-10 text-center text-sm text-muted">{loading ? 'Searching…' : `Nothing found for “${q.trim()}”.`}</p>
            )}
            {searching && !loading && results.every((r) => r.group === 'Go to') && results.length > 0 && (
              <p className="px-3 pb-2 pt-1 text-xs text-muted">No orders, customers or products match. Orders are found by number, email, mobile or name.</p>
            )}
          </div>
          <div className="hidden items-center gap-4 border-t border-hairline bg-canvas px-4 py-2.5 text-xs text-muted sm:flex">
            <span><Kbd>↑</Kbd> <Kbd>↓</Kbd> to move</span>
            <span><Kbd>Enter</Kbd> to open</span>
            <span className="ml-auto">Type at least 2 letters to search records</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-field bg-white px-1 py-px font-sans text-[0.6875rem] font-semibold text-ink-2">{children}</kbd>;
}
