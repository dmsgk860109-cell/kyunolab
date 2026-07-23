const {
  normalizeCreatorStoryInput,
  validateNormalizedCreatorInput
} = require('./creator-library-input');
const {
  buildCreatorScenePlan,
  validateCreatorScenePlan
} = require('./creator-library-scene-plan');
const {
  buildCreatorLongform,
  validateCreatorLongform
} = require('./creator-library-longform');
const {
  buildCreatorProductionFields,
  validateCreatorProductionFields
} = require('./creator-library-production');
const {
  buildCreatorShortform,
  validateCreatorShortform
} = require('./creator-library-shortform');

const CREATOR_PIPELINE_VERSION = 'single-path-v1';
const defaultPublishedAt = '2026-07-21';

function buildAndValidateCreatorLibraryEntry(story, category, options = {}) {
  return buildCreatorLibraryEntry(story, category, options);
}

function buildCreatorLibraryEntry(story, category, options = {}) {
  const normalizedInput = options.normalizedInput || runStage('normalize', story?.slug, () => normalizeCreatorStoryInput(story, category));
  validateInputOrThrow(normalizedInput);

  const scenePlan = options.scenePlan || runStage('scenePlan', normalizedInput.slug, () => buildCreatorScenePlan(normalizedInput));
  validateScenePlanOrThrow(scenePlan);

  const longformResult = options.longformResult || runStage('longform', normalizedInput.slug, () => buildCreatorLongform(normalizedInput, scenePlan));
  validateLongformOrThrow(longformResult, scenePlan);

  const productionResult = options.productionResult || runStage('production', normalizedInput.slug, () => buildCreatorProductionFields(normalizedInput, scenePlan, longformResult));
  validateProductionOrThrow(productionResult, scenePlan, longformResult);

  const shortformResult = options.shortformResult || runStage('shortform', normalizedInput.slug, () => buildCreatorShortform(normalizedInput, scenePlan, longformResult, productionResult));
  validateShortformOrThrow(shortformResult, normalizedInput);

  emitHook(options.onNormalizedInput, normalizedInput);
  emitHook(options.onScenePlan, scenePlan);
  emitHook(options.onLongformResult, longformResult);
  emitHook(options.onProductionResult, productionResult);
  emitHook(options.onShortformResult, shortformResult);

  const entry = assembleCreatorLibraryEntry({
    story,
    category,
    normalizedInput,
    longformResult,
    productionResult,
    shortformResult,
    publishedAt: options.publishedAt || defaultPublishedAt
  });
  validateCreatorLibraryEntry(entry);
  return entry;
}

