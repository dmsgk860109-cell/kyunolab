const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const scriptsPath = path.join(root, 'data', 'scripts.json');
const scripts = JSON.parse(fs.readFileSync(scriptsPath, 'utf8'));

const packs = {
  'vanishing-hitchhiker-urban-legend-youtube-script': {
    voice: [
      'Calm roadside documentary tone, slow opening pace.',
      'Quiet and natural, tightening during the empty-seat reveal.',
      'Balanced delivery, clearly separating each variant.',
      'Source-aware, restrained, without sounding academic.',
      'Soft reflective ending, emphasize the final question.'
    ],
    sound: [
      'distant road ambience, soft night wind',
      'low car interior room tone, faint tire noise',
      'quiet cemetery gate ambience, distant wind',
      'soft paper movement, muted room tone',
      'empty road ambience, fading headlights'
    ],
    parts: [
      [
        {
          note: 'Establish the lonely road before the passenger becomes the center of the legend.',
          beats: [
            ['Image Prompt 1', 'A lonely two-lane road at night stretches under weak headlights, with wet pavement, a narrow shoulder, and deep darkness beyond the trees. The frame feels realistic, quiet, and local, with muted colors and restrained roadside mystery.'],
            ['Image Prompt 2', 'A single young woman stands near the road shoulder in dim headlights, calm and still rather than theatrical. Her pale clothing is visible, the background stays grounded in a modern roadside setting, and the mood suggests uncertainty without gore or exaggerated horror.']
          ]
        },
        {
          note: 'Show the act of help as ordinary, so the later disappearance feels sharper.',
          beats: [
            ['Image Prompt 1', 'A driver slows beside a lone passenger on a dark rural road, the car door just beginning to open. The scene is framed from outside the vehicle, realistic and understated, with fog, headlight glare, and no supernatural effects yet.'],
            ['Image Prompt 2', 'Inside a quiet car at night, the driver looks forward while the passenger sits partly in shadow in the rear seat. Streetlight reflections cross the windows, and the cabin feels small, silent, and believable.']
          ]
        }
      ],
      [
        {
          note: 'Move from the requested destination to the moment when the ride stops feeling normal.',
          beats: [
            ['Image Prompt 1', 'A car dashboard glows softly at night while a quiet passenger is visible in the rear-view mirror. The road ahead is dark and empty, with realistic low light and a restrained urban legend atmosphere.'],
            ['Image Prompt 2', 'The driver glances toward the rear-view mirror as the passenger becomes harder to see in the back seat. The image stays grounded, with soft shadows, muted colors, and no dramatic ghost effects.']
          ]
        },
        {
          note: 'Make the absence the central reveal, not a monster or jump scare.',
          beats: [
            ['Image Prompt 1', 'The back seat of an older car is suddenly empty at night, with the seat fabric still visible under passing streetlight. The composition focuses on absence, realistic texture, and a quiet shock.'],
            ['Image Prompt 2', 'A driver stands outside the car near a dim house or cemetery road, looking back at the empty passenger seat. The scene feels confused and restrained, with no visible ghost and no invented violence.']
          ]
        }
      ],
      [
        {
          note: 'Connect the empty seat to memory, keeping the driver as an ordinary witness.',
          beats: [
            ['Image Prompt 1', 'A night road continues beyond the windshield after the passenger has vanished, with the empty seat visible in the foreground. The image suggests memory entering an ordinary trip, using cool low-saturation colors and documentary realism.']
          ]
        },
        {
          note: 'Show local variants through places people can point to, not through extra plot events.',
          beats: [
            ['Image Prompt 1', 'A closed cemetery gate stands beside a dark roadside, with a narrow path and old stone markers visible beyond it. The frame feels like a local legend location, realistic and quiet.'],
            ['Image Prompt 2', 'A modest old house at night sits at the end of a quiet street, porch light glowing softly. The image represents the home-address variant without adding characters or readable fake text.']
          ]
        }
      ],
      [
        {
          note: 'Explain why the legend travels by showing roads, gates, and repeated local memory.',
          beats: [
            ['Image Prompt 1', 'An old road map lies on a desk beside a small photograph and handwritten location notes about a roadside ghost story. The scene feels archival, with soft desk light, realistic paper texture, and no readable fake text.'],
            ['Image Prompt 2', 'Several small town roads are marked on an aged map, with cemetery symbols and bridge crossings suggested by simple visual marks. The image stays source-aware and avoids invented evidence.']
          ]
        },
        {
          note: 'Keep the folklore pattern visible while leaving proof uncertain.',
          beats: [
            ['Image Prompt 1', 'A desk holds a family photograph, an old coat, and a note card connected to a vanishing passenger tale. The objects feel like folklore evidence, grounded and ambiguous, with warm low light and realistic surfaces.'],
            ['Image Prompt 2', 'A grave marker is seen from a respectful distance near a cemetery path, with no readable name and no dramatic apparition. The frame suggests confirmation while keeping the larger account uncertain.']
          ]
        }
      ],
      [
        {
          note: 'Shift the passenger from threat to unfinished memory.',
          beats: [
            ['Image Prompt 1', 'A quiet empty passenger seat is lit by faint moonlight, with a folded pale coat or scarf resting where someone might have sat. The image feels sad, restrained, and unresolved rather than frightening.']
          ]
        },
        {
          note: 'End with the road open and the final question still following the headlights.',
          beats: [
            ['Image Prompt 1', 'The lonely road is empty again after midnight, with faint headlights disappearing into fog and no passenger visible. The composition is wide, quiet, and realistic, leaving the roadside unresolved.'],
            ['Image Prompt 2', 'A final view through a windshield shows darkness ahead and an empty rear-view mirror, with soft dashboard light and a calm documentary mystery mood.']
          ]
        }
      ]
    ]
  },
  'wild-hunt-folklore-youtube-script': {
    voice: [
      'Low, calm folklore tone, gradually building with the storm.',
      'Steady and tense, keeping the host vast rather than theatrical.',
      'Clear and balanced, treating regional names as variants.',
      'Quiet interpretive tone, tied to winter weather and older belief.',
      'Reflective, distant, soft ending after the hunt passes.'
    ],
    sound: [
      'distant wind, low thunder, faint horn-like ambience',
      'hoofbeat-like low rhythm, storm wind, distant hounds',
      'fireplace room tone, soft carved wood ambience',
      'winter forest wind, branches moving, low distant rumble',
      'fading storm wind, distant horn, quiet open sky'
    ],
    parts: [
      [
        {
          note: 'Begin with sound and weather before revealing the riders.',
          beats: [
            ['Image Prompt 1', 'A dark European winter landscape sits beneath a violent night sky, with storm clouds moving low over fields and forest. The image focuses on wind, darkness, and expectation, with no modern roads or vehicles.'],
            ['Image Prompt 2', 'Faint rider shapes begin to form inside the storm clouds above an old rural landscape. The figures are distant and half-hidden, realistic and folkloric rather than fantasy spectacle.']
          ]
        },
        {
          note: 'Introduce the supernatural host as a passing force humans should not follow.',
          beats: [
            ['Image Prompt 1', 'A spectral hunting host crosses a stormy night sky, with riders and hounds visible as shadowed forms in cloud and rain. The composition is wide and restrained, rooted in European folklore and cold muted color.'],
            ['Image Prompt 2', 'A small human witness stands below the ridge while the Wild Hunt moves overhead, making the person feel tiny beneath the supernatural procession. The image avoids modern vehicles and keeps the landscape old and rural.']
          ]
        }
      ],
      [
        {
          note: 'Show regional variety without turning one leader into the only answer.',
          beats: [
            ['Image Prompt 1', 'An old firelit hall contains carved figures of riders, hounds, antlers, cloaks, and storm clouds on aged wood and stone. The image suggests many regional Wild Hunt forms without labeling one as final.'],
            ['Image Prompt 2', 'A close view of ancient carved riders and hounds on weathered wood, lit by warm firelight and surrounded by shadow. The mood is historical, restrained, and source-aware.']
          ]
        },
        {
          note: 'Turn the hunt into an omen by making the sky feel like a road for danger.',
          beats: [
            ['Image Prompt 1', 'A storm sky stretches over a village edge at night, with a faint procession of riders passing through the clouds like a road above the roofs. The scene feels ominous but grounded in weather and folklore.'],
            ['Image Prompt 2', 'A lone window glows in a dark cottage while horns and hoofbeats seem to pass overhead in the storm. No riders are seen directly, only the pressure of the unseen procession.']
          ]
        }
      ],
      [
        {
          note: 'Keep the warning simple: stay out of the hunt path.',
          beats: [
            ['Image Prompt 1', 'A narrow old footpath disappears into a storm-dark forest while spectral hounds move faintly beyond the trees. The frame warns against following, with cold wind, deep shadows, and no modern objects.']
          ]
        },
        {
          note: 'Use winter weather as the bridge between real sound and supernatural story.',
          beats: [
            ['Image Prompt 1', 'A bare winter forest bends under strong wind while clouds race overhead. Branches, darkness, and distant animal shapes create the feeling of an unseen procession without showing a literal road.'],
            ['Image Prompt 2', 'Snow and dead leaves sweep across an open field beneath a black sky, with hoofbeat-like impressions suggested in the ground. The image feels natural first, folkloric second.']
          ]
        }
      ],
      [
        {
          note: 'Show the older belief layers as crowded but not solved.',
          beats: [
            ['Image Prompt 1', 'A candlelit table holds old folklore notes, a rough winter calendar, a carved rider figure, and symbols of the dead and seasonal change. The objects are separated clearly, with no readable fake text.'],
            ['Image Prompt 2', 'A shadowed doorway opens from a warm human home toward a dark winter field, suggesting the boundary between household safety and the open night. The mood is old, quiet, and uncanny.']
          ]
        },
        {
          note: 'Distinguish later fantasy order from older regional uncertainty.',
          beats: [
            ['Image Prompt 1', 'An archive desk shows two distinct layers: older handwritten folklore notes on one side and later illustrated fantasy-style summaries on the other. The lighting keeps the materials separate and avoids making either one dominant.']
          ]
        }
      ],
      [
        {
          note: 'Leave the rider unnamed so the uncertainty remains part of the legend.',
          beats: [
            ['Image Prompt 1', 'A distant line of riders fades into cloud over a dark ridge, with no clear leader visible. The image emphasizes distance, uncertainty, and the passing sound of horns and hounds.']
          ]
        },
        {
          note: 'End below the empty sky, after the hunt has moved beyond explanation.',
          beats: [
            ['Image Prompt 1', 'The storm begins to clear over a cold rural landscape, leaving only moonlit clouds and a small witness far below. The hunt is gone, but the sky still feels like a road for the dead.'],
            ['Image Prompt 2', 'A final wide view of empty winter sky above a dark forest, with faint mist and no riders visible. The mood is quiet, unresolved, and grounded in old European folklore.']
          ]
        }
      ]
    ]
  },
  'shambhala-hidden-kingdom-youtube-script': {
    voice: [
      'Calm, reverent documentary tone, spacious pacing.',
      'Clear and careful, separating paradise imagery from older tradition.',
      'Quiet interpretive tone, emphasizing hiddenness as meaning.',
      'Source-aware, respectful, without adventure narration.',
      'Reflective, soft ending, leave the kingdom protected by distance.'
    ],
    sound: [
      'high mountain wind, distant low bell',
      'soft room tone, page movement, distant wind',
      'thin mountain air, quiet valley ambience',
      'archive room tone, soft paper movement',
      'distant bell, cold wind, gentle fabric movement'
    ],
    parts: [
      [
        {
          note: 'Open with sacred distance rather than a treasure-map adventure.',
          beats: [
            ['Image Prompt 1', 'A narrow mountain pass rises between snow-covered peaks at dawn, with mist hiding whatever lies beyond the ridge. The scene is realistic, cold, and contemplative, using muted blue and gold tones.'],
            ['Image Prompt 2', 'A hidden valley is barely visible through cloud layers beyond a high mountain pass. The image suggests sacred geography and distance, not exploration or conquest.']
          ]
        },
        {
          note: 'Show the later paradise image while keeping it quieter than fantasy spectacle.',
          beats: [
            ['Image Prompt 1', 'A peaceful valley rests beyond snow peaks, with a distant monastery-like roof partly obscured by morning mist. The frame feels restrained and reverent, with no adventure-fantasy exaggeration.'],
            ['Image Prompt 2', 'A mountain path vanishes into cloud before reaching a hidden valley, suggesting that Shambhala cannot be reached by ordinary travel alone. The image is grounded and respectful.']
          ]
        }
      ],
      [
        {
          note: 'Shift from geography to symbol without losing the mountain imagery.',
          beats: [
            ['Image Prompt 1', 'A quiet monastery room holds Buddhist manuscripts, a painted mandala, and soft lamplight, with snowy mountains visible through a small window. The scene feels respectful, grounded, and culturally careful.'],
            ['Image Prompt 2', 'A close view of manuscript pages and a mandala under warm low light, with realistic paper texture and no readable fake text. The image suggests preserved teaching and sacred order.']
          ]
        },
        {
          note: 'Connect Shambhala to Kalachakra contexts without flattening it into a mapped city.',
          beats: [
            ['Image Prompt 1', 'An archive-style table shows a Buddhist manuscript, symbolic diagram, and a simple mountain outline placed separately under soft light. The image connects text, prophecy, and geography without inventing a literal modern map location.']
          ]
        }
      ],
      [
        {
          note: 'Keep the landscape protected and quiet, not empty.',
          beats: [
            ['Image Prompt 1', 'A hidden Himalayan-style valley lies beyond layered ridges, with a distant monastery roof half-covered by cloud. The scene feels protected, quiet, and realistic, using cold wind and pale sunlight.'],
            ['Image Prompt 2', 'Prayer flags move lightly in mountain wind near a stone path, while the valley beyond remains partly hidden. The mood is contemplative and respectful, with no expedition imagery.']
          ]
        },
        {
          note: 'Separate Shambhala from later lost-world fantasy and Shangri-La-like simplifications.',
          beats: [
            ['Image Prompt 1', 'A desk shows three distinct materials: Buddhist manuscript pages, a mountain map, and later travel notes, each placed apart under soft archive light. The image keeps tradition and later interpretation visually separate.'],
            ['Image Prompt 2', 'A restrained comparison image shows an old manuscript in the foreground and a distant mountain valley sketch in the background, making the cultural layer clearer than the adventure fantasy layer.']
          ]
        }
      ],
      [
        {
          note: 'Protect the cultural and religious weight of the name instead of treating every hidden valley as Shambhala.',
          beats: [
            ['Image Prompt 1', 'A quiet monastery courtyard at high altitude sits under snow peaks, with lamps, stone paths, and prayer flags arranged respectfully. The image feels grounded in sacred place rather than generic lost-city fantasy.']
          ]
        },
        {
          note: 'Keep the sacred tradition, imagined geography, and later interpretation visible as separate layers.',
          beats: [
            ['Image Prompt 1', 'Three visual layers sit on an archive table: a manuscript, a mountain drawing, and later Western notes, separated by empty space. The scene is calm, source-aware, and free of readable fake text.'],
            ['Image Prompt 2', 'A wide mountain landscape fades into a quiet manuscript page overlay-like composition, suggesting layers of tradition without turning the image into a literal map.']
          ]
        }
      ],
      [
        {
          note: 'Let Shambhala resist possession, photography, and simple explanation.',
          beats: [
            ['Image Prompt 1', 'A distant hidden valley remains mostly covered by cloud while a mountain path stops before the final ridge. The image suggests that the place cannot simply be reached and explained away.']
          ]
        },
        {
          note: 'End with reverence as the reason the mystery remains larger than location.',
          beats: [
            ['Image Prompt 1', 'A distant monastery bell tower stands against snowy mountains at dusk, with prayer flags moving in cold wind and the hidden valley fading into blue shadow. The scene is quiet, respectful, and unresolved.'],
            ['Image Prompt 2', 'The final frame shows snow peaks and soft evening cloud with no visible destination, leaving Shambhala hidden behind distance, texts, and reverence.']
          ]
        }
      ]
    ]
  }
};

