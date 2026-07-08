const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const guidesPath = path.join(root, 'data', 'guides.json');
const categoriesPath = path.join(root, 'data', 'categories.json');
const publishedAt = '2026-07-08';

const stories = readJson(storiesPath);
const guides = readJson(guidesPath);
const categories = readJson(categoriesPath);
const storySlugs = new Set(stories.map((story) => story.slug));
const guideSlugs = new Set(guides.map((guide) => guide.slug));
const existingByCategory = new Map(categories.map((category) => [
  category.slug,
  stories.filter((story) => story.categorySlug === category.slug).map((story) => story.slug)
]));

const categoryPlans = {
  'urban-legends': [
    ['The Payphone That Rings After the Last Bus: Origin and Meaning of a Late-Night Urban Legend', 'payphone rings after last bus legend', 'a station payphone rings after the final bus leaves, although the number has been disconnected for years', 'transit rumors, old phone records, commuter retellings, and late-night public-space folklore'],
    ['The School Locker That Opens With the Wrong Combination: A Campus Legend Explained', 'locker opens with wrong combination legend', 'a school locker opens for the wrong combination only when students are alone after practice', 'school hallway rumors, maintenance notes, student retellings, and locker folklore'],
    ['The Parking Garage Level No One Finds Twice: Why This Urban Legend Feels Plausible', 'parking garage level no one finds twice', 'drivers remember a parking garage level that appears once, then disappears from the elevator directory', 'parking tickets, garage maps, driver accounts, and building-navigation legends'],
    ['The Streetlight That Goes Dark for One Driver: A Roadside Urban Legend Explained', 'streetlight goes dark for one driver', 'one streetlight goes dark only when a particular driver passes the same corner at night', 'roadside rumors, traffic maintenance records, commuter memory, and streetlight folklore'],
    ['The Taxi Receipt From a Renamed Street: How a Small Paper Clue Became a Legend', 'taxi receipt renamed street legend', 'a taxi receipt prints the name of a street that was renamed before the passenger was born', 'fare receipts, city maps, driver stories, and urban evidence motifs'],
    ['The Neighborhood Shortcut With One Extra Turn: Meaning Behind a Local Road Legend', 'neighborhood shortcut extra turn legend', 'a familiar shortcut adds one impossible turn whenever someone follows directions from memory', 'local road stories, map comparisons, neighborhood warnings, and route folklore'],
    ['The Diner Booth Reserved for a Passenger Who Never Arrives: A Modern Urban Legend', 'diner booth reserved for missing passenger', 'a diner keeps one booth empty for a passenger whose bus is no longer on the schedule', 'diner staff retellings, bus schedules, roadside rumors, and missing-passenger motifs'],
    ['The House With Two Doorbells and One Answer: A Threshold Urban Legend Explained', 'house with two doorbells legend', 'a house has two doorbells, but only the unlabeled one ever receives an answer', 'neighborhood stories, doorstep customs, address records, and threshold legends'],
    ['The Train Crossing Bell Without Tracks: Why This Local Legend Keeps Returning', 'train crossing bell without tracks', 'a crossing bell rings at night where the tracks were removed decades earlier', 'railway records, local memory, sound reports, and transit folklore'],
    ['The Office Badge That Opens a Vacant Floor: A Workplace Urban Legend Explained', 'office badge opens vacant floor legend', 'an office badge opens a floor that management says has never been leased', 'access logs, workplace rumors, elevator directories, and building legends']
  ],
  'internet-folklore': [
    ['The Screenshot Folder That Keeps One Deleted Image: Internet Folklore Explained', 'screenshot folder deleted image folklore', 'a screenshot folder restores one deleted image whenever the device reconnects to the cloud', 'cloud sync logs, forum posts, screenshot comparisons, and digital folklore'],
    ['The Livestream Thumbnail That Changed After Midnight: A Digital Legend Explained', 'livestream thumbnail changed after midnight', 'a livestream thumbnail changes after midnight while the archived video remains unchanged', 'stream archives, viewer screenshots, cached images, and platform folklore'],
    ['The Forum Poll Option Nobody Added: How a Small Glitch Became Internet Folklore', 'forum poll option nobody added', 'a forum poll gains an extra option that no moderator can find in the edit history', 'forum archives, moderator notes, cached pages, and online rumor cycles'],
    ['The Map App Voice That Said a Name Instead of a Street: A Modern Digital Legend', 'map app voice says name legend', 'a navigation app speaks a personal name where it should announce a street', 'navigation logs, user reports, audio clips, and app-glitch folklore'],
    ['The Shared Playlist With a Song No One Uploaded: Internet Folklore and Memory', 'shared playlist song no one uploaded', 'a shared playlist gains a song that none of the collaborators remember adding', 'playlist histories, account logs, reposted screenshots, and digital memory stories'],
    ['The Old Profile Page That Still Shows Typing: Why This Internet Legend Feels Personal', 'old profile still typing legend', 'an abandoned profile shows a typing indicator long after the account was closed', 'profile caches, chat screenshots, user retellings, and archived-page folklore'],
    ['The Cloud Backup That Restores One Extra File: A Digital Folklore Record', 'cloud backup restores extra file', 'a cloud backup restores one file that never appears in the original folder history', 'backup logs, file metadata, help-thread records, and cloud folklore'],
    ['The Video Call Background With a Door That Opens: Internet Folklore Explained', 'video call background door opens legend', 'a video-call background shows a door opening even though the room behind it is a static image', 'meeting screenshots, background files, platform discussions, and visual-glitch stories'],
    ['The Captcha That Asked for a Place You Know: A Strange Internet Folklore Pattern', 'captcha asks for familiar place', 'a captcha asks the user to select images of a place they privately recognize', 'captcha screenshots, user reports, privacy speculation, and internet folklore'],
    ['The Group Photo With One Face Turned Away: How Reposts Create Digital Legends', 'group photo one face turned away folklore', 'a group photo seems to show one face turning farther away each time the image is reposted', 'image chains, compression debates, repost histories, and online mythmaking']
  ],
  'strange-places': [
    ['The Rest Stop With Two Northbound Exits: A Strange Place Legend Explained', 'rest stop two northbound exits legend', 'a highway rest stop appears to offer two northbound exits that return drivers to different mile markers', 'road maps, driver accounts, maintenance records, and rest-stop folklore'],
    ['The Hotel Corridor That Skips Room 214: Why Missing Rooms Become Place Legends', 'hotel corridor skips room 214', 'a hotel corridor jumps from room 213 to 215 while old key tags still list the missing room', 'hotel floor plans, guest retellings, key records, and missing-room legends'],
    ['The Ferry Office for an Island Not on the Schedule: A Strange Place Record', 'ferry office island not on schedule', 'a ferry office window sells directions for an island no current timetable includes', 'ferry schedules, terminal maps, traveler stories, and island folklore'],
    ['The Cemetery Path That Returns to the Front Gate: A Local Place Legend Explained', 'cemetery path returns to front gate', 'a cemetery path seems to return walkers to the front gate without crossing the same bend twice', 'cemetery maps, visitor accounts, groundskeeping notes, and path legends'],
    ['The Market Staircase Opening Onto a Bus Platform: A Liminal Place Mystery', 'market staircase bus platform legend', 'a market staircase is remembered as opening onto a bus platform that the building never contained', 'market plans, merchant memories, transit maps, and liminal-place folklore'],
    ['The Library Window Facing a Different Street: Why This Building Legend Lasts', 'library window different street legend', 'a library window appears to face a street that is two blocks away from the building', 'library maps, patron accounts, renovation files, and institutional place legends'],
    ['The Motel Pool That Reflects an Indoor Ceiling: A Strange Place Story Explained', 'motel pool reflects indoor ceiling legend', 'a motel pool reflects ceiling lights from a room guests cannot find', 'guest photographs, property layouts, pool maintenance notes, and reflection folklore'],
    ['The Tunnel Sign for a Closed Town: A Roadside Place Legend Explained', 'tunnel sign closed town legend', 'a tunnel exit sign lists a town removed from road maps after a landslide', 'tunnel signage, map archives, road repair records, and vanished-town legends'],
    ['The Inland Bridge Shelter That Smells Like Sea Air: A Place Mystery Record', 'bridge shelter smells like sea air legend', 'a bridge shelter far inland smells of sea air only on foggy mornings', 'commuter accounts, weather logs, bridge maintenance notes, and sensory place folklore'],
    ['The Hill Road Where GPS Loses One Minute: A Modern Strange Place Legend', 'hill road gps loses one minute', 'drivers notice one minute missing from navigation logs after crossing the same hill road', 'GPS logs, local road stories, time-stamp comparisons, and route mysteries']
  ],
  'unexplained-mysteries': [
    ['The Museum Receipt Printed Before the Exhibit Opened: An Evidence-Limit Mystery', 'museum receipt before exhibit opened', 'a museum receipt appears to reference an exhibit one day before its public opening', 'ticket records, exhibit schedules, archive scans, and timestamp mysteries'],
    ['The Closed Clinic Appointment That Reappeared: A Modern Mystery Record', 'closed clinic appointment reappeared mystery', 'an appointment reminder appears for a clinic that closed before the patient joined the system', 'clinic records, appointment software, archived notices, and record-gap mysteries'],
    ['The Missing Minute in the Town Hall Clock: Why Timestamp Mysteries Spread', 'missing minute town hall clock', 'a town hall clock loses one minute during a public meeting while every phone remains synchronized', 'meeting recordings, maintenance logs, witness notes, and timekeeping mysteries'],
    ['The Mailbox Key Found in a Different City: A Small Object Mystery Explained', 'mailbox key found different city', 'a mailbox key appears in a different city with a tag matching an address that never used that lock type', 'postal records, key tags, property files, and unresolved object mysteries'],
    ['The Bus Ticket Stamped With an Unknown Route: A Transit Mystery Record', 'bus ticket unknown route mystery', 'a bus ticket is stamped with a route number missing from every current and archived timetable', 'ticket stubs, route archives, transit worker memory, and transport mysteries'],
    ['The Office Door Code That Worked Once After Closing: A Controlled-Access Mystery', 'office door code worked once after closing', 'a disabled office door code works once after closing, then disappears from access logs', 'access control records, workplace reports, door schedules, and institutional mysteries'],
    ['The School Photograph With an Unlisted Row: An Archive Mystery Explained', 'school photograph unlisted row mystery', 'a school photograph shows an extra row not listed in the yearbook layout notes', 'yearbooks, print proofs, school archives, and photograph mysteries'],
    ['The Weather Alert for a Street With No Houses: A Local Record Mystery', 'weather alert street no houses mystery', 'a weather alert names a street that appears on emergency maps but has no houses or road sign', 'weather alerts, emergency maps, local records, and naming mysteries'],
    ['The Storage Unit Inventory With One Extra Chair: An Evidence-Limited Mystery', 'storage unit extra chair inventory', 'a storage unit inventory lists one chair that appears in no photograph and belongs to no tenant', 'inventory sheets, facility records, tenant statements, and object-record gaps'],
    ['The Radio Log Naming a Silent Station: A Broadcast Mystery Explained', 'radio log silent station mystery', 'a radio log names a station that was silent during the hour it supposedly broadcast a warning', 'broadcast logs, radio archives, listener notes, and signal mysteries']
  ],
  'classic-folklore': [
    ['The Hearth Coal Saved Under the Winter Bowl: A Household Folklore Meaning', 'hearth coal winter bowl folklore', 'a coal from the hearth is saved under a winter bowl so the house remembers warmth', 'household customs, winter rituals, hearth folklore, and oral tradition'],
    ['The Shoes Left Backward at the Threshold: A Classic Folklore Rule Explained', 'shoes backward threshold folklore', 'shoes are left backward at the threshold to confuse whatever follows a traveler home', 'threshold beliefs, travel customs, household warnings, and regional folklore'],
    ['The Thread Tied Around the Quiet Well: A Water Folklore Motif Explained', 'thread tied around quiet well folklore', 'a thread tied around a well bucket marks the night when water should not be drawn', 'well customs, water folklore, village warnings, and oral tradition'],
    ['The Knife Laid Flat Before a Journey: A Travel Folklore Rule Explained', 'knife laid flat before journey folklore', 'a knife is laid flat before a journey so sharp words do not follow the traveler', 'travel customs, domestic ritual, knife folklore, and protective sayings'],
    ['The Empty Plate Set for the Weather Guest: A Classic Folklore Reading', 'empty plate weather guest folklore', 'an empty plate is set during storms for a guest who is never named aloud', 'weather customs, table folklore, guest rituals, and storm traditions'],
    ['The Candle Mark That Warns of a Visitor: A Household Omen Explained', 'candle mark visitor omen folklore', 'a candle mark left in cooling wax is read as a sign that a visitor will arrive before dusk', 'candle customs, household omens, wax divination, and visitor folklore'],
    ['The Old Spoon That Must Not Touch Salt: Kitchen Folklore and Meaning', 'old spoon must not touch salt folklore', 'an old spoon is kept away from salt because it is said to carry the first quarrel of the house', 'kitchen folklore, salt customs, inherited rules, and domestic ritual'],
    ['The Orchard Ribbon Hung for Returning Feet: Harvest Folklore Explained', 'orchard ribbon returning feet folklore', 'a ribbon is hung in the orchard so absent family members can find their way home in autumn', 'orchard customs, harvest belief, family folklore, and return motifs'],
    ['The Doorstep Stone Washed Before Dawn: Threshold Folklore and Meaning', 'doorstep stone washed before dawn folklore', 'a doorstep stone is washed before dawn to remove words spoken in anger the night before', 'threshold rituals, household cleansing, oral tradition, and domestic warning stories'],
    ['The Window Cloth Turned During Thunder: Weather Folklore Explained', 'window cloth turned during thunder folklore', 'a window cloth is turned during thunder so lightning will not learn the household names', 'weather folklore, naming taboos, household protection, and storm customs']
  ],
  'modern-legends': [
    ['The Delivery App Order From a Closed Apartment: A Modern Legend Explained', 'delivery app order closed apartment legend', 'a delivery app sends orders from an apartment sealed after renovation', 'delivery logs, apartment records, driver retellings, and app-era legends'],
    ['The Smart Doorbell That Rang Before Installation: A Modern Household Legend', 'smart doorbell rang before installation', 'a smart doorbell account records a ring before the device was installed on the porch', 'device logs, porch-camera stories, installation records, and smart-home folklore'],
    ['The Ride-Share Driver Following an Old Address: A Modern Road Legend', 'rideshare driver old address legend', 'a ride-share driver follows an address removed from the map years earlier and still receives a rating', 'ride-share receipts, map updates, driver stories, and urban transport legends'],
    ['The Vending Machine That Prints a Train Platform: A Modern Service Legend', 'vending machine prints train platform', 'a vending machine receipt prints a train platform instead of a snack code', 'station vending records, receipt photographs, commuter rumors, and service-machine folklore'],
    ['The Apartment App Notice From a Vacant Unit: A Modern Building Legend', 'apartment app notice vacant unit', 'an apartment app posts a maintenance notice from a unit listed as vacant for months', 'tenant apps, building logs, maintenance schedules, and modern property folklore'],
    ['The Parking App That Reserves an Underground Space: A Modern Urban Legend', 'parking app reserves underground space legend', 'a parking app reserves a space on a basement level the garage directory does not show', 'parking records, app screenshots, driver accounts, and navigation legends'],
    ['The Receipt Scanner That Reads Tomorrow’s Total: A Modern Office Legend', 'receipt scanner reads tomorrow total', 'a receipt scanner enters a total dated tomorrow before anyone uploads the receipt', 'office tools, scan logs, accounting notes, and workplace technology legends'],
    ['The Smart Speaker That Answers a Question First: A Modern Digital Legend', 'smart speaker answers question first legend', 'a smart speaker answers a question before the person in the room asks it aloud', 'smart-device logs, household stories, platform explanations, and voice-assistant folklore'],
    ['The QR Code That Opens an Empty Map Pin: A Modern Legend Explained', 'qr code empty map pin legend', 'a QR code on a notice opens a map pin in an empty lot where an older building once stood', 'QR links, map records, neighborhood memory, and modern location folklore'],
    ['The Office Calendar Invite From a Retired Room: A Workplace Legend Explained', 'calendar invite retired room legend', 'an office calendar invite books a room removed during renovations but still accepted by the system', 'calendar systems, workplace records, renovation plans, and institutional folklore']
  ],
  myths: [
    ['The Child Who Hid the First Echo: A Myth About Voice and Return', 'child hid first echo myth', 'a child hides the first echo in a stone bowl so the mountains must learn to answer softly', 'echo myths, voice symbolism, mountain stories, and origin motifs'],
    ['The River That Learned to Speak in Fog: A Water Myth Explained', 'river learned to speak in fog myth', 'a river learns to speak only when fog covers its mouth', 'water myths, fog symbolism, river spirits, and speech-origin stories'],
    ['The Star That Fell Into a Clay Cup: A Sky Myth and Meaning', 'star fell into clay cup myth', 'a star falls into a clay cup and teaches people to carry night without fear', 'star myths, vessel symbolism, night stories, and teaching motifs'],
    ['The Mountain That Borrowed the Sea’s Voice: A Landscape Myth Explained', 'mountain borrowed sea voice myth', 'a mountain borrows the sea voice before storms so inland people can hear warning', 'mountain myths, sea symbolism, storm lore, and sound motifs'],
    ['The Wolf That Carried the Morning Bell: An Animal Myth Explained', 'wolf carried morning bell myth', 'a wolf carries the morning bell across a sleeping valley so dawn can find its road', 'animal myths, dawn symbolism, bell folklore, and valley stories'],
    ['The Tree That Held Up the Last Cloud: A Season Myth Explained', 'tree held up last cloud myth', 'a tree holds up the last cloud of summer until the harvest is counted', 'tree myths, seasonal symbolism, harvest stories, and weather motifs'],
    ['The Bird That Counted the Unmade Days: A Myth About Time and Memory', 'bird counted unmade days myth', 'a bird counts the days not yet made and loses one feather for every forgotten promise', 'time myths, bird symbolism, promise motifs, and sacred counting stories'],
    ['The Moon Gate Opened by a Sleeping Fox: A Trickster Myth Explained', 'moon gate sleeping fox myth', 'a sleeping fox opens a moon gate by dreaming of the road it refused to take', 'fox folklore, moon myths, gate symbolism, and trickster stories'],
    ['The Serpent That Guarded the First Rain: A Weather Myth Explained', 'serpent guarded first rain myth', 'a serpent guards the first rain until the fields learn to wait', 'serpent myths, rain symbolism, agricultural folklore, and seasonal teaching tales'],
    ['The Girl Who Traded Her Shadow for Firelight: A Mythic Meaning Explained', 'girl traded shadow for firelight myth', 'a girl trades her shadow for firelight and must learn what warmth costs', 'shadow myths, fire symbolism, exchange motifs, and symbolic retellings']
  ],
  'mythic-creatures': [
    ['The Glass-Antlered Stag Seen Before Snow: A Mythic Creature Record', 'glass antlered stag folklore', 'a glass-antlered stag appears on the edge of fields before the first heavy snow', 'stag folklore, winter omens, field sightings, and creature motifs'],
    ['The River Mare Beneath the Old Bridge: A Mythic Creature Legend Explained', 'river mare beneath bridge folklore', 'a river mare walks beneath an old bridge and leaves wet hoofprints on dry stone', 'water-horse folklore, bridge legends, hoofprint motifs, and local retellings'],
    ['The Ash-Feathered Crow of Old Roofs: A Creature Folklore Meaning', 'ash feathered crow folklore', 'an ash-feathered crow lands on old roofs before families hear news from far away', 'crow omens, roof folklore, messenger birds, and household warnings'],
    ['The Blue-Throated Hound at Ferry Roads: A Boundary Creature Explained', 'blue throated hound ferry roads', 'a blue-throated hound waits near ferry roads and never crosses with travelers', 'hound folklore, ferry crossings, boundary creatures, and road omens'],
    ['The Lantern Snail Beneath Garden Stones: A Small Creature Folklore Record', 'lantern snail garden stones folklore', 'a lantern snail glows beneath garden stones after the first autumn rain', 'garden folklore, small creatures, light motifs, and seasonal omens'],
    ['The Hollow Swan That Calls Before Fog: A Water Creature Legend', 'hollow swan before fog folklore', 'a hollow swan calls before fog settles over a lake path', 'swan folklore, fog omens, lake stories, and sound motifs'],
    ['The Iron Finch That Nests in Chimneys: A Household Creature Legend', 'iron finch chimney folklore', 'an iron finch is said to nest in chimneys where the fire has forgotten a name', 'bird folklore, chimney customs, household omens, and name motifs'],
    ['The White-Toed Cat That Crosses Grave Paths: A Mythic Creature Explained', 'white toed cat grave path folklore', 'a white-toed cat crosses grave paths before a family returns an old object', 'cat folklore, grave paths, return motifs, and local creature warnings'],
    ['The Moss-Faced Child of the Orchard Wall: A Creature Folklore Record', 'moss faced child orchard folklore', 'a moss-faced child is glimpsed by orchard walls where no child has played for years', 'orchard folklore, childlike figures, boundary walls, and seasonal retellings'],
    ['The Salt-Eyed Horse at the Tide Gate: A Sea Creature Folklore Meaning', 'salt eyed horse tide gate folklore', 'a salt-eyed horse appears by the tide gate when the sea is calm but boats stay tied', 'sea-horse folklore, tide gates, coastal omens, and creature legends']
  ],
  'lost-worlds': [
    ['The City Printed on the Back of a Ticket: A Lost World Legend Explained', 'city printed on back of ticket legend', 'a city is printed on the back of a train ticket, but no railway map names it', 'ticket records, rail maps, lost-city lore, and travel folklore'],
    ['The Country Whose Border Follows a Shadow: A Lost World Myth Explained', 'country border follows shadow legend', 'a country is described only by a border that follows the afternoon shadow of a mountain', 'old maps, border folklore, shadow motifs, and imagined geography'],
    ['The Harbor Found in a Child’s Atlas: Why Lost Places Stay Memorable', 'harbor in childs atlas legend', 'a harbor appears in a child atlas but disappears from every later edition', 'atlas records, harbor stories, map revisions, and lost-place folklore'],
    ['The Inland Sea Written Into Weather Logs: A Lost World Mystery', 'inland sea weather logs legend', 'weather logs refer to an inland sea that no current map accepts', 'weather archives, map gaps, vanished seas, and archival mysteries'],
    ['The Station for a Town Removed From Timetables: A Lost Place Record', 'station for town removed from timetables', 'a station timetable keeps one platform for a town removed from the route', 'timetables, rail archives, passenger memory, and lost-town legends'],
    ['The Valley Between Two Page Numbers: A Lost World Folklore Record', 'valley between two page numbers legend', 'a valley appears in a guidebook only between two page numbers that should be consecutive', 'guidebooks, print anomalies, valley folklore, and archive gaps'],
    ['The Island Listed Only in Ferry Warnings: A Lost Island Legend Explained', 'island only in ferry warnings', 'an island is named only in ferry warnings and never in tourist maps', 'ferry notices, nautical records, island folklore, and vanished-place motifs'],
    ['The Road Atlas Village With No Roads: A Lost Place Legend Explained', 'road atlas village no roads legend', 'a village appears in a road atlas though no road connects to it', 'road atlases, local memory, mapping anomalies, and village folklore'],
    ['The Palace Under the Orchard Roots: A Hidden World Myth Explained', 'palace under orchard roots legend', 'a palace is said to lie under orchard roots where trees lean in perfect rows', 'orchard legends, buried palaces, root symbolism, and hidden-world folklore'],
    ['The Moonlit Country in Old School Maps: A Lost World Record', 'moonlit country old school maps', 'old school maps show a pale country in the margin where students once drew borders', 'school maps, classroom folklore, marginalia, and imagined geography']
  ],
  'strange-nature': [
    ['The Tree Line Where Rain Turns Sideways: A Strange Nature Legend Explained', 'tree line rain turns sideways', 'rain turns sideways at a tree line while the field on either side remains calm', 'weather notes, forest-edge stories, field observations, and nature folklore'],
    ['The Lake That Freezes Around One Footprint: A Winter Mystery Record', 'lake freezes around one footprint', 'a lake freezes around one footprint that appears before anyone walks onto the ice', 'winter observations, ice records, footprint folklore, and lake mysteries'],
    ['The Field Where Dandelions Bloom in a Circle: A Nature Folklore Reading', 'dandelions bloom in circle field', 'dandelions bloom in a clean circle where no marker or old path is known', 'field notes, plant folklore, seasonal records, and landscape motifs'],
    ['The Creek That Runs Warm During Snow: A Strange Nature Record', 'creek runs warm during snow legend', 'a creek runs warm during snow and steams only beside one old fence post', 'creek temperatures, winter folklore, local observations, and water anomalies'],
    ['The Hill Where Wind Stops at the Fence: A Local Nature Legend Explained', 'hill wind stops at fence', 'wind stops at a fence line halfway up a hill even when grass moves on both sides', 'wind observations, hillside folklore, fence-line stories, and local weather motifs'],
    ['The Orchard Where Fruit Falls Upward in Stories: A Strange Nature Folklore Note', 'orchard fruit falls upward legend', 'old orchard stories claim fruit once fell upward before a storm broke the harvest', 'orchard customs, storm folklore, harvest stories, and impossible-nature motifs'],
    ['The Fog Bank That Keeps the Shape of a Door: A Landscape Mystery Explained', 'fog bank shaped like door legend', 'a fog bank keeps the shape of a door across a field until sunrise', 'fog observations, field stories, doorway symbolism, and weather folklore'],
    ['The Pond Reflecting Clouds From Yesterday: A Strange Nature Legend', 'pond reflects yesterday clouds folklore', 'a pond is said to reflect clouds remembered from the previous afternoon', 'pond reflections, sky records, local retellings, and memory folklore'],
    ['The Meadow Where Crickets Count Out of Order: A Sound Folklore Record', 'crickets count out of order meadow', 'crickets in one meadow seem to chirp in uneven counts people begin treating as a warning', 'insect sounds, meadow folklore, seasonal omens, and acoustic observations'],
    ['The Stone That Gathers Frost in Summer: A Natural Folklore Mystery', 'stone gathers frost in summer', 'one stone gathers frost in summer mornings while every nearby rock stays dry', 'microclimate notes, stone folklore, field observations, and seasonal anomalies']
  ],
  'legendary-places': [
    ['The Hill of Bells No Map Names Twice: A Legendary Place Explained', 'hill of bells no map names twice', 'a hill of bells appears in old directions under different names but never twice on the same map', 'map records, bell folklore, hill legends, and local memory'],
    ['The Orchard Island Seen From the Wrong Shore: A Legendary Place Record', 'orchard island wrong shore legend', 'an orchard island is visible only from the shore where maps show open water', 'island folklore, shoreline accounts, orchard motifs, and map uncertainty'],
    ['The Chapel Under the Dry Reservoir: A Place Legend and Meaning', 'chapel under dry reservoir legend', 'a chapel is said to stand under a reservoir that has been dry for decades', 'reservoir records, chapel legends, drought memory, and sacred-place folklore'],
    ['The Village Gate in Old Postcards: A Legendary Place Explained', 'village gate old postcards legend', 'old postcards show a village gate that no current street plan can place', 'postcards, village maps, local memory, and vanished-landmark legends'],
    ['The Valley Where Names Return as Echoes: A Legendary Place Record', 'valley names return as echoes', 'a valley returns spoken names as echoes in the voice of someone absent', 'echo folklore, valley legends, name taboos, and oral tradition'],
    ['The Coast Road Leading to a Paper Harbor: A Legendary Place Explained', 'coast road paper harbor legend', 'a coast road is said to lead to a harbor shown only in paper records', 'coastal maps, harbor ledgers, road lore, and remembered geography'],
    ['The Lost Garden Behind the Railway Wall: A Legendary Place Record', 'lost garden behind railway wall', 'a garden is remembered behind a railway wall where survey maps show only gravel', 'railway maps, garden folklore, local memory, and hidden-place motifs'],
    ['The Watchtower Facing a Disappeared Road: A Landmark Legend Explained', 'watchtower facing disappeared road', 'a watchtower faces a road that disappeared from maps before the tower was built', 'watchtower records, road maps, landmark stories, and route legends'],
    ['The Meadow Drawn on Maps Before It Existed: A Legendary Place Mystery', 'meadow drawn before existed map legend', 'a meadow appears on maps before the land was cleared enough to hold one', 'map editions, land records, meadow folklore, and cartographic legends'],
    ['The House Marked Only by Smoke in Winter: A Legendary Place Record', 'house marked by smoke in winter legend', 'a house is located in winter stories only by smoke rising where no chimney remains', 'winter folklore, house ruins, local memory, and smoke motifs']
  ],
  'mythic-objects': [
    ['The Bronze Bowl That Cools Boiling Water: A Mythic Object Meaning', 'bronze bowl cools boiling water folklore', 'a bronze bowl cools boiling water only when placed before an honest guest', 'bowl folklore, guest customs, truth motifs, and ritual objects'],
    ['The Needle Kept Inside a Locked Bell: A Mythic Object Record', 'needle inside locked bell folklore', 'a needle kept inside a locked bell is said to point toward the next broken promise', 'needle folklore, bell legends, promise motifs, and object symbolism'],
    ['The Red Thread That Measures a Promise: A Mythic Object Explained', 'red thread measures promise folklore', 'a red thread measures a promise by shortening whenever the speaker hesitates', 'thread folklore, promise customs, household objects, and symbolic measurement'],
    ['The Lantern Wick That Burns Backward: A Mythic Object Folklore Note', 'lantern wick burns backward legend', 'a lantern wick burns backward when travelers take the wrong road home', 'lantern legends, travel folklore, road warnings, and light motifs'],
    ['The Wooden Cup That Remembers a Guest: A Household Object Legend', 'wooden cup remembers guest folklore', 'a wooden cup is said to remember a guest by warming only in one pair of hands', 'cup folklore, guest customs, household memory, and object legends'],
    ['The Stone Comb Found Under the Bridge: A Mythic Object Meaning', 'stone comb under bridge folklore', 'a stone comb is found under bridges in stories about rivers that refuse to be crossed', 'comb folklore, bridge legends, river motifs, and object discoveries'],
    ['The Ring That Tightens Near False Doors: A Mythic Object Explained', 'ring tightens false doors folklore', 'a ring tightens near false doors and loosens only when the traveler turns back', 'ring folklore, threshold objects, false doors, and journey motifs'],
    ['The Black Key Wrapped in Blue Cloth: A Mythic Object Record', 'black key blue cloth folklore', 'a black key wrapped in blue cloth is said to open nothing until its owner forgets what it was for', 'key legends, cloth customs, memory motifs, and symbolic objects'],
    ['The Mirror Nail in the Doorframe: A Household Object Folklore Record', 'mirror nail doorframe folklore', 'a mirror nail in a doorframe is said to keep reflections from entering the wrong room', 'mirror folklore, nail charms, doorframe customs, and household protection'],
    ['The Clock Hand Buried Under the Hearth: A Mythic Object Meaning', 'clock hand buried under hearth folklore', 'a clock hand buried under the hearth is said to slow grief until the house can speak again', 'clock folklore, hearth customs, mourning motifs, and symbolic time objects']
  ],
  'legend-origins': [
    ['Why Empty Roads Become Vanishing Passenger Legends: Origin and Meaning', 'empty roads vanishing passenger legends origin', 'empty roads create the perfect stage for passenger legends because distance, silence, and witness memory narrow the story', 'road folklore, passenger motifs, urban legend history, and repeated retellings'],
    ['How Wrong Receipts Turn Into Modern Folklore: Origin of a Paper-Clue Legend', 'wrong receipts modern folklore origin', 'wrong receipts become folklore when a small printed detail feels more specific than ordinary error', 'receipt legends, evidence motifs, consumer folklore, and printed records'],
    ['Why Locked Rooms Attract Return Stories: A Folklore Origin Note', 'locked rooms return stories origin', 'locked rooms attract return stories because boundaries make absence feel measurable', 'room folklore, threshold motifs, building legends, and source-aware interpretation'],
    ['How Doorway Rules Become Household Legends: Folklore Origin and Meaning', 'doorway rules household legends origin', 'doorway rules become household legends because every home has a border where custom can turn into warning', 'threshold customs, family folklore, domestic rituals, and oral tradition'],
    ['Why Bridges Keep Appearing in Warning Tales: Origin of a Crossing Motif', 'bridges in warning tales origin', 'bridges appear in warning tales because they make danger feel like a crossing rather than a place', 'bridge folklore, crossing motifs, travel warnings, and legend history'],
    ['How Unused Floors Become Building Myths: Origin of a Modern Place Legend', 'unused floors building myths origin', 'unused floors become building myths when restricted access gives ordinary architecture a hidden layer', 'building legends, elevator stories, workplace folklore, and access-control myths'],
    ['Why Missing Minutes Make Strong Mystery Records: Origin of a Time Motif', 'missing minutes mystery records origin', 'missing minutes make strong mystery records because time is supposed to be the most reliable witness', 'timestamp mysteries, clock folklore, record gaps, and evidence limits'],
    ['How Old Maps Create Lost Place Legends: Origin of a Cartographic Motif', 'old maps lost place legends origin', 'old maps create lost place legends when a printed absence feels more convincing than memory', 'map folklore, cartographic errors, lost places, and archive interpretation'],
    ['Why Weather Omens Become Local Folklore: Origin of a Repeated Sign', 'weather omens local folklore origin', 'weather omens become folklore when a repeated natural sign is tied to a place, date, or household rule', 'weather folklore, local omens, nature stories, and oral tradition'],
    ['How Repeated Screenshots Become Internet Legends: Origin of Digital Folklore', 'repeated screenshots internet legends origin', 'repeated screenshots become internet legends when comparison turns a possible glitch into a shared story', 'screenshot culture, digital folklore, platform errors, and online mythmaking']
  ]
};

