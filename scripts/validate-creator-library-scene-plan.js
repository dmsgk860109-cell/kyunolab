const fs = require('fs');
const path = require('path');
const {
  normalizeCreatorStoryInput
} = require('./creator-library-input');
const {
  buildCreatorScenePlan,
  validateCreatorScenePlan,
  sceneRulesForContentType
} = require('./creator-library-scene-plan');
const {
  buildCreatorLongform,
  validateCreatorLongform,
  detectNarrationMetaLanguage
} = require('./creator-library-longform');
const {
  buildCreatorLibraryEntry
} = require('./add-latest-archive-to-creator-library-2026-07-20');

const root = path.resolve(__dirname, '..');
const stories = readJson(path.join(root, 'data', 'stories.json'));
const categories = readJson(path.join(root, 'data', 'categories.json'));

const targetStorySlugs = [
  'maui-slows-the-sun-myth',
  'demeter-and-persephone-myth',
  'osiris-isis-resurrection-myth',
  'cicada-3301-internet-puzzle'
];

let failures = 0;
const summaries = [];

main();

function main() {
  assertOfficialRouteSource();
  const extraSlug = selectAdditionalDryRunSlug();
  const slugs = [...targetStorySlugs, extraSlug].filter(Boolean);
  for (const slug of slugs) validateDryRun(slug, !targetStorySlugs.includes(slug));
  report();
}

function validateDryRun(slug, isAdditional) {
  const story = stories.find((item) => item.slug === slug);
  if (!story) return fail(slug, 'missing dry-run story');
  const category = categories.find((item) => item.slug === story.categorySlug) || {};
  const normalizedInput = normalizeCreatorStoryInput(story, category);
  const scenePlan = buildCreatorScenePlan(normalizedInput);
  const sceneValidation = validateCreatorScenePlan(scenePlan);
  if (!sceneValidation.valid) fail(slug, `Scene Plan validation failed: ${sceneValidation.errors.join('; ')}`);
  const longformResult = buildCreatorLongform(normalizedInput, scenePlan);
  const longformValidation = validateCreatorLongform(longformResult, scenePlan);
  if (!longformValidation.valid) fail(slug, `Long-form validation failed: ${longformValidation.errors.join('; ')}`);
  const script = buildCreatorLibraryEntry(story, category, { normalizedInput, scenePlan, longformResult });

  assertScenePlanSchema(slug, normalizedInput, scenePlan);
  assertLongformSchema(slug, scenePlan, longformResult);
  assertNoMetaLanguage(slug, longformResult);
  assertNoKnownNameLeakage(slug, longformResult);
  assertNoLegacyOfficialRoute(slug, script);

  summaries.push({
    slug,
    marker: isAdditional ? 'additional' : 'fixture',
    contentType: normalizedInput.contentType,
    scenes: scenePlan.scenes.length,
    parts: longformResult.scenes.flatMap((scene) => scene.narrationParts).length,
    words: longformResult.totalWordCount,
    readSeconds: longformResult.narrationReadSeconds,
    finalSeconds: longformResult.targetFinalVideoSeconds
  });
}

function assertScenePlanSchema(slug, normalizedInput, scenePlan) {
  const rules = sceneRulesForContentType(normalizedInput.contentType);
  if (scenePlan.schemaVersion !== '1.0') fail(slug, 'Scene Plan schemaVersion must be 1.0');
  if (scenePlan.inputSchemaVersion !== normalizedInput.schemaVersion) fail(slug, 'inputSchemaVersion mismatch');
  if (scenePlan.runtimeTier !== 'standard') fail(slug, 'runtimeTier must be standard');
  if (scenePlan.scenes.length !== 5) fail(slug, 'Scene count must be 5');
  scenePlan.scenes.forEach((scene, index) => {
    if (scene.role !== rules[index]?.role) fail(slug, `Scene ${index + 1} role does not match content type rule`);
    if (scene.narrationParts.length !== 2) fail(slug, `Scene ${index + 1} part count must be 2`);
    if (!scene.sourceFacts.length) fail(slug, `Scene ${index + 1} has no source facts`);
    if (!scene.sourceFieldRefs.length) fail(slug, `Scene ${index + 1} has no source refs`);
    scene.narrationParts.forEach((part) => {
      if (!part.sourceFacts.length) fail(slug, `Scene ${index + 1} Part ${part.partIndex} has no source facts`);
      if (part.targetWords < 55 || part.targetWords > 80) fail(slug, `Scene ${index + 1} Part ${part.partIndex} targetWords outside range`);
    });
  });
}

