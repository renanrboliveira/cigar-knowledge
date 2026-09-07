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

// A identidade de uma fonte web e a URL, nao o titulo: o Anilha reusa titulo
// para paginas diferentes ("Oliva Cigars - catalogo oficial" cobre tres URLs
// de linha distintas) e varia o titulo para a mesma pagina ("Habanos - Romeo
// y Julieta" e "...Romeo y Julieta Brand"). Um id derivado do titulo faria o
// dedup por nome descartar URLs diferentes em silencio, e a evidencia
// sobrevivente citaria a pagina errada - pior que nao citar nenhuma. Com URL,
// o id vem do host+caminho; sem URL, cai para o slug do nome.
export function sourceId(name, url) {
  if (url) {
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, '');
      return slugify(`${host}${u.pathname}`);
    } catch {
      // URL invalida: nao inventa identidade de host, cai para o nome.
    }
  }
  return slugify(name);
}

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
    ? [evidenceFrom('confirmada', sourceId(row.story_source_name, row.story_source_url), '/story')]
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

// Ponteiro do blend que sobe para o charuto. Dentro de `blendOverride` o
// ponteiro e outro (indexado pela variante), por isso ele nao mora aqui.
const PONTEIRO_BLEND = {
  wrapper: '/blend/wrapper',
  binder: '/blend/binder',
  filler: '/blend/filler',
};

// `length_mm` e `ring_gauge` sao por variante, entao o ponteiro precisa do
// indice dela dentro de `variants`; `strength` e do charuto inteiro. Sem esses
// tres, 89 das 175 linhas de proveniencia do Anilha morriam na traducao e a
// fonte que so as sustenta ficaria orfa em `sources/`.
const PONTEIRO_DO_CHARUTO = {
  length_mm: (i) => `/variants/${i}/vitola/lengthMm`,
  ring_gauge: (i) => `/variants/${i}/vitola/ringGauge`,
  strength: () => '/declaredProfile/strength',
};

const assinaturaDoBlend = (v) => `${v.wrapper ?? '~'}|${v.binder ?? '~'}|${v.filler ?? '~'}`;

// O mesmo criterio do blend, aplicado ao perfil declarado: `declaredProfile`
// saia de `variants[0]` sem checar as outras seria afirmar sobre a edicao
// inteira o que a fonte diz de uma variante so.
const assinaturaDoPerfil = (v) =>
  `${v.strength ?? '~'}|${v.official_body ?? '~'}|${v.official_flavor_intensity ?? '~'}`;

const daVariante = (p, variant) =>
  p.variant_slug === variant.slug &&
  p.line_slug === variant.line_slug &&
  p.release_slug === variant.release_slug;

// `ponteiro` nulo significa "esta evidencia mora em outro lugar": dentro de
// `blendOverride` ela vai na lista do override, com ponteiro indexado, e
// repeti-la no componente contaria o mesmo fato duas vezes.
function componentesDe(variant, provenance, papel, ponteiro) {
  const rawLabel = variant[papel];
  if (rawLabel === null || rawLabel === undefined) return null;

  const fontes = ponteiro
    ? provenance.filter((p) => daVariante(p, variant) && p.field === papel)
    : [];

  return [
    semNulos({
      rawLabel,
      role: papel,
      evidence: fontes.length
        ? fontes.map((p) => evidenceFrom(p.confidence, sourceId(p.source_name, p.source_url), ponteiro))
        : undefined,
    }),
  ];
}

