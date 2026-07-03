const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const guidesPath = path.join(root, 'data', 'guides.json');
const categoriesPath = path.join(root, 'data', 'categories.json');

const stories = readJson(storiesPath);
const guides = readJson(guidesPath);
const categories = readJson(categoriesPath);

const storySlugs = new Set(stories.map((story) => story.slug));
const guideSlugs = new Set(guides.map((guide) => guide.slug));
const existingByCategory = new Map();

for (const category of categories) {
  existingByCategory.set(category.slug, stories.filter((story) => story.categorySlug === category.slug).map((story) => story.slug));
}

const categoryPlans = {
  'urban-legends': [
    ['The Elevator Mirror That Shows One Person Missing', 'elevator mirror legend', 'an elevator mirror shows every rider except the person standing closest to the control panel during the last ride of the night', 'building elevator retellings, apartment anecdotes, mirror folklore, and late-night security stories'],
    ['The Receipt That Printed a Name No One Gave', 'receipt printed wrong name legend', 'a corner store receipt prints a customer name that was never spoken and matches a name on an old staff list', 'cash-register anecdotes, receipt photographs, cashier retellings, and point-of-sale error explanations'],
    ['The Parking Space That Is Always Left Empty', 'empty parking space urban legend', 'drivers avoid one painted parking space because every car left there is said to return with the same fine dust on the windshield', 'parking lot rumors, building manager notes, resident stories, and repeated empty-space motifs'],
    ['The Last Locker in the Bus Terminal', 'bus terminal locker legend', 'the last locker in a bus terminal clicks open at closing time even when no key has been issued', 'terminal worker stories, locker maintenance records, traveler anecdotes, and public-space folklore'],
    ['The Stairwell Light That Turns On Before You Enter', 'stairwell light turns on legend', 'a stairwell light turns on one floor ahead of a night guard as if someone is climbing just out of sight', 'security guard accounts, maintenance logs, hallway rumors, and stairwell folklore'],
    ['The Laundromat Dryer That Returns One Extra Sock', 'laundromat extra sock legend', 'a laundromat dryer returns one clean sock that no customer recognizes, always folded inside the same machine', 'laundromat staff retellings, lost-and-found notes, machine repair stories, and object folklore'],
    ['The Taxi Meter That Starts Before the Door Opens', 'taxi meter starts by itself legend', 'a taxi meter starts running before any passenger enters, then stops at the address of a closed hospital', 'taxi driver anecdotes, fare receipts, city-route rumors, and urban transportation folklore'],
    ['The Doorbell Camera That Rings After Power Cuts', 'doorbell camera power outage legend', 'a doorbell camera sends a ring alert during a neighborhood outage and records only the porch light turning on', 'smart-doorbell stories, outage reports, porch-camera clips, and modern household legends'],
    ['The Vending Machine That Gives the Same Old Coin', 'vending machine old coin legend', 'a vending machine returns the same tarnished coin to different customers who choose the bottom row snack', 'campus rumors, vending service notes, coin folklore, and machine-error stories'],
    ['The Crosswalk Signal That Counts Down From Thirteen', 'crosswalk countdown urban legend', 'a crosswalk signal begins at thirteen seconds every night, even when the city replaced the controller twice', 'traffic-signal records, commuter stories, local repair notes, and roadside urban legends']
  ],
  'internet-folklore': [
    ['The Profile Bio That Changed Only in Archived Copies', 'profile bio changed archive copy', 'archived copies of a profile show a sentence that never appeared on the live page', 'web archive captures, forum screenshots, repost chains, and profile folklore'],
    ['The Livestream Comment That Appeared Before the Stream Began', 'livestream comment before start legend', 'a comment appears in a livestream replay several minutes before the broadcast countdown ended', 'stream replay records, chat exports, viewer screenshots, and platform timing rumors'],
    ['The File Name That Keeps Renaming Itself', 'file renames itself internet folklore', 'a shared file renames itself after every download to match the folder where it is saved', 'cloud drive logs, download screenshots, shared-folder stories, and file folklore'],
    ['The Forum Thread With One Missing Reply Number', 'forum missing reply number mystery', 'a forum thread jumps from reply 88 to 90 while archived copies disagree on what was removed', 'forum archives, moderator notes, cached pages, and internet mystery discussions'],
    ['The Screenshot Where the Clock Is Always Wrong', 'screenshot wrong clock folklore', 'a widely shared screenshot shows a phone clock that changes depending on where the image is reposted', 'image repost chains, EXIF discussions, screenshot comparisons, and digital folklore'],
    ['The Map Pin That Moved After Every Refresh', 'moving map pin internet legend', 'a public map pin drifts a few meters after every refresh until users start saving before-and-after images', 'map screenshots, cached tiles, user reports, and platform-glitch folklore'],
    ['The Deleted Playlist That Still Adds Songs', 'deleted playlist adds songs legend', 'a deleted playlist keeps appearing in shared links with one more song each week', 'music platform links, playlist cache captures, user screenshots, and account folklore'],
    ['The Caption That Translates Into a Different Warning', 'auto translate warning folklore', 'an ordinary caption becomes a warning when machine-translated into three different languages', 'translation screenshots, social reposts, language-thread debates, and internet folklore'],
    ['The Group Icon That Changed for Only One Member', 'group icon changed for one user legend', 'one member sees a group icon replaced by a hallway photo while everyone else sees the original image', 'group-app screenshots, cache explanations, user retellings, and private-channel folklore'],
    ['The Download Bar That Finished Twice', 'download bar finished twice folklore', 'a download completes, resets, and completes again while the final file shows an impossible creation time', 'browser download logs, file metadata, tech forum posts, and digital anomaly stories']
  ],
  'strange-places': [
    ['The Motel Room With a Window Facing the Hall', 'motel room window facing hallway', 'a motel room window opens onto the hallway even though the outside wall has no matching window', 'motel layout rumors, guest photographs, property records, and room-mapping stories'],
    ['The Roadside Chapel That Appears on Only One Lane', 'roadside chapel one lane legend', 'drivers see a roadside chapel from the northbound lane, but southbound travelers pass only a blank field', 'road-trip accounts, maps, dashcam claims, and roadside place folklore'],
    ['The Library Table That Is Never in the Floor Plan', 'library table not on floor plan', 'a reading table is used by patrons for years but never appears on any official floor plan', 'library maps, staff memories, renovation notes, and institutional place legends'],
    ['The Tunnel Exit That Opens Beside the Entrance', 'tunnel exit returns to entrance story', 'a pedestrian tunnel exit leads walkers back beside the entrance without a visible turn in the passage', 'city maps, commuter accounts, construction notes, and tunnel folklore'],
    ['The Apartment Balcony That Faces the Wrong Courtyard', 'balcony faces wrong courtyard legend', 'an apartment balcony looks into a courtyard that residents of the neighboring building cannot find', 'tenant stories, building plans, maintenance visits, and urban place mysteries'],
    ['The Ferry Waiting Room With No Ferry Route', 'ferry waiting room no route', 'a ferry waiting room remains lit in a terminal where no route has departed for decades', 'terminal records, travel guides, local accounts, and abandoned-transit folklore'],
    ['The Hotel Basement Marked as Floor Seven', 'hotel basement floor seven legend', 'an old hotel elevator lists the basement as floor seven on only one panel', 'elevator panels, hotel renovation records, guest stories, and building-number folklore'],
    ['The Bridge That Vanishes From Walking Maps', 'bridge missing from walking maps', 'a small footbridge appears in neighborhood memory but vanishes from every walking map after one update', 'mapping changes, resident accounts, old photos, and local bridge folklore'],
    ['The Market Alley That Opens Only During Rain', 'market alley opens during rain legend', 'a market alley seems to appear only when rainwater covers the painted arrows on the pavement', 'merchant accounts, weather notes, city-map gaps, and alleyway stories'],
    ['The Museum Room Between Two Numbered Galleries', 'museum room between galleries legend', 'visitors describe a room between galleries 12 and 13, but the museum guide skips directly from one to the other', 'museum maps, visitor notes, guidebook editions, and institutional mystery records']
  ],
  'unexplained-mysteries': [
    ['The Missing Minute in the Security Office Log', 'missing minute security log mystery', 'a security office log skips one minute during a routine shift while every camera remains online', 'security logs, camera timestamps, staff statements, and record-gap analysis'],
    ['The Parcel Scanned in a Town That Does Not Receive Mail', 'parcel scanned impossible town', 'a parcel tracking page shows a scan in a town with no post office and no delivery route', 'tracking records, postal-route data, screenshots, and logistics mysteries'],
    ['The Weather Report That Named the Wrong Lake', 'weather report wrong lake mystery', 'a local weather bulletin names a lake that does not appear on current maps but appears in older storm reports', 'weather archives, map records, local memory, and naming mysteries'],
    ['The Classroom Attendance Sheet With One Extra Initial', 'attendance sheet extra initial mystery', 'an attendance sheet includes one extra initial written in the same ink as the teacher column', 'school records, photocopies, staff memory, and document-anomaly folklore'],
    ['The Elevator Inspection Sticker Dated Tomorrow', 'inspection sticker tomorrow date mystery', 'an elevator inspection sticker is dated one day ahead of the official inspection schedule', 'inspection records, building notices, photographs, and date-error mysteries'],
    ['The Returned Library Book With No Borrower History', 'library book no borrower history', 'a library book returns through the chute with no borrower history and a due slip from an older system', 'library records, catalog transitions, staff notes, and archive gaps'],
    ['The Warehouse Alarm That Logged a Silent Door', 'warehouse alarm silent door mystery', 'a warehouse alarm logs a door opening that has been sealed behind a shelf since renovations', 'alarm logs, renovation records, floor plans, and access-control mysteries'],
    ['The Train Announcement for a Platform Under Repair', 'train announcement platform under repair', 'a station announcement calls passengers to a platform closed for repairs all week', 'transit logs, passenger accounts, repair notices, and announcement anomalies'],
    ['The Hospital Wristband Found in a Closed Wing', 'hospital wristband closed wing mystery', 'a hospital wristband is found in a wing closed before the printed admission date', 'hospital archive limits, renovation schedules, item records, and institutional mysteries'],
    ['The Town Clock That Matched a Power Outage Elsewhere', 'town clock matched outage mystery', 'a town clock stops at the exact minute a different town reports a complete power outage', 'clock maintenance notes, outage reports, local newspaper items, and timing coincidences']
  ],
  'classic-folklore': [
    ['The Bowl of Salt Left Beneath the Threshold', 'salt under threshold folklore', 'families leave a bowl of salt beneath the threshold to keep an unnamed visitor from crossing after dusk', 'household customs, threshold beliefs, oral retellings, and regional folklore notes'],
    ['The Red Thread Tied Around the Guest Chair', 'red thread guest chair folklore', 'a red thread is tied around a guest chair to warn that a promise made at the table must be kept', 'domestic folklore, inherited warnings, ritual objects, and family custom accounts'],
    ['The Spoon Turned Upside Down Before a Storm', 'upside down spoon storm folklore', 'a spoon is turned upside down before a storm so the house will not invite the wind inside', 'weather customs, kitchen folklore, oral tradition, and household protection motifs'],
    ['The Window Left Unlatched for the Wandering Name', 'unlatched window wandering name folklore', 'one window is left unlatched so a forgotten name can leave the house before morning', 'mourning customs, name folklore, household belief, and local oral tradition'],
    ['The Shoes Placed Toe to Toe at Midnight', 'shoes toe to toe midnight folklore', 'shoes are placed toe to toe at midnight to stop a traveler spirit from walking through the house', 'threshold folklore, travel customs, household warnings, and ritual arrangement stories'],
    ['The Blue Cloth Over the Empty Cradle', 'blue cloth empty cradle folklore', 'a blue cloth is placed over an empty cradle so the room will not call for a child who is away', 'family folklore, nursery customs, protection motifs, and inherited domestic stories'],
    ['The First Apple Left on the Orchard Wall', 'first apple orchard wall folklore', 'the first apple of the season is left on the orchard wall for the figure who keeps count of the trees', 'orchard customs, harvest folklore, offering traditions, and rural belief records'],
    ['The Bell Rung Once Before Entering the House', 'bell before entering house folklore', 'a small bell is rung once before entering a house after a long journey so the road will not follow inside', 'travel folklore, household thresholds, bell customs, and return rituals'],
    ['The Candle That Must Not Be Blown Out Twice', 'candle not blown out twice folklore', 'a candle may be blown out once, but a second breath is said to invite the room to remember you', 'candle customs, household warnings, memory folklore, and ritual rules'],
    ['The Guest Cup Turned Toward the Door', 'guest cup turned toward door folklore', 'a guest cup is turned toward the door when a visitor leaves before speaking the truth', 'table customs, guest folklore, domestic signs, and social warning stories']
  ],
  'modern-legends': [
    ['The White Bicycle Locked Outside Every Station', 'white bicycle station legend', 'a white bicycle appears locked outside different stations on the same commuter line before delays are announced', 'commuter sightings, station photos, transit rumors, and modern legend cycles'],
    ['The Delivery Bag That Arrives Without a Rider', 'delivery bag without rider legend', 'a sealed delivery bag appears in apartment lobbies with receipts for restaurants that closed years ago', 'delivery-app rumors, lobby camera claims, receipt stories, and urban service legends'],
    ['The Gas Station Pump That Stops at the Same Number', 'gas pump same number legend', 'a gas station pump stops at the same total for drivers who choose it after midnight', 'driver anecdotes, pump records, roadside rumors, and modern service-station folklore'],
    ['The Mall Escalator That Waits for One Step', 'mall escalator waits legend', 'a mall escalator pauses until someone steps on the third stair, then resumes as if it recognized the weight', 'mall staff stories, maintenance logs, shopper accounts, and mechanical legends'],
    ['The Copy Machine That Prints a Previous Office', 'copy machine previous office legend', 'an office copier prints a faded directory from the company that rented the floor years earlier', 'office rumors, equipment memory claims, lease history, and workplace legend cycles'],
    ['The Midnight Bus Driver Who Checks an Empty Seat', 'midnight bus driver empty seat legend', 'a night bus driver checks one empty seat at every terminal and refuses to explain why', 'driver stories, route folklore, passenger accounts, and modern transit legends'],
    ['The Storage Unit That Receives New Dust', 'storage unit new dust legend', 'a sealed storage unit gathers fresh dust footprints every month though the lock is never broken', 'storage facility accounts, lock records, tenant rumors, and modern property legends'],
    ['The ATM Receipt With a Handwritten Balance', 'atm receipt handwritten balance legend', 'an ATM receipt prints a balance and then shows a handwritten number beneath the ink', 'bank machine rumors, receipt photographs, error reports, and financial-machine folklore'],
    ['The Office Coffee Pot That Refills Before Morning', 'office coffee pot refills legend', 'an office coffee pot is found full every morning though cameras show the kitchen empty overnight', 'workplace anecdotes, break-room logs, camera gaps, and office folklore'],
    ['The Apartment Intercom That Calls From a Vacant Floor', 'intercom vacant floor legend', 'an apartment intercom calls the lobby from a floor sealed during renovation', 'tenant accounts, building records, intercom logs, and modern building legends']
  ],
  'myths': [
    ['The Moon That Borrowed Its Light From a Hidden Sea', 'moon borrowed light myth', 'an old tale says the moon shines because a hidden sea lends it silver water each night', 'sky myths, water symbolism, oral retellings, and comparative mythic motifs'],
    ['The First Shadow That Refused to Follow', 'first shadow myth', 'a myth tells of the first shadow refusing to follow its maker until fire learned to stand still', 'origin myths, shadow symbolism, fire stories, and traditional explanatory motifs'],
    ['The River That Asked the Mountain for a Name', 'river asked mountain name myth', 'a river asks a mountain for a name and carries the answer only during spring floods', 'landscape myths, naming stories, seasonal traditions, and water-origin motifs'],
    ['The Star Herd That Crossed the Winter Sky', 'star herd winter sky myth', 'stars are described as a herd crossing winter darkness while a silent keeper counts them from the horizon', 'constellation myths, pastoral symbolism, seasonal sky lore, and oral tradition'],
    ['The Door Between Dawn and the First Birdsong', 'door between dawn and birdsong myth', 'a door opens between dawn and the first birdsong, allowing one forgotten word to enter the world', 'creation myths, threshold symbolism, dawn motifs, and speech-origin stories'],
    ['The Stone That Remembered the First Footstep', 'stone remembered first footstep myth', 'a sacred stone remembers the first footstep and teaches the ground how to hold a path', 'origin stories, stone symbolism, travel myths, and landscape tradition'],
    ['The Cloud That Carried the Unfinished Season', 'cloud unfinished season myth', 'a cloud carries an unfinished season until the wind agrees to divide the year into four parts', 'weather myths, season origins, wind symbolism, and agricultural folklore'],
    ['The Firebird That Hid the First Ember', 'firebird first ember myth', 'a firebird hides the first ember beneath its wing so people must learn patience before warmth', 'fire myths, bird symbolism, origin motifs, and teaching stories'],
    ['The Lake That Reflected the Sun Before It Rose', 'lake reflected sun before dawn myth', 'a lake reflects the sun before sunrise because it remembers the first morning before the sky did', 'solar myths, lake symbolism, dawn stories, and mythic memory motifs'],
    ['The Road Made From the Names of Travelers', 'road made from names myth', 'a road is said to be made from the names of travelers who crossed the world before maps existed', 'travel myths, naming motifs, road symbolism, and oral cosmology']
  ],
  'mythic-creatures': [
    ['The Glass Fox That Leaves No Pawprints', 'glass fox no pawprints legend', 'a glass fox crosses frost without leaving pawprints, but windows remember where it passed', 'fox folklore, winter motifs, transformation stories, and creature legends'],
    ['The Sea Horse That Carries Drowned Bells', 'sea horse drowned bells myth', 'a sea horse carries drowned bells along the tide so coastal villages know when fog is coming', 'sea creature lore, bell motifs, coastal folklore, and weather signs'],
    ['The Giant Who Counts Valleys by Echo', 'giant counts valleys echo myth', 'a giant counts valleys by echo and loses one whenever people stop answering the mountains', 'giant lore, echo folklore, mountain myths, and landscape memory'],
    ['The Ash Owl That Knows the Last Door', 'ash owl last door folklore', 'an ash-colored owl is said to know the last door a traveler should never open', 'owl folklore, travel warnings, threshold motifs, and creature omens'],
    ['The Silver Eel Beneath the City Canal', 'silver eel canal myth', 'a silver eel lives beneath a city canal and makes the water turn toward lost streets', 'water creatures, urban waterways, direction myths, and canal folklore'],
    ['The Red Antlered Stag at the Field Edge', 'red antlered stag folklore', 'a stag with red antlers appears at the field edge when a boundary has been moved unfairly', 'stag folklore, boundary customs, rural justice motifs, and creature legends'],
    ['The Paper Crane That Folds Itself at Night', 'paper crane folds itself folklore', 'a paper crane folds itself at night and points its beak toward the person who broke a promise', 'bird symbolism, paper charms, promise folklore, and household creature motifs'],
    ['The Saltwater Cat That Sleeps on Ship Maps', 'saltwater cat ship map folklore', 'a saltwater cat sleeps on ship maps and moves its tail over routes that should be avoided', 'sea folklore, shipboard animals, map warnings, and creature omens'],
    ['The Iron Toad Under the Old Mill Wheel', 'iron toad mill wheel folklore', 'an iron toad under an old mill wheel is said to wake when the river runs backward', 'toad folklore, mill legends, river omens, and industrial rural myth'],
    ['The Lantern Moth That Follows Funeral Roads', 'lantern moth funeral road myth', 'a lantern moth follows funeral roads and glows brighter near houses that forgot a name', 'moth folklore, funeral customs, light motifs, and creature omen stories']
  ],
  'lost-worlds': [
    ['The City That Appears in the Harbor Reflection', 'city in harbor reflection legend', 'a city appears in the harbor reflection at low tide, but no skyline matches it above the water', 'lost city lore, harbor records, reflection motifs, and coastal mapping stories'],
    ['The Island Listed Only in Weather Warnings', 'island only weather warnings', 'an island appears only in old weather warnings and never in navigation charts', 'vanished islands, weather archives, nautical maps, and lost geography folklore'],
    ['The Underground Orchard Beneath the Old Station', 'underground orchard station legend', 'an underground orchard is said to grow beneath a closed station where roots follow the rail tunnels', 'subterranean worlds, transit folklore, plant motifs, and urban legends'],
    ['The Country Marked by a Border Without Land', 'border without land lost world', 'old maps mark a border between two countries, but the land between them is left blank', 'map anomalies, border folklore, lost countries, and cartographic mysteries'],
    ['The Village That Sends Postcards but Has No Road', 'village postcards no road legend', 'postcards arrive from a village that no road map can locate and no postal route admits', 'lost villages, postal records, map gaps, and travel folklore'],
    ['The Valley Heard Only Through Radio Static', 'valley heard through radio static', 'travelers claim a valley can be heard through radio static but never reached by road', 'lost valleys, radio folklore, mountain routes, and signal mysteries'],
    ['The Market That Opens on the Wrong Calendar Day', 'market wrong calendar day legend', 'a market opens on a date missing from local calendars and closes before sunrise', 'lost markets, calendar folklore, trade-route legends, and time motifs'],
    ['The Schoolhouse Printed on One Town Plan', 'schoolhouse one town plan legend', 'a schoolhouse appears on one town plan and in old class photographs, but no foundation is found', 'lost buildings, town plans, school records, and archival mysteries'],
    ['The Canal That Flows Toward a Missing Sea', 'canal toward missing sea legend', 'a canal is drawn flowing toward a sea that has no place on modern maps', 'lost seas, canal maps, vanished geography, and water-route folklore'],
    ['The Desert Gate That Opens Onto a Green Road', 'desert gate green road legend', 'a stone gate in desert stories opens onto a green road travelers remember but cannot redraw', 'lost roads, desert folklore, gate motifs, and imagined geographies']
  ],
  'strange-nature': [
    ['The Field Where Snow Falls in a Circle', 'snow falls in circle field', 'snow falls in a clean circle at the center of a field while the rest of the ground stays dry', 'weather records, farmer accounts, field photographs, and strange nature folklore'],
    ['The Tree Line That Moves After Fog', 'tree line moves after fog', 'a tree line appears several steps closer after fog clears, then returns by morning', 'forest accounts, survey markers, fog records, and landscape folklore'],
    ['The Pond That Reflects Stars at Noon', 'pond reflects stars at noon', 'a pond reflects a pattern like stars at noon even when the sky is clear', 'pond observations, sky reflections, local folklore, and optical explanations'],
    ['The Hill Where Crickets Stop Halfway Up', 'crickets stop halfway hill', 'crickets grow silent halfway up a hill along a boundary no fence marks', 'insect behavior, hillside folklore, sound observations, and local nature stories'],
    ['The Beach Where Footprints Fill With Blue Light', 'footprints blue light beach', 'footprints on a night beach fill with pale blue light before the tide reaches them', 'coastal observations, bioluminescence notes, beach folklore, and night-walk stories'],
    ['The Rain That Leaves One Dry Stone', 'rain leaves one dry stone', 'rain darkens every stone in a ring except one that remains dry through storms', 'weather accounts, stone folklore, field notes, and local observation records'],
    ['The Orchard Where Apples Fall Toward the Wall', 'apples fall toward wall folklore', 'apples in one orchard fall toward the same wall no matter which way the branches lean', 'orchard observations, harvest folklore, wind records, and rural nature legends'],
    ['The River Bend Where Leaves Float Upstream', 'leaves float upstream river bend', 'leaves seem to float upstream around one bend before joining the current again', 'river currents, local stories, seasonal observations, and water folklore'],
    ['The Meadow Where No Shadow Crosses at Noon', 'meadow no shadow noon', 'a meadow is said to swallow shadows at noon when the grass turns a shade lighter', 'light observations, meadow folklore, seasonal notes, and visual mystery records'],
    ['The Pine That Sings Only After Frost', 'pine sings after frost folklore', 'a pine is said to sing after the first frost though no wind moves the needles', 'tree folklore, frost records, acoustic explanations, and winter nature stories']
  ],
  'legendary-places': [
    ['The Mountain Shrine That Refuses a Second Photograph', 'mountain shrine second photograph legend', 'a mountain shrine appears clearly in first photographs but blurs in every second image taken from the same step', 'pilgrim accounts, photo comparisons, shrine folklore, and mountain records'],
    ['The Forbidden Lake With a Shore That Changes Shape', 'forbidden lake changing shore', 'a forbidden lake is said to change its shoreline whenever someone tries to measure it', 'lake folklore, survey stories, sacred-site accounts, and map uncertainty'],
    ['The Ruined Tower That Points Away From North', 'ruined tower points away north', 'a ruined tower casts a noon shadow away from north according to every village retelling', 'ruin folklore, compass stories, shadow observations, and landmark legends'],
    ['The Pilgrim Road That Skips One Milestone', 'pilgrim road missing milestone', 'a pilgrim road skips one milestone and counts it again near the hill chapel', 'pilgrimage records, road markers, chapel folklore, and route legends'],
    ['The Cave Door That Opens Only to Returning Travelers', 'cave door returning travelers legend', 'a cave door is said to open only for travelers who have failed to leave once before', 'cave folklore, return motifs, travel legends, and sacred landscape stories'],
    ['The Bridge of Names No One Reads Aloud', 'bridge of names folklore', 'a legendary bridge has names carved beneath the rail that locals refuse to read aloud', 'bridge folklore, name taboos, local customs, and landmark legends'],
    ['The Temple Courtyard Where Rain Falls Sideways', 'temple courtyard sideways rain', 'rain falls sideways inside a temple courtyard during one annual procession', 'temple records, weather motifs, ritual folklore, and sacred-place legends'],
    ['The Hill Fort Heard Beneath the Grass', 'hill fort heard beneath grass', 'a hill fort is said to hum beneath the grass when people walk the old boundary after dusk', 'fort legends, boundary folklore, acoustic stories, and historical landscape memory'],
    ['The Old Well That Shows a Different Sky', 'old well different sky legend', 'an old well reflects a sky with stars visible during daylight in village retellings', 'well folklore, sky motifs, sacred water, and local legend records'],
    ['The Roadside Stone That Turns Toward Home', 'roadside stone turns home legend', 'a roadside stone is said to turn slightly toward the home of anyone who lies beside it', 'roadside folklore, oath stones, travel customs, and landmark legend motifs']
  ],
  'mythic-objects': [
    ['The Brass Key That Opens Only Empty Rooms', 'brass key opens empty rooms', 'a brass key opens only empty rooms and refuses any door behind which someone is waiting', 'key folklore, threshold objects, household warnings, and object legends'],
    ['The Mirror With a Back Made of Moonlight', 'mirror back made of moonlight', 'a mirror is said to have a back made of moonlight and shows memories only when turned away', 'mirror myths, lunar symbolism, memory folklore, and household object legends'],
    ['The Bell That Rings When a Promise Is Kept', 'bell rings promise kept folklore', 'a small bell rings only when a promise has been kept by someone who never heard it', 'bell folklore, promise motifs, ritual objects, and sound legends'],
    ['The Comb That Straightens a River', 'comb straightens river myth', 'a comb from an old tale straightens a river for one morning before the water curls back', 'comb folklore, water myths, transformation objects, and domestic charm stories'],
    ['The Lantern That Burns Underwater', 'lantern burns underwater legend', 'a lantern burns underwater in stories told by fishers who follow lights beneath the pier', 'lantern legends, water folklore, coastal objects, and light motifs'],
    ['The Book That Opens to the Reader’s Last Question', 'book opens to last question folklore', 'a book opens to the question a reader avoided asking before entering the room', 'book folklore, library objects, question motifs, and reading legends'],
    ['The Needle That Points Toward Forgotten Roads', 'needle points forgotten roads', 'a sewing needle points toward forgotten roads whenever it is placed on an old map', 'needle folklore, map objects, travel motifs, and domestic divination stories'],
    ['The Bowl That Never Holds the Same Reflection', 'bowl never same reflection folklore', 'a ceremonial bowl never holds the same reflection twice in local object stories', 'bowl folklore, ritual objects, reflection motifs, and sacred household traditions'],
    ['The Sword That Grows Heavy Near False Names', 'sword heavy false names myth', 'a sword grows too heavy to lift when a false name is spoken beside it', 'sword myths, name taboos, justice motifs, and legendary weapon stories'],
    ['The Door Knocker That Answers Before It Is Touched', 'door knocker answers before touch', 'a door knocker answers before it is touched and leaves no sound after the visitor enters', 'door objects, threshold folklore, sound motifs, and household legend records']
  ],
  'legend-origins': [
    ['How Elevator Legends Became Modern Threshold Stories', 'elevator legends origin', 'elevator legends turn a mechanical box into a threshold where routine, delay, and private fear meet', 'urban legend comparisons, building folklore, transit history, and recurring threshold motifs'],
    ['Why Receipt Legends Keep Returning in Modern Folklore', 'receipt legends origin', 'receipt legends survive because they make evidence feel ordinary, cheap, and strangely difficult to dismiss', 'receipt stories, consumer folklore, printed evidence, and modern rumor cycles'],
    ['How Vanishing Road Stories Move From Travelers to Maps', 'vanishing road stories origin', 'vanishing road stories shift from personal travel warnings into map rumors and location folklore', 'road legends, map folklore, traveler accounts, and route-motif comparisons'],
    ['Why Mirror Legends Cross From Folklore Into Internet Stories', 'mirror legends origin', 'mirror legends adapt easily because reflection is both old symbolic material and modern image culture', 'mirror folklore, image myths, online retellings, and reflection motifs'],
    ['How Doorway Warnings Become Household Folklore', 'doorway warning folklore origin', 'doorway warnings become durable because the threshold is both a real place and a symbolic boundary', 'threshold customs, household warnings, oral tradition, and protective folklore'],
    ['Why Missing-Record Mysteries Feel More Convincing Than Full Stories', 'missing record mystery origin', 'missing-record mysteries feel convincing because an absence can look like evidence when the surrounding details are specific', 'archive gaps, document folklore, record anomalies, and evidence limits'],
    ['How Weather Omens Become Local Legends', 'weather omen legends origin', 'weather omens become local legends when repeated natural signs gain a fixed place, date, or rule', 'weather folklore, local omens, seasonal stories, and observation motifs'],
    ['Why Object Legends Often Begin With Ordinary Tools', 'object legend origins', 'object legends often begin with tools because everyday use makes a strange rule feel close to believable', 'object folklore, domestic tools, ritual objects, and motif history'],
    ['How Internet Glitches Become Folklore Instead of Error Reports', 'internet glitch folklore origin', 'internet glitches become folklore when users save, retell, and compare them as stories instead of closing the tab', 'digital folklore, platform errors, screenshot culture, and online rumor cycles'],
    ['Why Lost-Place Legends Need Maps Even When the Place Is Uncertain', 'lost place legends maps origin', 'lost-place legends depend on maps because absence becomes visible only when a reader knows where a place should be', 'lost places, map legends, cartographic rumors, and place-motif history']
  ]
};

