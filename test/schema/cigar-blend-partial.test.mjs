import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import YAML from 'yaml';
import { readFrontmatter } from '../../scripts/lib/frontmatter.mjs';

async function compileCigar() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  for (const name of ['common', 'tobacco']) {
    ajv.addSchema(YAML.parse(await readFile(`schema/${name}.schema.yaml`, 'utf8')));
  }
  return ajv.compile(YAML.parse(await readFile('schema/cigar.schema.yaml', 'utf8')));
}

test('aceita blend com papel desconhecido', async () => {
  const validate = await compileCigar();
  assert.equal(validate(await readFrontmatter('test/fixtures/cigar/partial-blend.md')), true);
});

test('continua aceitando blend completo', async () => {
  const validate = await compileCigar();
  assert.equal(
    validate(await readFrontmatter('test/fixtures/cigar/dona-flor-puro-mata-fina.md')),
    true,
  );
});

test('recusa papel presente porem vazio: desconhecido e null, nunca lista vazia', async () => {
  const validate = await compileCigar();
  assert.equal(
    validate({
      schemaVersion: 1,
      id: 'empty-role',
      brand: 'b',
      line: 'l',
      name: 'Empty Role',
      blend: { wrapper: [], binder: null, filler: null },
      variants: [{ id: 'empty-role-robusto', name: 'Robusto', vitola: { commercialName: 'Robusto' } }],
    }),
    false,
  );
});
