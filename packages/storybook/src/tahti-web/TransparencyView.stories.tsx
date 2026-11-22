import type { Meta, StoryObj } from '@storybook/react-vite';
import { TransparencyView } from '@tahti-web/views/TransparencyView';
import { expect, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

// The mock YTD and grant reports are stamped with the current year.
const YEAR = new Date().getFullYear();

const meta: Meta<typeof TransparencyView> = {
  title: 'Tahti/Transparency/TransparencyView',
  component: TransparencyView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "Public transparency dashboard (`/transparency`): Tahti ry's year-to-date surplus and spending by category, this year's grant disbursements with links to earlier years, and the latest ledger entries. Links to the methodology, closed governance decisions and board resolutions. Open to anyone.",
      },
    },
  },
  decorators: [withTahtiRouter('/transparency'), withMockAuth(null)],
  render: () => (
    <div className="p-6">
      <TransparencyView />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Dashboard: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Transparency' }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole('heading', { name: `YTD ${YEAR}` }),
    ).toBeVisible();
    await expect(canvas.getByText('Running surplus')).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: `Grants ${YEAR}` }),
    ).toBeVisible();
    await expect(canvas.getByText('Artist grant A')).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: `Grants ${YEAR - 1}` }),
    ).toHaveAttribute('href', `/transparency/grants/${YEAR - 1}`);
    await expect(
      canvas.getByRole('heading', { name: 'Latest ledger' }),
    ).toBeVisible();
    await expect(canvas.getByRole('cell', { name: 'Hosting' })).toBeVisible();
    for (const [name, href] of [
      [
        'How this data is recorded and published →',
        '/transparency/methodology',
      ],
      ['Closed governance decisions →', '/governance/history'],
      ['Board resolutions →', '/transparency/resolutions'],
    ]) {
      await expect(canvas.getByRole('link', { name })).toHaveAttribute(
        'href',
        href,
      );
    }
  },
};