const guidePlans = [
  ['how-to-read-source-status-before-sharing-a-strange-story', 'How to Read Source Status Before Sharing a Strange Story', 'Source Status Guide', 'source status strange stories', 'A practical guide to checking source labels, evidence limits, and retelling language before sharing a legend, mystery, or folklore record.'],
  ['why-urban-legends-use-ordinary-places', 'Why Urban Legends Use Ordinary Places So Well', 'Urban Legend Settings', 'why urban legends use ordinary places', 'A Mystery Board guide to roads, elevators, parking lots, schools, stores, and other ordinary places that make modern legends feel close.'],
  ['how-internet-folklore-turns-errors-into-stories', 'How Internet Folklore Turns Errors Into Stories', 'Internet Folklore Patterns', 'internet folklore errors into stories', 'A guide to screenshots, timestamps, deleted posts, archives, and platform glitches that become repeatable online folklore.'],
  ['how-to-follow-map-mysteries-and-lost-place-records', 'How to Follow Map Mysteries and Lost-Place Records', 'Map Mystery Guide', 'map mysteries lost places guide', 'A calm reading guide for lost cities, missing roads, map gaps, strange coordinates, and places that survive through records.'],
  ['why-mythic-objects-work-as-story-anchors', 'Why Mythic Objects Work as Story Anchors', 'Mythic Object Guide', 'mythic objects folklore guide', 'A guide to keys, bells, mirrors, swords, books, lanterns, and objects that carry memory, warning, and symbolic power.'],
  ['how-to-read-folklore-without-flattening-it-into-fact', 'How to Read Folklore Without Flattening It Into Fact', 'Folklore Reading Guide', 'how to read folklore source aware', 'A guide to reading oral tradition, local belief, symbolic motifs, and retellings without turning every story into a literal claim.'],
  ['why-strange-nature-stories-need-careful-evidence', 'Why Strange Nature Stories Need Careful Evidence', 'Strange Nature Evidence', 'strange nature stories evidence', 'A Mystery Board guide to weather records, animal behavior, landscape observation, local memory, and nature folklore limits.'],
  ['how-to-build-a-reading-path-through-the-strange-archive', 'How to Build a Reading Path Through The Strange Archive', 'Archive Reading Path', 'strange archive reading path', 'A practical guide to moving from categories to tags, from story maps to source notes, and from one recurring motif to another.'],
  ['why-mystery-articles-should-name-the-limit', 'Why Mystery Articles Should Name the Limit Instead of Solving Too Much', 'Evidence Limit Guide', 'mystery articles evidence limits', 'A guide to preserving mystery responsibly by naming what can be checked, what cannot, and where speculation begins.'],
  ['how-to-use-tags-without-creating-thin-archive-pages', 'How to Use Tags Without Creating Thin Archive Pages', 'Tag Strategy Guide', 'tag archive pages noindex guide', 'A guide to using tags as internal paths while keeping thin tag pages out of the sitemap until they have enough connected records.']
];

