const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const scripts = JSON.parse(fs.readFileSync(path.join(root, 'data', 'scripts.json'), 'utf8'));
const targetSlug = process.argv[2];
const targets = targetSlug ? scripts.filter((script) => script.slug === targetSlug) : scripts;
const bannedNarrationPatterns = [
  /\bshow the\b/i,
  /\bmove closer\b/i,
  /\buse a slow zoom\b/i,
  /\bkeep the mood\b/i,
  /\badd ambient sound\b/i,
  /\bthe video should\b/i,
  /\bthe scene should\b/i,
  /\bthe best way to present\b/i,
  /\bthe goal of this scene\b/i,
  /\bby the end\b/i,
  /\bthe article explains\b/i,
  /\bthis section should\b/i
];

if (targetSlug && !targets.length) {
  fail([`Creator Pack not found: ${targetSlug}`]);
}

const failures = [];
for (const script of targets) {
  validateScript(script, failures);
}

if (failures.length) {
  fail(failures);
}

console.log(`Validated ${targets.length} Creator Pack${targets.length === 1 ? '' : 's'}.`);

function validateScript(script, failures) {
  const runtime = parseRuntime(script.estimatedVideoLength);
  if (!runtime) {
    failures.push(`${script.slug}: Estimated Video Length is missing or invalid`);
  } else {
    if (runtime.min < 5 || runtime.max > 10) {
      failures.push(`${script.slug}: Estimated Video Length must stay within 5-10 minutes`);
    }
    if (script.estimatedVideoLength === '8-10 minutes' && !script.runtimePlan?.allowExtendedRuntime) {
      failures.push(`${script.slug}: Estimated Video Length appears fixed at 8-10 minutes`);
    }
  }

  const narration = (script.longformScript || []).join('\n\n');
  for (const pattern of bannedNarrationPatterns) {
    if (pattern.test(narration)) {
      failures.push(`${script.slug}: Narration contains production direction matching ${pattern}`);
    }
  }

  if (script.runtimePlan) {
    const finalSeconds = Number(script.runtimePlan.estimatedFinalSeconds || 0);
    const readSeconds = estimatedNarrationSeconds(script.longformScript || []);
    if (finalSeconds < 300 || finalSeconds > 600) {
      failures.push(`${script.slug}: runtimePlan final runtime is outside 5-10 minutes`);
    }
    if (finalSeconds && readSeconds && readSeconds / finalSeconds < 0.75) {
      failures.push(`${script.slug}: narration read time is less than 75% of final runtime`);
    }
  }

  const focuses = (script.visualGuide || [])
    .map((item) => item.sceneFocus || item.directionTip)
    .filter(Boolean);
  if (focuses.length >= 2 && new Set(focuses).size !== focuses.length) {
    failures.push(`${script.slug}: Scene Focus values repeat`);
  }
  if (focuses.some((focus) => /one clear emotional idea|understand the beat immediately|focused and atmospheric/i.test(focus))) {
    failures.push(`${script.slug}: Scene Focus contains generic fallback language`);
  }

  const prompts = script.visualGuide?.map((item) => item.aiImagePrompt).filter(Boolean) || script.imagePrompts || [];
  if (prompts.length >= 2 && new Set(prompts).size !== prompts.length) {
    failures.push(`${script.slug}: Image Prompt values repeat`);
  }
}

function parseRuntime(value) {
  const match = String(value || '').match(/^(\d+)\s*-\s*(\d+)\s*minutes$/i);
  if (!match) return null;
  return { min: Number(match[1]), max: Number(match[2]) };
}

function secondsFromLabel(value) {
  const match = String(value || '').match(/(?:(\d+)\s*min)?\s*(?:(\d+)\s*sec)?/i);
  if (!match) return 0;
  return Number(match[1] || 0) * 60 + Number(match[2] || 0);
}

function estimatedNarrationSeconds(longformScript) {
  const wordCount = longformScript.join(' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.round(wordCount / 2.35);
}

function fail(messages) {
  for (const message of messages) {
    console.error(message);
  }
  process.exit(1);
}
