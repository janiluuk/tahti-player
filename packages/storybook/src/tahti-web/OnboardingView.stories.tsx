import type { Meta, StoryObj } from '@storybook/react-vite';
import { OnboardingView } from '@tahti-web/views/OnboardingView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { expectVisible, selectTab } from './_lib/play';

const meta: Meta<typeof OnboardingView> = {
  title: 'Tahti/Settings/OnboardingView',
  component: OnboardingView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'First-run setup (`/onboarding`) for a new artist account: Profile (photo, solo or band, display name, bio), Location & domain (country, city, Tahti domain with a live availability check), Genres, Appearance (light or dark) and Defaults (show followers / following). Finish setup creates the channel if needed and saves; Skip for now just marks onboarding seen. Renders nothing when signed out.',
      },
    },
  },
  decorators: [
    withTahtiRouter('/onboarding'),
    withMockAuth(MOCK_USERS.listener),
    withPageSurface(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Profile: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Welcome to Tahti' }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole('textbox', { name: 'Display name' }),
    ).toHaveValue(MOCK_USERS.listener.displayName);
    await expect(canvas.getByRole('tab', { name: 'Profile' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    for (const tab of [
      'Location & domain',
      'Genres',
      'Appearance',
      'Defaults',
    ]) {
      await expect(canvas.getByRole('tab', { name: tab })).toBeVisible();
    }
    await expect(canvas.getByText('Solo artist')).toBeVisible();
    await expect(canvas.getByText('Band / collective')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Skip for now' }),
    ).toBeEnabled();
    await expect(
      canvas.getByRole('button', { name: 'Finish setup' }),
    ).toBeEnabled();
  },
};

export const DomainTaken: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('textbox', { name: 'Display name' });
    await selectTab(canvas, 'Location & domain');
    const domain = canvas.getByRole('textbox', { name: 'Your Tahti domain' });
    await expect(domain).toHaveValue('listener-liina');
    await expect(canvas.getByText('listener-liina.tahti.live')).toBeVisible();

    await userEvent.clear(domain);
    await userEvent.type(domain, 'taken');
    await waitFor(
      () => expect(canvas.getByText('Already taken')).toBeVisible(),
      { timeout: 3000 },
    );
    await expect(canvas.getByText('taken@tahti.live')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Finish setup' }),
    ).toBeDisabled();

    await userEvent.clear(domain);
    await userEvent.type(domain, 'liina-live');
    await expectVisible(
      await canvas.findByText('Available', {}, { timeout: 3000 }),
    );
    await expect(
      canvas.getByRole('button', { name: 'Finish setup' }),
    ).toBeEnabled();
  },
};
