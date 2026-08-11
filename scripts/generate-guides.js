const fs = require('fs');
const path = require('path');
const { loadStories } = require('./lib/load-stories');

const root = path.resolve(__dirname, '..');
const siteUrl = 'https://kyunolab.com';
const styleVersion = '20260811-sidebar-ad-top';
const boardPortalStyleVersion = '20260808-board-portal';
const guides = readJson(path.join(root, 'data', 'guides.json'));
const stories = loadStories(root);
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
  const boardStarters = getGuidesBySlug([
    'what-is-an-urban-legend',
    'why-internet-folklore-spreads',
    'how-to-check-source-status',
    'how-to-build-a-reading-path-through-the-strange-archive',
    'folklore-vs-myth-vs-urban-legend'
  ]).concat(newest).filter(uniqueGuide).slice(0, 5);
  const sourceGuides = getGuidesBySlug([
    'how-to-check-source-status',
    'how-to-read-source-status-before-sharing-a-strange-story',
    'how-to-separate-a-legend-hook-from-a-factual-claim',
    'how-to-use-evidence-limits-as-reader-trust-signals'
  ]);
  const writingGuides = getGuidesBySlug([
    'how-to-avoid-repetitive-openings-in-folklore-articles',
    'how-to-write-a-folklore-opening-that-still-sounds-human',
    'how-to-balance-atmosphere-and-answers-in-mystery-writing',
    'how-to-use-faqs-in-mystery-articles-without-sounding-generic'
  ]);
  const navigationGuides = getGuidesBySlug([
    'how-to-find-internal-link-opportunities-without-forcing-them',
    'how-to-follow-recurring-motifs-across-the-archive',
    'how-to-make-category-pages-useful-for-mystery-readers',
    'how-to-choose-which-mystery-topic-to-read-next'
  ]);
  const relatedArchiveRecords = getStoriesBySlug([
    'woman-in-white-roadside-legend',
    'backrooms-digital-labyrinth',
    'baba-yaga-folklore',
    'bloody-mary-mirror-legend',
    'paris-catacombs-legends'
  ]);
  const rows = newest.map((guide) => `<article class="story-row board-guide-row">
          <span class="tag">${escapeHtml(guide.tag || guide.category)}</span>
          <h3><a href="${escapeAttr(guide.url || `/mystery-board/${guide.slug}`)}">${escapeHtml(guide.title)}</a></h3>
          <p>${escapeHtml(guide.excerpt)}</p>
          <div class="meta">${escapeHtml([guide.category, guide.tag, guide.readTime].filter(Boolean).join(' - '))}</div>
        </article>`);

  return renderPage({
    canonicalPath: '/mystery-board.html',
    title: 'Mystery Board | Guides to the Kyunolab Mystery Archive',
    description: 'Editorial guides to the Kyunolab Mystery Archive, including its categories, source approach, recurring themes, reading paths, and essential records.',
    ogTitle: 'Mystery Board',
    ogDescription: 'Editorial guides to the Kyunolab Mystery Archive, including its categories, source approach, recurring themes, reading paths, and essential records.',
    type: 'website',
    bodyClass: 'home-portal-page',
    headerHtml: renderHomePortalHeader('/mystery-board.html'),
    pageStyleVersion: boardPortalStyleVersion,
    content: `  <main class="home-shell home-portal-shell board-portal-page">
    <div class="home-portal-layout">
      <div class="home-main-column">
        ${renderBoardPortalLead({ primary, boardStarters })}
        <section class="notice"><strong>Board purpose:</strong> Mystery Board pages are public reading guides. They help visitors understand source limits, story types, recurring motifs, and archive paths before moving into individual records.</section>
        ${renderAdSlot('ad-board-after-intro')}
        ${renderBoardGuideDesk({ sourceGuides, writingGuides, navigationGuides })}
        ${renderBoardGuidePaths({ sourceGuides, writingGuides, navigationGuides })}
        ${renderAdSlot('ad-board-mid-list')}
        ${renderBoardGuideIndex(rows)}
        ${renderBoardCrossroads()}
      </div>
      ${renderBoardPortalRail({ primary, boardStarters, relatedArchiveRecords })}
    </div>
  </main>`
  });
}

