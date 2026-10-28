import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowDown, ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ImageRef, PublicSettings } from '@goldshop/shared';
import { cn } from '../lib/utils';
import { GoldRule, LotusMark } from './AboutLegacy';
import { Reveal } from './ui/Motion';
import { Img } from './ui/misc';

/**
 * Where each photo sits in the mosaic. Phones use two columns with the first photo across both;
 * desktops use six, with the first photo large beside two smaller ones and any further photos in
 * rows of three. A short last row stretches so the grid never ends with a gap.
 */
function tile(i: number, n: number): string {
  const phone = i === 0 ? 'col-span-2 row-span-2' : (n - 1) % 2 === 1 && i === n - 1 ? 'col-span-2' : '';
  let desk: string;
  if (n === 1) desk = 'lg:col-span-6 lg:row-span-2';
  else if (n === 2) desk = 'lg:col-span-3 lg:row-span-2';
  else if (i === 0) desk = 'lg:col-span-4 lg:row-span-2';
  else if (i < 3) desk = 'lg:col-span-2';
  else {
    const rest = n - 3;
    const rem = rest % 3;
    desk = i - 3 < rest - rem ? 'lg:col-span-2' : rem === 1 ? 'lg:col-span-6' : 'lg:col-span-3';
  }
  return cn(phone, desk);
}

