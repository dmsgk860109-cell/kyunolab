const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const siteUrl = 'https://kyunolab.com';
const styleVersion = '20260709-seo-structure';
const pageSize = 12;
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
generateScriptsPages();
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
  ${renderFooter()}
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
            <p class="label">Creator Board</p>
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
          <a href="/scripts/board/">Open Creator Board for ${escapeHtml(category.title)}</a>
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
    title: 'Creator Board | Kyunolab Video Scripts',
    description: 'A creator board for planning SEO guide articles, YouTube script strategy, Shorts hooks, image prompts, thumbnail concepts, and production workflow notes.',
    metaDescription: 'Use the Creator Board to plan SEO-friendly creator guides for mystery YouTube scripts, Shorts hooks, image prompts, thumbnails, and production workflow.',
    networkSection: 'scripts',
    content: `  <main class="article-shell article-layout scripts-board-page">
    ${renderScriptsBoardLeftRail()}

    <div class="archive-page-main">
      <p class="label">Creator Board</p>
      <h1 class="article-title">Plan the video before the voiceover begins.</h1>
      <p class="deck">A creator-focused board for planning SEO guide articles, production notes, script formats, and video workflow ideas before they become full resources.</p>

      <section class="notice">
        <strong>What this page is for:</strong> Creator Board is separate from individual script packages. It will hold SEO-friendly guide articles about planning, adapting, organizing, and publishing mystery video resources.
      </section>

      <section class="scripts-section script-board">
        <div>
          <p class="label">Creator workflow</p>
          <h2>Keep script packages and creator guides separate.</h2>
          <p>Script detail pages contain finished creator materials. Creator Board is reserved for broader SEO guide articles: workflow, planning, topic selection, visual direction, and publishing strategy.</p>
        </div>
        <div class="script-board-grid">
          <article><strong>SEO Creator Guides</strong><span>Planning articles for search intent, video structure, and creator workflow.</span></article>
          <article><strong>Production Notes</strong><span>Reusable guidance for narration pacing, Shorts angles, visual prompts, and thumbnails.</span></article>
          <article><strong>Publishing Strategy</strong><span>Board-level resources for organizing creator content without mixing it with script pages.</span></article>
        </div>
      </section>

      <section class="notice">
        <strong>Board status:</strong> Individual YouTube script pages are not listed here. Future Creator Board posts will be published as separate SEO guide resources and managed independently from script package pages.
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
    title: 'Creator Resources | Kyunolab Video Scripts',
    description: 'Creator resources for adapting Kyunolab mystery archive stories into YouTube scripts, Shorts, image prompts, thumbnails, and subtitle lines.',
    metaDescription: 'Creator resources for turning mystery archive stories into YouTube scripts, Shorts scripts, image prompts, thumbnails, and subtitle lines.',
    networkSection: 'scripts',
    content: `  <main class="scripts-page">
    <section class="scripts-hero scripts-subpage-hero">
      <div>
        <p class="label">Creator Resources</p>
        <h1 class="article-title">Use the archive without confusing story and script.</h1>
        <p class="deck">These resources keep original archive stories separate from creator-facing scripts, prompts, thumbnail ideas, and short-form adaptations.</p>
      </div>
      <aside class="script-creator-panel">
        ${renderKyunolabNetworkCard('scripts')}
        <p class="rail-label">Creator Library</p>
        <a href="/scripts/">Scripts Home</a>
        <a href="/scripts/categories/">Script Categories</a>
        <a href="/scripts/board/">Creator Board</a>
      </aside>
    </section>
    <section class="scripts-section">
      <div class="section-head"><h2>Creator Resources</h2><span>Useful paths</span></div>
      <div class="script-resource-links">
        <a href="/scripts/">Free Mystery YouTube Scripts</a>
        <a href="/scripts/categories/">Browse Script Categories</a>
        <a href="/scripts/board/">Open the Creator Board</a>
        <a href="/archive.html">Browse Original Archive Stories</a>
        <a href="/fiction-disclaimer.html">Story &amp; Source Notice</a>
      </div>
    </section>
    <section class="scripts-section script-board">
      <div>
        <p class="label">Adaptation note</p>
        <h2>Scripts are creator materials, not replacement archive articles.</h2>
        <p>Original stories remain under the mystery archive. Script pages are production aids for narration, visual planning, Shorts, and thumbnail development.</p>
      </div>
      <div class="script-board-grid">
        <article><strong>Start with the archive</strong><span>Read the original story first so the video script keeps the right source-aware tone.</span></article>
        <article><strong>Use scripts as drafts</strong><span>Edit narration, pacing, and visual prompts to match your own channel format.</span></article>
        <article><strong>Keep claims careful</strong><span>Present legends, folklore, and mysteries without implying unverified events are proven facts.</span></article>
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
  const content = `  <main class="script-detail-page article-shell">
    <article>
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/scripts/">Scripts Home</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(script.title)}</span></nav>
      <header class="archive-article-header">
        <p class="label">${escapeHtml(script.genre)}</p>
        <h1 class="article-title">${escapeHtml(script.title)}</h1>
        <p class="deck">${escapeHtml(script.deck)}</p>
        ${renderScriptMetaGrid(script)}
      </header>
      <section class="search-summary script-summary" aria-label="Script package summary">
        <h2>Script Info</h2>
        <dl>
          <div><dt>Genre</dt><dd>${escapeHtml(script.genre)}</dd></div>
          <div><dt>Estimated video length</dt><dd>${escapeHtml(script.estimatedVideoLength)}</dd></div>
          <div><dt>Recommended format</dt><dd>${escapeHtml(script.recommendedFormat || 'Longform narration with Shorts cutdowns')}</dd></div>
          <div><dt>Mood</dt><dd>${escapeHtml(script.mood || 'Quiet, mysterious, source-aware')}</dd></div>
          <div><dt>Best for</dt><dd>${escapeHtml(script.bestFor || 'YouTube narration, Shorts planning, and visual prompt development')}</dd></div>
        </dl>
      </section>
      <section class="script-material">
        <h2>Longform YouTube Script</h2>
        ${script.longformScript.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n')}
      </section>
      <section class="script-material">
        <h2>Shorts Script</h2>
        <ol>${script.shortsScript.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ol>
      </section>
      <section class="script-material">
        <h2>Scene-by-Scene Visual Guide</h2>
        ${renderSceneVisualGuide(script)}
      </section>
      <section class="script-material">
        <h2>Thumbnail Ideas</h2>
        <ul>${script.thumbnailIdeas.map((idea) => `<li>${escapeHtml(idea)}</li>`).join('')}</ul>
      </section>
      <section class="script-material">
        <h2>Subtitle Lines</h2>
        <div class="script-subtitle-lines">${script.subtitleLines.map((line) => `<span>${escapeHtml(line)}</span>`).join('')}</div>
      </section>
      <section class="script-material">
        <h2>Usage Note</h2>
        <p>${escapeHtml(usageNote)}</p>
      </section>
      ${originalStory ? `<aside class="script-version-cta"><p class="rail-label">Original archive story</p><p>Read the original archive story.</p><a class="button" href="/stories/${escapeAttr(originalStory.slug)}">${escapeHtml(originalStory.title)}</a></aside>` : ''}
      <section class="related-articles" aria-label="Related scripts">
        <div class="section-head"><h2>Related Scripts</h2></div>
        <div class="related-grid">${relatedScripts.map(renderRelatedScriptLink).join('')}</div>
      </section>
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

function renderSceneVisualGuide(script) {
  const prompts = script.visualGuide || (script.imagePrompts || []).map((prompt, index) => ({
    suggestedImageDescription: `Scene ${index + 1} visual`,
    aiImagePrompt: prompt,
    directionTip: index === 0 ? 'Open with atmosphere before revealing the central mystery.' : 'Keep the image quiet, readable, and useful for narration pacing.'
  }));
  return `<div class="script-prompt-list">${prompts.map((item) => `<article>
          <h3>${escapeHtml(item.suggestedImageDescription || 'Suggested Image Description')}</h3>
          <p><strong>AI Image Prompt:</strong> ${escapeHtml(item.aiImagePrompt || item.prompt || '')}</p>
          <p><strong>Direction Tip:</strong> ${escapeHtml(item.directionTip || 'Use this visual as a calm supporting scene, not as a jump-scare image.')}</p>
        </article>`).join('')}</div>`;
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
        <a class="text-link" href="/categories/${escapeAttr(category.slug)}.html">View ${escapeHtml(category.title)}</a>
      </article>`;
}

