import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnnualReportsPanel } from '@tahti-web/components/governance/AnnualReportsPanel';
import { AssociationPanel } from '@tahti-web/components/governance/AssociationPanel';
import { CorrectionsPanel } from '@tahti-web/components/governance/CorrectionsPanel';
import { CurrentBoardPanel } from '@tahti-web/components/governance/CurrentBoardPanel';
import { ElectionsPanel } from '@tahti-web/components/governance/ElectionsPanel';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta = {
  title: 'Tahti/Governance/Member panels',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Member-only governance panels on `/governance`, each reading its own members-only API with mock data in Storybook.',
      },
    },
  },
  decorators: [withTahtiRouter('/governance')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CurrentBoard: Story = {
  render: () => <CurrentBoardPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByRole('heading', { name: 'Board' })).toBeVisible(),
    );
    await waitFor(() => expect(canvas.getByText('Mart Saar')).toBeVisible());
    await expect(canvas.getByText(/^Chair · since/)).toBeVisible();
  },
};

export const Elections: Story = {
  render: () => <ElectionsPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByText('Board members for 2027')).toBeVisible(),
    );
    await expect(canvas.getByText(/Nominations open until/)).toBeVisible();
    await expect(canvas.getByText('Elected')).toBeVisible();
  },
};

export const StandForElection: Story = {
  render: () => <ElectionsPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Stand for election' }),
    );
    await userEvent.type(
      canvas.getByLabelText('Why you are standing (optional)'),
      'Open books',
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Stand in this election' }),
    );
    await waitFor(() =>
      expect(canvas.getByText('You are standing')).toBeVisible(),
    );
    await expect(canvas.getByText('Open books')).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Withdraw my candidacy' }),
    );
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole('dialog'),
    );
    await userEvent.click(dialog.getByRole('button', { name: 'Withdraw' }));
    await waitFor(() =>
      expect(
        canvas.getByRole('button', { name: 'Stand for election' }),
      ).toBeVisible(),
    );
  },
};

export const AnnualReports: Story = {
  render: () => <AnnualReportsPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('link', {
          name: 'Annual report 2025 (opens in a new tab)',
        }),
      ).toBeVisible(),
    );
    await expect(canvas.getByText(/filed with the register/)).toBeVisible();
  },
};

export const Association: Story = {
  render: () => <AssociationPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText('1234567-8')).toBeVisible());
    await expect(canvas.getByText('Anna Virtanen')).toBeVisible();
  },
};

export const RequestCorrection: Story = {
  render: () => <CorrectionsPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText('Accepted')).toBeVisible());
    await userEvent.type(
      canvas.getByLabelText('What is wrong, and what should it be?'),
      'The minutes list the wrong meeting date.',
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Send to the board' }),
    );
    await expect(await canvas.findByRole('status')).toHaveTextContent('Sent.');
    await waitFor(() =>
      expect(
        canvas.getByText('The minutes list the wrong meeting date.'),
      ).toBeVisible(),
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Withdraw request' }),
    );
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole('dialog'),
    );
    await userEvent.click(dialog.getByRole('button', { name: 'Withdraw' }));
    await waitFor(() => expect(canvas.getByText('Withdrawn')).toBeVisible());
  },
};
