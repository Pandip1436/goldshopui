import { useParams } from 'react-router';
import type { ImageRef } from '@goldshop/shared';
import { Img } from '../../components/ui/misc';
import { formatDate } from '../../lib/utils';
import { toDateInput } from '../lib';
import { ResourceManager } from '../ResourceManager';
import { Alert, Badge, LinkTabs } from '../ui';

type Row = Record<string, unknown> & { id: string };

const thumb = (img: unknown) => (
  <span className="block h-12 w-16 overflow-hidden rounded-lg bg-canvas"><Img image={img as ImageRef | undefined} sizes="64px" width={480} className="size-full object-cover" /></span>
);
const seoIn = (r: Row) => ({ seoTitle: (r.seo as { title?: string })?.title ?? '', seoDescription: (r.seo as { description?: string })?.description ?? '' });
const seoOut = (v: Record<string, unknown>) => {
  const { seoTitle, seoDescription, ...rest } = v;
  return { ...rest, seo: { title: seoTitle || undefined, description: seoDescription || undefined } };
};
const visible = (on: unknown, yes = 'Live', no = 'Hidden') => (on ? <Badge tone="success">{yes}</Badge> : <Badge>{no}</Badge>);

const KINDS = [
  { value: 'banners', label: 'Homepage banners' },
  { value: 'pages', label: 'Pages & policies' },
  { value: 'posts', label: 'Journal' },
  { value: 'faqs', label: 'FAQs' },
  { value: 'testimonials', label: 'Testimonials' },
];

