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
const existingQueries = new Set(
  stories
    .map((story) => story.contentDNA?.canonicalQuery || story.primaryKeyword || story.seedKeyword)
    .filter(Boolean)
    .map((query) => query.toLowerCase().trim())
);

const topics = [
  topic({
    categorySlug: 'urban-legends',
    slug: 'vanishing-hitchhiker-urban-legend',
    title: 'Vanishing Hitchhiker Urban Legend: The Passenger Who Disappears Before Arrival',
    subject: 'Vanishing Hitchhiker',
    tag: 'Roadside Urban Legend',
    tags: ['Roadside Urban Legend', 'Vanishing Hitchhiker', 'Ghost Story', 'Travel Rumor', 'Folklore Motif'],
    keyword: 'vanishing hitchhiker urban legend',
    detail: 'the roadside legend of a driver who gives a stranger a ride, only to learn the passenger vanished or died long before the meeting',
    sourceBasis: 'urban legend collections, folklore scholarship, and modern roadside ghost-story retellings',
    evidence: 'folklore reference summaries, urban legend scholarship, roadside ghost-story variants, and repeated oral and printed retellings',
    vocabulary: ['vanishing hitchhiker', 'roadside ghost', 'driver', 'passenger', 'returning spirit'],
    urls: [
      source('Snopes - The Vanishing Hitchhiker', 'https://www.snopes.com/fact-check/the-vanishing-hitchhiker/', 'Supports the urban-legend frame and common roadside versions.'),
      source('Wikipedia - Vanishing hitchhiker', 'https://en.wikipedia.org/wiki/Vanishing_hitchhiker', 'Supports common motif history, variants, and international circulation.'),
      source('The Vanishing Hitchhiker by Jan Harold Brunvand', 'https://wwnorton.com/books/The-Vanishing-Hitchhiker/', 'Supports the classic urban legend scholarship context.')
    ],
    quickAnswer: [
      'The Vanishing Hitchhiker is a widely known urban legend about a driver who picks up a quiet passenger on a lonely road. The passenger disappears before the ride ends, or the driver later learns that the person died years earlier.',
      'The story matters because it turns ordinary travel into a meeting with memory. Different versions change the road, the passenger, and the proof, but the central image remains the same: a stranger who was never fully there.'
    ],
    intro: [
      'A car stops at night. A stranger gets in. Nothing seems impossible yet.',
      'Then the passenger is gone. The seat is empty, the address leads to a grave, and an ordinary ride becomes a story people keep telling.'
    ],
    sections: [
      ['The Ride That Starts the Legend', 'In the familiar version, a driver sees a young woman or quiet stranger waiting near a road, bridge, cemetery, or town edge. The driver offers a ride, and the passenger gives an address or destination that seems ordinary at first. The strange part comes later, when the passenger vanishes from the car or leaves behind only a clue.', 'The driver may reach a house and learn from a relative that the passenger died on that road years before. Some versions add a borrowed coat found on a grave, while others make the disappearance happen silently before anyone notices. The story works because the impossible detail arrives after the kind gesture.'],
      ['How Versions Change', 'Different versions move the story between highways, village roads, prom nights, war memories, and cemetery paths. Some passengers are brides, some are students, and some are unnamed figures who repeat the same journey each year. Later retellings often add local roads so the legend feels close to the listener.', 'The strongest pattern stays consistent even when details shift. A living driver helps a passenger who belongs to the past. The proof usually appears only after the encounter, which lets the story feel like testimony rather than a staged ghost tale.'],
      ['What the Story Can Support', 'The Vanishing Hitchhiker can be traced as a folklore motif and urban legend, not as one single verified incident. Folklore collections and repeated retellings show how widely the pattern circulates. They do not prove that one original ghost passenger caused every version.', 'Some versions may preserve local grief or memorial traditions. Others are better read as cautionary travel stories. Keeping those possibilities separate helps the legend remain interesting without forcing every road into one origin.'],
      ['Why It Still Lasts', 'The legend may be read as a story about unfinished journeys. A passenger needs to be carried somewhere, but the destination is not simply a place. It is memory, loss, or the need for someone living to witness what happened.', 'That is why the story still feels natural in modern settings. Cars change, roads change, and maps improve. But the fear of meeting the past on an empty road has not disappeared.']
    ],
    faq: [
      qa('Is the Vanishing Hitchhiker based on one real case?', 'No single confirmed case explains the whole legend. It is best understood as a widely repeated urban legend with many local versions.'),
      qa('Why does the passenger usually vanish?', 'The disappearance reveals that the passenger belongs to a death, memory, or event that happened before the driver arrived.'),
      qa('Why do versions often use roads or cemeteries?', 'Roads create movement and uncertainty, while cemeteries give the story a place where the passenger can be recognized afterward.'),
      qa('What does the legend mean?', 'It may be read as a story about grief, unfinished travel, and the feeling that some places keep repeating the past.')
    ],
    sourceNote: 'This article follows the Vanishing Hitchhiker as an urban legend motif preserved through folklore scholarship, printed collections, and local retellings. The page treats named roads and individual versions as variants unless a source clearly supports a specific incident.'
  }),
  topic({
    categorySlug: 'internet-folklore',
    slug: 'polybius-arcade-game-legend',
    title: 'Polybius Arcade Game Legend: The Missing Cabinet, Rumor, and Internet Folklore',
    subject: 'Polybius',
    tag: 'Arcade Game Legend',
    tags: ['Arcade Game Legend', 'Polybius', 'Lost Game', 'Digital Rumor', 'Arcade Rumor'],
    keyword: 'polybius arcade game legend',
    detail: 'the internet legend of a mysterious arcade cabinet said to cause strange effects before disappearing from public view',
    sourceBasis: 'internet folklore summaries, game-history reporting, and discussions of the Polybius arcade legend',
    evidence: 'game history articles, internet legend documentation, arcade rumor discussion, and later media references',
    vocabulary: ['Polybius', 'arcade cabinet', 'lost game', 'urban rumor', 'video game legend'],
    urls: [
      source('Wikipedia - Polybius (urban legend)', 'https://en.wikipedia.org/wiki/Polybius_(urban_legend)', 'Supports the basic legend, claimed cabinet, and internet folklore context.'),
      source('Atlas Obscura - The Mysterious Missing Arcade Game Polybius', 'https://www.atlasobscura.com/articles/the-mysterious-missing-arcade-game-polybius', 'Supports the missing-game legend and later cultural fascination.'),
      source('Skeptoid - Polybius', 'https://skeptoid.com/episodes/4362', 'Supports skeptical discussion of the rumor and source limits.')
    ],
    quickAnswer: [
      'Polybius is an internet folklore story about a mysterious arcade game supposedly tested in the early 1980s. The legend says the cabinet caused strange physical or psychological effects, then disappeared.',
      'The strongest reading treats Polybius as a digital-age urban legend about missing media, government suspicion, and arcade nostalgia. The cabinet is famous because it feels almost traceable, even though solid evidence remains absent.'
    ],
    intro: [
      'Polybius begins with a machine that should have left evidence.',
      'An arcade cabinet is physical. It has weight, wiring, artwork, repair records, and players. That is what makes the legend so tempting: the missing object feels as if it should be recoverable.'
    ],
    sections: [
      ['The Arcade Cabinet in the Rumor', 'The common Polybius story describes a rare arcade cabinet appearing in the Portland area during the early 1980s. Players supposedly reported headaches, nightmares, memory problems, or stranger effects after using it. In some versions, people connected to unknown agencies visited the cabinet before it vanished.', 'The story borrows from real arcade culture: crowded rooms, new technology, flashing screens, and rumors moving between players. That believable setting helps the impossible parts feel closer to ordinary history.'],
      ['How the Legend Spread Online', 'Polybius became stronger on the internet because missing media works well in digital spaces. A game can be discussed, reconstructed, imitated, and searched for even when no verified original cabinet appears. Later accounts, documentaries, fan games, and forum posts gave the legend more surfaces to cling to.', 'Different versions change the symptoms, the location, the company name, and the purpose of the supposed test. The lack of stable evidence became part of the appeal rather than an ending.'],
      ['What Can and Cannot Be Shown', 'The Polybius legend can be documented as a widely circulated internet and gaming rumor. It also connects with real anxieties about screens, experiments, surveillance, and hidden technology. That does not prove that the described cabinet existed as claimed.', 'The safest account separates the folklore from later recreations. Modern Polybius games and references show the legend continuing, but they are not proof of an original machine.'],
      ['Why Polybius Still Works', 'Polybius may be read as a missing-object legend for the digital age. It offers a physical thing that should have been saved, photographed, listed, repaired, or remembered by many people. Its absence becomes the mystery.', 'The story lasts because it sits at the edge of proof. It is close enough to arcade history to feel possible, and strange enough to become folklore.']
    ],
    faq: [
      qa('Was Polybius a real arcade game?', 'No verified original Polybius cabinet has been shown. The story is generally treated as an urban legend and internet folklore.'),
      qa('Where was Polybius supposed to appear?', 'Many versions place the cabinet in or near Portland, Oregon, during the early 1980s.'),
      qa('Why do people still talk about Polybius?', 'It combines missing media, arcade nostalgia, secrecy, and the feeling that a physical object might still be found.'),
      qa('Are modern Polybius games proof of the legend?', 'No. Later games and references show the legend spreading, but they do not prove the original claim.')
    ],
    sourceNote: 'This article follows Polybius as a documented internet and arcade urban legend. Later recreations, fan projects, and media references are treated as evidence of circulation, not as proof that the original cabinet existed.'
  }),
  topic({
    categorySlug: 'strange-places',
    slug: 'bennington-triangle-legend',
    title: 'Bennington Triangle: Disappearances, Mountain Roads, and a Vermont Place Legend',
    subject: 'Bennington Triangle',
    tag: 'Place Legend',
    tags: ['Place Legend', 'Bennington Triangle', 'Vermont Folklore', 'Disappearances', 'Mountain Mystery'],
    keyword: 'bennington triangle legend',
    detail: 'the Vermont place legend linking several disappearances around Glastenbury Mountain and the Bennington area',
    sourceBasis: 'New England folklore writing, disappearance summaries, and regional discussion of the Bennington Triangle label',
    evidence: 'regional history summaries, disappearance accounts, place folklore, and later naming of the Bennington Triangle',
    vocabulary: ['Bennington Triangle', 'Glastenbury Mountain', 'Vermont', 'disappearances', 'place legend'],
    urls: [
      source('Wikipedia - Bennington Triangle', 'https://en.wikipedia.org/wiki/Bennington_Triangle', 'Supports the basic regional label, cases, and place-legend context.'),
      source('New England Historical Society - The Bennington Triangle', 'https://www.newenglandhistoricalsociety.com/the-bennington-triangle/', 'Supports regional framing and the cluster of disappearances.'),
      source('Vermont Public - Glastenbury Mountain history', 'https://www.vermontpublic.org/programs/2014-10-31/brave-little-state-what-happened-to-glastenbury', 'Supports context around Glastenbury and regional memory.')
    ],
    quickAnswer: [
      'The Bennington Triangle is a regional place legend connected with disappearances around Glastenbury Mountain and the Bennington area of Vermont. The name groups several events into one mysterious landscape.',
      'The phrase works like a map drawn over uncertainty. It does not prove one cause behind every disappearance, but it gives the region a memorable folklore shape.'
    ],
    intro: [
      'Some places become strange because of one story. Others become strange because several stories gather in the same terrain.',
      'The Bennington Triangle belongs to the second kind. It is a name placed over roads, mountain paths, disappearances, and the feeling that a landscape has kept more than it explains.'
    ],
    sections: [
      ['The Place Behind the Name', 'The Bennington Triangle is usually linked to southwestern Vermont, especially the area around Glastenbury Mountain. The term groups several disappearances and unsettling local stories into one named region. Like other triangle legends, the label makes separate events feel connected.', 'The mountain setting matters. Dense woods, rough trails, abandoned settlements, and shifting weather can make ordinary geography feel uncertain. A place legend grows when a location seems to resist a simple explanation.'],
      ['How the Disappearances Shape the Legend', 'The stories most often connected with the Bennington Triangle involve people vanishing in or near the region across different years. Later accounts retell those cases together, creating a pattern that feels larger than any single incident. Some versions add old trails, unusual silence, or local warnings.', 'Different versions do not always agree on which events belong inside the triangle. That uncertainty is common in place folklore. The name becomes a container, and stories are added or removed as the legend is retold.'],
      ['What the Evidence Can and Cannot Show', 'The strongest evidence supports a regional folklore label and a set of documented or reported disappearances. It does not support one hidden force behind all of them. Weather, terrain, incomplete records, and later retellings all affect how the story is understood.', 'Some accounts may be grounded in real missing-person cases, while others lean on atmosphere and repetition. Keeping those layers separate makes the place more interesting, not less.'],
      ['Why the Landscape Stays Unsettling', 'The Bennington Triangle may be read as a modern wilderness legend. It turns the forest into a place where maps, search parties, and ordinary assumptions feel less secure. The mystery is not only what happened to specific people, but why the same region keeps absorbing questions.', 'That is why the name remains powerful. It gives uncertainty a boundary, even if the boundary itself is part of the legend.']
    ],
    faq: [
      qa('Is the Bennington Triangle a real official region?', 'It is a folklore and mystery label rather than an official geographic boundary.'),
      qa('Where is the Bennington Triangle usually placed?', 'It is usually associated with the Bennington and Glastenbury Mountain area in southwestern Vermont.'),
      qa('Does one explanation connect all the disappearances?', 'No single confirmed explanation connects every story grouped under the label.'),
      qa('Why does the legend remain popular?', 'It combines real landscape, missing-person uncertainty, abandoned-place atmosphere, and the memorable triangle pattern.')
    ],
    sourceNote: 'This article treats the Bennington Triangle as a regional place legend built around real geography and reported disappearances. The name is useful for understanding folklore circulation, but it should not be treated as proof of one cause behind every case.'
  }),
  topic({
    categorySlug: 'unexplained-mysteries',
    slug: 'oak-island-money-pit',
    title: 'Oak Island Money Pit: Treasure, Tunnels, and the Mystery That Refuses to End',
    subject: 'Oak Island Money Pit',
    tag: 'Treasure Mystery',
    tags: ['Treasure Mystery', 'Oak Island', 'Money Pit', 'Nova Scotia', 'Unsolved Mystery'],
    keyword: 'oak island money pit',
    detail: 'the long-running Nova Scotia treasure mystery built around the Money Pit, flood tunnels, reported finds, and repeated excavations',
    sourceBasis: 'Nova Scotia place history, treasure-hunt reporting, and long-running Oak Island mystery summaries',
    evidence: 'local history, published treasure-hunt accounts, archaeological caution, and repeated excavation records',
    vocabulary: ['Oak Island', 'Money Pit', 'treasure', 'flood tunnels', 'Nova Scotia'],
    urls: [
      source('Britannica - Oak Island', 'https://www.britannica.com/place/Oak-Island-island-Nova-Scotia-Canada', 'Supports the island context and long-running treasure mystery.'),
      source('Wikipedia - Oak Island mystery', 'https://en.wikipedia.org/wiki/Oak_Island_mystery', 'Supports the common history, theories, and excavation tradition.'),
      source('Nova Scotia Archives - Oak Island', 'https://archives.novascotia.ca/', 'Supports regional archival context for Nova Scotia history and historical caution.')
    ],
    quickAnswer: [
      'The Oak Island Money Pit is a famous Nova Scotia mystery about a supposed buried treasure site discovered in the late eighteenth century. Later stories describe platforms, flood tunnels, strange finds, and repeated digs.',
      'Oak Island remains unresolved because every excavation seems to add more interpretation. The mystery is not only whether treasure exists, but how a hole in the ground became a centuries-long search.'
    ],
    intro: [
      'Oak Island begins with a depression in the ground and a question.',
      'What if something was buried there on purpose? That question has pulled treasure hunters, investors, writers, and viewers back to the island for generations.'
    ],
    sections: [
      ['The Money Pit Story', 'The basic account says that a strange depression was noticed on Oak Island in Nova Scotia. Digging revealed layers that some treasure hunters interpreted as deliberate construction. Over time, the site became known as the Money Pit.', 'Later accounts added wooden platforms, flood tunnels, stone inscriptions, coconut fiber, metal fragments, and many proposed treasure owners. Each detail made the mystery more elaborate, even when the evidence remained disputed.'],
      ['How the Search Became the Story', 'Oak Island is unusual because the search itself has lasted so long. Generations of diggers tried shafts, pumps, drills, surveys, and theories. Some efforts collapsed, flooded, or failed. Others produced finds that invited more questions than answers.', 'Different versions point to pirates, the Knights Templar, Shakespeare manuscripts, Spanish treasure, or other hidden deposits. Those theories do not carry the same weight, but they show how the island became a machine for producing possibilities.'],
      ['What Can Be Said Carefully', 'The strongest account supports a real island, real excavations, and a long history of treasure hunting. It does not prove that a specific treasure was buried there, or that every reported tunnel and clue has the meaning later writers gave it.', 'Some discoveries may be ordinary material from occupation, work, or earlier digging. Others remain debated. The mystery survives because the evidence is physical enough to invite attention, but not decisive enough to close the case.'],
      ['Why Oak Island Still Works', 'Oak Island may be read as a treasure legend about persistence. The object being searched for is important, but the repeated return matters just as much. Every failed dig becomes part of the island instead of ending it.', 'That is why the Money Pit remains memorable. It turns uncertainty into labor, and labor into folklore.']
    ],
    faq: [
      qa('Has treasure been proven in the Oak Island Money Pit?', 'No confirmed treasure find has solved the mystery in a final way.'),
      qa('Where is Oak Island?', 'Oak Island is in Nova Scotia, Canada.'),
      qa('Why does the Money Pit keep attracting attention?', 'It combines physical excavation, possible clues, long history, and competing treasure theories.'),
      qa('Are all Oak Island theories equally supported?', 'No. Some theories are speculative and should be separated from documented excavation history.')
    ],
    sourceNote: 'This article follows Oak Island through its public treasure-hunt history and common mystery summaries. Reported finds and theories are treated as part of the mystery tradition unless stronger evidence supports a specific claim.'
  }),
  topic({
    categorySlug: 'classic-folklore',
    slug: 'wild-hunt-folklore',
    title: 'Wild Hunt Folklore: Ghostly Riders, Storm Skies, and the Sound of a Passing Host',
    subject: 'Wild Hunt',
    tag: 'European Folklore',
    tags: ['European Folklore', 'Wild Hunt', 'Ghostly Riders', 'Storm Folklore', 'Omen'],
    keyword: 'wild hunt folklore',
    detail: 'the European folklore motif of a supernatural hunting party or ghostly host moving through storm, night, or winter sky',
    sourceBasis: 'European folklore summaries, medieval and later retellings, and comparative myth and legend discussion',
    evidence: 'folklore reference works, regional variants, mythological summaries, and later literary retellings',
    vocabulary: ['Wild Hunt', 'ghostly riders', 'storm sky', 'Odin', 'Herne', 'spectral host'],
    urls: [
      source('Britannica - Wild Hunt', 'https://www.britannica.com/topic/Wild-Hunt', 'Supports the European folklore motif and supernatural hunting host.'),
      source('Wikipedia - Wild Hunt', 'https://en.wikipedia.org/wiki/Wild_Hunt', 'Supports common variants, named leaders, and regional spread.'),
      source('World History Encyclopedia - The Wild Hunt', 'https://www.worldhistory.org/article/1690/the-wild-hunt/', 'Supports broader mythic and folkloric context.')
    ],
    quickAnswer: [
      'The Wild Hunt is a European folklore motif about a supernatural host, often heard or seen moving through the night sky, winter weather, or storm. It may appear as ghostly riders, hunters, hounds, or a procession of the dead.',
      'Different regions give the hunt different leaders, from Odin to Herne or other figures. The story lasts because it turns frightening weather and night travel into the sound of something passing overhead.'
    ],
    intro: [
      'The Wild Hunt is not quiet folklore.',
      'It arrives as hoofbeats, horns, hounds, wind, and a feeling that the night itself is moving. To hear it is to know that something older than the road has crossed nearby.'
    ],
    sections: [
      ['The Host in the Night', 'The core image of the Wild Hunt is a supernatural hunting party moving through darkness or storm. Witnesses may hear riders, dogs, horns, cries, or the rush of a ghostly procession. In some versions, seeing the hunt is dangerous. In others, joining it or mocking it brings misfortune.', 'The hunt is often tied to winter, liminal nights, wild weather, or lonely travel. Those settings make the sound of wind, animals, and darkness feel organized into a presence.'],
      ['How Versions Differ', 'Different versions name different leaders. Norse and Germanic traditions may connect the hunt with Odin or Wodan. English versions sometimes connect it with Herne the Hunter. Other regions use local dead, cursed nobles, fairies, or unnamed riders.', 'Later retellings change the hunt from omen to spectacle. Some emphasize the dead. Others emphasize pursuit, punishment, or seasonal fear. The image remains flexible because the host can absorb many local figures.'],
      ['What the Tradition Can Support', 'The Wild Hunt can be responsibly described as a recurring folklore motif across parts of Europe. Its many versions do not point to one single original event. They show how communities used familiar sounds and seasonal fear to imagine a supernatural procession.', 'The motif also crossed into literature and modern fantasy. Those later uses keep the name alive, but they should be separated from older regional belief and oral tradition.'],
      ['Why the Hunt Still Feels Powerful', 'The Wild Hunt may be read as a story about boundaries breaking open. The dead, the divine, the wild, and the weather pass through human space. People do not control it. They only hear it coming.', 'That is why the story remains vivid. It gives the sky a body, the wind a direction, and fear a sound.']
    ],
    faq: [
      qa('What is the Wild Hunt?', 'It is a European folklore motif about a supernatural host or hunting party moving through the night, sky, or storm.'),
      qa('Who leads the Wild Hunt?', 'The leader changes by region and retelling. Names include Odin, Herne, and various local or ghostly figures.'),
      qa('Is the Wild Hunt always an omen?', 'Many versions treat it as an omen or danger, but the exact meaning changes between traditions.'),
      qa('Why is the Wild Hunt linked with storms?', 'Storms create sound, movement, and darkness that fit the image of a passing supernatural host.')
    ],
    sourceNote: 'This article follows the Wild Hunt as a European folklore motif with many regional versions. Named leaders and meanings differ, so the page treats each version as part of a wider pattern rather than one fixed story.'
  }),
  topic({
    categorySlug: 'modern-legends',
    slug: 'men-in-black-legend',
    title: 'Men in Black Legend: UFO Witnesses, Silent Visitors, and Modern Conspiracy Folklore',
    subject: 'Men in Black',
    tag: 'UFO-Era Legend',
    tags: ['UFO-Era Legend', 'Men in Black', 'Conspiracy Folklore', 'Witness Story', 'Modern Legend'],
    keyword: 'men in black legend',
    detail: 'the modern legend of dark-suited visitors who appear after UFO sightings and warn witnesses to stay silent',
    sourceBasis: 'UFO-era folklore, modern legend studies, and public summaries of Men in Black witness narratives',
    evidence: 'UFO literature, modern legend summaries, witness-story patterns, and later popular culture references',
    vocabulary: ['Men in Black', 'UFO witnesses', 'dark suits', 'silent visitors', 'conspiracy folklore'],
    urls: [
      source('Wikipedia - Men in black', 'https://en.wikipedia.org/wiki/Men_in_black', 'Supports common legend traits and UFO-era context.'),
      source('Britannica - UFO', 'https://www.britannica.com/topic/unidentified-flying-object', 'Supports broader UFO context surrounding the legend.'),
      source('Skeptoid - Men in Black', 'https://skeptoid.com/episodes/4529', 'Supports skeptical discussion of MIB claims and folklore limits.')
    ],
    quickAnswer: [
      'The Men in Black legend describes strange dark-suited visitors who allegedly appear after UFO sightings, ask questions, and warn witnesses to keep quiet. The figures are usually calm, intimidating, and slightly wrong.',
      'The legend matters because it gives UFO secrecy a human shape. Instead of an abstract cover-up, the story offers a visitor at the door.'
    ],
    intro: [
      'The Men in Black do not need to arrive loudly.',
      'They are frightening because they appear after the strange event, when a witness is already unsure what happened. Their role is simple: make the witness doubt, fear, or stay silent.'
    ],
    sections: [
      ['The Visitors After the Sighting', 'In the common legend, a person reports or discusses a UFO sighting. Soon afterward, unknown men in dark suits appear. They may ask what was seen, request evidence, issue warnings, or behave with an unnatural stiffness.', 'The details vary, but the atmosphere stays steady. The visitors seem official without proving who they work for. They are human enough to stand in a room, but strange enough to belong to the mystery.'],
      ['How the Legend Grew', 'Men in Black stories developed alongside UFO culture, government secrecy fears, Cold War anxiety, and later conspiracy storytelling. Different versions make them agents, impostors, nonhuman beings, or psychological pressure given a face.', 'Later movies and popular culture made the image familiar, but the folklore version remains quieter and more unsettling. It is less about action and more about intimidation after the fact.'],
      ['What Can Be Treated as Evidence', 'The Men in Black can be documented as a modern legend and UFO-era story pattern. Individual reports may be sincere, exaggerated, mistaken, or shaped by existing expectations. The repeated pattern is easier to support than any single hidden organization.', 'This distinction matters. The legend shows how witnesses imagine secrecy approaching them personally, but it does not prove that every visitor story shares one real source.'],
      ['Why the Legend Still Works', 'The Men in Black may be read as folklore about controlled knowledge. A witness sees something strange, then the world seems to respond by sending someone to take the story away. The fear is not only of aliens. It is the fear that truth can be managed by strangers.', 'That is why the image remains useful. A dark suit, a polite warning, and a closed door can carry an entire conspiracy.']
    ],
    faq: [
      qa('What are the Men in Black in folklore?', 'They are mysterious visitors in UFO-era legends who question or warn witnesses after strange sightings.'),
      qa('Are Men in Black stories proven?', 'The pattern is well known as modern legend, but individual claims vary and are difficult to verify.'),
      qa('Why do they wear dark suits?', 'The suit makes them seem official, anonymous, and intimidating without needing a clear identity.'),
      qa('How did popular culture affect the legend?', 'Films and media made the image widely recognizable, but the older folklore often feels quieter and more threatening.')
    ],
    sourceNote: 'This article follows Men in Black stories as modern UFO-era folklore. It separates the repeated witness-story pattern from claims about any single verified agency, group, or nonhuman identity.'
  }),
  topic({
    categorySlug: 'myths',
    slug: 'prometheus-fire-myth',
    title: 'Prometheus Fire Myth: Theft, Punishment, and the Gift That Changed Humanity',
    subject: 'Prometheus',
    tag: 'Greek Myth',
    tags: ['Greek Myth', 'Prometheus', 'Fire Myth', 'Trickster', 'Punishment'],
    keyword: 'prometheus fire myth',
    detail: 'the Greek myth of Prometheus stealing fire for humanity and suffering punishment for crossing divine boundaries',
    sourceBasis: 'Greek mythology summaries, Hesiodic tradition, Aeschylean retelling, and later symbolic interpretation',
    evidence: 'classical myth references, literary retellings, and comparative readings of fire, knowledge, and punishment',
    vocabulary: ['Prometheus', 'fire', 'Zeus', 'punishment', 'humanity'],
    urls: [
      source('Britannica - Prometheus', 'https://www.britannica.com/topic/Prometheus-Greek-god', 'Supports the Greek mythic figure, theft of fire, and punishment.'),
      source('Theoi - Prometheus', 'https://www.theoi.com/Titan/TitanPrometheus.html', 'Supports classical source summaries and variants.'),
      source('World History Encyclopedia - Prometheus', 'https://www.worldhistory.org/Prometheus/', 'Supports myth summary and later interpretation.')
    ],
    quickAnswer: [
      'Prometheus is a Greek mythic figure remembered for stealing fire and giving it to humanity. Zeus punishes him for crossing divine limits, often by binding him while an eagle tears at him.',
      'The myth matters because fire is more than a tool. It stands for craft, knowledge, survival, rebellion, and the cost of helping humans against the will of the gods.'
    ],
    intro: [
      'Prometheus gives humanity something small enough to hold and powerful enough to change everything.',
      'Fire cooks, warms, protects, and transforms. In the myth, that gift is also a theft, and every gift has a price.'
    ],
    sections: [
      ['The Theft of Fire', 'In the familiar Greek myth, Prometheus takes fire from the divine realm and gives it to human beings. The act helps humanity survive and develop skill, craft, and culture. It also challenges Zeus by moving a divine power into human hands.', 'Prometheus is not simply generous. He is clever, defiant, and willing to bend boundaries. That mixture makes him a powerful figure: helper, trickster, rebel, and sufferer at once.'],
      ['The Punishment That Follows', 'Zeus punishes Prometheus by binding him and subjecting him to repeated torment. In many versions, an eagle eats his liver, which renews so the punishment can continue. Later retellings may connect his release with Heracles.', 'Different versions emphasize different parts of the story. Some focus on sacrifice and trickery. Others focus on fire, technology, or the suffering of the benefactor. The core pattern remains a gift to humans followed by divine punishment.'],
      ['What the Sources Preserve', 'Prometheus appears in several ancient traditions and later literary treatments. Hesiod and Aeschylean drama do not tell the story with identical emphasis, so the myth should not be flattened into one modern summary.', 'The strongest account keeps the recurring elements clear: Prometheus, Zeus, fire, humanity, boundary-crossing, and punishment. Interpretations can build from those elements without treating one symbolic reading as the only meaning.'],
      ['Why Prometheus Still Matters', 'Prometheus may be read as a myth about dangerous knowledge. Fire makes human life richer and more powerful, but it also marks a break in the order between gods and mortals.', 'That is why the myth remains useful for stories about technology, rebellion, sacrifice, and ambition. Prometheus is punished because he gives humans a future they were not supposed to hold.']
    ],
    faq: [
      qa('What did Prometheus give humanity?', 'He is most famous for giving fire to humanity.'),
      qa('Why was Prometheus punished?', 'He crossed divine limits by helping humans and defying Zeus.'),
      qa('Is Prometheus a god or a Titan?', 'Prometheus is usually described as a Titan in Greek myth.'),
      qa('What does Prometheus symbolize?', 'He often symbolizes knowledge, rebellion, craft, sacrifice, and the cost of progress.')
    ],
    sourceNote: 'This article follows Prometheus through Greek myth summaries and classical traditions. Different ancient sources emphasize different parts of the story, so the page separates the core fire myth from later symbolic readings.'
  }),
  topic({
    categorySlug: 'mythic-creatures',
    slug: 'phoenix-mythic-bird',
    title: 'Phoenix Mythic Bird: Fire, Renewal, and the Creature That Returns From Ashes',
    subject: 'Phoenix',
    tag: 'Mythic Bird',
    tags: ['Mythic Bird', 'Phoenix', 'Fire Symbolism', 'Renewal', 'Bestiary'],
    keyword: 'phoenix mythic bird',
    detail: 'the mythic bird associated with fire, death, renewal, and the image of returning from ashes',
    sourceBasis: 'classical references, bestiary tradition, Egyptian and Greco-Roman associations, and later symbolic use',
    evidence: 'mythology reference summaries, ancient literary references, medieval bestiary tradition, and later symbolic interpretation',
    vocabulary: ['phoenix', 'ashes', 'fire', 'renewal', 'mythic bird'],
    urls: [
      source('Britannica - Phoenix', 'https://www.britannica.com/topic/phoenix-mythological-bird', 'Supports the mythic bird, long life, death, and renewal pattern.'),
      source('Theoi - Phoenix', 'https://www.theoi.com/Thaumasios/Phoinix.html', 'Supports classical source summaries.'),
      source('World History Encyclopedia - Phoenix', 'https://www.worldhistory.org/Phoenix/', 'Supports broader mythic and symbolic context.')
    ],
    quickAnswer: [
      'The phoenix is a mythic bird associated with fire, death, and renewal. In many later versions, it dies in flame or on a nest and returns from ashes.',
      'The phoenix matters because it gives rebirth a clear image. The creature does not merely survive danger; it becomes new through the very fire that ends it.'
    ],
    intro: [
      'The phoenix is remembered through one of the strongest images in myth: a bird, a fire, and a return.',
      'It is not only a creature story. It is a shape for renewal, loss, and the hope that an ending can become another beginning.'
    ],
    sections: [
      ['The Bird of Return', 'The phoenix is usually described as a rare and extraordinary bird with a life cycle tied to death and renewal. In later retellings, it burns, turns to ash, and rises again. Earlier traditions may describe the process differently, but the association with rare rebirth remains central.', 'The bird is often linked with sun imagery, long life, radiance, and distance. It belongs less to ordinary animal folklore than to symbolic geography: eastern lands, sacred time, and places beyond everyday experience.'],
      ['How Versions Changed', 'Different versions do not always agree on how the phoenix dies or renews itself. Some emphasize a fragrant nest, some a burial or egg-like form, and some the dramatic image of ashes. Medieval and modern retellings often strengthen the fire-and-ash image because it is so memorable.', 'The phoenix also moved through classical writing, Christian symbolism, bestiary tradition, alchemy, heraldry, and modern fantasy. Each setting uses the bird for renewal, but the meaning changes with the audience.'],
      ['What the Tradition Can Support', 'The phoenix can be treated as a mythic and symbolic creature with a long written afterlife. It should not be reduced to one fixed zoological description. The details depend on the source tradition being followed.', 'The strongest account keeps the creature, fire or solar association, death, and return visible while allowing variants to remain distinct.'],
      ['Why the Phoenix Still Works', 'The phoenix may be read as a creature of hopeful contradiction. It is most alive in the moment after destruction. The story does not deny loss. It gives loss a form that can rise.', 'That is why the phoenix remains useful in art, literature, and everyday speech. It turns recovery into an image almost anyone can understand.']
    ],
    faq: [
      qa('What is a phoenix?', 'A phoenix is a mythic bird associated with long life, fire, death, and renewal.'),
      qa('Does every version say the phoenix rises from ashes?', 'No. The ash image is famous, but older and regional versions may describe renewal differently.'),
      qa('What does the phoenix symbolize?', 'It often symbolizes rebirth, resilience, immortality, renewal, and return after destruction.'),
      qa('Is the phoenix connected to the sun?', 'Many traditions and interpretations connect the phoenix with solar imagery and cycles of return.')
    ],
    sourceNote: 'This article follows the phoenix through classical, bestiary, and later symbolic traditions. The familiar ashes image is treated as one powerful version within a wider history of renewal motifs.'
  }),
  topic({
    categorySlug: 'lost-worlds',
    slug: 'shambhala-hidden-kingdom',
    title: 'Shambhala Hidden Kingdom: Sacred Geography, Prophecy, and the Lost World People Seek',
    subject: 'Shambhala',
    tag: 'Hidden Kingdom',
    tags: ['Hidden Kingdom', 'Shambhala', 'Sacred Geography', 'Lost World', 'Buddhist Tradition'],
    keyword: 'shambhala hidden kingdom',
    detail: 'the hidden kingdom associated with Buddhist tradition, sacred geography, prophecy, and later Western lost-world imagination',
    sourceBasis: 'Buddhist tradition summaries, sacred geography discussion, and later Western interpretations of Shambhala',
    evidence: 'religious studies summaries, cultural-history references, Kalachakra tradition discussion, and later lost-world retellings',
    vocabulary: ['Shambhala', 'hidden kingdom', 'Kalachakra', 'sacred geography', 'lost world'],
    urls: [
      source('Britannica - Shambhala', 'https://www.britannica.com/topic/Shambhala', 'Supports the hidden kingdom and Buddhist tradition context.'),
      source('Wikipedia - Shambhala', 'https://en.wikipedia.org/wiki/Shambhala', 'Supports common summaries, Kalachakra association, and later interpretations.'),
      source('Treasury of Lives - Shambhala context', 'https://treasuryoflives.org/', 'Supports Tibetan Buddhist historical and biographical context around related traditions.')
    ],
    quickAnswer: [
      'Shambhala is a hidden kingdom associated with Buddhist tradition, sacred geography, and prophecy. Later Western writing often transformed it into a lost-world or hidden-paradise idea.',
      'The subject matters because Shambhala is both place and symbol. It can be imagined as a kingdom beyond ordinary maps, but it also carries religious and interpretive meanings that should not be flattened into adventure fantasy.'
    ],
    intro: [
      'Shambhala is a place people search for, but it is not only a place.',
      'It belongs to sacred geography, prophecy, imagination, and the human habit of drawing hidden worlds just beyond the known map.'
    ],
    sections: [
      ['The Hidden Kingdom', 'Shambhala is often described as a hidden or sacred kingdom connected with Buddhist tradition, especially through Kalachakra associations. It is not simply a lost city waiting to be found by expedition. The name carries religious, symbolic, and geographic meanings at once.', 'That layered identity is why Shambhala has traveled so far. It can be treated as a realm of spiritual order, a prophetic kingdom, a hidden land, or a later lost-world fantasy depending on who is telling the story.'],
      ['How Later Versions Changed It', 'Different versions emphasize different parts of Shambhala. Buddhist contexts may focus on sacred teaching, kingship, and prophecy. Western esoteric and popular retellings often shift toward secret masters, hidden valleys, or an unreachable paradise.', 'Later retellings sometimes blur Shambhala with Shangri-La or other hidden-place legends. Those comparisons can be useful, but they should not erase the specific religious background of the name.'],
      ['What Can Be Said Carefully', 'The strongest account supports Shambhala as a known religious and cultural concept with a long interpretive history. It does not support treating every modern lost-world claim as if it came from the same source tradition.', 'A careful reading keeps sacred geography and adventure imagination separate. Both shaped the modern image, but they are not the same kind of evidence.'],
      ['Why Shambhala Still Calls to Readers', 'Shambhala may be read as a hidden-world story about order beyond disorder. It suggests that somewhere outside ordinary history, a preserved place still holds meaning, knowledge, or renewal.', 'That is why the idea remains powerful. It is not only the wish to find a lost kingdom. It is the wish that the world still contains a protected center.']
    ],
    faq: [
      qa('What is Shambhala?', 'Shambhala is a hidden or sacred kingdom associated with Buddhist tradition and later lost-world imagination.'),
      qa('Is Shambhala the same as Shangri-La?', 'No. Later popular culture sometimes connects them, but they come from different contexts.'),
      qa('Can Shambhala be placed on a normal map?', 'Traditions and interpretations differ, and Shambhala is often treated as sacred geography rather than ordinary geography.'),
      qa('Why is Shambhala important?', 'It combines hidden-place imagination with religious meaning, prophecy, and the idea of a protected center beyond ordinary history.')
    ],
    sourceNote: 'This article follows Shambhala through Buddhist tradition summaries and later lost-world reception. Religious context, sacred geography, and Western reinterpretation are kept separate so the name is not reduced to a simple adventure location.'
  }),
  topic({
    categorySlug: 'strange-nature',
    slug: 'marfa-lights-mystery',
    title: 'Marfa Lights Mystery: Desert Glow, Witness Reports, and the Strange Nature of West Texas',
    subject: 'Marfa Lights',
    tag: 'Light Phenomenon',
    tags: ['Light Phenomenon', 'Marfa Lights', 'Texas Mystery', 'Desert Lights', 'Optical Mystery'],
    keyword: 'marfa lights mystery',
    detail: 'the West Texas light phenomenon reported near Marfa, where distant glows appear in the desert and invite natural, optical, and folklore explanations',
    sourceBasis: 'Texas regional history, witness reports, optical explanations, and public discussion of the Marfa Lights',
    evidence: 'Texas history references, local accounts, scientific discussion, and travel writing about the light phenomenon',
    vocabulary: ['Marfa Lights', 'desert lights', 'West Texas', 'optical phenomenon', 'witness reports'],
    urls: [
      source('Texas State Historical Association - Marfa Lights', 'https://www.tshaonline.org/handbook/entries/marfa-lights', 'Supports regional history and public accounts of the lights.'),
      source('Wikipedia - Marfa lights', 'https://en.wikipedia.org/wiki/Marfa_lights', 'Supports common descriptions, explanations, and observation context.'),
      source('Texas Highways - Marfa Lights', 'https://texashighways.com/', 'Supports public travel and cultural context around the phenomenon.')
    ],
    quickAnswer: [
      'The Marfa Lights are mysterious lights reported in the desert near Marfa, Texas. Witnesses describe glowing points that appear, move, split, fade, or hover in the distance.',
      'The lights matter because they sit between observation and interpretation. Some explanations point to car headlights, atmospheric effects, or distance, while the local mystery remains part of the region.'
    ],
    intro: [
      'The Marfa Lights are not a creature or a ghost.',
      'They are points of light in a wide desert, seen from a distance, moving just enough to make the eye ask whether it is watching nature, traffic, weather, or something else.'
    ],
    sections: [
      ['The Lights in the Desert', 'The Marfa Lights are usually described as glowing orbs or points seen near Marfa in West Texas. They may appear white, yellow, orange, or red, and witnesses describe them as moving, merging, blinking, or fading. The open desert makes distance difficult to judge.', 'That uncertainty is part of the phenomenon. A light that seems close may be far away. A steady point may appear to move because of air, terrain, or the viewer. The desert gives small lights a large stage.'],
      ['How Explanations Differ', 'Different versions explain the lights through car headlights, temperature layers, atmospheric refraction, campfires, natural gas, or unknown causes. Some accounts preserve older local stories, while others focus on optical science and observation conditions.', 'Later retellings often make the lights more mysterious by removing ordinary context. Scientific explanations can account for many sightings, but the cultural mystery remains because people still go there to watch the horizon.'],
      ['What the Evidence Can Show', 'The strongest evidence supports a real observation tradition near Marfa and a range of plausible explanations for many reported lights. It does not require treating every sighting as one identical cause.', 'Careful readings separate the visible phenomenon from the stories attached to it. A light can be real, misidentified, explainable, and still folklorically important.'],
      ['Why the Lights Remain Memorable', 'The Marfa Lights may be read as a landscape mystery about distance. The desert creates space between the viewer and the thing seen. That space leaves room for wonder.', 'The mystery lasts because the lights do not need to resolve into one final answer for every witness. They only need to appear at the edge of certainty.']
    ],
    faq: [
      qa('Where are the Marfa Lights seen?', 'They are associated with the desert near Marfa in West Texas.'),
      qa('Are the Marfa Lights explained?', 'Many sightings may be explained by headlights or optical effects, but individual reports vary.'),
      qa('Why are they considered strange nature?', 'They are a repeated visual phenomenon tied to landscape, atmosphere, distance, and local interpretation.'),
      qa('Do the Marfa Lights belong to folklore too?', 'Yes. Even when natural explanations are considered, the lights have become part of regional mystery and storytelling.')
    ],
    sourceNote: 'This article follows the Marfa Lights as a reported West Texas light phenomenon and regional mystery. Natural and optical explanations are included without treating every individual sighting as identical.'
  }),
  topic({
    categorySlug: 'legendary-places',
    slug: 'mount-olympus-greek-myth',
    title: 'Mount Olympus in Greek Myth: Home of the Gods and the Place Above the Human World',
    subject: 'Mount Olympus',
    tag: 'Sacred Mountain',
    tags: ['Sacred Mountain', 'Mount Olympus', 'Greek Myth', 'Home of the Gods', 'Legendary Place'],
    keyword: 'mount olympus greek myth',
    detail: 'the Greek mythic mountain associated with the Olympian gods, divine assembly, and the imagined space above ordinary human life',
    sourceBasis: 'Greek mythology summaries, classical geography, and later cultural memory of Olympus as divine residence',
    evidence: 'classical myth references, Greek geography, mythology summaries, and later literary and artistic tradition',
    vocabulary: ['Mount Olympus', 'Olympian gods', 'Zeus', 'sacred mountain', 'Greek myth'],
    urls: [
      source('Britannica - Mount Olympus', 'https://www.britannica.com/place/Mount-Olympus-mountain-Greece', 'Supports the real mountain and Greek mythic association.'),
      source('Theoi - Olympos', 'https://www.theoi.com/Protogenos/Olympos.html', 'Supports classical myth references to Olympus.'),
      source('World History Encyclopedia - Mount Olympus', 'https://www.worldhistory.org/Mount_Olympus/', 'Supports mythology and cultural context.')
    ],
    quickAnswer: [
      'Mount Olympus is both a real mountain in Greece and the mythic home of the Olympian gods. In Greek tradition, it becomes the place above human affairs where divine power gathers.',
      'The mountain matters because it turns geography into hierarchy. Humans live below, gods dwell above, and the distance between them becomes visible.'
    ],
    intro: [
      'Mount Olympus is a real mountain, but myth made it more than stone.',
      'It became the high place where gods gather, judge, feast, argue, and look down toward the human world.'
    ],
    sections: [
      ['The Mountain and the Gods', 'In Greek myth, Mount Olympus is associated with Zeus and the Olympian gods. It functions as a divine residence, council space, and symbolic height above mortal life. The mountain gives the gods a location without making them ordinary neighbors.', 'Because Olympus is also a real place, the myth joins geography and imagination. A visible mountain becomes the image of invisible order.'],
      ['How Olympus Is Used in Stories', 'Different myths use Olympus as a place of assembly, command, conflict, or distance. Gods leave it to intervene in human affairs, then return to the space above. Later retellings often make Olympus grand, shining, remote, and politically alive.', 'Versions differ in how physically the mountain is imagined. Sometimes it feels like a real summit. Sometimes it becomes a heavenly court. The shift itself shows how legendary places move between map and symbol.'],
      ['What the Evidence Can and Cannot Show', 'The strongest account supports Olympus as both a Greek mountain and a central mythic location in the imagination of the Olympian gods. It should not be treated as one simple palace with a single fixed layout.', 'Classical sources, geography, and later art all shaped the image. Each layer adds meaning, but not every later detail belongs equally to early myth.'],
      ['Why Olympus Still Feels Important', 'Mount Olympus may be read as a story about distance between human and divine order. The mountain is close enough to name, but high enough to feel unreachable.', 'That is why it remains one of the strongest legendary places in mythology. It gives divine power a silhouette against the sky.']
    ],
    faq: [
      qa('Is Mount Olympus a real place?', 'Yes. Mount Olympus is a real mountain in Greece, and it is also a major mythic location.'),
      qa('Who lived on Olympus in Greek myth?', 'The Olympian gods, especially Zeus and the major Greek deities, are associated with Olympus.'),
      qa('Was Olympus imagined as a normal mountain?', 'It could be connected to real geography, but myth also presents it as a divine realm above ordinary life.'),
      qa('Why is Olympus important?', 'It gives Greek divine power a visible place and separates the world of gods from the world of mortals.')
    ],
    sourceNote: 'This article follows Mount Olympus as both real Greek geography and legendary divine residence. The page keeps the physical mountain, mythic setting, and later artistic image distinct.'
  }),
  topic({
    categorySlug: 'mythic-objects',
    slug: 'mjolnir-thors-hammer',
    title: 'Mjolnir: Thor\'s Hammer, Protection Symbol, and the Mythic Object That Returns',
    subject: 'Mjolnir',
    tag: 'Mythic Weapon',
    tags: ['Mythic Weapon', 'Mjolnir', 'Thor', 'Norse Myth', 'Protection Symbol'],
    keyword: 'mjolnir thors hammer',
    detail: 'Thor\'s hammer in Norse myth, a returning weapon associated with thunder, protection, divine power, and later symbolic use',
    sourceBasis: 'Norse mythology summaries, Eddic and skaldic tradition, archaeological symbol discussion, and later reception',
    evidence: 'Norse myth references, mythology summaries, hammer amulet context, and later symbolic interpretation',
    vocabulary: ['Mjolnir', 'Thor', 'hammer', 'thunder', 'protection'],
    urls: [
      source('Britannica - Thor', 'https://www.britannica.com/topic/Thor-Germanic-deity', 'Supports Thor, thunder, and hammer association.'),
      source('Theoi equivalent not applicable - Wikipedia Mjolnir', 'https://en.wikipedia.org/wiki/Mj%C3%B6lnir', 'Supports common Mjolnir summaries, sources, and amulet context.'),
      source('World History Encyclopedia - Mjolnir', 'https://www.worldhistory.org/Mjolnir/', 'Supports Norse mythic and symbolic context.')
    ],
    quickAnswer: [
      'Mjolnir is Thor\'s hammer in Norse myth, a powerful weapon associated with thunder, protection, consecration, and divine force. It is famous for being hurled and returning.',
      'The hammer matters because it is both weapon and symbol. It destroys threats, protects communities, blesses important acts, and later becomes one of the most recognizable Norse mythic objects.'
    ],
    intro: [
      'Mjolnir is not just something Thor carries.',
      'It is the object that makes thunder visible, turns protection into a weapon, and gives divine power a shape that can be worn, carved, thrown, or invoked.'
    ],
    sections: [
      ['The Hammer in Norse Myth', 'Mjolnir is most closely associated with Thor, the thunder god. In myth, it is a devastating weapon against giants and enemies of divine order. It is also connected with protection and consecration, which gives the object more than one role.', 'The hammer can be thrown and return, making it feel active rather than passive. It is not simply stored treasure. It moves, strikes, comes back, and marks Thor presence in the story.'],
      ['How the Object Carries Meaning', 'Different sources and later retellings emphasize different sides of Mjolnir. Some focus on battle. Others focus on blessing, marriage, protection, or the hammer as a sign of identity. Archaeological hammer pendants show that the symbol also had a life beyond story scenes.', 'Modern retellings often simplify Mjolnir into a superhero weapon, but the older object is broader. It belongs to thunder, defense, sacred force, and social meaning.'],
      ['What the Evidence Can and Cannot Show', 'The strongest account supports Mjolnir as a major Norse mythic object tied to Thor and preserved through literary sources and material symbols. It does not require treating every modern power rule as part of early tradition.', 'A careful reading separates medieval textual references, archaeological hammer symbols, and modern adaptations. All three matter, but they do not speak in the same way.'],
      ['Why Mjolnir Still Works', 'Mjolnir may be read as a mythic object that makes protection physical. It gives a god a tool, a community a sign, and a story a decisive sound.', 'That is why the hammer remains powerful in cultural memory. It is simple to picture, but dense with meaning: thunder in the hand.']
    ],
    faq: [
      qa('What is Mjolnir?', 'Mjolnir is Thor\'s hammer in Norse myth, associated with thunder, protection, and divine force.'),
      qa('Does Mjolnir return after being thrown?', 'Many popular summaries describe the hammer as a weapon that returns to Thor.'),
      qa('Was Mjolnir only a weapon?', 'No. It is also connected with protection, consecration, and symbolic identity.'),
      qa('Why are hammer pendants important?', 'They show that the hammer symbol had meaning beyond narrative scenes, including protection and cultural identity.')
    ],
    sourceNote: 'This article follows Mjolnir through Norse myth summaries, Thor traditions, and hammer-symbol reception. Modern adaptations are treated separately from older literary and material evidence.'
  }),
  topic({
    categorySlug: 'legend-origins',
    slug: 'jack-o-lantern-stingy-jack-origin',
    title: 'Jack-o-Lantern Origin: Stingy Jack, Turnips, and the Halloween Light',
    subject: 'Jack-o-Lantern',
    tag: 'Halloween Origin',
    tags: ['Halloween Origin', 'Jack-o-Lantern', 'Stingy Jack', 'Halloween Folklore', 'Lantern Custom'],
    keyword: 'jack o lantern origin stingy jack',
    detail: 'the Halloween lantern tradition often explained through the Irish Stingy Jack story, carved turnips, and later pumpkin customs',
    sourceBasis: 'Halloween folklore summaries, Irish and British lantern customs, and public-history discussion of Stingy Jack',
    evidence: 'folklore summaries, public-history writing, Halloween custom discussion, and migration of turnip carving into pumpkin carving',
    vocabulary: ['Jack-o-Lantern', 'Stingy Jack', 'turnip lantern', 'Halloween', 'pumpkin carving'],
    urls: [
      source('History - History of the Jack-o-Lantern', 'https://www.history.com/articles/history-of-the-jack-o-lantern-irish-origins', 'Supports Stingy Jack, turnip carving, and pumpkin adaptation.'),
      source('Library of Congress - Halloween and Jack-o-Lantern context', 'https://blogs.loc.gov/folklife/', 'Supports folklore and public-history context for Halloween customs.'),
      source('Wikipedia - Jack-o-lantern', 'https://en.wikipedia.org/wiki/Jack-o%27-lantern', 'Supports common custom history, names, and variants.')
    ],
    quickAnswer: [
      'The Jack-o-Lantern is a Halloween lantern custom often linked to the Irish story of Stingy Jack. Older versions involve carved turnips or root vegetables before pumpkins became the familiar North American form.',
      'The origin matters because the object changed while the idea stayed recognizable. A carved light at the threshold became a way to mark Halloween, ward off danger, and remember a wandering figure.'
    ],
    intro: [
      'A Jack-o-Lantern looks playful now, but its older story is not only decoration.',
      'It begins with a wandering figure, a small trapped light, and the old idea that a lantern can guard a doorway on a dangerous night.'
    ],
    sections: [
      ['The Stingy Jack Story', 'The best-known origin story tells of Stingy Jack, a trickster figure who bargains with the Devil and is eventually left unable to enter heaven or hell. He wanders with only a small light to guide him. Later summaries connect that wandering light with the carved lantern custom.', 'The story gives the lantern a face and a reason. The carved object is not only a seasonal decoration. It becomes a sign of a restless figure moving between worlds.'],
      ['From Turnips to Pumpkins', 'Different versions of the custom involve carved turnips, beets, or other root vegetables in Ireland and Britain. In North America, pumpkins became the dominant lantern because they were larger, easier to carve, and strongly tied to autumn harvest imagery.', 'Later retellings often make the pumpkin seem original, but the older custom is broader. The change from turnip to pumpkin shows how a tradition can migrate and adapt while keeping its central function.'],
      ['What the Origin Can Support', 'The Jack-o-Lantern origin can be responsibly described through folklore, seasonal custom, and migration history. The Stingy Jack story helps explain the name and atmosphere, but not every carved lantern descends from one exact version.', 'Some versions emphasize warding off spirits. Others emphasize mischief, harvest, or Halloween display. Those meanings can overlap without needing a single fixed origin.'],
      ['Why the Lantern Still Works', 'The Jack-o-Lantern may be read as a threshold object. It sits outside a house, faces the dark, and turns fear into something shaped by human hands.', 'That is why the custom remains strong. The lantern is funny and eerie at the same time. It lets Halloween be both welcome and warning.']
    ],
    faq: [
      qa('Who is Stingy Jack?', 'Stingy Jack is a folklore figure often used to explain the wandering light behind Jack-o-Lantern tradition.'),
      qa('Were Jack-o-Lanterns always pumpkins?', 'No. Older customs often used turnips or other root vegetables before pumpkins became common in North America.'),
      qa('Why are Jack-o-Lanterns linked to Halloween?', 'They fit Halloween themes of thresholds, spirits, darkness, mischief, and protective light.'),
      qa('Is there one exact origin of the Jack-o-Lantern?', 'No single version explains everything. The custom combines folklore, seasonal practice, migration, and later popular Halloween tradition.')
    ],
    sourceNote: 'This article follows the Jack-o-Lantern through Stingy Jack folklore, older turnip-lantern customs, and later pumpkin carving. The page treats origin stories as layered explanations rather than one perfectly fixed beginning.'
  })
];

