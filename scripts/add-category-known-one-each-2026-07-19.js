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
  }),
  topic({
    categorySlug: 'urban-legends',
    slug: 'sewer-alligator-urban-legend',
    title: 'Sewer Alligator Urban Legend: City Drains, Escaped Pets, and the Monster Below the Street',
    subject: 'Sewer Alligator',
    tag: 'Urban Animal Legend',
    tags: ['Urban Animal Legend', 'Sewer Alligator', 'City Folklore', 'Urban Legend'],
    keyword: 'sewer alligator urban legend',
    detail: 'the modern city legend that alligators live beneath streets after being abandoned as exotic pets',
    sourceBasis: 'urban legend scholarship, newspaper reports, city folklore, and animal-in-the-sewer retellings',
    evidence: 'folklore references, public reporting, city rumor history, and source-limited accounts of unusual urban animals',
    vocabulary: ['sewer alligator', 'city drains', 'escaped pets', 'New York', 'urban animal'],
    sources: [
      source('Snopes - Sewer Alligators', 'https://www.snopes.com/fact-check/alligators-sewers/', 'Supports the sewer alligator as a circulating urban legend with scattered reports and strong folklore reception.'),
      source('New York Public Library - Sewer Alligator', 'https://www.nypl.org/blog/2015/02/10/sewer-alligator', 'Supports the New York legend context and the way the story entered city memory.')
    ],
    quickAnswer: [
      'The sewer alligator is a famous urban legend about reptiles living in city sewer systems after being abandoned, flushed, or lost. The story is especially linked with New York, where the hidden city below the street becomes part of the fear.',
      'Occasional reports of unusual animals do not prove a stable underground alligator population. The legend may be read as a story about what a modern city hides under ordinary pavement.'
    ],
    intro: [
      'The sewer alligator begins with a simple image: a city street, a drain, and something alive underneath.',
      'That image works because the city already has a hidden layer. The legend only gives that hidden layer teeth.'
    ],
    core: [
      'In common versions, baby alligators are bought as pets and later discarded when they become too large or dangerous. Instead of dying, they survive in the sewer and grow in darkness.',
      'The details change, but the shape stays clear. A private mistake becomes a public monster beneath everyone’s feet.'
    ],
    context: [
      'Sewer systems are perfect urban legend spaces because they are real, necessary, and mostly unseen. People know they exist, but few people know exactly what happens inside them.',
      'The alligator also connects domestic novelty with urban consequence. A creature brought home for amusement becomes a rumor about the whole city.'
    ],
    variants: [
      'Some versions describe pale alligators adapted to darkness. Others focus on workers who see eyes in tunnels or find evidence near drains.',
      'Later retellings move the legend between cities, but New York remains the best-known setting because the city already carries a strong underground mythology.'
    ],
    record: [
      'The record can support sewer alligators as a durable urban legend with occasional animal reports in unusual places. It cannot support the claim that a hidden breeding population lives below the city.',
      'The strongest article keeps the scattered reports separate from the larger legend that grew around them.'
    ],
    meaning: [
      'The sewer alligator may be read as a fear of hidden consequences. What people throw away does not vanish. It waits somewhere below the surface.',
      'That is why the story remains easy to retell. Every drain becomes a possible opening.'
    ],
    related: ['killer-in-the-backseat-legend', 'kidney-theft-urban-legend', 'vanishing-hitchhiker-urban-legend'],
    sourceNote: 'This article follows the sewer alligator as an urban animal legend. Scattered animal reports are kept separate from claims of a lasting underground population.'
  }),
  topic({
    categorySlug: 'internet-folklore',
    slug: 'backrooms-internet-folklore',
    title: 'The Backrooms Internet Folklore: Yellow Rooms, Empty Halls, and the Fear of Falling Out of Reality',
    subject: 'The Backrooms',
    tag: 'Liminal Space Legend',
    tags: ['Liminal Space Legend', 'Backrooms', 'Online Horror', 'Creepypasta'],
    keyword: 'Backrooms internet folklore',
    detail: 'the internet-born legend of an endless yellow office-like space reached by slipping out of normal reality',
    sourceBasis: 'internet folklore documentation, creepypasta history, liminal-space culture, and collaborative online retellings',
    evidence: 'meme documentation, archived posts, community retellings, and source-limited internet folklore summaries',
    vocabulary: ['Backrooms', 'yellow rooms', 'humming lights', 'no-clip', 'liminal space'],
    sources: [
      source('Know Your Meme - The Backrooms', 'https://knowyourmeme.com/memes/the-backrooms', 'Supports the online origin, image spread, and meme history of the Backrooms.'),
      source('The Backrooms Wiki', 'https://backrooms.fandom.com/wiki/Backrooms_Wiki', 'Supports later collaborative expansion and community-created levels as reception history.')
    ],
    quickAnswer: [
      'The Backrooms is an internet folklore setting built around the idea of slipping out of reality into endless yellow rooms and fluorescent-lit halls. It began as a short online horror concept and expanded through memes, wikis, videos, and collaborative stories.',
      'The story is not a claimed real place in the ordinary sense. It may be read as a digital legend about empty office spaces, broken reality, and the unease of places that look familiar but offer no way home.'
    ],
    intro: [
      'The Backrooms does not begin with a monster. It begins with a room that feels wrong.',
      'The carpet is damp. The lights hum. The walls repeat until direction stops feeling useful.'
    ],
    core: [
      'The familiar premise says that a person can “no-clip” out of reality and fall into the Backrooms. The space looks like an old office maze, but it has no ordinary exit.',
      'The horror comes from repetition before danger. The viewer understands the place before anything happens, and that is enough.'
    ],
    context: [
      'The Backrooms belongs to internet folklore because it grew through shared images and collaborative retelling. A single concept became a setting that many people could add to.',
      'It also connects with liminal-space photography. Empty halls, offices, pools, and schools feel strange because they look public but abandoned by purpose.'
    ],
    variants: [
      'Later versions add levels, entities, rules, found footage, and survival systems. These expansions make the world larger, but the earliest fear remains the same.',
      'Some retellings treat the Backrooms like a game map. Others keep it quiet, minimal, and almost believable.'
    ],
    record: [
      'The record can support the Backrooms as a modern internet legend with a visible online development. It cannot support it as a verified hidden dimension.',
      'The useful distinction is between origin, community expansion, and fictional in-world lore.'
    ],
    meaning: [
      'The Backrooms may be read as a fear of places built without comfort. The space is artificial, endless, and nearly human, but never welcoming.',
      'That is why it spread so well. It turns the ordinary background of modern life into a maze.'
    ],
    related: ['cicada-3301-internet-puzzle', 'this-man-dream-hoax', 'polybius-arcade-game-legend'],
    sourceNote: 'This article follows the Backrooms as internet folklore and collaborative horror. In-world lore is treated as later creative expansion, not as external evidence.'
  }),
  topic({
    categorySlug: 'strange-places',
    slug: 'nazca-lines-mystery',
    title: 'Nazca Lines Mystery: Desert Geoglyphs, Giant Figures, and the Place Seen From Above',
    subject: 'Nazca Lines',
    tag: 'Ancient Place Mystery',
    tags: ['Ancient Place Mystery', 'Nazca Lines', 'Geoglyphs', 'Peru'],
    keyword: 'Nazca Lines mystery',
    detail: 'the giant desert geoglyphs of southern Peru and the long-running questions about their purpose and meaning',
    sourceBasis: 'archaeological summaries, UNESCO heritage context, public history writing, and source-aware mystery discussion',
    evidence: 'archaeological descriptions, heritage records, aerial surveys, and interpretation-limited discussions of purpose',
    vocabulary: ['Nazca Lines', 'geoglyphs', 'southern Peru', 'desert', 'from above'],
    sources: [
      source('UNESCO - Lines and Geoglyphs of Nasca and Palpa', 'https://whc.unesco.org/en/list/700/', 'Supports the heritage status, location, and archaeological importance of the Nazca and Palpa geoglyphs.'),
      source('Encyclopaedia Britannica - Nazca Lines', 'https://www.britannica.com/place/Nazca-Lines', 'Supports the general description and major interpretation limits around the geoglyphs.')
    ],
    quickAnswer: [
      'The Nazca Lines are large geoglyphs in the desert of southern Peru, including straight lines, geometric forms, animals, and plant-like figures. They are real archaeological features, but their full purpose remains debated.',
      'The mystery comes from scale and viewpoint. The lines can be seen most clearly from above, which has encouraged ritual, astronomical, water-related, and speculative interpretations.'
    ],
    intro: [
      'The Nazca Lines make the desert feel like a page too large to read from the ground.',
      'From above, figures appear. A monkey, a bird, a spider, and long straight paths begin to make the landscape look intentional.'
    ],
    core: [
      'The lines were made by removing darker surface stones and exposing lighter ground beneath. That simple method created images and paths that lasted in the dry desert climate.',
      'Their survival is part of the mystery. The figures are fragile, but the environment helped preserve them for centuries.'
    ],
    context: [
      'The strongest discussions place the geoglyphs within ancient Andean culture rather than treating them as impossible objects. Ritual movement, water, astronomy, and landscape meaning are all part of the conversation.',
      'The aerial view made the site famous, but that does not mean the makers needed modern flight. Large ground designs can be planned, walked, and understood in more than one way.'
    ],
    variants: [
      'Popular versions often exaggerate the mystery into claims about aliens or lost technology. Those claims are part of modern reception, not the baseline archaeological record.',
      'More careful interpretations differ over function. Some emphasize ritual pathways, some celestial alignment, and some water or fertility symbolism.'
    ],
    record: [
      'The record can support the Nazca Lines as real geoglyphs with strong archaeological importance. It cannot settle one final meaning for every figure and line.',
      'A source-aware article keeps wonder without needing an impossible explanation.'
    ],
    meaning: [
      'The Nazca Lines may be read as a mystery of scale. Human marks become strange when the viewer has to rise above the ground to see them clearly.',
      'That distance gives the place its power. It makes the desert feel addressed to more than one kind of observer.'
    ],
    related: ['bhangarh-fort-legend', 'bennington-triangle-legend', 'island-of-the-dolls-xochimilco'],
    sourceNote: 'This article follows the Nazca Lines as archaeological geoglyphs with debated interpretations. Speculative claims are kept separate from the source-supported record.'
  }),
  topic({
    categorySlug: 'unexplained-mysteries',
    slug: 'rendlesham-forest-incident',
    title: 'Rendlesham Forest Incident: Lights, Military Witnesses, and Britain’s Famous UFO Case',
    subject: 'Rendlesham Forest Incident',
    tag: 'UFO Case',
    tags: ['UFO Case', 'Rendlesham Forest', 'Witness Reports', 'Unexplained Mystery'],
    keyword: 'Rendlesham Forest incident',
    detail: 'the reported lights and strange encounters near RAF Woodbridge and Rendlesham Forest in December 1980',
    sourceBasis: 'public records, witness statements, UFO case summaries, and evidence-limited historical reporting',
    evidence: 'released documents, witness accounts, media reporting, skeptical explanations, and unresolved-case summaries',
    vocabulary: ['Rendlesham Forest', 'RAF Woodbridge', 'UFO', 'lights', 'military witnesses'],
    sources: [
      source('The National Archives - UFO files', 'https://www.nationalarchives.gov.uk/ufos/', 'Supports the public-record context for released UK UFO files.'),
      source('BBC - Rendlesham Forest UFO sighting', 'https://www.bbc.com/news/uk-england-suffolk-51565054', 'Supports the public summary and continuing local memory of the case.')
    ],
    quickAnswer: [
      'The Rendlesham Forest Incident refers to reports of strange lights and encounters near RAF Woodbridge in Suffolk in December 1980. It is often called one of Britain’s best-known UFO cases because military personnel were among the witnesses.',
      'The case has official records, witness testimony, and proposed explanations, but it remains disputed. It may be read as an evidence-limited mystery where documents and memories do not resolve every detail.'
    ],
    intro: [
      'Rendlesham Forest became famous because the story did not come from a distant rumor alone.',
      'It involved lights, military witnesses, official paperwork, and a place people could still visit.'
    ],
    core: [
      'The central reports describe unusual lights seen near the forest and nearby air bases. Some witnesses later described moving lights, marks, radiation readings, and a close encounter with an object.',
      'The case became stronger in public memory because it had names, dates, and documents. Those details gave the story a record trail.'
    ],
    context: [
      'Rendlesham belongs to UFO folklore, but it also belongs to Cold War atmosphere. Military sites, night watches, and unexplained lights already create a setting where uncertainty feels charged.',
      'The case is often compared with Roswell, though the source trail and cultural setting are different.'
    ],
    variants: [
      'Later versions differ over what witnesses saw, how close the encounter was, and which explanations matter most. Some emphasize a lighthouse, some military confusion, and some a genuine unknown object.',
      'The most responsible versions keep testimony, documents, and later interpretation separate.'
    ],
    record: [
      'The record can support that reports were made and preserved in public discussion. It cannot force all details into one settled explanation.',
      'That is why the case remains useful for mystery readers. It shows how evidence can exist without ending disagreement.'
    ],
    meaning: [
      'Rendlesham may be read as a mystery about authority and uncertainty. A military setting makes the unknown feel more serious, but it does not automatically make every claim proven.',
      'The forest remains memorable because the story stands between report, explanation, and belief.'
    ],
    related: ['wow-signal-mystery', 'taos-hum-mystery', 'db-cooper-hijacking-mystery'],
    sourceNote: 'This article follows the Rendlesham Forest Incident through public records, witness accounts, and later explanations. It does not treat every UFO interpretation as equally verified.'
  }),
  topic({
    categorySlug: 'classic-folklore',
    slug: 'selkie-folklore',
    title: 'Selkie Folklore: Seal Skins, Human Shores, and the Shape-Shifting Bride Story',
    subject: 'Selkie',
    tag: 'Shape-Shifter Folklore',
    tags: ['Shape-Shifter Folklore', 'Selkie', 'Scottish Folklore', 'Sea Legend'],
    keyword: 'selkie folklore',
    detail: 'the North Atlantic folklore of seal people who can remove their skins and live briefly as humans on shore',
    sourceBasis: 'Scottish and Orcadian folklore, North Atlantic oral tradition, ballads, and later literary retellings',
    evidence: 'folklore collections, regional summaries, ballad traditions, and comparative sea-spirit motifs',
    vocabulary: ['selkie', 'seal skin', 'shore', 'sea', 'shape'],
    sources: [
      source('Orkneyjar - Selkies', 'http://www.orkneyjar.com/folklore/selkiefolk/', 'Supports regional Orkney selkie folklore and common story patterns.'),
      source('University of Pittsburgh - Selkie Tales', 'https://sites.pitt.edu/~dash/folktexts.html', 'Supports comparative folklore access to related tale texts and motifs.')
    ],
    quickAnswer: [
      'Selkies are seal people in Scottish, Orcadian, and North Atlantic folklore. They can remove their seal skins, appear in human form, and sometimes become trapped on land when the skin is hidden.',
      'The best-known stories often involve marriage, longing, and return to the sea. The selkie may be read as a figure of divided belonging rather than a simple monster.'
    ],
    intro: [
      'A selkie story usually begins at the edge of land and water.',
      'Something from the sea steps onto the shore, and for a while it looks human.'
    ],
    core: [
      'In many versions, a human finds or steals a selkie’s seal skin. Without the skin, the selkie cannot return to the sea and may live as a spouse on land.',
      'The story turns on the hidden skin. When it is found again, the selkie returns to the water, even if love and children remain behind.'
    ],
    context: [
      'Selkie folklore belongs to coastal communities where the sea is both home and danger. The seal is familiar, but the story gives it another life beneath the surface.',
      'The tales often carry sadness rather than simple fear. They ask what happens when one world tries to keep someone who belongs to another.'
    ],
    variants: [
      'Some versions focus on selkie wives. Others describe male selkies who visit human women. The emotional center changes, but the skin remains the key object.',
      'Later literary retellings often soften or romanticize the stories, while older versions can feel sharper and more unsettling.'
    ],
    record: [
      'The record can support selkies as a recurring folklore figure in North Atlantic tradition. It cannot reduce every selkie story to one single plot.',
      'Regional versions matter because the shoreline, family role, and tone can change from one telling to another.'
    ],
    meaning: [
      'Selkie folklore may be read as a story about captivity, longing, and return. The human home can be loving and still not be the selkie’s home.',
      'That tension is why the tales last. They make the sea feel like a lost identity.'
    ],
    related: ['green-children-woolpit-folklore', 'wild-hunt-folklore', 'pied-piper-of-hamelin-folklore'],
    sourceNote: 'This article follows selkie folklore as a regional and comparative tradition. Later romantic retellings are treated as reception, not as the only form of the tale.'
  }),
  topic({
    categorySlug: 'modern-legends',
    slug: 'mothman-point-pleasant-legend',
    title: 'Mothman Legend: Point Pleasant Sightings, Red Eyes, and the Modern Monster That Became an Omen',
    subject: 'Mothman',
    tag: 'Modern Monster Legend',
    tags: ['Modern Monster Legend', 'Mothman', 'Point Pleasant', 'West Virginia'],
    keyword: 'Mothman Point Pleasant legend',
    detail: 'the modern legend of a winged red-eyed figure reported around Point Pleasant, West Virginia, in the 1960s',
    sourceBasis: 'local reports, modern legend summaries, cryptid folklore, and later cultural reception',
    evidence: 'newspaper-era accounts, witness summaries, local history, festival reception, and source-limited monster folklore',
    vocabulary: ['Mothman', 'Point Pleasant', 'red eyes', 'winged figure', 'Silver Bridge'],
    sources: [
      source('West Virginia Encyclopedia - Mothman', 'https://www.wvencyclopedia.org/articles/1418', 'Supports the regional history and public memory of the Mothman legend.'),
      source('Atlas Obscura - Mothman Museum', 'https://www.atlasobscura.com/places/mothman-museum', 'Supports the later cultural reception and local identity around Mothman.')
    ],
    quickAnswer: [
      'Mothman is a modern legend centered on reports of a large winged figure with glowing red eyes around Point Pleasant, West Virginia, in the 1960s. The story became linked in public memory with strange warnings and the Silver Bridge collapse.',
      'The legend combines witness reports, local fear, media attention, and later cryptid culture. It may be read as a modern omen figure rather than a confirmed biological creature.'
    ],
    intro: [
      'Mothman is remembered less like an animal and more like a warning shape.',
      'Red eyes, wings, a dark road, and a town waiting for disaster became enough to build a legend.'
    ],
    core: [
      'The familiar accounts describe a tall winged figure seen near Point Pleasant. Witnesses often mention red eyes, speed, and a body that does not fit ordinary birds or people.',
      'After the Silver Bridge collapse, later retellings connected the figure with omen and disaster. That link changed Mothman from a sighting story into a warning story.'
    ],
    context: [
      'Mothman belongs to modern legend because the setting is recent, local, and media-shaped. The story spread through reports, books, documentaries, festivals, and cryptid culture.',
      'Point Pleasant remains central. The place gives the legend a geography that fans and skeptics can both visit.'
    ],
    variants: [
      'Some versions treat Mothman as a cryptid. Others treat it as an omen, a misidentified bird, a supernatural figure, or a symbol of local tragedy.',
      'Later appearances outside West Virginia often borrow the image while changing the meaning.'
    ],
    record: [
      'The record can support that Mothman became a major modern legend with reported sightings and strong local reception. It cannot verify every sighting as one creature.',
      'The important distinction is between witness narrative, later omen interpretation, and cultural afterlife.'
    ],
    meaning: [
      'Mothman may be read as a story about how disaster changes memory. A strange figure seen before tragedy becomes easier to remember as a sign.',
      'That is why the legend still feels alive. It gives fear a silhouette.'
    ],
    related: ['men-in-black-legend', 'flatwoods-monster-legend', 'beast-of-bray-road-legend'],
    sourceNote: 'This article follows Mothman as a modern Point Pleasant legend. The article separates reported sightings, later omen readings, and cryptid reception.'
  }),
  topic({
    categorySlug: 'myths',
    slug: 'icarus-flight-myth',
    title: 'Icarus Flight Myth: Wax Wings, the Sun, and the Warning About Flying Too High',
    subject: 'Icarus',
    tag: 'Greek Myth',
    tags: ['Greek Myth', 'Icarus', 'Daedalus', 'Flight Myth'],
    keyword: 'Icarus flight myth',
    detail: 'the Greek myth of Icarus flying with wax wings and falling after ignoring Daedalus’s warning',
    sourceBasis: 'Greek myth tradition, classical retellings, Ovidian reception, and symbolic interpretations of flight',
    evidence: 'classical myth summaries, literary retellings, iconography, and later moral interpretation',
    vocabulary: ['Icarus', 'Daedalus', 'wax wings', 'sun', 'fall'],
    sources: [
      source('Theoi - Ikaros', 'https://www.theoi.com/Heros/Ikaros.html', 'Supports classical references and the main Icarus myth pattern.'),
      source('Encyclopaedia Britannica - Icarus', 'https://www.britannica.com/topic/Icarus-Greek-mythology', 'Supports the general myth summary and symbolic reception.')
    ],
    quickAnswer: [
      'Icarus is the Greek mythic figure who escapes Crete with wings made by Daedalus, but flies too close to the sun. The wax melts, the wings fail, and Icarus falls into the sea.',
      'The myth is often read as a warning about pride, disobedience, or dangerous ambition. It also remains powerful because the dream of flight and the danger of falling arrive in the same image.'
    ],
    intro: [
      'Icarus begins with escape.',
      'A father builds wings, a son follows him into the sky, and freedom suddenly has rules.'
    ],
    core: [
      'Daedalus warns Icarus not to fly too low or too high. The middle path is the safe path, but the sky makes that warning difficult to obey.',
      'Icarus rises toward the sun. The wax softens, the feathers loosen, and the flight becomes a fall.'
    ],
    context: [
      'The myth is tied to Daedalus, Crete, the Labyrinth, and the larger story of invention under danger. Flight is both brilliant and fragile.',
      'That balance matters because Icarus is not only punished for ambition. He is also remembered because he reached for something human beings keep imagining.'
    ],
    variants: [
      'Later versions emphasize different lessons. Some focus on disobedience, some on pride, and some on the cost of invention.',
      'Art and poetry often hold the moment before the fall, where beauty and danger are impossible to separate.'
    ],
    record: [
      'The record can support Icarus as a famous Greek mythic figure preserved through classical and later tradition. It does not require treating the flight as historical event.',
      'The strongest reading keeps the narrative image and symbolic meaning together.'
    ],
    meaning: [
      'Icarus may be read as a myth about limits. The warning is simple, but desire makes the sky feel larger than the rule.',
      'That is why the story endures. Everyone understands the wish to rise, and everyone understands the risk of going too far.'
    ],
    related: ['phaethon-sun-chariot-myth', 'prometheus-fire-myth', 'narcissus-and-echo-myth'],
    sourceNote: 'This article follows Icarus through Greek myth and later symbolic reception. Moral readings are presented as interpretation, not as one fixed ancient lesson.'
  }),
  topic({
    categorySlug: 'mythic-creatures',
    slug: 'kraken-sea-monster-folklore',
    title: 'Kraken Folklore: Sea Monster, Giant Arms, and the Creature Beneath the Ship',
    subject: 'Kraken',
    tag: 'Sea Monster Folklore',
    tags: ['Sea Monster Folklore', 'Kraken', 'Nordic Folklore', 'Ocean Legend'],
    keyword: 'Kraken sea monster folklore',
    detail: 'the northern sea-monster tradition of a vast creature large enough to threaten ships from below',
    sourceBasis: 'Nordic sea folklore, natural history reception, sailor legend, and later giant-squid comparisons',
    evidence: 'folklore summaries, historical descriptions, maritime legend, and later zoological comparisons',
    vocabulary: ['Kraken', 'sea monster', 'giant squid', 'ship', 'Nordic folklore'],
    sources: [
      source('Encyclopaedia Britannica - Kraken', 'https://www.britannica.com/topic/kraken', 'Supports the general folklore description and later sea-monster reception.'),
      source('Smithsonian Ocean - Giant Squid', 'https://ocean.si.edu/ocean-life/invertebrates/giant-squid', 'Supports the natural-history context often compared with giant sea-monster traditions.')
    ],
    quickAnswer: [
      'The Kraken is a northern sea-monster figure often imagined as an enormous creature beneath the surface, large enough to endanger ships. Later retellings frequently connect it with giant squid or octopus imagery.',
      'The folklore matters because the ocean hides scale. A sailor can see the surface and still imagine something vast moving below it.'
    ],
    intro: [
      'The Kraken is frightening because it does not need to stand in front of anyone.',
      'It waits under the ship, where the sea has already hidden most of the world.'
    ],
    core: [
      'Older descriptions present the Kraken as a huge sea creature that can disturb water, create danger for vessels, or be mistaken for an island-like mass.',
      'Modern images often give it tentacles, pulling arms, and the shape of a giant squid. That image made the legend easy to picture.'
    ],
    context: [
      'Sea-monster folklore grows from real ocean uncertainty. Deep water, strange carcasses, large animals, and sailor reports can all become part of the same imaginative field.',
      'The Kraken survives because it joins folklore with possible nature. It feels impossible and plausible at the same time.'
    ],
    variants: [
      'Some versions make the Kraken island-sized. Others make it a squid-like predator attacking ships directly.',
      'Later fantasy and film versions intensify the creature, while older folklore often leaves it more mysterious and environmental.'
    ],
    record: [
      'The record can support the Kraken as a major sea-monster tradition with later links to giant squid imagery. It cannot prove the exact creature of every old report.',
      'A source-aware article keeps folklore, natural history, and modern monster design in separate layers.'
    ],
    meaning: [
      'The Kraken may be read as a creature of hidden scale. It gives shape to the fear that the sea is deeper than human control.',
      'That is why the monster still works. A ship can be large and still look small above the unknown.'
    ],
    related: ['basilisk-folklore', 'phoenix-mythic-bird', 'cockatrice-folklore'],
    sourceNote: 'This article follows the Kraken through sea folklore and later giant-squid reception. Modern monster imagery is treated as later development.'
  }),
  topic({
    categorySlug: 'lost-worlds',
    slug: 'atlantis-lost-city',
    title: 'Atlantis Lost City: Plato’s Island, Sunken Power, and the World That Vanished Beneath the Sea',
    subject: 'Atlantis',
    tag: 'Lost City Legend',
    tags: ['Lost City Legend', 'Atlantis', 'Plato', 'Sunken Island'],
    keyword: 'Atlantis lost city',
    detail: 'the legendary island power described by Plato and later reimagined as a sunken lost civilization',
    sourceBasis: 'Platonic texts, classical reception, lost-world speculation, and later cultural retellings',
    evidence: 'classical references, historical interpretation, reception history, and source-limited lost-world claims',
    vocabulary: ['Atlantis', 'Plato', 'sunken island', 'lost city', 'lost civilization'],
    sources: [
      source('Perseus Digital Library - Plato Critias', 'https://www.perseus.tufts.edu/', 'Supports the classical-text context for Plato’s Atlantis account.'),
      source('Encyclopaedia Britannica - Atlantis', 'https://www.britannica.com/place/Atlantis-legendary-island', 'Supports the general summary and later reception of Atlantis.')
    ],
    quickAnswer: [
      'Atlantis is the legendary island power described by Plato and later imagined as a lost civilization that sank beneath the sea. The original account appears in philosophical dialogue, not as a modern archaeological report.',
      'The legend became larger because a vanished advanced world is easy to relocate, reinterpret, and search for. Atlantis may be read as a lost-world story about power, punishment, and impossible recovery.'
    ],
    intro: [
      'Atlantis begins as a story about a powerful island that falls.',
      'Then the story leaves Plato and becomes one of the most durable lost worlds in cultural memory.'
    ],
    core: [
      'In Plato’s account, Atlantis is a great power beyond the pillars of Heracles. It becomes morally dangerous and is eventually destroyed.',
      'Later readers turned that story into a search. The island became a possible place, a sunken memory, and a symbol of vanished civilization.'
    ],
    context: [
      'Atlantis belongs to lost-world legend because it combines ancient authority with missing geography. A named island that cannot be found invites endless placement on maps.',
      'The original philosophical use matters. Plato’s Atlantis is not the same thing as every later claim about ruins, colonies, or hidden technology.'
    ],
    variants: [
      'Later versions move Atlantis to many locations and connect it with advanced science, esoteric history, or prehistoric catastrophe.',
      'Those versions show the legend’s afterlife, but they should not be treated as equal to the earliest textual frame.'
    ],
    record: [
      'The record can support Atlantis as a powerful literary and legendary subject. It cannot confirm one lost city beneath the sea.',
      'A careful archive entry keeps Plato, later speculation, and modern searches visible as different layers.'
    ],
    meaning: [
      'Atlantis may be read as a story about civilizations that believe they cannot fall. The sea becomes the final answer to that confidence.',
      'That is why Atlantis keeps returning. It is both a warning and a promise that something magnificent may still be hidden.'
    ],
    related: ['agartha-hollow-earth-legend', 'mu-lost-continent-legend', 'shambhala-hidden-kingdom'],
    sourceNote: 'This article follows Atlantis from Plato’s account into later lost-world reception. Speculative locations are treated as later interpretations rather than confirmed discoveries.'
  }),
  topic({
    categorySlug: 'strange-nature',
    slug: 'blood-rain-phenomenon',
    title: 'Blood Rain Phenomenon: Red Rain, Omen Stories, and the Sky That Falls in the Wrong Color',
    subject: 'Blood Rain',
    tag: 'Strange Weather',
    tags: ['Strange Weather', 'Blood Rain', 'Red Rain', 'Nature Folklore'],
    keyword: 'blood rain phenomenon',
    detail: 'red-colored rain events that have been explained through dust, algae, spores, or other natural material while also becoming omen folklore',
    sourceBasis: 'weather reporting, natural science summaries, historical omen traditions, and strange-nature folklore',
    evidence: 'meteorological explanation, historical accounts, public reporting, and source-limited interpretations of red rain events',
    vocabulary: ['blood rain', 'red rain', 'dust', 'weather', 'omen'],
    sources: [
      source('Met Office - Blood rain', 'https://www.metoffice.gov.uk/weather/learn-about/weather/types-of-weather/rain/blood-rain', 'Supports the weather explanation for red rain and dust-related events.'),
      source('NASA Earth Observatory - Dust', 'https://earthobservatory.nasa.gov/features/Dust', 'Supports the broader atmospheric dust context that can color skies and precipitation.')
    ],
    quickAnswer: [
      'Blood rain refers to rain that appears red or reddish because particles such as dust, sand, spores, or other material color the water. In many periods, red rain also became an omen story because the sky seemed to be raining blood.',
      'The phenomenon is often explainable, but the reaction to it belongs to folklore. It may be read as a strange-nature story where weather becomes a sign.'
    ],
    intro: [
      'Rain is expected to be clear.',
      'When it falls red, even a natural explanation does not erase the first shock.'
    ],
    core: [
      'Many blood rain events are linked to colored dust or other particles carried by wind and mixed with rain. The result can stain surfaces and make ordinary weather look alarming.',
      'The name itself changes the event. Once people call it blood rain, the weather enters the language of omen.'
    ],
    context: [
      'Historical communities often read unusual sky events as warnings. Red rain, darkened suns, comets, and strange lights could all become signs before they became scientific subjects.',
      'Modern explanations do not remove that history. They show how one event can belong to both weather and folklore.'
    ],
    variants: [
      'Different cases involve different causes. Dust storms, algae, spores, and local material have all been discussed in relation to red rain events.',
      'Some retellings exaggerate the color or treat every case as the same phenomenon, even when the evidence differs.'
    ],
    record: [
      'The record can support blood rain as a real visual phenomenon with natural explanations in many cases. It cannot support every omen interpretation as factual prediction.',
      'A strong article separates the physical cause from the cultural meaning attached afterward.'
    ],
    meaning: [
      'Blood rain may be read as a story about broken expectation. The sky does something familiar in a color that feels wrong.',
      'That is why the phenomenon keeps its folkloric force. Explanation answers the cause, but the image remains.'
    ],
    related: ['green-flash-sunset-phenomenon', 'marfa-lights-mystery', 'tunguska-event'],
    sourceNote: 'This article follows blood rain as a strange natural phenomenon with folklore reception. Natural explanations and omen interpretations are kept distinct.'
  }),
  topic({
    categorySlug: 'legendary-places',
    slug: 'stonehenge-legendary-place',
    title: 'Stonehenge Legend: Ancient Stones, Merlin Stories, and the Monument That Still Refuses One Meaning',
    subject: 'Stonehenge',
    tag: 'Legendary Monument',
    tags: ['Legendary Monument', 'Stonehenge', 'Merlin', 'Sacred Place'],
    keyword: 'Stonehenge legend',
    detail: 'the prehistoric stone monument in Wiltshire and the later legends, meanings, and interpretations attached to it',
    sourceBasis: 'heritage records, archaeology summaries, medieval legend, and sacred-place reception',
    evidence: 'heritage documentation, archaeological summaries, medieval retellings, and source-limited legendary interpretations',
    vocabulary: ['Stonehenge', 'stones', 'Merlin', 'monument', 'archaeology'],
    sources: [
      source('English Heritage - Stonehenge', 'https://www.english-heritage.org.uk/visit/places/stonehenge/', 'Supports the monument context and public heritage information.'),
      source('UNESCO - Stonehenge, Avebury and Associated Sites', 'https://whc.unesco.org/en/list/373/', 'Supports the world heritage context and archaeological importance.')
    ],
    quickAnswer: [
      'Stonehenge is a prehistoric stone monument in Wiltshire that has gathered archaeological interpretation, medieval legend, and modern sacred-place meanings. It is real, but no single explanation contains its full cultural afterlife.',
      'Later stories connect the stones with Merlin, giants, healing stones, astronomy, ritual, and ancient power. Stonehenge may be read as a place where monument, mystery, and legend remain layered.'
    ],
    intro: [
      'Stonehenge stands in the open, but it does not feel fully explained.',
      'The stones are visible. The meaning behind them is harder to hold.'
    ],
    core: [
      'The monument consists of arranged stones built and altered across long periods of prehistory. Archaeology can describe phases, materials, alignments, and human labor.',
      'Legend adds another layer. Medieval stories gave the stones magical origins and connected them with Merlin or giants.'
    ],
    context: [
      'Stonehenge became legendary because it is both massive and silent. A visitor can see that great effort was required, but the builders did not leave a simple explanation.',
      'That silence invited many meanings: ritual site, burial landscape, astronomical marker, healing place, national symbol, and sacred monument.'
    ],
    variants: [
      'Medieval and later versions differ over who moved the stones and why. Some tell of giants, some of magic, and some of ancient wisdom.',
      'Modern fringe theories also attach to the site, but they should remain separate from archaeology and historical legend.'
    ],
    record: [
      'The record can support Stonehenge as a major prehistoric monument with strong archaeological documentation and later legendary reception. It cannot reduce the site to one simple story.',
      'The archive value comes from keeping the monument and its later meanings visible at the same time.'
    ],
    meaning: [
      'Stonehenge may be read as a place where human effort outlives human explanation. The stones remain, but intention must be reconstructed.',
      'That is why the monument still works as legend. It gives mystery a physical shape.'
    ],
    related: ['oracle-of-delphi-legend', 'mount-olympus-greek-myth', 'fountain-of-youth-legend'],
    sourceNote: 'This article follows Stonehenge as a real prehistoric monument with later legend attached. Archaeological context and mythic reception are kept in separate layers.'
  }),
  topic({
    categorySlug: 'mythic-objects',
    slug: 'ark-of-the-covenant-legend',
    title: 'Ark of the Covenant Legend: Sacred Chest, Lost Relic, and the Object No One Can Treat as Ordinary',
    subject: 'Ark of the Covenant',
    tag: 'Sacred Object Legend',
    tags: ['Sacred Object Legend', 'Ark of the Covenant', 'Lost Relic', 'Biblical Legend'],
    keyword: 'Ark of the Covenant legend',
    detail: 'the sacred chest from biblical tradition and the later legends about its power, disappearance, and possible location',
    sourceBasis: 'biblical tradition, religious history summaries, relic legends, and later cultural reception',
    evidence: 'textual tradition, historical discussion, relic-location claims, and source-limited reception history',
    vocabulary: ['Ark of the Covenant', 'sacred chest', 'lost object', 'biblical tradition', 'location'],
    sources: [
      source('Encyclopaedia Britannica - Ark of the Covenant', 'https://www.britannica.com/topic/Ark-of-the-Covenant', 'Supports the general description and religious tradition around the Ark.'),
      source('Bible Odyssey - Ark of the Covenant', 'https://www.bibleodyssey.org/', 'Supports scholarly discussion of biblical objects and tradition context.')
    ],
    quickAnswer: [
      'The Ark of the Covenant is the sacred chest described in biblical tradition as connected with the tablets of the covenant and divine presence. Later legend focuses on its power, disappearance, and possible hidden location.',
      'The Ark functions as a mythic object because it is both container and boundary. It holds sacred meaning, but stories about it also warn that not every object can be handled like ordinary property.'
    ],
    intro: [
      'The Ark of the Covenant is remembered as a chest, but the story never treats it as simple storage.',
      'It is an object that changes the space around it.'
    ],
    core: [
      'In biblical tradition, the Ark is associated with the covenant, sacred presence, ritual authority, and danger when approached improperly.',
      'Its later disappearance made the object even more powerful in imagination. A sacred object became a lost object.'
    ],
    context: [
      'Lost relic legends often grow stronger when the object is both named and absent. The Ark has a clear identity, but its final location remains disputed in public imagination.',
      'That gap allows religious tradition, historical inquiry, and adventure mythology to overlap.'
    ],
    variants: [
      'Later versions place the Ark in different hidden locations or connect it with secret guardianship. Some claims are religious traditions, while others are speculative modern searches.',
      'Popular culture often emphasizes danger and discovery, but the older tradition centers sacred presence and ritual boundary.'
    ],
    record: [
      'The record can support the Ark as a central object in biblical tradition and later relic legend. It cannot verify every proposed location or discovery claim.',
      'A source-aware article keeps textual tradition, faith claims, and modern speculation distinct.'
    ],
    meaning: [
      'The Ark may be read as a mythic object about nearness to the sacred. It is powerful because it is not open to casual possession.',
      'That is why the legend lasts. The missing chest still feels guarded by the rules around it.'
    ],
    related: ['ring-of-gyges-myth', 'spear-of-destiny-holy-lance', 'mjolnir-thors-hammer'],
    sourceNote: 'This article follows the Ark of the Covenant as a sacred object in textual tradition and later legend. Location claims are treated as disputed unless strongly sourced.'
  }),
  topic({
    categorySlug: 'legend-origins',
    slug: 'horseshoe-luck-origin',
    title: 'Horseshoe Luck Origin: Iron, Doorways, and How a Stable Object Became a Protective Sign',
    subject: 'Horseshoe Luck',
    tag: 'Luck Symbol Origin',
    tags: ['Luck Symbol Origin', 'Horseshoe', 'Protective Custom', 'Superstition'],
    keyword: 'horseshoe luck origin',
    detail: 'the superstition that a horseshoe brings luck or protection when kept near a doorway or hung in a particular direction',
    sourceBasis: 'superstition history, protective folklore, iron beliefs, doorway customs, and later household tradition',
    evidence: 'folklore summaries, superstition references, regional custom descriptions, and source-limited origin explanations',
    vocabulary: ['horseshoe', 'luck', 'iron', 'doorway', 'threshold'],
    sources: [
      source('Encyclopaedia Britannica - Superstition', 'https://www.britannica.com/topic/superstition', 'Supports the broader superstition framework used for protective signs.'),
      source('Historic UK - Lucky Horseshoes', 'https://www.historic-uk.com/CultureUK/Lucky-Horseshoes/', 'Supports public folklore summaries around horseshoes, luck, iron, and doorway customs.')
    ],
    quickAnswer: [
      'Horseshoe luck is a superstition that treats the horseshoe as a protective or lucky object, often placed above a doorway. Explanations usually involve iron, horses, blacksmithing, shape, and the boundary of the home.',
      'The origin is layered rather than single. The horseshoe may be read as a practical object that became a sign of protection because it joined strong material, animal power, and household threshold belief.'
    ],
    intro: [
      'A horseshoe is ordinary until it is placed above a door.',
      'Then it stops being a used object and becomes a sign.'
    ],
    core: [
      'Common belief says a horseshoe can bring luck or guard a house. Some hang it with the open end upward to hold luck, while others hang it downward so luck pours out.',
      'That disagreement is part of the tradition. The object matters, but the way people read it changes by place and custom.'
    ],
    context: [
      'Iron has long carried protective associations in European folklore. Doorways also matter because they mark the boundary between inside and outside.',
      'A horseshoe combines both ideas. It is iron shaped by fire, connected with a valuable animal, and placed where protection feels useful.'
    ],
    variants: [
      'Some origin stories connect horseshoes with saints, blacksmiths, or protection from harmful spirits. Others focus on the crescent shape or the number of nail holes.',
      'Later household versions often keep the custom even when the old explanation is forgotten.'
    ],
    record: [
      'The record can support horseshoe luck as a widespread protective superstition with several origin explanations. It cannot reduce every regional custom to one beginning.',
      'The best account treats the superstition as layered folklore around material, doorway, and luck.'
    ],
    meaning: [
      'Horseshoe luck may be read as a story about making the threshold safer. The doorway is where the home meets the unknown.',
      'That is why the symbol remains simple and durable. It gives protection a visible shape.'
    ],
    related: ['black-cat-superstition-origin', 'friday-the-13th-origin', 'jack-o-lantern-stingy-jack-origin'],
    sourceNote: 'This article follows horseshoe luck as a layered superstition origin. Regional hanging customs and origin stories are treated as variants rather than one fixed rule.'
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
