const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const errors = [];
const warnings = [];

const fixtureScripts = [
  {
    storySlug: 'demeter-and-persephone-myth',
    scriptSlug: 'demeter-and-persephone-myth-youtube-script',
    mustInclude: [/demeter/i, /persephone/i, /underworld|pomegranate|season/i],
    mustNotInclude: [/cicada/i, /tor network/i, /cryptography/i, /qr code/i, /dragon preset/i, /keyboard clicks/i, /printer noise/i, /modem-like texture/i, /low computer fan/i, /fluorescent office/i, /archive desk/i]
  },
  {
    storySlug: 'osiris-isis-resurrection-myth',
    scriptSlug: 'osiris-isis-resurrection-myth-youtube-script',
    mustInclude: [/osiris/i, /isis/i, /set|horus|underworld|afterlife/i],
    mustNotInclude: [/demeter/i, /persephone/i, /cicada/i, /tor network/i, /cryptography/i, /qr code/i, /dragon preset/i, /keyboard clicks/i, /printer noise/i, /modem-like texture/i, /low computer fan/i, /fluorescent office/i, /archive desk/i]
  },
  {
    storySlug: 'cicada-3301-internet-puzzle',
    scriptSlug: 'cicada-3301-internet-puzzle-youtube-script',
    mustInclude: [/cicada/i, /puzzle|cipher|cryptography|tor|digital|online/i],
    mustNotInclude: [/demeter/i, /persephone/i, /osiris/i, /isis/i, /pomegranate/i, /grain goddess/i, /nile-side/i]
  }
];

main();

function main() {
  assertFile('docs/creator-library-generation-standard.md');
  assertFile('AGENTS.md');
  assertFile('scripts/creator-library-pipeline.js');
  assertFile('scripts/creator-library-store.js');
  assertFile('scripts/add-latest-archive-to-creator-library-2026-07-20.js');
  assertFile('scripts/generate-site.js');
  assertFile('scripts/creator-library.js');

  const standard = readText('docs/creator-library-generation-standard.md');
  requireText(standard, 'Creator Library Generation Standard v2.0', 'standard document version is missing');
  requireText(standard, 'Renderer does not provide a legacy compatibility path', 'renderer final contract is missing');
  requireText(standard, 'Short-form Image Prompt', 'Short-form Image Prompt contract is missing');
  requireText(standard, 'Do not add new subject-specific production functions', 'hardcoding rule is missing');
  requireText(standard, 'node scripts/validate-creator-library-generation-standard.js', 'permanent validation command is missing');
  requireText(standard, 'node scripts/validate-creator-library-shortform-image-prompts.js', 'Short-form Image Prompt validation command is missing');

  const agents = readText('AGENTS.md');
  requireText(agents, 'docs/creator-library-generation-standard.md', 'AGENTS.md must point to the Creator Library standard');
  requireText(agents, 'Do not add new slug-specific production functions', 'AGENTS.md hardcoding rule is missing');
  requireText(agents, 'single-path-v1', 'AGENTS.md must document the active Creator Library pipeline version');

  const stories = readJson('data/stories.json');
  const scripts = readJson('data/scripts.json');

  validateNoLegacyExceptionFile();
  validateNoLegacyEntries(scripts);
  validateNoNewSubjectSpecificBranches();
  fixtureScripts.forEach((fixture) => validateFixture(fixture, stories, scripts));
  validateCopyClientScript();
  report();
}

