# Kyunolab Ad Placement Plan

This document defines ad slot placeholders and layout rules before live ads are added.

Do not add real ad network scripts until publisher IDs and ad unit IDs are provided.

## AdSense-Friendly Direction

Ads must:

- not block navigation
- not be confused with content, buttons, menus, or download links
- be labeled clearly as "Advertisement" or "Sponsored links"
- avoid pop-ups, pop-unders, forced redirects, and intrusive behavior
- preserve a calm, readable archive experience

## Ad Density

Short article:

- 1 to 2 ads maximum

Standard article:

- 2 to 3 ads maximum

Long article:

- 3 to 4 ads maximum

Home/category/tag pages:

- 2 to 3 ads maximum depending on page length

Use fewer ads when content is short.

## Home Ad Slots

- `ad-home-after-hero`
- `ad-home-mid-feed`
- `ad-home-before-footer`

Placement rules:

- Do not place an ad before the reader sees the hero and featured story.
- Place ads between major sections, not inside article cards.
- Keep ad styling visually separate from story cards.

## Category Page Ad Slots

- `ad-category-after-intro`
- `ad-category-mid-list`
- `ad-category-before-footer`

Placement rules:

- Do not interrupt the category intro.
- Place the first ad after featured / essential reads if possible.
- Keep category hubs useful before monetization.

## Article Page Ad Slots

- `ad-article-after-story-map`
- `ad-article-mid-1`
- `ad-article-mid-2` for long articles only
- `ad-article-before-faq` or `ad-article-after-faq`
- `ad-article-before-related`
- optional `ad-article-sidebar-desktop` if desktop layout supports it

Placement rules:

- Do not place an ad before the reader reaches meaningful article content.
- Avoid ads directly above or below navigation controls.
- Long articles may use more than one in-body ad if spacing is comfortable.
- Short articles should use only one in-body slot and one optional lower slot.

## Tag Page Ad Slots

- `ad-tag-after-intro`
- `ad-tag-mid-list`

## Mobile Rules

- Do not use sidebar ads.
- Use only in-content ads.
- Avoid placing an ad before meaningful content.
- Keep enough spacing above and below ads.
- Do not place ads too close to navigation buttons, article cards, or previous / next links.
- Keep ad blocks collapsible if ads are not loaded.

## Desktop Rules

- Article pages may use one right-side static or sticky ad area only if it does not distract from reading.
- Avoid overcrowding the first viewport.
- Sidebar ads must not compete with the article title, metadata, or Story Map.

## AdSlot Component Requirements

The `AdSlot` component should:

- accept a slot name
- show a placeholder only in development if no ad code exists
- reserve layout space to prevent layout shift
- include an accessible label
- collapse cleanly if ads are not loaded
- use neutral styling
- never look like a related article card

Suggested placeholder markup:

```html
<aside class="ad-slot" data-ad-slot="[SLOT NAME]" aria-label="Advertisement">
  <span>Advertisement</span>
</aside>
```

Suggested placeholder behavior:

- Visible in development or before ad integration.
- Hidden or collapsed when production ads are unavailable.
- Minimum height reserved when active.

## Current Site Assessment

Current status:

- No live ad code is present.
- No ad slot placeholders are currently placed in HTML.
- A reusable `.ad-slot` CSS placeholder class is available for future placements.
- Layout is calm and readable.

Recommended phase:

- Phase 1: add CSS and optional placeholder component pattern.
- Phase 2: place slots after category hubs and article structure are strengthened.
- Phase 3: integrate real ad units after IDs are available.

## Ad QA

- Ads are labeled.
- Ads do not block reading or navigation.
- Ads do not resemble content cards.
- Ads have reserved space.
- Ads collapse cleanly if empty.
- Mobile ads are in-content only.
- No first-screen overcrowding.
