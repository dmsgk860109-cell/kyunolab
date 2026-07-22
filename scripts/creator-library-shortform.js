const {
  sanitizeCreatorInputText
} = require('./creator-library-input');

const SHORTFORM_SCHEMA_VERSION = '1.0';
const SHORTFORM_SCENE_COUNT = 5;
const TARGET_READ_SECONDS = 45;
const MIN_READ_SECONDS = 30;
const MAX_READ_SECONDS = 60;
const MIN_WORDS = 80;
const MAX_WORDS = 140;

const SHORTFORM_RULES = {
  'myth-narrative': [
    rule('Defining Event', ['coreProblem', 'eventSequence', 'knownNames']),
    rule('Core Problem', ['coreProblem', 'keyActors', 'setting']),
    rule('Mythic Turning Point', ['turningPoint', 'eventSequence']),
    rule('Consequence or Variant', ['outcome', 'reportedVariants', 'sourceContext']),
    rule('Outcome and Meaning', ['outcome', 'meaningOptions'])
  ],
  'folklore-legend': [
    rule('Core Claim', ['knownNames', 'coreProblem', 'setting']),
    rule('Common Story', ['eventSequence', 'keyActors']),
    rule('Key Variation', ['reportedVariants', 'eventSequence']),
    rule('Record or Social Context', ['sourceContext', 'sourceEvidence']),
    rule('Continued Meaning', ['outcome', 'meaningOptions'])
  ],
  'mythical-being-object': [
    rule('Identity', ['knownNames', 'visualVocabulary']),
    rule('Defining Trait', ['visualVocabulary', 'coreProblem']),
    rule('Encounter or Function', ['eventSequence', 'keyActors']),
    rule('Variant or Later Change', ['reportedVariants', 'sourceContext']),
    rule('Cultural Meaning', ['outcome', 'meaningOptions'])
  ],
  'urban-modern-legend': [
    rule('Familiar Version', ['knownNames', 'coreProblem', 'eventSequence']),
    rule('Core Incident', ['eventSequence', 'setting']),
    rule('Spread or Variation', ['reportedVariants', 'sourceContext']),
    rule('Evidence or Real-event Claim', ['sourceEvidence', 'sourceContext']),
    rule('Why It Persists', ['outcome', 'meaningOptions'])
  ],
  'internet-folklore': [
    rule('Initial Appearance', ['eventSequence', 'knownNames', 'sourceContext']),
    rule('Core Clue', ['eventSequence', 'visualVocabulary']),
    rule('Spread or Development', ['turningPoint', 'eventSequence', 'reportedVariants']),
    rule('Attribution and Uncertainty', ['sourceEvidence', 'sourceContext', 'reportedVariants']),
    rule('Digital Legacy', ['outcome', 'meaningOptions'])
  ],
  'place-event-mystery': [
    rule('What and Where', ['knownNames', 'setting', 'eventSequence']),
    rule('Core Record', ['eventSequence', 'sourceEvidence']),
    rule('Key Evidence', ['sourceEvidence', 'visualVocabulary']),
    rule('Main Explanations', ['reportedVariants', 'sourceContext', 'meaningOptions']),
    rule('What Remains Unresolved', ['outcome', 'meaningOptions'])
  ],
  'origin-comparison': [
    rule('Familiar Claim', ['coreProblem', 'eventSequence', 'knownNames']),
    rule('Earliest Form', ['sourceEvidence', 'sourceContext']),
    rule('Later Addition', ['reportedVariants', 'eventSequence']),
    rule('Source Difference', ['reportedVariants', 'sourceContext', 'sourceEvidence']),
    rule('What the Comparison Shows', ['outcome', 'meaningOptions'])
  ]
};

const BANNED_SHORTFORM_PATTERNS = [
  /hold that image/i,
  /the viewer should/i,
  /keep this simple/i,
  /the archive record explains/i,
  /a source-aware record/i,
  /source-aware/i,
  /this part needs to feel/i,
  /reveal the mystery/i,
  /build suspense/i,
  /present evidence/i,
  /image prompt/i,
  /motion prompt/i,
  /voice direction/i,
  /sound effect/i,
  /background music/i,
  /creator note/i
];