const additions = [];
const updates = [];

for (const plan of topics) {
  const category = categoryBySlug.get(plan.categorySlug);
  if (!category) throw new Error(`Unknown category: ${plan.categorySlug}`);
  const existingIndex = stories.findIndex((story) => story.slug === plan.slug);
  if (existingIndex >= 0) {
    const existingStory = stories[existingIndex];
    [
      existingStory.contentDNA?.canonicalQuery,
      existingStory.primaryKeyword,
      existingStory.seedKeyword,
      plan.keyword
    ].filter(Boolean).forEach((query) => existingQueries.delete(canonicalizeQuery(query)));
  }
  const story = buildStory(plan, category);
  story.contentDNA = buildContentDNA(story, existingQueries);
  storySlugs.add(story.slug);
  if (story.contentDNA?.canonicalQuery) existingQueries.add(story.contentDNA.canonicalQuery.toLowerCase().trim());
  if (existingIndex >= 0) {
    stories[existingIndex] = story;
    updates.push(story);
  } else {
    additions.push(story);
  }
}

stories.unshift(...additions);
writeJson(storiesPath, stories);
console.log(`Added ${additions.length} and updated ${updates.length} existing-story archive articles across ${new Set([...additions, ...updates].map((item) => item.categorySlug)).size} categories.`);
for (const story of additions) {
  console.log(`${story.categorySlug}: ${story.slug}`);
}
for (const story of updates) {
  console.log(`updated ${story.categorySlug}: ${story.slug}`);
}

