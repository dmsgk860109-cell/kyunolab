const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const siteUrl = 'https://kyunolab.com';
const styleVersion = '20260717-search-ui';
const pageSize = 12;
const publishingCenterPageSize = 24;
const rssLimit = 20;

const stories = readJson(path.join(root, 'data', 'stories.json'));
const categories = readJson(path.join(root, 'data', 'categories.json'));
const guides = readOptionalJson(path.join(root, 'data', 'guides.json'));
const creatorScripts = readOptionalJson(path.join(root, 'data', 'scripts.json'));
const siteConfig = readOptionalJson(path.join(root, 'data', 'site.json'), {});

generateHomePage();
generateArchivePageSet({
  baseName: 'newest',
  label: 'Newest Records',
  title: 'Newest folklore, legend, and mystery records',
  description: 'The latest Kyunolab Mystery Archive entries, including urban legends, internet folklore, myths, strange places, and source-aware mystery notes.',
  items: sortNewest(stories)
});

generateArchivePageSet({
  baseName: 'popular',
  label: 'Popular Records',
  title: 'Popular urban legends, folklore, and mystery records',
  description: 'A curated path through reader-friendly entry points for urban legends, internet folklore, classic myths, strange places, and recurring mystery motifs.',
  items: stories
});

generateArchivePageSet({
  baseName: 'archive',
  label: 'Archive Index',
  title: 'Explore every open file in Kyunolab Mystery Archive',
  description: 'Move through every record by category, source status, story type, folklore motif, legend origin, and recurring mystery pattern.',
  items: sortArchive(stories)
});

generateCategoryHub();
generateCategoryPages();
generatePublishingCenter();
generateScriptsPages();
generateSearchPage();
generateSearchIndexes();
generateRss();
generateSitemap();
generateRoutingFiles();

console.log(`Generated site index pages for ${stories.length} stories, ${categories.length} categories, ${guides.length} guides, and ${creatorScripts.length} scripts.`);

function generateHomePage() {
  const featuredStory = getConfiguredStory(siteConfig.featuredStoryId) || stories[0];
  const latestStories = stories.slice(0, 8);
  const popularStories = getConfiguredStories(siteConfig.popularStoryIds).slice(0, 5);
  const essentialStories = getConfiguredStories(siteConfig.essentialStoryIds).slice(0, 4);
  const categoryGroups = getHomeCategoryGroups();

  writeFile('index.html', renderHomePage({
    featuredStory,
    latestStories,
    popularStories,
    essentialStories,
    categoryGroups
  }));
}

function renderHomePage({ featuredStory, latestStories, popularStories, essentialStories, categoryGroups }) {
  const title = 'Kyunolab Mystery Archive | Urban Legends, Folklore, Myths & Strange Tales';
  const description = "Explore urban legends, folklore origins, internet myths, strange places, mythic creatures, and source-aware mystery stories in Kyunolab's calm archive.";
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Kyunolab Mystery Archive',
    alternateName: ['Kyunolab', 'Kyuno Lab Mystery Archive'],
    url: `${siteUrl}/`,
    description,
    publisher: {
      '@type': 'Organization',
      name: 'Kyuno Lab'
    },
    inLanguage: 'en'
  };
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}">
  <meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:description" content="${escapeAttr(description)}">
  <meta property="og:site_name" content="Kyunolab Mystery Archive">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${siteUrl}/">
  <meta property="og:image" content="${siteUrl}/icon-512.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(title)}">
  <meta name="twitter:description" content="${escapeAttr(description)}">
  <meta name="twitter:image" content="${siteUrl}/icon-512.png">
  <link rel="canonical" href="${siteUrl}/">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32">
  <link rel="icon" href="/favicon-48x48.png" type="image/png" sizes="48x48">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="stylesheet" href="/styles.css?v=${styleVersion}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  ${renderHeader()}
  <main class="home-shell">
    <div class="home-layout">
      ${renderHomeLeftRail()}
      <div class="home-main-column">
        <section class="hero">
          <div class="hero-copy"><p class="label">Strange Story Archive</p><h1>Strange legends. Forgotten folklore. Mysteries that refuse to disappear.</h1><p>A quiet archive of urban legends, folklore origins, internet myths, strange places, mythic creatures, and recurring mystery patterns.</p></div>
          ${renderFeaturedStory(featuredStory)}
        </section>
        <section class="notice"><strong>Story &amp; Source Notice:</strong> This site explores folklore, legends, mysteries, and source-aware retellings. Unverified traditions are presented as stories, not as verified fact.</section>
        <div class="home-stream">
          <section id="latest" class="latest latest-compact"><div class="section-head"><h2>Latest Stories</h2><a href="/newest.html">View all newest</a></div><div class="home-story-list">${latestStories.map(renderHomeStoryRow).join('')}</div></section>
        </div>
        <section class="board" id="rankings"><div class="section-head"><h2>Popular Records</h2><a href="/mystery-board.html">Open mystery board</a></div><div class="ranking-grid"><ol class="ranking-card">${popularStories.map(renderRankingItem).join('')}</ol><aside class="side-panel"><h3>Reader Paths</h3><a href="/newest.html">Newest stories</a><a href="/categories.html">Browse by category</a><a href="#essential-reads">Start with essential reads</a><a href="/fiction-disclaimer.html">Story &amp; source notice</a></aside></div></section>
        <section id="categories" class="categories"><div class="section-head"><h2>Browse By Category</h2><a href="/categories.html">View all categories</a></div><div class="home-category-groups">${categoryGroups.map(renderHomeCategoryGroup).join('')}</div></section>
        <section id="essential-reads" class="essential-reads"><div class="section-head"><h2>Essential Reads</h2><span>Start here</span></div><div class="compact-grid">${essentialStories.map(renderEssentialStory).join('')}</div></section>
        <section class="archive-cta"><div><p class="label">Archive Index</p><h2>Explore every open file in Kyunolab Mystery Archive.</h2><p>Move through the full collection by category, source status, story type, folklore motif, legend origin, and recurring mystery pattern.</p></div><a class="button" href="/archive.html">Browse all current stories</a></section>
      </div>
      ${renderHomeRail({ featuredStory, popularStories, essentialStories })}
    </div>
  </main>
  ${renderFooter()}${renderGlobalSearchScript()}
</body>
</html>
`;
}

function generateArchivePageSet({ baseName, label, title, description, items }) {
  const pages = chunk(items, pageSize);
  cleanupPagedFiles(baseName, pages.length);

  pages.forEach((pageItems, index) => {
    const pageNumber = index + 1;
    const fileName = pageNumber === 1 ? `${baseName}.html` : `${baseName}-${pageNumber}.html`;
    const canonicalPath = pageNumber === 1 ? `/${baseName}.html` : `/${baseName}-${pageNumber}.html`;
    const pageTitle = pageNumber === 1 ? title : `${title} - Page ${pageNumber}`;
    writeFile(fileName, renderListPage({
      canonicalPath,
      label,
      title: pageTitle,
      h1: title,
      description,
      items: pageItems,
      baseName,
      pageNumber,
      totalPages: pages.length
    }));
  });
}

function generateCategoryHub() {
  const grouped = groupCategories();
  const body = Object.entries(grouped).map(([groupName, groupCategories]) => {
    const groupDescription = groupName === 'Modern Strange Records'
      ? 'Modern, near-modern, reported, and internet-era records'
      : groupName === 'Mythic & Imagined Realms'
        ? 'Mythic, legendary, symbolic, and imagined-world records'
        : 'Supplemental archive paths';

    const cards = groupCategories.map((category) => {
      const categoryStories = stories.filter((story) => story.categorySlug === category.slug).slice(0, 3);
      return `      <article>
        <p class="category-group-label">${escapeHtml(category.group)}</p>
        <h3><a href="/categories/${escapeAttr(category.slug)}.html">${escapeHtml(category.title)}</a></h3>
        <p>${escapeHtml(category.description)}</p>
        <div class="category-links">${categoryStories.map(renderCategoryStoryLink).join('')}</div>
        <a class="text-link" href="/categories/${escapeAttr(category.slug)}.html">View ${escapeHtml(category.title)}</a>
      </article>`;
    }).join('\n');

    return `      <section class="category-group">
        <div class="section-head category-group-head"><h2>${escapeHtml(groupName)}</h2><span>${escapeHtml(groupDescription)}</span></div>
        <div class="category-grid category-hub">
${cards}
        </div>
      </section>`;
  }).join('\n');

  writeFile('categories.html', renderPage({
    canonicalPath: '/categories.html',
    title: 'Categories',
    description: 'Browse Kyunolab Mystery Archive through organized category groups, each with active records and internal reading paths.',
    networkSection: 'archive',
    content: `  <main class="article-shell article-layout">
    ${renderLeftRail('Category paths')}
    <div class="archive-page-main">
      <p class="label">Archive Categories</p>
      <h1 class="article-title">Browse by category</h1>
      <p class="deck">Each active category contains multiple records, giving every shelf enough material to test structure, navigation, and reader flow.</p>
${body}
    </div>
    ${renderCategoryRightRail()}
  </main>`
  }));
}

function generateCategoryPages() {
  for (const category of categories) {
    const categoryStories = sortNewest(stories.filter((story) => story.categorySlug === category.slug));
    const pages = chunk(categoryStories, pageSize);
    cleanupPagedFiles(`categories/${category.slug}`, pages.length);

    pages.forEach((pageItems, index) => {
      const pageNumber = index + 1;
      const fileName = pageNumber === 1 ? `categories/${category.slug}.html` : `categories/${category.slug}-${pageNumber}.html`;
      const canonicalPath = pageNumber === 1 ? `/categories/${category.slug}.html` : `/categories/${category.slug}-${pageNumber}.html`;
      const pageTitle = pageNumber === 1 ? categorySeoTitle(category) : `${category.title} - Page ${pageNumber}`;
      writeFile(fileName, renderCategoryPage({ category, pageItems, pageNumber, totalPages: pages.length, pageTitle, canonicalPath }));
    });
  }
}

function generatePublishingCenter() {
  const activeCategories = categories.filter((category) => stories.some((story) => story.categorySlug === category.slug));
  writeFile('publishing-center/index.html', renderPublishingCenterHome(activeCategories));
  for (const category of activeCategories) {
    const categoryStories = sortNewest(stories.filter((story) => story.categorySlug === category.slug));
    const pageCount = Math.max(1, Math.ceil(categoryStories.length / publishingCenterPageSize));
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const pageStories = categoryStories.slice((pageNumber - 1) * publishingCenterPageSize, pageNumber * publishingCenterPageSize);
      const filePath = pageNumber === 1
        ? `publishing-center/${category.slug}/index.html`
        : `publishing-center/${category.slug}/page-${pageNumber}/index.html`;
      writeFile(filePath, renderPublishingCategoryPage({
        category,
        stories: pageStories,
        pageNumber,
        totalPages: pageCount
      }));
    }
  }
}

function renderPublishingCenterHome(activeCategories) {
  const categoryLinks = activeCategories.map((category) => {
    const count = stories.filter((story) => story.categorySlug === category.slug).length;
    return `          <li><a href="/publishing-center/${escapeAttr(category.slug)}/">${escapeHtml(category.title)} (${count})</a></li>`;
  }).join('\n');

  return renderPage({
    canonicalPath: '/publishing-center/',
    title: 'Publishing Center',
    description: 'Internal publishing management page for Kyunolab archive records.',
    robots: 'noindex, nofollow',
    networkSection: 'publishing',
    content: `  <main class="article-shell">
    <div class="archive-page-main">
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">Publishing Center</span></nav>
      <p class="label">Internal Tool</p>
      <h1 class="article-title">Publishing Center</h1>
      ${renderPublishingCenterStyles()}
      <section class="script-material" aria-label="Archive categories">
        <h2>Archive Categories</h2>
        <ul class="publishing-category-list">
${categoryLinks}
        </ul>
      </section>
    </div>
  </main>`
  });
}

function renderPublishingCategoryPage({ category, stories, pageNumber, totalPages }) {
  const rows = stories.map((story) => {
    const storyUrl = `${siteUrl}/stories/${story.slug}`;
    const localKey = `kyunolab:publishing:${story.slug}:naver`;
    return `        <li class="publishing-record">
          <a class="publishing-record-title" href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>
          <div class="publishing-record-actions">
            <button class="button publishing-share" type="button" data-title="${escapeAttr(story.title)}" data-url="${escapeAttr(storyUrl)}">Share</button>
            <button class="button publishing-naver-copy" type="button" data-title="${escapeAttr(story.title)}" data-url="${escapeAttr(storyUrl)}" data-description="${escapeAttr(story.metaDescription || story.excerpt || story.summaryAnswer || '')}" data-category="${escapeAttr(story.category || category.title)}">Naver Copy</button>
            <label class="publishing-published-label"><input class="publishing-published" type="checkbox" data-storage-key="${escapeAttr(localKey)}"> Published</label>
          </div>
        </li>`;
  }).join('\n');
  const pagination = renderPublishingPagination({ category, pageNumber, totalPages });
  const pageSuffix = pageNumber > 1 ? ` - Page ${pageNumber}` : '';

  return renderPage({
    canonicalPath: publishingCategoryPagePath(category.slug, pageNumber),
    title: `${category.title} Publishing Center${pageSuffix}`,
    description: `Internal publishing management page for ${category.title} archive records.`,
    robots: 'noindex, nofollow',
    networkSection: 'publishing',
    content: `  <main class="article-shell">
    <div class="archive-page-main publishing-center" data-publishing-center>
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/publishing-center/">Publishing Center</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(category.title)}</span></nav>
      <p class="label">Internal Tool</p>
      <h1 class="article-title">${escapeHtml(category.title)}</h1>
      ${renderPublishingCenterStyles()}
      <section class="script-material" aria-label="${escapeAttr(category.title)} records">
        <h2>Archive Records</h2>
        <p class="publishing-status" role="status" aria-live="polite"></p>
        <ul class="publishing-record-list">
${rows}
        </ul>
