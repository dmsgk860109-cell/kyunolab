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
  const generatedDNA = buildContentDNA(story, existingQueries);
  const existingDNA = story.contentDNA || {};
  story.contentDNA = {
    ...generatedDNA,
    ...existingDNA,
    readerIntent: generatedDNA.readerIntent,
    searchQuestion: refineSearchQuestion(story, generatedDNA.searchQuestion),
    uniqueAngle: refineUniqueAngle(story, generatedDNA.uniqueAngle),
    sceneAnchor: generatedDNA.sceneAnchor,
    subjectSpecificVocabulary: generatedDNA.subjectSpecificVocabulary,
    requiredSpecificDetails: generatedDNA.requiredSpecificDetails,
    sectionBlueprint: generatedDNA.sectionBlueprint
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
  story.summaryAnswer = buildSummaryAnswer(story, subject);
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
  const detail = story.detail || story.excerpt || `a recurring ${category} motif`;
  return `${subject} is a source-aware ${category} record about ${scenePhrase(detail)}. It is not presented as verified fact; the useful reading is how the scene, motif, and evidence limits make the story worth preserving.`;
}

function refineSearchQuestion(story, fallback) {
  const subject = shortSubject(story).replace(/^The\s+/i, '');
  const tag = story.primaryTag || story.tag || story.category;
  const detail = story.detail || story.excerpt || subject;
  return story.searchQuestion || `What makes ${subject} work as ${articleFor(tag)} ${tag} record built around ${scenePhrase(detail)}?`;
}

function refineUniqueAngle(story, fallback) {
  const profile = getQualityProfile(story);
  const subject = shortSubject(story);
  const detail = story.detail || story.excerpt || subject;
  return story.uniqueAngle || `${subject} is read through ${profile.lens}, with the focus kept on ${detail} instead of broad atmosphere or unsupported certainty.`;
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
  const pageTitle = buildMetaPageTitle(metaTitle, title);
  const description = buildMetaDescription(story.metaDescription || story.excerpt || story.summaryAnswer || '');
  const relatedStories = getRelatedStories(story);
  const dna = story.contentDNA;
  const sections = buildBodySections(story);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pageTitle)}</title>
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
  const profile = getQualityProfile(story);
  const tag = story.primaryTag || story.tag || story.category;
  const specificTerms = meaningfulTerms([...vocabulary, ...details]);
  const vocabSentence = sentenceFromTerms(vocabulary.slice(index, index + 3), subject);
  const detailSentence = `${heading} works because the article can name specific carriers: ${listForSentence(specificTerms.slice(0, 4))}.`;
  const concreteTerms = listForSentence(meaningfulTerms(vocabulary).slice(0, 4));
  const scene = scenePhrase(detail);

  if (index === 0) {
    return [
      firstAnalysisParagraph(story, subject, scene, profile),
      `${vocabSentence} Those terms are not decorative. They are the pieces that stop the article from becoming a loose summary and keep the reader inside the actual ${tag.toLowerCase()} pattern.`
    ];
  }

  if (index === 1) {
    const carriers = listForSentence(specificTerms.slice(0, 3));
    return [
      `${heading} depends on material details rather than mood. ${detailSentence}`,
      `The important move is scale: the story does not need a whole mythology to work. It needs ${scene}, then supporting carriers such as ${carriers}. That is why ${tag} works as a smaller internal path while ${story.category} keeps the article on the right archive shelf.`
    ];
  }

  if (index === 2) {
    return [
      `${profile.contextSentence} In this entry, the pressure point is ${scene}.`,
      `That is why the article treats the subject through ${profile.lens}. The frame matters because it explains why ${concreteTerms || tag} can feel memorable without turning uncertainty into proof.`
    ];
  }

  if (index === 3) {
    return [
      `The evidence posture is deliberately narrow. The available material can support a source-aware reading through ${evidence}; it can show how the motif circulates, which details survive, and which version of the story readers are actually repeating.`,
      `${profile.evidenceLimit} Stronger support would need ${profile.strongEvidence}, especially records that preserve the same concrete details instead of only repeating the same title.`
    ];
  }

  return [
    `${subject} remains readable because it gives readers something ordinary to look at differently: ${scene}. That is stronger than a vague claim because it creates a repeatable image without demanding that the reader accept more than the source status can carry.`,
    `For Kyunolab, the value is in preserving the precise shape of the record. The article should leave the reader with ${profile.finalImage}, plus a clear boundary between folklore value, searchable context, and verified fact.`
  ];
}

