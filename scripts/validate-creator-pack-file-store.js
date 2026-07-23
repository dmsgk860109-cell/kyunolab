const fs = require('fs');
const path = require('path');
const {
  readCreatorPackManifest,
  readCreatorPack,
  validateCreatorPackFile,
  calculateCreatorPackChecksum,
  MANIFEST_SCHEMA_VERSION,
  PACK_STORAGE_SCHEMA_VERSION
} = require('./creator-library-store');

const root = path.resolve(__dirname, '..');
const errors = [];

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.root) {
    console.error('Usage: node scripts/validate-creator-pack-file-store.js --root <PATH>');
    process.exit(1);
  }
  validateStoreRoot(args.root);
  validateCodeBoundaries();
  if (errors.length) {
    errors.slice(0, 80).forEach((error) => console.error(`${error.path} [${error.slug || '-'}] ${error.type}: ${error.message}`));
    console.error(`Creator Pack file store validation failed: ${errors.length}`);
    process.exit(1);
  }
  console.log('Creator Pack file store validation passed.');
}

function validateStoreRoot(rootPath) {
  const packRoot = path.resolve(rootPath);
  if (!fs.existsSync(packRoot)) fail(packRoot, '', 'missing-root', 'Pack root does not exist.');
  const entries = fs.readdirSync(packRoot, { withFileTypes: true });
  const directories = entries.filter((entry) => entry.isDirectory());
  directories.forEach((entry) => fail(path.join(packRoot, entry.name), '', 'subdirectory', 'category/contentType/date subdirectories are not allowed.'));
  const forbidden = entries.filter((entry) => entry.isFile() && /^(all-packs|scripts-v2|scripts)\.json$/i.test(entry.name));
  forbidden.forEach((entry) => fail(path.join(packRoot, entry.name), '', 'combined-json', 'Combined Creator Pack JSON files are not allowed.'));

  const jsonFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith('.json'));
  if (!jsonFiles.includes('manifest.json')) fail(path.join(packRoot, 'manifest.json'), '', 'manifest', 'manifest.json is required.');

  const manifest = readCreatorPackManifest({ root: packRoot });
  if (manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION) fail(path.join(packRoot, 'manifest.json'), '', 'manifest-schema', 'Invalid manifest schemaVersion.');
  const packFiles = jsonFiles.filter((name) => name !== 'manifest.json').sort();
  if (packFiles.length !== manifest.packs.length) fail(packRoot, '', 'manifest-count', `manifest has ${manifest.packs.length}, files have ${packFiles.length}.`);

  const manifestBySlug = new Map(manifest.packs.map((entry) => [entry.slug, entry]));
  const seenSlugs = new Set();
  const seenFiles = new Set();
  for (const file of packFiles) {
    const filePath = path.join(packRoot, file);
    const pack = readCreatorPack(path.basename(file, '.json'), { root: packRoot });
    validateCreatorPackFile(pack, filePath);
    if (pack.storageSchemaVersion !== PACK_STORAGE_SCHEMA_VERSION) fail(filePath, pack.slug, 'storage-schema', 'Invalid storageSchemaVersion.');
    if (`${pack.slug}.json` !== file) fail(filePath, pack.slug, 'file-slug', 'File name must match pack slug.');
    if (seenSlugs.has(pack.slug)) fail(filePath, pack.slug, 'duplicate-slug', 'Duplicate slug.');
    if (seenFiles.has(file)) fail(filePath, pack.slug, 'duplicate-file', 'Duplicate file.');
    seenSlugs.add(pack.slug);
    seenFiles.add(file);
    const manifestEntry = manifestBySlug.get(pack.slug);
    if (!manifestEntry) fail(filePath, pack.slug, 'manifest-missing', 'Pack is missing from manifest.');
    if (manifestEntry?.file !== file) fail(filePath, pack.slug, 'manifest-file', 'Manifest file does not match pack file.');
    const checksum = calculateCreatorPackChecksum(fs.readFileSync(filePath, 'utf8'));
    if (manifestEntry?.checksum !== checksum) fail(filePath, pack.slug, 'checksum', 'Manifest checksum mismatch.');
  }

  for (const entry of manifest.packs) {
    if (!packFiles.includes(entry.file)) fail(path.join(packRoot, entry.file), entry.slug, 'manifest-stale', 'Manifest references a missing pack file.');
    for (const forbiddenField of ['longformScript', 'visualGuide', 'shortForm', 'imagePrompts', 'motionPrompts']) {
      if (Object.prototype.hasOwnProperty.call(entry, forbiddenField)) {
        fail(path.join(packRoot, 'manifest.json'), entry.slug, 'manifest-body', `Manifest must not include ${forbiddenField}.`);
      }
    }
  }
}

function validateCodeBoundaries() {
  const officialFiles = [
    'scripts/creator-library-store.js',
    'scripts/generate-creator-pack.js',
    'scripts/migrate-creator-packs-to-files.js'
  ];
  officialFiles.forEach((relativePath) => {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    if (/all-packs\.json|scripts-v2\.json/.test(source)) fail(relativePath, '', 'combined-json-code', 'Official store code must not create combined pack files.');
    if (/creator-packs[\\/](?:myths|myth-narrative|urban|internet|2026)/i.test(source)) fail(relativePath, '', 'subdir-code', 'Official store code must not create category/contentType/date subdirectories.');
  });
  const generator = fs.readFileSync(path.join(root, 'scripts/generate-creator-pack.js'), 'utf8');
  if (/saveCreatorLibraryEntr(?:y|ies)|writeFileSync\([^)]*scripts\.json/.test(generator)) {
    fail('scripts/generate-creator-pack.js', '', 'legacy-write', 'Official generator must not write data/scripts.json.');
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--root') args.root = argv[++index];
  }
  return args;
}

function fail(filePath, slug, type, message) {
  errors.push({ path: filePath, slug, type, message });
}

if (require.main === module) main();

module.exports = {
  validateStoreRoot
};
