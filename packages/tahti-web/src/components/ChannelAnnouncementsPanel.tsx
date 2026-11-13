import { MicIcon, PlayIcon, Trash2Icon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  EditIconButton,
  FilePicker,
  InlineError,
  SectionTitle,
  Toggle,
} from '@tahti-player/ui';

import {
  deleteAnnouncementClip,
  fetchAnnouncementClips,
  fetchAnnouncementPreview,
  patchAnnouncementClip,
  setProfileBackgroundClip,
  uploadAnnouncementClip,
  type AnnouncementClip,
} from '../api/announcements';
import { fetchProgramme, type ProgrammeItem } from '../api/studio-extras';
import { usePolling } from '../hooks/usePolling';
import { toastWithUndo } from '../lib/undoToast';
import { ClipEditorDialog } from './channel-clips/ClipEditorDialog';
import { VoiceRecorder } from './channel-clips/VoiceRecorder';
import { PageEmpty, PageError, PageLoading } from './PageStates';

export function ChannelAnnouncementsPanel() {
  const { t } = useTranslation('web');
  const [clips, setClips] = useState<AnnouncementClip[]>([]);
  const [programs, setPrograms] = useState<ProgrammeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editor, setEditor] = useState<AnnouncementClip | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AnnouncementClip | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const previewRequest = useRef(0);
  const mounted = useRef(true);

  const reload = useCallback(() => {
    void fetchAnnouncementClips().then((result) => {
      if (!mounted.current) {
        return;
      }
      const reason =
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null;
      setLoadError(reason);
      if (!reason) {
        setClips(result.data);
      }
      setLoading(false);
    });
  }, []);
  useEffect(() => {
    mounted.current = true;
    reload();
    return () => {
      mounted.current = false;
      previewRequest.current++;
    };
  }, [reload]);
  usePolling(
    reload,
    5000,
    clips.some(
      (c) => c.renderStatus === 'PROCESSING' || c.draftStatus === 'PROCESSING',
    ),
  );

  const openEditor = async (clip: AnnouncementClip) => {
    previewRequest.current++;
    setPreviewId(null);
    setPreviewUrl(null);
    const result = await fetchProgramme();
    if (!mounted.current) {
      return;
    }
    setPrograms(
      result.data.items.filter(
        (p) => p.isFallback && p.status === 'READY' && !p.embedProvider,
      ),
    );
    setEditor(clip);
  };
  const upload = async (file: File) => {
    setUploading(true);
    const result = await uploadAnnouncementClip(file);
    if (!mounted.current) {
      return;
    }
    setUploading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const created = result.clip;
    setClips((current) => [created, ...current]);
    setRecording(false);
    toastWithUndo('Clip uploaded inactive. Preview it before activating.', {
      undo: () => deleteAnnouncementClip(created.id),
      undoneMessage: 'Clip removed.',
      onUndone: () =>
        setClips((current) => current.filter((clip) => clip.id !== created.id)),
    });
    await openEditor(result.clip);
  };
  const toggle = async (clip: AnnouncementClip) => {
    setBusyId(clip.id);
    const result = await patchAnnouncementClip(clip.id, {
      isEnabled: !clip.isEnabled,
    });
    setBusyId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setClips((current) =>
      current.map((c) => (c.id === clip.id ? result.clip : c)),
    );
  };
  const preview = async (clip: AnnouncementClip) => {
    const request = ++previewRequest.current;
    setPreviewUrl(null);
    if (previewId === clip.id) {
      setPreviewId(null);
      return;
    }
    setPreviewId(clip.id);
    const result = await fetchAnnouncementPreview(clip.id);
    if (request !== previewRequest.current) {
      return;
    }
    if (!result.ok) {
      setPreviewId(null);
      toast.error(result.error);
      return;
    }
    setPreviewUrl(result.url);
  };
  const pageMusic = async (clip: AnnouncementClip) => {
    setBusyId(clip.id);
    const result = await setProfileBackgroundClip(
      clip.isProfileBackground ? null : clip.id,
    );
    setBusyId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    reload();
  };
  const remove = async () => {
    if (!pendingDelete || busyId) {
      return;
    }
    setBusyId(pendingDelete.id);
    setDeleteError('');
    const result = await deleteAnnouncementClip(pendingDelete.id);
    setBusyId(null);
    if (!result.ok) {
      setDeleteError(result.error);
      return;
    }
    setClips((current) => current.filter((c) => c.id !== pendingDelete.id));
    if (previewId === pendingDelete.id) {
      previewRequest.current++;
      setPreviewId(null);
      setPreviewUrl(null);
    }
    setPendingDelete(null);
  };

  return (
    <section
      id="channel-clips"
      className="border-border bg-background-secondary/40 flex flex-col gap-5 rounded-xl border p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionTitle
            title={t('channelAnnouncementsPanel.clipsBetweenPrograms')}
            wrap
          />
          <p className="text-foreground-secondary mt-1 text-sm">
            Station IDs, voice links, and announcements for your 24/7 rotation.
            Turn on “Play clips between programs” in the settings above.
          </p>
        </div>
        <Button
          variant="secondary"
          disabled={uploading}
          onClick={() => setRecording((v) => !v)}
        >
          {recording
            ? t('channelAnnouncementsPanelStates.closeRecorder')
            : t('channelAnnouncementsPanelStates.recordVoice')}
        </Button>
      </div>
      {recording && (
        <VoiceRecorder
          disabled={uploading}
          onUse={(file) => void upload(file)}
        />
      )}
      <FilePicker
        accept="audio/*,.wav,.flac,.aiff,.aif"
        disabled={uploading}
        labels={{
          title: uploading
            ? t('channelAnnouncementsPanelStates.uploadingClip')
            : t('channelAnnouncementsPanelStates.uploadAudio'),
          description: i18n.t('web:batch52.clipAudioHint'),
          browse: uploading
            ? t('channelAnnouncementsPanelStates.uploading')
            : t('channelAnnouncementsPanelStates.chooseAudio'),
        }}
        onFiles={(files) => {
          if (files[0]) {
            void upload(files[0]);
          }
        }}
      />
      {loading ? (
        <PageLoading label={t('loading.loadingAnnouncements')} />
      ) : loadError && clips.length === 0 ? (
        <PageError
          title={t('loadErrors.couldNotLoadYourAnnouncementClips')}
          description={loadError}
          onRetry={reload}
        />
      ) : clips.length === 0 ? (
        <PageEmpty
          title={t('empties.noAnnouncementClipsYet')}
          description={t('empties.giveYourChannelAVoiceRecord')}
          action={
            recording ? undefined : (
              <Button
                size="sm"
                variant="secondary"
                disabled={uploading}
                onClick={() => setRecording(true)}
              >
                <MicIcon size={16} aria-hidden />
                {t('emptyActions.recordVoice')}
              </Button>
            )
          }
        />
      ) : (
        <ul className="border-border divide-border divide-y rounded-lg border">
          {clips.map((clip) => (
            <li key={clip.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-40 flex-1">
                <div className="font-semibold">{clip.title}</div>
                <p className="text-foreground-secondary text-xs">
                  {clip.durationSec == null
                    ? 'Duration pending'
                    : `${clip.durationSec} s`}{' '}
                  ·{' '}
                  {clip.isEnabled
                    ? t('channelAnnouncementsPanelStates.enabledInRotation')
                    : t('channelAnnouncementsPanelStates.inactive')}
                  {clip.draftStatus
                    ? ` · Preview ${clip.draftStatus.toLowerCase()}`
                    : ''}
                </p>
                <p className="text-foreground-secondary text-xs">
                  {clip.placement === 'BEFORE'
                    ? 'Before selected program'
                    : clip.placement === 'AFTER'
                      ? 'After selected program'
                      : clip.scheduleMode === 'AFTER_EVERY'
                        ? 'After every program'
                        : clip.scheduleMode === 'EVERY_NTH'
                          ? `Every ${clip.everyNth} programs`
                          : 'Occasionally between programs'}
                </p>
              </div>
              <Toggle
                aria-label={t('channelAnnouncementsPanelLabels.enableTitle', {
                  title: clip.title,
                })}
                checked={clip.isEnabled}
                disabled={busyId !== null || clip.renderStatus !== 'READY'}
                onChange={() => void toggle(clip)}
              />
              <Button
                size="icon-sm"
                variant="text"
                aria-label={t('channelAnnouncementsPanelLabels.previewTitle', {
                  title: clip.title,
                })}
                onClick={() => void preview(clip)}
              >
                <PlayIcon size={16} />
              </Button>
              <EditIconButton
                variant="text"
                label={t('channelAnnouncementsPanelLabels.editTitle', {
                  title: clip.title,
                })}
                disabled={clip.renderStatus === 'PROCESSING'}
                onClick={() => void openEditor(clip)}
              />
              <Button
                size="icon-sm"
                variant="text"
                aria-label={t('channelAnnouncementsPanelLabels.deleteTitle', {
                  title: clip.title,
                })}
                onClick={() => {
                  setDeleteError('');
                  setPendingDelete(clip);
                }}
              >
                <Trash2Icon className="text-accent-red-strong" size={16} />
              </Button>
              <details className="basis-full text-xs">
                <summary className="cursor-pointer">
                  {t('channelAnnouncementsPanel.pageMusic')}
                </summary>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busyId !== null || clip.renderStatus !== 'READY'}
                  onClick={() => void pageMusic(clip)}
                >
                  {clip.isProfileBackground
                    ? t('channelAnnouncementsPanelStates.removePageMusic')
                    : t('channelAnnouncementsPanelStates.useAsPageMusic')}
                </Button>
              </details>
              {previewId === clip.id &&
                (previewUrl ? (
                  <audio
                    src={previewUrl}
                    aria-label={t(
                      'channelAnnouncementsPanelLabels.previewTitle',
                      { title: clip.title },
                    )}
                    controls
                    autoPlay
                    className="w-full"
                  />
                ) : (
                  <p role="status">
                    {t('channelAnnouncementsPanel.loadingPreview')}
                  </p>
                ))}
            </li>
          ))}
        </ul>
      )}
      {editor && (
        <ClipEditorDialog
          key={editor.id}
          clip={editor}
          programs={programs}
          onClose={() => {
            setEditor(null);
            reload();
          }}
          onSaved={() => {
            setEditor(null);
            reload();
            toast.success(i18n.t('web:batch52.clipSaved'));
          }}
        />
      )}
      <Dialog.Root
        isOpen={pendingDelete !== null}
        onClose={() => {
          if (!busyId) {
            setPendingDelete(null);
          }
        }}
      >
        <Dialog.Title>
          {t('channelAnnouncementsPanelText.deleteTitle', {
            title: pendingDelete?.title ?? '',
          })}
        </Dialog.Title>
        <Dialog.Description>
          {pendingDelete?.isProfileBackground
            ? t('channelAnnouncementsPanelText.deleteBodyWithBackground')
            : t('channelAnnouncementsPanelText.deleteBody')}
        </Dialog.Description>
        {deleteError && <InlineError>{deleteError}</InlineError>}
        <Dialog.Actions>
          <Button
            variant="secondary"
            disabled={busyId !== null}
            onClick={() => setPendingDelete(null)}
          >
            {t('channelAnnouncementsPanel.cancel')}
          </Button>
          <Button
            intent="danger"
            disabled={busyId !== null}
            onClick={() => void remove()}
          >
            {busyId
              ? t('channelAnnouncementsPanelStates.deleting')
              : t('channelAnnouncementsPanelStates.delete')}
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </section>
  );
}