function buildCreatorShortform(normalizedInput, scenePlan, longformResult, productionResult) {
  const shortScenePlan = buildShortformScenePlan(normalizedInput, scenePlan);
  const scenes = shortScenePlan.scenes.map((shortScene, sceneIndex) => {
    const scene = scenePlan.scenes[sceneIndex] || {};
    const longformScene = longformResult.scenes?.[sceneIndex] || {};
    const productionScene = productionResult.scenes?.[sceneIndex] || {};
    const context = {
      normalizedInput,
      scenePlan,
      longformResult,
      productionResult,
      shortScene,
      scene,
      longformScene,
      productionScene,
      sceneIndex
    };
    const narration = buildShortformNarrationForScene(context);
    const sceneFocus = buildShortformSceneFocus({ ...context, narration });
    const imagePrompt = buildShortformImagePrompt({ ...context, narration, sceneFocus });
    const sceneContext = { ...context, narration, sceneFocus, imagePrompt };
    const wordCount = countWords(narration);
    const estimatedReadSeconds = estimateShortformReadTime(narration);
    return {
      sceneIndex: shortScene.sceneIndex,
      role: shortScene.role,
      narration,
      sceneFocus,
      imagePrompt,
      motionPrompt: buildShortformMotion(sceneContext),
      backgroundMusic: buildShortformBackgroundMusic(sceneContext),
      voiceDirection: buildShortformVoiceDirection(sceneContext),
      soundEffect: buildShortformSoundEffect(sceneContext),
      wordCount,
      estimatedReadSeconds,
      sourceFieldRefs: shortScene.sourceFieldRefs || []
    };
  });
  const totalNarration = scenes.map((scene) => scene.narration).join(' ');
  const totalWordCount = countWords(totalNarration);
  const narrationReadSeconds = estimateShortformReadTime(totalNarration);
  const runtimePlan = buildShortformRuntimePlan({ scenes, totalWordCount, narrationReadSeconds });
  const result = {
    schemaVersion: SHORTFORM_SCHEMA_VERSION,
    inputSchemaVersion: normalizedInput.schemaVersion || SHORTFORM_SCHEMA_VERSION,
    scenePlanSchemaVersion: scenePlan.schemaVersion || SHORTFORM_SCHEMA_VERSION,
    slug: normalizedInput.slug || '',
    topic: normalizedInput.topic || '',
    contentType: normalizedInput.contentType || '',
    targetReadSeconds: TARGET_READ_SECONDS,
    targetFinalVideoSeconds: runtimePlan.finalVideoSeconds,
    scenes,
    totalWordCount,
    narrationReadSeconds,
    finalVideoSeconds: runtimePlan.finalVideoSeconds,
    missingRequiredFields: [],
    warnings: [
      ...(normalizedInput.warnings || []),
      ...(scenePlan.warnings || []),
      ...(productionResult.warnings || [])
    ]
  };
  const validation = validateCreatorShortform(result, normalizedInput, { scenePlan, longformResult, productionResult });
  if (!validation.valid) {
    const error = new Error(`Creator Short-form invalid for ${result.slug}`);
    error.code = 'CREATOR_SHORTFORM_INVALID';
    error.slug = result.slug;
    error.errors = validation.errors;
    throw error;
  }
  return result;
}

