// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SoundsDialogs } from './SoundsDialogs';
import type { StudioSoundsState } from './useStudioSoundsState';

vi.mock('../../../components/TrackEditDialog', () => ({
  TrackEditDialog: () => null,
}));
vi.mock('../../../components/TrackInsightsPanel', () => ({
  TrackInsightsPanel: () => null,
}));
vi.mock('./SoundsBulkEditDialog', () => ({
  SoundsBulkEditDialog: () => null,
}));

function stateWith(overrides: Partial<StudioSoundsState>) {
  return {
    editingId: null,
    setEditingId: vi.fn(),
    setItems: vi.fn(),
    statsItem: null,
    setStatsItem: vi.fn(),
    pendingDeleteItem: null,
    setPendingDeleteItem: vi.fn(),
    confirmDelete: vi.fn(),
    pendingBulkDelete: false,
    setPendingBulkDelete: vi.fn(),
    confirmBulkDelete: vi.fn(),
    bulkConfirmMismatch: null,
    setBulkConfirmMismatch: vi.fn(),
    confirmBulkMismatch: vi.fn(),
    selectedIds: new Set<string>(),
    ...overrides,
  } as unknown as StudioSoundsState;
}

describe('SoundsDialogs', () => {
  afterEach(cleanup);

  it('confirms a single delete with a red button', () => {
    render(
      <SoundsDialogs
        state={stateWith({
          pendingDeleteItem: { id: 's1', title: 'Night Drive' },
        } as Partial<StudioSoundsState>)}
      />,
    );
    expect(screen.getByText('Delete “Night Drive”?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete' }).className).toContain(
      'bg-accent-red',
    );
  });

  it('confirms a bulk delete with a red button', () => {
    render(
      <SoundsDialogs
        state={stateWith({
          pendingBulkDelete: true,
          selectedIds: new Set(['a', 'b']),
        })}
      />,
    );
    expect(screen.getByText('Delete 2 selected sounds?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete' }).className).toContain(
      'bg-accent-red',
    );
  });

  it('asks to continue when confirmTotal drifts', () => {
    render(
      <SoundsDialogs
        state={stateWith({
          bulkConfirmMismatch: { totalMatched: 7, kind: 'delete' },
        })}
      />,
    );
    expect(screen.getByText('Selection count changed')).toBeTruthy();
    expect(
      screen.getByText(/The library now has 7 matching sounds/),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy();
  });
});
