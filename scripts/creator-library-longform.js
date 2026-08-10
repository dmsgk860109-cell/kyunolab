const {
  sanitizeCreatorInputText
} = require('./creator-library-input');
const {
  validateCreatorFactRecord,
  isInternalInstruction,
  isIncompleteFactFragment
} = require('./creator-library-facts');

const LONGFORM_SCHEMA_VERSION = '1.1';
const TARGET_TOTAL_MIN_WORDS = 620;
const TARGET_TOTAL_MAX_WORDS = 760;
const TARGET_READ_MIN_SECONDS = 265;
const TARGET_READ_MAX_SECONDS = 325;
const TARGET_FINAL_MIN_SECONDS = 300;
const TARGET_FINAL_MAX_SECONDS = 360;

const FORBIDDEN_META_PATTERNS = [
  /Defining Event/i,
  /Core Sequence/i,
  /Turning Point and Consequence/i,
  /Variants and Source Context/i,
  /Outcome and Meaning/i,
  /establish the point/i,
  /develop the point/i,
  /close the point/i,
  /source facts/i,
  /Scene Plan/i,
  /Part purpose/i,
  /viewer should/i,
  /Hold that image/i,
  /source-aware/i,
  /The article should/i,
  /The heading keeps the focus/i,
  /needs this part to preserve/i,
  /keep the visual work centered/i,
  /confirmed story material/i,
  /image prompt/i,
  /motion prompt/i,
  /voice direction/i,
  /sound effect/i,
  /background music/i,
  /creator note/i,
  /editing guide/i
];

const GENERIC_PADDING_PATTERNS = [
  /\bbegins with a detail that gives the story its shape\b/i,
  /\bThe focus stays on\b/i,
  /\bThe detail feels stronger when\b/i,
  /\bThis part develops the central point\b/i,
  /\bThe subject is remembered because the pattern remains clear\b/i,
  /\bThe meaning comes from the way the story is repeated\b/i,
  /\bAfter that turn, the story continues to develop\b/i,
  /\bBy this point, the central pattern is clear\b/i,
  /\bThe story becomes more than\b/i,
  /\bThat opening gives the audience\b/i,
  /\bclear handoff\b/i,
  /\bthe final idea lands softly\b/i
];

const BROKEN_NARRATION_PATTERNS = [
  /\bbegins with works because\b/i,
  /\bcentered on works because\b/i,
  /^\s*works because\b/i,
  /\ba ancient\b/i,
  /\bbecomes of\b/i,
  /\bconnected to its strongest image\b/i,
  /\b(?:and|of|to|with|because)\s*[.!?]?$/i,
  /,,|\.\./,
  /\band\s+and\b/i,
  /\bof\s+of\b/i,
  /\bthe\s+the\b/i,
  /\(\s*\)/,
  /""|''/
];

const NON_NARRATABLE_FACT_PATTERNS = [
  /^later versions and source comparison\.?$/i,
  /^later versions\.?$/i,
  /^source comparison\.?$/i,
  /^public source note\.?$/i,
  /^category title\.?$/i,
  /later summaries often simplify the story into a single clean form/i,
  /older or parallel versions keep more than one emphasis alive/i,
  /is a pre-existing .* subject built around/i,
  /this article follows/i,
  /the article should/i,
  /source-aware kyunolab/i
];

const TYPE_STYLE = {
  subject: {
    completeLeads: [
      'The account identifies the central subject clearly.',
      'The story keeps its main figure in view.',
      'The opening identity is already specific.'
    ],
    phrase: (text) => `${text} is the named subject at the center of this retelling.`
  },
  relationship: {
    completeLeads: [
      'The relationship is part of the story structure.',
      'The figures are not isolated from one another.',
      'The account depends on a defined connection.'
    ],
    phrase: (text) => `${text} defines one relationship that shapes the action.`
  },
  setting: {
    completeLeads: [
      'The setting gives the scene a concrete frame.',
      'The place or tradition matters before the action moves forward.',
      'The account keeps the location close to the subject.'
    ],
    phrase: (text) => `${text} gives this part its setting.`
  },
  problem: {
    completeLeads: [
      'The conflict begins with a specific pressure.',
      'The problem is not abstract.',
      'The story starts from a clear disturbance.'
    ],
    phrase: (text) => `${text} is the problem that pushes the story into motion.`
  },
  event: {
    completeLeads: [
      'The next fact gives the sequence a concrete action.',
      'The action moves through a specific event.',
      'The account then gives a direct movement.'
    ],
    phrase: (text) => `${text} is one event in the main sequence.`
  },
  'turning-point': {
    completeLeads: [
      'The turn changes the direction of the account.',
      'The decisive shift is tied to a specific moment.',
      'The story changes course through this action.'
    ],
    phrase: (text) => `${text} is the turn that changes the direction of the story.`
  },
  outcome: {
    completeLeads: [
      'The result is stated through a concrete outcome.',
      'The account leaves a direct result behind.',
      'The ending depends on what changes afterward.'
    ],
    phrase: (text) => `${text} is the outcome left by the story.`
  },
  variant: {
    completeLeads: [
      'The versions do not always preserve the same emphasis.',
      'The retelling changes when variant details appear.',
      'The tradition allows more than one form of the account.'
    ],
    phrase: (text) => hasSentencePredicate(text)
      ? `In some versions, ${lowercaseStart(text)}.`
      : `${text} appears as a variant detail in the source trail.`
  },
  'source-context': {
    completeLeads: [
      'The surviving record gives the narration a source limit.',
      'The source trail matters before the claim is treated as certain.',
      'The account stays careful because the evidence has boundaries.'
    ],
    phrase: (text) => `${text} gives the source context for this part.`
  },
  meaning: {
    completeLeads: [
      'One interpretation stays close to the material.',
      'The meaning remains tied to what the account actually says.',
      'The symbolic reading grows out of the recorded details.'
    ],
    phrase: (text) => `The story can be read through this meaning: ${text}.`
  },
  visual: {
    completeLeads: [
      'The visual detail gives the scene a concrete anchor.',
      'The image is grounded in a specific object or setting.',
      'The scene has a clear visible point.'
    ],
    phrase: (text) => `${text} gives the scene a concrete visual anchor.`
  }
};

