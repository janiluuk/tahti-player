import { useEffect, useState } from 'react';

import { Badge } from '@tahti-player/ui';

import { apiBase } from '../api/client';
import { isForceMock } from '../api/mode';

export function ApiConnectionIndicator({
  previewFailed,
}: {
  /** Storybook-only override to preview the disconnected pill without a
   * real health probe -- `isForceMock()` is always true in Storybook (see
   * .storybook/main.ts), which would otherwise make the probe below a
   * permanent no-op and this component always render null there. */
  previewFailed?: boolean;
} = {}) {
  const [failed, setFailed] = useState(previewFailed ?? false);

  useEffect(() => {
    if (previewFailed !== undefined || isForceMock()) {
      return;
    }
    let active = true;
    let controller: AbortController | undefined;
    const probe = async () => {
      controller?.abort();
      controller = new AbortController();
      const probeController = controller;
      const signal = probeController.signal;
      const timeout = window.setTimeout(() => probeController.abort(), 8000);
      try {
        const response = await fetch(`${apiBase()}/health`, {
          credentials: 'include',
          cache: 'no-store',
          signal,
        });
        if (active) {
          setFailed(!response.ok);
        }
      } catch {
        if (active) {
          setFailed(true);
        }
      } finally {
        window.clearTimeout(timeout);
      }
    };
    void probe();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void probe();
      }
    }, 30000);
    return () => {
      active = false;
      controller?.abort();
      window.clearInterval(interval);
    };
  }, [previewFailed]);

  return failed ? (
    <span role="status">
      <Badge variant="pill" color="red">
        API disconnected
      </Badge>
    </span>
  ) : null;
}
