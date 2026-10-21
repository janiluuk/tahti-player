import type { Meta, StoryObj } from '@storybook/react-vite';
import { DownloadsSwitch } from '@tahti-web/components/DownloadsSwitch';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

const meta: Meta<typeof DownloadsSwitch> = {
  title: 'Tahti/Track/DownloadsSwitch',
  component: DownloadsSwitch,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Sharing tab\'s "Allow downloads" switch in the track editor. Renders nothing when the API doesn\'t return `downloadsEnabled`, since such an API would drop a saved value.',
      },
    },
  },
  tags: ['autodocs'],
  args: { enabled: true, onChange: fn() },
  render: function Render(args) {
    const [enabled, setEnabled] = useState(args.enabled);
    return (
      <DownloadsSwitch
        {...args}
        enabled={enabled}
        onChange={(next) => {
          args.onChange(next);
          setEnabled(next);
        }}
      />
    );
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const On: Story = {
  play: async ({ canvasElement, args }) => {
    const toggle = within(canvasElement).getByRole('switch', {
      name: 'Allow downloads',
    });
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(toggle);
    await expect(args.onChange).toHaveBeenCalledWith(false);
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
  },
};

export const Off: Story = { args: { enabled: false } };

// An API older than tahti-org#659: no flag, no switch.
export const UnsupportedApi: Story = {
  args: { enabled: undefined },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('switch')).toBeNull();
  },
};
