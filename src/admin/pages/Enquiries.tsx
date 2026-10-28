import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Mail, Phone } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ENQUIRY_TOPIC_LABELS, ENQUIRY_TYPE_LABELS, formatIndianMobile, whatsappLink, type EnquiryTopic, type EnquiryType } from '@goldshop/shared';
import { WhatsAppIcon } from '../../components/WhatsAppIcon';
import { api, errorMessage } from '../../lib/api';
import { useMe } from '../../lib/hooks';
import { formatDateTime, inr } from '../../lib/utils';
import { can } from '../lib';
import { AdminSelect, Badge, ButtonAnchor, FilterTabs, PageHeader, Pager, Textarea, cardClass } from '../ui';

interface Row {
  id: string;
  type: EnquiryType;
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  preferredContact?: string;
  topic?: EnquiryTopic;
  monthlyAmount?: number;
  status: 'new' | 'contacted' | 'closed';
  notes?: string;
  product?: { name: string; slug: string };
  createdAt: string;
}

const contactLink = 'inline-flex h-8 min-w-0 max-w-full items-center gap-1.5 truncate rounded-lg border border-field px-2.5 text-ink-2 transition-colors hover:border-gold hover:text-wine';

export default function Enquiries() {
  const qc = useQueryClient();
  const { user } = useMe();
  const [type, setType] = useState('');
  const [status, setStatus] = useState('new');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'enquiries', type, status, page],
    queryFn: () => api<{ items: Row[]; page: number; pages: number; total: number; newCount: number }>('/admin/enquiries', { query: { type, status, page } }),
    placeholderData: keepPreviousData,
  });
  const update = useMutation({
    mutationFn: (v: { id: string; status?: Row['status']; notes?: string }) => api(`/admin/enquiries/${v.id}`, { method: 'PATCH', body: { status: v.status, notes: v.notes } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'enquiries'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div>
      <PageHeader
        title="Enquiries"
        description="Messages, savings-plan requests and product enquiries from the website."
        actions={
          can(user?.role, 'settings:write') && (
            <ButtonAnchor href="/api/admin/subscribers.csv" variant="secondary" icon={<Download className="size-4" aria-hidden />}>
              Newsletter subscribers
            </ButtonAnchor>
          )
        }
      />
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <FilterTabs className="!mb-0" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: 'new', label: 'New', count: data?.newCount }, { value: 'contacted', label: 'Contacted' }, { value: 'closed', label: 'Closed' }, { value: '', label: 'All' }]} />
        <AdminSelect
          className="w-full sm:w-52"
          value={type}
          onChange={(v) => { setType(v); setPage(1); }}
          aria-label="Enquiry type"
          options={[{ value: '', label: 'All types' }, ...(['contact', 'savings_plan', 'product', 'custom_order'] as EnquiryType[]).map((t) => ({ value: t, label: ENQUIRY_TYPE_LABELS[t] }))]}
        />
      </div>
      {isLoading ? null : !data?.items.length ? (
        <p className={`${cardClass} py-12 text-center text-sm text-muted`}>No enquiries here.</p>
      ) : (
        <ul className="space-y-3">
          {data.items.map((e) => (
            <li key={e.id} className={`${cardClass} p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">{e.name} <Badge tone={e.type === 'savings_plan' ? 'gold' : 'neutral'}>{ENQUIRY_TYPE_LABELS[e.type]}</Badge></p>
                  <p className="mt-0.5 text-xs text-muted">{formatDateTime(e.createdAt)}{e.topic ? ` · ${ENQUIRY_TOPIC_LABELS[e.topic]}` : ''}{e.preferredContact ? ` · prefers ${e.preferredContact}` : ''}{e.monthlyAmount ? ` · ~${inr(e.monthlyAmount)}/month` : ''}</p>
                </div>
                <AdminSelect
                  className="w-36"
                  value={e.status}
                  onChange={(v) => update.mutate({ id: e.id, status: v as Row['status'] })}
                  aria-label={`Status of the enquiry from ${e.name}`}
                  options={[
                    { value: 'new', label: 'New' },
                    { value: 'contacted', label: 'Contacted' },
                    { value: 'closed', label: 'Closed' },
                  ]}
                />
              </div>
              {e.product && <p className="mt-2 text-xs text-muted">About: <a href={`/product/${e.product.slug}`} target="_blank" rel="noreferrer" className="font-semibold text-wine underline underline-offset-2">{e.product.name}</a></p>}
              {e.message && <p className="mt-3 whitespace-pre-line text-sm text-ink-2">{e.message}</p>}
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                {e.phone && <a href={`tel:+91${e.phone}`} className={contactLink}><Phone className="size-3.5" />{formatIndianMobile(e.phone)}</a>}
                {e.phone && <a href={whatsappLink(e.phone, `Hello ${e.name}, thank you for your enquiry.`)} target="_blank" rel="noreferrer" className={contactLink}><WhatsAppIcon className="size-3.5" />WhatsApp</a>}
                {e.email && <a href={`mailto:${e.email}`} className={contactLink}><Mail className="size-3.5" />{e.email}</a>}
              </div>
              <Textarea
                defaultValue={e.notes}
                onBlur={(ev) => ev.target.value !== (e.notes ?? '') && update.mutate({ id: e.id, notes: ev.target.value })}
                placeholder="Internal notes (saved when you click away)"
                rows={2}
                className="mt-3 !text-[0.8125rem]"
                aria-label="Internal notes"
              />
            </li>
          ))}
        </ul>
      )}
      {data && <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} />}
    </div>
  );
}
