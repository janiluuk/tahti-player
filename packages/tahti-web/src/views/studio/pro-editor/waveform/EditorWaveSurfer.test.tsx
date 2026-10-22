import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  dataToWaveSurferPeaks,
  EditorWaveSurfer,
  resolveWaveSurferPeaks,
} from './EditorWaveSurfer';
import type { WaveformData } from './peaks';

const mocks = vi.hoisted(() => {
  const handlers = new Map<string, (...args: never[]) => void>();
  const regionHandlers = new Map<string, (...args: never[]) => void>();
  const region = {
    id: 'r1',
    start: 1,
    end: 2,
    setOptions: vi.fn(),
    remove: vi.fn(),
    element: document.createElement('div'),
  };
  const regions = {
    on: vi.fn((event: string, handler: (...args: never[]) => void) => {
      regionHandlers.set(event, handler);
      return vi.fn();
    }),
    addRegion: vi.fn(() => region),
    getRegions: vi.fn(() => [region]),
    enableDragSelection: vi.fn(() => vi.fn()),
  };
  const ws = {
    on: vi.fn((event: string, handler: (...args: never[]) => void) => {
      handlers.set(event, handler);
      return vi.fn();
    }),
    destroy: vi.fn(),
    getCurrentTime: vi.fn(() => 0),
    setTime: vi.fn(),
    getWidth: vi.fn(() => 800),
    getScroll: vi.fn(() => 0),
    setScrollTime: vi.fn(),
    zoom: vi.fn(),
    setOptions: vi.fn(),
    options: { minPxPerSec: 0, height: 192 },
  };
  const create = vi.fn(() => ws);
  return { handlers, regionHandlers, region, regions, ws, create };
});

vi.mock('wavesurfer.js', () => ({ default: { create: mocks.create } }));
vi.mock('wavesurfer.js/dist/plugins/regions.esm.js', () => ({
  default: { create: () => mocks.regions },
}));
vi.mock('wavesurfer.js/dist/plugins/timeline.esm.js', () => ({
  default: { create: vi.fn(() => ({})) },
}));
vi.mock('wavesurfer.js/dist/plugins/minimap.esm.js', () => ({
  default: { create: vi.fn(() => ({})) },
}));
vi.mock('wavesurfer.js/dist/plugins/zoom.esm.js', () => ({
  default: { create: vi.fn(() => ({})) },
}));
vi.mock('wavesurfer.js/dist/plugins/hover.esm.js', () => ({
  default: { create: vi.fn(() => ({})) },
}));

const baseProps = {
  peaks: [10, 200, 40],
  durationSec: 12,
  playhead: 0,
  selection: null,
  onSeek: vi.fn(),
  onSelect: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.handlers.clear();
  mocks.regionHandlers.clear();
});

describe('EditorWaveSurfer', () => {
  it('creates wavesurfer with plugins and forwards seeks', async () => {
    const onSeek = vi.fn();
    render(<EditorWaveSurfer {...baseProps} onSeek={onSeek} />);
    expect(screen.getByTestId('editor-wavesurfer')).toBeInTheDocument();
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    const options = (
      mocks.create.mock.calls[0] as unknown as [
        { plugins: unknown[]; duration: number },
      ]
    )[0] as {
      plugins: unknown[];
      duration: number;
    };
    expect(options.plugins).toHaveLength(5);
    expect(options.duration).toBe(12);
    mocks.handlers.get('interaction')?.(3.5 as never);
    expect(onSeek).toHaveBeenCalledWith(3.5);
  });

  it('syncs the selection into a single region and reports edits', async () => {
    const onSelect = vi.fn();
    render(
      <EditorWaveSurfer
        {...baseProps}
        selection={{ start: 1, end: 2 }}
        onSelect={onSelect}
      />,
    );
    await waitFor(() => expect(mocks.regions.addRegion).toHaveBeenCalled());
    mocks.regionHandlers.get('region-updated')?.({
      id: 'r1',
      start: 0.5,
      end: 2.5,
    } as never);
    expect(onSelect).toHaveBeenCalledWith({ start: 0.5, end: 2.5 });
  });

  it('draws the placeholder un-normalised when there are no peaks', async () => {
    render(<EditorWaveSurfer {...baseProps} peaks={null} />);
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    const options = (
      mocks.create.mock.calls[0] as unknown as [{ normalize: boolean }]
    )[0];
    expect(options.normalize).toBe(false);
  });

  it('resizes without re-creating and recolours on theme change', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    const { rerender } = render(<EditorWaveSurfer {...baseProps} />);
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    rerender(<EditorWaveSurfer {...baseProps} height={240} />);
    await waitFor(() =>
      expect(mocks.ws.setOptions).toHaveBeenCalledWith({ height: 240 }),
    );
    expect(mocks.create).toHaveBeenCalledTimes(1);
    document.documentElement.setAttribute('data-theme', 'dark');
    await waitFor(() =>
      expect(mocks.ws.setOptions).toHaveBeenCalledWith(
        expect.objectContaining({ waveColor: expect.any(String) }),
      ),
    );
    expect(mocks.region.setOptions).toHaveBeenCalledWith(
      expect.objectContaining({ color: expect.any(String) }),
    );
    document.documentElement.removeAttribute('data-theme');
  });

  it('calls onFallback when initialisation fails', async () => {
    mocks.create.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const onFallback = vi.fn();
    render(<EditorWaveSurfer {...baseProps} onFallback={onFallback} />);
    await waitFor(() => expect(onFallback).toHaveBeenCalledTimes(1));
  });
});

describe('peak conversion', () => {
  const data: WaveformData = {
    sampleRate: 48000,
    length: 8,
    exact: true,
    channels: [
      {
        raw: null,
        levels: [
          {
            blockSize: 256,
            min: new Float32Array([-0.5, -1]),
            max: new Float32Array([0.5, 1]),
            meanSq: null,
          },
        ],
      },
    ],
  };

  it('interleaves max and min per block', () => {
    const [channel] = dataToWaveSurferPeaks(data)!;
    expect(Array.from(channel!)).toEqual([0.5, -0.5, 1, -1]);
  });

  it('resolves arrays, data and empty input', () => {
    expect(resolveWaveSurferPeaks(null)).toBeNull();
    expect(resolveWaveSurferPeaks([])).toBeNull();
    expect(resolveWaveSurferPeaks([0, 255])).toHaveLength(1);
    expect(resolveWaveSurferPeaks(data)).toHaveLength(1);
  });
});
