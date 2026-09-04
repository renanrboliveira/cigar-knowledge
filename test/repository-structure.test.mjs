import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import test from 'node:test';

const required = [
  'CLAUDE.md', 'docs/contribution-guide.md', 'knowledge/concepts',
  'knowledge/terroirs', 'knowledge/brands', 'knowledge/sensory',
  'personal/cellar', 'personal/learning-notes', 'personal/comparisons',
  'sources/books', 'sources/specialized-media',
];

test('contains the V1 repository foundations', async () => {
  await Promise.all(required.map((path) => access(path)));
  assert.ok(true);
});
