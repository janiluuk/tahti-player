import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const scriptDirectory = path.dirname(new URL(import.meta.url).pathname);
const openApiPath = path.resolve(
  scriptDirectory,
  '../../../../tahti-org/openapi.json',
);
const referencePath = path.resolve(scriptDirectory, '../docs/API-REFERENCE.md');

const openApi = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
const expectedHash = crypto
  .createHash('sha256')
  .update(JSON.stringify(openApi.paths))
  .digest('hex');
const reference = fs.readFileSync(referencePath, 'utf8');
const marker = /API_PATHS_SHA256:\s*([a-f0-9]{64})/.exec(reference)?.[1];

if (marker !== expectedHash) {
  console.error(
    `API docs are stale. Expected ${expectedHash}, found ${marker ?? 'no marker'}.`,
  );
  process.exit(1);
}

console.log(`API docs match ../tahti-org/openapi.json (${expectedHash}).`);
