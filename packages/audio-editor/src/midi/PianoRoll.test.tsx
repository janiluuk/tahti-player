import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { PianoNote } from './noteEditing';
import { PianoRoll } from './PianoRoll';

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
let latest: PianoNote[] = [];

function Harness({ initial }: { initial: PianoNote[] }) {
  const [notes, setNotes] = useState(initial);
  const [selected, setSelected] = useState<string | null>(null);
  latest = notes;
  return (
    <PianoRoll
      notes={notes}
      onChange={setNotes}
      lengthBeats={8}
      gridBeats={0.5}
      lowPitch={48}
      highPitch={72}
      pxPerBeat={40}
      rowHeight={10}
      selectedId={selected}
      onSelect={setSelected}
    />
  );
}

const render = (initial: PianoNote[] = []) =>
  act(() => {
    root.render(<Harness initial={initial} />);
  });

const pointer = (el: Element, type: string, clientX: number, clientY: number) =>
  act(() => {
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX, clientY }));
  });

const key = (el: Element, k: string, shiftKey = false) =>
  act(() => {
    el.dispatchEvent(
      new KeyboardEvent('keydown', { key: k, shiftKey, bubbles: true }),
    );
  });

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  latest = [];
});

describe('PianoRoll', () => {
  it('adds a grid-length note in the clicked cell', () => {
    render();
    const grid = host.querySelector('[role="grid"]')!;
    pointer(grid, 'pointerdown', 95, 125);
    expect(latest).toHaveLength(1);
    expect(latest[0]).toMatchObject({ pitch: 60, start: 2, duration: 0.5 });
    expect(
      host.querySelector('[role="gridcell"]')?.getAttribute('aria-label'),
    ).toBe('C4 at beat 3, 0.5 beats');
  });

  it('drags a note to a new pitch and snapped beat', () => {
    render([{ id: 'a', pitch: 60, start: 0, duration: 1, velocity: 100 }]);
    const cell = host.querySelector('[role="gridcell"]')!;
    pointer(cell, 'pointerdown', 0, 0);
    pointer(cell, 'pointermove', 47, -21);
    pointer(cell, 'pointerup', 47, -21);
    expect(latest[0]).toMatchObject({ pitch: 62, start: 1, duration: 1 });
  });

  it('resizes from the right-edge handle', () => {
    render([{ id: 'a', pitch: 60, start: 0, duration: 1, velocity: 100 }]);
    const handle = host.querySelector('[data-resize="true"]')!;
    pointer(handle, 'pointerdown', 0, 0);
    pointer(handle, 'pointermove', 61, 30);
    expect(latest[0]).toMatchObject({ pitch: 60, start: 0, duration: 2.5 });
  });

  it('moves, resizes and deletes the focused note from the keyboard', () => {
    render([{ id: 'a', pitch: 60, start: 1, duration: 1, velocity: 100 }]);
    const cell = () => host.querySelector('[role="gridcell"]')!;
    key(cell(), 'ArrowUp');
    key(cell(), 'ArrowRight');
    key(cell(), 'ArrowRight', true);
    expect(latest[0]).toMatchObject({ pitch: 61, start: 1.5, duration: 1.5 });
    key(cell(), 'ArrowUp', true);
    expect(latest[0].pitch).toBe(72);
    key(cell(), 'Delete');
    expect(latest).toEqual([]);
  });
});
