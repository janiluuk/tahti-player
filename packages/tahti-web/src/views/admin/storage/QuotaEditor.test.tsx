// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import * as admin from '../../../api/admin';
import { QuotaEditor } from './shared';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

function openEditor(onSaved = vi.fn()) {
  render(
    <QuotaEditor
      userId="u1"
      quotaBytes={100 * 1024 * 1024}
      displayName="DJ Moonlight"
      onSaved={onSaved}
    />,
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Edit quota for DJ Moonlight' }),
  );
  fireEvent.change(screen.getByLabelText('Quota in MB for DJ Moonlight'), {
    target: { value: '250' },
  });
  fireEvent.submit(
    screen.getByLabelText('Quota in MB for DJ Moonlight').closest('form')!,
  );
  return onSaved;
}

describe('QuotaEditor', () => {
  it('keeps the editor open and says why when the save fails', async () => {
    vi.spyOn(admin, 'setUserStorageQuota').mockResolvedValue({
      ok: false,
      error: 'Forbidden',
    });
    const onSaved = openEditor();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Forbidden'));
    expect(onSaved).not.toHaveBeenCalled();
    expect(
      screen.getByLabelText('Quota in MB for DJ Moonlight'),
    ).toBeInTheDocument();
  });

  it('closes and reloads after a successful save', async () => {
    const save = vi
      .spyOn(admin, 'setUserStorageQuota')
      .mockResolvedValue({ ok: true });
    const onSaved = openEditor();
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(save).toHaveBeenCalledWith('u1', 250 * 1024 * 1024);
    expect(
      screen.queryByLabelText('Quota in MB for DJ Moonlight'),
    ).not.toBeInTheDocument();
  });
});
