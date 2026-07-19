const internalPublicPhrases = [
  'story brief confirmed',
  'confirmed external trace',
  'confirmed external traces',
  'existence confirmed',
  'circulation level',
  'unified kyunolab standard',
  'does not add new characters',
  'does not invent',
  'checked for invention',
  'story brief status',
  'the story brief classifies',
  'publishable status',
  'validation passed',
  'in this record',
  'if this record interests you',
  'related records',
  'source status',
  'myth narrative',
  'folklore legend',
  'urban modern legend',
  'internal content type',
  'circulation level',
  'a source-aware kyunolab record',
  'a source-aware record examining',
  'this kyunolab record explores',
  'this record follows',
  'this archive record describes',
  'the article should',
  'this page should',
  'the record should',
  'one possible reading is that [topic]',
  'turns a specific story into a larger pattern people can recognize and retell',
  'different versions of [topic]',
  'not as proof that every detail belongs to the earliest source',
  'the article follows common versions, documented context, and source limits without treating speculative or supernatural claims as verified fact',
  'different versions may preserve different details, so this page treats myth, folklore, rumor, source material, and interpretation carefully',
  'existence status',
  'existing story',
  'reported variant',
  'editorial interpretation',
  'what the sources can support',
  'is presented through the familiar story, its major variants, the source limits',
  'continues to work in cultural memory',
  'the familiar story, its major variants, the source limits',
  'this record separates the familiar story',
  'keeps the subject active in folklore memory',
  'may be read through the pattern preserved in its common versions',
  'later versions should remain separate from the core account',
  'a careful article should',
  'a source-aware reading should',
  'versions and interpretations can differ',
  'is discussed here as myths',
  'is discussed here as archive',
  'internal content type'
];

const forbiddenPublicHeadings = [
  'the existing story',
  'existing story',
  'reported variants',
  'reported variant',
  'editorial interpretation',
  'what the sources can support',
  'what the record can support',
  'common versions and later retellings',
  'meaning and interpretation',
  'background and context',
  'mythic context',
  'symbolic role',
  'source status',
  'final thoughts'
];

function buildPublicArticlePlan(story) {
  if (
    story.publicArticlePlan
    && Array.isArray(story.publicArticlePlan.sections)
    && !legacyPublicPlanDetected(story.publicArticlePlan)
  ) {
    return normalizePlan(story.publicArticlePlan, story);
  }

  if (!story.storyBrief) return null;

  const brief = story.storyBrief;
  const topic = brief.topic || story.displayTitle || story.title;
  const names = listText(brief.knownNames || [topic]);
  const firstCore = sentenceFrom(brief.coreStoryElements?.[0], `${topic} belongs to ${brief.cultureOrContext || story.category}.`);
  const secondCore = sentenceFrom(brief.coreStoryElements?.[1], `The best-known version gives the subject a clear image readers can follow.`);
  const thirdCore = sentenceFrom(brief.coreStoryElements?.[2], `The central event is remembered because it gives the story a compact shape.`);
  const variant = variantSentence(brief.reportedVariants?.[0]);
  const interpretation = sentenceFrom(brief.editorialInterpretationOptions?.[0], `The story may be read through its symbolic role rather than as a literal report.`);
  const uncertainty = sentenceFrom(brief.uncertainDetails?.[0], `Later versions do not always explain every detail in the same way.`);

  return normalizePlan({
    title: story.h1 || story.displayTitle || story.title,
    dek: buildTopicDek(story, brief, topic, { firstCore, secondCore }),
    quickAnswer: variableQuickAnswerFor(story, brief, { topic, firstCore, secondCore, thirdCore, variant }),
    introduction: variableIntroductionFor(story, brief, { topic, names, firstCore }),
    sections: variableSectionsFor(story, brief, { topic, firstCore, secondCore, thirdCore, variant, interpretation, uncertainty }),
    conclusion: {
      paragraphs: [
        `${topic} remains memorable because its strongest image stays clear even when later versions change names, motives, places, or explanations.`,
        `${topic} may be read through the familiar story, the important variants, and the possible meaning at the same time.`
      ],
      targetWords: { min: 100, max: 180 }
    },
    faq: variableFaqFor(story, brief, topic),
    publicSourceNote: buildBriefSourceNote(story, brief, topic)
  }, story);
}

function legacyPublicPlanDetected(plan) {
  const text = normalizeText(JSON.stringify(plan || {}));
  const headings = (plan.sections || []).map((section) => normalizeText(section.heading || section.title || ''));
  const legacyHeadings = new Set([
    'common versions and later retellings',
    'what the record can support'
  ]);
  const legacyHeadingCount = headings.filter((heading) => legacyHeadings.has(heading) || /^the core .* story$/.test(heading) || /^where .* belongs$/.test(heading) || /^why .* still works$/.test(heading)).length;
  const dek = normalizeText(plan.dek || '');
  const quickAnswer = normalizeText((plan.quickAnswer?.paragraphs || []).join(' '));
  return (
    text.includes('this record separates the familiar story')
    || text.includes('keeps the subject active in folklore memory')
    || text.includes('may be read through the pattern preserved in its common versions')
    || text.includes('a careful article should')
    || text.includes('the article should')
    || text.includes('this page should')
    || text.includes('a source-aware reading should')
    || legacyHeadingCount >= 3
    || duplicatePlanParagraphDetected(plan)
    || genericDekDetected(dek)
    || textSimilarity(dek, quickAnswer) > 0.72
    || genericSourceNoteDetected(normalizeText(plan.publicSourceNote || ''))
  );
}

