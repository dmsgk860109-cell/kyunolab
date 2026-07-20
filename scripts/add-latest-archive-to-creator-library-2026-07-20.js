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
    estimatedVideoLength: '8-10 minutes',
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
      directionTip: sceneFocuses[index] || sceneFocuses[sceneFocuses.length - 1]
    })),
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

  return [
    `At first, ${subject} can sound like a story everyone already knows.\n\nBut the familiar version is only the doorway. Once you slow down, the details begin to matter.`,
    `${firstFact}\n\nThat image gives the video its first shape. It is simple enough to picture, but it leaves room for doubt.`,
    `${secondFact}\n\nSome versions change the setting. Others change the reason the story is remembered. What stays important is the pressure created by the central motif: ${String(motif).toLowerCase()}.`,
    `${origin} gives the story a wider frame.\n\nThis is where the video should stay careful. The goal is not to flatten every version into one answer. The goal is to show why the story kept moving.`,
    `${thirdFact}\n\nThe best way to present it is to let the viewer notice the pattern first. Then let the question arrive naturally.`,
    `${sentence(meaning)}\n\n${sentence(limit)}\n\nBy the end, ${subject} should feel less like a solved entry and more like a story that still has one quiet question left inside it.`
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
  return [
    `The viewer recognizes ${subject} as a familiar story, but not as a solved one.`,
    'The central image becomes clear enough for the audience to understand the mystery.',
    'The viewer senses that different versions preserve the same unresolved tension.'
  ];
}

function buildImagePrompts(subject, story, setting, mood, focuses) {
  const anchor = story.sceneAnchor || story.detail || story.excerpt || subject;
  const vocabulary = (story.subjectSpecificVocabulary || []).slice(0, 4).join(', ');
  return [
    `A quiet ${setting} opens the scene around ${subject}, showing the subject as part of a believable world rather than a staged illustration. The lighting is restrained, the colors are muted, and the atmosphere feels ${mood}, with a realistic documentary texture and no exaggerated horror.`,
    `The camera moves closer to the story's central image: ${anchor}. The scene should make the important detail easy to notice without turning it into a fantasy poster, using natural shadows, grounded composition, and a calm mystery archive feeling.`,
    `A final reflective image shows ${subject} through the ideas of ${vocabulary || story.category}. The scene should feel unresolved but readable, with soft contrast, subdued color, realistic surfaces, and enough empty space for narration or title text.`
  ];
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
