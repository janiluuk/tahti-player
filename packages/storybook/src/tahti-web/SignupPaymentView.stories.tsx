import type { Meta, StoryObj } from '@storybook/react-vite';
import { SignupPaymentView } from '@tahti-web/views/SignupPaymentView';
import { expect, userEvent, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { mockData } from './_lib/mock-data';

const meta: Meta<typeof SignupPaymentView> = {
  title: 'Tahti/Auth/SignupPaymentView',
  component: SignupPaymentView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '`/signup/payment`: buys or confirms the yearly Tahti ry membership.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/signup/payment'), withPageSurface()],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Signed out: asks the visitor to log in first. */
export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText('Sign in to purchase Tahti ry membership (€40/year).'),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Log in →' }),
    ).toHaveAttribute('href', '/login');
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

/** Not a member yet: checkout activates the membership. */
export const NotAMember: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: {
    mockData: mockData({
      membership: {
        status: 'NONE',
        isMember: false,
        memberNumber: null,
        memberSince: null,
      },
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pay = await canvas.findByRole('button', { name: 'Pay €40 / year' });
    await expect(
      canvas.getByText(
        'Complete the secure checkout to activate your membership.',
      ),
    ).toBeVisible();
    await userEvent.click(pay);
    await expect(
      await canvas.findByText('Membership activated — member #99.'),
    ).toBeVisible();
  },
};

/** Already a member. */
export const ActiveMember: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(/Membership is active — member #42/),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Account settings →' }),
    ).toBeVisible();
    await expect(canvas.queryByRole('button', { name: /Pay/ })).toBeNull();
  },
};
