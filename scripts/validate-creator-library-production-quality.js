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
  detectBrokenProductionText,
  detectGenericProductionText,
  detectInternalProductionMetadata,
  detectProductionFactLeak,
  detectDuplicateProductionFields
} = require('./creator-library-production');

const root = path.resolve(__dirname, '..');
const stories = readJson(path.join(root, 'data', 'stories.json'));
const scripts = readJson(path.join(root, 'data', 'scripts.json'));
const categories = readJson(path.join(root, 'data', 'categories.json'));

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

const protectedFiles = [
  path.join(root, 'data', 'scripts.json'),
  path.join(root, 'data', 'stories.json'),
  path.join(root, 'data', 'categories.json'),
  path.join(root, 'scripts', 'creator-library-input.js'),
  path.join(root, 'scripts', 'creator-library-longform.js'),
  path.join(root, 'scripts', 'creator-library-shortform.js'),
  path.join(root, 'scripts', 'creator-library-pipeline.js'),
  path.join(root, 'scripts', 'creator-library-store.js'),
  path.join(root, 'scripts', 'creator-library.js'),
  path.join(root, 'scripts', 'generate-site.js')
];

const stats = {
  packsScanned: 0,
  generated: 0,
  failed: 0,
  creatorNoteCount: 0,
  sceneFocusCount: 0,
  visualBeatCount: 0,
  imagePromptCount: 0,
  beatMotionCount: 0,
  internalMetadataErrors: 0,
  brokenSentenceErrors: 0,
  genericPaddingErrors: 0,
  factlessProductionFieldErrors: 0,
  duplicateProductionFieldErrors: 0,
  fixtureEntityLeakErrors: 0,
  imagePromptNarrationMismatchErrors: 0,
  motionPromptMismatchErrors: 0
};

const failures = [];
const packBeatCounts = [];
const partBeatDistribution = new Map();
const fixtureResults = [];
const contentTypeResults = new Map();
const fieldRepeats = {
  creatorNote: new Map(),
  sceneFocus: new Map(),
  imagePrompt: new Map(),
  beatMotion: new Map()
};
const fixtureEntityCache = buildFixtureEntityCache();

main();

function main() {
  const beforeHashes = snapshotProtectedFiles();
  const slugs = unique(scripts.map((script) => script.originalStorySlug).filter(Boolean));
  const representatives = selectContentTypeRepresentatives(slugs);

  for (const slug of fixtureSlugs) validateSlug(slug, representatives, false);
  for (const slug of slugs) validateSlug(slug, representatives, true);

  assertRequiredResults(representatives);
  assertProtectedFilesUnchanged(beforeHashes);
  report();
  if (failures.length) process.exit(1);
}

function validateSlug(slug, representatives, countPackStats = true) {
  if (countPackStats) stats.packsScanned += 1;
  const story = stories.find((item) => item.slug === slug);
  if (!story) return fail({ slug, errorType: 'missing-story', message: 'Story not found.' });
  const category = findCategory(story);

  try {
    const normalizedInput = normalizeCreatorStoryInput(story, category);
    const scenePlan = buildCreatorScenePlan(normalizedInput);
    const longformResult = buildCreatorLongform(normalizedInput, scenePlan);
    const productionResult = buildCreatorProductionFields(normalizedInput, scenePlan, longformResult);
    const validation = validateCreatorProductionFields(productionResult, scenePlan, longformResult);
    if (!validation.valid) {
      validation.errors.forEach((error) => {
        fail({ slug, contentType: normalizedInput.contentType, errorType: 'production-validation', message: formatErrorObject(error) });
      });
      return;
    }

    inspectProduction(slug, normalizedInput, scenePlan, longformResult, productionResult, countPackStats);
    if (countPackStats) stats.generated += 1;
    if (fixtureSlugs.includes(slug) && !fixtureResults.some((item) => item.slug === slug)) {
      fixtureResults.push(resultSummary(slug, normalizedInput, productionResult));
    }
    if (representatives.get(normalizedInput.contentType) === slug) {
      contentTypeResults.set(normalizedInput.contentType, resultSummary(slug, normalizedInput, productionResult));
    }
  } catch (error) {
    stats.failed += 1;
    const messages = Array.isArray(error.errors) ? error.errors.map(formatErrorObject) : [error.message || String(error)];
    messages.slice(0, 10).forEach((message) => fail({ slug, errorType: error.code || 'dry-run', message }));
  }
}