function buildTopicDek(story, brief, topic, parts) {
  const customDek = customDekForStory(story.slug);
  if (customDek) return customDek;

  const existing = cleanPublicText(story.introSummary || story.excerpt || '', story);
  const summary = normalizeText(story.summaryAnswer || story.excerpt || '');
  if (
    existing
    && !genericDekDetected(normalizeText(existing))
    && !legacyPublicPlanDetected({ dek: existing, sections: [] })
    && textSimilarity(normalizeText(existing), summary) <= 0.72
  ) return existing;

  const core = sentenceFrom(brief.coreStoryElements?.[0], parts.firstCore);
  const second = sentenceFrom(brief.coreStoryElements?.[1], parts.secondCore);
  const phrase = `${core} ${second}`.replace(/\s+/g, ' ').trim();
  return trimWords(phrase, 42, `${topic} is followed through its best-known image, main story movement, and the details that later retellings keep changing.`);
}

function customDekForStory(slug) {
  return {
    'db-cooper-hijacking-mystery': 'A passenger using the name Dan Cooper left an aircraft by parachute and disappeared into one of America\'s most studied unsolved cases.',
    'island-of-the-dolls-xochimilco': 'In the canals of Xochimilco, old dolls hanging from trees turned a real island into one of Mexico City\'s most recognizable strange-place legends.',
    'spear-of-destiny-holy-lance': 'The legend asks how one weapon-shaped relic could gather authority, fear, imperial imagination, and arguments over sacred power across centuries.',
    'sewer-alligator-urban-legend': 'A city sewer is ordinary infrastructure until rumor turns it into a habitat. The sewer alligator legend gives the hidden city a body, a mouth, and a reason to look twice at every drain.',
    'backrooms-internet-folklore': 'The Backrooms made modern emptiness feel haunted without needing a traditional ghost. Its yellow rooms and humming lights turn familiar architecture into a place that cannot lead home.',
    'nazca-lines-mystery': 'The Nazca Lines make the desert feel marked for a viewer who is not standing on the ground. Their power comes from scale, survival, and the unfinished question of purpose.',
    'rendlesham-forest-incident': 'Rendlesham remains memorable because it joins a night forest, military witnesses, official paperwork, and unresolved lights. The case keeps uncertainty inside a visible record trail.',
    'selkie-folklore': 'Selkie folklore turns the shoreline into a boundary between two lives. The seal skin is not only magic; it is the fragile proof of where the selkie truly belongs.',
    'mothman-point-pleasant-legend': 'Mothman endures because the figure is never only a creature. Around Point Pleasant, red eyes and wings became a warning shape tied to place, memory, and disaster.',
    'icarus-flight-myth': 'Icarus is remembered at the instant freedom becomes danger. The myth keeps its force because the wish to rise and the risk of falling appear in the same image.',
    'kraken-sea-monster-folklore': 'The Kraken gives the ocean a hidden scale larger than the ship above it. Its folklore works because the surface of the sea never shows everything beneath.',
    'atlantis-lost-city': 'Atlantis began as a story of a powerful island and became the model for lost-world imagination. The legend asks why vanished places feel recoverable even when the map cannot hold them.',
    'blood-rain-phenomenon': 'Blood rain shows how quickly weather can become omen. A natural event may have a physical cause, but red rain still changes the emotional meaning of the sky.',
    'stonehenge-legendary-place': 'Stonehenge stands as a monument whose stones are clearer than its final meaning. Archaeology, legend, and sacred-place memory all gather around the same visible circle.',
    'ark-of-the-covenant-legend': 'The Ark of the Covenant is a mythic object because absence makes it more charged, not less. The sacred chest remains powerful through boundary, loss, and disputed memory.',
    'horseshoe-luck-origin': 'Horseshoe luck turns a stable object into a household sign. Iron, doorway, and threshold belief combine until a practical thing becomes a charm against uncertainty.'
  }[slug] || '';
}

function duplicatePlanParagraphDetected(plan) {
  const paragraphs = [
    ...(plan.quickAnswer?.paragraphs || []),
    ...(plan.introduction || []),
    ...((plan.sections || []).flatMap((section) => section.paragraphs || [])),
    ...(plan.conclusion?.paragraphs || []),
    plan.publicSourceNote
  ].map(normalizeText).filter((item) => item.length > 60);
  const seen = new Set();
  for (const paragraph of paragraphs) {
    if (seen.has(paragraph)) return true;
    seen.add(paragraph);
  }
  return false;
}

