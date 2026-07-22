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
  buildCreatorProductionFields
} = require('./creator-library-production');
const {
  buildCreatorShortform,
  validateCreatorShortform,
  shortformRulesForContentType,
  detectShortformMetaLanguage,
  estimateShortformReadTime
} = require('./creator-library-shortform');
const {
  buildCreatorLibraryEntry
} = require('./add-latest-archive-to-creator-library-2026-07-20');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const scriptsPath = path.join(root, 'data', 'scripts.json');
const categoriesPath = path.join(root, 'data', 'categories.json');
const stories = readJson(storiesPath);
const categories = readJson(categoriesPath);

const fixtureSlugs = [
  'maui-slows-the-sun-myth',
  'demeter-and-persephone-myth',
  'osiris-isis-resurrection-myth',
  'cicada-3301-internet-puzzle',
  'why-names-have-power-in-legends'
];

let failures = 0;
const summaries = [];

main();

function main() {
  const beforeHashes = snapshotProtectedFiles();
  assertOfficialRouteSource();
  assertNoNewSubjectSpecificShortformCode();
  for (const slug of fixtureSlugs) validateDryRun(slug);
  assertProtectedFilesUnchanged(beforeHashes);
  report();
}

function validateDryRun(slug) {
  const story = stories.find((item) => item.slug === slug);
  if (!story) return fail(slug, 'missing dry-run story');
  const category = categories.find((item) => item.slug === story.categorySlug) || {};
  const normalizedInput = normalizeCreatorStoryInput(story, category);
  normalizedInput.__fixtureKnownNames = collectFixtureKnownNames(slug);
  const scenePlan = buildCreatorScenePlan(normalizedInput);
  const longformResult = buildCreatorLongform(normalizedInput, scenePlan);
  const productionResult = buildCreatorProductionFields(normalizedInput, scenePlan, longformResult);
  const shortformResult = buildCreatorShortform(normalizedInput, scenePlan, longformResult, productionResult);
  const validation = validateCreatorShortform(shortformResult, normalizedInput, { scenePlan, longformResult, productionResult });
  if (!validation.valid) fail(slug, `Short-form validation failed: ${formatErrors(validation.errors)}`);

  let officialShortformResult = null;
  const script = buildCreatorLibraryEntry(story, category, {
    normalizedInput,
    scenePlan,
    longformResult,
    productionResult,
    onShortformResult: (result) => {
      officialShortformResult = result;
    }
  });

  assertShortformSchema(slug, normalizedInput, scenePlan, shortformResult);
  assertOfficialOutputSync(slug, shortformResult, officialShortformResult, script);
  assertFixtureSpecificRules(slug, shortformResult);

  summaries.push({
    slug,
    contentType: normalizedInput.contentType,
    scenes: shortformResult.scenes.length,
    words: shortformResult.totalWordCount,
    readSeconds: shortformResult.narrationReadSeconds,
    finalSeconds: shortformResult.finalVideoSeconds
  });
}

