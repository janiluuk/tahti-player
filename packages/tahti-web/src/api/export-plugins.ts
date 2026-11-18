import { apiBase } from './http';
import { ALLOW_MOCK_FALLBACK, FORCE_MOCK } from './mode';

export type ExportPluginProviderRow = {
  contractVersion: 1;
  id: string;
  name: string;
  description: string;
  capabilities: { submit: boolean; status: boolean; webhook: boolean };
  submitPath: string | null;
  statusPath: string | null;
  webhookPath: string | null;
};

const MOCK_EXPORT_PLUGINS: ExportPluginProviderRow[] = [
  {
    contractVersion: 1,
    id: 'revelator',
    name: 'Revelator',
    description: 'DSP delivery via Revelator (submit / status / webhook).',
    capabilities: { submit: true, status: true, webhook: true },
    submitPath: '/api/me/releases/:id/revelator/submit',
    statusPath: '/api/me/releases/:id/revelator',
    webhookPath: '/api/webhooks/export/revelator',
  },
];

export async function fetchExportPlugins(): Promise<{
  data: ExportPluginProviderRow[];
  source: 'api' | 'mock';
}> {
  if (FORCE_MOCK) {
    return { data: MOCK_EXPORT_PLUGINS, source: 'mock' };
  }
  try {
    const res = await fetch(`${apiBase()}/api/me/export-plugins`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`export-plugins → ${res.status}`);
    }
    const json = (await res.json()) as {
      providers?: ExportPluginProviderRow[];
    };
    return {
      data: Array.isArray(json.providers) ? json.providers : [],
      source: 'api',
    };
  } catch (err) {
    if (ALLOW_MOCK_FALLBACK) {
      return { data: MOCK_EXPORT_PLUGINS, source: 'mock' };
    }
    throw err instanceof Error ? err : new Error('export-plugins fetch failed');
  }
}
