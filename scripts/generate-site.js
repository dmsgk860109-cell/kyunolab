const fs = require('fs');
const path = require('path');
const { loadStories } = require('./lib/load-stories');
const {
  getCreatorPackRoot,
  getCreatorPackManifestPath,
  iterateCreatorPacks,
  rebuildCreatorPackManifest
} = require('./creator-library-store');

const root = path.resolve(__dirname, '..');
const buildArgs = parseBuildArgs(process.argv.slice(2));
const siteOutputRoot = path.resolve(buildArgs.outputRoot || root);
const creatorPackOptions = buildArgs.creatorPackRoot ? { root: buildArgs.creatorPackRoot } : {};
const siteUrl = 'https://kyunolab.com';
const styleVersion = '20260804-nav-flow';
const creatorLibraryScriptVersion = '20260722-copy-fields';
const pageSize = 12;
const libraryPageSize = 10;
const publishingCenterPageSize = 24;
const rssLimit = 20;

const stories = loadStories(root);
const categories = readJson(path.join(root, 'data', 'categories.json'));
const guides = readOptionalJson(path.join(root, 'data', 'guides.json'));
const creatorScripts = loadCreatorScriptsForBuild(creatorPackOptions);
const libraryBoardPosts = readOptionalJson(path.join(root, 'data', 'library-board.json'));
const siteConfig = readOptionalJson(path.join(root, 'data', 'site.json'), {});
const creatorLibraryCategories = buildCreatorLibraryCategories(creatorScripts);

function main() {
  generateHomePage();
  generateArchivePageSet({
    baseName: 'newest',
    label: 'Newest Records',
    title: 'Newest folklore, legend, and mystery stories',
    description: 'The latest Kyunolab Mystery Archive entries, including urban legends, internet folklore, myths, strange places, and source-aware mystery notes.',
    items: sortNewest(stories)
  });

  generateArchivePageSet({
    baseName: 'popular',
    label: 'Known Records',
    title: 'Known starting points for legends, folklore, and mystery stories',
    description: 'A curated path through reader-friendly entry points for urban legends, internet folklore, classic myths, strange places, and recurring mystery motifs.',
    items: getKnownRecordStories()
  });

  generateArchivePageSet({
    baseName: 'archive',
    label: 'All Stories',
    title: 'Explore every open file in Kyunolab Mystery Archive',
    description: 'Move through every record by category, source status, story type, folklore motif, legend origin, and recurring mystery pattern.',
    items: sortArchive(stories)
  });

  generateCategoryHub();
  generateCategoryPages();
  generateUtilityPlaceholderPages();
  generatePublishingCenter();
  generateScriptsPages();
  generateSearchPage();
  generateSearchIndexes();
  generateRss();
  generateSitemap();
  generateRoutingFiles();

  console.log(`Generated site index pages for ${stories.length} stories, ${categories.length} categories, ${guides.length} guides, ${creatorScripts.length} scripts, and ${libraryBoardPosts.length} library board posts.`);
}

function generateHomePage() {
  const featuredStory = getConfiguredStory(siteConfig.featuredStoryId) || stories[0];
  const latestStories = sortNewest(stories).slice(0, 8);
  const popularStories = getConfiguredStories(siteConfig.popularStoryIds).slice(0, 5);
  const essentialStories = getConfiguredStories(siteConfig.essentialStoryIds).slice(0, 4);
  const categoryGroups = getHomeCategoryGroups();
  const headlineStories = getHomeStories([
    'bloody-mary-mirror-legend',
    'smile-dog-creepypasta',
    'poisoned-halloween-candy-legend',
    'demeter-and-persephone-myth',
    'paris-catacombs-legends'
  ]);
  const readerPathGroups = getHomeReaderPathGroups();
  const motifLanes = getHomeMotifLanes();
  const guideLinks = getHomeGuides([
    'what-is-an-urban-legend',
    'how-to-check-source-status',
    'why-internet-folklore-spreads',
    'how-to-build-a-reading-path-through-the-strange-archive'
  ]);
  const libraryScripts = sortNewest(creatorScripts).slice(0, 3);

  writeFile('index.html', renderHomePage({
    featuredStory,
    latestStories,
    popularStories,
    essentialStories,
    categoryGroups,
    headlineStories,
    readerPathGroups,
    motifLanes,
    guideLinks,
    libraryScripts
  }));
}

function renderHomePage({ featuredStory, latestStories, popularStories, essentialStories, categoryGroups, headlineStories, readerPathGroups, motifLanes, guideLinks, libraryScripts }) {
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
<body class="home-portal-page">
  ${renderHomePortalHeader()}
  <main class="home-shell home-portal-shell">
    <div class="home-portal-layout">
      <div class="home-main-column">
        ${renderHomePortalLead({ featuredStory, popularStories })}
        <section class="notice"><strong>Story &amp; Source Notice:</strong> This site explores folklore, legends, mysteries, and source-aware retellings. Unverified traditions are presented as stories, not as verified fact.</section>
        ${renderAdSlot('ad-home-after-hero')}
        ${renderHomeHeadlineDesk(headlineStories, guideLinks)}
        ${renderHomeReaderPaths(readerPathGroups)}
        ${renderAdSlot('ad-home-mid-feed')}
        ${renderHomeMotifLanes(motifLanes)}
        <section id="categories" class="categories"><div class="section-head"><h2>Browse By Category</h2><a href="/categories.html">View all categories</a></div><div class="home-category-groups">${categoryGroups.map(renderHomeCategoryGroup).join('')}</div></section>
        ${renderHomeCrossroads({ guideLinks, libraryScripts })}
        <div class="home-stream">
          <section id="latest" class="latest latest-compact"><div class="section-head"><h2>Latest Stories</h2><a href="/newest.html">View all newest</a></div><div class="home-story-list">${latestStories.map(renderHomeStoryRow).join('')}</div></section>
        </div>
        <section id="essential-reads" class="essential-reads"><div class="section-head"><h2>Essential Reads</h2><span>Start here</span></div><div class="compact-grid">${essentialStories.map(renderEssentialStory).join('')}</div></section>
        ${renderAdSlot('ad-home-before-footer')}
        <section class="archive-cta"><div><p class="label">All Stories</p><h2>Explore every open file in Kyunolab Mystery Archive.</h2><p>Move through the full collection by category, source status, story type, folklore motif, legend origin, and recurring mystery pattern.</p></div><a class="button" href="/archive.html">Browse all current stories</a></section>
      </div>
      ${renderHomePortalRail({ popularStories, essentialStories, guideLinks, libraryScripts })}
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

function getKnownRecordStories() {
  const configuredSlugs = [
    siteConfig.featuredStoryId,
    ...(siteConfig.popularStoryIds || []),
    ...(siteConfig.essentialStoryIds || [])
  ].filter(Boolean);
  const leadingStories = configuredSlugs
    .map((slug) => stories.find((story) => story.slug === slug))
    .filter(Boolean);
  const seen = new Set();
  const uniqueLeadingStories = leadingStories.filter((story) => {
    if (seen.has(story.slug)) return false;
    seen.add(story.slug);
    return true;
  });
  const remainingStories = sortNewest(stories).filter((story) => !seen.has(story.slug));
  return uniqueLeadingStories.concat(remainingStories);
}

function generateCategoryHub() {
  const grouped = groupCategories();
  const primaryCategories = getCategoryHubPrimaryCategories();
  const headlineStories = getHomeStories([
    'woman-in-white-roadside-legend',
    'the-backrooms-explained',
    'russian-sleep-experiment-creepypasta',
    'baba-yaga-forest-folklore',
    'dragons-across-world-mythology',
    'paris-catacombs-legends'
  ]);
  const readerPathGroups = getHomeReaderPathGroups();
  const guideLinks = getHomeGuides([
    'what-is-an-urban-legend',
    'how-to-check-source-status',
    'why-internet-folklore-spreads',
    'how-to-build-a-reading-path-through-the-strange-archive'
  ]);
  const libraryScripts = sortNewest(creatorScripts).slice(0, 3);
  const popularStories = getHomeStories([
    'woman-in-white-roadside-legend',
    'the-backrooms-explained',
    'vanishing-hitchhiker-urban-legend',
    'baba-yaga-forest-folklore',
    'dragons-across-world-mythology'
  ]);
  const essentialStories = getHomeStories([
    'woman-in-white-roadside-legend',
    'the-backrooms-explained',
    'forest-that-goes-silent-at-noon',
    'the-bell-under-the-lake'
  ]);
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
    bodyClass: 'home-portal-page',
    headerHtml: renderHomePortalHeader('/categories.html'),
    content: `  <main class="home-shell home-portal-shell category-portal-page">
    <div class="home-portal-layout">
      <div class="home-main-column">
        ${renderCategoryPortalLead(primaryCategories)}
        <section class="notice"><strong>Category Guide:</strong> Choose a broad story shelf first, then follow the article links inside each category. This page is a map for real archive records, not a replacement for the stories themselves.</section>
        ${renderAdSlot('ad-category-hub-after-intro')}
        ${renderCategoryPrimaryDesk(primaryCategories, headlineStories)}
        ${renderCategoryStoryPaths(readerPathGroups)}
        <section class="categories category-portal-shelves" aria-label="All archive category shelves">
          <div class="section-head"><h2>All Category Buildings</h2><span>Every shelf keeps real article doors visible</span></div>
${body}
        </section>
        ${renderAdSlot('ad-category-hub-before-footer')}
        ${renderHomeCrossroads({ guideLinks, libraryScripts })}
        <section class="archive-cta"><div><p class="label">All Stories</p><h2>Open the full archive when a category feels too narrow.</h2><p>The complete index keeps every current Kyunolab Mystery Archive record in one place, with newest and popular routes nearby.</p></div><a class="button" href="/archive.html">Browse all current stories</a></section>
      </div>
      ${renderHomePortalRail({ popularStories, essentialStories, guideLinks, libraryScripts })}
    </div>
  </main>`,
    footerSection: 'archive'
  }));
}

function renderCategoryGuide() {
  return `      <section class="notice" aria-label="Category guide">
        <p class="label">Category Guide</p>
        <h2>Find the shelf that matches the story mood</h2>
        <p>Use these larger entrances when the full map feels too broad. The complete category shelves stay below, with real story links inside each section.</p>
        <div class="compact-grid">
          <a href="/categories/urban-legends.html"><span>Modern rumors</span><strong>Urban Legends</strong></a>
          <a href="/categories/internet-folklore.html"><span>Digital paths</span><strong>Internet Folklore</strong></a>
          <a href="/categories/classic-folklore.html"><span>Older warnings</span><strong>Classic Folklore</strong></a>
          <a href="/categories/myths.html"><span>Mythic roots</span><strong>Myths</strong></a>
        </div>
      </section>`;
}

function getCategoryHubPrimaryCategories() {
  return [
    'urban-legends',
    'internet-folklore',
    'myths',
    'strange-places',
    'mythic-creatures'
  ].map((slug) => categories.find((category) => category.slug === slug)).filter(Boolean);
}

function renderCategoryPortalLead(primaryCategories) {
  return `<section class="home-portal-lead category-portal-lead" aria-label="Category front entrance">
          <article class="home-lead-story category-lead-story">
            <p class="label">Archive Category Hub</p>
            <h1>Choose the shelf, then enter the stories.</h1>
            <p>Categories work best as building entrances: clear enough to choose quickly, but filled with actual legends, folklore, myths, places, and source-aware records.</p>
            <a class="button" href="/archive.html">Open all stories</a>
          </article>
          <div class="home-known-list category-entrance-list">
            <h2>Main story shelves</h2>
            ${primaryCategories.map(renderCategoryEntranceLink).join('')}
          </div>
        </section>`;
}

function renderCategoryEntranceLink(category, index) {
  const count = stories.filter((story) => story.categorySlug === category.slug).length;
  return `<a href="/categories/${escapeAttr(category.slug)}.html"><span>${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(category.title)}</strong><em>${count} records</em></a>`;
}

function renderCategoryPrimaryDesk(primaryCategories, headlineStories) {
  return `<section class="home-headline-desk category-primary-desk" aria-label="Primary category desk">
          <div class="section-head"><h2>Primary Shelves</h2><span>Fast roads into the archive</span></div>
          <div class="headline-desk-grid">
            <div class="headline-list">${primaryCategories.map(renderCategoryDeskRow).join('')}</div>
            <aside class="home-context-card">
              <p class="label">Story-first map</p>
              <h3>The shelf should point to articles, not become the destination.</h3>
              <p>Use category labels to choose a direction, then move into known stories, origin notes, strange places, and recurring motifs through the links below.</p>
              <div class="category-links">${headlineStories.slice(0, 3).map(renderCategoryStoryLink).join('')}</div>
            </aside>
          </div>
        </section>`;
}

function renderCategoryDeskRow(category) {
  const count = stories.filter((story) => story.categorySlug === category.slug).length;
  return `<a class="home-headline-row" href="/categories/${escapeAttr(category.slug)}.html"><span>${escapeHtml(category.group)}</span><strong>${escapeHtml(category.title)}</strong><em>${count} records</em></a>`;
}

