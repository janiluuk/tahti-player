import { useEffect, useState } from 'react';

import {
  fetchMotionSeconders,
  type MotionSeconder,
} from '../../api/governance-motion-detail';

export function MotionSeconders({
  motionId,
  refreshKey,
}: {
  motionId: string;
  refreshKey?: unknown;
}) {
  const [seconders, setSeconders] = useState<MotionSeconder[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchMotionSeconders(motionId).then((res) => {
      if (!cancelled) {
        setSeconders(res.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [motionId, refreshKey]);

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
