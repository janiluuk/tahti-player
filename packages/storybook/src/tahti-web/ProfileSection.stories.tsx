import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProfileSection } from '@tahti-web/components/ProfileSection';
import { expect, fn, userEvent, within } from 'storybook/test';

const meta: Meta<typeof ProfileSection> = {
  title: 'Tahti/Profile/ProfileSection',
  component: ProfileSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'One section of an artist or channel profile: the shared `SectionTitle` heading plus loading, error and empty states. Artist popular tracks, related artists, releases and playlists, and the channel Tracks block all use it.',
      },
    },
  },
  args: {
    title: 'Releases',
    children: <p className="text-sm">Night Drive EP, Polar Static, Snowline</p>,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const section = canvas.getByRole('region', { name: 'Releases' });
    await expect(within(section).getByText(/Night Drive EP/)).toBeVisible();
  },
};

export const Loading: Story = {
  args: { title: 'Tracks', status: 'loading', loadingLabel: 'Loading tracks…' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Loading tracks…')).toBeVisible();
    await expect(canvas.queryByText(/Night Drive EP/)).toBeNull();
  },
};

export const Failed: Story = {
  args: {
    title: 'Tracks',
    status: 'error',
    errorTitle: "Tracks couldn't load",
    errorDescription: 'The rest of the channel still works.',
    onRetry: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Tracks couldn't load")).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }));
    await expect(args.onRetry).toHaveBeenCalledOnce();
  },
};

export const Empty: Story = {
  args: {
    title: 'Tracks',
    empty: {
      title: 'No public tracks yet',
      description: 'When this channel publishes tracks, they show up here.',
    },
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('No public tracks yet'),
    ).toBeVisible();
  },
};

export const WithoutHeading: Story = {
  args: { title: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('heading')).toBeNull();
    await expect(canvas.getByText(/Night Drive EP/)).toBeVisible();
  },
};
