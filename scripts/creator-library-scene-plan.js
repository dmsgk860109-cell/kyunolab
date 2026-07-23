const {
  sanitizeCreatorInputText
} = require('./creator-library-input');
const {
  validateCreatorFactRecord,
  isInternalInstruction,
  isIncompleteFactFragment
} = require('./creator-library-facts');

const SCENE_RULES = {
  'myth-narrative': [
    rule('Defining Event', 'Introduce the central figure and the first problem.', ['knownNames', 'keyActors', 'coreProblem', 'eventSequence'], ['subject', 'problem', 'event', 'relationship']),
    rule('Core Sequence', 'Follow the main action and relationship between figures.', ['eventSequence', 'keyActors', 'coreProblem'], ['event', 'relationship', 'setting', 'problem']),
    rule('Turning Point and Consequence', 'Show the decisive turn and its direct result.', ['turningPoint', 'eventSequence', 'outcome'], ['turning-point', 'event', 'outcome']),
    rule('Variants and Source Context', 'Separate variant details from source context.', ['reportedVariants', 'sourceContext', 'sourceEvidence'], ['variant', 'source-context']),
    rule('Outcome and Meaning', 'Close with the result and symbolic meaning.', ['outcome', 'meaningOptions', 'sourceContext'], ['outcome', 'meaning', 'source-context'])
  ],
  'folklore-legend': [
    rule('Region and Core Claim', 'Establish the place, subject, and central claim.', ['setting', 'knownNames', 'coreProblem'], ['setting', 'subject', 'problem', 'event']),
    rule('Core Story', 'Present the main version of the legend.', ['eventSequence', 'keyActors', 'coreProblem'], ['event', 'relationship', 'problem']),
    rule('Circulating Variants', 'Show how the legend changes in circulation.', ['reportedVariants', 'eventSequence'], ['variant', 'event']),
    rule('Records and Social Context', 'Connect the legend to records or social setting.', ['sourceContext', 'sourceEvidence', 'setting'], ['source-context', 'setting']),
    rule('Meaning and Continued Role', 'Explain why the legend continues to matter.', ['outcome', 'meaningOptions', 'sourceContext'], ['outcome', 'meaning', 'source-context'])
  ],
  'mythical-being-object': [
    rule('Identity and Defining Trait', 'Define the being or object through its core trait.', ['knownNames', 'visualVocabulary', 'coreProblem'], ['subject', 'visual', 'problem', 'event']),
    rule('Abilities, Function, or Appearance', 'Explain what the subject does or represents.', ['eventSequence', 'visualVocabulary', 'keyActors'], ['event', 'visual', 'relationship']),
    rule('Encounters and Variants', 'Place the subject inside encounters and variants.', ['reportedVariants', 'eventSequence'], ['variant', 'event']),
    rule('Sources and Later Changes', 'Separate source material from later changes.', ['sourceContext', 'sourceEvidence', 'reportedVariants'], ['source-context', 'variant']),
    rule('Meaning and Cultural Legacy', 'Close with meaning and lasting role.', ['outcome', 'meaningOptions', 'sourceContext'], ['outcome', 'meaning', 'source-context'])
  ],
  'urban-modern-legend': [
    rule('Commonly Told Version', 'Open with the familiar version of the legend.', ['knownNames', 'coreProblem', 'eventSequence'], ['subject', 'problem', 'event']),
    rule('Core Incident', 'Move through the central incident.', ['eventSequence', 'setting', 'keyActors'], ['event', 'setting', 'relationship']),
    rule('Spread and Regional Variants', 'Show circulation and variant details.', ['reportedVariants', 'sourceContext'], ['variant', 'source-context', 'event']),
    rule('Real-event Claims and Evidence', 'Separate claims from evidence.', ['sourceEvidence', 'sourceContext', 'reportedVariants'], ['source-context', 'variant']),
    rule('Why the Legend Persists', 'Close on the fear or question that remains.', ['outcome', 'meaningOptions', 'coreProblem'], ['outcome', 'meaning', 'problem'])
  ],
  'internet-folklore': [
    rule('Initial Appearance', 'Establish the first visible form online.', ['knownNames', 'eventSequence', 'coreProblem'], ['subject', 'event', 'problem', 'source-context']),
    rule('Spread and Core Clues', 'Show how the story or puzzle spread.', ['eventSequence', 'visualVocabulary', 'sourceContext'], ['event', 'visual', 'source-context']),
    rule('Key Development or Later Additions', 'Separate developments from additions.', ['turningPoint', 'reportedVariants', 'eventSequence'], ['turning-point', 'variant', 'event']),
    rule('Evidence, Attribution, and Uncertainty', 'Clarify evidence and uncertainty.', ['sourceEvidence', 'sourceContext', 'reportedVariants'], ['source-context', 'variant']),
    rule('Meaning and Digital Legacy', 'Close on the digital legacy or open question.', ['outcome', 'meaningOptions', 'sourceContext'], ['outcome', 'meaning', 'source-context'])
  ],
  'place-event-mystery': [
    rule('What, When, and Where', 'Establish the event or place clearly.', ['setting', 'knownNames', 'eventSequence'], ['setting', 'subject', 'event', 'problem']),
    rule('Core Record or Event', 'Present the core record or event.', ['eventSequence', 'sourceEvidence', 'coreProblem'], ['event', 'source-context', 'problem']),
    rule('Evidence and Key Details', 'Focus on evidence and important details.', ['sourceEvidence', 'visualVocabulary', 'eventSequence'], ['source-context', 'visual', 'event']),
    rule('Major Explanations and Uncertainty', 'Separate explanations from uncertainty.', ['reportedVariants', 'sourceContext', 'meaningOptions'], ['variant', 'source-context', 'meaning']),
    rule('What Remains Unresolved', 'Close with the unresolved state.', ['outcome', 'meaningOptions', 'sourceContext'], ['outcome', 'meaning', 'source-context'])
  ],
  'origin-comparison': [
    rule('The Familiar Claim', 'Open with the common claim.', ['knownNames', 'coreProblem', 'eventSequence'], ['subject', 'problem', 'event']),
    rule('Earliest Traceable Form', 'Present the earliest traceable form.', ['sourceEvidence', 'sourceContext', 'eventSequence'], ['source-context', 'event']),
    rule('Elements Added Later', 'Show later additions without merging them.', ['reportedVariants', 'eventSequence'], ['variant', 'event']),
    rule('Regional or Source Differences', 'Compare differences across sources.', ['reportedVariants', 'sourceContext', 'sourceEvidence'], ['variant', 'source-context']),
    rule('What the Comparison Shows', 'Close with what the comparison reveals.', ['outcome', 'meaningOptions', 'sourceContext'], ['outcome', 'meaning', 'source-context'])
  ]
};

