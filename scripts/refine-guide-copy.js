const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const guidesPath = path.join(root, 'data', 'guides.json');
const guides = JSON.parse(fs.readFileSync(guidesPath, 'utf8'));

const refinements = {
  'how-to-use-tags-without-creating-thin-archive-pages': {
    deck: 'A practical guide to using tags as narrow reading paths while keeping search index pages reserved for tags with enough real archive depth.',
    bestFor: 'Readers who want tags to reveal patterns without turning every small keyword into a thin page',
    sections: [
      ['What this guide is for', [
        'Tags should work like quiet shelf labels, not like a machine that creates a new public page for every phrase. This guide explains how a tag can help a reader move from one record to another without forcing the site to publish thin archive pages.',
        'The useful distinction is simple: a tag can exist as an internal connection before it deserves an indexable page. That keeps navigation useful while protecting the archive from hundreds of weak URLs.'
      ]],
      ['Why the distinction matters', [
        'A category is a main shelf. A tag is a smaller recurring pattern inside that shelf. When those roles blur, the site starts producing pages that look searchable but have too little substance to reward a reader.',
        'The better rule is patience. Let a tag gather enough related records, then allow it to become a public archive page when it can stand on its own.'
      ]],
      ['How to use this inside the archive', [
        'Use tags to connect motifs such as roadside apparitions, map errors, repeated objects, or source-status patterns. Keep them clickable for readers, but only index the tag page after the shelf has real depth.',
        'This gives each new article room to join the network immediately while keeping sitemap growth tied to useful pages instead of raw keyword count.'
      ]],
      ['What to watch for', [
        'A tag page becomes thin when it has one article, no explanation, and no real reason to exist beyond matching a phrase. It may still help readers, but it should not be treated as a strong search page yet.',
        'The warning sign is sameness: many pages with one item, identical descriptions, and no distinct reader purpose.'
      ]],
      ['Where to go next', [
        'Read this guide alongside [[How Elevator Legends Became Modern Threshold Stories|/stories/how-elevator-legends-became-modern-threshold-stories]] and then compare it with the broader [[Story & Source Notice|/fiction-disclaimer.html]].',
        'A strong reading path usually moves from category to article, then from article to a tag with enough connected records to feel earned.'
      ]]
    ]
  },
  'why-mystery-articles-should-name-the-limit': {
    deck: 'A guide to making mystery articles stronger by stating what can be checked, what remains uncertain, and why that boundary improves trust.',
    bestFor: 'Readers who want mystery writing that feels compelling without pretending uncertainty has been solved',
    sections: [
      ['What this guide is for', [
        'A mystery article becomes more believable when it names the limit instead of hiding it. The limit is not a weakness; it tells the reader where documented material ends and interpretation begins.',
        'This guide is for reading strange records without turning every gap into proof. A named boundary lets the mystery remain alive without asking for false certainty.'
      ]],
      ['Why the distinction matters', [
        'Some records have dates, places, witnesses, images, or archived copies. Others have repeated tellings and a strong motif. Those are different kinds of value, and the article should not pretend they weigh the same.',
        'When the limit is visible, the reader can trust the article even when the story itself remains unsettled.'
      ]],
      ['How to use this inside the archive', [
        'Look for the Source Status box, the Story & Source Note, and the evidence section. Those areas tell the reader whether the article is handling a documented tradition, a modern retelling, a speculative reading, or an original archive-style entry.',
        'The point is not to drain the mood. The point is to keep the record honest enough that readers want to continue.'
      ]],
      ['What to watch for', [
        'Be cautious when an article jumps from “people say” to “this happened.” That jump is where many mystery pages lose trust.',
        'A stronger page can still be atmospheric, but it should let the reader see which details are sourced, repeated, inferred, or simply useful for understanding the motif.'
      ]],
      ['Where to go next', [
        'Read this guide alongside [[Why Receipt Legends Keep Returning in Modern Folklore|/stories/why-receipt-legends-keep-returning-in-modern-folklore]] and then compare it with the broader [[Story & Source Notice|/fiction-disclaimer.html]].',
        'The best next step is to open one article and ask what its strongest claim really is before following a related record.'
      ]]
    ]
  },
  'how-to-build-a-reading-path-through-the-strange-archive': {
    deck: 'A guide to moving through The Strange Archive by category, tag, source status, and recurring motif instead of wandering by headline alone.',
    bestFor: 'Readers who want a clear route through related strange records',
    sections: [
      ['What this guide is for', [
        'The archive is easiest to read when each page leads somewhere specific. A reading path begins with a category, narrows through tags, then checks the Story Map and source note before moving to a related record.',
        'That path keeps the site from feeling like a pile of disconnected titles. It lets one article become a doorway into a larger pattern.'
      ]],
      ['Why the distinction matters', [
        'Categories tell readers the broad shelf: urban legends, internet folklore, myths, strange places, and similar groups. Tags explain the smaller pattern that made one story feel related to another.',
        'Source status adds the third layer. It tells the reader whether the connection is tradition, documented context, speculative interpretation, or original archive-style work.'
      ]],
      ['How to use this inside the archive', [
        'Start with an article that feels concrete. Follow its tags to similar motifs, use the sidebar for related records, and check whether the next page shares setting, evidence type, or story structure.',
        'If a path starts to feel too broad, return to the category page and pick a narrower shelf.'
      ]],
      ['What to watch for', [
        'A weak path connects pages only because the titles sound dramatic. A useful path connects them because they share a pattern: a road, a doorway, a receipt, a map, a creature, a ritual, or a source problem.',
        'The best routes feel intentional without forcing every record to explain every other record.'
      ]],
      ['Where to go next', [
        'Read this guide alongside [[The Old Well That Shows a Different Sky|/stories/the-old-well-that-shows-a-different-sky]] and then compare it with the broader [[Story & Source Notice|/fiction-disclaimer.html]].',
        'A good archive session should end with the reader knowing why the next page is next.'
      ]]
    ]
  },
  'why-strange-nature-stories-need-careful-evidence': {
    deck: 'A guide to reading strange nature records through observation, weather, animal behavior, and local memory without overclaiming what the evidence shows.',
    bestFor: 'Readers who want nature mysteries handled with atmosphere and restraint',
    sections: [
      ['What this guide is for', [
        'Nature stories often begin with something that sounds observable: a light, a tide, a flock, a tree, a lake, a field, or a season that behaves strangely. That makes them powerful, but it also makes evidence handling important.',
        'This guide explains why natural details need careful separation between what someone noticed, what was recorded, and what later retellings turned into a pattern.'
      ]],
      ['Why the distinction matters', [
        'A repeated observation is not the same as a verified cause. Weather, animal movement, shoreline change, and seasonal timing can all be real without proving the legend attached to them.',
        'The best nature records keep both possibilities visible: the physical detail that could be checked and the story meaning people placed around it.'
      ]],
      ['How to use this inside the archive', [
        'When reading a strange nature article, look for dates, location clues, seasonal context, photographs, field notes, or local records. If those are missing, the article should say so.',
        'The story can still matter as folklore, but the evidence limit changes how strongly it should be framed.'
      ]],
      ['What to watch for', [
        'Be careful with nature claims that rely only on amazement. “Impossible” is often a sign that the article needs better context, not a stronger headline.',
        'A responsible page can describe wonder while still asking what weather data, maps, or repeated observations would actually show.'
      ]],
      ['Where to go next', [
        'Read this guide alongside [[The Crows That Land Only on One Roof Before Rain|/stories/the-crows-that-land-only-on-one-roof-before-rain]] and then compare it with the broader [[Story & Source Notice|/fiction-disclaimer.html]].',
        'A useful next page should keep one natural detail in focus rather than expanding the mystery until it becomes vague.'
      ]]
    ]
  },
  'how-to-read-folklore-without-flattening-it-into-fact': {
    deck: 'A guide to reading folklore as tradition, memory, warning, and motif without forcing every tale into a literal yes-or-no claim.',
    bestFor: 'Readers who want older stories respected without turning symbolic material into false certainty',
    sections: [
      ['What this guide is for', [
        'Folklore is not weaker because it changes. Variation is often how it survives. This guide explains how to read those changes without flattening the story into a single factual claim.',
        'The goal is to preserve rule, warning, symbol, and local memory while being clear about what kind of source is being used.'
      ]],
      ['Why the distinction matters', [
        'A collected tale, a family warning, a local custom, and a modern retelling do not all prove the same thing. They may still belong to the same tradition, but the article should say how.',
        'That distinction protects both the story and the reader. It keeps folklore from being treated as disposable rumor or as confirmed event when it is neither.'
      ]],
      ['How to use this inside the archive', [
        'Follow the repeated element: the object, creature, rule, place, phrase, or warning. Then compare how that element behaves across versions.',
        'A strong folklore article asks what the motif does before asking whether the literal event happened.'
      ]],
      ['What to watch for', [
        'Be careful when a page treats every version as evidence for one dramatic claim. Folklore often carries meaning through repetition, not through a single stable plot.',
        'A better reading names the tradition, the variation, and the source limit.'
      ]],
      ['Where to go next', [
        'Read this guide alongside [[The Door Knock That Must Never Be Answered Twice|/stories/the-door-knock-that-must-never-be-answered-twice]] and then compare it with the broader [[Story & Source Notice|/fiction-disclaimer.html]].',
        'From there, follow another article with the same rule-shaped motif and notice what changes.'
      ]]
    ]
  },
  'why-mythic-objects-work-as-story-anchors': {
    deck: 'A guide to why mirrors, bells, keys, masks, jars, and other charged objects make myths and legends easier to remember.',
    bestFor: 'Readers who want to understand why objects carry so much folklore weight',
    sections: [
      ['What this guide is for', [
        'A mythic object gives a story something to hold. A bell, mirror, key, jar, mask, or coin can carry a rule more efficiently than a long explanation.',
        'This guide explains how objects become anchors: they concentrate fear, warning, memory, ownership, and ritual into something the reader can picture.'
      ]],
      ['Why the distinction matters', [
        'An object in folklore is rarely just a prop. It can mark a boundary, store a promise, trigger a punishment, or make an invisible rule visible.',
        'That does not mean every object story is factual. It means the article should ask what the object does inside the tradition before treating it as evidence.'
      ]],
      ['How to use this inside the archive', [
        'When reading a mythic-object article, watch what happens when someone touches, opens, loses, steals, repairs, or refuses the object.',
        'Those actions usually reveal the real structure of the story.'
      ]],
      ['What to watch for', [
        'A weak object legend only says an item is cursed. A stronger record explains the rule around the item and why people remember that rule.',
        'The object should make the story more specific, not merely decorate it.'
      ]],
      ['Where to go next', [
        'Read this guide alongside [[The Key That Fits Every Door Except Home|/stories/the-key-that-fits-every-door-except-home]] and then compare it with the broader [[Story & Source Notice|/fiction-disclaimer.html]].',
        'A good next step is another object story where the rule changes the meaning of an ordinary thing.'
      ]]
    ]
  },
  'how-to-follow-map-mysteries-and-lost-place-records': {
    deck: 'A guide to reading map mysteries and lost-place records through coordinates, routes, local memory, and the limits of location evidence.',
    bestFor: 'Readers who like strange places but want clearer map and source boundaries',
    sections: [
      ['What this guide is for', [
        'Map mysteries feel persuasive because a place seems like it should be checkable. A road, island, room, station, or border gives the story a physical shape.',
        'This guide explains how to read that shape without assuming a mapped location proves every strange claim attached to it.'
      ]],
      ['Why the distinction matters', [
        'A location can be real while the story around it remains uncertain. Likewise, an unmapped place can still reveal a recurring folklore pattern.',
        'The useful question is what the map can support: a route, a name, a boundary, a disappearance, a local memory, or only a later retelling.'
      ]],
      ['How to use this inside the archive', [
        'Look for coordinates, old maps, transit records, property notes, local names, and repeated route details. Then ask which parts are stable across versions.',
        'If the only stable detail is the mood of the place, the article should keep the claim modest.'
      ]],
      ['What to watch for', [
        'Be careful with lost-place stories that use maps as decoration but never say what the map actually shows.',
        'A strong page lets the reader see the difference between a location record and a legend that borrowed a location.'
      ]],
      ['Where to go next', [
        'Read this guide alongside [[The Island No One Could Map Twice|/stories/the-island-no-one-could-map-twice]] and then compare it with the broader [[Story & Source Notice|/fiction-disclaimer.html]].',
        'After that, follow a place record with a different evidence problem: a room, a road, a station, or a border.'
      ]]
    ]
  },
  'how-internet-folklore-turns-errors-into-stories': {
    deck: 'A guide to how screenshots, glitches, reposts, and tiny digital errors become online folklore when people keep noticing them.',
    bestFor: 'Readers who want internet folklore explained without treating every screenshot as proof',
    sections: [
      ['What this guide is for', [
        'Internet folklore often begins with a small error: one pixel out of place, a file name, a repeated screenshot, a missing timestamp, or a detail that looks wrong only after someone points it out.',
        'This guide explains how those small digital traces become stories through repetition, reposting, and shared attention.'
      ]],
      ['Why the distinction matters', [
        'A screenshot can prove that an image circulated, but it may not prove where it began, who changed it, or what the original context meant.',
        'That distinction matters because digital evidence often feels stronger than it is.'
      ]],
      ['How to use this inside the archive', [
        'When reading internet folklore, look for original uploads, archived pages, platform dates, comment chains, file metadata, and signs that the image changed over time.',
        'If those traces are missing, the article can still explain the folklore pattern, but it should not pretend to have found the origin.'
      ]],
      ['What to watch for', [
        'Be careful when a page treats virality as verification. A story can spread quickly because it is easy to share, not because it is well documented.',
        'The stronger reading asks why the error became memorable enough for people to keep repeating.'
      ]],
      ['Where to go next', [
        'Read this guide alongside [[The Screenshot That Was Always One Pixel Wrong|/stories/the-screenshot-that-was-always-one-pixel-wrong]] and then compare it with the broader [[Story & Source Notice|/fiction-disclaimer.html]].',
        'A useful next article should show another digital trace whose importance comes from repetition, not certainty.'
      ]]
    ]
  },
  'why-urban-legends-use-ordinary-places': {
    deck: 'A guide to why urban legends return to elevators, bus stops, parking lots, hotels, roads, and other ordinary public spaces.',
    bestFor: 'Readers who want to understand why familiar locations make legends feel believable',
    sections: [
      ['What this guide is for', [
        'Urban legends work because they borrow places readers already understand. An elevator, bus stop, hotel corridor, parking lot, road, or convenience store needs almost no explanation.',
        'This guide explains why ordinary settings make strange stories easier to imagine, share, and remember.'
      ]],
      ['Why the distinction matters', [
        'A familiar place creates plausibility, but plausibility is not proof. The article should separate the social force of the setting from the factual status of the event.',
        'That separation is what lets an urban legend feel close without being presented as confirmed news.'
      ]],
      ['How to use this inside the archive', [
        'When reading an urban legend, ask why this setting was chosen. Does the story need privacy, public embarrassment, a threshold, a wrong turn, a late-night routine, or a witness who cannot stay?',
        'The setting often tells the reader what kind of fear or warning the legend is carrying.'
      ]],
      ['What to watch for', [
        'Be careful with legends that rely only on “it could happen anywhere.” The stronger version usually depends on a more precise public routine.',
        'The ordinary place should do real work inside the story.'
      ]],
      ['Where to go next', [
        'Read this guide alongside [[The Woman in White at the Bend|/stories/woman-in-white-roadside-legend]] and then compare it with the broader [[Story & Source Notice|/fiction-disclaimer.html]].',
        'From there, follow another public-space record and notice which routine the legend interrupts.'
      ]]
    ]
  },
  'how-to-read-source-status-before-sharing-a-strange-story': {
    deck: 'A guide to checking source status before sharing a strange story, so folklore value and factual certainty do not get confused.',
    bestFor: 'Readers who want to share strange stories responsibly',
    sections: [
      ['What this guide is for', [
        'Source status is the reader’s first safety rail. It tells you whether a page is handling documented material, a modern retelling, speculative interpretation, folklore, or original archive-style writing.',
        'This guide explains how to read that label before repeating a strange story as if it were verified fact.'
      ]],
      ['Why the distinction matters', [
        'Sharing changes a story. A careful source label can travel with the article, but a confident retelling can strip that label away.',
        'The distinction protects readers from confusing a memorable motif with a documented event.'
      ]],
      ['How to use this inside the archive', [
        'Before sharing, check the category, tags, source status, Story Map, and Story & Source Note. Those pieces tell you how strongly the article is asking to be believed.',
        'If the source status is uncertain, describe the story as a legend, motif, rumor, or retelling rather than a confirmed fact.'
      ]],
      ['What to watch for', [
        'Be careful with summaries that remove uncertainty. A single missing phrase can turn a responsible article into a misleading claim.',
        'A good share keeps the mystery interesting while keeping the evidence boundary visible.'
      ]],
      ['Where to go next', [
        'Read this guide alongside [[The Envelope That Arrives Empty Every Spring|/stories/the-envelope-that-arrives-empty-every-spring]] and then compare it with the broader [[Story & Source Notice|/fiction-disclaimer.html]].',
        'The next best habit is simple: preserve the label when you preserve the story.'
      ]]
    ]
  }
};

