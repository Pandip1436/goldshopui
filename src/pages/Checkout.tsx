import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ChevronDown, ChevronRight, CircleAlert, CreditCard, Lock, LockKeyhole, Mail, MapPin, Phone, Plus, ShieldCheck, Truck, UserRound, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useForm, useWatch, type Path } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  INDIAN_STATES,
  PINCODE_REGEX,
  checkoutSchema,
  type CartDTO,
  type CheckoutInput,
  type CheckoutResponse,
  type SavedAddressDTO,
  type ShippingQuote,
} from '@goldshop/shared';
import { Seo } from '../components/Seo';
import { CouponForm, Totals } from '../components/cart/Summary';
import { LotusMark } from '../components/AboutLegacy';
import { ButtonLink } from '../components/ui/Button';
import { Checkbox, Field, FormError, IconInput, Input, Textarea } from '../components/ui/Form';
import { FormDropdown } from '../components/ui/FormDropdown';
import { Alert, EmptyState, Img, Skeleton, Spinner } from '../components/ui/misc';
import { ApiError, api, errorMessage } from '../lib/api';
import { qk, useCart, useDebounced, useMe, useSettings } from '../lib/hooks';
import { openRazorpay } from '../lib/razorpay';
import { rememberGuestOrder } from '../lib/storage';
import { cn, formatGrams, inr, purityLabel } from '../lib/utils';

const STATE_OPTIONS = INDIAN_STATES.map((s) => ({ value: s, label: s }));

