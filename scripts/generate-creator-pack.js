const fs = require('fs');
const path = require('path');
const {
  buildAndValidateCreatorLibraryEntry
} = require('./creator-library-pipeline');
const {
  loadCreatorLibraryEntries,
  upsertCreatorPack,
  rebuildCreatorPackManifest,
  getCreatorPackRoot,
  validateCreatorPackFile
} = require('./creator-library-store');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const categoriesPath = path.join(root, 'data', 'categories.json');

function generateCreatorPackForSlug(slug, options = {}) {
  const context = loadGenerationContext(options);
  const resolved = resolveStoryForSlug(slug, context);
  const publishedAt = options.publishedAt || resolved.existingPack?.publishedAt || resolved.existingPack?.updatedAt;
  const pack = buildAndValidateCreatorLibraryEntry(resolved.story, resolved.category, { publishedAt });
  validateCreatorPackFile({ ...pack, schemaVersion: pack.creatorPipelineVersion, storageSchemaVersion: 'creator-pack-file-v1' });
  if (options.dryRun) {
    return {
      slug: pack.slug,
      status: 'dry-run',
      filePath: path.join(getCreatorPackRoot(options), `${pack.slug}.json`),
      checksum: null,
      validation: 'passed'
    };
  }
  return upsertCreatorPack(pack, options);
}

function generateCreatorPacksForSlugs(slugs, options = {}) {
  const results = [];
  const failures = [];
  for (const slug of slugs) {
    try {
      results.push(generateCreatorPackForSlug(slug, { ...options, deferManifest: true }));
    } catch (error) {
      failures.push({
        slug,
        code: error.code || 'CREATOR_PACK_GENERATION_FAILED',
        message: error.message,
        stage: error.stage,
        field: error.field
      });
      if (options.failFast !== false) break;
    }
  }
  if (!options.dryRun && !failures.length) rebuildCreatorPackManifest(options);
  return {
    total: slugs.length,
    created: results.filter((item) => item.status === 'created').length,
    updated: results.filter((item) => item.status === 'updated').length,
    unchanged: results.filter((item) => item.status === 'unchanged').length,
    dryRun: results.filter((item) => item.status === 'dry-run').length,
    failed: failures.length,
    results,
    failures
  };
}

function loadGenerationContext(options = {}) {
  const stories = options.stories || readJson(storiesPath);
  const categories = options.categories || readJson(categoriesPath);
  const legacyEntries = options.legacyEntries || (fs.existsSync(path.join(root, 'data', 'scripts.json')) ? loadCreatorLibraryEntries() : []);
  return { stories, categories, legacyEntries };
}

function resolveStoryForSlug(slug, context) {
  const value = String(slug || '').trim();
  const existingPack = context.legacyEntries.find((entry) => entry.slug === value || entry.originalStorySlug === value);
  const storySlug = existingPack?.originalStorySlug || value.replace(/-youtube-script$/, '');
  const story = context.stories.find((item) => item.slug === storySlug);
  if (!story) {
    const error = new Error(`Archive story not found for Creator Pack slug: ${slug}`);
    error.code = 'CREATOR_PACK_STORY_NOT_FOUND';
    error.slug = slug;
    throw error;
  }
  const category = context.categories.find((item) => item.slug === story.categorySlug);
  if (!category) {
    const error = new Error(`Category not found for Archive story: ${story.slug}`);
    error.code = 'CREATOR_PACK_CATEGORY_NOT_FOUND';
    error.slug = slug;
    throw error;
  }
  return { story, category, existingPack };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.slug && !args.all) {
    printUsage();
    process.exit(1);
  }
  if (!args.outputRoot && !args.apply && !args.dryRun) {
    console.error('Refusing to write without --output-root or --apply.');
    process.exit(1);
  }
  const options = {
    root: args.apply ? undefined : args.outputRoot,
    dryRun: args.dryRun,
    failFast: args.failFast
  };
  const context = loadGenerationContext();
  const slugs = args.all
    ? context.stories.map((story) => story.slug)
    : [args.slug];
  const report = generateCreatorPacksForSlugs(slugs, { ...options, ...context });
  console.log(JSON.stringify({
    total: report.total,
    created: report.created,
    updated: report.updated,
    unchanged: report.unchanged,
    dryRun: report.dryRun,
    failed: report.failed,
    outputRoot: getCreatorPackRoot(options)
  }, null, 2));
  if (report.failed) {
    console.error(JSON.stringify(report.failures, null, 2));
    process.exit(1);
  }
}

function parseArgs(argv) {
  const args = { failFast: true };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--slug') args.slug = argv[++index];
    else if (arg === '--all') args.all = true;
    else if (arg === '--output-root') args.outputRoot = argv[++index];
    else if (arg === '--apply') args.apply = true;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--no-fail-fast') args.failFast = false;
  }
  return args;
}

function printUsage() {
  console.log('Usage: node scripts/generate-creator-pack.js --slug <archive-or-pack-slug> --output-root <path>');
  console.log('       node scripts/generate-creator-pack.js --all --output-root <path>');
  console.log('       node scripts/generate-creator-pack.js --slug <archive-or-pack-slug> --apply');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

if (require.main === module) main();

module.exports = {
  generateCreatorPackForSlug,
  generateCreatorPacksForSlugs,
  resolveStoryForSlug
};
