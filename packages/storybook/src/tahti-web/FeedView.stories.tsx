import type { Meta, StoryObj } from '@storybook/react-vite';
import { FeedView } from '@tahti-web/views/FeedView';
import type { ReactNode } from 'react';
import { expect, waitFor, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof FeedView> = {
  title: 'Tahti/Social/FeedView',
  component: FeedView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Personal feed at `/feed`: posts, tracks, and releases from artists you follow. Phone stories lock the canvas to 390 px.',
      },
    },
  },
  decorators: [withTahtiRouter('/feed')],
};

export default meta;
type Story = StoryObj<typeof meta>;

function PhoneShell({ children }: { children: ReactNode }) {
  return <div className="w-[390px] max-w-full overflow-hidden">{children}</div>;
}

/** Populated mock feed at phone width. */
export const PopulatedPhone: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [
    withMockAuth(MOCK_USERS.listener),
    (Story) => (
      <PhoneShell>
        <Story />
      </PhoneShell>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByRole('heading', { name: 'Feed' })).toBeVisible(),
    );
    const box = canvasElement.getBoundingClientRect();
    await expect(box.width).toBeLessThanOrEqual(390);
  },
};

/** Signed-out empty gate at phone width. */
export const SignedOutPhone: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [
    withMockAuth(null),
    (Story) => (
      <PhoneShell>
        <Story />
      </PhoneShell>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heading = await canvas.findByText('Sign in to see your feed');
    await waitFor(() => expect(heading).toBeVisible());
    await expect(canvas.getByRole('button', { name: 'Log in' })).toBeVisible();
    const box = canvasElement.getBoundingClientRect();
    await expect(box.width).toBeLessThanOrEqual(390);
  },
};
