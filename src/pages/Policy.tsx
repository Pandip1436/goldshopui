import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronRight, FileText, Lock, Mail, Phone, RefreshCw, ShieldCheck, Truck, type LucideIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, NavLink, useParams } from 'react-router';
import { formatIndianMobile, whatsappLink, type PageDTO } from '@goldshop/shared';
import { LotusMark } from '../components/AboutLegacy';
import { PolicyBody } from '../components/PolicyBody';
import { Seo } from '../components/Seo';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { ButtonLink } from '../components/ui/Button';
import { PageFade } from '../components/ui/Motion';
import { Breadcrumbs, EmptyState, Img, Skeleton } from '../components/ui/misc';
import { api } from '../lib/api';
import { useSettings } from '../lib/hooks';
import { cn, formatDate } from '../lib/utils';

const LINKS: { slug: string; label: string; icon: LucideIcon }[] = [
  { slug: 'shipping-policy', label: 'Shipping', icon: Truck },
  { slug: 'returns-and-refunds', label: 'Returns & refunds', icon: RefreshCw },
  { slug: 'cancellation-policy', label: 'Cancellations', icon: FileText },
  { slug: 'privacy-policy', label: 'Privacy', icon: ShieldCheck },
  { slug: 'terms', label: 'Terms & conditions', icon: Lock },
];

/** The last word of a title in the gold italic, e.g. "Cancellation *policy*". */
function accentTitle(title: string) {
  const i = title.lastIndexOf(' ');
  if (i < 0) return title;
  return (
    <>
      {title.slice(0, i)} <em className="font-medium italic text-gold-deep">{title.slice(i + 1)}</em>
    </>
  );
}

export default function Policy() {
  const { slug } = useParams();
  const { data: s } = useSettings();
  const { data: page, isLoading, error } = useQuery({ queryKey: ['page', slug], queryFn: () => api<PageDTO>(`/pages/${slug}`), retry: false });
  const current = LINKS.find((l) => l.slug === slug);
  // Phones: the policy links scroll sideways; bring the current one into view.
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && active && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
  }, [slug]);
  const store = s?.store;
  const contacts = [
    store?.phone && { icon: Phone, label: 'Call us', value: formatIndianMobile(store.phone), href: `tel:${store.phone.replace(/\s/g, '')}` },
    store?.whatsapp && { icon: WhatsAppIcon, label: 'Chat on WhatsApp', value: formatIndianMobile(store.whatsapp), href: whatsappLink(store.whatsapp, 'Hello! I have a question about your policies.'), external: true },
    store?.email && { icon: Mail, label: 'Email us', value: store.email, href: `mailto:${store.email}` },
  ].filter(Boolean) as { icon: LucideIcon | typeof WhatsAppIcon; label: string; value: string; href: string; external?: boolean }[];
  const image = s?.helpPage.image;

  return (
    <PageFade className="relative overflow-hidden">
      <Seo title={page?.title ?? 'Policies'} path={`/policies/${slug}`} />
      {image && (
        <div aria-hidden className="pointer-events-none absolute right-0 top-0 hidden h-[17rem] w-[44%] [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,black_40%),linear-gradient(to_top,transparent,black_35%)] lg:block">
          <Img image={image} priority sizes="44vw" width={1600} className="size-full object-cover" />
        </div>
      )}
      <LotusMark className="pointer-events-none absolute -bottom-10 -right-12 hidden w-80 text-gold opacity-[0.1] lg:block" />

      <div className="container-page relative grid grid-cols-[minmax(0,1fr)] gap-10 py-8 md:py-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-14">
        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <p className="mb-4 hidden text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-ink-2 lg:block">Policies</p>
          <nav ref={navRef} aria-label="Policies" className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0 lg:flex-col lg:gap-1 lg:border-r lg:border-line lg:pr-4">
            {LINKS.map((l) => (
              <NavLink
                key={l.slug}
                to={`/policies/${l.slug}`}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-3.5 rounded-md border px-4 py-2.5 text-[0.9375rem] transition-colors lg:border-0 lg:py-3',
                    isActive ? 'border-maroon bg-maroon text-ivory shadow-[0_10px_20px_-14px_rgba(63,18,21,.9)]' : 'border-line text-ink-2 hover:bg-sand/60 hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <l.icon className={cn('size-5 shrink-0', isActive ? 'text-gold-soft' : 'text-ink-2')} strokeWidth={1.5} aria-hidden />
                    <span className="flex-1 whitespace-nowrap">{l.label}</span>
                    {isActive && <ChevronRight className="hidden size-4 lg:block" aria-hidden />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="relative mt-8 hidden overflow-hidden rounded-md border border-gold/40 bg-paper p-6 lg:block">
            <LotusMark className="pointer-events-none absolute -bottom-8 -right-6 w-36 text-gold opacity-[0.12]" />
            <p className="font-display text-[1.75rem] font-semibold leading-tight text-maroon">Questions about a policy?</p>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">We’re happy to explain anything about your order.</p>
            {contacts.length > 0 && (
              <ul className="relative mt-5 space-y-4">
                {contacts.map((c) => (
                  <li key={c.label}>
                    <a href={c.href} target={c.external ? '_blank' : undefined} rel={c.external ? 'noreferrer' : undefined} className="group flex items-center gap-3.5">
                      <span className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/60 text-gold-deep transition-colors group-hover:bg-gold-pale/40">
                        <c.icon className="size-5" strokeWidth={1.5} aria-hidden />
                      </span>
                      <span className="min-w-0 text-sm">
                        <span className="block font-medium text-ink">{c.label}</span>
                        <span className="block truncate text-muted">{c.value}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/contact"
              className="relative mt-6 inline-flex h-12 items-center gap-2.5 rounded-sm bg-gradient-to-b from-maroon-2 to-maroon px-6 text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-ivory shadow-[0_10px_20px_-12px_rgba(63,18,21,.9)] transition-[filter] hover:brightness-110"
            >
              Contact us <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </aside>

        <div className="min-w-0">
          {isLoading ? (
            <Skeleton className="h-96 w-full max-w-3xl" />
          ) : error || !page ? (
            <EmptyState title="Page not found" action={<ButtonLink to="/">Home</ButtonLink>} />
          ) : (
            <article className="max-w-3xl">
              <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Policies', to: '/policies/shipping-policy' }, { label: current?.label ?? page.title }]} className="text-[0.8125rem]" />
              <p className="mt-8 flex items-center gap-3 text-[0.75rem] font-semibold uppercase tracking-[0.28em] text-gold-deep">
                <span aria-hidden className="h-px w-8 bg-current opacity-70" /> Policy
              </p>
              <h1 className="mt-3 font-display text-[clamp(2.5rem,1.8rem+2.6vw,4.25rem)] font-semibold leading-[1.05] text-maroon">{accentTitle(page.title)}</h1>
              <p className="mt-3 text-sm text-muted">Last updated {formatDate(page.updatedAt)}</p>
              <div className="mt-8 lg:mt-12">
                <PolicyBody source={page.body} />
              </div>
            </article>
          )}
        </div>
      </div>
    </PageFade>
  );
}
