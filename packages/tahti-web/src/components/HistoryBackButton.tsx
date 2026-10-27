import { useCanGoBack, useRouter } from '@tanstack/react-router';

import {
  BackButton,
  backButtonCornerClassName,
  Tooltip,
} from '@tahti-player/ui';

/**
 * The round back arrow in a page's top-left corner. Returns to wherever the
 * visitor came from; a deep link with no in-app history goes to `fallback`.
 */
export function HistoryBackButton({ fallback = '/' }: { fallback?: string }) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  return (
    <Tooltip
      content="Back"
      side="right"
      wrapperClassName={backButtonCornerClassName}
    >
      <BackButton
        aria-label="Back"
        onClick={() =>
          canGoBack
            ? router.history.back()
            : void router.navigate({ to: fallback })
        }
      />
    </Tooltip>
  );
}
