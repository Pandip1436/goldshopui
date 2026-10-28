import { useQuery } from '@tanstack/react-query';
import { ArrowDownUp, ChevronDown, ChevronLeft, ChevronRight, Gem, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import {
  PRODUCT_SORT_LABELS,
  PURITIES,
  type CategoryNode,
  type CategoryRef,
  type CollectionDTO,
  type ProductListResponse,
  type ProductSort,
  type PurityKey,
} from '@goldshop/shared';
import { FadeHero } from '../components/FadeHero';
import { Seo } from '../components/Seo';
import { ProductGrid } from '../components/product/ProductCard';
import { Button, ButtonLink } from '../components/ui/Button';
import { PageFade } from '../components/ui/Motion';
import { Dropdown } from '../components/ui/Dropdown';
import { Sheet } from '../components/ui/Sheet';
import { Breadcrumbs, EmptyState, Img } from '../components/ui/misc';
import { api } from '../lib/api';
import { useCategories, useMediaQuery, useProducts, useSettings } from '../lib/hooks';
import { cn, inr } from '../lib/utils';

type CategoryDetail = CategoryNode & { parent?: CategoryRef; seo?: { title?: string; description?: string } };
type View = 'grid' | 'row';

const PRICE_PRESETS = [
  { label: 'Under 25K', min: undefined, max: 25_000 },
  { label: '25K – 50K', min: 25_000, max: 50_000 },
  { label: '50K – 1L', min: 50_000, max: 100_000 },
  { label: 'Above 1L', min: 100_000, max: undefined },
];
const LIMIT = 24;
const VIEW_KEY = 'shop:view';

/** The grid/list choice is a per-visitor convenience, so it lives in this browser only. */
function useView(): [View, (v: View) => void] {
  const [view, setView] = useState<View>(() => {
    try {
      return localStorage.getItem(VIEW_KEY) === 'row' ? 'row' : 'grid';
    } catch {
      return 'grid';
    }
  });
  return [
    view,
    (v) => {
      setView(v);
      try {
        localStorage.setItem(VIEW_KEY, v);
      } catch {
        /* storage unavailable: the choice just isn't remembered */
      }
    },
  ];
}

export default function Shop() {
  const { category, collection: collectionPath } = useParams();
  const [sp, setSp] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  // The sort icon stands in for the hidden "Sort by" label on phones, except the narrowest, where
  // "Price: low to high" needs the room.
  const sortIcon = useMediaQuery('(min-width: 360px) and (max-width: 639.98px)');
  const [view, setView] = useView();
  const { data: s } = useSettings();

  const q = sp.get('q') ?? '';
  const sort = (sp.get('sort') as ProductSort) || undefined;
  const page = Math.max(1, Number(sp.get('page') ?? 1));
  const purity = sp.get('purity') ?? '';
  const min = sp.get('min') ?? '';
  const max = sp.get('max') ?? '';
  const inStock = sp.get('inStock') === '1';
  // A collection comes from its own page's URL, or from the filter on the main listing.
  const collectionFilter = collectionPath ? undefined : sp.get('collection') ?? undefined;
  const collection = collectionPath ?? collectionFilter;

  const params = { category, collection, q: q || undefined, sort, page, purity: purity || undefined, min: min || undefined, max: max || undefined, inStock: inStock || undefined, limit: LIMIT };
  const { data, isLoading, isFetching, isError, refetch } = useProducts(params);

  const { data: cat } = useQuery({
    queryKey: ['category', category],
    queryFn: () => api<CategoryDetail>(`/categories/${category}`),
    enabled: Boolean(category),
    staleTime: 5 * 60_000,
  });
  const { data: col } = useQuery({
    queryKey: ['collection', collectionPath],
    queryFn: () => api<CollectionDTO & { seo?: { title?: string; description?: string } }>(`/collections/${collectionPath}`),
    enabled: Boolean(collectionPath),
    staleTime: 5 * 60_000,
  });
  const { data: tree } = useCategories();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '') next.delete(k);
      else next.set(k, v);
    }
    if (!('page' in patch)) next.delete('page');
    setSp(next, { preventScrollReset: true });
  };
  const clearAll = () => update({ purity: undefined, min: undefined, max: undefined, inStock: undefined, collection: undefined });

  const selectedPurities = purity ? purity.split(',') : [];
  const title = q
    ? `Results for “${q}”`
    : col?.name ?? cat?.name ?? (sort === 'newest' ? 'New Arrivals' : sort === 'popular' ? 'Best Selling' : 'All Jewellery');
  const description = col?.description ?? cat?.description ?? (q ? undefined : 'Gold jewellery priced at today’s rate, with a full price breakdown on every piece.');
  const subtitle = col ? col.tagline : cat ? cat.description : q ? undefined : s?.shopPage.tagline ?? description;
  const path = collectionPath ? `/collections/${collectionPath}` : category ? `/shop/${category}` : '/shop';

  const crumbs: { label: string; to?: string }[] = [{ label: 'Home', to: '/' }];
  if (col) {
    crumbs.push({ label: 'Collections', to: '/collections' }, { label: col.name });
  } else {
    crumbs.push({ label: 'Jewellery', to: '/shop' });
    if (cat?.parent) crumbs.push({ label: cat.parent.name, to: `/shop/${cat.parent.slug}` });
    crumbs.push({ label: cat?.name ?? (q ? 'Search' : 'All jewellery') });
  }

  const collectionName = data?.facets.collections.find((c) => c.slug === collectionFilter)?.name;
  const activeChips = [
    ...selectedPurities.map((p) => ({ key: `p-${p}`, label: PURITIES[p as PurityKey]?.label ?? p, clear: () => update({ purity: selectedPurities.filter((x) => x !== p).join(',') }) })),
    ...(min || max ? [{ key: 'price', label: `${min ? inr(Number(min) * 100) : '₹0'} – ${max ? inr(Number(max) * 100) : 'any'}`, clear: () => update({ min: undefined, max: undefined }) }] : []),
    ...(collectionFilter ? [{ key: 'col', label: collectionName ?? 'Collection', clear: () => update({ collection: undefined }) }] : []),
    ...(inStock ? [{ key: 'stock', label: 'Ready to ship', clear: () => update({ inStock: undefined }) }] : []),
  ];

  const from = data && data.total ? (data.page - 1) * data.limit + 1 : 0;
  const to = data ? Math.min(data.page * data.limit, data.total) : 0;
  const filters = (
    <Filters
      tree={tree ?? []}
      currentCategory={category}
      facets={data?.facets}
      selectedPurities={selectedPurities}
      min={min}
      max={max}
      inStock={inStock}
      collection={collectionFilter}
      showCollections={!collectionPath}
      update={update}
      keepQuery={q}
      onClear={activeChips.length ? clearAll : undefined}
    />
  );

  return (
    <PageFade>
      <Seo title={col?.seo?.title ?? cat?.seo?.title ?? title} description={col?.seo?.description ?? cat?.seo?.description ?? description} path={path} noindex={Boolean(q)} />

      <FadeHero
        eyebrow={col ? 'Collection' : cat ? cat.parent?.name ?? 'Jewellery' : q ? 'Search' : 'Jewellery'}
        title={title}
        subtitle={subtitle}
        image={col?.banner ?? col?.image ?? cat?.image ?? s?.shopPage.image}
        features={s?.shopPage.features ?? []}
      />

      <div className="container-page pb-16 pt-5 md:pb-24">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-5">
          <Breadcrumbs items={crumbs} className="text-[0.8125rem]" />
          {/* Phones: Filters and Sort share one full-width row at the same height, the count below them.
              From sm: one wrapping row as before. */}
          <div className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:flex sm:w-auto sm:flex-wrap">
            <Button variant="secondary" size="sm" className="!h-10 lg:hidden" icon={<SlidersHorizontal className="size-3.5" />} onClick={() => setFiltersOpen(true)}>
              Filters{activeChips.length ? ` (${activeChips.length})` : ''}
            </Button>
            <p className="order-last col-span-2 text-[0.8125rem] text-ink-2 sm:order-none" aria-live="polite">
              {data ? (data.total ? `Showing ${from}–${to} of ${data.total} ${data.total === 1 ? 'piece' : 'pieces'}` : 'No pieces') : ' '}
              {isFetching && !isLoading && <span className="ml-2 text-xs text-subtle">Updating…</span>}
            </p>
            <div className="hidden overflow-hidden rounded-md border border-line sm:flex" role="group" aria-label="Layout">
              {(
                [
                  ['grid', LayoutGrid, 'Grid view'],
                  ['row', List, 'List view'],
                ] as const
              ).map(([v, Icon, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  aria-label={label}
                  className={cn('grid size-9 place-items-center transition-colors', view === v ? 'bg-maroon text-ivory' : 'bg-paper text-ink-2 hover:text-ink')}
                >
                  <Icon className="size-4" strokeWidth={1.8} />
                </button>
              ))}
            </div>
            <div className="flex min-w-0 items-center gap-2.5 text-[0.8125rem]">
              {/* On phones the label is read out but not shown: a sort icon in the button says it instead. */}
              <span id="sort-label" className="sr-only shrink-0 whitespace-nowrap text-ink-2 sm:not-sr-only">
                Sort by
              </span>
              <Dropdown
                aria-labelledby="sort-label"
                size="sm"
                icon={sortIcon ? ArrowDownUp : undefined}
                className="min-w-0 font-medium sm:min-w-[11.5rem]"
                value={sort ?? (q ? 'relevance' : 'featured')}
                onChange={(v) => update({ sort: v === 'relevance' ? undefined : v })}
                options={[
                  ...(q ? [{ value: 'relevance', label: 'Best match' }] : []),
                  ...(Object.keys(PRODUCT_SORT_LABELS) as ProductSort[]).map((k) => ({ value: k, label: PRODUCT_SORT_LABELS[k] })),
                ]}
              />
            </div>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="hidden lg:block" aria-label="Filters">
            <div className="rounded-xl border border-line/80 bg-paper">{filters}</div>
          </aside>

          <div className="min-w-0">
            <CategoryChips tree={tree ?? []} current={category} keepQuery={q} />

            {activeChips.length > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {activeChips.map((c) => (
                  <button key={c.key} onClick={c.clear} className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-xs font-semibold text-ink-2 hover:bg-sand-2">
                    {c.label} <X className="size-3" aria-label="remove" />
                  </button>
                ))}
                <button onClick={clearAll} className="text-xs text-muted underline underline-offset-4">
                  Clear all
                </button>
              </div>
            )}

            {isError ? (
              <EmptyState title="We couldn’t load these pieces" action={<Button onClick={() => refetch()}>Try again</Button>}>
                Please check your connection.
              </EmptyState>
            ) : data && data.items.length === 0 ? (
              <EmptyState
                title={q ? 'No pieces match your search' : 'Nothing here yet'}
                action={
                  <>
                    {activeChips.length > 0 && (
                      <Button variant="secondary" onClick={clearAll}>
                        Clear filters
                      </Button>
                    )}
                    <ButtonLink to="/shop">Browse all jewellery</ButtonLink>
                  </>
                }
              >
                {q ? 'Try a different word, or ask us — we may have it in store.' : 'Try removing a filter, or explore our other categories.'}
              </EmptyState>
            ) : (
              <div className={cn('transition-opacity', isFetching && !isLoading && 'opacity-60')}>
                <ProductGrid products={data?.items} loading={isLoading} count={12} layout={view} />
              </div>
            )}

            {data && data.pages > 1 && <Pagination page={data.page} pages={data.pages} onPage={(p) => update({ page: String(p) })} />}
          </div>
        </div>
      </div>

      <Sheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        side="left"
        title="Filters"
        footer={
          <Button block onClick={() => setFiltersOpen(false)}>
            Show {data?.total ?? ''} {data?.total === 1 ? 'piece' : 'pieces'}
          </Button>
        }
      >
        {filters}
      </Sheet>
    </PageFade>
  );
}

