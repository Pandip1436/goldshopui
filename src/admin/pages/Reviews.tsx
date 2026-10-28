import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Stars } from '../../components/ui/misc';
import { api, errorMessage } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Button, FilterTabs, PageHeader, Pager, cardClass } from '../ui';

interface Row {
  id: string;
  product?: { name: string; slug: string };
  authorName: string;
  rating: number;
  title?: string;
  body: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function Reviews() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reviews', status, page],
    queryFn: () => api<{ items: Row[]; page: number; pages: number; total: number }>('/admin/reviews', { query: { status, page } }),
    placeholderData: keepPreviousData,
  });
  const update = useMutation({
    mutationFn: (v: { id: string; status: Row['status'] }) => api(`/admin/reviews/${v.id}`, { method: 'PATCH', body: { status: v.status } }),
    onSuccess: () => {
      toast.success('Review updated');
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <div>
      <PageHeader title="Reviews" description="Only customers whose order of a piece was delivered can review it. Approve reviews to publish them." />
      <FilterTabs value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: 'pending', label: 'Awaiting approval' }, { value: 'approved', label: 'Published' }, { value: 'rejected', label: 'Rejected' }]} />
      {isLoading ? null : !data?.items.length ? (
        <p className={`${cardClass} py-12 text-center text-sm text-muted`}>No reviews here.</p>
      ) : (
        <ul className="space-y-3">
          {data.items.map((r) => (
            <li key={r.id} className={`${cardClass} p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Stars value={r.rating} size={13} />
                  <span className="font-semibold text-ink">{r.title}</span>
                </div>
                <span className="text-xs text-muted">{r.authorName} · {formatDate(r.createdAt)} · <a href={`/product/${r.product?.slug}`} target="_blank" rel="noreferrer" className="font-semibold text-wine underline underline-offset-2">{r.product?.name}</a></span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{r.body}</p>
              <div className="mt-4 flex gap-2">
                {r.status !== 'approved' && <Button size="sm" onClick={() => update.mutate({ id: r.id, status: 'approved' })}>Approve</Button>}
                {r.status !== 'rejected' && <Button size="sm" variant="light" onClick={() => update.mutate({ id: r.id, status: 'rejected' })}>Reject</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {data && <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} />}
    </div>
  );
}