function assembleCreatorLibraryEntry({ story, category, normalizedInput, longformResult, productionResult, shortformResult, publishedAt }) {
  const subject = cleanSubject(story.title);
  const slug = `${story.slug}-youtube-script`;
  const motif = story.primaryTag || story.tag || story.contentDNA?.centralMotif || category.title;
  const setting = settingForStory(story);
  const mood = moodForCategory(story.categorySlug);
  const facts = storyFacts(story);
  const angle = story.uniqueAngle || story.summaryAnswer || story.excerpt || `${subject} remains a memorable ${category.title} story.`;
  const longformScript = longformResult.scenes
    .flatMap((scene) => scene.narrationParts || [])
    .map((part) => part.narration)
    .filter(Boolean);
  const shortForm = mapShortformResultToStoredShortForm(shortformResult);
  const shortsScript = shortForm.scenes.map((scene) => scene.narration);
  const shortSceneFocuses = shortForm.scenes.map((scene) => scene.sceneFocus);
  const visualGuide = mapProductionResultToVisualGuide(productionResult, longformResult);
  const imagePrompts = visualGuide.flatMap((scene) => scene.narrationParts || [])
    .flatMap((part) => part.visualBeats || [])
    .map((beat) => beat.imagePrompt)
    .filter(Boolean);
  const motionPrompts = visualGuide.flatMap((scene) => scene.narrationParts || [])
    .flatMap((part) => part.visualBeats || [])
    .map((beat) => beat.motionPrompt || beat.beatMotion)
    .filter(Boolean);
  const estimatedVideoLength = estimateLongformVideoLength(story, longformScript, longformResult);

  return {
    id: slug,
    slug,
    creatorPipelineVersion: CREATOR_PIPELINE_VERSION,
    contentType: 'script',
    originalStorySlug: story.slug,
    title: `${subject} YouTube Script`,
    seoTitle: `Free ${subject} YouTube Script`,
    metaDescription: `A creator-ready production workspace for ${subject}, with long-form scenes, Shorts narration, image prompts, music keywords, and editing notes.`,
    genre: `${category.title} Creator Library`,
    creatorCategorySlug: category.slug,
    estimatedVideoLength,
    longformIncluded: true,
    shortsIncluded: true,
    imagePromptsIncluded: true,
    thumbnailIdeasIncluded: true,
    publishedAt,
    updatedAt: publishedAt,
    tags: unique([
      `${category.title.toLowerCase()} script`,
      `${String(motif).toLowerCase()} script`,
      'creator library',
      'youtube script',
      'shorts script',
      'image prompt'
    ]),
    deck: `${subject} is prepared as a creator-ready production workspace based on the archive record, with long-form scenes, Shorts narration, image prompts, music keywords, and editing notes.`,
    logline: sentence(angle),
    coreMotif: motif,
    mainSubject: subject,
    setting,
    mood,
    difficulty: 'Beginner-friendly production package',
    usageNote: `Use this page as a production workspace for a video based on the archive entry for ${subject}. Keep source limits clear and avoid presenting later interpretations as verified facts.`,
    longformScript,
    shortsScript,
    shortSceneFocuses,
    shortForm,
    imagePrompts,
    motionPrompts,
    visualGuide,
    runtimePlan: buildRuntimePlan(longformScript, estimatedVideoLength, longformResult),
    thumbnailIdeas: buildThumbnailIdeas(subject),
    subtitleLines: buildSubtitleLines(subject, facts),
    pipelineDiagnostics: {
      normalizedInputSchemaVersion: normalizedInput.schemaVersion,
      scenePlanSchemaVersion: scenePlanVersionFrom(longformResult, productionResult, shortformResult),
      fallbackUsed: false
    }
  };
}

function validateCreatorLibraryEntry(entry) {
  const errors = [];
  if (entry.creatorPipelineVersion !== CREATOR_PIPELINE_VERSION) errors.push(errorFor('entry', 'creatorPipelineVersion'));
  for (const field of ['slug', 'originalStorySlug', 'creatorCategorySlug']) {
    if (!hasValue(entry[field])) errors.push(errorFor('entry', field));
  }
  if (!Array.isArray(entry.longformScript) || entry.longformScript.length !== 10) errors.push(errorFor('longForm', 'longformScript'));
  if (!Array.isArray(entry.visualGuide) || entry.visualGuide.length !== 5) errors.push(errorFor('longForm', 'visualGuide'));
  validateVisualGuide(entry, errors);
  validateShortForm(entry, errors);
  validateCompatibilityFields(entry, errors);
  validateRuntimePlan(entry, errors);

  if (errors.length) {
    const first = errors[0];
    const error = new Error(`Creator Library entry invalid for ${entry.slug || 'unknown slug'}`);
    error.code = 'CREATOR_LIBRARY_ENTRY_INVALID';
    error.slug = entry.slug;
    error.stage = 'aggregate';
    error.field = first.field;
    error.sceneIndex = first.sceneIndex;
    error.partIndex = first.partIndex;
    error.beatIndex = first.beatIndex;
    error.fallbackUsed = false;
    error.errors = errors;
    throw error;
  }
  return true;
}

function validateVisualGuide(entry, errors) {
  (entry.visualGuide || []).forEach((scene, sceneIndex) => {
    for (const field of ['sceneRole', 'sceneFocus', 'backgroundMusic', 'voiceDirection', 'soundEffect', 'visualDirection']) {
      if (!hasValue(scene[field])) errors.push(errorFor('longForm', field, sceneIndex + 1));
    }
    if (!Array.isArray(scene.narrationParts) || scene.narrationParts.length !== 2) {
      errors.push(errorFor('longForm', 'narrationParts', sceneIndex + 1));
      return;
    }
    scene.narrationParts.forEach((part, partIndex) => {
      for (const field of ['narration', 'estimatedReadingTime', 'creatorNote']) {
        if (!hasValue(part[field])) errors.push(errorFor('longForm', field, sceneIndex + 1, partIndex + 1));
      }
      if (!Array.isArray(part.visualBeats) || !part.visualBeats.length) {
        errors.push(errorFor('longForm', 'visualBeats', sceneIndex + 1, partIndex + 1));
        return;
      }
      part.visualBeats.forEach((beat, beatIndex) => {
        for (const field of ['imagePrompt', 'motionPrompt']) {
          if (!hasValue(beat[field])) errors.push(errorFor('longForm', field, sceneIndex + 1, partIndex + 1, beatIndex + 1));
        }
      });
    });
  });
}

