import { ArrowRight, ChevronLeft, ChevronRight, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router';
import type { ProductCardDTO } from '@goldshop/shared';
import { FadeHero } from '../components/FadeHero';
import { Seo } from '../components/Seo';
import { Dropdown } from '../components/ui/Dropdown';
import { Suggestions } from '../components/product/Suggestions';
import { ButtonLink } from '../components/ui/Button';
import { PageFade, Reveal } from '../components/ui/Motion';
import { EmptyState, Img, Price, Skeleton } from '../components/ui/misc';
import { useCartActions, useMe, useProduct, useProductsByIds, useSettings, useWishlist } from '../lib/hooks';
import { cn, formatGrams, inr, purityLabel } from '../lib/utils';

export default function Wishlist() {
  const { user } = useMe();
  const { data: s } = useSettings();
  const wl = useWishlist();
  const local = useProductsByIds(user ? [] : wl.ids);
  const items = user ? wl.serverItems : local.data;
  const loading = user ? wl.isLoading : local.isLoading && wl.ids.length > 0;
  const empty = !loading && (!items || items.length === 0);
  const count = items?.length ?? 0;

  return (
    <PageFade>
      <Seo title="Wishlist" noindex />
      <FadeHero
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Wishlist' }]}
        eyebrow="Saved for later"
        title={
          <>
            Your <em className="font-medium italic text-gold-deep">wishlist</em>
          </>
        }
        subtitle={empty ? 'Pieces you love, kept in one place until you’re ready.' : `${count} ${count === 1 ? 'piece' : 'pieces'} saved. Prices update with today’s gold rate.`}
        image={s?.wishlistPage.image}
      >
        {!user && wl.ids.length > 0 && (
          <p className="mt-4 text-sm text-muted">
            Saved on this device.{' '}
            <Link to="/login?next=/wishlist" className="font-semibold text-ink underline decoration-gold underline-offset-4">
              Sign in
            </Link>{' '}
            to keep your wishlist on every device.
          </p>
        )}
      </FadeHero>

      <div className="container-page py-10 md:py-14">
        {empty ? (
          <>
            <EmptyState title="Nothing saved yet" icon={<Heart className="size-6" strokeWidth={1.5} />} action={<ButtonLink to="/shop">Explore jewellery</ButtonLink>} className="py-8">
              Tap the heart on any piece to keep it here.
            </EmptyState>
            <Suggestions className="mt-12" />
          </>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {loading
              ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[34rem] rounded-xl" />)
              : items?.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 3) * 0.06}>
                    <WishlistCard product={p} priority={i < 3} />
                  </Reveal>
                ))}
          </div>
        )}
      </div>
    </PageFade>
  );
}

/**
 * A saved piece with its photos, earned badge, a size picker for pieces made in several sizes, and
 * buttons to add it to the bag or remove it. Full details load per piece; the card shows what it
 * already has meanwhile.
 */
