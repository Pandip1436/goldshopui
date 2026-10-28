import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { useProducts } from '../../lib/hooks';
import { cn } from '../../lib/utils';
import { SectionHeading } from '../ui/misc';
import { ProductRail } from './ProductCard';

/** A short rail of the newest pieces, so an empty page always offers somewhere to go next. */
export function Suggestions({
  eyebrow = 'New arrivals',
  title = 'Pieces to start with',
  bare,
  className,
}: {
  eyebrow?: string;
  title?: string;
  /** Drop the top rule when the section already starts on its own band. */
  bare?: boolean;
  className?: string;
}) {
  const { data, isLoading } = useProducts({ sort: 'newest', limit: 4 });
  if (!isLoading && !data?.items.length) return null;
  return (
    <section className={cn(!bare && 'border-t border-line pt-14', className)} aria-labelledby="suggest-title">
      <SectionHeading
        id="suggest-title"
        eyebrow={eyebrow}
        title={title}
        action={
          <Link to="/shop?sort=newest" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] underline decoration-gold underline-offset-[6px]">
            View all <ArrowRight className="size-3.5" />
          </Link>
        }
      />
      <ProductRail products={data?.items} loading={isLoading} />
    </section>
  );
}
