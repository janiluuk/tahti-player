import {
  CalendarClockIcon,
  PlayIcon,
  ScissorsIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
  Button,
  FilePicker,
  Toggle,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  deleteAnnouncementClip,
  fetchAdminAnnouncements,
  patchAnnouncementClip,
  setAnnouncementsSystemEnabled,
  uploadAnnouncementClip,
  type AdminAnnouncementClip,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminHubBreadcrumb } from '../../components/AdminHubBreadcrumb';
import { AdminPageLayout } from '../../components/AdminNav';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageEmpty, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { apiResult, useSnapshotFetch } from '../../lib/useSnapshotFetch';
import { usePlayerStore } from '../../stores/playerStore';
import {
  AnnouncementScheduleDialog,
  announcementScheduleLabel,
} from './announcements/AnnouncementScheduleDialog';
import { AnnouncementTrimDialog } from './announcements/AnnouncementTrimDialog';

function fmtDuration(sec: number | null): string {
  if (sec == null) {
    return '—';
  }
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function AdminAnnouncementsView() {
  const { t } = useTranslation('web');

  const play = usePlayerStore((s) => s.play);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<AdminAnnouncementClip | null>(null);
  const [trimming, setTrimming] = useState<AdminAnnouncementClip | null>(null);
  const [scheduling, setScheduling] = useState<AdminAnnouncementClip | null>(
    null,
  );

  const snapshot = useSnapshotFetch<{
    clips: AdminAnnouncementClip[];
    systemEnabled: boolean;
  }>('admin-announcements', async () =>
    apiResult(await fetchAdminAnnouncements()),
  );
  const clips = snapshot.data?.clips ?? [];
  const systemEnabled = snapshot.data?.systemEnabled ?? true;
  const { loading, retry: reload } = snapshot;
  const setSystemEnabled = (enabled: boolean) =>
    snapshot.mutate((current) => ({
      clips: current?.clips ?? [],
      systemEnabled: enabled,
    }));

  const patch = (
    id: string,
    p: Partial<
      Pick<AdminAnnouncementClip, 'isEnabled' | 'scheduleMode' | 'everyNth'>
    >,
  ) => {
    void patchAnnouncementClip(id, p).then((r) => {
      if (!r.ok) {
        setMsg(r.error);
      } else {
        reload();
      }
    });
  };

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/announcements">
          <div className="flex flex-col gap-6">
            <Breadcrumbs>
              <BreadcrumbLink to="/admin">
                {t('adminAnnouncements.admin')}
              </BreadcrumbLink>
              <AdminHubBreadcrumb hub="content" />
              <BreadcrumbCurrent>
                {t('adminAnnouncements.announcements')}
              </BreadcrumbCurrent>
            </Breadcrumbs>
            <ViewShell
              title={t('adminAnnouncements.announcements')}
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              {msg && (
                <p className="text-foreground-secondary text-sm" role="status">
                  {msg}
                </p>
              )}

              <StudioPanel
                title={t('adminAnnouncements.systemAnnouncements')}
                action={
                  <Toggle
                    label={t('adminAnnouncements.systemAnnouncements')}
                    checked={systemEnabled}
                    onChange={(checked) => {
                      void setAnnouncementsSystemEnabled(checked).then((r) => {
                        if (!r.ok) {
                          setMsg(r.error);
                        } else {
                          setSystemEnabled(checked);
                        }
                      });
                    }}
                  />
                }
              >
                <p className="text-foreground-secondary text-sm">
                  {t('adminAnnouncements.turningThisOffStopsAll')}
                </p>
              </StudioPanel>

              <StudioPanel title={t('adminAnnouncements.clips')}>
                <FilePicker
                  accept="audio/*"
                  disabled={uploading}
                  labels={{
                    title: uploading
                      ? t('adminAnnouncementsViewStates.uploadingAnnouncement')
                      : t('adminAnnouncementsViewStates.announcementClip'),
                    description: t('adminAnnouncementsView.chooseAShortMp3Wav'),
                    browse: uploading
                      ? t('adminAnnouncementsViewStates.uploading')
                      : t('adminAnnouncementsViewStates.chooseAudio'),
                  }}
                  onFiles={(files) => {
                    const file = files[0];
                    if (!file) {
                      return;
                    }
                    setUploading(true);
                    void uploadAnnouncementClip(file).then((result) => {
                      setUploading(false);
                      if (!result.ok) {
                        setMsg(result.error);
                      } else {
                        reload();
                      }
                    });
                  }}
                />
                {loading ? (
                  <PageLoading label={t('loading.loadingAnnouncements')} />
                ) : clips.length === 0 ? (
                  <PageEmpty title={t('empties.noAnnouncementClips')} />
                ) : (
                  <ul className="divide-border divide-y">
                    {clips.map((clip) => (
                      <li
                        key={clip.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <Toggle
                            label={t(
                              'adminAnnouncementsViewLabels.enableTitle',
                              { title: clip.title },
                            )}
                            checked={clip.isEnabled}
                            onChange={(checked) =>
                              patch(clip.id, { isEnabled: checked })
                            }
                          />
                          <div>
                            <div className="font-medium">{clip.title}</div>
                            <div className="text-foreground-secondary flex items-center gap-2 text-xs">
                              {fmtDuration(clip.durationSec)}
                              <span aria-hidden>·</span>
                              <span>{announcementScheduleLabel(clip, t)}</span>
                              {clip.renderStatus === 'PROCESSING' ? (
                                <Badge variant="pill" color="cyan">
                                  {t('adminAnnouncements.rendering')}
                                </Badge>
                              ) : clip.renderStatus === 'ERROR' ? (
                                <Badge variant="pill" color="red">
                                  {t('adminAnnouncements.renderFailed')}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <Tooltip
                            content={t('adminAnnouncements.editScheduleOf', {
                              title: clip.title,
                            })}
                            side="top"
                          >
                            <Button
                              size="icon-sm"
                              variant="text"
                              aria-label={t(
                                'adminAnnouncements.editScheduleOf',
                                { title: clip.title },
                              )}
                              onClick={() => setScheduling(clip)}
                            >
                              <CalendarClockIcon size={16} aria-hidden />
                            </Button>
                          </Tooltip>
                          {clip.audioUrl && (
                            <Tooltip
                              content={t(
                                'adminAnnouncementsViewLabels.previewTitle',
                                { title: clip.title },
                              )}
                              side="top"
                            >
                              <Button
                                size="icon-sm"
                                variant="text"
                                aria-label={t(
                                  'adminAnnouncementsViewLabels.previewTitle',
                                  { title: clip.title },
                                )}
                                onClick={() => {
                                  play({
                                    id: `announcement:${clip.id}`,
                                    kind: 'sound',
                                    title: clip.title,
                                    artist: 'System announcement',
                                    streamUrl: clip.audioUrl!,
                                    protocol: 'https',
                                  });
                                }}
                              >
                                <PlayIcon size={16} aria-hidden />
                              </Button>
                            </Tooltip>
                          )}
                          <Button
                            size="sm"
                            variant="text"
                            disabled={clip.renderStatus === 'PROCESSING'}
                            onClick={() => setTrimming(clip)}
                          >
                            <ScissorsIcon
                              size={14}
                              aria-hidden
                              className="mr-1.5"
                            />
                            {t('adminAnnouncements.trim')}
                          </Button>
                          <Button
                            size="sm"
                            variant="text"
                            onClick={() => setPendingDelete(clip)}
                          >
                            <Trash2Icon
                              size={14}
                              aria-hidden
                              className="text-accent-red-strong mr-1.5"
                            />
                            {t('adminAnnouncements.delete')}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </StudioPanel>
            </ViewShell>
            <AnnouncementScheduleDialog
              clip={scheduling}
              onClose={() => setScheduling(null)}
              onSave={(clip, schedule) => {
                setScheduling(null);
                patch(clip.id, schedule);
              }}
            />
            <AnnouncementTrimDialog
              clip={trimming}
              onClose={() => setTrimming(null)}
              onRendered={() => {
                setTrimming(null);
                setMsg('Rendering the trimmed clip…');
                reload();
              }}
            />
            <ConfirmDialog
              destructive
              isOpen={pendingDelete !== null}
              title={t('adminAnnouncements.deleteTitleNamed', {
                title: pendingDelete?.title ?? '',
              })}
              description={t('adminAnnouncements.deleteDescription')}
              confirmLabel={t('actions.delete')}
              onCancel={() => setPendingDelete(null)}
              onConfirm={() => {
                const clip = pendingDelete;
                setPendingDelete(null);
                if (!clip) {
                  return;
                }
                void deleteAnnouncementClip(clip.id).then((r) => {
                  if (!r.ok) {
                    setMsg(r.error);
                  } else {
                    reload();
                  }
                });
              }}
            />
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