function WishlistCard({ product: p, priority }: { product: ProductCardDTO; priority?: boolean }) {
  const wl = useWishlist();
  const { add } = useCartActions();
  const { data: detail } = useProduct(p.slug);
  const [photo, setPhoto] = useState(0);
  const [variantId, setVariantId] = useState('');
  const sizeRef = useRef<HTMLButtonElement>(null);
  const [sizeOpen, setSizeOpen] = useState(false);

  const images = detail?.images.length ? detail.images : [p.image, p.hoverImage].filter((x): x is NonNullable<typeof x> => Boolean(x));
  const variants = detail?.variants ?? [];
  const many = variants.length > 1;
  const chosen = variants.find((v) => v.id === variantId) ?? (variants.length === 1 ? variants[0] : undefined);
  const purchasableId = chosen?.inStock ? chosen.id : !many ? p.quickAddVariantId : undefined;
  const badge = p.badges?.includes('bestseller') ? 'Bestseller' : p.badges?.includes('new') ? 'New arrival' : null;
  const meta = [purityLabel(p.purity), formatGrams(chosen?.netWeightMg ?? p.weightMg)].filter(Boolean);
  const optionName = detail?.optionNames[0] ?? 'Size';
  const href = `/product/${p.slug}`;
  const step = (d: number) => setPhoto((i) => (i + d + images.length) % images.length);
  const btn = 'flex h-12 flex-1 items-center justify-center gap-2.5 rounded-md text-[0.75rem] font-bold uppercase tracking-[0.16em] transition-colors';

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-line/80 bg-paper shadow-[0_24px_50px_-40px_rgba(63,18,21,.55)]">
      <div className="group relative aspect-[4/3] overflow-hidden bg-sand">
        <Link to={href} tabIndex={-1} aria-hidden className="absolute inset-0">
          {images.map((img, i) => (
            <Img
              key={img.key ?? img.url ?? i}
              image={img}
              priority={priority && i === 0}
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 48vw, 100vw"
              className={cn('absolute inset-0 size-full object-cover transition-opacity duration-500', i === photo ? 'opacity-100' : 'opacity-0')}
            />
          ))}
        </Link>
        {badge && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-paper/95 px-3 py-1.5 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-gold-deep shadow-sm">
            {badge}
          </span>
        )}
        <button
          type="button"
          onClick={() => wl.toggle(p.id, p.name)}
          aria-label={`Remove ${p.name} from wishlist`}
          className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/95 text-maroon shadow-sm transition-transform hover:scale-105"
        >
          <Heart className="size-5 fill-maroon" strokeWidth={1.5} />
        </button>
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-sm hover:bg-white">
              <ChevronLeft className="size-4.5" />
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next photo" className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-sm hover:bg-white">
              <ChevronRight className="size-4.5" />
            </button>
            <span aria-hidden className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {images.map((img, i) => (
                <span key={img.key ?? img.url ?? i} className={cn('size-1.5 rounded-full transition-colors', i === photo ? 'bg-gold' : 'bg-white/85')} />
              ))}
            </span>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {p.category && <p className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-ink-2/80">{p.category.name}</p>}
        <h2 className="mt-1 text-[1.125rem] font-semibold leading-snug text-ink">
          <Link to={href} className="hover:text-gold-deep">
            {p.name}
          </Link>
        </h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[0.8125rem] text-muted">
          {meta.map((m, i) => (
            <span key={m} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="size-1 rounded-full bg-subtle/60" />}
              {m}
            </span>
          ))}
          {chosen && (
            <>
              <span aria-hidden className="h-3 w-px bg-line-strong" />
              <span>Code: {chosen.sku}</span>
            </>
          )}
        </p>
        {chosen ? (
          <Price paise={chosen.price.total} compareAt={chosen.compareAtPrice} className="mt-3 text-[1.625rem] font-bold text-ink" />
        ) : (
          <Price paise={p.price} from={p.priceFrom} compareAt={p.compareAtPrice} className="mt-3 text-[1.625rem] font-bold text-ink [&>span:first-child]:text-[0.55em] [&>span:first-child]:text-gold-deep" />
        )}
        {p.price > 0 && <p className="mt-0.5 text-xs text-muted">Incl. making charges &amp; GST</p>}

        {many && (
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span id={`size-${p.id}`} className="w-10 shrink-0 font-semibold text-ink-2">
              {optionName}
            </span>
            <div className="min-w-0 flex-1">
              <Dropdown
                triggerRef={sizeRef}
                aria-labelledby={`size-${p.id}`}
                size="sm"
                open={sizeOpen}
                onOpenChange={setSizeOpen}
                value={variantId}
                onChange={setVariantId}
                placeholder={`Select ${optionName.toLowerCase()}`}
                options={variants.map((v) => ({
                  value: v.id,
                  label: v.label,
                  hint: v.inStock ? inr(v.price.total) : 'Sold out',
                  disabled: !v.inStock,
                }))}
              />
            </div>
          </div>
        )}

        <div className="mt-auto flex gap-3 pt-5">
          {purchasableId ? (
            <button
              type="button"
              onClick={() => add.mutate({ productId: p.id, variantId: purchasableId, qty: 1 })}
              disabled={add.isPending}
              className={cn(btn, 'bg-maroon text-ivory hover:bg-maroon-2 disabled:opacity-70')}
            >
              <ShoppingBag className="size-4.5" strokeWidth={1.6} aria-hidden />
              {add.isPending ? 'Adding…' : 'Add to bag'}
              <ArrowRight className="size-4" aria-hidden />
            </button>
          ) : many && p.inStock ? (
            <button type="button" onClick={() => {
                sizeRef.current?.focus();
                setSizeOpen(true);
              }} className={cn(btn, 'bg-maroon text-ivory hover:bg-maroon-2')}>
              <ShoppingBag className="size-4.5" strokeWidth={1.6} aria-hidden />
              Choose {optionName.toLowerCase()}
              <ArrowRight className="size-4" aria-hidden />
            </button>
          ) : !p.inStock ? (
            <Link to={href} className={cn(btn, 'border border-line-strong text-ink-2 hover:border-ink hover:text-ink')}>
              Sold out — view details
            </Link>
          ) : (
            <span className={cn(btn, 'bg-sand text-muted')}>Loading…</span>
          )}
          <button
            type="button"
            onClick={() => wl.toggle(p.id, p.name)}
            aria-label={`Delete ${p.name} from wishlist`}
            className="grid size-12 shrink-0 place-items-center rounded-md border border-line-strong/70 text-ink-2 transition-colors hover:border-danger hover:text-danger"
          >
            <Trash2 className="size-4.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </article>
  );
}