let updated = 0;

for (const script of scripts) {
  const pack = packs[script.slug];
  if (!pack || !Array.isArray(script.visualGuide)) continue;
  const scenes = distributeByScene(script.longformScript || [], script.visualGuide.length);
  script.visualGuide = script.visualGuide.map((scene, sceneIndex) => {
    const partSpecs = pack.parts[sceneIndex] || [];
    const narrationParts = (scenes[sceneIndex] || []).map((narration, partIndex) => {
      const spec = partSpecs[partIndex] || partSpecs[partSpecs.length - 1] || {};
      return {
        narration,
        estimatedReadingTime: secondsToApproxLabel(estimatedNarrationSeconds(narration)),
        creatorNote: spec.note || `Keep this part specific to ${script.mainSubject || script.title}.`,
        visualBeats: (spec.beats || []).map(([label, imagePrompt], beatIndex) => ({
          label,
          imagePrompt,
          motionPrompt: motionPromptForBeat(beatIndex)
        }))
      };
    });

    const nextScene = {
      sceneRole: scene.sceneRole,
      sceneFocus: scene.sceneFocus,
      directionTip: scene.directionTip || scene.sceneFocus,
      voiceDirection: pack.voice[sceneIndex] || 'Calm documentary delivery.',
      soundEffect: pack.sound[sceneIndex] || '',
      visualDirection: scene.visualDirection,
      narrationParts
    };
    return nextScene;
  });

  script.imagePrompts = script.visualGuide
    .flatMap((scene) => scene.narrationParts || [])
    .flatMap((part) => part.visualBeats || [])
    .map((beat) => beat.imagePrompt)
    .filter(Boolean);
  script.updatedAt = '2026-07-20';
  updated += 1;
}

fs.writeFileSync(scriptsPath, `${JSON.stringify(scripts, null, 2)}\n`);
console.log(`Applied Narration Part visual beats to ${updated} Creator Pack(s).`);

function distributeByScene(items, sceneCount) {
  const scenes = Array.from({ length: sceneCount }, () => []);
  items.forEach((item, index) => {
    scenes[Math.min(sceneCount - 1, Math.floor(index * sceneCount / items.length))].push(item);
  });
  return scenes;
}

function estimatedNarrationSeconds(narration) {
  const words = String(narration || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(8, Math.round(words / 2.35));
}

function secondsToApproxLabel(seconds) {
  return `≈ ${seconds} sec`;
}

function motionPromptForBeat(index) {
  return [
    'Use slow controlled movement that keeps the key subject readable.',
    'Use a gentle lateral move or subtle push-in as the narration advances.',
    'Hold on the important detail, then transition softly to the next beat.'
  ][index] || 'Keep the motion restrained and natural.';
}
