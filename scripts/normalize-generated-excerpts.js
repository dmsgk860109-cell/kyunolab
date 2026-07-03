const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const stories = JSON.parse(fs.readFileSync(storiesPath, 'utf8'));

let updated = 0;

for (const story of stories) {
  if (!/^A folklore-minded record centered on /i.test(String(story.excerpt || ''))) continue;

  const subject = String(story.displayTitle || story.title || story.slug)
    .replace(/:.*$/, '')
    .replace(/^The\s+/i, '')
    .trim();
  const tag = story.primaryTag || story.tag || story.category || 'recurring motif';
  const category = story.category || 'archive record';
  const detail = String(story.excerpt || '')
    .replace(/^A folklore-minded record centered on\s+/i, '')
    .replace(/[.?!]+$/, '')
    .trim();

  story.excerpt = buildExcerpt(story, subject, tag, category, detail);
  story.metaDescription = story.metaDescription && !/source-aware Kyunolab record about|recurring motifs, evidence limits|record centered on/i.test(story.metaDescription)
    ? story.metaDescription
    : story.excerpt;
  story.summaryAnswer = '';
  if (story.contentDNA) {
    delete story.contentDNA.sceneAnchor;
    delete story.contentDNA.searchQuestion;
    delete story.contentDNA.uniqueAngle;
    delete story.contentDNA.requiredSpecificDetails;
  }
  updated += 1;
}

fs.writeFileSync(storiesPath, `${JSON.stringify(stories, null, 2)}\n`, 'utf8');
console.log(`Normalized ${updated} generated excerpt(s).`);

function buildExcerpt(story, subject, tag, category, detail) {
  const variants = [
    `${subject} is a ${category.toLowerCase()} entry shaped by ${String(tag).toLowerCase()}, keeping the concrete detail visible without treating the record as confirmed fact.`,
    `${subject} follows a ${String(tag).toLowerCase()} pattern inside ${category.toLowerCase()}, with attention to what the repeated detail can and cannot prove.`,
    `${subject} reads ${String(tag).toLowerCase()} as a recurring story pattern, preserving the memorable detail while naming the source limits.`
  ];
  const chosen = variants[stableIndex(story.slug, variants.length)];
  if (chosen.length <= 170) return chosen;
  return `${subject} follows a ${String(tag).toLowerCase()} pattern while keeping source limits visible.`;
}

function stableIndex(value, length) {
  const source = String(value || '');
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash + source.charCodeAt(index) * (index + 1)) % 9973;
  }
  return hash % length;
}
