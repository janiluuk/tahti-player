import { useNavigate, useSearch } from '@tanstack/react-router';
import {
  BarChart3Icon,
  ListMusicIcon,
  MessageSquareIcon,
  PinIcon,
  PlusIcon,
  RadioTowerIcon,
  UsersIcon,
  VideoIcon,
  WifiIcon,
} from 'lucide-react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import { Button, ButtonLink, Tabs } from '@tahti-player/ui';

import { ChannelRadioPlaylistPanel } from '../../components/ChannelRadioPlaylistPanel';
import { PinnedAnnouncementsPanel } from '../../components/PinnedAnnouncementsPanel';
import { ProfileVisibilitySection } from '../../components/ProfileVisibilitySection';
import { StreamManagerPanel } from '../../components/StreamManagerPanel';
import { StudioPanel } from '../../components/StudioPanel';
import { StudioRadioSubmissionPanel } from '../../components/StudioRadioSubmissionPanel';
import {
  isChannelRadioTab,
  type ChannelRadioTab,
} from '../../lib/channelSections';
import type { StudioChannelSection } from '../../lib/studioProfileSections';
import { useAuthStore } from '../../stores/authStore';
import { useChannelSetupModalStore } from '../../stores/channelSetupModalStore';
import { BroadcastPanel } from '../settings/panels/BroadcastPanel';
import { ChannelPanel } from '../settings/panels/ChannelPanel';
import { StudioSectionPage } from './StudioSectionPage';

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
  ] satisfies { id: ChannelRadioTab; label: string; icon: unknown }[];
}

function ChannelSetupPanel() {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const openChannelSetup = useChannelSetupModalStore((s) => s.open);
  const host = `${user?.username ?? 'your-name'}.tahti.live`;
  return (
    <StudioPanel
      title={t('studioChannelView.channelSetup')}
      description={t('studioChannelText.createToUnlock', { host })}
    >
      <Button disabled={!user} onClick={openChannelSetup}>
        <PlusIcon size={16} aria-hidden className="mr-1.5" />
        {t('studioChannelText.createHost', { host })}
      </Button>
    </StudioPanel>
  );
}

function ChannelHomeLinks() {
  const { t } = useTranslation('web');
  const username = useAuthStore((s) => s.user?.username);
  return (
    <StudioPanel
      title={t('studioChannelView.programmeInChannelSettings')}
      description={t('studioChannelView.programmeInChannelSettingsDescription')}
      action={
        <ButtonLink
          to="/studio/channel/$section"
          params={{ section: 'settings' }}
          size="sm"
          variant="secondary"
        >
          <ListMusicIcon size={14} aria-hidden className="mr-1.5" />
          {t('studioChannelView.openSettings')}
        </ButtonLink>
      }
    >
      <div className="flex flex-wrap gap-1" data-testid="channel-home-links">
        <ButtonLink to="/studio/stats" size="sm" variant="text">
          <BarChart3Icon size={14} aria-hidden className="mr-1.5" />
          {t('studioChannelView.overallStatistics')}
        </ButtonLink>
        <ButtonLink to="/studio/chat" size="sm" variant="text">
          <MessageSquareIcon size={14} aria-hidden className="mr-1.5" />
          {t('channelChatSettings.chat')}
        </ButtonLink>
        {username ? (
          <ButtonLink
            to="/u/$username/green-room"
            params={{ username }}
            size="sm"
            variant="text"
          >
            <UsersIcon size={14} aria-hidden className="mr-1.5" />
            {t('studioChannelView.openGreenRoomChat')}
          </ButtonLink>
        ) : null}
        <ButtonLink
          to="/studio/go-live"
          search={{ step: 'green-room' }}
          size="sm"
          variant="text"
        >
          <VideoIcon size={14} aria-hidden className="mr-1.5" />
          {t('studioChannelView.sessionOnBroadcast')}
        </ButtonLink>
        <ButtonLink
          to="/studio/go-live"
          search={{ step: 'destinations' }}
          size="sm"
          variant="text"
        >
          <WifiIcon size={14} aria-hidden className="mr-1.5" />
          {t('studioChannelView.multistreamDestinations')}
        </ButtonLink>
      </div>
    </StudioPanel>
  );
}

function RadioSection() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { tab?: string };
  const tab = isChannelRadioTab(search.tab) ? search.tab : 'stream';
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
    return channel?.slug ? (
      <PinnedAnnouncementsPanel slug={channel.slug} />
    ) : null;
  };

  return (
    <>
      {!channel ? <ChannelSetupPanel /> : null}
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
            to: '/studio/channel/$section',
            params: { section: 'radio' },
            search: next.id === 'stream' ? {} : { tab: next.id },
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
      <StudioRadioSubmissionPanel />
    </>
  );
}

function ChannelSectionBody({ section }: { section: StudioChannelSection }) {
  const hasChannel = useAuthStore((s) => Boolean(s.user?.channel));
  if (section === 'radio') {
    return <RadioSection />;
  }
  if (section === 'visibility') {
    return (
      <>
        {hasChannel ? <ChannelPanel section="visibility" /> : null}
        <ProfileVisibilitySection />
      </>
    );
  }
  if (section === 'settings') {
    return (
      <>
        <ChannelRadioPlaylistPanel />
        <BroadcastPanel section="green-room" />
      </>
    );
  }
  return <ChannelPanel section={section} />;
}

/** Studio → Channel: design, radio, automatic programme settings,
 * visibility and address. */
export function StudioChannelView({
  section,
}: {
  section: StudioChannelSection;
}) {
  return (
    <StudioSectionPage
      section={section}
      requireChannel={
        section === 'design' || section === 'settings' || section === 'address'
      }
      data-testid={`studio-channel-section-${section}`}
    >
      <ChannelSectionBody section={section} />
    </StudioSectionPage>
  );
}
