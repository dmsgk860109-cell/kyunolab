const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const guidesPath = path.join(root, 'data', 'guides.json');
const categoriesPath = path.join(root, 'data', 'categories.json');
const publishedAt = '2026-07-09';

const stories = readJson(storiesPath);
const guides = readJson(guidesPath);
const categories = readJson(categoriesPath);
const storySlugs = new Set(stories.map((story) => story.slug));
const guideSlugs = new Set(guides.map((guide) => guide.slug));

const topics = {
  'urban-legends': [
    ['The Laundromat Machine That Finishes an Empty Load', 'an empty washing machine completes a paid cycle after closing time', 'payment records, closing logs, staff accounts, and neighborhood retellings'],
    ['The Pedestrian Signal That Counts Below Zero', 'a crossing signal continues below zero on one deserted intersection', 'traffic timing records, commuter accounts, maintenance reports, and street folklore'],
    ['The Last Apartment on a Floor With No End', 'a delivery worker passes the same apartment number twice on one corridor', 'building plans, delivery logs, tenant memories, and hallway legends'],
    ['The Cinema Seat Printed on No Seating Plan', 'a ticket assigns a seat missing from both the auditorium and seating plan', 'ticket stubs, theater diagrams, employee accounts, and cinema folklore'],
    ['The Corner Store Bell That Rings From the Stockroom', 'a shop bell rings from a locked stockroom instead of the entrance', 'shift notes, security records, owner retellings, and shop legends'],
    ['The Underpass Graffiti That Gives Tomorrow’s Date', 'fresh graffiti beneath an underpass appears to carry the following day’s date', 'dated photographs, cleanup schedules, local accounts, and warning legends'],
    ['The Night Bus Stop Added With White Tape', 'a temporary bus-stop name appears in white tape and vanishes before morning', 'route maps, driver accounts, passenger photographs, and transit rumors'],
    ['The Apartment Intercom That Calls Its Own Lobby', 'an apartment intercom displays the lobby as both caller and destination', 'intercom logs, resident accounts, service notes, and building folklore'],
    ['The Grocery Receipt With an Unopened Checkout Number', 'a grocery receipt names a checkout lane that has not opened in years', 'receipts, store layouts, staff memories, and printed-evidence legends'],
    ['The Alley Mirror That Shows the Main Road Empty', 'a traffic mirror shows an empty main road while cars pass behind the viewer', 'street photographs, witness retellings, city records, and reflection folklore']
  ],
  'internet-folklore': [
    ['The Draft Email That Collected Replies Before It Was Sent', 'an unsent email draft displays replies from addresses not yet contacted', 'mail headers, draft histories, forum reports, and digital folklore'],
    ['The Game Lobby With a Player From an Older Version', 'an online game lobby lists a player using a version retired years earlier', 'server logs, screenshots, patch records, and gaming folklore'],
    ['The Archived Webpage That Updates Only Its Weather', 'a preserved webpage keeps changing one tiny weather icon', 'web archives, cache comparisons, timestamps, and online retellings'],
    ['The Voice Note That Became Shorter With Every Download', 'a shared voice note loses the same second whenever it is downloaded', 'file lengths, message histories, audio comparisons, and platform folklore'],
    ['The Search Suggestion Written as a Private Question', 'a search box completes a question the user has never typed aloud or online', 'browser histories, screenshots, user reports, and privacy folklore'],
    ['The Deleted Forum Account That Still Wins Weekly Badges', 'a deleted account continues receiving automated community awards', 'badge records, moderator archives, cached profiles, and forum legends'],
    ['The Livestream Viewer Count That Refused to Reach Zero', 'an ended private livestream keeps exactly one viewer after every device disconnects', 'stream dashboards, account logs, creator reports, and digital witness motifs'],
    ['The Shared Document Cursor With No Account Name', 'an unnamed cursor returns to the same sentence in a closed shared document', 'revision histories, access logs, screenshots, and collaborative-software folklore'],
    ['The Podcast Episode Hidden Between Two File Numbers', 'a podcast feed briefly exposes an episode absent from its public season list', 'feed archives, download logs, listener notes, and lost-media folklore'],
    ['The Profile Picture Reflected in an Unrelated Photograph', 'a familiar profile image appears as a reflection inside an unrelated upload', 'image metadata, repost chains, compression analysis, and internet rumor']
  ],
  'strange-places': [
    ['The Airport Gate Beyond the Final Number', 'an airport corridor points toward a gate numbered beyond the terminal range', 'terminal maps, boarding records, traveler accounts, and transit-place legends'],
    ['The Basement Window Looking Onto a Rooftop', 'a basement window appears to look across a rooftop under daylight', 'building plans, photographs, renovation notes, and impossible-view stories'],
    ['The Footbridge That Changes Riverbanks in Fog', 'walkers in fog remember leaving a footbridge on the bank where they began', 'trail maps, weather reports, local accounts, and river-crossing folklore'],
    ['The Museum Staircase With One Uncatalogued Landing', 'a museum stairwell contains a landing absent from evacuation diagrams', 'floor plans, visitor accounts, inspection notes, and institutional legends'],
    ['The Coastal Road Sign Pointing Inland to the Sea', 'an inland-facing road sign briefly directs travelers toward the coast', 'road records, map archives, driver photographs, and directional folklore'],
    ['The Courtyard Heard Behind a Solid Wall', 'voices and fountain water are heard beyond a wall with no enclosed courtyard', 'property plans, resident testimony, acoustic reports, and hidden-place stories'],
    ['The Mountain Shelter With Two Different Altitudes', 'the same trail shelter displays conflicting elevation plaques on opposite walls', 'trail records, survey maps, hiker accounts, and mountain folklore'],
    ['The Station Exit That Opens Before the First Train', 'a locked station exit is found open before service begins but leaves no access record', 'station logs, staff accounts, timetables, and threshold-place mysteries'],
    ['The Bookshop Aisle Longer Than the Building', 'a narrow bookshop aisle seems to extend beyond the exterior wall', 'property measurements, customer memories, shop plans, and spatial legends'],
    ['The Reservoir Steps Visible Only at Low Moon', 'stone steps appear above the waterline despite stable reservoir levels', 'water records, night photographs, local stories, and submerged-place folklore']
  ],
  'unexplained-mysteries': [
    ['The Library Card Used Before It Was Issued', 'a library card records a loan one week before its activation date', 'circulation logs, issue records, staff notes, and timestamp limits'],
    ['The Elevator Inspection Signed by an Unknown Initial', 'an elevator certificate carries initials absent from the contractor roster', 'inspection files, contractor lists, building records, and document gaps'],
    ['The Street Photograph Taken From Inside a Sealed Room', 'an archive photograph shows a street angle possible only from a sealed room', 'photograph metadata, floor plans, archive notes, and viewpoint limits'],
    ['The Parcel Barcode Assigned to Two Different Cities', 'one parcel barcode appears in delivery records from two distant cities', 'tracking histories, depot logs, label images, and routing anomalies'],
    ['The Public Clock Heard During a Recorded Power Cut', 'a public clock chimes clearly in audio recorded during a documented outage', 'outage reports, audio files, maintenance records, and evidence limits'],
    ['The Ferry Manifest With an Empty Line That Was Counted', 'a ferry manifest total includes one blank passenger line', 'manifest scans, ticket totals, staff procedures, and record discrepancies'],
    ['The Key Deposit Returned for a Room Without a Key', 'a hotel ledger records a returned key deposit for a keyless room', 'ledger entries, renovation records, staff accounts, and administrative gaps'],
    ['The Weather Station Reading From a Removed Sensor', 'a weather station posts one reading after its sensor was removed for repair', 'sensor logs, maintenance times, public data, and instrumentation limits'],
    ['The Archive Box Listed on Two Shelves at Once', 'one archive box appears in simultaneous inventory checks from separate rooms', 'catalog records, scan times, staff notes, and collection mysteries'],
    ['The Security Camera Timestamp Ahead of the Building Clock', 'a lobby camera runs exactly seven minutes ahead only during one recorded hour', 'camera exports, clock logs, service records, and timing uncertainty']
  ],
  'classic-folklore': [
    ['Why a Broom Was Laid Across the Door at Night', 'a broom is placed across a doorway to stop unwanted footsteps from entering', 'household customs, threshold beliefs, oral accounts, and protective folklore'],
    ['The Bowl of Water Left Beneath a New Cradle', 'water is left beneath a cradle to carry away restless dreams', 'birth customs, water symbolism, family tradition, and nursery folklore'],
    ['Why Travelers Turned a Coin Before Crossing a Bridge', 'travelers turn a coin at a bridge so the return road will remember them', 'journey customs, bridge lore, coin symbolism, and oral tradition'],
    ['The Red Thread Sewn Into a Winter Coat', 'a red thread is hidden in a coat lining as protection against losing one’s way', 'clothing customs, color symbolism, winter lore, and family practice'],
    ['Why the First Loaf Was Cooled Near a Window', 'the first loaf is cooled near an open window before anyone may eat it', 'bread customs, household ritual, seasonal memory, and food folklore'],
    ['The Name Whispered Into an Empty Cup', 'a name is whispered into an empty cup before a long separation', 'parting customs, vessel symbolism, family accounts, and remembrance folklore'],
    ['Why the Garden Gate Was Never Closed at Noon', 'a garden gate remains open at noon so good weather is not trapped outside', 'garden customs, weather belief, rural sayings, and seasonal folklore'],
    ['The Needle Kept Above the Kitchen Door', 'a needle is fixed above the kitchen door to catch sharp words before they spread', 'domestic ritual, protective objects, household sayings, and oral tradition'],
    ['Why Salt Was Counted After a Family Argument', 'spilled salt is counted after an argument to measure how long resentment may last', 'salt customs, reconciliation rituals, household folklore, and number symbolism'],
    ['The Bell Rung Once for an Empty House', 'a small bell is rung once before a family leaves an empty house behind', 'departure customs, house memory, bell symbolism, and regional tradition']
  ],
  'modern-legends': [
    ['The Food Delivery Photo Showing the Wrong Door', 'a delivery confirmation shows a familiar door from another neighborhood', 'delivery records, image metadata, driver accounts, and app-era folklore'],
    ['The Smart Thermostat That Saved an Unknown Schedule', 'a thermostat stores a heating schedule no resident created', 'device histories, household accounts, support records, and smart-home legends'],
    ['The Parking Meter That Refunded an Old Coin', 'a digital parking meter returns a coin from an obsolete currency', 'meter service records, photographs, city reports, and machine folklore'],
    ['The Co-Working Desk Booked by a Closed Company', 'a workspace calendar repeatedly reserves a desk for a dissolved company', 'booking records, company filings, staff accounts, and workplace legend'],
    ['The Digital Menu Item That Exists Only After Closing', 'a restaurant app displays one unavailable meal only after the kitchen closes', 'menu caches, order histories, staff reports, and service-app folklore'],
    ['The Apartment Sensor That Counts One Extra Entry', 'a lobby occupancy sensor adds one entry on otherwise empty nights', 'sensor logs, access records, tenant accounts, and building technology legends'],
    ['The Shared Bicycle That Ends Every Trip at the Same Corner', 'a rental bicycle records every ride as ending at one unused corner', 'rental histories, GPS traces, rider reports, and mobility folklore'],
    ['The Calendar Reminder for a Meeting Room Since Demolished', 'an office reminder directs staff to a room removed in an earlier renovation', 'calendar archives, renovation plans, staff accounts, and workplace folklore'],
    ['The Self-Checkout Voice That Used a Customer’s Name', 'a self-checkout machine addresses a customer by name without a loyalty scan', 'transaction logs, witness reports, system notes, and retail legends'],
    ['The Door Camera Clip Recorded Before the Package Arrived', 'a door camera labels a delivery clip minutes before the courier reaches the street', 'camera timestamps, courier tracking, device logs, and modern legend']
  ],
  myths: [
    ['The Moon That Borrowed a Fisher’s Net', 'the moon borrows a net to gather scattered reflections from the sea', 'lunar symbolism, fishing traditions, sea myths, and restoration motifs'],
    ['The First Rain Hidden Inside a Drum', 'the first rain is hidden inside a drum until people learn a rhythm of gratitude', 'rain myths, musical symbolism, seasonal rites, and origin patterns'],
    ['The Fox That Carried Fire Across the Snow', 'a fox carries a coal across winter fields and teaches villages to keep fire alive', 'fox symbolism, fire myths, winter stories, and culture-bringer motifs'],
    ['The Giant Who Folded the Valley at Night', 'a giant folds a valley like cloth so travelers can cross before dawn', 'landscape myths, giant traditions, journey motifs, and dawn symbolism'],
    ['The Weaver Who Mended a Crack in the Sky', 'a weaver repairs the sky with thread made from river light', 'creation myths, weaving symbolism, river imagery, and cosmic repair'],
    ['The Island That Slept Beneath a Turtle’s Shell', 'an island sleeps beneath a turtle until its people are ready to return', 'island myths, turtle symbolism, exile stories, and return motifs'],
    ['The Wind That Learned Every Doorway’s Name', 'the wind learns the names of doorways so it can carry warnings between homes', 'wind myths, naming traditions, threshold symbolism, and messenger motifs'],
    ['The Blacksmith Who Forged the First Shadow', 'a blacksmith forges the first shadow to cool the world at midday', 'smith myths, shadow symbolism, creation stories, and heat motifs'],
    ['The River Bride Who Chose the Smaller Sea', 'a river spirit chooses a quiet sea over a glorious one and reshapes the coast', 'river personification, marriage myths, landscape origins, and choice motifs'],
    ['The Child Who Planted the Evening Star', 'a child plants a bright seed that rises each evening to guide late travelers', 'star myths, child-hero motifs, guidance symbolism, and night origins']
  ],
  'mythic-creatures': [
    ['The Ash-Winged Stag That Appears After Wildfire', 'an ash-winged stag walks burned hills and marks where green shoots will return', 'stag symbolism, fire ecology, renewal folklore, and omen traditions'],
    ['The Glass-Finned Fish Beneath Frozen Lakes', 'a transparent fish is said to carry winter light beneath frozen lakes', 'lake folklore, winter creatures, light symbolism, and fishing tales'],
    ['The Doorstep Hare That Refuses an Empty House', 'a pale hare waits at inhabited thresholds but avoids abandoned homes', 'hare folklore, household omens, boundary creatures, and local accounts'],
    ['The Bell-Throated Bird of Mountain Passes', 'a mountain bird sounds like a distant bell before weather changes', 'bird omens, mountain lore, sound motifs, and storm traditions'],
    ['The Moss-Crowned Hound of Forgotten Roads', 'a moss-covered hound guides lost walkers away from roads erased by forest', 'hound folklore, lost-road legends, forest guardians, and guidance motifs'],
    ['The Candle Moth That Visits Before a Long Journey', 'a large pale moth circles one candle before someone departs', 'moth symbolism, travel omens, household folklore, and departure customs'],
    ['The River Horse That Leaves Dry Hoofprints', 'a river creature leaves dry hoofprints along wet stones before floods', 'water-horse traditions, flood omens, hoofprint tales, and river folklore'],
    ['The Orchard Crow With a Silver Beak', 'a silver-beaked crow appears when an orchard’s oldest tree is about to fall', 'crow symbolism, orchard lore, tree omens, and rural retellings'],
    ['The Roof Serpent That Drinks Thunder', 'a serpent coils along rooftops during storms and is said to swallow thunder', 'serpent myths, weather creatures, roof guardians, and storm symbolism'],
    ['The Lantern-Eyed Goat of the High Moor', 'a goat with lantern-bright eyes leads travelers toward shelter or deeper fog', 'moor folklore, goat symbolism, deceptive guides, and fog legends']
  ],
  'lost-worlds': [
    ['The Kingdom Drawn Beneath a Lake on Old Maps', 'an old map places a complete kingdom beneath a modern reservoir', 'historical maps, drowned-land traditions, local memory, and cartographic myth'],
    ['The Valley Where Every Road Points Outward', 'a hidden valley is described as having roads that only lead away', 'travel accounts, impossible geography, exile motifs, and lost-world lore'],
    ['The Island Named in Three Captains’ Dreams', 'three captains record the same unknown island after dreaming of its harbor', 'ship journals, dream geography, maritime lore, and island myths'],
    ['The Underground City Lit by Reflected Noon', 'an underground city receives daylight through mirrors no visitor can locate', 'subterranean myths, light systems, traveler tales, and hidden-city motifs'],
    ['The Forest Province Missing From the Census', 'a forest province appears in tax records but not in any population census', 'administrative records, border legends, map gaps, and imagined states'],
    ['The Desert Port Where Ships Arrive Without Water', 'a desert trading city remembers ships docking where no sea remains', 'desert folklore, vanished-sea traditions, merchant tales, and port myths'],
    ['The Northern Road to a Country With No Winter', 'an old northern route promises a country untouched by winter', 'road legends, climate utopias, travel manuscripts, and hidden-realm stories'],
    ['The Monastery Beyond the Repeating Mountain', 'a monastery is said to stand beyond a mountain travelers cross twice', 'pilgrim tales, recursive landscapes, sacred geography, and lost places'],
    ['The Railway Atlas With a Missing Capital', 'a railway atlas marks a capital city absent from political maps', 'railway history, phantom settlements, atlas records, and geographic folklore'],
    ['The Orchard Realm Where No Fruit Falls', 'a secluded realm keeps every ripe fruit suspended until a visitor tells the truth', 'abundance myths, truth tests, orchard symbolism, and ideal-world traditions']
  ],
  'strange-nature': [
    ['The Fog Bank That Stops at One Garden Gate', 'a dense fog repeatedly ends along the line of one garden gate', 'weather observations, resident photographs, local memory, and boundary folklore'],
    ['The Rain That Leaves One Roof Completely Dry', 'rain falls across a street while one roof remains sharply dry', 'rainfall records, photographs, roof inspections, and weather legends'],
    ['The Pond That Echoes Before a Sound Is Made', 'a pond returns a faint echo moments before nearby calls', 'field recordings, acoustic conditions, witness accounts, and water folklore'],
    ['The Snow Circle That Melts From the Outside In', 'a circular patch of snow melts toward its cold center', 'temperature readings, photographs, seasonal observations, and winter lore'],
    ['The Forest Wind Heard Beneath Still Leaves', 'a strong wind is heard at ground level while the canopy remains still', 'weather reports, audio recordings, ranger notes, and forest folklore'],
    ['The Cliff Flowers That Open Only During Fog', 'a patch of cliff flowers is reported open only under heavy fog', 'botanical notes, visitor photographs, tide records, and coastal folklore'],
    ['The Stream That Runs Clear After Every Storm', 'a small stream remains clear when neighboring water turns muddy', 'watershed maps, rainfall data, local accounts, and purity legends'],
    ['The Hill Shadow That Arrives Before Sunset', 'one hill casts a long shadow earlier than surrounding terrain predicts', 'sun-angle calculations, photographs, map contours, and landscape lore'],
    ['The Field Where Frost Forms in Straight Lines', 'frost appears in parallel lines across an otherwise irregular field', 'soil maps, weather data, aerial images, and agricultural folklore'],
    ['The Thunder Heard Only Inside the Valley', 'thunder is reported within a valley while nearby stations record clear weather', 'weather radar, sound reports, terrain studies, and storm folklore']
  ],
  'legendary-places': [
    ['The Well of Returning Names', 'a village well is said to repeat names forgotten by the speaker', 'well traditions, local histories, naming customs, and sacred-place folklore'],
    ['The Bridge Where Pilgrims Leave Unwritten Letters', 'pilgrims leave blank folded letters beneath one bridge stone', 'pilgrimage customs, bridge records, devotional practice, and local memory'],
    ['The Hill Shrine That Faces Away From Sunrise', 'an old hill shrine faces west despite a regional east-facing tradition', 'site plans, ritual history, oral accounts, and sacred geography'],
    ['The Ruined Tower That Marks No Former Border', 'a boundary tower stands where no surviving map records a border', 'survey maps, ruin studies, local histories, and frontier folklore'],
    ['The Cave Chapel With a Tide Calendar', 'an inland cave chapel preserves a calendar organized around sea tides', 'chapel records, calendar inscriptions, regional history, and place legend'],
    ['The Stone Road Remembered Beneath the Marsh', 'local stories describe a paved road beneath marshland with no confirmed excavation', 'oral history, land surveys, old maps, and submerged-road folklore'],
    ['The Cedar Grove Where Bells Are Never Rung', 'a sacred grove keeps several bells that custom forbids anyone to sound', 'grove traditions, bell symbolism, local rules, and ritual landscape'],
    ['The Harbor Steps Dedicated to a Missing Ship', 'harbor steps bear a dedication to a ship absent from port records', 'inscriptions, shipping archives, civic memory, and maritime legend'],
    ['The Mountain Door Painted in Every Generation', 'each generation repaints a door shape on a mountain wall without opening it', 'community ritual, paint layers, mountain folklore, and continuity motifs'],
    ['The Crossroads Shrine Moved by Every New Map', 'maps place the same roadside shrine at slightly different crossroads', 'map editions, shrine records, traveler accounts, and shifting-place legend']
  ],
  'mythic-objects': [
    ['The Compass That Points Toward the Last Promise', 'a compass is said to point toward the place of an unfulfilled promise', 'compass symbolism, oath folklore, journey tales, and moral objects'],
    ['The Cup That Keeps the Taste of Rain', 'a ceremonial cup is believed to preserve the taste of the season’s first rain', 'vessel lore, rain customs, ritual objects, and seasonal symbolism'],
    ['The Key Forged for a Door Not Yet Built', 'a key is passed down for a doorway each generation expects to build', 'key symbolism, inheritance tales, threshold myths, and future motifs'],
    ['The Mirror That Shows a Room Before It Is Entered', 'a small mirror reveals a room as it looked moments before arrival', 'mirror folklore, anticipatory visions, household tales, and reflective objects'],
    ['The Bell That Rings Only for Returning Travelers', 'a bell remains silent for departures but sounds when long-absent travelers return', 'bell symbolism, return customs, village tales, and sound motifs'],
    ['The Needle Said to Stitch Broken Dreams', 'a silver needle is used in stories to mend nightmares into harmless memories', 'needle folklore, dream symbolism, healing tales, and ritual craft'],
    ['The Lantern That Burns With Borrowed Moonlight', 'a lantern is filled with moonlight rather than oil for one annual procession', 'lantern customs, lunar symbolism, festival objects, and light myths'],
    ['The Stone Book No One Reads From the Beginning', 'a stone book is consulted from the middle because its first page is taboo', 'book folklore, reading taboos, sacred objects, and knowledge motifs'],
    ['The Ring That Must Be Returned Through Water', 'a ring may only be returned to its owner by passing through running water', 'ring symbolism, water rites, exchange customs, and oath folklore'],
    ['The Wooden Mask That Remembers Every Voice', 'a ritual mask is said to repeat fragments of voices from former wearers', 'mask traditions, voice symbolism, performance lore, and memory objects']
  ],
  'legend-origins': [
    ['Why Empty Elevators Became a Modern Legend Setting', 'empty elevators became recurring settings for modern urban legends', 'building history, social anxiety, media patterns, and folklore development'],
    ['How the Wrong Passenger Became a Roadside Legend Motif', 'stories of an unexpected passenger formed a durable roadside motif', 'travel folklore, motif comparison, oral retellings, and modern adaptation'],
    ['Where the Forbidden Room Legend Comes From', 'forbidden-room stories connect domestic warnings with institutional spaces', 'tale-type comparisons, literary history, oral tradition, and modern variants'],
    ['Why Mirrors Appear in So Many Warning Legends', 'mirrors became recurring devices for warnings, doubles, and uncertain evidence', 'mirror beliefs, visual culture, tale motifs, and legend transmission'],
    ['How Lost Media Became Internet Folklore', 'missing recordings and inaccessible files developed into online legend forms', 'media history, forum culture, archive gaps, and digital retelling'],
    ['Why Bells Signal Boundaries in Folklore', 'bells repeatedly mark borders between safety, weather, time, and the unknown', 'ritual history, sound symbolism, regional customs, and motif studies'],
    ['The Origin of the Road That Repeats Itself', 'repeating-road legends combine traveler disorientation with older circular-journey tales', 'travel narratives, map culture, oral tradition, and place motifs'],
    ['How the Unknown Floor Entered Building Legends', 'missing and unlisted floors grew from architecture, numbering taboos, and workplace rumor', 'building customs, elevator history, urban anxiety, and legend variants'],
    ['Why Anonymous Photographs Generate Modern Legends', 'unidentified photographs invite stories through missing context and repeated sharing', 'photographic history, archive practice, online circulation, and rumor formation'],
    ['How Weather Omens Survive in Modern Storytelling', 'traditional weather signs persist through local memory, apps, and contemporary warnings', 'weather lore, oral tradition, media adaptation, and cultural continuity']
  ]
};

