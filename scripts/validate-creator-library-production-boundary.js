const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  normalizeCreatorStoryInput
} = require('./creator-library-input');
const {
  buildCreatorScenePlan
} = require('./creator-library-scene-plan');
const {
  buildCreatorLongform
} = require('./creator-library-longform');
const {
  buildCreatorProductionFields,
  validateCreatorProductionFields,
  containsInternalProductionMetadata
} = require('./creator-library-production');

const root = path.resolve(__dirname, '..');
const stories = readJson(path.join(root, 'data', 'stories.json'));
const scripts = readJson(path.join(root, 'data', 'scripts.json'));
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
  ...listHtmlFiles(root)
];

const stats = {
  packsScanned: 0,
  generated: 0,
  blockedBySourceFacts: 0,
  otherBlocked: 0,
  creatorNotesChecked: 0,
  sceneFocusesChecked: 0,
  imagePromptsChecked: 0,
  motionsChecked: 0,
  internalMetadataLeaks: 0,
  rolePurposeLeaks: 0,
  fixtureGenerated: 0
};

const failures = [];
const blocked = [];

main();

function main() {
  const beforeHashes = snapshotProtectedFiles();
  assertProductionBoundarySource();

  for (const slug of fixtureSlugs) {
    validateSlug(slug, true);
  }

  const packStorySlugs = unique(scripts.map((script) => script.originalStorySlug).filter(Boolean));
  for (const slug of packStorySlugs) {
    validateSlug(slug, false);
  }

  assertProtectedFilesUnchanged(beforeHashes);
  report();
  if (failures.length) process.exit(1);
}

function validateSlug(slug, isFixture) {
  const story = stories.find((item) => item.slug === slug);
  if (!story) return fail(slug, 'missing story');
  const category = categories.find((item) => item.slug === story.categorySlug) || {};
  stats.packsScanned += isFixture ? 0 : 1;

  try {
    const normalizedInput = normalizeCreatorStoryInput(story, category);
    const scenePlan = buildCreatorScenePlan(normalizedInput);
    const longformResult = buildCreatorLongform(normalizedInput, scenePlan);
    const productionResult = buildCreatorProductionFields(normalizedInput, scenePlan, longformResult);
    const validation = validateCreatorProductionFields(productionResult, scenePlan, longformResult);
    if (!validation.valid) {
      return fail(slug, `production validation failed: ${formatErrors(validation.errors)}`);
    }
    assertProductionBoundary(slug, productionResult);
    if (isFixture) stats.fixtureGenerated += 1;
    else stats.generated += 1;
  } catch (error) {
    const errors = Array.isArray(error.errors) ? error.errors.map(formatErrorObject) : [String(error.message || error)];
    if (error.stage === 'scenePlan' || error.code === 'CREATOR_SCENE_PLAN_INVALID' || errors.some((item) => /no usable source fact|has no source fact/i.test(item))) {
      if (!isFixture) stats.blockedBySourceFacts += 1;
      blocked.push({ slug, stage: error.stage || 'scenePlan', errors: errors.slice(0, 5) });
      return;
    }
    if (!isFixture) stats.otherBlocked += 1;
    fail(slug, `${error.stage || error.code || 'dry-run'} failed: ${errors.slice(0, 5).join('; ')}`);
  }
}

function assertProductionBoundary(slug, productionResult) {
  (productionResult.scenes || []).forEach((scene) => {
    stats.sceneFocusesChecked += 1;
    assertPublicField(slug, 'sceneFocus', scene.sceneIndex, 0, 0, scene.sceneFocus);
    (scene.narrationParts || []).forEach((part) => {
      stats.creatorNotesChecked += 1;
      assertPublicField(slug, 'creatorNote', scene.sceneIndex, part.partIndex, 0, part.creatorNote);
      (part.visualBeats || []).forEach((beat) => {
        stats.imagePromptsChecked += 1;
        stats.motionsChecked += 1;
        assertPublicField(slug, 'imagePrompt', scene.sceneIndex, part.partIndex, beat.beatIndex, beat.imagePrompt);
        assertPublicField(slug, 'beatMotion', scene.sceneIndex, part.partIndex, beat.beatIndex, beat.beatMotion);
      });
    });
  });
}

