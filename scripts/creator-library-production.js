const {
  sanitizeCreatorInputText
} = require('./creator-library-input');
const {
  estimateNarrationReadTime
} = require('./creator-library-longform');
const {
  validateCreatorFactRecord,
  isInternalInstruction,
  isIncompleteFactFragment
} = require('./creator-library-facts');

const PRODUCTION_SCHEMA_VERSION = '1.0';
const SCENE_COUNT = 5;
const PARTS_PER_SCENE = 2;
const INTERNAL_METADATA_PATTERNS = [
  /establish the point/i,
  /develop the point/i,
  /close the point/i,
  /preserve the point/i,
  /defining event/i,
  /core sequence/i,
  /turning point and consequence/i,
  /variants and source context/i,
  /outcome and meaning/i,
  /needs this part to preserve/i,
  /keep the visual work centered/i,
  /confirmed story material/i,
  /part purpose/i,
  /source facts/i,
  /scene plan/i
];

const CONTENT_TYPE_PROFILES = {
  'myth-narrative': {
    profileType: 'mythic narrative',
    atmosphere: ['ancient atmosphere', 'symbolic tension', 'restrained wonder'],
    musicCore: ['low hand drums', 'slow strings', 'ancient ambient bed'],
    visualTone: 'ancient documentary realism'
  },
  'folklore-legend': {
    profileType: 'folklore legend',
    atmosphere: ['oral tradition mood', 'quiet mystery', 'regional memory'],
    musicCore: ['acoustic drone', 'soft folk texture', 'slow documentary bed'],
    visualTone: 'grounded folklore realism'
  },
  'mythical-being-object': {
    profileType: 'mythic being or object',
    atmosphere: ['legendary atmosphere', 'watchful tension', 'symbolic weight'],
    musicCore: ['low drone', 'subtle percussion', 'dark mythic ambience'],
    visualTone: 'legendary documentary realism'
  },
  'urban-modern-legend': {
    profileType: 'modern legend',
    atmosphere: ['restrained unease', 'everyday mystery', 'quiet suspicion'],
    musicCore: ['dark ambient bed', 'low pulse', 'sparse piano'],
    visualTone: 'realistic modern documentary style'
  },
  'internet-folklore': {
    profileType: 'internet folklore',
    atmosphere: ['digital mystery', 'quiet investigation', 'unresolved puzzle mood'],
    musicCore: ['low electronic pulse', 'dark ambient bed', 'sparse digital texture'],
    visualTone: 'realistic digital-documentary style'
  },
  'place-event-mystery': {
    profileType: 'place or event mystery',
    atmosphere: ['documentary uncertainty', 'quiet tension', 'unresolved atmosphere'],
    musicCore: ['low drone', 'slow piano', 'sparse documentary bed'],
    visualTone: 'realistic location-documentary style'
  },
  'origin-comparison': {
    profileType: 'origin comparison',
    atmosphere: ['reflective curiosity', 'historical contrast', 'careful comparison'],
    musicCore: ['soft documentary bed', 'subtle acoustic texture', 'slow reflective drone'],
    visualTone: 'historical documentary realism'
  }
};

function buildCreatorProductionFields(normalizedInput, scenePlan, longformResult) {
  const productionProfile = buildProductionProfile(normalizedInput);
  const factRecords = Array.isArray(normalizedInput.factRecords) ? normalizedInput.factRecords : [];
  const factById = new Map(factRecords.map((record) => [record.id, record]));
  const warnings = [
    ...(normalizedInput.warnings || []),
    ...(scenePlan.warnings || [])
  ];
  const seenCreatorNotes = new Set();
  const seenSceneFocuses = new Set();
  const seenImagePrompts = new Set();
  const seenBeatMotions = new Set();
  const scenes = (scenePlan.scenes || []).map((scene, sceneIndex) => {
    const longformScene = (longformResult.scenes || [])[sceneIndex] || {};
    const productionScene = publicSceneContextFromScene(scene, factById);
    const sceneContext = {
      normalizedInput,
      scene: productionScene,
      longformScene,
      productionProfile,
      factRecords,
      factById
    };
    const sceneFocus = uniquifySceneFocus(
      buildSceneFocusForScene(sceneContext),
      sceneContext,
      seenSceneFocuses
    );
    return {
      sceneIndex: scene.sceneIndex,
      role: scene.role,
      sceneFocus,
      backgroundMusic: buildBackgroundMusicForScene(sceneContext),
      voiceDirection: buildVoiceDirectionForScene(sceneContext),
      soundEffect: buildSoundEffectForScene(sceneContext),
      narrationParts: (scene.narrationParts || []).map((partPlan, partIndex) => {
        const narrationPart = (longformScene.narrationParts || [])[partIndex] || {};
        const partContext = {
          ...sceneContext,
          partPlan: publicPartContextFromPlan(partPlan, factById),
          narrationPart
        };
        const creatorNote = uniquifyCreatorNote(
          buildCreatorNoteForPart(partContext),
          partContext,
          seenCreatorNotes
        );
        return {
          partIndex: partPlan.partIndex,
          creatorNote,
          visualBeats: buildVisualBeatsForPart(partContext, {
            imagePrompts: seenImagePrompts,
            beatMotions: seenBeatMotions
          })
        };
      })
    };
  });
  const result = {
    schemaVersion: PRODUCTION_SCHEMA_VERSION,
    inputSchemaVersion: normalizedInput.schemaVersion || PRODUCTION_SCHEMA_VERSION,
    scenePlanSchemaVersion: scenePlan.schemaVersion || PRODUCTION_SCHEMA_VERSION,
    slug: normalizedInput.slug || '',
    topic: normalizedInput.topic || '',
    contentType: normalizedInput.contentType || '',
    productionProfile,
    scenes,
    missingRequiredFields: [],
    warnings
  };
  const validation = validateCreatorProductionFields(result, scenePlan, longformResult);
  if (!validation.valid) {
    const error = new Error(`Creator production invalid for ${result.slug}`);
    error.code = 'CREATOR_PRODUCTION_INVALID';
    error.slug = result.slug;
    error.errors = validation.errors;
    throw error;
  }
  return result;
}

