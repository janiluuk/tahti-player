import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toastProcessingFailures } from './processingFailureToast';

const { toast } = vi.hoisted(() => ({ toast: { error: vi.fn() } }));
vi.mock('sonner', () => ({ toast }));

const watched = [
  { id: 'a', title: 'Night Drive', status: 'PROCESSING' as const },
  { id: 'b', title: 'Morning Set', status: 'PENDING' as const },
];

describe('toastProcessingFailures', () => {
  beforeEach(() => toast.error.mockReset());

  it('toasts a failed upload with its reason and a link to the sound', () => {
    const openSound = vi.fn();
    toastProcessingFailures(
      [
        { id: 'a', status: 'ERROR', processingError: 'The file is damaged.' },
        { id: 'b', status: 'READY' },
      ],
      watched,
      openSound,
    );
    expect(toast.error).toHaveBeenCalledTimes(1);
    const [message, options] = toast.error.mock.calls[0]!;
    expect(message).toBe('Processing failed: The file is damaged.');
    expect(options.description).toBe('Night Drive');
    options.action.onClick();
    expect(openSound).toHaveBeenCalledWith('a');
  });

  it('still tells the owner when the API gives no reason', () => {
    toastProcessingFailures([{ id: 'b', status: 'ERROR' }], watched, vi.fn());
    expect(toast.error.mock.calls[0]![0]).toBe('Processing failed');
  });

  it('skips ids that are no longer watched', () => {
    toastProcessingFailures(
      [{ id: 'gone', status: 'ERROR', processingError: 'x' }],
      watched,
      vi.fn(),
    );
    expect(toast.error).not.toHaveBeenCalled();
  });
});
