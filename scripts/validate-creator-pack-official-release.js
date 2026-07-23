const fs = require('fs');
const path = require('path');
const {
  calculateCreatorPackChecksum,
  getCreatorPackRoot,
  listCreatorPackEntries,
  readCreatorPack,
  readCreatorPackManifest,
  validateCreatorPackFile
} = require('./creator-library-store');
const {
  generateCreatorPacksForSlugs
} = require('./generate-creator-pack');
const {
  loadCreatorValidationPacks
} = require('./creator-library-validation-data');

const root = path.resolve(__dirname, '..');
const args = parseArgs(process.argv.slice(2));
const packRoot = getCreatorPackRoot({ root: args.root });
const expectedCount = Number(args.expectedCount || 371);
const failures = [];
const stats = {
  packs: 0,
  longScenes: 0,
  longParts: 0,
  creatorNotes: 0,
  visualBeats: 0,
  shortScenes: 0,
  publicFieldsChecked: 0
};

function main() {
  if (args.noWrite) return validateNoWriteRelease();
  validateStoreShape();
  const manifest = readCreatorPackManifest({ root: packRoot });
  const entries = listCreatorPackEntries({ root: packRoot });
  validateManifest(manifest, entries);
  validateExpectedSlugs(entries);

  for (const entry of entries) validatePack(entry);

  if (args.htmlRoot) validateHtmlOutput(entries, path.resolve(root, args.htmlRoot));
  if (args.legacyDeleted && fs.existsSync(path.join(root, 'data', 'scripts.json'))) {
    fail('legacy', 'data/scripts.json still exists after legacy deletion stage.');
  }

  report(entries);
  if (failures.length) {
    for (const failure of failures.slice(0, 80)) console.error(`${failure.stage}: ${failure.message}`);
    console.error(`Creator Pack official release validation failed: ${failures.length} issue(s).`);
    process.exit(1);
  }
  console.log('Creator Pack official release validation passed.');
}

function validateNoWriteRelease() {
  const slugs = loadCreatorValidationPacks().map((pack) => pack.slug).filter(Boolean);
  const report = generateCreatorPacksForSlugs(slugs, { dryRun: true, failFast: false, existingPacks: [] });
  console.log('Creator Pack official release no-write validation:');
  console.log(JSON.stringify({
    total: report.total,
    dryRun: report.dryRun,
    failed: report.failed,
    created: report.created,
    updated: report.updated,
    unchanged: report.unchanged
  }, null, 2));
  if (report.failed) {
    for (const failure of report.failures.slice(0, 80)) {
      console.error(`${failure.slug} [${failure.stage || failure.code}/${failure.field || 'unknown'}] ${failure.message}`);
    }
    process.exit(1);
  }
  console.log('Creator Pack official release no-write validation passed.');
}

function validateStoreShape() {
  if (!fs.existsSync(packRoot)) fail('store', `Creator Pack root does not exist: ${packRoot}`);
  if (!fs.existsSync(path.join(packRoot, 'manifest.json'))) fail('store', 'manifest.json is missing.');
  if (!fs.existsSync(packRoot)) return;
  for (const entry of fs.readdirSync(packRoot, { withFileTypes: true })) {
    if (entry.isDirectory()) fail('store', `Unexpected subdirectory: ${entry.name}`);
    if (!entry.isFile()) continue;
    if (entry.name.includes('.tmp')) fail('store', `Temporary file remains: ${entry.name}`);
    if (!entry.name.endsWith('.json')) fail('store', `Unexpected non-JSON file: ${entry.name}`);
  }
  for (const forbidden of ['scripts.json', 'scripts-v2.json', 'all-packs.json', 'creator-packs.json']) {
    if (fs.existsSync(path.join(packRoot, forbidden))) fail('store', `Forbidden combined JSON exists in pack root: ${forbidden}`);
    if (fs.existsSync(path.join(root, 'data', forbidden)) && forbidden !== 'scripts.json') {
      fail('store', `Forbidden combined JSON exists in data/: ${forbidden}`);
    }
  }
}

