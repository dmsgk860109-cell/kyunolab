# Kyunolab Article Page Production Template

Use this template when producing a full Kyunolab article page.

This is a flexible production scaffold, not a length limit.

## Non-Negotiable Length Rule

Do not cut useful content just to fit this template.

If the topic is small, use the scaffold to make the article complete, clear, and useful.

If the topic is large, expand the scaffold. Add H2 or H3 sections, split long sections into smaller sections, and preserve useful context.

The template defines minimum structure, not maximum length.

## Expansion Rules

- Add sections when the subject naturally needs them.
- Split a large section instead of compressing it.
- Keep source-awareness visible when adding depth.
- If the article becomes too broad, recommend a series or separate related articles.
- Do not remove strong material only because it does not fit a preset section count.
- Do not pad weak material. Add useful explanation, context, variants, examples, or source-status clarity.
- Keep the article readable on mobile by using shorter paragraphs and clear headings.

## Required Page Blocks

Every article page should include these blocks unless there is a strong editorial reason:

- SEO metadata
- Article metadata
- Story Map
- Opening hook
- Main body sections
- Fact-status or source-status section
- FAQ
- Story & Source Note
- Article engagement area
- Related Articles
- Previous / Next
- Final QA

## Article Metadata

```yaml
title: [TITLE]
displayTitle: [PUBLIC ARTICLE TITLE]
seoTitle: [SEARCH-FOCUSED TITLE]
slug: [SLUG]
category: [CATEGORY]
categorySlug: [CATEGORY SLUG]
categoryGroup: [CATEGORY GROUP]
tag: [PRIMARY DISPLAY TAG]
primaryTag: [PRIMARY TAG]
tags:
  - [TAG 1]
  - [TAG 2]
  - [TAG 3]
  - [OPTIONAL TAG 4]
  - [OPTIONAL TAG 5]
seedKeyword: [MAIN SEARCHABLE TOPIC]
searchIntent: [meaning / origin / legend / true-story / identity / comparison / list / symbolism / archive-story]
articleFormat: [search-info / story-archive / comparison / list-collection]
cluster: [TOPIC CLUSTER]
relatedKeywords:
  - [RELATED KEYWORD 1]
  - [RELATED KEYWORD 2]
  - [RELATED KEYWORD 3]
topicScore: [0-100]
topicStatus: [priority / approved / hold / reject]
scoreBreakdown:
  searchDemand: [0-30]
  clickCuriosity: [0-25]
  siteFit: [0-20]
  expansionPotential: [0-15]
  differentiation: [0-10]
readTime: [READ TIME]
storyType: [STORY TYPE]
sourceStatus: [SOURCE STATUS]
excerpt: [SHORT EXCERPT]
summaryAnswer: [2 TO 3 SENTENCE DIRECT ANSWER FOR SEARCHERS]
publishedAt: [YYYY-MM-DD]
updatedAt: [YYYY-MM-DD]
relatedStoryIds:
  - [RELATED STORY SLUG 1]
  - [RELATED STORY SLUG 2]
  - [RELATED STORY SLUG 3]
contentDNA:
  targetQuery: [MAIN SEARCH QUERY]
  canonicalQuery: [DEDUPLICATED SEARCH INTENT]
  searchQuestion: [QUESTION THIS ARTICLE DIRECTLY ANSWERS]
  readerIntent: [WHAT THE READER WANTS TO UNDERSTAND]
  uniqueAngle: [WHAT MAKES THIS ARTICLE DIFFERENT FROM NEARBY ARTICLES]
  subjectClass: [object-haunting / digital-glitch / road-legend / strange-place / etc.]
  narrativeLens: [folklore-lens / technology-lens / symbolic-lens / public-space-lens / etc.]
  evidencePosture: [unverified-rumor / folklore-pattern / anecdotal-record / symbolic-reading / etc.]
  culturalFrame: [SPECIFIC ORDINARY-LIFE OR CULTURAL SETTING]
  sceneAnchor: [CONCRETE FIRST IMAGE, PLACE, OBJECT, OR SITUATION]
  subjectSpecificVocabulary:
    - [SPECIFIC TERM 1]
    - [SPECIFIC TERM 2]
    - [SPECIFIC TERM 3]
    - [SPECIFIC TERM 4]
    - [SPECIFIC TERM 5]
  requiredSpecificDetails:
    - [DETAIL THAT MUST APPEAR IN BODY 1]
    - [DETAIL THAT MUST APPEAR IN BODY 2]
    - [DETAIL THAT MUST APPEAR IN BODY 3]
    - [DETAIL THAT MUST APPEAR IN BODY 4]
    - [DETAIL THAT MUST APPEAR IN BODY 5]
  prohibitedGenericPhrases:
    - [PHRASE TO AVOID]
  sectionBlueprint:
    - title: [CUSTOM H2 FOR THIS ARTICLE]
      nav: [SHORT NAV LABEL]
    - title: [CUSTOM H2 FOR THIS ARTICLE]
      nav: [SHORT NAV LABEL]
```

