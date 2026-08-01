const fs = require('fs');
const path = require('path');
const {
  loadStories,
  loadLegacyStories
} = require('./lib/load-stories');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'data', 'stories', 'index.json');
const packagePath = path.join(root, 'data', 'stories', 'sailing-stones-death-valley.json');
const legacyPackagePath = path.join(root, 'data', 'stories', 'sailing-stones-racetrack-playa.json');
const indexOriginal = fs.readFileSync(indexPath, 'utf8');
const packageOriginal = fs.readFileSync(packagePath, 'utf8');
const legacyPackageOriginal = fs.readFileSync(legacyPackagePath, 'utf8');
const legacyStories = loadLegacyStories(root);
const mergedStories = loadStories(root);
const targetId = 'sailing-stones-death-valley';
const legacyTargetId = 'sailing-stones-racetrack-playa';

assert(mergedStories.length === legacyStories.length, 'Story count changed after merging independent content.');
assert(mergedStories.map((story) => story.id).join('|') === legacyStories.map((story) => story.id).join('|'), 'Story order changed after merging independent content.');
assert(mergedStories.filter((story) => story.id === targetId).length === 1, 'Sailing Stones was not represented exactly once.');
assert(mergedStories.find((story) => story.id === targetId).longformArticle.storyBody.length > 0, 'Sailing Stones did not load its longform sections.');
assert(mergedStories.filter((story) => story.id === legacyTargetId).length === 1, 'Legacy-format Sailing Stones was not represented exactly once.');
assert(!mergedStories.find((story) => story.id === legacyTargetId).longformArticle, 'Legacy-format package unexpectedly gained longformArticle.');

const tests = [
  {
    label: 'missing indexed file',
    mutate() {
      const index = parseIndex(indexOriginal);
      index.entries[0].file = 'missing-sailing-stones.json';
      fs.writeFileSync(indexPath, `${JSON.stringify(index.output, null, 2)}\n`, 'utf8');
    }
  },
  {
    label: 'record ID mismatch',
    mutate() {
      const data = JSON.parse(packageOriginal);
      data.id = 'incorrect-record-id';
      fs.writeFileSync(packagePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    }
  },
  {
    label: 'slug mismatch',
    mutate() {
      const data = JSON.parse(packageOriginal);
      data.slug = 'incorrect-slug';
      fs.writeFileSync(packagePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    }
  },
  {
    label: 'JSON parsing failure',
    mutate() {
      fs.writeFileSync(packagePath, '{ invalid json', 'utf8');
    }
  },
  {
    label: 'missing required content field',
    mutate() {
      const data = JSON.parse(packageOriginal);
      delete data.longformArticle.quickAnswer;
      fs.writeFileSync(packagePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    }
  },
  {
    label: 'missing required legacy content field',
    mutate() {
      const data = JSON.parse(legacyPackageOriginal);
      delete data.metaDescription;
      fs.writeFileSync(legacyPackagePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    }
  }
];

try {
  for (const test of tests) {
    fs.writeFileSync(indexPath, indexOriginal, 'utf8');
    fs.writeFileSync(packagePath, packageOriginal, 'utf8');
    fs.writeFileSync(legacyPackagePath, legacyPackageOriginal, 'utf8');
    test.mutate();
    let failed = false;
    try {
      loadStories(root);
    } catch (error) {
      failed = true;
    }
    assert(failed, `${test.label} did not fail the Story load.`);
    console.log(`Verified hard failure: ${test.label}`);
  }
} finally {
  fs.writeFileSync(indexPath, indexOriginal, 'utf8');
  fs.writeFileSync(packagePath, packageOriginal, 'utf8');
  fs.writeFileSync(legacyPackagePath, legacyPackageOriginal, 'utf8');
}

console.log(`Independent Story loader validation passed for ${mergedStories.length} Stories.`);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseIndex(source) {
  const index = JSON.parse(source);
  const entries = Array.isArray(index) ? index : index.stories;
  if (!Array.isArray(entries)) throw new Error('Story index must be an array or contain a stories array.');
  return { output: index, entries };
}
