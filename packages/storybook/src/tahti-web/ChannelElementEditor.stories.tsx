import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelElementEditor } from '@tahti-web/components/ChannelElementEditor';
import {
  CHANNEL_LOOK_ELEMENTS,
  type ChannelLookElementId,
} from '@tahti-web/lib/channelLookElements';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

/**
 * Look element list used by Channel Designer. Ids must stay in sync with
 * `CHANNEL_LOOK_ELEMENTS` — stale header/actions ids were removed.
 */
const meta: Meta<typeof ChannelElementEditor> = {
  title: 'Tahti/Channel/Designer/ElementEditor',
  component: ChannelElementEditor,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function EditorDemo({
  initialId = 'backdrop',
}: {
  initialId?: ChannelLookElementId;
}) {
  const [selectedId, setSelectedId] = useState<ChannelLookElementId>(initialId);
  const [hidden, setHidden] = useState<
    Partial<Record<ChannelLookElementId, boolean>>
  >({});

  return (
    <div className="max-w-sm">
      <ChannelElementEditor
        selectedId={selectedId}
        onSelect={setSelectedId}
        onToggleDisabled={(id) =>
          setHidden((current) => ({ ...current, [id]: !current[id] }))
        }
        items={CHANNEL_LOOK_ELEMENTS.map((element) => ({
          id: element.id,
          disabled: element.canDisable
            ? hidden[element.id] === true
            : undefined,
          content: (
            <p className="text-sm">
              <span className="font-semibold">{element.label}</span>
              <span className="text-foreground-secondary block text-xs">
                {element.hint}
              </span>
            </p>
          ),
        }))}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <EditorDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const section = canvas.getByRole('button', { name: 'Section' });
    await expect(section).toHaveTextContent('Background');
    await userEvent.click(canvas.getByRole('button', { name: 'Next section' }));
    await expect(section).toHaveTextContent('Releases');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Previous section' }),
    );
    await expect(section).toHaveTextContent('Background');
    await expect(canvas.queryByRole('button', { name: /^Hide / })).toBeNull();
  },
};

export const PlayerSelected: Story = {
  render: () => <EditorDemo initialId="player" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Hide Player' }));
    const show = canvas.getByRole('button', { name: 'Show Player' });
    await expect(show).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(show);
    await expect(
      canvas.getByRole('button', { name: 'Hide Player' }),
    ).toHaveAttribute('aria-pressed', 'true');
  },
};

export const BackdropSelected: Story = {
  render: () => <EditorDemo initialId="backdrop" />,
};
