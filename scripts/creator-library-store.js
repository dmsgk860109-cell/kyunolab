const fs = require('fs');
const path = require('path');
const {
  CREATOR_PIPELINE_VERSION,
  validateCreatorLibraryEntry
} = require('./creator-library-pipeline');

const root = path.resolve(__dirname, '..');
const scriptsPath = path.join(root, 'data', 'scripts.json');

function loadCreatorLibraryEntries(options = {}) {
  return readJson(options.scriptsPath || scriptsPath);
}

function saveCreatorLibraryEntry(entry, options = {}) {
  return saveCreatorLibraryEntries([entry], options);
}

function saveCreatorLibraryEntries(entries, options = {}) {
  const current = options.currentEntries || loadCreatorLibraryEntries(options);
  const additions = ensureArray(entries);
  const next = mergeCreatorLibraryEntries(current, additions);
  if (options.dryRun) return next;
  writeJsonAtomic(options.scriptsPath || scriptsPath, next);
  return next;
}

function mergeCreatorLibraryEntries(currentEntries, entries) {
  const additions = ensureArray(entries);
  additions.forEach(assertCreatorEntryIsSaveable);
  const additionSlugs = new Set(additions.map((entry) => entry.slug));
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

function throwStoreError(field, code, entry = {}) {
  const error = new Error(`Creator Library entry is not saveable: ${field}`);
  error.code = code;
  error.slug = entry.slug;
  error.stage = 'store';
  error.field = field;
  error.fallbackUsed = false;
  throw error;
}

function writeJsonAtomic(filePath, value) {
  const tempPath = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(tempPath, filePath);
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
  loadCreatorLibraryEntries,
  saveCreatorLibraryEntry,
  saveCreatorLibraryEntries,
  assertCreatorEntryIsSaveable,
  mergeCreatorLibraryEntry
};
