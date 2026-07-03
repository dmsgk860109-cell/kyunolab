const fs = require('fs');
const path = require('path');
const {
  validateContentDNA,
  findBannedPhrases,
  findGenericFaqQuestions,
  countVocabularyHits
} = require('./article-dna-utils');

const root = path.resolve(__dirname, '..');
const siteUrl = 'https://kyunolab.com';
const listPageSize = 12;
const errors = [];

const args = parseArgs(process.argv.slice(2));
const stories = readJson(path.join(root, 'data', 'stories.json'));
const categories = readOptionalJson(path.join(root, 'data', 'categories.json'));
const guides = readOptionalJson(path.join(root, 'data', 'guides.json'));
const siteConfig = readOptionalJson(path.join(root, 'data', 'site.json'), {});
const tagGroups = collectTagGroups([...stories, ...guides]);
const storyBySlug = new Map(stories.map((story) => [story.slug, story]));
const storyById = new Map(stories.map((story) => [story.id || story.slug, story]));
const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
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

validateGlobalStructure();
validateGuideStructure();
validateHomeConfig();
validateListPagination('newest');
validateListPagination('popular');
validateListPagination('archive');
validateSitemapIndexRules();

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

  validateStoryContentDNA(story);

  if (!categoryBySlug.has(story.categorySlug)) {
    errors.push(`${story.slug}: categorySlug "${story.categorySlug}" is not defined in data/categories.json`);
  }

  const relatedKeys = new Set();
  for (const relatedId of story.relatedStoryIds || []) {
    if (relatedId === story.slug || relatedId === story.id) {
      errors.push(`${story.slug}: relatedStoryIds cannot include itself`);
    }
    if (relatedKeys.has(relatedId)) {
      errors.push(`${story.slug}: duplicate relatedStoryId "${relatedId}"`);
    }
    if (!storyBySlug.has(relatedId)) {
      errors.push(`${story.slug}: relatedStoryId "${relatedId}" does not exist`);
    }
    relatedKeys.add(relatedId);
  }
}

function validateStoryContentDNA(story) {
  const result = validateContentDNA(story, stories);
  for (const error of result.errors) {
    errors.push(`${story.slug}: ${error}`);
  }

  const requiredMetadata = [
    'seoTitle',
    'displayTitle',
    'metaDescription',
    'seedKeyword',
    'searchIntent',
    'articleFormat',
    'sourceStatus',
    'primaryTag',
    'relatedKeywords',
    'summaryAnswer'
  ];

  for (const key of requiredMetadata) {
    const value = story[key];
    if (Array.isArray(value) ? value.length === 0 : !String(value || '').trim()) {
      errors.push(`${story.slug}: missing SEO/content metadata "${key}"`);
    }
  }

  if (Array.isArray(story.relatedKeywords) && story.relatedKeywords.some((keyword) => /\/|\.html|https?:/i.test(String(keyword)))) {
    errors.push(`${story.slug}: relatedKeywords must not be URL/page-generation targets`);
  }
}

