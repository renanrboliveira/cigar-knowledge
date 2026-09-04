import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import YAML from 'yaml';

async function createValidator() {
  const common = YAML.parse(await readFile('schema/common.schema.yaml', 'utf8'));
  const tobacco = YAML.parse(await readFile('schema/tobacco.schema.yaml', 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  ajv.addSchema(common);
  ajv.addSchema(tobacco);

  return {
    ajv,
    validateComponent: ajv.compile({
      $ref: `${tobacco.$id}#/$defs/tobaccoComponent`,
    }),
  };
}

const fixtures = YAML.parse(await readFile('test/fixtures/tobacco/components.yaml', 'utf8'));
const { ajv, validateComponent } = await createValidator();

test('allows Mata Fina in every blend role', () => {
  for (const component of fixtures.mataFinaByRole) {
    assert.equal(validateComponent(component), true, ajv.errorsText(validateComponent.errors));
  }
});

test('keeps Ligero in priming', () => {
  assert.equal(validateComponent(fixtures.ligeroAsPriming), true, ajv.errorsText(validateComponent.errors));
  assert.equal(validateComponent(fixtures.ligeroAsIdentity), false);
});

test('preserves and decomposes Ecuadorian Connecticut Shade', () => {
  const component = fixtures.ecuadorianConnecticutShade;

  assert.equal(validateComponent(component), true, ajv.errorsText(validateComponent.errors));
  assert.equal(component.rawLabel, 'Ecuadorian Connecticut Shade');
  assert.equal(component.tobaccoId, 'connecticut-shade');
  assert.equal(component.origin.countryCode, 'EC');
  assert.equal(component.cultivation.method, 'shade');
});

test('allows Mexican San Andrés Maduro and an origin-only Nicaraguan component', () => {
  const component = fixtures.mexicanSanAndresMaduro;

  assert.equal(validateComponent(component), true, ajv.errorsText(validateComponent.errors));
  assert.equal(component.rawLabel, 'Mexican San Andrés Maduro');
  assert.equal(component.tobaccoId, 'san-andres');
  assert.equal(component.origin.countryCode, 'MX');
  assert.equal(component.origin.region, null);
  assert.deepEqual(component.processing, ['maduro']);

  assert.equal(
    validateComponent(fixtures.nicaraguanOnly),
    true,
    ajv.errorsText(validateComponent.errors),
  );
});

test('rejects an empty evidence list when evidence is provided', () => {
  const component = {
    tobaccoId: 'mata-fina',
    rawLabel: 'Mata Fina',
    role: 'filler',
    evidence: [],
  };

  assert.equal(validateComponent(component), false);
});
