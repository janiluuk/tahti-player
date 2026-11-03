// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ManagerDialogs } from './ManagerDialogs';
import type { StreamManagerState } from './useStreamManagerState';

vi.mock('../StreamOverlayEditor', () => ({ StreamOverlayEditor: () => null }));

describe('ManagerDialogs', () => {
  afterEach(cleanup);

  it('confirms stopping the stream with a red button', () => {
    const handleEnd = vi.fn(async () => undefined);
    const state = {
      overlayModalOpen: false,
      setOverlayModalOpen: vi.fn(),
      setOverlayShowTitle: vi.fn(),
      confirmEndOpen: true,
      setConfirmEndOpen: vi.fn(),
      ending: false,
      handleEnd,
    } as unknown as StreamManagerState;
    render(<ManagerDialogs state={state} />);
    const stop = screen.getByRole('button', { name: 'Stop stream' });
    expect(stop.className).toContain('bg-accent-red');
    fireEvent.click(stop);
    expect(handleEnd).toHaveBeenCalledTimes(1);
  });
});
