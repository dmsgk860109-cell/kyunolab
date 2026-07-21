const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sourceScriptPath = path.join(__dirname, 'add-latest-archive-to-creator-library-2026-07-20.js');
const storiesPath = path.join(root, 'data', 'stories.json');
const scriptsPath = path.join(root, 'data', 'scripts.json');
const categoriesPath = path.join(root, 'data', 'categories.json');

const targetSlugs = [
  'the-train-delay-log-that-predicted-the-fog-youtube-script',
  'the-wiki-edit-history-with-a-user-who-never-existed-youtube-script',
  'the-town-archive-box-marked-for-a-street-that-is-not-there-youtube-script',
  'the-weather-log-signed-during-an-evacuation-youtube-script',
  'the-winter-road-roll-that-marked-safe-footsteps-youtube-script',
  'the-subscription-renewal-log-for-a-service-never-joined-youtube-script',
  'quetzalcoatl-feathered-serpent-myth-youtube-script',
  'the-wax-winged-owl-of-sealed-letters-youtube-script',
  'the-tax-records-of-the-village-that-moved-at-night-youtube-script',
  'the-tree-ring-record-with-one-year-missing-youtube-script',
  'the-well-log-that-returned-lost-names-youtube-script',
  'the-wooden-stamp-that-marks-returned-things-youtube-script',
  'why-timestamps-feel-like-modern-omens-youtube-script',
  'clown-statue-urban-legend-youtube-script',
  'cicada-3301-internet-puzzle-youtube-script',
  'bennington-triangle-legend-youtube-script',
  'db-cooper-hijacking-mystery-youtube-script',
  'green-children-woolpit-folklore-youtube-script',
  'beast-of-bray-road-legend-youtube-script',
  'ra-solar-boat-myth-youtube-script',
  'basilisk-folklore-youtube-script',
  'agartha-hollow-earth-legend-youtube-script',
  'green-flash-sunset-phenomenon-youtube-script',
  'fountain-of-youth-legend-youtube-script',
  'mjolnir-thors-hammer-youtube-script',
  'black-cat-superstition-origin-youtube-script'
];

const source = fs.readFileSync(sourceScriptPath, 'utf8');
const helperSource = source.slice(source.indexOf('function buildCreatorLibraryEntry'));
const sandbox = {
  console,
  require,
  publishedAt: '2026-07-20',
  __dirname,
  __filename: sourceScriptPath,
  module: { exports: {} },
  exports: {}
};

vm.createContext(sandbox);
vm.runInContext(`${helperSource}\nmodule.exports = { buildCreatorLibraryEntry };`, sandbox);

const stories = readJson(storiesPath);
const scripts = readJson(scriptsPath);
const categories = readJson(categoriesPath);
const storiesBySlug = new Map(stories.map((story) => [story.slug, story]));
const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));
const targets = new Set(targetSlugs);
let updated = 0;

const nextScripts = scripts.map((script) => {
  if (!targets.has(script.slug)) return script;
  const story = storiesBySlug.get(script.originalStorySlug);
  const category = categoriesBySlug.get(script.creatorCategorySlug || story?.categorySlug);
  if (!story || !category) {
    console.warn(`Skipped ${script.slug}: missing archive story or category.`);
    return script;
  }

  const next = sandbox.module.exports.buildCreatorLibraryEntry(story, category);
  next.publishedAt = script.publishedAt;
  next.updatedAt = '2026-07-21';
  updated += 1;
  return next;
});

writeJson(scriptsPath, nextScripts);
console.log(`Regenerated ${updated} Creator Library pack(s).`);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
