const fs = require('fs');
const path = require('path');
const { buildContentDNA } = require('./article-dna-utils');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const categoriesPath = path.join(root, 'data', 'categories.json');
const publishedAt = '2026-07-12';

const stories = readJson(storiesPath);
const categories = readJson(categoriesPath);
const storySlugs = new Set(stories.map((story) => story.slug));
const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));

const plans = {
  'urban-legends': [
    topic('bloody-mary-mirror-legend', 'Bloody Mary Urban Legend: Origin, Ritual, and Mirror Folklore', 'the mirror ritual in which a name is repeated in darkness and the room becomes the stage for a warning story', 'mirror folklore, party-game retellings, modern legend scholarship, and oral variants', 'Bloody Mary Legend', ['Mirror Ritual', 'Bathroom Mirror', 'Name Chant'], 'Urban legend scholarship, oral-tradition references, and repeated English-language variants'),
    topic('hookman-urban-legend', 'The Hookman Urban Legend: Origin, Meaning, and Roadside Warning Folklore', 'the parked-car warning story built around a hook, a remote road, and the sudden proof left behind', 'urban legend collections, dating-age cautionary tales, roadside variants, and folklore analysis', 'Warning Legend', ['Hookman Legend', 'Lovers Lane', 'Roadside Warning'], 'Urban legend collections and variant studies of youth-warning stories'),
    topic('killer-in-the-backseat-legend', 'Killer in the Backseat Legend: Why This Driving Urban Legend Still Works', 'the frightening driving story where the danger is hidden inside the car rather than outside it', 'urban legend scholarship, traffic folklore, safety warnings, and recurring backseat variants', 'Driving Legend', ['Backseat Killer', 'Car Folklore', 'Warning Story'], 'Modern legend scholarship and recurring vehicle-safety folklore'),
    topic('alligator-in-the-sewer-legend', 'Alligators in the Sewer: Origin, Meaning, and City Folklore', 'the city rumor that turns underground infrastructure into a hidden habitat for impossible animals', 'newspaper references, urban folklore studies, city-animal rumors, and infrastructure legends', 'City Folklore', ['Sewer Alligator', 'Urban Wildlife', 'Hidden City'], 'Urban folklore research and documented discussion of sewer-alligator legends'),
    topic('babysitter-and-the-man-upstairs', 'The Babysitter and the Man Upstairs: Origin and Meaning of the Telephone Legend', 'the phone-call warning story where the threat is revealed to be inside the house', 'urban legend collections, telephone-era variants, domestic-warning motifs, and source-aware retellings', 'Telephone Legend', ['Babysitter Legend', 'Phone Call', 'Inside the House'], 'Urban legend scholarship and repeated telephone-warning versions')
  ],
  'internet-folklore': [
    topic('slender-man-internet-folklore', 'Slender Man Explained: Internet Folklore, Imageboard Origins, and Modern Myth', 'the tall faceless figure that moved from online image manipulation into one of the most recognizable internet legends', 'documented online origins, forum culture, creepypasta studies, and media retellings', 'Internet Legend', ['Slender Man', 'Creepypasta', 'Imageboard Folklore'], 'Documented internet-origin accounts and modern folklore analysis'),
    topic('polybius-arcade-legend', 'Polybius Arcade Legend: Origin, Meaning, and Lost Game Folklore', 'the rumored arcade cabinet that became a story about missing games, memory, and machine anxiety', 'video-game history writing, internet folklore archives, arcade rumor variants, and lost-media discussion', 'Lost Game Legend', ['Polybius', 'Arcade Rumor', 'Lost Media'], 'Game-history references and internet folklore documentation'),
    topic('herobrine-minecraft-legend', 'Herobrine Minecraft Legend: Origin, Meaning, and Gaming Folklore', 'the impossible player figure said to appear inside a familiar block world and change how screenshots are read', 'Minecraft community history, wiki documentation, forum retellings, and gaming folklore analysis', 'Gaming Folklore', ['Herobrine', 'Minecraft Legend', 'Digital Ghost'], 'Community documentation and gaming-folklore retellings'),
    topic('momo-challenge-internet-rumor', 'Momo Challenge Rumor: How a Viral Warning Became Internet Folklore', 'the online panic in which a disturbing image, child-safety fears, and reposted warnings formed a modern rumor cycle', 'fact-checking archives, platform-era reporting, media-literacy discussion, and viral warning analysis', 'Viral Rumor', ['Momo Challenge', 'Online Panic', 'Viral Warning'], 'Fact-checking archives and reporting on viral internet-warning cycles'),
    topic('candle-cove-creepypasta-origin', 'Candle Cove Creepypasta: Origin, Meaning, and Shared-Memory Internet Folklore', 'the fictional lost television discussion that became a model for how online communities build false shared memory', 'creepypasta publication history, internet folklore analysis, fan retellings, and lost-media motifs', 'Creepypasta', ['Candle Cove', 'Lost TV', 'Shared Memory'], 'Creepypasta history and internet folklore discussion')
  ],
  'strange-places': [
    topic('winchester-mystery-house', 'Winchester Mystery House: History, Legend, and the Architecture of Rumor', 'the California house whose unusual rooms, stairs, and building history became attached to spiritualist-era legend', 'historic house materials, tourism records, architectural history, and popular retellings', 'Strange House', ['Winchester House', 'Haunted Architecture', 'Spiritualism'], 'Historic-site materials and source-aware accounts of the house legend'),
    topic('island-of-the-dolls', 'Island of the Dolls: Origin, Folklore, and the Strange Place Legend', 'the island landscape where dolls, canals, and repeated visitor stories created a powerful modern place legend', 'local tourism materials, regional reporting, travel accounts, and folklore retellings', 'Doll Island', ['Island of the Dolls', 'Xochimilco', 'Place Legend'], 'Tourism sources, regional accounts, and source-limited folklore retellings'),
    topic('hoia-baciu-forest', 'Hoia Baciu Forest: Folklore, Photographs, and the Strange Forest Legend', 'the Romanian forest known through stories about clearings, photographs, missing-time claims, and local mystery tourism', 'regional history, tourism materials, photographic claims, and paranormal folklore coverage', 'Forest Legend', ['Hoia Baciu', 'Strange Forest', 'Romanian Folklore'], 'Regional and tourism accounts with careful separation of claim and record'),
    topic('crooked-forest-poland', 'The Crooked Forest in Poland: Strange Nature, Place Legend, and Possible Explanations', 'the grove of bent pine trees whose shape invites practical explanations and persistent visual mystery', 'forestry discussion, regional records, travel documentation, and landscape folklore', 'Unusual Grove', ['Crooked Forest', 'Bent Trees', 'Landscape Mystery'], 'Forestry-informed accounts and regional descriptions of the bent pine grove'),
    topic('catacombs-of-paris-legends', 'Paris Catacombs Legends: History, Underground Folklore, and the City Beneath the City', 'the underground ossuary and tunnel network that turns documented urban history into a deeper folklore of hidden passageways', 'museum materials, city history, visitor accounts, and underground-urban folklore', 'Underground City', ['Paris Catacombs', 'Ossuary', 'Hidden Tunnels'], 'Official historical materials and source-aware underground city folklore')
  ],
  'unexplained-mysteries': [
    topic('dyatlov-pass-incident', 'Dyatlov Pass Incident: Timeline, Evidence Limits, and Why the Mystery Lasts', 'the 1959 Ural Mountains case whose official records, injuries, weather, and later theories remain widely debated', 'official investigation summaries, historical reporting, scientific review, and source-limited analysis', 'Unresolved Case', ['Dyatlov Pass', 'Ural Mountains', 'Evidence Limits'], 'Documented case summaries and scientific or historical review'),
    topic('roanoke-colony-mystery', 'Roanoke Colony Mystery: History, Evidence, and the Lost Colony Legend', 'the disappearance narrative surrounding the English colony, the Croatoan clue, and centuries of interpretation', 'historical records, National Park Service materials, colonial history, and later legend formation', 'Lost Colony', ['Roanoke Colony', 'Croatoan', 'Historical Mystery'], 'Historical records and public-history materials about the colony'),
    topic('voynich-manuscript-mystery', 'Voynich Manuscript: History, Theories, and the Mystery of an Unread Book', 'the illustrated manuscript whose unknown script keeps attracting code, language, and manuscript-history theories', 'library catalog records, manuscript scholarship, code-history discussion, and source-aware summaries', 'Manuscript Mystery', ['Voynich Manuscript', 'Unknown Script', 'Medieval Manuscript'], 'Library records and manuscript-history references'),
    topic('mary-celeste-mystery', 'Mary Celeste Mystery: What the Record Shows and Why the Ghost Ship Story Endures', 'the abandoned brigantine whose recovered condition invited theories far beyond the maritime record', 'maritime history, official inquiry summaries, shipping records, and ghost-ship folklore', 'Ghost Ship', ['Mary Celeste', 'Abandoned Ship', 'Maritime Mystery'], 'Maritime history and inquiry-based accounts'),
    topic('wow-signal-mystery', 'The Wow! Signal: Radio Astronomy, Evidence Limits, and the Mystery That Remains', 'the brief 1977 radio signal that became a compact symbol of listening for something beyond ordinary noise', 'radio astronomy records, observatory history, scientific follow-up, and SETI context', 'Signal Mystery', ['Wow Signal', 'SETI', 'Radio Astronomy'], 'Scientific and observatory-based discussion of the signal')
  ],
  'classic-folklore': [
    topic('baba-yaga-folklore', 'Baba Yaga Folklore: Origins, Meanings, and the Witch in the Forest Hut', 'the Slavic forest figure whose hut, tests, gifts, and danger make her more complex than a simple witch', 'folktale collections, Slavic folklore scholarship, tale variants, and symbolic readings', 'Slavic Folklore', ['Baba Yaga', 'Forest Witch', 'Chicken-Leg Hut'], 'Folktale collections and Slavic folklore scholarship'),
    topic('la-llorona-folklore', 'La Llorona: Origin, Meaning, and the Weeping Woman in Folklore', 'the weeping woman tradition that carries grief, warning, water, motherhood, and regional retellings', 'Mexican and Latin American folklore sources, oral tradition, regional variants, and cultural analysis', 'Weeping Woman', ['La Llorona', 'Water Legend', 'Latin American Folklore'], 'Regional folklore sources and documented retellings'),
    topic('banshee-irish-folklore', 'Banshee Folklore: Irish Death Omen, Meaning, and Common Versions', 'the Irish warning figure whose cry marks family memory, mourning, and the border between omen and story', 'Irish folklore collections, dictionary references, oral tradition, and regional variants', 'Irish Folklore', ['Banshee', 'Death Omen', 'Keening'], 'Irish folklore references and oral-tradition summaries'),
    topic('will-o-the-wisp-folklore', 'Will-o-the-Wisp Folklore: Marsh Lights, Meaning, and Wandering Fire Legends', 'the wandering light tradition that joins natural explanation, moral warning, and travel danger', 'folklore dictionaries, marsh-light explanations, regional variants, and travel-warning motifs', 'Wandering Light', ['Will-o-the-Wisp', 'Marsh Light', 'False Lantern'], 'Folklore references and natural-history discussion of marsh-light traditions'),
    topic('changeling-folklore', 'Changeling Folklore: Origin, Meaning, and the Fear of the Replaced Child', 'the child-substitution belief that reflects household anxiety, illness interpretation, and supernatural explanation', 'folklore collections, European tale variants, social-history analysis, and source-aware interpretation', 'Changeling Legend', ['Changeling', 'Fairy Folklore', 'Replaced Child'], 'European folklore collections and social-history readings')
  ],
  'modern-legends': [
    topic('mothman-legend', 'Mothman Legend: Point Pleasant, Folklore, and the Modern Creature Story', 'the winged figure associated with Point Pleasant whose sightings, newspaper coverage, and later retellings made a modern legend', 'regional history, newspaper context, folklore discussion, and festival memory', 'Modern Creature', ['Mothman', 'Point Pleasant', 'Winged Figure'], 'Regional reports and modern folklore discussion'),
    topic('bigfoot-legend', 'Bigfoot Legend: Tracks, Sightings, and the American Forest Folklore Pattern', 'the large forest figure whose footprints, witness claims, and regional traditions became a durable modern legend', 'folklore references, natural-history skepticism, regional sighting traditions, and media history', 'Cryptid Folklore', ['Bigfoot', 'Sasquatch', 'Forest Legend'], 'Folklore and natural-history sources on Sasquatch traditions'),
    topic('loch-ness-monster-legend', 'Loch Ness Monster: History, Photographs, and the Legend of Nessie', 'the Scottish lake creature tradition shaped by reported sightings, famous images, tourism, and skeptical review', 'Scottish history, tourism records, photograph analysis, and lake-monster folklore', 'Lake Monster', ['Loch Ness Monster', 'Nessie', 'Lake Legend'], 'Historical, tourism, and skeptical accounts of the Loch Ness legend'),
    topic('jersey-devil-legend', 'Jersey Devil Legend: Pine Barrens Folklore, Origin, and Modern Versions', 'the New Jersey creature story tied to the Pine Barrens, regional identity, newspaper waves, and repeated sightings', 'regional folklore, newspaper history, local tradition, and modern retellings', 'Regional Creature', ['Jersey Devil', 'Pine Barrens', 'American Folklore'], 'Regional folklore and newspaper-history references'),
    topic('chupacabra-legend', 'Chupacabra Legend: Origin, Meaning, and the Modern Monster Rumor', 'the livestock-attacking creature rumor that moved through media, regional fears, and changing visual descriptions', 'Latin American reporting, folklore analysis, animal-misidentification discussion, and media retellings', 'Modern Monster', ['Chupacabra', 'Livestock Legend', 'Monster Rumor'], 'Media-history and folklore analysis of the Chupacabra legend')
  ],
  myths: [
    topic('prometheus-myth', 'Prometheus Myth: Fire, Punishment, and the Meaning of a Culture Hero', 'the Greek myth of stolen fire, divine punishment, and the dangerous gift that changes human life', 'classical sources, mythology references, symbolic interpretation, and later retellings', 'Greek Myth', ['Prometheus', 'Fire Myth', 'Culture Hero'], 'Classical mythology sources and reference summaries'),
    topic('persephone-myth', 'Persephone Myth: Underworld, Seasons, and the Meaning of Return', 'the Greek myth that links descent, return, grief, agriculture, and the changing year', 'classical sources, mythology references, ritual context, and symbolic readings', 'Greek Myth', ['Persephone', 'Underworld', 'Season Myth'], 'Classical mythology sources and ritual-history summaries'),
    topic('orpheus-and-eurydice-myth', 'Orpheus and Eurydice: Myth, Meaning, and the Rule Against Looking Back', 'the underworld journey where love, music, a command, and one backward glance become the whole tragedy', 'classical sources, mythological summaries, literary retellings, and symbolic interpretation', 'Greek Myth', ['Orpheus', 'Eurydice', 'Underworld Journey'], 'Classical mythology and literary-history references'),
    topic('ragnarok-norse-myth', 'Ragnarok Norse Myth: Ending, Renewal, and the Meaning of the Final Battle', 'the Norse mythic ending where gods, monsters, destruction, and renewal are held in the same story', 'Norse myth sources, Eddic summaries, mythology references, and cultural interpretation', 'Norse Myth', ['Ragnarok', 'Norse Mythology', 'World Ending'], 'Norse mythology source summaries and reference traditions'),
    topic('isis-and-osiris-myth', 'Isis and Osiris: Egyptian Myth, Resurrection, and the Meaning of Restoration', 'the Egyptian myth of murder, searching, reassembly, mourning, and restored kingship', 'Egyptian mythology references, ancient source summaries, ritual interpretation, and later retellings', 'Egyptian Myth', ['Isis', 'Osiris', 'Resurrection Myth'], 'Egyptian mythology references and source-aware summaries')
  ],
  'mythic-creatures': [
    topic('yeti-folklore', 'Yeti Folklore: Himalayan Snowman Legends, Tracks, and Modern Meaning', 'the Himalayan wild-man figure whose tracks, local names, and expedition stories formed a global creature legend', 'Himalayan folklore references, expedition history, natural-history skepticism, and media retellings', 'Mountain Creature', ['Yeti', 'Abominable Snowman', 'Himalayan Folklore'], 'Himalayan folklore and expedition-history accounts'),
    topic('kappa-japanese-folklore', 'Kappa Folklore: Japanese Water Creature, Warnings, and Common Versions', 'the Japanese water creature tradition tied to rivers, manners, danger, and protective warning stories', 'Japanese folklore references, regional variants, moral-warning motifs, and popular retellings', 'Water Creature', ['Kappa', 'Japanese Folklore', 'River Spirit'], 'Japanese folklore references and regional versions'),
    topic('kitsune-fox-folklore', 'Kitsune Folklore: Fox Spirits, Shapeshifting, and Japanese Mythic Meaning', 'the fox-spirit tradition where intelligence, transformation, shrine culture, and ambiguity shape the creature', 'Japanese folklore references, religious context, regional variants, and symbolic interpretation', 'Fox Spirit', ['Kitsune', 'Fox Spirit', 'Shapeshifter'], 'Japanese folklore and religious-context references'),
    topic('thunderbird-folklore', 'Thunderbird Folklore: Storm Bird Meaning, Versions, and Cultural Limits', 'the powerful storm-bird figure whose meanings vary across Indigenous traditions and must be treated with care', 'Indigenous folklore summaries, cultural-context references, regional variants, and source limits', 'Storm Creature', ['Thunderbird', 'Storm Bird', 'Indigenous Folklore'], 'Culturally cautious summaries and regional tradition references'),
    topic('mermaid-folklore', 'Mermaid Folklore: Sea Beings, Warnings, and Why the Legend Travels', 'the half-human sea being whose versions move between danger, desire, water, song, and border-crossing', 'folklore dictionaries, maritime legend collections, regional variants, and mythic symbolism', 'Sea Being', ['Mermaid', 'Sea Folklore', 'Water Spirit'], 'Maritime folklore and comparative myth references')
  ],
  'lost-worlds': [
    topic('atlantis-lost-world', 'Atlantis: Origin, Meaning, and the Lost Island Myth That Endures', 'the famous lost-island account that began in Plato and became a lasting model for imagined vanished worlds', 'classical texts, historical reception, archaeology skepticism, and later mythic retellings', 'Lost Island', ['Atlantis', 'Plato', 'Lost Civilization'], 'Classical-source summaries and historical reception of Atlantis'),
    topic('el-dorado-legend', 'El Dorado: Origin, Gold, and the Lost City Legend That Changed Maps', 'the gold-laden legend that moved from ritual and ruler to city, kingdom, and colonial search fantasy', 'historical accounts, colonial exploration records, South American context, and myth formation', 'Golden City', ['El Dorado', 'Lost City', 'Gold Legend'], 'Historical and colonial-context summaries of El Dorado'),
    topic('lemuria-lost-continent', 'Lemuria: Science, Theosophy, and the Lost Continent That Became Myth', 'the proposed lost land bridge that moved from scientific hypothesis into esoteric and pop-cultural lost-world lore', 'history of science, theosophical writing, geology context, and later retellings', 'Lost Continent', ['Lemuria', 'Lost Continent', 'Pseudoarchaeology'], 'History-of-science and cultural-history discussion'),
    topic('shangri-la-legend', 'Shangri-La: Lost Valley, Utopia, and the Myth of a Hidden Paradise', 'the fictional hidden valley that became a shorthand for remote paradise, spiritual refuge, and unreachable place', 'literary history, travel imagination, cultural reception, and hidden-valley motifs', 'Hidden Valley', ['Shangri-La', 'Hidden Paradise', 'Lost Valley'], 'Literary-history and cultural-reception references'),
    topic('avalon-legend', 'Avalon: Arthurian Island, Healing, and the Legend of the Place Beyond Reach', 'the Arthurian island associated with healing, departure, and the suspended return of a king', 'Arthurian literature, medieval tradition, place associations, and later retellings', 'Arthurian Place', ['Avalon', 'Arthurian Legend', 'Island of Apples'], 'Arthurian literature and medieval-tradition summaries')
  ],
  'strange-nature': [
    topic('bermuda-triangle-mystery', 'Bermuda Triangle: Mystery, Weather, and Why the Sea Legend Persists', 'the Atlantic region whose disappearances, media retellings, and natural explanations shaped a famous sea mystery', 'maritime records, weather context, skeptical review, and popular legend history', 'Sea Mystery', ['Bermuda Triangle', 'Atlantic Mystery', 'Disappearance Legend'], 'Maritime-history and skeptical analysis of the Bermuda Triangle'),
    topic('sailing-stones-racetrack-playa', 'Sailing Stones of Racetrack Playa: Strange Nature, Tracks, and Explanation', 'the moving desert stones whose long tracks once looked impossible before ice, water, and wind were documented', 'geology research, national-park context, photographic records, and natural explanation', 'Moving Stones', ['Sailing Stones', 'Racetrack Playa', 'Desert Mystery'], 'Geology and national-park references'),
    topic('ball-lightning-folklore', 'Ball Lightning: Strange Weather, Witness Reports, and the Mystery of Moving Light', 'the reported luminous weather phenomenon that remains difficult to study and easy to fold into folklore', 'atmospheric science, witness-report studies, historical accounts, and evidence limits', 'Weather Mystery', ['Ball Lightning', 'Atmospheric Phenomenon', 'Moving Light'], 'Atmospheric science and historical witness-report discussion'),
    topic('blood-rain-folklore', 'Blood Rain: Natural Explanation, Omen Folklore, and the Red Rain Mystery', 'red rain events that have been read as omens while also having dust, algae, or other natural explanations', 'meteorological records, historical omen traditions, scientific explanation, and folklore context', 'Weather Omen', ['Blood Rain', 'Red Rain', 'Omen Folklore'], 'Meteorology and folklore references on red rain traditions'),
    topic('hessdalen-lights', 'Hessdalen Lights: Strange Nature, Observations, and the Valley Light Mystery', 'the recurring Norwegian light phenomenon documented through observation, instruments, and unresolved explanation', 'field observations, scientific reports, regional history, and evidence-limited analysis', 'Light Phenomenon', ['Hessdalen Lights', 'Valley Lights', 'Atmospheric Mystery'], 'Scientific observation and regional-history sources')
  ],
  'legendary-places': [
    topic('area-51-legend', 'Area 51: Secrecy, UFO Folklore, and the Making of a Modern Legendary Place', 'the Nevada military site whose secrecy, declassified context, and UFO stories formed a major modern place legend', 'government history, aviation secrecy, UFO folklore, and popular-culture retellings', 'Secret Site', ['Area 51', 'UFO Folklore', 'Nevada Test Site'], 'Government-history context and modern folklore discussion'),
    topic('stonehenge-legends', 'Stonehenge Legends: History, Folklore, and Why the Monument Keeps Its Mystery', 'the prehistoric monument whose documented archaeology exists alongside giant, wizard, and origin legends', 'heritage-site materials, archaeology summaries, medieval legend, and modern interpretation', 'Ancient Monument', ['Stonehenge', 'Megalith', 'Monument Folklore'], 'Heritage and archaeology summaries with folklore context'),
    topic('glastonbury-tor-legends', 'Glastonbury Tor Legends: Avalon, Holy Ground, and the Hill of Many Stories', 'the English hill layered with Christian, Arthurian, and local traditions that keep changing its meaning', 'heritage materials, Arthurian tradition, local history, and sacred-place folklore', 'Sacred Hill', ['Glastonbury Tor', 'Avalon', 'Sacred Place'], 'Heritage and local-history references'),
    topic('mount-shasta-legends', 'Mount Shasta Legends: Sacred Mountain, Hidden Cities, and Modern Place Folklore', 'the California mountain surrounded by Indigenous significance, spiritual retellings, hidden-city claims, and modern mythology', 'regional history, cultural-source limits, spiritual retellings, and place folklore', 'Sacred Mountain', ['Mount Shasta', 'Hidden City', 'Mountain Folklore'], 'Regional history and culturally cautious place-lore summaries'),
    topic('oak-island-mystery', 'Oak Island Mystery: Treasure Pit, Searches, and the Legendary Place That Keeps Returning', 'the island treasure story built from excavations, theories, collapse reports, and a long search tradition', 'historical accounts, excavation history, treasure-lore reporting, and source limits', 'Treasure Island', ['Oak Island', 'Money Pit', 'Treasure Legend'], 'Historical and excavation-history summaries')
  ],
  'mythic-objects': [
    topic('excalibur-sword-legend', 'Excalibur: Arthurian Sword, Symbolism, and the Mythic Object That Chooses a King', 'the sword tradition that joins kingship, rightful rule, lake imagery, and the memory of Arthurian return', 'Arthurian literature, medieval romance summaries, symbol analysis, and retellings', 'Arthurian Object', ['Excalibur', 'Sword in the Stone', 'Arthurian Legend'], 'Arthurian literary sources and medieval-tradition summaries'),
    topic('holy-grail-legend', 'Holy Grail: Origin, Meaning, and the Quest Object in Medieval Legend', 'the sacred quest object whose meanings shift through romance, Christian symbolism, and later mystery traditions', 'medieval romance, religious symbolism, literary history, and cultural reception', 'Quest Object', ['Holy Grail', 'Grail Quest', 'Medieval Romance'], 'Medieval literature and religious-symbolism references'),
    topic('philosophers-stone-legend', 'Philosopher\'s Stone: Alchemy, Immortality, and the Mythic Object of Transformation', 'the alchemical object associated with transmutation, perfection, immortality, and the dream of impossible change', 'alchemy history, esoteric tradition, science-history context, and literary reception', 'Alchemy Object', ['Philosophers Stone', 'Alchemy', 'Transmutation'], 'Alchemy history and science-history references'),
    topic('pandoras-box-myth', 'Pandora\'s Box: Myth, Meaning, and the Object That Releases Trouble', 'the container in Greek myth that holds release, consequence, hope, and the difficulty of closing what has been opened', 'classical mythology, translation history, symbolic interpretation, and retellings', 'Greek Object Myth', ['Pandora', 'Hope', 'Forbidden Container'], 'Classical mythology and translation-history summaries'),
    topic('aegis-mythic-shield', 'Aegis: Mythic Shield, Divine Protection, and the Object of Authority', 'the divine protective object linked with Zeus, Athena, terror, protection, and visible authority', 'Greek mythology references, classical art context, literary sources, and symbolic readings', 'Divine Object', ['Aegis', 'Athena', 'Divine Shield'], 'Classical mythology and art-history references')
  ],
  'legend-origins': [
    topic('why-mirrors-become-haunted-objects', 'Why Mirrors Become Haunted Objects: Folklore Origins and Symbolic Meaning', 'the repeated use of mirrors as thresholds, doubles, proof surfaces, and unstable witnesses in folklore and urban legend', 'folklore scholarship, mirror beliefs, visual culture, and recurring legend motifs', 'Mirror Motif', ['Haunted Mirror', 'Reflection Folklore', 'Threshold Object'], 'Folklore motif study and symbolic readings of mirrors'),
    topic('why-crossroads-become-folklore-thresholds', 'Why Crossroads Become Folklore Thresholds: Roads, Choices, and Meeting Places', 'the recurring crossroads motif where travel, choice, danger, bargain, and boundary meet in one visible place', 'folklore dictionaries, road traditions, ritual history, and comparative legend motifs', 'Crossroads Motif', ['Crossroads', 'Threshold Folklore', 'Road Legend'], 'Comparative folklore sources and motif analysis'),
    topic('why-vanishing-passengers-return-in-legends', 'Why Vanishing Passengers Return in Legends: Folklore Origin and Modern Meaning', 'the recurring passenger who appears, delivers a warning or memory, and leaves proof behind after disappearing', 'urban legend scholarship, travel folklore, ghost-passenger variants, and modern retellings', 'Vanishing Passenger', ['Phantom Traveler', 'Roadside Ghost', 'Passenger Legend'], 'Urban legend scholarship and travel-ghost variants'),
    topic('why-forbidden-rooms-create-lasting-legends', 'Why Forbidden Rooms Create Lasting Legends: Folklore Origin and Narrative Pattern', 'the locked or forbidden room motif that turns curiosity, rule-breaking, and hidden knowledge into a durable story engine', 'folktale studies, literary motifs, domestic folklore, and modern variants', 'Forbidden Room', ['Locked Room', 'Secret Room', 'Curiosity Motif'], 'Folktale and literary-motif references'),
    topic('how-cursed-images-became-internet-folklore', 'How Cursed Images Became Internet Folklore: Origin, Meaning, and Digital Unease', 'the online pattern where ordinary photographs become unsettling through missing context, reposting, and shared interpretation', 'internet folklore analysis, visual culture, meme history, and online archive behavior', 'Cursed Image Motif', ['Cursed Image', 'Digital Unease', 'Internet Folklore'], 'Internet folklore and visual-culture discussion')
  ]
};

