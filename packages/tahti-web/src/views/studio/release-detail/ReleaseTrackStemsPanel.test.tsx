/** @vitest-environment jsdom */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  resetMockReleaseTrackStems,
  uploadReleaseTrackStem,
} from '../../../api/release-track-stems';
import { ReleaseTrackStemsPanel } from './ReleaseTrackStemsPanel';

vi.mock('@tahti-player/i18n', async () => {
  const actual =
    await vi.importActual<typeof import('@tahti-player/i18n')>(
      '@tahti-player/i18n',
    );
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, vars?: Record<string, string>) =>
        vars ? `${key}:${JSON.stringify(vars)}` : key,
    }),
  };
});

describe('ReleaseTrackStemsPanel', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    resetMockReleaseTrackStems();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    resetMockReleaseTrackStems();
  });

  it('lists an uploaded stem and can remove it', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'vocals.wav', {
      type: 'audio/wav',
    });
    await uploadReleaseTrackStem('rel-mock-1', 't1', 'vocals', file);

    const onTrackStemsSaved = vi.fn();
    render(
      <ReleaseTrackStemsPanel
        releaseId="rel-mock-1"
        tracks={[
          {
            id: 't1',
            position: 1,
            title: 'Moonlight Drive',
            status: 'READY',
          },
        ]}
        onTrackStemsSaved={onTrackStemsSaved}
      />,
    );

    expect(await screen.findByText('Vocals')).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', {
        name: /studioReleaseDetail.stemsRemoveRole/,
      }),
    );

    await waitFor(() => {
      expect(screen.queryByText('Vocals')).toBeNull();
    });
    expect(onTrackStemsSaved).toHaveBeenCalled();
  });
});
