import type { Meta, StoryObj } from '@storybook/react-vite';
import { addMockSoundVersion } from '@tahti-web/api/sound-versions';
import {
  TakeMetamorphDialog,
  type TakeLoader,
} from '@tahti-web/views/studio/pro-editor/TakeMetamorphDialog';
import { expect, fn, userEvent, waitFor } from 'storybook/test';

import { findDialog } from './_lib/play';

const TWO_TAKES = 'story-metamorph-two-takes';
const ONE_TAKE = 'story-metamorph-one-take';
addMockSoundVersion(TWO_TAKES, {
  versionLabel: 'Night remix',
  filename: 'night-remix.wav',
});

/** Synthetic takes so the story renders offline: a low sine and a bright saw. */
const syntheticTake: TakeLoader = async (_soundId, versionId, ctx) => {
  const seconds = 3;
  const buffer = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate);
  const bright = !versionId.endsWith('-1');
  for (let c = 0; c < 2; c += 1) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i += 1) {
      const t = i / ctx.sampleRate;
      const pulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * 2 * t);
      data[i] = bright
        ? 0.3 * pulse * (((t * 330) % 1) * 2 - 1)
        : 0.4 * pulse * Math.sin(2 * Math.PI * 110 * t);
    }
  }
  return buffer;
};

const DIALOG_NAME = 'Metamorph between takes';

/** Studio Pro → Multitrack: morph two versions of a sound into a new clip. */
const meta: Meta<typeof TakeMetamorphDialog> = {
  title: 'Tahti/Studio/ProEditor/TakeMetamorphDialog',
  component: TakeMetamorphDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    isOpen: true,
    soundId: TWO_TAKES,
    onClose: fn(),
    onAddClip: fn(),
    loadTake: syntheticTake,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoVersions: Story = {
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    await expect(
      await dialog.findByRole('slider', { name: /Morph amount/ }),
    ).toBeInTheDocument();
    await expect(dialog.getByRole('button', { name: /Preview/ })).toBeEnabled();
  },
};

export const AddsANamedClip: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    await dialog.findByRole('slider', { name: /Morph amount/ });
    await userEvent.click(
      dialog.getByRole('button', { name: /Add to Multitrack/ }),
    );
    await waitFor(() => expect(args.onAddClip).toHaveBeenCalledOnce());
    const [blob, name] = (args.onAddClip as ReturnType<typeof fn>).mock
      .calls[0] as [Blob, string];
    await expect(blob.type).toBe('audio/wav');
    await expect(name).toMatch(/^Metamorph v1 .* × v2 .*\(50% equal power\)$/);
  },
};

export const OnlyOneVersion: Story = {
  args: { soundId: ONE_TAKE },
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, DIALOG_NAME);
    await expect(
      await dialog.findByText('Two versions needed'),
    ).toBeInTheDocument();
    await expect(
      dialog.getByRole('button', { name: /Add to Multitrack/ }),
    ).toBeDisabled();
  },
};
