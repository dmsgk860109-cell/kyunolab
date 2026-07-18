const fs = require('fs');
const path = require('path');
const { buildContentDNA } = require('./article-dna-utils');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const publishedAt = '2026-07-19';

const stories = readJson(storiesPath);
const storySlugs = new Set(stories.map((story) => story.slug));
const existingQueries = new Set(
  stories
    .map((story) => story.contentDNA?.canonicalQuery || story.primaryKeyword || story.seedKeyword)
    .filter(Boolean)
    .map((query) => query.toLowerCase().trim())
);

const knownMyths = [
  {
    slug: 'icarus-myth',
    title: 'Icarus Myth: Wings, Warning, and the Meaning of Flying Too Close to the Sun',
    tag: 'Greek Myth',
    tags: ['Greek Myth', 'Icarus', 'Daedalus', 'Sun Motif'],
    keyword: 'icarus myth',
    detail: 'the Greek myth of Icarus, whose wax-fastened wings fail after he ignores the warning not to fly too close to the sun',
    evidence: 'classical mythology summaries, literary retellings, symbolic interpretation, and later artistic tradition',
    vocabulary: ['Icarus', 'Daedalus', 'wax wings', 'sun', 'flight warning', 'fall'],
    related: ['prometheus-myth', 'orpheus-and-eurydice-myth', 'persephone-myth']
  },
  {
    slug: 'theseus-and-the-minotaur-myth',
    title: 'Theseus and the Minotaur: Labyrinth, Thread, and the Monster at the Center',
    tag: 'Greek Myth',
    tags: ['Greek Myth', 'Theseus', 'Minotaur', 'Labyrinth'],
    keyword: 'theseus and the minotaur',
    detail: 'the Greek myth of Theseus entering the Cretan Labyrinth, facing the Minotaur, and relying on Ariadne’s thread to find the way out',
    evidence: 'classical mythology references, Cretan myth traditions, literary retellings, and symbolic readings of the labyrinth',
    vocabulary: ['Theseus', 'Minotaur', 'Labyrinth', 'Ariadne', 'thread', 'Crete'],
    related: ['orpheus-and-eurydice-myth', 'prometheus-myth', 'icarus-myth']
  },
  {
    slug: 'yggdrasil-world-tree-myth',
    title: 'Yggdrasil World Tree: Norse Myth, Nine Worlds, and the Shape of the Cosmos',
    tag: 'Norse Myth',
    tags: ['Norse Myth', 'Yggdrasil', 'World Tree', 'Nine Worlds'],
    keyword: 'yggdrasil world tree',
    detail: 'the Norse mythic image of Yggdrasil, the immense world tree that connects gods, beings, roots, wells, and the nine worlds',
    evidence: 'Norse mythology references, Eddic tradition summaries, symbolic interpretation, and comparative world-tree motifs',
    vocabulary: ['Yggdrasil', 'world tree', 'nine worlds', 'roots', 'Norse cosmos', 'Eddic tradition'],
    related: ['ragnarok-norse-myth', 'prometheus-myth', 'persephone-myth']
  },
  {
    slug: 'ragnarok-norse-myth',
    title: 'Ragnarok: Norse Myth, World Ending, and the Return After Ruin',
    tag: 'Norse Myth',
    tags: ['Norse Myth', 'Ragnarok', 'World Ending', 'Renewal'],
    keyword: 'ragnarok norse myth',
    detail: 'the Norse myth of world-ending conflict, cosmic collapse, death among gods, and the possibility of renewal after ruin',
    evidence: 'Norse mythology references, Eddic tradition summaries, later retellings, and symbolic readings of apocalypse and renewal',
    vocabulary: ['Ragnarok', 'Norse gods', 'world ending', 'renewal', 'Fenrir', 'cosmic battle'],
    related: ['yggdrasil-world-tree-myth', 'prometheus-myth', 'isis-and-osiris-myth']
  },
  {
    slug: 'gilgamesh-flood-myth',
    title: 'Gilgamesh Flood Myth: Utnapishtim, Mortality, and the Search for Life',
    tag: 'Mesopotamian Myth',
    tags: ['Mesopotamian Myth', 'Gilgamesh', 'Flood Myth', 'Utnapishtim'],
    keyword: 'gilgamesh flood myth',
    detail: 'the flood episode in the Epic of Gilgamesh, where Utnapishtim survives a divine flood and Gilgamesh confronts the limits of human life',
    evidence: 'Mesopotamian literary tradition, Epic of Gilgamesh summaries, comparative flood-myth studies, and symbolic interpretation',
    vocabulary: ['Gilgamesh', 'Utnapishtim', 'flood myth', 'mortality', 'immortality', 'ancient Mesopotamia'],
    related: ['prometheus-myth', 'isis-and-osiris-myth', 'persephone-myth']
  },
  {
    slug: 'quetzalcoatl-feathered-serpent-myth',
    title: 'Quetzalcoatl: Feathered Serpent Myth, Culture Hero, and Sacred Knowledge',
    tag: 'Mesoamerican Myth',
    tags: ['Mesoamerican Myth', 'Quetzalcoatl', 'Feathered Serpent', 'Culture Hero'],
    keyword: 'quetzalcoatl feathered serpent',
    detail: 'the Mesoamerican figure of Quetzalcoatl, the feathered serpent associated with sacred knowledge, creation, rulership, and culture-hero traditions',
    evidence: 'Mesoamerican mythology summaries, cultural-history references, iconographic tradition, and careful source-aware interpretation',
    vocabulary: ['Quetzalcoatl', 'feathered serpent', 'culture hero', 'creation', 'sacred knowledge', 'Mesoamerica'],
    related: ['prometheus-myth', 'yggdrasil-world-tree-myth', 'isis-and-osiris-myth']
  },
  {
    slug: 'izanagi-and-izanami-myth',
    title: 'Izanagi and Izanami: Creation, Underworld, and the Boundary Between Life and Death',
    tag: 'Japanese Myth',
    tags: ['Japanese Myth', 'Izanagi', 'Izanami', 'Creation Myth'],
    keyword: 'izanagi and izanami myth',
    detail: 'the Japanese creation myth of Izanagi and Izanami, including the making of islands, the descent into the land of the dead, and the broken boundary between life and death',
    evidence: 'Japanese mythology references, Kojiki and Nihon Shoki summaries, religious-symbolic interpretation, and later retellings',
    vocabulary: ['Izanagi', 'Izanami', 'creation myth', 'Yomi', 'Japanese islands', 'underworld boundary'],
    related: ['persephone-myth', 'orpheus-and-eurydice-myth', 'isis-and-osiris-myth']
  },
  {
    slug: 'amaterasu-cave-myth',
    title: 'Amaterasu Cave Myth: Hidden Sun, Ritual, and the Return of Light',
    tag: 'Japanese Myth',
    tags: ['Japanese Myth', 'Amaterasu', 'Sun Myth', 'Return of Light'],
    keyword: 'amaterasu cave myth',
    detail: 'the Japanese myth of Amaterasu withdrawing into a cave, darkening the world until ritual, performance, and cleverness draw the sun goddess back out',
    evidence: 'Japanese mythology references, Shinto tradition summaries, symbolic interpretation, and ritual-history context',
    vocabulary: ['Amaterasu', 'sun goddess', 'cave', 'return of light', 'ritual performance', 'Shinto tradition'],
    related: ['izanagi-and-izanami-myth', 'prometheus-myth', 'persephone-myth']
  },
  {
    slug: 'anansi-spider-stories-myth',
    title: 'Anansi the Spider: Trickster Stories, Wisdom, and the Web of Tales',
    tag: 'West African Myth',
    tags: ['West African Myth', 'Anansi', 'Trickster', 'Storytelling'],
    keyword: 'anansi spider stories',
    detail: 'the West African and Caribbean Anansi tradition, where the spider trickster uses wit, hunger, bargaining, and stories to reshape power',
    evidence: 'Akan and wider West African folklore summaries, Caribbean retellings, oral tradition studies, and trickster-motif interpretation',
    vocabulary: ['Anansi', 'spider trickster', 'Akan folklore', 'Caribbean retellings', 'storytelling', 'wisdom'],
    related: ['prometheus-myth', 'quetzalcoatl-feathered-serpent-myth', 'gilgamesh-flood-myth']
  },
  {
    slug: 'maui-fishing-up-the-islands-myth',
    title: 'Maui Fishing Up the Islands: Polynesian Myth, Trickster Hero, and Land From the Sea',
    tag: 'Polynesian Myth',
    tags: ['Polynesian Myth', 'Maui', 'Creation Myth', 'Trickster Hero'],
    keyword: 'maui fishing up the islands',
    detail: 'the Polynesian Maui tradition in which the trickster hero fishes land from the sea, giving a memorable mythic shape to islands and origin stories',
    evidence: 'Polynesian mythology summaries, regional retellings, oral tradition context, and symbolic readings of land-from-sea motifs',
    vocabulary: ['Maui', 'Polynesian myth', 'fishing up islands', 'trickster hero', 'land from sea', 'origin story'],
    related: ['anansi-spider-stories-myth', 'quetzalcoatl-feathered-serpent-myth', 'gilgamesh-flood-myth']
  },
  {
    slug: 'ra-solar-boat-myth',
    title: 'Ra’s Solar Boat: Egyptian Myth, Night Journey, and the Daily Return of the Sun',
    tag: 'Egyptian Myth',
    tags: ['Egyptian Myth', 'Ra', 'Solar Boat', 'Sun Myth'],
    keyword: 'ra solar boat myth',
    detail: 'the Egyptian mythic image of Ra traveling across the sky by day and through the underworld by night before the sun returns again',
    evidence: 'Egyptian mythology references, funerary-text summaries, solar symbolism, and later retellings of the night journey',
    vocabulary: ['Ra', 'solar boat', 'sun god', 'night journey', 'underworld', 'daily return'],
    related: ['isis-and-osiris-myth', 'amaterasu-cave-myth', 'gilgamesh-flood-myth']
  }
];

