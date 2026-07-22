const fs = require('fs');
const path = require('path');
const {
  CREATOR_PIPELINE_VERSION,
  validateCreatorLibraryEntry
} = require('./creator-library-pipeline');
const {
  assertCreatorEntryIsSaveable
} = require('./creator-library-store');
const {
  validateCreatorPackForRender
} = require('./generate-site');

const root = path.resolve(__dirname, '..');
const scripts = readJson(path.join(root, 'data', 'scripts.json'));
const stories = readJson(path.join(root, 'data', 'stories.json'));
const categories = readJson(path.join(root, 'data', 'categories.json'));

let failures = 0;
const summaries = {
  entries: scripts.length,
  singlePath: 0,
  legacy: 0,
  htmlChecked: 0
};

main();

function main() {
  validateSlugSet();
  scripts.forEach(validateEntry);
  report();
}

function validateSlugSet() {
  const slugs = scripts.map((entry) => entry.slug);
  if (new Set(slugs).size !== slugs.length) fail('data/scripts.json', 'duplicate script slug found');
}

function validateEntry(entry) {
  if (entry.creatorPipelineVersion === CREATOR_PIPELINE_VERSION) summaries.singlePath += 1;
  else summaries.legacy += 1;

  if (entry.creatorPipelineVersion !== CREATOR_PIPELINE_VERSION) fail(entry.slug, 'creatorPipelineVersion is not single-path-v1');
  const story = stories.find((item) => item.slug === entry.originalStorySlug);
  if (!story) fail(entry.slug, `Archive story missing: ${entry.originalStorySlug}`);
  const category = categories.find((item) => item.slug === entry.creatorCategorySlug);
  if (!category) fail(entry.slug, `Creator category missing: ${entry.creatorCategorySlug}`);
  try {
    validateCreatorLibraryEntry(entry);
    assertCreatorEntryIsSaveable(entry);
    validateCreatorPackForRender(entry);
  } catch (error) {
    fail(entry.slug, `${error.code || 'VALIDATION_ERROR'}: ${error.message}`);
  }
  validateCompatibilityFields(entry);
  validateRuntime(entry);
  validateHtml(entry);
}

function validateCompatibilityFields(entry) {
  const visualPrompts = (entry.visualGuide || [])
    .flatMap((scene) => scene.narrationParts || [])
    .flatMap((part) => part.visualBeats || [])
    .map((beat) => beat.imagePrompt);
  const visualMotions = (entry.visualGuide || [])
    .flatMap((scene) => scene.narrationParts || [])
    .flatMap((part) => part.visualBeats || [])
    .map((beat) => beat.motionPrompt);
  const shortNarration = (entry.shortForm?.scenes || []).map((scene) => scene.narration);
  const shortFocuses = (entry.shortForm?.scenes || []).map((scene) => scene.sceneFocus);
  assertJsonEqual(entry.slug, 'imagePrompts', entry.imagePrompts, visualPrompts);
  assertJsonEqual(entry.slug, 'motionPrompts', entry.motionPrompts, visualMotions);
  assertJsonEqual(entry.slug, 'shortsScript', entry.shortsScript, shortNarration);
  assertJsonEqual(entry.slug, 'shortSceneFocuses', entry.shortSceneFocuses, shortFocuses);
}

function validateRuntime(entry) {
  const longWords = countWords((entry.longformScript || []).join(' '));
  const shortWords = countWords((entry.shortForm?.scenes || []).map((scene) => scene.narration).join(' '));
  if (entry.runtimePlan?.totalWordCount !== longWords) fail(entry.slug, 'Long-form word count mismatch');
  if (entry.runtimePlan?.narrationReadSeconds !== Math.max(8, Math.round(longWords / 2.35))) fail(entry.slug, 'Long-form reading seconds mismatch');
  if (entry.runtimePlan?.finalVideoSeconds < entry.runtimePlan?.narrationReadSeconds) fail(entry.slug, 'Long-form final runtime shorter than narration');
  if (entry.shortForm?.totalWordCount !== shortWords) fail(entry.slug, 'Short-form word count mismatch');
  if (entry.shortForm?.finalVideoSeconds < entry.shortForm?.narrationReadSeconds) fail(entry.slug, 'Short-form final runtime shorter than narration');
}

function validateHtml(entry) {
  const htmlPath = path.join(root, 'scripts', `${entry.slug}.html`);
  if (!fs.existsSync(htmlPath)) return fail(entry.slug, 'generated HTML missing');
  const html = fs.readFileSync(htmlPath, 'utf8');
  summaries.htmlChecked += 1;
  if (html.includes('Copy This Part')) fail(entry.slug, 'legacy Copy This Part button found');
  if (!html.includes('Long-form Creator')) fail(entry.slug, 'Long-form Creator section missing');
  if (!html.includes('Short-form Creator')) fail(entry.slug, 'Short-form Creator section missing');
  if (!html.includes('/scripts/creator-library.js')) fail(entry.slug, 'creator-library.js script missing');
  if (!html.includes(`/stories/${entry.originalStorySlug}`)) fail(entry.slug, 'Original archive link missing');
  if (count(html, /<article class="scene-workspace">/g) < 10) fail(entry.slug, 'expected 10 total scene workspaces');
  if (count(html, /<section class="script-material creator-format creator-format-short">[\s\S]*?<strong>Image Prompt:<\/strong>/g) < 1) {
    fail(entry.slug, 'Short-form Image Prompt output missing');
  }
  const shortHtml = html.split('<h2>Short-form Creator</h2>')[1] || '';
  if (count(shortHtml, /<strong>Image Prompt:<\/strong>/g) !== 5) fail(entry.slug, 'Short-form Image Prompt count mismatch');
  if (count(shortHtml, /<strong>Motion Prompt:<\/strong>/g) !== 5) fail(entry.slug, 'Short-form Motion Prompt count mismatch');
  const longParts = (entry.visualGuide || []).flatMap((scene) => scene.narrationParts || []);
  const beats = longParts.flatMap((part) => part.visualBeats || []);
  if (count(html, /data-copy-field="creator-note"/g) !== longParts.length) fail(entry.slug, 'Copy Creator Note count mismatch');
  if (count(html, /data-copy-field="image-prompt"/g) !== beats.length) fail(entry.slug, 'Copy Image Prompt count mismatch');
  if (count(html, /data-copy-field="motion-prompt"/g) !== beats.length) fail(entry.slug, 'Copy Motion Prompt count mismatch');
}

function assertJsonEqual(slug, field, actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) fail(slug, `${field} compatibility mismatch`);
}

function countWords(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

function count(text, regex) {
  return (String(text || '').match(regex) || []).length;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fail(slug, message) {
  failures += 1;
  console.error(`[migration:${slug}] ${message}`);
}

function report() {
  console.log(`Creator Library migration validation: entries=${summaries.entries}, singlePath=${summaries.singlePath}, legacy=${summaries.legacy}, htmlChecked=${summaries.htmlChecked}`);
  if (failures) {
    console.error(`Creator Library migration validation failed with ${failures} issue(s).`);
    process.exit(1);
  }
  console.log('Creator Library migration validation passed.');
}
