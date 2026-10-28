import { Search } from 'lucide-react';
import { Link } from 'react-router';
import { Seo } from '../components/Seo';
import { Suggestions } from '../components/product/Suggestions';
import { ButtonLink } from '../components/ui/Button';
import { PageFade } from '../components/ui/Motion';
import { Ornament } from '../components/ui/misc';
import { useCategories } from '../lib/hooks';
import { useUI } from '../lib/ui';

export default function NotFound() {
  const { setSearchOpen } = useUI();
  const { data: cats } = useCategories();
  return (
    <PageFade>
      <Seo title="Page not found" noindex />
      <section className="relative overflow-hidden bg-paper">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_26rem_at_50%_0%,rgba(217,184,114,.24),transparent_70%)]" />
        <div className="container-page relative flex flex-col items-center py-16 text-center md:py-24">
          <p aria-hidden className="font-display text-[7rem] font-medium italic leading-none text-gold/25 md:text-[10rem]">
            404
          </p>
          <h1 className="display-md mt-2 max-w-xl">This page has moved or doesn’t exist</h1>
          <p className="mt-4 max-w-md text-muted">Search for a piece, or start from one of our categories below.</p>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="mt-8 flex w-full max-w-md items-center gap-3 border border-line-strong/70 bg-ivory px-4 py-3.5 text-left text-sm text-muted transition-colors hover:border-gold"
          >
            <Search className="size-4 text-ink-2" strokeWidth={1.5} /> Search jhumkas, chains, rings…
          </button>
          {cats && cats.length > 0 && (
            <ul className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
              {cats.map((c) => (
                <li key={c.id}>
                  <Link to={`/shop/${c.slug}`} className="inline-flex items-center gap-1.5 border border-line bg-ivory px-4 py-2 text-sm text-ink-2 transition-colors hover:border-gold hover:text-ink">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Ornament className="mt-10" />
          <div className="cta-row mt-8 justify-center">
            <ButtonLink to="/">Back to home</ButtonLink>
            <ButtonLink to="/contact" variant="secondary">
              Contact us
            </ButtonLink>
          </div>
        </div>
      </section>
      <div className="container-page py-14 md:py-20">
        <Suggestions eyebrow="While you’re here" title="New arrivals" bare />
      </div>
    </PageFade>
  );
}
