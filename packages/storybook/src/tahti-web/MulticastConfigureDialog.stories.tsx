import type { Meta, StoryObj } from '@storybook/react-vite';
import { MulticastConfigureDialog } from '@tahti-web/components/MulticastConfigureDialog';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

/**
 * Add or edit one multistream RTMP destination — shared between
 * Settings → Add-ons → Multistream and Studio → Go Live's "Add
 * destination" (both used to have their own separate form; Go Live's
 * dropdown-based one is retired in favor of this one).
 *
 * SaveFailure story exercises the mock ingest rejection (stream key "fail").
 */
const meta: Meta<typeof MulticastConfigureDialog> = {
  title: 'Tahti/Broadcast/MulticastConfigureDialog',
  component: MulticastConfigureDialog,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function Demo({
  configuring,
}: {
  configuring: React.ComponentProps<
    typeof MulticastConfigureDialog
  >['configuring'];
}) {
  const [open, setOpen] = useState(true);
  if (!open) {
    return null;
  }
  return (
    <MulticastConfigureDialog
      configuring={configuring}
      onClose={() => setOpen(false)}
      onSaved={() => setOpen(false)}
    />
  );
}

export const NewTwitchDestination: Story = {
  name: 'New — known platform (Twitch)',
  render: () => <Demo configuring={{ provider: 'TWITCH', existing: null }} />,
};

export const NewCustomRtmp: Story = {
  name: 'New — Custom RTMP',
  render: () => <Demo configuring={{ provider: 'CUSTOM', existing: null }} />,
};

export const EditExisting: Story = {
  name: 'Edit an existing destination',
  render: () => (
    <Demo
      configuring={{
        provider: 'YOUTUBE',
        existing: {
          id: 'target1',
          provider: 'YOUTUBE',
          label: 'Main YouTube mirror',
          rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
          alwaysMirror: false,
          keyLast4: 'abcd',
          enabled: true,
        },
      }}
    />
  ),
};

/** Mock create fails when stream key is `fail`. */
export const SaveFailure: Story = {
  name: 'Save failure',
  render: () => <Demo configuring={{ provider: 'TWITCH', existing: null }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const key = await canvas.findByLabelText(/stream key/i);
    await userEvent.type(key, 'fail');
    await userEvent.click(
      canvas.getByRole('button', { name: /save destination/i }),
    );
    await expect(
      await canvas.findByText('Ingest rejected the stream key.'),
    ).toBeVisible();
  },
};