Editorial scoring fields are internal production fields. They may live in draft notes, admin metadata, or article data, but they should not be printed as visible reader-facing content.

`contentDNA` is internal production metadata. It is used to keep articles unique, avoid duplicate search intent, vary the H2 structure, and force topic-specific vocabulary into the body. It should not be printed as a reader-facing block.

## SEO Fields

```yaml
metaTitle: [SEO TITLE]
metaDescription: [155-170 CHARACTER DESCRIPTION]
canonical: https://kyunolab.com/stories/[SLUG]
ogTitle: [OG TITLE]
ogDescription: [OG DESCRIPTION]
structuredDataHeadline: [SEO TITLE]
structuredDataKeywords:
  - [TAG 1]
  - [RELATED KEYWORD 1]
```

SEO rules:

- Use the clean URL without `.html`.
- Include the main keyword naturally.
- Do not make the title fake, exaggerated, or misleading.
- Do not imply uncertain folklore is verified fact.
- Use `seoTitle` for metadata when it is stronger than the display title.
- Use `displayTitle` for the visible article title unless the SEO title is also the best reader-facing title.

## Topic Selection Gate

Before drafting, score the topic:

| Factor | Max | Check |
| --- | ---: | --- |
| Search demand | 30 | Does the topic match a real query, phrase, legend name, origin question, meaning question, or "is it real" intent? |
| Click curiosity | 25 | Would the title make a reader want the answer without fake proof or cheap shock? |
| Kyunolab fit | 20 | Does it belong in folklore, mystery, myth, strange place, internet folklore, or source-aware archive territory? |
| Expansion potential | 15 | Can it support related articles, tags, cluster pages, or future internal links? |
| Differentiation | 10 | Can Kyunolab add calm interpretation, source status, atmosphere, or structure beyond a generic summary? |

Status:

- `priority`: 85-100
- `approved`: 70-84
- `hold`: 60-69
- `reject`: 0-59

Do not draft a search-focused article below 70 unless the angle, keyword, or title has been reworked.

## Header Block

```markdown
# [TITLE]

[DECK / SUBTITLE]

[SUMMARY ANSWER: answer the main search question in 2 to 3 sentences before moving into deeper context.]

- Category: [CATEGORY]
- Tags: [TAG 1], [TAG 2], [TAG 3], [OPTIONAL TAG 4], [OPTIONAL TAG 5]
- Read time: [READ TIME]
- Story Type: [STORY TYPE]
- Source Status: [SOURCE STATUS]
- Updated: [MONTH DAY, YEAR]
```

## Story Map

The Story Map should match the actual article headings.

```markdown
1. [WHAT THE RECORD IS]
2. [FAMOUS / COMMON VERSION]
3. [ORIGIN OR BACKGROUND]
4. [VARIANTS OR CHANGES]
5. [WHY IT SPREAD OR WHY IT LASTS]
6. [SIMILAR STORIES OR INTERNAL LINKS]
7. [WHAT IS VERIFIED AND WHAT IS NOT]
8. [WHY IT STILL MATTERS]
9. FAQ
10. Story & Source Note
```

If the article needs more depth, add more Story Map items. Do not compress important material to keep the map short.

## Opening Hook