const SCENE_TYPE_PRIORITIES = {
  'myth-narrative': [
    ['subject', 'relationship', 'problem', 'event'],
    ['event', 'relationship', 'setting', 'problem'],
    ['turning-point', 'event', 'outcome'],
    ['variant', 'source-context'],
    ['outcome', 'meaning', 'source-context']
  ],
  'internet-folklore': [
    ['subject', 'event', 'problem', 'source-context'],
    ['event', 'visual', 'source-context'],
    ['turning-point', 'variant', 'event'],
    ['source-context', 'variant'],
    ['outcome', 'meaning', 'source-context']
  ],
  'place-event-mystery': [
    ['setting', 'subject', 'event', 'problem'],
    ['event', 'source-context', 'problem'],
    ['source-context', 'visual', 'event'],
    ['variant', 'source-context', 'meaning'],
    ['outcome', 'meaning', 'source-context']
  ],
  'origin-comparison': [
    ['subject', 'problem', 'event'],
    ['source-context', 'event'],
    ['variant', 'event'],
    ['variant', 'source-context'],
    ['outcome', 'meaning', 'source-context']
  ]
};

function buildCreatorLongform(normalizedInput, scenePlan) {
  if (hasArchiveNarrativeSource(normalizedInput)) {
    return buildArchiveDerivedLongform(normalizedInput, scenePlan);
  }
  const context = createLongformContext(normalizedInput, scenePlan);
  const scenes = scenePlan.scenes.map((scene) => ({
    sceneIndex: scene.sceneIndex,
    role: scene.role,
    narrationParts: scene.narrationParts.map((partPlan) => buildNarrationPart({
      normalizedInput,
      scenePlan,
      scene,
      partPlan,
      context
    }))
  }));
  resolveDuplicateNarrationParts(scenes, context, normalizedInput, scenePlan);
  const allNarration = scenes.flatMap((scene) => scene.narrationParts.map((part) => part.narration)).join(' ');
  const totalWordCount = countWords(allNarration);
  const narrationReadSeconds = estimateNarrationReadTime(allNarration);
  const targetFinalVideoSeconds = clamp(
    Math.max(scenePlan.targetFinalVideoSeconds || TARGET_FINAL_MIN_SECONDS, narrationReadSeconds + 35),
    TARGET_FINAL_MIN_SECONDS,
    TARGET_FINAL_MAX_SECONDS
  );
  const result = {
    schemaVersion: LONGFORM_SCHEMA_VERSION,
    scenePlanSchemaVersion: scenePlan.schemaVersion || '',
    slug: scenePlan.slug || normalizedInput.slug || '',
    scenes,
    totalWordCount,
    narrationReadSeconds,
    targetFinalVideoSeconds,
    diagnostics: {
      factRecordCount: context.factRecords.length,
      usedFactIds: [...context.globalUsedFactIds]
    },
    warnings: []
  };
  const validation = validateCreatorLongform(result, scenePlan);
  if (!validation.valid) {
    const error = new Error(`Creator Long-form invalid for ${scenePlan.slug}`);
    error.code = 'CREATOR_LONGFORM_INVALID';
    error.slug = scenePlan.slug;
    error.errors = validation.errors;
    throw error;
  }
  return result;
}

function hasArchiveNarrativeSource(normalizedInput) {
  const source = normalizedInput?.archiveNarrative;
  return Boolean(source && source.sourceKind === 'archive-story' && source.visualAnchor && (source.coreStoryElements?.length || source.bodySections?.length));
}

function buildArchiveDerivedLongform(normalizedInput, scenePlan) {
  const context = createLongformContext(normalizedInput, scenePlan);
  const source = normalizedInput.archiveNarrative || {};
  const scenes = (scenePlan.scenes || []).map((scene, sceneIndex) => ({
    sceneIndex: scene.sceneIndex,
    role: scene.role,
    narrationParts: (scene.narrationParts || []).map((partPlan, partOffset) => {
      const narration = archiveNarrationPart(source, normalizedInput, sceneIndex, partOffset);
      const sourceFactIds = sourceIdsForArchivePart(scene, partPlan, context);
      const sourceRecords = sourceFactIds.map((id) => context.factById.get(id)).filter(Boolean);
      const part = {
        partIndex: partPlan.partIndex,
        narration,
        wordCount: countWords(narration),
        estimatedReadSeconds: estimateNarrationReadTime(narration),
        sourceFactIds,
        usedFactTypes: unique(sourceRecords.map((record) => record.factType)),
        usedFactTexts: sourceRecords.map((record) => record.factText),
        generatedSentenceCount: splitSentences(narration).length,
        sourceFieldRefs: unique([
          ...(partPlan.sourceFieldRefs || []),
          ...(scene.sourceFieldRefs || []),
          ...(source.sourceRefs || [])
        ])
      };
      const validation = validateNarrationPart(part, { normalizedInput, scene, partPlan, context });
      if (!validation.valid) {
        const error = new Error(`Creator Long-form Part invalid for ${normalizedInput.slug}`);
        error.code = 'CREATOR_LONGFORM_PART_INVALID';
        error.slug = normalizedInput.slug;
        error.errors = validation.errors;
        throw error;
      }
      sourceFactIds.forEach((id) => context.globalUsedFactIds.add(id));
      return part;
    })
  }));
  const allNarration = scenes.flatMap((scene) => scene.narrationParts.map((part) => part.narration)).join(' ');
  const totalWordCount = countWords(allNarration);
  const narrationReadSeconds = estimateNarrationReadTime(allNarration);
  const result = {
    schemaVersion: LONGFORM_SCHEMA_VERSION,
    scenePlanSchemaVersion: scenePlan.schemaVersion || '',
    slug: scenePlan.slug || normalizedInput.slug || '',
    scenes,
    totalWordCount,
    narrationReadSeconds,
    targetFinalVideoSeconds: clamp(Math.max(scenePlan.targetFinalVideoSeconds || TARGET_FINAL_MIN_SECONDS, narrationReadSeconds + 40), TARGET_FINAL_MIN_SECONDS, TARGET_FINAL_MAX_SECONDS),
    diagnostics: {
      factRecordCount: context.factRecords.length,
      usedFactIds: [...context.globalUsedFactIds],
      archiveNarrativeUsed: true
    },
    warnings: []
  };
  const validation = validateCreatorLongform(result, scenePlan);
  if (!validation.valid) {
    const error = new Error(`Creator Long-form invalid for ${scenePlan.slug}`);
    error.code = 'CREATOR_LONGFORM_INVALID';
    error.slug = scenePlan.slug;
    error.errors = validation.errors;
    throw error;
  }
  return result;
}

