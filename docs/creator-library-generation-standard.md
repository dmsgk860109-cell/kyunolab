# Creator Library Generation Standard

Status: Active

Standard version: Creator Library Generation Standard v2.0

Last confirmed: 2026-07-22

Applies to:

- `scripts/add-latest-archive-to-creator-library-2026-07-20.js`
- `scripts/add-one-latest-unconverted-archive-to-creator-library-2026-07-20.js`
- `scripts/creator-library-pipeline.js`
- `scripts/creator-library-store.js`
- `scripts/generate-site.js`
- `scripts/creator-library.js`
- `data/scripts.json`
- generated Creator Library HTML under `scripts/*-youtube-script.html`

Related generation file:

- `scripts/creator-library-pipeline.js`

Related storage file:

- `scripts/creator-library-store.js`

Related renderer file:

- `scripts/generate-site.js`

Related client copy script:

- `scripts/creator-library.js`

Permanent validation command:

```bash
node scripts/validate-creator-library-generation-standard.js
```

Any change to Creator Library generation, rendering, or copy behavior must update this document and the permanent validation script in the same commit.

## Purpose

Creator Library is a production workspace, not a reading page. Each Creator Pack must let a creator produce a long-form or short-form video from one page without searching for scattered instructions.

Archive is the reading space. Creator Library is the making space.

## Official Pipeline

The production pipeline is:

1. Archive Story
2. Story Brief
3. Long-form Narration
4. Scene
5. Narration Part
6. Creator Note
7. Visual Beats
8. Image Prompt
9. Beat Motion
10. Background Music
11. Voice Direction
12. Sound Effect
13. Short-form Narration
14. Short-form Scene Focus
15. Runtime Plan
16. `data/scripts.json` storage
17. `generate-site.js` HTML rendering
18. `creator-library.js` copy behavior

Each step must use the current Story Brief, current Scene, current Narration Part, or current Visual Beat. Do not skip to category, scene number, array index, or broad content type as the only basis for production content.

The active stored pipeline version is `single-path-v1`. All Creator Packs in `data/scripts.json` must use this version.

## Field Contracts

### Long-form Narration

- Must be a script that can be read directly to viewers.
- Must be based on the Story Brief and confirmed Archive material.
- Must not contain internal Kyunolab instructions.
- Must align with the declared long-form runtime in a reasonable way.
- Must not include Creator Note, Image Prompt, Motion, Sound, Music, Voice, or field labels.

### Creator Note

- Must explain what the creator should preserve in the current Narration Part.
- Must be based on the current Part's event, motif, source limit, or caution.
- Must not copy the Narration sentence as the note.
- Must not include Image, Motion, Music, Voice, or Sound instructions.

### Image Prompt

- Must be based on the current Narration Part and Story Brief.
- Must use structured visual inputs such as subject, action or state, setting, composition, lighting, atmosphere, cultural context, and exclusions.
- Must not combine unrelated events or unrelated source traditions.
- Must not include broken fragments or double negatives.

### Beat Motion

- Must animate the exact image described by the current Image Prompt.
- Must not invent new events, people, locations, or actions.
- Must not include Sound, Music, or Voice instructions.

### Background Music

- Must provide music direction or search terms that match the Scene Role and subject.
- Must not pick a specific paid service.
- Must remain separate from Sound Effect.

### Voice Direction

- Must describe pace, pause, emphasis, restraint, and tone.
- Must be usable for AI voice or human recording.
- Must not invent emotional settings or service-specific settings.
- Must not include Image or Sound directions.

### Sound Effect

- Must name environment or event sounds possible inside the current Scene.
- Must not import another topic's preset.
- Must not include music or narration instructions.

### Short-form Narration

- Must be an independent 30-60 second script.
- Must include a hook, essential event, and consequence or open question.
- Must not be a simple concatenation of Long-form sentences.
- Final short-form video duration must not be shorter than actual reading time.

### Short-form Scene Focus

- Must name the person, event, place, or visual emphasis shown in the current Short-form Scene.
- Must not include Motion, Music, Voice, or Sound instructions.

### Copy Behavior

- Each field copy button must copy only its own field.
- Full copy buttons must copy only one field type in page order.
- Copy output must not include field labels, button text, timing metadata, Scene numbers, Part numbers, or another production field.

## Renderer Contract

Renderer does not provide a legacy compatibility path.

The official renderer accepts only stored `single-path-v1` Creator Packs. It must read production fields from `data/scripts.json` and render them. It must not generate missing Long-form, Short-form, Image Prompt, Beat Motion, Background Music, Voice Direction, Sound Effect, Creator Note, or Scene Focus content during rendering.

