const {
  sanitizeCreatorInputText
} = require('./creator-library-input');

const BANNED_NARRATION_PATTERNS = [
  /viewer should/i,
  /hold that image/i,
  /this part should/i,
  /the article separates/i,
  /source-aware record/i,
  /source-aware kyunolab/i,
  /the goal of this scene/i,
  /image prompt/i,
  /motion prompt/i,
  /voice direction/i,
  /sound effect/i,
  /background music/i,
  /creator note/i,
  /editing guide/i
];

function buildCreatorLongform(normalizedInput, scenePlan) {
  const scenes = scenePlan.scenes.map((scene) => ({
    sceneIndex: scene.sceneIndex,
    role: scene.role,
    narrationParts: scene.narrationParts.map((partPlan) => buildNarrationPart(normalizedInput, scene, partPlan))
  }));
  const allNarration = scenes.flatMap((scene) => scene.narrationParts.map((part) => part.narration)).join(' ');
  const totalWordCount = countWords(allNarration);
  const narrationReadSeconds = estimateNarrationReadTime(allNarration);
  const targetFinalVideoSeconds = Math.max(scenePlan.targetFinalVideoSeconds, narrationReadSeconds + 35);
  const result = {
    scenes,
    totalWordCount,
    narrationReadSeconds,
    targetFinalVideoSeconds,
    warnings: []
  };
  const validation = validateCreatorLongform(result, scenePlan);
  if (!validation.valid) {
    const error = new Error(`Creator Long-form invalid for ${scenePlan.slug}`);
    error.code = 'CREATOR_LONGFORM_INVALID';
    error.slug = scenePlan.slug;
    error.errors = validation.errors;
    throw error;
  }
  return result;
}

function buildNarrationPart(normalizedInput, scene, partPlan) {
  const topic = cleanNarrationText(normalizedInput.topic);
  const role = cleanNarrationText(scene.role);
  const entities = readableList(scene.requiredEntities.length ? scene.requiredEntities : normalizedInput.knownNames, topic);
  const facts = partPlan.sourceFacts.map(cleanNarrationText).filter(Boolean);
  const primaryFact = facts[0];
  const supportingFact = facts[1] || scene.sourceFacts.find((fact) => fact !== primaryFact) || scene.purpose;
  if (!primaryFact) {
    const error = new Error(`Missing source fact for ${normalizedInput.slug} Scene ${scene.sceneIndex} Part ${partPlan.partIndex}`);
    error.code = 'CREATOR_LONGFORM_INPUT_MISSING';
    error.slug = normalizedInput.slug;
    error.errors = [`Scene ${scene.sceneIndex} Part ${partPlan.partIndex} has no source fact.`];
    throw error;
  }

  const bridge = bridgeForScene(scene, partPlan);
  const contextLine = contextLineForScene(normalizedInput, scene);
  const ending = endingLineForScene(scene, normalizedInput);
  const draft = [
    `${topic} ${bridge} ${primaryFact}`,
    `${supportingFact}`,
    `${contextLine}`,
    `${ending}`
  ].map(cleanNarrationText).filter(Boolean).join(' ');
  const narration = fitNarrationLength(draft, normalizedInput, scene, partPlan);
  return {
    partIndex: partPlan.partIndex,
    narration,
    wordCount: countWords(narration),
    estimatedReadSeconds: estimateNarrationReadTime(narration),
    sourceFieldRefs: partPlan.sourceFieldRefs || []
  };
}

function validateCreatorLongform(result, scenePlan) {
  const errors = [];
  if (!result || typeof result !== 'object') errors.push('Long-form result must be an object.');
  if (!Array.isArray(result?.scenes) || result.scenes.length !== 5) errors.push('Long-form result must contain 5 scenes.');
  let partCount = 0;
  const narrationParts = [];
  (result?.scenes || []).forEach((scene, sceneIndex) => {
    if (scene.sceneIndex !== sceneIndex + 1) errors.push(`Scene ${sceneIndex + 1} has invalid sceneIndex.`);
    if (!Array.isArray(scene.narrationParts) || scene.narrationParts.length !== 2) {
      errors.push(`Scene ${sceneIndex + 1} must contain 2 narration parts.`);
    }
    (scene.narrationParts || []).forEach((part) => {
      partCount += 1;
      narrationParts.push(part.narration);
      if (!part.narration) errors.push(`Scene ${sceneIndex + 1} Part ${part.partIndex || '?'} has no narration.`);
      if (part.wordCount < 55 || part.wordCount > 85) errors.push(`Scene ${sceneIndex + 1} Part ${part.partIndex || '?'} word count outside 55-85: ${part.wordCount}`);
      if (!Array.isArray(part.sourceFieldRefs) || !part.sourceFieldRefs.length) errors.push(`Scene ${sceneIndex + 1} Part ${part.partIndex || '?'} has no source refs.`);
      const meta = detectNarrationMetaLanguage(part.narration);
      if (meta.length) errors.push(`Scene ${sceneIndex + 1} Part ${part.partIndex || '?'} contains meta language: ${meta.join(', ')}`);
    });
  });
  if (partCount !== 10) errors.push(`Long-form must contain exactly 10 narration parts, found ${partCount}.`);
  if (result.totalWordCount < 620 || result.totalWordCount > 760) errors.push(`Long-form total word count outside 620-760: ${result.totalWordCount}`);
  if (result.narrationReadSeconds < 265 || result.narrationReadSeconds > 325) errors.push(`Narration read time outside 265-325 seconds: ${result.narrationReadSeconds}`);
  if (result.targetFinalVideoSeconds < result.narrationReadSeconds) errors.push('Final video seconds must not be shorter than narration read seconds.');
  if (result.targetFinalVideoSeconds < 300 || result.targetFinalVideoSeconds > 360) errors.push(`Final video seconds outside 300-360: ${result.targetFinalVideoSeconds}`);
  if (hasDuplicateNarration(narrationParts)) errors.push('Duplicate Narration Part detected.');
  if (!scenePlan || scenePlan.scenes?.length !== result.scenes?.length) errors.push('Long-form scenes do not match Scene Plan.');
  return { valid: errors.length === 0, errors };
}

