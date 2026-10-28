import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, MapPin, XCircle } from 'lucide-react';
import { useState } from 'react';
import { PINCODE_REGEX, type ShippingQuote } from '@goldshop/shared';
import { api, errorMessage } from '../../lib/api';
import { readJSON, writeJSON } from '../../lib/storage';
import { inr } from '../../lib/utils';

function etaText(q: ShippingQuote): string {
  if (q.etaMinDays === undefined || q.etaMaxDays === undefined) return '';
  const add = (d: number) => {
    const x = new Date();
    x.setDate(x.getDate() + d);
    return x.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };
  return q.etaMinDays === q.etaMaxDays ? `by ${add(q.etaMaxDays)}` : `between ${add(q.etaMinDays)} and ${add(q.etaMaxDays)}`;
}

export function PincodeCheck() {
  const [pin, setPin] = useState(() => readJSON<string>('gs_pincode', ''));
  const check = useMutation({
    mutationFn: (p: string) => api<ShippingQuote>('/shipping/check', { query: { pincode: p } }),
    onSuccess: (_q, p) => writeJSON('gs_pincode', p),
  });
  const valid = PINCODE_REGEX.test(pin);
  const q = check.data;

  return (
    <div className="border border-line bg-paper p-4">
      <form
        className="flex items-center gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) check.mutate(pin);
        }}
      >
        <MapPin className="size-4 shrink-0 text-gold-deep" aria-hidden />
        <label htmlFor="pdp-pin" className="sr-only">
          Delivery PIN code
        </label>
        <input
          id="pdp-pin"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter PIN code for delivery date"
          className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
        />
        <button type="submit" disabled={!valid || check.isPending} className="text-xs font-semibold uppercase tracking-[0.14em] text-ink underline decoration-gold underline-offset-4 disabled:opacity-40">
          {check.isPending ? 'Checking' : 'Check'}
        </button>
      </form>
      <div aria-live="polite">
        {check.isError && <p className="mt-3 text-xs text-danger">{errorMessage(check.error)}</p>}
        {q &&
          (q.serviceable ? (
            <div className="mt-3 space-y-1 text-xs text-ink-2">
              <p className="flex items-center gap-1.5 font-semibold text-success">
                <CheckCircle2 className="size-3.5" /> Delivers to {q.city ? `${q.city}, ` : ''}
                {q.pincode} {etaText(q)}
              </p>
              <p className="text-muted">
                {q.amount === 0 ? 'Free delivery' : `Delivery ${inr(q.amount)}`}
                {q.amount > 0 && q.freeAbove ? ` · free above ${inr(q.freeAbove)}` : ''}
                {q.codAvailable ? ' · Cash on delivery available' : ''}
              </p>
            </div>
          ) : (
            <p className="mt-3 flex items-start gap-1.5 text-xs font-medium text-danger">
              <XCircle className="mt-px size-3.5 shrink-0" /> {q.message}
            </p>
          ))}
      </div>
    </div>
  );
}
