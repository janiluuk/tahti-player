// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as studio from '../../api/studio';
import type { StudioSound } from '../../api/studio-types';
import { renderWithRouter } from '../../test/renderWithRouter';
import { StudioSoundsView } from './StudioSoundsView';

vi.mock('../../components/StudioGate', () => ({
  StudioGate: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('../LibraryView', () => ({ LibrarySectionTabs: () => null }));
vi.mock('../../components/AddToMusicActions', () => ({
  AddToMusicActions: () => null,
}));
vi.mock('./sounds/TrackOrderButton', () => ({ TrackOrderButton: () => null }));
vi.mock('./sounds/SoundsAmbientList', () => ({
  SoundsAmbientList: ({ items }: { items: StudioSound[] }) => (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.title}</li>
      ))}
    </ul>
  ),
}));

const sound = {
  id: 's1',
  title: 'Moonlight Drive',
  status: 'READY',
  createdAt: '2026-10-01T00:00:00Z',
} as unknown as StudioSound;

describe('StudioSoundsView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says the list failed to load instead of "No sounds yet"', async () => {
    const fetch = vi.spyOn(studio, 'fetchStudioSounds').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderWithRouter(<StudioSoundsView />);
    expect(await screen.findByText('Could not load your sounds')).toBeTruthy();
    expect(screen.queryByText('No sounds yet')).toBeNull();

    fetch.mockResolvedValue({ data: [sound], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Moonlight Drive')).toBeTruthy();
  });

  it('offers to clear filters that match nothing', async () => {
    vi.spyOn(studio, 'fetchStudioSounds').mockResolvedValue({
      data: [sound],
      meta: { source: 'api' },
    });
    await renderWithRouter(<StudioSoundsView />);
    await screen.findByText('Moonlight Drive');
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'zzz' },
    });
    expect(
      await screen.findByText('No sounds match these filters'),
    ).toBeTruthy();
    expect(screen.queryByText('No sounds yet')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await screen.findByText('Moonlight Drive')).toBeTruthy();
  });
});
