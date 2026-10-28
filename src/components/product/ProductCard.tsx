import { ArrowRight, Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router';
import type { ProductCardDTO } from '@goldshop/shared';
import { useCartActions, useWishlist } from '../../lib/hooks';
import { cn, formatGrams, purityLabel } from '../../lib/utils';
import { Img, Price, Skeleton, Stars } from '../ui/misc';

export function WishlistButton({ id, name, className }: { id: string; name: string; className?: string }) {
  const wl = useWishlist();
  const saved = wl.has(id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        wl.toggle(id, name);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      className={cn(
        'grid size-8 place-items-center rounded-full bg-ivory/80 text-ink-2 shadow-sm shadow-ink/5 backdrop-blur transition hover:bg-ivory hover:text-maroon-3',
        className,
      )}
    >
      <Heart className={cn('size-[0.9375rem] transition-colors', saved && 'fill-maroon-3 text-maroon-3')} strokeWidth={1.5} />
    </button>
  );
}

const pill = 'rounded-full px-2.5 py-1 text-[0.5625rem] font-bold uppercase leading-none tracking-[0.16em] shadow-sm sm:text-[0.625rem]';

/**
 * A piece on a rounded card: the photograph with any earned badge and the wishlist heart, then
 * category, name, purity and weight, the price and a full-width button. `row` lays it out
 * horizontally for the list view.
 */
export function ProductCard({ product: p, priority, sizes, layout = 'grid' }: { product: ProductCardDTO; priority?: boolean; sizes?: string; layout?: 'grid' | 'row' }) {
  const { add } = useCartActions();
  const row = layout === 'row';
  const meta = [purityLabel(p.purity), formatGrams(p.weightMg)].filter(Boolean);
  const canQuickAdd = Boolean(p.quickAddVariantId && p.inStock && p.price > 0);
  const href = `/product/${p.slug}`;
  const imgSizes = sizes ?? (row ? '(min-width: 640px) 14rem, 9rem' : '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw');
  // Only badges the data supports: sold out, a top seller by real sales, or a recent addition.
  const badge = !p.inStock
    ? { label: 'Sold out', cls: 'bg-ink text-ivory' }
    : p.badges?.includes('bestseller')
      ? { label: 'Bestseller', cls: 'bg-maroon text-ivory' }
      : p.badges?.includes('new')
        ? { label: 'New arrival', cls: 'bg-[#4b6b3c] text-ivory' }
        : null;
  const btn =
    // Tighter tracking on phones: two to a row at 320px, "Choose size →" ran into the pill's rounded ends.
    'flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full text-[0.625rem] font-bold uppercase tracking-[0.1em] transition-colors sm:h-11 sm:gap-2 sm:text-[0.6875rem] sm:tracking-[0.16em]';

  return (
    <article
      className={cn(
        'group relative flex h-full overflow-hidden rounded-xl border border-line/70 bg-paper shadow-[0_18px_40px_-34px_rgba(63,18,21,.5)] transition-[border-color,box-shadow] duration-500 hover:border-gold/50 hover:shadow-[0_28px_50px_-34px_rgba(63,18,21,.55)]',
        row ? 'flex-row' : 'flex-col',
      )}
    >
      <div className={cn('relative overflow-hidden bg-sand', row ? 'w-36 shrink-0 sm:w-56' : 'aspect-[4/3]')}>
        {/* The title below is the focusable link; this image link is a mouse/touch convenience. */}
        <Link to={href} className="absolute inset-0" tabIndex={-1} aria-hidden>
          <Img
            image={p.image}
            priority={priority}
            sizes={imgSizes}
            className={cn(
              'absolute inset-0 size-full object-cover transition-[transform,opacity] duration-[1100ms] ease-[var(--ease-lux)] group-hover:scale-[1.045]',
              p.hoverImage && 'md:group-hover:opacity-0',
            )}
          />
          {p.hoverImage && (
            <Img
              image={p.hoverImage}
              sizes={imgSizes}
              className="absolute inset-0 hidden size-full scale-[1.045] object-cover opacity-0 transition-opacity duration-700 md:block md:group-hover:opacity-100"
            />
          )}
        </Link>

        {badge && (
          <span className={cn(pill, badge.cls, 'pointer-events-none absolute left-2.5 top-2.5 sm:left-3 sm:top-3')}>{badge.label}</span>
        )}
        {/* Bottom-left, clear of the wishlist heart: on a phone-width card it ran underneath it at the top. */}
        {p.inStock && p.makingDiscountPercent > 0 && (
          <span className={cn(pill, 'pointer-events-none absolute bottom-2.5 left-2.5 bg-paper/95 text-gold-deep sm:bottom-3 sm:left-3')}>{p.makingDiscountPercent}% off making</span>
        )}
        <WishlistButton id={p.id} name={p.name} className="absolute right-2.5 top-2.5 size-9 bg-white/95 sm:right-3 sm:top-3" />
      </div>

      <div className={cn('flex flex-1 flex-col', row ? 'p-4 sm:p-6' : 'px-3.5 pb-4 pt-3.5 sm:px-5 sm:pb-5 sm:pt-4')}>
        {p.category && <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-ink-2/80 sm:text-[0.625rem]">{p.category.name}</p>}
        <h3 className={cn('mt-1 line-clamp-2 font-display font-semibold leading-snug text-ink', row ? 'text-[1.25rem] sm:text-[1.5rem]' : 'text-[1.0625rem] sm:text-[1.25rem]')}>
          <Link to={href} className="transition-colors hover:text-gold-deep">
            {p.name}
          </Link>
        </h3>
        {meta.length > 0 && (
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
            {meta.map((m, i) => (
              <span key={m} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden className="size-1 rounded-full bg-subtle/60" />}
                {m}
              </span>
            ))}
          </p>
        )}
        <Price paise={p.price} from={p.priceFrom} compareAt={p.compareAtPrice} className={cn('mt-3 font-bold text-ink', row ? 'text-xl' : 'text-[1.0625rem] sm:text-[1.25rem]')} />
        {p.price > 0 && <p className="mt-0.5 text-[0.6875rem] text-muted sm:text-xs">Incl. making charges &amp; GST</p>}
        {p.ratingCount > 0 && <Stars value={p.ratingAvg} size={11} className="mt-1.5" />}

        <div className={cn('mt-auto pt-4', row && 'max-w-xs')}>
          {canQuickAdd ? (
            <button
              type="button"
              onClick={() => add.mutate({ productId: p.id, variantId: p.quickAddVariantId!, qty: 1 })}
              disabled={add.isPending}
              className={cn(btn, 'bg-maroon text-ivory hover:bg-maroon-2 disabled:opacity-70')}
              aria-label={`Add ${p.name} to bag`}
            >
              <ShoppingBag className="size-3.5" strokeWidth={1.8} aria-hidden />
              {add.isPending ? 'Adding…' : 'Add to bag'}
            </button>
          ) : p.inStock ? (
            // Pieces made in several sizes are chosen on their own page.
            <Link to={href} tabIndex={-1} aria-hidden className={cn(btn, 'bg-maroon text-ivory hover:bg-maroon-2')}>
              Choose size <ArrowRight className="size-3.5" />
            </Link>
          ) : (
            <Link to={href} tabIndex={-1} aria-hidden className={cn(btn, 'border border-line-strong text-ink-2 hover:border-ink hover:text-ink')}>
              View details
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton({ layout = 'grid' }: { layout?: 'grid' | 'row' }) {
  const row = layout === 'row';
  return (
    <div className={cn('flex overflow-hidden rounded-xl border border-line/70 bg-paper', row ? 'flex-row' : 'flex-col')}>
      <Skeleton className={row ? 'h-44 w-36 shrink-0 sm:w-56' : 'aspect-[4/3] w-full'} />
      <div className="flex-1 space-y-2.5 p-5">
        <Skeleton className="h-2.5 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="mt-4 h-5 w-1/3" />
        <Skeleton className="mt-4 h-10 w-full rounded-full" />
      </div>
    </div>
  );
}

export function ProductGrid({
  products,
  loading,
  count = 8,
  className,
  layout = 'grid',
}: {
  products?: ProductCardDTO[];
  loading?: boolean;
  count?: number;
  className?: string;
  layout?: 'grid' | 'row';
}) {
  return (
    <div className={layout === 'row' ? 'grid gap-4' : cn('grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-5 sm:gap-y-6 md:grid-cols-3 xl:grid-cols-4', className)}>
      {loading
        ? Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} layout={layout} />)
        : products?.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 2} layout={layout} />)}
    </div>
  );
}

/** A short run of pieces below a section heading: two to a row on phones, a 4-up grid on large screens. */
export function ProductRail({ products, loading }: { products?: ProductCardDTO[]; loading?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-5 sm:gap-y-6 md:grid-cols-3 xl:grid-cols-4">
      {loading
        ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
        : products?.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
