import { useMutation } from '@tanstack/react-query';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronLeft, ChevronRight, ImagePlus, Search, X, type LucideIcon } from 'lucide-react';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ComponentProps,
  type ComponentType,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { Link, type LinkProps } from 'react-router';
import { toast } from 'sonner';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, type ImageRef, type OrderStatus, type PaymentStatus } from '@goldshop/shared';
import { Dropdown, type DropdownProps } from '../components/ui/Dropdown';
import { Modal as BaseModal } from '../components/ui/Sheet';
import { Img, Spinner } from '../components/ui/misc';
import { api, errorMessage } from '../lib/api';
import { cn } from '../lib/utils';

/* ------------------------------------------------------------------ buttons */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'light' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_BASE =
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-[background-color,color,border-color,box-shadow] duration-200 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px';
const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-wine text-white shadow-[0_1px_2px_rgba(95,10,29,.25)] hover:bg-wine-2',
  secondary: 'border border-gold-soft bg-white text-wine hover:border-gold hover:bg-cream-2',
  ghost: 'text-ink-2 hover:bg-canvas hover:text-ink',
  gold: 'bg-gold-soft text-ink hover:bg-gold-pale',
  light: 'border border-field bg-white text-ink-2 hover:border-line-strong hover:text-ink',
  danger: 'border border-danger/30 bg-white text-danger hover:border-danger hover:bg-danger hover:text-white',
};
const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[0.8125rem]',
  md: 'h-10 px-4.5 text-sm',
  lg: 'h-12 px-6 text-[0.9375rem]',
};

const buttonClass = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md', block?: boolean) =>
  cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], block && 'w-full');

