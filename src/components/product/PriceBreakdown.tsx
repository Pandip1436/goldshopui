import type { ReactNode } from 'react';
import { PURITIES, type PriceBreakdown as PB } from '@goldshop/shared';
import { useSettings } from '../../lib/hooks';
import { formatGrams, inr } from '../../lib/utils';

export function PriceBreakdownTable({ price, making }: { price: PB; making?: { type: string; value: number } }) {
  const { data: settings } = useSettings();
  const gstLabel = `GST (${((settings?.gstRateBps ?? 300) / 100).toLocaleString('en-IN')}%)`;
  if (price.mode === 'fixed') {
    return (
      <table className="w-full text-sm">
        <tbody className="divide-y divide-line">
          <Row label="Value before GST" value={inr(price.taxable)} />
          <Row label={gstLabel} value={inr(price.gst)} />
          <Row label="Total" value={inr(price.total)} strong />
        </tbody>
      </table>
    );
  }
  const makingLabel =
    making?.type === 'percent'
      ? `Making charges (${making.value}% of gold value)`
      : making?.type === 'per_gram'
        ? `Making charges (${inr(making.value)}/g)`
        : 'Making charges';
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">How this price is calculated</caption>
      <tbody className="divide-y divide-line">
        <Row
          label={
            <>
              Gold value
              <span className="block text-xs text-muted">
                {formatGrams(price.netWeightMg)} × {price.ratePerGram ? inr(price.ratePerGram) : '—'}/g ({price.purity ? PURITIES[price.purity].label : ''})
              </span>
            </>
          }
          value={inr(price.metalValue)}
        />
        <Row label={makingLabel} value={inr(price.making)} />
        {price.makingDiscount > 0 && <Row label="Making charge discount" value={`− ${inr(price.makingDiscount)}`} accent />}
        {price.stone > 0 && <Row label="Stones & other materials" value={inr(price.stone)} />}
        <Row label="Value before GST" value={inr(price.taxable)} />
        <Row label={gstLabel} value={inr(price.gst)} />
        <Row label="Total" value={inr(price.total)} strong />
      </tbody>
    </table>
  );
}

function Row({ label, value, strong, accent }: { label: ReactNode; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <tr>
      <th scope="row" className={`py-2.5 pr-4 text-left align-top font-normal ${strong ? 'font-semibold text-ink' : 'text-ink-2'}`}>
        {label}
      </th>
      <td className={`py-2.5 text-right align-top tabular ${strong ? 'text-base font-semibold text-ink' : accent ? 'text-success' : 'text-ink-2'}`}>{value}</td>
    </tr>
  );
}
