import YAML from 'yaml';

// O Anilha guarda o catalogo em quatro niveis com unique por pai, e a KB usa
// ids globais. `robusto` aparece oito vezes no Anilha; sozinho ele nao resolve
// para nada. Por isso todo id daqui e o caminho inteiro, e a edicao padrao e
// omitida porque ela nao distingue nada - toda linha tem exatamente uma.

const slugify = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // marcas combinantes: escape numerico de 4 digitos, nunca caractere literal
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const sourceId = (name) => slugify(name);

export function cigarId({ brand, line, release }) {
  return release === 'padrao' ? `${brand}-${line}` : `${brand}-${line}-${release}`;
}

export function variantId({ brand, line, release, variant }) {
  return `${cigarId({ brand, line, release })}-${variant}`;
}

// Todas as linhas de proveniencia do Anilha sao 'confirmada', e as fontes
// distintas sao catalogo de fabricante ou classificacao oficial. O mapa
// abaixo cobre os tres niveis do enum mesmo assim: deixar um buraco faria uma
// linha inesperada virar `undefined` em silencio.
const CONFIANCA = { confirmada: 'high', revisada: 'medium', contribuicao: 'low' };

export function evidenceFrom(confidence, sourceIdValue, pointer) {
  return {
    sourceId: sourceIdValue,
    field: pointer,
    relation: 'supports',
    confidence: CONFIANCA[confidence],
    claimType: 'manufacturer_claim',
    status: 'supported',
  };
}

// Campo nulo vira propriedade AUSENTE, nao `null` solto: a diferenca importa
// porque `additionalProperties: false` mais ausencia comunica "nao sei", e a
// regra 6 diz que isso e um resultado valido.
const semNulos = (objeto) =>
  Object.fromEntries(Object.entries(objeto).filter(([, valor]) => valor !== null && valor !== undefined));

export function mapBrand(row) {
  const evidence = row.story_source_name
    ? [evidenceFrom('confirmada', sourceId(row.story_source_name), '/story')]
    : undefined;

  return {
    id: row.slug,
    frontmatter: semNulos({
      schemaVersion: 1,
      id: row.slug,
      name: row.name,
      countryCode: row.country,
      foundedYear: row.founded_year,
      evidence,
    }),
    body: `# ${row.name}\n${row.story ? `\n${row.story}\n` : ''}`,
  };
}

// Linha nao recebe evidencia: `cigar_line` no Anilha nao tem colunas de origem,
// e inventar procedencia e proibido pela regra 5.
export function mapLine(row) {
  return {
    id: `${row.brand_slug}-${row.slug}`,
    frontmatter: semNulos({
      schemaVersion: 1,
      id: `${row.brand_slug}-${row.slug}`,
      brand: row.brand_slug,
      name: row.name,
    }),
    body: `# ${row.name}\n${row.story ? `\n${row.story}\n` : ''}`,
  };
}

const PONTEIRO = {
  wrapper: '/blend/wrapper',
  binder: '/blend/binder',
  filler: '/blend/filler',
  strength: '/declaredProfile/strength',
};

const assinaturaDoBlend = (v) => `${v.wrapper ?? '~'}|${v.binder ?? '~'}|${v.filler ?? '~'}`;

function componentesDe(variant, provenance, papel) {
  const rawLabel = variant[papel];
  if (rawLabel === null || rawLabel === undefined) return null;

  const fontes = provenance.filter(
    (p) =>
      p.variant_slug === variant.slug &&
      p.line_slug === variant.line_slug &&
      p.release_slug === variant.release_slug &&
      p.field === papel,
  );

  return [
    semNulos({
      rawLabel,
      role: papel,
      evidence: fontes.length
        ? fontes.map((p) => evidenceFrom(p.confidence, sourceId(p.source_name), PONTEIRO[papel]))
        : undefined,
    }),
  ];
}

const blendDe = (variant, provenance) => ({
  wrapper: componentesDe(variant, provenance, 'wrapper'),
  binder: componentesDe(variant, provenance, 'binder'),
  filler: componentesDe(variant, provenance, 'filler'),
});

// O nome do charuto e legivel, nunca o slug: `cigar.schema.yaml` exige `name`
// com minLength 1, e "oliva-serie-g" passaria no schema mentindo para o leitor.
// Edicao nomeada entra no fim; edicao padrao nao acrescenta nada.
const nomeDoCharuto = (r) =>
  r.is_default ? `${r.brand_name} ${r.line_name}` : `${r.brand_name} ${r.line_name} ${r.name}`;

