import { cn } from '../lib/utils';

/** The brand mark: a lamp flame inside a temple arch. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 48" className={className} fill="none" aria-hidden>
      <path d="M20 2C9.5 2 3 10.2 3 20.4V46h34V20.4C37 10.2 30.5 2 20 2Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20 9.5C12.6 9.5 8 15.2 8 22.4V46" stroke="currentColor" strokeWidth=".8" opacity=".55" />
      <path d="M20 9.5c7.4 0 12 5.7 12 12.9V46" stroke="currentColor" strokeWidth=".8" opacity=".55" />
      <path d="M20 17c3.4 4.2 5.1 7.5 5.1 10.2a5.1 5.1 0 0 1-10.2 0c0-2.7 1.7-6 5.1-10.2Z" fill="currentColor" />
      <path d="M13 38h14" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/**
 * Text wordmark built from the store name in settings, so renaming the store in the admin
 * updates the logo everywhere. Long names tighten their tracking so the centred header never overflows.
 */
export function Wordmark({ name, className, compact }: { name: string; className?: string; compact?: boolean }) {
  const long = name.length > 10;
  return (
    <span className={cn('inline-flex items-center', className)}>
      <span
        className={cn(
          'whitespace-nowrap font-display font-semibold uppercase leading-none',
          compact
            ? long
              ? 'text-[0.95rem] tracking-[0.14em] sm:text-[1.05rem] sm:tracking-[0.24em]'
              : 'text-[1.05rem] tracking-[0.28em]'
            : long
              ? 'text-[1.25rem] tracking-[0.2em]'
              : 'text-[1.35rem] tracking-[0.28em]',
        )}
      >
        {name}
      </span>
    </span>
  );
}
