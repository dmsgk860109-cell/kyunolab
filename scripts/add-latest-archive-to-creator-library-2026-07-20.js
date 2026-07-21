const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const scriptsPath = path.join(root, 'data', 'scripts.json');
const categoriesPath = path.join(root, 'data', 'categories.json');

const publishedAt = '2026-07-21';
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
  if (/cicada|cryptography|steganography|tor|qr/.test(context)) {
    return [
      'keyboard clicks, quiet modem-like digital texture',
      'printer noise, soft paper handling, low computer fan',
      'urban ambience near a physical clue location',
      'quiet archive room, page movement, faint keyboard taps',
      'low digital ambience fading into silence'
    ][index] || 'subtle digital ambience';
  }
  if (/\bra(?:'s|s)?\b|solar boat|sun god|underworld|apep/.test(context)) {
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
  if (/bray road|beast|werewolf|road/.test(context)) {
    return [
      'rural road night ambience, distant wind',
      'grass movement, low animal-like rustle',
      'tires on empty road, field wind',
      'paper clipping movement, quiet room tone',
      'empty roadside wind fading out'
    ][index] || 'rural night ambience';
  }
  if (/basilisk|stone|serpent|medieval/.test(context)) {
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
  if (/black cat|superstition|omen/.test(context)) {
    return [
      'quiet street ambience, soft footsteps',
      'low night wind, faint indoor hearth tone',
      'street crossing ambience, distant bell',
      'old page movement, quiet folklore archive room',
      'soft night street ambience fading'
    ][index] || 'quiet street ambience';
  }
  if (index === 0 && /road|avenue|hitchhiker|car|driver/.test(context)) return 'distant road ambience, soft night wind';
  if (/storm|hunt|wind|forest|sky/.test(context)) return index <= 1 ? 'distant wind, low thunder, faint horn-like ambience' : 'cold wind, distant movement';
  if (/mount|kingdom|temple|monastery|shambhala|olympus/.test(context)) return 'high mountain wind, distant bell ambience';
  if (/water|lake|river|sea|island/.test(context)) return 'low water ambience, distant wind';
  if (index === 3) return 'quiet paper movement, soft room tone';
  return '';
}

function creatorNoteForNarrationPart(subject, story, sceneFocus, narration, sceneIndex, partIndex) {
  const topic = story.storyBrief?.topic || subject;
  const profile = storyProductionProfile(subject, story);
  const anchor = profile.objects[partIndex % profile.objects.length] || profile.mainSubject;
  const place = profile.places[sceneIndex % profile.places.length] || profile.setting;
  if (/variant|version|retelling|later/i.test(narration)) {
    const variantNotes = [
      `Show the version change through ${anchor}, while keeping ${topic}'s stable core visually separate from later claims.`,
      `Let ${place} show how this version shifts the setting without making the variant look like proof.`,
      `Use ${anchor} to mark the difference between the repeated motif and the detail added by later tellers.`,
      `Keep the variant readable as a separate layer, then return the viewer to the main thread of ${topic}.`
    ];
    return variantNotes[(sceneIndex + partIndex) % variantNotes.length];
  }
  if (/source|record|uncertain|evidence|trace|support/i.test(narration)) {
    const sourceNotes = [
      `Use ${place} and source-like objects to mark what can be traced, then leave uncertain details understated.`,
      `Place ${anchor} beside the source material so the viewer sees the gap between record and interpretation.`,
      `Make the archive material feel useful but incomplete; the image should not pretend the record proves more than it does.`,
      `Let the source layer slow the scene down before the story moves back into its unresolved question.`
    ];
    return sourceNotes[(sceneIndex + partIndex) % sourceNotes.length];
  }
  if (/in the end|final|question|remains/i.test(narration)) {
    return `Let the final image hold the unresolved question around ${topic}; do not add a new reveal.`;
  }
  if (sceneIndex === 0 && partIndex === 0) {
    return `Open with ${anchor} in ${place} so viewers can recognize the story before the explanation begins.`;
  }
  if (/begin|first|shape|point of entry|notice/i.test(narration)) {
    return `Turn ${anchor} into the visual entry point, then let the narration move toward the first question.`;
  }
  if (/central|event|turn|detail|image/i.test(narration)) {
    return `Make the key turn visible through ${anchor}, without inventing extra incidents outside the archive story.`;
  }
  return `Keep this part focused on ${sceneFocus || topic}, using ${anchor} as the production anchor.`;
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
  const place = profile.places[(sceneIndex + partIndex) % profile.places.length] || cleanSetting(setting);
  const mainObject = profile.objects[(sceneIndex + partIndex) % profile.objects.length] || profile.mainSubject;
  const secondaryObject = profile.objects[(sceneIndex + partIndex + 1) % profile.objects.length] || mainObject;
  const action = profile.actions[(sceneIndex + partIndex) % profile.actions.length] || 'presented clearly in the frame';
  const camera = profile.camera[(sceneIndex + partIndex) % profile.camera.length] || 'medium documentary composition';
  const atmosphere = profile.atmosphere || `restrained ${mood} atmosphere`;
  const time = profile.timeOfDay || 'low natural light';
  const exclusions = profile.exclusions || 'no gore, no exaggerated horror, no unrelated characters, no readable fake text';
  const sourceObject = profile.sourceObjects[(sceneIndex + partIndex) % profile.sourceObjects.length] || 'archival notes';

  return [
    `In ${place}, ${mainObject} appears clearly in the frame, ${action}. Frame the image with ${camera}, ${time}, muted colors, and ${atmosphere}. Keep it realistic and readable, with ${exclusions}.`,
    `A closer production still shows ${secondaryObject} as the important detail of ${subject}. The background remains tied to ${place}, the lighting stays natural and restrained, and the frame avoids unrelated symbols or locations.`,
    `An archive-aware transition image places ${sourceObject} beside visual references to ${profile.mainSubject}. Use soft desk light, realistic material texture, and enough empty space for narration while keeping later claims visually separate from the core story.`
  ];
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

  const profiles = [
    {
      match: /cicada|cryptography|steganography|tor|qr/,
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
      match: /basilisk|serpent|stone|medieval/,
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
      match: /black cat|superstition|omen/,
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

  const specific = profiles.find((profile) => profile.match.test(context))?.data || {};
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
  const profile = storyProductionProfile('', story);
  const motions = profile.motions || [
    'Use a slow controlled push-in that keeps the subject readable.',
    'Use a gentle lateral move across the frame as the narration advances.',
    'Hold on the important detail, then fade softly to the next beat.'
  ];
  const motion = motions[(sceneIndex + partIndex + index) % motions.length];
  if (/still|archive|document|record|source/i.test(prompt) && index > 1) {
    return 'Hold the frame steady, then use a soft fade before the next scene.';
  }
  return motion;
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
