import { Sparkles } from 'lucide-react';
import type { StoryChapter } from '@goldshop/shared';
import { cn } from '../lib/utils';
import { ABOUT_ICONS } from './aboutIcons';
import { Reveal } from './ui/Motion';
import { Img } from './ui/misc';

/** A small engraved-looking scroll between two hairlines, closing each chapter's text. */
function Flourish({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('flex items-center gap-1.5', className)}>
      <span className="h-px flex-1 bg-gold/45" />
      <svg viewBox="0 0 28 12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="w-7 shrink-0">
        <path d="M14 2.5 17 6l-3 3.5L11 6Z" />
        <path d="M10 6c-1.5-2.5-4-3-6-1.5M10 6c-1.5 2.5-4 3-6 1.5M18 6c1.5-2.5 4-3 6-1.5M18 6c1.5 2.5 4 3 6 1.5" />
      </svg>
      <span className="h-px flex-1 bg-gold/45" />
    </span>
  );
}

/**
 * The Our story page's chapters: numbered cards set as one board (four across on wide screens,
 * two on tablets, one on phones). Each photo sits on the right and fades into the card so the
 * text on the left stays readable at every width.
 */
export function StoryChapters({ chapters }: { chapters: StoryChapter[] }) {
  if (chapters.length === 0) return null;
  return (
    <section aria-labelledby="chapters-title" className="container-page py-14 md:py-20">
      <h2 id="chapters-title" className="sr-only">
        Our story, chapter by chapter
      </h2>
      <Reveal>
        <ol className="grid grid-cols-[minmax(0,1fr)] gap-[3px] overflow-hidden rounded-2xl border border-gold/25 bg-[#fffdf8] shadow-[0_30px_60px_-45px_rgba(63,18,21,.55)] md:grid-cols-2 xl:grid-cols-4">
          {chapters.map((c, i) => (
            <li key={`${i}-${c.title}`} className="relative isolate flex min-h-[23rem] flex-col overflow-hidden bg-[#fbf6ee] sm:min-h-[25rem]">
              {/* Phones: the photo sits on top and fades into the card, so the text gets the full width.
                  From sm: it fills the right side behind the text. */}
              {c.image && (
                <div aria-hidden className="relative -z-10 h-44 w-full [mask-image:linear-gradient(to_bottom,black_55%,transparent)] sm:absolute sm:inset-y-0 sm:right-0 sm:h-auto sm:w-[62%] sm:[mask-image:linear-gradient(to_right,transparent,black_45%)] xl:w-[56%]">
                  <Img
                    image={c.image}
                    alt=""
                    width={960}
                    sizes="(min-width: 1280px) 16vw, (min-width: 768px) 30vw, (min-width: 640px) 60vw, 100vw"
                    className="size-full object-cover object-[65%_center]"
                  />
                </div>
              )}
              {/* a warm wash where the text meets the photo */}
              {c.image && <div aria-hidden className="absolute inset-0 -z-10 hidden bg-[linear-gradient(90deg,#fbf6ee_32%,rgba(251,246,238,.72)_55%,transparent_78%)] sm:block xl:bg-[linear-gradient(90deg,#fbf6ee_42%,rgba(251,246,238,.8)_62%,transparent_86%)]" />}

              <div className={cn('p-6', c.image ? 'w-full max-sm:-mt-6 sm:w-[60%] xl:w-[72%]' : 'w-full')}>
                <p className="flex items-center gap-3 font-display text-[1.125rem] text-gold-deep tabular">
                  {String(i + 1).padStart(2, '0')}
                  <span aria-hidden className="h-px w-8 bg-gold/60" />
                </p>
                <h3
                  className={cn(
                    'mt-4 font-display font-medium leading-[1.02] text-maroon',
                    i === 0 ? 'text-[2.75rem] sm:text-[3.25rem] xl:text-[3rem]' : 'text-[2rem] sm:text-[2.375rem] xl:text-[2.125rem]',
                  )}
                >
                  {c.title}
                </h3>
                {c.eyebrow && <p className="mt-4 text-[0.6875rem] font-semibold uppercase leading-relaxed tracking-[0.16em] text-gold-deep">{c.eyebrow}</p>}
                {c.body && <p className="mt-4 text-[0.875rem] leading-relaxed text-ink-2">{c.body}</p>}
                <Flourish className="mt-5 w-24 text-gold" />
              </div>

              {c.features.length > 0 && (
                <ul className="mt-auto grid grid-cols-3 divide-x divide-gold/25 border-t border-gold/20 bg-[#fbf6ee]/90 px-1 py-4 backdrop-blur-[2px]">
                  {c.features.map((f) => {
                    const Icon = ABOUT_ICONS[f.icon ?? ''] ?? Sparkles;
                    return (
                      <li key={f.label} className="flex flex-col items-center gap-1.5 px-1.5 text-center">
                        <Icon className="size-8 text-gold-deep" strokeWidth={1.2} aria-hidden />
                        {f.value && <span className="font-display text-[1.5rem] font-semibold leading-none text-maroon tabular">{f.value}</span>}
                        <span className="text-[0.75rem] leading-snug text-ink-2">{f.label}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
