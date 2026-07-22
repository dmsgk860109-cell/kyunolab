const fs = require('fs');
const path = require('path');
const {
  buildAndValidateCreatorLibraryEntry,
  CREATOR_PIPELINE_VERSION
} = require('./creator-library-pipeline');
const {
  loadCreatorLibraryEntries,
  saveCreatorLibraryEntries,
  assertCreatorEntryIsSaveable,
  mergeCreatorLibraryEntries
} = require('./creator-library-store');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const categoriesPath = path.join(root, 'data', 'categories.json');
const defaultBatchSize = 10;

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.dryRun && !args.apply) {
    printUsage();
    process.exit(1);
  }

  const stories = readJson(storiesPath);
  const categories = readJson(categoriesPath);
  const entries = loadCreatorLibraryEntries();
  const plan = buildMigrationPlan({ entries, stories, categories, args });
  printPlanSummary(plan);

  if (args.dryRun) {
    if (plan.failed.length) process.exitCode = 1;
    return;
  }

  if (plan.failed.length) {
    console.error('Apply stopped: migration plan contains failed or blocked entries.');
    process.exit(1);
  }

  applyPlanInBatches({ entries, ready: plan.ready, batchSize: args.batchSize || defaultBatchSize });
}

function buildMigrationPlan({ entries, stories, categories, args }) {
  const targets = selectTargets(entries, args);
  const plan = {
    total: entries.length,
    migrated: [],
    ready: [],
    blockedInput: [],
    blockedMapping: [],
    invalidExisting: [],
    failedPipeline: [],
    failed: [],
    byContentType: {}
  };

  for (const entry of targets) {
    if (!args.force && entry.creatorPipelineVersion === CREATOR_PIPELINE_VERSION) {
      plan.migrated.push(entry);
      continue;
    }
    const classified = classifyEntry({ entry, stories, categories });
    if (classified.status !== 'READY') {
      pushFailure(plan, classified.status, entry, classified.error);
      continue;
    }
    try {
      const generated = buildAndValidateCreatorLibraryEntry(prepareStoryForMigrationInput(classified.story), classified.category, {
        publishedAt: entry.publishedAt || entry.updatedAt
      });
      const migrated = mergeMigratedEntry(entry, generated);
      assertCreatorEntryIsSaveable(migrated);
      plan.ready.push(migrated);
      const contentType = migrated.pipelineDiagnostics?.contentType || classified.story.storyBrief?.contentType || classified.story.categorySlug || 'unknown';
      plan.byContentType[contentType] = (plan.byContentType[contentType] || 0) + 1;
    } catch (error) {
      pushFailure(plan, 'FAILED_PIPELINE', entry, error);
    }
  }

  return plan;
}

function classifyEntry({ entry, stories, categories }) {
  if (!entry || typeof entry !== 'object' || !entry.slug) {
    return { status: 'INVALID_EXISTING', error: failureObject('entry', 'INVALID_EXISTING', 'missing slug') };
  }
  if (!entry.originalStorySlug) {
    return { status: 'INVALID_EXISTING', error: failureObject(entry.slug, 'INVALID_EXISTING', 'missing originalStorySlug') };
  }
  const story = stories.find((item) => item.slug === entry.originalStorySlug);
  if (!story) {
    return { status: 'BLOCKED_MAPPING', error: failureObject(entry.slug, 'BLOCKED_MAPPING', `missing Archive Story ${entry.originalStorySlug}`) };
  }
  const category = categories.find((item) => item.slug === (entry.creatorCategorySlug || story.categorySlug));
  if (!category) {
    return { status: 'BLOCKED_MAPPING', error: failureObject(entry.slug, 'BLOCKED_MAPPING', `missing category ${entry.creatorCategorySlug || story.categorySlug}`) };
  }
  if (!story.storyBrief && !story.contentDNA) {
    return { status: 'BLOCKED_INPUT', error: failureObject(entry.slug, 'BLOCKED_INPUT', 'missing Story Brief or content DNA') };
  }
  return { status: 'READY', entry, story, category };
}

