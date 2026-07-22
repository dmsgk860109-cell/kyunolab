const fs = require('fs');
const path = require('path');
const {
  buildAndValidateCreatorLibraryEntry
} = require('./creator-library-pipeline');
const {
  loadCreatorLibraryEntries,
  saveCreatorLibraryEntry
} = require('./creator-library-store');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const categoriesPath = path.join(root, 'data', 'categories.json');

function main() {
  const stories = readJson(storiesPath);
  const scripts = loadCreatorLibraryEntries();
  const categories = readJson(categoriesPath);
  const existingScriptSlugs = new Set(scripts.map((script) => script.slug));
  const existingOriginalSlugs = new Set(scripts.map((script) => script.originalStorySlug).filter(Boolean));

  for (const story of sortNewest(stories).filter((item) => item.contentType === 'story')) {
    if (existingOriginalSlugs.has(story.slug)) continue;
    const category = categories.find((item) => item.slug === story.categorySlug);
    if (!category) continue;

    try {
      const script = buildAndValidateCreatorLibraryEntry(story, category);
      if (existingScriptSlugs.has(script.slug)) {
        console.log(`Skipped ${story.slug}: script slug already exists (${script.slug}).`);
        continue;
      }
      saveCreatorLibraryEntry(script);
      console.log(`Added 1 Creator Library entry.`);
      console.log(`${script.creatorCategorySlug}: ${script.slug}`);
      return;
    } catch (error) {
      console.error(formatPipelineFailure(story.slug, error));
      process.exitCode = 1;
      return;
    }
  }

  console.log('Skipped: no unconverted archive story found.');
}

function formatPipelineFailure(slug, error) {
  return [
    `Skipped ${slug}: ${error.message}`,
    `stage=${error.stage || 'unknown'}`,
    `code=${error.code || 'UNKNOWN_ERROR'}`,
    `field=${error.field || 'n/a'}`,
    `scene=${error.sceneIndex || 'n/a'}`,
    `part=${error.partIndex || 'n/a'}`,
    `beat=${error.beatIndex || 'n/a'}`,
    'saved=false',
    'fallbackUsed=false'
  ].join(' | ');
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

if (require.main === module) {
  main();
}
