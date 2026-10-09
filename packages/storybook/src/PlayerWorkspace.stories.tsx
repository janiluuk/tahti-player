import type { Meta } from '@storybook/react-vite';
import {
  Clock,
  Disc3,
  Download,
  Heart,
  Home,
  Library,
  Mic2,
  Play,
  Radio,
  Repeat,
  Search,
  Settings,
  Shuffle,
  SkipBack,
  SkipForward,
  Star,
  Volume2,
} from 'lucide-react';
import { useState } from 'react';

import type { QueueItem, Track } from '@tahti-player/model';
import {
  BottomBar,
  Button,
  PlayerWorkspace,
  QueuePanel,
  SidebarNavigation,
  SidebarNavigationItem,
  TahtiLogo,
  TopBar,
  TrackTable,
  type TrackTableLabels,
} from '@tahti-player/ui';

const meta = {
  title: 'Layout/PlayerWorkspace',
  component: PlayerWorkspace,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PlayerWorkspace>;

export default meta;

const LIBRARY: [
  title: string,
  artist: string,
  album: string,
  seconds: number,
][] = [
  ['Bohemian Rhapsody', 'Queen', 'A Night at the Opera', 355],
  ['Stairway to Heaven', 'Led Zeppelin', 'Led Zeppelin IV', 482],
  ['Hotel California', 'Eagles', 'Hotel California', 390],
  ["Sweet Child O' Mine", "Guns N' Roses", 'Appetite for Destruction', 303],
  ['Imagine', 'John Lennon', 'Imagine', 187],
  ['Billie Jean', 'Michael Jackson', 'Thriller', 294],
  ['Like a Rolling Stone', 'Bob Dylan', 'Highway 61 Revisited', 373],
  ['Smells Like Teen Spirit', 'Nirvana', 'Nevermind', 301],
];

const LIBRARY_TRACKS: Track[] = LIBRARY.map(
  ([title, artist, album, seconds], index) => {
    const source = { provider: 'local', id: `workspace-${index + 1}` };
    return {
      title,
      artists: [{ name: artist, roles: ['primary'] }],
      album: { title: album, artists: [{ name: artist, source }], source },
      durationMs: seconds * 1000,
      source,
    };
  },
);

const TRACK_TABLE_LABELS: TrackTableLabels = {
  headers: {
    artist: 'Artist',
    title: 'Title',
    album: 'Album',
    duration: 'Duration',
  },
  favorite: 'Add to favorites',
  unfavorite: 'Remove from favorites',
  play: 'Play',
  pause: 'Pause',
  playAll: 'Play all',
  addAllToQueue: 'Add all to queue',
  addToQueue: 'Add to queue',
  inQueue: 'In queue',
  trackOptions: 'Track options',
  remove: 'Remove from list',
  filterPlaceholder: 'Filter tracks',
};

const LibraryTrackList = () => (
  <div className="flex h-full flex-col gap-4 p-6">
    <h1 className="text-foreground text-2xl font-bold">Your Library</h1>
    <TrackTable
      tracks={LIBRARY_TRACKS}
      labels={TRACK_TABLE_LABELS}
      display={{
        displayPosition: true,
        displayArtist: true,
        displayAlbum: true,
        displayDuration: true,
      }}
      actions={{}}
    />
  </div>
);

const QUEUE_ITEMS: QueueItem[] = LIBRARY_TRACKS.slice(0, 4).map((track) => ({
  id: track.source.id,
  track,
  status: 'idle',
  addedAtIso: '2026-10-01T12:00:00.000Z',
}));

const QueueSidebar = ({ isCollapsed }: { isCollapsed?: boolean }) => (
  <QueuePanel
    items={QUEUE_ITEMS}
    currentItemId={QUEUE_ITEMS[0]?.id}
    isCollapsed={isCollapsed}
    labels={{
      removeButton: 'Remove from queue',
      playbackError: 'Playback error',
      emptyTitle: 'Queue empty',
    }}
  />
);

export const BasicLayout = () => {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(320);

  return (
    <div className="flex h-screen flex-col">
      <TopBar>
        <div className="ml-4 flex items-center gap-4">
          <TahtiLogo className="text-sm" />
        </div>
      </TopBar>

      <PlayerWorkspace className="flex-1">
        <PlayerWorkspace.LeftSidebar
          isCollapsed={leftCollapsed}
          width={leftWidth}
          onWidthChange={setLeftWidth}
          onToggle={() => setLeftCollapsed(!leftCollapsed)}
        >
          <SidebarNavigation isCompact={leftCollapsed}>
            <SidebarNavigationItem
              icon={<Home size={16} />}
              label="Home"
              isSelected
            />
            <SidebarNavigationItem icon={<Search size={16} />} label="Search" />
            <SidebarNavigationItem
              icon={<Library size={16} />}
              label="Your Library"
            />
          </SidebarNavigation>
        </PlayerWorkspace.LeftSidebar>

        <PlayerWorkspace.Main>
          <LibraryTrackList />
        </PlayerWorkspace.Main>

        <PlayerWorkspace.RightSidebar
          isCollapsed={rightCollapsed}
          width={rightWidth}
          onWidthChange={setRightWidth}
          onToggle={() => setRightCollapsed(!rightCollapsed)}
        >
          <QueueSidebar isCollapsed={rightCollapsed} />
        </PlayerWorkspace.RightSidebar>
      </PlayerWorkspace>

      <BottomBar>
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="text">
                <Shuffle size={16} />
              </Button>
              <Button size="icon" variant="text">
                <SkipBack size={16} />
              </Button>
              <Button size="icon">
                <Play size={16} />
              </Button>
              <Button size="icon" variant="text">
                <SkipForward size={16} />
              </Button>
              <Button size="icon" variant="text">
                <Repeat size={16} />
              </Button>
            </div>
          </div>

          <div className="mx-8 flex-1">
            <div className="text-center">
              <div className="text-foreground text-sm font-medium">
                Bohemian Rhapsody
              </div>
              <div className="text-foreground-secondary text-xs">Queen</div>
            </div>
            <div className="bg-background-secondary mt-2 h-1 rounded-full">
              <div className="bg-primary h-1 w-1/3 rounded-full"></div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="icon" variant="text">
              <Volume2 size={16} />
            </Button>
            <div className="bg-background-secondary h-1 w-20 rounded-full">
              <div className="bg-primary h-1 w-3/4 rounded-full"></div>
            </div>
          </div>
        </div>
      </BottomBar>
    </div>
  );
};

export const FullNavigationLayout = () => {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(true);
  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(280);

  return (
    <div className="flex h-screen flex-col">
      <TopBar>
        <div className="ml-4 flex items-center gap-4">
          <TahtiLogo className="text-sm" />
          <div className="ml-8 flex gap-2">
            <Button size="sm" variant="text">
              File
            </Button>
            <Button size="sm" variant="text">
              Edit
            </Button>
            <Button size="sm" variant="text">
              View
            </Button>
            <Button size="sm" variant="text">
              Help
            </Button>
          </div>
        </div>
      </TopBar>

      <PlayerWorkspace className="flex-1">
        <PlayerWorkspace.LeftSidebar
          isCollapsed={leftCollapsed}
          width={leftWidth}
          onWidthChange={setLeftWidth}
          onToggle={() => setLeftCollapsed(!leftCollapsed)}
        >
          <SidebarNavigation isCompact={leftCollapsed}>
            <SidebarNavigationItem
              icon={<Home size={16} />}
              label="Home"
              isSelected
            />
            <SidebarNavigationItem icon={<Search size={16} />} label="Search" />
            <SidebarNavigationItem
              icon={<Library size={16} />}
              label="Your Library"
            />
            <SidebarNavigationItem
              icon={<Heart size={16} />}
              label="Liked Songs"
            />
            <SidebarNavigationItem
              icon={<Clock size={16} />}
              label="Recently Played"
              isSelected
            />
            <SidebarNavigationItem
              icon={<Download size={16} />}
              label="Downloaded"
            />
            <SidebarNavigationItem
              icon={<Star size={16} />}
              label="Favorites"
            />
            <SidebarNavigationItem icon={<Disc3 size={16} />} label="Albums" />
            <SidebarNavigationItem icon={<Mic2 size={16} />} label="Artists" />
            <SidebarNavigationItem icon={<Radio size={16} />} label="Radio" />
            <SidebarNavigationItem
              icon={<Settings size={16} />}
              label="Settings"
            />
          </SidebarNavigation>
        </PlayerWorkspace.LeftSidebar>

        <PlayerWorkspace.Main>
          <LibraryTrackList />
        </PlayerWorkspace.Main>

        <PlayerWorkspace.RightSidebar
          isCollapsed={rightCollapsed}
          width={rightWidth}
          onWidthChange={setRightWidth}
          onToggle={() => setRightCollapsed(!rightCollapsed)}
        >
          <QueueSidebar isCollapsed={rightCollapsed} />
        </PlayerWorkspace.RightSidebar>
      </PlayerWorkspace>

      <BottomBar>
        <div className="flex w-full items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-foreground">♪ 1,247 tracks</span>
            <span className="text-foreground-secondary">•</span>
            <span className="text-foreground-secondary">3.2 GB</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-foreground-secondary">Ready</span>
          </div>
        </div>
      </BottomBar>
    </div>
  );
};
