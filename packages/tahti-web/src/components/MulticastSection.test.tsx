// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as broadcast from '../api/broadcast';
import { MulticastSection } from './MulticastSection';

describe('MulticastSection', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads the Tahti Radio destinations in the radio scope', async () => {
    const fetchTargets = vi
      .spyOn(broadcast, 'fetchRtmpTargets')
      .mockResolvedValue({ data: [], meta: { source: 'api' } });
    await act(async () => {
      render(
        <MulticastSection
          scope="radio"
          description="Destinations that receive the Tahti Radio stream."
        />,
      );
    });
    expect(fetchTargets).toHaveBeenCalledWith('radio');
    expect(
      screen.getByText('Destinations that receive the Tahti Radio stream.'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: /YouTube/ })).toBeTruthy();
  });

  it('loads the artist destinations by default', async () => {
    const fetchTargets = vi
      .spyOn(broadcast, 'fetchRtmpTargets')
      .mockResolvedValue({ data: [], meta: { source: 'api' } });
    await act(async () => {
      render(<MulticastSection />);
    });
    expect(fetchTargets).toHaveBeenCalledWith('me');
  });
});
