import type { Meta, StoryObj } from '@storybook/react-vite';
import type { EditList } from '@tahti-web/api/studio-types';
import { useAudioFxStore } from '@tahti-web/plugins/audio-fx';
import { MasteringPanel } from '@tahti-web/views/studio/pro-editor/MasteringPanel';
import { PluginControls } from '@tahti-web/views/studio/pro-editor/PluginControls';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { expectNoDialog, findDialog } from './_lib/play';

const EDIT_LIST: EditList = {
  version: 1,
  sourceDuration: 240,
  cuts: [],
  pluginChain: ['eq', 'comp', 'limiter', 'filter'],
  fades: [],
  gainDb: 0,
  eq: {
    enabled: true,
    bands: [
      { freq: 120, gainDb: 2, q: 0.8 },
      { freq: 1000, gainDb: -1, q: 1 },
      { freq: 8000, gainDb: 1.5, q: 0.7 },
    ],
  },
  comp: {
    enabled: true,
    thresholdDb: -18,
    ratio: 3,
    attackMs: 10,
    releaseMs: 120,
    makeupDb: 2,
  },
  limiter: { enabled: true, ceilingDb: -1, releaseMs: 80 },
  filter: { enabled: false, mode: 'highpass', freq: 40, slope: '12db' },
  loudnorm: { enabled: false, targetLufs: -14, targetTp: -1 },
  highPassHz: 0,
  lowPassHz: 0,
};

function Controls({ id }: { id: 'eq' | 'comp' | 'limiter' | 'filter' }) {
  const [editList, setEditList] = useState(EDIT_LIST);
  return <PluginControls id={id} editList={editList} onChange={setEditList} />;
}

function Mastering() {
  const [editList, setEditList] = useState(EDIT_LIST);
  return <MasteringPanel editList={editList} onChange={setEditList} />;
}

const meta: Meta = {
  title: 'Tahti/Studio/Pro editor/Mastering',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Pro editor → Mastering: normalize, master gain and the drag-to-reorder chain of audio add-ons (EQ, compressor, limiter, filter), each with its own controls.',
      },
    },
  },
  beforeEach: () => {
    useAudioFxStore.setState({
      enabledPluginIds: ['eq', 'comp', 'limiter', 'filter'],
    });
  },
};

export default meta;
type Story = StoryObj;

export const Equalizer: Story = {
  render: () => <Controls id="eq" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('slider', { name: /Band 1 gain/ }),
    ).toBeInTheDocument();
  },
};

export const Compressor: Story = { render: () => <Controls id="comp" /> };

export const Limiter: Story = { render: () => <Controls id="limiter" /> };

export const Filter: Story = { render: () => <Controls id="filter" /> };

export const Panel: Story = {
  render: () => <Mastering />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Expand mastering' }),
    );
    await expect(
      canvas.getByRole('button', { name: 'Normalize' }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Remove EQ' }));
    const dialog = await findDialog(canvasElement);
    const confirm = dialog.getByRole('button', { name: 'Remove' });
    await expect(confirm.className).toContain('bg-accent-red');
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await expectNoDialog(canvasElement);
  },
};
