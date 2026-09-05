import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlayerOverlayControls } from '@tahti-web/components/channel-designer/PlayerOverlayControls';
import {
  DEFAULT_NOW_PLAYING_OVERLAY_SETTINGS,
  type NowPlayingOverlayPresetId,
} from '@tahti-web/content/nowPlayingOverlayPresets';
import { useState } from 'react';

/**
 * Player → Overlay: stage text layer (Storybook `ChannelTextOverlayEditor` /
 * `ChannelTextOverlayView`) plus the now-playing layout preset picker.
 * "Configure text" opens `NowPlayingOverlayConfigDialog`, which stays in
 * ChannelDesigner.
 *
 * Missing states: an artwork-less preset tile.
 */
const meta: Meta<typeof PlayerOverlayControls> = {
  title: 'Tahti/Channel/Designer/PlayerOverlayControls',
  component: PlayerOverlayControls,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function Demo() {
  const [playerOverlay, setPlayerOverlay] = useState({
    mode: 'NONE' as string,
    text: '',
    align: 'CENTER' as string,
  });
  const [nowPlayingStyle, setNowPlayingStyle] =
    useState<NowPlayingOverlayPresetId>('minimal');

  return (
    <div className="max-w-lg">
      <PlayerOverlayControls
        playerOverlay={playerOverlay}
        onPlayerOverlayChange={setPlayerOverlay}
        previewStyle={{
          bg: '#0B1220',
          accent: '#6C5CE7',
          highlight: '#FDCB6E',
        }}
        nowPlayingStyle={nowPlayingStyle}
        onNowPlayingStyleChange={setNowPlayingStyle}
        overlaySettings={DEFAULT_NOW_PLAYING_OVERLAY_SETTINGS}
        displayName="Demo Artist"
        avatarUrl={null}
        onConfigureText={() => undefined}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <Demo />,
};
