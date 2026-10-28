import { useEffect, useState, type CSSProperties } from 'react';
import { useNavigation } from 'react-router';
import { imageUrl } from '@goldshop/shared';
import { useSettings } from '../lib/hooks';
import { cn } from '../lib/utils';
import { LotusMark } from './AboutLegacy';

/**
 * The store's in-page loader: its jewelled lotus mark with a soft gold glint passing over it (as on
 * the opening screen in index.html), over a shimmering hairline. Before a mark is uploaded, the
 * lotus line drawing draws itself instead. Still for anyone who prefers reduced motion.
 */
export function BrandLoader({ className, label = 'Loading' }: { className?: string; label?: string }) {
  const mark = useSettings().data?.brand.mark;
  const src = mark ? imageUrl(mark, 480) : undefined;
  return (
    <div role="status" className={cn('flex flex-col items-center justify-center gap-5', className)}>
      {src ? (
        <span className="relative block h-16 w-28">
          <img src={src} alt="" className="size-full animate-[logo-in_0.8s_ease-out_both] object-contain motion-reduce:animate-none" />
          <span
            aria-hidden
            className="absolute inset-0 animate-[logo-shine_2.6s_ease-in-out_0.6s_infinite] bg-[linear-gradient(105deg,transparent_43%,rgba(255,238,196,.6)_50%,transparent_57%)] bg-[length:260%_100%] bg-no-repeat [mask:var(--mark)_center/contain_no-repeat] motion-reduce:hidden"
            style={{ '--mark': `url(${src})` } as CSSProperties}
          />
        </span>
      ) : (
        <LotusMark className="w-16 text-gold [&_path]:animate-[lotus-draw_2.4s_ease-in-out_infinite] [&_path]:[stroke-dasharray:100] motion-reduce:[&_path]:animate-none" />
      )}
      <span aria-hidden className="relative h-0.5 w-28 overflow-hidden rounded-full bg-gold/20">
        <span className="absolute inset-y-0 left-0 w-2/5 animate-[shimmer-sweep_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-gold to-transparent motion-reduce:left-[30%] motion-reduce:animate-none" />
      </span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * A thin gold bar along the top of the window while the next page loads. It waits a moment
 * before showing, so quick page changes don't flicker, then fills and fades when the page arrives.
 */
export function RouteProgress() {
  const busy = useNavigation().state !== 'idle';
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle');

  useEffect(() => {
    if (busy) {
      const t = setTimeout(() => setPhase('loading'), 150);
      return () => clearTimeout(t);
    }
    setPhase((p) => (p === 'loading' ? 'done' : 'idle'));
  }, [busy]);

  useEffect(() => {
    if (phase !== 'done') return;
    const t = setTimeout(() => setPhase('idle'), 450);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === 'idle') return null;
  return (
    <>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none fixed inset-x-0 top-0 z-[95] h-[3px] origin-left bg-gradient-to-r from-gold-soft via-gold to-gold-deep shadow-[0_0_10px_rgba(217,184,114,.75)]',
          phase === 'loading' ? 'animate-[route-progress_6s_cubic-bezier(.08,.6,.2,1)_forwards]' : 'opacity-0 transition-opacity duration-300',
        )}
      />
      {phase === 'loading' && (
        <span role="status" className="sr-only">
          Loading page
        </span>
      )}
    </>
  );
}
