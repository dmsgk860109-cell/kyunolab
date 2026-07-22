const fs = require('fs');
const path = require('path');
const {
  normalizeCreatorStoryInput,
  classifyCreatorContentType,
  sanitizeCreatorInputText,
  validateNormalizedCreatorInput
} = require('./creator-library-input');
const {
  buildCreatorLibraryEntry
} = require('./add-latest-archive-to-creator-library-2026-07-20');

const root = path.resolve(__dirname, '..');
const stories = readJson(path.join(root, 'data', 'stories.json'));
const scripts = readJson(path.join(root, 'data', 'scripts.json'));
const categories = readJson(path.join(root, 'data', 'categories.json'));

const targetStorySlugs = [
  'maui-slows-the-sun-myth',
  'demeter-and-persephone-myth',
  'osiris-isis-resurrection-myth',
  'cicada-3301-internet-puzzle'
];

const expectedSchemaKeys = [
  'schemaVersion',
  'slug',
  'topic',
  'categorySlug',
  'categoryName',
  'contentType',
  'knownNames',
  'keyActors',
  'setting',
  'coreProblem',
  'eventSequence',
  'turningPoint',
  'outcome',
  'reportedVariants',
  'sourceContext',
  'meaningOptions',
  'visualVocabulary',
  'forbiddenInventions',
  'sourceEvidence',
  'sourceFieldMap',
  'missingRequiredFields',
  'warnings'
];

const arrayFields = [
  'knownNames',
  'keyActors',
  'setting',
  'coreProblem',
  'eventSequence',
  'turningPoint',
  'outcome',
  'reportedVariants',
  'sourceContext',
  'meaningOptions',
  'visualVocabulary',
  'forbiddenInventions',
  'sourceEvidence',
  'missingRequiredFields',
  'warnings'
];

const stringFields = [
  'schemaVersion',
  'slug',
  'topic',
  'categorySlug',
  'categoryName',
  'contentType'
];

let failures = 0;
const summaries = [];

main();

function main() {
  assertNoForbiddenNormalizerBranches();
  assertOfficialEntrypoints();
  assertSanitizer();
  assertUnclassifiedPath();

  for (const slug of targetStorySlugs) {
    validateTargetStory(slug);
  }

  report();
}

function validateTargetStory(slug) {
  const story = stories.find((item) => item.slug === slug);
  if (!story) return fail(slug, 'missing target story');
  const category = categories.find((item) => item.slug === story.categorySlug) || {};
  const input = normalizeCreatorStoryInput(story, category);
  validateNormalizedCreatorInput(input);

  assertSchema(input, slug);
  assertNoUndefined(input, slug);
  assertPreservedStoryValues(input, story, slug);
  assertCommonInputQuality(input, slug);
  assertBuildPathKeepsNormalizedInputOutOfScript(story, category, input, slug);

  summaries.push({
    slug,
    contentType: input.contentType,
    knownNames: input.knownNames.length,
    eventSequence: input.eventSequence.length,
    missingRequiredFields: input.missingRequiredFields,
    warnings: input.warnings
  });
}

function assertSchema(input, slug) {
  const keys = Object.keys(input);
  const missingKeys = expectedSchemaKeys.filter((key) => !keys.includes(key));
  const extraKeys = keys.filter((key) => !expectedSchemaKeys.includes(key));
  if (missingKeys.length) fail(slug, `missing schema keys: ${missingKeys.join(', ')}`);
  if (extraKeys.length) fail(slug, `unexpected schema keys: ${extraKeys.join(', ')}`);

  for (const field of arrayFields) {
    if (!Array.isArray(input[field])) fail(slug, `${field} must be an array`);
  }
  for (const field of stringFields) {
    if (typeof input[field] !== 'string') fail(slug, `${field} must be a string`);
  }
  if (!input.sourceFieldMap || typeof input.sourceFieldMap !== 'object' || Array.isArray(input.sourceFieldMap)) {
    fail(slug, 'sourceFieldMap must be an object');
  }
}

function assertNoUndefined(value, slug, pathName = 'input') {
  if (value === undefined) {
    fail(slug, `${pathName} is undefined`);
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    assertNoUndefined(child, slug, `${pathName}.${key}`);
  }
}

function assertPreservedStoryValues(input, story, slug) {
  if (input.slug !== story.slug) fail(slug, 'slug was not preserved');
  const briefTopic = sanitizeCreatorInputText(story.storyBrief?.topic);
  if (briefTopic && input.topic !== briefTopic) fail(slug, 'topic was not preserved from Story Brief');

  const expectedNames = (story.storyBrief?.knownNames || []).map(sanitizeCreatorInputText).filter(Boolean);
  for (const name of expectedNames) {
    if (!input.knownNames.includes(name)) fail(slug, `knownNames missing ${name}`);
  }
}