${pagination}
      </section>
    </div>
  </main>`
  });
}

function publishingCategoryPagePath(categorySlug, pageNumber) {
  return pageNumber === 1
    ? `/publishing-center/${categorySlug}/`
    : `/publishing-center/${categorySlug}/page-${pageNumber}/`;
}

function renderPublishingPagination({ category, pageNumber, totalPages }) {
  if (totalPages <= 1) return '';
  const previous = pageNumber > 1
    ? `<a href="${publishingCategoryPagePath(category.slug, pageNumber - 1)}">Previous</a>`
    : '<span aria-disabled="true">Previous</span>';
  const pageLinks = Array.from({ length: totalPages }, (_, index) => {
    const number = index + 1;
    if (number === pageNumber) {
      return `<span aria-current="page">${number}</span>`;
    }
    return `<a href="${publishingCategoryPagePath(category.slug, number)}">${number}</a>`;
  }).join('');
  const next = pageNumber < totalPages
    ? `<a href="${publishingCategoryPagePath(category.slug, pageNumber + 1)}">Next</a>`
    : '<span aria-disabled="true">Next</span>';

  return `        <nav class="publishing-pagination" aria-label="${escapeAttr(category.title)} pagination">
          ${previous}
          ${pageLinks}
          ${next}
        </nav>`;
}

function renderPublishingCenterStyles() {
  return `<style>
        .publishing-category-list,
        .publishing-record-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .publishing-category-list li {
          margin: 0 0 0.35rem;
        }

        .publishing-record {
          align-items: center;
          border-bottom: 1px solid var(--border-color, #d9d2c4);
          display: grid;
          gap: 0.65rem 1.25rem;
          grid-template-columns: minmax(18rem, 1fr) max-content;
          min-height: 3.25rem;
          padding: 0.45rem 0.35rem;
        }

        .publishing-record-title {
          overflow-wrap: anywhere;
        }

        .publishing-record-actions {
          align-items: center;
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
          white-space: nowrap;
        }

        .publishing-record .button {
          font-size: 0.85rem;
          line-height: 1.1;
          min-height: 2.35rem;
          min-width: 4.1rem;
          padding: 0.48rem 0.7rem;
          position: relative;
          z-index: 1;
        }

        .publishing-published-label {
          align-items: center;
          cursor: pointer;
          display: inline-flex;
          gap: 0.25rem;
          margin: 0;
          min-height: 2.35rem;
          padding: 0.25rem 0.25rem;
          position: relative;
          z-index: 1;
        }

        .publishing-published {
          cursor: pointer;
          height: 1.05rem;
          width: 1.05rem;
        }

        .publishing-status {
          color: var(--muted, #6b6258);
          font-size: 0.9rem;
          margin: -0.25rem 0 0.65rem;
          min-height: 1.2rem;
        }

        .publishing-pagination {
          align-items: center;
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-top: 1rem;
        }

        .publishing-pagination a,
        .publishing-pagination span {
          border: 1px solid var(--border-color, #d9d2c4);
          border-radius: 4px;
          display: inline-flex;
          line-height: 1;
          padding: 0.45rem 0.6rem;
        }

        .publishing-pagination span[aria-current="page"] {
          background: var(--ink, #171717);
          border-color: var(--ink, #171717);
          color: var(--paper, #fffaf1);
        }

        .publishing-pagination span[aria-disabled="true"] {
          opacity: 0.55;
        }

        @media (max-width: 720px) {
          .publishing-record {
            grid-template-columns: 1fr;
          }

          .publishing-record-actions {
            flex-wrap: wrap;
            justify-content: flex-start;
            white-space: normal;
          }
        }
      </style>`;
}

function generateScriptsPages() {
  const scripts = sortNewest(creatorScripts);
  writeFile('scripts/index.html', renderScriptsHomePage(scripts));
  writeFile('scripts/latest/index.html', renderScriptsLatestPage(scripts));
  writeFile('scripts/featured/index.html', renderScriptsFeaturedPage(scripts));
  writeFile('scripts/categories/index.html', renderScriptCategoriesPage(scripts));
  generateScriptCategoryPages(scripts);
  writeFile('scripts/board/index.html', renderScriptBoardPage(scripts));
  writeFile('scripts/resources/index.html', renderScriptResourcesPage(scripts));
  for (const script of scripts) {
    writeFile(`scripts/${script.slug}.html`, renderScriptDetailPage(script));
  }
}

function generateScriptCategoryPages(scripts) {
  const activeCategories = categories.filter((category) => !category.legacy);
  cleanupScriptCategoryPages(activeCategories);
  for (const category of activeCategories) {
    writeFile(`scripts/categories/${category.slug}/index.html`, renderScriptCategoryPage({ category, scripts }));
  }
}

function cleanupScriptCategoryPages(activeCategories) {
  const categoriesDir = path.join(root, 'scripts', 'categories');
  if (!fs.existsSync(categoriesDir)) return;
  const allowed = new Set(activeCategories.map((category) => category.slug));
  for (const entry of fs.readdirSync(categoriesDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || allowed.has(entry.name)) continue;
    fs.rmSync(path.join(categoriesDir, entry.name), { recursive: true, force: true });
  }
}

function renderScriptsHomePage(scripts) {
  const featuredScripts = scripts.slice(0, 3);
  const latestScripts = scripts.slice(0, 8);
  const genres = groupScriptsByGenre(scripts);
  const featuredScript = featuredScripts[0] || scripts[0];
  return renderPage({
    canonicalPath: '/scripts/',
    title: 'Free Mystery YouTube Scripts | Kyunolab',
    description: 'Free mystery YouTube scripts for creators, including longform YouTube scripts, Shorts scripts, image prompts, thumbnail ideas, and subtitle lines.',
    metaDescription: 'Free mystery, horror, urban legend, and strange history YouTube scripts for creators. Includes longform narration, Shorts scripts, image prompts, thumbnail ideas, and subtitle lines.',
    networkSection: 'scripts',
    content: `  <main class="home-shell scripts-page scripts-home-page">
    <div class="home-layout scripts-home-layout">
      ${renderScriptsLeftRail()}
      <div class="home-main-column">
        <section class="hero scripts-home-hero">
          <div class="hero-copy"><p class="label">Creator Script Library</p><h1>Free Mystery YouTube Scripts</h1><p>A creator-focused library for longform YouTube scripts, Shorts scripts, image prompts, thumbnail ideas, subtitle lines, and mystery video planning.</p></div>
          ${renderFeaturedScript(featuredScript)}
        </section>
        <section class="notice"><strong>Creator Note:</strong> Script packages are creator materials. Original archive stories stay separate from narration drafts, Shorts hooks, image prompts, thumbnail ideas, and subtitle lines.</section>
        <section id="featured-scripts" class="scripts-section">
          <div class="section-head"><h2>Featured Scripts</h2><span>Ready for video planning</span></div>
          <div class="script-card-grid">${featuredScripts.map(renderScriptCard).join('')}</div>
        </section>
        <section id="latest-scripts" class="scripts-section">
          <div class="section-head"><h2>Latest Scripts</h2><span>New creator materials</span></div>
          <div class="script-list">${latestScripts.map(renderScriptRow).join('')}</div>
        </section>
        <section id="script-board" class="scripts-section script-board">
          <div>
            <p class="label">Library Board</p>
            <h2>Choose a format before you write the voiceover.</h2>
            <p>Each script package separates the original archive story from creator-facing assets: longform narration, Shorts structure, visual prompts, thumbnail angles, and subtitle lines.</p>
          </div>
          <div class="script-board-grid">
            <article><strong>Longform YouTube</strong><span>8-13 minute narration structures for mystery, folklore, and legend videos.</span></article>
            <article><strong>Shorts</strong><span>Compressed hooks and ending beats for vertical video.</span></article>
            <article><strong>Visual Planning</strong><span>Image prompts, thumbnail ideas, and subtitle lines kept separate from the archive article.</span></article>
          </div>
        </section>
        <section id="script-categories" class="scripts-section">
          <div class="section-head"><h2>Script Categories</h2><span>Browse by creator use</span></div>
          <div class="script-category-grid">${genres.map(renderScriptGenreCard).join('')}</div>
        </section>
        <section id="creator-resources" class="scripts-section creator-resources">
          <div class="section-head"><h2>Creator Resources</h2><a href="/archive.html">Browse original archive stories</a></div>
          <div class="script-resource-links">
            <a href="/scripts/">Free Mystery YouTube Scripts</a>
            <a href="/mystery-board.html">Mystery Board</a>
            <a href="/fiction-disclaimer.html">Story &amp; Source Notice</a>
          </div>
        </section>
      </div>
      ${renderScriptsHomeRail({ featuredScript, latestScripts, genres })}
    </div>
  </main>`
  });
}

function renderScriptsLatestPage(scripts) {
  return renderScriptsListingPage({
    canonicalPath: '/scripts/latest/',
    label: 'Latest Scripts',
    title: 'Latest mystery YouTube scripts',
    deck: 'The newest creator-ready script packages from Kyunolab Creator Library, arranged for longform narration, Shorts planning, image prompts, thumbnails, and production notes.',
    sectionTitle: 'Newest creator materials',
    sectionMeta: `${scripts.length} script package${scripts.length === 1 ? '' : 's'}`,
    scripts,
    pageTitle: 'Latest Mystery YouTube Scripts | Kyunolab Creator Library',
    description: 'Browse the newest Kyunolab mystery YouTube scripts for creators, including longform narration, Shorts hooks, image prompts, thumbnail ideas, and subtitle lines.'
  });
}

function renderScriptsFeaturedPage(scripts) {
  const featuredScripts = scripts.slice(0, 6);
  return renderScriptsListingPage({
    canonicalPath: '/scripts/featured/',
    label: 'Featured Scripts',
    title: 'Featured mystery video script packages',
    deck: 'Start with the strongest creator-ready script packages: reliable entry points for mystery videos, urban legend explainers, folklore narration, Shorts hooks, and visual planning.',
    sectionTitle: 'Featured creator packages',
    sectionMeta: 'Recommended starting points',
    scripts: featuredScripts,
    pageTitle: 'Featured Mystery YouTube Scripts | Kyunolab Creator Library',
    description: 'Browse featured Kyunolab mystery YouTube script packages with longform narration, Shorts scripts, image prompts, thumbnail ideas, and creator planning notes.'
  });
}

function renderScriptsListingPage({ canonicalPath, label, title, deck, sectionTitle, sectionMeta, scripts, pageTitle, description }) {
  return renderPage({
    canonicalPath,
    title: pageTitle,
    description,
    metaDescription: description,
    networkSection: 'scripts',
    content: `  <main class="article-shell article-layout scripts-listing-page">
    ${renderScriptsBoardLeftRail()}
    <div class="archive-page-main">
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/scripts/">Creator Library</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(label)}</span></nav>
      <p class="label">${escapeHtml(label)}</p>
      <h1 class="article-title">${escapeHtml(title)}</h1>
      <p class="deck">${escapeHtml(deck)}</p>
      <section class="notice">
        <strong>Creator Library:</strong> These pages list script packages only. Original archive records remain in Kyunolab Mystery Archive and are linked only when a script package needs a source reference.
      </section>
      <section class="scripts-section">
        <div class="section-head"><h2>${escapeHtml(sectionTitle)}</h2><span>${escapeHtml(sectionMeta)}</span></div>
        ${scripts.length ? `<div class="script-list">${scripts.map(renderScriptRow).join('\n')}</div>` : `<div class="notice"><strong>No script packages yet:</strong> This page is ready for future creator materials.</div>`}
      </section>
    </div>
    ${renderScriptCategoryRightRail(sortNewest(creatorScripts))}
  </main>`
  });
}

function renderScriptCategoriesPage(scripts) {
  const grouped = groupCreatorCategories();
  const body = Object.entries(grouped).map(([groupName, groupCategories]) => {
    const groupDescription = groupName === 'Modern Strange Records'
      ? 'Creator-ready paths for modern legends, internet folklore, strange places, and evidence-limited mysteries'
      : 'Creator-ready paths for myths, creatures, lost worlds, legendary places, strange nature, and symbolic objects';
    const cards = groupCategories.map(renderCreatorCategoryCard).join('\n');
    return `      <section class="category-group">
        <div class="section-head category-group-head"><h2>${escapeHtml(groupName)}</h2><span>${escapeHtml(groupDescription)}</span></div>
        <div class="category-grid category-hub">
${cards}
        </div>
      </section>`;
  }).join('\n');
  return renderPage({
    canonicalPath: '/scripts/categories/',
    title: 'Creator Script Categories | Kyunolab Video Scripts',
    description: 'Browse twelve Kyunolab creator category paths for mystery YouTube scripts, Shorts planning, image prompts, thumbnails, and video research.',
    metaDescription: 'Browse twelve creator script categories for mystery videos, including urban legends, internet folklore, myths, strange places, creatures, and lost worlds.',
    networkSection: 'scripts',
    content: `  <main class="article-shell article-layout scripts-categories-page">
    ${renderScriptsBoardLeftRail()}
    <div class="archive-page-main">
      <p class="label">Creator Script Categories</p>
      <h1 class="article-title">Browse creator scripts by archive category</h1>
      <p class="deck">Move through the same twelve Kyunolab archive shelves from a video creator angle: longform scripts, Shorts hooks, image prompts, thumbnail ideas, and production planning.</p>
${body}
    </div>
    ${renderScriptCategoryRightRail(scripts)}
  </main>`
  });
}

function renderScriptCategoryPage({ category, scripts }) {
  const categoryStories = sortNewest(stories.filter((story) => story.categorySlug === category.slug));
  const relatedScripts = scriptsForCreatorCategory(category, scripts);
  const archiveCategoryUrl = `/categories/${escapeAttr(category.slug)}.html`;
  const pageDescription = `${category.title} creator resources for mystery YouTube scripts, Shorts hooks, image prompts, thumbnail ideas, and video planning based on Kyunolab archive records.`;
  return renderPage({
    canonicalPath: `/scripts/categories/${category.slug}/`,
    title: `${category.title} Creator Scripts | Kyunolab Video Scripts`,
    description: pageDescription,
    metaDescription: pageDescription,
    networkSection: 'scripts',
    content: `  <main class="article-shell article-layout scripts-category-page">
    ${renderScriptsBoardLeftRail()}
    <div class="archive-page-main">
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/scripts/">Creator Library</a><span aria-hidden="true">/</span><a href="/scripts/categories/">Categories</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(category.title)}</span></nav>
      <p class="label">${escapeHtml(category.group)}</p>
      <h1 class="article-title">${escapeHtml(category.title)} creator scripts</h1>
      <p class="deck">${escapeHtml(creatorCategoryDescription(category))}</p>
      <section class="notice">
        <strong>Creator use:</strong> Use this shelf to plan videos around ${escapeHtml(category.title.toLowerCase())}: longform narration, Shorts hooks, visual prompts, thumbnail angles, and source-aware archive references.
      </section>
      <section class="scripts-section">
        <div class="section-head"><h2>Script packages in this shelf</h2><span>${relatedScripts.length ? 'Creator-ready materials' : 'Ready for future packages'}</span></div>
        ${relatedScripts.length ? `<div class="script-list">${relatedScripts.map(renderScriptRow).join('\n')}</div>` : `<div class="notice"><strong>No dedicated script package yet:</strong> This creator shelf is ready for future ${escapeHtml(category.title.toLowerCase())} scripts. Use the workflow below to plan the first package without sending readers into the archive by accident.</div>`}
      </section>
      <section class="scripts-section script-board">
        <div>
          <p class="label">Creator workflow</p>
          <h2>Plan this shelf as a repeatable video format.</h2>
          <p>Keep the original archive record separate from production assets. Build the script from source-aware summary, then add Shorts hooks, visual prompts, thumbnail ideas, and subtitle lines only after the story angle is clear.</p>
        </div>
        <div class="script-board-grid">
          <article><strong>Longform angle</strong><span>Turn one archive record into an 8-13 minute narration with context, versions, and meaning.</span></article>
          <article><strong>Shorts hook</strong><span>Compress the strongest image or question into a vertical-video opening.</span></article>
          <article><strong>Visual plan</strong><span>List mood, setting, object, and thumbnail ideas without changing the source record.</span></article>
        </div>
      </section>
      <section class="scripts-section">
        <div class="section-head"><h2>Original archive references</h2><span>Reference only</span></div>
        <section class="notice">
          <strong>Archive source shelf:</strong> Kyunolab Mystery Archive currently has ${categoryStories.length} ${escapeHtml(category.title.toLowerCase())} source record${categoryStories.length === 1 ? '' : 's'}. These are original archive references, not Creator Library script packages.
        </section>
        <div class="script-resource-links">
          <a href="${archiveCategoryUrl}">Browse ${escapeHtml(category.title)} in Mystery Archive</a>
          <a href="/scripts/board/">Open Library Board for ${escapeHtml(category.title)}</a>
        </div>
      </section>
    </div>
    ${renderScriptCategoryRightRail(scripts)}
  </main>`
  });
}

function renderScriptBoardPage(scripts) {
  return renderPage({
    canonicalPath: '/scripts/board/',
    title: 'Library Board | Guides to the Kyunolab Creator Library',
    description: 'Editorial guides to the Kyunolab Creator Library, including its script formats, categories, resource structure, featured packages, and connections to the Mystery Archive.',
    metaDescription: 'Editorial guides to the Kyunolab Creator Library, including its script formats, categories, resource structure, featured packages, and connections to the Mystery Archive.',
    networkSection: 'scripts',
    content: `  <main class="article-shell article-layout scripts-board-page">
    ${renderScriptsBoardLeftRail()}

    <div class="archive-page-main">
      <p class="label">Editorial Guides to the Creator Library</p>
      <h1 class="article-title">Library Board</h1>
      <p class="deck">Explore editorial guides that explain the purpose, structure, formats, categories, and archive relationships of the Kyunolab Creator Library. These pages help visitors understand what the library offers, find the right script packages and resources, and continue into featured collections.</p>

      <section class="notice">
        <strong>Creator Library guide:</strong> The Library Board introduces how scripts, prompts, source notes, and supporting resources are organized while showing how each package connects back to the Kyunolab Mystery Archive.
      </section>

      <section class="scripts-section script-board">
        <div>
          <p class="label">Library structure</p>
          <h2>Understand how Creator Library resources connect.</h2>
          <p>Script detail pages contain finished creator materials. Library Board pages explain formats, categories, resource types, featured packages, and how each package relates to the original archive record.</p>
        </div>
        <div class="script-board-grid">
          <article><strong>Script Formats</strong><span>Guides to long-form scripts, short-form scripts, prompts, source notes, and supporting resources.</span></article>
          <article><strong>Library Categories</strong><span>Guides for how script packages are grouped by topic, story type, and archive relationship.</span></article>
          <article><strong>Archive Connections</strong><span>Resources that show how Creator Library packages connect back to original Mystery Archive records.</span></article>
        </div>
      </section>

      <section class="notice">
        <strong>Board status:</strong> Individual script packages remain in the Creator Library. Library Board pages explain the library structure and point visitors toward featured scripts, latest scripts, categories, resources, and original archive records.
      </section>
    </div>

    <aside class="article-rail article-rail-right" aria-label="Recommended creator resources">
      ${renderKyunolabNetworkCard('scripts')}
      <div class="rail-card rail-feature"><p class="rail-label">Start here</p><a href="/scripts/resources/"><span>Creator Resources</span><strong>Use the archive without confusing story and script.</strong></a></div>
      <div class="rail-card">
        <p class="rail-label">Creator paths</p>
        <a href="/scripts/">Free Mystery YouTube Scripts</a>
        <a href="/scripts/categories/">Script Categories</a>
        <a href="/scripts/resources/">Creator Resources</a>
      </div>
    </aside>
  </main>`
  });
}

function renderScriptResourcesPage() {
  return renderPage({
    canonicalPath: '/scripts/resources/',
    title: 'Creator Guide for Mystery YouTube Scripts | Kyunolab',
    description: 'A practical creator guide for using Kyunolab scripts, categories, source notes, Shorts hooks, image prompts, thumbnails, and video planning resources.',
    metaDescription: 'Creator guide for using Kyunolab mystery YouTube scripts, source notes, Shorts hooks, image prompts, thumbnails, and video planning resources.',
    networkSection: 'scripts',
    content: `  <main class="scripts-page">
    <section class="scripts-hero scripts-subpage-hero">
      <div>
        <p class="label">Creator Resources</p>
        <h1 class="article-title">A guide for turning mystery ideas into video plans.</h1>
        <p class="deck">Use this page to find script packages, choose a video format, check source notes, and move from archive story to longform narration, Shorts hooks, image prompts, and thumbnail ideas.</p>
      </div>
      <aside class="script-creator-panel">
        ${renderKyunolabNetworkCard('scripts')}
        <p class="rail-label">Creator Library</p>
        <a href="/scripts/">Scripts Home</a>
        <a href="/scripts/categories/">Script Categories</a>
        <a href="/scripts/board/">Library Board</a>
      </aside>
    </section>
    <section class="scripts-section">
      <div class="section-head"><h2>What this page helps you do</h2><span>Creator workflow</span></div>
      <div class="script-board-grid">
        <article><strong>Find a script package</strong><span>Start from ready-made mystery video scripts with longform narration, Shorts angles, visual prompts, and thumbnail ideas.</span></article>
        <article><strong>Choose the right format</strong><span>Use categories and the Library Board to understand long-form scripts, short-form scripts, visual prompts, and archive-connected resources.</span></article>
        <article><strong>Keep sources clear</strong><span>Separate original archive records from creator-facing adaptations so legends, folklore, and mysteries are not presented as proven claims.</span></article>
      </div>
    </section>
    <section class="scripts-section">
      <div class="section-head"><h2>Useful creator paths</h2><span>Quick links</span></div>
      <div class="script-resource-links">
        <a href="/scripts/">Free Mystery YouTube Scripts</a>
        <a href="/scripts/categories/">Browse Script Categories</a>
        <a href="/scripts/board/">Open the Library Board</a>
        <a href="/archive.html">Browse Original Archive Stories</a>
        <a href="/fiction-disclaimer.html">Story &amp; Source Notice</a>
      </div>
    </section>
    <section class="scripts-section script-board">
      <div>
        <p class="label">Adaptation note</p>
        <h2>Stories, scripts, and prompts have different jobs.</h2>
        <p>The Mystery Archive keeps the original reading record. The Creator Library turns selected material into production aids for narration, pacing, Shorts, image prompts, subtitles, and thumbnail planning.</p>
      </div>
      <div class="script-board-grid">
        <article><strong>Start with the source note</strong><span>Check whether a topic is folklore, modern retelling, internet legend, original work, or evidence-limited mystery before scripting it.</span></article>
        <article><strong>Adapt for your channel</strong><span>Treat each script as a structured draft. Adjust voice, pacing, scene order, and visual direction to match your format.</span></article>
        <article><strong>Avoid false certainty</strong><span>Frame legends and mysteries carefully, especially when a story has uncertain origins, disputed versions, or symbolic interpretation.</span></article>
      </div>
    </section>
  </main>`
  });
}

function renderScriptDetailPage(script) {
  const originalStory = stories.find((story) => story.slug === script.originalStorySlug);
  const relatedScripts = sortNewest(creatorScripts).filter((item) => item.slug !== script.slug).slice(0, 4);
  const canonicalPath = `/scripts/${script.slug}`;
  const usageNote = script.usageNote || 'This script is provided as a reference for video creators. You may adapt and edit it for your own video format. Credit to Kyunolab is appreciated when used as a source or inspiration. Please present the story as a mystery, legend, or fictional-style narration rather than a confirmed real event.';
  const storyArea = `${renderStorySummarySection(script, originalStory)}
      ${renderStoryInformationSection(script, originalStory)}`;
  const prepareArea = `${renderCreatorToolkitSection(script)}
      ${renderProductionWorkflowSection()}`;
  const createArea = `<section class="script-material creator-format creator-format-long">
        <h2>Long-form Creator</h2>
        ${renderLongFormCreator(script)}
      </section>
      <section class="script-material creator-format creator-format-short">
        <h2>Short-form Creator</h2>
        ${renderShortFormCreator(script)}
      </section>`;
  const finishArea = `${originalStory ? `<aside class="script-version-cta creator-original-story"><p class="rail-label">Original archive story</p><p>Read the original archive story.</p><a class="button" href="/stories/${escapeAttr(originalStory.slug)}">${escapeHtml(originalStory.title)}</a></aside>` : ''}
      <section class="script-material creator-reference">
        <h2>Reference</h2>
        <p>${escapeHtml(usageNote)}</p>
      </section>
      <section class="related-articles creator-reference-list" aria-label="Related scripts">
        <div class="section-head"><h2>Related Scripts</h2></div>
        <div class="related-grid">${relatedScripts.map(renderRelatedScriptLink).join('')}</div>
      </section>`;
  const content = `  <main class="script-detail-page article-shell article-layout">
    ${renderScriptsBoardLeftRail()}
    <article>
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/scripts/">Scripts Home</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(script.title)}</span></nav>
      <header class="archive-article-header">
        <p class="label">${escapeHtml(script.genre)}</p>
        <h1 class="article-title">${escapeHtml(script.title)}</h1>
        <p class="deck">${escapeHtml(script.deck)}</p>
        ${renderScriptMetaGrid(script)}
      </header>
      ${storyArea}
      ${prepareArea}
      ${createArea}
      ${finishArea}
    </article>
    <aside class="article-rail article-rail-right">
      ${renderKyunolabNetworkCard('scripts')}
      <div class="rail-card rail-feature"><p class="rail-label">Scripts Home</p><a href="/scripts/"><strong>Free Mystery YouTube Scripts</strong><span>Longform, Shorts, prompts, thumbnails</span></a></div>
      <div class="rail-card"><p class="rail-label">More scripts</p>${relatedScripts.map((item) => `<a href="/scripts/${escapeAttr(item.slug)}">${escapeHtml(item.title)}</a>`).join('')}</div>
    </aside>
  </main>`;
  return renderPage({
    canonicalPath,
    title: script.seoTitle || script.title,
    description: script.deck,
    metaDescription: script.metaDescription,
    networkSection: 'scripts',
    content
  });
}

function renderStorySummarySection(script, originalStory) {
  const subject = scriptMainSubject(script, originalStory);
  const motif = scriptCoreMotif(script);
  const setting = scriptSetting(script, originalStory);
  const mood = script.mood || 'Quiet, mysterious, source-aware';
  const sourceFrame = originalStory
    ? `Use the original archive record as the source reference, but keep factual claims, legendary motifs, and interpretive atmosphere clearly separated.`
    : `Treat the material as a source-aware mystery package, keeping factual claims, legendary motifs, and interpretive atmosphere clearly separated.`;

  return `<section class="script-material">
        <h2>Story Summary</h2>
        <p>${escapeHtml(script.logline || script.deck || `${subject} is prepared as a creator-ready mystery video topic.`)}</p>
        <p>${escapeHtml(`${subject} works as a video because it gives the creator a clear subject, a recognizable setting, and a central motif around ${motif}. The production should help viewers understand the main event, the background, and the emotional shape of the story before moving into platform-specific execution.`)}</p>
        <p>${escapeHtml(`${setting} should be presented with a ${mood.toLowerCase()} tone. ${sourceFrame}`)}</p>
      </section>`;
}

function renderStoryInformationSection(script, originalStory) {
  const info = [
    ['Genre', script.genre],
    ['Core Motif', scriptCoreMotif(script)],
    ['Main Subject', scriptMainSubject(script, originalStory)],
    ['Setting', scriptSetting(script, originalStory)],
    ['Mood', script.mood || 'Quiet, mysterious, source-aware'],
    ['Recommended Video Length', script.estimatedVideoLength],
    ['Difficulty', script.difficulty || 'Beginner-friendly production package']
  ];

  return `<section class="search-summary script-summary" aria-label="Story information">
        <h2>Story Information</h2>
        <dl>${info.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || 'Creator-ready mystery production')}</dd></div>`).join('')}</dl>
      </section>`;
}

function renderCreatorToolkitSection(script) {
  const toolkit = creatorToolkitData(script);
  return `<section class="script-material creator-toolkit" aria-label="Creator toolkit">
        <h2>Creator Toolkit</h2>
        <div class="creator-toolkit-grid">
          ${toolkit.map((item) => `<article>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.text)}</p>
            <div class="toolkit-terms">${item.terms.map((term) => `<code>${escapeHtml(term)}</code>`).join('')}</div>
          </article>`).join('')}
        </div>
      </section>`;
}

function generateSearchPage() {
  writeFile('search/index.html', renderPage({
    canonicalPath: '/search/',
    title: 'Search',
    description: 'Search Kyunolab Mystery Archive records or Creator Library pages.',
    metaDescription: 'Search Kyunolab Mystery Archive records or Creator Library pages.',
    robots: 'noindex, follow',
    networkSection: 'search',
    content: `  <main class="article-shell">
    <div class="archive-page-main search-page" data-search-page>
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">Search</span></nav>
      <p class="label">Site Search</p>
      <h1 class="article-title">Search Kyunolab</h1>
      <p class="deck" data-search-summary>Choose Archive or Creator Library, then enter a title, legend, category, motif, or keyword.</p>
      <form class="search-page-form" action="/search/" method="get" role="search" aria-label="Search Kyunolab">
        <label class="sr-only" for="search-page-type">Search target</label>
        <select id="search-page-type" name="type" class="site-search-select" data-search-type>
          <option value="archive">Archive</option>
          <option value="library">Creator Library</option>
        </select>
        <label class="sr-only" for="search-page-query">Search query</label>
        <input id="search-page-query" name="q" class="site-search-input" type="search" placeholder="Search stories, legends, and mysteries..." autocomplete="off" data-search-input>
        <button class="site-search-button" type="submit">SEARCH</button>
      </form>
      <section class="search-results-panel" aria-live="polite">
        <div class="section-head"><h2 data-search-heading>Search results</h2><span data-search-count></span></div>
        <div class="story-list" data-search-results></div>
      </section>
    </div>
  </main>`
  }));
}

function generateSearchIndexes() {
  const archiveIndex = stories.map((story) => ({
    id: story.id || story.slug,
    slug: story.slug,
    title: story.title,
    url: `/stories/${story.slug}`,
    category: story.category,
    summary: story.excerpt || story.introSummary || story.metaDescription || story.summaryAnswer || '',
    description: story.metaDescription || story.excerpt || '',
    tags: story.tags || [story.primaryTag || story.tag].filter(Boolean),
    motif: story.primaryTag || story.tag || '',
    topics: [
      story.storyType,
      story.sourceStatus,
      story.contentDNA?.canonicalQuery,
      story.contentDNA?.uniqueAngle,
      ...(story.contentDNA?.subjectSpecificVocabulary || [])
    ].filter(Boolean)
  }));

  const creatorIndex = creatorScripts.map((script) => ({
    id: script.id || script.slug,
    slug: script.slug,
    title: script.title,
    url: `/scripts/${script.slug}`,
    category: script.genre || script.contentType || 'Creator Library',
    scriptType: script.genre || script.contentType || 'Creator Library',
    summary: script.deck || script.logline || script.metaDescription || '',
    description: script.metaDescription || script.deck || '',
    tags: script.tags || [],
    motif: script.coreMotif || script.logline || '',
    topics: [
      script.genre,
      script.estimatedVideoLength,
      script.originalStorySlug,
      script.longformIncluded ? 'Long-form Creator' : '',
      script.shortsIncluded ? 'Short-form Creator' : '',
      script.imagePromptsIncluded ? 'Image Prompt' : '',
      script.thumbnailIdeasIncluded ? 'Thumbnail Ideas' : ''
    ].filter(Boolean)
  }));

  writeFile('data/archive-search-index.json', `${JSON.stringify(archiveIndex, null, 2)}\n`);
  writeFile('data/creator-library-search-index.json', `${JSON.stringify(creatorIndex, null, 2)}\n`);
}

function creatorToolkitData(script) {
  const motionText = (script.motionPrompts || []).length
    ? 'Optional motion can add gentle movement after the main Scene image is ready.'
    : 'Optional motion works best when it stays subtle and keeps the Scene image readable.';

  return [
    {
      title: 'Images',
      text: 'Create one clear visual for each Scene with any image tool you prefer.',
      terms: ['Example: GPT', 'Example: Midjourney', 'Example: Flux', 'Example: SDXL']
    },
    {
      title: 'Narration',
      text: 'Turn the Scene narration into a clear voice track using AI voice or a natural recording.',
      terms: ['Example: AI narration', 'Example: text to speech', 'Example: natural AI voice', 'Example: voice over']
    },
      {
        title: 'Background Music',
        text: 'Choose quiet music that supports the mood without covering the narration.',
        terms: ['Example: Dark Ambient', 'Example: Cinematic Drone', 'Example: Mystery Atmosphere', 'Example: Low Drone']
      },
    {
      title: 'Editing',
      text: 'Assemble the visuals, voice, and music in Scene order with your preferred editor.',
      terms: ['Example: CapCut', 'Example: DaVinci Resolve', 'Example: Premiere Pro', 'Example: video editor']
    },
    {
      title: 'Motion (Optional)',
      text: motionText,
      terms: ['Example: Motion Prompt', 'Example: image to video', 'Example: slow push-in', 'Example: subtle camera motion']
    }
  ];
}

function renderProductionWorkflowSection() {
  const steps = [
    ['①', 'Story', 'Read the Story Summary.'],
    ['②', 'Format', 'Choose Long-form or Short-form.'],
    ['③', 'Narration', 'Prepare the Scene narration.'],
    ['④', 'Image', 'Create images from the Image Prompts.'],
    ['⑤', 'Music', 'Choose music from the mood keywords.'],
    ['⑥', 'Voice', 'Prepare the voice track.'],
    ['⑦', 'Edit', 'Place the Scenes in order.'],
    ['⑧', 'Finish', 'Export the video.']
  ];

  return `<section class="script-material production-workflow" aria-label="Production workflow">
        <h2>Production Workflow</h2>
        <ol>
          ${steps.map(([number, label, text]) => `<li><span class="workflow-step-number" aria-hidden="true">${escapeHtml(number)}</span><div><strong>${escapeHtml(label)}</strong><p>${escapeHtml(text)}</p></div></li>`).join('')}
        </ol>
        <aside class="workflow-tip">
          <strong>Small production note</strong>
          <p>You do not need to make the first version perfect. Finishing the first video from beginning to end matters most.</p>
        </aside>
      </section>`;
}

function renderLongFormCreator(script) {
  const prompts = script.visualGuide || (script.imagePrompts || []).map((prompt, index) => ({
    aiImagePrompt: prompt,
    directionTip: index === 0 ? 'Open with atmosphere before revealing the central mystery.' : 'Keep the image quiet, readable, and useful for narration pacing.'
  }));
  const sceneCount = Math.max(prompts.length, 1);
  const narrationScenes = distributeByScene(script.longformScript || [], sceneCount);
  const sceneCards = Array.from({ length: sceneCount }, (_, index) => {
    const item = prompts[index] || {};
    const narrationParts = narrationScenes[index].filter(Boolean);
    const narration = narrationParts.join('\n\n');
    return renderProductionSceneCard({
      number: index + 1,
      duration: sceneEstimatedDuration(script, sceneCount, index, 'long'),
      narration,
      narrationParts: narrationPartsForScene(narrationParts, index, 'long'),
      format: 'long',
      imagePrompt: item.aiImagePrompt || item.prompt || '',
      sceneFocus: sceneFocusForScene({
        script,
        index,
        format: 'long',
        narration,
        imagePrompt: item.aiImagePrompt || item.prompt || ''
      }),
      music: recommendedBackgroundMusic(script, 'long'),
      visualDirection: visualDirection(index, 'long'),
      advanced: advancedProductionInfo({
        script,
        number: index + 1,
        format: 'long',
        narration,
        imagePrompt: item.aiImagePrompt || item.prompt || ''
      })
    });
  }).join('');

  return `${renderNarrationCopyAction('long', 'Copy Full Long-form Narration')}<div class="script-prompt-list" data-narration-format="long">${sceneCards}</div>`;
}

function renderShortFormCreator(script) {
  const sceneCount = Math.max((script.shortsScript || []).length, 1);
  const promptScenes = distributeByScene(script.imagePrompts || [], sceneCount);
  const sceneCards = Array.from({ length: sceneCount }, (_, index) => {
    const narration = (script.shortsScript || [])[index] || '';
    return renderProductionSceneCard({
      number: index + 1,
      duration: sceneEstimatedDuration(script, sceneCount, index, 'short'),
      narration,
      narrationParts: shouldUseNarrationParts(narration, 'short') ? narrationPartsForScene([narration], index, 'short') : [],
      format: 'short',
      imagePrompt: promptScenes[index].join(' '),
      sceneFocus: sceneFocusForScene({
        script,
        index,
        format: 'short',
        narration,
        imagePrompt: promptScenes[index].join(' ')
      }),
      music: recommendedBackgroundMusic(script, 'short'),
      visualDirection: visualDirection(index, 'short'),
      advanced: advancedProductionInfo({
        script,
        number: index + 1,
        format: 'short',
        narration,
        imagePrompt: promptScenes[index].join(' ')
      })
    });
  }).join('');

  return `${renderNarrationCopyAction('short', 'Copy Full Short-form Narration')}<div class="script-prompt-list" data-narration-format="short">${sceneCards}</div>`;
}

function renderNarrationCopyAction(format, label) {
  return `<div class="narration-copy-action"><button class="narration-copy-button" type="button" data-narration-target="${escapeAttr(format)}">${escapeHtml(label)}</button></div>`;
}

function renderProductionSceneCard({ number, duration, narration, narrationParts = [], format, sceneFocus, imagePrompt, music, visualDirection: direction, advanced }) {
  const advancedId = sceneAdvancedId(number, duration, narration, imagePrompt);
  const sceneRole = sceneRoleForScene(number - 1, narration, sceneFocus);
  const narrationHtml = narrationParts.length
    ? renderNarrationParts(narration, narrationParts)
    : renderPlainNarration(narration, number - 1, format);
  return `<article class="scene-workspace">
          <h3>Scene ${number}</h3>
          <div class="scene-workspace-meta">
            <p><strong>Scene Role:</strong> ${escapeHtml(sceneRole)}</p>
            <p><strong>Estimated Playback Time:</strong> ${escapeHtml(duration)}</p>
          </div>
          ${narrationHtml}
          <div class="scene-production-fields">
            <p class="scene-field scene-focus"><strong>Scene Focus:</strong> ${escapeHtml(sceneFocus || 'A clear, readable moment from the story.')}</p>
            <p class="scene-field scene-image-prompt"><strong>Image Prompt:</strong> ${escapeHtml(imagePrompt || 'A quiet mystery scene shows one clear subject in a readable space, with soft low-key lighting and a restrained documentary feeling. The image should feel realistic, calm, and slightly unsettling without gore or exaggerated horror.')}</p>
            <p class="scene-field scene-music"><strong>Recommended Background Music:</strong> ${escapeHtml(music)}</p>
            <p class="scene-field scene-editing-guide"><strong>Editing Guide:</strong> ${escapeHtml(direction)}</p>
          </div>
          ${renderAdvancedProductionPanel(advancedId, advanced)}
        </article>`;
}

function renderPlainNarration(narration, sceneIndex, format) {
  const text = narration || 'Use a short, complete narration line that can be read directly in the video.';
  return `<div class="scene-narration-single">
            <p class="scene-narration"><strong>Narration:</strong> ${escapeHtml(text)}</p>
            <p class="narration-part-voice"><strong>Voice Direction:</strong> ${escapeHtml(voiceDirectionForNarrationPart(sceneIndex, 0, format, text))}</p>
            <p class="narration-part-time"><strong>Estimated Reading Time:</strong> ${escapeHtml(estimatedReadingTime(text))}</p>
          </div>`;
}

function renderNarrationParts(narration, parts) {
  const copyText = narration || parts.map((part) => part.narration).join('\n\n');
  return `<div class="scene-narration-parts">
            <p class="scene-narration scene-narration-copy-source" hidden><strong>Narration:</strong> ${escapeHtml(copyText)}</p>
            ${parts.map((part, index) => `<section class="narration-part">
              <h4>Narration Part ${index + 1}</h4>
              <p class="narration-part-script"><strong>Narration:</strong> ${escapeHtml(part.narration)}</p>
              <p class="narration-part-voice"><strong>Voice Direction:</strong> ${escapeHtml(part.voiceDirection)}</p>
              <p class="narration-part-time"><strong>Estimated Reading Time:</strong> ${escapeHtml(part.readingTime)}</p>
            </section>`).join('')}
          </div>`;
}

function narrationPartsForScene(parts, sceneIndex, format) {
  return parts
    .flatMap((part) => splitNarrationPart(part))
    .filter(Boolean)
    .map((narration, partIndex) => ({
      narration,
      readingTime: estimatedReadingTime(narration),
      voiceDirection: voiceDirectionForNarrationPart(sceneIndex, partIndex, format, narration)
    }));
}

function splitNarrationPart(part) {
  const text = String(part || '').trim();
  if (!text) return [];

  const sentenceCount = countSentences(text);
  if (sentenceCount <= 4) return [text];

  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (paragraphs.length <= 1) return splitLongParagraph(text);

  const blocks = [];
  let current = '';
  let currentCount = 0;

  paragraphs.forEach((paragraph) => {
    const paragraphCount = countSentences(paragraph);
    if (!current) {
      current = paragraph;
      currentCount = paragraphCount;
      return;
    }

    if (currentCount < 2 || currentCount + paragraphCount <= 4) {
      current = `${current}\n\n${paragraph}`;
      currentCount += paragraphCount;
      return;
    }

    blocks.push(current);
    current = paragraph;
    currentCount = paragraphCount;
  });

  if (current) blocks.push(current);
  return blocks.flatMap((block) => countSentences(block) > 4 ? splitLongParagraph(block) : [block]);
}

function splitLongParagraph(paragraph) {
  const sentences = paragraph.match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) || [];
  if (sentences.length <= 4) return [paragraph];

  const blocks = [];
  for (let index = 0; index < sentences.length; index += 3) {
    blocks.push(sentences.slice(index, index + 3).join(' '));
  }
  return blocks;
}

function countSentences(text) {
  return text.match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean).length || 0;
}

