const fs = require('fs');
const path = require('path');
const { buildContentDNA } = require('./article-dna-utils');
const { buildPublicArticlePlan } = require('./public-article-plan');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const categoriesPath = path.join(root, 'data', 'categories.json');
const publishedAt = '2026-07-21';
const generationBatch = 'real-five-each-20260721';

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
  topic('urban-legends', 'the-hookman-urban-legend', 'The Hookman Urban Legend: Lovers Lane, Radio Warning, and the Hook on the Door', 'The Hookman', 'Lovers Lane Legend', 'the hookman lovers lane legend', 'the lovers-lane warning story in which a radio report about an escaped killer ends with a hook found on the car door', ['The Hookman', 'lovers lane', 'radio warning', 'hook on the door', 'escaped killer'], ['https://en.wikipedia.org/wiki/The_Hook', 'https://www.snopes.com/fact-check/the-hook/']),
  topic('urban-legends', 'alligators-in-the-sewers-legend', 'Alligators in the Sewers: Urban Wildlife, City Rumor, and the Monster Below the Street', 'Alligators in the Sewers', 'Sewer Legend', 'alligators in the sewers legend', 'the city legend that discarded pet alligators survived beneath urban streets and grew into hidden sewer animals', ['sewer alligators', 'New York rumor', 'urban wildlife', 'discarded pets', 'underground city'], ['https://en.wikipedia.org/wiki/Sewer_alligator', 'https://www.snopes.com/fact-check/alligators-sewers/']),
  topic('urban-legends', 'poisoned-halloween-candy-legend', 'Poisoned Halloween Candy Legend: Trick-or-Treat Fear, Rumor, and the Dangerous Treat', 'Poisoned Halloween Candy', 'Halloween Warning Legend', 'poisoned halloween candy legend', 'the Halloween warning legend that strangers hide poison, blades, or dangerous objects inside trick-or-treat candy', ['Halloween candy', 'trick-or-treat', 'stranger danger', 'razor blades', 'holiday panic'], ['https://en.wikipedia.org/wiki/Poisoned_candy_myths', 'https://www.snopes.com/fact-check/halloween-non-poisonings/']),
  topic('urban-legends', 'blue-star-acid-urban-legend', 'Blue Star Acid Urban Legend: Temporary Tattoos, School Warnings, and Drug Panic Folklore', 'Blue Star Acid', 'Drug Panic Legend', 'blue star acid urban legend', 'the school-warning legend that temporary tattoos or stickers shaped like stars were secretly laced with LSD', ['blue star acid', 'temporary tattoo', 'school warning', 'drug panic', 'parent flyer'], ['https://en.wikipedia.org/wiki/Blue_star_acid', 'https://www.snopes.com/fact-check/blue-star-acid/']),
  topic('urban-legends', 'the-microwaved-pet-urban-legend', 'The Microwaved Pet Urban Legend: Household Technology, Legal Rumor, and Impossible Carelessness', 'The Microwaved Pet', 'Household Rumor', 'microwaved pet urban legend', 'the urban legend in which a pet is harmed after someone misunderstands a microwave as a drying device', ['microwaved pet', 'household technology', 'legal rumor', 'warning story', 'modern appliance'], ['https://en.wikipedia.org/wiki/Microwaved_pet', 'https://www.snopes.com/fact-check/the-microwaved-pet/']),

  topic('internet-folklore', 'ted-the-caver-internet-legend', 'Ted the Caver: Cave Journal, Early Web Horror, and the Diary That Felt Found', 'Ted the Caver', 'Early Web Horror', 'ted the caver internet legend', 'the early online horror story presented as a caving journal about a narrow passage and a presence below ground', ['Ted the Caver', 'cave journal', 'early internet horror', 'found diary', 'online fiction'], ['https://en.wikipedia.org/wiki/Ted_the_Caver', 'https://www.creepypasta.com/ted-the-caver/']),
  topic('internet-folklore', 'candle-cove-creepypasta', 'Candle Cove Creepypasta: Lost Children’s Television, Forum Memory, and the Static Ending', 'Candle Cove', 'Lost Media Creepypasta', 'candle cove lost television creepypasta', 'the creepypasta built around adults remembering a strange children television show that may never have existed', ['Candle Cove', 'lost television', 'forum thread', 'childhood memory', 'static ending'], ['https://en.wikipedia.org/wiki/Candle_Cove', 'https://creepypasta.fandom.com/wiki/Candle_Cove']),
  topic('internet-folklore', 'ben-drowned-creepypasta', 'Ben Drowned Creepypasta: Haunted Game File, Forum Updates, and a Digital Ghost Story', 'Ben Drowned', 'Haunted Game Legend', 'ben drowned creepypasta', 'the internet horror story framed around a haunted game cartridge, strange video uploads, and forum-style updates', ['Ben Drowned', 'haunted game', 'Majora mask', 'forum updates', 'digital ghost'], ['https://en.wikipedia.org/wiki/Ben_Drowned', 'https://knowyourmeme.com/memes/ben-drowned']),
  topic('internet-folklore', 'smile-dog-creepypasta', 'Smile Dog Creepypasta: Haunted Image, Email Chain, and the Face People Shared', 'Smile Dog', 'Haunted Image Legend', 'smile dog creepypasta', 'the internet horror legend about a disturbing dog image that spreads through messages and demands to be shared', ['Smile Dog', 'haunted image', 'email chain', 'share the image', 'internet horror'], ['https://creepypasta.fandom.com/wiki/Smile_Dog', 'https://knowyourmeme.com/memes/smile-dog']),
  topic('internet-folklore', 'russian-sleep-experiment-creepypasta', 'Russian Sleep Experiment Creepypasta: Fake Document, Laboratory Horror, and Viral Belief', 'Russian Sleep Experiment', 'Fake Document Horror', 'russian sleep experiment creepypasta', 'the creepypasta framed as a secret experiment in which prisoners are kept awake until the account becomes impossible', ['Russian Sleep Experiment', 'fake document', 'sleep deprivation', 'laboratory horror', 'viral creepypasta'], ['https://en.wikipedia.org/wiki/Russian_Sleep_Experiment', 'https://creepypasta.fandom.com/wiki/The_Russian_Sleep_Experiment']),

  topic('strange-places', 'hoia-baciu-forest-legend', 'Hoia Baciu Forest: Vanishing Paths, Unusual Clearings, and Romania’s Strange Woodland Legend', 'Hoia Baciu Forest', 'Haunted Forest', 'hoia baciu forest legend', 'the Romanian forest known in popular accounts for strange experiences, unusual clearings, and haunted woodland stories', ['Hoia Baciu Forest', 'Romania', 'haunted forest', 'unusual clearing', 'woodland legend'], ['https://en.wikipedia.org/wiki/Hoia_Forest', 'https://www.atlasobscura.com/places/hoia-baciu-forest']),
  topic('strange-places', 'crooked-forest-poland-mystery', 'Crooked Forest of Poland: Bent Pines, Missing Explanation, and a Landscape That Looks Arranged', 'Crooked Forest', 'Unusual Woodland', 'crooked forest poland mystery', 'the grove of bent pine trees in Poland whose curved trunks invite explanations ranging from human shaping to lost local practice', ['Crooked Forest', 'Poland', 'bent pines', 'unusual trees', 'landscape mystery'], ['https://en.wikipedia.org/wiki/Crooked_Forest', 'https://www.atlasobscura.com/places/crooked-forest']),
  topic('strange-places', 'door-to-hell-darvaza-crater', 'Door to Hell: Darvaza Gas Crater, Burning Desert, and the Place That Became a Legend', 'Door to Hell', 'Burning Crater', 'door to hell darvaza crater', 'the burning Darvaza gas crater in Turkmenistan that became known as the Door to Hell through travel writing and online images', ['Door to Hell', 'Darvaza crater', 'Turkmenistan', 'burning crater', 'desert fire'], ['https://en.wikipedia.org/wiki/Darvaza_gas_crater', 'https://www.atlasobscura.com/places/the-gates-of-hell-turkmenistan']),
  topic('strange-places', 'paris-catacombs-legends', 'Paris Catacombs Legends: Bones, Tunnels, and the City Beneath the City', 'Paris Catacombs Legends', 'Underground Place', 'paris catacombs tunnel legends', 'the underground ossuary and tunnel folklore surrounding the Paris Catacombs and stories of a hidden city below the streets', ['Paris Catacombs', 'ossuary', 'underground tunnels', 'bones', 'hidden city'], ['https://en.wikipedia.org/wiki/Catacombs_of_Paris', 'https://www.catacombes.paris.fr/en'], ['door-to-hell-darvaza-crater', 'crooked-forest-poland-mystery', 'hoia-baciu-forest-legend', 'stull-cemetery-legend']),
  topic('strange-places', 'stull-cemetery-legend', 'Stull Cemetery Legend: Gateway Rumors, College Folklore, and a Haunted Kansas Graveyard', 'Stull Cemetery', 'Cemetery Legend', 'stull cemetery legend', 'the Kansas cemetery legend shaped by gateway-to-hell rumors, student retellings, and repeated haunted-place claims', ['Stull Cemetery', 'Kansas legend', 'gateway rumor', 'haunted cemetery', 'college folklore'], ['https://en.wikipedia.org/wiki/Stull,_Kansas', 'https://www.atlasobscura.com/places/stull-cemetery'], ['paris-catacombs-legends', 'door-to-hell-darvaza-crater', 'hoia-baciu-forest-legend', 'crooked-forest-poland-mystery']),

  topic('unexplained-mysteries', 'phoenix-lights-mystery', 'Phoenix Lights Mystery: Night Sky Formation, Witness Reports, and the Event That Stayed Visible', 'Phoenix Lights', 'Mass Sighting Mystery', 'phoenix lights mystery', 'the 1997 Arizona sky-sighting event remembered through lights, witness reports, official explanations, and continuing debate', ['Phoenix Lights', 'Arizona sighting', 'night sky formation', '1997', 'witness reports'], ['https://en.wikipedia.org/wiki/Phoenix_Lights', 'https://www.britannica.com/place/Phoenix-Arizona']),
  topic('unexplained-mysteries', 'tamam-shud-case', 'Tamam Shud Case: The Somerton Man, the Hidden Phrase, and a Mystery of Identity', 'Tamam Shud Case', 'Unidentified Person Mystery', 'tamam shud case', 'the Somerton Man case remembered through an unidentified body, a torn phrase from a book, and decades of speculation', ['Tamam Shud', 'Somerton Man', 'unidentified body', 'rubaiyat', 'identity mystery'], ['https://en.wikipedia.org/wiki/Tamam_Shud_case', 'https://www.smithsonianmag.com/history/the-body-on-somerton-beach-50795611/']),
  topic('unexplained-mysteries', 'hessdalen-lights-mystery', 'Hessdalen Lights: Valley Sightings, Scientific Study, and the Glow That Would Not Settle', 'Hessdalen Lights', 'Light Phenomenon', 'hessdalen lights mystery', 'the recurring light phenomena reported in Norway Hessdalen valley and studied without one fully settled explanation', ['Hessdalen Lights', 'Norway', 'valley lights', 'light phenomenon', 'field study'], ['https://en.wikipedia.org/wiki/Hessdalen_lights', 'https://www.hessdalen.org/']),
  topic('unexplained-mysteries', 'greenbrier-ghost-case', 'Greenbrier Ghost Case: Courtroom Memory, Apparition Claim, and a Mystery Between Law and Folklore', 'Greenbrier Ghost', 'Apparition Case', 'greenbrier ghost case', 'the West Virginia case remembered through a death investigation, a ghostly claim, and later folklore around testimony and justice', ['Greenbrier Ghost', 'West Virginia', 'apparition claim', 'courtroom memory', 'death investigation'], ['https://en.wikipedia.org/wiki/Greenbrier_Ghost', 'https://www.wvencyclopedia.org/articles/2161']),
  topic('unexplained-mysteries', 'devils-sea-mystery', 'Devil’s Sea Mystery: Dragon’s Triangle, Maritime Rumor, and the Dangerous Waters of Legend', 'Devil’s Sea', 'Maritime Legend', 'devils sea mystery', 'the Pacific maritime legend sometimes called the Dragon Triangle and compared with other dangerous-sea mystery zones', ['Devil’s Sea', 'Dragon Triangle', 'Pacific Ocean', 'maritime rumor', 'dangerous waters'], ['https://en.wikipedia.org/wiki/Devil%27s_Sea', 'https://www.britannica.com/place/Pacific-Ocean']),

  topic('classic-folklore', 'tengu-japanese-folklore', 'Tengu Folklore: Mountain Spirits, Masks, and the Birdlike Figures of Japanese Tradition', 'Tengu', 'Mountain Spirit Folklore', 'tengu japanese folklore', 'the Japanese folklore beings associated with mountains, birdlike features, masks, martial skill, and ambiguous danger or protection', ['Tengu', 'mountain spirit', 'Japanese folklore', 'birdlike figure', 'mask tradition'], ['https://en.wikipedia.org/wiki/Tengu', 'https://www.britannica.com/topic/tengu']),
  topic('classic-folklore', 'leprechaun-irish-folklore', 'Leprechaun Folklore: Hidden Gold, Small Makers, and the Bargain That Slips Away', 'Leprechaun', 'Irish Fairy Folklore', 'leprechaun irish folklore', 'the Irish fairy figure remembered through shoemaking, hidden gold, trick bargains, and the difficulty of holding a captured helper', ['Leprechaun', 'Irish fairy', 'hidden gold', 'shoemaker', 'trick bargain'], ['https://en.wikipedia.org/wiki/Leprechaun', 'https://www.britannica.com/topic/leprechaun']),
  topic('classic-folklore', 'kitsune-folklore', 'Kitsune Folklore: Fox Spirits, Shape-Shifting, and the Line Between Trick and Blessing', 'Kitsune', 'Fox Spirit Folklore', 'kitsune fox spirit folklore', 'the Japanese fox-spirit tradition in which foxes may trick, protect, possess, or appear in human form', ['Kitsune', 'fox spirit', 'shape-shifting', 'Japanese folklore', 'trickster'], ['https://en.wikipedia.org/wiki/Kitsune', 'https://www.britannica.com/topic/kitsune']),
  topic('classic-folklore', 'brownie-house-spirit-folklore', 'Brownie Folklore: House Spirit, Night Work, and the Gift That Must Not Be Named', 'Brownie', 'House Spirit Folklore', 'brownie house spirit folklore', 'the household spirit in Scottish and English folklore remembered for secret night work, small offerings, and rules around gratitude', ['Brownie', 'house spirit', 'night work', 'household folklore', 'small offering'], ['https://en.wikipedia.org/wiki/Brownie_(folklore)', 'https://www.britannica.com/topic/brownie-folklore']),
  topic('classic-folklore', 'dullahan-irish-folklore', 'Dullahan Folklore: Headless Rider, Night Road, and the Name Called From the Dark', 'Dullahan', 'Headless Rider Folklore', 'dullahan irish folklore', 'the Irish headless rider figure remembered through night roads, a carried head, and death-warning associations', ['Dullahan', 'headless rider', 'Irish folklore', 'night road', 'death warning'], ['https://en.wikipedia.org/wiki/Dullahan', 'https://www.britannica.com/topic/headless-horseman']),

  topic('modern-legends', 'loveland-frogman-legend', 'Loveland Frogman Legend: River Road Sightings, Local Memory, and Ohio’s Amphibian Figure', 'Loveland Frogman', 'Regional Creature Legend', 'loveland frogman legend', 'the Ohio modern legend of a frog-like figure reported near roads, rivers, and local sighting stories around Loveland', ['Loveland Frogman', 'Ohio legend', 'frog-like figure', 'river road', 'local sightings'], ['https://en.wikipedia.org/wiki/Loveland_frog', 'https://cryptidz.fandom.com/wiki/Loveland_Frogmen']),
  topic('modern-legends', 'bell-witch-legend', 'Bell Witch Legend: Tennessee Haunting, Family Memory, and a Voice That Became Local Folklore', 'Bell Witch', 'Haunting Legend', 'bell witch legend', 'the Tennessee legend of the Bell family haunting, remembered through voices, disturbances, local memory, and later retellings', ['Bell Witch', 'Tennessee legend', 'Bell family', 'haunting voice', 'local folklore'], ['https://en.wikipedia.org/wiki/Bell_Witch', 'https://www.britannica.com/topic/poltergeist']),
  topic('modern-legends', 'black-eyed-children-legend', 'Black-Eyed Children Legend: Doorway Encounters, Requests to Enter, and Modern Fear', 'Black-Eyed Children', 'Doorway Legend', 'black eyed children legend', 'the modern legend of children with completely dark eyes who ask for entry into cars, homes, or private spaces', ['Black-Eyed Children', 'doorway encounter', 'request to enter', 'dark eyes', 'modern legend'], ['https://en.wikipedia.org/wiki/Black-eyed_children', 'https://www.snopes.com/fact-check/black-eyed-children/']),
  topic('modern-legends', 'bunny-man-legend', 'Bunny Man Legend: Fairfax County Rumor, Bridge Folklore, and the Costumed Figure', 'Bunny Man', 'Costumed Figure Legend', 'bunny man legend', 'the Northern Virginia legend of a costumed figure, bridge rumors, and stories that grew from reported local incidents', ['Bunny Man', 'Bunny Man Bridge', 'Fairfax County', 'costumed figure', 'local legend'], ['https://en.wikipedia.org/wiki/Bunny_Man', 'https://www.atlasobscura.com/places/bunny-man-bridge']),
  topic('modern-legends', 'fresno-nightcrawler-legend', 'Fresno Nightcrawler Legend: Walking White Figures, Video Evidence, and a Cryptid Built by Footage', 'Fresno Nightcrawler', 'Video Cryptid Legend', 'fresno nightcrawler legend', 'the modern cryptid legend shaped by video clips of pale walking figures and later online interpretation', ['Fresno Nightcrawler', 'video cryptid', 'walking figure', 'California legend', 'online sightings'], ['https://cryptidz.fandom.com/wiki/Fresno_Nightcrawler', 'https://en.wikipedia.org/wiki/Fresno,_California']),

  topic('myths', 'heracles-twelve-labors-myth', 'Heracles and the Twelve Labors: Impossible Tasks, Atonement, and the Hero Tested Again and Again', 'Heracles and the Twelve Labors', 'Greek Hero Myth', 'heracles twelve labors myth', 'the Greek hero cycle in which Heracles completes a series of impossible labors as punishment, proof, and mythic trial', ['Heracles', 'Twelve Labors', 'Greek hero', 'atonement', 'impossible tasks'], ['https://en.wikipedia.org/wiki/Labours_of_Hercules', 'https://www.britannica.com/topic/Heracles']),
  topic('myths', 'king-midas-golden-touch-myth', 'King Midas and the Golden Touch: Wish, Hunger, and the Myth of Desire Turning Heavy', 'King Midas', 'Greek Moral Myth', 'king midas golden touch myth', 'the Greek myth of a king whose wish turns everything he touches into gold until the gift becomes a curse', ['King Midas', 'golden touch', 'Dionysus', 'wish', 'Greek myth'], ['https://en.wikipedia.org/wiki/Midas', 'https://www.britannica.com/topic/Midas-Greek-mythology']),
  topic('myths', 'osiris-isis-resurrection-myth', 'Osiris and Isis: Dismemberment, Search, and the Egyptian Myth of Restoration', 'Osiris and Isis', 'Egyptian Myth', 'osiris isis resurrection myth', 'the Egyptian myth cycle in which Isis searches for Osiris after his murder and restoration becomes part of kingship and afterlife meaning', ['Osiris', 'Isis', 'Set', 'Egyptian myth', 'restoration'], ['https://en.wikipedia.org/wiki/Osiris_myth', 'https://www.britannica.com/topic/Osiris-Egyptian-god']),
  topic('myths', 'maui-slows-the-sun-myth', 'Maui Slows the Sun: Rope, Dawn, and the Myth That Made the Day Longer', 'Maui Slows the Sun', 'Polynesian Culture Hero Myth', 'maui slows the sun myth', 'the Polynesian myth in which Maui restrains or slows the sun so people have enough daylight for work and life', ['Maui', 'sun snaring', 'Polynesian myth', 'culture hero', 'longer days'], ['https://en.wikipedia.org/wiki/M%C4%81ui_(mythology)', 'https://www.britannica.com/topic/Maui-Polynesian-mythology']),
  topic('myths', 'demeter-and-persephone-myth', 'Demeter and Persephone: Abduction, Seasons, and the Myth of Return With a Condition', 'Demeter and Persephone', 'Greek Seasonal Myth', 'demeter and persephone myth', 'the Greek myth in which Persephone taken to the underworld and Demeter grief becomes tied to seasonal change and return', ['Demeter', 'Persephone', 'underworld', 'seasons', 'Greek myth'], ['https://en.wikipedia.org/wiki/Persephone', 'https://www.britannica.com/topic/Persephone-Greek-goddess']),

  topic('mythic-creatures', 'pegasus-winged-horse-myth', 'Pegasus: Winged Horse, Heroic Flight, and the Creature Born From Mythic Violence', 'Pegasus', 'Winged Horse', 'pegasus winged horse myth', 'the winged horse of Greek mythology connected with flight, heroes, poetic inspiration, and later symbolic imagination', ['Pegasus', 'winged horse', 'Bellerophon', 'Greek mythology', 'flight'], ['https://en.wikipedia.org/wiki/Pegasus', 'https://www.britannica.com/topic/Pegasus-Greek-mythology']),
  topic('mythic-creatures', 'chimera-greek-monster-myth', 'Chimera: Fire-Breathing Monster, Mixed Body, and the Mythic Shape of Impossibility', 'Chimera', 'Hybrid Monster', 'chimera greek monster myth', 'the Greek hybrid creature usually described through lion, goat, serpent, and fire-breathing elements', ['Chimera', 'hybrid monster', 'fire breathing', 'Bellerophon', 'Greek creature'], ['https://en.wikipedia.org/wiki/Chimera_(mythology)', 'https://www.britannica.com/topic/Chimera-Greek-mythology']),
  topic('mythic-creatures', 'kelpie-water-horse-folklore', 'Kelpie Folklore: Water Horse, River Warning, and the Creature That Carries Riders Away', 'Kelpie', 'Water Horse Folklore', 'kelpie water horse folklore', 'the Scottish water-horse creature remembered through river danger, deceptive beauty, and riders carried into water', ['Kelpie', 'water horse', 'Scottish folklore', 'river danger', 'deceptive creature'], ['https://en.wikipedia.org/wiki/Kelpie', 'https://www.britannica.com/topic/kelpie']),
  topic('mythic-creatures', 'qilin-mythic-creature', 'Qilin: Auspicious Creature, Gentle Power, and the Mythic Sign of a Just Age', 'Qilin', 'Auspicious Creature', 'qilin mythic creature', 'the East Asian mythic creature associated with auspicious appearance, gentleness, moral order, and wise rulership', ['Qilin', 'auspicious creature', 'East Asian mythology', 'gentle power', 'moral order'], ['https://en.wikipedia.org/wiki/Qilin', 'https://www.britannica.com/topic/qilin']),
  topic('mythic-creatures', 'naga-serpent-folklore', 'Naga Folklore: Serpent Beings, Water, Guardianship, and Sacred Thresholds', 'Naga', 'Serpent Being', 'naga serpent folklore', 'the serpent beings of South and Southeast Asian traditions connected with water, protection, treasure, and sacred places', ['Naga', 'serpent being', 'water guardian', 'South Asian mythology', 'sacred threshold'], ['https://en.wikipedia.org/wiki/N%C4%81ga', 'https://www.britannica.com/topic/naga-Hindu-and-Buddhist-mythology']),

  topic('lost-worlds', 'avalon-legendary-island', 'Avalon: Island of Apples, Arthur’s Rest, and the Lost Place Beyond the Water', 'Avalon', 'Arthurian Lost Island', 'avalon legendary island', 'the Arthurian island or otherworldly place associated with healing, apples, and the final resting place of King Arthur', ['Avalon', 'Arthurian legend', 'island of apples', 'King Arthur', 'otherworld'], ['https://en.wikipedia.org/wiki/Avalon', 'https://www.britannica.com/topic/Avalon-legendary-island']),
  topic('lost-worlds', 'hyperborea-lost-northern-land', 'Hyperborea: The Blessed Northern Land, Greek Geography, and a World Beyond the Wind', 'Hyperborea', 'Mythic Northern Land', 'hyperborea lost northern land', 'the Greek idea of a far northern land beyond Boreas where blessed people lived outside ordinary hardship', ['Hyperborea', 'Greek geography', 'northern land', 'Boreas', 'blessed people'], ['https://en.wikipedia.org/wiki/Hyperborea', 'https://www.britannica.com/place/Hyperborea']),
  topic('lost-worlds', 'el-dorado-lost-city', 'El Dorado: Golden Ruler, Lost City Search, and the World Made From a Rumor of Gold', 'El Dorado', 'Golden City Legend', 'el dorado lost city', 'the South American legend that shifted from a gilded ruler ritual into European searches for a golden city or kingdom', ['El Dorado', 'golden city', 'Muisca', 'South America', 'gilded ruler'], ['https://en.wikipedia.org/wiki/El_Dorado', 'https://www.britannica.com/place/El-Dorado-legendary-place']),
  topic('lost-worlds', 'city-of-ys-legend', 'City of Ys: Sunken Breton City, Flooded Gates, and the Kingdom Beneath the Sea', 'City of Ys', 'Sunken City Legend', 'city of ys legend', 'the Breton legend of a city swallowed by the sea after gates, pride, or betrayal allow the water in', ['City of Ys', 'Breton legend', 'sunken city', 'flooded gates', 'sea kingdom'], ['https://en.wikipedia.org/wiki/Ys', 'https://www.britannica.com/place/Brittany-region-France']),
  topic('lost-worlds', 'kitezh-hidden-city-legend', 'Kitezh: Hidden City, Lake Svetloyar, and the Legend That Vanished From Invaders', 'Kitezh', 'Hidden City Legend', 'kitezh hidden city legend', 'the Russian legend of a city hidden beneath or beyond Lake Svetloyar after disappearing from invading forces', ['Kitezh', 'Lake Svetloyar', 'hidden city', 'Russian legend', 'vanished town'], ['https://en.wikipedia.org/wiki/Kitezh', 'https://en.wikipedia.org/wiki/Lake_Svetloyar']),

  topic('strange-nature', 'ball-lightning-phenomenon', 'Ball Lightning: Glowing Spheres, Storm Reports, and the Natural Mystery That Behaves Like Folklore', 'Ball Lightning', 'Atmospheric Phenomenon', 'ball lightning phenomenon', 'the reported atmospheric phenomenon of glowing spheres seen during storms and debated through science, witness reports, and folklore-like retellings', ['ball lightning', 'glowing sphere', 'storm reports', 'atmospheric phenomenon', 'natural mystery'], ['https://en.wikipedia.org/wiki/Ball_lightning', 'https://www.britannica.com/science/ball-lightning']),
  topic('strange-nature', 'morning-glory-cloud', 'Morning Glory Cloud: Rolling Sky Waves, Gulf Country, and the Cloud That Looks Alive', 'Morning Glory Cloud', 'Cloud Phenomenon', 'morning glory cloud', 'the rare rolling cloud formation especially associated with northern Australia and dramatic wave-like movement across the sky', ['Morning Glory cloud', 'rolling cloud', 'Australia', 'atmospheric wave', 'sky phenomenon'], ['https://en.wikipedia.org/wiki/Morning_Glory_cloud', 'https://www.britannica.com/science/cloud-meteorology']),
  topic('strange-nature', 'sailing-stones-death-valley', 'Sailing Stones: Moving Rocks, Desert Tracks, and the Mystery Written Across Dry Lake Beds', 'Sailing Stones', 'Desert Phenomenon', 'sailing stones death valley', 'the moving rocks of dry lake beds whose long tracks inspired mystery before ice, wind, and water helped explain the motion', ['sailing stones', 'Death Valley', 'moving rocks', 'racetrack playa', 'desert tracks'], ['https://en.wikipedia.org/wiki/Sailing_stones', 'https://www.nps.gov/deva/learn/nature/the-racetrack.htm']),
  topic('strange-nature', 'naga-fireballs-legend', 'Naga Fireballs: Mekong Lights, Festival Reports, and the River Phenomenon Between Belief and Debate', 'Naga Fireballs', 'River Light Phenomenon', 'naga fireballs legend', 'the Mekong River light phenomenon reported as glowing balls rising from the water and interpreted through both local belief and debate', ['Naga fireballs', 'Mekong River', 'river lights', 'Thai folklore', 'light phenomenon'], ['https://en.wikipedia.org/wiki/Naga_fireball', 'https://www.tourismthailand.org/Attraction/naga-fireball']),
  topic('strange-nature', 'fairy-rings-folklore', 'Fairy Rings: Mushroom Circles, Grass Patterns, and the Folklore of a Natural Shape', 'Fairy Rings', 'Mushroom Folklore', 'fairy rings folklore', 'the natural circles of mushrooms or grass that became linked with fairies, dancing, warnings, and enchanted places', ['fairy rings', 'mushroom circle', 'fairy folklore', 'grass pattern', 'enchanted place'], ['https://en.wikipedia.org/wiki/Fairy_ring', 'https://www.britannica.com/science/fairy-ring'], ['naga-fireballs-legend', 'sailing-stones-death-valley', 'morning-glory-cloud', 'ball-lightning-phenomenon']),

  topic('legendary-places', 'tir-na-nog-legendary-place', 'Tir na nOg: Land of Youth, Otherworld Journey, and the Island Beyond Ordinary Time', 'Tir na nOg', 'Irish Otherworld', 'tir na nog legendary place', 'the Irish otherworld or land of youth where time moves differently and return to ordinary life becomes dangerous', ['Tir na nOg', 'Irish otherworld', 'land of youth', 'Oisin', 'time difference'], ['https://en.wikipedia.org/wiki/T%C3%ADr_na_n%C3%93g', 'https://www.britannica.com/topic/Tir-na-nOg']),
  topic('legendary-places', 'camelot-legendary-court', 'Camelot: Arthur’s Court, Round Table Memory, and the Place That Became an Ideal', 'Camelot', 'Arthurian Court', 'camelot legendary court', 'the legendary court of King Arthur remembered as the center of the Round Table, chivalric order, and later idealized rule', ['Camelot', 'King Arthur', 'Round Table', 'Arthurian legend', 'ideal court'], ['https://en.wikipedia.org/wiki/Camelot', 'https://www.britannica.com/topic/Camelot-legendary-place']),
  topic('legendary-places', 'asgard-norse-mythic-place', 'Asgard: Realm of the Aesir, Bifrost Bridge, and the Mythic Place Above the Human World', 'Asgard', 'Norse Mythic Realm', 'asgard norse mythic place', 'the Norse mythic realm of the Aesir gods, linked with Bifrost, divine halls, and the larger structure of the worlds', ['Asgard', 'Aesir', 'Bifrost', 'Norse mythology', 'divine realm'], ['https://en.wikipedia.org/wiki/Asgard', 'https://www.britannica.com/topic/Asgard']),
  topic('legendary-places', 'mictlan-aztec-underworld', 'Mictlan: Aztec Underworld, Nine Levels, and the Long Road After Death', 'Mictlan', 'Underworld Place', 'mictlan aztec underworld', 'the Aztec underworld associated with a difficult post-death journey through levels before reaching the realm of the dead', ['Mictlan', 'Aztec underworld', 'nine levels', 'afterlife journey', 'Mictlantecuhtli'], ['https://en.wikipedia.org/wiki/Mictl%C4%81n', 'https://www.britannica.com/topic/Mictlantecuhtli']),
  topic('legendary-places', 'yomi-japanese-underworld', 'Yomi: Japanese Underworld, Forbidden Glance, and the Place Return Cannot Undo', 'Yomi', 'Japanese Underworld', 'yomi japanese underworld', 'the underworld in Japanese myth associated with death, pollution, return, and the separation between Izanagi and Izanami', ['Yomi', 'Japanese underworld', 'Izanagi', 'Izanami', 'forbidden glance'], ['https://en.wikipedia.org/wiki/Yomi', 'https://www.britannica.com/topic/Izanagi']),

  topic('mythic-objects', 'book-of-thoth-legend', 'Book of Thoth: Forbidden Knowledge, Egyptian Magic, and the Text No Reader Can Hold Safely', 'Book of Thoth', 'Forbidden Book Legend', 'book of thoth legend', 'the Egyptian legendary book associated with divine knowledge, magic, dangerous reading, and later occult imagination', ['Book of Thoth', 'forbidden knowledge', 'Egyptian magic', 'dangerous text', 'Thoth'], ['https://en.wikipedia.org/wiki/Book_of_Thoth', 'https://www.britannica.com/topic/Thoth']),
  topic('mythic-objects', 'hand-of-glory-folklore', 'Hand of Glory: Thief’s Charm, Candle Folklore, and the Object That Freezes a House', 'Hand of Glory', 'Folk Magic Object', 'hand of glory folklore', 'the European folk-magic object made from a human hand and remembered as a charm for thieves, sleep, and locked houses', ['Hand of Glory', 'folk magic', 'thief charm', 'candle folklore', 'locked house'], ['https://en.wikipedia.org/wiki/Hand_of_Glory', 'https://www.britannica.com/topic/magic-supernaturalism']),
  topic('mythic-objects', 'seven-league-boots-folklore', 'Seven-League Boots: Impossible Travel, Fairy Tale Speed, and the Object That Shrinks Distance', 'Seven-League Boots', 'Fairy Tale Object', 'seven league boots folklore', 'the fairy-tale boots that allow impossible strides across great distances and turn travel itself into a magical power', ['Seven-League Boots', 'fairy tale object', 'impossible travel', 'magical boots', 'distance'], ['https://en.wikipedia.org/wiki/Seven-league_boots', 'https://www.britannica.com/art/fairy-tale']),
  topic('mythic-objects', 'golden-fleece-myth', 'Golden Fleece: Jason’s Quest, Royal Proof, and the Object Guarded Far From Home', 'Golden Fleece', 'Heroic Quest Object', 'golden fleece myth', 'the object sought by Jason and the Argonauts, remembered as proof of kingship, dangerous travel, and guarded treasure', ['Golden Fleece', 'Jason', 'Argonauts', 'quest object', 'guarded treasure'], ['https://en.wikipedia.org/wiki/Golden_Fleece', 'https://www.britannica.com/topic/Golden-Fleece']),
  topic('mythic-objects', 'spear-of-destiny-legend', 'Spear of Destiny Legend: Holy Lance, Relic History, and the Object That Gathered Power Claims', 'Spear of Destiny', 'Relic Legend', 'spear of destiny legend', 'the Holy Lance tradition and later legends that attach power, relic identity, and political imagination to a sacred weapon', ['Spear of Destiny', 'Holy Lance', 'relic legend', 'sacred weapon', 'power claim'], ['https://en.wikipedia.org/wiki/Holy_Lance', 'https://www.britannica.com/topic/Holy-Lance']),

  topic('legend-origins', 'why-mirrors-mean-bad-luck', 'Why Mirrors Mean Bad Luck: Reflections, Souls, and the Folklore of Broken Glass', 'Mirror Bad Luck', 'Superstition Origin', 'why mirrors mean bad luck', 'the folklore pattern that links mirrors with souls, reflection, household danger, and the unlucky meaning of broken glass', ['broken mirror', 'bad luck', 'reflection', 'soul belief', 'household superstition'], ['https://en.wikipedia.org/wiki/Mirror_superstition', 'https://www.britannica.com/topic/mirror']),
  topic('legend-origins', 'why-ravens-become-omens', 'Why Ravens Become Omens: Black Birds, Battlefield Memory, and the Messenger Bird Motif', 'Raven Omens', 'Omen Motif', 'why ravens become omens', 'the folklore pattern that turns ravens and black birds into signs of death, prophecy, battle, or hidden knowledge', ['raven omen', 'black bird', 'battlefield memory', 'prophecy', 'messenger motif'], ['https://en.wikipedia.org/wiki/Cultural_depictions_of_ravens', 'https://www.britannica.com/animal/raven'], ['why-mirrors-mean-bad-luck', 'why-crossroads-become-supernatural-places', 'why-names-have-power-in-legends']),
  topic('legend-origins', 'why-crossroads-become-supernatural-places', 'Why Crossroads Become Supernatural Places: Choices, Boundaries, and Meetings at the Road’s Edge', 'Crossroads Folklore', 'Boundary Motif', 'why crossroads become supernatural places', 'the folklore pattern that makes crossroads feel like places of choice, spirit contact, bargains, burial, or danger', ['crossroads', 'boundary place', 'road folklore', 'spirit meeting', 'choice motif'], ['https://en.wikipedia.org/wiki/Crossroads_(folklore)', 'https://www.britannica.com/topic/crossroads']),
  topic('legend-origins', 'why-circles-protect-in-folklore', 'Why Circles Protect in Folklore: Boundaries, Ritual Space, and the Shape That Keeps Danger Out', 'Protective Circles', 'Protection Motif', 'why circles protect in folklore', 'the folklore pattern that treats circles as protective boundaries in ritual, magic, household custom, and story space', ['protective circle', 'ritual boundary', 'magic circle', 'folk belief', 'safe space'], ['https://en.wikipedia.org/wiki/Magic_circle', 'https://www.britannica.com/topic/magic-supernaturalism'], ['why-ravens-become-omens', 'why-mirrors-mean-bad-luck', 'why-crossroads-become-supernatural-places']),
  topic('legend-origins', 'why-names-have-power-in-legends', 'Why Names Have Power in Legends: True Names, Summoning, and the Risk of Being Known', 'True Name Motif', 'Name Power Motif', 'why names have power in legends', 'the legend motif in which knowing, hiding, speaking, or stealing a true name changes power between people and supernatural beings', ['true name', 'name power', 'summoning', 'Rumpelstiltskin motif', 'secret identity'], ['https://en.wikipedia.org/wiki/True_name', 'https://en.wikipedia.org/wiki/Rumpelstiltskin'])
];

