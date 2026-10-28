import { useMutation } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Gem,
  Landmark,
  Mail,
  Package,
  Phone,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { useState, type ComponentType, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { formatIndianMobile, type TrustItem } from '@goldshop/shared';
import { api, errorMessage } from '../../lib/api';
import { useCategories, useSettings } from '../../lib/hooks';
import { cn, rateFreshness } from '../../lib/utils';
import { LotusMark } from '../AboutLegacy';
import { ABOUT_ICONS } from '../aboutIcons';
import { Mark } from '../Logo';
import { FacebookLogo, InstagramLogo, PinterestLogo, YouTubeLogo } from '../SocialLogos';
import { Img } from '../ui/misc';

const STRIP_COLS = ['', 'xl:grid-cols-1', 'xl:grid-cols-2', 'xl:grid-cols-3', 'xl:grid-cols-4'];

/** Gold column heading with the short-rule-diamond-long-rule underline from the brand's ornaments. */
function ColumnTitle({ children }: { children: ReactNode }) {
  return (
    <>
      <h2 className="text-[0.8125rem] font-semibold uppercase tracking-[0.24em] text-gold-soft">{children}</h2>
      <span aria-hidden className="mt-3 flex items-center gap-1.5">
        <span className="h-px w-3 bg-gold-soft/40" />
        <span className="size-1.5 rotate-45 bg-gold-soft" />
        <span className="h-px flex-1 bg-gold-soft/30" />
      </span>
    </>
  );
}

function LinkColumn({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div className="max-w-[13.5rem]">
      <ColumnTitle>{title}</ColumnTitle>
      <ul className="mt-4">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="group flex items-center justify-between gap-3 py-1.5 text-[0.9375rem] capitalize text-ivory/85 transition-colors hover:text-gold-soft">
              {l.label}
              <ChevronRight className="size-3.5 shrink-0 text-ivory/45 transition-transform group-hover:translate-x-0.5 group-hover:text-gold-soft" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Small acceptance marks, drawn as plain text and shapes rather than copied artwork. */
function PayMark({ kind }: { kind: 'visa' | 'mastercard' | 'rupay' | 'upi' | 'netbanking' }) {
  const chip = 'grid h-8 w-14 place-items-center rounded-md bg-white shadow-[0_1px_0_rgba(0,0,0,.2)]';
  if (kind === 'visa') return <span className={cn(chip, 'text-[0.9rem] font-black italic tracking-tight text-[#1a1f71]')}>VISA</span>;
  if (kind === 'mastercard')
    return (
      <span className={chip}>
        <svg viewBox="0 0 32 20" className="h-5" aria-hidden>
          <circle cx="12" cy="10" r="8" fill="#eb001b" />
          <circle cx="20" cy="10" r="8" fill="#f79e1b" fillOpacity=".9" />
        </svg>
      </span>
    );
  if (kind === 'rupay') return <span className={cn(chip, 'text-[0.72rem] font-black italic text-[#1b3f8b]')}>RuPay</span>;
  if (kind === 'upi') return <span className={cn(chip, 'text-[0.85rem] font-black italic tracking-tight text-[#5f6368]')}>UPI</span>;
  return (
    <span className={chip}>
      <Landmark className="size-4.5 text-[#1b3f8b]" strokeWidth={1.8} />
    </span>
  );
}

const PAY_LABELS = { visa: 'Visa', mastercard: 'Mastercard', rupay: 'RuPay', upi: 'UPI', netbanking: 'Net banking' } as const;

export function Footer() {
  const { data: s } = useSettings();
  const { data: cats } = useCategories();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const subscribe = useMutation({
    mutationFn: () => api<{ message: string }>('/enquiries', { body: { type: 'newsletter', email, consent, website: '' } }),
    onSuccess: (r) => {
      setMsg({ ok: true, text: r.message });
      setEmail('');
      setConsent(false);
    },
    onError: (e) => setMsg({ ok: false, text: errorMessage(e) }),
  });

  const year = new Date().getFullYear();
  const name = s?.store.name ?? '';
  const { pathname } = useLocation();
  // The contact page ends with its own band; showing the footer's straight after would repeat it.
  const ownBand = pathname === '/contact' && Boolean(s?.contactPage.highlights.length);
  const highlights = ownBand ? [] : (s?.footer.highlights ?? []);
  const photo = s?.footer.image;
  // Only accounts the store has entered, so no icon leads nowhere.
  const socialLinks: { href?: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
    { href: s?.store.social.facebook, label: 'Facebook', icon: FacebookLogo },
    { href: s?.store.social.instagram, label: 'Instagram', icon: InstagramLogo },
    { href: s?.store.social.youtube, label: 'YouTube', icon: YouTubeLogo },
    { href: s?.store.social.pinterest, label: 'Pinterest', icon: PinterestLogo },
  ];
  const social = socialLinks.filter((x) => x.href);
  // Only what is actually set up: payment marks need the gateway, delivery needs nationwide shipping.
  const badges: { icon: LucideIcon; label: string }[] = [];
  if (s?.payments.razorpay) badges.push({ icon: ShieldCheck, label: 'Secure payments' });
  if (s?.shipping.nationwide) badges.push({ icon: Truck, label: 'Pan India delivery' });
  if (s?.returnWindowDays) badges.push({ icon: Package, label: `${s.returnWindowDays}-day returns` });
  if (s) badges.push({ icon: Gem, label: 'Transparent pricing' });
  const payMarks = s?.payments.razorpay ? (['visa', 'mastercard', 'rupay', 'upi', 'netbanking'] as const) : [];

  const shopLinks = [
    ...(cats ?? []).slice(0, 7).map((c) => ({ to: `/shop/${c.slug}`, label: c.name })),
    { to: '/collections', label: 'Collections' },
    { to: '/gold-rate', label: rateFreshness(s?.goldRates.updatedAt).today ? 'Today’s gold rate' : 'Gold rate' },
  ];
  const helpLinks = [
    { to: '/track-order', label: 'Track your order' },
    { to: '/faq', label: 'FAQs' },
    { to: '/policies/shipping-policy', label: 'Shipping' },
    { to: '/policies/returns-and-refunds', label: 'Returns & refunds' },
    { to: '/policies/cancellation-policy', label: 'Cancellations' },
    { to: '/contact', label: 'Contact us' },
  ];
  const houseLinks = [
    { to: '/about', label: 'Our story' },
    { to: '/journal', label: 'Journal' },
    ...(s?.savingsPlan.enabled ? [{ to: '/gold-savings-plan', label: 'Gold savings plan' }] : []),
    { to: '/journal?topic=care', label: 'Care guide' },
    { to: '/account', label: 'My account' },
  ];

  return (
    // straight under the contact page's band; elsewhere a gap before the footer's own band
    <footer className={ownBand ? undefined : 'mt-24'}>
      {highlights.length > 0 && <TrustBand items={highlights} />}

      <div className="relative overflow-hidden bg-maroon text-ivory">
        <LotusMark className="pointer-events-none absolute -left-16 -top-10 w-72 text-gold-soft opacity-[0.07]" />
        <LotusMark className="pointer-events-none absolute -bottom-16 -right-12 hidden w-80 text-gold-soft opacity-[0.06] lg:block" />
        <div className="relative">
        {photo && (
          // Sits under the brand column, fading out towards the links and upwards; it stops at the bottom bar.
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 hidden h-56 w-[min(32rem,34%)] [mask-composite:intersect] [mask-image:linear-gradient(to_right,black_55%,transparent),linear-gradient(to_top,black_60%,transparent)] xl:block"
          >
            <Img image={photo} sizes="34vw" width={960} className="size-full object-cover object-[35%_60%]" />
          </div>
        )}

        <div className="container-page relative grid gap-12 py-14 md:grid-cols-2 [&>*]:min-w-0 lg:py-16 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,2fr)_minmax(0,1.3fr)] xl:gap-10">
          {/* brand: centred under the centred lockup on phones, left-aligned once it shares a row */}
          <div className={cn('order-1 text-center md:text-left', photo && 'xl:pb-44')}>
            <Link to="/" className="inline-flex flex-col items-center text-ivory" aria-label={`${name} — home`}>
              {s?.brand.mark ? <Img image={s.brand.mark} sizes="96px" width={480} alt="" className="h-14 w-auto" /> : <Mark className="h-12 w-10 text-gold-soft" />}
              <span className="mt-3 whitespace-nowrap font-display text-[clamp(1.2rem,0.25rem+1.4vw,1.75rem)] font-semibold uppercase leading-none tracking-[0.22em] [margin-right:-0.22em]">
                {name}
              </span>
              {s?.store.tagline && (
                <span className="mt-3 flex items-center gap-2.5 whitespace-nowrap text-[0.5625rem] font-semibold uppercase tracking-[0.22em] text-ivory/75">
                  <span aria-hidden className="hidden h-px w-5 bg-gold-soft/50 sm:block" />
                  {s.store.tagline}
                  <span aria-hidden className="hidden h-px w-5 bg-gold-soft/50 sm:block" />
                </span>
              )}
            </Link>
            {s?.store.description && <p className="mx-auto mt-6 max-w-sm text-[0.9375rem] leading-relaxed text-ivory/80 md:mx-0">{s.store.description}</p>}
            {social.length > 0 && (
              <ul className="mt-6 flex justify-center gap-3 md:justify-start">
                {social.map((x) => (
                  <li key={x.label}>
                    <a
                      href={x.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={x.label}
                      className="grid size-12 place-items-center rounded-full bg-white shadow-[0_0_0_3px_rgba(217,184,114,.25)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_3px_rgba(217,184,114,.7),0_10px_20px_-8px_rgba(0,0,0,.5)]"
                    >
                      <x.icon className="size-6" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {s && (s.store.phone || s.store.email) && (
              <ul className="mt-6 space-y-2 text-sm text-ivory/75">
                {s.store.phone && (
                  <li>
                    <a href={`tel:${s.store.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 hover:text-gold-soft">
                      <Phone className="size-3.5 text-gold-soft" aria-hidden /> {formatIndianMobile(s.store.phone)}
                    </a>
                  </li>
                )}
                {s.store.email && (
                  <li>
                    <a href={`mailto:${s.store.email}`} className="inline-flex items-center gap-2 break-all hover:text-gold-soft">
                      <Mail className="size-3.5 shrink-0 text-gold-soft" aria-hidden /> {s.store.email}
                    </a>
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* links */}
          <nav aria-label="Footer" className="order-2 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 md:order-3 md:col-span-2 xl:order-2 xl:col-span-1">
            <LinkColumn title="Shop" links={shopLinks} />
            <LinkColumn title="Help" links={helpLinks} />
            <LinkColumn title="The house" links={houseLinks} />
          </nav>

          {/* newsletter */}
          <div className="order-3 self-start md:order-2 xl:order-3">
            <div className="relative overflow-hidden rounded-2xl border border-gold-soft/30 p-6 sm:p-7">
              <LotusMark className="pointer-events-none absolute -right-8 -top-8 w-36 text-gold-soft opacity-20" />
              <p className="relative text-xs font-semibold uppercase tracking-[0.24em] text-gold-soft">New pieces, first</p>
              <h2 className="relative mt-3 font-display text-[2rem] font-semibold leading-[1.1]">Subscribe to our updates</h2>
              <p className="relative mt-3 text-[0.9375rem] leading-relaxed text-ivory/80">Be the first to know about new arrivals, exclusive offers and gold rate updates.</p>
              <form
                className="@container relative mt-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  setMsg(null);
                  subscribe.mutate();
                }}
              >
                {/* While the card is narrow (phones, and the half-width column on tablets) the field gets its own row and the button goes full width beneath it. */}
                <div className="flex flex-col gap-3 @sm:flex-row @sm:gap-0 @sm:overflow-hidden @sm:rounded-md @sm:border @sm:border-gold-soft/40 @sm:transition-colors @sm:focus-within:border-gold-soft">
                  <div className="flex min-w-0 flex-1 rounded-md border border-gold-soft/40 transition-colors focus-within:border-gold-soft @sm:rounded-none @sm:border-0">
                    <label htmlFor="nl-email" className="sr-only">
                      Email address
                    </label>
                    <Mail className="ml-3.5 size-4 shrink-0 self-center text-ivory/70" aria-hidden />
                    <input
                      id="nl-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email address"
                      autoComplete="email"
                      className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm text-ivory placeholder:text-ivory/55 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={subscribe.isPending}
                    className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-gradient-to-b from-[#ecd08f] via-[#d9b872] to-[#c39a4a] px-4 text-xs font-bold uppercase tracking-[0.14em] text-maroon transition-[filter] hover:brightness-105 disabled:opacity-60 @sm:h-auto @sm:rounded-none sm:px-5"
                  >
                    Subscribe <ArrowRight className="size-3.5" aria-hidden />
                  </button>
                </div>
                <label className="mt-4 flex items-start gap-3 text-[0.8125rem] leading-snug text-ivory/75">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    required
                    className="check-on-dark mt-0.5 shrink-0"
                  />
                  I agree to receive occasional emails about new arrivals. Unsubscribe any time.
                </label>
                {msg && (
                  <p role="status" className={cn('mt-3 text-xs', msg.ok ? 'text-gold-soft' : 'text-[#f3b4ab]')}>
                    {msg.text}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>

        </div>

        {/* bottom bar */}
        <div className="relative border-t border-gold-soft/25">
          {/* Centred on phones and tablets, like the brand block above; one aligned row from lg. */}
          <div className="container-page flex flex-col items-center gap-6 py-6 text-center text-sm text-ivory/75 lg:items-start lg:text-left xl:flex-row xl:items-center xl:justify-between xl:gap-8">
            <p className="xl:shrink-0">
              © {year} {s?.store.legalName || name}. {s?.store.gstin ? `GSTIN ${s.store.gstin}. ` : ''}Prices include GST.
            </p>
            <div className="flex flex-col items-center gap-5 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-8 xl:flex-1 xl:justify-end">
              {badges.length > 0 && (
                <ul className="flex flex-wrap justify-center gap-x-7 gap-y-3 lg:justify-start">
                  {badges.map((b) => (
                    <li key={b.label} className="flex items-center gap-2.5 text-[0.8125rem] leading-tight text-ivory/80">
                      <b.icon className="size-7 shrink-0 text-gold-soft" strokeWidth={1.2} aria-hidden />
                      <span className="whitespace-nowrap">{b.label}</span>
                    </li>
                  ))}
                </ul>
              )}
              {(payMarks.length > 0 || s?.payments.cod.enabled) && (
                <ul aria-label="Ways to pay" className="flex flex-wrap items-center justify-center gap-2 lg:justify-start lg:border-l lg:border-ivory/15 lg:pl-8">
                  {payMarks.map((k) => (
                    <li key={k} title={PAY_LABELS[k]}>
                      <span className="sr-only">{PAY_LABELS[k]}</span>
                      <span aria-hidden>
                        <PayMark kind={k} />
                      </span>
                    </li>
                  ))}
                  {s?.payments.cod.enabled && (
                    <li className="grid h-8 place-items-center rounded-md border border-ivory/30 px-3 text-xs font-semibold text-ivory/85">Cash on delivery</li>
                  )}
                </ul>
              )}
              <nav aria-label="Legal" className="flex shrink-0 items-center divide-x divide-ivory/20 lg:border-l lg:border-ivory/15 lg:pl-8">
                <Link to="/policies/privacy-policy" className="pr-4 hover:text-ivory">Privacy</Link>
                <Link to="/policies/terms" className="px-4 hover:text-ivory">Terms</Link>
                <a href="/sitemap.xml" className="pl-4 hover:text-ivory">Sitemap</a>
              </nav>
            </div>
          </div>
        </div>

        {/* site credit */}
        <div className="border-t border-ivory/10">
          {/* The floating WhatsApp button sits over the page's last lines, so leave it room here. */}
          <p className={cn('container-page flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-4 text-center text-xs text-ivory/55', s?.store.whatsapp ? 'pb-24 md:pb-28' : 'pb-4')}>
            Powered by
            <span className="font-semibold uppercase tracking-[0.18em] text-gold-soft">AKAPAZ TECHNOLOGIES - SIVAKASI</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

/** The cream band above the footer: the store's own promises, as set in the admin. */
function TrustBand({ items }: { items: TrustItem[] }) {
  return (
    <div className="border-t border-line bg-paper">
      <ul className={cn('container-page grid py-4 sm:grid-cols-2 xl:py-6', STRIP_COLS[items.length])}>
        {items.map((h) => {
          const Icon = ABOUT_ICONS[h.icon ?? ''] ?? BadgeCheck;
          return (
            <li
              key={h.title}
              className="flex items-center gap-4 border-line px-4 py-4 max-sm:[&+&]:border-t sm:max-xl:[&:nth-child(even)]:border-l sm:max-xl:[&:nth-child(n+3)]:border-t xl:justify-center xl:py-1 xl:[&+&]:border-l"
            >
              <Icon className="size-10 shrink-0 text-gold" strokeWidth={1.2} aria-hidden />
              <div className="min-w-0">
                <p className="font-display text-[1.3125rem] font-semibold leading-tight text-maroon">{h.title}</p>
                {h.text && <p className="mt-0.5 text-sm text-muted">{h.text}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
