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
  'the heading keeps the focus on',
  'this section should',
  'the writer should',
  'what the available sources show is where',
  'what the available sources show keeps one difference visible',
  'the exact earliest form may be disputed',
  'later versions may simplify, relocate, intensify, or reinterpret the story',
  'does not need a new frame to feel strange',
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
  if (!story.storyBrief) {
    if (
      story.publicArticlePlan
      && Array.isArray(story.publicArticlePlan.sections)
      && !legacyPublicPlanDetected(story.publicArticlePlan)
    ) {
      return normalizePlan(story.publicArticlePlan, story);
    }
    return null;
  }

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
        `${topic} remains memorable because ${lowerFirst(story.sceneAnchor || story.detail || firstCore)} gives the subject a concrete shape readers can follow.`,
        `${sentenceFrom(brief.editorialInterpretationOptions?.[0], interpretation)} ${variantSentence(brief.reportedVariants?.[0])}`.replace(/\s+/g, ' ').trim()
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
    'flatwoods-monster-legend': 'A hilltop encounter in Braxton County became one of West Virginia\'s most recognizable monster images, where a reported fireball, a strange figure, and local memory fused into UFO folklore.',
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
    'horseshoe-luck-origin': 'Horseshoe luck turns a stable object into a household sign. Iron, doorway, and threshold belief combine until a practical thing becomes a charm against uncertainty.',
    'resurrection-mary-legend': 'Resurrection Mary keeps Chicago ghost lore focused on a road, a dance hall, a cemetery, and the uneasy feeling that a local story may be repeating itself.',
    'the-rake-creepypasta': 'The Rake shows how internet horror can turn a vague creature description into shared folklore through posts, retellings, images, and uncertain digital memory.',
    'eastern-state-penitentiary-haunting': 'Eastern State Penitentiary became a strange-place legend because its real architecture already feels like a machine built for silence, separation, and memory.',
    'amber-room-mystery': 'The Amber Room mystery begins with a real lost treasure, but its afterlife belongs to wartime disappearance, recovery claims, and the pull of an unfinished search.',
    'tomte-nisse-folklore': 'The tomte or nisse is small in scale but large in household meaning, standing between helpful guardian, offended spirit, and winter folklore figure.',
    'dover-demon-legend': 'The Dover Demon remains unsettling because the reports were brief, local, and visually specific, leaving a strange figure without a settled explanation.',
    'persephone-underworld-myth': 'The Persephone myth holds spring and loss in the same story, making a divine abduction into one of the strongest seasonal explanations in Greek tradition.',
    'griffin-folklore': 'The griffin joins eagle and lion into one guardian image, giving ancient and medieval art a creature built from sky power, ground power, and treasure protection.',
    'lyonesse-lost-land-legend': 'Lyonesse is remembered as a drowned kingdom at the edge of Britain, where Arthurian memory, coastal loss, and vanished-land imagination meet.',
    'raining-animals-phenomenon': 'Reports of animals falling from the sky sit between weather, witness memory, and wonder, turning unusual natural events into stories people keep retelling.',
    'mount-kailash-legendary-place': 'Mount Kailash is legendary because it is not only a mountain on a map, but a sacred center shaped by pilgrimage, restraint, and stories of spiritual power.',
    'sword-in-the-stone-legend': 'The Sword in the Stone makes kingship visible through one impossible test, turning a weapon into a sign of recognition, legitimacy, and destiny.',
    'evil-eye-origin': 'The evil eye endures because it gives envy a visible danger, turning a glance into one of the oldest and most portable explanations for misfortune.'
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
  const uncertainty = usableUncertainties(brief)[0] || '';
  const anchor = story.sceneAnchor || story.detail || parts.firstCore;
  const queryIntro = targetQueryIntro(story, parts.topic);
  const paragraphs = [
    `${queryIntro || parts.topic} is anchored by ${lowerFirst(anchor)}.${known}`.replace(/\s+/g, ' ').trim(),
    `${parts.firstCore} ${uncertainty}`.replace(/\s+/g, ' ').trim()
  ].filter(Boolean);
  if (story.slug === 'cicada-3301-internet-puzzle') {
    paragraphs.push('QR codes were part of the puzzle trail, linking online clues to physical locations and making the hunt feel larger than a normal web riddle.');
  }
  return paragraphs;
}

