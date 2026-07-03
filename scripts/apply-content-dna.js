const fs = require('fs');
const path = require('path');
const { buildContentDNA } = require('./article-dna-utils');

const root = path.resolve(__dirname, '..');
const siteUrl = 'https://kyunolab.com';
const styleVersion = '20260703-content-dna';
const storiesPath = path.join(root, 'data', 'stories.json');
const stories = readJson(storiesPath);
const categories = readJson(path.join(root, 'data', 'categories.json'));

const storyBySlug = new Map(stories.map((story) => [story.slug, story]));
const existingQueries = new Set();
for (const story of stories) {
  if (story.contentDNA?.canonicalQuery) existingQueries.add(normalize(story.contentDNA.canonicalQuery));
}

for (const story of stories) {
  backfillStoryMetadata(story);
  story.contentDNA = {
    ...buildContentDNA(story, existingQueries),
    ...(story.contentDNA || {})
  };
}

writeJson(storiesPath, stories);

for (let index = 0; index < stories.length; index += 1) {
  const story = stories[index];
  const previousStory = stories[index + 1] || stories[stories.length - 1];
  const nextStory = stories[index - 1] || stories[0];
  writeFile(`stories/${story.slug}.html`, renderStoryPage(story, previousStory, nextStory));
}

console.log(`Applied contentDNA and regenerated ${stories.length} story page(s).`);

function backfillStoryMetadata(story) {
  const title = story.title || story.displayTitle || titleFromSlug(story.slug);
  const subject = title.replace(/:.*$/, '').trim();
  const tag = story.primaryTag || story.tag || (story.tags || [])[0] || story.category;
  const excerpt = story.excerpt || story.metaDescription || `${subject} is a source-aware Kyunolab record connected to ${story.category || 'strange stories'}.`;
  const query = story.seedKeyword || story.targetQuery || subject.toLowerCase().replace(/^the\s+/i, '');

  story.title = title;
  story.displayTitle = story.displayTitle || title;
  story.seoTitle = story.seoTitle || title;
  story.metaTitle = story.metaTitle || story.seoTitle || title;
  story.metaDescription = story.metaDescription || excerpt;
  story.seedKeyword = story.seedKeyword || query;
  story.searchIntent = story.searchIntent || inferSearchIntent(story);
  story.articleFormat = story.articleFormat || inferArticleFormat(story);
  story.primaryTag = story.primaryTag || tag;
  story.tag = story.tag || tag;
  story.cluster = story.cluster || `${story.category || 'Archive'} / ${tag}`;
  story.relatedKeywords = Array.isArray(story.relatedKeywords) && story.relatedKeywords.length
    ? story.relatedKeywords
    : buildRelatedKeywords(story, subject, tag);
  story.summaryAnswer = story.summaryAnswer || buildSummaryAnswer(story, subject);
  story.topicScore = story.topicScore || 72;
  story.topicStatus = story.topicStatus || 'approved';
  story.scoreBreakdown = story.scoreBreakdown || {
    searchDemand: 21,
    clickCuriosity: 18,
    siteFit: 17,
    expansionPotential: 10,
    differentiation: 6
  };
}

function inferSearchIntent(story) {
  const category = String(story.categorySlug || '').toLowerCase();
  if (category.includes('origin')) return 'origin';
  if (category.includes('myth')) return 'meaning';
  if (category.includes('internet')) return 'internet folklore';
  if (category.includes('place') || category.includes('world')) return 'place legend';
  return 'legend';
}

function inferArticleFormat(story) {
  const category = String(story.categorySlug || '').toLowerCase();
  if (category.includes('origin')) return 'search-info';
  if (category.includes('myth') || category.includes('folklore')) return 'story-archive';
  return 'search-info';
}

function buildRelatedKeywords(story, subject, tag) {
  const base = [
    `${subject} meaning`,
    `${subject} legend`,
    `${tag} story`,
    `${story.category || 'folklore'} record`
  ];
  return Array.from(new Set(base.map((item) => item.toLowerCase().replace(/\s+/g, ' ').trim()))).slice(0, 4);
}

