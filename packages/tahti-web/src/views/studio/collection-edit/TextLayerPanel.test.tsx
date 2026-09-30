import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../api/collection-text-layer';
import { TextLayerPanel } from './TextLayerPanel';

describe('TextLayerPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the saved layer and saves edits', async () => {
    vi.spyOn(api, 'fetchCollectionTextLayer').mockResolvedValue({
      ok: true,
      data: {
        textLayerMode: 'COSMIC_NEON',
        textLayerText: 'Night drive',
        textLayerAlign: 'CENTER',
      },
    });
    const save = vi
      .spyOn(api, 'saveCollectionTextLayer')
      .mockImplementation(async (_slug, layer) => ({ ok: true, data: layer }));
    const success = vi.spyOn(toast, 'success');

    render(<TextLayerPanel slug="night-mix" />);

    const input = await screen.findByDisplayValue('Night drive');
    fireEvent.change(input, { target: { value: 'Out now' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save text layer' }));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('night-mix', {
        textLayerMode: 'COSMIC_NEON',
        textLayerText: 'Out now',
        textLayerAlign: 'CENTER',
      }),
    );
    expect(success).toHaveBeenCalledWith('Text layer saved.');
    expect(screen.getByLabelText('Channel text overlay').textContent).toBe(
      'Out now',
    );
  });

  it('asks for text before saving an effect', async () => {
    vi.spyOn(api, 'fetchCollectionTextLayer').mockResolvedValue({
      ok: true,
      data: {
        textLayerMode: 'GHOST_ECHO',
        textLayerText: '',
        textLayerAlign: 'CENTER',
      },
    });
    const save = vi.spyOn(api, 'saveCollectionTextLayer');
    const error = vi.spyOn(toast, 'error');

    render(<TextLayerPanel slug="night-mix" />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Save text layer' }),
    );

    expect(error).toHaveBeenCalledWith(
      'Add some text or pick "None" as the effect.',
    );
    expect(save).not.toHaveBeenCalled();
  });
});
