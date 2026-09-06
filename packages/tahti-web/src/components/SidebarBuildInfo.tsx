import { useState } from 'react';

import { usePolling } from '../hooks/usePolling';

const RELATIVE_TIME_UPDATE_MS = 60_000;

function relativeBuildTime(now: number): string {
  const buildTime = new Date(__BUILD_TIME__).getTime();
  if (Number.isNaN(buildTime)) {
    return 'recently';
  }

  const elapsedSeconds = Math.max(0, Math.floor((now - buildTime) / 1000));
  if (elapsedSeconds < 60) {
    return 'just now';
  }
  if (elapsedSeconds < 3600) {
    const minutes = Math.floor(elapsedSeconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (elapsedSeconds < 86_400) {
    const hours = Math.floor(elapsedSeconds / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(elapsedSeconds / 86_400);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function SidebarBuildInfo() {
  const [now, setNow] = useState(() => Date.now());

  usePolling(() => setNow(Date.now()), RELATIVE_TIME_UPDATE_MS);

  return (
    <div className="text-foreground-secondary px-2 py-1 text-[11px] leading-tight select-text">
      Updated {relativeBuildTime(now)}
    </div>
  );
}
