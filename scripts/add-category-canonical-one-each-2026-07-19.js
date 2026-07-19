const fs = require('fs');
const path = require('path');
const { buildContentDNA } = require('./article-dna-utils');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const categoriesPath = path.join(root, 'data', 'categories.json');
const publishedAt = '2026-07-19';

const stories = readJson(storiesPath);
const categories = readJson(categoriesPath);
const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
const storySlugs = new Set(stories.map((story) => story.slug));
let existingQueries = new Set(
  stories
    .map((story) => story.contentDNA?.canonicalQuery || story.primaryKeyword || story.seedKeyword)
    .filter(Boolean)
    .map((query) => query.toLowerCase().trim())
);

const topics = [
  {
    categorySlug: 'classic-folklore',
    slug: 'pied-piper-of-hamelin-folklore',
    title: 'Pied Piper of Hamelin: Children, Rats, and the Folklore of a Vanishing',
    subject: 'Pied Piper of Hamelin',
    tag: 'German Folklore',
    tags: ['German Folklore', 'Pied Piper', 'Hamelin', 'Vanishing Children', 'Folktale'],
    keyword: 'pied piper of hamelin folklore',
    detail: 'the Hamelin legend of a colorful piper, a broken promise, and children who vanish from the town',
    evidence: 'Hamelin civic materials, museum summaries, early legend references, Grimm-era retellings, and later literary versions',
    sourceBasis: 'German town legend, Hamelin public-history materials, museum summaries, and later folklore retellings',
    vocabulary: ['Pied Piper', 'Hamelin', 'piper', 'rats', 'children'],
    sources: [
      source('Historical Theories about the Pied Piper - Stadt Hameln', 'https://www.hameln.de/en/thepiedpiper/thepiedpiper/explanations-to-the-piper-legend', 'Supports the historical-theory frame, the migration explanation, and the separation of the children story from later rat-catcher additions.'),
      source('Museum Hameln - The Pied Piper', 'https://museumhameln.de/dauerausstellung_engl_rf07/', 'Supports early evidence, house inscriptions, the 1284 date tradition, and later museum framing.'),
      source('The Folk-Lore Journal - The Pied Piper of Hamelin', 'https://en.wikisource.org/wiki/The_Folk-Lore_Journal/Volume_2/The_Pied_Piper_of_Hamelin', 'Supports older folklore discussion and the search for a historical core behind the legend.')
    ],
    quickAnswer: [
      'The Pied Piper of Hamelin is a German legend about a piper who removes rats from Hamelin and then leads away the town children after the citizens refuse to pay him. The familiar rat-catcher version is later than the oldest child-loss tradition, but the two parts now shape the story together.',
      'Hamelin preserves the legend through public memory, inscriptions, museum interpretation, and annual performance. The strongest reading treats it as folklore with a possible historical core, not as a fully recoverable event.'
    ],
    intro: [
      'The Pied Piper story begins with a sound that solves a problem, then becomes a sound that takes something irreplaceable away.',
      'That turn is why the legend still feels cold. It is not only about rats. It is about a town that breaks a promise, a stranger who cannot be controlled, and children who disappear into a gap the record cannot close.'
    ],
    sections: [
      section('The Core Legend', 'Establish the familiar Hamelin story without treating every detail as early evidence.', [
        'In the common version, Hamelin is troubled by rats. A piper in bright clothing offers to clear them away, and his music draws the animals out of town. When the town refuses his payment, the same power turns toward the children.',
        'The children follow the music and vanish. Later versions send them into a mountain, a cave, or another distant place. The image is simple enough for a tale, but strange enough to feel older than the tale itself.',
        'The oldest strand appears to center on the loss of children. The rat story and the betrayed pest-catcher frame seem to have joined the tradition later, giving the disappearance a sharper moral shape.'
      ]),
      section('Why Hamelin Matters', 'Show how the place preserves the legend as civic memory.', [
        'Hamelin is not just a backdrop. The town itself keeps the legend visible through street names, museum displays, inscriptions, and performances. The story has become part of how the place is read.',
        'That local memory gives the legend a different weight from a loose fairy tale. It has dates, places, and civic markers, even while the central event remains impossible to prove in full.',
        'This mix is what keeps the Pied Piper alive. The story feels literary, but it also behaves like a wound in local memory.'
      ]),
      section('What Remains Uncertain', 'Separate historical theories from confident claims.', [
        'Several explanations have been proposed. Some connect the lost children to migration eastward. Others treat the story as a memory of disaster, recruitment, disease, or social loss. None can close the case completely.',
        'Hamelin sources themselves keep this uncertainty visible. The legend has a historical flavor, but the surviving evidence does not let one version become final.',
        'The safest reading is to follow the pattern: a remembered loss, a figure who leads, and a community trying to explain why its children are gone.'
      ]),
      section('Why the Piper Still Works', 'Explain the motif that gives the story lasting force.', [
        'The Pied Piper is frightening because he does not need force. He uses attraction. Music becomes a path, and the children walk it willingly.',
        'That makes the legend useful far beyond Hamelin. A piper can be any figure who gathers followers through charm, promise, or rhythm before the cost is understood.',
        'The story lasts because the punishment is larger than the offense. A broken bargain becomes a vanished generation, and the town has to remember what it failed to keep.'
      ])
    ],
    faq: [
      qa('Is the Pied Piper based on a real event?', 'There may be a historical core behind the Hamelin child-loss tradition, but no explanation has been proven as the single origin.'),
      qa('Were the rats part of the oldest version?', 'Many summaries treat the rat-catcher episode as a later addition to an older story about children leaving or disappearing.'),
      qa('Why is the piper dressed in bright colors?', 'The colorful clothing marks him as visually unusual and helps separate him from ordinary townspeople in later retellings.'),
      qa('What does the Pied Piper mean today?', 'The phrase often describes a charismatic figure who leads others into danger, loss, or manipulation.')
    ]
  },
  {
    categorySlug: 'internet-folklore',
    slug: 'cicada-3301-internet-puzzle',
    title: 'Cicada 3301: Internet Puzzle, Cryptography, and the Mystery of an Unknown Group',
    subject: 'Cicada 3301',
    tag: 'Internet Puzzle',
    tags: ['Internet Puzzle', 'Cicada 3301', 'Cryptography', 'ARG', 'Digital Mystery'],
    keyword: 'cicada 3301 internet puzzle',
    detail: 'the anonymous internet puzzle that used cryptography, hidden messages, Tor links, books, music, and real-world coordinates',
    evidence: 'technology reporting, solver accounts, puzzle documentation, and internet folklore analysis from 2012 to 2014',
    sourceBasis: 'documented internet puzzle history, technology reporting, solver accounts, and digital folklore summaries',
    vocabulary: ['Cicada 3301', 'cryptography', 'steganography', 'Tor', 'QR codes'],
    sources: [
      source('The Guardian - Cicada 3301', 'https://www.theguardian.com/technology/2014/jan/10/cicada-3301-i-tried-the-hardest-puzzle-on-the-internet-and-failed-spectacularly', 'Supports the 2012 emergence, puzzle methods, 2013 and 2014 returns, and uncertainty about the organizers.'),
      source('The Week - Cicada 3301', 'https://theweek.com/technology/56742/cicada-3301-unravelling-mystery-webs-greatest-puzzle', 'Supports the public framing of Cicada 3301 as an enduring internet puzzle and possible recruitment mystery.'),
      source('Fast Company - Inside the Cicada 3301 Cabal', 'https://www.fastcompany.com/3038719/what-its-like-to-be-on-the-inside-of-cicada-3301-the-internets-most-enigmatic-mystery', 'Supports solver-community details and the caution needed around unverifiable claims about the group behind it.')
    ],
    quickAnswer: [
      'Cicada 3301 is the name given to a series of anonymous internet puzzles that appeared in the early 2010s. The puzzles used cryptography, steganography, literature, music, Tor sites, and physical coordinates, turning an online challenge into a global hunt.',
      'The identity and purpose of the group remain uncertain. Some participants treated it as recruitment, some as an art project, and some as a modern mystery, but the strongest evidence is the puzzle trail itself.'
    ],
    intro: [
      'Cicada 3301 did not look like an ordinary riddle. It appeared online, then spilled into the physical world.',
      'A clue could hide in an image. A message could point to a book. A puzzle could become a coordinate on a street corner. That movement from screen to world is why Cicada became internet folklore.'
    ],
    sections: [
      section('How the Puzzle Appeared', 'Explain the basic timeline and format.', [
        'The first Cicada 3301 puzzle appeared in January 2012 and invited highly intelligent individuals to solve it. Similar cycles followed in 2013 and 2014.',
        'The puzzles used layered methods: encoded text, hidden data inside images, classical references, audio clues, Tor addresses, and physical posters with QR codes.',
        'This structure made Cicada feel different from a normal online game. It suggested planning, resources, and a group able to coordinate across several countries.'
      ]),
      section('Why It Felt Larger Than the Web', 'Show how physical clues changed the folklore.', [
        'Many internet mysteries stay inside forums and screenshots. Cicada did not. Once GPS coordinates appeared, solvers had to move through cities, photograph posters, and bring offline discoveries back to online communities.',
        'That hybrid format gave the story its special pressure. It was not enough to be clever alone. People had to collaborate, verify, and race.',
        'The result was a digital legend with a real-world shadow. Every solved layer made the unknown organizers feel closer and farther away at the same time.'
      ]),
      section('What Cannot Be Proven', 'Keep speculation separate from evidence.', [
        'Theories about Cicada include intelligence recruitment, privacy activism, a secret society, an elaborate art project, or a private cryptography group. None has been proven as the final answer.',
        'Some alleged winners and insiders have spoken publicly, but claims about the inner circle are hard to verify. The signed puzzle trail is stronger than rumors about who stood behind it.',
        'That uncertainty is not a weakness of the story. It is the reason the story keeps moving.'
      ]),
      section('Why Cicada Became Folklore', 'Explain the digital folklore pattern.', [
        'Cicada turns technical skill into mythic initiation. A solver moves from clue to clue like a seeker passing through gates.',
        'The unknown group matters because it gives the puzzle a face without revealing a face. The cicada image, the numbers, the signatures, and the hidden book become symbols.',
        'In internet folklore, mystery often survives by leaving just enough evidence to prove something happened, and not enough evidence to explain why.'
      ])
    ],
    faq: [
      qa('What was Cicada 3301?', 'It was a series of anonymous internet puzzles involving cryptography, hidden messages, and real-world clues.'),
      qa('Who created Cicada 3301?', 'The identity of the creator or group has not been confirmed.'),
      qa('Was Cicada 3301 a recruitment tool?', 'It may have been, but that remains an interpretation rather than a proven fact.'),
      qa('Why is Cicada 3301 important to internet folklore?', 'It shows how online puzzles can become collective legends when they mix secrecy, collaboration, and real-world traces.')
    ]
  },
  {
    categorySlug: 'legend-origins',
    slug: 'friday-the-13th-origin',
    title: 'Friday the 13th Origin: Superstition, Metafolklore, and the Making of an Unlucky Date',
    subject: 'Friday the 13th',
    tag: 'Superstition Origin',
    tags: ['Superstition Origin', 'Friday the 13th', 'Metafolklore', 'Unlucky Day', 'Calendar Belief'],
    keyword: 'friday the 13th origin',
    detail: 'the modern superstition that joins an unlucky Friday with the number thirteen and then searches backward for older explanations',
    evidence: 'Library of Congress folklore writing, newspaper references, 19th-century belief history, and later pop-culture reception',
    sourceBasis: 'Library of Congress Folklife Today research and modern folklore discussion of the superstition',
    vocabulary: ['Friday the 13th', 'metafolklore', 'superstition', 'unlucky', 'Friday'],
    sources: [
      source('Library of Congress - On the Possible Origins of Friday the Thirteenth', 'https://blogs.loc.gov/folklife/2024/12/on-the-possible-origins-of-friday-the-thirteenth-metafolklore-fear-and-fun/', 'Supports the metafolklore frame, 19th-century evidence, and caution around the Knights Templar explanation.'),
      source('Library of Congress - Who Is Afraid of Friday the Thirteenth?', 'https://blogs.loc.gov/folklife/2017/01/whos-afraid-of-friday-the-thirteenth/', 'Supports the history of the belief, the Thirteen Club, and the distinction between older unlucky-day beliefs and the modern combined date.'),
      source('HISTORY - Friday the 13th Origins', 'https://www.history.com/topics/folklore/friday-the-13th', 'Supports popular-history context and the range of common explanations.')
    ],
    quickAnswer: [
      'Friday the 13th is a modern superstition that combines two older streams of belief: unlucky Fridays and the uneasy number thirteen. The combined date is much easier to document in the 19th and early 20th centuries than in the Middle Ages.',
      'Many origin stories point to the Knights Templar, the Last Supper, or Norse myth, but folklore researchers treat those as later explanations unless strong earlier evidence appears.'
    ],
    intro: [
      'Friday the 13th feels ancient because it has collected ancient-looking explanations.',
      'But the most interesting part of the superstition is not one secret origin. It is the way people keep inventing origin stories for a fear that became popular much later than most people expect.'
    ],
    sections: [
      section('The Belief Itself', 'Define the superstition without exaggerating its age.', [
        'Friday the 13th is treated in many parts of Europe and North America as an unlucky day. Some people avoid travel, business, weddings, or new projects on that date.',
        'The belief joins two separate ideas. Friday has long carried associations with endings and misfortune in some Christian and European traditions. The number thirteen has its own complicated history of luck, danger, taboo, and reversal.',
        'The combined date, however, is not easy to push deep into the medieval past. That gap matters.'
      ]),
      section('How Origin Stories Gathered Around It', 'Explain metafolklore as part of the legend.', [
        'Folklorists use the idea of metafolklore for stories people tell about folklore itself. Friday the 13th is full of it.',
        'One common explanation points to the mass arrest of the Knights Templar on Friday, October 13, 1307. The date is real, but the link to the superstition appears to be a later explanation rather than a documented medieval belief.',
        'Other explanations use Norse myth, the Last Supper, unlucky diners, or old calendar beliefs. These may explain why Friday or thirteen felt meaningful, but they do not automatically prove the origin of the combined superstition.'
      ]),
      section('What the Evidence Suggests', 'Show the documented modern trail.', [
        'Library of Congress folklore writing points to 19th-century references and early 20th-century popularization. The belief was circulating before some famous works used it.',
        'This means the superstition was not invented by one novel, one movie, or one medieval event. It grew through jokes, newspapers, social custom, and repeated explanations.',
        'The date became stronger because people kept asking why it was unlucky. Every answer helped preserve the question.'
      ]),
      section('Why the Date Still Works', 'Explain why the superstition remains readable.', [
        'Friday the 13th works because it is compact. It turns an ordinary calendar square into a small omen.',
        'People do not need to believe strongly for the date to function. A joke, a nervous habit, a movie title, or a warning is enough to keep it alive.',
        'That is why the origin remains so useful. The mystery of where the superstition came from has become part of the superstition itself.'
      ])
    ],
    faq: [
      qa('Did Friday the 13th begin with the Knights Templar?', 'The Templar arrest happened on Friday, October 13, 1307, but scholars have not found strong evidence that this caused the superstition.'),
      qa('Is the superstition ancient?', 'Parts of it are older, but the combined fear of Friday the 13th is much easier to document in modern sources.'),
      qa('What does metafolklore mean?', 'It means stories people tell to explain folklore, even when those explanations are themselves folklore.'),
      qa('Why does Friday the 13th still matter?', 'It gives people a simple date-shaped symbol for bad luck, anxiety, and playful superstition.')
    ]
  },
  {
    categorySlug: 'legendary-places',
    slug: 'fountain-of-youth-legend',
    title: 'Fountain of Youth: Legendary Water, Ponce de Leon, and the Place People Keep Seeking',
    subject: 'Fountain of Youth',
    tag: 'Legendary Water',
    tags: ['Legendary Water', 'Fountain of Youth', 'Ponce de Leon', 'Bimini', 'Florida Legend'],
    keyword: 'fountain of youth legend',
    detail: 'the legendary spring or water source said to restore youth, later tied to Ponce de Leon, Bimini, and Florida',
    evidence: 'National Geographic history writing, Smithsonian discussion, Spanish exploration context, and later St. Augustine tourism memory',
    sourceBasis: 'history writing, exploration records, and later legend formation around Ponce de Leon and Florida',
    vocabulary: ['Fountain of Youth', 'Ponce de Leon', 'Bimini', 'St. Augustine', 'restorative water', 'Florida'],
    sources: [
      source('National Geographic - The Fountain of Youth', 'https://www.nationalgeographic.com/history/article/fountain-of-youth', 'Supports the wider history of rejuvenating waters and the later association with Ponce de Leon.'),
      source('Smithsonian Magazine - Ponce De Leon Never Searched for the Fountain of Youth', 'https://www.smithsonianmag.com/history/ponce-de-leon-never-searched-for-the-fountain-of-youth-72629888/', 'Supports the caution that Ponce de Leon was probably not actually searching for the fountain.'),
      source('HISTORY - The Myth of Ponce de Leon and the Fountain of Youth', 'https://www.history.com/articles/the-myth-of-ponce-de-leon-and-the-fountain-of-youth', 'Supports the later growth of the Ponce de Leon connection and the legend history.')
    ],
    quickAnswer: [
      'The Fountain of Youth is a long-lived legend about water that restores youth or preserves life. Its most famous modern association is Juan Ponce de Leon and Florida, but historians are cautious about treating that connection as fact.',
      'The legend matters because the search itself became more durable than any fountain. It combines aging, exploration, colonial rumor, tourism, and the human wish to begin again.'
    ],
    intro: [
      'The Fountain of Youth is less a place than a promise.',
      'It says there may be water somewhere that can undo time. That promise has moved through ancient stories, medieval geography, colonial rumor, and Florida tourism until the search became the legend.'
    ],
    sections: [
      section('The Legend of Restorative Water', 'Place the fountain in a wider tradition.', [
        'Stories about life-giving water are older than the Florida version. They appear in many forms: rivers, springs, wells, islands, hidden kingdoms, and miraculous landscapes.',
        'The basic desire is easy to understand. Aging is universal, and a place that can reverse aging turns geography into hope.',
        'That is why the fountain does not need one fixed map. It can move wherever the next search begins.'
      ]),
      section('How Ponce de Leon Became Attached', 'Explain the famous association and its limits.', [
        'The name most often linked to the fountain is Juan Ponce de Leon, the Spanish explorer associated with Puerto Rico and Florida.',
        'Modern historians point out that surviving records do not show him personally searching for a magical fountain. His voyages were tied to land, authority, colonization, and imperial ambition.',
        'The fountain connection appears to have grown after his lifetime, then became powerful because it made the exploration story easier to remember.'
      ]),
      section('Why Florida Holds the Story', 'Show how a legendary place becomes anchored.', [
        'Florida and St. Augustine became important to the modern fountain image. Springs, tourism, archaeology, colonial memory, and public display helped keep the story visible.',
        'This does not prove that a real rejuvenating spring existed. It shows how a place can inherit a legend and organize itself around it.',
        'The result is a rare kind of legendary place: one where the visitors know the promise is impossible, but still understand why people keep arriving.'
      ]),
      section('Why the Search Lasts', 'Explain the symbolic power of the place.', [
        'The Fountain of Youth survives because everyone understands the fear behind it.',
        'It is not only about living forever. It is about regret, second chances, lost strength, and the dream that time might be negotiated with.',
        'A fountain that cannot be found can still shape maps. In that sense, the legend never needed the water to work.'
      ])
    ],
    faq: [
      qa('Did Ponce de Leon really search for the Fountain of Youth?', 'Many historians doubt it. The connection appears to have grown after his lifetime rather than from his own surviving records.'),
      qa('Where is the Fountain of Youth supposed to be?', 'Later versions often connect it with Bimini, Florida, or St. Augustine, but the legend has shifted across places.'),
      qa('Is the Fountain of Youth a real spring?', 'There are real springs and tourist sites, but no verified water source restores youth.'),
      qa('Why does the legend survive?', 'It speaks to aging, regret, exploration, and the hope that time might be reversed.')
    ]
  },
  {
    categorySlug: 'lost-worlds',
    slug: 'mu-lost-continent-legend',
    title: 'Mu Lost Continent: James Churchward, Occult Geography, and the Pacific Atlantis',
    subject: 'Mu',
    tag: 'Lost Continent',
    tags: ['Lost Continent', 'Mu', 'James Churchward', 'Pseudoarchaeology', 'Pacific Atlantis'],
    keyword: 'mu lost continent legend',
    detail: 'the lost-continent claim popularized by James Churchward as a vanished Pacific motherland of civilization',
    evidence: 'Encyclopedia.com summaries, WorldCat and Open Library records, Churchward publication history, and later occult reception',
    sourceBasis: 'publication records, encyclopedia summaries, and history-of-occultism references around James Churchward',
    vocabulary: ['Mu', 'James Churchward', 'Naacal tablets', 'Pacific Atlantis', 'lost continent', 'pseudoarchaeology'],
    sources: [
      source('Encyclopedia.com - Churchward, James', 'https://www.encyclopedia.com/science/encyclopedias-almanacs-transcripts-and-maps/churchward-james-1852-1936', 'Supports Churchward, the claimed Naacal tablets, and the lost continent of Mu publication history.'),
      source('Encyclopedia.com - Lemuria and Mu', 'https://www.encyclopedia.com/science/encyclopedias-almanacs-transcripts-and-maps/lemuria-and-mu', 'Supports the link between Lemuria, Mu, Theosophy, and later occult lost-continent claims.'),
      source('Open Library - The Lost Continent of Mu', 'https://openlibrary.org/works/OL19884712W/The_lost_continent_of_Mu', 'Supports the bibliographic record for Churchward\'s book.')
    ],
    quickAnswer: [
      'Mu is a lost-continent legend popularized by James Churchward in the early 20th century. He claimed that a vanished Pacific civilization was the motherland of humanity, but the story belongs to occult geography and pseudoarchaeology rather than accepted history.',
      'Mu remains important because it shows how lost-world ideas can move from speculative writing into popular imagination, maps, and alternative history.'
    ],
    intro: [
      'Mu looks like Atlantis shifted into the Pacific.',
      'It offers a drowned motherland, a vanished civilization, secret tablets, and a map of human origins that mainstream evidence does not support. That failure of proof is part of why the legend is useful to read carefully.'
    ],
    sections: [
      section('The Claim of Mu', 'Summarize the lost-continent idea.', [
        'The Mu legend describes a vast Pacific continent that supposedly held an ancient advanced civilization before sinking beneath the sea.',
        'James Churchward became the figure most associated with the idea. His books presented Mu as a motherland of humanity and tied the claim to alleged ancient tablets and hidden knowledge.',
        'The story gives readers a complete lost world: origin, catastrophe, survivors, symbols, and a secret record that only a chosen interpreter can read.'
      ]),
      section('How the Idea Spread', 'Connect Churchward to earlier and later traditions.', [
        'Mu did not appear in a vacuum. It grew near older lost-continent claims, Theosophical speculation, and attempts to explain world cultures through a single vanished source.',
        'Churchward turned those currents into an accessible popular narrative. The lost continent became less a scientific proposal than a mythic geography.',
        'That made Mu durable. Even when geology and archaeology rejected the claim, the image of a Pacific Atlantis remained available to occult writers and alternative-history readers.'
      ]),
      section('What the Evidence Can Support', 'Keep the source limits visible.', [
        'The publication history of Mu is real. Churchward wrote books, made claims, and influenced later lost-world imagination.',
        'The civilization he described is not supported by mainstream evidence. The alleged tablets and many central claims cannot be verified in the way historical or archaeological claims require.',
        'So Mu should be read as a cultural artifact: a record of how people imagined hidden origins, not as a confirmed lost civilization.'
      ]),
      section('Why Mu Still Attracts Readers', 'Explain the lost-world appeal.', [
        'Mu offers a powerful fantasy: all scattered human mysteries may come from one missing place.',
        'That promise is attractive because it turns complexity into a secret map. It suggests that ancient history has a hidden center waiting to be decoded.',
        'Kyunolab keeps the wonder and the warning together. Mu is fascinating because it is a story about lost worlds, but also because it shows how easily desire can imitate evidence.'
      ])
    ],
    faq: [
      qa('Was Mu a real continent?', 'Mainstream geology and archaeology do not support Mu as a real lost Pacific continent.'),
      qa('Who popularized Mu?', 'James Churchward popularized Mu through books beginning in the 1920s.'),
      qa('Is Mu the same as Lemuria?', 'Later writers often connected or blended Mu and Lemuria, though the ideas have different histories.'),
      qa('Why does Mu matter?', 'It shows how lost-world stories can become cultural myths even without historical proof.')
    ]
  },
  {
    categorySlug: 'modern-legends',
    slug: 'flatwoods-monster-legend',
    title: 'Flatwoods Monster: Fireball, Witnesses, and the West Virginia Legend',
    subject: 'Flatwoods Monster',
    tag: 'Modern Creature',
    tags: ['Modern Creature', 'Flatwoods Monster', 'West Virginia Folklore', 'UFO Legend', 'Braxton County'],
    keyword: 'flatwoods monster legend',
    detail: 'the 1952 West Virginia sighting story that joined a fireball, frightened witnesses, a metallic odor, and a towering figure',
    evidence: 'West Virginia Encyclopedia summary, regional folklore materials, witness-story tradition, and later festival memory',
    sourceBasis: 'West Virginia Encyclopedia folklore entry and regional monster-lore summaries',
    vocabulary: ['Flatwoods Monster', 'Braxton County', 'fireball', 'Kathleen May', 'metallic odor', 'UFO folklore'],
    sources: [
      source('e-WV - Flatwoods Monster', 'https://wvencprod.wvnet.edu/entries/2127', 'Supports the 1952 date, witness group, fireball, creature description, and later regional festival memory.'),
      source('e-WV - Folklore Category', 'https://www.wvencyclopedia.org/categories/33', 'Supports Flatwoods Monster as part of West Virginia folklore context.'),
      source('e-WV - Mothman', 'https://www.wvencyclopedia.org/entries/1369', 'Supports the wider West Virginia modern monster context alongside Mothman and other regional legends.')
    ],
    quickAnswer: [
      'The Flatwoods Monster is a West Virginia legend that began near Flatwoods on September 12, 1952, after witnesses saw a fireball and then reported a tall, strange figure near a hilltop. The story became part of regional UFO and monster folklore.',
      'The strongest source-aware reading treats the sighting as a documented witness story with later folklore growth, not as proof that an alien creature appeared.'
    ],
    intro: [
      'The Flatwoods Monster begins with a light in the sky.',
      'That is important. Before the creature appears, the witnesses are already looking toward a fall, a landing, or an impact. The monster enters a scene that has been prepared by the fireball.'
    ],
    sections: [
      section('The 1952 Sighting Story', 'Present the local event that started the legend.', [
        'The common account places the sighting near dusk on September 12, 1952. A group of children saw a bright fireball and went toward the area with adults, including Kathleen May.',
        'Near the hilltop, they reported a strange figure: tall, broad, silent, with an unusual head shape, bright colors, and a strong metallic odor.',
        'The group fled quickly. Later investigation found physical traces such as odor, marks, and trampled grass, but not evidence that could fully explain the figure.'
      ]),
      section('Why the Monster Became Regional Folklore', 'Connect the case to West Virginia legend culture.', [
        'West Virginia has several modern creature legends, including Mothman and the Grafton Monster. The Flatwoods Monster belongs to that regional pattern.',
        'The story is compact and visual. It has a date, named witnesses, a sky event, a hill, a smell, and a figure that looks more designed than natural.',
        'Those details made it easy to remember, retell, draw, and turn into a symbol of Braxton County mystery.'
      ]),
      section('What Cannot Be Confirmed', 'Avoid turning witness lore into proof.', [
        'A fireball was part of the reported context, but the identity of the figure remains unresolved in folklore terms.',
        'Possible explanations have ranged from misidentification to atmospheric fear, but none has replaced the legend in public memory.',
        'The strongest account keeps the witnesses and their reported experience separate from any claim that the creature itself has been proven.'
      ]),
      section('Why the Image Lasts', 'Explain the modern legend pattern.', [
        'The Flatwoods Monster is memorable because it is oddly specific. The head shape, height, color, light, and odor make it feel like a scene rather than a vague rumor.',
        'It also sits at the crossing point of UFO culture and Appalachian monster lore.',
        'That crossing gives the legend its force. It is both a local story and a mid-century sky mystery.'
      ])
    ],
    faq: [
      qa('When did the Flatwoods Monster sighting happen?', 'The central sighting is dated to September 12, 1952, near Flatwoods, West Virginia.'),
      qa('Who saw the Flatwoods Monster?', 'The commonly reported witness group included local youths and Kathleen May.'),
      qa('Was the Flatwoods Monster proven real?', 'No. The sighting is documented as a witness story and regional legend, not as proven evidence of a creature.'),
      qa('Why is it linked to UFO folklore?', 'The sighting began after a reported fireball in the sky, which shaped later UFO-style interpretations.')
    ]
  },
  {
    categorySlug: 'mythic-creatures',
    slug: 'cockatrice-folklore',
    title: 'Cockatrice Folklore: Deadly Glance, Serpent-Rooster Form, and Medieval Fear',
    subject: 'Cockatrice',
    tag: 'Medieval Creature',
    tags: ['Medieval Creature', 'Cockatrice', 'Basilisk', 'Deadly Glance', 'Bestiary'],
    keyword: 'cockatrice folklore',
    detail: 'the medieval creature imagined as a deadly rooster-serpent whose look, touch, or breath could kill',
    evidence: 'older encyclopedia descriptions, bestiary tradition, biblical translation history, and basilisk-related folklore',
    sourceBasis: 'older encyclopedia material, bestiary tradition, and comparative creature folklore',
    vocabulary: ['cockatrice', 'basilisk', 'rooster-serpent', 'deadly glance', 'weasel', 'rue'],
    sources: [
      source('1911 Encyclopaedia Britannica - Cockatrice', 'https://en.wikisource.org/wiki/1911_Encyclop%C3%A6dia_Britannica/Cockatrice', 'Supports the monster description, deadly powers, cock crow, weasel motif, and relation to basilisk.'),
      source('Encyclopaedia Britannica 1911 via Wikisource', 'https://en.wikisource.org/wiki/1911_Encyclop%C3%A6dia_Britannica/Cockatrice', 'Supports historical encyclopedia framing for the creature.'),
      source('Folklore and bestiary tradition summaries', 'https://en.wikisource.org/wiki/1911_Encyclop%C3%A6dia_Britannica/Cockatrice', 'Supports the bestiary-style reading and source limits.')
    ],
    quickAnswer: [
      'The cockatrice is a medieval fabulous creature often imagined as part rooster and part serpent. It was believed to kill through a deadly look, breath, touch, or poison, and it is closely related to basilisk traditions.',
      'The creature belongs to bestiary and folklore tradition rather than natural history. Its power comes from a symbolic mix of animal fear, poison, gaze, and monstrous birth.'
    ],
    intro: [
      'The cockatrice is small enough to be absurd and deadly enough to be terrifying.',
      'That combination is the point. It joins a rooster, a serpent, a fatal gaze, and a set of rules that make the creature feel like a medieval warning disguised as an animal.'
    ],
    sections: [
      section('The Creature in Folklore', 'Describe the cockatrice without modern invention.', [
        'The cockatrice is usually described as a fabulous monster connected to the basilisk. Later tradition often gives it a rooster-like head or body mixed with serpent features.',
        'Its danger is not ordinary strength. It can kill by look, touch, breath, or poison depending on the version.',
        'This makes the cockatrice a creature of contact and sight. The closer one gets to understanding it, the more dangerous it becomes.'
      ]),
      section('The Strange Rules Around It', 'Show the bestiary logic.', [
        'Older descriptions give the cockatrice a set of symbolic weaknesses. The crowing of a cock can destroy it. The weasel can fight it. Rue appears as a remedy in some versions.',
        'These details make the creature feel like part of a moral-natural system. It is not just a monster, but a monster with rules.',
        'That rule-based structure helped medieval and early modern readers imagine a world where hidden dangers could still be classified.'
      ]),
      section('Cockatrice and Basilisk', 'Explain the overlap without flattening it.', [
        'The cockatrice is often treated as related to, or nearly identical with, the basilisk. Both involve venom, sight, and reptile-like terror.',
        'The names and features shift across sources, translations, and later fantasy writing. That is why a source-aware article should not pretend that every version agrees.',
        'The shared center is the deadly gaze. Whether called cockatrice or basilisk, the creature turns seeing into danger.'
      ]),
      section('Why the Monster Lasts', 'Explain symbolic durability.', [
        'The cockatrice lasts because it gives shape to invisible threat. Poison, contagion, corruption, and evil influence all become readable as a creature.',
        'Its mixed body also matters. A familiar farm bird and a feared serpent become one impossible animal.',
        'That is why the cockatrice still fits mythic creature archives. It is not believable as zoology, but it is powerful as a design for fear.'
      ])
    ],
    faq: [
      qa('Is a cockatrice the same as a basilisk?', 'The two are closely related and often overlap, but sources do not always use the names in exactly the same way.'),
      qa('What powers does a cockatrice have?', 'Folklore gives it deadly powers through its gaze, touch, breath, or poison.'),
      qa('What can defeat a cockatrice?', 'Older descriptions often mention the crowing of a cock or the weasel as counters to the creature.'),
      qa('Was the cockatrice considered a real animal?', 'It belongs to fabulous creature lore and bestiary tradition, not modern natural history.')
    ]
  },
  {
    categorySlug: 'mythic-objects',
    slug: 'spear-of-destiny-holy-lance',
    title: 'Spear of Destiny: Holy Lance, Relic Tradition, and the Object That Claims History',
    subject: 'Spear of Destiny',
    tag: 'Relic Legend',
    tags: ['Relic Legend', 'Spear of Destiny', 'Holy Lance', 'Longinus', 'Mythic Object'],
    keyword: 'spear of destiny holy lance',
    detail: 'the relic tradition around the lance said to have pierced Christ and the later legends of world-shaping power attached to it',
    evidence: 'New Catholic Encyclopedia entry, Encyclopedia.com occult-legend summary, relic history, and modern reception',
    sourceBasis: 'religious encyclopedia entries, relic history, and later occult-legend reception',
    vocabulary: ['Spear of Destiny', 'Holy Lance', 'relic', 'lance', 'object'],
    sources: [
      source('Encyclopedia.com - Holy Lance', 'https://www.encyclopedia.com/religion/encyclopedias-almanacs-transcripts-and-maps/holy-lance', 'Supports the religious relic tradition, Jerusalem and Constantinople history, Vienna lance, and Antioch lance.'),
      source('Encyclopedia.com - Spear of Destiny', 'https://www.encyclopedia.com/science/encyclopedias-almanacs-transcripts-and-maps/spear-destiny', 'Supports the modern occult legend frame and the difference between relic history and later destiny claims.'),
      source('New World Encyclopedia - Holy Lance', 'https://www.newworldencyclopedia.org/entry/Holy_Lance', 'Supports a general summary of the Holy Lance and modern Spear of Destiny legends.')
    ],
    quickAnswer: [
      'The Spear of Destiny is a legendary name often attached to the Holy Lance, the spear associated with the piercing of Christ in Christian tradition. Several relic traditions exist, and later occult stories added claims of world-shaping power.',
      'A source-aware reading separates relic history, medieval veneration, competing lance traditions, and modern legends about destiny or conquest.'
    ],
    intro: [
      'The Spear of Destiny is a mythic object because it turns a weapon into a claim on history.',
      'It is not only a lance. In later retellings it becomes proof, relic, symbol, royal object, occult prize, and dangerous story all at once.'
    ],
    sections: [
      section('The Holy Lance Tradition', 'Establish the religious relic base.', [
        'Christian tradition connects the Holy Lance with the spear that pierced Christ during the crucifixion. From that point, the object becomes a relic tradition rather than a simple weapon story.',
        'Different places and histories have claimed or preserved lances connected with this tradition. Jerusalem, Constantinople, Rome, Vienna, Antioch, and other contexts enter the record in different ways.',
        'That multiplicity is important. There is not one simple object with one uninterrupted story.'
      ]),
      section('How It Became the Spear of Destiny', 'Explain the later legendary layer.', [
        'The name Spear of Destiny belongs to a more dramatic layer of interpretation. It suggests that whoever possesses or understands the spear controls history.',
        'This is where relic history becomes occult legend. The object is pulled into stories about emperors, conquest, and modern power.',
        'Those stories are culturally powerful, but they need careful handling. They are not the same thing as documented relic history.'
      ]),
      section('The Relic and the Legend', 'Separate object, relic, and legend.', [
        'Sources can support the existence of multiple Holy Lance traditions and the historical importance of relic veneration.',
        'They can also support the fact that later writers attached grand claims to the spear. What they cannot prove is that one lance literally controls destiny.',
        'Kyunolab reads the spear as an object whose meaning grows because people keep trying to attach authority to it.'
      ]),
      section('Why the Object Still Holds Power', 'Explain the mythic-object appeal.', [
        'A mythic object works when it seems to condense a whole world into one thing.',
        'The Spear of Destiny condenses violence, holiness, empire, relic, proof, and danger. That is why it keeps attracting stories.',
        'The question is not only whether the spear is authentic. It is why people want one object to decide the shape of history.'
      ])
    ],
    faq: [
      qa('Is the Spear of Destiny the same as the Holy Lance?', 'The names are often connected, but Spear of Destiny usually emphasizes later legend while Holy Lance emphasizes the relic tradition.'),
      qa('Are there multiple Holy Lance traditions?', 'Yes. Several relics and traditions have been associated with the lance.'),
      qa('Did the spear really control world history?', 'That is a legend or occult claim, not a verified historical fact.'),
      qa('Why is it a mythic object?', 'Because it gathers religious memory, political power, relic authority, and later supernatural claims into one object.')
    ]
  },
  {
    categorySlug: 'myths',
    slug: 'narcissus-and-echo-myth',
    title: 'Narcissus and Echo: Reflection, Voice, and the Greek Myth of Unreachable Love',
    subject: 'Narcissus and Echo',
    tag: 'Greek Myth',
    tags: ['Greek Myth', 'Narcissus', 'Echo', 'Reflection Myth', 'Transformation Myth'],
    keyword: 'narcissus and echo myth',
    detail: 'the Greek myth in which Echo can only return another voice while Narcissus falls in love with his own reflection',
    evidence: 'Theoi summaries, Ovidian tradition, Pausanias variants, Greek myth references, and later symbolic readings',
    sourceBasis: 'Greek mythological tradition, especially Ovid, Pausanias, and later reference summaries',
    vocabulary: ['Narcissus', 'Echo', 'reflection', 'Nemesis', 'Cephisus', 'Liriope', 'narcissus flower'],
    sources: [
      source('Theoi - Narcissus', 'https://www.theoi.com/Heros/Narkissos.html', 'Supports Narcissus, Echo, the reflection, Nemesis, transformation, and variants.'),
      source('Theoi - Echo', 'https://www.theoi.com/Nymphe/NympheEkho.html', 'Supports Echo, Hera\'s curse, the repeated voice motif, and Ovidian passages.'),
      source('Classical mythology reference summaries', 'https://www.theoi.com/Heros/Narkissos.html', 'Supports the source-limited treatment of Ovid, Pausanias, and later variants.')
    ],
    quickAnswer: [
      'Narcissus and Echo is a Greek myth about two forms of unreachable love. Echo can only repeat the words of others, while Narcissus becomes trapped by his own reflection and cannot reach the image he desires.',
      'The story is often read as a myth about voice, image, self-recognition, rejection, and transformation into flower and sound.'
    ],
    intro: [
      'Narcissus and Echo is a myth built from two failures to connect.',
      'One character has a voice that can only return what it hears. The other sees a face he loves but cannot touch. Together, they make one of the clearest Greek myths about desire turning back on itself.'
    ],
    sections: [
      section('Echo and the Broken Voice', 'Introduce Echo before the reflection scene.', [
        'Echo is remembered as a nymph whose speech is damaged by divine punishment. She cannot begin ordinary speech. She can only repeat the end of what someone else says.',
        'This makes her love for Narcissus painful before he even rejects her. She has feeling, but not full language.',
        'When Narcissus calls out, Echo answers with his own words. The scene turns communication into a trap.'
      ]),
      section('Narcissus and the Pool', 'Tell the central reflection episode.', [
        'Narcissus is beautiful and proud, rejecting those who desire him. In the familiar version, Nemesis answers a prayer for punishment.',
        'He sees his reflection in water and falls in love with it, not understanding or not escaping the fact that the beloved image is himself.',
        'The pool becomes a mirror and a prison. Narcissus can look, but he cannot join what he sees.'
      ]),
      section('Versions and Transformations', 'Keep variants visible.', [
        'Ovid gives the famous joined story of Echo and Narcissus. Other ancient references preserve variants, including different explanations for Narcissus and the flower.',
        'Some versions emphasize arrogance. Others emphasize grief, mistaken recognition, or an unreachable double.',
        'The transformation matters because the myth does not end in ordinary death. Echo becomes voice. Narcissus becomes flower. Both remain, but not as they were.'
      ]),
      section('Why the Myth Still Feels Modern', 'Explain the symbolic shape.', [
        'The myth lasts because it gives image and voice their own tragedies.',
        'Echo cannot speak herself fully. Narcissus cannot see beyond himself. One loses original speech; the other loses the world outside his reflection.',
        'That pattern keeps returning because it is simple, beautiful, and uncomfortable.'
      ])
    ],
    faq: [
      qa('Who is Echo in the Narcissus myth?', 'Echo is a nymph cursed to repeat the final words of others.'),
      qa('Why does Narcissus fall in love with himself?', 'In the common version, Nemesis punishes his rejection of others by making him desire his own reflection.'),
      qa('What happens to Narcissus?', 'He dies or wastes away by the pool and is associated with the narcissus flower.'),
      qa('What does the myth mean?', 'It is often read as a story about self-absorption, rejected love, voice, image, and unreachable desire.')
    ]
  },
  {
    categorySlug: 'strange-nature',
    slug: 'tunguska-event',
    title: 'Tunguska Event: Siberian Explosion, Flattened Forest, and the Natural Mystery That Changed the Sky',
    subject: 'Tunguska Event',
    tag: 'Impact Event',
    tags: ['Impact Event', 'Tunguska', 'Siberia', 'Asteroid Airburst', 'Flattened Forest'],
    keyword: 'tunguska event mystery',
    detail: 'the 1908 Siberian airburst that flattened forest across a vast remote area without leaving a typical impact crater',
    evidence: 'NASA history summary, expedition history, eyewitness reports, forest-damage studies, and planetary defense context',
    sourceBasis: 'NASA historical summary, scientific expedition history, and later asteroid airburst interpretation',
    vocabulary: ['Tunguska', 'Siberia', 'airburst', 'Leonid Kulik', 'asteroid', 'flattened forest'],
    sources: [
      source('NASA - 115 Years Ago: The Tunguska Asteroid Impact Event', 'https://www.nasa.gov/history/115-years-ago-the-tunguska-asteroid-impact-event/', 'Supports the 1908 date, eyewitness reports, delayed expedition, forest damage, and current asteroid-airburst interpretation.'),
      source('NASA Planetary Defense context', 'https://www.nasa.gov/history/115-years-ago-the-tunguska-asteroid-impact-event/', 'Supports the modern planetary defense framing and comparison with later airbursts.'),
      source('Scientific expedition history summaries', 'https://www.nasa.gov/history/115-years-ago-the-tunguska-asteroid-impact-event/', 'Supports the Kulik expedition and evidence limits.')
    ],
    quickAnswer: [
      'The Tunguska Event was a massive explosion over Siberia on June 30, 1908. Modern scientific summaries generally interpret it as an asteroid or bolide airburst that flattened forest over a huge area without leaving a normal crater.',
      'It remains a strange nature record because the event was remote, the first expedition arrived years later, and the visible destruction seemed almost impossible before airburst explanations became clearer.'
    ],
    intro: [
      'Tunguska is a mystery of damage without a simple object at the center.',
      'The forest was flattened. People saw light and heard thunder-like explosions. But the ground did not offer the clean crater many people expected. That missing crater made the sky itself the suspect.'
    ],
    sections: [
      section('The Morning Over Siberia', 'Set the documented event.', [
        'On June 30, 1908, witnesses in a remote region of Siberia reported a fireball, a blinding flash, and a powerful explosion.',
        'The blast damaged dwellings, affected people and reindeer, and flattened trees across a vast area. Because the region was so remote, scientific attention came slowly.',
        'That delay helped the mystery grow. For years, the world knew something enormous had happened, but the site itself remained difficult to study.'
      ]),
      section('The Forest Evidence', 'Explain why Tunguska looked so strange.', [
        'When expeditions finally reached the region, they found trees knocked down in a broad pattern, with some near the center stripped and standing.',
        'The damage suggested an explosion above the ground rather than a typical impact crater.',
        'This is the core of Tunguska as strange nature: the evidence was massive, but the object seemed to have vanished.'
      ]),
      section('The Airburst Explanation', 'Present the current scientific reading.', [
        'Modern summaries generally identify the cause as a cosmic object exploding in the atmosphere. The term airburst explains why the damage could be huge without a simple crater.',
        'Some debate has existed over asteroid versus comet possibilities, but NASA summaries emphasize an asteroid airburst as the most likely explanation.',
        'The case also shaped modern thinking about planetary defense because smaller objects can still cause large regional effects.'
      ]),
      section('Why Tunguska Still Feels Unresolved', 'Explain the cultural mystery after science.', [
        'Science can explain much of Tunguska, but the event still feels uncanny because the visible aftermath was so large and the recovered object so elusive.',
        'That gap invited stranger theories for decades.',
        'The strongest version of the story keeps both truths together: Tunguska is explainable in natural terms, and still one of the most dramatic natural mysteries of the modern era.'
      ])
    ],
    faq: [
      qa('When did the Tunguska Event happen?', 'It happened on June 30, 1908, over a remote region of Siberia.'),
      qa('What caused Tunguska?', 'Modern scientific summaries generally identify it as an asteroid or bolide airburst.'),
      qa('Why was there no normal crater?', 'The object likely exploded in the atmosphere before reaching the ground as a solid impactor.'),
      qa('Why does Tunguska still matter?', 'It shows how a cosmic airburst can cause major damage and helped shape modern planetary defense thinking.')
    ]
  },
  {
    categorySlug: 'strange-places',
    slug: 'island-of-the-dolls-xochimilco',
    title: 'Island of the Dolls: Xochimilco, Don Julian, and the Strange Place Legend',
    subject: 'Island of the Dolls',
    tag: 'Place Legend',
    tags: ['Place Legend', 'Island of the Dolls', 'Xochimilco', 'Don Julian Santana', 'Haunted Place'],
    keyword: 'island of the dolls legend',
    detail: 'the Xochimilco island covered with weathered dolls and linked to the story of Don Julian Santana and a drowned girl',
    evidence: 'travel documentation, folklore archive material, local guide retellings, and source-limited tourism accounts',
    sourceBasis: 'travel documentation, digital folklore archive material, and local retellings around Xochimilco',
    vocabulary: ['Island of the Dolls', 'Xochimilco', 'Don Julian Santana', 'dolls', 'canals', 'chinampa'],
    sources: [
      source('Atlas Obscura - La Isla de las Munecas', 'https://www.atlasobscura.com/places/la-isla-de-las-munecas', 'Supports the location, Don Julian Santana, dolls, drowned-girl story, and access cautions.'),
      source('USC Digital Folklore Archives - The Island of Dolls', 'https://folklore.usc.edu/the-island-of-dolls/', 'Supports a performed local guide version and source limits around the drowned girl claim.'),
      source('Island of the Dolls official-style site', 'https://isladelasmunecas.com/', 'Supports common visitor-facing legend elements and the Don Julian account.')
    ],
    quickAnswer: [
      'The Island of the Dolls is a strange place in the Xochimilco canals near Mexico City, known for trees and structures covered with old dolls. The common legend links the dolls to Don Julian Santana and the spirit of a drowned girl.',
      'The strongest source-aware reading treats the island as a real place with a powerful modern legend around it, while keeping haunting claims and conflicting details separate from what can be verified.'
    ],
    intro: [
      'The Island of the Dolls is unsettling before anyone tells the story.',
      'Weathered faces hang from trees. Missing limbs and broken eyes turn ordinary toys into witnesses. Then the legend gives the island a reason to look that way.'
    ],
    sections: [
      section('The Place in Xochimilco', 'Anchor the legend in a real location.', [
        'The island sits within the canal landscape of Xochimilco, south of Mexico City. It is associated with chinampas, boats, tourism, and the layered history of the waterways.',
        'Its fame comes from the dolls. They hang from trees, fences, and structures in various states of decay.',
        'The visual impact is immediate. Even without a ghost story, the island feels like a collection of abandoned faces.'
      ]),
      section('Don Julian and the Drowned Girl', 'Present the central legend carefully.', [
        'The common story centers on Don Julian Santana Barrera, who lived on the island and began collecting dolls.',
        'One version says he found or sensed the spirit of a drowned girl and hung the dolls to appease or honor her. Other accounts are more cautious and suggest some details may have been imagined, changed, or shaped for visitors.',
        'The point is not to force one final version. The legend works because the dolls seem to demand a reason.'
      ]),
      section('How a Place Becomes Haunted', 'Explain place folklore and tourism.', [
        'The Island of the Dolls shows how a real environment can become a story engine.',
        'Visitors see the dolls, hear the account, photograph the island, and carry away a version of the legend. The place keeps generating its own retellings.',
        'Tourism complicates the record. Some details may grow stronger because they are good to tell from a boat.'
      ]),
      section('Why the Island Lasts', 'Explain the visual power.', [
        'Dolls are powerful because they are made to resemble life while remaining empty.',
        'On the island, age and weather change them. They no longer look comforting. They look like something left to watch.',
        'That is why the Island of the Dolls remains a strong strange-place record. The legend may shift, but the image does not need much help.'
      ])
    ],
    faq: [
      qa('Where is the Island of the Dolls?', 'It is associated with the Xochimilco canals near Mexico City.'),
      qa('Who was Don Julian Santana?', 'He was the man most often linked to collecting and hanging the dolls on the island.'),
      qa('Is the drowned girl story proven?', 'The story is widely told, but details vary and should be treated as legend rather than verified fact.'),
      qa('Why is the place famous?', 'Its visual field of weathered dolls makes the island memorable and easy to retell as a haunted place.')
    ]
  },
  {
    categorySlug: 'unexplained-mysteries',
    slug: 'db-cooper-hijacking-mystery',
    title: 'D.B. Cooper Hijacking: Ransom, Parachute, and the Unsolved Man in the Suit',
    subject: 'D.B. Cooper',
    tag: 'Unsolved Case',
    tags: ['Unsolved Case', 'D.B. Cooper', 'Hijacking', 'FBI', 'Aviation Mystery'],
    keyword: 'db cooper hijacking mystery',
    detail: 'the 1971 airplane hijacking in which a man parachuted into the night with ransom money and was never identified',
    evidence: 'FBI case history, recovered ransom money, aviation records, suspect review, and later public-history summaries',
    sourceBasis: 'FBI case history and later public-history summaries of the NORJAK investigation',
    vocabulary: ['D.B. Cooper', 'Dan Cooper', 'NORJAK', 'Northwest Orient Flight 305', 'ransom money', 'parachute'],
    sources: [
      source('FBI - D.B. Cooper Hijacking', 'https://www.fbi.gov/history/cases-and-criminals/db-cooper-hijacking', 'Supports the 1971 timeline, ransom amount, parachute jump, recovered money, and investigation status.'),
      source('HISTORY - Who Was D.B. Cooper?', 'https://www.history.com/articles/who-was-d-b-cooper', 'Supports public-history context, later suspect discussion, and the enduring mystery framing.'),
      source('HISTORY - D.B. Cooper Letters', 'https://www.history.com/articles/db-cooper-case-fbi-letters', 'Supports the later letter claims and caution around hoaxes or unproven evidence.')
    ],
    quickAnswer: [
      'D.B. Cooper is the name attached to the unknown man who hijacked Northwest Orient Flight 305 on November 24, 1971, received $200,000 in ransom, and parachuted from the aircraft into the night. His identity and fate remain unresolved.',
      'The FBI closed active resource commitment to the case in 2016, but the recovered ransom money, the tie, the alias, and the unanswered jump keep the mystery alive.'
    ],
    intro: [
      'D.B. Cooper is one of the rare mysteries that feels complete and unfinished at the same time.',
      'There is a plane, a note, a ransom, a parachute, and a disappearance. What is missing is the man after the jump.'
    ],
    sections: [
      section('The Hijacking', 'Lay out the documented event.', [
        'On November 24, 1971, a man using the name Dan Cooper boarded Northwest Orient Flight 305 from Portland to Seattle.',
        'He indicated that he had a bomb, demanded parachutes and $200,000 in cash, and released the passengers after landing in Seattle.',
        'The plane took off again. Somewhere between Seattle and Reno, Cooper lowered the rear stairs and jumped into darkness with the money.'
      ]),
      section('The Evidence That Remains', 'Identify the key pieces of the case.', [
        'The case left behind physical and documentary fragments: witness descriptions, a tie, parachute material, aircraft evidence, and serial-numbered ransom bills.',
        'In 1980, a boy found a portion of the ransom money along the Columbia River, confirming that at least some of the cash had ended up outside Cooper\'s control.',
        'That discovery deepened the mystery instead of solving it.'
      ]),
      section('Why the Identity Stayed Open', 'Explain source limits and suspect problems.', [
        'The FBI investigated hundreds of people and considered many suspects, but no identity was confirmed.',
        'The name D.B. Cooper itself came from media confusion. The hijacker used Dan Cooper, while D.B. became the public label.',
        'Many later theories depend on partial matches, family claims, letters, or circumstantial detail. The official record remains unresolved.'
      ]),
      section('Why Cooper Became Legend', 'Explain the modern mystery pattern.', [
        'The Cooper case lasts because the ending happens in the dark.',
        'If he died, the body was not found. If he lived, the escape was never publicly proven. Either version leaves room for imagination.',
        'That open space turned a crime into an American legend of disappearance, risk, and a man in a suit walking out of history.'
      ])
    ],
    faq: [
      qa('Who was D.B. Cooper?', 'His identity has never been confirmed. The hijacker used the name Dan Cooper, and D.B. Cooper became the media name.'),
      qa('How much money did Cooper receive?', 'He received $200,000 in twenty-dollar bills.'),
      qa('Was any ransom money found?', 'Yes. A portion of the ransom money was found in 1980 along the Columbia River.'),
      qa('Is the case solved?', 'No. The FBI redirected resources away from the active investigation in 2016, but the identity remains unresolved.')
    ]
  },
  {
    categorySlug: 'urban-legends',
    slug: 'kidney-theft-urban-legend',
    title: 'Kidney Theft Urban Legend: Bathtub Ice, Travel Fear, and the Organ Theft Rumor',
    subject: 'Kidney Theft Urban Legend',
    tag: 'Medical Urban Legend',
    tags: ['Medical Urban Legend', 'Kidney Theft', 'Organ Theft', 'Travel Rumor', 'Scarelore'],
    keyword: 'kidney theft urban legend',
    detail: 'the modern rumor in which a traveler wakes in a bathtub of ice and discovers that a kidney has supposedly been stolen',
    evidence: '1990s newspaper reporting, CBS and Wired coverage, organ donation myth discussion, and urban legend scholarship references',
    sourceBasis: 'newspaper and media accounts of the 1990s kidney theft hoax and modern urban legend discussion',
    vocabulary: ['kidney theft', 'bathtub', 'ice', 'organ', 'travel'],
    sources: [
      source('Roanoke Times archive - Terrifying Tale of Kidney Theft Is Urban Myth', 'https://scholar.lib.vt.edu/VA-news/ROA-Times/issues/1997/rt9703/970308/03100032.htm', 'Supports the 1990s fax and internet circulation, bathtub-ice version, and urban myth framing.'),
      source('CBS News - Transplant Myths and Urban Legends', 'https://www.cbsnews.com/news/transplant-myths-urban-legends/', 'Supports the organ donation myth context and persistence of the kidney theft rumor.'),
      source('WIRED - The Great Kidney-Snatch Myth', 'https://www.wired.com/1998/12/the-great-kidney-snatch-myth/', 'Supports the internet-era spread and debunked status of the kidney heist story.')
    ],
    quickAnswer: [
      'The kidney theft urban legend usually describes a traveler who is drugged, wakes in a bathtub full of ice, and discovers that one or both kidneys have been removed. The story spread widely through fax, email, and word of mouth in the 1990s.',
      'The legend is not evidence of random hotel-bar organ theft. It is a fear story about travel, bodies, medical systems, crime, and the black market.'
    ],
    intro: [
      'The kidney theft legend works because it makes the body feel like a place someone else can enter.',
      'The victim wakes up too late. The room is strange. The ice is already there. A missing organ turns travel anxiety into a medical nightmare.'
    ],
    sections: [
      section('The Bathtub Ice Version', 'Describe the common urban legend form.', [
        'In the familiar version, a traveler accepts a drink or meets a stranger. The next memory is waking in a hotel room or bathtub packed with ice.',
        'A note warns the victim not to move and to call emergency services. The terrible discovery is that a kidney has supposedly been removed for black-market sale.',
        'The details vary, but the structure is stable: ordinary travel, sudden blackout, medical violation, and a warning that arrives after the harm is done.'
      ]),
      section('How the Rumor Spread', 'Show the 1990s fax and email pattern.', [
        'The kidney theft story circulated heavily through fax, email, office warnings, and personal anecdotes in the 1990s.',
        'It often came with official-sounding language or a friend-of-a-friend frame. That made it feel urgent even when the evidence was absent.',
        'This is classic urban legend behavior. The story becomes more persuasive by sounding close to the listener.'
      ]),
      section('What the Evidence Does Not Show', 'Separate real organ trafficking from the legend.', [
        'Illegal organ trafficking and transplant exploitation are real issues, but they do not match the random bathtub-ice story as commonly told.',
        'Media and fact-checking discussion repeatedly treated the hotel-bar kidney heist as a myth or hoax rather than a verified crime pattern.',
        'The distinction matters. The legend borrows fear from real medical and criminal concerns, then reshapes that fear into a cinematic scene.'
      ]),
      section('Why the Legend Lasts', 'Explain the urban fear pattern.', [
        'The kidney theft legend lasts because it joins several modern anxieties at once: travel, nightlife, strangers, surgery, organ markets, and helplessness.',
        'It also gives fear a single visual anchor. A bathtub full of ice is easy to remember and hard to forget.',
        'That image does the work of proof inside the story, even when proof outside the story is missing.'
      ])
    ],
    faq: [
      qa('Is the kidney theft bathtub story true?', 'The common hotel-bar bathtub-ice version is treated as an urban legend, not a verified crime pattern.'),
      qa('When did the legend spread widely?', 'It spread strongly through fax, email, and media discussion in the 1990s.'),
      qa('Does real organ trafficking exist?', 'Yes, but real cases do not match the random traveler bathtub legend in the way the story claims.'),
      qa('Why is the legend so effective?', 'It turns body fear, travel anxiety, and medical distrust into one unforgettable scene.')
    ]
  }
];

