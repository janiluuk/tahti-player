import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRadioBrowserStore } from '../../../stores/radioBrowserStore';
import { RadioBrowserDirectoryCard } from './RadioBrowserDirectoryCard';

const { toast, radio } = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn() },
  radio: {
    resolveStreamUrl: vi.fn(),
    lookupStationByUrl: vi.fn(),
    searchStations: vi.fn(),
    fetchStationCount: vi.fn(),
    fetchCountryList: vi.fn(),
    fetchTagList: vi.fn(),
    testRadioStream: vi.fn(),
    playableFromRadioStation: vi.fn((s: { id: string }) => ({ id: s.id })),
  },
}));

vi.mock('sonner', () => ({ toast, Toaster: () => null }));
vi.mock('../../../api/radio-sources', () => radio);
vi.mock('../../RadioStationCover', () => ({ RadioStationCover: () => null }));

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  radio.fetchStationCount.mockResolvedValue(1);
  radio.fetchCountryList.mockResolvedValue([]);
  radio.fetchTagList.mockResolvedValue([]);
});

const station = (id: string, name: string) => ({
  id,
  name,
  streamUrl: `https://${id}/s`,
  source: 'radio-browser',
});

describe('RadioBrowserDirectoryCard', () => {
  it('only the newest search updates the results', async () => {
    useRadioBrowserStore.setState({ enabled: true } as never);
    radio.searchStations.mockResolvedValueOnce([]); // initial popular list
    let finishOld: (v: unknown) => void = () => {};
    radio.searchStations
      .mockReturnValueOnce(new Promise((resolve) => (finishOld = resolve)))
      .mockResolvedValueOnce([station('new', 'Newest')]);

    render(<RadioBrowserDirectoryCard />);
    const gears = await screen.findAllByRole('button', { name: 'Configure' });
    fireEvent.click(gears[gears.length - 1]!);
    fireEvent.click(await screen.findByRole('tab', { name: 'Browser' }));
    const input = await screen.findByLabelText('Search stations');
    fireEvent.change(input, { target: { value: 'old' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.change(input, { target: { value: 'new' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText('Newest')).toBeTruthy();
    await act(async () => finishOld([station('old', 'Stale')]));
    expect(screen.queryByText('Stale')).toBeNull();
    expect(screen.getByText('Newest')).toBeTruthy();
  });
});
