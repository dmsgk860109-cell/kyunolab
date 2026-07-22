# Repository Instructions

## Creator Library

Before changing Creator Library generation, rendering, copy behavior, or Creator Pack data, read [docs/creator-library-generation-standard.md](docs/creator-library-generation-standard.md).

Required rules:

- Work in small, named stages with a clear target.
- Do not add new slug-specific production functions or finished-content branches.
- Do not let renderer fallback override valid stored values.
- When editing one field, do not regenerate unrelated fields.
- Do not bulk-regenerate test pages unless explicitly requested.
- Run `node scripts/validate-creator-library-generation-standard.js` after Creator Library changes.
- If a Creator Library contract changes, update the standard document and validation script in the same commit.
- Do not hide validation failures by adding new allowlist entries without an explicit task.
- The active Creator Library data version is `single-path-v1`; legacy Creator Pack rendering is no longer supported.
- Use `scripts/creator-library-pipeline.js` for generation, `scripts/creator-library-store.js` for storage, and `scripts/generate-site.js` only for rendering stored Creator Pack fields.
- Run `node scripts/validate-creator-library-migration.js` after bulk Creator Pack migration or existing Pack regeneration.
