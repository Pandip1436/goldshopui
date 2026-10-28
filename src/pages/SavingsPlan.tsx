import { ArrowRight, BadgeCheck, CalendarDays, Check, ChevronRight, FilePenLine, Gem, Phone, X } from 'lucide-react';
import { useState } from 'react';
import type { ImageRef, PublicSettings, SavingsScheme } from '@goldshop/shared';
import { GoldRule, LotusMark } from '../components/AboutLegacy';
import { ABOUT_ICONS } from '../components/aboutIcons';
import { EnquiryForm } from '../components/EnquiryForm';
import { Seo } from '../components/Seo';
import { ButtonLink } from '../components/ui/Button';
import { PageFade, Reveal } from '../components/ui/Motion';
import { Modal } from '../components/ui/Sheet';
import { EmptyState, Img } from '../components/ui/misc';
import { useSettings } from '../lib/hooks';
import { cn } from '../lib/utils';

type Plan = PublicSettings['savingsPlan'];

const STEPS = [
  { icon: FilePenLine, title: 'Share your details', text: 'Tell us how much you’d like to save each month.' },
  { icon: CalendarDays, title: 'We explain the plan', text: 'Our team will guide you on the plan terms, duration and how payments work.' },
  { icon: Gem, title: 'Choose your piece', text: 'When the plan matures, use your savings towards any jewellery in our store.' },
];

