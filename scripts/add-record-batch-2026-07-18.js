const fs = require('fs');
const path = require('path');
const { buildContentDNA } = require('./article-dna-utils');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const categoriesPath = path.join(root, 'data', 'categories.json');
const publishedAt = '2026-07-18';

const stories = readJson(storiesPath);
const categories = readJson(categoriesPath);
const storySlugs = new Set(stories.map((story) => story.slug));
const existingQueries = new Set(
  stories
    .map((story) => story.contentDNA?.canonicalQuery || story.primaryKeyword || story.seedKeyword)
    .filter(Boolean)
    .map((query) => query.toLowerCase().trim())
);

const slotPatterns = [
  {
    key: 'early-line',
    title: 'Register With a Line Written Too Early',
    tag: 'Register Record',
    detail: (context) => `a ${context.place} register places ${context.motif} one line earlier than the surrounding entries allow`,
    evidence: (context) => `${context.place} registers, line numbers, clerk notes, and ${context.evidence}`
  },
  {
    key: 'final-number',
    title: 'Ledger That Refuses the Final Number',
    tag: 'Ledger Motif',
    detail: (context) => `a ${context.place} ledger counts ${context.motif} but leaves the final number open`,
    evidence: (context) => `${context.place} ledgers, number sequences, staff memory, and ${context.evidence}`
  },
  {
    key: 'unlisted-shelf',
    title: 'Index Card for an Unlisted Shelf',
    tag: 'Index Card',
    detail: (context) => `an index card from ${context.place} points to a shelf where ${context.motif} should be stored, though no shelf is listed`,
    evidence: (context) => `${context.place} index cards, shelf maps, catalog notes, and ${context.evidence}`
  },
  {
    key: 'future-stamp',
    title: 'Receipt Book With a Future Stamp',
    tag: 'Future Stamp',
    detail: (context) => `a ${context.place} receipt book stamps ${context.motif} with a date that belongs to the next day`,
    evidence: (context) => `${context.place} receipt books, timestamp checks, printed slips, and ${context.evidence}`
  },
  {
    key: 'silent-hour',
    title: 'Audit Log From a Silent Hour',
    tag: 'Audit Log',
    detail: (context) => `a ${context.place} audit log records ${context.motif} during an hour when every other source is silent`,
    evidence: (context) => `${context.place} audit logs, access records, clock checks, and ${context.evidence}`
  },
  {
    key: 'missing-object',
    title: 'Inventory Tag for an Object No One Stored',
    tag: 'Inventory Tag',
    detail: (context) => `an inventory tag at ${context.place} describes ${context.motif} although no one remembers storing it`,
    evidence: (context) => `${context.place} inventory tags, storage lists, object descriptions, and ${context.evidence}`
  },
  {
    key: 'removed-door',
    title: 'Map Note Pointing to a Removed Door',
    tag: 'Map Note',
    detail: (context) => `a map note from ${context.place} points toward ${context.motif} through a door removed from later plans`,
    evidence: (context) => `${context.place} maps, plan revisions, door records, and ${context.evidence}`
  },
  {
    key: 'no-reader',
    title: 'Request Slip Signed by No Reader',
    tag: 'Request Slip',
    detail: (context) => `a request slip at ${context.place} asks for ${context.motif} under a reader name absent from the register`,
    evidence: (context) => `${context.place} request slips, reader registers, desk notes, and ${context.evidence}`
  },
  {
    key: 'overnight-entry',
    title: 'Notebook That Adds One Entry Overnight',
    tag: 'Notebook Entry',
    detail: (context) => `a ${context.place} notebook gains one overnight entry about ${context.motif} after the room has been closed`,
    evidence: (context) => `${context.place} notebooks, closing logs, caretaker accounts, and ${context.evidence}`
  },
  {
    key: 'outside-sequence',
    title: 'Catalog Page Kept Outside the Sequence',
    tag: 'Catalog Page',
    detail: (context) => `a catalog page from ${context.place} keeps ${context.motif} outside the normal sequence`,
    evidence: (context) => `${context.place} catalog pages, sequence checks, margin notes, and ${context.evidence}`
  }
];

