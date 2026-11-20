import { DialogPanel, Dialog as HeadlessDialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'motion/react';
import React, { FC, PropsWithChildren } from 'react';

import { cn } from '../../utils';
import { DialogContext } from './context';
import { DialogOverlayBackdrop } from './DialogOverlayBackdrop';
import { DialogXClose } from './DialogXClose';

type DialogRootProps = PropsWithChildren<{
  isOpen: boolean;
  onClose: () => void;
  initialFocus?: React.RefObject<HTMLElement | null>;
  className?: string;
  showCloseButton?: boolean;
  /** Stacking class for the dialog layer. Raise it (e.g. `z-[70]`) for
   * dialogs opened from the full-screen player, which sits at `z-[60]`. */
  layerClassName?: string;
  /** Fill the whole viewport (no outer gutter or max width), e.g. an image
   * slideshow. Style the panel itself through `className`. */
  fullScreen?: boolean;
  'aria-label'?: string;
}>;

export const DialogRoot: FC<DialogRootProps> = ({
  isOpen,
  onClose,
  initialFocus,
  className,
  showCloseButton = true,
  layerClassName = 'z-50',
  fullScreen = false,
  'aria-label': ariaLabel,
  children,
}) => {
  return (
    <DialogContext.Provider value={{ onClose }}>
      <AnimatePresence>
        {isOpen && (
          <HeadlessDialog
            static
            open={isOpen}
            onClose={onClose}
            initialFocus={initialFocus}
            aria-label={ariaLabel}
            className={cn('relative', layerClassName)}
          >
            <DialogOverlayBackdrop />
            <div
              className={
                fullScreen
                  ? 'pointer-events-none fixed inset-0 flex items-center justify-center'
                  : 'pointer-events-none fixed inset-0 flex items-center justify-center p-4'
              }
            >
              <motion.div
                className={
                  fullScreen
                    ? 'pointer-events-auto flex h-full w-full flex-col'
                    : 'pointer-events-auto flex max-h-full w-full max-w-[calc(100vw-2rem)] flex-col'
                }
                initial={{ opacity: 1, scale: 1, y: 0 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 17,
                  mass: 0.8,
                }}
              >
                <DialogPanel
                  className={cn(
                    'border-border bg-background shadow-shadow relative mx-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-md border-(length:--border-width) p-6',
                    fullScreen &&
                      'h-dvh max-h-dvh max-w-none rounded-none border-0 p-0',
                    className,
                  )}
                >
                  {children}
                  {showCloseButton ? <DialogXClose /> : null}
                </DialogPanel>
              </motion.div>
            </div>
          </HeadlessDialog>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
};
