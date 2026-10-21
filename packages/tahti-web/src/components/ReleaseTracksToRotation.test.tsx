// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as studioExtras from '../api/studio-extras';
import type { StudioRelease } from '../api/studio-types';
import { ReleaseTracksToRotation } from './ReleaseTracksToRotation';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const release: StudioRelease = {
  id: 'r1',
  title: 'Aurora',
  type: 'EP',
  state: 'PUBLISHED',
  releaseDate: '2026-09-01',
  smartLinkSlug: 'aurora',
  tracks: [
    { id: 't1', position: 1, title: 'Dawn', status: 'READY', durationSec: 200 },
    { id: 't2', position: 2, title: 'Dusk', status: 'PROCESSING' },
  ],
};

describe('ReleaseTracksToRotation', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('only offers tracks whose audio is ready', () => {
    render(<ReleaseTracksToRotation releases={[release]} onAdded={vi.fn()} />);
    expect(
      screen.getByRole('button', {
        name: 'Add Dawn from Aurora to the rotation',
      }),
    ).toBeTruthy();
    expect(screen.queryByText('Dusk')).toBeNull();
  });

  it('adds a release track and hands back the new programme', async () => {
    const programme = {
      fallbackMode: 'ordered' as const,
      fallbackEnabled: true,
      fallbackAutoEnroll: false,
      announcementsEnabled: false,
      items: [],
    };
    const add = vi
      .spyOn(studioExtras, 'addReleaseTrackToProgramme')
      .mockResolvedValue({ ok: true, data: programme });
    const onAdded = vi.fn();
    render(<ReleaseTracksToRotation releases={[release]} onAdded={onAdded} />);
    const button = screen.getByRole('button', {
      name: 'Add Dawn from Aurora to the rotation',
    });
    fireEvent.click(button);
    await vi.waitFor(() => expect(onAdded).toHaveBeenCalledWith(programme));
    expect(add).toHaveBeenCalledWith({
      releaseTrackId: 't1',
      title: 'Aurora — Dawn',
      durationSec: 200,
    });
    expect(button.textContent).toContain('Added');
    expect(button).toHaveProperty('disabled', true);
  });

  it('renders nothing without releases', () => {
    const { container } = render(
      <ReleaseTracksToRotation releases={[]} onAdded={vi.fn()} />,
    );
    expect(container.innerHTML).toBe('');
  });
});