const guidePlans = [
  ['how-to-separate-a-legend-hook-from-a-factual-claim', 'How to Separate a Legend Hook From a Factual Claim', 'Claim Safety', 'legend hook factual claim', 'A practical guide to writing compelling folklore hooks without presenting an unverified story as established fact.'],
  ['how-to-build-topic-briefs-for-a-growing-mystery-archive', 'How to Build Topic Briefs for a Growing Mystery Archive', 'Topic Briefs', 'mystery archive topic briefs', 'A guide to preparing useful article briefs with search intent, source status, motifs, and expansion paths.'],
  ['how-to-find-internal-link-opportunities-without-forcing-them', 'How to Find Internal Link Opportunities Without Forcing Them', 'Natural Internal Links', 'natural internal links folklore', 'A guide to connecting archive records by genuine reader curiosity instead of inserting repetitive links.'],
  ['how-to-write-source-notes-for-modern-internet-folklore', 'How to Write Source Notes for Modern Internet Folklore', 'Digital Source Notes', 'internet folklore source notes', 'A source-aware method for describing screenshots, reposts, forum claims, and uncertain digital origins.'],
  ['how-to-choose-between-origin-meaning-and-explained-search-intent', 'How to Choose Between Origin, Meaning, and Explained Search Intent', 'Search Intent Choice', 'origin meaning explained search intent', 'A guide to selecting one clear search intent while preserving room for folklore context and interpretation.'],
  ['how-to-refresh-old-articles-without-changing-their-slugs', 'How to Refresh Old Articles Without Changing Their Slugs', 'Stable Refresh', 'refresh articles stable slugs', 'A practical update process for improving titles, sections, links, and source notes while preserving public URLs.'],
  ['how-to-avoid-repetitive-openings-in-folklore-articles', 'How to Avoid Repetitive Openings in Folklore Articles', 'Opening Variety', 'avoid repetitive folklore openings', 'A guide to varying scene, question, object, place, and source-led openings across a large archive.'],
  ['how-to-decide-which-tags-deserve-indexable-archive-pages', 'How to Decide Which Tags Deserve Indexable Archive Pages', 'Tag Indexing', 'indexable tag archive criteria', 'A guide to evaluating tag depth, descriptions, article count, and reader usefulness before allowing indexing.'],
  ['how-to-balance-atmosphere-and-answers-in-mystery-writing', 'How to Balance Atmosphere and Answers in Mystery Writing', 'Atmosphere and Answers', 'mystery writing atmosphere answers', 'A guide to keeping a quiet mysterious tone while still answering the reader’s central question clearly.'],
  ['how-to-audit-a-large-static-archive-before-deployment', 'How to Audit a Large Static Archive Before Deployment', 'Archive Deployment Audit', 'static archive deployment audit', 'A deployment checklist for duplicate metadata, broken links, canonical URLs, sitemap scope, and generated-page growth.']
];

