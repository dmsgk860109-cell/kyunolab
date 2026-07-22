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

main();

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.dryRun && !args.apply) {
    printUsage();
    process.exit(1);
  }

  const stories = readJson(storiesPath);
  const categories = readJson(categoriesPath);
  const entries = loadCreatorLibraryEntries();
  const plan = buildPlan({ entries, stories, categories, args });
  printSummary(plan);

  if (args.dryRun) {
    if (plan.failed.length) process.exitCode = 1;
    return;
  }
  if (plan.failed.length) {
    console.error('Apply stopped: Short-form Image/Motion fix plan contains failed entries.');
    process.exit(1);
  }
  applyPlanInBatches({ entries, ready: plan.ready, batchSize: args.batchSize || defaultBatchSize });
}

function buildPlan({ entries, stories, categories, args }) {
  const targets = selectTargets(entries, args);
  const plan = {
    total: entries.length,
    targets: targets.length,
    ready: [],
    unchanged: [],
    failed: [],
    changedScenes: 0
  };

  for (const entry of targets) {
    try {
      if (entry.creatorPipelineVersion !== CREATOR_PIPELINE_VERSION) throw failure('creatorPipelineVersion is not single-path-v1');
      const story = stories.find((item) => item.slug === entry.originalStorySlug);
      if (!story) throw failure(`Archive story missing: ${entry.originalStorySlug}`);
      const category = categories.find((item) => item.slug === (entry.creatorCategorySlug || story.categorySlug));
      if (!category) throw failure(`Creator category missing: ${entry.creatorCategorySlug || story.categorySlug}`);

      const generated = buildAndValidateCreatorLibraryEntry(prepareStoryForMigrationInput(story), category, {
        publishedAt: entry.publishedAt || entry.updatedAt
      });
      const fixed = mergeShortformImageAndMotion(entry, generated);
      assertOnlyAllowedFieldsChanged(entry, fixed);
      assertCreatorEntryIsSaveable(fixed);
      const changedCount = countChangedShortScenes(entry, fixed);
      if (changedCount) {
        plan.ready.push(fixed);
        plan.changedScenes += changedCount;
      } else {
        plan.unchanged.push(entry);
      }
    } catch (error) {
      plan.failed.push({
        slug: entry.slug || 'unknown',
        originalStorySlug: entry.originalStorySlug || '',
        code: error.code || 'SHORTFORM_FIX_FAILED',
        field: error.field || '',
        sceneIndex: error.sceneIndex || '',
        message: error.message || String(error)
      });
    }
  }
  return plan;
}

function mergeShortformImageAndMotion(existing, generated) {
  const existingScenes = existing.shortForm?.scenes || [];
  const generatedScenes = generated.shortForm?.scenes || [];
  if (existingScenes.length !== 5 || generatedScenes.length !== 5) {
    const error = failure('Short-form scene count must be 5 in both existing and generated entries');
    error.field = 'shortForm.scenes';
    throw error;
  }
  const fixed = clone(existing);
  fixed.shortForm = {
    ...fixed.shortForm,
    scenes: existingScenes.map((scene, index) => ({
      ...scene,
      imagePrompt: generatedScenes[index].imagePrompt,
      motionPrompt: generatedScenes[index].motionPrompt
    }))
  };
  fixed.pipelineDiagnostics = {
    ...(fixed.pipelineDiagnostics || {}),
    shortformImagePromptFixedAt: '2026-07-23',
    shortformImagePromptSource: 'single-path-v1-shortform'
  };
  return fixed;
}

function assertOnlyAllowedFieldsChanged(before, after) {
  const cleanBefore = stripAllowedFields(before);
  const cleanAfter = stripAllowedFields(after);
  if (JSON.stringify(cleanBefore) !== JSON.stringify(cleanAfter)) {
    const error = failure('Fix changed fields outside shortForm.scenes[].imagePrompt and motionPrompt');
    error.field = 'protectedFields';
    throw error;
  }
}

function stripAllowedFields(entry) {
  const copy = clone(entry);
  delete copy.pipelineDiagnostics?.shortformImagePromptFixedAt;
  delete copy.pipelineDiagnostics?.shortformImagePromptSource;
  if (copy.shortForm?.scenes) {
    copy.shortForm.scenes = copy.shortForm.scenes.map((scene) => {
      const next = { ...scene };
      delete next.imagePrompt;
      delete next.motionPrompt;
      return next;
    });
  }
  return copy;
}

function countChangedShortScenes(before, after) {
  const beforeScenes = before.shortForm?.scenes || [];
  const afterScenes = after.shortForm?.scenes || [];
  return afterScenes.filter((scene, index) => (
    scene.imagePrompt !== beforeScenes[index]?.imagePrompt
    || scene.motionPrompt !== beforeScenes[index]?.motionPrompt
  )).length;
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
    assertUnchangedSlugSet(current, next);
    saveCreatorLibraryEntries(batch, { currentEntries: current, preserveOrder: true });
    current = next;
    console.log(`Applied batch ${batchIndex + 1}/${batches.length}: ${batch.map((entry) => entry.slug).join(', ')}`);
  });
  console.log(`Short-form Image/Motion fix applied: ${ready.length} Creator Library entries.`);
}

function assertUnchangedSlugSet(before, after) {
  const beforeSlugs = before.map((entry) => entry.slug).sort();
  const afterSlugs = after.map((entry) => entry.slug).sort();
  if (JSON.stringify(beforeSlugs) !== JSON.stringify(afterSlugs)) {
    throw new Error('Fix would change the Creator Library slug set.');
  }
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

function selectTargets(entries, args) {
  if (args.slugs.length) {
    const wanted = new Set(args.slugs);
    return entries.filter((entry) => wanted.has(entry.slug) || wanted.has(entry.originalStorySlug));
  }
  if (args.all) return entries;
  return entries.slice(0, args.batchSize || defaultBatchSize);
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    apply: false,
    all: false,
    slugs: [],
    batchSize: defaultBatchSize
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--apply') args.apply = true;
    else if (arg === '--all') args.all = true;
    else if (arg === '--batch-size') args.batchSize = Number(argv[++index] || defaultBatchSize);
    else if (arg === '--slugs') {
      while (argv[index + 1] && !argv[index + 1].startsWith('--')) args.slugs.push(argv[++index]);
    } else {
      args.slugs.push(arg);
    }
  }
  return args;
}

function printSummary(plan) {
  console.log(`Total Pack count: ${plan.total}`);
  console.log(`Targets: ${plan.targets}`);
  console.log(`READY: ${plan.ready.length}`);
  console.log(`UNCHANGED: ${plan.unchanged.length}`);
  console.log(`Changed short scenes: ${plan.changedScenes}`);
  console.log(`FAILED: ${plan.failed.length}`);
  plan.failed.slice(0, 50).forEach((item) => {
    console.error(`[${item.code}] ${item.slug} scene=${item.sceneIndex} field=${item.field}: ${item.message}`);
  });
}

function printUsage() {
  console.log('Usage: node scripts/fix-creator-library-shortform-image-prompts.js --dry-run|--apply [--all] [--batch-size 10] [--slugs slug...]');
}

function firstNonEmptyString(values) {
  return values.map((value) => String(value || '').replace(/\s+/g, ' ').trim()).find(Boolean) || '';
}

function failure(message) {
  const error = new Error(message);
  error.code = 'SHORTFORM_IMAGE_PROMPT_FIX_FAILED';
  return error;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
