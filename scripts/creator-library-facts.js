const ALLOWED_FACT_TYPES = new Set([
  'subject',
  'relationship',
  'setting',
  'problem',
  'event',
  'turning-point',
  'outcome',
  'variant',
  'source-context',
  'meaning',
  'visual'
]);

const INTERNAL_INSTRUCTION_PATTERNS = [
  /\bpre-existing\s+(?:myths?|legend origins?|[a-z\s-]+)\s+subject\b/i,
  /\bthis article follows\b/i,
  /\bthe article should\b/i,
  /\bthe heading keeps the focus\b/i,
  /\bsource-aware kyunolab record\b/i,
  /\bsource-aware retellings?\b/i,
  /\bsource-aware\b/i,
  /\bthe focus stays on\b/i,
  /\bestablish the point\b/i,
  /\bdevelop the point\b/i,
  /\bclose the point\b/i,
  /\bdefining event\b/i,
  /\bcore sequence\b/i,
  /\bturning point and consequence\b/i,
  /\bvariants and source context\b/i,
  /\boutcome and meaning\b/i,
  /\bscene plan\b/i,
  /\bpart purpose\b/i,
  /\bsource facts\b/i,
  /\brequired events\b/i,
  /\bconfirmed story material\b/i,
  /\bkeep the visual work centered\b/i,
  /\bneeds this part to preserve\b/i,
  /\bviewer should\b/i,
  /\bhold that image\b/i,
  /\bpublic article generation instructions?\b/i,
  /\bcreator library generation instructions?\b/i,
  /\barchive writing instructions?\b/i
];

const INCOMPLETE_PATTERNS = [
  /^\s*(?:works because|begins with works because|centered on works because)\b/i,
  /^\s*(?:connected to its strongest image|focusing on|emphasizing|based on|because)\b/i,
  /^\s*(?:and|or|of|to|with|because)\b[,\s.]*$/i,
  /\b(?:and|or|of|to|with|because)\s*$/i,
  /\ba ancient\b/i,
  /\bbecomes of\b/i,
  /,,|\.\.|and and|of of|the the/i,
  /^[a-z\s-]{1,30}:?$/i
];

const EVENT_VERBS = /\b(is|are|was|were|has|have|had|becomes?|became|begins?|centers?|follows?|moves?|appears?|spread|spreads|differs?|changes?|keeps?|shows?|connects?|explains?|represents?|preserves?|records?|mentions?|prints?|refers?|points?|marks?|adds?|remains?|returns?|searches?|restrains?|slows?|steals?|hides?|speaks?|opens?|closes?|vanishes?|arrives?|leaves?|turns?|reveals?|discovers?|travels?|carries?|creates?|gives?|takes?|waits?|prepares?|confronts?)\b/i;

const TYPE_PRIORITY = {
  subject: 10,
  relationship: 9,
  setting: 8,
  problem: 7,
  event: 6,
  'turning-point': 5,
  outcome: 4,
  variant: 3,
  'source-context': 2,
  meaning: 1,
  visual: 0
};

function buildCreatorFactRecords(story = {}, category = {}, sourceContext = {}) {
  const context = {
    story,
    category,
    contentType: sourceContext.contentType || classifyContentType(story, category),
    topic: cleanText(story.storyBrief?.topic || story.title || ''),
    knownNames: normalizeList([
      ...(story.storyBrief?.knownNames || []),
      ...(story.storyBrief?.keyActors || []),
      ...(story.contentDNA?.keyActors || [])
    ]),
    stats: sourceContext.stats || null
  };

  const candidates = [];
  collectCandidates(candidates, story, category, context);

  const records = [];
  for (const candidate of candidates) {
    const normalized = normalizeCreatorFact(candidate.rawValue, {
      ...context,
      sourceRef: candidate.sourceRef,
      preferredType: candidate.preferredType
    });
    if (!normalized.factText) {
      countStat(context, normalized.removedReason || 'removedFragment');
      continue;
    }
    if (normalized.warnings.some((warning) => /internal instruction/i.test(warning))) countStat(context, 'removedInternalInstruction');
    const factType = classifyCreatorFactType(normalized.factText, candidate.sourceRef, {
      ...context,
      preferredType: candidate.preferredType
    });
    const record = createFactRecord({
      factType,
      factText: normalized.factText,
      rawText: normalized.rawText,
      sourceRef: candidate.sourceRef,
      sourcePriority: candidate.sourcePriority,
      sequenceIndex: candidate.sequenceIndex,
      context
    });
    const validation = validateCreatorFactRecord(record);
    if (!validation.valid) {
      countStat(context, validation.errors.some((error) => /internal/i.test(error)) ? 'removedInternalInstruction' : 'removedFragment');
      continue;
    }
    records.push(record);
  }

  const deduped = deduplicateFactRecords(records, context);
  const ordered = orderEventFacts(deduped);
  return ordered.map((record, index) => ({
    ...record,
    id: `fact-${String(index + 1).padStart(3, '0')}`
  }));
}

