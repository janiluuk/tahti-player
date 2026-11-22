import type { Meta, StoryObj } from '@storybook/react-vite';
import { TransparencyResolutionsView } from '@tahti-web/views/TransparencyResolutionsView';
import { expect, userEvent, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const YEAR = new Date().getFullYear();

const meta: Meta<typeof TransparencyResolutionsView> = {
  title: 'Tahti/Transparency/TransparencyResolutionsView',
  component: TransparencyResolutionsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Published board resolutions (`/transparency/resolutions`), one year at a time (year chips for the last five years): each with its outcome, vote date, text and YES / NO / ABSTAIN counts. Open to anyone.',
      },
    },
  },
  decorators: [
    withTahtiRouter('/transparency/resolutions'),
    withMockAuth(null),
  ],
  render: () => (
    <div className="p-6">
      <TransparencyResolutionsView />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CurrentYear: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Board resolutions' }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole('heading', { name: `Resolutions ${YEAR}` }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', {
        name: 'Adopt updated grant disbursement schedule',
      }),
    ).toBeVisible();
    await expect(canvas.getByText('Passed')).toBeVisible();
    await expect(canvas.getByText('Failed')).toBeVisible();
    await expect(
      canvas.getByRole('radio', { name: String(YEAR) }),
    ).toBeChecked();
    await expect(
      canvas.getByRole('link', { name: 'Transparency' }),
    ).toHaveAttribute('href', '/transparency');
  },
};

export const PreviousYear: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('heading', { name: `Resolutions ${YEAR}` });
    await userEvent.click(
      canvas.getByRole('radio', { name: String(YEAR - 1) }),
    );
    await expect(
      await canvas.findByRole('heading', { name: `Resolutions ${YEAR - 1}` }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('radio', { name: String(YEAR - 1) }),
    ).toBeChecked();
  },
};
