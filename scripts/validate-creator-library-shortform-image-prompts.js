const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const scripts = readJson(path.join(root, 'data', 'scripts.json'));

let failures = 0;
const summary = {
  packs: scripts.length,
  scenes: 0,
  imageWordCounts: [],
  motionWordCounts: [],
  htmlChecked: 0
};

main();

function main() {
  scripts.forEach(validateEntry);
  report();
}

function validateEntry(entry) {
  if (entry.creatorPipelineVersion !== 'single-path-v1') fail(entry.slug, 0, 'creatorPipelineVersion', 'entry is not single-path-v1');
  const scenes = entry.shortForm?.scenes || [];
  if (!Array.isArray(scenes) || scenes.length !== 5) {
    fail(entry.slug, 0, 'shortForm.scenes', 'Short-form must contain exactly 5 scenes');
    return;
  }
  const longPrompts = (entry.visualGuide || [])
    .flatMap((scene) => scene.narrationParts || [])
    .flatMap((part) => part.visualBeats || [])
    .map((beat) => String(beat.imagePrompt || '').trim())
    .filter(Boolean);
  const imageKeys = new Set();
  const motionKeys = new Set();

  scenes.forEach((scene, index) => {
    const sceneIndex = index + 1;
    summary.scenes += 1;
    validateImagePrompt(entry, scene, sceneIndex, longPrompts, imageKeys);
    validateMotionPrompt(entry, scene, sceneIndex, motionKeys);
  });
  validateHtml(entry);
}

function validateImagePrompt(entry, scene, sceneIndex, longPrompts, imageKeys) {
  const value = scene.imagePrompt;
  if (!value || typeof value !== 'string' || Array.isArray(value)) {
    fail(entry.slug, sceneIndex, 'imagePrompt', 'missing or non-string Image Prompt');
    return;
  }
  const words = countWords(value);
  summary.imageWordCounts.push(words);
  if (words < 30 || words > 100) fail(entry.slug, sceneIndex, 'imagePrompt', `word count outside 30-100: ${words}`);
  if (/Image Prompt:|Motion Prompt:|Sound Effect:|Voice Direction:|Background Music:|Creator Note:/i.test(value)) {
    fail(entry.slug, sceneIndex, 'imagePrompt', 'contains a production field label');
  }
  if ((value.match(/No readable text/gi) || []).length > 1) fail(entry.slug, sceneIndex, 'imagePrompt', 'repeats No readable text exclusion');
  if ((value.match(/\bgraphic gore\b/gi) || []).length > 1) fail(entry.slug, sceneIndex, 'imagePrompt', 'repeats graphic gore exclusion');
  if (/\b(?:avoid no|exclude no|without no)\b/i.test(value)) fail(entry.slug, sceneIndex, 'imagePrompt', 'contains contradictory exclusion wording');
  if (/\b(?:motion prompt|sound effect|voice direction|background music)\b/i.test(value)) {
    fail(entry.slug, sceneIndex, 'imagePrompt', 'contains non-image production direction label');
  }
  const key = exactTextKey(value);
  if (imageKeys.has(key)) fail(entry.slug, sceneIndex, 'imagePrompt', 'duplicates another Short-form Image Prompt in this Pack');
  imageKeys.add(key);
  longPrompts.forEach((prompt, longIndex) => {
    if (exactTextKey(prompt) === key) fail(entry.slug, sceneIndex, 'imagePrompt', `copies Long-form prompt exactly: ${longIndex + 1}`);
    if (longestSharedWordRun(value, prompt) >= 30) fail(entry.slug, sceneIndex, 'imagePrompt', `contains too much Long-form prompt text: ${longIndex + 1}`);
  });
}

function validateMotionPrompt(entry, scene, sceneIndex, motionKeys) {
  const value = scene.motionPrompt;
  if (!value || typeof value !== 'string' || Array.isArray(value)) {
    fail(entry.slug, sceneIndex, 'motionPrompt', 'missing or non-string Motion Prompt');
    return;
  }
  const words = countWords(value);
  summary.motionWordCounts.push(words);
  if (words < 10 || words > 35) fail(entry.slug, sceneIndex, 'motionPrompt', `word count outside 10-35: ${words}`);
  if (/Image Prompt:|No readable text|logos|watermarks|graphic gore|cartoon styling/i.test(value)) {
    fail(entry.slug, sceneIndex, 'motionPrompt', 'contains Image Prompt label or exclusion text');
  }
  if (exactTextKey(value) === exactTextKey(scene.imagePrompt)) fail(entry.slug, sceneIndex, 'motionPrompt', 'copies full Image Prompt');
  if (longestSharedWordRun(value, scene.imagePrompt) >= 12) fail(entry.slug, sceneIndex, 'motionPrompt', 'copies too much Image Prompt text');
  const key = exactTextKey(value);
  if (motionKeys.has(key)) fail(entry.slug, sceneIndex, 'motionPrompt', 'duplicates another Motion Prompt in this Pack');
  motionKeys.add(key);
}

function validateHtml(entry) {
  const htmlPath = path.join(root, 'scripts', `${entry.slug}.html`);
  if (!fs.existsSync(htmlPath)) return fail(entry.slug, 0, 'html', 'generated HTML missing');
  const html = fs.readFileSync(htmlPath, 'utf8');
  summary.htmlChecked += 1;
  const shortHtml = html.split('<h2>Short-form Creator</h2>')[1] || '';
  if (count(shortHtml, /<article class="scene-workspace">/g) < 5) fail(entry.slug, 0, 'html', 'Short-form scene workspace count is below 5');
  if (count(shortHtml, /<strong>Image Prompt:<\/strong>/g) !== 5) fail(entry.slug, 0, 'html', 'Short-form Image Prompt block count is not 5');
  if (count(shortHtml, /<strong>Motion Prompt:<\/strong>/g) !== 5) fail(entry.slug, 0, 'html', 'Short-form Motion Prompt block count is not 5');
  if (/Copy This Part/i.test(shortHtml)) fail(entry.slug, 0, 'html', 'legacy Copy This Part text found');
}

function report() {
  console.log(`Short-form Image Prompt validation: packs=${summary.packs}, scenes=${summary.scenes}, htmlChecked=${summary.htmlChecked}`);
  console.log(`Image Prompt word range: ${range(summary.imageWordCounts)}`);
  console.log(`Motion Prompt word range: ${range(summary.motionWordCounts)}`);
  if (failures) {
    console.error(`Short-form Image Prompt validation failed: ${failures} issue(s).`);
    process.exit(1);
  }
  console.log('Short-form Image Prompt validation passed.');
}

function fail(slug, sceneIndex, field, message) {
  failures += 1;
  console.error(`[short-image:${slug}] scene=${sceneIndex} field=${field}: ${message}`);
}

function range(values) {
  if (!values.length) return 'none';
  return `${Math.min(...values)}-${Math.max(...values)}`;
}

function countWords(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

function count(text, regex) {
  return (String(text || '').match(regex) || []).length;
}

function exactTextKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function longestSharedWordRun(left, right) {
  const a = wordTokens(left);
  const b = wordTokens(right);
  let best = 0;
  for (let i = 0; i < a.length; i += 1) {
    for (let j = 0; j < b.length; j += 1) {
      let length = 0;
      while (a[i + length] && a[i + length] === b[j + length]) length += 1;
      if (length > best) best = length;
    }
  }
  return best;
}

function wordTokens(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