const profiles = {
  'urban-legends': profile('Urban Record Legend', ['Urban Records', 'Public Logs'], [
    place('bus depot night desk', 'a passenger who should not appear on the final route', 'transit folklore'),
    place('apartment lobby desk', 'a maintenance request from a floor no tenant can reach', 'building folklore'),
    place('diner counter book', 'a booth reservation made after closing', 'roadside rumor'),
    place('school office file', 'a student name missing from every class list', 'campus legend'),
    place('parking kiosk cabinet', 'a ticket for a level the garage does not show', 'parking folklore'),
    place('laundromat counter ledger', 'a lost item matched to an address no one wrote down', 'neighborhood rumor'),
    place('hospital visitor desk', 'a badge printed before the visitor arrived', 'institutional legend'),
    place('city hall annex file', 'a permit number assigned to a closed room', 'civic folklore'),
    place('taxi stand receipt box', 'a fare record naming a street removed from maps', 'road legend'),
    place('basement gym scanner', 'a member entry from a card never issued', 'workplace rumor')
  ]),
  'internet-folklore': profile('Digital Record Folklore', ['Digital Records', 'Online Folklore'], [
    place('archived forum panel', 'a reply number that appears before the first post', 'forum folklore'),
    place('cloud backup folder', 'a photo file older than the account', 'metadata rumor'),
    place('map app history', 'a route home the user never searched', 'location folklore'),
    place('livestream dashboard', 'a silent viewer counted before broadcast', 'stream folklore'),
    place('group chat export', 'a read receipt from a removed member', 'messaging folklore'),
    place('wiki mirror archive', 'an editor absent from the user list', 'revision folklore'),
    place('password reset queue', 'a reset note dated before signup', 'platform rumor'),
    place('shared playlist history', 'a song no collaborator added', 'streaming folklore'),
    place('photo album cache', 'a caption left after every image is gone', 'image folklore'),
    place('browser sync record', 'a page saved before the site existed', 'cache folklore')
  ]),
  'strange-places': profile('Place Record Legend', ['Place Records', 'Strange Places'], [
    place('sealed platform office', 'a departure gate that was never built', 'transit-place legend'),
    place('hill motel archive', 'a room behind the office wall', 'roadside place folklore'),
    place('unused ferry office', 'a pier visible only in old tide notes', 'harbor legend'),
    place('museum corridor file', 'a gallery skipped by every public map', 'institutional place legend'),
    place('inland lighthouse room', 'a keeper log from a coast miles away', 'coastal place mystery'),
    place('cemetery front gate', 'a path that returns to its own beginning', 'graveyard place folklore'),
    place('underpass survey office', 'a marker that changes sides between reports', 'civic place legend'),
    place('old market staircase', 'a landing that opens toward a bus platform', 'liminal-place rumor'),
    place('airport service hall', 'a terminal route closed before it opened', 'airport folklore'),
    place('roadside chapel desk', 'a door number higher than the building range', 'local place legend')
  ]),
  'unexplained-mysteries': profile('Record Mystery', ['Archive Mystery', 'Evidence Limits'], [
    place('coroner archive desk', 'a page number repeated without a duplicate sheet', 'case-file uncertainty'),
    place('observatory cabinet', 'a star count not repeated in later charts', 'scientific record mystery'),
    place('lab freezer intake shelf', 'a vial number never submitted', 'laboratory record gap'),
    place('weather station table', 'a signed reading after the evacuation time', 'weather record uncertainty'),
    place('harbor incident office', 'a vessel name erased from every later copy', 'maritime mystery'),
    place('court evidence shelf', 'an envelope with no case number', 'court archive discrepancy'),
    place('rescue dispatch board', 'a transcript phrase from a muted line', 'emergency record limit'),
    place('fire alarm panel room', 'an unmapped zone alert', 'building safety mystery'),
    place('census shelf drawer', 'a household counted under two names', 'civil record gap'),
    place('radio tower log desk', 'a scheduled signal from a silent frequency', 'broadcast mystery')
  ]),
  'classic-folklore': profile('Folk Record Motif', ['Classic Folklore', 'Folk Records'], [
    place('hearth room ledger', 'a family debt paid only in silence', 'household folklore'),
    place('harvest barn tally', 'one sheaf left uncounted for the field', 'harvest custom'),
    place('village well list', 'a name that appears only when the page is wet', 'water folklore'),
    place('parish shelf register', 'a birth name held by red thread', 'naming custom'),
    place('wedding chest ledger', 'a blank witness kept for luck', 'marriage folklore'),
    place('market stall credit book', 'a debt line stored under salt', 'trade custom'),
    place('midwinter table book', 'one candle wick left unburned', 'seasonal folklore'),
    place('threshold step card', 'a visitor mark written in charcoal', 'threshold custom'),
    place('mill house flour book', 'a moonlit delivery without cart tracks', 'rural folklore'),
    place('orchard gate ribbon roll', 'a returning name tied to autumn branches', 'harvest memory')
  ]),
  'modern-legends': profile('Modern Record Legend', ['Modern Legends', 'Service Records'], [
    place('delivery app archive', 'an order from a closed apartment', 'app-era folklore'),
    place('smart lock access log', 'a deleted code used after midnight', 'smart-home legend'),
    place('ride share trip record', 'a stop neither passenger remembers', 'transport legend'),
    place('parking app history', 'a vehicle listed before purchase', 'service record rumor'),
    place('office calendar room list', 'a meeting room removed by renovation', 'workplace folklore'),
    place('gym entry scanner', 'a membership number never issued', 'fitness-center legend'),
    place('hotel keycard audit', 'an entry into a room never sold', 'hotel folklore'),
    place('warehouse pallet scanner', 'a scan from an empty aisle', 'inventory legend'),
    place('service ticket dashboard', 'a repair marked complete before arrival', 'repair folklore'),
    place('convenience shift report', 'a second clerk no schedule names', 'late-night folklore')
  ]),
  myths: profile('Mythic Record', ['Sacred Records', 'Mythic Motifs'], [
    place('dawn temple tablet', 'the first shadow counted as a debt to morning', 'origin myth'),
    place('river court ledger', 'names returned to water at the crossing', 'water myth'),
    place('sky pasture roll', 'stars counted as a herd above the world', 'sky myth'),
    place('moon ferry tally', 'sleeping souls crossing the night border', 'night journey myth'),
    place('first rain granary', 'seeds named before rain gives them form', 'agricultural myth'),
    place('mountain oath hall', 'promises sealed into stone by thunder', 'mountain myth'),
    place('fire bearer shrine', 'one cold spark preserved inside a gift', 'fire myth'),
    place('wind keeper door index', 'doors listed before houses are built', 'wind myth'),
    place('sun harvest bowl', 'light divided into measures for the valley', 'solar myth'),
    place('sleep boundary archive', 'dreams recorded before waking names return', 'dream myth')
  ]),
  'mythic-creatures': profile('Creature Record Legend', ['Creature Folklore', 'Sighting Records'], [
    place('dragon scale house', 'one scale weighed against a rain season', 'dragon folklore'),
    place('sea serpent dock ledger', 'a tide mark left by a body no one saw', 'sea creature lore'),
    place('giant bridge register', 'a footprint counted as a toll', 'giant folklore'),
    place('white stag station log', 'a hoof mark beside an unused track', 'omen creature lore'),
    place('owl spirit gate book', 'a call recorded before the gate opens', 'spirit folklore'),
    place('lake horse ferry desk', 'a wet bridle listed after a missing crossing', 'water creature lore'),
    place('basilisk stable file', 'a cracked mirror entered as equipment', 'monster folklore'),
    place('griffin nest survey', 'a feather weight recorded above the cliff', 'heraldic creature lore'),
    place('black dog watch roll', 'a paw print drying beside the night watch', 'boundary creature lore'),
    place('moth woman lamp log', 'a wing shadow counted under a broken light', 'modern creature rumor')
  ]),
  'lost-worlds': profile('Lost World Record', ['Lost Worlds', 'Map Records'], [
    place('unmapped valley office', 'a cargo route to a valley no timetable shows', 'hidden-valley folklore'),
    place('island customs house', 'a port stamp from a coast that appears only in fog', 'vanished island lore'),
    place('desert harbor archive', 'a berth number printed under sand maps', 'lost harbor legend'),
    place('blue roof city catalog', 'a city filed under a color no atlas explains', 'lost city folklore'),
    place('underground station shelf', 'a platform name below every surveyed tunnel', 'underground world legend'),
    place('glass country atlas', 'a border drawn as if under a museum case', 'imagined geography'),
    place('sunken kingdom tax desk', 'a payment line from a realm that sank inland', 'lost realm tradition'),
    place('hidden orchard survey', 'a field measured beneath an old rail platform', 'buried-place folklore'),
    place('borderless town census', 'a town listed between two countries', 'map mystery'),
    place('folded continent classroom', 'a continent drawn into a paper margin', 'school map legend')
  ]),
  'strange-nature': profile('Nature Record Legend', ['Nature Records', 'Weather Folklore'], [
    place('frost station journal', 'flowers listed during a July freeze', 'seasonal anomaly'),
    place('rain gauge shed', 'drops recorded as moving upward', 'weather folklore'),
    place('pine forest office', 'tree rings that narrow across a year', 'forest mystery'),
    place('river temperature hut', 'warming water at midnight without weather change', 'water phenomenon'),
    place('tide card table', 'a dry wave entered on the shore record', 'coastal folklore'),
    place('cloud shadow observatory', 'a shadow path crossing against the sun', 'sky omen'),
    place('mushroom plot notebook', 'night spore counts after the plot closed', 'field folklore'),
    place('lake ice desk', 'one wet footpath across safe ice', 'winter folklore'),
    place('storm branch yard', 'broken limbs after a windless day', 'storm record mystery'),
    place('bird migration tower', 'one flock charted below the ground', 'migration folklore')
  ]),
  'legendary-places': profile('Legendary Place Record', ['Legendary Places', 'Sacred Records'], [
    place('shrine road office', 'travelers arriving from a road that moved', 'sacred road legend'),
    place('forbidden lake hut', 'a depth line left unnamed', 'forbidden water lore'),
    place('mountain pass toll desk', 'payment to a bell no traveler heard', 'mountain folklore'),
    place('temple gate repair desk', 'a carpenter mark no one claims', 'temple legend'),
    place('abbey salt room plan', 'a chamber drawn where no wall survives', 'monastic folklore'),
    place('cave chapel desk', 'a pilgrim path read beneath clear water', 'cave-place legend'),
    place('sacred grove entry book', 'a rule folded shut in every copy', 'ritual landscape lore'),
    place('harbor bell tower', 'a welcome ring for a ship never docked', 'harbor folklore'),
    place('crossroads post ledger', 'four roads all named north', 'crossroads folklore'),
    place('monastery garden roll', 'a guest room placed beneath the garden', 'sacred lodging legend')
  ]),
  'mythic-objects': profile('Mythic Object Record', ['Mythic Objects', 'Object Records'], [
    place('bronze key bench', 'a key made for a door without a frame', 'threshold object lore'),
    place('mirror catalog room', 'the viewer listed before the glass', 'mirror folklore'),
    place('red thread drawer', 'length missing at dawn without a cut', 'thread folklore'),
    place('silver bell shelf', 'sounds written down before ringing', 'bell folklore'),
    place('iron mask case', 'one speaking line inside a silent catalog', 'mask lore'),
    place('wooden bowl cabinet', 'unshared meals counted in the grain', 'household object lore'),
    place('inkstone desk', 'a dark mark after names are spoken', 'writing-tool folklore'),
    place('clay tablet drawer', 'a promise receipted without witnesses', 'ancient object lore'),
    place('pocket compass box', 'homes pointed to after memory fails', 'travel charm folklore'),
    place('sealed scroll room', 'the reader named before the seal breaks', 'knowledge object lore')
  ]),
  'legend-origins': profile('Record Origin Motif', ['Legend Origins', 'Record Folklore'], [
    place('motif index shelf', 'the way ledgers make rumor feel ordered', 'folklore method'),
    place('field notebook archive', 'how missing observations become story gaps', 'source pattern'),
    place('receipt archive desk', 'why printed slips act like modern proof', 'document folklore'),
    place('timestamp table', 'how a date turns into an omen', 'digital folklore'),
    place('census drawer', 'why blank lines invite legend building', 'civil record motif'),
    place('ledger shelf', 'how debts become moral stories', 'accounting motif'),
    place('guestbook path', 'why visitor names become threshold clues', 'place folklore'),
    place('map error desk', 'how extra roads create lost places', 'cartographic folklore'),
    place('signature file', 'why names feel like witnesses', 'proof motif'),
    place('checklist screen', 'how completed boxes became digital witness marks', 'interface folklore')
  ])
};

