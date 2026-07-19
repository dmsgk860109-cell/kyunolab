const fs = require('fs');
const path = require('path');
const { buildContentDNA } = require('./article-dna-utils');
const { buildPublicArticlePlan } = require('./public-article-plan');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const categoriesPath = path.join(root, 'data', 'categories.json');
const publishedAt = '2026-07-19';

const stories = readJson(storiesPath);
const categories = readJson(categoriesPath);
const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
const storySlugs = new Set(stories.map((story) => story.slug));
const existingQueries = new Set(
  stories
    .map((story) => story.contentDNA?.canonicalQuery || story.primaryKeyword || story.seedKeyword)
    .filter(Boolean)
    .map((query) => normalize(query))
);

const topics = [
  topic({
    categorySlug: 'urban-legends',
    slug: 'clown-statue-urban-legend',
    title: 'Clown Statue Urban Legend: Babysitter, Unwanted Object, and the Figure in the Room',
    subject: 'Clown Statue',
    tag: 'Babysitter Legend',
    tags: ['Babysitter Legend', 'Clown Statue', 'Urban Legend', 'Home Intruder'],
    keyword: 'clown statue urban legend',
    detail: 'the babysitter legend in which a clown statue in the house turns out not to be a statue at all',
    sourceBasis: 'urban legend scholarship, babysitter horror variants, and modern oral and online retellings',
    evidence: 'urban legend summaries, folklore indexes, circulating babysitter variants, and source-limited modern retellings',
    vocabulary: ['clown statue', 'babysitter', 'home intruder', 'phone call', 'urban legend'],
    sources: [
      source('Snopes - Clown Statue', 'https://www.snopes.com/fact-check/the-clown-statue/', 'Supports the legend frame and the caution that the story circulates as urban legend rather than verified incident.'),
      source('TV Tropes - Clown Doll', 'https://tvtropes.org/pmwiki/pmwiki.php/Main/CreepyDoll', 'Supports the wider creepy object motif and later media reception around doll and statue fear.')
    ],
    quickAnswer: [
      'The Clown Statue is a modern urban legend about a babysitter who notices a clown statue or doll in the house, only to learn that the family does not own one. The object becomes frightening because it has been present in the room while being treated as harmless.',
      'Different versions change the phone call, the room, the child, and whether the figure is a criminal, escaped patient, or unknown intruder. The legend may be read as a story about domestic safety failing inside a place that should feel controlled.'
    ],
    intro: [
      'The Clown Statue legend begins with a small mistake in perception. Someone sees an object and accepts it as decoration.',
      'The fear arrives when that object is reclassified. It was never part of the house. It was watching from inside it.'
    ],
    core: [
      'In the familiar version, a babysitter is alone with children and asks the parents if a clown statue can be covered or moved. The parents respond that there is no clown statue in the house.',
      'That answer changes the entire room. What looked like an uncomfortable object becomes a person, or at least a presence, that should not be there.'
    ],
    context: [
      'The story belongs to a wider family of babysitter legends where the danger is already inside the house. Like the man upstairs motif, the call or discovery does not bring the threat in; it reveals that the threat was already close.',
      'The clown detail works because clowns can be read as playful and frightening at the same time. The figure can hide in plain sight by pretending to be something meant for children.'
    ],
    variants: [
      'Later versions differ around the figure identity. Some make it an escaped criminal, some a stalker, and some leave the identity unexplained.',
      'Some versions use a doll, mannequin, decoration, or statue. The exact object changes, but the core fear remains the same: an ordinary room has accepted a stranger as furniture.'
    ],
    record: [
      'The Clown Statue can be documented as an urban legend pattern, not as one confirmed event. The story appears in oral retellings, online posts, warning-style summaries, and horror lists.',
      'A careful reading should not invent a verified family, police report, or original incident. The power of the story is in the circulating pattern rather than a single proven case.'
    ],
    meaning: [
      'The legend may be read as a fear of misrecognition. The babysitter is responsible for safety, but the room itself has already fooled her.',
      'That is why the story remains effective. It turns decoration into surveillance and makes the safest part of the house feel unreadable.'
    ],
    related: ['babysitter-and-the-man-upstairs', 'killer-in-the-backseat-legend', 'black-eyed-children-doorway-legend'],
    sourceNote: 'This article follows the Clown Statue as a modern babysitter urban legend. No single verified incident is treated as the origin unless the source trail supports it.'
  }),
  topic({
    categorySlug: 'internet-folklore',
    slug: 'this-man-dream-hoax',
    title: 'This Man Dream Hoax: The Face, the Website, and the Internet Legend of Shared Dreams',
    subject: 'This Man',
    tag: 'Internet Hoax',
    tags: ['Internet Hoax', 'This Man', 'Dream Legend', 'Viral Mystery'],
    keyword: 'this man dream hoax',
    detail: 'the viral internet legend claiming that thousands of people saw the same unknown face in dreams',
    sourceBasis: 'internet folklore reporting, viral hoax documentation, and later discussion of dream-sharing legends',
    evidence: 'web archives, internet culture summaries, reporting on the campaign, and later digital folklore analysis',
    vocabulary: ['This Man', 'dreams', 'face', 'internet legend', 'shared dreams'],
    sources: [
      source('Know Your Meme - This Man', 'https://knowyourmeme.com/memes/this-man', 'Supports the viral history, image circulation, and hoax framing.'),
      source('Vice - This Man', 'https://www.vice.com/en/article/4w5pdg/this-man-dreams-mystery/', 'Supports public reporting around the website, dream claim, and later explanation as an internet campaign.')
    ],
    quickAnswer: [
      'This Man is an internet legend built around a composite-looking face and the claim that many unrelated people had seen him in dreams. The story spread through posters, websites, forums, and image sharing.',
      'The subject is usually treated as a hoax or viral art campaign, but it remains important as internet folklore. It may be read as a digital version of an old fear: that private dreams might not be private after all.'
    ],
    intro: [
      'This Man looks simple at first: a face, a question, and a claim that strangers have dreamed him before.',
      'The image worked because it felt almost familiar. That almost is where the legend lives.'
    ],
    core: [
      'The central claim says that people around the world recognized the same man from their dreams. The face was circulated with the question of whether viewers had seen him too.',
      'The legend depends on recognition without proof. A viewer does not need to believe the claim fully to feel the unease of a face that seems remembered.'
    ],
    context: [
      'This Man spread during a period when viral websites and forum mysteries could blur art project, hoax, and sincere rumor. The website format made the claim look documented even when the evidence was thin.',
      'The story also fits older motifs of shared visions, prophetic dreams, and uncanny strangers. The internet simply gave the motif a face and a distribution system.'
    ],
    variants: [
      'Later versions differ around whether This Man is a real person, a psychological archetype, a supernatural figure, or a deliberate hoax.',
      'Some reposts removed the campaign context and treated the image as a free-floating mystery. That separation helped the legend continue after the original explanation became available.'
    ],
    record: [
      'The strongest record supports This Man as a viral internet phenomenon, not as proof that one person entered thousands of dreams.',
      'Web pages, meme documentation, and reporting can show circulation. They cannot confirm the dream claims as literal shared experience.'
    ],
    meaning: [
      'This Man may be read as a story about pattern recognition. The face is ordinary enough to feel possible and strange enough to feel misplaced.',
      'The legend lasts because dreams are private evidence. No one else can fully inspect them, so the story gives uncertainty a human face.'
    ],
    related: ['cicada-3301-internet-puzzle', 'momo-challenge-internet-rumor', 'cursed-image-that-kept-being-shared'],
    sourceNote: 'This article follows This Man as an internet hoax and viral dream legend. Later versions should stay separate from the documented web campaign and its reception.'
  }),
  topic({
    categorySlug: 'strange-places',
    slug: 'bhangarh-fort-legend',
    title: 'Bhangarh Fort Legend: Ruins, Warnings, and the Haunted Place Story of Rajasthan',
    subject: 'Bhangarh Fort',
    tag: 'Haunted Fort',
    tags: ['Haunted Fort', 'Bhangarh', 'Rajasthan', 'Strange Place'],
    keyword: 'bhangarh fort legend',
    detail: 'the haunted-place legend surrounding the ruined Bhangarh Fort in Rajasthan',
    sourceBasis: 'Indian travel writing, heritage summaries, local legend retellings, and haunted-place folklore',
    evidence: 'public heritage descriptions, travel accounts, local legends, and source-limited haunted-place summaries',
    vocabulary: ['Bhangarh Fort', 'Rajasthan', 'ruins', 'haunted fort', 'local legend'],
    sources: [
      source('Rajasthan Tourism - Bhangarh', 'https://www.tourism.rajasthan.gov.in/', 'Supports the public heritage and tourism context for Bhangarh Fort.'),
      source('Atlas Obscura - Bhangarh Fort', 'https://www.atlasobscura.com/places/bhangarh-fort', 'Supports the haunted-place reception and travel-story framing around the fort.')
    ],
    quickAnswer: [
      'Bhangarh Fort is a ruined fort in Rajasthan widely associated with haunted-place legends. Retellings connect the site with curses, forbidden nighttime entry, and stories of a settlement that became abandoned.',
      'The fort is real, but the haunting claims belong to local legend and travel folklore. The subject may be read as a place where ruins, warning signs, and repeated retellings make absence feel active.'
    ],
    intro: [
      'Bhangarh Fort is not only remembered as stone and ruin. It is remembered as a place people are warned about.',
      'That warning gives the fort its second life. The story begins where architecture ends and imagination enters the empty rooms.'
    ],
    core: [
      'The popular legend presents Bhangarh as a cursed or haunted fort. Visitors hear that the place should not be entered after dark and that the abandoned settlement carries a dangerous memory.',
      'Different tellings add a princess, a magician, a curse, or a doomed town. These details give the ruin a narrative cause for its silence.'
    ],
    context: [
      'Haunted-place legends often gather around ruins because ruins already look like interrupted stories. A broken wall invites questions before any supernatural claim is added.',
      'Bhangarh works especially well as a legend because it is visible, visitable, and framed by caution. The place is real enough to stand in, but the story asks what might remain after people leave.'
    ],
    variants: [
      'Later versions differ around the curse, the names involved, and the reason the site became dangerous. Some emphasize romance, some sorcery, and some the official warning against nighttime entry.',
      'Those versions should not be collapsed into one confirmed history. They show how a location becomes more legendary as stories explain its emptiness.'
    ],
    record: [
      'The public record can support Bhangarh as a historic ruin and a famous haunted-place destination. It cannot verify every curse story or supernatural claim.',
      'A source-aware reading keeps the fort, the warnings, and the tourist folklore visible without turning legend into proof.'
    ],
    meaning: [
      'Bhangarh may be read as a story about the authority of ruins. Empty buildings can feel like witnesses even when they say nothing.',
      'That is why the legend endures. The fort does not need to move. Its silence gives the story room to speak.'
    ],
    related: ['hoia-baciu-forest', 'winchester-mystery-house', 'catacombs-of-paris-legends'],
    sourceNote: 'This article follows Bhangarh Fort as a real place with haunted-place folklore attached to it. Later versions of the curse story are treated as legend unless supported by stronger sources.'
  }),
  topic({
    categorySlug: 'unexplained-mysteries',
    slug: 'taos-hum-mystery',
    title: 'Taos Hum Mystery: Low Sound, Witness Reports, and the Noise No One Fully Explains',
    subject: 'Taos Hum',
    tag: 'Unexplained Sound',
    tags: ['Unexplained Sound', 'Taos Hum', 'New Mexico', 'Acoustic Mystery'],
    keyword: 'taos hum mystery',
    detail: 'the low-frequency hum reported by some residents and visitors around Taos, New Mexico',
    sourceBasis: 'public reporting, acoustics discussion, witness accounts, and evidence-limited mystery summaries',
    evidence: 'news reports, local accounts, scientific discussion of hum phenomena, and source-limited witness patterns',
    vocabulary: ['Taos Hum', 'low sound', 'New Mexico', 'witnesses', 'hum'],
    sources: [
      source('Live Science - Taos Hum', 'https://www.livescience.com/43519-taos-hum.html', 'Supports the public description of the hum, witness pattern, and uncertainty around causes.'),
      source('New Mexico Magazine - The Taos Hum', 'https://www.newmexicomagazine.org/', 'Supports the regional identity and reporting context around the Taos Hum.')
    ],
    quickAnswer: [
      'The Taos Hum is a reported low sound heard by some people around Taos, New Mexico. Witnesses describe a persistent hum, drone, or vibration that not everyone can hear.',
      'Several explanations have been proposed, including machinery, environmental sound, individual hearing differences, and acoustic conditions. The mystery may be read as an evidence-limited case where subjective experience and measurement do not fully meet.'
    ],
    intro: [
      'The Taos Hum is difficult because it begins with something ordinary: a sound.',
      'But the sound becomes strange when some people hear it clearly and others hear nothing at all.'
    ],
    core: [
      'Reports describe a low hum, often compared to machinery or a distant engine. Some hear it indoors, some outdoors, and some experience it as vibration as much as sound.',
      'The uneven witness pattern is central. A mystery built from sound depends on who can hear, when they can hear, and whether instruments can match the report.'
    ],
    context: [
      'The Taos Hum belongs to a wider group of hum reports from different places. These cases often combine local attention, environmental possibility, and personal perception.',
      'Taos became one of the best-known examples because the reports attached to a specific place and entered public discussion as a named phenomenon.'
    ],
    variants: [
      'Later versions differ around the source. Some blame industrial activity, some underground facilities, some natural conditions, and some biological sensitivity.',
      'The strongest summaries keep those explanations separate. One explanation may account for some reports without solving every individual experience.'
    ],
    record: [
      'The record can support that people have reported hearing a hum and that investigators have discussed possible causes. It cannot prove one universal hidden source.',
      'This distinction matters because sound mysteries are easy to overstate. Witness testimony is important, but sound perception can be difficult to verify after the fact.'
    ],
    meaning: [
      'The Taos Hum may be read as a mystery about mismatch. A person hears something real to them, while the surrounding world does not always confirm it.',
      'That tension gives the case its staying power. It sits between environment, body, machine, and place.'
    ],
    related: ['wow-signal-mystery', 'hessdalen-lights', 'bermuda-triangle-mystery'],
    sourceNote: 'This article follows the Taos Hum through public reports and source-limited discussion. Later versions should not be treated as proof of one hidden source.'
  }),
  topic({
    categorySlug: 'classic-folklore',
    slug: 'green-children-woolpit-folklore',
    title: 'Green Children of Woolpit: Medieval Wonder, Strange Arrival, and the Folklore of Two Children',
    subject: 'Green Children of Woolpit',
    tag: 'Medieval Wonder',
    tags: ['Medieval Wonder', 'Green Children', 'Woolpit', 'English Folklore'],
    keyword: 'green children of woolpit',
    detail: 'the medieval English story of two green-skinned children who appeared near Woolpit and spoke an unknown language',
    sourceBasis: 'medieval chronicle tradition, English folklore summaries, and later historical interpretations',
    evidence: 'medieval written accounts, folklore discussion, historical theories, and later retellings',
    vocabulary: ['Green Children', 'Woolpit', 'St Martin\'s Land', 'medieval wonder', 'English folklore'],
    sources: [
      source('Historic UK - Green Children of Woolpit', 'https://www.historic-uk.com/CultureUK/Green-Children-of-Woolpit/', 'Supports the core story, medieval setting, and common historical interpretations.'),
      source('Encyclopaedia Britannica - Woolpit', 'https://www.britannica.com/place/Woolpit', 'Supports the location context for Woolpit and its place in English geography.')
    ],
    quickAnswer: [
      'The Green Children of Woolpit is a medieval English story about two children with green skin who appeared near Woolpit, spoke an unknown language, and at first would eat only beans.',
      'Later explanations range from folklore and fairyland to historical theories about lost children, illness, or displacement. The story may be read as a medieval wonder tale about strangers who arrive from a place no one can map.'
    ],
    intro: [
      'The Green Children of Woolpit begins like a record of discovery. Two children appear where they should not be.',
      'Their skin, speech, and food make them difficult to place. That difficulty is the story.'
    ],
    core: [
      'The common account says that a boy and girl were found near Woolpit in Suffolk. Their skin was green, their language was unfamiliar, and they resisted ordinary food before accepting beans.',
      'In many tellings, the boy dies while the girl survives, loses the green color, learns the local language, and describes a dim place often called St Martin\'s Land.'
    ],
    context: [
      'Medieval wonder stories often place the strange beside the ordinary. Woolpit is a real village, but the children seem to come from a world that cannot be located with normal geography.',
      'That combination gives the tale its force. It is not a fairy story floating nowhere; it is a wonder attached to a named English place.'
    ],
    variants: [
      'Later versions differ around the children origin, the meaning of their green skin, and whether St Martin\'s Land should be read literally, symbolically, or as a misunderstood human place.',
      'Some explanations focus on disease, diet, Flemish refugees, or local conflict. Others preserve the tale as folklore of otherworldly arrival.'
    ],
    record: [
      'The story is supported as a medieval written tradition and later folklore subject. It is not supported as a fully solved historical case.',
      'A careful reading keeps the chronicled tale visible while avoiding a single modern explanation that erases its uncertainty.'
    ],
    meaning: [
      'The Green Children may be read as a story about encountering strangers before having language to explain them.',
      'The tale lasts because the children are both human and unreadable. They are close enough to feed, but far enough away to remain mysterious.'
    ],
    related: ['changeling-folklore', 'pied-piper-of-hamelin-folklore', 'will-o-the-wisp-folklore'],
    sourceNote: 'This article follows the Green Children of Woolpit through medieval and later folklore tradition. Later explanations remain possible readings, not settled proof.'
  }),
  topic({
    categorySlug: 'modern-legends',
    slug: 'beast-of-bray-road-legend',
    title: 'Beast of Bray Road: Wisconsin Sightings, Werewolf Shape, and a Modern Monster Legend',
    subject: 'Beast of Bray Road',
    tag: 'Modern Cryptid',
    tags: ['Modern Cryptid', 'Beast of Bray Road', 'Wisconsin', 'Werewolf Legend'],
    keyword: 'beast of bray road',
    detail: 'the Wisconsin modern legend of a wolf-like or werewolf-like creature reported near Bray Road',
    sourceBasis: 'regional reporting, cryptid folklore summaries, witness-story patterns, and modern monster legend discussion',
    evidence: 'newspaper reporting, local accounts, cryptid summaries, and source-limited sighting narratives',
    vocabulary: ['Beast of Bray Road', 'Wisconsin', 'werewolf', 'creature', 'reports'],
    sources: [
      source('Milwaukee Magazine - Beast of Bray Road', 'https://www.milwaukeemag.com/', 'Supports the regional reporting and Wisconsin folklore context.'),
      source('Wisconsin Frights - Beast of Bray Road', 'https://www.wisconsinfrights.com/', 'Supports the local monster legend and retelling history.')
    ],
    quickAnswer: [
      'The Beast of Bray Road is a modern Wisconsin legend about a wolf-like or werewolf-like creature reported near Bray Road and the Elkhorn area. Witnesses describe a large animal or upright figure with canine features.',
      'The story is best handled as modern monster folklore built from sightings, media attention, and local memory. It may be read as a roadside cryptid legend rather than a confirmed biological discovery.'
    ],
    intro: [
      'The Beast of Bray Road begins on a road, not in an ancient forest.',
      'That modern setting matters. The creature appears beside cars, farms, fields, and local reports, which makes the old werewolf shape feel near again.'
    ],
    core: [
      'Reports often describe a large wolf-like creature, sometimes moving on four legs and sometimes in a more upright shape. The road setting turns a drive into a sighting space.',
      'The figure is frightening because it refuses a simple category. It can be read as animal, monster, misidentification, or something shaped by older werewolf imagery.'
    ],
    context: [
      'The legend became widely known through regional reporting and later cryptid culture. Local roads and named places helped give the story a map.',
      'Modern monster legends often grow when witnesses, journalists, and later enthusiasts repeat the same image through different forms.'
    ],
    variants: [
      'Later versions differ around size, posture, behavior, and whether the creature is called a werewolf, dogman, wolf creature, or unknown animal.',
      'Those labels matter because each one pulls the story toward a different tradition. A dogman story is not exactly the same as a werewolf story, even when they overlap.'
    ],
    record: [
      'The record can support that sightings were reported and that the Beast of Bray Road became a recognizable regional legend. It cannot confirm a new species or supernatural creature.',
      'The useful question is how the reports gathered into a shared figure that people can name.'
    ],
    meaning: [
      'The Beast of Bray Road may be read as a modern werewolf legend adapted to rural roads and local media.',
      'It lasts because it brings an old fear into a place that feels ordinary enough to drive past.'
    ],
    related: ['flatwoods-monster-legend', 'bigfoot-legend', 'chupacabra-legend'],
    sourceNote: 'This article follows the Beast of Bray Road as a regional modern monster legend. Later versions should remain separate from confirmed wildlife records.'
  }),
  topic({
    categorySlug: 'myths',
    slug: 'phaethon-sun-chariot-myth',
    title: 'Phaethon Sun Chariot Myth: Fire, Fall, and the Danger of Driving the Sun',
    subject: 'Phaethon',
    tag: 'Greek Myth',
    tags: ['Greek Myth', 'Phaethon', 'Sun Chariot', 'Fall Myth'],
    keyword: 'phaethon sun chariot myth',
    detail: 'the Greek myth of Phaethon driving the chariot of the sun and losing control of its fire',
    sourceBasis: 'Greek and Roman myth summaries, classical literary tradition, and later symbolic interpretation',
    evidence: 'classical myth references, Ovidian retelling, mythology summaries, and later artistic reception',
    vocabulary: ['Phaethon', 'Apollo', 'sun chariot', 'fire', 'fall'],
    sources: [
      source('Theoi - Phaethon', 'https://www.theoi.com/Titan/Phaethon.html', 'Supports the classical myth summaries, names, and source references around Phaethon.'),
      source('Encyclopaedia Britannica - Phaethon', 'https://www.britannica.com/topic/Phaethon-Greek-mythology', 'Supports the basic identity of Phaethon and the sun-chariot episode.')
    ],
    quickAnswer: [
      'Phaethon is a Greek mythic figure who asks to drive the chariot of the sun and loses control. The burning path threatens the world until Zeus strikes him down.',
      'The myth may be read as a story about proof, inheritance, dangerous power, and the cost of taking a role before understanding its weight.'
    ],
    intro: [
      'Phaethon wants proof of who he is. The proof he asks for is too large for him to carry.',
      'That is why the myth moves so quickly from desire to disaster.'
    ],
    core: [
      'In the familiar story, Phaethon seeks confirmation that he is the child of the sun god. He asks to drive the sun chariot for one day.',
      'Once he takes the reins, the horses bolt and the path of the sun breaks. The earth burns, the sky is endangered, and Zeus ends the disaster with a thunderbolt.'
    ],
    context: [
      'The myth survives strongly through classical retellings, especially Roman literary tradition. It gives cosmic order a visible vehicle and makes divine power dangerously practical.',
      'Phaethon is not simply foolish. His desire begins with identity, recognition, and the need to be believed.'
    ],
    variants: [
      'Later versions differ around names, emphasis, and the emotional weight of Phaethon request. Some stress pride, some youth, and some the tragedy of a promise granted too completely.',
      'Different retellings also connect the aftermath with mourning sisters, amber, and the shape of rivers or lands affected by the fire.'
    ],
    record: [
      'The record can support Phaethon as a classical mythic subject with a long literary and artistic afterlife. It cannot be treated as a historical sky event without leaving mythic interpretation.',
      'The useful source boundary is clear: this is a myth about cosmic danger, not a verified report of a literal chariot.'
    ],
    meaning: [
      'Phaethon may be read as a warning about power without mastery. The chariot is proof, but it is also responsibility.',
      'The myth lasts because it makes overreach visible. The sky itself becomes the place where a private need becomes public disaster.'
    ],
    related: ['icarus-myth', 'prometheus-fire-myth', 'narcissus-and-echo-myth'],
    sourceNote: 'This article follows Phaethon through classical myth and later retellings. Later versions should be read as mythic interpretation, not as historical astronomy.'
  }),
  topic({
    categorySlug: 'mythic-creatures',
    slug: 'basilisk-folklore',
    title: 'Basilisk Folklore: Deadly Gaze, Serpent King, and the Creature No One Should Meet',
    subject: 'Basilisk',
    tag: 'Mythic Reptile',
    tags: ['Mythic Reptile', 'Basilisk', 'Deadly Gaze', 'Bestiary'],
    keyword: 'basilisk folklore',
    detail: 'the basilisk tradition of a deadly serpent or serpent-like king whose gaze, breath, or presence can kill',
    sourceBasis: 'classical natural history, medieval bestiary tradition, and later monster folklore',
    evidence: 'classical references, bestiary summaries, medieval monster tradition, and later literary reception',
    vocabulary: ['basilisk', 'deadly gaze', 'serpent king', 'bestiary', 'monster folklore'],
    sources: [
      source('Encyclopaedia Britannica - Basilisk', 'https://www.britannica.com/topic/basilisk-mythological-creature', 'Supports the mythic creature definition and deadly gaze tradition.'),
      source('The Medieval Bestiary - Basilisk', 'https://bestiary.ca/beasts/beast262.htm', 'Supports medieval bestiary descriptions and symbolic reception.')
    ],
    quickAnswer: [
      'The basilisk is a mythic creature often described as a deadly serpent or serpent-like king whose gaze, breath, or touch can kill. Medieval and later traditions sometimes blend it with rooster-serpent imagery related to the cockatrice.',
      'The basilisk may be read as a creature of forbidden sight. Its danger is not only that it attacks, but that seeing it can already be too late.'
    ],
    intro: [
      'The basilisk is frightening because it makes looking dangerous.',
      'Many monsters must reach you. The basilisk only has to be seen.'
    ],
    core: [
      'In classical and medieval tradition, the basilisk is associated with deadly force carried through sight, breath, venom, or presence. It is sometimes called a king of serpents.',
      'The creature becomes more elaborate in later bestiary and monster lore, where its form can shift between serpent, rooster-serpent, and related deadly hybrids.'
    ],
    context: [
      'Basilisk lore sits between natural history, moral symbolism, and monster catalog. Older writers often treated strange animals and symbolic creatures in the same descriptive space.',
      'That is why the basilisk can feel both zoological and impossible. It belongs to a world where observation, warning, and allegory are not fully separated.'
    ],
    variants: [
      'Later versions differ around whether the basilisk kills by gaze, breath, touch, or venom. Some versions also merge basilisk and cockatrice traits.',
      'Those differences should remain visible because the creature history is a chain of descriptions, translations, and retellings rather than one fixed species profile.'
    ],
    record: [
      'The record can support the basilisk as a long-lived mythic and bestiary creature. It cannot support the creature as a confirmed animal.',
      'The creature remains dangerous as folklore while symbolic bestiary tradition stays separate from biological claim.'
    ],
    meaning: [
      'The basilisk may be read as a monster of knowledge and danger. To know it directly is to risk harm.',
      'That is why it remains useful in fantasy and folklore. It turns sight itself into a threshold.'
    ],
    related: ['cockatrice-folklore', 'dragons-across-the-world', 'kappa-japanese-folklore'],
    sourceNote: 'This article follows the basilisk through classical and medieval creature tradition. Later versions should keep basilisk and cockatrice overlap visible without flattening them into one creature.'
  }),
  topic({
    categorySlug: 'lost-worlds',
    slug: 'agartha-hollow-earth-legend',
    title: 'Agartha Hollow Earth Legend: Hidden Realm, Inner World, and the Geography Beneath the Map',
    subject: 'Agartha',
    tag: 'Hidden World',
    tags: ['Hidden World', 'Agartha', 'Hollow Earth', 'Lost World'],
    keyword: 'agartha hollow earth legend',
    detail: 'the esoteric hidden-world legend of Agartha or Agharta as an inner realm beneath the earth',
    sourceBasis: 'esoteric writing, hollow-earth reception, lost-world folklore, and later occult geography',
    evidence: 'nineteenth and twentieth century esoteric summaries, hollow-earth literature, and source-limited reception history',
    vocabulary: ['Agartha', 'Agharta', 'Hollow Earth', 'hidden realm', 'inner world'],
    sources: [
      source('Encyclopaedia Britannica - Hollow Earth', 'https://www.britannica.com/topic/hollow-Earth-theory', 'Supports the wider hollow-earth theory context.'),
      source('Theosophy Wiki - Agartha', 'https://theosophy.wiki/en/Agartha', 'Supports esoteric reception and variant naming around Agartha.')
    ],
    quickAnswer: [
      'Agartha, also spelled Agharta in some sources, is a hidden-world legend often connected with hollow-earth and esoteric geography. It is imagined as an inner realm, secret civilization, or spiritual center beneath ordinary maps.',
      'The legend may be read as a lost-world story about hidden order. It belongs to esoteric reception and speculative geography rather than confirmed exploration.'
    ],
    intro: [
      'Agartha moves the lost world downward. The unknown place is not across the sea, but beneath the surface.',
      'That shift makes the map feel incomplete in a different way. The blank space is under every known country.'
    ],
    core: [
      'The common idea presents Agartha or Agharta as a hidden inner realm. Some versions describe a secret civilization, spiritual center, or network beneath the earth.',
      'The story belongs to a family of hollow-earth and hidden-master ideas. It offers a geography where the unseen is not distant, but layered below the visible world.'
    ],
    context: [
      'Agartha developed through esoteric writing, occult geography, and later lost-world imagination. It should not be treated as the same thing as every hidden kingdom tradition.',
      'Its power comes from combining map, initiation, secrecy, and the dream of a civilization preserved from ordinary history.'
    ],
    variants: [
      'Later versions differ around spelling, location, rulers, tunnels, entrances, and spiritual meaning. Some connect Agartha with polar openings, underground cities, or secret adepts.',
      'These variations show reception history more than evidence. The legend changes as writers attach it to different worldviews.'
    ],
    record: [
      'The record can support Agartha as an esoteric and lost-world idea. It cannot support the hidden realm as confirmed geography.',
      'A careful reading keeps speculative maps and spiritual symbolism separate from factual claims about the earth.'
    ],
    meaning: [
      'Agartha may be read as a fantasy of hidden order beneath visible disorder. The deeper world promises meaning that the surface world lacks.',
      'That is why the legend keeps returning. It turns the unknown into a structure underfoot.'
    ],
    related: ['shambhala-hidden-kingdom', 'mu-lost-continent-legend', 'atlantis-lost-world'],
    sourceNote: 'This article follows Agartha through esoteric and hollow-earth reception. Later versions should be treated as speculative tradition, not verified geography.'
  }),
  topic({
    categorySlug: 'strange-nature',
    slug: 'green-flash-sunset-phenomenon',
    title: 'Green Flash at Sunset: Optical Phenomenon, Horizon Lore, and the Light People Wait For',
    subject: 'Green Flash',
    tag: 'Optical Phenomenon',
    tags: ['Optical Phenomenon', 'Green Flash', 'Sunset', 'Horizon'],
    keyword: 'green flash sunset phenomenon',
    detail: 'the brief green light sometimes seen near the sun at sunrise or sunset under specific atmospheric conditions',
    sourceBasis: 'atmospheric optics explanations, observational reports, maritime lore, and popular science summaries',
    evidence: 'NOAA and atmospheric optics explanations, observational photography, and source-aware nature folklore',
    vocabulary: ['green flash', 'sunset', 'atmospheric refraction', 'horizon', 'phenomenon'],
    sources: [
      source('NOAA - Green Flash', 'https://oceanservice.noaa.gov/facts/green-flash.html', 'Supports the optical explanation and viewing conditions for green flashes.'),
      source('Atmospheric Optics - Green Flash', 'https://atoptics.co.uk/atoptics/gf1.htm', 'Supports the atmospheric refraction and mirage explanation for different green flash types.')
    ],
    quickAnswer: [
      'The Green Flash is a brief optical phenomenon sometimes seen near the upper edge of the sun at sunrise or sunset. It is linked to atmospheric refraction and viewing conditions near a clear horizon.',
      'The phenomenon is real, but its rarity and timing have also made it part of horizon lore. It may be read as a case where science and wonder occupy the same instant of light.'
    ],
    intro: [
      'The Green Flash asks people to watch the edge of the day.',
      'Most sunsets end without it. That is part of the reason the flash feels like a sign when it appears.'
    ],
    core: [
      'The Green Flash appears as a brief green color at the top of the sun, often just before the sun disappears below a clear horizon or just as it rises.',
      'The effect is connected with refraction, dispersion, and atmospheric layering. It is not magic, but it can feel magical because it happens so quickly.'
    ],
    context: [
      'The phenomenon has long attracted sailors, photographers, sky watchers, and travelers. The ocean horizon is especially associated with reports because it gives a clean line of sight.',
      'Its place in lore comes from patience. People wait for an event that may last only a second.'
    ],
    variants: [
      'Later versions differ around color intensity, shape, viewing location, and whether people describe a flash, rim, or brief point of light.',
      'Some accounts turn the effect into a romantic or lucky sign. Those meanings belong to reception and folklore, not to the optical mechanism itself.'
    ],
    record: [
      'The record can support the Green Flash as an atmospheric optical phenomenon. Photographs and scientific explanations show that it is not only a rumor.',
      'At the same time, not every claimed green sunset is the same effect. Viewing conditions and perception matter.'
    ],
    meaning: [
      'The Green Flash may be read as a natural event that behaves like folklore because it demands timing, attention, and belief before proof.',
      'It lasts in imagination because it gives the horizon a small secret.'
    ],
    related: ['hessdalen-lights', 'marfa-lights-mystery', 'ball-lightning-folklore'],
    sourceNote: 'This article follows the Green Flash through atmospheric optics and horizon lore. Later symbolic meanings are kept separate from the optical explanation.'
  }),
  topic({
    categorySlug: 'legendary-places',
    slug: 'oracle-of-delphi-legend',
    title: 'Oracle of Delphi: Sacred Place, Prophecy, and the Voice Beneath Apollo',
    subject: 'Oracle of Delphi',
    tag: 'Sacred Site',
    tags: ['Sacred Site', 'Oracle of Delphi', 'Apollo', 'Prophecy'],
    keyword: 'oracle of delphi legend',
    detail: 'the ancient Greek sacred site where the Pythia delivered oracular responses associated with Apollo',
    sourceBasis: 'ancient Greek history, archaeological summaries, classical references, and later legendary reception',
    evidence: 'UNESCO context, classical references, archaeological summaries, and public history of Delphi',
    vocabulary: ['Delphi', 'Pythia', 'Apollo', 'oracle', 'sacred site'],
    sources: [
      source('UNESCO - Archaeological Site of Delphi', 'https://whc.unesco.org/en/list/393/', 'Supports the historical and sacred-site importance of Delphi.'),
      source('Encyclopaedia Britannica - Oracle of Delphi', 'https://www.britannica.com/topic/Oracle-of-Delphi', 'Supports the oracle, Apollo association, and Pythia context.')
    ],
    quickAnswer: [
      'The Oracle of Delphi was the most famous ancient Greek oracle, associated with Apollo and the priestess known as the Pythia. People came to Delphi seeking responses to political, personal, and religious questions.',
      'Delphi is a real archaeological and sacred site, but its legendary power comes from the way prophecy, ambiguity, authority, and landscape met there. It may be read as a place where speech became destiny.'
    ],
    intro: [
      'Delphi is a place where questions became dangerous.',
      'A response from the oracle could guide a city, unsettle a ruler, or become meaningful only after events had already turned.'
    ],
    core: [
      'The Oracle of Delphi centered on Apollo and the Pythia, who delivered responses to those who came seeking divine guidance.',
      'The answers were often remembered as powerful, ambiguous, or difficult to interpret. That ambiguity is one reason Delphi remains legendary.'
    ],
    context: [
      'Delphi was not only a story setting. It was a major sacred site in the Greek world, connected with ritual, offerings, politics, and pilgrimage.',
      'The physical place matters because the oracle was tied to mountain landscape, temple space, and the authority of Apollo.'
    ],
    variants: [
      'Later versions differ around how the Pythia entered her prophetic state, how responses were shaped, and how much later storytelling dramatized the process.',
      'Some popular accounts simplify Delphi into a mysterious gas or a single hidden mechanism. The ancient record is more layered than that.'
    ],
    record: [
      'The record can support Delphi as a major historical sanctuary and oracular site. It cannot reduce every prophecy story to one simple explanation.',
      'A careful reading keeps archaeology, ancient testimony, and later legend in conversation without flattening them.'
    ],
    meaning: [
      'Delphi may be read as a place where uncertainty became institutional. People came because they wanted an answer, but the answer often required interpretation.',
      'That is why Delphi remains one of the strongest legendary places. It makes the act of asking feel sacred.'
    ],
    related: ['mount-olympus-greek-myth', 'stonehenge-legends', 'glastonbury-tor-legends'],
    sourceNote: 'This article follows Delphi as a historical sacred site and legendary oracle. Later versions should keep archaeological context and mythic reception distinct.'
  }),
  topic({
    categorySlug: 'mythic-objects',
    slug: 'ring-of-gyges-myth',
    title: 'Ring of Gyges: Invisibility, Power, and the Mythic Object That Tests Justice',
    subject: 'Ring of Gyges',
    tag: 'Invisibility Object',
    tags: ['Invisibility Object', 'Ring of Gyges', 'Plato', 'Moral Myth'],
    keyword: 'ring of gyges myth',
    detail: 'the philosophical myth of a ring that makes its wearer invisible and tests whether justice survives without witnesses',
    sourceBasis: 'Platonic philosophy, moral myth tradition, classical reception, and later invisibility-object motifs',
    evidence: 'Plato Republic summaries, philosophy references, classical reception, and later symbolic use',
    vocabulary: ['Ring of Gyges', 'Plato', 'invisibility', 'justice', 'thought experiment'],
    sources: [
      source('Internet Encyclopedia of Philosophy - Plato', 'https://iep.utm.edu/republic/', 'Supports the Republic context and the moral argument around justice.'),
      source('Stanford Encyclopedia of Philosophy - Plato Ethics', 'https://plato.stanford.edu/entries/plato-ethics/', 'Supports the broader philosophical context for justice and virtue in Plato.')
    ],
    quickAnswer: [
      'The Ring of Gyges is a story in Plato Republic about a ring that grants invisibility. The tale asks whether a person would remain just if no one could see or punish them.',
      'The object may be read as a mythic test of character. Its power is not only invisibility, but the removal of social consequences.'
    ],
    intro: [
      'The Ring of Gyges is small, but the question it asks is enormous.',
      'What would a person do if no one could see them?'
    ],
    core: [
      'In the story, a shepherd obtains a ring that can make him invisible. With that power, he can act without being seen.',
      'The tale is used in a philosophical argument about justice. It asks whether moral behavior depends on being watched.'
    ],
    context: [
      'The Ring of Gyges appears in Plato Republic as part of a debate about whether justice is valued for itself or only for its rewards and reputation.',
      'That setting matters because the ring is not just a fantasy object. It is a thought experiment given the shape of a legend.'
    ],
    variants: [
      'Later versions differ in how much they treat the ring as magical object, moral symbol, or ancestor of later invisibility artifacts.',
      'In popular reception, the ring often becomes part of a wider tradition of objects that reveal hidden desire by removing restraint.'
    ],
    record: [
      'The record can support the Ring of Gyges as a classical philosophical myth. It cannot be treated as a relic tradition or historical artifact.',
      'A source-aware reading keeps the object inside its argument while still recognizing its later imaginative influence.'
    ],
    meaning: [
      'The Ring of Gyges may be read as a myth about witness. The question is not only what power allows, but what invisibility removes.',
      'That is why the object still matters. It turns ethics into a scene anyone can understand.'
    ],
    related: ['spear-of-destiny-holy-lance', 'excalibur-sword-legend', 'holy-grail-legend'],
    sourceNote: 'This article follows the Ring of Gyges through Plato and later moral-object reception. Later invisibility-object comparisons should remain separate from the original philosophical use.'
  }),
  topic({
    categorySlug: 'legend-origins',
    slug: 'black-cat-superstition-origin',
    title: 'Black Cat Superstition Origin: Luck, Witchcraft, and How an Animal Became an Omen',
    subject: 'Black Cat Superstition',
    tag: 'Superstition Origin',
    tags: ['Superstition Origin', 'Black Cat', 'Bad Luck', 'Witchcraft'],
    keyword: 'black cat superstition origin',
    detail: 'the changing folklore around black cats as signs of luck, bad luck, witchcraft, protection, or omen',
    sourceBasis: 'folklore summaries, superstition history, animal omen traditions, and cultural reception',
    evidence: 'folklore references, public history summaries, regional superstition variants, and animal-omen interpretation',
    vocabulary: ['black cat', 'superstition', 'bad luck', 'witchcraft', 'omen'],
    sources: [
      source('Encyclopaedia Britannica - Superstition', 'https://www.britannica.com/topic/superstition', 'Supports the wider superstition framework.'),
      source('History - Black Cats and Halloween', 'https://www.history.com/news/black-cats-superstitions', 'Supports common cultural-history summaries around black cats, witchcraft, and luck traditions.')
    ],
    quickAnswer: [
      'Black cat superstition does not have one single origin. Different cultures have treated black cats as bad luck, good luck, witchcraft companions, protectors, or omens depending on place and period.',
      'The superstition may be read as a case where animal color, night imagery, witchcraft fear, and household belief combined into a flexible omen.'
    ],
    intro: [
      'A black cat crossing a path can mean different things depending on who tells the story.',
      'That is the point. The animal stayed the same, but the meaning changed.'
    ],
    core: [
      'Black cat beliefs are not uniform. In some traditions they are unlucky, while in others they can be lucky, protective, or connected with prosperity.',
      'The negative version became especially strong where black cats were linked with witchcraft, night, secrecy, and misfortune.'
    ],
    context: [
      'Animal omens often work because they turn ordinary encounters into signs. A cat crossing a path becomes meaningful when people already believe the world gives warnings.',
      'Black fur adds visual force because it connects easily with night, hidden movement, and the unseen.'
    ],
    variants: [
      'Later versions differ by region. A black cat crossing from one side may be lucky in one place and unlucky in another.',
      'Some versions connect cats to witches or familiars. Others treat them as ship animals, household protectors, or signs of coming visitors.'
    ],
    record: [
      'The record can support black cat superstition as a widespread and varied folklore pattern. It cannot support one universal origin for every belief about black cats.',
      'A careful origin article should explain the layered history rather than forcing one explanation to cover every region.'
    ],
    meaning: [
      'Black cat superstition may be read as a story about how ordinary animals become signs. The cat is real, but the meaning is cultural.',
      'That is why the belief lasts. It is simple, portable, and easy to attach to a moment on a road or doorstep.'
    ],
    related: ['friday-the-13th-origin', 'why-mirrors-become-haunted-objects', 'how-a-warning-becomes-a-legend'],
    sourceNote: 'This article follows black cat superstition as a layered folklore origin, not a single fixed beginning. Later versions should be treated as regional variants.'
  })
];