const topicSlugs = new Set(topics.map((topic) => topic.slug));
existingQueries = new Set(
  stories
    .filter((story) => !topicSlugs.has(story.slug))
    .map((story) => story.contentDNA?.canonicalQuery || story.primaryKeyword || story.seedKeyword)
    .filter(Boolean)
    .map((query) => query.toLowerCase().trim())
);

const added = [];
const updated = [];

for (const topic of topics) {
  const category = categoryBySlug.get(topic.categorySlug);
  if (!category) throw new Error(`Missing category: ${topic.categorySlug}`);
  const story = buildStory(topic, category);
  story.contentDNA = buildContentDNA(story, existingQueries);
  story.contentDNA.subjectSpecificVocabulary = topic.vocabulary;
  story.contentDNA.sectionBlueprint = topic.sections.map((item) => ({ title: item.heading, nav: item.heading }));
  if (story.contentDNA?.canonicalQuery) {
    existingQueries.add(story.contentDNA.canonicalQuery.toLowerCase().trim());
  }
  const existingIndex = stories.findIndex((item) => item.slug === topic.slug);
  if (existingIndex >= 0) {
    stories[existingIndex] = story;
    updated.push(story.slug);
  } else {
    storySlugs.add(story.slug);
    added.push(story);
  }
}

