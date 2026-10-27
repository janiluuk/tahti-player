import type { Meta, StoryObj } from '@storybook/react-vite';
import { DjSettingsPopover } from '@tahti-web/components/desktop-library/DjSettingsPopover';
import { useDjPrefsStore } from '@tahti-web/stores/djPrefsStore';
import { expect, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta<typeof DjSettingsPopover> = {
  title: 'Tahti/Desktop/DjSettingsPopover',
  component: DjSettingsPopover,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => {
      useDjPrefsStore.setState({
        keyNotation: 'camelot',
        bpmTolerance: 6,
        halfDouble: true,
      });
      return (
        <div className="flex h-[26rem] w-96 justify-end p-4">
          <Story />
        </div>
      );
    },
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'DJ settings' }),
    );
    const body = within(canvasElement.ownerDocument.body);
    const panel = await body.findByTestId('dj-settings');
    await waitFor(() => expect(panel).toBeVisible());
    await expect(body.getByText('Count half and double tempo')).toBeVisible();
  },
};