let added = 0;
const existingQueries = new Set();
for (const story of stories) {
  if (story.contentDNA?.canonicalQuery) {
    existingQueries.add(String(story.contentDNA.canonicalQuery).toLowerCase().trim());
  }
}

for (const category of categories) {
  const categoryPlans = plans[category.slug] || [];
  const relatedPool = stories.filter((story) => story.categorySlug === category.slug).map((story) => story.slug);

  for (let index = 0; index < categoryPlans.length; index += 1) {
    const story = makeCanonicalStory(category, categoryPlans[index], index, relatedPool);
    if (storySlugs.has(story.slug)) continue;

    story.contentDNA = buildContentDNA(story, existingQueries);
    stories.unshift(story);
    storySlugs.add(story.slug);
    relatedPool.unshift(story.slug);
    added += 1;
  }
}

writeJson(storiesPath, stories);
console.log(`Added ${added} canonical archive stories.`);

function makeCanonicalStory(category, plan, index, relatedPool) {
  const title = plan.title;
  const slug = slugify(plan.slug || title);
  const primaryTag = plan.primaryTag;
  const tags = unique([primaryTag, ...plan.tags]).slice(0, 5);
  const seedKeyword = plan.seedKeyword || title.replace(/:.*$/, '').toLowerCase();
  const excerpt = plan.excerpt || `A source-aware Kyunolab record tracing ${plan.detail}.`;
  const metaDescription = trimMeta(`${title.replace(/:.*$/, '')} explains ${plan.detail}, with source limits, common versions, folklore meaning, and why the story still lasts.`);

  return {
    id: slug,
    slug,
    title,
    displayTitle: title,
    h1: title,
    seoTitle: title,
    metaTitle: `${title} | Kyunolab Mystery Archive`,
    metaDescription,
    category: category.title,
    categorySlug: category.slug,
    categoryGroup: category.group,
    tag: primaryTag,
    primaryTag,
    seedKeyword,
    primaryKeyword: seedKeyword,
    searchIntent: searchIntentFor(category.slug),
    articleFormat: articleFormatFor(category.slug, category.group),
    cluster: `${category.title} / ${primaryTag}`,
    relatedKeywords: unique([
      `${seedKeyword} origin`,
      `${seedKeyword} meaning`,
      `${primaryTag.toLowerCase()} folklore`,
      `${category.title.toLowerCase()} explained`
    ]),
    secondaryKeywords: unique([
      `${seedKeyword} origin`,
      `${seedKeyword} meaning`,
      ...tags.map((tag) => tag.toLowerCase())
    ]).slice(0, 6),
    topicScore: 88 + (index % 5),
    topicStatus: 'approved',
    scoreBreakdown: {
      searchDemand: 28,
      clickCuriosity: 24,
      siteFit: 22,
      expansionPotential: 12,
      differentiation: 8
    },
    summaryAnswer: `${title.replace(/:.*$/, '')} is treated here as a canonical archive subject: a well-known legend, myth, place, object, creature, or mystery whose common record can be described without turning uncertain claims into verified fact.`,
    readTime: `${8 + (index % 4)} min read`,
    storyType: storyTypeFor(category.slug),
    sourceStatus: sourceStatusFor(category, primaryTag),
    excerpt,
    introSummary: excerpt,
    publishedAt,
    updatedAt: publishedAt,
    relatedStoryIds: relatedPool.filter((item) => item !== slug).slice(0, 4),
    relatedStorySlugs: relatedPool.filter((item) => item !== slug).slice(0, 4),
    tags,
    detail: plan.detail,
    evidence: plan.evidence,
    generationMode: 'canonical-archive',
    researchSources: researchSourcesFor(plan, category),
    sourceNotes: sourceNotesFor(plan, category),
    contentType: 'story'
  };
}

