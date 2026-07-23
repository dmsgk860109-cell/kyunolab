const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  CREATOR_PIPELINE_VERSION,
  validateCreatorLibraryEntry
} = require('./creator-library-pipeline');

const root = path.resolve(__dirname, '..');
const CREATOR_PACK_ROOT = path.join(root, 'data', 'creator-packs');
const PACK_STORAGE_SCHEMA_VERSION = 'creator-pack-file-v1';
const MANIFEST_SCHEMA_VERSION = 'creator-pack-manifest-v1';
const RESERVED_SLUGS = new Set(['manifest']);

function getCreatorPackRoot(options = {}) {
  return path.resolve(options.root || options.outputRoot || CREATOR_PACK_ROOT);
}

function getCreatorPackManifestPath(options = {}) {
  return path.join(getCreatorPackRoot(options), 'manifest.json');
}

function getCreatorPackPath(slug, options = {}) {
  validateCreatorPackSlug(slug);
  return path.join(getCreatorPackRoot(options), `${slug}.json`);
}

function validateCreatorPackSlug(slug) {
  const value = String(slug || '');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throwStoreError('slug', 'CREATOR_PACK_INVALID_SLUG', { slug: value });
  }
  if (RESERVED_SLUGS.has(value) || value.includes('..') || value.includes('/') || value.includes('\\') || value.includes('%')) {
    throwStoreError('slug', 'CREATOR_PACK_RESERVED_SLUG', { slug: value });
  }
  return value;
}

function readCreatorPack(slug, options = {}) {
  const filePath = getCreatorPackPath(slug, options);
  const pack = readJson(filePath);
  validateCreatorPackFile(pack, filePath);
  return pack;
}

function readCreatorPackManifest(options = {}) {
  const filePath = getCreatorPackManifestPath(options);
  if (!fs.existsSync(filePath)) return { schemaVersion: MANIFEST_SCHEMA_VERSION, packs: [] };
  const manifest = readJson(filePath);
  validateCreatorPackManifest(manifest, options);
  return manifest;
}

function listCreatorPackEntries(options = {}) {
  const manifest = readCreatorPackManifest(options);
  return [...manifest.packs].sort((a, b) => a.slug.localeCompare(b.slug));
}

function iterateCreatorPacks(options = {}) {
  return listCreatorPackEntries(options).map((entry) => readCreatorPack(entry.slug, options));
}

function writeCreatorPackAtomic(pack, options = {}) {
  const normalized = normalizeCreatorPackForStorage(pack);
  const filePath = getCreatorPackPath(normalized.slug, options);
  const packRoot = getCreatorPackRoot(options);
  ensureInsideRoot(filePath, packRoot);
  fs.mkdirSync(packRoot, { recursive: true });

  const serialized = stableSerializeCreatorPack(normalized);
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  try {
    fs.writeFileSync(tempPath, serialized, 'utf8');
    const written = readJson(tempPath);
    validateCreatorPackFile(written);
    if (options.injectFailureAfterTempWrite) {
      throwStoreError('atomicWrite', 'CREATOR_PACK_INJECTED_ATOMIC_FAILURE', normalized);
    }
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    throw error;
  }

  const checksum = calculateCreatorPackChecksum(serialized);
  return { filePath, checksum, serialized };
}

function upsertCreatorPack(pack, options = {}) {
  const normalized = normalizeCreatorPackForStorage(pack);
  const filePath = getCreatorPackPath(normalized.slug, options);
  const nextSerialized = stableSerializeCreatorPack(normalized);
  const nextChecksum = calculateCreatorPackChecksum(nextSerialized);
  if (fs.existsSync(filePath)) {
    const currentSerialized = fs.readFileSync(filePath, 'utf8');
    if (currentSerialized === nextSerialized) {
      return { slug: normalized.slug, status: 'unchanged', filePath, checksum: nextChecksum, validation: 'passed' };
    }
  }

  const status = fs.existsSync(filePath) ? 'updated' : 'created';
  const written = writeCreatorPackAtomic(normalized, options);
  if (!options.deferManifest) rebuildCreatorPackManifest(options);
  return { slug: normalized.slug, status, filePath: written.filePath, checksum: written.checksum, validation: 'passed' };
}

function removeCreatorPack(slug, options = {}) {
  const filePath = getCreatorPackPath(slug, options);
  if (!fs.existsSync(filePath)) return { slug, status: 'missing', filePath };
  fs.unlinkSync(filePath);
  rebuildCreatorPackManifest(options);
  return { slug, status: 'removed', filePath };
}

function rebuildCreatorPackManifest(options = {}) {
  const packRoot = getCreatorPackRoot(options);
  fs.mkdirSync(packRoot, { recursive: true });
  const packs = readPackFiles(packRoot).map((filePath) => {
    const pack = readJson(filePath);
    validateCreatorPackFile(pack, filePath);
    const serialized = fs.readFileSync(filePath, 'utf8');
    return manifestEntryForPack(pack, path.basename(filePath), calculateCreatorPackChecksum(serialized));
  }).sort((a, b) => a.slug.localeCompare(b.slug));
  assertUniqueManifestValues(packs);
  const manifest = { schemaVersion: MANIFEST_SCHEMA_VERSION, packs };
  writeManifestIfChanged(manifest, options);
  return manifest;
}

