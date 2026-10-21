import { FC, ReactNode } from 'react';

import { SidebarCompactProvider } from './SidebarCompactContext';

type SidebarNavigationProps = {
  children: ReactNode;
  isCompact?: boolean;
  label?: string;
};

export const SidebarNavigation: FC<SidebarNavigationProps> = ({
  children,
  isCompact = false,
  label = 'Main',
}) => {
  return (
    <SidebarCompactProvider isCompact={isCompact}>
      <nav
        data-testid="sidebar-navigation"
        aria-label={label}
        className="flex flex-1 flex-col"
      >
        {children}
      </nav>
    </SidebarCompactProvider>
  );
};