let addedStories = 0;
let addedGuides = 0;

for (const category of categories) {
  const plans = categoryPlans[category.slug] || [];
  const relatedPool = existingByCategory.get(category.slug) || [];
  plans.slice(0, 10).forEach((plan, index) => {
    const story = makeStory(category, plan, index, relatedPool);
    if (storySlugs.has(story.slug)) return;
    stories.unshift(story);
    storySlugs.add(story.slug);
    relatedPool.unshift(story.slug);
    addedStories += 1;
  });
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
  const subject = title.split(':')[0].replace(/^The\s+/i, 'The ').trim();
  const primaryTag = primaryTagFor(category, index);
  const tags = tagsFor(category, primaryTag, index);
  const excerpt = excerptFor(category, detail, index);
  const sourceStatus = `${category.title} / ${primaryTag} / Source-aware record`;
  const storyType = storyTypeFor(category);
  const readTime = `${8 + (index % 3)} min read`;

  return {
    id: slug,
    slug,
    title,
    displayTitle: title,
    seoTitle: title,
    metaTitle: title,
    metaDescription: `${excerpt} A source-aware Kyunolab record about ${primaryTag.toLowerCase()}, recurring motifs, evidence limits, and why the story remains readable.`,
    category: category.title,
    categorySlug: category.slug,
    categoryGroup: category.group,
    tag: primaryTag,
    primaryTag,
    seedKeyword,
    searchIntent: searchIntentFor(category),
    articleFormat: articleFormatFor(category),
    cluster: `${category.title} / ${primaryTag}`,
    relatedKeywords: relatedKeywordsFor(seedKeyword, primaryTag, category.title),
    topicScore: 78 + (index % 9),
    topicStatus: 'approved',
    scoreBreakdown: {
      searchDemand: 24 + (index % 4),
      clickCuriosity: 20 + (index % 3),
      siteFit: 18,
      expansionPotential: 11,
      differentiation: 7
    },
    summaryAnswer: `${subject} is a source-aware ${category.title.toLowerCase()} record about ${detail}. It is not presented as verified fact; the useful reading is how the setting, motif, and evidence limits make the story worth preserving.`,
    readTime,
    storyType,
    sourceStatus,
    excerpt,
    publishedAt: '2026-07-03',
    updatedAt: '2026-07-03',
    relatedStoryIds: relatedPool.filter((item) => item !== slug).slice(0, 3),
    tags,
    detail,
    evidence
  };
}