function buildStory(plan, category) {
  const articleSections = expandedSectionsFor(plan);
  const dek = dekForPlan(plan);
  const relatedKeywords = unique([
    `${plan.keyword} origin`,
    `${plan.keyword} meaning`,
    `${plan.tag.toLowerCase()} folklore`,
    `${category.title.toLowerCase()} explained`
  ]);
  const readTime = category.slug === 'internet-folklore' || category.slug === 'unexplained-mysteries' ? '9 min read' : '8 min read';
  return {
    id: plan.slug,
    slug: plan.slug,
    title: plan.title,
    displayTitle: plan.title,
    h1: plan.title,
    seoTitle: plan.title,
    metaTitle: plan.title,
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
    topicScore: 93,
    topicStatus: 'approved',
    scoreBreakdown: {
      searchDemand: 30,
      clickCuriosity: 24,
      siteFit: 23,
      expansionPotential: 10,
      sourceSafety: 6
    },
    summaryAnswer: plan.quickAnswer.join(' '),
    readTime,
    storyType: storyTypeFor(category.slug),
    generationBatch: 'existing-one-each-20260719',
    contentStandard: 'unified',
    editorialStatus: 'approved',
    legacyContent: false,
    substantiveRevisionAt: publishedAt,
    internalLinkEligible: true,
    sourceStatus: sourceStatusFor(category, plan.tag),
    publicSourceBasis: plan.sourceBasis,
    excerpt: plan.quickAnswer[0],
    introSummary: dek,
    publishedAt,
    updatedAt: publishedAt,
    relatedStoryIds: relatedSlugsFor(plan.slug),
    relatedStorySlugs: relatedSlugsFor(plan.slug),
    tags: plan.tags,
    detail: compactDetail(plan.detail),
    evidence: plan.evidence,
    researchSources: plan.urls,
    sourceNotes: {
      sharedVerifiedPoints: [
        `${plan.subject} is a pre-existing subject in folklore, myth, legend, mystery, or public cultural memory.`,
        `The article can responsibly describe ${plan.detail}.`,
        `The strongest reading stays within ${plan.evidence}.`
      ],
      variants: [
        'Specific details shift by source, region, retelling, publication history, or community memory.',
        'Later popular versions often make the story cleaner than the source trail allows.'
      ],
      unsupportedClaimsToAvoid: [
        'Avoid presenting supernatural, speculative, or uncertain claims as verified fact.',
        'Avoid inventing witnesses, documents, dates, discoveries, or endings beyond the known tradition.',
        'Avoid implying a single definitive origin when the tradition contains variants or source limits.'
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
        articleSections[0][1],
        articleSections[0][2]
      ],
      reportedVariants: [
        { claim: articleSections[Math.min(2, articleSections.length - 1)][1], scope: 'variant tradition' },
        { claim: articleSections[Math.min(3, articleSections.length - 1)][1], scope: 'later retellings and emphasis' }
      ],
      editorialInterpretationOptions: [
        articleSections[articleSections.length - 1][1],
        articleSections[articleSections.length - 1][2]
      ],
      uncertainDetails: [
        'The exact earliest form may be disputed, incomplete, or preserved through later retellings.',
        'Later versions may simplify, relocate, intensify, or reinterpret the story.'
      ],
      prohibitedInventions: [
        'Do not add a hidden witness or newly discovered document.',
        'Do not turn folklore, myth, or speculation into confirmed fact.',
        'Do not invent modern evidence that is not in the source trail.'
      ],
      existenceEvidence: plan.urls
    },
    seoHeadings: articleSections.map((item) => item[0]),
    publicArticlePlan: {
      title: plan.title,
      dek,
      quickAnswer: {
        paragraphs: plan.quickAnswer,
        targetWords: { min: 90, max: 180 }
      },
      introduction: plan.intro,
      sections: articleSections.map((item, index) => ({
        heading: item[0],
        purpose: sectionPurpose(index),
        contentLayer: index < 2 ? 'existing-story' : index === 2 ? 'reported-variant' : 'variant-and-interpretation',
        targetWords: { min: 210, max: 390 },
        paragraphs: item.slice(1)
      })),
      conclusion: {
        paragraphs: [
          `${plan.subject} may be read as more than a strange image or famous name. It gives a lasting shape to a fear, hope, warning, or question that people still recognize.`,
          `Different versions should stay visible without being treated as equal proof. The story works best when its strongest details remain clear and uncertain claims stay in their proper place.`
        ],
        targetWords: { min: 80, max: 150 }
      },
      faq: plan.faq,
      publicSourceNote: `${plan.sourceNote} ${plan.subject} may be read through the pattern preserved in its common versions, while later versions should remain separate from the core account.`
    }
  };
}

