import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { ImageRef } from '@goldshop/shared';
import { Img } from '../../components/ui/misc';
import { api } from '../../lib/api';
import { ResourceManager } from '../ResourceManager';
import { Badge, FilterTabs } from '../ui';

type Row = Record<string, unknown> & { id: string };

export default function Catalog() {
  const [tab, setTab] = useState<'categories' | 'collections'>('categories');
  const { data: cats } = useQuery({ queryKey: ['admin', 'categories'], queryFn: () => api<{ id: string; name: string; parent: string | null }[]>('/admin/categories') });
  const nameOf = new Map((cats ?? []).map((c) => [c.id, c.name]));
  const thumb = (r: Row) => (
    <span className="block size-11 overflow-hidden rounded-lg bg-canvas"><Img image={r.image as ImageRef | undefined} sizes="40px" width={480} className="size-full object-cover" /></span>
  );
  const seo = (r: Row) => ({ seoTitle: (r.seo as { title?: string })?.title ?? '', seoDescription: (r.seo as { description?: string })?.description ?? '' });
  const withSeo = (v: Record<string, unknown>) => {
    const { seoTitle, seoDescription, ...rest } = v;
    return { ...rest, seo: { title: seoTitle || undefined, description: seoDescription || undefined } };
  };

  const tabs = <FilterTabs className="!mb-5" value={tab} onChange={setTab} options={[{ value: 'categories', label: 'Categories' }, { value: 'collections', label: 'Collections' }]} />;

  return (
    <div>
      {tab === 'categories' ? (
        <ResourceManager
          key="categories"
          resource="categories"
          title="Categories"
          tabs={tabs}
          description="The “type” of piece. Sub-categories appear under their parent; a parent lists all its sub-categories’ products."
          singular="Category"
          paginated={false}
          canWrite
          columns={[
            { key: 'img', header: '', className: 'w-14', cell: thumb },
            { key: 'n', header: 'Name', cell: (r) => <span className="font-semibold text-ink">{r.parent ? <span className="text-muted">{nameOf.get(String(r.parent))} › </span> : null}{String(r.name)}</span> },
            { key: 's', header: 'URL', cell: (r) => <span className="text-muted">/shop/{String(r.slug)}</span> },
            { key: 'c', header: 'Products', cell: (r) => String(r.productCount ?? 0) },
            { key: 'a', header: 'Status', cell: (r) => (r.isActive ? <Badge tone="success">Visible</Badge> : <Badge>Hidden</Badge>) },
          ]}
          defaults={{ name: '', slug: '', parent: null, description: '', image: null, sortOrder: 0, isActive: true, seoTitle: '', seoDescription: '' }}
          toForm={(r) => ({ ...r, parent: r.parent ?? null, ...seo(r) })}
          toPayload={withSeo}
          fields={[
            { name: 'name', label: 'Name', type: 'text', span: 1 },
            { name: 'slug', label: 'URL slug', type: 'text', span: 1, hint: 'Leave blank to generate' },
            { name: 'parent', label: 'Parent category', type: 'select', allowEmpty: 'None (top level)', options: (cats ?? []).map((c) => ({ value: c.id, label: c.name })) },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'image', label: 'Image', type: 'image', folder: 'categories' },
            { name: 'sortOrder', label: 'Sort order', type: 'number', span: 1 },
            { name: 'isActive', label: 'Visible on the store', type: 'switch', span: 1 },
            { name: 'seoTitle', label: 'SEO title', type: 'text', span: 1 },
            { name: 'seoDescription', label: 'SEO description', type: 'text', span: 1 },
          ]}
        />
      ) : (
        <ResourceManager
          key="collections"
          resource="collections"
          title="Collections"
          tabs={tabs}
          description="Curated edits across categories, e.g. Temple Heritage or Everyday Gold. Assign products from the product editor."
          singular="Collection"
          paginated={false}
          canWrite
          columns={[
            { key: 'img', header: '', className: 'w-14', cell: thumb },
            { key: 'n', header: 'Name', cell: (r) => <span className="font-semibold text-ink">{String(r.name)}</span> },
            { key: 'c', header: 'Products', cell: (r) => String(r.productCount ?? 0) },
            { key: 'f', header: 'Homepage', cell: (r) => (r.isFeatured ? <Badge tone="gold">Featured</Badge> : '—') },
            { key: 'a', header: 'Status', cell: (r) => (r.isActive ? <Badge tone="success">Visible</Badge> : <Badge>Hidden</Badge>) },
          ]}
          defaults={{ name: '', slug: '', eyebrow: '', tagline: '', description: '', image: null, banner: null, isFeatured: false, sortOrder: 0, isActive: true, seoTitle: '', seoDescription: '' }}
          toForm={(r) => ({ ...r, ...seo(r) })}
          toPayload={withSeo}
          fields={[
            { name: 'name', label: 'Name', type: 'text', span: 1 },
            { name: 'slug', label: 'URL slug', type: 'text', span: 1, hint: 'Leave blank to generate' },
            { name: 'eyebrow', label: 'Small heading', type: 'text', span: 1, hint: 'Above the name on the collections page, e.g. Tradition' },
            { name: 'tagline', label: 'Tagline', type: 'text', span: 1 },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'image', label: 'Cover image (portrait)', type: 'image', folder: 'collections', span: 1 },
            { name: 'banner', label: 'Wide photo (optional)', type: 'image', folder: 'collections', span: 1, hint: 'For the collections page and this collection’s banner; the cover is used without one' },
            { name: 'isFeatured', label: 'Feature on the homepage', type: 'switch', span: 1 },
            { name: 'isActive', label: 'Visible on the store', type: 'switch', span: 1 },
            { name: 'sortOrder', label: 'Sort order', type: 'number', span: 1 },
            { name: 'seoTitle', label: 'SEO title', type: 'text', span: 1 },
            { name: 'seoDescription', label: 'SEO description', type: 'text' },
          ]}
        />
      )}
    </div>
  );
}
