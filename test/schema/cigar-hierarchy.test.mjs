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

test('requires a smokeable variant with an explicit vitola', async () => {
  assert.equal(validate(await readFrontmatter('test/fixtures/cigar/minimal-valid.md')), true);
  assert.equal(validate(await readFrontmatter('test/fixtures/cigar/invalid-missing-variant.md')), false);
});

test('does not derive dimensions from the commercial name', async () => {
  const value = await readFrontmatter('test/fixtures/cigar/minimal-valid.md');
  assert.equal(value.variants[0].vitola.commercialName, 'Robusto');
  assert.equal(value.variants[0].vitola.lengthMm, null);
  assert.equal(value.variants[0].vitola.ringGauge, null);
  assert.equal(validate(value), true);
});

test('allows evidence attached directly to a cigar', () => {
  const value = {
    schemaVersion: 1,
    id: 'evidenced-synthetic-cigar',
    brand: 'synthetic-brand',
    line: 'synthetic-line',
    name: 'Evidenced Synthetic Cigar',
    evidence: [
      {
        sourceId: 'synthetic-source',
        field: '/name',
        relation: 'supports',
        confidence: 'high',
        claimType: 'fact',
        status: 'supported',
      },
    ],
    variants: [
      {
        id: 'evidenced-synthetic-robusto',
        name: 'Robusto',
        vitola: {
          commercialName: 'Robusto',
        },
      },
    ],
  };

  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
});
