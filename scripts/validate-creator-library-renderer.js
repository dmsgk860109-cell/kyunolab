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
  buildCreatorShortform
} = require('./creator-library-shortform');
const {
  buildCreatorLibraryEntry
} = require('./creator-library-pipeline');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const scriptsPath = path.join(root, 'data', 'scripts.json');
const categoriesPath = path.join(root, 'data', 'categories.json');
const stories = readJson(storiesPath);
const categories = readJson(categoriesPath);
const scripts = readJson(scriptsPath);

const fixtureSlugs = [
  'maui-slows-the-sun-myth',
  'demeter-and-persephone-myth',
  'osiris-isis-resurrection-myth',
  'cicada-3301-internet-puzzle',
  'why-names-have-power-in-legends'
];

const forbiddenFallbackPhrases = [
  'Copy This Part',
  'A clear, readable moment from the story.',
  'A quiet mystery scene shows one clear subject',
  'Use a short, complete narration line',
  '2-4 minutes',
  '5-6 minutes'
];

let failures = 0;
const summaries = [];

main();

function main() {
  const beforeHashes = snapshotProtectedFiles();
  const renderer = require('./generate-site');
  assertRequireDidNotBuild(beforeHashes);
  assertRendererSourceIsolation();

  for (const slug of fixtureSlugs) {
    validateStandardDryRun(renderer, slug);
  }

  validateMissingFieldFailures(renderer);
  validateLegacySample(renderer);
  assertProtectedFilesUnchanged(beforeHashes);
  report();
}

function validateStandardDryRun(renderer, slug) {
  const story = stories.find((item) => item.slug === slug);
  if (!story) return fail(slug, 'missing fixture story');
  const category = categories.find((item) => item.slug === story.categorySlug) || {};
  const normalizedInput = normalizeCreatorStoryInput(story, category);
  const scenePlan = buildCreatorScenePlan(normalizedInput);
  const longformResult = buildCreatorLongform(normalizedInput, scenePlan);
  const productionResult = buildCreatorProductionFields(normalizedInput, scenePlan, longformResult);
  const shortformResult = buildCreatorShortform(normalizedInput, scenePlan, longformResult, productionResult);
  const script = buildCreatorLibraryEntry(story, category, {
    normalizedInput,
    scenePlan,
    longformResult,
    productionResult,
    shortformResult
  });

  if (script.creatorPipelineVersion !== 'single-path-v1') fail(slug, 'missing creatorPipelineVersion');
  if (!renderer.isStandardCreatorPack(script)) fail(slug, 'isStandardCreatorPack returned false');

  renderer.validateCreatorPackForRender(script);
  const model = renderer.buildCreatorRenderModel(script);
  const html = renderer.renderStandardCreatorPack(script);

  assertModelShape(slug, model);
  assertOutputSync(slug, script, model, html);
  assertFallbackTextAbsent(slug, html);
  assertNoFixtureLeakage(slug, normalizedInput, html);
  assertFixtureSpecificRules(slug, html);

  summaries.push({
    slug,
    longScenes: model.longForm.scenes.length,
    longParts: model.longForm.scenes.flatMap((scene) => scene.narrationParts).length,
    shortScenes: model.shortForm.scenes.length,
    longReadSeconds: model.longForm.runtime.narrationReadSeconds,
    longFinalSeconds: model.longForm.runtime.finalVideoSeconds,
    shortReadSeconds: model.shortForm.runtime.narrationReadSeconds,
    shortFinalSeconds: model.shortForm.runtime.finalVideoSeconds
  });
}

function assertModelShape(slug, model) {
  if (model.pipelineVersion !== 'single-path-v1') fail(slug, 'View Model pipeline version mismatch');
  if (model.longForm.scenes.length !== 5) fail(slug, 'Long-form scene count mismatch');
  if (model.shortForm.scenes.length !== 5) fail(slug, 'Short-form scene count mismatch');
  const longParts = model.longForm.scenes.flatMap((scene) => scene.narrationParts);
  const visualBeats = longParts.flatMap((part) => part.visualBeats);
  if (longParts.length !== 10) fail(slug, 'Long-form part count must be 10');
  if (!visualBeats.length) fail(slug, 'Visual Beats missing');
  for (const field of ['totalWordCount', 'narrationReadSeconds', 'finalVideoSeconds']) {
    if (!model.longForm.runtime[field]) fail(slug, `Long-form runtime missing ${field}`);
    if (!model.shortForm.runtime[field]) fail(slug, `Short-form runtime missing ${field}`);
  }
}

