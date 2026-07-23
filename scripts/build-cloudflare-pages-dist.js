const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = resolveDistRoot(process.argv.slice(2));
const MAX_ASSET_BYTES = 25 * 1024 * 1024;

const ROOT_FILES = [
  '404.html',
  '_headers',
  '_redirects',
  'about.html',
  'apple-touch-icon.png',
  'archive.html',
  'categories.html',
  'engagement.js',
  'favicon-32x32.png',
  'favicon-48x48.png',
  'favicon.ico',
  'fiction-disclaimer.html',
  'googlee0ebe11af75d9820.html',
  'icon-192.png',
  'icon-512.png',
  'index.html',
  'mystery-board.html',
  'newest.html',
  'popular.html',
  'privacy.html',
  'robots.txt',
  'rss.xml',
  'site.webmanifest',
  'sitemap.xml',
  'styles.css'
];

const ROOT_FILE_PATTERNS = [
  /^archive-\d+\.html$/,
  /^newest-\d+\.html$/,
  /^popular-\d+\.html$/
];

const STATIC_DIRS = [
  'assets',
  'categories',
  'mystery-board',
  'publishing-center',
  'search',
  'stories',
  'tags'
];

const SCRIPT_STATIC_DIRS = [
  'board',
  'categories',
  'featured',
  'latest',
  'resources'
];

const DATA_FILES = [
  'archive-search-index.json',
  'creator-library-search-index.json'
];

const FORBIDDEN_DIST_PATHS = [
  'data/scripts.json',
  'data/scripts-v2.json',
  'data/all-packs.json',
  'data/creator-packs.json',
  'data/creator-packs',
  'data/stories.json',
  'data/categories.json',
  'scripts-v2.json',
  'all-packs.json',
  'creator-packs.json',
  'functions',
  'node_modules',
  'docs',
  'AGENTS.md',
  'package.json'
];

function main() {
  resetDist();
  copyRootFiles();
  copyStaticDirs();
  copyScriptHtml();
  copySearchIndexes();
  verifyDist();
}

function resetDist() {
  const resolved = path.resolve(DIST);
  if (!resolved.startsWith(ROOT + path.sep)) {
    throw new Error(`Refusing to remove path outside repository: ${resolved}`);
  }
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
}

function resolveDistRoot(argv) {
  const distIndex = argv.indexOf('--dist');
  const value = distIndex >= 0 ? argv[distIndex + 1] : '';
  return path.resolve(ROOT, value || 'dist');
}

function copyRootFiles() {
  for (const file of ROOT_FILES) {
    copyRequiredFile(file);
  }

  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!ROOT_FILE_PATTERNS.some((pattern) => pattern.test(entry.name))) continue;
    copyRequiredFile(entry.name);
  }
}

function copyStaticDirs() {
  for (const dir of STATIC_DIRS) {
    copyDirectory(dir, dir);
  }
}

function copyScriptHtml() {
  const scriptsDir = path.join(ROOT, 'scripts');
  for (const entry of fs.readdirSync(scriptsDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.html')) {
      copyRequiredFile(path.join('scripts', entry.name));
    }
  }

  for (const dir of SCRIPT_STATIC_DIRS) {
    copyDirectory(path.join('scripts', dir), path.join('scripts', dir));
  }
}

function copySearchIndexes() {
  for (const file of DATA_FILES) {
    copyRequiredFile(path.join('data', file));
  }
}

function copyDirectory(fromRelative, toRelative) {
  const from = path.join(ROOT, fromRelative);
  if (!fs.existsSync(from)) return;
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const sourceRelative = path.join(fromRelative, entry.name);
    const targetRelative = path.join(toRelative, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourceRelative, targetRelative);
    } else if (entry.isFile()) {
      copyRequiredFile(sourceRelative, targetRelative);
    }
  }
}