function shouldUseNarrationParts(narration, format) {
  if (format !== 'short') return true;
  const wordCount = String(narration || '').trim().split(/\s+/).filter(Boolean).length;
  return wordCount >= 55;
}

function sceneRoleForScene(sceneIndex, narration, sceneFocus) {
  const text = `${narration || ''} ${sceneFocus || ''}`.toLowerCase();
  if (sceneIndex === 0) return 'Hook';
  if (/origin|legend|folklore|tradition|version|people shared|online/.test(text)) return 'Introduce the Story';
  if (/why|question|doubt|uncertain|does not|not always|wrong enough/.test(text)) return 'Build Suspense';
  if (/evidence|record|photo|image|body|lights|ticket|road|hallway|visible/.test(text)) return 'Present Evidence';
  if (/fear|tension|danger|closer|empty|lost|vanish|impossible/.test(text)) return 'Increase Tension';
  if (/reveal|mystery|truth|answer|meaning|symbol|final/.test(text)) return 'Reveal the Mystery';
  if (/ending|in the end|keeps going|nothing moves|quiet again/.test(text)) return 'Closing Reflection';

  const fallback = ['Build Suspense', 'Present Evidence', 'Increase Tension', 'Leave a Final Question'];
  return fallback[sceneIndex % fallback.length];
}

