import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FC, useState } from 'react';
import { vi } from 'vitest';

import type { Track } from '@tahti-player/model';

import { TrackTable, TrackTableLabels } from '.';

const labels: TrackTableLabels = {
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

const labelsWithReleaseDate: TrackTableLabels = {
  ...labels,
  headers: { ...labels.headers, releaseDate: 'Released' },
};

const TEST_ROW_HEIGHT = 42;
const TEST_MAX_VISIBLE = 20;
const TEST_CONTAINER_HEIGHT = 400;

vi.mock('@tanstack/react-virtual', () => {
  return {
    useVirtualizer: (opts: { count: number }) => {
      const count = Math.max(0, Number(opts?.count ?? 0));
      const len = Math.min(count, TEST_MAX_VISIBLE);
      return {
        getVirtualItems: () =>
          Array.from({ length: len }).map((_, i) => ({
            index: i,
            start: i * TEST_ROW_HEIGHT,
            end: (i + 1) * TEST_ROW_HEIGHT,
            key: i,
            size: TEST_ROW_HEIGHT,
          })),
        getTotalSize: () => count * TEST_ROW_HEIGHT,
      } as const;
    },
  } as const;
});

function makeTracks(count: number): Track[] {
  return Array.from({ length: count }).map((_, i) => ({
    trackNumber: i + 1,
    artwork: { items: [{ url: 'https://i.imgur.com/4euOws2.jpg' }] },
    title: `Track ${i + 1}`,
    artists: [{ name: 'Frank Zappa', roles: [] }],
    album: {
      title: 'Album',
      artists: [
        { name: 'Frank Zappa', source: { provider: 'local', id: 'a' } },
      ],
      source: { provider: 'local', id: 'a' },
    },
    source: { provider: 'local', id: `t-${i + 1}` },
    durationMs: ((i % 300) + 30) * 1000,
  }));
}

describe('TrackTable', () => {
  it('(Snapshot) Basic', async () => {
    const { asFragment, findByText } = render(
      <TrackTable
        tracks={makeTracks(3)}
        labels={labels}
        display={{
          displayPosition: true,
          displayThumbnail: true,
          displayArtist: true,
          displayAlbum: true,
          displayDuration: true,
        }}
      />,
    );
    await findByText('Track 1');
    expect(asFragment()).toMatchSnapshot();
  });

  it('(Snapshot) DragAndDrop', async () => {
    const { asFragment, findByText } = render(
      <TrackTable
        tracks={makeTracks(5)}
        labels={labels}
        features={{ reorderable: true }}
        display={{
          displayPosition: true,
          displayThumbnail: true,
          displayArtist: true,
          displayAlbum: true,
          displayDuration: true,
        }}
      />,
    );
    await findByText('Track 1');
    expect(asFragment()).toMatchSnapshot();
  });

  it('(Snapshot) Filtering', async () => {
    const { asFragment, findByPlaceholderText } = render(
      <TrackTable
        tracks={makeTracks(5)}
        labels={labels}
        features={{ filterable: true }}
        display={{
          displayPosition: true,
          displayThumbnail: true,
          displayArtist: true,
          displayAlbum: true,
          displayDuration: true,
        }}
      />,
    );
    await findByPlaceholderText('Filter tracks');
    expect(asFragment()).toMatchSnapshot();
  });

  it('(Snapshot) LargeDataset', async () => {
    const { asFragment, findByText } = render(
      <div style={{ height: TEST_CONTAINER_HEIGHT }}>
        <TrackTable
          tracks={makeTracks(500)}
          labels={labels}
          display={{
            displayPosition: true,
            displayThumbnail: true,
            displayArtist: true,
            displayAlbum: true,
            displayDuration: true,
          }}
        />
      </div>,
    );
    await findByText('Track 1');
    expect(asFragment()).toMatchSnapshot();
  });

  it('(Snapshot) Toolbar', async () => {
    const { asFragment, findByTestId } = render(
      <TrackTable
        tracks={makeTracks(3)}
        labels={labels}
        features={{ playAll: true, addAllToQueue: true, filterable: true }}
        display={{
          displayPosition: true,
          displayThumbnail: true,
          displayArtist: true,
          displayAlbum: true,
          displayDuration: true,
        }}
        actions={{ onPlayAll: vi.fn(), onAddAllToQueue: vi.fn() }}
      />,
    );
    await findByTestId('add-all-to-queue-button');
    expect(asFragment()).toMatchSnapshot();
  });

  it('shows queued feedback and disables repeated queue clicks', async () => {
    const track = makeTracks(1)[0]!;
    const QueueHarness: FC = () => {
      const [queued, setQueued] = useState(false);
      return (
        <TrackTable
          tracks={[track]}
          labels={labels}
          display={{ displayQueueControls: true, displayThumbnail: false }}
          actions={{ onAddToQueue: () => setQueued(true) }}
          meta={{ isTrackQueued: () => queued }}
        />
      );
    };

    render(<QueueHarness />);
    await userEvent.click(screen.getByTestId('add-to-queue-button'));

    const queuedButton = screen.getByTestId('add-to-queue-button');
    expect(queuedButton).toBeDisabled();
    expect(queuedButton).toHaveAttribute('aria-label', 'In queue');
    expect(queuedButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('updates the active row and play button from playback state', async () => {
    const track = makeTracks(1)[0]!;
    const PlaybackHarness: FC = () => {
      const [currentId, setCurrentId] = useState<string | null>(null);
      const [playing, setPlaying] = useState(false);
      return (
        <TrackTable
          tracks={[track]}
          labels={labels}
          display={{ displayThumbnail: true }}
          actions={{
            onPlayNow: (selectedTrack) => {
              setCurrentId(selectedTrack.source.id);
              setPlaying((current) =>
                currentId === selectedTrack.source.id ? !current : true,
              );
            },
          }}
          meta={{
            isCurrentTrack: (candidate) => candidate.source.id === currentId,
            isTrackPlaying: (candidate) =>
              candidate.source.id === currentId && playing,
          }}
        />
      );
    };

    render(<PlaybackHarness />);
    await userEvent.click(screen.getByRole('button', { name: 'Play Track 1' }));

    expect(screen.getByTestId('track-row')).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(
      screen.getByRole('button', { name: 'Pause Track 1' }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Pause Track 1' }),
    );
    expect(
      screen.getByRole('button', { name: 'Play Track 1' }),
    ).toBeInTheDocument();
  });

  it('opens track details from the title without starting playback', async () => {
    const track = makeTracks(1)[0]!;
    const onOpenDetails = vi.fn();
    const onPlayNow = vi.fn();

    render(
      <TrackTable
        tracks={[track]}
        labels={labels}
        display={{ displayThumbnail: true }}
        actions={{ onOpenDetails, onPlayNow }}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Track 1' }));

    expect(onOpenDetails).toHaveBeenCalledWith(track);
    expect(onPlayNow).not.toHaveBeenCalled();
  });

  it('shows a release date column when enabled and data is present', async () => {
    const track = {
      ...makeTracks(1)[0]!,
      releaseDate: '2026-01-15T00:00:00.000Z',
    };

    render(
      <TrackTable
        tracks={[track]}
        labels={labelsWithReleaseDate}
        display={{ displayReleaseDate: true }}
      />,
    );

    await screen.findByText('Track 1');
    expect(screen.getByText('Released')).toBeInTheDocument();
    expect(screen.getByText('Jan 15, 2026')).toBeInTheDocument();
  });

  it("groups favorite and the actions column at the row's right edge", async () => {
    const track = makeTracks(1)[0]!;

    render(
      <TrackTable
        tracks={[track]}
        labels={labels}
        display={{
          displayFavorite: true,
          displayDuration: true,
          displayThumbnail: false,
        }}
        actions={{ onToggleFavorite: vi.fn(), onAddToQueue: vi.fn() }}
        meta={{ isTrackFavorite: () => false }}
      />,
    );

    await screen.findByText('Track 1');
    const headerCells = screen.getAllByRole('columnheader');
    const durationIndex = headerCells.findIndex((cell) =>
      cell.textContent?.includes(labels.headers.duration),
    );
    // Duration is a plain data column -- it should sit before the trailing
    // icon-only favorite/actions cluster, not after it.
    expect(durationIndex).toBeGreaterThan(-1);
    const trailing = headerCells.slice(durationIndex + 1);
    expect(trailing.length).toBe(2);
    for (const cell of trailing) {
      expect(cell.textContent?.trim()).toBe('');
    }
  });

  it('selects rows via checkboxes and runs a bulk action on the selection', async () => {
    const tracks = makeTracks(2);
    const onRemoveSelected = vi.fn();
    const onAddSelectedToQueue = vi.fn();

    render(
      <TrackTable
        tracks={tracks}
        labels={labels}
        features={{ selectable: true }}
        display={{ displayThumbnail: false }}
        actions={{ onRemoveSelected, onAddSelectedToQueue }}
      />,
    );

    await screen.findByText('Track 1');
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Select Track 1' }),
    );
    expect(screen.getByText('1 selected')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('add-selected-to-queue-button'));
    expect(onAddSelectedToQueue).toHaveBeenCalledWith(['t-1']);
    expect(onRemoveSelected).not.toHaveBeenCalled();
    // A bulk action clears the selection afterward.
    expect(screen.queryByText('1 selected')).not.toBeInTheDocument();
  });

  it('select-all header toggles every visible row', async () => {
    const tracks = makeTracks(3);
    const onRemoveSelected = vi.fn();

    render(
      <TrackTable
        tracks={tracks}
        labels={labels}
        features={{ selectable: true }}
        display={{ displayThumbnail: false }}
        actions={{ onRemoveSelected }}
      />,
    );

    await screen.findByText('Track 1');
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Select all rows' }),
    );
    expect(screen.getByText('3 selected')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('remove-selected-button'));
    expect(onRemoveSelected).toHaveBeenCalledWith(['t-1', 't-2', 't-3']);
  });

  it('does not render the selection column or toolbar when selectable is off', async () => {
    render(
      <TrackTable
        tracks={makeTracks(1)}
        labels={labels}
        display={{ displayThumbnail: false }}
      />,
    );

    await screen.findByText('Track 1');
    expect(
      screen.queryByRole('checkbox', { name: 'Select Track 1' }),
    ).not.toBeInTheDocument();
  });
});
