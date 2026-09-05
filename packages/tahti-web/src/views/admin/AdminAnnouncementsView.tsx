import { PlayIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Button,
  FilePicker,
  Input,
  Select,
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
  type AdminAnnouncementScheduleMode,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { usePlayerStore } from '../../stores/playerStore';

function fmtDuration(sec: number | null): string {
  if (sec == null) {
    return '—';
  }
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function AdminAnnouncementsView() {
  const play = usePlayerStore((s) => s.play);
  const [clips, setClips] = useState<AdminAnnouncementClip[]>([]);
  const [systemEnabled, setSystemEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = () => {
    void fetchAdminAnnouncements().then((res) => {
      setClips(res.data.clips);
      setSystemEnabled(res.data.systemEnabled);
      setLoading(false);
    });
  };

  useEffect(reload, []);

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
          <ViewShell title="Announcements" classes={{ root: 'px-0 pt-0' }}>
            {msg && (
              <p className="text-foreground-secondary text-sm" role="status">
                {msg}
              </p>
            )}

            <StudioPanel
              title="System announcements"
              action={
                <Toggle
                  label="System announcements"
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
                Turning this off stops all system announcements everywhere,
                instantly — each clip below still keeps its own on/off and
                schedule.
              </p>
            </StudioPanel>

            <StudioPanel title="Clips">
              <FilePicker
                accept="audio/*"
                disabled={uploading}
                labels={{
                  title: uploading
                    ? 'Uploading announcement…'
                    : 'Announcement clip',
                  description: 'Choose a short MP3, WAV, FLAC, or AIFF clip.',
                  browse: uploading ? 'Uploading…' : 'Choose audio',
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
                <PageLoading label="Loading announcements…" />
              ) : clips.length === 0 ? (
                <p className="text-foreground-secondary py-4 text-center text-sm">
                  No system announcement clips yet.
                </p>
              ) : (
                <ul className="divide-border divide-y">
                  {clips.map((clip) => (
                    <li
                      key={clip.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <Toggle
                          label={`Enable ${clip.title}`}
                          checked={clip.isEnabled}
                          onChange={(checked) =>
                            patch(clip.id, { isEnabled: checked })
                          }
                        />
                        <div>
                          <div className="font-medium">{clip.title}</div>
                          <div className="text-foreground-secondary text-xs">
                            {fmtDuration(clip.durationSec)}
                          </div>
                        </div>
                      </div>
                      <div className="flex min-w-48 flex-wrap items-center gap-2">
                        <Select
                          label="Schedule"
                          value={clip.scheduleMode}
                          onValueChange={(value) => {
                            const scheduleMode =
                              value as AdminAnnouncementScheduleMode;
                            patch(clip.id, {
                              scheduleMode,
                              everyNth:
                                scheduleMode === 'EVERY_NTH'
                                  ? (clip.everyNth ?? 4)
                                  : null,
                            });
                          }}
                          options={[
                            {
                              id: 'AFTER_EVERY',
                              label: 'After every clip',
                            },
                            { id: 'EVERY_NTH', label: 'Every Nth clip' },
                            { id: 'RANDOM', label: 'Randomly' },
                          ]}
                        />
                        {clip.scheduleMode === 'EVERY_NTH' && (
                          <Input
                            type="number"
                            variant="number"
                            size="sm"
                            min={2}
                            max={100}
                            label="Every Nth"
                            value={clip.everyNth ?? 4}
                            onChange={(event) =>
                              patch(clip.id, {
                                everyNth: Number(event.target.value),
                              })
                            }
                            className="w-24"
                          />
                        )}
                        {clip.audioUrl && (
                          <Tooltip content="Preview" side="top">
                            <Button
                              size="icon-sm"
                              variant="text"
                              aria-label="Preview"
                              onClick={() => {
                                play({
                                  id: `announcement:${clip.id}`,
                                  kind: 'archive',
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
                          onClick={() => {
                            void deleteAnnouncementClip(clip.id).then((r) => {
                              if (!r.ok) {
                                setMsg(r.error);
                              } else {
                                reload();
                              }
                            });
                          }}
                        >
                          <Trash2Icon
                            size={14}
                            aria-hidden
                            className="mr-1.5"
                          />
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </StudioPanel>
          </ViewShell>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
