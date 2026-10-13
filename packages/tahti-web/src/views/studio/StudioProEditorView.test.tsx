// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../../stores/authStore';
import { StudioProEditorView } from './StudioProEditorView';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  Toaster: () => null,
}));

vi.mock('../../api/studio', async () => {
  const actual =
    await vi.importActual<typeof import('../../api/studio')>(
      '../../api/studio',
    );
  return {
    ...actual,
    fetchEditorStreamBlob: vi.fn(
      async () => new Blob([new Uint8Array(64)], { type: 'audio/wav' }),
    ),
    fetchEditorProjects: vi.fn(async () => ({
      data: [],
      meta: { source: 'mock' as const, reason: 'test' },
    })),
    createEditorProject: vi.fn(async () => ({
      ok: true as const,
      data: {
        id: 'proj-test-1',
        title: 'Test session',
        soundId: 'arch-mock-1',
        updatedAt: new Date().toISOString(),
      },
    })),
    fetchEditorProject: vi.fn(async () => ({
      data: {
        id: 'proj-test-1',
        title: 'Test session',
        soundId: 'arch-mock-1',
        updatedAt: new Date().toISOString(),
        timeline: { version: 1 as const, durationSec: 1, tracks: [] },
      },
      meta: { source: 'mock' as const, reason: 'test' },
    })),
    updateEditorProject: vi.fn(async () => ({
      ok: true as const,
      data: {
        id: 'proj-test-1',
        title: 'Test session',
        soundId: 'arch-mock-1',
        updatedAt: new Date().toISOString(),
      },
    })),
  };
});

vi.mock('@tahti-player/audio-editor', async () => {
  const actual = await vi.importActual<
    typeof import('@tahti-player/audio-editor')
  >('@tahti-player/audio-editor');
  return {
    ...actual,
    loadBlobOntoNewTrack: vi.fn(async () => 'track-mock'),
    computePeaks: vi.fn(async () => ({
      peaks: new Float32Array(8),
      duration: 1,
    })),
    MultitrackEditor: ({
      onBounce,
    }: {
      onBounce?: (blob: Blob) => void | Promise<void>;
    }) => (
      <div data-testid="multitrack-editor">
        <button type="button" onClick={() => void onBounce?.(new Blob())}>
          Bounce
        </button>
      </div>
    ),
  };
});

vi.mock('@tahti-player/visualizer', () => ({
  VisualizerHost: () => <div data-testid="viz-host" />,
}));

vi.mock('@tahti-player/audio-core', () => ({
  preferInternalEngine: vi.fn(),
}));

const SOUND_ID = 'arch-mock-1';

function createRouterFor() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const editorRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/editor/$id',
    component: function EditorRoute() {
      const { id } = editorRoute.useParams();
      return <StudioProEditorView soundId={id} />;
    },
  });
  const soundsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/sounds',
    component: () => <p>Sounds list</p>,
  });
  return createRouter({
    routeTree: rootRoute.addChildren([editorRoute, soundsRoute]),
    history: createMemoryHistory({
      initialEntries: [`/studio/editor/${SOUND_ID}`],
    }),
  });
}

async function renderEditor() {
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
  });
  const router = createRouterFor();
  render(<RouterProvider router={router} />);
  await screen.findByRole('button', { name: /save draft/i });
  return router;
}

function editDraft() {
  const expand = screen.queryByRole('button', { name: 'Expand mastering' });
  if (expand) {
    fireEvent.click(expand);
  }
  fireEvent.click(screen.getByRole('button', { name: /^normaliz/i }));
}

const leaveTo = (router: ReturnType<typeof createRouterFor>) =>
  act(async () => {
    void router.navigate({ to: '/studio/sounds' });
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

describe('StudioProEditorView', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(
      () => undefined,
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
  });

  it('renders the editor, export and mastering sections for a track', async () => {
    await renderEditor();
    expect(
      screen.getByRole('button', { name: /render version/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /(expand|minimize) mastering/i }),
    ).toBeTruthy();
    expect(screen.queryByText('Could not load the editor')).toBeNull();
  });

  it('leaves freely when nothing was edited', async () => {
    const router = await renderEditor();
    await leaveTo(router);
    expect(await screen.findByText('Sounds list')).toBeTruthy();
    expect(screen.queryByText('Leave without saving?')).toBeNull();
  });

  it('asks before leaving with unsaved edits, and stops asking once saved', async () => {
    const router = await renderEditor();
    editDraft();

    await leaveTo(router);
    expect(
      await screen.findByText('Leave without saving?', undefined, {
        timeout: 15000,
      }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Stay' }));
    expect(screen.queryByText('Sounds list')).toBeNull();

    const saveButton = await screen.findByRole(
      'button',
      { name: /save draft/i },
      { timeout: 15000 },
    );
    fireEvent.click(saveButton);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Draft saved.'),
    );
    await leaveTo(router);
    expect(await screen.findByText('Sounds list')).toBeTruthy();
  });

  it('leaves without saving when confirmed', async () => {
    const router = await renderEditor();
    editDraft();

    await leaveTo(router);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Leave without saving' }),
    );
    expect(await screen.findByText('Sounds list')).toBeTruthy();
  });

  it('undoes and redoes an edit from the toolbar and the keyboard', async () => {
    await renderEditor();
    expect(
      (screen.getByRole('button', { name: 'Undo' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    const expand = screen.queryByRole('button', { name: 'Expand mastering' });
    if (expand) {
      fireEvent.click(expand);
    }
    const normalizeLabel = () =>
      screen.getByRole('button', { name: /^normaliz/i }).textContent;
    const before = normalizeLabel();

    editDraft();
    const after = normalizeLabel();
    expect(after).not.toBe(before);

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(normalizeLabel()).toBe(before);

    fireEvent.keyDown(screen.getByRole('button', { name: 'Redo' }), {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
    });
    expect(normalizeLabel()).toBe(after);
  });

  it('marks a selection from the keyboard and announces it', async () => {
    await renderEditor();
    const waveform = screen.getByRole('application');
    const announcement = screen.getByTestId('selection-announcement');
    expect(announcement.textContent).toBe('No selection');

    fireEvent.keyDown(waveform, { key: 'End' });
    fireEvent.keyDown(waveform, { key: ']' });
    expect(announcement.textContent).toMatch(/^Selection 0:00\.000 to /);

    fireEvent.keyDown(waveform, { key: 'Escape' });
    expect(announcement.textContent).toBe('No selection');
  });

  it('sets the selection edges from the toolbar too', async () => {
    await renderEditor();
    const waveform = screen.getByRole('application');
    const announcement = screen.getByTestId('selection-announcement');

    fireEvent.keyDown(waveform, { key: 'End' });
    fireEvent.click(
      screen.getByRole('button', { name: 'End selection at playhead' }),
    );
    expect(announcement.textContent).toMatch(/^Selection 0:00\.000 to /);
    expect(
      screen
        .getByRole('button', { name: 'Start selection at playhead' })
        .getAttribute('aria-keyshortcuts'),
    ).toBe('[');
  });

  it('switches to multitrack mode and hides trim export chrome', async () => {
    await renderEditor();
    fireEvent.click(screen.getByRole('radio', { name: /multitrack \+ viz/i }));
    await waitFor(() =>
      expect(screen.getByText(/multitrack session/i)).toBeTruthy(),
    );
    expect(
      screen.queryByRole('button', { name: /render version/i }),
    ).toBeNull();
    expect(screen.getByRole('button', { name: /save session/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^bounce$/i })).toBeTruthy();
  });
});
