const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  normalizeCreatorStoryInput
} = require('./creator-library-input');
const {
  validateCreatorFactRecord,
  validateCreatorFactRecords,
  isInternalInstruction,
  isIncompleteFactFragment
} = require('./creator-library-facts');
const {
  buildCreatorScenePlan,
  validateCreatorScenePlan
} = require('./creator-library-scene-plan');
const {
  loadCreatorValidationPacks
} = require('./creator-library-validation-data');

const root = path.resolve(__dirname, '..');
const stories = readJson(path.join(root, 'data', 'stories.json'));
const scripts = loadCreatorValidationPacks();
const categories = readJson(path.join(root, 'data', 'categories.json'));

const fixtureSlugs = [
  'osiris-isis-resurrection-myth',
  'maui-slows-the-sun-myth',
  'demeter-and-persephone-myth',
  'cicada-3301-internet-puzzle',
  'why-names-have-power-in-legends'
];

const protectedFiles = [
  path.join(root, 'data', 'scripts.json'),
  path.join(root, 'data', 'stories.json'),
  path.join(root, 'data', 'categories.json'),
  path.join(root, 'scripts', 'creator-library-longform.js'),
  path.join(root, 'scripts', 'creator-library-production.js'),
  path.join(root, 'scripts', 'creator-library-shortform.js'),
  path.join(root, 'scripts', 'generate-site.js'),
  ...listHtmlFiles(root),
  ...listDistFiles(path.join(root, 'dist'))
];

const stats = {
  packs: 0,
  factValidationPassed: 0,
  factValidationFailed: 0,
  scenePlanPassed: 0,
  scenePlanFailed: 0,
  totalFacts: 0,
  internalInstructionFacts: 0,
  fragmentFacts: 0,
  sourceFactIdErrors: 0,
  removedInternalInstruction: 0,
  removedFragment: 0,
  removedDuplicate: 0,
  typeCounts: {},
  missingFactTypes: {},
  contentTypeFailures: {},
  fixtureSummaries: []
};

const failures = [];

main();

function main() {
  const beforeHashes = snapshotProtectedFiles();
  const targetStorySlugs = unique(scripts.map((script) => script.originalStorySlug).filter(Boolean));
  for (const slug of targetStorySlugs) validateSlug(slug);
  for (const slug of fixtureSlugs) collectFixtureSummary(slug);
  assertProtectedFilesUnchanged(beforeHashes);
  report();
  if (failures.length) process.exit(1);
}

function validateSlug(slug) {
  stats.packs += 1;
  const story = stories.find((item) => item.slug === slug);
  if (!story) return fail({ slug, errorType: 'missing-story' });
  const category = categories.find((item) => item.slug === story.categorySlug) || {};
  const input = normalizeCreatorStoryInput(story, category);
  collectRemovalStats(input);

  const factValidation = validateCreatorFactRecords(input.factRecords, input.contentType);
  if (!factValidation.valid) {
    stats.factValidationFailed += 1;
    addContentTypeFailure(input.contentType);
    factValidation.errors.forEach((error) => fail({ slug, errorType: 'fact-validation', factText: '', rawText: '', sourceRefs: [], message: error }));
  } else {
    stats.factValidationPassed += 1;
  }

  validateFactSchema(slug, input);

  try {
    const scenePlan = buildCreatorScenePlan(input);
    const sceneValidation = validateCreatorScenePlan(scenePlan);
    if (!sceneValidation.valid) {
      stats.scenePlanFailed += 1;
      addContentTypeFailure(input.contentType);
      sceneValidation.errors.forEach((error) => collectScenePlanError(slug, input, error));
    } else {
      stats.scenePlanPassed += 1;
    }
  } catch (error) {
    stats.scenePlanFailed += 1;
    addContentTypeFailure(input.contentType);
    const errors = Array.isArray(error.errors) ? error.errors : [error.message || String(error)];
    errors.forEach((message) => collectScenePlanError(slug, input, message));
  }
}

