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

  it('shows the subtitle as a small secondary line, not a heading', () => {
    render(
      <ViewShell title="Fans" subtitle="People who follow your channel">
        <section>Body</section>
      </ViewShell>,
    );

    const subtitle = screen.getByTestId('subtitle');
    expect(subtitle.tagName).toBe('P');
    expect(subtitle).toHaveClass('text-sm', 'text-foreground-secondary');
    expect(
      screen.queryByRole('heading', { name: 'People who follow your channel' }),
    ).toBeNull();
  });

  it('keeps the subtitle secondary next to header actions too', () => {
    render(
      <ViewShell title="Profile" subtitle="How fans see you" actions={<span />}>
        <section>Body</section>
      </ViewShell>,
    );

    expect(screen.getByTestId('subtitle').tagName).toBe('P');
  });
});