function renderOpening(story) {
  const dna = story.contentDNA;
  const subject = shortSubject(story);
  const summary = story.summaryAnswer || `${subject} is best read as a source-aware ${String(story.category || 'archive').toLowerCase()} record.`;
  const profile = getQualityProfile(story);
  const scene = scenePhrase(story.detail || story.excerpt || dna.sceneAnchor || subject);
  return `<p>${escapeHtml(summary)} In practical terms, ${escapeHtml(dna.targetQuery)} leads to one useful question: ${escapeHtml(dna.searchQuestion)}</p>
        <p>The article keeps returning to ${escapeHtml(scene)}. The point is not to inflate the mystery, but to read it through ${escapeHtml(profile.lens)} while keeping the boundary between memorable folklore and confirmed record visible.</p>`;
}

function renderSection(section) {
  return `<h2 id="${escapeAttr(section.id)}">${escapeHtml(section.title)}</h2>
${section.paragraphs.map((text) => `        <p>${escapeHtml(text)}</p>`).join('\n')}`;
}

function renderFaq(story) {
  const subject = shortSubject(story);
  const tag = story.primaryTag || story.tag || story.category;
  const dna = story.contentDNA;
  const profile = getQualityProfile(story);
  const detail = story.detail || story.excerpt || dna.sceneAnchor || subject;
  const scene = scenePhrase(detail);
  const questions = [
    {
      q: `What is the main idea behind ${subject.toLowerCase()}?`,
      a: `The main idea is not simply that something strange happened. It is that ${scene} gives the story a concrete shape, making the ${tag.toLowerCase()} motif easy to remember and retell.`
    },
    {
      q: `Why does this ${String(story.category || 'archive').toLowerCase()} entry still attract searches?`,
      a: `It combines a recognizable setting with a small unresolved pressure point. Readers can picture the scene quickly, then return to the question of what the record can and cannot support.`
    },
    {
      q: `What evidence would make ${subject.toLowerCase()} more credible?`,
      a: `Useful evidence would include ${profile.strongEvidence}. A repeated rumor can prove circulation, but it does not automatically prove the event or claim inside the rumor.`
    },
    {
      q: `How is this record different from a simple retelling?`,
      a: `The article keeps the source status visible, identifies the story pattern, and explains why details such as ${listForSentence(meaningfulTerms(dna.subjectSpecificVocabulary || []).slice(0, 3))} matter. That makes it an archive reading, not just a repeated version of the tale.`
    }
  ];

  return `<h2 id="faq">FAQ</h2>
      <div class="faq-list">
${questions.map((item) => `        <h3>${escapeHtml(item.q)}</h3>
        <p>${escapeHtml(item.a)}</p>`).join('\n')}
      </div>`;
}

function renderSourceNote(story) {
  const profile = getQualityProfile(story);
  return `<h2 id="source-note">Story &amp; Source Note</h2>
        <p>This article discusses ${escapeHtml(story.sourceStatus || story.category)} with a source-aware approach. The record is useful for reading motif, setting, circulation, and evidence limits; it is not presented as confirmed fact.</p>
        <p>For this subject, the strongest responsible reading is ${escapeHtml(profile.sourceReading)}. Claims beyond that would need clearer, dated, and independently checkable material. See the <a href="/fiction-disclaimer.html#source-status">Story &amp; Source Notice</a> for how The Strange Archive separates documented sources, modern retellings, speculative interpretation, and original work.</p>`;
}

