import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cn } from '../../lib/utils';
import { Spinner } from './misc';

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'light' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const base =
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xs font-semibold uppercase tracking-[0.14em] transition-[background-color,color,border-color,box-shadow,transform] duration-300 ease-[var(--ease-lux)] disabled:pointer-events-none disabled:opacity-50 active:translate-y-px';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-ivory hover:bg-ink-2 shadow-[0_1px_0_rgba(0,0,0,.04)]',
  secondary: 'border border-ink/80 text-ink hover:bg-ink hover:text-ivory',
  ghost: 'text-ink hover:bg-sand',
  gold: 'bg-gold-soft text-ink hover:bg-gold-pale',
  light: 'border border-ivory/60 text-ivory hover:bg-ivory hover:text-ink',
  danger: 'border border-danger/40 text-danger hover:bg-danger hover:text-white',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[0.6875rem]',
  md: 'h-11 px-6 text-xs',
  lg: 'h-13 px-8 text-xs',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, block, icon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], block && 'w-full', className)}
      {...rest}
    >
      {loading ? <Spinner className="size-4" /> : icon}
      <span className={cn(loading && 'opacity-90')}>{children}</span>
    </button>
  );
});

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  block,
  className,
  icon,
  children,
  ...rest
}: LinkProps & { variant?: Variant; size?: Size; block?: boolean; icon?: ReactNode }) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], block && 'w-full', className)} {...rest}>
      {icon}
      <span>{children}</span>
    </Link>
  );
}

/** Understated text link with an animated underline. */
export function TextLink({ className, children, ...rest }: LinkProps) {
  return (
    <Link
      className={cn(
        'group inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline decoration-gold/50 decoration-1 underline-offset-[6px] transition-colors hover:decoration-gold',
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}