function renderBoardPortalLead({ primary, boardStarters }) {
  return `<section class="home-portal-lead board-portal-lead" aria-label="Mystery Board front entrance">
          <article class="home-lead-story">
            <p class="label">Mystery Board Reading Desk</p>
            <h1>Use the guide desk before the archive gets too wide.</h1>
            <p>The Board gives readers calm ways to understand legends, internet folklore, source limits, motifs, and reading paths before they choose a deeper story shelf.</p>
            <a class="button" href="${escapeAttr(primary.url || `/mystery-board/${primary.slug}`)}">Open latest guide</a>
          </article>
          <div class="home-known-list board-starter-list">
            <h2>Start with board guides</h2>
            ${boardStarters.map(renderBoardStarterLink).join('')}
          </div>
        </section>`;
}

function renderBoardStarterLink(guide, index) {
  return `<a href="${escapeAttr(guide.url || `/mystery-board/${guide.slug}`)}"><span>${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(guide.shortTitle || guide.title)}</strong></a>`;
}

function renderBoardGuideDesk({ sourceGuides, writingGuides, navigationGuides }) {
  const deskRows = [
    sourceGuides[0],
    navigationGuides[0],
    writingGuides[0],
    getGuideBySlug('what-is-an-urban-legend'),
    getGuideBySlug('why-internet-folklore-spreads')
  ].filter(Boolean).filter(uniqueGuide);
  return `<section class="home-headline-desk board-guide-desk" aria-label="Mystery Board guide desk">
          <div class="section-head"><h2>Guide Desk</h2><span>Context before deeper reading</span></div>
          <div class="headline-desk-grid">
            <div class="headline-list">${deskRows.map((guide) => renderBoardGuideRow(guide)).join('')}</div>
            <aside class="home-context-card">
              <p class="label">How to use it</p>
              <h3>Pick the question that brought you here, then move into stories.</h3>
              <p>These guides should not trap the reader on a policy page. They should make the next archive record easier to understand, compare, and trust.</p>
              <div class="category-links"><a href="/archive.html">All Stories</a><a href="/categories.html">Categories</a><a href="/fiction-disclaimer.html">Story and Source Notice</a></div>
            </aside>
          </div>
        </section>`;
}

function renderBoardGuideRow(guide) {
  return `<a class="home-headline-row board-guide-link-row" href="${escapeAttr(guide.url || `/mystery-board/${guide.slug}`)}"><span>${escapeHtml(guide.tag || guide.category || 'Guide')}</span><strong>${escapeHtml(guide.title)}</strong></a>`;
}

function renderBoardGuidePaths({ sourceGuides, writingGuides, navigationGuides }) {
  const groups = [
    {
      title: 'Read source limits without killing the story',
      deck: 'Use these guides when a mystery has uncertain evidence, repeated claims, screenshots, variants, or a hook that should not be treated as proof.',
      guides: sourceGuides
    },
    {
      title: 'Keep article voice human and useful',
      deck: 'These guides protect the writing style: enough atmosphere to feel alive, enough explanation to avoid thin or mechanical pages.',
      guides: writingGuides
    },
    {
      title: 'Move through the archive naturally',
      deck: 'Follow recurring motifs, categories, internal links, and related records without turning navigation into the main event.',
      guides: navigationGuides
    }
  ];
  return `<section class="home-reader-paths board-guide-paths" aria-label="Mystery Board reading paths">
          <div class="section-head"><h2>Reading Guide Paths</h2><span>Board topics that lead back to real records</span></div>
          <div class="home-path-grid">${groups.map(renderBoardPathGroup).join('')}</div>
        </section>`;
}

function renderBoardPathGroup(group) {
  return `<article>
          <h3>${escapeHtml(group.title)}</h3>
          <p>${escapeHtml(group.deck)}</p>
          <div class="category-links">${group.guides.map(renderBoardGuideSmallLink).join('')}</div>
        </article>`;
}

function renderBoardGuideSmallLink(guide) {
  return `<a href="${escapeAttr(guide.url || `/mystery-board/${guide.slug}`)}">${escapeHtml(guide.shortTitle || guide.title)}</a>`;
}