function renderMetaGrid(story) {
  const updated = formatDate(story.updatedAt || story.publishedAt);
  return `<dl class="article-meta-grid">
          <div><dt>Category</dt><dd>${escapeHtml(story.category)}</dd></div>
          <div><dt>Tags</dt><dd>${escapeHtml((story.tags || []).join(', '))}</dd></div>
          <div><dt>Read time</dt><dd>${escapeHtml(story.readTime)}</dd></div>
          <div><dt>Story Type</dt><dd><a href="/fiction-disclaimer.html#story-types">${escapeHtml(story.storyType)}</a></dd></div>
          <div><dt>Source Status</dt><dd><a href="/fiction-disclaimer.html#source-status">${escapeHtml(story.sourceStatus)}</a></dd></div>
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

function getQualityProfile(story) {
  const category = String(story.categorySlug || '').toLowerCase();
  if (category.includes('internet')) {
    return {
      lens: 'screenshots, reposting habits, platform memory, and the way small digital traces become folklore',
      memoryTrigger: 'a trace that looks ordinary until people notice the wrong detail',
      contextSentence: 'Digital folklore often changes when a file is copied, cropped, reposted, or explained by someone who did not see the first version.',
      evidenceLimit: 'Screenshots, comments, repost dates, and cached pages can show circulation, but they can still miss the first upload, the original context, or the person who shaped the claim.',
      strongEvidence: 'original uploads, archived pages, file metadata, stable timestamps, platform logs, and preserved comment chains',
      finalImage: 'a reader looking back at an ordinary screen and noticing why the small wrong detail kept spreading',
      sourceReading: 'a digital folklore reading that separates searchable circulation from proof of origin'
    };
  }
  if (category.includes('place') || category.includes('world')) {
    return {
      lens: 'maps, routes, local memory, built space, and the way a location becomes larger than its coordinates',
      memoryTrigger: 'a place that seems ordinary until one detail refuses to stay fixed',
      contextSentence: 'Place legends usually survive because the setting can be pointed to, visited, misremembered, or placed on a map even when the claim remains uncertain.',
      evidenceLimit: 'Maps, addresses, travel records, and local accounts can support the setting, but they do not automatically prove the strange event attached to it.',
      strongEvidence: 'dated maps, property records, transit records, photographs, local archives, and independently preserved location accounts',
      finalImage: 'a specific road, room, island, station, or border that still feels slightly unsettled after the explanation ends',
      sourceReading: 'a place-record reading that keeps location evidence separate from legendary interpretation'
    };
  }
  if (category.includes('nature')) {
    return {
      lens: 'weather, animal behavior, seasonal timing, landscape memory, and the border between observation and story',
      memoryTrigger: 'a natural detail that feels too patterned to dismiss immediately',
      contextSentence: 'Nature legends often begin with something someone could have seen, then gain force when the same sign is said to return under the same conditions.',
      evidenceLimit: 'Anecdotes can preserve what people noticed, but weather, animal movement, and landscape change need records before they can support stronger claims.',
      strongEvidence: 'dated weather data, environmental records, photographs, field notes, local reports, and repeated observations from independent sources',
      finalImage: 'a landscape that remains calm on the surface while one repeated detail keeps asking to be explained',
      sourceReading: 'a landscape-folklore reading that respects observation while avoiding exaggerated certainty'
    };
  }
  if (category.includes('myth') || category.includes('folklore')) {
    return {
      lens: 'symbol, custom, inherited warning, ritual pattern, and the way older stories teach before they explain',
      memoryTrigger: 'a symbolic image or rule that can be remembered without a full plot',
      contextSentence: 'Older folklore and mythic material often survives by changing surface details while preserving a rule, warning, object, creature, or sacred pattern.',
      evidenceLimit: 'Collected versions and motif parallels can show tradition and variation, but symbolic material should not be flattened into literal proof.',
      strongEvidence: 'folklore collections, dated variants, regional notes, translation history, motif indexes, and documented oral-tradition records',
      finalImage: 'a symbol or creature that still carries a rule after the literal question has been set aside',
      sourceReading: 'a motif-aware reading that treats symbolic meaning and historical documentation as different kinds of evidence'
    };
  }
  if (category.includes('origin')) {
    return {
      lens: 'motif history, repeated structure, changing versions, and the moment a rumor becomes recognizable',
      memoryTrigger: 'a story shape that readers recognize before they can name where it began',
      contextSentence: 'Origin records work best when they follow the repeatable structure rather than pretending a single first telling can always be found.',
      evidenceLimit: 'Early examples can show development, but a motif may predate the sources that survive.',
      strongEvidence: 'dated early versions, publication history, oral-history notes, archive copies, and clear links between variants',
      finalImage: 'a familiar story shape becoming visible across many versions rather than one isolated claim',
      sourceReading: 'an origin-pattern reading that favors documented development over unsupported first-source claims'
    };
  }
  if (category.includes('mysteries')) {
    return {
      lens: 'records, gaps, witness limits, alternative explanations, and the discipline of not solving what the evidence cannot solve',
      memoryTrigger: 'a missing piece that makes the ordinary record feel unfinished',
      contextSentence: 'Mystery records gain power when the available facts are specific enough to matter but incomplete enough to leave competing readings open.',
      evidenceLimit: 'A gap in the record can be important, but it is not the same as proof of the most dramatic explanation.',
      strongEvidence: 'primary documents, dated reports, location records, contemporaneous accounts, and independent confirmation of key details',
      finalImage: 'a record that stays open because the missing piece is named honestly rather than filled with certainty',
      sourceReading: 'an evidence-limits reading that preserves the question without selling speculation as an answer'
    };
  }
  return {
    lens: 'public routine, social repetition, ordinary settings, and the way a small impossible detail becomes easy to retell',
    memoryTrigger: 'a familiar routine interrupted by one detail that does not behave normally',
    contextSentence: 'Urban legends survive because they attach uncertainty to places and routines readers already understand.',
    evidenceLimit: 'Retellings can show that a rumor circulated, but circulation alone does not prove the event inside the rumor.',
    strongEvidence: 'dated local reports, original accounts, security records, photographs, location details, and independent witnesses',
    finalImage: 'an everyday scene that feels normal again, except for the one detail the reader now knows to watch',
    sourceReading: 'an urban-legend reading that separates social plausibility from verified fact'
  };
}

function firstAnalysisParagraph(story, subject, scene, profile) {
  const category = String(story.category || 'archive').toLowerCase();
  const tag = story.primaryTag || story.tag || story.category;
  const patterns = [
    `${subject} works best when it is read from the scene outward. The important detail is ${scene}; from there, the ${tag.toLowerCase()} motif becomes a way to understand how ${profile.memoryTrigger} can make an uncertain story feel organized.`,
    `The durable part of ${subject} is not the loudest claim, but the small pressure it puts on an ordinary setting. Once the reader notices ${scene}, the record becomes ${articleFor(story.category)} ${category} entry about how familiar routines collect uneasy meanings.`,
    `A useful reading of ${subject} starts with what can be pictured. Here, that picture is ${scene}. The article uses that image to separate the story's emotional force from any stronger claim the sources cannot yet support.`,
    `${subject} should not be flattened into a generic strange tale. Its value comes from ${scene}, a detail precise enough to hold the reader's attention while the source status stays visible.`,
    `The first thing to preserve in ${subject} is the shape of the encounter. The record depends on ${scene}, then asks why that detail keeps returning in a form readers recognize as ${tag.toLowerCase()}.`
  ];
  return patterns[stableIndex(story.slug, patterns.length)];
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

