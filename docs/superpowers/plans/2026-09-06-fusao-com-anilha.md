# Fusão do catálogo do Anilha Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trazer para a `cigar-knowledge` as 46 variantes, 11 marcas, 28 linhas, 175 evidências e 46 dossiês que hoje só existem dentro das migrations do Anilha, de forma que a KB passe a ser a origem única dos fatos de catálogo.

**Architecture:** Três schemas novos (marca, linha, dossiê editorial) mais uma correção no schema de blend. Um mapeador puro converte linhas de um dump JSON em documentos da KB e carrega todos os testes; um extrator fino faz I/O, roda uma vez e é apagado. Os documentos gerados são o produto permanente; o extrator e o dump não.

**Tech Stack:** Node 22 com `node --test`, `ajv` 8.17.1 + `ajv-formats` 3.0.1, `yaml` 2.8.1. Sem dependência nova. O dump vem de `psql --json` contra o Postgres local do Anilha.

**Spec:** `docs/superpowers/specs/2026-09-06-fusao-com-anilha-design.md`

## Global Constraints

- **Nunca inventar informação de blend.** Regra 1 do `CLAUDE.md` da KB. Um campo sem valor no dump vira campo ausente no Markdown, nunca um valor plausível.
- **Preservar o `rawLabel` do fabricante.** A string do Anilha vai inteira; decompor é trabalho humano posterior, fora desta fatia.
- **`Unknown` é válido.** Regra 6. `null` e ausência são resultados corretos.
- **Não misturar** identidade, origem, genética, cultivo, processamento, descriptor, priming e papel no blend. Regra 7.
- **Prosa vai no corpo do Markdown; o que é estruturado vai no frontmatter.** Nenhum texto longo entra em YAML.
- **`additionalProperties: false` em todo schema novo**, como nos seis que já existem.
- **Todo `id` de variante é o caminho completo** `brand-line-variant` (mais a edição quando ela é nomeada), nunca o slug de folha: `cigar_variant` tem unique `(release_id, slug)` e o slug `robusto` aparece 8 vezes.
- **`schemaVersion: 1`** em todo documento, via `$ref` para `common.schema.yaml#/$defs/schemaVersion`.
- **Idioma:** schemas, código e nomes de campo em inglês; conteúdo editorial extraído permanece em português, como está no Anilha.
- **Sem dependência nova.** `package.json` não pode mudar.

---

## Mapa de arquivos

| Arquivo | Responsabilidade | Task |
|---|---|---|
| `schema/cigar.schema.yaml` | permitir papel de blend nulo (**pré-requisito**) | 1 |
| `schema/brand.schema.yaml` | identidade e origem de marca | 2 |
| `schema/cigar-line.schema.yaml` | identidade de linha | 3 |
| `schema/editorial-profile.schema.yaml` | dossiê por variante | 4 |
| `scripts/lib/anilha-map.mjs` | funções puras dump → documento; carrega os testes | 5 |
| `scripts/extract-from-anilha.mjs` | I/O e as quatro travas; **apagado na Task 7** | 6 |
| `knowledge/brands/`, `lines/`, `cigars/`, `editorial/`, `sources/` | os 113 documentos gerados | 6 |
| `test/repository-structure.test.mjs` | pastas novas | 7 |
| `README.md` | mapa do repositório | 7 |

---

### Task 1: Blend parcial deixa de ser inexprimível

**Files:**
- Modify: `schema/cigar.schema.yaml` (o `$defs/blend`)
- Create: `test/fixtures/cigar/partial-blend.md`
- Create: `test/schema/cigar-blend-partial.test.mjs`

**Interfaces:**
- Consumes: nada.
- Produces: `blend.wrapper`, `blend.binder` e `blend.filler` passam a aceitar `null`. Todas as tasks seguintes dependem disso: 11 das 46 variantes têm blend parcial.

**Por que esta task vem primeiro:** hoje `blend` declara `required: [wrapper, binder, filler]` com `minItems: 1` em cada. Onze variantes reais têm um ou dois papéis conhecidos. Sem esta correção a extração só teria duas saídas, ambas proibidas pelas regras da KB: inventar o papel ausente ou descartar o conhecido.

- [ ] **Step 1: Write the failing test**

Crie `test/fixtures/cigar/partial-blend.md`:

```markdown
---
schemaVersion: 1
id: partial-blend-fixture
brand: partial-blend-brand
line: partial-blend-line
name: Partial Blend Fixture
blend:
  wrapper:
    - rawLabel: Documented Wrapper
      role: wrapper
      evidence:
        - sourceId: example-manufacturer-source
          field: /blend/wrapper
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: supported
  binder: null
  filler: null
variants:
  - id: partial-blend-fixture-robusto
    name: Robusto
    vitola:
      commercialName: Robusto
---

# Partial Blend Fixture

Fixture de schema: capa documentada, capote e miolo desconhecidos. Desconhecido
é um resultado válido e não pode ser confundido com ausência de charuto.
```

