import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EnabledInternetRadioPreset } from '../../api/client';
import { useListenerWidgetsStore } from '../../stores/listenerWidgetsStore';
import { renderWithRouter } from '../../test/renderWithRouter';
import { AddStationUrlDialog } from '../plugin-store/radio-category/AddStationUrlDialog';
import { RadioStationsRow } from './RadioStationsRow';

const radio = vi.hoisted(() => ({
  resolveStreamUrl: vi.fn(),
  lookupStationByUrl: vi.fn(),
  testRadioStream: vi.fn(),
}));

vi.mock('../../api/radio-sources', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/radio-sources')>()),
  ...radio,
}));

const ylexPreset: EnabledInternetRadioPreset = {
  id: 'preset-ylex',
  name: 'YleX',
  genre: 'Pop / Hits',
  description: null,
  iconUrl: null,
  programmingUrl: null,
  streamUrl: 'https://example.com/ylex',
};

function AddByUrl() {
  const [open, setOpen] = useState(true);
  return open ? (
    <AddStationUrlDialog
      onAdd={useListenerWidgetsStore.getState().addSavedBrowserStation}
      onClose={() => setOpen(false)}
    />
  ) : null;
}

function renderRow(presets: Parameters<typeof RadioStationsRow>[0]['presets']) {
  return renderWithRouter(
    <RadioStationsRow
      presets={presets}
      setPresets={() => {}}
      onRetry={() => {}}
      signedIn
    />,
  );
}

describe('RadioStationsRow', () => {
  beforeEach(() => {
    useListenerWidgetsStore.setState({
      savedBrowserStations: [],
    });
  });

  it('waits for the curated presets before showing catalog stations', async () => {
    await renderRow({ data: [], status: 'loading' });
    expect(
      screen.queryByRole('button', { name: 'Play YleX' }),
    ).not.toBeInTheDocument();
  });

  it('shows one card per station once a preset covers it', async () => {
    await renderRow({ data: [ylexPreset], status: 'ready' });
    expect(
      await screen.findAllByRole('button', { name: 'Play YleX' }),
    ).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: 'Play Radio Helsinki' }),
    ).toBeInTheDocument();
  });

  it('puts a station added by URL in the radio row with the other stations', async () => {
    radio.resolveStreamUrl.mockResolvedValue({
      streamUrl: 'https://kaamos.example/stream',
      title: 'Kaamos FM',
    });
    radio.lookupStationByUrl.mockResolvedValue(null);
    radio.testRadioStream.mockResolvedValue({
      ok: true,
      message: 'Plays fine',
    });
    await renderWithRouter(
      <>
        <RadioStationsRow
          presets={{ data: [ylexPreset], status: 'ready' }}
          setPresets={() => {}}
          onRetry={() => {}}
          signedIn
        />
        <AddByUrl />
      </>,
    );
    expect(
      screen.queryByRole('button', { name: 'Play Kaamos FM', hidden: true }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/example.com\/stream/), {
      target: { value: 'https://kaamos.example/stream' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Resolve & test' }));
    await screen.findByText(/Plays fine/);
    fireEvent.click(screen.getByRole('button', { name: /Add to my stations/ }));

    const radioRow = screen.getAllByTestId('listen-radio')[0]!;
    expect(
      await within(radioRow).findByRole('button', { name: 'Play Kaamos FM' }),
    ).toBeInTheDocument();
    expect(
      within(radioRow).getByRole('button', { name: 'Play YleX' }),
    ).toBeInTheDocument();
  });

  it('removes a saved station from the row after confirming', async () => {
    useListenerWidgetsStore.setState({
      savedBrowserStations: [
        {
          id: 'kaamos',
          name: 'Kaamos FM',
          streamUrl: 'https://kaamos.example/stream',
        },
      ],
    });
    await renderRow({ data: [ylexPreset], status: 'ready' });
    fireEvent.click(
      await screen.findByRole('button', { name: 'Remove Kaamos FM' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));
    await waitFor(() =>
      expect(
        useListenerWidgetsStore.getState().savedBrowserStations,
      ).toHaveLength(0),
    );
  });
});