function renderCategoryStoryPaths(groups) {
  return `<section class="home-reader-paths category-story-paths" aria-label="Story-first category paths">
          <div class="section-head"><h2>Story-First Paths</h2><span>Start with a question, then follow the shelf</span></div>
          <div class="home-path-grid">${groups.map(renderHomeReaderPathGroup).join('')}</div>
        </section>`;
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

function generateUtilityPlaceholderPages() {
  const toolsPage = renderUtilityPlaceholderPage({
    canonicalPath: '/tools',
    label: 'Tools',
    title: 'Kyunolab Tools are under construction',
    deck: 'This future tools hub will hold utilities for motifs, sources, reading paths, and archive navigation. For now, use the linked archive routes below.',
    primaryCta: ['Open Mystery Board', '/mystery-board.html'],
    secondaryCta: ['Browse All Stories', '/archive.html'],
    cards: [
      ['Motif Finder', 'A future utility for finding repeated ideas across archive records.'],
      ['Source Checklist', 'A future utility for checking how a story names uncertainty and source limits.'],
      ['Reading Path Builder', 'A future utility for moving from one story into related shelves, guides, and creator materials.']
    ]
  });
  writeFile('tools.html', toolsPage);
  writeFile(path.join('tools', 'index.html'), toolsPage);

  const hubPage = renderUtilityPlaceholderPage({
    canonicalPath: '/hub',
    label: 'Hub',
    title: 'Kyunolab Hub is under construction',
    deck: 'This future site hub will hold bookmark notes, support options, events, announcements, and outside activity. For now, the archive remains the main entrance.',
    primaryCta: ['Return Home', '/'],
    secondaryCta: ['About Kyunolab', '/about.html'],
    cards: [
      ['Bookmark Kyunolab', 'A future note for readers who want to save the site and return to new archive paths.'],
      ['Support and Notices', 'A future area for support links, site notices, and reader-facing updates.'],
      ['Events and Outside Activity', 'A future area for events, mini-book ideas, community projects, or off-site promotions.']
    ]
  });
  writeFile('hub.html', hubPage);
  writeFile(path.join('hub', 'index.html'), hubPage);
}

function renderUtilityPlaceholderPage({ canonicalPath, label, title, deck, primaryCta, secondaryCta, cards }) {
  return renderPage({
    canonicalPath,
    title,
    description: deck,
    metaDescription: deck,
    robots: 'noindex, follow',
    networkSection: 'archive',
    content: `  <main class="article-shell article-layout utility-placeholder-page">
    ${renderLeftRail(`${label} navigation`)}
    <div class="archive-page-main">
      <p class="label">${escapeHtml(label)}</p>
      <h1 class="article-title">${escapeHtml(title)}</h1>
      <p class="deck">${escapeHtml(deck)}</p>
      <section class="notice">
        <strong>Under construction:</strong> This page is linked now so the site structure stays honest. It is marked noindex until the full ${escapeHtml(label.toLowerCase())} section is ready.
      </section>
      <section class="utility-placeholder-grid" aria-label="${escapeAttr(label)} planned areas">
        ${cards.map(([cardTitle, cardText]) => `<article>
          <p class="category-group-label">Planned Area</p>
          <h2>${escapeHtml(cardTitle)}</h2>
          <p>${escapeHtml(cardText)}</p>
        </article>`).join('\n')}
      </section>
      <section class="archive-cta">
        <div><p class="label">Keep reading</p><h2>Use the active paths while this area is built.</h2><p>Archive records, reading guides, and Creator Library pages remain available from here.</p></div>
        <div class="utility-cta-actions">
          <a class="button" href="${escapeAttr(primaryCta[1])}">${escapeHtml(primaryCta[0])}</a>
          <a class="text-link" href="${escapeAttr(secondaryCta[1])}">${escapeHtml(secondaryCta[0])}</a>
        </div>
      </section>
    </div>
    ${renderRightRail(stories.slice(0, 4), `${label} fallback paths`)}
  </main>`
  });
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
          <span class="publishing-record-title">${escapeHtml(story.title)}</span>
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

        .publishing-manual-copy {
          border: 1px solid var(--border-color, #d9d2c4);
          box-sizing: border-box;
          font: inherit;
          margin: 0 0 0.9rem;
          min-height: 6rem;
          padding: 0.65rem;
          width: 100%;
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
  const boardPosts = sortNewest(libraryBoardPosts);
  writeFile('scripts/index.html', renderScriptsHomePage(scripts));
  generateScriptListingPages({
    basePath: 'scripts/latest',
    scripts,
    renderPageForScripts: renderScriptsLatestPage
  });
  generateScriptListingPages({
    basePath: 'scripts/featured',
    scripts: getFeaturedScripts(scripts),
    renderPageForScripts: renderScriptsFeaturedPage
  });
  writeFile('scripts/categories/index.html', renderScriptCategoriesPage(scripts));
  generateScriptCategoryPages(scripts);
  writeFile('scripts/board/index.html', renderScriptBoardPage(scripts, boardPosts));
  writeFile('scripts/resources/index.html', renderScriptResourcesPage(scripts));
  for (const post of boardPosts) {
    writeFile(`scripts/board/${post.slug}/index.html`, renderLibraryBoardPostPage(post, boardPosts));
  }
  for (const script of scripts) {
    writeFile(`scripts/${script.slug}.html`, renderScriptDetailPage(script));
  }
}

function generateScriptListingPages({ basePath, scripts, renderPageForScripts }) {
  const pages = chunk(scripts, libraryPageSize);
  cleanupLibraryPageDirs(basePath, pages.length);
  for (let index = 0; index < pages.length; index += 1) {
    const pageNumber = index + 1;
    const fileName = pageNumber === 1 ? `${basePath}/index.html` : `${basePath}/page/${pageNumber}/index.html`;
    writeFile(fileName, renderPageForScripts({
      allScripts: scripts,
      scripts: pages[index],
      pageNumber,
      totalPages: pages.length,
      basePath
    }));
  }
}

function generateScriptCategoryPages(scripts) {
  const activeCategories = creatorLibraryCategories;
  cleanupScriptCategoryPages(activeCategories);
  for (const category of activeCategories) {
    const relatedScripts = scriptsForCreatorCategory(category, scripts);
    const pages = chunk(relatedScripts, libraryPageSize);
    const basePath = `scripts/categories/${category.slug}`;
    cleanupLibraryPageDirs(basePath, pages.length);
    for (let index = 0; index < pages.length; index += 1) {
      const pageNumber = index + 1;
      const fileName = pageNumber === 1 ? `${basePath}/index.html` : `${basePath}/page/${pageNumber}/index.html`;
      writeFile(fileName, renderScriptCategoryPage({
        category,
        scripts,
        relatedScripts,
        pageScripts: pages[index],
        pageNumber,
        totalPages: pages.length,
        basePath
      }));
    }
  }
}

function cleanupScriptCategoryPages(activeCategories) {
  const categoriesDir = path.join(siteOutputRoot, 'scripts', 'categories');
  if (!fs.existsSync(categoriesDir)) return;
  const allowed = new Set(activeCategories.map((category) => category.slug));
  for (const entry of fs.readdirSync(categoriesDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || allowed.has(entry.name)) continue;
    fs.rmSync(path.join(categoriesDir, entry.name), { recursive: true, force: true });
  }
}

function cleanupLibraryPageDirs(basePath, totalPages) {
  const pageDir = path.join(siteOutputRoot, basePath, 'page');
  if (!fs.existsSync(pageDir)) return;
  if (totalPages <= 1) {
    fs.rmSync(pageDir, { recursive: true, force: true });
    return;
  }
  for (const entry of fs.readdirSync(pageDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pageNumber = Number(entry.name);
    if (!Number.isInteger(pageNumber) || pageNumber < 2 || pageNumber > totalPages) {
      fs.rmSync(path.join(pageDir, entry.name), { recursive: true, force: true });
    }
  }
}

function renderScriptsHomePage(scripts) {
  const featuredScripts = scripts.slice(0, 3);
  const latestScripts = scripts.slice(0, 8);
  const featuredScript = featuredScripts[0] || scripts[0];
  const guideLinks = getHomeGuides([
    'how-to-check-source-status',
    'how-to-build-a-reading-path-through-the-strange-archive',
    'how-to-find-internal-link-opportunities-without-forcing-them'
  ]);
  const popularStories = getConfiguredStories(siteConfig.popularStoryIds).slice(0, 5);
  return renderPage({
    canonicalPath: '/scripts/',
    title: 'Free Mystery YouTube Scripts | Kyunolab',
    description: 'Free mystery YouTube scripts for creators, including longform YouTube scripts, Shorts scripts, image prompts, thumbnail ideas, and subtitle lines.',
    metaDescription: 'Free mystery, horror, urban legend, and strange history YouTube scripts for creators. Includes longform narration, Shorts scripts, image prompts, thumbnail ideas, and subtitle lines.',
    networkSection: 'scripts',
    footerSection: 'scripts',
    bodyClass: 'home-portal-page',
    headerHtml: renderCreatorPortalHeader('/scripts/'),
    content: `  <main class="home-shell home-portal-shell creator-portal-page scripts-home-page">
    <div class="home-portal-layout">
      <div class="home-main-column">
        ${renderCreatorPortalLead({ featuredScript, latestScripts })}
        <section class="notice"><strong>Creator Note:</strong> Creator Library pages are production materials. Original archive stories stay separate from narration drafts, Shorts hooks, image prompts, thumbnail ideas, and subtitle lines.</section>
        ${renderAdSlot('ad-creator-library-after-intro')}
        ${renderCreatorFormatDesk(featuredScripts)}
        <section id="featured-scripts" class="home-headline-desk creator-featured-packages">
          <div class="section-head"><h2>Featured Scripts</h2><span>Ready for video planning</span></div>
          <div class="script-card-grid">${featuredScripts.map(renderScriptCard).join('')}</div>
        </section>
        <section id="latest-scripts" class="home-headline-desk creator-latest-packages">
          <div class="section-head"><h2>Latest Scripts</h2><span>New creator materials</span></div>
          <div class="script-list">${latestScripts.map(renderScriptRow).join('')}</div>
        </section>
        <section id="script-categories" class="home-reader-paths creator-category-paths">
          <div class="section-head"><h2>Script Categories</h2><span>Browse by creator use</span></div>
          <div class="script-category-grid">${creatorLibraryCategories.map(renderCreatorCategoryCard).join('')}</div>
        </section>
        ${renderCreatorCrossroads({ guideLinks, popularStories })}
      </div>
      ${renderCreatorPortalRail({ featuredScript, latestScripts, creatorCategories: creatorLibraryCategories, guideLinks, popularStories })}
    </div>
  </main>`
  });
}

function renderCreatorPortalHeader(currentPath = '/scripts/') {
  const pathForNav = normalizeNavPath(currentPath);
  return `<header class="home-portal-header creator-portal-header">
    <div class="home-portal-header-inner">
      <div class="home-portal-topbar">
        <a class="home-portal-brand" href="/scripts/"><span class="home-portal-brand-mark"><img src="/icon-192.png" alt="" aria-hidden="true"></span><span><strong>Kyunolab Creator Library</strong><em>Scripts, prompts, thumbnails, and creator resources.</em></span></a>
        ${renderCreatorPortalSearchForm()}
      </div>
      <nav class="home-portal-nav" aria-label="Primary Creator Library navigation">
        ${homePortalNavLink('/', 'Home', pathForNav === '/')}
        ${homePortalNavLink('/archive.html', 'Archive', pathForNav === '/archive' || /^\/archive-\d+$/.test(pathForNav))}
        ${homePortalNavLink('/categories.html', 'Categories', pathForNav === '/categories' || pathForNav.startsWith('/categories/'))}
        ${homePortalNavLink('/mystery-board.html', 'Mystery Board', pathForNav === '/mystery-board' || pathForNav.startsWith('/mystery-board/'))}
        ${homePortalNavLink('/scripts/', 'Creator Library', isScriptsPath(pathForNav))}
        ${homePortalNavLink('/tools.html', 'Tools', pathForNav === '/tools')}
        ${homePortalNavLink('/about.html', 'About', pathForNav === '/about')}
        ${homePortalNavLink('/hub.html', 'Hub', pathForNav === '/hub', 'home-portal-hub-link')}
      </nav>
      ${renderCreatorSignSystem()}
    </div>
  </header>`;
}

function renderCreatorPortalSearchForm() {
  return `<form class="site-search home-portal-search" action="/search/" method="get" role="search" aria-label="Search Kyunolab Creator Library">
          <input type="hidden" name="type" value="library">
          <label class="sr-only" for="creator-portal-search-query">Search query</label>
          <input id="creator-portal-search-query" name="q" class="site-search-input" type="search" placeholder="Search scripts, prompts, packs, formats..." autocomplete="off" data-search-input>
          <button class="site-search-button" type="submit">Search</button>
        </form>`;
}

function renderCreatorSignSystem() {
  return `<section class="home-sign-system creator-sign-system" aria-label="Kyunolab creator paths">
          <div class="home-sign-intro">
            <p class="label">Start Here</p>
            <h2>Choose a production package first, then follow the roads back to the archive.</h2>
            <p>Begin with scripts, browse creator shelves, or cross into source guides, original records, and future tools.</p>
          </div>
          <div class="home-sign-links">
            <div>
              <h3>Creator Materials</h3>
              <a href="/scripts/featured/">Featured Scripts</a>
              <a href="/scripts/latest/">Latest Scripts</a>
              <a href="/scripts/categories/">Script Categories</a>
              <a href="/scripts/resources/">Creator Resources</a>
            </div>
            <div>
              <h3>Use The Map</h3>
              <a href="/archive.html">Original Archive</a>
              <a href="/mystery-board.html">Reading Guides</a>
              <a href="/tools.html">Tools</a>
              <a href="/hub.html">Hub</a>
            </div>
          </div>
          <div class="home-small-buildings">
            <h3>Site Notes</h3>
            <a href="/scripts/board/">Library Board</a>
            <a href="/fiction-disclaimer.html">Story and source notice</a>
            <a href="/about.html">About Kyunolab</a>
          </div>
        </section>`;
}

function renderCreatorPortalLead({ featuredScript, latestScripts }) {
  const starters = latestScripts.slice(0, 5);
  return `<section class="home-portal-lead creator-portal-lead" aria-label="Creator Library front entrance">
          <article class="home-lead-story">
            <p class="label">Creator Library Production Desk</p>
            <h1>Turn strange archive ideas into creator-ready packages.</h1>
            <p>The Library keeps scripts, Shorts hooks, visual prompts, thumbnail angles, source notes, and planning material visible without confusing them with the original archive records.</p>
            ${featuredScript ? `<a class="button" href="/scripts/${escapeAttr(featuredScript.slug)}">Open featured script</a>` : '<a class="button" href="/scripts/latest/">Open latest scripts</a>'}
          </article>
          <div class="home-known-list creator-starter-list">
            <h2>Start with creator packages</h2>
            ${starters.map(renderCreatorStarterLink).join('')}
          </div>
        </section>`;
}

function renderCreatorStarterLink(script, index) {
  return `<a href="/scripts/${escapeAttr(script.slug)}"><span>${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(script.title)}</strong></a>`;
}

function renderCreatorFormatDesk(featuredScripts) {
  const rows = featuredScripts.slice(0, 3).map((script) => `<a class="home-headline-row creator-package-row" href="/scripts/${escapeAttr(script.slug)}"><span>${escapeHtml(script.genre || script.contentType || 'Script')}</span><strong>${escapeHtml(script.title)}</strong></a>`).join('');
  return `<section id="script-board" class="home-headline-desk creator-format-desk" aria-label="Creator format desk">
          <div class="section-head"><h2>Format Desk</h2><span>Choose the material before the voiceover</span></div>
          <div class="headline-desk-grid">
            <div class="headline-list">${rows}</div>
            <aside class="home-context-card">
              <p class="label">Library Board</p>
              <h3>Scripts, prompts, and thumbnails have different jobs.</h3>
              <p>Each package separates longform narration, Shorts structure, visual direction, thumbnail hooks, and source notes so creators can adapt without flattening the story.</p>
              <div class="category-links"><a href="/scripts/board/">Open Library Board</a><a href="/scripts/resources/">Creator Resources</a><a href="/fiction-disclaimer.html">Source Notice</a></div>
            </aside>
          </div>
        </section>`;
}

function renderCreatorCrossroads({ guideLinks, popularStories }) {
  return `<section id="creator-resources" class="home-crossroads creator-crossroads" aria-label="Creator Library crossroads">
          <div class="section-head"><h2>Archive, Board, and Tools</h2><span>Creator paths should connect both ways</span></div>
          <div class="home-crossroad-grid">
            <article>
              <p class="category-group-label">Archive</p>
              <h3><a href="/archive.html">Return to the original reading records</a></h3>
              <p>The Mystery Archive keeps the source-facing story pages. The Creator Library turns selected material into production aids for videos.</p>
              <div class="category-links">${popularStories.slice(0, 3).map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}</div>
            </article>
            <article>
              <p class="category-group-label">Mystery Board</p>
              <h3><a href="/mystery-board.html">Check reading context before adapting</a></h3>
              <p>Use Board guides for source limits, story types, motifs, and archive paths before turning a topic into narration or visual prompts.</p>
              <div class="category-links">${guideLinks.map((guide) => `<a href="/mystery-board/${escapeAttr(guide.slug)}">${escapeHtml(guide.shortTitle || guide.title)}</a>`).join('')}</div>
            </article>
            <article class="home-planned-card">
              <p class="category-group-label">Tools</p>
              <h3><a href="/tools.html">Future utilities can support production workflows</a></h3>
              <p>Motif Finder, Source Checklist, and Reading Path Builder can later help creators find topics without making tool pages louder than the packages.</p>
              <div class="home-planned-list"><span>Motif Finder</span><span>Source Checklist</span><span>Reading Paths</span></div>
            </article>
          </div>
        </section>`;
}

function renderCreatorPortalRail({ featuredScript, latestScripts, creatorCategories, guideLinks, popularStories }) {
  const latest = latestScripts.slice(0, 4);
  const categoryLinks = creatorCategories.slice(0, 4);
  return `<aside class="home-portal-rail creator-portal-rail" aria-label="Creator Library side paths">
      ${renderKyunolabNetworkCard('scripts')}
      ${featuredScript ? `<section class="rail-card rail-feature"><p class="rail-label">Start here</p><a href="/scripts/${escapeAttr(featuredScript.slug)}"><span>${escapeHtml(featuredScript.genre || 'Script package')}</span><strong>${escapeHtml(featuredScript.title)}</strong></a></section>` : ''}
      <section class="rail-card">
        <p class="rail-label">Latest packages</p>
        ${latest.map((script) => `<a href="/scripts/${escapeAttr(script.slug)}">${escapeHtml(script.title)}</a>`).join('')}
      </section>
      <section class="rail-card rail-card-subtle">
        <p class="rail-label">Creator shelves</p>
        ${categoryLinks.map((category) => `<a href="/scripts/categories/${escapeAttr(category.slug)}/">${escapeHtml(category.title)}</a>`).join('')}
        <a href="/scripts/resources/">Creator Resources</a>
      </section>
      <section class="rail-card">
        <p class="rail-label">Cross roads</p>
        <a href="/archive.html">Library to Archive</a>
        <a href="/mystery-board.html">Library to Mystery Board</a>
        <a href="/tools.html">Library to Tools</a>
        ${guideLinks.slice(0, 1).map((guide) => `<a href="/mystery-board/${escapeAttr(guide.slug)}">${escapeHtml(guide.shortTitle || guide.title)}</a>`).join('')}
      </section>
      <section class="rail-card rail-card-subtle">
        <p class="rail-label">Original records</p>
        ${popularStories.slice(0, 3).map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}
      </section>
    </aside>`;
}

function renderScriptsLatestPage({ allScripts, scripts, pageNumber, totalPages, basePath }) {
  return renderScriptsListingPage({
    canonicalPath: libraryPageCanonical(basePath, pageNumber),
    label: 'Latest Scripts',
    title: 'Latest mystery YouTube scripts',
    deck: 'The newest creator-ready script packages from Kyunolab Creator Library, arranged for longform narration, Shorts planning, image prompts, thumbnails, and production notes.',
    sectionTitle: 'Newest creator materials',
    sectionMeta: `${allScripts.length} script package${allScripts.length === 1 ? '' : 's'}`,
    scripts,
    pageTitle: pageNumber === 1 ? 'Latest Mystery YouTube Scripts | Kyunolab Creator Library' : `Latest Mystery YouTube Scripts - Page ${pageNumber} | Kyunolab Creator Library`,
    description: 'Browse the newest Kyunolab mystery YouTube scripts for creators, including longform narration, Shorts hooks, image prompts, thumbnail ideas, and subtitle lines.',
    pageNumber,
    totalPages,
    basePath
  });
}

function renderScriptsFeaturedPage({ allScripts, scripts, pageNumber, totalPages, basePath }) {
  return renderScriptsListingPage({
    canonicalPath: libraryPageCanonical(basePath, pageNumber),
    label: 'Featured Scripts',
    title: 'Featured mystery video script packages',
    deck: 'Start with the strongest creator-ready script packages: reliable entry points for mystery videos, urban legend explainers, folklore narration, Shorts hooks, and visual planning.',
    sectionTitle: 'Featured creator packages',
    sectionMeta: `${allScripts.length} featured script package${allScripts.length === 1 ? '' : 's'}`,
    scripts,
    pageTitle: pageNumber === 1 ? 'Featured Mystery YouTube Scripts | Kyunolab Creator Library' : `Featured Mystery YouTube Scripts - Page ${pageNumber} | Kyunolab Creator Library`,
    description: 'Browse featured Kyunolab mystery YouTube script packages with longform narration, Shorts scripts, image prompts, thumbnail ideas, and creator planning notes.',
    pageNumber,
    totalPages,
    basePath
  });
}

function getFeaturedScripts(scripts) {
  return scripts.slice(0, 6);
}

function renderScriptsListingPage({ canonicalPath, label, title, deck, sectionTitle, sectionMeta, scripts, pageTitle, description, pageNumber, totalPages, basePath }) {
  const pageStatus = totalPages > 1 ? `<p class="meta library-page-status">Page ${pageNumber} of ${totalPages}</p>` : '';
  const pagination = renderLibraryPagination({ basePath, pageNumber, totalPages, label });
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
      ${pageStatus}
      <p class="deck">${escapeHtml(deck)}</p>
      <section class="notice">
        <strong>Creator Library:</strong> These pages list script packages only. Original archive records remain in Kyunolab Mystery Archive and are linked only when a script package needs a source reference.
      </section>
      <section class="scripts-section">
        <div class="section-head"><h2>${escapeHtml(sectionTitle)}</h2><span>${escapeHtml(sectionMeta)}</span></div>
        ${scripts.length ? `<div class="script-list">${scripts.map(renderScriptRow).join('\n')}</div>` : `<div class="notice"><strong>No script packages yet:</strong> This page is ready for future creator materials.</div>`}
        ${pagination}
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
      ? 'Creator-ready paths for urban legends, internet folklore, strange places, unexplained mysteries, classic folklore, and modern legends'
      : groupName === 'Mythic & Imagined Realms'
        ? 'Creator-ready paths for myths, creatures, lost worlds, legendary places, strange nature, and symbolic objects'
        : 'Creator-ready origin and motif paths for script packages that explain how legends take shape';
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
    description: 'Browse Kyunolab Creator Library category paths for mystery YouTube scripts, Shorts planning, image prompts, thumbnails, and video research.',
    metaDescription: 'Browse Creator Library categories for mystery videos, including urban legends, internet folklore, myths, strange places, creatures, and lost worlds.',
    networkSection: 'scripts',
    content: `  <main class="article-shell article-layout scripts-categories-page">
    ${renderScriptsBoardLeftRail()}
    <div class="archive-page-main">
      <p class="label">Creator Script Categories</p>
      <h1 class="article-title">Browse Creator Library script categories</h1>
      <p class="deck">Move through the official Creator Library shelves for longform scripts, Shorts hooks, image prompts, thumbnail ideas, and production planning.</p>
${body}
    </div>
    ${renderScriptCategoryRightRail(scripts)}
  </main>`
  });
}

function renderScriptCategoryPage({ category, scripts, relatedScripts, pageScripts, pageNumber, totalPages, basePath }) {
  const categoryScripts = relatedScripts || scriptsForCreatorCategory(category, scripts);
  const currentScripts = pageScripts || categoryScripts;
  const packageCount = `${categoryScripts.length} script package${categoryScripts.length === 1 ? '' : 's'}`;
  const pageDescription = `${category.title} Creator Library script packages for mystery YouTube videos, Shorts hooks, image prompts, thumbnail ideas, and video planning.`;
  const pageStatus = totalPages > 1 ? `<p class="meta library-page-status">Page ${pageNumber} of ${totalPages}</p>` : '';
  const pagination = renderLibraryPagination({ basePath, pageNumber, totalPages, label: `${category.title} creator scripts` });
  return renderPage({
    canonicalPath: libraryPageCanonical(basePath, pageNumber),
    title: pageNumber === 1 ? `${category.title} Creator Scripts | Kyunolab Video Scripts` : `${category.title} Creator Scripts - Page ${pageNumber} | Kyunolab Video Scripts`,
    description: pageDescription,
    metaDescription: pageDescription,
    networkSection: 'scripts',
    content: `  <main class="article-shell article-layout scripts-category-page">
    ${renderScriptsBoardLeftRail()}
    <div class="archive-page-main">
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/scripts/">Creator Library</a><span aria-hidden="true">/</span><a href="/scripts/categories/">Categories</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(category.title)}</span></nav>
      <p class="label">${escapeHtml(category.group)}</p>
      <h1 class="article-title">${escapeHtml(category.title)} creator scripts</h1>
      ${pageStatus}
      <p class="deck">${escapeHtml(creatorCategoryDescription(category))}</p>
      <section class="notice">
        <strong>Creator Library shelf:</strong> Use this page to find ${escapeHtml(category.title.toLowerCase())} script packages for longform narration, Shorts hooks, visual prompts, thumbnail angles, and video planning.
      </section>
      <section class="scripts-section">
        <div class="section-head"><h2>Script packages in this shelf</h2><span>${escapeHtml(packageCount)}</span></div>
        ${currentScripts.length ? `<div class="script-list">${currentScripts.map(renderScriptRow).join('\n')}</div>` : `<div class="notice"><strong>No dedicated script package yet:</strong> This Creator Library shelf is ready for future ${escapeHtml(category.title.toLowerCase())} scripts.</div>`}
        ${pagination}
      </section>
      <section class="scripts-section script-board">
        <div>
          <p class="label">Creator workflow</p>
          <h2>Plan this shelf as a repeatable video format.</h2>
          <p>Use one shelf as a repeatable production path. Start with the longform script, adapt the Shorts hook, then use the visual prompts, thumbnail ideas, and subtitle lines as separate creator assets.</p>
        </div>
        <div class="script-board-grid">
          <article><strong>Longform angle</strong><span>Build an 8-13 minute narration with context, pacing, and meaning.</span></article>
          <article><strong>Shorts hook</strong><span>Compress the strongest image or question into a vertical-video opening.</span></article>
          <article><strong>Visual plan</strong><span>Use mood, setting, object, and thumbnail ideas as production materials.</span></article>
        </div>
      </section>
      <section class="scripts-section">
        <div class="section-head"><h2>Creator Library links</h2><span>Script pages only</span></div>
        <section class="notice">
          <strong>Library-only category:</strong> This page lists Creator Library script packages only. Archive records stay in the Mystery Archive and are not counted as script packages here.
        </section>
        <div class="script-resource-links">
          <a href="/scripts/categories/">All Creator Library Categories</a>
          <a href="/scripts/latest/">Latest Creator Library Packages</a>
          <a href="/scripts/featured/">Featured Creator Library Packages</a>
        </div>
      </section>
    </div>
    ${renderScriptCategoryRightRail(scripts)}
  </main>`
  });
}

function renderScriptBoardPage(scripts, boardPosts = []) {
  const latestScripts = sortNewest(scripts).slice(0, 5);
  const featuredScript = latestScripts[0] || scripts[0];
  const boardStarters = boardPosts.slice(0, 5);
  const guideLinks = getHomeGuides([
    'how-to-check-source-status',
    'how-to-build-a-reading-path-through-the-strange-archive',
    'how-to-find-internal-link-opportunities-without-forcing-them'
  ]);
  const popularStories = getConfiguredStories(siteConfig.popularStoryIds).slice(0, 4);
  return renderPage({
    canonicalPath: '/scripts/board/',
    title: 'Library Board | Guides to the Kyunolab Creator Library',
    description: 'Editorial guides to the Kyunolab Creator Library, including its script formats, categories, resource structure, featured packages, and connections to the Mystery Archive.',
    metaDescription: 'Editorial guides to the Kyunolab Creator Library, including its script formats, categories, resource structure, featured packages, and connections to the Mystery Archive.',
    networkSection: 'scripts',
    footerSection: 'scripts',
    bodyClass: 'home-portal-page',
    headerHtml: renderCreatorPortalHeader('/scripts/board/'),
    content: `  <main class="home-shell home-portal-shell creator-portal-page library-board-portal-page">
    <div class="home-portal-layout">
      <div class="home-main-column">
        ${renderLibraryBoardPortalLead(boardStarters)}
        <section class="notice"><strong>Library Board purpose:</strong> These are public creator guides. They explain formats, categories, scene workspaces, source separation, and production flow before a visitor opens a script package.</section>
        ${renderAdSlot('ad-library-board-after-intro')}
        ${renderLibraryBoardStructureDesk(boardPosts)}
        ${renderLibraryBoardGuidePaths(boardPosts)}
        ${renderAdSlot('ad-library-board-mid-list')}
        ${renderLibraryBoardGuideIndex(boardPosts)}
        ${renderLibraryBoardCrossroads({ latestScripts, guideLinks, popularStories })}
      </div>
      ${renderLibraryBoardPortalRail({ boardStarters, latestScripts, featuredScript, guideLinks })}
    </div>
  </main>`
  });
}

function renderLibraryBoardPortalLead(boardPosts) {
  const starters = boardPosts.slice(0, 5);
  const first = starters[0];
  return `<section class="home-portal-lead library-board-portal-lead" aria-label="Library Board front entrance">
          <article class="home-lead-story">
            <p class="label">Library Board Guide Desk</p>
            <h1>Understand the production system before choosing a package.</h1>
            <p>The Library Board explains how scripts, Shorts hooks, scene workspaces, prompts, source notes, and archive links fit together without turning creator assets into the original story.</p>
            ${first ? `<a class="button" href="/scripts/board/${escapeAttr(first.slug)}/">Open first guide</a>` : '<a class="button" href="/scripts/resources/">Open creator resources</a>'}
          </article>
          <div class="home-known-list library-board-starter-list">
            <h2>Start with Library Board guides</h2>
            ${starters.map(renderLibraryBoardStarterLink).join('')}
          </div>
        </section>`;
}

function renderLibraryBoardStarterLink(post, index) {
  return `<a href="/scripts/board/${escapeAttr(post.slug)}/"><span>${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(post.title)}</strong></a>`;
}

function renderLibraryBoardStructureDesk(boardPosts) {
  const rows = boardPosts.slice(0, 4).map((post) => `<a class="home-headline-row library-board-row" href="/scripts/board/${escapeAttr(post.slug)}/"><span>${escapeHtml(post.tag || post.category || 'Guide')}</span><strong>${escapeHtml(post.title)}</strong></a>`).join('');
  return `<section class="home-headline-desk library-board-structure-desk" aria-label="Library Board structure desk">
          <div class="section-head"><h2>Structure Desk</h2><span>How creator resources connect</span></div>
          <div class="headline-desk-grid">
            <div class="headline-list">${rows}</div>
            <aside class="home-context-card">
              <p class="label">Creator Library guide</p>
              <h3>Script detail pages hold materials; Board pages explain the system.</h3>
              <p>Use this desk to understand where longform scripts, short-form scripts, prompts, music notes, optional production fields, and source boundaries belong.</p>
              <div class="category-links"><a href="/scripts/">Creator Library</a><a href="/scripts/resources/">Creator Resources</a><a href="/scripts/categories/">Script Categories</a></div>
            </aside>
          </div>
        </section>`;
}

function renderLibraryBoardGuidePaths(boardPosts) {
  const groups = [
    {
      title: 'Choose the script format',
      deck: 'Start here when a creator needs to decide between long-form narration, Shorts structure, scene planning, and a complete video package.',
      posts: pickLibraryBoardPosts(boardPosts, [
        'how-to-choose-between-long-form-and-short-form-scripts',
        'how-to-build-a-complete-video-from-one-script-page',
        'how-to-use-scene-workspaces-without-losing-the-story'
      ])
    },
    {
      title: 'Keep story and production separate',
      deck: 'Use these guides when archive records, summaries, source notes, and creator assets need clear boundaries.',
      posts: pickLibraryBoardPosts(boardPosts, [
        'why-story-summary-comes-before-production-assets',
        'how-original-archive-records-and-creator-scripts-stay-separate',
        'how-creator-toolkit-fits-into-the-production-flow'
      ])
    },
    {
      title: 'Plan visual and optional fields',
      deck: 'These guides explain scene focus, visual prompts, background music language, and advanced notes without making them mandatory.',
      posts: pickLibraryBoardPosts(boardPosts, [
        'how-to-read-scene-focus-before-writing-visual-prompts',
        'how-background-music-keywords-shape-a-mystery-video',
        'how-advanced-production-notes-should-stay-optional'
      ])
    }
  ];
  return `<section class="home-reader-paths library-board-guide-paths" aria-label="Library Board guide paths">
          <div class="section-head"><h2>Library Guide Paths</h2><span>Creator guidance that leads back to packages</span></div>
          <div class="home-path-grid">${groups.map(renderLibraryBoardPathGroup).join('')}</div>
        </section>`;
}

function renderLibraryBoardPathGroup(group) {
  return `<article>
          <h3>${escapeHtml(group.title)}</h3>
          <p>${escapeHtml(group.deck)}</p>
          <div class="category-links">${group.posts.map(renderLibraryBoardSmallLink).join('')}</div>
        </article>`;
}

function renderLibraryBoardSmallLink(post) {
  return `<a href="/scripts/board/${escapeAttr(post.slug)}/">${escapeHtml(post.title)}</a>`;
}

function renderLibraryBoardGuideIndex(boardPosts) {
  return `<section class="home-headline-desk library-board-guide-index" aria-label="All Library Board guides">
          <div class="section-head"><h2>All Library Board Guides</h2><span>${escapeHtml(`${boardPosts.length} public guides`)}</span></div>
          ${boardPosts.length ? `<div class="script-list">${boardPosts.map(renderLibraryBoardPostRow).join('\n')}</div>` : `<div class="notice"><strong>No Library Board guides yet:</strong> This board is ready for future Creator Library guidance.</div>`}
        </section>`;
}

function renderLibraryBoardCrossroads({ latestScripts, guideLinks, popularStories }) {
  return `<section class="home-crossroads library-board-crossroads" aria-label="Library Board crossroads">
          <div class="section-head"><h2>Creator Roads</h2><span>Board guidance should connect both ways</span></div>
          <div class="home-crossroad-grid">
            <article>
              <p class="category-group-label">Creator Library</p>
              <h3><a href="/scripts/">Move from guide context into script packages</a></h3>
              <p>After the Board explains a format or workflow, the Creator Library should give the visitor real script packages to open immediately.</p>
              <div class="category-links">${latestScripts.slice(0, 3).map((script) => `<a href="/scripts/${escapeAttr(script.slug)}">${escapeHtml(script.title)}</a>`).join('')}</div>
            </article>
            <article>
              <p class="category-group-label">Mystery Board</p>
              <h3><a href="/mystery-board.html">Check source and reading context</a></h3>
              <p>When production choices depend on uncertainty, source limits, or story type, the Mystery Board keeps the archive-reading side available.</p>
              <div class="category-links">${guideLinks.map((guide) => `<a href="/mystery-board/${escapeAttr(guide.slug)}">${escapeHtml(guide.shortTitle || guide.title)}</a>`).join('')}</div>
            </article>
            <article>
              <p class="category-group-label">Original Records</p>
              <h3><a href="/archive.html">Keep roads back to the archive open</a></h3>
              <p>Creator material should point back to original records when a visitor wants the story page instead of the production package.</p>
              <div class="category-links">${popularStories.slice(0, 3).map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}</div>
            </article>
          </div>
        </section>`;
}

function renderLibraryBoardPortalRail({ boardStarters, latestScripts, featuredScript, guideLinks }) {
  return `<aside class="home-portal-rail creator-portal-rail library-board-portal-rail" aria-label="Library Board side paths">
      ${renderKyunolabNetworkCard('scripts')}
      ${featuredScript ? `<section class="rail-card rail-feature"><p class="rail-label">Script package</p><a href="/scripts/${escapeAttr(featuredScript.slug)}"><span>${escapeHtml(featuredScript.genre || 'Creator package')}</span><strong>${escapeHtml(featuredScript.title)}</strong></a></section>` : ''}
      <section class="rail-card">
        <p class="rail-label">Board starters</p>
        ${boardStarters.slice(0, 4).map(renderLibraryBoardSmallLink).join('')}
      </section>
      <section class="rail-card rail-card-subtle">
        <p class="rail-label">Creator paths</p>
        <a href="/scripts/">Creator Library</a>
        <a href="/scripts/categories/">Script Categories</a>
        <a href="/scripts/resources/">Creator Resources</a>
        ${latestScripts.slice(0, 2).map((script) => `<a href="/scripts/${escapeAttr(script.slug)}">${escapeHtml(script.title)}</a>`).join('')}
      </section>
      <section class="rail-card">
        <p class="rail-label">Reading context</p>
        <a href="/archive.html">Original Archive</a>
        <a href="/mystery-board.html">Mystery Board</a>
        ${guideLinks.slice(0, 1).map((guide) => `<a href="/mystery-board/${escapeAttr(guide.slug)}">${escapeHtml(guide.shortTitle || guide.title)}</a>`).join('')}
      </section>
    </aside>`;
}

function pickLibraryBoardPosts(boardPosts, slugs) {
  return slugs.map((slug) => boardPosts.find((post) => post.slug === slug)).filter(Boolean);
}

function renderLibraryBoardPostRow(post) {
  const url = `/scripts/board/${escapeAttr(post.slug)}/`;
  return `<article class="script-row">
        <div><span class="tag">${escapeHtml(post.tag || post.category || 'Library Board')}</span><h3><a href="${url}">${escapeHtml(post.title)}</a></h3></div>
        <p>${escapeHtml(post.excerpt || post.deck || '')}</p>
        <div class="meta">${escapeHtml([post.readTime, `Updated ${formatDate(post.updatedAt || post.publishedAt)}`].filter(Boolean).join(' - '))}</div>
      </article>`;
}

function renderLibraryBoardPostPage(post, boardPosts = []) {
  const canonicalPath = `/scripts/board/${post.slug}/`;
  const sections = post.sections || [];
  const nextPost = boardPosts.find((item) => item.slug !== post.slug) || post;
  const mapItems = sections.map((section) => `<li><a href="#${escapeAttr(section.id)}">${escapeHtml(section.title)}</a></li>`).join('');
  const body = sections.map((section) => `<h2 id="${escapeAttr(section.id)}">${escapeHtml(section.title)}</h2>
${(section.paragraphs || []).map((text) => `<p>${escapeHtml(text)}</p>`).join('\n')}`).join('\n\n');

  return renderPage({
    canonicalPath,
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || post.deck,
    metaDescription: post.metaDescription || post.excerpt || post.deck,
    networkSection: 'scripts',
    content: `  <main class="article-shell article-layout">
    <aside class="article-rail article-rail-left" aria-label="Library Board navigation">
      <div class="rail-card">
        <p class="rail-label">In this guide</p>
        ${sections.map((section) => `<a href="#${escapeAttr(section.id)}">${escapeHtml(section.nav || section.title)}</a>`).join('')}
      </div>
      <div class="rail-card rail-card-subtle">
        <p class="rail-label">Creator paths</p>
        <a href="/scripts/">Creator Library</a>
        <a href="/scripts/categories/">Script Categories</a>
        <a href="/scripts/resources/">Creator Resources</a>
      </div>
    </aside>

    <article>
      <header class="archive-article-header">
        <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/scripts/">Creator Library</a><span aria-hidden="true">/</span><a href="/scripts/board/">Library Board</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(post.title)}</span></nav>
        <p class="label">Library Board</p>
        <h1 class="article-title">${escapeHtml(post.title)}</h1>
        <p class="deck">${escapeHtml(post.deck || post.excerpt || '')}</p>
        <dl class="article-meta-grid">
          <div><dt>Topic</dt><dd>${escapeHtml(post.tag || 'Creator Library')}</dd></div>
          <div><dt>Best for</dt><dd>Creators using Kyunolab script packages</dd></div>
          <div><dt>Read time</dt><dd>${escapeHtml(post.readTime || '3 min read')}</dd></div>
          <div><dt>Updated</dt><dd>${formatDate(post.updatedAt || post.publishedAt)}</dd></div>
        </dl>
      </header>

      <section class="story-map" aria-label="Guide map">
        <h2>Guide Map</h2>
        <ol>${mapItems}</ol>
      </section>

      <div class="story-body archive-entry">
${body}

        <h2>Library Board Note</h2>
        <p>Library Board guides explain how the Creator Library works. Individual production materials remain inside Creator Library script pages.</p>
      </div>
    </article>

    <aside class="article-rail article-rail-right" aria-label="Related creator resources">
      ${renderKyunolabNetworkCard('scripts')}
      <div class="rail-card rail-feature">
        <p class="rail-label">Read next</p>
        <a href="/scripts/board/${escapeAttr(nextPost.slug)}/"><span>${escapeHtml(nextPost.tag || nextPost.category || 'Library Board')}</span><strong>${escapeHtml(nextPost.title)}</strong></a>
      </div>
      <div class="rail-card">
        <p class="rail-label">Library Board</p>
        ${boardPosts.slice(0, 4).map((item) => `<a href="/scripts/board/${escapeAttr(item.slug)}/">${escapeHtml(item.title)}</a>`).join('')}
      </div>
      <div class="rail-card rail-card-subtle">
        <p class="rail-label">Creator paths</p>
        <a href="/scripts/latest/">Latest Scripts</a>
        <a href="/scripts/categories/">Script Categories</a>
        <a href="/scripts/resources/">Creator Resources</a>
      </div>
    </aside>
  </main>`
  });
}

function renderScriptResourcesPage(scripts = creatorScripts) {
  const latestScripts = sortNewest(scripts).slice(0, 5);
  const featuredScript = latestScripts[0] || scripts[0];
  const guideLinks = getHomeGuides([
    'how-to-check-source-status',
    'how-to-build-a-reading-path-through-the-strange-archive',
    'how-to-find-internal-link-opportunities-without-forcing-them'
  ]);
  const popularStories = getConfiguredStories(siteConfig.popularStoryIds).slice(0, 4);
  return renderPage({
    canonicalPath: '/scripts/resources/',
    title: 'Creator Guide for Mystery YouTube Scripts | Kyunolab',
    description: 'A practical creator guide for using Kyunolab scripts, categories, source notes, Shorts hooks, image prompts, thumbnails, and video planning resources.',
    metaDescription: 'Creator guide for using Kyunolab mystery YouTube scripts, source notes, Shorts hooks, image prompts, thumbnails, and video planning resources.',
    networkSection: 'scripts',
    footerSection: 'scripts',
    bodyClass: 'home-portal-page',
    headerHtml: renderCreatorPortalHeader('/scripts/resources/'),
    content: `  <main class="home-shell home-portal-shell creator-portal-page creator-resources-portal-page">
    <div class="home-portal-layout">
      <div class="home-main-column">
        ${renderCreatorResourcesPortalLead({ featuredScript, latestScripts })}
        <section class="notice"><strong>Creator Resources purpose:</strong> This page is the working guide between archive records and creator packages. It helps visitors choose a format, keep source boundaries clear, and move into scripts without losing the original story context.</section>
        ${renderAdSlot('ad-creator-resources-after-intro')}
        ${renderCreatorResourcesWorkflowDesk()}
        ${renderCreatorResourcesPathBlocks({ guideLinks, latestScripts, popularStories })}
        ${renderAdSlot('ad-creator-resources-mid-list')}
        ${renderCreatorResourcesCrossroads({ guideLinks, latestScripts, popularStories })}
      </div>
      ${renderCreatorResourcesPortalRail({ featuredScript, latestScripts, guideLinks, popularStories })}
    </div>
  </main>`
  });
}

function renderCreatorResourcesPortalLead({ featuredScript, latestScripts }) {
  const starters = [
    { label: '01', title: 'Find a script package', href: '/scripts/', detail: 'Start from ready-made longform narration, Shorts hooks, prompts, and thumbnails.' },
    { label: '02', title: 'Choose the right format', href: '/scripts/board/', detail: 'Use Library Board guides before deciding how a topic should become a video.' },
    { label: '03', title: 'Keep sources clear', href: '/fiction-disclaimer.html', detail: 'Separate original records from creator-facing adaptations and production notes.' },
    { label: '04', title: 'Browse creator shelves', href: '/scripts/categories/', detail: 'Move by script category when the visitor already knows the subject area.' },
    { label: '05', title: 'Return to archive context', href: '/archive.html', detail: 'Open the original reading side when a topic needs story context first.' }
  ];
  return `<section class="home-portal-lead creator-resources-portal-lead" aria-label="Creator Resources front entrance">
          <article class="home-lead-story">
            <p class="label">Creator Resources Guide Desk</p>
            <h1>Use the archive without confusing story and script.</h1>
            <p>Creator Resources explains how to choose packages, read source notes, adapt narration, and connect scripts back to the Mystery Archive before production begins.</p>
            ${featuredScript ? `<a class="button" href="/scripts/${escapeAttr(featuredScript.slug)}">Open a script package</a>` : '<a class="button" href="/scripts/">Open Creator Library</a>'}
          </article>
          <div class="home-known-list creator-resources-starter-list">
            <h2>Start with creator workflow</h2>
            ${starters.map((item) => `<a href="${item.href}"><span>${item.label}</span><strong>${escapeHtml(item.title)}</strong><em>${escapeHtml(item.detail)}</em></a>`).join('')}
          </div>
        </section>`;
}

function renderCreatorResourcesWorkflowDesk() {
  const rows = [
    { label: 'Package', title: 'Find the ready-made production material', href: '/scripts/' },
    { label: 'Format', title: 'Choose longform, Shorts, prompts, or a full video package', href: '/scripts/board/how-to-choose-between-long-form-and-short-form-scripts/' },
    { label: 'Source', title: 'Check the boundary between archive record and adaptation', href: '/scripts/board/how-original-archive-records-and-creator-scripts-stay-separate/' },
    { label: 'Shelf', title: 'Use categories when browsing by topic or creator need', href: '/scripts/categories/' }
  ];
  return `<section class="home-headline-desk creator-resources-workflow-desk" aria-label="Creator Resources workflow desk">
          <div class="section-head"><h2>Workflow Desk</h2><span>What to do before production</span></div>
          <div class="headline-desk-grid">
            <div class="headline-list">${rows.map((row) => `<a class="home-headline-row creator-resource-row" href="${row.href}"><span>${escapeHtml(row.label)}</span><strong>${escapeHtml(row.title)}</strong></a>`).join('')}</div>
            <aside class="home-context-card">
              <p class="label">Adaptation note</p>
              <h3>Stories, scripts, and prompts have different jobs.</h3>
              <p>The Mystery Archive keeps the reading record. Creator Library pages turn selected material into production aids for narration, pacing, Shorts hooks, visual prompts, and thumbnail planning.</p>
              <div class="category-links"><a href="/scripts/board/">Library Board</a><a href="/scripts/categories/">Script Categories</a><a href="/archive.html">Original Archive</a></div>
            </aside>
          </div>
        </section>`;
}

function renderCreatorResourcesPathBlocks({ guideLinks, latestScripts, popularStories }) {
  const groups = [
    {
      title: 'Before choosing a script',
      deck: 'Use these routes when a visitor needs the structure of the Creator Library before opening a package.',
      links: [
        { title: 'Free Mystery YouTube Scripts', href: '/scripts/' },
        { title: 'Library Board', href: '/scripts/board/' },
        { title: 'Script Categories', href: '/scripts/categories/' }
      ]
    },
    {
      title: 'Before adapting a story',
      deck: 'Keep source status, uncertainty, and reading paths available when a script package is based on an archive topic.',
      links: [
        { title: 'Story and Source Notice', href: '/fiction-disclaimer.html' },
        ...guideLinks.slice(0, 2).map((guide) => ({ title: guide.shortTitle || guide.title, href: `/mystery-board/${guide.slug}` }))
      ]
    },
    {
      title: 'After choosing a topic',
      deck: 'Move into real packages and original records so the guide page does not become a dead end.',
      links: [
        ...latestScripts.slice(0, 2).map((script) => ({ title: script.title, href: `/scripts/${script.slug}` })),
        ...popularStories.slice(0, 1).map((story) => ({ title: story.title, href: `/stories/${story.slug}` }))
      ]
    }
  ];
  return `<section class="home-reader-paths creator-resources-paths" aria-label="Creator Resources paths">
          <div class="section-head"><h2>Creator Resource Paths</h2><span>Guides that lead into real pages</span></div>
          <div class="home-path-grid">${groups.map((group) => `<article>
            <h3>${escapeHtml(group.title)}</h3>
            <p>${escapeHtml(group.deck)}</p>
            <div class="category-links">${group.links.map((link) => `<a href="${escapeAttr(link.href)}">${escapeHtml(link.title)}</a>`).join('')}</div>
          </article>`).join('')}</div>
        </section>`;
}

function renderCreatorResourcesCrossroads({ guideLinks, latestScripts, popularStories }) {
  return `<section class="home-crossroads creator-resources-crossroads" aria-label="Creator Resources crossroads">
          <div class="section-head"><h2>Archive, Board, and Package Roads</h2><span>Creator help should connect both ways</span></div>
          <div class="home-crossroad-grid">
            <article>
              <p class="category-group-label">Creator Library</p>
              <h3><a href="/scripts/">Open packages after reading the guide</a></h3>
              <p>Resources should help visitors act, not only explain. The next step is a script page, category shelf, or featured package.</p>
              <div class="category-links">${latestScripts.slice(0, 3).map((script) => `<a href="/scripts/${escapeAttr(script.slug)}">${escapeHtml(script.title)}</a>`).join('')}</div>
            </article>
            <article>
              <p class="category-group-label">Mystery Board</p>
              <h3><a href="/mystery-board.html">Use source-aware reading guides</a></h3>
              <p>When a production choice depends on source status, motif, or archive path, the Board keeps the reading side close.</p>
              <div class="category-links">${guideLinks.map((guide) => `<a href="/mystery-board/${escapeAttr(guide.slug)}">${escapeHtml(guide.shortTitle || guide.title)}</a>`).join('')}</div>
            </article>
            <article>
              <p class="category-group-label">Original Records</p>
              <h3><a href="/archive.html">Return to the story before adapting it</a></h3>
              <p>The archive road keeps creator material attached to actual story pages when a visitor wants context before production.</p>
              <div class="category-links">${popularStories.slice(0, 3).map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}</div>
            </article>
          </div>
        </section>`;
}

function renderCreatorResourcesPortalRail({ featuredScript, latestScripts, guideLinks, popularStories }) {
  return `<aside class="home-portal-rail creator-portal-rail creator-resources-portal-rail" aria-label="Creator Resources side paths">
      ${renderKyunolabNetworkCard('scripts')}
      ${featuredScript ? `<section class="rail-card rail-feature"><p class="rail-label">Start with a package</p><a href="/scripts/${escapeAttr(featuredScript.slug)}"><span>${escapeHtml(featuredScript.genre || 'Creator package')}</span><strong>${escapeHtml(featuredScript.title)}</strong></a></section>` : ''}
      <section class="rail-card">
        <p class="rail-label">Creator workflow</p>
        <a href="/scripts/">Free Mystery YouTube Scripts</a>
        <a href="/scripts/categories/">Script Categories</a>
        <a href="/scripts/board/">Library Board</a>
        <a href="/fiction-disclaimer.html">Story and source notice</a>
      </section>
      <section class="rail-card rail-card-subtle">
        <p class="rail-label">Latest packages</p>
        ${latestScripts.slice(0, 3).map((script) => `<a href="/scripts/${escapeAttr(script.slug)}">${escapeHtml(script.title)}</a>`).join('')}
      </section>
      <section class="rail-card">
        <p class="rail-label">Reading context</p>
        <a href="/archive.html">Original Archive</a>
        <a href="/mystery-board.html">Mystery Board</a>
        ${guideLinks.slice(0, 1).map((guide) => `<a href="/mystery-board/${escapeAttr(guide.slug)}">${escapeHtml(guide.shortTitle || guide.title)}</a>`).join('')}
      </section>
      <section class="rail-card rail-card-subtle">
        <p class="rail-label">Original records</p>
        ${popularStories.slice(0, 3).map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}
      </section>
    </aside>`;
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
  const createArea = renderCreatorPack(script);
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
  })).concat(libraryBoardPosts.map((post) => ({
    id: post.id || post.slug,
    slug: post.slug,
    title: post.title,
    url: `/scripts/board/${post.slug}/`,
    category: post.category || 'Library Board',
    scriptType: 'Library Board',
    summary: post.excerpt || post.deck || post.metaDescription || '',
    description: post.metaDescription || post.excerpt || post.deck || '',
    tags: post.tags || [post.tag].filter(Boolean),
    motif: post.tag || 'Creator Library guide',
    topics: [
      post.category,
      post.tag,
      ...(post.sections || []).map((section) => section.title)
    ].filter(Boolean)
  })));

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

