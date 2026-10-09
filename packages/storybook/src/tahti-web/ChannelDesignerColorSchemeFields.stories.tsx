import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  DEFAULT_COLOR_SCHEME,
  type ColorScheme,
} from '@tahti-web/api/channel-design';
import { ColorSchemeFields } from '@tahti-web/components/channel-designer/ColorSchemeFields';
import { useState } from 'react';
import { expect, fireEvent, within } from 'storybook/test';

/**
 * Shared color pickers used by Channel Designer Backdrop / Player / page
 * background panels. Correct this primitive first — header and player
 * palettes both compose it.
 */
const meta: Meta<typeof ColorSchemeFields> = {
  title: 'Tahti/Channel/Designer/ColorSchemeFields',
  component: ColorSchemeFields,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function Interactive({ variant }: { variant?: 'player' | 'generic' }) {
  const [scheme, setScheme] = useState<ColorScheme>({
    ...DEFAULT_COLOR_SCHEME,
  });
  return (
    <div className="max-w-lg">
      <ColorSchemeFields
        scheme={scheme}
        onChange={setScheme}
        variant={variant}
      />
    </div>
  );
}

export const Default: Story = {
  name: 'Player (default — waveform-labeled)',
  render: () => <Interactive variant="player" />,
};

export const Generic: Story = {
  name: 'Generic (header / page background — no waveform wording)',
  render: () => <Interactive variant="generic" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByLabelText(/waveform/)).toBeNull();
    fireEvent.change(canvas.getByLabelText('Muted'), {
      target: { value: '#334155' },
    });
    await expect(canvas.getByText('#334155')).toBeVisible();
  },
};

export const PartialScheme: Story = {
  name: 'Partial (missing keys fall back to defaults)',
  render: () => {
    const [scheme, setScheme] = useState<ColorScheme>({
      accent: '#7CFFB2',
      bg: '#0B1220',
    });
    return (
      <div className="max-w-lg">
        <ColorSchemeFields scheme={scheme} onChange={setScheme} />
      </div>
    );
  },
};
