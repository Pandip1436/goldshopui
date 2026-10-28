/*
 * Calendar-day helpers for the admin's date pickers. Dates travel as "YYYY-MM-DD" strings (IST
 * calendar days) and all arithmetic is done on UTC dates, so no time zone can shift a day.
 */

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const parts = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return { y: y!, m: m! - 1, d: d! };
};
/** Builds a day from year, month and day, carrying any overflow (day 0, month 12…) over correctly. */
export const makeDay = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
export const isDay = (s?: string | null): s is string => Boolean(s && /^\d{4}-\d{2}-\d{2}$/.test(s));

export const todayIST = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
export const addDays = (s: string, n: number) => {
  const { y, m, d } = parts(s);
  return makeDay(y, m, d + n);
};
export function addMonths(s: string, n: number) {
  const { y, m, d } = parts(s);
  const last = new Date(Date.UTC(y, m + n + 1, 0)).getUTCDate();
  return makeDay(y, m + n, Math.min(d, last));
}
export const weekday = (s: string) => new Date(`${s}T00:00:00Z`).getUTCDay();

export function formatDay(s: string, withYear = true) {
  const { y, m, d } = parts(s);
  return `${d} ${MONTHS_SHORT[m]}${withYear ? ` ${y}` : ''}`;
}
export function formatRange(from: string, to: string) {
  if (from === to) return formatDay(from);
  return parts(from).y === parts(to).y ? `${formatDay(from, false)} – ${formatDay(to)}` : `${formatDay(from)} – ${formatDay(to)}`;
}
export const longLabel = (s: string) => {
  const { y, m, d } = parts(s);
  return `${WEEKDAYS[weekday(s)]}, ${d} ${MONTHS[m]} ${y}`;
};

/* ------------------------------------------------------------------ presets */

export interface RangePreset {
  key: string;
  label: string;
  range: () => { from: string; to: string };
}

const ALL_PRESETS = {
  today: { label: 'Today', range: () => ({ from: todayIST(), to: todayIST() }) },
  yesterday: { label: 'Yesterday', range: () => ({ from: addDays(todayIST(), -1), to: addDays(todayIST(), -1) }) },
  last7: { label: 'Last 7 days', range: () => ({ from: addDays(todayIST(), -6), to: todayIST() }) },
  last30: { label: 'Last 30 days', range: () => ({ from: addDays(todayIST(), -29), to: todayIST() }) },
  last90: { label: 'Last 90 days', range: () => ({ from: addDays(todayIST(), -89), to: todayIST() }) },
  thisMonth: {
    label: 'This month',
    range: () => {
      const { y, m } = parts(todayIST());
      return { from: makeDay(y, m, 1), to: todayIST() };
    },
  },
  lastMonth: {
    label: 'Last month',
    range: () => {
      const { y, m } = parts(todayIST());
      return { from: makeDay(y, m - 1, 1), to: makeDay(y, m, 0) };
    },
  },
  last12: { label: 'Last 12 months', range: () => ({ from: addDays(todayIST(), -364), to: todayIST() }) },
} satisfies Record<string, Omit<RangePreset, 'key'>>;

export const presets = (...keys: (keyof typeof ALL_PRESETS)[]): RangePreset[] => keys.map((key) => ({ key, ...ALL_PRESETS[key] }));