function validateCreatorProductionFields(result, scenePlan, longformResult) {
  const errors = [];
  if (!result || typeof result !== 'object') errors.push(detailError(result, 0, 0, 0, 'schema', 'Production result must be an object.'));
  if (result?.schemaVersion !== PRODUCTION_SCHEMA_VERSION) errors.push(detailError(result, 0, 0, 0, 'schemaVersion', 'Production schemaVersion must be 1.0.'));
  if (result?.inputSchemaVersion !== '1.0') errors.push(detailError(result, 0, 0, 0, 'inputSchemaVersion', 'inputSchemaVersion must be 1.0.'));
  if (result?.scenePlanSchemaVersion !== '1.0') errors.push(detailError(result, 0, 0, 0, 'scenePlanSchemaVersion', 'scenePlanSchemaVersion must be 1.0.'));
  const profileErrors = validateProductionProfile(result?.productionProfile);
  errors.push(...profileErrors.map((error) => detailError(result, 0, 0, 0, 'productionProfile', error)));
  if (!Array.isArray(result?.scenes) || result.scenes.length !== SCENE_COUNT) {
    errors.push(detailError(result, 0, 0, 0, 'scenes', 'Production result must contain exactly 5 scenes.'));
  }

  const creatorNotes = [];
  const imagePrompts = [];
  (result?.scenes || []).forEach((scene, sceneIndex) => {
    const expectedPlanScene = scenePlan?.scenes?.[sceneIndex] || {};
    const expectedLongformScene = longformResult?.scenes?.[sceneIndex] || {};
    const sceneNumber = sceneIndex + 1;
    if (scene.sceneIndex !== sceneNumber || scene.sceneIndex !== expectedPlanScene.sceneIndex || scene.sceneIndex !== expectedLongformScene.sceneIndex) {
      errors.push(detailError(result, sceneNumber, 0, 0, 'sceneIndex', 'Production Scene index must match Scene Plan and Long-form.'));
    }
    for (const field of ['role', 'sceneFocus', 'backgroundMusic', 'voiceDirection', 'soundEffect']) {
      if (!sanitizeProductionText(scene[field])) errors.push(detailError(result, sceneNumber, 0, 0, field, `${field} is required.`));
    }
    if (containsInternalProductionMetadata(scene.sceneFocus)) {
      errors.push(detailError(result, sceneNumber, 0, 0, 'sceneFocus', 'Scene Focus contains internal Scene Plan metadata.'));
    }
    if (containsFieldMixing(scene.backgroundMusic, ['sound effect', 'voice direction', 'camera'])) {
      errors.push(detailError(result, sceneNumber, 0, 0, 'backgroundMusic', 'Background Music contains another production field.'));
    }
    if (containsFieldMixing(scene.voiceDirection, ['image prompt', 'camera', 'sound effect'])) {
      errors.push(detailError(result, sceneNumber, 0, 0, 'voiceDirection', 'Voice Direction contains another production field.'));
    }
    if (containsFieldMixing(scene.soundEffect, ['music', 'narration', 'voice direction'])) {
      errors.push(detailError(result, sceneNumber, 0, 0, 'soundEffect', 'Sound Effect contains another production field.'));
    }
    const sceneNarration = (expectedLongformScene.narrationParts || []).map((part) => part.narration).join(' ');
    assertVoiceEmphasisMatches(scene.voiceDirection, sceneNarration).forEach((error) => {
      errors.push(detailError(result, sceneNumber, 0, 0, 'voiceDirection', error));
    });
    if (usesUnrelatedOfficeSound(scene.soundEffect, result.contentType)) {
      errors.push(detailError(result, sceneNumber, 0, 0, 'soundEffect', 'Sound Effect contains an unrelated office or digital preset.'));
    }
    if (!Array.isArray(scene.narrationParts) || scene.narrationParts.length !== PARTS_PER_SCENE) {
      errors.push(detailError(result, sceneNumber, 0, 0, 'narrationParts', 'Each Scene must contain exactly 2 Narration Parts.'));
    }
    const sceneMotions = [];
    (scene.narrationParts || []).forEach((part, partIndex) => {
      const partNumber = partIndex + 1;
      const expectedPart = expectedLongformScene.narrationParts?.[partIndex] || {};
      if (part.partIndex !== partNumber) errors.push(detailError(result, sceneNumber, partNumber, 0, 'partIndex', 'Part index is invalid.'));
      if (!sanitizeProductionText(part.creatorNote)) errors.push(detailError(result, sceneNumber, partNumber, 0, 'creatorNote', 'Creator Note is required.'));
      if (containsInternalProductionMetadata(part.creatorNote)) {
        errors.push(detailError(result, sceneNumber, partNumber, 0, 'creatorNote', 'Creator Note contains internal Scene Plan metadata.'));
      }
      if (part.creatorNote && exactTextKey(part.creatorNote) === exactTextKey(expectedPart.narration)) {
        errors.push(detailError(result, sceneNumber, partNumber, 0, 'creatorNote', 'Creator Note copies the Narration.'));
      }
      if (containsFieldMixing(part.creatorNote, ['image prompt', 'motion prompt', 'beat motion', 'background music', 'voice direction', 'sound effect', 'camera instruction'])) {
        errors.push(detailError(result, sceneNumber, partNumber, 0, 'creatorNote', 'Creator Note contains another production field.'));
      }
      if (isGenericCreatorNote(part.creatorNote)) errors.push(detailError(result, sceneNumber, partNumber, 0, 'creatorNote', 'Creator Note is too generic.'));
      creatorNotes.push(part.creatorNote);
      if (!Array.isArray(part.visualBeats) || part.visualBeats.length < 1 || part.visualBeats.length > 3) {
        errors.push(detailError(result, sceneNumber, partNumber, 0, 'visualBeats', 'Visual Beat count must be 1 to 3.'));
      }
      (part.visualBeats || []).forEach((beat, beatIndex) => {
        const beatNumber = beatIndex + 1;
        if (beat.beatIndex !== beatNumber) errors.push(detailError(result, sceneNumber, partNumber, beatNumber, 'beatIndex', 'Beat index is invalid.'));
        if (!sanitizeProductionText(beat.imagePrompt)) errors.push(detailError(result, sceneNumber, partNumber, beatNumber, 'imagePrompt', 'Image Prompt is required.'));
        if (!sanitizeProductionText(beat.beatMotion)) errors.push(detailError(result, sceneNumber, partNumber, beatNumber, 'beatMotion', 'Beat Motion is required.'));
        if (!Array.isArray(beat.sourceFactIds) || !beat.sourceFactIds.length) errors.push(detailError(result, sceneNumber, partNumber, beatNumber, 'sourceFactIds', 'Visual Beat must contain sourceFactIds.'));
        if (containsInternalProductionMetadata(beat.imagePrompt)) {
          errors.push(detailError(result, sceneNumber, partNumber, beatNumber, 'imagePrompt', 'Image Prompt contains internal Scene Plan metadata.'));
        }
        if (containsInternalProductionMetadata(beat.beatMotion)) {
          errors.push(detailError(result, sceneNumber, partNumber, beatNumber, 'beatMotion', 'Beat Motion contains internal Scene Plan metadata.'));
        }
        if (!Array.isArray(beat.sourceFieldRefs)) errors.push(detailError(result, sceneNumber, partNumber, beatNumber, 'sourceFieldRefs', 'sourceFieldRefs must be an array.'));
        if (containsBrokenPromptText(beat.imagePrompt) || detectBrokenProductionText(beat.imagePrompt).length) errors.push(detailError(result, sceneNumber, partNumber, beatNumber, 'imagePrompt', 'Image Prompt contains broken text.'));
        if (containsFieldMixing(beat.imagePrompt, ['sound effect', 'voice direction', 'beat motion', 'motion prompt'])) {
          errors.push(detailError(result, sceneNumber, partNumber, beatNumber, 'imagePrompt', 'Image Prompt contains another production field.'));
        }
        if (containsBrokenMotionText(beat.beatMotion) || detectBrokenProductionText(beat.beatMotion).length) errors.push(detailError(result, sceneNumber, partNumber, beatNumber, 'beatMotion', 'Beat Motion contains broken text.'));
        if (containsFieldMixing(beat.beatMotion, ['sound effect', 'music', 'voice direction', 'narration'])) {
          errors.push(detailError(result, sceneNumber, partNumber, beatNumber, 'beatMotion', 'Beat Motion contains another production field.'));
        }
        imagePrompts.push(beat.imagePrompt);
        sceneMotions.push(beat.beatMotion);
      });
    });
    if (hasExactDuplicate(sceneMotions)) {
      errors.push(detailError(result, sceneNumber, 0, 0, 'beatMotion', 'Duplicate Beat Motion inside one Scene.'));
    }
  });
  if (hasExactDuplicate(creatorNotes)) errors.push(detailError(result, 0, 0, 0, 'creatorNote', 'Duplicate Creator Note detected.'));
  if (hasExactDuplicate(imagePrompts)) errors.push(detailError(result, 0, 0, 0, 'imagePrompt', 'Duplicate Image Prompt detected.'));
  return { valid: errors.length === 0, errors };
}

