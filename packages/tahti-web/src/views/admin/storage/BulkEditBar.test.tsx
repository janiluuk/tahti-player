// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../../api/admin';
import { BulkEditBar, bulkPatchFromChoices } from './BulkEditBar';

describe('bulkPatchFromChoices', () => {
  it('only sends the fields that were changed', () => {
    expect(
      bulkPatchFromChoices({
        genre: '',
        contentType: '',
        visibility: '',
        license: '',
      }),
    ).toEqual({});
    expect(
      bulkPatchFromChoices({
        genre: '__clear__',
        contentType: 'TRACK',
        visibility: 'private',
        license: 'CC_BY',
      }),
    ).toEqual({
      genre: null,
      contentType: 'TRACK',
      isPublic: false,
      license: 'CC_BY',
    });
  });
});

describe('bulkPatchAdminFiles', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('refuses an empty change or more than 200 files before sending', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(admin.bulkPatchAdminFiles(['a'], {})).resolves.toMatchObject({
      ok: false,
    });
    await expect(
      admin.bulkPatchAdminFiles(
        Array.from({ length: 201 }, (_, index) => `f${index}`),
        { isPublic: true },
      ),
    ).resolves.toMatchObject({ ok: false });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('patches the ids and the changes together', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ updated: 2 }), { status: 200 }),
      );
    await expect(
      admin.bulkPatchAdminFiles(['a', 'b'], { isPublic: false }),
    ).resolves.toEqual({ ok: true, updated: 2 });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/tahti-api/api/admin/files/bulk');
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(String(init?.body))).toEqual({
      ids: ['a', 'b'],
      isPublic: false,
    });
  });
});

describe('BulkEditBar', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('keeps Apply disabled until something is changed', () => {
    const onClear = vi.fn();
    render(
      <BulkEditBar
        selectedIds={['a', 'b']}
        facets={{ users: [], genres: [], contentTypes: [] }}
        onClear={onClear}
        onApplied={vi.fn()}
      />,
    );
    expect(screen.getByText('2 files selected')).toBeTruthy();
    expect(
      screen
        .getByRole('button', { name: 'Apply to 2' })
        .hasAttribute('disabled'),
    ).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onClear).toHaveBeenCalled();
  });
});
