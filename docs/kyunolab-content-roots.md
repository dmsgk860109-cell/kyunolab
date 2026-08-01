# Kyunolab Content Roots

This repository is the canonical source for Kyunolab production:

`C:\Users\lucid\Documents\Codex\2026-07-01\new-chat\work\kyunolab-deploy-main`

New Codex chats may start in a different workspace directory. Those temporary
workspace folders are not canonical site roots. Before editing, regenerating,
committing, pushing, or deploying Kyunolab content, verify that the active repo
is the canonical production repo above.

## Fixed Root Rule

All Kyunolab source files must be created inside the canonical production repo.
Do not create archive, library, tool, script, or deployment source files in
date-based Codex workspace folders such as:

- `C:\Users\lucid\Documents\Codex\2026-08-01\...`
- `C:\Users\lucid\Documents\Codex\2026-08-02\...`
- any new-chat default workspace that is not `kyunolab-deploy-main`

Those folders may be used only for temporary scratch files, throwaway analysis,
or non-source helper output. They must not become a second Kyunolab root.

If a future chat starts outside the canonical repo, first switch to:

```powershell
cd "C:\Users\lucid\Documents\Codex\2026-07-01\new-chat\work\kyunolab-deploy-main"
```

Then run:

```powershell
npm.cmd run audit:content-roots
```

If PowerShell blocks `npm`, run:

```powershell
node scripts/audit-content-roots.js
```

Do not proceed with content edits if the audit reports the wrong root, wrong
remote, mismatched archive counts, or unknown dirty files.

## Site Axes

Kyunolab should be managed as one site repo with three internal content axes:

- Archive: stories, legends, folklore, myths, strange places, mysteries.
- Library: creator/library reference material and supporting content.
- Tools: future interactive or utility pages. The source paths are reserved,
  but tools are not yet implemented.

The site should not split these axes into separate production repos unless that
is a deliberate migration. Internal links, search, sitemap generation, category
pages, and deployment all assume one production repo.

## Source Placement Rule

New files should be placed under the fixed repo tree:

- Archive source packages: `data/stories/<slug>.json`
- Archive manuscript/support files: `data/stories/<slug>.md`
- Archive public source HTML: `stories/<slug>.html`
- Archive deploy HTML: `dist/stories/<slug>.html`
- Library source data: `data/creator-library...` or another documented
  library root inside this repo
- Future tool data: `data/tools/`
- Future tool pages: `tools/`
- Scripts: `scripts/`
- Project rules and operational notes: `docs/`

Do not create alternate roots for the same content axis. For example, do not
create a second `stories/`, `data/stories/`, `library/`, or `tools/` tree under
a date-based workspace.

## Archive Roots

The archive currently uses a merged data model:

- `data/stories.json`
  - Legacy/main archive list.
  - This is the full archive inventory.
  - Current confirmed count: 1,224 records.
  - Keep this file until a deliberate later migration removes the legacy list.

- `data/stories/index.json`
  - Index of story package files.
  - Each entry points to a file under `data/stories/`.
  - Current confirmed count: 1,224 entries.

- `data/stories/<slug>.json`
  - Canonical per-story source package.
  - These records must match the legacy `id`, `slug`, `category`,
    `pathname`, and `canonicalUrl`.
  - Current confirmed count: 1,224 files.
  - During site generation, the package replaces the matching record from
    `data/stories.json`, so all archive source work should happen here.

- `data/stories/<slug>.md`
  - Regeneration source/draft marker used by the current archive workflow.
  - Do not treat filesystem MD count as deployed count unless the files are
    committed and pushed.

- `stories/<slug>.html`
  - Public archive HTML source in the repo.

- `dist/stories/<slug>.html`
  - Cloudflare Pages distribution copy.

Important: after the source-tree consolidation, every archive record has a
matching `data/stories/<slug>.json` package. `data/stories.json` remains as the
full archive inventory and compatibility list, but day-to-day story edits should
use the per-story package files.

## Library Roots

The library is managed inside the same production repo. Current known roots:

- `data/creator-library-search-index.json`
- `data/library-board.json`
- `scripts/validate-creator-library-generation-standard.js`
- `scripts/validate-creator-library-single-path.js`
- `scripts/validate-creator-library-migration.js`

Before large library work, audit the current library generation scripts and
confirm the exact public output paths.

## Reserved Tool Roots

Tools are not implemented yet. Reserve these paths for future tool work:

- `data/tools/`
  - Tool metadata, tool registry files, and tool content packages.

- `tools/`
  - Public source pages for tools.

- `dist/tools/`
  - Generated deployment output, if the future build process needs it.

Do not place archive or library source files under the tool roots.

## New Chat Checklist

Run this before Kyunolab content work:

```powershell
cd "C:\Users\lucid\Documents\Codex\2026-07-01\new-chat\work\kyunolab-deploy-main"
npm.cmd run audit:content-roots
git status --short
```

Confirm:

- The repo root is `kyunolab-deploy-main`.
- The command working directory is inside the canonical repo.
- The local path matches the canonical production path.
- The `origin` remote points to `dmsgk860109-cell/kyunolab.git`.
- `data/stories.json`, `stories/`, and `dist/stories/` describe the same full
  archive population.
- `data/stories/index.json` and `data/stories/*.json` describe the full
  per-story package set.
- Dirty files are understood before any commit.
- Existing unrelated dirty files are not included in content commits.

## Deployment Rule

Production deploys are triggered by pushing to `main`.

Do not commit, push, or deploy unless the user explicitly asks for it.
