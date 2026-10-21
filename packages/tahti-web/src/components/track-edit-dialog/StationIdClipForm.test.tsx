// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../api/sound-clip';
import { StationIdClipForm } from './StationIdClipForm';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('StationIdClipForm', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('makes a clip from the playhead to a chosen end', async () => {
    const make = vi.spyOn(api, 'createClipFromSound').mockResolvedValue({
      ok: true,
      data: { clipId: 'c1', title: 'Ident', durationSec: 12 },
    });
    render(
      <StationIdClipForm soundId="s1" durationSec={200} playheadSec={42.34} />,
    );
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Use playhead' })[0]!,
    );
    fireEvent.change(screen.getByLabelText('End (s)'), {
      target: { value: '54.3' },
    });
    fireEvent.change(screen.getByLabelText('Clip title (optional)'), {
      target: { value: 'Ident' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Make clip' }));
    });
    expect(make).toHaveBeenCalledWith('s1', {
      startSec: 42.3,
      endSec: 54.3,
      title: 'Ident',
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it('refuses clips over a minute or past the end', () => {
    render(
      <StationIdClipForm soundId="s1" durationSec={70} playheadSec={null} />,
    );
    expect(screen.queryByRole('button', { name: 'Use playhead' })).toBeNull();
    fireEvent.change(screen.getByLabelText('End (s)'), {
      target: { value: '65' },
    });
    expect(screen.getByRole('alert').textContent).toContain(
      '60 seconds or less',
    );
    fireEvent.change(screen.getByLabelText('Start (s)'), {
      target: { value: '30' },
    });
    fireEvent.change(screen.getByLabelText('End (s)'), {
      target: { value: '75' },
    });
    expect(screen.getByRole('alert').textContent).toBe(
      'End is past the end of the track.',
    );
    expect(
      (screen.getByRole('button', { name: 'Make clip' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