/** The Our story page's gallery of the shop itself, with a full-screen viewer. Renders nothing until photos are uploaded. */
export function StorePhotos({ settings: s }: { settings: PublicSettings }) {
  const { images, title, subtitle } = s.storePhotos;
  const [open, setOpen] = useState<number | null>(null);
  if (images.length === 0) return null;
  const n = images.length;
  const altFor = (img: ImageRef, i: number) => img.alt || `Inside ${s.store.name} — photo ${i + 1} of ${n}`;

  return (
    <section aria-labelledby="store-photos-title" className="relative overflow-hidden border-y border-line/60 bg-ivory">
      <LotusMark className="pointer-events-none absolute -right-12 -top-6 w-64 text-gold opacity-[0.07]" />
      <div className="container-page relative py-16 md:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="flex items-center justify-center gap-4">
            <GoldRule className="w-14 rotate-180 sm:w-20" />
            <span className="text-[0.75rem] font-semibold uppercase tracking-[0.34em] text-ink">Our store</span>
            <GoldRule className="w-14 sm:w-20" />
          </p>
          <h2 id="store-photos-title" className="mt-5 font-display text-[clamp(2.25rem,1.6rem+2.4vw,3.5rem)] font-medium leading-[1.05] text-ink">
            {title || (
              <>
                Step inside <em className="font-medium italic text-gold-deep">our store</em>
              </>
            )}
          </h2>
          {subtitle && <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink-2">{subtitle}</p>}
        </Reveal>

        <Reveal delay={0.08} className="mt-10 md:mt-14">
          <ul className="grid auto-rows-[9.5rem] grid-cols-2 gap-2.5 sm:auto-rows-[12.5rem] sm:gap-3 lg:auto-rows-[14rem] lg:grid-cols-6 lg:gap-4 xl:auto-rows-[15.5rem]">
            {images.map((img, i) => (
              <li key={img.key || img.url || i} className={tile(i, n)}>
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  aria-label={`View larger: ${altFor(img, i)}`}
                  className="group relative block size-full overflow-hidden rounded-xl bg-sand shadow-[0_24px_50px_-36px_rgba(63,18,21,.6)] outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
                >
                  <Img
                    image={img}
                    alt=""
                    width={i === 0 ? 1600 : 960}
                    sizes={i === 0 ? '(min-width: 1024px) 60vw, 100vw' : '(min-width: 1024px) 30vw, 50vw'}
                    className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                  <span aria-hidden className="pointer-events-none absolute inset-2.5 rounded-lg border border-ivory/0 transition-colors duration-500 group-hover:border-ivory/50 sm:inset-3" />
                  <span aria-hidden className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-ink/45 text-ivory opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Expand className="size-4" strokeWidth={1.8} />
                  </span>
                  {img.alt && (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1d0b0c]/80 via-[#1d0b0c]/35 to-transparent px-3.5 pb-3 pt-10 text-left sm:px-5 sm:pb-4">
                      <span className={cn('block font-display font-medium leading-tight text-ivory', i === 0 ? 'text-[1.25rem] sm:text-[1.625rem]' : 'text-[1rem] sm:text-[1.25rem]')}>{img.alt}</span>
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </Reveal>

        {s.store.address && (
          <p className="mt-8 text-center">
            <button
              type="button"
              onClick={() => document.getElementById('visit-title')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className="inline-flex items-center gap-2.5 text-[0.8125rem] font-semibold uppercase tracking-[0.18em] text-ink underline decoration-gold underline-offset-[8px] transition-colors hover:text-gold-deep"
            >
              Plan your visit <ArrowDown className="size-4" aria-hidden />
            </button>
          </p>
        )}
      </div>

      <Viewer images={images} index={open} onIndex={setOpen} altFor={altFor} storeName={s.store.name} />
    </section>
  );
}

function Viewer({
  images,
  index,
  onIndex,
  altFor,
  storeName,
}: {
  images: ImageRef[];
  index: number | null;
  onIndex: (i: number | null) => void;
  altFor: (img: ImageRef, i: number) => string;
  storeName: string;
}) {
  const n = images.length;
  const swipeFrom = useRef<number | null>(null);
  const go = (d: number) => index !== null && onIndex((index + d + n) % n);
  const img = index !== null ? images[index] : undefined;
  const arrow = 'grid size-11 shrink-0 place-items-center rounded-full border border-ivory/25 bg-ivory/10 text-ivory backdrop-blur-sm transition-colors hover:bg-ivory/20 sm:size-12';

  return (
    <Dialog.Root open={index !== null} onOpenChange={(v) => !v && onIndex(null)}>
      <AnimatePresence>
        {index !== null && img && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <m.div className="fixed inset-0 z-[80] bg-[#130607] bg-[radial-gradient(60rem_40rem_at_50%_45%,#2c1013,transparent_70%)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') go(1);
                if (e.key === 'ArrowLeft') go(-1);
              }}
            >
              <m.div
                className="fixed inset-0 z-[80] flex flex-col outline-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onPointerDown={(e) => (swipeFrom.current = e.clientX)}
                onPointerUp={(e) => {
                  const from = swipeFrom.current;
                  swipeFrom.current = null;
                  if (from !== null && n > 1 && Math.abs(e.clientX - from) > 50) go(e.clientX < from ? 1 : -1);
                }}
              >
                <div className="flex items-center justify-between gap-4 px-4 py-3 text-ivory sm:px-6">
                  <Dialog.Title className="text-[0.75rem] font-semibold uppercase tracking-[0.28em] text-gold-soft">
                    {storeName}
                    {n > 1 && (
                      <span className="ml-3 font-normal tracking-[0.12em] text-ivory/70 tabular">
                        {index + 1} / {n}
                      </span>
                    )}
                  </Dialog.Title>
                  <Dialog.Close className="grid size-11 place-items-center rounded-full text-ivory transition-colors hover:bg-ivory/10" aria-label="Close">
                    <X className="size-5.5" />
                  </Dialog.Close>
                </div>

                <div className="flex min-h-0 flex-1 items-center gap-3 px-3 sm:gap-5 sm:px-6">
                  {n > 1 && (
                    <button type="button" onClick={() => go(-1)} className={cn(arrow, 'hidden sm:grid')} aria-label="Previous photo">
                      <ChevronLeft className="size-5" />
                    </button>
                  )}
                  <figure className="flex size-full min-w-0 flex-col items-center justify-center">
                    <m.div key={index} className="flex min-h-0 w-full flex-1 items-center justify-center" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                      <Img image={img} priority width={1600} sizes="100vw" alt={altFor(img, index)} className="max-h-full max-w-full select-none rounded-md object-contain shadow-2xl" />
                    </m.div>
                    <Dialog.Description asChild>
                      <figcaption className={cn('mt-4 max-w-2xl text-center font-display text-[1.25rem] leading-snug text-ivory sm:text-[1.5rem]', !img.alt && 'sr-only')}>{altFor(img, index)}</figcaption>
                    </Dialog.Description>
                  </figure>
                  {n > 1 && (
                    <button type="button" onClick={() => go(1)} className={cn(arrow, 'hidden sm:grid')} aria-label="Next photo">
                      <ChevronRight className="size-5" />
                    </button>
                  )}
                </div>

                {/* phones: arrows under the photo, within thumb reach */}
                <div className="flex items-center justify-center gap-6 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:pb-6">
                  {n > 1 && (
                    <>
                      <button type="button" onClick={() => go(-1)} className={cn(arrow, 'sm:hidden')} aria-label="Previous photo">
                        <ChevronLeft className="size-5" />
                      </button>
                      <span className="flex items-center gap-1.5" aria-hidden>
                        {images.map((x, k) => (
                          <span key={x.key || k} className={cn('h-1.5 rounded-full transition-all', k === index ? 'w-5 bg-gold-soft' : 'w-1.5 bg-ivory/35')} />
                        ))}
                      </span>
                      <button type="button" onClick={() => go(1)} className={cn(arrow, 'sm:hidden')} aria-label="Next photo">
                        <ChevronRight className="size-5" />
                      </button>
                    </>
                  )}
                </div>
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
