const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const stories = readJson(path.join(root, 'data', 'stories.json'));
const guides = readJson(path.join(root, 'data', 'guides.json'));

const awkwardPatterns = [
  {
    label: 'awkward record-centered grammar',
    pattern: /record centered on .*?\b(depend|become|keeps|arrives|shows|refuses|opens|rings|stops)\b/i
  },
  {
    label: 'repeated source-aware record sentence',
    pattern: /source-aware Kyunolab record about .*?recurring motifs, evidence limits, and why the story/i
  },
  {
    label: 'repeated Mystery Board deck',
    pattern: /practical Mystery Board guide for readers who want to move through Kyunolab Mystery Archive with more context/i
  },
  {
    label: 'repeated guide source disclaimer',
    pattern: /without treating every strange claim as confirmed fact\. It gives the archive a practical reading path/i
  },
  {
    label: 'repeated guide closing path',
    pattern: /The best reading path is usually small: one guide, one article, one source note/i
  }
];

const commonHeadings = new Set([
  'Where the Evidence Becomes Thin',
  'What the Motif Says Before It Explains Anything',
  'How to Read This Record Without Flattening It'
]);

const headingCounts = new Map();
const storyIssues = [];
const guideIssues = [];

for (const story of stories) {
  const filePath = path.join(root, 'stories', `${story.slug}.html`);
  const html = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const bodyText = stripHtml(html);
  const fields = [
    story.title,
    story.displayTitle,
    story.metaDescription,
    story.excerpt,
    story.summaryAnswer,
    story.detail,
    story.contentDNA?.searchQuestion,
    story.contentDNA?.uniqueAngle,
    story.contentDNA?.sceneAnchor
  ].filter(Boolean).join('\n');

  const issues = [];
  const wordCount = countWords(bodyText);

  if (!fs.existsSync(filePath)) addIssue(issues, 'critical', 'missing generated story page');
  if (wordCount < 900) addIssue(issues, 'high', `short rendered article body (${wordCount} words)`);
  if (wordCount > 2600) addIssue(issues, 'medium', `very long rendered article body (${wordCount} words)`);
  if (Number(story.topicScore || 0) < 70) addIssue(issues, 'high', `topicScore below publish threshold (${story.topicScore || 0})`);
  if (['hold', 'reject'].includes(String(story.topicStatus || '').toLowerCase())) {
    addIssue(issues, 'high', `topicStatus is ${story.topicStatus}`);
  }
  if (countWords(story.metaDescription) > 35) addIssue(issues, 'medium', `metaDescription is long (${countWords(story.metaDescription)} words)`);
  if (countWords(story.excerpt) < 8) addIssue(issues, 'medium', `excerpt is thin (${countWords(story.excerpt)} words)`);
  if (String(story.title || '').length > 95) addIssue(issues, 'medium', `title is long (${String(story.title).length} chars)`);
  if (!Array.isArray(story.tags) || story.tags.length < 3) addIssue(issues, 'medium', `too few tags (${story.tags?.length || 0})`);

  for (const { label, pattern } of awkwardPatterns) {
    if (pattern.test(fields)) addIssue(issues, 'medium', label);
  }

  const headings = collectHeadings(html, 'h2');
  for (const heading of headings) {
    headingCounts.set(heading, (headingCounts.get(heading) || 0) + 1);
  }
  const repeatedHeadings = headings.filter((heading) => commonHeadings.has(heading));
  if (repeatedHeadings.length) {
    addIssue(issues, 'low', `uses common heading(s): ${Array.from(new Set(repeatedHeadings)).join(', ')}`);
  }

  if (issues.length) {
    storyIssues.push({
      slug: story.slug,
      title: story.title,
      category: story.category,
      wordCount,
      topicScore: story.topicScore,
      severityScore: scoreIssues(issues),
      issues
    });
  }
}

for (const guide of guides) {
  const filePath = path.join(root, 'mystery-board', `${guide.slug}.html`);
  const html = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const bodyText = stripHtml(html);
  const fields = [
    guide.title,
    guide.deck,
    guide.excerpt,
    guide.sourceNote,
    ...(guide.sections || []).flatMap((section) => [section.title, ...(section.paragraphs || [])])
  ].filter(Boolean).join('\n');

  const issues = [];
  const wordCount = countWords(bodyText);

  if (!fs.existsSync(filePath)) addIssue(issues, 'critical', 'missing generated guide page');
  if (wordCount < 700) addIssue(issues, 'high', `short rendered guide body (${wordCount} words)`);
  if (String(guide.title || '').length > 85) addIssue(issues, 'medium', `guide title is long (${String(guide.title).length} chars)`);

  for (const { label, pattern } of awkwardPatterns) {
    if (pattern.test(fields)) addIssue(issues, 'medium', label);
  }

  if (issues.length) {
    guideIssues.push({
      slug: guide.slug,
      title: guide.title,
      wordCount,
      severityScore: scoreIssues(issues),
      issues
    });
  }
}

storyIssues.sort(sortBySeverity);
guideIssues.sort(sortBySeverity);

const repeatedHeadings = Array.from(headingCounts.entries())
  .filter(([, count]) => count >= 20)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .map(([heading, count]) => ({ heading, count }));

const report = {
  summary: {
    stories: stories.length,
    guides: guides.length,
    storyIssueCount: storyIssues.length,
    guideIssueCount: guideIssues.length,
    highPriorityStoryCount: storyIssues.filter((item) => item.issues.some((issue) => ['critical', 'high'].includes(issue.severity))).length,
    highPriorityGuideCount: guideIssues.filter((item) => item.issues.some((issue) => ['critical', 'high'].includes(issue.severity))).length
  },
  topStoryIssues: storyIssues.slice(0, 40),
  topGuideIssues: guideIssues.slice(0, 25),
  repeatedHeadings
};

console.log(JSON.stringify(report, null, 2));

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(value) {
  const text = String(value || '').trim();
  return text ? text.split(/\s+/).length : 0;
}

function collectHeadings(html, tag) {
  const matches = [...String(html || '').matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi'))];
  return matches.map((match) => stripHtml(match[1])).filter(Boolean);
}

function addIssue(issues, severity, message) {
  issues.push({ severity, message });
}

function scoreIssues(issues) {
  return issues.reduce((score, issue) => {
    if (issue.severity === 'critical') return score + 5;
    if (issue.severity === 'high') return score + 3;
    if (issue.severity === 'medium') return score + 2;
    return score + 1;
  }, 0);
}

function sortBySeverity(a, b) {
  return b.severityScore - a.severityScore || a.slug.localeCompare(b.slug);
}
