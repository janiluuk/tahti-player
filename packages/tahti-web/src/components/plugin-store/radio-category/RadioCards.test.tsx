import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRadioBrowserStore } from '../../../stores/radioBrowserStore';
import { PersonalRadioStreamCard } from './PersonalRadioStreamCard';
import { RadioBrowserDirectoryCard } from './RadioBrowserDirectoryCard';

const { toast, radio } = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn() },
  radio: {
    COMMON_STATIONS: [],
    resolveStreamUrl: vi.fn(),
    lookupStationByUrl: vi.fn(),
    readIcyStreamTitle: vi.fn(),
    searchStationsByName: vi.fn(),
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

describe('PersonalRadioStreamCard', () => {
  it('shows "…" while reading ICY metadata, then the title', async () => {
    let finish: (v: string | null) => void = () => {};
    radio.resolveStreamUrl.mockResolvedValue({
      streamUrl: 'https://a/s',
      wasPlaylist: false,
    });
    radio.lookupStationByUrl.mockResolvedValue(station('a', 'Alpha'));
    radio.readIcyStreamTitle.mockReturnValue(
      new Promise((resolve) => (finish = resolve)),
    );
    render(<PersonalRadioStreamCard />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Open' })[0]!);
    fireEvent.change(await screen.findByPlaceholderText(/example.com/), {
      target: { value: 'https://a/s' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Resolve' }));
    expect(await screen.findByText('…')).toBeTruthy();
    await act(async () => finish('Song X'));
    expect(await screen.findByText('Now playing: Song X')).toBeTruthy();
  });

  it('toasts when the URL cannot be resolved and frees the button', async () => {
    radio.resolveStreamUrl.mockRejectedValue(new Error('x'));
    render(<PersonalRadioStreamCard />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Open' })[0]!);
    fireEvent.change(await screen.findByPlaceholderText(/example.com/), {
      target: { value: 'https://a/s' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Resolve' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Could not resolve that stream URL.',
      ),
    );
    expect(
      (screen.getByRole('button', { name: 'Resolve' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });
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
