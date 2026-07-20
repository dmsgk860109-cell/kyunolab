const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const scriptsPath = path.join(root, 'data', 'scripts.json');
const categoriesPath = path.join(root, 'data', 'categories.json');

const publishedAt = '2026-07-20';
const perCategory = 3;

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

function buildCreatorLibraryEntry(story, category) {
  const subject = cleanSubject(story.title);
  const slug = `${story.slug}-youtube-script`;
  const motif = story.primaryTag || story.tag || story.contentDNA?.centralMotif || category.title;
  const setting = settingForStory(story);
  const mood = moodForCategory(story.categorySlug);
  const facts = storyFacts(story);
  const angle = story.uniqueAngle || story.summaryAnswer || story.excerpt || `${subject} remains a memorable ${category.title} story.`;
  const longformScript = buildLongformScript(subject, story, facts, motif);
  const sceneFocuses = buildSceneFocuses(subject, story, facts);
  const visualGuide = buildVisualGuide(subject, story, setting, mood, sceneFocuses, longformScript);
  const imagePrompts = visualGuide.flatMap((scene) => scene.narrationParts || [])
    .flatMap((part) => part.visualBeats || [])
    .map((beat) => beat.imagePrompt)
    .filter(Boolean);
  const estimatedVideoLength = estimateLongformVideoLength(story, longformScript);

  return {
    id: slug,
    slug,
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
    shortsScript: buildShortsScript(subject, story, facts),
    imagePrompts,
    visualGuide,
    runtimePlan: buildRuntimePlan(longformScript, estimatedVideoLength),
    thumbnailIdeas: buildThumbnailIdeas(subject, story),
    subtitleLines: buildSubtitleLines(subject, facts)
  };
}

function buildLongformScript(subject, story, facts, motif) {
  const origin = narrationSentence(story.publicSourceBasis || story.storyBrief?.cultureOrContext || story.evidence || 'the surviving tradition and later retellings');
  const firstFact = narrationSentence(facts[0] || `${subject} is remembered because one clear image carries the whole story.`);
  const secondFact = narrationSentence(facts[1] || 'The details change across retellings, but the central idea remains easy to recognize.');
  const thirdFact = narrationSentence(facts[2] || 'The strongest version keeps the mystery grounded in what the record can support.');
  const meaning = narrationSentence(story.storyBrief?.editorialInterpretationOptions?.[0] || story.uniqueAngle || `${subject} works because it turns a familiar idea into a question the viewer can hold.`);
  const limit = narrationSentence(story.sourceNotes?.sourceLimits?.[0] || 'The source trail should be treated with care, especially where later versions simplify older material.');
  const variant = narrationSentence(story.storyBrief?.reportedVariants?.[0]?.claim || 'Later versions often shift the details, but they keep the same unresolved center.');
  const sourceNote = narrationSentence(story.publicSourceNoteSeed || story.publicArticlePlan?.publicSourceNote || limit);
  const detail = narrationSentence(story.detail || story.sceneAnchor || firstFact);

  return [
    `At first, ${subject} may sound familiar.\n\nThat is part of its power. The story does not begin by asking us to believe everything at once. It begins with one image, one place, or one strange detail that is easy to hold in the mind.`,
    `${firstFact}\n\nThat first detail gives the story its shape. It tells us what to notice before we start asking whether the account is history, folklore, memory, or a mixture of all three. It gives the story a clear point of entry.`,
    `${detail}\n\nThe strongest version stays close to that central image. It does not need a long list of shocks. It needs a clear situation, a small turn, and the feeling that something ordinary has slipped out of place. That small turn is often what makes the story easy to repeat.`,
    `${secondFact}\n\nThis is where the story becomes more than a single event. Retellings may change names, locations, or motives, but they often keep the same pressure at the center: ${String(motif).toLowerCase()}. The repeated motif becomes the thread that holds the versions together.`,
    `${variant}\n\nA variant like this matters because it shows how the story travels. One version may make the setting more local. Another may make the warning sharper. Another may leave more space for doubt. The changes are part of the record, not a problem to erase.`,
    `${origin}\n\nThat wider frame helps separate the stable part of the tradition from the details that later storytellers may have added. It also keeps the story from becoming flatter than it really is. The older frame gives the video a stronger sense of context.`,
    `${sourceNote}\n\nThat uncertainty does not weaken the story. It gives the account its archive quality. We can follow the pattern, but we still have to admit where the record stops speaking clearly. That honesty keeps the mystery grounded.`,
    `${limit}\n\nThat limit matters. The story works best when it stays honest about what can be traced, what is repeated, and what remains part of the legend's atmosphere. The uncertainty comes from the tradition itself, not from added drama.`,
    `${thirdFact}\n\nBy this point, the pattern is usually clearer than any single answer. A familiar detail, a repeated image, and one unresolved question hold the story together. The shape of the legend is clear before the final reflection arrives.`,
    `${meaning}\n\nIn the end, ${subject} remains interesting because it does not close itself neatly. Something recognizable has passed through the story, but it has not fully explained itself. That is why the final question stays with us, and why the story can keep returning without needing a new ending.`
  ];
}