function archiveNarrationPart(source, normalizedInput, sceneIndex, partOffset) {
  const subject = cleanNarrationText(source.title || normalizedInput.topic || 'The story');
  const topic = cleanNarrationText(source.topic || subject);
  const anchor = cleanNarrationText(source.visualAnchor || source.excerpt || subject);
  const category = cleanNarrationText(source.category || normalizedInput.categoryName || 'the archive');
  const core = source.coreStoryElements || [];
  const variants = source.variants || [];
  const uncertainty = source.uncertainty || [];
  const evidence = source.evidence || [];
  const interpretation = source.interpretation || [];
  const keywords = source.keywords || [];
  const references = source.references || [];
  const body = source.bodySections || [];
  const section = body[sceneIndex] || body[0] || {};
  const sectionText = firstUsefulSentence(section.paragraphs) || source.summaryAnswer || source.deck || source.excerpt || anchor;
  const referenceNames = references.map((item) => item.title).filter(Boolean).slice(0, 3).join(', ');
  const keywordLine = keywords.filter((item) => !/meaning|legend|story$/i.test(item)).slice(0, 5).join(', ');
  const templates = [
    [
      `${subject} opens with ${lowercaseStart(anchor)}. It feels like someone has found an ordinary interior that refuses to stay ordinary: yellow walls, old carpet, fluorescent noise, and no clear exit. That image gives the story a body before any explanation arrives, and the first fear is simple. A normal room has become a place that may never end.`,
      `After the opening image comes the rule that made the legend travel: a person can noclip out of reality and enter endless empty rooms. In the archive record, ${topic} belongs to ${category}, so the opening act works as a remembered online premise rather than a verified hidden place. The room stays visible while the legend starts stepping farther inward.`
    ],
    [
      `${source.whereItAppears || 'The idea spread through image boards, forums, videos, games, collaborative fiction, and wider online discussions of liminal spaces.'} That spread matters because the Backrooms did not become famous as one closed tale. It became a place that many people could add to: another corridor, another rule, another level, and another reason the exit might never appear.`,
      `${core[2] || 'Later communities expanded the idea into levels, entities, survival guides, archives, and shared lore.'} The expansion works best when it does not bury the plain yellow-room image. The archive frame keeps the original prompt, the collaborative wiki era, and the analog horror versions in separate layers, so the growth feels wide without turning every layer into one official canon.`
    ],
    [
      `${core[1] || 'The original image evokes yellow walls, old carpet, fluorescent lights, and office-like non-place.'} This is where the narration can slow down. The Backrooms works because it feels designed for people and emptied of them at the same time. Liminal space, endless rooms, and workplace-like non-place are not decoration here; they explain why the image feels familiar before it feels impossible.`,
      `${sentenceFromFragment(variants[0] || 'The minimalist original Backrooms is an infinite empty office-like maze.')} ${sentenceFromFragment(variants[1] || 'The wiki-era Backrooms becomes a multi-level shared universe with rules and creatures.')} ${sentenceFromFragment(variants[2] || 'Analog horror versions often turn it into found footage, institutional footage, or failed-research narrative.')} These versions work as branches from the same first image, not as replacements for it.`
    ],
    [
      `${uncertainty[0] || 'Different Backrooms communities maintain different continuities.'} That uncertainty is part of the story itself. There is no single authority for every level, entity, rule, or exit. What can be held together is the folklore pattern: an ordinary-looking room becomes an impossible system because online audiences keep returning to it and rebuilding it.`,
      `${evidence[0] || 'Know Your Meme documents the Backrooms as a creepypasta originating from 4chan image-board culture.'} ${evidence[1] || 'Backrooms Wikidot materials document the growth of collaborative writing around levels, guides, and multiple interpretations.'} ${referenceNames ? `For orientation, the archive points toward ${referenceNames}.` : 'The archive keeps public references visible for orientation.'} Those sources act as guardrails, keeping the legend vivid without claiming that the supernatural place is real.`
    ],
    [
      `${source.whyItMatters || 'It transformed an ordinary interior photograph into shared folklore about isolation, repetition, failed navigation, and spaces designed for people but emptied of them.'} The ending returns to the same room from the beginning. By then, the room can hold memes, fear, games, wikis, and analog horror without needing one final answer.`,
      `${sentenceFromFragment(interpretation[0] || 'The Backrooms can be read as digital folklore built from collaborative retelling.')} ${keywordLine ? `Terms such as ${keywordLine} describe how the story is actually recognized.` : 'The closing details stay close to the images that made the story recognizable.'} The ending leaves the Backrooms as a digital labyrinth: not a proven location, but a shared strange place that people keep mapping because the first image still feels open.`
    ]
  ];
  return cleanNarrationText(templates[sceneIndex]?.[partOffset] || sectionText);
}

function sentenceFromFragment(value) {
  let text = cleanNarrationText(value);
  text = text
    .replace(/\bThe minimalist original Backrooms as\b/i, 'The minimalist original Backrooms works as')
    .replace(/\bThe wiki-era Backrooms as\b/i, 'The wiki-era Backrooms becomes')
    .replace(/\bAnalog horror Backrooms as\b/i, 'Analog horror Backrooms appears as')
    .replace(/^Read the Backrooms as\b/i, 'The Backrooms can be read as');
  if (hasSentencePredicate(text)) return ensureSentence(text);
  return ensureSentence(text);
}

function sourceIdsForArchivePart(scene, partPlan, context) {
  const ids = unique([
    ...(partPlan.sourceFactIds || []),
    ...(scene.sourceFactIds || [])
  ]).filter((id) => context.factById.has(id));
  if (ids.length) return ids.slice(0, 4);
  return context.factRecords.slice(0, 4).map((record) => record.id);
}

function firstUsefulSentence(paragraphs = []) {
  for (const paragraph of paragraphs || []) {
    const sentence = splitSentences(paragraph).find((item) => countWords(item) >= 10 && !/find a clear|the point is not/i.test(item));
    if (sentence) return sentence;
  }
  return '';
}

