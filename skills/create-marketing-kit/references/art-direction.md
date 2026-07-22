# Human-centered art direction

Use this reference for generated or commissioned campaign artwork. The goal is a recognizable campaign system, not a collection of unrelated attractive images.

## Required aesthetic checkpoint

Before generating or composing artwork, ask the user what vibe or aesthetic they want. Skip the question only when they already specified a direction or supplied a clear visual reference. If they are unsure, derive two or three distinct options from the verified product and audience, such as:

- warm editorial documentary — credible and human, with quieter visual impact;
- bold graphic collage — energetic and social-first, with less literal product context;
- cinematic crafted realism — premium and memorable, with more production weight.

Explain each option's tradeoff in one line and ask the user to choose. Record the answer in the campaign README and use it as an approval constraint. Continue the truth audit or deliverable inventory while waiting, but do not generate final artwork until the direction is approved.

## Translate references without copying

When the user supplies an image, page, or competitor as inspiration, document:

- composition: where the subject, copy zone, and product proof sit;
- energy: quiet, playful, urgent, editorial, or cinematic;
- palette and contrast;
- medium: photography, collage, 3D, ink, grain, or flat illustration;
- human presence: age range, posture, gaze, grouping, and activity;
- distinctive elements that must **not** be copied.

Use those observations as constraints for an original scene. Do not reproduce a recognizable character, logo, signature layout, or branded prop.

## Human scene checklist

Describe people as participants, not decoration:

- credible adults appropriate to the audience;
- a specific environment with useful, lived-in detail;
- clear activity and interaction with the campaign idea;
- varied posture and expression rather than identical smiling poses;
- natural hands, limb count, joints, gaze, and object contact;
- inclusive representation without tokenized staging;
- clothing and props that fit the setting rather than generic “startup” shorthand.

Ask for clean silhouettes and avoid crowded overlaps around hands. During inspection, reject extra fingers, fused objects, impossible reflections, unreadable props, or duplicate faces.

## Visual metaphor

Choose one metaphor that makes the product change visible. Examples include scattered material becoming an organized path, a private studio turning fragments into a finished artifact, or a person moving from passive browsing to deliberate making. Keep the metaphor subordinate to the human scene.

## Composition for deterministic copy

Generate the base artwork without marketing text, product logos, or fake UI. Reserve a low-detail copy zone with sufficient tonal consistency. Add exact elements later:

- campaign promise and supporting copy;
- real logo or wordmark;
- real product screenshots or UI components;
- CTA, legal language, badges, and release qualifiers.

Use editable SVG, HTML/CSS, or native composition for these elements. Do not ask an image model to typeset critical copy.

## Format planning

Compose each ratio intentionally:

| Role | Dimensions | Typical safe area |
| --- | ---: | --- |
| Landscape hero | 1600×900 | Keep copy and face details away from outer 8% |
| Portrait feed | 1080×1350 | Reserve top or lower third for copy |
| Story/reel cover | 1080×1920 | Keep critical content inside central 1080×1420 |

Use a shared subject, palette, lighting, and metaphor across formats. A crop is acceptable only when the face, hands, focal action, and copy zone all survive.

## Prompt skeleton

Structure generation prompts in this order:

1. asset role and output ratio;
2. original scene and human activity;
3. campaign metaphor;
4. composition and negative-space location;
5. medium, lighting, palette, and texture;
6. anatomy and realism constraints;
7. exclusions: no text, logos, fake UI, watermarks, or copied identifiers.

Save the exact prompt, tool or model, generation mode, and any reference-image notes in `prompts.md`.

## Integration hierarchy

Human editorial art answers “is this for someone like me?” Product captures answer “does this actually work?” Preserve both roles:

- lead with actual product proof on evaluation-heavy surfaces;
- use editorial art as a transition, story, or campaign banner;
- keep one major human artwork per viewport or section cluster;
- optimize a separate WebP for the website and retain the higher-quality source locally;
- write alt text that states the scene and its purpose without repeating visible copy.

Inspect final assets at full size and at intended display size. Check anatomy, hierarchy, text contrast, safe areas, compression artifacts, and whether the artwork still supports the campaign promise without the caption.
