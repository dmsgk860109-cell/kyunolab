const fs = require('fs');
const path = require('path');
const { buildContentDNA } = require('./article-dna-utils');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const publishedAt = '2026-07-19';
const slug = 'medusa-and-perseus-myth';

const stories = readJson(storiesPath);

const story = {
  id: slug,
  slug,
  title: 'Medusa and Perseus: The Gorgon, the Mirrored Shield, and the Power of the Severed Head',
  displayTitle: 'Medusa and Perseus: The Gorgon, the Mirrored Shield, and the Power of the Severed Head',
  h1: 'Medusa and Perseus: The Gorgon, the Mirrored Shield, and the Power of the Severed Head',
  seoTitle: 'Medusa and Perseus: The Gorgon, the Mirrored Shield, and the Power of the Severed Head',
  metaTitle: 'Medusa and Perseus: The Gorgon, the Mirrored Shield, and the Power of the Severed Head',
  metaDescription: 'Medusa and Perseus follows the Greek myth of the mortal Gorgon, the mirrored shield, Pegasus, Andromeda, and why Medusa remains powerful after death.',
  category: 'Myths',
  categorySlug: 'myths',
  categoryGroup: 'Mythic & Imagined Realms',
  tag: 'Greek Myth',
  primaryTag: 'Greek Myth',
  seedKeyword: 'medusa and perseus myth',
  primaryKeyword: 'medusa and perseus myth',
  searchIntent: 'meaning',
  articleFormat: 'story-archive',
  cluster: 'Myths / Greek Myth',
  relatedKeywords: [
    'medusa myth',
    'perseus and medusa',
    'gorgon myth',
    'medusa head meaning',
    'athena mirrored shield'
  ],
  secondaryKeywords: [
    'medusa myth',
    'perseus and medusa',
    'gorgon myth',
    'medusa head meaning',
    'athena mirrored shield',
    'Pegasus',
    'Graeae',
    'Polydectes'
  ],
  topicScore: 93,
  topicStatus: 'approved',
  scoreBreakdown: {
    searchDemand: 29,
    clickCuriosity: 24,
    siteFit: 23,
    expansionPotential: 11,
    sourceSafety: 6
  },
  summaryAnswer: 'Medusa and Perseus is the Greek myth of a young hero sent to bring back the head of the mortal Gorgon Medusa. With help from Athena, Hermes, and other divine gifts, Perseus avoids her petrifying gaze, cuts off her head, and carries a power that remains dangerous even after death.',
  readTime: '9 min read',
  storyType: 'Myth',
  sourceStatus: 'Myths / Greek myth tradition / classical literary and art-historical sources',
  publicSourceBasis: 'Greek mythological tradition, especially Hesiod, Pindar, Apollodorus, Ovid, and later art-historical summaries',
  excerpt: 'A source-aware Kyunolab article tracing Medusa, Perseus, the Gorgon sisters, the mirrored shield, and the strange afterlife of the severed head.',
  introSummary: 'Medusa and Perseus is not only a monster-slaying story. It is a myth about dangerous sight, borrowed divine tools, heroic reputation, and a severed head whose power does not end with death.',
  publishedAt,
  updatedAt: publishedAt,
  relatedStoryIds: ['arachne-myth', 'theseus-and-the-minotaur-myth', 'pandoras-jar-myth', 'icarus-myth'],
  relatedStorySlugs: ['arachne-myth', 'theseus-and-the-minotaur-myth', 'pandoras-jar-myth', 'icarus-myth'],
  tags: ['Greek Myth', 'Medusa', 'Perseus', 'Gorgon', 'Transformation Myth'],
  detail: 'a mirrored shield',
  evidence: 'Theoi Perseus and Gorgon references, Hesiodic and Pindaric tradition summaries, Apollodorus, Ovid, and Metropolitan Museum art-historical discussion',
  researchSources: [
    {
      title: 'Perseus - Theoi Greek Mythology',
      url: 'https://www.theoi.com/Heros/Perseus.html',
      supports: 'Perseus as the son of Danae and Zeus, the task from Polydectes, divine equipment, the Graeae, the beheading of Medusa, Andromeda, and the return to Seriphos.'
    },
    {
      title: 'Gorgones and Medousa - Theoi Greek Mythology',
      url: 'https://www.theoi.com/Pontios/Gorgones.html',
      supports: 'Medusa as the mortal Gorgon, her sisters Stheno and Euryale, the petrifying gaze, Pegasus and Chrysaor, and later origin traditions.'
    },
    {
      title: 'Medusa in Ancient Greek Art - The Metropolitan Museum of Art',
      url: 'https://www.metmuseum.org/essays/medusa-in-ancient-greek-art',
      supports: 'Medusa as a figure in ancient Greek art, the gorgoneion, the Perseus episode, divine tools, Pegasus and Chrysaor, and the changing image of Medusa over time.'
    }
  ],
  sourceNotes: {
    sharedVerifiedPoints: [
      'Medusa is an existing mythological figure and one of the Gorgons in Greek tradition.',
      'Perseus is sent to bring back Medusa\'s head and succeeds with divine assistance.',
      'The severed head remains powerful in later episodes, including the rescue of Andromeda and the punishment of enemies.'
    ],
    variants: [
      'Older sources and later summaries do not always treat Medusa\'s origin in the same way.',
      'Ovid gives a later and more sympathetic transformation account, while many Greek references focus on Medusa as the mortal Gorgon slain by Perseus.',
      'Artistic depictions shift from monstrous forms to more human or beautiful images while preserving the power of the direct gaze.'
    ],
    unsupportedClaimsToAvoid: [
      'Do not present Medusa as a verified historical person.',
      'Do not invent a lost temple document, secret version, or newly discovered witness account.',
      'Do not treat the petrifying gaze or transformation as confirmed physical history.'
    ],
    sourceLimits: [
      'The myth survives through ancient poetry, mythographic summaries, visual art, later Roman retelling, and modern scholarship.',
      'The article can explain the story, variants, and symbolic readings without collapsing every source into one final version.',
      'Modern interpretations of Medusa should be presented as readings of the tradition rather than proof of one ancient meaning.'
    ]
  },
  targetQuery: 'medusa and perseus myth',
  canonicalQuery: 'medusa and perseus myth',
  uniqueAngle: 'Medusa and Perseus is treated as a myth about sight and power first: Perseus survives by refusing the direct gaze, while Medusa remains dangerous even after the hero has won.',
  sceneAnchor: 'Perseus holding a polished shield while Medusa sleeps among the Gorgons, with Athena guiding the impossible approach',
  subjectSpecificVocabulary: ['Medusa', 'Perseus', 'Gorgon', 'Athena', 'Hermes', 'Graeae', 'Pegasus', 'gorgoneion'],
  contentType: 'story',
  storyBrief: {
    topic: 'Medusa and Perseus',
    category: 'Myths',
    contentType: 'myth-narrative',
    existenceStatus: 'confirmed',
    circulationLevel: 'global',
    knownNames: ['Medusa', 'Medousa', 'Perseus and Medusa', 'The Gorgon Medusa'],
    cultureOrContext: 'Greek myth through classical literary, mythographic, and visual-art traditions',
    coreStoryElements: [
      'Medusa is remembered as the mortal Gorgon among the sisters Stheno, Euryale, and Medusa.',
      'Her gaze can turn living beings to stone, making direct sight itself the danger.',
      'King Polydectes sends Perseus to bring back Medusa\'s head, a task meant to be nearly impossible.',
      'Perseus receives divine help, including guidance from Athena, equipment associated with Hermes and the nymphs, and a way to avoid looking directly at Medusa.',
      'He kills Medusa while she sleeps, and Pegasus and Chrysaor spring from her severed neck.',
      'The head remains powerful after death and is later used before being given to Athena.'
    ],
    reportedVariants: [
      {
        claim: 'Greek sources often treat Medusa as the mortal Gorgon, while Ovid gives a later transformation story involving Poseidon and Athena.',
        scope: 'classical and Roman retelling'
      },
      {
        claim: 'The divine equipment differs by source summary, but the polished shield or reflective surface, winged movement, and concealment are recurring parts of the quest.',
        scope: 'mythographic and artistic tradition'
      },
      {
        claim: 'Medusa\'s image changes in ancient art from grotesque and frontal to more human or beautiful, while the force of her gaze remains central.',
        scope: 'visual tradition'
      }
    ],
    editorialInterpretationOptions: [
      'The myth may be read as a heroic quest built around indirect sight and controlled danger.',
      'It may also be read as a story about how power can survive after defeat, since Medusa\'s head remains effective after death.',
      'Modern readings often give greater attention to Medusa herself, especially the difference between monstrous image, victimized origin, and protective symbol.'
    ],
    uncertainDetails: [
      'The exact origin and moral framing of Medusa differ between early Greek material and later Roman retellings.',
      'The names and sources of Perseus\' equipment vary across summaries and ancient references.',
      'The myth is literary, mythographic, and artistic tradition rather than a historical report.'
    ],
    prohibitedInventions: [
      'Do not invent a secret temple version of Medusa.',
      'Do not add a hidden witness, lost diary, or new prophecy.',
      'Do not make Medusa or Perseus modern fictional characters.',
      'Do not turn the petrifying gaze into a verified natural phenomenon.'
    ],
    existenceEvidence: [
      {
        title: 'Perseus - Theoi Greek Mythology',
        url: 'https://www.theoi.com/Heros/Perseus.html',
        sourceType: 'mythology reference and classical-text collection',
        supports: 'Perseus, Danae, Polydectes, the quest for Medusa\'s head, divine equipment, the Graeae, Andromeda, and the return to Seriphos.'
      },
      {
        title: 'Gorgones and Medousa - Theoi Greek Mythology',
        url: 'https://www.theoi.com/Pontios/Gorgones.html',
        sourceType: 'mythology reference and classical-text collection',
        supports: 'The Gorgons, Medusa as mortal, the petrifying gaze, Pegasus and Chrysaor, and the later origin account.'
      },
      {
        title: 'Medusa in Ancient Greek Art - The Metropolitan Museum of Art',
        url: 'https://www.metmuseum.org/essays/medusa-in-ancient-greek-art',
        sourceType: 'museum essay and art-historical summary',
        supports: 'Medusa in Greek art, Perseus using the shield, the gorgoneion, Pegasus and Chrysaor, and changing visual depictions.'
      }
    ]
  },
  seoHeadings: [
    'Why Medusa Is Different From an Ordinary Monster',
    'The Task Given to Perseus',
    'The Divine Tools That Make the Quest Possible',
    'The Moment of the Mirrored Shield',
    'Why Medusa Remains Powerful After Death',
    'How Later Versions Changed Medusa',
    'What the Medusa Myth Still Means'
  ],
  publicArticlePlan: buildMedusaPublicArticlePlan()
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

function buildMedusaPublicArticlePlan() {
  return {
    title: 'Medusa and Perseus: The Gorgon, the Mirrored Shield, and the Power of the Severed Head',
    dek: 'A Greek myth about a deadly gaze, a hero who survives by looking indirectly, and a head whose power continues after death.',
    quickAnswer: {
      paragraphs: [
        'Medusa and Perseus is the Greek myth in which Perseus is sent to bring back the head of Medusa, the only mortal Gorgon. Medusa is feared because her gaze can turn living beings to stone, so the quest is not only a fight against a monster. It is a test of how to face danger without looking at it directly.',
        'With help from Athena, Hermes, and other divine gifts, Perseus reaches the Gorgons while they sleep. He uses a reflective shield or mirrored surface to avoid Medusa\'s gaze, cuts off her head, and escapes with a power that remains dangerous even after Medusa has died.'
      ],
      targetWords: { min: 100, max: 180 }
    },
    introduction: [
      'Medusa is one of the most recognizable figures in Greek myth, but her story is not simple.',
      'She is a monster, a victim in some later versions, a protective image in art, and the center of one of the most famous heroic quests. Perseus wins the story, but Medusa is the image that keeps returning.'
    ],
    sections: [
      {
        heading: 'Why Medusa Is Different From an Ordinary Monster',
        purpose: 'Introduce Medusa as a Gorgon whose danger is carried through sight.',
        contentLayer: 'existing-story',
        targetWords: { min: 240, max: 380 },
        paragraphs: [
          'Medusa belongs to the Gorgons, a group usually named as Stheno, Euryale, and Medusa. The difference is important. In many summaries, Stheno and Euryale are immortal, while Medusa is mortal. That means she can be killed, but not approached safely.',
          'Her most famous power is the gaze. Anyone who looks directly at her can be turned to stone. The danger is immediate and strangely simple. A sword may help, but the first problem is seeing. A hero who looks at Medusa in the ordinary way may lose before the fight begins.',
          'That is why the myth does not work like a simple battle. Medusa changes the rules of courage. Perseus must get close enough to strike while refusing the direct look that would destroy him.'
        ]
      },
      {
        heading: 'The Task Given to Perseus',
        purpose: 'Explain why Perseus is sent after Medusa and why the task is meant to be impossible.',
        contentLayer: 'existing-story',
        targetWords: { min: 260, max: 420 },
        paragraphs: [
          'Perseus is the son of Danae and Zeus. He grows up on Seriphos, where King Polydectes becomes part of the danger around his mother. In the common version, Polydectes wants Perseus out of the way and demands the head of Medusa.',
          'The request sounds like a heroic errand, but it is also a trap. Medusa lives far from ordinary human safety, among the Gorgons. Her sisters are terrifying, her face is deadly, and the way to reach her is not something a young hero can simply know.',
          'So the task reveals two things at once. Perseus is being tested, but he is also being used. The myth begins with a political and family threat before it becomes a monster story.'
        ]
      },
      {
        heading: 'The Divine Tools That Make the Quest Possible',
        purpose: 'Show how Perseus survives through borrowed divine help rather than ordinary strength alone.',
        contentLayer: 'existing-story',
        targetWords: { min: 260, max: 420 },
        paragraphs: [
          'Perseus does not defeat Medusa by strength alone. The myth gives him help from the gods and from older figures who know the hidden path. Athena and Hermes guide him, and several versions describe gifts such as winged sandals, a special bag, a curved blade, and the helmet of Hades.',
          'The Graeae are part of this passage. They are often described as ancient sisters who share one eye, and Perseus forces them to reveal the way forward. This moment makes the quest feel like a movement through guarded knowledge. Before he can reach Medusa, Perseus must learn how to reach the place where ordinary sight fails.',
          'The tools matter because they keep the hero from seeming invincible. Perseus survives because he is equipped, guided, and careful. Without help, the story would end before he reached the sleeping Gorgon.'
        ]
      },
      {
        heading: 'The Moment of the Mirrored Shield',
        purpose: 'Tell the central scene of the beheading through the reflective shield and the sleeping Gorgon.',
        contentLayer: 'existing-story',
        targetWords: { min: 260, max: 440 },
        paragraphs: [
          'The central image of the myth is not only the severed head. It is the moment before it. Medusa sleeps, and Perseus approaches without meeting her face. Athena\'s polished shield, or a reflective surface associated with her guidance, lets him see indirectly.',
          'This is the clever heart of the story. Perseus does not deny Medusa\'s power. He works around it. He looks at an image instead of the face itself, turning reflection into survival. The hero wins because he accepts the rule of the danger and changes the way he sees.',
          'When he cuts off Medusa\'s head, the myth adds another strange detail. Pegasus and Chrysaor spring from her neck. The scene is violent, but it also releases new figures into the mythic world. Medusa\'s death is not a simple ending.'
        ]
      },
      {
        heading: 'Why Medusa Remains Powerful After Death',
        purpose: 'Explain the afterlife of Medusa\'s head in the Perseus story.',
        contentLayer: 'existing-story',
        targetWords: { min: 240, max: 400 },
        paragraphs: [
          'Medusa is dead, but her head still works. This is one reason the myth stays memorable. Perseus carries the head in a special bag, and the danger that once threatened him becomes a power he can use.',
          'On the journey back, the head appears in later episodes. Perseus rescues Andromeda from a sea monster, defeats enemies, and returns to Seriphos. When Polydectes and his court threaten him, the head can still turn them to stone.',
          'The ending gives Medusa\'s power to Athena, who places the Gorgon head on her aegis in many traditions and images. The story begins with a deadly face that cannot be looked at directly. It ends with that face turned into a sign of divine protection.'
        ]
      },
      {
        heading: 'How Later Versions Changed Medusa',
        purpose: 'Explain the difference between earlier Gorgon tradition and later sympathetic versions.',
        contentLayer: 'reported-variants',
        targetWords: { min: 240, max: 400 },
        paragraphs: [
          'Not every version of Medusa carries the same emotional weight. Older Greek material often presents her as the mortal Gorgon slain by Perseus. Later retellings, especially the Ovidian tradition, give more attention to how she became monstrous.',
          'In that later account, Medusa had once been beautiful and was transformed after Poseidon violated her in Athena\'s temple. This changes the feeling of the myth. Medusa is no longer only the dangerous figure at the end of a hero\'s quest. She becomes a figure shaped by punishment, divine anger, and a story told from outside her own voice.',
          'Ancient art also changes her. Some images make her grotesque and frontal. Others make her more human, even beautiful. Across those changes, the direct gaze remains the feature that holds the myth together.'
        ]
      },
      {
        heading: 'What the Medusa Myth Still Means',
        purpose: 'Close with the major symbolic readings without flattening the myth into one lesson.',
        contentLayer: 'editorial-interpretation',
        targetWords: { min: 220, max: 360 },
        paragraphs: [
          'The Medusa and Perseus myth may be read in several directions. It is a heroic quest, a story about impossible tasks, and a myth about using intelligence when direct force would fail.',
          'It is also a story about sight. Medusa destroys through the direct look. Perseus survives through reflection. That pattern gives the myth a sharp symbolic shape: sometimes the only way to face terror is not to stare at it head-on, but to change the angle.',
          'Modern readers often return to Medusa herself. Her image can suggest danger, protection, punishment, survival, or a voice trapped inside someone else\'s heroic story. That is why the myth still feels unsettled. Perseus completes the quest, but Medusa remains the figure people keep trying to understand.'
        ]
      }
    ],
    conclusion: {
      paragraphs: [
        'Medusa and Perseus lasts because it does more than stage a monster hunt. It gives the danger a face, then makes that face impossible to meet directly.',
        'Perseus survives by using tools, reflection, and restraint. Medusa dies, but her power does not disappear. It moves into the hero\'s hand, into Athena\'s aegis, into ancient art, and into later interpretations that keep asking what the Gorgon really means.'
      ],
      targetWords: { min: 100, max: 170 }
    },
    faq: [
      {
        q: 'Who is Medusa in Greek mythology?',
        a: 'Medusa is the mortal Gorgon, usually named alongside her sisters Stheno and Euryale. She is best known for her gaze, which can turn those who look directly at her into stone.'
      },
      {
        q: 'How does Perseus kill Medusa?',
        a: 'Perseus kills Medusa with divine help. In the familiar version, he approaches while she sleeps and uses Athena\'s polished shield or reflective guidance so he can see her without looking directly at her face.'
      },
      {
        q: 'What comes from Medusa after she is killed?',
        a: 'Many accounts say Pegasus and Chrysaor spring from Medusa\'s neck after Perseus cuts off her head. This makes the beheading a strange moment of both death and birth inside the myth.'
      },
      {
        q: 'Why does Medusa\'s head still matter after death?',
        a: 'The severed head keeps its petrifying power. Perseus uses it in later episodes, and Athena eventually receives it as a protective sign on her aegis in many traditions and images.'
      },
      {
        q: 'Are all versions of Medusa the same?',
        a: 'No. Earlier and later sources place different emphasis on Medusa. Some focus on her as the mortal Gorgon slain by Perseus, while Ovid gives a later transformation story that makes her origin more tragic.'
      }
    ],
    publicSourceNote: 'Medusa and Perseus is presented through Greek mythological tradition, classical references, and later art-historical summaries. The core quest appears across ancient material: Perseus is sent for Medusa\'s head, receives divine help, avoids the direct gaze, and carries away a power that remains dangerous. Later versions, especially Ovid, shift attention toward Medusa\'s origin and make the story more sympathetic and unsettling.'
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
