import type { Meta, StoryObj } from '@storybook/react-vite';
import { CoverArtPickerDialog } from '@tahti-web/components/CoverArtPickerDialog';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

const meta = {
  title: 'Tahti/Media/CoverArtPickerDialog',
  component: CoverArtPickerDialog,
  parameters: {
    docs: {
      description: {
        component:
          'Opened from a cover slot: upload a new image, or pick one from the enabled artwork presets combined with your own uploaded images.',
      },
    },
  },
  args: {
    isOpen: true,
    onClose: fn(),
    onSelect: fn(),
    label: 'Cover art',
    value: '/artwork-presets/artwork-02.webp',
  },
} satisfies Meta<typeof CoverArtPickerDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args }) => {
    const dialog = within(document.body);
    await expect(
      dialog.getByRole('button', { name: 'Upload image' }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        dialog.getAllByRole('button', { name: /^Use artwork \d+$/ }).length,
      ).toBeGreaterThanOrEqual(16),
    );
    await userEvent.click(
      dialog.getByRole('button', { name: 'Use artwork 5' }),
    );
    await expect(args.onSelect).toHaveBeenCalledWith(
      '/artwork-presets/artwork-05.webp',
      'gallery',
    );
  },
};