function validateFactSchema(slug, input) {
  const exact = new Set();
  const factIds = new Set((input.factRecords || []).map((record) => record.id));
  for (const record of input.factRecords || []) {
    stats.totalFacts += 1;
    stats.typeCounts[record.factType] = (stats.typeCounts[record.factType] || 0) + 1;
    const validation = validateCreatorFactRecord(record);
    validation.errors.forEach((message) => fail({ slug, factId: record.id, factType: record.factType, factText: record.factText, rawText: record.rawText, sourceRefs: record.sourceRefs, errorType: 'fact-schema', message }));
    if (isInternalInstruction(record.factText)) {
      stats.internalInstructionFacts += 1;
      fail({ slug, factId: record.id, factType: record.factType, factText: record.factText, rawText: record.rawText, sourceRefs: record.sourceRefs, errorType: 'internal-instruction' });
    }
    if (isIncompleteFactFragment(record.factText)) {
      stats.fragmentFacts += 1;
      fail({ slug, factId: record.id, factType: record.factType, factText: record.factText, rawText: record.rawText, sourceRefs: record.sourceRefs, errorType: 'fragment' });
    }
    const key = `${record.factType}:${normalizeComparable(record.factText)}`;
    if (exact.has(key)) fail({ slug, factId: record.id, factType: record.factType, factText: record.factText, rawText: record.rawText, sourceRefs: record.sourceRefs, errorType: 'duplicate' });
    exact.add(key);
    if (record.factType === 'event' && /source-context/i.test(record.factText)) {
      fail({ slug, factId: record.id, factType: record.factType, factText: record.factText, rawText: record.rawText, sourceRefs: record.sourceRefs, errorType: 'event-non-event' });
    }
    if (record.factType === 'visual' && !record.visualTerms.length && !record.entities.length) {
      fail({ slug, factId: record.id, factType: record.factType, factText: record.factText, rawText: record.rawText, sourceRefs: record.sourceRefs, errorType: 'visual-without-visual-term' });
    }
  }
  for (const id of factIds) {
    if (!id) {
      stats.sourceFactIdErrors += 1;
      fail({ slug, errorType: 'empty-fact-id' });
    }
  }
}

function collectScenePlanError(slug, input, message) {
  const text = String(message || '');
  const missing = text.match(/Missing required factType: ([a-z-]+)/i)
    || text.match(/must include ([a-z-]+)/i);
  if (missing) stats.missingFactTypes[missing[1]] = (stats.missingFactTypes[missing[1]] || 0) + 1;
  fail({ slug, errorType: 'scene-plan', message: text, availableFactTypes: Object.keys(countByType(input.factRecords)) });
}

function collectFixtureSummary(slug) {
  const story = stories.find((item) => item.slug === slug);
  if (!story) return;
  const category = categories.find((item) => item.slug === story.categorySlug) || {};
  const input = normalizeCreatorStoryInput(story, category);
  const scenePlan = buildCreatorScenePlan(input);
  stats.fixtureSummaries.push({
    slug,
    total: input.factRecords.length,
    typeCounts: countByType(input.factRecords),
    problem: input.coreProblem,
    eventSequence: input.eventSequence,
    turningPoint: input.turningPoint,
    outcome: input.outcome,
    variant: input.reportedVariants,
    sourceContext: input.sourceContext,
    meaning: input.meaningOptions,
    removedFragments: (input.warnings || []).filter((item) => /incomplete fact fragment/i.test(item)),
    removedInternal: (input.warnings || []).filter((item) => /internal instruction fact/i.test(item)),
    duplicateWarnings: (input.warnings || []).filter((item) => /duplicate fact/i.test(item)),
    sceneSourceFactIds: scenePlan.scenes.map((scene) => ({
      sceneIndex: scene.sceneIndex,
      sourceFactIds: scene.sourceFactIds,
      partSourceFactIds: scene.narrationParts.map((part) => part.sourceFactIds)
    }))
  });
}

