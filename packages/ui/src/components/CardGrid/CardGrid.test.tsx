import { render } from '@testing-library/react';

import { CardGrid } from '.';
import { Card } from '..';

describe('Card grid', () => {
  it('(Snapshot) Renders correctly', () => {
    const { container } = render(
      <CardGrid>
        <Card
          src="https://picsum.photos/300"
          title="Test album"
          subtitle="Test artist"
        />
      </CardGrid>,
    );
    expect(container).toMatchSnapshot();
  });

  it('stretches each card to fill its grid track', () => {
    const { getAllByTestId } = render(
      <CardGrid>
        <Card title="One" />
        <Card title="Two" />
      </CardGrid>,
    );
    for (const card of getAllByTestId('card')) {
      expect(card.dataset.layout).toBe('full');
      expect(card.classList).toContain('w-full');
      expect(card.classList).not.toContain('w-46');
    }
  });
});