const added = [];
const updated = [];

for (const plan of topics) {
  const category = categoryBySlug.get(plan.categorySlug);
  if (!category) throw new Error(`Missing category: ${plan.categorySlug}`);
  const story = buildStory(plan, category);
  story.publicArticlePlan = buildPublicArticlePlan(story);
  if (!story.publicArticlePlan || !Array.isArray(story.publicArticlePlan.sections) || story.publicArticlePlan.sections.length < 3) {
    throw new Error(`Article generation stopped. A valid Public Article Plan could not be created for ${story.slug}. No legacy or fixed-section fallback was used.`);
  }
  story.introSummary = story.publicArticlePlan.dek;
  story.contentDNA = buildContentDNA(story, existingQueries);
  story.contentDNA.subjectSpecificVocabulary = plan.vocabulary;
  story.contentDNA.requiredSpecificDetails = plan.vocabulary;
  story.contentDNA.sectionBlueprint = story.publicArticlePlan.sections.map((section) => ({
    title: section.heading,
    nav: section.heading
  }));
  if (story.contentDNA?.canonicalQuery) existingQueries.add(normalize(story.contentDNA.canonicalQuery));

  const existingIndex = stories.findIndex((item) => item.slug === plan.slug);
  if (existingIndex >= 0) {
    stories[existingIndex] = story;
    updated.push(plan.slug);
  } else {
    storySlugs.add(plan.slug);
    added.push(story);
  }
}

