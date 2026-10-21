import { act, fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { patchStudioRelease } from '../../api/studio';
import type { StudioRelease } from '../../api/studio-types';
import { ReleasePinButton } from './ReleasePinButton';

vi.mock('../../api/studio', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/studio')>()),
  patchStudioRelease: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const base: StudioRelease = {
  id: 'r1',
  title: 'Nights',
  type: 'EP',
  state: 'PUBLISHED',
  releaseDate: '2026-01-01',
  smartLinkSlug: 'nights',
};

describe('ReleasePinButton', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('pins a published release and reports the new pin time', async () => {
    vi.mocked(patchStudioRelease).mockResolvedValue({
      ok: true,
      data: { ...base, pinnedAt: '2026-10-03T10:00:00.000Z' },
    });
    const onChange = vi.fn();
    render(<ReleasePinButton release={base} onChange={onChange} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Pin to profile' }));
    });
    expect(patchStudioRelease).toHaveBeenCalledWith('r1', { pinned: true });
    expect(onChange).toHaveBeenCalledWith('2026-10-03T10:00:00.000Z');
  });

  it('unpins a pinned release', async () => {
    vi.mocked(patchStudioRelease).mockResolvedValue({
      ok: true,
      data: { ...base, pinnedAt: null },
    });
    const onChange = vi.fn();
    render(
      <ReleasePinButton
        release={{ ...base, pinnedAt: '2026-09-01T00:00:00.000Z' }}
        onChange={onChange}
      />,
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Unpin from profile' }),
      );
    });
    expect(patchStudioRelease).toHaveBeenCalledWith('r1', { pinned: false });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('keeps the pin state and shows the error when saving fails', async () => {
    vi.mocked(patchStudioRelease).mockResolvedValue({
      ok: false,
      error: 'Release not found',
    });
    const onChange = vi.fn();
    render(<ReleasePinButton release={base} onChange={onChange} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Pin to profile' }));
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Release not found');
  });

  it('is hidden for an unpinned draft, which never reaches the profile', () => {
    render(
      <ReleasePinButton
        release={{ ...base, state: 'DRAFT' }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });
});
