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
  validateCreatorProductionFields
} = require('./creator-library-production');
const {
  buildCreatorLibraryEntry
} = require('./creator-library-pipeline');

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
  assertNoNewSubjectSpecificProductionCode();
  for (const slug of fixtureSlugs) validateDryRun(slug);
  assertProtectedFilesUnchanged(beforeHashes);
  report();
}

function validateDryRun(slug) {
  const story = stories.find((item) => item.slug === slug);
  if (!story) return fail(slug, 'missing dry-run story');
  const category = categories.find((item) => item.slug === story.categorySlug) || {};
  const normalizedInput = normalizeCreatorStoryInput(story, category);
  const scenePlan = buildCreatorScenePlan(normalizedInput);
  const longformResult = buildCreatorLongform(normalizedInput, scenePlan);
  const productionResult = buildCreatorProductionFields(normalizedInput, scenePlan, longformResult);
  const validation = validateCreatorProductionFields(productionResult, scenePlan, longformResult);
  if (!validation.valid) {
    fail(slug, `Production validation failed: ${formatErrors(validation.errors)}`);
  }
  let officialProductionResult = null;
  const script = buildCreatorLibraryEntry(story, category, {
    normalizedInput,
    scenePlan,
    longformResult,
    onProductionResult: (result) => {
      officialProductionResult = result;
    }
  });

  assertProductionSchema(slug, normalizedInput, scenePlan, longformResult, productionResult);
  assertOfficialOutputSync(slug, productionResult, officialProductionResult, script);
  assertNoKnownNameLeakage(slug, normalizedInput, productionResult);
  assertFixtureSpecificRules(slug, productionResult);

  const partCount = productionResult.scenes.flatMap((scene) => scene.narrationParts).length;
  const beatCount = productionResult.scenes
    .flatMap((scene) => scene.narrationParts)
    .flatMap((part) => part.visualBeats).length;
  summaries.push({
    slug,
    contentType: normalizedInput.contentType,
    scenes: productionResult.scenes.length,
    parts: partCount,
    beats: beatCount,
    imagePrompts: script.imagePrompts.length,
    motionPrompts: script.motionPrompts.length
  });
}

function assertProductionSchema(slug, normalizedInput, scenePlan, longformResult, productionResult) {
  if (productionResult.schemaVersion !== '1.0') fail(slug, 'production schemaVersion must be 1.0');
  if (productionResult.inputSchemaVersion !== normalizedInput.schemaVersion) fail(slug, 'input schema version mismatch');
  if (productionResult.scenePlanSchemaVersion !== scenePlan.schemaVersion) fail(slug, 'scene plan schema version mismatch');
  if (productionResult.slug !== normalizedInput.slug) fail(slug, 'slug mismatch');
  if (productionResult.topic !== normalizedInput.topic) fail(slug, 'topic mismatch');
  if (productionResult.contentType !== normalizedInput.contentType) fail(slug, 'contentType mismatch');
  if (productionResult.scenes.length !== 5) fail(slug, 'must contain exactly 5 production scenes');
  productionResult.scenes.forEach((scene, sceneIndex) => {
    const planScene = scenePlan.scenes[sceneIndex];
    const longformScene = longformResult.scenes[sceneIndex];
    if (scene.sceneIndex !== planScene.sceneIndex || scene.sceneIndex !== longformScene.sceneIndex) {
      fail(slug, `Scene ${sceneIndex + 1} index mismatch`);
    }
    if (scene.role !== planScene.role) fail(slug, `Scene ${sceneIndex + 1} role mismatch`);
    for (const field of ['sceneFocus', 'backgroundMusic', 'voiceDirection', 'soundEffect']) {
      if (!scene[field]) fail(slug, `Scene ${sceneIndex + 1} missing ${field}`);
    }
    if (scene.narrationParts.length !== 2) fail(slug, `Scene ${sceneIndex + 1} must contain 2 parts`);
    scene.narrationParts.forEach((part, partIndex) => {
      if (part.partIndex !== partIndex + 1) fail(slug, `Scene ${sceneIndex + 1} Part ${partIndex + 1} index mismatch`);
      if (!part.creatorNote) fail(slug, `Scene ${sceneIndex + 1} Part ${partIndex + 1} missing Creator Note`);
      if (!part.visualBeats.length) fail(slug, `Scene ${sceneIndex + 1} Part ${partIndex + 1} missing Visual Beat`);
      part.visualBeats.forEach((beat, beatIndex) => {
        if (beat.beatIndex !== beatIndex + 1) fail(slug, `Scene ${sceneIndex + 1} Part ${partIndex + 1} Beat index mismatch`);
        if (!beat.imagePrompt) fail(slug, `Scene ${sceneIndex + 1} Part ${partIndex + 1} Beat ${beatIndex + 1} missing Image Prompt`);
        if (!beat.beatMotion) fail(slug, `Scene ${sceneIndex + 1} Part ${partIndex + 1} Beat ${beatIndex + 1} missing Beat Motion`);
        if (!Array.isArray(beat.sourceFieldRefs)) fail(slug, `Scene ${sceneIndex + 1} Part ${partIndex + 1} Beat ${beatIndex + 1} sourceFieldRefs missing`);
      });
    });
  });
}

