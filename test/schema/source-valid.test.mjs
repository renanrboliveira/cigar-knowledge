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

  assert.equal(
    validate(await readFrontmatter('sources/manufacturers/example-manufacturer-source.md')),
    true,
  );
  assert.equal(
    validate(await readFrontmatter('test/fixtures/source/invalid-global-confidence.md')),
    false,
  );
});
