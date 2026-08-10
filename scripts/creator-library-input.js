const {
  buildCreatorFactRecords,
  deriveCompatibilityFields,
  validateCreatorFactRecords
} = require('./creator-library-facts');

const SUPPORTED_CONTENT_TYPES = new Set([
  'myth-narrative',
  'folklore-legend',
  'mythical-being-object',
  'urban-modern-legend',
  'internet-folklore',
  'place-event-mystery',
  'origin-comparison'
]);

const CONTENT_TYPE_ALIASES = {
  myth: 'myth-narrative',
  myths: 'myth-narrative',
  'myth-narrative': 'myth-narrative',
  folklore: 'folklore-legend',
  'classic-folklore': 'folklore-legend',
  'folklore-legend': 'folklore-legend',
  'mythic-creatures': 'mythical-being-object',
  'mythic-objects': 'mythical-being-object',
  'mythical-being-object': 'mythical-being-object',
  'urban-legends': 'urban-modern-legend',
  'modern-legends': 'urban-modern-legend',
  'urban-modern-legend': 'urban-modern-legend',
  'internet-folklore': 'internet-folklore',
  'strange-places': 'place-event-mystery',
  'unexplained-mysteries': 'place-event-mystery',
  'lost-worlds': 'place-event-mystery',
  'strange-nature': 'place-event-mystery',
  'legendary-places': 'place-event-mystery',
  'place-event-mystery': 'place-event-mystery',
  'legend-origins': 'origin-comparison',
  'origin-comparison': 'origin-comparison'
};

const INTERNAL_TEMPLATE_PATTERNS = [
  /^pre-existing\s+myths?\s+subject$/i,
  /^this article follows\b.*$/i,
  /^the article should\b.*$/i,
  /^the heading keeps the focus\b.*$/i,
  /\bsource-aware kyunolab record\b/gi,
  /\ba source-aware kyunolab record tracing\b/gi,
  /\bsource-aware retellings?\b/gi,
  /\bsource-aware\b/gi,
  /^archive writing instructions?:?.*$/i,
  /^public article generation instructions?:?.*$/i,
  /^creator library generation instructions?:?.*$/i,
  /^todo$/i,
  /^placeholder$/i,
  /^n\/a$/i
];

const CATEGORY_CONTENT_TYPE_MAP = {
  myths: 'myth-narrative',
  'classic-folklore': 'folklore-legend',
  'mythic-creatures': 'mythical-being-object',
  'mythic-objects': 'mythical-being-object',
  'urban-legends': 'urban-modern-legend',
  'modern-legends': 'urban-modern-legend',
  'internet-folklore': 'internet-folklore',
  'strange-places': 'place-event-mystery',
  'unexplained-mysteries': 'place-event-mystery',
  'lost-worlds': 'place-event-mystery',
  'strange-nature': 'place-event-mystery',
  'legendary-places': 'place-event-mystery',
  'legend-origins': 'origin-comparison'
};