function estimatedReadingTime(narration) {
  const wordCount = String(narration || '').trim().split(/\s+/).filter(Boolean).length;
  const seconds = Math.max(8, Math.round(wordCount / 2.35));
  return `≈ ${seconds} sec`;
}

function voiceDirectionForNarrationPart(sceneIndex, partIndex, format, narration) {
  const directions = format === 'short'
    ? ['Clear, Natural, Steady Pace', 'Quiet, Direct, Slight Tension', 'Calm, Concise, Soft Ending']
    : [
        'Calm, Documentary, Slow Pace',
        'Quiet, Natural, Short Pauses',
        'Slight Tension, Steady Delivery',
        'Calm, Emphasize Final Sentence',
        'Natural, Reflective, Soft Ending',
        'Documentary, Quiet, Soft Ending'
      ];
  const offset = sceneIndex % 2;
  const direction = directions[(partIndex + offset) % directions.length];

  if (/ending|nothing moves|keeps going/i.test(narration)) {
    return 'Quiet, Reflective, Soft Ending';
  }
  return direction;
}

function renderAdvancedProductionPanel(id, advanced) {
  const items = [
    ['Motion Prompt', advanced.motionPrompt],
    ['Sound Effect', advanced.soundEffect],
    ['Voice Direction', advanced.voiceDirection],
    ['Camera and Motion Notes', advanced.cameraNotes],
    ['Transition and Color Notes', advanced.transitionNotes],
    ['Negative Prompt', advanced.negativePrompt]
  ].filter(([, value]) => Boolean(value));

  if (!items.length) return '';

  return `<div class="scene-advanced">
            <button class="scene-advanced-toggle" type="button" aria-expanded="false" aria-controls="${id}">Show Advanced Production Info</button>
            <div class="scene-advanced-panel" id="${id}" hidden>
              ${items.map(([label, value]) => `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`).join('')}
            </div>
          </div>`;
}