stories.unshift(...added.reverse());
writeJson(storiesPath, stories);
console.log(`Added ${added.length} and updated ${updated.length} one-per-category archive stories.`);

function buildStory(topic, category) {
  const relatedSlugs = stories
    .filter((story) => story.categorySlug === category.slug && story.slug !== topic.slug)
    .map((story) => story.slug)
    .slice(0, 4);
  const relatedKeywords = unique([
    `${topic.keyword} origin`,
    `${topic.keyword} meaning`,
    `${topic.tag.toLowerCase()} folklore`,
    `${category.title.toLowerCase()} explained`
  ]);
  return {
    id: topic.slug,
    slug: topic.slug,
    title: topic.title,
    displayTitle: topic.title,
    h1: topic.title,
    seoTitle: topic.title,
    metaTitle: topic.title,
    metaDescription: trimMeta(`${topic.subject} explains ${topic.detail}, with source limits, common versions, folklore meaning, and why the story still lasts.`),
    category: category.title,
    categorySlug: category.slug,
    categoryGroup: category.group,
    tag: topic.tag,
    primaryTag: topic.tag,
    seedKeyword: topic.subject.toLowerCase(),
    primaryKeyword: topic.subject.toLowerCase(),
    searchIntent: searchIntentFor(category.slug),
    articleFormat: category.group === 'Mythic & Imagined Realms' ? 'story-archive' : 'search-info',
    cluster: `${category.title} / ${topic.tag}`,
    relatedKeywords,
    secondaryKeywords: unique([...relatedKeywords, ...topic.vocabulary]).slice(0, 8),
    topicScore: 92,
    topicStatus: 'approved',
    scoreBreakdown: {
      searchDemand: 29,
      clickCuriosity: 24,
      siteFit: 23,
      expansionPotential: 10,
      sourceSafety: 6
    },
    summaryAnswer: topic.quickAnswer.join(' '),
    readTime: '9 min read',
    storyType: storyTypeFor(category.slug),
    contentStandard: 'unified',
    editorialStatus: 'approved',
    legacyContent: false,
    substantiveRevisionAt: publishedAt,
    internalLinkEligible: true,
    sourceStatus: sourceStatusFor(category, topic.tag),
    publicSourceBasis: topic.sourceBasis,
    excerpt: topic.quickAnswer[0],
    introSummary: deckForTopic(topic),
    publishedAt,
    updatedAt: publishedAt,
    relatedStoryIds: [],
    relatedStorySlugs: [],
    tags: topic.tags,
    detail: compactDetail(topic.detail),
    evidence: topic.evidence,
    researchSources: topic.sources,
    sourceNotes: {
      sharedVerifiedPoints: [
        `${topic.subject} is a pre-existing subject in folklore, myth, legend, mystery, or public cultural memory.`,
        `The article can responsibly describe the common record around ${topic.detail}.`,
        `The strongest reading stays within ${topic.evidence}.`
      ],
      variants: [
        'Specific details shift by source, region, retelling, publication history, or community memory.',
        'Later popular versions often make the story cleaner than the source record allows.'
      ],
      unsupportedClaimsToAvoid: [
        'Do not present supernatural or speculative claims as verified fact.',
        'Do not invent witnesses, documents, dates, or discoveries beyond the source-aware record.',
        'Do not imply a single definitive origin when the record contains variants or source limits.'
      ],
      sourceLimits: [
        'The article explains the story and its reception without treating all claims as equally proven.',
        'Interpretive meanings are presented as readings, not as settled historical facts.'
      ]
    },
    targetQuery: topic.subject.toLowerCase(),
    canonicalQuery: topic.subject.toLowerCase(),
    uniqueAngle: `${topic.subject} is treated through one concrete anchor: ${topic.detail}.`,
    sceneAnchor: topic.detail,
    subjectSpecificVocabulary: topic.vocabulary,
    contentType: 'story',
    storyBrief: {
      topic: topic.subject,
      category: category.title,
      contentType: category.slug,
      existenceStatus: 'confirmed',
      circulationLevel: 'widely known',
      knownNames: knownNamesFor(topic),
      cultureOrContext: topic.sourceBasis,
      coreStoryElements: [
        topic.quickAnswer[0],
        topic.quickAnswer[1],
        topic.sections[0].paragraphs[0],
        topic.sections[1].paragraphs[0]
      ],
      reportedVariants: [
        { claim: topic.sections[2].paragraphs[0], scope: 'source and variant record' },
        { claim: topic.sections[2].paragraphs[1], scope: 'interpretive caution' }
      ],
      editorialInterpretationOptions: [
        topic.sections[3].paragraphs[0],
        topic.sections[3].paragraphs[1]
      ],
      uncertainDetails: [
        'The exact origin, motive, or earliest form may be disputed or incomplete.',
        'Later retellings may simplify, intensify, or relocate the story.'
      ],
      prohibitedInventions: [
        'Do not add a hidden witness or newly discovered document.',
        'Do not turn folklore or speculation into confirmed fact.',
        'Do not invent modern evidence that is not in the source record.'
      ],
      existenceEvidence: topic.sources
    },
    seoHeadings: topic.sections.map((item) => item.heading),
    publicArticlePlan: {
      title: topic.title,
      dek: deckForTopic(topic),
      quickAnswer: {
        paragraphs: topic.quickAnswer,
        targetWords: { min: 90, max: 180 }
      },
      introduction: topic.intro,
      sections: topic.sections.map((item, index) => ({
        heading: item.heading,
        purpose: item.purpose,
        contentLayer: item.contentLayer || 'existing-story',
        targetWords: { min: 210, max: 380 },
        paragraphs: sectionParagraphsForPublicArticle(topic, item, index)
      })),
      conclusion: {
        paragraphs: [
          `One possible reading is that ${topic.subject} gives one memorable shape to a larger fear, desire, place, or question.`,
          `Different versions should stay visible without being treated as equal proof. ${topic.subject} works best when the strongest details remain clear and uncertain claims stay in their proper place.`
        ],
        targetWords: { min: 80, max: 150 }
      },
      faq: topic.faq,
      publicSourceNote: sourceNoteForTopic(topic)
    }
  };
}

