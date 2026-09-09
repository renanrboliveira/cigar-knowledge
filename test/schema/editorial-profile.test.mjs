import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import YAML from 'yaml';
import { readFrontmatter } from '../../scripts/lib/frontmatter.mjs';

async function compileEditorial() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  for (const name of ['common', 'tobacco']) {
    ajv.addSchema(YAML.parse(await readFile(`schema/${name}.schema.yaml`, 'utf8')));
  }
  return ajv.compile(YAML.parse(await readFile('schema/editorial-profile.schema.yaml', 'utf8')));
}

const minimo = {
  schemaVersion: 1,
  id: 'x-robusto',
  variantId: 'x-robusto',
  evidence: [
    {
      sourceId: 'example-manufacturer-source',
      field: '/summary',
      relation: 'supports',
      confidence: 'high',
      claimType: 'manufacturer_claim',
      status: 'supported',
    },
  ],
};

test('aceita um dossie completo', async () => {
  const validate = await compileEditorial();
  assert.equal(validate(await readFrontmatter('test/fixtures/editorial-profile/valid.md')), true);
});

test('exige evidencia: todo dossie do Anilha tem fonte not null', async () => {
  const validate = await compileEditorial();
  const { evidence, ...semEvidencia } = minimo;
  assert.equal(validate(semEvidencia), false);
});

test('recusa resumo no frontmatter: o resumo e o corpo', async () => {
  const validate = await compileEditorial();
  assert.equal(validate({ ...minimo, summary: 'prosa' }), false);
});

test('aceita faixa de conservacao parcial', async () => {
  const validate = await compileEditorial();
  assert.equal(
    validate({ ...minimo, storage: { minRelativeHumidity: 65, maxRelativeHumidity: null, minCelsius: null, maxCelsius: null } }),
    true,
  );
});
