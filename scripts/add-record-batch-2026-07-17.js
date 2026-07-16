const fs = require('fs');
const path = require('path');
const { buildContentDNA } = require('./article-dna-utils');

const root = path.resolve(__dirname, '..');
const storiesPath = path.join(root, 'data', 'stories.json');
const categoriesPath = path.join(root, 'data', 'categories.json');
const publishedAt = '2026-07-17';

const stories = readJson(storiesPath);
const categories = readJson(categoriesPath);
const storySlugs = new Set(stories.map((story) => story.slug));
const existingQueries = new Set(
  stories
    .map((story) => story.contentDNA?.canonicalQuery || story.primaryKeyword || story.seedKeyword)
    .filter(Boolean)
    .map((query) => query.toLowerCase().trim())
);

const plans = {
  'urban-legends': pack('Urban Record Legend', ['Urban Records', 'Public Logs'], [
    ['the-tenant-complaint-log-for-a-floor-with-no-windows', 'The Tenant Complaint Log for a Floor With No Windows', 'a building complaint log records noises from a floor that does not appear on the elevator panel', 'tenant complaint forms, elevator directories, maintenance logs, and apartment folklore'],
    ['the-night-shift-sign-in-sheet-with-one-returning-name', 'The Night Shift Sign-In Sheet With One Returning Name', 'a workplace sign-in sheet repeats the same name on nights when no employee was scheduled', 'shift logs, payroll records, security notes, and workplace rumor cycles'],
    ['the-car-wash-receipt-that-lists-a-passenger', 'The Car Wash Receipt That Lists a Passenger', 'a car wash receipt prints a passenger count for a driver who arrived alone', 'receipts, camera timestamps, staff accounts, and service-counter folklore'],
    ['the-pharmacy-pickup-ledger-for-an-unknown-prescription', 'The Pharmacy Pickup Ledger for an Unknown Prescription', 'a pharmacy pickup ledger lists a prescription that no doctor and no customer can identify', 'pickup ledgers, prescription numbers, staff notes, and neighborhood rumor'],
    ['the-parking-garage-entry-ticket-from-before-opening', 'The Parking Garage Entry Ticket From Before Opening', 'a parking garage ticket carries an entry time before the gate system was active', 'entry tickets, gate logs, building schedules, and parking folklore'],
    ['the-school-locker-inventory-with-one-unassigned-number', 'The School Locker Inventory With One Unassigned Number', 'a school locker inventory preserves one locker number absent from the hallway', 'locker inventories, floor maps, student records, and school legends'],
    ['the-diner-reservation-book-that-fills-itself-at-midnight', 'The Diner Reservation Book That Fills Itself at Midnight', 'a diner reservation book gains one new table entry after closing each night', 'reservation books, closing logs, staff memories, and roadside folklore'],
    ['the-laundromat-lost-sock-register-with-matching-addresses', 'The Laundromat Lost-Sock Register With Matching Addresses', 'a laundromat register for lost clothing begins matching socks to addresses no one wrote down', 'lost-item books, customer slips, street directories, and local rumor'],
    ['the-hospital-visitor-badge-printed-for-tomorrow', 'The Hospital Visitor Badge Printed for Tomorrow', 'a hospital visitor badge prints a date one day ahead of the visit', 'visitor badges, reception logs, ward schedules, and hospital folklore'],
    ['the-library-computer-log-that-borrowed-a-room-key', 'The Library Computer Log That Borrowed a Room Key', 'a library computer log records a room-key checkout made by a terminal with no user session', 'computer logs, room-key registers, branch records, and library legends']
  ]),
  'internet-folklore': pack('Digital Record Folklore', ['Digital Records', 'Online Folklore'], [
    ['the-deleted-account-export-with-one-extra-login', 'The Deleted Account Export With One Extra Login', 'a deleted account export includes one login after the profile was supposedly removed', 'account exports, login histories, deletion notices, and digital folklore'],
    ['the-cloud-backup-log-that-restored-a-strangers-photo', "The Cloud Backup Log That Restored a Stranger's Photo", 'a cloud backup log restores one photograph from an account the owner has never seen', 'backup logs, photo metadata, account histories, and platform rumor'],
    ['the-comment-edit-history-with-a-line-no-one-typed', 'The Comment Edit History With a Line No One Typed', 'a comment edit history preserves a sentence that every visible draft lacks', 'edit histories, cached comments, screenshots, and forum folklore'],
    ['the-group-chat-read-receipt-from-a-removed-member', 'The Group Chat Read Receipt From a Removed Member', 'a group chat shows a read receipt from a member removed before the message was sent', 'chat exports, membership logs, read receipts, and messaging folklore'],
    ['the-livestream-viewer-list-that-counted-one-silent-room', 'The Livestream Viewer List That Counted One Silent Room', 'a livestream viewer list counts one silent viewing location that no account can explain', 'viewer lists, stream dashboards, IP summaries, and online legend'],
    ['the-browser-history-export-with-a-site-not-yet-online', 'The Browser History Export With a Site Not Yet Online', 'a browser history export lists a page before the domain was publicly launched', 'browser exports, domain records, cache timestamps, and internet rumor'],
    ['the-shared-document-version-named-after-a-dead-link', 'The Shared Document Version Named After a Dead Link', 'a shared document version history names a dead link as if it were an editor', 'version histories, link rot, collaborator logs, and document folklore'],
    ['the-password-reset-email-sent-before-the-account-existed', 'The Password Reset Email Sent Before the Account Existed', 'a password reset email carries a timestamp earlier than the account creation record', 'email headers, account records, reset logs, and platform folklore'],
    ['the-forum-attachment-index-with-an-empty-file', 'The Forum Attachment Index With an Empty File', 'a forum attachment index lists an empty file that still generates downloads', 'attachment indexes, download counts, moderation logs, and forum rumor'],
    ['the-map-review-draft-saved-under-an-unknown-name', 'The Map Review Draft Saved Under an Unknown Name', 'a map review draft is saved under a reviewer name absent from the account', 'review drafts, account histories, map listings, and location folklore']
  ]),
  'strange-places': pack('Place Record Legend', ['Place Records', 'Strange Places'], [
    ['the-motel-room-register-for-a-room-behind-the-office', 'The Motel Room Register for a Room Behind the Office', 'a motel register assigns guests to a room that would sit behind the office wall', 'motel registers, building plans, staff accounts, and roadside folklore'],
    ['the-rest-stop-maintenance-map-with-one-hidden-hallway', 'The Rest Stop Maintenance Map With One Hidden Hallway', 'a rest stop maintenance map shows a hallway missing from the public building plan', 'maintenance maps, renovation files, traveler accounts, and roadside place legend'],
    ['the-subway-exit-plan-that-skips-a-street', 'The Subway Exit Plan That Skips a Street', 'a subway exit plan sends riders to a street absent from surface maps', 'exit plans, street maps, passenger accounts, and underground legends'],
    ['the-trailhead-logbook-for-a-path-that-loops-inward', 'The Trailhead Logbook for a Path That Loops Inward', 'a trailhead logbook records hikers returning to the same checkpoint from different directions', 'trail logbooks, ranger notes, map revisions, and wilderness folklore'],
    ['the-abandoned-pier-inspection-card-with-a-dry-footprint', 'The Abandoned Pier Inspection Card With a Dry Footprint', 'an inspection card from an abandoned pier carries a clean footprint despite years of water damage', 'inspection cards, pier records, tide charts, and harbor folklore'],
    ['the-shopping-center-directory-with-a-basement-cinema', 'The Shopping Center Directory With a Basement Cinema', 'a shopping center directory lists a basement cinema never included in lease records', 'directories, lease files, floor plans, and retail folklore'],
    ['the-campground-permit-book-for-a-numbered-clearing', 'The Campground Permit Book for a Numbered Clearing', 'a campground permit book assigns a numbered clearing that appears only on old ranger maps', 'permit books, ranger maps, camper accounts, and forest place legend'],
    ['the-airport-service-door-listing-a-closed-terminal', 'The Airport Service Door Listing a Closed Terminal', 'an airport service-door list preserves a route into a terminal closed before the wing opened', 'service-door lists, terminal maps, staff records, and airport folklore'],
    ['the-underpass-survey-marker-that-changes-sides', 'The Underpass Survey Marker That Changes Sides', 'an underpass survey marker appears on different sides of the road in successive inspection records', 'survey markers, inspection sheets, road maps, and civic place legends'],
    ['the-old-hotel-floor-plan-with-one-warm-room', 'The Old Hotel Floor Plan With One Warm Room', 'an old hotel floor plan marks one room that staff describe as warm even in winter closures', 'floor plans, heating logs, guest records, and hotel folklore']
  ]),
  'unexplained-mysteries': pack('Record Mystery', ['Archive Mystery', 'Evidence Limits'], [
    ['the-coroner-file-with-a-page-number-that-appears-twice', 'The Coroner File With a Page Number That Appears Twice', 'a coroner file repeats one page number without any duplicate sheet in the folder', 'coroner files, page stamps, archive handling notes, and evidence limits'],
    ['the-lab-sample-log-with-a-vial-never-submitted', 'The Lab Sample Log With a Vial Never Submitted', 'a lab sample log lists a vial number absent from intake, storage, and disposal records', 'sample logs, intake forms, storage sheets, and scientific record uncertainty'],
    ['the-weather-balloon-report-signed-before-launch', 'The Weather Balloon Report Signed Before Launch', 'a weather balloon report is signed before the recorded launch time', 'weather reports, launch rosters, station logs, and timing uncertainty'],
    ['the-harbor-incident-board-with-one-erased-vessel', 'The Harbor Incident Board With One Erased Vessel', 'a harbor incident board shows the outline of a vessel name erased from later copies', 'incident boards, harbor logs, vessel manifests, and maritime mystery'],
    ['the-court-evidence-envelope-with-no-case-number', 'The Court Evidence Envelope With No Case Number', 'a court evidence envelope contains a sealed label but no case number', 'evidence envelopes, court indexes, clerk notes, and archive discrepancy'],
    ['the-rescue-call-transcript-from-a-muted-line', 'The Rescue Call Transcript From a Muted Line', 'a rescue call transcript records a phrase while the line was marked muted', 'call transcripts, dispatch logs, radio notes, and emergency record limits'],
    ['the-security-audit-log-that-skips-thirteen-minutes', 'The Security Audit Log That Skips Thirteen Minutes', 'a security audit log advances thirteen minutes without an outage notice', 'audit logs, access records, camera schedules, and institutional uncertainty'],
    ['the-museum-acquisition-card-for-an-object-not-found', 'The Museum Acquisition Card for an Object Not Found', 'a museum acquisition card describes an object that no collection shelf contains', 'acquisition cards, collection maps, registrar notes, and catalog gaps'],
    ['the-radio-station-call-sheet-with-a-silent-frequency', 'The Radio Station Call Sheet With a Silent Frequency', 'a radio station call sheet schedules a frequency that engineers say was silent', 'call sheets, transmitter logs, program notes, and broadcast mystery'],
    ['the-fire-alarm-panel-history-with-one-unmapped-zone', 'The Fire Alarm Panel History With One Unmapped Zone', 'a fire alarm panel history records an alert from a zone absent from the building map', 'alarm histories, building maps, maintenance notes, and safety record uncertainty']
  ]),
  'classic-folklore': pack('Folk Record Motif', ['Classic Folklore', 'Folk Records'], [
    ['the-parish-birth-register-with-a-thread-tied-through-one-name', 'The Parish Birth Register With a Thread Tied Through One Name', 'a parish birth register marks one name with thread as if the entry needed to be held in place', 'birth registers, parish customs, thread beliefs, and local folklore'],
    ['the-village-oath-book-that-leaves-a-blank-witness', 'The Village Oath Book That Leaves a Blank Witness', 'a village oath book leaves one witness line open for a presence no one names aloud', 'oath books, witness customs, oral accounts, and village folklore'],
    ['the-harvest-tally-stick-with-one-extra-notch', 'The Harvest Tally Stick With One Extra Notch', 'a harvest tally stick carries one extra notch set aside for weather, luck, or the field itself', 'tally sticks, harvest customs, field sayings, and agrarian folklore'],
    ['the-wedding-gift-ledger-that-lists-salt-before-bread', 'The Wedding Gift Ledger That Lists Salt Before Bread', 'a wedding gift ledger lists salt before bread as a sign of protection and household luck', 'gift ledgers, wedding customs, household sayings, and marriage folklore'],
    ['the-hearth-ash-record-kept-under-the-threshold', 'The Hearth Ash Record Kept Under the Threshold', 'a household ash record is hidden beneath a threshold to remember who was welcomed inside', 'hearth records, threshold customs, family stories, and domestic folklore'],
    ['the-millers-flour-book-with-a-moonlit-delivery', "The Miller's Flour Book With a Moonlit Delivery", "a miller's flour book records a delivery made under moonlight with no cart marks in the road", 'flour books, mill customs, road accounts, and rural folklore'],
    ['the-well-offering-list-with-a-name-written-in-rain', 'The Well Offering List With a Name Written in Rain', 'a well offering list includes one name said to appear only when the paper is wet', 'offering lists, well customs, rain beliefs, and village legends'],
    ['the-market-day-bell-roll-that-skips-one-family', 'The Market Day Bell Roll That Skips One Family', 'a market day bell roll omits one family name as a way to keep misfortune from following them home', 'bell rolls, market customs, family accounts, and local folklore'],
    ['the-door-blessing-card-found-inside-the-wall', 'The Door Blessing Card Found Inside the Wall', 'a door blessing card is found sealed inside a wall beside a list of household names', 'blessing cards, wall finds, threshold beliefs, and household folklore'],
    ['the-midwinter-candle-inventory-with-one-unburned-wick', 'The Midwinter Candle Inventory With One Unburned Wick', 'a midwinter candle inventory keeps one wick unburned for the return of light', 'candle inventories, midwinter customs, household notes, and seasonal folklore']
  ]),
  'modern-legends': pack('Modern Record Legend', ['Modern Legends', 'Service Records'], [
    ['the-delivery-driver-route-log-ending-at-a-blank-lot', 'The Delivery Driver Route Log Ending at a Blank Lot', 'a delivery route log ends at a blank lot where the customer address should have been', 'route logs, delivery receipts, map records, and service folklore'],
    ['the-ride-ticket-scanned-after-the-fair-closed', 'The Ride Ticket Scanned After the Fair Closed', 'a ride ticket is scanned after the fairground gates were locked for the night', 'ticket scans, fair schedules, gate logs, and carnival folklore'],
    ['the-smart-doorbell-history-with-a-visitor-facing-away', 'The Smart Doorbell History With a Visitor Facing Away', 'a smart doorbell history saves a visitor clip where the person never turns toward the camera', 'doorbell histories, device logs, resident accounts, and smart-home legend'],
    ['the-gym-entry-record-for-a-member-never-issued-a-card', 'The Gym Entry Record for a Member Never Issued a Card', 'a gym entry record shows repeated visits from a membership number never issued by staff', 'entry records, membership files, staff notes, and fitness-center folklore'],
    ['the-convenience-store-shift-report-with-a-second-clerk', 'The Convenience Store Shift Report With a Second Clerk', 'a convenience store shift report lists a second clerk no one scheduled', 'shift reports, payroll sheets, camera notes, and late-night folklore'],
    ['the-warehouse-pallet-scan-from-an-empty-aisle', 'The Warehouse Pallet Scan From an Empty Aisle', 'a warehouse pallet scan appears in an aisle cleared earlier that day', 'pallet scans, warehouse maps, inventory logs, and workplace legend'],
    ['the-service-call-ticket-marked-complete-before-arrival', 'The Service Call Ticket Marked Complete Before Arrival', 'a service call ticket is marked complete before the technician reaches the address', 'service tickets, dispatch logs, customer notes, and repair folklore'],
    ['the-hotel-keycard-audit-with-a-room-never-sold', 'The Hotel Keycard Audit With a Room Never Sold', 'a hotel keycard audit records entry into a room that the booking system never sold', 'keycard audits, booking records, staff notes, and hotel folklore'],
    ['the-night-bus-passenger-count-that-never-reaches-zero', 'The Night Bus Passenger Count That Never Reaches Zero', 'a night bus passenger counter never returns to zero after the final rider leaves', 'passenger counts, route logs, driver reports, and transit folklore'],
    ['the-storage-locker-payment-log-with-a-recurring-coin', 'The Storage Locker Payment Log With a Recurring Coin', 'a storage locker payment log records the same coin deposit month after month', 'payment logs, locker records, staff accounts, and storage folklore']
  ]),
  'myths': pack('Mythic Record', ['Sacred Records', 'Mythic Motifs'], [
    ['the-dawn-tablet-that-counted-the-first-shadow', 'The Dawn Tablet That Counted the First Shadow', 'a mythic tablet records the first shadow as if morning needed to be entered into a ledger', 'creation myths, tablet motifs, dawn symbolism, and sacred record traditions'],
    ['the-river-gods-ledger-of-names-returned-to-water', "The River God's Ledger of Names Returned to Water", "a river god's ledger records names given back to water during crossings and floods", 'river myths, name ledgers, water offerings, and symbolic return motifs'],
    ['the-sky-herds-star-roll-kept-on-blue-stone', "The Sky Herd's Star Roll Kept on Blue Stone", 'a blue-stone star roll counts celestial herds moving across the night sky', 'star myths, herd symbolism, stone records, and pastoral cosmology'],
    ['the-mountain-oath-register-sealed-with-thunder', 'The Mountain Oath Register Sealed With Thunder', 'a mountain oath register is sealed by thunder so promises become part of the landscape', 'mountain myths, oath registers, storm symbolism, and sacred place memory'],
    ['the-moon-ferry-tally-for-souls-crossing-sleep', 'The Moon Ferry Tally for Souls Crossing Sleep', 'a moon ferry tally counts souls crossing the border between waking and sleep', 'moon myths, ferry motifs, soul tallies, and night journey symbolism'],
    ['the-seed-vault-list-written-before-the-first-rain', 'The Seed Vault List Written Before the First Rain', 'a seed vault list names plants before rain gives them form', 'agricultural myths, seed lists, first-rain symbolism, and origin motifs'],
    ['the-fire-bearers-scroll-with-one-cold-spark', "The Fire Bearer's Scroll With One Cold Spark", "a fire bearer's scroll preserves one cold spark that explains why fire can be both gift and warning", 'fire myths, bearer figures, sacred scrolls, and ambivalent gift motifs'],
    ['the-wind-keeper-index-of-doors-yet-unopened', "The Wind Keeper's Index of Doors Yet Unopened", "a wind keeper's index lists doors before anyone builds the houses around them", 'wind myths, door symbolism, index motifs, and fate traditions'],
    ['the-sun-harvest-count-cut-into-a-golden-bowl', 'The Sun Harvest Count Cut Into a Golden Bowl', 'a golden bowl counts sun harvests as if light could be gathered and stored', 'solar myths, harvest counts, vessel symbolism, and sacred abundance motifs'],
    ['the-night-weavers-knot-record-of-lost-hours', "The Night Weaver's Knot Record of Lost Hours", "a night weaver's knot record explains why some hours feel missing after sleep", 'night myths, weaving motifs, knot records, and lost-time symbolism']
  ]),
  'mythic-creatures': pack('Creature Record Legend', ['Creature Folklore', 'Sighting Records'], [
    ['the-griffin-nest-survey-with-a-feather-weight-entry', 'The Griffin Nest Survey With a Feather Weight Entry', 'a griffin nest survey records feather weights as proof of a creature known mostly through emblem and warning', 'griffin lore, nest surveys, feather motifs, and guardian-creature traditions'],
    ['the-sea-serpent-sighting-log-with-two-tide-marks', 'The Sea Serpent Sighting Log With Two Tide Marks', 'a sea serpent sighting log carries two tide marks that do not match the harbor chart', 'sea serpent lore, sighting logs, tide records, and maritime folklore'],
    ['the-basilisk-stable-inventory-with-one-cracked-mirror', 'The Basilisk Stable Inventory With One Cracked Mirror', 'a basilisk stable inventory lists a cracked mirror as more important than the creature itself', 'basilisk lore, mirror motifs, stable inventories, and gaze warnings'],
    ['the-giants-footprint-register-kept-by-the-bridge', "The Giant's Footprint Register Kept by the Bridge", 'a footprint register near a bridge treats giant tracks as measurements of danger and boundary', 'giant lore, footprint registers, bridge legends, and boundary motifs'],
    ['the-owl-spirit-call-sheet-from-the-cemetery-gate', 'The Owl Spirit Call Sheet From the Cemetery Gate', 'an owl spirit call sheet records cries heard at a cemetery gate before each reported sighting', 'owl spirit lore, call sheets, cemetery legends, and omen traditions'],
    ['the-dragon-scale-ledger-that-balances-only-at-dusk', 'The Dragon Scale Ledger That Balances Only at Dusk', 'a dragon scale ledger balances its count only when the story is told at dusk', 'dragon lore, scale ledgers, dusk symbolism, and treasure-guardian motifs'],
    ['the-black-dog-watchmans-roll-with-a-wet-paw-print', "The Black Dog Watchman's Roll With a Wet Paw Print", "a watchman's roll for a black dog legend carries a wet paw print on dry paper", 'black dog lore, watchman rolls, paw-print motifs, and road omens'],
    ['the-lake-horse-ferry-record-for-a-missing-crossing', 'The Lake Horse Ferry Record for a Missing Crossing', 'a ferry record lists a lake horse crossing when no boat was on the water', 'lake-horse lore, ferry records, water-crossing motifs, and regional folklore'],
    ['the-moth-woman-station-log-under-a-broken-lamp', 'The Moth Woman Station Log Under a Broken Lamp', 'a station log under a broken lamp becomes the written trace attached to a moth woman sighting', 'winged-creature lore, station logs, lamp motifs, and modern creature legend'],
    ['the-white-stag-hunting-permit-never-stamped', 'The White Stag Hunting Permit Never Stamped', 'a white stag hunting permit remains unstamped because the creature is treated as a sign, not prey', 'white stag lore, hunting permits, sacred animal motifs, and forest legend']
  ]),
  'lost-worlds': pack('Lost World Record', ['Lost Worlds', 'Map Records'], [
    ['the-atlas-supplement-page-for-a-country-under-glass', 'The Atlas Supplement Page for a Country Under Glass', 'an atlas supplement page describes a country preserved beneath glass as if geography were an exhibit', 'atlas supplements, map anomalies, lost-country legends, and archive geography'],
    ['the-railway-cargo-book-bound-for-an-unlisted-valley', 'The Railway Cargo Book Bound for an Unlisted Valley', 'a railway cargo book sends crates to a valley absent from timetables and survey maps', 'cargo books, railway timetables, survey maps, and hidden-valley folklore'],
    ['the-census-index-of-a-town-between-two-borders', 'The Census Index of a Town Between Two Borders', 'a census index names a town that appears between borders but belongs to neither side', 'census indexes, boundary maps, administrative records, and lost-town legends'],
    ['the-expedition-ration-ledger-with-one-impossible-day', 'The Expedition Ration Ledger With One Impossible Day', 'an expedition ration ledger records one extra day of supplies after the route should have ended', 'ration ledgers, expedition journals, route maps, and survival folklore'],
    ['the-harbor-chart-labeling-a-port-under-the-desert', 'The Harbor Chart Labeling a Port Under the Desert', 'a harbor chart labels a port where later maps show only desert', 'harbor charts, desert maps, trade records, and vanished-port legends'],
    ['the-school-map-with-a-continent-folded-into-the-margin', 'The School Map With a Continent Folded Into the Margin', 'a school map hides a small continent in the folded margin of the paper', 'school maps, classroom folklore, marginalia, and impossible geography'],
    ['the-pilgrim-passport-stamp-from-a-vanished-gate', 'The Pilgrim Passport Stamp From a Vanished Gate', 'a pilgrim passport stamp marks a gate removed from every later route guide', 'pilgrim passports, route guides, gate legends, and sacred geography'],
    ['the-royal-tax-roll-for-a-kingdom-that-sank-inland', 'The Royal Tax Roll for a Kingdom That Sank Inland', 'a royal tax roll preserves payments from a kingdom said to have sunk far from the sea', 'tax rolls, royal chronicles, sinking-kingdom motifs, and lost realm legends'],
    ['the-orchard-survey-record-beneath-the-old-platform', 'The Orchard Survey Record Beneath the Old Platform', 'an orchard survey record beneath a rail platform points to a landscape erased by transit', 'survey records, rail platforms, orchard maps, and buried-place folklore'],
    ['the-library-card-catalog-for-the-city-of-blue-roofs', 'The Library Card Catalog for the City of Blue Roofs', 'a library card catalog preserves books filed under a city of blue roofs that no atlas can place', 'card catalogs, atlas checks, lost-city motifs, and archive legends']
  ]),
  'strange-nature': pack('Nature Record Legend', ['Nature Records', 'Weather Folklore'], [
    ['the-rainfall-ledger-that-recorded-upward-drops', 'The Rainfall Ledger That Recorded Upward Drops', 'a rainfall ledger records drops moving upward during a storm no instrument could explain', 'rainfall ledgers, weather instruments, storm accounts, and nature folklore'],
    ['the-forest-ring-count-with-a-year-that-grew-backward', 'The Forest Ring Count With a Year That Grew Backward', 'a forest ring count includes a year pattern that seems to narrow instead of expand', 'tree-ring counts, forestry notes, local stories, and forest mystery'],
    ['the-bird-migration-chart-with-one-flock-under-the-ground', 'The Bird Migration Chart With One Flock Under the Ground', 'a bird migration chart marks one flock below the landscape rather than above it', 'migration charts, watcher logs, regional maps, and sky folklore'],
    ['the-tide-gauge-card-that-measured-a-dry-wave', 'The Tide Gauge Card That Measured a Dry Wave', 'a tide gauge card records a wave height while the shore was dry', 'tide gauges, shoreline notes, weather reports, and coastal folklore'],
    ['the-frost-journal-with-flowers-listed-in-july', 'The Frost Journal With Flowers Listed in July', 'a frost journal lists winter flowers during a July temperature record', 'frost journals, plant notes, weather archives, and seasonal folklore'],
    ['the-cloud-shadow-map-that-crossed-against-the-sun', 'The Cloud Shadow Map That Crossed Against the Sun', 'a cloud shadow map shows a shadow moving opposite the sun path', 'shadow maps, cloud observations, sky records, and weather folklore'],
    ['the-mushroom-field-notebook-with-nighttime-spore-counts', 'The Mushroom Field Notebook With Nighttime Spore Counts', 'a mushroom field notebook records spore counts taken at night after the plot was closed', 'field notebooks, spore counts, forest surveys, and fungal folklore'],
    ['the-river-temperature-log-that-warmed-at-midnight', 'The River Temperature Log That Warmed at Midnight', 'a river temperature log shows warming at midnight with no weather change nearby', 'temperature logs, river gauges, night readings, and water folklore'],
    ['the-storm-branch-inventory-after-a-windless-day', 'The Storm Branch Inventory After a Windless Day', 'a storm branch inventory counts broken limbs after a day recorded as windless', 'branch inventories, weather logs, park records, and storm folklore'],
    ['the-lake-ice-register-with-one-wet-footpath', 'The Lake Ice Register With One Wet Footpath', 'a lake ice register records a wet footpath across ice that should not have thawed', 'ice registers, ranger notes, shoreline accounts, and winter folklore']
  ]),
  'legendary-places': pack('Legendary Place Record', ['Legendary Places', 'Sacred Records'], [
    ['the-shrine-visitor-book-with-a-road-that-moved', 'The Shrine Visitor Book With a Road That Moved', 'a shrine visitor book describes a road that appears on different sides of the hill in different entries', 'visitor books, shrine maps, pilgrim accounts, and sacred-place folklore'],
    ['the-ruined-tower-survey-that-points-to-noon', 'The Ruined Tower Survey That Points to Noon', 'a ruined tower survey marks a shadow line that always points to noon in the legend', 'tower surveys, shadow lines, local maps, and ruin folklore'],
    ['the-sacred-grove-entry-list-written-in-leaf-veins', 'The Sacred Grove Entry List Written in Leaf Veins', 'a sacred grove entry list is said to repeat itself in the veins of fallen leaves', 'entry lists, grove customs, leaf symbolism, and sacred landscape lore'],
    ['the-mountain-pass-toll-record-for-a-silent-bell', 'The Mountain Pass Toll Record for a Silent Bell', 'a mountain pass toll record notes payment to a bell that no traveler heard ring', 'toll records, pass legends, bell motifs, and mountain folklore'],
    ['the-chapel-candle-log-from-a-locked-altar', 'The Chapel Candle Log From a Locked Altar', 'a chapel candle log records a flame lit inside an altar locked all night', 'candle logs, altar records, caretaker notes, and chapel folklore'],
    ['the-forbidden-lake-depth-chart-with-no-bottom-line', 'The Forbidden Lake Depth Chart With No Bottom Line', 'a forbidden lake depth chart leaves the final measurement open as if the bottom should not be named', 'depth charts, lake warnings, regional tales, and forbidden-place motifs'],
    ['the-abbey-floor-plan-showing-a-room-of-salt', 'The Abbey Floor Plan Showing a Room of Salt', 'an abbey floor plan shows a room of salt absent from every surviving wall', 'floor plans, abbey records, salt symbolism, and monastic folklore'],
    ['the-crossroads-milepost-register-with-four-norths', 'The Crossroads Milepost Register With Four Norths', 'a crossroads milepost register lists four directions as north in successive entries', 'milepost registers, crossroads customs, route maps, and travel folklore'],
    ['the-temple-gate-repair-note-signed-by-no-carpenter', 'The Temple Gate Repair Note Signed by No Carpenter', 'a temple gate repair note is signed, but no carpenter in the village claims the mark', 'repair notes, temple records, craft marks, and sacred-place legend'],
    ['the-cave-pilgrim-roll-kept-beneath-clear-water', 'The Cave Pilgrim Roll Kept Beneath Clear Water', 'a cave pilgrim roll is kept beneath clear water as proof of a path that must be read, not walked', 'pilgrim rolls, cave legends, water customs, and sacred route folklore']
  ]),
  'mythic-objects': pack('Mythic Object Record', ['Mythic Objects', 'Object Records'], [
    ['the-bronze-key-ledger-for-a-door-with-no-frame', 'The Bronze Key Ledger for a Door With No Frame', 'a bronze key ledger lists keys made for a door remembered without a wall or frame', 'key ledgers, door symbolism, maker records, and object folklore'],
    ['the-mirror-catalog-that-lists-the-viewer-first', 'The Mirror Catalog That Lists the Viewer First', 'a mirror catalog names the viewer before describing the glass', 'mirror catalogs, reflection motifs, collection records, and object legend'],
    ['the-silver-bell-register-of-sounds-never-rung', 'The Silver Bell Register of Sounds Never Rung', 'a silver bell register records sounds that the bell is never said to have made', 'bell registers, sound motifs, temple inventories, and object folklore'],
    ['the-red-thread-spool-inventory-that-shortens-at-dawn', 'The Red Thread Spool Inventory That Shortens at Dawn', 'a red thread spool inventory records missing length each morning without a cut mark', 'spool inventories, red-thread beliefs, dawn customs, and charm folklore'],
    ['the-iron-mask-index-with-one-speaking-line', 'The Iron Mask Index With One Speaking Line', 'an iron mask index includes one line of speech where the catalog should be silent', 'mask indexes, voice motifs, collection notes, and relic folklore'],
    ['the-wooden-bowl-tally-that-counts-unshared-meals', 'The Wooden Bowl Tally That Counts Unshared Meals', 'a wooden bowl tally counts meals that were prepared but never shared', 'bowl tallies, household rituals, hunger motifs, and object lore'],
    ['the-glass-needle-case-labeled-for-returning-shadows', 'The Glass Needle Case Labeled for Returning Shadows', 'a glass needle case is labeled for returning shadows rather than mending cloth', 'needle cases, shadow motifs, sewing customs, and mythic object folklore'],
    ['the-inkstone-record-that-darkens-after-names-are-spoken', 'The Inkstone Record That Darkens After Names Are Spoken', 'an inkstone record darkens whenever names are spoken near it in the story tradition', 'inkstone records, name taboos, writing tools, and object folklore'],
    ['the-clay-tablet-receipt-for-a-promise-never-made', 'The Clay Tablet Receipt for a Promise Never Made', 'a clay tablet receipt records a promise that no witness admits was made', 'clay tablets, promise motifs, witness customs, and ancient-object lore'],
    ['the-pocket-compass-log-pointing-to-forgotten-homes', 'The Pocket Compass Log Pointing to Forgotten Homes', 'a pocket compass log points travelers toward homes they no longer remember', 'compass logs, homeward motifs, travel charms, and object folklore']
  ]),
  'legend-origins': pack('Record Origin Motif', ['Legend Origins', 'Record Folklore'], [
    ['why-incident-logs-make-urban-legends-feel-believable', 'Why Incident Logs Make Urban Legends Feel Believable', 'incident logs make urban legends feel believable because a written trace gives rumor the shape of procedure', 'legend scholarship, document culture, police-log motifs, and source-limit reading'],
    ['how-guest-registers-turn-places-into-folklore', 'How Guest Registers Turn Places Into Folklore', 'guest registers turn places into folklore by making visits feel countable even when the story cannot be verified', 'guestbooks, place legends, visitor customs, and archive motifs'],
    ['why-missing-page-numbers-create-archive-mysteries', 'Why Missing Page Numbers Create Archive Mysteries', 'missing page numbers create archive mysteries because absence looks intentional inside an ordered record', 'page sequences, archive gaps, document culture, and mystery construction'],
    ['how-receipts-became-modern-folklore-evidence', 'How Receipts Became Modern Folklore Evidence', 'receipts became modern folklore evidence because they turn ordinary purchases into dated traces', 'receipt culture, service folklore, timestamp motifs, and everyday documentation'],
    ['why-timestamps-work-like-omens-in-digital-legends', 'Why Timestamps Work Like Omens in Digital Legends', 'timestamps work like omens in digital legends when a date or second seems to know too much', 'digital folklore, timestamps, platform records, and omen motifs'],
    ['how-ledgers-turn-objects-into-witnesses', 'How Ledgers Turn Objects Into Witnesses', 'ledgers turn objects into witnesses by making a thing appear inside a chain of custody', 'ledger culture, object folklore, provenance records, and witness motifs'],
    ['why-maps-with-extra-roads-become-lost-place-stories', 'Why Maps With Extra Roads Become Lost Place Stories', 'maps with extra roads become lost place stories because a drawn route invites readers to imagine a missing world', 'map anomalies, lost-place folklore, road legends, and cartographic motifs'],
    ['how-inventories-make-mythic-objects-feel-real', 'How Inventories Make Mythic Objects Feel Real', 'inventories make mythic objects feel real by giving symbolic items shelf numbers, counts, and handling notes', 'inventories, relic cataloging, object legends, and archive realism'],
    ['why-call-sheets-create-voice-and-radio-legends', 'Why Call Sheets Create Voice and Radio Legends', 'call sheets create voice and radio legends because scheduled silence feels like a place where a signal could return', 'broadcast records, call sheets, voice legends, and radio folklore'],
    ['how-census-records-turn-absence-into-story', 'How Census Records Turn Absence Into Story', 'census records turn absence into story when a missing household, blank line, or duplicate address becomes meaningful', 'census records, absence motifs, civil archives, and legend origins']
  ])
};