function validateCreatorPackFile(pack, filePath) {
  if (!pack || typeof pack !== 'object' || Array.isArray(pack)) {
    throwStoreError('pack', 'CREATOR_PACK_INVALID_OBJECT', pack || {});
  }
  if (pack.schemaVersion !== CREATOR_PIPELINE_VERSION) {
    throwStoreError('schemaVersion', 'CREATOR_PACK_INVALID_SCHEMA_VERSION', pack);
  }
  if (pack.storageSchemaVersion !== PACK_STORAGE_SCHEMA_VERSION) {
    throwStoreError('storageSchemaVersion', 'CREATOR_PACK_INVALID_STORAGE_SCHEMA', pack);
  }
  validateCreatorPackSlug(pack.slug);
  if (filePath) {
    const expectedFile = `${pack.slug}.json`;
    if (path.basename(filePath) !== expectedFile) {
      throwStoreError('fileName', 'CREATOR_PACK_FILE_SLUG_MISMATCH', pack);
    }
  }
  validateCreatorLibraryEntry(pack);
  assertRuntimeIsConsistent(pack);
  return true;
}

function calculateCreatorPackChecksum(serializedContent) {
  return `sha256:${crypto.createHash('sha256').update(String(serializedContent || ''), 'utf8').digest('hex')}`;
}

function stableSerializeCreatorPack(pack) {
  return `${JSON.stringify(sortObjectForStorage(pack), null, 2)}\n`;
}

function normalizeCreatorPackForStorage(pack) {
  const normalized = {
    ...pack,
    schemaVersion: CREATOR_PIPELINE_VERSION,
    storageSchemaVersion: PACK_STORAGE_SCHEMA_VERSION
  };
  validateCreatorPackFile(normalized);
  return normalized;
}

function mergeCreatorLibraryEntries(currentEntries, entries, options = {}) {
  const additions = ensureArray(entries);
  additions.forEach(assertCreatorEntryIsSaveable);
  const additionSlugs = new Set(additions.map((entry) => entry.slug));
  if (options.preserveOrder) {
    const additionsBySlug = new Map(additions.map((entry) => [entry.slug, entry]));
    const replaced = ensureArray(currentEntries).map((entry) => additionsBySlug.get(entry.slug) || entry);
    const existingSlugs = new Set(ensureArray(currentEntries).map((entry) => entry.slug));
    const newEntries = additions.filter((entry) => !existingSlugs.has(entry.slug));
    return [...newEntries, ...replaced];
  }
  return [
    ...additions,
    ...ensureArray(currentEntries).filter((entry) => !additionSlugs.has(entry.slug))
  ];
}

function mergeCreatorLibraryEntry(entries, entry) {
  assertCreatorEntryIsSaveable(entry);
  return mergeCreatorLibraryEntries(entries, [entry]);
}

function assertCreatorEntryIsSaveable(entry) {
  if (!entry || typeof entry !== 'object') {
    throwStoreError('entry', 'CREATOR_STORE_INVALID_ENTRY');
  }
  if (entry.creatorPipelineVersion !== CREATOR_PIPELINE_VERSION) {
    throwStoreError('creatorPipelineVersion', 'CREATOR_STORE_REJECTED_LEGACY_ENTRY', entry);
  }
  validateCreatorLibraryEntry(entry);
  assertRuntimeIsConsistent(entry);
  return true;
}

function assertRuntimeIsConsistent(entry) {
  const runtime = entry.runtimePlan || {};
  const longWords = countWords((entry.longformScript || []).join(' '));
  const shortWords = countWords((entry.shortForm?.scenes || []).map((scene) => scene.narration).join(' '));
  if (runtime.totalWordCount !== longWords) {
    throwStoreError('runtimePlan.totalWordCount', 'CREATOR_STORE_RUNTIME_MISMATCH', entry);
  }
  if (runtime.narrationReadSeconds !== Math.max(8, Math.round(longWords / 2.35))) {
    throwStoreError('runtimePlan.narrationReadSeconds', 'CREATOR_STORE_RUNTIME_MISMATCH', entry);
  }
  if (!Number.isFinite(runtime.finalVideoSeconds) || runtime.finalVideoSeconds < runtime.narrationReadSeconds) {
    throwStoreError('runtimePlan.finalVideoSeconds', 'CREATOR_STORE_RUNTIME_MISMATCH', entry);
  }
  if (entry.shortForm.totalWordCount !== shortWords) {
    throwStoreError('shortForm.totalWordCount', 'CREATOR_STORE_RUNTIME_MISMATCH', entry);
  }
  if (entry.shortForm.finalVideoSeconds < entry.shortForm.narrationReadSeconds) {
    throwStoreError('shortForm.finalVideoSeconds', 'CREATOR_STORE_RUNTIME_MISMATCH', entry);
  }
}