Crie `test/schema/cigar-blend-partial.test.mjs`:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm install && node --test test/schema/cigar-blend-partial.test.mjs`
Expected: o primeiro caso FALHA (`must have required property 'binder'` ou `must be array`); o segundo passa; o terceiro passa.

- [ ] **Step 3: Fix the schema**

Em `schema/cigar.schema.yaml`, dentro de `$defs.blend`, troque **cada um** dos três papéis por esta forma (o exemplo é `wrapper`; repita para `binder` e `filler` trocando as duas ocorrências do nome):

```yaml
      wrapper:
        anyOf:
          - type: 'null'
          - type: array
            minItems: 1
            items:
              allOf:
                - $ref: https://cigar-knowledge.local/schema/tobacco.schema.yaml#/$defs/tobaccoComponent
                - type: object
                  properties:
                    role:
                      const: wrapper
```

`required: [wrapper, binder, filler]` **permanece**: o papel precisa ser declarado, e declará-lo como `null` é a forma de dizer "desconhecido". Lista vazia continua recusada, porque `[]` significaria "sem tabaco nenhum neste papel", que é diferente de "não sei".

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/schema/cigar-blend-partial.test.mjs && npm test`
Expected: os três casos passam e a suíte inteira continua verde — em especial `test/schema/cigar-blend.test.mjs` e `cigar-example.test.mjs`, que já exercitam o blend completo.

- [ ] **Step 5: Commit**

```bash
git add schema/cigar.schema.yaml test/fixtures/cigar/partial-blend.md test/schema/cigar-blend-partial.test.mjs
git commit -m "fix: permitir papel de blend desconhecido

Onze das 46 variantes reais tem capa conhecida e capote desconhecido, ou
combinacao parecida. O schema exigia os tres papeis, entao a unica forma de
representa-las seria inventar o papel ausente ou descartar o conhecido - as
duas proibidas pelas regras 1 e 6 da base.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Schema de marca

**Files:**
- Create: `schema/brand.schema.yaml`
- Create: `test/fixtures/brand/valid.md`
- Create: `test/fixtures/brand/invalid-story-in-frontmatter.md`
- Create: `test/schema/brand.test.mjs`

**Interfaces:**
- Consumes: `common.schema.yaml#/$defs/schemaVersion` e `#/$defs/slug`; `tobacco.schema.yaml#/$defs/evidenceRef`.
- Produces: `schema/brand.schema.yaml` com `$id: https://cigar-knowledge.local/schema/brand.schema.yaml`. Campos: `schemaVersion`, `id`, `name` (obrigatórios), `countryCode`, `foundedYear`, `evidence`.

**A decisão que este schema codifica:** a história da marca **não é um campo**. Ela é o corpo do Markdown. Um schema que aceitasse `story` no frontmatter convidaria prosa longa para dentro do YAML, e a KB inteira separa as duas coisas.

- [ ] **Step 1: Write the failing test**

Crie `test/fixtures/brand/valid.md`:

```markdown
---
schemaVersion: 1
id: oliva
name: Oliva
countryCode: NI
foundedYear: 1886
evidence:
  - sourceId: example-manufacturer-source
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

Crie `test/fixtures/brand/invalid-story-in-frontmatter.md`:

```markdown
---
schemaVersion: 1
id: oliva-invalida
name: Oliva
story: A historia pertence ao corpo do documento, nao ao frontmatter.
---

# Oliva inválida

Fixture que prova que prosa não entra no YAML.
```

Crie `test/schema/brand.test.mjs`:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/schema/brand.test.mjs`
Expected: FAIL com `ENOENT` em `schema/brand.schema.yaml`.

- [ ] **Step 3: Write the schema**

Crie `schema/brand.schema.yaml`:

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://cigar-knowledge.local/schema/brand.schema.yaml
type: object
required:
  - schemaVersion
  - id
  - name
additionalProperties: false
properties:
  schemaVersion:
    $ref: https://cigar-knowledge.local/schema/common.schema.yaml#/$defs/schemaVersion
  id:
    $ref: https://cigar-knowledge.local/schema/common.schema.yaml#/$defs/slug
  name:
    type: string
    minLength: 1
  countryCode:
    anyOf:
      - type: string
        pattern: ^[A-Z]{2}$
      - type: 'null'
  foundedYear:
    anyOf:
      - type: integer
      - type: 'null'
  evidence:
    type: array
    minItems: 1
    items:
      $ref: https://cigar-knowledge.local/schema/tobacco.schema.yaml#/$defs/evidenceRef
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/schema/brand.test.mjs && npm test`
Expected: os quatro casos passam e a suíte segue verde.

- [ ] **Step 5: Commit**

```bash
git add schema/brand.schema.yaml test/fixtures/brand test/schema/brand.test.mjs
git commit -m "feat: definir o schema de marca

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Schema de linha

**Files:**
- Create: `schema/cigar-line.schema.yaml`
- Create: `test/fixtures/cigar-line/valid.md`
- Create: `test/schema/cigar-line.test.mjs`

**Interfaces:**
- Consumes: `common.schema.yaml`; `tobacco.schema.yaml#/$defs/evidenceRef`.
- Produces: `schema/cigar-line.schema.yaml` com `$id: https://cigar-knowledge.local/schema/cigar-line.schema.yaml`. Campos: `schemaVersion`, `id`, `brand`, `name` (obrigatórios), `evidence` (opcional).

