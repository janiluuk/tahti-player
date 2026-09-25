import { Link } from '@tanstack/react-router';
import { ExternalLinkIcon, Link2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  ButtonLink,
  EmptyState,
  ImageReveal,
  ViewShell,
} from '@tahti-player/ui';

import { fetchStudioReleases } from '../api/studio';
import type { StudioRelease } from '../api/studio-types';
import { PageLoading } from '../components/PageStates';
import { StudioGate } from '../components/StudioGate';
import { StudioNav } from '../components/StudioNav';
import { StudioPanel } from '../components/StudioPanel';

const DSP_LABELS: Record<string, string> = {
  apple: 'Apple Music',
  appleMusic: 'Apple Music',
  bandcamp: 'Bandcamp',
  deezer: 'Deezer',
  mixcloud: 'Mixcloud',
  soundcloud: 'SoundCloud',
  spotify: 'Spotify',
  tidal: 'Tidal',
  youtube: 'YouTube',
  youtubeMusic: 'YouTube Music',
};

function targetLabel(provider: string): string {
  return DSP_LABELS[provider] ?? provider.replace(/[-_]/g, ' ');
}

function releaseTargets(release: StudioRelease): Array<[string, string]> {
  return Object.entries(release.smartLinkTargets ?? {}).filter(([, url]) =>
    Boolean(url),
  );
}

export function LibrarySmartLinksView() {
  const [releases, setReleases] = useState<StudioRelease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchStudioReleases().then((result) => {
      setReleases(result.data.releases);
      setLoading(false);
    });
  }, []);

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/library/smartlinks" />
        <ViewShell title="Smartlinks" classes={{ root: 'px-0 pt-0' }}>
          <ButtonLink className="w-fit" to="/studio/releases" size="sm">
            New release
          </ButtonLink>
          <StudioPanel>
            {loading ? (
              <PageLoading label="Loading smartlinks…" />
            ) : releases.length === 0 ? (
              <EmptyState
                size="sm"
                icon={
                  <Link2Icon
                    size={28}
                    className="text-foreground-secondary"
                    aria-hidden
                  />
                }
                title="No releases yet"
                description="Create a release to get its public smartlink page."
                action={
                  <ButtonLink to="/studio/releases" size="sm">
                    Create release
                  </ButtonLink>
                }
              />
            ) : (
              <ul className="divide-border divide-y">
                {releases.map((release) => {
                  const targets = releaseTargets(release);
                  return (
                    <li
                      key={release.id}
                      className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <ImageReveal
                          src={release.artworkUrl ?? undefined}
                          alt=""
                          className="border-border bg-background-secondary size-12 shrink-0 rounded-md border"
                          placeholder={
                            <Link2Icon
                              size={18}
                              className="text-foreground-secondary"
                              aria-hidden
                            />
                          }
                        />
                        <div className="min-w-0">
                          <Link
                            to="/studio/releases/$id"
                            params={{ id: release.id }}
                            className="font-medium hover:underline"
                          >
                            {release.title}
                          </Link>
                          <p className="text-foreground-secondary text-xs">
                            {release.type} · {release.state}
                            {typeof release._count?.tracks === 'number'
                              ? ` · ${release._count.tracks} track${release._count.tracks === 1 ? '' : 's'}`
                              : ''}
                          </p>
                          <p className="text-foreground-secondary mt-1 text-xs">
                            {targets.length > 0
                              ? `${targets.length} DSP link${targets.length === 1 ? '' : 's'}: ${targets.map(([provider]) => targetLabel(provider)).join(', ')}`
                              : 'No DSP links added yet'}
                            {typeof release.smartLinkViewCount === 'number'
                              ? ` · ${release.smartLinkViewCount.toLocaleString()} views`
                              : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <ButtonLink
                          to="/studio/releases/$id"
                          params={{ id: release.id }}
                          size="sm"
                          variant="secondary"
                        >
                          Manage
                        </ButtonLink>
                        <ButtonLink
                          to="/r/$slug"
                          params={{ slug: release.smartLinkSlug }}
                          size="sm"
                          variant="text"
                          aria-label={`Open smartlink for ${release.title}`}
                          title="Open smartlink"
                        >
                          <ExternalLinkIcon size={15} aria-hidden />
                        </ButtonLink>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </StudioPanel>
        </ViewShell>
      </div>
    </StudioGate>
  );
}
