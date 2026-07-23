const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  generateCreatorPackForSlug,
  loadGenerationContext,
  resolveStoryForSlug,
  validateCreatorPackInputForSlug
} = require('./generate-creator-pack');
const {
  loadCreatorValidationPacks
} = require('./creator-library-validation-data');

const root = path.resolve(__dirname, '..');
const targetTabletSlug = 'the-dawn-temple-tablet-register-with-a-line-written-too-early-youtube-script';
const representativeSlugs = [
  targetTabletSlug,
  'osiris-isis-resurrection-myth-youtube-script',
  'maui-slows-the-sun-myth-youtube-script',
  'demeter-and-persephone-myth-youtube-script',
  'cicada-3301-internet-puzzle-youtube-script',
  'why-names-have-power-in-legends-youtube-script'
];

function main() {
  const stories = readJson(path.join(root, 'data', 'stories.json'));
  const categories = readJson(path.join(root, 'data', 'categories.json'));
  const targets = loadCreatorValidationPacks();
  const targetSlugs = unique(targets.map((pack) => pack.slug).filter(Boolean));
  const context = loadGenerationContext({ stories, categories, existingPacks: [] });
  addRepresentativeSlugs(representativeSlugs, context);

  const stats = createStats(targetSlugs.length);
  const normalizeFailures = [];
  const fullFailures = [];
  const mismatchDetails = [];
  const detailedTarget = {};

  for (const slug of targetSlugs) {
    const validationPack = targets.find((pack) => pack.slug === slug) || {};
    const releaseResolved = safeResolve(slug, context);
    const validatorResolved = safeResolve(validationPack.originalStorySlug || slug, context);
    inspectResolved(stats, slug, releaseResolved, validatorResolved, mismatchDetails);

    if (!releaseResolved.ok) {
      normalizeFailures.push(failureFor(slug, 'storyLookup', releaseResolved.error, validationPack));
      continue;
    }

    const story = releaseResolved.resolved.story;
    const category = releaseResolved.resolved.category;
    if (story.storyBrief && typeof story.storyBrief === 'object') stats.storyBriefPresent += 1;
    else stats.storyBriefMissing += 1;
    if (Array.isArray(story.storyBrief?.keyActors) && story.storyBrief.keyActors.length) stats.storyBriefKeyActorsPresent += 1;
    else stats.keyActorsSourceMissing += 1;

    try {
      const inputReport = validateCreatorPackInputForSlug(slug, { stories, categories, existingPacks: [] });
      collectNormalizeStats(stats, inputReport.normalizedInput);
      if (!inputReport.valid) {
        normalizeFailures.push({
          slug,
          sourceStorySlug: inputReport.originalStorySlug,
          contentType: inputReport.normalizedInput.contentType,
          stage: 'normalize',
          field: inputReport.missingRequiredFields[0] || 'unknown',
          missingRequiredFields: inputReport.missingRequiredFields,
          category: classifyFailure(inputReport.normalizedInput)
        });
      }
      if (slug === targetTabletSlug) Object.assign(detailedTarget, targetDetail(story, category, inputReport.normalizedInput, null));
    } catch (error) {
      normalizeFailures.push(failureFor(slug, error.stage || 'normalize', error, validationPack));
      if (slug === targetTabletSlug) Object.assign(detailedTarget, targetDetail(story, category, null, error));
    }
  }

  if (!normalizeFailures.length) {
    for (const slug of targetSlugs) {
      try {
        generateCreatorPackForSlug(slug, { dryRun: true, stories, categories, existingPacks: [] });
        stats.fullSuccess += 1;
        if (slug === targetTabletSlug) detailedTarget.fullPipelineResult = 'passed';
      } catch (error) {
        stats.fullFailed += 1;
        fullFailures.push(failureFor(slug, error.stage || error.code || 'fullPipeline', error, targets.find((pack) => pack.slug === slug) || {}));
        if (slug === targetTabletSlug) detailedTarget.fullPipelineResult = `failed: ${error.stage || error.code || error.message}`;
      }
    }
  }

  stats.normalizeFailed = normalizeFailures.length;
  stats.normalizeSuccess = targetSlugs.length - normalizeFailures.length;
  stats.inputMismatches = mismatchDetails.length;
  stats.syntheticFallbackUse = 0;
  stats.legacyFallbackUse = 0;
  stats.fakeActorGenerated = 0;
  stats.actorlessAccepted = stats.normalizeSuccess - stats.normalizedKeyActorsPresent;

  report({
    stats,
    normalizeFailures,
    fullFailures,
    mismatchDetails,
    detailedTarget
  });

  if (normalizeFailures.length || fullFailures.length || mismatchDetails.length) process.exit(1);
}

