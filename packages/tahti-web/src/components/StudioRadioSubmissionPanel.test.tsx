// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as studio from '../api/studio';
import { StudioRadioSubmissionPanel } from './StudioRadioSubmissionPanel';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('StudioRadioSubmissionPanel', () => {
  beforeEach(() => {
    vi.spyOn(studio, 'fetchStudioSounds').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    vi.spyOn(studio, 'fetchMetaStreamPreference').mockResolvedValue({
      data: { metaStreamOptOut: false },
    } as never);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says the submissions failed to load instead of "No submissions yet"', async () => {
    const fetch = vi
      .spyOn(studio, 'fetchMyRadioSubmissions')
      .mockResolvedValue({
        data: [],
        meta: { source: 'api', reason: 'HTTP 502' },
      });
    render(<StudioRadioSubmissionPanel />);
    expect(
      await screen.findByText('Could not load your submissions'),
    ).toBeTruthy();
    expect(screen.queryByText('No submissions yet')).toBeNull();

    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No submissions yet')).toBeTruthy();
  });
});