function variableQuickAnswerFor(story, brief, parts) {
  const variants = (brief.reportedVariants || []).map(variantSentence).filter(Boolean);
  const interpretation = (brief.editorialInterpretationOptions || []).map(sentenceFrom).filter(Boolean)[0];
  return {
    paragraphs: [
      `In brief, ${parts.firstCore} ${parts.secondCore}`.replace(/\s+/g, ' ').trim(),
      `The main movement is clear: ${parts.thirdCore} ${variants[0] || parts.variant} ${interpretation || `${parts.topic} may be read through the image that keeps returning in retellings.`}`.replace(/\s+/g, ' ').trim()
    ],
    targetWords: { min: 90, max: 180 }
  };
}

function variableIntroductionFor(story, brief, parts) {
  const known = parts.names ? ` It also appears through names such as ${parts.names}.` : '';
  const uncertainty = sentenceFrom(brief.uncertainDetails?.[0], '');
  const paragraphs = [
    `${parts.topic} does not need a new frame to feel strange. Its strongest details already carry the question readers come looking for.${known}`.replace(/\s+/g, ' ').trim(),
    `${parts.firstCore} ${uncertainty}`.replace(/\s+/g, ' ').trim()
  ].filter(Boolean);
  if (story.slug === 'cicada-3301-internet-puzzle') {
    paragraphs.push('QR codes were part of the puzzle trail, linking online clues to physical locations and making the hunt feel larger than a normal web riddle.');
  }
  return paragraphs;
}

function variableSectionsFor(story, brief, parts) {
  const headings = variableHeadingsFor(story, brief, parts.topic);
  return headings.map((heading, index) => ({
    heading,
    purpose: '',
    contentLayer: contentLayerForHeading(heading, index),
    targetWords: { min: 170, max: 360 },
    paragraphs: paragraphsForHeading(heading, index, story, brief, parts)
  })).filter((section) => section.paragraphs.length);
}

function variableHeadingsFor(story, brief, topic) {
  const fromStory = Array.isArray(story.seoHeadings)
    ? story.seoHeadings.map((heading) => String(heading || '').trim()).filter(Boolean)
    : [];
  const clean = fromStory.filter((heading) => !legacyPublicHeadingDetected(heading)).slice(0, 9);
  if (clean.length >= 3) return clean;

  const category = String(story.categorySlug || '').toLowerCase();
  if (category.includes('myth')) {
    return [
      `The First Image in ${topic}`,
      `The Choice That Moves the Myth`,
      `The Moment the Story Turns`,
      `How Later Versions Changed ${topic}`,
      `What ${topic} Can Mean`
    ];
  }
  if (category.includes('nature')) {
    return [
      `The Phenomenon People Watch For`,
      `The Conditions Behind the Sight`,
      `How Observation Became Lore`,
      `Why Reports Do Not Always Match`,
      `What the Moment Means`
    ];
  }
  if (category.includes('internet')) {
    return [
      `The Image That Started the Spread`,
      `How the Claim Moved Online`,
      `What Later Reposts Changed`,
      `Where the Hoax Frame Matters`,
      `Why the Face Remained Familiar`
    ];
  }
  return [
    `The Detail That Defines ${topic}`,
    `How the Story Is Usually Told`,
    `Where Later Versions Differ`,
    `What the Available Sources Show`,
    `Why ${topic} Remains Memorable`
  ];
}

function legacyPublicHeadingDetected(heading) {
  const normalized = normalizeText(heading);
  return (
    normalized === 'common versions and later retellings'
    || normalized === 'what the record can support'
    || /^the core .* story$/.test(normalized)
    || /^where .* belongs$/.test(normalized)
    || /^why .* still works$/.test(normalized)
  );
}

function contentLayerForHeading(heading, index) {
  const normalized = normalizeText(heading);
  if (/version|retelling|changed|differ|variant/.test(normalized)) return 'reported-variant';
  if (/mean|meaning|why|symbol|remain|memory|question/.test(normalized)) return 'variant-and-interpretation';
  if (/source|evidence|report|document|available/.test(normalized)) return 'source-context';
  return index <= 1 ? 'existing-story' : 'story-context';
}

