import type { Meta, StoryObj } from '@storybook/react-vite';
import { RotateCcwIcon } from 'lucide-react';
import { useState } from 'react';
import { expect, within } from 'storybook/test';

import { Button, ColorField } from '@tahti-player/ui';

const meta: Meta<typeof ColorField> = {
  title: 'Components/ColorField',
  component: ColorField,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ColorField>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('#22d3ee');
    return (
      <div className="w-72">
        <ColorField label="Accent" value={value} onChange={setValue} />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText('Accent')).toHaveValue('#22d3ee');
    await expect(canvas.getByText('#22d3ee')).toBeVisible();
  },
};

/** A reset action sits outside the label, so it is its own tab stop. */
export const WithReset: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div className="w-80">
        <ColorField
          label="Text color"
          value={value || '#ffffff'}
          detail={value || 'Default (white / light gray)'}
          onChange={setValue}
          actions={
            value ? (
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label="Reset to default colors"
                onClick={() => setValue('')}
              >
                <RotateCcwIcon size={14} aria-hidden />
              </Button>
            ) : null
          }
        />
      </div>
    );
  },
};

export const CompactPair: Story = {
  render: () => {
    const [accent, setAccent] = useState('#22d3ee');
    const [highlight, setHighlight] = useState('#f59e0b');
    return (
      <div className="grid w-72 grid-cols-2 gap-2">
        <ColorField
          compact
          label="Accent"
          value={accent}
          onChange={setAccent}
        />
        <ColorField
          compact
          label="Highlight"
          value={highlight}
          onChange={setHighlight}
        />
      </div>
    );
  },
};
