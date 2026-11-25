// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(process.cwd(), '../..');

const workflows = [
  '.github/workflows/ci.yml',
  '.github/workflows/deploy-tahti-web-selfhosted.yml',
  '.github/workflows/deploy-tahti-web.yml',
];

describe('tahti-web deployment profiles', () => {
  it.each(workflows)(
    '%s builds and verifies the production profile',
    (file) => {
      const source = readFileSync(join(root, file), 'utf8');
      expect(source).toContain('TAHTI_WEB_DEPLOY_PROFILE=prod');
      expect(source).toContain('test ! -e packages/tahti-web/dist/map');
    },
  );

  it('passes the selected profile through the manual deploy script', () => {
    const source = readFileSync(
      join(root, 'packages/tahti-web/deploy/deploy-vimage.sh'),
      'utf8',
    );
    expect(source).toContain('"TAHTI_WEB_DEPLOY_PROFILE=${PROFILE}"');
    expect(source).toContain('production build contains the diagnostics atlas');
  });
});
