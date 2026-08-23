import { Link } from '@tanstack/react-router';
import {
  BarChart3Icon,
  CalendarDaysIcon,
  CalendarIcon,
  ChevronDownIcon,
  Code2Icon,
  DiscAlbumIcon,
  DiscIcon,
  FolderLockIcon,
  Globe2Icon,
  LayoutGridIcon,
  LayoutTemplateIcon,
  LibraryBigIcon,
  MicIcon,
  NewspaperIcon,
  PlugIcon,
  RadioIcon,
  ScissorsIcon,
  ShieldCheckIcon,
  UploadCloudIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState, type FC, type ReactNode } from 'react';

import { CardGrid } from '@nuclearplayer/ui';

import { fetchStudioArchive, fetchStudioCollections } from '../../api/studio';
import { fetchStatsSummary, type StatsSummary } from '../../api/studio-extras';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { Eyebrow } from '../../components/tahti/Eyebrow';
import { timeOfDayGreeting } from '../../lib/greeting';
import { useAuthStore } from '../../stores/authStore';

type Counts = { archive: number; collections: number };

const EMPTY_STATS: StatsSummary = {
  playsToday: 0,
  playsTotal: 0,
  downloadsToday: 0,
  downloadsTotal: 0,
  followerCount: 0,
};

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2>
        <Eyebrow>{title}</Eyebrow>
      </h2>
      {children}
    </section>
  );
}

/** Colour-coded, icon-first nav tile — the label sits in a translucent
 * strip over the icon (opacity layer) so it stays legible regardless of
 * the tile's background colour, instead of plain text below an artwork
 * square like the music Card component. */
function StudioActionTile({
  to,
  icon: Icon,
  label,
  subtitle,
  color,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  subtitle?: string;
  color: string;
}) {
  return (
    <Link
      to={to}
      className="group border-border relative flex aspect-[4/3] flex-col overflow-hidden rounded-xl border shadow-sm transition-transform hover:-translate-y-0.5"
      style={{ background: color }}
    >
      <div className="relative z-10 bg-black/45 px-3 py-2 backdrop-blur-sm">
        <div className="truncate text-sm font-bold text-white">{label}</div>
        {subtitle ? (
          <div className="truncate text-[11px] text-white/75">{subtitle}</div>
        ) : null}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon
          size={40}
          absoluteStrokeWidth
          strokeWidth={1.5}
          className="text-white/90 transition-transform group-hover:scale-110"
          aria-hidden
        />
      </div>
    </Link>
  );
}

type CompactBroadcastTileProps = {
  to: '/studio/go-live' | '/studio/schedule';
  icon: LucideIcon;
  label: string;
  subtitle: string;
  color: string;
};

const CompactBroadcastTile: FC<CompactBroadcastTileProps> = ({
  to,
  icon: Icon,
  label,
  subtitle,
  color,
}) => (
  <Link
    to={to}
    data-testid="compact-broadcast-card"
    className="border-border bg-background-secondary/40 hover:bg-background-secondary group flex min-h-20 items-center gap-3 rounded-xl border px-4 py-3 shadow-sm transition-transform hover:-translate-y-0.5"
  >
    <span
      className="flex size-11 shrink-0 items-center justify-center rounded-lg text-white"
      style={{ background: color }}
    >
      <Icon size={22} aria-hidden />
    </span>
    <span className="min-w-0">
      <span className="block text-sm font-bold">{label}</span>
      <span className="text-foreground-secondary block truncate text-xs">
        {subtitle}
      </span>
    </span>
  </Link>
);

type SummaryStatProps = {
  label: string;
  value: number;
  note: string;
  icon: LucideIcon;
};

