const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const scriptsPath = path.join(root, 'data', 'scripts.json');
const publishedAt = '2026-07-17';

const stories = readJson(storiesPath);
const scripts = readJson(scriptsPath);
const existingSlugs = new Set(scripts.map((script) => script.slug));

const recordStories = stories.filter((story) => story.publishedAt === publishedAt && story.contentType === 'story');
const additions = [];

for (const story of recordStories) {
  const script = buildCreatorLibraryEntry(story);
  if (existingSlugs.has(script.slug)) {
    console.warn(`Skipped duplicate script slug: ${script.slug}`);
    continue;
  }
  existingSlugs.add(script.slug);
  additions.push(script);
}

scripts.unshift(...additions.reverse());
writeJson(scriptsPath, scripts);
console.log(`Added ${additions.length} record-centered Creator Library scripts.`);

function buildCreatorLibraryEntry(story) {
  const subject = story.title.replace(/:.*$/, '').trim();
  const slug = `${story.slug}-youtube-script`;
  const recordObject = recordObjectFromStory(story);
  const setting = settingFromStory(story);
  const motif = story.primaryTag || story.tag || 'Record Folklore';
  const mood = moodForCategory(story.categorySlug);
  const shortSubject = shortenSubject(subject);
  const genreLabel = `${story.category} Creator Library`;

  return {
    id: slug,
    slug,
    contentType: 'script',
    originalStorySlug: story.slug,
    title: `${subject} YouTube Script`,
    seoTitle: `Free ${subject} YouTube Script`,
    metaDescription: `A creator-ready production workspace for ${subject}, with story summary, scene narration, image prompts, music keywords, and editing notes.`,
    genre: genreLabel,
    estimatedVideoLength: '8-10 minutes',
    longformIncluded: true,
    shortsIncluded: true,
    imagePromptsIncluded: true,
    thumbnailIdeasIncluded: true,
    publishedAt,
    updatedAt: publishedAt,
    tags: unique([
      `${story.category.toLowerCase()} script`,
      `${motif.toLowerCase()} script`,
      'creator library',
      'youtube script',
      'shorts script',
      'image prompt'
    ]).slice(0, 6),
    deck: `${subject} is prepared as a creator-ready production page built around ${story.detail || 'a strange written record'}.`,
    logline: `${subject} works as a video because an ordinary ${recordObject} contains one detail that feels too specific to ignore.`,
    longformScript: buildLongformScript({ subject, recordObject, setting, motif, mood, story }),
    shortsScript: buildShortsScript({ subject, recordObject, story }),
    imagePrompts: buildImagePrompts({ subject, recordObject, setting, mood, story }),
    thumbnailIdeas: [
      `${shortSubject} with bold text: THE RECORD DOES NOT MATCH`,
      `Close-up of the ${recordObject} with one impossible detail highlighted`,
      `Split thumbnail: ordinary paperwork on one side, unsettling clue on the other`
    ],
    subtitleLines: [
      'The record looks ordinary at first.',
      'Then one detail refuses to fit.',
      'That is where the mystery begins.'
    ]
  };
}

function buildLongformScript({ subject, recordObject, setting, motif, mood, story }) {
  return [
    `At first, ${subject} sounds like a small paperwork problem.\n\nA ${recordObject} appears in an ordinary ${setting}. Nothing about it should feel impossible. It should be easy to file, explain, and forget.`,
    `But the record contains one detail that does not settle.\n\n${sentenceCase(story.detail)}. That detail changes the whole scene. It turns a normal document into the center of the story.`,
    `This is why the record matters.\n\nA rumor can feel loose. A witness can be uncertain. But a written entry feels colder. It gives the mystery a date, a place, and a shape.`,
    `The strongest version of this story is not about proving every strange claim.\n\nIt is about the pressure created by the record. The ${recordObject} seems to know something the people around it cannot explain.`,
    `For the video, keep the mood ${mood.toLowerCase()}.\n\nShow the ${setting} first. Let it feel normal. Then move closer to the written detail, as if the viewer is discovering the problem for themselves.`,
    `By the end, the question should remain simple.\n\nWas this a mistake, a missing context, or a story that grew around a real-looking trace? The ${motif.toLowerCase()} does not give a final answer. It leaves a record behind.`
  ];
}

