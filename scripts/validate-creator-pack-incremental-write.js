const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  upsertCreatorPack,
  readCreatorPackManifest,
  rebuildCreatorPackManifest,
  calculateCreatorPackChecksum,
  validateCreatorPackSlug
} = require('./creator-library-store');
const {
  generateCreatorPackForSlug,
  generateCreatorPacksForSlugs
} = require('./generate-creator-pack');

const root = path.resolve(__dirname, '..');
const failures = [];

function main() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kyunolab-creator-pack-incremental-'));
  try {
    const samples = readJson(path.join(root, 'data', 'scripts.json')).slice(0, 3).map(clonePack);
    testInitialWrites(tempRoot, samples);
    testUnchangedWrites(tempRoot, samples);
    testSingleUpdate(tempRoot, samples);
    testNewPack(tempRoot, samples[0]);
    testCategoryChangeKeepsPath(tempRoot, samples[1]);
    testInvalidSlugs(tempRoot, samples[0]);
    testAtomicFailure(tempRoot, samples[0]);
    testManifestRebuild(tempRoot);
    testNoAutomaticPrune(tempRoot);
    testSingleAndBatchGenerationMatch();
    if (failures.length) {
      failures.forEach((failure) => console.error(`${failure.test}: ${failure.message}`));
      console.error(`Creator Pack incremental write validation failed: ${failures.length}`);
      process.exit(1);
    }
    console.log('Creator Pack incremental write validation passed.');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function testInitialWrites(tempRoot, samples) {
  samples.forEach((pack) => {
    const result = upsertCreatorPack(clonePack(pack), { root: tempRoot });
    if (result.status !== 'created') fail('initial-write', `${pack.slug} expected created, got ${result.status}`);
  });
  const manifest = readCreatorPackManifest({ root: tempRoot });
  if (manifest.packs.length !== 3) fail('initial-write', `expected 3 manifest entries, got ${manifest.packs.length}`);
}

function testUnchangedWrites(tempRoot, samples) {
  const before = snapshotRoot(tempRoot);
  samples.forEach((pack) => {
    const result = upsertCreatorPack(clonePack(pack), { root: tempRoot });
    if (result.status !== 'unchanged') fail('unchanged-write', `${pack.slug} expected unchanged, got ${result.status}`);
  });
  const after = snapshotRoot(tempRoot);
  assertSnapshotsEqual('unchanged-write', before, after);
}

function testSingleUpdate(tempRoot, samples) {
  const before = snapshotRoot(tempRoot);
  const updated = { ...clonePack(samples[0]), deck: `${samples[0].deck} Incremental validation note.` };
  const result = upsertCreatorPack(updated, { root: tempRoot });
  if (result.status !== 'updated') fail('single-update', `expected updated, got ${result.status}`);
  const after = snapshotRoot(tempRoot);
  assertOnlyFilesChanged('single-update', before, after, [`${updated.slug}.json`, 'manifest.json']);
}

function testNewPack(tempRoot, sample) {
  const before = snapshotRoot(tempRoot);
  const created = {
    ...clonePack(sample),
    id: 'incremental-new-pack-youtube-script',
    slug: 'incremental-new-pack-youtube-script',
    title: 'Incremental New Pack YouTube Script'
  };
  const result = upsertCreatorPack(created, { root: tempRoot });
  if (result.status !== 'created') fail('new-pack', `expected created, got ${result.status}`);
  const after = snapshotRoot(tempRoot);
  if (!after.has('incremental-new-pack-youtube-script.json')) fail('new-pack', 'new pack file was not created');
  assertExistingFilesUnchanged('new-pack', before, after, ['manifest.json']);
  const manifest = readCreatorPackManifest({ root: tempRoot });
  if (manifest.packs.length !== 4) fail('new-pack', `expected 4 manifest entries, got ${manifest.packs.length}`);
}

function testCategoryChangeKeepsPath(tempRoot, sample) {
  const before = snapshotRoot(tempRoot);
  const changed = { ...clonePack(sample), creatorCategorySlug: 'category-change-test' };
  const result = upsertCreatorPack(changed, { root: tempRoot });
  if (result.status !== 'updated') fail('category-change', `expected updated, got ${result.status}`);
  const after = snapshotRoot(tempRoot);
  if (!after.has(`${changed.slug}.json`)) fail('category-change', 'slug file moved after category change');
  assertOnlyFilesChanged('category-change', before, after, [`${changed.slug}.json`, 'manifest.json']);
  const subdirs = fs.readdirSync(tempRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  if (subdirs.length) fail('category-change', 'category/contentType subdirectory was created');
}

function testInvalidSlugs(tempRoot, sample) {
  for (const badSlug of ['../bad', 'myths/bad', 'Bad-Slug', 'manifest']) {
    try {
      validateCreatorPackSlug(badSlug);
      fail('invalid-slug', `${badSlug} was accepted`);
    } catch (error) {
      if (!/^CREATOR_PACK_/.test(error.code || '')) fail('invalid-slug', `${badSlug} failed with unexpected code ${error.code}`);
    }
    const badPack = { ...clonePack(sample), id: badSlug, slug: badSlug };
    try {
      upsertCreatorPack(badPack, { root: tempRoot });
      fail('invalid-slug', `${badSlug} write was accepted`);
    } catch (error) {
      if (!/^CREATOR_PACK_/.test(error.code || '')) fail('invalid-slug', `${badSlug} write failed with unexpected code ${error.code}`);
    }
  }
}

function testAtomicFailure(tempRoot, sample) {
  const before = snapshotRoot(tempRoot);
  const failing = {
    ...clonePack(sample),
    id: 'atomic-failure-pack-youtube-script',
    slug: 'atomic-failure-pack-youtube-script',
    title: 'Atomic Failure Pack YouTube Script'
  };
  try {
    upsertCreatorPack(failing, { root: tempRoot, injectFailureAfterTempWrite: true });
    fail('atomic-failure', 'injected failure did not throw');
  } catch (error) {
    if (error.code !== 'CREATOR_PACK_INJECTED_ATOMIC_FAILURE') fail('atomic-failure', `unexpected error code ${error.code}`);
  }
  const after = snapshotRoot(tempRoot);
  assertSnapshotsEqual('atomic-failure', before, after);
  const tmpFiles = [...after.keys()].filter((name) => name.includes('.tmp-'));
  if (tmpFiles.length) fail('atomic-failure', `temp files remain: ${tmpFiles.join(', ')}`);
}

function testManifestRebuild(tempRoot) {
  const before = snapshotRoot(tempRoot);
  fs.unlinkSync(path.join(tempRoot, 'manifest.json'));
  const manifest = rebuildCreatorPackManifest({ root: tempRoot });
  if (manifest.packs.length !== 4) fail('manifest-rebuild', `expected 4 entries, got ${manifest.packs.length}`);
  const after = snapshotRoot(tempRoot);
  for (const [name, info] of before.entries()) {
    if (name === 'manifest.json') continue;
    const next = after.get(name);
    if (!next || next.content !== info.content) fail('manifest-rebuild', `${name} changed during manifest rebuild`);
  }
}

function testNoAutomaticPrune(tempRoot) {
  const before = snapshotRoot(tempRoot);
  const manifest = rebuildCreatorPackManifest({ root: tempRoot });
  const after = snapshotRoot(tempRoot);
  if (manifest.packs.length !== 4) fail('no-prune', `expected 4 entries, got ${manifest.packs.length}`);
  for (const name of before.keys()) {
    if (!after.has(name)) fail('no-prune', `${name} was pruned unexpectedly`);
  }
}

function testSingleAndBatchGenerationMatch() {
  const slugs = [
    'osiris-isis-resurrection-myth',
    'maui-slows-the-sun-myth',
    'demeter-and-persephone-myth',
    'cicada-3301-internet-puzzle',
    'why-names-have-power-in-legends'
  ];
  const singleRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kyunolab-creator-pack-single-'));
  const batchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kyunolab-creator-pack-batch-'));
  try {
    slugs.forEach((slug) => generateCreatorPackForSlug(slug, { root: singleRoot }));
    const report = generateCreatorPacksForSlugs(slugs, { root: batchRoot, failFast: true });
    if (report.failed) fail('single-batch', `batch generation failed: ${report.failed}`);
    for (const file of fs.readdirSync(singleRoot).filter((name) => name.endsWith('.json'))) {
      const singleContent = fs.readFileSync(path.join(singleRoot, file), 'utf8');
      const batchContent = fs.readFileSync(path.join(batchRoot, file), 'utf8');
      if (calculateCreatorPackChecksum(singleContent) !== calculateCreatorPackChecksum(batchContent)) {
        fail('single-batch', `${file} checksum differs between single and batch generation`);
      }
    }
  } finally {
    fs.rmSync(singleRoot, { recursive: true, force: true });
    fs.rmSync(batchRoot, { recursive: true, force: true });
  }
}

function snapshotRoot(rootPath) {
  const snapshot = new Map();
  fs.readdirSync(rootPath, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .forEach((entry) => {
      const filePath = path.join(rootPath, entry.name);
      const content = fs.readFileSync(filePath, 'utf8');
      snapshot.set(entry.name, {
        checksum: calculateCreatorPackChecksum(content),
        content,
        mtimeMs: fs.statSync(filePath).mtimeMs
      });
    });
  return snapshot;
}

function assertSnapshotsEqual(test, before, after) {
  if (before.size !== after.size) fail(test, `file count changed from ${before.size} to ${after.size}`);
  for (const [name, info] of before.entries()) {
    const next = after.get(name);
    if (!next) fail(test, `${name} missing after operation`);
    else if (next.content !== info.content || next.mtimeMs !== info.mtimeMs) fail(test, `${name} changed unexpectedly`);
  }
}

function assertOnlyFilesChanged(test, before, after, allowed) {
  const allowedSet = new Set(allowed);
  for (const [name, info] of before.entries()) {
    const next = after.get(name);
    if (!next) fail(test, `${name} missing after operation`);
    if (!allowedSet.has(name) && next.content !== info.content) fail(test, `${name} changed unexpectedly`);
  }
}

function assertExistingFilesUnchanged(test, before, after, allowedChanged = []) {
  const allowedSet = new Set(allowedChanged);
  for (const [name, info] of before.entries()) {
    const next = after.get(name);
    if (!next) fail(test, `${name} missing after operation`);
    if (!allowedSet.has(name) && next.content !== info.content) fail(test, `${name} changed unexpectedly`);
  }
}

function fail(test, message) {
  failures.push({ test, message });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function clonePack(pack) {
  return JSON.parse(JSON.stringify(pack));
}

if (require.main === module) main();