function isStandardCreatorPack(entry) {
  return entry?.creatorPipelineVersion === 'single-path-v1';
}

function renderCreatorPack(entry) {
  validateCreatorPackForRender(entry);
  return renderStandardCreatorPack(entry);
}

function validateCreatorPackForRender(entry) {
  const slug = entry.slug || '';
  if (!isStandardCreatorPack(entry)) {
    throwCreatorRenderError({
      slug,
      section: 'entry',
      field: 'creatorPipelineVersion',
      message: 'Creator Pack renderer only supports single-path-v1 entries.'
    });
  }
  const longScenes = entry.visualGuide;
  requireStoredField(entry, 'runtimePlan', { slug, section: 'longForm' });
  for (const field of ['totalWordCount', 'narrationReadSeconds', 'finalVideoSeconds']) {
    requireStoredField(entry.runtimePlan, field, { slug, section: 'longForm', field });
  }
  if (!Array.isArray(longScenes) || longScenes.length !== 5) {
    throwCreatorRenderError({ slug, section: 'longForm', field: 'visualGuide', message: 'Standard Creator Pack requires exactly 5 long-form scenes.' });
  }
  longScenes.forEach((scene, sceneIndex) => {
    for (const field of ['sceneRole', 'sceneFocus', 'backgroundMusic', 'voiceDirection', 'soundEffect', 'visualDirection']) {
      requireStoredField(scene, field, { slug, section: 'longForm', sceneIndex: sceneIndex + 1, field });
    }
    const parts = scene.narrationParts;
    if (!Array.isArray(parts) || parts.length !== 2) {
      throwCreatorRenderError({ slug, section: 'longForm', sceneIndex: sceneIndex + 1, field: 'narrationParts', message: 'Standard long-form Scene requires exactly 2 Narration Parts.' });
    }
    parts.forEach((part, partIndex) => {
      for (const field of ['narration', 'creatorNote', 'estimatedReadingTime']) {
        requireStoredField(part, field, { slug, section: 'longForm', sceneIndex: sceneIndex + 1, partIndex: partIndex + 1, field });
      }
      const beats = part.visualBeats;
      if (!Array.isArray(beats) || beats.length < 1) {
        throwCreatorRenderError({ slug, section: 'longForm', sceneIndex: sceneIndex + 1, partIndex: partIndex + 1, field: 'visualBeats', message: 'Standard long-form Narration Part requires at least 1 Visual Beat.' });
      }
      beats.forEach((beat, beatIndex) => {
        for (const field of ['imagePrompt', 'motionPrompt']) {
          requireStoredField(beat, field, { slug, section: 'longForm', sceneIndex: sceneIndex + 1, partIndex: partIndex + 1, beatIndex: beatIndex + 1, field });
        }
      });
    });
  });

  const shortForm = entry.shortForm;
  requireStoredField(shortForm, 'scenes', { slug, section: 'shortForm', field: 'scenes' });
  for (const field of ['totalWordCount', 'narrationReadSeconds', 'finalVideoSeconds']) {
    requireStoredField(shortForm, field, { slug, section: 'shortForm', field });
  }
  if (!Array.isArray(shortForm.scenes) || shortForm.scenes.length !== 5) {
    throwCreatorRenderError({ slug, section: 'shortForm', field: 'scenes', message: 'Standard Creator Pack requires exactly 5 short-form scenes.' });
  }
  shortForm.scenes.forEach((scene, sceneIndex) => {
    for (const field of ['role', 'narration', 'sceneFocus', 'imagePrompt', 'motionPrompt', 'backgroundMusic', 'voiceDirection', 'soundEffect', 'estimatedReadSeconds']) {
      requireStoredField(scene, field, { slug, section: 'shortForm', sceneIndex: sceneIndex + 1, field });
    }
  });

  validateCompatibleFieldsForRender(entry);
  return true;
}

