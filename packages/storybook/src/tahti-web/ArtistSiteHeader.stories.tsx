import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArtistSiteHeader } from '@tahti-web/components/ArtistSiteHeader';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof ArtistSiteHeader> = {
  title: 'Tahti/Channel/ArtistSiteHeader',
  component: ArtistSiteHeader,
  parameters: { layout: 'fullscreen' },
  args: {
    artistName: 'Northern Lights',
    title: 'Northern Lights — music after dark',
    colorScheme: { bg: '#172033', text: '#fafafa', accent: '#f0abfc' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Themed: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('link', { name: 'tahti.live' }),
    ).toHaveAttribute('href', 'https://tahti.live/');
  },
};
export const ArtistName: Story = { args: { title: '' } };
export const Hidden: Story = {
  args: { hidden: true },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).queryByRole('banner'),
    ).not.toBeInTheDocument();
    await expect(
      within(canvasElement).getByRole('link', { name: 'tahti.live' }),
    ).toBeVisible();
  },
};
