import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListenerWorldMap } from '@tahti-web/components/ListenerWorldMap';

const meta: Meta<typeof ListenerWorldMap> = {
  title: 'Tahti/Widgets/ListenerWorldMap',
  component: ListenerWorldMap,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_DATA = [
  { countryCode: 'FI', displayName: 'Finland', count: 4820 },
  { countryCode: 'SE', displayName: 'Sweden', count: 1930 },
  { countryCode: 'DE', displayName: 'Germany', count: 1204 },
  { countryCode: 'US', displayName: 'United States', count: 980 },
  { countryCode: 'GB', displayName: 'United Kingdom', count: 640 },
  { countryCode: 'NO', displayName: 'Norway', count: 512 },
  { countryCode: 'EE', displayName: 'Estonia', count: 340 },
  { countryCode: 'NL', displayName: 'Netherlands', count: 290 },
  { countryCode: 'FR', displayName: 'France', count: 210 },
  { countryCode: 'JP', displayName: 'Japan', count: 145 },
  { countryCode: 'BR', displayName: 'Brazil', count: 98 },
];

export const Default: Story = {
  args: {
    data: SAMPLE_DATA,
    countLabel: 'listeners',
  },
};

export const Loading: Story = {
  args: {
    data: SAMPLE_DATA,
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    data: [],
  },
};

export const Compact: Story = {
  args: {
    data: SAMPLE_DATA,
    compact: true,
  },
};
