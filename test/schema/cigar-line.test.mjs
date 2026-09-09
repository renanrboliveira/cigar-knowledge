import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import YAML from 'yaml';
import { readFrontmatter } from '../../scripts/lib/frontmatter.mjs';

async function compileLine() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  for (const name of ['common', 'tobacco']) {
    ajv.addSchema(YAML.parse(await readFile(`schema/${name}.schema.yaml`, 'utf8')));
  }
  return ajv.compile(YAML.parse(await readFile('schema/cigar-line.schema.yaml', 'utf8')));
}

test('aceita uma linha sem evidencia: 23 das 28 chegam sem fonte', async () => {
  const validate = await compileLine();
  assert.equal(validate(await readFrontmatter('test/fixtures/cigar-line/valid.md')), true);
});

test('exige a marca a que a linha pertence', async () => {
  const validate = await compileLine();
  assert.equal(validate({ schemaVersion: 1, id: 'orfa', name: 'Órfã' }), false);
});

test('recusa historia no frontmatter', async () => {
  const validate = await compileLine();
  assert.equal(
    validate({ schemaVersion: 1, id: 'l', brand: 'b', name: 'L', story: 'prosa' }),
    false,
  );
});
