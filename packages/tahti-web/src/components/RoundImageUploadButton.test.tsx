import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RoundImageUploadButton } from './RoundImageUploadButton';

const { toast } = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
vi.mock('sonner', () => ({ toast }));

function fileInput() {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

describe('RoundImageUploadButton upload error handling', () => {
  it('does not leave the button stuck busy when the upload throws', async () => {
    const upload = vi.fn().mockRejectedValue(new Error('network down'));
    render(
      <RoundImageUploadButton
        label="Avatar"
        value={null}
        onChange={vi.fn()}
        upload={upload}
      />,
    );

    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    await fireEvent.change(fileInput(), { target: { files: [file] } });
    // Flush the microtask queue the rejected promise resolves on.
    await Promise.resolve();
    await Promise.resolve();

    expect(toast.error).toHaveBeenCalledWith('Could not upload the avatar.');
    expect(screen.getByRole('button', { name: 'Change avatar' })).toBeEnabled();
  });
});
