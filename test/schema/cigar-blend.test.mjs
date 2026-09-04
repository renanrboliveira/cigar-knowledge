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

test('allows the same Tobacco identity in wrapper, binder, and filler', async () => {
  const value = await readFrontmatter('test/fixtures/cigar/dona-flor-puro-mata-fina.md');
  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
  assert.deepEqual([
    value.blend.wrapper[0].tobaccoId,
    value.blend.binder[0].tobaccoId,
    value.blend.filler[0].tobaccoId,
  ], ['mata-fina', 'mata-fina', 'mata-fina']);
});

test('rejects a variant blend override without evidence', async () => {
  assert.equal(validate(await readFrontmatter('test/fixtures/cigar/invalid-override-without-evidence.md')), false);
});
