import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeIndianRupee,
  ChartNoAxesColumnIncreasing,
  FileText,
  Gem,
  Gift,
  LayoutGrid,
  MessageCircle,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Fragment, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { ImageRef, Paginated, PostSummaryDTO } from '@goldshop/shared';
import { LotusMark } from '../components/AboutLegacy';
import { Seo } from '../components/Seo';
import { Button, ButtonLink } from '../components/ui/Button';
import { PageFade, Reveal } from '../components/ui/Motion';
import { EmptyState, Img, Skeleton } from '../components/ui/misc';
import { api } from '../lib/api';
import { useCollections, useSettings } from '../lib/hooks';
import { cn, formatDate } from '../lib/utils';

/**
 * Journal topics, matched against each article's tags (set in the admin). A topic only appears
 * once at least one published article carries one of its tags, so no filter ever leads nowhere.
 */
const TOPICS: { key: string; label: string; icon: LucideIcon; tags: string[] }[] = [
  { key: 'gold-guide', label: 'Gold guide', icon: Gem, tags: ['purity', 'gold-guide', 'karat'] },
  { key: 'hallmark', label: 'Hallmark & purity', icon: FileText, tags: ['hallmark', 'huid', 'bis'] },
  { key: 'pricing', label: 'Pricing & value', icon: BadgeIndianRupee, tags: ['pricing', 'price', 'gold-rate'] },
  { key: 'care', label: 'Jewellery care', icon: Sparkles, tags: ['care', 'cleaning'] },
  { key: 'trends', label: 'Trends & style', icon: ChartNoAxesColumnIncreasing, tags: ['trends', 'style', 'styling'] },
  { key: 'occasions', label: 'Occasions', icon: Gift, tags: ['occasions', 'wedding', 'festive', 'gifting'] },
  { key: 'buying', label: 'Buying guide', icon: Users, tags: ['buying', 'buying-guide'] },
];

const topicOf = (p: PostSummaryDTO) => TOPICS.find((t) => p.tags.some((tag) => t.tags.includes(tag.toLowerCase())));

export default function Journal() {
  const [sp, setSp] = useSearchParams();
  const [page, setPage] = useState(1);
  // The journal is small, so one page of up to 24 articles is filtered by topic in the browser.
  const { data, isLoading } = useQuery({
    queryKey: ['posts', page],
    queryFn: () => api<Paginated<PostSummaryDTO>>('/posts', { query: { page, limit: 24 } }),
  });
  const { data: s } = useSettings();
  const { data: collections } = useCollections();
  // The banner photo is set in the admin; until then a collection photo stands in.
  const heroImage = s?.journal.image ?? collections?.find((c) => c.slug === 'wedding-and-festive')?.image ?? collections?.find((c) => c.image)?.image;

  const posts = data?.items ?? [];
  const topics = TOPICS.filter((t) => posts.some((p) => topicOf(p)?.key === t.key));
  const active = topics.find((t) => t.key === sp.get('topic'));
  const shown = active ? posts.filter((p) => topicOf(p)?.key === active.key) : posts;
  const [lead, side, ...rest] = shown;
  const choose = (key?: string) => setSp(key ? { topic: key } : {}, { preventScrollReset: true });

  return (
    <PageFade>
      <Seo title="Journal" path="/journal" description="Guides to gold jewellery — purity, hallmarks, pricing, trends and care." />
      <Hero image={heroImage} script={s?.journal.script ?? []} />

      {topics.length > 0 && (
        <nav aria-label="Journal topics" className="container-page relative z-10 -mt-7 md:-mt-9">
          <ul className="mx-auto flex w-fit max-w-full overflow-x-auto rounded-2xl border border-line/70 bg-paper p-1.5 shadow-[0_24px_50px_-34px_rgba(63,18,21,.55)] scrollbar-none">
            {[{ key: '', label: 'All articles', icon: LayoutGrid }, ...topics].map((t, i) => {
              const on = t.key ? active?.key === t.key : !active;
              return (
                <Fragment key={t.key || 'all'}>
                  {i > 0 && <li aria-hidden className="my-3 w-px shrink-0 bg-line" />}
                  <li className="shrink-0">
                    <button
                      type="button"
                      onClick={() => choose(t.key || undefined)}
                      aria-pressed={on}
                      className={cn(
                        'flex h-full w-[6.5rem] flex-col items-center gap-2 rounded-xl px-2 py-3 text-center transition-colors sm:w-32',
                        on ? 'bg-gold-pale/55 text-gold-deep' : 'text-ink-2 hover:bg-sand/60 hover:text-ink',
                      )}
                    >
                      <t.icon className={cn('size-6', on ? 'text-gold-deep' : 'text-gold')} strokeWidth={1.4} aria-hidden />
                      <span className="text-[0.6875rem] font-semibold uppercase leading-tight tracking-[0.1em]">{t.label}</span>
                    </button>
                  </li>
                </Fragment>
              );
            })}
          </ul>
        </nav>
      )}

      <div className="container-page pb-16 pt-8 md:pb-24 md:pt-10">
        {active && (
          <p className="mb-6 text-sm text-muted" aria-live="polite">
            {shown.length} {shown.length === 1 ? 'article' : 'articles'} on <span className="font-semibold text-ink">{active.label}</span> ·{' '}
            <button type="button" onClick={() => choose()} className="font-semibold text-ink underline decoration-gold underline-offset-4 hover:text-gold-deep">
              Show all
            </button>
          </p>
        )}

        {isLoading ? (
          <div className="space-y-5">
            <Skeleton className="h-72 w-full rounded-xl" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ) : !lead ? (
          <EmptyState title="No articles yet">New guides are on their way. In the meantime, our FAQs answer the most common questions.</EmptyState>
        ) : (
          <>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-12">
              <FeaturedPost post={lead} className={side ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'} />
              {side && (
                <Reveal className="lg:col-span-4 xl:col-span-3">
                  <PostCard post={side} />
                </Reveal>
              )}
            </div>
            {rest.length > 0 && (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {rest.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 5) * 0.05}>
                    <PostCard post={p} />
                  </Reveal>
                ))}
              </div>
            )}
            {!active && data && data.pages > 1 && (
              <div className="mt-12 flex justify-center gap-3">
                <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((x) => x - 1)}>
                  Newer articles
                </Button>
                <Button variant="secondary" disabled={page >= data.pages} onClick={() => setPage((x) => x + 1)}>
                  Older articles
                </Button>
              </div>
            )}
          </>
        )}

        <AskBand />
      </div>
    </PageFade>
  );
}