function sceneAdvancedId(number, duration, narration, imagePrompt) {
  const raw = `${duration}-${narration}-${imagePrompt}`.toLowerCase();
  const slug = raw.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 36) || 'production';
  return `advanced-scene-${number}-${slug}`;
}

function sceneEstimatedDuration(script, sceneCount, index, format) {
  if (format === 'short') {
    const shortDurations = ['5-7 seconds', '6-8 seconds', '7-9 seconds', '6-8 seconds', '5-7 seconds'];
    return shortDurations[index] || '5-8 seconds';
  }

  const match = String(script.estimatedVideoLength || '').match(/(\d+)\s*-\s*(\d+)\s*minutes?/i);
  if (match) {
    const min = Math.max(1, Math.floor(Number(match[1]) / sceneCount));
    const max = Math.max(min + 1, Math.ceil(Number(match[2]) / sceneCount));
    return `${min}-${max} minutes`;
  }
  return '2-4 minutes';
}

function recommendedBackgroundMusic(script, format) {
  const haystack = `${script.genre || ''} ${script.title || ''} ${script.deck || ''} ${(script.tags || []).join(' ')}`.toLowerCase();
  if (/backrooms|internet|liminal|digital/.test(haystack)) {
    return format === 'short'
      ? 'Low Drone, Digital Hum, Mystery Atmosphere'
      : 'Dark Ambient, Low Drone, Liminal Space Atmosphere';
  }
  if (/dragon|myth|mythology|creature/.test(haystack)) {
    return format === 'short'
      ? 'Epic Mystery Pulse, Low Drums, Ancient Atmosphere'
      : 'Mythic Ambient, Low Drums, Cinematic Mystery';
  }
  if (/road|roadside|ghost|woman in white|urban legend/.test(haystack)) {
    return format === 'short'
      ? 'Suspense Piano, Low Drone, Dark Ambient'
      : 'Dark Ambient, Suspense Piano, Mystery Atmosphere';
  }
  return format === 'short'
    ? 'Low Drone, Suspense Pulse, Mystery Atmosphere'
    : 'Dark Ambient, Suspense Piano, Low Drone, Mystery Atmosphere';
}

function sceneFocusForScene({ script, index, format, narration, imagePrompt }) {
  const context = `${script.title || ''} ${script.genre || ''} ${script.deck || ''} ${(script.tags || []).join(' ')} ${narration || ''} ${imagePrompt || ''}`.toLowerCase();
  const isShort = format === 'short';

  if (/woman in white|roadside|dark road|driver|passenger|headlight/.test(context)) {
    const focuses = [
      'The viewer should notice the lonely figure before the legend feels supernatural.',
      'The audience should feel the car becoming too quiet.',
      'The empty seat should turn a simple ride into an impossible absence.',
      'The road should feel ordinary again, which makes the disappearance harder to explain.'
    ];
    return focuses[index] || 'The viewer should feel that the roadside encounter has left something missing.';
  }
  if (/cursed image|cursed images|blurry|strange object/.test(context)) {
    const focuses = [
      'The viewer should notice one ordinary detail that feels wrong.',
      'The image should make the audience search for missing context.',
      'The Scene should leave enough visual space for the viewer to invent the story.',
      'The final image should linger because it refuses to explain itself.'
    ];
    return focuses[index] || 'The audience should feel that a normal image is hiding an unfinished story.';
  }
  if (/backrooms|liminal|yellow walls|fluorescent|hallway|corridor/.test(context)) {
    const focuses = [
      'The viewer should recognize the room before feeling trapped by it.',
      'The hallway should make the audience question where the exit went.',
      'The Scene should make a familiar interior feel impossible to leave.',
      'The stillness should make the space feel larger than the frame.'
    ];
    return focuses[index] || 'The audience should feel that the empty space continues beyond what they can see.';
  }
  if (/dragon|myth|mythology|serpent|cloud|river|temple/.test(context)) {
    const focuses = [
      'The viewer should understand that different dragons carry different meanings.',
      'The Scene should connect the dragon image to stone, storm, or sacred power.',
      'The audience should read the dragon as a symbol of weather, water, danger, or order.',
      'The creature should feel like a cultural symbol, not just a monster.'
    ];
    return focuses[index] || 'The viewer should see the dragon as a sign of power shaped by culture.';
  }

  return isShort
    ? 'The viewer should understand the short-form beat immediately.'
    : 'The Scene should give the audience one clear emotional idea to follow.';
}

function visualDirection(index, format) {
  if (format === 'short') {
    const shortDirections = [
      'Hold the opening frame for one second. Begin a slow zoom. Cut when the narration ends.',
      'Fade in quickly. Keep the image steady. Push in slowly through the final words.',
      'Hold the shot while the line plays. Add a gentle side pan. Cut after the last word.',
      'Fade in from black. Keep the frame still. Cut immediately on the final word.',
      'Start with a slow zoom. Hold briefly after the narration. Fade to black.'
    ];
    return shortDirections[index] || 'Hold the image steady during the narration. Fade out after the final word.';
  }

  const longDirections = [
    'Hold the opening frame for two seconds. Begin a slow zoom. Fade before the final narration beat.',
    'Start with a steady frame. Pan slowly toward the main subject. Cut gently after the narration settles.',
    'Hold the final image slightly longer. Begin a slow zoom. Fade out after the last line.'
  ];
  return longDirections[index] || 'Start with a steady frame. Slow zoom through the narration. Fade to the next Scene.';
}

function advancedProductionInfo({ script, number, format, narration, imagePrompt }) {
  const context = `${script.title || ''} ${script.genre || ''} ${script.deck || ''} ${(script.tags || []).join(' ')} ${narration || ''} ${imagePrompt || ''}`.toLowerCase();
  const prompt = imagePrompt || 'A quiet mystery scene shows one clear subject in a readable space, with soft low-key lighting and a restrained documentary feeling.';
  return {
    motionPrompt: motionPromptForScene(prompt, context, format),
    soundEffect: soundEffectForScene(context),
    voiceDirection: voiceDirectionForScene(context, number, format),
    cameraNotes: cameraNotesForScene(context, number, format),
    transitionNotes: transitionNotesForScene(context, number, format),
    negativePrompt: negativePromptForScene(context)
  };
}

function motionPromptForScene(imagePrompt, context, format) {
  const cameraMove = format === 'short' ? 'a slow push-in with steady vertical framing' : 'a slow cinematic push-in with gentle atmospheric movement';
  if (/\broad\b|roadside|\bcar\b|driver|headlight|traffic|woman in white|ghost/.test(context)) {
    return `${imagePrompt}. Add subtle drifting fog, faint headlight movement, and ${cameraMove}. Keep the motion quiet, realistic, and suspenseful.`;
  }
  if (/backrooms|liminal|hallway|corridor|fluorescent|room/.test(context)) {
    return `${imagePrompt}. Let the fluorescent lights flicker softly, add a barely noticeable handheld drift, and move the camera slowly forward through the empty space.`;
  }
  if (/dragon|myth|mythology|serpent|storm|cloud|mountain/.test(context)) {
    return `${imagePrompt}. Add slow cloud movement, gentle scale or silhouette motion, and a smooth camera drift that makes the scene feel ancient and cinematic.`;
  }
  return `${imagePrompt}. Add restrained environmental movement and ${cameraMove}. Keep the subject readable and the atmosphere mysterious.`;
}

function soundEffectForScene(context) {
  if (/\broad\b|roadside|\bcar\b|driver|headlight|traffic|woman in white|ghost/.test(context)) {
    return 'distant wind, traffic ambience at night, soft tire noise on wet pavement';
  }
  if (/backrooms|liminal|hallway|corridor|fluorescent|room/.test(context)) {
    return 'low mechanical hum, fluorescent light buzz, distant room tone';
  }
  if (/dragon|myth|mythology|serpent|storm|cloud|mountain/.test(context)) {
    return 'low wind over mountains, distant thunder, deep cinematic rumble';
  }
  if (/door|house|room|empty|silence/.test(context)) {
    return 'room tone, distant wind, subtle floor creak';
  }
  return '';
}

function voiceDirectionForScene(context, number, format) {
  const pace = format === 'short' ? 'short, clear, and direct' : 'slowly, with enough space between sentences';
  if (/woman in white|ghost|road|roadside/.test(context)) {
    return `Read in a quiet, restrained, suspenseful voice, ${pace}. Leave a short pause after visual words such as "white", "empty", and "road".`;
  }
  if (/backrooms|liminal|empty|silence/.test(context)) {
    return `Read in a low, dry, controlled voice, ${pace}. Pause briefly around words such as "empty", "forever", and "ordinary".`;
  }
  if (/dragon|myth|mythology|ancient/.test(context)) {
    return `Use a calm documentary tone, ${pace}. Avoid exaggerating cultures or symbols, and only lightly emphasize the key words.`;
  }
  return `${number === 1 ? 'Start calmly' : 'Read with a slightly more focused tone than the previous scene'}. Keep the delivery ${pace}. Pause briefly after important nouns.`;
}

function cameraNotesForScene(context, number, format) {
  if (/backrooms|hallway|corridor/.test(context)) {
    return 'slow push-in: move very slowly into the scene. subtle handheld movement: add only a small natural camera drift.';
  }
  if (/dragon|myth|cloud|mountain|serpent/.test(context)) {
    return 'gentle pan from left to right: reveal the scene slowly across the frame. slow push-in: move gradually toward the symbolic subject.';
  }
  if (/\broad\b|roadside|\bcar\b|headlight/.test(context)) {
    return 'static frame with slight zoom: keep the frame steady and zoom in very slightly. If needed, use a gentle pan from left to right.';
  }
  return format === 'short'
    ? 'static frame with slight zoom: keep the frame stable and zoom in only a little.'
    : 'slow push-in: move slowly toward the center of the scene while keeping the mood restrained.';
}

function transitionNotesForScene(context, number, format) {
  const color = /backrooms|liminal|digital/.test(context)
    ? 'Keep the yellow light, but lower the saturation and make the image feel colder.'
    : /dragon|myth|mythology/.test(context)
      ? 'Use dark gold, muted blue, and low-saturation ancient tones.'
      : 'Use cool blue tones and low saturation to keep the night atmosphere.';
  if (format === 'short') {
    return `Use a short fade transition. ${color}`;
  }
  return number === 1
    ? `Start with a slow fade in. ${color}`
    : `Use a short fade from the previous Scene. ${color}`;
}

function negativePromptForScene(context) {
  const negatives = new Set();
  if (/person|woman|figure|driver|passenger|body|face/.test(context)) {
    ['distorted anatomy', 'extra limbs', 'deformed face'].forEach((item) => negatives.add(item));
  }
  if (/dragon|creature|serpent/.test(context)) {
    ['cartoon style', 'toy-like creature', 'distorted anatomy'].forEach((item) => negatives.add(item));
  }
  if (/text|sign|subtitle|document|panel/.test(context)) {
    ['unreadable text', 'random letters', 'duplicated objects'].forEach((item) => negatives.add(item));
  }
  if (/night|low-key|dark|shadow|fluorescent|lighting/.test(context)) {
    ['oversaturated colors', 'inconsistent lighting'].forEach((item) => negatives.add(item));
  }
  return Array.from(negatives).join(', ');
}

function scriptCoreMotif(script) {
  const genericTags = new Set(['youtube script', 'shorts script', 'image prompt', 'mystery script']);
  const tags = (script.tags || [])
    .filter((tag) => !genericTags.has(String(tag).toLowerCase()))
    .map((tag) => String(tag).replace(/\s+script$/i, '').trim())
    .filter(Boolean)
    .slice(0, 2);
  if (tags.length) {
    return tags.join(', ');
  }
  return script.logline || script.deck || 'A mystery motif adapted for video production';
}

function scriptMainSubject(script, originalStory) {
  if (originalStory && originalStory.title) {
    return originalStory.title;
  }
  return (script.title || 'Creator Library topic')
    .replace(/\s+YouTube Script$/i, '')
    .replace(/^The\s+/, 'The ');
}

function scriptSetting(script, originalStory) {
  const haystack = `${script.title || ''} ${script.deck || ''} ${(script.tags || []).join(' ')}`.toLowerCase();
  if (/road|roadside|driver|car/.test(haystack)) return 'Roadside legend setting';
  if (/backrooms|liminal|room|hallway|digital|internet/.test(haystack)) return 'Digital folklore and liminal-space setting';
  if (/dragon|myth|mythology|creature/.test(haystack)) return 'Mythology and comparative folklore setting';
  if (originalStory && originalStory.category) return originalStory.category;
  return 'Mystery archive setting';
}

function distributeByScene(items, sceneCount) {
  const scenes = Array.from({ length: sceneCount }, () => []);
  if (!Array.isArray(items) || !items.length) {
    return scenes;
  }
  items.forEach((item, index) => {
    const sceneIndex = Math.min(Math.floor(index * sceneCount / items.length), sceneCount - 1);
    scenes[sceneIndex].push(item);
  });
  return scenes;
}

function renderRelatedScriptLink(script) {
  return `<a href="/scripts/${escapeAttr(script.slug)}"><span>${escapeHtml([script.genre, script.estimatedVideoLength].filter(Boolean).join(' - '))}</span><strong>${escapeHtml(script.title)}</strong></a>`;
}

function renderScriptCard(script) {
  return `<article class="script-card">
        <p class="rail-label">${escapeHtml(script.genre)}</p>
        <h3><a href="/scripts/${escapeAttr(script.slug)}">${escapeHtml(script.title)}</a></h3>
        <p>${escapeHtml(script.deck)}</p>
        ${renderScriptBadges(script)}
      </article>`;
}

