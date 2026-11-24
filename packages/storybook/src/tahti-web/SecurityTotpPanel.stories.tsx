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

/**
 * Self-fetches `fetchTotpStatus`, which under `VITE_FORCE_MOCK` starts out
 * `enabled: false` (backed by a module-level mock flag, not a prop) — so
 * this always mounts into the "Disabled" state: a grey status badge next to
 * the title and the turn-on banner inside the same section. Click through
 * "Turn on two-factor" → enter any 6-digit code → "Confirm" in the canvas to see the QR/secret
 * step and the backup-codes reveal live; there's no prop to jump straight
 * to the "Enabled" state from a story.
 */
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
