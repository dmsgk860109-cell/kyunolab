const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const siteUrl = 'https://kyunolab.com';
const styleVersion = '20260717-search-ui';
const guides = readJson(path.join(root, 'data', 'guides.json'));
const stories = readJson(path.join(root, 'data', 'stories.json'));
const storyById = new Map(stories.map((story) => [story.id || story.slug, story]));
const guideById = new Map(guides.map((guide) => [guide.id || guide.slug, guide]));

for (const guide of guides) {
  writeFile(`mystery-board/${guide.slug}.html`, renderGuidePage(guide));
}

writeFile('mystery-board.html', renderBoardPage());

console.log(`Generated ${guides.length} Mystery Board guide page(s).`);

function renderBoardPage() {
  const newest = [...guides].sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  const primary = newest[0] || guides[0];
  const rows = newest.map((guide) => `<article class="story-row">
          <span class="tag">${escapeHtml(guide.tag || guide.category)}</span>
          <h3><a href="${escapeAttr(guide.url || `/mystery-board/${guide.slug}`)}">${escapeHtml(guide.title)}</a></h3>
          <p>${escapeHtml(guide.excerpt)}</p>
          <div class="meta">${escapeHtml([guide.category, guide.tag, guide.readTime].filter(Boolean).join(' - '))}</div>
        </article>`).join('\n');

  return renderPage({
    canonicalPath: '/mystery-board.html',
    title: 'Mystery Board | Guides to the Kyunolab Mystery Archive',
    description: 'Editorial guides to the Kyunolab Mystery Archive, including its categories, source approach, recurring themes, reading paths, and essential records.',
    ogTitle: 'Mystery Board',
    ogDescription: 'Editorial guides to the Kyunolab Mystery Archive, including its categories, source approach, recurring themes, reading paths, and essential records.',
    type: 'website',
    content: `  <main class="article-shell article-layout">
    <aside class="article-rail article-rail-left" aria-label="Mystery Board topics">
      <div class="rail-card">
        <p class="rail-label">Reader Paths</p>
        <a href="/newest.html">Newest Records</a>
        <a href="/popular.html">Popular Records</a>
        <a href="/categories.html">Browse Categories</a>
        <a href="/mystery-board.html">Mystery Board</a>
      </div>
      <div class="rail-card rail-card-subtle">
        <p class="rail-label">Archive Shelves</p>
        <a href="/categories/urban-legends.html">Urban Legends</a>
        <a href="/categories/internet-folklore.html">Internet Folklore</a>
        <a href="/categories/myths.html">Myths</a>
        <a href="/categories/strange-places.html">Strange Places</a>
      </div>
      <div class="rail-card">
        <p class="rail-label">Source Guide</p>
        <a href="/fiction-disclaimer.html">Story &amp; Source Notice</a>
        <a href="/about.html">About Kyunolab</a>
      </div>
    </aside>

    <div class="archive-page-main">
      <p class="label">Editorial Guides to the Mystery Archive</p>
      <h1 class="article-title">Mystery Board</h1>
      <p class="deck">Explore editorial guides that explain the identity, structure, categories, source boundaries, and recurring themes of the Kyunolab Mystery Archive. These pages help readers understand the archive, discover essential records, and continue into related stories, categories, and collections.</p>

      <section class="notice">
        <strong>Archive guide:</strong> The Mystery Board introduces how Kyunolab organizes legends, folklore, myths, internet mysteries, and unexplained stories while highlighting the records and reading paths that best represent the archive.
      </section>

      <div class="story-list">
${rows}
      </div>
    </div>
    <aside class="article-rail article-rail-right" aria-label="Recommended archive paths">
      ${renderKyunolabNetworkCard()}
      <div class="rail-card rail-feature">
        <p class="rail-label">Start here</p>
        <a href="${escapeAttr(primary.url || `/mystery-board/${primary.slug}`)}"><span>${escapeHtml(primary.tag || primary.category)}</span><strong>${escapeHtml(primary.shortTitle || primary.title)}</strong></a>
      </div>
      <div class="rail-card">
        <p class="rail-label">Related archive records</p>
        ${stories.slice(0, 3).map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}
      </div>
    </aside>
  </main>`
  });
}

