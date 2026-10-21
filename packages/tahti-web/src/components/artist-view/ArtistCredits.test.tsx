import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchPublicChannelMembers } from '../../api/channel-members';
import { ArtistCredits } from './ArtistCredits';

vi.mock('../../api/channel-members', () => ({
  fetchPublicChannelMembers: vi.fn(),
}));

async function renderCredits(
  members: Awaited<ReturnType<typeof fetchPublicChannelMembers>>,
) {
  vi.mocked(fetchPublicChannelMembers).mockResolvedValue(members);
  let result: ReturnType<typeof render> | undefined;
  await act(async () => {
    result = render(<ArtistCredits channelSlug="night-drive" />);
  });
  return result!;
}

describe('ArtistCredits', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("lists the channel's roster with each person's role", async () => {
    await renderCredits([
      {
        id: 'm1',
        name: 'Aino',
        role: 'Vocals',
        pictureUrl: null,
        position: 0,
      },
      {
        id: 'm2',
        name: 'Ville',
        role: 'Drums',
        pictureUrl: 'https://cdn.example/ville.webp',
        position: 1,
      },
    ]);

    expect(fetchPublicChannelMembers).toHaveBeenCalledWith('night-drive');
    expect(screen.getByRole('region', { name: 'Credits' })).toBeInTheDocument();
    expect(screen.getByText('Aino')).toBeInTheDocument();
    expect(screen.getByText('Vocals')).toBeInTheDocument();
    expect(screen.getByText('Drums')).toBeInTheDocument();
  });

  it('renders nothing for a channel without a roster', async () => {
    const { container } = await renderCredits([]);
    expect(container).toBeEmptyDOMElement();
  });
});