function resolveDuplicateNarrationParts(scenes, context, normalizedInput, scenePlan) {
  const seen = new Set();
  for (const scene of scenes) {
    for (const part of scene.narrationParts || []) {
      const key = comparableNarration(part.narration);
      if (!seen.has(key)) {
        seen.add(key);
        continue;
      }
      const extra = findExtraFactForDuplicate(part, context);
      if (!extra) continue;
      const originalPlanScene = (scenePlan.scenes || [])[scene.sceneIndex - 1] || {};
      const originalPartPlan = (originalPlanScene.narrationParts || [])[part.partIndex - 1] || {};
      const sentence = buildFactSentence(extra, {
        normalizedInput,
        scene: originalPlanScene,
        partPlan: originalPartPlan,
        context
      });
      part.narration = cleanNarrationText(`${part.narration} ${sentence}`);
      part.wordCount = countWords(part.narration);
      part.estimatedReadSeconds = estimateNarrationReadTime(part.narration);
      part.sourceFactIds = unique([...(part.sourceFactIds || []), extra.id]);
      part.usedFactTypes = unique([...(part.usedFactTypes || []), extra.factType]);
      part.usedFactTexts = unique([...(part.usedFactTexts || []), extra.factText]);
      part.generatedSentenceCount = splitSentences(part.narration).length;
      part.sourceFieldRefs = unique([...(part.sourceFieldRefs || []), ...(extra.sourceRefs || [])]);
      seen.add(comparableNarration(part.narration));
    }
  }
}

function findExtraFactForDuplicate(part, context) {
  const used = new Set(part.sourceFactIds || []);
  return context.factRecords.find((record) => !used.has(record.id) && isNarratableFactRecord(record))
    || context.factRecords.find(isNarratableFactRecord);
}

function buildNarrationPart(input) {
  const normalized = normalizeBuildNarrationInput(input);
  const records = selectPartFactRecords(normalized.normalizedInput, normalized.partPlan, normalized);
  if (!records.length) {
    const error = new Error(`Missing source fact for ${normalized.normalizedInput.slug} Scene ${normalized.scene.sceneIndex} Part ${normalized.partPlan.partIndex}`);
    error.code = 'CREATOR_LONGFORM_INPUT_MISSING';
    error.slug = normalized.normalizedInput.slug;
    error.errors = [`Scene ${normalized.scene.sceneIndex} Part ${normalized.partPlan.partIndex} has no source fact.`];
    throw error;
  }

  const sentences = [];
  let previousRecord = null;
  for (const record of records) {
    const transition = buildFactTransition(previousRecord, record, normalized);
    if (transition) sentences.push(transition);
    sentences.push(...realizeFactRecord(record, normalized));
    previousRecord = record;
  }

  const narration = cleanNarrationText(dedupeNarrationSentences(sentences.join(' ')));
  const part = {
    partIndex: normalized.partPlan.partIndex,
    narration,
    wordCount: countWords(narration),
    estimatedReadSeconds: estimateNarrationReadTime(narration),
    sourceFactIds: records.map((record) => record.id),
    usedFactTypes: unique(records.map((record) => record.factType)),
    usedFactTexts: records.map((record) => record.factText),
    generatedSentenceCount: splitSentences(narration).length,
    sourceFieldRefs: unique(records.flatMap((record) => record.sourceRefs || normalized.partPlan.sourceFieldRefs || []))
  };
  const validation = validateNarrationPart(part, normalized);
  if (!validation.valid) {
    const error = new Error(`Creator Long-form Part invalid for ${normalized.normalizedInput.slug}`);
    error.code = 'CREATOR_LONGFORM_PART_INVALID';
    error.slug = normalized.normalizedInput.slug;
    error.errors = validation.errors;
    throw error;
  }
  for (const record of records) normalized.context.globalUsedFactIds.add(record.id);
  return part;
}

function realizeFactRecord(record, context = {}) {
  return [buildFactSentence(record, context)].filter(Boolean);
}

function buildFactSentence(record, context = {}) {
  const factText = cleanNarrationText(record?.factText || '');
  if (!factText) return '';
  const naturalSentence = buildNaturalFactSentence(record, context, factText);
  if (naturalSentence) return ensureSentence(naturalSentence);
  const style = TYPE_STYLE[record.factType] || TYPE_STYLE.event;
  if (isCompleteSentence(factText)) {
    const lead = selectLead(style.completeLeads, context, record);
    return ensureSentence(`${stripFinalPunctuation(lead)}: ${stripFinalPunctuation(factText)}.`);
  }
  const lead = selectLead(style.completeLeads, context, record);
  return ensureSentence(`${stripFinalPunctuation(lead)}: ${stripFinalPunctuation(style.phrase(stripFinalPunctuation(factText), context))}.`);
}

