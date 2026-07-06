const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const siteUrl = 'https://kyunolab.com';
const styleVersion = '20260706-kit-ui';
const pageSize = 12;
const rssLimit = 20;

const stories = readJson(path.join(root, 'data', 'stories.json'));
const categories = readJson(path.join(root, 'data', 'categories.json'));
const guides = readOptionalJson(path.join(root, 'data', 'guides.json'));
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
generateRss();
generateSitemap();
generateRoutingFiles();

console.log(`Generated site index pages for ${stories.length} stories, ${categories.length} categories, and ${guides.length} guides.`);

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
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${siteUrl}/">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="stylesheet" href="/styles.css?v=${styleVersion}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  ${renderHeader()}
  <main>
    <section class="hero">
      <div class="hero-copy"><p class="label">Strange Story Archive</p><h1>Strange legends. Forgotten folklore. Mysteries that refuse to disappear.</h1><p>A quiet archive of urban legends, folklore origins, internet myths, strange places, mythic creatures, and recurring mystery patterns.</p></div>
      ${renderFeaturedStory(featuredStory)}
    </section>
    <section class="notice"><strong>Story &amp; Source Notice:</strong> This site explores folklore, legends, mysteries, and source-aware retellings. Unverified traditions are presented as stories, not as verified fact.</section>
    <div class="home-stream">
      <section id="latest" class="latest latest-compact"><div class="section-head"><h2>Latest Stories</h2><a href="/newest.html">View all newest</a></div><div class="home-story-list">${latestStories.map(renderHomeStoryRow).join('')}</div></section>
      ${renderHomeRail({ featuredStory, popularStories, essentialStories })}
    </div>
    <section class="board" id="rankings"><div class="section-head"><h2>Popular Records</h2><a href="/mystery-board.html">Open mystery board</a></div><div class="ranking-grid"><ol class="ranking-card">${popularStories.map(renderRankingItem).join('')}</ol><aside class="side-panel"><h3>Reader Paths</h3><a href="/newest.html">Newest stories</a><a href="/categories.html">Browse by category</a><a href="#essential-reads">Start with essential reads</a><a href="/fiction-disclaimer.html">Story &amp; source notice</a></aside></div></section>
    <section id="categories" class="categories"><div class="section-head"><h2>Browse By Category</h2><a href="/categories.html">View all categories</a></div><div class="home-category-groups">${categoryGroups.map(renderHomeCategoryGroup).join('')}</div></section>
    <section id="essential-reads" class="essential-reads"><div class="section-head"><h2>Essential Reads</h2><span>Start here</span></div><div class="compact-grid">${essentialStories.map(renderEssentialStory).join('')}</div></section>
    <section class="archive-cta"><div><p class="label">Archive Index</p><h2>Explore every open file in Kyunolab Mystery Archive.</h2><p>Move through the full collection by category, source status, story type, folklore motif, legend origin, and recurring mystery pattern.</p></div><a class="button" href="/archive.html">Browse all current stories</a></section>
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
    const categoryStories = stories.filter((story) => story.categorySlug === category.slug);
    const pages = chunk(categoryStories, pageSize);
    cleanupPagedFiles(`categories/${category.slug}`, pages.length);

    pages.forEach((pageItems, index) => {
      const pageNumber = index + 1;
      const fileName = pageNumber === 1 ? `categories/${category.slug}.html` : `categories/${category.slug}-${pageNumber}.html`;
      const canonicalPath = pageNumber === 1 ? `/categories/${category.slug}.html` : `/categories/${category.slug}-${pageNumber}.html`;
      const pageTitle = pageNumber === 1 ? category.title : `${category.title} - Page ${pageNumber}`;
      writeFile(fileName, renderCategoryPage({ category, pageItems, pageNumber, totalPages: pages.length, pageTitle, canonicalPath }));
    });
  }
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
      <div class="rail-card rail-feature"><p class="rail-label">Start here</p><a href="/stories/${escapeAttr(featuredStory.slug)}"><span>${escapeHtml(featuredStory.category)}</span><strong>${escapeHtml(featuredStory.title)}</strong></a></div>
      <div class="rail-card"><p class="rail-label">Popular records</p>${popular.map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}</div>
      <div class="rail-card rail-card-subtle"><p class="rail-label">Archive paths</p><a href="/newest.html">Newest Records</a><a href="/popular.html">Popular Records</a><a href="/categories.html">Browse Categories</a><a href="/mystery-board.html">Mystery Board</a></div>
      <div class="rail-card"><p class="rail-label">Essential reads</p>${essentials.map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}</div>
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

  for (const story of stories) {
    urls.push({ loc: `${siteUrl}/stories/${story.slug}`, lastmod: story.updatedAt || story.publishedAt || latest });
  }

  for (const guide of guides) {
    urls.push({ loc: `${siteUrl}${guide.url || `/mystery-board/${guide.slug}`}`, lastmod: guide.updatedAt || guide.publishedAt || latest });
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
    content: `  <main class="article-shell article-layout">
    ${renderLeftRail('Reader paths')}
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
    content: `  <main class="article-shell article-layout">
    <aside class="article-rail article-rail-left" aria-label="This shelf">
      <div class="rail-card"><p class="rail-label">This shelf</p><a href="/categories/${escapeAttr(category.slug)}.html">${escapeHtml(category.title)}</a><a href="/categories.html">All Categories</a><a href="/archive.html">Archive Index</a><a href="/fiction-disclaimer.html">Story &amp; Source Notice</a></div>
      <div class="rail-card rail-card-subtle"><p class="rail-label">Archive groups</p>${categories.slice(0, 3).map((item) => `<a href="/categories/${escapeAttr(item.slug)}.html">${escapeHtml(item.title)}</a>`).join('')}</div>
    </aside>
    <div class="archive-page-main"><p class="label">${escapeHtml(category.group)}</p><h1 class="article-title">${escapeHtml(category.title)}</h1><p class="deck">${escapeHtml(category.description)}</p><div class="story-list">${pageItems.map(renderStoryRow).join('\n')}</div>${renderPagination(`categories/${category.slug}`, pageNumber, totalPages)}</div>
    ${renderRightRail(pageItems, 'Recommended archive paths')}
  </main>`
  });
}

function renderPage({ canonicalPath, title, description, metaDescription, content, robots }) {
  const pageDescription = metaDescription || description;
  const robotsMeta = robots ? `  <meta name="robots" content="${escapeAttr(robots)}">\n` : '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} | Kyunolab Mystery Archive</title>
  <meta name="description" content="${escapeAttr(pageDescription)}">
${robotsMeta}  <meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:description" content="${escapeAttr(pageDescription)}">
  <meta property="og:site_name" content="Kyunolab Mystery Archive">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${siteUrl}${canonicalPath}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${siteUrl}${canonicalPath}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="stylesheet" href="/styles.css?v=${styleVersion}">
</head>
<body>
  ${renderHeader()}
${content}
  ${renderFooter()}
</body>
</html>
`;
}