interface ButtonLook {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & ButtonLook & { loading?: boolean }>(function Button(
  { variant, size, block, icon, loading, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={cn(buttonClass(variant, size, block), className)} {...rest}>
      {loading ? <Spinner className="size-4" /> : icon}
      {children}
    </button>
  );
});

export function ButtonLink({ variant, size, block, icon, className, children, ...rest }: LinkProps & ButtonLook) {
  return (
    <Link className={cn(buttonClass(variant, size, block), className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

/** A button-styled plain link, for downloads and pages outside the admin app. */
export function ButtonAnchor({ variant, size, block, icon, className, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & ButtonLook) {
  return (
    <a className={cn(buttonClass(variant, size, block), className)} {...rest}>
      {icon}
      {children}
    </a>
  );
}

/** "View all →" style text link. */
export function ArrowLink({ className, children, ...rest }: LinkProps) {
  return (
    <Link
      className={cn('inline-flex shrink-0 items-center gap-1 text-[0.8125rem] font-semibold text-wine underline decoration-wine/30 underline-offset-4 transition-colors hover:decoration-wine', className)}
      {...rest}
    >
      {children}
      <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="mb-3 inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-muted transition-colors hover:text-wine">
      <ArrowLeft className="size-3.5" aria-hidden /> {children}
    </Link>
  );
}

/* ----------------------------------------------------------- page furniture */

export function PageHeader({ title, description, actions, back }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; back?: { to: string; label: string } }) {
  return (
    <div className="mb-6">
      {back && <BackLink to={back.to}>{back.label}</BackLink>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[2rem] font-semibold leading-[1.1] text-ink md:text-[2.5rem]">{title}</h1>
          {description && <div className="mt-1.5 max-w-3xl text-[0.9375rem] leading-relaxed text-muted">{description}</div>}
        </div>
        {actions && <div className="cta-row items-center !gap-2.5">{actions}</div>}
      </div>
    </div>
  );
}

/** Any icon component: lucide icons and the admin's own SVG marks. */
export type IconComponent = ComponentType<{ className?: string; strokeWidth?: number }>;

/** A gold icon on a cream tile, as used in card headers and stat cards. */
export function IconTile({ icon: Icon, size = 'md', className }: { icon: IconComponent; size?: 'sm' | 'md'; className?: string }) {
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-xl bg-cream text-gold', size === 'sm' ? 'size-10' : 'size-12', className)} aria-hidden>
      <Icon className={size === 'sm' ? 'size-[1.125rem]' : 'size-5.5'} strokeWidth={1.7} />
    </span>
  );
}

export const cardClass = 'rounded-2xl border border-hairline bg-white shadow-[0_1px_2px_rgba(30,24,19,.04)]';

export function Card({
  title,
  icon,
  actions,
  children,
  className,
  padded = true,
}: {
  title?: ReactNode;
  icon?: IconComponent;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  const head = Boolean(title || actions);
  return (
    <section className={cn(cardClass, className)}>
      {head && (
        <div className={cn('flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 pt-5', padded ? 'pb-1' : 'pb-4')}>
          <div className="flex min-w-0 items-center gap-3">
            {icon && <IconTile icon={icon} size="sm" />}
            {title && <h2 className="font-display text-[1.375rem] font-semibold leading-tight text-ink">{title}</h2>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? (head ? 'px-5 pb-5 pt-3' : 'p-5') : ''}>{children}</div>
    </section>
  );
}

/** A small label + value tile for report totals. */
export function StatTile({ label, value, sub, icon }: { label: string; value: ReactNode; sub?: ReactNode; icon?: IconComponent }) {
  return (
    <div className={cn(cardClass, 'flex items-start gap-3.5 p-4')}>
      {icon && <IconTile icon={icon} size="sm" />}
      <div className="min-w-0">
        <p className="text-[0.8125rem] text-muted">{label}</p>
        <p className="mt-0.5 font-display text-[1.625rem] font-semibold leading-tight text-ink tabular">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- pills */

export type Tone = 'neutral' | 'gold' | 'success' | 'danger' | 'warn' | 'ink' | 'info';

const PILL_TONES: Record<Tone, string> = {
  neutral: 'bg-[#f1eee9] text-ink-2',
  gold: 'bg-[#fef2d5] text-[#8f5f0a]',
  success: 'bg-[#e4f6ea] text-[#1f7443]',
  danger: 'bg-[#fde6e5] text-[#b0241b]',
  warn: 'bg-[#fdebdc] text-[#9c4510]',
  ink: 'bg-ink text-white',
  info: 'bg-[#e8f0fa] text-[#245a9b]',
};
const DOT_TONES: Record<Tone, string> = {
  neutral: 'bg-subtle',
  gold: 'bg-[#e3a320]',
  success: 'bg-[#2f9a5b]',
  danger: 'bg-[#d6382c]',
  warn: 'bg-[#e0731d]',
  ink: 'bg-white',
  info: 'bg-[#3a78c4]',
};

/** Rounded status pill. Named Badge so admin pages read the same as the storefront's. */
export function Badge({ children, tone = 'neutral', dot, className }: { children: ReactNode; tone?: Tone; dot?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none', PILL_TONES[tone], className)}>
      {dot && <span aria-hidden className={cn('size-1.5 rounded-full', DOT_TONES[tone])} />}
      {children}
    </span>
  );
}

const STATUS_TONE: Record<OrderStatus, Tone> = {
  pending_payment: 'warn',
  payment_review: 'danger',
  confirmed: 'gold',
  processing: 'gold',
  shipped: 'info',
  out_for_delivery: 'info',
  delivered: 'success',
  cancelled: 'neutral',
  returned: 'neutral',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={STATUS_TONE[status]} dot>{ORDER_STATUS_LABELS[status]}</Badge>;
}

export function PaymentBadge({ status, method }: { status: PaymentStatus; method?: string }) {
  return (
    <Badge tone={status === 'paid' ? 'success' : status === 'pending' ? 'warn' : 'neutral'}>
      {method ? `${method === 'cod' ? 'COD' : 'Online'} · ` : ''}
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function Alert({ tone = 'neutral', children, className }: { tone?: 'neutral' | 'warn' | 'danger' | 'success'; children: ReactNode; className?: string }) {
  const tones = {
    neutral: 'border-hairline bg-cream-2 text-ink-2',
    warn: 'border-[#f1d9a6] bg-[#fdf6e6] text-[#7a4f00]',
    danger: 'border-danger/25 bg-danger-bg text-danger',
    success: 'border-success/25 bg-success-bg text-success',
  };
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('rounded-xl border px-4 py-3 text-sm leading-relaxed', tones[tone], className)}>
      {children}
    </div>
  );
}

export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" className="rounded-xl border border-danger/25 bg-danger-bg px-4 py-3 text-sm text-danger">
      {children}
    </div>
  );
}

/* --------------------------------------------------------------- tables */

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  empty = 'Nothing here yet.',
  loading,
  bare,
  minWidth = '40rem',
}: {
  rows?: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  loading?: boolean;
  /** Inside a Card: no frame of its own, the header row becomes a rounded band. */
  bare?: boolean;
  minWidth?: string;
}) {
  return (
    // relative: keeps absolutely positioned bits (sr-only labels) inside the scroll box.
    <div className={cn('relative overflow-x-auto', !bare && cardClass)}>
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead>
          <tr className={cn('text-[0.8125rem] text-muted', !bare && 'border-b border-hairline bg-canvas/70')}>
            {columns.map((c, i) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  'px-4 py-3 font-semibold',
                  bare && 'bg-canvas',
                  bare && i === 0 && 'rounded-l-lg',
                  bare && i === columns.length - 1 && 'rounded-r-lg',
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-muted">
                <Spinner className="mx-auto size-5" />
              </td>
            </tr>
          ) : !rows?.length ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-muted">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr
                key={rowKey(r)}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={cn('align-middle text-ink-2', onRowClick && 'cursor-pointer transition-colors hover:bg-cream-2')}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-4 py-3.5', c.className)}>
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Pager({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
  const step = 'grid size-9 place-items-center rounded-lg border border-field bg-white text-ink-2 transition-colors hover:border-gold hover:text-wine disabled:pointer-events-none disabled:opacity-40';
  if (pages <= 1) return <p className="mt-3 px-1 text-[0.8125rem] text-muted">{total} total</p>;
  return (
    <div className="mt-3 flex items-center justify-between gap-3 px-1 text-[0.8125rem] text-muted">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-1.5">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} className={step} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </button>
        <button disabled={page >= pages} onClick={() => onPage(page + 1)} className={step} aria-label="Next page">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** Segmented tabs; scrolls sideways on phones rather than wrapping. */
export function FilterTabs<T extends string>({ value, options, onChange, className }: { value: T; options: { value: T; label: string; count?: number }[]; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn('mb-4 max-w-full overflow-x-auto scrollbar-none', className)}>
      <div className="inline-flex gap-1 rounded-xl border border-hairline bg-white p-1" role="tablist">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              role="tab"
              aria-selected={on}
              onClick={() => onChange(o.value)}
              className={cn(
                'inline-flex h-8.5 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[0.8125rem] font-semibold transition-colors',
                on ? 'bg-wine text-white shadow-[0_1px_2px_rgba(95,10,29,.25)]' : 'text-muted hover:bg-canvas hover:text-ink',
              )}
            >
              {o.label}
              {o.count !== undefined && <span className={cn('rounded-full px-1.5 py-0.5 text-[0.6875rem] leading-none tabular', on ? 'bg-white/20' : 'bg-canvas text-ink-2')}>{o.count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Tabs that are links, for sections that live at their own URLs. */
export function LinkTabs({ value, options }: { value: string; options: { value: string; label: string; to: string }[] }) {
  return (
    <div className="mb-5 max-w-full overflow-x-auto scrollbar-none">
      <nav className="inline-flex gap-1 rounded-xl border border-hairline bg-white p-1">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <Link
              key={o.value}
              to={o.to}
              aria-current={on ? 'page' : undefined}
              className={cn(
                'inline-flex h-8.5 shrink-0 items-center whitespace-nowrap rounded-lg px-3 text-[0.8125rem] font-semibold transition-colors',
                on ? 'bg-wine text-white shadow-[0_1px_2px_rgba(95,10,29,.25)]' : 'text-muted hover:bg-canvas hover:text-ink',
              )}
            >
              {o.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/* --------------------------------------------------------------- form controls */

export const adminInput =
  'h-10 w-full rounded-lg border border-field bg-white px-3 text-sm text-ink placeholder:text-subtle transition-[border-color,box-shadow] hover:border-line-strong focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 aria-[invalid=true]:border-danger disabled:bg-canvas disabled:text-muted';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, rows = 4, ...rest }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(adminInput, 'h-auto py-2.5 leading-relaxed', className)} {...rest} />;
});

/** A search box that submits on Enter. */
export function SearchField({ value, onChange, onSubmit, placeholder, label, className }: { value: string; onChange: (v: string) => void; onSubmit: () => void; placeholder: string; label: string; className?: string }) {
  return (
    <form
      role="search"
      className={cn('relative', className)}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input enterKeyHint="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn(adminInput, 'pl-9')} aria-label={label} />
    </form>
  );
}

// Radix Select can't hold "" as an item value, so an "empty" choice travels under this stand-in.
const EMPTY = '__empty__';

/**
 * The admin's select: the store's Radix dropdown in the admin look. Options may include an empty
 * value (e.g. "All payments"); `allowEmpty` adds one with that label. Width comes from `className`.
 */
export function AdminSelect({
  value,
  onChange,
  options,
  allowEmpty,
  className,
  ...rest
}: Omit<DropdownProps, 'size' | 'tone' | 'className' | 'options' | 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: ReactNode; hint?: ReactNode; disabled?: boolean }[];
  allowEmpty?: string;
  className?: string;
}) {
  const all = allowEmpty !== undefined ? [{ value: '', label: allowEmpty }, ...options] : options;
  const hasEmpty = all.some((o) => o.value === '');
  return (
    <div className={cn('min-w-0', className)}>
      <Dropdown
        {...rest}
        size="sm"
        tone="admin"
        value={value === '' && hasEmpty ? EMPTY : value}
        onChange={(v) => onChange(v === EMPTY ? '' : v)}
        options={all.map((o) => (o.value === '' ? { ...o, value: EMPTY } : o))}
      />
    </div>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50', checked ? 'bg-wine' : 'bg-[#d9d3c9]')}
    >
      <span className={cn('inline-block size-4.5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[1.375rem]' : 'translate-x-[0.1875rem]')} />
    </button>
  );
}

export function SwitchRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        {description && <p className="text-xs text-muted">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

/** Rupee input that stores paise. */
export function MoneyInput({ value, onChange, id, placeholder, ...rest }: { value: number; onChange: (paise: number) => void; id?: string; placeholder?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) {
  const [text, setText] = useState(value ? String(value / 100) : '');
  const [last, setLast] = useState(value);
  if (value !== last) {
    setLast(value);
    setText(value ? String(value / 100) : '');
  }
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">₹</span>
      <input
        id={id}
        inputMode="decimal"
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          const t = e.target.value.replace(/[^0-9.]/g, '');
          setText(t);
          const p = Math.round(Number(t || 0) * 100);
          setLast(p);
          onChange(p);
        }}
        className={cn(adminInput, 'pl-7 tabular')}
        {...rest}
      />
    </div>
  );
}

/** Uploads images through the server's processing pipeline and manages an ordered list. */
export function ImagesField({
  value,
  onChange,
  folder = 'products',
  max = 15,
  single,
  altPlaceholder = 'Alt text',
  blankAlt,
  shape = 'photo',
}: {
  value: ImageRef[];
  onChange: (v: ImageRef[]) => void;
  folder?: string;
  max?: number;
  single?: boolean;
  altPlaceholder?: string;
  /** Start each upload with an empty alt text instead of its file name (when the text is shown as a caption). */
  blankAlt?: boolean;
  /** 'logo' and 'mark' show the whole image on white (wide or square) instead of a cropped portrait tile. */
  shape?: 'photo' | 'logo' | 'mark';
}) {
  const tile = shape === 'logo' ? 'aspect-[5/2]' : shape === 'mark' ? 'aspect-square' : 'aspect-[4/5]';
  const input = useRef<HTMLInputElement>(null);
  const upload = useMutation({
    // One request per photo: hosts such as Cloud Run refuse request bodies over 32 MB.
    mutationFn: async (files: File[]) => {
      const uploaded: ImageRef[] = [];
      for (const f of files.slice(0, single ? 1 : max - value.length)) {
        const form = new FormData();
        form.append('files', f);
        try {
          uploaded.push(...(await api<ImageRef[]>(`/admin/uploads`, { form, query: { folder } })));
        } catch (e) {
          // keep the photos that did upload
          if (!uploaded.length) throw e;
          toast.error(errorMessage(e));
          break;
        }
      }
      return uploaded;
    },
    onSuccess: (uploaded) => {
      const imgs = blankAlt ? uploaded.map((img) => ({ ...img, alt: '' })) : uploaded;
      onChange(single ? imgs.slice(0, 1) : [...value, ...imgs].slice(0, max));
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const tool = 'grid size-7 place-items-center rounded-md bg-white/95 shadow-sm';
  return (
    <div>
      <div className={cn('grid gap-3', shape === 'logo' ? 'max-w-[20rem] grid-cols-1' : shape === 'mark' ? 'max-w-[10rem] grid-cols-1' : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5')}>
        {value.map((img, i) => (
          <div key={`${img.key}-${i}`} className="group relative overflow-hidden rounded-xl border border-hairline bg-canvas">
            <div className={cn(tile, shape !== 'photo' && 'bg-white p-4')}>
              <Img image={img} sizes={shape === 'logo' ? '320px' : '160px'} width={480} className={cn('size-full', shape === 'photo' ? 'object-cover' : 'object-contain')} />
            </div>
            {i === 0 && !single && <span className="absolute left-1.5 top-1.5 rounded-md bg-wine px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase text-white">Main</span>}
            <div className="absolute right-1 top-1 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              {!single && (
                <>
                  <button type="button" onClick={() => move(i, -1)} className={tool} aria-label="Move earlier"><ArrowUp className="size-3.5" /></button>
                  <button type="button" onClick={() => move(i, 1)} className={tool} aria-label="Move later"><ArrowDown className="size-3.5" /></button>
                </>
              )}
              <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className={cn(tool, 'hover:text-danger')} aria-label="Remove image"><X className="size-3.5" /></button>
            </div>
            <input
              value={img.alt}
              onChange={(e) => onChange(value.map((x, k) => (k === i ? { ...x, alt: e.target.value } : x)))}
              placeholder={altPlaceholder}
              aria-label={`Alt text for image ${i + 1}`}
              className="w-full border-t border-hairline bg-white px-2 py-1.5 text-xs focus:outline-none"
            />
          </div>
        ))}
        {(single ? value.length === 0 : value.length < max) && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={upload.isPending}
            className={cn('grid place-items-center rounded-xl border border-dashed border-line-strong bg-cream-2 text-xs font-semibold text-muted transition-colors hover:border-gold hover:text-wine', tile)}
          >
            {upload.isPending ? <Spinner className="size-5" /> : (
              <span className="flex flex-col items-center gap-2"><ImagePlus className="size-5" />Upload</span>
            )}
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple={!single}
        hidden
        onChange={(e) => {
          // Copy the files first: clearing the input below empties its live FileList before the upload reads it.
          const files = [...(e.target.files ?? [])];
          if (files.length) upload.mutate(files);
          e.target.value = '';
        }}
      />
      <p className="mt-2 text-xs text-muted">JPEG, PNG, WebP or AVIF up to 10 MB. Images are resized and converted automatically; location data is removed.</p>
    </div>
  );
}

/* --------------------------------------------------------------- dialogs */

export function Modal(props: Omit<ComponentProps<typeof BaseModal>, 'admin'>) {
  return <BaseModal {...props} admin />;
}

export function ConfirmButton({
  children,
  title,
  description,
  onConfirm,
  variant = 'danger',
  size = 'sm',
  confirmLabel = 'Confirm',
}: {
  children: ReactNode;
  title: string;
  description?: string;
  onConfirm: () => Promise<unknown> | void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  confirmLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant={variant === 'danger' ? 'danger' : 'primary'}
              loading={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onConfirm();
                  setOpen(false);
                } catch (e) {
                  toast.error(errorMessage(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {confirmLabel}
            </Button>
          </>
        }
      />
    </>
  );
}

/* --------------------------------------------------------------- menus */

const MenuContext = createContext<() => void>(() => {});

/**
 * A small popup menu anchored to its trigger. It renders in a portal (so table overflow never
 * clips it), closes on Escape, outside clicks and choosing an item, and moves focus with the arrow keys.
 */
export function Menu({
  label,
  trigger,
  triggerClassName,
  children,
  panelClassName,
}: {
  label: string;
  trigger: ReactNode;
  triggerClassName?: string;
  children: ReactNode;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    btn.current?.focus();
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btn.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
    };
    place();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !btn.current?.contains(t)) setOpen(false);
    };
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    document.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  useEffect(() => {
    if (open && pos) panel.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open, pos]);

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'Tab') {
      setOpen(false);
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const items = [...(panel.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open &&
        pos &&
        createPortal(
          <MenuContext.Provider value={close}>
            <div
              ref={panel}
              role="menu"
              aria-label={label}
              onKeyDown={onKeyDown}
              onClick={(e) => e.stopPropagation()}
              style={{ top: pos.top, right: pos.right }}
              className={cn(
                'fixed z-[60] min-w-[13rem] max-w-[calc(100vw-1rem)] origin-top-right animate-[dropdown-in_140ms_ease-out] rounded-xl border border-hairline bg-white p-1.5 shadow-[0_18px_44px_-16px_rgba(30,24,19,.3)]',
                panelClassName,
              )}
            >
              {children}
            </div>
          </MenuContext.Provider>,
          document.body,
        )}
    </>
  );
}

const MENU_ITEM = 'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink-2 outline-none transition-colors hover:bg-canvas hover:text-ink focus-visible:bg-canvas focus-visible:text-ink';

export function MenuItem({
  to,
  href,
  newTab,
  onSelect,
  icon: Icon,
  children,
  danger,
}: {
  to?: string;
  href?: string;
  newTab?: boolean;
  onSelect?: () => void;
  icon?: LucideIcon;
  children: ReactNode;
  danger?: boolean;
}) {
  const close = useContext(MenuContext);
  const cls = cn(MENU_ITEM, danger && 'text-danger hover:text-danger focus-visible:text-danger');
  const inner = (
    <>
      {Icon && <Icon className="size-4 shrink-0 opacity-80" strokeWidth={1.7} aria-hidden />}
      <span className="min-w-0 flex-1">{children}</span>
    </>
  );
  const done = () => {
    onSelect?.();
    close();
  };
  if (to) {
    return (
      <Link role="menuitem" tabIndex={-1} to={to} target={newTab ? '_blank' : undefined} onClick={done} className={cls}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a role="menuitem" tabIndex={-1} href={href} target={newTab ? '_blank' : undefined} rel={newTab ? 'noreferrer' : undefined} onClick={done} className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <button role="menuitem" tabIndex={-1} type="button" onClick={done} className={cls}>
      {inner}
    </button>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="my-1.5 h-px bg-hairline" />;
}