function validateShortForm(entry, errors) {
  const shortForm = entry.shortForm || {};
  for (const field of ['totalWordCount', 'narrationReadSeconds', 'finalVideoSeconds']) {
    if (!hasValue(shortForm[field])) errors.push(errorFor('shortForm', field));
  }
  if (!Array.isArray(shortForm.scenes) || shortForm.scenes.length !== 5) {
    errors.push(errorFor('shortForm', 'scenes'));
    return;
  }
  shortForm.scenes.forEach((scene, sceneIndex) => {
    for (const field of ['sceneIndex', 'role', 'narration', 'sceneFocus', 'imagePrompt', 'motionPrompt', 'backgroundMusic', 'voiceDirection', 'soundEffect', 'estimatedReadSeconds']) {
      if (!hasValue(scene[field])) errors.push(errorFor('shortForm', field, sceneIndex + 1));
    }
  });
}

function validateCompatibilityFields(entry, errors) {
  const visualPrompts = (entry.visualGuide || [])
    .flatMap((scene) => scene.narrationParts || [])
    .flatMap((part) => part.visualBeats || [])
    .map((beat) => beat.imagePrompt);
  const visualMotions = (entry.visualGuide || [])
    .flatMap((scene) => scene.narrationParts || [])
    .flatMap((part) => part.visualBeats || [])
    .map((beat) => beat.motionPrompt);
  const shortsScript = (entry.shortForm?.scenes || []).map((scene) => scene.narration);
  const shortSceneFocuses = (entry.shortForm?.scenes || []).map((scene) => scene.sceneFocus);
  if (JSON.stringify(entry.imagePrompts) !== JSON.stringify(visualPrompts)) errors.push(errorFor('compatibility', 'imagePrompts'));
  if (JSON.stringify(entry.motionPrompts) !== JSON.stringify(visualMotions)) errors.push(errorFor('compatibility', 'motionPrompts'));
  if (JSON.stringify(entry.shortsScript) !== JSON.stringify(shortsScript)) errors.push(errorFor('compatibility', 'shortsScript'));
  if (JSON.stringify(entry.shortSceneFocuses) !== JSON.stringify(shortSceneFocuses)) errors.push(errorFor('compatibility', 'shortSceneFocuses'));
}

function validateRuntimePlan(entry, errors) {
  const runtime = entry.runtimePlan || {};
  const longText = (entry.longformScript || []).join(' ');
  const longWords = countWords(longText);
  const shortText = (entry.shortForm?.scenes || []).map((scene) => scene.narration).join(' ');
  const shortWords = countWords(shortText);
  if (runtime.totalWordCount !== longWords) errors.push(errorFor('runtime', 'totalWordCount'));
  if (runtime.narrationReadSeconds !== Math.max(8, Math.round(longWords / 2.35))) errors.push(errorFor('runtime', 'narrationReadSeconds'));
  if (!Number.isFinite(runtime.finalVideoSeconds) || runtime.finalVideoSeconds < runtime.narrationReadSeconds) errors.push(errorFor('runtime', 'finalVideoSeconds'));
  if (entry.shortForm?.totalWordCount !== shortWords) errors.push(errorFor('shortForm', 'totalWordCount'));
  if (entry.shortForm?.finalVideoSeconds < entry.shortForm?.narrationReadSeconds) errors.push(errorFor('shortForm', 'finalVideoSeconds'));
}

function validateInputOrThrow(normalizedInput) {
  validateNormalizedCreatorInput(normalizedInput);
  if (normalizedInput.missingRequiredFields?.length) {
    throwStageError('normalize', normalizedInput.slug, 'CREATOR_INPUT_INVALID', normalizedInput.missingRequiredFields);
  }
}

function validateScenePlanOrThrow(scenePlan) {
  const validation = validateCreatorScenePlan(scenePlan);
  if (!validation.valid) throwStageError('scenePlan', scenePlan.slug, 'CREATOR_SCENE_PLAN_INVALID', validation.errors);
}