function estimateNarrationReadTime(text) {
  return Math.round(countWords(text) / 2.35);
}

function cleanNarrationText(value) {
  return sanitizeCreatorInputText(value)
    .replace(/\bThe article explains\b/gi, 'The story shows')
    .replace(/\bThis article explains\b/gi, 'The story shows')
    .replace(/\bsource-aware Kyunolab record\b/gi, 'record')
    .replace(/\bviewer should\b/gi, 'we can')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectNarrationMetaLanguage(value) {
  return BANNED_NARRATION_PATTERNS
    .filter((pattern) => pattern.test(String(value || '')))
    .map((pattern) => pattern.toString());
}

function bridgeForScene(scene, partPlan) {
  if (scene.sceneIndex === 1 && partPlan.partIndex === 1) return 'begins with a detail that gives the story its shape.';
  if (scene.sceneIndex === 1) return 'then becomes clearer when the central problem comes into view.';
  if (scene.sceneIndex === 2 && partPlan.partIndex === 1) return 'moves forward through the main sequence of events.';
  if (scene.sceneIndex === 2) return 'depends on how those actions change the situation.';
  if (scene.sceneIndex === 3 && partPlan.partIndex === 1) return 'turns when the strongest change arrives.';
  if (scene.sceneIndex === 3) return 'carries that change into a direct consequence.';
  if (scene.sceneIndex === 4 && partPlan.partIndex === 1) return 'is also remembered through details that vary across accounts.';
  if (scene.sceneIndex === 4) return 'needs its source context kept close to the story.';
  if (scene.sceneIndex === 5 && partPlan.partIndex === 1) return 'ends by returning to the result left behind.';
  return 'lasts because the final meaning remains open enough to be remembered.';
}

function contextLineForScene(normalizedInput, scene) {
  if (scene.sceneIndex === 4) {
    const source = scene.sourceGuidance[0] || normalizedInput.sourceContext[0];
    return source ? `That source context matters because ${lowercaseStart(source)}` : '';
  }
  if (scene.sceneIndex === 5) {
    const meaning = scene.meaningGuidance[0] || normalizedInput.meaningOptions[0];
    return meaning ? `The meaning stays with the story because ${lowercaseStart(meaning)}` : '';
  }
  const entity = scene.requiredEntities[0] || normalizedInput.knownNames[0] || normalizedInput.topic;
  return `The focus stays on ${entity}, so the sequence remains tied to the confirmed story material.`;
}

function endingLineForScene(scene, normalizedInput) {
  if (scene.sceneIndex === 1) return 'That opening gives the audience a clear way into the story before the larger pattern appears.';
  if (scene.sceneIndex === 2) return 'By the end of this movement, the story has shifted from setup into action.';
  if (scene.sceneIndex === 3) return 'After that turn, the result is no longer abstract; it changes how the rest of the story is understood.';
  if (scene.sceneIndex === 4) return 'Those limits keep the retelling careful, because not every later detail belongs to the same layer of tradition.';
  const outcome = normalizedInput.outcome[0] || normalizedInput.meaningOptions[0];
  return outcome ? `The final impression is simple: ${lowercaseStart(outcome)}` : 'The story closes with a question that remains part of its memory.';
}

function fitNarrationLength(value, normalizedInput, scene, partPlan) {
  const additions = [
    `The wording can stay calm because the tension comes from the order of facts, not from exaggeration.`,
    `This keeps the narration grounded in ${readableList(scene.requiredEntities, normalizedInput.topic)} and in the material already preserved by the archive.`,
    `It also prepares the next part without turning uncertainty into a claim stronger than the sources allow.`
  ];
  let narration = cleanNarrationText(value);
  let index = 0;
  while (countWords(narration) < partPlan.targetWords && index < additions.length) {
    narration = `${narration} ${additions[index]}`;
    index += 1;
  }
  if (countWords(narration) > 85) {
    const sentences = splitSentences(narration);
    while (sentences.length > 2 && countWords(sentences.join(' ')) > 85) {
      sentences.pop();
    }
    narration = sentences.join(' ');
  }
  return cleanNarrationText(narration);
}

function readableList(items, fallback) {
  const values = (items || []).map(cleanNarrationText).filter(Boolean).slice(0, 3);
  if (!values.length) return fallback;
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values[0]}, ${values[1]}, and ${values[2]}`;
}

function lowercaseStart(value) {
  const text = cleanNarrationText(value);
  return text ? `${text.charAt(0).toLowerCase()}${text.slice(1)}` : '';
}

function splitSentences(value) {
  return String(value || '').match(/[^.!?]+[.!?]+/g)?.map((item) => item.trim()).filter(Boolean) || [value];
}

function countWords(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

function hasDuplicateNarration(parts) {
  const seen = new Set();
  for (const part of parts) {
    const key = String(part || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

module.exports = {
  buildCreatorLongform,
  buildNarrationPart,
  validateCreatorLongform,
  estimateNarrationReadTime,
  cleanNarrationText,
  detectNarrationMetaLanguage
};
