const fs = require('fs');
const path = require('path');
const { buildContentDNA } = require('./article-dna-utils');
const { buildPublicArticlePlan } = require('./public-article-plan');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const categoriesPath = path.join(root, 'data', 'categories.json');
const publishedAt = '2026-07-20';

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
    slug: 'licked-hand-urban-legend',
    title: 'The Licked Hand Urban Legend: The Dog, the Bed, and the Message on the Wall',
    subject: 'The Licked Hand',
    tag: 'Bedroom Urban Legend',
    tags: ['Bedroom Urban Legend', 'The Licked Hand', 'Urban Legend', 'Warning Story'],
    keyword: 'the licked hand urban legend',
    detail: 'the urban legend in which a person thinks the family dog is licking their hand, only to discover an intruder was inside the room',
    sourceBasis: 'urban legend collections, oral retellings, and modern horror folklore summaries',
    evidence: 'urban legend references, oral-story variants, folklore summaries, and repeated warning-story retellings',
    vocabulary: ['licked hand', 'dog under the bed', 'humans can lick too', 'intruder', 'bedroom legend'],
    sources: [
      source('Wikipedia - The Licked Hand', 'https://en.wikipedia.org/wiki/The_Licked_Hand', 'Supports the common legend structure and alternate title Humans Can Lick Too.'),
      source('Snopes - Humans Can Lick Too', 'https://www.snopes.com/fact-check/humans-can-lick-too/', 'Supports the urban legend framing and common retelling pattern.')
    ],
    quickAnswer: [
      'The Licked Hand is a modern urban legend about someone alone at night who feels a reassuring lick from what they believe is the family dog.',
      'The story turns when the person discovers that the dog was not the source of the touch, and that the intruder has left a message proving the danger was already inside.'
    ],
    core: [
      'The familiar version places a young person in bed while a dog sleeps nearby or under the bed. When fear rises, the person reaches down and feels a lick that seems comforting.',
      'The ending reveals that the dog has been killed or removed, and a message such as humans can lick too changes the comforting gesture into proof of intrusion.'
    ],
    context: [
      'The legend belongs to a wider family of home-intruder and babysitter-era warning stories. Its setting is small, ordinary, and supposedly safe.',
      'The dog matters because it represents trust. The frightening detail is not only that a stranger is present, but that the sign of safety has been copied.'
    ],
    variants: [
      'Later versions change the bedroom, the victim, the dog, and the wording of the message. Some versions place the story in a dormitory, hotel, or family home.',
      'Other tellings make the intruder silent until the final discovery. The plot usually preserves the same turn: comfort is reclassified as danger.'
    ],
    meaning: [
      'The Licked Hand may be read as a story about misplaced trust. The person is not careless; they trust the wrong sign.',
      'That is why the legend remains effective. It makes safety feel fragile without needing a complicated monster.'
    ],
    related: ['clown-statue-urban-legend', 'babysitter-and-the-man-upstairs', 'killer-in-the-backseat-legend'],
    sourceNote: 'This article follows The Licked Hand as a modern urban legend with many oral and online variants. It does not treat the story as one verified crime unless a source trail supports that claim.'
  }),
  topic({
    categorySlug: 'internet-folklore',
    slug: 'jeff-the-killer-creepypasta',
    title: 'Jeff the Killer Creepypasta: The Smile, the Image, and an Internet Horror Legend',
    subject: 'Jeff the Killer',
    tag: 'Creepypasta Legend',
    tags: ['Creepypasta Legend', 'Jeff the Killer', 'Internet Horror', 'Viral Image'],
    keyword: 'jeff the killer creepypasta',
    detail: 'the internet horror character associated with a pale face, fixed smile, and the phrase go to sleep',
    sourceBasis: 'creepypasta archives, meme documentation, internet horror discussion, and viral image folklore',
    evidence: 'creepypasta pages, meme-history summaries, reposted horror fiction, and internet folklore documentation',
    vocabulary: ['Jeff the Killer', 'creepypasta', 'go to sleep', 'viral image', 'internet horror'],
    sources: [
      source('Know Your Meme - Jeff the Killer', 'https://knowyourmeme.com/memes/jeff-the-killer', 'Supports the meme history, image circulation, and creepypasta reception.'),
      source('Creepypasta Wiki - Jeff the Killer', 'https://creepypasta.fandom.com/wiki/Jeff_the_Killer', 'Supports the widely circulated story text and character framing.')
    ],
    quickAnswer: [
      'Jeff the Killer is a creepypasta figure known for a pale face, carved-looking smile, and the phrase go to sleep.',
      'The legend matters because the image and catchphrase often travel farther than any single written version, making Jeff a recognizable internet horror symbol.'
    ],
    core: [
      'Common versions present Jeff as a disfigured or unstable figure connected with violent transformation and nighttime intrusion.',
      'The most memorable detail is visual. The face, smile, and direct stare became the part people recognized even when they had not read the full story.'
    ],
    context: [
      'Jeff the Killer belongs to early creepypasta culture, where copied stories, forum posts, images, and edited files could build a character through repetition.',
      'The figure also shows how internet horror can detach from a stable authorial version. A character becomes folklore when reposts, fan versions, and image edits keep reshaping it.'
    ],
    variants: [
      'Later versions differ around Jeffs origin, family, appearance, and level of supernatural framing. Some tellings treat him as a slasher figure, while others make him part of a wider creepypasta cast.',
      'The image history and the story history are not always identical. A careful reading keeps viral image circulation separate from later narrative additions.'
    ],
    meaning: [
      'Jeff the Killer may be read as a legend about the face that will not stop looking back. The image works because it feels simple, direct, and difficult to unsee.',
      'The story also shows how online horror can become communal. The internet keeps rewriting the monster while preserving the smile.'
    ],
    related: ['the-rake-creepypasta', 'slender-man-internet-folklore', 'momo-challenge-internet-rumor'],
    sourceNote: 'This article follows Jeff the Killer as internet folklore and creepypasta culture. Image circulation, story variants, and later fan versions are treated as related but separate layers.'
  }),
  topic({
    categorySlug: 'strange-places',
    slug: 'tower-of-london-ghosts',
    title: 'Tower of London Ghosts: Royal Memory, Execution Stories, and a Haunted Landmark',
    subject: 'Tower of London Ghosts',
    tag: 'Haunted Landmark',
    tags: ['Haunted Landmark', 'Tower of London', 'Royal Ghosts', 'British Folklore'],
    keyword: 'tower of london ghosts',
    detail: 'the haunted-place tradition surrounding the Tower of London and stories of royal figures, prisoners, and executions',
    sourceBasis: 'historic-site interpretation, British ghost-story tradition, royal history, and haunted-place folklore',
    evidence: 'historic palace material, public history summaries, ghost-story retellings, and source-limited haunted landmark accounts',
    vocabulary: ['Tower of London', 'Anne Boleyn', 'Princes in the Tower', 'royal ghosts', 'haunted landmark'],
    sources: [
      source('Historic Royal Palaces - Tower of London', 'https://www.hrp.org.uk/tower-of-london/', 'Supports the historic site context and public interpretation of the Tower.'),
      source('Historic Royal Palaces - Ghosts of the Tower', 'https://www.hrp.org.uk/tower-of-london/history-and-stories/the-ghosts-of-the-tower-of-london/', 'Supports the haunted-place reception and famous ghost stories attached to the site.')
    ],
    quickAnswer: [
      'Tower of London ghost stories attach haunting traditions to a real historic landmark associated with imprisonment, executions, royal power, and public memory.',
      'The stories are usually remembered through named figures, especially Anne Boleyn and the Princes in the Tower, but they work because the building already carries visible history.'
    ],
    core: [
      'The Tower is often described as haunted by figures connected with imprisonment, execution, or unresolved royal history. The place makes those stories feel close because the rooms and walls remain visible.',
      'Ghost stories at the Tower do not depend on one single sighting. They grow from repeated associations between architecture, death, power, and memory.'
    ],
    context: [
      'Haunted landmarks often gather stories because visitors can stand where history happened. The physical place gives a ghost story a frame that feels more concrete than rumor alone.',
      'The Tower has centuries of political violence and royal drama attached to it. That history makes the haunted tradition feel like an extension of memory rather than a separate invention.'
    ],
    variants: [
      'Later retellings differ around which figures appear, where they are seen, and whether the story focuses on sorrow, warning, or spectacle.',
      'Some versions emphasize famous royal ghosts, while others describe anonymous figures, sounds, or atmosphere. These layers should not be collapsed into one confirmed event.'
    ],
    meaning: [
      'Tower of London ghost stories may be read as a way of making history emotionally present. The ghost gives a remembered death a shape.',
      'The haunting tradition lasts because the Tower is both monument and story container. It lets visitors imagine the past as something still moving through stone.'
    ],
    related: ['eastern-state-penitentiary-haunting', 'winchester-mystery-house', 'bhangarh-fort-legend'],
    sourceNote: 'This article follows Tower of London ghost stories as haunted-place folklore attached to a documented historic site. The historical setting is real; individual supernatural claims are treated as tradition and retelling.'
  }),
  topic({
    categorySlug: 'unexplained-mysteries',
    slug: 'flying-dutchman-folklore',
    title: 'Flying Dutchman Folklore: The Ghost Ship, the Horizon, and a Maritime Legend',
    subject: 'The Flying Dutchman',
    tag: 'Ghost Ship Legend',
    tags: ['Ghost Ship Legend', 'Flying Dutchman', 'Maritime Folklore', 'Sea Legend'],
    keyword: 'flying dutchman folklore',
    detail: 'the maritime legend of a ghost ship condemned to sail and appear at sea as an omen',
    sourceBasis: 'maritime folklore, literary references, sea-legend summaries, and ghost-ship traditions',
    evidence: 'folklore reference summaries, literary history, sailor traditions, and later ghost-ship retellings',
    vocabulary: ['Flying Dutchman', 'ghost ship', 'maritime legend', 'sailor omen', 'cursed voyage'],
    sources: [
      source('Encyclopaedia Britannica - Flying Dutchman', 'https://www.britannica.com/topic/Flying-Dutchman', 'Supports the ghost ship legend and literary reception.'),
      source('Wikipedia - Flying Dutchman', 'https://en.wikipedia.org/wiki/Flying_Dutchman', 'Supports common versions, maritime folklore context, and later cultural references.')
    ],
    quickAnswer: [
      'The Flying Dutchman is a maritime legend about a ghost ship condemned to sail the seas and appear on the horizon.',
      'The ship is often treated as an omen, especially for sailors who see it during dangerous weather or at a distance.'
    ],
    core: [
      'The central image is a ship that cannot make harbor. It moves through storm, mist, or strange light, not as ordinary traffic but as a warning.',
      'Some versions connect the curse to a captain who defies God, fate, or the sea itself. Others focus less on the cause and more on the sighting.'
    ],
    context: [
      'Sea folklore often turns uncertain sightings into stories because the horizon is difficult to verify. Weather, distance, and fear can all reshape what sailors think they see.',
      'The Flying Dutchman became powerful because it gives that uncertainty a named vessel. A strange shape at sea becomes a ship with a curse.'
    ],
    variants: [
      'Later versions differ around the captain, the route, the curse, and whether seeing the ship predicts death, disaster, or bad weather.',
      'Literary and operatic versions helped standardize parts of the legend, but sailor lore and popular retellings preserve multiple forms.'
    ],
    meaning: [
      'The Flying Dutchman may be read as a story about endless passage. The ship moves, but it never arrives.',
      'That makes it a lasting maritime image of guilt, warning, and the fear that the sea can keep what it takes.'
    ],
    related: ['mary-celeste-mystery', 'bermuda-triangle-mystery', 'raining-animals-phenomenon'],
    sourceNote: 'This article follows The Flying Dutchman as maritime folklore and ghost-ship tradition. Literary versions and sailor legends are treated as related layers rather than one fixed historical sighting.'
  }),
  topic({
    categorySlug: 'classic-folklore',
    slug: 'headless-horseman-legend',
    title: 'Headless Horseman Legend: Night Roads, Missing Heads, and the Rider in Folklore',
    subject: 'The Headless Horseman',
    tag: 'Rider Folklore',
    tags: ['Rider Folklore', 'Headless Horseman', 'Sleepy Hollow', 'Ghost Story'],
    keyword: 'headless horseman legend',
    detail: 'the folklore figure of a headless rider, especially remembered through Sleepy Hollow and older spectral rider motifs',
    sourceBasis: 'folklore motifs, Washington Irving reception, ghost-story tradition, and regional rider legends',
    evidence: 'literary sources, folklore summaries, ghost-story variants, and later popular retellings',
    vocabulary: ['Headless Horseman', 'Sleepy Hollow', 'spectral rider', 'night road', 'ghost story'],
    sources: [
      source('Encyclopaedia Britannica - The Legend of Sleepy Hollow', 'https://www.britannica.com/topic/The-Legend-of-Sleepy-Hollow', 'Supports the literary reception of the Sleepy Hollow version.'),
      source('Wikipedia - Headless Horseman', 'https://en.wikipedia.org/wiki/Headless_Horseman', 'Supports wider headless rider folklore and related variants.')
    ],
    quickAnswer: [
      'The Headless Horseman is a ghostly rider figure remembered through Sleepy Hollow and older folklore about headless apparitions on roads or battle-haunted places.',
      'The figure works because it combines speed, pursuit, and a missing head into one image that can be understood before the story is fully told.'
    ],
    core: [
      'In the famous Sleepy Hollow version, a rider without a head pursues Ichabod Crane through a haunted landscape. The story leaves room for both supernatural fear and local trickery.',
      'Older headless rider motifs appear in different traditions, often tied to death, battle, warning, or restless movement.'
    ],
    context: [
      'The missing head makes the rider immediately uncanny. A horseman should be directed by sight and thought, but this figure moves without the part that should guide him.',
      'The road setting also matters. Pursuit becomes more frightening when the listener imagines hooves closing distance in the dark.'
    ],
    variants: [
      'Later versions differ around whether the rider is a ghost, a soldier, a trick, or a local warning figure.',
      'Popular retellings often borrow the pumpkin, bridge, and chase from Sleepy Hollow while older variants keep different local meanings.'
    ],
    meaning: [
      'The Headless Horseman may be read as a story about pursuit without explanation. The rider does not need to speak because the image already threatens.',
      'That is why the figure remains flexible. A headless rider can belong to war memory, local fear, seasonal storytelling, or literary haunting.'
    ],
    related: ['wild-hunt-folklore', 'vanishing-hitchhiker-urban-legend', 'resurrection-mary-legend'],
    sourceNote: 'This article follows the Headless Horseman through folklore motifs and the Sleepy Hollow literary tradition. Later versions are treated as retellings unless tied to a specific source.'
  }),
  topic({
    categorySlug: 'modern-legends',
    slug: 'goatman-modern-legend',
    title: 'Goatman Modern Legend: Bridges, Backroads, and the Half-Human Figure',
    subject: 'Goatman',
    tag: 'Modern Monster Legend',
    tags: ['Modern Monster Legend', 'Goatman', 'Bridge Legend', 'Cryptid Folklore'],
    keyword: 'goatman modern legend',
    detail: 'the modern legend of a half-human, half-goat figure connected with bridges, backroads, and local monster stories',
    sourceBasis: 'American local legend, cryptid folklore, roadside rumors, and modern monster-story summaries',
    evidence: 'regional legend summaries, local retellings, cryptid folklore discussions, and source-limited monster reports',
    vocabulary: ['Goatman', 'bridge legend', 'half-goat figure', 'backroad monster', 'local legend'],
    sources: [
      source('Wikipedia - Goatman', 'https://en.wikipedia.org/wiki/Goatman_(urban_legend)', 'Supports the modern American legend frame and common regional versions.'),
      source('Atlas Obscura - Goatman Bridge', 'https://www.atlasobscura.com/places/old-alton-bridge-goatmans-bridge', 'Supports one famous place-linked Goatman tradition and its haunted-bridge reception.')
    ],
    quickAnswer: [
      'Goatman is a modern monster legend about a half-human, half-goat figure often connected with bridges, wooded roads, and local warnings.',
      'The legend has several regional forms, so Goatman is better understood as a flexible modern folklore figure than as one single documented creature.'
    ],
    core: [
      'Common versions describe a frightening figure with human and goatlike traits. It may appear near a bridge, road, rural crossing, or isolated wooded place.',
      'The story often works as a local dare. People visit a named place, repeat the warning, and test whether the legend will answer.'
    ],
    context: [
      'Modern monster legends often attach themselves to specific routes and structures. A bridge gives the story a boundary and a ritual: cross, stop, call, or wait.',
      'Goatman also draws on older hybrid-creature imagery while remaining modern in setting. The monster feels ancient and roadside at the same time.'
    ],
    variants: [
      'Later versions differ by region. Some connect Goatman with Maryland, some with Texas, and others with local bridges or tracks.',
      'Origin stories also change. Some versions involve an accident, a cursed person, a escaped figure, or no origin at all.'
    ],
    meaning: [
      'Goatman may be read as a story about thresholds. Bridges and backroads mark places where ordinary rules feel weaker.',
      'The figure lasts because it gives a local place a testable fear. People can go there, even if the story remains uncertain.'
    ],
    related: ['beast-of-bray-road-legend', 'dover-demon-legend', 'mothman-point-pleasant-legend'],
    sourceNote: 'This article follows Goatman as a modern local monster legend with several regional forms. Specific bridge stories are treated as variants within a wider folklore pattern.'
  }),
  topic({
    categorySlug: 'myths',
    slug: 'sisyphus-myth',
    title: 'Sisyphus Myth: The Stone, the Hill, and the Punishment That Never Ends',
    subject: 'Sisyphus',
    tag: 'Greek Myth',
    tags: ['Greek Myth', 'Sisyphus', 'Underworld Punishment', 'Mythic Labor'],
    keyword: 'sisyphus myth',
    detail: 'the Greek myth of Sisyphus, condemned in the underworld to push a stone uphill forever',
    sourceBasis: 'Greek myth summaries, classical references, underworld punishment motifs, and later philosophical interpretation',
    evidence: 'classical mythology references, ancient-source discussion, myth summaries, and later interpretive traditions',
    vocabulary: ['Sisyphus', 'stone', 'underworld', 'endless labor', 'Greek myth'],
    sources: [
      source('Encyclopaedia Britannica - Sisyphus', 'https://www.britannica.com/topic/Sisyphus', 'Supports the core myth, punishment, and classical context.'),
      source('Theoi - Sisyphos', 'https://www.theoi.com/Khthonios/Sisyphos.html', 'Supports ancient-source references and Greek myth details.')
    ],
    quickAnswer: [
      'Sisyphus is a Greek mythic figure condemned in the underworld to roll a stone uphill, only for it to fall back again.',
      'The myth is remembered because the punishment is simple and complete: effort continues, but arrival never lasts.'
    ],
    core: [
      'Sisyphus is often described as clever, deceitful, or defiant toward divine order. His punishment turns that cleverness into endless repetition.',
      'The stone reaches near the top, then rolls back down. The work begins again, and the cycle becomes the image people remember.'
    ],
    context: [
      'Greek underworld punishments often make inner character visible. The punishment is not random; it becomes a symbolic form of the life or offense remembered in the myth.',
      'Sisyphus became especially powerful in later thought because the image is easy to transfer. Any repeated, exhausting, unfinished labor can become Sisyphean.'
    ],
    variants: [
      'Ancient and later versions differ around the exact offense, including tricking death, betraying divine secrets, or challenging the gods.',
      'Later interpretations may emphasize absurdity, endurance, punishment, or human struggle. Those readings grow from the image but do not replace the mythic setting.'
    ],
    meaning: [
      'Sisyphus may be read as a myth about effort without completion. The hill matters because it promises an end it never gives.',
      'That is why the story remains useful. It gives frustration a shape: a stone, a slope, and another beginning.'
    ],
    related: ['prometheus-fire-myth', 'icarus-flight-myth', 'pandoras-jar-myth'],
    sourceNote: 'This article follows Sisyphus as Greek myth and later interpretive symbol. Ancient variants and modern philosophical readings are kept separate from the core punishment image.'
  }),
  topic({
    categorySlug: 'mythic-creatures',
    slug: 'cerberus-mythic-creature',
    title: 'Cerberus Mythic Creature: The Three-Headed Dog at the Gate of the Underworld',
    subject: 'Cerberus',
    tag: 'Underworld Creature',
    tags: ['Underworld Creature', 'Cerberus', 'Greek Myth', 'Guardian Monster'],
    keyword: 'cerberus mythic creature',
    detail: 'the Greek mythic creature Cerberus, the many-headed guard dog of the underworld',
    sourceBasis: 'Greek myth references, underworld guardian motifs, classical retellings, and monster folklore summaries',
    evidence: 'classical mythology references, ancient-source discussion, Greek underworld descriptions, and later art and literature',
    vocabulary: ['Cerberus', 'three-headed dog', 'underworld', 'Hades', 'guardian monster'],
    sources: [
      source('Encyclopaedia Britannica - Cerberus', 'https://www.britannica.com/topic/Cerberus', 'Supports the core identity of Cerberus as underworld guard dog.'),
      source('Theoi - Kerberos', 'https://www.theoi.com/Ther/KuonKerberos.html', 'Supports ancient-source references and mythic details.')
    ],
    quickAnswer: [
      'Cerberus is the Greek mythic guard dog of the underworld, commonly remembered as having three heads and standing at the boundary of Hades.',
      'The creature matters because it does not simply attack. It guards the difference between the living world and the dead.'
    ],
    core: [
      'Cerberus appears as a monstrous dog stationed at the underworld entrance. The creature prevents the dead from leaving and the living from entering without consequence.',
      'The most famous episode is the labor of Heracles, who must bring Cerberus up from the underworld and return with proof of the impossible task.'
    ],
    context: [
      'Guardian creatures often mark borders in myth. Cerberus is frightening because the border he guards is final.',
      'The three-headed form makes the creature visually unforgettable. It also suggests watchfulness in more than one direction.'
    ],
    variants: [
      'Ancient sources do not always describe Cerberus in exactly the same way. The number of heads, serpent details, and surrounding imagery can shift.',
      'Later art and popular culture often standardize the three-headed dog, making one version far more familiar than the full range of older descriptions.'
    ],
    meaning: [
      'Cerberus may be read as a creature of boundary and return. To pass him is to cross into a realm where ordinary rules no longer apply.',
      'That is why the image remains strong. The monster is not only dangerous; he is the gate itself made alive.'
    ],
    related: ['griffin-folklore', 'basilisk-folklore', 'kraken-sea-monster-folklore'],
    sourceNote: 'This article follows Cerberus as a Greek underworld creature. Ancient variations in form are treated as variants rather than errors, while later standardized images are kept separate from older sources.'
  }),
  topic({
    categorySlug: 'lost-worlds',
    slug: 'hy-brasil-legendary-island',
    title: 'Hy-Brasil Legendary Island: The Vanishing Land on Old Atlantic Maps',
    subject: 'Hy-Brasil',
    tag: 'Vanishing Island',
    tags: ['Vanishing Island', 'Hy-Brasil', 'Lost Island', 'Atlantic Legend'],
    keyword: 'hy-brasil legendary island',
    detail: 'the legendary island Hy-Brasil, said to appear west of Ireland and vanish from ordinary reach',
    sourceBasis: 'Atlantic island legends, medieval and early modern map history, Irish folklore, and lost-island traditions',
    evidence: 'map-history summaries, Irish folklore discussion, lost-island references, and later legendary geography',
    vocabulary: ['Hy-Brasil', 'vanishing island', 'Atlantic map', 'Irish folklore', 'lost island'],
    sources: [
      source('Historic UK - Hy-Brasil', 'https://www.historic-uk.com/CultureUK/Hy-Brasil-The-Other-Atlantis/', 'Supports the legendary island tradition and later comparisons with Atlantis.'),
      source('Wikipedia - Brasil mythical island', 'https://en.wikipedia.org/wiki/Brasil_(mythical_island)', 'Supports map history, names, and common legendary geography.')
    ],
    quickAnswer: [
      'Hy-Brasil is a legendary island often placed west of Ireland on old maps and described as difficult or impossible to reach.',
      'The island matters because it sits between cartography and folklore: drawn as if it belonged to geography, remembered as if it belonged to another world.'
    ],
    core: [
      'The familiar tradition describes Hy-Brasil as an island that appears rarely, hides in mist, or becomes accessible only under special conditions.',
      'Its presence on maps gave the legend a kind of visual authority. A reader could see the island even when sailors could not reliably find it.'
    ],
    context: [
      'Lost-island legends often grow where navigation, rumor, and inherited place names overlap. The ocean leaves room for land that might have been missed, misplaced, or imagined.',
      'Hy-Brasil also belongs to Irish and Atlantic otherworld traditions, where islands can be sacred, hidden, blessed, or removed from ordinary time.'
    ],
    variants: [
      'Later versions differ around how often the island appears, who can reach it, and whether it is a real mistaken land, a magical island, or a map tradition.',
      'Some retellings compare Hy-Brasil to Atlantis, but the better reading keeps its Irish and Atlantic identity visible.'
    ],
    meaning: [
      'Hy-Brasil may be read as a story about visible absence. A place can be marked, named, and desired while remaining unreachable.',
      'That is why the island remains memorable. It gives the map a secret that the sea refuses to confirm.'
    ],
    related: ['atlantis-lost-city', 'lyonesse-lost-land-legend', 'mu-lost-continent-legend'],
    sourceNote: 'This article follows Hy-Brasil as a legendary island shaped by map history and folklore. Old map appearances are treated as part of the source trail, not as proof that the island exists as described.'
  }),
  topic({
    categorySlug: 'strange-nature',
    slug: 'st-elmos-fire-phenomenon',
    title: 'St. Elmo\'s Fire Phenomenon: Blue Light, Storms, and the Folklore of Sailors',
    subject: 'St. Elmo\'s Fire',
    tag: 'Storm Light Phenomenon',
    tags: ['Storm Light Phenomenon', 'St. Elmo\'s Fire', 'Sailor Folklore', 'Weather Mystery'],
    keyword: 'st elmos fire phenomenon',
    detail: 'the luminous electrical weather phenomenon remembered by sailors as a blue or violet glow during storms',
    sourceBasis: 'meteorological explanation, maritime reports, sailor folklore, and unusual-weather documentation',
    evidence: 'science explanations, historical sailor accounts, weather references, and folklore reception of storm lights',
    vocabulary: ['St. Elmo\'s Fire', 'blue glow', 'storm electricity', 'sailor omen', 'weather phenomenon'],
    sources: [
      source('Encyclopaedia Britannica - Saint Elmo\'s fire', 'https://www.britannica.com/science/Saint-Elmos-fire', 'Supports the scientific description of the electrical weather phenomenon.'),
      source('NOAA - St. Elmo\'s Fire', 'https://www.weather.gov/safety/lightning-science-elmo', 'Supports public weather-safety explanation and atmospheric electricity context.')
    ],
    quickAnswer: [
      'St. Elmo\'s Fire is a luminous electrical phenomenon that can appear as a blue or violet glow around pointed objects during storm conditions.',
      'Sailors often remembered it as an omen or sign because the light appeared in dangerous weather, especially around masts and rigging.'
    ],
    core: [
      'The phenomenon is usually explained through atmospheric electricity and corona discharge. It can glow around points where electrical charge builds in the air.',
      'For sailors, the sight could feel supernatural because it appeared during storms on ships already surrounded by danger.'
    ],
    context: [
      'Strange nature folklore often begins when a real phenomenon appears rarely, suddenly, and under emotional pressure.',
      'St. Elmo\'s Fire sits exactly in that space. Science can explain the light, but the old stories explain how people felt when they saw it.'
    ],
    variants: [
      'Historical accounts differ around whether the light is treated as good luck, divine protection, warning, or simply uncanny storm behavior.',
      'Later retellings may emphasize the omen more than the physics. A careful reading keeps observation, explanation, and folklore in separate layers.'
    ],
    meaning: [
      'St. Elmo\'s Fire may be read as a story about danger becoming visible. The storm seems to draw light out of the ship itself.',
      'That is why it became memorable. It turns invisible electricity into a sign that people can see and name.'
    ],
    related: ['green-flash-sunset-phenomenon', 'ball-lightning-folklore', 'blood-rain-phenomenon'],
    sourceNote: 'This article follows St. Elmo\'s Fire as a real atmospheric phenomenon with maritime folklore attached to it. The scientific explanation and sailor omen tradition are treated as related but distinct.'
  }),
  topic({
    categorySlug: 'legendary-places',
    slug: 'lake-titicaca-legendary-place',
    title: 'Lake Titicaca Legendary Place: Sacred Water, Origin Stories, and Andean Memory',
    subject: 'Lake Titicaca',
    tag: 'Sacred Lake',
    tags: ['Sacred Lake', 'Lake Titicaca', 'Andean Myth', 'Legendary Place'],
    keyword: 'lake titicaca legendary place',
    detail: 'the Andean sacred lake associated with origin stories, Inca memory, and mythic emergence from water',
    sourceBasis: 'Andean mythology summaries, Inca origin traditions, sacred geography, and public history of Lake Titicaca',
    evidence: 'geographic references, Andean myth summaries, Inca tradition discussions, and sacred-place interpretation',
    vocabulary: ['Lake Titicaca', 'Andean myth', 'Inca origin', 'sacred lake', 'Island of the Sun'],
    sources: [
      source('Encyclopaedia Britannica - Lake Titicaca', 'https://www.britannica.com/place/Lake-Titicaca', 'Supports the geographic and cultural context of Lake Titicaca.'),
      source('World History Encyclopedia - Lake Titicaca', 'https://www.worldhistory.org/Lake_Titicaca/', 'Supports Andean sacred geography and mythic context.')
    ],
    quickAnswer: [
      'Lake Titicaca is a real Andean lake strongly associated with sacred geography, origin stories, and Inca memory.',
      'The lake is legendary because water, islands, altitude, and origin traditions combine to make the place feel like a beginning point rather than only a landscape.'
    ],
    core: [
      'In Andean and Inca-related traditions, Lake Titicaca is connected with emergence, sacred ancestry, and places such as the Island of the Sun.',
      'The lake is not only a setting. It functions as a source, a boundary, and a remembered center of the world.'
    ],
    context: [
      'Legendary places often become powerful when geography supports symbolism. A high lake can feel like sky and earth meeting in one visible place.',
      'Lake Titicaca has long carried cultural and ritual importance, so later summaries often treat it as both physical landscape and mythic origin site.'
    ],
    variants: [
      'Later versions differ around which origin figures, islands, and sacred episodes receive emphasis.',
      'Tourism writing may simplify the traditions into a single story. A better reading keeps the wider Andean sacred geography visible.'
    ],
    meaning: [
      'Lake Titicaca may be read as a place where origin becomes landscape. The water is remembered as more than water because it holds beginnings.',
      'That is why the lake remains legendary. It lets a real place carry mythic time.'
    ],
    related: [
      'mount-kailash-legendary-place',
      'stonehenge-legendary-place',
      'oracle-of-delphi-legend',
      'mount-olympus-greek-myth',
      'fountain-of-youth-legend',
      'hy-brasil-legendary-island',
      'atlantis-lost-city',
      'shambhala-hidden-kingdom',
      'lyonesse-lost-land-legend',
      'agartha-hollow-earth-legend'
    ],
    sourceNote: 'This article follows Lake Titicaca as a real Andean place with sacred and mythic traditions attached to it. Regional beliefs and later summaries are treated as layers rather than one simplified origin story.'
  }),
  topic({
    categorySlug: 'mythic-objects',
    slug: 'pandoras-box-origin',
    title: 'Pandora\'s Box Origin: The Jar, the Box, and the Mistake That Changed a Mythic Object',
    subject: 'Pandora\'s Box',
    tag: 'Mythic Object Origin',
    tags: ['Mythic Object Origin', 'Pandora\'s Box', 'Pandora\'s Jar', 'Greek Myth'],
    keyword: 'pandoras box origin',
    detail: 'the later object tradition that changed Pandora\'s jar into Pandora\'s box in popular memory',
    sourceBasis: 'Greek myth summaries, Hesiodic tradition, translation history, and later object folklore',
    evidence: 'classical myth references, translation discussion, myth dictionaries, and later popular retellings',
    vocabulary: ['Pandora\'s Box', 'Pandora\'s Jar', 'pithos', 'hope', 'Greek myth'],
    sources: [
      source('Theoi - Pandora', 'https://www.theoi.com/Heroine/Pandora.html', 'Supports ancient-source references to Pandora and the jar tradition.'),
      source('Encyclopaedia Britannica - Pandora', 'https://www.britannica.com/topic/Pandora-Greek-mythology', 'Supports the core myth and later popular framing.')
    ],
    quickAnswer: [
      'Pandora\'s Box is the familiar modern name for a Greek mythic object that older tradition more accurately describes as a jar or pithos.',
      'The origin matters because a translation and retelling shift changed how the object is imagined, even while the mythic function remained recognizable.'
    ],
    core: [
      'In the Pandora myth, the container releases evils or troubles into the human world, while hope remains inside or is left in a complicated position.',
      'The popular phrase Pandora\'s Box survives because the object became a shorthand for opening something that cannot be controlled once released.'
    ],
    context: [
      'Mythic objects often change form as language changes. A jar can become a box in popular memory if the translated image is easier to picture and repeat.',
      'The object remains powerful because it turns consequence into a thing with a lid. One action opens a world of trouble.'
    ],
    variants: [
      'Later versions differ around whether the object is called a jar, box, vessel, or container, and around how hope should be understood.',
      'Popular retellings often simplify the story into curiosity and punishment, while older mythic contexts are more complex.'
    ],
    meaning: [
      'Pandora\'s Box may be read as a story about irreversible release. The object matters because it marks the moment before and after trouble enters the world.',
      'The box is technically a later memory, but that mistake became part of the object\'s cultural life.'
    ],
    related: ['pandoras-jar-myth', 'pandoras-box-myth', 'ring-of-gyges-myth'],
    sourceNote: 'This article follows Pandora\'s Box as a later object name attached to an older Greek jar tradition. The page keeps the pithos source issue visible instead of treating the box wording as the earliest form.'
  }),
  topic({
    categorySlug: 'legend-origins',
    slug: 'rabbits-foot-luck-origin',
    title: 'Rabbit\'s Foot Luck Origin: The Charm, the Animal, and the Superstition of Carried Luck',
    subject: 'Rabbit\'s Foot Luck',
    tag: 'Luck Charm Origin',
    tags: ['Luck Charm Origin', 'Rabbit\'s Foot', 'Superstition', 'Folk Belief'],
    keyword: 'rabbits foot luck origin',
    detail: 'the folk belief that a rabbit\'s foot can be carried as a charm for luck or protection',
    sourceBasis: 'superstition history, folk charm traditions, popular belief summaries, and regional luck-symbol discussion',
    evidence: 'folklore summaries, superstition references, charm-history discussion, and later popular explanations',
    vocabulary: ['rabbit\'s foot', 'luck charm', 'superstition', 'folk belief', 'protective charm'],
    sources: [
      source('Wikipedia - Rabbit\'s foot', 'https://en.wikipedia.org/wiki/Rabbit%27s_foot', 'Supports the general superstition, charm use, and common origin discussion.'),
      source('Snopes - Rabbit\'s Foot', 'https://www.snopes.com/fact-check/rabbits-foot/', 'Supports source-aware discussion of the luck charm and popular belief.')
    ],
    quickAnswer: [
      'Rabbit\'s foot luck is a folk belief in which a preserved rabbit\'s foot is carried as a charm for good fortune or protection.',
      'The belief is remembered through superstition, regional custom, and popular charm culture rather than one single clean origin.'
    ],
    core: [
      'The charm works by turning part of an animal into a portable sign of luck. The object can be kept in a pocket, on a keychain, or as a small personal token.',
      'Explanations often connect the belief with fertility, speed, animal symbolism, graveyard lore, or older folk-magic practices.'
    ],
    context: [
      'Luck charms often survive because they are small and easy to carry. They make invisible fortune feel touchable.',
      'The rabbit\'s foot also shows how folk belief can separate an object from its original context. Many people know the charm before they know any origin story.'
    ],
    variants: [
      'Later explanations differ around which foot is lucky, how the charm must be obtained, and whether the belief is protective, lucky, or magical.',
      'Modern versions often soften the animal and ritual context, treating the rabbit\'s foot as a generic lucky token.'
    ],
    meaning: [
      'Rabbit\'s foot luck may be read as a belief about carrying chance. The charm lets a person hold the hope that luck can be kept close.',
      'That is why the superstition remains recognizable. It makes fortune feel like an object rather than a mood.'
    ],
    related: ['horseshoe-luck-origin', 'black-cat-superstition-origin', 'evil-eye-origin'],
    sourceNote: 'This article follows rabbit\'s foot luck as a folk charm and superstition. Regional origin claims and ritual details are treated as variants rather than one universal explanation.'
  })
];