function normalizeCreatorStoryInput(story = {}, category = {}) {
  const sourceFieldMap = {};
  const warnings = [];
  const missingRequiredFields = [];
  const brief = objectValue(story.storyBrief);
  const dna = objectValue(story.contentDNA);
  const base = {
    schemaVersion: '1.0',
    slug: firstString([
      sourceValue(story.slug, 'story.slug', sourceFieldMap, 'slug')
    ], warnings),
    topic: firstString([
      sourceValue(brief.topic, 'storyBrief.topic', sourceFieldMap, 'topic'),
      sourceValue(story.title, 'story.title', sourceFieldMap, 'topic')
    ], warnings),
    categorySlug: firstString([
      sourceValue(story.categorySlug, 'story.categorySlug', sourceFieldMap, 'categorySlug'),
      sourceValue(category.slug, 'category.slug', sourceFieldMap, 'categorySlug')
    ], warnings),
    categoryName: firstString([
      sourceValue(category.title, 'category.title', sourceFieldMap, 'categoryName'),
      sourceValue(category.name, 'category.name', sourceFieldMap, 'categoryName'),
      sourceValue(brief.category, 'storyBrief.category', sourceFieldMap, 'categoryName')
    ], warnings)
  };

  base.contentType = classifyCreatorContentType({ story, category, input: base });
  markSource(sourceFieldMap, 'contentType', classificationSource(story, category, base.contentType));

  const factStats = {};
  const factRecords = buildCreatorFactRecords(story, category, {
    contentType: base.contentType,
    topic: base.topic,
    stats: factStats
  });
  const compatibility = deriveCompatibilityFields(factRecords);
  for (const [field, factTypes] of Object.entries(compatibilitySourceTypes())) {
    for (const sourceRef of factRecords
      .filter((record) => factTypes.includes(record.factType))
      .flatMap((record) => record.sourceRefs || [])) {
      markSource(sourceFieldMap, field, sourceRef);
    }
  }

  const input = {
    ...base,
    contentType: base.contentType,
    factRecords,
    knownNames: collectArray([
      sourceValue(brief.knownNames, 'storyBrief.knownNames', sourceFieldMap, 'knownNames'),
      sourceValue(story.subjectSpecificVocabulary, 'story.subjectSpecificVocabulary', sourceFieldMap, 'knownNames')
    ], warnings),
    keyActors: collectArray([
      sourceValue(brief.keyActors, 'storyBrief.keyActors', sourceFieldMap, 'keyActors'),
      sourceValue(dna.keyActors, 'contentDNA.keyActors', sourceFieldMap, 'keyActors'),
      sourceValue(brief.knownNames, 'storyBrief.knownNames', sourceFieldMap, 'keyActors')
    ], warnings),
    setting: collectArray([
      sourceValue(brief.setting, 'storyBrief.setting', sourceFieldMap, 'setting'),
      sourceValue(brief.cultureOrContext, 'storyBrief.cultureOrContext', sourceFieldMap, 'setting'),
      sourceValue(story.setting, 'story.setting', sourceFieldMap, 'setting'),
      sourceValue(story.sceneAnchor, 'story.sceneAnchor', sourceFieldMap, 'setting'),
      sourceValue(compatibility.visualVocabulary.filter((item) => /place|region|culture|tradition|urban|internet|myth|legend|archive|road|room|temple|sea|island|forest|town|meeting|digital/i.test(item)), 'factRecords.settingTerms', sourceFieldMap, 'setting')
    ], warnings),
    coreProblem: compatibility.coreProblem,
    eventSequence: compatibility.eventSequence,
    turningPoint: compatibility.turningPoint,
    outcome: compatibility.outcome,
    reportedVariants: compatibility.reportedVariants,
    sourceContext: compatibility.sourceContext,
    meaningOptions: compatibility.meaningOptions,
    visualVocabulary: compatibility.visualVocabulary,
    archiveNarrative: buildArchiveNarrativeSource(story),
    forbiddenInventions: collectArray([
      sourceValue(brief.prohibitedInventions, 'storyBrief.prohibitedInventions', sourceFieldMap, 'forbiddenInventions'),
      sourceValue(story.prohibitedInventions, 'story.prohibitedInventions', sourceFieldMap, 'forbiddenInventions'),
      sourceValue(story.sourceNotes?.sourceLimits, 'sourceNotes.sourceLimits', sourceFieldMap, 'forbiddenInventions'),
      sourceValue(brief.uncertainDetails, 'storyBrief.uncertainDetails', sourceFieldMap, 'forbiddenInventions')
    ], warnings),
    sourceEvidence: collectSourceEvidence(story, brief, sourceFieldMap, warnings),
    sourceFieldMap,
    missingRequiredFields,
    warnings
  };

  if (factStats.removedInternalInstruction) warnings.push(`Removed ${factStats.removedInternalInstruction} internal instruction fact candidate(s).`);
  if (factStats.removedFragment) warnings.push(`Removed ${factStats.removedFragment} incomplete fact fragment candidate(s).`);
  if (factStats.removedDuplicate) warnings.push(`Merged ${factStats.removedDuplicate} duplicate fact candidate(s).`);
  validateNormalizedCreatorInput(input);
  return input;
}

