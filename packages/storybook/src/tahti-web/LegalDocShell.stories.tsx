import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  LegalDocSection,
  LegalDocShell,
} from '@tahti-web/components/LegalDocShell';
import { expect, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof LegalDocShell> = {
  title: 'Tahti/Widgets/LegalDocShell',
  component: LegalDocShell,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/legal/terms')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Terms of Service',
    meta: 'Last updated August 2026',
    children: (
      <>
        <LegalDocSection title="1. Acceptance of terms">
          <p className="text-foreground-secondary text-sm">
            By using Tähti you agree to these terms — sample body copy for the
            Storybook preview.
          </p>
        </LegalDocSection>
        <LegalDocSection title="2. Accounts">
          <p className="text-foreground-secondary text-sm">
            You&apos;re responsible for keeping your account credentials secure.
          </p>
        </LegalDocSection>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole('navigation', {
      name: 'About and legal',
    });
    await expect(
      within(nav).getByRole('link', { name: 'Terms of service' }),
    ).toHaveAttribute('href', '/terms');
  },
};

export const SectionOnly: StoryObj<typeof LegalDocSection> = {
  name: 'LegalDocSection',
  render: () => (
    <LegalDocSection title="3. Content ownership">
      <p className="text-foreground-secondary text-sm">
        A single section rendered on its own, outside the shell — useful when
        composing a custom legal page layout.
      </p>
    </LegalDocSection>
  ),
};
