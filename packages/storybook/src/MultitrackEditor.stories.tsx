import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, type ReactNode } from 'react';

import { MultitrackEditor, useEditorStore } from '@tahti-player/audio-editor';
import { VisualizerHost } from '@tahti-player/visualizer';

function ResetEditorStore({ children }: { children: ReactNode }) {
  useEffect(() => {
    useEditorStore.getState().loadProject({ tracks: [], clips: [] });
  }, []);
  return <>{children}</>;
}

const meta = {
  title: 'Audio/MultitrackEditor',
  component: MultitrackEditor,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="bg-background text-foreground min-h-96 w-full max-w-6xl">
        <ResetEditorStore>
          <Story />
        </ResetEditorStore>
      </div>
    ),
  ],
} satisfies Meta<typeof MultitrackEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    showVizSlot: true,
    vizSlot: <VisualizerHost className="h-full min-h-64 w-full" />,
    onBounce: async () => undefined,
  },
};

export const ArrangeOnly: Story = {
  args: {
    showVizSlot: false,
    onBounce: async () => undefined,
  },
};
