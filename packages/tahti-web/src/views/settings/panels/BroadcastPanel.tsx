import { Cast, Mic, Radio as RadioIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import {
  ButtonLink,
  InlineLoader,
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
import { PageError } from '../../../components/PageStates';
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
  const { t } = useTranslation('web');
  const closeSettings = useSettingsModalStore((s) => s.close);
  const [programme, setProgramme] = useState<ProgrammeView | null>(null);
  const [green, setGreen] = useState<GreenRoomPrefs | null>(null);
  const [programmeError, setProgrammeError] = useState<string | null>(null);
  const [greenError, setGreenError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    void Promise.all([fetchProgramme(), fetchGreenRoomPrefs()]).then(
      ([p, g]) => {
        const programmeReason =
          p.meta.source === 'api' ? (p.meta.reason ?? null) : null;
        const greenReason =
          g.meta.source === 'api' ? (g.meta.reason ?? null) : null;
        setProgrammeError(programmeReason);
        setGreenError(greenReason);
        setProgramme(programmeReason ? null : p.data);
        setGreen(greenReason ? null : g.data);
      },
    );
  }, [attempt]);

  const retry = () => {
    setProgrammeError(null);
    setGreenError(null);
    setAttempt((n) => n + 1);
  };

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
        programmeError ? (
          <PageError
            title={t('settingsBody.broadcast.radioLoadError')}
            description={programmeError}
            onRetry={retry}
          />
        ) : (
          <InlineLoader label={t('settingsBody.loading')} />
        )
      ) : (
        <div className="flex flex-col gap-6">
          <SettingsToggle
            label={t('settingsBody.broadcast.announcementsLabel')}
            description={t('settingsBody.broadcast.announcementsDescription')}
            value={programme.announcementsEnabled}
            onChange={(v) => saveProgramme({ announcementsEnabled: v })}
          />
          <SettingsToggle
            label={t('settingsBody.broadcast.fallbackLabel')}
            value={programme.fallbackEnabled}
            onChange={(v) => saveProgramme({ fallbackEnabled: v })}
          />
          <SettingsToggle
            label={t('settingsBody.broadcast.autoEnrollLabel')}
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
            {t('settingsBody.broadcast.openSchedule')}
          </ButtonLink>
        </div>
      ),
    },
    {
      id: 'green-room',
      label: 'Green room',
      icon: <Mic size={14} />,
      content: !green ? (
        greenError ? (
          <PageError
            title={t('settingsBody.broadcast.greenRoomLoadError')}
            description={greenError}
            onRetry={retry}
          />
        ) : (
          <InlineLoader label={t('settingsBody.loading')} />
        )
      ) : (
        <div className="flex flex-col gap-6">
          <SettingsToggle
            label={t('settingsBody.broadcast.greenRoomDefaultLabel')}
            description={t(
              'settingsBody.broadcast.greenRoomDefaultDescription',
            )}
            value={green.defaultEnabled}
            onChange={(defaultEnabled) => saveGreenRoom({ defaultEnabled })}
          />
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="text-foreground text-sm font-semibold" aria-hidden>
              {t('settingsBody.broadcast.whoInvited')}
            </span>
            <SelectableTiles
              aria-label={t('settingsBody.broadcast.whoInvited')}
              items={GREEN_ROOM_POOL_OPTIONS}
              selected={green.invitePool}
              onChange={(value) => {
                saveGreenRoom({ invitePool: value as WireGreenRoomInvitePool });
              }}
              className="grid-cols-2"
            />
            <span className="text-foreground-secondary text-xs">
              {t('settingsBody.broadcast.invitedHint')}
            </span>
          </div>
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

  const studioBroadcastLink = (
    <div className="flex flex-col gap-2">
      <SettingsHint>
        Defaults for radio, green room, and multistream live here. Run the live
        session from Studio › Broadcast.
      </SettingsHint>
      <ButtonLink
        className="w-fit"
        to="/studio/go-live"
        onClick={closeSettings}
        size="sm"
        variant="secondary"
      >
        Open Studio › Broadcast for the live session
      </ButtonLink>
    </div>
  );

  if (section) {
    return (
      <div className="flex flex-col gap-6">
        {studioBroadcastLink}
        {items.find((item) => item.id === section)?.content}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {studioBroadcastLink}
      <Tabs listClassName="flex-wrap" items={items} />
    </div>
  );
}
