// Script de uso unico. Depois da fusao o Anilha deixa de ser origem, e extrair
// de novo seria copiar de volta o que a base acabou de mandar. Ele e apagado no
// ultimo commit desta fatia.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import YAML from 'yaml';
import {
  cigarId,
  mapBrand,
  mapCigar,
  mapEditorial,
  mapLine,
  render,
  sourceId,
  variantId,
} from './lib/anilha-map.mjs';

const dump = JSON.parse(await readFile('anilha-dump.json', 'utf8'));

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
for (const nome of ['common', 'tobacco', 'brand', 'cigar-line', 'cigar', 'editorial-profile', 'source']) {
  ajv.addSchema(YAML.parse(await readFile(`schema/${nome}.schema.yaml`, 'utf8')));
}
const valida = {
  brand: ajv.getSchema('https://cigar-knowledge.local/schema/brand.schema.yaml'),
  line: ajv.getSchema('https://cigar-knowledge.local/schema/cigar-line.schema.yaml'),
  cigar: ajv.getSchema('https://cigar-knowledge.local/schema/cigar.schema.yaml'),
  editorial: ajv.getSchema('https://cigar-knowledge.local/schema/editorial-profile.schema.yaml'),
  source: ajv.getSchema('https://cigar-knowledge.local/schema/source.schema.yaml'),
};

// Falha barulhenta: parar no primeiro caso nao mapeado e melhor que emitir
// documento parcial, porque documento parcial passa no schema e mente depois.
function escreverOuMorrer(tipo, dir, documento) {
  if (!valida[tipo](documento.frontmatter)) {
    console.error(`${dir}/${documento.id}.md: ${ajv.errorsText(valida[tipo].errors, { separator: '\n' })}`);
    process.exit(1);
  }
  return writeFile(`${dir}/${documento.id}.md`, render(documento));
}

for (const dir of ['knowledge/brands', 'knowledge/lines', 'knowledge/cigars', 'knowledge/editorial', 'sources/manufacturers']) {
  await mkdir(dir, { recursive: true });
}

// Fontes: deduplicadas por id derivado do nome, vindas dos tres lugares que as
// carregam no Anilha (historia de marca, proveniencia e dossie).
// A chave do dedup e o sourceId (host+caminho da URL quando ha URL), nao o
// nome: mesmo nome com URLs diferentes sao fontes diferentes, e nomes
// diferentes para a mesma URL colapsam num documento so.
const fontes = new Map();
for (const linha of [...dump.brands.map((b) => ({ nome: b.story_source_name, url: b.story_source_url, data: b.story_consulted_at })), ...dump.provenance.map((p) => ({ nome: p.source_name, url: p.source_url, data: p.consulted_at })), ...dump.editorial.map((e) => ({ nome: e.source_name, url: e.source_url, data: e.consulted_at }))]) {
  if (!linha.nome) continue;
  const id = sourceId(linha.nome, linha.url);
  if (fontes.has(id)) continue;
  fontes.set(id, linha);
}
for (const [id, fonte] of fontes) {
  await escreverOuMorrer('source', 'sources/manufacturers', {
    id,
    frontmatter: { schemaVersion: 1, id, type: 'manufacturer', title: fonte.nome, ...(fonte.url ? { url: fonte.url } : {}), ...(fonte.data ? { accessedAt: fonte.data } : {}) },
    body: `# ${fonte.nome}\n`,
  });
}

for (const marca of dump.brands) await escreverOuMorrer('brand', 'knowledge/brands', mapBrand(marca));
for (const linha of dump.lines) await escreverOuMorrer('line', 'knowledge/lines', mapLine(linha));

for (const release of dump.releases) {
  const variantes = dump.variants.filter(
    (v) => v.brand_slug === release.brand_slug && v.line_slug === release.line_slug && v.release_slug === release.slug,
  );
  if (variantes.length === 0) {
    console.error(`edicao sem variante: ${cigarId({ brand: release.brand_slug, line: release.line_slug, release: release.slug })}`);
    process.exit(1);
  }
  await escreverOuMorrer('cigar', 'knowledge/cigars', mapCigar(release, variantes, dump.provenance));
}

for (const dossie of dump.editorial) {
  const id = variantId({ brand: dossie.brand_slug, line: dossie.line_slug, release: dossie.release_slug, variant: dossie.variant_slug });
  await escreverOuMorrer('editorial', 'knowledge/editorial', mapEditorial(dossie, id));
}

console.log(`fontes ${fontes.size} · marcas ${dump.brands.length} · linhas ${dump.lines.length} · charutos ${dump.releases.length} · dossies ${dump.editorial.length}`);
