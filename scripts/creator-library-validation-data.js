const fs = require('fs');
const path = require('path');
const {
  iterateCreatorPacks,
  getCreatorPackManifestPath,
  getCreatorPackRoot
} = require('./creator-library-store');

const root = path.resolve(__dirname, '..');

function loadCreatorValidationPacks(options = {}) {
  const storeOptions = options.root ? { root: options.root } : {};
  const manifestPath = getCreatorPackManifestPath(storeOptions);
  if (fs.existsSync(manifestPath)) {
    const packs = iterateCreatorPacks(storeOptions);
    if (packs.length) return packs;
  }
  const storeRoot = getCreatorPackRoot(storeOptions);
  const error = new Error(`No Creator Library validation source found. Expected ${manifestPath}.`);
  error.code = 'CREATOR_VALIDATION_SOURCE_MISSING';
  error.storeRoot = storeRoot;
  throw error;
}

function loadCreatorValidationStorySlugs(options = {}) {
  return unique(loadCreatorValidationPacks(options).map((pack) => pack.originalStorySlug).filter(Boolean));
}

function legacyScriptsFileExists() {
  return false;
}

function unique(values) {
  return [...new Set(values)];
}

module.exports = {
  loadCreatorValidationPacks,
  loadCreatorValidationStorySlugs,
  legacyScriptsFileExists
};
