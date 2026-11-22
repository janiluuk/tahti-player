import type { Meta, StoryObj } from '@storybook/react-vite';
import { TransparencyGrantYearView } from '@tahti-web/views/TransparencyGrantYearView';
import { expect, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof TransparencyGrantYearView> = {
  title: 'Tahti/Transparency/TransparencyGrantYearView',
  component: TransparencyGrantYearView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "One year's artist grant report (`/transparency/grants/$year`): total paid, number of grants, disbursement date and each grant by its published name, amount and state. Open to anyone.",
      },
    },
  },
  args: { year: 2025 },
  decorators: [
    withTahtiRouter('/transparency/grants/2025'),
    withMockAuth(null),
  ],
  render: (args) => (
    <div className="p-6">
      <TransparencyGrantYearView {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Report: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Grant report 2025' }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole('cell', { name: 'Artist grant A' }),
    ).toBeVisible();
    await expect(canvas.getByRole('cell', { name: '€1200.00' })).toBeVisible();
    await expect(
      canvas.getByRole('cell', { name: 'Artist grant B' }),
    ).toBeVisible();
    await expect(canvas.getByText('€2000.00')).toBeVisible();
    await expect(canvas.getByText('2025-03-01')).toBeVisible();
    await expect(
      canvas.getByRole('columnheader', { name: 'Published as' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Transparency' }),
    ).toHaveAttribute('href', '/transparency');
  },
};
