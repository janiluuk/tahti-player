import type { ReactNode } from 'react';

import { i18n } from '@tahti-player/i18n';

import { PageError, PageLoading } from '../PageStates';

/** Early-return UI while the channel look is loading or failed. */
export function designerBoot(opts: {
  loadFailed: boolean;
  onRetry: () => void;
  ready: boolean;
}): ReactNode | null {
  if (opts.loadFailed) {
    return (
      <PageError
        title={i18n.t('web:loadErrors.couldNotLoadTheChannelDesigner')}
        description={i18n.t('web:loadErrors.checkYourConnectionAndTryAgain')}
        onRetry={opts.onRetry}
      />
    );
  }
  if (!opts.ready) {
    return <PageLoading label={i18n.t('web:loading.loadingDesigner')} />;
  }
  return null;
}
