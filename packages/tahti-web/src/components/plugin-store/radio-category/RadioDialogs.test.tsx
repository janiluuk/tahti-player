import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RadioStation } from '../../../content/radioStations';
import { AddStationUrlDialog } from './AddStationUrlDialog';
import { StationEditDialog } from './StationEditDialog';
import { SuggestStationForm } from './SuggestStationForm';

const { toast, radio, admin } = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn() },
  radio: {
    resolveStreamUrl: vi.fn(),
    lookupStationByUrl: vi.fn(),
    testRadioStream: vi.fn(),
  },
  admin: { submitRadioStationSuggestion: vi.fn() },
}));

vi.mock('sonner', () => ({ toast, Toaster: () => null }));
vi.mock('../../../api/radio-sources', () => radio);
vi.mock('../../../api/admin', () => admin);
vi.mock('../../RadioStationCover', () => ({ RadioStationCover: () => null }));

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

describe('SuggestStationForm', () => {
  it('releases the button and toasts when the request throws', async () => {
    admin.submitRadioStationSuggestion.mockRejectedValue(new Error('net'));
    render(<SuggestStationForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Suggest a station' }));
    fireEvent.change(screen.getByLabelText(/Station name/), {
      target: { value: 'Radio X' },
    });
    fireEvent.change(screen.getByLabelText(/Stream URL/), {
      target: { value: 'https://x.fi/s.mp3' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send for review' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Could not send the suggestion.',
      ),
    );
    expect(
      (
        screen.getByRole('button', {
          name: 'Send for review',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });

  it('clears the form after a successful send', async () => {
    admin.submitRadioStationSuggestion.mockResolvedValue({ ok: true });
    render(<SuggestStationForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Suggest a station' }));
    const name = screen.getByLabelText(/Station name/) as HTMLInputElement;
    fireEvent.change(name, { target: { value: 'Radio X' } });
    fireEvent.change(screen.getByLabelText(/Stream URL/), {
      target: { value: 'https://x.fi/s.mp3' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send for review' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(name.value).toBe('');
  });
});

describe('StationEditDialog', () => {
  const station = {
    id: 's1',
    name: 'Radio One',
    language: 'Finnish',
    genre: 'Pop',
    bitrateKbps: 128,
    codec: 'MP3',
    logoUrl: '',
    streamUrl: 'https://s1/stream',
    detailUrl: '',
  } as unknown as RadioStation;

  it('keeps the old bitrate when the field is not a number', () => {
    const onSave = vi.fn();
    render(
      <StationEditDialog station={station} onClose={vi.fn()} onSave={onSave} />,
    );
    fireEvent.change(screen.getByLabelText('Bitrate (kbps)'), {
      target: { value: 'abc' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save station/ }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        bitrateKbps: 128,
        streamUrl: 'https://s1/stream',
      }),
    );
  });
});

describe('AddStationUrlDialog', () => {
  const resolved = (streamUrl: string) => {
    radio.resolveStreamUrl.mockResolvedValue({ streamUrl, wasPlaylist: false });
    radio.lookupStationByUrl.mockResolvedValue(null);
    radio.testRadioStream.mockResolvedValue({
      ok: true,
      message: 'Plays fine',
    });
  };

  it('resolves, then adds the station and closes', async () => {
    resolved('https://a/stream');
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<AddStationUrlDialog onAdd={onAdd} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText(/example.com\/stream/), {
      target: { value: 'https://a/stream' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Resolve & test' }));
    await screen.findByText(/Plays fine/);
    fireEvent.click(screen.getByRole('button', { name: /Add to my stations/ }));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'https://a/stream',
        streamUrl: 'https://a/stream',
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('ignores a slow resolve that finishes after the URL was edited', async () => {
    let finish: (v: unknown) => void = () => {};
    radio.resolveStreamUrl.mockReturnValue(
      new Promise((resolve) => (finish = resolve)),
    );
    radio.lookupStationByUrl.mockResolvedValue(null);
    radio.testRadioStream.mockResolvedValue({
      ok: true,
      message: 'Plays fine',
    });
    render(<AddStationUrlDialog onAdd={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/example.com\/stream/);
    fireEvent.change(input, { target: { value: 'https://old/stream' } });
    fireEvent.click(screen.getByRole('button', { name: 'Resolve & test' }));
    fireEvent.change(input, { target: { value: 'https://new/stream' } });
    finish({ streamUrl: 'https://old/stream', wasPlaylist: false });
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByText(/Plays fine/)).toBeNull();
    expect(
      (
        screen.getByRole('button', {
          name: /Add to my stations/,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it('toasts when resolving throws and frees the button', async () => {
    radio.resolveStreamUrl.mockRejectedValue(new Error('x'));
    render(<AddStationUrlDialog onAdd={vi.fn()} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/example.com\/stream/), {
      target: { value: 'https://a/stream' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Resolve & test' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Could not resolve that stream URL.',
      ),
    );
    expect(
      (
        screen.getByRole('button', {
          name: 'Resolve & test',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });
});
