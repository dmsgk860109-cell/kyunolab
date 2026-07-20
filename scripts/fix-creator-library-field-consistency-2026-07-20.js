const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const scriptsPath = path.join(root, 'data', 'scripts.json');
const scripts = JSON.parse(fs.readFileSync(scriptsPath, 'utf8'));

const updates = {
  'vanishing-hitchhiker-urban-legend-youtube-script': {
    longformScript: [
      `A lonely road is one of the simplest places for a ghost story to begin.

A driver sees someone waiting in the dark. The person looks lost, tired, or strangely calm. Nothing about the moment feels impossible yet. That is why the legend works so well. It begins as a small act of help.`,
      `The driver offers a ride.

The passenger gives an address, a cemetery, or a familiar place nearby. The conversation is usually quiet. Sometimes the passenger says very little. Sometimes there is only enough speech to make the destination clear. For a few minutes, the story feels almost ordinary.`,
      `Then the ride changes.

The passenger disappears before the car arrives. In some versions, the driver looks back and finds the seat empty. In others, the driver reaches the address and learns the passenger died years earlier. The shock does not come from a monster. It comes from an absence.`,
      `That empty seat is the center of the Vanishing Hitchhiker.

It turns a common road trip into a meeting with memory. The driver did not enter a haunted house. They did not search for the supernatural. They were only moving from one place to another when the past stepped into the car.`,
      `The details change from place to place.

Some versions place the passenger near a cemetery gate. Others connect the figure to a prom night, a bridge, a wartime road, or a local accident. The name and destination may change, but the shape remains familiar. A stranger appears, accepts a ride, and vanishes before the story can become simple.`,
      `That is why the legend travels so easily.

Every community has roads that feel lonely after dark. Every town has places where people remember an accident, a death, or a story that parents repeat as a warning. The Vanishing Hitchhiker can attach itself to those places without needing many new details.`,
      `Folklorists often treat the story as a modern urban legend.

It is not tied to one verified event. It is better understood as a repeating pattern. The same kind of encounter appears in different regions, with different names and proofs. One version may offer an address. Another may offer a borrowed coat. Another may lead the driver back to a grave.`,
      `The proof is usually part of the tale.

The driver may return to the passenger's home. A family member may recognize the description. A photograph may reveal the same face. These details make the story feel close to evidence, even when the larger account stays uncertain. The legend asks us to stand between belief and doubt.`,
      `The passenger often feels less like a threat than a message.

They need to be carried somewhere. They need a final ride, a return home, or one more contact with the living. The fear is quiet because the figure is not chasing the driver. The figure is unfinished. That sadness is what gives the story its strange weight.`,
      `In the end, the Vanishing Hitchhiker remains powerful because it leaves the road open.

The driver continues forward, but the ride has changed. The passenger is gone, and the ordinary world returns. What remains is a question that follows the headlights into the dark. Who was really in the car, and why did they need that journey one more time?`
    ],
    shortsScript: [
      `A driver stops for a stranger on a lonely road.`,
      `The passenger gives an address and rides in silence.`,
      `Before they arrive, the back seat is empty.`,
      `Later, the driver learns that person died years ago.`,
      `That is why this legend keeps returning after dark.`
    ],
    visualGuide: [
      {
        sceneRole: 'Hook',
        sceneFocus: 'Introduce the passenger who appears beside the road.',
        aiImagePrompt: 'A lonely two-lane road stretches through darkness, with a single quiet figure standing near the shoulder under weak headlights. The scene feels realistic and restrained, with damp pavement, soft fog, muted colors, and the mood of a local roadside legend.',
        directionTip: 'Introduce the passenger who appears beside the road.',
        visualDirection: 'Hold the empty road for two seconds. Let the figure become visible in the headlights. Begin a slow push-in before fading to the ride.'
      },
      {
        sceneRole: 'Core Story',
        sceneFocus: 'Tell the ride-and-disappearance sequence.',
        aiImagePrompt: 'Inside an older car at night, the driver faces forward while a quiet passenger sits in the back seat, partly hidden by shadow. Streetlight reflections cross the windows, the cabin feels small and still, with the realism of a documentary reconstruction.',
        directionTip: 'Tell the ride-and-disappearance sequence.',
        visualDirection: 'Start inside the car. Keep the frame still during the first lines. Slowly zoom toward the rear seat as the silence becomes important.'
      },
      {
        sceneRole: 'Variant',
        sceneFocus: 'Compare the home-address and cemetery-gate versions.',
        aiImagePrompt: 'A modest old house and a closed cemetery gate appear as two grounded locations connected by the same night road. The lighting is low and natural, with cool blue shadows, restrained contrast, and a quiet local-memory atmosphere.',
        directionTip: 'Compare the home-address and cemetery-gate versions.',
        visualDirection: 'Cut from the house to the cemetery gate. Hold each image briefly. Use a soft fade so the two versions feel connected but separate.'
      },
      {
        sceneRole: 'Source Context',
        sceneFocus: 'Show how the legend circulates through local retellings.',
        aiImagePrompt: 'A desk holds old road maps, newspaper clippings, handwritten notes, and a small photograph connected to a roadside ghost story. The scene is softly lit by a desk lamp, with realistic paper texture and no readable fake text.',
        directionTip: 'Show how the legend circulates through local retellings.',
        visualDirection: 'Begin on the map. Pan slowly across the clippings and notes. Pause before the final sentence to let the source trail feel uncertain.'
      },
      {
        sceneRole: 'Closing',
        sceneFocus: 'End with the connection between the passenger and an earlier death.',
        aiImagePrompt: 'The same lonely road is empty again after midnight, with faint headlights disappearing into fog and no passenger visible. The image feels quiet, unresolved, and realistic, using cool low-saturation colors and soft darkness.',
        directionTip: 'End with the connection between the passenger and an earlier death.',
        visualDirection: 'Return to the empty road. Slow zoom away from the shoulder. Hold the frame after the last question, then fade to black.'
      }
    ],
    longformAdditions: [
      'The road is important because it gives the story a direction. It also gives the driver a reason to keep going after the first strange feeling appears.',
      'The passenger does not need to explain much. Their silence makes the driver fill in the space with ordinary assumptions.',
      'Many versions pause on the moment of discovery. The car is the same, the road is the same, but the person is no longer there.',
      'This makes the story feel personal. A private act of kindness becomes a private encounter with something the driver cannot prove.',
      'The changes also make the legend local. People can point to a road, a gate, or a house and say the story happened near them.',
      'That local feeling helps the tale survive. It can sound like something heard from a neighbor instead of something copied from a book.',
      'The repeated pattern matters more than one perfect source. The legend belongs to the way people retell it, test it, and pass it forward.',
      'The borrowed coat version shows this clearly. A physical object seems to confirm the meeting, but the confirmation still leads back to loss.',
      'The sadness keeps the legend from becoming only a scare. The passenger is frightening because they are gone, but also because they are remembered.',
      'That final uncertainty is gentle, but it is hard to dismiss. The road looks empty, yet the story makes every empty roadside feel watched.'
    ]
  },
  'wild-hunt-folklore-youtube-script': {
    longformScript: [
      `The Wild Hunt begins with the sky.

Not a clear sky, and not a peaceful one. It is night, winter, or storm weather. The wind rises. Somewhere above the clouds, people hear horns, hounds, hoofbeats, and voices. The sound moves like a procession crossing the dark.`,
      `In many European traditions, that sound belongs to a supernatural host.

The riders may be dead souls, hunters, cursed figures, or beings from another world. Some versions name a leader. Others leave the leader uncertain. What matters first is the movement. Something passes overhead, and ordinary people are not meant to follow it.`,
      `The image is older than any single modern version.

Across regions, the Wild Hunt changes its shape. In some stories it is linked with Odin. In others, it belongs to Herne, spectral hunters, fairy hosts, or the restless dead. The names shift, but the feeling stays close. A hidden company rides through the night.`,
      `The hunt is often treated as an omen.

Hearing it may warn of death, disaster, war, or a dangerous season. The sky becomes more than weather. It becomes a road for forces that humans can hear but cannot control. That is why the legend feels both vast and intimate.`,
      `There is also a warning inside the story.

If the hunt passes, a person should stay out of its path. Some tales say witnesses may be taken. Others say they may be forced to join. The danger is not always violent in a direct way. It is the danger of being pulled into a world that does not explain itself.`,
      `Winter gives the legend much of its force.

Cold wind already sounds alive. Branches move, animals call, and storms make the sky feel crowded. The Wild Hunt turns those sounds into a story. It gives shape to the fear that something unseen is moving quickly through the dark.`,
      `The story also carries a memory of older belief.

It gathers ideas about the dead, seasonal change, divine riders, night travel, and the boundary between human homes and the open world. That mixture makes the Wild Hunt hard to reduce to one meaning. It is not only a ghost story, and not only a myth.`,
      `Later retellings often make the hunt more organized.

Fantasy stories may turn it into an army, a named supernatural force, or a formal procession with fixed rules. Those versions keep the image alive, but they can make the older regional variety seem simpler than it was.`,
      `The strongest versions leave some distance.

The rider is not always named. The road through the sky is not mapped. The listener hears horns and hounds, then has to decide what the passing sound means. That uncertainty belongs to the legend. It keeps the hunt moving beyond any single explanation.`,
      `In the end, the Wild Hunt remains frightening because it never stops for us.

It crosses the storm, gathers its riders, and disappears into the night. The witness is left below, listening to the wind. The question is not only what passed overhead. It is why the sky suddenly felt like a road for the dead.`
    ],
    shortsScript: [
      `At night, people hear horns above the storm.`,
      `Then come hoofbeats, hounds, and riders in the sky.`,
      `In folklore, this is the Wild Hunt.`,
      `Seeing it could mean death, disaster, or a dangerous season.`,
      `The storm passes, but the sound stays behind.`
    ],
    visualGuide: [
      {
        sceneRole: 'Hook',
        sceneFocus: 'Open with horns and hoofbeats moving through a storm sky.',
        aiImagePrompt: 'A winter night sky churns with storm clouds above a dark European landscape, while faint spectral riders begin to appear along the cloud line. The scene is cold, realistic, and atmospheric, with blue-gray light, distant mist, and no modern roads or vehicles.',
        directionTip: 'Open with horns and hoofbeats moving through a storm sky.',
        visualDirection: 'Start on the storm clouds. Hold for two seconds. Slowly pan upward as the first riders become visible.'
      },
      {
        sceneRole: 'Core Story',
        sceneFocus: 'Show the supernatural hunting host crossing the night.',
        aiImagePrompt: 'Ghostly riders and shadowed hounds cross a windswept night sky, their shapes half-hidden by cloud and rain. The composition feels like old European folklore made realistic, with muted colors, harsh winter wind, and restrained cinematic lighting.',
        directionTip: 'Show the supernatural hunting host crossing the night.',
        visualDirection: 'Track the riders from left to right. Keep the hounds low in the frame. Fade as the procession moves past.'
      },
      {
        sceneRole: 'Variant',
        sceneFocus: 'Present regional leaders and forms without making one version final.',
        aiImagePrompt: 'An old hall lit by firelight shows carved figures of riders, hounds, antlers, and storm clouds on aged wood and stone. The image suggests many regional versions of the Wild Hunt without naming one as the only form.',
        directionTip: 'Present regional leaders and forms without making one version final.',
        visualDirection: 'Begin with a wide view of the hall. Pan across the carved figures. Pause on the riders before cutting back to the sky.'
      },
      {
        sceneRole: 'Interpretation',
        sceneFocus: 'Connect winter weather with the feeling of an unseen procession.',
        aiImagePrompt: 'A bare winter forest bends under strong wind while dark clouds race overhead, and distant rider silhouettes seem almost hidden inside the storm. The scene feels cold, folkloric, and believable, with natural textures and low-saturation blue-gray color.',
        directionTip: 'Connect winter weather with the feeling of an unseen procession.',
        visualDirection: 'Hold the forest still at first. Add a slow push toward the moving clouds. Cut after the narration mentions the unseen force.'
      },
      {
        sceneRole: 'Closing',
        sceneFocus: 'Leave the hunt disappearing beyond the witness.',
        aiImagePrompt: 'The storm begins to clear over a dark ridge as the last spectral riders vanish into distant clouds. A small human figure stands far below, almost swallowed by the landscape, with cold moonlight and a quiet unresolved mood.',
        directionTip: 'Leave the hunt disappearing beyond the witness.',
        visualDirection: 'Start wide with the witness below. Let the riders fade into cloud. Hold the empty sky, then fade to black.'
      }
    ],
    longformAdditions: [
      'The sound is usually described before the riders are seen. That order matters because the imagination has already begun working before the sky reveals anything.',
      'A host can feel larger than a single ghost. It suggests order, pursuit, and movement, as if the night has opened for a force older than the witness.',
      'This is why one tidy origin never feels enough. The legend survives because it can carry different names while keeping the same storm-lit shape.',
      'The omen also gives the weather a moral charge. A storm is no longer just a storm when people believe a warning is riding inside it.',
      'The fear is strongest when the listener stays small. They are not the hero of the event. They are someone who happened to hear it pass.',
      'In that sense, the legend begins with real sensations. Wind, thunder, animal cries, and darkness become the raw material for a supernatural procession.',
      'Those older layers make the Wild Hunt feel crowded. It can hold gods, the dead, hunters, punishments, seasons, and local fears at the same time.',
      'Modern versions are often sharper and easier to recognize. Older versions can feel stranger because their boundaries are less fixed.',
      'That distance keeps the hunt alive. It is remembered as a passing force, not as a solved creature with a single rulebook.',
      'The sky returns to silence, but the silence does not feel the same. The listener has heard movement where no ordinary road exists.'
    ]
  },
  'shambhala-hidden-kingdom-youtube-script': {
    longformScript: [
      `Shambhala begins as a place that cannot be reached by ordinary travel.

It is spoken of as a hidden kingdom, connected with Buddhist tradition, sacred geography, and prophecy. The first image is not a treasure map. It is a mountain world where distance, devotion, and meaning are tied together.`,
      `In many later imaginations, Shambhala becomes a lost paradise.

That version is easy to picture. A valley hidden behind snow peaks. A peaceful kingdom beyond the last pass. A place untouched by ordinary history. But the older idea is more careful than a simple adventure story.`,
      `Shambhala is not only a location.

It is also a symbol. It can suggest sacred order, preserved teaching, and a world that remains hidden until the right time. The hiddenness matters. It is not just a puzzle for explorers. It is part of what gives the tradition its meaning.`,
      `The name is often connected with Kalachakra contexts.

In those traditions, Shambhala may be tied to rulers, teachings, and future events. The story moves between geography and spiritual imagination. That is why it should not be flattened into a simple lost city somewhere on a modern map.`,
      `Still, the landscape matters.

The mind sees mountain passes, white peaks, hidden valleys, distant monasteries, and manuscripts preserved in quiet rooms. These images help carry the idea. They make Shambhala feel distant, but not empty. The place feels hidden because it is also protected.`,
      `Western writing changed the story again.

Some later accounts pulled Shambhala toward lost-world fantasy. Others blended it with the idea of Shangri-La or with older dreams of a perfect hidden valley. Those comparisons are understandable, but they are not the same history.`,
      `That difference is important.

Shambhala can inspire stories about hidden places, but it also belongs to religious and cultural traditions that deserve care. If every hidden valley becomes Shambhala, the name loses its depth. The mystery becomes smaller, not larger.`,
      `The strongest way to approach Shambhala is to keep its layers visible.

There is the sacred tradition. There is the imagined geography. There are later Western interpretations. Each layer adds something, but none of them should erase the others. The story becomes clearer when they remain distinct.`,
      `That is why Shambhala still feels powerful.

It is not only the promise of a secret kingdom. It is the feeling that some places cannot be found by force. A map may point toward mountains, but the meaning of the place belongs to a different kind of journey.`,
      `In the end, Shambhala remains hidden in more than one sense.

It is hidden behind mountains, behind texts, and behind the limits of ordinary searching. The question is not simply where it is. The deeper question is why people keep imagining a kingdom that can only be approached with reverence.`
    ],
    shortsScript: [
      `Shambhala is not just a lost kingdom.`,
      `It belongs to Buddhist tradition and sacred geography.`,
      `Later stories turned it into a hidden paradise.`,
      `But the older idea is deeper than a map mystery.`,
      `Some places are hidden because meaning protects them.`
    ],
    visualGuide: [
      {
        sceneRole: 'Hook',
        sceneFocus: 'Open with a mountain pass that feels impossible to cross.',
        aiImagePrompt: 'A narrow mountain pass rises between snow-covered peaks, with a hidden valley barely visible through mist beyond the ridge. The scene feels cold, contemplative, and realistic, with soft dawn light, muted blue and gold tones, and no adventure-fantasy exaggeration.',
        directionTip: 'Open with a mountain pass that feels impossible to cross.',
        visualDirection: 'Hold the mountain pass for two seconds. Slowly reveal the valley through the mist. Fade before the place becomes fully clear.'
      },
      {
        sceneRole: 'Background',
        sceneFocus: 'Connect Shambhala with Buddhist imagery and sacred geography.',
        aiImagePrompt: 'A quiet monastery room holds Buddhist manuscripts, a painted mandala, and soft lamplight, with distant mountains visible through a small window. The image is respectful and grounded, with realistic textures, warm muted gold, and calm shadows.',
        directionTip: 'Connect Shambhala with Buddhist imagery and sacred geography.',
        visualDirection: 'Begin on the manuscript pages. Push in slowly toward the mandala. Cut gently as the narration moves from place to symbol.'
      },
      {
        sceneRole: 'Interpretation',
        sceneFocus: 'Show that hiddenness is part of the meaning, not just a puzzle.',
        aiImagePrompt: 'A hidden Himalayan-style valley rests beyond layered ridges, with a distant monastery roof partly obscured by cloud. The place feels protected and quiet, using cold wind, pale sunlight, and a restrained documentary mood.',
        directionTip: 'Show that hiddenness is part of the meaning, not just a puzzle.',
        visualDirection: 'Start wide over the ridges. Slowly push toward the hidden monastery roof. Hold before the valley is fully revealed.'
      },
      {
        sceneRole: 'Source Context',
        sceneFocus: 'Separate sacred tradition from later Western lost-world fantasy.',
        aiImagePrompt: 'An archive table shows a Buddhist manuscript, a mountain map, and later travel notes placed apart from one another under soft desk light. The layers of tradition and later interpretation remain visually distinct, with no readable fake text.',
        directionTip: 'Separate sacred tradition from later Western lost-world fantasy.',
        visualDirection: 'Pan from the manuscript to the map, then to the later notes. Keep each layer visually separate before fading.'
      },
      {
        sceneRole: 'Closing',
        sceneFocus: 'End with Shambhala as a place approached through reverence, not force.',
        aiImagePrompt: 'A distant monastery bell tower stands against snowy mountains at dusk, with prayer flags moving lightly in cold wind and a hidden valley fading into blue shadow. The scene feels quiet, respectful, and unresolved.',
        directionTip: 'End with Shambhala as a place approached through reverence, not force.',
        visualDirection: 'Hold the distant monastery. Add a slow zoom toward the prayer flags. Fade to black after the final question.'
      }
    ],
    longformAdditions: [
      'The mountains are not only scenery. They make the boundary between the ordinary world and the hidden kingdom feel physical.',
      'That simpler image can be beautiful, but it can also erase the religious weight behind the name. Shambhala becomes easier to consume and harder to understand.',
      'The idea asks for patience. A hidden kingdom in this sense is not merely concealed; it is set apart by meaning.',
      'Kalachakra gives the story a different scale. The kingdom is connected not only with distance, but with time, teaching, and order.',
      'That is why the visual world should remain quiet. Snow, manuscript pages, bells, and mountain wind can carry more force than spectacle.',
      'Shangri-La belongs to a modern literary history. Shambhala belongs to older and more complex traditions, even when later writers blur the names together.',
      'Care does not remove the mystery. It makes the mystery larger because the name keeps its cultural and spiritual weight.',
      'When the layers stay visible, the story breathes. It becomes possible to feel both the imagined landscape and the tradition behind it.',
      'The hidden place remains compelling because it resists possession. It cannot simply be reached, photographed, and explained away.',
      'That is the quiet power of the legend. It lets a place remain distant without making distance feel empty.'
    ]
  }
};

