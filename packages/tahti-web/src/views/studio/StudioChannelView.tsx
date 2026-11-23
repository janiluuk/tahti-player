import { useLocation, useNavigate, useSearch } from '@tanstack/react-router';
import {
  ListMusicIcon,
  MessageSquareIcon,
  PinIcon,
  PlusIcon,
  RadioIcon,
  RadioTowerIcon,
  WifiIcon,
} from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import { Button, ButtonLink, Tabs, ViewShell } from '@tahti-player/ui';

import { PinnedAnnouncementsPanel } from '../../components/PinnedAnnouncementsPanel';
import { StreamManagerPanel } from '../../components/StreamManagerPanel';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { StudioRadioSubmissionPanel } from '../../components/StudioRadioSubmissionPanel';
import {
  isChannelRadioTab,
  type ChannelRadioTab,
  type ChannelSection,
} from '../../lib/channelSections';
import { useAuthStore } from '../../stores/authStore';
import { useChannelSetupModalStore } from '../../stores/channelSetupModalStore';

function radioSettingTabs(t: TFunction<'web'>) {
  return [
    {
      id: 'stream' as const,
      label: t('studioChannelViewMore.stream'),
      icon: RadioTowerIcon,
    },
    {
      id: 'pinned' as const,
      label: t('studioChannelViewMore.pinned'),
      icon: PinIcon,
    },
    {
      id: 'multicast' as const,
      label: t('studioChannelViewMore.multicast'),
      icon: WifiIcon,
    },
  ] satisfies { id: ChannelRadioTab; label: string; icon: unknown }[];
}

function ChannelSectionBlock({
  id,
  title,
  children,
}: {
  id: ChannelSection;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="flex scroll-mt-4 flex-col gap-4"
      data-testid={`channel-section-${id}`}
    >
      <h2
        id={`${id}-title`}
        className="font-display text-lg font-bold tracking-tight"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function ChannelHomeLinks() {
  const { t } = useTranslation('web');
  const username = useAuthStore((s) => s.user?.username);
  return (
    <StudioPanel title={t('studioChannelView.programmeOnSchedule')}>
      <div className="flex flex-col gap-2">
        <ButtonLink
          to="/studio/schedule"
          search={{ tab: 'programme' }}
          size="sm"
          variant="secondary"
          className="w-fit"
        >
          <ListMusicIcon size={14} aria-hidden className="mr-1.5" />
          {t('studioChannelView.openSchedule')}
        </ButtonLink>
        <ButtonLink
          to="/studio/stats"
          size="sm"
          variant="secondary"
          className="w-fit"
        >
          {t('studioChannelView.overallStatistics')}
        </ButtonLink>
        <ButtonLink
          to="/studio/chat"
          size="sm"
          variant="secondary"
          className="w-fit"
        >
          <MessageSquareIcon size={14} aria-hidden className="mr-1.5" />
          {t('channelChatSettings.chat')}
        </ButtonLink>
        {username ? (
          <ButtonLink
            to="/u/$username/green-room"
            params={{ username }}
            size="sm"
            variant="secondary"
            className="w-fit"
          >
            {t('studioChannelView.openGreenRoomChat')}
          </ButtonLink>
        ) : null}
        <ButtonLink
          to="/studio/go-live"
          search={{ step: 'green-room' }}
          size="sm"
          variant="secondary"
          className="w-fit"
        >
          {t('studioChannelView.sessionOnBroadcast')}
        </ButtonLink>
      </div>
    </StudioPanel>
  );
}

function RadioSection({ tab }: { tab: ChannelRadioTab }) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const channel = useAuthStore((s) => s.user?.channel);
  const tabs = radioSettingTabs(t);

  const panel = (id: ChannelRadioTab) => {
    if (id === 'stream') {
      return channel?.slug ? (
        <StreamManagerPanel slug={channel.slug} channelState={channel.state} />
      ) : (
        <StudioPanel title={t('studioChannelView.streamManager')}>
          <p className="text-foreground-secondary text-sm">
            {t('studioChannelView.createYourChannelFirstTo')}
          </p>
        </StudioPanel>
      );
    }
    if (id === 'pinned') {
      return channel?.slug ? (
        <PinnedAnnouncementsPanel slug={channel.slug} />
      ) : null;
    }
    return (
      <StudioPanel title={t('studioChannelView.multistreamDestinations')}>
        <p className="text-foreground-secondary text-sm">
          {t('studioChannelView.multistreamDestinationsDescription')}
        </p>
        <ButtonLink
          className="mt-3 w-fit"
          to="/studio/go-live"
          search={{ step: 'destinations' }}
          size="sm"
          variant="secondary"
        >
          {t('settingsBody.broadcast.manageLiveDestinations')}
        </ButtonLink>
      </StudioPanel>
    );
  };

  return (
    <ChannelSectionBlock id="radio" title={t('studioChannelViewStates.radio')}>
      <Tabs
        selectedIndex={Math.max(
          0,
          tabs.findIndex((item) => item.id === tab),
        )}
        onChange={(index) => {
          const next = tabs[index];
          if (!next) {
            return;
          }
          void navigate({
            to: '/studio/channel',
            search: next.id === 'stream' ? {} : { radio: next.id },
            hash: 'radio',
            hashScrollIntoView: false,
            resetScroll: false,
            replace: true,
          });
        }}
        listClassName="flex-wrap"
        panelClassName="pt-2"
        items={tabs.map((item) => ({
          id: item.id,
          label: item.label,
          icon: <item.icon size={14} />,
          content: panel(item.id),
        }))}
      />
      <ChannelHomeLinks />
      <StudioPanel
        title="Tahti Radio"
        description={t('studioChannelView.programmeOnScheduleDescription')}
      >
        <div className="mb-3">
          <RadioIcon size={16} className="text-foreground-secondary" />
        </div>
        <StudioRadioSubmissionPanel />
      </StudioPanel>
    </ChannelSectionBlock>
  );
}

/** Scrolls to the section named in the address hash once it has rendered. */
function useScrollToSection(hash: string) {
  useEffect(() => {
    if (!hash) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView?.({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash]);
}

function ChannelSections() {
  const { t } = useTranslation('web');
  const search = useSearch({ strict: false }) as { radio?: string };
  const hash = useLocation({ select: (location) => location.hash });
  const user = useAuthStore((s) => s.user);
  const openChannelSetup = useChannelSetupModalStore((s) => s.open);
  const channel = user?.channel;
  const radioTab = isChannelRadioTab(search.radio) ? search.radio : 'stream';
  useScrollToSection(hash);

  return (
    <ViewShell
      title={t('studioChannelViewStates.channel')}
      classes={{ root: 'px-0 pt-0', content: 'gap-8' }}
    >
      {!channel && (
        <StudioPanel title={t('studioChannelView.channelSetup')}>
          <div className="flex flex-col items-start gap-3">
            <p className="text-foreground-secondary text-sm">
              {t('studioChannelText.createToUnlock', {
                host: `${user?.username ?? 'your-name'}.tahti.live`,
              })}
            </p>
            <Button disabled={!user} onClick={openChannelSetup}>
              <PlusIcon size={16} aria-hidden className="mr-1.5" />
              {t('studioChannelText.createHost', {
                host: `${user?.username ?? 'your-name'}.tahti.live`,
              })}
            </Button>
          </div>
        </StudioPanel>
      )}
      <RadioSection tab={radioTab} />
    </ViewShell>
  );
}

/** Studio → Broadcast → Channel: 24/7 radio (Stream · Pinned · Multicast). */
export function StudioChannelView() {
  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <ChannelSections />
      </div>
    </StudioGate>
  );
}