const SummaryStat: FC<SummaryStatProps> = ({
  label,
  value,
  note,
  icon: Icon,
}) => (
  <Link
    to="/studio/stats"
    aria-label={`${value.toLocaleString()} ${label.toLowerCase()}`}
    className="border-border bg-background-secondary/35 hover:bg-background-secondary group flex min-w-0 flex-col gap-2 rounded-xl border p-4 shadow-sm transition-transform hover:-translate-y-0.5"
  >
    <span className="text-foreground-secondary flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
      <Icon size={15} aria-hidden className="text-primary" />
      {label}
    </span>
    <span className="font-display text-2xl font-extrabold tabular-nums">
      {value.toLocaleString()}
    </span>
    <span className="text-foreground-secondary text-xs">{note}</span>
  </Link>
);

export function StudioHomeView() {
  const user = useAuthStore((s) => s.user);
  const [counts, setCounts] = useState<Counts>({
    archive: 0,
    collections: 0,
  });
  const [stats, setStats] = useState<StatsSummary>(EMPTY_STATS);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (!user?.channel) {
      return;
    }
    void Promise.all([
      fetchStudioArchive(),
      fetchStudioCollections(),
      fetchStatsSummary(),
    ]).then(([archive, collections, summary]) => {
      setCounts({
        archive: archive.data.length,
        collections: collections.data.length,
      });
      setStats(summary.data);
    });
  }, [user?.channel]);

  const channel = user?.channel;

  return (
    <StudioGate requireChannel={false}>
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <StudioNav current="/studio" />

        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">
              {user
                ? `${timeOfDayGreeting(new Date().getHours())}, ${user.displayName || user.username}`
                : 'Studio'}
            </h1>
            {user ? (
              <p className="text-foreground-secondary mt-1 text-xs font-semibold tracking-wide uppercase">
                Studio
              </p>
            ) : null}
            {channel ? (
              <p className="text-foreground-secondary mt-1 text-sm">
                <span className="text-foreground font-medium">
                  {user.displayName || channel.slug}
                </span>
                <span className="opacity-60"> /{channel.slug}</span>
                <span className="ml-2 text-xs tracking-wide uppercase opacity-70">
                  {channel.state}
                </span>
              </p>
            ) : (
              <p className="text-foreground-secondary mt-1 text-sm">
                <Link
                  to="/studio/channel"
                  search={{ tab: 'setup' }}
                  className="text-foreground underline-offset-2 hover:underline"
                >
                  Create your channel
                </Link>{' '}
                to unlock Music and Go Live.
              </p>
            )}
          </div>
        </header>

        {!channel ? null : (
          <>
            <section
              aria-label="Channel summary"
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              <SummaryStat
                label="Plays today"
                value={stats.playsToday}
                note="Open detailed stats"
                icon={RadioIcon}
              />
              <SummaryStat
                label="Total plays"
                value={stats.playsTotal}
                note="All-time audience"
                icon={BarChart3Icon}
              />
              <SummaryStat
                label="Total downloads"
                value={stats.downloadsTotal}
                note={`${stats.downloadsToday.toLocaleString()} today`}
                icon={UploadCloudIcon}
              />
              <SummaryStat
                label="Followers"
                value={stats.followerCount}
                note="Audience overview"
                icon={UsersIcon}
              />
            </section>

            <Group title="Broadcast">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CompactBroadcastTile
                  to="/studio/go-live"
                  icon={RadioIcon}
                  label="Go Live"
                  subtitle="Keys, signal, on-air"
                  color="var(--accent-red)"
                />
                <CompactBroadcastTile
                  to="/studio/schedule"
                  icon={CalendarIcon}
                  label="Schedule"
                  subtitle="Next show & programme"
                  color="var(--accent-blue)"
                />
              </div>
            </Group>

            <Group title="Music">
              <CardGrid>
                <StudioActionTile
                  to="/studio/shows"
                  icon={MicIcon}
                  label="Shows"
                  subtitle="Episodes & slots"
                  color="var(--accent-purple)"
                />
                <StudioActionTile
                  to="/studio/archive"
                  icon={LibraryBigIcon}
                  label="Music"
                  subtitle={
                    counts.archive
                      ? `${counts.archive} items`
                      : 'Archive & files'
                  }
                  color="var(--accent-orange)"
                />
                <StudioActionTile
                  to="/studio/upload"
                  icon={UploadCloudIcon}
                  label="Upload"
                  subtitle="Add audio"
                  color="var(--accent-green)"
                />
                <StudioActionTile
                  to="/studio/collections"
                  icon={DiscAlbumIcon}
                  label="Collections"
                  subtitle={
                    counts.collections
                      ? `${counts.collections} collections`
                      : 'Albums, EPs, DJ sets & playlists'
                  }
                  color="var(--accent-yellow)"
                />
                <StudioActionTile
                  to="/studio/embeds"
                  icon={Code2Icon}
                  label="Embeds"
                  subtitle="Pinned release players"
                  color="var(--accent-cyan)"
                />
              </CardGrid>
            </Group>

            <Group title="Audience & channel">
              <CardGrid>
                <StudioActionTile
                  to="/studio/updates"
                  icon={NewspaperIcon}
                  label="Updates"
                  subtitle="Posts & newsletter"
                  color="var(--accent-blue)"
                />
                <StudioActionTile
                  to="/studio/stats"
                  icon={BarChart3Icon}
                  label="Stats"
                  subtitle="Plays & downloads"
                  color="var(--accent-cyan)"
                />
                <StudioActionTile
                  to="/studio/revenue"
                  icon={WalletIcon}
                  label="Revenue"
                  subtitle="Connect & grants"
                  color="var(--accent-green)"
                />
                <StudioActionTile
                  to="/studio/channel"
                  icon={LayoutTemplateIcon}
                  label="Channel look"
                  subtitle="Design & domain"
                  color="var(--accent-purple)"
                />
              </CardGrid>
            </Group>

            <div>
              <button
                type="button"
                className="border-border bg-background-secondary/40 hover:bg-background-secondary flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase transition-colors"
                onClick={() => setShowMore((v) => !v)}
                aria-expanded={showMore}
              >
                <LayoutGridIcon
                  size={15}
                  aria-hidden
                  className="text-primary"
                />
                <span className="flex-1">More studio tools</span>
                <ChevronDownIcon
                  size={15}
                  aria-hidden
                  className={`transition-transform ${showMore ? 'rotate-180' : ''}`}
                />
              </button>
              {showMore && (
                <div className="mt-3">
                  <CardGrid>
                    <StudioActionTile
                      to="/studio/editor"
                      icon={ScissorsIcon}
                      label="Editor"
                      subtitle="Trim & process"
                      color="var(--accent-orange)"
                    />
                    <StudioActionTile
                      to="/studio/stash"
                      icon={FolderLockIcon}
                      label="Stash"
                      subtitle="Private files"
                      color="var(--accent-yellow)"
                    />
                    <StudioActionTile
                      to="/sources"
                      icon={PlugIcon}
                      label="Sources"
                      subtitle="Import services"
                      color="var(--accent-red)"
                    />
                    <StudioActionTile
                      to="/studio/recordings"
                      icon={DiscIcon}
                      label="Recordings"
                      subtitle="Past broadcasts"
                      color="var(--accent-blue)"
                    />
                    <StudioActionTile
                      to="/studio/distribution"
                      icon={Globe2Icon}
                      label="Distribution"
                      subtitle="DSP delivery"
                      color="var(--accent-green)"
                    />
                    <StudioActionTile
                      to="/studio/moderation"
                      icon={ShieldCheckIcon}
                      label="Moderation"
                      subtitle="Channel access"
                      color="var(--accent-red)"
                    />
                    <StudioActionTile
                      to="/studio/events"
                      icon={CalendarDaysIcon}
                      label="Events"
                      subtitle="Live dates"
                      color="var(--accent-purple)"
                    />
                  </CardGrid>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </StudioGate>
  );
}
