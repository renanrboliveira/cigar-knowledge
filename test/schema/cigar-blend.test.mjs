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

test('uses an explicitly synthetic variant and vitola for blend validation', async () => {
  const value = await readFrontmatter('test/fixtures/cigar/dona-flor-puro-mata-fina.md');

  assert.equal(value.variants[0].id, 'synthetic-validation-vitola');
  assert.equal(value.variants[0].name, 'Synthetic Validation Vitola');
  assert.equal(value.variants[0].vitola.commercialName, 'Synthetic Validation Vitola');
});

test('rejects a variant blend override without evidence', async () => {
  assert.equal(validate(await readFrontmatter('test/fixtures/cigar/invalid-override-without-evidence.md')), false);
});

test('rejects a filler component in the wrapper array', () => {
  const value = {
    schemaVersion: 1,
    id: 'wrapper-role-mismatch',
    brand: 'synthetic-brand',
    line: 'synthetic-line',
    name: 'Wrapper Role Mismatch',
    blend: {
      wrapper: [{ rawLabel: 'Synthetic filler leaf', role: 'filler' }],
      binder: [{ rawLabel: 'Synthetic binder leaf', role: 'binder' }],
      filler: [{ rawLabel: 'Synthetic filler leaf', role: 'filler' }],
    },
    variants: [{
      id: 'wrapper-role-mismatch-robusto',
      name: 'Robusto',
      vitola: { commercialName: 'Robusto' },
    }],
  };

  assert.equal(validate(value), false);
});

test('rejects a wrapper component in the binder array', () => {
  const value = {
    schemaVersion: 1,
    id: 'binder-role-mismatch',
    brand: 'synthetic-brand',
    line: 'synthetic-line',
    name: 'Binder Role Mismatch',
    blend: {
      wrapper: [{ rawLabel: 'Synthetic wrapper leaf', role: 'wrapper' }],
      binder: [{ rawLabel: 'Synthetic wrapper leaf', role: 'wrapper' }],
      filler: [{ rawLabel: 'Synthetic filler leaf', role: 'filler' }],
    },
    variants: [{
      id: 'binder-role-mismatch-robusto',
      name: 'Robusto',
      vitola: { commercialName: 'Robusto' },
    }],
  };

  assert.equal(validate(value), false);
});

test('rejects a binder component in the filler array', () => {
  const value = {
    schemaVersion: 1,
    id: 'filler-role-mismatch',
    brand: 'synthetic-brand',
    line: 'synthetic-line',
    name: 'Filler Role Mismatch',
    blend: {
      wrapper: [{ rawLabel: 'Synthetic wrapper leaf', role: 'wrapper' }],
      binder: [{ rawLabel: 'Synthetic binder leaf', role: 'binder' }],
      filler: [{ rawLabel: 'Synthetic binder leaf', role: 'binder' }],
    },
    variants: [{
      id: 'filler-role-mismatch-robusto',
      name: 'Robusto',
      vitola: { commercialName: 'Robusto' },
    }],
  };

  assert.equal(validate(value), false);
});