const blendDe = (variant, provenance, ponteiros) => ({
  wrapper: componentesDe(variant, provenance, 'wrapper', ponteiros?.wrapper ?? null),
  binder: componentesDe(variant, provenance, 'binder', ponteiros?.binder ?? null),
  filler: componentesDe(variant, provenance, 'filler', ponteiros?.filler ?? null),
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
function blendOverrideDe(variant, indice, chave, provenance) {
  // O filtro exige `release_slug` tambem: sem ele, uma edicao nomeada que
  // repetisse o slug da vitola herdaria a evidencia da outra edicao da mesma
  // linha, e o override citaria uma pagina que fala de outro charuto.
  const evidence = provenance
    .filter((p) => daVariante(p, variant) && ['wrapper', 'binder', 'filler'].includes(p.field))
    .map((p) =>
      evidenceFrom(
        p.confidence,
        sourceId(p.source_name, p.source_url),
        `/variants/${indice}/blendOverride/blend/${p.field}`,
      ),
    );

  if (evidence.length === 0) {
    throw new Error(
      `blend divergente sem proveniencia para a variante ${variantId({ ...chave, variant: variant.slug })}: ` +
        'blendOverride exige evidencia, e nao pode ser inventada nem omitida em silencio',
    );
  }

  return { blend: blendDe(variant, provenance, null), evidence };
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

  const perfilCompartilhado = new Set(variants.map(assinaturaDoPerfil)).size === 1;
  const declarado = perfilCompartilhado
    ? semNulos({
        strength: variants[0].strength,
        body: variants[0].official_body,
        flavorIntensity: variants[0].official_flavor_intensity,
      })
    : {};

  // Evidencia dos campos que nao sao de blend. Ela mora no nivel do charuto
  // porque o ponteiro atravessa o documento inteiro (`/variants/<i>/...`), e
  // nao dentro de um componente de blend.
  const evidenciaDoCharuto = [];
  const vistas = new Set();
  for (const p of provenance) {
    if (p.brand_slug !== release.brand_slug) continue;
    if (p.line_slug !== release.line_slug || p.release_slug !== release.slug) continue;
    const indice = variants.findIndex((v) => v.slug === p.variant_slug);
    if (indice === -1) continue;
    const ponteiro = PONTEIRO_DO_CHARUTO[p.field];
    if (!ponteiro) continue;
    // Ponteiro pendurado e pior que evidencia ausente: se o perfil divergiu,
    // `/declaredProfile/strength` nao existe no documento e a evidencia nao vai.
    if (p.field === 'strength' && !('strength' in declarado)) continue;
    const evidencia = evidenceFrom(
      p.confidence,
      sourceId(p.source_name, p.source_url),
      ponteiro(indice),
    );
    // `strength` e um campo so do charuto: varias variantes com proveniencia
    // dele produziriam a mesma evidencia repetida.
    const chaveDedup = JSON.stringify(evidencia);
    if (vistas.has(chaveDedup)) continue;
    vistas.add(chaveDedup);
    evidenciaDoCharuto.push(evidencia);
  }

  return {
    id,
    frontmatter: semNulos({
      schemaVersion: 1,
      id,
      brand: release.brand_slug,
      line: `${release.brand_slug}-${release.line_slug}`,
      name: nomeDoCharuto(release),
      evidence: evidenciaDoCharuto.length ? evidenciaDoCharuto : undefined,
      blend: compartilhado && !semBlendNenhum ? blendDe(variants[0], provenance, PONTEIRO_BLEND) : null,
      release: semNulos({
        releaseYear: release.release_year,
        editionName: release.is_default ? null : release.name,
        productionStatus: 'unknown',
      }),
      declaredProfile: Object.keys(declarado).length ? declarado : undefined,
      variants: variants.map((v, i) =>
        semNulos({
          id: variantId({ ...chave, variant: v.slug }),
          name: v.vitola,
          vitola: semNulos({
            commercialName: v.vitola,
            lengthMm: v.length_mm,
            ringGauge: v.ring_gauge,
          }),
          blendOverride: compartilhado ? undefined : blendOverrideDe(v, i, chave, provenance),
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
      // Array vazio afirma "nao harmoniza com nada"; ausencia diz "nao sei",
      // que e o que o banco realmente registra (regra 6).
      pairings: row.pairings?.length ? row.pairings : undefined,
      tastingNotes: row.tasting_notes?.length ? row.tasting_notes : undefined,
      // Regra 3: fato e afirmacao sensorial nao levam o mesmo carimbo. O resumo
      // e declaracao do fabricante; as notas de degustacao sao descricao
      // sensorial, e `tobacco.schema.yaml` tem `sensory_description` para isso.
      evidence: [
        evidenceFrom('confirmada', sourceId(row.source_name, row.source_url), '/summary'),
        ...(row.tasting_notes?.length
          ? [
              {
                ...evidenceFrom('confirmada', sourceId(row.source_name, row.source_url), '/tastingNotes'),
                claimType: 'sensory_description',
              },
            ]
          : []),
      ],
    }),
    body: `# ${variantIdValue} — dossiê\n\n${row.summary}\n`,
  };
}

export const render = ({ frontmatter, body }) =>
  `---\n${YAML.stringify(frontmatter).trimEnd()}\n---\n\n${body}`;
