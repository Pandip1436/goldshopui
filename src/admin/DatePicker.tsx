import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';
import { MONTHS, MONTHS_SHORT, WEEKDAYS, addDays, addMonths, formatDay, formatRange, isDay, longLabel, makeDay, parts, todayIST, weekday, type RangePreset } from './dates';
import { adminInput } from './ui';

/* The admin's own date pickers, in place of the browser's date input (helpers in ./dates). */

/* ------------------------------------------------------------------ popover */

/**
 * A panel anchored to its trigger. It renders in a portal (inside an open dialog when there is
 * one, so the dialog's focus trap and outside-click handling still treat it as inside), flips
 * above the trigger when there's no room below, and closes on Escape or a click elsewhere.
 */
function Popover({ anchor, onClose, label, children }: { anchor: RefObject<HTMLElement | null>; onClose: (refocus: boolean) => void; label: string; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const container = anchor.current?.closest<HTMLElement>('[role="dialog"]') ?? document.body;
  const close = useRef(onClose);
  close.current = onClose;

  useLayoutEffect(() => {
    const place = () => {
      const a = anchor.current?.getBoundingClientRect();
      const p = panel.current;
      if (!a || !p) return;
      const M = 8;
      const left = Math.min(Math.max(M, a.left), window.innerWidth - p.offsetWidth - M);
      let top = a.bottom + 6;
      if (top + p.offsetHeight > window.innerHeight - M && a.top - 6 - p.offsetHeight >= M) top = a.top - 6 - p.offsetHeight;
      setPos({ top, left: Math.max(M, left) });
    };
    place();
    const ro = new ResizeObserver(place);
    if (panel.current) ro.observe(panel.current);
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !anchor.current?.contains(t)) close.current(false);
    };
    // Window capture runs before a surrounding dialog's own Escape handler, so Escape closes only this panel.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      e.preventDefault();
      close.current(true);
    };
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey, true);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [anchor]);

  return createPortal(
    <div
      ref={panel}
      role="dialog"
      aria-label={label}
      onBlur={(e) => {
        // Tabbing out of the panel closes it (a click inside on blank space has no relatedTarget).
        const next = e.relatedTarget as Node | null;
        if (next && !panel.current?.contains(next) && !anchor.current?.contains(next)) close.current(false);
      }}
      // Until it's measured and placed it's transparent, not hidden, so the calendar can take focus at once.
      style={pos ? { top: pos.top, left: pos.left } : { top: 0, left: 0, opacity: 0, pointerEvents: 'none' }}
      className="fixed z-[80] max-w-[calc(100vw-1rem)] animate-[dropdown-in_140ms_ease-out] rounded-2xl border border-hairline bg-white shadow-[0_24px_60px_-20px_rgba(30,24,19,.35)]"
    >
      {children}
    </div>,
    container,
  );
}

/* ------------------------------------------------------------------ calendar */

interface CalendarProps {
  /** A single chosen day. */
  selected?: string;
  /** A range (the end may be a hover preview while the second day is being chosen). */
  rangeFrom?: string;
  rangeTo?: string;
  min?: string;
  max?: string;
  /** The day that gets keyboard focus (and decides the month shown) when the calendar opens. */
  initial: string;
  onPick: (day: string) => void;
  onHover?: (day: string | null) => void;
}

