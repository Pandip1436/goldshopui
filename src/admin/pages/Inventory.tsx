import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import type { ImageRef } from '@goldshop/shared';
import { Img } from '../../components/ui/misc';
import { api, errorMessage } from '../../lib/api';
import { formatDateTime, formatGrams } from '../../lib/utils';
import { Button, DataTable, FilterTabs, PageHeader, Pager, SearchField } from '../ui';

interface Row {
  productId: string;
  variantId: string;
  name: string;
  image?: ImageRef;
  sku: string;
  label: string;
  stock: number;
  netWeightMg?: number;
  isActive: boolean;
}

interface Log {
  _id: string;
  product?: { name: string };
  sku: string;
  delta: number;
  stockAfter?: number;
  reason: string;
  note?: string;
  by?: { name: string };
  createdAt: string;
}

const REASONS: Record<string, string> = {
  order: 'Order placed',
  order_cancelled: 'Order cancelled',
  reservation_expired: 'Unpaid order expired',
  manual: 'Manual adjustment',
  return: 'Returned',
  initial: 'Opening stock',
};

const cellInput = 'h-9 rounded-lg border border-field bg-white px-2.5 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20';

function StockCell({ row }: { row: Row }) {
  const qc = useQueryClient();
  const [value, setValue] = useState(String(row.stock));
  const [note, setNote] = useState('');
  const save = useMutation({
    mutationFn: () => api(`/admin/inventory/${row.productId}/${row.variantId}`, { method: 'PATCH', body: { stock: Number(value), note } }),
    onSuccess: () => {
      toast.success(`${row.sku}: stock set to ${value}`);
      setNote('');
      qc.invalidateQueries({ queryKey: ['admin', 'inventory'] });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
      setValue(String(row.stock));
    },
  });
  const dirty = Number(value) !== row.stock;
  return (
    <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); if (dirty) save.mutate(); }}>
      <input className={`${cellInput} w-20 tabular`} inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))} aria-label={`Stock for ${row.sku}`} />
      {dirty && (
        <>
          <input className={`${cellInput} w-40 text-xs`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (optional)" aria-label="Reason" />
          <Button size="sm" type="submit" loading={save.isPending}>Save</Button>
        </>
      )}
    </form>
  );
}

export default function Inventory() {
  const [sp, setSp] = useSearchParams();
  const filter = sp.get('filter') ?? '';
  const tab = sp.get('tab') ?? 'stock';
  const page = Number(sp.get('page') ?? 1);
  const [q, setQ] = useState(sp.get('q') ?? '');
  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in patch)) next.delete('page');
    setSp(next);
  };
  const stock = useQuery({
    queryKey: ['admin', 'inventory', filter, page, sp.get('q')],
    queryFn: () => api<{ items: Row[]; page: number; pages: number; total: number }>('/admin/inventory', { query: { filter, page, q: sp.get('q') ?? '' } }),
    enabled: tab === 'stock',
    placeholderData: keepPreviousData,
  });
  const logs = useQuery({
    queryKey: ['admin', 'inventory-logs', page],
    queryFn: () => api<{ items: Log[]; page: number; pages: number; total: number }>('/admin/inventory/logs', { query: { page } }),
    enabled: tab === 'logs',
  });

  return (
    <div>
      <PageHeader title="Inventory" description="Every change is logged. Orders reserve stock automatically; unpaid online orders release it when they expire." />
      <FilterTabs
        value={tab === 'logs' ? 'logs' : filter || 'all'}
        onChange={(v) => (v === 'logs' ? set({ tab: 'logs', filter: '' }) : set({ tab: '', filter: v === 'all' ? '' : v }))}
        options={[
          { value: 'all', label: 'All variants' },
          { value: 'low', label: 'Low (≤ 2)' },
          { value: 'out', label: 'Sold out' },
          { value: 'logs', label: 'History' },
        ]}
      />
      {tab === 'logs' ? (
        <>
          <DataTable
            rows={logs.data?.items}
            loading={logs.isLoading}
            rowKey={(r) => r._id}
            columns={[
              { key: 'd', header: 'When', cell: (r) => <span className="whitespace-nowrap text-muted">{formatDateTime(r.createdAt)}</span> },
              { key: 'p', header: 'Product', cell: (r) => <span>{r.product?.name}<span className="block text-xs text-muted">{r.sku}</span></span> },
              { key: 'c', header: 'Change', cell: (r) => <span className={`font-semibold tabular ${r.delta < 0 ? 'text-danger' : 'text-success'}`}>{r.delta > 0 ? '+' : ''}{r.delta}</span> },
              { key: 'a', header: 'After', cell: (r) => r.stockAfter ?? '—' },
              { key: 'r', header: 'Reason', cell: (r) => <span>{REASONS[r.reason] ?? r.reason}{r.note ? <span className="block text-xs text-muted">{r.note}</span> : null}</span> },
              { key: 'b', header: 'By', cell: (r) => r.by?.name ?? 'System' },
            ]}
          />
          {logs.data && <Pager page={logs.data.page} pages={logs.data.pages} total={logs.data.total} onPage={(p) => set({ page: String(p) })} />}
        </>
      ) : (
        <>
          <SearchField className="mb-4 max-w-md" value={q} onChange={setQ} onSubmit={() => set({ q })} placeholder="Search name or SKU" label="Search inventory" />
          <DataTable
            rows={stock.data?.items}
            loading={stock.isLoading}
            rowKey={(r) => r.variantId}
            columns={[
              {
                key: 'p',
                header: 'Product',
                cell: (r) => (
                  <span className="flex items-center gap-3">
                    <span className="size-10 shrink-0 overflow-hidden rounded-lg bg-canvas"><Img image={r.image} sizes="32px" width={480} className="size-full object-cover" /></span>
                    <Link to={`/admin/products/${r.productId}`} className="font-semibold text-ink hover:text-wine">{r.name}</Link>
                  </span>
                ),
              },
              { key: 's', header: 'SKU', cell: (r) => <span className="text-muted">{r.sku}{r.label !== 'Standard' ? ` · ${r.label}` : ''}</span> },
              { key: 'w', header: 'Net weight', cell: (r) => formatGrams(r.netWeightMg) || '—' },
              { key: 'st', header: 'In stock', cell: (r) => <StockCell key={`${r.variantId}-${r.stock}`} row={r} /> },
            ]}
          />
          {stock.data && <Pager page={stock.data.page} pages={stock.data.pages} total={stock.data.total} onPage={(p) => set({ page: String(p) })} />}
        </>
      )}
    </div>
  );
}
