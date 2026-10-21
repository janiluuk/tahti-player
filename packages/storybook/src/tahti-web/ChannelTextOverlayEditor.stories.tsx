import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ChannelTextOverlayEditor,
  type TextOverlayDraft,
} from '@tahti-web/components/ChannelTextOverlayEditor';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { withinBody } from './_lib/play';

const meta: Meta<typeof ChannelTextOverlayEditor> = {
  title: 'Tahti/Channel/ChannelTextOverlayEditor',
  component: ChannelTextOverlayEditor,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function EditorDemo({ initial }: { initial: TextOverlayDraft }) {
  const [value, setValue] = useState<TextOverlayDraft>(initial);
  return (
    <div className="max-w-sm">
      <ChannelTextOverlayEditor value={value} onChange={setValue} />
    </div>
  );
}

export const NoEffect: Story = {
  render: () => (
    <EditorDemo initial={{ mode: 'NONE', text: '', align: 'CENTER' }} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByLabelText('Your text')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Text effect' }));
    await userEvent.click(
      await withinBody(canvasElement).findByRole('option', {
        name: 'Cosmic neon',
      }),
    );
    const text = await canvas.findByLabelText('Your text');
    await userEvent.type(text, 'Live from Helsinki');
    await expect(text).toHaveValue('Live from Helsinki');
    await expect(
      canvas.getByRole('button', { name: 'Alignment' }),
    ).toHaveTextContent('Center');
  },
};

export const GradientShimmer: Story = {
  render: () => (
    <EditorDemo
      initial={{
        mode: 'GRADIENT_SHIMMER',
        text: 'New album out now — listen live',
        align: 'CENTER',
      }}
    />
  ),
};