function validateCreatorPackManifest(manifest, options = {}) {
  if (!manifest || manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION || !Array.isArray(manifest.packs)) {
    throwStoreError('manifest', 'CREATOR_PACK_INVALID_MANIFEST');
  }
  assertUniqueManifestValues(manifest.packs);
  const packRoot = getCreatorPackRoot(options);
  for (const entry of manifest.packs) {
    validateCreatorPackSlug(entry.slug);
    if (entry.file !== `${entry.slug}.json`) {
      throwStoreError('manifest.file', 'CREATOR_PACK_MANIFEST_FILE_MISMATCH', entry);
    }
    for (const field of ['title', 'category', 'contentType', 'sourceStorySlug', 'publishedAt', 'updatedAt', 'generatorVersion', 'checksum']) {
      if (!entry[field]) throwStoreError(`manifest.${field}`, 'CREATOR_PACK_MANIFEST_MISSING_FIELD', entry);
    }
    const packPath = path.join(packRoot, entry.file);
    if (fs.existsSync(packPath)) {
      const actualChecksum = calculateCreatorPackChecksum(fs.readFileSync(packPath, 'utf8'));
      if (actualChecksum !== entry.checksum) {
        throwStoreError('manifest.checksum', 'CREATOR_PACK_MANIFEST_CHECKSUM_MISMATCH', entry);
      }
    }
  }
  return true;
}

function manifestEntryForPack(pack, file, checksum) {
  return {
    slug: pack.slug,
    file,
    title: pack.title,
    category: pack.creatorCategorySlug || pack.genre || '',
    contentType: pack.contentType || '',
    sourceStorySlug: pack.originalStorySlug || '',
    publishedAt: pack.publishedAt || '',
    updatedAt: pack.updatedAt || '',
    generatorVersion: pack.creatorPipelineVersion || '',
    checksum
  };
}

function assertUniqueManifestValues(entries) {
  const slugs = new Set();
  const files = new Set();
  for (const entry of entries || []) {
    if (slugs.has(entry.slug)) throwStoreError('manifest.slug', 'CREATOR_PACK_DUPLICATE_MANIFEST_SLUG', entry);
    if (files.has(entry.file)) throwStoreError('manifest.file', 'CREATOR_PACK_DUPLICATE_MANIFEST_FILE', entry);
    slugs.add(entry.slug);
    files.add(entry.file);
  }
}

function writeManifestIfChanged(manifest, options = {}) {
  const filePath = getCreatorPackManifestPath(options);
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8') === serialized) return { status: 'unchanged', filePath };
  writeJsonAtomic(filePath, manifest);
  return { status: 'updated', filePath };
}

function readPackFiles(packRoot) {
  if (!fs.existsSync(packRoot)) return [];
  return fs.readdirSync(packRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith('.json') && name !== 'manifest.json')
    .sort()
    .map((name) => path.join(packRoot, name));
}

function ensureInsideRoot(filePath, rootPath) {
  const relative = path.relative(rootPath, filePath);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throwStoreError('path', 'CREATOR_PACK_PATH_OUTSIDE_ROOT', { slug: path.basename(filePath, '.json') });
  }
}

function sortObjectForStorage(value) {
  if (Array.isArray(value)) return value.map(sortObjectForStorage);
  if (!value || typeof value !== 'object') return value;
  const ordered = {};
  Object.keys(value).sort().forEach((key) => {
    ordered[key] = sortObjectForStorage(value[key]);
  });
  return ordered;
}

function throwStoreError(field, code, entry = {}) {
  const error = new Error(`Creator Library store error: ${field}`);
  error.code = code;
  error.slug = entry.slug;
  error.stage = 'store';
  error.field = field;
  error.fallbackUsed = false;
  throw error;
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp-${process.pid}`;
  try {
    fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    JSON.parse(fs.readFileSync(tempPath, 'utf8'));
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    throw error;
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function countWords(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

module.exports = {
  getCreatorPackRoot,
  getCreatorPackPath,
  getCreatorPackManifestPath,
  validateCreatorPackSlug,
  readCreatorPack,
  readCreatorPackManifest,
  listCreatorPackEntries,
  iterateCreatorPacks,
  writeCreatorPackAtomic,
  upsertCreatorPack,
  removeCreatorPack,
  rebuildCreatorPackManifest,
  validateCreatorPackFile,
  calculateCreatorPackChecksum,
  stableSerializeCreatorPack,
  assertCreatorEntryIsSaveable,
  mergeCreatorLibraryEntries,
  mergeCreatorLibraryEntry,
  PACK_STORAGE_SCHEMA_VERSION,
  MANIFEST_SCHEMA_VERSION
};