function makeGuide(plan, index) {
  const [slug, title, tag, seedKeyword, excerpt] = plan;
  const relatedStoryIds = stories.slice(index * 3, index * 3 + 3).map((story) => story.slug);
  const relatedGuideIds = guides.slice(0, 3).map((guide) => guide.slug).filter((id) => id !== slug);
  const sectionSeed = title.replace(/^[^:]+:\s*/, '');

  return {
    id: slug,
    slug,
    title,
    shortTitle: title.replace(/^How to /, '').replace(/^Why /, ''),
    metaTitle: title,
    metaDescription: excerpt,
    ogTitle: title,
    ogDescription: excerpt,
    excerpt,
    deck: `${title} is a practical Mystery Board guide for readers who want to move through The Strange Archive with more context, cleaner source awareness, and stronger internal reading paths.`,
    category: 'Mystery Board',
    categorySlug: 'mystery-board',
    tag,
    tags: [tag, 'Archive Method', 'Source Status', 'Reading Path', 'Story Structure'].slice(0, 5),
    bestFor: 'Readers who want a clearer way to navigate strange records without confusing atmosphere with proof',
    readTime: `${9 + (index % 3)} min read`,
    url: `/mystery-board/${slug}`,
    publishedAt: '2026-07-03',
    updatedAt: '2026-07-03',
    relatedStoryIds,
    relatedGuideIds,
    sections: [
      section('what-this-guide-is-for', `What this guide is for`, `This guide helps readers understand ${sectionSeed.toLowerCase()} without treating every strange claim as confirmed fact. It gives the archive a practical reading path instead of leaving readers to move by headline alone.`, `The point is not to remove mystery. The point is to make the mystery readable: what is documented, what is repeated, what is interpreted, and what remains only a story pattern.`),
      section('why-the-distinction-matters', `Why the distinction matters`, `Legends, folklore, internet rumors, and source-aware mystery records can all be valuable, but they do not carry the same evidence weight. A careful article names the kind of material before asking readers to trust it.`, `That distinction helps both readers and search engines. It keeps verified context separate from unverified tradition, and it makes the site feel like an archive rather than a pile of claims.`),
      section('how-to-use-it-in-the-archive', `How to use this inside the archive`, `Start with the category, then follow the tags and Story Map. If a record feels related, check whether the connection is setting, motif, source status, or evidence type.`, `This method lets one page lead naturally to another without forcing every article to solve the same question or repeat the same explanation.`),
      section('what-to-watch-for', `What to watch for`, `Be careful with pages that sound certain but cannot name sources, dates, versions, or limits. The most useful strange records often say exactly where the evidence becomes thin.`, `A strong archive page can remain atmospheric while still showing restraint. It should make the reader curious, not misled.`),
      section('where-to-go-next', `Where to go next`, `Read this guide alongside [[${stories[index]?.title || stories[0].title}|/stories/${stories[index]?.slug || stories[0].slug}]] and then compare it with the broader [[Story & Source Notice|/fiction-disclaimer.html]].`, `The best reading path is usually small: one guide, one article, one source note, then a related record with a similar motif.`)
    ],
    faq: [
      { question: `Is ${tag.toLowerCase()} the same as proof?`, answer: `No. It is a reading or navigation label. It helps organize the archive, but it does not prove the claim inside a story.` },
      { question: 'Why does Kyunolab use guide pages?', answer: 'Guide pages explain how to read the archive, how source status works, and how related records connect without turning every legend into a factual claim.' },
      { question: 'Should these guides replace article source notes?', answer: 'No. Guides explain the method. Individual article source notes still describe the limits of each specific record.' },
      { question: 'How should readers use this page?', answer: 'Use it as a map. Follow one concept into related stories, then check each article category, tags, source status, and Story & Source Note.' }
    ],
    sourceNote: 'This Mystery Board guide is an editorial reading aid. It explains archive structure and source-aware reading, not the verified truth of any individual legend, mystery, or folklore claim.'
  };
}

