const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { loadLegacyStories, loadIndependentEntries } = require('./lib/load-stories');

const root = path.resolve(__dirname, '..');
const storyId = argumentValue('--story');
const inputPath = argumentValue('--input');

if (!storyId || !inputPath) {
  throw new Error('Usage: node scripts/promote-manual-story-package.js --story <story-id> --input <manual-story.md>');
}

const sourcePath = path.resolve(inputPath);
if (!fs.existsSync(sourcePath)) throw new Error(`Input file not found: ${sourcePath}`);

const legacyStories = loadLegacyStories(root);
const legacy = legacyStories.find((story) => story.id === storyId || story.slug === storyId);
if (!legacy) throw new Error(`Legacy story not found: ${storyId}`);

const packageData = parsePackage(fs.readFileSync(sourcePath, 'utf8'));
const entry = {
  id: legacy.id,
  slug: legacy.slug,
  file: `${legacy.slug}.json`
};

const output = {
  ...legacy,
  title: packageData.title,
  displayTitle: packageData.title,
  h1: packageData.title,
  seoTitle: packageData.title,
  metaTitle: packageData.title,
  metaDescription: packageData.metaDescription,
  excerpt: packageData.excerpt,
  introSummary: packageData.deck,
  summaryAnswer: packageData.summaryAnswer,
  readTime: packageData.readTime,
  updatedAt: packageData.updatedAt,
  pathname: `/stories/${legacy.slug}`,
  canonicalUrl: `https://kyunolab.com/stories/${legacy.slug}`,
  qa: packageData.qa,
  storySourceNote: packageData.sourceNote,
  references: packageData.sources,
  relatedKeywords: packageData.relatedKeywords,
  secondaryKeywords: packageData.relatedKeywords,
  storyBrief: packageData.storyBrief,
  contentDNA: {
    ...(legacy.contentDNA || {}),
    sectionBlueprint: packageData.sections.map((section) => ({ id: section.id, heading: section.heading }))
  },
  longformArticle: {
    contentPackageVersion: 'archive-story-content-v1',
    deck: packageData.deck,
    opening: packageData.opening,
    storyBody: packageData.sections,
    quickAnswer: packageData.quickAnswer,
    qa: packageData.qa,
    storySourceNote: packageData.sourceNote,
    references: packageData.sources,
    relatedKeywords: packageData.relatedKeywords
  }
};

writeJson(path.join(root, 'data', 'stories', entry.file), output);
writeMarkdownCopy(sourcePath, path.join(root, 'data', 'stories', `${legacy.slug}.md`));
upsertIndependentEntry(entry);

execFileSync(process.execPath, [path.join(__dirname, 'apply-content-dna.js'), '--story', legacy.slug], {
  stdio: 'inherit'
});

console.log(`Promoted manual story package for ${legacy.slug}.`);

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

function parsePackage(markdown) {
  const title = firstMatch(markdown, /^#\s+(.+)$/m, 'title').trim();
  const metaDescription = block(markdown, '## Meta Description', '## Excerpt').replace(/\s+/g, ' ').trim();
  const excerpt = block(markdown, '## Excerpt', '## Deck').replace(/\s+/g, ' ').trim();
  const deck = block(markdown, '## Deck', '## Story Brief').replace(/\s+/g, ' ').trim();
  const storyBrief = JSON.parse(block(markdown, '## Story Brief', '## STORY_BODY'));
  const body = parseBody(block(markdown, '## STORY_BODY', '## Quick Answer'));
  const quickAnswerBlock = block(markdown, '## Quick Answer', '## Q&A');
  const qa = parseQa(block(markdown, '## Q&A', '## Source Note'));
  const sourceNote = block(markdown, '## Source Note', '## Sources').replace(/\s+/g, ' ').trim();
  const sources = parseList(block(markdown, '## Sources', '## Related Keywords')).map(parseSource);
  const relatedKeywords = parseList(markdown.replace(/^[\s\S]*?^## Related Keywords\s*\r?\n/m, ''));
  const wordCount = countWords([
    ...body.opening,
    ...body.sections.flatMap((section) => section.paragraphs),
    ...qa.flatMap((item) => [item.question, item.answer]),
    sourceNote
  ].join(' '));

  return {
    title,
    metaDescription,
    excerpt,
    deck,
    storyBrief,
    opening: body.opening,
    sections: body.sections,
    quickAnswer: {
      identity: subsection(quickAnswerBlock, 'Identity'),
      role: subsection(quickAnswerBlock, 'Role'),
      importance: subsection(quickAnswerBlock, 'Importance')
    },
    qa,
    sourceNote,
    sources,
    relatedKeywords,
    readTime: `${Math.max(8, Math.ceil(wordCount / 250))} min read`,
    updatedAt: '2026-07-29',
    summaryAnswer: subsection(quickAnswerBlock, 'Role')
  };
}

function parseBody(body) {
  const headingPattern = /<h2\s+id="([a-z0-9-]+)">([^<]+)<\/h2>/g;
  const matches = [...body.matchAll(headingPattern)];
  if (!matches.length) throw new Error('STORY_BODY requires explicit <h2 id=""> headings.');
  return {
    opening: paragraphs(body.slice(0, matches[0].index)),
    sections: matches.map((match, index) => ({
      id: match[1],
      heading: match[2].trim(),
      paragraphs: paragraphs(body.slice(match.index + match[0].length, matches[index + 1]?.index))
    }))
  };
}

function block(markdown, start, end) {
  const expression = new RegExp(`^${escapeRegex(start)}\\s*\\r?\\n([\\s\\S]*?)(?=^${escapeRegex(end)}\\s*$)`, 'm');
  return firstMatch(markdown, expression, start).trim();
}

function subsection(markdown, heading) {
  const expression = new RegExp(`^### ${escapeRegex(heading)}\\s*\\r?\\n([\\s\\S]*?)(?=^### |$)`, 'm');
  return firstMatch(markdown, expression, heading).replace(/\s+/g, ' ').trim();
}

function paragraphs(value) {
  return String(value || '').split(/(?:\r?\n){2,}/).map((paragraph) => paragraph.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function parseQa(value) {
  return [...value.matchAll(/^###\s+(.+)\s*\r?\n([\s\S]*?)(?=^###\s+|$)/gm)].map((match) => ({
    question: match[1].trim(),
    answer: match[2].replace(/\s+/g, ' ').trim()
  })).filter((item) => item.question && item.answer);
}

function parseList(value) {
  return [...String(value || '').matchAll(/^[-*]\s+(.+)$/gm)].map((match) => match[1].trim()).filter(Boolean);
}

function parseSource(value) {
  const linked = value.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
  if (linked) return { title: linked[1].trim(), url: linked[2].trim() };
  const urlMatch = value.match(/https?:\/\/\S+/);
  if (!urlMatch) return { title: value, url: '' };
  const url = urlMatch[0].replace(/[),.;]+$/, '');
  return { title: value.replace(urlMatch[0], '').replace(/[;,\s]+$/, '').trim(), url };
}

function upsertIndependentEntry(entry) {
  const indexPath = path.join(root, 'data', 'stories', 'index.json');
  const entries = loadIndependentEntries(root);
  if (!entries.some((item) => item.id === entry.id || item.slug === entry.slug)) {
    entries.push(entry);
  }
  writeJson(indexPath, entries);
}

function writeMarkdownCopy(source, destination) {
  fs.copyFileSync(source, destination);
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function firstMatch(value, expression, label) {
  const match = value.match(expression);
  if (!match) throw new Error(`Missing ${label}`);
  return match[1];
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countWords(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}