function inspectProduction(slug, normalizedInput, scenePlan, longformResult, productionResult, countStats) {
  const fixtureEntitySets = fixtureSlugs.includes(slug) ? fixtureEntityLeakSets(slug) : [];
  let packBeatCount = 0;
  const duplicates = detectDuplicateProductionFields(productionResult);
  Object.entries(duplicates).forEach(([field, items]) => {
    if (!items.length) return;
    stats.duplicateProductionFieldErrors += items.length;
    items.forEach((item) => fail({ slug, contentType: normalizedInput.contentType, errorType: 'duplicate-production-field', field, message: `${item.count}x ${item.value}` }));
  });

  (productionResult.scenes || []).forEach((scene, sceneIndex) => {
    const planScene = scenePlan.scenes?.[sceneIndex] || {};
    const longformScene = longformResult.scenes?.[sceneIndex] || {};
    if (countStats) stats.sceneFocusCount += 1;
    inspectTextField(slug, normalizedInput, fixtureEntitySets, 'sceneFocus', scene.sceneFocus, scene.sceneIndex, 0, 0);
    if (countStats) addRepeat('sceneFocus', slug, scene.sceneFocus);
    if (!Array.isArray(planScene.sourceFactIds) || !planScene.sourceFactIds.length) {
      countFactless(slug, normalizedInput, 'sceneFocus', scene.sceneIndex, 0, 0, 'Scene Focus has no sourceFactIds in Scene Plan.');
    }

    (scene.narrationParts || []).forEach((part, partIndex) => {
      const planPart = planScene.narrationParts?.[partIndex] || {};
      const longformPart = longformScene.narrationParts?.[partIndex] || {};
      if (countStats) stats.creatorNoteCount += 1;
      inspectTextField(slug, normalizedInput, fixtureEntitySets, 'creatorNote', part.creatorNote, scene.sceneIndex, part.partIndex, 0);
      if (countStats) addRepeat('creatorNote', slug, part.creatorNote);
      if (!Array.isArray(planPart.sourceFactIds) || !planPart.sourceFactIds.length) {
        countFactless(slug, normalizedInput, 'creatorNote', scene.sceneIndex, part.partIndex, 0, 'Creator Note has no sourceFactIds in Scene Plan Part.');
      }

      const partBeatCount = (part.visualBeats || []).length;
      if (countStats) {
        packBeatCount += partBeatCount;
        partBeatDistribution.set(partBeatCount, (partBeatDistribution.get(partBeatCount) || 0) + 1);
      }
      (part.visualBeats || []).forEach((beat) => {
        if (countStats) {
          stats.visualBeatCount += 1;
          stats.imagePromptCount += 1;
          stats.beatMotionCount += 1;
        }
        inspectTextField(slug, normalizedInput, fixtureEntitySets, 'imagePrompt', beat.imagePrompt, scene.sceneIndex, part.partIndex, beat.beatIndex);
        inspectTextField(slug, normalizedInput, fixtureEntitySets, 'beatMotion', beat.beatMotion, scene.sceneIndex, part.partIndex, beat.beatIndex);
        if (countStats) {
          addRepeat('imagePrompt', slug, beat.imagePrompt);
          addRepeat('beatMotion', slug, beat.beatMotion);
        }
        if (!Array.isArray(beat.sourceFactIds) || !beat.sourceFactIds.length) {
          countFactless(slug, normalizedInput, 'visualBeat', scene.sceneIndex, part.partIndex, beat.beatIndex, 'Visual Beat has no sourceFactIds.');
        }
        const sourceText = sourceFactsForBeat(beat, normalizedInput, planPart, planScene).join(' ');
        if (!hasUsefulOverlap(beat.imagePrompt, `${sourceText} ${longformPart.narration || ''} ${normalizedInput.topic}`)) {
          stats.imagePromptNarrationMismatchErrors += 1;
          fail({ slug, contentType: normalizedInput.contentType, errorType: 'image-prompt-narration-mismatch', field: 'imagePrompt', sceneIndex: scene.sceneIndex, partIndex: part.partIndex, beatIndex: beat.beatIndex, message: beat.imagePrompt });
        }
        if (!hasUsefulOverlap(beat.beatMotion, beat.imagePrompt)) {
          stats.motionPromptMismatchErrors += 1;
          fail({ slug, contentType: normalizedInput.contentType, errorType: 'motion-prompt-mismatch', field: 'beatMotion', sceneIndex: scene.sceneIndex, partIndex: part.partIndex, beatIndex: beat.beatIndex, message: beat.beatMotion });
        }
      });
    });
  });
  if (countStats) packBeatCounts.push(packBeatCount);
}