const guidePlans = [
  ['how-to-plan-a-mystery-article-cluster-without-thin-pages', 'How to Plan a Mystery Article Cluster Without Creating Thin Pages', 'Article Cluster Planning', 'mystery article cluster without thin pages', 'A practical guide to planning category growth, internal links, and article depth without creating thin archive pages.'],
  ['how-to-choose-search-intent-for-urban-legend-articles', 'How to Choose Search Intent for Urban Legend Articles', 'Search Intent', 'urban legend article search intent', 'A guide to matching urban legend topics with origin, meaning, version, folklore, and explanation searches.'],
  ['how-to-write-a-folklore-opening-that-still-sounds-human', 'How to Write a Folklore Article Opening That Still Sounds Human', 'Folklore Openings', 'folklore article opening', 'A guide to opening folklore articles with atmosphere, clarity, and search context without sounding mechanical.'],
  ['how-to-use-evidence-limits-as-reader-trust-signals', 'How to Use Evidence Limits as Reader Trust Signals', 'Evidence Limits', 'evidence limits reader trust', 'A guide to using source status, uncertainty, and clear limits as a trust signal in mystery and folklore articles.'],
  ['how-to-group-similar-legends-without-changing-old-urls', 'How to Group Similar Legends Without Changing Old URLs', 'URL-Safe Grouping', 'group similar legends without changing urls', 'A guide to building better clusters, tags, and related paths while keeping published slugs stable.'],
  ['how-to-build-related-paths-for-strange-place-articles', 'How to Build Related Article Paths for Strange Places', 'Related Paths', 'related article paths strange places', 'A Mystery Board guide to connecting strange places by setting, motif, source status, and reader curiosity.'],
  ['how-to-decide-when-a-mystery-topic-belongs-on-the-board', 'How to Decide When a Mystery Topic Belongs on the Board', 'Board Topic Selection', 'mystery board topic selection', 'A guide to deciding when a topic should be a guide, a category article, a tag path, or no page at all.'],
  ['how-to-keep-myth-articles-search-friendly-without-flattening-symbolism', 'How to Keep Myth Articles Search-Friendly Without Flattening Symbolism', 'Myth SEO Balance', 'myth articles search friendly symbolism', 'A guide to writing myth articles that answer searches while preserving symbolic meaning and source-aware tone.'],
  ['how-to-refresh-category-pages-as-the-archive-grows', 'How to Refresh Category Pages as the Archive Grows', 'Category Refresh', 'refresh category pages archive grows', 'A guide to keeping category pages useful as an archive gains more stories, tags, and reading paths.'],
  ['how-to-review-a-new-kyunolab-article-before-publishing', 'How to Review a New Kyunolab Article Before Publishing', 'Publishing QA', 'kyunolab article publishing checklist', 'A practical checklist for reviewing title, source status, internal links, tags, canonical URL, and reader value before publishing.']
];