function section(id, title, a, b) {
  return { id, title, nav: title.replace(/^What /, 'What ').slice(0, 34), paragraphs: [a, b] };
}

function primaryTagFor(category, index) {
  const tags = {
    'urban-legends': ['Threshold Legend', 'Public Space Rumor', 'Transit Folklore', 'Object Legend', 'Building Legend'],
    'internet-folklore': ['Digital Folklore', 'Screenshot Culture', 'Platform Glitch', 'Archived Page', 'Online Rumor'],
    'strange-places': ['Impossible Room', 'Map Anomaly', 'Transit Place', 'Local Place Legend', 'Hidden Passage'],
    'unexplained-mysteries': ['Record Gap', 'Timestamp Mystery', 'Document Anomaly', 'Institutional Mystery', 'Evidence Limit'],
    'classic-folklore': ['Household Folklore', 'Threshold Custom', 'Weather Omen', 'Domestic Ritual', 'Oral Tradition'],
    'modern-legends': ['Modern Legend', 'Service Industry Legend', 'Transit Sighting', 'Workplace Folklore', 'Machine Rumor'],
    myths: ['Origin Myth', 'Sky Myth', 'Water Myth', 'Season Myth', 'Symbolic Myth'],
    'mythic-creatures': ['Creature Folklore', 'Omen Creature', 'Sea Creature', 'Forest Figure', 'Boundary Creature'],
    'lost-worlds': ['Lost Place', 'Map Mystery', 'Vanished Island', 'Unmapped Road', 'Hidden World'],
    'strange-nature': ['Weather Folklore', 'Landscape Anomaly', 'Sound Boundary', 'Water Phenomenon', 'Seasonal Omen'],
    'legendary-places': ['Sacred Place', 'Pilgrim Route', 'Forbidden Lake', 'Ruined Landmark', 'Oath Stone'],
    'mythic-objects': ['Mythic Object', 'Threshold Object', 'Mirror Folklore', 'Bell Legend', 'Ritual Tool'],
    'legend-origins': ['Legend Origin', 'Motif History', 'Source Pattern', 'Folklore Development', 'Modern Motif']
  };
  return (tags[category.slug] || ['Archive Record'])[index % 5];
}