function renderHomeRail({ featuredStory, popularStories, essentialStories }) {
  const popular = popularStories.slice(0, 3);
  const essentials = essentialStories.slice(0, 3);
  return `<aside class="home-rail" aria-label="Homepage reader paths">
      ${renderKyunolabNetworkCard('archive')}
      <div class="rail-card rail-feature"><p class="rail-label">Start here</p><a href="/stories/${escapeAttr(featuredStory.slug)}"><span>${escapeHtml(featuredStory.category)}</span><strong>${escapeHtml(featuredStory.title)}</strong></a></div>
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
      <div class="rail-card"><p class="rail-label">Creator Paths</p><a href="/scripts/">Creator Home</a><a href="/scripts/categories/">Script Categories</a><a href="/scripts/board/">Creator Board</a><a href="/scripts/resources/">Creator Resources</a></div>
      <div class="rail-card rail-card-subtle"><p class="rail-label">Script Shelves</p><a href="/scripts/featured/">Featured Scripts</a><a href="/scripts/latest/">Latest Scripts</a><a href="/scripts/categories/">Browse by Script Type</a></div>
      <div class="rail-card"><p class="rail-label">Usage Guide</p><a href="#script-board">Creator Board</a><a href="#creator-resources">Creator Resources</a></div>
    </aside>`;
}

