import type { Meta, StoryObj } from '@storybook/react-vite';
import { SecurityTotpPanel } from '@tahti-web/components/SecurityTotpPanel';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof SecurityTotpPanel> = {
  title: 'Tahti/Misc/SecurityTotpPanel',
  component: SecurityTotpPanel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByTestId('security-2fa-status'),
    ).toHaveTextContent('Disabled');
    const section = within(canvas.getByTestId('security-2fa'));
    await expect(section.getByTestId('security-2fa-banner')).toBeVisible();
    await expect(
      section.getByRole('button', { name: 'Turn on two-factor' }),
    ).toBeVisible();
    await expect(
      section.getByRole('button', {
        name: 'About Two-factor authentication',
      }),
    ).toBeInTheDocument();
  },
};
