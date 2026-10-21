// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as studio from '../../../api/studio';
import type { StudioRelease } from '../../../api/studio-types';
import { ReleasePoweredByFooterToggle } from './ReleasePoweredByFooterToggle';

const release: StudioRelease = {
  id: 'r1',
  title: 'Night Drive',
  type: 'EP',
  state: 'PUBLISHED',
  releaseDate: '2026-01-01',
  smartLinkSlug: 'night-drive',
  showPoweredByFooter: false,
};

describe('ReleasePoweredByFooterToggle', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('saves the footer setting through the release PATCH', async () => {
    const patch = vi.spyOn(studio, 'patchStudioRelease').mockResolvedValue({
      ok: true,
      data: { ...release, showPoweredByFooter: true },
    });
    const onChange = vi.fn();
    render(
      <ReleasePoweredByFooterToggle release={release} onChange={onChange} />,
    );
    const toggle = screen.getByRole('switch', {
      name: 'Show "Powered by Tahti" footer',
    });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(patch).toHaveBeenCalledWith('r1', { showPoweredByFooter: true });
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('keeps the setting when the save fails', async () => {
    vi.spyOn(studio, 'patchStudioRelease').mockResolvedValue({
      ok: false,
      error: 'Patch failed',
    });
    const onChange = vi.fn();
    render(
      <ReleasePoweredByFooterToggle release={release} onChange={onChange} />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('switch'));
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders nothing when the API does not return the field', () => {
    const { container } = render(
      <ReleasePoweredByFooterToggle
        release={{ ...release, showPoweredByFooter: undefined }}
        onChange={vi.fn()}
      />,
    );
    expect(container.textContent).toBe('');
  });
});
