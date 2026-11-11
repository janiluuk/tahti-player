import { PlayIcon, PlusIcon, Trash2Icon, UploadIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button, FilePicker, Select, Tooltip } from '@tahti-player/ui';

import {
  deleteReleaseTrackStem,
  fetchReleaseTrackStems,
  RELEASE_TRACK_STEM_ROLE_LABELS,
  RELEASE_TRACK_STEM_ROLES,
  uploadReleaseTrackStem,
  type ReleaseTrackStem,
  type ReleaseTrackStemRole,
} from '../../../api/release-track-stems';
import type { StudioRelease } from '../../../api/studio-types';
import { RELEASE_TRACK_AUDIO_TYPES } from '../../../api/studio/release-track-upload';
import { PageEmpty } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { usePlayerStore } from '../../../stores/playerStore';

type ReleaseTrack = NonNullable<StudioRelease['tracks']>[number];

function TrackStems({
  releaseId,
  track,
  onChanged,
}: {
  releaseId: string;
  track: ReleaseTrack;
  onChanged: (stems: ReleaseTrackStem[]) => void;
}) {
  const { t } = useTranslation('web');
  const play = usePlayerStore((s) => s.play);
  const currentId = usePlayerStore((s) => s.currentId);
  const [stems, setStems] = useState<ReleaseTrackStem[] | null>(
    track.stems
      ? track.stems.map((stem) => ({
          id: stem.id,
          role: stem.role as ReleaseTrackStemRole,
          status: stem.status,
          durationSec: stem.durationSec ?? null,
          audioUrl: stem.audioUrl ?? null,
          createdAt: stem.createdAt ?? new Date(0).toISOString(),
        }))
      : null,
  );
  const [adding, setAdding] = useState(false);
  const [role, setRole] = useState<ReleaseTrackStemRole>('vocals');
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchReleaseTrackStems(releaseId, track.id).then((result) => {
      if (!cancelled && result.data) {
        setStems(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [releaseId, track.id]);

  const taken = new Set((stems ?? []).map((stem) => stem.role));
  const availableRoles = RELEASE_TRACK_STEM_ROLES.filter(
    (candidate) => !taken.has(candidate) || candidate === role,
  );
  const roleOptions = availableRoles.map((candidate) => ({
    id: candidate,
    label: RELEASE_TRACK_STEM_ROLE_LABELS[candidate],
  }));

  const upload = async (files: readonly File[]) => {
    const file = files[0];
    if (!file) {
      return;
    }
    setUploading(true);
    const result = await uploadReleaseTrackStem(
      releaseId,
      track.id,
      role,
      file,
    );
    setUploading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const next = [
      ...(stems ?? []).filter((stem) => stem.role !== result.data.role),
      result.data,
    ].sort((a, b) => a.role.localeCompare(b.role));
    setStems(next);
    onChanged(next);
    setAdding(false);
    toast.success(
      t('toasts.stemUploaded', {
        role: RELEASE_TRACK_STEM_ROLE_LABELS[result.data.role],
      }),
    );
  };

  const remove = async (stem: ReleaseTrackStem) => {
    setRemovingId(stem.id);
    const result = await deleteReleaseTrackStem(releaseId, track.id, stem.id);
    setRemovingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const next = (stems ?? []).filter((row) => row.id !== stem.id);
    setStems(next);
    onChanged(next);
    toast.success(
      t('toasts.stemRemoved', {
        role: RELEASE_TRACK_STEM_ROLE_LABELS[stem.role as ReleaseTrackStemRole],
      }),
    );
  };

  return (
    <li className="flex flex-col gap-2 py-3">
      <h3 className="text-sm font-semibold">
        {track.position}. {track.title}
      </h3>
      {(stems ?? []).length === 0 && !adding ? (
        <PageEmpty
          title={t('studioReleaseDetail.stemsEmpty')}
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setAdding(true)}
            >
              <PlusIcon size={16} aria-hidden />
              {t('studioReleaseDetail.stemsAdd')}
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {(stems ?? []).map((stem) => {
            const label =
              RELEASE_TRACK_STEM_ROLE_LABELS[
                stem.role as ReleaseTrackStemRole
              ] ?? stem.role;
            const playableId = `stem:${stem.id}`;
            const isPlaying = currentId === playableId;
            return (
              <li
                key={stem.id}
                className="border-border flex flex-wrap items-center gap-2 rounded-md border px-3 py-2"
              >
                <span className="min-w-0 flex-1 font-medium">{label}</span>
                <Badge variant="pill" color="secondary">
                  {stem.status}
                </Badge>
                {stem.audioUrl ? (
                  <Tooltip
                    content={t('releaseTrackStems.playRole', { role: label })}
                    side="top"
                  >
                    <Button
                      size="icon-sm"
                      variant={isPlaying ? 'default' : 'secondary'}
                      aria-label={t('releaseTrackStems.playRole', {
                        role: label,
                      })}
                      onClick={() =>
                        play({
                          id: playableId,
                          kind: 'sound',
                          title: `${track.title} · ${label}`,
                          artist: 'You',
                          streamUrl: stem.audioUrl!,
                          protocol: stem.audioUrl!.includes('.m3u8')
                            ? 'hls'
                            : 'https',
                          durationSec: stem.durationSec,
                        })
                      }
                    >
                      <PlayIcon size={14} aria-hidden />
                    </Button>
                  </Tooltip>
                ) : null}
                <Tooltip
                  content={t('studioReleaseDetail.stemsReplace')}
                  side="top"
                >
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={uploading}
                    onClick={() => {
                      setRole(stem.role as ReleaseTrackStemRole);
                      setAdding(true);
                    }}
                  >
                    <UploadIcon size={14} aria-hidden className="mr-1.5" />
                    {t('studioReleaseDetail.stemsReplace')}
                  </Button>
                </Tooltip>
                <Tooltip
                  content={t('studioReleaseDetail.stemsRemove')}
                  side="top"
                >
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={t('studioReleaseDetail.stemsRemoveRole', {
                      role: label,
                    })}
                    disabled={removingId === stem.id}
                    onClick={() => void remove(stem)}
                  >
                    <Trash2Icon size={14} aria-hidden />
                  </Button>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      )}

      {adding ? (
        <div className="border-border flex flex-col gap-2 rounded-md border border-dashed p-3">
          <Select
            options={roleOptions}
            value={role}
            disabled={uploading}
            label={t('studioReleaseDetail.stemsRoleLabel')}
            onValueChange={(value) => setRole(value as ReleaseTrackStemRole)}
          />
          <FilePicker
            labels={{
              title: t('studioReleaseDetail.stemsPickerTitle', {
                role: RELEASE_TRACK_STEM_ROLE_LABELS[role],
              }),
              description: t('releaseTrackAudioUploadFields.wavFlacMp3AacOr'),
              browse: t('studioReleaseDetail.stemsBrowse'),
            }}
            accept={RELEASE_TRACK_AUDIO_TYPES.join(',')}
            disabled={uploading}
            onFiles={(files) => void upload(files)}
          />
          <Button
            size="sm"
            variant="text"
            className="self-start"
            disabled={uploading}
            onClick={() => setAdding(false)}
          >
            {t('releaseTrackAudioUpload.close')}
          </Button>
        </div>
      ) : (stems ?? []).length > 0 &&
        (stems ?? []).length < RELEASE_TRACK_STEM_ROLES.length ? (
        <Button
          size="sm"
          variant="secondary"
          className="self-start"
          onClick={() => {
            const nextRole =
              RELEASE_TRACK_STEM_ROLES.find(
                (candidate) => !taken.has(candidate),
              ) ?? 'vocals';
            setRole(nextRole);
            setAdding(true);
          }}
        >
          <PlusIcon size={16} aria-hidden />
          {t('studioReleaseDetail.stemsAdd')}
        </Button>
      ) : null}
    </li>
  );
}

export function ReleaseTrackStemsPanel({
  releaseId,
  tracks,
  onTrackStemsSaved,
}: {
  releaseId: string;
  tracks: ReleaseTrack[];
  onTrackStemsSaved: (trackId: string, stems: ReleaseTrackStem[]) => void;
}) {
  const { t } = useTranslation('web');

  if (tracks.length === 0) {
    return (
      <StudioPanel
        title={t('studioReleaseDetail.stemsTitle')}
        description={t('studioReleaseDetail.stemsDescription')}
      >
        <PageEmpty
          title={t('studioReleaseDetail.stemsNoTracksTitle')}
          description={t('studioReleaseDetail.stemsNoTracksDescription')}
        />
      </StudioPanel>
    );
  }

  return (
    <StudioPanel
      title={t('studioReleaseDetail.stemsTitle')}
      description={t('studioReleaseDetail.stemsDescription')}
    >
      <ul className="divide-border flex flex-col divide-y">
        {tracks.map((track) => (
          <TrackStems
            key={track.id}
            releaseId={releaseId}
            track={track}
            onChanged={(stems) => onTrackStemsSaved(track.id, stems)}
          />
        ))}
      </ul>
    </StudioPanel>
  );
}
