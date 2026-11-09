import { Navigate, useNavigate, useSearch } from '@tanstack/react-router';
import {
  DoorOpenIcon,
  ListMusicIcon,
  MessageSquareIcon,
  PinIcon,
  PlusIcon,
  RadioIcon,
  RadioTowerIcon,
  Settings2Icon,
  SparklesIcon,
  WifiIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import {
  Button,
  ButtonLink,
  TabLabel,
  Tabs,
  ViewShell,
} from '@tahti-player/ui';

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
import { useAuthStore } from '../../stores/authStore';
import { useChannelSetupModalStore } from '../../stores/channelSetupModalStore';
import { SelectsTab } from '../admin/moderation/tabs/SelectsTab';
import { BroadcastPanel } from '../settings/SettingsPanels';

type Tab = 'setup' | 'radio' | 'green-room' | 'selects';
type RadioTab =
  | 'stream'
  | 'rotation'
  | 'announcements'
  | 'pinned'
  | 'tahti-radio'
  | 'multicast';

const RADIO_STATS_RANGES: StatsPlaysRange[] = ['1', '7', '30'];

function channelSectionTabItems(t: TFunction<'web'>) {
  return [
    {
      id: 'setup' as const,
      label: t('studioChannelViewMore.setup'),
      icon: Settings2Icon,
    },
    {
      id: 'green-room' as const,
      label: t('studioChannelViewMore.greenRoom'),
      icon: DoorOpenIcon,
    },
    {
      id: 'selects' as const,
      label: t('studioChannelViewMore.selects'),
      icon: SparklesIcon,
    },
  ];
}

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
  ] as const;
}

const isTab = (value: string | undefined): value is Tab =>
  ['setup', 'radio', 'green-room', 'selects'].includes(value ?? '');

const DEEP_LINKED_RADIO_TABS = [
  'rotation',
  'announcements',
  'pinned',
  'multicast',
  'tahti-radio',
] as const;

const isDeepLinkedRadioTab = (
  value: string | undefined,
): value is (typeof DEEP_LINKED_RADIO_TABS)[number] =>
  (DEEP_LINKED_RADIO_TABS as readonly string[]).includes(value ?? '');

const DESIGNER_TABS = new Set(['design', 'profile']);

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
                  {periodStats?.totalPlays.toLocaleString() ?? '—'}
                </p>
                <p className="text-foreground-secondary text-xs">
                  plays · {periodStats?.totalDownloads.toLocaleString() ?? '—'}{' '}
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

