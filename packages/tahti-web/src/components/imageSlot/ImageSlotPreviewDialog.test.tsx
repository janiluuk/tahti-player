// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ImageSlotPreviewDialog } from './ImageSlotPreviewDialog';

describe('ImageSlotPreviewDialog', () => {
  afterEach(cleanup);

  it('confirms removing the image with a red button', () => {
    const onConfirmDelete = vi.fn();
    render(
      <ImageSlotPreviewDialog
        isOpen
        confirmOpen
        onClose={vi.fn()}
        label="Banner"
        src="https://example.test/banner.jpg"
        onChangeClick={vi.fn()}
        onRequestDelete={vi.fn()}
        onCancelDelete={vi.fn()}
        onConfirmDelete={onConfirmDelete}
      />,
    );
    expect(screen.getByText('Remove banner?')).toBeTruthy();
    const confirm = screen.getByRole('button', { name: 'Remove' });
    expect(confirm.className).toContain('bg-accent-red');
    fireEvent.click(confirm);
    expect(onConfirmDelete).toHaveBeenCalledTimes(1);
  });
});
