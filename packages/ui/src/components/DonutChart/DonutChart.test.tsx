import { render, screen } from '@testing-library/react';

import { DonutChart } from './DonutChart';

const segments = [
  { id: 'a', value: 30, color: '#f00' },
  { id: 'b', value: 70, color: '#0f0' },
];

describe('DonutChart', () => {
  it('(Snapshot) renders segments with a center value', () => {
    const { container } = render(
      <DonutChart
        segments={segments}
        centerLabel="Total"
        centerValue="100 GB"
        aria-label="Storage breakdown"
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('builds a conic-gradient proportional to segment values', () => {
    render(<DonutChart segments={segments} aria-label="chart" />);
    const chart = screen.getByRole('img', { name: 'chart' });
    expect(chart.style.background).toContain('#f00 0% 30%');
    expect(chart.style.background).toContain('#0f0 30% 100%');
  });

  it('omits the background gradient when total value is 0', () => {
    render(
      <DonutChart
        segments={[{ id: 'a', value: 0, color: '#f00' }]}
        aria-label="empty"
      />,
    );
    expect(screen.getByRole('img', { name: 'empty' }).style.background).toBe(
      '',
    );
  });

  it('does not render a center block without centerLabel/centerValue', () => {
    const { container } = render(
      <DonutChart segments={segments} aria-label="chart" />,
    );
    expect(container.querySelector('.bg-background')).toBeNull();
  });
});
