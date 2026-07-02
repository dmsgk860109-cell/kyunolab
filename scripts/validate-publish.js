const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const siteUrl = 'https://kyunolab.com';
const listPageSize = 12;
const errors = [];

const args = parseArgs(process.argv.slice(2));
const stories = readJson(path.join(root, 'data', 'stories.json'));
const guides = readOptionalJson(path.join(root, 'data', 'guides.json'));
const storyBySlug = new Map(stories.map((story) => [story.slug, story]));
const guideBySlug = new Map(guides.map((guide) => [guide.slug, guide]));
const targetSlugs = args.all ? stories.map((story) => story.slug) : args.slugs;

if (!args.all && targetSlugs.length === 0) {
  failWithUsage('Provide one or more story slugs, or use --all.');
}

for (const slug of targetSlugs) {
  const story = storyBySlug.get(slug);
  if (!story) {
    errors.push(`${slug}: no matching record in data/stories.json`);
    continue;
  }

  validateStoryRecord(story);
  validateStoryPage(story);
  validateCategoryPage(story);
  validateTagPages(story);
  validateSitemap(story);
  validateRss(story);
}

validateListPagination('newest');
validateListPagination('popular');
validateListPagination('archive');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const mode = args.all ? 'all stories' : `${targetSlugs.length} target slug(s)`;
console.log(`Publish validation passed for ${mode}.`);

function parseArgs(values) {
  const parsed = { all: false, slugs: [] };

  for (const value of values) {
    if (value === '--all') {
      parsed.all = true;
      continue;
    }
    if (value.startsWith('--slugs=')) {
      parsed.slugs.push(...splitSlugs(value.slice('--slugs='.length)));
      continue;
    }
    if (!value.startsWith('--')) {
      parsed.slugs.push(...splitSlugs(value));
    }
  }

  parsed.slugs = Array.from(new Set(parsed.slugs.map((slug) => slug.trim()).filter(Boolean)));
  return parsed;
}

function splitSlugs(value) {
  return String(value).split(',').map((slug) => slug.trim()).filter(Boolean);
}

function validateStoryRecord(story) {
  const required = [
    'slug',
    'title',
    'metaDescription',
    'category',
    'categorySlug',
    'readTime',
    'storyType',
    'sourceStatus',
    'excerpt',
    'publishedAt',
    'updatedAt'
  ];

  for (const key of required) {
    if (!story[key]) {
      errors.push(`${story.slug || story.title}: missing metadata field "${key}"`);
    }
  }

  if (!Array.isArray(story.tags) || story.tags.length < 3 || story.tags.length > 5) {
    errors.push(`${story.slug}: expected 3 to 5 tags in data/stories.json`);
  }

  const tagKeys = new Set();
  for (const tag of story.tags || []) {
    const key = normalize(tag);
    if (!key) {
      errors.push(`${story.slug}: empty tag value`);
      continue;
    }
    if (tagKeys.has(key)) {
      errors.push(`${story.slug}: duplicate tag "${tag}"`);
    }
    if (normalize(story.category) === key) {
      errors.push(`${story.slug}: tag "${tag}" duplicates category`);
    }
    tagKeys.add(key);
  }

  if (story.relatedStoryIds && !Array.isArray(story.relatedStoryIds)) {
    errors.push(`${story.slug}: relatedStoryIds must be an array`);
  }
}

function validateStoryPage(story) {
  const filePath = path.join(root, 'stories', `${story.slug}.html`);
  if (!fs.existsSync(filePath)) {
    errors.push(`${story.slug}: missing stories/${story.slug}.html`);
    return;
  }

  const html = fs.readFileSync(filePath, 'utf8');
  const cleanUrl = `${siteUrl}/stories/${story.slug}`;
  mustInclude(html, `<link rel="canonical" href="${cleanUrl}">`, story.slug, 'clean canonical URL');
  mustInclude(html, `<meta property="og:url" content="${cleanUrl}">`, story.slug, 'clean og:url');
  mustNotInclude(html, `/stories/${story.slug}.html`, story.slug, 'public .html story URL');
  mustInclude(html, '<meta property="og:type" content="article">', story.slug, 'article og:type');
  mustInclude(html, 'class="article-title"', story.slug, 'article title');
  mustInclude(html, 'engagement.js', story.slug, 'shared engagement script');
  mustInclude(html, 'Tags</dt>', story.slug, 'metadata tags row');
}

function validateCategoryPage(story) {
  const filePath = path.join(root, 'categories', `${story.categorySlug}.html`);
  if (!fs.existsSync(filePath)) {
    errors.push(`${story.slug}: missing category page categories/${story.categorySlug}.html`);
    return;
  }

  const html = fs.readFileSync(filePath, 'utf8');
  mustInclude(html, `href="/stories/${story.slug}"`, story.slug, `category link on ${story.categorySlug}`);
}

function validateTagPages(story) {
  for (const tag of story.tags || []) {
    const tagSlug = slugify(tag);
    const filePath = path.join(root, 'tags', tagSlug, 'index.html');
    if (!fs.existsSync(filePath)) {
      errors.push(`${story.slug}: missing tag page tags/${tagSlug}/index.html`);
      continue;
    }

    const html = fs.readFileSync(filePath, 'utf8');
    mustInclude(html, `href="/stories/${story.slug}"`, story.slug, `tag page link for ${tag}`);
  }
}

function validateSitemap(story) {
  const sitemap = readText('sitemap.xml');
  mustInclude(sitemap, `<loc>${siteUrl}/stories/${story.slug}</loc>`, story.slug, 'sitemap story URL');
  for (const tag of story.tags || []) {
    const tagSlug = slugify(tag);
    mustInclude(sitemap, `<loc>${siteUrl}/tags/${tagSlug}/</loc>`, story.slug, `sitemap tag URL ${tagSlug}`);
  }
}

function validateRss(story) {
  const rss = readText('rss.xml');
  const rssStoryLimit = countRssStoryLinks(rss) || 20;
  const rssStories = stories.slice(0, rssStoryLimit);
  if (rssStories.some((item) => item.slug === story.slug)) {
    mustInclude(rss, `${siteUrl}/stories/${story.slug}`, story.slug, 'RSS URL for recent story');
  }
}

function validateListPagination(baseName) {
  const expectedPages = Math.max(1, Math.ceil(stories.length / listPageSize));
  for (let page = 1; page <= expectedPages; page += 1) {
    const fileName = page === 1 ? `${baseName}.html` : `${baseName}-${page}.html`;
    const filePath = path.join(root, fileName);
    if (!fs.existsSync(filePath)) {
      errors.push(`${baseName}: missing expected pagination file ${fileName}`);
    }
  }
}

function mustInclude(haystack, needle, label, reason) {
  if (!haystack.includes(needle)) {
    errors.push(`${label}: missing ${reason}`);
  }
}

function mustNotInclude(haystack, needle, label, reason) {
  if (haystack.includes(needle)) {
    errors.push(`${label}: found forbidden ${reason}`);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readOptionalJson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return readJson(filePath);
}

function readText(fileName) {
  const filePath = path.join(root, fileName);
  if (!fs.existsSync(filePath)) {
    errors.push(`missing ${fileName}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function countRssStoryLinks(rss) {
  return (rss.match(/<link>https:\/\/kyunolab\.com\/stories\//g) || []).length;
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function failWithUsage(message) {
  console.error(`${message}

Usage:
  node scripts/validate-publish.js --slugs=story-slug,another-story-slug
  node scripts/validate-publish.js story-slug another-story-slug
  node scripts/validate-publish.js --all`);
  process.exit(1);
}