**Por que `evidence` é opcional aqui e não na marca:** `cigar_line` no Anilha **não tem colunas de origem**. As 23 histórias de linha chegam sem fonte, e a KB não pode inventar uma. Exigir evidência forçaria a extração a fabricar procedência — exatamente o que a regra 5 proíbe. Marca é diferente: as 11 têm `story_source_name`, `story_source_url` e `story_consulted_at` preenchidos.

- [ ] **Step 1: Write the failing test**

Crie `test/fixtures/cigar-line/valid.md`:

```markdown
---
schemaVersion: 1
id: oliva-serie-v-melanio
brand: oliva
name: Serie V Melanio
---

# Serie V Melanio

A Serie V Melanio homenageia Melanio Oliva, primeiro cultivador de tabaco da
família.
```

Crie `test/schema/cigar-line.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import YAML from 'yaml';
import { readFrontmatter } from '../../scripts/lib/frontmatter.mjs';

async function compileLine() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  for (const name of ['common', 'tobacco']) {
    ajv.addSchema(YAML.parse(await readFile(`schema/${name}.schema.yaml`, 'utf8')));
  }
  return ajv.compile(YAML.parse(await readFile('schema/cigar-line.schema.yaml', 'utf8')));
}

test('aceita uma linha sem evidencia: 23 das 28 chegam sem fonte', async () => {
  const validate = await compileLine();
  assert.equal(validate(await readFrontmatter('test/fixtures/cigar-line/valid.md')), true);
});

test('exige a marca a que a linha pertence', async () => {
  const validate = await compileLine();
  assert.equal(validate({ schemaVersion: 1, id: 'orfa', name: 'Órfã' }), false);
});

test('recusa historia no frontmatter', async () => {
  const validate = await compileLine();
  assert.equal(
    validate({ schemaVersion: 1, id: 'l', brand: 'b', name: 'L', story: 'prosa' }),
    false,
  );
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/schema/cigar-line.test.mjs`
Expected: FAIL com `ENOENT` em `schema/cigar-line.schema.yaml`.

- [ ] **Step 3: Write the schema**

Crie `schema/cigar-line.schema.yaml`:

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://cigar-knowledge.local/schema/cigar-line.schema.yaml
type: object
required:
  - schemaVersion
  - id
  - brand
  - name
additionalProperties: false
properties:
  schemaVersion:
    $ref: https://cigar-knowledge.local/schema/common.schema.yaml#/$defs/schemaVersion
  id:
    $ref: https://cigar-knowledge.local/schema/common.schema.yaml#/$defs/slug
  brand:
    $ref: https://cigar-knowledge.local/schema/common.schema.yaml#/$defs/slug
  name:
    type: string
    minLength: 1
  evidence:
    type: array
    minItems: 1
    items:
      $ref: https://cigar-knowledge.local/schema/tobacco.schema.yaml#/$defs/evidenceRef
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/schema/cigar-line.test.mjs && npm test`
Expected: PASS, três de três, suíte verde.

- [ ] **Step 5: Commit**

```bash
git add schema/cigar-line.schema.yaml test/fixtures/cigar-line test/schema/cigar-line.test.mjs
git commit -m "feat: definir o schema de linha

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Schema do dossiê editorial

**Files:**
- Create: `schema/editorial-profile.schema.yaml`
- Create: `test/fixtures/editorial-profile/valid.md`
- Create: `test/schema/editorial-profile.test.mjs`

**Interfaces:**
- Consumes: `common.schema.yaml`; `tobacco.schema.yaml#/$defs/evidenceRef`.
- Produces: `schema/editorial-profile.schema.yaml` com `$id: https://cigar-knowledge.local/schema/editorial-profile.schema.yaml`. Campos obrigatórios: `schemaVersion`, `id`, `variantId`, `evidence`. Opcionais: `constructionType`, `handmade`, `boxPressed`, `storage`, `experienceLevel`, `complexity`, `pairings`, `tastingNotes`.

**Duas decisões que este schema codifica:**

1. **`evidence` é obrigatória.** No Anilha, `variant_editorial_profile.source_name`, `.source_url` e `.consulted_at` são `not null`, e `source_url` é checado por `~ '^https://'`. Todos os 46 dossiês têm fonte; um dossiê sem fonte não deveria existir na KB.
2. **O resumo é o corpo, não um campo.** Mesmo raciocínio da marca. O `summary` do Anilha vira o texto do documento.

- [ ] **Step 1: Write the failing test**

Crie `test/fixtures/editorial-profile/valid.md`:

```markdown
---
schemaVersion: 1
id: jamm-cigar-edicao-especial-limitada-maduro-fuego
variantId: jamm-cigar-edicao-especial-limitada-maduro-fuego
constructionType: Long filler
handmade: true
boxPressed: null
experienceLevel: Experiente
complexity: Intensa
pairings: []
tastingNotes: []
evidence:
  - sourceId: example-manufacturer-source
    field: /summary
    relation: supports
    confidence: high
    claimType: manufacturer_claim
    status: supported
---

# JAMM Maduro Fuego — dossiê

O JAMM Maduro Fuego mede 125 mm por anel 60 e usa tabaco Cubra envelhecido por
dois anos em uma proposta de intensidade média-forte.
```

