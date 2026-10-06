import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import { GlobalSearch } from './GlobalSearch';

const navigate = vi.fn();

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => navigate,
}));

const RESULTS = {
  artists: [
    {
      username: 'northern-lights',
      displayName: 'Northern Lights',
      avatarUrl: null,
      channelSlug: 'northern-lights',
    },
  ],
  tracks: [
    {
      id: 'track-1',
      title: 'Northern Drive',
      artistName: 'Aurora Drift',
      artistUsername: 'aurora-drift',
      artworkUrl: null,
      durationSec: 200,
    },
  ],
  collections: [],
};

async function search(text: string) {
  const input = screen.getByRole('combobox');
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: text } });
  await screen.findByRole('option', { name: /Northern Lights/ });
  return input;
}

describe('GlobalSearch', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    vi.spyOn(client, 'fetchSearch').mockResolvedValue({
      data: RESULTS,
      mock: false,
    } as Awaited<ReturnType<typeof client.fetchSearch>>);
  });
  afterEach(() => {
    navigate.mockReset();
    vi.restoreAllMocks();
  });

  it('opens the top result on Enter when nothing is highlighted', async () => {
    render(<GlobalSearch />);
    const input = await search('north');

    fireEvent.keyDown(input, { key: 'Enter' });

    expect(navigate).toHaveBeenCalledWith({
      to: '/u/$username',
      params: { username: 'northern-lights' },
    });
  });

  it('opens the highlighted result on Enter', async () => {
    render(<GlobalSearch />);
    const input = await search('north');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(navigate).toHaveBeenCalledWith({
      to: '/t/$id',
      params: { id: 'track-1' },
    });
  });
});
