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
  buildCreatorLongform,
  validateCreatorLongform,
  detectGenericNarration,
  detectBrokenNarration,
  detectInternalNarrationMetadata
} = require('./creator-library-longform');
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

const requiredContentTypes = [
  'myth-narrative',
  'folklore-legend',
  'mythical-being-object',
  'urban-modern-legend',
  'internet-folklore',
  'place-event-mystery',
  'origin-comparison'
];

const protectedFiles = [
  path.join(root, 'data', 'scripts.json'),
  path.join(root, 'data', 'stories.json'),
  path.join(root, 'data', 'categories.json'),
  path.join(root, 'scripts', 'creator-library-production.js'),
  path.join(root, 'scripts', 'creator-library-shortform.js'),
  path.join(root, 'scripts', 'generate-site.js')
];

const stats = {
  packsScanned: 0,
  generated: 0,
  failed: 0,
  totalParts: 0,
  internalMetadataErrors: 0,
  brokenSentenceErrors: 0,
  genericPaddingErrors: 0,
  duplicatePartErrors: 0,
  factlessPartErrors: 0,
  runtimeErrors: 0,
  entityLeakErrors: 0,
  repeatedAcross2: 0,
  repeatedAcross5: 0,
  repeatedAcross20: 0
};

const failures = [];
const fixtureResults = [];
const contentTypeResults = new Map();
const sentenceFrequency = new Map();
const fixtureEntityCache = buildFixtureEntityCache();

main();

function main() {
  const beforeHashes = snapshotProtectedFiles();
  const slugs = unique(scripts.map((script) => script.originalStorySlug).filter(Boolean));
  const contentTypeRepresentatives = selectContentTypeRepresentatives(slugs);

  for (const slug of fixtureSlugs) validateSlug(slug, 'fixture');
  for (const [contentType, slug] of contentTypeRepresentatives.entries()) validateSlug(slug, 'contentType', contentType);
  for (const slug of slugs) validateSlug(slug, 'all');

  collectRepeatStats();
  assertProtectedFilesUnchanged(beforeHashes);
  report(contentTypeRepresentatives);
  if (failures.length) process.exit(1);
}

function validateSlug(slug, mode, expectedContentType = '') {
  const story = stories.find((item) => item.slug === slug);
  if (!story) return fail({ slug, errorType: 'missing-story', message: 'Story not found.' });
  const category = categories.find((item) => item.slug === story.categorySlug) || categories.find((item) => item.slug === story.category) || {};

  try {
    const normalizedInput = normalizeCreatorStoryInput(story, category);
    const scenePlan = buildCreatorScenePlan(normalizedInput);
    const longformResult = buildCreatorLongform(normalizedInput, scenePlan);
    const validation = validateCreatorLongform(longformResult, scenePlan);
    if (!validation.valid) {
      validation.errors.forEach((message) => fail({ slug, contentType: normalizedInput.contentType, errorType: 'longform-validation', message }));
      return;
    }

    const localErrors = inspectLongform(slug, normalizedInput, scenePlan, longformResult);
    localErrors.forEach(fail);
    if (localErrors.length) return;

    if (mode === 'fixture') fixtureResults.push(resultSummary(slug, normalizedInput, longformResult));
    if (mode === 'contentType') contentTypeResults.set(expectedContentType, resultSummary(slug, normalizedInput, longformResult));
    if (mode === 'all') {
      stats.packsScanned += 1;
      stats.generated += 1;
      stats.totalParts += countParts(longformResult);
      addSentences(slug, longformResult);
    }
  } catch (error) {
    const messages = Array.isArray(error.errors) ? error.errors : [error.message || String(error)];
    messages.forEach((message) => fail({ slug, contentType: expectedContentType, errorType: error.code || 'dry-run', message }));
  }
}