function validateStoryPage(story) {
  const filePath = path.join(root, 'stories', `${story.slug}.html`);
  if (!fs.existsSync(filePath)) {
    errors.push(`${story.slug}: missing stories/${story.slug}.html`);
    return;
  }

  const html = fs.readFileSync(filePath, 'utf8');
  const bodyText = stripHtml(html);
  const cleanUrl = `${siteUrl}/stories/${story.slug}`;
  mustInclude(html, `<link rel="canonical" href="${cleanUrl}">`, story.slug, 'clean canonical URL');
  mustInclude(html, `<meta property="og:url" content="${cleanUrl}">`, story.slug, 'clean og:url');
  mustNotInclude(html, `/stories/${story.slug}.html`, story.slug, 'public .html story URL');
  mustInclude(html, '<meta property="og:type" content="article">', story.slug, 'article og:type');
  mustInclude(html, 'class="article-title"', story.slug, 'article title');
  mustInclude(html, 'engagement.js', story.slug, 'shared engagement script');
  mustInclude(html, 'Tags</dt>', story.slug, 'metadata tags row');

  const bannedPhrases = findBannedPhrases(bodyText);
  if (bannedPhrases.length) {
    errors.push(`${story.slug}: forbidden repeated phrase found: ${bannedPhrases.join(' | ')}`);
  }

  const genericFaq = findGenericFaqQuestions(html);
  if (genericFaq.length) {
    errors.push(`${story.slug}: FAQ questions are too generic: ${genericFaq.join(' | ')}`);
  }

  if (story.contentDNA?.targetQuery && !bodyText.toLowerCase().includes(String(story.contentDNA.targetQuery).toLowerCase())) {
    errors.push(`${story.slug}: opening/body does not include contentDNA.targetQuery`);
  }

  if (story.summaryAnswer) {
    const firstArticleText = bodyText.slice(0, 2500).toLowerCase();
    const summaryKey = String(story.summaryAnswer).split(/\s+/).slice(0, 8).join(' ').toLowerCase();
    if (summaryKey && !firstArticleText.includes(summaryKey)) {
      errors.push(`${story.slug}: summaryAnswer is not reflected near the beginning`);
    }
  }

  const vocabHits = countVocabularyHits(bodyText, story.contentDNA?.subjectSpecificVocabulary || []);
  if (vocabHits < 5) {
    errors.push(`${story.slug}: subjectSpecificVocabulary usage is too low (${vocabHits}/5)`);
  }

  const headings = extractHeadings(html);
  const blueprintTitles = (story.contentDNA?.sectionBlueprint || []).map((item) => typeof item === 'string' ? item : item.title).filter(Boolean);
  for (const title of blueprintTitles.slice(0, 4)) {
    if (!headings.some((heading) => normalize(heading) === normalize(title))) {
      errors.push(`${story.slug}: contentDNA heading missing from article page: "${title}"`);
    }
  }
}

function validateCategoryPage(story) {
  const categoryHtml = readCategoryPageSet(story.categorySlug);
  if (!categoryHtml) {
    errors.push(`${story.slug}: missing category page categories/${story.categorySlug}.html`);
    return;
  }

  mustInclude(categoryHtml, `href="/stories/${story.slug}"`, story.slug, `category link on ${story.categorySlug}`);
}

function readCategoryPageSet(categorySlug) {
  const categoryDir = path.join(root, 'categories');
  const firstPage = path.join(categoryDir, `${categorySlug}.html`);
  if (!fs.existsSync(firstPage)) return '';

  const pageFiles = fs.readdirSync(categoryDir)
    .filter((fileName) => fileName === `${categorySlug}.html` || fileName.startsWith(`${categorySlug}-`) && fileName.endsWith('.html'))
    .sort((a, b) => pageNumberFromCategoryFile(a, categorySlug) - pageNumberFromCategoryFile(b, categorySlug));

  return pageFiles.map((fileName) => fs.readFileSync(path.join(categoryDir, fileName), 'utf8')).join('\n');
}

