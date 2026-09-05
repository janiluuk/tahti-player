import { FC, ReactNode, useEffect, useState } from 'react';

import { DialogRoot } from '../Dialog/DialogRoot';
import { SettingsPanelContent } from './SettingsPanelContent';
import { SettingsPanelNav } from './SettingsPanelNav';

export type SettingsTab = {
  id: string;
  label: string;
  icon: ReactNode;
  content: () => ReactNode;
};

type SettingsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  tabs: SettingsTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  navFooter?: ReactNode;
};

export const SettingsPanel: FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  tabs,
  activeTab,
  onTabChange,
  navFooter,
}) => {
  const activeTabMeta = tabs.find((tab) => tab.id === activeTab);
  // Below `sm`, nav and content share one screen — list first, then detail.
  // Desktop always shows both; `sm:flex!` on each pane overrides the mobile
  // `hidden`/`flex` toggle above the breakpoint.
  const [mobileShowList, setMobileShowList] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setMobileShowList(true);
    }
  }, [isOpen]);

  return (
    <DialogRoot
      isOpen={isOpen}
      onClose={onClose}
      // Fill the DialogRoot padded viewport on mobile (`w-full` + dvh), not a
      // second `100vw-2rem` that stacks with the overlay's `p-4`. `min-w-0`
      // + `overflow-hidden` keep section bodies scrolling inside the pane.
      className="flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] w-full max-w-none min-w-0 flex-col overflow-hidden p-0 sm:h-[80vh] sm:max-h-[900px] sm:w-[80vw] sm:max-w-6xl sm:flex-row!"
    >
      <SettingsPanelNav
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          onTabChange(tabId);
          setMobileShowList(false);
        }}
        footer={navFooter}
        className={mobileShowList ? 'flex' : 'hidden'}
      />
      <SettingsPanelContent
        className={mobileShowList ? 'hidden' : 'flex'}
        title={activeTabMeta?.label}
        onBack={() => setMobileShowList(true)}
      >
        {activeTabMeta?.content()}
      </SettingsPanelContent>
    </DialogRoot>
  );
};
