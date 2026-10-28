import { Heart, MapPin, Package, ShoppingBag } from 'lucide-react';
import type { ReactNode } from 'react';
import { LotusMark } from '../../components/AboutLegacy';
import { PageFade } from '../../components/ui/Motion';
import { Img } from '../../components/ui/misc';
import { useSettings } from '../../lib/hooks';

const BENEFITS = [
  { icon: Package, title: 'Every order in one place', text: 'Follow each order from confirmation to delivery.' },
  { icon: MapPin, title: 'Faster checkout', text: 'Save delivery addresses and skip retyping them.' },
  { icon: Heart, title: 'Your wishlist, everywhere', text: 'Pieces you save follow you to any device.' },
];

/**
 * Sign-in, register and password pages: a deep maroon panel saying what an account is for, with
 * a photograph settling at its foot, beside the form on cream. Phones show the form first.
 */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const { data: s } = useSettings();
  const photo = s?.accountPage.image;
  return (
    <PageFade className="grid lg:min-h-[calc(100dvh-10rem)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
      <aside className="relative order-2 overflow-hidden bg-gradient-to-br from-maroon-2 via-maroon to-[#1f0b0c] px-6 py-12 text-ivory sm:px-10 lg:order-1 lg:px-14 lg:py-16 xl:px-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:repeating-linear-gradient(135deg,#d9b872_0_1px,transparent_1px_16px)]" />
        <LotusMark className="pointer-events-none absolute -right-10 top-24 w-56 text-gold-soft opacity-[0.08]" />
        {photo && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[44%] [mask-image:linear-gradient(to_top,black_50%,transparent)] lg:block">
            <Img image={photo} sizes="45vw" width={1600} className="size-full object-cover object-[60%_60%]" />
            {/* a dark wash keeps the note at the foot readable over the photo */}
            <span className="absolute inset-0 bg-gradient-to-t from-[#1f0b0c]/90 via-[#1f0b0c]/45 to-[#1f0b0c]/10" />
          </div>
        )}
        <div className="relative flex h-full max-w-lg flex-col">
          <p className="flex items-center gap-3 text-[0.75rem] font-semibold uppercase tracking-[0.3em] text-gold-soft">
            <span aria-hidden className="h-px w-5 bg-gold-soft/70" />
            Your account
          </p>
          <p className="mt-5 font-display text-[clamp(2.5rem,1.8rem+2.4vw,4rem)] font-medium leading-[1.02]">
            Everything in <em className="block font-medium italic text-gold-soft">one place</em>
          </p>
          <ul className="mt-9 space-y-6">
            {BENEFITS.map((b) => (
              <li key={b.title} className="flex items-center gap-5">
                <span className="grid size-16 shrink-0 place-items-center rounded-full border border-gold-soft/60 text-gold-soft">
                  <b.icon className="size-6" strokeWidth={1.3} aria-hidden />
                </span>
                <span>
                  <span className="block font-display text-[1.375rem] font-medium leading-tight">{b.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-ivory/80">{b.text}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-12 flex gap-3 border-t border-gold-soft/30 pt-6 text-sm leading-relaxed text-ivory/85 lg:mt-auto">
            <ShoppingBag className="mt-0.5 size-5 shrink-0 text-gold-soft" strokeWidth={1.4} aria-hidden />
            No account needed to shop — guest checkout is always available{s?.store.name ? ` at ${s.store.name}` : ''}.
          </p>
        </div>
      </aside>

      <div className="relative order-1 flex items-center overflow-hidden bg-ivory px-5 py-12 sm:px-10 lg:order-2 lg:py-16">
        <LotusMark className="pointer-events-none absolute -right-10 -top-6 w-48 text-gold opacity-[0.12]" />
        <LotusMark className="pointer-events-none absolute -bottom-10 -left-8 w-48 text-gold opacity-[0.1]" />
        <div className="relative mx-auto w-full max-w-lg">
          <div className="text-center">
            <span aria-hidden className="mx-auto flex max-w-xs items-center gap-3 text-gold">
              <span className="h-px flex-1 bg-gold/50" />
              <LotusMark className="w-11" />
              <span className="h-px flex-1 bg-gold/50" />
            </span>
            <h1 className="mt-6 font-display text-[clamp(2.5rem,1.9rem+2.2vw,4rem)] font-semibold leading-tight text-maroon">{title}</h1>
            {subtitle && <p className="mt-3 text-[1rem] text-ink-2">{subtitle}</p>}
          </div>
          <div className="mt-9">{children}</div>
          {footer && (
            <div className="mt-9 text-center text-[0.9375rem] text-ink-2">
              <span aria-hidden className="mb-6 flex items-center gap-3 text-gold">
                <span className="h-px flex-1 bg-gold/40" />
                <span className="size-1.5 rotate-45 bg-current" />
                <span className="h-px flex-1 bg-gold/40" />
              </span>
              {footer}
            </div>
          )}
        </div>
      </div>
    </PageFade>
  );
}

/** The large maroon submit button used on the account forms. */
export const authSubmit =
  'flex h-14 w-full items-center justify-center gap-3 rounded-md bg-gradient-to-b from-maroon-2 to-maroon text-[0.875rem] font-bold uppercase tracking-[0.22em] text-ivory shadow-[0_14px_28px_-16px_rgba(63,18,21,.95)] transition-[filter] hover:brightness-110 disabled:opacity-70';
export const authLink = 'font-semibold text-maroon underline decoration-gold underline-offset-[6px] hover:text-gold-deep';