function renderScriptsBoardLeftRail() {
  return `<aside class="article-rail article-rail-left" aria-label="Creator Board navigation">
      <div class="rail-card"><p class="rail-label">Creator Paths</p><a href="/scripts/">Creator Home</a><a href="/scripts/categories/">Script Categories</a><a href="/scripts/board/">Creator Board</a><a href="/scripts/resources/">Creator Resources</a></div>
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
      <div class="rail-card"><p class="rail-label">Creator paths</p><a href="/scripts/board/">Creator Board</a><a href="/scripts/resources/">Creator Resources</a><a href="/scripts/">Free Mystery YouTube Scripts</a></div>
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
  <link rel="stylesheet" href="/styles.css?v=${styleVersion}">
</head>
<body>
  ${renderHeader(canonicalPath)}
${content}
  ${renderFooter()}
</body>
</html>
`;
}

function renderHeader(currentPath = '/') {
  const pathForNav = normalizeNavPath(currentPath);
  if (isScriptsPath(pathForNav)) {
    return renderScriptsHeader(pathForNav);
  }
  return renderMainHeader(pathForNav);
}

function renderMainHeader(currentPath) {
  return `<header class="site-header">
    <div class="topline">A Kyuno Lab publication</div>
    <div class="header-inner">
      <a class="brand" href="/"><span class="brand-mark"><img src="/icon-192.png" alt="" aria-hidden="true"></span><span><strong>Kyunolab Mystery Archive</strong><em>Legends, folklore, mysteries, and strange tales.</em></span></a>
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

function renderScriptsHeader(currentPath) {
  return `<header class="site-header site-header-scripts">
    <div class="topline">A Kyuno Lab creator resource</div>
    <div class="header-inner">
      <a class="brand" href="/scripts/"><span class="brand-mark"><img src="/icon-192.png" alt="" aria-hidden="true"></span><span><strong>Kyunolab Creator Library</strong><em>Free mystery YouTube scripts for creators.</em></span></a>
      <nav class="nav">${[
        navLink('/scripts/latest/', 'Latest', currentPath.startsWith('/scripts/latest')),
        navLink('/scripts/featured/', 'Featured', currentPath.startsWith('/scripts/featured')),
        navLink('/scripts/categories/', 'Categories', currentPath.startsWith('/scripts/categories')),
        navLink('/scripts/board/', 'Creator Board', currentPath.startsWith('/scripts/board')),
        navLink('/scripts/resources/', 'Resources', currentPath.startsWith('/scripts/resources'))
      ].join('')}</nav>
    </div>
  </header>`;
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
    <p><strong>Kyunolab Mystery Archive</strong> is a quiet story publication by Kyuno Lab, dedicated to legends, folklore, mysteries, and strange tales from the edges of memory.</p>
    <p><a href="/archive.html">Archive Index</a> - <a href="/newest.html">Newest</a> - <a href="/popular.html">Popular</a> - <a href="/categories.html">Categories</a> - <a href="/scripts/">Scripts</a> - <a href="/about.html">About</a> - <a href="/fiction-disclaimer.html">Story &amp; Source Notice</a> - <a href="/privacy.html">Privacy</a> - <a href="/rss.xml">RSS</a></p>
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
          <div class="meta">${escapeHtml([story.tag, story.readTime].filter(Boolean).join(' - '))}</div>
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
