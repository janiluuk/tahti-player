// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../api/artist-settings';
import { ChatAccessPanel } from './ChatAccessPanel';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

async function renderPanel(subscribersOnly: boolean) {
  vi.spyOn(api, 'fetchChatSettings').mockResolvedValue({
    data: { subscribersOnly },
    meta: { source: 'api' },
  } as never);
  await act(async () => {
    render(<ChatAccessPanel />);
  });
}

describe('ChatAccessPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('puts the switch before its label like the other chat switches', async () => {
    await renderPanel(false);
    const toggle = screen.getByRole('switch', {
      name: 'Only fan subscribers can post',
    });
    const label = screen.getByText('Only fan subscribers can post', {
      selector: 'span',
    });
    expect(
      toggle.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('saves the setting and confirms it', async () => {
    await renderPanel(false);
    const save = vi
      .spyOn(api, 'setChatSubscribersOnly')
      .mockResolvedValue({ ok: true, subscribersOnly: true } as never);
    await act(async () => {
      fireEvent.click(
        screen.getByRole('switch', { name: 'Only fan subscribers can post' }),
      );
    });
    expect(save).toHaveBeenCalledWith(true);
    expect(toast.success).toHaveBeenCalledWith(
      'Only fan subscribers can post in chat now.',
    );
  });
});