function validateManifest(manifest, entries) {
  if (manifest.packs.length !== expectedCount) fail('manifest', `Expected ${expectedCount} entries, got ${manifest.packs.length}.`);
  if (entries.length !== expectedCount) fail('manifest', `Expected ${expectedCount} listed entries, got ${entries.length}.`);
  const jsonFiles = fs.existsSync(packRoot)
    ? fs.readdirSync(packRoot).filter((name) => name.endsWith('.json') && name !== 'manifest.json')
    : [];
  if (jsonFiles.length !== expectedCount) fail('store', `Expected ${expectedCount} pack files, got ${jsonFiles.length}.`);

  const slugs = new Set();
  const files = new Set();
  let previousSlug = '';
  for (const entry of manifest.packs) {
    if (slugs.has(entry.slug)) fail('manifest', `Duplicate manifest slug: ${entry.slug}`);
    if (files.has(entry.file)) fail('manifest', `Duplicate manifest file: ${entry.file}`);
    if (previousSlug && previousSlug.localeCompare(entry.slug) > 0) fail('manifest', `Manifest is not sorted at ${entry.slug}.`);
    previousSlug = entry.slug;
    slugs.add(entry.slug);
    files.add(entry.file);
    if (entry.file !== `${entry.slug}.json`) fail('manifest', `File mismatch for ${entry.slug}: ${entry.file}`);
    for (const forbidden of ['longformScript', 'visualGuide', 'shortForm', 'imagePrompts', 'motionPrompts', 'subtitleLines']) {
      if (Object.prototype.hasOwnProperty.call(entry, forbidden)) fail('manifest', `Manifest entry contains pack body field: ${entry.slug}.${forbidden}`);
    }
    const filePath = path.join(packRoot, entry.file);
    if (!fs.existsSync(filePath)) fail('manifest', `Manifest entry points to missing file: ${entry.file}`);
    else {
      const checksum = calculateCreatorPackChecksum(fs.readFileSync(filePath, 'utf8'));
      if (checksum !== entry.checksum) fail('manifest', `Checksum mismatch for ${entry.slug}.`);
    }
  }
  for (const file of jsonFiles) {
    const slug = file.replace(/\.json$/, '');
    if (!slugs.has(slug)) fail('store', `Stale pack file not in manifest: ${file}`);
  }
}

function validateExpectedSlugs(entries) {
  if (!args.expectedSlugs) return;
  const expected = new Set(readSlugFile(args.expectedSlugs).map((slug) => normalizePackSlug(slug)));
  const actual = new Set(entries.map((entry) => entry.slug));
  for (const slug of expected) {
    if (!actual.has(slug)) fail('coverage', `Missing expected slug: ${slug}`);
  }
  for (const slug of actual) {
    if (!expected.has(slug)) fail('coverage', `Unexpected slug: ${slug}`);
  }
}

function validatePack(entry) {
  const filePath = path.join(packRoot, entry.file);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
    fail('pack', `${entry.slug} file is missing or empty.`);
    return;
  }
  let pack;
  try {
    pack = readCreatorPack(entry.slug, { root: packRoot });
    validateCreatorPackFile(pack, filePath);
  } catch (error) {
    fail('pack', `${entry.slug} schema failed: ${error.code || error.message}`);
    return;
  }
  stats.packs += 1;
  if (pack.slug !== path.basename(filePath, '.json')) fail('pack', `${entry.slug} internal slug does not match file name.`);
  if (pack.schemaVersion !== 'single-path-v1' || pack.creatorPipelineVersion !== 'single-path-v1') {
    fail('pack', `${entry.slug} is not a single-path-v1 generated pack.`);
  }
  validatePublicFields(pack);
  validateLongformStructure(pack);
  validateShortformStructure(pack);
}

function validateLongformStructure(pack) {
  const scenes = Array.isArray(pack.visualGuide) ? pack.visualGuide : [];
  if (scenes.length !== 5) fail('longform', `${pack.slug} expected 5 long-form scenes, got ${scenes.length}.`);
  stats.longScenes += scenes.length;
  const longformParts = Array.isArray(pack.longformScript) ? pack.longformScript : [];
  if (longformParts.length !== 10) fail('longform', `${pack.slug} expected 10 long-form narration parts, got ${longformParts.length}.`);

  scenes.forEach((scene, sceneIndex) => {
    if (!scene.sceneFocus) fail('longform', `${pack.slug} scene ${sceneIndex + 1} missing Scene Focus.`);
    const parts = Array.isArray(scene.narrationParts) ? scene.narrationParts : [];
    stats.longParts += parts.length;
    parts.forEach((part, partIndex) => {
      if (!part.narration) fail('longform', `${pack.slug} S${sceneIndex + 1} P${partIndex + 1} missing narration.`);
      if (!part.creatorNote) fail('production', `${pack.slug} S${sceneIndex + 1} P${partIndex + 1} missing Creator Note.`);
      stats.creatorNotes += part.creatorNote ? 1 : 0;
      const beats = Array.isArray(part.visualBeats) ? part.visualBeats : [];
      stats.visualBeats += beats.length;
      beats.forEach((beat, beatIndex) => {
        if (!beat.imagePrompt) fail('production', `${pack.slug} S${sceneIndex + 1} P${partIndex + 1} B${beatIndex + 1} missing Image Prompt.`);
        if (!beat.beatMotion && !beat.motionPrompt) fail('production', `${pack.slug} S${sceneIndex + 1} P${partIndex + 1} B${beatIndex + 1} missing Beat Motion.`);
        if (!Array.isArray(beat.sourceFactIds) || !beat.sourceFactIds.length) {
          fail('production', `${pack.slug} S${sceneIndex + 1} P${partIndex + 1} B${beatIndex + 1} missing sourceFactIds.`);
        }
      });
    });
  });
}