const existingByCategory = new Map(categories.map((category) => [
  category.slug,
  stories.filter((story) => story.categorySlug === category.slug).map((story) => story.slug)
]));

let addedStories = 0;
let addedGuides = 0;

for (const category of categories) {
  const plans = topics[category.slug] || [];
  const relatedPool = existingByCategory.get(category.slug) || [];
  for (const [index, plan] of plans.entries()) {
    const story = makeStory(category, plan, index, relatedPool);
    if (storySlugs.has(story.slug)) {
      const existing = stories.find((item) => item.slug === story.slug);
      if (existing) existing.metaDescription = story.metaDescription;
      continue;
    }
    stories.unshift(story);
    storySlugs.add(story.slug);
    relatedPool.unshift(story.slug);
    addedStories += 1;
  }
}

for (const [index, plan] of guidePlans.entries()) {
  const guide = makeGuide(plan, index);
  if (guideSlugs.has(guide.slug)) continue;
  guides.unshift(guide);
  guideSlugs.add(guide.slug);
  addedGuides += 1;
}

writeJson(storiesPath, stories);
writeJson(guidesPath, guides);
console.log(`Added ${addedStories} stories and ${addedGuides} Mystery Board guides.`);

function makeStory(category, plan, index, relatedPool) {
  const [subject, detail, evidence] = plan;
  const angle = titleAngle(category.slug, index);
  const title = `${subject}: ${angle}`;
  const slug = slugify(title);
  const primaryTag = primaryTagFor(category.slug, index);
  const tags = tagsFor(category, primaryTag, index);
  const excerpt = excerptFor(detail, index);
  const storyType = storyTypeFor(category.slug);

  return {
    id: slug,
    slug,
    title,
    displayTitle: title,
    seoTitle: title,
    metaTitle: `${title} | Kyunolab Mystery Archive`,
    metaDescription: metaDescriptionFor(excerpt, primaryTag),
    category: category.title,
    categorySlug: category.slug,
    categoryGroup: category.group,
    tag: primaryTag,
    primaryTag,
    seedKeyword: slugify(subject).replace(/-/g, ' '),
    searchIntent: searchIntentFor(category.slug),
    articleFormat: articleFormatFor(category.slug, category.group),
    cluster: `${category.title} / ${primaryTag}`,
    relatedKeywords: [
      `${subject.toLowerCase()} folklore`,
      `${primaryTag.toLowerCase()} meaning`,
      `${category.title.toLowerCase()} explained`,
      `${primaryTag.toLowerCase()} origin`
    ],
    topicScore: 82 + (index % 7),
    topicStatus: 'approved',
    scoreBreakdown: {
      searchDemand: 25,
      clickCuriosity: 23,
      siteFit: 20,
      expansionPotential: 12,
      differentiation: 9
    },
    summaryAnswer: `${subject} is a source-aware ${category.title.toLowerCase()} record about ${detail}. It is presented as folklore, myth, legend, or an evidence-limited mystery rather than verified fact.`,
    readTime: `${8 + (index % 4)} min read`,
    storyType,
    sourceStatus: sourceStatusFor(category.slug, category.title, primaryTag),
    excerpt,
    publishedAt,
    updatedAt: publishedAt,
    relatedStoryIds: relatedPool.filter((item) => item !== slug).slice(0, 3),
    tags,
    detail,
    evidence
  };
}

