import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchAdminIntegrationStatus } from './admin-vendors';

describe('fetchAdminIntegrationStatus', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps the API's integration rows onto vendor names", async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          integrations: [
            {
              id: 'mixcloud',
              label: 'Mixcloud',
              configured: true,
              mode: 'live',
              detail: 'Uploads connected',
            },
            {
              id: 'revelator',
              label: 'Revelator',
              configured: false,
              mode: 'stub',
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const result = await fetchAdminIntegrationStatus();
    expect(result.data).toEqual([
      { name: 'Mixcloud', live: true, detail: 'Uploads connected' },
      { name: 'Revelator', live: false, detail: '' },
    ]);
  });
});