function inspectLongform(slug, normalizedInput, scenePlan, longformResult) {
  const errors = [];
  const fixtureEntitySets = fixtureSlugs.includes(slug) ? fixtureEntityLeakSets(slug) : [];
  const partNarrations = [];
  (longformResult.scenes || []).forEach((scene, sceneIndex) => {
    (scene.narrationParts || []).forEach((part, partIndex) => {
      const label = { slug, contentType: normalizedInput.contentType, sceneIndex: sceneIndex + 1, partIndex: partIndex + 1 };
      partNarrations.push(part.narration);
      if (!Array.isArray(part.sourceFactIds) || !part.sourceFactIds.length) {
        stats.factlessPartErrors += 1;
        errors.push({ ...label, errorType: 'factless-part', message: 'Narration Part has no sourceFactIds.', narration: part.narration });
      }
      if (!Array.isArray(part.usedFactTexts) || !part.usedFactTexts.length) {
        stats.factlessPartErrors += 1;
        errors.push({ ...label, errorType: 'factless-part', message: 'Narration Part has no usedFactTexts.', narration: part.narration });
      }
      const internal = detectInternalNarrationMetadata(part.narration);
      if (internal.length) {
        stats.internalMetadataErrors += 1;
        errors.push({ ...label, errorType: 'internal-metadata', message: internal.join(', '), narration: part.narration, sourceFactIds: part.sourceFactIds, usedFactTexts: part.usedFactTexts });
      }
      const broken = detectBrokenNarration(part.narration);
      if (broken.length) {
        stats.brokenSentenceErrors += 1;
        errors.push({ ...label, errorType: 'broken-narration', message: broken.join(', '), narration: part.narration, sourceFactIds: part.sourceFactIds, usedFactTexts: part.usedFactTexts });
      }
      const generic = detectGenericNarration(part.narration);
      if (generic.length) {
        stats.genericPaddingErrors += 1;
        errors.push({ ...label, errorType: 'generic-padding', message: generic.join(', '), narration: part.narration, sourceFactIds: part.sourceFactIds, usedFactTexts: part.usedFactTexts });
      }
      const leak = detectFixtureEntityLeak(part.narration, fixtureEntitySets);
      if (leak) {
        stats.entityLeakErrors += 1;
        errors.push({ ...label, errorType: 'fixture-entity-leak', message: leak, narration: part.narration });
      }
    });
  });
  if (new Set(partNarrations.map(comparableText)).size !== partNarrations.length) {
    stats.duplicatePartErrors += 1;
    errors.push({ slug, contentType: normalizedInput.contentType, errorType: 'duplicate-part', message: 'Exact duplicate Narration Part detected.' });
  }
  if (longformResult.narrationReadSeconds < 235 || longformResult.narrationReadSeconds > 355 || longformResult.targetFinalVideoSeconds < longformResult.narrationReadSeconds) {
    stats.runtimeErrors += 1;
    errors.push({ slug, contentType: normalizedInput.contentType, errorType: 'runtime', message: `read=${longformResult.narrationReadSeconds}; final=${longformResult.targetFinalVideoSeconds}` });
  }
  if (!scenePlan?.scenes || scenePlan.scenes.length !== 5) {
    errors.push({ slug, contentType: normalizedInput.contentType, errorType: 'structure', message: 'Scene Plan does not contain 5 scenes.' });
  }
  return errors;
}

function selectContentTypeRepresentatives(slugs) {
  const output = new Map();
  for (const slug of slugs) {
    const story = stories.find((item) => item.slug === slug);
    if (!story) continue;
    const category = categories.find((item) => item.slug === story.categorySlug) || {};
    const normalizedInput = normalizeCreatorStoryInput(story, category);
    if (!requiredContentTypes.includes(normalizedInput.contentType)) continue;
    if (!output.has(normalizedInput.contentType)) output.set(normalizedInput.contentType, slug);
  }
  for (const contentType of requiredContentTypes) {
    if (!output.has(contentType)) fail({ slug: 'content-type-representatives', contentType, errorType: 'missing-content-type', message: `No representative found for ${contentType}.` });
  }
  return output;
}

function addSentences(slug, longformResult) {
  const text = (longformResult.scenes || []).flatMap((scene) => scene.narrationParts || []).map((part) => part.narration).join(' ');
  for (const sentence of splitSentences(text)) {
    const key = comparableText(sentence);
    if (!key) continue;
    const entry = sentenceFrequency.get(key) || { sentence, count: 0, slugs: new Set() };
    entry.count += 1;
    entry.slugs.add(slug);
    sentenceFrequency.set(key, entry);
  }
}

function collectRepeatStats() {
  const repeated = [...sentenceFrequency.values()].filter((entry) => entry.slugs.size >= 2);
  stats.repeatedAcross2 = repeated.length;
  stats.repeatedAcross5 = repeated.filter((entry) => entry.slugs.size >= 5).length;
  stats.repeatedAcross20 = repeated.filter((entry) => entry.slugs.size >= 20).length;
}

function fixtureEntityLeakSets(currentSlug) {
  return fixtureEntityCache.filter((item) => item.slug !== currentSlug);
}

function buildFixtureEntityCache() {
  return fixtureSlugs.map((slug) => {
    const story = stories.find((item) => item.slug === slug);
    const category = story ? categories.find((item) => item.slug === story.categorySlug) || {} : {};
    const input = story ? normalizeCreatorStoryInput(story, category) : {};
    return {
      slug,
      names: (input.knownNames || []).filter((name) => name.length > 4 && !/myth|legend|story/i.test(name)).slice(0, 8)
    };
  });
}

