import { ArrowLeftIcon } from 'lucide-react';
import { FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';
import { Tooltip } from '../Tooltip';

type SettingsPanelContentProps = {
  children: ReactNode;
  /** Below `sm`, the nav and content panes are mutually exclusive (list vs.
   * detail) rather than side by side — the caller toggles which is shown. */
  className?: string;
  /** Active section's label — shown in the mobile-only back-nav header. */
  title?: string;
  /** Present only on mobile (returns to the section list); omit on desktop. */
  onBack?: () => void;
};

export const SettingsPanelContent: FC<SettingsPanelContentProps> = ({
  children,
  className,
  title,
  onBack,
}) => (
  // `sm:flex!` forces the pane visible on desktop even when the caller
  // passes `hidden` for the mobile list-first state. `min-w-0` keeps wide
  // section bodies from blowing out the dialog width on small screens.
  <div
    className={cn(
      'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden sm:flex!',
      className,
    )}
    data-testid="settings-panel-content"
  >
    {onBack && (
      <div className="border-border flex shrink-0 items-center gap-1 border-b-(length:--border-width) p-2 sm:hidden!">
        <Tooltip content="Back to settings sections" side="top">
          <Button
            size="icon-sm"
            variant="text"
            onClick={onBack}
            aria-label="Back to settings sections"
          >
            <ArrowLeftIcon size={16} />
          </Button>
        </Tooltip>
        {title && (
          <span className="min-w-0 truncate text-sm font-semibold">
            {title}
          </span>
        )}
      </div>
    )}
    <div
      className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto"
      data-testid="settings-panel-content-scroll"
    >
      {children}
    </div>
  </div>
);
