import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import YAML from 'yaml';
import { readFrontmatter } from '../../scripts/lib/frontmatter.mjs';

const common = YAML.parse(await readFile('schema/common.schema.yaml', 'utf8'));
const smokeSession = YAML.parse(await readFile('schema/smoke-session.schema.yaml', 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addSchema(common);
const validate = ajv.compile(smokeSession);

test('supports a minimal planned quick session', async () => {
  assert.equal(validate(await readFrontmatter('test/fixtures/smoke-session/planned-quick.md')), true);
});

test('supports guided thirds without hard-coding array length', async () => {
  const value = await readFrontmatter('test/fixtures/smoke-session/completed-guided.md');

  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
  assert.deepEqual(value.stages.map(({ kind }) => kind), ['first_third', 'second_third', 'final_third']);
});
