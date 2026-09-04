# Validation Cases and Seed Knowledge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the V1 model against the seven approved real-world cases, then add the current collection as source-backed seed knowledge without inventing unavailable facts.

**Architecture:** Treat research as provenance capture, not as direct fact entry: create Source documents first, attach Evidence records to each technical claim, and only then create Tobacco/Cigar documents. Process the collection in small reviewable batches; preserve nulls and contradictions and keep uncertain labels in `rawLabel`.

**Tech Stack:** Markdown, YAML, repository JSON Schemas, Node.js 22 validation harness, authoritative web sources recorded with access dates

**Spec:** `docs/superpowers/specs/2026-09-03-cigar-knowledge-design.md`

## Global Constraints

- Complete all schema plans before this plan.
- Prefer manufacturer, official distributor, government/regulatory, book, and academic sources over retailer/community sources.
- Every technical claim has Evidence; Source itself has no global confidence.
- Preserve raw labels and disagreements; unknown/null is valid.
- Do not treat names listed in the design as technical truth.
- Do not infer ring gauge, dimensions, variety, genetics, processing, or sensory causality.
- Declared sensory profiles remain manufacturer claims; personal observations remain personal.
- Each task validates every touched structured document before commit.

---

### Task 1: Research ledger and provenance gate

**Files:**
- Create: `docs/research-protocol.md`
- Create: `scripts/audit-evidence.mjs`
- Create: `test/audit-evidence.test.mjs`
- Create: `test/helpers/assert-valid-cigar-with-evidence.mjs`
- Create: `test/fixtures/audit/supported-claim.yaml`
- Create: `test/fixtures/audit/orphaned-evidence.yaml`
- Modify: `docs/contribution-guide.md`

**Interfaces:**
- Consumes: arrays of source IDs, evidence records, and field paths from schema-valid documents.
- Produces: `auditEvidence({ sources, evidence }): string[]`, returning deterministic errors for missing referenced sources and duplicate evidence records; and `assertValidCigarWithEvidence(path): Promise<void>` for seed batch tests.

- [ ] **Step 1: Write provenance audit tests**

```js
test('accepts evidence that references a captured source', () => {
  assert.deepEqual(auditEvidence({
    sources: [{ id: 'maker-product-page' }],
    evidence: [{ sourceId: 'maker-product-page', field: '/blend/wrapper/0/rawLabel' }],
  }), []);
});

test('reports an orphaned source reference', () => {
  assert.deepEqual(auditEvidence({
    sources: [],
    evidence: [{ sourceId: 'missing-page', field: '/blend/wrapper/0/rawLabel' }],
  }), ['Missing source document: missing-page']);
});
```

- [ ] **Step 2: Run audit tests and verify failure**

Run: `node --test test/audit-evidence.test.mjs`

Expected: FAIL because the audit module is absent.

- [ ] **Step 3: Implement the evidence audit**

```js
export function auditEvidence({ sources, evidence }) {
  const sourceIds = new Set(sources.map(({ id }) => id));
  const errors = [];
  const seen = new Set();
  for (const item of evidence) {
    if (!sourceIds.has(item.sourceId)) errors.push(`Missing source document: ${item.sourceId}`);
    const key = `${item.sourceId}\0${item.field}\0${item.relation ?? ''}`;
    if (seen.has(key)) errors.push(`Duplicate evidence record: ${item.sourceId} ${item.field}`);
    seen.add(key);
  }
  return [...new Set(errors)].sort();
}
```

- [ ] **Step 4: Document the research protocol**

For each product: search the manufacturer first; capture the exact page title,
publisher, URL, publication date when available, and access date in a Source
document; transcribe raw labels; attach field-level evidence; record a null when
the source is silent; and add contradictory evidence rather than resolving it
silently. Require a manual review of every retailer/community-only fact.

Create `test/helpers/assert-valid-cigar-with-evidence.mjs` to load and compile
the cigar schema with its referenced schemas, recursively read Source Markdown
under `sources/`, validate the requested cigar, run `auditEvidence`, and use
strict assertions for both results. Export exactly
`assertValidCigarWithEvidence(path)` so every batch test uses one provenance
gate.