function renderFeaturedScript(script) {
  if (!script) {
    return `<article class="feature-card"><span class="pill">Featured Script</span><h2>Creator-ready mystery scripts</h2><p>Longform narration, Shorts hooks, image prompts, thumbnail ideas, and subtitle lines for mystery video planning.</p><div class="meta">Creator Library</div></article>`;
  }
  return `<article class="feature-card"><span class="pill">Featured Script</span><h2><a href="/scripts/${escapeAttr(script.slug)}">${escapeHtml(script.title)}</a></h2><p>${escapeHtml(script.deck || '')}</p><div class="meta">${escapeHtml([script.genre, script.estimatedVideoLength, scriptFeatureSummary(script)].filter(Boolean).join(' - '))}</div></article>`;
}

function renderScriptRow(script) {
  return `<article class="script-row">
        <div><span class="tag">${escapeHtml(script.genre)}</span><h3><a href="/scripts/${escapeAttr(script.slug)}">${escapeHtml(script.title)}</a></h3></div>
        <p>${escapeHtml(script.deck)}</p>
        <div class="meta">${escapeHtml([script.estimatedVideoLength, scriptFeatureSummary(script)].filter(Boolean).join(' - '))}</div>
      </article>`;
}

function renderScriptGenreCard(group) {
  return `<article class="script-genre-card">
        <h3>${escapeHtml(group.genre)}</h3>
        <p>${group.items.length} script package${group.items.length === 1 ? '' : 's'} available.</p>
        <div class="category-links">${group.items.slice(0, 3).map((script) => `<a href="/scripts/${escapeAttr(script.slug)}">${escapeHtml(script.title)}</a>`).join('')}</div>
      </article>`;
}

function renderCreatorCategoryCard(category) {
  const categoryPath = `/scripts/categories/${escapeAttr(category.slug)}/`;
  const planningLinks = creatorCategoryPlanningLinks(category).map((label) => `<a href="${categoryPath}">${escapeHtml(label)}</a>`).join('');
  return `      <article>
        <p class="category-group-label">${escapeHtml(category.group)}</p>
        <h3><a href="${categoryPath}">${escapeHtml(category.title)}</a></h3>
        <p>${escapeHtml(creatorCategoryDescription(category))}</p>
        <div class="category-links">${planningLinks}</div>
        <a class="text-link" href="${categoryPath}">Open ${escapeHtml(category.title)} creator page</a>
      </article>`;
}

function creatorCategoryPlanningLinks(category) {
  const labels = {
    'urban-legends': ['Longform legend scripts', 'Shorts warning hooks', 'Roadside thumbnail ideas'],
    'internet-folklore': ['Creepypasta explainers', 'Forum myth Shorts', 'Digital unease prompts'],
    'strange-places': ['Location scripts', 'Map mystery hooks', 'Atmosphere prompts'],
    'unexplained-mysteries': ['Evidence-limited scripts', 'Careful claim framing', 'Question-led hooks'],
    'classic-folklore': ['Folklore explainers', 'Tradition notes', 'Retelling prompts'],
    'modern-legends': ['Modern rumor scripts', 'Social memory hooks', 'Contemporary legend angles'],
    myths: ['Myth explainers', 'Symbolic story arcs', 'Respectful narration plans'],
    'mythic-creatures': ['Creature profiles', 'Origin comparison scripts', 'Visual creature prompts'],
    'lost-worlds': ['Lost realm scripts', 'Hidden city hooks', 'Worldbuilding prompts'],
    'strange-nature': ['Nature mystery scripts', 'Landscape hooks', 'Atmospheric visual prompts'],
    'legendary-places': ['Place-based scripts', 'Sacred location notes', 'Travel-mystery hooks'],
    'mythic-objects': ['Object legend scripts', 'Relic hooks', 'Symbolic thumbnail ideas']
  };
  return labels[category.slug] || ['Longform scripts', 'Shorts hooks', 'Image prompts'];
}

function creatorCategoryDescription(category) {
  const descriptions = {
    'urban-legends': 'Roadside legends, warning stories, neighborhood rumors, and modern folklore shaped into video-ready hooks and narration arcs.',
    'internet-folklore': 'Digital legends, liminal spaces, cursed images, forum myths, and online unease prepared for explainers, Shorts, and visual prompts.',
    'strange-places': 'Haunted roads, impossible rooms, vanished locations, and map-based mysteries organized for atmosphere, pacing, and scene planning.',
    'unexplained-mysteries': 'Evidence-limited mysteries and unresolved questions framed carefully for search-friendly videos without overstating the record.',
    'classic-folklore': 'Older motifs, oral traditions, folk beliefs, and inherited warnings adapted into clear creator research paths.',
    'modern-legends': 'Recent rumor cycles, sightings, social memory, and contemporary legend patterns shaped for documentary-style narration.',
    'myths': 'Mythic stories, sacred narratives, heroes, gods, and symbolic traditions planned for respectful longform explanation.',
    'mythic-creatures': 'Dragons, giants, sea beings, spirits, forest figures, and legendary creatures organized by origin, meaning, and visual direction.',
    'lost-worlds': 'Hidden cities, vanished islands, impossible geography, and lost realms prepared for mystery videos and worldbuilding explainers.',
    'strange-nature': 'Sky omens, unusual forests, sea phenomena, strange plants, and landscape folklore arranged for atmospheric creator use.',
    'legendary-places': 'Named mountains, lakes, ruins, temples, and sacred places shaped into location-focused mystery scripts.',
    'mythic-objects': 'Swords, bells, mirrors, books, charms, relics, and symbolic objects prepared as compact video concepts.'
  };
  return descriptions[category.slug] || `${category.title} creator materials for mystery scripts, Shorts hooks, image prompts, thumbnail ideas, and video planning.`;
}

function renderScriptMetaGrid(script) {
  return `<dl class="article-meta-grid script-meta-grid">
          <div><dt>Genre</dt><dd>${escapeHtml(script.genre)}</dd></div>
          <div><dt>Estimated video length</dt><dd>${escapeHtml(script.estimatedVideoLength)}</dd></div>
          <div><dt>Longform script included</dt><dd>${yesNo(script.longformIncluded)}</dd></div>
          <div><dt>Shorts script included</dt><dd>${yesNo(script.shortsIncluded)}</dd></div>
          <div><dt>Image prompts included</dt><dd>${yesNo(script.imagePromptsIncluded)}</dd></div>
          <div><dt>Thumbnail ideas included</dt><dd>${yesNo(script.thumbnailIdeasIncluded)}</dd></div>
        </dl>`;
}

function renderScriptBadges(script) {
  const badges = [
    ['Video length', script.estimatedVideoLength],
    ['Longform', script.longformIncluded ? 'included' : 'not included'],
    ['Shorts', script.shortsIncluded ? 'included' : 'not included'],
    ['Image prompts', script.imagePromptsIncluded ? 'included' : 'not included'],
    ['Thumbnail ideas', script.thumbnailIdeasIncluded ? 'included' : 'not included']
  ];
  return `<dl class="script-badges">${badges.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>`;
}

function groupScriptsByGenre(scripts) {
  const groups = new Map();
  for (const script of scripts) {
    const genre = script.genre || 'Mystery Script';
    if (!groups.has(genre)) groups.set(genre, []);
    groups.get(genre).push(script);
  }
  return Array.from(groups, ([genre, items]) => ({ genre, items }));
}

function scriptsForCreatorCategory(category, scripts) {
  const categoryTerms = new Set([
    category.slug,
    category.title.toLowerCase(),
    category.title.toLowerCase().replace(/\s+/g, '-')
  ]);
  const categoryStories = stories.filter((story) => story.categorySlug === category.slug);
  const storySlugs = new Set(categoryStories.map((story) => story.slug));
  return sortNewest(scripts).filter((script) => {
    const haystack = [
      script.genre,
      script.title,
      script.deck,
      ...(script.tags || [])
    ].filter(Boolean).join(' ').toLowerCase();
    return storySlugs.has(script.originalStorySlug) || Array.from(categoryTerms).some((term) => haystack.includes(term));
  });
}

function scriptFeatureSummary(script) {
  return [
    script.longformIncluded ? 'longform script' : '',
    script.shortsIncluded ? 'Shorts script' : '',
    script.imagePromptsIncluded ? 'image prompts' : '',
    script.thumbnailIdeasIncluded ? 'thumbnail ideas' : ''
  ].filter(Boolean).join(', ');
}

function yesNo(value) {
  return value ? 'Yes' : 'No';
}

function renderFeaturedStory(story) {
  return `<article class="feature-card"><span class="pill">Featured Record</span><h2><a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a></h2><p>${escapeHtml(story.excerpt || story.metaDescription || '')}</p><div class="meta">${escapeHtml([story.category, story.readTime, story.tag].filter(Boolean).join(' - '))}</div></article>`;
}

function renderRankingItem(story) {
  return `<li><a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a><span>${escapeHtml([story.category, story.tag].filter(Boolean).join(' - '))}</span></li>`;
}

function renderEssentialStory(story) {
  return `<a href="/stories/${escapeAttr(story.slug)}"><span>${escapeHtml(story.category)}</span><strong>${escapeHtml(story.title)}</strong></a>`;
}

function renderHomeCategoryGroup(group) {
  return `<div class="home-category-group"><p class="label">${escapeHtml(group.label)}</p><div class="category-grid category-hub category-hub-compact">${group.categories.map(renderHomeCategoryCard).join('')}</div></div>`;
}

function renderHomeCategoryCard(category) {
  const categoryStories = stories.filter((story) => story.categorySlug === category.slug).slice(0, 3);
  return `      <article>
        <p class="category-group-label">${escapeHtml(category.group)}</p>
        <h3><a href="/categories/${escapeAttr(category.slug)}.html">${escapeHtml(category.title)}</a></h3>
        <p>${escapeHtml(category.description)}</p>
        <div class="category-links">${categoryStories.map(renderCategoryStoryLink).join('')}</div>
        <a class="text-link" href="/categories/${escapeAttr(category.slug)}.html">Open ${escapeHtml(category.title)} Category</a>
      </article>`;
}

function renderHomeRail({ featuredStory, popularStories, essentialStories }) {
  const popular = popularStories.slice(0, 3);
  const essentials = essentialStories.slice(0, 3);
  return `<aside class="home-rail" aria-label="Homepage reader paths">
      ${renderKyunolabNetworkCard('archive')}
      <div class="rail-card rail-feature"><p class="rail-label">Start here</p><a href="#essential-reads"><span>First visit</span><strong>Begin with essential reads, then follow the archive path that fits your question.</strong></a></div>
      <div class="rail-card"><p class="rail-label">Popular records</p>${popular.map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}</div>
      <div class="rail-card"><p class="rail-label">Essential reads</p>${essentials.map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}</div>
    </aside>`;
}

function renderHomeLeftRail() {
  return `<aside class="home-left-rail article-rail article-rail-left" aria-label="Homepage archive navigation">
      <div class="rail-card"><p class="rail-label">Reader Paths</p><a href="/newest.html">Newest Records</a><a href="/popular.html">Popular Records</a><a href="/categories.html">Browse Categories</a><a href="/mystery-board.html">Mystery Board</a></div>
      <div class="rail-card rail-card-subtle"><p class="rail-label">Archive Shelves</p><a href="/categories/urban-legends.html">Urban Legends</a><a href="/categories/internet-folklore.html">Internet Folklore</a><a href="/categories/myths.html">Myths</a><a href="/categories/strange-places.html">Strange Places</a></div>
      <div class="rail-card"><p class="rail-label">Source Guide</p><a href="/fiction-disclaimer.html">Story &amp; Source Notice</a><a href="/about.html">About Kyunolab</a></div>
    </aside>`;
}

function renderScriptsLeftRail() {
  return `<aside class="home-left-rail article-rail article-rail-left" aria-label="Creator Library navigation">
      <div class="rail-card"><p class="rail-label">Creator Paths</p><a href="/scripts/">Creator Home</a><a href="/scripts/categories/">Script Categories</a><a href="/scripts/board/">Library Board</a><a href="/scripts/resources/">Creator Resources</a></div>
      <div class="rail-card rail-card-subtle"><p class="rail-label">Script Shelves</p><a href="/scripts/featured/">Featured Scripts</a><a href="/scripts/latest/">Latest Scripts</a><a href="/scripts/categories/">Browse by Script Type</a></div>
      <div class="rail-card"><p class="rail-label">Usage Guide</p><a href="#script-board">Library Board</a><a href="#creator-resources">Creator Resources</a></div>
    </aside>`;
}

function renderScriptsBoardLeftRail() {
  return `<aside class="article-rail article-rail-left" aria-label="Library Board navigation">
      <div class="rail-card"><p class="rail-label">Creator Paths</p><a href="/scripts/">Creator Home</a><a href="/scripts/categories/">Script Categories</a><a href="/scripts/board/">Library Board</a><a href="/scripts/resources/">Creator Resources</a></div>
      <div class="rail-card rail-card-subtle"><p class="rail-label">Script Shelves</p><a href="/scripts/featured/">Featured Scripts</a><a href="/scripts/latest/">Latest Scripts</a><a href="/scripts/categories/">Browse by Script Type</a></div>
      <div class="rail-card"><p class="rail-label">Usage Guide</p><a href="/scripts/resources/">Creator Resources</a><a href="/scripts/">Free Mystery YouTube Scripts</a></div>
    </aside>`;
}

function renderScriptsHomeRail({ featuredScript, latestScripts, genres }) {
  const latest = latestScripts.slice(0, 3);
  const genreLinks = genres.slice(0, 3).map((group) => `<a href="/scripts/categories/">${escapeHtml(group.genre)}</a>`).join('');
  return `<aside class="home-rail" aria-label="Creator Library recommendations">
      ${renderKyunolabNetworkCard('scripts')}
      ${featuredScript ? `<div class="rail-card rail-feature"><p class="rail-label">Start here</p><a href="/scripts/${escapeAttr(featuredScript.slug)}"><span>${escapeHtml(featuredScript.genre)}</span><strong>${escapeHtml(featuredScript.title)}</strong></a></div>` : ''}
      <div class="rail-card"><p class="rail-label">Latest scripts</p>${latest.map((script) => `<a href="/scripts/${escapeAttr(script.slug)}">${escapeHtml(script.title)}</a>`).join('')}</div>
      <div class="rail-card"><p class="rail-label">Creator shelves</p>${genreLinks}<a href="/scripts/resources/">Creator Resources</a></div>
    </aside>`;
}