function prepareStoryForMigrationInput(story) {
  const clone = { ...story };
  const sourceContext = firstNonEmptyString([
    story.publicSourceBasis,
    story.publicSourceNoteSeed,
    story.publicArticlePlan?.publicSourceNote,
    story.storyBrief?.cultureOrContext,
    story.contentDNA?.culturalFrame,
    ...(story.sourceNotes?.sharedVerifiedPoints || []),
    ...(story.sourceNotes?.sourceLimits || []),
    ...(story.sourceNotes?.variants || []),
    ...(story.researchSources || []).map((source) => [source.title, source.supports || source.note].filter(Boolean).join(' - '))
  ]);
  if (sourceContext && !clone.publicSourceBasis && !clone.publicSourceNoteSeed && !clone.publicArticlePlan?.publicSourceNote && !clone.storyBrief?.cultureOrContext) {
    clone.publicSourceBasis = sourceContext;
  }
  if (!clone.setting && !clone.storyBrief?.setting) {
    clone.setting = firstNonEmptyString([
      story.sceneAnchor,
      story.contentDNA?.sceneAnchor,
      story.contentDNA?.culturalFrame,
      story.category,
      story.categorySlug
    ]);
  }
  if (!clone.storyBrief?.keyActors?.length && !clone.contentDNA?.keyActors?.length) {
    clone.contentDNA = {
      ...(clone.contentDNA || {}),
      keyActors: [
        story.title,
        story.primaryTag,
        ...(story.subjectSpecificVocabulary || []),
        ...(story.contentDNA?.subjectSpecificVocabulary || [])
      ].filter(Boolean).slice(0, 5)
    };
  }
  return clone;
}

function firstNonEmptyString(values) {
  return values.map((value) => String(value || '').replace(/\s+/g, ' ').trim()).find(Boolean) || '';
}

function mergeMigratedEntry(existing, generated) {
  const preserved = pick(existing, [
    'id',
    'slug',
    'contentType',
    'originalStorySlug',
    'title',
    'seoTitle',
    'metaDescription',
    'genre',
    'creatorCategorySlug',
    'publishedAt',
    'updatedAt',
    'tags',
    'deck',
    'logline',
    'coreMotif',
    'mainSubject',
    'setting',
    'mood',
    'difficulty',
    'usageNote',
    'canonicalPath',
    'url'
  ]);
  return {
    ...generated,
    ...preserved,
    creatorPipelineVersion: CREATOR_PIPELINE_VERSION,
    longformScript: generated.longformScript,
    shortsScript: generated.shortsScript,
    shortSceneFocuses: generated.shortSceneFocuses,
    shortForm: generated.shortForm,
    imagePrompts: generated.imagePrompts,
    motionPrompts: generated.motionPrompts,
    visualGuide: generated.visualGuide,
    runtimePlan: generated.runtimePlan,
    thumbnailIdeas: generated.thumbnailIdeas,
    subtitleLines: generated.subtitleLines,
    pipelineDiagnostics: {
      ...(generated.pipelineDiagnostics || {}),
      migratedFromLegacy: existing.creatorPipelineVersion !== CREATOR_PIPELINE_VERSION,
      migratedAt: '2026-07-22'
    }
  };
}

function applyPlanInBatches({ entries, ready, batchSize }) {
  let current = entries;
  const batches = [];
  for (let index = 0; index < ready.length; index += batchSize) {
    batches.push(ready.slice(index, index + batchSize));
  }

  batches.forEach((batch, batchIndex) => {
    batch.forEach(assertCreatorEntryIsSaveable);
    const next = mergeCreatorLibraryEntries(current, batch, { preserveOrder: true });
    assertUnchangedIdentitySet(current, next);
    saveCreatorLibraryEntries(batch, { currentEntries: current, preserveOrder: true });
    current = next;
    console.log(`Applied batch ${batchIndex + 1}/${batches.length}: ${batch.map((entry) => entry.slug).join(', ')}`);
  });
  console.log(`Migration applied: ${ready.length} Creator Library entries.`);
}

