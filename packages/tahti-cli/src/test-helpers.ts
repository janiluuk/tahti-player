import { vi } from 'vitest';

export const TEST_CONFIG = {
  apiUrl: 'https://api.example.test',
  token: 'tahti_test',
};

export function mockFetchJson(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
