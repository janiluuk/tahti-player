import { Link } from '@tanstack/react-router';
import {
  Clock3Icon,
  FileAudioIcon,
  ListMusicIcon,
  RadioTowerIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, ViewShell } from '@tahti-player/ui';

import {
  fetchAdminContentOverview,
  type AdminContentOverview,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { StatNumber } from '../../components/tahti/StatNumber';

function formatDuration(durationSec: number | null | undefined): string {
  if (durationSec == null) {
    return '—';
  }
  const minutes = Math.floor(durationSec / 60);
  return `${minutes}:${String(durationSec % 60).padStart(2, '0')}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function AdminContentView() {
  const [data, setData] = useState<AdminContentOverview | null>(null);

  useEffect(() => {
    void fetchAdminContentOverview().then((result) => setData(result.data));
  }, []);

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/content">
          <ViewShell title="Content" classes={{ root: 'px-0 pt-0' }}>
            <div>
              <Link to="/admin/top-lists">
                <Button size="sm" variant="secondary">
                  <ListMusicIcon size={15} aria-hidden /> Top lists
                </Button>
              </Link>
            </div>
            {!data ? (
              <StudioPanel>
                <PageLoading label="Loading content overview…" />
              </StudioPanel>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(
                    [
                      ['Tracks', data.counts.tracks, FileAudioIcon],
                      ['Shows', data.counts.shows, RadioTowerIcon],
                      ['Uploads', data.counts.uploads, FileAudioIcon],
                      ['Listens', data.counts.listens, Clock3Icon],
                    ] as const
                  ).map(([label, value, Icon]) => (
                    <StudioPanel key={label} className="!p-4 sm:!p-5">
                      <div className="text-foreground-secondary flex items-center gap-1.5 text-xs tracking-wide uppercase">
                        <Icon size={14} aria-hidden />
                        {label}
                      </div>
                      <StatNumber className="mt-2 block text-3xl">
                        {value.toLocaleString()}
                      </StatNumber>
                    </StudioPanel>
                  ))}
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <StudioPanel
                    title="Latest content"
                    description="The newest tracks, shows, releases, and other catalog items."
                  >
                    {data.latestContent.length === 0 ? (
                      <p className="text-foreground-secondary text-sm">
                        No content has been added yet.
                      </p>
                    ) : (
                      <ul className="divide-border divide-y">
                        {data.latestContent.map((item) => (
                          <li
                            key={item.id}
                            className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                          >
                            <FileAudioIcon
                              size={18}
                              className="text-foreground-secondary shrink-0"
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {item.title}
                              </p>
                              <p className="text-foreground-secondary text-xs">
                                {item.type}
                                {item.artistName ? ` · ${item.artistName}` : ''}
                              </p>
                            </div>
                            <time
                              className="text-foreground-secondary text-xs"
                              dateTime={item.createdAt}
                            >
                              {formatDate(item.createdAt)}
                            </time>
                          </li>
                        ))}
                      </ul>
                    )}
                  </StudioPanel>
                  <StudioPanel
                    title="Latest recorded broadcasts"
                    description="Recent broadcasts captured by the platform recorder."
                  >
                    {data.latestBroadcasts.length === 0 ? (
                      <p className="text-foreground-secondary text-sm">
                        No recorded broadcasts yet.
                      </p>
                    ) : (
                      <ul className="divide-border divide-y">
                        {data.latestBroadcasts.map((broadcast) => (
                          <li
                            key={broadcast.id}
                            className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                          >
                            <RadioTowerIcon
                              size={18}
                              className="text-foreground-secondary shrink-0"
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {broadcast.title}
                              </p>
                              <p className="text-foreground-secondary text-xs">
                                {broadcast.artistName ?? 'Unknown artist'} ·{' '}
                                {formatDuration(broadcast.durationSec)}
                              </p>
                            </div>
                            <time
                              className="text-foreground-secondary text-xs"
                              dateTime={broadcast.recordedAt}
                            >
                              {formatDate(broadcast.recordedAt)}
                            </time>
                          </li>
                        ))}
                      </ul>
                    )}
                  </StudioPanel>
                </div>
              </>
            )}
          </ViewShell>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
