import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { PlayerBar } from '@tahti-player/ui';

const meta = {
  title: 'Layout/PlayerBar',
  component: PlayerBar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PlayerBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const cover = 'https://picsum.photos/64';
const noop = () => {};
const labels = {
  shuffleOn: 'Shuffle: on',
  shuffleOff: 'Shuffle: off',
  repeatOff: 'Repeat: off',
  repeatAll: 'Repeat: all',
  repeatOne: 'Repeat: one',
  discoveryOn: 'Discovery: on',
  discoveryOff: 'Discovery: off',
};

export const Default: Story = {
  render: () => (
    <>
      <PlayerBar.SeekBar
        progress={35}
        elapsedSeconds={97}
        remainingSeconds={1297}
      />
      <PlayerBar
        left={
          <PlayerBar.NowPlaying
            title="Song Title"
            artist="Artist Name"
            coverUrl={cover}
          />
        }
        center={
          <PlayerBar.Controls
            labels={labels}
            onPlayPause={noop}
            onNext={noop}
            onPrevious={noop}
            onShuffleToggle={noop}
            onRepeatToggle={noop}
            showDiscovery={false}
          />
        }
        right={<PlayerBar.Volume defaultValue={75} />}
      />
    </>
  ),
};

export const ActiveStates: Story = {
  render: () => (
    <>
      <PlayerBar.SeekBar
        progress={58}
        elapsedSeconds={213}
        remainingSeconds={987}
      />
      <PlayerBar
        left={
          <PlayerBar.NowPlaying
            title="Crystalized"
            artist="XX"
            coverUrl={cover}
          />
        }
        center={
          <PlayerBar.Controls
            isPlaying
            isShuffleActive
            repeatMode="all"
            isDiscoveryActive
            showDiscovery
            labels={labels}
            onPlayPause={noop}
            onNext={noop}
            onPrevious={noop}
            onShuffleToggle={noop}
            onRepeatToggle={noop}
            onDiscoveryToggle={noop}
          />
        }
        right={<PlayerBar.Volume defaultValue={60} />}
      />
    </>
  ),
};

export const NoArtwork: Story = {
  render: () => (
    <>
      <PlayerBar.SeekBar
        progress={10}
        elapsedSeconds={37}
        remainingSeconds={154}
      />
      <PlayerBar
        left={
          <PlayerBar.NowPlaying
            title="Untitled Track"
            artist="Unknown Artist"
          />
        }
        center={
          <PlayerBar.Controls
            labels={labels}
            onPlayPause={noop}
            onNext={noop}
            onPrevious={noop}
            onShuffleToggle={noop}
            onRepeatToggle={noop}
            showDiscovery={false}
          />
        }
        right={<PlayerBar.Volume defaultValue={30} />}
      />
    </>
  ),
};

export const LongMetadata: Story = {
  render: () => (
    <div style={{ width: 480 }}>
      <PlayerBar.SeekBar
        progress={72}
        elapsedSeconds={1234}
        remainingSeconds={321}
      />
      <PlayerBar
        left={
          <PlayerBar.NowPlaying
            title="An Incredibly, Ridiculously Long Song Title That Should Truncate Nicely"
            artist="A Very Long Artist Name Featuring Another Long Artist With Even More Characters"
            coverUrl={cover}
          />
        }
        center={
          <PlayerBar.Controls
            labels={labels}
            onPlayPause={noop}
            onNext={noop}
            onPrevious={noop}
            onShuffleToggle={noop}
            onRepeatToggle={noop}
            showDiscovery={false}
          />
        }
        right={<PlayerBar.Volume defaultValue={50} />}
      />
    </div>
  ),
};

export const SeekOnlyInteractive: Story = {
  render: () => {
    const [progress, setProgress] = useState(30);
    const onSeek = useCallback((p: number) => setProgress(p), []);
    return (
      <div style={{ padding: 16 }}>
        <PlayerBar.SeekBar
          progress={progress}
          elapsedSeconds={Math.floor((progress / 100) * 240)}
          remainingSeconds={240 - Math.floor((progress / 100) * 240)}
          onSeek={onSeek}
        />
      </div>
    );
  },
};

export const SeekLoading: Story = {
  render: () => (
    <div style={{ padding: 16 }}>
      <PlayerBar.SeekBar
        progress={50}
        elapsedSeconds={120}
        remainingSeconds={120}
        isLoading
      />
    </div>
  ),
};

const onNext = fn();
const onPrevious = fn();
const REPEAT_ORDER = ['off', 'all', 'one'] as const;

/** Controls wired to local state, as the apps wire them to their stores. */
export const Interactive: Story = {
  render: function InteractivePlayerBar() {
    const [isPlaying, setPlaying] = useState(false);
    const [isShuffleActive, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState(0);
    return (
      <PlayerBar
        left={
          <PlayerBar.NowPlaying
            title="Midnight Drift"
            artist="Northern Lights"
            coverUrl={cover}
          />
        }
        center={
          <PlayerBar.Controls
            isPlaying={isPlaying}
            isShuffleActive={isShuffleActive}
            repeatMode={REPEAT_ORDER[repeat % 3]}
            labels={labels}
            onPlayPause={() => setPlaying((v) => !v)}
            onNext={onNext}
            onPrevious={onPrevious}
            onShuffleToggle={() => setShuffle((v) => !v)}
            onRepeatToggle={() => setRepeat((v) => v + 1)}
            showDiscovery={false}
          />
        }
        right={<PlayerBar.Volume defaultValue={75} />}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onNext.mockClear();
    onPrevious.mockClear();

    const play = canvas.getByRole('button', { name: 'Play' });
    await expect(play).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(play);
    const pause = canvas.getByRole('button', { name: 'Pause' });
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(pause);
    await expect(canvas.getByRole('button', { name: 'Play' })).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Previous' }));
    await expect(onNext).toHaveBeenCalledOnce();
    await expect(onPrevious).toHaveBeenCalledOnce();

    await userEvent.click(canvas.getByRole('button', { name: 'Shuffle: off' }));
    await expect(
      canvas.getByRole('button', { name: 'Shuffle: on' }),
    ).toBeVisible();

    for (const next of ['Repeat: all', 'Repeat: one', 'Repeat: off']) {
      await userEvent.click(canvas.getByRole('button', { name: /^Repeat/ }));
      await expect(canvas.getByRole('button', { name: next })).toBeVisible();
    }
  },
};
