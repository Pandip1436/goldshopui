import { Sparkles } from 'lucide-react';
import type { AboutSection, StatItem } from '@goldshop/shared';
import { cn } from '../lib/utils';
import { ABOUT_ICONS } from './aboutIcons';
import { Reveal } from './ui/Motion';
import { Img } from './ui/misc';

export function LotusMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" className={className} aria-hidden>
      <path d="M32 4c5 6 7 12 7 18s-3 12-7 16c-4-4-7-10-7-16s2-12 7-18Z" />
      <path d="M25 22c-6-4-12-5-17-4 1 8 6 15 15 18 3 1 6 1 9 0" />
      <path d="M39 22c6-4 12-5 17-4-1 8-6 15-15 18-3 1-6 1-9 0" />
      <path d="M20 31c-6 0-11 2-14 5 5 4 12 6 20 4" />
      <path d="M44 31c6 0 11 2 14 5-5 4-12 6-20 4" />
      <path d="M20 45h24" />
    </svg>
  );
}

/** A gold hairline ending in a small diamond, used as the eyebrow rule and section divider. */
export function GoldRule({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('flex items-center', className)}>
      <span className="h-px flex-1 bg-gradient-to-r from-gold/70 to-gold" />
      <span className="ml-1 size-2 rotate-45 border border-gold" />
    </span>
  );
}

/**
 * Brand story: heading, story, four promises, a photo composition (portrait, a circular detail
 * inset, a maroon "crafted with care" seal and a lotus) and a band of figures.
 *
 * Every element of the photo composition is positioned in percentages of one fixed-ratio box and
 * the seal's text is sized in container units, so the arrangement holds from phones to desktops.
 */
