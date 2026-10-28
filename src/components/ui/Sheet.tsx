import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, m } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * Side drawer / top sheet built on Radix Dialog (focus trap, Escape, scroll lock, labelling),
 * animated with Framer Motion.
 */
export function Sheet({
  open,
  onOpenChange,
  side = 'right',
  title,
  description,
  hideTitle,
  children,
  className,
  footer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  side?: 'right' | 'left' | 'top';
  title: ReactNode;
  description?: ReactNode;
  hideTitle?: boolean;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}) {
  const from = side === 'right' ? { x: '100%' } : side === 'left' ? { x: '-100%' } : { y: '-100%' };
  const to = side === 'top' ? { y: 0 } : { x: 0 };
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <m.div
                className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={description ? undefined : undefined}>
              <m.div
                className={cn(
                  'fixed z-50 flex flex-col bg-ivory shadow-2xl outline-none',
                  side === 'right' && 'inset-y-0 right-0 w-full max-w-[28rem]',
                  side === 'left' && 'inset-y-0 left-0 w-full max-w-[24rem]',
                  side === 'top' && 'inset-x-0 top-0 max-h-[92dvh]',
                  className,
                )}
                initial={from}
                animate={to}
                exit={from}
                transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.45 }}
              >
                <div className={cn('flex items-center justify-between gap-4 border-b border-line px-5 py-4', hideTitle && 'sr-only')}>
                  <div>
                    <Dialog.Title className="font-display text-2xl font-semibold text-ink">{title}</Dialog.Title>
                    {description && <Dialog.Description className="text-xs text-muted">{description}</Dialog.Description>}
                  </div>
                  <Dialog.Close className="grid size-10 place-items-center rounded-full text-ink hover:bg-sand" aria-label="Close">
                    <X className="size-5" />
                  </Dialog.Close>
                </div>
                {!description && <Dialog.Description className="sr-only">{typeof title === 'string' ? title : 'Panel'}</Dialog.Description>}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
                {footer && <div className="border-t border-line bg-paper px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

/** Centered dialog for confirmations and admin forms. */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  wide,
  admin,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  /** The admin panel's look: a white, rounded card. */
  admin?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <m.div className="fixed inset-0 z-50 bg-ink/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </Dialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-3 sm:p-6">
              <Dialog.Content asChild forceMount>
                <m.div
                  className={cn(
                    'pointer-events-auto flex max-h-[92dvh] w-full flex-col overflow-hidden shadow-2xl outline-none',
                    admin ? 'rounded-2xl bg-white' : 'rounded-xs bg-ivory',
                    wide ? 'max-w-3xl' : 'max-w-md',
                  )}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className={cn('flex items-start justify-between gap-4 border-b px-5 py-4', admin ? 'border-hairline' : 'border-line')}>
                    <div>
                      <Dialog.Title className="font-display text-2xl font-semibold text-ink">{title}</Dialog.Title>
                      <Dialog.Description className={cn('text-sm text-muted', !description && 'sr-only')}>
                        {description ?? (typeof title === 'string' ? title : 'Dialog')}
                      </Dialog.Description>
                    </div>
                    <Dialog.Close className={cn('grid size-9 shrink-0 place-items-center rounded-full', admin ? 'hover:bg-canvas' : 'hover:bg-sand')} aria-label="Close">
                      <X className="size-4.5" />
                    </Dialog.Close>
                  </div>
                  {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>}
                  {footer && <div className={cn('flex flex-wrap justify-end gap-3 border-t px-5 py-4', admin ? 'border-hairline bg-canvas' : 'border-line bg-paper')}>{footer}</div>}
                </m.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