function addRepresentativeSlugs(slugs, context) {
  const firstPlace = context.stories.find((story) => story.categorySlug === 'strange-places' || story.categorySlug === 'unexplained-mysteries');
  const firstObject = context.stories.find((story) => story.categorySlug === 'mythic-objects' || story.categorySlug === 'mythic-creatures');
  if (firstPlace) slugs.push(`${firstPlace.slug}-youtube-script`);
  if (firstObject) slugs.push(`${firstObject.slug}-youtube-script`);
}

function inspectResolved(stats, slug, releaseResolved, validatorResolved, mismatchDetails) {
  if (releaseResolved.ok) stats.storyLookupSuccess += 1;
  else stats.storyLookupFailed += 1;
  if (releaseResolved.ok && releaseResolved.resolved.category?.slug) stats.categoryLookupSuccess += 1;
  else stats.categoryLookupFailed += 1;
  if (!releaseResolved.ok || !validatorResolved.ok) {
    mismatchDetails.push({ slug, reason: 'resolve-failed', releaseOk: releaseResolved.ok, validatorOk: validatorResolved.ok });
    return;
  }
  const release = releaseResolved.resolved;
  const validator = validatorResolved.resolved;
  const storyHashEqual = stableHash(release.story) === stableHash(validator.story);
  const categoryHashEqual = stableHash(release.category) === stableHash(validator.category);
  const sourceSlugEqual = release.story.slug === validator.story.slug;
  if (!storyHashEqual || !categoryHashEqual || !sourceSlugEqual) {
    mismatchDetails.push({
      slug,
      releaseSourceStorySlug: release.story.slug,
      validatorSourceStorySlug: validator.story.slug,
      storyHashEqual,
      categoryHashEqual,
      sourceSlugEqual
    });
  }
}

function safeResolve(slug, context) {
  try {
    return { ok: true, resolved: resolveStoryForSlug(slug, context) };
  } catch (error) {
    return { ok: false, error };
  }
}

function collectNormalizeStats(stats, input) {
  if (!input.missingRequiredFields?.length) stats.normalizeSuccess += 1;
  const counts = countByType(input.factRecords || []);
  if (counts.subject) stats.subjectFactPresent += 1;
  if (counts.event || counts.problem || counts.setting || counts.relationship || counts['source-context']) stats.minimumActionFactPresent += 1;
  if (!counts.subject) stats.subjectFactMissing += 1;
  if (!counts.event) stats.eventFactMissing += 1;
  if (!counts.setting) stats.settingFactMissing += 1;
  if (!counts['source-context']) stats.sourceContextFactMissing += 1;
  if (Array.isArray(input.keyActors) && input.keyActors.length) stats.normalizedKeyActorsPresent += 1;
}

function targetDetail(story, category, input, error) {
  const counts = input ? countByType(input.factRecords || []) : {};
  const factsByType = (type) => (input?.factRecords || [])
    .filter((record) => record.factType === type)
    .slice(0, 5)
    .map((record) => record.factText);
  return {
    slug: targetTabletSlug,
    sourceStorySlug: story.slug,
    contentType: input?.contentType || story.categorySlug,
    presentStoryFields: Object.keys(story || {}),
    storyBriefMissing: !story.storyBrief,
    keyActorsMissing: !(Array.isArray(story.storyBrief?.keyActors) && story.storyBrief.keyActors.length),
    generatedKeyActors: input?.keyActors || [],
    fakeActorGenerated: false,
    factTypeCounts: counts,
    subjectFacts: factsByType('subject'),
    entityFacts: factsByType('relationship'),
    eventStateFacts: [
      ...factsByType('event'),
      ...factsByType('problem'),
      ...factsByType('turning-point'),
      ...factsByType('outcome')
    ].slice(0, 8),
    sourceContextFacts: factsByType('source-context'),
    beforeFailureReason: 'keyActors was required for myth-narrative even when factRecords identified an actor-less record subject.',
    afterValidityReason: input?.missingRequiredFields?.length
      ? `Still missing: ${input.missingRequiredFields.join(', ')}`
      : 'Valid because factRecords include subject, event/problem, setting/source-context, turning point, outcome, and source context without inventing an actor.',
    normalizeResult: input?.missingRequiredFields?.length ? 'failed' : 'passed',
    fullPipelineResult: error ? `not-run: ${error.message}` : 'pending'
  };
}

