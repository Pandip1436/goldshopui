import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import type { PostDTO } from '@goldshop/shared';
import { Markdown } from '../components/Markdown';
import { Seo } from '../components/Seo';
import { ButtonLink } from '../components/ui/Button';
import { PageFade } from '../components/ui/Motion';
import { Breadcrumbs, EmptyState, Img, Ornament, Skeleton } from '../components/ui/misc';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';

export default function Post() {
  const { slug } = useParams();
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => api<PostDTO & { seo?: { title?: string; description?: string } }>(`/posts/${slug}`),
    retry: false,
  });
  if (isLoading) return <div className="container-page max-w-3xl py-16"><Skeleton className="h-96 w-full" /></div>;
  if (error || !post) return <div className="container-page py-16"><EmptyState title="Article not found" action={<ButtonLink to="/journal">All articles</ButtonLink>} /></div>;
  return (
    <PageFade>
      <Seo title={post.seo?.title ?? post.title} description={post.seo?.description ?? post.excerpt} path={`/journal/${post.slug}`} />
      <article>
        <header className="container-page max-w-3xl pt-10 text-center md:pt-16">
          <Breadcrumbs items={[{ label: 'Journal', to: '/journal' }, { label: post.title }]} className="flex justify-center" />
          <p className="mt-8 text-xs text-muted">{formatDate(post.publishedAt)} · {post.readingMinutes} min read{post.author ? ` · ${post.author}` : ''}</p>
          <h1 className="display-lg mt-4">{post.title}</h1>
          {post.excerpt && <p className="mx-auto mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-muted">{post.excerpt}</p>}
        </header>
        {post.cover && (
          <div className="container-page mt-10 max-w-5xl">
            <div className="aspect-[16/9] overflow-hidden bg-sand">
              <Img image={post.cover} priority sizes="(min-width: 1024px) 64rem, 100vw" width={1600} className="size-full object-cover" />
            </div>
          </div>
        )}
        <div className="container-page mt-12 max-w-3xl">
          <Markdown source={post.body} className="mx-auto" />
          <Ornament className="mt-16 justify-center" />
          <div className="cta-row mt-10 justify-center">
            <ButtonLink to="/shop">Shop the collection</ButtonLink>
            <ButtonLink to="/journal" variant="secondary">More articles</ButtonLink>
          </div>
        </div>
      </article>
    </PageFade>
  );
}
