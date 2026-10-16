import { render, screen } from '@testing-library/react';

import { AmbientCard } from '.';
import { labelTone } from './useDominantColor';

describe('AmbientCard', () => {
  it('(Snapshot) renders with a forced ambient tint', () => {
    const { container } = render(
      <AmbientCard
        src="https://picsum.photos/id/1015/300"
        title="Glass Mesa"
        subtitle="Northern Lights"
        ambientRgb={[40, 90, 140]}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('puts the title and subtitle on a glass label', () => {
    render(
      <AmbientCard
        title="Readable Label"
        subtitle="On frosted glass"
        ambientRgb={[30, 30, 30]}
      />,
    );
    expect(screen.getByTestId('ambient-card-label')).toBeTruthy();
    expect(screen.getByTestId('ambient-card-title').textContent).toBe(
      'Readable Label',
    );
    expect(screen.getByText('On frosted glass')).toBeTruthy();
  });

  it('picks light glass for bright covers and dark glass for dark ones', () => {
    expect(labelTone([240, 230, 210])).toBe('light');
    expect(labelTone([20, 24, 40])).toBe('dark');
    expect(labelTone(null)).toBe('dark');
  });
});