export default function Content() {
  const { kind } = useParams();
  const tabs = <LinkTabs value={kind ?? 'banners'} options={KINDS.map((k) => ({ ...k, to: `/admin/content/${k.value}` }))} />;

  if (kind === 'banners') {
    return (
      <ResourceManager
        key={kind}
        resource="banners"
        title="Homepage banners"
        tabs={tabs}
        singular="Banner"
        description="The large hero at the top of the homepage. With several active banners, they scroll by on their own, one after another."
        canWrite
        columns={[
          { key: 'i', header: '', className: 'w-20', cell: (r) => thumb(r.image) },
          { key: 't', header: 'Title', cell: (r) => <span className="font-semibold text-ink">{String(r.title).replace(/\*/g, '')}</span> },
          { key: 'l', header: 'Link', cell: (r) => <span className="text-muted">{String(r.ctaHref || '—')}</span> },
          { key: 's', header: 'Order', cell: (r) => String(r.sortOrder) },
          { key: 'a', header: 'Status', cell: (r) => visible(r.isActive) },
        ]}
        defaults={{ eyebrow: '', title: '', subtitle: '', ctaLabel: 'Shop now', ctaHref: '/shop', secondaryLabel: '', secondaryHref: '', image: null, mobileImage: null, script: '', points: '', layout: 'split', theme: 'dark', align: 'left', sortOrder: 0, isActive: true, startsAt: '', endsAt: '' }}
        toForm={(r) => ({ ...r, startsAt: toDateInput(r.startsAt as string), endsAt: toDateInput(r.endsAt as string) })}
        toPayload={(v) => ({ ...v, startsAt: v.startsAt || null, endsAt: v.endsAt || null })}
        fields={[
          { name: 'eyebrow', label: 'Small heading', type: 'text', span: 1, placeholder: 'Temple Heritage' },
          { name: 'title', label: 'Headline', type: 'text', span: 1, hint: 'Wrap words in *asterisks* for the gold italic accent.' },
          { name: 'subtitle', label: 'Supporting text', type: 'textarea', rows: 2 },
          { name: 'ctaLabel', label: 'Button label', type: 'text', span: 1 },
          { name: 'ctaHref', label: 'Button link', type: 'text', span: 1, placeholder: '/collections/temple-heritage' },
          { name: 'secondaryLabel', label: 'Second button label', type: 'text', span: 1 },
          { name: 'secondaryHref', label: 'Second button link', type: 'text', span: 1 },
          { name: 'layout', label: 'Layout', type: 'select', span: 1, options: [{ value: 'split', label: 'Arch frame — portrait image on maroon' }, { value: 'full', label: 'Full width — landscape image behind the text' }] },
          { name: 'theme', label: 'Text colour', type: 'select', span: 1, hint: 'Full width only: dark text for light photos, light text for dark photos.', options: [{ value: 'light', label: 'Dark text (light photo)' }, { value: 'dark', label: 'Light text (dark photo)' }] },
          { name: 'align', label: 'Text side', type: 'select', span: 1, hint: 'Full width only: put the text on the photo’s empty side.', options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }] },
          { name: 'image', label: 'Image', type: 'image', folder: 'banners', hint: 'Arch frame: portrait (4:5). Full width: landscape (16:9, at least 1600 px wide) with the subject on one side.' },
          { name: 'script', label: 'Script words on the photo (optional)', type: 'textarea', rows: 2, hint: 'Full width only. One short line each, e.g. Timeless / for Every You. Leave empty if your photo already has text.' },
          { name: 'points', label: 'Trust points under the button (optional)', type: 'textarea', rows: 3, hint: 'One per line, up to three — e.g. BIS hallmarked gold jewellery. A matching icon is chosen for each. Only claims that are true for every piece.' },
          { name: 'mobileImage', label: 'Phone image (optional)', type: 'image', folder: 'banners', hint: 'Full width only: a crop shown on phones. Leave empty to reuse the main image.' },
          { name: 'startsAt', label: 'Show from', type: 'date', span: 1 },
          { name: 'endsAt', label: 'Show until', type: 'date', span: 1 },
          { name: 'sortOrder', label: 'Order', type: 'number', span: 1 },
          { name: 'isActive', label: 'Active', type: 'switch', span: 1 },
        ]}
      />
    );
  }

  if (kind === 'pages') {
    return (
      <ResourceManager
        key={kind}
        resource="pages"
        title="Pages & policies"
        tabs={tabs}
        singular="Page"
        description="Policy pages live at /policies/<slug>; the “about” page feeds Our story."
        canWrite
        notice={<Alert tone="warn" className="mb-4">The seeded policies are templates. Replace every [bracketed] placeholder and have them reviewed before launch.</Alert>}
        columns={[
          { key: 't', header: 'Title', cell: (r) => <span className="font-semibold">{String(r.title)}</span> },
          { key: 's', header: 'Slug', cell: (r) => <span className="text-muted">{String(r.slug)}</span> },
          { key: 'u', header: 'Updated', cell: (r) => <span className="text-muted">{formatDate(String(r.updatedAt))}</span> },
          { key: 'a', header: 'Status', cell: (r) => visible(r.isPublished, 'Published', 'Draft') },
        ]}
        defaults={{ slug: '', title: '', body: '', isPublished: true, seoTitle: '', seoDescription: '' }}
        toForm={(r) => ({ ...r, ...seoIn(r) })}
        toPayload={seoOut}
        fields={[
          { name: 'title', label: 'Title', type: 'text', span: 1 },
          { name: 'slug', label: 'Slug', type: 'text', span: 1, hint: 'Lowercase letters, numbers and hyphens' },
          { name: 'body', label: 'Content', type: 'markdown', rows: 18 },
          { name: 'isPublished', label: 'Published', type: 'switch', span: 1 },
          { name: 'seoTitle', label: 'SEO title', type: 'text', span: 1 },
          { name: 'seoDescription', label: 'SEO description', type: 'text' },
        ]}
      />
    );
  }

  if (kind === 'posts') {
    return (
      <ResourceManager
        key={kind}
        resource="posts"
        title="Journal"
        tabs={tabs}
        singular="Article"
        description="Guides and stories. Helpful, accurate articles build trust and bring search traffic."
        canWrite
        columns={[
          { key: 'i', header: '', className: 'w-20', cell: (r) => thumb(r.cover) },
          { key: 't', header: 'Title', cell: (r) => <span className="font-semibold">{String(r.title)}</span> },
          { key: 'd', header: 'Published', cell: (r) => <span className="text-muted">{r.publishedAt ? formatDate(String(r.publishedAt)) : '—'}</span> },
          { key: 'a', header: 'Status', cell: (r) => visible(r.isPublished, 'Published', 'Draft') },
        ]}
        defaults={{ title: '', slug: '', excerpt: '', body: '', cover: null, author: '', tags: [], isPublished: false, publishedAt: '', seoTitle: '', seoDescription: '' }}
        toForm={(r) => ({ ...r, publishedAt: toDateInput(r.publishedAt as string), ...seoIn(r) })}
        toPayload={(v) => {
          const out = seoOut(v);
          return { ...out, publishedAt: v.publishedAt || (v.isPublished ? new Date().toISOString().slice(0, 10) : null) };
        }}
        fields={[
          { name: 'title', label: 'Title', type: 'text' },
          { name: 'excerpt', label: 'Summary', type: 'textarea', rows: 2 },
          { name: 'cover', label: 'Cover image', type: 'image', folder: 'journal' },
          { name: 'body', label: 'Article', type: 'markdown', rows: 18 },
          { name: 'author', label: 'Author', type: 'text', span: 1 },
          { name: 'tags', label: 'Tags', type: 'tags', span: 1 },
          { name: 'publishedAt', label: 'Publish date', type: 'date', span: 1 },
          { name: 'isPublished', label: 'Published', type: 'switch', span: 1 },
          { name: 'slug', label: 'URL slug', type: 'text', span: 1, hint: 'Leave blank to generate' },
          { name: 'seoTitle', label: 'SEO title', type: 'text', span: 1 },
          { name: 'seoDescription', label: 'SEO description', type: 'text' },
        ]}
      />
    );
  }

  if (kind === 'faqs') {
    return (
      <ResourceManager
        key={kind}
        resource="faqs"
        title="FAQs"
        tabs={tabs}
        singular="FAQ"
        canWrite
        columns={[
          { key: 'q', header: 'Question', cell: (r) => <span className="font-semibold">{String(r.question)}</span> },
          { key: 'g', header: 'Group', cell: (r) => <span className="text-muted">{String(r.group)}</span> },
          { key: 'a', header: 'Status', cell: (r) => visible(r.isPublished, 'Published', 'Draft') },
        ]}
        defaults={{ question: '', answer: '', group: 'General', sortOrder: 0, isPublished: true }}
        fields={[
          { name: 'question', label: 'Question', type: 'text' },
          { name: 'answer', label: 'Answer', type: 'textarea', rows: 5 },
          { name: 'group', label: 'Group', type: 'text', span: 1 },
          { name: 'sortOrder', label: 'Order', type: 'number', span: 1 },
          { name: 'isPublished', label: 'Published', type: 'switch', span: 1 },
        ]}
      />
    );
  }

  return (
    <ResourceManager
      key="testimonials"
      resource="testimonials"
      title="Testimonials"
      tabs={tabs}
      singular="Testimonial"
      description="Shown on the homepage only when at least one is published."
      canWrite
      notice={<Alert tone="warn" className="mb-4">Publish only genuine feedback from real customers, with their permission. Note where it came from (e.g. Google review).</Alert>}
      columns={[
        { key: 'n', header: 'Name', cell: (r) => <span className="font-semibold">{String(r.name)}</span> },
        { key: 'q', header: 'Quote', cell: (r) => <span className="line-clamp-2 text-muted">{String(r.quote)}</span> },
        { key: 's', header: 'Source', cell: (r) => String(r.source || '—') },
        { key: 'a', header: 'Status', cell: (r) => visible(r.isPublished, 'Published', 'Draft') },
      ]}
      defaults={{ name: '', location: '', quote: '', rating: null, source: '', isPublished: false, sortOrder: 0 }}
      fields={[
        { name: 'name', label: 'Customer name', type: 'text', span: 1 },
        { name: 'location', label: 'City', type: 'text', span: 1 },
        { name: 'quote', label: 'What they said', type: 'textarea', rows: 4 },
        { name: 'rating', label: 'Rating (1–5)', type: 'number', span: 1 },
        { name: 'source', label: 'Source', type: 'text', span: 1, placeholder: 'Google review' },
        { name: 'sortOrder', label: 'Order', type: 'number', span: 1 },
        { name: 'isPublished', label: 'Published', type: 'switch', span: 1 },
      ]}
    />
  );
}