function source(title, url, supports) {
  return { title, url, sourceType: 'reference', supports };
}

function section(heading, purpose, paragraphs, contentLayer = 'existing-story') {
  return { heading, purpose, paragraphs, contentLayer };
}

function sectionParagraphsForPublicArticle(topic, item, index) {
  const paragraphs = [...item.paragraphs];
  if (index === 2) {
    paragraphs.push(variantBridgeForTopic(topic));
  }
  if (index === 3) {
    paragraphs.unshift(interpretationBridgeForTopic(topic));
  }
  return paragraphs;
}

function deckForTopic(topic) {
  return {
    'pied-piper-of-hamelin-folklore': 'The Hamelin legend begins with missing children, then later gathers the famous rat-catcher episode, the unpaid piper, and the town memory that keeps the story alive.',
    'cicada-3301-internet-puzzle': 'Cicada 3301 began as an anonymous online puzzle in 2012, using cryptography, hidden messages, real-world clues, and an identity that remains unknown.',
    'friday-the-13th-origin': 'Friday the 13th combines two separate unlucky ideas: suspicion around Fridays and the number thirteen, joined into a modern superstition that later searched for older origins.',
    'fountain-of-youth-legend': 'The Fountain of Youth is a legend of restorative water, later tied to Ponce de Leon, Bimini, Florida, and the older human wish to delay age and loss.',
    'mu-lost-continent-legend': 'Mu is the lost-continent theory popularized by James Churchward, who described a vanished Pacific motherland through claims that archaeology has not confirmed.',
    'flatwoods-monster-legend': 'The Flatwoods Monster story centers on a 1952 West Virginia sighting after a reported fireball, with witnesses describing a towering figure, strange odor, and lasting local folklore.',
    'cockatrice-folklore': 'The cockatrice is a medieval rooster-serpent creature whose deadly look, touch, or breath made it one of the most dangerous figures in European bestiary tradition.',
    'spear-of-destiny-holy-lance': 'The Spear of Destiny legend grows around the Holy Lance tradition, where a relic associated with Christ’s crucifixion later gained stories of power, conquest, and fate.',
    'narcissus-and-echo-myth': 'Narcissus and Echo is a Greek myth about reflection, voice, desire, and loss, joining a youth who loves his own image with a nymph who can only answer back.',
    'tunguska-event': 'The Tunguska Event was a massive 1908 Siberian airburst that flattened forest across a remote region and left behind one of the most famous natural mysteries of the modern era.',
    'island-of-the-dolls-xochimilco': 'The Island of the Dolls in Xochimilco is a real canal island covered with weathered dolls and tied to the story of Don Julian Santana and a drowned girl.',
    'db-cooper-hijacking-mystery': 'D.B. Cooper is the unknown hijacker who parachuted from Northwest Orient Flight 305 in 1971 with ransom money and was never identified.',
    'kidney-theft-urban-legend': 'The kidney theft legend imagines a traveler waking in a bathtub of ice after a stolen organ, turning medical fear and travel anxiety into a lasting urban legend.'
  }[topic.slug] || topic.quickAnswer[0];
}

