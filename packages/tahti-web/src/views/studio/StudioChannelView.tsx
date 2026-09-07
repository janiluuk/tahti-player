import { Navigate, useNavigate, useSearch } from '@tanstack/react-router';
import {
  DoorOpenIcon,
  ListMusicIcon,
  MegaphoneIcon,
  PinIcon,
  PlusIcon,
  RadioIcon,
  RadioTowerIcon,
  Settings2Icon,
  SparklesIcon,
  WifiIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, TabLabel, Tabs, ViewShell } from '@tahti-player/ui';

import {
  fetchStatsPlays,
  type StatsPlays,
  type StatsPlaysRange,
} from '../../api/studio-extras';
import { ChannelAnnouncementsPanel } from '../../components/ChannelAnnouncementsPanel';
import { ChannelRadioPlaylistPanel } from '../../components/ChannelRadioPlaylistPanel';
import { PageLoading } from '../../components/PageStates';
import { PinnedAnnouncementsPanel } from '../../components/PinnedAnnouncementsPanel';
import { StreamManagerPanel } from '../../components/StreamManagerPanel';
import { StudioGate } from '../../components/StudioGate';
import { BroadcastSubNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { StudioRadioSubmissionPanel } from '../../components/StudioRadioSubmissionPanel';
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

const CHANNEL_SECTION_TABS = [
  { id: 'setup' as const, label: 'Setup', icon: Settings2Icon },
  { id: 'green-room' as const, label: 'Green room', icon: DoorOpenIcon },
  { id: 'selects' as const, label: 'Selects', icon: SparklesIcon },
];

const RADIO_SETTING_TABS = [
  { id: 'stream' as const, label: 'Stream', icon: RadioTowerIcon },
  { id: 'rotation' as const, label: '24/7', icon: ListMusicIcon },
  { id: 'announcements' as const, label: 'Announcements', icon: MegaphoneIcon },
  { id: 'pinned' as const, label: 'Pinned', icon: PinIcon },
  { id: 'tahti-radio' as const, label: 'Tahti Radio', icon: RadioIcon },
  { id: 'multicast' as const, label: 'Multicast', icon: WifiIcon },
] as const;

const isTab = (value: string | undefined): value is Tab =>
  ['setup', 'radio', 'green-room', 'selects'].includes(value ?? '');

const DESIGNER_TABS = new Set(['design', 'profile']);

function ChannelOverallStats() {
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
    <StudioPanel title="Overall statistics">
      {RADIO_STATS_RANGES.every((range) => !stats[range]) ? (
        <PageLoading label="Loading statistics…" />
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
  const search = useSearch({ strict: false }) as { tab?: string };
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const openChannelSetup = useChannelSetupModalStore((s) => s.open);
  const channel = user?.channel;
  const [tab, setTab] = useState<Tab>(channel ? 'green-room' : 'setup');
  const [radioTab, setRadioTab] = useState<RadioTab>('stream');

  useEffect(() => {
    if (search.tab === 'multicast') {
      setTab('radio');
      setRadioTab('multicast');
      return;
    }
    if (isTab(search.tab) && (search.tab !== 'setup' || !channel)) {
      setTab(search.tab);
      if (search.tab === 'radio') {
        setRadioTab('stream');
      }
    } else if (!channel) {
      setTab('setup');
    } else {
      setTab('green-room');
    }
  }, [channel, search.tab]);

  if (DESIGNER_TABS.has(search.tab ?? '')) {
    return (
      <Navigate to="/studio/branding" search={{ tab: 'channel-designer' }} />
    );
  }

  const channelSectionTabs = CHANNEL_SECTION_TABS.filter(
    (item) => item.id !== 'setup' || !channel,
  );

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <BroadcastSubNav
          current={
            search.tab ? `/studio/channel?tab=${search.tab}` : '/studio/channel'
          }
        />
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
              RADIO_SETTING_TABS.findIndex((item) => item.id === radioTab),
            )}
            onChange={(index) => {
              const next = RADIO_SETTING_TABS[index];
              if (!next) {
                return;
              }
              setRadioTab(next.id);
              if (next.id === 'multicast' || search.tab === 'multicast') {
                void navigate({
                  to: '/studio/channel',
                  search: {
                    tab: next.id === 'multicast' ? 'multicast' : 'radio',
                  },
                });
              }
            }}
          >
            <Tabs.List className="w-fit flex-wrap">
              {RADIO_SETTING_TABS.map((item) => (
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
            <StudioPanel title="Channel setup">
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
                    <ChannelOverallStats />
                  </>
                ) : (
                  <StudioPanel title="Stream manager">
                    <p className="text-foreground-secondary text-sm">
                      Create your channel first to manage its stream.
                    </p>
                  </StudioPanel>
                )
              ) : radioTab === 'rotation' ? (
                <ChannelRadioPlaylistPanel />
              ) : radioTab === 'announcements' ? (
                <ChannelAnnouncementsPanel />
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

          {tab === 'green-room' && <BroadcastPanel section="green-room" />}

          {tab === 'selects' && <SelectsTab />}
        </ViewShell>
      </div>
    </StudioGate>
  );
}
