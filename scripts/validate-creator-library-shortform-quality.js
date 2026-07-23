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
  estimateShortformReadTime,
  detectBrokenShortformText,
  detectGenericShortformText,
  detectInternalShortformMetadata,
  detectShortformFactlessScene,
  validateShortformNarrationScene,
  validateShortformSceneFocus
} = require('./creator-library-shortform');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const scriptsPath = path.join(root, 'data', 'scripts.json');
const categoriesPath = path.join(root, 'data', 'categories.json');
const stories = readJson(storiesPath);
const scripts = readJson(scriptsPath);
const categories = readJson(categoriesPath);

const fixtureSlugs = [
  'maui-slows-the-sun-myth',
  'demeter-and-persephone-myth',
  'osiris-isis-resurrection-myth',
  'cicada-3301-internet-puzzle',
  'why-names-have-power-in-legends'
];

const requiredContentTypes = [
  'myth-narrative',
  'folklore-legend',
  'mythical-being-object',
  'urban-modern-legend',
  'internet-folklore',
  'place-event-mystery',
  'origin-comparison'
];

const stats = {
  totalPacks: scripts.length,
  generated: 0,
  failed: 0,
  scenesChecked: 0,
  internalMetadataErrors: 0,
  brokenSentenceErrors: 0,
  genericPaddingErrors: 0,
  factlessSceneErrors: 0,
  duplicateNarrationErrors: 0,
  duplicateFocusErrors: 0,
  runtimeErrors: 0,
  entityLeakErrors: 0,
  imagePromptFocusMismatchErrors: 0,
  longformCopyErrors: 0
};

const failures = [];
const fixtureResults = [];
const contentTypeResults = new Map();
const narrationRepeats = new Map();
const focusRepeats = new Map();

function main() {
  const protectedHashes = snapshotProtectedFiles();
  const storyBySlug = new Map(stories.map((story) => [story.slug, story]));
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
  const fixtureKnownNames = collectFixtureKnownNames(storyBySlug);

  scripts.forEach((script, index) => {
    if (index > 0 && index % 50 === 0) console.log(`dryRunProgress=${index}/${scripts.length}`);
    const story = storyBySlug.get(script.originalStorySlug);
    if (!story) {
      addFailure(script.slug, 'missing-story', `Missing source story: ${script.originalStorySlug}`);
      return;
    }
    const category = categoryBySlug.get(story.categorySlug) || {};
    const result = dryRunShortform(story, category, fixtureKnownNames);
    if (!result) return;
    stats.generated += 1;
    inspectPack(result.normalizedInput, result.scenePlan, result.longformResult, result.productionResult, result.shortformResult);
    collectRepeatValues(result.shortformResult, narrationRepeats, 'narration');
    collectRepeatValues(result.shortformResult, focusRepeats, 'sceneFocus');
    if (fixtureSlugs.includes(story.slug)) {
      fixtureResults.push(summaryForPack(story.slug, result.normalizedInput, result.shortformResult));
    }
    if (!contentTypeResults.has(result.normalizedInput.contentType)) {
      contentTypeResults.set(result.normalizedInput.contentType, summaryForPack(story.slug, result.normalizedInput, result.shortformResult));
    }
  });

  for (const slug of fixtureSlugs) {
    if (fixtureResults.some((item) => item.slug === slug)) continue;
    const story = storyBySlug.get(slug);
    if (!story) {
      addFailure(slug, 'fixture', 'Missing fixture story.');
      continue;
    }
    const result = dryRunShortform(story, categoryBySlug.get(story.categorySlug) || {}, fixtureKnownNames);
    if (result) fixtureResults.push(summaryForPack(story.slug, result.normalizedInput, result.shortformResult));
  }

  for (const type of requiredContentTypes) {
    if (!contentTypeResults.has(type)) addFailure('content-type', 'missing-content-type', `Missing dry-run representative: ${type}`);
  }

  inspectRepeatMap(narrationRepeats, 'narration');
  inspectRepeatMap(focusRepeats, 'sceneFocus');
  assertProtectedFilesUnchanged(protectedHashes);
  printReport();
  if (failures.length) {
    console.error(`Creator Library Short-form quality validation failed: ${failures.length} issue(s).`);
    for (const failure of failures.slice(0, 60)) {
      console.error(`${failure.slug} [${failure.field}] ${failure.message}`);
    }
    process.exit(1);
  }
  console.log('Creator Library Short-form quality validation passed.');
}

