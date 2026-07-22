# Skill Artwork Reference

Use this reference when creating `assets/skill-cards/<slug>.svg` or
`assets/skill-banners/<slug>.webp` for the Builder's Essential Skills collection.

## Contents

- [Visual language](#visual-language)
- [Scene and composition](#scene-and-composition)
- [Prompt template](#prompt-template)
- [SVG card specification](#svg-card-specification)
- [Raster workflow](#raster-workflow)
- [Review checklist](#review-checklist)

## Visual language

The collection's artwork is a dark, cinematic atelier: a quiet brutalist room
where an abstract physical object makes the skill's promise visible. It should
feel like a photographed installation, not a dashboard, poster template, SaaS
landing page, or generic AI illustration.

Keep these traits consistent:

- near-black stone, charcoal walls, and a grounded black tabletop;
- handmade paper, rough plaster, slate, brushed brass, or aged metal;
- warm cream or parchment as the main object material;
- restrained indigo-violet light as a recurring depth cue;
- soft museum lighting, deep shadows, subtle grain, and believable contact shadows;
- one strong physical metaphor, with small tactile details that reward inspection;
- thin, widely tracked cream typography integrated into the scene;
- generous negative space for the title and a short uppercase promise.

Use color as a signal, not decoration. Violet can suggest thought or depth,
brass can suggest decisions or craft, green can suggest growth, and amber can
suggest launch or energy. Keep the overall image dark and desaturated.

## Scene and composition

Translate the skill's core action into one physical metaphor before writing the
prompt. Examples:

| Skill action | Strong physical metaphor |
| --- | --- |
| Turn a goal into delivery | A measured ribbon path with tactile checkpoints |
| Research before building | Hanging paper decision cards and a brass ring |
| Validate demand | A forked stone path with one marked choice |
| Write plainly | A handmade paper page, pen, and torn drafts |
| Profile a session | Multiple channels feeding a set of illuminated timeline alcoves |
| Create a skill | A workbench assembling a blank skill card from paper, brass guides, and a lit doorway |

Prefer one hero object and one supporting structure. Avoid literal crowds,
characters, app windows, browser chrome, code screenshots, logos, floating
icons, busy collages, and more than one competing focal point.

Reserve a clean dark region for type. The title should be one line whenever
possible, begin with `/`, and use the exact skill slug. The subtitle should be
short, concrete, and uppercase with generous tracking. Use a left-aligned
title when the hero object is on the right; use right-aligned title only when
the scene clearly supports it.

Suggested copy format:

```text
/skill-slug
SHORT CONCRETE PROMISE IN UPPERCASE
```

Do not put instructional paragraphs, stage labels, URLs, badges, or additional
words in the image. The README and skill body carry that information.

## Prompt template

Use the built-in image-generation tool by default. Inspect at least two existing
`assets/skill-banners/*.webp` files first and mention their role as style
references. Normalize the prompt into this structure:

```text
Use case: stylized-concept
Asset type: wide repository skill banner
Primary request: Create a cinematic atelier artwork for the developer skill
  /<slug>, making its core promise visible as one physical installation.
Input images: attached or existing banners are style references only.
Scene/backdrop: dark brutalist gallery, black stone walls, grounded tabletop,
  and a single architectural depth cue.
Subject: <one physical metaphor for the skill's action>.
Style/medium: photorealistic high-end art direction, handcrafted installation,
  tactile materials, subtle film grain.
Composition/framing: wide 16:9 banner, title-safe negative space on the
  <left/right>, hero object on the opposite side, balanced asymmetry.
Lighting/mood: low-key museum lighting, warm spotlight, restrained
  indigo-violet accent, contemplative and precise.
Color palette: charcoal black, graphite, antique brass, parchment cream,
  muted indigo-violet.
Materials/textures: rough stone, handmade paper fibers, brushed metal,
  believable shadows and surface wear.
Text (verbatim): "/<slug>" and beneath it, "<SHORT PROMISE>".
Constraints: exact spelling, no other text, no logo, no watermark, no UI,
  no border, no neon colors, no people unless the skill requires them.
```

For image generation, keep the scene prompt specific but not overloaded. Name
the skill's metaphor, placement, materials, light, negative space, and exact
text. Do not ask the model to create a whole set of unrelated objects.

## SVG card specification

Create the required vector card even when a cinematic banner is also present.
Match the existing cards in `assets/skill-cards/`:

- `viewBox="0 0 1200 760"`;
- accessible `role="img"`, `aria-labelledby`, `<title>`, and `<desc>`;
- dark gradient background, rounded inset frame, subtle glow, and thin arc;
- small all-caps collection label with the next skill number;
- title, two-line description, line icon, divider, two metadata columns;
- a monospace invocation prompt and a completion mark;
- high contrast, restrained palette, and no unsupported external fonts or assets.

Use a metaphor-specific line icon, not a copied logo. Escape `&` as `&amp;` and
keep text inside the card's safe area. Render the SVG with a local preview tool
before handoff; visual inspection catches clipping and text overflow that XML
validation cannot.

## Raster workflow

1. Inspect references with the local image viewer and note composition, lighting,
   material, title placement, and ratio.
2. Generate one candidate with the built-in image tool. Include the reference
   image only as a style/composition reference, never as an edit target unless
   the user explicitly asks to edit it.
3. Check the exact title and subtitle, the metaphor, negative space, contrast,
   and absence of watermarks or stray lettering.
4. If one issue is wrong, make one targeted generation/edit pass. Do not change
   the whole prompt at once; this makes visual regressions hard to diagnose.
5. Save the final generated file inside the repository. Convert PNG to WebP
   with a high-quality encoder available on the machine, for example:

   ```bash
   cwebp -quiet -q 90 source.png -o assets/skill-banners/<slug>.webp
   ```

6. Inspect the WebP after conversion, not just the source. Confirm it has a
   wide banner ratio, readable text, no obvious compression damage, and a file
   size appropriate for a README image.
7. Link the banner from both `README.md` and `skills/<slug>/README.md`. Keep the
   SVG card path present and linked where the repository requires it.

If image generation is unavailable, do not invent a flat placeholder and call
it finished. Create the deterministic SVG card, report the missing raster
capability, and leave a precise prompt for the banner as a follow-up.

## Review checklist

Before declaring the artwork complete, confirm:

- [ ] The image communicates the skill without a paragraph of explanation.
- [ ] The scene belongs to the same dark atelier world as the other banners.
- [ ] The hero object is physical, tactile, and grounded by believable shadows.
- [ ] The title is exactly `/<slug>` and the subtitle is short, uppercase, and legible.
- [ ] There is no accidental extra text, watermark, logo, UI, or border.
- [ ] The title does not overlap the hero object or important scene detail.
- [ ] The SVG card validates as XML and renders without clipping.
- [ ] README links use the correct relative paths and alt text.
- [ ] The WebP is present, viewable, and included by `package.json`.
