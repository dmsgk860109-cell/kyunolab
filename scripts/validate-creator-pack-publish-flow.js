const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');
const {
  generateCreatorPackForSlug,
  generateCreatorPacksForSlugs
} = require('./generate-creator-pack');
const {
  calculateCreatorPackChecksum,
  listCreatorPackEntries,
  readCreatorPack,
  readCreatorPackManifest,
  upsertCreatorPack
} = require('./creator-library-store');

const root = path.resolve(__dirname, '..');
const initialSlugs = [
  'maui-slows-the-sun-myth',
  'the-wedding-register-with-a-blank-witness-line',
  'the-salt-eyed-goat-of-the-market-books',
  'the-town-meeting-minutes-that-mention-tomorrow',
  'the-video-watch-history-with-one-impossible-second',
  'the-subway-maintenance-file-for-a-sealed-staircase',
  'why-signatures-act-like-proof-in-uncertain-stories'
];
const newSlug = 'osiris-isis-resurrection-myth';

function main() {
  const tempBase = fs.mkdtempSync(path.join(os.tmpdir(), 'kyunolab-creator-pack-publish-flow-'));
  const storeRoot = path.join(tempBase, 'store');
  const outputRoot = path.join(tempBase, 'site-output');
  const failures = [];

  try {
    const initialReport = generateCreatorPacksForSlugs(initialSlugs, { root: storeRoot, failFast: true });
    assert(failures, 'initial-store', initialReport.failed === 0, `initial generation failed: ${initialReport.failed}`);
    assert(failures, 'initial-store', readCreatorPackManifest({ root: storeRoot }).packs.length === 7, 'expected 7 initial manifest entries');

    const initialSnapshot = snapshotPackFiles(storeRoot);
    const newStats = traceScriptsJsonAccess(() => generateCreatorPackForSlug(newSlug, { root: storeRoot }));
    assert(failures, 'new-pack', newStats.result.status === 'created', `expected created, got ${newStats.result.status}`);
    assert(failures, 'new-pack', newStats.scriptsJsonReads === 0, `new publish read data/scripts.json ${newStats.scriptsJsonReads} time(s)`);
    assert(failures, 'new-pack', newStats.scriptsJsonWrites === 0, `new publish wrote data/scripts.json ${newStats.scriptsJsonWrites} time(s)`);
    assert(failures, 'new-pack', readCreatorPackManifest({ root: storeRoot }).packs.length === 8, 'expected 8 entries after new pack');
    assertExistingPackFilesUnchanged(failures, 'new-pack', initialSnapshot, snapshotPackFiles(storeRoot));
    assertNoSubdirectories(failures, storeRoot);

    const afterNewSnapshot = snapshotPackFiles(storeRoot);
    const updateStats = traceScriptsJsonAccess(() => generateCreatorPackForSlug(initialSlugs[0], {
      root: storeRoot,
      publishedAt: '1999-01-01'
    }));
    assert(failures, 'existing-update', updateStats.result.status === 'updated', `expected updated, got ${updateStats.result.status}`);
    assert(failures, 'existing-update', updateStats.scriptsJsonReads === 0, `existing update read data/scripts.json ${updateStats.scriptsJsonReads} time(s)`);
    assert(failures, 'existing-update', updateStats.scriptsJsonWrites === 0, `existing update wrote data/scripts.json ${updateStats.scriptsJsonWrites} time(s)`);
    assertOnlyPackChanged(failures, 'existing-update', afterNewSnapshot, snapshotPackFiles(storeRoot), `${initialSlugs[0]}-youtube-script.json`);

    const categoryPackSlug = `${initialSlugs[3]}-youtube-script`;
    const beforeCategorySnapshot = snapshotPackFiles(storeRoot);
    const beforeCategoryEntries = listCreatorPackEntries({ root: storeRoot });
    const categoryPack = readCreatorPack(categoryPackSlug, { root: storeRoot });
    const movedPack = { ...categoryPack, creatorCategorySlug: 'myths', genre: 'Mythology Script' };
    const categoryResult = upsertCreatorPack(movedPack, { root: storeRoot });
    assert(failures, 'category-change', categoryResult.status === 'updated', `expected updated, got ${categoryResult.status}`);
    assert(failures, 'category-change', fs.existsSync(path.join(storeRoot, `${categoryPackSlug}.json`)), 'category change moved the pack file');
    assertOnlyPackChanged(failures, 'category-change', beforeCategorySnapshot, snapshotPackFiles(storeRoot), `${categoryPackSlug}.json`);
    const afterCategoryEntries = listCreatorPackEntries({ root: storeRoot });
    assert(failures, 'category-change', countCategory(beforeCategoryEntries, 'urban-legends') - 1 === countCategory(afterCategoryEntries, 'urban-legends'), 'previous category count did not decrease');
    assert(failures, 'category-change', countCategory(beforeCategoryEntries, 'myths') + 1 === countCategory(afterCategoryEntries, 'myths'), 'new category count did not increase');
    assertNoSubdirectories(failures, storeRoot);

    runGenerateSiteForPublishFlow(failures, storeRoot, outputRoot);
    assert(failures, 'combined-json', !containsCombinedJson(storeRoot), 'combined Creator Pack JSON exists in store');
    assert(failures, 'combined-json', !fs.existsSync(path.join(outputRoot, 'data', 'scripts.json')), 'data/scripts.json was written to site output');
    assert(failures, 'combined-json', !fs.existsSync(path.join(outputRoot, 'creator-packs.json')), 'creator-packs.json was written to site output');

    if (failures.length) fail(failures);

    console.log('Creator Pack publish flow validation passed.');
    console.log(JSON.stringify({
      initialPacks: initialReport.total,
      afterNewPackEntries: 8,
      newPublishScriptsJsonReads: newStats.scriptsJsonReads,
      newPublishScriptsJsonWrites: newStats.scriptsJsonWrites,
      updateScriptsJsonReads: updateStats.scriptsJsonReads,
      updateScriptsJsonWrites: updateStats.scriptsJsonWrites,
      packFiles: snapshotPackFiles(storeRoot).size
    }, null, 2));
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
}

function traceScriptsJsonAccess(callback) {
  const scriptsJsonPath = path.join(root, 'data', 'scripts.json');
  const originalReadFileSync = fs.readFileSync;
  const originalWriteFileSync = fs.writeFileSync;
  const stats = { scriptsJsonReads: 0, scriptsJsonWrites: 0, result: null };
  fs.readFileSync = function patchedReadFileSync(filePath, ...args) {
    if (path.resolve(String(filePath)) === scriptsJsonPath) stats.scriptsJsonReads += 1;
    return originalReadFileSync.call(this, filePath, ...args);
  };
  fs.writeFileSync = function patchedWriteFileSync(filePath, ...args) {
    if (path.resolve(String(filePath)) === scriptsJsonPath) stats.scriptsJsonWrites += 1;
    return originalWriteFileSync.call(this, filePath, ...args);
  };
  try {
    stats.result = callback();
  } finally {
    fs.readFileSync = originalReadFileSync;
    fs.writeFileSync = originalWriteFileSync;
  }
  return stats;
}

function runGenerateSiteForPublishFlow(failures, creatorPackRoot, outputRoot) {
  const result = childProcess.spawnSync(process.execPath, [
    path.join(root, 'scripts', 'generate-site.js'),
    '--creator-pack-root',
    creatorPackRoot,
    '--output-root',
    outputRoot
  ], { cwd: root, encoding: 'utf8' });
  assert(failures, 'site-build', result.status === 0, `temp site build failed: ${result.stderr || result.stdout}`);

  const manifest = readCreatorPackManifest({ root: creatorPackRoot });
  const searchIndexPath = path.join(outputRoot, 'data', 'creator-library-search-index.json');
  const sitemapPath = path.join(outputRoot, 'sitemap.xml');
  assert(failures, 'site-build', fs.existsSync(searchIndexPath), 'missing Creator Library search index');
  assert(failures, 'site-build', fs.existsSync(sitemapPath), 'missing sitemap');
  if (fs.existsSync(searchIndexPath)) {
    const index = JSON.parse(fs.readFileSync(searchIndexPath, 'utf8'));
    for (const entry of manifest.packs) {
      assert(failures, 'site-build', index.some((item) => item.slug === entry.slug), `${entry.slug} missing from search metadata`);
    }
  }
  if (fs.existsSync(sitemapPath)) {
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    for (const entry of manifest.packs) {
      assert(failures, 'site-build', sitemap.includes(`https://kyunolab.com/scripts/${entry.slug}`), `${entry.slug} missing from sitemap`);
    }
  }
}

function snapshotPackFiles(storeRoot) {
  const snapshot = new Map();
  if (!fs.existsSync(storeRoot)) return snapshot;
  for (const entry of fs.readdirSync(storeRoot, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.json') || entry.name === 'manifest.json') continue;
    const filePath = path.join(storeRoot, entry.name);
    const content = fs.readFileSync(filePath, 'utf8');
    snapshot.set(entry.name, {
      checksum: calculateCreatorPackChecksum(content),
      mtimeMs: fs.statSync(filePath).mtimeMs
    });
  }
  return snapshot;
}

function assertExistingPackFilesUnchanged(failures, test, before, after) {
  for (const [name, info] of before.entries()) {
    const next = after.get(name);
    assert(failures, test, Boolean(next), `${name} disappeared`);
    if (!next) continue;
    assert(failures, test, next.checksum === info.checksum, `${name} checksum changed`);
    assert(failures, test, next.mtimeMs === info.mtimeMs, `${name} mtime changed`);
  }
}

function assertOnlyPackChanged(failures, test, before, after, changedFile) {
  for (const [name, info] of before.entries()) {
    const next = after.get(name);
    assert(failures, test, Boolean(next), `${name} disappeared`);
    if (!next || name === changedFile) continue;
    assert(failures, test, next.checksum === info.checksum, `${name} checksum changed unexpectedly`);
    assert(failures, test, next.mtimeMs === info.mtimeMs, `${name} mtime changed unexpectedly`);
  }
  const changed = after.get(changedFile);
  assert(failures, test, Boolean(changed), `${changedFile} missing after update`);
  if (changed && before.has(changedFile)) {
    assert(failures, test, changed.checksum !== before.get(changedFile).checksum, `${changedFile} checksum did not change`);
  }
}

function assertNoSubdirectories(failures, storeRoot) {
  const subdirs = fs.readdirSync(storeRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  assert(failures, 'flat-store', subdirs.length === 0, `store has subdirectories: ${subdirs.map((entry) => entry.name).join(', ')}`);
}

function countCategory(entries, category) {
  return entries.filter((entry) => entry.category === category).length;
}

function containsCombinedJson(storeRoot) {
  return ['all-packs.json', 'scripts-v2.json', 'creator-packs.json'].some((name) => fs.existsSync(path.join(storeRoot, name)));
}

function assert(failures, test, condition, message) {
  if (!condition) failures.push({ test, message });
}

function fail(failures) {
  for (const failure of failures) console.error(`${failure.test}: ${failure.message}`);
  console.error(`Creator Pack publish flow validation failed: ${failures.length}`);
  process.exit(1);
}

if (require.main === module) main();
