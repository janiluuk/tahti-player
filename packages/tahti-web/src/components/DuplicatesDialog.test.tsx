// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  NativeDuplicateGroup,
  NativeLibraryTrack,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { DuplicatesDialog } from './DuplicatesDialog';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const track = (id: string) =>
  ({
    id,
    title: `Track ${id}`,
    artist: 'Artist',
    path: `/music/${id}.mp3`,
    sizeBytes: 1000,
    duration: 120,
  }) as unknown as NativeLibraryTrack;

async function renderDialog() {
  const group = {
    kind: 'exact',
    tracks: [track('a'), track('b')],
  } as unknown as NativeDuplicateGroup;
  const library = {
    catalog: {
      duplicates: vi.fn(async () => [group]),
      mergeTracks: vi.fn(async () => ({ removed: 1 })),
    },
    remove: vi.fn(async () => undefined),
  };
  await act(async () => {
    render(
      <DuplicatesDialog
        isOpen
        onClose={() => {}}
        library={library as unknown as TahtiNativeLibrary}
        onChanged={() => {}}
      />,
    );
  });
  return library;
}

describe('DuplicatesDialog', () => {
  afterEach(cleanup);

  it('removes a copy from the library only after a red confirm', async () => {
    const library = await renderDialog();
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Track b from library' }),
    );
    const confirm = screen.getByRole('button', { name: 'Remove' });
    expect(confirm.className).toContain('bg-accent-red');
    expect(library.remove).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(confirm);
    });
    expect(library.remove).toHaveBeenCalledWith('b');
  });

  it('merges the other copies away only after a red confirm', async () => {
    const library = await renderDialog();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Keep Track a at /music/a.mp3 and merge the others into it',
      }),
    );
    const confirm = screen.getByRole('button', { name: 'Merge' });
    expect(confirm.className).toContain('bg-accent-red');
    await act(async () => {
      fireEvent.click(confirm);
    });
    expect(library.catalog.mergeTracks).toHaveBeenCalledWith('a', ['b']);
  });
});