function paragraphsForHeading(heading, index, story, brief, parts) {
  const normalized = normalizeText(heading);
  const core = (brief.coreStoryElements || []).map(sentenceFrom).filter(Boolean);
  const variants = (brief.reportedVariants || []).map(variantSentence).filter(Boolean);
  const meanings = (brief.editorialInterpretationOptions || []).map(sentenceFrom).filter(Boolean);
  const uncertainties = (brief.uncertainDetails || []).map(sentenceFrom).filter(Boolean);
  const isFinalSection = index >= Math.max(0, variableHeadingsFor(story, brief, parts.topic).length - 1);

  if (/version|retelling|changed|differ|variant/.test(normalized)) {
    return [
      `${variants[0] || parts.variant} ${variants[1] || ''}`.replace(/\s+/g, ' ').trim(),
      `${uncertainties[0] || 'Later versions do not always preserve the same emphasis.'} These differences may be read as clues to which details stay attached to the story and which details shift with each retelling.`
    ].filter(Boolean);
  }
  if (index <= 1) {
    const start = Math.min(index * 2, Math.max(0, core.length - 2));
    const selected = core.slice(start, start + 3);
    if (selected.length) {
      return [
        `${selected.slice(0, 2).join(' ')} The heading keeps the focus on ${lowerFirst(heading)}.`,
        `${selected[2] || parts.thirdCore} ${index === 0 ? parts.secondCore : ''}`.replace(/\s+/g, ' ').trim()
      ].filter(Boolean);
    }
  }
  if (/source|evidence|report|document|available|hoax|frame|repost|context|measurement|photograph|explanation/.test(normalized)) {
    const basis = story.publicSourceBasis || brief.cultureOrContext || story.category || 'the available tradition';
    return [
      `${heading} is where ${parts.topic} needs ${basis}. ${uncertainties[0] || ''}`.replace(/\s+/g, ' ').trim(),
      `${heading} keeps one difference visible: ${variants[0] || 'later retellings add emphasis, remove context, or simplify the older material.'} That difference may be read as part of the subject's reception history.`
    ].filter(Boolean);
  }
  if (isFinalSection || /mean|meaning|symbol|remain|memory|question|reveals|warn/.test(normalized)) {
    return [
      `${heading} points to the larger reading: ${meanings[0] || parts.interpretation} ${meanings[1] || ''}`.replace(/\s+/g, ' ').trim(),
      `${parts.topic} may be read through the detail that keeps returning in ${lowerFirst(heading)}: ${lowerFirst(story.sceneAnchor || story.detail || core[0] || 'the central image')}.`
    ].filter(Boolean);
  }

  const start = Math.min(index * 2, Math.max(0, core.length - 2));
  const selected = core.slice(start, start + 3);
  if (selected.length) {
    return [
      `${selected.slice(0, 2).join(' ')} The heading keeps the focus on ${lowerFirst(heading)}.`,
      `${selected[2] || parts.thirdCore} ${index === 0 ? parts.secondCore : ''}`.replace(/\s+/g, ' ').trim()
    ].filter(Boolean);
  }
  return [`${parts.firstCore} ${parts.secondCore}`.replace(/\s+/g, ' ').trim()];
}

function variableFaqFor(story, brief, topic) {
  if (Array.isArray(story.faqQuestions) && story.faqQuestions.length) {
    return story.faqQuestions.map((question, index) => ({
      q: question,
      a: faqAnswerForIndex(story, brief, topic, index)
    })).slice(0, 6);
  }

  return [
    {
      q: `Who or what is ${topic}?`,
      a: `${sentenceFrom(brief.coreStoryElements?.[0], `${topic} is connected with ${brief.cultureOrContext || story.category}.`)}`
    },
    {
      q: `Which detail is most important in ${topic}?`,
      a: `${sentenceFrom(brief.coreStoryElements?.[1], 'The memorable detail gives the subject its clearest image.')}`
    },
    {
      q: `How do later versions of ${topic} differ?`,
      a: `${variantSentence(brief.reportedVariants?.[0])}`
    },
    {
      q: `What can ${topic} suggest?`,
      a: `${sentenceFrom(brief.editorialInterpretationOptions?.[0], `${topic} may be read as a symbolic story rather than a literal report.`)}`
    }
  ];
}

function faqAnswerForIndex(story, brief, topic, index) {
  const core = (brief.coreStoryElements || []).map(sentenceFrom).filter(Boolean);
  const variants = (brief.reportedVariants || []).map(variantSentence).filter(Boolean);
  const meanings = (brief.editorialInterpretationOptions || []).map(sentenceFrom).filter(Boolean);
  const uncertainties = (brief.uncertainDetails || []).map(sentenceFrom).filter(Boolean);
  const answers = [
    core[0],
    core[1] || core[0],
    variants[0] || core[2],
    meanings[0],
    uncertainties[0] || variants[1],
    meanings[1] || core[3]
  ].filter(Boolean);
  return answers[index] || answers[0] || `${topic} is read through ${brief.cultureOrContext || story.category}.`;
}