function renderBoardGuideIndex(rows) {
  return `<section class="home-headline-desk board-guide-index" aria-label="All Mystery Board guides">
          <div class="section-head"><h2>All Mystery Board Guides</h2><span>${escapeHtml(`${guides.length} public guides`)}</span></div>
          <div class="archive-story-index-grid">
            <div class="story-list">
${rows.join('\n')}
            </div>
            <aside class="home-context-card">
              <p class="label">Board index</p>
              <h3>The guide list stays visible, but it is no longer the whole page.</h3>
              <p>Readers can start with a broad Board topic, then cross into Archive records, categories, Creator Library material, or future tools from the same surface.</p>
            </aside>
          </div>
        </section>`;
}

function renderBoardCrossroads() {
  return `<section class="home-crossroads board-crossroads" aria-label="Mystery Board crossroads">
          <div class="section-head"><h2>Board Crossroads</h2><span>Guides should connect both ways</span></div>
          <div class="home-crossroad-grid">
            <article>
              <p class="category-group-label">Archive</p>
              <h3><a href="/archive.html">Move from guide context into story records</a></h3>
              <p>The Board explains how to read; the Archive remains the main building full of legends, folklore, myths, places, and strange records.</p>
              <div class="category-links"><a href="/newest.html">Newest Records</a><a href="/popular.html">Known Records</a><a href="/categories.html">Categories</a></div>
            </article>
            <article>
              <p class="category-group-label">Creator Library</p>
              <h3><a href="/scripts/">Turn archive context into creator material</a></h3>
              <p>Creator Library pages should be reachable from Board guidance when a reader wants scripts, prompts, or structured production material.</p>
              <div class="category-links"><a href="/scripts/">Creator Home</a><a href="/scripts/board/">Library Board</a><a href="/scripts/categories/">Library Categories</a></div>
            </article>
            <article class="home-planned-card">
              <p class="category-group-label">Tools</p>
              <h3><a href="/tools.html">Future tools can turn guide ideas into utilities</a></h3>
              <p>Source Checklist, Motif Finder, and Reading Path Builder belong here later, with quiet links back to Board, Archive, and Library.</p>
              <div class="home-planned-list"><span>Source Checklist</span><span>Motif Finder</span><span>Reading Paths</span></div>
            </article>
          </div>
        </section>`;
}

