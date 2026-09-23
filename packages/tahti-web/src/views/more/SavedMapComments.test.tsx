import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMapNotesStore } from '../../stores/mapNotesStore';
import { SavedMapComments } from './SavedMapComments';

const { toast } = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
vi.mock('sonner', () => ({ toast }));

describe('SavedMapComments', () => {
  beforeEach(() => {
    useMapNotesStore.setState({
      comments: [
        {
          id: 'c1',
          kind: 'feature',
          targetId: 'queue',
          title: 'Queue',
          text: 'Needs drag handles',
          submittedAt: '2026-09-23T10:00:00.000Z',
        },
      ],
    });
  });

  afterEach(() => {
    useMapNotesStore.setState({ comments: [] });
    vi.clearAllMocks();
  });

  it('asks before clearing the log', () => {
    render(<SavedMapComments />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear log' }));

    expect(useMapNotesStore.getState().comments).toHaveLength(1);
    expect(screen.getByText('Clear all 1 saved comments?')).toBeInTheDocument();
  });

  it('clears the log and reports it once confirmed', () => {
    render(<SavedMapComments />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear log' }));
    const buttons = screen.getAllByRole('button', { name: 'Clear log' });
    fireEvent.click(buttons[buttons.length - 1]);

    expect(useMapNotesStore.getState().comments).toHaveLength(0);
    expect(toast.success).toHaveBeenCalledWith('Saved comments cleared');
  });

  it('keeps the log when cancelled', () => {
    render(<SavedMapComments />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear log' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(useMapNotesStore.getState().comments).toHaveLength(1);
  });
});
