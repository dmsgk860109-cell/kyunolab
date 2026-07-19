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
  const publicArticlePlan = buildPandoraPublicArticlePlan();
  const publicHeadings = publicArticlePlan.sections.map((section) => section.heading);
  existing.title = publicArticlePlan.title;
  existing.displayTitle = publicArticlePlan.title;
  existing.h1 = publicArticlePlan.title;
  existing.seoTitle = "Pandora's Jar Myth: Greek Myth, Hope, and Pandora's Box";
  existing.metaTitle = existing.seoTitle;
  existing.metaDescription = "Pandora's Jar Myth retold through Greek mythology, Hesiodic tradition, Prometheus, Zeus, Epimetheus, the later box image, and the mystery of hope.";
  existing.seoHeadings = [
    ...publicHeadings
  ];
  existing.publicArticlePlan = publicArticlePlan;
  existing.sourceStatus = 'Myths / Greek mythology and Hesiodic tradition / myth narrative';
  existing.excerpt = "A remade archive reading of Pandora's jar, the later box tradition, and the question of why hope was left inside.";
  existing.introSummary = "Pandora's jar is a Greek myth about a gift that arrives as punishment, a container that changes human life, and hope left in the one place no one can fully reach.";
  if (existing.contentDNA) {
    existing.contentDNA.sectionBlueprint = existing.seoHeadings.map((title) => ({ title, nav: title }));
    existing.contentDNA.subjectSpecificVocabulary = [
      "pandora's jar myth",
      "Pandora's Jar Myth",
      'Pandora',
      'Hope',
      'Hesiod',
      'Prometheus',
      'Epimetheus',
      'Zeus',
      'pithos'
    ];
  }
  writeJson(storiesPath, stories);
  console.log(`Updated existing story public article plan: ${slug}`);
  process.exit(0);
}

