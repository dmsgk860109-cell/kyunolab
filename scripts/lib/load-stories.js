const fs = require('fs');
const path = require('path');
const { readJsonFile } = require('./json-utils');

const DEFAULT_ROOT = path.resolve(__dirname, '..', '..');
const LEGACY_PATH = ['data', 'stories.json'];
const INDEX_PATH = ['data', 'stories', 'index.json'];

function loadStories(root = DEFAULT_ROOT) {
  const legacyStories = loadLegacyStories(root);
  const entries = loadIndependentEntries(root);
  validateUniqueLegacyIdentity(legacyStories);
  validateUniqueIndependentIdentity(entries);

  const merged = legacyStories.map((story) => ({ ...story }));
  const legacyById = new Map(legacyStories.map((story, index) => [story.id, { story, index }]));

  for (const entry of entries) {
    const packagePath = resolvePackagePath(root, entry.file);
    const packageData = readJsonFile(packagePath, `independent Story file for ${entry.id}`);
    const found = legacyById.get(entry.id);

    if (!found) throw new Error(`Independent Story ${entry.id}: no matching legacy record exists.`);
    validateIndependentPackage(entry, packageData, found.story, packagePath);
    merged[found.index] = mergeStory(found.story, packageData);
  }

  return merged;
}

function loadLegacyStories(root = DEFAULT_ROOT) {
  const stories = readJsonFile(path.join(root, ...LEGACY_PATH), 'legacy stories.json');
  if (!Array.isArray(stories)) throw new Error('Legacy stories.json must contain an array.');
  return stories;
}

function loadIndependentEntries(root = DEFAULT_ROOT) {
  const indexPath = path.join(root, ...INDEX_PATH);
  if (!fs.existsSync(indexPath)) return [];
  const index = readJsonFile(indexPath, 'independent Story index');
  const entries = Array.isArray(index) ? index : index.stories;
  if (!Array.isArray(entries)) throw new Error('data/stories/index.json must contain a stories array.');

  return entries.map((entry, indexPosition) => {
    if (!entry || typeof entry !== 'object') throw new Error(`Independent Story index entry ${indexPosition + 1} is invalid.`);
    for (const key of ['id', 'slug', 'file']) {
      if (typeof entry[key] !== 'string' || !entry[key].trim()) {
        throw new Error(`Independent Story index entry ${indexPosition + 1} is missing ${key}.`);
      }
    }
    return { id: entry.id, slug: entry.slug, file: entry.file };
  });
}

function getIndependentEntries(root = DEFAULT_ROOT) {
  return loadIndependentEntries(root);
}

function writeLegacyStories(root = DEFAULT_ROOT, mergedStories) {
  const legacyStories = loadLegacyStories(root);
  const independentIds = new Set(loadIndependentEntries(root).map((entry) => entry.id));
  const mergedById = new Map(mergedStories.map((story) => [story.id, story]));
  const next = legacyStories.map((legacyStory) => {
    if (independentIds.has(legacyStory.id)) return legacyStory;
    return mergedById.get(legacyStory.id) || legacyStory;
  });
  fs.writeFileSync(path.join(root, ...LEGACY_PATH), `${JSON.stringify(next, null, 2)}\n`, 'utf8');
}

function writeStory(root = DEFAULT_ROOT, story) {
  const independentEntry = loadIndependentEntries(root).find((entry) => entry.id === story.id && entry.slug === story.slug);
  if (independentEntry) {
    const legacyStory = loadLegacyStories(root).find((item) => item.id === story.id);
    if (!legacyStory) throw new Error(`Cannot write independent Story ${story.id}: legacy record is missing.`);
    const packageData = {
      ...story,
      pathname: pathnameFor(story.slug),
      canonicalUrl: canonicalFor(story.slug)
    };
    validateIndependentPackage(independentEntry, packageData, legacyStory, resolvePackagePath(root, independentEntry.file));
    fs.writeFileSync(resolvePackagePath(root, independentEntry.file), `${JSON.stringify(packageData, null, 2)}\n`, 'utf8');
    return;
  }

  const legacyStories = loadLegacyStories(root);
  const index = legacyStories.findIndex((item) => item.id === story.id);
  if (index < 0) throw new Error(`Cannot write Story ${story.id}: legacy record is missing.`);
  legacyStories[index] = story;
  fs.writeFileSync(path.join(root, ...LEGACY_PATH), `${JSON.stringify(legacyStories, null, 2)}\n`, 'utf8');
}

