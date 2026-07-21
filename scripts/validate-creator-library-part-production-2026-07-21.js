const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const scripts = JSON.parse(fs.readFileSync(path.join(root, 'data', 'scripts.json'), 'utf8'));
const targetSlugs = [
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

const blockedPattern = /The story does\.|some a\.|\bThe\.\b|That wider frame\.|restrained restrained|\.\.|Clarify how this retelling changes|fluorescent lights|low mechanical hum|distant room vibration|flickering office lights/i;
const crossTopicChecks = {
  'green-flash-sunset-phenomenon-youtube-script': /\bRa(?:'s|s)?\b|solar boat|Duat|Apep|desert river/i,
  'ra-solar-boat-myth-youtube-script': /coastal|seabirds|green rim|refraction/i,
  'cicada-3301-internet-puzzle-youtube-script': /solar boat|Duat|Apep|green rim|ocean horizon/i
};

let failures = 0;

for (const slug of targetSlugs) {
  const script = scripts.find((item) => item.slug === slug);
  if (!script) {
    fail(`${slug}: missing script data`);
    continue;
  }

  const scenes = Array.isArray(script.visualGuide) ? script.visualGuide : [];
  const parts = scenes.flatMap((scene) => scene.narrationParts || []);
  const beats = parts.flatMap((part) => part.visualBeats || []);
  const uniqueNotes = new Set(parts.map((part) => part.creatorNote).filter(Boolean));
  const uniqueMotions = new Set(beats.map((beat) => beat.motionPrompt).filter(Boolean));
  const packedText = JSON.stringify({
    visualGuide: script.visualGuide,
    imagePrompts: script.imagePrompts
  });
  const blockedMatch = packedText.match(blockedPattern);

  if (parts.length < 5) fail(`${slug}: expected narration parts`);
  if (!beats.length) fail(`${slug}: expected visual beats`);
  if (uniqueNotes.size < 4) fail(`${slug}: creator notes are too repetitive`);
  if (uniqueMotions.size < 3) fail(`${slug}: beat motions are too repetitive`);
  if (blockedMatch) fail(`${slug}: blocked phrase found (${blockedMatch[0]})`);

  const crossTopic = crossTopicChecks[slug]?.exec(packedText);
  if (crossTopic) fail(`${slug}: cross-topic keyword found (${crossTopic[0]})`);

  const htmlPath = path.join(root, 'scripts', `${slug}.html`);
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const longHtml = extractLongFormHtml(html);
    const partScripts = count(longHtml, /class="narration-part-script"/g);
    const hiddenCopySources = count(longHtml, /scene-narration-copy-source" hidden/g);
    const visibleSceneNarrationSingles = count(longHtml, /scene-narration-single/g);
    const sceneImagePrompts = count(longHtml, /scene-image-prompt/g);
    if (!partScripts) fail(`${slug}: rendered page has no narration part scripts`);
    if (!hiddenCopySources) fail(`${slug}: rendered page has no hidden narration copy source`);
    if (visibleSceneNarrationSingles) fail(`${slug}: rendered page shows full scene narration beside parts`);
    if (sceneImagePrompts) fail(`${slug}: rendered page shows duplicate scene-level image prompt`);
  }

  console.log(`${slug}: parts=${parts.length}, beats=${beats.length}, uniqueNotes=${uniqueNotes.size}, uniqueMotions=${uniqueMotions.size}`);
}

if (failures) {
  console.error(`Creator Library part production validation failed: ${failures} issue(s).`);
  process.exit(1);
}

console.log('Creator Library part production validation passed.');

function count(text, regex) {
  return (text.match(regex) || []).length;
}

function extractLongFormHtml(html) {
  const marker = '<div class="script-prompt-list" data-narration-format="long">';
  const start = html.indexOf(marker);
  if (start === -1) return '';
  const afterStart = html.slice(start);
  const shortStart = afterStart.indexOf('<div class="script-prompt-list" data-narration-format="short">');
  return shortStart === -1 ? afterStart : afterStart.slice(0, shortStart);
}

function fail(message) {
  failures += 1;
  console.error(message);
}