function validateFixture(fixture, stories, scripts) {
  const story = stories.find((item) => item.slug === fixture.storySlug);
  const script = scripts.find((item) => item.slug === fixture.scriptSlug);
  if (!story) return error(fixture.storySlug, 'story', 'missing fixture story');
  if (!script) return error(fixture.scriptSlug, 'script', 'missing fixture script');

  const context = `${script.title || ''} ${script.mainSubject || ''} ${story.title || ''} ${JSON.stringify(story.storyBrief || {})}`;
  fixture.mustInclude.forEach((pattern) => {
    if (!pattern.test(context) && !pattern.test(JSON.stringify(script))) {
      error(fixture.scriptSlug, 'subject', `expected subject evidence not found: ${pattern}`);
    }
  });

  const scenes = Array.isArray(script.visualGuide) ? script.visualGuide : [];
  const parts = scenes.flatMap((scene, sceneIndex) => (scene.narrationParts || []).map((part, partIndex) => ({ scene, sceneIndex, part, partIndex })));
  const beats = parts.flatMap(({ part, sceneIndex, partIndex }) => (part.visualBeats || []).map((beat, beatIndex) => ({ beat, sceneIndex, partIndex, beatIndex })));
  const packedProduction = JSON.stringify({
    longformScript: script.longformScript,
    visualGuide: script.visualGuide,
    shortsScript: script.shortsScript,
    shortSceneFocuses: script.shortSceneFocuses
  });

  if (!Array.isArray(script.longformScript) || script.longformScript.length < 5) error(fixture.scriptSlug, 'longformScript', 'long-form narration is missing or too short');
  if (scenes.length < 3) error(fixture.scriptSlug, 'visualGuide', 'expected multiple production scenes');
  if (!parts.length) error(fixture.scriptSlug, 'narrationParts', 'expected Narration Parts');
  if (!beats.length) error(fixture.scriptSlug, 'visualBeats', 'expected Visual Beats');

  validateLongform(fixture, script);
  validateProductionFields(fixture, scenes, parts, beats, packedProduction);
  validateShortForm(fixture, script);
  validateFixtureHtml(fixture, scenes.length, parts.length, beats.length);

  fixture.mustNotInclude.forEach((pattern) => {
    if (pattern.test(packedProduction)) error(fixture.scriptSlug, 'cross-topic', `unexpected cross-topic value: ${pattern}`);
  });

  const partNarrations = parts.map(({ part }) => normalizeText(part.narration)).filter(Boolean);
  if (hasDuplicates(partNarrations)) error(fixture.scriptSlug, 'narrationParts', 'duplicate Narration Part text found');

  console.log(`${fixture.scriptSlug}: scenes=${scenes.length}, parts=${parts.length}, beats=${beats.length}, shorts=${(script.shortsScript || []).length}`);
}

function validateLongform(fixture, script) {
  const forbidden = [
    /Hold that image/i,
    /viewer should/i,
    /archive record explains/i,
    /source-aware/i,
    /keep this simple/i,
    /this part needs to feel/i,
    /the goal of this scene/i,
    /Creator Note:/i,
    /Image Prompt:/i,
    /Beat Motion:/i,
    /Sound Effect:/i,
    /Recommended Background Music:/i
  ];
  (script.longformScript || []).forEach((line, index) => {
    const text = String(line || '').trim();
    if (!text) error(fixture.scriptSlug, `longformScript[${index}]`, 'empty Long-form Narration entry');
    forbidden.forEach((pattern) => {
      if (!pattern.test(text)) return;
      error(fixture.scriptSlug, `longformScript[${index}]`, `forbidden meta or field label found: ${pattern}`);
    });
  });
}

