import type { Meta } from '@storybook/react-vite';
import {
  Clock,
  Disc3,
  Download,
  Folder,
  Heart,
  Home,
  Library,
  Mic2,
  Radio,
  Search,
  Settings,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { SidebarNavigation, SidebarNavigationItem } from '@tahti-player/ui';

import { withinBody } from './tahti-web/_lib/play';

const meta = {
  title: 'Navigation/SidebarNavigation',
  component: SidebarNavigation,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SidebarNavigation>;

export default meta;

export const FlatList = () => (
  <div className="bg-background-secondary border-border h-96 w-64 border-(length:--border-width) p-2">
    <SidebarNavigation>
      <SidebarNavigationItem
        icon={<Home size={16} />}
        label="Home"
        isSelected
      />
      <SidebarNavigationItem icon={<Search size={16} />} label="Search" />
      <SidebarNavigationItem icon={<Heart size={16} />} label="Liked Songs" />
      <SidebarNavigationItem
        icon={<Clock size={16} />}
        label="Recently Played"
      />
      <SidebarNavigationItem icon={<Download size={16} />} label="Downloaded" />
      <SidebarNavigationItem icon={<Settings size={16} />} label="Settings" />
    </SidebarNavigation>
  </div>
);

const SECTIONS = [
  { label: 'Home', icon: <Home size={16} /> },
  { label: 'Search', icon: <Search size={16} /> },
  { label: 'Liked Songs', icon: <Heart size={16} /> },
];

/** Items with `onClick` are buttons; the selected one gets the primary fill. */
export const Selectable = {
  render: function SelectableSidebar() {
    const [selected, setSelected] = useState('Home');
    return (
      <div className="bg-background-secondary border-border w-64 border-(length:--border-width) p-2">
        <SidebarNavigation>
          {SECTIONS.map(({ label, icon }) => (
            <SidebarNavigationItem
              key={label}
              icon={icon}
              label={label}
              isSelected={selected === label}
              onClick={() => setSelected(label)}
            />
          ))}
        </SidebarNavigation>
      </div>
    );
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const liked = canvas.getByRole('button', { name: 'Liked Songs' });
    await expect(liked).not.toHaveClass('bg-primary');
    await userEvent.click(liked);
    await expect(liked).toHaveClass('bg-primary');
    await expect(canvas.getByRole('button', { name: 'Home' })).not.toHaveClass(
      'bg-primary',
    );
  },
};

export const CompactMode = () => (
  <div className="bg-background-secondary border-border flex h-[600px] w-[54px] flex-col border-(length:--border-width) p-2">
    <SidebarNavigation isCompact>
      <SidebarNavigationItem icon={<Home size={16} />} label="Home" />
      <SidebarNavigationItem icon={<Search size={16} />} label="Search" />
      <SidebarNavigationItem icon={<Heart size={16} />} label="Liked Songs" />
      <SidebarNavigationItem
        icon={<Clock size={16} />}
        label="Recently Played"
      />
      <SidebarNavigationItem icon={<Download size={16} />} label="Downloaded" />
      <SidebarNavigationItem icon={<Settings size={16} />} label="Settings" />
    </SidebarNavigation>
  </div>
);
// Compact items hide their label, so it moves into the tooltip.
CompactMode.play = async ({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) => {
  const canvas = within(canvasElement);
  const body = withinBody(canvasElement);
  const items = canvas.getAllByTestId('sidebar-navigation-item');
  await expect(canvas.getByText('Liked Songs')).toHaveClass('sr-only');
  await userEvent.hover(items[2]!);
  await expect(await body.findByRole('tooltip')).toHaveTextContent(
    'Liked Songs',
  );
  await userEvent.unhover(items[2]!);
  await waitFor(() => expect(body.queryByRole('tooltip')).toBeNull());
};

export const FullNavigationExample = {
  name: 'Tahti white theme navigation',
  render: () => (
    <div className="bg-background-secondary border-border h-[600px] w-64 overflow-auto border-(length:--border-width) p-2">
      <SidebarNavigation>
        <SidebarNavigationItem
          icon={<Home size={16} />}
          label="Home"
          isSelected
        />
        <SidebarNavigationItem icon={<Search size={16} />} label="Search" />
        <SidebarNavigationItem
          icon={<Library size={16} />}
          label="Your Library"
        />
        <SidebarNavigationItem icon={<Heart size={16} />} label="Liked Songs" />
        <SidebarNavigationItem
          icon={<Clock size={16} />}
          label="Recently Played"
        />
        <SidebarNavigationItem
          icon={<Download size={16} />}
          label="Downloaded"
        />
        <SidebarNavigationItem icon={<Star size={16} />} label="Favorites" />
        <SidebarNavigationItem icon={<Disc3 size={16} />} label="Albums" />
        <SidebarNavigationItem icon={<Mic2 size={16} />} label="Artists" />
        <SidebarNavigationItem icon={<Radio size={16} />} label="Radio" />
        <SidebarNavigationItem icon={<TrendingUp size={16} />} label="Charts" />
        <SidebarNavigationItem
          icon={<Folder size={16} />}
          label="Music Folder"
        />
        <SidebarNavigationItem icon={<Settings size={16} />} label="Settings" />
      </SidebarNavigation>
    </div>
  ),
};
