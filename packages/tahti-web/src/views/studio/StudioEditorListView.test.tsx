// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
} from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as studio from '../../api/studio';
import { useAuthStore } from '../../stores/authStore';
import { renderWithRouter } from '../../test/renderWithRouter';
import { StudioEditorListView } from './StudioEditorListView';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('StudioEditorListView', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        email: 'artist@tahti.live',
        username: 'artist',
        displayName: 'An Artist',
        role: 'ARTIST',
        isBoard: false,
        isMember: true,
        channel: { slug: 'artist', state: 'OFFLINE' },
      },
      hydrated: true,
      loading: false,
      profileLoaded: true,
    });
    vi.spyOn(studio, 'fetchStudioSounds').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
  });

  it('says the projects failed to load instead of "No editor projects yet"', async () => {
    const fetch = vi.spyOn(studio, 'fetchEditorProjects').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderWithRouter(<StudioEditorListView />);
    expect(
      await screen.findByText('Could not load your editor projects'),
    ).toBeTruthy();
    expect(screen.queryByText('No editor projects yet.')).toBeNull();

    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No editor projects yet.')).toBeTruthy();
  });

  it('offers Undo after creating a session, which deletes the project', async () => {
    vi.spyOn(studio, 'fetchEditorProjects').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    vi.spyOn(studio, 'createEditorProject').mockResolvedValue({
      ok: true,
      data: {
        id: 'proj-1',
        title: 'Late set',
        soundId: null,
        updatedAt: '2026-10-27T00:00:00.000Z',
      },
    });
    const remove = vi
      .spyOn(studio, 'deleteEditorProject')
      .mockResolvedValue({ ok: true });
    await renderWithRouter(<StudioEditorListView />);

    await act(async () =>
      fireEvent.click(
        (await screen.findAllByRole('button', { name: /New session/ }))[0]!,
      ),
    );
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Create' })),
    );

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    const [message, options] = vi.mocked(toast.success).mock.calls.at(-1) as [
      string,
      { action: { label: string; onClick: () => void } },
    ];
    expect(message).toBe('Created Late set.');
    await act(async () => options.action.onClick());

    await waitFor(() => expect(remove).toHaveBeenCalledWith('proj-1'));
    expect(toast.success).toHaveBeenLastCalledWith('Removed Late set.');
  });

  it('shows the last loaded projects at once and keeps them when a refresh fails', async () => {
    const project = (id: string, title: string) => ({
      id,
      title,
      soundId: null,
      updatedAt: '2026-10-27T00:00:00.000Z',
    });
    const fetch = vi.spyOn(studio, 'fetchEditorProjects').mockResolvedValue({
      data: [project('p1', 'Late set')],
      meta: { source: 'api' },
    });
    const first = await renderWithRouter(<StudioEditorListView />);
    expect(await screen.findByText('Late set')).toBeTruthy();
    first.unmount();

    let resolve: (
      value: Awaited<ReturnType<typeof studio.fetchEditorProjects>>,
    ) => void = () => undefined;
    fetch.mockReturnValue(new Promise((r) => (resolve = r)));
    const second = await renderWithRouter(<StudioEditorListView />);
    expect(screen.getByText('Late set')).toBeTruthy();
    expect(screen.queryByText('Loading…')).toBeNull();
    await act(async () =>
      resolve({
        data: [project('p1', 'Late set'), project('p2', 'Morning take')],
        meta: { source: 'api' },
      }),
    );
    expect(screen.getByText('Morning take')).toBeTruthy();
    second.unmount();

    fetch.mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderWithRouter(<StudioEditorListView />);
    expect(
      await screen.findByText('Could not refresh your editor projects'),
    ).toBeTruthy();
    expect(screen.getByText('Morning take')).toBeTruthy();
  });
});
