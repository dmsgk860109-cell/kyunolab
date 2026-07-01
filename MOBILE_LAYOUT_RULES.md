# Kyunolab Mobile Layout Rules

Kyunolab should be mobile-first for reading comfort, discovery, and non-intrusive monetization.

## Mobile Priorities

1. Reading comfort
2. Fast article discovery
3. Clean navigation
4. Non-intrusive ads
5. Strong related article flow

## Breakpoints

Mobile:

- up to 560px

Tablet:

- 561px to 850px

Desktop:

- 851px and above

Current CSS already uses `560px` and `850px` breakpoints. Future changes should preserve that logic unless the design system changes.

## Mobile Header

Rules:

- Keep compact height.
- Keep logo/icon visible.
- Site title must not clip.
- Navigation should not wrap awkwardly.
- Use horizontal scroll or a hamburger menu if navigation grows.
- Avoid hover-dependent navigation.

Current status:

- Header stacks on tablet/mobile.
- Navigation wraps.
- If more links are added, convert to horizontal scroll or menu.

## Mobile Home

Rules:

- Hero should not take the entire first screen.
- Featured article should appear early.
- Latest and Popular should be easy to scan.
- Category blocks should use one column or compact two-column only if readable.
- Mystery Board preview should stack ranking first, reader paths second.
- Recommended reading should use simple cards or rows.

Current status:

- Hero and featured story stack.
- Category blocks collapse to one column at small widths.
- Popular and Recommended sections need clearer separation in future updates.

## Mobile Article

Rules:

- Article title should fit naturally.
- Metadata should wrap cleanly.
- Story Map may be collapsible later.
- Body text should have comfortable line height.
- Ads should appear only between content sections.
- Related articles should be single-column cards.
- Previous / Next should be clearly separated.
- No text should overlap or clip.

Current status:

- Article metadata collapses to one column on small screens.
- Story Map becomes one column.
- Related and previous / next cards become one column.

Future improvement:

- Consider collapsible Story Map for long articles.
- Add category/tag links without crowding the metadata block.

## Mobile Category / Tag Pages

Rules:

- Category intro should be short.
- Featured article should appear before long lists.
- Essential reads should be easy to scan.
- Filters and tags should not dominate the screen.
- Article cards should stack cleanly.
- Ads should not interrupt the first few items too aggressively.
- Related categories should appear after core content.

Current status:

- Category pages are basic lists.
- Upgrade to hub structure in Phase 2.

## Mobile Ads

Rules:

- Do not use sidebar ads.
- Use in-content ads only.
- Do not place ads before meaningful content.
- Do not place ads too close to navigation, article cards, or previous / next links.
- Add spacing above and below ads.
- Reserve space to prevent layout shift.
- Allow slots to collapse cleanly if empty.

Recommended mobile placements:

- after home hero / featured block
- mid latest feed after several items
- after category intro and featured / essential reads
- after article Story Map
- between major H2 sections
- before related articles only if the article is long enough

## Mobile Typography

Rules:

- Avoid huge hero typography on mobile.
- Keep article title large but not overwhelming.
- Use comfortable body text and line height.
- Avoid negative letter spacing.
- Break long words and titles cleanly.

Current status:

- Mobile hero title is reduced at 560px.
- Article title is reduced at 560px.

## Mobile Cards and Grids

Rules:

- Article cards should stack.
- Related articles should be single-column.
- Category cards should become one column on small screens.
- Cards should not contain other cards.
- Repeated items should use stable spacing and borders.

## Mobile Navigation Flow

Every mobile article should make it easy to continue:

1. Article body
2. FAQ
3. Story & Source Note
4. Related Articles
5. Previous / Next
6. Category or tag path

Avoid ending a page with only a footer.

## Mobile QA Checklist

- Header does not overlap or clip.
- Navigation remains usable.
- Hero does not consume the whole first screen.
- Article titles wrap cleanly.
- Metadata does not break layout.
- Story Map is readable.
- Body text has comfortable line height.
- Ads are not intrusive.
- Related articles are visually separated.
- Previous / Next links are stacked and clear.
- No layout depends on hover.
