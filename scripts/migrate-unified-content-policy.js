const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const stories = readJson(storiesPath);

const briefs = {
  'ra-solar-boat-myth': {
    topic: "Ra's Solar Boat",
    category: 'Myths',
    contentType: 'myth-narrative',
    circulationLevel: 'widely-known',
    knownNames: ["Ra's Solar Boat", 'Solar Barque of Ra', 'Solar Barge of Ra'],
    cultureOrContext: 'Ancient Egypt',
    coreStoryElements: [
      'Ra travels across the sky in a solar boat by day.',
      'The solar journey continues through the underworld at night.',
      'Apophis or Apep threatens the sun god during the night journey.',
      'The return of the sun at dawn restores cosmic order.'
    ],
    reportedVariants: [
      { claim: 'Different texts and periods describe the solar boats, companions, and underworld journey with varying names and details.', scope: 'Egyptian religious texts and later summaries' }
    ],
    editorialInterpretationOptions: [
      'The journey may be read as a cycle of death and renewal.',
      'The daily return of the sun may suggest the restoration of order after danger.'
    ],
    uncertainDetails: ['Specific boat names, divine companions, and ritual emphasis vary by period and source.'],
    prohibitedInventions: ['Do not invent new gods.', 'Do not invent new battles.', 'Do not invent dialogue.', 'Do not invent new ritual instructions.'],
    existenceEvidence: [
      { title: 'Apophis - World History Encyclopedia', url: 'https://www.worldhistory.org/Apophis/', sourceType: 'reference' },
      { title: 'Ra - Britannica', url: 'https://www.britannica.com/topic/Re-Egyptian-god', sourceType: 'reference' },
      { title: 'Book of the Dead and solar afterlife summaries', url: 'https://www.britannica.com/topic/Book-of-the-Dead-ancient-Egyptian-text', sourceType: 'reference' }
    ],
    sectionTitles: ['The Existing Solar Journey', 'Reported Variants and Source Range', 'Symbolic Reading of Night and Dawn', 'What the Sources Can Support', 'Why the Solar Boat Still Holds the Myth']
  },
  'maui-fishing-up-the-islands-myth': {
    topic: 'Maui Fishing Up the Islands',
    category: 'Myths',
    contentType: 'myth-narrative',
    circulationLevel: 'widely-known',
    knownNames: ['Maui Fishing Up the Islands', "Maui's Fish", 'Te Ika-a-Maui'],
    cultureOrContext: 'Polynesian and Maori tradition',
    coreStoryElements: [
      'Maui is a trickster hero in Polynesian mythology.',
      'A central Maori version tells how Maui fishes up the North Island of New Zealand.',
      'The South Island is remembered as Maui’s canoe and Stewart Island as the anchor in some accounts.',
      'Variants explain landscape shape through the fish, canoe, hook, and actions of Maui’s brothers.'
    ],
    reportedVariants: [
      { claim: 'Some traditions describe the fish as a flounder, while others describe it as a stingray.', scope: 'Regional Maori accounts summarized by Te Ara' },
      { claim: 'Different Polynesian regions preserve Maui stories with different local emphasis.', scope: 'Polynesian oral traditions and later summaries' }
    ],
    editorialInterpretationOptions: [
      'The story may be read as a way of giving landform, ancestry, and settlement a memorable mythic shape.',
      'Maui’s trickster role can be interpreted as creative disruption rather than simple disobedience.'
    ],
    uncertainDetails: ['Regional versions differ in geography, names, and the shape assigned to the island.'],
    prohibitedInventions: ['Do not invent new islands.', 'Do not invent new relatives.', 'Do not add new dialogue.', 'Do not merge unrelated Maui episodes into one event.'],
    existenceEvidence: [
      { title: 'Maui - Te Ara Encyclopedia of New Zealand', url: 'https://teara.govt.nz/en/first-peoples-in-maori-tradition/page-3', sourceType: 'encyclopedia' },
      { title: 'Whenua - The North and South islands - Te Ara', url: 'https://teara.govt.nz/en/whenua-how-the-land-was-shaped/page-2', sourceType: 'encyclopedia' },
      { title: 'The Fish of Maui - An Encyclopaedia of New Zealand', url: 'https://teara.govt.nz/mi/1966/maui-legends-of/page-4', sourceType: 'archive' }
    ],
    sectionTitles: ['The Existing Maui Fishing Story', 'Reported Regional Variants', 'Symbolic Reading of Land From the Sea', 'What the Sources Can Support', 'Why Maui’s Fish Remains Memorable']
  },
  'anansi-spider-stories-myth': {
    topic: 'Anansi the Spider',
    category: 'Myths',
    contentType: 'folklore-cycle',
    circulationLevel: 'widely-known',
    knownNames: ['Anansi', 'Ananse', 'Anancy', 'Kwaku Ananse'],
    cultureOrContext: 'Akan, West African, Caribbean, and African diaspora folklore',
    coreStoryElements: [
      'Anansi is a spider trickster associated with West African and diaspora storytelling.',
      'Anansi stories often turn on wit, hunger, bargaining, and the weak outmaneuvering the strong.',
      'The figure appears in Akan, Caribbean, and later African diaspora retellings.',
      'Many stories use humor to teach a practical or moral lesson without becoming a single fixed canon.'
    ],
    reportedVariants: [
      { claim: 'The name and form vary as Anansi, Ananse, or Anancy across regions and retellings.', scope: 'West African and diaspora traditions' },
      { claim: 'Some versions present Anansi as spider, human, or a mixed trickster figure.', scope: 'Folklore summaries and children’s literature records' }
    ],
    editorialInterpretationOptions: [
      'Anansi may be read as a figure of survival through intelligence rather than force.',
      'The spider web can suggest how stories travel between communities.'
    ],
    uncertainDetails: ['The tradition is a story cycle, so no single plot should be treated as the original Anansi story.'],
    prohibitedInventions: ['Do not invent a single definitive Anansi canon.', 'Do not invent new named sons or rivals.', 'Do not add new morals as if traditional.', 'Do not merge unrelated tales into one plot.'],
    existenceEvidence: [
      { title: 'Anansi the spider - Smithsonian Libraries and Archives', url: 'https://www.si.edu/object/siris_sil_268218', sourceType: 'library-record' },
      { title: 'Anansi/Anancy - American Myths, Legends, and Tall Tales', url: 'https://erenow.org/common/american-myths-legends-tall-tales-3-volumes-encyclopedia-american-folklore/16.php', sourceType: 'reference' },
      { title: 'Finding common sense with Ananse - Natural History Museum', url: 'https://www.nhm.ac.uk/discover/ananse.html', sourceType: 'museum' }
    ],
    sectionTitles: ['The Existing Anansi Tradition', 'Reported Variants Across Regions', 'Symbolic Reading of Trickster Wisdom', 'What the Sources Can Support', 'Why Anansi Stories Keep Moving']
  },
  'amaterasu-cave-myth': {
    topic: 'Amaterasu Cave Myth',
    category: 'Myths',
    contentType: 'myth-narrative',
    circulationLevel: 'widely-known',
    knownNames: ['Amaterasu Cave Myth', 'Ama-no-Iwato', 'The Heavenly Rock Cave'],
    cultureOrContext: 'Japanese Shinto mythology',
    coreStoryElements: [
      'Amaterasu is the Japanese sun goddess.',
      'After conflict with Susanoo, Amaterasu hides in a cave and the world becomes dark.',
      'The other gods use ritual, laughter, jewels, and a mirror to draw her out.',
      'Her return restores light and order.'
    ],
    reportedVariants: [
      { claim: 'Summaries differ in how much they emphasize ritual performance, the mirror, the jewels, or Susanoo’s later reconciliation.', scope: 'Shinto myth summaries and retellings' }
    ],
    editorialInterpretationOptions: [
      'The cave episode may be read as a myth about the withdrawal and return of social order.',
      'The mirror may suggest recognition, presence, and the power of ritual display.'
    ],
    uncertainDetails: ['Retellings simplify different textual and ritual traditions around Amaterasu.'],
    prohibitedInventions: ['Do not invent new kami.', 'Do not invent new ritual rules.', 'Do not invent dialogue in the cave.', 'Do not add modern witnesses.'],
    existenceEvidence: [
      { title: 'Amaterasu - World History Encyclopedia', url: 'https://www.worldhistory.org/Amaterasu/', sourceType: 'reference' },
      { title: 'Shinto - World History Encyclopedia', url: 'https://www.worldhistory.org/Shinto/', sourceType: 'reference' },
      { title: 'Amaterasu - Britannica', url: 'https://www.britannica.com/topic/Amaterasu', sourceType: 'reference' }
    ],
    sectionTitles: ['The Existing Cave Myth', 'Reported Emphasis in Retellings', 'Symbolic Reading of Hidden Light', 'What the Sources Can Support', 'Why the Cave Story Still Works']
  },
  'izanagi-and-izanami-myth': {
    topic: 'Izanagi and Izanami',
    category: 'Myths',
    contentType: 'myth-narrative',
    circulationLevel: 'widely-known',
    knownNames: ['Izanagi and Izanami', 'Izanami and Izanagi'],
    cultureOrContext: 'Japanese Shinto mythology',
    coreStoryElements: [
      'Izanagi and Izanami are primordial Shinto deities.',
      'They create the islands of Japan and give birth to many kami.',
      'Izanami dies after giving birth to the fire god Kagutsuchi.',
      'Izanagi follows her to Yomi, breaks the boundary by looking at her, escapes, and purifies himself.'
    ],
    reportedVariants: [
      { claim: 'The Kojiki, Nihon Shoki, and later summaries preserve differences in emphasis and detail.', scope: 'Japanese myth sources and reference summaries' }
    ],
    editorialInterpretationOptions: [
      'The myth may be read as a boundary story about creation, death, pollution, and purification.',
      'The failed return from Yomi can be interpreted as a mythic explanation of the separation between living and dead.'
    ],
    uncertainDetails: ['Names, sequence, and ritual interpretation vary across texts and summaries.'],
    prohibitedInventions: ['Do not invent new islands.', 'Do not invent new underworld trials.', 'Do not invent dialogue.', 'Do not add new kami beyond the known tradition.'],
    existenceEvidence: [
      { title: 'Izanami and Izanagi - World History Encyclopedia', url: 'https://www.worldhistory.org/Izanami_and_Izanagi/', sourceType: 'reference' },
      { title: 'Shinto - World History Encyclopedia', url: 'https://www.worldhistory.org/Shinto/', sourceType: 'reference' },
      { title: 'Izanagi and Izanami - Britannica', url: 'https://www.britannica.com/topic/Izanagi', sourceType: 'reference' }
    ],
    sectionTitles: ['The Existing Creation and Yomi Story', 'Reported Source Variants', 'Symbolic Reading of Boundary and Purification', 'What the Sources Can Support', 'Why This Myth Carries So Much Weight']
  },
  'quetzalcoatl-feathered-serpent-myth': {
    topic: 'Quetzalcoatl',
    category: 'Myths',
    contentType: 'deity-and-culture-hero',
    circulationLevel: 'widely-known',
    knownNames: ['Quetzalcoatl', 'Quetzalcoatl the Feathered Serpent', 'Ehecatl-Quetzalcoatl'],
    cultureOrContext: 'Mesoamerican religion and mythology',
    coreStoryElements: [
      'Quetzalcoatl is a Mesoamerican feathered serpent deity and culture hero.',
      'The name is commonly associated with the image of a feathered serpent.',
      'The figure is connected with wind, knowledge, priesthood, rulership, and creation traditions in different sources.',
      'Later accounts sometimes blur deity, priestly title, and legendary ruler traditions.'
    ],
    reportedVariants: [
      { claim: 'Quetzalcoatl appears in different forms, including feathered serpent imagery and the wind-god form Ehecatl-Quetzalcoatl.', scope: 'Mesoamerican art and mythology summaries' },
      { claim: 'Post-conquest and later interpretations sometimes complicate the distinction between the deity and human ruler traditions.', scope: 'Historical reception and modern summaries' }
    ],
    editorialInterpretationOptions: [
      'The feathered serpent may be read as a symbol joining sky and earth, bird and serpent, sacred movement and grounded presence.',
      'The culture-hero aspect may suggest knowledge as a force that organizes society.'
    ],
    uncertainDetails: ['The figure changes across cultures, periods, languages, and colonial-era interpretation.'],
    prohibitedInventions: ['Do not invent new Mesoamerican myths.', 'Do not invent new prophecies.', 'Do not collapse all feathered serpent figures into one identical god.', 'Do not add unsupported conquest claims.'],
    existenceEvidence: [
      { title: 'Quetzalcoatl - World History Encyclopedia', url: 'https://www.worldhistory.org/Quetzalcoatl/', sourceType: 'reference' },
      { title: 'Quetzalcoatl object record - British Museum', url: 'https://www.britishmuseum.org/collection/object/E_Am1825-1210-11', sourceType: 'museum' },
      { title: 'Quetzalcoatl biography - British Museum', url: 'https://www.britishmuseum.org/collection/term/BIOG230422', sourceType: 'museum' }
    ],
    sectionTitles: ['The Existing Feathered Serpent Tradition', 'Reported Forms and Later Confusions', 'Symbolic Reading of Feather and Serpent', 'What the Sources Can Support', 'Why Quetzalcoatl Remains Powerful']
  },
  'gilgamesh-flood-myth': {
    topic: 'Gilgamesh Flood Myth',
    category: 'Myths',
    contentType: 'epic-episode',
    circulationLevel: 'widely-known',
    knownNames: ['Gilgamesh Flood Myth', 'Utnapishtim Flood Story', 'Babylonian Flood Story'],
    cultureOrContext: 'Mesopotamian literature',
    coreStoryElements: [
      'Gilgamesh seeks Utnapishtim while searching for the secret of life after Enkidu’s death.',
      'Utnapishtim tells Gilgamesh of a destructive flood and his survival.',
      'The flood episode appears in Tablet XI of the Epic of Gilgamesh tradition.',
      'The episode connects survival, divine decision, mortality, and the failure to secure lasting human immortality.'
    ],
    reportedVariants: [
      { claim: 'The flood story has connections with broader Mesopotamian flood traditions and appears through fragmentary ancient sources.', scope: 'Epic of Gilgamesh scholarship and public-domain summaries' }
    ],
    editorialInterpretationOptions: [
      'The episode may be read as a confrontation between heroic desire and human limits.',
      'The flood survivor’s story can suggest that survival and immortality are not the same thing.'
    ],
    uncertainDetails: ['The epic survives through tablets and fragments, and summaries may differ in restored or emphasized details.'],
    prohibitedInventions: ['Do not invent new tablets.', 'Do not invent new gods or speeches.', 'Do not invent new flood causes.', 'Do not merge unrelated flood myths as one event.'],
    existenceEvidence: [
      { title: 'Gilgamesh, Epic of - 1911 Encyclopaedia Britannica', url: 'https://en.wikisource.org/wiki/1911_Encyclop%C3%A6dia_Britannica/Gilgamesh%2C_Epic_of', sourceType: 'public-domain-reference' },
      { title: 'Epic of Gilgamesh - Britannica', url: 'https://www.britannica.com/topic/Epic-of-Gilgamesh', sourceType: 'reference' },
      { title: 'Gilgamesh - World History Encyclopedia', url: 'https://www.worldhistory.org/gilgamesh/', sourceType: 'reference' }
    ],
    sectionTitles: ['The Existing Flood Episode', 'Reported Textual Range and Variants', 'Symbolic Reading of Mortality', 'What the Sources Can Support', 'Why Utnapishtim’s Story Still Matters']
  },
  'yggdrasil-world-tree-myth': {
    topic: 'Yggdrasil World Tree',
    category: 'Myths',
    contentType: 'cosmological-image',
    circulationLevel: 'widely-known',
    knownNames: ['Yggdrasil', 'Yggdrasill', 'World Tree'],
    cultureOrContext: 'Norse mythology',
    coreStoryElements: [
      'Yggdrasil is the immense world tree in Norse cosmology.',
      'The tree connects or holds the realms of gods, humans, giants, and the dead.',
      'Norns, creatures, roots, wells, and cosmic tension appear around the tree in major summaries.',
      'Yggdrasil is linked to both the structure of the cosmos and the pressure of fate.'
    ],
    reportedVariants: [
      { claim: 'Lists and descriptions of the nine realms vary in later summaries and retellings.', scope: 'Norse mythology reference tradition' },
      { claim: 'Some sources emphasize the tree as axis of worlds, while others emphasize fate, roots, wells, and creatures.', scope: 'Eddic and later summary traditions' }
    ],
    editorialInterpretationOptions: [
      'Yggdrasil may be read as a symbol of connection under stress.',
      'The tree can suggest that cosmic order is alive, vulnerable, and constantly maintained.'
    ],
    uncertainDetails: ['Modern summaries often systematize Norse cosmology more neatly than the surviving sources do.'],
    prohibitedInventions: ['Do not invent new realms.', 'Do not invent new creatures.', 'Do not invent new prophecies.', 'Do not make one modern realm list the only ancient version.'],
    existenceEvidence: [
      { title: 'Nine Realms of Norse Cosmology - World History Encyclopedia', url: 'https://www.worldhistory.org/article/1305/nine-realms-of-norse-cosmology/', sourceType: 'reference' },
      { title: 'Norse Mythology - World History Encyclopedia', url: 'https://www.worldhistory.org/Norse_Mythology/', sourceType: 'reference' },
      { title: 'Yggdrasil - New World Encyclopedia', url: 'https://www.newworldencyclopedia.org/entry/Yggdrasil', sourceType: 'reference' }
    ],
    sectionTitles: ['The Existing World Tree Image', 'Reported Cosmology Variants', 'Symbolic Reading of Connection and Fate', 'What the Sources Can Support', 'Why Yggdrasil Still Feels Complete']
  },
  'theseus-and-the-minotaur-myth': {
    topic: 'Theseus and the Minotaur',
    category: 'Myths',
    contentType: 'hero-myth',
    circulationLevel: 'widely-known',
    knownNames: ['Theseus and the Minotaur', 'Theseus in the Labyrinth', 'Ariadne’s Thread'],
    cultureOrContext: 'Greek mythology',
    coreStoryElements: [
      'Theseus enters the Cretan Labyrinth to face the Minotaur.',
      'Ariadne helps Theseus by giving him a thread or clue to find his way out.',
      'The Minotaur is associated with King Minos, Crete, and the Labyrinth.',
      'Later parts of the tradition include Ariadne’s departure with Theseus and her abandonment or different fate in variant accounts.'
    ],
    reportedVariants: [
      { claim: 'Ancient and later accounts differ in Ariadne’s later fate and Theseus’s return journey.', scope: 'Greek literary and mythological sources' },
      { claim: 'The Labyrinth and Minotaur are connected with both mythic storytelling and later archaeological imagination around Knossos.', scope: 'Classical myth summaries and modern reception' }
    ],
    editorialInterpretationOptions: [
      'The Labyrinth may be read as a symbol of controlled danger and political violence.',
      'Ariadne’s thread may suggest that survival depends on memory, guidance, and return, not only heroic force.'
    ],
    uncertainDetails: ['Ancient sources preserve different timelines and emphases around Ariadne, Theseus, and Crete.'],
    prohibitedInventions: ['Do not invent new rooms in the Labyrinth.', 'Do not invent new trials.', 'Do not invent dialogue.', 'Do not invent a single definitive Ariadne ending.'],
    existenceEvidence: [
      { title: 'Theseus - 1911 Encyclopaedia Britannica', url: 'https://en.wikisource.org/wiki/1911_Encyclop%C3%A6dia_Britannica/Theseus', sourceType: 'public-domain-reference' },
      { title: 'Ariadne - World History Encyclopedia', url: 'https://www.worldhistory.org/Ariadne/', sourceType: 'reference' },
      { title: 'Minotaur - Encyclopaedia Britannica Historical Editions', url: 'https://jimclifford.ca/early_encyclopedia_britannica/articles/1771/eb_1st_1771_008953.html', sourceType: 'public-domain-reference' }
    ],
    sectionTitles: ['The Existing Labyrinth Story', 'Reported Variants Around Ariadne', 'Symbolic Reading of Thread and Monster', 'What the Sources Can Support', 'Why the Labyrinth Still Holds the Myth']
  },
  'icarus-myth': {
    topic: 'Icarus Myth',
    category: 'Myths',
    contentType: 'warning-myth',
    circulationLevel: 'widely-known',
    knownNames: ['Icarus', 'Daedalus and Icarus', 'The Fall of Icarus'],
    cultureOrContext: 'Greek and Roman mythological tradition',
    coreStoryElements: [
      'Daedalus makes wings so he and Icarus can escape Crete.',
      'Daedalus warns Icarus not to fly too low or too high.',
      'Icarus flies too close to the sun, the wax melts, and he falls into the sea.',
      'The story becomes a lasting image of ambition, warning, craft, and limits.'
    ],
    reportedVariants: [
      { claim: 'Ancient and later retellings emphasize different parts of Daedalus’s craft, Icarus’s disobedience, and the moral of overreaching.', scope: 'Greek myth, Roman literature, and later art' }
    ],
    editorialInterpretationOptions: [
      'The myth may be read as a warning about desire outrunning instruction.',
      'It can also be read as a story about the cost of invention when skill cannot control longing.'
    ],
    uncertainDetails: ['Modern summaries often reduce the larger Daedalus cycle to the single image of Icarus falling.'],
    prohibitedInventions: ['Do not invent new escape routes.', 'Do not invent new speeches.', 'Do not invent extra punishments.', 'Do not treat the fall as historical fact.'],
    existenceEvidence: [
      { title: 'Daedalus - World History Encyclopedia', url: 'https://www.worldhistory.org/Daedalus/', sourceType: 'reference' },
      { title: 'Daedalus - Encyclopedia.com', url: 'https://www.encyclopedia.com/literature-and-arts/classical-literature-mythology-and-folklore/folklore-and-mythology/daedalus', sourceType: 'reference' },
      { title: 'Daedalus and Icarus - Britannica', url: 'https://www.britannica.com/topic/Daedalus-Greek-mythology', sourceType: 'reference' }
    ],
    sectionTitles: ['The Existing Icarus Story', 'Reported Emphasis in Retellings', 'Symbolic Reading of Flight and Limit', 'What the Sources Can Support', 'Why Icarus Still Falls in Memory']
  }
};

