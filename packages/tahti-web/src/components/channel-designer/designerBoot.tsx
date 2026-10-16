import type { ReactNode } from 'react';

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
        title="Could not load the channel designer"
        description="Check your connection and try again."
        onRetry={opts.onRetry}
      />
    );
  }
  if (!opts.ready) {
    return <PageLoading label="Loading designer…" />;
  }
  return null;
}