Start with a concrete image, situation, object, place, or question.

Requirements:

- Introduce the main keyword within the first 100 words.
- Put the summary answer near the beginning for search-info and comparison articles.
- Answer `contentDNA.searchQuestion` directly in the first 2 to 3 sentences.
- Include the `sceneAnchor` or another concrete detail from `contentDNA`.
- Make the reader understand the subject quickly.
- Keep the tone calm, mysterious, and source-aware.
- Avoid cheap horror language.
- Do not begin with stock phrasing like "The story begins with..." or "The central record is simple..."

```markdown
[OPENING PARAGRAPH 1]

[OPENING PARAGRAPH 2]

[OPENING PARAGRAPH 3]
```

## Flexible Body Structure

Choose the section set that fits the topic. Add, remove, split, or rename optional sections when the topic needs it.

Use `articleFormat` to choose the structure:

- `search-info`: direct answer first, then origin, meaning, variants, fact status, and FAQ.
- `story-archive`: atmosphere and story pattern first, then interpretation, variants, source status, and related records.
- `comparison`: define both topics, compare overlap and differences, clarify confusion, then summarize.
- `list-collection`: introduce the collection, give useful item-level explanations, then explain shared motifs.

The format guides the article. It does not cap the length.

The actual H2 structure should come from `contentDNA.sectionBlueprint` whenever possible. Do not reuse the same H2 set across many new articles.

### Urban Legend / Modern Legend

```markdown
## What Is [MAIN KEYWORD]?

## The Most Familiar Version

## Where the Story May Have Started

## How the Legend Changed Over Time

## Why People Kept Telling It

## Similar Legends and Related Stories

## What Is Verified and What Is Not

## Why the Story Still Works Today
```

### Internet Folklore

```markdown
## What Is [MAIN KEYWORD]?

## How It First Spread

## The Core Image or Story

## Why People Shared It

## How the Story Changed Online

## What Is Verified and What Is Not

## Why It Still Feels Unsettling
```

### Strange Place / Legendary Place / Lost World

```markdown
## What Is [MAIN KEYWORD]?

## Why People Call It Strange

## The Most Common Stories About It

## History and Local Context

## Rumors, Legends, and Reported Experiences

## What Is Verified and What Is Not

## Similar Places

## Why the Place Still Attracts Attention
```

### Folklore / Myth / Mythic Creature / Mythic Object

```markdown
## What Is [MAIN KEYWORD]?

## The Most Common Description

## Where the Story Comes From

## Regional Variations

## What [MAIN KEYWORD] Represents

## Similar Figures, Objects, or Stories

## Is It Folklore, Myth, or Something Else?

## Why the Story Still Matters
```

### Unexplained Mystery

```markdown
## What Is [MAIN KEYWORD]?

## The Basic Record

## What People Usually Claim

## What Can Be Checked

## What Remains Uncertain

## Similar Mystery Patterns

## Why the Question Still Holds Attention
```

## Optional Expansion Sections

Use these only when they help:

```markdown
## Timeline of the Story

## Versions by Region

## Common Motifs

## Why This Detail Matters

## How Later Retellings Changed It

## What Readers Often Misunderstand

## Source Problems and Evidence Limits

## Related Archive Paths
```

## Internal Linking Plan

Add internal links naturally inside the body and in the related section.

```markdown
- Primary category link: [CATEGORY PAGE]
- Related story 1: [RELATED STORY 1]
- Related story 2: [RELATED STORY 2]
- Related story 3: [RELATED STORY 3]
- Useful tag paths: [TAG 1], [TAG 2], [TAG 3]
```

Rules:

- Do not force unrelated links.
- Prefer contextually useful links over decorative links.
- Use existing articles when possible.
- New tags should create useful future archive paths.

## FAQ

Use 3 to 6 questions. Add more only if the topic truly needs them.

FAQ questions must be specific to the article subject. Do not repeat generic questions such as "Is this story true?", "Where did this story come from?", or "Why is this story scary?" across many articles.