function assertOfficialOutputSync(slug, productionResult, officialProductionResult, script) {
  if (!officialProductionResult) fail(slug, 'buildCreatorLibraryEntry did not expose production result through official route');
  if (JSON.stringify(stripDiagnostics(officialProductionResult)) !== JSON.stringify(stripDiagnostics(productionResult))) {
    fail(slug, 'official route production result differs from direct production result');
  }
  const visualPrompts = productionResult.scenes
    .flatMap((scene) => scene.narrationParts)
    .flatMap((part) => part.visualBeats)
    .map((beat) => beat.imagePrompt);
  const visualMotions = productionResult.scenes
    .flatMap((scene) => scene.narrationParts)
    .flatMap((part) => part.visualBeats)
    .map((beat) => beat.beatMotion);
  if (JSON.stringify(script.imagePrompts) !== JSON.stringify(visualPrompts)) {
    fail(slug, 'top-level imagePrompts are not synchronized with Visual Beats');
  }
  if (JSON.stringify(script.motionPrompts) !== JSON.stringify(visualMotions)) {
    fail(slug, 'top-level motionPrompts are not synchronized with Visual Beats');
  }
  const guidePrompts = (script.visualGuide || [])
    .flatMap((scene) => scene.narrationParts || [])
    .flatMap((part) => part.visualBeats || [])
    .map((beat) => beat.imagePrompt);
  const guideMotions = (script.visualGuide || [])
    .flatMap((scene) => scene.narrationParts || [])
    .flatMap((part) => part.visualBeats || [])
    .map((beat) => beat.motionPrompt);
  if (JSON.stringify(guidePrompts) !== JSON.stringify(visualPrompts)) {
    fail(slug, 'visualGuide prompts are not synchronized with production result');
  }
  if (JSON.stringify(guideMotions) !== JSON.stringify(visualMotions)) {
    fail(slug, 'visualGuide motions are not synchronized with production result');
  }
}

function assertNoKnownNameLeakage(slug, normalizedInput, productionResult) {
  const packed = JSON.stringify(productionResult).toLowerCase();
  const allowed = new Set([
    normalizedInput.topic,
    ...(normalizedInput.knownNames || []),
    ...(normalizedInput.keyActors || [])
  ].map((value) => String(value || '').toLowerCase()).filter(Boolean));
  const otherNames = fixtureSlugs
    .filter((targetSlug) => targetSlug !== slug)
    .flatMap((targetSlug) => {
      const story = stories.find((item) => item.slug === targetSlug);
      return [
        story?.storyBrief?.topic,
        ...(story?.storyBrief?.knownNames || []),
        ...(story?.storyBrief?.keyActors || [])
      ];
    })
    .map((value) => String(value || '').toLowerCase().trim())
    .filter((value) => value.length > 3 && !allowed.has(value) && !/myth|story|legend|source|tradition|digital|name/.test(value));
  for (const name of otherNames) {
    if (packed.includes(name)) fail(slug, `contains another fixture entity: ${name}`);
  }
}

