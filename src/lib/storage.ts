/**
 * Browser storage for per-visitor conveniences only (recently viewed, signed-out wishlist,
 * guest order links). Storage can be unavailable (private mode, blocked cookies), so every access
 * is guarded and the app works without it.
 */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

const ORDERS_KEY = 'gs_guest_orders';

export interface GuestOrderLink {
  orderNumber: string;
  token: string;
  at: number;
}

/** Remembers the private link to a guest's order so they can reopen it from this browser. */
export function rememberGuestOrder(orderNumber: string, token: string): void {
  const list = readJSON<GuestOrderLink[]>(ORDERS_KEY, []).filter((o) => o.orderNumber !== orderNumber);
  list.unshift({ orderNumber, token, at: Date.now() });
  writeJSON(ORDERS_KEY, list.slice(0, 10));
}

export function guestOrderToken(orderNumber: string): string | undefined {
  return readJSON<GuestOrderLink[]>(ORDERS_KEY, []).find((o) => o.orderNumber === orderNumber)?.token;
}

export function guestOrders(): GuestOrderLink[] {
  return readJSON<GuestOrderLink[]>(ORDERS_KEY, []);
}