function renderScriptCategoryRightRail(scripts) {
  const featuredScript = scripts[0];
  const latest = sortNewest(scripts).slice(0, 3);
  return `<aside class="article-rail article-rail-right" aria-label="Creator category recommendations">
      ${renderKyunolabNetworkCard('scripts')}
      ${featuredScript ? `<div class="rail-card rail-feature"><p class="rail-label">Start here</p><a href="/scripts/${escapeAttr(featuredScript.slug)}"><span>${escapeHtml(featuredScript.genre)}</span><strong>${escapeHtml(featuredScript.title)}</strong></a></div>` : ''}
      <div class="rail-card"><p class="rail-label">Latest scripts</p>${latest.map((script) => `<a href="/scripts/${escapeAttr(script.slug)}">${escapeHtml(script.title)}</a>`).join('')}</div>
      <div class="rail-card"><p class="rail-label">Creator paths</p><a href="/scripts/board/">Library Board</a><a href="/scripts/resources/">Creator Resources</a><a href="/scripts/">Free Mystery YouTube Scripts</a></div>
    </aside>`;
}

function getHomeCategoryGroups() {
  const configuredGroups = Array.isArray(siteConfig.homeCategoryGroups) ? siteConfig.homeCategoryGroups : [];
  if (configuredGroups.length) {
    return configuredGroups.map((group) => ({
      label: group.label,
      categories: (group.categorySlugs || []).map((slug) => categories.find((category) => category.slug === slug)).filter(Boolean)
    })).filter((group) => group.categories.length);
  }

  const grouped = groupCategories();
  return Object.entries(grouped).slice(0, 2).map(([label, groupCategories]) => ({
    label,
    categories: groupCategories.slice(0, 3)
  }));
}

function groupCreatorCategories() {
  return categories
    .filter((category) => !category.legacy)
    .reduce((groups, category) => {
      groups[category.group] = groups[category.group] || [];
      groups[category.group].push(category);
      return groups;
    }, {});
}

function generateRss() {
  const items = sortNewest(stories).slice(0, rssLimit).map((story) => `    <item>
      <title>${escapeXml(story.title)}</title>
      <link>${siteUrl}/stories/${story.slug}</link>
      <guid>${siteUrl}/stories/${story.slug}</guid>
      <pubDate>${new Date(`${story.publishedAt}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(story.excerpt || story.metaDescription || '')}</description>
    </item>`).join('\n');

  writeFile('rss.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Kyunolab Mystery Archive</title><link>${siteUrl}/</link><description>Legends, folklore, mysteries, and strange tales.</description>
${items}
  </channel></rss>
`);
}