// `blendOverride` so entra quando o blend da variante diverge do resto da
// edicao. O schema exige `evidence` nao vazio junto do blend substituto
// (docs/architecture.md: "A variant may use blendOverride only when it
// includes a complete replacement blend and a nonempty field-level evidence
// list"), porque sem fonte por tras o override seria um blend por tamanho
// inferido de nome, listagem de loja ou impressao de fumada - exatamente o
// que a regra 1 (nunca inventar blend) proibe. Por isso a falha e barulhenta:
// silenciar o override perderia blend real do banco, e emiti-lo sem
// evidencia geraria um documento que o schema recusa (ou que mente, se o
// schema um dia relaxar). Melhor parar aqui e virar decisao humana.
function blendOverrideDe(variant, chave, provenance) {
  const evidence = provenance
    .filter(
      (p) =>
        p.variant_slug === variant.slug &&
        p.line_slug === variant.line_slug &&
        ['wrapper', 'binder', 'filler'].includes(p.field),
    )
    .map((p) => evidenceFrom(p.confidence, sourceId(p.source_name), PONTEIRO[p.field]));

  if (evidence.length === 0) {
    throw new Error(
      `blend divergente sem proveniencia para a variante ${variantId({ ...chave, variant: variant.slug })}: ` +
        'blendOverride exige evidencia, e nao pode ser inventada nem omitida em silencio',
    );
  }

  return { blend: blendDe(variant, provenance), evidence };
}

export function mapCigar(release, variants, provenance) {
  const chave = { brand: release.brand_slug, line: release.line_slug, release: release.slug };
  const id = cigarId(chave);

  // O Anilha guarda blend por variante; a KB guarda no charuto. Quando todas as
  // variantes da edicao concordam, o blend sobe para cigar.blend. Quando
  // divergem, nao existe blend de charuto que seja verdade para todas -
  // declarar o da maioria seria afirmar o que a fonte nao diz. Por isso
  // cigar.blend fica ausente e TODA variante (nao so a que diverge) recebe
  // blendOverride, cada uma com o proprio blend e evidencia.
  const assinaturas = new Set(variants.map(assinaturaDoBlend));
  const compartilhado = assinaturas.size === 1;
  const semBlendNenhum = compartilhado && assinaturaDoBlend(variants[0]) === '~|~|~';

  const declarado = semNulos({
    strength: variants[0].strength,
    body: variants[0].official_body,
    flavorIntensity: variants[0].official_flavor_intensity,
  });

  return {
    id,
    frontmatter: semNulos({
      schemaVersion: 1,
      id,
      brand: release.brand_slug,
      line: `${release.brand_slug}-${release.line_slug}`,
      name: nomeDoCharuto(release),
      blend: compartilhado && !semBlendNenhum ? blendDe(variants[0], provenance) : null,
      release: semNulos({
        releaseYear: release.release_year,
        editionName: release.is_default ? null : release.name,
        productionStatus: 'unknown',
      }),
      declaredProfile: Object.keys(declarado).length ? declarado : undefined,
      variants: variants.map((v) =>
        semNulos({
          id: variantId({ ...chave, variant: v.slug }),
          name: v.vitola,
          vitola: semNulos({
            commercialName: v.vitola,
            lengthMm: v.length_mm,
            ringGauge: v.ring_gauge,
          }),
          blendOverride: compartilhado ? undefined : blendOverrideDe(v, chave, provenance),
        }),
      ),
    }),
    body: `# ${nomeDoCharuto(release)}\n`,
  };
}

export function mapEditorial(row, variantIdValue) {
  const storage = semNulos({
    minRelativeHumidity: row.storage_min_rh,
    maxRelativeHumidity: row.storage_max_rh,
    minCelsius: row.storage_min_c,
    maxCelsius: row.storage_max_c,
  });

  return {
    id: variantIdValue,
    frontmatter: semNulos({
      schemaVersion: 1,
      id: variantIdValue,
      variantId: variantIdValue,
      constructionType: row.construction_type,
      handmade: row.handmade,
      boxPressed: row.box_pressed,
      storage: Object.keys(storage).length ? storage : undefined,
      experienceLevel: row.experience_level,
      complexity: row.complexity,
      pairings: row.pairings,
      tastingNotes: row.tasting_notes,
      evidence: [evidenceFrom('confirmada', sourceId(row.source_name), '/summary')],
    }),
    body: `# ${variantIdValue} — dossiê\n\n${row.summary}\n`,
  };
}

export const render = ({ frontmatter, body }) =>
  `---\n${YAML.stringify(frontmatter).trimEnd()}\n---\n\n${body}`;
