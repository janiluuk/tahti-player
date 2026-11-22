import type { Meta, StoryObj } from '@storybook/react-vite';
import { PublicGovernanceHistoryView } from '@tahti-web/views/PublicGovernanceHistoryView';
import { expect, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof PublicGovernanceHistoryView> = {
  title: 'Tahti/Governance/PublicGovernanceHistoryView',
  component: PublicGovernanceHistoryView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Public governance history (`/governance/history`): every closed co-op motion with its proposer, close date, description and final YES / NO / ABSTAIN tally. Open to anyone, no sign-in needed.',
      },
    },
  },
  decorators: [withTahtiRouter('/governance/history'), withMockAuth(null)],
  render: () => (
    <div className="p-6">
      <PublicGovernanceHistoryView />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ClosedMotions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Governance history' }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole('heading', { name: 'Confirm annual report' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Require overnight radio blackout' }),
    ).toBeVisible();
    await expect(canvas.getByText('Closed motions')).toBeVisible();
    await expect(canvas.getByText('YES 10 · NO 1 · ABSTAIN 1')).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: '← Governance' }),
    ).toHaveAttribute('href', '/governance');
  },
};
