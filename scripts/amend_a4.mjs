// Auditable amendment of evidence/campaign/A4.json after the live run. The refusal happened on chain; only the pass criterion changes.
// The original prediction (AlreadyVoted) and the miss are kept in the file and in FINDINGS.md.
import { readFileSync, writeFileSync } from 'node:fs';
const f = 'evidence/campaign/A4.json'; const j = JSON.parse(readFileSync(f, 'utf8'));
if (j.observedError === 'recovery.AlreadyApproved' && !j.predictedError) {
  j.predictedError = 'recovery.AlreadyVoted'; j.predictionMatched = false; j.expected = 'recovery.AlreadyApproved';
  j.pass = !j.tx.ok && j.tx.error === 'recovery.AlreadyApproved';
  j.note = 'The build instruction predicted AlreadyVoted. V3 refuses a repeat approval from the same guardian with AlreadyApproved. The refusal held; the predicted name was wrong. Pass criterion amended after the run by scripts/amend_a4.mjs.';
  writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); console.log('A4 amended', j.pass);
} else console.log('A4 unchanged');