function defaultSectionsFor(story, brief, parts) {
  const category = String(story.categorySlug || '').toLowerCase();
  if (category === 'myths' || String(brief.contentType || '').includes('myth')) {
    return [
      {
        heading: `Where ${parts.topic} Begins`,
        purpose: 'Introduce the mythic background and main figures.',
        contentLayer: 'existing-story',
        targetWords: { min: 220, max: 380 },
        paragraphs: [
          `${parts.firstCore} ${parts.secondCore}`,
          `${parts.topic} should be read through ${brief.cultureOrContext || 'its mythic tradition'}. The important background is the relationship between the figures, the problem the myth tries to explain, and the image that makes the story memorable.`
        ]
      },
      {
        heading: `The Central Event in ${parts.topic}`,
        purpose: 'Tell the remembered event as a connected sequence.',
        contentLayer: 'existing-story',
        targetWords: { min: 300, max: 500 },
        paragraphs: [
          `${parts.thirdCore} ${(brief.coreStoryElements || []).slice(3).map(sentenceFrom).join(' ')}`,
          `The story works because the event does not sit alone. It follows from the earlier conflict or condition, changes the world of the story, and leaves a result that later listeners can recognize.`
        ]
      },
      {
        heading: `How Later Versions Changed the Emphasis`,
        purpose: 'Explain important variants without forcing one final canon.',
        contentLayer: 'reported-variant',
        targetWords: { min: 180, max: 320 },
        paragraphs: [
          `${parts.variant} ${brief.reportedVariants?.[1] ? variantSentence(brief.reportedVariants[1]) : ''}`.trim(),
          `Those differences matter because mythology often survives through retelling. A version can preserve the same core image while changing a name, object, order, emphasis, or moral question.`
        ]
      },
      {
        heading: `What ${parts.topic} May Mean`,
        purpose: 'Present symbolic readings as possible readings.',
        contentLayer: 'variant-and-interpretation',
        targetWords: { min: 250, max: 450 },
        paragraphs: [
          `${parts.interpretation} ${brief.editorialInterpretationOptions?.[1] ? sentenceFrom(brief.editorialInterpretationOptions[1]) : ''}`.trim(),
          `${parts.uncertainty} That uncertainty is part of the reason the myth remains readable. It lets the story carry more than one question without pretending that one modern explanation closes the subject.`
        ]
      }
    ];
  }

  return [
    {
      heading: `What People Mean by ${parts.topic}`,
      purpose: 'Explain the basic story or claim.',
      contentLayer: 'existing-story',
      targetWords: { min: 220, max: 360 },
      paragraphs: [`${parts.firstCore} ${parts.secondCore}`, `${parts.thirdCore}`]
    },
    {
      heading: `How the Story Is Usually Told`,
      purpose: 'Describe the familiar sequence.',
      contentLayer: 'existing-story',
      targetWords: { min: 260, max: 420 },
      paragraphs: [
        `${(brief.coreStoryElements || []).map(sentenceFrom).join(' ')}`,
        `The story remains understandable because its parts are easy to picture and easy to repeat.`
      ]
    },
    {
      heading: `How Versions Differ`,
      purpose: 'Explain variants.',
      contentLayer: 'reported-variant',
      targetWords: { min: 180, max: 320 },
      paragraphs: [`${(brief.reportedVariants || []).map(variantSentence).join(' ')}`]
    },
    {
      heading: `Why the Story Still Works`,
      purpose: 'Explain meaning and survival.',
      contentLayer: 'variant-and-interpretation',
      targetWords: { min: 220, max: 360 },
      paragraphs: [`${(brief.editorialInterpretationOptions || []).map(sentenceFrom).join(' ')}`, `${parts.uncertainty}`]
    }
  ];
}

function defaultFaqFor(story, brief, topic) {
  const subject = topic.replace(/\s+Myth$/i, '');
  return [
    {
      q: `What is ${subject}?`,
      a: `${subject} is connected with ${brief.cultureOrContext || story.category}. ${sentenceFrom(brief.coreStoryElements?.[0], 'It is remembered through a repeated story pattern and later retellings.')}`
    },
    {
      q: `Why is ${subject} remembered?`,
      a: `${sentenceFrom(brief.coreStoryElements?.[1], 'The story gives readers a clear image and a question that can be retold in different ways.')}`
    },
    {
      q: `Do all versions of ${subject} agree?`,
      a: `${variantSentence(brief.reportedVariants?.[0])} Different versions can keep the same core story while changing emphasis.`
    },
    {
      q: `What can ${subject} symbolize?`,
      a: `${sentenceFrom(brief.editorialInterpretationOptions?.[0], 'It may be read as a symbolic story rather than a literal report.')}`
    }
  ];
}

function normalizePlan(plan, story) {
  const sections = (plan.sections || []).map((section) => ({
    id: slugify(section.id || section.heading || section.title),
    heading: section.heading || section.title,
    purpose: section.purpose || '',
    contentLayer: section.contentLayer || '',
    storyBriefInputs: section.storyBriefInputs || [],
    targetWords: section.targetWords || { min: 180, max: 380 },
    paragraphs: (section.paragraphs || []).filter(Boolean).map((paragraph) => cleanPublicText(paragraph, story))
  })).filter((section) => section.heading && section.paragraphs.length);

  return {
    title: plan.title || story.h1 || story.displayTitle || story.title,
    dek: cleanPublicDeck(plan.dek || story.introSummary || story.excerpt || story.summaryAnswer, story),
    quickAnswer: cleanQuickAnswer(plan.quickAnswer || null, story),
    introduction: (plan.introduction || []).filter(Boolean).map((paragraph) => cleanPublicText(paragraph, story)),
    sections,
    conclusion: cleanConclusion(plan.conclusion || null, story),
    faq: cleanFaq(Array.isArray(plan.faq) ? plan.faq : Array.isArray(plan.faqTopics) ? plan.faqTopics : [], story),
    publicSourceNote: cleanPublicSourceNote(plan.publicSourceNote || '', story)
  };
}

