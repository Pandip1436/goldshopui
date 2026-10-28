import { useQuery } from '@tanstack/react-query';
import type { OrderDTO } from '@goldshop/shared';
import { api } from './api';

export function useOrder(orderNumber: string | undefined, token: string | undefined, poll = false) {
  return useQuery({
    queryKey: ['order', orderNumber, token],
    queryFn: () => api<OrderDTO>(`/orders/${orderNumber}`, { query: { token } }),
    enabled: Boolean(orderNumber),
    retry: false,
    // While a payment is being confirmed, check back a few times (not indefinitely).
    refetchInterval: (q) => (poll && q.state.data?.status === 'pending_payment' && q.state.dataUpdateCount < 6 ? 4000 : false),
  });
}