function makeGuide(plan, index) {
  const [slug, title, tag, seedKeyword, excerpt] = plan;
  const relatedStoryIds = stories.slice(index * 5, index * 5 + 3).map((story) => story.slug);
  const relatedGuideIds = guides.slice(0, 5).map((guide) => guide.slug).filter((id) => id !== slug).slice(0, 3);
  const subject = title.replace(/^How to /, '').replace(/\.$/, '');

  return {
    id: slug,
    slug,
    title,
    shortTitle: subject,
    metaTitle: `${title} | Kyunolab Mystery Archive`,
    metaDescription: excerpt,
    ogTitle: title,
    ogDescription: excerpt,
    excerpt,
    deck: `${title} is a practical Mystery Board guide for building a clearer, source-aware folklore and mystery archive without weakening its voice.`,
    category: 'Mystery Board',
    categorySlug: 'mystery-board',
    tag,
    tags: unique([tag, 'Archive Method', 'Source Status', 'Internal Links', 'Publishing QA']),
    bestFor: 'Editors and readers who want a more trustworthy way to organize folklore, mystery, and archive records',
    readTime: `${8 + (index % 3)} min read`,
    url: `/mystery-board/${slug}`,
    publishedAt,
    updatedAt: publishedAt,
    relatedStoryIds,
    relatedGuideIds,
    sections: [
      section('why-this-matters', 'Why this matters', `${subject} matters because a growing archive can become repetitive or unclear long before it runs out of topics.`, 'The practical goal is to protect reader trust: one clear purpose, stable URLs, useful internal paths, and honest limits for every page.'),
      section('what-to-check-first', 'What to check first', 'Begin with the reader question and the page type. Decide whether the subject needs an origin, meaning, explanation, source review, or editorial guide.', 'Then compare the title, opening, tags, source status, and related links. They should support the same need without making the evidence sound stronger than it is.'),
      section('how-to-apply-it', 'How to apply it in Kyunolab', 'Use the category as the broad shelf and tags as narrower recurring motifs. Let the article body follow the natural shape of the subject instead of a fixed word limit.', 'When a section becomes too broad, split the idea into a separate related article. When it is thin, merge it into a stronger section instead of manufacturing length.'),
      section('common-failures', 'Common failures to avoid', 'Avoid copied openings, keyword chains, unsupported claims, and links that exist only to increase crawl paths.', 'A good archive page is specific enough to be useful, restrained enough to be credible, and distinct enough that a reader can remember why it exists.'),
      section('a-practical-final-pass', 'A practical final pass', `Review one recent story such as [[${stories[index]?.title || stories[0].title}|/stories/${stories[index]?.slug || stories[0].slug}]] beside the [[Story & Source Notice|/fiction-disclaimer.html]].`, 'Confirm that the page answers its central question, names its uncertainty, offers a natural next path, and does not create unnecessary indexable URLs.')
    ],
    faq: [
      { question: 'Does every article need the same length?', answer: 'No. Length should follow the available material and reader need. Useful depth should not be cut, and thin subjects should not be padded.' },
      { question: 'Should search intent replace the archive voice?', answer: 'No. Search intent clarifies the page purpose. It should not erase atmosphere or turn uncertain folklore into a factual claim.' },
      { question: 'When should an idea become a separate article?', answer: 'Create a separate article when it serves a distinct reader question and can support a useful, source-aware page of its own.' },
      { question: 'What should remain stable during updates?', answer: 'Keep the public slug and canonical URL stable unless there is a compelling technical reason to change them.' }
    ],
    sourceNote: 'This Mystery Board entry is an editorial guide for Kyunolab Mystery Archive. It explains publishing and reading methods and does not verify any individual folklore or mystery claim.'
  };
}

