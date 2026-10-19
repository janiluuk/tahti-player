import { render, screen } from '@testing-library/react';

import { Card } from '.';

describe('Card', () => {
  it('(Snapshot) renders correctly', async () => {
    const { container } = render(
      <Card
        src="https://picsum.photos/300"
        title="Test album"
        subtitle="Test artist"
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('(Snapshot) renders the neutral surface', async () => {
    const { container } = render(
      <Card
        src="https://picsum.photos/300"
        title="Test album"
        subtitle="Test artist"
        surface="neutral"
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('defaults to the brand surface and accepts neutral', () => {
    const { rerender } = render(
      <Card src="https://picsum.photos/300" title="Brand" />,
    );
    expect(screen.getByTestId('card')).toHaveAttribute('data-surface', 'brand');
    expect(screen.getByTestId('card').className).toMatch(/bg-primary/);

    rerender(
      <Card
        src="https://picsum.photos/300"
        title="Neutral"
        surface="neutral"
      />,
    );
    expect(screen.getByTestId('card')).toHaveAttribute(
      'data-surface',
      'neutral',
    );
    expect(screen.getByTestId('card').className).toMatch(
      /bg-background-secondary/,
    );
  });
});