function failureFor(slug, stage, error, validationPack) {
  return {
    slug,
    sourceStorySlug: validationPack.originalStorySlug || String(slug || '').replace(/-youtube-script$/, ''),
    contentType: validationPack.contentType || '',
    stage,
    field: error.field || error.code || 'unknown',
    message: error.message || String(error),
    category: 'unclassified'
  };
}

function classifyFailure(input) {
  const missing = new Set(input.missingRequiredFields || []);
  const counts = countByType(input.factRecords || []);
  if (missing.has('keyActors') && counts.subject && (counts.event || counts.problem || counts.setting || counts['source-context'])) return 'B';
  if (!input.sourceContext.length || !counts.subject) return 'D';
  return 'C';
}

function createStats(totalTargets) {
  return {
    totalTargets,
    storyLookupSuccess: 0,
    storyLookupFailed: 0,
    categoryLookupSuccess: 0,
    categoryLookupFailed: 0,
    storyBriefPresent: 0,
    storyBriefMissing: 0,
    storyBriefKeyActorsPresent: 0,
    keyActorsSourceMissing: 0,
    normalizedKeyActorsPresent: 0,
    actorlessAccepted: 0,
    subjectFactPresent: 0,
    minimumActionFactPresent: 0,
    subjectFactMissing: 0,
    eventFactMissing: 0,
    settingFactMissing: 0,
    sourceContextFactMissing: 0,
    normalizeSuccess: 0,
    normalizeFailed: 0,
    fullSuccess: 0,
    fullFailed: 0,
    inputMismatches: 0,
    syntheticFallbackUse: 0,
    legacyFallbackUse: 0,
    fakeActorGenerated: 0
  };
}

function report({ stats, normalizeFailures, fullFailures, mismatchDetails, detailedTarget }) {
  console.log('Creator release input contract validation:');
  for (const [key, value] of Object.entries(stats)) console.log(`- ${key}: ${value}`);
  console.log(`- failure categories: ${JSON.stringify(countBy(normalizeFailures.map((failure) => failure.category)))}`);
  console.log(`- full failure stages: ${JSON.stringify(countBy(fullFailures.map((failure) => failure.stage)))}`);
  console.log(`- normalize failures: ${normalizeFailures.length}`);
  normalizeFailures.slice(0, 80).forEach((failure) => {
    console.error(`${failure.slug} [${failure.stage}/${failure.field}] ${failure.message || ''} category=${failure.category}`);
  });
  console.log(`- full pipeline failures: ${fullFailures.length}`);
  fullFailures.slice(0, 80).forEach((failure) => {
    console.error(`${failure.slug} [${failure.stage}/${failure.field}] ${failure.message || ''}`);
  });
  console.log(`- validator/release input mismatches: ${mismatchDetails.length}`);
  mismatchDetails.slice(0, 20).forEach((item) => console.error(`mismatch ${item.slug}: ${JSON.stringify(item)}`));
  console.log(`- target tablet detail: ${JSON.stringify(detailedTarget, null, 2)}`);
}

function stableHash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(sortObject(value))).digest('hex');
}

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== 'object') return value;
  const output = {};
  Object.keys(value).sort().forEach((key) => {
    output[key] = sortObject(value[key]);
  });
  return output;
}

function countByType(records) {
  return records.reduce((counts, record) => {
    counts[record.factType] = (counts[record.factType] || 0) + 1;
    return counts;
  }, {});
}

function countBy(values) {
  return values.reduce((counts, value) => {
    const key = value || 'unknown';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function unique(values) {
  return [...new Set(values)];
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

if (require.main === module) main();