function Calendar({ selected, rangeFrom, rangeTo, min, max, initial, onPick, onHover }: CalendarProps) {
  const [focus, setFocus] = useState(initial);
  const [view, setView] = useState<'days' | 'months'>('days');
  const grid = useRef<HTMLTableElement>(null);
  const keyboard = useRef(false);
  const titleId = useId();
  const today = todayIST();
  const { y, m } = parts(focus);
  const [lo, hi] = rangeFrom && rangeTo ? (rangeFrom <= rangeTo ? [rangeFrom, rangeTo] : [rangeTo, rangeFrom]) : [rangeFrom, rangeFrom];
  const disabled = (s: string) => Boolean((min && s < min) || (max && s > max));

  // Open on the chosen day, and move real focus with the arrow keys.
  useEffect(() => {
    grid.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
  }, []);
  useEffect(() => {
    if (keyboard.current) grid.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
    keyboard.current = false;
  }, [focus]);

  const first = makeDay(y, m, 1);
  const start = addDays(first, -weekday(first));
  const weeks = Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));

  const onKeyDown = (e: ReactKeyboardEvent) => {
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      Home: () => addDays(focus, -weekday(focus)),
      End: () => addDays(focus, 6 - weekday(focus)),
      PageUp: () => addMonths(focus, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focus, e.shiftKey ? 12 : 1),
    };
    if (moves[e.key]) {
      e.preventDefault();
      keyboard.current = true;
      setFocus(moves[e.key]!());
    }
  };

  const navBtn = 'grid size-8 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-canvas hover:text-wine';

  return (
    <div className="w-[17.5rem] max-w-full">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button type="button" className={navBtn} onClick={() => setFocus(view === 'days' ? addMonths(focus, -1) : addMonths(focus, -12))} aria-label={view === 'days' ? 'Previous month' : 'Previous year'}>
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          id={titleId}
          onClick={() => setView(view === 'days' ? 'months' : 'days')}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 font-display text-[1.0625rem] font-semibold text-ink transition-colors hover:bg-canvas"
          aria-live="polite"
          aria-label={view === 'days' ? `${MONTHS[m]} ${y}, choose a month` : `${y}, back to days`}
        >
          {view === 'days' ? `${MONTHS[m]} ${y}` : y}
          <ChevronDown className={cn('size-3.5 text-muted transition-transform', view === 'months' && 'rotate-180')} aria-hidden />
        </button>
        <button type="button" className={navBtn} onClick={() => setFocus(view === 'days' ? addMonths(focus, 1) : addMonths(focus, 12))} aria-label={view === 'days' ? 'Next month' : 'Next year'}>
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      {view === 'months' ? (
        <div className="grid grid-cols-3 gap-1.5 py-1">
          {MONTHS_SHORT.map((label, i) => {
            const on = i === m;
            const now = parts(today);
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setFocus(makeDay(y, i, Math.min(parts(focus).d, new Date(Date.UTC(y, i + 1, 0)).getUTCDate())));
                  setView('days');
                }}
                className={cn(
                  'h-11 rounded-lg text-sm font-semibold transition-colors',
                  on ? 'bg-wine text-white' : 'text-ink-2 hover:bg-canvas',
                  !on && now.y === y && now.m === i && 'ring-1 ring-gold-soft',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : (
        <table ref={grid} role="grid" aria-labelledby={titleId} className="w-full border-collapse" onKeyDown={onKeyDown}>
          <thead>
            <tr>
              {WEEKDAYS.map((w) => (
                <th key={w} scope="col" abbr={w} className="pb-1.5 text-center text-[0.6875rem] font-semibold uppercase tracking-wide text-subtle">
                  {w.slice(0, 2)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody onMouseLeave={() => onHover?.(null)}>
            {weeks.map((week) => (
              <tr key={week[0]}>
                {week.map((day) => {
                  const inMonth = parts(day).m === m;
                  const off = disabled(day);
                  const end = day === selected || (lo !== undefined && (day === lo || day === hi));
                  const between = lo !== undefined && hi !== undefined && day > lo && day < hi;
                  return (
                    <td key={day} className="p-0" aria-selected={end || between || undefined}>
                      <div
                        className={cn(
                          'py-0.5',
                          between && 'bg-cream',
                          lo !== hi && day === lo && 'bg-gradient-to-r from-transparent from-50% to-cream to-50%',
                          lo !== hi && day === hi && 'bg-gradient-to-l from-transparent from-50% to-cream to-50%',
                        )}
                      >
                        <button
                          type="button"
                          tabIndex={day === focus ? 0 : -1}
                          disabled={off}
                          onClick={() => onPick(day)}
                          onMouseEnter={() => onHover?.(day)}
                          onFocus={() => setFocus(day)}
                          aria-label={`${longLabel(day)}${day === today ? ' (today)' : ''}`}
                          aria-pressed={end}
                          className={cn(
                            'relative mx-auto grid size-9 place-items-center rounded-lg text-sm tabular outline-none transition-colors',
                            'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1',
                            end ? 'bg-wine font-semibold text-white shadow-[0_4px_10px_-4px_rgba(95,10,29,.6)]' : between ? 'text-ink hover:bg-cream-2' : inMonth ? 'text-ink-2 hover:bg-canvas' : 'text-subtle/70 hover:bg-canvas',
                            day === today && !end && 'font-bold text-wine',
                            off && 'cursor-not-allowed opacity-30 hover:bg-transparent',
                          )}
                        >
                          {parts(day).d}
                          {day === today && <span aria-hidden className={cn('absolute bottom-1 size-1 rounded-full', end ? 'bg-white' : 'bg-gold')} />}
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ triggers */

const triggerClass = cn(adminInput, 'flex items-center gap-2.5 text-left');
const clearBtn = 'absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted transition-colors hover:bg-canvas hover:text-danger';

/** One date, e.g. a coupon's start. Clearing leaves the value as "". */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  clearable = true,
  min,
  max,
  className,
  id,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  clearable?: boolean;
  min?: string;
  max?: string;
  className?: string;
  id?: string;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const has = isDay(value);
  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };
  return (
    <div className={cn('relative min-w-0', className)}>
      <button
        ref={trigger}
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(triggerClass, has && clearable && 'pr-9', open && 'border-gold ring-2 ring-gold/20')}
      >
        <CalendarDays className="size-4 shrink-0 text-gold" strokeWidth={1.8} aria-hidden />
        <span className={cn('min-w-0 flex-1 truncate', !has && 'text-subtle')}>{has ? formatDay(value) : placeholder}</span>
      </button>
      {has && clearable && (
        <button type="button" onClick={() => onChange('')} className={clearBtn} aria-label="Clear date">
          <X className="size-3.5" aria-hidden />
        </button>
      )}
      {open && (
        <Popover anchor={trigger} onClose={close} label="Choose a date">
          <div className="p-3">
            <Calendar
              selected={has ? value : undefined}
              min={min}
              max={max}
              initial={has ? value : todayIST()}
              onPick={(day) => {
                onChange(day);
                close(true);
              }}
            />
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-hairline pt-2.5">
              <button
                type="button"
                onClick={() => {
                  onChange(todayIST());
                  close(true);
                }}
                className="rounded-lg px-2.5 py-1.5 text-[0.8125rem] font-semibold text-wine transition-colors hover:bg-cream-2"
              >
                Today
              </button>
              {clearable && has && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    close(true);
                  }}
                  className="rounded-lg px-2.5 py-1.5 text-[0.8125rem] font-semibold text-muted transition-colors hover:bg-canvas hover:text-danger"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </Popover>
      )}
    </div>
  );
}

/**
 * A from–to range with quick presets, for filters and reports. Choose a preset, or click a start
 * and an end day (in either order). With `clearable`, an empty range means "any date".
 */
export function DateRangePicker({
  from,
  to,
  onChange,
  presets: options,
  clearable,
  placeholder = 'All dates',
  max,
  className,
  'aria-label': ariaLabel,
}: {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string; preset?: string }) => void;
  presets: RangePreset[];
  clearable?: boolean;
  placeholder?: string;
  max?: string;
  className?: string;
  'aria-label'?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const has = isDay(from) && isDay(to);
  const active = has ? options.find((p) => {
    const r = p.range();
    return r.from === from && r.to === to;
  }) : undefined;
  const label = has ? (active ? `${active.label} · ${formatRange(from, to)}` : formatRange(from, to)) : placeholder;

  const close = (refocus: boolean) => {
    setOpen(false);
    setDraft(null);
    setHover(null);
    if (refocus) trigger.current?.focus();
  };
  const pick = (day: string) => {
    if (!draft) {
      setDraft(day);
      return;
    }
    const [a, b] = day < draft ? [day, draft] : [draft, day];
    onChange({ from: a, to: b });
    close(true);
  };

  return (
    <div className={cn('relative min-w-0', className)}>
      <button
        ref={trigger}
        type="button"
        aria-label={ariaLabel ? `${ariaLabel}: ${label}` : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? close(false) : setOpen(true))}
        className={cn(triggerClass, has && clearable ? 'pr-9' : 'pr-2.5', open && 'border-gold ring-2 ring-gold/20')}
      >
        <CalendarDays className="size-4 shrink-0 text-gold" strokeWidth={1.8} aria-hidden />
        <span className={cn('min-w-0 flex-1 truncate', !has && 'text-subtle')}>{label}</span>
        {!(has && clearable) && <ChevronDown className={cn('size-4 shrink-0 text-ink-2 transition-transform', open && 'rotate-180')} aria-hidden />}
      </button>
      {has && clearable && (
        <button type="button" onClick={() => onChange({ from: '', to: '' })} className={clearBtn} aria-label="Clear dates">
          <X className="size-3.5" aria-hidden />
        </button>
      )}
      {open && (
        <Popover anchor={trigger} onClose={close} label={ariaLabel ?? 'Choose dates'}>
          <div className="flex flex-col sm:flex-row">
            <ul className="flex gap-1.5 overflow-x-auto border-b border-hairline p-2.5 scrollbar-none sm:w-44 sm:flex-col sm:gap-0.5 sm:overflow-visible sm:border-b-0 sm:border-r">
              {options.map((p) => {
                const on = active?.key === p.key;
                return (
                  <li key={p.key} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onChange({ ...p.range(), preset: p.key });
                        close(true);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-left text-[0.8125rem] font-semibold transition-colors',
                        on ? 'bg-wine text-white' : 'text-ink-2 hover:bg-canvas hover:text-ink max-sm:border max-sm:border-field',
                      )}
                    >
                      {p.label}
                      {on && <Check className="hidden size-3.5 sm:block" aria-hidden />}
                    </button>
                  </li>
                );
              })}
              {clearable && (
                <li className="shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ from: '', to: '' });
                      close(true);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-left text-[0.8125rem] font-semibold transition-colors',
                      !has ? 'bg-wine text-white' : 'text-ink-2 hover:bg-canvas hover:text-ink max-sm:border max-sm:border-field',
                    )}
                  >
                    All dates
                    {!has && <Check className="hidden size-3.5 sm:block" aria-hidden />}
                  </button>
                </li>
              )}
            </ul>
            <div className="p-3">
              <p className="mb-2 text-xs font-semibold text-muted" aria-live="polite">
                {draft ? `From ${formatDay(draft)} — now pick the end date` : 'Pick a start date, then an end date'}
              </p>
              <Calendar
                rangeFrom={draft ?? (has ? from : undefined)}
                rangeTo={draft ? hover ?? draft : has ? to : undefined}
                max={max}
                initial={has ? to : todayIST()}
                onPick={pick}
                onHover={draft ? setHover : undefined}
              />
            </div>
          </div>
        </Popover>
      )}
    </div>
  );
}
