import { AnimatePresence, m } from 'framer-motion';
import {
  ArrowRight,
  BadgeIndianRupee,
  BookOpen,
  ChartColumnIncreasing,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  ChevronRight,
  Coins,
  Crown,
  Flower2,
  Gift,
  FileText,
  Gem,
  Headset,
  Heart,
  LayoutGrid,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
  User,
  type LucideIcon,
} from 'lucide-react';
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { PURITIES, type PurityKey } from '@goldshop/shared';
import { useCart, useCategories, useCollections, useMe, useSettings, useWishlist } from '../../lib/hooks';
import { useUI } from '../../lib/ui';
import { cn, inr, rateFreshness } from '../../lib/utils';
import { LotusMark } from '../AboutLegacy';
import { CategoryGlyph } from '../CategoryGlyph';
import { Mark } from '../Logo';
import { Img } from '../ui/misc';

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * The rates in one still row when they all fit; otherwise — on phones, or when the store shows many
 * purities — a ticker that loops seamlessly (two copies side by side), pauses under a finger, and
 * stays still but scrollable for anyone who prefers reduced motion. Fit is measured, not guessed.
 */
function RateStrip({ parts, signature }: { parts: ReactNode[]; signature: string }) {
  const box = useRef<HTMLSpanElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [fits, setFits] = useState(true);
  useLayoutEffect(() => {
    const b = box.current;
    const p = probe.current;
    if (!b || !p) return;
    const check = () => setFits(p.scrollWidth <= b.clientWidth + 1);
    const ro = new ResizeObserver(check);
    ro.observe(b);
    check();
    return () => ro.disconnect();
  }, [signature]);
  const rule = <span aria-hidden className="h-3.5 w-px shrink-0 bg-ivory/25" />;
  const still = parts.map((part, i) => (
    <Fragment key={i}>
      {i > 0 && rule}
      <span className="whitespace-nowrap">{part}</span>
    </Fragment>
  ));
  const loop = parts.map((part, i) => (
    <Fragment key={i}>
      <span className="whitespace-nowrap">{part}</span>
      {rule}
    </Fragment>
  ));
  return (
    <span ref={box} className="relative block min-w-0 flex-1 overflow-hidden tabular">
      <span ref={probe} aria-hidden className="invisible absolute left-0 top-0 flex w-max items-center gap-4">
        {still}
      </span>
      {fits ? (
        <span className="flex items-center gap-4">{still}</span>
      ) : (
        <span className="block overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] motion-reduce:overflow-x-auto motion-reduce:scrollbar-none">
          <span
            className="flex w-max animate-[rate-ticker_var(--ticker)_linear_infinite] hover:[animation-play-state:paused] active:[animation-play-state:paused] motion-reduce:animate-none"
            style={{ '--ticker': `${parts.length * 3.5 + 2}s` } as CSSProperties}
          >
            <span className="flex shrink-0 items-center gap-4 pr-4">{loop}</span>
            <span aria-hidden className="flex shrink-0 items-center gap-4 pr-4 motion-reduce:hidden">
              {loop}
            </span>
          </span>
        </span>
      )}
    </span>
  );
}

