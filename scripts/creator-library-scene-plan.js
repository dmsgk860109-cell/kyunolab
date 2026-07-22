const {
  sanitizeCreatorInputText
} = require('./creator-library-input');

const SCENE_RULES = {
  'myth-narrative': [
    rule('Defining Event', 'Introduce the central figure and the first problem.', ['knownNames', 'keyActors', 'coreProblem', 'eventSequence']),
    rule('Core Sequence', 'Follow the main action and relationship between figures.', ['eventSequence', 'keyActors', 'coreProblem']),
    rule('Turning Point and Consequence', 'Show the decisive turn and its direct result.', ['turningPoint', 'eventSequence', 'outcome']),
    rule('Variants and Source Context', 'Separate variant details from source context.', ['reportedVariants', 'sourceContext', 'sourceEvidence']),
    rule('Outcome and Meaning', 'Close with the result and symbolic meaning.', ['outcome', 'meaningOptions', 'sourceContext'])
  ],
  'folklore-legend': [
    rule('Region and Core Claim', 'Establish the place, subject, and central claim.', ['setting', 'knownNames', 'coreProblem']),
    rule('Core Story', 'Present the main version of the legend.', ['eventSequence', 'keyActors', 'coreProblem']),
    rule('Circulating Variants', 'Show how the legend changes in circulation.', ['reportedVariants', 'eventSequence']),
    rule('Records and Social Context', 'Connect the legend to records or social setting.', ['sourceContext', 'sourceEvidence', 'setting']),
    rule('Meaning and Continued Role', 'Explain why the legend continues to matter.', ['outcome', 'meaningOptions', 'sourceContext'])
  ],
  'mythical-being-object': [
    rule('Identity and Defining Trait', 'Define the being or object through its core trait.', ['knownNames', 'visualVocabulary', 'coreProblem']),
    rule('Abilities, Function, or Appearance', 'Explain what the subject does or represents.', ['eventSequence', 'visualVocabulary', 'keyActors']),
    rule('Encounters and Variants', 'Place the subject inside encounters and variants.', ['reportedVariants', 'eventSequence']),
    rule('Sources and Later Changes', 'Separate source material from later changes.', ['sourceContext', 'sourceEvidence', 'reportedVariants']),
    rule('Meaning and Cultural Legacy', 'Close with meaning and lasting role.', ['outcome', 'meaningOptions', 'sourceContext'])
  ],
  'urban-modern-legend': [
    rule('Commonly Told Version', 'Open with the familiar version of the legend.', ['knownNames', 'coreProblem', 'eventSequence']),
    rule('Core Incident', 'Move through the central incident.', ['eventSequence', 'setting', 'keyActors']),
    rule('Spread and Regional Variants', 'Show circulation and variant details.', ['reportedVariants', 'sourceContext']),
    rule('Real-event Claims and Evidence', 'Separate claims from evidence.', ['sourceEvidence', 'sourceContext', 'reportedVariants']),
    rule('Why the Legend Persists', 'Close on the fear or question that remains.', ['outcome', 'meaningOptions', 'coreProblem'])
  ],
  'internet-folklore': [
    rule('Initial Appearance', 'Establish the first visible form online.', ['knownNames', 'eventSequence', 'coreProblem']),
    rule('Spread and Core Clues', 'Show how the story or puzzle spread.', ['eventSequence', 'visualVocabulary', 'sourceContext']),
    rule('Key Development or Later Additions', 'Separate developments from additions.', ['turningPoint', 'reportedVariants', 'eventSequence']),
    rule('Evidence, Attribution, and Uncertainty', 'Clarify evidence and uncertainty.', ['sourceEvidence', 'sourceContext', 'reportedVariants']),
    rule('Meaning and Digital Legacy', 'Close on the digital legacy or open question.', ['outcome', 'meaningOptions', 'sourceContext'])
  ],
  'place-event-mystery': [
    rule('What, When, and Where', 'Establish the event or place clearly.', ['setting', 'knownNames', 'eventSequence']),
    rule('Core Record or Event', 'Present the core record or event.', ['eventSequence', 'sourceEvidence', 'coreProblem']),
    rule('Evidence and Key Details', 'Focus on evidence and important details.', ['sourceEvidence', 'visualVocabulary', 'eventSequence']),
    rule('Major Explanations and Uncertainty', 'Separate explanations from uncertainty.', ['reportedVariants', 'sourceContext', 'meaningOptions']),
    rule('What Remains Unresolved', 'Close with the unresolved state.', ['outcome', 'meaningOptions', 'sourceContext'])
  ],
  'origin-comparison': [
    rule('The Familiar Claim', 'Open with the common claim.', ['knownNames', 'coreProblem', 'eventSequence']),
    rule('Earliest Traceable Form', 'Present the earliest traceable form.', ['sourceEvidence', 'sourceContext', 'eventSequence']),
    rule('Elements Added Later', 'Show later additions without merging them.', ['reportedVariants', 'eventSequence']),
    rule('Regional or Source Differences', 'Compare differences across sources.', ['reportedVariants', 'sourceContext', 'sourceEvidence']),
    rule('What the Comparison Shows', 'Close with what the comparison reveals.', ['outcome', 'meaningOptions', 'sourceContext'])
  ]
};

