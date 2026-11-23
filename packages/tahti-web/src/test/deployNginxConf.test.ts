import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const conf = readFileSync(
  join(__dirname, '..', '..', 'deploy', 'nginx.conf'),
  'utf8',
);

function mapBlock(variable: string): string {
  const match = new RegExp(
    `map \\$request_uri \\$${variable} \\{([^}]*)\\}`,
  ).exec(conf);
  if (!match?.[1]) {
    throw new Error(`map $${variable} not found`);
  }
  return match[1];
}

function locationBlock(selector: string): string {
  const start = conf.indexOf(`location ${selector} {`);
  if (start < 0) {
    throw new Error(`location ${selector} not found`);
  }
  return conf.slice(start, conf.indexOf('\n    }', start));
}

describe('deploy/nginx.conf', () => {
  it('lets only /embed/* pages be framed by other sites', () => {
    const ancestors = mapBlock('tahti_frame_ancestors');
    expect(ancestors).toMatch(/default "'self'";/);
    expect(ancestors).toMatch(/~\^\/embed\/ "\*";/);
    expect(mapBlock('tahti_csp')).toContain(
      'frame-ancestors $tahti_frame_ancestors;',
    );
  });

  it('sends the one shared CSP from the server block and index.html', () => {
    const cspHeaders = conf.match(/add_header Content-Security-Policy .*;/g);
    expect(cspHeaders?.filter((h) => h.includes('$tahti_csp'))).toHaveLength(2);
    expect(locationBlock('= /index.html')).toContain(
      'add_header Content-Security-Policy $tahti_csp always;',
    );
    expect(conf).not.toMatch(/Content-Security-Policy "default-src 'self'/);
  });

  it('keeps the security headers on locations that set their own headers', () => {
    for (const selector of [
      '= /index.html',
      '^~ /assets/',
      '~ "^/widget-sandbox/([0-9a-f]{64})/?$"',
    ]) {
      const block = locationBlock(selector);
      expect(block, selector).toContain('X-Content-Type-Options "nosniff"');
      expect(block, selector).toContain('Referrer-Policy');
    }
  });

  it('lets the SPA frame the widget sandbox on the apex and channel hosts', () => {
    const sandbox = locationBlock('~ "^/widget-sandbox/([0-9a-f]{64})/?$"');
    expect(sandbox).toContain(
      "frame-ancestors 'self' https://tahti.live https://*.tahti.live",
    );
    expect(sandbox).not.toContain("frame-ancestors 'none'");
  });

  it('keeps the widget sandbox CSP locked down aside from framing', () => {
    const sandbox = locationBlock('~ "^/widget-sandbox/([0-9a-f]{64})/?$"');
    expect(sandbox).toContain("default-src 'none'");
    expect(sandbox).toContain("connect-src 'none'");
    expect(sandbox).toContain("base-uri 'none'");
    expect(sandbox).toContain("form-action 'none'");
    expect(sandbox).toMatch(/script-src 'self'/);
  });

  it('lets the admin dashboard frame Grafana', () => {
    const frameSrc = /frame-src ([^;]*);/.exec(mapBlock('tahti_csp'))?.[1];
    expect(frameSrc?.split(' ')).toContain('https://grafana.tahti.live');
  });

  it('does not open frame-ancestors for non-embed SPA routes', () => {
    const ancestors = mapBlock('tahti_frame_ancestors');
    expect(ancestors).not.toMatch(/~\^\/library\//);
    expect(ancestors).not.toMatch(/~\^\/studio\//);
    expect(ancestors).toMatch(/~\^\/embed\/ "\*";/);
  });
});
