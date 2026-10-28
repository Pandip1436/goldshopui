import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import type { CollectionDTO } from '@goldshop/shared';
import { FadeHero } from '../components/FadeHero';
import { Seo } from '../components/Seo';
import { PageFade, Reveal } from '../components/ui/Motion';
import { Img, Skeleton } from '../components/ui/misc';
import { useCategories, useCollections, useSettings } from '../lib/hooks';
import { cn } from '../lib/utils';

export default function Collections() {
  const { data, isLoading } = useCollections();
  const { data: tree } = useCategories();
  const { data: s } = useSettings();
  const chip = 'inline-flex h-10 items-center rounded-md border px-5 text-[0.875rem] transition-colors';

  return (
    <PageFade>
      <Seo title="Collections" path="/collections" description="Jewellery gathered by occasion and by craft — from temple heritage to everyday gold." />
      <FadeHero
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Collections' }]}
        eyebrow="Collections"
        title={
          <>
            Curated for every <em className="font-medium italic text-gold-deep">occasion</em>
          </>
        }
        subtitle={s?.collectionsPage.subtitle ?? 'Meaningful jewellery for life’s beautiful moments — from temple heritage to everyday gold.'}
        image={s?.collectionsPage.image}
      >
        {/* Quick ways in: every collection, then the categories that cut across them. */}
        {Boolean(data?.length || tree?.length) && (
          <nav aria-label="Browse" className="mt-7">
            <ul className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-none sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0">
              <li>
                <span aria-current="page" className={cn(chip, 'border-maroon bg-maroon font-semibold text-ivory')}>
                  All
                </span>
              </li>
              {data?.map((c) => (
                <li key={c.id}>
                  <Link to={`/collections/${c.slug}`} className={cn(chip, 'whitespace-nowrap border-line-strong/60 bg-paper text-ink-2 hover:border-gold hover:text-ink')}>
                    {c.name}
                  </Link>
                </li>
              ))}
              {tree?.map((c) => (
                <li key={c.id}>
                  <Link to={`/shop/${c.slug}`} className={cn(chip, 'whitespace-nowrap border-line-strong/60 bg-paper text-ink-2 hover:border-gold hover:text-ink')}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </FadeHero>

      <div className="container-page py-10 md:py-14">
        <div className="grid gap-5 xl:grid-cols-2 xl:gap-6">
          {isLoading
            ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl md:aspect-[3/1] xl:aspect-[692/262]" />)
            : data?.map((c, i) => (
                // A lone last tile spans the row so the grid never ends on a gap.
                <Reveal key={c.id} delay={(i % 2) * 0.08} className={cn(data.length % 2 === 1 && i === data.length - 1 && 'xl:col-span-2')}>
                  <CollectionCard collection={c} priority={i < 2} />
                </Reveal>
              ))}
        </div>
      </div>
    </PageFade>
  );
}

/**
 * Dark card with the copy on the left. On phones the photo fills the card behind the copy; from
 * tablets up it sits on the right and fades into the dark side.
 */
function CollectionCard({ collection: c, priority }: { collection: CollectionDTO; priority?: boolean }) {
  return (
    <Link
      to={`/collections/${c.slug}`}
      className="group relative block aspect-[4/3] overflow-hidden rounded-xl bg-[#2b1310] shadow-[0_30px_60px_-40px_rgba(63,18,21,.7)] md:aspect-[3/1] xl:aspect-[692/262]"
    >
      <div className="absolute inset-0 md:left-auto md:w-[62%] md:[mask-image:linear-gradient(to_right,transparent,black_42%)]">
        <Img
          image={c.banner ?? c.image}
          priority={priority}
          sizes="(min-width: 1280px) 30vw, (min-width: 768px) 60vw, 100vw"
          width={1600}
          className="size-full object-cover transition-transform duration-[1400ms] ease-[var(--ease-lux)] group-hover:scale-[1.05]"
        />
      </div>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#2b1310] via-[#2b1310]/70 via-45% to-transparent md:hidden" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col p-6 text-ivory md:inset-y-0 md:max-w-[52%] md:justify-center md:p-9 xl:max-w-[55%]">
        <p className="flex items-center gap-3 text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-gold-soft">
          {c.eyebrow || 'Collection'}
          <span aria-hidden className="h-px w-8 bg-gold-soft/60" />
        </p>
        <h2 className="mt-3 font-display text-[2.125rem] font-medium leading-[1.02] md:text-[2.75rem] xl:text-[2.5rem] 2xl:text-[2.875rem]">{c.name}</h2>
        {c.tagline && <p className="mt-2.5 max-w-xs text-[0.9375rem] leading-snug text-ivory/85">{c.tagline}</p>}
        <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-soft">
          Explore the collection <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
        </span>
      </div>
      <span
        aria-hidden
        className="absolute bottom-5 right-5 hidden size-12 place-items-center rounded-full border border-gold-soft/50 bg-black/30 text-ivory backdrop-blur-sm transition-colors duration-300 group-hover:border-gold-soft group-hover:bg-gold-soft group-hover:text-maroon md:grid"
      >
        <ArrowRight className="size-5" />
      </span>
    </Link>
  );
}
