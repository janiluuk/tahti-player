import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioHomeView } from '@tahti-web/views/studio/StudioHomeView';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof StudioHomeView> = {
  title: 'Tahti/Studio/StudioHomeView',
  component: StudioHomeView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio home: creation actions, next show, recent work and neutral navigation shortcuts. Renders against the mock API layer.',
      },
    },
  },
  decorators: [withTahtiRouter('/studio/'), withMockAuth(MOCK_USERS.artist)],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: /^Studio$/, level: 1 }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('link', { name: 'Upload', exact: true }),
    ).toHaveAttribute('href', '/studio/upload');
    await expect(
      canvas.getByRole('link', { name: 'Create release', exact: true }),
    ).toHaveAttribute('href', '/studio/releases?create=true');
    await expect(canvas.getAllByTestId('studio-action-tile')).toHaveLength(5);
  },
};
