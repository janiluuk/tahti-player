// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ImageCropDialogProps } from '@tahti-player/ui';

import type { ArtistEvent } from '../api/events';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { renderWithRouter } from '../test/renderWithRouter';
import { EventPostView } from './EventPostView';

const createEvent = vi.fn();
const uploadUserMediaFile = vi.fn();

vi.mock('@tahti-player/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tahti-player/ui')>()),
  ImageCropDialog: ({
    file,
    aspect,
    outputWidth,
    onCrop,
    onCancel,
  }: ImageCropDialogProps) => (
    <div
      data-testid="crop-dialog"
      data-file={file?.name}
      data-aspect={aspect}
      data-width={outputWidth}
    >
      <button
        type="button"
        onClick={() => onCrop(new Blob(['png'], { type: 'image/jpeg' }))}
      >
        Crop it
      </button>
      <button type="button" onClick={onCancel}>
        Drop it
      </button>
    </div>
  ),
}));

vi.mock('../api/events', () => ({
  fetchMyEvents: async () => ({ data: [], meta: { source: 'api' as const } }),
  createEvent: (...args: unknown[]) => createEvent(...args),
  updateEvent: vi.fn(),
}));

vi.mock('../api/user-media', () => ({
  uploadUserMediaFile: (...args: unknown[]) => uploadUserMediaFile(...args),
}));

vi.mock('../api/client', () => ({
  fetchVenues: async () => ({ data: [], meta: { source: 'api' as const } }),
}));

const BANNER_URL = 'https://media.example/media/listener/banner.jpg';

function created(input: Partial<ArtistEvent>): ArtistEvent {
  return {
    id: 'evt-new',
    title: 'Garage jam',
    description: '',
    place: 'Garage',
    location: 'Tampere',
    eventUrl: null,
    ticketUrl: null,
    imageUrl: null,
    startAt: '2030-06-21T17:00:00.000Z',
    endAt: null,
    timezone: null,
    venue: null,
    visibility: 'PUBLIC',
    status: 'PUBLISHED',
    publishedAt: null,
    participants: [],
    ...input,
  };
}

function signInListener() {
  useAuthStore.setState({
    user: {
      id: 'u1',
      email: 'listener@tahti.live',
      username: 'listener',
      displayName: 'Listener',
      role: 'LISTENER',
      isBoard: false,
      isMember: false,
    },
    hydrated: true,
  });
}

const renderPost = () =>
  renderWithRouter(<EventPostView />, {
    paths: ['/events/$eventId', '/discover', '/venues/register'],
  });

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function pickBanner(container: HTMLElement) {
  const input = container.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  const file = new File(['raw'], 'poster.png', { type: 'image/png' });
  await act(async () => {
    fireEvent.change(input, { target: { files: [file] } });
  });
}

describe('EventPostView', () => {
  beforeEach(() => {
    uploadUserMediaFile.mockResolvedValue({
      ok: true,
      data: { id: 'm1', url: BANNER_URL },
    });
    createEvent.mockImplementation(async (input: Partial<ArtistEvent>) => ({
      ok: true,
      data: created(input),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, hydrated: true });
    useAuthModalStore.setState({ isOpen: false });
  });

  it('asks a signed-out visitor to sign in', async () => {
    useAuthStore.setState({ user: null, hydrated: true });
    await renderPost();
    expect(screen.queryByTestId('event-post-page')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(useAuthModalStore.getState().isOpen).toBe(true);
  });

  it('gives a listener the form without the artist-only drafts and fans-only options', async () => {
    signInListener();
    await renderPost();
    await settle();
    expect(screen.getByTestId('event-post-page')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save as draft' })).toBeNull();
    expect(screen.queryByRole('switch', { name: /Fans only/ })).toBeNull();
  });

  it('crops a picked banner, uploads it and posts the event with its URL', async () => {
    signInListener();
    const { container, router } = await renderPost();
    await settle();

    await pickBanner(container);
    const dialog = screen.getByTestId('crop-dialog');
    expect(dialog.dataset.file).toBe('poster.png');
    expect(dialog.dataset.aspect).toBe('3');
    expect(dialog.dataset.width).toBe('1800');
    expect(uploadUserMediaFile).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Crop it' }));
    });
    expect(screen.queryByTestId('crop-dialog')).toBeNull();
    const uploaded = uploadUserMediaFile.mock.calls[0]?.[0] as File;
    expect(uploaded).toBeInstanceOf(File);
    expect(uploaded.name).toBe('poster-banner.jpg');
    expect(uploaded.type).toBe('image/jpeg');
    expect(screen.getByAltText('Banner preview')).toHaveAttribute(
      'src',
      BANNER_URL,
    );

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Garage jam' },
    });
    fireEvent.change(screen.getByLabelText('Place'), {
      target: { value: 'Garage' },
    });
    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'Tampere' },
    });
    fireEvent.change(screen.getByLabelText('Start'), {
      target: { value: '2030-06-21T20:00' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    });
    await settle();

    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Garage jam',
        imageUrl: BANNER_URL,
        status: 'PUBLISHED',
        shareTo: [],
        visibility: 'PUBLIC',
      }),
    );
    expect(router.state.location.pathname).toBe('/events/evt-new');
  });

  it('drops the picked image on cancel and removes an uploaded banner', async () => {
    signInListener();
    const { container } = await renderPost();
    await settle();

    await pickBanner(container);
    fireEvent.click(screen.getByRole('button', { name: 'Drop it' }));
    expect(screen.queryByTestId('crop-dialog')).toBeNull();
    expect(uploadUserMediaFile).not.toHaveBeenCalled();

    await pickBanner(container);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Crop it' }));
    });
    fireEvent.click(screen.getByRole('button', { name: 'Remove banner' }));
    expect(screen.queryByAltText('Banner preview')).toBeNull();
  });
});
