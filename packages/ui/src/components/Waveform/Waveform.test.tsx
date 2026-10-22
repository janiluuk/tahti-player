import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { hasPeaks, peaksKey, peaksToWaveSurfer } from './peaks';
import { Waveform } from './Waveform';

type Handler = (...args: unknown[]) => void;

const instances: Array<{
  options: Record<string, unknown>;
  handlers: Record<string, Handler>;
  load: ReturnType<typeof vi.fn>;
  setTime: ReturnType<typeof vi.fn>;
  setOptions: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
}> = [];

vi.mock('wavesurfer.js', () => ({
  default: {
    create: vi.fn((options: Record<string, unknown>) => {
      const handlers: Record<string, Handler> = {};
      const instance = {
        options,
        handlers,
        on: vi.fn((event: string, handler: Handler) => {
          handlers[event] = handler;
          return vi.fn();
        }),
        destroy: vi.fn(),
        load: vi.fn(),
        setTime: vi.fn(),
        setOptions: vi.fn((next: Record<string, unknown>) => {
          Object.assign(options, next);
        }),
        getCurrentTime: vi.fn(() => 0),
      };
      instances.push(instance);
      return instance;
    }),
  },
}));

beforeEach(() => {
  instances.length = 0;
});

describe('peaksToWaveSurfer', () => {
  it('maps 0..255 buckets to non-negative 0..1 magnitudes', () => {
    const [channel] = peaksToWaveSurfer([0, 128, 255]);
    expect(channel?.[0]).toBe(0);
    expect(channel?.[1]).toBeCloseTo(0.5, 1);
    expect(channel?.[2]).toBe(1);
  });

  it('handles long arrays without spreading them', () => {
    const long = Array.from({ length: 300_000 }, (_, i) => i % 256);
    expect(peaksToWaveSurfer(long)[0]).toHaveLength(300_000);
  });

  it('treats empty peaks as empty', () => {
    expect(hasPeaks([])).toBe(false);
    expect(peaksToWaveSurfer([])).toEqual([[]]);
  });

  it('keys peaks by content, not identity', () => {
    expect(peaksKey([1, 2, 3])).toBe(peaksKey([1, 2, 3]));
    expect(peaksKey([1, 2, 3])).not.toBe(peaksKey([3, 2, 1]));
    expect(peaksKey(null)).toBe('empty');
  });
});

describe('Waveform', () => {
  it('renders a peaks container', async () => {
    render(<Waveform peaks={[10, 200, 40]} durationSec={12} />);
    expect(
      await screen.findByRole('img', { name: 'Waveform' }),
    ).toHaveAttribute('data-waveform', 'peaks');
  });

  it('never calls load and always passes peaks when bound to media without peaks', async () => {
    const media = document.createElement('audio');
    render(<Waveform peaks={null} durationSec={30} media={media} />);
    await vi.waitFor(() => expect(instances).toHaveLength(1));
    const [ws] = instances;
    expect(ws!.load).not.toHaveBeenCalled();
    expect(ws!.options.peaks).toBeTruthy();
    expect(ws!.options.duration).toBe(30);
    expect(ws!.options.normalize).toBe(false);
  });

  it('does not re-create for an equal peaks array or a new height', async () => {
    const { rerender } = render(
      <Waveform peaks={[1, 2, 3]} durationSec={10} height={60} />,
    );
    await vi.waitFor(() => expect(instances).toHaveLength(1));
    rerender(<Waveform peaks={[1, 2, 3]} durationSec={10} height={80} />);
    expect(instances).toHaveLength(1);
    expect(instances[0]!.setOptions).toHaveBeenCalledWith({ height: 80 });
  });

  it('seeks from the keyboard as a slider', async () => {
    const onSeek = vi.fn();
    render(
      <Waveform
        peaks={[1, 2, 3]}
        durationSec={100}
        progress={0.5}
        onSeek={onSeek}
        aria-valuetext="0:50 of 1:40"
      />,
    );
    const slider = await screen.findByRole('slider', { name: 'Waveform' });
    expect(slider).toHaveAttribute('aria-valuenow', '50');
    expect(slider).toHaveAttribute('aria-valuetext', '0:50 of 1:40');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onSeek).toHaveBeenLastCalledWith(0.55);
    fireEvent.keyDown(slider, { key: 'Home' });
    expect(onSeek).toHaveBeenLastCalledWith(0);
  });

  it('marks itself ready and recolours on theme change', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    render(<Waveform peaks={[1, 2, 3]} durationSec={10} />);
    await vi.waitFor(() => expect(instances).toHaveLength(1));
    const ws = instances[0]!;
    const el = screen.getByRole('img');
    expect(el).toHaveAttribute('data-state', 'loading');
    act(() => ws.handlers.ready?.());
    expect(el).toHaveAttribute('data-state', 'ready');
    document.documentElement.setAttribute('data-theme', 'dark');
    await vi.waitFor(() =>
      expect(ws.setOptions).toHaveBeenCalledWith(
        expect.objectContaining({ progressColor: expect.any(String) }),
      ),
    );
    document.documentElement.removeAttribute('data-theme');
  });
});
