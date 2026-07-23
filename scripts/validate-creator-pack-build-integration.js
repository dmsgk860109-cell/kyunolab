const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');
const { migrateCreatorPacksToFiles } = require('./migrate-creator-packs-to-files');
const { generateCreatorPacksForSlugs } = require('./generate-creator-pack');
const {
  calculateCreatorPackChecksum,
  listCreatorPackEntries,
  readCreatorPackManifest
} = require('./creator-library-store');

const root = path.resolve(__dirname, '..');
const representativeSlugs = [
  'maui-slows-the-sun-myth',
  'the-wedding-register-with-a-blank-witness-line',
  'the-salt-eyed-goat-of-the-market-books',
  'the-town-meeting-minutes-that-mention-tomorrow',
  'the-video-watch-history-with-one-impossible-second',
  'the-subway-maintenance-file-for-a-sealed-staircase',
  'why-signatures-act-like-proof-in-uncertain-stories'
];

function main() {
  const tempBase = fs.mkdtempSync(path.join(os.tmpdir(), 'kyunolab-creator-pack-build-integration-'));
  const legacyStore = path.join(tempBase, 'legacy-store');
  const generatedStore = path.join(tempBase, 'generated-store');
  const outputRoot = path.join(tempBase, 'site-output');
  const emptyStore = path.join(tempBase, 'empty-store');
  const failures = [];

  try {
    const legacyReport = migrateCreatorPacksToFiles({
      source: path.join(root, 'data', 'scripts.json'),
      outputRoot: legacyStore
    });
    assert(failures, 'legacy-conversion', legacyReport.total === 371, `expected 371 legacy packs, got ${legacyReport.total}`);
    assert(failures, 'legacy-conversion', legacyReport.manifestEntries === 371, `expected 371 manifest entries, got ${legacyReport.manifestEntries}`);

    const generatedReport = generateCreatorPacksForSlugs(representativeSlugs, { root: generatedStore, failFast: true });
    assert(failures, 'generated-store', generatedReport.failed === 0, `generated store failures: ${generatedReport.failed}`);
    assert(failures, 'generated-store', readCreatorPackManifest({ root: generatedStore }).packs.length === 7, 'expected 7 generated packs');

    const stats = runGenerateSiteInstrumented(generatedStore, outputRoot);
    assert(failures, 'build-access', stats.scriptsJsonReads === 0, `data/scripts.json reads during build: ${stats.scriptsJsonReads}`);
    assert(failures, 'build-access', stats.scriptsJsonWrites === 0, `data/scripts.json writes during build: ${stats.scriptsJsonWrites}`);
    assert(failures, 'build-access', stats.packReads >= 7, `expected individual pack reads, got ${stats.packReads}`);
    assert(failures, 'build-access', stats.packWrites === 0, `build wrote pack files: ${stats.packWrites}`);
    assert(failures, 'build-access', stats.manifestReads >= 1, `expected manifest reads, got ${stats.manifestReads}`);
    assert(failures, 'build-access', stats.manifestWrites === 0, `build wrote manifest: ${stats.manifestWrites}`);

    validateGeneratedSite(failures, generatedStore, outputRoot);
    validateStoreMissingFailure(failures, emptyStore, path.join(tempBase, 'empty-output'));
    validateSourceBoundaries(failures);

    if (failures.length) fail(failures);

    console.log('Creator Pack build integration validation passed.');
    console.log(JSON.stringify({
      legacyPacks: legacyReport.total,
      generatedPacks: generatedReport.total,
      detailHtmlChecked: representativeSlugs.length,
      scriptsJsonReads: stats.scriptsJsonReads,
      scriptsJsonWrites: stats.scriptsJsonWrites,
      packReads: stats.packReads,
      packWrites: stats.packWrites,
      manifestReads: stats.manifestReads,
      manifestWrites: stats.manifestWrites
    }, null, 2));
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
}

function runGenerateSiteInstrumented(creatorPackRoot, outputRoot) {
  const scriptsJsonPath = path.join(root, 'data', 'scripts.json');
  const manifestPath = path.join(creatorPackRoot, 'manifest.json');
  const stats = {
    scriptsJsonReads: 0,
    scriptsJsonWrites: 0,
    packReads: 0,
    packWrites: 0,
    manifestReads: 0,
    manifestWrites: 0
  };

  const originalArgv = process.argv;
  const originalReadFileSync = fs.readFileSync;
  const originalWriteFileSync = fs.writeFileSync;
  process.argv = [
    process.execPath,
    path.join(root, 'scripts', 'generate-site.js'),
    '--creator-pack-root',
    creatorPackRoot,
    '--output-root',
    outputRoot
  ];
  delete require.cache[require.resolve('./generate-site')];

  fs.readFileSync = function patchedReadFileSync(filePath, ...args) {
    const resolved = path.resolve(String(filePath));
    if (resolved === scriptsJsonPath) stats.scriptsJsonReads += 1;
    if (resolved === manifestPath) stats.manifestReads += 1;
    if (isPackFile(resolved, creatorPackRoot)) stats.packReads += 1;
    return originalReadFileSync.call(this, filePath, ...args);
  };
  fs.writeFileSync = function patchedWriteFileSync(filePath, ...args) {
    const resolved = path.resolve(String(filePath));
    if (resolved === scriptsJsonPath) stats.scriptsJsonWrites += 1;
    if (resolved === manifestPath) stats.manifestWrites += 1;
    if (isPackFile(resolved, creatorPackRoot)) stats.packWrites += 1;
    return originalWriteFileSync.call(this, filePath, ...args);
  };

  try {
    require('./generate-site').main();
  } finally {
    fs.readFileSync = originalReadFileSync;
    fs.writeFileSync = originalWriteFileSync;
    process.argv = originalArgv;
    delete require.cache[require.resolve('./generate-site')];
  }

  return stats;
}

function validateGeneratedSite(failures, creatorPackRoot, outputRoot) {
  const entries = listCreatorPackEntries({ root: creatorPackRoot });
  for (const entry of entries) {
    const htmlPath = path.join(outputRoot, 'scripts', `${entry.slug}.html`);
    assert(failures, 'detail-html', fs.existsSync(htmlPath), `missing detail HTML for ${entry.slug}`);
    if (!fs.existsSync(htmlPath)) continue;
    const html = fs.readFileSync(htmlPath, 'utf8');
    assert(failures, 'detail-html', html.includes('<title>'), `${entry.slug} missing title`);
    assert(failures, 'detail-html', html.includes(`https://kyunolab.com/scripts/${entry.slug}`), `${entry.slug} missing canonical URL`);
    assert(failures, 'detail-html', html.includes('Long-form Creator'), `${entry.slug} missing Long-form Creator`);
    assert(failures, 'detail-html', html.includes('Short-form Creator'), `${entry.slug} missing Short-form Creator`);
    assert(failures, 'detail-html', html.includes('Image Prompt'), `${entry.slug} missing production fields`);
  }

  const searchIndexPath = path.join(outputRoot, 'data', 'creator-library-search-index.json');
  const sitemapPath = path.join(outputRoot, 'sitemap.xml');
  assert(failures, 'metadata-output', fs.existsSync(searchIndexPath), 'missing Creator Library search index');
  assert(failures, 'metadata-output', fs.existsSync(sitemapPath), 'missing sitemap');
  assert(failures, 'metadata-output', !fs.existsSync(path.join(outputRoot, 'data', 'scripts.json')), 'data/scripts.json was written to output');
  assert(failures, 'metadata-output', !fs.existsSync(path.join(outputRoot, 'creator-packs.json')), 'combined creator-packs.json was written');

  if (fs.existsSync(searchIndexPath)) {
    const index = JSON.parse(fs.readFileSync(searchIndexPath, 'utf8'));
    for (const entry of entries) {
      assert(failures, 'search-index', index.some((item) => item.slug === entry.slug), `${entry.slug} missing from search index`);
    }
  }
  if (fs.existsSync(sitemapPath)) {
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    for (const entry of entries) {
      assert(failures, 'sitemap', sitemap.includes(`https://kyunolab.com/scripts/${entry.slug}`), `${entry.slug} missing from sitemap`);
    }
  }
}

function validateStoreMissingFailure(failures, emptyStore, outputRoot) {
  fs.mkdirSync(emptyStore, { recursive: true });
  const result = childProcess.spawnSync(process.execPath, [
    path.join(root, 'scripts', 'generate-site.js'),
    '--creator-pack-root',
    emptyStore,
    '--output-root',
    outputRoot
  ], { cwd: root, encoding: 'utf8' });
  assert(failures, 'store-missing', result.status !== 0, 'empty store build unexpectedly succeeded');
  assert(failures, 'store-missing', `${result.stderr}\n${result.stdout}`.includes('CREATOR_PACK_STORE_NOT_INITIALIZED'), 'missing explicit store initialization error');
}

function validateSourceBoundaries(failures) {
  const productionFiles = [
    'scripts/generate-site.js',
    'scripts/generate-creator-pack.js',
    'scripts/build-cloudflare-pages-dist.js',
    'scripts/verify-cloudflare-pages-dist.js'
  ];
  for (const relativePath of productionFiles) {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    if (relativePath !== 'scripts/build-cloudflare-pages-dist.js' && relativePath !== 'scripts/verify-cloudflare-pages-dist.js') {
      assert(failures, 'source-boundary', !source.includes('data/scripts.json'), `${relativePath} references data/scripts.json`);
      assert(failures, 'source-boundary', !/scripts\.json\s*fallback|legacyScripts|readLegacyScripts/i.test(source), `${relativePath} contains legacy fallback wording`);
    }
    assert(failures, 'source-boundary', !/all-packs\.json|scripts-v2\.json|creator-packs\.json/.test(source), `${relativePath} references combined Creator Pack JSON`);
  }
}

function isPackFile(filePath, creatorPackRoot) {
  const relative = path.relative(creatorPackRoot, filePath);
  return Boolean(relative)
    && !relative.startsWith('..')
    && !path.isAbsolute(relative)
    && relative.endsWith('.json')
    && path.basename(relative) !== 'manifest.json';
}

function assert(failures, test, condition, message) {
  if (!condition) failures.push({ test, message });
}

function fail(failures) {
  for (const failure of failures) console.error(`${failure.test}: ${failure.message}`);
  console.error(`Creator Pack build integration validation failed: ${failures.length}`);
  process.exit(1);
}

if (require.main === module) main();