function dryRunShortform(story, category, fixtureKnownNames) {
  try {
    const normalizedInput = normalizeCreatorStoryInput(story, category);
    normalizedInput.__fixtureKnownNames = fixtureKnownNames.get(story.slug) || [];
    const scenePlan = buildCreatorScenePlan(normalizedInput);
    const longformResult = buildCreatorLongform(normalizedInput, scenePlan);
    const productionResult = buildCreatorProductionFields(normalizedInput, scenePlan, longformResult);
    const shortformResult = buildCreatorShortform(normalizedInput, scenePlan, longformResult, productionResult);
    const validation = validateCreatorShortform(shortformResult, normalizedInput, { scenePlan, longformResult, productionResult });
    if (!validation.valid) {
      for (const error of validation.errors) addFailure(story.slug, error.field, error.error);
      return null;
    }
    return { normalizedInput, scenePlan, longformResult, productionResult, shortformResult };
  } catch (error) {
    stats.failed += 1;
    const details = error.errors?.map((item) => `${item.field}: ${item.error}`).join('; ') || error.message;
    addFailure(story.slug, 'build', details);
    return null;
  }
}

function inspectPack(normalizedInput, scenePlan, longformResult, productionResult, shortformResult) {
  const narrationKeys = new Set();
  const focusKeys = new Set();
  const totalText = shortformResult.scenes.map((scene) => scene.narration).join(' ');
  const totalWords = countWords(totalText);
  const readSeconds = estimateShortformReadTime(totalText);
  if (totalWords < 80 || totalWords > 140 || readSeconds < 30 || readSeconds > 60 || shortformResult.finalVideoSeconds < readSeconds) {
    stats.runtimeErrors += 1;
    addFailure(shortformResult.slug, 'runtime', `Short-form runtime outside target: ${totalWords} words, ${readSeconds} sec`);
  }
  shortformResult.scenes.forEach((scene, index) => {
    stats.scenesChecked += 1;
    const sceneNumber = index + 1;
    const narrationValidation = validateShortformNarrationScene(scene, { normalizedInput, sceneNumber });
    const focusValidation = validateShortformSceneFocus(scene, { normalizedInput, sceneNumber });
    for (const message of narrationValidation) addCategorizedFailure(shortformResult.slug, sceneNumber, 'narration', message);
    for (const message of focusValidation) addCategorizedFailure(shortformResult.slug, sceneNumber, 'sceneFocus', message);
    if (detectBrokenShortformText(scene.narration).length || detectBrokenShortformText(scene.sceneFocus).length) stats.brokenSentenceErrors += 1;
    if (detectGenericShortformText(scene.narration).length || detectGenericShortformText(scene.sceneFocus).length) stats.genericPaddingErrors += 1;
    if (detectInternalShortformMetadata(scene.narration).length || detectInternalShortformMetadata(scene.sceneFocus).length) stats.internalMetadataErrors += 1;
    if (detectShortformFactlessScene(scene, 'narration') || detectShortformFactlessScene(scene, 'sceneFocus')) stats.factlessSceneErrors += 1;
    if (hasLongformCopy(scene.narration, longformResult)) {
      stats.longformCopyErrors += 1;
      addFailure(shortformResult.slug, 'narration', `Scene ${sceneNumber} copies Long-form text too closely.`);
    }
    if (containsOtherFixtureEntity(scene.narration, normalizedInput) || containsOtherFixtureEntity(scene.sceneFocus, normalizedInput)) {
      stats.entityLeakErrors += 1;
      addFailure(shortformResult.slug, 'entityLeakage', `Scene ${sceneNumber} contains another fixture entity.`);
    }
    if (!imagePromptMatchesFocus(scene)) {
      stats.imagePromptFocusMismatchErrors += 1;
      addFailure(shortformResult.slug, 'imagePrompt', `Scene ${sceneNumber} image prompt does not share specific terms with Scene Focus.`);
    }
    const narrationKey = exactTextKey(scene.narration);
    const focusKey = exactTextKey(scene.sceneFocus);
    if (narrationKeys.has(narrationKey)) {
      stats.duplicateNarrationErrors += 1;
      addFailure(shortformResult.slug, 'narration', `Scene ${sceneNumber} duplicate narration.`);
    }
    if (focusKeys.has(focusKey)) {
      stats.duplicateFocusErrors += 1;
      addFailure(shortformResult.slug, 'sceneFocus', `Scene ${sceneNumber} duplicate focus.`);
    }
    narrationKeys.add(narrationKey);
    focusKeys.add(focusKey);
  });
}