- [ ] **Step 5: Run tests and check documentation**

Run: `npm test && git diff --check`

Expected: all tests PASS and no whitespace errors.

- [ ] **Step 6: Commit the provenance gate**

```bash
git add docs/research-protocol.md docs/contribution-guide.md scripts/audit-evidence.mjs test/audit-evidence.test.mjs test/helpers/assert-valid-cigar-with-evidence.mjs test/fixtures/audit
git commit -m "feat: add seed knowledge provenance audit"
```

### Task 2: Tobacco and catalog architecture validation cases

**Files:**
- Create: `test/fixtures/validation-cases/dona-flor-puro-mata-fina.md`
- Create: `test/fixtures/validation-cases/brick-house-double-connecticut.md`
- Create: `test/fixtures/validation-cases/sobremesa-brulee.md`
- Create: `test/fixtures/validation-cases/avo-syncro-nicaragua.md`
- Create: `test/fixtures/validation-cases/arturo-fuente-magnum-r44.md`
- Create: `test/fixtures/validation-cases/montecristo-80-aniversario.md`
- Create: `test/fixtures/validation-cases/dannemann-terroir-brasil.md`
- Create: `test/schema/real-world-validation-cases.test.mjs`

**Interfaces:**
- Consumes: completed Tobacco, Cigar, Source, and Evidence schemas.
- Produces: seven schema-valid fixtures demonstrating the design's required representational capabilities.

- [ ] **Step 1: Write one named test per approved case**

```js
const cases = [
  'dona-flor-puro-mata-fina', 'brick-house-double-connecticut',
  'sobremesa-brulee', 'avo-syncro-nicaragua',
  'arturo-fuente-magnum-r44', 'montecristo-80-aniversario',
  'dannemann-terroir-brasil',
];

for (const name of cases) {
  test(`${name} fits the V1 cigar model`, async () => {
    const value = await readFrontmatter(`test/fixtures/validation-cases/${name}.md`);
    assert.equal(validateCigar(value), true, ajv.errorsText(validateCigar.errors));
  });
}
```

Add focused assertions for same tobacco/different roles, distinct Connecticut
identities, multinational origin entries, split Habano/Rosado/Sun Grown fields,
release metadata with nulls, and simultaneous supports/contradicts evidence.

- [ ] **Step 2: Run the case suite and verify failure**

Run: `node --test test/schema/real-world-validation-cases.test.mjs`

Expected: FAIL because the seven fixtures do not exist.

- [ ] **Step 3: Research and capture sources before facts**

For each case, create Source documents under the correct `sources/` category,
using the exact page metadata found. If no authoritative source supports a field,
leave it null in the fixture. Do not reuse the design's explanatory details as a
source.

- [ ] **Step 4: Build the seven fixtures from captured evidence**

Preserve exact raw labels and field-level evidence. For Dannemann Terroir Brasil,
include both sides of every located contradiction and set the affected claim
status to `disputed`. Keep the fixtures under `test/` until their accuracy review
is complete; they are model tests, not yet canonical catalog records.

- [ ] **Step 5: Validate cases and provenance**

Run: `node --test test/schema/real-world-validation-cases.test.mjs && npm test`

Expected: all seven named cases and all regression tests PASS; the provenance
audit reports no missing source IDs.

- [ ] **Step 6: Commit validation cases and their sources**

```bash
git add test/fixtures/validation-cases test/schema/real-world-validation-cases.test.mjs sources
git commit -m "test: validate schemas against representative cigars"
```

### Task 3: Seed batch 1 — Joya, Brick House, and Sobremesa