function buildNaturalFactSentence(record, context = {}, factText = '') {
  const topic = cleanNarrationText(context.normalizedInput?.topic || 'The story');
  const fact = stripFinalPunctuation(factText);
  const visual = longformVisualAnchor(fact, topic);
  if (record?.factType === 'subject') {
    return sceneVariant(context, [
      `${topic} gives the video a clear subject before the narration moves into concrete story details.`,
      `Start from ${topic} as a recognizable title, then move quickly into the image that made it spread.`,
      `Keep ${topic} named clearly, but let the episode feel driven by scenes instead of labels.`,
      `${topic} should work as the production spine, not as a line repeated without new movement.`,
      `Use ${topic} as the viewer's map through the package, from hook to source boundary.`,
      `Let ${topic} introduce the subject while the following beats explain why people remember it.`,
      `The script can name ${topic} early, then spend its energy on the strange image at the center.`,
      `Treat ${topic} as the doorway into the video rather than the whole explanation.`,
      `Return to ${topic} only when the audience needs orientation between details.`,
      `Close the package with ${topic} still recognizable, but not flattened into a single fixed claim.`
    ]);
  }
  if (/centers on internet folklore/i.test(fact)) {
    return sceneVariant(context, [
      `${topic} belongs to internet folklore, so the narration should feel like a shared online legend rather than a settled report.`,
      `Treat ${topic} as an online legend that grew through repetition, screenshots, and audience retelling.`,
      `Keep the internet folklore frame visible, because the story works through circulation more than through one fixed canon.`,
      `The online setting matters: the story spreads because people keep adding paths, levels, and rules.`,
      `Frame the topic as digital folklore, where the repeated image matters as much as any single origin.`,
      `Let the internet context explain why the legend can feel shared even when its canon keeps changing.`,
      `Use the online-folklore angle to keep the video grounded in retelling, not in false certainty.`,
      `The narration should treat the spread itself as part of the story's strange power.`,
      `Keep the digital crowd in the background: reposts and edits are part of how the legend survives.`,
      `By the end, the internet folklore frame should make the uncertainty feel intentional rather than thin.`
    ]);
  }
  if (/empty yellow room|fluorescent hum|opened too far/i.test(fact)) {
    return sceneVariant(context, [
      `The strongest hook is ${visual}, because it gives the audience something specific to picture before the legend expands.`,
      `Use ${visual} as the first concrete image, then let the script explain why people kept building rooms beyond it.`,
      `Let ${visual} carry the unease, so the video does not need to invent extra monsters or incidents.`,
      `Return to ${visual} whenever the narration needs a clear visual anchor.`,
      `Hold on ${visual} long enough for the audience to feel how ordinary the fear is.`,
      `The visual package should keep ${visual} close, because that plain image is stronger than extra lore.`,
      `Use ${visual} as the point where the story stops being abstract and becomes a place viewers can imagine.`,
      `When the script widens into levels and rules, bring it back to ${visual} so the center does not disappear.`,
      `Let ${visual} act like the recurring shot that ties the whole production together.`,
      `The final section should remember ${visual} as the reason the legend still feels easy to enter.`
    ]);
  }
  if (/source boundary|source limit|without turning the legend into a fixed claim/i.test(fact)) {
    return sceneVariant(context, [
      `Keep the source boundary visible, so the script can use the legend without pretending every later detail is confirmed.`,
      `The production should name the uncertainty plainly while still letting the legend feel strange.`,
      `Use the source limit as part of the appeal: the unclear edge is why the story keeps spreading.`,
      `Do not turn the loose source trail into a fake official history; let the uncertainty stay useful.`,
      `The narration can be careful without becoming flat: source limits are part of the mystery here.`,
      `Keep later additions separate from the central image, so the audience understands the layers.`,
      `The script should sound confident about the motif, not overconfident about every version.`,
      `Use the source boundary as a production note and as a storytelling beat.`,
      `Let the unclear source trail explain why different creators can build different versions.`,
      `By the close, the video should respect the source limit while still giving viewers a memorable shape.`
    ]);
  }
  if (/digital labyrinth/i.test(fact) && !/works because|centers on/i.test(fact)) {
    return sceneVariant(context, [
      `The digital labyrinth idea gives the middle of the video a simple path: one ordinary image becomes a place people keep extending.`,
      `The labyrinth framing helps the video move from one unsettling room to a larger shared mythology.`,
      `Use the digital labyrinth as the structure for the middle section, not as proof of a single official version.`,
      `Let the labyrinth feel built from repeated choices: one corridor, then another, then another.`,
      `The digital labyrinth should explain expansion without burying the original image.`,
      `Use the maze idea to organize levels, exits, and rules while keeping the tone restrained.`,
      `The middle section can treat the labyrinth as a map of collective imagination.`,
      `Keep the labyrinth visual simple: endless rooms are enough before the script adds extra lore.`,
      `Let the digital maze show how internet stories become places people can revisit.`,
      `The ending can leave the labyrinth open, because a fully closed map would weaken the legend.`
    ]);
  }
  if (record?.factType === 'visual') {
    return `Use ${visual} as the visible anchor, then let the narration explain why that image keeps spreading.`;
  }
  if (record?.factType === 'meaning') {
    return `The meaning stays close to ${visual}, not to a new invented event or a stronger claim.`;
  }
  if (record?.factType === 'source-context') {
    return `The source context should stay attached to ${visual}, keeping the production clear about what the archive actually supports.`;
  }
  return '';
}

function sceneVariant(context = {}, variants = []) {
  if (!variants.length) return '';
  const sceneIndex = Number(context.scene?.sceneIndex || 1);
  const partIndex = Number(context.partPlan?.partIndex || 1);
  const index = Math.abs(((sceneIndex - 1) * 2) + (partIndex - 1)) % variants.length;
  return variants[index];
}

function dedupeNarrationSentences(value) {
  const sentences = splitSentences(value);
  if (!sentences.length) return value;
  const seen = new Set();
  const output = [];
  for (const sentence of sentences) {
    const key = comparableNarration(sentence);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(sentence);
  }
  return output.join(' ');
}

function longformVisualAnchor(value, fallback = 'the central image') {
  const text = cleanNarrationText(value);
  const lower = text.toLowerCase();
  if (/empty yellow room|fluorescent hum|opened too far/.test(lower)) return 'the empty yellow room, the fluorescent hum, and the feeling of a place opening too far';
  if (/digital labyrinth/.test(lower)) return 'the digital labyrinth';
  if (/liminal/.test(lower)) return 'the liminal room';
  if (/backrooms/.test(lower)) return 'the Backrooms';
  return stripFinalPunctuation(fallback);
}

function buildFactTransition(previousRecord, currentRecord, context = {}) {
  void previousRecord;
  void currentRecord;
  void context;
  return '';
}