function topic(slug, title, detail, evidence, primaryTag, tags, sourceFrame) {
  return { slug, title, detail, evidence, primaryTag, tags, sourceFrame };
}

function researchSourcesFor(plan, category) {
  const subject = plan.title.replace(/:.*$/, '');
  const categorySource = sourceProfile(category.slug);
  return [
    {
      title: categorySource.primary,
      supports: `Provides source-aware context for ${subject} as ${category.title.toLowerCase()} rather than a newly invented story.`
    },
    {
      title: plan.sourceFrame || `Reference and folklore summaries for ${subject}`,
      supports: `Supports the common record, recurring motifs, and variant-aware treatment of ${subject}.`
    },
    {
      title: categorySource.secondary,
      supports: `Supports the distinction between documented background, retelling tradition, and claims that should not be stated as verified fact.`
    }
  ];
}

function sourceNotesFor(plan, category) {
  const subject = plan.title.replace(/:.*$/, '');
  return {
    sharedVerifiedPoints: [
      `${subject} is a pre-existing subject in public folklore, mythology, mystery, or cultural-history discussion.`,
      `The article can responsibly describe common versions, source limits, and recurring motifs connected to ${plan.detail}.`,
      `The strongest reading stays within ${plan.evidence} rather than presenting uncertain claims as confirmed fact.`
    ],
    variants: [
      'Names, locations, dates, and narrative details may shift by region, retelling, publication history, or online community.',
      'Later popular versions often simplify older or more complex source traditions.'
    ],
    unsupportedClaimsToAvoid: [
      'Do not present supernatural claims as verified events.',
      'Do not imply a single definitive origin when the record contains multiple versions.',
      'Do not add invented witnesses, dates, locations, or documents beyond the source-aware record.'
    ]
  };
}

