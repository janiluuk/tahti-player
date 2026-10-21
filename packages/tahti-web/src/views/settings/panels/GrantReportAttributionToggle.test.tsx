// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ProfileFields } from '../../../api/studio-extras';
import {
  GRANT_REPORT_ATTRIBUTION_LABEL,
  GrantReportAttributionToggle,
} from './GrantReportAttributionToggle';

const patchMeProfile = vi.fn();

vi.mock('../../../api/studio-extras', () => ({
  patchMeProfile: (...args: unknown[]) => patchMeProfile(...args),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function profile(publicAttribution?: boolean): ProfileFields {
  return {
    id: 'u1',
    username: 'artist',
    displayName: 'Artist',
    bio: null,
    tipJarUrl: null,
    pronouns: null,
    chatEnabled: true,
    freeSubscriptionsEnabled: false,
    ...(publicAttribution === undefined ? {} : { publicAttribution }),
  };
}

function toggle() {
  return screen.getByRole('switch', { name: GRANT_REPORT_ATTRIBUTION_LABEL });
}

describe('GrantReportAttributionToggle', () => {
  afterEach(() => {
    cleanup();
    patchMeProfile.mockReset();
  });

  it('reflects the saved setting and opts out of attribution on toggle', async () => {
    const saved = profile(false);
    patchMeProfile.mockResolvedValue({ ok: true, data: saved });
    const onSaved = vi.fn();
    render(
      <GrantReportAttributionToggle
        profile={profile(true)}
        onSaved={onSaved}
      />,
    );
    expect(toggle().getAttribute('aria-checked')).toBe('true');

    await act(async () => {
      fireEvent.click(toggle());
    });

    expect(patchMeProfile).toHaveBeenCalledWith({ publicAttribution: false });
    expect(toggle().getAttribute('aria-checked')).toBe('false');
    expect(onSaved).toHaveBeenCalledWith(saved);
  });

  it('reverts when the save fails', async () => {
    patchMeProfile.mockResolvedValue({ ok: false, error: 'Nope' });
    const onSaved = vi.fn();
    render(
      <GrantReportAttributionToggle
        profile={profile(false)}
        onSaved={onSaved}
      />,
    );
    expect(toggle().getAttribute('aria-checked')).toBe('false');

    await act(async () => {
      fireEvent.click(toggle());
    });

    expect(patchMeProfile).toHaveBeenCalledWith({ publicAttribution: true });
    expect(toggle().getAttribute('aria-checked')).toBe('false');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('stays hidden when the profile has no attribution flag', () => {
    render(
      <GrantReportAttributionToggle profile={profile()} onSaved={vi.fn()} />,
    );
    expect(
      screen.queryByRole('switch', { name: GRANT_REPORT_ATTRIBUTION_LABEL }),
    ).toBeNull();
  });
});
