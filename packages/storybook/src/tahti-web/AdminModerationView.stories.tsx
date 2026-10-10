import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminModerationView } from '@tahti-web/views/admin/moderation/AdminModerationView';
import type { AdminModerationTabId } from '@tahti-web/views/admin/moderation/moderationNav';
import { expect, within } from 'storybook/test';

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

/** Asserts the page heading and that `label` is the selected queue tab. */
async function expectQueue(canvasElement: HTMLElement, label: string) {
  const canvas = within(canvasElement);
  await expect(
    await canvas.findByRole('heading', { level: 1, name: 'Moderation' }),
  ).toBeVisible();
  const queues = within(
    canvas.getByRole('tablist', { name: 'Moderation queues' }),
  );
  await expect(queues.getAllByRole('tab')).toHaveLength(7);
  await expect(queues.getByRole('tab', { name: label })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  return canvas;
}

/** No `tab` prop: lands on Support, with the open ticket and its reply box. */
export const Default: Story = {
  render: renderTab(),
  play: async ({ canvasElement }) => {
    const canvas = await expectQueue(canvasElement, 'Support');
    await expect(
      await canvas.findByRole('heading', {
        level: 3,
        name: 'Cannot connect OBS to multistream target',
      }),
    ).toBeVisible();
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
    const canvas = await expectQueue(canvasElement, 'Beta applications');
    await expect(await canvas.findByText('Kaiku Collective')).toBeVisible();
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
    const canvas = await expectQueue(canvasElement, 'Radio submissions');
    await expect(
      await canvas.findByRole('heading', { name: 'Auditing' }),
    ).toBeVisible();
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
    const canvas = await expectQueue(canvasElement, 'Content reports');
    await expect(
      await canvas.findByRole('link', { name: 'Night Drive' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Comment by @aurora-fan' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Delete comment' }),
    ).toBeVisible();
  },
};

export const FeatureRequestsTab: Story = {
  render: renderTab('feature-requests'),
  play: async ({ canvasElement }) => {
    const canvas = await expectQueue(canvasElement, 'Feature requests');
    await expect(
      await canvas.findByText('Crossfade between archive tracks'),
    ).toBeVisible();
    await expect(canvas.getByText(/34 votes/)).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Quarterly review reports' }),
    ).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Plan' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Decline' })).toBeVisible();
  },
};

/** The mock queue has no missed shows, so the empty state renders. */
export const MissedShowsTab: Story = {
  render: renderTab('missed-shows'),
  play: async ({ canvasElement }) => {
    const canvas = await expectQueue(canvasElement, 'Missed shows');
    await expect(
      await canvas.findByRole('heading', {
        name: 'No missed shows in this view',
      }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Queue · 0' }),
    ).toBeVisible();
  },
};

export const ThemesTab: Story = {
  render: renderTab('themes'),
  play: async ({ canvasElement }) => {
    const canvas = await expectQueue(canvasElement, 'Themes');
    await expect(
      await canvas.findByRole('heading', { name: 'Community themes' }),
    ).toBeVisible();
    await expect(await canvas.findByText('Revontulet')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Approve' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Reject' })).toBeVisible();
  },
};
