import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Badge, SectionShell, ViewShell } from '@tahti-player/ui';

import { fetchTransparencyResolutions } from '../api/client';
import type { BoardResolution } from '../api/types';
import { PageLoading } from '../components/PageStates';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

function outcomeBadge(outcome: string): {
  color: 'green' | 'red' | 'secondary';
  label: string;
} {
  if (outcome === 'PASSED') {
    return { color: 'green', label: 'Passed' };
  }
  if (outcome === 'FAILED') {
    return { color: 'red', label: 'Failed' };
  }
  return { color: 'secondary', label: outcome };
}

export function TransparencyResolutionsView() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [resolutions, setResolutions] = useState<BoardResolution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchTransparencyResolutions(year).then((result) => {
      if (cancelled) {
        return;
      }
      setResolutions(result.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [year]);

  return (
    <ViewShell
      title="Board resolutions"
      classes={{
        root: 'px-0 pt-0 mx-auto max-w-3xl',
        scrollableArea: 'gap-6',
      }}
    >
      <Link
        to="/transparency"
        className="text-foreground-secondary w-fit text-xs underline-offset-2 hover:underline"
      >
        ← Back to transparency
      </Link>

      <div className="flex flex-wrap gap-2 text-xs">
        {YEAR_OPTIONS.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => setYear(y)}
            className={
              y === year
                ? 'bg-primary text-primary-foreground border-primary rounded-full border px-3 py-1 font-medium'
                : 'border-border hover:bg-background-secondary rounded-full border px-3 py-1'
            }
          >
            {y}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoading label="Loading resolutions…" />
      ) : resolutions.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          No published resolutions for {year}.
        </p>
      ) : (
        <SectionShell title={`Resolutions ${year}`}>
          <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
            {resolutions.map((resolution) => {
              const badge = outcomeBadge(resolution.outcome);
              return (
                <li key={resolution.id} className="p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-display text-lg font-bold">
                      {resolution.title}
                    </h2>
                    <Badge variant="pill" color={badge.color}>
                      {badge.label}
                    </Badge>
                  </div>
                  <p className="text-foreground-secondary mt-1 text-xs">
                    Voted {new Date(resolution.votedAt).toLocaleDateString()}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    {resolution.body}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="border-border rounded border px-2 py-1">
                      YES {resolution.voteFor}
                    </span>
                    <span className="border-border rounded border px-2 py-1">
                      NO {resolution.voteAgainst}
                    </span>
                    <span className="border-border rounded border px-2 py-1">
                      ABSTAIN {resolution.voteAbstain}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionShell>
      )}
    </ViewShell>
  );
}
