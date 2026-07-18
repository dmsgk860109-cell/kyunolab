const fs = require('fs');
const path = require('path');
const { buildContentDNA } = require('./article-dna-utils');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const categoriesPath = path.join(root, 'data', 'categories.json');
const publishedAt = '2026-07-16';

const stories = readJson(storiesPath);
const categories = readJson(categoriesPath);
const storySlugs = new Set(stories.map((story) => story.slug));
const existingQueries = new Set(stories.map((story) => story.contentDNA?.canonicalQuery).filter(Boolean).map((query) => query.toLowerCase().trim()));

const recordPlans = {
  'urban-legends': [
    topic('the-school-attendance-record-with-one-extra-name', 'The School Attendance Record With One Extra Name', 'a classroom attendance sheet lists one extra name that no teacher can match to a student', 'attendance records, school office notes, yearbook checks, and classroom rumor cycles', 'School Record Legend', ['Attendance Sheet', 'Extra Name', 'Classroom Folklore']),
    topic('the-police-incident-log-from-a-call-never-made', 'The Police Incident Log From a Call Never Made', 'a station incident log summarizes a call that dispatch records say never arrived', 'dispatch logs, station records, neighborhood accounts, and administrative folklore', 'Incident Log Legend', ['Police Log', 'Missing Call', 'Urban Rumor']),
    topic('the-lost-and-found-book-that-adds-items-overnight', 'The Lost-and-Found Book That Adds Items Overnight', 'a public lost-and-found register gains new entries after the desk has closed', 'lost-and-found books, staff notes, object records, and public-building legends', 'Register Legend', ['Lost And Found', 'Overnight Entry', 'Public Building Folklore']),
    topic('the-hotel-guestbook-signed-before-arrival', 'The Hotel Guestbook Signed Before Arrival', 'a hotel guestbook carries a signature dated hours before the guest checked in', 'guestbooks, booking records, staff memories, and hotel folklore', 'Guestbook Legend', ['Hotel Guestbook', 'Wrong Time', 'Check-In Legend']),
    topic('the-cemetery-register-with-a-page-that-stays-warm', 'The Cemetery Register With a Page That Stays Warm', 'a cemetery register contains one page that feels warm whenever a certain family name is read', 'burial registers, caretaker accounts, family records, and cemetery legends', 'Cemetery Register Legend', ['Burial Register', 'Family Name', 'Graveyard Folklore']),
    topic('the-train-delay-log-that-predicted-the-fog', 'The Train Delay Log That Predicted the Fog', 'a rail delay log names fog as the cause before the weather report records it', 'station logs, weather reports, passenger accounts, and transit folklore', 'Transit Log Legend', ['Train Delay', 'Fog Record', 'Station Rumor']),
    topic('the-library-due-date-stamp-from-a-closed-year', 'The Library Due-Date Stamp From a Closed Year', 'a library book receives a due-date stamp from a year when the branch was closed', 'loan records, branch histories, stamped slips, and library folklore', 'Library Stamp Legend', ['Due Date', 'Closed Branch', 'Library Record']),
    topic('the-apartment-maintenance-form-for-a-nonexistent-unit', 'The Apartment Maintenance Form for a Nonexistent Unit', 'a building maintenance request names an apartment unit missing from the floor plan', 'maintenance forms, floor plans, tenant accounts, and apartment legends', 'Maintenance Record Legend', ['Missing Unit', 'Work Order', 'Building Folklore']),
    topic('the-cafe-order-ticket-that-printed-a-name-no-one-gave', 'The Cafe Order Ticket That Printed a Name No One Gave', 'a cafe order ticket prints a customer name before anyone says it aloud', 'order tickets, receipt systems, staff memories, and service-counter folklore', 'Receipt Legend', ['Order Ticket', 'Unknown Name', 'Cafe Folklore']),
    topic('the-town-meeting-minutes-that-mention-tomorrow', 'The Town Meeting Minutes That Mention Tomorrow', 'official meeting minutes refer to a motion that would not be proposed until the next day', 'meeting minutes, municipal calendars, clerk notes, and civic legends', 'Minutes Legend', ['Meeting Minutes', 'Wrong Date', 'Town Record'])
  ],
  'internet-folklore': [
    topic('the-chat-log-that-kept-one-deleted-message', 'The Chat Log That Kept One Deleted Message', 'an exported chat log preserves one message that every screen in the app shows as deleted', 'exported messages, deletion notices, screenshots, and digital folklore', 'Chat Log Folklore', ['Deleted Message', 'Exported Chat', 'Digital Record']),
    topic('the-cloud-backup-folder-dated-before-the-account', 'The Cloud Backup Folder Dated Before the Account', 'a cloud backup folder carries a creation date older than the account itself', 'backup metadata, account histories, screenshots, and platform rumor', 'Cloud Archive Legend', ['Cloud Backup', 'Impossible Date', 'Metadata Folklore']),
    topic('the-wiki-edit-history-with-a-user-who-never-existed', 'The Wiki Edit History With a User Who Never Existed', 'a wiki page revision history credits an editor absent from the user database', 'revision histories, user logs, cached pages, and wiki folklore', 'Revision History Legend', ['Wiki Edit', 'Missing User', 'Online Archive']),
    topic('the-forum-thread-indexed-before-it-was-posted', 'The Forum Thread Indexed Before It Was Posted', 'a forum thread appears in search results before its first visible post time', 'search snippets, forum timestamps, cache records, and internet rumor', 'Forum Timestamp Legend', ['Forum Thread', 'Search Cache', 'Digital Folklore']),
    topic('the-private-playlist-log-with-an-unknown-listener', 'The Private Playlist Log With an Unknown Listener', 'a private playlist shows one listener history entry from an account no one invited', 'playlist logs, privacy settings, account histories, and platform folklore', 'Platform Log Legend', ['Playlist Log', 'Unknown Listener', 'Streaming Folklore']),
    topic('the-app-crash-report-that-described-the-room', 'The App Crash Report That Described the Room', 'a phone crash report includes a phrase that seems to describe the room around the device', 'crash reports, device logs, user screenshots, and software folklore', 'Crash Report Legend', ['App Log', 'Room Detail', 'Device Folklore']),
    topic('the-deleted-photo-album-that-still-had-a-caption-index', 'The Deleted Photo Album That Still Had a Caption Index', 'a deleted photo album leaves behind a searchable caption index after every image is gone', 'album metadata, search results, deletion records, and visual folklore', 'Photo Archive Legend', ['Deleted Album', 'Caption Index', 'Image Folklore']),
    topic('the-video-watch-history-with-one-impossible-second', 'The Video Watch History With One Impossible Second', 'a video account history records one extra second beyond the length of the uploaded clip', 'watch histories, upload metadata, platform dashboards, and online legend', 'Watch History Legend', ['Video History', 'Extra Second', 'Platform Record']),
    topic('the-shared-map-history-that-added-a-route-home', 'The Shared Map History That Added a Route Home', 'a shared map history adds a route to a home address never entered into the account', 'map histories, route logs, device permissions, and location folklore', 'Map Log Folklore', ['Map History', 'Route Home', 'Location Folklore']),
    topic('the-server-status-page-that-logged-a-midnight-visitor', 'The Server Status Page That Logged a Midnight Visitor', 'a status page for a private server logs one midnight visit from an unknown region', 'server status pages, access logs, uptime records, and digital witness motifs', 'Server Log Legend', ['Server Status', 'Access Log', 'Midnight Visitor'])
  ],
  'strange-places': [
    topic('the-station-map-archive-with-a-platform-no-one-built', 'The Station Map Archive With a Platform No One Built', 'an old station map archive shows a platform missing from every construction record', 'station maps, construction files, passenger accounts, and transit-place legends', 'Map Archive Legend', ['Station Map', 'Missing Platform', 'Transit Place']),
    topic('the-hospital-floor-directory-with-one-erased-wing', 'The Hospital Floor Directory With One Erased Wing', 'a hospital directory contains the outline of a wing removed from later plans', 'floor directories, renovation plans, staff accounts, and institutional folklore', 'Directory Legend', ['Hospital Wing', 'Floor Plan', 'Erased Record']),
    topic('the-town-archive-box-marked-for-a-street-that-is-not-there', 'The Town Archive Box Marked for a Street That Is Not There', 'a town archive box preserves records for a street absent from every map', 'archive boxes, map records, council files, and local place legends', 'Town Archive Legend', ['Archive Box', 'Missing Street', 'Local History']),
    topic('the-museum-visitor-ledger-for-a-locked-gallery', 'The Museum Visitor Ledger for a Locked Gallery', 'a museum visitor ledger lists entries for a gallery closed to the public that day', 'visitor ledgers, gallery schedules, staff notes, and museum folklore', 'Visitor Ledger Legend', ['Museum Ledger', 'Locked Gallery', 'Institutional Legend']),
    topic('the-lighthouse-logbook-from-an-inland-room', 'The Lighthouse Logbook From an Inland Room', 'a lighthouse logbook is found in a room miles from the coast with entries still in sequence', 'logbooks, coastal records, property histories, and place mystery', 'Logbook Place Legend', ['Lighthouse Logbook', 'Inland Room', 'Coastal Folklore']),
    topic('the-motel-register-for-a-room-behind-the-office-wall', 'The Motel Register for a Room Behind the Office Wall', 'a motel register assigns a guest to a room whose door would be behind a solid wall', 'motel registers, building plans, staff accounts, and roadside folklore', 'Motel Register Legend', ['Motel Register', 'Hidden Room', 'Roadside Place']),
    topic('the-subway-maintenance-file-for-a-sealed-staircase', 'The Subway Maintenance File for a Sealed Staircase', 'a subway maintenance file schedules work on a staircase sealed before the line opened', 'maintenance files, station diagrams, worker accounts, and underground legends', 'Maintenance File Legend', ['Sealed Staircase', 'Subway File', 'Underground Place']),
    topic('the-resort-guest-list-with-a-cabin-across-the-lake', 'The Resort Guest List With a Cabin Across the Lake', 'a resort guest list includes a cabin name that appears only in reflections across the lake', 'guest lists, resort maps, lake photographs, and vacation-place folklore', 'Guest List Legend', ['Resort Record', 'Lake Cabin', 'Reflection Place']),
    topic('the-courthouse-room-index-with-a-door-number-too-high', 'The Courthouse Room Index With a Door Number Too High', 'a courthouse room index lists a door number beyond the building range', 'room indexes, courthouse plans, clerk accounts, and civic-place legends', 'Room Index Legend', ['Courthouse Index', 'Door Number', 'Civic Folklore']),
    topic('the-ferry-terminal-record-for-a-pier-underwater', 'The Ferry Terminal Record for a Pier Underwater', 'a ferry terminal record assigns boarding to a pier that tide charts place underwater', 'terminal logs, tide charts, route maps, and waterside place legend', 'Terminal Record Legend', ['Ferry Record', 'Underwater Pier', 'Harbor Folklore'])
  ],
  'unexplained-mysteries': [
    topic('the-census-sheet-with-one-house-counted-twice', 'The Census Sheet With One House Counted Twice', 'a census sheet counts one house twice under two different household names', 'census sheets, address registers, clerk notes, and evidence limits', 'Census Mystery', ['Census Sheet', 'Duplicate House', 'Record Gap']),
    topic('the-shipping-ledger-for-a-crate-with-no-weight', 'The Shipping Ledger for a Crate With No Weight', 'a shipping ledger records a crate number, destination, and seal but no weight', 'shipping ledgers, dock records, seal numbers, and maritime uncertainty', 'Shipping Ledger Mystery', ['Shipping Ledger', 'Missing Weight', 'Cargo Record']),
    topic('the-court-file-with-a-page-number-that-skips-backward', 'The Court File With a Page Number That Skips Backward', 'a court file page sequence reverses once without any missing page marker', 'court files, page stamps, clerk procedures, and archive discrepancies', 'Court File Mystery', ['Court File', 'Page Number', 'Archive Gap']),
    topic('the-weather-log-signed-during-an-evacuation', 'The Weather Log Signed During an Evacuation', 'a weather log is signed at a station after all staff were recorded as evacuated', 'weather logs, evacuation records, station rosters, and timing limits', 'Weather Log Mystery', ['Weather Log', 'Evacuation Record', 'Timing Mystery']),
    topic('the-passenger-list-with-a-name-printed-in-a-different-ink', 'The Passenger List With a Name Printed in a Different Ink', 'a passenger list contains one name printed in ink not used elsewhere on the sheet', 'passenger lists, ink comparison, ticket records, and manifest gaps', 'Passenger List Mystery', ['Passenger List', 'Different Ink', 'Manifest Record']),
    topic('the-inventory-card-for-an-object-with-no-shelf', 'The Inventory Card for an Object With No Shelf', 'an inventory card describes an object whose shelf location never existed', 'inventory cards, collection maps, staff notes, and catalog uncertainty', 'Inventory Card Mystery', ['Inventory Card', 'Missing Shelf', 'Collection Record']),
    topic('the-birth-register-entry-with-no-family-line', 'The Birth Register Entry With No Family Line', 'a birth register entry gives a time and place but leaves the family line blank', 'birth registers, civil records, local histories, and missing-data limits', 'Register Mystery', ['Birth Register', 'Blank Line', 'Civil Record']),
    topic('the-observatory-notebook-with-an-extra-star-count', 'The Observatory Notebook With an Extra Star Count', 'an observatory notebook lists one extra counted object not repeated in later charts', 'notebooks, star charts, observation times, and astronomy records', 'Observatory Notebook Mystery', ['Observatory Notebook', 'Star Count', 'Scientific Record']),
    topic('the-fire-report-that-named-a-building-before-it-burned', 'The Fire Report That Named a Building Before It Burned', 'a fire report draft contains a building name before the reported incident time', 'fire reports, dispatch records, draft timestamps, and administrative uncertainty', 'Fire Report Mystery', ['Fire Report', 'Draft Timestamp', 'Incident Record']),
    topic('the-archive-call-slip-requested-by-an-unknown-reader', 'The Archive Call Slip Requested by an Unknown Reader', 'an archive call slip requests a file under a reader number not issued by the desk', 'call slips, reader registers, staff notes, and archive mystery', 'Call Slip Mystery', ['Archive Call Slip', 'Unknown Reader', 'Reading Room Record'])
  ],
  'classic-folklore': [
    topic('the-household-ledger-kept-beside-the-hearth', 'The Household Ledger Kept Beside the Hearth', 'a household ledger is kept near the hearth to mark debts, visits, and unspoken warnings', 'household ledgers, hearth customs, family sayings, and domestic folklore', 'Household Ledger Folklore', ['Household Ledger', 'Hearth Custom', 'Family Record']),
    topic('the-village-birth-book-bound-with-red-thread', 'The Village Birth Book Bound With Red Thread', 'a village birth book is bound with red thread so names will not wander from their families', 'birth books, red-thread beliefs, naming customs, and village folklore', 'Birth Book Folklore', ['Birth Book', 'Red Thread', 'Naming Custom']),
    topic('the-harvest-tally-that-left-one-sheaf-uncounted', 'The Harvest Tally That Left One Sheaf Uncounted', 'a harvest tally leaves one sheaf uncounted as a gift to weather, field, or returning luck', 'harvest tallies, field customs, seasonal sayings, and agrarian folklore', 'Harvest Tally Folklore', ['Harvest Tally', 'Uncounted Sheaf', 'Field Custom']),
    topic('the-doorway-visitor-list-written-in-charcoal', 'The Doorway Visitor List Written in Charcoal', 'a doorway visitor list is written in charcoal to remember who crossed the threshold in winter', 'threshold customs, charcoal marks, visitor lists, and oral tradition', 'Visitor List Folklore', ['Doorway List', 'Charcoal Mark', 'Threshold Folklore']),
    topic('the-wedding-register-with-a-blank-witness-line', 'The Wedding Register With a Blank Witness Line', 'a wedding register leaves one witness line blank for luck, memory, or a protective absence', 'wedding registers, witness customs, family accounts, and marriage folklore', 'Wedding Register Folklore', ['Wedding Register', 'Blank Witness', 'Marriage Custom']),
    topic('the-bell-ringers-notebook-that-counted-silence', 'The Bell Ringer’s Notebook That Counted Silence', 'a bell ringer’s notebook counts the nights when no bell should be sounded', 'bell-ringing notes, silence customs, church folklore, and local practice', 'Bell Notebook Folklore', ['Bell Notebook', 'Silence Custom', 'Church Folklore']),
    topic('the-market-credit-book-kept-under-salt', 'The Market Credit Book Kept Under Salt', 'a market credit book is kept under salt to keep debts honest and gossip short', 'market books, salt beliefs, trade customs, and shop folklore', 'Credit Book Folklore', ['Credit Book', 'Salt Custom', 'Market Folklore']),
    topic('the-winter-road-roll-that-marked-safe-footsteps', 'The Winter Road Roll That Marked Safe Footsteps', 'a winter road roll records which footpaths were safe enough to remember after snow', 'road rolls, winter customs, travel sayings, and path folklore', 'Road Roll Folklore', ['Road Roll', 'Safe Footsteps', 'Winter Folklore']),
    topic('the-kitchen-recipe-book-with-a-page-never-turned', 'The Kitchen Recipe Book With a Page Never Turned', 'a kitchen recipe book keeps one page unturned because it belongs to guests who have not arrived', 'recipe books, hospitality customs, kitchen sayings, and household folklore', 'Recipe Book Folklore', ['Recipe Book', 'Unturned Page', 'Kitchen Custom']),
    topic('the-funeral-tally-that-refused-the-final-number', 'The Funeral Tally That Refused the Final Number', 'a funeral tally avoids the final number so grief is not treated as a finished account', 'funeral tallies, number customs, mourning practice, and local folklore', 'Funeral Tally Folklore', ['Funeral Tally', 'Final Number', 'Mourning Custom'])
  ],
  'modern-legends': [
    topic('the-rideshare-trip-record-with-a-stop-no-one-made', 'The Rideshare Trip Record With a Stop No One Made', 'a rideshare trip record adds a stop neither driver nor passenger remembers', 'trip records, GPS traces, app receipts, and modern transit legend', 'Trip Record Legend', ['Rideshare Record', 'Extra Stop', 'App Folklore']),
    topic('the-smart-lock-access-log-from-a-removed-code', 'The Smart Lock Access Log From a Removed Code', 'a smart lock access log records entry by a code deleted the week before', 'access logs, device histories, resident reports, and smart-home folklore', 'Access Log Legend', ['Smart Lock', 'Deleted Code', 'Home Tech Legend']),
    topic('the-office-badge-scan-after-the-employee-left', 'The Office Badge Scan After the Employee Left', 'an office badge scan appears after the employee’s final recorded day', 'badge scans, HR records, security logs, and workplace legend', 'Badge Scan Legend', ['Office Badge', 'Security Log', 'Workplace Folklore']),
    topic('the-parking-app-history-with-a-car-not-owned-yet', 'The Parking App History With a Car Not Owned Yet', 'a parking app history lists a vehicle days before its owner bought it', 'parking histories, vehicle records, app screenshots, and service folklore', 'Parking Record Legend', ['Parking App', 'Future Car', 'Service Record']),
    topic('the-food-order-archive-that-repeated-a-childhood-address', 'The Food Order Archive That Repeated a Childhood Address', 'a food delivery archive restores a childhood address no longer saved in the account', 'order archives, address books, customer reports, and platform legend', 'Order Archive Legend', ['Food Order', 'Old Address', 'Delivery Folklore']),
    topic('the-gym-check-in-ledger-from-a-closed-branch', 'The Gym Check-In Ledger From a Closed Branch', 'a gym check-in ledger records attendance at a branch closed for renovation', 'check-in ledgers, branch schedules, member accounts, and modern rumor', 'Check-In Ledger Legend', ['Gym Ledger', 'Closed Branch', 'Membership Record']),
    topic('the-subscription-renewal-log-for-a-service-never-joined', 'The Subscription Renewal Log for a Service Never Joined', 'a subscription renewal log confirms payment for a service the user never joined', 'renewal logs, account histories, support tickets, and app-era folklore', 'Subscription Log Legend', ['Renewal Log', 'Unknown Service', 'Digital Routine']),
    topic('the-delivery-locker-record-with-a-compartment-too-small', 'The Delivery Locker Record With a Compartment Too Small', 'a delivery locker record assigns a package to a compartment too small to hold it', 'locker records, package dimensions, courier scans, and delivery legend', 'Locker Record Legend', ['Delivery Locker', 'Courier Scan', 'Package Record']),
    topic('the-neighborhood-watch-file-with-the-same-car-twice', 'The Neighborhood Watch File With the Same Car Twice', 'a neighborhood watch file photographs the same car entering from opposite streets at once', 'watch files, street cameras, timestamps, and neighborhood legend', 'Watch File Legend', ['Watch File', 'Same Car', 'Neighborhood Record']),
    topic('the-home-assistant-history-that-transcribed-a-dream', 'The Home Assistant History That Transcribed a Dream', 'a home assistant history records a phrase the owner only remembers from a dream', 'voice histories, device logs, user accounts, and modern household folklore', 'Voice History Legend', ['Assistant History', 'Dream Phrase', 'Home Device'])
  ],
  myths: [
    topic('the-tablet-where-the-dawn-was-first-written', 'The Tablet Where the Dawn Was First Written', 'a mythic tablet records the first dawn before the sky learns how to brighten', 'creation myths, writing symbolism, dawn imagery, and sacred record motifs', 'Sacred Tablet Myth', ['Sacred Tablet', 'First Dawn', 'Creation Record']),
    topic('the-god-who-kept-a-ledger-of-borrowed-fire', 'The God Who Kept a Ledger of Borrowed Fire', 'a god keeps a ledger of every flame borrowed from the heavens and not returned', 'fire myths, divine accounting, cultural gifts, and debt symbolism', 'Divine Ledger Myth', ['Borrowed Fire', 'Divine Ledger', 'Fire Myth']),
    topic('the-river-scroll-that-named-every-return', 'The River Scroll That Named Every Return', 'a river scroll records the names of those who leave and the tide that brings them back', 'river myths, name records, return motifs, and water symbolism', 'River Scroll Myth', ['River Scroll', 'Return Names', 'Water Myth']),
    topic('the-star-catalog-kept-by-the-first-child', 'The Star Catalog Kept by the First Child', 'the first child catalogs the stars so night travelers can borrow their order', 'star myths, child figures, navigation symbolism, and cosmic records', 'Star Catalog Myth', ['Star Catalog', 'First Child', 'Night Guidance']),
    topic('the-stone-roll-of-mountains-not-yet-raised', 'The Stone Roll of Mountains Not Yet Raised', 'a stone roll lists mountains before they rise from the sleeping earth', 'landscape myths, mountain origins, stone records, and world-shaping motifs', 'Stone Roll Myth', ['Stone Roll', 'Mountain Origin', 'Landscape Myth']),
    topic('the-moon-archive-of-unfinished-tides', 'The Moon Archive of Unfinished Tides', 'the moon keeps an archive of tides that stopped before reaching the shore', 'lunar myths, tide symbolism, sea records, and unfinished cycles', 'Moon Archive Myth', ['Moon Archive', 'Unfinished Tide', 'Sea Myth']),
    topic('the-breath-book-of-the-wind-keeper', 'The Breath Book of the Wind Keeper', 'a wind keeper writes each borrowed breath into a book that no storm can close', 'wind myths, breath symbolism, divine records, and weather motifs', 'Breath Book Myth', ['Wind Keeper', 'Breath Book', 'Weather Myth']),
    topic('the-shadow-register-under-the-noon-tree', 'The Shadow Register Under the Noon Tree', 'a noon tree keeps a register of shadows so daylight will not forget the hidden', 'shadow myths, tree symbolism, noon imagery, and cosmic balance', 'Shadow Register Myth', ['Shadow Register', 'Noon Tree', 'Light Myth']),
    topic('the-dream-ledger-of-the-sleeping-giant', 'The Dream Ledger of the Sleeping Giant', 'a sleeping giant’s ledger records the dreams that later become valleys', 'giant myths, dream records, landscape origins, and sleeping-earth motifs', 'Dream Ledger Myth', ['Sleeping Giant', 'Dream Ledger', 'Valley Myth']),
    topic('the-first-calendar-kept-in-a-birds-wing', 'The First Calendar Kept in a Bird’s Wing', 'a bird carries the first calendar in its wing feathers and releases seasons one by one', 'calendar myths, bird symbolism, seasonal order, and origin motifs', 'First Calendar Myth', ['First Calendar', 'Bird Wing', 'Season Myth'])
  ],
  'mythic-creatures': [
    topic('the-archive-moth-that-eats-only-false-dates', 'The Archive Moth That Eats Only False Dates', 'a pale archive moth is said to eat only the dates written incorrectly in old records', 'moth folklore, archive imagery, date symbolism, and corrective creature motifs', 'Archive Creature', ['Archive Moth', 'False Dates', 'Record Folklore']),
    topic('the-ledger-wolf-that-counts-footprints-in-snow', 'The Ledger Wolf That Counts Footprints in Snow', 'a ledger wolf follows winter roads and counts footprints that do not return', 'wolf folklore, winter paths, counting motifs, and snow records', 'Counting Creature', ['Ledger Wolf', 'Footprints', 'Winter Creature']),
    topic('the-ink-horned-stag-of-the-court-records', 'The Ink-Horned Stag of the Court Records', 'an ink-horned stag appears in tales where legal records change after midnight', 'stag symbolism, court records, ink folklore, and justice motifs', 'Ink Creature', ['Ink-Horned Stag', 'Court Records', 'Justice Folklore']),
    topic('the-catalog-serpent-that-guards-missing-shelves', 'The Catalog Serpent That Guards Missing Shelves', 'a catalog serpent coils around shelves that appear only in unfinished inventories', 'serpent folklore, library catalogs, missing shelves, and guardian motifs', 'Catalog Creature', ['Catalog Serpent', 'Missing Shelf', 'Library Folklore']),
    topic('the-register-hare-that-crosses-names-out', 'The Register Hare That Crosses Names Out', 'a swift register hare crosses out names before a journey changes direction', 'hare folklore, naming records, travel omens, and threshold motifs', 'Register Creature', ['Register Hare', 'Crossed Name', 'Travel Omen']),
    topic('the-bell-crane-that-files-the-hour-before-dawn', 'The Bell Crane That Files the Hour Before Dawn', 'a bell crane is said to file the hour before dawn into the rafters of old towers', 'crane symbolism, bell towers, time records, and dawn folklore', 'Time Creature', ['Bell Crane', 'Hour Record', 'Dawn Creature']),
    topic('the-salt-eyed-goat-of-the-market-books', 'The Salt-Eyed Goat of the Market Books', 'a salt-eyed goat appears in market lore when accounts are kept unfairly', 'goat folklore, market books, salt symbolism, and fairness motifs', 'Market Creature', ['Salt-Eyed Goat', 'Market Books', 'Fair Trade']),
    topic('the-map-backed-fish-in-the-captains-log', 'The Map-Backed Fish in the Captain’s Log', 'a map-backed fish is recorded in sea logs before ships lose sight of shore', 'fish folklore, captains logs, maritime maps, and sea-warning motifs', 'Map Creature', ['Map-Backed Fish', 'Captain Log', 'Sea Folklore']),
    topic('the-wax-winged-owl-of-sealed-letters', 'The Wax-Winged Owl of Sealed Letters', 'a wax-winged owl delivers sealed letters in stories about messages never sent', 'owl folklore, sealed letters, messenger motifs, and night records', 'Letter Creature', ['Wax-Winged Owl', 'Sealed Letter', 'Messenger Folklore']),
    topic('the-census-crow-that-remembers-empty-houses', 'The Census Crow That Remembers Empty Houses', 'a census crow returns to empty houses and calls the names once written there', 'crow folklore, census records, empty-house motifs, and memory legends', 'Census Creature', ['Census Crow', 'Empty House', 'Memory Creature'])
  ],
  'lost-worlds': [
    topic('the-atlas-index-for-a-kingdom-that-erased-itself', 'The Atlas Index for a Kingdom That Erased Itself', 'an atlas index keeps one kingdom name after every map page removes the place', 'atlas indexes, erased maps, lost kingdoms, and cartographic folklore', 'Atlas Index Legend', ['Atlas Index', 'Erased Kingdom', 'Lost World']),
    topic('the-ship-register-of-the-harbor-under-the-desert', 'The Ship Register of the Harbor Under the Desert', 'a ship register lists arrivals at a harbor now buried beneath inland sand', 'ship registers, desert lore, vanished seas, and lost-port traditions', 'Lost Harbor Record', ['Ship Register', 'Desert Harbor', 'Lost Port']),
    topic('the-border-ledger-of-a-country-with-no-border', 'The Border Ledger of a Country With No Border', 'a border ledger records crossings into a country missing from political maps', 'border ledgers, phantom states, travel accounts, and map folklore', 'Border Ledger Legend', ['Border Ledger', 'Phantom Country', 'Map Legend']),
    topic('the-census-of-the-city-beneath-the-reservoir', 'The Census of the City Beneath the Reservoir', 'a census describes a city now said to lie beneath a reservoir surface', 'census records, drowned-city lore, water maps, and local memory', 'Drowned City Record', ['Drowned City', 'Census Record', 'Reservoir Legend']),
    topic('the-railway-timetable-to-the-unlisted-capital', 'The Railway Timetable to the Unlisted Capital', 'a railway timetable names a capital city absent from official atlases', 'railway timetables, phantom capitals, route maps, and lost-world lore', 'Timetable Legend', ['Railway Timetable', 'Unlisted Capital', 'Lost City']),
    topic('the-pilgrim-roll-of-the-valley-that-cannot-be-entered', 'The Pilgrim Roll of the Valley That Cannot Be Entered', 'a pilgrim roll records visitors to a valley later described as unreachable', 'pilgrim rolls, valley legends, sacred geography, and impossible routes', 'Pilgrim Roll Legend', ['Pilgrim Roll', 'Hidden Valley', 'Sacred Route']),
    topic('the-map-room-catalog-with-one-extra-continent', 'The Map Room Catalog With One Extra Continent', 'a map room catalog lists one extra continent without preserving the map itself', 'map catalogs, lost continents, library records, and geographic myth', 'Map Catalog Legend', ['Map Room', 'Extra Continent', 'Lost Continent']),
    topic('the-tax-records-of-the-village-that-moved-at-night', 'The Tax Records of the Village That Moved at Night', 'tax records follow a village whose location changes across yearly ledgers', 'tax records, moving-village legends, local maps, and administrative folklore', 'Tax Record Legend', ['Tax Records', 'Moving Village', 'Lost Place']),
    topic('the-explorer-notebook-with-two-final-pages', 'The Explorer Notebook With Two Final Pages', 'an explorer notebook ends with two different final pages naming two different hidden lands', 'explorer notebooks, travel lore, manuscript variants, and lost-world traditions', 'Explorer Notebook Legend', ['Explorer Notebook', 'Hidden Land', 'Travel Record']),
    topic('the-orchard-realm-listed-in-a-monastery-inventory', 'The Orchard Realm Listed in a Monastery Inventory', 'a monastery inventory includes an orchard realm among tools, books, and grain stores', 'monastery inventories, orchard myths, hidden realms, and abundance folklore', 'Inventory Realm Legend', ['Monastery Inventory', 'Orchard Realm', 'Hidden World'])
  ],
  'strange-nature': [
    topic('the-rain-gauge-log-that-counted-clear-sky', 'The Rain Gauge Log That Counted Clear Sky', 'a rain gauge log records rainfall during a clear-sky interval witnessed by nearby residents', 'rain logs, weather reports, observer notes, and weather folklore', 'Rain Log Mystery', ['Rain Gauge', 'Clear Sky', 'Weather Record']),
    topic('the-tree-ring-record-with-one-year-missing', 'The Tree Ring Record With One Year Missing', 'a tree-ring record appears to skip one year while nearby trees do not', 'tree-ring studies, field notes, seasonal records, and landscape folklore', 'Tree Ring Record', ['Tree Rings', 'Missing Year', 'Nature Record']),
    topic('the-frost-chart-that-drew-a-straight-line', 'The Frost Chart That Drew a Straight Line', 'a frost chart maps a straight line across a field where frost should have formed unevenly', 'frost charts, field photographs, soil maps, and seasonal folklore', 'Frost Chart Mystery', ['Frost Chart', 'Straight Line', 'Field Folklore']),
    topic('the-bird-count-ledger-with-a-flock-no-one-saw', 'The Bird Count Ledger With a Flock No One Saw', 'a bird count ledger lists a flock absent from every watcher’s notes', 'bird counts, watcher logs, migration records, and animal folklore', 'Bird Count Mystery', ['Bird Count', 'Missing Flock', 'Migration Record']),
    topic('the-river-depth-book-that-measured-a-dry-channel', 'The River Depth Book That Measured a Dry Channel', 'a river depth book records a channel depth on a morning when the bed was reported dry', 'river gauges, depth books, drought records, and water folklore', 'River Depth Record', ['River Depth', 'Dry Channel', 'Water Mystery']),
    topic('the-lightning-map-that-marked-a-silent-hill', 'The Lightning Map That Marked a Silent Hill', 'a lightning map marks a strike on a hill where no sound or burn mark was reported', 'lightning maps, storm reports, hill surveys, and weather legends', 'Lightning Map Mystery', ['Lightning Map', 'Silent Hill', 'Storm Record']),
    topic('the-tide-table-that-added-a-thirteenth-turn', 'The Tide Table That Added a Thirteenth Turn', 'a tide table adds an extra turn not repeated in harbor measurements', 'tide tables, harbor records, lunar cycles, and sea folklore', 'Tide Table Mystery', ['Tide Table', 'Extra Turn', 'Sea Record']),
    topic('the-seed-catalog-entry-for-a-flower-that-bloomed-once', 'The Seed Catalog Entry for a Flower That Bloomed Once', 'a seed catalog preserves an entry for a flower reported to bloom only once after storms', 'seed catalogs, botanical notes, storm lore, and plant folklore', 'Seed Catalog Legend', ['Seed Catalog', 'Storm Flower', 'Plant Folklore']),
    topic('the-cloud-register-that-listed-a-shadow', 'The Cloud Register That Listed a Shadow', 'a cloud register describes a shadow moving across the sky without a matching cloud form', 'cloud registers, observer reports, sky photographs, and weather folklore', 'Cloud Register Mystery', ['Cloud Register', 'Sky Shadow', 'Weather Record']),
    topic('the-field-notebook-that-heard-snow-before-it-fell', 'The Field Notebook That Heard Snow Before It Fell', 'a field notebook records a snow sound hours before the first flakes appear', 'field notebooks, weather stations, local reports, and winter folklore', 'Field Notebook Mystery', ['Field Notebook', 'Snow Sound', 'Winter Record'])
  ],
  'legendary-places': [
    topic('the-shrine-register-of-a-road-that-moved', 'The Shrine Register of a Road That Moved', 'a shrine register records offerings from travelers on a road later mapped elsewhere', 'shrine registers, road maps, offering customs, and place memory', 'Shrine Register Legend', ['Shrine Register', 'Moved Road', 'Place Memory']),
    topic('the-well-log-that-returned-lost-names', 'The Well Log That Returned Lost Names', 'a well log preserves names said to return as echoes from the water', 'well logs, naming customs, local histories, and sacred-place folklore', 'Well Log Legend', ['Well Log', 'Returned Names', 'Sacred Place']),
    topic('the-bridge-toll-book-with-one-unpaid-crossing', 'The Bridge Toll Book With One Unpaid Crossing', 'a bridge toll book keeps one unpaid crossing open across several generations', 'toll books, bridge customs, family accounts, and crossing folklore', 'Toll Book Legend', ['Bridge Toll', 'Unpaid Crossing', 'Crossing Folklore']),
    topic('the-temple-inventory-of-a-door-that-opens-once', 'The Temple Inventory of a Door That Opens Once', 'a temple inventory lists a door believed to open only for a returning procession', 'temple inventories, procession records, door lore, and ritual place', 'Temple Inventory Legend', ['Temple Door', 'Inventory Record', 'Sacred Architecture']),
    topic('the-mountain-path-register-with-reversed-footsteps', 'The Mountain Path Register With Reversed Footsteps', 'a mountain path register describes footprints that face away from every signed entry', 'path registers, mountain lore, pilgrim accounts, and footprint motifs', 'Path Register Legend', ['Mountain Path', 'Reversed Footsteps', 'Pilgrim Record']),
    topic('the-harbor-bell-log-for-a-ship-never-docked', 'The Harbor Bell Log for a Ship Never Docked', 'a harbor bell log records a welcome ring for a ship absent from port books', 'bell logs, port records, maritime memory, and harbor folklore', 'Harbor Bell Legend', ['Harbor Bell', 'Missing Ship', 'Port Record']),
    topic('the-monastery-guest-roll-with-a-room-beneath-the-garden', 'The Monastery Guest Roll With a Room Beneath the Garden', 'a monastery guest roll assigns visitors to a room believed to lie beneath the garden', 'guest rolls, monastery plans, garden legends, and sacred lodging', 'Monastery Roll Legend', ['Guest Roll', 'Garden Room', 'Monastery Folklore']),
    topic('the-sacred-grove-rulebook-with-one-unread-rule', 'The Sacred Grove Rulebook With One Unread Rule', 'a sacred grove rulebook keeps one rule folded shut in every copied version', 'rulebooks, grove customs, copied manuscripts, and ritual landscape', 'Grove Rulebook Legend', ['Sacred Grove', 'Unread Rule', 'Ritual Place']),
    topic('the-cave-chapel-calendar-that-skipped-midsummer', 'The Cave Chapel Calendar That Skipped Midsummer', 'a cave chapel calendar omits midsummer while marking smaller local feast days', 'chapel calendars, cave sites, local rituals, and seasonal place lore', 'Chapel Calendar Legend', ['Cave Chapel', 'Skipped Midsummer', 'Place Calendar']),
    topic('the-crossroads-map-index-with-four-north-roads', 'The Crossroads Map Index With Four North Roads', 'a crossroads map index names four roads as northbound from the same shrine', 'map indexes, shrine roads, traveler accounts, and crossroads folklore', 'Crossroads Index Legend', ['Map Index', 'Four North Roads', 'Crossroads Place'])
  ],
  'mythic-objects': [
    topic('the-iron-ledger-that-closes-only-at-dawn', 'The Iron Ledger That Closes Only at Dawn', 'an iron ledger in legend can be closed only when dawn touches its final page', 'ledger symbolism, dawn motifs, metal objects, and mythic accounting', 'Iron Ledger Object', ['Iron Ledger', 'Dawn Page', 'Mythic Record']),
    topic('the-key-ring-with-a-tag-for-an-unbuilt-door', 'The Key Ring With a Tag for an Unbuilt Door', 'a key ring bears a tag for a door each generation promises but never builds', 'key symbolism, inheritance tales, threshold folklore, and future motifs', 'Key Ring Object', ['Key Ring', 'Unbuilt Door', 'Threshold Object']),
    topic('the-mirror-index-that-lists-the-viewer-last', 'The Mirror Index That Lists the Viewer Last', 'a mirror index lists every reflected room and always leaves the viewer for last', 'mirror folklore, index symbolism, reflection lore, and self-recognition motifs', 'Mirror Index Object', ['Mirror Index', 'Viewer Last', 'Reflection Object']),
    topic('the-bell-book-that-records-sounds-never-rung', 'The Bell Book That Records Sounds Never Rung', 'a bell book records sounds that no bell keeper admits to ringing', 'bell symbolism, sound records, ritual objects, and unseen witness motifs', 'Bell Book Object', ['Bell Book', 'Unrung Sound', 'Ritual Object']),
    topic('the-thread-spool-that-keeps-a-family-register', 'The Thread Spool That Keeps a Family Register', 'a thread spool is said to keep a family register in knots too small to read', 'thread symbolism, family records, knot lore, and domestic object myths', 'Thread Spool Object', ['Thread Spool', 'Family Register', 'Knot Folklore']),
    topic('the-stone-tablet-of-unanswered-oaths', 'The Stone Tablet of Unanswered Oaths', 'a stone tablet records oaths that no one fulfills and grows heavier with each line', 'oath folklore, stone tablets, weight symbolism, and moral objects', 'Stone Tablet Object', ['Stone Tablet', 'Unanswered Oath', 'Moral Object']),
    topic('the-ink-bottle-that-remembers-the-last-signature', 'The Ink Bottle That Remembers the Last Signature', 'an ink bottle is said to remember the final signature written before a departure', 'ink symbolism, signatures, departure customs, and memory objects', 'Ink Bottle Object', ['Ink Bottle', 'Last Signature', 'Memory Object']),
    topic('the-pocket-watch-with-a-second-ledger', 'The Pocket Watch With a Second Ledger', 'a pocket watch contains a second ledger for minutes the owner failed to notice', 'watch symbolism, time records, lost minutes, and personal-object folklore', 'Pocket Watch Object', ['Pocket Watch', 'Second Ledger', 'Time Object']),
    topic('the-sealed-scroll-that-names-the-reader', 'The Sealed Scroll That Names the Reader', 'a sealed scroll in legend names the reader before the seal is opened', 'scroll lore, name magic, sealed documents, and knowledge motifs', 'Sealed Scroll Object', ['Sealed Scroll', 'Reader Name', 'Knowledge Object']),
    topic('the-wooden-stamp-that-marks-returned-things', 'The Wooden Stamp That Marks Returned Things', 'a wooden stamp marks objects that have returned from places no map shows', 'stamp symbolism, returned objects, map folklore, and household records', 'Wooden Stamp Object', ['Wooden Stamp', 'Returned Object', 'Record Tool'])
  ],
  'legend-origins': [
    topic('why-record-books-make-legends-feel-more-believable', 'Why Record Books Make Legends Feel More Believable', 'record books turn rumor into something that looks orderly, dated, and harder to dismiss', 'folklore motif studies, document culture, archive practice, and legend transmission', 'Record Motif', ['Record Books', 'Document Folklore', 'Believability']),
    topic('how-wrong-dates-became-a-folklore-clue', 'How Wrong Dates Became a Folklore Clue', 'wrong dates became compact clues because they make ordinary documents feel out of time', 'date folklore, urban legend structure, document errors, and mystery writing', 'Wrong Date Motif', ['Wrong Date', 'Timestamp Folklore', 'Document Clue']),
    topic('why-ledgers-appear-in-household-warning-stories', 'Why Ledgers Appear in Household Warning Stories', 'ledgers appear in household stories because they connect debt, memory, promise, and consequence', 'household folklore, accounting symbols, moral tales, and domestic customs', 'Ledger Motif', ['Ledgers', 'Household Warning', 'Debt Folklore']),
    topic('how-guestbooks-became-threshold-objects-in-legends', 'How Guestbooks Became Threshold Objects in Legends', 'guestbooks became threshold objects because they record who entered and who may not have left', 'threshold folklore, visitor customs, hotel legends, and written proof motifs', 'Guestbook Motif', ['Guestbooks', 'Threshold Folklore', 'Visitor Record']),
    topic('why-missing-pages-create-strong-mystery-records', 'Why Missing Pages Create Strong Mystery Records', 'missing pages create strong mysteries because absence looks intentional even when the cause is uncertain', 'archive gaps, missing-page motifs, source criticism, and mystery structure', 'Missing Page Motif', ['Missing Pages', 'Archive Gap', 'Mystery Record']),
    topic('how-inventories-turn-objects-into-folklore', 'How Inventories Turn Objects Into Folklore', 'inventories turn objects into folklore when listed items seem to outgrow their shelves, rooms, or owners', 'object folklore, catalog records, museum legends, and classification motifs', 'Inventory Motif', ['Inventories', 'Object Folklore', 'Catalog Record']),
    topic('why-timestamps-feel-like-modern-omens', 'Why Timestamps Feel Like Modern Omens', 'timestamps feel like modern omens because they compress uncertainty into one small visible number', 'digital folklore, time records, omen structure, and platform culture', 'Timestamp Motif', ['Timestamps', 'Modern Omens', 'Digital Record']),
    topic('how-archive-boxes-became-modern-mystery-symbols', 'How Archive Boxes Became Modern Mystery Symbols', 'archive boxes became mystery symbols because they promise order while hiding what cannot be seen', 'archive practice, box labels, institutional folklore, and hidden-record motifs', 'Archive Box Motif', ['Archive Boxes', 'Hidden Records', 'Institutional Folklore']),
    topic('why-signatures-act-like-proof-in-uncertain-stories', 'Why Signatures Act Like Proof in Uncertain Stories', 'signatures act like proof in uncertain stories because they make presence feel personal and dated', 'signature customs, proof motifs, document folklore, and witness patterns', 'Signature Motif', ['Signatures', 'Proof Motif', 'Document Legend']),
    topic('how-checklists-became-part-of-digital-folklore', 'How Checklists Became Part of Digital Folklore', 'checklists became part of digital folklore when completion marks started to look like witnesses', 'interface culture, checklist symbolism, platform records, and digital legend motifs', 'Checklist Motif', ['Checklists', 'Digital Folklore', 'Completion Mark'])
  ]
};