function buildCreatorNoteForPart(context) {
  const records = selectProductionFactRecords(context, { preferVisual: false }).slice(0, 3);
  const primary = records[0] || {};
  const secondary = selectSceneBoundaryRecord(context, records)
    || selectPartSecondaryRecord(context, primary)
    || selectNarrationFactRecord(context, records)
    || records.find((record) => record.factType !== primary.factType)
    || records[1]
    || primary;
  const entity = selectEntityFromRecords(records, context.normalizedInput.topic);
  const primaryText = lowercaseStart(stripFinalPunctuation(realizeVisualFact(primary, context)));
  const noteParts = [
    `${entity} must stay tied to ${primaryText}.`
  ];
  if (secondary && secondary.id !== primary.id) {
    noteParts.push(noteCautionForFact(secondary, context));
  } else {
    noteParts.push(noteCautionForFact(primary, context));
  }
  return sanitizeProductionText(noteParts.filter(Boolean).slice(0, 2).join(' '));
}

function uniquifyCreatorNote(note, context, seen) {
  let candidate = sanitizeProductionText(note);
  let key = exactTextKey(candidate);
  if (!seen.has(key)) {
    seen.add(key);
    return candidate;
  }
  const boundarySentences = uniqueRecords([
    ...(context.partPlan?.factRecords || []),
    ...(context.scene?.factRecords || []),
    ...(context.normalizedInput?.factRecords || [])
  ])
    .filter(isProductionFactRecord)
    .map((record) => {
      const text = lowercaseStart(stripFinalPunctuation(realizeVisualFact(record, context)));
      return text ? `Keep the production boundary on ${text}.` : '';
    })
    .filter(Boolean);
  for (const sentence of boundarySentences) {
    const expanded = sanitizeProductionText(`${candidate} ${sentence}`);
    key = exactTextKey(expanded);
    if (!seen.has(key)) {
      seen.add(key);
      return expanded;
    }
  }
  const fallback = sanitizeProductionText(`${candidate} Keep the production boundary on ${lowercaseStart(context.normalizedInput.topic)} in the ${sequenceLabelForScene(context.scene.sceneIndex)}.`);
  seen.add(exactTextKey(fallback));
  return fallback;
}

function uniquifySceneFocus(sceneFocus, context, seen) {
  let candidate = sanitizeProductionText(sceneFocus);
  let key = exactTextKey(candidate);
  if (!seen.has(key)) {
    seen.add(key);
    return candidate;
  }
  const records = uniqueRecords([
    ...(context.scene?.factRecords || []),
    ...(context.normalizedInput?.factRecords || [])
  ]).filter(isProductionFactRecord);
  for (const record of records) {
    const text = lowercaseStart(stripFinalPunctuation(realizeVisualFact(record, context)));
    if (!text) continue;
    const expanded = sanitizeProductionText(`${candidate} Frame it through ${text}.`);
    key = exactTextKey(expanded);
    if (!seen.has(key)) {
      seen.add(key);
      return expanded;
    }
  }
  const fallback = sanitizeProductionText(`${candidate} Keep it specific to the ${sequenceLabelForScene(context.scene.sceneIndex)}.`);
  seen.add(exactTextKey(fallback));
  return fallback;
}

function buildVisualBeatsForPart(context, seenFields = {}) {
  const plans = buildVisualBeatPlan(context);
  return plans.map((beatPlan, beatIndex) => {
    const beatContext = { ...context, beatIndex, beatPlan };
    const imagePrompt = uniquifyBeatField(
      buildImagePromptForBeat(beatContext),
      beatContext,
      seenFields.imagePrompts,
      'imagePrompt'
    );
    return {
      beatIndex: beatIndex + 1,
      sourceFactIds: [...beatPlan.sourceFactIds],
      imagePrompt,
      beatMotion: uniquifyBeatField(
        buildBeatMotionForBeat({ ...beatContext, imagePrompt }),
        { ...beatContext, imagePrompt },
        seenFields.beatMotions,
        'beatMotion'
      ),
      sourceFieldRefs: context.partPlan.sourceFieldRefs || context.scene.sourceFieldRefs || []
    };
  });
}

function uniquifyBeatField(value, context, seen, field) {
  let candidate = sanitizeProductionText(value);
  if (!seen) return candidate;
  let key = exactTextKey(candidate);
  if (!seen.has(key)) {
    seen.add(key);
    return candidate;
  }
  const detail = safeMotionValue(
    (context.beatPlan?.visualTerms || [])[context.beatIndex]
      || (context.beatPlan?.supportingObjects || [])[context.beatIndex]
      || context.beatPlan?.subject
      || context.normalizedInput.topic,
    context.normalizedInput.topic
  );
  const passage = visualPhaseForBeat(context.partPlan, context.beatIndex);
  const addition = field === 'imagePrompt'
    ? `Keep ${detail} visible as the distinct ${passage}.`
    : `Let ${detail} remain the distinct ${passage}.`;
  candidate = sanitizeProductionText(`${candidate} ${addition}`);
  key = exactTextKey(candidate);
  if (!seen.has(key)) {
    seen.add(key);
    return candidate;
  }
  const fallback = sanitizeProductionText(`${candidate} Match the ${sequenceLabelForScene(context.scene.sceneIndex)}.`);
  seen.add(exactTextKey(fallback));
  return fallback;
}

function buildVisualBeatPlan(context) {
  const visualRecords = selectVisualFactRecords(context);
  const beatCount = determineVisualBeatCount(context, visualRecords);
  return visualRecords.slice(0, beatCount).map((record, index) => {
    const subject = selectSubjectForBeat(record, context);
    const setting = selectSetting(context.productionProfile, context.scene, record.factText);
    return {
      beatIndex: index + 1,
      sourceFactIds: [record.id],
      factRecords: [record],
      subject,
      actionOrState: actionStateFromFactRecord(record, subject),
      setting,
      supportingObjects: selectSupportingObjects(record, context),
      visualTerms: uniqueText([...(record.visualTerms || []), ...(record.settingTerms || [])]).slice(0, 5),
      compositionType: compositionForBeat(context.scene, context.partPlan, index),
      culturalContext: selectCulturalContext(context, record),
      exclusions: [exclusionsForProfile(context.productionProfile)]
    };
  });
}

function selectVisualFactRecords(context) {
  const selected = selectProductionFactRecords(context, { preferVisual: true });
  const fallback = [
    ...(context.scene.factRecords || []),
    ...(context.normalizedInput.factRecords || [])
  ].filter(isProductionFactRecord);
  return uniqueRecords([...selected, ...fallback]).slice(0, 3);
}

