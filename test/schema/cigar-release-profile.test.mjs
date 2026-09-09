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

test('keeps production status, availability, and declared profile separate', async () => {
  const value = await readFrontmatter('test/fixtures/cigar/release-profile-valid.md');

  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
  assert.equal(value.release.productionStatus, 'discontinued');
  assert.equal(value.availability.status, 'available_secondary_market');
  assert.equal(value.declaredProfile.strength, 4);
  assert.equal('personalRating' in value.declaredProfile, false);
});