function buildShortsScript(subject, story, facts) {
  const firstFact = facts[0] || `${subject} is built around one image people do not forget.`;
  const detail = story.detail || story.sceneAnchor || firstFact;
  return [
    `${subject} begins with one image people remember.`,
    `${shortNarrationLine(firstFact, subject)}`,
    `${shortNarrationLine(detail, subject)}`,
    `Each retelling changes the edges.`,
    `The central question still remains.`
  ];
}

function buildSceneFocuses(subject, story, facts) {
  const topic = story.storyBrief?.topic || subject;
  const variants = story.storyBrief?.reportedVariants || [];
  const location = story.subjectSpecificVocabulary?.find((term) => /road|avenue|cemetery|lake|mount|tower|forest|island|city|stone|room|hall/i.test(term));
  return [
    `The opening image makes ${topic}${location ? ` feel tied to ${location}` : ' feel specific'}.`,
    `The central event is visible before the explanation begins.`,
    variants[0]?.claim ? `A known variant shifts the emphasis without changing the core story.` : `The stable core of ${topic} stays separate from later retellings.`,
    `The source trail feels careful without turning into a lesson.`,
    `The ending leaves ${topic} with one unresolved meaning.`
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
    return {
      sceneRole: sceneRoleForGeneratedScene(index),
      sceneFocus,
      directionTip: sceneFocus,
      voiceDirection: voiceDirectionForGeneratedScene(index),
      soundEffect: soundEffectForGeneratedScene(story, index),
      visualDirection: visualDirectionForScene(subject, story, index),
      narrationParts: sceneParts.map((narration, partIndex) => ({
        narration,
        estimatedReadingTime: secondsToApproxLabel(estimatedNarrationSecondsFromText(narration)),
        creatorNote: creatorNoteForNarrationPart(subject, story, sceneFocus, narration, index, partIndex),
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

function voiceDirectionForGeneratedScene(index) {
  return [
    'Calm documentary delivery, slow opening pace.',
    'Natural delivery with slight tension on the turn.',
    'Clear and balanced, keeping variants separate.',
    'Quiet, source-aware, without sounding academic.',
    'Reflective, soft ending, emphasize the final question.'
  ][index] || 'Calm, natural documentary delivery.';
}

function soundEffectForGeneratedScene(story, index) {
  const context = `${story.title || ''} ${story.categorySlug || ''} ${(story.subjectSpecificVocabulary || []).join(' ')}`.toLowerCase();
  if (index === 0 && /road|avenue|hitchhiker|car|driver/.test(context)) return 'distant road ambience, soft night wind';
  if (/storm|hunt|wind|forest|sky/.test(context)) return index <= 1 ? 'distant wind, low thunder, faint horn-like ambience' : 'cold wind, distant movement';
  if (/mount|kingdom|temple|monastery|shambhala|olympus/.test(context)) return 'high mountain wind, distant bell ambience';
  if (/water|lake|river|sea|island/.test(context)) return 'low water ambience, distant wind';
  if (index === 3) return 'quiet paper movement, soft room tone';
  return '';
}

function creatorNoteForNarrationPart(subject, story, sceneFocus, narration, sceneIndex, partIndex) {
  const topic = story.storyBrief?.topic || subject;
  const firstNoun = (story.subjectSpecificVocabulary || []).find(Boolean) || topic;
  const notes = [
    `Anchor ${topic} in one concrete opening image before the wider explanation begins.`,
    `Keep the focus on ${firstNoun} so this part moves from familiar detail to the first question.`,
    `Show the central turn in ${topic} without adding events beyond the archive record.`,
    `Separate the stable story from the variant details while keeping the same emotional thread.`,
    `Use source-like visuals to signal uncertainty without turning the part into a lesson.`,
    `End this part on the unresolved meaning that keeps ${topic} useful for the final scene.`
  ];
  const note = notes[Math.min(notes.length - 1, sceneIndex + partIndex)];
  if (/variant|version|retelling|later/i.test(narration)) {
    return `Clarify how this retelling changes ${topic} while keeping the core story recognizable.`;
  }
  if (/source|record|uncertain|evidence|trace|support/i.test(narration)) {
    return `Show what the archive trail can support, and leave unsupported claims visually restrained.`;
  }
  if (/in the end|final|question|remains/i.test(narration)) {
    return `Let the final image hold the unanswered question instead of resolving ${topic} too neatly.`;
  }
  return note || `Keep this part specific to ${sceneFocus}`;
}

function visualBeatsForNarrationPart(subject, story, setting, mood, sceneFocus, narration, sceneIndex, partIndex) {
  const seconds = estimatedNarrationSecondsFromText(narration);
  const count = seconds >= 23 ? 3 : seconds >= 13 ? 2 : 1;
  const base = visualBeatSeeds(subject, story, setting, mood, sceneFocus, narration, sceneIndex, partIndex);
  return base.slice(0, count).map((seed, index) => ({
    label: `Image Prompt ${index + 1}`,
    imagePrompt: seed,
    motionPrompt: motionPromptForVisualBeat(seed, index)
  }));
}

function visualBeatSeeds(subject, story, setting, mood, sceneFocus, narration, sceneIndex, partIndex) {
  const anchor = story.sceneAnchor || story.detail || story.excerpt || subject;
  const vocabulary = (story.subjectSpecificVocabulary || []).slice(0, 3).join(', ');
  const cleanPlace = cleanSetting(setting);
  const sceneContext = `${sceneFocus} ${narration}`.replace(/\s+/g, ' ').trim();
  return [
    `A grounded establishing view of ${cleanPlace} connected to ${subject}, with the main visual idea from this narration part clearly visible: ${shortPromptFragment(sceneContext)}. Use realistic documentary texture, muted colors, restrained ${mood} atmosphere, and a composition that leaves room for narration.`,
    `A closer production still focused on ${anchor}, placed inside a believable space related to ${subject}. The important detail should be visible without exaggerated horror, with natural shadows, source-aware realism, and no unrelated characters or locations.`,
    `A quiet transition image using ${vocabulary || story.category || subject} as visual anchors for this part of ${subject}. The frame should feel distinct from the previous beat, with subdued color, readable subject placement, and no invented incident beyond the archive story.`
  ];
}

function shortPromptFragment(text) {
  return sentence(text).split(/\s+/).slice(0, 26).join(' ');
}

function estimatedNarrationSecondsFromText(narration) {
  const wordCount = String(narration || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(8, Math.round(wordCount / 2.35));
}

function secondsToApproxLabel(seconds) {
  return `≈ ${seconds} sec`;
}

function motionPromptForVisualBeat(prompt, index) {
  const motions = [
    'Use a slow controlled push-in that keeps the subject readable.',
    'Use a gentle lateral move across the frame, avoiding sudden motion.',
    'Hold briefly on the key detail, then fade with restrained movement.'
  ];
  return motions[index] || 'Keep camera motion subtle and steady.';
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

function estimateLongformVideoLength(story, longformScript) {
  const score = informationDepthScore(story);
  const runtime = buildRuntimePlan(longformScript);
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

function buildRuntimePlan(longformScript, estimatedVideoLength = '') {
  const wordCount = longformScript.join(' ').trim().split(/\s+/).filter(Boolean).length;
  const narrationReadSeconds = Math.round(wordCount / 2.35);
  const sceneCount = Math.max(1, Math.min(5, longformScript.length));
  const plannedVisualSeconds = sceneCount * 10;
  const breathSeconds = Math.max(20, sceneCount * 7);
  const naturalFinalSeconds = narrationReadSeconds + plannedVisualSeconds + breathSeconds;
  const runtime = parseRuntimeRange(estimatedVideoLength);
  const estimatedFinalSeconds = Math.max(300, runtime?.minSeconds || 0, naturalFinalSeconds);
  return {
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
  if (/internet|creepypasta|online|digital|backrooms|jeff/.test(text)) return 'dim online archive space';
  if (/tower|castle|prison|penitentiary|hallway|building|apartment|hotel|cinema/.test(text)) return 'old interior space';
  if (/lake|island|sea|ocean|ship|kraken|selkie|hy-brasil|lyonesse|titicaca/.test(text)) return 'misty waterside landscape';
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
  const value = String(text || '').replace(/\s+/g, ' ').trim();
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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
