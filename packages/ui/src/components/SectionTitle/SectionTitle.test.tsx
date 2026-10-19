import { render, screen } from '@testing-library/react';

import { SectionTitle } from '.';

describe('SectionTitle', () => {
  it('(Snapshot) renders title, badge, and accent className', () => {
    const { container } = render(
      <div className="flex flex-col gap-4">
        <SectionTitle title="New tracks" />
        <SectionTitle title="On air" badge="Live" badgeColor="green" />
        <SectionTitle
          title="Recently played"
          badge="History"
          badgeColor="yellow"
          className="border-accent-purple/40 border-l-4 pl-3"
        />
      </div>,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders the title and optional badge', () => {
    render(
      <SectionTitle title="Popular tracks" badge="Top" badgeColor="cyan" />,
    );

    expect(screen.getByTestId('section-title')).toHaveTextContent(
      'Popular tracks',
    );
    expect(screen.getByTestId('section-title-badge')).toHaveTextContent('Top');
  });

  it('omits the badge when not provided', () => {
    render(<SectionTitle title="Releases" />);

    expect(screen.queryByTestId('section-title-badge')).not.toBeInTheDocument();
  });
});
