const bannedGenericPhrases = [
  'That is the image at the center of this Kyunolab record.',
  'The story begins with an ordinary scene',
  'The central record is simple',
  'That compactness makes the story portable',
  'The familiar version begins with routine',
  'There is no single confirmed origin',
  'What makes this story unsettling is',
  'Like many modern legends',
  'Whether true or not'
];

const bannedFaqQuestions = [
  'is this story true?',
  'where did this story come from?',
  'why is this story scary?'
];

const categoryDefaults = {
  'urban-legends': {
    subjectClass: 'public-space-rumor',
    narrativeLens: 'urban-legend-lens',
    culturalFrame: 'ordinary public spaces',
    evidencePosture: 'modern-urban-legend'
  },
  'internet-folklore': {
    subjectClass: 'digital-glitch',
    narrativeLens: 'technology-lens',
    culturalFrame: 'online sharing culture',
    evidencePosture: 'digital-folklore-pattern'
  },
  'strange-places': {
    subjectClass: 'strange-place',
    narrativeLens: 'public-space-lens',
    culturalFrame: 'liminal buildings and travel spaces',
    evidencePosture: 'place-rumor'
  },
  'unexplained-mysteries': {
    subjectClass: 'unexplained-record',
    narrativeLens: 'evidence-limits-lens',
    culturalFrame: 'ordinary records with unresolved details',
    evidencePosture: 'anecdotal-record'
  },
  'classic-folklore': {
    subjectClass: 'household-folklore',
    narrativeLens: 'folklore-lens',
    culturalFrame: 'household custom and inherited warning',
    evidencePosture: 'folklore-pattern'
  },
  'modern-legends': {
    subjectClass: 'modern-warning-story',
    narrativeLens: 'urban-legend-lens',
    culturalFrame: 'contemporary routines and public warnings',
    evidencePosture: 'modern-urban-legend'
  },
  myths: {
    subjectClass: 'symbolic-myth',
    narrativeLens: 'symbolic-lens',
    culturalFrame: 'traditional explanation and sacred pattern',
    evidencePosture: 'symbolic-reading'
  },
  'mythic-creatures': {
    subjectClass: 'creature-encounter',
    narrativeLens: 'folklore-lens',
    culturalFrame: 'roads, water, forests, and threshold places',
    evidencePosture: 'folklore-pattern'
  },
  'lost-worlds': {
    subjectClass: 'lost-world',
    narrativeLens: 'map-and-memory-lens',
    culturalFrame: 'maps, tickets, routes, and almost-places',
    evidencePosture: 'legendary-geography'
  },
  'strange-nature': {
    subjectClass: 'landscape-anomaly',
    narrativeLens: 'nature-folklore-lens',
    culturalFrame: 'fields, weather, lakes, and seasonal signs',
    evidencePosture: 'anecdotal-record'
  },
  'legendary-places': {
    subjectClass: 'legendary-place',
    narrativeLens: 'place-memory-lens',
    culturalFrame: 'local landmarks and remembered buildings',
    evidencePosture: 'place-rumor'
  },
  'mythic-objects': {
    subjectClass: 'object-haunting',
    narrativeLens: 'symbolic-lens',
    culturalFrame: 'objects, rooms, locks, mirrors, and household rules',
    evidencePosture: 'symbolic-reading'
  },
  'legend-origins': {
    subjectClass: 'motif-origin',
    narrativeLens: 'folklore-pattern-lens',
    culturalFrame: 'how repeated stories become readable patterns',
    evidencePosture: 'folklore-pattern'
  }
};

