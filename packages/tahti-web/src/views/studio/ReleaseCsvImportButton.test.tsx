import { act, fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { importReleasesCsv } from '../../api/release-import';
import { ReleaseCsvImportButton } from './ReleaseCsvImportButton';

vi.mock('../../api/release-import', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/release-import')>()),
  importReleasesCsv: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const CSV =
  'releaseTitle,type,releaseDate,trackTitle\nNights,EP,2026-10-01,Intro';

async function pasteAndImport(onImported = vi.fn()) {
  render(<ReleaseCsvImportButton onImported={onImported} />);
  fireEvent.click(
    screen.getByRole('button', { name: 'Import releases from CSV' }),
  );
  fireEvent.change(await screen.findByLabelText('CSV rows'), {
    target: { value: CSV },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
  });
  return onImported;
}

describe('ReleaseCsvImportButton', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('imports pasted rows and reloads the list', async () => {
    vi.mocked(importReleasesCsv).mockResolvedValue({
      ok: true,
      data: { created: 2, skipped: 1, releaseIds: ['r1', 'r2'], errors: [] },
    });
    const onImported = await pasteAndImport();
    expect(importReleasesCsv).toHaveBeenCalledWith(CSV);
    expect(onImported).toHaveBeenCalled();
    expect(screen.getByText('Created 2, skipped 1.')).toBeTruthy();
    expect(toast.success).toHaveBeenCalledWith('Created 2 releases.');
  });

  it('lists the rows the API could not use', async () => {
    vi.mocked(importReleasesCsv).mockResolvedValue({
      ok: true,
      data: {
        created: 0,
        skipped: 0,
        releaseIds: [],
        errors: ['Row 3: trackTitle is required'],
      },
    });
    const onImported = await pasteAndImport();
    expect(screen.getByText('Row 3: trackTitle is required')).toBeTruthy();
    expect(onImported).not.toHaveBeenCalled();
  });

  it("toasts the API's refusal", async () => {
    vi.mocked(importReleasesCsv).mockResolvedValue({
      ok: false,
      error: 'Maximum 100 releases per import',
    });
    await pasteAndImport();
    expect(toast.error).toHaveBeenCalledWith('Maximum 100 releases per import');
  });
});
