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
  existing.seoHeadings = [
    ...publicHeadings
  ];
  existing.publicArticlePlan = publicArticlePlan;
  existing.sourceStatus = 'Myths / Greek mythology and Hesiodic tradition / myth narrative';
  existing.excerpt = "A source-aware reading of Pandora's jar, the later box tradition, and the unresolved place of hope in Greek myth.";
  existing.introSummary = "Pandora's jar belongs to the Greek mythic world around Zeus, Prometheus, and Epimetheus. This archive reading follows the known story while keeping later retellings and symbolic meanings separate from the core myth.";
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
  title: "Pandora's Jar Myth: Hope, Trouble, and the Story Behind Pandora's Box",
  displayTitle: "Pandora's Jar Myth: Hope, Trouble, and the Story Behind Pandora's Box",
  h1: "Pandora's Jar Myth: Hope, Trouble, and the Story Behind Pandora's Box",
  seoTitle: "Pandora's Jar Myth: Hope, Trouble, and Greek Myth Meaning",
  metaTitle: "Pandora's Jar Myth: Hope, Trouble, and Greek Myth Meaning",
  metaDescription: "Pandora's Jar Myth explained through Hesiod, Greek myth, the later box tradition, hope, trouble, and the meaning of Pandora's container.",
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
  excerpt: "A source-aware reading of Pandora's jar, the later box tradition, and the unresolved place of hope in Greek myth.",
  introSummary: "Pandora's jar belongs to the Greek mythic world around Zeus, Prometheus, and Epimetheus. This archive reading follows the known story while keeping later retellings and symbolic meanings separate from the core myth.",
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
    dek: "A Greek myth about divine punishment, human trouble, and the difficult question of why hope was left behind.",
    quickAnswer: {
      purpose: 'Give readers the usable answer before the full story.',
      targetWords: { min: 110, max: 180 },
      paragraphs: [
        "Pandora's jar is a Greek mythic story best known today as Pandora's box. In the older tradition around Hesiod, Pandora is connected to Zeus's punishment after Prometheus steals fire for humanity. She is sent to Epimetheus with a container that should not be opened.",
        "When the container is opened, the troubles of human life escape into the world. Hope remains inside. That final detail is why the myth still feels unsettled. It is not only a story about curiosity or punishment. It is also a story about why suffering seems to spread freely, while hope stays hidden, delayed, or difficult to understand."
      ]
    },
    introduction: [
      "The story most people call Pandora's box did not begin with a box. In many source-conscious retellings, the container is described as a jar, often linked with the Greek word pithos.",
      "That difference matters because the image changes the feeling of the myth. A box sounds small and private. A jar feels older, heavier, and closer to the household world of ancient story. But the central question stays the same: why does one opened container explain so much human trouble?"
    ],
    sections: [
      {
        heading: 'Why Zeus Sent Pandora to Humanity',
        purpose: 'Set up the mythic conflict behind Pandora.',
        storyBriefInputs: ['Zeus', 'Prometheus', 'fire', 'punishment'],
        contentLayer: 'core story',
        targetWords: { min: 220, max: 360 },
        paragraphs: [
          "Pandora's story begins before Pandora appears. It begins with Prometheus, the Titan who stands close to humanity in Greek myth. Prometheus steals fire and gives it to human beings. Fire is more than warmth. It is cooking, craft, metalwork, light, and the first hint that mortals might live with powers meant for the gods.",
          "Zeus does not treat this as a small theft. In the mythic order, fire is a boundary. When Prometheus crosses it, Zeus answers by changing the condition of human life. His punishment is not a single blow. It is a new pattern placed into the world.",
          "That pattern arrives through Pandora. She is not sent as a simple monster or open enemy. She comes as a gift, which makes the punishment more dangerous. The trouble is hidden inside beauty, welcome, and ceremony. The first movement of the story is already a warning: not every gift from the gods is meant to bless the receiver."
        ]
      },
      {
        heading: 'How Pandora Was Created',
        purpose: 'Explain Pandora as a crafted mythic figure.',
        storyBriefInputs: ['Pandora', 'Hephaestus', 'Athena', 'Aphrodite', 'Hermes'],
        contentLayer: 'core story',
        targetWords: { min: 220, max: 360 },
        paragraphs: [
          "Pandora is made, not born in the ordinary way. In the Hesiodic tradition, the gods shape her as part of Zeus's answer to Prometheus. Hephaestus gives form to the first woman from earth and water. Athena teaches her skill. Aphrodite gives grace and desire. Hermes adds a more dangerous quality: persuasive speech and a mind that can deceive.",
          "This makes Pandora one of the most carefully assembled figures in Greek myth. She carries gifts from several gods, but those gifts are not neutral. Her very name is often understood through the idea of being all-gifted or given by all. The phrase sounds generous. The story makes it uneasy.",
          "Pandora's creation gives the myth its quiet tension. She is beautiful, gifted, and astonishing. Yet every part of her arrival belongs to a punishment planned by Zeus. The story does not ask the listener to fear her at once. It asks the listener to notice how danger can arrive in a form that everyone has been taught to admire."
        ]
      },
      {
        heading: 'Why Epimetheus Accepted Pandora',
        purpose: 'Show the moment when warning gives way to desire.',
        storyBriefInputs: ['Epimetheus', 'Prometheus', 'warning', 'gift'],
        contentLayer: 'core story',
        targetWords: { min: 200, max: 330 },
        paragraphs: [
          "Pandora is sent to Epimetheus, the brother of Prometheus. The names already create a contrast. Prometheus is often associated with forethought. Epimetheus is associated with afterthought. One looks ahead. The other understands too late.",
          "Prometheus warns Epimetheus not to accept gifts from Zeus. That warning is simple enough. But the myth depends on the fact that simple warnings are not always strong enough to stop desire, wonder, or pride. Epimetheus sees Pandora and accepts her.",
          "This is not just a mistake in the plot. It is the human part of the story. The danger does not force its way in. It is welcomed. The punishment works because it passes through ordinary weakness: the wish to receive what looks beautiful, rare, and honored by the gods."
        ]
      },
      {
        heading: 'What Happened When the Jar Was Opened',
        purpose: 'Tell the central image of the myth clearly.',
        storyBriefInputs: ['container', 'troubles', 'hope'],
        contentLayer: 'core story',
        targetWords: { min: 240, max: 380 },
        paragraphs: [
          "At the center of the myth is the container. It is opened, and the world changes. The story does not need a long list of named spirits to make the image work. What escapes is the broad weight of human suffering: troubles, evils, pains, illnesses, and the hard conditions that make life fragile.",
          "Before the jar opens, suffering is imagined as contained. After it opens, it is everywhere. That is why the scene has lasted for so long. It turns an abstract question into a physical action. Why do people suffer? Because something once held back was released.",
          "Then the lid closes again. Hope remains inside. The myth leaves that detail in a strange place. If hope is good, why is it trapped? If hope is dangerous, why is it preserved? The jar does not simply explain suffering. It leaves the listener with a second question, and that question is harder to close."
        ]
      },
      {
        heading: 'Why It Was a Jar, Not a Box',
        purpose: 'Clarify the container without turning the article into a translation note.',
        storyBriefInputs: ['jar', 'pithos', 'box', 'translation'],
        contentLayer: 'later retellings',
        targetWords: { min: 220, max: 360 },
        paragraphs: [
          "The phrase Pandora's box is now so familiar that it feels original. But many discussions of the older myth point to a jar or pithos instead. A pithos was a large storage jar, the kind of object that belongs to food, wine, oil, burial, and household life. It is a heavier and more ancient image than a small box with a lid.",
          "The box became powerful in later language because it is easy to picture and easy to turn into a proverb. To open Pandora's box now means to begin something that releases many unexpected problems. The phrase survives because it is useful, even when it does not preserve the older container exactly.",
          "This does not create a separate myth. It shows how myths change as they travel. The container shifts from jar to box, but the structure remains: something closed is opened, trouble escapes, and the person who opened it can never return the world to its earlier state."
        ]
      },
      {
        heading: 'Why Hope Remained Inside',
        purpose: 'Explore the most unresolved part of the story.',
        storyBriefInputs: ['hope', 'elpis', 'meaning'],
        contentLayer: 'interpretation',
        targetWords: { min: 240, max: 390 },
        paragraphs: [
          "Hope is the most difficult part of Pandora's story. Many modern readers treat it as a mercy. The world receives suffering, but hope is kept safe for human beings. In that reading, the myth ends with a small kindness inside a harsh punishment.",
          "There is another way to hear it. If hope remains in the jar, perhaps people do not fully possess it. Perhaps hope is delayed, hidden, or trapped just out of reach. The story then becomes darker. It says not only that trouble entered human life, but that relief became uncertain.",
          "Both readings explain why the myth has survived. Hope is comforting because it points forward. But hope can also be painful because it asks people to wait. Pandora's jar holds that ambiguity in one image. The worst things have escaped. The one thing that might help has not escaped in the same way."
        ]
      },
      {
        heading: "How Later Retellings Changed Pandora's Story",
        purpose: 'Show how the myth became a proverb and popular image.',
        storyBriefInputs: ['retellings', 'box', 'curiosity', 'popular meaning'],
        contentLayer: 'later retellings',
        targetWords: { min: 220, max: 360 },
        paragraphs: [
          "Later retellings often make Pandora's story simpler. Pandora becomes the person who could not resist opening the box. The myth becomes a warning about curiosity. That version is memorable, but it can flatten the older pattern around Zeus, Prometheus, Epimetheus, and punishment.",
          "In the larger mythic frame, Pandora is not only a curious figure. She is part of a divine response to Prometheus and to humanity's new possession of fire. The container matters, but so does the reason she arrives. Without that reason, the story becomes a moral lesson about one person's weakness instead of a myth about how human life was changed.",
          "The popular version is still powerful. It gives modern language a phrase for actions that cannot be undone. But the older shape of the myth is wider. It is about gifts, warnings, punishment, desire, suffering, and the uneasy survival of hope."
        ]
      },
      {
        heading: "What Pandora's Story May Mean",
        purpose: 'Close with a careful symbolic reading.',
        storyBriefInputs: ['meaning', 'interpretation', 'human condition'],
        contentLayer: 'interpretation',
        targetWords: { min: 220, max: 360 },
        paragraphs: [
          "Pandora's jar may be read as a myth about the human condition. It does not explain suffering through history or science. It explains it through story. The world is difficult because a boundary was broken, a gift was accepted, and a sealed container was opened.",
          "It may also be read as a story about knowledge arriving with cost. Fire helps humanity, but it also draws punishment. Pandora arrives as a gift, but the gift carries loss. Hope remains, but not in a simple form. Every comfort in the myth has a shadow beside it.",
          "That is why Pandora still matters. The myth gives a clear image to something people still feel: some choices release consequences that cannot be gathered back. Yet the story does not end with empty ruin. It leaves hope behind, silent and unresolved, waiting inside the jar."
        ]
      }
    ],
    conclusion: {
      purpose: 'End with the lasting image of the jar.',
      targetWords: { min: 100, max: 180 },
      paragraphs: [
        "Pandora's jar is remembered because it makes the beginning of trouble feel visible. A lid rises. The sealed world breaks open. What was contained becomes part of ordinary life.",
        "But the myth lasts because it does not explain everything too neatly. Hope remains inside, and that detail keeps the story alive. It turns Pandora's container from a simple warning into one of Greek myth's most enduring questions."
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
        a: "Curiosity is important in many later retellings, but the older myth is also about Zeus, Prometheus, divine punishment, gifts, warnings, and the origin of human suffering."
      },
      {
        q: "How did the phrase open Pandora's box develop?",
        a: "The phrase became a way to describe an action that releases many unexpected problems. It survives because the myth's central image is easy to apply to ordinary choices and their consequences."
      }
    ],
    publicSourceNote: "Pandora's jar is discussed here through Greek myth, especially the Hesiodic tradition and later retellings. The container, the place of hope, and the later box wording can vary by translation and summary."
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