export function RateBar() {
  const { data: s } = useSettings();
  if (!s) return <div className="h-9 bg-maroon lg:h-10" />;
  const available = s.displayRates.filter((k) => s.goldRates[k]);
  // 22K leads: it's the rate most jewellery is priced on.
  const keys = available.includes('gold22') ? ['gold22' as PurityKey, ...available.filter((k) => k !== 'gold22')] : available;
  const fresh = rateFreshness(s.goldRates.updatedAt);
  const parts = [
    ...keys.map((k) => (
      <span key={k}>
        <span className="text-gold-soft">{PURITIES[k].label}</span> {inr(s.goldRates[k]!)}
        <span className="text-ivory/55">/g</span>
      </span>
    )),
    <span key="fresh" className="text-ivory/60">
      {fresh.label}
    </span>,
  ];
  return (
    <div className="relative overflow-hidden bg-maroon text-[0.75rem] text-ivory/85 lg:text-[0.8125rem]">
      <LotusMark className="pointer-events-none absolute -left-6 -top-5 hidden w-20 text-gold-soft opacity-20 lg:block" />
      <LotusMark className="pointer-events-none absolute -right-6 -top-5 hidden w-20 text-gold-soft opacity-20 lg:block" />
      <div className="container-page relative flex h-9 items-center justify-between gap-6 lg:h-10">
        {keys.length ? (
          <Link
            to="/gold-rate"
            className="flex min-w-0 flex-1 items-center gap-4 hover:text-ivory"
            aria-label={`Gold rates: ${keys.map((k) => `${PURITIES[k].label} ${inr(s.goldRates[k]!)} per gram`).join(', ')}. ${fresh.label}. See details`}
          >
            <span className="hidden shrink-0 items-center gap-2 text-2xs font-semibold uppercase tracking-[0.22em] text-gold-soft sm:inline-flex">
              <ChartNoAxesColumnIncreasing className="size-4" strokeWidth={1.8} aria-hidden />
              {fresh.today ? 'Today’s gold rate' : 'Gold rate'}
            </span>
            <RateStrip parts={parts} signature={`${keys.map((k) => `${k}:${s.goldRates[k]}`).join()}|${fresh.label}`} />
          </Link>
        ) : (
          <span className="truncate">{s.store.tagline}</span>
        )}
        <div className="hidden shrink-0 items-center gap-5 md:flex">
          {s.announcement.enabled && (
            <span className="hidden max-w-[30rem] items-center gap-2 xl:inline-flex">
              <BadgeIndianRupee className="size-4 shrink-0 text-gold-soft" strokeWidth={1.6} aria-hidden />
              {s.announcement.href ? (
                <Link to={s.announcement.href} className="truncate underline decoration-ivory/40 underline-offset-4 hover:text-ivory hover:decoration-gold-soft">
                  {s.announcement.text}
                </Link>
              ) : (
                <span className="truncate">{s.announcement.text}</span>
              )}
            </span>
          )}
          {s.announcement.enabled && <span aria-hidden className="hidden h-3.5 w-px bg-ivory/25 xl:block" />}
          <Link to="/track-order" className="inline-flex items-center gap-2 whitespace-nowrap underline decoration-ivory/40 underline-offset-4 hover:text-ivory hover:decoration-gold-soft">
            <Truck className="size-4 text-gold-soft" strokeWidth={1.6} aria-hidden />
            Track order
          </Link>
        </div>
      </div>
    </div>
  );
}

type MenuKey = 'shop' | 'collections' | null;

/** Brand row height on desktop. The header is pinned at minus this, so the row scrolls away and the nav row stays. */
const BRAND_ROW = 'lg:h-[7.25rem]';
const STICK_OFFSET = 'lg:-top-[7.25rem]';

const iconBtn = 'relative grid size-10 place-items-center rounded-full text-ink-2 transition-colors hover:bg-sand hover:text-ink';
/** Desktop icon with its label underneath. */
const labelled = 'relative flex flex-col items-center gap-1 px-2 text-[0.75rem] text-ink-2 transition-colors hover:text-ink';

