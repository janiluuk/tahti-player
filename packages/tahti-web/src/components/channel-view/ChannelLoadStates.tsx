import { useTranslation } from '@tahti-player/i18n';

import { PageError, PageErrorBanner, PageLoading } from '../PageStates';
import { ChannelNotFound } from './ChannelNotFound';

/** The channel page before a channel is on screen: loading, a failed load
 * worth retrying, or an unknown slug. */
export function ChannelUnavailable({
  slug,
  loading,
  failed,
  onRetry,
}: {
  slug: string;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
}) {
  const { t } = useTranslation('web');
  if (loading) {
    return <PageLoading label={t('loading.loadingChannel')} />;
  }
  if (failed) {
    return (
      <PageError
        title={t('loadErrors.couldnTLoadThisChannel')}
        description={t('loadErrors.checkYourConnectionAndTryAgain')}
        onRetry={onRetry}
      />
    );
  }
  return <ChannelNotFound slug={slug} />;
}

export function ChannelRefreshBanner({
  error,
  onRetry,
}: {
  error: string | null;
  onRetry: () => void;
}) {
  const { t } = useTranslation('web');
  if (!error) {
    return null;
  }
  return (
    <PageErrorBanner
      title={t('pageStates.refreshFailed')}
      description={error}
      onRetry={onRetry}
    />
  );
}
