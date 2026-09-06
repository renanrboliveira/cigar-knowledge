# Fusão do catálogo do Anilha na cigar-knowledge

Escrito em 2026-09-06, a partir da leitura dos dois repositórios e de um
levantamento medido no banco local do Anilha. Este documento cobre **apenas a
fusão**: trazer para a KB o que hoje só existe em SQL. A sincronização
contínua no sentido oposto é um projeto separado, descrito na seção
"Fora de escopo".

## Objetivo

A `cigar-knowledge` passa a ser a origem única dos fatos de catálogo. Hoje 46
variantes curadas existem apenas dentro das migrations `014`–`019` do Anilha,
escritas à mão em SQL, e a KB não conhece nenhuma delas. Enquanto isso for
verdade, "origem única" é intenção, não arquitetura.

## Contexto: dois repositórios, um conhecimento

| | `cigar-knowledge` | `anilha` |
|---|---|---|
| Forma | Markdown com frontmatter YAML, validado por JSON Schema | Next 16 + Postgres/Supabase com RLS |
| Papel | pesquisa; consumível por Obsidian e por IAs diferentes | produto |
| Estado | 25 commits, 6 schemas, 2 tabacos, 2 fumadas | 46 variantes, 175 evidências, 46 dossiês |

O spec de 2026-09-03 da KB já declara a intenção: *"consumível por Obsidian,
Claude/AI e, futuramente, por um catálogo de charutos. A knowledge base é a
fonte canônica de conhecimento técnico."* Esta fusão é o que torna a segunda
frase verdadeira.

## Fronteira de propriedade

**A KB é dona do que tem fonte externa. O Anilha é dono do que os usuários
produzem.**

| Camada | Dono | Conteúdo |
|---|---|---|
| Fatos | cigar-knowledge | blend e `rawLabel`, vitola, medidas, `release`, `declaredProfile` |
| Identidade | cigar-knowledge | slug e nome de marca, linha, edição, variante |
| Editorial | cigar-knowledge | história de marca, história de linha, dossiê da variante |
| Comunidade | anilha | imagens enviadas, preços observados, fumadas, avaliações publicadas |

O dossiê editorial fica na KB por um motivo verificável, não por gosto: em
`variant_editorial_profile`, as colunas `source_name`, `source_url` e
`consulted_at` são `not null`, com `source_url` checado por `~ '^https://'`.
Todos os 46 dossiês têm fonte. Pelo critério da fronteira, são conhecimento.

## O defeito de schema que a fusão revela

**11 das 46 variantes têm blend parcial** — um ou dois dos três papéis
conhecidos. O `blend` de `cigar.schema.yaml` declara:

```yaml
required: [wrapper, binder, filler]
```

com `minItems: 1` em cada. A KB não consegue representar essas 11, e a extração
teria apenas duas saídas, ambas proibidas pelas suas próprias regras: inventar
o papel ausente, ou descartar o que se sabe.

Isso contradiz o princípio 6 do `CLAUDE.md` — *"Unknown is valid"*. É um
defeito da KB, exposto pela fusão, e corrigi-lo é pré-requisito da extração.

**Correção:** cada papel de `blend` passa a aceitar `null`, mantendo
`minItems: 1` quando o papel existir. Um papel ausente é desconhecido, nunca
vazio.

## Levantamento

Medido no banco local em 2026-09-06, não estimado.

| Entidade | Quantidade | Observação |
|---|---|---|
| Marcas | 11 | todas com história **e com fonte própria** |
| Linhas | 28 | 23 com história, **nenhuma com fonte** |
| Edições | 28 | todas padrão; 6 com ano; nenhuma com fábrica |
| Variantes | 46 | 25 blend completo, 11 parcial, 10 sem blend |
| Blend divergente na mesma edição | 1 | vira o único `blendOverride` |
| Evidências | 175 | **todas `confirmada`**, de 10 fontes / 13 URLs |
| Dossiês | 46 | todos com fonte obrigatória |
| `expected_minutes` | 0 | não há lacuna a resolver |

Distribuição de variantes por edição: 19 edições com 1, sete com 2, uma com 3,
uma com 10.

## O que a fusão cria

### Schemas novos

```
schema/brand.schema.yaml
schema/cigar-line.schema.yaml
schema/editorial-profile.schema.yaml
```

Mais a correção de `blend` em `schema/cigar.schema.yaml`.

### Documentos gerados

