import { readFile } from 'node:fs/promises';
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
