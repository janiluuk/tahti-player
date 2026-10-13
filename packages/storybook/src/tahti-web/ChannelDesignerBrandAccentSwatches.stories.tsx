import type { Meta, StoryObj } from '@storybook/react-vite';
import { BRAND_ACCENTS } from '@tahti-web/api/channel-design';
import { BrandAccentSwatches } from '@tahti-web/components/channel-designer/BrandAccentSwatches';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

/** Brand gradient swatches used by the Backdrop and Player color editors. */
const meta: Meta<typeof BrandAccentSwatches> = {
  title: 'Tahti/Channel/Designer/BrandAccentSwatches',
  component: BrandAccentSwatches,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { selectedId: 'aurora', onSelect: fn() },
  render: function Render(args) {
    const [selectedId, setSelectedId] = useState(args.selectedId);
    return (
      <BrandAccentSwatches
        selectedId={selectedId}
        onSelect={(brand) => {
          setSelectedId(brand.id);
          args.onSelect(brand);
        }}
      />
    );
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AuroraSelected: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('button')).toHaveLength(
      BRAND_ACCENTS.length,
    );
    await expect(
      canvas.getByRole('button', { name: 'Aurora' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Ember' }));
    await expect(canvas.getByRole('button', { name: 'Ember' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(args.onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ember', accent: '#F97316' }),
    );
  },
};

export const NoneSelected: Story = {
  name: 'Custom colors (no swatch selected)',
  args: { selectedId: null },
};
