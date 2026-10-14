import { render, screen } from '@testing-library/react';

import { HorizontalScroll } from './HorizontalScroll';

function mockWidths(scrollWidth: number, clientWidth: number) {
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(
    scrollWidth,
  );
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(
    clientWidth,
  );
}

describe('HorizontalScroll', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is a named, focusable region when its content is wider than it', () => {
    mockWidths(900, 300);
    render(
      <HorizontalScroll label="Plays by track">
        <table />
      </HorizontalScroll>,
    );
    const region = screen.getByRole('region', { name: 'Plays by track' });
    expect(region).toHaveAttribute('tabindex', '0');
  });

  it('stays out of the tab order when its content fits', () => {
    mockWidths(300, 300);
    render(
      <HorizontalScroll label="Plays by track">
        <table />
      </HorizontalScroll>,
    );
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});