function titleAngle(slug, index) {
  const angles = {
    'urban-legends': ['Origin and Meaning of a Neighborhood Legend', 'Why This Street Story Keeps Returning', 'A Modern Urban Legend Explained'],
    'internet-folklore': ['How a Small Glitch Became Internet Folklore', 'Origin and Meaning of a Digital Legend', 'Why This Online Story Keeps Spreading'],
    'strange-places': ['A Strange Place Legend Explained', 'Why This Impossible Location Feels Believable', 'Maps, Memory, and the Story Behind It'],
    'unexplained-mysteries': ['What the Records Show and What They Cannot Prove', 'An Evidence-Limited Mystery Explained', 'Documents, Timing, and an Unresolved Gap'],
    'classic-folklore': ['Meaning and History of a Household Custom', 'A Traditional Belief Explained', 'What This Old Custom Was Meant to Protect'],
    'modern-legends': ['How Technology Turned It Into a Modern Legend', 'A Contemporary Urban Legend Explained', 'Why This Everyday Story Feels So Plausible'],
    myths: ['Meaning and Symbolism of the Story', 'An Origin Myth Explained', 'What This Myth Says About the Natural World'],
    'mythic-creatures': ['Folklore, Meaning, and Regional Motifs', 'A Mythic Creature Tradition Explained', 'What the Creature Warns or Protects'],
    'lost-worlds': ['The Maps and Myths Behind a Hidden Realm', 'A Lost World Tradition Explained', 'Why Imagined Geography Feels Almost Real'],
    'strange-nature': ['Folklore, Observation, and Possible Explanations', 'A Natural Mystery Explained', 'Why This Landscape Story Endures'],
    'legendary-places': ['History, Folklore, and Local Memory', 'A Legendary Place Explained', 'Why the Site Became Part of Local Tradition'],
    'mythic-objects': ['Meaning, Symbolism, and Folklore', 'A Mythic Object Tradition Explained', 'What the Object Gives, Takes, or Remembers'],
    'legend-origins': ['History and Folklore Development', 'How the Motif Changed Across Retellings', 'Origins, Variants, and Modern Meaning']
  };
  const options = angles[slug] || ['A Source-Aware Archive Reading'];
  return options[index % options.length];
}