function cleanPublicDeck(value, story) {
  const text = cleanPublicText(value, story);
  const normalized = normalizeText(text);
  const hasInternalPhrase = internalPublicPhrases.some((phrase) => normalized.includes(phrase));
  if (text && !hasInternalPhrase) return text;

  const title = story.displayTitle || story.title || story.slug || 'This archive story';
  const brief = story.storyBrief || {};
  const context = brief.cultureOrContext || story.primaryTag || story.category || 'its tradition';
  return `${title} is presented as an archive story connected with ${context}, with the core tale separated from later retellings and possible meanings.`;
}

function cleanPublicSourceNote(value, story) {
  const text = cleanPublicText(value, story);
  const normalized = normalizeText(text);
  const hasInternalPhrase = internalPublicPhrases.some((phrase) => normalized.includes(phrase));
  if (text && !hasInternalPhrase) return text;

  const brief = story.storyBrief || {};
  return buildBriefSourceNote(story, brief, story.displayTitle || story.title || story.slug || 'This story');
}

function cleanQuickAnswer(quickAnswer, story) {
  if (!quickAnswer) return null;
  if (Array.isArray(quickAnswer.paragraphs)) {
    return {
      ...quickAnswer,
      paragraphs: quickAnswer.paragraphs.map((paragraph) => cleanPublicText(paragraph, story))
    };
  }
  if (quickAnswer.text) {
    return { ...quickAnswer, text: cleanPublicText(quickAnswer.text, story) };
  }
  return quickAnswer;
}

function cleanFaq(faq, story) {
  return (faq || []).map((item) => ({
    ...item,
    q: item.q || item.question,
    a: cleanPublicText(item.a || item.answer, story)
  }));
}

function cleanConclusion(conclusion, story) {
  if (!conclusion) return null;
  return {
    ...conclusion,
    paragraphs: (conclusion.paragraphs || []).filter(Boolean).map((paragraph) => cleanPublicText(paragraph, story))
  };
}