function topic(value) {
  return value;
}

function dekForPlan(plan) {
  return {
    'vanishing-hitchhiker-urban-legend': 'The vanishing hitchhiker is a roadside legend about a passenger who accepts a ride, disappears from the vehicle, and is later connected to an earlier death or local tragedy. Its details change by region, but the sudden absence and delayed discovery remain central to the story.',
    'polybius-arcade-game-legend': 'Polybius is a gaming legend about a mysterious arcade cabinet said to have appeared around Portland in the early 1980s. Players were allegedly affected by strange symptoms, while unidentified officials were rumored to collect data from the machines before they disappeared.',
    'bennington-triangle-legend': 'The Bennington Triangle is a later name applied to disappearances and unsettling stories associated with southwestern Vermont, especially the area around Glastenbury Mountain. The cases differ from one another, but their shared landscape helped turn them into a single regional mystery.',
    'oak-island-money-pit': 'The Oak Island Money Pit is a Nova Scotia treasure mystery built around a deep shaft, disputed clues, flooding, and generations of excavation. The question is not only whether treasure was buried there, but why each failed search made the story harder to leave behind.',
    'wild-hunt-folklore': 'The Wild Hunt is a European folklore motif about a supernatural host crossing the night sky with riders, hounds, horns, or the dead. Its leaders and meanings change by region, but the sound of a passing procession remains the image that makes the legend endure.',
    'men-in-black-legend': 'The Men in Black legend gives UFO secrecy a human shape: dark-suited visitors who arrive after a sighting, ask questions, and warn witnesses into silence. The figures feel official and unreal at once, which is why they became one of modern folklore\'s strongest images of hidden authority.',
    'prometheus-fire-myth': 'Prometheus is remembered in Greek myth as the Titan who defied Zeus and brought fire to humanity. His gift became a symbol of knowledge and civilization, while his punishment expressed the danger of challenging divine authority.',
    'phoenix-mythic-bird': 'The phoenix is a mythic bird associated with fire, long life, death, and renewal. Ancient and medieval versions do not all describe its return in the same way, but the image of a creature remade through flame became one of the clearest symbols of rebirth.',
    'shambhala-hidden-kingdom': 'In Buddhist tradition and later esoteric imagination, Shambhala is not simply a lost city waiting to be found. It sits between sacred geography, preserved teaching, prophecy, and the human desire to imagine a refuge beyond ordinary maps.',
    'marfa-lights-mystery': 'The Marfa Lights are distant glows reported in the desert near Marfa, Texas, where witnesses describe points of light that move, split, fade, or hover. Many sightings invite natural explanations, but the open landscape keeps the mystery alive at the edge of visibility.',
    'mount-olympus-greek-myth': 'For Greek myth, Olympus gives divine power a visible height. The real mountain becomes a legendary setting where geography, hierarchy, feast, conflict, and the distance between gods and humans can all be imagined in one place.',
    'mjolnir-thors-hammer': 'Mjolnir is Thor\'s hammer in Norse mythology, known both as a weapon against giants and as a protective object connected with blessing, consecration, and divine order.',
    'jack-o-lantern-stingy-jack-origin': 'The Jack-o-Lantern tradition is often explained through the Irish story of Stingy Jack, a doomed wanderer carrying a small light. Older turnip lantern customs later changed into the pumpkin faces now associated with Halloween.'
  }[plan.slug] || plan.intro?.join(' ') || plan.quickAnswer[0];
}

