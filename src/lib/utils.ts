import { PURITIES, formatINR, type PurityKey } from '@goldshop/shared';

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export const inr = (paise: number) => formatINR(paise);

export function purityLabel(p?: PurityKey | null): string {
  return p ? PURITIES[p].label : '';
}

export function formatGrams(mg?: number | null): string {
  if (!mg) return '';
  const g = mg / 1000;
  return `${g.toLocaleString('en-IN', { maximumFractionDigits: 3 })} g`;
}

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});

export const formatDate = (iso?: string | Date | null) => (iso ? dateFmt.format(new Date(iso)) : '');
export const formatDateTime = (iso?: string | Date | null) => (iso ? dateTimeFmt.format(new Date(iso)) : '');

/** "Today's" only when the rate really was updated today (IST); otherwise say when. */
export function rateFreshness(iso?: string): { today: boolean; label: string } {
  if (!iso) return { today: false, label: 'Rate not yet published' };
  const d = new Date(iso);
  const key = (x: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(x);
  const today = key(d) === key(new Date());
  return { today, label: today ? `Updated ${new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(d)}` : `Updated ${formatDateTime(d)}` };
}

/** Indian-English amount in words for invoices, e.g. "One Lakh Twenty Three Thousand Rupees Only". */
export function amountInWords(paise: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (n: number) => (n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ''}`);
  const three = (n: number) => {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return [h ? `${ones[h]} Hundred` : '', r ? two(r) : ''].filter(Boolean).join(' ');
  };
  const words = (n: number): string => {
    if (n === 0) return 'Zero';
    const parts: string[] = [];
    const crore = Math.floor(n / 10_000_000);
    const lakh = Math.floor((n % 10_000_000) / 100_000);
    const thousand = Math.floor((n % 100_000) / 1000);
    const rest = n % 1000;
    if (crore) parts.push(`${words(crore)} Crore`);
    if (lakh) parts.push(`${two(lakh)} Lakh`);
    if (thousand) parts.push(`${two(thousand)} Thousand`);
    if (rest) parts.push(three(rest));
    return parts.join(' ');
  };
  const rupees = Math.floor(paise / 100);
  const p = paise % 100;
  return `${words(rupees)} Rupees${p ? ` and ${two(p)} Paise` : ''} Only`;
}

export function pluralize(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Only allow internal redirects after sign-in (never to another site). */
export function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/account';
}
