import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminModerationView } from '@tahti-web/views/admin/moderation/AdminModerationView';
import type { AdminModerationTabId } from '@tahti-web/views/admin/moderation/moderationNav';
import { expect, waitFor, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminModerationView> = {
  title: 'Tahti/Admin/AdminModerationView',
  component: AdminModerationView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/moderation'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

function renderTab(tab?: AdminModerationTabId) {
  return () => (
    <div className="p-6">
      <AdminModerationView tab={tab} />
    </div>
  );
}

/** Asserts the page heading and the queue chip for `label`. The default Support chip stays idle. */
async function expectQueue(
  canvasElement: HTMLElement,
  label: string,
  pressed: boolean,
) {
  const canvas = within(canvasElement);
  await waitFor(() =>
    expect(
      canvas.getByRole('heading', { level: 1, name: 'Inbox' }),
    ).toBeVisible(),
  );
  const queues = within(
    canvas.getByRole('radiogroup', { name: 'Inbox queues' }),
  );
  await expect(queues.getAllByRole('radio')).toHaveLength(7);
  await waitFor(() =>
    expect(
      queues.getByRole('radio', { name: new RegExp(`^${label}`) }),
    ).toHaveAttribute('aria-checked', pressed ? 'true' : 'false'),
  );
  return canvas;
}

/** No `tab` prop: lands on Support, with the open ticket and its reply box. */
export const Default: Story = {
  render: renderTab(),
  play: async ({ canvasElement }) => {
    const canvas = await expectQueue(canvasElement, 'Support', false);
    const ticket = await canvas.findByRole('heading', {
      level: 2,
      name: 'Cannot connect OBS to multistream target',
    });
    await waitFor(() => expect(ticket).toBeVisible());
    await expect(
      canvas.getByRole('textbox', { name: 'Reply to ticket' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Start progress' }),
    ).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Resolve' })).toBeVisible();
  },
};

export const BetaApplicationsTab: Story = {
  render: renderTab('beta'),
  play: async ({ canvasElement }) => {
    const canvas = await expectQueue(canvasElement, 'Beta applications', true);
    await waitFor(() =>
      expect(canvas.getByText('Kaiku Collective')).toBeVisible(),
    );
    await expect(
      canvas.getByText(
        'Approving creates an artist account and emails a password setup link.',
      ),
    ).toBeVisible();
    await expect(canvas.getByRole('tab', { name: 'Pending' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(canvas.getByRole('button', { name: 'Approve' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Reject' })).toBeVisible();
  },
};

export const RadioSubmissionsTab: Story = {
  render: renderTab('radio-submissions'),
  play: async ({ canvasElement }) => {
    const canvas = await expectQueue(canvasElement, 'Radio submissions', true);
    await waitFor(() =>
      expect(canvas.getByRole('heading', { name: 'Auditing' })).toBeVisible(),
    );
    await expect(
      canvas.getByRole('heading', { level: 3, name: 'Moonlight Drive' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: /Echo Chamber Cypher/ }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Approve to radio' }),
    ).toBeVisible();
  },
};

export const ContentReportsTab: Story = {
  render: renderTab('content-reports'),
  play: async ({ canvasElement }) => {
    const canvas = await expectQueue(canvasElement, 'Content reports', true);
    await waitFor(() =>
      expect(
        canvas.getByRole('link', {
          name: 'Night Drive (opens in a new tab)',
        }),
      ).toBeVisible(),
    );
    await expect(
      canvas.getByRole('link', {
        name: 'Comment by @aurora-fan (opens in a new tab)',
      }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Delete comment' }),
    ).toBeVisible();
  },
};

export const FeatureRequestsTab: Story = {
  render: renderTab('feature-requests'),
  play: async ({ canvasElement }) => {
    const canvas = await expectQueue(canvasElement, 'Feature requests', true);
    await waitFor(() =>
      expect(
        canvas.getByText('Crossfade between archive tracks'),
      ).toBeVisible(),
    );
    await expect(canvas.getByText(/34 votes/)).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Quarterly review reports' }),
    ).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Plan' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Decline' })).toBeVisible();
  },
};

/** The mock queue holds two missed shows. */
export const MissedShowsTab: Story = {
  render: renderTab('missed-shows'),
  play: async ({ canvasElement }) => {
    const canvas = await expectQueue(canvasElement, 'Missed shows', true);
    await waitFor(() =>
      expect(canvas.getByRole('heading', { name: 'Queue · 2' })).toBeVisible(),
    );
    await expect(canvas.getByText('Friday Frequency')).toBeVisible();
  },
};

export const ThemesTab: Story = {
  render: renderTab('themes'),
  play: async ({ canvasElement }) => {
    const canvas = await expectQueue(canvasElement, 'Themes', true);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { name: 'Community themes' }),
      ).toBeVisible(),
    );
    await waitFor(() => expect(canvas.getByText('Revontulet')).toBeVisible());
    await expect(canvas.getByRole('button', { name: 'Approve' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Reject' })).toBeVisible();
  },
};
