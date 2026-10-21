import type { Meta, StoryObj } from '@storybook/react-vite';
import { GuideDetail } from '@tahti-web/views/studio/distribution/GuideDetail';

const meta: Meta<typeof GuideDetail> = {
  title: 'Tahti/Studio/Distribution/GuideDetail',
  component: GuideDetail,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLink: Story = {
  args: {
    title: 'Register with a PRO',
    steps: [
      'Pick your collecting society.',
      'Register as writer and publisher.',
      'Add your ISWC codes once works are registered.',
    ],
    href: 'https://www.teosto.fi',
    linkLabel: 'Open Teosto',
  },
};

export const StepsOnly: Story = {
  args: {
    title: 'Get an ISRC',
    steps: ['Ask your distributor.', 'Tag files.'],
  },
};
