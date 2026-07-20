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
  const sceneFocuses = buildSceneFocuses(subject, story, facts);
  const imagePrompts = buildImagePrompts(subject, story, setting, mood, sceneFocuses);
  const longformScript = buildLongformScript(subject, story, facts, motif);
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
    visualGuide: imagePrompts.map((prompt, index) => ({
      aiImagePrompt: prompt,
      sceneFocus: sceneFocuses[index] || sceneFocuses[sceneFocuses.length - 1],
      directionTip: sceneFocuses[index] || sceneFocuses[sceneFocuses.length - 1],
      visualDirection: visualDirectionForScene(subject, story, index)
    })),
    runtimePlan: buildRuntimePlan(longformScript, estimatedVideoLength),
    thumbnailIdeas: buildThumbnailIdeas(subject, story),
    subtitleLines: buildSubtitleLines(subject, facts)
  };
}

function buildLongformScript(subject, story, facts, motif) {
  const origin = story.publicSourceBasis || story.storyBrief?.cultureOrContext || story.evidence || 'the surviving tradition and later retellings';
  const firstFact = facts[0] || `${subject} is remembered because one clear image carries the whole story.`;
  const secondFact = facts[1] || 'The details change across retellings, but the central idea remains easy to recognize.';
  const thirdFact = facts[2] || 'The strongest version keeps the mystery grounded in what the record can support.';
  const meaning = story.storyBrief?.editorialInterpretationOptions?.[0] || story.uniqueAngle || `${subject} works because it turns a familiar idea into a question the viewer can hold.`;
  const limit = story.sourceNotes?.sourceLimits?.[0] || 'The source trail should be treated with care, especially where later versions simplify older material.';
  const variant = story.storyBrief?.reportedVariants?.[0]?.claim || 'Later versions often shift the details, but they keep the same unresolved center.';
  const sourceNote = story.publicSourceNoteSeed || story.publicArticlePlan?.publicSourceNote || limit;
  const detail = story.detail || story.sceneAnchor || firstFact;

  return [
    `At first, ${subject} may sound familiar.\n\nThat is part of its power. The story does not begin by asking us to believe everything at once. It begins with one image, one place, or one strange detail that is easy to hold in the mind.`,
    `${sentence(firstFact)}\n\nThat first detail gives the story its shape. It tells us what to notice before we start asking whether the account is history, folklore, memory, or a mixture of all three.`,
    `${sentence(detail)}\n\nThe strongest version stays close to that central image. It does not need a long list of shocks. It needs a clear situation, a small turn, and the feeling that something ordinary has slipped out of place.`,
    `${sentence(secondFact)}\n\nThis is where the story becomes more than a single event. Retellings may change names, locations, or motives, but they often keep the same pressure at the center: ${String(motif).toLowerCase()}.`,
    `${sentence(variant)}\n\nA variant like this matters because it shows how the story travels. One version may make the setting more local. Another may make the warning sharper. Another may leave more space for doubt.`,
    `${sentence(origin)}\n\nThat wider frame helps separate the stable part of the tradition from the details that later storytellers may have added. It also keeps the story from becoming flatter than it really is.`,
    `${sentence(sourceNote)}\n\nThat uncertainty does not weaken the story. It gives the account its archive quality. We can follow the pattern, but we still have to admit where the record stops speaking clearly.`,
    `${sentence(limit)}\n\nFor a mystery channel, that limit is important. The story works best when it stays honest about what can be traced, what is repeated, and what remains part of the legend's atmosphere.`,
    `${sentence(thirdFact)}\n\nBy this point, the pattern is usually clearer than any single answer. A familiar detail, a repeated image, and one unresolved question hold the story together.`,
    `${sentence(meaning)}\n\nIn the end, ${subject} remains interesting because it does not close itself neatly. Something recognizable has passed through the story, but it has not fully explained itself. That is why the final question stays with us.`
  ];
}

function buildShortsScript(subject, story, facts) {
  const firstFact = facts[0] || `${subject} is built around one image people do not forget.`;
  const detail = story.detail || story.sceneAnchor || firstFact;
  return [
    `${subject} sounds familiar, but one detail keeps it alive.`,
    `${sentence(firstFact)}`,
    `${sentence(detail)}`,
    `The story changes as people retell it.`,
    `But the question at the center does not go away.`
  ];
}

function buildSceneFocuses(subject, story, facts) {
  const topic = story.storyBrief?.topic || subject;
  const variants = story.storyBrief?.reportedVariants || [];
  const location = story.subjectSpecificVocabulary?.find((term) => /road|avenue|cemetery|lake|mount|tower|forest|island|city|stone|room|hall/i.test(term));
  return [
    `Introduce ${topic}${location ? ` through ${location}` : ''} as a specific story, not a generic mystery.`,
    `Explain the central event: ${sentence(facts[0] || story.detail || subject).replace(/\.$/, '')}.`,
    variants[0]?.claim ? `Show how one known variant changes the emphasis: ${variants[0].claim}` : `Separate the stable core of ${topic} from later retellings.`,
    `Clarify what the source trail can support without treating every later claim as certain.`,
    `End on the unresolved meaning that keeps ${topic} circulating.`
  ];
}

function buildImagePrompts(subject, story, setting, mood, focuses) {
  const anchor = story.sceneAnchor || story.detail || story.excerpt || subject;
  const vocabulary = (story.subjectSpecificVocabulary || []).slice(0, 4).join(', ');
  return [
    `A quiet ${setting} opens the scene around ${subject}, showing the subject as part of a believable world rather than a staged illustration. The lighting is restrained, the colors are muted, and the atmosphere feels ${mood}, with a realistic documentary texture and no exaggerated horror.`,
    `A grounded close view of the story's central image: ${anchor}. The important detail is visible inside a believable space, with natural shadows, restrained composition, and a calm mystery archive feeling.`,
    `A secondary scene presents a known variation or surrounding context for ${subject}, using ${vocabulary || story.category} as quiet visual anchors. The image feels grounded, source-aware, and distinct from the opening image.`,
    `An archive-style source scene shows notes, maps, clippings, or reference material connected to ${subject}. The frame should separate remembered tradition from uncertain later claims, with realistic paper texture and soft desk light.`,
    `A final reflective image shows ${subject} through the ideas of ${vocabulary || story.category}. The composition feels unresolved but readable, with soft contrast, subdued color, realistic surfaces, and enough empty space for narration or title text.`
  ];
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
  if (score >= 14 && runtime.estimatedFinalSeconds >= 450) return '8-10 minutes';
  if (score >= 10 && runtime.estimatedFinalSeconds >= 390) return '7-8 minutes';
  if (runtime.estimatedFinalSeconds >= 360 || score >= 7) return '6-7 minutes';
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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
