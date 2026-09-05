import { FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { SettingsTab } from './SettingsPanel';
import { SettingsPanelNavItem } from './SettingsPanelNavItem';

type SettingsPanelNavProps = {
  tabs: SettingsTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  footer?: ReactNode;
  /** Below `sm`, the nav and content panes are mutually exclusive (list vs.
   * detail) rather than side by side — the caller toggles which is shown. */
  className?: string;
};

export const SettingsPanelNav: FC<SettingsPanelNavProps> = ({
  tabs,
  activeTab,
  onTabChange,
  footer,
  className,
}) => (
  // Do **not** put unconditional `flex!` here. On mobile the caller passes
  // `hidden` after a section is selected; `flex!` would win and keep the
  // list mounted full-height while content stacks below and overflows.
  // Desktop still needs `sm:flex!` so the same `hidden` class is overridden
  // above the sm breakpoint (Tailwind cascade quirk in this monorepo —
  // unprefixed display rules can beat `sm:flex` without `!`).
  // `sm:w-56!` is forced for the same cascade reason.
  <nav
    className={cn(
      'border-border flex h-full min-h-0 w-full shrink-0 flex-col border-b-(length:--border-width) p-2 sm:flex! sm:w-56! sm:border-r-(length:--border-width) sm:border-b-0 sm:p-4',
      className,
    )}
    data-testid="settings-panel-nav"
  >
    <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
      {tabs.map((tab) => (
        <SettingsPanelNavItem
          key={tab.id}
          id={tab.id}
          label={tab.label}
          icon={tab.icon}
          isActive={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        />
      ))}
    </div>
    {footer ? <div className="mt-auto shrink-0 pt-2">{footer}</div> : null}
  </nav>
);
