import { useMe } from '../../lib/hooks';
import { formatDate, inr } from '../../lib/utils';
import { can, toDateInput } from '../lib';
import { ResourceManager } from '../ResourceManager';
import { Alert, Badge } from '../ui';

type Row = Record<string, unknown> & { id: string };

export default function Marketing() {
  const { user } = useMe();
  return (
    <ResourceManager
      resource="coupons"
      title="Coupons"
      singular="Coupon"
      description="Codes customers enter in their bag. Usage is counted only when an order is confirmed."
      canWrite={can(user?.role, 'coupons:write')}
      notice={<Alert className="mb-4">Only advertise offers you genuinely honour. “Making charge” coupons discount only the making charges in the bag — common for gold, where the metal itself is priced at cost.</Alert>}
      columns={[
        { key: 'c', header: 'Code', cell: (r) => <span className="rounded-md border border-dashed border-gold-soft bg-cream-2 px-2 py-1 font-semibold tracking-wider text-wine">{String(r.code)}</span> },
        {
          key: 'v',
          header: 'Discount',
          cell: (r) => (
            <span>
              {r.type === 'percent' ? `${r.value}%` : inr(Number(r.value))} off {r.scope === 'making' ? 'making charges' : 'order'}
              {Number(r.maxDiscount) > 0 && <span className="block text-xs text-muted">max {inr(Number(r.maxDiscount))}</span>}
            </span>
          ),
        },
        { key: 'm', header: 'Min. order', cell: (r) => (Number(r.minSubtotal) ? inr(Number(r.minSubtotal)) : '—') },
        { key: 'u', header: 'Used', cell: (r) => `${r.usedCount}${Number(r.usageLimit) ? ` / ${r.usageLimit}` : ''}` },
        { key: 'd', header: 'Valid', cell: (r) => <span className="text-xs text-muted">{r.startsAt ? formatDate(String(r.startsAt)) : 'Now'} – {r.endsAt ? formatDate(String(r.endsAt)) : 'no end'}</span> },
        { key: 'a', header: 'Status', cell: (r) => (r.isActive ? <Badge tone="success">Active</Badge> : <Badge>Off</Badge>) },
      ]}
      defaults={{ code: '', description: '', type: 'percent', percent: 10, flat: 0, scope: 'order', maxDiscount: 0, minSubtotal: 0, startsAt: '', endsAt: '', usageLimit: 0, perCustomerLimit: 1, firstOrderOnly: false, isActive: true }}
      toForm={(r: Row) => ({
        ...r,
        percent: r.type === 'percent' ? r.value : 10,
        flat: r.type === 'flat' ? r.value : 0,
        startsAt: toDateInput(r.startsAt as string),
        endsAt: toDateInput(r.endsAt as string),
      })}
      toPayload={(v) => ({
        code: v.code,
        description: v.description,
        type: v.type,
        value: v.type === 'percent' ? Number(v.percent) : Number(v.flat),
        scope: v.scope,
        maxDiscount: Number(v.maxDiscount || 0),
        minSubtotal: Number(v.minSubtotal || 0),
        startsAt: v.startsAt || null,
        endsAt: v.endsAt || null,
        usageLimit: Number(v.usageLimit || 0),
        perCustomerLimit: Number(v.perCustomerLimit || 0),
        firstOrderOnly: Boolean(v.firstOrderOnly),
        isActive: Boolean(v.isActive),
      })}
      fields={[
        { name: 'code', label: 'Code', type: 'text', span: 1, placeholder: 'FESTIVE10' },
        { name: 'description', label: 'Shown to customers', type: 'text', span: 1, placeholder: '10% off making charges' },
        { name: 'type', label: 'Type', type: 'select', span: 1, options: [{ value: 'percent', label: 'Percentage' }, { value: 'flat', label: 'Fixed amount' }] },
        { name: 'scope', label: 'Applies to', type: 'select', span: 1, options: [{ value: 'order', label: 'Whole order' }, { value: 'making', label: 'Making charges only' }] },
        { name: 'percent', label: 'Percent off (if percentage)', type: 'number', span: 1 },
        { name: 'flat', label: 'Amount off (if fixed)', type: 'money', span: 1 },
        { name: 'maxDiscount', label: 'Maximum discount', type: 'money', span: 1, hint: '0 = no cap' },
        { name: 'minSubtotal', label: 'Minimum order value', type: 'money', span: 1 },
        { name: 'startsAt', label: 'Starts', type: 'date', span: 1 },
        { name: 'endsAt', label: 'Ends', type: 'date', span: 1 },
        { name: 'usageLimit', label: 'Total uses allowed', type: 'number', span: 1, hint: '0 = unlimited' },
        { name: 'perCustomerLimit', label: 'Uses per customer', type: 'number', span: 1, hint: '0 = unlimited' },
        { name: 'firstOrderOnly', label: 'First order only', type: 'switch', span: 1 },
        { name: 'isActive', label: 'Active', type: 'switch', span: 1 },
      ]}
    />
  );
}

