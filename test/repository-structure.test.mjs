import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import test from 'node:test';

const required = [
  'CLAUDE.md', 'docs/contribution-guide.md', 'knowledge/concepts',
  'knowledge/terroirs', 'knowledge/brands', 'knowledge/sensory',
  'knowledge/lines', 'knowledge/cigars', 'knowledge/editorial',
  'personal/cellar', 'personal/learning-notes', 'personal/comparisons',
  'sources/books', 'sources/specialized-media',
];

test('contains the V1 repository foundations', async () => {
  await Promise.all(required.map((path) => access(path)));
  assert.ok(true);
});

test('todo dossie aponta para uma variante que existe', async () => {
  const { readdir, readFile } = await import('node:fs/promises');
  const YAML = (await import('yaml')).default;
  const fm = async (p) => YAML.parse((await readFile(p, 'utf8')).match(/^---\n([\s\S]*?)\n---/)[1]);

  const cigars = await readdir('knowledge/cigars');
  const variantes = new Set(
    (await Promise.all(cigars.map((f) => fm(`knowledge/cigars/${f}`)))).flatMap((d) =>
      d.variants.map((v) => v.id),
    ),
  );

  const dossies = await readdir('knowledge/editorial');
  for (const arquivo of dossies) {
    const doc = await fm(`knowledge/editorial/${arquivo}`);
    assert.ok(variantes.has(doc.variantId), `${arquivo}: variante ${doc.variantId} nao existe`);
  }
  assert.equal(variantes.size, 46);
});