function detectFixtureEntityLeak(text, sets) {
  const lower = String(text || '').toLowerCase();
  for (const set of sets) {
    const leaked = set.names.find((name) => lower.includes(name.toLowerCase()));
    if (leaked) return `${leaked} leaked from ${set.slug}`;
  }
  return '';
}

function resultSummary(slug, normalizedInput, longformResult) {
  return {
    slug,
    contentType: normalizedInput.contentType,
    scenes: longformResult.scenes.length,
    parts: countParts(longformResult),
    words: longformResult.totalWordCount,
    readSeconds: longformResult.narrationReadSeconds,
    finalSeconds: longformResult.targetFinalVideoSeconds
  };
}

function report(contentTypeRepresentatives) {
  console.log('Creator Library Long-form quality validation:');
  console.log(`- packs scanned: ${stats.packsScanned}`);
  console.log(`- generated: ${stats.generated}`);
  console.log(`- failed: ${stats.failed}`);
  console.log(`- narration parts checked: ${stats.totalParts}`);
  console.log(`- internal metadata errors: ${stats.internalMetadataErrors}`);
  console.log(`- broken sentence errors: ${stats.brokenSentenceErrors}`);
  console.log(`- generic padding errors: ${stats.genericPaddingErrors}`);
  console.log(`- factless part errors: ${stats.factlessPartErrors}`);
  console.log(`- duplicate part errors: ${stats.duplicatePartErrors}`);
  console.log(`- runtime errors: ${stats.runtimeErrors}`);
  console.log(`- fixture entity leak errors: ${stats.entityLeakErrors}`);
  console.log(`- repeated complete sentences across 2+ packs: ${stats.repeatedAcross2}`);
  console.log(`- repeated complete sentences across 5+ packs: ${stats.repeatedAcross5}`);
  console.log(`- repeated complete sentences across 20+ packs: ${stats.repeatedAcross20}`);
  console.log('- fixture results:');
  fixtureResults.forEach((item) => console.log(`  - ${item.slug}: ${item.words} words; read=${item.readSeconds}; final=${item.finalSeconds}`));
  console.log('- contentType representatives:');
  for (const contentType of requiredContentTypes) {
    const item = contentTypeResults.get(contentType);
    const slug = contentTypeRepresentatives.get(contentType) || 'missing';
    console.log(`  - ${contentType}: ${slug}${item ? `; ${item.words} words; read=${item.readSeconds}; final=${item.finalSeconds}` : ''}`);
  }
  console.log('- top repeated complete sentences:');
  topRepeatedSentences(30).forEach((entry) => console.log(`  - ${entry.slugs.size} packs / ${entry.count} uses: ${entry.sentence}`));
  if (failures.length) {
    failures.slice(0, 30).forEach((item) => {
      console.error(`${item.slug}${item.sceneIndex ? ` S${item.sceneIndex}` : ''}${item.partIndex ? ` P${item.partIndex}` : ''} [${item.errorType}]: ${item.message}`);
      if (item.narration) console.error(`  Narration: ${item.narration}`);
      if (item.sourceFactIds) console.error(`  sourceFactIds: ${item.sourceFactIds.join(', ')}`);
      if (item.usedFactTexts) console.error(`  usedFactTexts: ${item.usedFactTexts.join(' | ')}`);
    });
    console.error(`Creator Library Long-form quality validation failed: ${failures.length} issue(s).`);
  } else {
    console.log('Creator Library Long-form quality validation passed.');
  }
}

function topRepeatedSentences(limit) {
  return [...sentenceFrequency.values()]
    .filter((entry) => entry.slugs.size >= 2)
    .sort((a, b) => b.slugs.size - a.slugs.size || b.count - a.count)
    .slice(0, limit);
}

function snapshotProtectedFiles() {
  return new Map(protectedFiles.filter(fs.existsSync).map((filePath) => [filePath, hashFile(filePath)]));
}

function assertProtectedFilesUnchanged(beforeHashes) {
  for (const [filePath, beforeHash] of beforeHashes.entries()) {
    const afterHash = hashFile(filePath);
    if (afterHash !== beforeHash) fail({ slug: 'protected-files', errorType: 'file-changed', message: `${path.relative(root, filePath)} changed during dry-run.` });
  }
}

function splitSentences(value) {
  return String(value || '').match(/[^.!?]+[.!?]+/g)?.map((item) => item.trim()).filter(Boolean) || [];
}

function comparableText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function countParts(longformResult) {
  return (longformResult.scenes || []).reduce((total, scene) => total + (scene.narrationParts || []).length, 0);
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

function fail(item) {
  stats.failed += 1;
  failures.push(item);
}