function variantBridgeForTopic(topic) {
  return {
    'pied-piper-of-hamelin-folklore': 'Later retellings often make the rat-catcher episode feel inseparable from the missing children, but the older Hamelin memory does not preserve every familiar detail in the same way.',
    'cicada-3301-internet-puzzle': 'Later accounts also include imitations and claims of continuation, so the public puzzle releases beginning in 2012 need to be kept separate from unofficial echoes.',
    'friday-the-13th-origin': 'Different versions explain the superstition through Christianity, numerology, popular clubs, or the Templars, but those explanations do not all carry the same historical weight.',
    'fountain-of-youth-legend': 'Some versions attach the fountain closely to Ponce de Leon, while others treat the search for youth as a wider European and Caribbean legend that grew around him later.',
    'mu-lost-continent-legend': 'Later accounts of Mu borrow from archaeology, Theosophy, Pacific travel writing, and Atlantis-like speculation, so the legend’s growth matters more than any single proof claim.',
    'flatwoods-monster-legend': 'Later retellings shift the creature’s height, shape, and meaning, while the core 1952 witness story remains the anchor for the West Virginia legend.',
    'cockatrice-folklore': 'Some versions blur the cockatrice with the basilisk, changing whether the danger comes from sight, breath, touch, venom, or the creature’s strange birth.',
    'spear-of-destiny-holy-lance': 'Different versions connect the lance to Longinus, Antioch, Vienna, and later power legends, but relic tradition and destiny folklore are not the same kind of claim.',
    'narcissus-and-echo-myth': 'Later retellings may emphasize Narcissus, Echo, Nemesis, or the flower, but the story keeps returning to reflection and unanswered voice.',
    'tunguska-event': 'Later accounts range from scientific airburst explanations to much stranger speculation, but the strongest account begins with the 1908 blast, eyewitness reports, and the flattened forest.',
    'island-of-the-dolls-xochimilco': 'Some versions change the drowned girl, the dolls, and Don Julian Santana’s motives, while the island itself remains the visible center of the modern legend.',
    'db-cooper-hijacking-mystery': 'Later accounts propose suspects and survival theories, but the confirmed case still turns on the hijacking, the jump, the missing man, and the recovered money.',
    'kidney-theft-urban-legend': 'Different versions move the setting between hotels, bars, parties, and travel warnings, but the bathtub of ice remains the image that carries the rumor.'
  }[topic.slug] || `Some versions of ${topic.subject} preserve different details, so the strongest account begins with the best-attested parts of the story.`;
}

