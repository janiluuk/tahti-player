import { useEffect, useState } from 'react';

import {
  fetchMotionSeconders,
  type MotionSeconder,
} from '../../api/governance-motion-detail';
import { PageError } from '../PageStates';

export function MotionSeconders({
  motionId,
  refreshKey,
}: {
  motionId: string;
  refreshKey?: unknown;
}) {
  const [seconders, setSeconders] = useState<MotionSeconder[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchMotionSeconders(motionId).then((res) => {
      if (!cancelled) {
        setSeconders(res.data);
        setLoadError(
          res.meta.source === 'api' ? (res.meta.reason ?? null) : null,
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [motionId, refreshKey, attempt]);

  if (loadError && seconders.length === 0) {
    return (
      <PageError
        title="Could not load who seconded this motion"
        description={loadError}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  if (seconders.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="motion-seconders" className="flex flex-col gap-2">
      <h2
        id="motion-seconders"
        className="font-display text-sm font-bold tracking-wide uppercase"
      >
        Seconded by
      </h2>
      <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border text-sm">
        {seconders.map((s) => (
          <li
            key={s.username}
            className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 py-2"
          >
            <span className="min-w-0">
              <span className="font-medium">{s.displayName}</span>
              <span className="text-foreground-secondary ml-2 text-xs">
                @{s.username}
              </span>
            </span>
            <span className="text-foreground-secondary text-xs">
              {new Date(s.secondedAt).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
