import type { Meta, StoryObj } from '@storybook/react-vite';
import { SortSoundsDialog } from '@tahti-web/components/SortSoundsDialog';
import { expect, fn, userEvent, waitFor } from 'storybook/test';

import { findDialog } from './_lib/play';

const SOUNDS = [
  'Set @ Oodi 12.4.24',
  'Progressive house & techno',
  'Upbeat progressive set @ Suvilahti',
  'Euphorizer LP - Dive',
  'Nightriders vol. 43',
  'Moody Electronica vol. 40',
  'Trance and techno @ TDC Ruoholahti',
].map((title, index) => ({
  id: `s${index + 1}`,
  title,
  date: new Date(Date.UTC(2023 + (index % 4), index, 3)).toISOString(),
  artworkUrl: null,
}));

/** Sort a collection's sounds: a sort, drag, arrow keys on the handle, or
 * Move to top / bottom; Save stores the order. */
const meta: Meta<typeof SortSoundsDialog> = {
  title: 'Tahti/Studio/Collections/SortSoundsDialog',
  component: SortSoundsDialog,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    sounds: SOUNDS,
    initialMode: 'OWN',
    onSave: fn(async () => ({ ok: true as const })),
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ArtworkStaysInTheRow: Story = {
  args: {
    sounds: SOUNDS.map((sound) => ({
      ...sound,
      artworkUrl: `https://picsum.photos/seed/${sound.id}/80/80`,
    })),
  },
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, 'Sort sounds');
    for (const row of dialog.getAllByTestId('sort-sounds-row')) {
      const artwork = row.querySelector('img')?.parentElement;
      await expect(artwork).toBeTruthy();
      await expect(artwork!.getBoundingClientRect().width).toBeLessThanOrEqual(
        row.getBoundingClientRect().height,
      );
    }
  },
};

export const MoveToTopAndArrowKeys: Story = {
  name: 'Move to top, arrow keys, save',
  play: async ({ canvasElement, args }) => {
    const dialog = await findDialog(canvasElement, 'Sort sounds');
    await userEvent.click(
      dialog.getByRole('button', {
        name: 'Move Trance and techno @ TDC Ruoholahti to top',
      }),
    );
    await userEvent.click(
      dialog.getByRole('button', { name: 'Reorder Nightriders vol. 43' }),
    );
    await userEvent.keyboard('{Home}');
    const rows = dialog.getAllByTestId('sort-sounds-row');
    await expect(rows[0]).toHaveTextContent('Nightriders vol. 43');
    await expect(rows[1]).toHaveTextContent('Trance and techno');
    await userEvent.click(dialog.getByRole('button', { name: 'Save order' }));
    await waitFor(() => expect(args.onSave).toHaveBeenCalled());
    await expect(
      (args.onSave as ReturnType<typeof fn>).mock.calls[0]?.[0]?.slice(0, 2),
    ).toEqual(['s5', 's7']);
  },
};
