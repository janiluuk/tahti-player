import { describe, expect, it } from 'vitest';

import {
  emptyHistory,
  HISTORY_LIMIT,
  recordEdit,
  redoEdit,
  undoEdit,
} from './editHistory';
import {
  formatHz,
  fromLogPosition,
  LOG_STEPS,
  toLogPosition,
} from './pluginUi';

describe('edit history', () => {
  it('undoes and redoes in order', () => {
    let history = recordEdit(emptyHistory<number>(), 0, false);
    history = recordEdit(history, 1, false);
    const undo1 = undoEdit(history, 2)!;
    expect(undo1.value).toBe(1);
    const undo2 = undoEdit(undo1.history, undo1.value)!;
    expect(undo2.value).toBe(0);
    expect(undoEdit(undo2.history, undo2.value)).toBeNull();
    const redo = redoEdit(undo2.history, undo2.value)!;
    expect(redo.value).toBe(1);
    expect(redoEdit(redo.history, redo.value)!.value).toBe(2);
  });

  it('coalesced edits share one undo step', () => {
    let history = recordEdit(emptyHistory<number>(), 0, false);
    history = recordEdit(history, 1, true);
    history = recordEdit(history, 2, true);
    expect(undoEdit(history, 3)!.value).toBe(0);
  });

  it('a new edit clears redo, and history is capped', () => {
    let history = recordEdit(emptyHistory<number>(), 0, false);
    const undone = undoEdit(history, 1)!;
    history = recordEdit(undone.history, undone.value, false);
    expect(history.future).toEqual([]);
    for (let i = 0; i < HISTORY_LIMIT + 20; i++) {
      history = recordEdit(history, i, false);
    }
    expect(history.past).toHaveLength(HISTORY_LIMIT);
  });
});

describe('log frequency slider', () => {
  it('maps the ends and round-trips musically useful frequencies', () => {
    expect(fromLogPosition(0)).toBe(20);
    expect(fromLogPosition(LOG_STEPS)).toBe(20000);
    for (const hz of [40, 80, 250, 1000, 4000, 12000]) {
      expect(
        Math.abs(fromLogPosition(toLogPosition(hz)) - hz) / hz,
      ).toBeLessThan(0.01);
    }
  });

  it('gives each decade the same travel', () => {
    const low = toLogPosition(200) - toLogPosition(20);
    const high = toLogPosition(2000) - toLogPosition(200);
    expect(Math.abs(low - high)).toBeLessThanOrEqual(1);
  });

  it('formats Hz and kHz', () => {
    expect(formatHz(80)).toBe('80 Hz');
    expect(formatHz(1250)).toBe('1.25 kHz');
    expect(formatHz(20000)).toBe('20 kHz');
  });
});