export function AboutLegacy({ about, stats, storeName, headingLevel = 2 }: { about: AboutSection; stats: StatItem[]; storeName: string; headingLevel?: 1 | 2 }) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const paragraphs = about.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <section aria-labelledby="about-title" className="relative overflow-hidden bg-paper">
      {/* faint line-art lotuses, like an engraved pattern */}
      <LotusMark className="pointer-events-none absolute -left-10 top-10 w-72 text-gold opacity-[0.07]" />
      <LotusMark className="pointer-events-none absolute right-[40%] top-[55%] hidden w-56 text-gold opacity-[0.05] lg:block" />

      <div className="container-page relative py-16 md:py-24">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
          {/* Story */}
          <Reveal className="lg:col-span-6 xl:col-span-7">
            <p className="flex items-center gap-4">
              <span className="text-[0.75rem] font-semibold uppercase tracking-[0.34em] text-ink">{about.eyebrow || 'About us'}</span>
              <GoldRule className="w-24 sm:w-32" />
            </p>
            <Heading id="about-title" className="mt-6 font-display text-[clamp(2.5rem,1.6rem+3.2vw,4.25rem)] font-medium leading-[1.02] tracking-[-0.01em] text-ink">
              {about.title}
              {about.highlight && (
                <span className="mt-1 block bg-gradient-to-r from-gold-deep via-gold to-gold-deep bg-clip-text pb-2 text-transparent">{about.highlight}</span>
              )}
            </Heading>
            {/* Tighter tracking on phones so the line doesn't break with a stray word or two. */}
            {about.tagline && <p className="mt-4 text-[0.6875rem] font-medium uppercase leading-relaxed tracking-[0.2em] text-muted sm:tracking-[0.42em]">{about.tagline}</p>}
            <GoldRule className="mt-7 w-56 sm:w-72" />
            <div className="mt-7 max-w-xl space-y-4 text-[1.0625rem] leading-[1.75] text-ink-2">
              {paragraphs.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>

            {about.features.length > 0 && (
              <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
                {about.features.slice(0, 4).map((f) => {
                  const Icon = ABOUT_ICONS[f.icon ?? ''] ?? Sparkles;
                  return (
                    <li key={f.label} className="flex flex-col items-center text-center">
                      <span className="relative grid size-20 place-items-center rounded-full border border-gold/45 bg-paper">
                        <span aria-hidden className="absolute inset-1.5 rounded-full border border-gold/15" />
                        <Icon className="size-7 text-gold" strokeWidth={1.3} aria-hidden />
                      </span>
                      <span className="mt-4 max-w-[11rem] text-[0.6875rem] font-semibold uppercase leading-relaxed tracking-[0.18em] text-ink-2">{f.label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Reveal>

          {/* Photo composition */}
          <Reveal delay={0.12} className="lg:col-span-6 xl:col-span-5">
            <div className="@container relative mx-auto aspect-[850/838] w-full max-w-[40rem]">
              {/* portrait with an arched edge and an offset gold outline */}
              <div className="absolute left-[32.12%] top-0 h-[83.53%] w-[67.88%]">
                <div aria-hidden className="absolute -inset-[2.5%] rounded-[50%_6%_18%_6%/42%_5%_14%_5%] border border-gold/45" />
                <div className="absolute inset-0 overflow-hidden rounded-[50%_6%_18%_6%/42%_5%_14%_5%] bg-sand shadow-[0_40px_80px_-50px_rgba(63,18,21,.55)]">
                  <Img image={about.image} sizes="(min-width: 1024px) 28rem, 70vw" width={960} className="size-full object-cover" alt={about.image?.alt || `Jewellery from ${storeName}`} />
                </div>
              </div>

              {/* circular detail inset */}
              <div className="absolute left-[2.12%] top-[40.81%] aspect-square w-[58.35%] rounded-full border-[3px] border-gold bg-sand shadow-[0_0_0_6px_var(--color-paper),0_30px_60px_-30px_rgba(63,18,21,.5)]">
                <div className="size-full overflow-hidden rounded-full">
                  <Img image={about.insetImage ?? about.image} sizes="(min-width: 1024px) 22rem, 55vw" width={960} className="size-full object-cover" alt={about.insetImage?.alt || 'A craftsman finishing a piece by hand'} />
                </div>
              </div>

              {/* lotus finial and stem */}
              <div aria-hidden className="absolute left-[15.88%] top-[11.5%] flex w-[11.76%] -translate-x-1/2 flex-col items-center text-gold">
                <LotusMark className="w-full" />
                <span className="h-[2.2cqw] w-px bg-gold/70" />
              </div>

              {/* maroon seal */}
              {about.badge && (
                <div className="absolute left-0 top-[24.46%] grid aspect-square w-[31.76%] place-items-center rounded-full border-2 border-gold-soft bg-maroon text-ivory shadow-[0_0_0_5px_var(--color-paper),0_0_0_6px_rgba(165,122,44,.5),0_24px_40px_-20px_rgba(63,18,21,.6)]">
                  <div className="flex w-[72%] flex-col items-center text-center">
                    <LotusMark className="w-[28%] text-gold-soft" />
                    <p className="mt-[1.4cqw] text-[1.55cqw] font-medium uppercase leading-[2.1] tracking-[0.3em] text-ivory/95">{about.badge}</p>
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </div>

        {stats.length > 0 && (
          <Reveal className="mt-14 md:mt-20">
            <dl className="relative grid grid-cols-2 gap-y-8 overflow-hidden rounded-2xl bg-maroon px-6 py-8 text-ivory shadow-[0_30px_60px_-40px_rgba(63,18,21,.7)] md:py-10 lg:grid-cols-4 lg:px-4">
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_14rem_at_50%_-30%,rgba(217,184,114,.16),transparent_70%)]" />
              {stats.slice(0, 4).map((s, i) => {
                const Icon = ABOUT_ICONS[s.icon ?? ''] ?? Sparkles;
                return (
                  // Tops aligned so a label that wraps doesn't lift its figure out of line with its neighbour.
                  <div key={s.label} className={cn('relative flex items-start justify-center gap-4 px-2 sm:items-center lg:gap-5', i > 0 && 'lg:border-l lg:border-gold-soft/25', i % 2 === 1 && 'max-lg:border-l max-lg:border-gold-soft/25')}>
                    <Icon className="hidden size-9 shrink-0 text-gold-soft sm:block" strokeWidth={1.2} aria-hidden />
                    {/* Without the icon (phones) each figure is centred over its label. */}
                    <div className="flex flex-col-reverse items-center text-center sm:items-start sm:text-left">
                      <dt className="mt-2 text-[0.625rem] font-medium uppercase tracking-[0.24em] text-ivory/75 sm:text-[0.6875rem]">{s.label}</dt>
                      <dd className="font-display text-[clamp(2rem,1.4rem+1.8vw,3rem)] font-medium leading-none tabular text-ivory">{s.value}</dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </Reveal>
        )}
      </div>
    </section>
  );
}
