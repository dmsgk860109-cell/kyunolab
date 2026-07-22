const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  CREATOR_PIPELINE_VERSION,
  buildAndValidateCreatorLibraryEntry
} = require('./creator-library-pipeline');
const {
  assertCreatorEntryIsSaveable,
  mergeCreatorLibraryEntry
} = require('./creator-library-store');
const {
  isStandardCreatorPack,
  renderCreatorPack
} = require('./generate-site');

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

const deletedScripts = [
  'scripts/add-record-creator-library-batch-2026-07-17.js',
  'scripts/regenerate-creator-library-part-production-2026-07-21.js',
  'scripts/apply-creator-library-part-visual-beats-2026-07-20.js',
  'scripts/fix-creator-library-field-consistency-2026-07-20.js',
  'scripts/update-resurrection-mary-creator-pack-2026-07-20.js'
];

let failures = 0;
const summaries = [];

main();

function main() {
  const beforeHashes = snapshotProtectedFiles();
  assertSingleBuildDefinition();
  assertCliWiring();
  assertStoreIsOnlyCreatorWriter();
  assertNoForbiddenSourcePatterns();
  assertDeletedScriptsRemoved();
  assertDeletedLegacyFunctionsRemoved();
  assertLegacyRendererIsolation();
  fixtureSlugs.forEach(validateDryRun);
  validateStoreRejections();
  assertProtectedFilesUnchanged(beforeHashes);
  report();
}

function validateDryRun(slug) {
  const story = stories.find((item) => item.slug === slug);
  if (!story) return fail(slug, 'missing fixture story');
  const category = categories.find((item) => item.slug === story.categorySlug);
  if (!category) return fail(slug, 'missing fixture category');

  const entry = buildAndValidateCreatorLibraryEntry(story, category);
  if (entry.creatorPipelineVersion !== CREATOR_PIPELINE_VERSION) fail(slug, 'missing single-path pipeline version');
  assertCreatorEntryIsSaveable(entry);
  const merged = mergeCreatorLibraryEntry(scripts, entry);
  if (merged[0].slug !== entry.slug) fail(slug, 'dry-run merge did not prepend the generated entry');
  if (merged.length !== scripts.length + (scripts.some((item) => item.slug === entry.slug) ? 0 : 1)) {
    fail(slug, 'dry-run merge changed an unexpected number of entries');
  }
  if (!isStandardCreatorPack(entry)) fail(slug, 'standard pack was not detected as standard');
  const html = renderCreatorPack(entry);
  if (!html.includes('Long-form Creator') || !html.includes('Short-form Creator')) {
    fail(slug, 'standard renderer did not produce expected Creator sections');
  }
  summaries.push({
    slug,
    version: entry.creatorPipelineVersion,
    longScenes: entry.visualGuide.length,
    shortScenes: entry.shortForm.scenes.length,
    saveable: true
  });
}

function validateStoreRejections() {
  const entry = buildFixtureEntry('maui-slows-the-sun-myth');
  assertRejects('legacy Pack', () => {
    const copy = clone(entry);
    delete copy.creatorPipelineVersion;
    assertCreatorEntryIsSaveable(copy);
  }, 'CREATOR_STORE_REJECTED_LEGACY_ENTRY');
  assertRejects('missing field Pack', () => {
    const copy = clone(entry);
    copy.visualGuide[0].narrationParts[0].visualBeats[0].imagePrompt = '';
    assertCreatorEntryIsSaveable(copy);
  }, 'CREATOR_LIBRARY_ENTRY_INVALID');
  assertRejects('runtime mismatch Pack', () => {
    const copy = clone(entry);
    copy.runtimePlan.totalWordCount += 1;
    assertCreatorEntryIsSaveable(copy);
  }, 'CREATOR_LIBRARY_ENTRY_INVALID');
}

