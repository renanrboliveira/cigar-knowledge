# Tobacco Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement reusable tobacco identities and blend-specific TobaccoComponent definitions without conflating identity, origin, genetics, cultivation, processing, descriptor, priming, or role.

**Architecture:** Keep reusable identities in standalone tobacco Markdown documents. Define TobaccoComponent inside the tobacco schema as a reusable `$def` for later import by the cigar schema; component-level fields capture what a source says about one use of a leaf, including the untouched `rawLabel` and evidence references.

**Tech Stack:** YAML, JSON Schema Draft 2020-12, Node.js 22, Ajv 8, Node built-in test runner

**Spec:** `docs/superpowers/specs/2026-09-03-cigar-knowledge-design.md`

## Global Constraints

- Complete `2026-09-04-foundation-and-evidence.md` first.
- Every structured document has `schemaVersion: 1` and every editorial ID is a readable slug.
- Preserve `rawLabel`; unknown or null is preferable to invented information.
- Role is component-specific and never belongs to a reusable Tobacco identity.
- Identity, origin, genetics, cultivation, processing, descriptor, priming, crop, and role remain separate fields.
- Ligero is priming, not tobacco identity.
- Connecticut Shade and Connecticut Broadleaf are distinct identities.
- Evidence references use the Source → Evidence → Claim model.

---

### Task 1: Tobacco identity schema

**Files:**
- Create: `schema/tobacco.schema.yaml`
- Create: `test/schema/tobacco-identity.test.mjs`
- Create: `test/fixtures/tobacco/valid-identity.md`
- Create: `test/fixtures/tobacco/invalid-role-on-identity.md`

**Interfaces:**
- Consumes: common slug/schemaVersion definitions and evidence reference shape from the foundation plan.
- Produces: the root `Tobacco` contract and `$defs.origin`, `$defs.genetics`, `$defs.evidenceRef`, and `$defs.tobaccoComponent`.

- [ ] **Step 1: Write identity separation tests**

```js
test('accepts an identity without blend role', async () => {
  const value = await readFrontmatter('test/fixtures/tobacco/valid-identity.md');
  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
});

test('rejects wrapper on a reusable identity', async () => {
  const value = await readFrontmatter('test/fixtures/tobacco/invalid-role-on-identity.md');
  assert.equal(validate(value), false);
});
```

Compile `schema/tobacco.schema.yaml` with the common schema registered in Ajv.

- [ ] **Step 2: Run the identity test and verify failure**

Run: `node --test test/schema/tobacco-identity.test.mjs`

Expected: FAIL because the schema and example do not exist.

- [ ] **Step 3: Implement the Tobacco root schema**

Require `schemaVersion`, `id`, and `identity`. Allow nullable `origin` and
`genetics`, plus `aliases` and `sources` arrays. Set
`additionalProperties: false`, so fields such as `role`, `wrapper`, `binder`,
and `filler` are rejected at the identity level. Define origin as an object with
nullable `countryCode`, `region`, `subregion`, and `farm`; define genetics as an
object with nullable `cultivar` and `lineage`.

- [ ] **Step 4: Add valid and invalid identity fixtures**

Create a valid frontmatter document with `schemaVersion: 1`, `id: mata-fina`,
and `identity: Mata Fina`. Copy those fields into the invalid fixture and add
`role: wrapper`; the invalid test must fail only because `role` is not allowed.

- [ ] **Step 5: Run the focused tests**

Run: `npm test -- test/schema/tobacco-identity.test.mjs`

Expected: PASS; the valid identity is accepted and the identity carrying a role
is rejected.

### Task 2: TobaccoComponent contract and semantic boundary tests

**Files:**
- Modify: `schema/tobacco.schema.yaml`
- Create: `test/schema/tobacco-component.test.mjs`
- Create: `test/fixtures/tobacco/components.yaml`

**Interfaces:**
- Consumes: `$defs.origin`, `$defs.genetics`, and `$defs.evidenceRef` from Task 1.
- Produces: `$defs.tobaccoComponent` with `tobaccoId`, `rawLabel`, `role`, `origin`, `genetics`, `cultivation`, `processing`, `descriptor`, `priming`, `crop`, and `evidence`.

- [ ] **Step 1: Write component semantics tests**