export default function SavingsPlan() {
  const { data: s } = useSettings();
  const [details, setDetails] = useState<SavingsScheme | null>(null);
  const [asked, setAsked] = useState<string | null>(null);

  if (s && !s.savingsPlan.enabled) {
    return (
      <div className="container-page py-16">
        <EmptyState title="Savings plan not available" action={<ButtonLink to="/shop">Shop jewellery</ButtonLink>}>
          Please contact us to ask about ways to plan a purchase.
        </EmptyState>
      </div>
    );
  }
  const plan = s?.savingsPlan;
  // Asking about a plan names it in the call-back form and brings the form into view.
  const ask = (title: string) => {
    setDetails(null);
    setAsked(title);
    requestAnimationFrame(() => document.getElementById('plan-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <PageFade>
      <Seo
        title="Gold savings plan"
        path="/gold-savings-plan"
        description="Set aside a little each month towards gold jewellery. Request a call back and our team will explain how the plan works."
      />

      <Hero plan={plan} />

      {plan && plan.schemes.length > 0 && <Schemes schemes={plan.schemes} onDetails={setDetails} onAsk={ask} />}

      {plan && plan.highlights.length > 0 && (
        <div className="container-page">
          <ul className="grid grid-cols-2 gap-y-3 rounded-2xl border border-line/60 bg-paper px-2 py-5 shadow-[0_24px_50px_-40px_rgba(63,18,21,.5)] sm:grid-cols-3 xl:grid-cols-6 xl:py-6">
            {plan.highlights.map((h) => {
              const Icon = ABOUT_ICONS[h.icon ?? ''] ?? BadgeCheck;
              return (
                // Phones: icon over a centred title, so a half-width column never squeezes the words one per line.
                <li key={h.title} className="flex flex-col items-center gap-2 px-3 py-1.5 text-center sm:flex-row sm:gap-3 sm:px-4 sm:text-left xl:justify-center xl:[&+&]:border-l xl:[&+&]:border-line-strong/40">
                  <Icon className="size-9 shrink-0 text-gold-deep" strokeWidth={1.2} aria-hidden />
                  <span className="min-w-0 text-[0.875rem] leading-snug text-ink">
                    {h.title}
                    {h.text && <span className="block text-xs text-muted">{h.text}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <section aria-label="Start your savings plan" className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 py-14 md:py-20 lg:grid-cols-12 lg:gap-6">
        <Reveal className="lg:col-span-7 lg:h-full">
          <HowItWorks image={plan?.stepsImage} summary={plan?.summary} />
        </Reveal>
        <Reveal className="self-start lg:col-span-5">
          <div id="plan-form" className="relative scroll-mt-28 overflow-hidden rounded-2xl bg-maroon p-3 text-ivory shadow-[0_40px_80px_-40px_rgba(63,18,21,.85)] sm:p-4">
            <LotusMark className="pointer-events-none absolute -right-8 -top-6 w-44 text-gold-soft opacity-[0.14]" />
            <div className="relative flex items-center gap-4 px-2 pb-5 pt-3 sm:px-3">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#ecd08f] to-[#c39a4a] text-maroon shadow-[inset_0_1px_0_rgba(255,255,255,.5)]">
                <Phone className="size-6" strokeWidth={1.8} aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-[1.75rem] font-semibold leading-tight">Request a call back</h2>
                <p className="mt-1 text-sm text-ivory/75">We’ll get in touch with you at a convenient time.</p>
              </div>
            </div>
            {asked && (
              <p className="relative mx-2 mb-3 flex items-center justify-between gap-3 rounded-lg bg-ivory/10 px-3.5 py-2 text-sm sm:mx-3">
                <span className="min-w-0">
                  Asking about <strong className="font-semibold text-gold-soft">{asked}</strong>
                </span>
                <button type="button" onClick={() => setAsked(null)} className="grid size-7 shrink-0 place-items-center rounded-full hover:bg-ivory/15" aria-label="Don’t ask about a particular plan">
                  <X className="size-4" />
                </button>
              </p>
            )}
            <div className="rounded-xl bg-white p-5 text-ink">
              <EnquiryForm
                key={asked ?? ''}
                type="savings_plan"
                withAmount
                boxed
                messageLabel="Anything we should know?"
                submitLabel="Request a call back"
                defaultMessage={asked ? `I’d like to know more about the ${asked}.` : ''}
              />
            </div>
          </div>
        </Reveal>
      </section>

      <Modal
        open={Boolean(details)}
        onOpenChange={(v) => !v && setDetails(null)}
        title={details?.title ?? ''}
        description={details?.eyebrow}
        footer={
          details && (
            <button type="button" onClick={() => ask(details.title)} className="inline-flex h-11 items-center gap-2 rounded-md bg-maroon px-5 text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-ivory hover:bg-maroon-2">
              Ask about this plan <ArrowRight className="size-4" aria-hidden />
            </button>
          )
        }
      >
        {details && (
          <div className="space-y-4 text-[0.9375rem] leading-relaxed text-ink-2">
            {details.points.length > 0 && <Points points={details.points} />}
            {details.details?.split(/\n\s*\n/).map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
            <p className="text-xs text-subtle">Plan terms are confirmed by our team before you join.</p>
          </div>
        )}
      </Modal>
    </PageFade>
  );
}

/** "Turn your today into a Brighter Tomorrow": the copy and its points on the left, the photo with script words on the right. */
function Hero({ plan }: { plan?: Plan }) {
  const features = plan?.features ?? [];
  const tagline = plan?.tagline?.split('|').map((t) => t.trim()).filter(Boolean) ?? [];
  return (
    <section aria-labelledby="plan-title" className="relative overflow-hidden bg-ivory">
      <LotusMark className="pointer-events-none absolute -left-16 bottom-0 w-72 text-gold opacity-[0.08]" />
      <div className="container-page relative pb-8 pt-10 md:pt-14 lg:py-16 xl:py-20">
        <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:w-[54%] lg:max-w-none xl:w-[52%]">
          <p className="text-[0.8125rem] font-medium uppercase tracking-[0.34em] text-ink-2 sm:text-[0.9375rem]">Turn your today into a</p>
          <h1 id="plan-title" className="mt-3 font-display text-[clamp(3rem,1.6rem+4.6vw,5.75rem)] font-semibold leading-[0.95] tracking-[-0.01em] text-maroon">
            Brighter <em className="bg-gradient-to-r from-gold-deep via-gold to-gold-deep bg-clip-text pr-2 font-semibold text-transparent">Tomorrow</em>
          </h1>
          <p className="mt-4 text-[0.875rem] font-medium uppercase tracking-[0.3em] text-ink sm:text-[0.9375rem]">Our jewellery savings plans</p>
          {tagline.length > 0 && (
            <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.9375rem] text-ink-2">
              {tagline.map((t, i) => (
                <span key={t} className="flex items-center gap-3">
                  {/* dividers only where the line can't wrap and leave one at the start of a row */}
                  {i > 0 && <span aria-hidden className="hidden h-3.5 w-px bg-ink-2/50 sm:block" />}
                  {t}
                </span>
              ))}
            </p>
          )}
          {features.length > 0 && (
            <ul className={cn('mt-9 grid grid-cols-2 gap-y-6', features.length >= 3 ? 'sm:grid-cols-4' : 'sm:grid-cols-2')}>
              {features.map((f) => {
                const Icon = ABOUT_ICONS[f.icon ?? ''] ?? BadgeCheck;
                return (
                  <li key={f.title} className="flex flex-col items-center gap-2.5 px-3 text-center sm:[&+&]:border-l sm:[&+&]:border-line-strong/45">
                    <Icon className="size-9 text-gold-deep" strokeWidth={1.3} aria-hidden />
                    <span className="max-w-[9rem] text-[0.9375rem] leading-snug text-ink">{f.title}</span>
                    {f.text && <span className="-mt-1.5 text-xs text-muted">{f.text}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {plan?.image && (
        // Phones: a rounded photo under the copy. Wide screens: the right half, fading into the copy.
        <div className="container-page pb-10 lg:contents">
          <div className="relative h-72 overflow-hidden rounded-2xl sm:h-96 lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[50%] lg:rounded-none lg:[mask-image:linear-gradient(to_right,transparent,black_28%)]">
            <Img image={plan.image} priority sizes="(min-width: 1024px) 50vw, 100vw" width={1600} className="size-full object-cover object-[55%_30%]" />
            <Script lines={plan.script} />
          </div>
        </div>
      )}
    </section>
  );
}

/** Script words over the photo, zig-zagging like a hand-set line; short joining words are set smaller. */
function Script({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <p className="absolute right-[5%] top-[9%] text-right font-display text-[1.375rem] sm:top-1/2 sm:-translate-y-1/2 font-medium italic leading-[1.06] text-maroon [text-shadow:0_1px_12px_rgba(255,248,236,.9)] sm:text-[2rem] lg:text-[clamp(1.75rem,0.9rem+1.4vw,2.5rem)]">
      {lines.map((l, i) => (
        <span key={`${i}-${l}`} className={cn('block', i % 2 === 0 && 'pr-[0.9em]', l.length <= 5 && /^[a-z]/.test(l) && 'text-[0.7em]')}>
          {l}
        </span>
      ))}
      <GoldRule className="ml-auto mt-2 w-16 rotate-180 opacity-80" />
    </p>
  );
}

function Points({ points, dark }: { points: string[]; dark?: boolean }) {
  return (
    <ul className="text-left">
      {points.map((p) => (
        <li key={p} className={cn('flex items-start gap-3 py-2 text-[0.9375rem] leading-snug', dark ? 'text-ivory/90 [&+&]:border-t [&+&]:border-ivory/15' : 'text-ink-2')}>
          <span aria-hidden className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#d9b872] to-[#b08636] text-white">
            <Check className="size-3" strokeWidth={3} />
          </span>
          {p}
        </li>
      ))}
    </ul>
  );
}

/** The plans as cards, alternating cream and maroon like a row of gift boxes. */
function Schemes({ schemes, onDetails, onAsk }: { schemes: SavingsScheme[]; onDetails: (s: SavingsScheme) => void; onAsk: (title: string) => void }) {
  return (
    <section aria-labelledby="schemes-title" className="container-page py-12 md:py-16">
      <h2 id="schemes-title" className="sr-only">
        Our savings plans
      </h2>
      <Reveal>
        <ul className={cn('grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2', schemes.length >= 3 && 'xl:grid-cols-4', schemes.length === 3 && 'xl:grid-cols-3')}>
          {schemes.map((c, i) => {
            const dark = i % 2 === 1;
            return (
              <li
                key={c.title}
                className={cn(
                  'flex flex-col overflow-hidden rounded-2xl p-1.5 shadow-[0_30px_60px_-40px_rgba(63,18,21,.6)]',
                  dark ? 'bg-gradient-to-b from-maroon-2 to-maroon text-ivory' : 'border border-line/70 bg-paper text-ink',
                )}
              >
                {c.image && (
                  <div className="aspect-[2/1] overflow-hidden rounded-xl bg-sand">
                    <Img image={c.image} alt="" sizes="(min-width: 1280px) 24vw, (min-width: 640px) 48vw, 100vw" width={960} className="size-full object-cover" />
                  </div>
                )}
                <div className="flex flex-1 flex-col px-4 pb-4 pt-6 text-center sm:px-5">
                  {/* two lines tall on wider screens, so every card's subheading and points line up */}
                  <h3 className={cn('font-display text-[1.875rem] font-medium leading-[1.05] sm:flex sm:min-h-[2.1em] sm:items-end sm:justify-center', dark ? 'text-ivory' : 'text-maroon')}>{c.title}</h3>
                  {c.eyebrow && <p className={cn('mt-3 text-[0.6875rem] font-semibold uppercase leading-relaxed tracking-[0.18em]', dark ? 'text-gold-soft' : 'text-muted')}>{c.eyebrow}</p>}
                  {c.points.length > 0 && (
                    <div className="mt-4">
                      <Points points={c.points} dark={dark} />
                    </div>
                  )}
                  <div className="mt-auto pt-6">
                    <button
                      type="button"
                      onClick={() => (c.details ? onDetails(c) : onAsk(c.title))}
                      className={cn(
                        'inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-md text-[0.8125rem] font-bold uppercase tracking-[0.16em] transition-colors',
                        dark ? 'bg-white text-maroon hover:bg-ivory' : 'bg-gradient-to-b from-maroon-2 to-maroon text-ivory hover:brightness-110',
                      )}
                    >
                      {c.details ? 'View plan details' : 'Ask about this plan'} <ArrowRight className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </section>
  );
}

function HowItWorks({ image, summary }: { image?: ImageRef; summary?: string }) {
  return (
    <section aria-labelledby="how-title" className="relative h-full overflow-hidden rounded-2xl border border-line/70 bg-paper shadow-[0_30px_60px_-45px_rgba(63,18,21,.45)]">
      {image && (
        <div aria-hidden className="absolute right-0 top-0 hidden h-48 w-[42%] [mask-image:linear-gradient(to_left,black_40%,transparent),linear-gradient(to_top,transparent,black_45%)] [mask-composite:intersect] sm:block">
          <Img image={image} sizes="30vw" width={960} className="size-full object-cover" />
        </div>
      )}
      <div className="relative flex h-full flex-col p-6 md:p-8">
        <h2 id="how-title" className="flex items-center gap-4 font-display text-[2rem] font-medium leading-tight text-ink md:text-[2.25rem]">
          <span className="whitespace-nowrap">How it works</span>
          <GoldRule className="w-20" />
        </h2>
        {summary && <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-ink-2">{summary}</p>}
        <ol className="mt-8 grid gap-7 sm:grid-cols-3 sm:gap-5">
          {STEPS.map((st, i) => (
            // Phones: a timeline (numbered circle on the left, text beside it, a gold line to the next step);
            // from sm the three steps sit side by side.
            <li key={st.title} className="relative flex gap-4 sm:block">
              <span className="relative inline-grid size-14 shrink-0 place-items-center rounded-full border border-gold/60 bg-paper text-gold-deep sm:size-20">
                <st.icon className="size-6 sm:size-8" strokeWidth={1.1} aria-hidden />
                <span className="absolute -left-2 -top-1 grid size-6 place-items-center rounded-full bg-maroon text-xs font-semibold text-ivory sm:size-7 sm:text-sm">{i + 1}</span>
              </span>
              {i < STEPS.length - 1 && <span aria-hidden className="absolute -bottom-7 left-7 top-[3.75rem] w-px bg-gold/40 sm:hidden" />}
              {i < STEPS.length - 1 && <ChevronRight aria-hidden className="absolute left-[calc(5rem+((100%-5rem)/2))] top-8 hidden size-5 -translate-x-1/2 text-gold sm:block" strokeWidth={1.4} />}
              <div className="min-w-0 pt-1.5 sm:pt-0">
                <h3 className="font-display text-xl font-semibold leading-snug text-ink sm:mt-5">{st.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted sm:mt-1.5">{st.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-auto pt-7 text-xs leading-relaxed text-subtle">Plan terms, eligibility and any benefits are confirmed by our team before you join. Nothing is charged by submitting this form.</p>
      </div>
    </section>
  );
}
