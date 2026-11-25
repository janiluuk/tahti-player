import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  GuidelinesBanner,
  STICKY_NOTICE_KEY,
} from '@tahti-web/components/GuidelinesBanner';
import { useNotificationInboxStore } from '@tahti-web/stores/notificationInboxStore';
import { useEffect, type ReactNode } from 'react';
import { expect, waitFor, within } from 'storybook/test';

import { toast, Toaster } from '@tahti-player/ui';

import { MOCK_USERS, withMockAuth } from './_lib/decorators';

const NOTICE = {
  id: 'story-guidelines',
  type: 'GUIDELINES',
  actor: null,
  title: 'Community guidelines updated',
  body: 'Acknowledge once you have read the summary.',
  url: 'https://tahti.live/guidelines',
  readAt: null,
  sticky: true,
  createdAt: '2026-11-01T00:00:00.000Z',
};

/**
 * Listen's sticky guidelines notice. A notice cached for this account from
 * an earlier visit shows inline from the first paint; one that only arrives
 * when the inbox loads shows as a sticky toast instead of pushing down the
 * Listen sections that are already on screen.
 */
const meta: Meta<typeof GuidelinesBanner> = {
  title: 'Tahti/Listen/GuidelinesBanner',
  component: GuidelinesBanner,
  parameters: { layout: 'padded' },
  decorators: [withMockAuth(MOCK_USERS.listener)],
};

export default meta;
type Story = StoryObj<typeof meta>;

function ResetInbox({ children }: { children: ReactNode }) {
  useEffect(
    () => () => {
      useNotificationInboxStore.setState({ items: [], loaded: false });
      localStorage.removeItem(STICKY_NOTICE_KEY);
      toast.dismiss(NOTICE.id);
    },
    [],
  );
  return <>{children}</>;
}

export const RememberedAtFirstPaint: Story = {
  render: () => {
    useNotificationInboxStore.setState({ items: [], loaded: false });
    localStorage.setItem(
      STICKY_NOTICE_KEY,
      JSON.stringify({
        userId: MOCK_USERS.listener.id,
        id: NOTICE.id,
        title: NOTICE.title,
        body: NOTICE.body,
        url: NOTICE.url,
      }),
    );
    return (
      <ResetInbox>
        <GuidelinesBanner />
        <p className="text-foreground-secondary text-sm">Listen sections</p>
      </ResetInbox>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('guidelines-banner')).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Read guidelines' }),
    ).toBeVisible();
  },
};

export const ArrivesAfterFirstPaint: Story = {
  render: () => {
    useNotificationInboxStore.setState({ items: [], loaded: false });
    localStorage.removeItem(STICKY_NOTICE_KEY);
    return (
      <ResetInbox>
        <Toaster />
        <GuidelinesBanner />
        <p
          className="text-foreground-secondary text-sm"
          data-testid="listen-sections-stand-in"
        >
          Listen sections
        </p>
      </ResetInbox>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sections = canvas.getByTestId('listen-sections-stand-in');
    const topBefore = sections.getBoundingClientRect().top;

    await step('the inbox loads with a sticky notice', async () => {
      useNotificationInboxStore.setState({ items: [NOTICE], loaded: true });
    });

    await step('it shows as a toast and the content stays put', async () => {
      const page = within(canvasElement.ownerDocument.body);
      await waitFor(() => expect(page.getByText(NOTICE.title)).toBeVisible());
      await expect(
        page.getByRole('button', { name: 'Acknowledge' }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'Read guidelines' }),
      ).toHaveAttribute('href', NOTICE.url);
      await expect(canvas.queryByTestId('guidelines-banner')).toBeNull();
      await expect(sections.getBoundingClientRect().top).toBe(topBefore);
    });
  },
};
