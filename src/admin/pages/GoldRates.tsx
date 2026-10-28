import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { History, Scale } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PURITIES, PURITY_KEYS, type PurityKey } from '@goldshop/shared';
import { ApiError, api, errorMessage } from '../../lib/api';
import { qk } from '../../lib/hooks';
import { formatDateTime, inr } from '../../lib/utils';
import { Alert, Button, Card, DataTable, FormError, PageHeader } from '../ui';

interface SettingsResp {
  goldRates: Partial<Record<PurityKey, number>> & { updatedAt?: string; updatedBy?: string };
}
interface Log {
  _id: string;
  rates: Partial<Record<PurityKey, number>>;
  byName?: string;
  productsRepriced?: number;
  createdAt: string;
}

export default function GoldRates() {
  const qc = useQueryClient();
  const { data: s } = useQuery({ queryKey: ['admin', 'settings'], queryFn: () => api<SettingsResp>('/admin/settings') });
  const { data: history } = useQuery({ queryKey: ['admin', 'rate-history'], queryFn: () => api<{ items: Log[] }>('/admin/gold-rates/history') });
  const [values, setValues] = useState<Record<string, string>>({});
  const [confirmLarge, setConfirmLarge] = useState(false);
  useEffect(() => {
    if (s) setValues(Object.fromEntries(PURITY_KEYS.map((k) => [k, s.goldRates[k] ? String(s.goldRates[k]! / 100) : ''])));
  }, [s]);

  const save = useMutation({
    mutationFn: () =>
      api<{ productsRepriced: number }>('/admin/gold-rates', {
        method: 'PUT',
        body: {
          rates: Object.fromEntries(PURITY_KEYS.filter((k) => values[k] !== '').map((k) => [k, Math.round(Number(values[k]) * 100)])),
          confirmLargeChange: confirmLarge,
        },
      }),
    onSuccess: (r) => {
      toast.success(`Rates saved. ${r.productsRepriced} products re-priced.`);
      setConfirmLarge(false);
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: qk.settings });
      qc.invalidateQueries({ queryKey: qk.goldRates });
    },
  });
  const needsConfirm = save.error instanceof ApiError && save.error.code === 'confirm_large_change';

  return (
    <div className="space-y-6">
      <PageHeader title="Gold rates" description="Per-gram rates used to price every weight-based piece. Saving re-prices the catalogue immediately; shoppers see the new price on their next page view." />
      <Card icon={Scale} title="Today’s rates (per gram)">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          {s?.goldRates.updatedAt && <p className="text-sm text-muted">Last updated {formatDateTime(s.goldRates.updatedAt)}{s.goldRates.updatedBy ? ` by ${s.goldRates.updatedBy}` : ''}.</p>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PURITY_KEYS.map((k) => {
              const v = Number(values[k] || 0);
              return (
                <label key={k} className="block rounded-xl border border-hairline bg-cream-2 p-4">
                  <span className="text-sm font-semibold text-ink">{PURITIES[k].name}</span>
                  <span className="mt-2 flex items-center gap-2">
                    <span className="text-muted">₹</span>
                    <input
                      inputMode="decimal"
                      value={values[k] ?? ''}
                      onChange={(e) => setValues((x) => ({ ...x, [k]: e.target.value.replace(/[^0-9.]/g, '') }))}
                      className="h-11 w-full rounded-lg border border-field bg-white px-3 text-lg font-semibold text-ink tabular focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                      placeholder="Not sold"
                      aria-label={`${PURITIES[k].name} rate per gram`}
                    />
                    <span className="text-xs text-muted">/g</span>
                  </span>
                  <span className="mt-1.5 block text-xs text-muted">{v ? `${inr(Math.round(v * 800))} per 8 g · ${inr(Math.round(v * 1000))} per 10 g` : 'Leave blank if you don’t sell this purity'}</span>
                </label>
              );
            })}
          </div>
          {needsConfirm && (
            <Alert tone="warn">
              {save.error?.message}
              <label className="mt-2 flex items-center gap-2 font-semibold">
                <input type="checkbox" checked={confirmLarge} onChange={(e) => setConfirmLarge(e.target.checked)} className="accent-ink" /> Yes, these per-gram figures are correct
              </label>
            </Alert>
          )}
          <FormError>{save.isError && !needsConfirm ? errorMessage(save.error) : null}</FormError>
          <Button type="submit" loading={save.isPending}>Save rates & re-price</Button>
        </form>
      </Card>
      <Card icon={History} title="History" padded={false}>
        <div className="px-5 pb-4">
        <DataTable
          bare
          rows={history?.items}
          rowKey={(r) => r._id}
          empty="No changes yet."
          columns={[
            { key: 'd', header: 'When', cell: (r) => <span className="whitespace-nowrap text-muted">{formatDateTime(r.createdAt)}</span> },
            ...(['gold24', 'gold22', 'gold18'] as PurityKey[]).map((k) => ({ key: k, header: PURITIES[k].label, cell: (r: Log) => <span className="font-medium text-ink tabular">{r.rates?.[k] ? inr(r.rates[k]!) : '—'}</span> })),
            { key: 'b', header: 'By', cell: (r) => r.byName ?? '—' },
            { key: 'n', header: 'Re-priced', cell: (r) => r.productsRepriced ?? '—' },
          ]}
        />
        </div>
      </Card>
    </div>
  );
}