function normalizeCreatorFact(rawValue, options = {}) {
  const rawText = flattenRawValue(rawValue);
  let text = cleanText(rawText);
  const warnings = [];
  if (!text) return { factText: '', rawText, warnings, removedReason: 'removedFragment' };

  const beforeInstruction = text;
  text = stripInternalInstructionParts(text, options);
  if (beforeInstruction !== text) warnings.push('Removed internal instruction language.');
  if (!text) return { factText: '', rawText, warnings, removedReason: 'removedInternalInstruction' };

  text = text
    .replace(/\bIn brief,\s*/i, '')
    .replace(/\bThe main movement is clear:\s*/i, '')
    .replace(/\bMost retellings preserve\s+/i, 'Retellings preserve ')
    .replace(/\bIts strongest image is specific enough to follow across retellings while still leaving room for careful interpretation\.?/i, '')
    .replace(/\bThe strongest version works when the concrete image stays visible and later explanation does not flatten the uncertainty\.?/i, '')
    .replace(/\bThat reading keeps the article focused on meaning and source limits instead of adding unsupported events\.?/i, '')
    .replace(/\bThe article keeps the source limits visible while explaining why the image keeps returning\.?/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (/^built around\b/i.test(text) && options.topic) text = `${options.topic} is ${text}`;
  if (/^(the\s+)?(?:polynesian|egyptian|greek|legend|urban|internet|folklore|myth)/i.test(text) && !EVENT_VERBS.test(text) && options.topic) {
    text = `${options.topic} centers on ${lowercaseStart(text)}`;
  }
  if (!/[.!?]$/.test(text)) text += '.';
  text = capitalize(text.replace(/\s+([,.!?])/g, '$1').replace(/\s+/g, ' ').trim());

  if (isInternalInstruction(text)) return { factText: '', rawText, warnings, removedReason: 'removedInternalInstruction' };
  if (isIncompleteFactFragment(text)) return { factText: '', rawText, warnings, removedReason: 'removedFragment' };
  if (!isUsableFactClause(text)) return { factText: '', rawText, warnings, removedReason: 'removedFragment' };
  return { factText: text, rawText, warnings };
}

function classifyCreatorFactType(rawValue, sourceRef = '', context = {}) {
  const text = cleanText(rawValue).toLowerCase();
  const source = String(sourceRef || '').toLowerCase();
  if (/knownnames|topic|title/.test(source)) return 'subject';
  if (context.preferredType && ALLOWED_FACT_TYPES.has(context.preferredType)) return context.preferredType;
  if (/\b(references?|summaries|public cultural records|retellings|proven|verify|rumors?|signed puzzle trail|source limits|documented retelling|confirmed fact|evidence)\b/.test(text)) return 'source-context';
  if (/\b(mythic initiation|seeker|symbol|symbolic|meaning|represents|reflects|read as|cultural role|afterlife meaning)\b/.test(text)) return 'meaning';
  if (/setting|cultureorcontext|sceneanchor|culturalframe/.test(source)) return 'setting';
  if (/reportedvariants/.test(source) || /\bvariant|versions? differ|later summaries|regional|retelling\b/.test(text)) return 'variant';
  if (/existenceevidence|sourcecontext|sourceevidence|researchsources|publicsourcenote|publicsource/.test(source)) return 'source-context';
  if (/editorialinterpretation|meaning|interpretive|uniqueangle/.test(source) || /\bmeaning|symbol|represents|reflects|legacy|why\b/.test(text)) return 'meaning';
  if (/turningpoint/.test(source) || /\bturning point|decisive|reveals?|discovers?|changes the direction|changes power\b/.test(text)) return 'turning-point';
  if (/outcome/.test(source) || /\boutcome|result|ending|remains|remembered|legacy|afterward|finally|still\b/.test(text)) return 'outcome';
  if (/coreproblem|centralmotif|primarytag/.test(source) || /\bproblem|conflict|crisis|lack|fear|impossible|uncertain|question\b/.test(text)) return 'problem';
  if (/subjectspecificvocabulary|requiredspecificdetails|visualvocabulary/.test(source)) {
    return EVENT_VERBS.test(text) ? 'event' : 'visual';
  }
  if (/corestoryelements|eventsequence|summaryanswer|detail|excerpt|quickanswer|sections|requiredspecificdetails/.test(source)) return 'event';
  return EVENT_VERBS.test(text) ? 'event' : 'visual';
}

function validateCreatorFactRecord(record) {
  const errors = [];
  if (!record || typeof record !== 'object') return { valid: false, errors: ['Fact record must be an object.'] };
  for (const field of ['id', 'factType', 'factText', 'rawText', 'variantGroup', 'uncertainty', 'confidence']) {
    if (typeof record[field] !== 'string') errors.push(`${field} must be a string.`);
  }
  for (const field of ['entities', 'settingTerms', 'visualTerms', 'sourceRefs', 'warnings']) {
    if (!Array.isArray(record[field])) errors.push(`${field} must be an array.`);
  }
  if (!ALLOWED_FACT_TYPES.has(record.factType)) errors.push(`Unsupported factType: ${record.factType}`);
  if (!record.factText) errors.push('factText is required.');
  if (isInternalInstruction(record.factText)) errors.push('factText contains internal instruction.');
  if (isIncompleteFactFragment(record.factText)) errors.push('factText is an incomplete fragment.');
  if (!isUsableFactClause(record.factText)) errors.push('factText is not a usable fact clause.');
  if (!record.sourceRefs.length) errors.push('sourceRefs is required.');
  if (record.sequenceIndex !== null && !Number.isFinite(record.sequenceIndex)) errors.push('sequenceIndex must be null or a number.');
  if (typeof record.sourcePriority !== 'number') errors.push('sourcePriority must be a number.');
  return { valid: errors.length === 0, errors };
}

function validateCreatorFactRecords(records, contentType = '') {
  const errors = [];
  if (!Array.isArray(records)) return { valid: false, errors: ['factRecords must be an array.'] };
  const ids = new Set();
  const comparable = new Set();
  records.forEach((record, index) => {
    const validation = validateCreatorFactRecord(record);
    validation.errors.forEach((error) => errors.push(`Fact ${record?.id || index + 1}: ${error}`));
    if (ids.has(record.id)) errors.push(`Duplicate fact id: ${record.id}`);
    ids.add(record.id);
    const key = comparableFactKey(record);
    if (comparable.has(key)) errors.push(`Duplicate fact text: ${record.factText}`);
    comparable.add(key);
    if (record.factType === 'event' && /source-context/i.test(record.factText)) {
      errors.push(`Event fact appears to contain non-event label: ${record.id}`);
    }
  });

  const types = countByType(records);
  for (const type of requiredFactTypesForContentType(contentType)) {
    if (!types[type]) errors.push(`Missing required factType: ${type}`);
  }
  return { valid: errors.length === 0, errors };
}

function isInternalInstruction(value) {
  return INTERNAL_INSTRUCTION_PATTERNS.some((pattern) => pattern.test(String(value || '')));
}

function isIncompleteFactFragment(value) {
  const text = cleanText(value);
  if (!text) return true;
  const words = text.split(/\s+/).filter(Boolean);
  if (/\ba ancient\b|\bbecomes of\b|,,|\.\.|\band\s+and\b|\bof\s+of\b|\bthe\s+the\b/i.test(text)) return true;
  if (/^\s*(?:a|an|the)\s+.+\s+(?:is|are|was|were)\s+/i.test(text) && words.length >= 6) return false;
  const hasSimplePredicate = words.some((word) => /^(is|are|was|were|has|have|had|kept|follows|centers|shows|mentions|prints|refers|changes|remains|records|marks|points|adds)$/i.test(word.replace(/[^a-z]/gi, '')));
  if ((hasSimplePredicate || hasClearPredicate(text)) && words.length >= 6 && !/^\s*(?:works because|begins with works because|centered on works because|connected to its strongest image|focusing on|emphasizing|based on|because)\b/i.test(text)) {
    return false;
  }
  if (INCOMPLETE_PATTERNS.some((pattern) => pattern.test(text))) return true;
  if (words.length < 2) return true;
  if (words.length < 4 && !EVENT_VERBS.test(text) && !/[A-Z][a-z]+/.test(text)) return true;
  if (/^[^.!?]+:\s*$/i.test(text)) return true;
  return false;
}

function isUsableFactClause(value) {
  const text = cleanText(value);
  if (!text || text.length < 8) return false;
  if (isInternalInstruction(text) || isIncompleteFactFragment(text)) return false;
  return hasClearPredicate(text) || text.split(/\s+/).length >= 4;
}

function hasClearPredicate(value) {
  const text = String(value || '');
  const lower = ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, ' ')} `;
  if (/(?:\sis\s|\sare\s|\swas\s|\swere\s|\shas\s|\shave\s|\shad\s)/.test(lower)) return true;
  return /\b(?:becomes?|became|begins?|centers?|follows?|moves?|appears?|spread|spreads|differs?|changes?|keeps?|shows?|connects?|explains?|represents?|preserves?|records?|mentions?|prints?|refers?|points?|marks?|adds?|remains?|returns?|searches?|restrains?|slows?|steals?|hides?|speaks?|opens?|closes?|vanishes?|arrives?|leaves?|turns?|reveals?|discovers?|travels?|carries?|creates?|gives?|takes?|waits?|prepares?|confronts?)\b/i.test(text);
}

function extractFactEntities(value, knownNames = []) {
  const text = cleanText(value);
  const entities = [];
  for (const name of knownNames.map(cleanText).filter(Boolean)) {
    if (text.toLowerCase().includes(name.toLowerCase()) && !entities.includes(name)) entities.push(name);
  }
  const proper = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\b/g) || [];
  for (const item of proper) {
    if (!/^(The|This|That|In|Later|Most|Versions|Retellings|A|An)$/i.test(item) && !entities.includes(item)) entities.push(item);
  }
  return entities.slice(0, 8);
}

function deduplicateFactRecords(records, context = {}) {
  const sorted = [...records].sort((a, b) => b.sourcePriority - a.sourcePriority || TYPE_PRIORITY[b.factType] - TYPE_PRIORITY[a.factType]);
  const output = [];
  const seen = new Map();
  for (const record of sorted) {
    const key = comparableFactKey(record);
    if (seen.has(key)) {
      const existing = seen.get(key);
      existing.sourceRefs = unique([...existing.sourceRefs, ...record.sourceRefs]);
      existing.warnings = unique([...existing.warnings, 'Merged duplicate fact candidate.']);
      countStat(context, 'removedDuplicate');
      continue;
    }
    seen.set(key, record);
    output.push(record);
  }
  return output.sort((a, b) => a.sourcePriority - b.sourcePriority || (a.sequenceIndex ?? 999) - (b.sequenceIndex ?? 999));
}

function orderEventFacts(records) {
  let eventIndex = 1;
  return records.map((record) => {
    if (['event', 'turning-point', 'outcome'].includes(record.factType) && record.sequenceIndex === null) {
      return { ...record, sequenceIndex: eventIndex++ };
    }
    return record;
  });
}

function deriveCompatibilityFields(records) {
  const byType = (type) => records.filter((record) => record.factType === type).map((record) => record.factText);
  const visualTerms = unique(records.flatMap((record) => [
    ...record.visualTerms,
    ...(record.usableForVisual ? [record.factText] : [])
  ]).map(cleanText).filter(Boolean));
  return {
    coreProblem: byType('problem'),
    eventSequence: records.filter((record) => record.factType === 'event').sort(bySequence).map((record) => record.factText),
    turningPoint: byType('turning-point'),
    outcome: byType('outcome'),
    reportedVariants: byType('variant'),
    sourceContext: byType('source-context'),
    meaningOptions: byType('meaning'),
    visualVocabulary: visualTerms
  };
}

function collectCandidates(candidates, story, category, context) {
  const brief = objectValue(story.storyBrief);
  const dna = objectValue(story.contentDNA);
  const articlePlan = objectValue(story.publicArticlePlan);
  let order = 0;
  const add = (value, sourceRef, preferredType, priority) => {
    const values = explodeValue(value, sourceRef);
    values.forEach((rawValue, index) => {
      candidates.push({ rawValue, sourceRef, preferredType, sourcePriority: priority, sequenceIndex: order + index });
    });
    order += values.length;
  };

  add(brief.topic, 'storyBrief.topic', 'subject', 1);
  add(story.title, 'story.title', 'subject', 1);
  add(brief.knownNames, 'storyBrief.knownNames', 'subject', 1);
  add(brief.keyActors, 'storyBrief.keyActors', 'relationship', 1);
  add(brief.setting, 'storyBrief.setting', 'setting', 1);
  add(brief.cultureOrContext, 'storyBrief.cultureOrContext', 'source-context', 1);
  add(brief.coreProblem, 'storyBrief.coreProblem', 'problem', 1);
  add(brief.coreStoryElements, 'storyBrief.coreStoryElements', '', 1);
  add(brief.eventSequence, 'storyBrief.eventSequence', 'event', 1);
  add(brief.turningPoint, 'storyBrief.turningPoint', 'turning-point', 1);
  add(brief.outcome, 'storyBrief.outcome', 'outcome', 1);
  add(variantStrings(brief.reportedVariants), 'storyBrief.reportedVariants', 'variant', 1);
  add(evidenceStrings(brief.existenceEvidence), 'storyBrief.existenceEvidence', 'source-context', 1);
  add(brief.sourceContext, 'storyBrief.sourceContext', 'source-context', 1);
  add(brief.editorialInterpretationOptions, 'storyBrief.editorialInterpretationOptions', 'meaning', 1);

  add(dna.centralMotif, 'contentDNA.centralMotif', 'problem', 2);
  add(dna.uniqueAngle, 'contentDNA.uniqueAngle', '', 2);
  add(dna.sceneAnchor, 'contentDNA.sceneAnchor', 'event', 2);
  add(dna.requiredSpecificDetails, 'contentDNA.requiredSpecificDetails', '', 2);
  add(dna.subjectSpecificVocabulary, 'contentDNA.subjectSpecificVocabulary', 'visual', 2);
  add(dna.keyActors, 'contentDNA.keyActors', 'relationship', 2);
  add(dna.turningPoint, 'contentDNA.turningPoint', 'turning-point', 2);
  add(dna.outcome, 'contentDNA.outcome', 'outcome', 2);
  add(dna.interpretiveAngles, 'contentDNA.interpretiveAngles', 'meaning', 2);
  add(dna.culturalFrame, 'contentDNA.culturalFrame', 'setting', 2);

  add(articlePlan.eventSequence, 'publicArticlePlan.eventSequence', 'event', 3);
  add(articleFacts(articlePlan), 'publicArticlePlan', '', 3);
  add(articlePlan.publicSourceNote, 'publicArticlePlan.publicSourceNote', 'source-context', 3);

  add(story.subjectSpecificVocabulary, 'story.subjectSpecificVocabulary', 'visual', 4);
  add(story.summaryAnswer, 'story.summaryAnswer', '', 5);
  add(story.excerpt, 'story.excerpt', '', 6);
  add(story.detail, 'story.detail', 'event', 7);
  add(story.sceneAnchor, 'story.sceneAnchor', 'event', 8);
  add(story.publicSourceBasis, 'story.publicSourceBasis', 'source-context', 8);
  add(story.publicSourceNoteSeed, 'story.publicSourceNoteSeed', 'source-context', 8);
  add(story.evidence, 'story.evidence', 'source-context', 8);
  add(evidenceStrings(story.researchSources), 'story.researchSources', 'source-context', 8);
  add(category.title || category.name, 'category.title', 'setting', 9);

  ensureMinimumTypedCandidates(candidates, story, context, add);
}

function ensureMinimumTypedCandidates(candidates, story, context, add) {
  const usableText = cleanText(story.detail || story.sceneAnchor || story.summaryAnswer || story.excerpt || context.topic);
  if (!usableText) return;
  const hasType = (type) => candidates.some((candidate) => candidate.preferredType === type);
  if (!hasType('problem')) add(usableText, 'derived.problemFromDetail', 'problem', 9);
  if (!hasType('turning-point')) add(usableText, 'derived.turningPointFromDetail', 'turning-point', 9);
  if (!hasType('outcome')) add(usableText, 'derived.outcomeFromDetail', 'outcome', 9);
  if (!hasType('source-context')) add(context.category?.title || context.category?.name || story.categorySlug, 'derived.sourceContextFromCategory', 'source-context', 9);
}

function createFactRecord({ factType, factText, rawText, sourceRef, sourcePriority, sequenceIndex, context }) {
  const entities = extractFactEntities(factText, context.knownNames);
  const visualTerms = extractVisualTerms(factText, context.knownNames);
  const settingTerms = extractSettingTerms(factText);
  return {
    id: '',
    factType,
    factText,
    rawText,
    entities,
    settingTerms,
    visualTerms,
    sequenceIndex: ['event', 'turning-point', 'outcome'].includes(factType) ? Number(sequenceIndex || 0) + 1 : null,
    variantGroup: factType === 'variant' ? sourceRef : '',
    uncertainty: /uncertain|disputed|may|might|reported|variant|version/i.test(factText) ? 'source-limited' : '',
    sourceRefs: [sourceRef].filter(Boolean),
    sourcePriority,
    usableForNarration: ['problem', 'event', 'turning-point', 'outcome', 'variant', 'source-context', 'meaning'].includes(factType),
    usableForVisual: ['subject', 'relationship', 'setting', 'problem', 'event', 'turning-point', 'outcome', 'visual'].includes(factType),
    confidence: /may|might|reported|variant|version|uncertain|disputed/i.test(factText) ? 'source-limited' : 'explicit',
    warnings: []
  };
}

function stripInternalInstructionParts(value, options = {}) {
  let text = cleanText(value);
  const topicPattern = options.topic ? escapeRegExp(options.topic) : '[A-Z][A-Za-z0-9\\s-]{2,80}';
  text = text.replace(new RegExp(`^(${topicPattern})\\s+is\\s+a\\s+pre-existing\\s+[a-z\\s-]+\\s+subject\\s+built\\s+around\\s+`, 'i'), `${options.topic || '$1'} centers on `);
  text = text.replace(/\bis a pre-existing\s+[a-z\s-]+\s+subject\s+built\s+around\b/i, 'centers on');
  text = text.replace(/\bA source-aware Kyunolab record tracing\s+/i, '');
  text = text.replace(/\bsource-aware\s+/gi, '');
  for (const pattern of INTERNAL_INSTRUCTION_PATTERNS) {
    text = text.replace(pattern, '');
  }
  return cleanText(text);
}

function explodeValue(value, sourceRef = '') {
  if (Array.isArray(value)) return value.flatMap((item, index) => explodeValue(item, `${sourceRef}[${index}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => explodeValue(child, `${sourceRef}.${key}`));
  }
  const text = cleanText(value);
  if (!text) return [];
  if (/subjectSpecificVocabulary|knownNames|keyActors|requiredSpecificDetails/.test(sourceRef)) return [text];
  return splitSentences(text);
}

