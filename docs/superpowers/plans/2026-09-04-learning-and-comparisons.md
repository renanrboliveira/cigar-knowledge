# Learning and Comparisons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement curated learning paths and comparison candidates that teach controlled comparisons without overstating scientific certainty or biasing sensory observations.

**Architecture:** Use one discriminated-union schema with distinct `$defs` for LearningPath and ComparisonCandidate, selected by `kind: learning_path` or `kind: comparison_candidate`. Store curated reusable materials under `knowledge/learning/`; store a user's completed comparisons under `personal/comparisons/` without deriving a PreferenceSignal.

**Tech Stack:** YAML, JSON Schema Draft 2020-12, Node.js 22, Ajv 8, Node built-in test runner

**Spec:** `docs/superpowers/specs/2026-09-03-cigar-knowledge-design.md`

## Global Constraints

- Complete the foundation/evidence, catalog, and smoke-session plans first.
- LearningPath is editorial and curated.
- Prompts must avoid suggestion bias: invite attention to a family, never promise a descriptor.
- Comparability means quantity and relevance of controlled variables, not scientific certainty.
- Use only the 14 approved learning goals and low/medium/high comparability.
- Do not implement PreferenceSignal or infer a durable preference from one session.
- No gamification, streaks, badges, rankings, or consumption goals.

---

### Task 1: ComparisonCandidate schema

**Files:**
- Create: `schema/learning-path.schema.yaml`
- Create: `test/schema/comparison-candidate.test.mjs`
- Create: `test/fixtures/learning/comparison-valid.md`
- Create: `test/fixtures/learning/comparison-invalid-goal.md`

**Interfaces:**
- Consumes: readable CigarVariant IDs.
- Produces: a `kind: comparison_candidate` document branch and `$defs.comparisonCandidate` with cigarVariantA, cigarVariantB, similarities, differences, learningGoals, and comparability.

- [ ] **Step 1: Write comparison contract tests**

```js
test('accepts an approved controlled-comparison goal', async () => {
  const value = await readFrontmatter('test/fixtures/learning/comparison-valid.md');
  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
  assert.equal(value.kind, 'comparison_candidate');
  assert.equal(value.comparability, 'high');
  assert.deepEqual(value.learningGoals, ['same-cigar-different-vitola']);
});

test('rejects a goal outside the V1 editorial list', async () => {
  assert.equal(validate(await readFrontmatter('test/fixtures/learning/comparison-invalid-goal.md')), false);
});
```

- [ ] **Step 2: Run comparison tests and verify failure**

Run: `node --test test/schema/comparison-candidate.test.mjs`

Expected: FAIL because the schema does not exist.

- [ ] **Step 3: Implement ComparisonCandidate**

Require `schemaVersion`, `kind: comparison_candidate`, `id`, two different
variant slugs, similarities and differences arrays,
one or more approved learning goals, and comparability low/medium/high. Use a
schema-level `not` rule to reject equal variant IDs. Similarities and differences
are nonempty editorial statements and do not carry causal certainty.

- [ ] **Step 4: Add fixtures**

Use two synthetic vitola variants of the same cigar for the valid high-
comparability fixture. Use `palate-profile-discovery` as the invalid goal to
prove the enum prevents scope creep.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- test/schema/comparison-candidate.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit comparison schema**

```bash
git add schema/learning-path.schema.yaml test/schema/comparison-candidate.test.mjs test/fixtures/learning
git commit -m "feat: define curated cigar comparisons"
```

### Task 2: LearningPath schema and unbiased prompts

**Files:**
- Modify: `schema/learning-path.schema.yaml`
- Create: `test/schema/learning-path.test.mjs`
- Create: `test/fixtures/learning/path-valid.md`
- Create: `test/fixtures/learning/path-biased-prompt.md`

**Interfaces:**
- Consumes: `$defs.comparisonCandidate` from Task 1.
- Produces: a `kind: learning_path` document branch with title, objective, ordered steps, observation prompts, and referenced comparisons.

- [ ] **Step 1: Write learning-path tests**