function addCategorizedFailure(slug, sceneNumber, field, message) {
  if (/broken sentence fragments/i.test(message)) stats.brokenSentenceErrors += 1;
  if (/generic padding/i.test(message)) stats.genericPaddingErrors += 1;
  if (/internal metadata/i.test(message)) stats.internalMetadataErrors += 1;
  if (/not grounded/i.test(message)) stats.factlessSceneErrors += 1;
  if (/another fixture subject/i.test(message)) stats.entityLeakErrors += 1;
  addFailure(slug, field, `Scene ${sceneNumber}: ${message}`);
}

function imagePromptMatchesFocus(scene) {
  return tokenOverlap(scene.imagePrompt, scene.sceneFocus) >= 1
    || (scene.usedFactTexts || []).some((fact) => tokenOverlap(scene.imagePrompt, fact) >= 2 && tokenOverlap(scene.sceneFocus, fact) >= 1);
}

function collectRepeatValues(shortformResult, map, field) {
  for (const scene of shortformResult.scenes) {
    const key = exactTextKey(scene[field]);
    if (!key) continue;
    const entry = map.get(key) || { value: scene[field], packs: new Set(), count: 0 };
    entry.packs.add(shortformResult.slug);
    entry.count += 1;
    map.set(key, entry);
  }
}

function inspectRepeatMap(map, field) {
  for (const entry of map.values()) {
    if (entry.packs.size >= 5) {
      addFailure('repeat-audit', field, `Repeated in ${entry.packs.size} packs: ${entry.value}`);
    }
  }
}

function repeatSummary(map) {
  const entries = [...map.values()].sort((a, b) => b.packs.size - a.packs.size);
  return {
    repeated2Plus: entries.filter((entry) => entry.packs.size >= 2).length,
    repeated5Plus: entries.filter((entry) => entry.packs.size >= 5).length,
    repeated20Plus: entries.filter((entry) => entry.packs.size >= 20).length,
    top: entries.slice(0, 10).map((entry) => `${entry.packs.size} packs: ${entry.value}`)
  };
}

function summaryForPack(slug, normalizedInput, shortformResult) {
  return {
    slug,
    contentType: normalizedInput.contentType,
    scenes: shortformResult.scenes.length,
    words: shortformResult.totalWordCount,
    readSeconds: shortformResult.narrationReadSeconds,
    finalSeconds: shortformResult.finalVideoSeconds
  };
}

function collectFixtureKnownNames(storyBySlug) {
  const fixtureStories = fixtureSlugs.map((slug) => storyBySlug.get(slug)).filter(Boolean);
  return new Map(fixtureStories.map((story) => {
    const otherNames = fixtureStories
      .filter((item) => item.slug !== story.slug)
      .flatMap((item) => [
        item.storyBrief?.topic,
        ...(item.storyBrief?.knownNames || []),
        ...(item.storyBrief?.keyActors || [])
      ])
      .map((value) => String(value || '').toLowerCase().trim())
      .filter((value) => value.length > 3 && !/myth|story|legend|source|tradition|digital|name/.test(value));
    return [story.slug, otherNames];
  }));
}

function containsOtherFixtureEntity(value, normalizedInput) {
  const knownNames = normalizedInput?.__fixtureKnownNames || [];
  const text = ` ${String(value || '').toLowerCase()} `;
  return knownNames.some((name) => text.includes(` ${name} `));
}

