import assert from 'node:assert/strict';
import test from 'node:test';
import { readFrontmatter } from '../scripts/lib/frontmatter.mjs';

test('reads YAML frontmatter', async () => {
  assert.deepEqual(await readFrontmatter('test/fixtures/frontmatter/valid.md'), {
    schemaVersion: 1,
    id: 'valid-document',
  });
});

test('rejects Markdown without frontmatter', async () => {
  await assert.rejects(
    readFrontmatter('test/fixtures/frontmatter/missing-frontmatter.md'),
    /missing YAML frontmatter/,
  );
});
