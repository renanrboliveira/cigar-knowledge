# Smoke Sessions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement one extensible SmokeSession model for quick and guided records while keeping personal observation distinct from catalog facts.

**Architecture:** Store each session as Markdown under `personal/smoke-sessions/` with structured YAML frontmatter. Model stages as an extensible array; keep sensory observations, retrohale, construction, nicotine impact, and final evaluation as separate internal schema definitions.

**Tech Stack:** YAML, JSON Schema Draft 2020-12, Node.js 22, Ajv 8, Node built-in test runner

**Spec:** `docs/superpowers/specs/2026-09-03-cigar-knowledge-design.md`

## Global Constraints

- Complete the foundation/evidence and cigar catalog plans first.
- SmokeSession always references `CigarVariant`, never Cigar directly.
- One model supports `quick` and `guided`; status is planned, in_progress, completed, or abandoned.
- Strength, body, and flavorIntensity are independent optional integers from 1 to 5.
- Do not require a 0–100 score.
- Retrohale observations remain separate from normal observations.
- NicotineImpact remains separate from strength.
- Automatic summaries may only use user-recorded notes and never invent descriptors.
- Personal observations do not alter catalog facts.

---

### Task 1: Session lifecycle and extensible stages

**Files:**
- Create: `schema/smoke-session.schema.yaml`
- Create: `test/schema/smoke-session-lifecycle.test.mjs`
- Create: `test/fixtures/smoke-session/planned-quick.md`
- Create: `test/fixtures/smoke-session/completed-guided.md`

**Interfaces:**
- Consumes: common schema definitions and a `cigarVariantId` slug.
- Produces: the root SmokeSession contract and `$defs.stage` with extensible string `kind`.

- [ ] **Step 1: Write lifecycle tests**

```js
test('supports a minimal planned quick session', async () => {
  assert.equal(validate(await readFrontmatter('test/fixtures/smoke-session/planned-quick.md')), true);
});

test('supports guided thirds without hard-coding array length', async () => {
  const value = await readFrontmatter('test/fixtures/smoke-session/completed-guided.md');
  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
  assert.deepEqual(value.stages.map(({ kind }) => kind), ['first_third', 'second_third', 'final_third']);
});
```

- [ ] **Step 2: Run lifecycle tests and verify failure**

Run: `node --test test/schema/smoke-session-lifecycle.test.mjs`

Expected: FAIL because the smoke-session schema is absent.

- [ ] **Step 3: Implement lifecycle fields**

Require `schemaVersion`, `id`, `cigarVariantId`, `mode`, and `status`. Allow
nullable timing with `startedAt`, `endedAt`, and `durationMinutes`; optional
Context, Preparation, and PreLight mappings with conservative string/boolean
fields; and a `stages` array whose `kind` accepts the three V1 values plus future
nonempty snake_case values. Require stages only when status is completed. Set
`additionalProperties: false` throughout.

- [ ] **Step 4: Add lifecycle fixtures**

Create a planned quick session with no stages and a completed guided session
with exactly the three V1 stages. Both reference readable synthetic variant IDs.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- test/schema/smoke-session-lifecycle.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit lifecycle support**

```bash
git add schema/smoke-session.schema.yaml test/schema/smoke-session-lifecycle.test.mjs test/fixtures/smoke-session
git commit -m "feat: define smoke session lifecycle and stages"
```

### Task 2: Sensory observations and retrohale

**Files:**
- Modify: `schema/smoke-session.schema.yaml`
- Create: `test/schema/smoke-session-sensory.test.mjs`
- Create: `test/fixtures/smoke-session/sensory-valid.md`
- Create: `test/fixtures/smoke-session/sensory-invalid-score.md`

**Interfaces:**
- Consumes: stage definition from Task 1.
- Produces: `$defs.sensorySnapshot`, `$defs.flavorObservation`, and `$defs.retrohale`.

- [ ] **Step 1: Write sensory boundary tests**

```js
test('keeps three intensity dimensions and retrohale separate', async () => {
  const value = await readFrontmatter('test/fixtures/smoke-session/sensory-valid.md');
  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
  const stage = value.stages[0];
  assert.deepEqual(
    [stage.sensory.strength, stage.sensory.body, stage.sensory.flavorIntensity],
    [2, 4, 3],
  );
  assert.notDeepEqual(stage.sensory.flavors, stage.retrohale.flavors);
});

test('rejects a 0-100 overall score field', async () => {
  assert.equal(validate(await readFrontmatter('test/fixtures/smoke-session/sensory-invalid-score.md')), false);
});
```

- [ ] **Step 2: Run sensory tests and verify failure**

Run: `node --test test/schema/smoke-session-sensory.test.mjs`

Expected: FAIL because the sensory definitions are absent.

- [ ] **Step 3: Implement sensory definitions**

FlavorObservation requires one of the 12 approved family values; descriptor,
intensity 1–5, and discovery (`spontaneous` or `prompted`) are optional. A
SensorySnapshot allows independent nullable strength, body, and flavorIntensity
1–5 values, nullable texture, a flavors array, and notes. Retrohale has its own
flavors and notes. Do not define `score`, `overallScore`, or flavor-causality
fields.

- [ ] **Step 4: Add valid and invalid fixtures**

The valid fixture records woody normal flavor and spicy retrohale flavor with
different dimension ratings. The invalid fixture adds `overallScore: 87` to an
otherwise valid sensory snapshot, causing `additionalProperties: false` to
reject it.

- [ ] **Step 5: Run focused and regression tests**