function validateProductionFields(fixture, scenes, parts, beats, packedProduction) {
  const genericCreatorNote = [
    /Hold that image/i,
    /Give the audience one clear idea/i,
    /Keep this simple/i,
    /Use this part as a transition/i,
    /The viewer should recognize/i
  ];
  const brokenPromptPatterns = [
    /\bcenters and\b/i,
    /\baround and\b/i,
    /\bsome a\b/i,
    /\bavoid no\b/i,
    /\brestrained restrained\b/i,
    /\b(and|of|to|with)\s*[.!?]/i
  ];
  const motionForbidden = [/Sound Effect:/i, /Background Music:/i, /Voice Direction:/i];
  const musicForbidden = [/camera/i, /sound effect/i, /narration/i];
  const voiceForbidden = [/image prompt/i, /sound effect/i, /\bTTS service\b/i];
  const soundForbidden = [/background music/i, /narration/i];

  scenes.forEach((scene, index) => {
    if (!normalizeText(scene.sceneRole)) error(fixture.scriptSlug, `visualGuide[${index}].sceneRole`, 'missing Scene Role');
    if (!normalizeText(scene.sceneFocus)) error(fixture.scriptSlug, `visualGuide[${index}].sceneFocus`, 'missing Scene Focus');
    if (!normalizeText(scene.voiceDirection)) error(fixture.scriptSlug, `visualGuide[${index}].voiceDirection`, 'missing Voice Direction');
    if (!normalizeText(scene.visualDirection)) error(fixture.scriptSlug, `visualGuide[${index}].visualDirection`, 'missing Editing/Visual Direction');
    if (!normalizeText(scene.soundEffect)) error(fixture.scriptSlug, `visualGuide[${index}].soundEffect`, 'missing Sound Effect');
    const music = scene.backgroundMusic || scene.recommendedBackgroundMusic || scene.music || '';
    if (fixture.scriptSlug !== 'cicada-3301-internet-puzzle-youtube-script' && !normalizeText(music)) {
      error(fixture.scriptSlug, `visualGuide[${index}].backgroundMusic`, 'missing Background Music');
    }
    musicForbidden.forEach((pattern) => {
      if (pattern.test(String(music))) error(fixture.scriptSlug, `visualGuide[${index}].backgroundMusic`, `music field includes non-music direction: ${pattern}`);
    });
    voiceForbidden.forEach((pattern) => {
      if (pattern.test(String(scene.voiceDirection || ''))) error(fixture.scriptSlug, `visualGuide[${index}].voiceDirection`, `voice field includes unrelated direction: ${pattern}`);
    });
    soundForbidden.forEach((pattern) => {
      if (pattern.test(String(scene.soundEffect || ''))) error(fixture.scriptSlug, `visualGuide[${index}].soundEffect`, `sound field includes unrelated direction: ${pattern}`);
    });
  });

  parts.forEach(({ part, sceneIndex, partIndex }) => {
    if (!normalizeText(part.narration)) error(fixture.scriptSlug, `scene ${sceneIndex + 1} part ${partIndex + 1}`, 'missing Narration');
    if (!normalizeText(part.estimatedReadingTime)) error(fixture.scriptSlug, `scene ${sceneIndex + 1} part ${partIndex + 1}`, 'missing Estimated Reading Time');
    if (!normalizeText(part.creatorNote)) error(fixture.scriptSlug, `scene ${sceneIndex + 1} part ${partIndex + 1}`, 'missing Creator Note');
    genericCreatorNote.forEach((pattern) => {
      if (pattern.test(String(part.creatorNote || ''))) error(fixture.scriptSlug, `scene ${sceneIndex + 1} part ${partIndex + 1} Creator Note`, `generic note phrase found: ${pattern}`);
    });
    if (normalizeText(part.creatorNote) === normalizeText(part.narration)) {
      error(fixture.scriptSlug, `scene ${sceneIndex + 1} part ${partIndex + 1} Creator Note`, 'Creator Note duplicates Narration');
    }
  });

  beats.forEach(({ beat, sceneIndex, partIndex, beatIndex }) => {
    const label = `scene ${sceneIndex + 1} part ${partIndex + 1} beat ${beatIndex + 1}`;
    if (!normalizeText(beat.imagePrompt)) error(fixture.scriptSlug, label, 'missing Image Prompt');
    if (!normalizeText(beat.motionPrompt)) error(fixture.scriptSlug, label, 'missing Beat Motion');
    brokenPromptPatterns.forEach((pattern) => {
      if (pattern.test(String(beat.imagePrompt || ''))) error(fixture.scriptSlug, `${label} Image Prompt`, `broken prompt pattern found: ${pattern}`);
    });
    motionForbidden.forEach((pattern) => {
      if (pattern.test(String(beat.motionPrompt || ''))) error(fixture.scriptSlug, `${label} Beat Motion`, `motion field includes unrelated direction: ${pattern}`);
    });
  });

  if (/keyboard clicks|printer noise|modem-like texture|low computer fan|fluorescent office|archive desk/i.test(packedProduction) && fixture.scriptSlug !== 'cicada-3301-internet-puzzle-youtube-script') {
    error(fixture.scriptSlug, 'production profile', 'digital-office preset leaked into non-digital fixture');
  }
}

