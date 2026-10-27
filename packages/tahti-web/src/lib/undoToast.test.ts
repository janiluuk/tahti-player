import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { toastWithUndo } from './undoToast';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

function clickUndo() {
  const options = vi.mocked(toast.success).mock.calls[0]?.[1] as {
    action: { label: string; onClick: () => void };
  };
  expect(options.action.label).toBe('Undo');
  options.action.onClick();
}

describe('toastWithUndo', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the message with an Undo action that reverts and confirms', async () => {
    const onUndone = vi.fn();
    const undo = vi.fn().mockResolvedValue({ ok: true, data: 'draft' });
    toastWithUndo('Published.', {
      undo,
      undoneMessage: 'Back to draft.',
      onUndone,
    });
    expect(toast.success).toHaveBeenCalledWith(
      'Published.',
      expect.objectContaining({ duration: expect.any(Number) }),
    );

    clickUndo();

    await vi.waitFor(() =>
      expect(toast.success).toHaveBeenLastCalledWith('Back to draft.'),
    );
    expect(undo).toHaveBeenCalledOnce();
    expect(onUndone).toHaveBeenCalledWith({ ok: true, data: 'draft' });
  });

  it('reports a refused undo and leaves the state alone', async () => {
    const onUndone = vi.fn();
    toastWithUndo('Created.', {
      undo: () => Promise.resolve({ ok: false, error: 'Release not found' }),
      undoneMessage: 'Removed.',
      onUndone,
    });

    clickUndo();

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Release not found'),
    );
    expect(onUndone).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledOnce();
  });

  it('reports a thrown undo', async () => {
    toastWithUndo('Created.', {
      undo: () => Promise.reject(new Error('offline')),
      undoneMessage: 'Removed.',
    });

    clickUndo();

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith('offline'));
  });
});
