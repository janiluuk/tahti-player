import type { Meta, StoryObj } from '@storybook/react-vite';
import { WelcomeStrip } from '@tahti-web/components/listen-view/WelcomeStrip';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta = {
  title: 'Tahti/Listen/WelcomeStrip',
  component: WelcomeStrip,
  decorators: [withTahtiRouter('/')],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Front-page introduction for signed-out visitors: what Tahti is, with Join, For artists and What is Tahti links. The close button hides it for good on this browser.',
      },
    },
  },
  beforeEach: () => {
    localStorage.removeItem('tahti-web-welcome-dismissed');
  },
} satisfies Meta<typeof WelcomeStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { name: 'Independent music, live.' }),
      ).toBeVisible(),
    );
    await expect(
      canvas.getByRole('link', { name: /Join free/ }),
    ).toHaveAttribute('href', '/join');
  },
};

export const Dismiss: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Hide this introduction' }),
    );
    await expect(canvas.queryByTestId('listen-welcome')).toBeNull();
  },
};