function renderHeader() {
  return `<header class="site-header">
    <div class="topline">A Kyuno Lab publication</div>
    <div class="header-inner">
      <a class="brand" href="/"><span class="brand-mark"><img src="/favicon.svg" alt="" aria-hidden="true"></span><span><strong>Kyunolab Mystery Archive</strong><em>Legends, folklore, mysteries, and strange tales.</em></span></a>
      <nav class="nav"><a href="/newest.html">Newest</a><a href="/popular.html">Popular</a><a href="/categories.html">Categories</a><a href="/mystery-board.html">Mystery Board</a><a href="/about.html">About</a></nav>
    </div>
  </header>`;
}

function renderFooter() {
  return `<footer class="site-footer">
    <p><strong>Kyunolab Mystery Archive</strong> is a quiet story publication by Kyuno Lab, dedicated to legends, folklore, mysteries, and strange tales from the edges of memory.</p>
    <p><a href="/archive.html">Archive Index</a> - <a href="/newest.html">Newest</a> - <a href="/popular.html">Popular</a> - <a href="/categories.html">Categories</a> - <a href="/about.html">About</a> - <a href="/fiction-disclaimer.html">Story &amp; Source Notice</a> - <a href="/privacy.html">Privacy</a> - <a href="/rss.xml">RSS</a></p>
  </footer>`;
}

function renderLeftRail(label) {
  return `<aside class="article-rail article-rail-left" aria-label="${escapeAttr(label)}"><div class="rail-card"><p class="rail-label">${escapeHtml(label)}</p><a href="/newest.html">Newest Records</a><a href="/popular.html">Popular Records</a><a href="/categories.html">Browse Categories</a><a href="/archive.html">Archive Index</a><a href="/fiction-disclaimer.html">Story &amp; Source Notice</a></div></aside>`;
}

function renderRightRail(items, label) {
  const safeItems = items.length ? items : stories.slice(0, 4);
  const feature = safeItems[0];
  const related = safeItems.slice(1, 4);
  return `<aside class="article-rail article-rail-right" aria-label="${escapeAttr(label)}"><div class="rail-card rail-feature"><p class="rail-label">Start here</p><a href="/stories/${escapeAttr(feature.slug)}"><span>${escapeHtml(feature.category)}</span><strong>${escapeHtml(feature.title)}</strong></a></div><div class="rail-card"><p class="rail-label">Related records</p>${related.map((story) => `<a href="/stories/${escapeAttr(story.slug)}">${escapeHtml(story.title)}</a>`).join('')}</div><div class="rail-card rail-card-subtle"><p class="rail-label">Same archive shelf</p><a href="/newest.html">Newest Records</a><a href="/popular.html">Popular Records</a><a href="/mystery-board.html">Mystery Board</a></div></aside>`;
}

function renderCategoryRightRail() {
  const modern = categories.filter((category) => category.group === 'Modern Strange Records');
  const mythic = categories.filter((category) => category.group === 'Mythic & Imagined Realms');
  const start = stories[0];
  return `<aside class="article-rail article-rail-right" aria-label="Category page reading paths">
      <div class="rail-card rail-feature"><p class="rail-label">Start here</p><a href="/stories/${escapeAttr(start.slug)}"><span>${escapeHtml(start.category)}</span><strong>${escapeHtml(start.title)}</strong></a></div>
      <div class="rail-card"><p class="rail-label">Modern Strange Records</p>${modern.map(renderCategoryRailLink).join('')}</div>
      <div class="rail-card rail-card-subtle"><p class="rail-label">Mythic &amp; Imagined Realms</p>${mythic.map(renderCategoryRailLink).join('')}</div>
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
          <div class="meta">${escapeHtml([story.category, story.tag, story.readTime].filter(Boolean).join(' - '))}</div>
        </article>`;
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