let added = 0;

for (const category of categories) {
  const categoryPlans = recordPlans[category.slug] || [];
  const relatedPool = stories.filter((story) => story.categorySlug === category.slug).map((story) => story.slug);

  for (let index = 0; index < categoryPlans.length; index += 1) {
    const story = makeStory(category, categoryPlans[index], index, relatedPool);
    if (storySlugs.has(story.slug)) continue;

    story.contentDNA = buildContentDNA(story, existingQueries);
    stories.unshift(story);
    storySlugs.add(story.slug);
    relatedPool.unshift(story.slug);
    added += 1;
  }
}

writeJson(storiesPath, stories);
console.log(`Added ${added} record-themed archive stories.`);

function makeStory(category, plan, index, relatedPool) {
  const title = plan.title;
  const slug = slugify(plan.slug || title);
  const primaryTag = plan.primaryTag;
  const tags = unique([primaryTag, ...plan.tags]).slice(0, 5);
  const seedKeyword = slug.replace(/-/g, ' ');
  const subject = title.replace(/:.*$/, '');
  const excerpt = `A source-aware Kyunolab record tracing ${plan.detail}.`;

  return {
    id: slug,
    slug,
    title,
    displayTitle: title,
    h1: `${title}: Record, Meaning, and Folklore Pattern`,
    seoTitle: `${title}: Record, Meaning, and Folklore Pattern`,
    metaTitle: `${title} | Kyunolab Mystery Archive`,
    metaDescription: trimMeta(`${subject} explains ${plan.detail}, with source limits, record motifs, common versions, and why the story still lasts.`),
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
      `${category.title.toLowerCase()} record`
    ]),
    secondaryKeywords: unique([
      `${seedKeyword} origin`,
      `${seedKeyword} meaning`,
      ...tags.map((tag) => tag.toLowerCase())
    ]).slice(0, 6),
    topicScore: 87 + (index % 6),
    topicStatus: 'approved',
    scoreBreakdown: {
      searchDemand: 27,
      clickCuriosity: 25,
      siteFit: 23,
      expansionPotential: 12,
      differentiation: 8
    },
    summaryAnswer: `${subject} is treated as a record-centered archive subject: a legend, motif, mystery, place, object, creature, or myth shaped by written traces, missing entries, dates, ledgers, logs, or catalog gaps.`,
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
    researchSources: researchSourcesFor(plan, category),
    sourceNotes: sourceNotesFor(plan, category),
    contentType: 'story'
  };
}

