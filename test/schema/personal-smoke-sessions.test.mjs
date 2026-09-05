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

const paths = {
  joya: 'personal/smoke-sessions/joya-de-nicaragua-clasico-medio-siglo-toro.md',
  avo: 'personal/smoke-sessions/avo-syncro-nicaragua-robusto.md',
};

test('records the Joya session without false precision or invented flavors', async () => {
  const value = await readFrontmatter(paths.joya);

  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
  assert.equal(value.cigarVariantId, 'joya-de-nicaragua-clasico-medio-siglo-toro');
  assert.equal(value.status, 'completed');
  assert.equal(value.mode, 'guided');
  assert.equal(value.startedAt, undefined);
  assert.equal(value.endedAt, undefined);
  assert.equal(value.durationMinutes, undefined);
  assert.equal(value.nicotineImpact, undefined);
  assert.equal(value.stages[0].sensory.strength, null);
  assert.deepEqual(value.stages[0].sensory.flavors, []);
  assert.equal(value.stages[0].construction.draw, 'ideal');
  assert.equal(value.stages[0].construction.smokeOutput, 'high');
  assert.equal(value.finalEvaluation.enjoyment, 5);
  assert.equal(value.finalEvaluation.wouldSmokeAgain, true);
  assert.equal(value.finalEvaluation.wouldBuyAgain, true);
});

test('records only the spontaneously observed spicy family in the AVO session', async () => {
  const value = await readFrontmatter(paths.avo);

  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
  assert.equal(value.cigarVariantId, 'avo-syncro-nicaragua-robusto');
  assert.equal(value.startedAt, undefined);
  assert.equal(value.endedAt, undefined);
  assert.equal(value.durationMinutes, undefined);
  assert.equal(value.nicotineImpact, undefined);
  assert.equal(value.preLight.coldDraw, 'open');
  assert.deepEqual(value.stages.map((stage) => stage.kind), [
    'first_third',
    'second_third',
    'final_third',
  ]);
  for (const stage of value.stages) {
    assert.deepEqual(stage.sensory.flavors, [{ family: 'spicy', discovery: 'spontaneous' }]);
  }
  assert.deepEqual(value.stages[1].construction.events, ['canoeing', 'touch_up']);
  assert.deepEqual(value.stages[2].construction.events, ['canoeing']);
  assert.equal(value.finalEvaluation.enjoyment, 4);
  assert.deepEqual(value.finalEvaluation.dominantFlavorFamilies, ['spicy']);
});

test('personal records contain none of the prohibited suggested descriptors', async () => {
  const prohibited = /\b(?:cedar|coffee|cocoa|earth|nuts?|caramel|chocolate|leather|black pepper|white pepper)\b/i;

  for (const path of Object.values(paths)) {
    assert.doesNotMatch(await readFile(path, 'utf8'), prohibited);
  }
});