for (const script of scripts) {
  const update = updates[script.slug];
  if (!update) continue;
  script.longformScript = update.longformScript.map((part, index) => [
    part,
    update.longformAdditions?.[index]
  ].filter(Boolean).join('\n\n'));
  script.shortsScript = update.shortsScript;
  script.visualGuide = update.visualGuide;
  script.imagePrompts = update.visualGuide.map((item) => item.aiImagePrompt);
  script.runtimePlan = buildRuntimePlan(script.longformScript, script.estimatedVideoLength);
}

fs.writeFileSync(scriptsPath, `${JSON.stringify(scripts, null, 2)}\n`);

function buildRuntimePlan(longformScript, estimatedVideoLength) {
  const readSeconds = estimatedNarrationSeconds(longformScript);
  const finalSeconds = finalSecondsForRange(estimatedVideoLength, readSeconds);
  const visualSeconds = Math.max(0, finalSeconds - readSeconds);
  return {
    narrationReadTime: formatDuration(readSeconds),
    plannedTransitionAndVisualTime: formatDuration(visualSeconds),
    estimatedFinalRuntime: estimatedVideoLength,
    estimatedFinalSeconds: finalSeconds
  };
}

function estimatedNarrationSeconds(parts) {
  const wordCount = parts.join(' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.round(wordCount / 2.35);
}

function finalSecondsForRange(range, readSeconds) {
  const match = String(range || '').match(/(\d+)\s*-\s*(\d+)\s*minutes?/i);
  if (!match) return Math.max(300, Math.min(600, Math.round(readSeconds / 0.82)));
  const min = Number(match[1]) * 60;
  const max = Number(match[2]) * 60;
  return Math.max(min, Math.min(max, Math.round(readSeconds / 0.82)));
}

function formatDuration(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (!min) return `${sec} sec`;
  return `${min} min ${sec} sec`;
}