function buildContentDNA(story, existingQueries = new Set()) {
  const defaults = categoryDefaults[story.categorySlug] || categoryDefaults['urban-legends'];
  const targetQuery = story.targetQuery || story.seedKeyword || titleToQuery(story.title);
  const canonicalBase = story.canonicalQuery || canonicalizeQuery(targetQuery || story.slug);
  const canonicalQuery = makeUniqueCanonical(canonicalBase, story.slug, existingQueries);
  const shortSubject = getShortSubject(story);
  const detail = trimSentence(story.detail || story.excerpt || story.metaDescription || shortSubject);
  const evidenceBits = splitEvidence(story.evidence);
  const vocabulary = buildVocabulary(story, shortSubject, evidenceBits);
  const requiredDetails = buildRequiredDetails(story, detail, evidenceBits, vocabulary);
  const sectionBlueprint = buildSectionBlueprint(story, shortSubject);

  return {
    targetQuery,
    canonicalQuery,
    searchQuestion: story.searchQuestion || `Why does ${targetQuery} feel memorable as a ${String(story.category || 'folklore').toLowerCase()} record?`,
    readerIntent: story.readerIntent || buildReaderIntent(story, shortSubject),
    uniqueAngle: story.uniqueAngle || buildUniqueAngle(story, shortSubject, detail),
    subjectClass: story.subjectClass || defaults.subjectClass,
    narrativeLens: story.narrativeLens || defaults.narrativeLens,
    evidencePosture: story.evidencePosture || defaults.evidencePosture,
    culturalFrame: story.culturalFrame || defaults.culturalFrame,
    sceneAnchor: story.sceneAnchor || buildSceneAnchor(story, detail),
    subjectSpecificVocabulary: vocabulary.slice(0, 8),
    requiredSpecificDetails: requiredDetails.slice(0, 8),
    prohibitedGenericPhrases: bannedGenericPhrases,
    sectionBlueprint
  };
}

function validateContentDNA(story, allStories = []) {
  const errors = [];
  const warnings = [];
  const dna = story.contentDNA || {};

  for (const field of [
    'targetQuery',
    'canonicalQuery',
    'searchQuestion',
    'uniqueAngle',
    'subjectClass',
    'narrativeLens',
    'evidencePosture',
    'culturalFrame',
    'sceneAnchor'
  ]) {
    if (!String(dna[field] || '').trim()) errors.push(`missing contentDNA.${field}`);
  }

  if (!Array.isArray(dna.subjectSpecificVocabulary) || dna.subjectSpecificVocabulary.length < 5) {
    errors.push('contentDNA.subjectSpecificVocabulary must contain at least 5 items');
  }
  if (!Array.isArray(dna.requiredSpecificDetails) || dna.requiredSpecificDetails.length < 5) {
    errors.push('contentDNA.requiredSpecificDetails must contain at least 5 items');
  }
  if (!Array.isArray(dna.sectionBlueprint) || dna.sectionBlueprint.length < 4) {
    errors.push('contentDNA.sectionBlueprint must contain at least 4 headings');
  }

  const normalizedQuery = normalize(dna.canonicalQuery);
  if (normalizedQuery) {
    const duplicate = allStories.find((item) => item.slug !== story.slug && normalize(item.contentDNA?.canonicalQuery || item.canonicalQuery) === normalizedQuery);
    if (duplicate) errors.push(`contentDNA.canonicalQuery duplicates ${duplicate.slug}`);
  }

  if (Array.isArray(dna.sectionBlueprint)) {
    const headings = dna.sectionBlueprint.map((item) => normalize(typeof item === 'string' ? item : item.title)).filter(Boolean);
    const unique = new Set(headings);
    if (unique.size !== headings.length) errors.push('contentDNA.sectionBlueprint contains duplicate headings');
    const genericHeadings = ['what is it', 'where did it begin', 'why does it matter', 'what is verified and what is not'];
    if (headings.some((heading) => genericHeadings.includes(heading))) warnings.push('contentDNA.sectionBlueprint contains overly generic headings');
  }

  return { errors, warnings };
}

function findBannedPhrases(text) {
  const normalizedText = String(text || '').toLowerCase();
  return bannedGenericPhrases.filter((phrase) => normalizedText.includes(phrase.toLowerCase()));
}

function findGenericFaqQuestions(text) {
  const normalizedText = String(text || '').toLowerCase();
  return bannedFaqQuestions.filter((question) => normalizedText.includes(`<h3>${question}`) || normalizedText.includes(`>${question}</h3>`));
}

function countVocabularyHits(text, vocabulary = []) {
  const source = String(text || '').toLowerCase();
  return vocabulary.filter((term) => source.includes(String(term).toLowerCase())).length;
}

function buildVocabulary(story, shortSubject, evidenceBits) {
  const terms = [];
  terms.push(...(story.tags || []));
  terms.push(story.primaryTag || story.tag);
  terms.push(...(story.relatedKeywords || []));
  terms.push(...splitUsefulPhrases(story.detail));
  terms.push(...evidenceBits);
  terms.push(story.category);
  terms.push(shortSubject);
  return uniqueTerms(terms)
    .filter((term) => term.length >= 4)
    .slice(0, 12);
}

function buildRequiredDetails(story, detail, evidenceBits, vocabulary) {
  return uniqueTerms([
    detail,
    story.excerpt,
    story.primaryTag || story.tag,
    story.sourceStatus,
    story.category,
    ...evidenceBits,
    ...vocabulary.slice(0, 4)
  ]).filter(Boolean);
}

