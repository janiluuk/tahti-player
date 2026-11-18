import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  GovernanceDocumentsView,
  GovernanceGuideView,
} from '@tahti-web/views/GovernanceGuideView';
import { expect, waitFor, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof GovernanceGuideView> = {
  title: 'Tahti/Governance/GovernanceGuideView',
  component: GovernanceGuideView,
  parameters: { layout: 'fullscreen' },
  decorators: [withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Guide: Story = {
  decorators: [withTahtiRouter('/governance/guide')],
  render: () => (
    <div className="p-6">
      <GovernanceGuideView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { level: 1, name: 'Governance guide' }),
      ).toBeVisible(),
    );
    await expect(
      canvas.getByRole('link', { name: 'Governance' }),
    ).toHaveAttribute('href', '/governance');
    await expect(canvas.getByText(/Co-op from the sidebar/)).toBeVisible();
  },
};

export const Documents: Story = {
  decorators: [withTahtiRouter('/governance/documents')],
  render: () => (
    <div className="p-6">
      <GovernanceDocumentsView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { level: 1, name: 'Documents' }),
      ).toBeVisible(),
    );
    const documents = within(canvas.getByTestId('governance-documents'));
    await expect(documents.getByText('Governance history')).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Governance' }),
    ).toBeVisible();
  },
};