const topicSlugs = new Set(topics.map((plan) => plan.slug));
const added = [];
const updated = [];

for (const plan of topics) {
  const category = categoryBySlug.get(plan.categorySlug);
  if (!category) throw new Error(`Missing category: ${plan.categorySlug}`);
  const existingIndex = stories.findIndex((item) => item.slug === plan.slug);
  if (existingIndex >= 0) {
    const existing = stories[existingIndex];
    [
      existing.contentDNA?.canonicalQuery,
      existing.canonicalQuery,
      existing.primaryKeyword,
      existing.seedKeyword
    ].filter(Boolean).forEach((query) => existingQueries.delete(normalize(query)));
  }
  const story = buildStory(plan, category);
  story.publicArticlePlan = buildPublicArticlePlan(story);
  if (!story.publicArticlePlan || !Array.isArray(story.publicArticlePlan.sections) || story.publicArticlePlan.sections.length < 3) {
    throw new Error(`Article generation stopped. A valid Public Article Plan could not be created for ${story.slug}.`);
  }
  story.introSummary = story.publicArticlePlan.dek;
  story.contentDNA = buildContentDNA(story, existingQueries);
  story.contentDNA.subjectSpecificVocabulary = plan.vocabulary;
  story.contentDNA.requiredSpecificDetails = unique([plan.detail, ...plan.vocabulary, plan.quickAnswer[0]]).slice(0, 8);
  story.contentDNA.sectionBlueprint = story.publicArticlePlan.sections.map((section) => ({
    title: section.heading,
    nav: section.heading
  }));
  if (story.contentDNA?.canonicalQuery) existingQueries.add(normalize(story.contentDNA.canonicalQuery));

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

console.log(`Added ${added.length} and updated ${updated.length} archive articles across ${categories.length} categories.`);
for (const category of categories) {
  const count = added.filter((story) => story.categorySlug === category.slug).length;
  console.log(`${category.slug}: ${count}`);
}
for (const slug of updated) console.log(`updated: ${slug}`);

function buildStory(plan, category) {
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
    metaDescription: trimMeta(`${plan.subject} explains ${plan.detail}, with versions, source limits, meaning, and why the story still lasts.`),
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
    generationBatch,
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
    introSummary: introSummaryFor(plan, category),
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
        plan.core[0],
        plan.context[0],
        plan.core[1],
        plan.context[1]
      ],
      reportedVariants: [
        { claim: plan.variants[0], scope: 'variant tradition' },
        { claim: plan.variants[1], scope: 'later versions and source comparison' }
      ],
      editorialInterpretationOptions: [
        plan.meaning[0],
        plan.meaning[1]
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

function topic(categorySlug, slug, title, subject, tag, keyword, detail, vocabulary, sourceUrls, relatedSlugs = []) {
  const category = categoryBySlug.get(categorySlug);
  const categoryTitle = category?.title || categorySlug;
  const tags = uniqueNormalized([tag, subject, vocabulary[1], vocabulary[2], vocabulary[3], vocabulary[4]]).slice(0, 4);
  const sourceBasis = sourceBasisFor(categorySlug, subject);
  const evidence = `${categoryTitle.toLowerCase()} references, folklore summaries, public cultural records, and source-aware retellings`;
  const sources = sourceUrls.map((url, index) => source(`${sourceTitleFor(url)} - ${subject}`, url, index === 0 ? `Supports the public record for ${subject}.` : `Supports source-aware context around ${subject}.`));
  return {
    categorySlug,
    slug,
    title,
    subject,
    tag,
    tags,
    keyword,
    detail,
    sourceBasis,
    evidence,
    vocabulary,
    sources,
    quickAnswer: [
      `${subject} is a pre-existing ${categoryTitle} subject built around ${detail}.`,
      `Its strongest image is specific enough to follow across retellings while still leaving room for careful interpretation.`
    ],
    core: [
      `The familiar account centers on ${detail}.`,
      `Most retellings preserve ${vocabulary.slice(0, 3).join(', ')} as the signs that make ${subject} recognizable.`
    ],
    context: [
      `${subject} belongs to ${sourceBasis}, so the article treats it as inherited material rather than a newly invented Kyunolab record.`,
      `The strongest version works when the concrete image stays visible and later explanation does not flatten the uncertainty.`
    ],
    variants: [
      `Versions of ${subject} differ by source, region, period, or online retelling, but the central anchor remains ${vocabulary[0]}.`,
      `Later summaries often simplify the story into a single clean form, while older or parallel versions keep more than one emphasis alive.`
    ],
    meaning: [
      `${subject} may be read as a story about ${meaningFor(categorySlug)}.`,
      `That reading keeps the article focused on meaning and source limits instead of adding unsupported events.`
    ],
    related: relatedSlugs,
    sourceNote: `This article follows ${subject} as a known ${categoryTitle} subject. It separates existing tradition, reported variants, and Kyunolab interpretation without inventing new evidence.`
  };
}

function introSummaryFor(plan, category) {
  const overrides = {
    'russian-sleep-experiment-creepypasta': 'A sealed laboratory, a sleepless experiment, and an impossible report give this internet story its unsettling shape.',
    'sailing-stones-death-valley': 'Long tracks across a dry lake bed turned ordinary stones into one of the desert’s most memorable natural mysteries.'
  };
  return overrides[plan.slug] || `${plan.subject} begins with ${String(plan.vocabulary[0] || plan.subject).toLowerCase()} and follows how that image kept moving through ${category.title.toLowerCase()} retellings.`;
}

function source(title, url, supports) {
  return { title, url, sourceType: 'reference', supports };
}

function sourceTitleFor(url) {
  if (/britannica/i.test(url)) return 'Britannica';
  if (/snopes/i.test(url)) return 'Snopes';
  if (/knowyourmeme/i.test(url)) return 'Know Your Meme';
  if (/atlasobscura/i.test(url)) return 'Atlas Obscura';
  if (/nps\.gov/i.test(url)) return 'National Park Service';
  if (/catacombes/i.test(url)) return 'Paris Catacombs';
  if (/hessdalen/i.test(url)) return 'Project Hessdalen';
  if (/tourismthailand/i.test(url)) return 'Tourism Thailand';
  if (/creepypasta/i.test(url)) return 'Creepypasta Archive';
  if (/cryptidz/i.test(url)) return 'Cryptid Wiki';
  return 'Wikipedia';
}

function sourceBasisFor(categorySlug, subject) {
  const basis = {
    'urban-legends': 'modern urban legend circulation, warning-story folklore, and popular rumor documentation',
    'internet-folklore': 'internet folklore, creepypasta culture, meme documentation, and viral retellings',
    'strange-places': 'place-based folklore, travel writing, public geography, and haunted-location tradition',
    'unexplained-mysteries': 'public mystery writing, historical records, scientific discussion, and evidence-limited summaries',
    'classic-folklore': 'traditional folklore, regional belief, oral tradition, and later reference summaries',
    'modern-legends': 'near-contemporary legend, local reports, rumor cycles, and popular cryptid discussion',
    myths: 'mythological tradition, reference summaries, symbolic reading, and source-aware retellings',
    'mythic-creatures': 'mythic creature folklore, regional tradition, and symbolic interpretation',
    'lost-worlds': 'lost-world tradition, mythic geography, older speculation, and later popular reception',
    'strange-nature': 'natural phenomenon reports, folklore interpretation, scientific discussion, and public observation',
    'legendary-places': 'legendary geography, mythic place tradition, and cultural memory',
    'mythic-objects': 'legendary object tradition, mythic symbolism, quest stories, and relic reception',
    'legend-origins': 'motif history, superstition, repeated folklore patterns, and cultural interpretation'
  };
  return basis[categorySlug] || `source-aware public tradition around ${subject}`;
}

function meaningFor(categorySlug) {
  const meanings = {
    'urban-legends': 'how ordinary safety can turn uncertain',
    'internet-folklore': 'how shared media turns a story into collective memory',
    'strange-places': 'how a place becomes readable as a mystery',
    'unexplained-mysteries': 'how evidence limits keep a question alive',
    'classic-folklore': 'how inherited stories teach before they explain',
    'modern-legends': 'how repeated sightings become modern folklore',
    myths: 'how symbolic action explains human limits',
    'mythic-creatures': 'how a creature gives shape to fear, warning, or wonder',
    'lost-worlds': 'how unreachable geography becomes cultural desire',
    'strange-nature': 'how natural patterns become signs',
    'legendary-places': 'how imagined geography preserves values and boundaries',
    'mythic-objects': 'how an object carries power, proof, or temptation',
    'legend-origins': 'how repeated motifs make belief feel structured'
  };
  return meanings[categorySlug] || 'how a story keeps meaning through repetition';
}

function seoHeadingsFor(plan) {
  return [
    `The Detail That Defines ${plan.subject}`,
    `How ${plan.subject} Is Usually Remembered`,
    `Where Later Versions Differ`,
    `What the Available Sources Show`,
    `What ${shortSubject(plan.subject)} Means`
  ];
}

function faqQuestionsFor(plan) {
  const subject = plan.subject.replace(/^The\s+/i, '');
  return [
    `What is ${subject}?`,
    `How is ${subject} usually remembered?`,
    `Where do versions of ${subject} differ?`,
    `What does ${subject} mean?`
  ];
}

function articleFor(value) {
  return /^[aeiou]/i.test(String(value || '').trim()) ? 'An' : 'A';
}

function relatedSlugsFor(plan) {
  return unique(plan.related || [])
    .filter((slug) => slug !== plan.slug && (storySlugs.has(slug) || topicSlugs.has(slug)))
    .slice(0, 6);
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

function uniqueNormalized(values) {
  const seen = new Set();
  const output = [];
  for (const value of values.filter(Boolean)) {
    const key = normalize(value);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(value);
  }
  return output;
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
