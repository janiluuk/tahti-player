import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { NewsletterSubscribeToggle } from './NewsletterSubscribeToggle';

describe('NewsletterSubscribeToggle signed out', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('opens an email form and sends the confirmation mail', async () => {
    useAuthStore.setState({ user: null });
    const subscribe = vi
      .spyOn(client, 'subscribeNewsletterByEmail')
      .mockResolvedValue({ ok: true, alreadySubscribed: false });
    render(
      <NewsletterSubscribeToggle
        artistUsername="selector"
        artistDisplayName="Selector"
        iconOnly
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Subscribe to Selector' }),
    );
    const submit = screen.getByRole('button', { name: 'Subscribe' });
    expect((submit as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByRole('textbox', { name: 'Email address' }), {
      target: { value: 'fan@example.com' },
    });
    await act(async () => {
      fireEvent.click(submit);
    });

    expect(subscribe).toHaveBeenCalledWith('fan@example.com', 'selector');
    expect(screen.getByText(/Check your email to confirm/)).toBeTruthy();
  });
});
