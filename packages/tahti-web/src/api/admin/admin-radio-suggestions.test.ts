import { afterEach, describe, expect, it, vi } from 'vitest';

import { submitRadioStationSuggestion } from './admin-radio';

const INPUT = {
  name: 'Basso FM',
  logoUrl: '',
  language: 'Finnish',
  bitrateKbps: '128',
  streamUrl: 'https://stream.example.fi/basso.mp3',
};

describe('submitRadioStationSuggestion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the suggestion', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 's1', status: 'PENDING' }), {
        status: 201,
      }),
    );
    await expect(submitRadioStationSuggestion(INPUT)).resolves.toEqual({
      ok: true,
    });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/tahti-api/api/me/radio-station-suggestions');
    expect(JSON.parse(init!.body as string)).toEqual({
      name: 'Basso FM',
      logoUrl: null,
      language: 'Finnish',
      bitrateKbps: 128,
      streamUrl: 'https://stream.example.fi/basso.mp3',
    });
  });

  it('reports a refused suggestion instead of claiming it was sent', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ error: 'That stream has already been suggested' }),
        { status: 409 },
      ),
    );
    await expect(submitRadioStationSuggestion(INPUT)).resolves.toEqual({
      ok: false,
      error: 'That stream has already been suggested',
    });
  });
});
