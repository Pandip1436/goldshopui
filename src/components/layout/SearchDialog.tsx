import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { SearchSuggestions } from '@goldshop/shared';
import { api } from '../../lib/api';
import { useCategories, useDebounced } from '../../lib/hooks';
import { useUI } from '../../lib/ui';
import { cn, inr, purityLabel } from '../../lib/utils';
import { Sheet } from '../ui/Sheet';
import { Img, Spinner } from '../ui/misc';

export function SearchDialog() {
  const { searchOpen, setSearchOpen } = useUI();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(-1);
  const navigate = useNavigate();
  const debounced = useDebounced(q.trim(), 220);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: cats } = useCategories();

  const { data, isFetching } = useQuery({
    queryKey: ['suggest', debounced],
    queryFn: ({ signal }) => api<SearchSuggestions>('/search/suggest', { query: { q: debounced }, signal }),
    enabled: debounced.length >= 2,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (searchOpen) {
      setQ('');
      setActive(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Flat list of navigable results for arrow-key support.
  const results = useMemo(() => {
    if (!data || debounced.length < 2) return [];
    return [
      ...data.products.map((p) => ({ key: `p${p.id}`, to: `/product/${p.slug}` })),
      ...data.categories.map((c) => ({ key: `c${c.id}`, to: `/shop/${c.slug}` })),
      ...data.collections.map((c) => ({ key: `l${c.id}`, to: `/collections/${c.slug}` })),
    ];
  }, [data, debounced]);

  const go = (to: string) => {
    setSearchOpen(false);
    navigate(to);
  };
  const submit = () => {
    if (active >= 0 && results[active]) return go(results[active].to);
    if (q.trim()) go(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  const idx = (key: string) => results.findIndex((r) => r.key === key);
  const optionClass = (key: string) => cn('flex items-center gap-4 rounded-xs px-3 py-2.5 transition-colors', idx(key) === active ? 'bg-sand' : 'hover:bg-sand/70');

  return (
    <Sheet open={searchOpen} onOpenChange={setSearchOpen} side="top" title="Search" hideTitle>
      <div className="container-page max-w-4xl py-6 md:py-10">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-center gap-3 border-b-2 border-ink pb-3"
        >
          <Search className="size-6 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(-1);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(results.length - 1, a + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(-1, a - 1));
              }
            }}
            placeholder="Search jhumkas, bangles, 22K…"
            aria-label="Search the store"
            aria-autocomplete="list"
            aria-controls="search-results"
            aria-activedescendant={active >= 0 ? results[active]?.key : undefined}
            className="min-w-0 flex-1 bg-transparent font-display text-2xl text-ink placeholder:text-subtle focus:outline-none md:text-4xl"
            enterKeyHint="search"
          />
          {isFetching && <Spinner className="size-5 text-muted" />}
          <button type="button" onClick={() => setSearchOpen(false)} className="grid size-10 place-items-center rounded-full hover:bg-sand" aria-label="Close search">
            <X className="size-5" />
          </button>
        </form>

        <div id="search-results" role="listbox" aria-label="Suggestions" className="mt-6 min-h-[10rem]">
          {debounced.length < 2 ? (
            <div>
              <p className="eyebrow mb-4">Browse</p>
              <div className="flex flex-wrap gap-2">
                {(cats ?? []).flatMap((c) => [c, ...c.children]).slice(0, 10).map((c) => (
                  <button key={c.id} type="button" onClick={() => go(`/shop/${c.slug}`)} className="border border-line px-4 py-2 text-sm text-ink-2 hover:border-ink">
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          ) : data && results.length === 0 && !isFetching ? (
            <p className="text-sm text-muted">
              No matches for “{debounced}”. Try a broader word like “earrings” or “bangle”, or{' '}
              <Link to="/contact" onClick={() => setSearchOpen(false)} className="underline">
                ask us
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-8 md:grid-cols-[1fr_14rem]">
              <div>
                {data && data.products.length > 0 && <p className="eyebrow mb-2">Pieces</p>}
                <ul className="space-y-1">
                  {data?.products.map((p) => (
                    <li key={p.id} id={`p${p.id}`} role="option" aria-selected={idx(`p${p.id}`) === active}>
                      <Link to={`/product/${p.slug}`} onClick={() => setSearchOpen(false)} className={optionClass(`p${p.id}`)}>
                        <span className="size-14 shrink-0 overflow-hidden bg-sand">
                          <Img image={p.image} sizes="56px" width={480} className="size-full object-cover" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-ink">{p.name}</span>
                          <span className="text-xs text-muted">{purityLabel(p.purity)}</span>
                        </span>
                        <span className="text-sm font-semibold tabular">{p.price ? inr(p.price) : ''}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {q.trim() && (
                  <button type="button" onClick={submit} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline decoration-gold underline-offset-4">
                    See all results for “{q.trim()}” <ArrowRight className="size-4" />
                  </button>
                )}
              </div>
              {data && (data.categories.length > 0 || data.collections.length > 0) && (
                <div>
                  <p className="eyebrow mb-2">Categories & collections</p>
                  <ul className="space-y-1">
                    {data.categories.map((c) => (
                      <li key={c.id} id={`c${c.id}`} role="option" aria-selected={idx(`c${c.id}`) === active}>
                        <Link to={`/shop/${c.slug}`} onClick={() => setSearchOpen(false)} className={optionClass(`c${c.id}`)}>
                          {c.name}
                        </Link>
                      </li>
                    ))}
                    {data.collections.map((c) => (
                      <li key={c.id} id={`l${c.id}`} role="option" aria-selected={idx(`l${c.id}`) === active}>
                        <Link to={`/collections/${c.slug}`} onClick={() => setSearchOpen(false)} className={optionClass(`l${c.id}`)}>
                          {c.name} <span className="text-xs text-muted">collection</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
