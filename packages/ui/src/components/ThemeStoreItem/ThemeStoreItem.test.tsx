import { render } from '@testing-library/react';

import { ThemeStoreItem } from './ThemeStoreItem';

const DEFAULT_PROPS = {
  name: 'Gruvbox',
  description: 'Retro groove color scheme. Based on the classic Vim theme.',
  author: 'nukeop',
  palette: [
    'oklch(0.96 0.055 96)',
    'oklch(0.28 0.000 263)',
    'oklch(0.62 0.171 46)',
    'oklch(0.34 0.007 48)',
  ] as [string, string, string, string],
  tags: ['retro', 'warm'],
  onInstall: vi.fn(),
};

describe('ThemeStoreItem', () => {
  it('names the theme with the heading level it is given', () => {
    const { getByRole, rerender } = render(
      <ThemeStoreItem {...DEFAULT_PROPS} />,
    );
    expect(getByRole('heading', { level: 3, name: 'Gruvbox' })).toBeTruthy();
    rerender(<ThemeStoreItem {...DEFAULT_PROPS} headingLevel={2} />);
    expect(getByRole('heading', { level: 2, name: 'Gruvbox' })).toBeTruthy();
  });

  it('(Snapshot) renders with all props', () => {
    const { asFragment } = render(<ThemeStoreItem {...DEFAULT_PROPS} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('(Snapshot) renders installed state', () => {
    const { asFragment } = render(
      <ThemeStoreItem
        {...DEFAULT_PROPS}
        isInstalled
        onApply={vi.fn()}
        onUninstall={vi.fn()}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('hides apply and uninstall when those actions are omitted', () => {
    const { queryByTestId } = render(
      <ThemeStoreItem {...DEFAULT_PROPS} isInstalled />,
    );
    expect(queryByTestId('theme-store-item-apply')).toBeNull();
    expect(queryByTestId('theme-store-item-uninstall')).toBeNull();
  });
});