Crie `test/schema/editorial-profile.test.mjs`:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/schema/editorial-profile.test.mjs`
Expected: FAIL com `ENOENT` em `schema/editorial-profile.schema.yaml`.

- [ ] **Step 3: Write the schema**

Crie `schema/editorial-profile.schema.yaml`:

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://cigar-knowledge.local/schema/editorial-profile.schema.yaml
type: object
required:
  - schemaVersion
  - id
  - variantId
  - evidence
additionalProperties: false
properties:
  schemaVersion:
    $ref: https://cigar-knowledge.local/schema/common.schema.yaml#/$defs/schemaVersion
  id:
    $ref: https://cigar-knowledge.local/schema/common.schema.yaml#/$defs/slug
  variantId:
    $ref: https://cigar-knowledge.local/schema/common.schema.yaml#/$defs/slug
  constructionType:
    type:
      - string
      - 'null'
  handmade:
    type:
      - boolean
      - 'null'
  boxPressed:
    type:
      - boolean
      - 'null'
  storage:
    type: object
    additionalProperties: false
    properties:
      minRelativeHumidity:
        type:
          - integer
          - 'null'
      maxRelativeHumidity:
        type:
          - integer
          - 'null'
      minCelsius:
        type:
          - integer
          - 'null'
      maxCelsius:
        type:
          - integer
          - 'null'
  experienceLevel:
    type:
      - string
      - 'null'
  complexity:
    type:
      - string
      - 'null'
  pairings:
    type: array
    items:
      type: string
      minLength: 1
  tastingNotes:
    type: array
    items:
      type: string
      minLength: 1
  evidence:
    type: array
    minItems: 1
    items:
      $ref: https://cigar-knowledge.local/schema/tobacco.schema.yaml#/$defs/evidenceRef
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/schema/editorial-profile.test.mjs && npm test`
Expected: PASS, quatro de quatro, suíte verde.

- [ ] **Step 5: Commit**