function expandedSectionsFor(plan) {
  return expandedSectionMap()[plan.slug] || plan.sections;
}

function relatedSlugsFor(slug) {
  return {
    'vanishing-hitchhiker-urban-legend': [
      'kidney-theft-urban-legend',
      'woman-in-white-roadside-legend',
      'last-train-passenger-who-never-gets-off',
      'killer-in-the-backseat-legend',
      'hookman-urban-legend',
      'black-eyed-children-doorway-legend'
    ],
    'polybius-arcade-game-legend': [
      'cicada-3301-internet-puzzle',
      'candle-cove-creepypasta-origin',
      'herobrine-minecraft-legend',
      'backrooms-digital-labyrinth',
      'cursed-image-that-kept-being-shared',
      'empty-server-room-online-myth'
    ],
    'bennington-triangle-legend': [
      'hoia-baciu-forest',
      'winchester-mystery-house',
      'island-of-the-dolls-xochimilco',
      'catacombs-of-paris-legends',
      'crooked-forest-poland',
      'hotel-room-that-is-never-assigned'
    ],
    'oak-island-money-pit': [
      'db-cooper-hijacking-mystery',
      'mary-celeste-mystery',
      'voynich-manuscript-mystery',
      'bermuda-triangle-mystery',
      'tunguska-event',
      'wow-signal-mystery'
    ],
    'wild-hunt-folklore': [
      'pied-piper-of-hamelin-folklore',
      'banshee-irish-folklore',
      'baba-yaga-folklore',
      'la-llorona-folklore',
      'will-o-the-wisp-folklore',
      'changeling-folklore'
    ],
    'men-in-black-legend': [
      'flatwoods-monster-legend',
      'area-51-legend',
      'bigfoot-legend',
      'chupacabra-legend',
      'loch-ness-monster-legend',
      'jersey-devil-legend'
    ],
    'prometheus-fire-myth': [
      'mount-olympus-greek-myth',
      'icarus-myth',
      'theseus-and-the-minotaur-myth',
      'medusa-and-perseus-myth',
      'pandoras-box-myth',
      'narcissus-and-echo-myth'
    ],
    'phoenix-mythic-bird': [
      'dragons-across-the-world',
      'thunderbird-folklore',
      'yeti-folklore',
      'kraken-beneath-the-calm-sea',
      'kappa-japanese-folklore',
      'kitsune-fox-folklore'
    ],
    'shambhala-hidden-kingdom': [
      'mu-lost-continent-legend',
      'atlantis-lost-world',
      'lemuria-lost-continent',
      'hy-brasil-island-on-the-map',
      'el-dorado-legend',
      'avalon-legend'
    ],
    'marfa-lights-mystery': [
      'hessdalen-lights',
      'ball-lightning-folklore',
      'tunguska-event',
      'flatwoods-monster-legend',
      'bermuda-triangle-mystery',
      'wow-signal-mystery'
    ],
    'mount-olympus-greek-myth': [
      'prometheus-fire-myth',
      'icarus-myth',
      'medusa-and-perseus-myth',
      'theseus-and-the-minotaur-myth',
      'narcissus-and-echo-myth',
      'pandoras-box-myth'
    ],
    'mjolnir-thors-hammer': [
      'spear-of-destiny-holy-lance',
      'excalibur-sword-legend',
      'holy-grail-legend',
      'aegis-mythic-shield',
      'bell-under-the-lake-folklore',
      'key-that-fits-every-door-except-its-own'
    ],
    'jack-o-lantern-stingy-jack-origin': [
      'friday-the-13th-origin',
      'how-a-warning-becomes-a-legend',
      'why-crossroads-become-folklore-thresholds',
      'why-doorways-make-better-warnings-than-rooms',
      'how-cursed-images-became-internet-folklore',
      'why-mirrors-become-haunted-objects'
    ]
  }[slug] || [];
}