function assertLongformSchema(slug, scenePlan, longformResult) {
  if (longformResult.scenes.length !== 5) fail(slug, 'Long-form scene count must be 5');
  const parts = longformResult.scenes.flatMap((scene) => scene.narrationParts);
  if (parts.length !== 10) fail(slug, 'Long-form part count must be 10');
  if (longformResult.totalWordCount < 620 || longformResult.totalWordCount > 760) fail(slug, `word count outside range: ${longformResult.totalWordCount}`);
  if (longformResult.narrationReadSeconds < 265 || longformResult.narrationReadSeconds > 325) fail(slug, `read time outside range: ${longformResult.narrationReadSeconds}`);
  if (longformResult.targetFinalVideoSeconds < longformResult.narrationReadSeconds) fail(slug, 'final seconds shorter than read seconds');
  if (longformResult.targetFinalVideoSeconds < 300 || longformResult.targetFinalVideoSeconds > 360) fail(slug, `final seconds outside range: ${longformResult.targetFinalVideoSeconds}`);
  longformResult.scenes.forEach((scene, index) => {
    if (scene.sceneIndex !== scenePlan.scenes[index].sceneIndex) fail(slug, `Long-form Scene ${index + 1} does not match Scene Plan`);
  });
  const duplicate = new Set();
  parts.forEach((part) => {
    const key = part.narration.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    if (duplicate.has(key)) fail(slug, 'duplicate Narration Part detected');
    duplicate.add(key);
  });
}

function assertNoMetaLanguage(slug, longformResult) {
  const packed = longformResult.scenes.flatMap((scene) => scene.narrationParts.map((part) => part.narration));
  packed.forEach((narration, index) => {
    const meta = detectNarrationMetaLanguage(narration);
    if (meta.length) fail(slug, `Narration Part ${index + 1} contains meta language: ${meta.join(', ')}`);
  });
}

function assertNoKnownNameLeakage(slug, longformResult) {
  const packed = longformResult.scenes.flatMap((scene) => scene.narrationParts.map((part) => part.narration)).join(' ').toLowerCase();
  const otherNames = targetStorySlugs
    .filter((targetSlug) => targetSlug !== slug)
    .flatMap((targetSlug) => {
      const story = stories.find((item) => item.slug === targetSlug);
      return story?.storyBrief?.knownNames || [];
    })
    .map((value) => String(value || '').toLowerCase())
    .filter((value) => value.length > 3 && !/myth|story|legend|mystery|digital/.test(value));
  for (const name of otherNames) {
    if (packed.includes(name)) fail(slug, `contains another fixture knownName: ${name}`);
  }
}

function assertNoLegacyOfficialRoute(slug, script) {
  if (!script.longformScript || script.longformScript.length !== 10) fail(slug, 'official script output did not use 10-part longform');
  if (script.longformScript.some((line) => /first image should|viewer should|hold that image|source-aware/i.test(line))) {
    fail(slug, 'official script output contains legacy fallback or meta phrase');
  }
}

function assertOfficialRouteSource() {
  const source = readText(path.join(root, 'scripts', 'add-latest-archive-to-creator-library-2026-07-20.js'));
  const buildStart = source.indexOf('function buildCreatorLibraryEntry');
  const buildEnd = source.indexOf('function validateInputOrThrow');
  const buildBody = source.slice(buildStart, buildEnd);
  for (const needle of [
    'buildCreatorScenePlan',
    'buildCreatorLongform',
    'validateScenePlanOrThrow',
    'validateLongformOrThrow'
  ]) {
    if (!buildBody.includes(needle)) fail('add-latest', `official route missing ${needle}`);
  }
  if (!source.includes('validateCreatorScenePlan(scenePlan)')) fail('add-latest', 'validateCreatorScenePlan wrapper is missing');
  if (!source.includes('validateCreatorLongform(longformResult, scenePlan)')) fail('add-latest', 'validateCreatorLongform wrapper is missing');
  for (const forbidden of [
    'buildLongformScript(',
    'longformNarrationFromKnownStory('
  ]) {
    if (buildBody.includes(forbidden)) fail('add-latest', `official route still calls ${forbidden}`);
  }
}

function selectAdditionalDryRunSlug() {
  const found = stories.find((story) => story.contentType === 'story'
    && story.storyBrief
    && !targetStorySlugs.includes(story.slug)
    && story.storyBrief.knownNames?.length
    && story.storyBrief.coreStoryElements?.length
    && story.storyBrief.existenceEvidence?.length);
  return found?.slug || '';
}

function report() {
  summaries.forEach((summary) => {
    console.log(`${summary.slug} (${summary.marker}): contentType=${summary.contentType}; scenes=${summary.scenes}; parts=${summary.parts}; words=${summary.words}; readSeconds=${summary.readSeconds}; finalSeconds=${summary.finalSeconds}`);
  });
  if (failures) {
    console.error(`Creator Library Scene Plan validation failed: ${failures} issue(s).`);
    process.exit(1);
  }
  console.log('Creator Library Scene Plan validation passed.');
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