export function Header() {
  const { data: settings } = useSettings();
  const { data: cart } = useCart();
  const { user } = useMe();
  const wishlist = useWishlist();
  const { setSearchOpen, setMenuOpen, openCart } = useUI();
  const [scrolled, setScrolled] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [menu, setMenu] = useState<MenuKey>(null);
  const timer = useRef<number | undefined>(undefined);
  const brandRow = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const on = () => {
      setScrolled(window.scrollY > 8);
      // Desktop only: once the brand row has scrolled out, the pinned nav row shows search and bag.
      const bottom = brandRow.current?.getBoundingClientRect().bottom ?? 1;
      setStuck(window.innerWidth >= 1024 && bottom <= 1);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);
  useEffect(() => setMenu(null), [location.pathname, location.search]);

  const openSoon = (k: MenuKey) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMenu(k), menu ? 0 : 110);
  };
  const closeSoon = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMenu(null), 180);
  };

  const name = settings?.store.name ?? '';
  const brand = settings?.brand;
  const count = cart?.itemCount ?? 0;
  const accountHref = user ? (user.role === 'customer' ? '/account' : '/admin') : '/login';
  const bagLabel = `Shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`;
  const countBadge = (pos: string) => (
    <AnimatePresence>
      {count > 0 && (
        <m.span
          key={count}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn('absolute grid min-w-[1.25rem] place-items-center rounded-full bg-maroon px-1 text-[0.6875rem] font-bold leading-[1.25rem] text-ivory tabular ring-2 ring-ivory', pos)}
        >
          {count}
        </m.span>
      )}
    </AnimatePresence>
  );
  const bag = (
    <button type="button" onClick={openCart} className={iconBtn} aria-label={bagLabel}>
      <ShoppingBag className="size-5" strokeWidth={1.4} />
      {countBadge('right-0 top-0')}
    </button>
  );

  // The store's address or map link must exist before we invite anyone to visit.
  const visitHref = settings?.store.address || settings?.store.mapUrl ? '/contact' : undefined;

  const navItem =
    'group/nav relative flex h-10 items-center gap-2 whitespace-nowrap text-[0.75rem] font-semibold uppercase tracking-[0.16em] transition-colors 2xl:tracking-[0.2em]';
  const underline = (on: boolean) => (
    <span
      aria-hidden
      className={cn(
        'absolute inset-x-0 bottom-0 h-px origin-center bg-gold transition-transform duration-500 ease-[var(--ease-lux)]',
        on ? 'scale-x-100' : 'scale-x-0 group-hover/nav:scale-x-100',
      )}
    />
  );
  // `wide` links only fit from xl up; on smaller laptops they stay reachable through the mega menu and footer.
  const pages: { to: string; label: string; icon: LucideIcon; wide?: boolean }[] = [
    { to: '/gold-rate', label: 'Gold rate', icon: ChartNoAxesColumnIncreasing },
    ...(settings?.savingsPlan.enabled ? [{ to: '/gold-savings-plan', label: 'Savings plan', icon: Coins, wide: true }] : []),
    { to: '/about', label: 'Our story', icon: Gem },
    { to: '/journal', label: 'Journal', icon: FileText, wide: true },
    { to: '/contact', label: 'Contact', icon: Headset },
  ];
  const divider = (wide?: boolean) => <span aria-hidden className={cn('h-6 w-px shrink-0 bg-line-strong/60', wide && 'hidden xl:block')} />;
  // Icons join the labels only once there's room for them beside Contact and "Visit our store".
  const navIcon = 'hidden size-[1.125rem] shrink-0 text-gold min-[1360px]:block';

  return (
    <header
      className={cn('sticky top-0 z-40', STICK_OFFSET)}
      onMouseLeave={closeSoon}
      onKeyDown={(e) => e.key === 'Escape' && setMenu(null)}
    >
      {/* ------------------------------------------------------------ brand row */}
      <div
        ref={brandRow}
        className={cn(
          'relative bg-ivory transition-shadow duration-300',
          scrolled && 'max-lg:shadow-[0_8px_30px_-20px_rgba(30,24,19,.4)]',
        )}
        onMouseEnter={closeSoon}
      >
        <div className={cn('container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4', BRAND_ROW)}>
          {/* left */}
          <div className="flex items-center gap-1">
            <button type="button" className={cn(iconBtn, '-ml-2 lg:hidden')} onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <Menu className="size-5.5" strokeWidth={1.4} />
            </button>
            <button type="button" className={cn(iconBtn, 'lg:hidden')} onClick={() => setSearchOpen(true)} aria-label="Search">
              <Search className="size-5" strokeWidth={1.4} />
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="group hidden h-12 w-full max-w-[21rem] items-center gap-3 rounded-full border border-line-strong/70 bg-paper/70 pl-4 pr-1.5 text-left text-[0.875rem] text-muted shadow-[inset_0_1px_2px_rgba(30,24,19,.04)] transition-colors hover:border-gold lg:flex"
            >
              <Search className="size-[1.125rem] shrink-0 text-ink-2 transition-colors group-hover:text-gold-deep" strokeWidth={1.6} aria-hidden />
              <span className="flex-1 truncate">Search jhumkas, chains, rings…</span>
              <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full border border-gold/30 bg-gold-pale/40 text-gold">
                <LotusMark className="w-6" />
              </span>
            </button>
          </div>

          {/* centre: compact wordmark on phones, the full lockup on desktop (the uploaded logo once there is one) */}
          <Link to="/" className="justify-self-center text-ink" aria-label={`${name || 'Store'} — home`}>
            {brand?.logo ? (
              <Img image={brand.logo} priority sizes="140px" width={480} alt="" className="h-12 w-auto lg:hidden" />
            ) : (
              <span className="block whitespace-nowrap font-display text-[0.95rem] font-semibold uppercase leading-none tracking-[0.16em] [margin-right:-0.16em] sm:text-[1.05rem] sm:tracking-[0.24em] sm:[margin-right:-0.24em] lg:hidden">
                {name}
              </span>
            )}
            {brand?.logo ? (
              <Img image={brand.logo} priority sizes="260px" width={480} alt="" className="hidden h-[6.25rem] w-auto lg:block" />
            ) : (
            <span className="hidden flex-col items-center lg:flex">
              <Mark className="mb-2 h-9 w-8 text-gold" />
              <span className="whitespace-nowrap font-display text-[1.875rem] font-semibold uppercase leading-none tracking-[0.3em] [margin-right:-0.3em]">
                {name}
              </span>
              {settings?.store.tagline && (
                <span className="mt-2.5 flex items-center gap-2.5 whitespace-nowrap text-[0.5625rem] font-semibold uppercase tracking-[0.32em] text-gold-deep">
                  <span aria-hidden className="h-px w-8 bg-gold/50" />
                  {settings.store.tagline}
                  <span aria-hidden className="h-px w-8 bg-gold/50" />
                </span>
              )}
            </span>
            )}
          </Link>

          {/* right: icons on phones, icons with labels on desktop */}
          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <Link to={accountHref} className={cn(iconBtn, 'hidden sm:grid lg:hidden')} aria-label={user ? 'Your account' : 'Sign in'}>
              <User className="size-5" strokeWidth={1.4} />
            </Link>
            <Link to="/wishlist" className={cn(iconBtn, 'lg:hidden')} aria-label={`Wishlist, ${wishlist.ids.length} saved`}>
              <Heart className="size-5" strokeWidth={1.4} />
              {wishlist.ids.length > 0 && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-gold" />}
            </Link>
            <span className="-mr-2 lg:hidden">{bag}</span>

            <div className="hidden items-center gap-4 lg:flex">
              <Link to={accountHref} className={labelled} aria-label={user ? 'Your account' : 'Sign in'}>
                <User className="size-6" strokeWidth={1.3} aria-hidden />
                <span aria-hidden>Account</span>
              </Link>
              <Link to="/wishlist" className={labelled} aria-label={`Wishlist, ${wishlist.ids.length} saved`}>
                <span className="relative">
                  <Heart className="size-6" strokeWidth={1.3} aria-hidden />
                  {wishlist.ids.length > 0 && <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-gold ring-2 ring-ivory" />}
                </span>
                <span aria-hidden>Wishlist</span>
              </Link>
              <span aria-hidden className="h-12 w-px bg-line-strong/60" />
              <button type="button" onClick={openCart} className={labelled} aria-label={bagLabel}>
                <span className="relative">
                  <ShoppingBag className="size-6" strokeWidth={1.3} aria-hidden />
                  {countBadge('-right-2 -top-2')}
                </span>
                <span aria-hidden>Bag</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------- nav row (desktop) */}
      <div
        className={cn(
          'relative hidden border-y bg-ivory/95 backdrop-blur-md transition-[border-color,box-shadow] duration-300 lg:block',
          stuck || menu ? 'border-t-transparent border-b-line shadow-[0_10px_30px_-22px_rgba(30,24,19,.45)]' : 'border-line/80 shadow-[0_12px_30px_-28px_rgba(30,24,19,.4)]',
        )}
      >
        <nav aria-label="Main" className="container-page flex h-16 items-center justify-between gap-3">
          <button
            type="button"
            className={cn(
              'flex h-11 items-center gap-2.5 rounded-lg bg-maroon px-5 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-ivory shadow-[inset_0_0_0_1px_rgba(217,184,114,.35),0_8px_18px_-10px_rgba(63,18,21,.8)] transition-colors hover:bg-maroon-2',
              menu === 'shop' && 'bg-maroon-2',
            )}
            aria-expanded={menu === 'shop'}
            aria-controls="mega-shop"
            onMouseEnter={() => openSoon('shop')}
            onClick={() => setMenu(menu === 'shop' ? null : 'shop')}
          >
            <LayoutGrid className="size-4" strokeWidth={1.8} aria-hidden />
            Shop
            <ChevronDown className={cn('size-3.5 transition-transform duration-300', menu === 'shop' && 'rotate-180')} strokeWidth={2} aria-hidden />
          </button>
          {divider()}
          <button
            type="button"
            className={cn(navItem, menu === 'collections' ? 'text-gold-deep' : 'text-ink-2 hover:text-ink')}
            aria-expanded={menu === 'collections'}
            aria-controls="mega-collections"
            onMouseEnter={() => openSoon('collections')}
            onClick={() => setMenu(menu === 'collections' ? null : 'collections')}
          >
            <span aria-hidden className="size-1.5 rotate-45 bg-gold" />
            Collections
            <ChevronDown className={cn('size-3.5 transition-transform duration-300', menu === 'collections' && 'rotate-180')} strokeWidth={2} aria-hidden />
            {underline(menu === 'collections')}
          </button>
          {pages.map((p) => (
            <Fragment key={p.to}>
              {divider(p.wide)}
              <NavLink to={p.to} onMouseEnter={closeSoon} className={cn('flex items-center', p.wide && 'hidden xl:flex')}>
                {({ isActive }) =>
                  isActive ? (
                    // The current page sits in a gold-ruled box.
                    <span className={cn(navItem, 'gap-2.5 rounded-md border border-gold/80 px-4 text-ink')}>
                      <p.icon className={navIcon} strokeWidth={1.4} aria-hidden />
                      {p.label}
                    </span>
                  ) : (
                    <span className={cn(navItem, 'gap-2.5 text-ink-2 hover:text-ink')}>
                      <p.icon className={navIcon} strokeWidth={1.4} aria-hidden />
                      {p.label}
                      {underline(false)}
                    </span>
                  )
                }
              </NavLink>
            </Fragment>
          ))}
          {divider()}

          {stuck ? (
            // Pinned: the brand row (with search and bag) has scrolled away, so they move here.
            <div onMouseEnter={closeSoon} className="flex items-center gap-1">
              <button type="button" className={iconBtn} onClick={() => setSearchOpen(true)} aria-label="Search">
                <Search className="size-[1.125rem]" strokeWidth={1.4} />
              </button>
              <Link to="/wishlist" className={iconBtn} aria-label={`Wishlist, ${wishlist.ids.length} saved`}>
                <Heart className="size-[1.125rem]" strokeWidth={1.4} />
              </Link>
              <span className="-mr-2">{bag}</span>
            </div>
          ) : visitHref ? (
            <Link
              to={visitHref}
              onMouseEnter={closeSoon}
              className="relative flex h-11 items-center gap-2.5 whitespace-nowrap rounded-lg border border-gold/70 bg-paper/80 px-5 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-gold-deep transition-colors hover:border-gold hover:bg-gold-pale/40"
            >
              <LotusMark className="pointer-events-none absolute -left-9 top-1/2 hidden w-8 -translate-y-1/2 text-gold opacity-40 2xl:block" />
              <MapPin className="size-4 text-gold" strokeWidth={1.8} aria-hidden />
              Visit our store
              <LotusMark className="pointer-events-none absolute -right-9 top-1/2 hidden w-8 -translate-y-1/2 text-gold opacity-40 2xl:block" />
            </Link>
          ) : (
            <span aria-hidden className="w-px" />
          )}
        </nav>
      </div>

      {/* ------------------------------------------------------------ mega menu */}
      <AnimatePresence>
        {menu && (
          <>
            <m.div
              key="scrim"
              aria-hidden
              className="fixed inset-0 -z-10 hidden bg-ink/30 backdrop-blur-[2px] lg:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onMouseEnter={closeSoon}
              onClick={() => setMenu(null)}
            />
            <m.div
              key={menu}
              id={`mega-${menu}`}
              className="absolute inset-x-0 top-full hidden border-b border-line bg-paper shadow-[0_40px_60px_-40px_rgba(30,24,19,.45)] lg:block"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease }}
              onMouseEnter={() => window.clearTimeout(timer.current)}
            >
              {menu === 'shop' ? <ShopMenu /> : <CollectionsMenu />}
            </m.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

const pieces = (n = 0) => `${n} ${n === 1 ? 'piece' : 'pieces'}`;

const ctaDark =
  'inline-flex h-11 items-center gap-2.5 self-start rounded-md bg-maroon px-5 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ivory shadow-[0_10px_20px_-12px_rgba(63,18,21,.9)] transition-colors hover:bg-maroon-2';

/** Category tiles with photographs and real piece counts, beside a featured collection. */
function ShopMenu() {
  const { data: cats } = useCategories();
  const { data: cols } = useCollections();
  const list = (cats ?? []).filter((c) => (c.productCount ?? 0) > 0).slice(0, 6);
  const featured = cols?.find((c) => c.isFeatured) ?? cols?.[0];

  return (
    <div className="container-page grid grid-cols-[13rem_minmax(0,1fr)] gap-6 py-8 xl:grid-cols-[14rem_minmax(0,1fr)_16rem] 2xl:grid-cols-[16rem_minmax(0,1fr)_19rem] 2xl:gap-7">
      <div className="relative flex flex-col justify-center">
        <LotusMark className="pointer-events-none absolute -bottom-10 -left-8 w-40 text-gold opacity-[0.1]" />
        <p className="eyebrow">Shop</p>
        <p className="mt-3 font-display text-[1.75rem] font-medium leading-[1.12] text-ink 2xl:text-[2.125rem]">Discover jewellery for every occasion</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">Every piece priced at today’s gold rate, with the full breakdown shown.</p>
        <Link to="/shop" className={cn(ctaDark, 'relative mt-6')}>
          All jewellery <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <ul className="grid content-center gap-3" style={{ gridTemplateColumns: `repeat(${Math.max(list.length, 1)}, minmax(0, 1fr))` }}>
        {list.map((c) => (
          <li key={c.id}>
            <Link to={`/shop/${c.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-lg bg-sand">
              <Img image={c.image} sizes="14vw" width={480} className="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-lux)] group-hover:scale-105" />
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 via-45% to-transparent" />
              <span aria-hidden className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full bg-gold-soft text-maroon opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <ArrowRight className="size-3.5" />
              </span>
              <span className="absolute inset-x-0 bottom-0 p-3.5 text-ivory">
                <span className="block font-display text-[1.1875rem] font-medium leading-tight 2xl:text-[1.3125rem]">{c.name}</span>
                <span className="mt-0.5 block text-xs text-ivory/80">{pieces(c.productCount)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {featured && (
        <Link to={`/collections/${featured.slug}`} className="group relative hidden overflow-hidden rounded-lg bg-maroon text-ivory xl:flex">
          <span aria-hidden className="absolute inset-y-0 right-0 w-[70%] [mask-image:linear-gradient(to_right,transparent,black_55%)]">
            <Img image={featured.banner ?? featured.image} sizes="18vw" width={960} className="size-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
          </span>
          <span className="relative flex flex-col justify-center p-6">
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-gold-soft">{featured.eyebrow || 'Featured collection'}</span>
            <span className="mt-2 max-w-[11rem] font-display text-[1.75rem] font-medium uppercase leading-[1.05] tracking-[0.04em]">{featured.name}</span>
            <span aria-hidden className="mt-3 flex w-24 items-center gap-1 text-gold-soft">
              <span className="h-px flex-1 bg-current opacity-60" />
              <span className="size-1.5 rotate-45 bg-current" />
              <span className="h-px flex-1 bg-current opacity-60" />
            </span>
            {featured.tagline && <span className="mt-3 max-w-[11rem] text-sm leading-relaxed text-ivory/85">{featured.tagline}</span>}
            <span className="mt-5 inline-flex h-10 items-center gap-2 self-start rounded-md bg-gradient-to-b from-[#ecd08f] to-[#c39a4a] px-4 text-[0.75rem] font-bold uppercase tracking-[0.14em] text-maroon">
              Shop now <ArrowRight className="size-3.5" aria-hidden />
            </span>
          </span>
        </Link>
      )}
    </div>
  );
}

const COLLECTION_GLYPHS = [Gift, Gem, Flower2, Crown, Sparkles];

/**
 * Browse by category (with each category's types), quick ways in, and collection tiles. The first
 * tile follows the hovered category.
 */
function CollectionsMenu() {
  const { data: cats } = useCategories();
  const { data: cols } = useCollections();
  const { data: s } = useSettings();
  const list = (cats ?? []).slice(0, 8);
  const [active, setActive] = useState(0);
  const cat = list[active] ?? list[0];
  const tiles = (cols ?? []).slice(0, 2);
  const heading = 'text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-gold-deep';
  const discover: { to: string; label: string; icon: LucideIcon }[] = [
    { to: '/shop?sort=newest', label: 'New arrivals', icon: Sparkles },
    { to: '/shop?sort=popular', label: 'Best selling', icon: ChartColumnIncreasing },
    { to: '/gold-rate', label: rateFreshness(s?.goldRates.updatedAt).today ? 'Today’s gold rate' : 'Gold rate', icon: TrendingUp },
    ...(cols ?? []).slice(0, 4).map((c, i) => ({ to: `/collections/${c.slug}`, label: c.name, icon: COLLECTION_GLYPHS[i % COLLECTION_GLYPHS.length] })),
    { to: '/journal', label: 'Journal & guides', icon: BookOpen },
  ];
  const tile = (to: string, image: Parameters<typeof Img>[0]['image'], title: string, text: string | undefined, label: string, extra?: string) => (
    <Link key={to} to={to} className={cn('group relative block min-h-[19rem] overflow-hidden rounded-lg bg-sand', extra)}>
      <Img image={image} sizes="20vw" width={960} className="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-lux)] group-hover:scale-105" />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 via-50% to-transparent" />
      <span className="absolute inset-x-0 bottom-0 p-5 text-ivory">
        <span className="block font-display text-[1.625rem] font-medium leading-tight">{title}</span>
        {text && <span className="mt-1 line-clamp-2 block text-[0.8125rem] leading-snug text-ivory/80">{text}</span>}
        <span className="mt-3 inline-flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold-soft">
          {label} <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" aria-hidden />
        </span>
      </span>
    </Link>
  );

  return (
    <div className="container-page grid grid-cols-[14rem_13rem_minmax(0,1fr)] gap-6 py-8 xl:grid-cols-[14rem_12rem_13rem_minmax(0,1fr)] 2xl:grid-cols-[15rem_13rem_14rem_minmax(0,1fr)] 2xl:gap-8">
      <div>
        <p className={heading}>Categories</p>
        <ul className="mt-3 space-y-0.5">
          {list.map((c, idx) => {
            const on = idx === active;
            return (
              <li key={c.id}>
                <Link
                  to={`/shop/${c.slug}`}
                  onMouseEnter={() => setActive(idx)}
                  onFocus={() => setActive(idx)}
                  className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-[0.9375rem] transition-colors', on ? 'bg-sand text-ink' : 'text-ink-2 hover:text-ink')}
                >
                  <CategoryGlyph slug={c.slug} className="size-5 shrink-0 text-gold-deep" />
                  <span className="flex-1">{c.name}</span>
                  <ChevronRight className={cn('size-4', on ? 'text-ink' : 'text-subtle')} aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-l border-line pl-6">
        {cat && (
          <>
            <p className={heading}>{cat.name}</p>
            {cat.children.length > 0 ? (
              <ul className="mt-3 space-y-2.5">
                {cat.children.map((ch) => (
                  <li key={ch.id}>
                    <Link to={`/shop/${ch.slug}`} className="text-[0.9375rem] text-ink-2 transition-colors hover:text-gold-deep">
                      {ch.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              cat.description && <p className="mt-3 text-sm leading-relaxed text-muted">{cat.description}</p>
            )}
            <Link to={`/shop/${cat.slug}`} className="mt-6 inline-flex items-center gap-2 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.16em] text-ink underline decoration-gold underline-offset-[6px] hover:text-gold-deep">
              Shop all {cat.name.toLowerCase()} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </>
        )}
      </div>

      <div className="hidden border-l border-line pl-6 xl:block">
        <p className={heading}>Discover</p>
        <ul className="mt-3 space-y-2">
          {discover.map((d) => (
            <li key={d.to}>
              <Link to={d.to} className="flex items-center gap-3 text-[0.9375rem] text-ink-2 transition-colors hover:text-gold-deep">
                <d.icon className="size-4.5 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
                {d.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {cat && tile(`/shop/${cat.slug}`, cat.image, cat.name, cat.description, 'Explore')}
        {tiles.map((c, i) => tile(`/collections/${c.slug}`, c.banner ?? c.image, c.name, c.tagline, 'Explore', i === 0 ? 'hidden xl:block' : 'hidden 2xl:block'))}
      </div>
    </div>
  );
}