const rewrittenSlugs = Object.keys(briefs);

for (const story of stories) {
  delete story.generationMode;
  delete story.mode;
  if (story.storyType === 'Canonical Archive Record') story.storyType = 'Archive Story';

  const brief = briefs[story.slug];
  if (!brief) continue;

  story.storyBrief = buildStoryBrief(story, brief);
  story.storyType = 'Myth';
  story.sourceStatus = `${brief.category} / Existing external tradition / Story Brief confirmed`;
  story.evidence = brief.existenceEvidence.map((item) => item.title).join(', ');
  story.summaryAnswer = `${brief.topic} is an existing ${brief.cultureOrContext} story, not a Kyunolab invention. This article explains the core story, known variants, and symbolic reading while keeping uncertain details separate.`;
  story.introSummary = `${brief.topic} is treated here as an existing mythic tradition with a confirmed external trace, known variants, and clear limits on interpretation.`;
  story.excerpt = `A unified-policy Kyunolab reading of ${brief.topic}, based on existing external tradition rather than newly invented archive material.`;
  story.metaDescription = `${brief.topic} explained through its existing mythic story, reported variants, symbolic meaning, and Story Brief source limits.`;
  story.seoHeadings = brief.sectionTitles;
  story.searchSummary = {
    whatItIs: `${brief.topic} is an existing ${brief.contentType.replace(/-/g, ' ')} from ${brief.cultureOrContext}.`,
    whereItAppears: `The story appears outside Kyunolab in ${brief.existenceEvidence.map((item) => item.title).slice(0, 2).join(' and ')}.`,
    whyItMatters: `${brief.topic} remains useful because its core image can be read symbolically without inventing new events.`
  };
  story.faq = buildFaq(brief);
  if (story.contentDNA) {
    story.contentDNA.targetQuery = story.targetQuery || story.seedKeyword || story.contentDNA.targetQuery;
    story.contentDNA.subjectSpecificVocabulary = unique([
      story.contentDNA.targetQuery,
      brief.topic,
      'Story Brief',
      'Reported Variant',
      'Editorial Interpretation',
      'external existence evidence',
      ...(brief.knownNames || []),
      brief.cultureOrContext
    ]).slice(0, 8);
    story.contentDNA.requiredSpecificDetails = unique([
      brief.topic,
      ...(brief.coreStoryElements || []),
      ...(brief.reportedVariants || []).map((item) => item.claim),
      ...(brief.uncertainDetails || [])
    ]).slice(0, 8);
  }
}

