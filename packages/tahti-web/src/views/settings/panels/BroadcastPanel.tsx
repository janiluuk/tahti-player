import { Cast, Mic } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import {
  ButtonLink,
  InlineLoader,
  SelectableTile,
  SelectableTiles,
} from '@tahti-player/ui';

import {
  fetchGreenRoomPrefs,
  patchGreenRoomPrefs,
  type GreenRoomPrefs,
  type WireGreenRoomInvitePool,
} from '../../../api/artist-settings';
import { MulticastSection } from '../../../components/MulticastSection';
import { PageError } from '../../../components/PageStates';
import { SettingsHint, SettingsToggle } from '../SettingsFields';

export type BroadcastSection = 'green-room' | 'multistream';

/** Green room and multistream defaults, shown as sections of Studio →
 * Broadcast → Channel. */
export function BroadcastPanel({ section }: { section: BroadcastSection }) {
  const { t } = useTranslation('web');
  const greenRoomPoolOptions: SelectableTile[] = [
    {
      id: 'MODERATORS_AND_SUBS',
      label: t('settingsBody.broadcast.invitePoolModeratorsSubs'),
    },
    {
      id: 'SUBS_ONLY',
      label: t('settingsBody.broadcast.invitePoolSubsOnly'),
    },
    {
      id: 'EVERYONE',
      label: t('settingsBody.broadcast.invitePoolEveryone'),
    },
    {
      id: 'MANUAL_ONLY',
      label: t('settingsBody.broadcast.invitePoolManualOnly'),
    },
  ];
  const [green, setGreen] = useState<GreenRoomPrefs | null>(null);
  const [greenError, setGreenError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    void fetchGreenRoomPrefs().then((g) => {
      const greenReason =
        g.meta.source === 'api' ? (g.meta.reason ?? null) : null;
      setGreenError(greenReason);
      setGreen(greenReason ? null : g.data);
    });
  }, [attempt]);

  const retry = () => {
    setGreenError(null);
    setAttempt((n) => n + 1);
  };

  // The save shows the new value at once and puts the old one back, with
  // the API's reason, when it fails.
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
      id: 'green-room',
      label: t('settingsBody.broadcast.greenRoomTab'),
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
              items={greenRoomPoolOptions}
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
            search={{ step: 'green-room' }}
            size="sm"
            variant="secondary"
          >
            {t('settingsBody.broadcast.openGreenRoomSession')}
          </ButtonLink>
        </div>
      ),
    },
    {
      id: 'multistream',
      label: t('settingsBody.broadcast.multistreamTab'),
      icon: <Cast size={14} />,
      content: (
        <div className="flex flex-col gap-6">
          <MulticastSection />
          <ButtonLink
            className="w-fit"
            to="/studio/go-live"
            search={{ step: 'destinations' }}
            size="sm"
            variant="secondary"
          >
            {t('settingsBody.broadcast.manageLiveDestinations')}
          </ButtonLink>
        </div>
      ),
    },
  ];

  const studioBroadcastLink = (
    <div className="flex flex-col gap-2">
      <SettingsHint>{t('broadcastPanel.defaultsHint')}</SettingsHint>
      <ButtonLink
        className="h-auto min-h-9 w-fit max-w-full py-1.5 whitespace-normal"
        to="/studio/go-live"
        size="sm"
        variant="secondary"
      >
        {t('broadcastPanel.openStudioBroadcast')}
      </ButtonLink>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {studioBroadcastLink}
      {items.find((item) => item.id === section)?.content}
    </div>
  );
}