function assertSingleBuildDefinition() {
  const files = listJsFiles(path.join(root, 'scripts'));
  const matches = files.flatMap((file) => {
    const source = readText(file);
    return (source.match(/function\s+buildCreatorLibraryEntry\s*\(/g) || []).map(() => path.relative(root, file));
  });
  if (matches.length !== 1 || matches[0] !== 'scripts\\creator-library-pipeline.js') {
    fail('single-definition', `buildCreatorLibraryEntry definitions: ${matches.join(', ') || 'none'}`);
  }
}

function assertCliWiring() {
  const latest = readText(path.join(root, 'scripts', 'add-latest-archive-to-creator-library-2026-07-20.js'));
  const one = readText(path.join(root, 'scripts', 'add-one-latest-unconverted-archive-to-creator-library-2026-07-20.js'));
  for (const [label, source] of [['add-latest', latest], ['add-one', one]]) {
    if (!source.includes("require('./creator-library-pipeline')")) fail(label, 'does not import creator-library-pipeline');
    if (!source.includes("require('./creator-library-store')")) fail(label, 'does not import creator-library-store');
    if (!source.includes('buildAndValidateCreatorLibraryEntry')) fail(label, 'does not call buildAndValidateCreatorLibraryEntry');
    if (!/saveCreatorLibraryEntr(?:y|ies)/.test(source)) fail(label, 'does not call the official store save function');
    if (/writeFileSync|fs\.promises\.writeFile|renameSync/.test(source)) fail(label, 'contains direct file writer');
    if (/runInNewContext|runInContext|createContext/.test(source) || source.includes('helper' + 'Source') || source.includes('source' + '.slice')) {
      fail(label, 'contains VM or source slicing behavior');
    }
  }
}

function assertStoreIsOnlyCreatorWriter() {
  const creatorFiles = [
    'scripts/add-latest-archive-to-creator-library-2026-07-20.js',
    'scripts/add-one-latest-unconverted-archive-to-creator-library-2026-07-20.js',
    'scripts/creator-library-pipeline.js',
    'scripts/creator-library-store.js'
  ];
  creatorFiles.forEach((relativePath) => {
    const source = readText(path.join(root, relativePath));
    const hasWriter = /writeFileSync|fs\.promises\.writeFile|renameSync/.test(source);
    if (relativePath === 'scripts/creator-library-store.js') {
      if (!hasWriter) fail(relativePath, 'store does not contain the official writer');
      return;
    }
    if (hasWriter) fail(relativePath, 'Creator Library writer exists outside store');
  });
}

function assertNoForbiddenSourcePatterns() {
  const officialFiles = [
    'scripts/add-latest-archive-to-creator-library-2026-07-20.js',
    'scripts/add-one-latest-unconverted-archive-to-creator-library-2026-07-20.js',
    'scripts/creator-library-pipeline.js',
    'scripts/creator-library-store.js'
  ];
  for (const relativePath of officialFiles) {
    const source = readText(path.join(root, relativePath));
    const forbidden = [
      `${'vm'}${'.runIn'}${'NewContext'}`,
      `${'vm'}${'.runIn'}${'Context'}`,
      `${'helper'}${'Source'}`,
      joinLiteral('source', '.slice'),
      joinLiteral('longformNarration', 'FromKnownStory'),
      joinLiteral('demeterCreatorNote', 'ForNarrationPart'),
      `${'function buildShorts'}${'Script'}`,
      `${'function shortFormProduction'}${'Plan'}`
    ];
    for (const pattern of forbidden) {
      if (source.includes(pattern)) fail(relativePath, `forbidden pattern found: ${pattern}`);
    }
  }
}

function assertDeletedScriptsRemoved() {
  deletedScripts.forEach((relativePath) => {
    if (fs.existsSync(path.join(root, relativePath))) fail(relativePath, 'deleted legacy script still exists');
  });
}

function assertDeletedLegacyFunctionsRemoved() {
  const scannedFiles = [
    'scripts/add-latest-archive-to-creator-library-2026-07-20.js',
    'scripts/add-one-latest-unconverted-archive-to-creator-library-2026-07-20.js',
    'scripts/creator-library-pipeline.js'
  ];
  const forbidden = [
    joinLiteral('longformNarration', 'FromKnownStory'),
    joinLiteral('demeterCreatorNote', 'ForNarrationPart'),
    'creatorNoteForNarrationPart',
    'topicAwareCreatorNoteForNarrationPart',
    'buildVisualGuide',
    'visualBeatsForNarrationPart',
    'visualBeatSeeds',
    'motionPromptForVisualBeat',
    'backgroundMusicForGeneratedScene',
    'voiceDirectionForGeneratedScene',
    'soundEffectForGeneratedScene',
    `${'buildShorts'}${'Script'}`,
    `${'buildShortScene'}${'Focuses'}`,
    `${'shortFormProduction'}${'Plan'}`,
    `${'shortSceneFocus'}${'FromLine'}`
  ];
  for (const relativePath of scannedFiles) {
    const source = readText(path.join(root, relativePath));
    for (const pattern of forbidden) {
      if (source.includes(pattern)) fail(relativePath, `legacy generation function remains: ${pattern}`);
    }
  }
}

function assertLegacyRendererIsolation() {
  const pipeline = readText(path.join(root, 'scripts', 'creator-library-pipeline.js'));
  const store = readText(path.join(root, 'scripts', 'creator-library-store.js'));
  if (pipeline.includes("require('./generate-site')") || store.includes("require('./generate-site')")) {
    fail('legacy-renderer', 'pipeline/store imports generate-site');
  }
  const standard = buildFixtureEntry('maui-slows-the-sun-myth');
  if (!isStandardCreatorPack(standard)) fail('legacy-renderer', 'standard fixture is not standard');
  const legacy = scripts.find((entry) => entry.creatorPipelineVersion !== CREATOR_PIPELINE_VERSION);
  if (!legacy) fail('legacy-renderer', 'missing legacy fixture');
  if (legacy && isStandardCreatorPack(legacy)) fail('legacy-renderer', 'legacy fixture detected as standard');
}

function buildFixtureEntry(slug) {
  const story = stories.find((item) => item.slug === slug);
  const category = categories.find((item) => item.slug === story.categorySlug);
  return buildAndValidateCreatorLibraryEntry(story, category);
}

function assertRejects(label, fn, expectedCode) {
  try {
    fn();
    fail(label, 'expected rejection but operation passed');
  } catch (error) {
    if (error.code !== expectedCode) fail(label, `expected ${expectedCode}, got ${error.code || error.message}`);
  }
}

function snapshotProtectedFiles() {
  return new Map([
    storiesPath,
    scriptsPath,
    categoriesPath,
    ...listHtmlFiles(path.join(root, 'scripts'))
  ].map((file) => [file, hashFile(file)]));
}

function assertProtectedFilesUnchanged(beforeHashes) {
  for (const [file, before] of beforeHashes.entries()) {
    if (before !== hashFile(file)) fail('protected-files', `changed ${path.relative(root, file)}`);
  }
}

function listJsFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listJsFiles(fullPath);
    return entry.isFile() && entry.name.endsWith('.js') ? [fullPath] : [];
  });
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
  return JSON.parse(readText(filePath));
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function joinLiteral(left, right) {
  return `${left}${right}`;
}

function fail(slug, message) {
  failures += 1;
  console.error(`[single-path:${slug}] ${message}`);
}

function report() {
  console.log('Creator Library single-path validation summaries:');
  for (const summary of summaries) {
    console.log(`- ${summary.slug}: version=${summary.version}, longScenes=${summary.longScenes}, shortScenes=${summary.shortScenes}, saveable=${summary.saveable}`);
  }
  if (failures) {
    console.error(`Creator Library single-path validation failed with ${failures} issue(s).`);
    process.exit(1);
  }
  console.log('Creator Library single-path validation passed.');
}