function renderGuidePage(guide) {
  const canonicalPath = guide.url || `/mystery-board/${guide.slug}`;
  const mapItems = guide.sections.map((section) => `<li><a href="#${escapeAttr(section.id)}">${escapeHtml(section.title)}</a></li>`).join('');
  const relatedStories = (guide.relatedStoryIds || []).map((id) => storyById.get(id)).filter(Boolean);
  const relatedGuides = (guide.relatedGuideIds || []).map((id) => guideById.get(id)).filter(Boolean);
  const nextGuide = relatedGuides[0] || guides.find((item) => item.slug !== guide.slug) || guide;
  const sections = guide.sections.map((section) => `<h2 id="${escapeAttr(section.id)}">${escapeHtml(section.title)}</h2>
${section.paragraphs.map((text) => `<p>${linkText(text)}</p>`).join('\n')}`).join('\n\n');
  const faq = guide.faq.map((item) => `<h3>${escapeHtml(item.question)}</h3>
        <p>${linkText(item.answer)}</p>`).join('\n\n        ');

  return renderPage({
    canonicalPath,
    title: guide.metaTitle || guide.title,
    description: guide.metaDescription || guide.excerpt,
    ogTitle: guide.ogTitle || guide.title,
    ogDescription: guide.ogDescription || guide.excerpt,
    type: 'article',
    content: `  <main class="article-shell article-layout">
    <aside class="article-rail article-rail-left" aria-label="Guide navigation">
      <div class="rail-card">
        <p class="rail-label">In this guide</p>
        ${guide.sections.map((section) => `<a href="#${escapeAttr(section.id)}">${escapeHtml(section.nav || section.title)}</a>`).join('')}
        <a href="#faq">FAQ</a>
      </div>
      <div class="rail-card rail-card-subtle">
        <p class="rail-label">Related shelves</p>
        <a href="/mystery-board.html">Mystery Board</a>
        <a href="/categories.html">Browse Categories</a>
        <a href="/fiction-disclaimer.html">Story &amp; Source Notice</a>
      </div>
    </aside>

    <article>
      <header class="archive-article-header">
        <p class="label">Mystery Board</p>
        <h1 class="article-title">${escapeHtml(guide.title)}</h1>
        <p class="deck">${escapeHtml(guide.deck || guide.excerpt)}</p>
        <dl class="article-meta-grid">
          <div><dt>Tags</dt><dd>${escapeHtml((guide.tags || []).join(', '))}</dd></div>
          <div><dt>Best for</dt><dd>${escapeHtml(guide.bestFor || 'Archive readers')}</dd></div>
          <div><dt>Read time</dt><dd>${escapeHtml(guide.readTime)}</dd></div>
          <div><dt>Updated</dt><dd>${formatDate(guide.updatedAt || guide.publishedAt)}</dd></div>
        </dl>
      </header>

      <section class="story-map" aria-label="Guide map">
        <h2>Guide Map</h2>
        <ol>${mapItems}<li><a href="#faq">FAQ</a></li></ol>
      </section>

      ${renderReadingBridge(relatedStories)}

      <div class="story-body archive-entry">
${sections}

        <h2 id="faq">FAQ</h2>
        ${faq}

        <h2>Story &amp; Source Note</h2>
        <p>${escapeHtml(guide.sourceNote)}</p>
      </div>
    </article>

    <aside class="article-rail article-rail-right" aria-label="Related guides">
      ${renderKyunolabNetworkCard()}
      <div class="rail-card rail-feature">
        <p class="rail-label">Read next</p>
        <a href="${escapeAttr(nextGuide.url || `/mystery-board/${nextGuide.slug}`)}"><span>${escapeHtml(nextGuide.tag || nextGuide.category)}</span><strong>${escapeHtml(nextGuide.shortTitle || nextGuide.title)}</strong></a>
      </div>
      <div class="rail-card">
        <p class="rail-label">Related records</p>
        ${relatedStories.slice(0, 3).map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}
      </div>
      <div class="rail-card rail-card-subtle">
        <p class="rail-label">Mystery Board</p>
        <a href="/mystery-board.html">All Guides</a>
        <a href="/categories.html">Browse Categories</a>
        <a href="/fiction-disclaimer.html">Source Notice</a>
      </div>
    </aside>
  </main>`
  });
}

