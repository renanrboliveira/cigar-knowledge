import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeSmokeSession } from '../scripts/summarize-smoke-session.mjs';

test('summary contains only recorded descriptors and notes', () => {
  const session = {
    stages: [{
      kind: 'first_third',
      sensory: {
        flavors: [{ family: 'woody', descriptor: 'cedar' }],
        notes: 'Dry finish.',
      },
    }],
    finalEvaluation: { overallImpression: 'Balanced.' },
  };

  const summary = summarizeSmokeSession(session);

  assert.match(summary, /cedar/);
  assert.match(summary, /Dry finish/);
  assert.match(summary, /Balanced/);
  assert.doesNotMatch(summary, /chocolate|coffee|leather/i);
});