function inspectTextField(slug, normalizedInput, fixtureEntitySets, field, value, sceneIndex, partIndex, beatIndex) {
  const internal = detectInternalProductionMetadata(value);
  if (internal.length) {
    stats.internalMetadataErrors += 1;
    fail({ slug, contentType: normalizedInput.contentType, errorType: 'internal-metadata', field, sceneIndex, partIndex, beatIndex, message: internal.join(', ') });
  }
  const broken = detectBrokenProductionText(value);
  if (broken.length) {
    stats.brokenSentenceErrors += 1;
    fail({ slug, contentType: normalizedInput.contentType, errorType: 'broken-production-text', field, sceneIndex, partIndex, beatIndex, message: broken.join(', ') });
  }
  const generic = detectGenericProductionText(value);
  if (generic.length) {
    stats.genericPaddingErrors += 1;
    fail({ slug, contentType: normalizedInput.contentType, errorType: 'generic-production-padding', field, sceneIndex, partIndex, beatIndex, message: generic.join(', ') });
  }
  const leak = detectProductionFactLeak(value);
  if (leak.length) {
    stats.internalMetadataErrors += 1;
    fail({ slug, contentType: normalizedInput.contentType, errorType: 'fact-id-or-key-leak', field, sceneIndex, partIndex, beatIndex, message: leak.join(', ') });
  }
  const entityLeak = detectFixtureEntityLeak(value, fixtureEntitySets);
  if (entityLeak) {
    stats.fixtureEntityLeakErrors += 1;
    fail({ slug, contentType: normalizedInput.contentType, errorType: 'fixture-entity-leak', field, sceneIndex, partIndex, beatIndex, message: entityLeak });
  }
}

function countFactless(slug, normalizedInput, field, sceneIndex, partIndex, beatIndex, message) {
  stats.factlessProductionFieldErrors += 1;
  fail({ slug, contentType: normalizedInput.contentType, errorType: 'factless-production-field', field, sceneIndex, partIndex, beatIndex, message });
}

function sourceFactsForBeat(beat, normalizedInput, planPart, planScene) {
  const factById = new Map((normalizedInput.factRecords || []).map((record) => [record.id, record]));
  const ids = unique([...(beat.sourceFactIds || []), ...(planPart.sourceFactIds || []), ...(planScene.sourceFactIds || [])]);
  return ids.map((id) => factById.get(id)?.factText).filter(Boolean);
}

function hasUsefulOverlap(left, right) {
  const leftTokens = tokenSet(left);
  const rightTokens = tokenSet(right);
  for (const token of leftTokens) {
    if (rightTokens.has(token)) return true;
  }
  return false;
}

function tokenSet(value) {
  const stop = new Set(['the', 'and', 'with', 'that', 'this', 'from', 'into', 'within', 'image', 'scene', 'visual', 'frame', 'slow', 'hold', 'use', 'tone', 'style']);
  return new Set(String(value || '').toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 3 && !stop.has(token)));
}