function buildShortsScript({ subject, recordObject, story }) {
  return [
    `${subject} begins with an ordinary ${recordObject}.`,
    'Then one detail refuses to match the world around it.',
    `${sentenceCase(story.detail)}.`,
    'That is enough to turn paperwork into folklore.',
    'The record ends. The question stays open.'
  ];
}

function buildImagePrompts({ subject, recordObject, setting, mood, story }) {
  const detail = story.detail || 'one impossible detail sits inside an otherwise ordinary written record';
  return [
    `A quiet ${setting} is shown in a realistic documentary style, with an ordinary ${recordObject} placed where the viewer can clearly notice it. The scene should feel ${mood.toLowerCase()}, with muted colors, soft shadows, natural imperfections, and no exaggerated horror.`,
    `A close view of the ${recordObject} reveals the central problem: ${detail}. The image should look like a believable archive or office photograph, with readable composition, restrained lighting, and a calm mystery atmosphere.`,
    `The final image shows the ${setting} after the record has been found, with the ${recordObject} left in the frame like a piece of evidence. Use realistic texture, low-key lighting, quiet tension, and a grounded archival mood.`
  ];
}

function recordObjectFromStory(story) {
  const text = `${story.title} ${story.detail || ''} ${story.evidence || ''}`.toLowerCase();
  const pairs = [
    ['ledger', 'ledger'],
    ['logbook', 'logbook'],
    ['log ', 'log'],
    ['register', 'register'],
    ['receipt', 'receipt'],
    ['ticket', 'ticket'],
    ['map', 'map'],
    ['chart', 'chart'],
    ['catalog', 'catalog'],
    ['index', 'index'],
    ['inventory', 'inventory'],
    ['card', 'card'],
    ['file', 'file'],
    ['sheet', 'sheet'],
    ['transcript', 'transcript'],
    ['report', 'report'],
    ['permit', 'permit'],
    ['roll', 'roll'],
    ['book', 'book'],
    ['tablet', 'tablet'],
    ['scroll', 'scroll']
  ];
  return pairs.find(([needle]) => text.includes(needle))?.[1] || 'record';
}

function settingFromStory(story) {
  const text = `${story.title} ${story.detail || ''} ${story.evidence || ''}`.toLowerCase();
  if (/school|locker|classroom/.test(text)) return 'school hallway';
  if (/hospital|coroner|lab|pharmacy/.test(text)) return 'clinical archive room';
  if (/hotel|motel|guestbook|room/.test(text)) return 'old hotel office';
  if (/library|catalog|archive|call slip/.test(text)) return 'archive reading room';
  if (/subway|train|bus|railway|station|airport|ferry/.test(text)) return 'transit station';
  if (/forest|trail|campground|grove|lake|river|storm|rain|frost|ice/.test(text)) return 'quiet natural landscape';
  if (/temple|shrine|chapel|abbey|parish/.test(text)) return 'sacred interior';
  if (/cloud|browser|forum|chat|account|password|livestream|document/.test(text)) return 'dim workspace with a screen';
  if (/myth|god|dragon|griffin|serpent|giant|stag|owl/.test(text)) return 'mythic landscape';
  return 'ordinary public place';
}

function moodForCategory(slug) {
  const moods = {
    'urban-legends': 'restrained and uncanny',
    'internet-folklore': 'digital and uneasy',
    'strange-places': 'quiet and spatially unsettling',
    'unexplained-mysteries': 'careful and investigative',
    'classic-folklore': 'old, intimate, and folkloric',
    'modern-legends': 'modern and quietly tense',
    myths: 'ancient and symbolic',
    'mythic-creatures': 'mythic and atmospheric',
    'lost-worlds': 'distant and archival',
    'strange-nature': 'natural and mysterious',
    'legendary-places': 'sacred and subdued',
    'mythic-objects': 'symbolic and close',
    'legend-origins': 'clear and analytical'
  };
  return moods[slug] || 'calm and mysterious';
}

function shortenSubject(subject) {
  return subject.replace(/^The\s+/i, '').split(/\s+/).slice(0, 5).join(' ');
}

function sentenceCase(text) {
  const value = String(text || '').trim();
  if (!value) return 'One detail in the record refuses to match the rest of the story';
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/[.]+$/, '');
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
