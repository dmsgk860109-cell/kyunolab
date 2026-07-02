# Kyunolab Site Structure

Kyunolab should operate as a connected archive, not a loose list of articles. Each page should guide readers toward the next relevant story, category, tag, or archive path.

## Core Architecture

Primary reader path:

Home -> Category -> Article -> Related Article -> Tag -> Another Article

Secondary reader paths:

- Home -> Mystery Board -> Article
- Home -> Popular -> Article -> Related Articles
- Article -> Category -> Essential Reads
- Article -> Tag -> Thematic Cluster
- Search -> Category / Tag / Article

No important page should be a dead end.

## Pagination Rules

Kyunolab uses numbered pagination for archive-style list pages instead of infinite scroll.

Rules:

- List pages should show up to 12 records per page.
- The first page keeps the stable base URL, such as `/newest.html`, `/archive.html`, or `/categories/urban-legends.html`.
- Additional pages use a predictable static suffix: `/newest-2.html`, `/newest-3.html`, `/archive-2.html`, and so on.
- Category pages should follow the same pattern when a category grows beyond 12 records, such as `/categories/urban-legends-2.html`.
- Every paginated list page should include a visible pagination block near the bottom of the main list.
- Paginated pages should use their own canonical URL.
- Paginated pages should include `rel="prev"` and `rel="next"` links where applicable.
- The sitemap should include every public paginated URL.
- Do not use infinite scroll as the primary archive navigation because it weakens reader orientation and is less reliable for static SEO discovery.

## Required Pages

### Home

Purpose: Introduce the archive identity and send readers toward strong discovery paths.

Structure:

1. Header / navigation
2. Hero identity section
3. Featured story
4. Latest articles
5. Popular articles
6. Category entry blocks
7. Mystery Board preview
8. Recommended / Editor's Picks section
9. Optional newsletter or follow section if added later
10. Footer with source, privacy, terms, RSS, and policy links

Current status:

- Present: header, hero, featured story, latest, mystery board, category blocks, footer.
- Needs improvement: a clearer Recommended / Editor's Picks section and a distinct Popular section separate from Mystery Board rankings.

### Category Pages

Purpose: Act as topic hubs, not just filtered article lists.

Recommended categories:

- Urban Legends
- Folklore
- Myths
- Strange Places
- Mysteries
- Internet Folklore

Current additional categories may remain if useful:

- Mythic Creatures
- Legend Origins
- Classic Folklore
- Unexplained Mysteries

Category page structure:

1. Category title
2. Short category description
3. Featured article
4. Essential reads
5. Latest in this category
6. Popular in this category
7. Related categories
8. Category-specific tags
9. Carefully placed ad slots between major sections

Current status:

- Present: category title, description, basic article list.
- Needs improvement: featured article, essential reads, popular category items, related categories, tags, and ad slot placeholders.

### Tag Pages

Purpose: Connect articles by narrower themes such as "Roadside Folklore," "Digital Folklore," "Lost Places," or "Village Mystery."

Structure:

1. Tag title
2. Short tag description
3. Articles using the tag
4. Related tags
5. Related categories
6. Optional cluster explanation
7. Ad slots after intro and mid-list

Current status:

- Not yet implemented as separate pages.
- Phase 2 or Phase 3 improvement.

### Article Pages

Purpose: Provide the main reading experience and guide readers toward related archive paths.

Structure:

1. Metadata
2. Story Map
3. Article body
4. In-article related links
5. Similar legends / related stories
6. FAQ
7. Story & Source Note
8. Related Articles
9. Previous / Next article
10. Category and tag links

Current status:

- Present on the main article format: metadata, Story Map, body, inline related links, FAQ, source note, related articles, previous / next navigation.
- Needs improvement: category/tag link consistency, planned ad slots, and repeated use across all articles.

### Mystery Board

Purpose: Provide a ranked or curated discovery surface for readers who want quick story paths.

Structure:

1. Page title and archive framing
2. Ranked story list
3. Recent additions
4. Reader paths by mood or topic
5. Popular archive entries
6. Link back to categories

Current status:

- Present as a page.
- Needs stronger connection to categories and recommended paths.

### Popular

Purpose: Surface high-interest articles and evergreen archive entries.

Implementation options:

- Home section first
- Dedicated `/popular.html` later if there are enough articles

Current status:

- Partially represented by Mystery Board rankings.
- Needs clearer naming and separation.

### Latest

Purpose: Help returning readers see new archive entries.

Implementation options:

- Home section first
- Dedicated `/latest.html` later if daily publishing grows

Current status:

- Present on home as `#latest`.

### Recommended / Editor's Picks

Purpose: Create intentional reader journeys, not just chronological browsing.

Examples:

- Start with urban legends
- Read internet folklore
- Explore strange places
- Folklore for quiet unease

Current status:

- Not clearly separated.
- Add as Phase 2 home improvement.

### About

Purpose: Explain Kyunolab's identity and editorial approach.

Current status:

- Present.

### Source Policy

Purpose: Explain how folklore, public-domain material, retellings, speculation, and unverified stories are handled.

Implementation:

- Existing Story & Source Notice page may serve this role.
- Consider renaming or linking as "Source Policy" in footer.

Current status:

- Present as `fiction-disclaimer.html`, but the public label should emphasize Story & Source Notice or Source Policy.

### Privacy Policy

Current status:

- Present.

### Terms Page

Purpose: Provide standard site terms, especially before ads, analytics, newsletter, or submissions.

Current status:

- Not yet implemented.
- Phase 2 recommendation.

### Search

Purpose: Let readers search articles once the archive is larger.

Implementation options:

- Planned static search using generated JSON
- Client-side search over `data/stories.json`
- Dedicated `/search.html`

Current status:

- Not yet implemented.
- Phase 3 recommendation.

## Phase Plan

### Phase 1

- Planning docs
- Ad slot plan
- Component map
- Mobile rules
- Add basic ad slot placeholders only if low risk

### Phase 2

- Upgrade category pages into hubs
- Add recommended / editor's picks
- Add clearer popular section
- Strengthen article category/tag links
- Add Terms and Source Policy page labels

### Phase 3

- Add tag pages
- Add search page
- Add mobile polish
- Integrate real ads only after publisher IDs and ad unit IDs exist

## Final Architecture QA

- Home sends readers to latest, popular, recommended, and categories.
- Category pages behave like hubs.
- Article pages do not end abruptly.
- Related articles are visually separated.
- Tag and category links support natural exploration.
- Footer contains source, privacy, terms, RSS, and about links.
- No page presents folklore as verified fact without evidence.

## Category Architecture: Two 6-Category Groups

Kyunolab uses two visible category groups. **Modern Strange Records** contains Urban Legends, Internet Folklore, Strange Places, Unexplained Mysteries, Classic Folklore, and Modern Legends. **Mythic & Imagined Realms** contains Myths, Mythic Creatures, Lost Worlds, Strange Nature, Legendary Places, and Mythic Objects.

Use the distinction carefully: Vanishing Hitchhiker belongs in Urban Legends; Backrooms belongs in Internet Folklore; modern sighting cycles such as Loch Ness-style records belong in Modern Legends; dragons belong in Mythic Creatures; vanished cities, islands, and impossible geographies usually belong in Lost Worlds; unusual forests or natural phenomena belong in Strange Nature unless the place itself is the central legend, where Legendary Places may fit better.

Keep legacy category URLs live. Legend Origins remains a supplemental archive shelf for existing material, but it is not part of the visible 6:6 category system.
