import type { Meta, StoryObj } from '@storybook/react-vite';
import type { StudioSound } from '@tahti-web/api/studio-types';
import { VisualizerEditor } from '@tahti-web/components/channel-designer/VisualizerEditor';
import { VisualizerTrackPicker } from '@tahti-web/components/channel-designer/VisualizerTrackPicker';
import { useState } from 'react';

/**
 * Channel & Design visualization editor takeover.
 *
 * Missing states: live export against AudioEngine in Storybook play.
 * Orphan: none — hosted from ChannelDesigner Player → Visualizer.
 */
const meta: Meta<typeof VisualizerEditor> = {
  title: 'Tahti/Studio/VisualizerEditor',
  component: VisualizerEditor,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const scheme = {
  accent: '#22D3EE',
  highlight: '#A78BFA',
  bg: '#0B1220',
  text: '#F8FAFC',
  muted: '#64748B',
};

function EditorDemo() {
  const [open, setOpen] = useState(true);
  const [preset, setPreset] = useState<'AURORA' | 'PARTICLE_FIELD'>('AURORA');
  const [enabled, setEnabled] = useState(true);
  const [settings, setSettings] = useState({
    AURORA: { speed: 1, intensity: 1, audioReactive: true },
  });
  if (!open) {
    return (
      <button
        type="button"
        className="m-4 underline"
        onClick={() => setOpen(true)}
      >
        Reopen editor
      </button>
    );
  }
  return (
    <VisualizerEditor
      open={open}
      onClose={() => setOpen(false)}
      activeVisualizer={preset}
      visualizerEnabled={enabled}
      visualSettings={settings}
      visualSettingsJson={JSON.stringify(settings)}
      scheme={scheme}
      onApplyPreset={setPreset}
      onToggleEnabled={() => setEnabled((value) => !value)}
      onSettingChange={(presetKey, key, value) => {
        setSettings((current) => ({
          ...current,
          [presetKey]: {
            ...(current[presetKey as keyof typeof current] ?? {
              speed: 1,
              intensity: 1,
              audioReactive: true,
            }),
            [key]: value,
          },
        }));
      }}
      onUseAsBackground={() => undefined}
    />
  );
}

export const Open: Story = {
  render: () => <EditorDemo />,
};

const sampleTracks: StudioSound[] = [
  {
    id: '1',
    title: 'Northern Lights — Live Set',
    status: 'READY',
    artistName: 'Demo Artist',
    durationSec: 3720,
  },
  {
    id: '2',
    title: 'Kaamos Bloom',
    status: 'READY',
    artistName: 'Demo Artist',
    durationSec: 248,
  },
];

export const TrackPickerList: StoryObj<typeof VisualizerTrackPicker> = {
  name: 'Track picker',
  render: () => {
    const [selectedId, setSelectedId] = useState<string | null>('1');
    return (
      <div className="max-w-md p-4">
        <VisualizerTrackPicker
          tracks={sampleTracks}
          selectedId={selectedId}
          onSelect={(track) => setSelectedId(track.id)}
          playingId={selectedId}
        />
      </div>
    );
  },
};

export const TrackPickerEmpty: StoryObj<typeof VisualizerTrackPicker> = {
  name: 'Track picker empty',
  render: () => (
    <div className="max-w-md p-4">
      <VisualizerTrackPicker
        tracks={[]}
        selectedId={null}
        onSelect={() => undefined}
      />
    </div>
  ),
};

export const TrackPickerError: StoryObj<typeof VisualizerTrackPicker> = {
  name: 'Track picker error',
  render: () => (
    <div className="max-w-md p-4">
      <VisualizerTrackPicker
        tracks={[]}
        selectedId={null}
        error="API unavailable"
        onRetry={() => undefined}
        onSelect={() => undefined}
      />
    </div>
  ),
};