function expandedSectionMap() {
  return {
    'vanishing-hitchhiker-urban-legend': [
      ['The Passenger Who Disappears', 'The story usually begins with a driver finding a lone passenger near a road, bridge, cemetery, or town edge. The person asks for a ride and gives a destination that seems ordinary enough to trust.', 'The ride itself is quiet. Nothing has to happen immediately. The legend depends on the moment when the passenger is suddenly gone, leaving the driver with a seat, a coat, an address, or a silence that does not make sense.'],
      ['The Address, Family, or Grave Revealed Later', 'Many versions delay the explanation until the driver reaches the address. A family member may say the passenger died years earlier, or the driver may find the borrowed coat resting on a grave.', 'That delayed discovery is the hinge of the legend. The ghost is not proven by a scream or apparition, but by an ordinary follow-up that turns the ride into contact with the dead.'],
      ['Regional Versions of the Legend', 'Different regions change the passenger, the road, and the reason for the journey. Some versions use a prom night, some a wartime road, and some a local accident remembered by a nearby community.', 'Later retellings often attach the story to a road the audience can name. The familiar pattern becomes stronger when listeners feel they could drive past the same place.'],
      ['Roads, Cars, and the Modern Ghost Story', 'The legend works especially well in cars because a vehicle creates a small private space between strangers. It also moves through darkness quickly, passing from one place to another before the driver has time to understand the encounter.', 'A road is a threshold rather than a home. That makes it believable that the past could appear briefly, ride along, and disappear before arrival.'],
      ['Why the Story Is Often Linked to a Past Death', 'The vanished passenger may be read as a sign of unfinished travel, grief, or local memory. The ghost needs to be carried somewhere, but the destination is often emotional as much as physical.', 'That is why the story remains flexible. The details can change, but the heart of the legend stays with a stranger who belongs to an earlier loss and briefly enters the present.']
    ],
    'polybius-arcade-game-legend': [
      ['The Arcade Cabinet in the Rumor', 'The Polybius legend centers on a rare arcade cabinet supposedly placed in the Portland area during the early 1980s. The cabinet is said to have looked like a real commercial machine, which gives the story its strongest hook.', 'An arcade game should leave traces: repair notes, flyers, operator records, photographs, boards, or players who remember it clearly. Polybius is powerful because those traces remain missing or uncertain.'],
      ['Portland and the Early-1980s Setting', 'The setting matters because arcades in the early 1980s were crowded with new machines, bright screens, competitive players, and rumors about what games could do to the body and mind.', 'Polybius uses that atmosphere well. A strange cabinet can feel almost plausible when placed among real concerns about flashing visuals, addiction, technology, and youth culture.'],
      ['Illness, Memory Loss, and Government Visitors', 'Later versions claim that players suffered headaches, nightmares, memory problems, or stranger psychological effects. Some accounts add dark-suited visitors or officials who collected data from the machines.', 'Those details turn a lost game into a secrecy story. The cabinet becomes less important as entertainment and more important as a possible experiment no one can prove.'],
      ['How the Legend Emerged Online', 'Polybius became famous through online discussion, game-history curiosity, and the search for missing media. Forum posts and retellings helped turn a thin rumor into a recognizable internet legend.', 'The internet gave the story a perfect home. People could compare fragments, question details, build reconstructions, and keep looking for a machine that might never have existed.'],
      ['Games and Reconstructions Made After the Legend', 'Modern games, videos, and references using the Polybius name show how the legend continued after the rumor itself became famous. These later works are evidence of influence, not proof of an original cabinet.', 'The distinction matters. A recreation can preserve the atmosphere of the legend while also making the source trail more confusing for later readers.'],
      ['What Is Missing from the Historical Record', 'No verified original cabinet, board, operator record, or stable contemporary documentation has closed the case. The absence is not just a gap; it is the engine of the legend.', 'Polybius can be documented as folklore and gaming rumor. It cannot responsibly be presented as a confirmed arcade release without evidence that has not yet appeared.'],
      ['Why Polybius Became a Model Internet Mystery', 'Polybius became a model internet mystery because it offers a physical object that feels searchable. It is close enough to real arcade history to invite investigation and strange enough to resist closure.', 'That balance lets the legend survive. It is not only a missing game. It is a story about how digital communities turn absence into a hunt.']
    ],
    'bennington-triangle-legend': [
      ['How the Name Bennington Triangle Was Created', 'The Bennington Triangle is a later label applied to several disappearances and strange stories in southwestern Vermont. Like other triangle names, it turns separate events into a single region of mystery.', 'The name is useful, but it is also interpretive. It draws a shape over cases that did not originally begin as one unified story.'],
      ['The Landscape Around Glastenbury Mountain', 'Glastenbury Mountain and the surrounding area give the legend its atmosphere. Dense woods, old roads, abandoned settlements, and rough terrain make the place feel remote even when it can be located on a map.', 'The landscape does not explain every story by itself, but it helps readers understand why disappearances there can be retold as part of one unsettling place.'],
      ['The Disappearance of Middie Rivers', 'Middie Rivers is often named among the cases associated with the region. His disappearance is important because it involves someone familiar with the terrain, which makes the story harder for later retellings to dismiss as simple inexperience.', 'Accounts differ in emphasis, but the case helps establish the triangle as more than a vague haunted-place label. It gives the landscape a specific missing-person memory.'],
      ['Paula Welden and the Long Trail', 'Paula Welden\'s disappearance is one of the best-known stories linked with the Bennington Triangle. Her walk near the Long Trail became central to the region mystery because the search did not produce a final answer.', 'The case shaped public memory around the area. A named person, a known route, and an unresolved ending are exactly the elements that make a place legend hold.'],
      ['Later Disappearances Grouped with the Triangle', 'Later summaries often group additional disappearances and unsettling accounts with the triangle. Not every case has the same evidence, setting, or source quality, so the grouping needs to be treated carefully.', 'The legend grows when stories are arranged together. That does not mean one cause connects all of them, but it does show how regional mystery is built.'],
      ['What Connects the Cases and What Does Not', 'The cases share a regional landscape and a pattern of unresolved absence. They do not automatically share one explanation. Terrain, weather, reporting gaps, and later retellings all shape the record.', 'This distinction keeps the mystery honest. The place can matter without becoming proof of a single hidden force.'],
      ['How Separate Cases Became One Regional Legend', 'The Bennington Triangle may be read as a place legend about accumulated uncertainty. Each case adds weight to the region, and the region then changes how later readers understand each case.', 'That circular motion is why the label lasts. The mountain becomes a container for stories that would feel smaller on their own.']
    ],
    'oak-island-money-pit': [
      ['The Discovery Story of the Money Pit', 'The Oak Island mystery begins with the story of a depression in the ground and early digging that suggested something might have been hidden below. That first possibility gave the island its central question.', 'The discovery story matters because treasure legends need an opening sign. A mark in the ground, a strange layer, or a rumor of buried wealth is enough to start a search that later becomes much larger.'],
      ['Platforms, Flooding, and Early Excavations', 'Early excavation accounts describe wooden platforms, deep shafts, and flooding that made the pit difficult to explore. Whether every detail is interpreted correctly remains debated, but the pattern gave the site a sense of deliberate design.', 'Flooding is especially important in the legend. It turns the search into a contest between treasure hunters and a hidden mechanism that seems to defend the secret.'],
      ['The Inscribed Stone and Other Disputed Finds', 'Some Oak Island accounts include an inscribed stone and other reported objects that have been used to support treasure theories. These finds are disputed, and their documentation is not equally strong.', 'The disputed nature of these clues is part of the story. Each object promises meaning, but the meaning often depends on later interpretation.'],
      ['Coconut Fiber and the Flood-Tunnel Theory', 'Coconut fiber and flood-tunnel theories became important because they suggested engineering rather than accidental geology. If true, they would imply planning and a serious attempt to protect something underground.', 'At the same time, each claim requires caution. Natural processes, earlier work, incomplete records, and later enthusiasm can all affect how material evidence is read.'],
      ['Major Treasure Theories', 'Theories about Oak Island have named pirates, Spanish treasure, religious relics, manuscripts, and other hidden deposits. These theories are not equally supported, but they show how the island became a magnet for imagined treasure histories.', 'Theories keep changing because the evidence has never been decisive enough to close the story. A gap remains, and each generation fills it differently.'],
      ['What Excavations Have Actually Recovered', 'Excavations have produced material, structures, and observations that keep interest alive, but no confirmed treasure has solved the mystery in a final way. The search record is real even when the treasure claim remains unresolved.', 'That distinction is the safest way to read Oak Island. The island has a documented history of searching, but the meaning of many finds remains contested.'],
      ['Why the Search Continues', 'Oak Island continues because each attempt becomes part of the legend instead of ending it. Failed digs, flooded shafts, new surveys, and disputed finds all add chapters to the same unfinished search.', 'The Money Pit is therefore both a possible treasure site and a story about persistence. The search itself has become the artifact people keep returning to.']
    ],
    'wild-hunt-folklore': [
      ['The Host Crossing the Night Sky', 'The Wild Hunt is often imagined as a supernatural host moving through night, storm, or winter sky. Listeners may hear horns, hounds, hoofbeats, cries, or the rush of a procession passing overhead.', 'The power of the image is movement. The hunt does not settle in one place. It crosses human space and reminds listeners that the wild, the dead, or the divine can pass nearby.'],
      ['Odin, Wodan, and Other Leaders of the Hunt', 'Different regions give the hunt different leaders. Odin or Wodan appears in some Germanic and Norse-linked interpretations, while other traditions name Herne, spectral nobles, fairies, or local dead.', 'The changing leader shows that the motif is flexible. Communities could attach the hunt to the figure that made the most sense in their own landscape.'],
      ['Regional European Versions', 'The Wild Hunt appears in many European traditions with changes in season, leader, danger, and moral meaning. Some versions emphasize the dead, while others focus on hunters, hounds, cursed riders, or supernatural armies.', 'These differences do not weaken the motif. They show how a strong sound-and-sky image can travel while taking local names.'],
      ['Omens of War, Death, and Winter', 'The hunt is often treated as an omen. Seeing or hearing it may warn of death, war, disaster, or a dangerous season. In winter settings, the sky itself can seem to carry threat.', 'An omen does not need to explain itself fully. It only needs to make ordinary weather feel like a message.'],
      ['Sounds, Storms, and Processions in the Sky', 'Storm wind, animal noise, and night travel help explain why the Wild Hunt feels so vivid. A loud sky can become a passing host when folklore gives the sound a shape.', 'The legend turns atmosphere into narrative. What might be heard as weather becomes riders, dogs, horns, and pursuit.'],
      ['How Later Fantasy Changed the Wild Hunt', 'Modern fantasy often turns the Wild Hunt into a formal army, fairy procession, or named supernatural force. These versions keep the image alive, but they may simplify the older regional variety.', 'The older folklore is less fixed and more atmospheric. Its strength lies in the feeling that something vast has passed overhead.']
    ],
    'men-in-black-legend': [
      ['The Visitors Who Arrive After a UFO Report', 'The Men in Black legend usually begins after a witness reports or discusses a UFO sighting. Soon afterward, dark-suited visitors appear, ask questions, and seem to know more than they should.', 'Their timing is important. They arrive after the strange event, when the witness is trying to decide whether the sighting was real, mistaken, or dangerous to discuss.'],
      ['Clothing, Speech, and Unusual Behavior', 'The visitors are often described as wearing dark suits and speaking with formal, stiff, or oddly controlled manners. Some accounts make them pale, expressionless, awkward, or strangely unfamiliar with ordinary behavior.', 'Those details make them unsettling without requiring anything openly supernatural. They look official, but they do not feel fully normal.'],
      ['Early Accounts Associated with UFO Culture', 'Men in Black stories grew in the same environment as UFO reports, Cold War secrecy, and fears about hidden government knowledge. Early accounts helped establish the pattern of witness, visit, warning, and silence.', 'The legend belongs to modern folklore because it turns broad suspicion into a scene that can happen at a door, office, or living room.'],
      ['Threats, Warnings, and Requests for Silence', 'The visitors may warn witnesses not to speak, ask for evidence, or imply consequences. In some versions, the warning is direct. In others, the tone is polite enough to be more disturbing.', 'The point is control. The story imagines knowledge being removed from public view by people who never clearly identify themselves.'],
      ['Government Agents, Folklore, and Misidentification', 'Different readings treat the Men in Black as government agents, impostors, nonhuman beings, rumor figures, or misidentified ordinary officials. The repeated pattern is easier to document than any single hidden organization.', 'A careful reading keeps the folklore visible. The legend expresses distrust of secrecy without proving every visitor story literally happened.'],
      ['How Film and Television Changed the Image', 'Film and television made Men in Black recognizable to audiences who never followed UFO lore. Popular versions often turn them into agents, protectors, or action characters rather than quiet intimidators.', 'That change did not erase the older legend. It gave the image a second life while softening some of its unease.']
    ],
    'prometheus-fire-myth': [
      ['The Conflict Between Prometheus and Zeus', 'Prometheus is remembered as a clever Titan who challenges Zeus in matters involving gods and humans. The conflict is not only personal. It concerns who controls sacrifice, fire, knowledge, and the boundary between divine and mortal life.', 'That boundary gives the myth its pressure. Prometheus helps humanity, but his help is also a direct challenge to divine order.'],
      ['The Sacrifice at Mecone', 'One important ancient strand involves a deceptive sacrifice at Mecone. Prometheus arranges portions in a way that affects the relationship between gods and humans, and Zeus responds with anger.', 'This episode matters because it shows Prometheus as more than a simple benefactor. He is a trickster whose cleverness changes ritual order.'],
      ['How Fire Reached Humanity', 'The fire episode gives the myth its most famous image. Prometheus steals or retrieves fire and brings it to humans, giving them warmth, craft, cooking, protection, and the basis for culture.', 'Fire is small enough to carry, but large enough to transform human life. That contrast is why the image remains so powerful.'],
      ['The Punishment on the Mountain', 'Zeus punishes Prometheus by having him bound, often on a remote mountain or rock. The punishment makes the cost of his gift visible and ongoing.', 'The scene fixes the myth around endurance. Prometheus cannot take back the gift, and Zeus does not allow the rebellion to pass without pain.'],
      ['The Eagle and the Repeating Torment', 'In many versions, an eagle tears at Prometheus liver, which renews so the torment can continue. The repeated punishment makes the myth feel cyclical rather than final.', 'That repetition turns suffering into a sign of cosmic order being enforced again and again.'],
      ['Heracles and the End of the Punishment', 'Later retellings often connect Prometheus\' release with Heracles. The rescue does not erase the punishment, but it gives the myth a second movement after the long suffering.', 'The release also lets Prometheus remain more than a victim. He becomes a figure whose defiance continues to matter after Zeus\' judgment.'],
      ['Fire as Knowledge, Craft, and Defiance', 'Prometheus may be read as a myth about dangerous knowledge. Fire makes human life richer, but it also marks a break in the order between gods and mortals.', 'That is why the myth continues to appear in stories about technology, rebellion, sacrifice, and ambition. Prometheus gives humans a future they were not supposed to hold.']
    ],
    'phoenix-mythic-bird': [
      ['The Bird That Returns Through Fire', 'The phoenix is remembered as a rare bird connected with death and renewal. Later versions often describe it burning and returning from ashes, making rebirth visible in one dramatic image.', 'The image is simple, but the tradition is layered. The phoenix is not only a fantasy creature; it is a symbol that moved through ancient, medieval, religious, and modern contexts.'],
      ['Egyptian, Greek, and Roman Traditions', 'Classical discussions of the phoenix often connect it with distant lands, solar imagery, long cycles, and rare appearances. Some associations point toward Egyptian sacred bird imagery, while Greek and Roman writers shaped the name known to later readers.', 'These traditions do not all describe the same details. They do show that the phoenix became a bridge between exotic geography, cosmic time, and renewal.'],
      ['How Long the Phoenix Was Said to Live', 'Different sources give the phoenix an extraordinary lifespan, sometimes measured in hundreds of years. The long life matters because the creature belongs to cycles larger than ordinary animal life.', 'A phoenix does not simply die like another bird. Its death is timed, meaningful, and tied to return.'],
      ['Fire, Ashes, and Rebirth', 'The fire-and-ashes version became the most famous form of the phoenix story. It gives readers a clear sequence: ending, burning, ash, and new life.', 'Not every older account uses the same mechanics, but the modern symbol depends heavily on this image of renewal through destruction.'],
      ['Medieval Christian Interpretation', 'Medieval writers often used the phoenix as a symbol of resurrection and spiritual renewal. The bird could be read as proof through nature, allegory, or moral instruction.', 'This use changed the emphasis. The creature became less about distant wonder alone and more about the promise of life after death.'],
      ['How the Modern Phoenix Became a Universal Symbol', 'Modern culture uses the phoenix for recovery, rebuilding, and survival after collapse. The image appears in literature, institutions, fantasy, and everyday language.', 'The symbol works because it does not deny destruction. It imagines a form of life that begins after the fire.']
    ],
    'shambhala-hidden-kingdom': [
      ['Shambhala in Buddhist Tradition', 'Shambhala is associated with Buddhist tradition and sacred geography, especially through Kalachakra contexts. It should not be reduced to a simple lost city hidden on an ordinary map.', 'The name carries religious, symbolic, and geographic meaning at once. That layered identity is why later retellings often misunderstood or reshaped it.'],
      ['The Kalachakra Teachings', 'The Kalachakra connection is central to many discussions of Shambhala. It places the kingdom within a religious and prophetic frame rather than only an adventure geography.', 'This context matters because Shambhala is not just a place to discover. It is also a way of imagining order, teaching, and future transformation.'],
      ['The Hidden Kingdom and Its Rulers', 'Shambhala is often described as a hidden kingdom with rulers who preserve sacred knowledge. The hiddenness is part of its meaning, not just an obstacle for explorers.', 'A hidden kingdom can be protected, distant, or spiritually inaccessible. Those meanings change how the story should be read.'],
      ['Prophecy and the Future Battle', 'Some traditions connect Shambhala with prophecy and a future conflict. In these accounts, the kingdom is tied to cosmic order and the restoration of right teaching.', 'This prophetic element gives Shambhala a future-facing quality. It is not only remembered as a place from the past, but imagined as part of what may come.'],
      ['How Western Writers Reimagined Shambhala', 'Western esoteric and popular writers often transformed Shambhala into a hidden paradise, secret brotherhood, or lost-world destination. These versions helped spread the name, but they also changed its meaning.', 'The later image belongs to reception history. It should be separated from the religious traditions that gave Shambhala its deeper context.'],
      ['Shambhala, Shangri-La, and Common Confusion', 'Shambhala is often confused with Shangri-La and other hidden-valley legends. The comparison is understandable, but the names come from different histories and should not be treated as identical.', 'The confusion shows how hidden-world stories merge in popular imagination. A careful reading keeps the connections useful without flattening the traditions.']
    ],
    'marfa-lights-mystery': [
      ['Where the Lights Are Seen', 'The Marfa Lights are associated with the desert near Marfa in West Texas. Observers often watch from a distance, where the wide horizon makes size, speed, and location difficult to judge.', 'The setting is essential. A small light in open desert can feel close, far, natural, mechanical, or impossible depending on conditions.'],
      ['Early Accounts and Local Tradition', 'Local tradition and public discussion helped make the lights part of Marfa identity. Over time, the phenomenon became both an observation site and a story people travel to experience.', 'The history of attention matters because repeated watching changes a landscape. The horizon becomes a place where people expect mystery to appear.'],
      ['What Witnesses Commonly Describe', 'Witnesses describe lights that glow, move, split, fade, hover, or change color. Some appear white or yellow, while others are described as orange or red.', 'The descriptions vary, but they share distance and uncertainty. Viewers see something, yet the desert makes it difficult to know exactly what is being seen.'],
      ['Vehicles, Atmospheric Effects, and Other Explanations', 'Many explanations point to vehicle headlights, atmospheric refraction, temperature layers, campfires, or other ordinary light sources. These explanations can account for many reported sightings.', 'Natural explanation does not remove the cultural story. It shows how landscape, optics, and expectation can work together.'],
      ['Which Sightings Remain Difficult to Classify', 'Some reports remain difficult because details are incomplete, viewing conditions are unclear, or witnesses describe movements that do not fit a simple account. Those cases require caution rather than dramatic certainty.', 'The best reading allows different sightings to have different causes. One explanation does not have to solve every light ever reported near Marfa.'],
      ['How the Lights Became Part of Marfa Identity', 'The Marfa Lights are now part of regional identity, travel writing, and local mystery culture. People come to watch not only for proof, but for the experience of looking into the desert.', 'The phenomenon lasts because it sits between sight and interpretation. The lights appear at the edge of certainty, and that edge is where the story lives.']
    ],
    'mount-olympus-greek-myth': [
      ['The Mountain in Greek Geography', 'Mount Olympus is a real mountain in Greece, and that physical presence gives the mythic setting unusual force. The divine home is not only abstract; it is tied to a visible height.', 'The mountain lets myth and geography touch. People can name the place while still imagining it as more than ordinary terrain.'],
      ['Olympus as the Home of the Gods', 'In Greek myth, Olympus becomes the home of the Olympian gods. It is the place associated with divine gathering, command, feast, conflict, and distance from mortal life.', 'The setting gives the gods a shared stage. Their power feels organized because it has a height, a court, and a place above the human world.'],
      ['Zeus and the Olympian Court', 'Zeus stands at the center of Olympus as ruler among the Olympian gods. The mountain becomes a political and divine space where authority is displayed and contested.', 'Stories of Olympus are not only about peace. Divine life includes rivalry, judgment, desire, anger, and negotiation.'],
      ['Feasts, Councils, and Divine Life', 'Later art and retelling often imagine Olympus through feasts, councils, thrones, clouds, and shining architecture. These images make the divine realm easier to picture.', 'Those details can be useful, but they should not be mistaken for one fixed ancient floor plan. Olympus is a mythic setting that changed across sources and art.'],
      ['The Boundary Between Mortal and Divine Space', 'Olympus may be read as a boundary image. Humans live below, while gods dwell above, watching and intervening but remaining beyond ordinary reach.', 'The mountain makes hierarchy visible. Height becomes a way to picture divine distance.'],
      ['How Later Art Imagined Olympus', 'Later painters, poets, and popular retellings made Olympus more grand and palace-like. The image became a shorthand for divine order and mythic spectacle.', 'This later Olympus is part of the mountain afterlife. It shows how a real place can become an enduring visual language for power.']
    ],
    'mjolnir-thors-hammer': [
      ['How Mjolnir Was Forged', 'Mjolnir is connected with stories of divine craftsmanship and the making of powerful objects. Its origin places it among mythic weapons that carry more than physical force.', 'The forging story matters because the hammer is not ordinary equipment. It enters myth as an object made for cosmic conflict and divine use.'],
      ['Thor\'s Use of the Hammer Against Giants', 'Thor uses Mjolnir against giants and other threats to divine order. The hammer is therefore a weapon of protection as much as destruction.', 'Its violence is framed by defense. The object strikes because the world of gods and humans needs to be guarded from forces of chaos.'],
      ['The Hammer\'s Return to Thor\'s Hand', 'Mjolnir is famous for returning after being thrown. That returning motion makes it feel bound to Thor rather than simply held by him.', 'The return also gives the hammer a rhythm. It leaves the hand, acts at a distance, and comes back as if the weapon itself knows its owner.'],
      ['Mjolnir in Blessings and Consecration', 'Mjolnir is not only a battle weapon. It is also connected with blessing, consecration, and protection in Norse tradition and later interpretation.', 'That second role gives the hammer social and sacred meaning. It can defend a boundary, mark an act, and symbolize power ordered toward protection.'],
      ['The Theft of the Hammer', 'One famous myth tells of the hammer being stolen, creating a crisis because Thor\'s power and divine protection are suddenly out of place. The recovery story shows how central the object is to cosmic order.', 'A stolen Mjolnir is not merely lost property. It is a sign that the protective structure of the world has been disturbed.'],
      ['Hammer Amulets in the Viking Age', 'Hammer pendants and amulets show that the symbol mattered beyond narrative scenes. People could wear the hammer as a sign of protection, identity, or sacred connection.', 'Material symbols do not tell stories in the same way texts do, but they show that the hammer image had public power.'],
      ['How Modern Culture Changed Mjolnir\'s Image', 'Modern comics, films, and fantasy often simplify Mjolnir into a heroic superweapon with fixed rules. Those versions made the hammer globally recognizable, but they are not the same as the older mythic object.', 'The older Mjolnir remains richer: weapon, sign, blessing tool, protection symbol, and thunder made visible.']
    ],
    'jack-o-lantern-stingy-jack-origin': [
      ['Stingy Jack and the Devil', 'The best-known origin story tells of Stingy Jack, a trickster who bargains with the Devil. His cleverness wins temporary advantages, but it also sets up his final wandering.', 'The tale gives the lantern its narrative center. The carved light is connected to a figure who can trick others but cannot escape the consequences of his own bargains.'],
      ['Why Jack Was Denied Heaven and Hell', 'In common versions, Jack is denied heaven because of his life and denied hell because of his bargain with the Devil. He is left between destinations, unable to settle in either place.', 'That in-between condition is essential. The Jack-o-Lantern belongs to threshold folklore because Jack himself is trapped between worlds.'],
      ['The Burning Coal Inside a Carved Turnip', 'The small light in the story is often described as a burning coal placed inside a carved turnip or similar root vegetable. It becomes Jack only guide as he wanders.', 'This image connects the tale to older lantern customs. A carved object, a light, and a dangerous night come together in one portable symbol.'],
      ['Lantern Traditions in Ireland and Britain', 'Older customs in Ireland and Britain used carved turnips, beets, or other root vegetables. These lanterns could be playful, frightening, protective, or tied to seasonal mischief.', 'The custom did not begin as a pumpkin face. It belonged to available materials and local practice before it became a global Halloween image.'],
      ['How Pumpkins Replaced Turnips in North America', 'In North America, pumpkins were larger, easier to carve, and strongly connected with autumn harvest. They gradually became the familiar Jack-o-Lantern material.', 'The change shows how traditions survive by adapting. The object changed shape, but the light-in-the-dark idea remained.'],
      ['The Development of the Modern Halloween Symbol', 'The modern Jack-o-Lantern is funny, eerie, decorative, and protective at once. It can welcome visitors while still facing the dark with a carved grin.', 'That mixed feeling is why the symbol works. It turns fear into craft and makes Halloween visible on the doorstep.']
    ]
  };
}

