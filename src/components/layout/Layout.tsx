import { ChevronRight, LockKeyhole } from 'lucide-react';
import { Suspense } from 'react';
import { Link, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { whatsappLink } from '@goldshop/shared';
import { useSettings } from '../../lib/hooks';
import { useUI } from '../../lib/ui';
import { CartDrawer } from './CartDrawer';
import { LotusMark } from '../AboutLegacy';
import { BrandLoader, RouteProgress } from '../Loading';
import { Img } from '../ui/misc';
import { WhatsAppIcon } from '../WhatsAppIcon';
import { Footer } from './Footer';
import { Header, RateBar } from './Header';
import { MobileNav } from './MobileNav';
import { SearchDialog } from './SearchDialog';

function WhatsAppFloat() {
  const { data: s } = useSettings();
  const { pathname } = useLocation();
  const { chatTopic } = useUI();
  if (!s?.store.whatsapp || pathname.startsWith('/checkout') || pathname.startsWith('/admin')) return null;
  // Product pages set the topic so the conversation starts with context.
  const text = chatTopic ? `Hello! I'd like to know more about "${chatTopic}" (${window.location.href}).` : 'Hello! I have a question.';
  // On phones a product page has its own WhatsApp card and a bottom purchase bar this button would cover.
  const onProduct = pathname.startsWith('/product/');
  return (
    <a
      href={whatsappLink(s.store.whatsapp, text)}
      target="_blank"
      rel="noreferrer"
      className={`no-print fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-[#1f5c3f] py-3 pl-3 pr-4 text-sm font-semibold text-white shadow-lg shadow-ink/20 transition-transform hover:-translate-y-0.5 md:bottom-8 md:right-8 ${onProduct ? 'max-lg:hidden' : ''}`}
      aria-label="Chat with us on WhatsApp"
    >
      <WhatsAppIcon className="size-5.5" />
      <span className="hidden sm:inline">Chat with us</span>
    </a>
  );
}

/** Checkout keeps only what helps finish the order: the brand, the way back to the bag and a slim footer. */
function CheckoutHeader() {
  const { data: s } = useSettings();
  return (
    <header className="border-b border-line bg-ivory">
      <div className="container-page flex h-16 items-center justify-between gap-3 sm:h-20">
        <Link to="/" className="flex min-w-0 items-center gap-2 text-ink sm:gap-3" aria-label={`${s?.store.name ?? 'Store'} — home`}>
          {s?.brand.logo ? (
            <Img image={s.brand.logo} priority sizes="200px" width={480} alt="" className="h-12 w-auto sm:h-16" />
          ) : (
            <>
          <LotusMark className="w-8 shrink-0 text-gold sm:w-11" />
          <span>
            <span className="block whitespace-nowrap font-display text-[1rem] font-semibold uppercase leading-none tracking-[0.06em] text-maroon sm:text-[1.75rem] sm:tracking-[0.12em]">{s?.store.name}</span>
            {s?.store.tagline && <span className="mt-1 hidden text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-gold-deep sm:block">{s.store.tagline}</span>}
          </span>
            </>
          )}
        </Link>
        <nav aria-label="Breadcrumb" className="flex shrink-0 items-center gap-1.5 text-[0.8125rem] sm:gap-2 sm:text-sm">
          <Link to="/cart" className="text-muted hover:text-ink">Bag</Link>
          <ChevronRight className="size-4 text-subtle" aria-hidden />
          <span aria-current="page" className="font-semibold text-maroon">Checkout</span>
          <span className="ml-4 hidden items-center gap-1.5 text-xs text-muted md:flex">
            <LockKeyhole className="size-3.5" aria-hidden /> Secure checkout
          </span>
        </nav>
      </div>
    </header>
  );
}

function CheckoutFooter() {
  const { data: s } = useSettings();
  return (
    <footer className="border-t border-line py-6 text-xs text-muted">
      <div className="container-page flex flex-wrap items-center justify-between gap-3">
        <p>© {new Date().getFullYear()} {s?.store.legalName || s?.store.name}. Prices include GST.</p>
        <nav aria-label="Policies" className="flex gap-4">
          <Link to="/policies/shipping-policy" className="hover:text-ink">Shipping</Link>
          <Link to="/policies/returns-and-refunds" className="hover:text-ink">Returns</Link>
          <Link to="/policies/privacy-policy" className="hover:text-ink">Privacy</Link>
          <Link to="/contact" className="hover:text-ink">Help</Link>
        </nav>
      </div>
    </footer>
  );
}

export function Layout() {
  const checkout = useLocation().pathname.startsWith('/checkout');
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">
        Skip to content
      </a>
      {checkout ? (
        <CheckoutHeader />
      ) : (
        <>
          <div className="no-print">
            <RateBar />
          </div>
          <div className="no-print contents">
            <Header />
          </div>
        </>
      )}
      <main id="main" className="flex-1">
        <Suspense fallback={<BrandLoader className="min-h-[50vh] py-24" label="Loading page" />}>
          <Outlet />
        </Suspense>
      </main>
      <div className="no-print">{checkout ? <CheckoutFooter /> : <Footer />}</div>
      <MobileNav />
      <SearchDialog />
      <CartDrawer />
      <WhatsAppFloat />
      <RouteProgress />
      {/* Every fresh page load has the router key "default", so positions saved on one page were restored
          (late, after render) on another, throwing phone users back to the top. Key fresh loads by address. */}
      <ScrollRestoration getKey={(loc) => (loc.key === 'default' ? `${loc.pathname}${loc.search}` : loc.key)} />
    </div>
  );
}
