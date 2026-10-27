import type { Meta, StoryObj } from '@storybook/react-vite';
import { LocalLibraryFilters } from '@tahti-web/components/LocalLibraryFilters';
import { EMPTY_TRACK_FILTERS } from '@tahti-web/lib/nativeLibrary';
import { expect, fireEvent, fn, within } from 'storybook/test';

const meta: Meta<typeof LocalLibraryFilters> = {
  title: 'Tahti/Desktop/LocalLibraryFilters',
  component: LocalLibraryFilters,
  args: {
    isOpen: true,
    onClose: fn(),
    filters: EMPTY_TRACK_FILTERS,
    onApply: fn(),
    options: { formats: ['flac'], yearMin: 2020, yearMax: 2026 },
    roots: [],
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const KeyRejected: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const key = await body.findByLabelText('Key (e.g. Am, F#, 8A)');
    fireEvent.change(key, { target: { value: 'banana' } });
    await expect(body.getByText(/Use a key like/)).toBeVisible();
    await expect(body.getByRole('button', { name: 'Apply' })).toBeDisabled();
  },
};

export const KeyAccepted: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const key = await body.findByLabelText('Key (e.g. Am, F#, 8A)');
    fireEvent.change(key, { target: { value: '8A' } });
    await expect(body.queryByText(/Use a key like/)).toBeNull();
    await expect(body.getByRole('button', { name: 'Apply' })).toBeEnabled();
  },
};
