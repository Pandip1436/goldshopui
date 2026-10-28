import type { Role } from '@goldshop/shared';

/**
 * Mirror of the server's permission map, used only to hide navigation and buttons a role can't use.
 * The server enforces every one of these independently.
 */
export const PERMISSIONS = {
  'dashboard:read': ['admin', 'staff'],
  'catalog:write': ['admin', 'staff'],
  'inventory:write': ['admin', 'staff'],
  'orders:read': ['admin', 'staff'],
  'orders:write': ['admin', 'staff'],
  'orders:refund': ['admin'],
  'customers:read': ['admin', 'staff'],
  'coupons:write': ['admin'],
  'content:write': ['admin', 'staff'],
  'reviews:write': ['admin', 'staff'],
  'enquiries:write': ['admin', 'staff'],
  'reports:read': ['admin'],
  'rates:write': ['admin', 'staff'],
  'settings:write': ['admin'],
  'staff:write': ['admin'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | undefined, p: Permission): boolean {
  return Boolean(role && (PERMISSIONS[p] as readonly Role[]).includes(role));
}

export const rupees = (paise: number | undefined | null) => (paise ? paise / 100 : 0);
export const paise = (rupeesValue: number | string | undefined | null) => Math.round(Number(rupeesValue || 0) * 100);
export const grams = (mg: number | undefined | null) => (mg ? mg / 1000 : 0);
export const mg = (g: number | string | undefined | null) => Math.round(Number(g || 0) * 1000);

export function compactINR(paiseValue: number): string {
  const r = paiseValue / 100;
  if (r >= 1e7) return `₹${(r / 1e7).toFixed(r >= 1e8 ? 0 : 1)}Cr`;
  if (r >= 1e5) return `₹${(r / 1e5).toFixed(r >= 1e6 ? 0 : 1)}L`;
  if (r >= 1e3) return `₹${(r / 1e3).toFixed(r >= 1e4 ? 0 : 1)}K`;
  return `₹${Math.round(r)}`;
}

export function toDateInput(d?: string | Date | null): string {
  if (!d) return '';
  const x = new Date(d);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(x);
}