```
knowledge/brands/      11 arquivos
knowledge/lines/       28
knowledge/cigars/      28  (as 46 variantes moram dentro)
knowledge/editorial/   46
sources/               ~13 novos
```

`knowledge/brands/` já existe com `.gitkeep`: a estrutura da KB sempre
antecipou marcas.

### Forma dos documentos

Prosa vai no corpo do Markdown; o que é estruturado vai no frontmatter. Uma
marca:

```markdown
---
schemaVersion: 1
id: oliva
name: Oliva
countryCode: NI
foundedYear: 1886
evidence:
  - sourceId: oliva-the-oliva-legacy
    field: /story
    relation: supports
    confidence: high
    claimType: manufacturer_claim
    status: supported
---

# Oliva

A tradição da família Oliva começou em 1886, quando Melanio Oliva cultivava
tabaco em Pinar del Río.
```

## Identidade: o slug do Anilha não serve sozinho

`cigar_variant` tem unique `(release_id, slug)`, não unique global. Medido: o
slug `robusto` aparece **8 vezes**, em edições diferentes. Um `variantId` solto
como `robusto` não resolve para nada.

A KB já resolveu isso na prática: a fumada real de
`personal/smoke-sessions/joya-de-nicaragua-clasico-medio-siglo-toro.md` referencia
`cigarVariantId: joya-de-nicaragua-clasico-medio-siglo-toro` — um caminho
inteiro, não um slug de folha. E o Anilha já registrou em
`docs/imagens-do-catalogo.md` que o identificador estável entre bancos é o
caminho de slugs `brand/line/release/variant`, porque os uuids são sorteados de
novo a cada `db:reset` e divergem entre ambientes.

**Regra:** todo `id` de variante na KB é a junção do caminho com hífens,
omitindo a edição quando ela é a padrão:

```
brand=oliva, line=serie-v-melanio, release=padrao, variant=robusto
  →  oliva-serie-v-melanio-robusto

brand=joya-de-nicaragua, line=clasico-medio-siglo, release=padrao, variant=toro
  →  joya-de-nicaragua-clasico-medio-siglo-toro
```

O mesmo vale para o `id` do documento `Cigar` (`brand-line`, mais a edição
quando nomeada) e para o `variantId` dos dossiês. Sem essa regra, os 46 dossiês
não conseguem apontar para as variantes certas.

## Mapeamento

| Anilha | KB | Regra |
|---|---|---|
| `brand.slug` / `.name` / `.country` / `.founded_year` | `id` / `name` / `countryCode` / `foundedYear` | direto |
| `brand.story` | corpo do Markdown | prosa é corpo, nunca frontmatter |
| `brand.story_source_*` | documento em `sources/` + evidência em `/story` | |
| `cigar_line.story` | corpo do Markdown | **sem evidência**: `cigar_line` não tem colunas de origem |
| `cigar_release` | documento `Cigar` | `is_default` verdadeiro ⇒ `editionName` nulo |
| `cigar_release.release_year` | `release.releaseYear` | 6 preenchidos |
| — | `release.productionStatus` | a KB exige o campo e o Anilha não o tem: **28 × `unknown`** |
| `cigar_variant.slug` / `.vitola` | `variants[].id` / `.vitola.commercialName` | o `id` é o caminho completo, não o slug de folha — ver "Identidade" |
| `length_mm` / `ring_gauge` | `vitola.lengthMm` / `.ringGauge` | |
| `wrapper` / `binder` / `filler` | `blend.<papel>[].rawLabel` + `role` | a string vai inteira como `rawLabel`; a decomposição é trabalho humano posterior |
| `strength` / `official_body` / `official_flavor_intensity` | `declaredProfile.strength` / `.body` / `.flavorIntensity` | encaixe direto |
| `variant_provenance` | `evidence[]` | ver abaixo |
| `variant_editorial_profile` | documento em `knowledge/editorial/` | um por variante |

### Colapso da proveniência em evidência

As 175 linhas são todas `confidence = 'confirmada'`, e as 10 fontes distintas
são catálogo de fabricante, marcas oficiais ou classificação oficial da
Habanos. Logo:

```
confirmada  →  confidence: high
            →  claimType: manufacturer_claim
            →  relation: supports
            →  status: supported
```

O `claimType` uniforme é conclusão do levantamento, não conveniência. Se a
revisão encontrar uma fonte que não seja declaração de fabricante ou
distribuidor, ela é corrigida à mão — não há regra automática que a distinga.

