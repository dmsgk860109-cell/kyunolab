const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const MAX_ASSET_BYTES = 25 * 1024 * 1024;

const REQUIRED_FILES = [
  'index.html',
  'styles.css',
  'sitemap.xml',
  'robots.txt',
  '_headers',
  '_redirects',
  'scripts/osiris-isis-resurrection-myth-youtube-script.html',
  'data/archive-search-index.json',
  'data/creator-library-search-index.json'
];

const FORBIDDEN_PATHS = [
  'data/scripts.json',
  'data/stories.json',
  'data/categories.json',
  'functions',
  'node_modules',
  'docs',
  'AGENTS.md',
  'package.json'
];

function main() {
  if (!fs.existsSync(DIST)) {
    fail(['dist directory does not exist. Run node scripts/build-cloudflare-pages-dist.js first.']);
  }

  const files = listFiles(DIST);
  const failures = [];

  for (const file of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(DIST, file))) failures.push(`Missing required file: ${file}`);
  }

  for (const forbidden of FORBIDDEN_PATHS) {
    if (fs.existsSync(path.join(DIST, forbidden))) failures.push(`Forbidden path exists: ${forbidden}`);
  }

  const oversize = files.filter((file) => fs.statSync(file).size >= MAX_ASSET_BYTES);
  for (const file of oversize) {
    failures.push(`Asset is 25 MiB or larger: ${toRelative(file)} (${formatBytes(fs.statSync(file).size)})`);
  }

  const osirisPath = path.join(DIST, 'scripts/osiris-isis-resurrection-myth-youtube-script.html');
  if (fs.existsSync(osirisPath)) {
    const osiris = fs.readFileSync(osirisPath, 'utf8');
    if (!osiris.includes('A cinematic mythic documentary scene shows Osiris and Isis introduced through Osiris within Egyptian cultural context')) {
      failures.push('Osiris latest Short-form Image Prompt was not found in dist HTML.');
    }
  }

  const wranglerPath = path.join(ROOT, 'wrangler.toml');
  if (!fs.existsSync(wranglerPath)) {
    failures.push('wrangler.toml does not exist.');
  } else {
    const wrangler = fs.readFileSync(wranglerPath, 'utf8');
    if (!/pages_build_output_dir\s*=\s*"\.\/dist"/.test(wrangler)) {
      failures.push('wrangler.toml does not point pages_build_output_dir at ./dist.');
    }
  }

  if (!fs.existsSync(path.join(ROOT, 'data/scripts.json'))) {
    failures.push('Repository source data/scripts.json is missing.');
  }

  if (!fs.existsSync(path.join(ROOT, 'functions')) || fs.existsSync(path.join(DIST, 'functions'))) {
    failures.push('functions must exist at repository root only and must not be copied into dist.');
  }

  if (failures.length) fail(failures);

  const ranked = files
    .map((file) => ({ file: toRelative(file), size: fs.statSync(file).size }))
    .sort((a, b) => b.size - a.size);

  console.log(`Cloudflare Pages dist verification passed.`);
  console.log(`Total dist files: ${files.length}`);
  console.log(`Largest dist file: ${ranked[0].file} (${formatBytes(ranked[0].size)})`);
  console.log(`Files at or above 25 MiB: ${oversize.length}`);
  console.log('Top 20 dist asset sizes:');
  for (const item of ranked.slice(0, 20)) {
    console.log(`- ${item.file}: ${formatBytes(item.size)}`);
  }
}

function fail(failures) {
  for (const failure of failures) console.error(failure);
  process.exit(1);
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