function validateCreatorShortform(result, normalizedInput, context = {}) {
  const errors = [];
  if (!result || typeof result !== 'object') errors.push(detailError(result, 0, 'schema', 'Short-form result must be an object.'));
  if (result?.schemaVersion !== SHORTFORM_SCHEMA_VERSION) errors.push(detailError(result, 0, 'schemaVersion', 'schemaVersion must be 1.0.'));
  if (result?.inputSchemaVersion !== '1.0') errors.push(detailError(result, 0, 'inputSchemaVersion', 'inputSchemaVersion must be 1.0.'));
  if (result?.scenePlanSchemaVersion !== '1.0') errors.push(detailError(result, 0, 'scenePlanSchemaVersion', 'scenePlanSchemaVersion must be 1.0.'));
  if (!Array.isArray(result?.scenes) || result.scenes.length !== SHORTFORM_SCENE_COUNT) {
    errors.push(detailError(result, 0, 'scenes', 'Short-form must contain exactly 5 scenes.'));
  }

  const seenIndexes = new Set();
  const narrations = [];
  const focuses = [];
  const imagePrompts = [];
  const motions = [];
  (result?.scenes || []).forEach((scene, index) => {
    const sceneNumber = index + 1;
    if (seenIndexes.has(scene.sceneIndex)) errors.push(detailError(result, sceneNumber, 'sceneIndex', 'Duplicate sceneIndex.'));
    seenIndexes.add(scene.sceneIndex);
    if (scene.sceneIndex !== sceneNumber) errors.push(detailError(result, sceneNumber, 'sceneIndex', 'Scene index is invalid.'));
    for (const field of ['role', 'narration', 'sceneFocus', 'imagePrompt', 'motionPrompt', 'backgroundMusic', 'voiceDirection', 'soundEffect']) {
      if (!sanitizeShortformText(scene[field])) errors.push(detailError(result, sceneNumber, field, `${field} is required.`));
    }
    const imageValidation = validateShortformImagePromptValue(scene.imagePrompt, result, context, sceneNumber);
    imageValidation.forEach((message) => errors.push(detailError(result, sceneNumber, 'imagePrompt', message)));
    const motionValidation = validateShortformMotionPromptValue(scene.motionPrompt, scene.imagePrompt);
    motionValidation.forEach((message) => errors.push(detailError(result, sceneNumber, 'motionPrompt', message)));
    if (!Number.isFinite(scene.wordCount) || scene.wordCount !== countWords(scene.narration)) {
      errors.push(detailError(result, sceneNumber, 'wordCount', 'Scene wordCount must match Narration.'));
    }
    if (!Number.isFinite(scene.estimatedReadSeconds) || scene.estimatedReadSeconds !== estimateShortformReadTime(scene.narration)) {
      errors.push(detailError(result, sceneNumber, 'estimatedReadSeconds', 'Scene estimatedReadSeconds must match Narration.'));
    }
    if (!Array.isArray(scene.sourceFieldRefs)) errors.push(detailError(result, sceneNumber, 'sourceFieldRefs', 'sourceFieldRefs must be an array.'));
    if (detectShortformMetaLanguage(scene.narration).length) {
      errors.push(detailError(result, sceneNumber, 'narration', `Narration contains meta language: ${detectShortformMetaLanguage(scene.narration).join(', ')}`));
    }
    if (isLongformCopy(scene.narration, context.longformResult)) {
      errors.push(detailError(result, sceneNumber, 'narration', 'Narration copies a Long-form sentence too closely.'));
    }
    if (containsFieldMixing(scene.sceneFocus, ['motion prompt', 'background music', 'voice direction', 'sound effect'])) {
      errors.push(detailError(result, sceneNumber, 'sceneFocus', 'Scene Focus contains another production field.'));
    }
    if (containsFieldMixing(scene.imagePrompt, ['motion prompt', 'background music', 'voice direction', 'sound effect', 'creator note'])) {
      errors.push(detailError(result, sceneNumber, 'imagePrompt', 'Image Prompt contains another production field.'));
    }
    if (isGenericFocus(scene.sceneFocus)) errors.push(detailError(result, sceneNumber, 'sceneFocus', 'Scene Focus is too generic.'));
    if (containsFieldMixing(scene.motionPrompt, ['sound effect', 'background music', 'voice direction', 'narration:'])) {
      errors.push(detailError(result, sceneNumber, 'motionPrompt', 'Motion contains another production field.'));
    }
    if (containsFieldMixing(scene.backgroundMusic, ['camera', 'sound effect', 'narration'])) {
      errors.push(detailError(result, sceneNumber, 'backgroundMusic', 'Music contains another production field.'));
    }
    if (containsFieldMixing(scene.voiceDirection, ['camera notes', 'image prompt', 'sound effect'])) {
      errors.push(detailError(result, sceneNumber, 'voiceDirection', 'Voice Direction contains another production field.'));
    }
    if (containsFieldMixing(scene.soundEffect, ['music', 'narration', 'voice'])) {
      errors.push(detailError(result, sceneNumber, 'soundEffect', 'Sound Effect contains another production field.'));
    }
    assertVoiceEmphasisMatches(scene.voiceDirection, scene.narration).forEach((message) => {
      errors.push(detailError(result, sceneNumber, 'voiceDirection', message));
    });
    if (usesUnrelatedDigitalSound(scene.soundEffect, result.contentType)) {
      errors.push(detailError(result, sceneNumber, 'soundEffect', 'Sound uses unrelated digital or office preset.'));
    }
    narrations.push(scene.narration);
    focuses.push(scene.sceneFocus);
    imagePrompts.push(scene.imagePrompt);
    motions.push(scene.motionPrompt);
  });

  if (hasExactDuplicate(narrations)) errors.push(detailError(result, 0, 'narration', 'Duplicate Scene Narration detected.'));
  if (hasExactDuplicate(imagePrompts)) errors.push(detailError(result, 0, 'imagePrompt', 'Duplicate Scene Image Prompt detected.'));
  if (hasExactDuplicate(motions)) errors.push(detailError(result, 0, 'motionPrompt', 'All Motion values must not repeat exactly.'));
  const totalText = (result?.scenes || []).map((scene) => scene.narration).join(' ');
  const totalWordCount = countWords(totalText);
  const narrationReadSeconds = estimateShortformReadTime(totalText);
  if (result?.totalWordCount !== totalWordCount) errors.push(detailError(result, 0, 'totalWordCount', 'totalWordCount must match Narration.'));
  if (totalWordCount < MIN_WORDS || totalWordCount > MAX_WORDS) errors.push(detailError(result, 0, 'totalWordCount', `Word count outside ${MIN_WORDS}-${MAX_WORDS}: ${totalWordCount}`));
  if (result?.narrationReadSeconds !== narrationReadSeconds) errors.push(detailError(result, 0, 'narrationReadSeconds', 'narrationReadSeconds must match Narration.'));
  if (narrationReadSeconds < MIN_READ_SECONDS || narrationReadSeconds > MAX_READ_SECONDS) {
    errors.push(detailError(result, 0, 'narrationReadSeconds', `Narration read time outside ${MIN_READ_SECONDS}-${MAX_READ_SECONDS}: ${narrationReadSeconds}`));
  }
  if (result?.finalVideoSeconds < narrationReadSeconds) errors.push(detailError(result, 0, 'finalVideoSeconds', 'finalVideoSeconds must not be shorter than read time.'));
  if (result?.finalVideoSeconds < 30 || result?.finalVideoSeconds > 60) errors.push(detailError(result, 0, 'finalVideoSeconds', 'finalVideoSeconds must be 30-60 seconds.'));
  assertNoKnownNameLeakage(result, normalizedInput).forEach((message) => errors.push(detailError(result, 0, 'entityLeakage', message)));
  return { valid: errors.length === 0, errors };
}

function shortformRulesForContentType(contentType) {
  return SHORTFORM_RULES[contentType] || [];
}

function buildShortformScenePlan(normalizedInput, scenePlan) {
  const rules = shortformRulesForContentType(normalizedInput.contentType);
  const scenes = rules.map((sceneRule, index) => {
    const longScene = scenePlan.scenes?.[index] || {};
    const sourceFacts = selectFactsForShortScene(normalizedInput, longScene, sceneRule);
    return {
      sceneIndex: index + 1,
      role: sceneRule.role,
      sourceFacts,
      sourceFieldRefs: sourceRefsForFields(normalizedInput, sceneRule.fields, longScene)
    };
  });
  return { scenes };
}

