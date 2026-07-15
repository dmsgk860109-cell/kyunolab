# Kyunolab Creator Library Mode

Creator Library is not only a script storage area.

Creator Library is a production library for helping a creator make one complete video from beginning to end.

Stories are for reading.

Creator Library materials are for making.

The goal is not to explain information for a general reader. The goal is to support actual content production for a video creator.

## Core Purpose

Every Creator Library page should help a creator move from an idea to a usable video asset.

The user should be able to follow the page from top to bottom and understand what to do next without needing to make many separate planning decisions.

Creator Library should prioritize practical outputs over explanation.

Useful Creator Library outputs may include:

- longform narration script
- Shorts script
- scene plan
- hook options
- image prompts
- thumbnail ideas
- subtitle lines
- voiceover pacing notes
- production checklist
- source or story reference notes

## Generation Standard

All Creator Library content should follow these priorities:

1. A beginner should be able to follow it easily.
2. The page should support the full workflow for making one video.
3. Practical production assets come before background explanation.
4. The user should not need to make many extra decisions before starting.
5. Every section should connect to the real order of video production.

Creator Library should not feel like a converted story page.

It should feel like a video production package built from story analysis.

## Result-First Content Principle

Creator Library is not an explanation page.

Creator Library is a production library for helping creators make usable content.

Whenever possible, generate a usable production asset instead of an explanatory description.

Prefer copy-ready outputs over background explanation:

- image generation prompts instead of image descriptions
- video generation prompts instead of video descriptions
- sound effect generation or search prompts instead of sound effect explanations
- music generation or search prompts instead of mood descriptions
- narration, hook, subtitle, thumbnail, and checklist text that can be copied and used directly

Creator Library pages should be built for copying and using, not only for reading.

This principle changes content generation standards only. It does not change UI design, URL structure, data model, canonical paths, or sitemap policy.

## Page Composition

Each Creator Library page adapts one archive story into one complete video production page.

Do not create separate Creator Library pages for long-form and short-form versions of the same archive story.

One archive story should have one Creator Library page.

Each page should contain all information needed to make the video from beginning to end.

The default Creator Library page structure follows four internal areas:

1. Story
2. Prepare
3. Create
4. Finish

These area names are internal structure rules, not required visible headings.

Story contains Story Summary and Story Information. This area helps the creator understand the story quickly before making a video. Do not include production instructions in Story.

Prepare contains Narration Guide and Production Workflow. Put production flow, narration guidance, and beginner preparation notes here rather than inside individual Scenes.

Create contains Long-form Creator and Short-form Creator. All Scenes belong to Create. This area should provide production-ready outputs rather than explaining how the page works.

Finish contains post-production reference material such as Usage Note, Original Story, related script references, or source/reference links already supported by the current page.

Story Summary and Story Information are shared context for both long-form and short-form production. Do not repeat the same story context separately inside both creator sections.

Long-form Creator and Short-form Creator should be independent production guides on the same page. They use the same original story, but each should follow the needs of its platform.

Do not treat the short-form version as a simple shortened copy of the long-form version. Short-form material should be usable as a complete content piece.

## Output Structure

Creator Library output is organized by Scene.

Scene is the smallest production unit for a video.

Page-level sections may explain workflow, narration preparation, and how to use the creator materials. Scenes should not explain workflow, tools, platforms, services, costs, installation, direct recording methods, or production philosophy.

Scenes should contain only production information needed to make that video moment, such as Narration, Scene Focus, Image Prompt, Recommended Background Music, Visual Direction, and optional Advanced Production information.

Do not output Hook, Narration, Scene, Image Prompt, Motion Prompt, Sound, Music, or similar production materials as isolated top-level sections when they belong to the same moment in the video.

All materials needed for the same video moment should stay inside the same Scene.

The intended reading and production flow is:

1. produce Scene 1
2. produce Scene 2
3. produce Scene 3
4. finish the video

## Basic Scene Production Guide

Each Scene should be a practical production unit, not an explanatory block.

A creator should be able to read one Scene from top to bottom and make that exact video moment with basic tools such as GPT and CapCut.

Every Scene should use this default order:

1. Scene number
2. Estimated playback time
3. Narration
4. Scene Focus
5. Image Prompt
6. Recommended Background Music
7. Visual Direction

Narration should be a finished spoken voiceover script that can be used directly in the video. It should feel like a calm documentary or mystery-channel narration, not like an article, report, or academic explanation.

Write Narration as speech. Prefer short sentences, active phrasing, and natural transitions. Aim for a tone between documentary and storytelling: clear, calm, and human, without becoming too casual or too formal.

Keep one idea in one sentence whenever possible. Favor natural sentences of about 8-15 words, avoid overloaded clauses, and do not rely on long relative clauses or stiff passive phrasing.

Use short paragraph breaks as breathing points when useful. Line breaks are part of the spoken script structure, not decoration.

Long-form Narration should unfold like a video: hook, situation, strange detail, question, and a natural bridge toward the next Scene. It should not increase length by repeating the same explanation.

Short-form Narration should cut background details quickly. The first line should create immediate interest, and each line should move toward the core idea.

Avoid blog style, academic style, GPT-like repeated connectors, exaggerated acting, forced horror, clickbait phrasing, and emotional pressure. Narration should work for both AI voice generation and a human reader without being tailored to a specific service or recording method.

