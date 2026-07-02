const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const stories = readJson(path.join(root, 'data', 'stories.json'));
const guides = readOptionalJson(path.join(root, 'data', 'guides.json'));
const articles = [...stories, ...guides];
const broadTags = new Set(['Mystery', 'Story', 'Legend', 'Strange', 'Interesting', 'Article', 'Folklore']);
const errors = [];

for (const article of articles) {
  const tags = getTags(article);
  const label = article.slug || article.id || article.title;

  if (tags.length < 3 || tags.length > 5) {
    errors.push(`${label}: expected 3 to 5 tags, found ${tags.length}`);
  }

  const seen = new Set();
  for (const tag of tags) {
    if (broadTags.has(tag)) {
      errors.push(`${label}: tag "${tag}" is too broad`);
    }
    if (article.category && normalize(tag) === normalize(article.category)) {
      errors.push(`${label}: tag "${tag}" duplicates its category`);
    }
    const key = normalize(tag);
    if (seen.has(key)) {
      errors.push(`${label}: duplicate tag "${tag}"`);
    }
    seen.add(key);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Validated tags for ${articles.length} articles.`);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readOptionalJson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return readJson(filePath);
}

function getTags(article) {
  if (Array.isArray(article.tags) && article.tags.length) {
    return article.tags.map((tag) => String(tag).trim()).filter(Boolean);
  }
  return article.tag ? [String(article.tag).trim()] : [];
}

function normalize(value) {
  return String(value).trim().toLowerCase();
}
