// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../api/release-track-versions';
import type { StudioRelease } from '../../../api/studio-types';
import { ReleaseTrackVersionsPanel } from './ReleaseTrackVersionsPanel';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const version = (
  n: number,
  overrides: Partial<api.ReleaseTrackVersion> = {},
): api.ReleaseTrackVersion => ({
  id: `v${n}`,
  versionNumber: n,
  versionLabel: n === 1 ? 'Original' : 'Remaster',
  status: 'READY',
  isActive: n === 1,
  durationSec: 200,
  createdAt: '2026-09-01T12:00:00.000Z',
  ...overrides,
});

const TRACKS = [{ id: 't1', position: 1, title: 'Night Drive' }] as NonNullable<
  StudioRelease['tracks']
>;

describe('ReleaseTrackVersionsPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('makes a ready version active', async () => {
    vi.spyOn(api, 'fetchReleaseTrackVersions').mockResolvedValue({
      data: [
        version(1),
        version(2),
        version(3, { status: 'PROCESSING', isActive: false }),
      ],
      meta: { source: 'api' },
    });
    const activate = vi
      .spyOn(api, 'activateReleaseTrackVersion')
      .mockResolvedValue({
        ok: true,
        data: [
          version(1, { isActive: false }),
          version(2, { isActive: true }),
          version(3, { status: 'PROCESSING', isActive: false }),
        ],
      });
    await act(async () => {
      render(<ReleaseTrackVersionsPanel releaseId="r1" tracks={TRACKS} />);
    });
    const list = screen.getByRole('list', { name: 'Night Drive versions' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows[0]!.textContent).toContain('Active');
    expect(rows[2]!.textContent).toContain('Processing');
    await act(async () => {
      fireEvent.click(
        within(rows[1]!).getByRole('button', { name: 'Make active' }),
      );
    });
    expect(activate).toHaveBeenCalledWith('r1', 't1', 'v2');
    expect(within(list).getAllByRole('listitem')[1]!.textContent).toContain(
      'Active',
    );
  });

  it('asks for tracks first on an empty release', async () => {
    await act(async () => {
      render(<ReleaseTrackVersionsPanel releaseId="r1" tracks={[]} />);
    });
    expect(screen.getByText('No tracks on this release yet')).toBeTruthy();
  });
  it('uploads a new version with a label', async () => {
    vi.spyOn(api, 'fetchReleaseTrackVersions').mockResolvedValue({
      data: [version(1)],
      meta: { source: 'api' },
    });
    const upload = vi
      .spyOn(api, 'uploadReleaseTrackVersion')
      .mockResolvedValue({
        ok: true,
        data: version(2, { status: 'PENDING', isActive: false }),
      });
    const { container } = await act(async () =>
      render(<ReleaseTrackVersionsPanel releaseId="r1" tracks={TRACKS} />),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add a version' }));
    fireEvent.change(screen.getByLabelText('Version label'), {
      target: { value: 'Remaster' },
    });
    const file = new File(['x'], 'master.wav', { type: 'audio/wav' });
    const input = container.querySelector('input[type="file"]')!;
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });
    expect(upload).toHaveBeenCalledWith('r1', 't1', file, 'Remaster');
    const list = screen.getByRole('list', { name: 'Night Drive versions' });
    expect(within(list).getAllByRole('listitem')[1]!.textContent).toContain(
      'Processing',
    );
    expect(screen.getByRole('button', { name: 'Add a version' })).toBeTruthy();
  });
});