**Files:**
- Create: `knowledge/cigars/joya-de-nicaragua-clasico-original-robusto.md`
- Create: `knowledge/cigars/joya-de-nicaragua-clasico-medio-siglo-toro.md`
- Create: `knowledge/cigars/brick-house-double-connecticut-toro.md`
- Create: `knowledge/cigars/sobremesa-brulee-robusto.md`
- Create: `test/seed/batch-1.test.mjs`
- Create: matching Source documents under `sources/manufacturers/` and, only when needed, `sources/specialized-media/`

**Interfaces:**
- Consumes: all schemas, research protocol, and provenance audit.
- Produces: four canonical catalog records backed by captured sources.

- [ ] **Step 1: Write the batch manifest test**

```js
const paths = [
  'knowledge/cigars/joya-de-nicaragua-clasico-original-robusto.md',
  'knowledge/cigars/joya-de-nicaragua-clasico-medio-siglo-toro.md',
  'knowledge/cigars/brick-house-double-connecticut-toro.md',
  'knowledge/cigars/sobremesa-brulee-robusto.md',
];
for (const path of paths) test(`${path} validates and has no orphaned evidence`, async () => {
  await assertValidCigarWithEvidence(path);
});
```

- [ ] **Step 2: Run the batch test and verify failure**

Run: `node --test test/seed/batch-1.test.mjs`

Expected: FAIL on the first missing catalog file.

- [ ] **Step 3: Research and create source documents**

Follow the source priority and capture exact raw blend/vitola/release labels for
all four products. Use one Source document per publication, not one per fact.

- [ ] **Step 4: Create the four catalog records**

Populate only supported fields, attach field-level evidence, distinguish
Connecticut Shade from Connecticut Broadleaf, and leave all unavailable values
null. Do not copy declared flavor notes into personal observations.

- [ ] **Step 5: Validate the batch**

Run: `node --test test/seed/batch-1.test.mjs && npm test`

Expected: all batch and regression tests PASS.

- [ ] **Step 6: Commit batch 1**

```bash
git add knowledge/cigars sources test/seed/batch-1.test.mjs
git commit -m "data: seed Joya Brick House and Sobremesa cigars"
```

### Task 4: Seed batch 2 — Brazilian cigars

**Files:**
- Create: `knowledge/cigars/dannemann-mata-fina-robusto.md`
- Create: `knowledge/cigars/dona-flor-robusto-puro-mata-fina.md`
- Create: `knowledge/cigars/dona-flor-selecao-robusto.md`
- Create: `knowledge/cigars/dannemann-robusto-santo-antonio.md`
- Create: `knowledge/cigars/dannemann-terroir-brasil-santo-antonio-montesco.md`
- Create: `test/seed/batch-2.test.mjs`
- Create: matching Source documents

**Interfaces:**
- Consumes: schemas, validated case fixtures, research protocol, and provenance audit.
- Produces: five canonical Brazilian catalog records with explicit disagreement where applicable.

- [ ] **Step 1: Write the batch manifest test**

```js
const paths = [
  'knowledge/cigars/dannemann-mata-fina-robusto.md',
  'knowledge/cigars/dona-flor-robusto-puro-mata-fina.md',
  'knowledge/cigars/dona-flor-selecao-robusto.md',
  'knowledge/cigars/dannemann-robusto-santo-antonio.md',
  'knowledge/cigars/dannemann-terroir-brasil-santo-antonio-montesco.md',
];
for (const path of paths) test(`${path} validates and has no orphaned evidence`, async () => {
  await assertValidCigarWithEvidence(path);
});

test('Terroir Brasil preserves disagreement', async () => {
  const value = await readFrontmatter(paths[4]);
  assert.ok(value.evidence.some(({ relation }) => relation === 'supports'));
  assert.ok(value.evidence.some(({ relation }) => relation === 'contradicts'));
});
```

- [ ] **Step 2: Run the batch test and verify failure**

Run: `node --test test/seed/batch-2.test.mjs`

Expected: FAIL on the first missing catalog file.

- [ ] **Step 3: Research and create source documents**

Capture manufacturer and official-distributor pages first. For conflicting
Terroir Brasil claims, capture both publications independently and do not merge
their wording.

- [ ] **Step 4: Create the five catalog records**

