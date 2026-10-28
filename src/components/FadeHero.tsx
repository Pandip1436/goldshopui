import { BadgeCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ImageRef, TrustItem } from '@goldshop/shared';
import { ABOUT_ICONS } from './aboutIcons';
import { Breadcrumbs, Img } from './ui/misc';

/**
 * A listing banner: heading copy on the left and, from laptops up, a photograph filling the right
 * that dissolves into the page behind the heading. Optional breadcrumbs above, short points or
 * any other content (such as filter chips) below.
 */
export function FadeHero({
  crumbs,
  eyebrow,
  title,
  subtitle,
  image,
  features = [],
  children,
}: {
  crumbs?: { label: string; to?: string }[];
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  image?: ImageRef;
  features?: TrustItem[];
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line/70 bg-ivory">
      {image && (
        <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[62%] [mask-image:linear-gradient(to_right,transparent,black_38%)] lg:block">
          <Img image={image} priority sizes="62vw" width={1600} className="size-full object-cover" />
        </div>
      )}
      <div className="container-page relative py-8 md:py-10 lg:min-h-[17rem] lg:py-12">
        {crumbs && <Breadcrumbs items={crumbs} className="mb-5 text-[0.8125rem]" />}
        <div className="lg:max-w-[50%]">
          <p className="flex items-center gap-3">
            <span className="text-[0.75rem] font-semibold uppercase tracking-[0.3em] text-gold-deep">{eyebrow}</span>
            <span aria-hidden className="h-px w-8 bg-gold/60" />
          </p>
          <h1 className="mt-3 font-display text-[clamp(2.25rem,1.4rem+3vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.01em] text-maroon">{title}</h1>
          {subtitle && <p className="mt-3 max-w-xl font-display text-[1.25rem] leading-snug text-ink-2 md:text-[1.4375rem]">{subtitle}</p>}
          {features.length > 0 && (
            <ul className="mt-6 hidden flex-wrap gap-x-6 gap-y-4 sm:flex">
              {features.map((f) => {
                const Icon = ABOUT_ICONS[f.icon ?? ''] ?? BadgeCheck;
                return (
                  <li key={f.title} className="flex items-center gap-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full border border-gold/50 bg-paper/80 text-gold-deep">
                      <Icon className="size-5" strokeWidth={1.3} aria-hidden />
                    </span>
                    <span>
                      <span className="block text-[0.8125rem] font-bold text-ink">{f.title}</span>
                      {f.text && <span className="block text-xs text-muted">{f.text}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