function buildSummaryAnswer(story, subject) {
  const category = String(story.category || 'archive').toLowerCase();
  const source = story.sourceStatus || `${story.category} / Source-aware retelling`;
  return `${subject} is best read as a source-aware ${category} record, not as a verified factual claim. The article explains the story pattern, the useful evidence limits, and why this motif remains memorable inside ${source}.`;
}

function titleFromSlug(slug) {
  return String(slug || 'untitled-record')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function renderStoryPage(story, previousStory, nextStory) {
  const cleanUrl = `${siteUrl}/stories/${story.slug}`;
  const title = story.displayTitle || story.title;
  const metaTitle = story.metaTitle || story.seoTitle || title;
  const description = story.metaDescription || story.excerpt || story.summaryAnswer || '';
  const relatedStories = getRelatedStories(story);
  const dna = story.contentDNA;
  const sections = buildBodySections(story);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(metaTitle)} | The Strange Archive</title>
  <meta name="description" content="${escapeAttr(description)}">
  <meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:description" content="${escapeAttr(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${cleanUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${cleanUrl}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="stylesheet" href="/styles.css?v=${styleVersion}">
  <script type="application/ld+json">${JSON.stringify(renderJsonLd(story, cleanUrl, description))}</script>
</head>
<body>
  ${renderHeader()}
  <main class="article-shell article-layout">
    ${renderLeftRail(story, sections)}
    <article>
      <header class="archive-article-header">
        <p class="label">${escapeHtml(story.category)}</p>
        <h1 class="article-title">${escapeHtml(title)}</h1>
        <p class="deck">${escapeHtml(story.excerpt || story.summaryAnswer || description)}</p>
        ${renderMetaGrid(story)}
      </header>
      ${renderStoryMap(sections)}
      ${renderReadingBridge(story, relatedStories)}
      <div class="story-body archive-entry">
        ${renderOpening(story)}
        ${sections.map((section) => renderSection(section)).join('\n')}
        ${renderFaq(story)}
        ${renderSourceNote(story)}
      </div>
      ${renderRelatedArticles(relatedStories)}
      ${renderPrevNext(previousStory, nextStory)}
    </article>
    ${renderRightRail(story, relatedStories, nextStory)}
  </main>
  ${renderFooter()}
  <script src="/engagement.js?v=20260702-tags-expanded" defer></script>
</body>
</html>
`;
}

function buildBodySections(story) {
  const dna = story.contentDNA;
  const blueprint = Array.isArray(dna.sectionBlueprint) ? dna.sectionBlueprint : [];
  const headings = blueprint.map((item) => typeof item === 'string' ? item : item.title).filter(Boolean);
  const vocabulary = dna.subjectSpecificVocabulary || [];
  const details = dna.requiredSpecificDetails || [];
  const tag = story.primaryTag || story.tag || story.category;

  const fallback = [
    `Why ${shortSubject(story)} Feels Specific`,
    `${tag} Details That Carry the Record`,
    'How the Retelling Changes the Meaning',
    evidenceHeading(story),
    `Why This ${story.storyType || 'Record'} Stays Readable`
  ];

  return (headings.length ? headings : fallback).slice(0, 6).map((heading, index) => ({
    id: slugify(heading),
    title: heading,
    paragraphs: sectionParagraphs(story, heading, index, vocabulary, details)
  }));
}

function sectionParagraphs(story, heading, index, vocabulary, details) {
  const dna = story.contentDNA;
  const subject = shortSubject(story);
  const detail = story.detail || story.excerpt || dna.sceneAnchor;
  const evidence = story.evidence || `${story.sourceStatus}, ${story.primaryTag || story.tag}, repeated retellings`;
  const vocabSentence = sentenceFromTerms(vocabulary.slice(index, index + 3), subject);
  const detailSentence = sentenceFromTerms(details.slice(index, index + 3), subject);

  if (index === 0) {
    return [
      `${subject} answers a narrow search question: ${dna.searchQuestion} The strongest answer is not a claim of proof, but a pattern built around ${detail}.`,
      `${vocabSentence} Those details keep the record attached to a particular scene instead of letting it blur into a generic strange story.`
    ];
  }

  if (index === 1) {
    return [
      `${heading} depends on material details rather than atmosphere alone. ${detailSentence}`,
      `The record stays useful because ${story.primaryTag || story.tag} gives readers a clear path into the subject while the category keeps it connected to ${story.category}.`
    ];
  }

  if (index === 2) {
    return [
      `Retellings usually change the names, dates, or setting before they change the pressure point. In this case, the pressure point is ${detail}.`,
      `That is why the article treats the story through ${dna.narrativeLens} and ${dna.culturalFrame}. The angle is specific enough to separate it from nearby records.`
    ];
  }

  if (index === 3) {
    return [
      `The available material can support a source-aware reading: ${evidence}. It can show how a motif circulates, which details survive, and where the story gains its shape.`,
      `It cannot, by itself, turn an unverified or symbolic claim into a confirmed event. Better evidence would include dated records, stable witnesses, original files, location records, or archived versions that match the same details.`
    ];
  }

  return [
    `${subject} remains readable because it gives readers a concrete object, place, or rule to test against ordinary life. The story does not need to become louder to work; it needs the details to stay precise.`,
    `For Kyunolab, the value is in preserving that precision while keeping the source status visible. The record can be memorable without pretending uncertainty has disappeared.`
  ];
}

function renderOpening(story) {
  const dna = story.contentDNA;
  const subject = shortSubject(story);
  const summary = story.summaryAnswer || `${subject} is best read as a source-aware ${String(story.category || 'archive').toLowerCase()} record.`;
  return `<p>${escapeHtml(dna.targetQuery)} points to a specific reader question: ${escapeHtml(dna.searchQuestion)} ${escapeHtml(summary)}</p>
        <p>${escapeHtml(dna.sceneAnchor)} gives the article its first usable image. The focus stays on ${escapeHtml(dna.uniqueAngle)}</p>`;
}

function renderSection(section) {
  return `<h2 id="${escapeAttr(section.id)}">${escapeHtml(section.title)}</h2>
${section.paragraphs.map((text) => `        <p>${escapeHtml(text)}</p>`).join('\n')}`;
}

function renderFaq(story) {
  const subject = shortSubject(story);
  const tag = story.primaryTag || story.tag || story.category;
  const dna = story.contentDNA;
  const questions = [
    {
      q: `Can ${subject.toLowerCase()} be verified from the available record?`,
      a: `Only part of the record can usually be checked. Kyunolab treats it through ${dna.evidencePosture}, so the article separates circulation, motif, and possible evidence from any stronger claim.`
    },
    {
      q: `Why does ${tag.toLowerCase()} make this story easier to remember?`,
      a: `${tag} gives the reader a compact path into the story. It names the recurring pattern without replacing the more specific details that make this article distinct.`
    },
    {
      q: `What evidence would make ${subject.toLowerCase()} more credible?`,
      a: `Useful evidence would include dated records, original files, location details, stable witness accounts, or archived versions that preserve the same concrete details. A repeated rumor can prove circulation, but not every claim inside the rumor.`
    },
    {
      q: `How should readers use this Kyunolab entry?`,
      a: `Read it as a calm archive record: a way to understand the motif, the source limits, and the reason the story keeps returning. It is not presented as verified fact.`
    }
  ];

  return `<h2 id="faq">FAQ</h2>
      <div class="faq-list">
${questions.map((item) => `        <h3>${escapeHtml(item.q)}</h3>
        <p>${escapeHtml(item.a)}</p>`).join('\n')}
      </div>`;
}

function renderSourceNote(story) {
  return `<h2 id="source-note">Story &amp; Source Note</h2>
        <p>This article discusses ${escapeHtml(story.sourceStatus || story.category)} with a source-aware approach. Unverified claims, folklore patterns, symbolic readings, and archive-style retellings are not presented as confirmed fact.</p>`;
}

function renderMetaGrid(story) {
  const updated = formatDate(story.updatedAt || story.publishedAt);
  return `<dl class="article-meta-grid">
          <div><dt>Category</dt><dd>${escapeHtml(story.category)}</dd></div>
          <div><dt>Tags</dt><dd>${escapeHtml((story.tags || []).join(', '))}</dd></div>
          <div><dt>Read time</dt><dd>${escapeHtml(story.readTime)}</dd></div>
          <div><dt>Story Type</dt><dd>${escapeHtml(story.storyType)}</dd></div>
          <div><dt>Source Status</dt><dd>${escapeHtml(story.sourceStatus)}</dd></div>
          <div><dt>Updated</dt><dd>${escapeHtml(updated)}</dd></div>
        </dl>`;
}

function renderStoryMap(sections) {
  const items = sections.map((section) => `<li><a href="#${escapeAttr(section.id)}">${escapeHtml(section.title)}</a></li>`).join('');
  return `<section class="story-map" aria-label="Story map"><h2>Story Map</h2><ol>${items}<li><a href="#faq">FAQ</a></li><li><a href="#source-note">Story &amp; Source Note</a></li></ol></section>`;
}

function renderLeftRail(story, sections) {
  return `<aside class="article-rail article-rail-left" aria-label="Article navigation">
      <div class="rail-card">
        <p class="rail-label">In this record</p>
        ${sections.slice(0, 6).map((section) => `<a href="#${escapeAttr(section.id)}">${escapeHtml(section.title)}</a>`).join('')}
        <a href="#faq">FAQ</a>
      </div>
      <div class="rail-card rail-card-subtle">
        <p class="rail-label">Archive paths</p>
        <a href="/categories/${escapeAttr(story.categorySlug)}.html">${escapeHtml(story.category)}</a>
        <a href="/categories.html">All Categories</a>
        <a href="/fiction-disclaimer.html">Story &amp; Source Notice</a>
      </div>
    </aside>`;
}

function renderReadingBridge(story, relatedStories) {
  const links = relatedStories.slice(0, 3).map((item) => `<a href="/stories/${escapeAttr(item.slug)}"><span>${escapeHtml(item.category)}</span><strong>${escapeHtml(item.title)}</strong></a>`).join('');
  return `<section class="reading-bridge" aria-label="Recommended reading paths"><p class="rail-label">If this record interests you</p><div>${links}<a href="/categories/${escapeAttr(story.categorySlug)}.html"><span>Archive shelf</span><strong>More ${escapeHtml(story.category)}</strong></a></div></section>`;
}

function renderRelatedArticles(relatedStories) {
  const items = relatedStories.slice(0, 6).map((story) => `<a href="/stories/${escapeAttr(story.slug)}"><span>${escapeHtml(story.category)}</span><strong>${escapeHtml(story.title)}</strong></a>`).join('');
  return `<section class="related-articles" aria-label="Related articles"><div class="section-head"><h2>Related Articles</h2></div><div class="related-grid">${items}</div></section>`;
}

function renderPrevNext(previousStory, nextStory) {
  return `<nav class="prev-next" aria-label="Previous and next articles"><a href="/stories/${escapeAttr(previousStory.slug)}"><span>Previous</span><strong>${escapeHtml(previousStory.title)}</strong></a><a href="/stories/${escapeAttr(nextStory.slug)}"><span>Next</span><strong>${escapeHtml(nextStory.title)}</strong></a></nav>`;
}

function renderRightRail(story, relatedStories, nextStory) {
  return `<aside class="article-rail article-rail-right" aria-label="Recommended reading">
      <div class="rail-card rail-feature"><p class="rail-label">Read next</p><a href="/stories/${escapeAttr(nextStory.slug)}"><strong>${escapeHtml(nextStory.title)}</strong><span>${escapeHtml(nextStory.category)}</span></a></div>
      <div class="rail-card"><p class="rail-label">Related records</p>${relatedStories.slice(0, 4).map((item) => `<a href="/stories/${escapeAttr(item.slug)}">${escapeHtml(item.title)}</a>`).join('')}</div>
      <div class="rail-card rail-card-subtle"><p class="rail-label">Same archive shelf</p><a href="/newest.html">Newest Records</a><a href="/popular.html">Popular Records</a><a href="/mystery-board.html">Mystery Board</a></div>
    </aside>`;
}

function getRelatedStories(story) {
  const manual = (story.relatedStoryIds || []).map((id) => storyBySlug.get(id)).filter(Boolean);
  const manualSlugs = new Set(manual.map((item) => item.slug));
  const scored = stories
    .filter((item) => item.slug !== story.slug && !manualSlugs.has(item.slug))
    .map((item) => ({ item, score: relatedScore(story, item) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
  return [...manual, ...scored].slice(0, 6);
}

function relatedScore(a, b) {
  let score = 0;
  if (a.primaryTag && a.primaryTag === b.primaryTag) score += 8;
  if (a.categorySlug === b.categorySlug) score += 6;
  if (a.contentDNA?.subjectClass && a.contentDNA.subjectClass === b.contentDNA?.subjectClass) score += 4;
  if (a.contentDNA?.narrativeLens && a.contentDNA.narrativeLens === b.contentDNA?.narrativeLens) score += 3;
  const aTags = new Set((a.tags || []).map(normalize));
  for (const tag of b.tags || []) if (aTags.has(normalize(tag))) score += 2;
  const aKeywords = new Set((a.relatedKeywords || []).map(normalize));
  for (const keyword of b.relatedKeywords || []) if (aKeywords.has(normalize(keyword))) score += 1;
  return score;
}

function evidenceHeading(story) {
  const posture = String(story.contentDNA?.evidencePosture || story.sourceStatus || '').toLowerCase();
  if (posture.includes('digital')) return 'What Logs or Screenshots Would Need to Show';
  if (posture.includes('place')) return 'What Local Records Could Actually Prove';
  if (posture.includes('symbolic')) return 'Where Symbolic Reading Ends';
  return 'Where the Evidence Becomes Thin';
}

function sentenceFromTerms(terms, subject) {
  const clean = (terms || []).map((term) => String(term || '').trim()).filter(Boolean).slice(0, 3);
  if (!clean.length) return `${subject} depends on details that keep the record specific.`;
  return `${subject} depends on details such as ${clean.join(', ')}.`;
}

function shortSubject(story) {
  return String(story.displayTitle || story.title || story.slug).replace(/:.*$/, '').trim();
}

function renderJsonLd(story, cleanUrl, description) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: story.seoTitle || story.title,
    description,
    datePublished: story.publishedAt,
    dateModified: story.updatedAt,
    author: { '@type': 'Organization', name: 'Kyuno Lab' },
    publisher: { '@type': 'Organization', name: 'Kyuno Lab' },
    mainEntityOfPage: cleanUrl,
    keywords: [...(story.tags || []), ...(story.relatedKeywords || [])].join(', ')
  };
}

function renderHeader() {
  return `<header class="site-header"><div class="topline">A Kyuno Lab publication</div><div class="header-inner"><a class="brand" href="/"><span class="brand-mark"><img src="/favicon.svg" alt="" aria-hidden="true"></span><span><strong>The Strange Archive</strong><em>Legends, folklore, mysteries, and strange tales.</em></span></a><nav class="nav"><a href="/newest.html">Newest</a><a href="/popular.html">Popular</a><a href="/categories.html">Categories</a><a href="/mystery-board.html">Mystery Board</a><a href="/about.html">About</a></nav></div></header>`;
}

function renderFooter() {
  return `<footer class="site-footer"><p><strong>The Strange Archive</strong> is a quiet story publication by Kyuno Lab, dedicated to legends, folklore, mysteries, and strange tales from the edges of memory.</p><p><a href="/archive.html">Archive Index</a> - <a href="/newest.html">Newest</a> - <a href="/popular.html">Popular</a> - <a href="/categories.html">Categories</a> - <a href="/about.html">About</a> - <a href="/fiction-disclaimer.html">Story &amp; Source Notice</a> - <a href="/privacy.html">Privacy</a> - <a href="/rss.xml">RSS</a></p></footer>`;
}

function formatDate(value) {
  if (!value) return '';
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function slugify(value) {
  return String(value || '').toLowerCase().trim().replace(/&/g, ' and ').replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function writeFile(fileName, content) {
  const filePath = path.join(root, fileName);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}
