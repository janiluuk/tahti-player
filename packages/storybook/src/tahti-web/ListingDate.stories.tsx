import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListingDate } from '@tahti-web/components/ListingDate';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof ListingDate> = {
  title: 'Tahti/Shared/ListingDate',
  component: ListingDate,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Recent: Story = {
  args: {
    value: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('time')).toBeVisible();
  },
};

export const Absolute: Story = {
  args: {
    value: '2025-03-01T12:00:00.000Z',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('1.3.2025')).toBeVisible();
  },
};

export const DateOnly: Story = {
  args: {
    value: '2025-11-04',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('4.11.2025')).toBeVisible();
  },
};
