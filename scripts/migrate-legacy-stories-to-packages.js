const fs = require('fs');
const path = require('path');
const { loadStories } = require('./lib/load-stories');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const packagesDir = path.join(root, 'data', 'stories');
const indexPath = path.join(packagesDir, 'index.json');
const siteUrl = 'https://kyunolab.com';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function storyPackageFromLegacy(story) {
  return {
    ...story,
    pathname: `/stories/${story.slug}`,
    canonicalUrl: `${siteUrl}/stories/${story.slug}`
  };
}

function main() {
  const before = loadStories(root);
  const stories = readJson(storiesPath);
  if (!Array.isArray(stories)) throw new Error('data/stories.json must contain an array.');

  fs.mkdirSync(packagesDir, { recursive: true });

  let created = 0;
  let existing = 0;
  for (const story of stories) {
    if (!story?.id || !story?.slug) throw new Error('Every story requires id and slug.');
    const fileName = `${story.slug}.json`;
    const filePath = path.join(packagesDir, fileName);
    if (fs.existsSync(filePath)) {
      existing += 1;
      continue;
    }
    writeJson(filePath, storyPackageFromLegacy(story));
    created += 1;
  }

  const entries = stories.map((story) => ({
    id: story.id,
    slug: story.slug,
    file: `${story.slug}.json`
  }));
  writeJson(indexPath, entries);

  const after = loadStories(root);
  const beforeText = JSON.stringify(before);
  const afterText = JSON.stringify(after);
  if (beforeText !== afterText) {
    throw new Error('Migration changed loadStories output.');
  }

  console.log(JSON.stringify({
    stories: stories.length,
    existingPackages: existing,
    createdPackages: created,
    indexEntries: entries.length,
    loadStoriesUnchanged: true
  }, null, 2));
}

main();