function selectPartFactRecords(normalizedInput, partPlan, options = {}) {
  const context = options.context || createLongformContext(normalizedInput, options.scenePlan || {});
  const factById = context.factById;
  const scene = options.scene || {};
  const partIds = Array.isArray(partPlan?.sourceFactIds) ? partPlan.sourceFactIds : [];
  const sceneIds = Array.isArray(scene.sourceFactIds) ? scene.sourceFactIds : [];
  const typePriority = factTypesForPart(normalizedInput, scene, partPlan);
  const localUsed = new Set();
  const selected = [];

  addRecordsByIds(partIds, factById, selected, localUsed, context);
  addRecordsByIds(sceneIds, factById, selected, localUsed, context);
  addRecordsByTypes(context.factRecords, typePriority, selected, localUsed, context);
  addRecordsByTypes(context.factRecords, fallbackFactTypesForScene(scene.sceneIndex), selected, localUsed, context);

  const targetWords = Math.max(56, Number(partPlan?.targetWords || 68) - 10);
  const output = [];
  for (const record of selected) {
    if (output.length >= 4) break;
    output.push(record);
    const projected = output.map((item, index) => {
      const transition = index ? buildFactTransition(output[index - 1], item, { ...options, normalizedInput, scene, partPlan, context }) : '';
      return [transition, ...realizeFactRecord(item, { ...options, normalizedInput, scene, partPlan, context })].filter(Boolean).join(' ');
    }).join(' ');
    if (countWords(projected) >= targetWords && output.length >= 3) break;
  }

  if (countWords(output.map((record) => buildFactSentence(record, { ...options, normalizedInput, scene, partPlan, context })).join(' ')) < 48) {
    addRecordsByTypes(context.factRecords, ['event', 'source-context', 'meaning', 'visual', 'setting', 'subject'], output, localUsed, context, 4);
  }

  ensureRequiredSceneFact(output, context.factRecords, scene.sceneIndex, normalizedInput.contentType);
  if (countWords(output.map((record) => buildFactSentence(record, { ...options, normalizedInput, scene, partPlan, context })).join(' ')) < 45) {
    addRecordsByTypesAllowReuse(context.factRecords, [...typePriority, 'event', 'source-context', 'meaning', 'visual', 'setting', 'subject'], output, localUsed, 5);
  }
  while (output.length > 2) {
    const projected = output.map((record) => buildFactSentence(record, { ...options, normalizedInput, scene, partPlan, context })).join(' ');
    if (countWords(projected) <= 88) break;
    const removableIndex = findRemovableFactIndex(output, scene.sceneIndex, normalizedInput.contentType);
    output.splice(removableIndex, 1);
  }
  return output.slice(0, 4);
}

function addRecordsByTypesAllowReuse(records, types, selected, localUsed, limit = 5) {
  const desired = new Set(types || []);
  for (const record of records
    .filter((item) => desired.has(item.factType))
    .filter(isNarratableFactRecord)
    .sort((a, b) => countWords(b.factText) - countWords(a.factText))) {
    if (selected.length >= limit) break;
    if (localUsed.has(record.id)) continue;
    selected.push(record);
    localUsed.add(record.id);
  }
}

function ensureRequiredSceneFact(output, records, sceneIndex, contentType) {
  const required = requiredTypesForScene(sceneIndex, contentType);
  if (output.some((record) => required.includes(record.factType))) return;
  const replacement = records.find((record) => required.includes(record.factType) && isNarratableFactRecord(record));
  if (!replacement) return;
  if (output.some((record) => record.id === replacement.id)) return;
  if (output.length >= 4) output[output.length - 1] = replacement;
  else output.push(replacement);
}

function findRemovableFactIndex(records, sceneIndex, contentType) {
  const required = requiredTypesForScene(sceneIndex, contentType);
  for (let index = records.length - 1; index >= 0; index -= 1) {
    if (!required.includes(records[index].factType)) return index;
  }
  return records.length - 1;
}

function requiredTypesForScene(sceneIndex, contentType) {
  if (sceneIndex === 1) return ['subject', 'problem', 'event', 'relationship', 'setting'];
  if (sceneIndex === 2) return contentType === 'internet-folklore'
    ? ['event', 'source-context', 'subject', 'visual']
    : ['event', 'relationship', 'setting', 'problem', 'source-context', 'visual', 'subject'];
  if (sceneIndex === 3) return ['turning-point', 'event', 'outcome', 'variant'];
  if (sceneIndex === 4) return ['variant', 'source-context', 'meaning'];
  if (sceneIndex === 5) return ['outcome', 'meaning', 'source-context'];
  return ['event', 'source-context', 'meaning'];
}

function validateNarrationPart(part, context = {}) {
  const errors = [];
  const label = `Scene ${context.scene?.sceneIndex || '?'} Part ${part?.partIndex || '?'}`;
  if (!part || typeof part !== 'object') return { valid: false, errors: [`${label} must be an object.`] };
  if (!part.narration) errors.push(`${label} has no narration.`);
  if (!Array.isArray(part.sourceFactIds) || !part.sourceFactIds.length) errors.push(`${label} has no sourceFactIds.`);
  if (!Array.isArray(part.usedFactTexts) || !part.usedFactTexts.length) errors.push(`${label} has no usedFactTexts.`);
  for (const factId of part.sourceFactIds || []) {
    if (!context.context?.factById?.has(factId)) errors.push(`${label} references missing sourceFactId: ${factId}`);
  }
  const internal = detectInternalNarrationMetadata(part.narration);
  if (internal.length) errors.push(`${label} contains internal metadata: ${internal.join(', ')}`);
  const broken = detectBrokenNarration(part.narration);
  if (broken.length) errors.push(`${label} contains broken narration: ${broken.join(', ')}`);
  const generic = detectGenericNarration(part.narration);
  if (generic.length) errors.push(`${label} contains generic padding: ${generic.join(', ')}`);
  for (const sentence of splitSentences(part.narration)) {
    if (!hasSentencePredicate(sentence)) errors.push(`${label} contains incomplete sentence: ${sentence}`);
  }
  if (part.wordCount < 15 || part.wordCount > 120) errors.push(`${label} word count outside 15-120: ${part.wordCount}`);
  return { valid: errors.length === 0, errors };
}

