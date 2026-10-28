import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ChevronRight, Minus, Plus, Star } from 'lucide-react';
import { imageSrcSet, imageUrl, type ImageRef } from '@goldshop/shared';
import { cn, inr } from '../../lib/utils';
import { Mark } from '../Logo';

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".2" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Responsive image from the upload pipeline. Lazy by default; pass `priority` for the
 * largest above-the-fold image so it loads first.
 */
export function Img({
  image,
  sizes = '(min-width: 1024px) 33vw, 50vw',
  className,
  priority,
  alt,
  width = 960,
}: {
  image?: ImageRef | null;
  sizes?: string;
  className?: string;
  priority?: boolean;
  alt?: string;
  width?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // A cached image can finish loading before React attaches onLoad.
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) setLoaded(true);
  }, [image?.key, image?.url]);
  if (!image) return <ImagePlaceholder className={className} />;
  return (
    <img
      ref={ref}
      src={imageUrl(image, width)}
      srcSet={imageSrcSet(image)}
      sizes={sizes}
      alt={alt ?? image.alt ?? ''}
      width={image.width || undefined}
      height={image.height || undefined}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      onLoad={() => setLoaded(true)}
      // The fade-in is an inline style so it never overrides opacity classes passed by the caller
      // (e.g. a hover image that must stay hidden until hovered).
      style={loaded || priority ? undefined : { opacity: 0 }}
      className={cn('transition-opacity duration-500', className)}
    />
  );
}

export function ImagePlaceholder({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 bg-sand text-gold/50', className)} aria-hidden={!label}>
      <Mark className="size-10" />
      {label && <span className="text-xs text-muted">{label}</span>}
    </div>
  );
}

export function Price({ paise, from, className, compareAt }: { paise: number; from?: boolean; className?: string; compareAt?: number }) {
  if (!paise) return <span className={cn('text-muted', className)}>Price on request</span>;
  return (
    <span className={cn('tabular', className)}>
      {from && <span className="mr-1 text-[0.8em] font-normal text-muted">From</span>}
      {inr(paise)}
      {compareAt && compareAt > paise && (
        <s className="ml-2 text-[0.85em] font-normal text-subtle" aria-label={`was ${inr(compareAt)}`}>
          {inr(compareAt)}
        </s>
      )}
    </span>
  );
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'gold' | 'success' | 'danger' | 'warn' | 'ink'; className?: string }) {
  const tones = {
    neutral: 'bg-sand text-ink-2',
    gold: 'bg-gold-pale text-gold-deep',
    success: 'bg-success-bg text-success',
    danger: 'bg-danger-bg text-danger',
    warn: 'bg-warn-bg text-warn',
    ink: 'bg-ink text-ivory',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-xs px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em]', tones[tone], className)}>
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-xs', className)} aria-hidden />;
}

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-gold', className)} role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} width={size} height={size} strokeWidth={1.5} className={i <= Math.round(value) ? 'fill-current' : 'fill-transparent'} />
      ))}
    </span>
  );
}

export function Breadcrumbs({ items, className }: { items: { label: string; to?: string }[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('text-xs text-muted', className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={`${it.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3 text-subtle" aria-hidden />}
            {it.to && i < items.length - 1 ? (
              <Link to={it.to} className="hover:text-ink">
                {it.label}
              </Link>
            ) : (
              <span aria-current={i === items.length - 1 ? 'page' : undefined} className="text-ink-2">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function QuantityStepper({
  value,
  max,
  onChange,
  disabled,
  size = 'md',
  label = 'Quantity',
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}) {
  const h = size === 'sm' ? 'h-9' : size === 'lg' ? 'h-13' : 'h-12';
  return (
    <div className={cn('inline-flex items-center border border-line-strong/70 bg-paper', h)} role="group" aria-label={label}>
      <button
        type="button"
        className="grid h-full w-9 place-items-center text-ink-2 hover:bg-sand disabled:opacity-40"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="grid h-full w-9 place-items-center text-ink-2 hover:bg-sand disabled:opacity-40"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

/** Accessible disclosure built on <details>, styled as a refined accordion row. */
export function Disclosure({ title, children, defaultOpen, className }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean; className?: string }) {
  return (
    <details className={cn('group border-b border-line', className)} open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-[0.9375rem] font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <span className="relative size-3.5 shrink-0" aria-hidden>
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-ink" />
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-ink transition-transform duration-300 group-open:scale-y-0" />
        </span>
      </summary>
      <div className="pb-5 text-sm leading-relaxed text-ink-2">{children}</div>
    </details>
  );
}

export function EmptyState({
  title,
  children,
  action,
  icon,
  className,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center', className)}>
      <div className="mb-6 grid size-16 place-items-center rounded-full border border-gold/30 bg-paper text-gold-deep shadow-[0_12px_30px_-18px_rgba(122,87,22,.55)]">
        {icon ?? <span aria-hidden className="size-3 rotate-45 bg-gold" />}
      </div>
      <h2 className="display-sm text-ink">{title}</h2>
      {children && <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>}
      {action && <div className="cta-row mt-6 justify-center">{action}</div>}
    </div>
  );
}

/** Small ornamental divider: a diamond between two hairlines. */
export function Ornament({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 text-gold', className)} aria-hidden>
      <span className="h-px w-10 bg-current opacity-50" />
      <span className="size-1.5 rotate-45 bg-current" />
      <span className="h-px w-10 bg-current opacity-50" />
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
  className,
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn('mb-8 flex flex-col gap-4 md:mb-12', align === 'center' ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between', className)}>
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 id={id} className="display-md text-ink">
          {title}
        </h2>
        {description && <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Alert({ tone = 'neutral', children, className }: { tone?: 'neutral' | 'warn' | 'danger' | 'success'; children: ReactNode; className?: string }) {
  const tones = {
    neutral: 'border-line bg-paper text-ink-2',
    warn: 'border-warn/30 bg-warn-bg text-warn',
    danger: 'border-danger/30 bg-danger-bg text-danger',
    success: 'border-success/30 bg-success-bg text-success',
  };
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('rounded-xs border px-4 py-3 text-sm leading-relaxed', tones[tone], className)}>
      {children}
    </div>
  );
}
