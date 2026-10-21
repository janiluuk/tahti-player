// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProcessingFailedAlert } from './ProcessingFailedAlert';

const { retrySoundProcessing, toast } = vi.hoisted(() => ({
  retrySoundProcessing: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('../../../api/studio', () => ({ retrySoundProcessing }));
vi.mock('sonner', () => ({ toast }));

describe('ProcessingFailedAlert', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows the reason and retries', async () => {
    retrySoundProcessing.mockResolvedValue({ ok: true });
    const onRetried = vi.fn();
    render(
      <ProcessingFailedAlert
        item={{
          id: 's1',
          title: 'Night Drive',
          status: 'ERROR',
          processingError: 'The file is damaged.',
        }}
        onRetried={onRetried}
      />,
    );
    expect(
      screen.getByText('Processing failed: The file is damaged.'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Retry processing/ }));
    await waitFor(() => expect(onRetried).toHaveBeenCalledWith('s1'));
  });

  it('keeps the sound failed and says why when the retry is refused', async () => {
    retrySoundProcessing.mockResolvedValue({
      ok: false,
      error: 'Only a sound that failed processing can be retried',
    });
    const onRetried = vi.fn();
    render(
      <ProcessingFailedAlert
        item={{
          id: 's1',
          title: 'Night Drive',
          status: 'ERROR',
          processingError: null,
        }}
        onRetried={onRetried}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Retry processing/ }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Only a sound that failed processing can be retried',
      ),
    );
    expect(onRetried).not.toHaveBeenCalled();
  });
});
