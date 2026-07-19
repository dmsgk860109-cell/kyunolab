const fs = require('fs');
const path = require('path');
const { buildContentDNA } = require('./article-dna-utils');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const publishedAt = '2026-07-19';
const slug = 'pandoras-jar-myth';

const stories = readJson(storiesPath);

if (stories.some((story) => story.slug === slug)) {
  const existing = stories.find((story) => story.slug === slug);
  existing.seoHeadings = [
    "The Existing Pandora's Jar Story",
    'Reported Variants Around the Jar and Box',
    'Editorial Interpretation of Hope and Trouble',
    'What the Sources Can Support',
    'Why Pandora Still Opens the Container'
  ];
  if (existing.contentDNA) {
    existing.contentDNA.sectionBlueprint = existing.seoHeadings.map((title) => ({ title, nav: title }));
  }
  writeJson(storiesPath, stories);
  console.log(`Updated existing story heading map: ${slug}`);
  process.exit(0);
}

const story = {
  id: slug,
  slug,
  title: "Pandora's Jar Myth: Hope, Trouble, and the Story Behind Pandora's Box",
  displayTitle: "Pandora's Jar Myth: Hope, Trouble, and the Story Behind Pandora's Box",
  h1: "Pandora's Jar Myth: Hope, Trouble, and the Story Behind Pandora's Box",
  seoTitle: "Pandora's Jar Myth: Hope, Trouble, and Greek Myth Meaning",
  metaTitle: "Pandora's Jar Myth: Hope, Trouble, and Greek Myth Meaning",
  metaDescription: "Pandora's Jar Myth explained through Hesiod, Greek myth, the later box tradition, hope, trouble, and source-aware Story Brief limits.",
  category: 'Myths',
  categorySlug: 'myths',
  categoryGroup: 'Mythic & Imagined Realms',
  tag: 'Greek Myth',
  primaryTag: 'Greek Myth',
  seedKeyword: "pandora's jar myth",
  primaryKeyword: "pandora's jar myth",
  searchIntent: 'meaning',
  articleFormat: 'story-archive',
  cluster: 'Myths / Greek Myth',
  relatedKeywords: [
    "pandora's jar myth origin",
    "pandora's box meaning",
    'pandora greek mythology',
    'hesiod pandora myth',
    'greek myth hope'
  ],
  secondaryKeywords: [
    "pandora's jar myth origin",
    "pandora's box meaning",
    'pandora greek mythology',
    'hesiod pandora myth',
    'greek myth hope',
    'Prometheus',
    'Epimetheus',
    'Hope'
  ],
  topicScore: 92,
  topicStatus: 'approved',
  scoreBreakdown: {
    searchDemand: 29,
    clickCuriosity: 23,
    siteFit: 22,
    expansionPotential: 11,
    sourceSafety: 7
  },
  summaryAnswer: "Pandora's Jar Myth is an existing Greek mythic story most familiar today as Pandora's Box. In Hesiod's tradition, Pandora opens a jar connected to Zeus's punishment after Prometheus steals fire, releasing human troubles while hope remains inside.",
  readTime: '9 min read',
  storyType: 'Myth',
  seoHeadings: [
    "The Existing Pandora's Jar Story",
    'Reported Variants Around the Jar and Box',
    'Editorial Interpretation of Hope and Trouble',
    'What the Sources Can Support',
    'Why Pandora Still Opens the Container'
  ],
  sourceStatus: 'Myths / Existing external tradition / Story Brief confirmed',
  excerpt: "A unified-policy Kyunolab reading of Pandora's jar, the later box tradition, and the question of hope in Greek myth.",
  introSummary: "Pandora's jar is treated here as an existing Greek mythic tradition with confirmed external traces, known variants, and clear limits on interpretation.",
  publishedAt,
  updatedAt: publishedAt,
  relatedStoryIds: ['prometheus-myth', 'icarus-myth', 'theseus-and-the-minotaur-myth', 'persephone-myth'],
  relatedStorySlugs: ['prometheus-myth', 'icarus-myth', 'theseus-and-the-minotaur-myth', 'persephone-myth'],
  tags: ['Greek Myth', 'Pandora', 'Prometheus', 'Hope', 'Origin Myth'],
  detail: "the Greek myth in which Pandora opens a forbidden jar, releasing human troubles while hope remains inside",
  evidence: 'World History Encyclopedia Pandora, Hesiod Works and Days, Theoi classical text, Encyclopedia.com Pandora',
  researchSources: [
    {
      title: 'Pandora - World History Encyclopedia',
      url: 'https://www.worldhistory.org/Pandora/',
      supports: "Pandora's role in Greek myth, the jar, the release of troubles, and hope remaining inside."
    },
    {
      title: 'Hesiod, Works and Days - Theoi Classical Texts Library',
      url: 'https://www.theoi.com/Text/HesiodWorksDays.html',
      supports: "The ancient textual tradition around Pandora, Zeus's punishment, and the jar episode."
    },
    {
      title: 'Pandora - Encyclopedia.com',
      url: 'https://www.encyclopedia.com/literature-and-arts/classical-literature-mythology-and-folklore/folklore-and-mythology/pandora',
      supports: "A reference summary of Pandora as the first woman in Greek mythology and her link to Prometheus."
    }
  ],
  sourceNotes: {
    sharedVerifiedPoints: [
      "Pandora is an existing figure in Greek mythology, especially connected with Hesiod's Theogony and Works and Days.",
      'The best-known story connects Pandora to Zeus, Prometheus, Epimetheus, a container, released troubles, and hope.',
      "Modern retellings often call the container a box, while older discussion commonly identifies it as a jar or pithos."
    ],
    variants: [
      "The container is commonly called Pandora's box in modern English, but source-aware discussions often note the older jar or pithos tradition.",
      'Hope may be read as comfort, expectation, or a more ambiguous remaining force depending on translation and interpretation.'
    ],
    unsupportedClaimsToAvoid: [
      'Do not treat Pandora as a verified historical person.',
      'Do not invent a new list of released spirits beyond the general tradition of troubles, evils, or ills.',
      'Do not invent new witnesses, dates, rituals, archive records, or secret versions of the myth.'
    ],
    sourceLimits: [
      'Greek myth survives through literary sources, translation choices, artistic retellings, and later summaries.',
      'The article can explain the myth and its symbolism, but should not flatten all versions into one final canon.',
      'The jar-versus-box issue should be handled as a reported variant and translation history, not as a new plot.'
    ]
  },
  targetQuery: "pandora's jar myth",
  canonicalQuery: "pandora's jar myth",
  uniqueAngle: "Pandora's Jar Myth is treated as an existing Greek mythic tradition first, with the box tradition, hope, and interpretation kept separate from the core story.",
  sceneAnchor: "Pandora lifting the lid of a forbidden jar as human troubles enter the world and hope remains inside",
  subjectSpecificVocabulary: ['Pandora', 'jar', 'box', 'Hope', 'Prometheus', 'Epimetheus', 'Zeus', 'Hesiod'],
  contentType: 'story',
  storyBrief: {
    topic: "Pandora's Jar Myth",
    category: 'Myths',
    contentType: 'myth-narrative',
    existenceStatus: 'confirmed',
    circulationLevel: 'global',
    knownNames: ["Pandora's Jar", "Pandora's Box", 'Pandora'],
    cultureOrContext: 'Greek mythology and Hesiodic tradition',
    coreStoryElements: [
      'Pandora is created and sent within the Greek mythic cycle connected to Zeus and Prometheus.',
      'Pandora is associated with a forbidden container, often described in source-aware discussion as a jar.',
      'The container is opened and human troubles, evils, or ills enter the world.',
      'Hope remains inside the container after Pandora shuts it again.',
      'Epimetheus and Prometheus belong to the surrounding mythic context.'
    ],
    reportedVariants: [
      {
        claim: "Modern English retellings often call the container Pandora's box.",
        scope: 'later retelling and translation tradition'
      },
      {
        claim: 'Source-aware summaries often distinguish the older jar or pithos image from the later box wording.',
        scope: 'classical-text and mythology-reference discussion'
      },
      {
        claim: 'Hope can be explained as consolation, expectation, or an ambiguous remaining force.',
        scope: 'interpretive and translation discussion'
      }
    ],
    editorialInterpretationOptions: [
      'The myth may be read as a story about the cost of divine punishment entering ordinary human life.',
      'It can also be read as a myth about why suffering is visible while hope remains difficult to define.',
      'The box-versus-jar difference may suggest how translation can reshape the image of a myth without changing its central function.'
    ],
    uncertainDetails: [
      'The exact meaning of hope in the myth is debated in interpretation and translation.',
      'Modern popular versions may simplify the older literary setting around Prometheus, Zeus, and Epimetheus.'
    ],
    prohibitedInventions: [
      'Do not invent a hidden original version of the myth.',
      'Do not invent new named evils released from the jar.',
      'Do not invent secret rituals or witnesses connected to Pandora.',
      'Do not treat the myth as literal historical evidence.'
    ],
    existenceEvidence: [
      {
        title: 'Pandora - World History Encyclopedia',
        url: 'https://www.worldhistory.org/Pandora/',
        sourceType: 'reference',
        supports: "Pandora, Zeus's punishment, the container, released troubles, and hope."
      },
      {
        title: 'Hesiod, Works and Days - Theoi Classical Texts Library',
        url: 'https://www.theoi.com/Text/HesiodWorksDays.html',
        sourceType: 'primary-text translation',
        supports: 'The Hesiodic Pandora tradition and the ancient literary context.'
      },
      {
        title: 'Pandora - Encyclopedia.com',
        url: 'https://www.encyclopedia.com/literature-and-arts/classical-literature-mythology-and-folklore/folklore-and-mythology/pandora',
        sourceType: 'reference',
        supports: 'Pandora as a Greek mythic figure connected to Zeus, Prometheus, and the release of evil.'
      }
    ],
    opening: [
      "pandora's jar myth is included in Kyunolab because the story already existed outside this archive. The goal is not to prove the myth as history, but to explain the version, variation, and meaning that circulated before this page was written.",
      "This reading separates the existing story from reported variants and Kyunolab interpretation. It does not add new characters, events, rituals, witnesses, or endings."
    ],
    articleSections: [
      {
        title: "The Existing Pandora's Jar Story",
        paragraphs: [
          'The existing story can be stated without adding anything new: Pandora belongs to the Greek mythic cycle around Zeus, Prometheus, and Epimetheus. She is connected with a forbidden container, often identified in source-aware summaries as a jar. When the container is opened, human troubles enter the world. Hope remains inside after the lid is shut again.',
          "Pandora's Jar Myth belongs to Greek mythology and Hesiodic tradition. Its value is not a claim that the event happened as history. Its value is the compact mythic image: a container opens, suffering enters human life, and hope remains unresolved."
        ]
      },
      {
        title: 'Reported Variants Around the Jar and Box',
        paragraphs: [
          "Reported Variant: Modern English retellings often call the container Pandora's box. Source-aware summaries often distinguish that later box wording from the older jar or pithos image. Hope may be explained as consolation, expectation, or a more ambiguous remaining force.",
          "The circulation level is global. That means the article can describe Pandora confidently as an existing mythic subject, while still marking translation choices, popular summaries, and interpretive differences as variants."
        ]
      },
      {
        title: 'Editorial Interpretation of Hope and Trouble',
        paragraphs: [
          'Editorial Interpretation: The myth may be read as a story about the cost of divine punishment entering ordinary human life. It can also be read as a myth about why suffering is visible while hope remains difficult to define.',
          'This interpretation stays abstract. It explains meaning, symbol, and cultural force, but it does not create a new plot, new witness, new ritual, or new ending.'
        ]
      },
      {
        title: 'What the Sources Can Support',
        paragraphs: [
          'External existence evidence reviewed for the Story Brief: Pandora - World History Encyclopedia (reference); Hesiod, Works and Days - Theoi Classical Texts Library (primary-text translation); Pandora - Encyclopedia.com (reference).',
          'The source limit is simple: Greek myth survives through literary sources, translation choices, artistic retellings, and later summaries. The article can explain what circulates, but it should not smooth every difference into one false canon.'
        ]
      },
      {
        title: 'Why Pandora Still Opens the Container',
        paragraphs: [
          "Pandora's Jar Myth remains memorable because the existing story gives readers a small, powerful image they can return to: one lid, one act, many troubles, and hope left behind.",
          "Kyunolab's role is to preserve that shape, identify variants, and mark interpretation as interpretation. The archive should make the story easier to understand without pretending it has invented or solved it."
        ]
      }
    ],
    publishable: true,
    validationStatus: {
      storyCheck: 'confirmed',
      storyBrief: 'ready',
      inventionCheck: 'passed',
      publishable: true
    },
    updatedAt: publishedAt
  },
  faq: [
    {
      q: "Is Pandora's Jar Myth an existing story outside Kyunolab?",
      a: "Yes. The Story Brief marks its existence status as confirmed and records external traces such as World History Encyclopedia, Theoi's Hesiod text, and Encyclopedia.com."
    },
    {
      q: "Is it Pandora's jar or Pandora's box?",
      a: "Modern English often says Pandora's box, while source-aware summaries commonly note the older jar or pithos tradition. This article treats the wording difference as a reported variant rather than a new story."
    },
    {
      q: 'What remains inside after Pandora opens the container?',
      a: 'The familiar tradition says hope remains inside after the troubles of human life are released. The meaning of hope can be read in more than one way, so the article marks that point as interpretation.'
    },
    {
      q: "Does Kyunolab treat Pandora's myth as literal history?",
      a: 'No. The article treats it as Greek myth and cultural tradition, not as verified historical evidence.'
    }
  ]
};

const existingQueries = new Set(
  stories
    .map((item) => item.contentDNA?.canonicalQuery || item.primaryKeyword || item.seedKeyword)
    .filter(Boolean)
    .map((query) => String(query).toLowerCase().trim())
);

story.contentDNA = {
  ...buildContentDNA(story, existingQueries),
  ...(story.contentDNA || {}),
  targetQuery: story.targetQuery,
  canonicalQuery: story.canonicalQuery,
  subjectSpecificVocabulary: [
    "pandora's jar myth",
    "Pandora's Jar Myth",
    'Story Brief',
    'Reported Variant',
    'Editorial Interpretation',
    'Pandora',
    'Hope',
    'Hesiod'
  ],
  requiredSpecificDetails: [
    "Pandora's Jar Myth",
    'Pandora is connected with Zeus, Prometheus, and Epimetheus.',
    'The container is opened and human troubles enter the world.',
    'Hope remains inside.',
    "Modern English often says Pandora's box.",
    'The older container is often discussed as a jar or pithos.'
  ]
};

stories.unshift(story);
writeJson(storiesPath, stories);
console.log(`Added ${slug}.`);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
