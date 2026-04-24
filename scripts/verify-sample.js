import { processHierarchy } from '../server/bfhl.js';

const sampleInput = [
  'A->B',
  'A->C',
  'B->D',
  'C->E',
  'E->F',
  'X->Y',
  'Y->Z',
  'Z->X',
  'P->Q',
  'Q->R',
  'G->H',
  'G->H',
  'G->I',
  'hello',
  '1->2',
  'A->',
];

const result = processHierarchy(sampleInput);

const checks = [
  ['invalid entries', JSON.stringify(result.invalid_entries) === JSON.stringify(['hello', '1->2', 'A->'])],
  ['duplicate edges', JSON.stringify(result.duplicate_edges) === JSON.stringify(['G->H'])],
  ['tree count', result.summary.total_trees === 3],
  ['cycle count', result.summary.total_cycles === 1],
  ['largest root', result.summary.largest_tree_root === 'A'],
  ['hierarchy count', result.hierarchies.length === 4],
];

const failedChecks = checks.filter(([, passed]) => !passed);

if (failedChecks.length > 0) {
  console.error('Sample verification failed.');

  for (const [name] of failedChecks) {
    console.error(`- ${name}`);
  }

  process.exit(1);
}

console.log('Sample verification passed.');
console.log(JSON.stringify(result, null, 2));