`variant_provenance.field` é um enum de nomes de coluna; `evidence.field` é um
JSON Pointer. A tradução:

| `provenance_field` | JSON Pointer |
|---|---|
| `wrapper` / `binder` / `filler` | `/blend/wrapper` / `/blend/binder` / `/blend/filler` |
| `length_mm` / `ring_gauge` | `/variants/<i>/vitola/lengthMm` / `/ringGauge` |
| `strength` | `/declaredProfile/strength` |

## O que a extração não decide

Três coisas ficam para revisão humana, e o extrator não deve tentar resolvê-las:

1. **As 23 histórias de linha chegam sem fonte.** Ou uma fonte é pesquisada
   antes, ou elas entram como prosa sem evidência. A KB não pode inventar
   procedência.
2. **`test/fixtures/cigar/dona-flor-puro-mata-fina.md` colide com o
   `dona-flor/mata-fina/robusto` real.** A fixture tem Mata Fina nos três
   papéis; o real tem `filler = 'Mata Norte e Mata Fina'`. Uma das duas sai, e
   qual delas é decisão editorial.
3. **A única edição com blend divergente** vira o único `blendOverride`, que a
   KB exige acompanhado de evidência. A evidência existe, porque
   `variant_provenance` é por variante — mas o caso merece leitura.

## Verificação

O extrator lê um dump JSON produzido por `psql --json`, não o banco
diretamente. Assim não introduz dependência nova na KB (`yaml` já existe) e o
dump fica anexado ao PR como evidência do que foi lido.

Quatro travas, em ordem de importância:

1. **Nenhum campo inventado.** Para cada documento, o número de campos
   preenchidos bate com o número de colunas não nulas no dump. É a única trava
   que testa *"unknown is valid"* mecanicamente. Um extrator que escrevesse
   `productionStatus: current` em vez de `unknown` seria pego aqui.
2. **Contagem.** 11 marcas, 28 linhas, 28 charutos, 46 variantes, 175
   evidências, 46 dossiês. Documento não escrito não gera erro em lugar
   nenhum; só a contagem o denuncia.
3. **Integridade referencial.** Todo `sourceId` resolve para `sources/`; todo
   `variantId` de dossiê resolve para uma variante dentro de algum
   `cigars/*.md`.
4. **Schema.** Todo arquivo gerado passa em `scripts/validate.mjs`, e
   `test/repository-structure.test.mjs` cresce para cobrir as pastas novas.

**Falha barulhenta.** O extrator para no primeiro caso que não souber mapear,
em vez de emitir documento parcial. Blend parcial antes da correção do schema é
erro duro, nunca campo omitido em silêncio.

**O extrator é de uso único.** Depois da fusão o Anilha deixa de ser origem, e
extrair de novo seria copiar de volta o que a KB acabou de mandar. Ele sai do
repositório no último commit da fatia.

## Fora de escopo

- **A sincronização KB → Anilha** (Projeto 2): o gerador que lê a KB e escreve
  uma migration, acionado por comando manual, achatando o blend estruturado nas
  colunas de texto que o Anilha já tem. Só faz sentido depois desta fusão:
  rodá-lo antes apagaria o que ainda não foi extraído.
- **A decomposição dos `rawLabel`** em identidade, origem, cultivo,
  processamento e priming. A fusão preserva a string do fabricante; separá-la é
  trabalho de curadoria, charuto por charuto.
- **As duas fumadas pessoais que já estão na KB.** Elas ficam onde estão até o
  Projeto 2 decidir o dono dos registros pessoais.
- **`AGENTS.md`.** As dez regras da KB estão hoje só em `CLAUDE.md`, o que as
  prende a uma ferramenta. Corrigir isso é útil e independente desta fatia.

## Decisões tomadas

| Decisão | Escolha | Alternativa recusada |
|---|---|---|
| Origem dos fatos | a KB, com backfill das 46 variantes | manter duas origens conforme a data de entrada do charuto |
| Profundidade da primeira sincronização | achatar no schema atual do Anilha | construir o V2 do Anilha antes de sincronizar |
| Operação | comando manual que gera migration | CI comparando, ou escrita direta no banco |
| Lugar do dossiê editorial | documento próprio por variante | campo dentro da variante, ou prosa não validável |
| Extrator | uso único, descartado | ferramenta mantida nos dois sentidos |
