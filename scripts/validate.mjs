import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
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
