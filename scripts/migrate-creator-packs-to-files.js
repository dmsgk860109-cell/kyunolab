const fs = require('fs');
const path = require('path');
const {
  upsertCreatorPack,
  rebuildCreatorPackManifest,
  readCreatorPackManifest,
  getCreatorPackRoot,
  validateCreatorPackFile
} = require('./creator-library-store');

const root = path.resolve(__dirname, '..');

function migrateCreatorPacksToFiles(options = {}) {
  if (!options.source) {
    throw new Error('Migration requires an explicit --source path.');
  }
  const sourcePath = path.resolve(options.source);
  const outputRoot = options.apply
    ? path.join(root, 'data', 'creator-packs')
    : path.resolve(options.outputRoot || '');
  if (!options.apply && !options.outputRoot) {
    throw new Error('Migration requires --output-root unless --apply is explicitly provided.');
  }
  assertOutputRootIsWritable(outputRoot, options);
  const packs = readJson(sourcePath);
  if (!Array.isArray(packs)) throw new Error('Legacy source must be an array of Creator Packs.');
  assertUniqueSlugs(packs);

  const results = [];
  const failures = [];
  packs.forEach((pack) => {
    try {
      validateCreatorPackFile({
        ...pack,
        schemaVersion: pack.creatorPipelineVersion,
        storageSchemaVersion: 'creator-pack-file-v1'
      });
      results.push(upsertCreatorPack(pack, { root: outputRoot, deferManifest: true }));
    } catch (error) {
      failures.push({
        slug: pack?.slug || '',
        code: error.code || 'CREATOR_PACK_MIGRATION_FAILED',
        message: error.message,
        field: error.field
      });
    }
  });
  if (failures.length) {
    const error = new Error(`Creator Pack migration failed: ${failures.length}`);
    error.failures = failures;
    throw error;
  }
  const manifest = rebuildCreatorPackManifest({ root: outputRoot });
  return {
    sourcePath,
    outputRoot,
    total: packs.length,
    created: results.filter((item) => item.status === 'created').length,
    updated: results.filter((item) => item.status === 'updated').length,
    unchanged: results.filter((item) => item.status === 'unchanged').length,
    failed: failures.length,
    manifestEntries: manifest.packs.length,
    manifest
  };
}

function assertOutputRootIsWritable(outputRoot, options = {}) {
  const resolved = path.resolve(outputRoot);
  if (!options.apply && isInside(resolved, root)) {
    throw new Error(`Refusing non-apply migration inside repository: ${resolved}`);
  }
  if (fs.existsSync(resolved)) {
    const entries = fs.readdirSync(resolved);
    if (entries.length && !options.force) {
      throw new Error(`Output root is not empty: ${resolved}`);
    }
  } else {
    fs.mkdirSync(resolved, { recursive: true });
  }
}

function assertUniqueSlugs(packs) {
  const seen = new Set();
  for (const pack of packs) {
    if (!pack?.slug) throw new Error('Creator Pack is missing slug.');
    if (seen.has(pack.slug)) throw new Error(`Duplicate Creator Pack slug: ${pack.slug}`);
    seen.add(pack.slug);
  }
}

function isInside(child, parent) {
  const relative = path.relative(parent, child);
  return Boolean(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.outputRoot && !args.apply) {
    printUsage();
    process.exit(1);
  }
  try {
    const report = migrateCreatorPacksToFiles(args);
    const manifest = readCreatorPackManifest({ root: report.outputRoot });
    console.log(JSON.stringify({
      sourcePath: report.sourcePath,
      outputRoot: getCreatorPackRoot({ root: report.outputRoot }),
      total: report.total,
      created: report.created,
      updated: report.updated,
      unchanged: report.unchanged,
      failed: report.failed,
      manifestEntries: manifest.packs.length
    }, null, 2));
  } catch (error) {
    console.error(error.message);
    if (error.failures) console.error(JSON.stringify(error.failures.slice(0, 20), null, 2));
    process.exit(1);
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--source') args.source = argv[++index];
    else if (arg === '--output-root') args.outputRoot = argv[++index];
    else if (arg === '--apply') args.apply = true;
    else if (arg === '--force') args.force = true;
  }
  return args;
}

function printUsage() {
  console.log('Usage: node scripts/migrate-creator-packs-to-files.js --source data/scripts.json --output-root <TEMP_PATH>');
  console.log('       node scripts/migrate-creator-packs-to-files.js --source data/scripts.json --apply');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

if (require.main === module) main();

module.exports = {
  migrateCreatorPacksToFiles
};
