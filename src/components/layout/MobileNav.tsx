import {
  BookOpen,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  Coins,
  Gem,
  Gift,
  Headset,
  Heart,
  LayoutGrid,
  Package,
  Search,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router';
import { PURITIES, type PurityKey } from '@goldshop/shared';
import { useCategories, useMe, useSettings } from '../../lib/hooks';
import { useUI } from '../../lib/ui';
import { cn, inr, rateFreshness } from '../../lib/utils';
import { LotusMark } from '../AboutLegacy';
import { Img } from '../ui/misc';
import { Sheet } from '../ui/Sheet';

const dayMonth = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
const shortDate = (iso?: string) => (iso ? dayMonth.format(new Date(iso)) : '');

const pieces = (n = 0) => `${n} ${n === 1 ? 'piece' : 'pieces'}`;

/** A gold small-caps heading with a hairline ending in a diamond. */
function SectionTitle({ children }: { children: string }) {
  return (
    <p className="flex items-center gap-4 text-[0.75rem] font-bold uppercase tracking-[0.24em] text-ink">
      {children}
      <span aria-hidden className="flex flex-1 items-center">
        <span className="h-px flex-1 bg-gold/50" />
        <span className="size-1.5 rotate-45 bg-gold" />
      </span>
    </p>
  );
}

/** Phone menu: the store's rates up top, then categories with photos, the main pages and quick links. */
/** Silver's full names don't fit a third of the menu's rate card; these are the trade names. */
const SHORT_LABEL: Partial<Record<PurityKey, string>> = { silver999: 'Silver 999', silver925: 'Silver 925' };

export function MobileNav() {
  const { menuOpen, setMenuOpen, setSearchOpen } = useUI();
  const { data: cats } = useCategories();
  const { data: s } = useSettings();
  const { user } = useMe();
  const close = () => setMenuOpen(false);

  const rates = s ? s.displayRates.filter((k) => s.goldRates[k]) : [];
  const fresh = rateFreshness(s?.goldRates.updatedAt);
  const pages: { to: string; label: string; icon: LucideIcon }[] = [
    { to: '/collections', label: 'Collections', icon: Gift },
    { to: '/gold-rate', label: 'Gold rate', icon: ChartNoAxesColumnIncreasing },
    ...(s?.savingsPlan.enabled ? [{ to: '/gold-savings-plan', label: 'Savings plan', icon: Coins }] : []),
    { to: '/about', label: 'Our story', icon: Gem },
    { to: '/journal', label: 'Journal', icon: BookOpen },
  ];
  const utility: { to: string; label: string; icon: LucideIcon }[] = [
    { to: user ? '/account' : '/login', label: user ? 'My account' : 'Sign in', icon: User },
    { to: '/wishlist', label: 'Wishlist', icon: Heart },
    { to: '/track-order', label: 'Track order', icon: Package },
    { to: '/contact', label: 'Contact', icon: Headset },
  ];

  return (
    <Sheet open={menuOpen} onOpenChange={setMenuOpen} side="left" hideTitle title={s?.store.name || 'Menu'} className="!w-[88%] !max-w-[24rem] !bg-ivory">
      {/* overflow-x-clip: nothing inside may ever make the menu scroll sideways and cut off its left edge. */}
      <div className="relative flex min-h-full flex-col overflow-x-clip">
        {/* ------------------------------------------------ maroon top: name and rates */}
        <div className="relative overflow-hidden rounded-br-[2.75rem] bg-gradient-to-b from-maroon-2 to-maroon px-5 pb-6 pt-5 text-ivory">
          <LotusMark className="pointer-events-none absolute -left-10 top-20 w-40 text-gold-soft opacity-[0.08]" />
          <div className="relative flex items-start justify-between gap-3">
            <Link to="/" onClick={close} className="min-w-0 pt-1 text-ivory" aria-label={`${s?.store.name || 'Store'} — home`}>
              <span className="flex items-center gap-2.5">
                {s?.brand.mark && <Img image={s.brand.mark} sizes="56px" width={480} alt="" className="h-9 w-auto shrink-0" />}
                {/* The whole name, wrapping onto a second line on the narrowest phones rather than cut off. */}
                <span className={cn('block font-display font-semibold uppercase leading-[1.1]', s?.brand.mark ? 'text-[1.0625rem] tracking-[0.06em]' : 'text-[1.375rem] tracking-[0.14em]')}>{s?.store.name}</span>
              </span>
            </Link>
            <button type="button" onClick={close} className="-mr-2 -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-gold-soft hover:bg-ivory/10" aria-label="Close menu">
              <X className="size-6" strokeWidth={1.4} />
            </button>
          </div>
          {s?.store.tagline && (
            <p className="relative mt-1.5 flex items-center gap-2 text-[0.5rem] font-semibold uppercase tracking-[0.14em] text-ivory/75">
              <span aria-hidden className="h-px w-4 shrink-0 bg-gold-soft/60" />
              <span className="min-w-0 text-center leading-relaxed">{s.store.tagline}</span>
              <span aria-hidden className="h-px w-4 shrink-0 bg-gold-soft/60" />
            </p>
          )}

          {rates.length > 0 && (
            <Link to="/gold-rate" onClick={close} className="relative mt-5 block rounded-xl border border-gold-soft/60 bg-maroon/60 px-4 pb-4 pt-3.5 shadow-[inset_0_0_0_1px_rgba(217,184,114,.12)]">
              {/* Wraps on the narrowest phones so the "Updated" pill drops below instead of running out of the card. */}
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 whitespace-nowrap text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-gold-soft">
                  <ChartNoAxesColumnIncreasing className="size-4.5" strokeWidth={1.8} aria-hidden />
                  {fresh.today ? 'Today’s gold rate' : 'Gold rate'}
                </span>
                {/* "Live" only when the store has updated the rate today */}
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-gold-soft/50 px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-ivory">
                  {fresh.today ? (
                    <>
                      <span aria-hidden className="size-1.5 rounded-full bg-[#3ccb6b]" /> Live
                    </>
                  ) : (
                    <>Updated {shortDate(s!.goldRates.updatedAt)}</>
                  )}
                  <ChevronRight className="size-3" aria-hidden />
                </span>
              </span>
              {/* At most three to a row (two on the narrowest phones): more than that ran the prices into each
                  other and pushed the whole menu wider than the screen. Every rate has a divider on its left;
                  shifting the grid 1px left inside a clipped box hides the one at the start of each row. */}
              <span className="mt-3 block overflow-hidden">
                <span
                  className={cn(
                    '-ml-px grid gap-y-3 text-center',
                    rates.length === 1 ? 'grid-cols-1' : rates.length === 2 || rates.length === 4 ? 'grid-cols-2' : 'grid-cols-3 max-[340px]:grid-cols-2',
                  )}
                >
                  {rates.map((k) => (
                    <span key={k} className="min-w-0 border-l border-gold-soft/25 px-1">
                      <span className="block truncate text-[0.6875rem] font-semibold tracking-[0.08em] text-ivory/75">{SHORT_LABEL[k] ?? PURITIES[k].label}</span>
                      <span className={cn('mt-0.5 block whitespace-nowrap font-display font-semibold leading-tight text-ivory', rates.length > 2 ? 'text-[1.0625rem]' : 'text-[1.375rem]')}>{inr(s!.goldRates[k]!)}</span>
                      <span className="block text-[0.6875rem] text-ivory/60">/ gram</span>
                    </span>
                  ))}
                </span>
              </span>
            </Link>
          )}
        </div>

        {/* ---------------------------------------------------------------- body */}
        <nav aria-label="Mobile" className="relative flex-1 px-5 pb-6 pt-5">
          <button
            type="button"
            onClick={() => {
              close();
              setSearchOpen(true);
            }}
            className="flex h-12 w-full items-center gap-3 rounded-full border border-line-strong/60 bg-paper pl-4 pr-3 text-left text-[0.875rem] text-muted"
          >
            <Search className="size-5 shrink-0 text-ink-2" strokeWidth={1.5} aria-hidden />
            <span className="flex-1 truncate">Search jewellery, collections…</span>
            <ChevronRight className="size-4 text-gold" aria-hidden />
          </button>

          <div className="mt-7">
            <SectionTitle>Shop by category</SectionTitle>
            <ul className="mt-3">
              {(cats ?? []).map((c) => (
                <li key={c.id} className="border-b border-line/70 last:border-b-0">
                  <Link to={`/shop/${c.slug}`} onClick={close} className="flex items-center gap-4 py-2.5">
                    <span className="size-16 shrink-0 overflow-hidden rounded-lg border border-line bg-sand shadow-[0_6px_14px_-10px_rgba(63,18,21,.6)]">
                      <Img image={c.image} sizes="64px" width={480} className="size-full object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-[1.375rem] font-medium leading-tight text-ink">{c.name}</span>
                      {(c.productCount ?? 0) > 0 && (
                        <span className="mt-0.5 block text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-muted">{pieces(c.productCount)}</span>
                      )}
                    </span>
                    <ChevronRight className="size-4.5 shrink-0 text-ink-2" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to="/shop"
              onClick={close}
              className="mt-4 flex h-14 items-center gap-3 rounded-xl bg-gradient-to-b from-maroon-2 to-maroon px-5 text-[0.75rem] font-bold uppercase tracking-[0.22em] text-gold-pale shadow-[inset_0_0_0_1px_rgba(217,184,114,.3),0_12px_24px_-14px_rgba(63,18,21,.9)]"
            >
              <LayoutGrid className="size-5 text-gold-soft" strokeWidth={1.6} aria-hidden />
              <span className="flex-1">Shop all jewellery</span>
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>

          <div className="mt-8">
            <SectionTitle>Explore</SectionTitle>
            <ul className="mt-2">
              {pages.map((p) => (
                <li key={p.to}>
                  <Link to={p.to} onClick={close} className="flex items-center gap-4 py-2.5">
                    <p.icon className="size-6 shrink-0 text-gold" strokeWidth={1.3} aria-hidden />
                    <span className="flex-1 font-display text-[1.375rem] font-medium leading-tight text-ink">{p.label}</span>
                    <ChevronRight className="size-4.5 shrink-0 text-ink-2" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <LotusMark className="pointer-events-none absolute -bottom-6 -right-8 w-40 text-gold opacity-[0.08]" />
        </nav>

        {/* ------------------------------------------------- quick links, kept in reach */}
        <ul className="sticky bottom-0 z-10 grid grid-cols-4 border-t border-line bg-ivory/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
          {utility.map((u, i) => (
            <li key={u.to} className={cn(i > 0 && 'border-l border-line')}>
              <Link to={u.to} onClick={close} className="flex flex-col items-center gap-1.5 py-1 text-center text-[0.75rem] leading-tight text-ink-2 hover:text-ink">
                <u.icon className="size-6 text-ink" strokeWidth={1.3} aria-hidden />
                {u.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  );
}