function validateShortformStructure(pack) {
  const scenes = Array.isArray(pack.shortForm?.scenes) ? pack.shortForm.scenes : [];
  if (scenes.length !== 5) fail('shortform', `${pack.slug} expected 5 short-form scenes, got ${scenes.length}.`);
  const localNarration = new Set();
  const localFocus = new Set();
  scenes.forEach((scene, index) => {
    stats.shortScenes += 1;
    for (const field of ['narration', 'sceneFocus', 'imagePrompt', 'motionPrompt']) {
      if (!scene[field]) fail('shortform', `${pack.slug} short scene ${index + 1} missing ${field}.`);
    }
    if (!Array.isArray(scene.sourceFactIds) || !scene.sourceFactIds.length) {
      fail('shortform', `${pack.slug} short scene ${index + 1} missing sourceFactIds.`);
    }
    const narrationKey = comparableText(scene.narration);
    const focusKey = comparableText(scene.sceneFocus);
    if (localNarration.has(narrationKey)) fail('shortform', `${pack.slug} duplicate short narration in scene ${index + 1}.`);
    if (localFocus.has(focusKey)) fail('shortform', `${pack.slug} duplicate short scene focus in scene ${index + 1}.`);
    localNarration.add(narrationKey);
    localFocus.add(focusKey);
  });
}

function validatePublicFields(pack) {
  collectPublicStrings(pack).forEach(({ pathName, value }) => {
    stats.publicFieldsChecked += 1;
    const text = String(value || '');
    if (!text.trim()) fail('content', `${pack.slug} ${pathName} is empty.`);
    if (/undefined|\[object Object\]/.test(text)) fail('content', `${pack.slug} ${pathName} exposes invalid placeholder text.`);
    for (const pattern of FORBIDDEN_PUBLIC_PATTERNS) {
      if (pattern.test(text)) fail('content', `${pack.slug} ${pathName} contains forbidden phrase: ${pattern}`);
    }
  });
}

function collectPublicStrings(pack) {
  const fields = [];
  (pack.longformScript || []).forEach((value, index) => fields.push({ pathName: `longformScript[${index}]`, value }));
  (pack.visualGuide || []).forEach((scene, sceneIndex) => {
    fields.push({ pathName: `visualGuide[${sceneIndex}].sceneFocus`, value: scene.sceneFocus });
    (scene.narrationParts || []).forEach((part, partIndex) => {
      fields.push({ pathName: `visualGuide[${sceneIndex}].narrationParts[${partIndex}].narration`, value: part.narration });
      fields.push({ pathName: `visualGuide[${sceneIndex}].narrationParts[${partIndex}].creatorNote`, value: part.creatorNote });
      (part.visualBeats || []).forEach((beat, beatIndex) => {
        fields.push({ pathName: `visualGuide[${sceneIndex}].narrationParts[${partIndex}].visualBeats[${beatIndex}].imagePrompt`, value: beat.imagePrompt });
        fields.push({ pathName: `visualGuide[${sceneIndex}].narrationParts[${partIndex}].visualBeats[${beatIndex}].beatMotion`, value: beat.beatMotion || beat.motionPrompt });
      });
    });
  });
  (pack.shortForm?.scenes || []).forEach((scene, sceneIndex) => {
    fields.push({ pathName: `shortForm.scenes[${sceneIndex}].narration`, value: scene.narration });
    fields.push({ pathName: `shortForm.scenes[${sceneIndex}].sceneFocus`, value: scene.sceneFocus });
    fields.push({ pathName: `shortForm.scenes[${sceneIndex}].imagePrompt`, value: scene.imagePrompt });
    fields.push({ pathName: `shortForm.scenes[${sceneIndex}].motionPrompt`, value: scene.motionPrompt });
  });
  return fields;
}

