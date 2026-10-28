import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronRight, CreditCard, Gem, Headset, Heart, HelpCircle, Minus, Package, Plus, Search, Truck, X, type LucideIcon } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router';
import type { FaqDTO } from '@goldshop/shared';
import { LotusMark } from '../components/AboutLegacy';
import { FadeHero } from '../components/FadeHero';
import { Seo } from '../components/Seo';
import { ButtonLink } from '../components/ui/Button';
import { PageFade } from '../components/ui/Motion';
import { Skeleton } from '../components/ui/misc';
import { api } from '../lib/api';
import { useSettings } from '../lib/hooks';
import { cn } from '../lib/utils';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** An icon for each FAQ group, matched on its name (groups are set in the admin). */
const GROUP_ICONS: [RegExp, LucideIcon][] = [
  [/care|clean/i, Heart],
  [/deliver|ship/i, Truck],
  [/order|pay/i, CreditCard],
  [/pric|purity|gold|hallmark/i, Gem],
  [/return|exchange|refund/i, Package],
];
const groupIcon = (g: string) => GROUP_ICONS.find(([rx]) => rx.test(g))?.[1] ?? HelpCircle;

function Question({ faq, open, onToggle }: { faq: FaqDTO; open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <div className="border-b border-gold/30 last:border-b-0">
      <h3>
        <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={id} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-[0.9375rem] text-ink transition-colors hover:bg-gold-pale/20 sm:px-5">
          {faq.question}
          {open ? <Minus className="size-4 shrink-0 text-maroon" aria-hidden /> : <Plus className="size-4 shrink-0 text-maroon" aria-hidden />}
        </button>
      </h3>
      <div id={id} hidden={!open} className="px-4 pb-4 text-[0.9375rem] leading-relaxed text-ink-2 sm:px-5">
        <p className="whitespace-pre-line">{faq.answer}</p>
      </div>
    </div>
  );
}