function validateUniqueLegacyIdentity(stories) {
  const ids = new Set();
  const slugs = new Set();
  for (const story of stories) {
    if (!story || !story.id || !story.slug) throw new Error('Every legacy Story requires id and slug.');
    if (ids.has(story.id)) throw new Error(`Duplicate legacy Story id: ${story.id}`);
    if (slugs.has(story.slug)) throw new Error(`Duplicate legacy Story slug: ${story.slug}`);
    ids.add(story.id);
    slugs.add(story.slug);
  }
}

function validateUniqueIndependentIdentity(entries) {
  const ids = new Set();
  const slugs = new Set();
  for (const entry of entries) {
    if (ids.has(entry.id)) throw new Error(`Duplicate independent Story id: ${entry.id}`);
    if (slugs.has(entry.slug)) throw new Error(`Duplicate independent Story slug: ${entry.slug}`);
    ids.add(entry.id);
    slugs.add(entry.slug);
  }
}

function validateIndependentPackage(entry, packageData, legacyStory, packagePath) {
  const label = `Independent Story ${entry.id} (${packagePath})`;
  const expected = {
    id: legacyStory.id,
    slug: legacyStory.slug,
    pathname: pathnameFor(legacyStory.slug),
    canonicalUrl: canonicalFor(legacyStory.slug),
    category: legacyStory.category
  };

  for (const [key, value] of Object.entries(expected)) {
    if (packageData[key] !== value) throw new Error(`${label}: ${key} must match the legacy Story identity.`);
  }
  if (entry.id !== expected.id || entry.slug !== expected.slug) {
    throw new Error(`${label}: index identity does not match the legacy Story identity.`);
  }
  if (!nonEmptyString(packageData.title) || !nonEmptyString(packageData.h1)) {
    throw new Error(`${label}: title and h1 are required content fields.`);
  }
  const article = packageData.longformArticle;
  if (!article || typeof article !== 'object') throw new Error(`${label}: longformArticle is required.`);
  if (!Array.isArray(article.storyBody) || article.storyBody.length === 0) {
    throw new Error(`${label}: longformArticle.storyBody is required.`);
  }
  for (const section of article.storyBody) {
    if (!nonEmptyString(section.id) || !nonEmptyString(section.heading) || !Array.isArray(section.paragraphs)) {
      throw new Error(`${label}: every storyBody section requires id, heading, and paragraphs.`);
    }
  }
  const answer = article.quickAnswer;
  if (!answer || !['identity', 'role', 'importance'].every((key) => nonEmptyString(answer[key]))) {
    throw new Error(`${label}: quickAnswer identity, role, and importance are required.`);
  }
  if (!Array.isArray(article.qa) || article.qa.length === 0 || !Array.isArray(packageData.qa) || packageData.qa.length === 0) {
    throw new Error(`${label}: Q&A is required in both Story fields.`);
  }
  if (!nonEmptyString(article.storySourceNote) || !nonEmptyString(packageData.storySourceNote)) {
    throw new Error(`${label}: Source Note is required in both Story fields.`);
  }
  if (!Array.isArray(article.references) || article.references.length === 0) throw new Error(`${label}: Sources are required.`);
  if (!Array.isArray(article.relatedKeywords) || article.relatedKeywords.length === 0 || !Array.isArray(packageData.relatedKeywords) || packageData.relatedKeywords.length === 0) {
    throw new Error(`${label}: Related Keywords are required in both Story fields.`);
  }
}

function mergeStory(legacyStory, packageData) {
  const { id, slug, pathname, canonicalUrl, category, ...content } = packageData;
  return { ...legacyStory, ...content };
}

function resolvePackagePath(root, file) {
  const directory = path.join(root, 'data', 'stories');
  const resolved = path.resolve(directory, file);
  if (!resolved.startsWith(`${directory}${path.sep}`)) throw new Error(`Independent Story file must remain inside data/stories: ${file}`);
  if (!fs.existsSync(resolved)) throw new Error(`Independent Story file is missing: ${resolved}`);
  return resolved;
}

function pathnameFor(slug) {
  return `/stories/${slug}`;
}

function canonicalFor(slug) {
  return `https://kyunolab.com${pathnameFor(slug)}`;
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

module.exports = {
  loadStories,
  loadLegacyStories,
  loadIndependentEntries,
  getIndependentEntries,
  writeLegacyStories,
  writeStory
};
