import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import YAML from 'yaml';
import { readFrontmatter } from '../../scripts/lib/frontmatter.mjs';

async function createValidator() {
  const common = YAML.parse(await readFile('schema/common.schema.yaml', 'utf8'));
  const tobacco = YAML.parse(await readFile('schema/tobacco.schema.yaml', 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  ajv.addSchema(common);
  return { ajv, validate: ajv.compile(tobacco) };
}

for (const path of [
  'examples/tobacco.example.md',
  'knowledge/tobaccos/connecticut-shade.md',
  'knowledge/tobaccos/connecticut-broadleaf.md',
]) {
  test(`${path} validates as Tobacco`, async () => {
    const { ajv, validate } = await createValidator();
    assert.equal(validate(await readFrontmatter(path)), true, ajv.errorsText(validate.errors));
  });
}