function tagsFor(category, primaryTag, index) {
  const groupTag = category.group === 'Modern Strange Records' ? 'Modern Folklore' : category.group === 'Mythic & Imagined Realms' ? 'Mythic Pattern' : 'Archive Method';
  const motifTags = ['Evidence Limit', 'Recurring Motif', 'Source Status', 'Local Memory', 'Reading Path'];
  return [primaryTag, groupTag, motifTags[index % motifTags.length], motifTags[(index + 2) % motifTags.length]].filter((tag, tagIndex, all) => all.indexOf(tag) === tagIndex).slice(0, 5);
}

function storyTypeFor(category) {
  if (category.slug === 'legend-origins') return 'Legend Origin Guide';
  if (category.slug.includes('myth')) return 'Mythic Record';
  if (category.slug.includes('folklore')) return 'Folklore Record';
  if (category.slug.includes('mysteries')) return 'Mystery Record';
  return 'Source-Aware Legend';
}

function sourceStatusFor(category) {
  return `${category.title} / Source-aware retelling / Evidence-limited record`;
}

function searchIntentFor(category) {
  if (category.slug === 'legend-origins') return 'origin';
  if (category.slug.includes('internet')) return 'internet folklore';
  if (category.slug.includes('place') || category.slug.includes('world')) return 'place legend';
  if (category.slug.includes('myth')) return 'meaning';
  return 'legend';
}

function articleFormatFor(category) {
  return category.slug === 'legend-origins' ? 'search-info' : category.group === 'Mythic & Imagined Realms' ? 'story-archive' : 'search-info';
}

function excerptFor(category, detail, index) {
  const openings = [
    'A quiet record built around',
    'A source-aware entry following',
    'A strange archive note about',
    'A careful reading of',
    'A folklore-minded record centered on'
  ];
  return `${openings[index % openings.length]} ${detail}.`;
}

function relatedKeywordsFor(seedKeyword, primaryTag, categoryTitle) {
  return [
    seedKeyword,
    `${primaryTag.toLowerCase()} meaning`,
    `${categoryTitle.toLowerCase()} source status`,
    `${primaryTag.toLowerCase()} folklore`
  ];
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/['’]/g, '')
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