function validateCompatibleFieldsForRender(entry) {
  const slug = entry.slug || '';
  const longImagePrompts = entry.visualGuide
    .flatMap((scene) => scene.narrationParts || [])
    .flatMap((part) => part.visualBeats || [])
    .map((beat) => beat.imagePrompt);
  const longMotionPrompts = entry.visualGuide
    .flatMap((scene) => scene.narrationParts || [])
    .flatMap((part) => part.visualBeats || [])
    .map((beat) => beat.motionPrompt);
  const shortNarration = entry.shortForm.scenes.map((scene) => scene.narration);
  const shortFocuses = entry.shortForm.scenes.map((scene) => scene.sceneFocus);
  assertCompatibleArray(entry.imagePrompts, longImagePrompts, { slug, section: 'longForm', field: 'imagePrompts' });
  assertCompatibleArray(entry.motionPrompts, longMotionPrompts, { slug, section: 'longForm', field: 'motionPrompts' });
  assertCompatibleArray(entry.shortsScript, shortNarration, { slug, section: 'shortForm', field: 'shortsScript' });
  assertCompatibleArray(entry.shortSceneFocuses, shortFocuses, { slug, section: 'shortForm', field: 'shortSceneFocuses' });
}

function assertCompatibleArray(actual, expected, context) {
  if (actual === undefined) return;
  if (JSON.stringify(actual) === JSON.stringify(expected)) return;
  const error = new Error(`Creator render data mismatch: ${context.field}`);
  error.code = 'CREATOR_RENDER_DATA_MISMATCH';
  Object.assign(error, context);
  throw error;
}

function requireStoredField(source, field, context) {
  if (!source || !hasStoredProductionValue(source[field])) {
    throwCreatorRenderError({ ...context, field });
  }
}

function throwCreatorRenderError(context) {
  const error = new Error(context.message || `Creator render data missing: ${context.field}`);
  error.code = 'CREATOR_RENDER_DATA_MISSING';
  Object.assign(error, context);
  throw error;
}

