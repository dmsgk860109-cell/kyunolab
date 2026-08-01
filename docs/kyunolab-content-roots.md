# Kyunolab Content Roots

This repository is the canonical source for Kyunolab production:

`C:\Users\lucid\Documents\Codex\2026-07-01\new-chat\work\kyunolab-deploy-main`

New Codex chats may start in a different workspace directory. Those temporary
workspace folders are not canonical site roots. Before editing, regenerating,
committing, pushing, or deploying Kyunolab content, verify that the active repo
is the canonical production repo above.

## Site Axes

Kyunolab should be managed as one site repo with three internal content axes:

- Archive: stories, legends, folklore, myths, strange places, mysteries.
- Library: creator/library reference material and supporting content.
- Tools: future interactive or utility pages. The source paths are reserved,
  but tools are not yet implemented.

The site should not split these axes into separate production repos unless that
is a deliberate migration. Internal links, search, sitemap generation, category
pages, and deployment all assume one production repo.

## Archive Roots

The archive currently uses a merged data model:

- `data/stories.json`
  - Legacy/main archive list.
  - This is the full archive inventory.
  - Current confirmed count: 1,224 records.

- `data/stories/index.json`
  - Index of independent story packages.
  - Each entry points to a file under `data/stories/`.

- `data/stories/<slug>.json`
  - Independent story package overlay.
  - These records must match the legacy `id`, `slug`, `category`,
    `pathname`, and `canonicalUrl`.
  - During site generation, the independent package replaces the matching
    record from `data/stories.json`.

- `data/stories/<slug>.md`
  - Regeneration source/draft marker used by the current archive workflow.
  - Do not treat filesystem MD count as deployed count unless the files are
    committed and pushed.

- `stories/<slug>.html`
  - Public archive HTML source in the repo.

- `dist/stories/<slug>.html`
  - Cloudflare Pages distribution copy.

Important: `data/stories/*.json` is not the full archive. It is the independent
overlay subset. The full archive count comes from `data/stories.json`.

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
node scripts/audit-content-roots.js
git status --short
```

Confirm:

- The repo root is `kyunolab-deploy-main`.
- `data/stories.json`, `stories/`, and `dist/stories/` describe the same full
  archive population.
- `data/stories/index.json` and `data/stories/*.json` describe the independent
  overlay subset only.
- Dirty files are understood before any commit.
- Existing unrelated dirty files are not included in content commits.

## Deployment Rule

Production deploys are triggered by pushing to `main`.

Do not commit, push, or deploy unless the user explicitly asks for it.