function sourceProfile(slug) {
  const profiles = {
    'urban-legends': {
      primary: 'Jan Harold Brunvand urban legend scholarship and modern folklore collections',
      secondary: 'Library of Congress American Folklife Center guidance on folklore documentation'
    },
    'internet-folklore': {
      primary: 'Internet folklore and digital-culture documentation, including community archive histories',
      secondary: 'Media-literacy and fact-checking references for viral online rumors'
    },
    'strange-places': {
      primary: 'Historic-site, tourism, local-history, and geography references for documented place context',
      secondary: 'Folklore and travel-writing sources on how place legends circulate'
    },
    'unexplained-mysteries': {
      primary: 'Historical records, official summaries, scientific reviews, or archive catalog references',
      secondary: 'Source-critical mystery writing that separates evidence from later theory'
    },
    'classic-folklore': {
      primary: 'Folktale collections, folklore dictionaries, and regional oral-tradition references',
      secondary: 'Comparative folklore scholarship on motifs, variants, and symbolic meaning'
    },
    'modern-legends': {
      primary: 'Regional folklore, newspaper history, and modern legend scholarship',
      secondary: 'Natural-history, skeptical, or media-history references where relevant'
    },
    myths: {
      primary: 'Classical, Norse, Egyptian, or comparative mythology reference summaries',
      secondary: 'Literary, ritual, and symbolic interpretation sources for mythic meaning'
    },
    'mythic-creatures': {
      primary: 'Folklore dictionaries, regional tradition summaries, and comparative creature-lore sources',
      secondary: 'Cultural-context and natural-history references where relevant'
    },
    'lost-worlds': {
      primary: 'Classical, literary, cartographic, or historical reception sources for lost-world traditions',
      secondary: 'Archaeology, history-of-science, or literary-history references that define source limits'
    },
    'strange-nature': {
      primary: 'Scientific, meteorological, geological, or observational references for natural phenomena',
      secondary: 'Folklore and cultural-history sources for omen, landscape, and nature-mystery retellings'
    },
    'legendary-places': {
      primary: 'Heritage, public-history, regional-history, and site-based reference materials',
      secondary: 'Folklore, tourism, and cultural-memory sources on legendary places'
    },
    'mythic-objects': {
      primary: 'Mythology, medieval literature, alchemy, or religious-symbolism references for mythic objects',
      secondary: 'Literary-history and symbolic-interpretation sources'
    },
    'legend-origins': {
      primary: 'Folklore motif studies, legend scholarship, and comparative tradition references',
      secondary: 'Cultural-history and media-history sources on how motifs change across retellings'
    }
  };
  return profiles[slug] || profiles['urban-legends'];
}

