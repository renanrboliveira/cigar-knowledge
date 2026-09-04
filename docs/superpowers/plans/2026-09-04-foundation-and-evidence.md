# Foundation and Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the repository conventions, automated validation harness, and Source → Evidence → Claim schemas that every later knowledge document will use.

**Architecture:** Use YAML-authored JSON Schema Draft 2020-12 documents and a small Node.js validator that extracts YAML frontmatter from Markdown before validating it with Ajv. Keep reusable primitives in `common.schema.yaml`; model sources as publications and evidence as field-level relationships, never as global source confidence.

**Tech Stack:** Node.js 22, npm, Ajv 8, ajv-formats 3, YAML 2, Node built-in test runner, JSON Schema Draft 2020-12

**Spec:** `docs/superpowers/specs/2026-09-03-cigar-knowledge-design.md`

## Global Constraints

- Markdown is the human representation and YAML frontmatter is the structured representation.
- Every structured document has `schemaVersion: 1`.
- Editorial IDs are readable slugs.
- Unknown or null is preferable to invented information.
- Preserve raw source labels.
- Do not put global confidence on `Source`; confidence belongs to `Evidence`.
- Preserve source disagreement instead of silently choosing a winner.
- Do not implement palate profiles, PreferenceSignal, ML, embeddings, social features, rankings, badges, streaks, consumption goals, sophisticated recommendations, a giant sensory taxonomy, or a required 0–100 score.

---

### Task 1: Frontmatter validation harness

**Files:**
- Create: `package.json`
- Create: `scripts/lib/frontmatter.mjs`
- Create: `scripts/validate.mjs`
- Create: `test/frontmatter.test.mjs`
- Create: `test/fixtures/frontmatter/valid.md`
- Create: `test/fixtures/frontmatter/missing-frontmatter.md`
- Create: `.gitignore`
- Create: `.github/workflows/validate.yml`

**Interfaces:**
- Consumes: Markdown files containing a single YAML frontmatter mapping.
- Produces: `readFrontmatter(path): Promise<object>` and a CLI `node scripts/validate.mjs <schema> <document...>` that exits nonzero and prints Ajv errors for invalid input.

- [ ] **Step 1: Write failing parser tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFrontmatter } from '../scripts/lib/frontmatter.mjs';

test('reads YAML frontmatter', async () => {
  assert.deepEqual(await readFrontmatter('test/fixtures/frontmatter/valid.md'), {
    schemaVersion: 1,
    id: 'valid-document',
  });
});

test('rejects Markdown without frontmatter', async () => {
  await assert.rejects(
    readFrontmatter('test/fixtures/frontmatter/missing-frontmatter.md'),
    /missing YAML frontmatter/,
  );
});
```

- [ ] **Step 2: Run the parser tests and verify failure**

Run: `node --test test/frontmatter.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/lib/frontmatter.mjs`.

- [ ] **Step 3: Implement the parser and fixtures**

```js
// scripts/lib/frontmatter.mjs
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import YAML from 'yaml';

export async function readFrontmatter(path) {
  const markdown = await readFile(path, 'utf8');
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`${path}: missing YAML frontmatter`);
  const value = YAML.parse(match[1]);
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    throw new Error(`${path}: frontmatter must be a mapping`);
  }
  return value;
}
```

Create `valid.md` with frontmatter keys `schemaVersion: 1` and
`id: valid-document`, and create `missing-frontmatter.md` with only a Markdown
heading.

- [ ] **Step 4: Implement the validation CLI and package scripts**

```js
// scripts/validate.mjs
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import YAML from 'yaml';
import { readFrontmatter } from './lib/frontmatter.mjs';

const [schemaPath, ...documentPaths] = process.argv.slice(2);
if (!schemaPath || documentPaths.length === 0) {
  console.error('Usage: node scripts/validate.mjs <schema> <document...>');
  process.exit(2);
}

