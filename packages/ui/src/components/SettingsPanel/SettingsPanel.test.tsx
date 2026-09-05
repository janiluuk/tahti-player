import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  BlocksIcon,
  PaletteIcon,
  ScrollTextIcon,
  Settings2Icon,
} from 'lucide-react';

import { SettingsPanel, SettingsTab } from './SettingsPanel';

const TABS: SettingsTab[] = [
  {
    id: 'general',
    label: 'General',
    icon: <Settings2Icon />,
    content: () => <div>General content</div>,
  },
  {
    id: 'plugins',
    label: 'Plugins',
    icon: <BlocksIcon />,
    content: () => <div>Plugins content</div>,
  },
  {
    id: 'themes',
    label: 'Themes',
    icon: <PaletteIcon />,
    content: () => <div>Themes content</div>,
  },
  {
    id: 'logs',
    label: 'Logs',
    icon: <ScrollTextIcon />,
    content: () => <div>Log viewer content</div>,
  },
];

describe('SettingsPanel', () => {
  it('(Snapshot) renders when open', () => {
    const { asFragment } = render(
      <SettingsPanel
        isOpen
        onClose={() => {}}
        tabs={TABS}
        activeTab="general"
        onTabChange={() => {}}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('starts on the section list and hides content until a tab is chosen', () => {
    render(
      <SettingsPanel
        isOpen
        onClose={() => {}}
        tabs={TABS}
        activeTab="general"
        onTabChange={() => {}}
      />,
    );

    expect(screen.getByTestId('settings-panel-nav')).toBeVisible();
    expect(screen.getByTestId('settings-panel-content')).not.toBeVisible();
  });

  it('swaps to section content on mobile after choosing a tab, and back via Back', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();

    render(
      <SettingsPanel
        isOpen
        onClose={() => {}}
        tabs={TABS}
        activeTab="general"
        onTabChange={onTabChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Plugins' }));
    expect(onTabChange).toHaveBeenCalledWith('plugins');

    expect(screen.getByTestId('settings-panel-nav')).not.toBeVisible();
    const content = screen.getByTestId('settings-panel-content');
    expect(content).toBeVisible();
    expect(
      within(content).getByRole('button', {
        name: 'Back to settings sections',
      }),
    ).toBeVisible();

    await user.click(
      screen.getByRole('button', { name: 'Back to settings sections' }),
    );
    expect(screen.getByTestId('settings-panel-nav')).toBeVisible();
    expect(screen.getByTestId('settings-panel-content')).not.toBeVisible();
  });
});
