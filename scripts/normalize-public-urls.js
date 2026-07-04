const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const publicExtensions = new Set(['.html', '.xml']);
const skipDirs = new Set(['.git', '.agents', '.codex', 'data', 'scripts', 'functions']);

const files = collectPublicFiles(root);
let changedCount = 0;

for (const filePath of files) {
  const before = fs.readFileSync(filePath, 'utf8');
  const after = normalizePublicUrls(before);
  if (after !== before) {
    fs.writeFileSync(filePath, after, 'utf8');
    changedCount += 1;
  }
}

console.log(`Normalized public URLs in ${changedCount} file(s).`);

function collectPublicFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectPublicFiles(entryPath));
      continue;
    }
    if (publicExtensions.has(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }
  return files;
}

function normalizePublicUrls(value) {
  return String(value)
    .replace(/https:\/\/www\.kyunolab\.com/g, 'https://kyunolab.com')
    .replace(/https:\/\/kyunolab\.com(\/[^"'<>?\s#]+)\.html(?=([#?"'<>\s]|$))/g, 'https://kyunolab.com$1')
    .replace(/(href|src|content|item)="(\/[^"#?]+)\.html(?=([#?"]))/g, '$1="$2')
    .replace(/(href|src|content|item)='(\/[^'#?]+)\.html(?=([#?']))/g, "$1='$2")
    .replace(/(<loc>https:\/\/kyunolab\.com\/[^<]+)\.html(<\/loc>)/g, '$1$2');
}
