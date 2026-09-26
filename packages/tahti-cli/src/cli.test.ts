import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { main } from './cli.mjs';
import { mockFetchJson } from './test-helpers';

describe('main', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('TAHTI_API_URL', 'https://api.example.test');
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('prints help listing every command for --help', async () => {
    const code = await main(['--help']);
    expect(code).toBe(0);
    const help = String(logSpy.mock.calls[0][0]);
    expect(help).toContain('tahti-cli');
    expect(help).toContain('tahti whoami');
    expect(help).toContain('tahti library list');
    expect(help).toContain('tahti library show <id>');
    expect(help).toContain('tahti releases list');
  });

  it('prints help and exits 0 with no arguments', async () => {
    const code = await main([]);
    expect(code).toBe(0);
    expect(logSpy).toHaveBeenCalled();
  });

  it('exits 1 with an error for an unknown command', async () => {
    const code = await main(['bogus']);
    expect(code).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown command: bogus'),
    );
  });

  it('treats an incomplete command as unknown', async () => {
    const code = await main(['library']);
    expect(code).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown command: library'),
    );
  });

  it.each([
    [['whoami', '--help'], 'Usage: tahti whoami [--json]'],
    [['library', 'list', '-h'], '--sort <order>'],
    [['library', 'show', '--help'], 'Usage: tahti library show <id> [--json]'],
    [['releases', 'list', '--help'], '--limit <n>'],
  ])(
    'prints per-command help for %j without calling the API',
    async (argv, text) => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      const code = await main(argv);
      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(text));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('--json'));
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('rejects unknown flags with a pointer to the command help', async () => {
    await expect(main(['whoami', '--verbose'])).rejects.toThrow(
      /Run `tahti whoami --help` for usage/,
    );
  });

  it('rejects extra positional arguments', async () => {
    await expect(main(['library', 'show', 'a', 'b'])).rejects.toThrow(
      'Unexpected argument: b',
    );
  });

  it('runs library list and prints the table', async () => {
    vi.stubEnv('TAHTI_API_TOKEN', 'tahti_test');
    mockFetchJson([
      { id: 'a1', title: 'Track', status: 'READY', durationSec: 42 },
    ]);

    const code = await main(['library', 'list']);

    expect(code).toBe(0);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Track'));
  });

  it('runs library list with --sort', async () => {
    vi.stubEnv('TAHTI_API_TOKEN', 'tahti_test');
    const fetchMock = mockFetchJson([]);

    await main(['library', 'list', '--sort', 'title']);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/me/sound?sort=title',
      expect.anything(),
    );
  });

  it('runs whoami without printing the email', async () => {
    vi.stubEnv('TAHTI_API_TOKEN', 'tahti_test');
    mockFetchJson({
      id: 'u1',
      email: 'artist@example.test',
      username: 'artist',
      displayName: 'The Artist',
      tier: 'FREE',
      isMember: false,
      channel: null,
      storage: { usedBytes: '0', showSoftTarget: true },
    });

    const code = await main(['whoami']);

    expect(code).toBe(0);
    const output = String(logSpy.mock.calls[0][0]);
    expect(output).toContain('The Artist');
    expect(output).not.toContain('artist@example.test');
  });

  it('runs library show with the positional id', async () => {
    vi.stubEnv('TAHTI_API_TOKEN', 'tahti_test');
    const fetchMock = mockFetchJson({
      id: 'snd_1',
      title: 'Night Drive',
      status: 'READY',
    });

    const code = await main(['library', 'show', 'snd_1', '--json']);

    expect(code).toBe(0);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/me/sound/snd_1',
      expect.anything(),
    );
    expect(JSON.parse(String(logSpy.mock.calls[0][0])).title).toBe(
      'Night Drive',
    );
  });

  it('runs releases list', async () => {
    vi.stubEnv('TAHTI_API_TOKEN', 'tahti_test');
    mockFetchJson({
      page: 1,
      limit: 100,
      total: 1,
      releases: [{ id: 'rel_1', title: 'First EP', _count: { tracks: 3 } }],
    });

    const code = await main(['releases', 'list']);

    expect(code).toBe(0);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('First EP'));
  });

  it('surfaces a 401 as a token error', async () => {
    vi.stubEnv('TAHTI_API_TOKEN', 'tahti_revoked');
    mockFetchJson({ error: 'Invalid or expired API token' }, 401);

    await expect(main(['whoami'])).rejects.toThrow(
      /Token invalid or missing scope/,
    );
  });
});
