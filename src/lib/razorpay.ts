import type { RazorpayCheckoutPayload } from '@goldshop/shared';

interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: 'payment.failed', cb: (resp: { error?: { description?: string } }) => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let loading: Promise<void> | null = null;

/** Loads Razorpay Checkout on demand, so its script is only fetched when someone pays. */
export function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        loading = null;
        reject(new Error('Could not load the payment window. Check your connection and try again.'));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

/**
 * Opens Razorpay Checkout. Resolves with the signed payment ids on success, or null if the shopper
 * closes the window. The server verifies the signature and confirms with Razorpay before anything
 * is marked paid.
 */
export async function openRazorpay(
  payload: RazorpayCheckoutPayload,
  hooks: { onFailed?: (message: string) => void } = {},
): Promise<RazorpaySuccess | null> {
  await loadRazorpay();
  return new Promise((resolve) => {
    const rzp = new window.Razorpay!({
      key: payload.keyId,
      amount: payload.amount,
      currency: payload.currency,
      name: payload.name,
      description: payload.description,
      order_id: payload.razorpayOrderId,
      prefill: payload.prefill,
      theme: { color: '#1e1813' },
      handler: (resp: RazorpaySuccess) => resolve(resp),
      modal: { ondismiss: () => resolve(null), confirm_close: true },
    });
    rzp.on('payment.failed', (resp) => hooks.onFailed?.(resp.error?.description ?? 'The payment did not go through.'));
    rzp.open();
  });
}