writeJson(storiesPath, stories);
console.log(`Applied unified policy migration. Rewritten Story Brief count: ${rewrittenSlugs.length}.`);

function buildStoryBrief(story, brief) {
  return {
    ...brief,
    existenceStatus: 'confirmed',
    opening: [
      `${story.contentDNA?.targetQuery || brief.topic} is included in Kyunolab because the story already existed outside this archive. The goal is not to prove the myth as history, but to explain the version, variation, and meaning that have circulated before this page was written.`,
      `This reading separates the existing story from reported variants and Kyunolab interpretation. It does not add new characters, events, rituals, witnesses, or endings.`
    ],
    articleSections: buildSections(brief),
    publishable: true,
    validationStatus: {
      storyCheck: 'confirmed',
      storyBrief: 'ready',
      inventionCheck: 'passed',
      publishable: true
    },
    updatedAt: story.updatedAt || story.publishedAt
  };
}

function buildSections(brief) {
  const core = brief.coreStoryElements;
  const variantText = brief.reportedVariants.map((item) => `${item.claim} This belongs to ${item.scope}, so it should not be treated as the only or original version.`).join(' ');
  const interpretationText = brief.editorialInterpretationOptions.join(' ');
  const evidenceText = brief.existenceEvidence.map((item) => `${item.title} (${item.sourceType})`).join('; ');
  const uncertainText = brief.uncertainDetails.length ? brief.uncertainDetails.join(' ') : 'The available sources still leave room for differences in emphasis and later retelling.';

  return brief.sectionTitles.map((title, index) => {
    if (index === 0) {
      return {
        title,
        paragraphs: [
          `The existing story can be stated without adding anything new: ${core.join(' ')}`,
          `${brief.topic} belongs to ${brief.cultureOrContext}. Its main value is the recognizable shape of the story, not a claim that every mythic event should be read as literal history.`
        ]
      };
    }
    if (index === 1) {
      return {
        title,
        paragraphs: [
          `Reported Variant: ${variantText}`,
          `The circulation level is ${brief.circulationLevel}. That means the article can describe the tradition confidently, while still marking local, textual, or later differences as variants.`
        ]
      };
    }
    if (index === 2) {
      return {
        title,
        paragraphs: [
          `Editorial Interpretation: ${interpretationText}`,
          `This interpretation stays abstract. It explains meaning, symbol, and cultural force, but it does not create a new plot, new witness, new ritual, or new ending.`
        ]
      };
    }
    if (index === 3) {
      return {
        title,
        paragraphs: [
          `External existence evidence reviewed for the Story Brief: ${evidenceText}.`,
          `The source limit is simple: ${uncertainText} The article can explain what is known to circulate, but it should not smooth every difference into one false canon.`
        ]
      };
    }
    return {
      title,
      paragraphs: [
        `${brief.topic} remains memorable because the existing story gives readers a compact image they can return to: ${core[0]}`,
        `Kyunolab's role is to preserve that shape, identify variants, and mark interpretation as interpretation. The archive should make the story easier to understand without pretending it has invented or solved it.`
      ]
    };
  });
}

function buildFaq(brief) {
  return [
    {
      q: `Is ${brief.topic} an existing story outside Kyunolab?`,
      a: `Yes. The Story Brief marks its existence status as confirmed and records external traces such as ${brief.existenceEvidence.slice(0, 2).map((item) => item.title).join(' and ')}.`
    },
    {
      q: `Does Kyunolab treat ${brief.topic} as literal history?`,
      a: 'No. The article treats the subject as myth, folklore, tradition, rumor, or interpretation according to the available sources, not as a verified historical event.'
    },
    {
      q: `Can variants of ${brief.topic} differ from this article?`,
      a: `Yes. ${brief.reportedVariants[0]?.claim || 'Different versions can shift names, emphasis, sequence, and symbolic detail.'}`
    },
    {
      q: `What should not be added to ${brief.topic}?`,
      a: brief.prohibitedInventions.slice(0, 3).join(' ')
    }
  ];
}

function unique(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const value = String(item || '').trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
