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
  'meaning and interpretation',
  'background and context',
  'mythic context',
  'symbolic role',
  'source status',
  'final thoughts'
];

function buildPublicArticlePlan(story) {
  if (story.publicArticlePlan && Array.isArray(story.publicArticlePlan.sections)) {
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
    dek: story.introSummary || story.excerpt || story.summaryAnswer,
    quickAnswer: {
      paragraphs: [
        `${topic} is a ${publicStoryKind(story, brief)} connected with ${brief.cultureOrContext || story.category}. ${firstCore} ${secondCore}`,
        `${thirdCore} ${variant} The article follows the story, its variations, and its possible meaning without turning myth or legend into a single settled historical claim.`
      ],
      targetWords: { min: 100, max: 180 }
    },
    introduction: [
      `${topic} is remembered because it gives a large idea a visible shape. The names around it are ${names}, but the point of the story is not only who appears in it. It is the image that keeps returning in retellings.`,
      `This page explains the story itself first, then follows the major version differences and the questions they leave behind.`
    ],
    sections: defaultSectionsFor(story, brief, { topic, firstCore, secondCore, thirdCore, variant, interpretation, uncertainty }),
    conclusion: {
      paragraphs: [
        `${topic} lasts because it can be retold as story and read as symbol at the same time. Its details may shift, but the central image remains strong enough to carry the question forward.`,
        `That is why the subject still works as myth and memory: it gives readers a way to think about fear, order, loss, hope, warning, or wonder without requiring every version to agree.`
      ],
      targetWords: { min: 100, max: 180 }
    },
    faq: defaultFaqFor(story, brief, topic),
    publicSourceNote: buildBriefSourceNote(story, brief, topic)
  }, story);
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

function articleFor(value) {
  return /^[aeiou]/i.test(String(value || '').trim()) ? 'an' : 'a';
}

function validatePublicArticleOutput(story, html) {
  const errors = [];
  const normalized = normalizeText(stripHtml(html));
  const headings = extractHeadings(html).map(normalizeText);
  const slug = String(story.slug || '');

  for (const phrase of internalPublicPhrases) {
    if (normalized.includes(phrase)) errors.push(`public article exposes internal phrase "${phrase}"`);
  }
  for (const heading of headings) {
    if (forbiddenPublicHeadings.includes(heading)) errors.push(`public heading uses internal label "${heading}"`);
  }

  if (story.storyBrief && !story.publicArticlePlan) {
    errors.push('missing publicArticlePlan for unified-policy story');
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
