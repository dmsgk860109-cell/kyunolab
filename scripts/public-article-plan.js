const internalPublicPhrases = [
  'story brief confirmed',
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
  'existing story',
  'reported variant',
  'editorial interpretation',
  'what the sources can support',
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
        `${topic} is a ${String(brief.contentType || story.storyType || 'myth').replace(/-/g, ' ')} connected with ${brief.cultureOrContext || story.category}. ${firstCore} ${secondCore}`,
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
    publicSourceNote: `${topic} is discussed here as ${String(story.sourceStatus || story.category).replace(/\s*\/\s*Existing external tradition\s*\/\s*Story Brief confirmed/gi, '')}. Versions and interpretations can differ by source, translation, region, or later retelling.`
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
    paragraphs: (section.paragraphs || []).filter(Boolean)
  })).filter((section) => section.heading && section.paragraphs.length);

  return {
    title: plan.title || story.h1 || story.displayTitle || story.title,
    dek: cleanPublicDeck(plan.dek || story.introSummary || story.excerpt || story.summaryAnswer, story),
    quickAnswer: plan.quickAnswer || null,
    introduction: (plan.introduction || []).filter(Boolean),
    sections,
    conclusion: plan.conclusion || null,
    faq: Array.isArray(plan.faq) ? plan.faq : Array.isArray(plan.faqTopics) ? plan.faqTopics : [],
    publicSourceNote: cleanPublicSourceNote(plan.publicSourceNote || '', story)
  };
}

function cleanPublicDeck(value, story) {
  const text = String(value || '').trim();
  const normalized = normalizeText(text);
  const hasInternalPhrase = internalPublicPhrases.some((phrase) => normalized.includes(phrase));
  if (text && !hasInternalPhrase) return text;

  const title = story.displayTitle || story.title || story.slug || 'This archive record';
  const brief = story.storyBrief || {};
  const context = brief.cultureOrContext || story.primaryTag || story.category || 'its tradition';
  return `${title} is presented as a reader-facing archive story connected with ${context}, with the core tale separated from later retellings and possible meanings.`;
}

function cleanPublicSourceNote(value, story) {
  const text = String(value || '').trim();
  const normalized = normalizeText(text);
  const hasInternalPhrase = internalPublicPhrases.some((phrase) => normalized.includes(phrase));
  if (text && !hasInternalPhrase) return text;

  const title = story.displayTitle || story.title || story.slug || 'This story';
  const brief = story.storyBrief || {};
  const context = brief.cultureOrContext || story.category || 'its tradition';
  return `${title} is discussed through ${context}. Details can vary across translations, summaries, regions, and later retellings.`;
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