function targetQueryIntro(story, topic) {
  const query = String(story.contentDNA?.targetQuery || story.targetQuery || '').trim();
  const normalizedTopic = normalizeText(topic);
  const normalizedQuery = normalizeText(query);
  if (!query || !normalizedQuery || normalizedTopic.includes(normalizedQuery)) return '';
  const words = query.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 6) return '';
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
  return fixedArchiveHeadingsFor(topic);
}

function fixedArchiveHeadingsFor(topic) {
  return [
    `The Detail That Defines ${topic}`,
    `How ${topic} Is Usually Remembered`,
    'Where Later Versions Differ',
    'What the Available Sources Show',
    `What ${topic} Means`
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
  const core = (brief.coreStoryElements || []).map(sentenceFrom).filter(Boolean);
  const variants = (brief.reportedVariants || []).map(variantSentence).filter(Boolean);
  const meanings = (brief.editorialInterpretationOptions || []).map(sentenceFrom).filter(Boolean);
  const uncertainties = usableUncertainties(brief);

  if (index === 0) {
    return uniqueParagraphs([
      `${core[2] || parts.thirdCore} ${core[3] || parts.secondCore}`.replace(/\s+/g, ' ').trim(),
      `${parts.topic} is defined by ${lowerFirst(story.sceneAnchor || story.detail || core[0] || 'its central image')}. That detail separates the subject from nearby stories because it gives readers one concrete image to follow.`
    ], story);
  }

  if (index === 1) {
    return uniqueParagraphs([
      `${core[4] || core[0] || parts.firstCore} ${core[5] || core[1] || parts.secondCore}`.replace(/\s+/g, ' ').trim(),
      `${(core.slice(2, 6).join(' ') || `${parts.firstCore} ${parts.secondCore} ${parts.thirdCore}`)}`.replace(/\s+/g, ' ').trim()
    ], story);
  }

  if (index === 2) {
    return uniqueParagraphs([
      `${variants[0] || parts.variant} ${variants[1] || ''}`.replace(/\s+/g, ' ').trim(),
      `${uncertainties[0] || variantContextSentence(parts.topic, variants)} ${uncertainties[1] || ''}`.replace(/\s+/g, ' ').trim()
    ], story);
  }

  if (index === 3) {
    const sourceTitles = [
      ...(story.researchSources || []).map((item) => cleanSourceTitle(item.title)),
      ...(brief.existenceEvidence || []).map((item) => cleanSourceTitle(item.title))
    ].filter(Boolean);
    const namedSources = sourceTitles.length
      ? `Useful public references include ${listForSentence(uniqueList(sourceTitles).slice(0, 3))}.`
      : '';
    const basis = story.publicSourceBasis || brief.cultureOrContext || story.category || 'the available tradition';
    const vocabulary = vocabularyContextSentence(story);
    return uniqueParagraphs([
      `${parts.topic} is supported here through ${basis}. ${namedSources}`.replace(/\s+/g, ' ').trim(),
      `${story.evidence || `The available record supports the subject as ${articleFor(story.category || 'archive story')} ${String(story.category || 'archive story').toLowerCase()}.`} ${vocabulary} ${sourceLimitSentence(parts.topic, story, variants)}`.replace(/\s+/g, ' ').trim()
    ], story);
  }

  return uniqueParagraphs([
    `${parts.topic} may be read through this interpretation: ${meanings[0] || parts.interpretation} ${meanings[1] || ''}`.replace(/\s+/g, ' ').trim(),
    `${parts.topic} remains useful because ${lowerFirst(story.sceneAnchor || story.detail || core[0] || 'its central image')} can carry cultural meaning without requiring every later version to agree.`
  ], story);
}

function vocabularyContextSentence(story) {
  const terms = (story.contentDNA?.subjectSpecificVocabulary || story.subjectSpecificVocabulary || [])
    .map((term) => String(term || '').trim())
    .filter((term) => term.length >= 4)
    .slice(0, 6);
  if (terms.length < 5) return '';
  return `Important names and terms in the source trail include ${listForSentence(terms)}.`;
}

function usableUncertainties(brief) {
  return (brief.uncertainDetails || [])
    .map(sentenceFrom)
    .filter(Boolean)
    .filter((sentence) => !genericUncertaintySentenceDetected(sentence));
}

function genericUncertaintySentenceDetected(sentence) {
  const text = normalizeText(sentence);
  return text.includes('the exact earliest form may be disputed')
    || text.includes('later versions may simplify, relocate, intensify, or reinterpret the story')
    || text.includes('preserved through later retellings');
}

function variantContextSentence(topic, variants) {
  const first = variants[0] || '';
  if (first) return `${topic} changes most clearly where retellings adjust ${lowerFirst(first.replace(/[.?!]+$/, ''))}.`;
  return `${topic} changes when retellings move the same recognizable detail into a different setting, explanation, or moral emphasis.`;
}

function sourceLimitSentence(topic, story, variants) {
  const variant = variants[0] ? ` The source record can show that variant, but it should not be treated as the only form of ${topic}.` : '';
  const category = String(story.category || 'archive story').toLowerCase();
  return `${topic} is best handled as ${articleFor(category)} ${category} subject with visible source limits.${variant}`;
}

function uniqueParagraphs(paragraphs, story) {
  const clean = paragraphs
    .map((paragraph) => cleanPublicText(paragraph, story))
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const seen = new Set();
  return clean.filter((paragraph) => {
    const key = normalizeText(paragraph);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
      a: faqAnswerForIndex(story, brief, topic, 0)
    },
    {
      q: `Which detail is most important in ${topic}?`,
      a: faqAnswerForIndex(story, brief, topic, 1)
    },
    {
      q: `How do later versions of ${topic} differ?`,
      a: faqAnswerForIndex(story, brief, topic, 2)
    },
    {
      q: `What can ${topic} suggest?`,
      a: faqAnswerForIndex(story, brief, topic, 4)
    }
  ];
}

function faqAnswerForIndex(story, brief, topic, index) {
  const core = (brief.coreStoryElements || []).map(sentenceFrom).filter(Boolean);
  const variants = (brief.reportedVariants || []).map(variantSentence).filter(Boolean);
  const meanings = (brief.editorialInterpretationOptions || []).map(sentenceFrom).filter(Boolean);
  const uncertainties = usableUncertainties(brief);
  const sourceTitles = [
    ...(story.researchSources || []).map((item) => cleanSourceTitle(item.title)),
    ...(brief.existenceEvidence || []).map((item) => cleanSourceTitle(item.title))
  ].filter(Boolean);
  const detail = story.detail || story.sceneAnchor || story.primaryTag || brief.cultureOrContext || topic;
  const answers = [
    `${topic} refers to ${lowerFirst(String(detail).replace(/[.?!]+$/, ''))}, rather than to every later retelling attached to the name.`,
    `${core[2] || core[1] || core[0]} ${story.sceneAnchor ? `The key image is ${lowerFirst(story.sceneAnchor)}.` : ''}`.replace(/\s+/g, ' ').trim(),
    `${topic} has variant details rather than one completely fixed form: ${variants[0] || core[3]} ${variants[1] ? `Another recurring difference is ${lowerFirst(variants[1].replace(/[.?!]+$/, ''))}.` : ''}`.replace(/\s+/g, ' ').trim(),
    sourceTitles.length ? `${topic} is usually checked against ${listForSentence(uniqueList(sourceTitles).slice(0, 2))}.` : (story.evidence || uncertainties[0]),
    meanings[0] || uncertainties[0],
    meanings[1] || variants[1] || core[4]
  ].filter(Boolean);
  return answers[index] || answers[0] || `${topic} is read through ${brief.cultureOrContext || story.category}.`;
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
  const uncertainties = usableUncertainties(brief).slice(0, 1);
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

function uniqueList(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
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
  const answers = (faq || []).map((item) => normalizeText(item.a || item.answer || '')).filter(Boolean);
  const hasPlaceholder = questions.some((question) => question.includes('[topic]') || question.includes('topic?'));
  const repeatedAnswerCount = answers.length - new Set(answers).size;
  const vagueAnswers = answers.filter((answer) => (
    answer.includes('larger pattern people can recognize')
    || answer.includes('this page explains')
    || answer.includes('the article should')
    || answer.includes('a careful article should')
  ));
  return hasPlaceholder || repeatedAnswerCount >= 2 || vagueAnswers.length >= 2;
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