function section(id, title, first, second) {
  return { id, title, nav: title, paragraphs: [first, second] };
}

function primaryTagFor(slug, index) {
  const values = {
    'urban-legends': ['Neighborhood Legend', 'Transit Folklore', 'Building Legend', 'Printed Evidence', 'Threshold Legend'],
    'internet-folklore': ['Digital Folklore', 'Platform Glitch', 'Archived Page', 'Online Rumor', 'Lost Media'],
    'strange-places': ['Liminal Place', 'Map Anomaly', 'Impossible Room', 'Transit Place', 'Hidden Passage'],
    'unexplained-mysteries': ['Record Gap', 'Timestamp Mystery', 'Document Anomaly', 'Evidence Limit', 'Institutional Mystery'],
    'classic-folklore': ['Household Folklore', 'Threshold Custom', 'Protective Custom', 'Domestic Ritual', 'Oral Tradition'],
    'modern-legends': ['Modern Legend', 'Smart Device Legend', 'Service Industry Legend', 'Workplace Folklore', 'App-Era Folklore'],
    myths: ['Origin Myth', 'Nature Myth', 'Sky Myth', 'Culture Hero', 'Symbolic Myth'],
    'mythic-creatures': ['Creature Folklore', 'Omen Creature', 'Guardian Creature', 'Boundary Creature', 'Weather Creature'],
    'lost-worlds': ['Lost Place', 'Hidden World', 'Vanished Island', 'Imagined Geography', 'Map Mystery'],
    'strange-nature': ['Weather Folklore', 'Landscape Anomaly', 'Water Phenomenon', 'Sound Boundary', 'Seasonal Omen'],
    'legendary-places': ['Sacred Place', 'Local Memory', 'Pilgrim Route', 'Ruined Landmark', 'Map Memory'],
    'mythic-objects': ['Mythic Object', 'Threshold Object', 'Ritual Tool', 'Mirror Folklore', 'Symbolic Object'],
    'legend-origins': ['Legend Origin', 'Motif History', 'Source Pattern', 'Folklore Development', 'Modern Motif']
  };
  return (values[slug] || ['Archive Record'])[index % 5];
}

