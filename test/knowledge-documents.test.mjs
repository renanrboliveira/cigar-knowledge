import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import YAML from 'yaml';
import { readFrontmatter } from '../scripts/lib/frontmatter.mjs';

// A base e a origem unica dos fatos de catalogo e os documentos passam a ser
// editados a mao. Sem este portao, `productionStatus: current` inventado,
// `blendOverride` sem evidencia ou `role: wrapper` dentro de `filler` entram
// pelo commit e o `npm test` continua verde. A validacao que existia morava
// dentro do extrator de uso unico: rodou uma vez e saiu do repositorio junto
// com ele.
const PASTAS = [
  ['knowledge/brands', 'brand'],
  ['knowledge/lines', 'cigar-line'],
  ['knowledge/cigars', 'cigar'],
  ['knowledge/editorial', 'editorial-profile'],
  ['sources/manufacturers', 'source'],
];

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
for (const nome of await readdir('schema')) {
  if (nome.endsWith('.schema.yaml')) ajv.addSchema(YAML.parse(await readFile(`schema/${nome}`, 'utf8')));
}

for (const [pasta, schema] of PASTAS) {
  const valida = ajv.getSchema(`https://cigar-knowledge.local/schema/${schema}.schema.yaml`);
  const arquivos = (await readdir(pasta)).filter((f) => f.endsWith('.md'));

  test(`${pasta} tem documentos para validar`, () => {
    // Pasta vazia passaria em silencio no laco abaixo; a ausencia de
    // documento e exatamente o que a contagem denuncia.
    assert.ok(arquivos.length > 0, `${pasta} nao tem nenhum documento`);
  });

  for (const arquivo of arquivos) {
    test(`${pasta}/${arquivo} valida contra ${schema}.schema.yaml`, async () => {
      const documento = await readFrontmatter(`${pasta}/${arquivo}`);
      assert.ok(
        valida(documento),
        `${pasta}/${arquivo}:\n${ajv.errorsText(valida.errors, { separator: '\n' })}`,
      );
    });
  }
}