function addRepeat(field, slug, value) {
  const key = comparableText(value);
  if (!key) return;
  const entry = fieldRepeats[field].get(key) || { value, count: 0, slugs: new Set() };
  entry.count += 1;
  entry.slugs.add(slug);
  fieldRepeats[field].set(key, entry);
}

function repeatStats(field) {
  const entries = [...fieldRepeats[field].values()];
  return {
    repeatedAcross2: entries.filter((entry) => entry.slugs.size >= 2).length,
    repeatedAcross5: entries.filter((entry) => entry.slugs.size >= 5).length,
    repeatedAcross20: entries.filter((entry) => entry.slugs.size >= 20).length,
    top: entries
      .filter((entry) => entry.slugs.size >= 2)
      .sort((a, b) => b.slugs.size - a.slugs.size || b.count - a.count)
      .slice(0, 30)
      .map((entry) => ({ count: entry.count, packs: entry.slugs.size, value: entry.value }))
  };
}

function selectContentTypeRepresentatives(slugs) {
  const output = new Map();
  for (const slug of slugs) {
    const story = stories.find((item) => item.slug === slug);
    if (!story) continue;
    const normalizedInput = normalizeCreatorStoryInput(story, findCategory(story));
    if (requiredContentTypes.includes(normalizedInput.contentType) && !output.has(normalizedInput.contentType)) {
      output.set(normalizedInput.contentType, slug);
    }
  }
  return output;
}

function assertRequiredResults(representatives) {
  for (const slug of fixtureSlugs) {
    if (!fixtureResults.some((item) => item.slug === slug)) {
      fail({ slug, errorType: 'missing-fixture-result', message: 'Fixture result was not generated.' });
    }
  }
  for (const contentType of requiredContentTypes) {
    if (!representatives.has(contentType) || !contentTypeResults.has(contentType)) {
      fail({ slug: 'content-type-representatives', contentType, errorType: 'missing-content-type-result', message: `No representative generated for ${contentType}.` });
    }
  }
}

function resultSummary(slug, normalizedInput, productionResult) {
  const beats = productionResult.scenes.flatMap((scene) => scene.narrationParts || []).flatMap((part) => part.visualBeats || []);
  return {
    slug,
    contentType: normalizedInput.contentType,
    scenes: productionResult.scenes.length,
    creatorNotes: productionResult.scenes.flatMap((scene) => scene.narrationParts || []).length,
    sceneFocuses: productionResult.scenes.length,
    visualBeats: beats.length,
    imagePrompts: beats.length,
    beatMotions: beats.length
  };
}

function fixtureEntityLeakSets(currentSlug) {
  return fixtureEntityCache.filter((item) => item.slug !== currentSlug);
}

function buildFixtureEntityCache() {
  return fixtureSlugs.map((slug) => {
    const story = stories.find((item) => item.slug === slug);
    if (!story) return { slug, names: [] };
    const input = normalizeCreatorStoryInput(story, findCategory(story));
    return {
      slug,
      names: unique([
        input.topic,
        ...(input.knownNames || []),
        ...(input.keyActors || [])
      ]).map((name) => String(name || '').toLowerCase()).filter((name) => name.length > 3 && !/myth|story|legend|source|tradition|digital|name/.test(name))
    };
  });
}

function detectFixtureEntityLeak(value, fixtureEntitySets) {
  const text = String(value || '').toLowerCase();
  for (const fixture of fixtureEntitySets) {
    const leaked = fixture.names.find((name) => text.includes(name));
    if (leaked) return `${leaked} from ${fixture.slug}`;
  }
  return '';
}

function snapshotProtectedFiles() {
  return new Map(protectedFiles.map((filePath) => [filePath, hashFile(filePath)]));
}