stories.unshift(...added.reverse());
writeJson(storiesPath, stories);

console.log(`Added ${added.length} and updated ${updated.length} known-story archive articles across ${topics.length} categories.`);
for (const story of added) console.log(`added ${story.categorySlug}: ${story.slug}`);
for (const slug of updated) console.log(`updated: ${slug}`);

function buildStory(plan, category) {
  const fragments = fragmentsFor(plan);
  const relatedKeywords = unique([
    `${plan.keyword} origin`,
    `${plan.keyword} meaning`,
    `${plan.tag.toLowerCase()} folklore`,
    `${category.title.toLowerCase()} explained`
  ]);
  const title = plan.title;
  return {
    id: plan.slug,
    slug: plan.slug,
    title,
    displayTitle: title,
    h1: title,
    seoTitle: title,
    metaTitle: title,
    metaDescription: trimMeta(`${plan.subject} explains ${plan.detail}, with common versions, source limits, meaning, and why the story still lasts.`),
    category: category.title,
    categorySlug: category.slug,
    categoryGroup: category.group,
    tag: plan.tag,
    primaryTag: plan.tag,
    seedKeyword: plan.keyword,
    primaryKeyword: plan.keyword,
    searchIntent: searchIntentFor(category.slug),
    articleFormat: category.group === 'Mythic & Imagined Realms' ? 'story-archive' : 'search-info',
    cluster: `${category.title} / ${plan.tag}`,
    relatedKeywords,
    secondaryKeywords: unique([...relatedKeywords, ...plan.vocabulary]).slice(0, 8),
    topicScore: 94,
    topicStatus: 'approved',
    scoreBreakdown: {
      searchDemand: 30,
      clickCuriosity: 24,
      siteFit: 24,
      expansionPotential: 10,
      sourceSafety: 6
    },
    summaryAnswer: plan.quickAnswer.join(' '),
    readTime: '9 min read',
    storyType: storyTypeFor(category.slug),
    generationBatch: 'known-one-each-20260719',
    contentStandard: 'unified',
    generatorVersion: 'unified-public-article-v2',
    templateVersion: 'variable-sections-v2',
    articlePlanVersion: 'public-plan-v2',
    validationVersion: 'public-validation-v2',
    generatedAt: `${publishedAt}T00:00:00.000Z`,
    editorialStatus: 'approved',
    legacyContent: false,
    substantiveRevisionAt: publishedAt,
    internalLinkEligible: true,
    sourceStatus: sourceStatusFor(category, plan.tag),
    publicSourceBasis: plan.sourceBasis,
    excerpt: plan.quickAnswer[0],
    introSummary: deckFor(plan),
    publishedAt,
    updatedAt: publishedAt,
    relatedStoryIds: relatedSlugsFor(plan),
    relatedStorySlugs: relatedSlugsFor(plan),
    tags: plan.tags,
    detail: compactDetail(plan.detail),
    evidence: plan.evidence,
    researchSources: plan.sources,
    sourceNotes: {
      sharedVerifiedPoints: [
        `${plan.subject} is a pre-existing subject in folklore, myth, legend, mystery, or public cultural memory.`,
        `${plan.subject} can be described through ${plan.detail}.`,
        `The strongest reading stays within ${plan.evidence}.`
      ],
      variants: [
        'Specific details shift by source, region, retelling, publication history, or community memory.',
        'Later popular versions often make the story cleaner than the source trail allows.'
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
    targetQuery: plan.subject.toLowerCase(),
    canonicalQuery: plan.keyword,
    uniqueAngle: `${plan.subject} is treated through one concrete anchor: ${plan.detail}.`,
    sceneAnchor: plan.detail,
    subjectSpecificVocabulary: plan.vocabulary,
    contentType: 'story',
    storyBrief: {
      topic: plan.subject,
      category: category.title,
      contentType: category.slug,
      existenceStatus: 'confirmed',
      circulationLevel: 'widely known',
      knownNames: knownNamesFor(plan),
      cultureOrContext: plan.sourceBasis,
      coreStoryElements: [
        plan.quickAnswer[0],
        plan.quickAnswer[1],
        fragments.core[0],
        fragments.context[0],
        fragments.core[1],
        fragments.context[1]
      ],
      reportedVariants: [
        { claim: fragments.variants[0], scope: 'variant tradition' },
        { claim: fragments.variants[1], scope: 'later versions and source comparison' }
      ],
      editorialInterpretationOptions: [
        fragments.meaning[0],
        fragments.meaning[1]
      ],
      uncertainDetails: [
        'The exact earliest form may be disputed, incomplete, or preserved through later retellings.',
        'Later versions may simplify, relocate, intensify, or reinterpret the story.'
      ],
      prohibitedInventions: [
        'Do not add a hidden witness or newly discovered document.',
        'Do not turn folklore or speculation into confirmed fact.',
        'Do not invent modern evidence that is not in the source record.'
      ],
      existenceEvidence: plan.sources
    },
    seoHeadings: seoHeadingsFor(plan),
    faqQuestions: faqQuestionsFor(plan),
    publicSourceNoteSeed: plan.sourceNote
  };
}

function source(title, url, supports) {
  return { title, url, sourceType: 'reference', supports };
}

function topic(value) {
  return value;
}

function fragmentsFor(plan) {
  return {
    core: plan.core,
    context: plan.context,
    variants: plan.variants,
    record: plan.record,
    meaning: plan.meaning
  };
}

function seoHeadingsFor(plan) {
  const bySlug = {
    'clown-statue-urban-legend': [
      'The Babysitter and the Figure in the Room',
      'Why the Clown Statue Changes the House',
      'How the Phone Call Turns Decoration Into Threat',
      'Versions With Dolls, Mannequins, and Intruders',
      'What the Legend Says About Misrecognition'
    ],
    'this-man-dream-hoax': [
      'The Face That Asked a Question',
      'How the Dream Claim Spread Online',
      'When the Hoax Frame Became Part of the Story',
      'Why Reposts Removed the Original Context',
      'What This Man Says About Shared Private Fear'
    ],
    'bhangarh-fort-legend': [
      'The Ruined Fort Behind the Warning',
      'How the Curse Story Gives Silence a Cause',
      'Why Bhangarh Became a Haunted Place',
      'Versions With Magicians, Princesses, and Nightfall',
      'What the Fort Means as a Travel Legend'
    ],
    'taos-hum-mystery': [
      'The Low Sound Some People Hear',
      'Why the Witness Pattern Matters',
      'Possible Sources Behind the Hum',
      'Where Measurement and Experience Do Not Fully Meet',
      'What the Taos Hum Reveals About Place and Perception'
    ],
    'green-children-woolpit-folklore': [
      'The Children Who Appeared Near Woolpit',
      'Why Their Color, Speech, and Food Matter',
      'St Martin\'s Land and the Otherworld Question',
      'Historical Theories and Folklore Versions',
      'What the Green Children Still Ask'
    ],
    'beast-of-bray-road-legend': [
      'The Road Where the Creature Appears',
      'How Witnesses Describe the Beast',
      'Why the Shape Became Werewolf-Like',
      'Versions Between Cryptid Report and Local Legend',
      'What Bray Road Adds to Modern Monster Folklore'
    ],
    'phaethon-sun-chariot-myth': [
      'The Son Who Wanted the Sun Chariot',
      'Why the Promise Becomes Dangerous',
      'The Ride That Threatens the Earth',
      'Zeus, the Fall, and the Aftermath',
      'What Phaethon Means as a Myth of Limits'
    ],
    'basilisk-folklore': [
      'The Creature Whose Gaze Is Dangerous',
      'Why the Basilisk Is Called a Serpent King',
      'How Bestiaries Changed the Monster',
      'Where Basilisk and Cockatrice Traditions Overlap',
      'What the Basilisk Makes Sight Mean'
    ],
    'agartha-hollow-earth-legend': [
      'The Hidden Realm Beneath the Map',
      'How Hollow Earth Ideas Shaped Agartha',
      'Secret Cities, Entrances, and Inner-World Versions',
      'Why Esoteric Geography Made the Legend Expand',
      'What Agartha Promises Under the Surface'
    ],
    'green-flash-sunset-phenomenon': [
      'The Green Light at the Edge of Sunset',
      'How Atmospheric Refraction Creates the Moment',
      'Why the Horizon Matters',
      'Reports, Photographs, and Lucky-Sign Folklore',
      'What the Green Flash Adds to Nature Lore'
    ],
    'oracle-of-delphi-legend': [
      'The Sacred Place Where Questions Arrived',
      'Apollo, the Pythia, and Oracular Speech',
      'Why Ambiguous Answers Became Powerful',
      'Later Explanations for the Prophetic State',
      'What Delphi Means as a Legendary Place'
    ],
    'ring-of-gyges-myth': [
      'The Ring That Removes Witnesses',
      'Why Invisibility Tests Justice',
      'How Plato Uses the Story',
      'Later Invisibility Objects and Moral Symbols',
      'What the Ring Reveals About Character'
    ],
    'black-cat-superstition-origin': [
      'The Animal That Became an Omen',
      'Why Black Cats Can Mean Luck or Misfortune',
      'Witchcraft, Night, and Household Belief',
      'Regional Versions of the Crossing Cat',
      'What the Superstition Shows About Signs'
    ]
  };
  return bySlug[plan.slug] || [
    `The Detail That Defines ${plan.subject}`,
    `How ${plan.subject} Is Usually Remembered`,
    `Where Later Versions Differ`,
    `What the Available Sources Show`,
    `What ${shortSubject(plan.subject)} Means`
  ];
}

function faqQuestionsFor(plan) {
  const bySlug = {
    'clown-statue-urban-legend': [
      'Who is usually alone with the clown statue?',
      'Why does the phone call change the story?',
      'Is the clown statue tied to one verified incident?',
      'What objects replace the statue in later versions?'
    ],
    'this-man-dream-hoax': [
      'Where did the This Man image spread?',
      'Did thousands of people independently confirm the dream?',
      'Why did the face feel familiar to viewers?',
      'How did the hoax frame affect the legend?'
    ],
    'bhangarh-fort-legend': [
      'Where is Bhangarh Fort?',
      'Why is Bhangarh linked with night warnings?',
      'Which curse details change in retellings?',
      'Why do ruins attract haunted-place stories?'
    ],
    'taos-hum-mystery': [
      'What do witnesses call the Taos Hum?',
      'Why can some people hear it while others cannot?',
      'Which explanations have been proposed?',
      'Why has the Taos Hum remained unresolved?'
    ],
    'green-children-woolpit-folklore': [
      'Where did the Green Children appear?',
      'What is St Martin\'s Land?',
      'Which explanations are usually suggested?',
      'Why does the Woolpit story still feel mysterious?'
    ],
    'beast-of-bray-road-legend': [
      'Where is Bray Road?',
      'How is the Beast usually described?',
      'Is the Beast treated as a werewolf or a cryptid?',
      'Why did the Wisconsin legend spread?'
    ],
    'phaethon-sun-chariot-myth': [
      'Who was Phaethon\'s father?',
      'Why did Phaethon drive the sun chariot?',
      'Why did Zeus strike Phaethon?',
      'What does the myth warn about?'
    ],
    'basilisk-folklore': [
      'What makes the basilisk dangerous?',
      'Why is it called a serpent king?',
      'How does the basilisk differ from the cockatrice?',
      'Why does the deadly gaze matter?'
    ],
    'agartha-hollow-earth-legend': [
      'What is Agartha?',
      'How is Agartha connected to Hollow Earth ideas?',
      'Is Agartha treated as confirmed geography?',
      'Why do hidden-world legends keep returning?'
    ],
    'green-flash-sunset-phenomenon': [
      'What causes the green flash?',
      'Where is it easiest to see?',
      'How long does the green flash last?',
      'Why did the phenomenon become folklore?'
    ],
    'oracle-of-delphi-legend': [
      'Who was the Pythia?',
      'Why did people travel to Delphi?',
      'Why were Delphic answers often difficult to interpret?',
      'How should later explanations of Delphi be handled?'
    ],
    'ring-of-gyges-myth': [
      'What power does the Ring of Gyges give?',
      'Why does Plato use the ring story?',
      'What does invisibility remove from moral choice?',
      'Why is the ring not treated as a relic?'
    ],
    'black-cat-superstition-origin': [
      'Do black cats always mean bad luck?',
      'How did witchcraft affect black cat beliefs?',
      'Why do crossing-cat omens differ by region?',
      'What makes the black cat a flexible sign?'
    ]
  };
  return bySlug[plan.slug] || [
    `Which detail defines ${plan.subject}?`,
    `How do later versions of ${plan.subject} differ?`,
    `What can ${plan.subject} suggest?`
  ];
}

function relatedSlugsFor(plan) {
  return unique(plan.related || [])
    .filter((slug) => slug !== plan.slug && storySlugs.has(slug))
    .slice(0, 6);
}

function deckFor(plan) {
  const bySlug = {
    'clown-statue-urban-legend': 'A decorated room becomes frightening when one object no longer belongs there. The clown statue legend works through a sudden change in recognition, not through a long chain of events.',
    'this-man-dream-hoax': 'This Man is the internet legend of a plain, unsettling face that strangers were said to recognize from dreams. Its power comes from the gap between a viral hoax frame and the private feeling of recognition.',
    'bhangarh-fort-legend': 'Bhangarh Fort carries the atmosphere of a place where history, ruin, and warning signs meet. Its haunted reputation grows from the way silence makes a visible location feel unfinished.',
    'taos-hum-mystery': 'The Taos Hum is a low sound reported by some people around Taos, New Mexico, while others hear nothing. The mystery sits between place, perception, machinery, and the difficulty of proving a sound after it is heard.',
    'green-children-woolpit-folklore': 'Two green-skinned children appear near Woolpit, speak an unknown language, and seem to come from a place called St Martin\'s Land. The medieval tale remains strange because the children are human and unreachable at the same time.',
    'beast-of-bray-road-legend': 'A rural Wisconsin road became the stage for a modern monster image that people could picture immediately. The Beast of Bray Road survives because its outline stays unstable while the location stays specific.',
    'phaethon-sun-chariot-myth': 'Phaethon asks to drive the sun chariot and loses control of the sky. The myth turns a son\'s proof of identity into a disaster of heat, pride, and limits.',
    'basilisk-folklore': 'Few creatures make the simple act of looking feel unsafe. Basilisk folklore turns a monster encounter into a warning about sight, distance, and knowledge.',
    'agartha-hollow-earth-legend': 'Agartha is the hidden inner realm imagined beneath ordinary geography. The legend turns the unknown world from a distant island into something under the map.',
    'green-flash-sunset-phenomenon': 'A sunset can end with a tiny green edge of light that appears and vanishes almost at once. The green flash sits between atmospheric optics and the old habit of treating rare sky moments as signs.',
    'oracle-of-delphi-legend': 'The Oracle of Delphi was a sacred Greek site where the Pythia gave responses associated with Apollo. Its legend survives because an answer could guide a city and still remain difficult to understand.',
    'ring-of-gyges-myth': 'The Ring of Gyges grants invisibility and asks what a person would do without witnesses. Plato uses the object to turn justice into a story anyone can imagine.',
    'black-cat-superstition-origin': 'Black cat superstition changes across cultures, where the same animal can signal luck, danger, witchcraft, protection, or omen. The belief shows how an ordinary encounter becomes a sign.'
  };
  return bySlug[plan.slug] || `${plan.quickAnswer[0]} ${plan.quickAnswer[1]}`.replace(/\s+/g, ' ').trim();
}

function knownNamesFor(plan) {
  return unique([
    plan.subject,
    plan.title.split(':')[0],
    ...(plan.vocabulary || []).slice(0, 3)
  ]).slice(0, 5);
}

function sourceStatusFor(category, tag) {
  if (category.slug === 'unexplained-mysteries' || category.slug === 'strange-nature') {
    return `${category.title} / ${tag} / Evidence-limited public record`;
  }
  if (category.slug === 'legend-origins') return `${category.title} / ${tag} / Folklore origin and motif record`;
  if (category.group === 'Mythic & Imagined Realms') return `${category.title} / ${tag} / Mythic tradition and symbolic reading`;
  return `${category.title} / ${tag} / Source-aware folklore record`;
}

function storyTypeFor(categorySlug) {
  return {
    'urban-legends': 'UrbanLegendRecord',
    'internet-folklore': 'InternetFolkloreRecord',
    'strange-places': 'StrangePlaceRecord',
    'unexplained-mysteries': 'UnexplainedMysteryRecord',
    'classic-folklore': 'ClassicFolkloreRecord',
    'modern-legends': 'ModernLegendRecord',
    myths: 'MythRecord',
    'mythic-creatures': 'MythicCreatureRecord',
    'lost-worlds': 'LostWorldRecord',
    'strange-nature': 'StrangeNatureRecord',
    'legendary-places': 'LegendaryPlaceRecord',
    'mythic-objects': 'MythicObjectRecord',
    'legend-origins': 'LegendOriginRecord'
  }[categorySlug] || 'ArchiveRecord';
}

function searchIntentFor(categorySlug) {
  if (categorySlug === 'legend-origins') return 'origin';
  if (categorySlug === 'unexplained-mysteries' || categorySlug === 'strange-nature') return 'facts-and-theories';
  return 'story-and-meaning';
}

function shortSubject(subject) {
  return String(subject || '').replace(/^The\s+/i, '').split(/\s+/).slice(0, 4).join(' ');
}

function compactDetail(detail) {
  return String(detail || '')
    .replace(/^the\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function trimMeta(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= 155) return text;
  return text.slice(0, 152).replace(/\s+\S*$/, '') + '.';
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
