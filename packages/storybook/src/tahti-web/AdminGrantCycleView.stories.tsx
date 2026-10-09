import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { AdminGrantCycleView } from '@tahti-web/views/admin/AdminGrantCycleView';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { expect, within } from 'storybook/test';

import { withMockAuth } from './_lib/decorators';

/** The view reads `year` from the route params, so it needs a real
 * `/admin/grants/$year` route rather than withTahtiRouter's literal path. */
function withGrantYearRoute(year: number): Decorator {
  return (Story) => {
    const rootRoute = createRootRoute({ component: Outlet });
    const router = createRouter({
      routeTree: rootRoute.addChildren([
        createRoute({
          getParentRoute: () => rootRoute,
          path: '/admin/grants/$year',
          component: () => <Story />,
        }),
      ]),
      history: createMemoryHistory({
        initialEntries: [`/admin/grants/${year}`],
      }),
    });
    return <RouterProvider router={router} />;
  };
}

const meta: Meta<typeof AdminGrantCycleView> = {
  title: 'Tahti/Admin/AdminGrantCycleView',
  component: AdminGrantCycleView,
  parameters: { layout: 'fullscreen' },
  decorators: [withMockAuth(), withGrantYearRoute(2026)],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** A dry-run allocation that balances to the cent, ready to approve. */
export const Preview: Story = {
  render: () => (
    <div className="p-6">
      <AdminGrantCycleView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', {
        level: 1,
        name: '2026 grant cycle',
      }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Board CSV' }),
    ).toHaveAttribute(
      'href',
      '/tahti-api/api/admin/grants/export.csv?year=2026',
    );
    await expect(
      await canvas.findByRole('link', { name: 'Northern Lights' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Kaiku Collective' }),
    ).toBeVisible();
    await expect(canvas.getByText(/allocations = pool/)).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Approve distribution' }),
    ).toBeEnabled();
  },
};
