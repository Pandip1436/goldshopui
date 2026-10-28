import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, m } from 'framer-motion';
import { ChevronLeft, ChevronRight, Crown, Expand, X, ZoomIn } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { imageUrl, type ImageRef } from '@goldshop/shared';
import { cn } from '../../lib/utils';
import { Img, ImagePlaceholder } from '../ui/misc';

/** Product photos. `badge` is a short, earned label (e.g. Bestseller) shown on the main photo. */
export function Gallery({ images, name, badge }: { images: ImageRef[]; name: string; badge?: string }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => setIndex(0), [images]);

  // Keep the dots in sync with the mobile carousel's scroll position.
  const onRailScroll = () => {
    const el = railRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };

  if (!images.length) return <ImagePlaceholder className="aspect-[4/5] w-full" label="Photography coming soon" />;

  const current = images[Math.min(index, images.length - 1)];
  const many = images.length > 1;
  const step = (d: number) => setIndex((index + d + images.length) % images.length);

  return (
    <div className="lg:grid lg:grid-cols-[6rem_1fr] lg:gap-5">
      {/* Thumbnails (desktop) */}
      {many && (
        <ul className="hidden max-h-[calc(100dvh-8rem)] flex-col gap-4 overflow-y-auto p-1 scrollbar-none lg:flex" aria-label="Product images">
          {images.map((img, i) => (
            <li key={`${img.key}-${i}`}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === index}
                className={cn(
                  'block aspect-[4/5] w-full overflow-hidden rounded-lg bg-sand shadow-[0_8px_18px_-12px_rgba(63,18,21,.55)] transition duration-300',
                  i === index ? 'ring-2 ring-maroon ring-offset-2 ring-offset-ivory' : 'opacity-75 hover:opacity-100',
                )}
              >
                <Img image={img} sizes="96px" width={480} className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Main image with hover zoom (desktop) — capped to the screen height so it stays fully visible while pinned */}
      <div className={cn('group/main relative hidden lg:block', !many && 'lg:col-span-2')}>
        <button
          type="button"
          className="relative block aspect-[4/5] max-h-[calc(100dvh-8rem)] w-full cursor-zoom-in overflow-hidden rounded-xl bg-sand shadow-[0_30px_60px_-40px_rgba(63,18,21,.6)]"
          onClick={() => setLightbox(true)}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
          aria-label={`Open full-screen view of ${name}`}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <m.div key={current.key + index} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              <Img
                image={current}
                priority={index === 0}
                sizes="(min-width: 1280px) 45vw, 55vw"
                width={1600}
                className="size-full object-cover transition-transform duration-300 ease-out"
              />
            </m.div>
          </AnimatePresence>
          {zoom && (
            <div
              className="pointer-events-none absolute inset-0 bg-no-repeat"
              style={{ backgroundImage: `url(${imageUrl(current, 1600)})`, backgroundSize: '220%', backgroundPosition: `${zoom.x}% ${zoom.y}%` }}
              aria-hidden
            />
          )}
          {badge && (
            <span className="pointer-events-none absolute bottom-5 left-5 flex items-center gap-2 rounded-full bg-paper/95 py-1.5 pl-1.5 pr-4 text-[0.8125rem] font-semibold text-maroon shadow-sm">
              <span className="grid size-7 place-items-center rounded-full bg-gold-pale text-gold-deep">
                <Crown className="size-3.5" strokeWidth={1.8} aria-hidden />
              </span>
              {badge}
            </span>
          )}
          <span aria-hidden className="pointer-events-none absolute bottom-5 right-5 grid size-12 place-items-center rounded-full bg-maroon text-ivory shadow-[0_8px_18px_-8px_rgba(63,18,21,.9)]">
            <ZoomIn className="size-5" strokeWidth={1.8} />
          </span>
        </button>
        {many && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              className="absolute left-5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-sm transition-colors hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-5" strokeWidth={1.6} />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              className="absolute right-5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-sm transition-colors hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRight className="size-5" strokeWidth={1.6} />
            </button>
          </>
        )}
      </div>

      {/* Swipeable carousel (mobile / tablet) */}
      <div className="relative lg:hidden">
        <div ref={railRef} onScroll={onRailScroll} className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none" aria-label="Product images">
          {images.map((img, i) => (
            <button
              type="button"
              key={`${img.key}-${i}`}
              onClick={() => {
                setIndex(i);
                setLightbox(true);
              }}
              className="aspect-[4/5] w-full shrink-0 snap-center bg-sand sm:rounded-xl"
              aria-label={`Open image ${i + 1} of ${images.length} full screen`}
            >
              <Img image={img} priority={i === 0} sizes="100vw" width={960} className="size-full object-cover" />
            </button>
          ))}
        </div>
        {many && (
          <>
            <span aria-hidden className="pointer-events-none absolute right-4 top-4 bg-ivory/85 px-2 py-0.5 font-display text-sm italic text-ink-2 tabular backdrop-blur">
              <span className="text-gold-deep">{index + 1}</span> / {images.length}
            </span>
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5" aria-hidden>
              {images.map((_, i) => (
                <span key={i} className={cn('h-1 rounded-full bg-ink transition-all', i === index ? 'w-6 opacity-90' : 'w-1.5 opacity-30')} />
              ))}
            </div>
          </>
        )}
        <span aria-hidden className="pointer-events-none absolute bottom-3 right-4 grid size-8 place-items-center rounded-full bg-ivory/85 text-ink-2 backdrop-blur">
          <Expand className="size-3.5" />
        </span>
      </div>

      <Lightbox images={images} index={index} setIndex={setIndex} open={lightbox} onOpenChange={setLightbox} name={name} />
    </div>
  );
}

function Lightbox({
  images,
  index,
  setIndex,
  open,
  onOpenChange,
  name,
}: {
  images: ImageRef[];
  index: number;
  setIndex: (i: number) => void;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  name: string;
}) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const prev = () => {
    setZoomed(false);
    setIndex((index - 1 + images.length) % images.length);
  };
  const next = () => {
    setZoomed(false);
    setIndex((index + 1) % images.length);
  };
  const img = images[index];
  return (
    <Dialog.Root open={open} onOpenChange={(v) => { setZoomed(false); onOpenChange(v); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/95" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col text-ivory outline-none"
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
          }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <Dialog.Title className="truncate text-sm">
              {name} <span className="text-ivory/50">· {index + 1} / {images.length}</span>
            </Dialog.Title>
            <Dialog.Description className="sr-only">Use the arrow keys to move between images. Click the image to zoom.</Dialog.Description>
            <Dialog.Close className="grid size-10 place-items-center rounded-full hover:bg-ivory/10" aria-label="Close">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden">
            {img && (
              <img
                src={imageUrl(img, 1600)}
                alt={img.alt || name}
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
                  setZoomed((z) => !z);
                }}
                style={{ transformOrigin: origin }}
                className={cn('mx-auto size-full object-contain transition-transform duration-500 ease-out', zoomed ? 'scale-[2.2] cursor-zoom-out' : 'cursor-zoom-in')}
              />
            )}
            {images.length > 1 && (
              <>
                <button type="button" onClick={prev} className="absolute left-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-ivory/10 hover:bg-ivory/20" aria-label="Previous image">
                  <ChevronLeft className="size-6" />
                </button>
                <button type="button" onClick={next} className="absolute right-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-ivory/10 hover:bg-ivory/20" aria-label="Next image">
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
