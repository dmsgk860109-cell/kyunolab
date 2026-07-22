const {
  sanitizeCreatorInputText
} = require('./creator-library-input');
const {
  estimateNarrationReadTime
} = require('./creator-library-longform');

const PRODUCTION_SCHEMA_VERSION = '1.0';
const SCENE_COUNT = 5;
const PARTS_PER_SCENE = 2;

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
  const warnings = [
    ...(normalizedInput.warnings || []),
    ...(scenePlan.warnings || [])
  ];
  const scenes = (scenePlan.scenes || []).map((scene, sceneIndex) => {
    const longformScene = (longformResult.scenes || [])[sceneIndex] || {};
    const sceneContext = {
      normalizedInput,
      scene,
      longformScene,
      productionProfile
    };
    return {
      sceneIndex: scene.sceneIndex,
      role: scene.role,
      sceneFocus: buildSceneFocusForScene(sceneContext),
      backgroundMusic: buildBackgroundMusicForScene(sceneContext),
      voiceDirection: buildVoiceDirectionForScene(sceneContext),
      soundEffect: buildSoundEffectForScene(sceneContext),
      narrationParts: (scene.narrationParts || []).map((partPlan, partIndex) => {
        const narrationPart = (longformScene.narrationParts || [])[partIndex] || {};
        const partContext = {
          ...sceneContext,
          partPlan,
          narrationPart
        };
        return {
          partIndex: partPlan.partIndex,
          creatorNote: buildCreatorNoteForPart(partContext),
          visualBeats: buildVisualBeatsForPart(partContext)
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
        if (!Array.isArray(beat.sourceFieldRefs)) errors.push(detailError(result, sceneNumber, partNumber, beatNumber, 'sourceFieldRefs', 'sourceFieldRefs must be an array.'));
        if (containsBrokenPromptText(beat.imagePrompt)) errors.push(detailError(result, sceneNumber, partNumber, beatNumber, 'imagePrompt', 'Image Prompt contains broken text.'));
        if (containsFieldMixing(beat.imagePrompt, ['sound effect', 'voice direction', 'beat motion', 'motion prompt'])) {
          errors.push(detailError(result, sceneNumber, partNumber, beatNumber, 'imagePrompt', 'Image Prompt contains another production field.'));
        }
        if (containsBrokenMotionText(beat.beatMotion)) errors.push(detailError(result, sceneNumber, partNumber, beatNumber, 'beatMotion', 'Beat Motion contains broken text.'));
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
  const { normalizedInput, scene, partPlan, narrationPart } = context;
  const topic = safeTerm(normalizedInput.topic);
  const purpose = safeTerm(partPlan.purpose || scene.purpose);
  const fact = selectBestFact(partPlan.sourceFacts, scene.sourceFacts, normalizedInput.coreProblem);
  const guidance = [
    ...(scene.variantGuidance || []),
    ...(scene.sourceGuidance || []),
    ...(scene.meaningGuidance || [])
  ].map(safeTerm).filter(Boolean)[0];
  const caution = noteCautionForPart(context, narrationPart.narration);
  const lines = [
    `${topic} needs this part to preserve ${purpose.toLowerCase()} through the fact that ${lowercaseStart(fact)}.`,
    guidance ? `Keep the source layer close: ${lowercaseStart(guidance)}.` : caution,
    guidance ? caution : ''
  ].filter(Boolean);
  return sanitizeProductionText(lines.slice(0, 3).join(' '));
}

function buildVisualBeatsForPart(context) {
  const readSeconds = Number(context.narrationPart?.estimatedReadSeconds || estimateNarrationReadTime(context.narrationPart?.narration || ''));
  const visualFacts = uniqueText([
    ...(context.partPlan.sourceFacts || []),
    ...(context.scene.requiredEvents || []),
    ...(context.scene.requiredEntities || [])
  ].map(safeTerm).filter(Boolean));
  const count = Math.min(3, Math.max(1, readSeconds >= 30 || visualFacts.length >= 3 ? 3 : readSeconds >= 20 || visualFacts.length >= 2 ? 2 : 1));
  return Array.from({ length: count }, (_, beatIndex) => {
    const beatContext = {
      ...context,
      beatIndex,
      beatSubject: selectBeatSubject(context, visualFacts, beatIndex),
      beatFact: visualFacts[beatIndex] || visualFacts[0] || selectBestFact(context.partPlan.sourceFacts, context.scene.sourceFacts, [context.normalizedInput.topic])
    };
    const imagePrompt = buildImagePromptForBeat(beatContext);
    return {
      beatIndex: beatIndex + 1,
      imagePrompt,
      beatMotion: buildBeatMotionForBeat({ ...beatContext, imagePrompt }),
      sourceFieldRefs: context.partPlan.sourceFieldRefs || context.scene.sourceFieldRefs || []
    };
  });
}

function buildImagePromptForBeat(context) {
  const { normalizedInput, productionProfile, scene, partPlan, beatIndex, beatSubject, beatFact } = context;
  const subject = safePromptValue(beatSubject || normalizedInput.topic);
  const actionOrState = safePromptValue(actionStateFromFact(beatFact, scene.role));
  const setting = safePromptValue(selectSetting(productionProfile, scene, beatFact));
  const composition = compositionForBeat(scene, partPlan, beatIndex);
  const lighting = lightingForScene(scene, productionProfile);
  const atmosphere = safePromptValue(selectAtmosphere(productionProfile, scene));
  const culture = safePromptValue(productionProfile.culturalContext[0] || normalizedInput.categoryName || productionProfile.profileType);
  const purpose = safePromptValue(partPlan.purpose || scene.purpose);
  const exclusions = exclusionsForProfile(productionProfile);
  return sanitizeProductionText([
    `A ${productionProfile.visualTone} image shows ${subject} ${actionOrState} in ${setting}.`,
    `Frame it as ${composition}, emphasizing ${purpose}, with ${lighting}, ${atmosphere}, and cultural context from ${culture}.`,
    exclusions
  ].filter(Boolean).join(' '));
}

function buildBeatMotionForBeat(context) {
  const { scene, partPlan, beatIndex, beatSubject, beatFact, productionProfile } = context;
  const subject = safePromptValue(beatSubject || context.normalizedInput.topic);
  const visualTarget = safePromptValue(truncateWords([partPlan.purpose, beatFact].filter(Boolean).join(' '), 14));
  const movements = [
    `Animate the still image with a slow push toward ${subject}, keeping ${visualTarget} as the visual anchor.`,
    `Use a gentle lateral pan across the frame, letting ${visualTarget} guide the shift between foreground and background.`,
    `Begin with a static hold, then make a subtle pullback that reveals ${visualTarget} inside the wider setting.`
  ];
  const movementIndex = (beatIndex + Number(partPlan.partIndex || 1) - 1) % movements.length;
  const ending = /source|variant|evidence|account|trace/i.test(scene.role)
    ? 'Keep the movement quiet so the source material remains careful and non-dramatic.'
    : /meaning|closing|legacy|unresolved/i.test(scene.role)
      ? 'Let the final movement settle softly without adding new action.'
      : `Use only light shifts that match the ${productionProfile.profileType} tone.`;
  return sanitizeProductionText(`${movements[movementIndex]} ${ending}`);
}

function buildBackgroundMusicForScene(context) {
  const { scene, productionProfile } = context;
  const role = String(scene.role || '').toLowerCase();
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
  const role = String(context.scene.role || '').toLowerCase();
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
      ...(normalizedInput.sourceContext || [])
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
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSceneFocusForScene(context) {
  const fact = selectBestFact(context.scene.sourceFacts, context.normalizedInput.coreProblem, [context.scene.purpose]);
  return sanitizeProductionText(`${context.scene.role}: keep the visual work centered on ${lowercaseStart(fact)}.`);
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

function selectBeatSubject(context, visualFacts, beatIndex) {
  const entities = [
    ...(context.scene.requiredEntities || []),
    ...(context.productionProfile.allowedEntities || []),
    ...(context.productionProfile.allowedObjects || [])
  ].map(safeTerm).filter(Boolean);
  return entities[beatIndex % Math.max(1, entities.length)] || visualFacts[beatIndex] || context.normalizedInput.topic;
}

function actionStateFromFact(fact, role) {
  const clean = safeTerm(fact);
  if (!clean) return `connected to ${safeTerm(role).toLowerCase()}`;
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
  const role = String(scene.role || '').toLowerCase();
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
  const role = String(scene.role || '').toLowerCase();
  if (/source|variant|evidence|account|comparison|trace/.test(role)) return 'soft archival light';
  if (/turning|incident|problem|consequence|core/.test(role)) return 'low directional light with restrained contrast';
  if (/closing|meaning|legacy|unresolved|outcome/.test(role)) return 'subdued fading light';
  if (/internet|digital/.test(profile.profileType)) return 'dim screen-adjacent light';
  return 'natural low light';
}

function selectAtmosphere(profile, scene) {
  const role = String(scene.role || '').toLowerCase();
  if (/source|variant|evidence|account|comparison|trace/.test(role)) return 'careful documentary restraint';
  if (/closing|meaning|legacy|unresolved|outcome/.test(role)) return 'quiet reflective tension';
  return profile.allowedAtmosphere[0] || 'restrained mystery atmosphere';
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
    .replace(/[;:]+$/g, '')
    .replace(/\b(scene|part|subject|record|article)\b/gi, '')
    .replace(/\baround\s+and\b/gi, 'around the main detail')
    .replace(/\bsome\s+a\b/gi, 'one')
    .replace(/\b(?:and|or|with|to|of)\s*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text || /^(and|or|with|to|of|in|on|as)$/i.test(text)) return 'the central subject';
  return text;
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
  buildVisualBeatsForPart,
  buildImagePromptForBeat,
  buildBeatMotionForBeat,
  buildBackgroundMusicForScene,
  buildVoiceDirectionForScene,
  buildSoundEffectForScene,
  buildProductionProfile,
  validateProductionProfile,
  sanitizeProductionText
};
