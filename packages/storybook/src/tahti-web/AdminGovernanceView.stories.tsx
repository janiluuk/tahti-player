import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminGovernanceView } from '@tahti-web/views/admin/AdminGovernanceView';
import type { AdminGovernanceTabId } from '@tahti-web/views/admin/governance/governanceNav';
import { expect, within } from 'storybook/test';

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

/** Asserts the page heading and that `label` is the selected section tab. */
async function expectSection(canvasElement: HTMLElement, label: string) {
  const canvas = within(canvasElement);
  await expect(
    await canvas.findByRole('heading', { level: 1, name: 'Governance' }),
  ).toBeVisible();
  const sections = within(
    canvas.getByRole('tablist', { name: 'Governance sections' }),
  );
  await expect(sections.getAllByRole('tab')).toHaveLength(4);
  await expect(sections.getByRole('tab', { name: label })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  return canvas;
}

/** No `tab` prop: lands on Overview, with member activity and resolutions. */
export const Default: Story = {
  render: renderTab(),
  play: async ({ canvasElement }) => {
    const canvas = await expectSection(canvasElement, 'Overview');
    await expect(
      await canvas.findByRole('heading', { name: 'Member activity' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { level: 2, name: 'Board resolutions' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('textbox', { name: 'Resolution title' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Record resolution' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: /Member motions & voting/ }),
    ).toBeVisible();
  },
};

/** No report generated yet in the mock data. */
export const ReportsTab: Story = {
  render: renderTab('reports'),
  play: async ({ canvasElement }) => {
    const canvas = await expectSection(canvasElement, 'Annual reports');
    await expect(
      await canvas.findByRole('heading', {
        name: 'No annual reports generated yet',
      }),
    ).toBeVisible();
    await expect(canvas.getByRole('textbox', { name: 'Year' })).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Generate report' }),
    ).toBeVisible();
  },
};

export const GrantsTab: Story = {
  render: renderTab('grants'),
  play: async ({ canvasElement }) => {
    const canvas = await expectSection(canvasElement, 'Grants');
    await expect(
      await canvas.findByRole('heading', { name: 'Disbursement history' }),
    ).toBeVisible();
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
    const canvas = await expectSection(canvasElement, 'AGM');
    await expect(
      await canvas.findByRole('heading', { name: 'Agenda builder' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('textbox', { name: 'Agenda item 1' }),
    ).toBeVisible();
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