function buildSectionBlueprint(story, shortSubject) {
  const subject = toTitleCase(shortSubject).replace(/^(The|A|An)\s+/i, '');
  const middle = categoryMiddleHeading(story, subject);
  return uniqueTerms([
    `What Is the ${subject} Story?`,
    originHeadingFor(story, subject),
    versionsHeadingFor(story, subject),
    middle,
    evidenceHeadingFor(story),
    meaningHeadingFor(story, subject)
  ]).map((title) => ({ title, nav: shortNav(title) }));
}

function originHeadingFor(story, subject) {
  const category = String(story.categorySlug || '').toLowerCase();
  if (category.includes('internet')) return `How ${subject} Became Internet Folklore`;
  if (category.includes('myth')) return `The Mythic Origin and Meaning Behind ${subject}`;
  if (category.includes('folklore')) return `The Folklore Origin Behind ${subject}`;
  if (category.includes('place') || category.includes('world')) return `The Place Legend Behind ${subject}`;
  if (category.includes('nature')) return `The Natural Sign Behind ${subject}`;
  if (category.includes('origin')) return `The Origin Pattern Behind ${subject}`;
  if (category.includes('mysteries')) return `The Record and the Unanswered Question Behind ${subject}`;
  return `The Origin and Folklore Behind ${subject}`;
}

function versionsHeadingFor(story, subject) {
  const category = String(story.categorySlug || '').toLowerCase();
  if (category.includes('internet')) return `Common Online Versions of ${subject}`;
  if (category.includes('myth')) return `Common Versions and Symbols in ${subject}`;
  if (category.includes('place') || category.includes('world')) return `Common Versions of the Place Legend`;
  if (category.includes('nature')) return `Common Versions of the Natural Omen`;
  if (category.includes('mysteries')) return `Different Ways Readers Explain ${subject}`;
  return `Common Versions of the Legend`;
}

function meaningHeadingFor(story, subject) {
  const category = String(story.categorySlug || '').toLowerCase();
  if (category.includes('internet')) return `Why This Internet Folklore Still Spreads`;
  if (category.includes('myth')) return `What ${subject} Means in Myth and Folklore`;
  if (category.includes('place') || category.includes('world')) return `Why This Place Legend Still Feels Possible`;
  if (category.includes('nature')) return `What This Nature Folklore Means`;
  if (category.includes('mysteries')) return `Why the Mystery Still Lasts`;
  return `Why This Folklore Still Lasts`;
}

function buildReaderIntent(story, shortSubject) {
  const category = String(story.category || 'archive record').toLowerCase();
  const tag = story.primaryTag || story.tag || story.category;
  return `Find a clear, source-aware answer about ${shortSubject.toLowerCase()}, including the ${tag.toLowerCase()} motif, the evidence limits, and the reason this ${category} subject still attracts readers.`;
}

function categoryMiddleHeading(story, subject) {
  const category = String(story.categorySlug || '').toLowerCase();
  if (category.includes('internet')) return pickBySlug(story.slug, [
    'Why the Digital Trace Matters More Than the Scare',
    'How a Small Online Detail Becomes the Whole Story',
    'Why Screenshots Make the Rumor Feel Close'
  ]);
  if (category.includes('place') || category.includes('world')) return pickBySlug(story.slug, [
    'Why the Location Becomes the Main Character',
    'How the Map Keeps the Story Alive',
    'Why the Setting Does More Than Hold the Plot'
  ]);
  if (category.includes('nature')) return pickBySlug(story.slug, [
    'Why the Landscape Makes the Pattern Believable',
    'How a Natural Detail Turns Into a Local Sign',
    'Why Repeated Weather or Animal Details Matter'
  ]);
  if (category.includes('myth') || category.includes('folklore')) return pickBySlug(story.slug, [
    'What the Motif Reveals Before It Explains Anything',
    'Why the Rule Matters More Than the Literal Claim',
    'How the Symbol Carries the Story Forward'
  ]);
  if (category.includes('origin')) return pickBySlug(story.slug, [
    `How ${subject} Turns Into a Repeatable Pattern`,
    `Why ${subject} Becomes Easier to Retell`,
    `What Changes When ${subject} Becomes a Motif`
  ]);
  if (category.includes('mysteries')) return pickBySlug(story.slug, [
    'Why the Missing Piece Matters More Than the Answer',
    'How the Gap in the Record Holds the Reader',
    'Why the Unconfirmed Detail Does So Much Work'
  ]);
  return pickBySlug(story.slug, [
    'Why the Ordinary Setting Makes the Rumor Work',
    'How a Familiar Place Turns Uneasy',
    'Why the Small Public Detail Keeps Returning'
  ]);
}