function validateShortForm(fixture, script) {
  const shorts = Array.isArray(script.shortsScript) ? script.shortsScript : [];
  if (!shorts.length) return error(fixture.scriptSlug, 'shortsScript', 'missing Short-form Narration');
  shorts.forEach((line, index) => {
    if (!normalizeText(line)) error(fixture.scriptSlug, `shortsScript[${index}]`, 'empty Short-form Scene Narration');
  });
  if (hasDuplicates(shorts.map(normalizeText))) error(fixture.scriptSlug, 'shortsScript', 'duplicate Short-form Scene Narration found');

  const wordCount = countWords(shorts.join(' '));
  const readSeconds = estimatedSeconds(shorts.join(' '));
  const finalSeconds = shorts
    .map((line) => estimatedSeconds(line))
    .reduce((sum, seconds) => sum + Math.min(60, Math.max(5, seconds) + 2), 0);

  if (wordCount < 60 || wordCount > 155) error(fixture.scriptSlug, 'shortsScript', `unexpected Short-form word count: ${wordCount}`);
  if (readSeconds < 30 || readSeconds > 60) error(fixture.scriptSlug, 'shortsScript', `reading time outside 30-60 seconds: ${readSeconds}`);
  if (finalSeconds < readSeconds) error(fixture.scriptSlug, 'shortsScript', `final video time ${finalSeconds}s is shorter than reading time ${readSeconds}s`);
  if (finalSeconds < 30 || finalSeconds > 60) error(fixture.scriptSlug, 'shortsScript', `final video time outside 30-60 seconds: ${finalSeconds}`);

  const forbidden = [
    /Hold that image/i,
    /This story begins with a question/i,
    /The viewer should notice/i,
    /Keep this as a variant/i,
    /A source-aware record/i,
    /The archive separates/i,
    /This part needs to feel simple/i,
    /viewer should/i,
    /archive record/i,
    /source-aware/i,
    /keep this simple/i,
    /make the distinction clear/i,
    /show the mystery clearly/i,
    /focus on the main idea/i
  ];
  const packedShorts = shorts.join(' ');
  forbidden.forEach((pattern) => {
    if (pattern.test(packedShorts)) error(fixture.scriptSlug, 'shortsScript', `forbidden Short-form phrase found: ${pattern}`);
  });

  const scenes = script.shortForm?.scenes || [];
  if (scenes.length !== 5) error(fixture.scriptSlug, 'shortForm.scenes', 'expected exactly 5 stored Short-form scenes');
  const imagePrompts = scenes.map((scene) => normalizeText(scene.imagePrompt));
  const motionPrompts = scenes.map((scene) => normalizeText(scene.motionPrompt));
  if (imagePrompts.some((value) => !value)) error(fixture.scriptSlug, 'shortForm.imagePrompt', 'stored Short-form Image Prompt is missing');
  if (motionPrompts.some((value) => !value)) error(fixture.scriptSlug, 'shortForm.motionPrompt', 'stored Short-form Motion Prompt is missing');
  if (hasDuplicates(imagePrompts)) error(fixture.scriptSlug, 'shortForm.imagePrompt', 'duplicate Short-form Image Prompt found');
  if (hasDuplicates(motionPrompts)) error(fixture.scriptSlug, 'shortForm.motionPrompt', 'duplicate Short-form Motion Prompt found');
  imagePrompts.forEach((prompt, index) => {
    const words = countWords(prompt);
    if (words < 30 || words > 100) error(fixture.scriptSlug, `shortForm.scenes[${index}].imagePrompt`, `word count outside 30-100: ${words}`);
    if (/Image Prompt:|Motion Prompt:|Sound Effect:|Voice Direction:|Background Music:|Creator Note:/i.test(prompt)) {
      error(fixture.scriptSlug, `shortForm.scenes[${index}].imagePrompt`, 'contains another production field label');
    }
  });
  motionPrompts.forEach((prompt, index) => {
    const words = countWords(prompt);
    if (words < 10 || words > 35) error(fixture.scriptSlug, `shortForm.scenes[${index}].motionPrompt`, `word count outside 10-35: ${words}`);
    if (/Image Prompt:|No readable text|logos|watermarks|graphic gore|cartoon styling/i.test(prompt)) {
      error(fixture.scriptSlug, `shortForm.scenes[${index}].motionPrompt`, 'contains Image Prompt label or exclusions');
    }
  });
}