function assertShortformSchema(slug, normalizedInput, scenePlan, shortformResult) {
  if (shortformResult.schemaVersion !== '1.0') fail(slug, 'Short-form schemaVersion must be 1.0');
  if (shortformResult.inputSchemaVersion !== normalizedInput.schemaVersion) fail(slug, 'inputSchemaVersion mismatch');
  if (shortformResult.scenePlanSchemaVersion !== scenePlan.schemaVersion) fail(slug, 'scenePlanSchemaVersion mismatch');
  if (shortformResult.slug !== normalizedInput.slug) fail(slug, 'slug mismatch');
  if (shortformResult.topic !== normalizedInput.topic) fail(slug, 'topic mismatch');
  if (shortformResult.contentType !== normalizedInput.contentType) fail(slug, 'contentType mismatch');
  if (shortformResult.scenes.length !== 5) fail(slug, 'Short-form scene count must be 5');
  const rules = shortformRulesForContentType(normalizedInput.contentType);
  const narrationSet = new Set();
  const focusSet = new Set();
  const motionSet = new Set();
  shortformResult.scenes.forEach((scene, index) => {
    if (scene.sceneIndex !== index + 1) fail(slug, `Scene ${index + 1} invalid index`);
    if (scene.role !== rules[index]?.role) fail(slug, `Scene ${index + 1} role mismatch`);
    for (const field of ['narration', 'sceneFocus', 'motionPrompt', 'backgroundMusic', 'voiceDirection', 'soundEffect']) {
      if (!scene[field]) fail(slug, `Scene ${index + 1} missing ${field}`);
    }
    if (detectShortformMetaLanguage(scene.narration).length) fail(slug, `Scene ${index + 1} contains meta language`);
    if (scene.wordCount !== countWords(scene.narration)) fail(slug, `Scene ${index + 1} wordCount mismatch`);
    if (scene.estimatedReadSeconds !== estimateShortformReadTime(scene.narration)) fail(slug, `Scene ${index + 1} read time mismatch`);
    if (!Array.isArray(scene.sourceFieldRefs)) fail(slug, `Scene ${index + 1} sourceFieldRefs missing`);
    if (narrationSet.has(key(scene.narration))) fail(slug, `Scene ${index + 1} duplicate narration`);
    if (focusSet.has(key(scene.sceneFocus))) fail(slug, `Scene ${index + 1} duplicate focus`);
    narrationSet.add(key(scene.narration));
    focusSet.add(key(scene.sceneFocus));
    motionSet.add(key(scene.motionPrompt));
    assertVoiceEmphasisMatches(scene.voiceDirection, scene.narration).forEach((message) => fail(slug, `Scene ${index + 1}: ${message}`));
  });
  if (motionSet.size < 2) fail(slug, 'Motion values repeat too much');
  const totalText = shortformResult.scenes.map((scene) => scene.narration).join(' ');
  const totalWords = countWords(totalText);
  const readSeconds = estimateShortformReadTime(totalText);
  if (shortformResult.totalWordCount !== totalWords) fail(slug, 'totalWordCount mismatch');
  if (totalWords < 80 || totalWords > 140) fail(slug, `total words outside range: ${totalWords}`);
  if (shortformResult.narrationReadSeconds !== readSeconds) fail(slug, 'narrationReadSeconds mismatch');
  if (readSeconds < 30 || readSeconds > 60) fail(slug, `read seconds outside range: ${readSeconds}`);
  if (shortformResult.finalVideoSeconds < readSeconds) fail(slug, 'final video shorter than read time');
  if (shortformResult.finalVideoSeconds < 30 || shortformResult.finalVideoSeconds > 60) fail(slug, `final video seconds outside range: ${shortformResult.finalVideoSeconds}`);
}

function assertOfficialOutputSync(slug, shortformResult, officialShortformResult, script) {
  if (!officialShortformResult) fail(slug, 'buildCreatorLibraryEntry did not expose Short-form result');
  if (JSON.stringify(stripDiagnostics(officialShortformResult)) !== JSON.stringify(stripDiagnostics(shortformResult))) {
    fail(slug, 'official route Short-form differs from direct Short-form result');
  }
  const expectedNarration = shortformResult.scenes.map((scene) => scene.narration);
  const expectedFocuses = shortformResult.scenes.map((scene) => scene.sceneFocus);
  if (JSON.stringify(script.shortsScript) !== JSON.stringify(expectedNarration)) fail(slug, 'shortsScript is not derived from shortForm.scenes');
  if (JSON.stringify(script.shortSceneFocuses) !== JSON.stringify(expectedFocuses)) fail(slug, 'shortSceneFocuses is not derived from shortForm.scenes');
  if (!script.shortForm || script.shortForm.scenes?.length !== 5) fail(slug, 'script.shortForm storage object missing');
  const storedMotions = script.shortForm.scenes.map((scene) => scene.motionPrompt);
  const expectedMotions = shortformResult.scenes.map((scene) => scene.motionPrompt);
  if (JSON.stringify(storedMotions) !== JSON.stringify(expectedMotions)) fail(slug, 'shortForm motion values are not synchronized');
  if (script.shortForm.scenes.some((scene) => Object.prototype.hasOwnProperty.call(scene, 'sourceFieldRefs'))) {
    fail(slug, 'stored shortForm must not include diagnostic sourceFieldRefs');
  }
}

function assertFixtureSpecificRules(slug, shortformResult) {
  const text = JSON.stringify(shortformResult).toLowerCase();
  if (slug !== 'cicada-3301-internet-puzzle' && /keyboard|printer|modem|computer fan|fluorescent|office ventilation|screen interaction|electronic pulse|roadway traffic/.test(text)) {
    fail(slug, 'non-digital fixture contains unrelated digital or office production preset');
  }
  if (slug === 'cicada-3301-internet-puzzle' && /dragon|serpent|temple ritual|underworld goddess/.test(text)) {
    fail(slug, 'Cicada contains mythic or dragon preset leakage');
  }
  if (/show the mystery clearly|focus on the main idea|generic mystery/.test(text)) {
    fail(slug, 'generic mystery Short-form language detected');
  }
}

