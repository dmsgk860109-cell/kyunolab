const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const stories = JSON.parse(fs.readFileSync(storiesPath, 'utf8'));
const existingSlugs = new Set(stories.map((story) => story.slug));
const myths = stories.filter((story) => story.categorySlug === 'myths');

const additions = [
  {
    title: 'The Sparrow That Carried the First Dawn: A Myth About Small Wings and Returning Light',
    seedKeyword: 'sparrow carried the first dawn myth',
    primaryTag: 'Sky Myth',
    tags: ['Sky Myth', 'Origin Myth', 'Animal Motif', 'Returning Light', 'Symbolic Myth'],
    excerpt: 'A small bird is said to carry the first strip of dawn across a sky that had forgotten how to brighten.',
    detail: 'a small bird carrying the first strip of dawn across a sky that had forgotten how to brighten',
    evidence: 'sky myths, bird symbolism, dawn stories, oral retellings, and origin motifs',
    relatedStoryIds: ['moon-rabbit-and-the-story-in-the-sky', 'sun-stolen-from-the-mountain', 'star-that-waited-behind-the-mountain']
  },
  {
    title: 'The Mountain That Drank the Thunder: A Myth About Storms, Silence, and Stone',
    seedKeyword: 'mountain drank thunder myth',
    primaryTag: 'Mountain Myth',
    tags: ['Mountain Myth', 'Weather Myth', 'Symbolic Myth', 'Sound Boundary', 'Origin Myth'],
    excerpt: 'A mountain drinks the first thunder so people can learn the difference between warning and fear.',
    detail: 'a mountain drinking the first thunder so people can learn the difference between warning and fear',
    evidence: 'mountain myths, storm folklore, thunder symbolism, seasonal warning stories, and sacred landscape motifs',
    relatedStoryIds: ['giant-at-the-edge-of-the-valley', 'wind-that-borrowed-a-voice', 'star-that-waited-behind-the-mountain']
  },
  {
    title: 'The Weaver Who Tied the Seasons Together: A Myth About Thread, Weather, and Time',
    seedKeyword: 'weaver tied the seasons together myth',
    primaryTag: 'Season Myth',
    tags: ['Season Myth', 'Weather Myth', 'Creation Motif', 'Symbolic Myth', 'Sacred Time'],
    excerpt: 'A quiet weaver ties loose weather into four seasons so the year stops unraveling at the edge of winter.',
    detail: 'a quiet weaver tying loose weather into four seasons so the year stops unraveling at the edge of winter',
    evidence: 'season myths, weaving symbolism, weather folklore, agricultural calendars, and time-origin motifs',
    relatedStoryIds: ['the-cloud-that-carried-the-unfinished-season', 'moon-that-refused-the-calendar', 'sun-stolen-from-the-mountain']
  },
  {
    title: 'The Well Where the Sky Learned Its Name: A Myth About Reflection and First Words',
    seedKeyword: 'well where the sky learned its name myth',
    primaryTag: 'Water Myth',
    tags: ['Water Myth', 'Spoken Name', 'Reflection Motif', 'Origin Myth', 'Sacred Water'],
    excerpt: 'A still well reflects the sky before language exists, then keeps the first name people learn to say upward.',
    detail: 'a still well reflecting the sky before language exists and keeping the first name people learn to say upward',
    evidence: 'water myths, reflection folklore, naming motifs, sacred wells, and first-word origin stories',
    relatedStoryIds: ['river-that-remembers-the-first-name', 'the-old-well-that-shows-a-different-sky', 'moon-rabbit-and-the-story-in-the-sky']
  },
  {
    title: 'The Fox That Hid the Last Star: A Myth About Trickery, Night, and Morning',
    seedKeyword: 'fox hid the last star myth',
    primaryTag: 'Sky Myth',
    tags: ['Sky Myth', 'Animal Motif', 'Symbolic Myth', 'Returning Light', 'Night Creature'],
    excerpt: 'A fox hides the last star under its tongue, delaying morning until the world remembers how to ask carefully.',
    detail: 'a fox hiding the last star under its tongue and delaying morning until the world remembers how to ask carefully',
    evidence: 'fox folklore, sky myths, trickster motifs, night-and-morning stories, and symbolic animal retellings',
    relatedStoryIds: ['the-glass-fox-that-leaves-no-pawprints', 'star-that-waited-behind-the-mountain', 'the-first-shadow-that-refused-to-follow']
  }
];

let added = 0;

for (const plan of additions.reverse()) {
  const slug = slugify(plan.title);
  if (existingSlugs.has(slug)) continue;

  stories.unshift({
    id: slug,
    slug,
    title: plan.title,
    displayTitle: plan.title,
    seoTitle: plan.title,
    metaTitle: plan.title,
    metaDescription: buildMetaDescription(plan),
    category: 'Myths',
    categorySlug: 'myths',
    categoryGroup: 'Mythic & Imagined Realms',
    tag: plan.primaryTag,
    primaryTag: plan.primaryTag,
    seedKeyword: plan.seedKeyword,
    searchIntent: 'meaning',
    articleFormat: 'story-archive',
    cluster: `Myths / ${plan.primaryTag}`,
    relatedKeywords: [
      `${plan.seedKeyword} meaning`,
      `${plan.seedKeyword} story`,
      `${plan.primaryTag.toLowerCase()} story`,
      'mythic origin record'
    ],
    topicScore: 84 + (added % 5),
    topicStatus: 'approved',
    scoreBreakdown: {
      searchDemand: 25,
      clickCuriosity: 22,
      siteFit: 19,
      expansionPotential: 12,
      differentiation: 8
    },
    summaryAnswer: `${plan.title.split(':')[0]} is a source-aware myth record built around ${plan.detail}. The article reads the motif symbolically while keeping the source limits visible.`,
    readTime: `${9 + (added % 3)} min read`,
    storyType: 'Myth',
    sourceStatus: 'Mythological motif / Symbolic retelling / Source-aware archive note',
    excerpt: plan.excerpt,
    publishedAt: '2026-07-05',
    updatedAt: '2026-07-05',
    relatedStoryIds: plan.relatedStoryIds.filter((slug) => existingSlugs.has(slug) || myths.some((story) => story.slug === slug)).slice(0, 3),
    tags: plan.tags,
    detail: plan.detail,
    evidence: plan.evidence
  });

  existingSlugs.add(slug);
  added += 1;
}

fs.writeFileSync(storiesPath, `${JSON.stringify(stories, null, 2)}\n`, 'utf8');
console.log(`Added ${added} Myths stories.`);

function buildMetaDescription(plan) {
  return `${plan.title.split(':')[0]} explores ${plan.detail}, tracing how this ${plan.primaryTag.toLowerCase()} pattern works without treating the record as confirmed fact.`;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
