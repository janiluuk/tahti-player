import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  EyeIcon,
  PauseIcon,
  PlayIcon,
  PowerIcon,
  RefreshCw,
  RotateCwIcon,
  SkipForwardIcon,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button, Dialog, ImageReveal, Loader, Tooltip } from '@tahti-player/ui';

import {
  fetchAdminStreams,
  forceStreamOffline,
  pauseStream,
  restartStream,
  resumeStream,
  skipStreamTrack,
  type AdminLiveStreamRow,
} from '../api/admin';
import {
  fetchChannelManageStats,
  type ChannelManageStats,
} from '../api/broadcast';
import { ConfirmDialog } from './ConfirmDialog';
import { PageLoading } from './PageStates';
import { StudioPanel } from './StudioPanel';

type StreamAction = (
  streamSlug: string,
) => Promise<{ ok: true } | { ok: false; error: string }>;

type PendingStreamConfirm = {
  slug: string;
  title: string;
  description: string;
  confirmLabel: string;
  action: StreamAction;
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

export function AdminStreamManagerPanel({
  showHeading = true,
}: {
  showHeading?: boolean;
}) {
  const [streams, setStreams] = useState<AdminLiveStreamRow[]>([]);
  const [streamStats, setStreamStats] = useState<
    Record<string, ChannelManageStats>
  >({});
  const [loading, setLoading] = useState(true);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsStream, setDetailsStream] = useState<AdminLiveStreamRow | null>(
    null,
  );
  const [streamsOpen, setStreamsOpen] = useState(false);
  const [pendingConfirm, setPendingConfirm] =
    useState<PendingStreamConfirm | null>(null);

  const reload = useCallback(() => {
    setRefreshing(true);
    void fetchAdminStreams().then(async (result) => {
      setStreams(result.data);
      const stats = await Promise.allSettled(
        result.data.map(async (stream) => {
          const response = await fetchChannelManageStats(stream.slug);
          return response.data ? ([stream.slug, response.data] as const) : null;
        }),
      );
      setStreamStats(
        Object.fromEntries(
          stats.flatMap((entry) =>
            entry.status === 'fulfilled' && entry.value ? [entry.value] : [],
          ),
        ),
      );
      setMessage(
        result.meta.reason && result.data.length === 0
          ? `Unable to load live streams: ${result.meta.reason}`
          : null,
      );
      setLoading(false);
      setRefreshing(false);
    });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const execute = (slug: string, action: StreamAction) => {
    setBusySlug(slug);
    void action(slug).then((result) => {
      setBusySlug(null);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage(null);
      reload();
    });
  };

  const run = (
    slug: string,
    action: StreamAction,
    confirm?: Omit<PendingStreamConfirm, 'slug' | 'action'>,
  ) => {
    if (confirm) {
      setPendingConfirm({ slug, action, ...confirm });
      return;
    }
    execute(slug, action);
  };

  const streamList = loading ? (
    <PageLoading label="Loading streams…" />
  ) : streams.length === 0 ? (
    <p className="text-foreground-secondary py-4 text-center text-sm">
      No channels are live right now.
    </p>
  ) : (
    <ul className="divide-border divide-y">
      {streams.map((stream) => (
        <li
          key={stream.slug}
          className="odd:bg-background-secondary/35 px-3 py-3 first:pt-0 last:pb-0 even:bg-transparent"
        >
          {(() => {
            const stats = streamStats[stream.slug];
            return (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-background border-border flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border text-sm font-bold">
                    <ImageReveal
                      src={stream.thumbnailUrl ?? stream.avatarUrl ?? undefined}
                      alt=""
                      className="size-full"
                      placeholder={
                        <span>
                          {stream.artistName.slice(0, 2).toUpperCase()}
                        </span>
                      }
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {stream.artistName}
                      {stream.isRotation && (
                        <span className="text-foreground-secondary font-normal">
                          {' '}
                          · rotation
                        </span>
                      )}
                    </div>
                    <div className="text-foreground-secondary truncate text-xs">
                      /c/{stream.slug} · total duration{' '}
                      {formatDuration(
                        stats?.liveDurationSec ?? stream.elapsedSec,
                      )}
                    </div>
                    {stats ? (
                      <div className="text-foreground-secondary mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                        <span>
                          {stats.listeners.toLocaleString()} listeners
                        </span>
                        <span>{stats.listenerPeak.toLocaleString()} peak</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-1">
                    {stream.hlsUrl ? (
                      <a href={stream.hlsUrl} target="_blank" rel="noreferrer">
                        <Tooltip content="Listen" side="top">
                          <Button
                            size="icon-sm"
                            variant="text"
                            aria-label={`Listen to ${stream.artistName}`}
                          >
                            <ExternalLinkIcon size={14} aria-hidden />
                          </Button>
                        </Tooltip>
                      </a>
                    ) : null}
                    <Tooltip content="Details" side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        aria-label={`Show details for ${stream.artistName}`}
                        onClick={() => setDetailsStream(stream)}
                      >
                        <EyeIcon size={14} aria-hidden />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Restart stream" side="top">
                      <Button
                        size="icon-sm"
                        variant="secondary"
                        aria-label={`Restart ${stream.artistName}`}
                        disabled={busySlug === stream.slug}
                        onClick={() =>
                          run(stream.slug, restartStream, {
                            title: `Restart audio for ${stream.slug}?`,
                            description:
                              'The channel stays live; listeners may briefly reconnect.',
                            confirmLabel: 'Restart',
                          })
                        }
                      >
                        <RotateCwIcon size={14} aria-hidden />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Skip current item" side="top">
                      <Button
                        size="icon-sm"
                        variant="secondary"
                        aria-label={`Skip ${stream.artistName}`}
                        disabled={busySlug === stream.slug}
                        onClick={() => run(stream.slug, skipStreamTrack)}
                      >
                        <SkipForwardIcon size={14} aria-hidden />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Pause stream" side="top">
                      <Button
                        size="icon-sm"
                        variant="secondary"
                        aria-label={`Pause ${stream.artistName}`}
                        disabled={busySlug === stream.slug}
                        onClick={() => run(stream.slug, pauseStream)}
                      >
                        <PauseIcon size={14} aria-hidden />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Resume stream" side="top">
                      <Button
                        size="icon-sm"
                        variant="secondary"
                        aria-label={`Resume ${stream.artistName}`}
                        disabled={busySlug === stream.slug}
                        onClick={() => run(stream.slug, resumeStream)}
                      >
                        <PlayIcon size={14} aria-hidden />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Force offline" side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        aria-label={`Take ${stream.artistName} offline`}
                        disabled={busySlug === stream.slug}
                        onClick={() =>
                          run(stream.slug, forceStreamOffline, {
                            title: `Force ${stream.slug} offline?`,
                            description: 'This ends the broadcast immediately.',
                            confirmLabel: 'Take offline',
                          })
                        }
                      >
                        <PowerIcon size={14} aria-hidden />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </>
            );
          })()}
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {showHeading ? (
        <StudioPanel
          title={`Live streams (${streams.length})`}
          description="Monitor active channels and control their live audio."
          action={
            <div className="flex items-center gap-1">
              <Tooltip
                content={streamsOpen ? 'Collapse streams' : 'Expand streams'}
                side="top"
              >
                <Button
                  type="button"
                  size="icon-sm"
                  variant="text"
                  aria-label={
                    streamsOpen
                      ? 'Collapse live streams'
                      : 'Expand live streams'
                  }
                  aria-expanded={streamsOpen}
                  onClick={() => setStreamsOpen((open) => !open)}
                >
                  {streamsOpen ? (
                    <ChevronUpIcon size={16} aria-hidden />
                  ) : (
                    <ChevronDownIcon size={16} aria-hidden />
                  )}
                </Button>
              </Tooltip>
              <Tooltip content="Refresh live streams" side="top">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="text"
                  aria-label="Refresh live streams"
                  disabled={refreshing}
                  onClick={reload}
                >
                  {refreshing ? (
                    <Loader size="sm" />
                  ) : (
                    <RefreshCw size={16} aria-hidden />
                  )}
                </Button>
              </Tooltip>
            </div>
          }
        >
          {message && (
            <p className="text-foreground-secondary mb-3 text-sm" role="status">
              {message}
            </p>
          )}
          {streamsOpen ? (
            streamList
          ) : (
            <p className="text-foreground-secondary text-sm">
              Stream list collapsed. Expand to inspect and control active
              streams.
            </p>
          )}
        </StudioPanel>
      ) : (
        <>
          {message && (
            <p className="text-foreground-secondary mb-3 text-sm" role="status">
              {message}
            </p>
          )}
          {streamsOpen ? (
            streamList
          ) : (
            <p className="text-foreground-secondary text-sm">
              Stream list collapsed. Expand to inspect and control active
              streams.
            </p>
          )}
        </>
      )}
      <Dialog.Root
        isOpen={detailsStream !== null}
        onClose={() => setDetailsStream(null)}
        className="max-w-lg"
      >
        {detailsStream ? (
          <>
            <Dialog.Title>{detailsStream.artistName}</Dialog.Title>
            <Dialog.Description>
              Live channel details for /c/{detailsStream.slug}.
            </Dialog.Description>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-foreground-secondary">Username</dt>
              <dd>{detailsStream.username}</dd>
              <dt className="text-foreground-secondary">Duration</dt>
              <dd>{formatDuration(detailsStream.elapsedSec)}</dd>
              {streamStats[detailsStream.slug] ? (
                <>
                  <dt className="text-foreground-secondary">Listeners</dt>
                  <dd>
                    {streamStats[
                      detailsStream.slug
                    ]!.listeners.toLocaleString()}
                  </dd>
                  <dt className="text-foreground-secondary">Listener peak</dt>
                  <dd>
                    {streamStats[
                      detailsStream.slug
                    ]!.listenerPeak.toLocaleString()}
                  </dd>
                </>
              ) : null}
              <dt className="text-foreground-secondary">Mode</dt>
              <dd>
                {detailsStream.isRotation ? 'Rotation' : 'Live broadcast'}
              </dd>
              {detailsStream.goneLiveAt ? (
                <>
                  <dt className="text-foreground-secondary">Started</dt>
                  <dd>{new Date(detailsStream.goneLiveAt).toLocaleString()}</dd>
                </>
              ) : null}
              {detailsStream.hlsUrl ? (
                <>
                  <dt className="text-foreground-secondary">Stream</dt>
                  <dd className="min-w-0 break-all">{detailsStream.hlsUrl}</dd>
                </>
              ) : null}
            </dl>
            <Dialog.Actions>
              <Dialog.Close>Close</Dialog.Close>
              <a
                href={`/c/${detailsStream.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="secondary">Open channel</Button>
              </a>
            </Dialog.Actions>
          </>
        ) : null}
      </Dialog.Root>
      <ConfirmDialog
        isOpen={pendingConfirm !== null}
        title={pendingConfirm?.title ?? 'Confirm'}
        description={pendingConfirm?.description ?? ''}
        confirmLabel={pendingConfirm?.confirmLabel}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => {
          const pending = pendingConfirm;
          setPendingConfirm(null);
          if (!pending) {
            return;
          }
          execute(pending.slug, pending.action);
        }}
      />
    </>
  );
}
