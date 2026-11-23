import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { patchMeProfile, type ProfileFields } from '../api/studio-extras';
import { ProfileVisibilitySection } from './ProfileVisibilitySection';

vi.mock('../api/studio-extras', () => ({
  fetchMeProfile: async () => ({
    data: { id: 'u1', username: 'artist', socialLinks: {} },
    meta: { source: 'api' },
  }),
  patchMeProfile: vi.fn(),
}));

vi.mock('../views/settings/panels/TopListsToggle', () => ({
  TopListsToggle: () => null,
}));
vi.mock('../views/settings/panels/CommentSettingsToggles', () => ({
  CommentSettingsToggles: () => null,
}));

describe('ProfileVisibilitySection', () => {
  afterEach(() => cleanup());

  it('saves whether liked tracks show on the profile', async () => {
    vi.mocked(patchMeProfile).mockResolvedValue({
      ok: true,
      data: { showLikes: false } as ProfileFields,
    });
    render(<ProfileVisibilitySection />);
    const toggle = await screen.findByRole('switch', {
      name: 'Show tracks I like on my profile',
    });
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(toggle);
    expect(patchMeProfile).toHaveBeenCalledWith({ showLikes: false });
  });

  it('offers no switch that cannot be changed', async () => {
    render(<ProfileVisibilitySection />);
    await screen.findByRole('switch', {
      name: 'Show tracks I like on my profile',
    });
    expect(
      screen.queryByRole('switch', { name: 'Show favourites' }),
    ).toBeNull();
    expect(
      screen.queryByRole('switch', { name: 'Announce releases' }),
    ).toBeNull();
    expect(screen.queryByText(/Coming soon/i)).toBeNull();
  });
});