function tagsFor(category, primaryTag, index) {
  const groupTag = category.group === 'Modern Strange Records'
    ? 'Modern Folklore'
    : category.group === 'Mythic & Imagined Realms'
      ? 'Mythic Pattern'
      : 'Archive Method';
  const shared = ['Evidence Limit', 'Recurring Motif', 'Source Status', 'Local Memory', 'Reading Path'];
  return unique([primaryTag, groupTag, shared[index % shared.length], shared[(index + 2) % shared.length]]);
}

function excerptFor(detail, index) {
  const openings = [
    'A source-aware archive record examining',
    'A careful folklore entry centered on',
    'A calm investigation of',
    'An archive reading built around',
    'A measured Kyunolab record tracing'
  ];
  return `${openings[index % openings.length]} ${detail}.`;
}

function metaDescriptionFor(excerpt, primaryTag) {
  let value = `${excerpt} Explore its ${primaryTag.toLowerCase()} motifs, source status, folklore context, and evidence limits.`;
  if (value.length < 130) {
    value += ' The record separates interpretation from verified fact.';
  }
  if (value.length <= 160) return value;
  const shortened = value.slice(0, 157);
  const boundary = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, boundary > 130 ? boundary : 157)}...`;
}

function storyTypeFor(slug) {
  if (slug === 'legend-origins') return 'Legend Origin Guide';
  if (slug === 'unexplained-mysteries') return 'Mystery Record';
  if (slug === 'myths') return 'Myth';
  if (slug === 'mythic-creatures') return 'Mythic Creature';
  if (slug === 'mythic-objects') return 'Mythic Object';
  if (slug.includes('folklore')) return 'Folklore Record';
  if (slug.includes('place') || slug.includes('world')) return 'Place Legend';
  return 'Source-Aware Legend';
}

function sourceStatusFor(slug, title, primaryTag) {
  if (slug === 'unexplained-mysteries') return `${title} / ${primaryTag} / Evidence-limited record`;
  if (slug === 'legend-origins') return `${title} / ${primaryTag} / Source-aware explanation`;
  if (slug.includes('myth')) return `${title} / ${primaryTag} / Symbolic retelling`;
  return `${title} / ${primaryTag} / Source-aware archive note`;
}

function searchIntentFor(slug) {
  if (slug === 'legend-origins') return 'origin';
  if (slug.includes('internet')) return 'internet folklore';
  if (slug.includes('place') || slug.includes('world')) return 'place legend';
  if (slug.includes('myth')) return 'meaning';
  return 'legend explained';
}

function articleFormatFor(slug, group) {
  if (slug === 'legend-origins') return 'search-info';
  return group === 'Mythic & Imagined Realms' ? 'story-archive' : 'search-info';
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
  return values.filter((value, index, all) => all.indexOf(value) === index);
}
