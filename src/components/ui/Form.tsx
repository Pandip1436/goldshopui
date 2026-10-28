import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { ChevronDown, Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

const control =
  'block w-full rounded-xs border border-line-strong/70 bg-paper px-3.5 text-[0.9375rem] text-ink placeholder:text-subtle transition-colors focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger disabled:bg-sand disabled:text-muted';

/** Label + control + hint + error, wired together for screen readers. */
export function Field({
  label,
  hint,
  error,
  children,
  className,
  optional,
  required,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactElement<{ id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>;
  className?: string;
  optional?: boolean;
  /** Marks the label with an asterisk; the control itself should carry aria-required. */
  required?: boolean;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="flex items-baseline justify-between text-[0.8125rem] font-semibold text-ink-2">
        <span>
          {label}
          {required && (
            <span aria-hidden className="ml-0.5 text-danger">
              *
            </span>
          )}
        </span>
        {optional && <span className="text-xs font-normal text-subtle">Optional</span>}
      </label>
      {isValidElement(children)
        ? cloneElement(children, { id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })
        : children}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn(control, 'h-12', className)} {...rest} />;
});

/** A tall input with a leading icon and an optional control at the end; Field's id and aria props reach the input. */
export const IconInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { icon?: LucideIcon; trailing?: ReactNode }>(function IconInput(
  { icon: Icon, trailing, className, ...rest },
  ref,
) {
  return (
    <div className="relative">
      {Icon && <Icon aria-hidden strokeWidth={1.5} className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-2" />}
      <input ref={ref} className={cn(control, 'h-14 !rounded-md bg-white', Icon && 'pl-12', Boolean(trailing) && 'pr-12', className)} {...rest} />
      {trailing && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div>}
    </div>
  );
});

/** A password field with a show/hide toggle. */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { icon?: LucideIcon }>(function PasswordInput(props, ref) {
  const [shown, setShown] = useState(false);
  return (
    <IconInput
      ref={ref}
      type={shown ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? 'Hide password' : 'Show password'}
          aria-pressed={shown}
          className="grid size-10 place-items-center rounded-md text-ink-2 hover:text-ink"
        >
          {shown ? <EyeOff className="size-5" strokeWidth={1.5} /> : <Eye className="size-5" strokeWidth={1.5} />}
        </button>
      }
      {...props}
    />
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, rows = 4, ...rest },
  ref,
) {
  return <textarea ref={ref} rows={rows} className={cn(control, 'py-3 leading-relaxed', className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(control, 'h-12 appearance-none pr-10', className)} {...rest}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
});

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; description?: ReactNode }>(
  function Checkbox({ label, description, className, ...rest }, ref) {
    const id = useId();
    return (
      <div className={cn('flex gap-3', className)}>
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="mt-0.5 size-4.5 shrink-0 cursor-pointer rounded-xs border-line-strong accent-ink"
          {...rest}
        />
        <label htmlFor={id} className="cursor-pointer text-sm leading-snug text-ink-2">
          {label}
          {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
        </label>
      </div>
    );
  },
);

export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" className="rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
      {children}
    </div>
  );
}
