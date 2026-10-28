import { useCallback, useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  CartDTO,
  CategoryNode,
  CollectionDTO,
  GoldRatesDTO,
  HomeDTO,
  ProductCardDTO,
  ProductDetailDTO,
  ProductListResponse,
  PublicSettings,
  SessionUser,
} from '@goldshop/shared';
import { api, errorMessage } from './api';
import { localWishlist } from './localStore';
import { useUI } from './ui';

export const qk = {
  settings: ['settings'] as const,
  me: ['me'] as const,
  cart: ['cart'] as const,
  home: ['home'] as const,
  categories: ['categories'] as const,
  collections: ['collections'] as const,
  wishlist: ['wishlist'] as const,
  goldRates: ['gold-rates'] as const,
  product: (slug: string) => ['product', slug] as const,
  products: (params: Record<string, unknown>) => ['products', params] as const,
};

export function useSettings() {
  return useQuery({ queryKey: qk.settings, queryFn: () => api<PublicSettings>('/settings'), staleTime: 60_000 });
}

/** `live` re-checks every minute, so a rate the store updates appears without a reload. */
export function useGoldRates(opts: { live?: boolean } = {}) {
  return useQuery({ queryKey: qk.goldRates, queryFn: () => api<GoldRatesDTO>('/gold-rates'), staleTime: 60_000, refetchInterval: opts.live ? 60_000 : false });
}

export function useMe() {
  const q = useQuery({
    queryKey: qk.me,
    queryFn: () => api<{ user: SessionUser | null }>('/auth/me'),
    staleTime: 5 * 60_000,
  });
  return { user: q.data?.user ?? null, isLoading: q.isLoading };
}

export function useHome() {
  return useQuery({ queryKey: qk.home, queryFn: () => api<HomeDTO>('/home'), staleTime: 60_000 });
}

export function useCategories() {
  return useQuery({ queryKey: qk.categories, queryFn: () => api<CategoryNode[]>('/categories'), staleTime: 5 * 60_000 });
}

export function useCollections() {
  return useQuery({ queryKey: qk.collections, queryFn: () => api<CollectionDTO[]>('/collections'), staleTime: 5 * 60_000 });
}

export function useProducts(params: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: qk.products(params),
    queryFn: ({ signal }) => api<ProductListResponse>('/products', { query: params, signal }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: qk.product(slug ?? ''),
    queryFn: () => api<ProductDetailDTO>(`/products/${slug}`),
    enabled: Boolean(slug),
    staleTime: 30_000,
    retry: (count, err) => (err as { status?: number }).status !== 404 && count < 2,
  });
}

export function useProductsByIds(ids: string[]) {
  return useQuery({
    queryKey: ['products-by-ids', ids],
    queryFn: () => api<ProductCardDTO[]>('/products-by-ids', { query: { ids: ids.join(',') } }),
    enabled: ids.length > 0,
    staleTime: 60_000,
  });
}

/* ------------------------------------------------------------------ cart */

export function useCart() {
  return useQuery({ queryKey: qk.cart, queryFn: () => api<CartDTO>('/cart'), staleTime: 20_000 });
}

export function useCartActions() {
  const qc = useQueryClient();
  const { openCart } = useUI();
  const put = (cart: CartDTO) => {
    qc.setQueryData(qk.cart, cart);
    // Checkout keeps its own destination-specific quote; refresh it too.
    qc.invalidateQueries({ queryKey: [...qk.cart, 'quote'] });
  };

  const add = useMutation({
    mutationFn: (v: { productId: string; variantId: string; qty: number; silent?: boolean }) =>
      api<{ cart: CartDTO; message?: string }>('/cart/items', { body: { productId: v.productId, variantId: v.variantId, qty: v.qty } }),
    onSuccess: (res, v) => {
      put(res.cart);
      if (res.message) toast.message(res.message);
      if (!v.silent) openCart();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const setQty = useMutation({
    mutationFn: (v: { lineId: string; qty: number }) => api<{ cart: CartDTO }>(`/cart/items/${v.lineId}`, { method: 'PATCH', body: { qty: v.qty } }),
    onSuccess: (res) => put(res.cart),
    onError: (err) => {
      toast.error(errorMessage(err));
      qc.invalidateQueries({ queryKey: qk.cart });
    },
  });
  const remove = useMutation({
    mutationFn: (lineId: string) => api<{ cart: CartDTO }>(`/cart/items/${lineId}`, { method: 'DELETE' }),
    onSuccess: (res) => put(res.cart),
    onError: (err) => toast.error(errorMessage(err)),
  });
  const applyCoupon = useMutation({
    mutationFn: (code: string) => api<{ cart: CartDTO }>('/cart/coupon', { body: { code } }),
    onSuccess: (res) => put(res.cart),
  });
  const removeCoupon = useMutation({
    mutationFn: () => api<{ cart: CartDTO }>('/cart/coupon', { method: 'DELETE' }),
    onSuccess: (res) => put(res.cart),
  });
  return { add, setQty, remove, applyCoupon, removeCoupon };
}

/* -------------------------------------------------------------- wishlist */

export function useWishlist() {
  const { user } = useMe();
  const qc = useQueryClient();
  const localIds = localWishlist.useIds();
  const server = useQuery({
    queryKey: qk.wishlist,
    queryFn: () => api<ProductCardDTO[]>('/account/wishlist'),
    enabled: Boolean(user),
    staleTime: 60_000,
  });
  const ids = user ? (server.data ?? []).map((p) => p.id) : localIds;

  const toggle = useCallback(
    async (id: string, name?: string) => {
      const has = ids.includes(id);
      if (!user) {
        if (has) localWishlist.remove(id);
        else localWishlist.add(id);
      } else {
        try {
          if (has) await api(`/account/wishlist/${id}`, { method: 'DELETE' });
          else await api('/account/wishlist', { body: { productId: id } });
          await qc.invalidateQueries({ queryKey: qk.wishlist });
        } catch (err) {
          toast.error(errorMessage(err));
          return;
        }
      }
      toast.success(has ? 'Removed from your wishlist' : `${name ?? 'Piece'} saved to your wishlist`);
    },
    [ids, user, qc],
  );

  return { ids, has: (id: string) => ids.includes(id), toggle, serverItems: server.data, isLoading: user ? server.isLoading : false };
}

/** After signing in: move the signed-out wishlist into the account and refresh session-bound data. */
export function useAfterSignIn() {
  const qc = useQueryClient();
  return useCallback(async () => {
    const ids = localWishlist.get();
    if (ids.length) {
      await api('/account/wishlist/merge', { body: { ids } }).catch(() => undefined);
      localWishlist.clear();
    }
    await Promise.all([
      qc.invalidateQueries({ queryKey: qk.me }),
      qc.invalidateQueries({ queryKey: qk.cart }),
      qc.invalidateQueries({ queryKey: qk.wishlist }),
    ]);
  }, [qc]);
}

/* ---------------------------------------------------------------- misc */

export function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatch(m.matches);
    m.addEventListener('change', on);
    on();
    return () => m.removeEventListener('change', on);
  }, [query]);
  return match;
}
