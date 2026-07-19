const fs = require('fs');
const path = require('path');
const { buildContentDNA } = require('./article-dna-utils');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const publishedAt = '2026-07-19';
const slug = 'arachne-myth';

const stories = readJson(storiesPath);

const story = {
  id: slug,
  slug,
  title: 'Arachne Myth: Athena, Weaving, and the Origin of the Spider',
  displayTitle: 'Arachne Myth: Athena, Weaving, and the Origin of the Spider',
  h1: 'Arachne Myth: Athena, Weaving, and the Origin of the Spider',
  seoTitle: 'Arachne Myth: Athena, Weaving, and the Origin of the Spider',
  metaTitle: 'Arachne Myth: Athena, Weaving, and the Origin of the Spider',
  metaDescription: 'Arachne Myth retold through Greek and Roman tradition, Athena, the weaving contest, divine pride, transformation, and the origin of the spider.',
  category: 'Myths',
  categorySlug: 'myths',
  categoryGroup: 'Mythic & Imagined Realms',
  tag: 'Greek Myth',
  primaryTag: 'Greek Myth',
  seedKeyword: 'arachne myth',
  primaryKeyword: 'arachne myth',
  searchIntent: 'meaning',
  articleFormat: 'story-archive',
  cluster: 'Myths / Greek Myth',
  relatedKeywords: [
    'arachne myth origin',
    'arachne and athena',
    'arachne spider myth',
    'athena weaving contest',
    'greek myth spider'
  ],
  secondaryKeywords: [
    'arachne myth origin',
    'arachne and athena',
    'arachne spider myth',
    'athena weaving contest',
    'greek myth spider',
    'Ovid Metamorphoses',
    'Minerva',
    'Lydia'
  ],
  topicScore: 91,
  topicStatus: 'approved',
  scoreBreakdown: {
    searchDemand: 28,
    clickCuriosity: 23,
    siteFit: 22,
    expansionPotential: 11,
    sourceSafety: 7
  },
  summaryAnswer: 'Arachne Myth is a Greek and Roman mythic story about a gifted Lydian weaver who challenges Athena, wins attention through flawless craft, and is transformed into a spider after the contest turns into punishment.',
  readTime: '9 min read',
  storyType: 'Myth',
  sourceStatus: 'Myths / Greek and Roman myth tradition / Ovid and later mythology references',
  excerpt: 'A source-aware Kyunolab record tracing Arachne, Athena, the weaving contest, and the spider transformation.',
  introSummary: "Arachne is remembered as the weaver whose talent became a challenge to Athena, turning skill, pride, and punishment into one of mythology's most enduring transformation stories.",
  publishedAt,
  updatedAt: publishedAt,
  relatedStoryIds: ['pandoras-jar-myth', 'icarus-myth', 'theseus-and-the-minotaur-myth', 'orpheus-and-eurydice-myth'],
  relatedStorySlugs: ['pandoras-jar-myth', 'icarus-myth', 'theseus-and-the-minotaur-myth', 'orpheus-and-eurydice-myth'],
  tags: ['Greek Myth', 'Arachne', 'Athena', 'Weaving', 'Transformation Myth'],
  detail: 'the myth in which Arachne challenges Athena to a weaving contest and is transformed into a spider',
  evidence: 'Theoi Arachne entry, Ovid Metamorphoses Book 6, British Museum Arachne collection entry, Dictionary of Greek and Roman Biography and Mythology',
  researchSources: [
    {
      title: 'Arachne - Theoi Greek Mythology',
      url: 'https://www.theoi.com/Heroine/Arakhne.html',
      supports: 'Arachne as a Lydian weaver, the contest with Athena, the destruction of the woven work, and the spider transformation.'
    },
    {
      title: 'Ovid, Metamorphoses, Book 6 - Project Gutenberg',
      url: 'https://www.gutenberg.org/files/21765/21765-h/21765-h.htm',
      supports: 'The classical literary version of Arachne challenging Minerva and being transformed.'
    },
    {
      title: 'Arachne - British Museum Collection Term',
      url: 'https://www.britishmuseum.org/collection/term/BIOG64635',
      supports: 'A reference record identifying Arachne as a Greek and Roman mythological figure linked to the weaving contest and spider transformation.'
    }
  ],
  sourceNotes: {
    sharedVerifiedPoints: [
      'Arachne is an existing mythological figure associated with Lydia, weaving, Athena or Minerva, and transformation into a spider.',
      "The most familiar literary version appears in Ovid's Metamorphoses, where the contest turns from craft into divine punishment.",
      'Later reference sources preserve the core image of the mortal weaver, the goddess, the ruined web, and the spider.'
    ],
    variants: [
      'Greek and Roman naming may shift between Athena and Minerva in retellings.',
      "Some summaries emphasize pride and divine punishment, while others emphasize Arachne's skill and the uncomfortable truth shown in her weaving."
    ],
    unsupportedClaimsToAvoid: [
      'Do not present Arachne as a verified historical person.',
      'Do not invent a lost textile, hidden temple record, witness account, or secret version of the contest.',
      'Do not treat the spider transformation as a confirmed physical event.'
    ],
    sourceLimits: [
      'The story survives through classical literature, reference summaries, translation, and later artistic tradition.',
      'The archive can explain the myth and its symbolic force without flattening every version into one final canon.',
      'Interpretations of pride, craft, truth, and punishment should be presented as readings rather than proof of one intended meaning.'
    ]
  },
  targetQuery: 'arachne myth',
  canonicalQuery: 'arachne myth',
  uniqueAngle: 'Arachne Myth is treated as an existing transformation myth first, with the weaving contest read as a story about skill, pride, truth, and the danger of being judged by a god.',
  sceneAnchor: 'Arachne standing before a loom as Athena judges a woven image that no one can easily dismiss',
  subjectSpecificVocabulary: ['Arachne', 'Athena', 'Minerva', 'weaving', 'loom', 'spider', 'Lydia', 'Ovid'],
  contentType: 'story',
  storyBrief: {
    topic: 'Arachne Myth',
    category: 'Myths',
    contentType: 'myth-narrative',
    existenceStatus: 'confirmed',
    circulationLevel: 'global',
    knownNames: ['Arachne', 'Arakhne', 'Arachne and Athena', 'Arachne and Minerva'],
    cultureOrContext: "Greek myth through Roman literary retelling, especially Ovid's Metamorphoses",
    coreStoryElements: [
      'Arachne is remembered as a highly skilled weaver from Lydia or the region around Colophon.',
      'Her skill becomes so famous that she is compared with Athena, the goddess associated with craft and weaving.',
      'Arachne challenges Athena or refuses to credit the goddess for her art.',
      'The contest produces two woven works, with Arachne often shown as technically flawless but offensive to divine pride.',
      'Athena destroys or attacks the work, and Arachne is transformed into a spider.'
    ],
    reportedVariants: [
      {
        claim: 'Roman retellings often use Minerva where Greek-focused summaries use Athena.',
        scope: 'Greek and Roman naming tradition'
      },
      {
        claim: 'Later summaries may emphasize Arachne as proud, while modern readings often notice her skill and the bold criticism woven into her image.',
        scope: 'literary and interpretive retelling'
      },
      {
        claim: "Some accounts present the transformation as punishment, while others allow it to feel like a grim continuation of Arachne's craft.",
        scope: 'symbolic interpretation'
      }
    ],
    editorialInterpretationOptions: [
      'The myth may be read as a warning about pride before divine authority.',
      'It may also be read as a more uneasy story about art, truth, and what happens when a mortal image exposes the gods.',
      "The spider ending can suggest that punishment does not erase Arachne's talent; it changes the form in which that talent survives."
    ],
    uncertainDetails: [
      'The balance between moral warning and sympathy for Arachne depends on the retelling.',
      'Ancient and later versions do not always handle Athena or Minerva with the same emotional emphasis.',
      'The myth is literary and symbolic, not a historical record of a real contest.'
    ],
    prohibitedInventions: [
      'Do not invent a hidden original Greek version of the story.',
      'Do not invent new named judges, spectators, temples, documents, or textiles.',
      'Do not add a secret curse, prophecy, or surviving physical web.',
      'Do not treat the transformation as literal historical evidence.'
    ],
    existenceEvidence: [
      {
        title: 'Arachne - Theoi Greek Mythology',
        url: 'https://www.theoi.com/Heroine/Arakhne.html',
        sourceType: 'mythology reference and classical-text collection',
        supports: 'Arachne, Athena or Minerva, the weaving contest, and the spider transformation.'
      },
      {
        title: 'Ovid, Metamorphoses, Book 6 - Project Gutenberg',
        url: 'https://www.gutenberg.org/files/21765/21765-h/21765-h.htm',
        sourceType: 'classical literary text translation',
        supports: 'The Ovidian narrative of Arachne challenging Minerva and being transformed.'
      },
      {
        title: 'Arachne - British Museum Collection Term',
        url: 'https://www.britishmuseum.org/collection/term/BIOG64635',
        sourceType: 'museum reference',
        supports: 'Arachne as a Greek and Roman mythological figure connected to Athena or Minerva and the spider.'
      }
    ]
  },
  seoHeadings: [
    'The Weaver Whose Skill Drew Athena Near',
    'The Contest at the Loom',
    'What Arachne Wove Against the Gods',
    'The Moment Skill Became Punishment',
    'Why Arachne Became a Spider',
    'How Later Versions Changed the Emphasis',
    'What the Arachne Myth Still Means'
  ],
  publicArticlePlan: buildArachnePublicArticlePlan()
};

