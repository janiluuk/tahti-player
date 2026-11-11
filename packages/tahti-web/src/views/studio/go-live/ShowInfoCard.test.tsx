// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  BroadcastPreflight,
  BroadcastPreflightPatch,
} from '../../../api/broadcast';
import { ShowInfoCard } from './ShowInfoCard';
import { AUTOSAVE_DELAY_MS } from './useShowInfoAutosave';

const patchBroadcastPreflight = vi.fn();

vi.mock('../../../api/broadcast', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../api/broadcast')>();
  return {
    ...actual,
    patchBroadcastPreflight: (patch: BroadcastPreflightPatch) =>
      patchBroadcastPreflight(patch),
  };
});

vi.mock('../../../api/shows', () => ({
  fetchShowSeries: async () => ({ data: [], meta: { source: 'mock' } }),
}));

function preflight(
  overrides: Partial<BroadcastPreflight> = {},
): BroadcastPreflight {
  return {
    session: 'NONE',
    title: 'Friday Frequency',
    tagline: null,
    showType: 'LIVE_SET',
    visibility: 'PUBLIC',
    autoPublish: true,
    episodeNumber: null,
    seriesId: null,
    artworkUrl: null,
    coverUrl: null,
    plannedRadioShow: null,
    plannedLiveShow: null,
    ...overrides,
  };
}

const onSaved = vi.fn();

async function renderCard(
  overrides: Partial<BroadcastPreflight> = {},
  isLive = false,
) {
  await act(async () => {
    render(
      <ShowInfoCard
        preflight={preflight(overrides)}
        isLive={isLive}
        onSaved={onSaved}
      />,
    );
  });
}

const status = () => screen.getByTestId('show-info-autosave');

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: false });
  patchBroadcastPreflight.mockImplementation(
    async (patch: BroadcastPreflightPatch) => ({
      data: { ...preflight(), ...patch },
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('ShowInfoCard autosave', () => {
  it('saves a renamed show once, after the debounce, on blur', async () => {
    await renderCard();
    const name = screen.getByLabelText(/Show name/) as HTMLInputElement;

    fireEvent.change(name, { target: { value: 'Late Night Ambient' } });
    fireEvent.blur(name);
    await advance(AUTOSAVE_DELAY_MS - 100);
    expect(patchBroadcastPreflight).not.toHaveBeenCalled();

    await advance(100);
    expect(patchBroadcastPreflight).toHaveBeenCalledTimes(1);
    expect(patchBroadcastPreflight).toHaveBeenCalledWith({
      title: 'Late Night Ambient',
    });
    expect(status()).toHaveAttribute('aria-live', 'polite');
    expect(status()).toHaveTextContent('Saved');
    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Late Night Ambient' }),
    );
  });

  it('batches quick edits to name and tagline into one PATCH', async () => {
    await renderCard();
    const name = screen.getByLabelText(/Show name/);
    const tagline = screen.getByLabelText(/Tagline/);

    fireEvent.change(name, { target: { value: 'New name' } });
    fireEvent.blur(name);
    await advance(300);
    fireEvent.change(tagline, { target: { value: 'Deep cuts' } });
    fireEvent.blur(tagline);
    await advance(AUTOSAVE_DELAY_MS);

    expect(patchBroadcastPreflight).toHaveBeenCalledTimes(1);
    expect(patchBroadcastPreflight).toHaveBeenCalledWith({
      title: 'New name',
      tagline: 'Deep cuts',
    });
  });

  it('does not save an unchanged field', async () => {
    await renderCard();
    fireEvent.blur(screen.getByLabelText(/Show name/));
    await advance(AUTOSAVE_DELAY_MS * 2);
    expect(patchBroadcastPreflight).not.toHaveBeenCalled();
  });

  it('shows Saving while the request is in flight', async () => {
    let resolve: (value: unknown) => void = () => undefined;
    patchBroadcastPreflight.mockImplementation(
      () => new Promise((done) => (resolve = done)),
    );
    await renderCard();
    const name = screen.getByLabelText(/Show name/);
    fireEvent.change(name, { target: { value: 'Pending' } });
    fireEvent.blur(name);
    await advance(AUTOSAVE_DELAY_MS);
    expect(status()).toHaveTextContent('Saving…');

    await act(async () => {
      resolve({ data: preflight({ title: 'Pending' }) });
    });
    expect(status()).toHaveTextContent('Saved');
  });

  it('reports a failed save and retries the same change', async () => {
    patchBroadcastPreflight.mockResolvedValueOnce({
      error: 'Server unavailable',
      status: 503,
    });
    await renderCard();
    const name = screen.getByLabelText(/Show name/);
    fireEvent.change(name, { target: { value: 'Retry me' } });
    fireEvent.blur(name);
    await advance(AUTOSAVE_DELAY_MS);

    expect(status()).toHaveTextContent("Couldn't save. Server unavailable");
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Retry' })),
    );
    expect(patchBroadcastPreflight).toHaveBeenCalledTimes(2);
    expect(patchBroadcastPreflight).toHaveBeenLastCalledWith({
      title: 'Retry me',
    });
    expect(status()).toHaveTextContent('Saved');
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('keeps an empty show name out of the PATCH and explains it under the field', async () => {
    await renderCard();
    const name = screen.getByLabelText(/Show name/);
    fireEvent.change(name, { target: { value: '   ' } });
    fireEvent.blur(name);
    await advance(AUTOSAVE_DELAY_MS);

    expect(patchBroadcastPreflight).not.toHaveBeenCalled();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    const describedBy = name.getAttribute('aria-describedby') ?? '';
    const messages = describedBy
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent);
    expect(messages).toContain('Add a show name to go live.');
  });

  it('caps the show name at 140 characters', async () => {
    await renderCard();
    expect(screen.getByLabelText(/Show name/)).toHaveAttribute(
      'maxLength',
      '140',
    );
  });

  it('offers Private visibility', async () => {
    await renderCard({ visibility: 'PRIVATE' });
    expect(
      screen.getByRole('button', { name: /Visibility/ }),
    ).toHaveTextContent('Private');
  });
});

describe('ShowInfoCard while live', () => {
  it('keeps name and tagline editable but locks type, visibility and series', async () => {
    await renderCard({ session: 'LIVE' }, true);

    expect(screen.getByLabelText(/Show name/)).toBeEnabled();
    expect(screen.getByLabelText(/Tagline/)).toBeEnabled();
    expect(screen.getByRole('button', { name: /Show type/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Visibility/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Series/ })).toBeDisabled();
    expect(
      screen.getAllByText("Can't be changed while you're live."),
    ).toHaveLength(3);
  });
});