function buildCreatorRenderModel(entry) {
  validateCreatorPackForRender(entry);
  return {
    slug: entry.slug || '',
    title: entry.title || '',
    pipelineVersion: entry.creatorPipelineVersion,
    longForm: {
      runtime: {
        totalWordCount: entry.runtimePlan.totalWordCount,
        narrationReadSeconds: entry.runtimePlan.narrationReadSeconds,
        finalVideoSeconds: entry.runtimePlan.finalVideoSeconds,
        narrationReadTime: entry.runtimePlan.narrationReadTime,
        estimatedFinalRuntime: entry.runtimePlan.estimatedFinalRuntime
      },
      scenes: entry.visualGuide.map((scene, sceneIndex) => ({
        sceneIndex: sceneIndex + 1,
        role: scene.sceneRole,
        sceneFocus: scene.sceneFocus,
        backgroundMusic: scene.backgroundMusic,
        voiceDirection: scene.voiceDirection,
        soundEffect: scene.soundEffect,
        visualDirection: scene.visualDirection,
        narrationParts: scene.narrationParts.map((part, partIndex) => ({
          partIndex: partIndex + 1,
          narration: part.narration,
          readingTime: part.estimatedReadingTime,
          creatorNote: part.creatorNote,
          visualBeats: part.visualBeats.map((beat, beatIndex) => ({
            beatIndex: beatIndex + 1,
            label: beat.label || `Image Prompt ${beatIndex + 1}`,
            imagePrompt: beat.imagePrompt,
            motionPrompt: beat.motionPrompt
          }))
        }))
      }))
    },
    shortForm: {
      runtime: {
        totalWordCount: entry.shortForm.totalWordCount,
        narrationReadSeconds: entry.shortForm.narrationReadSeconds,
        finalVideoSeconds: entry.shortForm.finalVideoSeconds
      },
      scenes: entry.shortForm.scenes.map((scene, sceneIndex) => ({
        sceneIndex: scene.sceneIndex || sceneIndex + 1,
        role: scene.role,
        narration: scene.narration,
        sceneFocus: scene.sceneFocus,
        imagePrompt: scene.imagePrompt,
        motionPrompt: scene.motionPrompt,
        backgroundMusic: scene.backgroundMusic,
        voiceDirection: scene.voiceDirection,
        soundEffect: scene.soundEffect,
        estimatedReadSeconds: scene.estimatedReadSeconds
      }))
    },
    copySources: {
      longNarration: entry.visualGuide.flatMap((scene) => scene.narrationParts || []).map((part) => part.narration),
      creatorNotes: entry.visualGuide.flatMap((scene) => scene.narrationParts || []).map((part) => part.creatorNote),
      imagePrompts: entry.visualGuide.flatMap((scene) => scene.narrationParts || []).flatMap((part) => part.visualBeats || []).map((beat) => beat.imagePrompt),
      motionPrompts: entry.visualGuide.flatMap((scene) => scene.narrationParts || []).flatMap((part) => part.visualBeats || []).map((beat) => beat.motionPrompt),
      shortNarration: entry.shortForm.scenes.map((scene) => scene.narration)
    }
  };
}

function renderStandardCreatorPack(entry) {
  const model = buildCreatorRenderModel(entry);
  return `<section class="script-material creator-format creator-format-long">
        <h2>Long-form Creator</h2>
        ${renderStandardLongFormCreator(model)}
      </section>
      <section class="script-material creator-format creator-format-short">
        <h2>Short-form Creator</h2>
        ${renderStandardShortFormCreator(model)}
      </section>`;
}

function renderStandardLongFormCreator(model) {
  const productionCopyAvailability = {
    creatorNotes: model.copySources.creatorNotes.length > 0,
    imagePrompts: model.copySources.imagePrompts.length > 0,
    motionPrompts: model.copySources.motionPrompts.length > 0
  };
  const runtimeLabel = `${formatSecondsLabel(model.longForm.runtime.finalVideoSeconds)} (${model.longForm.runtime.finalVideoSeconds} sec final) / ${formatSecondsLabel(model.longForm.runtime.narrationReadSeconds)} (${model.longForm.runtime.narrationReadSeconds} sec narration)`;
  const sceneCards = model.longForm.scenes.map((scene) => renderProductionSceneCard({
    number: scene.sceneIndex,
    duration: `Stored runtime: ${runtimeLabel}`,
    narration: scene.narrationParts.map((part) => part.narration).join('\n\n'),
    narrationParts: scene.narrationParts,
    format: 'long',
    strictStored: true,
    sceneRole: scene.role,
    imagePrompt: '',
    sceneFocus: scene.sceneFocus,
    voiceDirection: scene.voiceDirection,
    soundEffect: scene.soundEffect,
    music: scene.backgroundMusic,
    visualDirection: scene.visualDirection,
    advanced: standardAdvancedProductionInfo(scene)
  })).join('');

  return `${renderNarrationCopyAction('long', 'Copy Full Long-form Narration', productionCopyAvailability)}<div class="script-prompt-list" data-narration-format="long">${sceneCards}</div>`;
}

function renderStandardShortFormCreator(model) {
  const sceneCards = model.shortForm.scenes.map((scene) => renderProductionSceneCard({
    number: scene.sceneIndex,
    duration: `${formatApproxSeconds(scene.estimatedReadSeconds)} read / ${formatSecondsLabel(model.shortForm.runtime.finalVideoSeconds)} final video`,
    narration: scene.narration,
    narrationParts: [],
    format: 'short',
    strictStored: true,
    plainReadingTime: formatApproxSeconds(scene.estimatedReadSeconds),
    sceneRole: scene.role,
    imagePrompt: scene.imagePrompt,
    sceneFocus: scene.sceneFocus,
    voiceDirection: scene.voiceDirection,
    soundEffect: scene.soundEffect,
    music: scene.backgroundMusic,
    visualDirection: scene.motionPrompt,
    advanced: {
      motionPrompt: scene.motionPrompt,
      soundEffect: scene.soundEffect,
      voiceDirection: scene.voiceDirection,
      cameraNotes: '',
      transitionNotes: '',
      negativePrompt: ''
    }
  })).join('');

  return `${renderNarrationCopyAction('short', 'Copy Full Short-form Narration')}<div class="script-prompt-list" data-narration-format="short">${sceneCards}</div>`;
}

function standardAdvancedProductionInfo(scene) {
  return {
    motionPrompt: scene.narrationParts
      .flatMap((part) => part.visualBeats || [])
      .map((beat) => beat.motionPrompt)
      .filter(Boolean)
      .join(' '),
    soundEffect: scene.soundEffect,
    voiceDirection: scene.voiceDirection,
    cameraNotes: '',
    transitionNotes: '',
    negativePrompt: ''
  };
}

function formatApproxSeconds(seconds) {
  return `≈ ${Number(seconds)} sec`;
}

function formatSecondsLabel(seconds) {
  const total = Number(seconds);
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  if (!minutes) return `${remainder} sec`;
  if (!remainder) return `${minutes} min`;
  return `${minutes} min ${String(remainder).padStart(2, '0')} sec`;
}

function renderNarrationCopyAction(format, label, productionCopies = {}) {
  const buttons = [
    `<button class="narration-copy-button" type="button" data-copy-kind="narration" data-narration-target="${escapeAttr(format)}">${escapeHtml(label)}</button>`
  ];
  if (productionCopies.creatorNotes) buttons.push(`<button class="narration-copy-button" type="button" data-copy-kind="creator-notes" data-narration-target="${escapeAttr(format)}">Copy All Creator Notes</button>`);
  if (productionCopies.imagePrompts) buttons.push(`<button class="narration-copy-button" type="button" data-copy-kind="image-prompts" data-narration-target="${escapeAttr(format)}">Copy All Image Prompts</button>`);
  if (productionCopies.motionPrompts) buttons.push(`<button class="narration-copy-button" type="button" data-copy-kind="motion-prompts" data-narration-target="${escapeAttr(format)}">Copy All Motion Prompts</button>`);
  return `<div class="narration-copy-action">${buttons.join('')}</div>`;
}

function renderProductionSceneCard({ number, duration, narration, narrationParts = [], format, sceneRole: explicitSceneRole, sceneFocus, imagePrompt, voiceDirection, soundEffect, music, visualDirection: direction, advanced, strictStored = false, plainReadingTime = '' }) {
  const advancedId = sceneAdvancedId(number, duration, narration, imagePrompt);
  const sceneRole = strictStored ? explicitSceneRole : (explicitSceneRole || sceneRoleForScene(number - 1, narration, sceneFocus));
  const hasPartVisuals = narrationParts.some((part) => Array.isArray(part.visualBeats) && part.visualBeats.length);
  const focusHtml = strictStored
    ? `<p class="scene-field scene-focus"><strong>Scene Focus:</strong> ${escapeHtml(sceneFocus)}</p>`
    : `<p class="scene-field scene-focus"><strong>Scene Focus:</strong> ${escapeHtml(sceneFocus || 'A clear, readable moment from the story.')}</p>`;
  const imagePromptHtml = hasPartVisuals
    ? ''
    : strictStored
      ? (imagePrompt ? `<p class="scene-field scene-image-prompt"><strong>Image Prompt:</strong> ${escapeHtml(imagePrompt)}</p>` : '')
      : `<p class="scene-field scene-image-prompt"><strong>Image Prompt:</strong> ${escapeHtml(imagePrompt || 'A quiet mystery scene shows one clear subject in a readable space, with soft low-key lighting and a restrained documentary feeling. The image should feel realistic, calm, and slightly unsettling without gore or exaggerated horror.')}</p>`;
  const voiceHtml = strictStored
    ? `<p class="scene-field scene-voice-direction"><strong>Voice Direction:</strong> ${escapeHtml(voiceDirection)}</p>`
    : `<p class="scene-field scene-voice-direction"><strong>Voice Direction:</strong> ${escapeHtml(voiceDirection || voiceDirectionForScene(narration, number, format))}</p>`;
  const productionFields = [
    focusHtml,
    imagePromptHtml,
    voiceHtml,
    `<p class="scene-field scene-music"><strong>Recommended Background Music:</strong> ${escapeHtml(music)}</p>`,
    soundEffect ? `<p class="scene-field scene-sound-effect"><strong>Sound Effect:</strong> ${escapeHtml(soundEffect)}</p>` : '',
    `<p class="scene-field scene-editing-guide"><strong>Editing Guide:</strong> ${escapeHtml(direction)}</p>`
  ].filter(Boolean).join('\n');
  const narrationHtml = narrationParts.length
    ? renderNarrationParts(narration, narrationParts)
    : strictStored
      ? renderPlainNarration(narration, number - 1, format, { strictStored, readingTime: plainReadingTime })
      : renderPlainNarration(narration, number - 1, format);
  return `<article class="scene-workspace">
          <h3>Scene ${number}</h3>
          <div class="scene-workspace-meta">
            <p><strong>Scene Role:</strong> ${escapeHtml(sceneRole)}</p>
            <p><strong>Estimated Playback Time:</strong> ${escapeHtml(duration)}</p>
          </div>
          ${narrationHtml}
          <div class="scene-production-fields">
            ${productionFields}
          </div>
          ${renderAdvancedProductionPanel(advancedId, advanced)}
        </article>`;
}

function renderPlainNarration(narration, sceneIndex, format, options = {}) {
  const text = narration || 'Use a short, complete narration line that can be read directly in the video.';
  if (options.strictStored) {
    return `<div class="scene-narration-single">
            <p class="scene-narration"><strong>Narration:</strong> ${escapeHtml(text)}</p>
            <p class="narration-part-time"><strong>Estimated Reading Time:</strong> ${escapeHtml(options.readingTime)}</p>
          </div>`;
  }
  return `<div class="scene-narration-single">
            <p class="scene-narration"><strong>Narration:</strong> ${escapeHtml(text)}</p>
            <p class="narration-part-voice"><strong>Voice Direction:</strong> ${escapeHtml(voiceDirectionForNarrationPart(sceneIndex, 0, format, text))}</p>
            <p class="narration-part-time"><strong>Estimated Reading Time:</strong> ${escapeHtml(estimatedReadingTime(text))}</p>
          </div>`;
}

function renderNarrationParts(narration, parts) {
  const copyText = parts.map((part) => part.narration).filter(Boolean).join('\n\n');
  return `<div class="scene-narration-parts">
            <p class="scene-narration scene-narration-copy-source" hidden><strong>Narration:</strong> ${escapeHtml(copyText)}</p>
            ${parts.map(renderNarrationPart).join('')}
          </div>`;
}

function renderNarrationPart(part, index) {
  const fields = [
    `<h4>Narration Part ${index + 1}</h4>`,
    `<p class="narration-part-script"><strong>Narration:</strong> ${escapeHtml(part.narration)}</p>`,
    `<button class="narration-part-copy-button narration-field-copy-button" type="button" data-copy-field="narration">Copy Narration</button>`,
    `<p class="narration-part-time"><strong>Estimated Reading Time:</strong> ${escapeHtml(part.readingTime)}</p>`,
    part.creatorNote ? `<p class="narration-part-note"><strong>Creator Note:</strong> ${escapeHtml(part.creatorNote)}</p>` : '',
    part.creatorNote ? `<button class="narration-part-copy-button narration-field-copy-button" type="button" data-copy-field="creator-note">Copy Creator Note</button>` : '',
    renderVisualBeats(part.visualBeats)
  ].filter(Boolean).join('\n');
  return `<section class="narration-part">${fields}</section>`;
}

function narrationPartsForScene(parts, sceneIndex, format) {
  return parts
    .flatMap((part) => normalizeNarrationPartInput(part))
    .filter(Boolean)
    .map((part, partIndex) => ({
      ...part,
      narration: part.narration,
      readingTime: part.readingTime || part.estimatedReadingTime || estimatedReadingTime(part.narration),
      visualBeats: normalizeVisualBeats(part.visualBeats),
      creatorNote: part.creatorNote || '',
      voiceDirection: part.voiceDirection || voiceDirectionForNarrationPart(sceneIndex, partIndex, format, part.narration)
    }));
}

function normalizeNarrationPartInput(part) {
  if (typeof part === 'string') {
    return splitNarrationPart(part).map((narration) => ({ narration }));
  }
  if (!part || typeof part !== 'object') return [];
  const narration = String(part.narration || '').trim();
  if (!narration) return [];
  return [{
    narration,
    estimatedReadingTime: part.estimatedReadingTime,
    readingTime: part.readingTime,
    creatorNote: part.creatorNote,
    visualBeats: part.visualBeats,
    voiceDirection: part.voiceDirection
  }];
}

function normalizeVisualBeats(beats) {
  if (!Array.isArray(beats)) return [];
  return beats
    .map((beat) => {
      if (typeof beat === 'string') return { imagePrompt: beat };
      if (!beat || typeof beat !== 'object') return null;
      return {
        label: beat.label || beat.title || '',
        imagePrompt: beat.imagePrompt || beat.aiImagePrompt || beat.prompt || '',
        motionPrompt: beat.motionPrompt || beat.beatMotion || ''
      };
    })
    .filter((beat) => beat && beat.imagePrompt);
}

function renderVisualBeats(beats = []) {
  if (!beats.length) return '';
  const beatHtml = beats.map((beat, index) => {
    const fields = [
      `<p class="visual-beat-image-prompt"><span>${escapeHtml(beat.label || `Image Prompt ${index + 1}`)}:</span> ${escapeHtml(beat.imagePrompt)}</p>`,
      `<button class="narration-part-copy-button narration-field-copy-button" type="button" data-copy-field="image-prompt">Copy Image Prompt</button>`,
      beat.motionPrompt ? `<p class="visual-beat-motion-prompt"><span>Beat Motion:</span> ${escapeHtml(beat.motionPrompt)}</p>` : '',
      beat.motionPrompt ? `<button class="narration-part-copy-button narration-field-copy-button" type="button" data-copy-field="motion-prompt">Copy Motion Prompt</button>` : ''
    ].filter(Boolean).join('\n');
    return `<div class="visual-beat">${fields}</div>`;
  }).join('');
  return `<div class="visual-beats">
              <strong>Visual Beats:</strong>
              ${beatHtml}
            </div>`;
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
  const seconds = estimatedNarrationSecondsFromText(narration);
  return `≈ ${seconds} sec`;
}