function buildCreatorScenePlan(normalizedInput, options = {}) {
  const rules = sceneRulesForContentType(normalizedInput.contentType);
  const warnings = [...(normalizedInput.warnings || [])];
  const missingRequiredFields = [...(normalizedInput.missingRequiredFields || [])];
  const targetNarrationSeconds = options.targetNarrationSeconds || 295;
  const targetFinalVideoSeconds = options.targetFinalVideoSeconds || 340;
  const scenes = rules.map((sceneRule, sceneIndex) => {
    const sourceFacts = selectSceneFacts(normalizedInput, sceneRule);
    const sourceFieldRefs = refsForFields(normalizedInput, sceneRule.fields);
    const partFacts = splitFactsForParts(sourceFacts, sceneRule);
    return {
      sceneIndex: sceneIndex + 1,
      role: sceneRule.role,
      purpose: sceneRule.purpose,
      sourceFacts,
      sourceFieldRefs,
      requiredEntities: selectRequiredEntities(normalizedInput, sceneRule),
      requiredEvents: sourceFacts.filter(isUsableEventFact).slice(0, 3),
      variantGuidance: sceneRule.fields.includes('reportedVariants') ? normalizedInput.reportedVariants.slice(0, 3) : [],
      sourceGuidance: sceneRule.fields.some((field) => field === 'sourceContext' || field === 'sourceEvidence')
        ? [...normalizedInput.sourceContext, ...normalizedInput.sourceEvidence].filter(Boolean).slice(0, 3)
        : [],
      meaningGuidance: sceneRule.fields.includes('meaningOptions') ? normalizedInput.meaningOptions.slice(0, 3) : [],
      narrationParts: [0, 1].map((offset) => ({
        partIndex: offset + 1,
        purpose: offset === 0 ? `${sceneRule.role}: establish the point` : `${sceneRule.role}: develop the point`,
        sourceFacts: partFacts[offset],
        sourceFieldRefs,
        targetWords: targetWordsForPart(sceneIndex, offset)
      }))
    };
  });

  const scenePlan = {
    schemaVersion: '1.0',
    inputSchemaVersion: normalizedInput.schemaVersion || '1.0',
    slug: normalizedInput.slug || '',
    topic: normalizedInput.topic || '',
    contentType: normalizedInput.contentType || '',
    runtimeTier: 'standard',
    targetNarrationSeconds,
    targetFinalVideoSeconds,
    scenes,
    missingRequiredFields,
    warnings
  };

  const validation = validateCreatorScenePlan(scenePlan);
  if (!validation.valid) {
    const error = new Error(`Creator Scene Plan invalid for ${scenePlan.slug}`);
    error.code = 'CREATOR_SCENE_PLAN_INVALID';
    error.slug = scenePlan.slug;
    error.errors = validation.errors;
    throw error;
  }

  return scenePlan;
}

function sceneRulesForContentType(contentType) {
  return SCENE_RULES[contentType] || [];
}

function validateCreatorScenePlan(scenePlan) {
  const errors = [];
  if (!scenePlan || typeof scenePlan !== 'object') errors.push('Scene Plan must be an object.');
  if (!scenePlan?.slug) errors.push('Scene Plan has no slug.');
  if (!scenePlan?.topic) errors.push('Scene Plan has no topic.');
  if (!sceneRulesForContentType(scenePlan?.contentType).length) errors.push(`Unsupported contentType: ${scenePlan?.contentType || ''}`);
  if (scenePlan?.runtimeTier !== 'standard') errors.push('runtimeTier must be standard.');
  if (!Array.isArray(scenePlan?.scenes) || scenePlan.scenes.length !== 5) errors.push('Scene Plan must contain exactly 5 scenes.');

  const rules = sceneRulesForContentType(scenePlan?.contentType);
  const allPartFacts = [];
  let totalTargetWords = 0;
  (scenePlan?.scenes || []).forEach((scene, sceneIndex) => {
    const expectedRole = rules[sceneIndex]?.role;
    if (scene.sceneIndex !== sceneIndex + 1) errors.push(`Scene ${sceneIndex + 1} has invalid sceneIndex.`);
    if (expectedRole && scene.role !== expectedRole) errors.push(`Scene ${sceneIndex + 1} role must be ${expectedRole}.`);
    if (!Array.isArray(scene.sourceFacts) || !scene.sourceFacts.some(isUsableSceneFact)) errors.push(`Scene ${sceneIndex + 1} has no usable source fact.`);
    if (!Array.isArray(scene.narrationParts) || scene.narrationParts.length !== 2) errors.push(`Scene ${sceneIndex + 1} must contain exactly 2 narration parts.`);
    (scene.narrationParts || []).forEach((part) => {
      if (!Array.isArray(part.sourceFacts) || !part.sourceFacts.some(isUsableSceneFact)) {
        errors.push(`Scene ${sceneIndex + 1} Part ${part.partIndex || '?'} has no source fact.`);
      }
      if (!Number.isFinite(part.targetWords) || part.targetWords < 55 || part.targetWords > 80) {
        errors.push(`Scene ${sceneIndex + 1} Part ${part.partIndex || '?'} targetWords is outside 55-80.`);
      }
      totalTargetWords += Number(part.targetWords || 0);
      allPartFacts.push(...(part.sourceFacts || []));
    });
  });

  if (totalTargetWords < 620 || totalTargetWords > 760) errors.push(`targetWords total is outside 620-760: ${totalTargetWords}`);
  if (containsMetaLanguage(JSON.stringify(scenePlan))) errors.push('Scene Plan contains internal template or meta language.');
  if (hasUnreasonableFactDuplication(allPartFacts)) errors.push('Scene Plan repeats the same source fact too often.');

  return { valid: errors.length === 0, errors };
}

