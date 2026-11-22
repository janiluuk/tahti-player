import type { Meta, StoryObj } from '@storybook/react-vite';
import { TransparencyMethodologyView } from '@tahti-web/views/TransparencyMethodologyView';
import { expect, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof TransparencyMethodologyView> = {
  title: 'Tahti/Transparency/TransparencyMethodologyView',
  component: TransparencyMethodologyView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Static explainer (`/transparency/methodology`) for how the transparency data is recorded: principles, revenue / cost / disbursement ledger categories, the surplus and engagement-unit grant formulas, the data pipeline and the public API. Open to anyone.',
      },
    },
  },
  decorators: [
    withTahtiRouter('/transparency/methodology'),
    withMockAuth(null),
  ],
  render: () => (
    <div className="p-6">
      <TransparencyMethodologyView />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Methodology: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', {
        level: 1,
        name: 'Transparency methodology',
      }),
    ).toBeVisible();
    for (const section of [
      'Principles',
      'Revenue categories',
      'Cost categories',
      'Disbursements',
      'Public API',
    ]) {
      await expect(
        canvas.getByRole('heading', { level: 2, name: section }),
      ).toBeVisible();
    }
    await expect(canvas.getByText('COST_INFRASTRUCTURE')).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Platform status' }),
    ).toHaveAttribute('href', '/status');
    await expect(
      canvas.getByRole('link', { name: 'Transparency' }),
    ).toHaveAttribute('href', '/transparency');
  },
};