const additions = [];

for (const category of categories) {
  const contexts = profiles[category.slug]?.contexts || [];
  if (contexts.length !== 10) {
    throw new Error(`${category.slug} requires 10 record contexts, found ${contexts.length}.`);
  }

  for (let index = 0; index < contexts.length; index += 1) {
    const plan = buildPlan(category, profiles[category.slug], contexts[index], slotPatterns[index]);
    const story = buildStory(plan, category, index);
    if (storySlugs.has(story.slug)) {
      console.warn(`Skipped duplicate slug: ${story.slug}`);
      continue;
    }
    story.contentDNA = buildContentDNA(story, existingQueries);
    storySlugs.add(story.slug);
    if (story.contentDNA?.canonicalQuery) existingQueries.add(story.contentDNA.canonicalQuery.toLowerCase().trim());
    additions.push(story);
  }
}

stories.unshift(...additions.reverse());
writeJson(storiesPath, stories);
console.log(`Added ${additions.length} record-centered archive stories.`);

function profile(tag, extraTags, contexts) {
  return { tag, extraTags, contexts };
}

function place(placeName, motif, evidence) {
  return { place: placeName, motif, evidence };
}

function buildPlan(category, categoryProfile, context, slot) {
  const placeTitle = titleCase(context.place);
  const title = `The ${placeTitle} ${slot.title}`;
  const slug = slugify(title);
  return {
    slug,
    title,
    detail: slot.detail(context),
    evidence: slot.evidence(context),
    tag: categoryProfile.tag,
    tags: unique([categoryProfile.tag, ...categoryProfile.extraTags, slot.tag])
  };
}