function validateFixtureHtml(fixture, sceneCount, partCount, beatCount) {
  const htmlPath = path.join(root, 'scripts', `${fixture.scriptSlug}.html`);
  if (!fs.existsSync(htmlPath)) return error(fixture.scriptSlug, 'html', 'generated HTML fixture is missing');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const longHtml = extractLongFormHtml(html);
  const shortHtml = extractShortFormHtml(html);

  if (html.includes('Copy This Part')) error(fixture.scriptSlug, 'copy', 'Copy This Part still exists');
  if (!html.includes('/scripts/creator-library.js')) error(fixture.scriptSlug, 'copy', 'creator-library.js is not loaded');
  if (count(html, /data-copy-kind="narration"/g) < 2) error(fixture.scriptSlug, 'copy', 'missing full narration copy buttons');
  if (count(html, /data-copy-kind="creator-notes"/g) < 1) error(fixture.scriptSlug, 'copy', 'missing all creator notes copy button');
  if (count(html, /data-copy-kind="image-prompts"/g) < 1) error(fixture.scriptSlug, 'copy', 'missing all image prompts copy button');
  if (count(html, /data-copy-kind="motion-prompts"/g) < 1) error(fixture.scriptSlug, 'copy', 'missing all motion prompts copy button');

  const narrationButtons = count(longHtml, /data-copy-field="narration"/g);
  const noteButtons = count(longHtml, /data-copy-field="creator-note"/g);
  const imageButtons = count(longHtml, /data-copy-field="image-prompt"/g);
  const motionButtons = count(longHtml, /data-copy-field="motion-prompt"/g);
  const renderedParts = count(longHtml, /class="narration-part"/g);
  const renderedNotes = count(longHtml, /class="narration-part-note"/g);
  const renderedImages = count(longHtml, /class="visual-beat-image-prompt"/g);
  const renderedMotions = count(longHtml, /class="visual-beat-motion-prompt"/g);

  if (renderedParts !== partCount) error(fixture.scriptSlug, 'html', `rendered Part count ${renderedParts} != data ${partCount}`);
  if (renderedImages !== beatCount) error(fixture.scriptSlug, 'html', `rendered Image Prompt count ${renderedImages} != data ${beatCount}`);
  if (narrationButtons !== renderedParts) error(fixture.scriptSlug, 'copy', `Copy Narration count ${narrationButtons} != parts ${renderedParts}`);
  if (noteButtons !== renderedNotes) error(fixture.scriptSlug, 'copy', `Copy Creator Note count ${noteButtons} != notes ${renderedNotes}`);
  if (imageButtons !== renderedImages) error(fixture.scriptSlug, 'copy', `Copy Image Prompt count ${imageButtons} != prompts ${renderedImages}`);
  if (motionButtons !== renderedMotions) error(fixture.scriptSlug, 'copy', `Copy Motion Prompt count ${motionButtons} != motions ${renderedMotions}`);

  if (count(shortHtml, /<article class="scene-workspace">/g) < Math.min(sceneCount, 3)) error(fixture.scriptSlug, 'short html', 'Short-form scenes are missing');
  if (!/Scene Focus:<\/strong>/.test(shortHtml)) error(fixture.scriptSlug, 'short html', 'Short-form Scene Focus is missing');
  if (count(shortHtml, /<strong>Image Prompt:<\/strong>/g) !== 5) error(fixture.scriptSlug, 'short html', 'Short-form Image Prompt count is not 5');
  if (count(shortHtml, /<strong>Motion Prompt:<\/strong>/g) !== 5) error(fixture.scriptSlug, 'short html', 'Short-form Motion Prompt count is not 5');
  if (!/Estimated Playback Time:<\/strong>/.test(shortHtml)) error(fixture.scriptSlug, 'short html', 'Short-form runtime is missing');
}

