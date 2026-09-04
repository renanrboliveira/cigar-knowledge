# Cigar Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Brand → CigarLine → Cigar → CigarVariant → Vitola catalog hierarchy with evidence-aware blends, releases, declared profiles, and variant-specific overrides.

**Architecture:** Store a commercial cigar and its variants in one Markdown document for V1 while preserving explicit IDs and hierarchy fields. Import TobaccoComponent from the tobacco schema; keep Blend, Release, DeclaredProfile, and Vitola as internal definitions in `cigar.schema.yaml` so the domain boundary remains cohesive.

**Tech Stack:** YAML, JSON Schema Draft 2020-12, Node.js 22, Ajv 8, Node built-in test runner

**Spec:** `docs/superpowers/specs/2026-09-03-cigar-knowledge-design.md`

## Global Constraints

- Complete the foundation/evidence and tobacco model plans first.
- Every structured document has `schemaVersion: 1`; editorial IDs are readable slugs.
- `Cigar` is the commercial product/blend; `CigarVariant` is the smoked presentation.
- Blend, Release, and DeclaredProfile belong primarily to Cigar.
- A variant blend override is allowed only with evidence.
- Vitola separates commercial name, optional factory vitola, shape, lengthMm, and ringGauge.
- Never infer dimensions or ring gauge from a commercial name.
- Production status and availability are separate.
- DeclaredProfile is separate from personal perception.

---

### Task 1: Catalog hierarchy and vitola contracts

**Files:**
- Create: `schema/cigar.schema.yaml`
- Create: `test/schema/cigar-hierarchy.test.mjs`
- Create: `test/fixtures/cigar/minimal-valid.md`
- Create: `test/fixtures/cigar/invalid-missing-variant.md`

**Interfaces:**
- Consumes: common schema definitions and the tobacco component `$ref`.
- Produces: root Cigar contract plus `$defs.cigarVariant` and `$defs.vitola`.

- [ ] **Step 1: Write hierarchy tests**

```js
test('requires a smokeable variant with an explicit vitola', async () => {
  assert.equal(validate(await readFrontmatter('test/fixtures/cigar/minimal-valid.md')), true);
  assert.equal(validate(await readFrontmatter('test/fixtures/cigar/invalid-missing-variant.md')), false);
});

test('does not derive dimensions from the commercial name', async () => {
  const value = await readFrontmatter('test/fixtures/cigar/minimal-valid.md');
  assert.equal(value.variants[0].vitola.commercialName, 'Robusto');
  assert.equal(value.variants[0].vitola.lengthMm, null);
  assert.equal(value.variants[0].vitola.ringGauge, null);
  assert.equal(validate(value), true);
});
```

- [ ] **Step 2: Run hierarchy tests and verify failure**

Run: `node --test test/schema/cigar-hierarchy.test.mjs`

Expected: FAIL because the cigar schema is absent.

- [ ] **Step 3: Implement the hierarchy schema**

Require `schemaVersion`, `id`, `brand`, `line`, `name`, and a nonempty
`variants` array. A variant requires `id`, `name`, and `vitola`; vitola requires
`commercialName`, while `factoryName`, `shape`, `lengthMm`, and `ringGauge` are
nullable. Constrain `lengthMm` to a positive number and `ringGauge` to a positive
integer when present. Set `additionalProperties: false` throughout.

- [ ] **Step 4: Add minimal fixtures**

The valid fixture uses a synthetic cigar and one Robusto variant with unknown
dimensions represented as null. The invalid fixture contains the same cigar
metadata but an empty `variants` array.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- test/schema/cigar-hierarchy.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit hierarchy and vitola contracts**

```bash
git add schema/cigar.schema.yaml test/schema/cigar-hierarchy.test.mjs test/fixtures/cigar
git commit -m "feat: define cigar hierarchy and vitola contracts"
```

### Task 2: Blend and evidence-gated override

**Files:**
- Modify: `schema/cigar.schema.yaml`
- Create: `test/schema/cigar-blend.test.mjs`
- Create: `test/fixtures/cigar/dona-flor-puro-mata-fina.md`
- Create: `test/fixtures/cigar/invalid-override-without-evidence.md`

**Interfaces:**
- Consumes: `tobacco.schema.yaml#/$defs/tobaccoComponent`.
- Produces: `$defs.blend` with wrapper/binder/filler arrays and an evidence-gated variant `blendOverride`.

- [ ] **Step 1: Write blend behavior tests**

```js
test('allows the same Tobacco identity in wrapper, binder, and filler', async () => {
  const value = await readFrontmatter('test/fixtures/cigar/dona-flor-puro-mata-fina.md');
  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
  assert.deepEqual([
    value.blend.wrapper[0].tobaccoId,
    value.blend.binder[0].tobaccoId,
    value.blend.filler[0].tobaccoId,
  ], ['mata-fina', 'mata-fina', 'mata-fina']);
});

test('rejects a variant blend override without evidence', async () => {
  assert.equal(validate(await readFrontmatter('test/fixtures/cigar/invalid-override-without-evidence.md')), false);
});
```

