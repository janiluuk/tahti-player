import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ClampedText } from './ClampedText';

function mockTextHeight(scrollHeight: number, clientHeight: number) {
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(
    scrollHeight,
  );
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(
    clientHeight,
  );
}

describe('ClampedText', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows no toggle when the text fits', () => {
    mockTextHeight(40, 40);
    render(<ClampedText>Short bio</ClampedText>);
    expect(screen.getByText('Short bio')).toHaveClass('line-clamp-2');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('expands and collapses text that is cut off', async () => {
    const user = userEvent.setup();
    mockTextHeight(120, 40);
    render(
      <ClampedText lines={3} className="whitespace-pre-wrap">
        A long bio
      </ClampedText>,
    );
    const text = screen.getByText('A long bio');
    expect(text).toHaveClass('line-clamp-3', 'whitespace-pre-wrap');

    const more = screen.getByRole('button', { name: 'Show more' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(more).toHaveAttribute('aria-controls', text.id);

    await user.click(more);
    expect(text).not.toHaveClass('line-clamp-3');
    const less = screen.getByRole('button', { name: 'Show less' });
    expect(less).toHaveAttribute('aria-expanded', 'true');

    await user.click(less);
    expect(text).toHaveClass('line-clamp-3');
    expect(screen.getByRole('button', { name: 'Show more' })).toBeVisible();
  });

  it('uses the labels it is given', () => {
    mockTextHeight(120, 40);
    render(
      <ClampedText moreLabel="Näytä lisää" lessLabel="Näytä vähemmän">
        Pitkä teksti
      </ClampedText>,
    );
    expect(
      screen.getByRole('button', { name: 'Näytä lisää' }),
    ).toBeInTheDocument();
  });
});
