import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { PURITIES, type ImageRef, type PurityKey } from '@goldshop/shared';
import { Img } from '../../components/ui/misc';
import { api, errorMessage } from '../../lib/api';
import { formatDate, inr } from '../../lib/utils';
import { Badge, Button, DataTable, FilterTabs, PageHeader, Pager, SearchField, Toggle } from '../ui';

interface Row {
  id: string;
  name: string;
  slug: string;
  image?: ImageRef;
  category: string;
  purity?: PurityKey;
  pricingMode: string;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  isActive: boolean;
  isFeatured: boolean;
  variantCount: number;
  sku: string;
  soldCount: number;
  demo: boolean;
  updatedAt: string;
}

export default function Products() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const status = sp.get('status') ?? '';
  const page = Number(sp.get('page') ?? 1);
  const [q, setQ] = useState(sp.get('q') ?? '');
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products', status, page, sp.get('q')],
    queryFn: () => api<{ items: Row[]; page: number; pages: number; total: number }>('/admin/products', { query: { status, page, q: sp.get('q') ?? '' } }),
    placeholderData: keepPreviousData,
  });
  const flag = useMutation({
    mutationFn: (v: { id: string; isActive?: boolean; isFeatured?: boolean }) => api(`/admin/products/${v.id}/flags`, { method: 'PATCH', body: { isActive: v.isActive, isFeatured: v.isFeatured } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
    onError: (e) => toast.error(errorMessage(e)),
  });
  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in patch)) next.delete('page');
    setSp(next);
  };

  return (
    <div>
      <PageHeader title="Products" description="Prices update automatically when you change gold rates." actions={<Button icon={<Plus className="size-4" />} onClick={() => navigate('/admin/products/new')}>New product</Button>} />
      <FilterTabs
        value={status}
        onChange={(v) => set({ status: v })}
        options={[
          { value: '', label: 'All' },
          { value: 'active', label: 'Live' },
          { value: 'hidden', label: 'Hidden' },
          { value: 'low', label: 'Low stock' },
          { value: 'out', label: 'Sold out' },
          { value: 'featured', label: 'Featured' },
          { value: 'demo', label: 'Demo data' },
        ]}
      />
      <SearchField className="mb-4 max-w-md" value={q} onChange={setQ} onSubmit={() => set({ q })} placeholder="Search name, SKU or tag" label="Search products" />
      <DataTable
        rows={data?.items}
        loading={isLoading}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/admin/products/${r.id}`)}
        empty="No products found."
        columns={[
          {
            key: 'p',
            header: 'Product',
            cell: (r) => (
              <span className="flex items-center gap-3">
                <span className="size-11 shrink-0 overflow-hidden rounded-lg bg-canvas"><Img image={r.image} sizes="40px" width={480} className="size-full object-cover" /></span>
                <span>
                  <span className="font-semibold text-ink">{r.name}</span> {r.demo && <Badge tone="warn">Demo</Badge>}
                  <span className="block text-xs text-muted">{r.sku}{r.variantCount > 1 ? ` + ${r.variantCount - 1} variants` : ''}</span>
                </span>
              </span>
            ),
          },
          { key: 'c', header: 'Category', cell: (r) => <span className="text-muted">{r.category}</span> },
          { key: 'pu', header: 'Purity', cell: (r) => (r.purity ? PURITIES[r.purity].label : '—') },
          { key: 'pr', header: 'Price', cell: (r) => (r.minPrice ? <span className="whitespace-nowrap font-medium text-ink tabular">{inr(r.minPrice)}{r.maxPrice > r.minPrice ? ` – ${inr(r.maxPrice)}` : ''}</span> : <span className="text-danger">No price</span>) },
          { key: 's', header: 'Stock', cell: (r) => (r.totalStock === 0 ? <Badge tone="danger">Sold out</Badge> : r.totalStock <= 2 ? <Badge tone="warn">{r.totalStock} left</Badge> : <span className="tabular">{r.totalStock}</span>) },
          { key: 'so', header: 'Sold', cell: (r) => r.soldCount },
          { key: 'l', header: 'Live', cell: (r) => <span onClick={(e) => e.stopPropagation()}><Toggle checked={r.isActive} label={`${r.name} live`} onChange={(v) => flag.mutate({ id: r.id, isActive: v })} /></span> },
          { key: 'f', header: 'Featured', cell: (r) => <span onClick={(e) => e.stopPropagation()}><Toggle checked={r.isFeatured} label={`${r.name} featured`} onChange={(v) => flag.mutate({ id: r.id, isFeatured: v })} /></span> },
          { key: 'u', header: 'Updated', cell: (r) => <span className="text-xs text-muted">{formatDate(r.updatedAt)}</span> },
        ]}
      />
      {data && <Pager page={data.page} pages={data.pages} total={data.total} onPage={(p) => set({ page: String(p) })} />}
    </div>
  );
}
