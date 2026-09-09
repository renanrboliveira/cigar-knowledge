import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import YAML from 'yaml';
import { readFrontmatter } from '../../scripts/lib/frontmatter.mjs';

const common = YAML.parse(await readFile('schema/common.schema.yaml', 'utf8'));
const evidence = YAML.parse(await readFile('schema/evidence.schema.yaml', 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addSchema(common);
const validate = ajv.compile(evidence);

test('keeps contradictory evidence records side by side', async () => {
  const document = await readFrontmatter('examples/evidence-disagreement.example.md');
  assert.equal(validate(document), true, ajv.errorsText(validate.errors));
  assert.deepEqual(document.evidence.map(({ relation }) => relation), ['supports', 'contradicts']);
  assert.deepEqual(document.evidence.map(({ claimType }) => claimType), ['manufacturer_claim', 'fact']);
});

test('rejects evidence without a source and field', () => {
  assert.equal(validate({ schemaVersion: 1, evidence: [{ relation: 'mentions' }] }), false);
});
