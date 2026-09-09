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

test('models draw events and nicotine independently from strength', async () => {
  const value = await readFrontmatter('test/fixtures/smoke-session/evaluation-valid.md');

  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
  assert.equal(value.stages[0].construction.draw, 'ideal');
  assert.deepEqual(value.stages[0].construction.events, ['touch_up']);
  assert.equal(value.nicotineImpact, 'noticeable');
  assert.equal(value.stages[0].sensory.strength, 2);
});