function classifyCreatorContentType(source = {}) {
  const story = source.story || source;
  const category = source.category || {};
  const input = source.input || {};
  const brief = objectValue(story.storyBrief);
  const dna = objectValue(story.contentDNA);

  return normalizeContentType(brief.contentType)
    || normalizeContentType(brief.creatorContentType)
    || normalizeContentType(brief.archiveContentType)
    || normalizeContentType(dna.contentType)
    || normalizeContentType(story.creatorContentType)
    || normalizeContentType(story.archiveContentType)
    || normalizeContentType(input.categorySlug)
    || normalizeContentType(story.categorySlug)
    || normalizeContentType(category.slug)
    || '';
}

function sanitizeCreatorInputText(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeCreatorInputText).filter(Boolean).join(' ');
  }
  if (value && typeof value === 'object') {
    const preferredFields = [
      'text',
      'content',
      'paragraph',
      'summary',
      'answer',
      'title',
      'heading',
      'description',
      'detail',
      'factText',
      'name',
      'label',
      'value'
    ];
    for (const field of preferredFields) {
      const text = sanitizeCreatorInputText(value[field]);
      if (text) return text;
    }
    return Object.values(value).map(sanitizeCreatorInputText).filter(Boolean).join(' ');
  }
  let text = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';

  text = text
    .replace(/\bis\s+a\s+pre-existing\s+[a-z\s-]+\s+subject\s+built\s+around\s+/i, 'centers on ')
    .replace(/\bis\s+a\s+pre-existing\s+[a-z\s-]+\s+subject\b/i, 'is an existing story subject')
    .replace(/\bThis article follows\b/i, 'The account follows')
    .replace(/\bthe article treats it as\b/i, 'the record treats it as')
    .replace(/\bso the article treats it as\b/i, 'so the record treats it as');

  for (const pattern of INTERNAL_TEMPLATE_PATTERNS) {
    text = text.replace(pattern, '').replace(/\s+/g, ' ').trim();
  }

  if (/^[a-z][a-z\s_-]{1,32}:?$/i.test(text) && /^(title|heading|section|paragraph|summary|detail|prompt|note|source|tag|category|content type|story brief)$/i.test(text.replace(/:$/, ''))) {
    return '';
  }

  return text;
}

function validateNormalizedCreatorInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Normalized Creator input must be an object.');
  }

  const missing = new Set(Array.isArray(input.missingRequiredFields) ? input.missingRequiredFields : []);
  const warnings = new Set(Array.isArray(input.warnings) ? input.warnings : []);

  for (const field of [
    'factRecords',
    'knownNames',
    'keyActors',
    'setting',
    'coreProblem',
    'eventSequence',
    'turningPoint',
    'outcome',
    'reportedVariants',
    'sourceContext',
    'meaningOptions',
    'visualVocabulary',
    'forbiddenInventions',
    'sourceEvidence'
  ]) {
    if (!Array.isArray(input[field])) {
      input[field] = [];
      warnings.add(`${field} was normalized to an empty array.`);
    }
  }

  for (const field of ['slug', 'topic', 'categorySlug', 'categoryName', 'contentType']) {
    if (typeof input[field] !== 'string') {
      input[field] = sanitizeCreatorInputText(input[field]);
      warnings.add(`${field} was normalized to a string.`);
    }
  }

  if (!input.slug) missing.add('slug');
  if (!input.topic) missing.add('topic');
  if (!input.categorySlug) missing.add('categorySlug');
  if (!input.contentType || !SUPPORTED_CONTENT_TYPES.has(input.contentType)) {
    missing.add('contentType');
    warnings.add('Unable to classify content type from explicit structured data.');
  }
  if (!input.knownNames.length && !input.topic) missing.add('knownNames');
  if (!input.eventSequence.length) {
    missing.add('eventSequence');
    warnings.add('Event sequence is not detailed enough for scene planning.');
  }
  if (!input.outcome.length) missing.add('outcome');
  if (!input.sourceContext.length) missing.add('sourceContext');
  if (!input.visualVocabulary.length) missing.add('visualVocabulary');

  const factValidation = validateCreatorFactRecords(input.factRecords, input.contentType);
  if (!factValidation.valid) {
    missing.add('factRecords');
    factValidation.errors.slice(0, 10).forEach((error) => warnings.add(`Fact validation: ${error}`));
  }

  const derived = deriveCompatibilityFields(input.factRecords);
  for (const field of ['coreProblem', 'eventSequence', 'turningPoint', 'outcome', 'reportedVariants', 'sourceContext', 'meaningOptions', 'visualVocabulary']) {
    if (JSON.stringify(input[field]) !== JSON.stringify(derived[field])) {
      warnings.add(`${field} was re-derived from factRecords.`);
      input[field] = derived[field];
    }
  }

  const typeRequired = typeSpecificRequiredFields(input.contentType);
  for (const field of typeRequired) {
    if (Array.isArray(input[field]) && input[field].length) continue;
    if (typeof input[field] === 'string' && input[field]) continue;
    missing.add(field);
  }

  input.missingRequiredFields = Array.from(missing);
  input.warnings = Array.from(warnings);
  input.sourceFieldMap = input.sourceFieldMap && typeof input.sourceFieldMap === 'object' ? input.sourceFieldMap : {};
  return input;
}

