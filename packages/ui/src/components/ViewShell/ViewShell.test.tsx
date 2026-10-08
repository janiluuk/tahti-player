import { render, screen } from '@testing-library/react';

import { ViewShell } from './ViewShell';

describe('ViewShell', () => {
  it('puts the content classes on the column the children sit in', () => {
    render(
      <ViewShell title="Governance" classes={{ content: 'gap-6' }}>
        <section data-testid="first">First</section>
        <section>Second</section>
      </ViewShell>,
    );

    expect(screen.getByTestId('first').parentElement).toHaveClass('gap-6');
  });

  it('keeps the scrollable area classes on the frame, not the column', () => {
    render(
      <ViewShell title="News" classes={{ scrollableArea: 'px-4' }}>
        <section data-testid="first">First</section>
      </ViewShell>,
    );

    const column = screen.getByTestId('first').parentElement;
    expect(column).not.toHaveClass('px-4');
    expect(column?.parentElement).toHaveClass('px-4');
  });
});