function renderReadingBridge(relatedStories) {
  if (!relatedStories.length) return '';
  return `<section class="reading-bridge" aria-label="Recommended reading">
        <p class="rail-label">Read with this guide</p>
        <div>
          ${relatedStories.slice(0, 3).map((story) => `<a href="/stories/${escapeAttr(story.slug)}"><span>${escapeHtml(story.category)}</span><strong>${escapeHtml(story.title)}</strong></a>`).join('')}
        </div>
      </section>`;
}

function renderPage({ canonicalPath, title, description, ogTitle, ogDescription, type, content }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}">
  <meta property="og:title" content="${escapeAttr(ogTitle || title)}">
  <meta property="og:description" content="${escapeAttr(ogDescription || description)}">
  <meta property="og:site_name" content="Kyunolab Mystery Archive">
  <meta property="og:type" content="${escapeAttr(type)}">
  <meta property="og:url" content="${siteUrl}${canonicalPath}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${siteUrl}${canonicalPath}">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32">
  <link rel="icon" href="/favicon-48x48.png" type="image/png" sizes="48x48">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="stylesheet" href="/styles.css?v=${styleVersion}">
</head>
<body>
  ${renderHeader()}
${content}
  ${renderFooter()}
  <script defer src="/assets/global-search.js?v=${styleVersion}"></script>
  <script src="/engagement.js?v=20260706-kit-ui" defer></script>
</body>
</html>
`;
}

function renderHeader() {
  return `<header class="site-header">
    <div class="topline">A Kyuno Lab publication</div>
    <div class="header-inner">
      <a class="brand" href="/"><span class="brand-mark"><img src="/icon-192.png" alt="" aria-hidden="true"></span><span><strong>Kyunolab Mystery Archive</strong><em>Legends, folklore, mysteries, and strange tales.</em></span></a>
      ${renderSiteSearchForm()}
      <nav class="nav"><a href="/newest.html">Newest</a><a href="/popular.html">Popular</a><a href="/categories.html">Categories</a><a href="/mystery-board.html">Mystery Board</a><a href="/about.html">About</a></nav>
    </div>
  </header>`;
}

function renderSiteSearchForm() {
  return `<form class="site-search" action="/search/" method="get" role="search" aria-label="Search Archive or Creator Library">
        <label class="sr-only" for="global-search-type">Search target</label>
        <select id="global-search-type" name="type" class="site-search-select" data-search-type>
          <option value="archive" selected>Archive</option>
          <option value="library">Creator Library</option>
        </select>
        <label class="sr-only" for="global-search-query">Search query</label>
        <input id="global-search-query" name="q" class="site-search-input" type="search" placeholder="Search stories, legends, and mysteries..." autocomplete="off" data-search-input>
        <button class="site-search-button" type="submit">SEARCH</button>
      </form>`;
}

function renderKyunolabNetworkCard() {
  return `<div class="rail-card rail-card-network">
        <p class="rail-label">Kyunolab Network</p>
        <strong>Creator Library</strong>
        <p>Free mystery YouTube scripts, Shorts scripts, image prompts, and thumbnail ideas for video creators.</p>
        <a class="button" href="/scripts/">Open Creator Library</a>
      </div>`;
}

function renderFooter() {
  return `<footer class="site-footer">
    <p><strong>Kyunolab Mystery Archive</strong> is a quiet story publication by Kyuno Lab, dedicated to legends, folklore, mysteries, and strange tales from the edges of memory.</p>
    <p><a href="/archive.html">Archive Index</a> - <a href="/newest.html">Newest</a> - <a href="/popular.html">Popular</a> - <a href="/categories.html">Categories</a> - <a href="/about.html">About</a> - <a href="/fiction-disclaimer.html">Story &amp; Source Notice</a> - <a href="/privacy.html">Privacy</a> - <a href="/rss.xml">RSS</a></p>
  </footer>`;
}

function linkText(value) {
  return escapeHtml(value)
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '<a href="$2">$1</a>');
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00Z`);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function writeFile(fileName, content) {
  fs.mkdirSync(path.dirname(path.join(root, fileName)), { recursive: true });
  fs.writeFileSync(path.join(root, fileName), content, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}
