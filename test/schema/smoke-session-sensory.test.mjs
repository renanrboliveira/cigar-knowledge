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

test('keeps three intensity dimensions and retrohale separate', async () => {
  const value = await readFrontmatter('test/fixtures/smoke-session/sensory-valid.md');
  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
  const stage = value.stages[0];
  assert.deepEqual(
    [stage.sensory.strength, stage.sensory.body, stage.sensory.flavorIntensity],
    [2, 4, 3],
  );
  assert.notDeepEqual(stage.sensory.flavors, stage.retrohale.flavors);
});

test('rejects a 0-100 overall score field', async () => {
  assert.equal(validate(await readFrontmatter('test/fixtures/smoke-session/sensory-invalid-score.md')), false);
});
