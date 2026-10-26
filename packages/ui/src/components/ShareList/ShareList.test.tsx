import { render, screen } from '@testing-library/react';

import { ShareList } from './ShareList';

const items = [
  { id: 'chrome', label: 'Chrome', share: 0.6 },
  { id: 'firefox', label: 'Firefox', share: 0.3 },
  { id: 'other', label: 'Other', share: 0.1 },
];

describe('ShareList', () => {
  it('(Snapshot) renders a titled list', () => {
    const { container } = render(<ShareList title="Browser" items={items} />);
    expect(container).toMatchSnapshot();
  });

  it('shows each name with its share and a meter scaled to the largest', () => {
    render(<ShareList items={items} />);
    expect(screen.getAllByTestId('share-list-row')).toHaveLength(3);
    expect(screen.getByText('60 %')).toBeInTheDocument();
    const meters = screen.getAllByRole('meter');
    expect(meters[0]).toHaveAttribute('aria-valuemax', '0.6');
    expect(meters[1]).toHaveAccessibleName('Firefox 30 %');
  });

  it('shows one decimal for shares under 10 %', () => {
    render(<ShareList items={[{ id: 'edge', label: 'Edge', share: 0.042 }]} />);
    expect(screen.getByText('4.2 %')).toBeInTheDocument();
  });

  it('says so when there is nothing to list', () => {
    render(
      <ShareList
        title="City"
        items={[]}
        emptyLabel="Not enough listeners yet."
      />,
    );
    expect(screen.getByText('Not enough listeners yet.')).toBeInTheDocument();
    expect(screen.queryByRole('meter')).toBeNull();
  });
});
