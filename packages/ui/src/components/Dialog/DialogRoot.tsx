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
}>;

export const DialogRoot: FC<DialogRootProps> = ({
  isOpen,
  onClose,
  initialFocus,
  className,
  showCloseButton = true,
  layerClassName = 'z-50',
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
            className={cn('relative', layerClassName)}
          >
            <DialogOverlayBackdrop />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <motion.div
                className="w-full max-w-[calc(100vw-2rem)]"
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
                    className,
                  )}
                >
                  {showCloseButton && <DialogXClose />}
                  {children}
                </DialogPanel>
              </motion.div>
            </div>
          </HeadlessDialog>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
};
