// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useThemeStore } from '../../../plugins/themes';
import { ThemesPanel } from './ThemesPanel';

describe('ThemesPanel selected theme', () => {
  const initial = useThemeStore.getState();

  beforeEach(() => {
    const [, second] = initial.themes;
    useThemeStore.setState({ themeId: second!.id });
  });

  afterEach(() => {
    cleanup();
    useThemeStore.setState({ themeId: initial.themeId });
  });

  it('marks only the active theme and announces it above the list', () => {
    const [first, second] = useThemeStore.getState().themes;
    render(<ThemesPanel />);

    expect(screen.getByRole('status')).toHaveTextContent(
      `Current theme: ${second!.name}`,
    );
    const current = screen.getAllByRole('group', { current: true });
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName(second!.name);
    expect(within(current[0]!).getByText('Active')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `Apply ${second!.name}` }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: `Apply ${first!.name}` }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('moves the selection when another theme is applied', () => {
    const [first] = useThemeStore.getState().themes;
    render(<ThemesPanel />);

    fireEvent.click(
      screen.getByRole('button', { name: `Apply ${first!.name}` }),
    );

    expect(useThemeStore.getState().themeId).toBe(first!.id);
    expect(screen.getByRole('group', { current: true })).toHaveAccessibleName(
      first!.name,
    );
  });
});