function assertProtectedFilesUnchanged(beforeHashes) {
  for (const [filePath, beforeHash] of beforeHashes.entries()) {
    const afterHash = hashFile(filePath);
    if (afterHash !== beforeHash) {
      fail({ slug: 'protected-files', errorType: 'protected-file-changed', message: `${path.relative(root, filePath)} changed during validation.` });
    }
  }
}

function report() {
  const min = packBeatCounts.length ? Math.min(...packBeatCounts) : 0;
  const max = packBeatCounts.length ? Math.max(...packBeatCounts) : 0;
  const avg = packBeatCounts.length ? (packBeatCounts.reduce((sum, count) => sum + count, 0) / packBeatCounts.length).toFixed(2) : '0.00';
  console.log('Creator Library Production quality validation:');
  console.log(`- packs scanned: ${stats.packsScanned}`);
  console.log(`- generated: ${stats.generated}`);
  console.log(`- failed: ${stats.failed}`);
  console.log(`- creator notes: ${stats.creatorNoteCount}`);
  console.log(`- scene focuses: ${stats.sceneFocusCount}`);
  console.log(`- visual beats: ${stats.visualBeatCount}`);
  console.log(`- image prompts: ${stats.imagePromptCount}`);
  console.log(`- beat motions: ${stats.beatMotionCount}`);
  console.log(`- part beat distribution: ${formatDistribution(partBeatDistribution)}`);
  console.log(`- pack beat min/max/avg: ${min}/${max}/${avg}`);
  console.log(`- internal metadata errors: ${stats.internalMetadataErrors}`);
  console.log(`- broken sentence errors: ${stats.brokenSentenceErrors}`);
  console.log(`- generic padding errors: ${stats.genericPaddingErrors}`);
  console.log(`- factless production field errors: ${stats.factlessProductionFieldErrors}`);
  console.log(`- duplicate production field errors: ${stats.duplicateProductionFieldErrors}`);
  console.log(`- fixture entity leak errors: ${stats.fixtureEntityLeakErrors}`);
  console.log(`- image prompt/narration mismatch errors: ${stats.imagePromptNarrationMismatchErrors}`);
  console.log(`- motion/prompt mismatch errors: ${stats.motionPromptMismatchErrors}`);
  console.log('- representative fixtures:');
  fixtureResults.forEach((item) => console.log(`  - ${item.slug}: ${item.contentType}; beats=${item.visualBeats}`));
  console.log('- contentType representatives:');
  requiredContentTypes.forEach((contentType) => {
    const item = contentTypeResults.get(contentType);
    console.log(`  - ${contentType}: ${item ? `${item.slug}; beats=${item.visualBeats}` : 'missing'}`);
  });
  console.log('- repeat stats:');
  for (const field of Object.keys(fieldRepeats)) {
    const summary = repeatStats(field);
    console.log(`  - ${field}: 2+=${summary.repeatedAcross2}; 5+=${summary.repeatedAcross5}; 20+=${summary.repeatedAcross20}`);
    summary.top.slice(0, 5).forEach((item) => console.log(`    - ${item.packs} packs / ${item.count} uses: ${item.value}`));
  }
  if (failures.length) {
    failures.slice(0, 50).forEach((failure) => console.error(`${failure.slug}: ${failure.errorType}: ${failure.message}`));
    console.error(`Creator Library Production quality validation failed: ${failures.length} issue(s).`);
  } else {
    console.log('Creator Library Production quality validation passed.');
  }
}

function findCategory(story) {
  return categories.find((item) => item.slug === story.categorySlug)
    || categories.find((item) => item.slug === story.category)
    || {};
}

function formatDistribution(map) {
  return [...map.entries()].sort((a, b) => Number(a[0]) - Number(b[0])).map(([key, value]) => `${key}:${value}`).join(', ');
}

function formatErrorObject(error) {
  if (!error || typeof error !== 'object') return String(error);
  return `${error.sceneIndex || 0}/${error.partIndex || 0}/${error.beatIndex || 0} ${error.field || 'field'}: ${error.error || ''}`;
}

function fail(error) {
  failures.push(error);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function comparableText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}
