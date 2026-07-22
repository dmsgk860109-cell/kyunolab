const fs = require('fs');
const path = require('path');
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

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const scriptsPath = path.join(root, 'data', 'scripts.json');
const categoriesPath = path.join(root, 'data', 'categories.json');

const publishedAt = '2026-07-21';
const perCategory = 3;

function main() {
  const stories = readJson(storiesPath);
  const scripts = readJson(scriptsPath);
  const categories = readJson(categoriesPath);
  const existingScriptSlugs = new Set(scripts.map((script) => script.slug));
  const existingOriginalSlugs = new Set(scripts.map((script) => script.originalStorySlug).filter(Boolean));
  const additions = [];

  for (const category of categories) {
    const latestStories = stories
      .filter((story) => story.contentType === 'story' && story.categorySlug === category.slug)
      .slice(0, perCategory);

    for (const story of latestStories) {
      const script = buildCreatorLibraryEntry(story, category);
      if (existingScriptSlugs.has(script.slug) || existingOriginalSlugs.has(story.slug)) {
        continue;
      }
      additions.push(script);
      existingScriptSlugs.add(script.slug);
      existingOriginalSlugs.add(story.slug);
    }
  }

  scripts.unshift(...additions);
  writeJson(scriptsPath, scripts);

  console.log(`Added ${additions.length} Creator Library entries.`);
  for (const addition of additions) {
    console.log(`${addition.creatorCategorySlug}: ${addition.slug}`);
  }
}

function buildCreatorLibraryEntry(story, category, options = {}) {
  const normalizedInput = options.normalizedInput || normalizeCreatorStoryInput(story, category);
  validateInputOrThrow(normalizedInput);
  const scenePlan = options.scenePlan || buildCreatorScenePlan(normalizedInput);
  validateScenePlanOrThrow(scenePlan);
  const longformResult = options.longformResult || buildCreatorLongform(normalizedInput, scenePlan);
  validateLongformOrThrow(longformResult, scenePlan);
  const productionResult = options.productionResult || buildCreatorProductionFields(normalizedInput, scenePlan, longformResult);
  validateProductionOrThrow(productionResult, scenePlan, longformResult);
  const shortformResult = options.shortformResult || buildCreatorShortform(normalizedInput, scenePlan, longformResult, productionResult);
  validateShortformOrThrow(shortformResult, normalizedInput);
  if (typeof options.onNormalizedInput === 'function') {
    options.onNormalizedInput(normalizedInput);
  }
  if (typeof options.onScenePlan === 'function') {
    options.onScenePlan(scenePlan);
  }
  if (typeof options.onLongformResult === 'function') {
    options.onLongformResult(longformResult);
  }
  if (typeof options.onProductionResult === 'function') {
    options.onProductionResult(productionResult);
  }
  if (typeof options.onShortformResult === 'function') {
    options.onShortformResult(shortformResult);
  }
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
    creatorPipelineVersion: 'single-path-v1',
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
    thumbnailIdeas: buildThumbnailIdeas(subject, story),
    subtitleLines: buildSubtitleLines(subject, facts)
  };
}

function validateInputOrThrow(normalizedInput) {
  validateNormalizedCreatorInput(normalizedInput);
  if (normalizedInput.missingRequiredFields?.length) {
    const error = new Error(`Creator input invalid for ${normalizedInput.slug}`);
    error.code = 'CREATOR_INPUT_INVALID';
    error.slug = normalizedInput.slug;
    error.missingRequiredFields = normalizedInput.missingRequiredFields;
    error.errors = normalizedInput.missingRequiredFields.map((field) => `Missing required field: ${field}`);
    throw error;
  }
}

function validateScenePlanOrThrow(scenePlan) {
  const validation = validateCreatorScenePlan(scenePlan);
  if (!validation.valid) {
    const error = new Error(`Creator Scene Plan invalid for ${scenePlan.slug}`);
    error.code = 'CREATOR_SCENE_PLAN_INVALID';
    error.slug = scenePlan.slug;
    error.errors = validation.errors;
    throw error;
  }
}

function validateLongformOrThrow(longformResult, scenePlan) {
  const validation = validateCreatorLongform(longformResult, scenePlan);
  if (!validation.valid) {
    const error = new Error(`Creator Long-form invalid for ${scenePlan.slug}`);
    error.code = 'CREATOR_LONGFORM_INVALID';
    error.slug = scenePlan.slug;
    error.errors = validation.errors;
    throw error;
  }
}

function validateProductionOrThrow(productionResult, scenePlan, longformResult) {
  const validation = validateCreatorProductionFields(productionResult, scenePlan, longformResult);
  if (!validation.valid) {
    const first = validation.errors[0] || {};
    const error = new Error(`Creator production invalid for ${scenePlan.slug}`);
    error.code = 'CREATOR_PRODUCTION_INVALID';
    error.slug = scenePlan.slug;
    error.sceneIndex = first.sceneIndex;
    error.partIndex = first.partIndex;
    error.beatIndex = first.beatIndex;
    error.field = first.field;
    error.errors = validation.errors;
    throw error;
  }
}

function validateShortformOrThrow(shortformResult, normalizedInput) {
  const validation = validateCreatorShortform(shortformResult, normalizedInput);
  if (!validation.valid) {
    const first = validation.errors[0] || {};
    const error = new Error(`Creator Short-form invalid for ${normalizedInput.slug}`);
    error.code = 'CREATOR_SHORTFORM_INVALID';
    error.slug = normalizedInput.slug;
    error.sceneIndex = first.sceneIndex;
    error.field = first.field;
    error.errors = validation.errors;
    throw error;
  }
}

function mapShortformResultToStoredShortForm(shortformResult) {
  return {
    scenes: (shortformResult.scenes || []).map((scene) => ({
      sceneIndex: scene.sceneIndex,
      role: scene.role,
      narration: scene.narration,
      sceneFocus: scene.sceneFocus,
      motionPrompt: scene.motionPrompt,
      backgroundMusic: scene.backgroundMusic,
      voiceDirection: scene.voiceDirection,
      soundEffect: scene.soundEffect,
      estimatedReadSeconds: scene.estimatedReadSeconds
    })),
    totalWordCount: shortformResult.totalWordCount,
    narrationReadSeconds: shortformResult.narrationReadSeconds,
    finalVideoSeconds: shortformResult.finalVideoSeconds
  };
}