```js
test('accepts a neutral observation prompt', async () => {
  const value = await readFrontmatter('test/fixtures/learning/path-valid.md');
  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
  assert.equal(value.steps[0].prompt, 'Observe se surgem notas da família torrada.');
});

test('flags a prompt that promises a specific sensation', async () => {
  const value = await readFrontmatter('test/fixtures/learning/path-biased-prompt.md');
  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
  assert.match(findBiasedPrompt(value.steps[0].prompt), /você vai sentir/i);
});
```

- [ ] **Step 2: Run learning-path tests and verify failure**

Run: `node --test test/schema/learning-path.test.mjs`

Expected: FAIL because the root LearningPath contract is absent.

- [ ] **Step 3: Implement LearningPath and an editorial prompt guard**

Require `schemaVersion`, `kind: learning_path`, `id`, `title`, `objective`, and a nonempty ordered
`steps` array. Each step requires `id`, `title`, and `prompt`; may reference a
comparison slug; and must not contain a `preferenceSignal` field. Add a custom
repository lint module `scripts/lib/prompt-bias.mjs` exporting
`findBiasedPrompt(prompt): string | null`; flag Portuguese/English promise
patterns such as `você vai sentir`, `you will taste`, and `you will feel`, case
insensitively. The schema handles structure; the lint enforces editorial style.

- [ ] **Step 4: Integrate the prompt lint in tests**

```js
assert.equal(findBiasedPrompt('Observe se surgem notas da família torrada.'), null);
assert.match(findBiasedPrompt('Você vai sentir chocolate.'), /você vai sentir/i);
```

The biased fixture must remain structurally valid while the lint reports the
biased phrase. This distinguishes structural validation from editorial
validation.

- [ ] **Step 5: Run focused and regression tests**

Run: `npm test -- test/schema/learning-path.test.mjs && npm test`

Expected: all tests PASS, with the biased fixture accepted structurally and
flagged editorially.

- [ ] **Step 6: Commit learning-path support**

```bash
git add schema/learning-path.schema.yaml scripts/lib/prompt-bias.mjs test/schema/learning-path.test.mjs test/fixtures/learning
git commit -m "feat: add curated learning paths and prompt bias lint"
```

### Task 3: Curated examples and personal comparison boundary

**Files:**
- Create: `knowledge/learning/paths/strength-vs-body.md`
- Create: `knowledge/learning/comparisons/same-cigar-different-vitola.md`
- Create: `test/schema/learning-examples.test.mjs`
- Modify: `docs/contribution-guide.md`

**Interfaces:**
- Consumes: completed learning schema and prompt-bias lint.
- Produces: schema-valid curated examples and a documented separation between editorial candidates and personal outcomes.

- [ ] **Step 1: Write example and boundary tests**

```js
for (const path of [
  'knowledge/learning/paths/strength-vs-body.md',
  'knowledge/learning/comparisons/same-cigar-different-vitola.md',
]) {
  test(`${path} is structurally valid and editorially neutral`, async () => {
    const value = await readFrontmatter(path);
    assert.equal(validate(value), true, ajv.errorsText(validate.errors));
    for (const step of value.steps ?? []) assert.equal(findBiasedPrompt(step.prompt), null);
  });
}
```

- [ ] **Step 2: Run example tests and verify failure**

Run: `node --test test/schema/learning-examples.test.mjs`

Expected: FAIL because the curated Markdown files do not exist.

- [ ] **Step 3: Add curated synthetic examples**

Create a strength-versus-body path that asks the user to rate the two dimensions
independently without forecasting flavors. Create a same-cigar/different-vitola
comparison with synthetic variant IDs, explicit controlled and uncontrolled
variables, and medium comparability. Do not infer a preference.

- [ ] **Step 4: Document editorial and personal boundaries**

Add contribution-guide rules that reusable paths/candidates live under
`knowledge/learning`, completed user comparisons live under
`personal/comparisons`, one session cannot establish a preference, and
comparability is not scientific certainty.

- [ ] **Step 5: Run schema, lint, and regression checks**

Run: `npm test && node scripts/validate.mjs schema/learning-path.schema.yaml knowledge/learning/paths/*.md && git diff --check`

Expected: all tests and validation PASS with no whitespace errors.

- [ ] **Step 6: Commit curated learning examples**

```bash
git add knowledge/learning docs/contribution-guide.md test/schema/learning-examples.test.mjs
git commit -m "docs: add neutral learning and comparison examples"
```