export default function Faq() {
  const { data, isLoading } = useQuery({ queryKey: ['faqs'], queryFn: () => api<FaqDTO[]>('/faqs'), staleTime: 5 * 60_000 });
  const { data: s } = useSettings();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState('');
  const q = query.trim().toLowerCase();
  const matches = (data ?? []).filter((f) => !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
  const groups = new Map<string, FaqDTO[]>();
  for (const f of matches) groups.set(f.group, [...(groups.get(f.group) ?? []), f]);
  const jsonLd = data?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: data.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
      }
    : null;
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // While searching every match starts open (the set then records the ones closed); clear it when the search changes.
  useEffect(() => setOpen(new Set()), [q]);

  // Highlight the topic being read: the last one whose heading has passed the header, or the last
  // topic once the page is scrolled to the bottom (short final topics can't reach the top).
  const groupKey = [...groups.keys()].join('|');
  useEffect(() => {
    const pick = () => {
      const sections = [...document.querySelectorAll<HTMLElement>('[data-faq-group]')];
      if (!sections.length) return;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      // Below the sticky header, with room for the scroll margin.
      const line = Math.max(260, window.innerHeight * 0.3);
      const passed = sections.filter((el) => el.getBoundingClientRect().top <= line);
      const el = atBottom ? sections[sections.length - 1] : passed[passed.length - 1] ?? sections[0];
      setCurrent(el.getAttribute('data-faq-group') ?? '');
    };
    pick();
    window.addEventListener('scroll', pick, { passive: true });
    return () => window.removeEventListener('scroll', pick);
  }, [groupKey]);

  return (
    <PageFade>
      <Seo title="Frequently asked questions" path="/faq" />
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />}
      <FadeHero
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Help' }]}
        eyebrow="Help"
        title={
          <>
            Questions, <em className="font-medium italic text-gold-deep">answered</em>
          </>
        }
        subtitle="Delivery, payment, purity and pricing — the things customers ask us most."
        image={s?.helpPage.image}
      >
        <form
          role="search"
          className="mt-6 flex max-w-2xl overflow-hidden rounded-md border border-gold/50 bg-paper shadow-[0_10px_24px_-18px_rgba(63,18,21,.5)] focus-within:border-gold"
          onSubmit={(e) => {
            e.preventDefault();
            document.getElementById('faq-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          <label className="flex min-w-0 flex-1 items-center gap-3 px-4">
            <Search className="size-5 shrink-0 text-ink-2" strokeWidth={1.5} aria-hidden />
            <span className="sr-only">Search questions</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search e.g. delivery, hallmark, returns"
              className="h-12 min-w-0 flex-1 bg-transparent text-sm focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="grid size-7 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink" aria-label="Clear search">
                <X className="size-3.5" />
              </button>
            )}
          </label>
          <button type="submit" className="shrink-0 bg-maroon px-4 text-[0.75rem] font-bold uppercase tracking-[0.12em] text-ivory transition-colors hover:bg-maroon-2 sm:px-10 sm:tracking-[0.2em]">
            Search
          </button>
        </form>
      </FadeHero>

      <div className="container-page grid gap-10 py-10 md:py-14 lg:grid-cols-12 lg:gap-0">
        <aside className="lg:col-span-4 lg:pr-8 xl:col-span-3">
          <div className="space-y-8 lg:sticky lg:top-20">
            {groups.size > 1 && (
              <nav aria-label="FAQ topics" className="hidden lg:block">
                <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.24em] text-maroon">Topics</p>
                <ul className="mt-3">
                  {[...groups.keys()].map((group) => {
                    const Icon = groupIcon(group);
                    const on = current === group;
                    return (
                      <li key={group} className="border-b border-line/70 last:border-b-0">
                        <a
                          href={`#g-${slug(group)}`}
                          onClick={() => setCurrent(group)}
                          aria-current={on ? 'true' : undefined}
                          className={cn(
                            'flex items-center gap-3.5 border-l-[3px] px-4 py-3 text-[0.9375rem] transition-colors',
                            on ? 'border-maroon bg-gold-pale/40 font-medium text-ink' : 'border-transparent text-ink-2 hover:text-ink',
                          )}
                        >
                          <Icon className="size-5 shrink-0 text-gold-deep" strokeWidth={1.4} aria-hidden />
                          <span className="flex-1">{group}</span>
                          <ChevronRight className="size-4 text-subtle" aria-hidden />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )}
            <div className="relative overflow-hidden rounded-md border border-gold/50 bg-gradient-to-b from-maroon-2 to-maroon p-6 text-center text-ivory shadow-[0_24px_50px_-30px_rgba(63,18,21,.8)]">
              <span aria-hidden className="pointer-events-none absolute inset-1.5 rounded-sm border border-gold-soft/25" />
              <LotusMark className="pointer-events-none absolute -bottom-6 -left-6 w-28 text-gold-soft opacity-20" />
              <Headset className="relative mx-auto size-9 text-gold-soft" strokeWidth={1.3} aria-hidden />
              <p className="relative mt-3 font-display text-[1.75rem] font-semibold leading-tight">Still have a question?</p>
              <p className="relative mt-2 text-sm leading-relaxed text-ivory/80">Ask us anything about a piece, sizing, an order or our pricing.</p>
              <div className="relative mt-5 grid gap-2.5">
                <Link to="/contact" className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-gradient-to-b from-[#ecd08f] to-[#c39a4a] text-[0.75rem] font-bold uppercase tracking-[0.16em] text-maroon">
                  Contact us <ArrowRight className="size-3.5" aria-hidden />
                </Link>
                <Link to="/track-order" className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-ivory/50 text-[0.75rem] font-bold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-ivory/10">
                  Track an order <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </aside>

        <div id="faq-results" className="scroll-mt-24 space-y-10 lg:col-span-8 lg:border-l lg:border-line lg:pl-8 xl:col-span-9">
          {isLoading && <Skeleton className="h-64 w-full" />}
          {!isLoading && q && matches.length === 0 && (
            <div className="rounded-md border border-line bg-paper p-8 text-center">
              <p className="font-display text-2xl font-semibold">No questions match “{query.trim()}”</p>
              <p className="mt-2 text-sm text-muted">Try a different word, or ask us directly — we’re happy to help.</p>
              <ButtonLink to="/contact" size="sm" className="mt-5">
                Ask us
              </ButtonLink>
            </div>
          )}
          {[...groups.entries()].map(([group, items]) => {
            const Icon = groupIcon(group);
            return (
              <section key={group} id={`g-${slug(group)}`} data-faq-group={group} aria-labelledby={`h-${slug(group)}`} className="scroll-mt-28">
                <h2 id={`h-${slug(group)}`} className="flex items-center gap-3 font-display text-[1.875rem] font-medium text-maroon">
                  <Icon className="size-7 shrink-0 text-gold-deep" strokeWidth={1.3} aria-hidden />
                  {group}
                  <span aria-hidden className="h-px flex-1 bg-gold/50" />
                </h2>
                <div className="ml-0 mt-3 rounded-sm border border-gold/40 bg-paper sm:ml-10">
                  {items.map((f) => (
                    <Question key={f.id} faq={f} open={q ? !open.has(f.id) : open.has(f.id)} onToggle={() => toggle(f.id)} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </PageFade>
  );
}
