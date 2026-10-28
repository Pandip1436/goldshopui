import * as RSelect from '@radix-ui/react-select';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';
import type { ReactNode, Ref } from 'react';
import { cn } from '../../lib/utils';

export interface DropdownOption {
  value: string;
  label: ReactNode;
  /** Shown under the label in the list, e.g. a price or a note. */
  hint?: ReactNode;
  disabled?: boolean;
}

/**
 * The store's dropdown: a styled button that opens a list in the brand fonts and colours, with a
 * check beside the current choice. Built on Radix Select, so it works with the keyboard (arrows,
 * typing to jump, Enter, Escape) and with screen readers, and fills a hidden native select for
 * forms and autofill when given a `name`.
 *
 * Field passes `id` and the aria props through, so its label and errors reach the trigger.
 */
// cn() joins without merging, so each look lives in one place instead of being overridden by callers.
const SIZES = {
  sm: 'h-10 px-3 text-[0.8125rem]',
  md: 'h-12 px-3.5 text-[0.9375rem]',
  lg: 'h-14 px-4 text-base',
};
const TONES = {
  light: 'rounded-md border-line-strong/70 bg-white hover:border-gold focus-visible:border-gold focus-visible:ring-gold/30 data-[state=open]:border-gold data-[state=open]:ring-gold/25',
  paper: 'rounded-lg border-transparent bg-paper hover:border-gold-soft focus-visible:ring-gold-soft/60 data-[state=open]:ring-gold-soft/60',
  admin: 'rounded-lg border-field bg-white hover:border-line-strong focus-visible:border-gold focus-visible:ring-gold/20 data-[state=open]:border-gold data-[state=open]:ring-gold/20',
};

export interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  icon?: LucideIcon;
  size?: keyof typeof SIZES;
  /** `paper` is the borderless cream field used on dark cards; `admin` matches the admin panel's inputs. */
  tone?: keyof typeof TONES;
  /** Width and layout only: height, padding, text size and colours come from `size` and `tone`. */
  className?: string;
  contentClassName?: string;
  name?: string;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
  /** Control the list from outside, e.g. a "Choose size" button that opens it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  id?: string;
  triggerRef?: Ref<HTMLButtonElement>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

export function Dropdown({
  value,
  onChange,
  options,
  placeholder = 'Choose…',
  icon: Icon,
  size = 'md',
  tone = 'light',
  className,
  contentClassName,
  name,
  autoComplete,
  disabled,
  required,
  open,
  onOpenChange,
  id,
  triggerRef,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: DropdownProps) {
  // Radix treats "" as "no value"; keep the placeholder showing for it.
  const current = value === '' ? undefined : value;
  return (
    <RSelect.Root value={current} onValueChange={onChange} name={name} autoComplete={autoComplete} disabled={disabled} required={required} open={open} onOpenChange={onOpenChange}>
      <RSelect.Trigger
        id={id}
        ref={triggerRef}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        className={cn(
          'group flex w-full items-center gap-2.5 border text-left text-ink outline-none transition-[border-color,box-shadow]',
          'focus-visible:ring-2 data-[state=open]:ring-2 aria-[invalid=true]:border-danger disabled:cursor-not-allowed disabled:bg-sand disabled:text-muted',
          SIZES[size],
          TONES[tone],
          className,
        )}
      >
        {Icon && <Icon className="size-4.5 shrink-0 text-gold-deep" strokeWidth={1.6} aria-hidden />}
        <span className="min-w-0 flex-1 truncate data-[placeholder]:text-subtle [&>span[data-placeholder]]:text-subtle">
          <RSelect.Value placeholder={<span className="text-subtle">{placeholder}</span>} />
        </span>
        <RSelect.Icon asChild>
          <ChevronDown className="size-4 shrink-0 text-ink-2 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
        </RSelect.Icon>
      </RSelect.Trigger>

      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={6}
          collisionPadding={12}
          className={cn(
            'z-[70] max-h-[min(22rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-gold/40 bg-paper shadow-[0_24px_50px_-20px_rgba(63,18,21,.45)]',
            'origin-[var(--radix-select-content-transform-origin)] data-[state=open]:animate-[dropdown-in_160ms_ease-out]',
            contentClassName,
          )}
        >
          <RSelect.ScrollUpButton className="grid h-7 place-items-center text-ink-2">
            <ChevronDown className="size-4 rotate-180" aria-hidden />
          </RSelect.ScrollUpButton>
          <RSelect.Viewport className="p-1.5">
            {options.map((o) => (
              <RSelect.Item
                key={o.value}
                value={o.value}
                disabled={o.disabled}
                className={cn(
                  'relative flex cursor-pointer select-none items-center gap-3 rounded-md py-2.5 pl-3 pr-9 text-ink-2 outline-none transition-colors',
                  size === 'sm' ? 'text-sm' : 'text-[0.9375rem]',
                  'data-[highlighted]:bg-gold-pale/45 data-[highlighted]:text-ink data-[state=checked]:font-semibold data-[state=checked]:text-maroon',
                  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45',
                )}
              >
                <span className="min-w-0">
                  <RSelect.ItemText>{o.label}</RSelect.ItemText>
                  {o.hint && <span className="block text-xs font-normal text-muted">{o.hint}</span>}
                </span>
                <RSelect.ItemIndicator className="absolute right-3 inline-flex">
                  <Check className="size-4 text-gold-deep" strokeWidth={2.2} aria-hidden />
                </RSelect.ItemIndicator>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
          <RSelect.ScrollDownButton className="grid h-7 place-items-center text-ink-2">
            <ChevronDown className="size-4" aria-hidden />
          </RSelect.ScrollDownButton>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}
