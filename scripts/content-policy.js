const policyEffectiveDate = '2026-07-19';

const unifiedContentPolicy = {
  name: 'Unified External-Story Policy',
  summary: 'Facts are not the eligibility test. The subject must already exist outside Kyunolab.',
  rules: [
    'Kyunolab does not use separate Creative or Record modes.',
    'Every new article must cover a story, legend, myth, rumor, sighting, interpretation, or variation that already existed outside Kyunolab before the article was generated.',
    'Historical truth, academic verification, and the size of the audience are not eligibility requirements.',
    'A story may be globally famous, regionally known, circulated within a small online community, mentioned in a single recorded account, or preserved on a personal website.',
    'The essential requirement is that the story or claim already existed outside Kyunolab.',
    'Editorial interpretation, symbolic reading, and abstract speculation are allowed when clearly presented as interpretation or possibility.',
    'The system must not invent new characters, events, places, objects, technologies, powers, rules, rituals, dialogue, documents, sightings, causes, or endings and present them as existing folklore.',
    'Different sources must not be merged into a new continuous story unless an external source already connects those elements.'
  ]
};

const requiredStoryBriefFields = [
  'topic',
  'category',
  'contentType',
  'existenceStatus',
  'circulationLevel',
  'knownNames',
  'coreStoryElements',
  'reportedVariants',
  'editorialInterpretationOptions',
  'uncertainDetails',
  'prohibitedInventions',
  'existenceEvidence'
];

function policyAppliesToStory(story) {
  const date = String(story.publishedAt || story.updatedAt || '');
  return date >= policyEffectiveDate || Boolean(story.storyBrief);
}

function validateStoryBrief(story) {
  const errors = [];
  const brief = story.storyBrief;

  if (!brief || typeof brief !== 'object') {
    errors.push('missing storyBrief');
    return errors;
  }

  for (const field of requiredStoryBriefFields) {
    const value = brief[field];
    if (Array.isArray(value) ? value.length === 0 : !String(value || '').trim()) {
      errors.push(`storyBrief.${field} is required`);
    }
  }

  if (brief.existenceStatus !== 'confirmed') {
    errors.push('storyBrief.existenceStatus must be confirmed');
  }

  const evidence = Array.isArray(brief.existenceEvidence) ? brief.existenceEvidence : [];
  for (const item of evidence) {
    if (!item || typeof item !== 'object') {
      errors.push('storyBrief.existenceEvidence entries must be objects');
      continue;
    }
    if (!String(item.title || '').trim()) errors.push('storyBrief.existenceEvidence.title is required');
    if (!String(item.url || '').trim()) errors.push('storyBrief.existenceEvidence.url is required');
    if (!String(item.sourceType || '').trim()) errors.push('storyBrief.existenceEvidence.sourceType is required');
  }

  return errors;
}

function validateUnifiedArticle(story, renderedText = '') {
  const errors = [];
  if (!policyAppliesToStory(story)) return errors;

  errors.push(...validateStoryBrief(story));
  if (errors.length) return errors;

  const brief = story.storyBrief;
  if (story.generationMode || story.mode) {
    errors.push('new unified-policy stories must not store mode or generationMode');
  }

  const searchableText = normalizeText(renderedText || [
    story.title,
    story.metaDescription,
    story.excerpt,
    story.summaryAnswer,
    story.detail,
    ...(story.contentDNA?.sectionBlueprint || []).map((item) => typeof item === 'string' ? item : item.title)
  ].join(' '));

  const coreHits = (brief.coreStoryElements || []).filter((item) => keywordHit(searchableText, item));
  if (coreHits.length < Math.min(3, brief.coreStoryElements.length)) {
    errors.push('article does not reflect enough storyBrief.coreStoryElements');
  }

  const interpretationMarkers = [
    'may be read',
    'may suggest',
    'can be interpreted',
    'can be treated',
    'can be documented',
    'may be treated',
    'best reading',
    'strongest reading',
    'symbolically',
    'one possible reading',
    'this interpretation',
    'in that reading'
  ];
  const hasInterpretationMarker = interpretationMarkers.some((marker) => searchableText.includes(marker));
  if ((brief.editorialInterpretationOptions || []).length && !hasInterpretationMarker) {
    errors.push('editorial interpretation must be marked as interpretation or possibility');
  }

  const reportedVariantMarkers = [
    'some versions',
    'a regional variation',
    'later accounts',
    'later stories',
    'later summaries',
    'one online version',
    'reported variant',
    'in later retellings',
    'later retellings',
    'later versions',
    'different versions',
    'older versions',
    'regional versions',
    'accounts differ',
    'details vary',
    'traditions do not all',
    'modern retellings',
    'versions differ'
  ];
  const hasVariantMarker = reportedVariantMarkers.some((marker) => searchableText.includes(marker));
  if ((brief.reportedVariants || []).length && !hasVariantMarker) {
    errors.push('reported variants must be separated from the core story');
  }

  return errors;
}

function normalizeText(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function keywordHit(text, value) {
  const words = normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4)
    .filter((word) => !['that', 'with', 'from', 'into', 'through', 'story', 'myth'].includes(word));
  if (!words.length) return false;
  const needed = Math.min(3, words.length);
  return words.filter((word) => text.includes(word)).length >= needed;
}

module.exports = {
  policyEffectiveDate,
  unifiedContentPolicy,
  policyAppliesToStory,
  validateStoryBrief,
  validateUnifiedArticle
};