function validateCreatorLongform(result, scenePlan) {
  const errors = [];
  if (!result || typeof result !== 'object') errors.push('Long-form result must be an object.');
  if (!Array.isArray(result?.scenes) || result.scenes.length !== 5) errors.push('Long-form result must contain 5 scenes.');

  const factRecords = Array.isArray(scenePlan?.factRecords) ? scenePlan.factRecords : [];
  const factById = new Map(factRecords.map((record) => [record.id, record]));
  const allParts = [];
  const allNarrationTexts = [];
  const factUseCounts = new Map();

  (result?.scenes || []).forEach((scene, sceneIndex) => {
    if (scene.sceneIndex !== sceneIndex + 1) errors.push(`Scene ${sceneIndex + 1} has invalid sceneIndex.`);
    if (!Array.isArray(scene.narrationParts) || scene.narrationParts.length !== 2) {
      errors.push(`Scene ${sceneIndex + 1} must contain 2 narration parts.`);
    }
    (scene.narrationParts || []).forEach((part) => {
      const label = `Scene ${sceneIndex + 1} Part ${part.partIndex || '?'}`;
      allParts.push({ sceneIndex: sceneIndex + 1, part });
      allNarrationTexts.push(part.narration || '');
      if (!part.narration) errors.push(`${label} has no narration.`);
      if (!Array.isArray(part.sourceFactIds) || !part.sourceFactIds.length) errors.push(`${label} has no sourceFactIds.`);
      for (const factId of part.sourceFactIds || []) {
        const record = factById.get(factId);
        if (!record) {
          errors.push(`${label} references missing sourceFactId: ${factId}`);
          continue;
        }
        const validation = validateCreatorFactRecord(record);
        validation.errors.forEach((error) => errors.push(`${label} has invalid fact ${factId}: ${error}`));
        factUseCounts.set(factId, (factUseCounts.get(factId) || 0) + 1);
      }
      if (part.wordCount !== countWords(part.narration || '')) errors.push(`${label} wordCount does not match narration.`);
      if (part.estimatedReadSeconds !== estimateNarrationReadTime(part.narration || '')) errors.push(`${label} read time does not match narration.`);
      if (detectInternalNarrationMetadata(part.narration).length) errors.push(`${label} contains internal metadata.`);
      if (detectBrokenNarration(part.narration).length) errors.push(`${label} contains broken narration.`);
      if (detectGenericNarration(part.narration).length) errors.push(`${label} contains generic padding.`);
      if (!hasFactDensity(part, factById)) errors.push(`${label} has no concrete fact density.`);
      validateSceneFactFit(sceneIndex + 1, part, factById, scenePlan?.contentType || '', errors);
    });
  });

  if (allParts.length !== 10) errors.push(`Long-form must contain exactly 10 narration parts, found ${allParts.length}.`);
  void factUseCounts;
  if (result.totalWordCount !== countWords(allNarrationTexts.join(' '))) errors.push('Long-form totalWordCount does not match narration.');
  if (result.totalWordCount < 550 || result.totalWordCount > 830) {
    errors.push(`Long-form total word count outside 550-830: ${result.totalWordCount}`);
  }
  if (result.narrationReadSeconds !== estimateNarrationReadTime(allNarrationTexts.join(' '))) errors.push('Long-form read time does not match narration.');
  if (result.narrationReadSeconds < 235 || result.narrationReadSeconds > 355) {
    errors.push(`Narration read time outside 235-355 seconds: ${result.narrationReadSeconds}`);
  }
  if (result.targetFinalVideoSeconds < result.narrationReadSeconds) errors.push('Final video seconds must not be shorter than narration read seconds.');
  if (result.targetFinalVideoSeconds < TARGET_FINAL_MIN_SECONDS || result.targetFinalVideoSeconds > TARGET_FINAL_MAX_SECONDS) {
    errors.push(`Final video seconds outside ${TARGET_FINAL_MIN_SECONDS}-${TARGET_FINAL_MAX_SECONDS}: ${result.targetFinalVideoSeconds}`);
  }
  return { valid: errors.length === 0, errors };
}

function estimateNarrationReadTime(text) {
  return Math.round(countWords(text) / 2.35);
}

function detectGenericNarration(text) {
  return GENERIC_PADDING_PATTERNS
    .filter((pattern) => pattern.test(String(text || '')))
    .map((pattern) => pattern.toString());
}

function detectBrokenNarration(text) {
  return BROKEN_NARRATION_PATTERNS
    .filter((pattern) => pattern.test(String(text || '')))
    .map((pattern) => pattern.toString());
}

function detectInternalNarrationMetadata(text) {
  return FORBIDDEN_META_PATTERNS
    .filter((pattern) => pattern.test(String(text || '')) || isInternalInstruction(text))
    .map((pattern) => pattern.toString());
}

function cleanNarrationText(value) {
  return sanitizeCreatorInputText(value)
    .replace(/\bSt\./g, 'Saint')
    .replace(/\bThe article preserves that tension without overstating what the sources can support\b/gi, 'The narration keeps the source boundary visible without turning the legend into a fixed claim')
    .replace(/\bwithout overstating what the sources can support\b/gi, 'while keeping the source boundary visible')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/([,.!?]){2,}/g, '$1')
    .trim();
}

function createLongformContext(normalizedInput, scenePlan) {
  const factRecords = Array.isArray(normalizedInput?.factRecords) ? normalizedInput.factRecords : [];
  return {
    factRecords,
    factById: new Map(factRecords.map((record) => [record.id, record])),
    globalUsedFactIds: new Set(),
    scenePlan
  };
}

function normalizeBuildNarrationInput(input) {
  if (input?.normalizedInput && input?.scene && input?.partPlan) return input;
  const normalizedInput = arguments[0];
  const scene = arguments[1];
  const partPlan = arguments[2];
  return {
    normalizedInput,
    scene,
    partPlan,
    scenePlan: {},
    context: createLongformContext(normalizedInput, {})
  };
}

function addRecordsByIds(ids, factById, selected, localUsed, context) {
  for (const id of ids || []) {
    const record = factById.get(id);
    if (!record || localUsed.has(record.id) || !isNarratableFactRecord(record)) continue;
    if (context.globalUsedFactIds.has(record.id)) continue;
    selected.push(record);
    localUsed.add(record.id);
  }
}

function addRecordsByTypes(records, types, selected, localUsed, context, limit = 5) {
  const desired = new Set(types || []);
  for (const record of records
    .filter((item) => desired.has(item.factType))
    .filter(isNarratableFactRecord)
    .sort((a, b) => scoreNarrationFact(b, types, context) - scoreNarrationFact(a, types, context))) {
    if (selected.length >= limit) break;
    if (localUsed.has(record.id)) continue;
    if (context.globalUsedFactIds.has(record.id)) continue;
    selected.push(record);
    localUsed.add(record.id);
  }
}

function isNarratableFactRecord(record) {
  if (!record || !record.id || !record.factText) return false;
  const text = cleanNarrationText(record.factText);
  if (!text || text.length < 8) return false;
  if (countWords(text) > 45) return false;
  if (NON_NARRATABLE_FACT_PATTERNS.some((pattern) => pattern.test(text))) return false;
  if (isInternalInstruction(text) || isIncompleteFactFragment(text)) return false;
  if (record.sourceRefs?.some((ref) => /^category\.title$/i.test(ref)) && text.split(/\s+/).length < 4) return false;
  return true;
}

