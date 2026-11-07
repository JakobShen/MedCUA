import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { exampleMarkup } from '../contribute/example-view.js';
import {
  IMPORTANCE, blankTask, effectiveIds, exportTask, normalizeTask,
  validationError, taskSummary,
} from '../contribute/model.js';

const examples = JSON.parse(await readFile(new URL('../contribute/examples.json', import.meta.url), 'utf8'));
const testContact = () => ({ name: 'Example contributor', email: 'example@example.org', affiliation: 'Example institution' });

test('the example display is read-only, escaped, and independent of the contributor draft', () => {
  const example = normalizeTask(examples.pulmonaryEmbolism);
  const before = structuredClone(example);
  const markup = exampleMarkup(example);
  assert.deepEqual(example, before);
  assert.doesNotMatch(markup, /<(input|textarea|select|form)\b/i);
  assert.doesNotMatch(markup, /data-action="(?:download-json|new-task|copy-summary)"/);
  assert.match(markup, /<table\b/);
  assert.equal((markup.match(/<tbody>/g) || []).length, 6);
  assert.match(markup, /rowspan="2"/);
  for (const step of example.steps) {
    for (const item of step.evidence) assert.ok(markup.includes(item.description.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')));
  }
  example.task.name = '<img src=x onerror=alert(1)>';
  assert.doesNotMatch(exampleMarkup(example), /<img\b/);
  assert.match(exampleMarkup(example), /&lt;img/);
});

function validSingle() {
  const state = blankTask();
  state.contact = testContact();
  Object.assign(state.task, {
    name: 'Assess a finding', description: 'Determine whether the finding is present.',
    data: 'A de-identified image series.',
    tools: [{ id: 'viewer', name: 'Image viewer' }],
    modalities: [{ id: 'mri', name: 'MRI' }],
  });
  Object.assign(state.steps[0], {
    description: 'Inspect the finding.',
    evidence: [{ id: 'e-1', description: 'Location of the finding in the image series.', importance: 'essential' }],
  });
  state.expectedResult = 'Present / absent / uncertain.';
  return state;
}

function makeMultiple(state) {
  state.task.tools.push({ id: 'ehr', name: 'EHR / clinical records' });
  state.task.modalities.push({ id: 'records', name: 'Text / clinical records' });
  return state;
}

test('name, affiliation, and a valid email are required before submission', () => {
  const state = validSingle();
  state.contact = { name: '', affiliation: '', email: '' };
  assert.equal(validationError(state), 'Please enter your name.');
  state.contact.name = '   ';
  assert.equal(validationError(state), 'Please enter your name.');
  state.contact.name = 'Example contributor';
  assert.equal(validationError(state), 'Please enter your affiliation.');
  state.contact.affiliation = '   ';
  assert.equal(validationError(state), 'Please enter your affiliation.');
  state.contact.affiliation = 'Example institution';
  assert.equal(validationError(state), 'Please enter a valid email address.');
  for (const email of ['not-an-email', 'example@', '@example.org', 'example@example', 'two words@example.org']) {
    state.contact.email = email;
    assert.equal(validationError(state), 'Please enter a valid email address.', `Must reject ${email}`);
  }
  state.contact.email = 'example+workflow@example.org';
  assert.equal(validationError(state), '');
});

test('older drafts restore missing or single-choice dataset answers', () => {
  const raw = validSingle();
  delete raw.task.dataAvailability;
  delete raw.task.publicDatasetUrl;
  const state = normalizeTask(raw);
  assert.deepEqual(state.task.dataAvailability, []);
  assert.equal(state.task.publicDatasetUrl, '');
  assert.equal(validationError(state), '');
  assert.doesNotMatch(taskSummary(state), /Dataset availability:/);

  raw.task.publicDatasetUrl = 'https://dataset.example.org/studies';
  for (const key of ['shareable', 'public', 'none', 'unsure']) {
    raw.task.dataAvailability = key;
    const restored = normalizeTask(raw);
    assert.deepEqual(restored.task.dataAvailability, [key]);
    assert.equal(validationError(restored), '');
    assert.equal(raw.task.dataAvailability, key);
  }
});

test('dataset options can coexist and require a valid HTTP(S) link when public data is selected', () => {
  const state = validSingle();
  state.task.dataAvailability = ['shareable', 'public'];
  for (const value of ['', 'dataset.example.org', 'https://', 'https:///dataset.example.org',
    'ftp://dataset.example.org', 'javascript:alert(1)', 'https://user:secret@dataset.example.org']) {
    state.task.publicDatasetUrl = value;
    assert.match(validationError(state), /valid public dataset link/, `Must reject ${value}`);
    assert.equal(exportTask(state).task.publicDatasetUrl, '');
  }
  const url = 'https://dataset.example.org/studies';
  state.task.publicDatasetUrl = `  ${url}  `;
  assert.equal(validationError(state), '');
  const exported = exportTask(state);
  assert.deepEqual(exported.task.dataAvailability, ['shareable', 'public']);
  assert.equal(exported.task.publicDatasetUrl, url);
  const restored = normalizeTask(exported);
  assert.deepEqual(restored.task.dataAvailability, ['shareable', 'public']);
  assert.equal(restored.task.publicDatasetUrl, url);
  const summary = taskSummary(state);
  assert.match(summary, /Dataset availability: I may be able to share de-identified sample data, A public dataset is available/);
  assert.ok(summary.includes(`Public dataset: ${url}`));
  state.task.dataAvailability = ['shareable'];
  assert.equal(exportTask(state).task.publicDatasetUrl, '');
  assert.equal(validationError(state), '');
  assert.doesNotMatch(taskSummary(state), /A public dataset is available|Public dataset:/);
});

test('dataset imports discard invalid and duplicate choices and resolve conflicting fallback answers', () => {
  const state = validSingle();
  state.task.dataAvailability = ['unsure', 'public', 'unknown', 'shareable', 'none', 'public', null];
  assert.deepEqual(normalizeTask(state).task.dataAvailability, ['public', 'shareable']);
  assert.deepEqual(exportTask(state).task.dataAvailability, ['public', 'shareable']);
  state.task.dataAvailability = ['unknown', 'none', 'unsure'];
  assert.deepEqual(normalizeTask(state).task.dataAvailability, ['none']);
});

test('a single active tool and modality are inherited by every exported step', () => {
  const state = validSingle();
  state.task.tools.push({ id: 'unused', name: '   ' });
  state.task.modalities.push({ id: 'unused-data', name: '' });
  state.steps.push({ id: 'step-2', description: 'Decide the result.', toolIds: [], modalityIds: [], evidence: [] });
  assert.equal(validationError(state), '');
  const result = exportTask(state);
  assert.equal(result.task.tools.length, 1);
  assert.equal(result.task.modalities.length, 1);
  for (const step of result.steps) {
    assert.deepEqual(step.toolIds, ['viewer']);
    assert.deepEqual(step.modalityIds, ['mri']);
  }
});

test('export resolves inheritance without mutating the draft or its selections', () => {
  const state = validSingle();
  const before = structuredClone(state);
  const exported = exportTask(state);
  exported.steps[0].evidence[0].description = 'A different item';
  exported.task.tools[0].name = 'Changed tool';
  assert.deepEqual(state, before);
});

test('multiple tools require a valid selection at each step', () => {
  const state = makeMultiple(validSingle());
  assert.equal(validationError(state), 'Select the tools used in step 1.');
  state.steps[0].toolIds = ['missing-tool'];
  assert.equal(validationError(state), 'Select the tools used in step 1.');
  state.steps[0].toolIds = ['viewer'];
  assert.equal(validationError(state), 'Select the data modalities used in step 1.');
  state.steps[0].modalityIds = ['mri'];
  assert.equal(validationError(state), '');
});

test('one step may use several tools and modalities, with stale IDs excluded from export', () => {
  const state = makeMultiple(validSingle());
  state.steps[0].toolIds = ['viewer', 'ehr', 'deleted-tool'];
  state.steps[0].modalityIds = ['mri', 'records', 'deleted-modality'];
  assert.equal(validationError(state), '');
  const result = exportTask(state);
  assert.deepEqual(result.steps[0].toolIds, ['viewer', 'ehr']);
  assert.deepEqual(result.steps[0].modalityIds, ['mri', 'records']);
  assert.deepEqual(effectiveIds(state.task.tools, ['deleted-tool']), []);
});

test('arbitrary evidence counts are retained through export, summary, and import', () => {
  const state = validSingle();
  state.steps[0].evidence = Array.from({ length: 7 }, (_, i) => ({
    id: `e-${i}`, description: `Unique evidence item ${i + 1}.`,
    importance: ['essential', 'optional'][i % 2],
  }));
  assert.equal(validationError(state), '');
  const result = exportTask(state);
  const summary = taskSummary(state);
  const restored = normalizeTask(JSON.parse(JSON.stringify(result)));
  assert.equal(result.steps[0].evidence.length, 7);
  assert.equal(restored.steps[0].evidence.length, 7);
  for (const item of result.steps[0].evidence) {
    assert.ok(summary.includes(`[${item.importance}] ${item.description}`));
  }
  assert.deepEqual(restored.steps[0].evidence.map(({ description, importance }) => ({ description, importance })),
    state.steps[0].evidence.map(({ description, importance }) => ({ description, importance })));
});

test('a step with no evidence is valid when another step has evidence', () => {
  const state = validSingle();
  state.steps.unshift({ id: 'open', description: 'Open the data.', toolIds: [], modalityIds: [], evidence: [] });
  assert.equal(validationError(state), '');
  const summary = taskSummary(state);
  assert.ok(summary.includes('1. Open the data.\n   No evidence specified at this step.'));
  assert.ok(summary.includes('2. Inspect the finding.'));
});

test('an empty evidence entry requires a description and an explicit importance choice', () => {
  const state = validSingle();
  state.steps[0].evidence.push({ id: 'e-2', description: '', importance: '' });
  assert.equal(validationError(state), 'Describe evidence 2 in step 1, or remove it.');
  state.steps[0].evidence[1].description = 'A second recorded item.';
  assert.equal(validationError(state), 'Select the importance of evidence 2 in step 1.');
  state.steps[0].evidence[1].importance = 'optional';
  assert.equal(validationError(state), '');
});

test('importance allows only essential or optional and legacy labels require a new choice', () => {
  assert.deepEqual(IMPORTANCE, ['essential', 'optional']);
  const raw = exportTask(validSingle());
  const description = raw.steps[0].evidence[0].description;
  raw.steps[0].evidence[0].importance = 'important';
  assert.equal(validationError(raw), 'Select the importance of evidence 1 in step 1.');
  const restored = normalizeTask(raw);
  assert.equal(restored.steps[0].evidence[0].description, description);
  assert.equal(restored.steps[0].evidence[0].importance, '');
  assert.equal(raw.steps[0].evidence[0].importance, 'important', 'Import must not mutate the original draft');
  assert.equal(validationError(restored), 'Select the importance of evidence 1 in step 1.');
  for (const importance of IMPORTANCE) {
    restored.steps[0].evidence[0].importance = importance;
    assert.equal(validationError(restored), '');
  }
});

test('at least one evidence item is needed for a completed submission', () => {
  const state = validSingle();
  state.steps[0].evidence = [];
  assert.equal(validationError(state), 'Add at least one evidence item needed to check the task result.');
});

test('invalid JSON or an unrelated/unsupported schema cannot be imported', () => {
  assert.throws(() => normalizeTask(JSON.parse('{broken')), SyntaxError);
  for (const raw of [null, {}, [], { schemaVersion: 2 }, { schemaVersion: '1' },
    { schemaVersion: 1, task: {}, steps: [] },
    { schemaVersion: 1, task: { tools: [], modalities: [] }, steps: 'not an array' }]) {
    assert.throws(() => normalizeTask(raw), /Choose a MedCUA task JSON file/);
  }
});

test('import normalizes malformed optional fields and unknown importance without inventing answers', () => {
  const raw = exportTask(validSingle());
  raw.contact = { name: 123, email: null, affiliation: ['not text'] };
  raw.task.name = 42;
  raw.task.reference = 'javascript:alert(1)';
  raw.comments = { unexpected: true };
  raw.steps[0].evidence[0].importance = 'critical';
  raw.steps.push(null);
  const restored = normalizeTask(raw);
  assert.deepEqual(restored.contact, { name: '', email: '', affiliation: '' });
  assert.equal(restored.task.name, '');
  assert.equal(restored.task.reference, undefined);
  assert.equal(restored.comments, '');
  assert.equal(restored.steps[0].evidence[0].importance, '');
  assert.equal(restored.steps[1].description, '');
  assert.deepEqual(restored.steps[1].evidence, []);
});

test('import remaps tool/modality IDs coherently, deduplicates references, and ignores unknown references', () => {
  const raw = makeMultiple(validSingle());
  raw.steps[0].toolIds = ['viewer', 'ehr', 'viewer', 'unknown'];
  raw.steps[0].modalityIds = ['records', 'records', 'mri', 'unknown'];
  const untouched = structuredClone(raw);
  const restored = normalizeTask(raw);
  assert.notEqual(restored.steps[0].id, raw.steps[0].id);
  assert.deepEqual(restored.steps[0].toolIds,
    [restored.task.tools[0].id, restored.task.tools[1].id]);
  assert.deepEqual(restored.steps[0].modalityIds,
    [restored.task.modalities[1].id, restored.task.modalities[0].id]);
  assert.equal(validationError(restored), '');
  assert.deepEqual(raw, untouched);
});

test('an empty imported draft gets one editable step and one tool/modality field', () => {
  const restored = normalizeTask({ schemaVersion: 1, task: { tools: [], modalities: [] }, steps: [] });
  assert.equal(restored.steps.length, 1);
  assert.equal(restored.task.tools.length, 1);
  assert.equal(restored.task.modalities.length, 1);
  assert.equal(restored.steps[0].evidence.length, 0);
  assert.equal(validationError(restored), 'Please enter your name.');
});

test('summary preserves contact, comments, expected result, example title, notes, and reference', () => {
  const state = normalizeTask(examples.pulmonaryEmbolism);
  state.contact = testContact();
  state.comments = 'A free comment with multiple lines.\nSecond line.';
  const summary = taskSummary(state);
  for (const value of [state.task.name, state.task.description, state.task.data,
    state.expectedResult, state.comments, state.task.exampleTitle, state.task.note, state.task.reference,
    ...Object.values(state.contact)]) assert.ok(summary.includes(value), `Missing ${value}`);
  assert.ok(summary.includes('Tools: 3D Slicer, EHR / clinical records'));
  assert.ok(summary.includes('Data: CT, Clinical text / records'));
});

test('the sole pulmonary embolism example retains its six steps, seven evidence items, and per-step context', () => {
  assert.deepEqual(Object.keys(examples), ['pulmonaryEmbolism']);
  const raw = examples.pulmonaryEmbolism;
  const restored = normalizeTask(raw);
  assert.deepEqual(restored.contact, { name: '', email: '', affiliation: '' }, 'The example leaves contributor details blank');
  restored.contact = testContact();
  assert.equal(validationError(restored), '', 'The example must be ready to review');
  assert.equal(restored.task.exampleTitle, 'Example 1 - Pulmonary Embolism');
  assert.equal(restored.task.name, 'Risk Stratification of Acute Pulmonary Embolism (ESC 2019)');
  assert.equal(restored.task.description, 'Classify the early mortality risk of acute pulmonary embolism');
  assert.equal(restored.task.reference, 'https://doi.org/10.1093/eurheartj/ehz405');
  assert.deepEqual(restored.steps.map(step => step.description), [
    'Open the CTPA and locate the clots.',
    'Adjust the views to a four-chamber plane.',
    'Measure the right and left ventricles.',
    'Check hemodynamic status and troponin.',
    'Calculate the sPESI.',
    'Assign the ESC 2019 risk class.',
  ]);
  assert.deepEqual(restored.steps.map(step => step.evidence.length), [1, 0, 2, 2, 2, 0]);
  assert.deepEqual(restored.steps.flatMap(step => step.evidence.map(item => item.importance)),
    ['optional', 'essential', 'essential', 'essential', 'essential', 'essential', 'optional']);
  const exported = exportTask(restored);
  const names = (items, ids) => items.filter(item => ids.includes(item.id)).map(item => item.name);
  assert.deepEqual(exported.steps.map(step => names(exported.task.tools, step.toolIds)), [
    ['3D Slicer'], ['3D Slicer'], ['3D Slicer'],
    ['EHR / clinical records'], ['EHR / clinical records'], ['EHR / clinical records'],
  ]);
  assert.deepEqual(exported.steps.map(step => names(exported.task.modalities, step.modalityIds)), [
    ['CT'], ['CT'], ['CT'], ['Clinical text / records'], ['Clinical text / records'],
    ['CT', 'Clinical text / records'],
  ]);
  const imported = normalizeTask(JSON.parse(JSON.stringify(exported)));
  assert.equal(imported.task.exampleTitle, raw.task.exampleTitle);
  assert.deepEqual(imported.steps.map(step => step.evidence.map(({ description, importance }) => ({ description, importance }))),
    raw.steps.map(step => step.evidence.map(({ description, importance }) => ({ description, importance }))));
  const summary = taskSummary(imported);
  for (const step of raw.steps) {
    for (const evidence of step.evidence) assert.ok(summary.includes(evidence.description), `Missing ${evidence.description}`);
  }
});
