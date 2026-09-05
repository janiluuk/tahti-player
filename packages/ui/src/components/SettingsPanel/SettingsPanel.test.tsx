import { render, screen } from '@testing-library/react';
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

const classTokens = (element: HTMLElement) => element.className.split(/\s+/);

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

  it('starts in list mode: nav flex, content hidden (mobile list-first)', () => {
    render(
      <SettingsPanel
        isOpen
        onClose={() => {}}
        tabs={TABS}
        activeTab="general"
        onTabChange={() => {}}
      />,
    );

    expect(classTokens(screen.getByTestId('settings-panel-nav'))).toContain(
      'flex',
    );
    expect(classTokens(screen.getByTestId('settings-panel-content'))).toContain(
      'hidden',
    );
  });

  it('enters detail mode after a tab click and returns to list on Back', async () => {
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

    expect(classTokens(screen.getByTestId('settings-panel-nav'))).toContain(
      'hidden',
    );
    expect(classTokens(screen.getByTestId('settings-panel-content'))).toContain(
      'flex',
    );
    expect(
      screen.getByRole('button', { name: 'Back to settings sections' }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Back to settings sections' }),
    );
    expect(classTokens(screen.getByTestId('settings-panel-nav'))).toContain(
      'flex',
    );
    expect(classTokens(screen.getByTestId('settings-panel-content'))).toContain(
      'hidden',
    );
  });

  it('does not force nav visible with unconditional flex! (regression)', () => {
    render(
      <SettingsPanel
        isOpen
        onClose={() => {}}
        tabs={TABS}
        activeTab="general"
        onTabChange={() => {}}
      />,
    );

    const navClass = screen.getByTestId('settings-panel-nav').className;
    expect(navClass.split(/\s+/)).not.toContain('flex!');
    expect(navClass).toMatch(/sm:flex!/);
  });
});