function storyTypeFor(slug) {
  if (slug === 'legend-origins') return 'Legend Origin Guide';
  if (slug === 'unexplained-mysteries') return 'Mystery Record';
  if (slug === 'myths') return 'Myth';
  if (slug === 'mythic-creatures') return 'Mythic Creature';
  if (slug === 'mythic-objects') return 'Mythic Object';
  if (slug.includes('place') || slug.includes('world')) return 'Place Legend';
  if (slug.includes('folklore')) return 'Folklore Record';
  return 'Canonical Archive Record';
}

function sourceStatusFor(category, primaryTag) {
  if (category.slug === 'unexplained-mysteries') return `${category.title} / ${primaryTag} / Evidence-limited canonical record`;
  if (category.slug === 'legend-origins') return `${category.title} / ${primaryTag} / Canonical motif explanation`;
  if (category.slug.includes('myth')) return `${category.title} / ${primaryTag} / Mythic tradition and symbolic reading`;
  return `${category.title} / ${primaryTag} / Canonical folklore record`;
}

function searchIntentFor(slug) {
  if (slug === 'legend-origins') return 'origin';
  if (slug === 'internet-folklore') return 'internet folklore';
  if (slug.includes('place') || slug.includes('world')) return 'place legend';
  if (slug.includes('myth')) return 'meaning';
  if (slug === 'unexplained-mysteries') return 'evidence limits';
  return 'legend explained';
}

function articleFormatFor(slug, group) {
  if (slug === 'legend-origins') return 'search-info';
  return group === 'Mythic & Imagined Realms' ? 'story-archive' : 'search-info';
}

function trimMeta(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= 158) return text;
  const shortened = text.slice(0, 157);
  const boundary = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, boundary > 120 ? boundary : 157)}.`;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
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
  for (const value of values) {
    const text = String(value || '').trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    output.push(text);
  }
  return output;
}