const existingQueries = new Set(
  stories
    .filter((item) => item.slug !== slug)
    .map((item) => item.contentDNA?.canonicalQuery || item.primaryKeyword || item.seedKeyword)
    .filter(Boolean)
    .map((query) => query.toLowerCase().trim())
);

story.contentDNA = buildContentDNA(story, existingQueries);
story.contentDNA.subjectSpecificVocabulary = story.subjectSpecificVocabulary;
story.contentDNA.sectionBlueprint = story.seoHeadings.map((title) => ({ title, nav: title }));

const existingIndex = stories.findIndex((item) => item.slug === slug);
if (existingIndex >= 0) {
  stories[existingIndex] = story;
  console.log(`Updated existing myth archive story: ${slug}`);
} else {
  stories.unshift(story);
  console.log(`Added existing myth archive story: ${slug}`);
}
writeJson(storiesPath, stories);

function buildArachnePublicArticlePlan() {
  return {
    title: 'Arachne Myth: Athena, Weaving, and the Origin of the Spider',
    dek: 'A myth about a mortal artist, a goddess at the loom, and the moment perfect skill becomes impossible to forgive.',
    quickAnswer: {
      paragraphs: [
        "Arachne myth is the Greek and Roman story of a gifted mortal weaver who challenges Athena, or Minerva in Roman retellings, to a contest of skill. The story is best known from Ovid's Metamorphoses, where Arachne refuses to step back from her own talent and faces a goddess whose authority has been questioned.",
        'In the familiar version, Arachne weaves so well that the problem is not poor craft. The problem is what her art shows and what her confidence implies. Athena attacks the work, Arachne is overwhelmed, and the story ends with her transformed into a spider, still tied forever to weaving.'
      ],
      targetWords: { min: 100, max: 180 }
    },
    introduction: [
      'Arachne is not remembered because she failed at her craft. She is remembered because she was good enough to make the contest dangerous.',
      'That is what gives the myth its uneasy force. A mortal woman sits at a loom, faces a goddess of skill, and creates something that cannot simply be dismissed. The thread becomes more than decoration. It becomes challenge, accusation, and proof.'
    ],
    sections: [
      {
        heading: 'The Weaver Whose Skill Drew Athena Near',
        purpose: 'Introduce Arachne and the mythic problem created by her talent.',
        contentLayer: 'existing-story',
        targetWords: { min: 220, max: 360 },
        paragraphs: [
          'Arachne is usually described as a young woman from Lydia, connected with Colophon or the surrounding region in later reference tradition. Her father, Idmon, is remembered as a dyer of wool, so the world around her already belongs to thread, color, and craft.',
          'But Arachne is not famous because of family rank. She is famous because of what her hands can do. People come to watch her work. They admire the movement of the spindle, the softness of the wool, and the images growing inside the fabric.',
          'That kind of praise creates the first danger in the myth. Arachne is compared with Athena, the goddess of wisdom and craft. Instead of accepting the comparison as an honor, she refuses to treat her talent as a gift from the goddess. In many retellings, that refusal becomes the spark.'
        ]
      },
      {
        heading: 'The Contest at the Loom',
        purpose: 'Tell how the challenge becomes a formal contest between mortal and goddess.',
        contentLayer: 'existing-story',
        targetWords: { min: 260, max: 420 },
        paragraphs: [
          'Athena first approaches Arachne in disguise, often as an old woman. The warning is simple. Arachne may accept mortal praise, but she should not deny the goddess. She should ask forgiveness before the insult becomes too large.',
          'Arachne does not retreat. She tells the old woman that Athena can come herself if she wants a contest. The disguise falls away, and the room changes. This is no longer gossip about a talented weaver. It is a direct meeting between mortal confidence and divine power.',
          'The two looms are set against each other. Athena weaves the majesty of the gods and the order they claim. Arachne weaves another kind of image. Her work shows divine deception, desire, and harm. The contest is no longer only about beauty. It is about who has the right to show the gods as they are remembered in troubling stories.'
        ]
      },
      {
        heading: 'What Arachne Wove Against the Gods',
        purpose: "Explain why Arachne's woven image is the center of the myth.",
        contentLayer: 'existing-story',
        targetWords: { min: 260, max: 420 },
        paragraphs: [
          "The most unsettling part of the Arachne myth is that her weaving is not simply ugly, foolish, or crude. In Ovid's version, even Envy could not find a flaw in it. That detail matters. Arachne loses the contest in power, not necessarily in skill.",
          'Her woven scenes expose the gods in forms that are uncomfortable to honor. The fabric becomes a record of divine behavior that official praise would rather hide. Athena can judge the work, but she cannot easily dismiss its craft.',
          'This is why Arachne remains more complicated than a simple warning against pride. Pride is part of the story, but so is talent. So is the danger of making art that tells a truth powerful figures do not want to see.'
        ]
      },
      {
        heading: 'The Moment Skill Became Punishment',
        purpose: 'Show how the contest turns from judgment into punishment.',
        contentLayer: 'existing-story',
        targetWords: { min: 220, max: 360 },
        paragraphs: [
          "After seeing Arachne's work, Athena tears or ruins the woven image. In Ovid's telling, she strikes Arachne with the shuttle. The object of craft becomes an object of punishment, and the contest breaks apart.",
          'Arachne cannot bear the humiliation. The story moves quickly from public skill to private despair. She hangs herself, and Athena intervenes. But the intervention is not a full rescue. It is a transformation.',
          'Arachne is changed into a spider. She lives, but not as she was. Her punishment keeps her close to the thing that made her famous. She will continue to hang, spin, and weave.'
        ]
      },
      {
        heading: 'Why Arachne Became a Spider',
        purpose: 'Explain the transformation as both punishment and symbolic continuation.',
        contentLayer: 'variant-and-interpretation',
        targetWords: { min: 260, max: 420 },
        paragraphs: [
          'The spider ending gives the myth its lasting image. Arachne is not turned into a stone, a tree, or a nameless shadow. She becomes a creature whose whole life is thread.',
          'One possible reading is clear. The transformation punishes arrogance. Arachne challenged a goddess and must now weave forever from a lower place. In that reading, the spider is a warning about mortal pride.',
          "But the ending also carries a stranger feeling. The punishment does not erase Arachne's skill. It preserves it in another body. Every web can seem like a reminder that the goddess won authority, while Arachne kept the motion of her art."
        ]
      },
      {
        heading: 'How Later Versions Changed the Emphasis',
        purpose: 'Separate source variation and interpretation without inventing a new version.',
        contentLayer: 'reported-variant',
        targetWords: { min: 220, max: 360 },
        paragraphs: [
          'Different versions may use Athena or Minerva, depending on whether the retelling is framed through Greek or Roman names. The core pattern remains recognizable: a mortal weaver, a divine contest, a work that angers the goddess, and a spider transformation.',
          'Later summaries often make the moral very direct. Arachne is proud, Athena punishes pride, and the spider explains the origin of weaving in nature. That version is easy to remember, but it is not the only reason the myth still feels alive.',
          'Modern readers often notice the tension inside the contest. Arachne may be reckless, but she is also skilled. Athena may be divine, but her anger makes the judgment feel uneasy. The story survives because both sides remain difficult.'
        ]
      },
      {
        heading: 'What the Arachne Myth Still Means',
        purpose: 'Close with the symbolic force of the myth for readers.',
        contentLayer: 'variant-and-interpretation',
        targetWords: { min: 240, max: 380 },
        paragraphs: [
          'Arachne lasts because the myth turns art into risk. It asks what happens when craft becomes too honest, too confident, or too visible to ignore.',
          'The story may be read as a warning about pride. It may also be read as a story about power judging the image made against it. Both readings can exist at once, because the myth does not give Arachne a simple victory or Athena a simple calm.',
          'At the end, the loom disappears, but the thread remains. That is why the spider feels like more than a punishment. It is a small, dark signature left by a myth that never stopped thinking about skill.'
        ]
      }
    ],
    conclusion: {
      paragraphs: [
        'The Arachne myth begins with craft and ends with transformation, but its real tension lives between those points. A mortal artist creates something powerful enough to disturb a goddess, and the story never lets that fact disappear.',
        'That is why Arachne still matters. She is warning, artist, rival, victim, and spider at once. The web she leaves behind is not only a sign of punishment. It is also the memory of a hand that could make the gods look back.'
      ],
      targetWords: { min: 100, max: 180 }
    },
    faq: [
      {
        q: 'Who is Arachne in Greek mythology?',
        a: 'Arachne is a gifted mortal weaver associated with Lydia who challenges Athena, or Minerva in Roman retellings, and is transformed into a spider.'
      },
      {
        q: 'What is the Arachne myth about?',
        a: 'It is about talent, pride, divine authority, and a weaving contest that ends with Arachne becoming a spider.'
      },
      {
        q: 'Why does Athena punish Arachne?',
        a: "In the familiar version, Athena is angered by Arachne's challenge and by the woven images that expose shameful stories about the gods."
      },
      {
        q: 'What can Arachne symbolize?',
        a: 'Arachne may symbolize pride before divine power, but she can also symbolize dangerous artistic truth and skill that survives punishment.'
      }
    ],
    publicSourceNote: 'Arachne is discussed here through Greek and Roman myth tradition, especially the Ovidian version and later mythology references. Names, emphasis, and interpretation can differ across translations and retellings.'
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
