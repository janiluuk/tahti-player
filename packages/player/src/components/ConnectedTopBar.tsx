import { useCanGoBack, useRouter } from '@tanstack/react-router';
import { FC } from 'react';

import { TahtiLogo, Tooltip, TopBar, TopBarNavigation } from '@tahti-player/ui';

import { useAppVersion } from '../hooks/useAppVersion';
import { useCanGoForward } from '../hooks/useCanGoForward';
import { useCoreSetting } from '../hooks/useCoreSetting';
import { useFramelessWindow } from '../hooks/useFramelessWindow';
import { ConnectedThemeController } from './ConnectedThemeController';
import { JamQrCodeButton } from './JamQrCodeButton';
import { SearchBox } from './SearchBox';
import { UpdateBadge } from './UpdateBadge';

export const ConnectedTopBar: FC = () => {
  const router = useRouter();
  const { version } = useAppVersion();
  const canGoBack = useCanGoBack();
  const canGoForward = useCanGoForward();
  const frameless = useFramelessWindow();
  const [isTitleBarEnabled] = useCoreSetting<boolean>(
    'appearance.customTitleBar',
  );

  return (
    <TopBar draggable={frameless}>
      <div className="flex flex-row items-center gap-4">
        {!isTitleBarEnabled && (
          <Tooltip
            content={`Tahti Player ${version}`}
            side="bottom"
            wrapperClassName="flex items-center"
          >
            <TahtiLogo markOnly className="text-sm" />
          </Tooltip>
        )}
        <UpdateBadge />
        <TopBarNavigation
          onBack={() => router.history.back()}
          onForward={() => router.history.forward()}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
        />
      </div>
      <SearchBox />
      <div className="flex flex-row items-center justify-end gap-2">
        <JamQrCodeButton />
        <ConnectedThemeController />
      </div>
    </TopBar>
  );
};
