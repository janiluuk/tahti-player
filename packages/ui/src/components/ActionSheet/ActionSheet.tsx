import { DialogPanel, Dialog as HeadlessDialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'motion/react';
import {
  createContext,
  FC,
  PropsWithChildren,
  ReactNode,
  useContext,
} from 'react';

import { cn } from '../../utils';
import { DialogOverlayBackdrop } from '../Dialog/DialogOverlayBackdrop';
import { MediaArtwork } from '../MediaArtwork';

const ActionSheetContext = createContext<{ onClose: () => void } | null>(null);

type ActionSheetProps = PropsWithChildren<{
  isOpen: boolean;
  onClose: () => void;
  /** Accessible name for the sheet, e.g. "Track options". */
  label: string;
  className?: string;
}>;

type ActionSheetHeaderProps = {
  title: string;
  subtitle?: string;
  coverUrl?: string | null;
  /** Right-aligned extras such as stats, genre or date chips. */
  meta?: ReactNode;
};

type ActionSheetActionProps = {
  icon?: ReactNode;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** Keep the sheet open after the action runs. */
  keepOpen?: boolean;
  'data-testid'?: string;
};

/** Menu of actions for a single item. Bottom sheet on phones, centered
 * panel from `sm` up. Stacks above the full-screen player (`z-[60]`). */
const ActionSheetImpl: FC<ActionSheetProps> = ({
  isOpen,
  onClose,
  label,
  className,
  children,
}) => (
  <ActionSheetContext.Provider value={{ onClose }}>
    <AnimatePresence>
      {isOpen && (
        <HeadlessDialog
          static
          open={isOpen}
          onClose={onClose}
          aria-label={label}
          className="relative z-[70]"
        >
          <DialogOverlayBackdrop />
          <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
            <motion.div
              className="w-full sm:max-w-sm"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            >
              <DialogPanel
                data-testid="action-sheet"
                className={cn(
                  'border-border bg-background shadow-shadow max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl border-(length:--border-width) pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:rounded-md sm:pb-2',
                  className,
                )}
              >
                <div
                  aria-hidden
                  className="bg-foreground-secondary/40 mx-auto mt-3 h-1 w-10 rounded-full sm:hidden"
                />
                {children}
              </DialogPanel>
            </motion.div>
          </div>
        </HeadlessDialog>
      )}
    </AnimatePresence>
  </ActionSheetContext.Provider>
);

const ActionSheetHeader: FC<ActionSheetHeaderProps> = ({
  title,
  subtitle,
  coverUrl,
  meta,
}) => (
  <div className="border-border flex items-center gap-3 border-b px-4 py-3">
    {coverUrl ? <MediaArtwork src={coverUrl} size="md" /> : null}
    <div className="min-w-0 flex-1">
      <div className="text-foreground line-clamp-2 text-sm font-bold">
        {title}
      </div>
      {subtitle ? (
        <div className="text-foreground-secondary truncate text-sm">
          {subtitle}
        </div>
      ) : null}
    </div>
    {meta ? (
      <div className="text-foreground-secondary flex shrink-0 flex-col items-end gap-1 text-xs">
        {meta}
      </div>
    ) : null}
  </div>
);

const ActionSheetAction: FC<ActionSheetActionProps> = ({
  icon,
  children,
  onClick,
  disabled,
  keepOpen,
  'data-testid': testId,
}) => {
  const ctx = useContext(ActionSheetContext);
  return (
    <button
      type="button"
      disabled={disabled}
      data-testid={testId}
      onClick={() => {
        onClick();
        if (!keepOpen) {
          ctx?.onClose();
        }
      }}
      className={cn(
        'text-foreground flex w-full cursor-pointer items-center gap-5 px-6 py-3.5 text-left text-base font-medium outline-none sm:py-2.5 sm:text-sm',
        'hover:bg-background-secondary focus-visible:bg-background-secondary',
        'disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      {icon ? (
        <span className="text-primary flex size-6 shrink-0 items-center justify-center">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
};

type ActionSheetComponent = FC<ActionSheetProps> & {
  Header: typeof ActionSheetHeader;
  Action: typeof ActionSheetAction;
};

export const ActionSheet = ActionSheetImpl as ActionSheetComponent;
ActionSheet.Header = ActionSheetHeader;
ActionSheet.Action = ActionSheetAction;
