import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { readFrontmatter } from './lib/frontmatter.mjs';

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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const session = await readFrontmatter(process.argv[2]);
  console.log(summarizeSmokeSession(session));
}