function pageNumberFromCategoryFile(fileName, categorySlug) {
  if (fileName === `${categorySlug}.html`) return 1;
  const match = fileName.match(new RegExp(`^${escapeRegExp(categorySlug)}-(\\d+)\\.html$`));
  return match ? Number(match[1]) : 9999;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validateTagPages(story) {
  for (const tag of story.tags || []) {
    const tagLabel = normalizeTagLabel(tag);
    const tagSlug = slugify(tagLabel);
    const filePath = path.join(root, 'tags', tagSlug, 'index.html');
    if (!fs.existsSync(filePath)) {
      errors.push(`${story.slug}: missing tag page tags/${tagSlug}/index.html`);
      continue;
    }

    const html = fs.readFileSync(filePath, 'utf8');
    mustInclude(html, `href="/stories/${story.slug}"`, story.slug, `tag page link for ${tag}`);
    const tagGroup = tagGroups.get(tagSlug);
    if (tagGroup && tagGroup.indexable) {
      mustInclude(html, '<meta name="robots" content="index, follow">', story.slug, `index robots for tag ${tag}`);
    } else {
      mustInclude(html, '<meta name="robots" content="noindex, follow">', story.slug, `noindex robots for thin tag ${tag}`);
    }
  }
}

function validateSitemap(story) {
  const sitemap = readText('sitemap.xml');
  mustInclude(sitemap, `<loc>${siteUrl}/stories/${story.slug}</loc>`, story.slug, 'sitemap story URL');
  for (const tag of story.tags || []) {
    const tagSlug = slugify(normalizeTagLabel(tag));
    const tagGroup = tagGroups.get(tagSlug);
    const tagUrl = `<loc>${siteUrl}/tags/${tagSlug}/</loc>`;
    if (tagGroup && tagGroup.indexable) {
      mustInclude(sitemap, tagUrl, story.slug, `sitemap indexable tag URL ${tagSlug}`);
    } else if (sitemap.includes(tagUrl)) {
      errors.push(`${story.slug}: thin/noindex tag "${tagSlug}" should not be included in sitemap`);
    }
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

function validateGlobalStructure() {
  const seenSlugs = new Set();
  const seenIds = new Set();

  for (const story of stories) {
    if (seenSlugs.has(story.slug)) {
      errors.push(`${story.slug}: duplicate story slug`);
    }
    seenSlugs.add(story.slug);

    if (story.id) {
      if (seenIds.has(story.id)) {
        errors.push(`${story.slug}: duplicate story id "${story.id}"`);
      }
      seenIds.add(story.id);
    }
  }

  const storyDir = path.join(root, 'stories');
  for (const entry of fs.readdirSync(storyDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const slug = entry.name.replace(/\.html$/, '');
    if (!storyBySlug.has(slug)) {
      errors.push(`${entry.name}: orphan story file without data/stories.json record`);
    }
  }

  for (const category of categories) {
    const filePath = path.join(root, 'categories', `${category.slug}.html`);
    if (!fs.existsSync(filePath)) {
      errors.push(`${category.slug}: missing category archive page`);
    }
  }
}

function validateSitemapIndexRules() {
  const sitemap = readText('sitemap.xml');
  const forbiddenPatterns = [
    /<loc>https:\/\/kyunolab\.com\/(?:newest|popular|archive)-\d+\.html<\/loc>/,
    /<loc>https:\/\/kyunolab\.com\/categories\/[^<]+-\d+\.html<\/loc>/
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(sitemap)) {
      errors.push('sitemap.xml: pagination URL should not be included');
    }
  }

  for (const [tagSlug, tagGroup] of tagGroups.entries()) {
    const tagUrl = `<loc>${siteUrl}/tags/${tagSlug}/</loc>`;
    if (!tagGroup.indexable && sitemap.includes(tagUrl)) {
      errors.push(`sitemap.xml: noindex tag "${tagSlug}" should not be included`);
    }
    if (tagGroup.indexable && !sitemap.includes(tagUrl)) {
      errors.push(`sitemap.xml: indexable tag "${tagSlug}" is missing`);
    }
  }
}

function validateGuideStructure() {
  const seenSlugs = new Set();
  const sitemap = readText('sitemap.xml');
  const board = readText('mystery-board.html');

  for (const guide of guides) {
    if (!guide.slug) {
      errors.push(`${guide.title || 'guide'}: missing guide slug`);
      continue;
    }
    if (seenSlugs.has(guide.slug)) {
      errors.push(`${guide.slug}: duplicate guide slug`);
    }
    seenSlugs.add(guide.slug);

    if (!Array.isArray(guide.tags) || guide.tags.length < 3 || guide.tags.length > 5) {
      errors.push(`${guide.slug}: expected 3 to 5 tags in data/guides.json`);
    }

    const guideUrl = guide.url || `/mystery-board/${guide.slug}`;
    const filePath = path.join(root, 'mystery-board', `${guide.slug}.html`);
    if (!fs.existsSync(filePath)) {
      errors.push(`${guide.slug}: missing mystery-board/${guide.slug}.html`);
      continue;
    }

    const html = fs.readFileSync(filePath, 'utf8');
    mustInclude(html, `<link rel="canonical" href="${siteUrl}${guideUrl}">`, guide.slug, 'guide clean canonical URL');
    mustInclude(html, `<meta property="og:url" content="${siteUrl}${guideUrl}">`, guide.slug, 'guide clean og:url');
    mustNotInclude(html, `${guideUrl}.html`, guide.slug, 'public .html guide URL');
    mustInclude(board, `href="${guideUrl}"`, guide.slug, 'Mystery Board list link');
    mustInclude(sitemap, `<loc>${siteUrl}${guideUrl}</loc>`, guide.slug, 'sitemap guide URL');
  }

  const guideDir = path.join(root, 'mystery-board');
  if (fs.existsSync(guideDir)) {
    for (const entry of fs.readdirSync(guideDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
      const slug = entry.name.replace(/\.html$/, '');
      if (!seenSlugs.has(slug)) {
        errors.push(`${entry.name}: orphan Mystery Board file without data/guides.json record`);
      }
    }
  }
}

function validateHomeConfig() {
  const home = readText('index.html');

  validateConfiguredStoryId(siteConfig.featuredStoryId, 'featuredStoryId');

  for (const key of ['popularStoryIds', 'essentialStoryIds']) {
    if (!Array.isArray(siteConfig[key])) {
      errors.push(`data/site.json: "${key}" must be an array`);
      continue;
    }
    for (const id of siteConfig[key]) {
      validateConfiguredStoryId(id, key);
    }
  }

  const featuredStory = getStoryByConfiguredId(siteConfig.featuredStoryId);
  if (featuredStory) {
    mustInclude(home, `href="/stories/${featuredStory.slug}"`, 'homepage', 'configured featured story link');
  }

  for (const group of siteConfig.homeCategoryGroups || []) {
    for (const slug of group.categorySlugs || []) {
      if (!categoryBySlug.has(slug)) {
        errors.push(`data/site.json: home category slug "${slug}" is not defined in data/categories.json`);
      }
      mustInclude(home, `href="/categories/${slug}.html"`, 'homepage', `configured home category ${slug}`);
    }
  }
}

function validateConfiguredStoryId(id, key) {
  if (!id) {
    errors.push(`data/site.json: missing "${key}" value`);
    return;
  }
  if (!getStoryByConfiguredId(id)) {
    errors.push(`data/site.json: "${key}" references unknown story "${id}"`);
  }
}

function getStoryByConfiguredId(id) {
  return storyBySlug.get(id) || storyById.get(id);
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

function readOptionalJson(filePath, fallback = []) {
  if (!fs.existsSync(filePath)) return fallback;
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

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHeadings(html) {
  const headings = [];
  const pattern = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    headings.push(stripHtml(match[1]));
  }
  return headings;
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeTagLabel(label) {
  const value = String(label || '').trim();
  const key = value.toLowerCase();
  const aliasMap = new Map([
    ['도깨비 전설', '도깨비'],
    ['한국 도깨비', '도깨비'],
    ['도깨비 이야기', '도깨비'],
    ['구미호 전설', '구미호'],
    ['한국 구미호', '구미호'],
    ['아홉 꼬리 여우', '구미호'],
    ['인어 전설', '인어'],
    ['바다 인어', '인어'],
    ['인어 이야기', '인어'],
    ['일본 요괴', '요괴'],
    ['요괴 이야기', '요괴'],
    ['요괴 전설', '요괴']
  ]);

  return aliasMap.get(key) || value;
}

function collectTagGroups(items) {
  const groups = new Map();

  for (const item of items) {
    const tags = Array.isArray(item.tags) && item.tags.length ? item.tags : [item.tag];
    for (const tag of tags) {
      const label = normalizeTagLabel(tag);
      const slug = slugify(label);
      if (!slug) continue;
      if (!groups.has(slug)) {
        groups.set(slug, { label, slug, articles: [] });
      }
      groups.get(slug).articles.push(item);
    }
  }

  for (const group of groups.values()) {
    group.description = getTagDescription(group);
    group.indexable = group.articles.length >= 3 && Boolean(group.description) && group.articles.length > 0;
  }

  return groups;
}

function getTagDescription(group) {
  const count = group.articles.length;
  const categorySet = new Set(group.articles.map((article) => article.category).filter(Boolean));
  if (count < 3) return '';
  if (categorySet.size < 1) return '';
  return `A focused archive path for ${group.label}, collecting ${count} related Kyunolab records across ${categorySet.size} shelf${categorySet.size === 1 ? '' : 'ves'}.`;
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
