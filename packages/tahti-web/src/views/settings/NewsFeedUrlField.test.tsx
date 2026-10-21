import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchMeProfile, patchMeProfile } from '../../api/studio-extras';
import { NewsFeedUrlField } from './NewsFeedUrlField';

vi.mock('../../api/studio-extras', () => ({
  fetchMeProfile: vi.fn(),
  patchMeProfile: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const profile = (newsFeedUrl: string | null) =>
  ({ newsFeedUrl }) as Awaited<ReturnType<typeof fetchMeProfile>>['data'];

async function renderField(initial: string | null) {
  vi.mocked(fetchMeProfile).mockResolvedValue({
    data: profile(initial),
    meta: { source: 'api' },
  });
  await act(async () => {
    render(<NewsFeedUrlField />);
  });
}

describe('NewsFeedUrlField', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the saved feed', async () => {
    await renderField('https://blog.example/feed.xml');
    expect(screen.getByLabelText('Feed URL')).toHaveProperty(
      'value',
      'https://blog.example/feed.xml',
    );
  });

  it('saves the trimmed feed URL', async () => {
    vi.mocked(patchMeProfile).mockResolvedValue({
      ok: true,
      data: profile('https://blog.example/rss'),
    });
    await renderField(null);
    fireEvent.change(screen.getByLabelText('Feed URL'), {
      target: { value: ' https://blog.example/rss ' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save news feed/ }));
    });
    expect(patchMeProfile).toHaveBeenCalledWith({
      newsFeedUrl: 'https://blog.example/rss',
    });
  });

  it('clears the feed with an empty value', async () => {
    vi.mocked(patchMeProfile).mockResolvedValue({
      ok: true,
      data: profile(null),
    });
    await renderField('https://blog.example/rss');
    fireEvent.change(screen.getByLabelText('Feed URL'), {
      target: { value: '' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save news feed/ }));
    });
    expect(patchMeProfile).toHaveBeenCalledWith({ newsFeedUrl: '' });
    expect(screen.getByLabelText('Feed URL')).toHaveProperty('value', '');
  });
});
