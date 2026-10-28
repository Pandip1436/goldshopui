import { useQuery } from '@tanstack/react-query';
import type { PageDTO } from '@goldshop/shared';
import { AboutLegacy } from '../components/AboutLegacy';
import { Markdown } from '../components/Markdown';
import { Promises } from '../components/Promises';
import { VisitUs } from '../components/VisitUs';
import { Seo } from '../components/Seo';
import { StorePhotos } from '../components/StorePhotos';
import { StoryChapters } from '../components/StoryChapters';
import { PageFade } from '../components/ui/Motion';
import { Img, Ornament, Skeleton } from '../components/ui/misc';
import { api } from '../lib/api';
import { useHome, useSettings } from '../lib/hooks';

export default function About() {
  const { data: s } = useSettings();
  const { data: home } = useHome();
  const { data: page, isLoading } = useQuery({ queryKey: ['page', 'about'], queryFn: () => api<PageDTO>('/pages/about'), retry: false });
  const hero = home?.collections.find((c) => c.slug === 'temple-heritage')?.image ?? home?.collections[0]?.image;
  // The seeded story page is a fill-in template; once the brand-story section is on, keep the
  // unedited template off the public page so its [placeholders] never show.
  const untouchedTemplate = Boolean(page?.body.includes('[Write two or three short paragraphs'));

  return (
    <PageFade>
      <Seo title="Our story" path="/about" />
      {s?.about ? (
        <AboutLegacy about={s.about} stats={s.stats} storeName={s.store.name} headingLevel={1} />
      ) : (
          <section className="bg-paper">
            <div className="container-page grid items-center gap-12 py-14 md:py-20 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <p className="eyebrow">Our story</p>
                <h1 className="display-xl mt-4">
                  The house of <em className="italic text-gold-deep">{s?.store.name}</em>
                </h1>
                <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-ink-2">{s?.store.tagline}.</p>
              </div>
              <div className="lg:col-span-5 lg:col-start-8">
                <div className="arch mx-auto aspect-[4/5] max-w-sm overflow-hidden bg-sand">
                  <Img image={hero} priority sizes="(min-width: 1024px) 36vw, 90vw" className="size-full object-cover" />
                </div>
              </div>
            </div>
          </section>
      )}

      {!(s?.about && (!page || untouchedTemplate) && !isLoading) && (
        <section className="container-page py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : page ? (
              <Markdown source={page.body} className="mx-auto" />
            ) : (
              <p className="text-muted">{s?.store.description}</p>
            )}
          </div>
          <Ornament className="mt-16 justify-center" />
        </section>
      )}

      {s && <StoryChapters chapters={s.storyChapters} />}

      {s && <StorePhotos settings={s} />}

      {s && s.benefits.length > 0 && <Promises items={s.benefits} />}

      {s && <VisitUs settings={s} />}
    </PageFade>
  );
}
