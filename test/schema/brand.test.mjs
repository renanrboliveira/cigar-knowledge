import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import YAML from 'yaml';
import { readFrontmatter } from '../../scripts/lib/frontmatter.mjs';

async function compileBrand() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  for (const name of ['common', 'tobacco']) {
    ajv.addSchema(YAML.parse(await readFile(`schema/${name}.schema.yaml`, 'utf8')));
  }
  return ajv.compile(YAML.parse(await readFile('schema/brand.schema.yaml', 'utf8')));
}

test('aceita uma marca com origem, ano e evidencia', async () => {
  const validate = await compileBrand();
  assert.equal(validate(await readFrontmatter('test/fixtures/brand/valid.md')), true);
});

test('recusa historia no frontmatter: prosa e corpo', async () => {
  const validate = await compileBrand();
  assert.equal(
    validate(await readFrontmatter('test/fixtures/brand/invalid-story-in-frontmatter.md')),
    false,
  );
});

test('aceita marca sem pais e sem ano: desconhecido e valido', async () => {
  const validate = await compileBrand();
  assert.equal(validate({ schemaVersion: 1, id: 'sem-dados', name: 'Sem Dados' }), true);
});

test('recusa countryCode fora do formato de duas letras maiusculas', async () => {
  const validate = await compileBrand();
  assert.equal(
    validate({ schemaVersion: 1, id: 'pais-ruim', name: 'País Ruim', countryCode: 'nicaragua' }),
    false,
  );
});