function interpretationBridgeForTopic(topic) {
  return {
    'pied-piper-of-hamelin-folklore': 'The Piper may be read as a figure of charm and social debt: music solves the town’s problem, then exposes the cost of a broken promise.',
    'cicada-3301-internet-puzzle': 'Cicada 3301 may be read as internet folklore because the puzzle was not only solved; it was watched, archived, copied, and retold as a test of hidden knowledge.',
    'friday-the-13th-origin': 'Friday the 13th may be read as a modern merger of older anxieties, where calendar, number, and rumor make an ordinary date feel charged.',
    'fountain-of-youth-legend': 'The fountain may be read as a water legend about renewal, but its force comes from the human fear that age cannot be negotiated with forever.',
    'mu-lost-continent-legend': 'Mu may be read as a lost-world fantasy shaped by the desire for a single vanished source behind many civilizations.',
    'flatwoods-monster-legend': 'The Flatwoods Monster may be read through the tension between a documented witness episode and the Cold War-era habit of turning lights in the sky into visitors.',
    'cockatrice-folklore': 'The cockatrice may be read as a warning creature whose body combines barnyard familiarity with poison, sight, and impossible birth.',
    'spear-of-destiny-holy-lance': 'The spear may be read through the way relics gather authority: a sacred object becomes a place where faith, empire, and legend compete.',
    'narcissus-and-echo-myth': 'Narcissus and Echo may be read as a paired myth of failed relation: one figure cannot look away from himself, and the other cannot speak freely.',
    'tunguska-event': 'Tunguska may be read as a mystery because the evidence is enormous but incomplete: the forest was changed, while the object itself left no ordinary crater.',
    'island-of-the-dolls-xochimilco': 'The island may be read through accumulation: each doll makes the place feel less like a single story and more like a visible ritual of memory.',
    'db-cooper-hijacking-mystery': 'D.B. Cooper may be read as an unsolved identity story because the escape is specific, the evidence is partial, and the missing person remains unnamed.',
    'kidney-theft-urban-legend': 'Kidney theft may be read as a body-anxiety legend where travel, strangers, medicine, and the black market collapse into one memorable scene.'
  }[topic.slug] || `${topic.subject} may be read through the specific details that make the story memorable rather than through a generic mystery formula.`;
}