function collectRemovalStats(input) {
  for (const warning of input.warnings || []) {
    const internal = warning.match(/Removed (\d+) internal instruction fact candidate/);
    const fragment = warning.match(/Removed (\d+) incomplete fact fragment candidate/);
    const duplicate = warning.match(/Merged (\d+) duplicate fact candidate/);
    if (internal) stats.removedInternalInstruction += Number(internal[1]);
    if (fragment) stats.removedFragment += Number(fragment[1]);
    if (duplicate) stats.removedDuplicate += Number(duplicate[1]);
  }
}

function addContentTypeFailure(contentType) {
  stats.contentTypeFailures[contentType || 'unknown'] = (stats.contentTypeFailures[contentType || 'unknown'] || 0) + 1;
}

function snapshotProtectedFiles() {
  return new Map(protectedFiles.filter(fs.existsSync).map((filePath) => [filePath, hashFile(filePath)]));
}

function assertProtectedFilesUnchanged(beforeHashes) {
  for (const [filePath, beforeHash] of beforeHashes.entries()) {
    const afterHash = hashFile(filePath);
    if (beforeHash !== afterHash) fail({ slug: 'protected-files', errorType: 'file-changed', message: path.relative(root, filePath) });
  }
}

function report() {
  console.log('Creator Library fact validation:');
  console.log(`- packs scanned: ${stats.packs}`);
  console.log(`- fact validation passed: ${stats.factValidationPassed}`);
  console.log(`- fact validation failed: ${stats.factValidationFailed}`);
  console.log(`- scene plan passed: ${stats.scenePlanPassed}`);
  console.log(`- scene plan failed: ${stats.scenePlanFailed}`);
  console.log(`- total fact records: ${stats.totalFacts}`);
  console.log(`- factType counts: ${JSON.stringify(stats.typeCounts)}`);
  console.log(`- removed internal instruction candidates: ${stats.removedInternalInstruction}`);
  console.log(`- removed fragment candidates: ${stats.removedFragment}`);
  console.log(`- removed duplicate candidates: ${stats.removedDuplicate}`);
  console.log(`- internal instruction facts: ${stats.internalInstructionFacts}`);
  console.log(`- fragment facts: ${stats.fragmentFacts}`);
  console.log(`- sourceFactId errors: ${stats.sourceFactIdErrors}`);
  console.log(`- missingFactType counts: ${JSON.stringify(stats.missingFactTypes)}`);
  console.log(`- contentType failure counts: ${JSON.stringify(stats.contentTypeFailures)}`);
  console.log('- fixture summaries:');
  stats.fixtureSummaries.forEach((summary) => {
    console.log(`  - ${summary.slug}: total=${summary.total}; types=${JSON.stringify(summary.typeCounts)}; sceneFactIds=${JSON.stringify(summary.sceneSourceFactIds)}`);
  });
  if (failures.length) {
    failures.slice(0, 40).forEach((failure) => {
      console.error(`${failure.slug}: ${failure.errorType}; factId=${failure.factId || ''}; factType=${failure.factType || ''}; factText=${failure.factText || ''}; rawText=${failure.rawText || ''}; sourceRefs=${(failure.sourceRefs || []).join('|')}; ${failure.message || ''}`);
    });
    console.error(`Creator Library fact validation failed: ${failures.length} issue(s).`);
  } else {
    console.log('Creator Library fact validation passed.');
  }
}

function listHtmlFiles(startDir) {
  const output = [];
  walk(startDir, output, (filePath) => filePath.endsWith('.html'));
  return output;
}

function listDistFiles(startDir) {
  const output = [];
  if (!fs.existsSync(startDir)) return output;
  walk(startDir, output, () => true);
  return output;
}

function walk(dir, output, predicate) {
  const basename = path.basename(dir);
  if (basename === '.git' || basename === 'node_modules') return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath, output, predicate);
    else if (entry.isFile() && predicate(fullPath)) output.push(fullPath);
  }
}

function countByType(records) {
  return (records || []).reduce((counts, record) => {
    counts[record.factType] = (counts[record.factType] || 0) + 1;
    return counts;
  }, {});
}

function normalizeComparable(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fail(detail) {
  failures.push(detail);
}

function unique(values) {
  return [...new Set(values)];
}
