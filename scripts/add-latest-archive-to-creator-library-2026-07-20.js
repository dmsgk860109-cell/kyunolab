const fs = require('fs');
const path = require('path');
const {
  buildCreatorLibraryEntry,
  buildAndValidateCreatorLibraryEntry
} = require('./creator-library-pipeline');
const {
  loadCreatorLibraryEntries,
  saveCreatorLibraryEntries
} = require('./creator-library-store');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const categoriesPath = path.join(root, 'data', 'categories.json');
const perCategory = 3;

function main() {
  const stories = readJson(storiesPath);
  const scripts = loadCreatorLibraryEntries();
  const categories = readJson(categoriesPath);
  const existingScriptSlugs = new Set(scripts.map((script) => script.slug));
  const existingOriginalSlugs = new Set(scripts.map((script) => script.originalStorySlug).filter(Boolean));
  const additions = [];
  const failures = [];

  for (const category of categories) {
    const latestStories = stories
      .filter((story) => story.contentType === 'story' && story.categorySlug === category.slug)
      .slice(0, perCategory);

    for (const story of latestStories) {
      if (existingOriginalSlugs.has(story.slug)) continue;
      try {
        const script = buildAndValidateCreatorLibraryEntry(story, category);
        if (existingScriptSlugs.has(script.slug)) continue;
        additions.push(script);
        existingScriptSlugs.add(script.slug);
        existingOriginalSlugs.add(story.slug);
      } catch (error) {
        failures.push(formatPipelineFailure(story.slug, error));
      }
    }
  }

  if (additions.length) {
    saveCreatorLibraryEntries(additions);
  }

  console.log(`Added ${additions.length} Creator Library entries.`);
  for (const addition of additions) {
    console.log(`${addition.creatorCategorySlug}: ${addition.slug}`);
  }
  for (const failure of failures) {
    console.error(failure);
  }
  if (failures.length) process.exitCode = 1;
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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

if (require.main === module) {
  main();
}

module.exports = {
  buildCreatorLibraryEntry
};
