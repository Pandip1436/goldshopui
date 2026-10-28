import type { ReactNode } from 'react';
import type { ImageRef } from '@goldshop/shared';
import { cn } from '../../lib/utils';
import { Breadcrumbs, Img } from './misc';

/**
 * The opening band of a page: breadcrumbs, eyebrow, serif title and intro on a softly lit paper
 * field — or over a darkened photograph when `image` is given.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  crumbs,
  image,
  align = 'left',
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  crumbs?: { label: string; to?: string }[];
  image?: ImageRef;
  align?: 'left' | 'center';
  children?: ReactNode;
  className?: string;
}) {
  const dark = Boolean(image);
  const center = align === 'center';
  return (
    <section className={cn('relative overflow-hidden', dark ? 'bg-ink text-ivory' : 'bg-paper', className)}>
      {image ? (
        <>
          <Img image={image} priority sizes="100vw" width={1600} className="absolute inset-0 size-full object-cover opacity-55" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/60 to-ink/10" />
        </>
      ) : (
        <>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(44rem_24rem_at_88%_-12%,rgba(217,184,114,.26),transparent_70%)]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:repeating-linear-gradient(135deg,#a57a2c_0_1px,transparent_1px_14px)]" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-line via-gold/45 to-line" />
        </>
      )}
      <div className={cn('container-page relative py-10 md:py-16', dark && 'md:py-24', center && 'flex flex-col items-center text-center')}>
        {crumbs && <Breadcrumbs items={crumbs} className={cn(dark && '[&_*]:!text-ivory/70', center && '[&_ol]:justify-center')} />}
        {eyebrow && (
          <p className={cn('eyebrow flex items-center gap-3', crumbs && 'mt-7 md:mt-9', dark && '!text-gold-soft')}>
            <span aria-hidden className="h-px w-7 bg-current opacity-60" />
            {eyebrow}
            {center && <span aria-hidden className="h-px w-7 bg-current opacity-60" />}
          </p>
        )}
        <h1 className={cn('display-lg max-w-3xl', Boolean(eyebrow || crumbs) && 'mt-3.5')}>{title}</h1>
        {description && <div className={cn('mt-4 max-w-2xl text-base leading-relaxed', dark ? 'text-ivory/80' : 'text-muted')}>{description}</div>}
        {children && <div className="mt-7 w-full">{children}</div>}
      </div>
    </section>
  );
}
