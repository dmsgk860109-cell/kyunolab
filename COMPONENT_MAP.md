# Kyunolab Component Map

This map defines reusable components for the static Kyunolab site. Component names describe structure even if the current implementation is plain HTML and CSS.

## SiteHeader

Purpose: Provide brand identity and primary navigation.

Appears on:

- all pages

Required data:

- site name
- short tagline
- logo / favicon mark
- navigation links

Desktop behavior:

- brand left, navigation right
- compact but readable sticky header

Mobile behavior:

- brand remains visible
- navigation may wrap, scroll horizontally, or move to a menu if needed

Ads nearby:

- no ads inside or directly adjacent to the header

## SiteFooter

Purpose: Provide site identity, policy links, RSS, and archive support links.

Appears on:

- all pages

Required data:

- site description
- About link
- Source Policy / Story & Source Notice link
- Privacy link
- Terms link when added
- RSS link

Mobile behavior:

- stacked links
- no dense multi-column footer on small screens

Ads nearby:

- one before-footer ad may appear above the footer, clearly separated

## HeroSection

Purpose: Establish archive identity and lead toward the featured story.

Appears on:

- home

Required data:

- label
- headline
- supporting copy
- featured story

Mobile behavior:

- should not take the entire first screen
- featured story should appear early

Ads nearby:

- ad may appear after the full hero / featured block, not before

## FeaturedArticleCard

Purpose: Highlight one strong entry.

Appears on:

- home
- category pages
- recommended sections

Required data:

- title
- URL
- excerpt
- category
- read time
- tag

Mobile behavior:

- full-width card
- title should wrap cleanly

Ads nearby:

- no ad inside the card

## ArticleCard

Purpose: Display story previews in lists and grids.

Appears on:

- home latest
- category pages
- tag pages
- related sections

Required data:

- title
- URL
- excerpt
- category
- tag
- read time

Mobile behavior:

- stacked single-column cards or rows

Ads nearby:

- ads may appear between groups, not inside cards

## CategoryCard

Purpose: Send readers to category hubs.

Appears on:

- home
- category index areas
- article close sections

Required data:

- category name
- description
- URL

Mobile behavior:

- one column or compact two-column only if readable

Ads nearby:

- ads may appear before or after the category grid, not inside it

## TagPill

Purpose: Link narrow themes and clusters.

Appears on:

- article metadata
- category hubs
- tag pages

Required data:

- tag name
- tag URL

Mobile behavior:

- wrap cleanly without dominating the screen

Ads nearby:

- no ad directly attached to tag groups

## StoryMap

Purpose: Let readers scan article structure.

Appears on:

- article pages

Required data:

- ordered list of section anchors

Desktop behavior:

- may use two columns when there are many items

Mobile behavior:

- one column
- may become collapsible later

Ads nearby:

- `ad-article-after-story-map` may appear after it

## ArticleRail

Purpose: Keep article navigation and recommended paths visible while the reader is inside a story.

Appears on:

- article pages

Required data:

- current article section anchors
- current category URL
- archive index URL
- source notice URL
- read-next article
- 3 related records
- broader archive shelf links

Desktop behavior:

- left rail shows in-article navigation and archive paths
- right rail shows read-next, related records, and broader shelf links
- rails may be sticky
- rails must not overlap the article body

Mobile behavior:

- rails stack below the main article content
- no sticky behavior on mobile
- links remain tappable and readable

Ad relationship:

- do not place ads inside rail cards
- rail cards are navigation, not ad inventory

## ReadingBridge

Purpose: Provide an early, in-flow set of related paths before the reader reaches the bottom of the article.

Appears on:

- article pages, usually after StoryMap and before the main body

Required data:

- 2 related records
- 1 category or archive shelf link

Mobile behavior:

- single column
- should appear before long body content

Ad relationship:

- no ad inside the bridge
- `ad-article-after-story-map` may appear near it only if clearly separated

