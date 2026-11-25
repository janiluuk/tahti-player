import { act, fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RssFeedButton } from './RssFeedButton';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

function stubClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
}

describe('RssFeedButton', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('copies the feed URL', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    render(
      <RssFeedButton
        href="https://x/feed.xml"
        label="RSS feed of Night Drive"
      />,
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: 'Copy the RSS feed of Night Drive',
        }),
      );
    });
    expect(writeText).toHaveBeenCalledWith('https://x/feed.xml');
    expect(toast.success).toHaveBeenCalled();
  });

  it('says so when the clipboard is unavailable', async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    render(
      <RssFeedButton
        href="https://x/feed.xml"
        label="RSS feed of Night Drive"
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(toast.error).toHaveBeenCalled();
  });
});