const schema = YAML.parse(await readFile(schemaPath, 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
for (const name of await readdir(dirname(schemaPath))) {
  if (!name.endsWith('.schema.yaml')) continue;
  const candidate = YAML.parse(await readFile(join(dirname(schemaPath), name), 'utf8'));
  if (candidate.$id && candidate.$id !== schema.$id) ajv.addSchema(candidate);
}
const validate = ajv.compile(schema);
let failed = false;

for (const path of documentPaths) {
  const valid = validate(await readFrontmatter(path));
  if (!valid) {
    failed = true;
    console.error(`${path}: ${ajv.errorsText(validate.errors, { separator: '\n' })}`);
  }
}
process.exitCode = failed ? 1 : 0;
```

Set `package.json` scripts to `"test": "node --test"` and
`"validate": "node scripts/validate.mjs"`; pin `ajv`, `ajv-formats`, and
`yaml` as dev dependencies. Ignore `node_modules/`. Configure the workflow to
run `npm ci` and `npm test` on pushes and pull requests using Node 22.

- [ ] **Step 5: Install dependencies and run tests**

Run: `npm install && npm test`

Expected: both frontmatter tests PASS and `package-lock.json` is created.

- [ ] **Step 6: Commit the validation harness**

```bash
git add package.json package-lock.json .gitignore .github/workflows/validate.yml scripts test
git commit -m "build: add markdown schema validation harness"
```

### Task 2: Common and source schemas

**Files:**
- Create: `schema/common.schema.yaml`
- Create: `schema/source.schema.yaml`
- Create: `sources/manufacturers/example-manufacturer-source.md`
- Create: `test/schema/source-valid.test.mjs`
- Create: `test/fixtures/source/invalid-global-confidence.md`

**Interfaces:**
- Consumes: the frontmatter loader from Task 1.
- Produces: `$defs.schemaVersion`, `$defs.slug`, and `$defs.evidenceStatus` in `common.schema.yaml`; a `source.schema.yaml` document contract with `id`, `type`, `title`, `url`, `publisher`, `publishedAt`, and `accessedAt`.

- [ ] **Step 1: Write schema contract tests**

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import YAML from 'yaml';
import { readFrontmatter } from '../../scripts/lib/frontmatter.mjs';

test('accepts a manufacturer source and rejects global confidence', async () => {
  const common = YAML.parse(await readFile('schema/common.schema.yaml', 'utf8'));
  const source = YAML.parse(await readFile('schema/source.schema.yaml', 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  ajv.addSchema(common);
  const validate = ajv.compile(source);
  assert.equal(validate(await readFrontmatter('sources/manufacturers/example-manufacturer-source.md')), true);
  assert.equal(validate(await readFrontmatter('test/fixtures/source/invalid-global-confidence.md')), false);
});
```

- [ ] **Step 2: Run the contract test and verify failure**

Run: `node --test test/schema/source-valid.test.mjs`

Expected: FAIL because the schema files do not exist.

- [ ] **Step 3: Implement common and source contracts**

Define `$id` values `https://cigar-knowledge.local/schema/common.schema.yaml` and
`https://cigar-knowledge.local/schema/source.schema.yaml`. Require
`schemaVersion`, `id`, `type`, and `title`; set `additionalProperties: false`.
Restrict `type` to the nine approved source types. Define `url` as URI,
`publishedAt`/`accessedAt` as ISO dates, and do not define a `confidence` field.
Use the slug pattern `^[a-z0-9]+(?:-[a-z0-9]+)*$`.

- [ ] **Step 4: Add valid and invalid Markdown fixtures**

The valid source uses `type: manufacturer`, a readable slug, and a URL. The
invalid fixture repeats the valid minimum fields and adds `confidence: high` so
`additionalProperties: false` rejects it.

- [ ] **Step 5: Run the source contract test**

Run: `npm test -- test/schema/source-valid.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit common and source schemas**

```bash
git add schema/common.schema.yaml schema/source.schema.yaml sources/manufacturers test/schema/source-valid.test.mjs test/fixtures/source
git commit -m "feat: define common and source schemas"
```

### Task 3: Evidence schema and disagreement example

**Files:**
- Create: `schema/evidence.schema.yaml`
- Create: `examples/evidence-disagreement.example.md`
- Create: `test/schema/evidence.test.mjs`
- Create: `docs/evidence-model.md`
- Create: `sources/bibliography.md`

**Interfaces:**
- Consumes: source IDs and common enums from Task 2.
- Produces: evidence records with `sourceId`, `field`, `relation`, `confidence`, `claimType`, `status`, optional `rawLabel`, and optional `note`.

- [ ] **Step 1: Write evidence validation tests**

```js
test('keeps contradictory evidence records side by side', async () => {
  const document = await readFrontmatter('examples/evidence-disagreement.example.md');
  assert.equal(validate(document), true, ajv.errorsText(validate.errors));
  assert.deepEqual(document.evidence.map(({ relation }) => relation), ['supports', 'contradicts']);
});

test('rejects evidence without a source and field', () => {
  assert.equal(validate({ schemaVersion: 1, evidence: [{ relation: 'mentions' }] }), false);
});
```

At the top of the test file, import `assert` from `node:assert/strict`, `test`
from `node:test`, `readFile` from `node:fs/promises`, `Ajv2020`, `YAML`, and
`readFrontmatter`. Parse and register `common.schema.yaml`, parse and compile
`evidence.schema.yaml`, and bind the compiled function to `validate` before the
two test declarations.

- [ ] **Step 2: Run the evidence tests and verify failure**

Run: `node --test test/schema/evidence.test.mjs`

Expected: FAIL because the evidence schema and example do not exist.

- [ ] **Step 3: Implement the evidence schema**

Require `schemaVersion` and a nonempty `evidence` array. Each evidence item
requires `sourceId`, `field`, `relation`, `confidence`, `claimType`, and
`status`; use exactly the enums approved in the spec and
`additionalProperties: false`. `sourceId` uses the common slug definition;
`field` is a nonempty JSON-pointer-like string beginning with `/`.

- [ ] **Step 4: Add the disagreement fixture and evidence documentation**

Represent two records for `/production/status`: one `supports` and one
`contradicts`, each referencing a different source slug. Explain in
`docs/evidence-model.md` that Source describes a publication, Evidence qualifies
a claim, and conflicts are retained. Keep `sources/bibliography.md` as the
human-readable index linking source documents.

- [ ] **Step 5: Run all tests**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 6: Commit evidence support**

```bash
git add schema/evidence.schema.yaml examples/evidence-disagreement.example.md docs/evidence-model.md sources/bibliography.md test/schema/evidence.test.mjs
git commit -m "feat: model field-level evidence and disagreement"
```

### Task 4: Repository guidance and directory contract

**Files:**
- Modify: `README.md`
- Create: `CLAUDE.md`
- Create: `docs/contribution-guide.md`
- Create: `test/repository-structure.test.mjs`
- Create: `knowledge/concepts/.gitkeep`
- Create: `knowledge/terroirs/.gitkeep`
- Create: `knowledge/brands/.gitkeep`
- Create: `knowledge/sensory/.gitkeep`
- Create: `personal/cellar/.gitkeep`
- Create: `personal/learning-notes/.gitkeep`
- Create: `personal/comparisons/.gitkeep`
- Create: `sources/books/.gitkeep`
- Create: `sources/specialized-media/.gitkeep`

**Interfaces:**
- Consumes: validation commands and provenance rules from Tasks 1–3.
- Produces: contributor/agent rules and stable top-level locations for later plans.

- [ ] **Step 1: Write the structure test**

```js
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import test from 'node:test';

const required = [
  'CLAUDE.md', 'docs/contribution-guide.md', 'knowledge/concepts',
  'knowledge/terroirs', 'knowledge/brands', 'knowledge/sensory',
  'personal/cellar', 'personal/learning-notes', 'personal/comparisons',
  'sources/books', 'sources/specialized-media',
];

test('contains the V1 repository foundations', async () => {
  await Promise.all(required.map((path) => access(path)));
  assert.ok(true);
});
```

- [ ] **Step 2: Run the structure test and verify failure**

Run: `node --test test/repository-structure.test.mjs`

Expected: FAIL on missing `CLAUDE.md`.

- [ ] **Step 3: Add repository directories and guidance**

Create the listed directories with `.gitkeep`. Copy the ten approved future
agent rules into `CLAUDE.md`. In the contribution guide, require source-backed
technical claims, preserved raw labels, explicit unknowns, validation before a
commit, and separation between `knowledge/` and `personal/`.

- [ ] **Step 4: Expand README navigation**

Document the purpose of `schema/`, `knowledge/`, `personal/`, `sources/`, and
`examples/`; link the design spec, evidence model, and contribution guide; show
`npm install`, `npm test`, and the validation CLI syntax.

- [ ] **Step 5: Run tests and inspect links**

Run: `npm test && git diff --check`

Expected: all tests PASS and no whitespace errors.

- [ ] **Step 6: Commit repository guidance**

```bash
git add README.md CLAUDE.md docs/contribution-guide.md knowledge personal sources test/repository-structure.test.mjs
git commit -m "docs: establish knowledge base contribution rules"
```