```bash
git add schema/editorial-profile.schema.yaml test/fixtures/editorial-profile test/schema/editorial-profile.test.mjs
git commit -m "feat: definir o schema do dossie editorial

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: O mapeador puro

**Files:**
- Create: `scripts/lib/anilha-map.mjs`
- Create: `test/fixtures/anilha-dump.json`
- Create: `test/anilha-map.test.mjs`

**Interfaces:**
- Consumes: os quatro schemas das tasks 1–4.
- Produces, todos exportados de `scripts/lib/anilha-map.mjs`:
  - `variantId({ brand, line, release, variant })` → `string`
  - `cigarId({ brand, line, release })` → `string`
  - `sourceId(name)` → `string`
  - `evidenceFrom(confidence, sourceIdValue, pointer)` → `object`
  - `mapBrand(row)` → `{ id, frontmatter, body }`
  - `mapLine(row)` → `{ id, frontmatter, body }`
  - `mapCigar(release, variants, provenance)` → `{ id, frontmatter, body }`
  - `mapEditorial(row, variantIdValue)` → `{ id, frontmatter, body }`
  - `render({ frontmatter, body })` → `string` (Markdown completo)

**Esta é a task que carrega a inteligência da fatia.** O extrator da Task 6 é I/O fino em volta destas funções. Todas são puras: recebem linhas do dump e devolvem objetos, sem tocar em disco.

**As três regras difíceis, que os testes existem para travar:**

1. **Identidade.** `variantId` junta `brand-line-variant` com hífens, e insere a edição no meio **apenas quando ela não é a padrão**. Sem isso os 46 dossiês apontam para o lugar errado: o slug `robusto` aparece 8 vezes.
2. **Içar o blend.** O Anilha guarda blend por variante; a KB guarda no charuto, com `blendOverride` por variante. Quando todas as variantes de uma edição compartilham o mesmo blend, ele sobe para `cigar.blend`. Quando divergem — um caso em 28 — **nenhum** blend sobe para o charuto e **cada** variante declara o seu em `blendOverride`, que a KB exige acompanhado de evidência. Declarar o blend da maioria no nível do charuto afirmaria o que a fonte não diz. E uma variante divergente sem evidência de blend faz `mapCigar` lançar, em vez de emitir um override que `docs/architecture.md:29-32` proíbe.
3. **Nada de campo inventado.** Coluna nula no dump vira propriedade ausente, exceto onde a KB exige o campo: `release.productionStatus` recebe `unknown`, que é um valor do enum e significa exatamente "não sei".

- [ ] **Step 1: Write the dump fixture**

Crie `test/fixtures/anilha-dump.json`. Ele é pequeno de propósito e cobre os três casos difíceis: uma edição com duas variantes de mesmo blend, uma variante de blend parcial, e uma edição com blend divergente.

```json
{
  "brands": [
    {
      "slug": "oliva",
      "name": "Oliva",
      "country": "NI",
      "founded_year": 1886,
      "story": "A tradição da família Oliva começou em 1886.",
      "story_source_name": "Oliva Cigars - The Oliva Legacy",
      "story_source_url": "https://olivacigar.com/the-oliva-legacy/",
      "story_consulted_at": "2026-08-26"
    }
  ],
  "lines": [
    { "brand_slug": "oliva", "slug": "serie-v-melanio", "name": "Serie V Melanio", "story": "A Serie V Melanio homenageia Melanio Oliva." },
    { "brand_slug": "oliva", "slug": "serie-g", "name": "Serie G", "story": null }
  ],
  "releases": [
    { "brand_slug": "oliva", "brand_name": "Oliva", "line_slug": "serie-v-melanio", "line_name": "Serie V Melanio", "slug": "padrao", "name": null, "is_default": true, "release_year": null },
    { "brand_slug": "oliva", "brand_name": "Oliva", "line_slug": "serie-g", "line_name": "Serie G", "slug": "padrao", "name": null, "is_default": true, "release_year": 2007 }
  ],
  "variants": [
    { "brand_slug": "oliva", "line_slug": "serie-v-melanio", "release_slug": "padrao", "slug": "robusto", "vitola": "Robusto", "length_mm": 127, "ring_gauge": 52, "wrapper": "Sumatra equatoriana", "binder": "Nicaragua", "filler": "Ligero de Jalapa, Nicaragua", "strength": null, "official_body": null, "official_flavor_intensity": null },
    { "brand_slug": "oliva", "line_slug": "serie-v-melanio", "release_slug": "padrao", "slug": "figurado", "vitola": "Figurado", "length_mm": 165, "ring_gauge": 54, "wrapper": "Sumatra equatoriana", "binder": "Nicaragua", "filler": "Ligero de Jalapa, Nicaragua", "strength": null, "official_body": null, "official_flavor_intensity": null },
    { "brand_slug": "oliva", "line_slug": "serie-g", "release_slug": "padrao", "slug": "robusto", "vitola": "Robusto", "length_mm": 114, "ring_gauge": 50, "wrapper": "Cameroon", "binder": null, "filler": null, "strength": 3, "official_body": null, "official_flavor_intensity": null }
  ],
  "provenance": [
    { "brand_slug": "oliva", "line_slug": "serie-v-melanio", "release_slug": "padrao", "variant_slug": "robusto", "field": "wrapper", "confidence": "confirmada", "source_name": "Oliva Cigars - Serie V Melanio", "source_url": "https://olivacigar.com/cigars/serie-v-melanio/", "consulted_at": "2026-08-26" },
    { "brand_slug": "oliva", "line_slug": "serie-g", "release_slug": "padrao", "variant_slug": "robusto", "field": "strength", "confidence": "confirmada", "source_name": "Oliva Cigars - catalogo oficial", "source_url": "https://olivacigar.com/", "consulted_at": "2026-08-26" }
  ],
  "editorial": [
    { "brand_slug": "oliva", "line_slug": "serie-g", "release_slug": "padrao", "variant_slug": "robusto", "summary": "O Oliva Serie G Robusto mede 114 mm por anel 50.", "construction_type": "Long filler", "handmade": true, "box_pressed": null, "storage_min_rh": null, "storage_max_rh": null, "storage_min_c": null, "storage_max_c": null, "experience_level": "Intermediario", "complexity": "Equilibrada", "pairings": [], "tasting_notes": ["Cedro", "Cafe"], "source_name": "Oliva Cigars - Serie G", "source_url": "https://olivacigar.com/cigars/serie-g/", "consulted_at": "2026-08-26" }
  ]
}
```

- [ ] **Step 2: Write the failing tests**

Crie `test/anilha-map.test.mjs`:

```js
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `node --test test/anilha-map.test.mjs`
Expected: FAIL com `Cannot find module '../scripts/lib/anilha-map.mjs'`.

- [ ] **Step 4: Write the mapper**

Crie `scripts/lib/anilha-map.mjs`:

```js
import YAML from 'yaml';

// O Anilha guarda o catalogo em quatro niveis com unique por pai, e a KB usa
// ids globais. `robusto` aparece oito vezes no Anilha; sozinho ele nao resolve
// para nada. Por isso todo id daqui e o caminho inteiro, e a edicao padrao e
// omitida porque ela nao distingue nada - toda linha tem exatamente uma.

const slugify = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // marcas combinantes, escapadas de proposito
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

// Todas as 175 linhas de proveniencia do Anilha sao 'confirmada', e as dez
// fontes distintas sao catalogo de fabricante ou classificacao oficial. O mapa
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

export function mapCigar(release, variants, provenance) {
  const chave = { brand: release.brand_slug, line: release.line_slug, release: release.slug };
  const id = cigarId(chave);

  // O Anilha guarda blend por variante; a KB guarda no charuto. Quando todas as
  // variantes da edicao concordam, o blend sobe. Quando divergem, a variante
  // divergente recebe blendOverride, que a KB so aceita com evidencia junto.
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
          blendOverride: compartilhado
            ? undefined
            : {
                blend: blendDe(v, provenance),
                // So evidencia de blend entra aqui. `strength` tem ponteiro
                // para /declaredProfile e apontaria para fora do que o
                // blendOverride afirma.
                evidence: provenance
                  .filter(
                    (p) =>
                      p.variant_slug === v.slug &&
                      p.line_slug === v.line_slug &&
                      ['wrapper', 'binder', 'filler'].includes(p.field),
                  )
                  .map((p) => evidenceFrom(p.confidence, sourceId(p.source_name), PONTEIRO[p.field])),
              },
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test test/anilha-map.test.mjs && npm test`
Expected: os doze casos passam e a suíte segue verde.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/anilha-map.mjs test/fixtures/anilha-dump.json test/anilha-map.test.mjs
git commit -m "feat: mapear o catalogo do anilha para documentos da base

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: A extração