function source(title, url, supports) {
  return { title, url, sourceType: 'reference', supports };
}

function qa(q, a) {
  return { q, a };
}

function sectionPurpose(index) {
  return [
    'Explain the familiar story or subject first.',
    'Separate major versions and later retellings.',
    'Clarify what the source trail can and cannot support.',
    'Explain why the story still works.'
  ][index] || 'Develop the article while preserving source limits.';
}

function knownNamesFor(plan) {
  const shortTitle = plan.title.replace(/:.*$/, '');
  return unique([plan.subject, shortTitle, plan.keyword, plan.tag, ...plan.tags]).slice(0, 6);
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
  if (category.slug === 'unexplained-mysteries' || category.slug === 'strange-nature') {
    return `${category.title} / ${tag} / Public reports and source-limited interpretation`;
  }
  if (category.slug === 'myths' || category.slug === 'mythic-objects' || category.slug === 'mythic-creatures') {
    return `${category.title} / ${tag} / Mythic tradition and variant-aware interpretation`;
  }
  return `${category.title} / ${tag} / Existing folklore and public cultural memory`;
}

function searchIntentFor(slug) {
  if (slug === 'unexplained-mysteries') return 'facts-and-theories';
  if (slug === 'internet-folklore') return 'origin-and-spread';
  if (slug === 'legend-origins') return 'origin';
  if (slug === 'myths' || slug === 'mythic-creatures' || slug === 'mythic-objects') return 'meaning';
  return 'story-and-meaning';
}

function compactDetail(detail) {
  return String(detail || '')
    .replace(/^the\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function trimMeta(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= 158) return text;
  return `${text.slice(0, 155).replace(/\s+\S*$/, '')}...`;
}

function canonicalizeQuery(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
