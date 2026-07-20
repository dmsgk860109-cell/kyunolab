const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const scriptsPath = path.join(root, 'data', 'scripts.json');
const scripts = JSON.parse(fs.readFileSync(scriptsPath, 'utf8'));
const index = scripts.findIndex((script) => script.slug === 'resurrection-mary-legend-youtube-script');

if (index === -1) {
  throw new Error('Resurrection Mary Creator Pack was not found.');
}

const longformScript = [
  `Resurrection Mary begins with a road.\n\nNot a castle. Not an ancient battlefield. Just Archer Avenue, outside Chicago, where a young woman is said to appear near the roadside after dark. That ordinary setting is what makes the story feel close enough to imagine.`,
  `In the most familiar version, she looks ordinary at first.\n\nShe is dressed as if she has come from a dance. A driver sees her, stops, and lets her into the car. For a moment, the story feels almost normal. It begins like a small act of kindness on a lonely road.`,
  `Then the ride changes.\n\nThe car approaches Resurrection Cemetery, and the passenger is no longer there. The seat is empty. The destination has arrived, but the person has not. Nothing violent has to happen for the scene to become impossible. The silence after the disappearance is the part people remember.`,
  `That is the shape that makes the legend last.\n\nThe story does not need a long explanation. A road, a passenger, and a disappearance are enough to turn a short ride into something people keep retelling. The missing ending does more work than any dramatic reveal could do.`,
  `Some versions begin at a ballroom or dance hall.\n\nMary has been dancing, or seems to have come from somewhere nearby. The detail matters because it makes her feel less like a shadow and more like a person with a life interrupted. A dance suggests music, company, and a night that should have ended safely.`,
  `Other versions begin with her walking along the road.\n\nThe driver does not always meet her in the same way. Her clothing, the exact route, and the moment she disappears can change from one retelling to another. Those changes show how the legend moves between local memory and familiar folklore.`,
  `The cemetery is the part that gives the story its local weight.\n\nResurrection Cemetery is not just a vague haunted place in the background. It gives the legend a name, a landmark, and a point where the ride cannot continue normally. The road and the cemetery make the story feel mapped, even when the answer is not.`,
  `At the same time, the source trail has limits.\n\nPublic references and local retellings help trace the legend, but they do not prove every later detail. Some claims belong to folklore, some to memory, and some to attempts to identify Mary as a specific person. The careful version keeps those layers separate.`,
  `That uncertainty is part of the story's power.\n\nResurrection Mary belongs to the wider vanishing-hitchhiker tradition, but the Chicago setting gives it a stronger shape. The road feels real. The cemetery feels fixed. The passenger remains unfinished. She is both a local figure and a version of an older pattern.`,
  `In the end, the legend keeps returning to the same quiet question.\n\nWas Mary a ghost with a name, a local version of an older motif, or a story that found the perfect road to travel? The car moves on, but the passenger never fully leaves. That is why the road still feels like part of the story, and why each retelling begins again with someone noticing a woman beside the dark road.`
];