function factTypesForPart(normalizedInput, scene, partPlan) {
  const byType = SCENE_TYPE_PRIORITIES[normalizedInput.contentType] || [];
  const sceneTypes = byType[(scene.sceneIndex || 1) - 1] || fallbackFactTypesForScene(scene.sceneIndex);
  if (partPlan.partIndex === 1) return sceneTypes;
  return [...sceneTypes].reverse();
}

function fallbackFactTypesForScene(sceneIndex) {
  const fallback = [
    ['subject', 'problem', 'event', 'relationship', 'setting'],
    ['event', 'relationship', 'setting', 'problem'],
    ['turning-point', 'event', 'outcome'],
    ['variant', 'source-context', 'event'],
    ['outcome', 'meaning', 'source-context']
  ];
  return fallback[(sceneIndex || 1) - 1] || ['event', 'source-context', 'meaning'];
}

function scoreNarrationFact(record, types, context) {
  const typeIndex = (types || []).indexOf(record.factType);
  const typeScore = typeIndex === -1 ? 0 : (types.length - typeIndex) * 100;
  const entityScore = Array.isArray(record.entities) && record.entities.length ? 20 : 0;
  const textScore = Math.min(40, countWords(record.factText));
  const priorityScore = Math.max(0, 20 - Number(record.sourcePriority || 0));
  const reusePenalty = context.globalUsedFactIds.has(record.id) ? 80 : 0;
  return typeScore + entityScore + textScore + priorityScore - reusePenalty;
}

function selectLead(leads, context, record) {
  const seed = ((context.scene?.sceneIndex || 1) * 7) + ((context.partPlan?.partIndex || 1) * 11) + (record.sequenceIndex || 0);
  return leads[seed % leads.length];
}

function isCompleteSentence(value) {
  const text = cleanNarrationText(value);
  return /[.!?]$/.test(text) && hasSentencePredicate(text);
}

function hasSentencePredicate(value) {
  const text = cleanNarrationText(value);
  if (!text || text.split(/\s+/).length < 4) return false;
  return /\b(?:is|are|was|were|be|been|being|has|have|had|includes?|uses?|punishes?|binds?|becomes?|became|came|begins?|starts?|centers?|follows?|moves?|appears?|spread|spreads|differs?|changes?|keeps?|shows?|connects?|explains?|represents?|preserves?|records?|mentions?|prints?|refers?|points?|marks?|adds?|remains?|returns?|searches?|restrains?|slows?|steals?|hides?|speaks?|opens?|closes?|vanishes?|arrives?|leaves?|turns?|reveals?|discovers?|travels?|carries?|creates?|gives?|takes?|waits?|prepares?|confronts?|identifies?|depends?|describes?|invites?|solves?|reads?|causes?|transforms?|flattens?|states?|claims?|made|left|held|kept|known|called)\b|[a-z]{4,}(?:ed|ing|s)\b/i.test(text);
}

function hasFactDensity(part, factById) {
  const records = (part.sourceFactIds || []).map((id) => factById.get(id)).filter(Boolean);
  if (!records.length) return false;
  const concreteTypes = new Set(['subject', 'relationship', 'setting', 'problem', 'event', 'turning-point', 'outcome', 'variant', 'source-context', 'meaning', 'visual']);
  return records.some((record) => concreteTypes.has(record.factType) && countWords(record.factText) >= 3);
}

function validateSceneFactFit(sceneIndex, part, factById, contentType, errors) {
  const records = (part.sourceFactIds || []).map((id) => factById.get(id)).filter(Boolean);
  const types = new Set(records.map((record) => record.factType));
  const label = `Scene ${sceneIndex} Part ${part.partIndex || '?'}`;
  if (sceneIndex === 1 && !hasAny(types, ['subject', 'problem', 'event', 'relationship', 'setting'])) errors.push(`${label} lacks opening fact type.`);
  if (sceneIndex === 2 && !hasAny(types, ['event', 'relationship', 'setting', 'problem', 'source-context', 'visual', 'subject'])) errors.push(`${label} lacks sequence fact type.`);
  if (sceneIndex === 3 && !hasAny(types, ['turning-point', 'event', 'outcome', 'variant'])) errors.push(`${label} lacks turn/consequence fact type.`);
  if (sceneIndex === 4 && !hasAny(types, ['variant', 'source-context', 'meaning'])) errors.push(`${label} lacks variant/source fact type.`);
  if (sceneIndex === 5 && !hasAny(types, ['outcome', 'meaning', 'source-context'])) errors.push(`${label} lacks outcome/meaning fact type.`);
  if (contentType === 'internet-folklore' && sceneIndex <= 2 && !hasAny(types, ['event', 'source-context', 'subject', 'visual'])) {
    errors.push(`${label} lacks internet folklore fact type.`);
  }
}

function hasAny(set, values) {
  return values.some((value) => set.has(value));
}

function ensureSentence(value) {
  const text = cleanNarrationText(value).replace(/\s+([.!?])/g, '$1');
  if (!text) return '';
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function stripFinalPunctuation(value) {
  return cleanNarrationText(value).replace(/[.!?]+$/g, '').trim();
}

function lowercaseStart(value) {
  const text = stripFinalPunctuation(value);
  return text ? `${text.charAt(0).toLowerCase()}${text.slice(1)}` : '';
}

function splitSentences(value) {
  return String(value || '').match(/[^.!?]+[.!?]+/g)?.map((item) => item.trim()).filter(Boolean) || [];
}

function countWords(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

function hasDuplicateNarration(parts) {
  const seen = new Set();
  for (const part of parts) {
    const key = comparableNarration(part);
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

function comparableNarration(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function unique(values) {
  const seen = new Set();
  const output = [];
  for (const value of values || []) {
    const text = cleanNarrationText(value);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    output.push(text);
  }
  return output;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

module.exports = {
  buildCreatorLongform,
  buildNarrationPart,
  realizeFactRecord,
  buildFactSentence,
  buildFactTransition,
  selectPartFactRecords,
  validateNarrationPart,
  validateCreatorLongform,
  estimateNarrationReadTime,
  detectGenericNarration,
  detectBrokenNarration,
  detectInternalNarrationMetadata,
  detectNarrationMetaLanguage: detectInternalNarrationMetadata,
  cleanNarrationText
};