function validateLongformOrThrow(longformResult, scenePlan) {
  const validation = validateCreatorLongform(longformResult, scenePlan);
  if (!validation.valid) throwStageError('longform', longformResult.slug, 'CREATOR_LONGFORM_INVALID', validation.errors);
}

function validateProductionOrThrow(productionResult, scenePlan, longformResult) {
  const validation = validateCreatorProductionFields(productionResult, scenePlan, longformResult);
  if (!validation.valid) throwStageError('production', productionResult.slug, 'CREATOR_PRODUCTION_INVALID', validation.errors);
}

function validateShortformOrThrow(shortformResult, normalizedInput) {
  const validation = validateCreatorShortform(shortformResult, normalizedInput);
  if (!validation.valid) throwStageError('shortform', shortformResult.slug, 'CREATOR_SHORTFORM_INVALID', validation.errors);
}

function runStage(stage, slug, fn) {
  try {
    return fn();
  } catch (error) {
    error.stage = error.stage || stage;
    error.slug = error.slug || slug;
    error.fallbackUsed = false;
    throw error;
  }
}

function throwStageError(stage, slug, code, errors) {
  const first = Array.isArray(errors) ? errors[0] : errors;
  const error = new Error(`${stage} failed for ${slug}`);
  error.code = code;
  error.slug = slug;
  error.stage = stage;
  error.field = first?.field || first;
  error.sceneIndex = first?.sceneIndex;
  error.partIndex = first?.partIndex;
  error.beatIndex = first?.beatIndex;
  error.fallbackUsed = false;
  error.errors = Array.isArray(errors) ? errors : [errors].filter(Boolean);
  throw error;
}

function mapShortformResultToStoredShortForm(shortformResult) {
  return {
    scenes: (shortformResult.scenes || []).map((scene) => ({
      sceneIndex: scene.sceneIndex,
      role: scene.role,
      narration: scene.narration,
      sceneFocus: scene.sceneFocus,
      imagePrompt: scene.imagePrompt,
      motionPrompt: scene.motionPrompt,
      backgroundMusic: scene.backgroundMusic,
      voiceDirection: scene.voiceDirection,
      soundEffect: scene.soundEffect,
      estimatedReadSeconds: scene.estimatedReadSeconds,
      sourceFactIds: scene.sourceFactIds || [],
      sourceFieldRefs: scene.sourceFieldRefs || [],
      usedFactTexts: scene.usedFactTexts || []
    })),
    totalWordCount: shortformResult.totalWordCount,
    narrationReadSeconds: shortformResult.narrationReadSeconds,
    finalVideoSeconds: shortformResult.finalVideoSeconds
  };
}

function mapProductionResultToVisualGuide(productionResult, longformResult) {
  return (productionResult.scenes || []).map((scene, sceneIndex) => {
    const longformScene = (longformResult.scenes || [])[sceneIndex] || {};
    const sceneSourceFactIds = unique((longformScene.narrationParts || []).flatMap((part) => part.sourceFactIds || []));
    const sceneSourceFieldRefs = unique((longformScene.narrationParts || []).flatMap((part) => part.sourceFieldRefs || []));
    return {
      sceneRole: scene.role,
      sceneFocus: scene.sceneFocus,
      directionTip: scene.sceneFocus,
      voiceDirection: scene.voiceDirection,
      backgroundMusic: scene.backgroundMusic,
      soundEffect: scene.soundEffect,
      visualDirection: visualDirectionFromProductionScene(scene),
      sourceFactIds: sceneSourceFactIds.length ? sceneSourceFactIds : scene.sourceFactIds || [],
      sourceFieldRefs: sceneSourceFieldRefs.length ? sceneSourceFieldRefs : scene.sourceFieldRefs || [],
      narrationParts: (scene.narrationParts || []).map((part, partIndex) => {
        const narrationPart = (longformScene.narrationParts || [])[partIndex] || {};
        return {
          narration: narrationPart.narration || '',
          estimatedReadingTime: secondsToApproxLabel(narrationPart.estimatedReadSeconds || estimatedNarrationSecondsFromText(narrationPart.narration || '')),
          creatorNote: part.creatorNote,
          sourceFactIds: narrationPart.sourceFactIds || part.sourceFactIds || [],
          sourceFieldRefs: narrationPart.sourceFieldRefs || part.sourceFieldRefs || [],
          usedFactTexts: narrationPart.usedFactTexts || [],
          visualBeats: (part.visualBeats || []).map((beat, beatIndex) => ({
            label: `Image Prompt ${beatIndex + 1}`,
            imagePrompt: beat.imagePrompt,
            motionPrompt: beat.beatMotion,
            beatMotion: beat.beatMotion,
            sourceFactIds: beat.sourceFactIds || [],
            sourceFieldRefs: beat.sourceFieldRefs || [],
            usedFactTexts: beat.usedFactTexts || []
          }))
        };
      })
    };
  });
}

