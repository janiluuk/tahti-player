// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { StudioSound } from '../../../api/studio-types';
import { SoundStatusLine } from './SoundsAmbientList';

function sound(overrides: Partial<StudioSound> = {}): StudioSound {
  return {
    id: 'sound-1',
    title: 'Northern Lights - Live Set',
    status: 'READY',
    createdAt: '2026-11-09T12:00:00.000Z',
    durationSec: 3720,
    ...overrides,
  } as StudioSound;
}

describe('SoundStatusLine', () => {
  afterEach(cleanup);

  it('leaves the raw READY status out and writes hours for long tracks', () => {
    render(<SoundStatusLine item={sound()} />);
    const line = screen.getByText(/Uploaded/);
    expect(line.textContent).not.toMatch(/READY/);
    expect(line.textContent).toMatch(/^Uploaded .+, 1 h 2 min$/);
  });

  it('still says when a track is processing', () => {
    render(<SoundStatusLine item={sound({ status: 'PROCESSING' })} />);
    expect(screen.getByText(/^Processing, uploaded/)).toBeTruthy();
  });
});
