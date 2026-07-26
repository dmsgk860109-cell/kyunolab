const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const storyId = argumentValue('--story');
const inputPath = argumentValue('--input');

if (!storyId || !inputPath) {
  throw new Error('Usage: node scripts/deploy-story-content-package.js --story <record-id> --input <final-story.md>');
}

const sourcePath = path.resolve(inputPath);
if (!fs.existsSync(sourcePath)) throw new Error(`Input file not found: ${sourcePath}`);

const storiesPath = path.join(root, 'data', 'stories.json');
const stories = JSON.parse(fs.readFileSync(storiesPath, 'utf8'));
const story = stories.find((item) => item.id === storyId);
if (!story) throw new Error(`Story record not found: ${storyId}`);

const identity = { id: story.id, slug: story.slug };
const contentPackage = parseContentPackage(fs.readFileSync(sourcePath, 'utf8'));

Object.assign(story, {
  title: contentPackage.finalTitle,
  displayTitle: contentPackage.finalTitle,
  h1: contentPackage.finalTitle,
  seoTitle: contentPackage.finalTitle,
  metaTitle: contentPackage.finalTitle,
  metaDescription: `${contentPackage.quickAnswer.identity} ${contentPackage.quickAnswer.importance}`,
  introSummary: contentPackage.quickAnswer.identity,
  summaryAnswer: contentPackage.quickAnswer.role,
  updatedAt: new Date().toISOString().slice(0, 10),
  qa: contentPackage.qa,
  storySourceNote: contentPackage.sourceNote,
  relatedKeywords: contentPackage.relatedKeywords,
  secondaryKeywords: contentPackage.relatedKeywords,
  contentDNA: {
    ...(story.contentDNA || {}),
    sectionBlueprint: contentPackage.sections.map((section) => ({ id: section.id, heading: section.heading }))
  },
  longformArticle: {
    contentPackageVersion: 'archive-story-content-v1',
    deck: contentPackage.quickAnswer.identity,
    opening: contentPackage.opening,
    storyBody: contentPackage.sections,
    quickAnswer: contentPackage.quickAnswer,
    qa: contentPackage.qa,
    storySourceNote: contentPackage.sourceNote,
    references: contentPackage.sources,
    relatedKeywords: contentPackage.relatedKeywords
  }
});

if (story.id !== identity.id || story.slug !== identity.slug) {
  throw new Error('Record identity must remain unchanged during content deployment');
}

fs.writeFileSync(storiesPath, `${JSON.stringify(stories, null, 2)}\n`, 'utf8');
execFileSync(process.execPath, [path.join(__dirname, 'apply-content-dna.js'), '--story', story.slug], { stdio: 'inherit' });

const sourcePage = path.join(root, 'stories', `${story.slug}.html`);
const distPage = path.join(root, 'dist', 'stories', `${story.slug}.html`);
fs.mkdirSync(path.dirname(distPage), { recursive: true });
fs.copyFileSync(sourcePage, distPage);
for (const asset of ['styles.css', 'engagement.js']) {
  fs.copyFileSync(path.join(root, asset), path.join(root, 'dist', asset));
}

console.log(`Deployed complete content package for ${story.id} (${story.slug}).`);

function argumentValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : '';
}

function parseContentPackage(markdown) {
  const finalTitle = firstMatch(markdown, /^#\s+(.+)$/m, 'final title').trim();
  const storyBody = block(markdown, '## STORY_BODY', '## Quick Answer');
  const quickAnswerBlock = block(markdown, '## Quick Answer', '## Q&A');
  const qaBlock = block(markdown, '## Q&A', '## Source Note');
  const sourceNote = block(markdown, '## Source Note', '## Sources').replace(/\s+/g, ' ').trim();
  const sourcesBlock = block(markdown, '## Sources', '## Related Keywords');
  const keywordsBlock = markdown.replace(/^[\s\S]*?^## Related Keywords\s*\r?\n/m, '').trim();
  const parsedBody = parseStoryBody(storyBody);
  const quickAnswer = {
    identity: subsection(quickAnswerBlock, 'Identity'),
    role: subsection(quickAnswerBlock, 'Role'),
    importance: subsection(quickAnswerBlock, 'Importance')
  };
  const qa = parseQa(qaBlock);
  const sources = parseList(sourcesBlock).map(parseSource);
  const relatedKeywords = parseList(keywordsBlock);

  if (parsedBody.sections.length === 0) throw new Error('STORY_BODY must contain at least one H2 section');
  if (new Set(parsedBody.sections.map((section) => section.id)).size !== parsedBody.sections.length) throw new Error('STORY_BODY contains duplicate H2 anchor IDs');
  if (qa.length === 0 || sources.length === 0 || relatedKeywords.length === 0) throw new Error('Q&A, Sources, and Related Keywords must not be empty');
  return { finalTitle, ...parsedBody, quickAnswer, qa, sourceNote, sources, relatedKeywords };
}

function block(markdown, start, end) {
  const expression = new RegExp(`^${escapeRegex(start)}\\s*\\r?\\n([\\s\\S]*?)(?=^${escapeRegex(end)}\\s*$)`, 'm');
  return firstMatch(markdown, expression, start).trim();
}

function subsection(markdown, heading) {
  const expression = new RegExp(`^### ${escapeRegex(heading)}\\s*\\r?\\n([\\s\\S]*?)(?=^### |$)`, 'm');
  return firstMatch(markdown, expression, heading).replace(/\s+/g, ' ').trim();
}

function parseStoryBody(body) {
  const headingPattern = /<h2\s+id="([a-z0-9-]+)">([^<]+)<\/h2>/g;
  const matches = [...body.matchAll(headingPattern)];
  if (!matches.length) throw new Error('STORY_BODY H2 tags must use explicit lowercase English anchor IDs');
  const opening = paragraphs(body.slice(0, matches[0].index));
  const sections = matches.map((match, index) => ({
    id: match[1],
    heading: match[2].trim(),
    paragraphs: paragraphs(body.slice(match.index + match[0].length, matches[index + 1]?.index))
  }));
  return { opening, sections };
}

function paragraphs(value) {
  return value.split(/(?:\r?\n){2,}/).map((paragraph) => paragraph.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function parseQa(blockText) {
  return [...blockText.matchAll(/^###\s+(.+)\s*\r?\n([\s\S]*?)(?=^###\s+|$)/gm)].map((match) => ({
    question: match[1].trim(),
    answer: match[2].replace(/\s+/g, ' ').trim()
  })).filter((item) => item.question && item.answer);
}

function parseList(blockText) {
  return [...blockText.matchAll(/^[-*]\s+(.+)$/gm)].map((match) => match[1].trim()).filter(Boolean);
}

function parseSource(value) {
  const linked = value.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
  if (linked) return { title: linked[1].trim(), url: linked[2].trim() };
  const urlMatch = value.match(/https?:\/\/\S+/);
  if (!urlMatch) return { title: value, url: '' };
  const url = urlMatch[0].replace(/[),.;]+$/, '');
  return { title: value.replace(urlMatch[0], '').replace(/[—:;,\s]+$/, '').trim(), url };
}

function firstMatch(value, expression, label) {
  const match = value.match(expression);
  if (!match) throw new Error(`Missing ${label}`);
  return match[1];
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
