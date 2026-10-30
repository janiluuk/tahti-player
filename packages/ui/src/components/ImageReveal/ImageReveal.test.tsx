import { act, render, screen } from '@testing-library/react';

import { ImageReveal } from './ImageReveal';

vi.unmock('motion/react');

const dispatchImageEvent = (type: 'load' | 'error') => {
  act(() => {
    screen.getByRole('img').dispatchEvent(new Event(type));
  });
};

describe('ImageReveal', () => {
  it('shows previously loaded artwork immediately after navigating back', () => {
    const { unmount } = render(
      <ImageReveal src="/cached-cover.jpg" alt="Cover" placeholder="Loading" />,
    );
    expect(screen.getByText('Loading')).toBeInTheDocument();
    dispatchImageEvent('load');
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    unmount();

    render(
      <ImageReveal src="/cached-cover.jpg" alt="Cover" placeholder="Loading" />,
    );
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    expect(screen.getByRole('img')).toBeVisible();
    expect(screen.getByRole('img').style.opacity).not.toBe('0');
  });

  it('resets loading and error state when the artwork changes', () => {
    const { rerender } = render(
      <ImageReveal src="/first-cover.jpg" alt="Cover" placeholder="Loading" />,
    );
    dispatchImageEvent('load');
    rerender(
      <ImageReveal src="/second-cover.jpg" alt="Cover" placeholder="Loading" />,
    );
    expect(screen.getByText('Loading')).toBeInTheDocument();
    dispatchImageEvent('error');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    rerender(
      <ImageReveal src="/first-cover.jpg" alt="Cover" placeholder="Loading" />,
    );
    expect(screen.getByRole('img')).toBeVisible();
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
  });

  it('invalidates failed cached artwork and retries on the next visit', () => {
    const props = {
      src: '/retry-cover.jpg',
      alt: 'Cover',
      placeholder: 'Loading',
    };
    const first = render(<ImageReveal {...props} />);
    dispatchImageEvent('load');
    first.unmount();
    const second = render(<ImageReveal {...props} />);
    dispatchImageEvent('error');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    second.unmount();
    render(<ImageReveal {...props} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByText('Loading')).toBeInTheDocument();
    dispatchImageEvent('load');
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
  });

  it('bounds retained artwork and evicts the oldest loaded image', () => {
    const { rerender } = render(
      <ImageReveal src="/bounded-0.jpg" alt="Cover" placeholder="Loading" />,
    );
    dispatchImageEvent('load');
    for (let i = 1; i <= 64; i++) {
      rerender(
        <ImageReveal
          src={`/bounded-${i}.jpg`}
          alt="Cover"
          placeholder="Loading"
        />,
      );
      dispatchImageEvent('load');
    }
    rerender(
      <ImageReveal src="/bounded-0.jpg" alt="Cover" placeholder="Loading" />,
    );
    expect(screen.getByText('Loading')).toBeInTheDocument();
    rerender(
      <ImageReveal src="/bounded-64.jpg" alt="Cover" placeholder="Loading" />,
    );
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
  });
});
