import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Badge, FilterChips, SectionShell, ViewShell } from '@tahti-player/ui';

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

      <FilterChips
        aria-label="Year"
        items={YEAR_OPTIONS.map((y) => ({ id: String(y), label: String(y) }))}
        selected={String(year)}
        onChange={(id) => setYear(Number(id))}
      />

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
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="pill" color="secondary">
                      YES {resolution.voteFor}
                    </Badge>
                    <Badge variant="pill" color="secondary">
                      NO {resolution.voteAgainst}
                    </Badge>
                    <Badge variant="pill" color="secondary">
                      ABSTAIN {resolution.voteAbstain}
                    </Badge>
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