- [ ] **Step 2: Run blend tests and verify failure**

Run: `node --test test/schema/cigar-blend.test.mjs`

Expected: FAIL because Blend is not defined.

- [ ] **Step 3: Implement Blend and override contracts**

Define wrapper, binder, and filler as nonempty arrays of TobaccoComponent when
present; require all three arrays for a declared complete blend, but allow the
entire `blend` field to be null when no composition is known. Define
`blendOverride` on a variant as an object requiring both `blend` and a nonempty
`evidence` array. Reject a naked blend override through `required` and
`additionalProperties: false`.

- [ ] **Step 4: Add behavior fixtures**

Use only the approved design fact for the Dona Flor fixture: three Mata Fina
components with different role values and preserved raw labels. Use synthetic
source/evidence slugs rather than adding unresearched technical details. Add an
invalid synthetic variant override with no evidence list.

- [ ] **Step 5: Run focused and regression tests**

Run: `npm test -- test/schema/cigar-blend.test.mjs && npm test`

Expected: all tests PASS.

- [ ] **Step 6: Commit blend support**

```bash
git add schema/cigar.schema.yaml test/schema/cigar-blend.test.mjs test/fixtures/cigar
git commit -m "feat: add evidence-aware cigar blends"
```

### Task 3: Release, availability, and declared profile

**Files:**
- Modify: `schema/cigar.schema.yaml`
- Create: `test/schema/cigar-release-profile.test.mjs`
- Create: `test/fixtures/cigar/release-profile-valid.md`

**Interfaces:**
- Consumes: the root Cigar contract from Tasks 1–2.
- Produces: `$defs.release`, `$defs.availability`, and `$defs.declaredProfile`.

- [ ] **Step 1: Write separation tests**

```js
test('keeps production status, availability, and declared profile separate', async () => {
  const value = await readFrontmatter('test/fixtures/cigar/release-profile-valid.md');
  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
  assert.equal(value.release.productionStatus, 'discontinued');
  assert.equal(value.availability.status, 'available_secondary_market');
  assert.equal(value.declaredProfile.strength, 4);
  assert.equal('personalRating' in value.declaredProfile, false);
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test test/schema/cigar-release-profile.test.mjs`

Expected: FAIL because the three definitions are absent.

- [ ] **Step 3: Implement the three definitions**

Release supports nullable `releaseYear`, booleans `limitedEdition` and
`commemorative`, nullable `editionName` and `anniversary`, and
`productionStatus` enum `current`, `discontinued`, `seasonal`, `unknown`.
Availability has its own `status` string and optional evidence. DeclaredProfile
supports nullable integer 1–5 values for strength, body, and flavorIntensity,
plus manufacturer notes and evidence; it has no personal observation fields.

- [ ] **Step 4: Add the valid separation fixture**

Create a synthetic commemorative release with a discontinued production status,
secondary-market availability, and declared strength 4. Attach evidence to each
claim and do not include personal perception.

- [ ] **Step 5: Run all tests**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 6: Commit release and profile support**

```bash
git add schema/cigar.schema.yaml test/schema/cigar-release-profile.test.mjs test/fixtures/cigar/release-profile-valid.md
git commit -m "feat: separate cigar release availability and profile"
```

### Task 4: Catalog example and architecture guide

**Files:**
- Create: `examples/cigar.example.md`
- Create: `docs/architecture.md`
- Create: `test/schema/cigar-example.test.mjs`

**Interfaces:**
- Consumes: the completed cigar schema.
- Produces: a validated end-to-end catalog example and contributor guidance for the hierarchy.

- [ ] **Step 1: Write the example validation test**

```js
test('validates the documented cigar example', async () => {
  const value = await readFrontmatter('examples/cigar.example.md');
  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
  assert.ok(value.variants.every(({ id, vitola }) => id && vitola.commercialName));
});
```

- [ ] **Step 2: Run the example test and verify failure**

Run: `node --test test/schema/cigar-example.test.mjs`

Expected: FAIL because `examples/cigar.example.md` does not exist.

- [ ] **Step 3: Create a source-safe complete example**

Use a clearly synthetic brand, line, cigar, source, evidence, blend, release,
declared profile, and two variants. Demonstrate one variant with null dimensions
and another with explicit dimensions. Do not present synthetic values as real
cigar facts.

- [ ] **Step 4: Document catalog architecture**

Explain hierarchy ownership, Cigar versus CigarVariant, why SmokeSession targets
a variant, the evidence gate for blend overrides, vitola field separation, and
the production-status/availability distinction. Link the tobacco taxonomy and
evidence model.

- [ ] **Step 5: Validate the example and run regressions**

Run: `node scripts/validate.mjs schema/cigar.schema.yaml examples/cigar.example.md && npm test && git diff --check`

Expected: validation and tests PASS with no whitespace errors.

- [ ] **Step 6: Commit example and guide**

```bash
git add examples/cigar.example.md docs/architecture.md test/schema/cigar-example.test.mjs
git commit -m "docs: demonstrate the cigar catalog hierarchy"
```