function validateCopyClientScript() {
  const source = readText('scripts/creator-library.js');
  [
    'collectSingleFieldText',
    'cleanClosestPartField',
    'cleanClosestBeatField',
    'data-copy-field',
    'motion-prompts',
    'Copy failed',
    'Copied'
  ].forEach((needle) => requireText(source, needle, `creator-library.js missing ${needle}`));
  if (/collectPartText/.test(source)) error('scripts/creator-library.js', 'copy', 'legacy combined Part copy function still exists');
}

function validateNoLegacyExceptionFile() {
  if (fs.existsSync(path.join(root, 'scripts/creator-library-legacy-exceptions.json'))) {
    error('creator-library-legacy-exceptions.json', 'legacy', 'legacy exception file must be removed');
  }
}

function validateNoLegacyEntries(scripts) {
  const legacy = scripts.filter((script) => script.creatorPipelineVersion !== 'single-path-v1');
  if (legacy.length) error('data/scripts.json', 'legacy', `legacy Creator Pack entries remain: ${legacy.length}`);
}

function validateNoNewSubjectSpecificBranches() {
  const files = [
    'scripts/creator-library-pipeline.js',
    'scripts/generate-site.js'
  ];
  const subjectFunctionPattern = /function\s+([A-Za-z0-9_]*(?:demeter|osiris|cicada|prometheus|quetzalcoatl|persephone)[A-Za-z0-9_]*)\s*\(/gi;
  const slugBranchPattern = /story\.slug\s*(===|!==)\s*['"]([^'"]+)['"]/g;

  files.forEach((file) => {
    const source = readText(file);
    for (const match of source.matchAll(subjectFunctionPattern)) {
      const name = match[1];
      error(file, 'subject-specific function', `new subject-specific function found: ${name}`);
    }
    for (const match of source.matchAll(slugBranchPattern)) {
      error(file, 'slug branch', `new direct story.slug branch found: ${match[1]} ${match[2]}`);
    }
  });
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function assertFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) error(relativePath, 'file', 'required file is missing');
}

function requireText(text, needle, message) {
  if (!String(text || '').includes(needle)) error('documentation', 'text', message);
}

function count(text, regex) {
  return (String(text || '').match(regex) || []).length;
}

function countWords(text) {
  return (String(text || '').match(/[A-Za-z0-9']+/g) || []).length;
}

function estimatedSeconds(text) {
  return Math.max(1, Math.ceil((countWords(text) / 140) * 60));
}

function normalizeText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function hasDuplicates(values) {
  const filtered = values.filter(Boolean);
  return new Set(filtered).size !== filtered.length;
}

function extractLongFormHtml(html) {
  const startMarker = '<div class="script-prompt-list" data-narration-format="long">';
  const start = html.indexOf(startMarker);
  if (start === -1) return '';
  const afterStart = html.slice(start);
  const shortStart = afterStart.indexOf('<div class="script-prompt-list" data-narration-format="short">');
  return shortStart === -1 ? afterStart : afterStart.slice(0, shortStart);
}

function extractShortFormHtml(html) {
  const marker = '<div class="script-prompt-list" data-narration-format="short">';
  const start = html.indexOf(marker);
  return start === -1 ? '' : html.slice(start);
}

function error(slug, field, message) {
  errors.push({ slug, field, message });
}

function warn(slug, field, message) {
  warnings.push({ slug, field, message });
}

function report() {
  warnings.forEach((item) => {
    console.warn(`WARNING ${item.slug} [${item.field}]: ${item.message}`);
  });
  if (errors.length) {
    errors.forEach((item) => {
      console.error(`ERROR ${item.slug} [${item.field}]: ${item.message}`);
    });
    console.error(`Creator Library generation standard validation failed: ${errors.length} error(s), ${warnings.length} warning(s).`);
    process.exit(1);
  }
  console.log(`Creator Library generation standard validation passed: ${fixtureScripts.length} fixture(s), ${warnings.length} warning(s).`);
}
