import { Sparkles } from 'lucide-react';
import type { TrustItem } from '@goldshop/shared';
import { cn } from '../lib/utils';
import { LotusMark } from './AboutLegacy';
import { PROMISE_ICONS } from './aboutIcons';
import { Reveal } from './ui/Motion';

/** A short hairline–diamond–hairline rule. */
function Rule({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('flex items-center gap-1.5 text-gold', className)}>
      <span className="h-px w-12 bg-current opacity-60" />
      <span className="size-1.5 rotate-45 bg-current" />
      <span className="h-px w-12 bg-current opacity-60" />
    </span>
  );
}

const COLS = ['', 'lg:grid-cols-1', 'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4'];

/** "What we promise": the store's promises, each in a gold-ringed medallion, between ornamental rules. */
export function Promises({ items }: { items: TrustItem[] }) {
  const list = items.slice(0, 4);
  return (
    <section aria-labelledby="promise-title" className="relative overflow-hidden bg-ivory py-16 md:py-20">
      <LotusMark className="pointer-events-none absolute -bottom-10 -left-16 w-80 text-gold opacity-[0.12]" />
      <LotusMark className="pointer-events-none absolute -bottom-10 -right-16 w-80 text-gold opacity-[0.12]" />
      <div className="container-page relative">
        <div className="flex flex-col items-center text-center">
          <span aria-hidden className="flex w-full max-w-sm items-center gap-3 text-gold">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/70" />
            <LotusMark className="w-9" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/70" />
          </span>
          <h2 id="promise-title" className="mt-4 font-display text-[clamp(2.25rem,1.6rem+2.4vw,3.75rem)] font-medium leading-tight text-maroon">
            What we <em className="font-medium italic text-gold-deep">promise</em>
          </h2>
        </div>

        <ul className={cn('mt-10 grid gap-y-12 sm:grid-cols-2 md:mt-12', COLS[list.length])}>
          {list.map((b, i) => {
            const Icon = PROMISE_ICONS[b.icon ?? ''] ?? Sparkles;
            return (
              <Reveal
                key={b.title}
                delay={i * 0.06}
                className="relative flex flex-col items-center px-6 text-center sm:[&:nth-child(even)]:border-l lg:border-l-0 lg:[&+&]:border-l border-gold/30"
              >
                <span className="flex items-center gap-6">
                  <span aria-hidden className="size-1.5 rotate-45 bg-gold/70" />
                  <span className="grid size-24 place-items-center rounded-full bg-paper shadow-[0_14px_30px_-18px_rgba(122,87,22,.6),inset_0_0_0_1px_rgba(217,184,114,.55),inset_0_0_0_6px_#fcf9f3,inset_0_0_0_7px_rgba(217,184,114,.35)]">
                    <Icon className="size-10 text-gold-deep" strokeWidth={1.2} aria-hidden />
                  </span>
                  <span aria-hidden className="size-1.5 rotate-45 bg-gold/70" />
                </span>
                <h3 className="mt-5 font-display text-[1.625rem] font-semibold leading-tight text-maroon">{b.title}</h3>
                <Rule className="mt-3" />
                {b.text && <p className="mt-3 max-w-xs text-[0.9375rem] leading-relaxed text-ink-2">{b.text}</p>}
              </Reveal>
            );
          })}
        </ul>

        <span aria-hidden className="mx-auto mt-12 flex max-w-4xl items-center gap-2 text-gold">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/60" />
          <span className="size-2 rotate-45 border border-current" />
          <span className="size-1.5 rotate-45 bg-current" />
          <span className="size-2 rotate-45 border border-current" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/60" />
        </span>
      </div>
    </section>
  );
}