function selectProductionFactRecords(context, options = {}) {
  const partRecords = (context.partPlan.factRecords || []).filter(isProductionFactRecord);
  const sceneRecords = (context.scene.factRecords || []).filter(isProductionFactRecord);
  const allRecords = (context.normalizedInput.factRecords || []).filter(isProductionFactRecord);
  const role = sceneRoleText(context.scene);
  const preferredTypes = productionPreferredFactTypes(role, options);
  return uniqueRecords([
    ...sortProductionRecords(partRecords, preferredTypes),
    ...sortProductionRecords(sceneRecords, preferredTypes),
    ...sortProductionRecords(allRecords, preferredTypes)
  ]);
}

function productionPreferredFactTypes(role, options = {}) {
  if (options.preferVisual) {
    if (/source|variant|evidence|account|comparison|trace/.test(role)) {
      return ['visual', 'source-context', 'variant', 'event', 'turning-point', 'outcome', 'setting', 'subject', 'meaning', 'problem'];
    }
    if (/closing|meaning|legacy|unresolved|outcome/.test(role)) {
      return ['visual', 'meaning', 'outcome', 'event', 'variant', 'setting', 'subject', 'relationship', 'problem'];
    }
    return ['visual', 'event', 'turning-point', 'outcome', 'setting', 'subject', 'relationship', 'problem'];
  }
  if (/source|variant|evidence|account|comparison|trace/.test(role)) {
    return ['source-context', 'variant', 'meaning', 'event', 'turning-point', 'outcome', 'problem', 'subject', 'relationship', 'setting'];
  }
  if (/closing|meaning|legacy|unresolved|outcome/.test(role)) {
    return ['meaning', 'outcome', 'variant', 'event', 'source-context', 'problem', 'subject', 'relationship', 'setting'];
  }
  return ['event', 'turning-point', 'outcome', 'variant', 'source-context', 'meaning', 'problem', 'subject', 'relationship', 'setting'];
}

function selectSceneBoundaryRecord(context, selectedRecords) {
  const selectedIds = new Set((selectedRecords || []).map((record) => record?.id).filter(Boolean));
  const partIds = new Set((context.partPlan?.sourceFactIds || []).filter(Boolean));
  return (context.scene?.factRecords || [])
    .filter(isProductionFactRecord)
    .find((record) => record.id && !partIds.has(record.id) && !selectedIds.has(record.id))
    || (context.scene?.factRecords || [])
      .filter(isProductionFactRecord)
      .find((record) => record.id && !partIds.has(record.id));
}

function selectPartSecondaryRecord(context, primaryRecord) {
  return (context.partPlan?.factRecords || [])
    .filter(isProductionFactRecord)
    .find((record) => record.id && record.id !== primaryRecord?.id);
}

function selectNarrationFactRecord(context, selectedRecords) {
  const selectedIds = new Set((selectedRecords || []).map((record) => record?.id).filter(Boolean));
  const narration = exactTextKey(context.narrationPart?.narration || '');
  if (!narration) return null;
  return (context.normalizedInput?.factRecords || [])
    .filter(isProductionFactRecord)
    .find((record) => record.id && !selectedIds.has(record.id) && narration.includes(exactTextKey(record.factText)));
}

function realizeVisualFact(record, context = {}) {
  if (!record?.factText) return context.normalizedInput?.topic || 'the central subject';
  const text = safeTerm(record.factText);
  if (record.factType === 'variant') return `the variant detail that ${lowercaseStart(text)}`;
  if (record.factType === 'source-context') return `the source boundary around ${lowercaseStart(text)}`;
  if (record.factType === 'meaning') return `the interpretation connected to ${lowercaseStart(text)}`;
  return text;
}

function buildImagePromptForBeat(context) {
  const { normalizedInput, productionProfile, scene, partPlan, beatIndex, beatPlan } = context;
  const subject = safePromptValue(beatPlan.subject || normalizedInput.topic);
  const actionOrState = safePromptValue(stripFinalPunctuation(beatPlan.actionOrState));
  const setting = safePromptValue(stripFinalPunctuation(beatPlan.setting));
  const composition = beatPlan.compositionType || compositionForBeat(scene, partPlan, beatIndex);
  const lighting = lightingForScene(scene, productionProfile);
  const atmosphere = safePromptValue(selectAtmosphere(productionProfile, scene));
  const culture = safePromptValue(beatPlan.culturalContext[0] || productionProfile.culturalContext[0] || normalizedInput.categoryName || productionProfile.profileType);
  const visualPhase = visualPhaseForBeat(partPlan, beatIndex);
  const sequenceLabel = sequenceLabelForScene(scene.sceneIndex);
  const supporting = beatPlan.supportingObjects.length ? ` Include ${beatPlan.supportingObjects.slice(0, 3).join(', ')} as supporting visual details.` : '';
  const exclusions = beatPlan.exclusions[0] || exclusionsForProfile(productionProfile);
  return sanitizeProductionText([
    `${articleFor(productionProfile.visualTone)} ${productionProfile.visualTone} image shows ${subject} ${actionOrState} in ${setting}.`,
    `Frame one clear scene as ${composition}, with ${lighting}, ${atmosphere}, and cultural context from ${culture}.${supporting}`,
    `This should feel like ${visualPhase} during the ${sequenceLabel}.`,
    exclusions
  ].filter(Boolean).join(' '));
}

function buildBeatMotionForBeat(context) {
  const { scene, partPlan, beatIndex, beatPlan, productionProfile } = context;
  const subject = safeMotionValue(beatPlan.subject || context.normalizedInput.topic, context.normalizedInput.topic);
  const setting = safePromptValue(beatPlan.setting);
  const visualTarget = safeMotionValue(truncateWords(selectMotionTarget(beatPlan.actionOrState, beatPlan.setting, subject), 14), subject);
  const visualDetail = safeMotionValue((beatPlan.visualTerms || [])[beatIndex] || (beatPlan.supportingObjects || [])[beatIndex] || beatPlan.compositionType || visualTarget, visualTarget);
  const motionPhase = motionPhaseForBeat(partPlan, beatIndex);
  const movements = [
    `Use a slow controlled push toward ${subject}, with ${visualTarget} staying fixed as the ${motionPhase} and ${visualDetail} visible.`,
    `Use a restrained lateral pan across ${setting}, letting ${subject} hold the ${motionPhase} while ${visualDetail} stays in frame.`,
    `Start with a static hold, then pull back slightly to reveal ${visualTarget} and ${visualDetail} within the wider frame.`
  ];
  const movementIndex = (beatIndex + Number(partPlan.partIndex || 1) - 1) % movements.length;
  const role = sceneRoleText(scene);
  const ending = /source|variant|evidence|account|trace/i.test(role)
    ? 'Keep the movement restrained and documentary.'
    : /meaning|closing|legacy|unresolved/i.test(role)
      ? 'End with a slow hold and no new action.'
      : `Use only light shifts that match the ${productionProfile.profileType} tone.`;
  return sanitizeProductionText(`${movements[movementIndex]} ${ending}`);
}

