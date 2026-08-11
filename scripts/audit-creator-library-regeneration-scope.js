const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const boardPath = path.join(root, 'data', 'library-board.json');
const packsRoot = path.join(root, 'data', 'creator-packs');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listCreatorPacks() {
  return fs.readdirSync(packsRoot)
    .filter((fileName) => fileName.endsWith('.json') && fileName !== 'manifest.json')
    .map((fileName) => {
      const pack = readJson(path.join(packsRoot, fileName));
      return {
        fileName,
        slug: pack.slug || fileName.replace(/\.json$/, ''),
        title: pack.title || '',
        originalStorySlug: pack.originalStorySlug || pack.sourceStorySlug || pack.archiveSlug || '',
        estimatedVideoLength: pack.estimatedVideoLength || ''
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function auditScope() {
  const boardPosts = readJson(boardPath);
  const boardSlugs = new Set(boardPosts.map((post) => post.slug));
  const packs = listCreatorPacks();
  const boardSlugCollisions = packs
    .filter((pack) => boardSlugs.has(pack.slug))
    .map((pack) => pack.slug);
  const completed7to8 = packs.filter((pack) => pack.estimatedVideoLength === '7-8 minutes');
  const remaining5to6 = packs.filter((pack) => pack.estimatedVideoLength === '5-6 minutes');
  const otherNot7to8 = packs.filter((pack) => pack.estimatedVideoLength !== '7-8 minutes' && pack.estimatedVideoLength !== '5-6 minutes');

  return {
    policy: {
      completionTarget: 'creator-packs only',
      excludedFromRegeneration: 'library-board posts',
      completionStandard: 'estimatedVideoLength === 7-8 minutes',
      boardCollisionRule: 'fail if any library-board slug appears in creator-packs'
    },
    libraryBoardExcluded: boardPosts.length,
    creatorPackTargetTotal: packs.length,
    completed7to8: completed7to8.length,
    remaining5to6: remaining5to6.length,
    otherNot7to8: otherNot7to8.length,
    notAtCurrentStandard: packs.length - completed7to8.length,
    boardSlugCollisionsInCreatorPacks: boardSlugCollisions,
    nextEligible5to6: remaining5to6.slice(0, 20).map((pack) => ({
      slug: pack.slug,
      originalStorySlug: pack.originalStorySlug,
      estimatedVideoLength: pack.estimatedVideoLength
    }))
  };
}

const report = auditScope();
console.log(JSON.stringify(report, null, 2));

if (report.boardSlugCollisionsInCreatorPacks.length) {
  process.exitCode = 1;
}
