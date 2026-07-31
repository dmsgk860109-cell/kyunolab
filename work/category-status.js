const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const storyFiles = fs.readdirSync("stories").filter((file) => file.endsWith(".html")).sort();
const localJson = new Set(
  fs
    .readdirSync("data/stories")
    .filter((file) => file.endsWith(".json") && file !== "index.json")
    .map((file) => path.basename(file, ".json")),
);

const headFiles = cp
  .execSync("git ls-tree -r --name-only HEAD data/stories", { encoding: "utf8" })
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);
const headJson = new Set(
  headFiles
    .filter((file) => file.endsWith(".json") && !file.endsWith("/index.json"))
    .map((file) => path.basename(file, ".json")),
);

const byCat = {};

for (const file of storyFiles) {
  const slug = path.basename(file, ".html");
  const html = fs.readFileSync(path.join("stories", file), "utf8");
  const match =
    html.match(/<p class="label">([^<]+)<\/p>/) ||
    html.match(/<dt>Category<\/dt><dd><a[^>]*>([^<]+)<\/a>/);
  const category = match ? match[1].trim() : "(unknown)";
  byCat[category] ??= {
    category,
    total: 0,
    deployedRegenerated: 0,
    regeneratedNotDeployed: 0,
    notRegenerated: 0,
    nextNotRegenerated: [],
  };

  const row = byCat[category];
  row.total += 1;

  if (headJson.has(slug)) {
    row.deployedRegenerated += 1;
  } else if (localJson.has(slug)) {
    row.regeneratedNotDeployed += 1;
  } else {
    row.notRegenerated += 1;
    if (row.nextNotRegenerated.length < 5) row.nextNotRegenerated.push(slug);
  }
}

const categories = Object.values(byCat).sort(
  (a, b) =>
    b.notRegenerated - a.notRegenerated ||
    b.total - a.total ||
    a.category.localeCompare(b.category),
);

const summary = {
  archiveTotal: storyFiles.length,
  deployedRegenerated: storyFiles.filter((file) => headJson.has(path.basename(file, ".html"))).length,
  regeneratedNotDeployed: storyFiles.filter((file) => {
    const slug = path.basename(file, ".html");
    return localJson.has(slug) && !headJson.has(slug);
  }).length,
  notRegenerated: storyFiles.filter((file) => !localJson.has(path.basename(file, ".html"))).length,
};

console.log(JSON.stringify({ summary, categories }, null, 2));