function renderBoardPortalRail({ primary, boardStarters, relatedArchiveRecords }) {
  return `<aside class="home-portal-rail" aria-label="Mystery Board side paths">
      ${renderKyunolabNetworkCard()}
      <section class="rail-card rail-feature">
        <p class="rail-label">Start here</p>
        <a href="${escapeAttr(primary.url || `/mystery-board/${primary.slug}`)}"><span>${escapeHtml(primary.tag || primary.category)}</span><strong>${escapeHtml(primary.shortTitle || primary.title)}</strong></a>
      </section>
      <section class="rail-card">
        <p class="rail-label">Board starters</p>
        ${boardStarters.slice(0, 4).map(renderBoardGuideSmallLink).join('')}
      </section>
      <section class="rail-card rail-card-subtle">
        <p class="rail-label">Archive records</p>
        ${relatedArchiveRecords.slice(0, 5).map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}
      </section>
      <section class="rail-card">
        <p class="rail-label">Cross roads</p>
        <a href="/archive.html">Board to Archive</a>
        <a href="/scripts/">Board to Creator Library</a>
        <a href="/tools.html">Board to Tools</a>
      </section>
    </aside>`;
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
    bodyClass: 'home-portal-page',
    headerHtml: renderHomePortalHeader(canonicalPath),
    pageStyleVersion: boardPortalStyleVersion,
    content: `  <main class="home-shell home-portal-shell board-portal-page board-guide-detail-page">
    <div class="home-portal-layout">
      <div class="home-main-column">
        <article>
          <header class="archive-article-header">
            <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/mystery-board.html">Mystery Board</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(guide.title)}</span></nav>
            <p class="label">Mystery Board Guide</p>
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
          ${renderAdSlot('ad-guide-after-map')}

          <div class="story-body archive-entry">
${sections}

            ${renderAdSlot('ad-guide-mid-article')}

            <h2 id="faq">FAQ</h2>
            ${faq}

            <h2>Story &amp; Source Note</h2>
            <p>${escapeHtml(guide.sourceNote)}</p>
          </div>
        </article>
      </div>

      <aside class="home-portal-rail" aria-label="Related guides">
        ${renderKyunolabNetworkCard()}
        <section class="rail-card">
          <p class="rail-label">In this guide</p>
          ${guide.sections.map((section) => `<a href="#${escapeAttr(section.id)}">${escapeHtml(section.nav || section.title)}</a>`).join('')}
          <a href="#faq">FAQ</a>
        </section>
        <section class="rail-card rail-feature">
          <p class="rail-label">Read next</p>
          <a href="${escapeAttr(nextGuide.url || `/mystery-board/${nextGuide.slug}`)}"><span>${escapeHtml(nextGuide.tag || nextGuide.category)}</span><strong>${escapeHtml(nextGuide.shortTitle || nextGuide.title)}</strong></a>
        </section>
        <section class="rail-card">
          <p class="rail-label">Related records</p>
          ${relatedStories.slice(0, 3).map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}
        </section>
        <section class="rail-card rail-card-subtle">
          <p class="rail-label">Mystery Board</p>
          <a href="/mystery-board.html">All Guides</a>
          <a href="/archive.html">All Stories</a>
          <a href="/categories.html">Browse Categories</a>
          <a href="/fiction-disclaimer.html">Source Notice</a>
        </section>
      </aside>
    </div>
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

function renderAdSlot(slotName, extraClass = '') {
  const className = ['ad-slot', extraClass].filter(Boolean).join(' ');
  return `<aside class="${escapeAttr(className)}" data-ad-slot="${escapeAttr(slotName)}" aria-label="Advertisement"><span>Advertisement</span></aside>`;
}

function renderRowsWithMidAd(rowsHtml, slotName) {
  const rows = Array.isArray(rowsHtml) ? [...rowsHtml] : String(rowsHtml || '').split('\n').filter(Boolean);
  if (rows.length < 7) return rows.join('\n');
  rows.splice(6, 0, renderAdSlot(slotName));
  return rows.join('\n');
}

function renderPage({ canonicalPath, title, description, ogTitle, ogDescription, type, content, bodyClass, headerHtml, pageStyleVersion }) {
  const bodyClassAttr = bodyClass ? ` class="${escapeAttr(bodyClass)}"` : '';
  const header = typeof headerHtml === 'string' ? headerHtml : renderHeader();
  const pageAssetsVersion = pageStyleVersion || styleVersion;
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
  <link rel="stylesheet" href="/styles.css?v=${pageAssetsVersion}">
</head>
<body${bodyClassAttr}>
  ${header}
${content}
  ${renderFooter()}
  <script defer src="/assets/global-search.js?v=${pageAssetsVersion}"></script>
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
      <nav class="nav"><a href="/popular.html">Known Stories</a><a href="/newest.html">Newest Stories</a><a href="/categories.html">Categories</a><a href="/mystery-board.html">Mystery Board</a><a href="/tools.html">Tools</a><a href="/about.html">About</a><a href="/hub.html">Hub</a></nav>
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

function renderHomePortalHeader(currentPath = '/') {
  const pathForNav = normalizeNavPath(currentPath);
  return `<header class="home-portal-header">
    <div class="home-portal-header-inner">
      <div class="home-portal-topbar">
        <a class="home-portal-brand" href="/"><span class="home-portal-brand-mark"><img src="/icon-192.png" alt="" aria-hidden="true"></span><span><strong>Kyunolab Mystery Archive</strong><em>Legends, folklore, mysteries, and strange tales.</em></span></a>
        ${renderHomePortalSearchForm()}
      </div>
      <nav class="home-portal-nav" aria-label="Primary navigation">
        ${homePortalNavLink('/', 'Home', pathForNav === '/')}
        ${homePortalNavLink('/popular.html', 'Known Stories', pathForNav === '/popular')}
        ${homePortalNavLink('/newest.html', 'Newest Stories', pathForNav === '/newest')}
        ${homePortalNavLink('/categories.html', 'Categories', pathForNav === '/categories' || pathForNav.startsWith('/categories/'))}
        ${homePortalNavLink('/mystery-board.html', 'Mystery Board', pathForNav === '/mystery-board' || pathForNav.startsWith('/mystery-board/'))}
        ${homePortalNavLink('/scripts/', 'Creator Library', pathForNav === '/scripts' || pathForNav.startsWith('/scripts/'))}
        ${homePortalNavLink('/tools.html', 'Tools', pathForNav === '/tools')}
        ${homePortalNavLink('/about.html', 'About', pathForNav === '/about')}
        ${homePortalNavLink('/hub.html', 'Hub', pathForNav === '/hub', 'home-portal-hub-link')}
      </nav>
      ${renderHomeSignSystem()}
    </div>
  </header>`;
}

function renderHomePortalSearchForm() {
  return `<form class="site-search home-portal-search" action="/search/" method="get" role="search" aria-label="Search Kyunolab">
          <input type="hidden" name="type" value="archive">
          <label class="sr-only" for="home-portal-search-query">Search query</label>
          <input id="home-portal-search-query" name="q" class="site-search-input" type="search" placeholder="Search Kyunolab..." autocomplete="off" data-search-input>
          <button class="site-search-button" type="submit">Search</button>
        </form>`;
}

function renderHomeSignSystem() {
  return `<section class="home-sign-system" aria-label="Kyunolab reading paths">
          <div class="home-sign-intro">
            <p class="label">Start Here</p>
            <h2>Choose a story shelf first, then use the map when you want the wider site.</h2>
            <p>Begin with archive stories, open the full index, or cross into reading guides, creator material, and future tools.</p>
          </div>
          <div class="home-sign-links">
            <div>
              <h3>Browse Stories</h3>
              <a href="/categories/urban-legends.html">Urban Legends</a>
              <a href="/categories/internet-folklore.html">Internet Folklore</a>
              <a href="/categories/myths.html">Myths</a>
              <a href="/categories/strange-places.html">Strange Places</a>
            </div>
            <div>
              <h3>Use The Map</h3>
              <a href="/archive.html">All Stories</a>
              <a href="/mystery-board.html">Reading Guides</a>
              <a href="/scripts/">Creator Library</a>
              <a href="/tools.html">Tools</a>
            </div>
          </div>
          <div class="home-small-buildings">
            <h3>Site Notes</h3>
            <a href="/hub.html">Hub</a>
            <a href="/about.html">About Kyunolab</a>
            <a href="/fiction-disclaimer.html">Story and source notice</a>
          </div>
        </section>`;
}

function homePortalNavLink(href, label, isActive, extraClass = '') {
  const classes = [extraClass, isActive ? 'active' : ''].filter(Boolean).join(' ');
  const classAttr = classes ? ` class="${escapeAttr(classes)}"` : '';
  return `<a href="${href}"${classAttr}${isActive ? ' aria-current="page"' : ''}>${escapeHtml(label)}</a>`;
}

function normalizeNavPath(value) {
  if (!value || value === '/') return '/';
  const pathOnly = String(value).split('?')[0].replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  return pathOnly.endsWith('/') && pathOnly !== '/' ? pathOnly.slice(0, -1) : pathOnly;
}

function renderKyunolabNetworkCard() {
  return `<div class="rail-card rail-card-network">
        <p class="rail-label">Kyunolab Network</p>
        <strong>Creator Library</strong>
        <p>Free mystery YouTube scripts, Shorts scripts, image prompts, and thumbnail ideas for video creators.</p>
        <a class="button" href="/scripts/">Open Creator Library</a>
      </div>`;
}

function getGuidesBySlug(slugs) {
  return slugs.map((slug) => guides.find((guide) => guide.slug === slug)).filter(Boolean);
}

function getGuideBySlug(slug) {
  return guides.find((guide) => guide.slug === slug);
}

function uniqueGuide(guide, index, list) {
  return guide && list.findIndex((item) => item.slug === guide.slug) === index;
}

function getStoriesBySlug(slugs) {
  return slugs.map((slug) => stories.find((story) => story.slug === slug)).filter(Boolean);
}

function renderFooter() {
  return `<footer class="site-footer">
    <p><strong>Kyunolab Mystery Archive</strong> is a quiet story publication by Kyuno Lab, dedicated to legends, folklore, mysteries, and strange tales from the edges of memory.</p>
    <p><a href="/archive.html">All Stories</a> - <a href="/newest.html">Newest</a> - <a href="/popular.html">Popular</a> - <a href="/categories.html">Categories</a> - <a href="/mystery-board.html">Mystery Board</a> - <a href="/scripts/">Scripts</a> - <a href="/about.html">About</a> - <a href="/fiction-disclaimer.html">Story &amp; Source Notice</a> - <a href="/privacy.html">Privacy</a> - <a href="/rss.xml">RSS</a></p>
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
