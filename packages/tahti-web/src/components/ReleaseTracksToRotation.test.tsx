// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
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

  it('undo takes the added track back out of the rotation', async () => {
    const programme = {
      fallbackMode: 'ordered' as const,
      fallbackEnabled: true,
      fallbackAutoEnroll: false,
      announcementsEnabled: false,
      items: [
        {
          id: 's0',
          title: 'Older',
          status: 'READY',
          durationSec: 100,
          isFallback: true,
          fallbackOrder: 0,
        },
        {
          id: 's1',
          title: 'Aurora — Dawn',
          status: 'READY',
          durationSec: 200,
          isFallback: true,
          fallbackOrder: 1,
        },
      ],
      library: [
        {
          releaseTrackId: 't1',
          releaseId: 'r1',
          releaseTitle: 'Aurora',
          trackTitle: 'Dawn',
          durationSec: 200,
          soundId: 's1',
        },
      ],
    };
    vi.spyOn(studioExtras, 'addReleaseTrackToProgramme').mockResolvedValue({
      ok: true,
      data: programme,
    });
    const undone = { ...programme, items: [programme.items[0]] };
    const patch = vi
      .spyOn(studioExtras, 'patchProgramme')
      .mockResolvedValue({ ok: true, data: undone });
    const onAdded = vi.fn();
    render(<ReleaseTracksToRotation releases={[release]} onAdded={onAdded} />);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Add Dawn from Aurora to the rotation',
      }),
    );
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalled());
    const options = vi.mocked(toast.success).mock.calls.at(-1)?.[1] as {
      action: { label: string; onClick: () => void };
    };
    options.action.onClick();
    await vi.waitFor(() => expect(onAdded).toHaveBeenLastCalledWith(undone));
    expect(patch).toHaveBeenCalledWith({
      items: [
        { soundId: 's0', isFallback: true, fallbackOrder: 0 },
        { soundId: 's1', isFallback: false },
      ],
    });
    expect(
      screen
        .getByRole('button', { name: 'Add Dawn from Aurora to the rotation' })
        .hasAttribute('disabled'),
    ).toBe(false);
  });
});
