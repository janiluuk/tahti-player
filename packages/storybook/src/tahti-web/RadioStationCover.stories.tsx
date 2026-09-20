import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioStationCover } from '@tahti-web/components/RadioStationCover';

import { MOCK_USERS, withMockAuth } from './_lib/decorators';

const meta: Meta<typeof RadioStationCover> = {
  title: 'Tahti/Widgets/RadioStationCover',
  component: RadioStationCover,
  parameters: { layout: 'centered' },
  args: {
    src: 'https://picsum.photos/seed/radio-helsinki/200',
    label: 'Radio Helsinki',
    stationName: 'Radio Helsinki',
    catalogStationId: 'radio-helsinki',
    className: 'h-28 w-28 overflow-hidden rounded-lg',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AdminHoverEdit: Story = {
  decorators: [withMockAuth(MOCK_USERS.board)],
};

export const ListenerNoEdit: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
};