function listForSentence(values) {
  const clean = (values || [])
    .map((value) => String(value || '').replace(/[.?!]+$/, '').trim())
    .filter(Boolean)
    .slice(0, 3);
  if (!clean.length) return 'the recurring details';
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean[0]}, ${clean[1]}, and ${clean[2]}`;
}

function scenePhrase(value) {
  const text = String(value || '').replace(/[.?!]+$/, '').trim();
  if (!text) return 'a concrete detail the record keeps returning to';
  if (/^(a|an|the)\s/i.test(text)) {
    const lowered = lowerFirst(text);
    if (/\b(crosses|appears|refuses|opens|stops|rings|sounds|waits|glides|shows|turns|prints|lights|names|remembers|ends|leads|returns|arrives|sends|changes|moves|bends|flowers|answers|plays|fits|points|faces|goes|keeps|rolls)\b/i.test(text)) {
      return `the scene where ${lowered}`;
    }
    return `the image of ${lowered}`;
  }
  if (/^(someone|people|readers|drivers|travelers|children|visitors)\s/i.test(text)) return `the moment when ${text}`;
  return text;
}

function meaningfulTerms(values) {
  const blocked = new Set([
    'the',
    'this',
    'that',
    'story',
    'record',
    'legend',
    'archive',
    'strange'
  ]);
  return (values || [])
    .map((value) => String(value || '').replace(/[.?!]+$/, '').trim())
    .filter((value) => value.length >= 4)
    .filter((value) => {
      const words = value.toLowerCase().split(/\s+/).filter(Boolean);
      if (!words.length) return false;
      if (words.length === 1 && blocked.has(words[0])) return false;
      return true;
    });
}

function articleFor(value) {
  return /^[aeiou]/i.test(String(value || '').trim()) ? 'an' : 'a';
}

function lowerFirst(value) {
  return String(value || '').replace(/^([A-Z])/, (letter) => letter.toLowerCase());
}

function stableIndex(value, length) {
  const source = String(value || '');
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash + source.charCodeAt(index) * (index + 1)) % 9973;
  }
  return hash % length;
}

function shortSubject(story) {
  return String(story.displayTitle || story.title || story.slug).replace(/:.*$/, '').trim();
}

function buildMetaPageTitle(metaTitle, fallbackTitle) {
  const brand = 'The Strange Archive';
  const source = String(metaTitle || fallbackTitle || '').trim();
  const full = `${source} | ${brand}`;
  if (full.length <= 70) return full;

  const subject = source.split(':')[0].trim();
  if (subject.length >= 22 && `${subject} | ${brand}`.length <= 70) {
    return `${subject} | ${brand}`;
  }

  return `${trimToLength(source, 45)} | ${brand}`;
}

function buildMetaDescription(description) {
  const source = String(description || '').replace(/\s+/g, ' ').trim();
  if (source.length <= 160) return source;
  return trimToLength(source, 157);
}

function trimToLength(value, maxLength) {
  const source = String(value || '').replace(/\s+/g, ' ').trim();
  if (source.length <= maxLength) return source;
  const slice = source.slice(0, maxLength + 1);
  const boundary = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf(';'), slice.lastIndexOf(':'), slice.lastIndexOf(','));
  const wordBoundary = slice.lastIndexOf(' ');
  const cut = boundary >= Math.floor(maxLength * 0.65) ? boundary : wordBoundary;
  return `${source.slice(0, Math.max(1, cut)).replace(/[,:;.\s]+$/, '')}...`;
}

function renderJsonLd(story, cleanUrl, description) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${cleanUrl}#article`,
        headline: story.seoTitle || story.title,
        description,
        datePublished: story.publishedAt,
        dateModified: story.updatedAt,
        author: { '@type': 'Organization', name: 'Kyuno Lab' },
        publisher: { '@type': 'Organization', name: 'Kyuno Lab' },
        mainEntityOfPage: cleanUrl,
        keywords: [...(story.tags || []), ...(story.relatedKeywords || [])].join(', ')
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${cleanUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'The Strange Archive',
            item: `${siteUrl}/`
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: story.category,
            item: `${siteUrl}/categories/${story.categorySlug}.html`
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: story.title,
            item: cleanUrl
          }
        ]
      }
    ]
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
