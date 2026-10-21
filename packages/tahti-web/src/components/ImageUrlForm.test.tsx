// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ImageUrlForm } from './ImageUrlForm';

describe('ImageUrlForm', () => {
  afterEach(cleanup);

  it('submits a trimmed http(s) link and clears it on success', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<ImageUrlForm busy={false} onSubmit={onSubmit} />);
    const input = screen.getByLabelText('Image URL') as HTMLInputElement;
    fireEvent.change(input, {
      target: { value: ' https://example.com/cover.jpg ' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Use this image' }));
    });
    expect(onSubmit).toHaveBeenCalledWith('https://example.com/cover.jpg');
    expect(input.value).toBe('');
  });

  it('keeps the link when the image was refused', async () => {
    const onSubmit = vi.fn().mockResolvedValue(false);
    render(<ImageUrlForm busy={false} onSubmit={onSubmit} />);
    const input = screen.getByLabelText('Image URL') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'https://example.com/page' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Use this image' }));
    });
    expect(input.value).toBe('https://example.com/page');
  });

  it('rejects anything that is not a full link', () => {
    render(<ImageUrlForm busy={false} onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Image URL'), {
      target: { value: 'cover.jpg' },
    });
    expect(screen.getByText('Enter a full http(s) link')).toBeTruthy();
    expect(
      (
        screen.getByRole('button', {
          name: 'Use this image',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});