function cleanPublicText(value, story = {}) {
  const kind = publicStoryKind(story, story.storyBrief || {});
  return String(value || '')
    .replace(/\ba myth narrative connected with\b/gi, `${articleFor(kind)} ${kind} connected with`)
    .replace(/\bmyth narrative\b/gi, kind || 'mythological story')
    .replace(/\bfolklore legend\b/gi, 'folklore story')
    .replace(/\burban modern legend\b/gi, 'modern urban legend')
    .replace(/\bplace event mystery\b/gi, 'place-based mystery')
    .replace(/\borigin comparison\b/gi, 'origin-focused story')
    .replace(/\binternal content type\b/gi, 'story type')
    .replace(/\bSource Status\b/g, 'Source Basis')
    .replace(/\bsource status\b/g, 'source basis')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildBriefSourceNote(story, brief, topic) {
  const evidenceTitles = [
    ...(story.researchSources || []).map((item) => item.title),
    ...(brief.existenceEvidence || []).map((item) => item.title)
  ].filter(Boolean);
  const basis = story.publicSourceBasis || sourceBasisFromTitles(evidenceTitles, story, brief);
  const variants = Array.isArray(brief.reportedVariants)
    ? brief.reportedVariants.map((item) => item.claim || item).filter(Boolean).slice(0, 2)
    : [];
  const uncertainties = Array.isArray(brief.uncertainDetails) ? brief.uncertainDetails.slice(0, 1) : [];
  const variantText = variants.length ? ` Later retellings differ around ${lowerFirst(listForSentence(variants, 2))}.` : '';
  const uncertaintyText = uncertainties.length ? ` ${sentenceFrom(uncertainties[0])}` : '';
  return `${topic} is read here through ${basis}.${variantText}${uncertaintyText}`.replace(/\s+/g, ' ').trim();
}

function publicStoryKind(story, brief) {
  const category = String(story.categorySlug || story.category || '').toLowerCase();
  const type = String(brief.contentType || story.storyType || '').toLowerCase();
  if (category.includes('myth') || type.includes('myth')) return 'mythological story';
  if (category.includes('internet') || type.includes('internet')) return 'internet folklore story';
  if (category.includes('place') || type.includes('place')) return 'place-based legend';
  if (category.includes('nature')) return 'nature folklore story';
  if (category.includes('origin')) return 'folklore origin story';
  if (category.includes('mysteries') || type.includes('mystery')) return 'mystery story';
  if (category.includes('legend') || type.includes('legend')) return 'legend';
  return 'story';
}

function sourceBasisFromTitles(titles, story, brief) {
  const joined = titles.join(' ');
  if (/ovid/i.test(joined)) return "Ovid's Metamorphoses and later mythological retellings";
  if (/hesiod/i.test(joined)) return 'the Hesiodic tradition and later mythological retellings';
  if (/egyptian|ra|solar boat|funerary/i.test(joined) || /egyptian/i.test(story.primaryTag || story.tag || '')) {
    return 'Egyptian mythology references, funerary tradition summaries, and later retellings';
  }
  const first = cleanSourceTitle(titles[0]);
  if (first) return first;
  return brief.cultureOrContext || story.primaryTag || story.category || 'its source tradition';
}

function cleanSourceTitle(value) {
  return String(value || '')
    .replace(/\s+-\s+.*$/, '')
    .replace(/\s*\|\s*.*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function listForSentence(values) {
  const clean = (values || [])
    .map((value) => String(value || '').replace(/[.?!]+$/, '').trim())
    .filter(Boolean);
  if (!clean.length) return 'the main details';
  if (clean.length === 1) return clean[0];
  return `${clean.slice(0, -1).join(', ')} and ${clean[clean.length - 1]}`;
}

function lowerFirst(value) {
  return String(value || '').replace(/^([A-Z])/, (letter) => letter.toLowerCase());
}

function trimWords(value, maxWords, fallback) {
  const words = String(value || '').replace(/\s+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return fallback;
  if (words.length <= maxWords) return words.join(' ');
  return `${words.slice(0, maxWords).join(' ')}.`;
}

function articleFor(value) {
  return /^[aeiou]/i.test(String(value || '').trim()) ? 'an' : 'a';
}

function validatePublicArticleOutput(story, html) {
  const errors = [];
  const normalized = normalizeText(stripHtml(html));
  const headings = extractHeadings(html).map(normalizeText);
  const slug = String(story.slug || '');
  const isUnifiedPublicStory = story.storyBrief && story.contentStandard === 'unified';

  for (const phrase of internalPublicPhrases) {
    if (normalized.includes(phrase)) errors.push(`public article exposes internal phrase "${phrase}"`);
  }
  for (const heading of headings) {
    if (forbiddenPublicHeadings.includes(heading)) errors.push(`public heading uses internal label "${heading}"`);
  }

  if (story.storyBrief && !story.publicArticlePlan) {
    errors.push('missing publicArticlePlan for unified-policy story');
  }

  if (isUnifiedPublicStory) {
    const plan = story.publicArticlePlan || {};
    const dek = normalizeText(plan.dek || story.introSummary || '');
    const quickAnswer = normalizeText((plan.quickAnswer?.paragraphs || []).join(' '));
    const contentHeadings = publicContentHeadings(html).map(normalizeText);
    const sourceNote = normalizeText(plan.publicSourceNote || '');

    if (genericDekDetected(dek)) errors.push('genericDekDetected');
    if (textSimilarity(dek, quickAnswer) > 0.72) errors.push('dekQuickAnswerDuplicationDetected');
    if (legacySectionPatternDetected(contentHeadings)) errors.push('fixedFiveSectionPatternDetected');
    if (contentHeadings.length < 3) errors.push('insufficientSectionVariationDetected');
    if (contentHeadings.some((heading) => unnecessaryEvidenceHeadingDetected(slug, heading))) {
      errors.push('unnecessaryEvidenceSectionDetected');
    }
    if (genericFaqPatternDetected(plan.faq || [])) errors.push('genericFAQPatternDetected');
    if (genericSourceNoteDetected(sourceNote)) errors.push('genericSourceNoteDetected');
    if (legacyRendererFieldDetected(story)) errors.push('legacyRendererFieldDetected');
    if (abstractPaddingDetected(normalized)) errors.push('abstractPaddingDetected');
    if (possessiveGrammarErrorDetected(normalized)) errors.push('possessiveGrammarErrorDetected');
  }

  if (slug) {
    for (const sectionName of ['related-articles', 'prev-next', 'rail-feature']) {
      const section = extractClassBlock(html, sectionName);
      if (section.includes(`/stories/${slug}`)) errors.push(`${sectionName} links to the current story`);
    }
  }

  const paragraphs = extractParagraphs(html).map((item) => normalizeText(item)).filter((item) => item.length > 60);
  const seen = new Set();
  for (const paragraph of paragraphs) {
    if (seen.has(paragraph)) errors.push('public article repeats an identical paragraph');
    seen.add(paragraph);
  }

  return errors;
}

function legacySectionPatternDetected(headings) {
  const count = headings.filter((heading) => (
    heading === 'common versions and later retellings'
    || heading === 'what the record can support'
    || /^the core .* story$/.test(heading)
    || /^where .* belongs$/.test(heading)
    || /^why .* still works$/.test(heading)
  )).length;
  return count >= 2;
}

function genericFaqPatternDetected(faq) {
  const questions = (faq || []).map((item) => normalizeText(item.q || item.question || ''));
  const generic = questions.filter((question) => (
    /^what is /.test(question)
    || /^is .* based on a confirmed fact\?$/.test(question)
    || /^why does .* matter\?$/.test(question)
    || /^are all versions of .* the same\?$/.test(question)
  ));
  return generic.length >= 3;
}

function genericSourceNoteDetected(sourceNote) {
  return sourceNote.includes('may be read through the pattern preserved in its common versions')
    || sourceNote.includes('later versions should remain separate from the core account')
    || sourceNote.includes('this article follows') && !sourceNote.includes('through');
}

function legacyRendererFieldDetected(story) {
  return ['legacySections', 'recordSections', 'fixedSections', 'genericSections', 'archiveRecordBody', 'defaultFAQ', 'genericSourceNote', 'genericDek']
    .some((field) => Object.prototype.hasOwnProperty.call(story, field));
}

function genericDekDetected(dek) {
  return [
    'is presented through',
    'major variants',
    'source limits',
    'continues to work in cultural memory',
    'this page explains'
  ].some((phrase) => dek.includes(phrase));
}

function publicContentHeadings(html) {
  const utilityHeadings = new Set([
    'quick answer',
    'story map',
    'frequently asked questions',
    'related articles',
    'story & source note',
    'creator script version',
    'share this record',
    'tags'
  ]);
  return extractHeadings(html)
    .filter((heading) => !utilityHeadings.has(normalizeText(heading)));
}

function unnecessaryEvidenceHeadingDetected(slug, heading) {
  const evidenceSlugs = new Set([
    'polybius-arcade-game-legend',
    'bennington-triangle-legend',
    'oak-island-money-pit',
    'marfa-lights-mystery',
    'kidney-theft-urban-legend',
    'db-cooper-hijacking-mystery',
    'tunguska-event',
    'mu-lost-continent-legend',
    'friday-the-13th-origin'
  ]);
  if (evidenceSlugs.has(slug)) return false;
  return /\b(evidence|proof|source trail|historical record|can and cannot)\b/.test(heading);
}

function abstractPaddingDetected(text) {
  const phrases = [
    'larger pattern people can recognize',
    'broader cultural memory',
    'the story still works because',
    'readers can understand how the story functions'
  ];
  return phrases.some((phrase) => text.includes(phrase));
}

function possessiveGrammarErrorDetected(text) {
  return /\b(thor hammer|thor hand|thor power|thor use|mjolnir image|prometheus release|zeus judgment|paula welden disappearance)\b/.test(text);
}

function textSimilarity(a, b) {
  const aTokens = meaningfulTokens(a);
  const bTokens = meaningfulTokens(b);
  if (aTokens.size < 8 || bTokens.size < 8) return 0;
  let shared = 0;
  for (const token of aTokens) if (bTokens.has(token)) shared += 1;
  return shared / Math.min(aTokens.size, bTokens.size);
}

function meaningfulTokens(value) {
  const stop = new Set([
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'about', 'story',
    'legend', 'myth', 'mystery', 'folklore', 'later', 'versions', 'version',
    'through', 'around', 'where', 'while', 'because', 'their', 'there'
  ]);
  return new Set(String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((token) => token.length > 2 && !stop.has(token)));
}

function publicStoryWordStats(story, html) {
  const text = stripHtml(html);
  const totalWords = wordCount(text);
  const internalWords = internalPublicPhrases.reduce((sum, phrase) => (
    normalizeText(text).includes(phrase) ? sum + wordCount(phrase) : sum
  ), 0);
  const storyTerms = [
    ...(story.storyBrief?.coreStoryElements || []),
    ...(story.storyBrief?.knownNames || []),
    story.storyBrief?.topic,
    story.primaryTag,
    story.tag
  ].filter(Boolean);
  const storyHits = storyTerms.filter((term) => normalizeText(text).includes(normalizeText(term).split(' ').slice(0, 3).join(' '))).length;
  const estimatedStoryRatio = totalWords ? Math.min(0.95, Math.max(0.5, storyHits / Math.max(8, storyTerms.length))) : 0;
  return { totalWords, internalWords, estimatedStoryRatio };
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHeadings(html) {
  return [...String(html || '').matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((match) => stripHtml(match[1]));
}

function extractParagraphs(html) {
  return [...String(html || '').matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((match) => stripHtml(match[1]));
}

function extractClassBlock(html, className) {
  const source = String(html || '');
  const index = source.indexOf(className);
  if (index === -1) return '';
  return source.slice(Math.max(0, index - 300), index + 2000);
}

function sentenceFrom(value, fallback = '') {
  const text = String(value || fallback || '').trim();
  if (!text) return '';
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function variantSentence(value) {
  if (!value) return '';
  if (typeof value === 'string') return sentenceFrom(value);
  return sentenceFrom(value.claim || value.text || value.summary || '');
}

function listText(values) {
  return (values || []).filter(Boolean).slice(0, 4).join(', ');
}

function wordCount(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

function normalizeText(value) {
  return String(value || '').toLowerCase().replace(/[’]/g, "'").replace(/\s+/g, ' ').trim();
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = {
  buildPublicArticlePlan,
  validatePublicArticleOutput,
  publicStoryWordStats,
  internalPublicPhrases,
  forbiddenPublicHeadings
};
