import type { Meta, StoryObj } from '@storybook/react-vite';
import { VenuesDirectory } from '@tahti-web/components/VenuesDirectory';
import { expect, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof VenuesDirectory> = {
  title: 'Tahti/Discover/VenuesDirectory',
  component: VenuesDirectory,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Discover → Venues: verified venues as cards. The place and the capacity sit on their own lines, so neither is cut off on a phone.',
      },
    },
  },
  decorators: [withTahtiRouter('/discover?tab=venues')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('link', { name: 'Kuudes Linja' });
    await expect(canvas.getByText(/Helsinki/)).toBeInTheDocument();
    await expect(canvas.getByText('cap. 400')).toBeInTheDocument();
  },
};

export const Phone: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('link', { name: 'Kuudes Linja' });
    const place = canvas.getByText(/Helsinki/);
    const capacity = canvas.getByText('cap. 400');
    await expect(place).not.toBe(capacity);
    await expect(place.parentElement).toBe(capacity.parentElement);
  },
};
