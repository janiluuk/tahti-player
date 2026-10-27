import { render, screen } from '@testing-library/react';

import { StatTile } from './StatTile';
import { STAT_TONES, statToneClasses } from './statTones';

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

describe('StatTile tone', () => {
  it('shows the metric tone on the left edge and icon chip', () => {
    render(
      <StatTile
        value={12}
        label="Plays"
        tone="blue"
        icon={<svg data-testid="plays-icon" />}
        data-testid="tile"
      />,
    );
    expect(screen.getByTestId('tile')).toHaveClass(
      'border-l-4',
      'border-l-accent-blue-strong',
      'border-border',
    );
    expect(screen.getByTestId('stat-tile-icon')).toHaveClass(
      'bg-accent-blue-strong',
      'text-background',
    );
    expect(screen.getByTestId('plays-icon')).toBeInTheDocument();
  });

  it('keeps the value in foreground ink so it stays readable', () => {
    render(<StatTile value={12} label="Plays" tone="yellow" />);
    expect(screen.getByText('12').className).not.toMatch(/accent|primary/);
  });

  it('draws no edge without a tone', () => {
    render(<StatTile value={3} label="Comments" data-testid="tile" />);
    expect(screen.getByTestId('tile')).not.toHaveClass('border-l-4');
  });

  it('builds every tone from the -strong theme tokens', () => {
    for (const tone of STAT_TONES) {
      const classes = statToneClasses[tone];
      const token = tone === 'primary' ? 'primary' : `accent-${tone}`;
      expect(classes).toEqual({
        text: `text-${token}-strong`,
        fill: `bg-${token}-strong`,
        chip: `bg-${token}-strong text-background`,
        edge: `border-l-${token}-strong`,
      });
    }
  });
});