function assertFixtureSpecificRules(slug, productionResult) {
  const text = JSON.stringify(productionResult).toLowerCase();
  if (slug !== 'cicada-3301-internet-puzzle' && /keyboard|printer|modem|computer fan|fluorescent|office ventilation|screen interaction|electronic pulse/.test(text)) {
    fail(slug, 'non-digital fixture contains unrelated digital or office production preset');
  }
  if (slug === 'cicada-3301-internet-puzzle' && /dragon|serpent|temple ritual|underworld goddess/.test(text)) {
    fail(slug, 'Cicada contains mythic or dragon preset leakage');
  }
  if (slug.includes('maui') && /room tone|floor creak|digital office|keyboard|printer/.test(text)) {
    fail(slug, 'Maui contains room, office, or digital leakage');
  }
  if (slug.includes('demeter') && /egyptian|osiris|isis|dragon|keyboard|printer/.test(text)) {
    fail(slug, 'Demeter contains Egyptian, digital, or dragon leakage');
  }
  if (slug.includes('osiris') && /greek|persephone|demeter|dragon|keyboard|printer/.test(text)) {
    fail(slug, 'Osiris contains Greek, digital, or dragon leakage');
  }
}

function assertOfficialRouteSource() {
  const source = readText(path.join(root, 'scripts', 'creator-library-pipeline.js'));
  const buildStart = source.indexOf('function buildCreatorLibraryEntry');
  const buildEnd = source.indexOf('function assembleCreatorLibraryEntry');
  const buildBody = source.substring(buildStart, buildEnd);
  for (const needle of [
    'buildCreatorProductionFields',
    'validateProductionOrThrow'
  ]) {
    if (!buildBody.includes(needle)) fail('creator-library-pipeline', `official route missing ${needle}`);
  }
  for (const forbidden of [
    'creatorNoteForNarrationPart(',
    `${'demeterCreatorNote'}${'ForNarrationPart'}(`,
    'buildVisualGuide(',
    'visualBeatSeeds(',
    'motionPromptForVisualBeat(',
    'backgroundMusicForGeneratedScene(',
    'voiceDirectionForGeneratedScene(',
    'soundEffectForGeneratedScene('
  ]) {
    if (buildBody.includes(forbidden)) fail('creator-library-pipeline', `official route still calls ${forbidden}`);
  }
}

function assertNoNewSubjectSpecificProductionCode() {
  const productionSource = readText(path.join(root, 'scripts', 'creator-library-production.js'));
  for (const forbidden of [
    /maui/i,
    /demeter/i,
    /persephone/i,
    /osiris/i,
    /isis/i,
    /cicada/i,
    /(?:if\s*\([^)]*\b(?:slug|topic)\b[^)]*(?:===|!==|==|!=))|(?:\b(?:slug|topic)\b\s*(?:===|!==|==|!=))/i
  ]) {
    if (forbidden.test(productionSource)) {
      fail('creator-library-production', `new production module contains subject-specific or slug/topic branch: ${forbidden}`);
    }
  }
  const buildCount = (productionSource.match(/function\s+buildCreatorProductionFields\b/g) || []).length;
  const validateCount = (productionSource.match(/function\s+validateCreatorProductionFields\b/g) || []).length;
  if (buildCount !== 1) fail('creator-library-production', `expected one buildCreatorProductionFields function, found ${buildCount}`);
  if (validateCount !== 1) fail('creator-library-production', `expected one validateCreatorProductionFields function, found ${validateCount}`);
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
      narrationParts: scene.narrationParts.map((part) => ({
        ...part,
        visualBeats: part.visualBeats.map((beat) => ({
          ...beat,
          sourceFieldRefs: []
        }))
      }))
    }))
  };
}

function report() {
  summaries.forEach((summary) => {
    console.log(`${summary.slug}: contentType=${summary.contentType}; scenes=${summary.scenes}; parts=${summary.parts}; beats=${summary.beats}; imagePrompts=${summary.imagePrompts}; motionPrompts=${summary.motionPrompts}`);
  });
  if (failures) {
    console.error(`Creator Library Production validation failed: ${failures} issue(s).`);
    process.exit(1);
  }
  console.log('Creator Library Production validation passed.');
}

function formatErrors(errors) {
  return errors.map((error) => `${error.sceneIndex || 0}/${error.partIndex || 0}/${error.beatIndex || 0} ${error.field}: ${error.error}`).join('; ');
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