export function StudioChannelView() {
  const { t } = useTranslation('web');
  const search = useSearch({ strict: false }) as { tab?: string };
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const openChannelSetup = useChannelSetupModalStore((s) => s.open);
  const channel = user?.channel;
  const [tab, setTab] = useState<Tab>(channel ? 'green-room' : 'setup');
  const [radioTab, setRadioTab] = useState<RadioTab>('stream');

  useEffect(() => {
    if (DESIGNER_TABS.has(search.tab ?? '')) {
      return;
    }
    if (isDeepLinkedRadioTab(search.tab)) {
      setTab('radio');
      setRadioTab(search.tab === 'announcements' ? 'rotation' : search.tab);
      return;
    }
    if (channel && (!search.tab || search.tab === 'setup')) {
      setTab('green-room');
      return;
    }
    if (isTab(search.tab) && (search.tab !== 'setup' || !channel)) {
      setTab(search.tab);
      if (search.tab === 'radio') {
        setRadioTab('stream');
      }
    } else if (!channel) {
      setTab('setup');
    }
  }, [channel, search.tab]);

  useEffect(() => {
    if (DESIGNER_TABS.has(search.tab ?? '')) {
      return;
    }
    if (!channel && !search.tab) {
      void navigate({
        to: '/studio/channel',
        search: { tab: 'setup' },
        replace: true,
      });
      return;
    }
    if (channel && (!search.tab || search.tab === 'setup')) {
      void navigate({
        to: '/studio/channel',
        search: { tab: 'green-room' },
        replace: true,
      });
    }
  }, [channel, navigate, search.tab]);

  if (search.tab === 'design') {
    return <Navigate to="/settings/$section" params={{ section: 'channel' }} />;
  }
  if (search.tab === 'profile') {
    return (
      <Navigate
        to="/settings/$section"
        params={{ section: 'artist' }}
        search={{ tab: 'branding' }}
      />
    );
  }

  const channelSectionTabs = channelSectionTabItems(t).filter(
    (item) =>
      (item.id !== 'setup' || !channel) &&
      (item.id !== 'selects' || hasAccountRole(user, 'BOARD')),
  );

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        {tab !== 'radio' ? (
          <Tabs.Root
            selectedIndex={Math.max(
              0,
              channelSectionTabs.findIndex((item) => item.id === tab),
            )}
            onChange={(index) => {
              const next = channelSectionTabs[index];
              if (!next) {
                return;
              }
              setTab(next.id);
              void navigate({
                to: '/studio/channel',
                search: { tab: next.id },
              });
            }}
          >
            <Tabs.List className="w-fit flex-wrap">
              {channelSectionTabs.map((item) => (
                <Tabs.Tab key={item.id}>
                  <TabLabel icon={<item.icon size={14} />}>
                    {item.label}
                  </TabLabel>
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.Root>
        ) : (
          <Tabs.Root
            selectedIndex={Math.max(
              0,
              radioSettingTabs(t).findIndex((item) => item.id === radioTab),
            )}
            onChange={(index) => {
              const next = radioSettingTabs(t)[index];
              if (!next) {
                return;
              }
              setRadioTab(next.id);
              void navigate({
                to: '/studio/channel',
                search: {
                  tab: isDeepLinkedRadioTab(next.id) ? next.id : 'radio',
                },
              });
            }}
          >
            <Tabs.List className="w-fit flex-wrap">
              {radioSettingTabs(t).map((item) => (
                <Tabs.Tab key={item.id}>
                  <TabLabel icon={<item.icon size={14} />}>
                    {item.label}
                  </TabLabel>
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.Root>
        )}
        <ViewShell
          title={tab === 'radio' ? 'Radio' : 'Channel'}
          classes={{ root: 'px-0 pt-0' }}
        >
          {tab === 'setup' && !channel && (
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

          {tab === 'radio' && (
            <div className="flex flex-col gap-4">
              {radioTab === 'stream' ? (
                channel?.slug ? (
                  <>
                    <StreamManagerPanel
                      slug={channel.slug}
                      channelState={channel.state}
                    />
                    <MultistreamStatusPanel slug={channel.slug} />
                    <ChannelOverallStats />
                  </>
                ) : (
                  <StudioPanel title={t('studioChannelView.streamManager')}>
                    <p className="text-foreground-secondary text-sm">
                      {t('studioChannelView.createYourChannelFirstTo')}
                    </p>
                  </StudioPanel>
                )
              ) : radioTab === 'rotation' ? (
                <>
                  {channel?.slug ? (
                    <RotationSourcePicker slug={channel.slug} />
                  ) : null}
                  <ChannelRadioPlaylistPanel />
                  <ChannelAnnouncementsPanel />
                </>
              ) : radioTab === 'pinned' ? (
                channel?.slug ? (
                  <PinnedAnnouncementsPanel slug={channel.slug} />
                ) : null
              ) : radioTab === 'tahti-radio' ? (
                <StudioRadioSubmissionPanel />
              ) : radioTab === 'multicast' ? (
                <BroadcastPanel section="multistream" />
              ) : null}
            </div>
          )}

          {tab === 'green-room' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {user?.username ? (
                  <ButtonLink
                    to="/u/$username/green-room"
                    params={{ username: user.username }}
                    size="sm"
                    variant="secondary"
                  >
                    <MessageSquareIcon
                      size={14}
                      aria-hidden
                      className="mr-1.5"
                    />
                    {t('studioChannelView.openGreenRoomChat')}
                  </ButtonLink>
                ) : null}
                <ButtonLink
                  to="/studio/go-live"
                  search={{ tab: 'green-room' }}
                  size="sm"
                  variant="secondary"
                >
                  {t('studioChannelView.sessionOnBroadcast')}
                </ButtonLink>
              </div>
              <BroadcastPanel section="green-room" />
            </div>
          )}

          {tab === 'selects' && <SelectsTab />}
        </ViewShell>
      </div>
    </StudioGate>
  );
}