**Files:**
- Create: `scripts/extract-from-anilha.mjs`
- Create: `knowledge/brands/*.md` (11), `knowledge/lines/*.md` (28), `knowledge/cigars/*.md` (28), `knowledge/editorial/*.md` (46), `sources/manufacturers/*.md` (~13)
- Modify: `.gitignore` (ignorar o dump)

**Interfaces:**
- Consumes: tudo de `scripts/lib/anilha-map.mjs` (Task 5) e os quatro schemas.
- Produces: os 126 documentos gerados. Nenhuma outra task depende do script em si — ele é apagado na Task 7.

**Pré-requisito de ambiente:** o Postgres local do Anilha precisa estar de pé. Confira com
`psql "postgresql://postgres:postgres@127.0.0.1:54522/postgres" -Atc "select count(*) from cigar_variant"`, que deve responder `46`. Se não responder, rode `npm run db:start` e `npm run db:reset` em `~/dev/anilha` antes de continuar.

- [ ] **Step 1: Generate the dump**

Rode, a partir de `~/dev/cigar-knowledge`:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54522/postgres" -At -c "
select json_build_object(
  'brands', (select coalesce(json_agg(row_to_json(b)), '[]') from (
      select slug, name, country, founded_year, story,
             story_source_name, story_source_url, story_consulted_at
      from brand order by slug) b),
  'lines', (select coalesce(json_agg(row_to_json(l)), '[]') from (
      select b.slug brand_slug, cl.slug, cl.name, cl.story
      from cigar_line cl join brand b on b.id = cl.brand_id order by 1, 2) l),
  'releases', (select coalesce(json_agg(row_to_json(r)), '[]') from (
      select b.slug brand_slug, b.name brand_name, cl.slug line_slug,
             cl.name line_name, cr.slug, cr.name,
             cr.is_default, cr.release_year
      from cigar_release cr
      join cigar_line cl on cl.id = cr.line_id
      join brand b on b.id = cl.brand_id order by 1, 2, 3) r),
  'variants', (select coalesce(json_agg(row_to_json(v)), '[]') from (
      select b.slug brand_slug, cl.slug line_slug, cr.slug release_slug, cv.slug,
             cv.vitola, cv.length_mm, cv.ring_gauge, cv.wrapper, cv.binder,
             cv.filler, cv.strength, cv.official_body, cv.official_flavor_intensity
      from cigar_variant cv
      join cigar_release cr on cr.id = cv.release_id
      join cigar_line cl on cl.id = cr.line_id
      join brand b on b.id = cl.brand_id order by 1, 2, 3, 4) v),
  'provenance', (select coalesce(json_agg(row_to_json(p)), '[]') from (
      select b.slug brand_slug, cl.slug line_slug, cr.slug release_slug,
             cv.slug variant_slug, vp.field::text, vp.confidence::text,
             vp.source_name, vp.source_url, vp.consulted_at
      from variant_provenance vp
      join cigar_variant cv on cv.id = vp.variant_id
      join cigar_release cr on cr.id = cv.release_id
      join cigar_line cl on cl.id = cr.line_id
      join brand b on b.id = cl.brand_id order by 1, 2, 3, 4, 5) p),
  'editorial', (select coalesce(json_agg(row_to_json(e)), '[]') from (
      select b.slug brand_slug, cl.slug line_slug, cr.slug release_slug,
             cv.slug variant_slug, ep.summary, ep.construction_type, ep.handmade,
             ep.box_pressed, ep.storage_min_rh, ep.storage_max_rh,
             ep.storage_min_c, ep.storage_max_c, ep.experience_level,
             ep.complexity, ep.pairings, ep.tasting_notes,
             ep.source_name, ep.source_url, ep.consulted_at
      from variant_editorial_profile ep
      join cigar_variant cv on cv.id = ep.variant_id
      join cigar_release cr on cr.id = cv.release_id
      join cigar_line cl on cl.id = cr.line_id
      join brand b on b.id = cl.brand_id order by 1, 2, 3, 4) e)
)" > anilha-dump.json
```

Confira o que veio antes de seguir:

```bash
node -e "const d=require('./anilha-dump.json'); console.log(Object.fromEntries(Object.entries(d).map(([k,v])=>[k,v.length])))"
```
Expected: `{ brands: 11, lines: 28, releases: 28, variants: 46, provenance: 175, editorial: 46 }`. Número diferente significa que o banco não está no estado esperado — pare e investigue em vez de extrair.

- [ ] **Step 2: Add the dump to .gitignore**

Acrescente ao `.gitignore`:

```
anilha-dump.json
```

O dump é insumo de uma execução única, não conteúdo do repositório. Ele vai anexado ao PR como evidência do que foi lido.

- [ ] **Step 3: Write the extractor**

Crie `scripts/extract-from-anilha.mjs`:

```js
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
const fontes = new Map();
for (const linha of [...dump.brands.map((b) => ({ nome: b.story_source_name, url: b.story_source_url, data: b.story_consulted_at })), ...dump.provenance.map((p) => ({ nome: p.source_name, url: p.source_url, data: p.consulted_at })), ...dump.editorial.map((e) => ({ nome: e.source_name, url: e.source_url, data: e.consulted_at }))]) {
  if (!linha.nome || fontes.has(sourceId(linha.nome))) continue;
  fontes.set(sourceId(linha.nome), linha);
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
```

- [ ] **Step 4: Run the extraction**

Run: `node scripts/extract-from-anilha.mjs`
Expected: a última linha imprime `fontes 13 · marcas 11 · linhas 28 · charutos 28 · dossies 46`, e nenhum erro de schema. Se o script sair com código 1, leia a mensagem: ela nomeia o documento e o campo que não passou.

Confira as contagens em disco — trava 2 do spec:

```bash
for d in knowledge/brands knowledge/lines knowledge/cigars knowledge/editorial sources/manufacturers; do
  echo "$d: $(ls "$d"/*.md 2>/dev/null | wc -l | tr -d ' ')"
done
```
Expected: `11`, `28`, `28`, `46`, `13` mais 1 pré-existente (o `example-manufacturer-source.md`), ou seja 14 em `sources/manufacturers`.

- [ ] **Step 5: Check that nothing was invented**

Trava 1 do spec, e a mais importante das quatro: é a única que testa
*"unknown is valid"* mecanicamente. Para cada variante, o número de campos de
blend preenchidos no Markdown tem que bater com o número de colunas não nulas
no dump. Um extrator que preenchesse um papel ausente com valor plausível
passaria nas outras três travas e seria pego só aqui.

```bash
node -e "
const {readdirSync,readFileSync}=require('fs');const YAML=require('yaml');
const fm=p=>YAML.parse(readFileSync(p,'utf8').match(/^---\n([\s\S]*?)\n---/)[1]);
const dump=JSON.parse(readFileSync('anilha-dump.json','utf8'));
const docs=readdirSync('knowledge/cigars').map(f=>fm('knowledge/cigars/'+f));
let noBanco=0, naBase=0;
for(const v of dump.variants) for(const papel of ['wrapper','binder','filler']) if(v[papel]!==null) noBanco++;
for(const d of docs){
  const papeis=b=>b?['wrapper','binder','filler'].filter(p=>b[p]!==null&&b[p]!==undefined).length:0;
  for(const v of d.variants) naBase += papeis(v.blendOverride?.blend) || papeis(d.blend);
}
console.log('papeis de blend no banco:',noBanco,'| na base:',naBase, noBanco===naBase?'OK':'DIVERGIU');
const status=new Set(docs.map(d=>d.release.productionStatus));
console.log('productionStatus distintos:',[...status].join(',') , status.size===1&&status.has('unknown')?'OK':'DIVERGIU');
"
```
Expected: `papeis de blend no banco: 86 | na base: 86 OK` e
`productionStatus distintos: unknown OK`. O total de 86 foi medido no banco em
2026-09-07 e se decompõe assim: 25 variantes com os três papéis (75), mais 11
variantes parciais com exatamente um papel cada (11), mais 10 sem nenhum. Se a
sua contagem der outro número, confira o dump antes de suspeitar do mapeador.

- [ ] **Step 6: Check referential integrity by hand**

Trava 3 do spec. Todo `sourceId` de evidência precisa resolver, e todo `variantId` de dossiê precisa apontar para uma variante que existe:

```bash
node -e "
const {readdirSync,readFileSync}=require('fs');const YAML=require('yaml');
const fm=p=>YAML.parse(readFileSync(p,'utf8').match(/^---\n([\s\S]*?)\n---/)[1]);
const fontes=new Set(readdirSync('sources/manufacturers').map(f=>fm('sources/manufacturers/'+f).id));
const variantes=new Set(readdirSync('knowledge/cigars').flatMap(f=>fm('knowledge/cigars/'+f).variants.map(v=>v.id)));
let erros=0;
for(const f of readdirSync('knowledge/editorial')){const d=fm('knowledge/editorial/'+f);
  if(!variantes.has(d.variantId)){console.log('variante inexistente:',d.variantId);erros++}
  for(const e of d.evidence) if(!fontes.has(e.sourceId)){console.log('fonte inexistente:',e.sourceId);erros++}}
console.log(erros?'FALHOU: '+erros:'integridade referencial ok, '+variantes.size+' variantes');
"
```
Expected: `integridade referencial ok, 46 variantes`.

- [ ] **Step 7: Run the whole suite**

Run: `npm test`
Expected: verde. Os testes de schema que já existiam continuam passando e nada nos documentos gerados os quebra.

- [ ] **Step 8: Commit**

```bash
git add .gitignore scripts/extract-from-anilha.mjs knowledge/brands knowledge/lines knowledge/cigars knowledge/editorial sources/manufacturers
git commit -m "feat: trazer o catalogo do anilha para a base

126 documentos extraidos das migrations 014-019: 11 marcas, 28 linhas, 28
charutos com 46 variantes, 46 dossies e 13 fontes. Nenhum campo inventado -
productionStatus entra como unknown nas 28 edicoes porque o Anilha nao tem o
dado, e papel de blend desconhecido entra como null nas 11 variantes parciais.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Fechar a fatia

**Files:**
- Modify: `test/repository-structure.test.mjs`
- Modify: `README.md`
- Delete: `scripts/extract-from-anilha.mjs`

**Interfaces:**
- Consumes: os documentos gerados na Task 6.
- Produces: nada que outra task use. Esta é a última.

**Três casos que esta task NÃO decide, e que devem ser apresentados ao dono como perguntas:**

1. **As 23 histórias de linha entram sem evidência.** O schema permite, e a alternativa seria inventar procedência. Pesquisar fonte para elas é trabalho editorial de outra fatia.
2. **`test/fixtures/cigar/dona-flor-puro-mata-fina.md` colide com o `dona-flor-mata-fina` gerado.** A fixture tem Mata Fina nos três papéis; o real tem `filler = 'Mata Norte e Mata Fina'`. Não apague nenhum dos dois: relate a colisão.
3. **A única edição com blend divergente** virou o único `blendOverride`. Vale leitura humana para confirmar que a divergência é real e não um erro de curadoria no Anilha.

- [ ] **Step 1: Write the failing test**

Em `test/repository-structure.test.mjs`, acrescente as pastas novas ao array `required` e um caso que trava as contagens:

```js
const required = [
  'CLAUDE.md', 'docs/contribution-guide.md', 'knowledge/concepts',
  'knowledge/terroirs', 'knowledge/brands', 'knowledge/sensory',
  'knowledge/lines', 'knowledge/cigars', 'knowledge/editorial',
  'personal/cellar', 'personal/learning-notes', 'personal/comparisons',
  'sources/books', 'sources/specialized-media',
];

test('todo dossie aponta para uma variante que existe', async () => {
  const { readdir, readFile } = await import('node:fs/promises');
  const YAML = (await import('yaml')).default;
  const fm = async (p) => YAML.parse((await readFile(p, 'utf8')).match(/^---\n([\s\S]*?)\n---/)[1]);

  const cigars = await readdir('knowledge/cigars');
  const variantes = new Set(
    (await Promise.all(cigars.map((f) => fm(`knowledge/cigars/${f}`)))).flatMap((d) =>
      d.variants.map((v) => v.id),
    ),
  );

  const dossies = await readdir('knowledge/editorial');
  for (const arquivo of dossies) {
    const doc = await fm(`knowledge/editorial/${arquivo}`);
    assert.ok(variantes.has(doc.variantId), `${arquivo}: variante ${doc.variantId} nao existe`);
  }
  assert.equal(variantes.size, 46);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/repository-structure.test.mjs`
Expected: se você rodar isto **antes** da Task 6, falha por pasta inexistente. Rodando depois, o caso novo já passa — o que é esperado, porque ele trava um invariante em vez de dirigir código novo. Confirme que ele falha de verdade quebrando um `variantId` à mão num dossiê, rodando, e desfazendo.

- [ ] **Step 3: Update the README**

Em `README.md`, na seção "Repository map", acrescente as três pastas novas depois da linha de `knowledge/`:

```markdown
- `knowledge/cigars/` — catálogo: marca, linha, edição, variantes e blend, com
  evidência por campo.
- `knowledge/lines/` — identidade e história de cada linha.
- `knowledge/editorial/` — dossiê editorial por variante, com fonte obrigatória.
```

- [ ] **Step 4: Delete the extractor**

```bash
git rm scripts/extract-from-anilha.mjs
```

Depois da fusão o Anilha deixa de ser origem. Manter o extrator convidaria a rodá-lo de novo, o que copiaria de volta o que a base acabou de mandar — e reabriria as duas origens que esta fatia existe para fechar. `scripts/lib/anilha-map.mjs` **fica**: ele é testado e serve de referência para o gerador do Projeto 2.

- [ ] **Step 5: Run everything**

Run: `npm test`
Expected: verde, com os casos novos de estrutura incluídos.

- [ ] **Step 6: Commit**

```bash
git add test/repository-structure.test.mjs README.md
git commit -m "chore: fechar a fusao e remover o extrator de uso unico

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Fora do escopo desta fatia

- **O gerador KB → Anilha** (Projeto 2): lê a base, escreve uma migration, achatando o blend estruturado nas colunas de texto do Anilha. `scripts/lib/anilha-map.mjs` fica no repositório como referência do mapeamento inverso.
- **Decompor os `rawLabel`** em identidade, origem, cultivo, processamento e priming. A fusão preserva a string do fabricante; separá-la é curadoria charuto por charuto.
- **Pesquisar fonte para as 23 histórias de linha.**
- **As duas fumadas pessoais** que já estão na base. Ficam onde estão até o Projeto 2 decidir o dono dos registros pessoais.
- **`AGENTS.md`.** As dez regras estão só em `CLAUDE.md`, o que as prende a uma ferramenta. Útil e independente desta fatia.