function splitSentences(value) {
  const text = cleanText(value);
  if (!text) return [];
  const parts = text.match(/[^.!?]+[.!?]?/g) || [text];
  return parts.map(cleanText).filter(Boolean);
}

function articleFacts(articlePlan) {
  const output = [];
  if (articlePlan.quickAnswer?.paragraphs) output.push(...articlePlan.quickAnswer.paragraphs);
  if (Array.isArray(articlePlan.sections)) {
    for (const section of articlePlan.sections) {
      output.push(section.summary, section.body, ...(section.paragraphs || []));
    }
  }
  return output.filter(Boolean);
}

function variantStrings(variants) {
  if (!Array.isArray(variants)) return variants || [];
  return variants.map((variant) => [variant.claim, variant.scope].filter(Boolean).join(' '));
}

function evidenceStrings(evidence) {
  if (!Array.isArray(evidence)) return evidence || [];
  return evidence.map((item) => [item.title, item.sourceType, item.supports, item.note, item.url].filter(Boolean).join(' '));
}

function extractVisualTerms(value, knownNames = []) {
  const text = cleanText(value);
  const terms = [
    ...knownNames.filter((name) => text.toLowerCase().includes(String(name).toLowerCase())),
    ...(text.match(/\b(?:record|minutes|ticket|ledger|register|stamp|door|road|sun|rope|name|book|image|photo|room|temple|river|sea|island|forest|house|apartment|screen|code|cipher|map|letter|stone|fire|sky|field|train|hotel|cemetery|library|camera|archive|file|log|history|staircase|crate|weight|goat|spool|signature|wiki|weather|subscription|service|user|database|calendar|clock|receipt|inventory|notebook|folder|panel|dashboard|playlist|album|browser)\b/gi) || []),
    ...text.split(/\s+/).filter((word) => word.length > 4 && !/^(origin|meaning|legend|story|record|article|source|subject|entry|built|around|centers|public|urban|myths?)$/i.test(word)).slice(0, 4)
  ];
  return unique(terms.map(cleanText).filter(Boolean)).slice(0, 8);
}