let addedStories = 0;
let addedGuides = 0;

for (const category of categories) {
  const plans = categoryPlans[category.slug] || [];
  const relatedPool = existingByCategory.get(category.slug) || [];

  for (const [index, plan] of plans.entries()) {
    const story = makeStory(category, plan, index, relatedPool);
    if (storySlugs.has(story.slug)) continue;
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
  const [title, seedKeyword, detail, evidence] = plan;
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
    metaDescription: `${excerpt} This source-aware Kyunolab record traces ${primaryTag.toLowerCase()}, recurring motifs, and evidence limits.`,
    category: category.title,
    categorySlug: category.slug,
    categoryGroup: category.group,
    tag: primaryTag,
    primaryTag,
    seedKeyword,
    searchIntent: searchIntentFor(category.slug),
    articleFormat: articleFormatFor(category.slug, category.group),
    cluster: `${category.title} / ${primaryTag}`,
    relatedKeywords: [
      seedKeyword,
      `${primaryTag.toLowerCase()} meaning`,
      `${category.title.toLowerCase()} explained`,
      `${primaryTag.toLowerCase()} folklore`
    ],
    topicScore: 81 + (index % 7),
    topicStatus: 'approved',
    scoreBreakdown: {
      searchDemand: 25,
      clickCuriosity: 22,
      siteFit: 20,
      expansionPotential: 12,
      differentiation: 8
    },
    summaryAnswer: `${title.split(':')[0]} is a source-aware ${category.title.toLowerCase()} record centered on ${detail}. The article treats the material as folklore, legend, myth, or evidence-limited mystery rather than confirmed fact.`,
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
  const relatedStoryIds = stories.slice(index * 4, index * 4 + 3).map((story) => story.slug);
  const relatedGuideIds = guides.slice(0, 4).map((guide) => guide.slug).filter((id) => id !== slug).slice(0, 3);
  const subject = title.replace(/^How to /, '').replace(/^Why /, '').replace(/\.$/, '');

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
    deck: `${title} is a practical Mystery Board guide for keeping Kyunolab Mystery Archive useful, source-aware, and easy to navigate as the archive grows.`,
    category: 'Mystery Board',
    categorySlug: 'mystery-board',
    tag,
    tags: unique([tag, 'Archive Method', 'Source Status', 'Internal Links', 'Publishing QA']),
    bestFor: 'Readers and operators who want a clearer way to move through folklore, mystery, and source-aware archive records',
    readTime: `${8 + (index % 3)} min read`,
    url: `/mystery-board/${slug}`,
    publishedAt,
    updatedAt: publishedAt,
    relatedStoryIds,
    relatedGuideIds,
    sections: [
      section('why-this-matters', 'Why this matters', `A growing mystery archive needs more than volume. ${subject} helps each article earn its place by giving readers a reason to continue from one record to the next.`, 'The goal is a quieter kind of usefulness: clear labels, stable URLs, source limits, and article paths that feel intentional rather than forced.'),
      section('what-to-check-first', 'What to check first', `Start with the reader question behind the page. If the subject is a legend, ask whether the strongest angle is origin, meaning, versions, place, or evidence limit.`, 'Then check whether the title, deck, tags, and related links all point toward that same reader need without exaggerating the story as verified fact.'),
      section('how-to-apply-it', 'How to apply it inside Kyunolab', 'Use categories for the broad shelf and tags for recurring motifs. Keep related links close to genuine reader curiosity: same setting, same evidence problem, same folklore pattern, or same source status.', 'If a page starts serving too many jobs, split the idea into a guide and a story record instead of making one article carry every search intent.'),
      section('what-to-avoid', 'What to avoid', 'Avoid keyword lists, invented certainty, thin pages, and repeated openings that make different articles feel interchangeable.', 'A strong page can be search-friendly and still sound like Kyunolab: calm, literary, specific, and honest about what the record can and cannot prove.'),
      section('where-to-go-next', 'Where to go next', `Compare this guide with [[${stories[index]?.title || stories[0].title}|/stories/${stories[index]?.slug || stories[0].slug}]] and the [[Story & Source Notice|/fiction-disclaimer.html]].`, 'The most useful next step is usually one article, one source note, and one related path that tests whether the idea holds together.')
    ],
    faq: [
      { question: 'Is this guide a rule for every page?', answer: 'No. It is a practical editorial guide. Simple topics can stay simple, and deeper topics can expand when the subject needs more room.' },
      { question: 'Should SEO change the archive voice?', answer: 'No. Search structure should clarify the topic, not flatten the tone or turn folklore into a factual claim.' },
      { question: 'Do guide pages replace article source notes?', answer: 'No. Guides explain the method. Each article still needs its own source status and limits.' },
      { question: 'What is the safest publishing habit?', answer: 'Keep the slug stable, name the source limits, avoid thin indexable pages, and make sure each related link helps a reader continue naturally.' }
    ],
    sourceNote: 'This Mystery Board page is an editorial guide for reading and maintaining Kyunolab Mystery Archive. It does not verify any individual legend, mystery, or folklore claim.'
  };
}