## MetadataBlock

Purpose: Show category, tag, read time, story type, source status, and date.

Appears on:

- article pages

Required data:

- category
- tag
- read time
- story type
- source status
- updated date

Mobile behavior:

- wraps into one or two columns without clipping

Ads nearby:

- no ad between title/deck and metadata

## RelatedArticles

Purpose: Continue reader discovery.

Appears on:

- article pages
- category hubs

Required data:

- 3 related articles
- category/tag labels
- URLs

Mobile behavior:

- single-column cards

Ads nearby:

- `ad-article-before-related` may appear above, clearly separated

## PreviousNextNav

Purpose: Provide sequential browsing.

Appears on:

- article pages

Required data:

- previous article title and URL
- next article title and URL

Mobile behavior:

- stacked blocks

Ads nearby:

- no ad directly between previous and next links

## FAQBlock

Purpose: Answer common search questions with source-safe language.

Appears on:

- article pages

Required data:

- 3 to 5 questions
- concise answers

Mobile behavior:

- stacked question blocks

Ads nearby:

- ad may appear before or after FAQ, not inside a question/answer

## SourceNote

Purpose: Clarify folklore, retelling, source status, and uncertainty.

Appears on:

- article pages

Required data:

- source status
- fact-safety note
- retelling / folklore / documented-source explanation

Mobile behavior:

- readable text block

Ads nearby:

- avoid ads immediately before the note if it would reduce trust

## AdSlot

Purpose: Reserve and label possible ad placements without adding live ad code.

Appears on:

- home
- category pages
- tag pages
- article pages

Required data:

- slot name
- accessible label

Desktop behavior:

- may be in-content or one optional sidebar slot

Mobile behavior:

- in-content only
- no sticky sidebar

Requirements:

- must accept a slot name
- must show a placeholder only in development if no ad code exists
- must reserve layout space
- must include an accessible label
- must collapse cleanly if empty

## PopularArticles

Purpose: Surface high-interest stories.

Appears on:

- home
- Mystery Board
- category pages

Required data:

- ranked article list or curated popular articles

Mobile behavior:

- list format works better than dense grids

Ads nearby:

- ads may appear after the section

## LatestArticles

Purpose: Surface recent publishing.

Appears on:

- home
- future latest page
- category pages

Required data:

- article list ordered by updated or published date

Mobile behavior:

- stacked rows

Ads nearby:

- ad may appear mid-feed after several items

## MysteryBoardPreview

Purpose: Create a discovery path based on ranked, strange, or curated entries.

Appears on:

- home
- Mystery Board page

Required data:

- ranked list
- reader path links

Mobile behavior:

- ranked list first, side panel below

Ads nearby:

- ad may appear after the full preview, not inside the ranking list

## SearchInput

Purpose: Let readers search the archive when implemented.

Appears on:

- future search page
- optional header or home search section

Required data:

- query input
- results target

Mobile behavior:

- full-width input

Ads nearby:

- no ads directly attached to the search box

## Category Architecture: Two 6-Category Groups

Kyunolab uses two visible category groups. **Modern Strange Records** contains Urban Legends, Internet Folklore, Strange Places, Unexplained Mysteries, Classic Folklore, and Modern Legends. **Mythic & Imagined Realms** contains Myths, Mythic Creatures, Lost Worlds, Strange Nature, Legendary Places, and Mythic Objects.

Use the distinction carefully: Vanishing Hitchhiker belongs in Urban Legends; Backrooms belongs in Internet Folklore; modern sighting cycles such as Loch Ness-style records belong in Modern Legends; dragons belong in Mythic Creatures; vanished cities, islands, and impossible geographies usually belong in Lost Worlds; unusual forests or natural phenomena belong in Strange Nature unless the place itself is the central legend, where Legendary Places may fit better.

Keep legacy category URLs live. Legend Origins remains a supplemental archive shelf for existing material, but it is not part of the visible 6:6 category system.
