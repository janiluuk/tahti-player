import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useDjPrefsStore } from '../../stores/djPrefsStore';
import { KeyCell } from './KeyCell';

describe('KeyCell', () => {
  it('follows the key notation setting with a wheel colour', () => {
    act(() => useDjPrefsStore.setState({ keyNotation: 'musical' }));
    render(<KeyCell value="8A" />);
    expect(screen.getByText('Am')).toBeInTheDocument();
    expect(screen.getByTestId('key-wheel-dot')).toBeInTheDocument();
    act(() => useDjPrefsStore.setState({ keyNotation: 'openKey' }));
    expect(screen.getByText('1m')).toBeInTheDocument();
    act(() => useDjPrefsStore.setState({ keyNotation: 'camelot' }));
    expect(screen.getByText('8A')).toBeInTheDocument();
  });

  it('shows a dash without a key and raw text it cannot read', () => {
    const { rerender } = render(<KeyCell value={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
    rerender(<KeyCell value="atonal" />);
    expect(screen.getByText('atonal')).toBeInTheDocument();
    expect(screen.queryByTestId('key-wheel-dot')).toBeNull();
  });
});