scripts[index] = {
  ...scripts[index],
  estimatedVideoLength: '5-6 minutes',
  deck: 'Resurrection Mary Legend is prepared as a creator-ready production workspace based on the Chicago vanishing-hitchhiker archive record, with scene-specific narration, image prompts, music keywords, and editing notes.',
  logline: 'Resurrection Mary is a Chicago-area vanishing-hitchhiker legend tied to Archer Avenue, a dance hall tradition, and Resurrection Cemetery.',
  longformScript,
  shortsScript: [
    `A driver sees a young woman near Archer Avenue after dark.`,
    `She looks like she has come from a dance.`,
    `He gives her a ride toward Resurrection Cemetery.`,
    `Then the passenger seat is empty.`,
    `That is why Resurrection Mary keeps returning to the road.`
  ],
  imagePrompts: [
    `A quiet nighttime view of Archer Avenue outside Chicago, with an empty road stretching past trees and distant streetlights. A young woman in pale dance clothes stands near the roadside, realistic documentary texture, restrained and uncanny mood, muted colors, no gore or exaggerated horror.`,
    `The inside of an older car at night, seen from the back seat, with the passenger side visible and the road lights passing outside the window. The mood is calm but tense, focused on the idea of an ordinary ride becoming strange, realistic low-light photography style.`,
    `A vintage dance hall memory scene, with soft archival lighting, polished floor reflections, and a young woman suggested near the edge of the frame. The image should feel like remembered local folklore rather than a staged ghost scene, with subdued color and realistic period detail.`,
    `Resurrection Cemetery gates at night under streetlights, with iron bars, wet pavement, and a quiet roadside atmosphere. The frame should make the cemetery feel like a real local landmark connected to the legend, with documentary realism and low-key lighting.`,
    `An archive desk with a Chicago-area map, notes about Archer Avenue, cemetery references, and clipped local legend material arranged under a warm lamp. The image should separate folklore, location, and uncertain identity claims without showing any fabricated official document.`
  ],
  visualGuide: [
    {
      sceneFocus: 'Introduce Resurrection Mary through Archer Avenue as a specific Chicago road legend.',
      directionTip: 'Introduce Resurrection Mary through Archer Avenue as a specific Chicago road legend.',
      aiImagePrompt: `A quiet nighttime view of Archer Avenue outside Chicago, with an empty road stretching past trees and distant streetlights. A young woman in pale dance clothes stands near the roadside, realistic documentary texture, restrained and uncanny mood, muted colors, no gore or exaggerated horror.`,
      visualDirection: 'Hold the empty road for two seconds. Begin a slow push toward the roadside figure. Fade before the narration turns to the driver.'
    },
    {
      sceneFocus: 'Explain the ride-and-disappearance sequence without adding new events.',
      directionTip: 'Explain the ride-and-disappearance sequence without adding new events.',
      aiImagePrompt: `The inside of an older car at night, seen from the back seat, with the passenger side visible and the road lights passing outside the window. The mood is calm but tense, focused on the idea of an ordinary ride becoming strange, realistic low-light photography style.`,
      visualDirection: 'Start inside the car. Keep the passenger seat visible. Use a slow zoom, then cut after the line about the empty seat.'
    },
    {
      sceneFocus: 'Compare the dance-hall and roadside versions of the legend.',
      directionTip: 'Compare the dance-hall and roadside versions of the legend.',
      aiImagePrompt: `A vintage dance hall memory scene, with soft archival lighting, polished floor reflections, and a young woman suggested near the edge of the frame. The image should feel like remembered local folklore rather than a staged ghost scene, with subdued color and realistic period detail.`,
      visualDirection: 'Pan slowly across the dance hall image. Pause at the edge of the frame, then fade into the road version.'
    },
    {
      sceneFocus: 'Separate Resurrection Cemetery as a known location from later identity claims.',
      directionTip: 'Separate Resurrection Cemetery as a known location from later identity claims.',
      aiImagePrompt: `Resurrection Cemetery gates at night under streetlights, with iron bars, wet pavement, and a quiet roadside atmosphere. The frame should make the cemetery feel like a real local landmark connected to the legend, with documentary realism and low-key lighting.`,
      visualDirection: 'Hold the cemetery gates in a steady frame. Add a gentle push-in while the narration explains source limits.'
    },
    {
      sceneFocus: 'End with the unresolved identity and the vanishing-hitchhiker motif.',
      directionTip: 'End with the unresolved identity and the vanishing-hitchhiker motif.',
      aiImagePrompt: `An archive desk with a Chicago-area map, notes about Archer Avenue, cemetery references, and clipped local legend material arranged under a warm lamp. The image should separate folklore, location, and uncertain identity claims without showing any fabricated official document.`,
      visualDirection: 'Trace the map slowly from the road toward the cemetery. Hold two seconds after the final question, then fade to black.'
    }
  ],
  runtimePlan: {
    narrationReadTime: '3 min 46 sec',
    plannedTransitionAndVisualTime: '1 min 12 sec',
    estimatedFinalRuntime: '5-6 minutes',
    estimatedFinalSeconds: 300
  },
  updatedAt: '2026-07-20'
};

fs.writeFileSync(scriptsPath, `${JSON.stringify(scripts, null, 2)}\n`);
console.log('Updated resurrection-mary-legend-youtube-script.');
