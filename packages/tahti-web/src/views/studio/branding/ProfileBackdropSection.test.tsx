// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../api/profile-backdrop';
import { ProfileBackdropSection } from './ProfileBackdropSection';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('ProfileBackdropSection', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('uploads a backdrop', async () => {
    const upload = vi.spyOn(api, 'uploadProfileBackdrop').mockResolvedValue({
      ok: true,
      data: { backdropUrl: 'https://cdn/b.jpg' },
    });
    const onChange = vi.fn();
    const { container } = render(
      <ProfileBackdropSection backdropUrl={null} onChange={onChange} />,
    );
    const file = new File(['x'], 'b.jpg', { type: 'image/jpeg' });
    await act(async () => {
      fireEvent.change(container.querySelector('input[type="file"]')!, {
        target: { files: [file] },
      });
    });
    expect(upload).toHaveBeenCalledWith(file);
    expect(onChange).toHaveBeenCalledWith('https://cdn/b.jpg');
  });

  it('removes the current backdrop', async () => {
    vi.spyOn(api, 'removeProfileBackdrop').mockResolvedValue({ ok: true });
    const onChange = vi.fn();
    render(
      <ProfileBackdropSection
        backdropUrl="https://cdn/b.jpg"
        onChange={onChange}
      />,
    );
    expect(screen.getByTestId('profile-backdrop')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove backdrop' }));
    });
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
