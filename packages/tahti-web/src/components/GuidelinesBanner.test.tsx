// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useNotificationInboxStore } from '../stores/notificationInboxStore';
import { GuidelinesBanner } from './GuidelinesBanner';

describe('GuidelinesBanner', () => {
  afterEach(() => {
    cleanup();
    useNotificationInboxStore.setState({ items: [] });
  });

  it('draws the title in the theme foreground, not the info-blue link colour', () => {
    useNotificationInboxStore.setState({
      items: [
        {
          id: 'n1',
          type: 'GUIDELINES',
          actor: null,
          title: 'Community guidelines updated',
          body: 'Please read the new rules.',
          url: null,
          readAt: null,
          sticky: true,
          createdAt: '2026-11-01T00:00:00.000Z',
        },
      ],
    });
    render(<GuidelinesBanner />);
    const banner = screen.getByTestId('guidelines-banner');
    expect(screen.getByText('Community guidelines updated')).toBeVisible();
    expect(banner.className).toContain('text-foreground');
    expect(banner.className).not.toMatch(/accent-blue/);
  });
});
