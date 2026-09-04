import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import YAML from 'yaml';
import { readFrontmatter } from '../../scripts/lib/frontmatter.mjs';

const common = YAML.parse(await readFile('schema/common.schema.yaml', 'utf8'));
const tobacco = YAML.parse(await readFile('schema/tobacco.schema.yaml', 'utf8'));
const cigar = YAML.parse(await readFile('schema/cigar.schema.yaml', 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addSchema(common);
ajv.addSchema(tobacco);
const validate = ajv.compile(cigar);

test('validates the documented cigar example', async () => {
  const value = await readFrontmatter('examples/cigar.example.md');
  const source = await readFrontmatter('sources/manufacturers/example-manufacturer-source.md');

  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
  assert.ok(value.variants.every(({ id, vitola }) => id && vitola.commercialName));
  assert.equal(source.id, 'example-manufacturer-source');
  assert.deepEqual(collectEvidenceSourceIds(value), [source.id]);
});

function collectEvidenceSourceIds(value) {
  const sourceIds = new Set();

  visit(value);
  return [...sourceIds];

  function visit(node) {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node.evidence)) {
      node.evidence.forEach(({ sourceId }) => sourceIds.add(sourceId));
    }
    Object.values(node).forEach(visit);
  }
}