function typeSpecificRequiredFields(contentType) {
  if (contentType === 'myth-narrative') {
    return ['coreProblem', 'eventSequence', 'turningPoint', 'outcome', 'sourceContext'];
  }
  if (contentType === 'internet-folklore') {
    return ['eventSequence', 'coreProblem', 'sourceContext', 'outcome'];
  }
  if (contentType === 'place-event-mystery') {
    return ['setting', 'eventSequence', 'sourceContext', 'coreProblem', 'outcome'];
  }
  return ['eventSequence', 'sourceContext', 'visualVocabulary'];
}

function compatibilitySourceTypes() {
  return {
    coreProblem: ['problem'],
    eventSequence: ['event'],
    turningPoint: ['turning-point'],
    outcome: ['outcome'],
    reportedVariants: ['variant'],
    sourceContext: ['source-context'],
    meaningOptions: ['meaning'],
    visualVocabulary: ['subject', 'relationship', 'setting', 'problem', 'event', 'turning-point', 'outcome', 'visual']
  };
}

function collectEventSequence(story, brief, articlePlan, sourceFieldMap, warnings) {
  const sections = Array.isArray(articlePlan.sections)
    ? articlePlan.sections.map((section) => section.heading || section.title || section.summary || section.body)
    : [];
  return collectArray([
    sourceValue(brief.eventSequence, 'storyBrief.eventSequence', sourceFieldMap, 'eventSequence'),
    sourceValue(brief.coreStoryElements, 'storyBrief.coreStoryElements', sourceFieldMap, 'eventSequence'),
    sourceValue(articlePlan.eventSequence, 'publicArticlePlan.eventSequence', sourceFieldMap, 'eventSequence'),
    sourceValue(sections, 'publicArticlePlan.sections', sourceFieldMap, 'eventSequence'),
    sourceValue(story.summaryAnswer, 'story.summaryAnswer', sourceFieldMap, 'eventSequence'),
    sourceValue(story.detail, 'story.detail', sourceFieldMap, 'eventSequence')
  ], warnings);
}

function collectVariants(brief, sourceFieldMap, warnings) {
  const variants = Array.isArray(brief.reportedVariants)
    ? brief.reportedVariants.map((variant) => [variant.claim, variant.scope].filter(Boolean).join(' '))
    : brief.reportedVariants;
  return collectArray([
    sourceValue(variants, 'storyBrief.reportedVariants', sourceFieldMap, 'reportedVariants')
  ], warnings);
}