function assertPublicField(slug, field, sceneIndex, partIndex, beatIndex, value) {
  if (containsInternalProductionMetadata(value)) {
    stats.internalMetadataLeaks += 1;
    fail(slug, `${field} ${sceneIndex}/${partIndex}/${beatIndex} contains internal metadata: ${value}`);
  }
  if (/\b(?:role|purpose)\s*:/i.test(String(value || ''))) {
    stats.rolePurposeLeaks += 1;
    fail(slug, `${field} ${sceneIndex}/${partIndex}/${beatIndex} contains raw role/purpose label: ${value}`);
  }
}

function assertProductionBoundarySource() {
  const source = readText(path.join(root, 'scripts', 'creator-library-production.js'));
  const forbiddenFragments = [
    'needs this part to preserve ${purpose',
    '${context.scene.role}: keep the visual work centered',
    'emphasizing ${purpose',
    'partPlan.purpose, beatFact',
    'partPlan.purpose || scene.purpose'
  ];
  for (const fragment of forbiddenFragments) {
    if (source.includes(fragment)) fail('creator-library-production', `forbidden source fragment remains: ${fragment}`);
  }
  for (const functionName of [
    'publicSceneContextFromScene',
    'publicPartContextFromPlan',
    'containsInternalProductionMetadata'
  ]) {
    if (!source.includes(`function ${functionName}`)) fail('creator-library-production', `missing boundary helper: ${functionName}`);
  }
}

function snapshotProtectedFiles() {
  return new Map(protectedFiles.map((filePath) => [filePath, hashFile(filePath)]));
}

function assertProtectedFilesUnchanged(beforeHashes) {
  for (const [filePath, beforeHash] of beforeHashes.entries()) {
    const afterHash = hashFile(filePath);
    if (afterHash !== beforeHash) fail('protected-files', `${path.relative(root, filePath)} changed during boundary validation`);
  }
}

function listHtmlFiles(startDir) {
  const output = [];
  walk(startDir, output);
  return output;
}

function walk(dir, output) {
  const basename = path.basename(dir);
  if (basename === '.git' || basename === 'node_modules') return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath, output);
    else if (entry.isFile() && entry.name.endsWith('.html')) output.push(fullPath);
  }
}

function report() {
  console.log('Production boundary validation:');
  console.log(`- packs scanned: ${stats.packsScanned}`);
  console.log(`- fixture dry-runs generated: ${stats.fixtureGenerated}/${fixtureSlugs.length}`);
  console.log(`- generated: ${stats.generated}`);
  console.log(`- blocked by source facts: ${stats.blockedBySourceFacts}`);
  console.log(`- blocked by other errors: ${stats.otherBlocked}`);
  console.log(`- creator notes checked: ${stats.creatorNotesChecked}`);
  console.log(`- scene focuses checked: ${stats.sceneFocusesChecked}`);
  console.log(`- image prompts checked: ${stats.imagePromptsChecked}`);
  console.log(`- motions checked: ${stats.motionsChecked}`);
  console.log(`- internal metadata leaks: ${stats.internalMetadataLeaks}`);
  console.log(`- role/purpose public leaks: ${stats.rolePurposeLeaks}`);
  if (blocked.length) {
    console.log('- source fact blocked examples:');
    blocked.slice(0, 10).forEach((item) => {
      console.log(`  - ${item.slug}: ${item.errors.join('; ')}`);
    });
  }
  if (failures.length) {
    failures.slice(0, 30).forEach((item) => console.error(`${item.slug}: ${item.message}`));
    console.error(`Creator Library Production boundary validation failed: ${failures.length} issue(s).`);
  } else {
    console.log('Creator Library Production boundary validation passed.');
  }
}

function formatErrors(errors) {
  return errors.map((error) => `${error.sceneIndex || 0}/${error.partIndex || 0}/${error.beatIndex || 0} ${error.field}: ${error.error}`).join('; ');
}

function formatErrorObject(error) {
  if (!error || typeof error !== 'object') return String(error);
  if (error.field || error.error) {
    return `${error.sceneIndex || 0}/${error.partIndex || 0}/${error.beatIndex || 0} ${error.field || 'field'}: ${error.error || ''}`;
  }
  return JSON.stringify(error);
}

function unique(values) {
  return [...new Set(values)];
}

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function fail(slug, message) {
  failures.push({ slug, message });
}