function buildShortformNarrationForScene(context) {
  const topic = sanitizeShortformText(context.normalizedInput.topic);
  const role = context.shortScene.role;
  const fact = compactFact(selectPrimaryFact(context), 10, topic);
  const support = compactFact(selectSupportFact(context), 6, topic);
  const entity = selectEntity(context);
  if (context.sceneIndex === 0) {
    return sanitizeShortformText(`${topic} begins with ${fact}, and that detail gives the short its shape.`);
  }
  if (context.sceneIndex === 1) {
    return sanitizeShortformText(`The problem is ${fact}, tied closely to ${entity}.`);
  }
  if (context.sceneIndex === 2) {
    return sanitizeShortformText(`The turn comes when ${fact}, changing how the account is understood.`);
  }
  if (context.sceneIndex === 3) {
    return sanitizeShortformText(`After that, ${fact}, so versions and sources must stay separate.`);
  }
  return sanitizeShortformText(`It lasts because ${fact}, leaving ${support} as the final idea.`);
}

function buildShortformSceneFocus(context) {
  const subject = selectEntity(context);
  const visual = compactFact(selectVisualAnchor(context), 10, context.normalizedInput.topic);
  const role = context.shortScene.role;
  if (/source|record|evidence|attribution|uncertainty|difference|variation|variant/i.test(role)) {
    return sanitizeShortformText(`${subject} shown through ${visual} as a careful source-bound visual.`);
  }
  if (/meaning|legacy|persists|unresolved|outcome|closing/i.test(role)) {
    return sanitizeShortformText(`${subject} framed through ${visual} as the final remembered idea.`);
  }
  return sanitizeShortformText(`${subject} centered on ${visual} for ${context.shortScene.role}.`);
}

function buildShortformImagePrompt(context) {
  const subject = selectImageSubject(context);
  const visualAnchor = selectPromptVisualAnchor(context);
  const setting = selectPromptSetting(context);
  const composition = compositionForShortScene(context);
  const lighting = lightingForShortScene(context);
  const atmosphere = atmosphereForShortScene(context);
  const culturalContext = culturalContextForShortScene(context);
  const actionOrState = actionForShortScene(context, visualAnchor);
  const focus = cleanPromptVisual(visualAnchor, context.normalizedInput.topic, 7) || visualAnchor;
  const prompt = [
    `A ${visualStyleForContentType(context.normalizedInput.contentType)} scene shows ${subject} ${actionOrState} within ${setting}, framed ${composition}.`,
    `Use ${lighting} and ${atmosphere} within ${culturalContext}; center the frame on ${focus}.`,
    'No readable text, logos, watermarks, modern objects, graphic gore, or cartoon styling.'
  ].join(' ');
  return sanitizeImagePrompt(prompt);
}

function buildShortformMotion(context) {
  const subject = selectImageSubject(context);
  const visual = selectMotionAnchor(context);
  const moves = [
    `Use a slow controlled push toward ${subject}, keeping ${visual} as the central visual anchor.`,
    `Use a restrained lateral pan across ${visual}, then settle quietly on ${subject}.`,
    `Begin with a still frame, then gently pull back to reveal ${visual}.`,
    `Reveal ${visual} from foreground to background with subtle parallax and restrained movement.`,
    `Hold briefly on ${subject}, then let the light shift softly around ${visual}.`
  ];
  return sanitizeShortformText(moves[context.sceneIndex] || moves[0]);
}

function buildShortformBackgroundMusic(context) {
  const profile = context.productionResult.productionProfile || {};
  const role = String(context.shortScene.role || '').toLowerCase();
  const core = Array.isArray(profile.musicCore) ? profile.musicCore.slice(0, 2) : ['low drone', 'sparse documentary bed'];
  const lead = /source|record|evidence|attribution|difference|variant|uncertainty/.test(role)
    ? 'sparse documentary bed'
    : /meaning|legacy|persists|unresolved|outcome/.test(role)
      ? 'soft reflective drone'
      : /turn|incident|problem|clue|core/.test(role)
        ? 'steady low tension'
        : 'quiet opening pulse';
  return sanitizeShortformText(uniqueText([lead, ...core, 'short-form low density']).slice(0, 4).join(', '));
}

function buildShortformVoiceDirection(context) {
  const emphasis = selectEmphasisTerm(context.narration, [
    context.normalizedInput.topic,
    ...context.shortScene.sourceFacts,
    ...(context.normalizedInput.knownNames || [])
  ]);
  const role = String(context.shortScene.role || '').toLowerCase();
  const pace = /source|record|evidence|uncertainty|difference/.test(role)
    ? 'careful pace'
    : /meaning|legacy|unresolved|outcome/.test(role)
      ? 'slow final pace'
      : 'clear short-form pace';
  const emphasisText = emphasis ? `, light emphasis on "${emphasis}"` : '';
  return sanitizeShortformText(`${capitalize(pace)}, clean pauses, restrained tone${emphasisText}.`);
}

function buildShortformSoundEffect(context) {
  const text = [
    context.narration,
    context.sceneFocus,
    ...(context.normalizedInput.setting || []),
    ...(context.normalizedInput.visualVocabulary || [])
  ].join(' ').toLowerCase();
  const terms = soundTermsFromText(text, context.normalizedInput.contentType, context.productionResult.productionProfile || {});
  return sanitizeShortformText(uniqueText(terms).slice(0, 3).join(', '));
}