function evidenceHeadingFor(story) {
  const posture = String(story.contentDNA?.evidencePosture || story.evidencePosture || story.sourceStatus || '').toLowerCase();
  if (posture.includes('fiction')) return 'What the Archive Frame Can Support';
  if (posture.includes('symbolic')) return pickBySlug(story.slug, [
    'Where Symbolic Reading Ends',
    'What the Symbol Can and Cannot Prove',
    'How Far the Motif Can Be Taken'
  ]);
  if (posture.includes('digital')) return pickBySlug(story.slug, [
    'What Logs or Screenshots Would Need to Show',
    'Where the Digital Trail Gets Uncertain',
    'What an Archive Copy Could Actually Prove'
  ]);
  if (posture.includes('place')) return pickBySlug(story.slug, [
    'What Local Records Could Actually Prove',
    'Where the Map Stops Being Enough',
    'What the Location Evidence Can Support'
  ]);
  return pickBySlug(story.slug, [
    'Where the Evidence Becomes Thin',
    'What the Record Can Support',
    'Where the Source Trail Starts to Fade'
  ]);
}

function buildUniqueAngle(story, shortSubject, detail) {
  const frame = categoryDefaults[story.categorySlug]?.culturalFrame || 'ordinary life';
  return `${shortSubject} is treated through ${frame}, with attention to the concrete detail that ${detail}.`;
}

function buildSceneAnchor(story, detail) {
  const excerpt = String(story.excerpt || '').replace(/\.$/, '');
  if (excerpt) return excerpt;
  return `${getShortSubject(story)}: ${detail}`;
}

function makeUniqueCanonical(base, slug, existingQueries) {
  const normalized = canonicalizeQuery(base);
  if (!existingQueries.has(normalized)) {
    existingQueries.add(normalized);
    return normalized;
  }
  const fallback = canonicalizeQuery(`${normalized} ${slug}`);
  existingQueries.add(fallback);
  return fallback;
}

function titleToQuery(title) {
  return String(title || '')
    .replace(/:.*$/, '')
    .replace(/^The\s+/i, '')
    .trim()
    .toLowerCase();
}

function canonicalizeQuery(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getShortSubject(story) {
  return String(story.displayTitle || story.title || story.slug || '')
    .replace(/:.*$/, '')
    .replace(/^Why\s+/i, '')
    .trim();
}

function splitEvidence(value) {
  return String(value || '')
    .split(/,|;|\band\b/i)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitUsefulPhrases(value) {
  const text = String(value || '').replace(/[.?!]/g, ' ');
  const chunks = text.split(/,|;|:|\band\b|\bor\b|\bwith\b|\babout\b|\bthat\b|\bwhere\b/i).map((item) => item.trim());
  const words = text.split(/\s+/).map((word) => word.replace(/[^a-z0-9'-]/gi, '')).filter((word) => word.length > 4);
  return [...chunks, ...words];
}

function uniqueTerms(values) {
  const seen = new Set();
  const terms = [];
  for (const value of values) {
    const term = String(value || '').replace(/\s+/g, ' ').trim();
    if (!term) continue;
    const key = normalize(term);
    if (seen.has(key)) continue;
    seen.add(key);
    terms.push(term);
  }
  return terms;
}

function trimSentence(value) {
  return String(value || '').replace(/\s+/g, ' ').replace(/[.?!]+$/, '').trim();
}

function shortNav(title) {
  return String(title || '')
    .replace(/^Why\s+/i, '')
    .replace(/^How\s+/i, '')
    .replace(/^What\s+/i, '')
    .split(/\s+/)
    .slice(0, 4)
    .join(' ');
}

function toTitleCase(value) {
  return String(value || '').replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function pickBySlug(slug, values) {
  const source = String(slug || '');
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash + source.charCodeAt(index) * (index + 1)) % 7919;
  }
  return values[hash % values.length];
}

module.exports = {
  bannedGenericPhrases,
  bannedFaqQuestions,
  buildContentDNA,
  validateContentDNA,
  findBannedPhrases,
  findGenericFaqQuestions,
  countVocabularyHits
};