/** Script words: a *word* in asterisks is set in gold. */
function ScriptLine({ line }: { line: string }) {
  return (
    <span className="block">
      {line.split(/(\*[^*]+\*)/).map((part, i) =>
        part.startsWith('*') && part.endsWith('*') ? (
          <span key={i} className="text-gold-soft">
            {part.slice(1, -1)}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </span>
  );
}

/** "Jewellery Journal" on the left; the photo fills the right and fades into the page, with script words over it. */
function Hero({ image, script }: { image?: ImageRef; script: string[] }) {
  return (
    <section aria-labelledby="journal-title" className="relative overflow-hidden bg-ivory">
      <LotusMark className="pointer-events-none absolute -left-14 bottom-2 w-64 text-gold opacity-[0.07]" />
      <div className="container-page relative z-10 pb-14 pt-10 md:pb-20 md:pt-14 lg:pb-24">
        <div className="lg:max-w-[46%]">
          <h1 id="journal-title" className="font-display text-[clamp(3rem,1.7rem+4.2vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.01em] text-maroon">
            Jewellery{' '}
            <em className="whitespace-nowrap bg-gradient-to-r from-gold-deep via-gold to-gold-deep bg-clip-text pr-2 font-semibold text-transparent">Journal</em>
          </h1>
          <p className="mt-4 font-display text-[1.625rem] font-medium leading-tight text-ink md:text-[2rem]">Stories, Guides &amp; Expert Advice</p>
          <p className="mt-3 max-w-md text-[1.0625rem] leading-relaxed text-ink-2">Your trusted guide to gold jewellery — purity, hallmarks, pricing, trends and care.</p>
        </div>
      </div>

      {image && (
        <div className="container-page -mt-6 pb-16 md:pb-20 lg:contents">
          <div className="relative h-56 overflow-hidden rounded-2xl sm:h-72 lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[60%] lg:rounded-none">
            <div className="absolute inset-0 lg:[mask-image:linear-gradient(to_right,transparent,black_30%)]">
              <Img image={image} priority sizes="(min-width: 1024px) 60vw, 100vw" width={1600} className="size-full object-cover object-[60%_30%]" />
            </div>
            {/* a soft dark wash behind the script words, so ivory and gold both read on a bright photo */}
            {script.length > 0 && <div aria-hidden className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#1d0f0a]/65 via-[#1d0f0a]/25 via-55% to-transparent" />}
            {script.length > 0 && (
              <div className="absolute right-5 top-1/2 flex -translate-y-1/2 flex-col items-start lg:right-[max(2.5rem,calc((100vw-90rem)/2+2.5rem))]">
                <p className="font-display text-[clamp(1.375rem,0.9rem+1.2vw,2.25rem)] font-medium italic leading-[1.12] text-ivory [text-shadow:0_2px_16px_rgba(30,18,12,.75)]">
                  {script.map((l, i) => (
                    <ScriptLine key={`${i}-${l}`} line={l} />
                  ))}
                </p>
                <span aria-hidden className="mt-3 flex items-center gap-2 text-gold-soft">
                  <span className="h-px w-8 bg-current opacity-70" />
                  <span className="size-1.5 rotate-45 border border-current" />
                  <span className="h-px w-8 bg-current opacity-70" />
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function PostMeta({ post }: { post: PostSummaryDTO }) {
  const topic = topicOf(post);
  return (
    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em]">
      <span className="text-gold-deep">{topic?.label ?? 'Journal'}</span>
      <span aria-hidden className="mx-2 text-subtle">
        •
      </span>
      <span className="font-medium normal-case tracking-normal text-muted">{formatDate(post.publishedAt)}</span>
    </p>
  );
}

function ReadMore() {
  return (
    <span className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-ink">
      Read article
      <span className="grid size-7 place-items-center rounded-full bg-maroon text-ivory transition-transform duration-300 group-hover:translate-x-1">
        <ArrowRight className="size-3.5" aria-hidden />
      </span>
    </span>
  );
}

function FeaturedPost({ post, className }: { post: PostSummaryDTO; className?: string }) {
  return (
    <Link
      to={`/journal/${post.slug}`}
      className={cn(
        'group grid overflow-hidden rounded-xl border border-gold/35 bg-paper shadow-[0_34px_70px_-48px_rgba(63,18,21,.55)] transition-colors duration-500 hover:border-gold/60 md:grid-cols-[1.25fr_1fr]',
        className,
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-sand md:aspect-auto md:min-h-[18rem]">
        <Img
          image={post.cover}
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          width={1600}
          className="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-lux)] group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-md bg-maroon px-3.5 py-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-ivory shadow-sm">Featured</span>
      </div>
      <div className="relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-paper to-gold-pale/25 p-7 md:p-9 xl:p-10">
        <LotusMark className="pointer-events-none absolute -bottom-6 -right-6 w-44 text-gold opacity-[0.12]" />
        <div className="relative">
          <PostMeta post={post} />
          <h2 className="mt-4 font-display text-[clamp(1.875rem,1.4rem+1.3vw,2.625rem)] font-semibold leading-[1.08] text-maroon transition-colors group-hover:text-gold-deep">{post.title}</h2>
          <p className="mt-4 leading-relaxed text-ink-2">{post.excerpt}</p>
          <span className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <span className="inline-flex h-11 items-center gap-2.5 rounded-md bg-gradient-to-b from-maroon-2 to-maroon px-5 text-xs font-bold uppercase tracking-[0.18em] text-ivory shadow-[0_10px_20px_-12px_rgba(63,18,21,.9)] transition-[filter] group-hover:brightness-110">
              Read article <ArrowRight className="size-4" aria-hidden />
            </span>
            <span className="text-xs text-subtle">{post.readingMinutes} min read</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function PostCard({ post }: { post: PostSummaryDTO }) {
  return (
    <Link
      to={`/journal/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-line/80 bg-paper shadow-[0_22px_44px_-36px_rgba(63,18,21,.5)] transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-1 hover:border-gold/45 hover:shadow-[0_30px_56px_-36px_rgba(63,18,21,.55)]"
    >
      <div className="aspect-[12/5] overflow-hidden bg-sand">
        <Img
          image={post.cover}
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 30vw, (min-width: 640px) 48vw, 100vw"
          className="size-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-lux)] group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <PostMeta post={post} />
        <h3 className="mt-2.5 font-display text-[1.4375rem] font-semibold leading-[1.12] text-maroon transition-colors group-hover:text-gold-deep">{post.title}</h3>
        <p className="mt-2.5 line-clamp-3 text-[0.8125rem] leading-relaxed text-ink-2">{post.excerpt}</p>
        <span className="mt-auto pt-5">
          <ReadMore />
        </span>
      </div>
    </Link>
  );
}

function AskBand() {
  return (
    <section className="mt-16 flex flex-col gap-6 rounded-xl border border-line bg-paper p-7 md:mt-20 md:flex-row md:items-center md:justify-between md:p-10">
      <div className="flex gap-5">
        <span className="hidden size-12 shrink-0 place-items-center rounded-full border border-gold/40 text-gold-deep sm:grid">
          <MessageCircle className="size-5" strokeWidth={1.4} aria-hidden />
        </span>
        <div>
          <p className="font-display text-[1.75rem] font-medium leading-tight">
            A question we haven’t <em className="italic text-gold-deep">covered?</em>
          </p>
          <p className="mt-1.5 text-sm text-muted">Ask us about purity, hallmarks, sizing or pricing — we’re happy to explain.</p>
        </div>
      </div>
      <div className="cta-row">
        <ButtonLink to="/contact">Ask us</ButtonLink>
        <ButtonLink to="/faq" variant="secondary">
          Read FAQs
        </ButtonLink>
      </div>
    </section>
  );
}