function determineVisualBeatCount(context, visualRecords) {
  const distinctVisualTerms = uniqueText(visualRecords.flatMap((record) => [
    record.factText,
    ...(record.visualTerms || []),
    ...(record.entities || []),
    ...(record.settingTerms || [])
  ]));
  const hasMovement = visualRecords.some((record) => ['event', 'turning-point', 'outcome'].includes(record.factType));
  const hasSourceOrMeaning = visualRecords.some((record) => ['source-context', 'meaning', 'variant'].includes(record.factType));
  if (distinctVisualTerms.length >= 5 && hasMovement && visualRecords.length >= 3) return 3;
  if ((distinctVisualTerms.length >= 3 && visualRecords.length >= 2) || (hasMovement && hasSourceOrMeaning)) return 2;
  return 1;
}

function selectSubjectForBeat(record, context) {
  return [
    ...(record.entities || []),
    ...(context.scene.requiredEntities || []),
    ...(context.productionProfile.allowedEntities || []),
    context.normalizedInput.topic
  ]
    .map(safeTerm)
    .filter(Boolean)
    .filter((item) => !/^(once|later|some|one|another|the|this|that|in)$/i.test(item))[0]
    || context.normalizedInput.topic;
}

function selectEntityFromRecords(records, fallback) {
  return records
    .flatMap((record) => record.entities || [])
    .map(safeTerm)
    .filter(Boolean)[0]
    || safeTerm(fallback)
    || 'The central subject';
}

function actionStateFromFactRecord(record, subject) {
  const text = stripFinalPunctuation(safeTerm(record.factText));
  if (!text) return 'held as the central visual subject';
  if (record.factType === 'subject') return 'held as the central visual subject';
  if (record.factType === 'relationship') return `shown through ${lowercaseStart(text)}`;
  if (record.factType === 'setting') return `placed within ${lowercaseStart(text)}`;
  if (record.factType === 'variant') return `associated with a variant where ${lowercaseStart(text)}`;
  if (record.factType === 'source-context') return `shown through source material connected to ${lowercaseStart(text)}`;
  if (record.factType === 'meaning') return `framed by the interpretation that ${lowercaseStart(text)}`;
  return `connected to ${lowercaseStart(truncateWords(text, 22))}`;
}

function selectSupportingObjects(record, context) {
  return uniqueText([
    ...(record.visualTerms || []),
    ...(context.productionProfile.allowedObjects || []),
    ...(record.settingTerms || [])
  ])
    .map(stripFinalPunctuation)
    .filter((item) => !/[,.]$/.test(item))
    .filter((item) => !/^(once|later|some|one|another|the|this|that|appeared)$/i.test(item))
    .filter((item) => exactTextKey(item) !== exactTextKey(record.factText))
    .slice(0, 4);
}

function selectCulturalContext(context, record) {
  return uniqueText([
    ...(record.settingTerms || []),
    ...(context.productionProfile.culturalContext || []),
    context.productionProfile.profileType
  ]).slice(0, 4);
}

function noteCautionForFact(record, context) {
  const text = stripFinalPunctuation(realizeVisualFact(record, context));
  if (record.factType === 'variant') return `Present ${lowercaseStart(text)} as a version detail, not as the only fixed form.`;
  if (record.factType === 'source-context') return `Keep ${lowercaseStart(text)} source-limited, without turning it into a stronger claim.`;
  if (record.factType === 'meaning') return `Use ${lowercaseStart(text)} as interpretation, not as a new event.`;
  if (record.factType === 'outcome') return `Let ${lowercaseStart(text)} define the result for this Part.`;
  return `Do not add figures, motives, or incidents beyond ${lowercaseStart(text)}.`;
}

function isProductionFactRecord(record) {
  if (!record || !record.id || !record.factText) return false;
  const validation = validateCreatorFactRecord(record);
  if (!validation.valid) return false;
  const text = safeTerm(record.factText);
  if (isInternalInstruction(text) || isIncompleteFactFragment(text)) return false;
  if (containsInternalProductionMetadata(text)) return false;
  if (detectBrokenProductionText(text).length) return false;
  if (/^(?:later versions|source comparison|public source note|category title)$/i.test(text)) return false;
  return text.length >= 8;
}

function sortProductionRecords(records, preferredTypes) {
  const typeRank = new Map((preferredTypes || []).map((type, index) => [type, preferredTypes.length - index]));
  return [...records].sort((a, b) => {
    const typeScore = (typeRank.get(b.factType) || 0) - (typeRank.get(a.factType) || 0);
    if (typeScore) return typeScore;
    const visualScore = Number(Boolean(b.visualTerms?.length)) - Number(Boolean(a.visualTerms?.length));
    if (visualScore) return visualScore;
    return Number(a.sourcePriority || 0) - Number(b.sourcePriority || 0);
  });
}

function uniqueRecords(records) {
  const seen = new Set();
  const output = [];
  for (const record of records || []) {
    const key = record?.id || exactTextKey(record?.factText);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(record);
  }
  return output;
}

function recordsForIds(ids, factById) {
  return (ids || []).map((id) => factById.get(id)).filter(Boolean).filter(isProductionFactRecord);
}

function buildBackgroundMusicForScene(context) {
  const { scene, productionProfile } = context;
  const role = sceneRoleText(scene);
  const core = productionProfile.musicCore;
  const lead = /defining|familiar|identity|initial|what, when|hook|claim/.test(role)
    ? 'quiet opening pulse'
    : /turning|core|incident|event|abilities|sequence/.test(role)
      ? 'steady low tension'
      : /variant|source|evidence|account|comparison|record/.test(role)
        ? 'sparse documentary bed'
        : 'soft reflective drone';
  const density = /closing|meaning|legacy|unresolved|outcome/.test(role)
    ? 'low density with a soft ending'
    : 'slow tempo with restrained weight';
  return sanitizeProductionText(uniqueText([lead, ...core, density]).slice(0, 5).join(', '));
}

function buildVoiceDirectionForScene(context) {
  const narration = (context.longformScene.narrationParts || []).map((part) => part.narration).join(' ');
  const emphasis = selectEmphasisTerm(context, narration);
  const role = sceneRoleText(context.scene);
  const pace = /source|variant|evidence|account|comparison/.test(role)
    ? 'careful pace'
    : /closing|meaning|legacy|unresolved|outcome/.test(role)
      ? 'slow pace with a soft ending'
      : 'calm documentary pace';
  const tension = /turning|incident|problem|consequence|core/.test(role) ? 'slight tension' : 'natural restraint';
  const emphasisText = emphasis ? `, with light emphasis on "${emphasis}" when it appears` : '';
  return sanitizeProductionText(`${capitalize(pace)}, short pauses between ideas, ${tension}${emphasisText}.`);
}

function buildSoundEffectForScene(context) {
  const { normalizedInput, scene, productionProfile } = context;
  const text = [
    normalizedInput.topic,
    ...(normalizedInput.setting || []),
    ...(scene.sourceFacts || []),
    ...(scene.requiredEvents || []),
    ...(scene.requiredEntities || []),
    ...(normalizedInput.visualVocabulary || [])
  ].join(' ').toLowerCase();
  const terms = soundTermsFromText(text, normalizedInput.contentType, productionProfile);
  return sanitizeProductionText(uniqueText(terms).slice(0, 3).join(', '));
}