Long-form Narration should be displayed as small Narration Parts inside each Scene. A Narration Part is a production script unit, not a new Scene. Each Part should contain one natural meaning unit, usually about 2-4 short sentences or 8-15 seconds of spoken audio.

Each Narration Part should include a one-line Purpose above the narration, plus Estimated Reading Time and Voice Direction below the narration. Purpose explains the role of the part for the creator, not a line for viewers. Voice Direction should help both AI voice generation and human reading without mentioning services or recording methods.

Short-form Narration should not use Narration Parts unless a Short-form Scene becomes unusually long, roughly 20 seconds or more.

Scene Focus should be a one-line production summary of what the Scene needs to show. It is not an image generation prompt. It helps the creator understand the visual moment quickly.

Image Prompt should be a complete general-purpose image generation prompt. Prioritize story mood, scene emotion, background, lighting, composition, and visible action over rigid subject matching.

Recommended Background Music should provide mood, genre, and search keywords rather than recommending a specific track. Useful examples include Dark Ambient, Suspense Piano, Low Drone, and Mystery Atmosphere.

Visual Direction should describe how the Scene should appear on screen. Prefer simple camera and screen-flow instructions such as start with a wide shot, slowly zoom toward the subject, hold for two seconds, fade to black, or cut cleanly on the final word. Avoid specialist editing language when a simple instruction is enough.

Do not expose Motion Prompt, sound effects, or advanced production information in the basic Scene guide.

## Optional Advanced Scene Information

Each Scene may include a collapsed optional advanced production area below the basic Scene guide.

The page must show only the basic beginner-friendly production information when it first loads.

Advanced production information should be hidden by default behind a keyboard-accessible button labeled "Show Advanced Production Info".

Each Scene should control its own advanced information independently. Opening one Scene must not open or close another Scene.

Advanced information may include:

1. Motion Prompt
2. Sound Effect
3. Voice Direction
4. Camera and Motion Notes
5. Transition and Color Notes
6. Negative Prompt

Motion Prompt should be a general-purpose English prompt for turning the still image into a moving shot. Do not use syntax tied to a specific video generation service.

Sound Effect should provide effect types and search keywords only. Do not recommend a specific paid service or force sound effects into scenes that do not need them.

Voice Direction should explain how to read the narration, including tone, speed, emotional intensity, pauses, emphasis, and pronunciation only when useful. Do not use service-specific TTS settings.

Camera and Motion Notes should give simple camera movement guidance with short plain-English explanations for terms such as slow push-in, subtle handheld movement, gentle pan, static frame with slight zoom, or focus shift.

Transition and Color Notes should give simple transition and color mood guidance without technical color grading values.

Negative Prompt should appear only when there are clear generation risks to avoid. Do not create an empty or forced Negative Prompt for every Scene.

## Narration Guide

Creator Library detail pages should include one shared Narration Guide after Story Information and before Long-form Creator.

The guide helps beginners finish the narration step without requiring a specific TTS service, paid tool, voice API, upload workflow, or microphone recording feature.

It should include story-aware voice direction, general search terms for finding narration tools, and a practical phone recording alternative.

Do not recommend a specific TTS site, affiliate link, paid service, or internal voice generation feature.

Long-form Creator and Short-form Creator should each include a button that copies only that format's Scene Narration text.

The full narration copy output should be assembled from the visible Scene Narration fields, not stored as separate duplicate content.

The copied text must contain only the script to read, with blank lines between Scenes. Do not include Scene numbers, labels, image prompts, music notes, editing guides, or advanced production details.

## Production Workflow

Creator Library detail pages should include one shared Production Workflow after Narration Guide and before Long-form Creator.

The workflow is a simple beginner-facing sequence that explains what to do first, what to do next, and how to finish one video.

Keep it short and vertical. Prefer one readable line per step over long explanations or a grid of separate cards.

The workflow should guide the creator through reading the Story Summary, choosing Long-form or Short-form, reading Scene Narration, creating images from Image Prompt, choosing music from search keywords, preparing voice with the Narration Guide, editing Scenes in order, and finishing the video.

The workflow may include one small tip that reminds the creator that the first video does not need to be perfect. Do not make it sound like an advertisement or a motivational banner.

Do not add checklist state, progress saving, login, tutorial videos, external links, ads, or any new category for this workflow.

## Relationship to Stories

Creator Library is separate from the story archive.

Kyunolab Stories are original reading records or source-aware archive articles.

Creator Library analyzes those stories, motifs, and archive structures, then reorganizes them into creator-facing production material.

Do not treat Creator Library as a simple story-to-script converter.

The purpose is to adapt archive material into a usable production sequence:

1. understand the story or motif
2. choose the video angle
3. structure the narration
4. prepare visual prompts
5. prepare Shorts hooks
6. prepare thumbnail ideas
7. give the creator enough material to start producing

## Current Scope

This document preserves the Creator Library purpose and Scene-based output structure.

The current content generation principle is result-first: prefer copy-ready production assets over explanation whenever possible.

This does not change the UI design, URL structure, data model, copy buttons, canonical paths, or sitemap policy.

Future Creator Library improvements should use this philosophy as the baseline while preserving existing URLs and published materials unless a separate migration task says otherwise.
