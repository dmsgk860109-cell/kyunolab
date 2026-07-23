# Kyunolab Creator Library Mode

Creator Library is the production mode for turning Kyunolab Archive stories into video-making pages.

Stories are for reading.

Creator Library pages are for making.

## Source Of Truth

The detailed operating standard lives in `CREATOR_LIBRARY_DESIGN_GUIDE.md`.

Use `CREATOR_LIBRARY_DESIGN_GUIDE.md` for:

- page structure
- Creator Toolkit rules
- Production Workflow rules
- Long-form and Short-form standards
- Scene Workspace structure
- Narration, Voice Direction, Scene Focus, Image Prompt, Background Music, Editing Guide, and Advanced Production rules
- copy behavior
- design and accessibility requirements
- prohibited content
- Gold Standard representative page validation
- new feature approval checks

## Mode Boundary

Creator Library is separate from the story archive.

Archive pages preserve story-reading and source-aware archive behavior.

Creator Library pages reorganize archive material into production-ready video assets.

Do not treat Creator Library as a simple story-to-script converter.

## Preservation Rules

Do not change existing Creator Library URLs, slug patterns, canonical paths, sitemap behavior, data model, copy tools, or page structure unless a separate migration task explicitly requires it.

Do not create separate long-form and short-form pages for the same archive story.

One Archive story maps to one Creator Library page.

## Implementation Note

Current Creator Library pages are generated through `scripts/generate-site.js` from the official per-article Creator Pack Store at `data/creator-packs/`.

When editing Creator Library output, update the generator and data source first. Avoid manually editing generated HTML unless the task explicitly calls for it.