function extractSettingTerms(value) {
  const text = cleanText(value);
  const terms = text.match(/\b(?:Polynesian|Egyptian|Greek|urban|internet|online|digital|town|meeting|temple|road|forest|sea|island|archive|library|hotel|cemetery|apartment|station|village|field|public|mythological|folklore|legend)\b/gi) || [];
  return unique(terms.map(cleanText)).slice(0, 6);
}

function requiredFactTypesForContentType(contentType) {
  if (contentType === 'myth-narrative') return ['subject', 'problem', 'event', 'turning-point', 'outcome', 'source-context', 'meaning'];
  if (contentType === 'internet-folklore') return ['subject', 'problem', 'event', 'source-context', 'outcome'];
  if (contentType === 'place-event-mystery') return ['subject', 'problem', 'event', 'source-context', 'outcome'];
  return ['subject', 'event', 'source-context', 'visual'];
}

function countByType(records) {
  return records.reduce((counts, record) => {
    counts[record.factType] = (counts[record.factType] || 0) + 1;
    return counts;
  }, {});
}

function bySequence(a, b) {
  return (a.sequenceIndex ?? 999) - (b.sequenceIndex ?? 999);
}

function comparableFactKey(record) {
  return `${record.factType}:${comparableText(record.factText)}`;
}

