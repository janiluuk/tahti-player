// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PanelHeader } from './PanelHeader';
import type { StreamManagerState } from './useStreamManagerState';

function stateFor(playerState: string): StreamManagerState {
  return {
    rotationPlaying: false,
    playerState,
    outputLabel: 'Offline',
    canControl: true,
    signalConnected: false,
    transportBusy: null,
    handleTransport: vi.fn(),
    rotation: null,
    durationSec: null,
    elapsedSinceObserved: 0,
    collections: [{ id: 'c1' }],
    openPlaylistDialog: vi.fn(),
    rotationExpanded: false,
    setRotationExpanded: vi.fn(),
    isPlaying: false,
    ending: false,
    setConfirmEndOpen: vi.fn(),
  } as unknown as StreamManagerState;
}

describe('PanelHeader', () => {
  afterEach(cleanup);

  it('starts the offline label at the title edge when there is no state dot', () => {
    render(<PanelHeader state={stateFor('Offline')} />);
    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();
    expect(status).not.toHaveClass('mr-2');
    expect(status.parentElement).not.toHaveClass('gap-2');
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('spaces the label from the live dot', () => {
    render(<PanelHeader state={stateFor('Live')} />);
    expect(screen.getByRole('status')).toHaveClass('mr-2');
  });

  it('keeps the edit button in the title row on phones', () => {
    render(<PanelHeader state={stateFor('Offline')} />);
    const actions = screen.getByTestId('stream-manager-actions');
    expect(actions).toHaveClass('order-1', 'sm:order-4');
    expect(
      screen.getByRole('button', { name: 'Edit playlist' }),
    ).toBeInTheDocument();
  });
});