function selectSceneFacts(normalizedInput, sceneRule) {
  const facts = sceneRule.fields.flatMap((field) => normalizedInput[field] || []);
  return deduplicateSceneFacts(facts)
    .filter((item) => isUsableEventFact(item) || isSourceContextFact(item) || isMeaningFact(item))
    .slice(0, 5);
}

function deduplicateSceneFacts(items) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const text = sanitizeCreatorInputText(item);
    const key = comparableFact(text);
    if (!text || seen.has(key)) continue;
    seen.add(key);
    output.push(text);
  }
  return output;
}

function isUsableEventFact(value) {
  const text = sanitizeCreatorInputText(value);
  return text.length >= 12 && !containsMetaLanguage(text);
}

function isSourceContextFact(value) {
  const text = sanitizeCreatorInputText(value).toLowerCase();
  return isUsableEventFact(value) && /source|variant|version|tradition|record|account|reported|evidence|text|oral|online|archive|uncertain/.test(text);
}

function isMeaningFact(value) {
  const text = sanitizeCreatorInputText(value).toLowerCase();
  return isUsableEventFact(value) && /meaning|symbol|represents|explains|shows|reflects|legacy|important|persists|remembered|uncertain|question/.test(text);
}

function rule(role, purpose, fields) {
  return { role, purpose, fields };
}

function refsForFields(normalizedInput, fields) {
  return fields.flatMap((field) => normalizedInput.sourceFieldMap?.[field] || []);
}

function selectRequiredEntities(normalizedInput, sceneRule) {
  return deduplicateSceneFacts([
    ...normalizedInput.knownNames,
    ...normalizedInput.keyActors,
    ...normalizedInput.visualVocabulary,
    ...(sceneRule.fields.includes('setting') ? normalizedInput.setting : [])
  ]).slice(0, 5);
}

function splitFactsForParts(sourceFacts, sceneRule) {
  if (sourceFacts.length >= 2) return [[sourceFacts[0]], [sourceFacts[1], sourceFacts[2]].filter(Boolean)];
  if (sourceFacts.length === 1) return [[sourceFacts[0]], [sourceFacts[0], sceneRule.purpose]];
  return [[], []];
}

function targetWordsForPart(sceneIndex, partIndex) {
  const targets = [
    [68, 70],
    [70, 72],
    [70, 72],
    [66, 68],
    [68, 70]
  ];
  return targets[sceneIndex]?.[partIndex] || 68;
}

function isUsableSceneFact(value) {
  return isUsableEventFact(value) && !/^.+:\s*$/.test(value);
}

function containsMetaLanguage(value) {
  return /this article follows|the article should|the heading keeps|source-aware kyunolab record|viewer should|hold that image|this part should|the goal of this scene/i.test(String(value || ''));
}

function comparableFact(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !/story|legend|myth|record|source|version|tradition/.test(word))
    .slice(0, 10)
    .join(' ');
}

function hasUnreasonableFactDuplication(facts) {
  const counts = new Map();
  facts.map(comparableFact).filter(Boolean).forEach((key) => counts.set(key, (counts.get(key) || 0) + 1));
  return Array.from(counts.values()).some((count) => count > 3);
}

module.exports = {
  buildCreatorScenePlan,
  sceneRulesForContentType,
  validateCreatorScenePlan,
  selectSceneFacts,
  deduplicateSceneFacts,
  isUsableEventFact,
  isSourceContextFact,
  isMeaningFact
};
