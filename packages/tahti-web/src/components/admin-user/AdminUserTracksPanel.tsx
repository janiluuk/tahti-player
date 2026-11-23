import { HardDriveIcon, PlayIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  ButtonLink,
  MediaArtwork,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import {
  bulkPatchAdminFiles,
  deleteAdminFile,
  fetchAdminFileAudio,
  fetchAdminFiles,
  type AdminFileRow,
} from '../../api/admin';
import { contentTypeLabel } from '../../content/contentTypes';
import { formatBytes, formatFileDate } from '../../lib/storageFormat';
import { usePlayerStore } from '../../stores/playerStore';
import { ConfirmDialog } from '../ConfirmDialog';
import { PageEmpty, PageError, PageLoading } from '../PageStates';
import { StudioPanel } from '../StudioPanel';

export function AdminUserTracksPanel({ userId }: { userId: string }) {
  const { t } = useTranslation('web');
  const play = usePlayerStore((state) => state.play);
  const [tracks, setTracks] = useState<AdminFileRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminFileRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchAdminFiles({ userId }).then((result) => {
      if (cancelled) {
        return;
      }
      setTracks(result.data);
      setTotal(result.total);
      setLoadError(result.meta.reason ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);

  const handlePlay = async (track: AdminFileRow) => {
    if (pendingId) {
      return;
    }
    setPendingId(track.id);
    const resolved = track.audioUrl
      ? {
          audioUrl: track.audioUrl,
          title: track.title,
          artistName: track.artistName,
          channelSlug: track.channelSlug,
          durationSec: track.durationSec,
        }
      : (await fetchAdminFileAudio(track.id)).data;
    setPendingId(null);
    if (!resolved?.audioUrl) {
      setNotice(t('adminUserTracks.couldNotPlay', { title: track.title }));
      return;
    }
    play({
      id: `admin-file:${track.id}`,
      kind: 'sound',
      title: resolved.title,
      artist: resolved.artistName,
      streamUrl: resolved.audioUrl,
      protocol: 'https',
      channelSlug: resolved.channelSlug,
      durationSec: resolved.durationSec,
    });
  };

  const setPublic = async (track: AdminFileRow, isPublic: boolean) => {
    setPendingId(track.id);
    setNotice(null);
    const result = await bulkPatchAdminFiles([track.id], { isPublic });
    setPendingId(null);
    if (!result.ok) {
      setNotice(
        t('adminUserTracks.couldNotUpdate', {
          title: track.title,
          error: result.error,
        }),
      );
      return;
    }
    setTracks((current) =>
      current.map((row) => (row.id === track.id ? { ...row, isPublic } : row)),
    );
  };

  const confirmDelete = async () => {
    const track = pendingDelete;
    setPendingDelete(null);
    if (!track) {
      return;
    }
    setNotice(null);
    const result = await deleteAdminFile(track.id);
    if (!result.ok) {
      setNotice(
        t('adminUserTracks.couldNotDelete', {
          title: track.title,
          error: result.error,
        }),
      );
      return;
    }
    setTracks((current) => current.filter((row) => row.id !== track.id));
    setTotal((current) => Math.max(0, current - 1));
  };

  return (
    <StudioPanel
      title={t('adminUserTracks.title')}
      description={t('adminUserTracks.description', { count: total })}
      action={
        <Tooltip content={t('adminUserTracks.openInStorage')} side="top">
          <ButtonLink
            to="/admin/storage/$userId"
            params={{ userId }}
            size="icon-sm"
            variant="secondary"
            aria-label={t('adminUserTracks.openInStorage')}
          >
            <HardDriveIcon size={15} aria-hidden />
          </ButtonLink>
        </Tooltip>
      }
    >
      {loading ? (
        <PageLoading label={t('adminUserTracks.loading')} />
      ) : loadError && tracks.length === 0 ? (
        <PageError
          title={t('adminUserTracks.couldNotLoad')}
          description={loadError}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      ) : tracks.length === 0 ? (
        <PageEmpty title={t('adminUserTracks.empty')} />
      ) : (
        <ul
          className="divide-border divide-y"
          aria-label={t('adminUserTracks.title')}
          data-testid="admin-user-tracks"
        >
          {tracks.map((track) => (
            <li
              key={track.id}
              className="flex flex-wrap items-center gap-3 py-3 text-sm"
            >
              <MediaArtwork
                alt=""
                seed={track.id}
                size="sm"
                className="size-10 shrink-0 rounded-md"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{track.title}</div>
                <div className="text-foreground-secondary text-xs">
                  {contentTypeLabel(track.contentType)} ·{' '}
                  {formatBytes(track.sizeBytes)} ·{' '}
                  {formatFileDate(track.createdAt)}
                  {track.genre ? ` · ${track.genre}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="pill"
                  color={track.isPublic ? 'green' : 'secondary'}
                >
                  {track.isPublic
                    ? t('adminUserTracks.public')
                    : t('adminUserTracks.private')}
                </Badge>
                <Toggle
                  label={t('adminUserTracks.publicToggle', {
                    title: track.title,
                  })}
                  checked={track.isPublic}
                  disabled={pendingId === track.id}
                  onChange={(next) => void setPublic(track, next)}
                />
                <Tooltip content={t('adminUserTracks.play')} side="top">
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={t('adminUserTracks.playTitle', {
                      title: track.title,
                    })}
                    disabled={pendingId === track.id}
                    onClick={() => void handlePlay(track)}
                  >
                    <PlayIcon size={16} aria-hidden />
                  </Button>
                </Tooltip>
                <Tooltip content={t('adminUserTracks.delete')} side="top">
                  <Button
                    size="icon-sm"
                    variant="text"
                    className="text-accent-red-strong hover:text-accent-red-strong"
                    aria-label={t('adminUserTracks.deleteTitle', {
                      title: track.title,
                    })}
                    disabled={pendingId === track.id}
                    onClick={() => setPendingDelete(track)}
                  >
                    <Trash2Icon size={15} aria-hidden />
                  </Button>
                </Tooltip>
              </div>
            </li>
          ))}
        </ul>
      )}
      {notice ? (
        <p className="text-accent-red-strong mt-3 text-sm" role="status">
          {notice}
        </p>
      ) : null}
      <ConfirmDialog
        destructive
        isOpen={pendingDelete !== null}
        title={
          pendingDelete
            ? t('adminStorage.deleteFileTitleNamed', {
                title: pendingDelete.title,
              })
            : t('adminStorage.deleteFileTitle')
        }
        description={t('adminStorage.deleteFileDescription')}
        confirmLabel={t('actions.delete')}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </StudioPanel>
  );
}
