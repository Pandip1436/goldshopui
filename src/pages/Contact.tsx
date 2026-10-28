import { ArrowRight, BadgeCheck, Clock, Lock, Mail, MapPin, Phone, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { formatIndianMobile, whatsappLink } from '@goldshop/shared';
import { LotusMark } from '../components/AboutLegacy';
import { ABOUT_ICONS } from '../components/aboutIcons';
import { EnquiryForm } from '../components/EnquiryForm';
import { Seo } from '../components/Seo';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { PageFade, Reveal } from '../components/ui/Motion';
import { Breadcrumbs, Img } from '../components/ui/misc';
import { useSettings } from '../lib/hooks';
import { cn } from '../lib/utils';

const card = 'rounded-xl border border-line/80 bg-paper shadow-[0_18px_40px_-34px_rgba(63,18,21,.45)]';
const iconCircle = 'grid size-14 shrink-0 place-items-center rounded-full bg-gold-pale/55 text-gold-deep';
const directionsBtn =
  'inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-b from-maroon-2 to-maroon font-semibold text-ivory shadow-[0_10px_20px_-12px_rgba(63,18,21,.9)] transition-[filter] hover:brightness-110';

export default function Contact() {
  const { data: s } = useSettings();
  const store = s?.store;
  const a = store?.address;
  const street = a ? [a.line1, a.line2, a.city].filter(Boolean).join(', ') : '';
  const region = a ? `${a.state}${a.pincode ? ` – ${a.pincode}` : ''}` : '';
  const address = a ? `${street}, ${region}` : '';
  const directions = store?.mapUrl || (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : '');
  const hours = store?.hours?.split(/\n|;\s*/).map((h) => h.trim()).filter(Boolean) ?? [];
  const image = s?.contactPage.image;
  const highlights = s?.contactPage.highlights ?? [];

  // Each card only when its detail is filled in under Settings → Store.
  const methods: { key: string; icon: ReactNode; title: string; value: ReactNode; note: string; href: string; external?: boolean }[] = [];
  if (store?.phone)
    methods.push({ key: 'call', icon: <Phone className="size-6" strokeWidth={1.6} aria-hidden />, title: 'Call us', value: formatIndianMobile(store.phone), note: hours[0] ?? 'During store hours', href: `tel:${store.phone.replace(/\s/g, '')}` });
  if (store?.whatsapp)
    methods.push({ key: 'wa', icon: <WhatsAppIcon className="size-6" />, title: 'Chat on WhatsApp', value: formatIndianMobile(store.whatsapp), note: 'Quick responses', href: whatsappLink(store.whatsapp, 'Hello! I have a question.'), external: true });
  if (store?.email)
    methods.push({
      key: 'mail',
      icon: <Mail className="size-6" strokeWidth={1.6} aria-hidden />,
      title: 'Email us',
      // a break opportunity before the @ keeps a long address readable when it wraps
      value: (
        <>
          {store.email.split('@')[0]}
          <wbr />@{store.email.split('@')[1]}
        </>
      ),
      note: s?.contactPage.replyNote ?? 'Write to us any time',
      href: `mailto:${store.email}`,
    });

  return (
    <PageFade>
      <Seo title="Contact us" path="/contact" description="Call, WhatsApp or write to us about a piece, sizing, custom work, an order, or how our prices are calculated." />

      <section aria-labelledby="contact-title" className="relative overflow-hidden bg-ivory">
        <LotusMark className="pointer-events-none absolute -left-16 top-1/3 w-72 text-gold opacity-[0.07]" />

        <div className="container-page relative grid grid-cols-[minmax(0,1fr)] gap-8 pb-14 pt-6 md:pt-8 lg:grid-cols-2 xl:grid-cols-12 xl:gap-6 xl:pb-16">
          {/* heading and the ways to reach us */}
          <div className="xl:col-span-4">
            <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Contact us' }]} />
            <p className="mt-6 text-[0.8125rem] font-medium uppercase tracking-[0.3em] text-ink-2">Get in touch</p>
            <h1 id="contact-title" className="mt-3 font-display text-[clamp(2.75rem,1.9rem+2.8vw,4.25rem)] font-semibold leading-[0.98] text-maroon">
              We’re Here
              <em className="block bg-gradient-to-r from-gold-deep via-gold to-gold-deep bg-clip-text pb-1 font-semibold text-transparent">For You</em>
            </h1>
            <p className="mt-4 max-w-md text-[1.0625rem] leading-relaxed text-ink-2">
              {s?.contactPage.subtitle ?? 'Have a question about our collections, schemes or services? Our team is happy to assist you.'}
            </p>

            <ul className="mt-7 space-y-3">
              {methods.map((m) => (
                <li key={m.key}>
                  <a
                    href={m.href}
                    target={m.external ? '_blank' : undefined}
                    rel={m.external ? 'noreferrer' : undefined}
                    className={cn(card, 'group flex items-center gap-4 p-4 transition-colors hover:border-gold/60')}
                  >
                    <span className={iconCircle}>{m.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink">{m.title}</span>
                      <span className="block text-[0.9375rem] text-ink-2 [overflow-wrap:anywhere]">{m.value}</span>
                      <span className="mt-0.5 block text-xs text-muted">{m.note}</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-gold-deep opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
                  </a>
                </li>
              ))}
              {address && (
                <li className={cn(card, 'flex items-start gap-4 p-4')}>
                  <span className={iconCircle}>
                    <MapPin className="size-6" strokeWidth={1.6} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">Visit our showroom</span>
                    <span className="block text-[0.9375rem] leading-snug text-ink-2">
                      {street},<br />
                      {region}
                    </span>
                    {directions && (
                      <a href={directions} target="_blank" rel="noreferrer" className={cn(directionsBtn, 'mt-3 h-9 px-4 text-[0.8125rem]')}>
                        Get directions <ArrowRight className="size-3.5" aria-hidden />
                      </a>
                    )}
                  </span>
                </li>
              )}
            </ul>
          </div>

          {/* the message form */}
          <Reveal className="xl:col-span-4 xl:pt-24">
            <div className={cn(card, 'rounded-2xl p-6 shadow-[0_30px_60px_-40px_rgba(63,18,21,.55)] sm:p-7')}>
              <p className="flex items-center gap-3 text-[0.75rem] font-medium uppercase tracking-[0.28em] text-ink-2">
                <span aria-hidden className="flex w-10 items-center">
                  <span className="h-px flex-1 bg-gold" />
                  <span className="size-1.5 rotate-45 border border-gold" />
                </span>
                Send us a message
              </p>
              <h2 className="mt-3 font-display text-[2.125rem] font-semibold leading-tight text-maroon">How can we help you?</h2>
              <p className="mt-1 text-[0.9375rem] text-ink-2">Fill in the details below and we’ll get back to you soon.</p>
              <div className="mt-6">
                <EnquiryForm type="contact" boxed icons withTopic sideBySide askContactMethod={false} messageMax={500} submitTone="maroon" submitLabel="Send message" />
              </div>
              <p className="mt-4 flex items-start justify-center gap-1.5 text-center text-xs text-muted">
                <Lock className="mt-px size-3.5 shrink-0" aria-hidden />
                <span>
                  We use your details only to reply to you — see our{' '}
                  <Link to="/policies/privacy-policy" className="underline underline-offset-2 hover:text-ink">
                    privacy policy
                  </Link>
                  .
                </span>
              </p>
            </div>
          </Reveal>

          {/* the storefront photo, always whole (never cropped), with the showroom under it on wide screens and beside it below that */}
          {(image || address) && (
            <div className="grid gap-5 md:grid-cols-2 md:items-start lg:col-span-2 xl:col-span-4 xl:flex xl:flex-col xl:items-stretch xl:pt-24">
              {image && (
                <div className="overflow-hidden rounded-2xl border border-line/70 shadow-[0_30px_60px_-40px_rgba(63,18,21,.55)]">
                  <Img image={image} priority sizes="(min-width: 1280px) 34vw, (min-width: 768px) 50vw, 100vw" width={1600} className="block h-auto w-full" />
                </div>
              )}
              {address && (
              <Reveal delay={0.08}>
                <section aria-labelledby="showroom-title" className={cn(card, 'grid gap-5 rounded-2xl bg-paper/95 p-5 backdrop-blur-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] sm:p-6 md:grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] xl:grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]')}>
                  <div>
                    <h2 id="showroom-title" className="font-display text-[2rem] font-semibold leading-tight text-maroon">
                      Our showroom
                    </h2>
                    <p className="mt-1 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ink-2">Visit us to see every piece in person</p>
                    <p className="mt-4 flex gap-3 text-[0.9375rem] leading-snug text-ink-2">
                      <MapPin className="mt-0.5 size-5 shrink-0 text-gold-deep" strokeWidth={1.6} aria-hidden />
                      <span>
                        {street},<br />
                        {region}
                      </span>
                    </p>
                    {hours.length > 0 && (
                      <p className="mt-3 flex gap-3 text-[0.9375rem] leading-snug text-ink-2">
                        <Clock className="mt-0.5 size-5 shrink-0 text-gold-deep" strokeWidth={1.6} aria-hidden />
                        <span>
                          {hours.map((h) => (
                            <span key={h} className="block">
                              {h}
                            </span>
                          ))}
                        </span>
                      </p>
                    )}
                    {directions && (
                      <a href={directions} target="_blank" rel="noreferrer" className={cn(directionsBtn, 'mt-5 h-11 w-full px-5 text-sm sm:w-auto')}>
                        Get directions <ArrowRight className="size-4" aria-hidden />
                      </a>
                    )}
                  </div>
                  <div className="relative min-h-48 overflow-hidden rounded-xl border border-line bg-sand">
                    <iframe
                      title={`Map showing ${store?.name ?? 'our store'}`}
                      src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="absolute inset-0 size-full border-0"
                    />
                  </div>
                </section>
              </Reveal>
              )}
            </div>
          )}
        </div>
      </section>

      {highlights.length > 0 && (
        <section aria-label="Why shop with us" className="border-y border-line/60 bg-paper">
          <ul className="container-page grid grid-cols-1 gap-y-4 py-7 min-[360px]:grid-cols-2 min-[360px]:gap-y-5 sm:grid-cols-3 xl:grid-cols-6">
            {highlights.map((h) => {
              const Icon: LucideIcon = ABOUT_ICONS[h.icon ?? ''] ?? BadgeCheck;
              return (
                // Phones: icon over a centred title, so a half-width column never squeezes the words one per line.
                <li key={h.title} className="flex flex-col items-center gap-2 px-2 text-center sm:flex-row sm:gap-3.5 sm:px-4 sm:text-left xl:justify-center xl:[&+&]:border-l xl:[&+&]:border-line-strong/40">
                  <Icon className="size-10 shrink-0 text-gold-deep" strokeWidth={1.1} aria-hidden />
                  <span className="min-w-0 text-[0.9375rem] leading-snug text-ink-2">
                    {h.title}
                    {h.text && <span className="block text-xs text-muted">{h.text}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </PageFade>
  );
}