function assertOutputSync(slug, script, model, html) {
  const longParts = model.longForm.scenes.flatMap((scene) => scene.narrationParts);
  const beats = longParts.flatMap((part) => part.visualBeats);
  assertCount(slug, html, 'Copy Creator Note', longParts.length);
  assertCount(slug, html, 'Copy Image Prompt', beats.length);
  assertCount(slug, html, 'Copy Motion Prompt', beats.length);
  assertCount(slug, html, 'Copy Full Long-form Narration', 1);
  assertCount(slug, html, 'Copy Full Short-form Narration', 1);

  const requiredValues = [
    String(script.runtimePlan.narrationReadSeconds),
    String(script.runtimePlan.finalVideoSeconds),
    ...model.longForm.scenes.flatMap((scene) => [
      scene.role,
      scene.sceneFocus,
      scene.backgroundMusic,
      scene.voiceDirection,
      scene.soundEffect,
      scene.visualDirection,
      ...scene.narrationParts.flatMap((part) => [
        part.narration,
        part.creatorNote,
        part.readingTime,
        ...part.visualBeats.flatMap((beat) => [beat.imagePrompt, beat.motionPrompt])
      ])
    ]),
    ...model.shortForm.scenes.flatMap((scene) => [
      scene.role,
      scene.narration,
      scene.sceneFocus,
      scene.motionPrompt,
      scene.backgroundMusic,
      scene.voiceDirection,
      scene.soundEffect,
      String(scene.estimatedReadSeconds)
    ])
  ].filter(Boolean);

  for (const value of requiredValues) {
    if (!html.includes(escapeHtml(value))) fail(slug, `rendered HTML missing stored value: ${shorten(value)}`);
  }

  const expectedShortNarration = script.shortForm.scenes.map((scene) => scene.narration);
  if (JSON.stringify(script.shortsScript) !== JSON.stringify(expectedShortNarration)) {
    fail(slug, 'shortsScript is not synchronized with shortForm.scenes');
  }
  const expectedShortFocuses = script.shortForm.scenes.map((scene) => scene.sceneFocus);
  if (JSON.stringify(script.shortSceneFocuses) !== JSON.stringify(expectedShortFocuses)) {
    fail(slug, 'shortSceneFocuses is not synchronized with shortForm.scenes');
  }
}

function validateMissingFieldFailures(renderer) {
  const fixture = buildFixturePack('maui-slows-the-sun-myth');
  const cases = [
    {
      label: 'shortForm Scene 3 soundEffect',
      mutate: (pack) => {
        pack.shortForm.scenes[2].soundEffect = '';
      },
      field: 'soundEffect',
      section: 'shortForm',
      sceneIndex: 3
    },
    {
      label: 'Long-form Scene 2 voiceDirection',
      mutate: (pack) => {
        pack.visualGuide[1].voiceDirection = '';
      },
      field: 'voiceDirection',
      section: 'longForm',
      sceneIndex: 2
    },
    {
      label: 'Visual Beat imagePrompt',
      mutate: (pack) => {
        pack.visualGuide[0].narrationParts[0].visualBeats[0].imagePrompt = '';
      },
      field: 'imagePrompt',
      section: 'longForm',
      sceneIndex: 1,
      partIndex: 1,
      beatIndex: 1
    }
  ];

  for (const item of cases) {
    const pack = clone(fixture);
    item.mutate(pack);
    try {
      renderer.renderStandardCreatorPack(pack);
      fail('missing-field', `${item.label} did not fail`);
    } catch (error) {
      if (error.code !== 'CREATOR_RENDER_DATA_MISSING') fail('missing-field', `${item.label} returned ${error.code || error.message}`);
      for (const field of ['field', 'section', 'sceneIndex', 'partIndex', 'beatIndex']) {
        if (item[field] !== undefined && error[field] !== item[field]) {
          fail('missing-field', `${item.label} missing ${field} metadata`);
        }
      }
    }
  }
}

function validateLegacySample(renderer) {
  const legacy = scripts.find((script) => script && script.creatorPipelineVersion !== 'single-path-v1');
  if (!legacy) return fail('legacy', 'no legacy sample found');
  if (renderer.isStandardCreatorPack(legacy)) fail('legacy', 'legacy sample detected as standard');
  const html = renderer.renderCreatorPack(legacy);
  if (!html.includes('Long-form Creator') || !html.includes('Short-form Creator')) {
    fail('legacy', 'legacy sample did not render through compatibility path');
  }
}