function mapProductionResultToVisualGuide(productionResult, longformResult) {
  return (productionResult.scenes || []).map((scene, sceneIndex) => {
    const longformScene = (longformResult.scenes || [])[sceneIndex] || {};
    return {
      sceneRole: scene.role,
      sceneFocus: scene.sceneFocus,
      directionTip: scene.sceneFocus,
      voiceDirection: scene.voiceDirection,
      backgroundMusic: scene.backgroundMusic,
      soundEffect: scene.soundEffect,
      visualDirection: visualDirectionFromProductionScene(scene),
      narrationParts: (scene.narrationParts || []).map((part, partIndex) => {
        const narrationPart = (longformScene.narrationParts || [])[partIndex] || {};
        return {
          narration: narrationPart.narration || '',
          estimatedReadingTime: secondsToApproxLabel(narrationPart.estimatedReadSeconds || estimatedNarrationSecondsFromText(narrationPart.narration || '')),
          creatorNote: part.creatorNote,
          visualBeats: (part.visualBeats || []).map((beat, beatIndex) => ({
            label: `Image Prompt ${beatIndex + 1}`,
            imagePrompt: beat.imagePrompt,
            motionPrompt: beat.beatMotion,
            beatMotion: beat.beatMotion
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

function buildLongformScript(subject, story, facts, motif) {
  const topic = story.storyBrief?.topic || subject;
  const preparedLongform = longformNarrationFromKnownStory(story, topic);
  if (preparedLongform.length) return preparedLongform.map(spokenNarration);

  const origin = narrationSentence(story.publicSourceBasis || story.storyBrief?.cultureOrContext || story.evidence || 'the surviving tradition and later retellings');
  const firstFact = narrationSentence(facts[0] || story.detail || `${subject} is remembered through one central story image.`);
  const secondFact = narrationSentence(facts[1] || story.summaryAnswer || 'Later retellings keep the central event while changing emphasis.');
  const thirdFact = narrationSentence(facts[2] || story.excerpt || 'The strongest version keeps the central subject clear.');
  const meaning = narrationSentence(story.storyBrief?.editorialInterpretationOptions?.[0] || story.uniqueAngle || `${subject} remains important because the story gives a familiar fear or hope a clear shape.`);
  const limit = narrationSentence(story.sourceNotes?.sourceLimits?.[0] || story.storyBrief?.uncertainDetails?.[0] || 'Some details change across later retellings.');
  const variant = narrationSentence(story.storyBrief?.reportedVariants?.[0]?.claim || 'Later versions often change a detail without replacing the main event.');
  const sourceNote = narrationSentence(story.publicSourceNoteSeed || story.publicArticlePlan?.publicSourceNote || origin);
  const detail = narrationSentence(story.detail || story.sceneAnchor || firstFact);

  return [
    spokenNarration(`${topic} begins with ${detail} The first image should stay concrete, because the story depends on a moment the audience can follow.`),
    spokenNarration(`${firstFact} ${secondFact}`),
    spokenNarration(`${variant} ${thirdFact}`),
    spokenNarration(`${origin} ${sourceNote}`),
    spokenNarration(`${limit} ${meaning}`)
  ];
}

function longformNarrationFromKnownStory(story, topic) {
  if (story.slug === 'osiris-isis-resurrection-myth') {
    return [
      `${topic} begins with a broken family of gods. Osiris is remembered as a ruler, a giver of order, and a figure tied to fertile land and kingship. Isis is his sister and wife, known for loyalty, mourning, and sacred power. Set stands against them. From the start, the myth is about rule, jealousy, death, and restoration. It also asks what remains when rightful order is violently interrupted.`,
      `In the familiar account, Set murders Osiris. Some versions describe a chest or coffin made to fit him, then sealed and sent away. The story turns on that image: a rightful king trapped, hidden, and removed from the world above. Osiris does not simply disappear. His body becomes the center of a search that changes the myth. The crime is secretive, but its effects spread outward.`,
      `Isis begins looking for Osiris. Her search gives the myth its emotional force. She moves through places and signs, following the trace of what has been taken. The story is not only about finding a body. It is about refusing to let death and violence become the final word. Her grief becomes movement, intelligence, and sacred persistence.`,
      `When Isis finds Osiris, the myth does not settle into peace. Set attacks the body again in many retellings, cutting it apart and scattering the pieces. The broken body makes the loss harder to repair. It also gives the myth one of its strongest images: restoration must happen piece by piece, not all at once. The body becomes a map of damage and recovery.`,
      `Isis gathers what remains. In some accounts, Nephthys helps her mourn and protect the dead god. Later traditions may also place divine helpers near the work of restoration. The details vary, but the center remains clear. Osiris can no longer return as an ordinary living king, yet he is not erased. Ritual care gives the shattered body a new sacred order.`,
      `The restoration of Osiris is not the same as a simple resurrection. He becomes connected with the underworld, the dead, and the promise that death can be ritually answered. The myth turns a destroyed body into a sacred pattern. Burial, mourning, protection, and renewal all gather around his name. Life above changes, but power continues below.`,
      `The birth of Horus gives the story its next movement. Horus becomes the child who can answer Set's violence and carry the royal line forward. Through him, the loss of Osiris becomes tied to succession. Kingship is no longer only about one ruler. It becomes a chain between death, inheritance, and divine order. The living king can be understood through Horus, while Osiris rules the dead.`,
      `Ancient Egyptian material preserves the myth across ritual texts, temple traditions, and later summaries rather than in one single fixed version. Greek and Roman writers also retold the story, sometimes smoothing out older religious layers. That is why details can shift while the main shape remains recognizable. The murder, search, restoration, and succession stay at the center.`,
      `The myth matters because Osiris is both lost and made powerful through loss. Isis does not undo death in an ordinary way. She transforms mourning into action, and the restored Osiris becomes a lord of the dead. The story links grief with ritual care, and kingship with the hope of continuing beyond death. Restoration does not erase the wound; it gives the wound meaning.`,
      `By the end, Osiris and Isis is not just a tale of murder and repair. It is a myth about how a culture imagined order surviving violence. Set breaks the body. Isis searches and restores. Horus continues the line. Osiris rules below, and the dead are given a model for renewal, judgment, and lasting memory. The story ends with death changed into a form of rule, remembered through ritual and kingship across many generations.`
    ];
  }
  if (story.slug !== 'demeter-and-persephone-myth') return [];
  return [
    `${topic} begins with a mother and a daughter. Demeter is the goddess of grain and growing fields. Persephone is her child, linked with youth, flowers, and the bright surface of the world. At first, the story does not begin in darkness. It begins in a meadow, with Persephone gathering flowers among companions before anything seems wrong. The peaceful opening makes the rupture sharper.`,
    `Then the ground opens. Hades, lord of the underworld, rises from below and carries Persephone away. The sudden break is the center of the myth. One moment she belongs to the living landscape. The next, she is taken beneath it, into a world Demeter cannot simply enter and reclaim. The bright field becomes the doorway to loss.`,
    `Demeter soon realizes that her daughter has vanished. She searches the earth in grief, moving through the human world and the divine world for any sign of Persephone. The search is not only a mother's private sorrow. In the myth, Demeter's pain begins to change the condition of the whole earth. Her absence from the fields becomes visible, because the power that feeds them has turned away.`,
    `As Demeter withdraws, the fields begin to fail. Grain no longer grows as it should. The land loses its abundance, and human beings face hunger. This is why the gods cannot ignore the loss forever. Persephone's disappearance has become a crisis for both the divine order and the human world. A family wound has become a cosmic problem.`,
    `Different versions place different weight on Persephone's choice. Some tell the story as an abduction with little room for her will. Later readings sometimes give more attention to Persephone as queen of the underworld. Those versions do not erase the loss, but they change how viewers understand her place below the earth. She is both taken and transformed, and that tension is why the story keeps changing.`,
    `The pomegranate seeds are another point where versions differ. In many accounts, Persephone eats seeds in the underworld, and that act binds her to return there for part of the year. The number of seeds is not always told the same way. What matters is that a small act creates a lasting condition. Food becomes a bond between two worlds, and the bargain cannot be ignored.`,
    `The fullest surviving ancient account is usually associated with the Homeric Hymn to Demeter. That version gives the search, the grief, and the settlement a strong ritual shape. Later Greek and Roman retellings keep the central movement, but they may simplify the emotional and religious layers of the story. The older account keeps Demeter's anger and sacred power close together.`,
    `Zeus becomes involved because the world cannot continue while Demeter refuses the harvest. A compromise is reached. Persephone is allowed to return to her mother, but not forever. Because she has eaten in the underworld, she must divide her time between the world above and the realm below. The return is real, but it is not complete. The settlement saves the world without undoing the wound.`,
    `When Persephone returns, the earth can bloom again. When she descends, Demeter's loss returns with her. This is why the myth became connected with the seasons, agriculture, and the cycle of growth and absence. The story gives a human shape to changes people saw every year in the land. Spring and barrenness become part of one pattern, and harvest depends on reunion.`,
    `The ending is not a simple rescue. Persephone comes back, but the separation remains part of the order of things. Demeter receives her daughter, then loses her again. In that rhythm, the myth holds grief, return, death, renewal, and the fragile hope that what disappears below may one day rise again. Nothing is restored exactly as it was. The cycle itself becomes the answer the myth preserves.`
  ];
}

function buildShortsScript(subject, story, facts) {
  const planned = shortFormProductionPlan(subject, story, facts).narration;
  if (planned.length) return planned.map(spokenNarration);

  const firstFact = facts[0] || `${subject} is built around one image people do not forget.`;
  const detail = story.detail || story.sceneAnchor || firstFact;
  const variant = story.storyBrief?.reportedVariants?.[0]?.claim;
  return [
    spokenNarration(`${subject} starts with one image you can picture quickly.`),
    spokenNarration(`${shortNarrationLine(firstFact, subject)}`),
    spokenNarration(`${shortNarrationLine(detail, subject)}`),
    spokenNarration(variant ? `${shortNarrationLine(variant, subject)}` : `${subject} changes slightly as people repeat it.`),
    spokenNarration(`And that is why ${subject} still feels unfinished.`)
  ];
}

function buildShortSceneFocuses(subject, story, shortsScript) {
  const planned = shortFormProductionPlan(subject, story, []).focuses;
  if (planned.length) return planned;
  return (shortsScript || []).map((line, index) => shortSceneFocusFromLine(subject, story, line, index));
}

function shortFormProductionPlan(subject, story, facts) {
  const topic = story.storyBrief?.topic || subject;
  const context = storyEntityText(story, topic);

  if (/demeter|persephone|hades|pomegranate|greek seasonal|seasons|underworld/.test(context)) {
    return {
      narration: [
        'Persephone is gathering flowers when the myth turns toward the underworld. The bright field becomes the place where loss begins.',
        'Hades takes her below, and Demeter searches the earth for any trace of her daughter. Her grief is not private for long.',
        'As Demeter withdraws, fields fail, grain withers, and human hunger forces the gods to respond. The family wound becomes a crisis for the world above.',
        'Persephone returns, but the pomegranate changes the ending. Because she has eaten below, reunion comes with a condition.',
        'The myth leaves one lasting image: mother and daughter meeting, separating, and meeting again. That rhythm becomes the shape of the seasons.'
      ],
      focuses: [
        'A flowered field turns into the threshold of the underworld.',
        'Demeter searches empty paths and fields for Persephone.',
        'Withered grain shows grief spreading into the human world.',
        "Pomegranate seeds make Persephone's return conditional between two worlds.",
        'Reunion and separation become the visual rhythm of the seasons.'
      ]
    };
  }

  if (/osiris|isis|set|horus|egyptian myth|restoration|afterlife|kingship/.test(context)) {
    return {
      narration: [
        'Osiris begins as a ruler whose order is broken by Set. The myth starts with kingship, jealousy, and a body removed from the world above.',
        'Isis searches for him through signs, places, and fragments of memory. Her mourning becomes action instead of silence.',
        'The body is restored, but the story does not become a simple return to life. Repair changes Osiris into something different.',
        'Osiris becomes connected with the underworld, while Horus carries the royal line forward. Death, restoration, and succession now belong to one pattern.',
        'The myth lasts because it does not erase the wound. It turns loss into ritual power, and rule continues below the living world.'
      ],
      focuses: [
        'Royal Egyptian order breaks around Osiris, Isis, and Set.',
        'Isis searches through Nile-side places for the lost Osiris.',
        'Linen, stone, and ritual care suggest symbolic restoration.',
        'Osiris below and Horus above divide rule and succession.',
        'Loss becomes underworld authority and lasting Egyptian ritual memory.'
      ]
    };
  }

  if (isDigitalPuzzleProfileContext(context)) {
    return {
      narration: [
        `${topic} begins with an anonymous puzzle appearing online, not with a monster or a legend from the distant past.`,
        'The clues move through cryptography, hidden messages, coded images, books, music, and Tor links.',
        'Then the puzzle crosses into the physical world, sending solvers toward coordinates and posted signs.',
        'The strongest evidence is the trail itself, while the group behind it remains uncertain.',
        'That is why the puzzle still works as digital folklore: the clues are visible, but the purpose stays hidden.'
      ],
      focuses: [
        'An anonymous online puzzle becomes the opening image.',
        'Coded images and hidden messages define the challenge.',
        'Physical clues connect online solving with real-world locations.',
        'The puzzle trail is clearer than the unknown group behind it.',
        'Visible clues and hidden purpose keep the digital mystery alive.'
      ]
    };
  }

  return { narration: [], focuses: [] };
}

function shortSceneFocusFromLine(subject, story, line, index) {
  const topic = story.storyBrief?.topic || subject;
  const anchor = story.sceneAnchor || story.detail || story.subjectSpecificVocabulary?.[0] || topic;
  const text = String(line || '').toLowerCase();
  if (index === 0) return `${topic} enters through one concrete opening image.`;
  if (/search|looking|missing|lost|trace/.test(text)) return `The search for ${topic} becomes the main visual action.`;
  if (/return|ending|final|lasts|still/.test(text)) return `${topic} closes on the detail that remains unresolved.`;
  if (/version|differ|variant|retelling/.test(text)) return `A variant detail changes how ${topic} is remembered.`;
  return `${anchor} becomes the central short-form image.`;
}

function buildSceneFocuses(subject, story, facts) {
  const topic = story.storyBrief?.topic || subject;
  const variants = story.storyBrief?.reportedVariants || [];
  const location = story.subjectSpecificVocabulary?.find((term) => /road|avenue|cemetery|lake|mount|tower|forest|island|city|stone|room|hall/i.test(term));
  const anchor = story.detail || story.sceneAnchor || facts[0] || topic;
  return [
    `Give the audience one concrete way to enter ${topic}: ${anchor}${location ? `, connected to ${location}` : ''}.`,
    `Make the main event or motif of ${topic} easy to understand before the story widens.`,
    variants[0]?.claim ? `Show how a known variant shifts ${topic} while the main story remains recognizable.` : `Keep the stable core of ${topic} clear before later retellings enter.`,
    `Clarify the boundary between supported source material and uncertain interpretation around ${topic}.`,
    `Leave ${topic} with its strongest unresolved meaning rather than adding a new answer.`
  ];
}

function buildImagePrompts(subject, story, setting, mood, focuses) {
  const anchor = story.sceneAnchor || story.detail || story.excerpt || subject;
  const vocabulary = (story.subjectSpecificVocabulary || []).slice(0, 4).join(', ');
  return [
    `A ${cleanSetting(setting)} opens the scene around ${subject}, showing the subject as part of a believable world rather than a staged illustration. The lighting is restrained, the colors are muted, and the atmosphere feels ${mood}, with a realistic documentary texture and no exaggerated horror.`,
    `A grounded close view of the story's central image: ${anchor}. The important detail is visible inside a believable space, with natural shadows, restrained composition, and a calm mystery archive feeling.`,
    `A secondary scene presents a known variation or surrounding context for ${subject}, using ${vocabulary || story.category} as quiet visual anchors. The image feels grounded, source-aware, and distinct from the opening image.`,
    `An archive-style source scene shows notes, maps, clippings, or reference material connected to ${subject}. The frame should separate remembered tradition from uncertain later claims, with realistic paper texture and soft desk light.`,
    `A final reflective image shows ${subject} through the ideas of ${vocabulary || story.category}. The composition feels unresolved but readable, with soft contrast, subdued color, realistic surfaces, and enough empty space for narration or title text.`
  ];
}

function buildVisualGuide(subject, story, setting, mood, sceneFocuses, longformScript) {
  const sceneCount = Math.max(sceneFocuses.length, 1);
  const narrationScenes = distributeByScene(longformScript, sceneCount);
  return Array.from({ length: sceneCount }, (_, index) => {
    const sceneFocus = sceneFocuses[index] || sceneFocuses[sceneFocuses.length - 1];
    const sceneParts = narrationScenes[index].filter(Boolean);
    const sceneRole = sceneRoleForGeneratedScene(index);
    return {
      sceneRole,
      sceneFocus,
      directionTip: sceneFocus,
      voiceDirection: voiceDirectionForGeneratedScene(index, story, sceneFocus, sceneParts.join(' '), sceneRole),
      backgroundMusic: backgroundMusicForGeneratedScene(story, index, sceneFocus, sceneParts.join(' '), sceneRole),
      soundEffect: soundEffectForGeneratedScene(story, index, sceneFocus, sceneParts.join(' ')),
      visualDirection: visualDirectionForScene(subject, story, index),
      narrationParts: sceneParts.map((narration, partIndex) => ({
        narration,
        estimatedReadingTime: secondsToApproxLabel(estimatedNarrationSecondsFromText(narration)),
        creatorNote: creatorNoteForNarrationPart(subject, story, sceneFocus, narration, index, partIndex, sceneRole),
        visualBeats: visualBeatsForNarrationPart(subject, story, setting, mood, sceneFocus, narration, index, partIndex)
      }))
    };
  });
}

function distributeByScene(items, sceneCount) {
  if (!items.length) return Array.from({ length: sceneCount }, () => []);
  const scenes = Array.from({ length: sceneCount }, () => []);
  items.forEach((item, index) => {
    scenes[Math.min(sceneCount - 1, Math.floor(index * sceneCount / items.length))].push(item);
  });
  return scenes;
}

function sceneRoleForGeneratedScene(index) {
  return ['Hook', 'Core Story', 'Variant', 'Source Context', 'Closing Reflection'][index] || 'Production Beat';
}

function voiceDirectionForGeneratedScene(index, story = {}, sceneFocus = '', narration = '', sceneRole = sceneRoleForGeneratedScene(index)) {
  const topic = story.storyBrief?.topic || cleanSubject(story.title);
  const context = storyEntityText(story, topic);
  const text = `${sceneRole} ${sceneFocus} ${narration}`.toLowerCase();
  const pace = index === 0 ? 'Start slowly, then settle into a measured pace.' :
    index >= 4 ? 'Keep the pace gentle and leave a short pause before the final line.' :
      'Keep the pace steady, with clean pauses between ideas.';
  const emphasis = voiceEmphasisForScene(text, context);
  const tone = isDigitalPuzzleProfileContext(context)
    ? 'Use a quiet investigative tone with controlled curiosity.'
    : /myth|mythology|ancient|greek|egyptian|hymn|ritual/.test(context)
      ? 'Use a calm mythic documentary tone without sounding theatrical.'
      : 'Use a natural documentary tone with restrained tension.';
  return `${tone} ${pace} ${emphasis}`;
}

function voiceEmphasisForScene(text, context) {
  if (/source|record|hymn|variant|later|tradition|account|evidence/.test(text)) {
    return 'Emphasize source boundaries lightly, and do not turn uncertainty into drama.';
  }
  if (/closing|cycle|meaning|remains|final|ending|question/.test(text)) {
    return 'Let the final sentence land softly, with a reflective ending.';
  }
  if (/search|grief|mourning|lost|loss|taken|missing/.test(text)) {
    return 'Give the search or loss a little weight while staying composed.';
  }
  if (/rupture|murder|chest|coffin|underworld|descent|hades|death/.test(text)) {
    return 'Pause briefly before the turning point, then lower the voice slightly.';
  }
  if (isDigitalPuzzleProfileContext(context)) {
    return 'Give numbers, names, and clue terms clear emphasis without making them ominous.';
  }
  return 'Emphasize the main subject once, then return to an even delivery.';
}

function backgroundMusicForGeneratedScene(story, index, sceneFocus = '', narration = '', sceneRole = sceneRoleForGeneratedScene(index)) {
  const topic = story.storyBrief?.topic || cleanSubject(story.title);
  const context = storyEntityText(story, topic);
  const text = `${sceneRole} ${sceneFocus} ${narration}`.toLowerCase();
  const roleText = String(sceneRole || '').toLowerCase();
  const palette = isDigitalPuzzleProfileContext(context)
    ? ['Restrained Electronic Pulse', 'Low Digital Drone', 'Quiet Mystery Texture']
    : /egypt|osiris|isis|set|horus|duat|papyrus/.test(context)
      ? ['Ancient Ritual Ambient', 'Low Hand Drum Texture', 'Desert Night Drone']
      : /greek|demeter|persephone|hades|pomegranate|homeric/.test(context)
        ? ['Ancient Acoustic Ambient', 'Low Lyre Drone', 'Mediterranean Mystery Atmosphere']
        : /myth|mythology|ancient/.test(context)
          ? ['Mythic Ambient', 'Low Drums', 'Ancient Atmosphere']
          : ['Dark Ambient', 'Low Drone', 'Mystery Atmosphere'];
  const roleLead = /hook|opening/.test(roleText) ? 'Quiet Suspense Intro' :
    /source|record|variant|account/.test(text) ? 'Sparse Documentary Bed' :
      /closing|reflection/.test(roleText) ? 'Soft Reflective Drone' :
        /murder|underworld|loss|descent|rupture|missing/.test(text) ? 'Low Tension Underscore' :
          'Steady Storytelling Underscore';
  return unique([roleLead, ...palette]).slice(0, 4).join(', ');
}

function soundEffectForGeneratedScene(story, index, sceneFocus = '', narration = '') {
  const topic = story.storyBrief?.topic || cleanSubject(story.title);
  const context = storyEntityText(story, topic);
  const sceneText = `${sceneFocus} ${narration}`.toLowerCase();
  if (isPrometheusProfileContext(context)) {
    return [
      'fire crackle, high mountain wind, distant thunder',
      'small flame movement, low storm ambience',
      'eagle wings far above stone, restrained wind',
      'classical myth notes, soft page movement',
      'fire fading into mountain wind'
    ][index] || 'fire crackle and high mountain wind';
  }
  if (/video watch history|watch history|extra second|uploaded clip|platform record|platform dashboard|upload metadata/.test(context)) {
    return [
      'soft interface click, playback scrub, low screen-room tone',
      'quiet keyboard tap, muted notification tone',
      'screen ambience, subtle timeline scrub',
      'screenshot handling, soft desk room tone',
      'playback click fading into silence'
    ][index] || 'soft interface click and low screen-room tone';
  }
  if (/subway maintenance|sealed staircase|maintenance file|station diagrams?|worker accounts?|underground place/.test(context)) {
    return [
      'distant train vibration, station ventilation',
      'metal gate movement, low underground corridor ambience',
      'paper file movement, faint platform tone',
      'station diagram paper, muted transit room tone',
      'ventilation fading under distant train noise'
    ][index] || 'distant train vibration and station ventilation';
  }
  if (/quetzalcoatl|feathered serpent|ehecatl|mesoamerican/.test(context)) {
    return [
      'temple wind, soft ceremonial percussion, feather movement',
      'warm stone courtyard ambience, distant flute-like tone',
      'low ritual drum, wind across carved reliefs',
      'soft manuscript handling, quiet museum room tone',
      'dawn wind fading around a temple relief'
    ][index] || 'temple wind and restrained ceremonial ambience';
  }
  if (/wax[-\s]?winged owl|sealed letter|letter creature|messenger folklore/.test(context)) {
    return [
      'paper rustle, soft wing movement, candlelit room ambience',
      'wax seal press, quiet desk wood creak',
      'feathers moving in still air, muted envelope handling',
      'letter archive room tone, soft paper movement',
      'distant wingbeat fading into quiet paper rustle'
    ][index] || 'paper rustle and soft wing movement';
  }
  if (/timestamp|digital record|modern omen|time records/.test(context)) {
    return [
      'quiet device ambience, soft notification tone',
      'digital clock tick, low room tone',
      'cursor movement, muted phone vibration',
      'soft keyboard tap, quiet archive room',
      'notification tone fading into silence'
    ][index] || 'quiet device ambience';
  }
  if (isDigitalPuzzleProfileContext(context)) {
    return [
      'keyboard clicks, quiet modem-like digital texture',
      'printer noise, soft paper handling, low computer fan',
      'urban ambience near a physical clue location',
      'quiet archive room, page movement, faint keyboard taps',
      'low digital ambience fading into silence'
    ][index] || 'subtle digital ambience';
  }
  if (/demeter|persephone|hades|pomegranate|homeric|greek/.test(context)) {
    if (/source|hymn|variant|tradition|account/.test(sceneText)) return 'soft parchment movement, quiet ancient study ambience';
    if (/pomegranate|underworld|hades|descent|return/.test(sceneText)) return 'low underworld air, soft stone room tone';
    if (/search|grief|mourning|lost|taken|wanders/.test(sceneText)) return 'distant footsteps through dry grass, open field wind';
    if (/grain|crops|field|hunger|earth|famine/.test(sceneText)) return 'dry grain movement, low ground vibration, field wind';
    return ['gentle field wind, grass movement', 'open meadow wind, distant footsteps', 'low earth rumble, dry field air', 'soft parchment movement, temple room tone', 'warm field wind fading into stillness'][index] || 'minimal ancient outdoor ambience';
  }
  if (/osiris|isis|set|horus|nephthys|egyptian|papyrus|duat/.test(context)) {
    if (/source|papyrus|variant|tradition|account|ritual text/.test(sceneText)) return 'soft papyrus movement, quiet temple room tone';
    if (/river|nile|search|looking|seeks|finds/.test(sceneText)) return 'slow river water, desert wind, distant footsteps';
    if (/linen|restore|body|pieces|gathers|ritual|mourning/.test(sceneText)) return 'linen movement, low ritual-space ambience';
    if (/underworld|dead|duat|below|afterlife/.test(sceneText)) return 'deep underworld ambience, faint stone echo';
    if (/chest|coffin|sealed|murder|trapped|hidden/.test(sceneText)) return 'wooden chest creak, low stone chamber air';
    return ['desert wind, quiet temple ambience', 'sealed wood creak, low room tone', 'slow river water, linen movement', 'soft papyrus movement, temple room tone', 'desert wind fading under low ambience'][index] || 'minimal ancient ritual ambience';
  }
  if (/\bra(?:'s|s)?\b|solar boat|sun god|apep/.test(context)) {
    return [
      'desert wind, slow river movement, low ceremonial percussion',
      'warm wind, distant ritual ambience, soft water movement',
      'deep underworld ambience, low drum, distant serpent-like movement',
      'soft papyrus movement, temple room tone, distant wind',
      'dawn wind, quiet river ambience, fading ceremonial rhythm'
    ][index] || 'desert wind and low ritual ambience';
  }
  if (/green flash|sunset|refraction|horizon|phenomenon/.test(context)) {
    return [
      'coastal wind, gentle ocean waves',
      'quiet shoreline ambience, distant seabirds, soft atmospheric swell',
      'low ocean movement, wind over open water',
      'soft paper movement, quiet science archive room tone',
      'waves receding, open horizon wind'
    ][index] || 'coastal wind and quiet waves';
  }
  if (/clown|babysitter|statue/.test(context)) {
    return [
      'quiet house room tone, distant phone ring',
      'soft floor creak, low household ambience',
      'phone call ambience, faint room silence',
      'paper movement, muted indoor room tone',
      'still room tone, distant hallway creak'
    ][index] || 'quiet house ambience';
  }
  if (/bennington|triangle|forest|disappearance/.test(context)) {
    return [
      'cold forest wind, distant footsteps on leaves',
      'mountain trail ambience, low wind through trees',
      'soft search-party ambience, distant branch movement',
      'paper maps moving, quiet archive room',
      'empty forest wind fading out'
    ][index] || 'quiet forest wind';
  }
  if (/cooper|hijacking|airplane|parachute|ransom/.test(context)) {
    return [
      'airplane cabin hum, rain against window',
      'soft paper handling, low jet ambience',
      'wind rush, distant aircraft tone',
      'case file paper movement, muted office room tone',
      'open night wind, distant aircraft fading'
    ][index] || 'low aircraft ambience';
  }
  if (/green children|woolpit|village|children/.test(context)) {
    return [
      'quiet village field ambience, soft wind',
      'distant voices, village room tone, low fire ambience',
      'field wind, faint footsteps through grass',
      'old manuscript page movement, quiet room tone',
      'soft village evening ambience'
    ][index] || 'quiet village ambience';
  }
  if (/bray road|beast|werewolf|\broad\b/.test(context)) {
    return [
      'rural road night ambience, distant wind',
      'grass movement, low animal-like rustle',
      'tires on empty road, field wind',
      'paper clipping movement, quiet room tone',
      'empty roadside wind fading out'
    ][index] || 'rural night ambience';
  }
  if (/basilisk|bestiary|cockatrice/.test(context)) {
    return [
      'stone chamber ambience, dry wind',
      'faint reptilian movement, low medieval room tone',
      'soft scrape on stone, distant wind',
      'old manuscript page movement, quiet candlelit room',
      'still stone room tone fading out'
    ][index] || 'stone chamber ambience';
  }
  if (/agartha|hollow earth|hidden world/.test(context)) {
    return [
      'deep cave wind, distant low resonance',
      'subterranean ambience, soft stone echo',
      'mountain wind, faint underground rumble',
      'old map paper movement, quiet archive room',
      'distant cave resonance fading out'
    ][index] || 'deep cave ambience';
  }
  if (/fountain of youth|spring|water|youth/.test(context)) {
    return [
      'spring water, forest birds at a distance',
      'gentle water movement, soft leaves',
      'old shoreline ambience, quiet footsteps',
      'map paper movement, low room tone',
      'spring water fading into silence'
    ][index] || 'gentle spring water';
  }
  if (/mjolnir|thor|hammer|norse/.test(context)) {
    return [
      'distant thunder, low forge resonance',
      'metal weight on stone, storm wind',
      'soft thunder roll, old hall ambience',
      'page movement, quiet myth archive room',
      'distant thunder fading out'
    ][index] || 'distant thunder and low metal resonance';
  }
  if (/black cat|superstition/.test(context)) {
    return [
      'quiet street ambience, soft footsteps',
      'low night wind, faint indoor hearth tone',
      'street crossing ambience, distant bell',
      'old page movement, quiet folklore archive room',
      'soft night street ambience fading'
    ][index] || 'quiet street ambience';
  }
  if (index === 0 && /\broad\b|avenue|hitchhiker|\bcar\b|driver/.test(context)) return 'distant road ambience, soft night wind';
  if (/storm|hunt|wind|forest|sky/.test(context)) return index <= 1 ? 'distant wind, low thunder, faint horn-like ambience' : 'cold wind, distant movement';
  if (/mount|kingdom|temple|monastery|shambhala|olympus/.test(context)) return 'high mountain wind, distant bell ambience';
  if (/\b(water|lake|river|sea|island)\b/.test(context)) return 'low water ambience, distant wind';
  if (index === 3) return 'quiet paper movement, soft room tone';
  return '';
}

function creatorNoteForNarrationPart(subject, story, sceneFocus, narration, sceneIndex, partIndex, sceneRole = sceneRoleForGeneratedScene(sceneIndex)) {
  const topic = story.storyBrief?.topic || subject;
  const noteContext = creatorNoteContext(subject, story, sceneFocus, narration, sceneRole);
  const demeterNote = demeterCreatorNoteForNarrationPart(noteContext);
  if (demeterNote) return demeterNote;

  const topicAwareNote = topicAwareCreatorNoteForNarrationPart(noteContext);
  if (topicAwareNote) return topicAwareNote;

  if (noteContext.hasVariantLanguage) {
    return `${noteContext.subjectLabel} uses this part to separate variant material from the stable core of the story. Keep the note focused on the version, source limit, or disputed claim actually named in the narration.`;
  }
  if (noteContext.hasSourceLanguage) {
    return `${noteContext.subjectLabel} needs a clear source boundary here. Treat the named record, source, or uncertainty as context for the story, not as proof beyond what the narration states.`;
  }
  if (noteContext.hasClosingLanguage) {
    return `${noteContext.subjectLabel} should close on the unresolved meaning already present in this part. Do not add a new answer, motive, or explanation that the narration does not support.`;
  }
  if (noteContext.sceneRole === 'Hook') {
    return `${noteContext.subjectLabel} needs one concrete opening fact before the story expands. Keep the relationship, event, or object named in this part distinct from later interpretation.`;
  }
  return `${noteContext.subjectLabel} should keep this part tied to its stated event or relationship. Avoid adding outside incidents, extra motives, or claims not present in the current narration.`;
}

function creatorNoteContext(subject, story, sceneFocus, narration, sceneRole) {
  const brief = story.storyBrief || {};
  const topic = brief.topic || subject;
  const vocabulary = [
    ...(brief.knownNames || []),
    ...(brief.coreStoryElements || []),
    ...(story.subjectSpecificVocabulary || []),
    ...(story.contentDNA?.subjectSpecificVocabulary || [])
  ].filter(Boolean);
  const text = String(narration || '').toLowerCase();
  return {
    topic,
    subjectLabel: cleanSubjectLabel(topic || subject || story.title || 'This subject'),
    sceneRole,
    sceneFocus,
    narration,
    text,
    knownNames: brief.knownNames || [],
    coreStoryElements: brief.coreStoryElements || [],
    subjectSpecificVocabulary: story.subjectSpecificVocabulary || [],
    contentType: brief.contentType || story.categorySlug || story.contentType || '',
    vocabulary,
    matchedNames: matchedContextTerms(text, brief.knownNames || []),
    matchedCoreElements: matchedContextTerms(text, brief.coreStoryElements || []),
    matchedSubjectVocabulary: matchedContextTerms(text, [
      ...(story.subjectSpecificVocabulary || []),
      ...(story.contentDNA?.subjectSpecificVocabulary || [])
    ]),
    hasVariantLanguage: /variant|version|retelling|later|different|differs|differ|readings|accounts/.test(text),
    hasSourceLanguage: /source|record|uncertain|evidence|trace|support|surviving|hymn|account/.test(text),
    hasClosingLanguage: /in the end|ending|final|returns?|descends?|cycle|meaning|remains/.test(text)
  };
}

function topicAwareCreatorNoteForNarrationPart(context) {
  const text = context.text;
  const matchedNames = context.matchedNames.filter((name) => !/\s+and\s+/i.test(name));
  const primaryNames = matchedNames.length
    ? matchedNames.join(', ')
    : context.subjectLabel;
  const coreElement = context.matchedCoreElements[0] || context.matchedSubjectVocabulary[0] || '';

  if (/ancient .* material|ritual texts|temple traditions|later summaries|greek and roman|single fixed version|details can shift|main shape remains/.test(text)) {
    return `Mark the source boundary clearly. Treat older ritual material, temple tradition, and later retelling as related layers, not as one fixed source with identical details.`;
  }
  if (/culture imagined order surviving violence|breaks the body.*continues the line|rules below.*lasting memory|ritual and kingship across/.test(text)) {
    return `Close by connecting the actual chain named here: violence, search, restoration, succession, rule below, and lasting ritual memory. Avoid turning the ending into a simple happy return.`;
  }
  if (/both lost and made powerful|transforms mourning into action|links grief with ritual care|restoration does not erase|wound meaning/.test(text)) {
    return `Keep the reflection tied to the Part's stated ideas: loss, mourning, ritual care, power after death, and meaning after damage. Do not add a new moral explanation.`;
  }
  if (/gathers what remains|nephthys|divine helpers|protect the dead|ritual care|sacred order/.test(text)) {
    return `Separate the stable restoration pattern from helper details that change by account. The Part should center ritual care, mourning, and reassembly without flattening variant traditions.`;
  }
  if (/not the same as a simple resurrection|simple resurrection|underworld|lord of the dead|no longer return as an ordinary living king|life above|power continues below/.test(text)) {
    return `Clarify that restoration changes the figure's role. The Part should distinguish renewed sacred power from a return to ordinary life or the same earthly kingship.`;
  }
  if (/birth of|child|royal line|succession|inheritance|living king|rules the dead|answer .* violence/.test(text)) {
    return `Use this Part to connect succession with the earlier loss. Keep child, rival, royal line, living rule, and rule over the dead in their correct relationships.`;
  }
  if (/family of gods|sister and wife|ruler|giver of order|kingship|stands against/.test(text)) {
    return `Establish the relationship map around ${primaryNames}. Keep ruler, consort, opponent, order, jealousy, and restoration clear before later events complicate the myth.`;
  }
  if (/murders?|killed|slays?|chest|coffin|sealed|sent away|trapped|hidden|removed/.test(text)) {
    return `Treat the murder and containment detail as the central rupture in this Part. If a chest, coffin, or hidden body is named, present it as a versioned tradition rather than a universal detail.`;
  }
  if (/search|searches|looking for|following the trace|what has been taken|grief becomes movement/.test(text)) {
    return `Focus on the search as an active response to loss. The important point is movement, mourning, and persistence, not a quick discovery or added rescue episode.`;
  }
  if (/cutting it apart|cut apart|dismember|dismembered|scattering|scattered|pieces|piece by piece|broken body/.test(text)) {
    return `Keep the damaged body and scattered pieces within the retelling limits named here. Show restoration as a difficult process, not an instant reversal of the murder.`;
  }
  if (coreElement && context.hasVariantLanguage) {
    return `Keep ${coreElement} tied to the version described in this Part. Do not treat shifting details as a single fixed account unless the narration states that clearly.`;
  }
  return '';
}

function matchedContextTerms(text, terms) {
  return unique((terms || [])
    .map((term) => cleanSubjectLabel(term))
    .filter((term) => term && hasExactContextTerm(text, term))
  );
}

function demeterCreatorNoteForNarrationPart(context) {
  const topicText = `${context.topic} ${context.knownNames.join(' ')} ${context.subjectSpecificVocabulary.join(' ')} ${context.contentType}`.toLowerCase();
  if (!/demeter/.test(topicText) || !/persephone/.test(topicText)) return '';
  const text = context.text;

  if (/mother and a daughter|grain and growing fields|gathering flowers/.test(text)) {
    return 'Use this Part to establish the family relationship before the abduction. Demeter should be understood as mother and grain goddess, while Persephone begins above ground among flowers and companions.';
  }
  if (/hades|ground opens|underworld|carries persephone away/.test(text) && /center of the myth|rupture|break/.test(text)) {
    return 'Treat Hades taking Persephone below as the central rupture. Do not add dialogue, chase details, or extra divine actions beyond the abduction and the shift from meadow to underworld.';
  }
  if (/searches the earth|daughter has vanished|demeter soon realizes/.test(text)) {
    return "This Part is about Demeter discovering the loss and searching. Keep the emotional center on a mother's grief becoming divine withdrawal, not on solving the disappearance quickly.";
  }
  if (/persephone's choice|abduction|queen of the underworld|taken and transformed/.test(text)) {
    return "Present Persephone's agency as a point that changes across versions and later readings. Do not make one interpretation override the older abduction pattern or her underworld transformation.";
  }
  if (/pomegranate seeds|seeds in the underworld|number of seeds|versions differ/.test(text)) {
    return 'Keep the pomegranate seeds as the binding detail with variable counts and meanings. Avoid treating one number of seeds as a universal rule across all versions.';
  }
  if (/homeric hymn to demeter|fullest surviving ancient account|later greek and roman/.test(text)) {
    return 'Use this Part to name the Homeric Hymn to Demeter as the main surviving ancient account. Separate that source layer from later Greek and Roman simplifications.';
  }
  if (/zeus becomes involved|compromise is reached|return to her mother|must also return below/.test(text)) {
    return "Clarify that Zeus intervenes because Demeter's refusal threatens the world. Present the compromise and partial return without turning divine negotiation into modern legal judgment.";
  }
  if (/earth can bloom again|descends|seasons|agriculture|cycle of growth and absence/.test(text)) {
    return "Tie Persephone's return and descent to agriculture, seasons, and repeated absence. The point is the cycle of reunion and loss, not a simple explanation of spring.";
  }
  if (/fields begin to fail|grain no longer grows|human beings face hunger/.test(text)) {
    return "Connect Demeter's grief and anger to failing grain and human hunger. The crisis is agricultural and sacred, not merely bad weather or a seasonal background detail.";
  }
  if (/not a simple rescue|separation remains|death|renewal|cycle itself/.test(text)) {
    return 'Close on the unresolved structure of the myth: mother and daughter, surface and underworld, death and renewal. Avoid reducing the ending to one final symbolic answer.';
  }
  return '';
}

function cleanSubjectLabel(value) {
  return String(value || '').replace(/\s+YouTube Script$/i, '').trim() || 'This subject';
}

function visualBeatsForNarrationPart(subject, story, setting, mood, sceneFocus, narration, sceneIndex, partIndex) {
  const seconds = estimatedNarrationSecondsFromText(narration);
  const count = seconds >= 23 ? 3 : seconds >= 13 ? 2 : 1;
  const base = visualBeatSeeds(subject, story, setting, mood, sceneFocus, narration, sceneIndex, partIndex);
  return base.slice(0, count).map((seed, index) => ({
    label: `Image Prompt ${index + 1}`,
    imagePrompt: seed,
    motionPrompt: motionPromptForVisualBeat(seed, index, story, narration, sceneIndex, partIndex)
  }));
}

function visualBeatSeeds(subject, story, setting, mood, sceneFocus, narration, sceneIndex, partIndex) {
  const profile = storyProductionProfile(subject, story);
  const plan = imagePromptPlanForNarrationPart(subject, story, setting, mood, sceneFocus, narration, sceneIndex, partIndex, profile);
  return structuredImagePrompts(plan);
}

function imagePromptPlanForNarrationPart(subject, story, setting, mood, sceneFocus, narration, sceneIndex, partIndex, profile) {
  const topic = story.storyBrief?.topic || subject || profile.mainSubject || cleanSubject(story.title);
  const text = String(narration || '').toLowerCase();
  const candidates = promptCandidatesForNarration(story, topic, narration);
  const culture = imagePromptCultureContext(story, text);
  const fallbackSetting = cleanSetting(setting || profile.setting || settingForStory(story));
  const base = {
    topic,
    subject: candidates[0] || topic,
    supportingSubject: candidates[1] || '',
    object: candidates[2] || '',
    actionOrState: `the central event from this narration part is visible without adding extra characters or incidents`,
    setting: safePromptPhrase(fallbackSetting),
    detail: safePromptPhrase(sceneFocus || story.sceneAnchor || story.detail || topic),
    sourceObject: sourceObjectForImagePrompt(story, text),
    composition: imagePromptComposition(sceneIndex, partIndex, 0),
    lighting: imagePromptLighting(story, text, profile, mood),
    atmosphere: imagePromptAtmosphere(story, text, profile, mood),
    culturalContext: culture,
    exclusions: imagePromptExclusions(story, text),
    sceneIndex,
    partIndex
  };

  return refineImagePromptPlan(base, text);
}

function refineImagePromptPlan(plan, text) {
  const next = { ...plan };
  const hasGreekContext = /\b(demeter|persephone|hades|zeus|homeric|pomegranate|greek)\b/.test(text);
  const hasEgyptianContext = /\b(osiris|isis|set|horus|nephthys|egyptian|papyrus)\b/.test(text);

  if (hasEgyptianContext && /family of gods|giver of order|sister and wife|\bset\b stands/.test(text)) {
    next.subject = validPromptSubject('Osiris, Isis, and Set', plan.subject);
    next.actionOrState = 'The divine family relationship is arranged around rule, loyalty, opposition, and fragile order';
    next.setting = 'an ancient Egyptian palace or temple space under warm stone light';
    next.detail = 'Osiris as ruler, Isis as loyal consort, and Set as the opposing force';
  } else if (hasEgyptianContext && /\bset\b murders osiris|murders osiris|chest|coffin|sealed and sent away|trapped|hidden|removed/.test(text)) {
    next.subject = validPromptSubject('Osiris and Set', plan.subject);
    next.actionOrState = 'A sealed chest or coffin becomes the central sign of Osiris being trapped and removed';
    next.setting = 'an ancient Egyptian chamber with restrained royal and funerary detail';
    next.detail = 'the murder and containment tradition without graphic violence';
  } else if (hasEgyptianContext && /isis begins looking|search gives|following the trace|finding a body|grief becomes movement/.test(text)) {
    next.subject = validPromptSubject('Isis', plan.subject);
    next.actionOrState = 'Isis searches through signs and places for the lost body of Osiris';
    next.setting = 'a Nile-side Egyptian landscape with temple fragments and desert light';
    next.detail = 'mourning turned into movement, intelligence, and sacred persistence';
  } else if (hasEgyptianContext && /cutting it apart|scattering the pieces|piece by piece|broken body|damage and recovery/.test(text)) {
    next.subject = validPromptSubject('Osiris', plan.subject);
    next.actionOrState = 'Fragmented funerary wrappings and symbolic body pieces suggest the difficult restoration of Osiris';
    next.setting = 'a solemn Egyptian funerary space with ritual cloth and stone';
    next.detail = 'reassembly after damage, shown symbolically rather than graphically';
  } else if (hasEgyptianContext && /gathers what remains|nephthys|divine helpers|protect the dead god|ritual care|sacred order/.test(text)) {
    next.subject = validPromptSubject('Isis and Nephthys', plan.subject);
    next.actionOrState = 'Isis and a possible helper figure mourn and protect what remains of Osiris';
    next.setting = 'an ancient Egyptian ritual space with linen, stone, and dim sacred light';
    next.detail = 'restoration through mourning, protection, and ritual care';
  } else if (hasEgyptianContext && /not the same as a simple resurrection|simple resurrection|underworld|lord of the dead|ritually answered|power continues below/.test(text)) {
    next.subject = validPromptSubject('Osiris', plan.subject);
    next.actionOrState = 'Osiris is shown as a transformed ruler of the dead rather than an ordinary living king';
    next.setting = 'a symbolic Egyptian underworld space with subdued gold and deep shadow';
    next.detail = 'death answered by ritual power, not erased';
  } else if (hasEgyptianContext && /birth of horus|horus becomes|royal line|succession|living king|osiris rules the dead/.test(text)) {
    next.subject = validPromptSubject('Horus and Osiris', plan.subject);
    next.actionOrState = 'Horus carries the royal line forward while Osiris remains connected to rule over the dead';
    next.setting = 'an ancient Egyptian royal-symbolic scene with temple stone and horizon light';
    next.detail = 'succession linking the living king, the dead king, and divine order';
  } else if (hasEgyptianContext && /ancient egyptian material|ritual texts|temple traditions|later summaries|greek and roman writers|details can shift/.test(text)) {
    next.subject = validPromptSubject('Osiris and Isis', plan.subject);
    next.actionOrState = 'Papyrus fragments, temple relief details, and later reference notes sit beside each other without merging into one fixed version';
    next.setting = 'a museum-style Egyptian reference table with papyrus-like fragments and carved relief details';
    next.detail = 'source layers around murder, search, restoration, and succession';
  } else if (hasEgyptianContext && /both lost and made powerful|transforms mourning into action|lord of the dead|ritual care|wound meaning/.test(text)) {
    next.subject = validPromptSubject('Osiris and Isis', plan.subject);
    next.actionOrState = 'Osiris appears powerful through loss while Isis turns mourning into sacred action';
    next.setting = 'a symbolic Egyptian funerary landscape between warm gold and deep shadow';
    next.detail = 'grief, ritual care, kingship, and hope beyond death';
  } else if (hasEgyptianContext && /culture imagined order surviving violence|\bset\b breaks the body|isis searches and restores|horus continues|rules below|lasting memory/.test(text)) {
    next.subject = validPromptSubject('Osiris, Isis, Horus, and Set', plan.subject);
    next.actionOrState = 'The mythic chain of violence, search, restoration, succession, and rule below is shown through separated symbolic figures';
    next.setting = 'an ancient Egyptian symbolic composition with temple stone, desert light, and underworld shadow';
    next.detail = 'order surviving violence through ritual, kingship, and memory';
  } else if (hasGreekContext && /mother and a daughter|goddess of grain|growing fields|youth|flowers|gathering flowers|meadow/.test(text)) {
    next.subject = validPromptSubject('Demeter and Persephone', plan.subject);
    next.actionOrState = 'Persephone gathers flowers in an open meadow while Demeter is suggested through grain, field light, and maternal presence';
    next.setting = 'a sunlit ancient Greek meadow bordered by grain fields';
    next.detail = 'a peaceful surface world before the loss begins';
  } else if (hasGreekContext && /ground opens|\bhades\b|carries persephone away|taken beneath/.test(text)) {
    next.subject = validPromptSubject('Persephone and Hades', plan.subject);
    next.actionOrState = 'The earth opens at the edge of a flowered field, turning the bright landscape into a threshold toward the underworld';
    next.setting = 'an ancient Greek field split by a dark underworld entrance';
    next.detail = 'the sudden rupture between the living landscape and the world below';
  } else if (hasGreekContext && /searches the earth|daughter has vanished|demeter soon realizes|any sign of persephone|withdraws/.test(text)) {
    next.subject = validPromptSubject('Demeter', plan.subject);
    next.actionOrState = 'Demeter searches across the human and divine world for any sign of her missing daughter';
    next.setting = 'a wide ancient Greek landscape with roads, fields, and distant shrines';
    next.detail = 'grief turning into a visible search';
  } else if (hasGreekContext && /fields begin to fail|grain no longer grows|human beings face hunger|refuses the harvest|hunger/.test(text)) {
    next.subject = validPromptSubject('Demeter', plan.subject);
    next.actionOrState = 'Grain fields wither as Demeter withdraws her power from the harvest';
    next.setting = 'a dry ancient agricultural field under a pale sky';
    next.detail = 'failing grain and human scarcity caused by divine grief';
  } else if (hasGreekContext && /persephone's choice|queen of the underworld|taken and transformed|place below/.test(text)) {
    next.subject = validPromptSubject('Persephone', plan.subject);
    next.actionOrState = 'Persephone stands in the underworld with both loss and authority present in the same image';
    next.setting = 'a shadowed Greek underworld hall with restrained sacred detail';
    next.detail = 'the tension between abduction, transformation, and later interpretation';
  } else if (hasGreekContext && /pomegranate seeds|seeds in the underworld|number of seeds|small act creates a lasting condition|food becomes a bond/.test(text)) {
    next.subject = validPromptSubject('Persephone', plan.subject);
    next.actionOrState = 'Pomegranate seeds rest near Persephone as a quiet binding detail between two worlds';
    next.setting = 'a dim underworld threshold with Greek ritual symbolism';
    next.detail = 'the small act that creates a lasting return condition';
  } else if (hasGreekContext && /homeric hymn to demeter|surviving ancient account|later greek and roman|ritual shape|sacred power/.test(text)) {
    next.subject = validPromptSubject('Homeric Hymn to Demeter', plan.subject);
    next.actionOrState = 'Greek manuscript fragments and ritual objects suggest the ancient source layer without legible wording';
    next.setting = 'a museum-style table with aged Greek manuscript fragments and agricultural votive objects';
    next.detail = 'source context around Demeter, Persephone, grief, and ritual settlement';
  } else if (hasGreekContext && /zeus becomes involved|compromise is reached|return to her mother|must divide her time|world cannot continue/.test(text)) {
    next.subject = validPromptSubject('Demeter and Persephone', plan.subject);
    next.actionOrState = 'A divine compromise is suggested through Demeter above, Persephone at the threshold, and Zeus represented by distant storm light';
    next.setting = 'a symbolic Greek boundary between harvest fields and the underworld';
    next.detail = 'partial return rather than a complete rescue';
  } else if (hasGreekContext && /earth can bloom again|descends|seasons|agriculture|cycle of growth and absence|spring and barrenness/.test(text)) {
    next.subject = validPromptSubject('Demeter and Persephone', plan.subject);
    next.actionOrState = 'Blooming grain and shadowed earth show the cycle of return and descent';
    next.setting = 'an ancient Greek field divided between spring growth and underworld shadow';
    next.detail = 'seasonal renewal tied to reunion and absence';
  } else if (hasGreekContext && /not a simple rescue|separation remains|death|renewal|fragile hope|cycle itself/.test(text)) {
    next.subject = validPromptSubject('Demeter and Persephone', plan.subject);
    next.actionOrState = 'Mother and daughter are reunited while the underworld remains present at the edge of the frame';
    next.setting = 'a symbolic Greek landscape split between bright harvest and dark descent';
    next.detail = 'return, loss, death, renewal, and the unresolved cycle';
  }

  return normalizeImagePromptPlan(next);
}

function structuredImagePrompts(plan) {
  const variants = [
    {
      subject: plan.subject,
      actionOrState: plan.actionOrState,
      setting: plan.setting,
      composition: plan.composition,
      detail: plan.detail
    },
    {
      subject: plan.supportingSubject || plan.subject,
      actionOrState: plan.detail,
      setting: plan.setting,
      composition: imagePromptComposition(plan.sceneIndex, plan.partIndex, 1),
      detail: plan.actionOrState
    },
    {
      subject: plan.sourceObject,
      actionOrState: `source-aware visual context for ${plan.topic}, keeping variants and interpretation separate`,
      setting: sourceSettingForImagePrompt(plan),
      composition: imagePromptComposition(plan.sceneIndex, plan.partIndex, 2),
      detail: plan.detail
    }
  ];

  return variants.map((variant) => assembleStructuredImagePrompt({ ...plan, ...variant }));
}

function assembleStructuredImagePrompt(plan) {
  const sentences = [];
  const subject = validPromptSubject(plan.subject, plan.topic);
  const setting = safePromptPhrase(plan.setting);
  const action = safePromptPhrase(plan.actionOrState);
  const detail = safePromptPhrase(plan.detail);
  const composition = safePromptPhrase(plan.composition);
  const lighting = safePromptPhrase(plan.lighting);
  const atmosphere = safePromptPhrase(plan.atmosphere);
  const culture = safePromptPhrase(plan.culturalContext);

  sentences.push(`${capitalizeSentence(setting)} presents ${subject}.`);
  sentences.push(`${promptActionSentence(action)}.`);
  sentences.push(`${capitalizeSentence(composition)} uses ${lighting}, ${atmosphere}, and ${culture}.`);
  if (detail && detail !== action) {
    sentences.push(`The image should emphasize ${emphasisPhrase(detail)}.`);
  }
  if (plan.exclusions) {
    sentences.push(plan.exclusions);
  }
  return cleanImagePrompt(sentences.join(' '));
}

function promptCandidatesForNarration(story, topic, narration) {
  const text = String(narration || '');
  const lower = text.toLowerCase();
  const brief = story.storyBrief || {};
  const configured = [
    ...(brief.knownNames || []),
    ...(story.subjectSpecificVocabulary || []),
    ...(story.contentDNA?.subjectSpecificVocabulary || [])
  ];
  const properNames = text.match(/\b[A-Z][a-z]+(?:\s+(?:and|of|to|the|[A-Z][a-z]+))*\b/g) || [];
  return unique([...configured, ...properNames, topic])
    .map((candidate) => cleanPromptCandidate(candidate))
    .filter((candidate) => isValidPromptCandidate(candidate) && hasCandidateInTextOrTopic(lower, candidate, topic))
    .slice(0, 6);
}

function promptActionSentence(value) {
  const phrase = safePromptPhrase(value);
  if (!phrase) return 'Show the central visual idea from this narration part.';
  if (/\b(is|are|becomes|become|shows?|suggests?|searches|gathers|stands|opens|rests?|carries|appears|turns|uses|presents|links|sits|continues|rules|withers?|mourns?|protects?)\b/i.test(phrase)) {
    return capitalizeSentence(phrase);
  }
  return `Show ${phrase.replace(/^\bshow\b\s*/i, '')}`;
}

function emphasisPhrase(value) {
  return safePromptPhrase(value)
    .replace(/^The\b/, 'the')
    .replace(/^A\b/, 'a')
    .replace(/^An\b/, 'an');
}

function hasCandidateInTextOrTopic(text, candidate, topic) {
  const value = String(candidate || '').toLowerCase();
  const topicText = String(topic || '').toLowerCase();
  return hasExactContextTerm(text, value) || value === topicText;
}

function cleanPromptCandidate(candidate) {
  return String(candidate || '')
    .replace(/\s+/g, ' ')
    .replace(/[,:;]+$/g, '')
    .trim();
}

function isValidPromptCandidate(candidate) {
  const value = String(candidate || '').trim();
  if (!value) return false;
  const lower = value.toLowerCase();
  const stopwords = new Set([
    'and',
    'or',
    'but',
    'with',
    'without',
    'of',
    'to',
    'from',
    'this',
    'that',
    'story',
    'part',
    'scene',
    'subject',
    'version',
    'meaning',
    'article',
    'record',
    'versions',
    'later',
    'some',
    'the',
    'a',
    'an',
    'in',
    'on',
    'by',
    'for',
    'restoration',
    'seasons',
    'egyptian myth',
    'greek myth',
    'myth',
    'context',
    'source'
  ]);
  if (stopwords.has(lower)) return false;
  if (/^(and|or|but|with|without|of|to|from)\b|\b(and|or|but|with|without|of|to|from)$/.test(lower)) return false;
  if (/^(the|a|an)\s*$/.test(lower)) return false;
  if (/^(at first|from the start|in the|the story|later traditions|ancient egyptian material)$/i.test(value)) return false;
  return /[a-zA-Z]{3,}/.test(value);
}

function validPromptSubject(value, fallback) {
  const candidate = cleanPromptCandidate(value);
  if (isValidPromptCandidate(candidate)) return candidate;
  const backup = cleanPromptCandidate(fallback);
  if (isValidPromptCandidate(backup)) return backup;
  return 'the central mythic subject';
}

function normalizeImagePromptPlan(plan) {
  const topic = validPromptSubject(plan.topic, 'the story subject');
  return {
    ...plan,
    topic,
    subject: validPromptSubject(plan.subject, topic),
    supportingSubject: isValidPromptCandidate(plan.supportingSubject) ? cleanPromptCandidate(plan.supportingSubject) : '',
    sourceObject: safePromptPhrase(plan.sourceObject || sourceObjectForImagePrompt({}, '')),
    actionOrState: safePromptPhrase(plan.actionOrState || 'appears through the event named in this narration part'),
    setting: safePromptPhrase(plan.setting || 'a source-aware mythic setting'),
    detail: safePromptPhrase(plan.detail || topic),
    composition: safePromptPhrase(plan.composition || 'balanced documentary composition'),
    lighting: safePromptPhrase(plan.lighting || 'soft natural light'),
    atmosphere: safePromptPhrase(plan.atmosphere || 'restrained mythic atmosphere'),
    culturalContext: safePromptPhrase(plan.culturalContext || 'source-aware cultural context'),
    exclusions: imagePromptExclusions({}, `${plan.actionOrState || ''} ${plan.setting || ''}`)
  };
}

function safePromptPhrase(value) {
  return String(value || '')
    .replace(/\bappears clearly in the frame\b/gi, 'is presented as a clear visual detail')
    .replace(/\brestrained restrained\b/gi, 'restrained')
    .replace(/\baround and\b/gi, 'around the central subject')
    .replace(/\bcenters and\b/gi, 'centers the central subject')
    .replace(/\bsome a\b/gi, 'a')
    .replace(/\bThe story does\b/gi, 'The scene holds')
    .replace(/\s+/g, ' ')
    .replace(/\s+[,.;]/g, (match) => match.trim())
    .replace(/\b(and|or|but|with|without|of|to|from)\s*$/i, '')
    .trim();
}

function cleanImagePrompt(prompt) {
  let value = String(prompt || '')
    .replace(/\bavoid no\b/gi, 'No')
    .replace(/\bexclude no\b/gi, 'No')
    .replace(/\bwithout no\b/gi, 'No')
    .replace(/\brestrained restrained\b/gi, 'restrained')
    .replace(/\baround and\b/gi, 'around the central subject')
    .replace(/\bscene around and\b/gi, 'scene around the central subject')
    .replace(/\bcenters and\b/gi, 'centers the central subject')
    .replace(/\bsome a\b/gi, 'a')
    .replace(/\s+/g, ' ')
    .trim();
  value = value
    .split(/(?<=\.)\s+/)
    .map((sentence) => sentence.replace(/\b(and|or|but|with|without|of|to|from)\s*\.$/i, '.').trim())
    .filter(Boolean)
    .join(' ');
  return value.endsWith('.') ? value : `${value}.`;
}

function imagePromptCultureContext(story, text) {
  if (/\b(egypt|egyptian|osiris|isis|set|horus|nephthys|nile|pharaoh|papyrus)\b/.test(text)) {
    return 'ancient Egyptian mythic context';
  }
  if (/\b(greek|demeter|persephone|hades|zeus|homeric|olympus|pomegranate)\b/.test(text)) {
    return 'ancient Greek mythic context';
  }
  if (/myth|god|goddess|underworld|temple|ritual/.test(text)) {
    return 'ancient mythic context';
  }
  return `${story.categorySlug || 'folklore'} context`;
}

function imagePromptLighting(story, text, profile, mood) {
  if (/underworld|dead|death|coffin|funerary|shadow|below/.test(text)) return 'low sacred light and deep controlled shadow';
  if (/meadow|flowers|bloom|spring|return|harvest|grain/.test(text)) return 'soft natural daylight with warm grain tones';
  if (/source|hymn|texts|temple traditions|greek and roman|material|fragments/.test(text)) return 'soft museum light with muted material texture';
  return safePromptPhrase(profile.timeOfDay || `low natural light for a ${mood || 'mysterious'} mood`);
}

function imagePromptAtmosphere(story, text, profile, mood) {
  if (/source|hymn|texts|temple traditions|greek and roman|material|fragments/.test(text)) return 'quiet source-aware atmosphere';
  if (/death|underworld|coffin|murder|grief|vanished|loss/.test(text)) return 'restrained solemn myth atmosphere';
  if (/return|bloom|renewal|harvest|spring/.test(text)) return 'restrained atmosphere of return and renewal';
  return safePromptPhrase(profile.atmosphere || `restrained ${mood || 'mythic'} atmosphere`);
}

function imagePromptComposition(sceneIndex, partIndex, beatIndex) {
  const options = [
    'wide composition with a clear central figure and readable surrounding space',
    'medium composition focused on the main symbolic detail',
    'balanced source-context composition with objects separated clearly'
  ];
  return options[(sceneIndex + partIndex + beatIndex) % options.length];
}

function sourceObjectForImagePrompt(story, text) {
  if (/homeric hymn|greek and roman|\b(demeter|persephone|zeus)\b/.test(text)) {
    return 'unreadable Greek manuscript fragments and agricultural votive objects';
  }
  if (/ancient egyptian|\b(osiris|isis|set|horus|nephthys|papyrus)\b|temple/.test(text)) {
    return 'papyrus-like fragments and Egyptian temple relief details';
  }
  if (/source|record|text|material|variant|retelling/.test(text)) {
    return 'source fragments and reference objects';
  }
  return 'symbolic reference objects connected to the narration part';
}

function sourceSettingForImagePrompt(plan) {
  if (/Egyptian/i.test(plan.culturalContext)) return 'a museum-style Egyptian reference table under soft light';
  if (/Greek/i.test(plan.culturalContext)) return 'a museum-style Greek reference table under soft light';
  return 'a neutral source-reference table under soft light';
}

function imagePromptExclusions(story, text) {
  const lower = String(text || '').toLowerCase();
  const items = ['readable text', 'logos', 'watermarks', 'modern objects', 'cartoon style'];
  if (/death|dead|murder|body|coffin|underworld|violence|dismember|cutting|pieces/.test(lower)) {
    items.unshift('graphic gore');
  }
  if (/source|text|hymn|papyrus|manuscript|fragments|reference/.test(lower)) {
    items.push('legible fake writing');
  }
  return `No ${joinPromptList(unique(items))}.`;
}

function joinPromptList(items) {
  const values = (items || []).filter(Boolean);
  if (values.length <= 1) return values[0] || 'unrelated elements';
  return `${values.slice(0, -1).join(', ')}, or ${values[values.length - 1]}`;
}

function storyProductionProfile(subject, story) {
  const topic = story.storyBrief?.topic || subject || cleanSubject(story.title);
  const context = `${topic} ${story.title || ''} ${story.categorySlug || ''} ${(story.subjectSpecificVocabulary || []).join(' ')} ${story.sceneAnchor || ''} ${story.detail || ''}`.toLowerCase();
  const defaultProfile = {
    mainSubject: topic,
    setting: cleanSetting(settingForStory(story)),
    places: [cleanSetting(settingForStory(story)), 'a quiet archive desk connected to the story'],
    objects: unique([
      story.sceneAnchor || story.detail || topic,
      ...(story.subjectSpecificVocabulary || []).slice(0, 3)
    ]),
    sourceObjects: ['old notes', 'maps and clippings', 'reference cards'],
    actions: [
      'shown as the clearest detail in the scene',
      'held in a quiet documentary composition',
      'placed where viewers can notice the story pattern'
    ],
    camera: ['wide establishing shot', 'close documentary still', 'overhead archive composition'],
    motions: [
      'Use a slow push-in toward the main detail.',
      'Pan gently across the scene from left to right.',
      'Hold the frame steady, then fade softly.'
    ],
    timeOfDay: 'low natural light',
    atmosphere: 'restrained documentary mystery atmosphere',
    exclusions: 'no gore, no exaggerated horror, no unrelated characters, no readable fake text'
  };

  return buildContextualProductionProfile(defaultProfile, story, topic, context);

  const profiles = [
    {
      match: /quetzalcoatl|feathered serpent|ehecatl|mesoamerican/,
      data: {
        places: ['a Mesoamerican temple relief under warm ceremonial light', 'a stone temple courtyard with feathered serpent carvings', 'a museum-style table with Mesoamerican reference objects'],
        objects: ['the feathered serpent form of Quetzalcoatl', 'green and gold plumage carved into serpent imagery', 'Ehecatl-Quetzalcoatl wind-god references'],
        sourceObjects: ['temple relief details', 'Mesoamerican art references', 'museum object notes'],
        actions: ['shown as sacred imagery rather than a monster', 'linking feathers, serpent form, wind, and knowledge', 'kept distinct from later unsupported conquest claims'],
        camera: ['low-angle documentary view of carved stone', 'slow close view across feathered serpent details', 'overhead museum reference composition'],
        motions: ['Tilt slowly upward across the feathered serpent relief.', 'Let feathers and warm air move subtly while the frame stays reverent.', 'Hold on the carved form, then fade toward source objects.'],
        timeOfDay: 'warm ceremonial light with muted stone color',
        atmosphere: 'Mesoamerican mythic and reverent atmosphere',
        exclusions: 'no unrelated creature folklore, no unrelated historical setting, no fantasy monster framing, no readable fake text'
      }
    },
    {
      match: /wax[-\s]?winged owl|sealed letter|letter creature|messenger folklore/,
      data: {
        places: ['a candlelit desk filled with sealed letters', 'a quiet correspondence archive lined with old envelopes', 'a shadowed room where wax seals catch warm light'],
        objects: ['a wax-winged owl carrying a sealed letter', 'red wax seals on folded correspondence', 'unsent letters stacked beside a small perch'],
        sourceObjects: ['sealed envelopes', 'wax seal impressions', 'messenger folklore note cards'],
        actions: ['carrying a letter without revealing its message', 'keeping the seal intact as the central mystery', 'moving between written messages and silence'],
        camera: ['close documentary still of the sealed letter', 'medium shot of the owl above the desk', 'overhead archive composition of envelopes and wax'],
        motions: ['Track gently with the owl as it crosses the candlelit desk.', 'Hold on the wax seal before the letter is opened.', 'Pan slowly across envelopes while the wings move softly.'],
        timeOfDay: 'warm candlelight and deep surrounding shadow',
        atmosphere: 'quiet messenger folklore atmosphere',
        exclusions: 'no unrelated digital puzzle imagery, no modern computer workspace, no internet forum setting, no readable fake text'
      }
    },
    {
      match: /timestamp|digital record|modern omen|time records/,
      data: {
        places: ['a quiet phone screen in a dark room', 'a desktop notification history with repeated times', 'a modern archive desk with clocks and digital records'],
        objects: ['repeated timestamps glowing on a screen', 'a row of matching digital times', 'a notification log marked by recurring numbers'],
        sourceObjects: ['notification history cards', 'digital time records', 'screenshots arranged as motif evidence'],
        actions: ['compressing uncertainty into one visible number', 'making repetition feel like a sign without proving it', 'turning routine device records into omen-like patterns'],
        camera: ['tight close-up on repeated time numbers', 'over-the-shoulder view toward a dim screen', 'overhead desk composition with phone and clock'],
        motions: ['Push in slowly toward the repeated timestamp.', 'Hold the frame steady as the notification appears.', 'Track across matching time entries from left to right.'],
        timeOfDay: 'low screen light in a quiet modern room',
        atmosphere: 'restrained digital folklore atmosphere',
        exclusions: 'no animal omen imagery, no street-crossing folklore, no medieval setting, no monster design, no readable fake text'
      }
    },
    {
      match: /\bcicada\b|\bcicada\s+3301\b|\bcryptography\b|\bsteganography\b|\btor\b|\bqr\b|\bqr\s+codes?\b/,
      data: {
        places: ['a dark desk with a laptop and printed cipher sheets', 'an anonymous online forum screen in a dim room', 'a city street corner where a physical clue could be found'],
        objects: ['a coded image on a computer screen', 'printed cipher pages and QR-like geometric marks', 'a book beside coordinates and handwritten solution notes'],
        sourceObjects: ['cipher printouts', 'solver notes', 'technology reporting clippings'],
        actions: ['displayed as an unsolved puzzle rather than a threat', 'arranged like a careful trail of clues', 'shown between online code and real-world coordinates'],
        camera: ['over-the-shoulder view toward the screen', 'close shot across paper ciphers', 'low-angle street detail near a posted clue'],
        motions: ['Pan across the coded symbols from left to right.', 'Rack focus from the computer screen to the printed clue.', 'Track slowly from the desk toward the map coordinates.'],
        timeOfDay: 'cool screen light and low desk light',
        atmosphere: 'restrained digital mystery atmosphere',
        exclusions: 'no monsters, no office horror hallway, no invented masked group, no readable fake text'
      }
    },
    {
      match: /\bra(?:'s|s)?\b|solar boat|sun god|underworld|apep/,
      data: {
        places: ['a desert river horizon at dawn', 'a mythic night sky above the Duat', 'an ancient Egyptian temple wall under warm light'],
        objects: ['Ra in a golden solar boat', 'the sun disk traveling over dark water', 'Apep suggested as a distant shadow below the boat'],
        sourceObjects: ['papyrus-like drawings', 'temple relief details', 'solar symbols on aged stone'],
        actions: ['crossing the horizon in a ceremonial boat', 'moving from daylight into the underworld journey', 'returning toward dawn after the night passage'],
        camera: ['wide horizon composition', 'side profile of the boat crossing the frame', 'close view of carved solar imagery'],
        motions: ['Track the solar boat slowly across the horizon.', 'Tilt upward from the dark river toward the returning sun.', 'Hold on the sun disk, then fade into dawn light.'],
        timeOfDay: 'gold dawn light mixed with deep blue night tones',
        atmosphere: 'ancient ceremonial myth atmosphere',
        exclusions: 'no modern office lighting, no vehicles, no unrelated medieval castle, no science fiction machinery'
      }
    },
    {
      match: /green flash|sunset|refraction|horizon|phenomenon/,
      data: {
        places: ['an open ocean horizon at sunset', 'a quiet coastal lookout with a clear view of the sun', 'a simple science archive desk near a shoreline window'],
        objects: ['a thin green rim at the top of the setting sun', 'calm water beneath a clear horizon', 'a small observation note beside a horizon photograph'],
        sourceObjects: ['horizon photographs', 'atmospheric refraction diagrams', 'coastal observation notes'],
        actions: ['appearing briefly at the edge of the sun', 'held at the moment just before the sun disappears', 'shown as a real optical event with a sense of wonder'],
        camera: ['long lens view toward the horizon', 'wide coastal establishing shot', 'close archive still of observation notes'],
        motions: ['Hold steady on the horizon as the sun lowers.', 'Use a very slow push toward the green rim.', 'Fade from the ocean horizon to the observation notes.'],
        timeOfDay: 'clear sunset light with subdued ocean color',
        atmosphere: 'quiet natural observation atmosphere',
        exclusions: 'no medieval interiors, no supernatural creature, no city office, no exaggerated green glow'
      }
    },
    {
      match: /clown|babysitter|statue/,
      data: {
        places: ['a quiet living room at night', 'a hallway outside a child room', 'a phone table in a suburban house'],
        objects: ['a clown statue standing too still in the corner', 'a babysitter looking toward the silent figure', 'a telephone beside dim household light'],
        sourceObjects: ['variant notes', 'urban legend index cards', 'phone-call detail cards'],
        actions: ['kept motionless while the room feels ordinary', 'noticed only after the viewer has seen the room', 'framed as a mistaken object before the reveal'],
        camera: ['wide room composition', 'slow close view toward the corner', 'static hallway frame'],
        motions: ['Push in slowly toward the corner figure.', 'Hold still long enough for viewers to notice the statue.', 'Fade from the phone table back to the silent room.'],
        atmosphere: 'restrained household unease',
        exclusions: 'no gore, no circus setting, no jump scare, no unrelated archive office'
      }
    },
    {
      match: /bennington|triangle|disappearance/,
      data: {
        places: ['a cold Vermont forest trail', 'a mountain path under low cloud', 'a search map on an archive table'],
        objects: ['an empty trail disappearing into trees', 'a missing-person search map', 'a weathered sign near the woods'],
        sourceObjects: ['regional map notes', 'newspaper clippings', 'search timeline cards'],
        actions: ['left empty to suggest absence', 'marked as a place where the record becomes uncertain', 'shown through terrain rather than invented evidence'],
        camera: ['wide forest path view', 'overhead map composition', 'restrained handheld trail view'],
        motions: ['Track slowly along the empty trail.', 'Pan across the search map without stopping on fake text.', 'Pull back from the forest edge into fog.'],
        atmosphere: 'cold regional mystery atmosphere',
        exclusions: 'no monsters, no city street, no office corridor, no invented victim image'
      }
    },
    {
      match: /cooper|hijacking|airplane|parachute|ransom/,
      data: {
        places: ['a 1970s airplane cabin under low light', 'a rainy runway at night', 'an FBI-style case table without readable fake files'],
        objects: ['a black tie and ransom note on a seat tray', 'a parachute pack near an open aircraft stairway', 'bundled cash evidence on an archive table'],
        sourceObjects: ['case timeline cards', 'flight path map', 'evidence photographs without readable text'],
        actions: ['presented as a case detail rather than a reenactment', 'placed where the disappearance becomes the central absence', 'shown with documentary restraint'],
        camera: ['tight cabin detail shot', 'wide rainy runway composition', 'overhead evidence-table view'],
        motions: ['Push slowly toward the empty airplane seat.', 'Track along the flight path map.', 'Hold on the parachute detail, then fade to rain.'],
        atmosphere: 'documentary unresolved case atmosphere',
        exclusions: 'no visible violence, no modern airport terminal, no monster imagery, no unrelated office horror'
      }
    },
    {
      match: /green children|woolpit/,
      data: {
        places: ['a medieval village field near Woolpit', 'a simple village interior under firelight', 'an old manuscript desk'],
        objects: ['two strange children at the edge of a field', 'green-tinted clothing and unfamiliar expressions', 'a village record page beside a field sketch'],
        sourceObjects: ['chronicle-style notes', 'village map fragments', 'folklore reference cards'],
        actions: ['shown as bewildered newcomers rather than monsters', 'placed between village life and unexplained origin', 'kept gentle and historically grounded'],
        camera: ['wide field composition', 'quiet interior profile view', 'overhead manuscript composition'],
        motions: ['Pan from the field toward the children.', 'Hold on the village doorway before cutting to notes.', 'Pull back from the manuscript into soft light.'],
        atmosphere: 'old-world village mystery atmosphere',
        exclusions: 'no science lab, no modern street, no horror creature design, no readable fake text'
      }
    },
    {
      match: /bray road|beast/,
      data: {
        places: ['a rural Wisconsin road at night', 'a field edge beside dark trees', 'a newspaper clipping desk'],
        objects: ['a large shadowed figure near the roadside', 'headlights catching grass and tree line', 'regional newspaper clippings about sightings'],
        sourceObjects: ['local newspaper clippings', 'road maps', 'sighting note cards'],
        actions: ['kept partly hidden at the edge of the road', 'framed as a witness sighting rather than a creature attack', 'shown through local memory and reports'],
        camera: ['low roadside view', 'driver windshield perspective', 'overhead clipping layout'],
        motions: ['Use restrained handheld movement along the roadside.', 'Rack focus from headlights to the tree line.', 'Hold on the empty road after the figure is gone.'],
        atmosphere: 'rural nocturnal legend atmosphere',
        exclusions: 'no city alley, no gore, no fantasy armor, no unrelated laboratory'
      }
    },
    {
      match: /basilisk|bestiary|cockatrice/,
      data: {
        places: ['a candlelit medieval stone chamber', 'a bestiary manuscript desk', 'a narrow old courtyard under dry light'],
        objects: ['a basilisk suggested in shadow near stone', 'a cracked mirror used as a protective detail', 'a bestiary illustration on aged parchment'],
        sourceObjects: ['bestiary pages', 'mirror detail notes', 'medieval creature diagrams'],
        actions: ['kept dangerous through stillness and gaze', 'shown through manuscript tradition rather than modern monster spectacle', 'placed in stone and parchment textures'],
        camera: ['low stone-room composition', 'close manuscript detail', 'static frame on mirror and shadow'],
        motions: ['Tilt slowly from the stone floor toward the shadowed creature.', 'Pan across the bestiary page.', 'Hold on the cracked mirror before fading.'],
        atmosphere: 'medieval bestiary tension',
        exclusions: 'no vehicles, no modern corridor, no oversized dragon, no science fiction setting'
      }
    },
    {
      match: /agartha|hollow earth/,
      data: {
        places: ['a mountain cave entrance under cold light', 'a deep subterranean passage suggested by stone and mist', 'an esoteric map table'],
        objects: ['a hidden entrance beneath mountains', 'a cutaway-style hollow earth diagram', 'old esoteric map notes'],
        sourceObjects: ['esoteric map pages', 'mountain route notes', 'hidden-world diagrams'],
        actions: ['kept distant and uncertain rather than fully revealed', 'shown as a belief layer, not a confirmed geography', 'placed between map, mountain, and underground imagination'],
        camera: ['wide mountain entrance view', 'overhead map composition', 'deep perspective into stone passage'],
        motions: ['Push slowly toward the cave opening.', 'Pan across the esoteric map from margin to center.', 'Pull back from the underground passage into darkness.'],
        atmosphere: 'subterranean lost-world mystery',
        exclusions: 'no office hallway, no futuristic city, no unrelated laboratory, no readable fake text'
      }
    },
    {
      match: /fountain of youth|spring|youth/,
      data: {
        places: ['a quiet forest spring in early morning light', 'a coastal exploration map table', 'a shaded stone basin with clear water'],
        objects: ['clear water moving inside an old stone basin', 'a weathered exploration map', 'green leaves reflected on the spring surface'],
        sourceObjects: ['exploration maps', 'travel notes', 'spring-location sketches'],
        actions: ['shown as a place people seek rather than proof of immortality', 'framed through water, reflection, and longing', 'kept natural and uncertain'],
        camera: ['low close view over water', 'wide forest spring composition', 'overhead map table'],
        motions: ['Track slowly across the water surface.', 'Push in toward the spring reflection.', 'Fade from the map to moving water.'],
        atmosphere: 'quiet legendary-place wonder',
        exclusions: 'no glowing magic potion, no fantasy palace, no unrelated desert ruin, no readable fake text'
      }
    },
    {
      match: /mjolnir|thor|hammer|norse/,
      data: {
        places: ['a storm-dark Norse hall', 'a stone surface under thunderlight', 'a myth archive table with runic-style references'],
        objects: ['Mjolnir resting heavily on stone', 'storm clouds above a distant hall', 'a hammer symbol beside old myth notes'],
        sourceObjects: ['myth notes', 'hammer-symbol sketches', 'Norse reference cards'],
        actions: ['shown as a symbol of force and protection', 'kept heavy and grounded rather than decorative', 'placed with storm and stone as the main visual language'],
        camera: ['low close view of the hammer', 'wide storm-lit hall composition', 'overhead archive still'],
        motions: ['Push in slowly toward the hammer on stone.', 'Tilt from the hammer up toward the storm clouds.', 'Hold on the symbol while thunder fades.'],
        atmosphere: 'reverent Norse myth tension',
        exclusions: 'no dragon focus, no modern weapon display, no science fiction glow, no unrelated medieval castle'
      }
    },
    {
      match: /black cat|superstition/,
      data: {
        places: ['a quiet old street at dusk', 'a threshold under soft household light', 'a folklore notes desk'],
        objects: ['a black cat pausing at a street crossing', 'a doorway and shadow line', 'old superstition notes beside a small illustration'],
        sourceObjects: ['superstition notes', 'animal omen references', 'folklore index cards'],
        actions: ['shown as an omen shaped by interpretation', 'placed at the moment before someone decides what it means', 'kept ordinary enough to feel cultural rather than supernatural'],
        camera: ['street-level view', 'doorway composition', 'overhead folklore desk'],
        motions: ['Track gently across the street as the cat pauses.', 'Hold on the threshold shadow.', 'Fade from the street image to folklore notes.'],
        atmosphere: 'quiet historical superstition atmosphere',
        exclusions: 'no laboratory, no monster design, no exaggerated glowing eyes, no unrelated cemetery gate'
      }
    }
  ];

  const specific = profiles.find((profile) => profile.match.test(context) && profileFitsStory(profile.data, story, topic))?.data || {};
  const merged = { ...defaultProfile, ...specific };
  merged.mainSubject = topic;
  merged.places = ensureArray(merged.places, defaultProfile.places);
  merged.objects = ensureArray(merged.objects, defaultProfile.objects);
  merged.sourceObjects = ensureArray(merged.sourceObjects, defaultProfile.sourceObjects);
  merged.actions = ensureArray(merged.actions, defaultProfile.actions);
  merged.camera = ensureArray(merged.camera, defaultProfile.camera);
  merged.motions = ensureArray(merged.motions, defaultProfile.motions);
  return merged;
}

function buildContextualProductionProfile(defaultProfile, story, topic, context) {
  const entities = extractStoryProductionEntities(story, topic);
  const setting = cleanSetting(settingForStory(story));
  const isPrometheus = isPrometheusProfileContext(context);
  const isVideoHistory = /video watch history|watch history|extra second|uploaded clip|platform record|platform dashboard|upload metadata|platform metadata|playback bar/.test(context);
  const isSubway = /subway maintenance|sealed staircase|maintenance file|station diagrams?|worker accounts?|underground place/.test(context);
  const isDigitalPuzzle = isDigitalPuzzleProfileContext(context);

  let specific = {};
  if (isPrometheus) {
    specific = {
      places: ['a Greek mythic mountainside under cold dawn light', 'a stone ledge near the divine boundary of Olympus', 'an archive table with Greek myth references and fire imagery'],
      objects: ['Prometheus carrying stolen fire for humanity', 'a small flame guarded from the gods', 'Zeus represented through distant storm light', 'an eagle shadow above a bound figure'],
      sourceObjects: ['Greek myth reference cards', 'classical myth notes', 'fire-symbol sketches'],
      actions: ['connecting fire to craft, survival, rebellion, and punishment', 'showing the gift of fire without turning it into modern technology', 'making the divine boundary visible through stone, storm, and flame'],
      camera: ['wide mythic documentary composition', 'close restrained view of fire in human hands', 'low angle against mountain stone and storm light'],
      motions: ['Let the fire move gently while the camera pushes in slowly.', 'Track from the flame toward the distant storm light.', 'Hold on the mountain stone, then fade toward the archive material.'],
      timeOfDay: 'cold dawn light mixed with warm fire glow',
      atmosphere: 'ancient Greek myth atmosphere with restrained dramatic tension',
      exclusions: 'modern machinery, unrelated creatures, cartoon style, readable fake text'
    };
  } else if (isVideoHistory) {
    specific = {
      places: ['a dim modern desk lit by a video platform dashboard', 'a close view of a watch history page on a screen', 'a quiet digital archive workspace with timestamps and upload metadata'],
      objects: ['a watch history entry showing one impossible extra second', 'a playback bar beside an uploaded clip length', 'platform metadata arranged beside a screenshot record'],
      sourceObjects: ['watch history screenshots', 'upload metadata cards', 'platform dashboard records'],
      actions: ['making the extra second visible without adding a supernatural figure', 'turning a routine platform record into an impossible trace', 'keeping the anomaly inside the screen interface and metadata'],
      camera: ['tight close-up on the timestamp mismatch', 'over-the-shoulder view toward the dashboard', 'overhead desk composition with screenshots and notes'],
      motions: ['Push in slowly toward the mismatched timestamp.', 'Hold the screen steady as the playback bar becomes the focus.', 'Pan across the screenshot records from left to right.'],
      timeOfDay: 'low screen light in a dark room',
      atmosphere: 'restrained digital folklore atmosphere',
      exclusions: 'unrelated puzzle props, creature imagery, period costumes, readable fake text'
    };
  } else if (isSubway) {
    specific = {
      places: ['an underground subway corridor beside a sealed staircase', 'a maintenance office table with station diagrams', 'a platform service passage under muted transit lighting'],
      objects: ['a sealed staircase behind a metal barrier', 'a maintenance file scheduled for a stairway that should not be in use', 'station diagrams marked around a closed route'],
      sourceObjects: ['maintenance files', 'station diagrams', 'worker account notes'],
      actions: ['showing the sealed staircase as a physical place rather than a monster reveal', 'placing the file beside the station diagram that makes the contradiction visible', 'keeping the location grounded in transit infrastructure and records'],
      camera: ['wide corridor composition', 'close documentary still of the maintenance file', 'low angle toward the sealed stairs'],
      motions: ['Push slowly toward the sealed staircase.', 'Pan from the maintenance file to the station diagram.', 'Hold on the metal barrier, then fade into the corridor light.'],
      timeOfDay: 'muted underground station light',
      atmosphere: 'quiet strange-place tension with public-space realism',
      exclusions: 'unrelated creature imagery, horror props, unrelated screen interfaces, readable fake text'
    };
  } else if (isDigitalPuzzle) {
    specific = {
      places: ['a dark desk with a laptop and printed cipher sheets', 'an anonymous online forum screen in a dim room', 'a city street corner where a physical clue could be found'],
      objects: ['a coded image on a computer screen', 'printed cipher pages and QR-like geometric marks', 'a book beside coordinates and handwritten solution notes'],
      sourceObjects: ['cipher printouts', 'solver notes', 'technology reporting clippings'],
      actions: ['displayed as an unsolved puzzle rather than a threat', 'arranged like a careful trail of clues', 'shown between online code and real-world coordinates'],
      camera: ['over-the-shoulder view toward the screen', 'close shot across paper ciphers', 'low-angle street detail near a posted clue'],
      motions: ['Pan across the coded symbols from left to right.', 'Rack focus from the computer screen to the printed clue.', 'Track slowly from the desk toward the map coordinates.'],
      timeOfDay: 'cool screen light and low desk light',
      atmosphere: 'restrained digital mystery atmosphere',
      exclusions: 'monsters, office horror hallway, invented masked group, readable fake text'
    };
  } else {
    const topicTerms = entities.visualMotifs.slice(0, 4);
    specific = {
      places: unique([setting, `${setting} connected to ${topic}`, 'a quiet archive desk connected to the story']),
      objects: unique([topic, story.sceneAnchor, story.detail, ...topicTerms]).filter(Boolean).slice(0, 5),
      sourceObjects: unique([...entities.sourceObjects, 'archive reference notes']).slice(0, 4),
      actions: [
        `showing the central motif of ${topic} without adding outside entities`,
        `keeping the visual evidence tied to ${topic}`,
        `turning the story's strongest detail into a clear production image`
      ],
      camera: defaultProfile.camera,
      motions: [
        'Use a slow controlled push-in toward the current subject.',
        'Pan gently across the current scene detail.',
        'Hold the frame steady, then fade softly to the next beat.'
      ]
    };
  }

  const merged = { ...defaultProfile, ...specific };
  merged.mainSubject = topic;
  merged.places = ensureArray(merged.places, defaultProfile.places);
  merged.objects = ensureArray(merged.objects, defaultProfile.objects);
  merged.sourceObjects = ensureArray(merged.sourceObjects, defaultProfile.sourceObjects);
  merged.actions = ensureArray(merged.actions, defaultProfile.actions);
  merged.camera = ensureArray(merged.camera, defaultProfile.camera);
  merged.motions = ensureArray(merged.motions, defaultProfile.motions);
  return enforceProfileEntitySafety(merged, story, topic);
}

function extractStoryProductionEntities(story, topic) {
  const text = storyEntityText(story, topic);
  const words = unique((text.match(/[a-z][a-z'-]{2,}/g) || [])
    .map((word) => word.replace(/^the$/, '').trim())
    .filter(Boolean));
  const sourceObjects = [];
  if (/maintenance|file/.test(text)) sourceObjects.push('maintenance files');
  if (/station|diagram|route/.test(text)) sourceObjects.push('station diagrams');
  if (/watch|video|platform|metadata|screenshot/.test(text)) sourceObjects.push('screenshots and metadata');
  if (/myth|greek|prometheus|zeus|fire/.test(text)) sourceObjects.push('classical myth notes');
  return {
    words,
    visualMotifs: words.filter((word) => !/origin|meaning|record|source|archive|folklore|legend|story|category|retelling/.test(word)),
    sourceObjects: sourceObjects.length ? sourceObjects : ['archive reference notes']
  };
}

function hasAllowedEntity(context, entities, terms) {
  return terms.some((term) => hasExactContextTerm(context, term) || entities.words.includes(term));
}

function hasExactContextTerm(context, term) {
  const value = String(term || '').toLowerCase().trim();
  if (!value) return false;
  if (value.includes(' ')) return context.includes(value);
  return new RegExp(`\\b${escapeRegExp(value)}\\b`).test(context);
}

function isDigitalPuzzleProfileContext(context) {
  return /\bcicada\b|\bcicada\s+3301\b|\bcryptography\b|\bsteganography\b|\btor\b|\bqr\b|\bqr\s+codes?\b/.test(context);
}

function isPrometheusProfileContext(context) {
  return /\bprometheus\b|stealing fire|gift of fire/.test(context)
    || (/\bfire\b/.test(context) && /\b(zeus|titan|eagle)\b/.test(context));
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function enforceProfileEntitySafety(profile, story, topic) {
  const allowed = storyEntityText(story, topic);
  const forbiddenGroups = [
    ['dragon', 'basilisk', 'cockatrice'],
    ['black cat', 'street crossing'],
    ['cipher sheets', 'qr-like', 'coded image'],
    ['fluorescent lights', 'mechanical hum'],
    ['solar boat', 'duat', 'apep'],
    ['clown statue', 'babysitter']
  ];
  const sanitized = { ...profile };
  for (const key of ['places', 'objects', 'sourceObjects', 'actions', 'motions']) {
    sanitized[key] = ensureArray(sanitized[key], [])
      .filter((value) => !containsUnallowedStrongEntity(value, allowed, forbiddenGroups));
  }
  sanitized.places = ensureArray(sanitized.places, [cleanSetting(settingForStory(story))]);
  sanitized.objects = ensureArray(sanitized.objects, [topic]);
  sanitized.sourceObjects = ensureArray(sanitized.sourceObjects, ['archive reference notes']);
  sanitized.actions = ensureArray(sanitized.actions, [`showing the central motif of ${topic}`]);
  sanitized.motions = ensureArray(sanitized.motions, ['Use a slow controlled push-in toward the current subject.']);
  return sanitized;
}

function containsUnallowedStrongEntity(value, allowed, forbiddenGroups) {
  const text = String(value || '').toLowerCase();
  return forbiddenGroups.some((group) => group.some((term) => text.includes(term) && !allowed.includes(term)));
}

function profileFitsStory(profile, story, topic) {
  const allowedText = storyEntityText(story, topic);
  const strongTerms = extractStrongProfileTerms(profile);
  if (!strongTerms.length) return true;
  return strongTerms.some((term) => allowedText.includes(term));
}

function storyEntityText(story, topic) {
  const brief = story.storyBrief || {};
  const variants = (brief.reportedVariants || []).map((item) => `${item.claim || ''} ${item.scope || ''}`);
  const sources = (brief.existenceEvidence || []).map((item) => `${item.title || ''} ${item.sourceType || ''}`);
  const dna = story.contentDNA || {};
  return [
    topic,
    story.title,
    story.detail,
    story.sceneAnchor,
    story.summaryAnswer,
    story.excerpt,
    story.primaryTag,
    story.categorySlug,
    brief.topic,
    brief.category,
    brief.contentType,
    brief.cultureOrContext,
    ...(brief.knownNames || []),
    ...(brief.coreStoryElements || []),
    ...variants,
    ...(brief.editorialInterpretationOptions || []),
    ...(brief.uncertainDetails || []),
    ...sources,
    ...(story.subjectSpecificVocabulary || []),
    ...(dna.requiredSpecificDetails || []),
    ...(dna.subjectSpecificVocabulary || [])
  ].join(' ').toLowerCase();
}

function extractStrongProfileTerms(profile) {
  return unique([
    ...(profile.objects || []),
    ...(profile.places || []),
    ...(profile.sourceObjects || [])
  ].flatMap((value) => String(value).toLowerCase().match(/[a-z][a-z'-]{3,}/g) || []))
    .filter((term) => !/quiet|soft|warm|light|dark|desk|room|archive|notes|reference|objects|image|screen|stone|table|close|wide|style|scene|details|modern|old|still|small|cards/.test(term));
}

function ensureArray(value, fallback) {
  return Array.isArray(value) && value.length ? value : fallback;
}

function estimatedNarrationSecondsFromText(narration) {
  const wordCount = String(narration || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(8, Math.round(wordCount / 2.35));
}

function secondsToApproxLabel(seconds) {
  return `≈ ${seconds} sec`;
}

function motionPromptForVisualBeat(prompt, index, story, narration, sceneIndex, partIndex) {
  const topic = story.storyBrief?.topic || cleanSubject(story.title);
  const context = storyEntityText(story, topic);
  const promptText = String(prompt || '').toLowerCase();
  const narrationText = String(narration || '').toLowerCase();
  const profileMotion = storyProductionProfile('', story).motions || [];

  if (isDigitalPuzzleProfileContext(context)) {
    return [
      'Pan slowly across the coded symbols while the screen glow stays low and steady.',
      'Rack focus from the computer screen to the printed clue on the desk.',
      'Track gently from the cipher papers toward the map coordinates in the background.'
    ][(sceneIndex + partIndex + index) % 3];
  }

  const contextualMotion = motionPromptFromSceneText(promptText, narrationText, context, sceneIndex, partIndex, index);
  if (contextualMotion) return contextualMotion;

  const motion = profileMotion[(sceneIndex + partIndex + index) % Math.max(profileMotion.length, 1)];
  if (motion && !/keep the subject readable|hold that image|viewer should|appears clearly in the frame/i.test(motion)) {
    return normalizeBeatMotionSentence(motion);
  }
  return 'Move slowly across the main visual detail, using only subtle foreground and background parallax.';
}

function motionPromptFromSceneText(promptText, narrationText, context, sceneIndex, partIndex, index) {
  const seed = sceneIndex * 17 + partIndex * 3 + index;
  const text = `${promptText} ${narrationText}`;
  if (/demeter|persephone|hades|pomegranate|homeric|greek/.test(context)) {
    if (/museum|reference table|manuscript|source-aware|fragments|votive|ritual objects/.test(promptText)) return chooseMotion(seed, [
      'Tilt slowly across manuscript fragments and simple ritual objects under soft desk light.',
      'Pan from one manuscript edge to another while the source objects remain still.',
      'Push gently toward the aged text fragments without making the writing readable.',
      'Use minimal parallax between parchment texture and a small ritual object nearby.',
      'Pull back from the manuscript detail to show the quiet source arrangement.'
    ]);
    if (/grain|crops|field|hunger|famine|earth fails|agricultural|harvest|dry ancient/.test(promptText)) return chooseMotion(seed, [
      'Pull back from dry grain to the wider barren field with restrained movement.',
      'Pan across damaged crops, then slow near the empty field edge.',
      'Tilt from cracked earth toward pale grain under muted daylight.',
      'Use slight foreground movement in the grain while the wider field stays still.',
      'Push slowly across the failing crops without adding weather or extra figures.'
    ]);
    if (/pomegranate|seed|underworld|threshold|hades/.test(promptText)) return chooseMotion(seed, [
      'Hold near the pomegranate detail, then shift gently toward Persephone at the underworld threshold.',
      'Push slowly from Persephone toward the pomegranate seeds while the underworld edge stays still.',
      'Tilt from the shadowed threshold down to the pomegranate detail with restrained movement.',
      'Use slight parallax between the pomegranate foreground and Persephone in the background.',
      'Pull back from the pomegranate detail to show the divided surface and underworld space.'
    ]);
    if (/ground opens|opening ground|abduction|taken|flowers|meadow/.test(promptText)) return chooseMotion(seed, [
      'Begin with foreground flowers, then reveal the opening ground through a slow downward tilt.',
      'Pan gently across the meadow until the broken ground becomes the central detail.',
      'Push through the flowered foreground toward the dark opening without adding new action.',
      'Use minimal parallax between meadow flowers and the underworld opening behind them.',
      'Tilt from bright flowers toward the shadowed gap with a calm, controlled pace.'
    ]);
    if (/search|grief|wanders|looking|lost/.test(text)) return chooseMotion(seed, [
      "Pan slowly across the path and fields, following Demeter's search through empty space.",
      'Track along the empty field path, letting distance carry the feeling of searching.',
      'Pull back from Demeter into the open landscape to emphasize absence and movement.',
      'Move laterally past dry grass while the searching figure remains restrained and quiet.',
      'Tilt from the empty path toward the horizon, keeping the search unresolved.'
    ]);
    return [
      'Use a gentle lateral pan across the field while the figures remain still.',
      'Push slowly toward the central figure as the surrounding landscape stays quiet.',
      'Add minimal parallax between foreground grass and the distant ancient landscape.'
    ][seed % 3];
  }

  if (/osiris|isis|set|horus|nephthys|egyptian|papyrus|duat/.test(context)) {
    if (/museum|reference table|papyrus|source-aware|fragments|relief details/.test(promptText)) return chooseMotion(seed, [
      'Tilt slowly across papyrus fragments and relief details without making text readable.',
      'Pan from papyrus texture to carved relief under quiet temple light.',
      'Push gently toward the source fragments while keeping the composition still.',
      'Use slight parallax between the papyrus edge and a stone relief in the background.',
      'Pull back from the fragment detail to show the restrained source arrangement.',
      'Track along the edge of the papyrus before settling on the nearby relief detail.',
      'Move from the relief shadow toward the papyrus surface with a slow, even pace.'
    ]);
    if (/chest|coffin|sealed|murder|trapped|hidden/.test(promptText)) return chooseMotion(seed, [
      'Push slowly toward the sealed chest while the stone chamber remains motionless.',
      'Tilt from the chest lid to the surrounding chamber with restrained tension.',
      'Track along the coffin edge while the warm temple light stays steady.',
      'Use slight parallax between the sealed wood and the dark stone background.',
      'Pull back from the chest to show its isolation inside the chamber.'
    ]);
    if (/river|nile|search|looking|seeks|riverbank/.test(promptText)) return chooseMotion(seed, [
      'Pan from the riverbank toward Isis, letting water and desert space guide the movement.',
      'Track slowly along the Nile-side path while Isis remains the searching figure.',
      'Tilt from slow water to the distant shore, keeping the search quiet.',
      'Use minimal parallax between river reeds and the far temple edge.',
      'Pull back from Isis toward the open river landscape to emphasize distance.'
    ]);
    if (/linen|pieces|body|restore|ritual|mourning|gathers|funerary|wrappings/.test(promptText)) return chooseMotion(seed, [
      'Tilt carefully across linen and stone details, avoiding graphic movement or new action.',
      'Push slowly across the wrapped ritual objects while the chamber stays still.',
      'Pan from folded linen to a carved stone surface with restrained movement.',
      'Use slight parallax between linen in the foreground and temple wall reliefs behind it.',
      'Pull back from the restoration detail to show the quiet ritual space.'
    ]);
    if (/underworld|dead|duat|below|afterlife/.test(promptText)) return chooseMotion(seed, [
      'Pull back slowly from Osiris to reveal the surrounding underworld space.',
      'Push gently toward Osiris while deep shadows remain steady around him.',
      'Tilt from the underworld floor toward the seated figure with restrained movement.',
      'Use slight parallax between foreground stone and the distant underworld chamber.',
      'Pan across the dark space before settling on Osiris in stillness.'
    ]);
    if (/horus|succession|inheritance|royal line|living king|royal-symbolic/.test(promptText)) return chooseMotion(seed, [
      'Shift focus gently from Horus to Osiris while the royal symbols remain static.',
      'Pan from the young heir toward Osiris, keeping the succession symbols still.',
      'Push slowly toward the royal line detail without adding ceremonial action.',
      'Tilt from falcon imagery to the seated figure with calm, restrained movement.',
      'Use minimal parallax between foreground royal symbols and the figures behind them.'
    ]);
    if (/family|ruler|sister|wife|set stands|order/.test(text)) return chooseMotion(seed, [
      'Move laterally across the separated figures, keeping the royal chamber still and balanced.',
      'Push slowly toward Osiris while Isis and Set remain arranged within the same royal space.',
      'Tilt from royal symbols toward the divine figures with restrained temple light.',
      'Use slight parallax between foreground stone columns and the separated figures.',
      'Pull back from the central ruler to reveal the opposing figures around him.'
    ]);
    return [
      'Use a restrained push-in across warm temple stone toward the main figure.',
      'Pan gently from carved symbols to the central mythic subject.',
      'Create minimal parallax between foreground stone and the distant ritual space.'
    ][seed % 3];
  }

  if (/document|record|source|archive|paper|map|clipping|reference/.test(text)) {
    return 'Tilt slowly across the source objects, keeping the movement small and documentary.';
  }
  return '';
}

function chooseMotion(seed, options) {
  return options[Math.abs(seed) % options.length];
}

function normalizeBeatMotionSentence(value) {
  return String(value || '')
    .replace(/keeps? the subject readable/gi, 'keeps the movement restrained')
    .replace(/Hold the frame steady, then/gi, 'Keep the frame steady, then')
    .replace(/\s+/g, ' ')
    .trim();
}

function visualDirectionForScene(subject, story, index) {
  const directions = [
    `Hold the establishing image briefly, then begin a slow push toward the main detail of ${subject}.`,
    'Cut to the central event image. Keep the frame steady while the narration explains the core story.',
    'Use a gentle pan across the variant or context image, then pause before the final sentence of the scene.',
    'Show the archive material long enough to read the visual idea, then fade softly into the next scene.',
    'Slowly zoom out from the final image. Hold for two seconds after the last narration line, then fade to black.'
  ];
  return directions[index] || 'Keep the frame steady during the narration, then use a short fade into the next scene.';
}

function estimateLongformVideoLength(story, longformScript, longformResult) {
  const score = informationDepthScore(story);
  const runtime = buildRuntimePlan(longformScript, '', longformResult);
  if (score >= 14 && runtime.estimatedFinalSeconds >= 480) return '8-10 minutes';
  if (score >= 10 && runtime.estimatedFinalSeconds >= 420) return '7-8 minutes';
  if (runtime.estimatedFinalSeconds >= 360) return '6-7 minutes';
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
  const wordCount = longformResult?.totalWordCount || longformScript.join(' ').trim().split(/\s+/).filter(Boolean).length;
  const narrationReadSeconds = longformResult?.narrationReadSeconds || Math.round(wordCount / 2.35);
  const sceneCount = Math.max(1, Math.min(5, longformScript.length));
  const plannedVisualSeconds = sceneCount * 10;
  const breathSeconds = Math.max(20, sceneCount * 7);
  const naturalFinalSeconds = narrationReadSeconds + plannedVisualSeconds + breathSeconds;
  const runtime = parseRuntimeRange(estimatedVideoLength);
  const estimatedFinalSeconds = longformResult?.targetFinalVideoSeconds || Math.max(300, runtime?.minSeconds || 0, naturalFinalSeconds);
  return {
    totalWordCount: wordCount,
    narrationReadSeconds,
    finalVideoSeconds: estimatedFinalSeconds,
    narrationReadTime: secondsToLabel(narrationReadSeconds),
    plannedTransitionAndVisualTime: secondsToLabel(Math.max(0, estimatedFinalSeconds - narrationReadSeconds)),
    estimatedFinalRuntime: estimatedVideoLength || secondsToMinutesRange(estimatedFinalSeconds),
    estimatedFinalSeconds
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

function buildThumbnailIdeas(subject, story) {
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
  if (/quetzalcoatl|feathered serpent|mesoamerican/.test(text)) return 'Mesoamerican temple landscape';
  if (/wax[-\s]?winged owl|sealed letter|letter creature/.test(text)) return 'candlelit correspondence archive';
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

function narrationSentence(text) {
  return sentence(text)
    .replace(/\bThe article explains\b/gi, 'The story is often presented through')
    .replace(/\bThis article explains\b/gi, 'This story is often presented through')
    .replace(/\bThe video should\b/gi, 'The story can')
    .replace(/\bThe scene should\b/gi, 'The moment can')
    .replace(/\bBy the end, the viewer should\b/gi, 'The final impression is that')
    .replace(/\bBy the end\b/gi, 'At the end');
}

function spokenNarration(text) {
  return sentence(text)
    .replace(/\s+/g, ' ')
    .replace(/\bviewer should\b/gi, 'the story can')
    .replace(/\bviewers should\b/gi, 'the story can')
    .replace(/\bthe viewer\b/gi, 'we')
    .replace(/\bthe audience\b/gi, 'we')
    .trim();
}

function shortNarrationLine(text, subject) {
  const clean = sentence(text)
    .replace(/^(roadside legend|european folklore motif|hidden kingdom associated)\b/i, `${subject} is remembered as a story`)
    .replace(/\s+/g, ' ')
    .trim();
  const parts = clean.match(/[^.!?]+[.!?]+/g)?.map((part) => part.trim()).filter(Boolean) || [clean];
  return parts[0] || `${subject} keeps one clear detail at its center.`;
}

function cleanSetting(setting) {
  return String(setting || 'quiet archival setting').replace(/^quiet\s+quiet\b/i, 'quiet');
}

function capitalizeSentence(text) {
  const value = String(text || '').trim();
  if (!value) return '';
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  buildCreatorLibraryEntry
};
