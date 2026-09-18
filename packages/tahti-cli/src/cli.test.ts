import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { main } from './cli.mjs';

describe('main', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('prints help and exits 0 for --help', async () => {
    const code = await main(['--help']);
    expect(code).toBe(0);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('tahti-cli'));
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

  it('runs library list and prints the table', async () => {
    vi.stubEnv('TAHTI_API_TOKEN', 'tahti_test');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { id: 'a1', title: 'Track', status: 'READY', durationSec: 42 },
        ],
      }),
    );

    const code = await main(['library', 'list']);

    expect(code).toBe(0);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Track'));
  });
});
