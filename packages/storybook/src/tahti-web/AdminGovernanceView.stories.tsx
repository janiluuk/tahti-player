import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminGovernanceView } from '@tahti-web/views/admin/AdminGovernanceView';
import type { AdminGovernanceTabId } from '@tahti-web/views/admin/governance/governanceNav';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminGovernanceView> = {
  title: 'Tahti/Admin/AdminGovernanceView',
  component: AdminGovernanceView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/admin/governance'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

function renderTab(tab?: AdminGovernanceTabId) {
  return () => (
    <div className="p-6">
      <AdminGovernanceView tab={tab} />
    </div>
  );
}

/** Asserts the area heading and that the hub back link is present. */
async function expectArea(canvasElement: HTMLElement, label: string) {
  const canvas = within(canvasElement);
  await waitFor(() =>
    expect(
      canvas.getByRole('heading', { level: 1, name: label }),
    ).toBeVisible(),
  );
  await expect(canvas.getByTestId('admin-governance-back')).toBeVisible();
  await expect(
    canvas.queryByRole('tablist', { name: 'Governance sections' }),
  ).toBeNull();
  return canvas;
}

/** No `tab` prop: hub of seven area cards. */
export const Default: Story = {
  render: renderTab(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { level: 1, name: 'Governance' }),
      ).toBeVisible(),
    );
    const tools = within(
      canvas.getByRole('list', { name: 'Governance areas' }),
    );
    await expect(tools.getAllByRole('link')).toHaveLength(7);
    await expect(tools.getByRole('link', { name: /Overview/ })).toBeVisible();
    await expect(tools.getByRole('link', { name: /AGM/ })).toBeVisible();
  },
};

/** The mock data holds one generated report. */
export const ReportsTab: Story = {
  render: renderTab('reports'),
  play: async ({ canvasElement }) => {
    const canvas = await expectArea(canvasElement, 'Annual reports');
    await waitFor(() =>
      expect(canvas.getByText('Annual report 2025')).toBeVisible(),
    );
    await expect(canvas.getByRole('textbox', { name: 'Year' })).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Generate report' }),
    ).toBeVisible();
  },
};

/** Approve, then publish, the mock 2025 draft (mock state). */
export const ApproveAndPublishAnnualReport: Story = {
  render: renderTab('reports'),
  play: async ({ canvasElement }) => {
    const canvas = await expectArea(canvasElement, 'Annual reports');
    const approve = await canvas.findByRole('button', {
      name: 'Approve report 2025',
    });
    await userEvent.click(approve);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Record approval' }),
    );
    await waitFor(() =>
      expect(canvas.getByText('Approved, not published')).toBeVisible(),
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Publish to members' }),
    );
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole('dialog'),
    );
    await userEvent.click(dialog.getByRole('button', { name: 'Publish' }));
    await waitFor(() => expect(canvas.getByText('Published')).toBeVisible());
  },
};

export const GrantsTab: Story = {
  render: renderTab('grants'),
  play: async ({ canvasElement }) => {
    const canvas = await expectArea(canvasElement, 'Grants');
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { name: 'Disbursement history' }),
      ).toBeVisible(),
    );
    await expect(
      canvas.getByRole('link', { name: 'View 2025 grants' }),
    ).toBeVisible();
    await expect(canvas.getByText('18 recipients')).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Preview a grant cycle' }),
    ).toBeVisible();
  },
};

export const AgmTab: Story = {
  render: renderTab('agm'),
  play: async ({ canvasElement }) => {
    const canvas = await expectArea(canvasElement, 'AGM');
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { name: 'Agenda builder' }),
      ).toBeVisible(),
    );
    await expect(canvas.getByText('Call to order')).toBeVisible();
    await expect(
      canvas.queryByRole('textbox', { name: 'Agenda item 1' }),
    ).toBeNull();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Edit item 1: Call to order' }),
    );
    await expect(
      canvas.getByRole('textbox', { name: 'Agenda item 1' }),
    ).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(
      canvas.queryByRole('textbox', { name: 'Agenda item 1' }),
    ).toBeNull();
    await expect(
      canvas.getByRole('heading', { name: 'Motions & proposals' }),
    ).toBeVisible();
    await expect(
      canvas.getByText('Adopt updated code of conduct'),
    ).toBeVisible();
    await expect(
      canvas.getByRole('switch', { name: 'Publish immediately to members' }),
    ).toBeVisible();
  },
};

export const BoardTab: Story = {
  render: renderTab('board'),
  play: async ({ canvasElement }) => {
    const canvas = await expectArea(canvasElement, 'Board');
    await waitFor(() => expect(canvas.getByText('Mart Saar')).toBeVisible());
    await expect(canvas.getByText('Serving')).toBeVisible();
  },
};

/** Open the mock election's candidates and record Liis Kask as elected. */
export const RecordElectionResult: Story = {
  render: renderTab('board'),
  play: async ({ canvasElement }) => {
    const canvas = await expectArea(canvasElement, 'Board');
    await userEvent.click(
      await canvas.findByRole('button', {
        name: 'Candidates: Board members for 2027',
      }),
    );
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Record the result' }),
    );
    await userEvent.click(
      canvas.getByRole('switch', { name: 'Elected: Liis Kask' }),
    );
    await userEvent.type(canvas.getByLabelText('Terms start'), '2027-01-01');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Record result' }),
    );
    await waitFor(() => expect(canvas.getByText('Decided')).toBeVisible());
  },
};

export const RecordsTab: Story = {
  render: renderTab('records'),
  play: async ({ canvasElement }) => {
    const canvas = await expectArea(canvasElement, 'Records');
    await waitFor(() =>
      expect(
        canvas.getByText('My home municipality is Espoo, not Helsinki.'),
      ).toBeVisible(),
    );
    await waitFor(() =>
      expect(
        canvas.getByText('Disputed minutes', { exact: false }),
      ).toBeVisible(),
    );
    await waitFor(() =>
      expect(canvas.getByText('Anna Virtanen')).toBeVisible(),
    );
  },
};

/** Discussions: the mock app's pinned open topic and closed topic, with
 * Pin / Close controls and the form to open a new one. */
export const DiscussionsTab: Story = {
  render: renderTab('discussions'),
  play: async ({ canvasElement }) => {
    const canvas = await expectArea(canvasElement, 'Discussions');
    await waitFor(() =>
      expect(
        canvas.getByRole('link', {
          name: 'A Tahti stage at a summer festival in 2027?',
        }),
      ).toBeVisible(),
    );
    await expect(canvas.getByRole('button', { name: 'Unpin' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Reopen' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Open a topic' }));
    await expect(canvas.getByRole('textbox', { name: 'Title' })).toBeVisible();
  },
};