function buildFixturePack(slug) {
  const story = stories.find((item) => item.slug === slug);
  const category = categories.find((item) => item.slug === story.categorySlug) || {};
  const normalizedInput = normalizeCreatorStoryInput(story, category);
  const scenePlan = buildCreatorScenePlan(normalizedInput);
  const longformResult = buildCreatorLongform(normalizedInput, scenePlan);
  const productionResult = buildCreatorProductionFields(normalizedInput, scenePlan, longformResult);
  const shortformResult = buildCreatorShortform(normalizedInput, scenePlan, longformResult, productionResult);
  return buildCreatorLibraryEntry(story, category, {
    normalizedInput,
    scenePlan,
    longformResult,
    productionResult,
    shortformResult
  });
}

function assertFallbackTextAbsent(slug, html) {
  for (const phrase of forbiddenFallbackPhrases) {
    if (html.includes(phrase)) fail(slug, `forbidden fallback phrase found: ${phrase}`);
  }
}

function assertFixtureSpecificRules(slug, html) {
  const text = html.toLowerCase();
  if (slug === 'maui-slows-the-sun-myth' && /room tone|floor creak|empty|forever|ordinary/.test(text)) {
    fail(slug, 'Maui renderer output contains empty-room fallback language');
  }
  if (slug === 'cicada-3301-internet-puzzle' && !/digital|cipher|screen|coded|internet|puzzle/.test(text)) {
    fail(slug, 'Cicada digital production language was not preserved');
  }
}

function assertNoFixtureLeakage(slug, normalizedInput, html) {
  const text = html.toLowerCase();
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
    .filter((value) => value.length > 3 && !allowed.has(value) && !/myth|story|legend|source|tradition|digital|name|sun|winter/.test(value));
  for (const name of otherNames) {
    if (text.includes(name)) fail(slug, `contains another fixture entity: ${name}`);
  }
}

function assertRendererSourceIsolation() {
  const source = readText(path.join(root, 'scripts', 'generate-site.js'));
  const standardStart = source.indexOf('function renderStandardCreatorPack');
  const legacyStart = source.indexOf('function renderLongFormCreator');
  const standardBody = source.substring(standardStart, legacyStart);
  for (const forbidden of [
    'advancedProductionInfo(',
    'motionPromptForScene(',
    'motionPromptFromSceneText(',
    'soundEffectForScene(',
    'voiceDirectionForScene(',
    'sceneRoleForScene(',
    'sceneFocusForScene(',
    'cameraNotesForScene(',
    'negativePromptForScene('
  ]) {
    if (standardBody.includes(forbidden)) fail('generate-site', `standard renderer body calls ${forbidden}`);
  }
}

function assertCount(slug, html, phrase, expected) {
  const actual = (html.match(new RegExp(escapeRegExp(phrase), 'g')) || []).length;
  if (actual !== expected) fail(slug, `${phrase} count ${actual}, expected ${expected}`);
}

function assertRequireDidNotBuild(beforeHashes) {
  assertProtectedFilesUnchanged(beforeHashes, 'require');
}

function snapshotProtectedFiles() {
  const files = [
    storiesPath,
    scriptsPath,
    categoriesPath,
    ...listHtmlFiles(path.join(root, 'scripts'))
  ];
  return new Map(files.map((file) => [file, hashFile(file)]));
}

function assertProtectedFilesUnchanged(beforeHashes, label = 'validation') {
  for (const [file, before] of beforeHashes.entries()) {
    const after = hashFile(file);
    if (before !== after) fail('protected-files', `${label} changed ${path.relative(root, file)}`);
  }
}

function listHtmlFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listHtmlFiles(fullPath);
    return entry.isFile() && entry.name.endsWith('.html') ? [fullPath] : [];
  });
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function shorten(value) {
  return String(value).slice(0, 80);
}

function fail(slug, message) {
  failures += 1;
  console.error(`[renderer:${slug}] ${message}`);
}

function report() {
  console.log('Creator Library renderer validation summaries:');
  for (const summary of summaries) {
    console.log(`- ${summary.slug}: longScenes=${summary.longScenes}, longParts=${summary.longParts}, shortScenes=${summary.shortScenes}, long=${summary.longReadSeconds}/${summary.longFinalSeconds}s, short=${summary.shortReadSeconds}/${summary.shortFinalSeconds}s`);
  }
  if (failures) {
    console.error(`Creator Library renderer validation failed with ${failures} issue(s).`);
    process.exit(1);
  }
  console.log('Creator Library renderer validation passed.');
}
