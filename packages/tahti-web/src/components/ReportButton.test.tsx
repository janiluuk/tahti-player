// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/content-reports';
import { ReportButton } from './ReportButton';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('ReportButton', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('sends a report with a reason and details', async () => {
    const send = vi
      .spyOn(api, 'submitContentReport')
      .mockResolvedValue({ ok: true });
    render(
      <ReportButton
        targetType="SOUND_ITEM"
        targetId="s1"
        label="Night Drive"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Report Night Drive' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Reason/ }));
    });
    await act(async () => {
      fireEvent.click(await screen.findByRole('option', { name: 'Spam' }));
    });
    fireEvent.change(screen.getByLabelText('Details'), {
      target: { value: 'Same upload posted ten times' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
    });
    expect(send).toHaveBeenCalledWith({
      targetType: 'SOUND_ITEM',
      targetId: 's1',
      reason: 'SPAM',
      details: 'Same upload posted ten times',
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it('keeps the dialog open when sending fails', async () => {
    vi.spyOn(api, 'submitContentReport').mockResolvedValue({
      ok: false,
      error: 'Invalid request body',
    });
    render(
      <ReportButton
        targetType="CHANNEL"
        targetId="night-drive"
        label="Tahti"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Report Tahti' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
    });
    expect(toast.error).toHaveBeenCalledWith('Invalid request body');
    expect(screen.getByRole('button', { name: 'Send report' })).toBeTruthy();
  });
});