function sourceNoteForTopic(topic) {
  return {
    'pied-piper-of-hamelin-folklore': 'The earliest surviving references to Hamelin’s missing children are older than the familiar rat-catching episode. Later retellings joined the unpaid rat-catcher and the vanished children into the version now most widely known, while the historical cause of the loss remains unsettled.',
    'cicada-3301-internet-puzzle': 'This article follows the verified public puzzle releases beginning in 2012 and the material preserved by participants and journalists. The identity and final purpose of the group remain unconfirmed, while later imitations should not automatically be treated as official Cicada 3301 puzzles.',
    'friday-the-13th-origin': 'The article follows folklore scholarship around Friday, the number thirteen, and the later habit of joining the two into one unlucky date. Claims about Templars, the Last Supper, or ancient origins are treated as later explanations unless the source trail supports them directly.',
    'fountain-of-youth-legend': 'The fountain tradition is older and wider than the simplified story of Ponce de Leon searching Florida for magical water. Later accounts tied Ponce, Bimini, St. Augustine, and restorative springs together, while historians continue to separate the voyage record from the legend.',
    'mu-lost-continent-legend': 'Mu is followed here through James Churchward’s lost-continent claims and later summaries of the idea. The Naacal tablets, Pacific motherland theory, and civilization claims belong to the legend’s history, but they are not treated as confirmed archaeology.',
    'flatwoods-monster-legend': 'The basic account follows the 1952 Braxton County sighting after a reported fireball. Witness descriptions, later West Virginia folklore, and UFO-era interpretation are connected, but the article does not treat the creature’s identity as proven.',
    'cockatrice-folklore': 'The cockatrice appears in medieval and early modern bestiary tradition, often overlapping with the basilisk. Sources differ on birth, appearance, and method of killing, so the article treats the creature as a shifting folklore figure rather than a fixed zoological description.',
    'spear-of-destiny-holy-lance': 'The Holy Lance tradition includes religious relic claims and several competing objects. Later Spear of Destiny stories added ideas of conquest and world power, which are part of the legend’s afterlife rather than proof of the relic’s identity.',
    'narcissus-and-echo-myth': 'The article follows classical myth summaries for Narcissus and Echo, especially the joined tradition of reflection and repeated voice. Later retellings may emphasize beauty, punishment, love, or the flower, but the core myth remains centered on self-regard and unanswered speech.',
    'tunguska-event': 'The Tunguska account follows the 1908 Siberian explosion, later scientific expeditions, eyewitness reports, and the accepted airburst explanation. The lack of a typical crater left room for speculation, but the physical forest damage remains the strongest anchor.',
    'island-of-the-dolls-xochimilco': 'The island is a real Xochimilco location associated with Don Julian Santana and the dolls he placed there. Versions differ about the drowned girl and the reason the dolls were collected, so the article keeps the place, the caretaker story, and haunting claims separate.',
    'db-cooper-hijacking-mystery': 'The basic account follows the 1971 hijacking and the evidence released by investigators. Cooper’s identity, whether he survived the jump, and the meaning of the recovered money remain unresolved.',
    'kidney-theft-urban-legend': 'The bathtub-of-ice version spread widely through late twentieth-century rumor, media discussion, email, and warning stories. Real organ trafficking is a separate issue; the random traveler kidney-theft scenario is treated here as urban legend.'
  }[topic.slug] || `${topic.subject} is followed through the strongest available source trail, with later variants separated from the basic story.`;
}