Run: `npm test -- test/schema/smoke-session-sensory.test.mjs && npm test`

Expected: all tests PASS.

- [ ] **Step 6: Commit sensory support**

```bash
git add schema/smoke-session.schema.yaml test/schema/smoke-session-sensory.test.mjs test/fixtures/smoke-session
git commit -m "feat: model smoke session sensory observations"
```

### Task 3: Construction, nicotine impact, and final evaluation

**Files:**
- Modify: `schema/smoke-session.schema.yaml`
- Create: `test/schema/smoke-session-evaluation.test.mjs`
- Create: `test/fixtures/smoke-session/evaluation-valid.md`

**Interfaces:**
- Consumes: completed-stage and sensory definitions.
- Produces: `$defs.construction`, `$defs.nicotineImpact`, and `$defs.finalEvaluation`.

- [ ] **Step 1: Write evaluation tests**

```js
test('models draw events and nicotine independently from strength', async () => {
  const value = await readFrontmatter('test/fixtures/smoke-session/evaluation-valid.md');
  assert.equal(validate(value), true, ajv.errorsText(validate.errors));
  assert.equal(value.stages[0].construction.draw, 'ideal');
  assert.deepEqual(value.stages[0].construction.events, ['touch_up']);
  assert.equal(value.nicotineImpact, 'noticeable');
  assert.equal(value.stages[0].sensory.strength, 2);
});
```

- [ ] **Step 2: Run evaluation tests and verify failure**

Run: `node --test test/schema/smoke-session-evaluation.test.mjs`

Expected: FAIL because the evaluation definitions are absent.

- [ ] **Step 3: Implement construction and evaluation definitions**

Construction supports the five approved draw values, nullable burnQuality,
events restricted to touch_up, relight, canoeing, and tunneling, nullable
smokeOutput, and nullable perceivedHeat. NicotineImpact is the approved
five-value enum. FinalEvaluation supports nullable enjoyment, balance,
complexity, evolution, and construction ratings 1–5; nullable bestStage;
nullable booleans wouldSmokeAgain and wouldBuyAgain; unique
dominantFlavorFamilies from the V1 taxonomy; and nullable overallImpression.

- [ ] **Step 4: Add a complete evaluation fixture**

Record an ideal draw, one touch-up, strength 2, noticeable nicotine impact, a
best stage, repeat/buy decisions, dominant families, and a free-text impression.
Keep nicotine and strength intentionally different.

- [ ] **Step 5: Run all tests**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 6: Commit construction and evaluation support**

```bash
git add schema/smoke-session.schema.yaml test/schema/smoke-session-evaluation.test.mjs test/fixtures/smoke-session/evaluation-valid.md
git commit -m "feat: add smoke construction and final evaluation"
```

### Task 4: Example session and non-inventive summary helper

**Files:**
- Create: `examples/smoke-session.example.md`
- Create: `scripts/summarize-smoke-session.mjs`
- Create: `test/summarize-smoke-session.test.mjs`
- Create: `personal/smoke-sessions/.gitkeep`

**Interfaces:**
- Consumes: a schema-valid SmokeSession object.
- Produces: `summarizeSmokeSession(session): string`, built only from stored notes, flavor observations, and final impression.

- [ ] **Step 1: Write non-invention tests**

```js
test('summary contains only recorded descriptors and notes', () => {
  const session = {
    stages: [{ kind: 'first_third', sensory: { flavors: [{ family: 'woody', descriptor: 'cedar' }], notes: 'Dry finish.' } }],
    finalEvaluation: { overallImpression: 'Balanced.' },
  };
  const summary = summarizeSmokeSession(session);
  assert.match(summary, /cedar/);
  assert.match(summary, /Dry finish/);
  assert.match(summary, /Balanced/);
  assert.doesNotMatch(summary, /chocolate|coffee|leather/i);
});
```

- [ ] **Step 2: Run summary tests and verify failure**

Run: `node --test test/summarize-smoke-session.test.mjs`

Expected: FAIL because the summarizer module is absent.

- [ ] **Step 3: Implement deterministic summary assembly**

```js
export function summarizeSmokeSession(session) {
  const parts = [];
  for (const stage of session.stages ?? []) {
    const flavors = (stage.sensory?.flavors ?? [])
      .map(({ descriptor, family }) => descriptor ?? family)
      .join(', ');
    if (flavors) parts.push(`${stage.kind}: ${flavors}.`);
    if (stage.sensory?.notes) parts.push(stage.sensory.notes);
  }
  if (session.finalEvaluation?.overallImpression) {
    parts.push(session.finalEvaluation.overallImpression);
  }
  return parts.join(' ');
}
```

Expose a CLI wrapper in the same file only when invoked directly; it reads one
Markdown session through `readFrontmatter` and prints the deterministic summary.

- [ ] **Step 4: Create and validate the example session**

Create one completed guided synthetic session demonstrating three stages,
separate retrohale, construction events, nicotine impact, and final evaluation.
Its prose summary must use only recorded observations.

- [ ] **Step 5: Run validation and all tests**

Run: `node scripts/validate.mjs schema/smoke-session.schema.yaml examples/smoke-session.example.md && npm test && git diff --check`

Expected: validation and tests PASS with no whitespace errors.

- [ ] **Step 6: Commit example and summary helper**

```bash
git add examples/smoke-session.example.md scripts/summarize-smoke-session.mjs test/summarize-smoke-session.test.mjs personal/smoke-sessions/.gitkeep
git commit -m "feat: add non-inventive smoke session summaries"
```
