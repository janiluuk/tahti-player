import type { Meta, StoryObj } from '@storybook/react-vite';
import { mockEvents } from '@tahti-web/api/events';
import { EventParticipantsEditor } from '@tahti-web/components/events/EventParticipantsEditor';
import { expect, fn, userEvent, within } from 'storybook/test';

const event = mockEvents.find((row) => row.id === 'evt-mock-2')!;

const meta: Meta<typeof EventParticipantsEditor> = {
  title: 'Tahti/Events/EventParticipantsEditor',
  component: EventParticipantsEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Tag other Tahti accounts on an event with a role each (`PUT /api/me/events/:id/participants`). New tags are invites that show as Pending until accepted.',
      },
    },
  },
  args: { event, onSaved: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Tagged: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Northern Signals')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Save tags' }),
    ).toBeDisabled();
  },
};

export const AddSomeone: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Tag someone'), 'midnight');
    await userEvent.click(
      await canvas.findByRole('button', { name: /Midnight Cartography/ }),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Save tags' }));
    await expect(args.onSaved).toHaveBeenCalled();
  },
};