function buildProductionProfile(normalizedInput) {
  const typeProfile = CONTENT_TYPE_PROFILES[normalizedInput.contentType] || CONTENT_TYPE_PROFILES['place-event-mystery'];
  const forbidden = uniqueText([...(normalizedInput.forbiddenInventions || [])].map(safeTerm).filter(Boolean));
  const profile = {
    profileType: typeProfile.profileType,
    culturalContext: uniqueText([
      normalizedInput.categoryName,
      ...(normalizedInput.setting || []),
      ...(normalizedInput.sourceContext || [])
    ].map(safeTerm).filter(Boolean)).slice(0, 6),
    allowedEntities: uniqueText([
      normalizedInput.topic,
      ...(normalizedInput.knownNames || []),
      ...(normalizedInput.keyActors || [])
    ].map(safeTerm).filter(Boolean)).slice(0, 10),
    allowedSettings: uniqueText([
      ...(normalizedInput.setting || []),
      ...(normalizedInput.sourceContext || []),
      normalizedInput.categoryName,
      'quiet archival setting'
    ].map(safeTerm).filter(Boolean)).slice(0, 8),
    allowedObjects: uniqueText([
      ...(normalizedInput.visualVocabulary || []),
      ...(normalizedInput.coreProblem || []),
      ...(normalizedInput.eventSequence || [])
    ].map(extractVisualObject).filter(Boolean)).slice(0, 10),
    allowedAtmosphere: uniqueText(typeProfile.atmosphere).slice(0, 6),
    forbiddenEntities: forbidden.filter((item) => /person|god|figure|entity|character|name/i.test(item)).slice(0, 6),
    forbiddenSettings: forbidden.filter((item) => /place|setting|city|room|office|road|temple|world/i.test(item)).slice(0, 6),
    forbiddenObjects: forbidden.filter((item) => !/person|god|figure|entity|character|name|place|setting|city|room|office|road|temple|world/i.test(item)).slice(0, 8),
    musicCore: typeProfile.musicCore,
    visualTone: typeProfile.visualTone
  };
  validateProductionProfile(profile);
  return profile;
}

function validateProductionProfile(profile) {
  const errors = [];
  if (!profile || typeof profile !== 'object') return ['Production Profile must be an object.'];
  for (const field of [
    'profileType',
    'culturalContext',
    'allowedEntities',
    'allowedSettings',
    'allowedObjects',
    'allowedAtmosphere',
    'forbiddenEntities',
    'forbiddenSettings',
    'forbiddenObjects'
  ]) {
    if (field === 'profileType') {
      if (!sanitizeProductionText(profile[field])) errors.push('profileType is required.');
    } else if (!Array.isArray(profile[field])) {
      errors.push(`${field} must be an array.`);
    }
  }
  if (!profile.allowedEntities?.length) errors.push('allowedEntities must not be empty.');
  if (!profile.allowedSettings?.length) errors.push('allowedSettings must not be empty.');
  if (!profile.allowedAtmosphere?.length) errors.push('allowedAtmosphere must not be empty.');
  return errors;
}

