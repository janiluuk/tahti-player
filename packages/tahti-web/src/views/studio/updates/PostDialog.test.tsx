// @vitest-environment jsdom
import { act, fireEvent, screen } from '@testing-library/react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ArtistPost } from '../../../api/studio-extras';
import { PostDialog } from './PostDialog';

const createArtistPost = vi.fn();
const updateArtistPost = vi.fn();

vi.mock('../../../api/studio-extras', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../api/studio-extras')>();
  return {
    ...actual,
    createArtistPost: (...args: unknown[]) => createArtistPost(...args),
    updateArtistPost: (...args: unknown[]) => updateArtistPost(...args),
  };
});

const basePost: ArtistPost = {
  id: 'post-1',
  title: 'Tour',
  body: 'Dates are up',
  linkUrl: 'https://example.com/tour',
  linkLabel: 'Tickets',
  images: [],
  publishAt: '2020-01-01T10:00:00.000Z',
  createdAt: '2020-01-01T10:00:00.000Z',
};

let container: HTMLDivElement;
let root: Root;
const onSaved = vi.fn();
const onClose = vi.fn();

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllMocks();
});

async function renderDialog(post?: ArtistPost) {
  await act(async () => {
    root.render(
      <PostDialog
        post={post}
        onClose={onClose}
        onSaved={onSaved}
        onImageClick={() => undefined}
      />,
    );
  });
}

async function change(label: string, value: string) {
  await act(async () => {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  });
}

describe('PostDialog - new post', () => {
  it('schedules a post with a link label, sending the local time as ISO', async () => {
    const at = new Date(2099, 4, 4, 18, 30).toISOString();
    createArtistPost.mockResolvedValue({
      ok: true,
      data: { ...basePost, publishAt: at },
    });
    await renderDialog();

    await change('Body', 'Tour dates');
    await change('Link (optional)', 'https://example.com/tour');
    await change('Link label (optional)', 'Get tickets');
    await change('Publish at (optional)', '2099-05-04T18:30');

    const submit = screen.getByRole('button', { name: 'Schedule' });
    await act(async () => fireEvent.click(submit));

    expect(createArtistPost).toHaveBeenCalledWith({
      title: undefined,
      body: 'Tour dates',
      linkUrl: 'https://example.com/tour',
      linkLabel: 'Get tickets',
      publishAt: at,
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it('publishes now when no time is set', async () => {
    createArtistPost.mockResolvedValue({ ok: true, data: basePost });
    await renderDialog();

    await change('Body', 'Hello');
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Publish' })),
    );

    expect(createArtistPost).toHaveBeenCalledWith(
      expect.objectContaining({ body: 'Hello', publishAt: undefined }),
    );
  });

  it('refuses a past publish time and a non-web link', async () => {
    await renderDialog();

    await change('Body', 'Hello');
    await change('Publish at (optional)', '2001-01-01T10:00');
    expect(screen.getByText(/Pick a time in the future/)).toBeInTheDocument();

    await change('Publish at (optional)', '');
    await change('Link (optional)', 'javascript:alert(1)');
    expect(screen.getByText(/full web address/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled();
  });
});

describe('PostDialog - editing', () => {
  it('saves edits to a published post without touching its publish time', async () => {
    updateArtistPost.mockResolvedValue({ ok: true, data: basePost });
    await renderDialog(basePost);

    expect(screen.queryByLabelText('Publish at (optional)')).toBeNull();
    expect(screen.getByLabelText('Body')).toHaveValue('Dates are up');

    await change('Body', 'New dates are up');
    await change('Link (optional)', '');
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Save' })),
    );

    expect(updateArtistPost).toHaveBeenCalledWith('post-1', {
      title: 'Tour',
      body: 'New dates are up',
      linkUrl: null,
      linkLabel: null,
    });
  });

  it('publishes a scheduled post now when its time is cleared', async () => {
    const scheduled = { ...basePost, publishAt: '2099-01-01T10:00:00.000Z' };
    updateArtistPost.mockResolvedValue({ ok: true, data: basePost });
    await renderDialog(scheduled);

    expect(screen.getByLabelText('Publish at (optional)')).not.toHaveValue('');
    await change('Publish at (optional)', '');
    const before = Date.now();
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Save' })),
    );

    const patch = updateArtistPost.mock.calls[0]![1] as {
      publishAt: string;
    };
    expect(Date.parse(patch.publishAt)).toBeGreaterThanOrEqual(before - 1000);
    expect(Date.parse(patch.publishAt)).toBeLessThanOrEqual(Date.now());
  });

  it('leaves the publish time alone when a scheduled post is saved unchanged', async () => {
    const scheduled = { ...basePost, publishAt: '2099-01-01T10:00:00.000Z' };
    updateArtistPost.mockResolvedValue({ ok: true, data: scheduled });
    await renderDialog(scheduled);

    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Save' })),
    );

    expect(updateArtistPost.mock.calls[0]![1]).not.toHaveProperty('publishAt');
  });
});