Represent Mata Fina role per component, preserve every raw label, attach evidence
to technical claims, and use `disputed` where sources conflict. Leave unsupported
genetics, processing, and dimensions null.

- [ ] **Step 5: Validate the batch**

Run: `node --test test/seed/batch-2.test.mjs && npm test`

Expected: all batch and regression tests PASS.

- [ ] **Step 6: Commit batch 2**

```bash
git add knowledge/cigars sources test/seed/batch-2.test.mjs
git commit -m "data: seed source-backed Brazilian cigars"
```

### Task 5: Seed batch 3 — remaining international collection

**Files:**
- Create: `knowledge/cigars/romeo-y-julieta-romeo-no-3-tubos.md`
- Create: `knowledge/cigars/arturo-fuente-rosado-sun-grown-magnum-r44.md`
- Create: `knowledge/cigars/avo-syncro-nicaragua-robusto.md`
- Create: `knowledge/cigars/cao-consigliere-associate-robusto.md`
- Create: `knowledge/cigars/montecristo-80-aniversario.md`
- Create: `knowledge/cigars/oliva-serie-v-melanio-maduro-robusto.md`
- Create: `test/seed/batch-3.test.mjs`
- Create: matching Source documents

**Interfaces:**
- Consumes: schemas, validated case fixtures, research protocol, and provenance audit.
- Produces: six canonical catalog records, completing the 15-item seed collection.

- [ ] **Step 1: Write the batch manifest test**

```js
const paths = [
  'knowledge/cigars/romeo-y-julieta-romeo-no-3-tubos.md',
  'knowledge/cigars/arturo-fuente-rosado-sun-grown-magnum-r44.md',
  'knowledge/cigars/avo-syncro-nicaragua-robusto.md',
  'knowledge/cigars/cao-consigliere-associate-robusto.md',
  'knowledge/cigars/montecristo-80-aniversario.md',
  'knowledge/cigars/oliva-serie-v-melanio-maduro-robusto.md',
];
for (const path of paths) test(`${path} validates and has no orphaned evidence`, async () => {
  await assertValidCigarWithEvidence(path);
});

test('representative international records keep domain fields separate', async () => {
  const avo = await readFrontmatter(paths[2]);
  assert.ok(new Set(avo.blend.filler.map(({ origin }) => origin?.countryCode).filter(Boolean)).size > 1);
  const fuente = await readFrontmatter(paths[1]);
  assert.ok(fuente.blend.wrapper[0].rawLabel);
  assert.notEqual(fuente.blend.wrapper[0].origin, fuente.blend.wrapper[0].descriptor);
  const montecristo = await readFrontmatter(paths[4]);
  assert.equal(montecristo.release.commemorative, true);
  assert.equal(validateCigar(montecristo), true, ajv.errorsText(validateCigar.errors));
});
```

- [ ] **Step 2: Run the batch test and verify failure**

Run: `node --test test/seed/batch-3.test.mjs`

Expected: FAIL on the first missing catalog file.

- [ ] **Step 3: Research and create source documents**

Capture authoritative pages for each product and prefer original manufacturer
terminology. Where regional product names or vitola labels differ, retain each
source's raw wording and scope the evidence to the matching field.

- [ ] **Step 4: Create the six catalog records**

Populate only evidence-backed values. Separate release, availability, vitola,
tobacco identity, origin, cultivation, processing, descriptor, and role. Keep
declared profiles separate and omit personal observations.

- [ ] **Step 5: Validate the batch and full collection**

Run: `node --test test/seed/batch-3.test.mjs && npm test && node scripts/validate.mjs schema/cigar.schema.yaml knowledge/cigars/*.md && git diff --check`

Expected: all 15 seed records validate, every Evidence source ID resolves, all
tests PASS, and no whitespace errors exist.

- [ ] **Step 6: Commit batch 3**

```bash
git add knowledge/cigars sources test/seed/batch-3.test.mjs
git commit -m "data: complete the initial cigar collection"
```