function sanitizeProductionText(value) {
  return sanitizeCreatorInputText(value)
    .replace(/\bsource-aware\b/gi, 'source-limited')
    .replace(/\bis a pre-existing [a-z\s-]+ built\b/gi, 'is preserved')
    .replace(/\bviewer should\b/gi, 'the image should')
    .replace(/\baround\s+and\b/gi, 'around the main detail and')
    .replace(/\bcenters(?:\s+on)?\s+and\b/gi, 'centers on the main detail and')
    .replace(/\bsome\s+a\b/gi, 'some describe a')
    .replace(/,+\s*,+/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSceneFocusForScene(context) {
  const fact = selectPublicFact(
    context.scene.requiredEvents,
    context.scene.requiredEntities,
    context.scene.sourceFacts,
    context.normalizedInput.coreProblem,
    context.normalizedInput.topic
  );
  return sanitizeProductionText(`The central visual should show ${lowercaseStart(stripFinalPunctuation(fact))}.`);
}

function noteCautionForPart(context, narration) {
  const text = String(narration || '').toLowerCase();
  if (/variant|version|retelling|account|tradition|later/.test(text)) return 'Treat variant details as separate layers, not as one fixed version.';
  if (/source|record|evidence|trace|reported|uncertain/.test(text)) return 'Do not make the source claim stronger than the current material allows.';
  if (/meaning|symbol|legacy|remembered|persists|unresolved/.test(text)) return 'Stay with the meaning already named here instead of adding a new answer.';
  return 'Avoid adding outside incidents, motives, or extra figures not named in this part.';
}

function selectBestFact(...groups) {
  return groups.flat()
    .map(safeTerm)
    .filter(Boolean)
    .find((item) => item.length >= 12)
    || groups.flat().map(safeTerm).filter(Boolean)[0]
    || 'the confirmed story material';
}

function selectPublicFact(...groups) {
  return groups.flat()
    .map(safeTerm)
    .filter(Boolean)
    .filter((item) => !containsInternalProductionMetadata(item))
    .find((item) => item.length >= 12)
    || groups.flat().map(safeTerm).filter(Boolean).find((item) => !containsInternalProductionMetadata(item))
    || 'the central subject';
}

function selectBeatSubject(context, visualFacts, beatIndex) {
  const entities = [
    ...(context.scene.requiredEntities || []),
    ...(context.productionProfile.allowedEntities || []),
    ...(context.productionProfile.allowedObjects || [])
  ].map(safeTerm).filter(Boolean);
  return entities[beatIndex % Math.max(1, entities.length)] || visualFacts[beatIndex] || context.normalizedInput.topic;
}

function actionStateFromFact(fact, fallbackSubject) {
  const clean = safeTerm(fact);
  if (!clean || containsInternalProductionMetadata(clean)) return `present as ${lowercaseStart(fallbackSubject)}`;
  const short = truncateWords(clean, 18).replace(/[.!?]+$/, '');
  return `connected to ${lowercaseStart(short)}`;
}

function selectSetting(profile, scene, fact) {
  const facts = [fact, ...(scene.sourceFacts || [])].join(' ').toLowerCase();
  const settings = profile.allowedSettings || [];
  const direct = settings.find((setting) => tokenOverlap(setting, facts) > 0);
  return direct || settings[0] || profile.culturalContext[0] || 'a restrained documentary setting';
}

function compositionForBeat(scene, partPlan, beatIndex) {
  const role = sceneRoleText(scene);
  const isDevelopingPart = Number(partPlan.partIndex || 1) > 1;
  if (/source|variant|evidence|account|comparison|trace/.test(role)) {
    if (isDevelopingPart) return beatIndex === 0 ? 'a medium frame that separates the main subject from supporting evidence' : 'a close archival detail with the source boundary visible';
    return beatIndex === 0 ? 'a clear tabletop or archival composition' : 'a medium frame that separates the main subject from supporting evidence';
  }
  if (/closing|meaning|legacy|unresolved|outcome/.test(role)) {
    if (isDevelopingPart) return beatIndex === 0 ? 'a close detail that leaves the ending open' : 'a wider reflective frame that keeps the ending unresolved';
    return beatIndex === 0 ? 'a wide reflective composition with negative space' : 'a close detail that leaves the ending open';
  }
  if (isDevelopingPart && beatIndex === 0) return 'a medium composition that shows the consequence or second idea clearly';
  if (beatIndex === 0) return 'a wide establishing composition with the main subject easy to identify';
  if (beatIndex === 1) return 'a medium composition that shows the important action or state';
  return 'a close visual detail that supports the current narration';
}

function lightingForScene(scene, profile) {
  const role = sceneRoleText(scene);
  if (/source|variant|evidence|account|comparison|trace/.test(role)) return 'soft archival light';
  if (/turning|incident|problem|consequence|core/.test(role)) return 'low directional light with restrained contrast';
  if (/closing|meaning|legacy|unresolved|outcome/.test(role)) return 'subdued fading light';
  if (/internet|digital/.test(profile.profileType)) return 'dim screen-adjacent light';
  return 'natural low light';
}

function selectAtmosphere(profile, scene) {
  const role = sceneRoleText(scene);
  if (/source|variant|evidence|account|comparison|trace/.test(role)) return 'careful documentary restraint';
  if (/closing|meaning|legacy|unresolved|outcome/.test(role)) return 'quiet reflective tension';
  return profile.allowedAtmosphere[0] || 'restrained mystery atmosphere';
}

function visualPhaseForBeat(partPlan, beatIndex) {
  const passage = Number(partPlan.partIndex || 1) === 1 ? 'an opening visual' : 'a follow-up visual';
  if (beatIndex === 0) return `${passage} with one clear focal point`;
  if (beatIndex === 1) return `${passage} that adds a second visual detail`;
  return `${passage} that widens the frame without adding new story elements`;
}

function motionPhaseForBeat(partPlan, beatIndex) {
  const passage = Number(partPlan.partIndex || 1) === 1 ? 'opening' : 'follow-up';
  if (beatIndex === 0) return `${passage} anchor`;
  if (beatIndex === 1) return `${passage} detail`;
  return `${passage} wider frame`;
}

function sequenceLabelForScene(sceneIndex) {
  const labels = ['first sequence', 'second sequence', 'middle sequence', 'fourth sequence', 'final sequence'];
  return labels[Math.max(0, Math.min(labels.length - 1, Number(sceneIndex || 1) - 1))];
}

function selectMotionTarget(...values) {
  return values
    .map(safeTerm)
    .filter(Boolean)
    .find((value) => !containsFieldMixing(value, ['sound effect', 'music', 'voice direction', 'narration']))
    || values.map(safeTerm).filter(Boolean)[0]
    || 'the central subject';
}

function exclusionsForProfile(profile) {
  if (/internet|digital/.test(profile.profileType)) {
    return 'No gore, logos, watermarks, unrelated fantasy elements, or readable fake interface text.';
  }
  return 'No gore, readable text, logos, watermarks, or modern objects.';
}

function selectEmphasisTerm(context, narration) {
  const candidates = [
    context.normalizedInput.topic,
    ...(context.scene.requiredEntities || []),
    ...(context.productionProfile.allowedEntities || [])
  ].map(safeTerm).filter(Boolean);
  const lowerNarration = String(narration || '').toLowerCase();
  return candidates
    .map((candidate) => candidate.split(/\s+/).filter((word) => word.length > 3).join(' '))
    .filter(Boolean)
    .find((candidate) => lowerNarration.includes(candidate.toLowerCase()))
    || '';
}

function assertVoiceEmphasisMatches(voiceDirection, narration) {
  const errors = [];
  const lowerNarration = String(narration || '').toLowerCase();
  const matches = String(voiceDirection || '').matchAll(/emphasis on "([^"]+)"/gi);
  for (const match of matches) {
    if (!lowerNarration.includes(match[1].toLowerCase())) {
      errors.push(`Voice emphasis term is not present in Narration: ${match[1]}`);
    }
  }
  return errors;
}

function soundTermsFromText(text, contentType, profile) {
  const isDigital = contentType === 'internet-folklore';
  if (isDigital && /code|cipher|online|internet|message|screen|digital|puzzle|clue|website|forum|image/.test(text)) {
    return /paper|poster|printed|physical|location|book|record/.test(text)
      ? ['paper handling', 'quiet keyboard input', 'low room tone']
      : ['quiet keyboard input', 'subtle screen interaction', 'low electronic room tone'];
  }
  if (/sea|ocean|island|river|lake|water|shore|nile/.test(text)) return ['low water ambience', 'distant wind', 'soft shoreline movement'];
  if (/field|grain|meadow|harvest|grass|crop|earth/.test(text)) return ['field wind', 'dry grass movement', 'soft footstep texture'];
  if (/underworld|cave|stone|tomb|chamber|temple|palace|mountain/.test(text)) return ['stone room ambience', 'distant wind', 'low interior resonance'];
  if (/forest|tree|road|trail|village|hill/.test(text)) return ['outdoor wind', 'distant footsteps', 'quiet natural ambience'];
  if (/fire|sun|sky|storm|thunder|light/.test(text)) return ['high wind', 'soft heat shimmer', 'distant low rumble'];
  if (/letter|book|manuscript|source|record|evidence|account|text|archive|map|document/.test(text)) return ['paper handling', 'quiet archive room tone', 'soft page movement'];
  if (/urban|modern|house|apartment|street|car|train|station/.test(text)) return ['distant street ambience', 'soft room tone', 'muted footsteps'];
  return [`quiet ${profile.profileType} ambience`, 'distant wind', 'soft environmental tone'];
}

function usesUnrelatedOfficeSound(soundEffect, contentType) {
  if (contentType === 'internet-folklore') return false;
  return /keyboard|printer|modem|computer fan|fluorescent|office ventilation|screen interaction|electronic pulse/i.test(String(soundEffect || ''));
}

function containsFieldMixing(value, words) {
  const text = String(value || '').toLowerCase();
  return words.some((word) => text.includes(word.toLowerCase()));
}

function containsBrokenPromptText(value) {
  return /(?:centers and|around and|some\s+a\b|avoid no|restrained restrained|\b(?:and|of|to|with)\s*[.!?]?$)/i.test(String(value || ''));
}

function containsBrokenMotionText(value) {
  return /(?:slow slow|restrained restrained|focuses on the story|keep the subject readable|viewer should|appears clearly in the frame)/i.test(String(value || ''));
}

function containsInternalProductionMetadata(value) {
  return INTERNAL_METADATA_PATTERNS.some((pattern) => pattern.test(String(value || '')));
}

function detectBrokenProductionText(value) {
  const text = String(value || '');
  const patterns = [
    /^\s*works because\b/i,
    /\bbegins with works because\b/i,
    /\bcentered on works because\b/i,
    /\bA ancient\b/i,
    /\bbecomes of\b/i,
    /\bconnected to its strongest image\b/i,
    /,,|\.\./,
    /\band\s+and\b/i,
    /\bof\s+of\b/i,
    /\bthe\s+the\b/i,
    /\b(?:and|of|to|with|because)\s*[.!?]?$/i,
    /\bcenters and\b/i,
    /\baround and\b/i,
    /\bsome\s+a\b/i,
    /\bavoid no\b/i,
    /\brestrained restrained\b/i
  ];
  return patterns.filter((pattern) => pattern.test(text)).map((pattern) => pattern.toString());
}

function detectGenericProductionText(value) {
  const patterns = [
    /needs this part to preserve/i,
    /keep the visual work centered/i,
    /confirmed story material/i,
    /treat variant details as separate layers/i,
    /avoid adding outside incidents/i,
    /give the audience one clear idea/i,
    /keep this simple/i,
    /use this part as a transition/i,
    /the viewer should recognize/i,
    /this section works best when/i,
    /keep the movement quiet/i,
    /let the final movement settle softly/i,
    /keep the subject readable/i,
    /appears clearly in the frame/i
  ];
  return patterns.filter((pattern) => pattern.test(String(value || ''))).map((pattern) => pattern.toString());
}

function detectProductionFactLeak(value) {
  const text = String(value || '');
  const patterns = [
    /\bfact-\d{3,}\b/i,
    /\bsourceFieldRefs?\b/i,
    /\btargetWords\b/i,
    /\brawText\b/i,
    /\bpurpose\s*:/i,
    /\brole\s*:/i
  ];
  return patterns.filter((pattern) => pattern.test(text)).map((pattern) => pattern.toString());
}

function detectDuplicateProductionFields(result) {
  const fields = {
    creatorNote: [],
    sceneFocus: [],
    imagePrompt: [],
    beatMotion: []
  };
  (result?.scenes || []).forEach((scene) => {
    fields.sceneFocus.push(scene.sceneFocus);
    (scene.narrationParts || []).forEach((part) => {
      fields.creatorNote.push(part.creatorNote);
      (part.visualBeats || []).forEach((beat) => {
        fields.imagePrompt.push(beat.imagePrompt);
        fields.beatMotion.push(beat.beatMotion);
      });
    });
  });
  return Object.fromEntries(Object.entries(fields).map(([field, values]) => [field, duplicateValues(values)]));
}

function publicSceneContextFromScene(scene, factById = new Map()) {
  const factRecords = recordsForIds(scene.sourceFactIds, factById);
  return {
    sceneIndex: scene.sceneIndex,
    sceneRoleCode: roleCodeFromRole(scene.role),
    sourceFactIds: [...(scene.sourceFactIds || [])],
    factRecords,
    sourceFacts: factRecords.map((record) => record.factText),
    sourceFieldRefs: [...(scene.sourceFieldRefs || [])],
    requiredEntities: uniqueText([...(scene.requiredEntities || []), ...factRecords.flatMap((record) => record.entities || [])]),
    requiredEvents: uniqueText([...factRecords.filter((record) => ['event', 'turning-point', 'outcome', 'problem'].includes(record.factType)).map((record) => record.factText), ...(scene.requiredEvents || [])]),
    variantGuidance: [...(scene.variantGuidance || [])],
    sourceGuidance: [...(scene.sourceGuidance || [])],
    meaningGuidance: [...(scene.meaningGuidance || [])]
  };
}

function publicPartContextFromPlan(partPlan, factById = new Map()) {
  const factRecords = recordsForIds(partPlan.sourceFactIds, factById);
  return {
    partIndex: partPlan.partIndex,
    sourceFactIds: [...(partPlan.sourceFactIds || [])],
    factRecords,
    sourceFacts: factRecords.map((record) => record.factText),
    sourceFieldRefs: [...(partPlan.sourceFieldRefs || [])],
    targetWords: partPlan.targetWords
  };
}

function sceneRoleText(scene) {
  return String(scene?.sceneRoleCode || '').toLowerCase();
}

function roleCodeFromRole(role) {
  return String(role || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isGenericCreatorNote(value) {
  return /^(hold that image|keep this simple|give the audience one clear idea|the viewer should recognize|use this part as a transition|make the distinction clear|this section works best when)/i.test(String(value || '').trim());
}

function detailError(result, sceneIndex, partIndex, beatIndex, field, error) {
  return {
    code: 'CREATOR_PRODUCTION_INVALID',
    slug: result?.slug || '',
    sceneIndex,
    partIndex,
    beatIndex,
    field,
    error
  };
}

function safeTerm(value) {
  return sanitizeProductionText(value)
    .replace(/\s+/g, ' ')
    .trim();
}

function safePromptValue(value) {
  const text = safeTerm(value)
    .replace(/[.!?]+$/g, '')
    .replace(/[,\s]+$/g, '')
    .replace(/[;:]+$/g, '')
    .replace(/\b(?:scene|subject|article)\b/gi, '')
    .replace(/\baround\s+and\b/gi, 'around the main detail')
    .replace(/\bcenters(?:\s+on)?\s+and\b/gi, 'centers on the main detail and')
    .replace(/\bsome\s+a\b/gi, 'one')
    .replace(/\b(?:and|or|with|to|of)\s*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text || /^(and|or|with|to|of|in|on|as)$/i.test(text)) return 'the central subject';
  return text;
}

function safeMotionValue(value, fallback = 'the central visual detail') {
  const text = safePromptValue(value);
  if (!text || containsFieldMixing(text, ['sound effect', 'music', 'voice direction', 'narration'])) {
    return safePromptValue(fallback) || 'the central visual detail';
  }
  return text;
}

function stripFinalPunctuation(value) {
  return safeTerm(value).replace(/[.!?]+$/g, '').trim();
}

function articleFor(value) {
  return /^[aeiou]/i.test(String(value || '').trim()) ? 'An' : 'A';
}

function extractVisualObject(value) {
  const text = safeTerm(value);
  if (!text) return '';
  return truncateWords(text.replace(/^(the|a|an)\s+/i, ''), 10);
}

function lowercaseStart(value) {
  const text = safeTerm(value);
  return text ? `${text.charAt(0).toLowerCase()}${text.slice(1)}` : '';
}

function capitalize(value) {
  const text = String(value || '').trim();
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : '';
}

function truncateWords(value, count) {
  return String(value || '').split(/\s+/).filter(Boolean).slice(0, count).join(' ');
}

function exactTextKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function hasExactDuplicate(values) {
  const seen = new Set();
  for (const value of values.map(exactTextKey).filter(Boolean)) {
    if (seen.has(value)) return true;
    seen.add(value);
  }
  return false;
}

function duplicateValues(values) {
  const counts = new Map();
  for (const value of values || []) {
    const key = exactTextKey(value);
    if (!key) continue;
    counts.set(key, { value, count: (counts.get(key)?.count || 0) + 1 });
  }
  return [...counts.values()].filter((item) => item.count > 1);
}

function uniqueText(values) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    const text = safeTerm(value);
    const key = exactTextKey(text);
    if (!text || seen.has(key)) continue;
    seen.add(key);
    output.push(text);
  }
  return output;
}

function tokenOverlap(value, text) {
  const target = new Set(String(text || '').toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 3));
  return String(value || '').toLowerCase().split(/[^a-z0-9]+/).filter((word) => target.has(word)).length;
}

module.exports = {
  buildCreatorProductionFields,
  validateCreatorProductionFields,
  buildCreatorNoteForPart,
  buildSceneFocusForScene,
  buildVisualBeatsForPart,
  buildVisualBeatPlan,
  buildImagePromptForBeat,
  buildBeatMotionForBeat,
  selectVisualFactRecords,
  realizeVisualFact,
  buildBackgroundMusicForScene,
  buildVoiceDirectionForScene,
  buildSoundEffectForScene,
  buildProductionProfile,
  validateProductionProfile,
  sanitizeProductionText,
  containsInternalProductionMetadata,
  detectBrokenProductionText,
  detectGenericProductionText,
  detectInternalProductionMetadata: containsInternalProductionMetadata,
  detectProductionFactLeak,
  detectDuplicateProductionFields
};