function validateHtmlOutput(entries, htmlRoot) {
  if (!fs.existsSync(htmlRoot)) return fail('html', `HTML root does not exist: ${htmlRoot}`);
  const scriptDir = path.join(htmlRoot, 'scripts');
  const detailFiles = fs.existsSync(scriptDir)
    ? fs.readdirSync(scriptDir).filter((name) => name.endsWith('-youtube-script.html'))
    : [];
  if (detailFiles.length !== expectedCount) fail('html', `Expected ${expectedCount} Creator detail pages, got ${detailFiles.length}.`);
  for (const entry of entries) {
    const htmlPath = path.join(scriptDir, `${entry.slug}.html`);
    if (!fs.existsSync(htmlPath)) {
      fail('html', `${entry.slug} detail HTML is missing.`);
      continue;
    }
    const html = fs.readFileSync(htmlPath, 'utf8');
    for (const required of ['<title>', 'name="description"', `https://kyunolab.com/scripts/${entry.slug}`, 'Long-form Creator', 'Creator Note', 'Scene Focus', 'Image Prompt', 'Beat Motion', 'Short-form Creator']) {
      if (!html.includes(required)) fail('html', `${entry.slug} missing HTML marker: ${required}`);
    }
    if (/undefined|\[object Object\]|data\/creator-packs/.test(html)) fail('html', `${entry.slug} exposes invalid HTML text or storage path.`);
  }
  const sitemapPath = path.join(htmlRoot, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) fail('sitemap', 'sitemap.xml is missing.');
  else {
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    const urls = [...sitemap.matchAll(/https:\/\/kyunolab\.com\/scripts\/([a-z0-9-]+-youtube-script)/g)].map((match) => match[1]);
    const uniqueUrls = new Set(urls);
    if (uniqueUrls.size !== urls.length) fail('sitemap', 'Duplicate Creator Library URLs found.');
    for (const entry of entries) {
      if (!uniqueUrls.has(entry.slug)) fail('sitemap', `${entry.slug} missing from sitemap.`);
    }
  }
  const searchIndexPath = path.join(htmlRoot, 'data', 'creator-library-search-index.json');
  if (fs.existsSync(searchIndexPath)) {
    const searchIndex = JSON.parse(fs.readFileSync(searchIndexPath, 'utf8'));
    for (const item of searchIndex) {
      for (const bodyField of ['longformScript', 'visualGuide', 'shortForm', 'imagePrompts', 'motionPrompts']) {
        if (Object.prototype.hasOwnProperty.call(item, bodyField)) fail('search-index', `Search index item ${item.slug || '(missing slug)'} contains body field ${bodyField}.`);
      }
    }
  }
}

function parseArgs(argv) {
  const output = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') output.root = argv[++index];
    else if (arg === '--expected-count') output.expectedCount = argv[++index];
    else if (arg === '--expected-slugs') output.expectedSlugs = argv[++index];
    else if (arg === '--html-root') output.htmlRoot = argv[++index];
    else if (arg === '--legacy-deleted') output.legacyDeleted = true;
    else if (arg === '--no-write') output.noWrite = true;
  }
  return output;
}

function readSlugFile(filePath) {
  const text = fs.readFileSync(path.resolve(filePath), 'utf8').trim();
  if (!text) return [];
  if (text.startsWith('[')) return JSON.parse(text).map(String);
  return text.split(/\r?\n/);
}

function normalizePackSlug(slug) {
  const value = String(slug || '').trim();
  return value.endsWith('-youtube-script') ? value : `${value}-youtube-script`;
}

function comparableText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function fail(stage, message) {
  failures.push({ stage, message });
}

function report(entries) {
  console.log('Creator Pack official release validation:');
  console.log(`- root: ${packRoot}`);
  console.log(`- manifest entries: ${entries.length}`);
  console.log(`- packs checked: ${stats.packs}`);
  console.log(`- long-form scenes: ${stats.longScenes}`);
  console.log(`- long-form parts: ${stats.longParts}`);
  console.log(`- creator notes: ${stats.creatorNotes}`);
  console.log(`- visual beats: ${stats.visualBeats}`);
  console.log(`- short-form scenes: ${stats.shortScenes}`);
  console.log(`- public fields checked: ${stats.publicFieldsChecked}`);
  console.log(`- failures: ${failures.length}`);
}

const FORBIDDEN_PUBLIC_PATTERNS = [
  /establish the point/i,
  /develop the point/i,
  /close the point/i,
  /needs this part to preserve/i,
  /keep the visual work centered/i,
  /confirmed story material/i,
  /pre-existing subject/i,
  /pre-existing Myths subject/i,
  /begins with works because/i,
  /centered on works because/i,
  /(?:^|[.!?]\s+)works because/i,
  /The focus stays on/i,
  /begins with a detail that gives the story its shape/i,
  /connected to its strongest image/i,
  /\bA ancient\b/i,
  /becomes of/i
];

main();