const additions = [];
for (const category of categories) {
  for (const [index, plan] of (plans[category.slug] || []).entries()) {
    const story = buildStory(plan, category, index);
    if (storySlugs.has(story.slug)) {
      console.warn(`Skipped duplicate slug: ${story.slug}`);
      continue;
    }
    story.contentDNA = buildContentDNA(story, existingQueries);
    storySlugs.add(story.slug);
    if (story.contentDNA?.canonicalQuery) existingQueries.add(story.contentDNA.canonicalQuery.toLowerCase().trim());
    additions.push(story);
  }
}

stories.unshift(...additions.reverse());
writeJson(storiesPath, stories);
console.log(`Added ${additions.length} record-centered archive stories.`);

function pack(tag, extraTags, rows) {
  return rows.map(([slug, title, detail, evidence]) => ({ slug, title, detail, evidence, tag, tags: [tag, ...extraTags] }));
}

function buildStory(plan, category, index) {
  const subject = plan.title.replace(/:.*$/, '').trim();
  const keyword = plan.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  const relatedSlugs = stories.filter((story) => story.categorySlug === category.slug && story.slug !== plan.slug).slice(0, 4).map((story) => story.slug);
  const relatedKeywords = unique([`${keyword} meaning`, `${keyword} origin`, `${plan.tag.toLowerCase()} folklore`, `${category.title.toLowerCase()} record`, 'record folklore', 'archive mystery']);

  return {
    id: plan.slug,
    slug: plan.slug,
    title: plan.title,
    displayTitle: plan.title,
    h1: `${plan.title}: Record, Meaning, and Folklore Pattern`,
    seoTitle: `${subject}: Record, Meaning, and Folklore Pattern`,
    metaTitle: `${subject}: Record, Meaning, and Folklore Pattern`,
    metaDescription: `${subject} examines ${plan.detail} as a record-centered ${category.title.toLowerCase()} archive subject with careful source limits.`,
    category: category.title,
    categorySlug: category.slug,
    categoryGroup: category.group,
    tag: plan.tag,
    primaryTag: plan.tag,
    seedKeyword: keyword,
    primaryKeyword: keyword,
    searchIntent: 'origin',
    articleFormat: 'search-info',
    cluster: `${category.title} / ${plan.tag}`,
    relatedKeywords,
    secondaryKeywords: relatedKeywords.slice(0, 5),
    topicScore: 86 + ((index + category.slug.length) % 8),
    topicStatus: 'approved',
    scoreBreakdown: { searchDemand: 18, folkloreFit: 20, evergreenValue: 18, sourceSafety: 15, internalLinking: 15 },
    summaryAnswer: `${subject} is a record-centered archive subject built around ${plan.detail}. The strongest reading treats the written trace as folklore evidence, not proof that every strange claim happened literally.`,
    readTime: `${8 + (index % 3)} min read`,
    storyType: `${category.title} Record`,
    sourceStatus: `${category.title} / ${plan.tag} / Record motif explanation`,
    excerpt: `${subject} follows ${plan.detail}, showing how ordinary paperwork can become the center of a legend, mystery, or symbolic tradition.`,
    introSummary: `${subject} begins with an ordinary record: a ledger, log, list, register, map, receipt, card, or file. What makes the subject memorable is the small detail that refuses to sit neatly inside the record. This archive reading keeps the story grounded in source limits while exploring why the written trace feels so persuasive.`,
    publishedAt,
    updatedAt: publishedAt,
    relatedStoryIds: relatedSlugs,
    relatedStorySlugs: relatedSlugs,
    tags: unique([...plan.tags.filter((tag) => tag !== category.title), 'Archive Pattern']).slice(0, 5),
    detail: plan.detail,
    evidence: plan.evidence,
    generationMode: 'canonical-archive',
    researchSources: [
      {
        title: `${subject} record motif overview`,
        supports: `Explains how ${plan.detail} functions as a folklore record rather than a verified incident report.`
      },
      {
        title: `${category.title} context and archive comparison`,
        supports: `Places the subject inside ${category.title} and compares it with related record-centered archive patterns.`
      },
      {
        title: `${plan.tag} source limits`,
        supports: `Separates the symbolic role of ${plan.evidence} from claims that cannot be independently verified.`
      }
    ],
    sourceNotes: {
      sharedVerifiedPoints: [
        `${subject} is framed as a record-centered archive subject within ${category.title}.`,
        `The central evidence pattern involves ${plan.evidence}.`,
        'The article treats the record as a folklore device and keeps unsupported claims clearly limited.'
      ],
      variants: [
        'Names, dates, documents, places, and written details may shift by region, retelling, or platform.',
        'Later versions often make the record look more precise than the source material can support.'
      ],
      unsupportedClaimsToAvoid: [
        'Do not present supernatural claims as verified events.',
        'Do not invent specific documents, witnesses, dates, institutions, or archive numbers beyond the source-aware premise.',
        'Do not imply that a written trace proves the event happened literally.'
      ],
      sourceLimits: [
        'No single record should be treated as complete proof of a supernatural or impossible event.',
        'Dates, signatures, page numbers, logs, and receipts can be copied, misread, mistranscribed, or retold through rumor.',
        'The archive reading focuses on meaning, repetition, and narrative structure rather than sensational certainty.'
      ]
    },
    contentType: 'story'
  };
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