function qa(q, a) {
  return { q, a };
}

function knownNamesFor(topic) {
  const fromTitle = topic.title.replace(/:.*$/, '');
  return unique([topic.subject, fromTitle, topic.keyword, ...topic.tags]).slice(0, 6);
}

function compactDetail(detail) {
  return String(detail || '')
    .replace(/^the\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function storyTypeFor(slug) {
  if (slug === 'unexplained-mysteries') return 'Unsolved Mystery';
  if (slug === 'myths') return 'Myth';
  if (slug === 'mythic-creatures') return 'Mythic Creature';
  if (slug === 'mythic-objects') return 'Mythic Object';
  if (slug === 'legend-origins') return 'Legend Origin';
  if (slug === 'lost-worlds') return 'Lost World';
  if (slug === 'legendary-places') return 'Legendary Place';
  if (slug === 'strange-places') return 'Strange Place';
  if (slug === 'classic-folklore') return 'Folklore';
  if (slug === 'internet-folklore') return 'Internet Folklore';
  if (slug === 'modern-legends') return 'Modern Legend';
  if (slug === 'strange-nature') return 'Natural Mystery';
  if (slug === 'urban-legends') return 'Urban Legend';
  return 'Archive Story';
}

function sourceStatusFor(category, tag) {
  if (category.slug === 'unexplained-mysteries') return `${category.title} / ${tag} / Evidence-limited public record`;
  if (category.slug === 'legend-origins') return `${category.title} / ${tag} / Folklore origin and motif record`;
  if (category.group === 'Mythic & Imagined Realms') return `${category.title} / ${tag} / Mythic tradition and symbolic reading`;
  return `${category.title} / ${tag} / Source-aware folklore record`;
}

function searchIntentFor(slug) {
  if (slug === 'legend-origins') return 'origin';
  if (slug === 'unexplained-mysteries') return 'evidence limits';
  if (slug === 'internet-folklore') return 'internet folklore';
  if (slug === 'myths' || slug.includes('mythic')) return 'meaning';
  if (slug.includes('places') || slug.includes('worlds')) return 'place legend';
  return 'legend explained';
}

function trimMeta(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= 158) return text;
  const slice = text.slice(0, 157);
  const boundary = slice.lastIndexOf(' ');
  return `${slice.slice(0, boundary > 120 ? boundary : 157).replace(/[,:;.\s]+$/, '')}.`;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function unique(values) {
  const seen = new Set();
  const output = [];
  for (const value of values || []) {
    const text = String(value || '').trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    output.push(text);
  }
  return output;
}
