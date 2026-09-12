import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  HeaderStyleTabs,
  type HeaderDesignMode,
} from '@tahti-web/components/channel-designer/HeaderStyleTabs';
import { useState } from 'react';

/**
 * Backdrop header style segmented control. Each mode should show exclusive
 * Look content in Channel Designer (Gradient colors vs Solid accents vs
 * Video upload vs Slideshow vs Visualization).
 */
const meta: Meta<typeof HeaderStyleTabs> = {
  title: 'Tahti/Channel/Designer/HeaderStyleTabs',
  component: HeaderStyleTabs,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function Demo({ initial }: { initial: HeaderDesignMode }) {
  const [value, setValue] = useState<HeaderDesignMode>(initial);
  return (
    <div className="flex max-w-md flex-col gap-3">
      <HeaderStyleTabs value={value} onChange={setValue} />
      <p className="text-foreground-secondary text-xs">Selected: {value}</p>
    </div>
  );
}

export const Gradient: Story = {
  render: () => <Demo initial="GRADIENT" />,
};

export const Solid: Story = {
  render: () => <Demo initial="SOLID" />,
};

export const VideoLoop: Story = {
  name: 'Video / image',
  render: () => <Demo initial="VIDEO_LOOP" />,
};

export const Slideshow: Story = {
  render: () => <Demo initial="SLIDESHOW" />,
};

export const Visualization: Story = {
  render: () => <Demo initial="VISUALIZATION" />,
};