function validateShortformImagePromptValue(value, result, context, sceneNumber) {
  const errors = [];
  if (Array.isArray(value) || (value && typeof value === 'object')) errors.push('Image Prompt must be one string, not an array or object.');
  const text = sanitizeImagePrompt(value);
  const words = countWords(text);
  if (words < 30 || words > 100) errors.push(`Image Prompt word count outside 30-100: ${words}`);
  if ((text.match(/No readable text/gi) || []).length > 1) errors.push('Image Prompt repeats the exclusion sentence.');
  if ((text.match(/\bgraphic gore\b/gi) || []).length > 1) errors.push('Image Prompt repeats graphic gore exclusion.');
  if (/Image Prompt:|Creator Note:|Motion Prompt:|Sound Effect:|Voice Direction:|Background Music:/i.test(text)) {
    errors.push('Image Prompt includes a production field label.');
  }
  if (/\b(?:avoid no|exclude no|without no)\b/i.test(text)) errors.push('Image Prompt contains contradictory exclusion wording.');
  const longPrompts = (context.productionResult?.scenes || [])
    .flatMap((scene) => scene.narrationParts || [])
    .flatMap((part) => part.visualBeats || [])
    .map((beat) => sanitizeImagePrompt(beat.imagePrompt))
    .filter(Boolean);
  if (longPrompts.some((prompt) => exactTextKey(prompt) === exactTextKey(text))) {
    errors.push('Image Prompt copies a Long-form prompt exactly.');
  }
  const samePackPrompts = (result?.scenes || [])
    .filter((scene) => scene.sceneIndex !== sceneNumber)
    .map((scene) => sanitizeImagePrompt(scene.imagePrompt))
    .filter(Boolean);
  if (samePackPrompts.some((prompt) => exactTextKey(prompt) === exactTextKey(text))) {
    errors.push('Image Prompt duplicates another Short-form scene.');
  }
  return errors;
}

function validateShortformMotionPromptValue(value, imagePrompt) {
  const errors = [];
  const text = sanitizeShortformText(value);
  const image = sanitizeImagePrompt(imagePrompt);
  const words = countWords(text);
  if (words < 10 || words > 35) errors.push(`Motion Prompt word count outside 10-35: ${words}`);
  if (/Image Prompt:|No readable text|logos|watermarks|graphic gore|cartoon styling/i.test(text)) {
    errors.push('Motion Prompt includes Image Prompt labels or exclusions.');
  }
  if (exactTextKey(text) && exactTextKey(text) === exactTextKey(image)) errors.push('Motion Prompt copies the full Image Prompt.');
  if (longestSharedWordRun(text, image) >= 12) errors.push('Motion Prompt copies too much of the Image Prompt.');
  return errors;
}

function estimateShortformReadTime(text) {
  return Math.round(countWords(text) / 2.35);
}

function buildShortformRuntimePlan(result) {
  const readSeconds = Number(result.narrationReadSeconds || estimateShortformReadTime((result.scenes || []).map((scene) => scene.narration).join(' ')));
  const visualBuffer = Math.max(8, Math.min(14, Math.round(readSeconds * 0.25)));
  const finalVideoSeconds = Math.max(30, Math.min(60, readSeconds + visualBuffer));
  return { finalVideoSeconds };
}