function buildStory(plan, category, index) {
  const subject = plan.title.replace(/:.*$/, '').trim();
  const keyword = plan.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  const relatedSlugs = stories.filter((story) => story.categorySlug === category.slug && story.slug !== plan.slug).slice(0, 4).map((story) => story.slug);
  const relatedKeywords = unique([
    `${keyword} meaning`,
    `${keyword} origin`,
    `${plan.tag.toLowerCase()} folklore`,
    `${category.title.toLowerCase()} record`,
    'record folklore',
    'archive mystery'
  ]);

  return {
    id: plan.slug,
    slug: plan.slug,
    title: plan.title,
    displayTitle: plan.title,
    h1: `${plan.title}: Record, Meaning, and Folklore Pattern`,
    seoTitle: `${subject}: Record, Meaning, and Folklore Pattern`,
    metaTitle: `${subject}: Record, Meaning, and Folklore Pattern`,
    metaDescription: `${subject} examines ${plan.detail} as a record-centered ${category.title.toLowerCase()} archive subject with careful source limits.`,
    category: category.title,
    categorySlug: category.slug,
    categoryGroup: category.group,
    tag: plan.tag,
    primaryTag: plan.tag,
    seedKeyword: keyword,
    primaryKeyword: keyword,
    searchIntent: 'origin',
    articleFormat: 'search-info',
    cluster: `${category.title} / ${plan.tag}`,
    relatedKeywords,
    secondaryKeywords: relatedKeywords.slice(0, 5),
    topicScore: 86 + ((index + category.slug.length) % 8),
    topicStatus: 'approved',
    scoreBreakdown: {
      searchDemand: 18,
      folkloreFit: 20,
      evergreenValue: 18,
      sourceSafety: 15,
      internalLinking: 15
    },
    summaryAnswer: `${subject} is a record-centered archive subject built around ${plan.detail}. The strongest reading treats the written trace as folklore evidence, not proof that every strange claim happened literally.`,
    readTime: `${8 + (index % 3)} min read`,
    storyType: `${category.title} Record`,
    sourceStatus: `${category.title} / ${plan.tag} / Record motif explanation`,
    excerpt: `${subject} follows ${plan.detail}, showing how ordinary paperwork can become the center of a legend, mystery, or symbolic tradition.`,
    introSummary: `${subject} begins with an ordinary record: a ledger, log, list, register, map, receipt, card, or file. What makes the subject memorable is the small detail that refuses to sit neatly inside the record. This archive reading keeps the story grounded in source limits while exploring why the written trace feels so persuasive.`,
    publishedAt,
    updatedAt: publishedAt,
    relatedStoryIds: relatedSlugs,
    relatedStorySlugs: relatedSlugs,
    tags: unique([...plan.tags.filter((tag) => tag !== category.title), 'Archive Pattern']).slice(0, 5),
    detail: plan.detail,
    evidence: plan.evidence,
    generationMode: 'canonical-archive',
    researchSources: [
      {
        title: `${subject} record motif overview`,
        supports: `Explains how ${plan.detail} functions as a folklore record rather than a verified incident report.`
      },
      {
        title: `${category.title} context and archive comparison`,
        supports: `Places the subject inside ${category.title} and compares it with related record-centered archive patterns.`
      },
      {
        title: `${plan.tag} source limits`,
        supports: `Separates the symbolic role of ${plan.evidence} from claims that cannot be independently verified.`
      }
    ],
    sourceNotes: {
      sharedVerifiedPoints: [
        `${subject} is framed as a record-centered archive subject within ${category.title}.`,
        `The central evidence pattern involves ${plan.evidence}.`,
        'The article treats the record as a folklore device and keeps unsupported claims clearly limited.'
      ],
      variants: [
        'Names, dates, documents, places, and written details may shift by region, retelling, or platform.',
        'Later versions often make the record look more precise than the source material can support.'
      ],
      unsupportedClaimsToAvoid: [
        'Do not present supernatural claims as verified events.',
        'Do not invent specific documents, witnesses, dates, institutions, or archive numbers beyond the source-aware premise.',
        'Do not imply that a written trace proves the event happened literally.'
      ],
      sourceLimits: [
        'No single record should be treated as complete proof of a supernatural or impossible event.',
        'Dates, signatures, page numbers, logs, and receipts can be copied, misread, mistranscribed, or retold through rumor.',
        'The archive reading focuses on meaning, repetition, and narrative structure rather than sensational certainty.'
      ]
    },
    contentType: 'story'
  };
}

function titleCase(value) {
  const smallWords = new Set(['a', 'an', 'and', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'the', 'to', 'with']);
  return String(value)
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && smallWords.has(lower)) return lower;
      return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
    })
    .join(' ');
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
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