function assertUnchangedIdentitySet(before, after) {
  const beforeSlugs = before.map((entry) => entry.slug).sort();
  const afterSlugs = after.map((entry) => entry.slug).sort();
  if (JSON.stringify(beforeSlugs) !== JSON.stringify(afterSlugs)) {
    throw new Error('Migration would change the Creator Library slug set.');
  }
}

function selectTargets(entries, args) {
  if (args.slugs.length) {
    const wanted = new Set(args.slugs);
    return entries.filter((entry) => wanted.has(entry.slug) || wanted.has(entry.originalStorySlug));
  }
  if (args.all) return entries;
  return entries.filter((entry) => entry.creatorPipelineVersion !== CREATOR_PIPELINE_VERSION).slice(0, args.batchSize || defaultBatchSize);
}

function pushFailure(plan, status, entry, error) {
  const item = {
    status,
    slug: entry?.slug || 'unknown',
    originalStorySlug: entry?.originalStorySlug || '',
    code: error?.code || status,
    stage: error?.stage || 'migration',
    field: error?.field || '',
    sceneIndex: error?.sceneIndex || '',
    partIndex: error?.partIndex || '',
    beatIndex: error?.beatIndex || '',
    message: error?.message || String(error || status)
  };
  const key = status[0].toLowerCase() + status.slice(1).replace(/_([A-Z])/g, (_, letter) => letter);
  const bucket = {
    BLOCKED_INPUT: 'blockedInput',
    BLOCKED_MAPPING: 'blockedMapping',
    INVALID_EXISTING: 'invalidExisting',
    FAILED_PIPELINE: 'failedPipeline'
  }[status] || key;
  plan[bucket].push(item);
  plan.failed.push(item);
}

function printPlanSummary(plan) {
  console.log(`Total Pack count: ${plan.total}`);
  console.log(`MIGRATED: ${plan.migrated.length}`);
  console.log(`READY: ${plan.ready.length}`);
  console.log(`BLOCKED_INPUT: ${plan.blockedInput.length}`);
  console.log(`BLOCKED_MAPPING: ${plan.blockedMapping.length}`);
  console.log(`INVALID_EXISTING: ${plan.invalidExisting.length}`);
  console.log(`FAILED_PIPELINE: ${plan.failedPipeline.length}`);
  console.log(`contentType counts: ${JSON.stringify(plan.byContentType)}`);
  plan.failed.forEach((item) => {
    console.error(`${item.status}: ${item.slug} | original=${item.originalStorySlug} | stage=${item.stage} | code=${item.code} | field=${item.field || 'n/a'} | scene=${item.sceneIndex || 'n/a'} | part=${item.partIndex || 'n/a'} | beat=${item.beatIndex || 'n/a'} | ${item.message}`);
  });
}

function parseArgs(argv) {
  const args = { dryRun: false, apply: false, all: false, force: false, slugs: [], batchSize: defaultBatchSize };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--apply') args.apply = true;
    else if (arg === '--all') args.all = true;
    else if (arg === '--force') args.force = true;
    else if (arg === '--slugs') args.slugs = String(argv[++index] || '').split(',').map((slug) => slug.trim()).filter(Boolean);
    else if (arg === '--batch-size') args.batchSize = Math.max(1, Number(argv[++index] || defaultBatchSize));
  }
  return args;
}

function printUsage() {
  console.log('Usage: node scripts/migrate-creator-library-single-path.js --dry-run --all');
  console.log('Usage: node scripts/migrate-creator-library-single-path.js --dry-run --slugs <slug1,slug2>');
  console.log('Usage: node scripts/migrate-creator-library-single-path.js --apply --all --batch-size 10');
}

function failureObject(slug, code, message) {
  const error = new Error(message);
  error.slug = slug;
  error.code = code;
  error.stage = 'migration';
  return error;
}

function pick(source, fields) {
  return fields.reduce((result, field) => {
    if (Object.prototype.hasOwnProperty.call(source, field)) result[field] = source[field];
    return result;
  }, {});
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

if (require.main === module) {
  main();
}

module.exports = {
  buildMigrationPlan,
  mergeMigratedEntry
};
