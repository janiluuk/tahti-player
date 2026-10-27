import type { Meta, StoryObj } from '@storybook/react-vite';
import { AudienceBreakdown } from '@tahti-web/views/studio/stats/AudienceBreakdown';
import { ListenerLocations } from '@tahti-web/views/studio/stats/ListenerLocations';
import { ListenerLoyalty } from '@tahti-web/views/studio/stats/ListenerLoyalty';
import { expect, userEvent, within } from 'storybook/test';

import { withPageSurface } from './_lib/decorators';

const WINDOW = { range: '30' as const };

const meta: Meta = {
  title: 'Tahti/Studio/Stats/Audience panels',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The listen-session panels on Studio → Stats → Plays (also on a track’s insights): where listeners are, how far into a track they get, and which browsers, devices, sites and Tahti surfaces they listen from. Names under five listens fold into Other.',
      },
    },
  },
  decorators: [withPageSurface()],
};

export default meta;
type Story = StoryObj;

export const Audience: Story = {
  render: () => <AudienceBreakdown window={WINDOW} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('instagram.com')).toBeInTheDocument();
    await expect(canvas.getByText('Device company')).toBeInTheDocument();
    await expect(canvas.getByText('Listened on')).toBeInTheDocument();
    const toggle = canvas.getByRole('switch', { name: /Ignore bot traffic/ });
    await expect(toggle).toBeChecked();
    await userEvent.click(toggle);
    await expect(toggle).not.toBeChecked();
  },
};

export const Locations: Story = {
  render: () => <ListenerLocations window={WINDOW} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Countries')).toBeInTheDocument();
    await expect(canvas.getByText('Cities')).toBeInTheDocument();
  },
};

export const Loyalty: Story = {
  render: () => <ListenerLoyalty window={WINDOW} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Listener loyalty'),
    ).toBeInTheDocument();
  },
};