function generateSitemap() {
  const urls = [];
  const latest = newestDate(stories);
  const staticPages = [
    '/',
    '/newest.html',
    '/popular.html',
    '/categories.html',
    '/archive.html',
    '/scripts/',
    '/scripts/latest/',
    '/scripts/featured/',
    '/scripts/categories/',
    '/scripts/board/',
    '/scripts/resources/',
    '/mystery-board.html',
    '/about.html',
    '/fiction-disclaimer.html',
    '/privacy.html'
  ];

  for (const urlPath of staticPages) urls.push({ loc: `${siteUrl}${urlPath}`, lastmod: latest });

  for (const category of categories) {
    const categoryStories = stories.filter((story) => story.categorySlug === category.slug);
    const categoryDate = newestDate(categoryStories) || latest;
    urls.push({ loc: `${siteUrl}/categories/${category.slug}.html`, lastmod: categoryDate });
  }

  for (const category of categories.filter((item) => !item.legacy)) {
    const categoryStories = stories.filter((story) => story.categorySlug === category.slug);
    const categoryDate = newestDate(categoryStories) || latest;
    urls.push({ loc: `${siteUrl}/scripts/categories/${category.slug}/`, lastmod: categoryDate });
  }

  for (const story of stories) {
    urls.push({ loc: `${siteUrl}/stories/${story.slug}`, lastmod: story.updatedAt || story.publishedAt || latest });
  }

  for (const guide of guides) {
    urls.push({ loc: `${siteUrl}${guide.url || `/mystery-board/${guide.slug}`}`, lastmod: guide.updatedAt || guide.publishedAt || latest });
  }

  for (const script of creatorScripts) {
    urls.push({ loc: `${siteUrl}/scripts/${script.slug}`, lastmod: script.updatedAt || script.publishedAt || latest });
  }

  const rows = urls.map((url) => `  <url><loc>${escapeXml(url.loc)}</loc><lastmod>${escapeXml(url.lastmod)}</lastmod></url>`).join('\n');
  writeFile('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows}
</urlset>
`);

  console.log(`Sitemap base indexable URLs: ${urls.length} (pagination URLs excluded).`);
}

function generateRoutingFiles() {
  writeFile('_redirects', [
    'https://www.kyunolab.com/* https://kyunolab.com/:splat 301',
    'http://www.kyunolab.com/* https://kyunolab.com/:splat 301',
    'http://kyunolab.com/* https://kyunolab.com/:splat 301'
  ].join('\n') + '\n');

  writeFile('404.html', renderPage({
    canonicalPath: '/404.html',
    title: 'Page Not Found',
    description: 'The requested archive page could not be found.',
    robots: 'noindex, follow',
    content: `  <main class="not-found-page">
    <p class="label">Archive Missing</p>
    <h1 class="article-title">This record is not in the archive.</h1>
    <p class="deck">The page may have moved, the address may be mistyped, or the record may not exist.</p>
    <div class="not-found-actions">
      <a class="button" href="/">Return home</a>
      <a class="text-link" href="/archive.html">Browse the archive</a>
    </div>
  </main>`
  }));
}

function renderListPage({ canonicalPath, label, title, h1, description, items, baseName, pageNumber, totalPages }) {
  const metaDescription = pageNumber === 1
    ? description
    : `${description} Page ${pageNumber} of ${totalPages} continues the archive list with more source-aware legend, folklore, and mystery entries.`;
  return renderPage({
    canonicalPath,
    title,
    description,
    metaDescription,
    networkSection: 'archive',
    content: `  <main class="article-shell article-layout">
    ${renderLeftRail()}
    <div class="archive-page-main"><p class="label">${escapeHtml(label)}</p><h1 class="article-title">${escapeHtml(h1)}</h1><p class="deck">${escapeHtml(description)}</p><div class="story-list">${items.map(renderStoryRow).join('\n')}</div>${renderPagination(baseName, pageNumber, totalPages)}</div>
    ${renderRightRail(items, 'Recommended archive paths')}
  </main>`
  });
}

function renderCategoryPage({ category, pageItems, pageNumber, totalPages, pageTitle, canonicalPath }) {
  const metaDescription = pageNumber === 1
    ? category.description
    : `${category.description} Page ${pageNumber} of ${totalPages} continues this category with more related archive entries.`;
  return renderPage({
    canonicalPath,
    title: pageTitle,
    description: category.description,
    metaDescription,
    networkSection: 'archive',
    content: `  <main class="article-shell article-layout">
    ${renderLeftRail()}
    <div class="archive-page-main"><p class="label">${escapeHtml(category.group)}</p><h1 class="article-title">${escapeHtml(category.title)}</h1><p class="deck">${escapeHtml(category.description)}</p>${pageNumber === 1 ? renderCategoryIntro(category) : ''}<div class="story-list">${pageItems.map(renderStoryRow).join('\n')}</div>${renderPagination(`categories/${category.slug}`, pageNumber, totalPages)}</div>
    ${renderRightRail(pageItems, 'Recommended archive paths')}
  </main>`
  });
}

function renderPage({ canonicalPath, title, description, metaDescription, content, robots, networkSection }) {
  const pageDescription = metaDescription || description;
  const pageTitle = title.includes('|') ? title : `${title} | Kyunolab Mystery Archive`;
  const socialImage = `${siteUrl}/icon-512.png`;
  const robotsMeta = robots ? `  <meta name="robots" content="${escapeAttr(robots)}">\n` : '';
  const needsCreatorScript = content.includes('scene-advanced-toggle') || content.includes('narration-copy-button');
  const needsPublishingScript = content.includes('data-publishing-center');
  const needsSearchScript = content.includes('data-search-page');
  const creatorScript = needsCreatorScript ? `\n${renderCreatorLibraryScript()}` : '';
  const publishingScript = needsPublishingScript ? `\n${renderPublishingCenterScript()}` : '';
  const searchScript = needsSearchScript ? `\n${renderSearchResultsScript()}` : '';
  const globalSearchScript = networkSection !== 'publishing' ? renderGlobalSearchScript() : '';
  const pageStyleVersion = styleVersion;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeAttr(pageDescription)}">
${robotsMeta}  <meta property="og:title" content="${escapeAttr(pageTitle)}">
  <meta property="og:description" content="${escapeAttr(pageDescription)}">
  <meta property="og:site_name" content="Kyunolab Mystery Archive">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${siteUrl}${canonicalPath}">
  <meta property="og:image" content="${socialImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(pageTitle)}">
  <meta name="twitter:description" content="${escapeAttr(pageDescription)}">
  <meta name="twitter:image" content="${socialImage}">
  <link rel="canonical" href="${siteUrl}${canonicalPath}">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32">
  <link rel="icon" href="/favicon-48x48.png" type="image/png" sizes="48x48">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="stylesheet" href="/styles.css?v=${pageStyleVersion}">
</head>
<body>
  ${renderHeader(canonicalPath, { includeSearch: networkSection !== 'publishing' })}
${content}
  ${renderFooter()}${globalSearchScript}${creatorScript}${publishingScript}${searchScript}
</body>
</html>
`;
}

function renderCreatorLibraryScript() {
  return `  <script defer src="/scripts/creator-library.js?v=20260715-csp-controls"></script>`;
}

function renderGlobalSearchScript() {
  return `  <script defer src="/assets/global-search.js?v=${styleVersion}"></script>`;
}

function renderSearchResultsScript() {
  return `  <script defer src="/assets/search-results.js?v=${styleVersion}"></script>`;
}

function renderPublishingCenterScript() {
  return `  <script>
(function () {
  var root = document.querySelector('[data-publishing-center]');
  if (!root) return;
  var status = root.querySelector('.publishing-status');

  function copyPlainText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    var copied = document.execCommand('copy');
    textarea.remove();
    return copied ? Promise.resolve() : Promise.reject(new Error('copy failed'));
  }

  function flash(button, message) {
    var original = button.textContent;
    button.textContent = message;
    setStatus(message);
    window.setTimeout(function () {
      button.textContent = original;
    }, 1200);
  }

  function setStatus(message) {
    if (status) {
      status.textContent = message || '';
    }
  }

  function buildNaverText(button) {
    var title = button.getAttribute('data-title') || '';
    var url = button.getAttribute('data-url') || '';
    var description = button.getAttribute('data-description') || '';
    var category = button.getAttribute('data-category') || '';
    return [
      'Naver Blog Conversion Source',
      '',
      'Title:',
      title,
      '',
      'Category:',
      category,
      '',
      'Description:',
      description,
      '',
      'Kyunolab original article:',
      url
    ].join('\\n').trim();
  }

  root.addEventListener('click', function (event) {
    var shareButton = event.target.closest('.publishing-share');
    var naverButton = event.target.closest('.publishing-naver-copy');

    if (shareButton) {
      event.preventDefault();
      var title = shareButton.getAttribute('data-title') || '';
      var url = shareButton.getAttribute('data-url') || '';
      var shareData = { title: title, url: url };
      if (navigator.share) {
        navigator.share(shareData).then(function () {
          flash(shareButton, 'Shared');
        }).catch(function () {
          copyPlainText(url).then(function () {
            flash(shareButton, 'Copied');
          }).catch(function () {
            flash(shareButton, 'Failed');
          });
        });
        return;
      }
      copyPlainText(url).then(function () {
        flash(shareButton, 'Copied');
      }).catch(function () {
        flash(shareButton, 'Failed');
      });
      return;
    }

    if (naverButton) {
      event.preventDefault();
      copyPlainText(buildNaverText(naverButton)).then(function () {
        flash(naverButton, 'Copied Naver text');
      }).catch(function () {
        flash(naverButton, 'Failed');
      });
    }
  });

  root.querySelectorAll('.publishing-published').forEach(function (input) {
    var key = input.getAttribute('data-storage-key');
    if (!key) return;
    input.checked = window.localStorage.getItem(key) === 'true';
    input.addEventListener('change', function () {
      if (input.checked) {
        window.localStorage.setItem(key, 'true');
        setStatus('Marked as published');
      } else {
        window.localStorage.removeItem(key);
        setStatus('Marked as unpublished');
      }
    });
  });
})();
  </script>`;
}

function renderHeader(currentPath = '/', options = {}) {
  const pathForNav = normalizeNavPath(currentPath);
  const includeSearch = options.includeSearch !== false;
  if (isScriptsPath(pathForNav)) {
    return renderScriptsHeader(pathForNav, includeSearch);
  }
  return renderMainHeader(pathForNav, includeSearch);
}

function renderMainHeader(currentPath, includeSearch = true) {
  const searchForm = includeSearch ? `\n      ${renderSiteSearchForm('archive')}` : '';
  return `<header class="site-header">
    <div class="topline">A Kyuno Lab publication</div>
    <div class="header-inner">
      <a class="brand" href="/"><span class="brand-mark"><img src="/icon-192.png" alt="" aria-hidden="true"></span><span><strong>Kyunolab Mystery Archive</strong><em>Legends, folklore, mysteries, and strange tales.</em></span></a>
${searchForm}
      <nav class="nav">${[
        navLink('/newest.html', 'Newest', currentPath === '/newest'),
        navLink('/popular.html', 'Popular', currentPath === '/popular'),
        navLink('/categories.html', 'Categories', currentPath === '/categories' || currentPath.startsWith('/categories/')),
        navLink('/mystery-board.html', 'Mystery Board', currentPath === '/mystery-board' || currentPath.startsWith('/mystery-board/')),
        navLink('/about.html', 'About', currentPath === '/about')
      ].join('')}</nav>
    </div>
  </header>`;
}

function renderScriptsHeader(currentPath, includeSearch = true) {
  const searchForm = includeSearch ? `\n      ${renderSiteSearchForm('archive')}` : '';
  return `<header class="site-header site-header-scripts">
    <div class="topline">A Kyuno Lab creator resource</div>
    <div class="header-inner">
      <a class="brand" href="/scripts/"><span class="brand-mark"><img src="/icon-192.png" alt="" aria-hidden="true"></span><span><strong>Kyunolab Creator Library</strong><em>Free mystery YouTube scripts for creators.</em></span></a>
${searchForm}
      <nav class="nav">${[
        navLink('/scripts/latest/', 'Latest', currentPath.startsWith('/scripts/latest')),
        navLink('/scripts/featured/', 'Featured', currentPath.startsWith('/scripts/featured')),
        navLink('/scripts/categories/', 'Categories', currentPath.startsWith('/scripts/categories')),
        navLink('/scripts/board/', 'Library Board', currentPath.startsWith('/scripts/board')),
        navLink('/scripts/resources/', 'Resources', currentPath.startsWith('/scripts/resources'))
      ].join('')}</nav>
    </div>
  </header>`;
}

function renderSiteSearchForm(defaultType = 'archive') {
  const selectedType = defaultType === 'library' ? 'library' : 'archive';
  return `<form class="site-search" action="/search/" method="get" role="search" aria-label="Search Archive or Creator Library">
        <label class="sr-only" for="global-search-type">Search target</label>
        <select id="global-search-type" name="type" class="site-search-select" data-search-type>
          <option value="archive"${selectedType === 'archive' ? ' selected' : ''}>Archive</option>
          <option value="library"${selectedType === 'library' ? ' selected' : ''}>Creator Library</option>
        </select>
        <label class="sr-only" for="global-search-query">Search query</label>
        <input id="global-search-query" name="q" class="site-search-input" type="search" placeholder="${selectedType === 'library' ? 'Search Creator Library...' : 'Search stories, legends, and mysteries...'}" autocomplete="off" data-search-input>
        <button class="site-search-button" type="submit">SEARCH</button>
      </form>`;
}

function navLink(href, label, isActive) {
  return `<a href="${href}"${isActive ? ' class="active" aria-current="page"' : ''}>${escapeHtml(label)}</a>`;
}

function normalizeNavPath(currentPath) {
  const withoutHash = String(currentPath || '/').split('#')[0].split('?')[0];
  let normalized = withoutHash.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  if (normalized.length > 1 && normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  return normalized || '/';
}

function isScriptsPath(currentPath) {
  return currentPath === '/scripts' || currentPath.startsWith('/scripts/');
}

function renderKyunolabNetworkCard(section) {
  const isScripts = section === 'scripts';
  const itemTitle = isScripts ? 'Mystery Archive' : 'Creator Library';
  const description = isScripts
    ? 'Read the original legends, folklore, strange stories, and mystery records.'
    : 'Free mystery YouTube scripts, Shorts scripts, image prompts, and thumbnail ideas for video creators.';
  const buttonText = isScripts ? 'Open Mystery Archive' : 'Open Creator Library';
  const href = isScripts ? '/' : '/scripts/';
  return `<div class="rail-card rail-card-network">
        <p class="rail-label">Kyunolab Network</p>
        <strong>${escapeHtml(itemTitle)}</strong>
        <p>${escapeHtml(description)}</p>
        <a class="button" href="${href}">${escapeHtml(buttonText)}</a>
      </div>`;
}

function renderFooter() {
  return `<footer class="site-footer">
    <p><strong>Kyunolab Mystery Archive</strong> collects legends, folklore, mysteries, and strange tales with calm source-aware notes.</p>
    <p><a href="/archive.html">Archive Index</a> - <a href="/newest.html">Newest</a> - <a href="/popular.html">Popular</a> - <a href="/categories.html">Categories</a> - <a href="/scripts/">Scripts</a> - <a href="/about.html">About</a> - <a href="/fiction-disclaimer.html">Story &amp; Source Notice</a> - <a href="/privacy.html">Privacy</a> - <a href="/rss.xml">RSS</a> - <a href="/publishing-center/">Publishing Center</a></p>
  </footer>`;
}

function renderLeftRail(label = 'Archive navigation') {
  return `<aside class="article-rail article-rail-left" aria-label="${escapeAttr(label)}">
    <div class="rail-card"><p class="rail-label">Reader Paths</p><a href="/newest.html">Newest Records</a><a href="/popular.html">Popular Records</a><a href="/categories.html">Browse Categories</a><a href="/mystery-board.html">Mystery Board</a></div>
    <div class="rail-card rail-card-subtle"><p class="rail-label">Archive Shelves</p><a href="/categories/urban-legends.html">Urban Legends</a><a href="/categories/internet-folklore.html">Internet Folklore</a><a href="/categories/myths.html">Myths</a><a href="/categories/strange-places.html">Strange Places</a></div>
    <div class="rail-card"><p class="rail-label">Source Guide</p><a href="/fiction-disclaimer.html">Story &amp; Source Notice</a><a href="/about.html">About Kyunolab</a></div>
  </aside>`;
}

function renderRightRail(items, label) {
  const safeItems = items.length ? items : stories.slice(0, 4);
  const feature = safeItems[0];
  const related = safeItems.slice(1, 4);
  return `<aside class="article-rail article-rail-right" aria-label="${escapeAttr(label)}">${renderKyunolabNetworkCard('archive')}<div class="rail-card rail-feature"><p class="rail-label">Start here</p><a href="/stories/${escapeAttr(feature.slug)}"><span>${escapeHtml(feature.category)}</span><strong>${escapeHtml(feature.title)}</strong></a></div><div class="rail-card"><p class="rail-label">Related records</p>${related.map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}</div></aside>`;
}

function renderCategoryRightRail() {
  const start = stories[0];
  const popular = stories.slice(1, 4);
  const essentials = stories.slice(4, 7);
  return `<aside class="article-rail article-rail-right" aria-label="Category page reading paths">
      ${renderKyunolabNetworkCard('archive')}
      <div class="rail-card rail-feature"><p class="rail-label">Start here</p><a href="/stories/${escapeAttr(start.slug)}"><span>${escapeHtml(start.category)}</span><strong>${escapeHtml(start.title)}</strong></a></div>
      <div class="rail-card"><p class="rail-label">Popular records</p>${popular.map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}</div>
      <div class="rail-card"><p class="rail-label">Essential reads</p>${essentials.map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}</div>
    </aside>`;
}

function renderCategoryRailLink(category) {
  return `<a href="/categories/${escapeAttr(category.slug)}.html">${escapeHtml(category.title)}</a>`;
}

function renderStoryRow(story) {
  return `<article class="story-row">
          <span class="tag">${escapeHtml(story.category)}</span>
          <h3><a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a></h3>
          <p>${escapeHtml(story.excerpt || story.metaDescription || '')}</p>
          <div class="meta">${escapeHtml([story.category, story.tag, story.readTime, `Updated ${formatDate(story.updatedAt || story.publishedAt)}`].filter(Boolean).join(' - '))}</div>
        </article>`;
}

function categorySeoTitle(category) {
  const endings = {
    'urban-legends': 'Urban Legends: Origins, Meanings, and Modern Folklore',
    'internet-folklore': 'Internet Folklore: Digital Legends, Origins, and Meanings',
    'strange-places': 'Strange Places: Haunted Locations, Maps, and Place Legends',
    'unexplained-mysteries': 'Unexplained Mysteries: Evidence, Records, and Open Questions',
    'classic-folklore': 'Classic Folklore: Traditional Beliefs, Meanings, and Origins',
    'modern-legends': 'Modern Legends: Contemporary Folklore and Urban Myths',
    myths: 'Mythology: Origins, Meanings, Symbols, and Sacred Stories',
    'mythic-creatures': 'Mythic Creatures: Dragon, Spirit, and Monster Folklore',
    'lost-worlds': 'Lost Worlds: Hidden Cities, Vanished Islands, and Map Legends',
    'strange-nature': 'Strange Nature: Weather Folklore, Omens, and Landscape Mysteries',
    'legendary-places': 'Legendary Places: Sacred Sites, Ruins, and Local Folklore',
    'mythic-objects': 'Mythic Objects: Legendary Relics, Symbols, and Folklore',
    'legend-origins': 'Legend Origins: Folklore History, Motifs, and Early Versions'
  };
  return endings[category.slug] || category.title;
}

function renderCategoryIntro(category) {
  const focus = {
    'urban-legends': 'roadside ghosts, warning stories, vanishing passengers, neighborhood rumors, and legends attached to ordinary public places',
    'internet-folklore': 'digital legends, cursed images, liminal spaces, forum stories, screenshots, games, and rumors shaped by online communities',
    'strange-places': 'haunted locations, impossible rooms, vanished roads, map anomalies, and places remembered differently by local witnesses',
    'unexplained-mysteries': 'documents, timestamps, photographs, missing records, uncertain evidence, and questions that remain open after careful review',
    'classic-folklore': 'household customs, protective rules, oral traditions, weather beliefs, thresholds, and inherited warnings',
    'modern-legends': 'apps, workplaces, delivery systems, smart devices, transport, and the everyday technologies around which new folklore forms',
    myths: 'creation stories, sacred narratives, natural origins, culture heroes, gods, and symbolic explanations of the world',
    'mythic-creatures': 'dragons, water beings, giants, spirits, guardian animals, monsters, and regional creature traditions',
    'lost-worlds': 'hidden kingdoms, drowned lands, vanished islands, impossible maps, and imagined geography',
    'strange-nature': 'weather omens, unusual landscapes, strange water, seasonal signs, sound boundaries, and natural events interpreted through folklore',
    'legendary-places': 'sacred mountains, shrines, ruins, pilgrimage roads, forbidden lakes, and sites preserved through local memory',
    'mythic-objects': 'legendary swords, keys, mirrors, bells, books, vessels, charms, and ritual tools',
    'legend-origins': 'motif history, early variants, cultural exchange, media adaptation, and the process by which a repeated story becomes recognizable'
  }[category.slug] || 'recurring folklore motifs, source traditions, local memory, and the way stories change across retellings';

  return `<section class="category-seo-intro" aria-label="${escapeAttr(category.title)} overview">
      <p>${escapeHtml(category.title)} is a Kyunolab Mystery Archive reading path for ${escapeHtml(focus)}. The collection approaches each subject through origin, meaning, common versions, cultural setting, and source status. It preserves the atmosphere that makes a legend memorable while separating documented context from oral tradition, community retelling, symbolic interpretation, and original narrative framing.</p>
      <p>Readers can use this page to compare how similar motifs change across regions and formats. Some records follow older folklore; others examine modern rumors, internet circulation, archival gaps, or stories attached to familiar places and objects. Titles and summaries are written to answer a clear question, but no repeated claim is treated as proof simply because it appears in many versions.</p>
      <p>The entries below are ordered by their latest update. Each article links to related records, narrower tags, source notes, and the wider archive shelf, making this category a starting point rather than a dead-end list. Begin with the topic closest to your question, then follow the connected motifs to see what changes, what persists, and where the available evidence stops.</p>
      <p>Because the archive includes legends, retellings, symbolic readings, and evidence-limited mysteries, source labels remain visible throughout. That distinction lets readers enjoy the story pattern without confusing cultural importance, online popularity, or local tradition with independent verification.</p>
    </section>`;
}

function formatDate(value) {
  if (!value) return '';
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

function renderHomeStoryRow(story) {
  return `<article class="home-story-row">
          <div><span class="tag">${escapeHtml(story.category)}</span><h3><a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a></h3></div>
          <p>${escapeHtml(story.excerpt || story.metaDescription || '')}</p>
          <div class="meta">${escapeHtml([story.category, story.tag, story.readTime].filter(Boolean).join(' - '))}</div>
        </article>`;
}

function renderCategoryStoryLink(story) {
  return `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`;
}

function renderPagination(baseName, pageNumber, totalPages) {
  const links = [];
  const prev = pageNumber - 1;
  const next = pageNumber + 1;
  links.push(prev >= 1 ? `<a class="page-link page-step" href="${pageHref(baseName, prev)}">Previous</a>` : '<span class="page-link page-step is-disabled" aria-disabled="true">Previous</span>');
  for (let page = 1; page <= totalPages; page += 1) {
    links.push(page === pageNumber ? `<span class="page-link is-current" aria-current="page">${page}</span>` : `<a class="page-link" href="${pageHref(baseName, page)}">${page}</a>`);
  }
  links.push(next <= totalPages ? `<a class="page-link page-step" href="${pageHref(baseName, next)}">Next</a>` : '<span class="page-link page-step is-disabled" aria-disabled="true">Next</span>');
  return `<nav class="pagination" aria-label="Archive pagination"><div class="pagination-status">Page ${pageNumber} of ${totalPages}</div><div class="pagination-links">${links.join('')}</div></nav>`;
}

function pageHref(baseName, pageNumber) {
  return pageNumber === 1 ? `/${baseName}.html` : `/${baseName}-${pageNumber}.html`;
}

function addPagedUrls(urls, baseName, count, lastmod) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  for (let page = 2; page <= totalPages; page += 1) {
    urls.push({ loc: `${siteUrl}/${baseName}-${page}.html`, lastmod });
  }
}

function cleanupPagedFiles(baseName, expectedPages) {
  const dir = baseName.includes('/') ? path.join(root, path.dirname(baseName)) : root;
  const name = path.basename(baseName);
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir)) {
    const match = entry.match(new RegExp(`^${escapeRegExp(name)}-(\\d+)\\.html$`));
    if (!match) continue;
    if (Number(match[1]) > expectedPages) {
      fs.unlinkSync(path.join(dir, entry));
    }
  }
}

function sortNewest(items) {
  return [...items].sort((a, b) => {
    const bTime = Date.parse(b.publishedAt || b.updatedAt || '') || 0;
    const aTime = Date.parse(a.publishedAt || a.updatedAt || '') || 0;
    if (bTime !== aTime) return bTime - aTime;
    return stories.indexOf(a) - stories.indexOf(b);
  });
}

function sortArchive(items) {
  return [...items].sort((a, b) => {
    const categoryCompare = a.category.localeCompare(b.category);
    if (categoryCompare) return categoryCompare;
    return a.title.localeCompare(b.title);
  });
}

function groupCategories() {
  return categories.reduce((groups, category) => {
    groups[category.group] = groups[category.group] || [];
    groups[category.group].push(category);
    return groups;
  }, {});
}

function getConfiguredStory(id) {
  if (!id) return null;
  return stories.find((story) => story.id === id || story.slug === id) || null;
}

function getConfiguredStories(ids) {
  const configuredIds = Array.isArray(ids) ? ids : [];
  const configuredStories = configuredIds.map(getConfiguredStory).filter(Boolean);
  if (configuredStories.length) return configuredStories;
  return stories.slice(0, configuredIds.length || 5);
}

function newestDate(items) {
  return items
    .map((item) => item.updatedAt || item.publishedAt)
    .filter(Boolean)
    .sort()
    .reverse()[0] || '';
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks.length ? chunks : [[]];
}

function writeFile(fileName, content) {
  fs.mkdirSync(path.dirname(path.join(root, fileName)), { recursive: true });
  fs.writeFileSync(path.join(root, fileName), content, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readOptionalJson(filePath, fallback = []) {
  if (!fs.existsSync(filePath)) return fallback;
  return readJson(filePath);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function escapeXml(value) {
  return escapeHtml(value);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