function topic(slug, title, detail, evidence, primaryTag, tags) {
  return { slug, title, detail, evidence, primaryTag, tags };
}

function researchSourcesFor(plan, category) {
  const subject = plan.title.replace(/:.*$/, '');
  const categorySource = sourceProfile(category.slug);
  return [
    {
      title: categorySource.primary,
      supports: `Provides source-aware context for ${subject} as ${category.title.toLowerCase()} rather than a newly invented certainty.`
    },
    {
      title: `${plan.primaryTag} references, record motifs, and variant-aware archive summaries`,
      supports: `Supports the common record, recurring written-trace motif, and source-limited treatment of ${subject}.`
    },
    {
      title: categorySource.secondary,
      supports: 'Supports the distinction between documented background, retelling tradition, symbolic reading, and claims that should not be stated as verified fact.'
    }
  ];
}

function sourceNotesFor(plan, category) {
  const subject = plan.title.replace(/:.*$/, '');
  return {
    sharedVerifiedPoints: [
      `${subject} is framed as a record-centered archive subject within ${category.title}.`,
      `The article can responsibly describe the recurring motif of logs, ledgers, registers, timestamps, catalogs, or missing entries connected to ${plan.detail}.`,
      `The strongest reading stays within ${plan.evidence} rather than presenting uncertain claims as confirmed fact.`
    ],
    variants: [
      'Names, dates, documents, locations, and written details may shift by region, retelling, or platform.',
      'Later versions often make the record look more precise than the source material can support.'
    ],
    unsupportedClaimsToAvoid: [
      'Do not present supernatural claims as verified events.',
      'Do not invent specific documents, witnesses, dates, institutions, or archive numbers beyond the source-aware premise.',
      'Do not imply that a written trace proves the event happened literally.'
    ]
  };
}

