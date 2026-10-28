import { useSyncExternalStore } from 'react';
import { readJSON, writeJSON } from './storage';

/**
 * A tiny localStorage-backed list of ids that stays in sync across components (and tabs).
 * Used for the signed-out wishlist and recently viewed pieces.
 */
export function createIdStore(key: string, max: number) {
  const listeners = new Set<() => void>();
  let cache: string[] = readJSON<string[]>(key, []);

  const emit = () => listeners.forEach((l) => l());
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === key) {
        cache = readJSON<string[]>(key, []);
        emit();
      }
    });
  }

  const set = (next: string[]) => {
    cache = next.slice(0, max);
    writeJSON(key, cache);
    emit();
  };

  return {
    get: () => cache,
    set,
    add(id: string) {
      set([id, ...cache.filter((x) => x !== id)]);
    },
    remove(id: string) {
      set(cache.filter((x) => x !== id));
    },
    clear() {
      set([]);
    },
    useIds(): string[] {
      return useSyncExternalStore(
        (cb) => {
          listeners.add(cb);
          return () => listeners.delete(cb);
        },
        () => cache,
        () => cache,
      );
    },
  };
}

export const localWishlist = createIdStore('gs_wishlist', 100);
export const recentlyViewed = createIdStore('gs_recent', 12);