function assertCommonInputQuality(input, slug) {
  if (!input.contentType) fail(slug, 'contentType was not classified');
  if (!input.eventSequence.length) fail(slug, 'eventSequence is empty');
  if (!input.sourceContext.length) fail(slug, 'sourceContext is empty');
  if (!input.visualVocabulary.length) fail(slug, 'visualVocabulary is empty');
  if (!Object.keys(input.sourceFieldMap).length) fail(slug, 'sourceFieldMap is empty');
  const packed = JSON.stringify(input);
  if (/this article follows|the article should|the heading keeps the focus|source-aware kyunolab record/i.test(packed)) {
    fail(slug, 'internal template phrase remains in normalized input');
  }
}

function assertBuildPathKeepsNormalizedInputOutOfScript(story, category, normalizedInput, slug) {
  const script = buildCreatorLibraryEntry(story, category, { normalizedInput });
  if (!script || script.slug !== `${story.slug}-youtube-script`) fail(slug, 'buildCreatorLibraryEntry failed through normalized path');
  if (Object.prototype.hasOwnProperty.call(script, 'normalizedInput')) fail(slug, 'normalizedInput was stored on script output');
  if (Object.prototype.hasOwnProperty.call(script, 'sourceFieldMap')) fail(slug, 'sourceFieldMap was stored on script output');
  if (Object.prototype.hasOwnProperty.call(script, 'missingRequiredFields')) fail(slug, 'missingRequiredFields was stored on script output');
  if (Object.prototype.hasOwnProperty.call(script, 'warnings')) fail(slug, 'warnings were stored on script output');
}

function assertOfficialEntrypoints() {
  const latestSource = readText(path.join(root, 'scripts', 'add-latest-archive-to-creator-library-2026-07-20.js'));
  const addOneSource = readText(path.join(root, 'scripts', 'add-one-latest-unconverted-archive-to-creator-library-2026-07-20.js'));

  if (!/require\(['"]\.\/creator-library-input['"]\)/.test(latestSource)) {
    fail('add-latest', 'missing common input normalizer import');
  }
  if (!/normalizeCreatorStoryInput/.test(latestSource)) {
    fail('add-latest', 'does not use normalizeCreatorStoryInput');
  }
  if (!/if\s*\(require\.main\s*===\s*module\)/.test(latestSource)) {
    fail('add-latest', 'require.main guard is missing');
  }
  if (!/module\.exports\s*=\s*{[\s\S]*buildCreatorLibraryEntry/.test(latestSource)) {
    fail('add-latest', 'buildCreatorLibraryEntry export is missing');
  }
  if (!/require\(['"]\.\/add-latest-archive-to-creator-library-2026-07-20['"]\)/.test(addOneSource)) {
    fail('add-one', 'does not import official generator module');
  }
  if (!/normalizeCreatorStoryInput/.test(addOneSource)) {
    fail('add-one', 'does not use normalizeCreatorStoryInput');
  }
  if (/\bvm\b|runInContext|createContext|helperSource|source\.slice/.test(addOneSource)) {
    fail('add-one', 'VM slicing or source parsing remains');
  }
}

function assertNoForbiddenNormalizerBranches() {
  const source = readText(path.join(root, 'scripts', 'creator-library-input.js'));
  const forbidden = [
    'maui-slows-the-sun-myth',
    'demeter-and-persephone-myth',
    'osiris-isis-resurrection-myth',
    'cicada-3301-internet-puzzle',
    'Maui Slows the Sun',
    'Demeter and Persephone',
    'Osiris and Isis',
    'Cicada 3301'
  ];
  for (const phrase of forbidden) {
    if (source.includes(phrase)) fail('creator-library-input.js', `forbidden subject-specific normalizer branch found: ${phrase}`);
  }
  if (/story\.slug\s*(===|!==)/.test(source)) {
    fail('creator-library-input.js', 'direct story.slug condition found');
  }
}

function assertSanitizer() {
  const samples = [
    'This article follows the internal structure.',
    'The article should explain this later.',
    'The heading keeps the focus narrow.',
    'source-aware Kyunolab record',
    'placeholder'
  ];
  for (const sample of samples) {
    if (sanitizeCreatorInputText(sample)) fail('sanitizeCreatorInputText', `template phrase was not removed: ${sample}`);
  }
}

function assertUnclassifiedPath() {
  const input = normalizeCreatorStoryInput({
    slug: 'unclassified-test-record',
    title: 'Unclassified Test Record',
    contentType: 'story',
    storyBrief: {
      topic: 'Unclassified Test Record',
      knownNames: ['Unclassified Test Record'],
      coreStoryElements: ['A confirmed element exists.']
    }
  }, {});
  if (input.contentType !== '') fail('unclassified-test-record', 'unclassified input should not invent a contentType');
  if (!input.missingRequiredFields.includes('contentType')) fail('unclassified-test-record', 'missing contentType was not reported');
}

function report() {
  for (const summary of summaries) {
    console.log(`${summary.slug}: contentType=${summary.contentType}; knownNames=${summary.knownNames}; eventSequence=${summary.eventSequence}; missing=${summary.missingRequiredFields.join('|') || 'none'}; warnings=${summary.warnings.join('|') || 'none'}`);
  }

  if (failures) {
    console.error(`Creator Library input validation failed: ${failures} issue(s).`);
    process.exit(1);
  }
  console.log('Creator Library input validation passed.');
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