const added = [];
const updated = [];

for (const plan of topics) {
  const category = categoryBySlug.get(plan.categorySlug);
  if (!category) throw new Error(`Missing category: ${plan.categorySlug}`);
  const story = buildStory(plan, category);
  story.publicArticlePlan = buildPublicArticlePlan(story);
  if (!story.publicArticlePlan || !Array.isArray(story.publicArticlePlan.sections) || story.publicArticlePlan.sections.length !== 5) {
    throw new Error(`Article generation stopped. A valid five-section Public Article Plan could not be created for ${story.slug}.`);
  }
  story.publicArticlePlan.dek = deckFor(plan, category);
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

console.log(`Added ${added.length} and updated ${updated.length} real-story archive articles across ${topics.length} categories.`);
for (const story of added) console.log(`added ${story.categorySlug}: ${story.slug}`);
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
    topicScore: 95,
    topicStatus: 'approved',
    scoreBreakdown: {
      searchDemand: 30,
      clickCuriosity: 24,
      siteFit: 25,
      expansionPotential: 10,
      sourceSafety: 6
    },
    summaryAnswer: plan.quickAnswer.join(' '),
    readTime: '9 min read',
    storyType: storyTypeFor(category.slug),
    generationBatch: 'real-one-each-20260720',
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
    introSummary: deckFor(plan, category),
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
    `Where do later versions of ${subject} differ?`,
    `What does ${subject} mean?`
  ];
}

function deckFor(plan, category) {
  return `${articleFor(category.title)} ${category.title} entry for reading the familiar account with care, separating older material, popular variation, and interpretation without flattening them into one claim.`;
}

function articleFor(value) {
  return /^[aeiou]/i.test(String(value || '').trim()) ? 'An' : 'A';
}

function source(title, url, supports) {
  return { title, url, sourceType: 'reference', supports };
}

function topic(value) {
  return value;
}

function relatedSlugsFor(plan) {
  return unique(plan.related || [])
    .filter((slug) => slug !== plan.slug && storySlugs.has(slug))
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

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