/* ------------------------------------------------------- category chips */

function CategoryChips({ tree, current, keepQuery }: { tree: CategoryNode[]; current?: string; keepQuery: string }) {
  if (!tree.length) return null;
  const suffix = keepQuery ? `?q=${encodeURIComponent(keepQuery)}` : '';
  const root = tree.find((c) => c.slug === current || c.children.some((ch) => ch.slug === current));
  const chip = 'flex h-14 shrink-0 items-center gap-2.5 rounded-lg border bg-paper pl-2 pr-4 text-[0.8125rem] transition-colors';
  const on = 'border-maroon text-ink shadow-[inset_0_0_0_1px_var(--color-maroon)]';
  const off = 'border-line text-ink-2 hover:border-gold hover:text-ink';
  return (
    <nav aria-label="Categories" className="mb-5">
      <ul className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-none sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0">
        <li>
          <Link to={`/shop${suffix}`} className={cn(chip, !current ? on : off)} aria-current={!current ? 'page' : undefined}>
            <span className="grid size-10 place-items-center rounded-md bg-gold-pale/60 text-gold-deep">
              <Gem className="size-4.5" strokeWidth={1.5} aria-hidden />
            </span>
            All Jewellery
          </Link>
        </li>
        {tree.map((c) => {
          const active = root?.id === c.id;
          return (
            <li key={c.id}>
              <Link to={`/shop/${c.slug}${suffix}`} className={cn(chip, active ? on : off)} aria-current={c.slug === current ? 'page' : undefined}>
                <span className="size-10 overflow-hidden rounded-md bg-sand">
                  <Img image={c.image} sizes="40px" width={480} className="size-full object-cover" />
                </span>
                {c.name}
              </Link>
            </li>
          );
        })}
      </ul>
      {root && root.children.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {root.children.map((ch) => (
            <li key={ch.id}>
              <Link
                to={`/shop/${ch.slug}${suffix}`}
                aria-current={ch.slug === current ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition-colors',
                  ch.slug === current ? 'border-maroon bg-maroon text-ivory' : 'border-line bg-paper text-ink-2 hover:border-gold hover:text-ink',
                )}
              >
                {ch.name}
                {ch.productCount ? <span className={ch.slug === current ? 'text-ivory/70' : 'text-subtle'}>{ch.productCount}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}

/* -------------------------------------------------------------- filters */

function Section({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="border-b border-line/70 px-5 py-5 last:border-b-0">
      <h2>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between text-[0.75rem] font-bold uppercase tracking-[0.16em] text-ink">
          {title}
          <ChevronDown className={cn('size-4 text-ink-2 transition-transform', open && 'rotate-180')} aria-hidden />
        </button>
      </h2>
      {open && <div className="mt-4">{children}</div>}
    </section>
  );
}

function Check({ checked, onChange, label, ariaLabel, count }: { checked: boolean; onChange: () => void; label: string; ariaLabel?: string; count?: number }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1 text-sm text-ink-2 hover:text-ink">
      <span className="flex items-center gap-3">
        <input type="checkbox" checked={checked} onChange={onChange} aria-label={ariaLabel} className="shrink-0 cursor-pointer" />
        {label}
      </span>
      {count !== undefined && <span className="text-xs text-subtle">{count}</span>}
    </label>
  );
}

function Filters({
  tree,
  currentCategory,
  facets,
  selectedPurities,
  min,
  max,
  inStock,
  collection,
  showCollections,
  update,
  keepQuery,
  onClear,
}: {
  tree: CategoryNode[];
  currentCategory?: string;
  facets?: ProductListResponse['facets'];
  selectedPurities: string[];
  min: string;
  max: string;
  inStock: boolean;
  collection?: string;
  showCollections: boolean;
  update: (p: Record<string, string | undefined>) => void;
  keepQuery: string;
  onClear?: () => void;
}) {
  const suffix = keepQuery ? `?q=${encodeURIComponent(keepQuery)}` : '';
  // Category counts describe the whole catalogue, so they're left off while searching.
  const total = keepQuery ? undefined : tree.reduce((n, c) => n + (c.productCount ?? 0), 0);
  const row = (active: boolean) =>
    cn('-mx-5 flex items-center justify-between px-5 py-2 text-sm transition-colors', active ? 'bg-sand/80 font-semibold text-ink' : 'text-ink-2 hover:text-ink');

  return (
    <div>
      <Section title="Categories">
        <ul>
          <li>
            <Link to={`/shop${suffix}`} className={row(!currentCategory)}>
              All Jewellery {total ? <span className="text-xs font-normal text-subtle">{total}</span> : null}
            </Link>
          </li>
          {tree.map((c) => {
            const open = currentCategory === c.slug || c.children.some((ch) => ch.slug === currentCategory);
            return (
              <li key={c.id}>
                <Link to={`/shop/${c.slug}${suffix}`} className={row(currentCategory === c.slug)}>
                  {c.name}
                  {!keepQuery && c.productCount ? <span className="text-xs font-normal text-subtle">{c.productCount}</span> : null}
                </Link>
                {open && c.children.length > 0 && (
                  <ul className="mb-1 ml-1 border-l border-line pl-3">
                    {c.children.map((ch) => (
                      <li key={ch.id}>
                        <Link to={`/shop/${ch.slug}${suffix}`} className={cn(row(currentCategory === ch.slug), '-mx-0 px-2 py-1.5 text-[0.8125rem]')}>
                          {ch.name}
                          {!keepQuery && ch.productCount ? <span className="text-xs font-normal text-subtle">{ch.productCount}</span> : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      {facets && facets.purities.length > 0 && (
        <Section title="Purity">
          {facets.purities.map((p) => {
            const checked = selectedPurities.includes(p.key);
            return (
              <Check
                key={p.key}
                checked={checked}
                label={PURITIES[p.key].metal === 'gold' ? `${PURITIES[p.key].label} Gold` : PURITIES[p.key].label}
                ariaLabel={PURITIES[p.key].name}
                count={p.count}
                onChange={() => update({ purity: (checked ? selectedPurities.filter((x) => x !== p.key) : [...selectedPurities, p.key]).join(',') || undefined })}
              />
            );
          })}
        </Section>
      )}

      <Section title="Price range (₹)">
        {facets && facets.priceMax > facets.priceMin && <PriceSlider floorPaise={facets.priceMin} ceilPaise={facets.priceMax} min={min} max={max} update={update} />}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {PRICE_PRESETS.map((p) => {
            const active = String(p.min ?? '') === min && String(p.max ?? '') === max;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => update(active ? { min: undefined, max: undefined } : { min: p.min ? String(p.min) : undefined, max: p.max ? String(p.max) : undefined })}
                className={cn(
                  'h-10 rounded-md border text-[0.8125rem] transition-colors',
                  active ? 'border-maroon bg-maroon text-ivory' : 'border-line bg-paper text-ink-2 hover:border-gold hover:text-ink',
                )}
                aria-pressed={active}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </Section>

      {showCollections && facets && facets.collections.length > 0 && (
        <Section title="Collection">
          {facets.collections.map((c) => (
            <Check key={c.slug} checked={collection === c.slug} label={c.name} count={c.count} onChange={() => update({ collection: collection === c.slug ? undefined : c.slug })} />
          ))}
        </Section>
      )}

      <Section title="Availability">
        <Check checked={inStock} label="Ready to ship only" onChange={() => update({ inStock: inStock ? undefined : '1' })} />
      </Section>

      {onClear && (
        <div className="px-5 pb-5">
          <button type="button" onClick={onClear} className="text-xs font-semibold text-ink underline decoration-gold underline-offset-4 hover:text-gold-deep">
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

/** Two-thumb price range. The range comes from the pieces currently listed; changes apply after a short pause. */
function PriceSlider({ floorPaise, ceilPaise, min, max, update }: { floorPaise: number; ceilPaise: number; min: string; max: string; update: (p: Record<string, string | undefined>) => void }) {
  const floor = Math.floor(floorPaise / 100 / 1000) * 1000;
  const ceil = Math.ceil(ceilPaise / 100 / 1000) * 1000;
  const step = ceil - floor > 200_000 ? 5000 : 1000;
  const clamp = (v: number) => Math.min(ceil, Math.max(floor, v));
  const [lo, setLo] = useState(() => clamp(Number(min) || floor));
  const [hi, setHi] = useState(() => clamp(Number(max) || ceil));
  useEffect(() => {
    setLo(clamp(Number(min) || floor));
    setHi(clamp(Number(max) || ceil));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, floor, ceil]);
  useEffect(() => {
    const nextMin = lo > floor ? String(lo) : '';
    const nextMax = hi < ceil ? String(hi) : '';
    if (nextMin === min && nextMax === max) return;
    const t = window.setTimeout(() => update({ min: nextMin || undefined, max: nextMax || undefined }), 450);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lo, hi]);

  const pct = (v: number) => ((v - floor) / (ceil - floor)) * 100;
  const thumb =
    'pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-paper [&::-moz-range-thumb]:bg-maroon [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-paper [&::-webkit-slider-thumb]:bg-maroon [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(0,0,0,.35)] focus-visible:outline-none focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-gold';
  return (
    <div>
      <div className="relative h-5">
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-sand-2" />
        <span aria-hidden className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-gold" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input type="range" min={floor} max={ceil} step={step} value={lo} onChange={(e) => setLo(Math.min(Number(e.target.value), hi - step))} aria-label="Minimum price in rupees" aria-valuetext={inr(lo * 100)} className={thumb} />
        <input type="range" min={floor} max={ceil} step={step} value={hi} onChange={(e) => setHi(Math.max(Number(e.target.value), lo + step))} aria-label="Maximum price in rupees" aria-valuetext={inr(hi * 100)} className={thumb} />
      </div>
      <p className="mt-2 flex justify-between text-[0.8125rem] text-ink-2">
        <span>{inr(lo * 100)}</span>
        <span>{inr(hi * 100)}</span>
      </p>
    </div>
  );
}

function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-1">
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="grid size-10 place-items-center rounded-md hover:bg-sand disabled:opacity-30" aria-label="Previous page">
        <ChevronLeft className="size-4" />
      </button>
      {nums.map((n, i) => (
        <span key={n} className="flex items-center">
          {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
          <button
            onClick={() => onPage(n)}
            aria-current={n === page ? 'page' : undefined}
            className={cn('grid size-10 place-items-center rounded-md text-sm', n === page ? 'bg-maroon text-ivory' : 'hover:bg-sand')}
          >
            {n}
          </button>
        </span>
      ))}
      <button onClick={() => onPage(page + 1)} disabled={page >= pages} className="grid size-10 place-items-center rounded-md hover:bg-sand disabled:opacity-30" aria-label="Next page">
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