let updated = 0;
for (const guide of guides) {
  const refinement = refinements[guide.slug];
  if (!refinement) continue;
  guide.deck = refinement.deck;
  guide.bestFor = refinement.bestFor;
  guide.excerpt = guide.excerpt || refinement.deck;
  guide.metaDescription = guide.metaDescription || refinement.deck;
  guide.ogDescription = guide.ogDescription || guide.metaDescription;

  const existingByTitle = new Map((guide.sections || []).map((section) => [section.title, section]));
  guide.sections = refinement.sections.map(([title, paragraphs]) => {
    const existing = existingByTitle.get(title) || {};
    return {
      id: existing.id || slugify(title),
      title,
      nav: existing.nav || title,
      paragraphs
    };
  });
  addGuideDepth(guide);

  guide.faq = buildFaq(guide);
  updated += 1;
}

fs.writeFileSync(guidesPath, `${JSON.stringify(guides, null, 2)}\n`, 'utf8');
console.log(`Refined ${updated} Mystery Board guide record(s).`);

function buildFaq(guide) {
  const tag = String(guide.tag || 'guide').toLowerCase();
  return [
    {
      question: `What should I use this ${tag} for?`,
      answer: 'Use it as a reading aid. It helps you understand how records connect, where evidence becomes limited, and which archive path to follow next.'
    },
    {
      question: 'Does this guide prove the stories it mentions?',
      answer: 'No. A guide explains method, pattern, and source awareness. Individual article source notes still describe what each record can and cannot support.'
    },
    {
      question: 'How does this help with SEO without weakening the archive?',
      answer: 'It gives readers and search engines clearer structure while avoiding thin pages, exaggerated claims, and repeated generic explanations.'
    },
    {
      question: 'What should I read after this page?',
      answer: 'Open one related article, check its category and tags, then use the Story & Source Note to decide whether to continue by motif, source status, or archive shelf.'
    }
  ];
}

function addGuideDepth(guide) {
  const tag = String(guide.tag || 'archive method').toLowerCase();
  const useSection = guide.sections.find((section) => section.id === 'how-to-use-it-in-the-archive');
  const watchSection = guide.sections.find((section) => section.id === 'what-to-watch-for');
  if (useSection) {
    useSection.paragraphs.push(`In practice, this means the guide should change how a reader moves. After reading one record, the reader should know whether to follow ${tag}, a broader category shelf, a source-status question, or a related motif that appears in another article.`);
  }
  if (watchSection) {
    watchSection.paragraphs.push('The risk is not that a strange story remains unresolved. The risk is that the page sounds more certain than its material allows. A useful Mystery Board guide keeps the route clear while leaving the uncertainty honestly named.');
  }
  const sourceAddon = ` It should help readers navigate the archive with more context while preserving the difference between documented material, folklore value, editorial interpretation, and original archive-style writing.`;
  if (!String(guide.sourceNote || '').includes('documented material, folklore value')) {
    guide.sourceNote = `${guide.sourceNote || 'This Mystery Board guide is an editorial reading aid.'}${sourceAddon}`;
  }
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
