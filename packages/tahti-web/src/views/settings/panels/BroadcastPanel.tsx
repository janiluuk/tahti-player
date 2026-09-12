import { Link } from '@tanstack/react-router';
import { Cast, Mic, Radio as RadioIcon, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, Input, Tabs } from '@tahti-player/ui';

import {
  fetchGreenRoomPrefs,
  fetchModerators,
  patchGreenRoomPrefs,
  type GreenRoomPrefs,
  type ModeratorRow,
} from '../../../api/artist-settings';
import {
  fetchProgramme,
  patchProgramme,
  type ProgrammeView,
} from '../../../api/studio-extras';
import { MulticastSection } from '../../../components/MulticastSection';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';
import { SettingsHint, SettingsToggle } from '../SettingsFields';

export type BroadcastSection = 'radio' | 'green-room' | 'multistream';

export function BroadcastPanel({
  section,
}: {
  section?: BroadcastSection;
} = {}) {
  const closeSettings = useSettingsModalStore((s) => s.close);
  const [programme, setProgramme] = useState<ProgrammeView | null>(null);
  const [green, setGreen] = useState<GreenRoomPrefs | null>(null);
  const [mods, setMods] = useState<ModeratorRow[]>([]);

  useEffect(() => {
    void Promise.all([
      fetchProgramme(),
      fetchGreenRoomPrefs(),
      fetchModerators(),
    ]).then(([p, g, m]) => {
      setProgramme(p.data);
      setGreen(g.data);
      setMods(m.data);
    });
  }, []);

  const items = [
    {
      id: 'radio',
      label: 'Radio',
      icon: <RadioIcon size={14} />,
      content: !programme ? (
        <SettingsHint>Loading…</SettingsHint>
      ) : (
        <div className="flex flex-col gap-6">
          <SettingsToggle
            label="Announcements enabled"
            description="Allow platform/radio announcements on your channel programme."
            value={programme.announcementsEnabled}
            onChange={(v) => {
              const next = { ...programme, announcementsEnabled: v };
              setProgramme(next);
              void patchProgramme({ announcementsEnabled: v });
            }}
          />
          <SettingsToggle
            label="Fallback / autoplay when offline"
            value={programme.fallbackEnabled}
            onChange={(v) => {
              const next = { ...programme, fallbackEnabled: v };
              setProgramme(next);
              void patchProgramme({ fallbackEnabled: v });
            }}
          />
          <SettingsToggle
            label="Auto-enroll new archive into fallback"
            value={programme.fallbackAutoEnroll}
            onChange={(v) => {
              const next = { ...programme, fallbackAutoEnroll: v };
              setProgramme(next);
              void patchProgramme({ fallbackAutoEnroll: v });
            }}
          />
          <Link to="/studio/schedule" onClick={closeSettings}>
            <Button size="sm" variant="secondary">
              Open schedule / programme
            </Button>
          </Link>
        </div>
      ),
    },
    {
      id: 'green-room',
      label: 'Green room',
      icon: <Mic size={14} />,
      content: !green ? (
        <SettingsHint>Loading…</SettingsHint>
      ) : (
        <div className="flex flex-col gap-6">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-foreground text-sm font-semibold">
              Who can join
            </span>
            <div className="flex gap-2">
              {(
                [
                  ['everyone', 'Everyone'],
                  ['subscribers', 'Subscribers only'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={green.access === value}
                  onClick={() => {
                    setGreen({ ...green, access: value });
                    void patchGreenRoomPrefs({ access: value });
                  }}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    green.access === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="text-foreground-secondary text-xs">
              Anyone signed in, or only listeners with an active fan
              subscription to you.
            </span>
          </label>
          <Input
            label="Default show title"
            value={green.defaultTitle}
            onChange={(e) =>
              setGreen({ ...green, defaultTitle: e.target.value })
            }
            onBlur={() =>
              void patchGreenRoomPrefs({
                defaultTitle: green.defaultTitle,
              })
            }
          />
          <Input
            label="Default note"
            value={green.defaultNote}
            onChange={(e) =>
              setGreen({ ...green, defaultNote: e.target.value })
            }
            onBlur={() =>
              void patchGreenRoomPrefs({ defaultNote: green.defaultNote })
            }
          />
          <SettingsToggle
            label="Auto-announce when going live"
            value={green.autoAnnounce}
            onChange={(v) => {
              setGreen({ ...green, autoAnnounce: v });
              void patchGreenRoomPrefs({ autoAnnounce: v });
            }}
          />
          <SettingsToggle
            label="Hold music while waiting for signal"
            value={green.holdMusicEnabled}
            onChange={(v) => {
              setGreen({ ...green, holdMusicEnabled: v });
              void patchGreenRoomPrefs({ holdMusicEnabled: v });
            }}
          />
          <Link to="/studio/go-live" onClick={closeSettings}>
            <Button size="sm" variant="secondary">
              Broadcast
            </Button>
          </Link>
        </div>
      ),
    },
    {
      id: 'moderators',
      label: 'Moderators',
      icon: <Shield size={14} />,
      content: (
        <div className="flex flex-col gap-4">
          <SettingsHint>Chat moderators for your live channel.</SettingsHint>
          {mods.length === 0 ? (
            <SettingsHint>No moderators yet.</SettingsHint>
          ) : (
            <ul className="flex flex-col gap-2">
              {mods.map((m) => (
                <li
                  key={m.id}
                  className="border-border flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <span>
                    {m.displayName} (@{m.username})
                  </span>
                  <span className="text-foreground-secondary text-xs">
                    {m.canTimeout ? 'timeout' : ''}
                    {m.canTimeout && m.canDelete ? ', ' : ''}
                    {m.canDelete ? 'delete' : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <SettingsHint>
            View the current team here. Manage invitations and permissions from
            your account on tahti.live.
          </SettingsHint>
        </div>
      ),
    },
    {
      id: 'multistream',
      label: 'Multistream',
      icon: <Cast size={14} />,
      content: <MulticastSection />,
    },
  ];

  if (section) {
    return (
      <div className="flex flex-col gap-6">
        {items.find((item) => item.id === section)?.content}
      </div>
    );
  }

  return <Tabs listClassName="flex-wrap" items={items} />;
}