```markdown
### Is [MAIN KEYWORD] real?

[Source-aware answer.]

### Where did [MAIN KEYWORD] come from?

[Careful origin answer.]

### Why is [MAIN KEYWORD] famous?

[Reader-intent answer.]

### What does [MAIN KEYWORD] mean?

[Interpretive answer.]

### Are there similar stories?

[Internal-link-friendly answer.]
```

## Story & Source Note

```markdown
[Explain whether the article is based on folklore, local legend, internet folklore, myth, public-domain tradition, documented records, or source-aware retelling.]

[Clarify that uncertain claims are not being presented as verified fact.]
```

## Article Engagement Placement

This block is structural and should come from the common article layout, not from hand-written article content.

Expected order:

```markdown
1. Article body
2. Story & Source Note
3. Interesting / Tags / Share
4. Related Articles
5. Previous / Next
```

## Related Articles

```markdown
- [RELATED ARTICLE 1] - [WHY THIS IS RELATED]
- [RELATED ARTICLE 2] - [WHY THIS IS RELATED]
- [RELATED ARTICLE 3] - [WHY THIS IS RELATED]
```

Rules:

- Use real existing story slugs.
- Do not point to planned articles that do not exist yet.
- Related links should connect by motif, category, place, figure, evidence type, or reader intent.
- Prefer same cluster first, then same primary tag, then overlapping tags, then same category.
- Use 3 related articles minimum when available; use 4 to 6 when the cluster is strong.

## Previous / Next

```markdown
- Previous: [PREVIOUS ARTICLE TITLE] - [PREVIOUS ARTICLE URL]
- Next: [NEXT ARTICLE TITLE] - [NEXT ARTICLE URL]
```

## Final QA Checklist

Content:

- [ ] Topic score is 70 or higher, or the topic was held/reworked.
- [ ] Score breakdown is filled in before drafting.
- [ ] Search intent is clear.
- [ ] Article format fits the topic.
- [ ] Display title and SEO title are separated when useful.
- [ ] Summary answer appears near the beginning.
- [ ] `contentDNA.searchQuestion` is answered near the beginning.
- [ ] `contentDNA.sectionBlueprint` gives this article a custom H2 structure.
- [ ] At least five `subjectSpecificVocabulary` items appear naturally in the body.
- [ ] No banned generic phrase appears in the body.
- [ ] The article follows the topic's natural length.
- [ ] Useful detail was not cut to satisfy a template.
- [ ] Weak sections were not padded with empty wording.
- [ ] The article opens with a concrete image or question.
- [ ] The main keyword appears naturally near the start.
- [ ] The source status is clear.
- [ ] Folklore, rumor, interpretation, and verified fact are separated.
- [ ] The article stays calm, mysterious, literary, and archival.
- [ ] The article avoids cheap horror, gore focus, fake proof, and conspiracy framing.

Structure:

- [ ] Story Map matches the actual headings.
- [ ] Sections are split when they become too large.
- [ ] Extra H2/H3 sections were added if the topic needed them.
- [ ] FAQ answers real reader questions.
- [ ] Story & Source Note is present.
- [ ] Related Articles use existing slugs only.
- [ ] Previous / Next links are clean.

Metadata:

- [ ] Slug is unique.
- [ ] Category slug exists in `data/categories.json`.
- [ ] Seed keyword is present.
- [ ] Search intent is present.
- [ ] Article format is present.
- [ ] Topic cluster is present.
- [ ] Primary tag is present.
- [ ] Tags are 3 to 5 specific internal paths.
- [ ] Tags do not duplicate the category.
- [ ] Related keywords are present.
- [ ] Related story IDs exist.
- [ ] Content DNA is present.
- [ ] `canonicalQuery` does not duplicate an existing story.
- [ ] Canonical URL is clean and has no `.html`.
- [ ] Meta title and description are accurate.

Publishing:

- [ ] Article record is added to `data/stories.json`.
- [ ] Detail page exists at `stories/[SLUG].html`.
- [ ] Run `node scripts/generate-site.js`.
- [ ] Run `node scripts/generate-tags.js`.
- [ ] Run `node scripts/validate-publish.js --slugs=[SLUG]`.
- [ ] Run `node scripts/validate-tags.js`.
