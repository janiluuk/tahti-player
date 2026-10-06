import { Cast, Mic, Radio as RadioIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  ButtonLink,
  SelectableTile,
  SelectableTiles,
  Tabs,
} from '@tahti-player/ui';

import {
  fetchGreenRoomPrefs,
  patchGreenRoomPrefs,
  type GreenRoomPrefs,
  type WireGreenRoomInvitePool,
} from '../../../api/artist-settings';
import {
  fetchProgramme,
  patchProgramme,
  type ProgrammeView,
} from '../../../api/studio-extras';
import { MulticastSection } from '../../../components/MulticastSection';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';
import { SettingsHint, SettingsToggle } from '../SettingsFields';
import { BroadcastRecordingToggles } from './BroadcastRecordingToggles';

export type BroadcastSection = 'radio' | 'green-room' | 'multistream';

const GREEN_ROOM_POOL_OPTIONS: SelectableTile[] = [
  { id: 'MODERATORS_AND_SUBS', label: 'Moderators and fan subscribers' },
  { id: 'SUBS_ONLY', label: 'Fan subscribers only' },
  { id: 'EVERYONE', label: 'Everyone signed in' },
  { id: 'MANUAL_ONLY', label: 'Only people I invite' },
];

export function BroadcastPanel({
  section,
}: {
  section?: BroadcastSection;
} = {}) {
  const closeSettings = useSettingsModalStore((s) => s.close);
  const [programme, setProgramme] = useState<ProgrammeView | null>(null);
  const [green, setGreen] = useState<GreenRoomPrefs | null>(null);

  useEffect(() => {
    void Promise.all([fetchProgramme(), fetchGreenRoomPrefs()]).then(
      ([p, g]) => {
        setProgramme(p.data);
        setGreen(g.data);
      },
    );
  }, []);

  // Both saves show the new value at once and put the old one back, with the
  // API's reason, when the save fails.
  const saveProgramme = (
    patch: Partial<
      Pick<
        ProgrammeView,
        'announcementsEnabled' | 'fallbackEnabled' | 'fallbackAutoEnroll'
      >
    >,
  ) => {
    if (!programme) {
      return;
    }
    const previous = programme;
    setProgramme({ ...previous, ...patch });
    void patchProgramme(patch).then((result) => {
      if (!result.ok) {
        setProgramme(previous);
        toast.error(result.error);
      }
    });
  };

  const saveGreenRoom = (patch: Partial<GreenRoomPrefs>) => {
    if (!green) {
      return;
    }
    const previous = green;
    setGreen({ ...previous, ...patch });
    void patchGreenRoomPrefs(patch).then((result) => {
      if (!result.ok) {
        setGreen(previous);
        toast.error(result.error);
      }
    });
  };

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
            onChange={(v) => saveProgramme({ announcementsEnabled: v })}
          />
          <SettingsToggle
            label="Fallback / autoplay when offline"
            value={programme.fallbackEnabled}
            onChange={(v) => saveProgramme({ fallbackEnabled: v })}
          />
          <SettingsToggle
            label="Auto-enroll new archive into fallback"
            value={programme.fallbackAutoEnroll}
            onChange={(v) => saveProgramme({ fallbackAutoEnroll: v })}
          />
          <BroadcastRecordingToggles />
          <ButtonLink
            className="w-fit"
            to="/studio/schedule"
            onClick={closeSettings}
            size="sm"
            variant="secondary"
          >
            Open schedule / programme
          </ButtonLink>
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
          <SettingsToggle
            label="Open the green room when I go live"
            description="Each new broadcast starts with its green room open, and invites the people below. You can still open or close it from Go Live."
            value={green.defaultEnabled}
            onChange={(defaultEnabled) => saveGreenRoom({ defaultEnabled })}
          />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-foreground text-sm font-semibold">
              Who gets invited
            </span>
            <SelectableTiles
              items={GREEN_ROOM_POOL_OPTIONS}
              selected={green.invitePool}
              onChange={(value) => {
                saveGreenRoom({ invitePool: value as WireGreenRoomInvitePool });
              }}
              className="grid-cols-2"
            />
            <span className="text-foreground-secondary text-xs">
              Invited guests can listen before the stream goes public. You can
              invite anyone else by handle from Go Live.
            </span>
          </label>
          <ButtonLink
            className="w-fit"
            to="/studio/go-live"
            search={{ tab: 'green-room' }}
            onClick={closeSettings}
            size="sm"
            variant="secondary"
          >
            Open green room session
          </ButtonLink>
        </div>
      ),
    },
    {
      id: 'multistream',
      label: 'Multistream',
      icon: <Cast size={14} />,
      content: (
        <div className="flex flex-col gap-6">
          <MulticastSection />
          <ButtonLink
            className="w-fit"
            to="/studio/go-live"
            search={{ tab: 'destinations' }}
            onClick={closeSettings}
            size="sm"
            variant="secondary"
          >
            Manage live destinations
          </ButtonLink>
        </div>
      ),
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
