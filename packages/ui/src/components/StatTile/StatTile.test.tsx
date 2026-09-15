import { render, screen } from '@testing-library/react';

import { StatTile } from './StatTile';

describe('StatTile', () => {
  it('(Snapshot) renders with value and label', () => {
    const { container } = render(
      <StatTile value={42} label="Votes recorded" />,
    );
    expect(container).toMatchSnapshot();
  });

  it('(Snapshot) renders with a sublabel', () => {
    const { container } = render(
      <StatTile
        value={7}
        label="Discussions"
        sublabel="Subjects with comments"
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('does not render a sublabel paragraph when omitted', () => {
    render(<StatTile value={1} label="Comments" />);
    expect(screen.queryByText('Comments')).toBeInTheDocument();
    expect(screen.getByText('Comments').parentElement?.children).toHaveLength(
      2,
    );
  });

  it('merges custom className', () => {
    const { container } = render(
      <StatTile value={1} label="Days" className="custom-class" />,
    );
    expect(container.firstElementChild).toHaveClass('custom-class');
  });
});