function collectSourceEvidence(story, brief, sourceFieldMap, warnings) {
  const evidence = Array.isArray(brief.existenceEvidence)
    ? brief.existenceEvidence.map((item) => [item.title, item.sourceType, item.note].filter(Boolean).join(' '))
    : brief.existenceEvidence;
  const research = Array.isArray(story.researchSources)
    ? story.researchSources.map((item) => [item.title, item.url, item.note].filter(Boolean).join(' '))
    : story.researchSources;
  return collectArray([
    sourceValue(evidence, 'storyBrief.existenceEvidence', sourceFieldMap, 'sourceEvidence'),
    sourceValue(research, 'story.researchSources', sourceFieldMap, 'sourceEvidence'),
    sourceValue(story.evidence, 'story.evidence', sourceFieldMap, 'sourceEvidence')
  ], warnings);
}

function buildArchiveNarrativeSource(story = {}) {
  const brief = objectValue(story.storyBrief);
  const article = objectValue(story.longformArticle);
  const searchSummary = objectValue(story.searchSummary);
  const contentDNA = objectValue(story.contentDNA);
  const references = Array.isArray(story.references) ? story.references : Array.isArray(article.references) ? article.references : [];
  const opening = Array.isArray(article.opening) ? article.opening.map(sanitizeCreatorInputText).filter(Boolean) : [];
  const storyBody = Array.isArray(article.storyBody) ? article.storyBody : [];
  const bodySections = storyBody.map((section) => ({
    id: sanitizeCreatorInputText(section.id || section.heading || ''),
    heading: sanitizeCreatorInputText(section.heading || ''),
    paragraphs: Array.isArray(section.paragraphs)
      ? section.paragraphs.map(sanitizeCreatorInputText).filter(Boolean)
      : []
  })).filter((section) => section.heading || section.paragraphs.length);
  const coreStoryElements = Array.isArray(brief.coreStoryElements) ? brief.coreStoryElements.map(sanitizeCreatorInputText).filter(Boolean) : [];
  const variants = Array.isArray(brief.reportedVariants) ? brief.reportedVariants.map(sanitizeCreatorInputText).filter(Boolean) : [];
  const uncertainty = Array.isArray(brief.uncertainDetails) ? brief.uncertainDetails.map(sanitizeCreatorInputText).filter(Boolean) : [];
  const evidence = Array.isArray(brief.existenceEvidence) ? brief.existenceEvidence.map(sanitizeCreatorInputText).filter(Boolean) : [];
  const interpretation = Array.isArray(brief.editorialInterpretationOptions) ? brief.editorialInterpretationOptions.map(sanitizeCreatorInputText).filter(Boolean) : [];
  const names = Array.isArray(brief.knownNames) ? brief.knownNames.map(sanitizeCreatorInputText).filter(Boolean) : [];
  const keywords = [
    ...(Array.isArray(story.relatedKeywords) ? story.relatedKeywords : []),
    ...(Array.isArray(article.relatedKeywords) ? article.relatedKeywords : []),
    ...(Array.isArray(contentDNA.subjectSpecificVocabulary) ? contentDNA.subjectSpecificVocabulary : [])
  ].map(sanitizeCreatorInputText).filter(Boolean);
  const visualAnchor = sanitizeCreatorInputText(contentDNA.sceneAnchor || coreStoryElements.find((item) => /yellow|room|fluorescent|image|place|object|road|forest|sea|temple/i.test(item)) || story.excerpt || story.title);
  return {
    sourceKind: 'archive-story',
    sourceRefs: [
      'story.storyBrief',
      'story.searchSummary',
      'story.longformArticle',
      references.length ? 'story.references' : ''
    ].filter(Boolean),
    title: sanitizeCreatorInputText(story.title || story.h1 || brief.topic || ''),
    topic: sanitizeCreatorInputText(brief.topic || story.title || ''),
    category: sanitizeCreatorInputText(story.category || brief.category || ''),
    sourceStatus: sanitizeCreatorInputText(story.sourceStatus || brief.existenceStatus || ''),
    visualAnchor,
    deck: sanitizeCreatorInputText(article.deck || story.introSummary || story.excerpt || ''),
    excerpt: sanitizeCreatorInputText(story.excerpt || ''),
    summaryAnswer: sanitizeCreatorInputText(story.summaryAnswer || ''),
    whatItIs: sanitizeCreatorInputText(searchSummary.whatItIs || ''),
    whereItAppears: sanitizeCreatorInputText(searchSummary.whereItAppears || ''),
    whyItMatters: sanitizeCreatorInputText(searchSummary.whyItMatters || ''),
    opening,
    bodySections,
    coreStoryElements,
    variants,
    uncertainty,
    evidence,
    interpretation,
    names,
    keywords: uniqueText(keywords).slice(0, 12),
    references: references.map((item) => ({
      title: sanitizeCreatorInputText(item.title || ''),
      url: sanitizeCreatorInputText(item.url || '')
    })).filter((item) => item.title || item.url)
  };
}

