import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  cigarId,
  mapBrand,
  mapCigar,
  mapEditorial,
  mapLine,
  render,
  sourceId,
  variantId,
} from '../scripts/lib/anilha-map.mjs';

const dump = JSON.parse(await readFile('test/fixtures/anilha-dump.json', 'utf8'));
const releaseDe = (linha) => dump.releases.find((r) => r.line_slug === linha);
const variantesDe = (linha) => dump.variants.filter((v) => v.line_slug === linha);

test('o id da variante e o caminho inteiro, nao o slug de folha', () => {
  assert.equal(
    variantId({ brand: 'oliva', line: 'serie-g', release: 'padrao', variant: 'robusto' }),
    'oliva-serie-g-robusto',
  );
  assert.equal(
    variantId({ brand: 'oliva', line: 'serie-v-melanio', release: 'padrao', variant: 'robusto' }),
    'oliva-serie-v-melanio-robusto',
  );
});

test('a edicao padrao nao aparece no id; uma edicao nomeada aparece', () => {
  assert.equal(cigarId({ brand: 'oliva', line: 'serie-g', release: 'padrao' }), 'oliva-serie-g');
  assert.equal(
    cigarId({ brand: 'oliva', line: 'serie-g', release: 'edicao-2020' }),
    'oliva-serie-g-edicao-2020',
  );
});

test('o id da fonte e derivado do nome, em slug', () => {
  assert.equal(sourceId('Oliva Cigars - Serie V Melanio'), 'oliva-cigars-serie-v-melanio');
  assert.equal(sourceId('JAMM Cigar - catalogo oficial'), 'jamm-cigar-catalogo-oficial');
});

test('a marca leva a historia no corpo e a fonte em evidencia', () => {
  const { frontmatter, body } = mapBrand(dump.brands[0]);
  assert.equal(frontmatter.id, 'oliva');
  assert.equal(frontmatter.countryCode, 'NI');
  assert.equal(frontmatter.foundedYear, 1886);
  assert.equal(frontmatter.story, undefined);
  assert.match(body, /A tradição da família Oliva/);
  assert.deepEqual(frontmatter.evidence, [
    {
      sourceId: 'oliva-cigars-the-oliva-legacy',
      field: '/story',
      relation: 'supports',
      confidence: 'high',
      claimType: 'manufacturer_claim',
      status: 'supported',
    },
  ]);
});

test('linha sem historia nao inventa corpo, e linha nenhuma ganha evidencia', () => {
  const comHistoria = mapLine(dump.lines[0]);
  const semHistoria = mapLine(dump.lines[1]);

  assert.match(comHistoria.body, /homenageia Melanio Oliva/);
  assert.equal(semHistoria.body.includes('undefined'), false);
  assert.equal(comHistoria.frontmatter.evidence, undefined);
  assert.equal(semHistoria.frontmatter.evidence, undefined);
});

test('blend igual entre variantes sobe para o charuto, sem blendOverride', () => {
  const { frontmatter } = mapCigar(
    releaseDe('serie-v-melanio'),
    variantesDe('serie-v-melanio'),
    dump.provenance,
  );

  assert.equal(frontmatter.blend.wrapper[0].rawLabel, 'Sumatra equatoriana');
  assert.equal(frontmatter.blend.wrapper[0].role, 'wrapper');
  assert.equal(frontmatter.variants.length, 2);
  assert.equal(frontmatter.variants[0].blendOverride, undefined);
  assert.equal(frontmatter.variants[1].blendOverride, undefined);
});

test('papel desconhecido vira null, nunca lista vazia nem valor plausivel', () => {
  const { frontmatter } = mapCigar(releaseDe('serie-g'), variantesDe('serie-g'), dump.provenance);

  assert.equal(frontmatter.blend.wrapper[0].rawLabel, 'Cameroon');
  assert.equal(frontmatter.blend.binder, null);
  assert.equal(frontmatter.blend.filler, null);
});

test('productionStatus e unknown, porque o Anilha nao tem o dado', () => {
  const { frontmatter } = mapCigar(releaseDe('serie-g'), variantesDe('serie-g'), dump.provenance);
  assert.equal(frontmatter.release.productionStatus, 'unknown');
  assert.equal(frontmatter.release.releaseYear, 2007);
});

test('coluna nula vira propriedade ausente, nao null solto', () => {
  const { frontmatter } = mapCigar(
    releaseDe('serie-v-melanio'),
    variantesDe('serie-v-melanio'),
    dump.provenance,
  );
  assert.equal('releaseYear' in frontmatter.release, false);
  assert.equal('declaredProfile' in frontmatter, false);
});

