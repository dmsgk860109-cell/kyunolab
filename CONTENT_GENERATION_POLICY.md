# Kyunolab Unified Content Generation Policy

Kyunolab no longer uses separate Creative or Record generation modes.

Every new Archive article must use one unified standard:

> The question is not whether the story is historically true. The question is whether the story, claim, legend, rumor, sighting, myth, variation, or interpretation already existed outside Kyunolab before the article was generated.

## Eligibility

A subject may be included when an external trace exists. The trace can be broad or narrow.

Allowed external traces include:

- mythology, folklore, or literature references
- Wikipedia, Namuwiki, or specialist wikis
- community posts, forums, Reddit, old boards, or local pages
- personal blogs or preserved accounts
- YouTube videos, podcasts, comments, or descriptions
- journalism, books, museum pages, library pages, university pages, or public records

Historical truth, academic proof, and global fame are not required.

## Required Flow

All new articles follow this sequence:

1. Choose a topic candidate.
2. Search outside Kyunolab for an external trace.
3. Confirm the names, basic story, known variants, and circulation level.
4. Create a Story Brief.
5. Draft the article only from the Story Brief.
6. Separate Existing Story, Reported Variant, and Editorial Interpretation.
7. Run invention, repetition, and self-reference checks.
8. Publish only when the story is marked publishable.

If external existence cannot be checked, generation stops.

```text
External story verification could not be completed because web access is unavailable.
No article was generated.
```

If no external trace is found, generation stops.

```text
Article generation stopped:
No external trace of the proposed story was found.
Do not replace the missing story with an invented narrative.
```

## Story Brief

The Story Brief is internal production metadata. It must be created before the article body.

Required fields:

- `topic`
- `category`
- `contentType`
- `existenceStatus`
- `circulationLevel`
- `knownNames`
- `cultureOrContext`
- `coreStoryElements`
- `reportedVariants`
- `editorialInterpretationOptions`
- `uncertainDetails`
- `prohibitedInventions`
- `existenceEvidence`

`existenceStatus` must be `confirmed` before publishing.

## Content Layers

Article body content must stay inside three layers.

Existing Story:
The externally known basic story or claim.

Reported Variant:
A version, later retelling, regional account, online variation, or fringe claim that is actually reported outside Kyunolab.

Editorial Interpretation:
Kyunolab's symbolic, cultural, emotional, or structural reading of the existing story. It may suggest meaning, but it must not create new concrete events.

## Prohibited Inventions

The system must not invent and present as existing folklore:

- new characters
- new events
- new places
- new objects
- new technologies or powers
- new rules or rituals
- new dialogue, letters, documents, dates, witnesses, sightings, causes, or endings
- a merged story made from unrelated sources unless an external source already connects those elements

## Existing Content

Older Kyunolab original archive records are preserved. They are not deleted by this policy, and their URLs remain unchanged.

However, older Kyunolab content cannot be used as evidence that a new topic existed outside Kyunolab.

New article generation must not create new original archive stories.

## Post-production Publication Review (required before push)

Before pushing a new archive batch, run this practical review and fix issues found:

1. Mandatory sections
   - Quick Answer
   - FAQ
   - Story & Source Note
   - Related Articles
   - Final QA Checklist
2. Source boundary checks
   - The page must explicitly separate known facts / reported variants / interpretive reading.
   - Uncertain details must be marked as uncertainty, not presented as confirmed claims.
   - `researchSources` and `storyBrief.existenceEvidence` must be populated and non-placeholder.
3. Editorial safety
   - No invented names, events, places, objects, dialogue, dates, witnesses, causes, or endings outside source-trail scope.
   - No template-like repetitive cadence across the batch (re-phrased but still distinct by topic).
4. Metadata and SEO coherence
   - Title, H1, display title, slug, and canonical URL must align.
   - `seedKeyword` / `primaryKeyword` should reflect the real topic term and match topic intent.
5. Relatedness quality
   - At least 3 related story links are expected.
   - Related items should improve topical navigation, not duplicate the same cluster repeatedly.
6. Validation command
   - Run `node scripts/validate-publish.js --slugs=...`
   - Do not proceed with deployment if validation fails.

## Code Locations

- Unified policy constants and Story Brief validation: `scripts/content-policy.js`
- Article rendering from Story Brief sections: `scripts/apply-content-dna.js`
- Publish validation for unified-policy stories: `scripts/validate-publish.js`
- Article metadata and Story Brief storage: `data/stories.json`
