// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SoundsBulkEditDialog } from './SoundsBulkEditDialog';
import type { StudioSoundsState } from './useStudioSoundsState';

const state = {
  bulkEditOpen: true,
  setBulkEditOpen: vi.fn(),
  selectedIds: new Set(['s1', 's2']),
  applyBulkEdit: vi.fn(),
  facets: { genre: [{ value: 'Ambient', count: 2 }] },
} as unknown as StudioSoundsState;

describe('SoundsBulkEditDialog', () => {
  afterEach(cleanup);

  it('names every select after its field', () => {
    render(<SoundsBulkEditDialog state={state} />);
    for (const name of [
      'Genre',
      'Tags',
      'Visibility',
      'License',
      'Downloads',
      'Comments',
    ]) {
      expect(screen.getByRole('button', { name })).toBeTruthy();
    }
  });
});