function visualDirectionFromProductionScene(scene) {
  const role = String(scene.role || '').toLowerCase();
  if (/source|variant|evidence|account|comparison|trace/.test(role)) {
    return 'Hold the source-focused image long enough to read the visual idea, then fade softly into the next scene.';
  }
  if (/closing|meaning|legacy|unresolved|outcome/.test(role)) {
    return 'Begin with a slow pullback, hold briefly after the final narration line, then fade to black.';
  }
  if (/turning|incident|problem|consequence|core/.test(role)) {
    return 'Start steady, begin a slow push toward the main detail, and cut after the scene consequence is clear.';
  }
  return 'Hold the establishing image briefly, then begin a slow push toward the main detail.';
}

function estimateLongformVideoLength(story, longformScript, longformResult) {
  const score = informationDepthScore(story);
  const runtime = buildRuntimePlan(longformScript, '', longformResult);
  if (score >= 14 && runtime.finalVideoSeconds >= 480) return '8-10 minutes';
  if (score >= 10 && runtime.finalVideoSeconds >= 420) return '7-8 minutes';
  if (runtime.finalVideoSeconds >= 360) return '6-7 minutes';
  return '5-6 minutes';
}

function informationDepthScore(story) {
  return [
    story.storyBrief?.coreStoryElements?.length || 0,
    story.storyBrief?.reportedVariants?.length || 0,
    story.storyBrief?.editorialInterpretationOptions?.length || 0,
    story.researchSources?.length || 0,
    story.publicArticlePlan?.sections?.length || 0
  ].reduce((sum, value) => sum + value, 0);
}

function buildRuntimePlan(longformScript, estimatedVideoLength = '', longformResult) {
  const wordCount = longformResult?.totalWordCount || countWords(longformScript.join(' '));
  const narrationReadSeconds = longformResult?.narrationReadSeconds || Math.max(8, Math.round(wordCount / 2.35));
  const sceneCount = Math.max(1, Math.min(5, longformScript.length));
  const plannedVisualSeconds = sceneCount * 10;
  const breathSeconds = Math.max(20, sceneCount * 7);
  const naturalFinalSeconds = narrationReadSeconds + plannedVisualSeconds + breathSeconds;
  const runtime = parseRuntimeRange(estimatedVideoLength);
  const finalVideoSeconds = longformResult?.targetFinalVideoSeconds || Math.max(300, runtime?.minSeconds || 0, naturalFinalSeconds);
  return {
    totalWordCount: wordCount,
    narrationReadSeconds,
    finalVideoSeconds,
    narrationReadTime: secondsToLabel(narrationReadSeconds),
    plannedTransitionAndVisualTime: secondsToLabel(Math.max(0, finalVideoSeconds - narrationReadSeconds)),
    estimatedFinalRuntime: estimatedVideoLength || secondsToMinutesRange(finalVideoSeconds),
    estimatedFinalSeconds: finalVideoSeconds
  };
}

function parseRuntimeRange(value) {
  const match = String(value || '').match(/^(\d+)\s*-\s*(\d+)\s*minutes$/i);
  if (!match) return null;
  return {
    minSeconds: Number(match[1]) * 60,
    maxSeconds: Number(match[2]) * 60
  };
}

function secondsToMinutesRange(seconds) {
  const minutes = Math.max(5, Math.min(10, Math.round(seconds / 60)));
  return `${minutes}-${Math.min(10, minutes + 1)} minutes`;
}

function secondsToLabel(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (!minutes) return `${remainder} sec`;
  return `${minutes} min ${String(remainder).padStart(2, '0')} sec`;
}