function collectArray(values, warnings) {
  const output = [];
  for (const item of values) {
    const rawValues = Array.isArray(item.value) ? item.value : [item.value];
    for (const raw of rawValues) {
      const before = String(raw ?? '').trim();
      const text = sanitizeCreatorInputText(raw);
      if (!text) continue;
      if (before && before !== text) warnings.add
        ? warnings.add(`Removed internal template instruction from ${item.source}.`)
        : warnings.push(`Removed internal template instruction from ${item.source}.`);
      if (!output.some((existing) => normalizeComparable(existing) === normalizeComparable(text))) {
        output.push(text);
      }
    }
  }
  return output;
}

function firstString(values, warnings) {
  for (const item of values) {
    const text = sanitizeCreatorInputText(item.value);
    if (!text) continue;
    if (String(item.value ?? '').trim() !== text) {
      warnings.push(`Removed internal template instruction from ${item.source}.`);
    }
    return text;
  }
  return '';
}

function sourceValue(value, source, sourceFieldMap, field) {
  if (hasSourceValue(value)) markSource(sourceFieldMap, field, source);
  return { value, source };
}

function hasSourceValue(value) {
  if (Array.isArray(value)) return value.some(hasSourceValue);
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return sanitizeCreatorInputText(value) !== '';
}

function markSource(sourceFieldMap, field, source) {
  if (!source) return;
  if (!sourceFieldMap[field]) sourceFieldMap[field] = [];
  if (!sourceFieldMap[field].includes(source)) sourceFieldMap[field].push(source);
}

function normalizeContentType(value) {
  const key = sanitizeCreatorInputText(value).toLowerCase();
  if (!key) return '';
  if (SUPPORTED_CONTENT_TYPES.has(key)) return key;
  return CONTENT_TYPE_ALIASES[key] || CATEGORY_CONTENT_TYPE_MAP[key] || '';
}

function classificationSource(story, category, contentType) {
  if (!contentType) return 'unclassified';
  const brief = objectValue(story.storyBrief);
  const dna = objectValue(story.contentDNA);
  if (normalizeContentType(brief.contentType) === contentType) return 'storyBrief.contentType';
  if (normalizeContentType(brief.creatorContentType) === contentType) return 'storyBrief.creatorContentType';
  if (normalizeContentType(brief.archiveContentType) === contentType) return 'storyBrief.archiveContentType';
  if (normalizeContentType(dna.contentType) === contentType) return 'contentDNA.contentType';
  if (normalizeContentType(story.creatorContentType) === contentType) return 'story.creatorContentType';
  if (normalizeContentType(story.archiveContentType) === contentType) return 'story.archiveContentType';
  if (normalizeContentType(story.categorySlug) === contentType) return 'story.categorySlug';
  if (normalizeContentType(category.slug) === contentType) return 'category.slug';
  return 'unclassified';
}

function objectValue(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeComparable(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function uniqueText(values) {
  const seen = new Set();
  const output = [];
  for (const value of values || []) {
    const text = sanitizeCreatorInputText(value);
    const key = normalizeComparable(text);
    if (!text || seen.has(key)) continue;
    seen.add(key);
    output.push(text);
  }
  return output;
}

module.exports = {
  normalizeCreatorStoryInput,
  classifyCreatorContentType,
  sanitizeCreatorInputText,
  validateNormalizedCreatorInput
};
