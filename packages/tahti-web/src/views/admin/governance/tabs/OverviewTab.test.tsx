import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MOCK_BOARD_RESOLUTIONS } from '../../../../api/admin/admin-governance.mock';
import { renderWithRouter } from '../../../../test/renderWithRouter';
import { OverviewTab } from './OverviewTab';

describe('OverviewTab board resolutions', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('offers a legal hold on each resolution', async () => {
    await renderWithRouter(<OverviewTab />, {
      paths: ['/admin/governance/$tab'],
    });
    const first = MOCK_BOARD_RESOLUTIONS[0]!;
    expect(
      await screen.findByRole('button', { name: `Legal hold: ${first.title}` }),
    ).toBeInTheDocument();
  });
});