```js
test('allows Mata Fina in every blend role', () => {
  for (const component of fixtures.mataFinaByRole) {
    assert.equal(validateComponent(component), true, ajv.errorsText(validateComponent.errors));
  }
});

test('keeps Ligero in priming', () => {
  assert.equal(validateComponent(fixtures.ligeroAsPriming), true);
  assert.equal(validateComponent(fixtures.ligeroAsIdentity), false);
});

test('preserves and decomposes Ecuadorian Connecticut Shade', () => {
  const component = fixtures.ecuadorianConnecticutShade;
  assert.equal(validateComponent(component), true);
  assert.equal(component.rawLabel, 'Ecuadorian Connecticut Shade');
  assert.equal(component.tobaccoId, 'connecticut-shade');
  assert.equal(component.origin.countryCode, 'EC');
  assert.equal(component.cultivation.method, 'shade');
});
```

Load `components.yaml` with YAML and compile the `$defs.tobaccoComponent`
subschema through a `$ref` wrapper.

- [ ] **Step 2: Run component tests and verify failure**

Run: `node --test test/schema/tobacco-component.test.mjs`

Expected: FAIL because `$defs.tobaccoComponent` and the fixtures do not exist.

- [ ] **Step 3: Implement the component definition**

Require `rawLabel` and `role`; allow nullable `tobaccoId` so a source that says
only “Nicaraguan” can be represented without inventing an identity. Restrict
role to `wrapper`, `binder`, or `filler`. Model cultivation as an object with
nullable `method`; processing as a list of terms; descriptor and priming as
separate nullable strings; crop as nullable string; evidence as a nonempty list
of evidence references when present. Set `additionalProperties: false` on the
component and nested objects.

- [ ] **Step 4: Add boundary fixtures**

Include Mata Fina wrapper/binder/filler components; Ligero as `priming`; an
invalid component with `tobaccoId: ligero`; Ecuadorian Connecticut Shade split
across raw label, identity, origin, and cultivation; Mexican San Andrés Maduro
split across identity, origin, and processing; and a Nicaraguan-only component
with null `tobaccoId` and only the known country.

- [ ] **Step 5: Run component tests**

Run: `npm test -- test/schema/tobacco-component.test.mjs`

Expected: all component boundary tests PASS.

- [ ] **Step 6: Commit the schema boundary**

```bash
git add schema/tobacco.schema.yaml test/schema/tobacco-identity.test.mjs test/schema/tobacco-component.test.mjs test/fixtures/tobacco
git commit -m "feat: separate tobacco identities from blend components"
```

### Task 3: Tobacco example and taxonomy documentation

**Files:**
- Create: `examples/tobacco.example.md`
- Create: `knowledge/tobaccos/connecticut-shade.md`
- Create: `knowledge/tobaccos/connecticut-broadleaf.md`
- Create: `docs/taxonomy.md`
- Create: `test/schema/tobacco-examples.test.mjs`

**Interfaces:**
- Consumes: the Tobacco schema from Tasks 1–2.
- Produces: validated example identities and the canonical field-separation glossary.

- [ ] **Step 1: Write document validation tests**

```js
for (const path of [
  'examples/tobacco.example.md',
  'knowledge/tobaccos/connecticut-shade.md',
  'knowledge/tobaccos/connecticut-broadleaf.md',
]) {
  test(`${path} validates as Tobacco`, async () => {
    assert.equal(validate(await readFrontmatter(path)), true, ajv.errorsText(validate.errors));
  });
}
```

- [ ] **Step 2: Run the document tests and verify failure**

Run: `node --test test/schema/tobacco-examples.test.mjs`

Expected: FAIL because the Markdown documents do not exist.

- [ ] **Step 3: Add conservative identity documents**

Create the generic example with synthetic values. Create separate Connecticut
Shade and Connecticut Broadleaf identity documents with only their names,
aliases when known from the spec, and source references; leave unsupported
origin/genetics values null. Do not add blend roles.

- [ ] **Step 4: Document the taxonomy**

Define each of identity, origin/terroir, genetics/cultivar, cultivation,
processing, descriptor/color, priming, crop, and role. Include the approved
Ecuadorian Connecticut Shade, Mexican San Andrés Maduro, Ligero, and
Nicaraguan-only examples as decomposition tables.

- [ ] **Step 5: Run all tests and schema validation**

Run: `npm test && node scripts/validate.mjs schema/tobacco.schema.yaml examples/tobacco.example.md knowledge/tobaccos/*.md`

Expected: all tests and document validations PASS.

- [ ] **Step 6: Commit tobacco examples and taxonomy**

```bash
git add examples/tobacco.example.md knowledge/tobaccos docs/taxonomy.md test/schema/tobacco-examples.test.mjs
git commit -m "docs: add tobacco taxonomy and validated examples"
```