function section(id, title, first, second) {
  return { id, title, nav: title, paragraphs: [first, second] };
}

function primaryTagFor(slug, index) {
  const tags = {
    'urban-legends': ['Transit Folklore', 'Building Legend', 'Roadside Folklore', 'Threshold Legend', 'Printed Evidence'],
    'internet-folklore': ['Digital Folklore', 'Screenshot Culture', 'Platform Glitch', 'Archived Page', 'Online Rumor'],
    'strange-places': ['Impossible Room', 'Map Anomaly', 'Transit Place', 'Hidden Passage', 'Liminal Place'],
    'unexplained-mysteries': ['Record Gap', 'Timestamp Mystery', 'Document Anomaly', 'Evidence Limit', 'Institutional Mystery'],
    'classic-folklore': ['Household Folklore', 'Threshold Custom', 'Weather Omen', 'Domestic Ritual', 'Oral Tradition'],
    'modern-legends': ['Modern Legend', 'Service Industry Legend', 'Smart Device Legend', 'Workplace Folklore', 'App-Era Folklore'],
    myths: ['Origin Myth', 'Water Myth', 'Sky Myth', 'Season Myth', 'Symbolic Myth'],
    'mythic-creatures': ['Creature Folklore', 'Omen Creature', 'Water Creature', 'Boundary Creature', 'Household Creature'],
    'lost-worlds': ['Lost Place', 'Map Mystery', 'Vanished Island', 'Hidden World', 'Imagined Geography'],
    'strange-nature': ['Weather Folklore', 'Landscape Anomaly', 'Water Phenomenon', 'Sound Boundary', 'Seasonal Omen'],
    'legendary-places': ['Sacred Place', 'Map Memory', 'Pilgrim Route', 'Ruined Landmark', 'Local Memory'],
    'mythic-objects': ['Mythic Object', 'Threshold Object', 'Ritual Tool', 'Mirror Folklore', 'Symbolic Object'],
    'legend-origins': ['Legend Origin', 'Motif History', 'Source Pattern', 'Folklore Development', 'Modern Motif']
  };
  return (tags[slug] || ['Archive Record'])[index % 5];
}

function tagsFor(category, primaryTag, index) {
  const groupTag = category.group === 'Modern Strange Records' ? 'Modern Folklore' : category.group === 'Mythic & Imagined Realms' ? 'Mythic Pattern' : 'Archive Method';
  const shared = ['Evidence Limit', 'Recurring Motif', 'Source Status', 'Local Memory', 'Reading Path'];
  return [primaryTag, groupTag, shared[index % shared.length], shared[(index + 2) % shared.length]].filter((tag, tagIndex, all) => all.indexOf(tag) === tagIndex);
}

function excerptFor(detail, index) {
  const openings = [
    'A quiet archive record following',
    'A source-aware entry centered on',
    'A careful folklore reading of',
    'A mystery-minded record built around',
    'A calm Kyunolab note tracing'
  ];
  return `${openings[index % openings.length]} ${detail}.`;
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
