// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/sound-version-progress';
import { VersionRenderProgress } from './VersionRenderProgress';

describe('VersionRenderProgress', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the render percentage and reports when it finishes', async () => {
    let push: (progress: api.VersionProgress) => void = () => {};
    const stop = vi.fn();
    vi.spyOn(api, 'subscribeToVersionProgress').mockImplementation(
      (_soundId, _versionId, onProgress) => {
        push = onProgress;
        return stop;
      },
    );
    const onDone = vi.fn();
    const { unmount } = render(
      <VersionRenderProgress soundId="s1" versionId="v2" onDone={onDone} />,
    );
    act(() =>
      push({ status: 'PROCESSING', pct: 0.42, segment: 2, segmentCount: 5 }),
    );
    expect(screen.getByRole('meter', { name: 'Rendering, 42%' })).toBeTruthy();
    expect(screen.getByText('42% · part 2 of 5')).toBeTruthy();
    act(() => push({ status: 'READY', pct: 1 }));
    expect(onDone).toHaveBeenCalled();
    expect(screen.queryByRole('meter')).toBeNull();
    unmount();
    expect(stop).toHaveBeenCalled();
  });
});