const story = {
  id: slug,
  slug,
  title: "Pandora's Jar: The Greek Myth Behind Pandora's Box",
  displayTitle: "Pandora's Jar: The Greek Myth Behind Pandora's Box",
  h1: "Pandora's Jar: The Greek Myth Behind Pandora's Box",
  seoTitle: "Pandora's Jar Myth: Greek Myth, Hope, and Pandora's Box",
  metaTitle: "Pandora's Jar Myth: Greek Myth, Hope, and Pandora's Box",
  metaDescription: "Pandora's Jar Myth retold through Greek mythology, Hesiodic tradition, Prometheus, Zeus, Epimetheus, the later box image, and the mystery of hope.",
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
    ...buildPandoraPublicArticlePlan().sections.map((section) => section.heading)
  ],
  sourceStatus: 'Myths / Greek mythology and Hesiodic tradition / myth narrative',
  excerpt: "A remade archive reading of Pandora's jar, the later box tradition, and the question of why hope was left inside.",
  introSummary: "Pandora's jar is a Greek myth about a gift that arrives as punishment, a container that changes human life, and hope left in the one place no one can fully reach.",
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
  publicArticlePlan: buildPandoraPublicArticlePlan(),
  faq: [
    {
      q: "Who created Pandora in Greek mythology?",
      a: "Pandora is shaped by the gods in the mythic cycle around Zeus and Prometheus. Hephaestus gives her form, while other gods give her qualities such as skill, beauty, desire, and persuasive speech."
    },
    {
      q: "Why was Pandora sent to Epimetheus?",
      a: "Pandora is sent as part of Zeus's punishment after Prometheus steals fire for humanity. Prometheus warns Epimetheus not to accept gifts from Zeus, but Epimetheus accepts Pandora anyway."
    },
    {
      q: "Was Pandora's container originally a jar or a box?",
      a: "The familiar modern phrase is Pandora's box, but many discussions of the older Greek tradition describe the container as a jar or pithos. The box wording became dominant in later retellings and popular language."
    },
    {
      q: 'What escaped from Pandora\'s jar?',
      a: 'The story usually speaks of the troubles, evils, or ills of human life escaping from the container. The exact list is often less important than the larger image of suffering entering the world.'
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
    'Pandora',
    'Hope',
    'Hesiod',
    'Prometheus',
    'Epimetheus',
    'Zeus',
    'pithos'
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

function buildPandoraPublicArticlePlan() {
  return {
    title: "Pandora's Jar: The Greek Myth Behind Pandora's Box",
    dek: "A Greek myth about a beautiful gift, an opened jar, and the strange comfort of hope remaining just out of reach.",
    quickAnswer: {
      purpose: 'Give readers the usable answer before the full story.',
      targetWords: { min: 110, max: 180 },
      paragraphs: [
        "Pandora's jar myth is the Greek story most people now know as Pandora's box. In the older story, Pandora is sent into the human world after Prometheus steals fire. She comes as a gift from the gods, but the gift is part of Zeus's punishment.",
        "When the jar is opened, the troubles of human life escape. Pain, illness, labor, and sorrow enter the world of mortals. Only hope remains inside. That is why the myth still feels uneasy. It does not simply say that curiosity caused suffering. It asks why suffering spreads so easily, while hope stays hidden in the container that was closed too late."
      ]
    },
    introduction: [
      "The story usually begins in modern speech with a box. Someone opens Pandora's box, and problems rush out. But the older image is heavier than that. It is a jar, a pithos, something large enough to belong to storage, household life, and the deep ordinary world of ancient myth.",
      "That older image changes the feeling of the story. Pandora is not standing over a small decorative box. She is near a sealed vessel that seems to hold more than any person can understand. When it opens, the myth turns one impossible question into one visible scene: how did trouble become part of human life?"
    ],
    sections: [
      {
        heading: 'The Theft of Fire Before Pandora',
        purpose: 'Set up the conflict that makes Pandora possible.',
        storyBriefInputs: ['Zeus', 'Prometheus', 'fire', 'punishment'],
        contentLayer: 'core story',
        targetWords: { min: 220, max: 360 },
        paragraphs: [
          "Pandora's story does not really begin with Pandora. It begins with Prometheus and fire. In Greek myth, Prometheus gives fire to human beings, and fire changes everything. It is warmth, cooking, metalwork, craft, light, and the first sign that mortals can take part in powers that once belonged above them.",
          "Zeus reads that gift as a breach in the order of the world. Prometheus has not only stolen a useful thing. He has moved a boundary. Mortals now hold something that brings them closer to the gods, and Zeus answers by changing what human life will feel like from then on.",
          "That answer is Pandora. She does not arrive like a storm or a monster. She arrives as a gift. That is the first quiet cruelty of the myth. The punishment does not look like punishment when it comes through the door."
        ]
      },
      {
        heading: 'How the Gods Made Pandora',
        purpose: 'Explain Pandora as a crafted mythic figure.',
        storyBriefInputs: ['Pandora', 'Hephaestus', 'Athena', 'Aphrodite', 'Hermes'],
        contentLayer: 'core story',
        targetWords: { min: 220, max: 360 },
        paragraphs: [
          "Pandora is made with care. In the Hesiodic tradition, Hephaestus shapes her from earth and water. Athena gives her skill. Aphrodite gives charm and desire. Hermes gives speech and a more troubling cleverness. She is not a random figure placed into the story. She is assembled.",
          "That detail gives the myth its strange power. Pandora carries gifts from the gods, but the gifts are not innocent. Her beauty, grace, and voice all belong to a design. The story lets the listener feel the trap before anyone inside the myth understands it.",
          "Even her name carries tension. Pandora can be understood as all-gifted, or as one to whom all have given. It sounds generous at first. But in this story, a gift can also be a weapon. The gods give Pandora to the world, and the world does not yet know what has been delivered."
        ]
      },
      {
        heading: 'Why Epimetheus Accepted Pandora',
        purpose: 'Show the moment when warning gives way to desire.',
        storyBriefInputs: ['Epimetheus', 'Prometheus', 'warning', 'gift'],
        contentLayer: 'core story',
        targetWords: { min: 200, max: 330 },
        paragraphs: [
          "Pandora is sent to Epimetheus, the brother of Prometheus. Their names already tell part of the story. Prometheus is linked with forethought. Epimetheus is linked with afterthought. One sees ahead. The other understands after the damage is done.",
          "Prometheus warns his brother not to accept gifts from Zeus. The warning is clear. But clear warnings do not always win against beauty, surprise, or the desire to receive what looks honored by the gods. Epimetheus accepts Pandora.",
          "That choice makes the myth feel painfully human. The danger is not dragged into the house. It is welcomed. Pandora's arrival works because it passes through ordinary trust, ordinary desire, and the oldest mistake in many stories: believing that a beautiful gift must also be safe."
        ]
      },
      {
        heading: 'What Escaped From the Jar',
        purpose: 'Tell the central image of the myth clearly.',
        storyBriefInputs: ['container', 'troubles', 'hope'],
        contentLayer: 'core story',
        targetWords: { min: 240, max: 380 },
        paragraphs: [
          "The jar is the center of the myth because it makes suffering visible. Before it opens, trouble is imagined as contained. It has a place. It has a boundary. It has not yet entered the ordinary air that mortals breathe.",
          "Then the container opens. The story does not need to name every force that escapes. What matters is the whole shape of human suffering: illness, pain, labor, sorrow, fear, and the hard conditions that make life uncertain. The world after the jar is not the world before it.",
          "The scene works because it turns an impossible question into an action. Why do people suffer? The myth answers with an image: something sealed was opened, and what came out could not be gathered back. The lid can close again, but the world has already changed."
        ]
      },
      {
        heading: 'Why Pandora Had a Jar, Not a Box',
        purpose: 'Clarify the container without turning the article into a translation note.',
        storyBriefInputs: ['jar', 'pithos', 'box', 'translation'],
        contentLayer: 'later retellings',
        targetWords: { min: 220, max: 360 },
        paragraphs: [
          "The phrase Pandora's box is now so common that it feels like the original form of the myth. But older discussion usually points to a jar, often described as a pithos. That was not a tiny object. It was a large vessel tied to storage, household use, and sometimes even burial.",
          "A jar changes the scene. It feels heavier, older, and closer to the ground. It suggests something stored away from daily sight, not a little box waiting on a table. When that kind of vessel opens, the action feels less like a small mistake and more like a seal breaking.",
          "The later box image became powerful because it is easy to remember. It gave English a phrase for any action that releases consequences no one can easily stop. Still, the older jar matters. It reminds us that the myth was never only about a forbidden object. It was about a sealed world becoming unsealed."
        ]
      },
      {
        heading: 'Why Hope Remained Inside',
        purpose: 'Explore the most unresolved part of the story.',
        storyBriefInputs: ['hope', 'elpis', 'meaning'],
        contentLayer: 'interpretation',
        targetWords: { min: 240, max: 390 },
        paragraphs: [
          "Hope is the detail that keeps the story from closing neatly. After the troubles escape, hope remains in the jar. At first, this can sound merciful. Everything painful has entered the world, but something good has been preserved.",
          "Yet the image is not simple. If hope remains inside, do human beings possess it, or only reach toward it? Is hope protected for mortals, or withheld from them? The myth does not answer with a clean explanation. It leaves hope in the dark space of the container.",
          "That ambiguity may be why the story lasts. Hope comforts because it points beyond present suffering. But hope can also hurt because it delays relief. Pandora's jar holds both meanings at once. The worst things have escaped. The one thing that might help has stayed behind."
        ]
      },
      {
        heading: "How Pandora's Box Became the Famous Version",
        purpose: 'Show how the myth became a proverb and popular image.',
        storyBriefInputs: ['retellings', 'box', 'curiosity', 'popular meaning'],
        contentLayer: 'later retellings',
        targetWords: { min: 220, max: 360 },
        paragraphs: [
          "Later retellings often make the story easier to repeat. Pandora becomes the woman who could not resist opening the box. The myth becomes a warning about curiosity. That version is memorable because it is simple, but it leaves out much of the older pressure around Prometheus and Zeus.",
          "In the wider myth, Pandora is not only curious. She is part of a divine answer to the theft of fire. The container matters, but so does the reason she arrives. Without that reason, the story becomes a small moral lesson instead of a myth about the condition of human life.",
          "The phrase Pandora's box survived because it names a familiar fear. Some actions release more than anyone expects. Some choices cannot be reversed. But the older story is wider than the phrase. It is about punishment disguised as a gift, and about hope staying behind after the damage is already loose."
        ]
      },
      {
        heading: "What Pandora's Jar Still Means",
        purpose: 'Close with a careful symbolic reading.',
        storyBriefInputs: ['meaning', 'interpretation', 'human condition'],
        contentLayer: 'interpretation',
        targetWords: { min: 220, max: 360 },
        paragraphs: [
          "Pandora's jar may be read as a myth about consequences. Fire gives humanity power, but that power brings punishment. Pandora is a gift, but the gift carries loss. The jar is sealed, but the seal does not last. Every comfort in the story has a shadow beside it.",
          "It may also be read as a myth about explanation itself. Human suffering is too large for one answer, so the story gives it a shape. A vessel opens. Trouble escapes. Hope remains. The myth does not solve suffering. It gives listeners a way to imagine why suffering feels so old and so difficult to contain.",
          "That is why Pandora still matters. The story gives a clear image to something people still know: some choices release consequences that cannot be put back. Yet the myth does not end with empty ruin. It leaves hope behind, quiet and unresolved, waiting where the lid came down."
        ]
      }
    ],
    conclusion: {
      purpose: 'End with the lasting image of the jar.',
      targetWords: { min: 100, max: 180 },
      paragraphs: [
        "Pandora's jar is remembered because it gives trouble a beginning. The lid rises, the sealed world breaks open, and what was once contained becomes part of ordinary life.",
        "But the story lasts because it refuses to end as a simple warning. Hope remains inside. That one detail turns Pandora's container into one of Greek myth's most enduring questions."
      ]
    },
    faq: [
      {
        q: "Who created Pandora in Greek mythology?",
        a: "Pandora is shaped by the gods in the mythic cycle around Zeus and Prometheus. Hephaestus gives her form, while other gods give her qualities such as skill, beauty, desire, and persuasive speech."
      },
      {
        q: "Why was Pandora sent to Epimetheus?",
        a: "Pandora is sent as part of Zeus's punishment after Prometheus steals fire for humanity. Prometheus warns Epimetheus not to accept gifts from Zeus, but Epimetheus accepts Pandora anyway."
      },
      {
        q: "Was Pandora's container originally a jar or a box?",
        a: "The familiar modern phrase is Pandora's box, but many discussions of the older Greek tradition describe the container as a jar or pithos. The box wording became dominant in later retellings and popular language."
      },
      {
        q: "What escaped from Pandora's jar?",
        a: "The story usually speaks of the troubles, evils, or ills of human life escaping from the container. The exact list is often less important than the larger image of suffering entering the world."
      },
      {
        q: "Why did hope remain inside?",
        a: "Hope remaining inside is one of the myth's most debated details. It can be read as comfort preserved for humanity, or as something more ambiguous: a relief that stays hidden, delayed, or difficult to reach."
      },
      {
        q: "Is curiosity the main point of Pandora's myth?",
        a: "Curiosity matters in many later retellings, but the older frame is wider. It is also about Zeus, Prometheus, divine punishment, a dangerous gift, and the origin of human suffering."
      },
      {
        q: "How did the phrase open Pandora's box develop?",
        a: "The phrase became a way to describe an action that releases many unexpected problems. It survives because the myth's central image is easy to apply to ordinary choices and their consequences."
      }
    ],
    publicSourceNote: "Pandora's jar is discussed here through Greek myth, especially the Hesiodic tradition and later retellings. The container, the role of hope, and the later box wording can vary by translation and summary."
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
