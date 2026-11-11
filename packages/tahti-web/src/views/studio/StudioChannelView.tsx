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
import { useEffect, useState, type ReactNode } from 'react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import { Button, ButtonLink, Tabs, ViewShell } from '@tahti-player/ui';

import {
  fetchStatsPlays,
  type StatsPlays,
  type StatsPlaysRange,
} from '../../api/studio-extras';
import { ChannelAnnouncementsPanel } from '../../components/ChannelAnnouncementsPanel';
import { ChannelRadioPlaylistPanel } from '../../components/ChannelRadioPlaylistPanel';
import { MultistreamStatusPanel } from '../../components/MultistreamStatusPanel';
import { PageLoading } from '../../components/PageStates';
import { PinnedAnnouncementsPanel } from '../../components/PinnedAnnouncementsPanel';
import { RotationSourcePicker } from '../../components/RotationSourcePicker';
import { StreamManagerPanel } from '../../components/StreamManagerPanel';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { StudioRadioSubmissionPanel } from '../../components/StudioRadioSubmissionPanel';
import { hasAccountRole } from '../../lib/accountRoles';
import {
  isChannelRadioTab,
  type ChannelRadioTab,
  type ChannelSection,
} from '../../lib/channelSections';
import { dateLocaleTag } from '../../lib/locale';
import { useAuthStore } from '../../stores/authStore';
import { useChannelSetupModalStore } from '../../stores/channelSetupModalStore';
import { SelectsTab } from '../admin/moderation/tabs/SelectsTab';
import { BroadcastPanel } from '../settings/SettingsPanels';

function radioSettingTabs(t: TFunction<'web'>) {
  return [
    {
      id: 'stream' as const,
      label: t('studioChannelViewMore.stream'),
      icon: RadioTowerIcon,
    },
    { id: 'rotation' as const, label: '24/7', icon: ListMusicIcon },
    {
      id: 'pinned' as const,
      label: t('studioChannelViewMore.pinned'),
      icon: PinIcon,
    },
    { id: 'tahti-radio' as const, label: 'Tahti Radio', icon: RadioIcon },
    {
      id: 'multicast' as const,
      label: t('studioChannelViewMore.multicast'),
      icon: WifiIcon,
    },
  ] satisfies { id: ChannelRadioTab; label: string; icon: unknown }[];
}

const RADIO_STATS_RANGES: StatsPlaysRange[] = ['1', '7', '30'];

function ChannelOverallStats() {
  const { t } = useTranslation('web');
  const [stats, setStats] = useState<
    Partial<Record<StatsPlaysRange, StatsPlays>>
  >({});

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      RADIO_STATS_RANGES.map((range) => fetchStatsPlays(range)),
    ).then((results) => {
      if (cancelled) {
        return;
      }
      const next: Partial<Record<StatsPlaysRange, StatsPlays>> = {};
      results.forEach((result, index) => {
        const range = RADIO_STATS_RANGES[index];
        if (range) {
          next[range] = result.data;
        }
      });
      setStats(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <StudioPanel title={t('studioChannelView.overallStatistics')}>
      {RADIO_STATS_RANGES.every((range) => !stats[range]) ? (
        <PageLoading label={t('loading.loadingStatistics')} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {RADIO_STATS_RANGES.map((range) => {
            const periodStats = stats[range];
            return (
              <div
                key={range}
                className="border-border bg-background-secondary/40 rounded-lg border p-3"
              >
                <p className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
                  Last {range} day{range === '1' ? '' : 's'}
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums">
                  {periodStats?.totalPlays.toLocaleString(dateLocaleTag()) ??
                    '—'}
                </p>
                <p className="text-foreground-secondary text-xs">
                  plays ·{' '}
                  {periodStats?.totalDownloads.toLocaleString(
                    dateLocaleTag(),
                  ) ?? '—'}{' '}
                  downloads
                </p>
              </div>
            );
          })}
        </div>
      )}
    </StudioPanel>
  );
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

function RadioSection({ tab }: { tab: ChannelRadioTab }) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const channel = useAuthStore((s) => s.user?.channel);
  const tabs = radioSettingTabs(t);

  const panel = (id: ChannelRadioTab) => {
    if (id === 'stream') {
      return channel?.slug ? (
        <div className="flex flex-col gap-4">
          <StreamManagerPanel
            slug={channel.slug}
            channelState={channel.state}
          />
          <MultistreamStatusPanel slug={channel.slug} />
          <ChannelOverallStats />
        </div>
      ) : (
        <StudioPanel title={t('studioChannelView.streamManager')}>
          <p className="text-foreground-secondary text-sm">
            {t('studioChannelView.createYourChannelFirstTo')}
          </p>
        </StudioPanel>
      );
    }
    if (id === 'rotation') {
      return (
        <div className="flex flex-col gap-4">
          {channel?.slug ? <RotationSourcePicker slug={channel.slug} /> : null}
          <ChannelRadioPlaylistPanel />
          <ChannelAnnouncementsPanel />
        </div>
      );
    }
    if (id === 'pinned') {
      return channel?.slug ? (
        <PinnedAnnouncementsPanel slug={channel.slug} />
      ) : null;
    }
    if (id === 'tahti-radio') {
      return <StudioRadioSubmissionPanel />;
    }
    return <BroadcastPanel section="multistream" />;
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
    </ChannelSectionBlock>
  );
}

function GreenRoomSection() {
  const { t } = useTranslation('web');
  const username = useAuthStore((s) => s.user?.username);
  return (
    <ChannelSectionBlock
      id="green-room"
      title={t('studioChannelViewMore.greenRoom')}
    >
      <div className="flex flex-wrap items-center gap-2">
        {username ? (
          <ButtonLink
            to="/u/$username/green-room"
            params={{ username }}
            size="sm"
            variant="secondary"
          >
            <MessageSquareIcon size={14} aria-hidden className="mr-1.5" />
            {t('studioChannelView.openGreenRoomChat')}
          </ButtonLink>
        ) : null}
        <ButtonLink
          to="/studio/go-live"
          search={{ step: 'green-room' }}
          size="sm"
          variant="secondary"
        >
          {t('studioChannelView.sessionOnBroadcast')}
        </ButtonLink>
      </div>
      <BroadcastPanel section="green-room" />
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
              Create {user?.username ?? 'your-name'}.tahti.live to unlock
              broadcasting, uploads, and your public channel.
            </p>
            <Button disabled={!user} onClick={openChannelSetup}>
              <PlusIcon size={16} aria-hidden className="mr-1.5" />
              Create {user?.username ?? 'your-name'}.tahti.live
            </Button>
          </div>
        </StudioPanel>
      )}
      <RadioSection tab={radioTab} />
      <GreenRoomSection />
      {hasAccountRole(user, 'BOARD') ? (
        <ChannelSectionBlock
          id="selects"
          title={t('studioChannelViewMore.selects')}
        >
          <SelectsTab />
        </ChannelSectionBlock>
      ) : null}
    </ViewShell>
  );
}

/** Studio → Broadcast → Channel: the Radio, Green room and (board) Selects
 * sections on one page. */
export function StudioChannelView() {
  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <ChannelSections />
      </div>
    </StudioGate>
  );
}
