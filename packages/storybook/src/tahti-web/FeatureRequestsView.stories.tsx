import type { Meta, StoryObj } from '@storybook/react-vite';
import { FeatureRequestsView } from '@tahti-web/views/FeatureRequestsView';
import { expect, userEvent, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof FeatureRequestsView> = {
  title: 'Tahti/Governance/FeatureRequestsView',
  component: FeatureRequestsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Co-op feature requests (`/governance/feature-requests`): members propose ideas, upvote them and discuss each one in a thread; the board sets a status (Open, Planned, Done...) and can leave a note. Signed out it asks for a cooperative membership login.',
      },
    },
  },
  decorators: [withTahtiRouter('/governance/feature-requests')],
  render: () => (
    <div className="p-6">
      <FeatureRequestsView />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Feature requests' }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole('heading', {
        name: 'Crossfade between archive tracks',
      }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Bulk-tag tracks in the archive' }),
    ).toBeVisible();
    await expect(canvas.getByText('Planned')).toBeVisible();
    await expect(
      canvas.getByText('Board note: Resolved: Listen now has a History tab.'),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Propose an idea' }),
    ).toBeVisible();
  },
};

export const ProposeAndDiscuss: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('heading', {
      name: 'Crossfade between archive tracks',
    });
    await userEvent.click(
      canvas.getByRole('button', { name: 'Propose an idea' }),
    );
    await expect(canvas.getByRole('textbox', { name: 'Title' })).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Post idea' }),
    ).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(
      canvas.queryByRole('textbox', { name: 'Title' }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      canvas.getAllByRole('button', { name: 'Discussion' })[0]!,
    );
    await expect(
      await canvas.findByText(
        'Mock comment — agreed, this would help a lot during transitions.',
      ),
    ).toBeVisible();
    await expect(
      canvas.getByRole('textbox', { name: 'Comment' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Hide discussion' }),
    ).toBeVisible();
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(
        'Sign in with a cooperative membership account to propose and vote.',
      ),
    ).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Log in' })).toBeVisible();
    await expect(
      canvas.queryByRole('button', { name: 'Propose an idea' }),
    ).not.toBeInTheDocument();
  },
};