function estimatedNarrationSecondsFromText(narration) {
  return Math.max(8, Math.round(countWords(narration) / 2.35));
}

function secondsToApproxLabel(seconds) {
  return `≈ ${seconds} sec`;
}

function buildThumbnailIdeas(subject) {
  const shortSubject = subject.replace(/^The\s+/i, '').split(/\s+/).slice(0, 5).join(' ');
  return [
    `${shortSubject} with bold text: THE STORY STILL REMAINS`,
    `A close-up of the key image from ${shortSubject}`,
    `Split thumbnail: familiar legend on one side, unresolved question on the other`
  ];
}

function buildSubtitleLines(subject, facts) {
  return [
    `${subject} begins with a familiar image.`,
    facts[0] || 'Then one detail gives the story its shape.',
    'The ending leaves a question behind.'
  ];
}

function storyFacts(story) {
  const quickAnswer = story.publicArticlePlan?.quickAnswer?.paragraphs || [];
  const core = story.storyBrief?.coreStoryElements || [];
  return unique([...core, ...quickAnswer, story.excerpt, story.summaryAnswer])
    .map(sentence)
    .filter(Boolean)
    .slice(0, 5);
}

function settingForStory(story) {
  const text = `${story.title} ${story.detail || ''} ${(story.subjectSpecificVocabulary || []).join(' ')}`.toLowerCase();
  if (/timestamp|digital record|modern omen|time records/.test(text)) return 'quiet digital archive';
  if (/internet|creepypasta|online|digital|backrooms|jeff/.test(text)) return 'dim online archive space';
  if (/tower|castle|prison|penitentiary|hallway|building|apartment|hotel|cinema/.test(text)) return 'old interior space';
  if (/\b(lake|island|sea|ocean|ship|kraken|selkie|hy-brasil|lyonesse|titicaca)\b/.test(text)) return 'misty waterside landscape';
  if (/forest|road|mount|stonehenge|nazca|field|rain|fire|fog/.test(text)) return 'open landscape under unsettled weather';
  if (/underworld|myth|sisyphus|icarus|persephone|cerberus|griffin|pandora|ark|sword/.test(text)) return 'mythic symbolic landscape';
  return 'quiet archival setting';
}

function moodForCategory(slug) {
  const moods = {
    'urban-legends': 'restrained and uncanny',
    'internet-folklore': 'digital, liminal, and unsettling',
    'strange-places': 'historic, quiet, and haunted',
    'unexplained-mysteries': 'documentary, unresolved, and tense',
    'classic-folklore': 'old-world, mythic, and intimate',
    'modern-legends': 'rural, nocturnal, and uneasy',
    myths: 'ancient, symbolic, and dramatic',
    'mythic-creatures': 'legendary, atmospheric, and watchful',
    'lost-worlds': 'distant, misty, and contemplative',
    'strange-nature': 'natural, uncanny, and observational',
    'legendary-places': 'sacred, remote, and mysterious',
    'mythic-objects': 'reverent, symbolic, and tense',
    'legend-origins': 'curious, historical, and reflective'
  };
  return moods[slug] || 'calm and mysterious';
}

function cleanSubject(title) {
  return String(title || '')
    .replace(/:.*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sentence(text) {
  const value = String(text || '')
    .replace(/\bA source-aware Kyunolab record tracing\b/gi, 'A record describes')
    .replace(/\bsource-aware Kyunolab record\b/gi, 'archive record')
    .replace(/\s+/g, ' ')
    .trim();
  if (!value) return '';
  return value.endsWith('.') || value.endsWith('?') || value.endsWith('!') ? value : `${value}.`;
}

function scenePlanVersionFrom(longformResult, productionResult, shortformResult) {
  return longformResult.scenePlanSchemaVersion || productionResult.scenePlanSchemaVersion || shortformResult.scenePlanSchemaVersion || '';
}

function countWords(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

function hasValue(value) {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  return String(value).trim().length > 0;
}

function errorFor(section, field, sceneIndex, partIndex, beatIndex) {
  return { section, field, sceneIndex, partIndex, beatIndex };
}

function emitHook(fn, value) {
  if (typeof fn === 'function') fn(value);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

module.exports = {
  CREATOR_PIPELINE_VERSION,
  buildCreatorLibraryEntry,
  validateCreatorLibraryEntry,
  buildAndValidateCreatorLibraryEntry
};