function estimatedNarrationSecondsFromText(narration) {
  const wordCount = String(narration || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(8, Math.round(wordCount / 2.35));
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

function sceneEstimatedDuration(script, sceneCount, index, format, narration = '') {
  if (format === 'short') {
    const readSeconds = estimatedNarrationSecondsFromText(narration);
    const min = Math.max(5, readSeconds);
    const max = Math.min(60, min + 2);
    return `${min}-${max} seconds`;
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
  if (/wild hunt|ghostly riders|hounds|hoofbeats|hunting horns/.test(haystack)) {
    return format === 'short'
      ? 'Winter Wind, Low Drone, Distant Horns'
      : 'Dark Folk Ambient, Winter Wind, Distant Horns, Low Drone';
  }
  if (/shambhala|kalachakra|hidden kingdom|buddhist|sacred geography/.test(haystack)) {
    return format === 'short'
      ? 'Meditative Drone, Cold Wind, Distant Bells'
      : 'Contemplative Ambient, Cold Mountain Wind, Distant Monastery Bells';
  }
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

function storedBackgroundMusicForScene(item) {
  const value = item?.backgroundMusic || item?.recommendedBackgroundMusic || item?.music;
  if (!hasStoredProductionValue(value)) return '';
  return Array.isArray(value) ? value.filter(Boolean).join(', ') : String(value).trim();
}

function sceneFocusForScene({ script, index, format, narration, imagePrompt }) {
  const context = `${script.title || ''} ${script.genre || ''} ${script.deck || ''} ${(script.tags || []).join(' ')} ${narration || ''} ${imagePrompt || ''}`.toLowerCase();
  const isShort = format === 'short';

  if (isVideoWatchHistoryContext(context)) {
    const focuses = [
      'A normal watch history entry contains one impossible second.',
      'The platform record turns a tiny timing mismatch into a folklore object.',
      'Screenshots and metadata carry the mystery without adding a monster.',
      'The anomaly stays unsettling because it remains small and specific.'
    ];
    return focuses[index] || 'The digital trace keeps the question alive.';
  }
  if (isSubwayMaintenanceContext(context)) {
    const focuses = [
      'A sealed staircase becomes real through a maintenance file.',
      'The station diagram makes the contradiction easy to see.',
      'The underground passage feels strange because the record treats it as routine.',
      'The location remains unresolved after the file and staircase are compared.'
    ];
    return focuses[index] || 'The sealed public space becomes the center of the mystery.';
  }

  if (/woman in white|roadside|dark road|driver|passenger|headlight/.test(context)) {
    const focuses = [
      'A lonely figure appears before the legend turns supernatural.',
      'The ride becomes too quiet before anything impossible happens.',
      'The empty seat turns a simple ride into an impossible absence.',
      'The road feels ordinary again after the disappearance.'
    ];
    return focuses[index] || 'The roadside encounter leaves one missing detail behind.';
  }
  if (/cursed image|cursed images|blurry|strange object/.test(context)) {
    const focuses = [
      'One ordinary detail feels wrong before the image explains nothing.',
      'The image should make the audience search for missing context.',
      'The frame leaves enough visual space for an unfinished story.',
      'The final image should linger because it refuses to explain itself.'
    ];
    return focuses[index] || 'The audience should feel that a normal image is hiding an unfinished story.';
  }
  if (/backrooms|liminal|yellow walls|fluorescent|hallway|corridor/.test(context)) {
    const focuses = [
      'The room looks familiar before it begins to feel inescapable.',
      'The hallway should make the audience question where the exit went.',
      'A familiar interior becomes impossible to leave.',
      'The stillness should make the space feel larger than the frame.'
    ];
    return focuses[index] || 'The audience should feel that the empty space continues beyond what they can see.';
  }
  if (isDragonContext(context)) {
    const focuses = [
      'Different dragons carry different cultural meanings.',
      'The dragon image connects to stone, storm, or sacred power.',
      'The audience should read the dragon as a symbol of weather, water, danger, or order.',
      'The creature should feel like a cultural symbol, not just a monster.'
    ];
    return focuses[index] || 'The dragon becomes a sign of power shaped by culture.';
  }

  return isShort
    ? 'The short-form beat is clear immediately.'
    : 'The scene carries one clear emotional idea.';
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

function advancedProductionInfo({ script, number, format, narration, imagePrompt, storedSoundEffect, storedVoiceDirection }) {
  const context = `${script.title || ''} ${script.genre || ''} ${script.deck || ''} ${(script.tags || []).join(' ')} ${narration || ''} ${imagePrompt || ''}`.toLowerCase();
  const prompt = imagePrompt || 'A quiet mystery scene shows one clear subject in a readable space, with soft low-key lighting and a restrained documentary feeling.';
  return {
    motionPrompt: motionPromptForScene(prompt, context, format),
    soundEffect: hasStoredProductionValue(storedSoundEffect) ? storedSoundEffect : soundEffectForScene(context),
    voiceDirection: hasStoredProductionValue(storedVoiceDirection) ? storedVoiceDirection : voiceDirectionForScene(context, number, format),
    cameraNotes: cameraNotesForScene(context, number, format),
    transitionNotes: transitionNotesForScene(context, number, format),
    negativePrompt: negativePromptForScene(context)
  };
}

function motionPromptForScene(imagePrompt, context, format) {
  const cameraMove = format === 'short' ? 'a slow push-in with steady vertical framing' : 'a slow cinematic push-in with gentle atmospheric movement';
  const basePrompt = String(imagePrompt || '').replace(/[.]+$/g, '');
  if (isVideoWatchHistoryContext(context)) {
    return `${basePrompt}. Push in slowly toward the mismatched timestamp, keep the screen interface steady, and let the playback bar or metadata become the only moving focus. Keep it subtle and realistic.`;
  }
  if (isSubwayMaintenanceContext(context)) {
    return `${basePrompt}. Move slowly toward the sealed staircase, add a faint shift in platform light, and let the camera hold on the maintenance file or station diagram before fading. Keep the motion grounded in transit infrastructure.`;
  }
  if (isWildHuntContext(context)) {
    return `${basePrompt}. Add storm clouds moving across the night sky, ghostly riders crossing the frame, faint hounds below them, and ${cameraMove}. Keep the motion restrained, cold, and folkloric.`;
  }
  if (isShambhalaContext(context)) {
    return `${basePrompt}. Add slow cloud movement around mountain passes, a subtle reveal of hidden valleys, gentle movement in prayer flags or manuscript pages, and ${cameraMove}. Keep the motion calm, respectful, and contemplative.`;
  }
  if (/\broad\b|roadside|\bcar\b|driver|headlight|traffic|woman in white|ghost/.test(context)) {
    return `${basePrompt}. Add subtle drifting fog, faint headlight movement, and ${cameraMove}. Keep the motion quiet, realistic, and suspenseful.`;
  }
  if (/backrooms|liminal|yellow walls|endless hallway|fluorescent/.test(context)) {
    return `${basePrompt}. Let the fluorescent lights flicker softly, add a barely noticeable handheld drift, and move the camera slowly forward through the empty space.`;
  }
  if (isDragonContext(context)) {
    return `${basePrompt}. Add slow cloud movement, gentle scale or silhouette motion, and a smooth camera drift that makes the scene feel ancient and cinematic.`;
  }
  return `${basePrompt}. Add restrained environmental movement and ${cameraMove}. Keep the subject readable and the atmosphere mysterious.`;
}

function soundEffectForScene(context) {
  if (isVideoWatchHistoryContext(context)) {
    return 'soft interface click, playback scrub, low screen-room tone';
  }
  if (isSubwayMaintenanceContext(context)) {
    return 'distant train vibration, station ventilation, metal gate movement, underground corridor ambience';
  }
  if (isWildHuntContext(context)) {
    return 'distant hoofbeats, hunting horns, winter wind, hounds far away';
  }
  if (isShambhalaContext(context)) {
    return 'cold mountain wind, distant monastery bells, soft manuscript pages';
  }
  if (/\broad\b|roadside|\bcar\b|driver|headlight|traffic|woman in white|ghost/.test(context)) {
    return 'distant wind, traffic ambience at night, soft tire noise on wet pavement';
  }
  if (/backrooms|liminal|yellow walls|endless hallway|fluorescent/.test(context)) {
    return 'low mechanical hum, fluorescent light buzz, distant room tone';
  }
  if (isDragonContext(context)) {
    return 'low wind over mountains, distant thunder, deep cinematic rumble';
  }
  if (/door|house|room|empty|silence/.test(context)) {
    return 'room tone, distant wind, subtle floor creak';
  }
  return '';
}

function voiceDirectionForScene(context, number, format) {
  const pace = format === 'short' ? 'short, clear, and direct' : 'slowly, with enough space between sentences';
  if (isVideoWatchHistoryContext(context)) {
    return `Read in a quiet digital-documentary tone, ${pace}. Keep the anomaly precise and avoid making it sound like a jump scare.`;
  }
  if (isSubwayMaintenanceContext(context)) {
    return `Read in a restrained place-mystery tone, ${pace}. Let "sealed staircase", "maintenance file", and "station" land clearly.`;
  }
  if (isWildHuntContext(context)) {
    return `Read in a calm, folkloric, restrained voice, ${pace}. Give slight weight to words such as "horns", "hounds", "winter", and "sky".`;
  }
  if (isShambhalaContext(context)) {
    return `Read in a calm, respectful, contemplative voice, ${pace}. Keep names and Buddhist terms clear without dramatizing them.`;
  }
  if (/woman in white|ghost|road|roadside/.test(context)) {
    return `Read in a quiet, restrained, suspenseful voice, ${pace}. Leave a short pause after visual words such as "white", "empty", and "road".`;
  }
  if (/backrooms|liminal|empty|silence/.test(context)) {
    return `Read in a low, dry, controlled voice, ${pace}. Pause briefly around words such as "empty", "forever", and "ordinary".`;
  }
  if (/\b(myth|mythology|ancient)\b/.test(context)) {
    return `Use a calm documentary tone, ${pace}. Avoid exaggerating cultures or symbols, and only lightly emphasize the key words.`;
  }
  return `${number === 1 ? 'Start calmly' : 'Read with a slightly more focused tone than the previous scene'}. Keep the delivery ${pace}. Pause briefly after important nouns.`;
}

function cameraNotesForScene(context, number, format) {
  if (isVideoWatchHistoryContext(context)) {
    return 'tight screen frame: show the watch history first. slow push-in: move toward the extra second. static hold: keep the metadata readable.';
  }
  if (isSubwayMaintenanceContext(context)) {
    return 'wide corridor frame: show the sealed staircase first. slow pan: move from the maintenance file to the station diagram. hold on the barrier before the transition.';
  }
  if (isWildHuntContext(context)) {
    return 'wide night-sky frame: show the storm first. slow pan: let the riders cross the sky gradually. slight push-in: move toward the ghostly procession.';
  }
  if (isShambhalaContext(context)) {
    return 'slow reveal: begin with the mountain pass, then open toward the hidden valley. gentle push-in: move toward the monastery or manuscript detail.';
  }
  if (/backrooms|hallway|corridor/.test(context)) {
    return 'slow push-in: move very slowly into the scene. subtle handheld movement: add only a small natural camera drift.';
  }
  if (isDragonContext(context)) {
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
  const color = isVideoWatchHistoryContext(context)
      ? 'Use low screen light, muted blue-gray shadows, and restrained contrast.'
      : isSubwayMaintenanceContext(context)
        ? 'Use muted transit green, concrete gray, and low underground light.'
        : isWildHuntContext(context)
          ? 'Use cold blue, storm gray, and low-saturation night tones.'
          : isShambhalaContext(context)
            ? 'Use cold mountain blue, muted gold, and soft low-saturation light.'
            : /backrooms|liminal|digital/.test(context)
              ? 'Keep the yellow light, but lower the saturation and make the image feel colder.'
              : isDragonContext(context) || /\b(myth|mythology)\b/.test(context)
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
  if (isDragonContext(context) || /\bcreature\b/.test(context)) {
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

function isWildHuntContext(context) {
  return /wild hunt|ghostly riders|hunting horns|hoofbeats|hounds|supernatural host/.test(context);
}

function isShambhalaContext(context) {
  return /shambhala|kalachakra|hidden kingdom|buddhist|sacred geography|monastery/.test(context);
}

function isVideoWatchHistoryContext(context) {
  return /video watch history|watch history|impossible second|uploaded clip|platform metadata|playback bar/.test(context);
}

function isSubwayMaintenanceContext(context) {
  return /subway maintenance|sealed staircase|maintenance file|station diagram|underground place/.test(context);
}

function isDragonContext(context) {
  return /\bdragons?\b|\bbasilisk\b|\bcockatrice\b/.test(context);
}

function hasStoredProductionValue(value) {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  return String(value).trim().length > 0;
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
  if (/\b(myth|mythology|creature)\b/.test(haystack) || isDragonContext(haystack)) return 'Mythology and comparative folklore setting';
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

function renderCreatorCategoryCard(category) {
  const categoryPath = `/scripts/categories/${escapeAttr(category.slug)}/`;
  const categoryScripts = scriptsForCreatorCategory(category, creatorScripts);
  const previewLinks = categoryScripts.slice(0, 3).map((script) => `<a href="/scripts/${escapeAttr(script.slug)}">${escapeHtml(script.title)}</a>`).join('');
  const countLabel = `${categoryScripts.length} script package${categoryScripts.length === 1 ? '' : 's'}`;
  return `      <article>
        <p class="category-group-label">${escapeHtml(category.group)}</p>
        <h3><a href="${categoryPath}">${escapeHtml(category.title)}</a></h3>
        <p>${escapeHtml(creatorCategoryDescription(category))}</p>
        <p class="meta">${escapeHtml(countLabel)}</p>
        <div class="category-links">${previewLinks || `<a href="${categoryPath}">Open ${escapeHtml(category.title)} creator page</a>`}</div>
        <a class="text-link" href="${categoryPath}">Open ${escapeHtml(category.title)} creator page</a>
      </article>`;
}

function creatorCategoryDescription(category) {
  if (category.description) return category.description;
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
    'mythic-objects': 'Swords, bells, mirrors, books, charms, relics, and symbolic objects prepared as compact video concepts.',
    'legend-origins': 'Origin paths, recurring motifs, and legend-building patterns prepared for clear creator explanation.'
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

function creatorLibraryCategoryDefinitions() {
  return [
    {
      title: 'Urban Legends',
      slug: 'urban-legends',
      group: 'Modern Strange Records',
      description: 'Roadside legends, warning stories, neighborhood rumors, and modern folklore shaped into video-ready hooks and narration arcs.'
    },
    {
      title: 'Internet Folklore',
      slug: 'internet-folklore',
      group: 'Modern Strange Records',
      description: 'Digital legends, liminal spaces, cursed images, forum myths, and online unease prepared for explainers, Shorts, and visual prompts.'
    },
    {
      title: 'Strange Places',
      slug: 'strange-places',
      group: 'Modern Strange Records',
      description: 'Haunted roads, impossible rooms, vanished locations, and map-based mysteries organized for atmosphere, pacing, and scene planning.'
    },
    {
      title: 'Unexplained Mysteries',
      slug: 'unexplained-mysteries',
      group: 'Modern Strange Records',
      description: 'Evidence-limited mysteries and unresolved questions framed carefully for search-friendly videos without overstating the record.'
    },
    {
      title: 'Classic Folklore',
      slug: 'classic-folklore',
      group: 'Modern Strange Records',
      description: 'Older motifs, oral traditions, folk beliefs, and inherited warnings adapted into clear creator research paths.'
    },
    {
      title: 'Modern Legends',
      slug: 'modern-legends',
      group: 'Modern Strange Records',
      description: 'Recent rumor cycles, sightings, social memory, and contemporary legend patterns shaped for documentary-style narration.'
    },
    {
      title: 'Myths',
      slug: 'myths',
      group: 'Mythic & Imagined Realms',
      description: 'Mythic stories, sacred narratives, heroes, gods, and symbolic traditions planned for respectful longform explanation.'
    },
    {
      title: 'Mythic Creatures',
      slug: 'mythic-creatures',
      group: 'Mythic & Imagined Realms',
      description: 'Dragons, giants, sea beings, spirits, forest figures, and legendary creatures organized by origin, meaning, and visual direction.'
    },
    {
      title: 'Lost Worlds',
      slug: 'lost-worlds',
      group: 'Mythic & Imagined Realms',
      description: 'Hidden cities, vanished islands, impossible geography, and lost realms prepared for mystery videos and worldbuilding explainers.'
    },
    {
      title: 'Strange Nature',
      slug: 'strange-nature',
      group: 'Mythic & Imagined Realms',
      description: 'Sky omens, unusual forests, sea phenomena, strange plants, and landscape folklore arranged for atmospheric creator use.'
    },
    {
      title: 'Legendary Places',
      slug: 'legendary-places',
      group: 'Mythic & Imagined Realms',
      description: 'Named mountains, lakes, ruins, temples, and sacred places shaped into location-focused mystery scripts.'
    },
    {
      title: 'Mythic Objects',
      slug: 'mythic-objects',
      group: 'Mythic & Imagined Realms',
      description: 'Swords, bells, mirrors, books, charms, relics, and symbolic objects prepared as compact video concepts.'
    },
    {
      title: 'Legend Origins',
      slug: 'legend-origins',
      group: 'Supplemental Archive',
      description: 'Origin paths, recurring motifs, and legend-building patterns prepared for clear creator explanation.'
    }
  ];
}

function buildCreatorLibraryCategories(scripts) {
  const definitions = creatorLibraryCategoryDefinitions();
  const activeSlugs = new Set(scripts.map(scriptCreatorCategorySlug).filter(Boolean));
  return definitions.filter((category) => activeSlugs.has(category.slug));
}

function scriptCreatorCategorySlug(script) {
  const explicitSlug = script.creatorCategorySlug || script.libraryCategorySlug || script.scriptCategorySlug;
  if (explicitSlug) return explicitSlug;

  const genre = String(script.genre || '').trim().toLowerCase();
  if (genre === 'internet folklore script') return 'internet-folklore';
  if (genre === 'urban legend script') return 'urban-legends';
  if (genre === 'mythology script') return 'myths';

  for (const category of creatorLibraryCategoryDefinitions()) {
    const title = category.title.toLowerCase();
    if (genre === `${title} creator library` || genre === `${title} script`) {
      return category.slug;
    }
  }

  const haystack = [
    script.title,
    script.deck,
    ...(script.tags || [])
  ].filter(Boolean).join(' ').toLowerCase();

  if (/\b(cursed image|backrooms|internet folklore|digital legend|online folklore|forum myth)\b/.test(haystack)) return 'internet-folklore';
  if (/\b(woman in white|urban legend|roadside legend|warning story)\b/.test(haystack)) return 'urban-legends';
  if (/\b(dragon|dragons|mythology|mythic story|myth explainer)\b/.test(haystack)) return 'myths';
  return '';
}

function scriptsForCreatorCategory(category, scripts) {
  return sortNewest(scripts).filter((script) => scriptCreatorCategorySlug(script) === category.slug);
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

function getHomeStories(slugs) {
  return slugs.map((slug) => stories.find((story) => story.slug === slug)).filter(Boolean);
}

function getHomeGuides(slugs) {
  return slugs.map((slug) => guides.find((guide) => guide.slug === slug)).filter(Boolean);
}

function getHomeReaderPathGroups() {
  return [
    {
      title: 'If you like road legends',
      deck: 'Roadside ghosts, warnings, vanished passengers, and places where ordinary travel turns strange.',
      stories: getHomeStories([
        'woman-in-white-roadside-legend',
        'vanishing-hitchhiker-urban-legend',
        'the-hookman-urban-legend',
        'how-a-shortcut-becomes-a-haunted-road'
      ])
    },
    {
      title: 'If you like internet folklore',
      deck: 'Digital spaces, cursed images, game files, and web stories that grew through sharing.',
      stories: getHomeStories([
        'backrooms-digital-labyrinth',
        'russian-sleep-experiment-creepypasta',
        'ben-drowned-creepypasta',
        'candle-cove-creepypasta'
      ])
    },
    {
      title: 'If you want older folklore',
      deck: 'Folk figures, spirits, warnings, and traditional stories that keep changing across retellings.',
      stories: getHomeStories([
        'baba-yaga-folklore',
        'banshee-irish-folklore',
        'kitsune-folklore',
        'dullahan-irish-folklore'
      ])
    },
    {
      title: 'If you want source-aware reading',
      deck: 'Guides for reading legends as stories without mistaking repeated claims for proof.',
      guides: getHomeGuides([
        'what-is-an-urban-legend',
        'how-to-check-source-status',
        'why-internet-folklore-spreads',
        'how-to-build-a-reading-path-through-the-strange-archive'
      ])
    }
  ];
}

function getHomeMotifLanes() {
  return [
    {
      title: 'Mirrors and Names',
      description: 'Stories where reflection, naming, and repeated words change what a person thinks they can control.',
      stories: getHomeStories([
        'bloody-mary-mirror-legend',
        'why-names-have-power-in-legends',
        'why-mirrors-mean-bad-luck'
      ])
    },
    {
      title: 'Water and Hidden Places',
      description: 'Sunken bells, sea creatures, drowned cities, and places that seem to remember more than maps do.',
      stories: getHomeStories([
        'bell-under-the-lake-folklore',
        'kraken-beneath-the-calm-sea',
        'city-of-ys-legend'
      ])
    },
    {
      title: 'Creatures and Warnings',
      description: 'Dragons, doorway visitors, strange footage, and creatures that make a warning easier to remember.',
      stories: getHomeStories([
        'dragons-across-the-world',
        'black-eyed-children-legend',
        'fresno-nightcrawler-legend'
      ])
    }
  ];
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

function renderHomePortalHeader(currentPath = '/') {
  const pathForNav = normalizeNavPath(currentPath);
  return `<header class="home-portal-header">
    <div class="home-portal-header-inner">
      <div class="home-portal-topbar">
        <a class="home-portal-brand" href="/"><span class="home-portal-brand-mark"><img src="/icon-192.png" alt="" aria-hidden="true"></span><span><strong>Kyunolab Mystery Archive</strong><em>Legends, folklore, mysteries, and strange tales.</em></span></a>
        ${renderHomePortalSearchForm()}
      </div>
      <nav class="home-portal-nav" aria-label="Primary homepage navigation">
        ${homePortalNavLink('/', 'Home', pathForNav === '/')}
        ${homePortalNavLink('/archive.html', 'All Stories', pathForNav === '/archive' || /^\/archive-\d+$/.test(pathForNav))}
        ${homePortalNavLink('/categories.html', 'Categories', pathForNav === '/categories' || pathForNav.startsWith('/categories/'))}
        ${homePortalNavLink('/mystery-board.html', 'Mystery Board', pathForNav === '/mystery-board' || pathForNav.startsWith('/mystery-board/'))}
        ${homePortalNavLink('/scripts/', 'Creator Library', isScriptsPath(pathForNav))}
        ${homePortalNavLink('/tools.html', 'Tools', pathForNav === '/tools')}
        ${homePortalNavLink('/about.html', 'About', pathForNav === '/about')}
        ${homePortalNavLink('/hub.html', 'Hub', pathForNav === '/hub', 'home-portal-hub-link')}
      </nav>
      ${renderHomeSignSystem()}
    </div>
  </header>`;
}

function homePortalNavLink(href, label, isActive, extraClass = '') {
  const classes = [extraClass, isActive ? 'active' : ''].filter(Boolean).join(' ');
  const classAttr = classes ? ` class="${escapeAttr(classes)}"` : '';
  return `<a href="${href}"${classAttr}${isActive ? ' aria-current="page"' : ''}>${escapeHtml(label)}</a>`;
}

function renderHomePortalSearchForm() {
  return `<form class="site-search home-portal-search" action="/search/" method="get" role="search" aria-label="Search Kyunolab">
          <input type="hidden" name="type" value="archive">
          <label class="sr-only" for="home-portal-search-query">Search query</label>
          <input id="home-portal-search-query" name="q" class="site-search-input" type="search" placeholder="Search Kyunolab..." autocomplete="off" data-search-input>
          <button class="site-search-button" type="submit">Search</button>
        </form>`;
}

function renderHomePortalLead({ featuredStory, popularStories }) {
  const knownStories = popularStories.slice(0, 5);
  return `<section class="home-portal-lead" aria-label="Kyunolab front entrance">
          <article class="home-lead-story">
            <p class="label">Featured Archive Building</p>
            <h1>Known strange stories form the front entrance, not just category labels.</h1>
            <p>The first screen now opens with real articles: famous legends, internet folklore, myths, strange places, and guides readers can enter immediately.</p>
            <a class="button" href="/stories/${escapeAttr(featuredStory.slug)}">Open featured record</a>
          </article>
          <div class="home-known-list">
            <h2>Start with known stories</h2>
            ${knownStories.map(renderHomeKnownStoryLink).join('')}
          </div>
        </section>`;
}

function renderHomeKnownStoryLink(story, index) {
  return `<a href="/stories/${escapeAttr(story.slug)}"><span>${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(story.title)}</strong></a>`;
}

function renderHomeHeadlineDesk(headlineStories, guideLinks) {
  const guide = guideLinks[0];
  const guideLink = guide ? renderHomeGuideRow(guide, 'Guide') : '';
  return `<section class="home-headline-desk" aria-label="Featured story desk">
          <div class="section-head"><h2>Headline Desk</h2><span>Selected entry points</span></div>
          <div class="headline-desk-grid">
            <div class="headline-list">${headlineStories.map(renderHomeHeadlineRow).join('')}${guideLink}</div>
            <aside class="home-context-card">
              <p class="label">Start reading</p>
              <h3>Begin with stories readers can enter right away.</h3>
              <p>These selected records mix urban legends, internet folklore, myths, places, and a source guide so the archive feels open before a reader chooses a category.</p>
            </aside>
          </div>
        </section>`;
}

function renderHomeReaderPaths(groups) {
  return `<section class="home-reader-paths" aria-label="Reader paths">
          <div class="section-head"><h2>Reader Paths</h2><span>Curated routes</span></div>
          <div class="home-path-grid">${groups.map(renderHomeReaderPathGroup).join('')}</div>
        </section>`;
}

function renderHomeMotifLanes(lanes) {
  return `<section class="home-motif-lanes" aria-label="Motif lanes">
          <div class="section-head"><h2>Motif Lanes</h2><span>Browse by recurring idea</span></div>
          <div class="home-motif-grid">${lanes.map(renderHomeMotifLane).join('')}</div>
        </section>`;
}

function renderHomeCrossroads({ guideLinks, libraryScripts }) {
  return `<section class="home-crossroads" aria-label="Kyunolab crossroads">
          <div class="section-head"><h2>Board, Library, and Tools</h2><span>Connected site axes</span></div>
          <div class="home-crossroad-grid">
            <article>
              <p class="category-group-label">Mystery Board</p>
              <h3><a href="/mystery-board.html">Guides for reading the archive</a></h3>
              <p>Source status, story types, internet folklore, archive paths, and how to move through strange records without losing context.</p>
              <div class="category-links">${guideLinks.slice(0, 3).map((guide) => renderHomeGuideLink(guide)).join('')}</div>
              <a class="text-link" href="/mystery-board.html">Open Mystery Board</a>
            </article>
            <article>
              <p class="category-group-label">Creator Library</p>
              <h3><a href="/scripts/">Creator-ready story material</a></h3>
              <p>Script packages, visual planning resources, and creator paths connected back to original archive records.</p>
              <div class="category-links">${libraryScripts.map(renderHomeScriptLink).join('') || '<a href="/scripts/">Open Creator Library</a>'}</div>
              <a class="text-link" href="/scripts/">Open Creator Library</a>
            </article>
            <article class="home-planned-card">
              <p class="category-group-label">Tools</p>
              <h3><a href="/tools.html">Future utilities should feel like stadiums</a></h3>
              <p>Motif Finder, Source Checklist, Reading Path Builder, and other tools need quiet roads back to Archive, Board, and Library.</p>
              <div class="home-planned-list"><span>Motif Finder</span><span>Source Checklist</span><span>Reading Path Builder</span></div>
              <a class="text-link" href="/tools.html">Open Tools plan</a>
            </article>
          </div>
        </section>`;
}

function renderHomeHeadlineRow(story) {
  return `<a class="home-headline-row" href="/stories/${escapeAttr(story.slug)}"><span>${escapeHtml(story.category)}</span><strong>${escapeHtml(story.title)}</strong></a>`;
}

function renderHomeGuideRow(guide, label) {
  return `<a class="home-headline-row" href="/mystery-board/${escapeAttr(guide.slug)}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(guide.title)}</strong></a>`;
}

function renderHomeReaderPathGroup(group) {
  const links = group.stories
    ? group.stories.map(renderCategoryStoryLink).join('')
    : (group.guides || []).map(renderHomeGuideLink).join('');
  return `<article>
          <h3>${escapeHtml(group.title)}</h3>
          <p>${escapeHtml(group.deck)}</p>
          <div class="category-links">${links}</div>
        </article>`;
}

function renderHomeMotifLane(lane) {
  return `<article>
          <h3>${escapeHtml(lane.title)}</h3>
          <p>${escapeHtml(lane.description)}</p>
          <div class="category-links">${lane.stories.map(renderCategoryStoryLink).join('')}</div>
        </article>`;
}

function renderHomeGuideLink(guide) {
  return `<a href="/mystery-board/${escapeAttr(guide.slug)}">${escapeHtml(guide.title)}</a>`;
}

function renderHomeScriptLink(script) {
  return `<a href="/scripts/${escapeAttr(script.slug)}">${escapeHtml(script.title)}</a>`;
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

function renderHomePortalRail({ popularStories, essentialStories, guideLinks, libraryScripts }) {
  const popular = popularStories.slice(0, 5);
  const essentials = essentialStories.slice(0, 3);
  const guides = guideLinks.slice(0, 3);
  const scripts = libraryScripts.slice(0, 2);
  return `<aside class="home-portal-rail" aria-label="Kyunolab side paths">
      ${renderKyunolabNetworkCard('archive')}
      <section class="rail-card">
        <p class="rail-label">Known Buildings</p>
        ${popular.map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}
      </section>
      <section class="rail-card rail-card-subtle">
        <p class="rail-label">Cross Roads</p>
        ${guides.map((guide) => `<a href="/mystery-board/${escapeAttr(guide.slug)}">${escapeHtml(guide.title)}</a>`).join('')}
        <a href="/scripts/">Archive to Creator Library</a>
        ${scripts.map((script) => `<a href="/scripts/${escapeAttr(script.slug)}">${escapeHtml(script.title)}</a>`).join('')}
      </section>
      <section class="rail-card">
        <p class="rail-label">Essential Reads</p>
        ${essentials.map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}
      </section>
      <section class="rail-card rail-feature">
        <p class="rail-label">Hub</p>
        <a href="/hub.html"><span>Site notes</span><strong>Bookmark, support, events, and future outside activity can live here.</strong></a>
      </section>
    </aside>`;
}

function renderHomeRail({ featuredStory, popularStories, essentialStories }) {
  const popular = popularStories.slice(0, 3);
  const essentials = essentialStories.slice(0, 3);
  return `<aside class="home-rail" aria-label="Homepage reader paths">
      ${renderKyunolabNetworkCard('archive')}
      <div class="rail-card rail-feature"><p class="rail-label">Start here</p><a href="#essential-reads"><span>First visit</span><strong>Begin with essential reads, then follow the archive path that fits your question.</strong></a></div>
      <div class="rail-card"><p class="rail-label">Known stories</p>${popular.map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}</div>
      <div class="rail-card"><p class="rail-label">Essential reads</p>${essentials.map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}</div>
      <div class="rail-card rail-card-subtle"><p class="rail-label">Hub</p><a href="/hub.html">Bookmark and support notes</a><a href="/mystery-board.html">Events can grow from Board guides</a></div>
    </aside>`;
}

function renderHomeLeftRail() {
  return `<aside class="home-left-rail article-rail article-rail-left" aria-label="Homepage archive navigation">
    <div class="rail-card"><p class="rail-label">Reader Paths</p><a href="/archive.html">All Stories</a><a href="/newest.html">Newest Records</a><a href="/popular.html">Known Records</a><a href="/categories.html">Browse Categories</a><a href="/mystery-board.html">Mystery Board</a></div>
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

function renderScriptsHomeRail({ featuredScript, latestScripts, creatorCategories }) {
  const latest = latestScripts.slice(0, 3);
  const categoryLinks = creatorCategories.slice(0, 3).map((category) => `<a href="/scripts/categories/${escapeAttr(category.slug)}/">${escapeHtml(category.title)}</a>`).join('');
  return `<aside class="home-rail" aria-label="Creator Library recommendations">
      ${renderKyunolabNetworkCard('scripts')}
      ${featuredScript ? `<div class="rail-card rail-feature"><p class="rail-label">Start here</p><a href="/scripts/${escapeAttr(featuredScript.slug)}"><span>${escapeHtml(featuredScript.genre)}</span><strong>${escapeHtml(featuredScript.title)}</strong></a></div>` : ''}
      <div class="rail-card"><p class="rail-label">Latest scripts</p>${latest.map((script) => `<a href="/scripts/${escapeAttr(script.slug)}">${escapeHtml(script.title)}</a>`).join('')}</div>
      <div class="rail-card"><p class="rail-label">Creator shelves</p>${categoryLinks}<a href="/scripts/resources/">Creator Resources</a></div>
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
  return creatorLibraryCategories
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

  for (const category of creatorLibraryCategories) {
    const categoryScripts = scriptsForCreatorCategory(category, creatorScripts);
    const categoryDate = newestDate(categoryScripts) || latest;
    urls.push({ loc: `${siteUrl}/scripts/categories/${category.slug}/`, lastmod: categoryDate });
    addLibraryPagedUrls(urls, `scripts/categories/${category.slug}`, categoryScripts.length, categoryDate);
  }

  addLibraryPagedUrls(urls, 'scripts/latest', creatorScripts.length, newestDate(creatorScripts) || latest);
  const featuredScripts = getFeaturedScripts(sortNewest(creatorScripts));
  addLibraryPagedUrls(urls, 'scripts/featured', featuredScripts.length, newestDate(featuredScripts) || latest);

  for (const story of stories) {
    urls.push({ loc: `${siteUrl}/stories/${story.slug}`, lastmod: story.updatedAt || story.publishedAt || latest });
  }

  for (const guide of guides) {
    urls.push({ loc: `${siteUrl}${guide.url || `/mystery-board/${guide.slug}`}`, lastmod: guide.updatedAt || guide.publishedAt || latest });
  }

  for (const post of libraryBoardPosts) {
    urls.push({ loc: `${siteUrl}/scripts/board/${post.slug}/`, lastmod: post.updatedAt || post.publishedAt || latest });
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

  console.log(`Sitemap indexable URLs: ${urls.length}.`);
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
  const portalConfig = getListPortalConfig(baseName, pageNumber, totalPages);
  const guideLinks = getHomeGuides([
    'what-is-an-urban-legend',
    'how-to-check-source-status',
    'why-internet-folklore-spreads',
    'how-to-build-a-reading-path-through-the-strange-archive'
  ]);
  const libraryScripts = sortNewest(creatorScripts).slice(0, 3);
  const popularStories = getConfiguredStories(siteConfig.popularStoryIds).slice(0, 5);
  const essentialStories = getConfiguredStories(siteConfig.essentialStoryIds).slice(0, 4);
  return renderPage({
    canonicalPath,
    title,
    description,
    metaDescription,
    networkSection: 'archive',
    bodyClass: 'home-portal-page',
    headerHtml: renderHomePortalHeader(canonicalPath),
    content: `  <main class="home-shell home-portal-shell archive-portal-page archive-portal-${escapeAttr(baseName)}">
    <div class="home-portal-layout">
      <div class="home-main-column">
        ${renderListPortalLead({ label, h1, description, items, portalConfig })}
        ${renderListPortalRoutes(baseName, pageNumber)}
        ${renderAdSlot(`ad-${baseName}-after-intro`)}
        ${renderListPortalStoryList({ label, items, baseName, pageNumber, totalPages, portalConfig })}
        ${renderListPortalFooterCta(baseName)}
        ${renderHomeCrossroads({ guideLinks, libraryScripts })}
      </div>
      ${renderHomePortalRail({ popularStories, essentialStories, guideLinks, libraryScripts })}
    </div>
  </main>`,
    footerSection: 'archive'
  });
}

function getListPortalConfig(baseName, pageNumber, totalPages) {
  const isPaged = pageNumber > 1;
  const configs = {
    archive: {
      label: isPaged ? 'Archive Index Continued' : 'Archive Index',
      leadTitle: isPaged ? `More open archive records, page ${pageNumber}.` : 'Every story needs a clear front door.',
      leadText: isPaged
        ? `This continuation page keeps the complete Kyunolab Mystery Archive moving through older records without breaking the same roads back to categories, latest entries, and reading guides.`
        : 'All Stories is the full building directory for Kyunolab Mystery Archive: every current legend, folklore entry, myth, strange place, and source-aware record in one route.',
      ctaLabel: 'Browse categories',
      ctaHref: '/categories.html',
      listTitle: isPaged ? `All Stories, page ${pageNumber}` : 'All Archive Records',
      listKicker: `${pageNumber} of ${totalPages}`,
      contextTitle: 'Use the index when you already know you want the full collection.',
      contextText: 'When the list feels too broad, step sideways into Categories, Newest, Known Records, or Mystery Board before returning to the complete archive.',
      notice: 'All Stories is the complete index. It should feel like the main directory, while still leaving obvious roads into shorter shelves and guide pages.'
    },
    newest: {
      label: isPaged ? 'Newest Records Continued' : 'Newest Records',
      leadTitle: isPaged ? `More recent additions, page ${pageNumber}.` : 'Follow the archive as it grows.',
      leadText: isPaged
        ? 'This continuation keeps recent archive additions in order while preserving the same route back to the main index and category shelves.'
        : 'Newest shows the freshest Kyunolab records first, so returning readers can see what changed without digging through the full archive.',
      ctaLabel: 'Open all stories',
      ctaHref: '/archive.html',
      listTitle: isPaged ? `Newest Records, page ${pageNumber}` : 'Latest Story Stream',
      listKicker: `${pageNumber} of ${totalPages}`,
      contextTitle: 'Newest is the living street, not the whole city.',
      contextText: 'Use it to see fresh work, then cross into categories or the full archive when a topic needs a wider path.',
      notice: 'Newest keeps the site feeling active. The list is ordered by recent updates and still connects back to stable archive roads.'
    },
    popular: {
      label: isPaged ? 'Known Records Continued' : 'Known Records',
      leadTitle: isPaged ? `More familiar starting points, page ${pageNumber}.` : 'Start with records that are easy to enter.',
      leadText: isPaged
        ? 'This continuation keeps reader-friendly entry points available without pretending they are live traffic rankings.'
        : 'This page is a curated starting route through accessible legends, internet folklore, myths, places, and recurring motifs. It avoids treating early traffic as a finished popularity signal.',
      ctaLabel: 'Open newest records',
      ctaHref: '/newest.html',
      listTitle: isPaged ? `Known Records, page ${pageNumber}` : 'Known Starting Points',
      listKicker: `${pageNumber} of ${totalPages}`,
      contextTitle: 'Known records are starting points, not a traffic scoreboard.',
      contextText: 'They help first-time readers find familiar doors before branching into categories, source guides, and the complete story index.',
      notice: 'Known Records is intentionally framed as a curated path. It should not overclaim popularity before the site has stable traffic data.'
    }
  };
  return configs[baseName] || configs.archive;
}

function renderListPortalLead({ label, h1, description, items, portalConfig }) {
  const leadItems = items.slice(0, 5);
  return `<section class="home-portal-lead archive-portal-lead" aria-label="${escapeAttr(label)} front entrance">
          <article class="home-lead-story archive-lead-story">
            <p class="label">${escapeHtml(portalConfig.label)}</p>
            <h1>${escapeHtml(portalConfig.leadTitle)}</h1>
            <p>${escapeHtml(portalConfig.leadText || description)}</p>
            <a class="button" href="${escapeAttr(portalConfig.ctaHref)}">${escapeHtml(portalConfig.ctaLabel)}</a>
          </article>
          <div class="home-known-list archive-entrance-list">
            <h2>${escapeHtml(portalConfig.listTitle)}</h2>
            ${leadItems.map(renderArchiveEntranceLink).join('')}
          </div>
        </section>`;
}

function renderArchiveEntranceLink(story, index) {
  return `<a href="/stories/${escapeAttr(story.slug)}"><span>${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(story.title)}</strong><em>${escapeHtml(story.category)}</em></a>`;
}

function renderListPortalRoutes(baseName, pageNumber) {
  const showArchiveGuide = baseName === 'archive' && pageNumber === 1;
  return `<section class="notice archive-portal-guide" aria-label="Archive list guide">
        <p class="label">${showArchiveGuide ? 'Archive Guide' : 'Reader Roads'}</p>
        <h2>${showArchiveGuide ? 'Choose a shorter road through every story' : 'Move between the main archive roads'}</h2>
        <p>${showArchiveGuide ? 'All Stories is the full index. These entrances help readers start with a subject shelf, a newer record, a familiar story, or a reading guide before they keep moving through the complete list.' : 'Use these routes when the current list is too narrow or too broad. Each road stays connected to real stories, guide pages, and category shelves.'}</p>
        <div class="compact-grid">
          <a href="/archive.html"><span>Complete index</span><strong>All Stories</strong></a>
          <a href="/newest.html"><span>Fresh records</span><strong>Newest</strong></a>
          <a href="/popular.html"><span>Known paths</span><strong>Known Records</strong></a>
          <a href="/categories.html"><span>Browse by shelf</span><strong>Categories</strong></a>
        </div>
      </section>`;
}

function renderListPortalStoryList({ label, items, baseName, pageNumber, totalPages, portalConfig }) {
  return `<section class="home-headline-desk archive-story-index" aria-label="${escapeAttr(label)} story list">
          <div class="section-head"><h2>${escapeHtml(portalConfig.listTitle)}</h2><span>${escapeHtml(portalConfig.listKicker)}</span></div>
          <div class="archive-story-index-grid">
            <div class="story-list">${renderStoryRowsWithMidAd(items, `ad-${baseName}-mid-list`)}</div>
            <aside class="home-context-card">
              <p class="label">How to use this page</p>
              <h3>${escapeHtml(portalConfig.contextTitle)}</h3>
              <p>${escapeHtml(portalConfig.contextText)}</p>
              <div class="category-links">
                <a href="/categories/urban-legends.html">Urban Legends</a>
                <a href="/categories/internet-folklore.html">Internet Folklore</a>
                <a href="/mystery-board.html">Mystery Board</a>
              </div>
            </aside>
          </div>
          ${renderPagination(baseName, pageNumber, totalPages)}
        </section>`;
}

function renderListPortalFooterCta(baseName) {
  const copy = {
    archive: ['Categories', 'When the complete list feels too large, return to the shelf map.', '/categories.html', 'Browse categories'],
    newest: ['All Stories', 'When the latest stream feels too narrow, return to the full archive.', '/archive.html', 'Open all stories'],
    popular: ['Newest', 'When known starting points feel too familiar, check what was added recently.', '/newest.html', 'Open newest records']
  }[baseName] || ['All Stories', 'Return to the complete Kyunolab Mystery Archive index.', '/archive.html', 'Open all stories'];
  return `<section class="archive-cta"><div><p class="label">${escapeHtml(copy[0])}</p><h2>${escapeHtml(copy[1])}</h2><p>Archive roads should always lead somewhere useful: category shelves, fresh records, guide pages, creator material, and the complete index.</p></div><a class="button" href="${escapeAttr(copy[2])}">${escapeHtml(copy[3])}</a></section>`;
}

function renderArchiveGuide(baseName, pageNumber) {
  if (baseName !== 'archive' || pageNumber !== 1) return '';
  return `<section class="notice" aria-label="All Stories guide">
        <p class="label">Archive Guide</p>
        <h2>Choose a shorter road through every story</h2>
        <p>All Stories is the full index. These entrances help readers start with a subject shelf, a newer record, a familiar story, or a reading guide before they keep moving through the complete list.</p>
        <div class="compact-grid">
          <a href="/categories.html"><span>Browse by shelf</span><strong>Categories</strong></a>
          <a href="/newest.html"><span>Fresh records</span><strong>Newest</strong></a>
          <a href="/popular.html"><span>Known paths</span><strong>Popular</strong></a>
          <a href="/mystery-board.html"><span>Reading guide</span><strong>Mystery Board</strong></a>
        </div>
      </section>`;
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
    <div class="archive-page-main"><p class="label">${escapeHtml(category.group)}</p><h1 class="article-title">${escapeHtml(category.title)}</h1><p class="deck">${escapeHtml(category.description)}</p>${pageNumber === 1 ? renderCategoryIntro(category) : ''}${renderAdSlot('ad-category-after-intro')}<div class="story-list">${renderStoryRowsWithMidAd(pageItems, 'ad-category-mid-list')}</div>${renderPagination(`categories/${category.slug}`, pageNumber, totalPages)}</div>
    ${renderRightRail(pageItems, 'Recommended archive paths')}
  </main>`
  });
}

function renderPage({ canonicalPath, title, description, metaDescription, content, robots, networkSection, footerSection, bodyClass, headerHtml }) {
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
  const bodyClassAttr = bodyClass ? ` class="${escapeAttr(bodyClass)}"` : '';
  const header = typeof headerHtml === 'string' ? headerHtml : renderHeader(canonicalPath, { includeSearch: networkSection !== 'publishing' });
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
<body${bodyClassAttr}>
  ${header}
${content}
  ${renderFooter(footerSection)}${globalSearchScript}${creatorScript}${publishingScript}${searchScript}
</body>
</html>
`;
}

function renderCreatorLibraryScript() {
  return `  <script defer src="/scripts/creator-library.js?v=${creatorLibraryScriptVersion}"></script>`;
}

function renderGlobalSearchScript() {
  return `  <script defer src="/assets/global-search.js?v=${styleVersion}"></script>`;
}

function renderSearchResultsScript() {
  return `  <script defer src="/assets/search-results.js?v=${styleVersion}"></script>`;
}

function renderPublishingCenterScript() {
  return `  <script defer src="/engagement.js?v=${styleVersion}"></script>
  <script defer src="/assets/publishing-center.js?v=${styleVersion}"></script>`;
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
        navLink('/archive.html', 'All Stories', currentPath === '/archive' || /^\/archive-\d+$/.test(currentPath)),
        navLink('/newest.html', 'Newest', currentPath === '/newest'),
        navLink('/popular.html', 'Popular', currentPath === '/popular'),
        navLink('/categories.html', 'Categories', currentPath === '/categories' || currentPath.startsWith('/categories/')),
        navLink('/mystery-board.html', 'Mystery Board', currentPath === '/mystery-board' || currentPath.startsWith('/mystery-board/')),
        navLink('/tools.html', 'Tools', currentPath === '/tools'),
        navLink('/about.html', 'About', currentPath === '/about'),
        navLink('/hub.html', 'Hub', currentPath === '/hub')
      ].join('')}</nav>
    </div>
  </header>`;
}

function renderScriptsHeader(currentPath, includeSearch = true) {
  const searchForm = includeSearch ? `\n      ${renderSiteSearchForm('library')}` : '';
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

function renderFooter(section = 'archive') {
  if (section === 'scripts') {
    return `<footer class="site-footer">
    <p><strong>Kyunolab Creator Library</strong> provides creator-ready scripts, Shorts hooks, image prompts, thumbnail ideas, and planning resources connected to the Kyunolab Mystery Archive.</p>
    <p><a href="/scripts/">Scripts Home</a> - <a href="/scripts/latest/">Latest</a> - <a href="/scripts/featured/">Featured</a> - <a href="/scripts/categories/">Script Categories</a> - <a href="/scripts/board/">Library Board</a> - <a href="/scripts/resources/">Creator Resources</a> - <a href="/">Mystery Archive</a> - <a href="/fiction-disclaimer.html">Story &amp; Source Notice</a> - <a href="/privacy.html">Privacy</a> - <a href="/rss.xml">RSS</a></p>
  </footer>`;
  }
  return `<footer class="site-footer">
    <p><strong>Kyunolab Mystery Archive</strong> collects legends, folklore, mysteries, and strange tales with calm source-aware notes.</p>
    <p><a href="/archive.html">All Stories</a> - <a href="/newest.html">Newest</a> - <a href="/popular.html">Popular</a> - <a href="/categories.html">Categories</a> - <a href="/scripts/">Scripts</a> - <a href="/tools.html">Tools</a> - <a href="/hub.html">Hub</a> - <a href="/about.html">About</a> - <a href="/fiction-disclaimer.html">Story &amp; Source Notice</a> - <a href="/privacy.html">Privacy</a> - <a href="/rss.xml">RSS</a> - <a href="/publishing-center/">Publishing Center</a></p>
  </footer>`;
}

function renderLeftRail(label = 'Archive navigation') {
  return `<aside class="article-rail article-rail-left" aria-label="${escapeAttr(label)}">
    <div class="rail-card"><p class="rail-label">Reader Paths</p><a href="/archive.html">All Stories</a><a href="/newest.html">Newest Records</a><a href="/popular.html">Popular Records</a><a href="/categories.html">Browse Categories</a><a href="/mystery-board.html">Mystery Board</a></div>
    <div class="rail-card rail-card-subtle"><p class="rail-label">Archive Shelves</p><a href="/categories/urban-legends.html">Urban Legends</a><a href="/categories/internet-folklore.html">Internet Folklore</a><a href="/categories/myths.html">Myths</a><a href="/categories/strange-places.html">Strange Places</a></div>
    <div class="rail-card"><p class="rail-label">Source Guide</p><a href="/fiction-disclaimer.html">Story &amp; Source Notice</a><a href="/about.html">About Kyunolab</a></div>
  </aside>`;
}

function renderRightRail(items, label) {
  const safeItems = items.length ? items : stories.slice(0, 4);
  const feature = safeItems[0];
  const related = safeItems.slice(1, 4);
  return `<aside class="article-rail article-rail-right" aria-label="${escapeAttr(label)}">${renderKyunolabNetworkCard('archive')}<div class="rail-card rail-feature"><p class="rail-label">Start here</p><a href="/stories/${escapeAttr(feature.slug)}"><span>${escapeHtml(feature.category)}</span><strong>${escapeHtml(feature.title)}</strong></a></div><div class="rail-card"><p class="rail-label">Related stories</p>${related.map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}</div></aside>`;
}

function renderCategoryRightRail() {
  const categoryRailStories = getHomeStories([
    'woman-in-white-roadside-legend',
    'backrooms-digital-labyrinth',
    'baba-yaga-folklore',
    'poisoned-halloween-candy-legend',
    'russian-sleep-experiment-creepypasta',
    'demeter-and-persephone-myth',
    'paris-catacombs-legends'
  ]);
  const railStories = categoryRailStories.length >= 7 ? categoryRailStories : stories.slice(0, 7);
  const start = railStories[0];
  const popular = railStories.slice(1, 4);
  const essentials = railStories.slice(4, 7);
  return `<aside class="article-rail article-rail-right" aria-label="Category page reading paths">
      ${renderKyunolabNetworkCard('archive')}
      <div class="rail-card rail-feature"><p class="rail-label">Start here</p><a href="/stories/${escapeAttr(start.slug)}"><span>${escapeHtml(start.category)}</span><strong>${escapeHtml(start.title)}</strong></a></div>
      <div class="rail-card"><p class="rail-label">Popular stories</p>${popular.map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}</div>
      <div class="rail-card"><p class="rail-label">Essential reads</p>${essentials.map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}</div>
    </aside>`;
}

function renderAdSlot(slotName, extraClass = '') {
  const className = ['ad-slot', extraClass].filter(Boolean).join(' ');
  return `<aside class="${escapeAttr(className)}" data-ad-slot="${escapeAttr(slotName)}" aria-label="Advertisement"><span>Advertisement</span></aside>`;
}

function renderStoryRowsWithMidAd(items, slotName) {
  const rows = items.map(renderStoryRow);
  if (rows.length < 7) return rows.join('\n');
  rows.splice(6, 0, renderAdSlot(slotName));
  return rows.join('\n');
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
      <p>Readers can use this page to compare how similar motifs change across regions and formats. Some articles follow older folklore; others examine modern rumors, internet circulation, archival gaps, or stories attached to familiar places and objects. Titles and summaries are written to answer a clear question, but no repeated claim is treated as proof simply because it appears in many versions.</p>
      <p>The entries below are ordered by their latest update. Each article links to related stories, narrower tags, source notes, and the wider archive shelf, making this category a starting point rather than a dead-end list. Begin with the topic closest to your question, then follow the connected motifs to see what changes, what persists, and where the available evidence stops.</p>
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

function renderLibraryPagination({ basePath, pageNumber, totalPages, label }) {
  if (totalPages <= 1) return '';
  const links = [];
  const prev = pageNumber - 1;
  const next = pageNumber + 1;
  links.push(prev >= 1
    ? `<a class="page-link page-step" href="${libraryPageHref(basePath, prev)}" aria-label="Previous page">Previous</a>`
    : '<span class="page-link page-step is-disabled" aria-disabled="true">Previous</span>');

  for (const item of libraryPaginationItems(pageNumber, totalPages)) {
    if (item === 'ellipsis') {
      links.push('<span class="page-link is-disabled" aria-hidden="true">...</span>');
    } else if (item === pageNumber) {
      links.push(`<span class="page-link is-current" aria-current="page">${item}</span>`);
    } else {
      links.push(`<a class="page-link" href="${libraryPageHref(basePath, item)}" aria-label="Page ${item}">${item}</a>`);
    }
  }

  links.push(next <= totalPages
    ? `<a class="page-link page-step" href="${libraryPageHref(basePath, next)}" aria-label="Next page">Next</a>`
    : '<span class="page-link page-step is-disabled" aria-disabled="true">Next</span>');

  return `<nav class="pagination library-pagination" aria-label="${escapeAttr(label || 'Creator Library')} pagination"><div class="pagination-status">Page ${pageNumber} of ${totalPages}</div><div class="pagination-links">${links.join('')}</div></nav>`;
}

function libraryPaginationItems(pageNumber, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const pages = new Set([1, totalPages, pageNumber - 1, pageNumber, pageNumber + 1]);
  if (pageNumber <= 4) {
    [2, 3, 4, 5].forEach((page) => pages.add(page));
  }
  if (pageNumber >= totalPages - 3) {
    [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1].forEach((page) => pages.add(page));
  }
  const sorted = Array.from(pages).filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const items = [];
  for (const page of sorted) {
    if (items.length && page - items[items.length - 1] > 1) items.push('ellipsis');
    items.push(page);
  }
  return items;
}

function libraryPageHref(basePath, pageNumber) {
  return pageNumber === 1 ? `/${basePath}/` : `/${basePath}/page/${pageNumber}/`;
}

function libraryPageCanonical(basePath, pageNumber) {
  return libraryPageHref(basePath, pageNumber);
}

function pageHref(baseName, pageNumber) {
  return pageNumber === 1 ? `/${baseName}.html` : `/${baseName}-${pageNumber}.html`;
}

function addLibraryPagedUrls(urls, basePath, count, lastmod) {
  const totalPages = Math.max(1, Math.ceil(count / libraryPageSize));
  for (let page = 2; page <= totalPages; page += 1) {
    urls.push({ loc: `${siteUrl}${libraryPageHref(basePath, page)}`, lastmod });
  }
}

function addPagedUrls(urls, baseName, count, lastmod) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  for (let page = 2; page <= totalPages; page += 1) {
    urls.push({ loc: `${siteUrl}/${baseName}-${page}.html`, lastmod });
  }
}

function cleanupPagedFiles(baseName, expectedPages) {
  const dir = baseName.includes('/') ? path.join(siteOutputRoot, path.dirname(baseName)) : siteOutputRoot;
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
  fs.mkdirSync(path.dirname(path.join(siteOutputRoot, fileName)), { recursive: true });
  fs.writeFileSync(path.join(siteOutputRoot, fileName), content, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readOptionalJson(filePath, fallback = []) {
  if (!fs.existsSync(filePath)) return fallback;
  return readJson(filePath);
}

function loadCreatorScriptsForBuild(options = {}) {
  const packRoot = getCreatorPackRoot(options);
  if (!fs.existsSync(packRoot)) {
    throwCreatorPackStoreNotInitialized(packRoot, 'Creator Pack store root does not exist.');
  }
  const manifestPath = getCreatorPackManifestPath(options);
  const packFiles = fs.readdirSync(packRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'manifest.json');
  if (!packFiles.length) {
    throwCreatorPackStoreNotInitialized(packRoot, 'Creator Pack store is empty.');
  }
  if (!fs.existsSync(manifestPath)) {
    rebuildCreatorPackManifest(options);
  }
  const packs = iterateCreatorPacks(options);
  if (!packs.length) {
    throwCreatorPackStoreNotInitialized(packRoot, 'Creator Pack manifest has no entries.');
  }
  return packs;
}

function throwCreatorPackStoreNotInitialized(packRoot, reason) {
  const error = new Error(`CREATOR_PACK_STORE_NOT_INITIALIZED: ${reason} Run the Creator Pack migration or pass --creator-pack-root to a prepared file store.`);
  error.code = 'CREATOR_PACK_STORE_NOT_INITIALIZED';
  error.packRoot = packRoot;
  throw error;
}

function parseBuildArgs(argv) {
  const args = {
    creatorPackRoot: process.env.CREATOR_PACK_ROOT,
    outputRoot: process.env.KYUNOLAB_SITE_OUTPUT_ROOT
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--creator-pack-root') args.creatorPackRoot = argv[++index];
    else if (arg === '--output-root') args.outputRoot = argv[++index];
  }
  return args;
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

if (require.main === module) {
  main();
}

module.exports = {
  main,
  loadCreatorScriptsForBuild,
  isStandardCreatorPack,
  validateCreatorPackForRender,
  buildCreatorRenderModel,
  renderStandardCreatorPack,
  renderCreatorPack
};