export default function Checkout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: settings } = useSettings();
  const { user } = useMe();
  const { data: cart, isLoading } = useCart();
  const [placing, setPlacing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onTouched',
    defaultValues: {
      customer: { name: '', email: '', phone: '' },
      address: { fullName: '', phone: '', line1: '', line2: '', landmark: '', city: '', state: undefined as never, pincode: '' },
      paymentMethod: undefined as never,
      notes: '',
      gstin: '',
      saveAddress: true,
      marketingConsent: false,
    },
  });
  const { register, setValue, getValues, formState } = form;
  const errors = formState.errors;
  const [pincode, state, paymentMethod, email] = useWatch({ control: form.control, name: ['address.pincode', 'address.state', 'paymentMethod', 'customer.email'] });

  // Prefill from the signed-in account.
  useEffect(() => {
    if (!user) return;
    const c = getValues('customer');
    if (!c.name) setValue('customer.name', user.name);
    if (!c.email) setValue('customer.email', user.email);
    if (!c.phone && user.phone) setValue('customer.phone', user.phone);
  }, [user, getValues, setValue]);

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api<SavedAddressDTO[]>('/account/addresses'),
    enabled: Boolean(user),
  });
  const [addressId, setAddressId] = useState<string | 'new' | null>(null);
  useEffect(() => {
    if (addressId !== null || !addresses) return;
    const def = addresses.find((a) => a.isDefault) ?? addresses[0];
    if (def) applyAddress(def);
    else setAddressId('new');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses]);
  const applyAddress = (a: SavedAddressDTO) => {
    setAddressId(a.id);
    const opts = { shouldValidate: true };
    setValue('address.fullName', a.fullName, opts);
    setValue('address.phone', a.phone, opts);
    setValue('address.line1', a.line1, opts);
    setValue('address.line2', a.line2 ?? '');
    setValue('address.landmark', a.landmark ?? '');
    setValue('address.city', a.city, opts);
    setValue('address.state', a.state as never, opts);
    setValue('address.pincode', a.pincode, opts);
    setValue('saveAddress', false);
  };

  // PIN code → serviceability (+ city/state autofill when the server has lookup enabled).
  const validPin = PINCODE_REGEX.test(pincode ?? '');
  const { data: pinInfo } = useQuery({
    queryKey: ['pincheck', pincode],
    queryFn: () => api<ShippingQuote>('/shipping/check', { query: { pincode } }),
    enabled: validPin,
    staleTime: 10 * 60_000,
  });
  useEffect(() => {
    if (!pinInfo) return;
    if (pinInfo.city && !getValues('address.city')) setValue('address.city', pinInfo.city, { shouldValidate: true });
    if (pinInfo.state && !getValues('address.state')) setValue('address.state', pinInfo.state as never, { shouldValidate: true });
  }, [pinInfo, getValues, setValue]);

  // Live quote: the server prices the bag for this destination and payment method.
  // Debounce a string key: an object would be a new value every render.
  const quoteParams = JSON.stringify({ pincode: validPin ? pincode : undefined, state: state || undefined, paymentMethod: paymentMethod || undefined, email: email || undefined });
  const debouncedParams = useDebounced(quoteParams, 300);
  const quoteKey = useMemo(() => JSON.parse(debouncedParams) as Record<string, string | undefined>, [debouncedParams]);
  const { data: quote, isFetching: quoting } = useQuery({
    queryKey: [...qk.cart, 'quote', quoteKey],
    queryFn: () => api<CartDTO>('/cart', { query: quoteKey }),
    enabled: Boolean(cart && cart.lines.length),
    placeholderData: (prev) => prev ?? cart,
    staleTime: 0,
  });
  const view = quote ?? cart;

  const codMax = settings?.payments.cod.maxOrderValue;
  const codReason = !settings?.payments.cod.enabled
    ? null
    : view?.shipping && !view.shipping.codAvailable
      ? 'Not available for this PIN code'
      : codMax && view && view.total - view.codFee > codMax
        ? `Available on orders up to ${inr(codMax)}`
        : null;
  const methods = useMemo(() => {
    const list: { key: 'razorpay' | 'cod'; title: string; text: string; icon: typeof CreditCard; disabled?: string | null }[] = [];
    if (settings?.payments.razorpay) list.push({ key: 'razorpay', title: 'Pay online', text: 'UPI, cards, net banking and wallets via Razorpay', icon: CreditCard });
    if (settings?.payments.cod.enabled)
      list.push({
        key: 'cod',
        title: 'Cash on delivery',
        text: settings.payments.cod.fee ? `Pay when it arrives · ${inr(settings.payments.cod.fee)} fee` : 'Pay when it arrives',
        icon: Wallet,
        disabled: codReason,
      });
    return list;
  }, [settings, codReason]);

  useEffect(() => {
    const current = getValues('paymentMethod');
    const ok = methods.find((m) => m.key === current && !m.disabled);
    if (!ok) {
      const first = methods.find((m) => !m.disabled);
      if (first && first.key !== current) setValue('paymentMethod', first.key);
    }
  }, [methods, getValues, setValue]);

  const fillContactIntoAddress = () => {
    const c = getValues('customer');
    if (!getValues('address.fullName') && c.name) setValue('address.fullName', c.name);
    if (!getValues('address.phone') && c.phone) setValue('address.phone', c.phone);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (!view) return;
    setFormError(null);
    setNotice(null);
    setPlacing(true);
    try {
      const res = await api<CheckoutResponse>('/checkout', { body: { ...values, expectedTotal: view.total } });
      rememberGuestOrder(res.orderNumber, res.accessToken);
      const orderUrl = `/orders/${res.orderNumber}?token=${encodeURIComponent(res.accessToken)}`;
      if (res.payment) {
        const result = await openRazorpay(res.payment, { onFailed: (m) => toast.error(m) }).catch((e: Error) => {
          toast.error(e.message);
          return null;
        });
        if (result) {
          try {
            await api('/payments/razorpay/verify', { body: { orderNumber: res.orderNumber, token: res.accessToken, ...result } });
            navigate(`${orderUrl}&placed=1`, { replace: true });
          } catch (e) {
            // The webhook will still confirm a genuine payment; the order page explains this.
            toast.message(errorMessage(e));
            navigate(`${orderUrl}&placed=1`, { replace: true });
          }
        } else {
          navigate(`${orderUrl}&pay=1`, { replace: true });
        }
      } else {
        navigate(`${orderUrl}&placed=1`, { replace: true });
      }
      qc.invalidateQueries({ queryKey: qk.cart });
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.fields) {
          for (const [k, msg] of Object.entries(e.fields)) form.setError(k as Path<CheckoutInput>, { message: msg });
        }
        const details = e.details as { cart?: CartDTO } | undefined;
        if (details?.cart) {
          qc.setQueryData(qk.cart, details.cart);
          await qc.invalidateQueries({ queryKey: qk.cart });
          setNotice(e.message);
        } else if (e.status === 401) {
          setFormError('Please sign in to check out.');
        } else {
          setFormError(e.message);
        }
      } else {
        setFormError(errorMessage(e));
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setPlacing(false);
    }
  });

  if (isLoading) {
    return (
      <div className="container-page py-16">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (!cart || cart.lines.length === 0) {
    return (
      <div className="container-page py-16">
        <Seo title="Checkout" noindex />
        <EmptyState title="Your bag is empty" action={<ButtonLink to="/shop">Explore jewellery</ButtonLink>}>
          Add a piece to your bag to check out.
        </EmptyState>
      </div>
    );
  }
  if (settings && !settings.guestCheckout && !user) {
    return (
      <div className="container-page py-16">
        <EmptyState title="Sign in to check out" action={<ButtonLink to="/login?next=/checkout">Sign in</ButtonLink>}>
          Please sign in or create an account to place your order.
        </EmptyState>
      </div>
    );
  }

  const noMethods = methods.length === 0;
  // Methods exist but none can be used for this order (e.g. COD only, and the order is above the COD limit).
  const noUsableMethod = !noMethods && methods.every((m) => m.disabled);
  const blocked = noMethods || noUsableMethod || (view?.issues.length ?? 0) > 0 || (view?.shipping && !view.shipping.serviceable);
  const selectedMethod = methods.find((m) => m.key === paymentMethod && !m.disabled);
  const sectionTitle = 'font-display text-[1.75rem] font-semibold leading-tight text-maroon';
  const step = (n: number) => (
    <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-gold/70 bg-gradient-to-b from-gold-pale to-[#e8cf94] font-display text-xl font-semibold text-maroon shadow-[0_6px_14px_-8px_rgba(122,87,22,.8)]">
      {n}
    </span>
  );
  const Head = ({ n, id, title, text, children }: { n: number; id: string; title: string; text: string; children?: ReactNode }) => (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-4">
        {step(n)}
        <div>
          <h2 id={id} className={sectionTitle}>
            {title}
          </h2>
          <p className="text-sm text-muted">{text}</p>
        </div>
      </div>
      {children}
    </div>
  );
  const choice = (on: boolean) => cn('relative flex items-start gap-4 rounded-md border p-4 text-left transition-colors', on ? 'border-maroon bg-paper shadow-[0_10px_24px_-18px_rgba(63,18,21,.7)]' : 'border-line bg-paper/60 hover:border-line-strong');
  const radio = (on: boolean) => (
    <span aria-hidden className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2', on ? 'border-maroon' : 'border-line-strong')}>
      {on && <span className="size-2.5 rounded-full bg-maroon" />}
    </span>
  );

  const summary = view && (
    <div className="space-y-5">
      <ul className="space-y-4">
        {view.lines.map((l) => (
          <li key={l.id} className="flex gap-4">
            <div className="relative size-18 shrink-0 rounded-sm bg-sand">
              <Img image={l.image} sizes="72px" width={480} className="size-full rounded-sm object-cover" />
              <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-maroon text-[0.6875rem] font-bold text-ivory ring-2 ring-paper" aria-label={`Quantity ${l.qty}`}>
                {l.qty}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-snug text-ink">{l.name}</p>
              <p className="text-[0.8125rem] text-muted">{[purityLabel(l.purity), formatGrams(l.netWeightMg), /^standard$/i.test(l.variantLabel) ? '' : l.variantLabel].filter(Boolean).join(' · ')}</p>
              {l.issue && <p className="mt-0.5 text-xs text-warn">{l.issue}</p>}
            </div>
            <p className="font-semibold text-ink tabular">{inr(l.lineTotal)}</p>
          </li>
        ))}
      </ul>
      <CouponForm cart={view} />
      <div className={cn('transition-opacity', quoting && 'opacity-60')}>
        <Totals cart={view} />
      </div>
      <ul className="grid grid-cols-3 border-t border-line pt-5">
        {[
          { icon: Lock, label: 'Price locked at order' },
          { icon: ShieldCheck, label: 'Secure checkout' },
          { icon: Truck, label: 'Tracked delivery' },
        ].map((t, i) => (
          <li key={t.label} className={cn('flex flex-col items-center gap-1.5 px-2 text-center text-xs leading-snug text-ink-2 xl:flex-row xl:text-left', i > 0 && 'border-l border-line')}>
            <t.icon className="size-7 shrink-0 text-gold" strokeWidth={1.2} aria-hidden />
            {t.label}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <Seo title="Checkout" noindex />
      <LotusMark className="pointer-events-none absolute -left-16 bottom-10 w-72 text-gold opacity-[0.08]" />
      <div className="container-page relative grid gap-8 py-8 lg:grid-cols-12 lg:gap-12 lg:py-10">
        {/* Mobile summary toggle */}
        <div className="lg:hidden">
          <button type="button" onClick={() => setSummaryOpen((v) => !v)} aria-expanded={summaryOpen} className="flex w-full items-center justify-between rounded-md border border-line bg-paper px-4 py-4 text-sm">
            <span className="flex items-center gap-2 font-semibold">
              {summaryOpen ? 'Hide' : 'Show'} order summary <ChevronDown className={cn('size-4 transition-transform', summaryOpen && 'rotate-180')} />
            </span>
            <span className="font-display text-xl font-semibold text-maroon tabular">{view ? inr(view.total) : ''}</span>
          </button>
          {summaryOpen && <div className="rounded-b-md border-x border-b border-line bg-paper p-4">{summary}</div>}
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-9 lg:col-span-7" aria-label="Checkout">
          <div>
            <h1 className="font-display text-[clamp(2.75rem,2rem+2.6vw,4.25rem)] font-semibold leading-none text-maroon">Checkout</h1>
            <p className="mt-2 text-[1.0625rem] text-ink-2">Complete your order securely. Prices are locked when you place it.</p>
            <span aria-hidden className="mt-4 flex items-center gap-2 text-gold">
              <span className="h-px flex-1 bg-gold/50" />
              <span className="size-2 rotate-45 border border-current" />
              <span className="h-px flex-1 bg-gold/50" />
            </span>
          </div>

          {notice && <Alert tone="warn">{notice} Please review the updated summary and place your order again.</Alert>}
          <FormError>{formError}</FormError>

          {/* 1. Contact */}
          <section aria-labelledby="s-contact" className="space-y-4">
            <Head n={1} id="s-contact" title="Contact" text="We’ll use this to keep you updated about your order.">
              {!user && (
                <p className="text-sm text-muted">
                  Have an account?{' '}
                  <Link to="/login?next=/checkout" className="font-semibold text-maroon underline decoration-gold underline-offset-4">
                    Sign in
                  </Link>
                </p>
              )}
            </Head>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.customer?.name?.message} className="sm:col-span-2">
                <IconInput icon={UserRound} autoComplete="name" {...register('customer.name', { onBlur: fillContactIntoAddress })} />
              </Field>
              <Field label="Email" error={errors.customer?.email?.message} hint="For your order confirmation and invoice.">
                <IconInput icon={Mail} type="email" autoComplete="email" inputMode="email" {...register('customer.email')} />
              </Field>
              <Field label="Mobile number" error={errors.customer?.phone?.message} hint="For delivery updates.">
                <IconInput icon={Phone} type="tel" autoComplete="tel-national" inputMode="tel" placeholder="98765 43210" {...register('customer.phone', { onBlur: fillContactIntoAddress })} />
              </Field>
            </div>
          </section>

          {/* 2. Delivery */}
          <section aria-labelledby="s-delivery" className="space-y-4">
            <Head n={2} id="s-delivery" title="Delivery address" text="Where should we send your jewellery?" />
            {addresses && addresses.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Saved addresses">
                {addresses.map((a) => (
                  <button type="button" key={a.id} role="radio" aria-checked={addressId === a.id} onClick={() => applyAddress(a)} className={choice(addressId === a.id)}>
                    {radio(addressId === a.id)}
                    <MapPin className="mt-0.5 size-6 shrink-0 text-gold" strokeWidth={1.4} aria-hidden />
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="block font-semibold text-ink">{a.label}</span>
                      <span className="mt-0.5 block text-muted">
                        {a.fullName}, {a.line1}, {a.city} {a.pincode}
                      </span>
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  role="radio"
                  aria-checked={addressId === 'new'}
                  onClick={() => {
                    setAddressId('new');
                    for (const k of ['fullName', 'phone', 'line1', 'line2', 'landmark', 'city', 'pincode'] as const) setValue(`address.${k}`, '');
                    setValue('address.state', undefined as never);
                    setValue('saveAddress', true);
                    fillContactIntoAddress();
                  }}
                  className={cn(choice(addressId === 'new'), 'items-center', addressId !== 'new' && 'border-dashed border-gold/60')}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border border-gold text-gold-deep">
                    <Plus className="size-4" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold text-ink">Deliver to a new address</span>
                </button>
              </div>
            )}
            {addresses && addresses.length > 0 && (
              <p className="text-xs text-muted">
                Need to change a saved address?{' '}
                <Link to="/account?tab=addresses" className="underline underline-offset-2 hover:text-ink">
                  Manage addresses
                </Link>
              </p>
            )}
            {(!addresses?.length || addressId === 'new' || addressId === null) && (
              <div className="grid gap-4 sm:grid-cols-6">
                <Field label="PIN code" error={errors.address?.pincode?.message} className="sm:col-span-2">
                  <Input autoComplete="postal-code" inputMode="numeric" maxLength={6} className="h-12 !rounded-md bg-white" {...register('address.pincode')} />
                </Field>
                <div className="flex items-end pb-3.5 text-sm sm:col-span-4" aria-live="polite">
                  {validPin && pinInfo && (pinInfo.serviceable ? (
                    <span className="font-medium text-success">
                      ✓ We deliver here{pinInfo.etaMinDays !== undefined ? ` in ${pinInfo.etaMinDays}–${pinInfo.etaMaxDays} days` : ''}
                    </span>
                  ) : (
                    <span className="text-danger">{pinInfo.message}</span>
                  ))}
                </div>
                <Field label="Recipient name" error={errors.address?.fullName?.message} className="sm:col-span-3">
                  <Input autoComplete="shipping name" className="h-12 !rounded-md bg-white" {...register('address.fullName')} />
                </Field>
                <Field label="Recipient mobile" error={errors.address?.phone?.message} className="sm:col-span-3">
                  <Input type="tel" inputMode="tel" autoComplete="shipping tel-national" className="h-12 !rounded-md bg-white" {...register('address.phone')} />
                </Field>
                <Field label="House / flat, building, street" error={errors.address?.line1?.message} className="sm:col-span-6">
                  <Input autoComplete="shipping address-line1" className="h-12 !rounded-md bg-white" {...register('address.line1')} />
                </Field>
                <Field label="Area / locality" optional className="sm:col-span-3">
                  <Input autoComplete="shipping address-line2" className="h-12 !rounded-md bg-white" {...register('address.line2')} />
                </Field>
                <Field label="Landmark" optional className="sm:col-span-3">
                  <Input className="h-12 !rounded-md bg-white" {...register('address.landmark')} />
                </Field>
                <Field label="City / town" error={errors.address?.city?.message} className="sm:col-span-3">
                  <Input autoComplete="shipping address-level2" className="h-12 !rounded-md bg-white" {...register('address.city')} />
                </Field>
                <Field label="State" error={errors.address?.state?.message} className="sm:col-span-3">
                  <FormDropdown control={form.control} name="address.state" autoComplete="shipping address-level1" placeholder="Choose a state" options={STATE_OPTIONS} />
                </Field>
                {user && <Checkbox label="Save this address to my account" className="sm:col-span-6" {...register('saveAddress')} />}
              </div>
            )}
            {view?.shipping && (
              <p className="flex items-center gap-2 text-sm text-ink-2">
                <Truck className="size-4 text-gold" strokeWidth={1.6} aria-hidden />
                {view.shipping.serviceable
                  ? `Delivery: ${view.shipping.amount ? inr(view.shipping.amount) : 'free'}${view.shipping.etaMinDays !== undefined ? ` · usually ${view.shipping.etaMinDays}–${view.shipping.etaMaxDays} days` : ''}`
                  : view.shipping.message}
              </p>
            )}
          </section>

          {/* 3. Payment */}
          <section aria-labelledby="s-payment" className="space-y-4">
            <Head n={3} id="s-payment" title="Payment" text="Choose how you’d like to pay for this order." />
            {noMethods ? (
              <Alert tone="warn">
                Online ordering isn’t available just yet. Please{' '}
                <Link to="/contact" className="font-semibold underline">
                  contact us
                </Link>{' '}
                and we’ll help you place your order.
              </Alert>
            ) : (
              <div className="space-y-3" role="radiogroup" aria-label="Payment method">
                {methods.map((m) => {
                  const on = paymentMethod === m.key && !m.disabled;
                  return (
                    <label key={m.key} className={cn(choice(on), 'cursor-pointer items-center has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold', m.disabled && 'cursor-not-allowed opacity-55')}>
                      <input type="radio" value={m.key} disabled={Boolean(m.disabled)} {...register('paymentMethod')} className="sr-only" />
                      {radio(on)}
                      <m.icon className="size-8 shrink-0 text-gold-deep" strokeWidth={1.3} aria-hidden />
                      <span className="flex-1">
                        <span className="block font-display text-[1.1875rem] font-semibold text-ink">{m.title}</span>
                        <span className="block text-[0.8125rem] text-muted">{m.disabled ?? m.text}</span>
                      </span>
                    </label>
                  );
                })}
                {errors.paymentMethod && <p className="text-xs text-danger">{errors.paymentMethod.message}</p>}
                {noUsableMethod && (
                  <div role="alert" className="flex gap-3 rounded-md border border-warn/30 bg-warn-bg px-4 py-3.5 text-sm text-ink-2">
                    <CircleAlert className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />
                    <p>
                      None of our payment options can be used for this order ({methods.map((m) => m.disabled).filter(Boolean).join('; ').toLowerCase()}). Please{' '}
                      <Link to="/contact" className="font-semibold underline">
                        contact us
                      </Link>{' '}
                      and we’ll help you complete it.
                    </p>
                  </div>
                )}
                {selectedMethod?.key === 'razorpay' && (
                  <p className="text-xs text-muted">You’ll complete payment in Razorpay’s secure window. Card and UPI details never reach our servers.</p>
                )}
              </div>
            )}

            <details className="group border-y border-line py-3.5 text-sm">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-ink [&::-webkit-details-marker]:hidden">
                <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden /> Add a GSTIN or order note
              </summary>
              <div className="mt-4 grid gap-4">
                <Field label="GSTIN (for a business invoice)" optional error={errors.gstin?.message}>
                  <Input {...register('gstin')} maxLength={15} className="uppercase" />
                </Field>
                <Field label="Note for us" optional hint="E.g. gift message or delivery instructions.">
                  <Textarea rows={3} maxLength={500} {...register('notes')} />
                </Field>
              </div>
            </details>
            <Checkbox label="Email me about new arrivals and offers" description="Optional. You can unsubscribe at any time." {...register('marketingConsent')} />
          </section>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={placing || Boolean(blocked) || !view}
              aria-busy={placing || undefined}
              className="flex h-15 w-full items-center justify-center gap-3 rounded-md bg-gradient-to-b from-maroon-2 to-maroon text-[0.9375rem] font-bold uppercase tracking-[0.14em] text-ivory shadow-[0_14px_28px_-16px_rgba(63,18,21,.95)] transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {placing ? (
                <Spinner className="size-5" />
              ) : (
                <LockKeyhole className="size-5" strokeWidth={1.6} aria-hidden />
              )}
              {selectedMethod?.key === 'razorpay' ? `Pay ${view ? inr(view.total) : ''} securely` : `Place order · ${view ? inr(view.total) : ''}`}
              <ArrowRight className="size-5 text-gold-soft" aria-hidden />
            </button>
            <p className="text-center text-xs text-muted">
              By placing this order you agree to our{' '}
              <Link to="/policies/terms" className="underline">
                terms
              </Link>{' '}
              and{' '}
              <Link to="/policies/returns-and-refunds" className="underline">
                returns policy
              </Link>
              .
            </p>
          </div>
        </form>

        <aside className="hidden lg:col-span-5 lg:block" aria-label="Order summary">
          <div className="sticky top-6 rounded-md border border-line bg-paper p-7 shadow-[0_24px_50px_-40px_rgba(63,18,21,.55)]">
            <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
              <h2 className="font-display text-[1.875rem] font-semibold text-maroon">Your order</h2>
              {settings && <span className="font-display text-xs uppercase tracking-[0.3em] text-ink-2">{settings.store.name}</span>}
            </div>
            {summary}
          </div>
        </aside>
      </div>
    </div>
  );
}