function copyRequiredFile(fromRelative, toRelative = fromRelative) {
  const from = path.join(ROOT, fromRelative);
  const to = path.join(DIST, toRelative);
  if (!fs.existsSync(from)) {
    throw new Error(`Missing required file: ${fromRelative}`);
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function verifyDist() {
  const files = listFiles(DIST);
  const failures = [];

  for (const forbidden of FORBIDDEN_DIST_PATHS) {
    if (fs.existsSync(path.join(DIST, forbidden))) {
      failures.push(`Forbidden path in dist: ${forbidden}`);
    }
  }

  for (const required of [
    'index.html',
    'styles.css',
    'sitemap.xml',
    'robots.txt',
    '_headers',
    '_redirects',
    'scripts/osiris-isis-resurrection-myth-youtube-script.html',
    'data/archive-search-index.json',
    'data/creator-library-search-index.json'
  ]) {
    if (!fs.existsSync(path.join(DIST, required))) {
      failures.push(`Missing dist file: ${required}`);
    }
  }

  const oversize = files.filter((file) => fs.statSync(file).size >= MAX_ASSET_BYTES);
  for (const file of oversize) {
    failures.push(`Asset is 25 MiB or larger: ${toRelative(file)} (${formatBytes(fs.statSync(file).size)})`);
  }

  const osiris = fs.readFileSync(path.join(DIST, 'scripts/osiris-isis-resurrection-myth-youtube-script.html'), 'utf8');
  if (!osiris.includes('A cinematic mythic documentary scene shows Osiris and Isis introduced through Osiris within Egyptian cultural context')) {
    failures.push('Osiris latest Short-form Image Prompt was not found in dist HTML.');
  }

  const missingReferences = findMissingStaticReferences(files);
  failures.push(...missingReferences);

  if (failures.length) {
    for (const failure of failures) console.error(failure);
    process.exit(1);
  }

  const ranked = files
    .map((file) => ({ file: toRelative(file), size: fs.statSync(file).size }))
    .sort((a, b) => b.size - a.size);

  console.log(`Cloudflare Pages dist built: ${files.length} file(s).`);
  console.log(`Largest asset: ${ranked[0].file} (${formatBytes(ranked[0].size)}).`);
  console.log('Top 20 dist asset sizes:');
  for (const item of ranked.slice(0, 20)) {
    console.log(`- ${item.file}: ${formatBytes(item.size)}`);
  }
}

function findMissingStaticReferences(files) {
  const failures = [];
  const htmlFiles = files.filter((file) => file.endsWith('.html'));
  const attrs = /\b(?:href|src)=["']([^"']+)["']/g;

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = attrs.exec(html))) {
      const ref = match[1];
      if (!shouldCheckReference(ref)) continue;
      const clean = ref.split('#')[0].split('?')[0];
      if (!clean || clean === '/') continue;
      const target = path.join(DIST, clean.replace(/^\/+/, ''));
      const htmlTarget = `${target}.html`;
      const indexTarget = path.join(target, 'index.html');
      if (fs.existsSync(target) || fs.existsSync(htmlTarget) || fs.existsSync(indexTarget)) continue;
      failures.push(`${toRelative(file)} references missing asset ${clean}`);
    }
  }

  return failures;
}

function shouldCheckReference(ref) {
  return ref.startsWith('/')
    && !ref.startsWith('//')
    && !ref.startsWith('/api/')
    && !ref.startsWith('/stories/')
    && !ref.startsWith('/scripts/')
    && !ref.startsWith('/categories/')
    && !ref.startsWith('/tags/')
    && !ref.startsWith('/mystery-board/')
    && !ref.startsWith('/publishing-center/')
    && !ref.startsWith('/newest')
    && !ref.startsWith('/popular')
    && !ref.startsWith('/archive')
    && !ref.startsWith('/search');
}

function listFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    if (entry.isFile()) out.push(full);
  }
  return out;
}

function toRelative(file) {
  return path.relative(DIST, file).replace(/\\/g, '/');
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${bytes} B`;
}

main();