If a required stored production field is missing, the renderer must fail with a structured Creator render error. It must not repair the Pack through category fallback, broad content type fallback, substring regex, previous production profile, or array order.

## Preset Selection

Preset selection priority is:

1. explicit subject profile or entity type in Story Brief
2. exact topic and knownNames matches
3. subjectSpecificVocabulary
4. contentType
5. category
6. neutral fallback

Strong presets require strong entity evidence.

Forbidden examples:

- selecting a digital preset because the word `story` contains `tor`
- selecting a dragon preset because a page is in Myths
- selecting a creature preset from only `temple`, `river`, or `cloud`
- selecting a generic dragon preset from only `serpent`
- treating all Myths as dragon content
- treating all Internet Folklore as Cicada content

Use word boundaries and exact context. Do not select a strong production profile from one substring.

## Allowed And Forbidden Repetition

Allowed repetition:

- Scene structure
- Scene Role
- Narration Part data structure
- Visual Beat data structure
- Short-form Scene structure
- copy button structure
- music field names
- Voice Direction format
- validation flow
- documented fallback stages

Forbidden repetition:

- identical Long-form Narration with only the subject name changed
- identical Creator Note content
- identical Image Prompt content
- mechanical Beat Motion substitution
- identical Music, Voice, or Sound sentences across every Scene
- generic padding phrases
- Archive editorial policy inserted into Narration
- reusing another topic's names, places, symbols, or effects
- broken fragment assembly
- finished production sentences selected only by category or Scene index

Structure repetition is an allowed template. Finished content repetition without subject evidence is a failure.

## Subject-specific Hardcoding

Do not add new subject-specific production functions or slug-specific branches that return finished content.

Forbidden examples:

- `osirisCreatorNoteForNarrationPart()`
- `demeterImagePromptForNarrationPart()`
- `prometheusShortsScript()`
- `if (story.slug === "...") return ["finished sentence"]`
- scene or part index arrays that return subject-specific finished content

General functions must work from Story Brief, Narration Part, Scene Role, Image Prompt, and production profile.

There are no legacy exception files or allowed subject-specific renderer branches. Do not add allowlists for finished production content.

## New Creator Pack Publishing Flow

1. Confirm the Archive source.
2. Confirm Story Brief.
3. Generate only one Creator Pack per Archive Story.
4. Validate Long-form Narration.
5. Validate Creator Notes.
6. Validate Image Prompts and Visual Beats.
7. Validate Beat Motion.
8. Validate Background Music, Voice Direction, and Sound Effect.
9. Validate Short-form Narration, Scene Focus, and runtime.
10. Validate copy controls.
11. Confirm target story data diff only.
12. Build the full site.
13. Run permanent regression validation.
14. Run migration validation when existing Packs are touched.
15. Run tag validation.
16. Run `git diff --check`.
17. Inspect generated HTML samples.
18. Commit.
19. Push.

Bulk Creator Pack generation is allowed only when explicitly requested.

## Codex Task Format

Creator Library work should declare:

- Target
- Allowed files
- Allowed functions
- Forbidden files
- Forbidden fields
- Test page
- Completion criteria
- Required diff checks
- Required validation commands

Avoid combining content generation changes, UI changes, copy behavior changes, and documentation changes in one task unless the user explicitly asks for it.

## Validation Commands

Run these before completing Creator Library work:

```bash
node --check scripts/add-latest-archive-to-creator-library-2026-07-20.js
node --check scripts/add-one-latest-unconverted-archive-to-creator-library-2026-07-20.js
node --check scripts/creator-library-pipeline.js
node --check scripts/creator-library-store.js
node --check scripts/generate-site.js
node --check scripts/creator-library.js
node --check scripts/validate-creator-library-generation-standard.js
node --check scripts/validate-creator-library-migration.js
node scripts/validate-creator-library-input.js
node scripts/validate-creator-library-scene-plan.js
node scripts/validate-creator-library-production.js
node scripts/validate-creator-library-shortform.js
node scripts/validate-creator-library-renderer.js
node scripts/validate-creator-library-single-path.js
node scripts/validate-creator-library-migration.js
node scripts/validate-creator-library-generation-standard.js
node scripts/validate-tags.js
node scripts/generate-site.js
git diff --check
git status --short
```

The permanent regression validation should run after the site is built so it checks generated HTML.

## Change Management

When changing a Creator Library contract:

1. Record the reason.
2. Identify affected fields.
3. Identify fixture pages.
4. Identify forbidden fields.
5. Decide whether existing data migration is required.
6. Update this document.
7. Update permanent validation.
8. Run targeted regression tests.
9. Confirm data field diff.
10. Build and validate.
11. Commit and push.

Do not change only the document without updating validation when the contract changes. Do not change only validation without updating the document when the contract changes.