function assertOfficialRouteSource() {
  const source = readText(path.join(root, 'scripts', 'add-latest-archive-to-creator-library-2026-07-20.js'));
  const buildStart = source.indexOf('function buildCreatorLibraryEntry');
  const buildEnd = source.indexOf('function validateInputOrThrow');
  const buildBody = source.slice(buildStart, buildEnd);
  for (const needle of ['buildCreatorShortform', 'validateShortformOrThrow']) {
    if (!buildBody.includes(needle)) fail('add-latest', `official route missing ${needle}`);
  }
  for (const forbidden of [
    'buildShortsScript(',
    'buildShortSceneFocuses(',
    'shortFormProductionPlan(',
    'shortSceneFocusFromLine('
  ]) {
    if (buildBody.includes(forbidden)) fail('add-latest', `official route still calls ${forbidden}`);
  }
}

function assertNoNewSubjectSpecificShortformCode() {
  const source = readText(path.join(root, 'scripts', 'creator-library-shortform.js'));
  for (const forbidden of [
    /maui/i,
    /demeter/i,
    /persephone/i,
    /osiris/i,
    /isis/i,
    /cicada/i,
    /(?:if\s*\([^)]*\b(?:slug|topic)\b[^)]*(?:===|!==|==|!=))|(?:\b(?:slug|topic)\b\s*(?:===|!==|==|!=))/i
  ]) {
    if (forbidden.test(source)) fail('creator-library-shortform', `new Short-form module contains subject-specific or slug/topic branch: ${forbidden}`);
  }
  const buildCount = (source.match(/function\s+buildCreatorShortform\b/g) || []).length;
  const validateCount = (source.match(/function\s+validateCreatorShortform\b/g) || []).length;
  if (buildCount !== 1) fail('creator-library-shortform', `expected one buildCreatorShortform function, found ${buildCount}`);
  if (validateCount !== 1) fail('creator-library-shortform', `expected one validateCreatorShortform function, found ${validateCount}`);
}

function collectFixtureKnownNames(currentSlug) {
  return fixtureSlugs
    .filter((slug) => slug !== currentSlug)
    .flatMap((slug) => {
      const story = stories.find((item) => item.slug === slug);
      return [
        story?.storyBrief?.topic,
        ...(story?.storyBrief?.knownNames || []),
        ...(story?.storyBrief?.keyActors || [])
      ];
    })
    .map((value) => String(value || '').toLowerCase().trim())
    .filter((value) => value.length > 3 && !/myth|story|legend|source|tradition|digital|name/.test(value));
}

function snapshotProtectedFiles() {
  const files = [
    scriptsPath,
    storiesPath,
    categoriesPath,
    ...listGeneratedHtmlFiles()
  ];
  return new Map(files.map((filePath) => [filePath, hashFile(filePath)]));
}

function assertProtectedFilesUnchanged(beforeHashes) {
  for (const [filePath, beforeHash] of beforeHashes.entries()) {
    const afterHash = hashFile(filePath);
    if (afterHash !== beforeHash) fail('protected-files', `${path.relative(root, filePath)} changed during dry-run validation`);
  }
}

function listGeneratedHtmlFiles() {
  const scriptsDir = path.join(root, 'scripts');
  return fs.readdirSync(scriptsDir)
    .filter((name) => name.endsWith('-youtube-script.html'))
    .map((name) => path.join(scriptsDir, name));
}

function stripDiagnostics(result) {
  return {
    ...result,
    warnings: [],
    missingRequiredFields: [],
    scenes: result.scenes.map((scene) => ({
      ...scene,
      sourceFieldRefs: []
    }))
  };
}

function assertVoiceEmphasisMatches(voiceDirection, narration) {
  const errors = [];
  const lowerNarration = String(narration || '').toLowerCase();
  const matches = String(voiceDirection || '').matchAll(/emphasis on "([^"]+)"/gi);
  for (const match of matches) {
    if (!lowerNarration.includes(match[1].toLowerCase())) {
      errors.push(`Voice emphasis term is not present in Narration: ${match[1]}`);
    }
  }
  return errors;
}

function report() {
  summaries.forEach((summary) => {
    console.log(`${summary.slug}: contentType=${summary.contentType}; scenes=${summary.scenes}; words=${summary.words}; readSeconds=${summary.readSeconds}; finalSeconds=${summary.finalSeconds}`);
  });
  if (failures) {
    console.error(`Creator Library Short-form validation failed: ${failures} issue(s).`);
    process.exit(1);
  }
  console.log('Creator Library Short-form validation passed.');
}

function formatErrors(errors) {
  return errors.map((error) => `${error.sceneIndex || 0} ${error.field}: ${error.error}`).join('; ');
}

function countWords(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

function key(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
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
  failures += 1;
  console.error(`${slug}: ${message}`);
}
