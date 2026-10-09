import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColorScheme } from '@tahti-web/api/channel-design';
import { BackdropBackgroundExtras } from '@tahti-web/components/channel-designer/BackdropBackgroundExtras';
import { useState, type ComponentProps } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { DESIGN_SCHEME } from './_fixtures/channel-design';

function ExtrasDemo(args: ComponentProps<typeof BackdropBackgroundExtras>) {
  const [useGradient, setUseGradient] = useState(args.useBackgroundGradient);
  const [scheme, setScheme] = useState<ColorScheme>(args.backgroundScheme);
  const [preset, setPreset] = useState(args.backgroundVisualPreset);
  return (
    <div className="max-w-xl">
      <BackdropBackgroundExtras
        useBackgroundGradient={useGradient}
        onUseBackgroundGradient={(enabled) => {
          setUseGradient(enabled);
          args.onUseBackgroundGradient(enabled);
        }}
        backgroundScheme={scheme}
        onBackgroundSchemeChange={(next) => {
          setScheme(next);
          args.onBackgroundSchemeChange(next);
        }}
        backgroundVisualPreset={preset}
        onBackgroundVisualPreset={(next) => {
          setPreset(next);
          args.onBackgroundVisualPreset(next);
        }}
      />
    </div>
  );
}

/** Backdrop → Visualization header style: separate page palette and the
 * ambient background visualizer picker. */
const meta: Meta<typeof BackdropBackgroundExtras> = {
  title: 'Tahti/Channel/Designer/BackdropBackgroundExtras',
  component: BackdropBackgroundExtras,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    useBackgroundGradient: false,
    onUseBackgroundGradient: fn(),
    backgroundScheme: DESIGN_SCHEME,
    onBackgroundSchemeChange: fn(),
    backgroundVisualPreset: 'INTERACTIVE_POINTS',
    onBackgroundVisualPreset: fn(),
  },
  render: (args) => <ExtrasDemo {...args} />,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const MatchesHeader: Story = {
  name: 'Matches header palette',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/The page currently matches the header colors/),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', {
        name: 'INTERACTIVE POINTS background visualizer',
      }),
    ).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(
      canvas.getByRole('button', { name: 'FAT LINES background visualizer' }),
    );
    await expect(args.onBackgroundVisualPreset).toHaveBeenCalledWith(
      'FAT_LINES',
    );

    await userEvent.click(
      canvas.getByRole('switch', { name: 'Use a separate background palette' }),
    );
    await expect(args.onUseBackgroundGradient).toHaveBeenCalledWith(true);
    await expect(canvas.getByLabelText('Background')).toBeVisible();
  },
};

export const SeparatePalette: Story = {
  name: 'Separate background palette',
  args: {
    useBackgroundGradient: true,
    backgroundScheme: { ...DESIGN_SCHEME, bg: '#020617', accent: '#35D6C4' },
    backgroundVisualPreset: 'BACKDROP_AREA',
  },
};