function sanitizeShortformText(value) {
  return sanitizeCreatorInputText(value)
    .replace(/\bsource-aware\b/gi, 'source-limited')
    .replace(/\bthe viewer should\b/gi, 'the scene keeps')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectShortformMetaLanguage(value) {
  return BANNED_SHORTFORM_PATTERNS
    .filter((pattern) => pattern.test(String(value || '')))
    .map((pattern) => pattern.toString());
}

function selectFactsForShortScene(normalizedInput, longScene, sceneRule) {
  return uniqueText([
    ...sceneRule.fields.flatMap((field) => normalizedInput[field] || []),
    ...(longScene.sourceFacts || [])
  ].map(sanitizeShortformText).filter(Boolean)).slice(0, 5);
}

function sourceRefsForFields(normalizedInput, fields, longScene) {
  return uniqueText([
    ...fields.flatMap((field) => normalizedInput.sourceFieldMap?.[field] || []),
    ...(longScene.sourceFieldRefs || [])
  ]);
}

function selectPrimaryFact(context) {
  const topic = context.normalizedInput.topic;
  return context.shortScene.sourceFacts.find((fact) => hasUsefulSpecificity(fact, topic))
    || context.scene.sourceFacts?.find((fact) => hasUsefulSpecificity(fact, topic))
    || context.normalizedInput.coreProblem?.[0]
    || context.normalizedInput.eventSequence?.[0]
    || context.normalizedInput.topic;
}

function selectSupportFact(context) {
  const primary = selectPrimaryFact(context);
  const topic = context.normalizedInput.topic;
  return context.shortScene.sourceFacts.find((fact) => fact !== primary && hasUsefulSpecificity(fact, topic))
    || context.normalizedInput.meaningOptions?.[0]
    || context.normalizedInput.outcome?.[0]
    || context.normalizedInput.sourceContext?.[0]
    || context.normalizedInput.topic;
}

function selectVisualAnchor(context) {
  const topic = context.normalizedInput.topic;
  return context.shortScene.sourceFacts.find((item) => hasUsefulSpecificity(item, topic))
    || context.scene.sourceFacts?.find((item) => hasUsefulSpecificity(item, topic))
    || context.normalizedInput.visualVocabulary?.[context.sceneIndex % Math.max(1, context.normalizedInput.visualVocabulary.length)]
    || context.normalizedInput.visualVocabulary?.find((item) => hasUsefulSpecificity(item, topic))
    || context.productionScene.sceneFocus
    || context.normalizedInput.topic;
}

function selectEntity(context) {
  return [
    context.normalizedInput.topic,
    ...(context.scene.requiredEntities || []),
    ...(context.normalizedInput.knownNames || []),
    ...(context.normalizedInput.keyActors || [])
  ].map(sanitizeShortformText).filter(Boolean)[0] || 'the subject';
}

function selectImageSubject(context) {
  const candidates = [
    ...(context.normalizedInput.keyActors || []),
    ...(context.normalizedInput.knownNames || []),
    ...(context.scene.requiredEntities || []),
    context.normalizedInput.topic,
    ...(context.shortScene.sourceFacts || [])
  ];
  return candidates
    .map((value) => cleanPromptSubject(value, context.normalizedInput.topic))
    .find((value) => value && !isGenericPromptTerm(value))
    || cleanPromptSubject(context.normalizedInput.topic, '')
    || 'the central subject';
}

function selectPromptVisualAnchor(context) {
  const visualVocabulary = context.normalizedInput.visualVocabulary || [];
  const candidates = [
    visualVocabulary[context.sceneIndex],
    visualVocabulary[context.sceneIndex + 1],
    visualVocabulary[0],
    context.sceneFocus,
    ...visualVocabulary,
    ...(context.shortScene.sourceFacts || []),
    context.narration
  ];
  return candidates
    .map((value) => cleanPromptVisual(value, context.normalizedInput.topic, 12))
    .find((value) => value && !isGenericPromptTerm(value))
    || 'one clear visual detail';
}

function selectPromptSetting(context) {
  const text = [
    ...(context.normalizedInput.setting || []),
    ...(context.normalizedInput.sourceContext || []),
    context.normalizedInput.categoryTitle,
    context.normalizedInput.contentType
  ].join(' ');
  const cultural = culturalContextForShortScene(context);
  if (context.normalizedInput.contentType === 'myth-narrative' || context.normalizedInput.contentType === 'mythical-being-object') {
    return `${cultural} with restrained historical atmosphere`;
  }
  if (context.normalizedInput.contentType === 'folklore-legend') return `${cultural} shaped by oral tradition`;
  if (/internet|digital|online|website|forum|screen|platform/i.test(text)) return 'a restrained digital or screen-based environment';
  if (/urban|modern|street|apartment|station|office|school|hotel|hospital/i.test(text)) return 'an ordinary modern location with documentary realism';
  if (/archive|record|source|document|ledger|map|book|library/i.test(text)) return 'a quiet archive-like workspace with physical evidence nearby';
  if (/mountain|island|forest|lake|river|sea|desert|valley|road/i.test(text)) return 'a wide natural landscape shaped by the story setting';
  if (/myth|ancient|temple|palace|underworld|ritual|god|goddess/i.test(text)) return `${cultural} with restrained historical atmosphere`;
  return 'a simple readable environment tied to the source material';
}

function actionForShortScene(context, visualAnchor) {
  const role = String(context.shortScene.role || '').toLowerCase();
  const anchor = cleanPromptVisual(visualAnchor, context.normalizedInput.topic, 10) || 'the central detail';
  if (/source|record|evidence|attribution|difference|variant|variation|uncertainty/.test(role)) {
    return `positioned beside ${anchor} as the source detail becomes visible`;
  }
  if (/meaning|legacy|persists|unresolved|outcome|closing/.test(role)) {
    return `held in a quiet final composition around ${anchor}`;
  }
  if (/turn|incident|problem|clue|core|trait|encounter|function/.test(role)) {
    return `caught at the moment when ${anchor} becomes important`;
  }
  return `introduced through ${anchor}`;
}

function compositionForShortScene(context) {
  const options = [
    'as a vertical short-form frame with strong negative space',
    'in a clean medium shot with the key detail near the center',
    'as a close readable detail with the background still visible',
    'with foreground evidence leading toward the main subject',
    'as a restrained final frame that leaves room for narration'
  ];
  return options[context.sceneIndex] || options[0];
}

function lightingForShortScene(context) {
  const role = String(context.shortScene.role || '').toLowerCase();
  if (/meaning|legacy|outcome|closing|unresolved/.test(role)) return 'soft fading light with low contrast';
  if (/source|record|evidence|attribution|difference|variant/.test(role)) return 'soft archival light and controlled shadows';
  if (/turn|incident|problem|clue|core/.test(role)) return 'low directional light with a subtle point of tension';
  return 'natural low light with restrained contrast';
}

function atmosphereForShortScene(context) {
  const contentType = String(context.normalizedInput.contentType || '');
  if (contentType === 'internet-folklore') return 'quiet digital unease';
  if (contentType === 'myth-narrative' || contentType === 'mythical-being-object') return 'ancient mythic tension';
  if (contentType === 'urban-modern-legend') return 'ordinary realism with slight unease';
  if (contentType === 'place-event-mystery') return 'documentary mystery atmosphere';
  return 'calm mystery atmosphere';
}

function culturalContextForShortScene(context) {
  const text = [
    context.normalizedInput.topic,
    ...(context.normalizedInput.setting || []),
    ...(context.normalizedInput.sourceContext || []),
    ...(context.normalizedInput.visualVocabulary || [])
  ].join(' ');
  const match = text.match(/\b(ancient Egyptian|Egyptian|Greek|Norse|Celtic|Japanese|Chinese|Korean|Polynesian|Mesoamerican|Maya|Aztec|Inca|Buddhist|Tibetan|Indian|Roman|Slavic|Irish|Scottish|English|European|American)\b/i);
  if (match) return `${match[1]} cultural context`;
  if (/internet|digital|online|website|forum|screen|platform/i.test(text)) return 'modern internet folklore context';
  if (/urban|modern/i.test(text)) return 'modern folklore context';
  return 'the story culture and source context';
}

function visualStyleForContentType(contentType) {
  if (contentType === 'internet-folklore') return 'realistic digital documentary';
  if (contentType === 'urban-modern-legend') return 'realistic modern documentary';
  if (contentType === 'myth-narrative' || contentType === 'mythical-being-object') return 'cinematic mythic documentary';
  if (contentType === 'place-event-mystery') return 'atmospheric location documentary';
  return 'restrained documentary';
}

function selectMotionAnchor(context) {
  const visualVocabulary = context.normalizedInput.visualVocabulary || [];
  const value = [
    visualVocabulary[context.sceneIndex],
    visualVocabulary[0],
    context.sceneFocus,
    context.narration,
    ...visualVocabulary
  ].map((item) => cleanPromptVisual(item, context.normalizedInput.topic, 5))
    .find((item) => item && !isGenericPromptTerm(item));
  return value || 'the central detail';
}

function sanitizeImagePrompt(value) {
  return sanitizeShortformText(value)
    .replace(/\bImage Prompt:\s*/gi, '')
    .replace(/\b(?:Motion Prompt|Sound Effect|Voice Direction|Background Music|Creator Note):\s*/gi, '')
    .replace(/\bNo readable text, logos, watermarks, modern objects, graphic gore, or cartoon styling\.\s*(?:No readable text, logos, watermarks, modern objects, graphic gore, or cartoon styling\.)+/gi, 'No readable text, logos, watermarks, modern objects, graphic gore, or cartoon styling.')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanPromptNoun(value, topic = '', maxWords = 8) {
  const text = compactFact(value, maxWords, topic)
    .replace(/\b(?:shown through|centered on|framed through|introduced through)\b/gi, '')
    .replace(/\b(?:as a careful source-bound visual|as the final remembered idea|as the source detail becomes visible|for [a-z\s-]+)$/gi, '')
    .replace(/\b(?:is best read as|is preserved around|works because)\b/gi, '')
    .replace(/\breturning motion\b/gi, 'returning movement')
    .replace(/\s+/g, ' ')
    .replace(/^[,:\s-]+|[,:\s-]+$/g, '')
    .trim();
  return text || '';
}

function cleanPromptSubject(value, topic = '') {
  const raw = sanitizeShortformText(value);
  const beforeColon = raw.includes(':') ? raw.split(':')[0] : raw;
  const direct = beforeColon.replace(/\s+/g, ' ').trim();
  if (direct && countWords(direct) <= 6 && !isGenericPromptTerm(direct)) return direct;
  const candidate = cleanPromptNoun(beforeColon, '', 6);
  if (candidate) return candidate;
  return cleanPromptNoun(raw, topic, 6);
}

function cleanPromptVisual(value, topic = '', maxWords = 8) {
  const raw = sanitizeShortformText(value).replace(/^[,:\s-]+|[,:\s-]+$/g, '');
  if (raw && countWords(raw) <= maxWords && exactTextKey(raw) !== exactTextKey(topic) && !isGenericPromptTerm(raw)) return raw;
  return cleanPromptNoun(raw, topic, maxWords);
}

function isGenericPromptTerm(value) {
  return /^(?:[a-z]+\s+)?(myth|legend|folklore|story|source|record|subject|scene|article|mystery|origin|comparison|the subject|one clear visual detail)$/i.test(String(value || '').trim());
}

function compactFact(value, maxWords, topic = '') {
  const text = sanitizeShortformText(value)
    .replace(new RegExp(`^${escapeRegExp(topic)}\\s+(?:follows|is|begins|centers|starts)\\s+`, 'i'), '')
    .replace(new RegExp(`^${escapeRegExp(topic)}\\s*`, 'i'), '')
    .replace(/^[a-z\s-]+:\s*/i, '')
    .replace(/\bthis article follows\b/gi, '')
    .replace(/^(?:follows\s+)?[a-z\s-]+ myth in which\s+/i, '')
    .replace(/\bis a pre-existing [a-z\s-]+ built around\b/gi, '')
    .replace(/^a pre-existing [a-z\s-]+ built around\b/gi, '')
    .replace(/\bit treats the material as folklore, legend, or documented retelling rather than confirmed fact\b/gi, 'the source limit stays visible')
    .replace(/\s+,/g, ',')
    .replace(/,+$/g, '')
    .replace(/[.!?]+$/g, '')
    .trim();
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return lowercaseStart(text);
  return lowercaseStart(trimWeakEnding(words.slice(0, maxWords)).join(' '));
}

function isLongformCopy(narration, longformResult) {
  const key = exactTextKey(narration);
  const sentences = (longformResult?.scenes || [])
    .flatMap((scene) => scene.narrationParts || [])
    .flatMap((part) => splitSentences(part.narration || ''))
    .map(exactTextKey)
    .filter(Boolean);
  return sentences.some((sentence) => sentence && key === sentence);
}

function assertNoKnownNameLeakage(result, normalizedInput) {
  if (!normalizedInput.__fixtureKnownNames) return [];
  const packed = JSON.stringify(result).toLowerCase();
  const allowed = new Set([
    normalizedInput.topic,
    ...(normalizedInput.knownNames || []),
    ...(normalizedInput.keyActors || [])
  ].map((value) => String(value || '').toLowerCase()).filter(Boolean));
  return normalizedInput.__fixtureKnownNames
    .filter((name) => !allowed.has(name))
    .filter((name) => packed.includes(name))
    .map((name) => `contains another fixture entity: ${name}`);
}

function soundTermsFromText(text, contentType, profile) {
  const isDigital = contentType === 'internet-folklore';
  if (isDigital && /code|cipher|online|internet|message|screen|digital|puzzle|clue|website|forum|image/.test(text)) {
    return /paper|printed|physical|location|book|record/.test(text)
      ? ['printed clue handling', 'quiet keyboard input', 'low room tone']
      : ['quiet keyboard input', 'restrained digital texture', 'subtle screen interaction'];
  }
  if (/sea|ocean|island|river|lake|water|shore|nile/.test(text)) return ['low water ambience', 'distant wind', 'soft shoreline movement'];
  if (/field|grain|meadow|harvest|grass|crop|earth|flower/.test(text)) return ['field wind', 'dry grass movement', 'soft footstep texture'];
  if (/underworld|cave|stone|tomb|chamber|temple|palace|mountain/.test(text)) return ['stone room ambience', 'distant wind', 'low interior resonance'];
  if (/forest|tree|road|trail|village|hill/.test(text)) return ['outdoor wind', 'distant footsteps', 'quiet natural ambience'];
  if (/fire|sun|sky|storm|thunder|light/.test(text)) return ['high wind', 'soft heat shimmer', 'distant low rumble'];
  if (/letter|book|manuscript|source|record|evidence|account|text|archive|map|document/.test(text)) return ['paper handling', 'quiet archive room tone', 'soft page movement'];
  if (/urban|modern|house|apartment|street|car|train|station/.test(text)) return ['distant street ambience', 'soft room tone', 'muted footsteps'];
  return [`quiet ${profile.profileType || 'documentary'} ambience`, 'distant wind', 'soft environmental tone'];
}

function usesUnrelatedDigitalSound(soundEffect, contentType) {
  if (contentType === 'internet-folklore') return false;
  return /keyboard|printer|modem|computer fan|fluorescent|office ventilation|screen interaction|electronic pulse|roadway traffic/i.test(String(soundEffect || ''));
}

function selectEmphasisTerm(narration, candidates) {
  const lower = String(narration || '').toLowerCase();
  return (candidates || [])
    .map(sanitizeShortformText)
    .flatMap((candidate) => candidate.split(/\s+/).filter((word) => word.length > 3))
    .find((word) => lower.includes(word.toLowerCase()))
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

function hasUsefulSpecificity(value, topic = '') {
  const text = sanitizeShortformText(value);
  if (exactTextKey(text) === exactTextKey(topic)) return false;
  if (text.split(/\s+/).length <= 4 && /\b(myth|legend|folklore|origin|puzzle|mystery|subject)\b$/i.test(text)) return false;
  if (/https?:|www\.|wikipedia|reference$/i.test(text)) return false;
  return text.length >= 8 && !/^(story|article|record|source|version|subject|scene)$/i.test(text);
}

function isGenericFocus(value) {
  return /show the mystery clearly|focus on the main idea|central short-form image|generic mystery/i.test(String(value || ''));
}

function containsFieldMixing(value, words) {
  const text = String(value || '').toLowerCase();
  return words.some((word) => text.includes(word.toLowerCase()));
}

function hasExactDuplicate(values) {
  const seen = new Set();
  for (const value of values.map(exactTextKey).filter(Boolean)) {
    if (seen.has(value)) return true;
    seen.add(value);
  }
  return false;
}

function longestSharedWordRun(left, right) {
  const a = wordTokens(left);
  const b = wordTokens(right);
  let best = 0;
  for (let i = 0; i < a.length; i += 1) {
    for (let j = 0; j < b.length; j += 1) {
      let length = 0;
      while (a[i + length] && a[i + length] === b[j + length]) length += 1;
      if (length > best) best = length;
    }
  }
  return best;
}

function wordTokens(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function uniqueText(values) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    const text = sanitizeShortformText(value);
    const key = exactTextKey(text);
    if (!text || seen.has(key)) continue;
    seen.add(key);
    output.push(text);
  }
  return output;
}

function splitSentences(value) {
  return String(value || '').match(/[^.!?]+[.!?]+/g)?.map((item) => item.trim()).filter(Boolean) || [];
}

function lowercaseStart(value) {
  const text = sanitizeShortformText(value);
  return text ? `${text.charAt(0).toLowerCase()}${text.slice(1)}` : '';
}

function capitalize(value) {
  const text = String(value || '').trim();
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : '';
}

function countWords(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

function exactTextKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function trimWeakEnding(words) {
  const output = [...words];
  while (output.length > 3 && /^(and|or|but|with|to|of|the|a|an|in|on|for|have|has|is|are|as|through)$/.test(output[output.length - 1].toLowerCase())) {
    output.pop();
  }
  return output;
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detailError(result, sceneIndex, field, error) {
  return {
    code: 'CREATOR_SHORTFORM_INVALID',
    slug: result?.slug || '',
    sceneIndex,
    field,
    error
  };
}

function rule(role, fields) {
  return { role, fields };
}

module.exports = {
  buildCreatorShortform,
  validateCreatorShortform,
  shortformRulesForContentType,
  buildShortformScenePlan,
  buildShortformNarrationForScene,
  buildShortformSceneFocus,
  buildShortformImagePrompt,
  buildShortformMotion,
  buildShortformBackgroundMusic,
  buildShortformVoiceDirection,
  buildShortformSoundEffect,
  estimateShortformReadTime,
  buildShortformRuntimePlan,
  sanitizeShortformText,
  detectShortformMetaLanguage
};
