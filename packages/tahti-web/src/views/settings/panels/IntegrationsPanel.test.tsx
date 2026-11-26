// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../api/integrations';
import { IntegrationsPanel } from './IntegrationsPanel';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('IntegrationsPanel in the web app', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('keeps listener controls usable when status cannot be loaded', async () => {
    const fetch = vi
      .spyOn(api, 'fetchMeIntegrations')
      .mockRejectedValue(new Error('Service unavailable'));
    render(<IntegrationsPanel />);

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.queryByText("Couldn't load integrations")).toBeNull();
    expect(screen.queryByText('Desktop app')).toBeNull();
    expect(
      screen.getByRole('switch', { name: 'Last.fm scrobbling' }),
    ).toBeEnabled();
  });
});