function buildCreatorScenePlan(normalizedInput, options = {}) {
  const rules = sceneRulesForContentType(normalizedInput.contentType);
  const warnings = [...(normalizedInput.warnings || [])];
  const missingRequiredFields = [...(normalizedInput.missingRequiredFields || [])];
  const targetNarrationSeconds = options.targetNarrationSeconds || 295;
  const targetFinalVideoSeconds = options.targetFinalVideoSeconds || 340;
  const factRecords = Array.isArray(normalizedInput.factRecords) ? normalizedInput.factRecords : [];
  const scenes = rules.map((sceneRule, sceneIndex) => {
    const sceneFacts = selectSceneFactRecords(factRecords, sceneRule, sceneIndex);
    const sourceFacts = sceneFacts.map((record) => record.factText);
    const sourceFactIds = sceneFacts.map((record) => record.id);
    const sourceFieldRefs = uniqueText(sceneFacts.flatMap((record) => record.sourceRefs || []));
    const partFacts = splitFactRecordsForParts(sceneFacts);
    return {
      sceneIndex: sceneIndex + 1,
      role: sceneRule.role,
      purpose: sceneRule.purpose,
      sourceFactIds,
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
        sourceFactIds: partFacts[offset].map((record) => record.id),
        sourceFacts: partFacts[offset].map((record) => record.factText),
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
    factRecords,
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
  const factRecords = Array.isArray(scenePlan?.factRecords) ? scenePlan.factRecords : [];
  const factById = new Map(factRecords.map((record) => [record.id, record]));
  const allPartFacts = [];
  const allPartFactIds = [];
  let totalTargetWords = 0;
  (scenePlan?.scenes || []).forEach((scene, sceneIndex) => {
    const expectedRole = rules[sceneIndex]?.role;
    if (scene.sceneIndex !== sceneIndex + 1) errors.push(`Scene ${sceneIndex + 1} has invalid sceneIndex.`);
    if (expectedRole && scene.role !== expectedRole) errors.push(`Scene ${sceneIndex + 1} role must be ${expectedRole}.`);
    if (!Array.isArray(scene.sourceFactIds) || !scene.sourceFactIds.length) errors.push(`Scene ${sceneIndex + 1} has no sourceFactIds.`);
    validateFactRefs(scene.sourceFactIds || [], factById, rules[sceneIndex], `Scene ${sceneIndex + 1}`, errors);
    if (!Array.isArray(scene.sourceFacts) || !scene.sourceFacts.some(isUsableSceneFact)) errors.push(`Scene ${sceneIndex + 1} has no usable source fact.`);
    for (const fact of scene.sourceFacts || []) {
      if (isInternalInstruction(fact)) errors.push(`Scene ${sceneIndex + 1} sourceFacts contain internal instruction.`);
      if (isIncompleteFactFragment(fact)) errors.push(`Scene ${sceneIndex + 1} sourceFacts contain incomplete fragment.`);
    }
    if (!Array.isArray(scene.narrationParts) || scene.narrationParts.length !== 2) errors.push(`Scene ${sceneIndex + 1} must contain exactly 2 narration parts.`);
    (scene.narrationParts || []).forEach((part) => {
      if (!Array.isArray(part.sourceFactIds) || !part.sourceFactIds.length) {
        errors.push(`Scene ${sceneIndex + 1} Part ${part.partIndex || '?'} has no sourceFactIds.`);
      }
      validateFactRefs(part.sourceFactIds || [], factById, rules[sceneIndex], `Scene ${sceneIndex + 1} Part ${part.partIndex || '?'}`, errors);
      if (!Array.isArray(part.sourceFacts) || !part.sourceFacts.some(isUsableSceneFact)) {
        errors.push(`Scene ${sceneIndex + 1} Part ${part.partIndex || '?'} has no source fact.`);
      }
      for (const fact of part.sourceFacts || []) {
        if (isInternalInstruction(fact)) errors.push(`Scene ${sceneIndex + 1} Part ${part.partIndex || '?'} sourceFacts contain internal instruction.`);
        if (isIncompleteFactFragment(fact)) errors.push(`Scene ${sceneIndex + 1} Part ${part.partIndex || '?'} sourceFacts contain incomplete fragment.`);
      }
      if (!Number.isFinite(part.targetWords) || part.targetWords < 55 || part.targetWords > 80) {
        errors.push(`Scene ${sceneIndex + 1} Part ${part.partIndex || '?'} targetWords is outside 55-80.`);
      }
      totalTargetWords += Number(part.targetWords || 0);
      allPartFacts.push(...(part.sourceFacts || []));
      allPartFactIds.push(...(part.sourceFactIds || []));
    });
    validateSceneRoleFactCoverage(scene, factById, rules[sceneIndex], sceneIndex, errors);
  });

  if (totalTargetWords < 620 || totalTargetWords > 760) errors.push(`targetWords total is outside 620-760: ${totalTargetWords}`);
  if (hasUnreasonableFactDuplication(allPartFacts)) errors.push('Scene Plan repeats the same source fact too often.');
  if (hasUnreasonableFactIdDuplication(allPartFactIds)) errors.push('Scene Plan repeats the same sourceFactId too often.');

  return { valid: errors.length === 0, errors };
}

function selectSceneFacts(normalizedInput, sceneRule) {
  return selectSceneFactRecords(normalizedInput.factRecords || [], sceneRule, 0).map((record) => record.factText);
}

function selectSceneFactRecords(factRecords, sceneRule, sceneIndex = 0) {
  const selected = [];
  const used = new Set();
  for (const factType of sceneRule.factTypes || []) {
    const candidates = factRecords
      .filter((record) => record.factType === factType)
      .filter((record) => isUsableSceneFact(record.factText))
      .sort((a, b) => scoreFactForScene(b, sceneRule, sceneIndex) - scoreFactForScene(a, sceneRule, sceneIndex));
    if (candidates[0] && !used.has(candidates[0].id)) {
      selected.push(candidates[0]);
      used.add(candidates[0].id);
    }
  }
  for (const record of factRecords
    .filter((record) => (sceneRule.factTypes || []).includes(record.factType))
    .filter((record) => isUsableSceneFact(record.factText))
    .sort((a, b) => scoreFactForScene(b, sceneRule, sceneIndex) - scoreFactForScene(a, sceneRule, sceneIndex))) {
    if (used.has(record.id)) continue;
    selected.push(record);
    used.add(record.id);
  }
  return deduplicateFactRecords(selected)
    .filter((record) => isUsableSceneFact(record.factText))
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

function deduplicateFactRecords(records) {
  const seen = new Set();
  const output = [];
  for (const record of records) {
    const key = record.id || comparableFact(record.factText);
    if (!record?.factText || seen.has(key)) continue;
    seen.add(key);
    output.push(record);
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

function rule(role, purpose, fields, factTypes) {
  return { role, purpose, fields, factTypes };
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

function splitFactRecordsForParts(sourceFacts) {
  if (sourceFacts.length >= 4) return [sourceFacts.slice(0, 2), sourceFacts.slice(2, 4)];
  if (sourceFacts.length >= 3) return [[sourceFacts[0], sourceFacts[1]], [sourceFacts[2]]];
  if (sourceFacts.length >= 2) return [[sourceFacts[0]], [sourceFacts[1]]];
  if (sourceFacts.length === 1) return [[sourceFacts[0]], [sourceFacts[0]]];
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
  return /this article follows|the article should|the heading keeps|source-aware kyunolab record|viewer should|hold that image|this part should|the goal of this scene|establish the point.*sourceFacts|develop the point.*sourceFacts/i.test(String(value || ''));
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
  return Array.from(counts.values()).some((count) => count > 7);
}

function hasUnreasonableFactIdDuplication(factIds) {
  const counts = new Map();
  factIds.filter(Boolean).forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
  return Array.from(counts.values()).some((count) => count > 4);
}

function validateFactRefs(factIds, factById, sceneRule, label, errors) {
  for (const factId of factIds) {
    const record = factById.get(factId);
    if (!record) {
      errors.push(`${label} references missing sourceFactId: ${factId}`);
      continue;
    }
    const validation = validateCreatorFactRecord(record);
    validation.errors.forEach((error) => errors.push(`${label} has invalid source fact ${factId}: ${error}`));
    if (sceneRule?.factTypes?.length && !sceneRule.factTypes.includes(record.factType)) {
      errors.push(`${label} uses ${record.factType} fact outside allowed types for ${sceneRule.role}.`);
    }
  }
}

function validateSceneRoleFactCoverage(scene, factById, sceneRule, sceneIndex, errors) {
  const records = (scene.sourceFactIds || []).map((id) => factById.get(id)).filter(Boolean);
  const types = new Set(records.map((record) => record.factType));
  if (sceneIndex === 0 && !types.has('subject') && !types.has('problem')) errors.push('Scene 1 must include subject or problem fact.');
  if (sceneIndex === 1 && !types.has('event')) errors.push('Scene 2 must include event fact.');
  if (sceneIndex === 2 && !types.has('turning-point') && !types.has('event')) errors.push('Scene 3 must include turning-point or event fact.');
  if (sceneIndex === 3 && !types.has('variant') && !types.has('source-context')) errors.push('Scene 4 must include variant or source-context fact.');
  if (sceneIndex === 4 && !types.has('outcome') && !types.has('meaning') && !types.has('source-context')) errors.push('Scene 5 must include outcome, meaning, or source-context fact.');
}

function scoreFactForScene(record, sceneRule, sceneIndex) {
  const typeRank = (sceneRule.factTypes || []).indexOf(record.factType);
  const typeScore = typeRank === -1 ? 0 : (sceneRule.factTypes.length - typeRank) * 100;
  const sequence = Number(record.sequenceIndex || 999);
  const sceneSequenceTarget = [1, 2, 3, 4, 5][sceneIndex] || 1;
  const sequenceScore = Math.max(0, 30 - Math.abs(sequence - sceneSequenceTarget) * 4);
  const priorityScore = Math.max(0, 20 - Number(record.sourcePriority || 0));
  return typeScore + sequenceScore + priorityScore;
}

function uniqueText(values) {
  return [...new Set(values.map(sanitizeCreatorInputText).filter(Boolean))];
}

module.exports = {
  buildCreatorScenePlan,
  sceneRulesForContentType,
  validateCreatorScenePlan,
  selectSceneFacts,
  selectSceneFactRecords,
  deduplicateSceneFacts,
  isUsableEventFact,
  isSourceContextFact,
  isMeaningFact
};
