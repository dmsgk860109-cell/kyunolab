const fs = require('fs');
const path = require('path');
const {
  normalizeCreatorStoryInput
} = require('./creator-library-input');
const {
  buildCreatorLibraryEntry
} = require('./add-latest-archive-to-creator-library-2026-07-20');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const scriptsPath = path.join(root, 'data', 'scripts.json');
const categoriesPath = path.join(root, 'data', 'categories.json');

function main() {
  const stories = readJson(storiesPath);
  const scripts = readJson(scriptsPath);
  const categories = readJson(categoriesPath);
  const existingScriptSlugs = new Set(scripts.map((script) => script.slug));
  const existingOriginalSlugs = new Set(scripts.map((script) => script.originalStorySlug).filter(Boolean));
  const additions = [];

  for (const category of categories) {
    const story = sortNewest(stories)
      .find((item) => item.contentType === 'story'
        && item.categorySlug === category.slug
        && !existingOriginalSlugs.has(item.slug));

    if (!story) {
      console.log(`Skipped ${category.slug}: no unconverted archive story found.`);
      continue;
    }

    const normalizedInput = normalizeCreatorStoryInput(story, category);
    const script = buildCreatorLibraryEntry(story, category, { normalizedInput });
    if (existingScriptSlugs.has(script.slug)) {
      console.log(`Skipped ${category.slug}: script slug already exists (${script.slug}).`);
      continue;
    }

    additions.push(script);
    existingScriptSlugs.add(script.slug);
    existingOriginalSlugs.add(story.slug);
  }

  scripts.unshift(...additions);
  writeJson(scriptsPath, scripts);

  console.log(`Added ${additions.length} Creator Library entries.`);
  for (const addition of additions) {
    console.log(`${addition.creatorCategorySlug}: ${addition.slug}`);
  }
}

function sortNewest(items) {
  return [...items].sort((a, b) => {
    const dateCompare = String(b.publishedAt || b.updatedAt || '').localeCompare(String(a.publishedAt || a.updatedAt || ''));
    if (dateCompare !== 0) return dateCompare;
    return String(b.slug || '').localeCompare(String(a.slug || ''));
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

if (require.main === module) {
  main();
}