function sourceProfile(slug) {
  const profiles = {
    'urban-legends': {
      primary: 'Urban legend scholarship, modern folklore collections, and document-proof motifs',
      secondary: 'Library of Congress American Folklife Center guidance on folklore documentation'
    },
    'internet-folklore': {
      primary: 'Internet folklore, platform history, metadata culture, and digital trace documentation',
      secondary: 'Media-literacy and fact-checking references for viral online rumors'
    },
    'strange-places': {
      primary: 'Historic-site, local-history, map, directory, and institutional-place references',
      secondary: 'Folklore and travel-writing sources on how place legends circulate'
    },
    'unexplained-mysteries': {
      primary: 'Historical records, official summaries, archive catalogs, and source-critical mystery writing',
      secondary: 'Evidence-limit writing that separates records from later theory'
    },
    'classic-folklore': {
      primary: 'Folktale collections, folklore dictionaries, household records, and regional oral tradition',
      secondary: 'Comparative folklore scholarship on motifs, variants, and symbolic meaning'
    },
    'modern-legends': {
      primary: 'Regional folklore, app-era records, workplace rumor, and modern legend scholarship',
      secondary: 'Technology, media-history, or administrative-record references where relevant'
    },
    myths: {
      primary: 'Comparative mythology, sacred writing motifs, symbolic records, and mythic ordering traditions',
      secondary: 'Literary, ritual, and symbolic interpretation sources for mythic meaning'
    },
    'mythic-creatures': {
      primary: 'Creature-lore references, animal omen traditions, and record-keeping motifs in folklore',
      secondary: 'Cultural-context and comparative folklore references where relevant'
    },
    'lost-worlds': {
      primary: 'Cartographic lore, travel writing, lost-world traditions, and historical reception sources',
      secondary: 'Archaeology, history-of-science, or literary-history references that define source limits'
    },
    'strange-nature': {
      primary: 'Meteorological, botanical, geological, observational, and nature-record references',
      secondary: 'Folklore and cultural-history sources for omen, landscape, and nature-mystery retellings'
    },
    'legendary-places': {
      primary: 'Heritage, public-history, site registers, local records, and sacred-place references',
      secondary: 'Folklore, tourism, and cultural-memory sources on legendary places'
    },
    'mythic-objects': {
      primary: 'Mythology, object folklore, symbolic record tools, and literary-history references',
      secondary: 'Symbolic-interpretation and ritual-object sources'
    },
    'legend-origins': {
      primary: 'Folklore motif studies, legend scholarship, document culture, and comparative tradition references',
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
  if (category.slug === 'unexplained-mysteries') return `${category.title} / ${primaryTag} / Evidence-limited record motif`;
  if (category.slug === 'legend-origins') return `${category.title} / ${primaryTag} / Record motif explanation`;
  if (category.slug.includes('myth')) return `${category.title} / ${primaryTag} / Mythic record tradition and symbolic reading`;
  return `${category.title} / ${primaryTag} / Record-centered folklore archive`;
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
    .replace(/[’]/g, '')
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
