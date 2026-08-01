const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { loadStories, loadLegacyStories, loadIndependentEntries } = require('./lib/load-stories');

const root = path.resolve(__dirname, '..');

function readDirCount(directory, extension) {
  if (!fs.existsSync(directory)) return 0;
  return fs.readdirSync(directory)
    .filter((file) => file.endsWith(extension))
    .filter((file) => file !== 'index.json')
    .length;
}

function git(args) {
  const result = spawnSync('git', [
    '-c',
    `safe.directory=${root.replace(/\\/g, '/')}`,
    '-C',
    root,
    ...args
  ], { encoding: 'utf8' });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: String(result.stdout || ''),
    stderr: String(result.stderr || '')
  };
}

function countBy(items, getKey) {
  const counts = {};
  for (const item of items) {
    const key = getKey(item) || 'unknown';
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function listFiles(directory, extension) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((file) => file.endsWith(extension))
    .filter((file) => file !== 'index.json')
    .map((file) => file.replace(new RegExp(`${extension.replace('.', '\\.')}$`), ''))
    .sort();
}

function statusLines() {
  const status = git(['status', '--short']);
  if (!status.ok || !status.stdout) return [];
  return status.stdout.split(/\r?\n/).filter((line) => line.trim());
}

function summarizeStatus(lines) {
  const groups = {
    archivePackages: 0,
    archiveMarkdown: 0,
    archiveHtml: 0,
    distArchiveHtml: 0,
    tools: 0,
    docs: 0,
    scripts: 0,
    other: 0
  };

  for (const line of lines) {
    const file = line.replace(/^(?:.. |. )/, '').replace(/\\/g, '/');
    if (/^data\/stories\/[^/]+\.json$/.test(file)) groups.archivePackages += 1;
    else if (/^data\/stories\/[^/]+\.md$/.test(file)) groups.archiveMarkdown += 1;
    else if (/^stories\/[^/]+\.html$/.test(file)) groups.archiveHtml += 1;
    else if (/^dist\/stories\/[^/]+\.html$/.test(file)) groups.distArchiveHtml += 1;
    else if (/^(data\/tools|tools)\//.test(file)) groups.tools += 1;
    else if (/^docs\//.test(file)) groups.docs += 1;
    else if (/^scripts\//.test(file)) groups.scripts += 1;
    else groups.other += 1;
  }

  return groups;
}

function main() {
  const legacyStories = loadLegacyStories(root);
  const independentEntries = loadIndependentEntries(root);
  const mergedStories = loadStories(root);
  const independentSlugs = new Set(independentEntries.map((entry) => entry.slug));
  const legacySlugs = new Set(legacyStories.map((story) => story.slug));
  const dataStoriesDir = path.join(root, 'data', 'stories');
  const packageJsonSlugs = listFiles(dataStoriesDir, '.json');
  const markdownSlugs = listFiles(dataStoriesDir, '.md');
  const htmlCount = readDirCount(path.join(root, 'stories'), '.html');
  const distHtmlCount = readDirCount(path.join(root, 'dist', 'stories'), '.html');
  const lines = statusLines();

  const missingLegacyForIndependent = independentEntries
    .filter((entry) => !legacySlugs.has(entry.slug))
    .map((entry) => entry.slug);
  const packageJsonNotIndexed = packageJsonSlugs
    .filter((slug) => !independentSlugs.has(slug));
  const indexedPackageMissing = independentEntries
    .filter((entry) => !fs.existsSync(path.join(dataStoriesDir, entry.file)))
    .map((entry) => entry.file);

  const checks = [
    {
      name: 'full archive count matches public HTML',
      ok: legacyStories.length === htmlCount && legacyStories.length === distHtmlCount
    },
    {
      name: 'merged archive count matches full archive',
      ok: mergedStories.length === legacyStories.length
    },
    {
      name: 'independent packages all map to legacy records',
      ok: missingLegacyForIndependent.length === 0
    },
    {
      name: 'independent package JSON files are indexed',
      ok: packageJsonNotIndexed.length === 0
    },
    {
      name: 'indexed independent package files exist',
      ok: indexedPackageMissing.length === 0
    }
  ];

  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim() || '(unknown)';
  const head = git(['rev-parse', 'HEAD']).stdout.trim() || '(unknown)';
  const originMain = git(['rev-parse', 'origin/main']).stdout.trim() || '(unknown)';

  console.log('Kyunolab content root audit');
  console.log('');
  console.log(`Repo root: ${root}`);
  console.log(`Branch: ${branch}`);
  console.log(`HEAD: ${head}`);
  console.log(`origin/main: ${originMain}`);
  console.log('');
  console.log('Archive counts');
  console.table({
    'data/stories.json full archive': legacyStories.length,
    'merged loadStories result': mergedStories.length,
    'data/stories/index.json independent entries': independentEntries.length,
    'data/stories/*.json package files': packageJsonSlugs.length,
    'data/stories/*.md filesystem files': markdownSlugs.length,
    'legacy-only records': legacyStories.length - independentEntries.length,
    'stories/*.html': htmlCount,
    'dist/stories/*.html': distHtmlCount
  });
  console.log('');
  console.log('Merged archive category counts');
  console.table(countBy(mergedStories, (story) => story.category));
  console.log('');
  console.log('Reserved tool roots');
  console.table({
    'data/tools': fs.existsSync(path.join(root, 'data', 'tools')) ? 'exists' : 'reserved, missing',
    tools: fs.existsSync(path.join(root, 'tools')) ? 'exists' : 'reserved, missing',
    'dist/tools': fs.existsSync(path.join(root, 'dist', 'tools')) ? 'exists' : 'generated/reserved, missing'
  });
  console.log('');
  console.log('Checks');
  console.table(checks);
  console.log('');
  console.log('Working tree summary');
  console.table({
    dirtyLines: lines.length,
    ...summarizeStatus(lines)
  });

  if (lines.length) {
    console.log('');
    console.log('Dirty files');
    for (const line of lines) console.log(line);
  }

  const failed = checks.filter((check) => !check.ok);
  if (failed.length) {
    process.exitCode = 1;
  }
}

main();