function comparableText(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !/^(the|and|that|this|with|from|into|story|legend|myth|record|article|source|version|subject|entry)$/.test(word))
    .slice(0, 16)
    .join(' ');
}

function classifyContentType(story = {}, category = {}) {
  const slug = story.storyBrief?.contentType || story.storyBrief?.creatorContentType || story.storyBrief?.archiveContentType || story.contentDNA?.contentType || story.categorySlug || category.slug || '';
  const key = cleanText(slug).toLowerCase();
  const map = {
    myth: 'myth-narrative',
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
  return map[key] || key;
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/([,.!?;:]){2,}/g, '$1')
    .trim();
}

function flattenRawValue(value) {
  if (Array.isArray(value)) return value.map(flattenRawValue).filter(Boolean).join(' ');
  if (value && typeof value === 'object') return Object.values(value).map(flattenRawValue).filter(Boolean).join(' ');
  return String(value ?? '');
}

function normalizeList(values) {
  return unique(values.flatMap((value) => explodeValue(value)).map(cleanText).filter(Boolean));
}

function objectValue(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function countStat(context, field) {
  if (!context?.stats) return;
  context.stats[field] = (context.stats[field] || 0) + 1;
}

function capitalize(value) {
  const text = cleanText(value);
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : '';
}

function lowercaseStart(value) {
  const text = cleanText(value);
  return text ? `${text.charAt(0).toLowerCase()}${text.slice(1)}` : '';
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function unique(values) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    const text = cleanText(value);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    output.push(text);
  }
  return output;
}

module.exports = {
  ALLOWED_FACT_TYPES,
  buildCreatorFactRecords,
  normalizeCreatorFact,
  classifyCreatorFactType,
  validateCreatorFactRecord,
  validateCreatorFactRecords,
  isInternalInstruction,
  isIncompleteFactFragment,
  isUsableFactClause,
  extractFactEntities,
  deduplicateFactRecords,
  orderEventFacts,
  deriveCompatibilityFields
};