const additions = [];

for (let index = 0; index < knownMyths.length; index += 1) {
  const plan = knownMyths[index];
  if (storySlugs.has(plan.slug)) {
    console.warn(`Skipped duplicate slug: ${plan.slug}`);
    continue;
  }
  const story = buildStory(plan, index);
  story.contentDNA = buildContentDNA(story, existingQueries);
  storySlugs.add(story.slug);
  if (story.contentDNA?.canonicalQuery) existingQueries.add(story.contentDNA.canonicalQuery.toLowerCase().trim());
  additions.push(story);
}

stories.unshift(...additions.reverse());
writeJson(storiesPath, stories);
console.log(`Added ${additions.length} existing myth archive stories.`);

function buildStory(plan, index) {
  const relatedSlugs = unique(plan.related || [])
    .filter((slug) => slug !== plan.slug && (storySlugs.has(slug) || knownMyths.some((item) => item.slug === slug)))
    .slice(0, 4);
  const relatedKeywords = unique([
    `${plan.keyword} origin`,
    `${plan.keyword} meaning`,
    `${plan.tag.toLowerCase()} folklore`,
    'myths explained',
    'myth meaning'
  ]);

  return {
    id: plan.slug,
    slug: plan.slug,
    title: plan.title,
    displayTitle: plan.title,
    h1: plan.title,
    seoTitle: `${shortSeoTitle(plan.title)}: Myth, Meaning, and Folklore`,
    metaTitle: `${shortSeoTitle(plan.title)}: Myth, Meaning, and Folklore`,
    metaDescription: `${shortSeoTitle(plan.title)} examines ${plan.detail} through source-aware mythology, common versions, symbolic meaning, and careful evidence limits.`,
    category: 'Myths',
    categorySlug: 'myths',
    categoryGroup: 'Mythic & Imagined Realms',
    tag: plan.tag,
    primaryTag: plan.tag,
    seedKeyword: plan.keyword,
    primaryKeyword: plan.keyword,
    searchIntent: 'meaning',
    articleFormat: 'story-archive',
    cluster: `Myths / ${plan.tag}`,
    relatedKeywords,
    secondaryKeywords: unique([...relatedKeywords, ...plan.vocabulary]).slice(0, 8),
    topicScore: 91 - (index % 4),
    topicStatus: 'approved',
    scoreBreakdown: {
      searchDemand: 28,
      clickCuriosity: 23,
      siteFit: 22,
      expansionPotential: 12,
      sourceSafety: 8
    },
    summaryAnswer: `${shortSeoTitle(plan.title)} is a pre-existing mythic subject built around ${plan.detail}. This archive reading explains the common story, the symbolic pattern, and the source limits without treating mythic events as verified history.`,
    readTime: `${8 + (index % 3)} min read`,
    storyType: 'Myth',
    sourceStatus: `Myths / ${plan.tag} / Mythic tradition and symbolic reading`,
    excerpt: `A source-aware Kyunolab record tracing ${plan.detail}.`,
    introSummary: `A source-aware Kyunolab record tracing ${plan.detail}.`,
    publishedAt,
    updatedAt: publishedAt,
    relatedStoryIds: relatedSlugs,
    relatedStorySlugs: relatedSlugs,
    tags: plan.tags.slice(0, 5),
    detail: plan.detail,
    evidence: plan.evidence,
    generationMode: 'canonical-archive',
    researchSources: [
      {
        title: `${shortSeoTitle(plan.title)} mythology reference summaries`,
        supports: `Provides source-aware context for ${shortSeoTitle(plan.title)} as a pre-existing myth rather than a newly invented archive story.`
      },
      {
        title: `${plan.tag} tradition and common versions`,
        supports: `Supports the common record, recurring motifs, and variant-aware treatment of ${shortSeoTitle(plan.title)}.`
      },
      {
        title: 'Comparative mythology and symbolic interpretation',
        supports: 'Supports the distinction between mythic tradition, later retelling, symbolic meaning, and claims that should not be presented as verified fact.'
      }
    ],
    sourceNotes: {
      sharedVerifiedPoints: [
        `${shortSeoTitle(plan.title)} is a pre-existing mythic subject in public mythology, folklore, or cultural-history discussion.`,
        `The article can responsibly describe common versions and recurring motifs connected to ${plan.detail}.`,
        `The strongest reading stays within ${plan.evidence} rather than presenting mythic events as confirmed historical fact.`
      ],
      variants: [
        'Names, emphasis, episodes, and symbolic details may shift by region, source tradition, translation, or later retelling.',
        'Popular summaries often simplify older, regional, ritual, or literary versions of the myth.'
      ],
      unsupportedClaimsToAvoid: [
        'Do not present divine, supernatural, or mythic events as verified historical events.',
        'Do not imply a single definitive version when the myth has multiple source traditions or later retellings.',
        'Do not add invented witnesses, dates, institutions, archive numbers, or documents beyond the source-aware mythology context.'
      ],
      sourceLimits: [
        'Ancient and oral traditions often survive through layered texts, translations, summaries, and later retellings.',
        'A myth can have cultural and symbolic value without functioning as a factual report.',
        'The archive reading focuses on story pattern, meaning, variants, and cultural memory.'
      ]
    },
    targetQuery: plan.keyword,
    canonicalQuery: plan.keyword,
    uniqueAngle: `${shortSeoTitle(plan.title)} is treated as a known mythic tradition first, with Kyunolab record language used only to clarify variants, motifs, and source limits.`,
    sceneAnchor: plan.detail,
    subjectSpecificVocabulary: plan.vocabulary,
    contentType: 'story'
  };
}

function shortSeoTitle(title) {
  return String(title).split(':')[0].trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