function hasLongformCopy(narration, longformResult) {
  const key = exactTextKey(narration);
  return (longformResult?.scenes || [])
    .flatMap((scene) => scene.narrationParts || [])
    .flatMap((part) => splitSentences(part.narration || ''))
    .some((sentence) => exactTextKey(sentence) === key);
}

function splitSentences(value) {
  return String(value || '').split(/(?<=[.!?])\s+/).map((item) => item.trim()).filter(Boolean);
}

function tokenOverlap(value, text) {
  const target = new Set(tokens(text));
  return tokens(value).filter((word) => target.has(word)).length;
}

function tokens(value) {
  return String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2)
    .filter((word) => !STOPWORDS.has(word));
}

function countWords(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

function exactTextKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function snapshotProtectedFiles() {
  const files = [
    storiesPath,
    scriptsPath,
    categoriesPath,
    path.join(root, 'scripts', 'creator-library-input.js'),
    path.join(root, 'scripts', 'creator-library-scene-plan.js'),
    path.join(root, 'scripts', 'creator-library-longform.js'),
    path.join(root, 'scripts', 'creator-library-production.js'),
    path.join(root, 'scripts', 'creator-library-pipeline.js'),
    path.join(root, 'scripts', 'creator-library-store.js'),
    path.join(root, 'scripts', 'creator-library.js'),
    path.join(root, 'scripts', 'generate-site.js')
  ].filter((filePath) => fs.existsSync(filePath));
  return new Map(files.map((filePath) => [filePath, hashFile(filePath)]));
}

function assertProtectedFilesUnchanged(beforeHashes) {
  for (const [filePath, beforeHash] of beforeHashes.entries()) {
    const afterHash = hashFile(filePath);
    if (afterHash !== beforeHash) addFailure('protected-files', 'dry-run', `${path.relative(root, filePath)} changed during validation.`);
  }
}

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function addFailure(slug, field, message) {
  failures.push({ slug, field, message });
}

function printReport() {
  const narrationRepeatSummary = repeatSummary(narrationRepeats);
  const focusRepeatSummary = repeatSummary(focusRepeats);
  console.log(`totalPacks=${stats.totalPacks}`);
  console.log(`generated=${stats.generated}`);
  console.log(`failed=${stats.failed}`);
  console.log(`scenesChecked=${stats.scenesChecked}`);
  console.log(`internalMetadataErrors=${stats.internalMetadataErrors}`);
  console.log(`brokenSentenceErrors=${stats.brokenSentenceErrors}`);
  console.log(`genericPaddingErrors=${stats.genericPaddingErrors}`);
  console.log(`factlessSceneErrors=${stats.factlessSceneErrors}`);
  console.log(`duplicateNarrationErrors=${stats.duplicateNarrationErrors}`);
  console.log(`duplicateFocusErrors=${stats.duplicateFocusErrors}`);
  console.log(`runtimeErrors=${stats.runtimeErrors}`);
  console.log(`entityLeakErrors=${stats.entityLeakErrors}`);
  console.log(`imagePromptFocusMismatchErrors=${stats.imagePromptFocusMismatchErrors}`);
  console.log(`longformCopyErrors=${stats.longformCopyErrors}`);
  console.log(`fixtureResults=${JSON.stringify(fixtureResults)}`);
  console.log(`contentTypeResults=${JSON.stringify([...contentTypeResults.values()])}`);
  console.log(`narrationRepeats=${JSON.stringify(narrationRepeatSummary)}`);
  console.log(`focusRepeats=${JSON.stringify(focusRepeatSummary)}`);
}

const STOPWORDS = new Set([
  'about',
  'after',
  'again',
  'also',
  'because',
  'before',
  'being',
  'between',
  'could',
  'detail',
  'different',
  'does',
  'during',
  'every',
  'from',
  'have',
  'into',
  'keeps',
  'later',
  'leaves',
  'like',
  'many',
  'more',
  'only',
  'over',
  'scene',
  'some',
  'still',
  'story',
  'that',
  'their',
  'there',
  'these',
  'this',
  'through',
  'under',
  'version',
  'versions',
  'when',
  'where',
  'which',
  'while',
  'with',
  'without'
]);

main();