test('a proveniencia vira evidencia com ponteiro JSON', () => {
  const { frontmatter } = mapCigar(
    releaseDe('serie-v-melanio'),
    variantesDe('serie-v-melanio'),
    dump.provenance,
  );
  const capa = frontmatter.blend.wrapper[0].evidence[0];

  assert.equal(capa.field, '/blend/wrapper');
  assert.equal(capa.confidence, 'high');
  assert.equal(capa.claimType, 'manufacturer_claim');
  assert.equal(capa.relation, 'supports');
  assert.equal(capa.sourceId, 'oliva-cigars-serie-v-melanio');
});

test('o dossie aponta para o caminho inteiro da variante e leva o resumo no corpo', () => {
  const { frontmatter, body } = mapEditorial(dump.editorial[0], 'oliva-serie-g-robusto');

  assert.equal(frontmatter.variantId, 'oliva-serie-g-robusto');
  assert.equal(frontmatter.summary, undefined);
  assert.equal(frontmatter.constructionType, 'Long filler');
  assert.deepEqual(frontmatter.tastingNotes, ['Cedro', 'Cafe']);
  assert.match(body, /mede 114 mm por anel 50/);
});

test('render produz frontmatter delimitado e corpo abaixo', () => {
  const markdown = render(mapBrand(dump.brands[0]));
  assert.match(markdown, /^---\n/);
  assert.match(markdown, /\n---\n\n# Oliva\n/);
});

// Duas variantes da mesma edicao com blends diferentes. A fixture principal
// nao tem esse caso (so ha uma edicao com blend divergente no catalogo real,
// e ela nao esta na fixture pequena), entao ele e montado aqui.
const releaseDivergente = {
  brand_slug: 'oliva',
  brand_name: 'Oliva',
  line_slug: 'serie-o',
  line_name: 'Serie O',
  slug: 'padrao',
  name: null,
  is_default: true,
  release_year: null,
};

const variantesDivergentes = [
  {
    brand_slug: 'oliva',
    line_slug: 'serie-o',
    release_slug: 'padrao',
    slug: 'robusto',
    vitola: 'Robusto',
    length_mm: 127,
    ring_gauge: 50,
    wrapper: 'Ecuador Habano',
    binder: 'Nicaragua',
    filler: 'Nicaragua',
    strength: null,
    official_body: null,
    official_flavor_intensity: null,
  },
  {
    brand_slug: 'oliva',
    line_slug: 'serie-o',
    release_slug: 'padrao',
    slug: 'toro',
    vitola: 'Toro',
    length_mm: 152,
    ring_gauge: 54,
    wrapper: 'Cameroon',
    binder: 'Nicaragua',
    filler: 'Nicaragua',
    strength: null,
    official_body: null,
    official_flavor_intensity: null,
  },
];

test('blend divergente sem proveniencia faz mapCigar lancar, em vez de emitir override vazio', () => {
  assert.throws(
    () => mapCigar(releaseDivergente, variantesDivergentes, []),
    /oliva-serie-o-robusto/,
  );
});

test('blend divergente com proveniencia produz blendOverride valido para cada variante', () => {
  const provenanceDivergente = [
    {
      brand_slug: 'oliva',
      line_slug: 'serie-o',
      release_slug: 'padrao',
      variant_slug: 'robusto',
      field: 'wrapper',
      confidence: 'confirmada',
      source_name: 'Oliva Cigars - Serie O',
      source_url: 'https://olivacigar.com/cigars/serie-o/',
      consulted_at: '2026-08-26',
    },
    {
      brand_slug: 'oliva',
      line_slug: 'serie-o',
      release_slug: 'padrao',
      variant_slug: 'toro',
      field: 'wrapper',
      confidence: 'confirmada',
      source_name: 'Oliva Cigars - Serie O',
      source_url: 'https://olivacigar.com/cigars/serie-o/',
      consulted_at: '2026-08-26',
    },
  ];

  const { frontmatter } = mapCigar(releaseDivergente, variantesDivergentes, provenanceDivergente);

  // regra do julgamento do coordenador: quando divergem, nao ha blend de
  // charuto verdadeiro para todas as variantes, entao cigar.blend fica
  // ausente e TODA variante (nao so a que diverge) leva blendOverride.
  assert.equal('blend' in frontmatter, false);
  assert.equal(frontmatter.variants.length, 2);
  assert.ok(frontmatter.variants[0].blendOverride);
  assert.ok(frontmatter.variants[1].blendOverride);
  assert.equal(frontmatter.variants[0].blendOverride.blend.wrapper[0].rawLabel, 'Ecuador Habano');
  assert.equal(frontmatter.variants[1].blendOverride.blend.wrapper[0].rawLabel, 'Cameroon');
  assert.ok(frontmatter.variants[0].blendOverride.evidence.length > 0);
  assert.ok(frontmatter.variants[1].blendOverride.evidence.length > 0);
});
